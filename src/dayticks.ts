/**
 * Day boundaries under the scrubber track.
 *
 * Pure module — no DOM, no Lit. The whole point of this file is one
 * correctness property that is easy to get wrong and invisible until
 * twice a year, so it is isolated and tested on its own.
 */

import type { FrameIndex } from "./frames";
import { slotAt } from "./frames";

export interface DayTick {
  /** Grid position of the first frame on this day. */
  position: number;
  /** Position along the track, 0–100. */
  left: number;
  /** Localised label, e.g. "Samstag 01.08." */
  label: string;
  /** First day of a month gets a heavier tick and always keeps its label. */
  isMonthStart: boolean;
}

type LabelWidth = "long" | "short" | "date";

/**
 * Local calendar date (`YYYY-MM-DD`) for an epoch-second slot.
 *
 * `en-CA` is not a locale choice, it is a formatting trick: it is the
 * locale whose short date format IS ISO-8601, so this yields a directly
 * comparable string without hand-assembling parts.
 */
function localDate(slot: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(slot * 1000));
}

function formatLabel(
  slot: number,
  timeZone: string,
  language: string,
  width: LabelWidth,
): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    day: "2-digit",
    month: "2-digit",
  };
  if (width === "long") options.weekday = "long";
  if (width === "short") options.weekday = "short";
  return new Intl.DateTimeFormat(language, options).format(new Date(slot * 1000));
}

/**
 * Pick label verbosity from the available track width.
 *
 * Ticks themselves always render at every midnight; only the *labels*
 * thin out, so the timeline never loses structure just because the card
 * is narrow.
 */
export function labelWidthFor(trackPx: number): LabelWidth {
  if (trackPx >= 560) return "long";
  if (trackPx >= 380) return "short";
  return "date";
}

/** How many days to skip between labels so they do not collide. */
export function labelEvery(dayCount: number, trackPx: number, minLabelPx: number): number {
  const fits = Math.max(1, Math.floor(trackPx / minLabelPx));
  return Math.max(1, Math.ceil(dayCount / fits));
}

/**
 * Ticks at every local midnight inside the archive window.
 *
 * Detects the day boundary by watching the formatted local date change
 * between consecutive slots, rather than by stepping 86400 seconds at a
 * time. That distinction is the entire reason this module exists: adding a
 * fixed 86400 assumes every day is 24 hours, which is false twice a year
 * in any DST timezone — Europe/Vienna has a 23-hour day on 2026-03-29 and
 * a 25-hour day on 2026-10-25 — and every tick after the transition would
 * silently drift by an hour. Comparing calendar dates is exact by
 * construction and needs no DST arithmetic at all.
 *
 * The timezone must be Home Assistant's (`hass.config.time_zone`), never
 * the browser's: a phone that has travelled should still show the
 * camera's days.
 */
export function dayTicks(
  index: FrameIndex,
  timeZone: string,
  language: string,
  trackPx: number,
): DayTick[] {
  if (index.t0 === null || index.count === 0) return [];

  const width = labelWidthFor(trackPx);
  const minLabelPx = width === "long" ? 110 : width === "short" ? 78 : 58;

  const boundaries: { position: number; slot: number; date: string }[] = [];
  let previousDate = localDate(index.t0, timeZone);

  for (let i = 1; i < index.count; i++) {
    const slot = slotAt(index, i);
    if (slot === null) continue;
    const date = localDate(slot, timeZone);
    if (date !== previousDate) {
      boundaries.push({ position: i, slot, date });
      previousDate = date;
    }
  }

  const every = labelEvery(boundaries.length, trackPx, minLabelPx);
  const lastPosition = Math.max(1, index.count - 1);

  return boundaries.map((boundary, n) => {
    const isMonthStart = boundary.date.endsWith("-01");
    // Month starts always keep their label: they carry the most
    // orientation per pixel on a long timeline.
    const labelled = isMonthStart || n % every === 0;
    return {
      position: boundary.position,
      left: (boundary.position / lastPosition) * 100,
      label: labelled ? formatLabel(boundary.slot, timeZone, language, width) : "",
      isMonthStart,
    };
  });
}

/** "Sa 01.08., 12:30" — announced by the scrubber via aria-valuetext. */
export function formatStamp(
  slot: number,
  timeZone: string,
  language: string,
): string {
  return new Intl.DateTimeFormat(language, {
    timeZone,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(slot * 1000));
}

/** "12:30" — the compact overlay clock. */
export function formatClock(
  slot: number,
  timeZone: string,
  language: string,
): string {
  return new Intl.DateTimeFormat(language, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(slot * 1000));
}
