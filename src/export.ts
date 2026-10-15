/**
 * Video export: everything about it that needs no DOM.
 *
 * The encode happens in Home Assistant, not here — a browser tab cannot
 * be trusted to stay open for minutes, and half the dashboards this card
 * runs on are a phone that locks. What the card owns is choosing *what*
 * to export: a stretch of the timeline, a frame rate, and whether the
 * readings go into the picture. This module is that choice as plain
 * functions, so the arithmetic is tested without mounting anything.
 *
 * A range is held as grid positions, the same unit the scrubber uses, so
 * "start here" is the playhead's own value and never a timestamp that has
 * to be snapped back onto the grid.
 */

import { type FrameIndex, slotAt } from "./frames";
import { overlayEntities } from "./overlay-groups";
import type { OverlayEntityConfig, WebcamTimelapseCardConfig } from "./types";

export type ExportState = "idle" | "running" | "done" | "failed" | "cancelled";

/** What the integration reports when a video has been written. */
export interface ExportResult {
  path: string;
  file_name: string;
  media_content_id: string;
  frames: number;
  skipped: number;
  fps: number;
  duration: number;
  width: number;
  height: number;
  size_bytes: number;
  start: number;
  end: number;
}

/** The `webcam_timelapse/export/subscribe` event payload. */
export interface ExportStatus {
  state: ExportState;
  done: number;
  total: number;
  /** Stable code for what went wrong — the key into this card's strings. */
  error: string | null;
  /** The integration's own wording, for a code this card does not know. */
  message: string | null;
  result: ExportResult | null;
  /**
   * Where this camera's videos are written, on the Home Assistant host.
   * Sent with every status, so the panel can say where exports go before
   * the first one exists.
   */
  folder?: string;
}

/** Inclusive grid positions. `start <= end` always. */
export interface ExportRange {
  start: number;
  end: number;
}

/** Offered frame rates. 24 is cinema's and the default. */
export const EXPORT_FPS = [12, 24, 30, 60] as const;
export const DEFAULT_EXPORT_FPS = 24;

/**
 * Where a readings block goes in the video. Left and right are the card's
 * own bottom corners; top and bottom centre the block on that edge.
 */
export type ExportPosition = "left" | "right" | "top" | "bottom";
export const EXPORT_POSITIONS: readonly ExportPosition[] = ["left", "right", "top", "bottom"];

/**
 * Overlay sizes, as a percentage of the video's width — the same bounds
 * the integration enforces. A third of the picture for the readings keeps
 * the frame the subject; the stamp only has to be legible.
 */
export const READINGS_SIZE = { min: 10, max: 80, step: 5, default: 30 } as const;
export const TIMESTAMP_SIZE = { min: 5, max: 50, step: 5, default: 15 } as const;

/** Quick ranges, in hours back from the newest frame. */
export const EXPORT_PRESETS = [24, 72, 168] as const;

/** The whole archive, or null when there is nothing in it. */
export function fullRange(index: FrameIndex): ExportRange | null {
  if (index.t0 === null || index.count === 0) return null;
  return { start: 0, end: index.count - 1 };
}

/** Pull a range back inside the archive, with its ends the right way round. */
export function clampRange(range: ExportRange, count: number): ExportRange {
  const last = Math.max(0, count - 1);
  const clamp = (value: number): number => Math.min(Math.max(Math.round(value), 0), last);
  const a = clamp(range.start);
  const b = clamp(range.end);
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

/**
 * Move the start to `position`.
 *
 * Marking a start beyond the current end does not swap the two — the user
 * said "start", and quietly turning that into an end is how a range ends
 * up being the opposite of what was pressed. The end is carried forward
 * to the same frame instead, which leaves an obviously-empty selection to
 * extend rather than a plausible-looking wrong one.
 */
export function withStart(range: ExportRange, position: number, count: number): ExportRange {
  const start = clampRange({ start: position, end: position }, count).start;
  return { start, end: Math.max(range.end, start) };
}

/** Move the end to `position`. Mirrors `withStart`. */
export function withEnd(range: ExportRange, position: number, count: number): ExportRange {
  const end = clampRange({ start: position, end: position }, count).end;
  return { start: Math.min(range.start, end), end };
}

/** The last `hours` of the archive, ending on its newest frame. */
export function lastHours(index: FrameIndex, hours: number): ExportRange | null {
  const full = fullRange(index);
  if (full === null) return null;
  const positions = Math.round((hours * 3600) / index.step);
  return { start: Math.max(0, full.end - positions), end: full.end };
}

/** Whether a preset would select anything short of the whole archive. */
export function presetFits(index: FrameIndex, hours: number): boolean {
  return index.count * index.step > hours * 3600;
}

/**
 * How many frames actually exist inside a range.
 *
 * Counted from the presence bitmap rather than taken as `end - start + 1`:
 * gaps are skipped in the video, so a range across a two-day outage is
 * far shorter than its width on the timeline suggests, and the length the
 * card promises has to be the length the file turns out to be.
 */
export function framesIn(present: Uint8Array, range: ExportRange): number {
  let frames = 0;
  const end = Math.min(range.end, present.length - 1);
  for (let i = Math.max(0, range.start); i <= end; i++) {
    if (present[i]) frames++;
  }
  return frames;
}

/** A range as the two epoch-second slots the integration is asked for. */
export function rangeSlots(
  index: FrameIndex,
  range: ExportRange,
): { start: number; end: number } | null {
  const start = slotAt(index, range.start);
  const end = slotAt(index, range.end);
  return start === null || end === null ? null : { start, end };
}

/** Where a range sits on the scrubber, as percentages of its width. */
export function rangeBand(range: ExportRange, count: number): { left: number; width: number } {
  const last = Math.max(1, count - 1);
  return {
    left: (range.start / last) * 100,
    width: ((range.end - range.start) / last) * 100,
  };
}

/** A running time: "8 s", "1:05 min", "1:02:03 h". */
export function formatLength(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0 s";
  if (seconds < 60) {
    // One decimal below ten seconds: at 24 fps a short export is a second
    // or two, and "1 s" and "2 s" would hide a factor of two.
    return seconds < 10
      ? `${(Math.round(seconds * 10) / 10).toString()} s`
      : `${Math.round(seconds)} s`;
  }
  const whole = Math.round(seconds);
  const pad = (value: number): string => String(value).padStart(2, "0");
  const minutes = Math.floor(whole / 60);
  if (minutes < 60) return `${minutes}:${pad(whole % 60)} min`;
  return `${Math.floor(minutes / 60)}:${pad(minutes % 60)}:${pad(whole % 60)} h`;
}

/** A file size in the unit a person would say it in. */
export function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  const megabytes = bytes / 1_000_000;
  if (megabytes >= 1000) return `${(megabytes / 1000).toFixed(1)} GB`;
  if (megabytes >= 10) return `${Math.round(megabytes)} MB`;
  return `${megabytes.toFixed(1)} MB`;
}

/** Progress as 0..1. Zero until the integration has counted the frames. */
export function progress(status: ExportStatus | null): number {
  if (!status || status.total <= 0) return 0;
  return Math.min(1, Math.max(0, status.done / status.total));
}

/**
 * `rgb(3, 169, 244)` and its relatives as `#03a9f4`.
 *
 * The card resolves every colour through the browser before sending it —
 * a config can say `var(--accent-color)`, which only a browser can read —
 * and what comes back from `getComputedStyle` is an `rgb()` string. Hex
 * is sent on because it is the one form every parser agrees on. Anything
 * else (a wide-gamut `color()` function, say) is returned untouched for
 * the integration to make what it can of; its fallback is the accent
 * colour, which is the right answer for a colour nobody could read.
 */
export function toHex(computed: string): string {
  const match = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(computed.trim());
  if (!match) return computed;
  return `#${match
    .slice(1, 4)
    .map((part) => Math.min(255, Number(part)).toString(16).padStart(2, "0"))
    .join("")}`;
}

export interface ExportChoices {
  fps: number;
  /** Stamp each frame with its date and time. */
  timestamp: boolean;
  /** Width of the stamp, in percent of the video's width. */
  timestampSize: number;
  /** Draw the card's readings blocks on the video. */
  readings: boolean;
  /** Width of the widest readings block, in percent of the video's width. */
  readingsSize: number;
  /** Where each of the card's blocks goes; absent keeps the card's side. */
  positions: Partial<Record<"left" | "right", ExportPosition>>;
}

/** A size inside its bounds, as a whole percentage. */
export function clampSize(
  value: number,
  bounds: { min: number; max: number; default: number },
): number {
  if (!Number.isFinite(value)) return bounds.default;
  return Math.min(bounds.max, Math.max(bounds.min, Math.round(value)));
}

/**
 * The overlay part of an export request: this card's own readings config,
 * with every colour resolved to something a server can parse.
 *
 * Sent in the card's config shape on purpose. The integration draws the
 * same blocks the card does, so the least lossy description of what to
 * draw is the description the card is already rendering from — a second,
 * export-only schema would be one more thing to drift.
 */
export function overlayRequest(
  config: WebcamTimelapseCardConfig,
  resolveColor: (value: string) => string,
): Record<string, unknown> | null {
  if (overlayEntities(config).length === 0) return null;

  const rows = (list: OverlayEntityConfig[] | undefined): OverlayEntityConfig[] =>
    (list ?? []).map((row) =>
      row.color ? { ...row, color: toHex(resolveColor(row.color)) } : row,
    );

  return {
    entities: rows(config.entities),
    entities_left: rows(config.entities_left),
    overlay_title: config.overlay_title ?? "",
    overlay_title_left: config.overlay_title_left ?? "",
    graph_hours: config.graph_hours ?? 24,
    show_graph: config.show_graph !== false,
    show_sun: config.show_sun === true,
    // What a row without its own colour is drawn in on the card.
    accent_color: toHex(resolveColor("var(--wtl-accent)")),
  };
}

/** The complete `webcam_timelapse/export/start` message, minus its type. */
export function exportRequest(
  config: WebcamTimelapseCardConfig,
  index: FrameIndex,
  range: ExportRange,
  choices: ExportChoices,
  language: string,
  resolveColor: (value: string) => string,
): Record<string, unknown> | null {
  const slots = rangeSlots(index, range);
  if (slots === null) return null;

  return {
    entity_id: config.camera_entity,
    start: slots.start,
    end: slots.end,
    fps: choices.fps,
    // The card's own "Smooth brightness" setting, so the video flickers
    // exactly as much as the playback it was started from.
    deflicker: Math.min(100, Math.max(0, Math.round(config.deflicker ?? 0))),
    timestamp: choices.timestamp,
    timestamp_size: clampSize(choices.timestampSize, TIMESTAMP_SIZE),
    overlay: choices.readings ? overlayRequest(config, resolveColor) : null,
    readings_size: clampSize(choices.readingsSize, READINGS_SIZE),
    readings_position: choices.positions.right ?? null,
    readings_position_left: choices.positions.left ?? null,
    language,
  };
}
