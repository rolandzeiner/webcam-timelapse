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
 * Cache of Intl formatters, keyed by locale plus options.
 *
 * Constructing an Intl.DateTimeFormat is roughly two orders of magnitude
 * dearer than calling .format() on an existing one, and the day scan
 * below formats once per slot — up to 20 000 slots at one-minute capture
 * over a fortnight. Building the formatter inside that loop, as this
 * module first did, put tens of thousands of constructions on every
 * render, and the ruler re-renders on every frame swap during playback.
 */
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let cached = formatterCache.get(key);
  if (cached === undefined) {
    cached = new Intl.DateTimeFormat(locale, options);
    formatterCache.set(key, cached);
  }
  return cached;
}

/**
 * Local calendar date (`YYYY-MM-DD`) for an epoch-second slot.
 *
 * `en-CA` is not a locale choice, it is a formatting trick: it is the
 * locale whose short date format IS ISO-8601, so this yields a directly
 * comparable string without hand-assembling parts.
 */
function localDate(slot: number, timeZone: string): string {
  return formatter("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(slot * 1000));
}

/**
 * Seconds elapsed since local midnight for an epoch-second slot.
 *
 * Derived from the formatted local wall clock rather than from any offset
 * arithmetic, so it stays correct across DST for the same reason the day
 * scan does: the formatter knows the rules, we do not.
 */
function secondsOfLocalDay(slot: number, timeZone: string): number {
  const parts = formatter("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(slot * 1000));

  let hour = 0;
  let minute = 0;
  let second = 0;
  for (const part of parts) {
    if (part.type === "hour") hour = Number(part.value);
    else if (part.type === "minute") minute = Number(part.value);
    else if (part.type === "second") second = Number(part.value);
  }
  // Some ICU versions render midnight as hour 24 under hour12:false.
  if (hour === 24) hour = 0;
  return hour * 3600 + minute * 60 + second;
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
  return formatter(language, options).format(new Date(slot * 1000));
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

/**
 * Spacings the sub-day ruler is allowed to choose from, in seconds.
 *
 * Every value divides evenly into 24 hours, so ticks land on the round
 * clock times a reader expects (06:00, not 05:47) and repeat identically
 * on each day of the window.
 */
export const TIME_STEPS = [
  600, 900, 1800, 3600, 7200, 10800, 21600, 43200,
] as const;

/** Minimum pixels between adjacent marks before they read as a smear. */
const MIN_TICK_PX = 9;
/** Minimum pixels a "12:00" label needs to itself, including breathing room. */
const MIN_TIME_LABEL_PX = 46;

export interface TimeTick {
  /** Grid position of the frame nearest this instant. */
  position: number;
  /** Position along the track, 0–100. */
  left: number;
  /** Localised clock label, or "" for an unlabelled mark. */
  label: string;
}

/**
 * Coarsest-to-finest search for a spacing that will not overcrowd.
 *
 * Returns null when even 12 hours would be too dense, which is the case
 * on a long archive in a narrow card — the day ticks carry the timeline
 * alone there, rather than the ruler degrading into a grey band.
 *
 * Never returns a spacing finer than the capture grid: a mark between two
 * frames would point at an instant the archive cannot show.
 */
export function timeStepFor(
  spanSeconds: number,
  gridStep: number,
  trackPx: number,
): number | null {
  if (spanSeconds <= 0) return null;
  const maxTicks = Math.max(2, Math.floor(trackPx / MIN_TICK_PX));
  const wanted = spanSeconds / maxTicks;
  for (const candidate of TIME_STEPS) {
    if (candidate >= wanted && candidate >= gridStep) return candidate;
  }
  return null;
}

/**
 * Ruler marks at round local clock times between the day boundaries.
 *
 * Walks instants rather than scanning every slot. The day scan below is
 * O(count) because it must see each frame to notice a date change; this
 * one knows the spacing up front, so it costs one formatter call per tick
 * — a few dozen, not a few thousand.
 *
 * The step is re-derived from the actual local time at each mark instead
 * of accumulating. On a DST transition the sequence therefore snaps back
 * onto round clock times instead of carrying the one-hour shift forward
 * for the rest of the window. Midnight is skipped: the day tick already
 * marks it, and with a date label that says more.
 */
export function timeTicks(
  index: FrameIndex,
  timeZone: string,
  language: string,
  trackPx: number,
): TimeTick[] {
  if (index.t0 === null || index.count === 0) return [];

  const t0 = index.t0;
  const lastPosition = Math.max(1, index.count - 1);
  const end = t0 + lastPosition * index.step;
  const interval = timeStepFor(end - t0, index.step, trackPx);
  if (interval === null) return [];

  // Which marks are eligible for a clock label, anchored to midnight so
  // the labelled times repeat day to day (always 06:00 and 18:00, never
  // drifting to 05:00 on Tuesday).
  //
  // Capped at 12 h. Without the cap a long window pushes this to 24 h, at
  // which point the only eligible instant is midnight — which is skipped
  // below because the day tick already owns it — and the ruler renders
  // marks with no times at all, i.e. exactly the question it exists to
  // answer goes unanswered.
  const pxPerTick = (interval / (end - t0)) * trackPx;
  const labelEveryNth = Math.max(1, Math.ceil(MIN_TIME_LABEL_PX / pxPerTick));
  const labelInterval = Math.min(43200, interval * labelEveryNth);

  const ticks: TimeTick[] = [];
  const opening = secondsOfLocalDay(t0, timeZone) % interval;
  let at = opening === 0 ? t0 : t0 + (interval - opening);
  // The cap above can make eligible labels closer together than they can
  // be drawn, so eligibility is necessary but not sufficient: a greedy
  // pass keeps a label only once enough track has passed since the last
  // one. Labels thin out across the window rather than overlapping.
  let lastLabelPx = -Infinity;

  // The window is bounded and the step is positive, so this terminates;
  // the guard only bounds the damage if a future timezone rule made a
  // step somehow fail to advance.
  for (let guard = 0; at <= end && guard < 4096; guard++) {
    const secondsIn = secondsOfLocalDay(at, timeZone);
    const offGrid = secondsIn % interval;

    // Emit only instants that sit exactly on the spacing. Crossing a DST
    // boundary shifts the wall clock under us, so the instant one step on
    // can land at 01:00 on a two-hour ruler. Re-aligning on the NEXT pass
    // is not enough — this one would already have been drawn. Skipping it
    // costs a single mark at the transition and keeps every mark that is
    // drawn honest.
    if (offGrid === 0 && secondsIn !== 0) {
      const position = Math.round((at - t0) / index.step);
      const left = (position / lastPosition) * 100;
      const leftPx = (left / 100) * trackPx;

      let label = "";
      if (
        secondsIn % labelInterval === 0 &&
        leftPx - lastLabelPx >= MIN_TIME_LABEL_PX
      ) {
        label = formatClock(at, timeZone, language);
        lastLabelPx = leftPx;
      }
      ticks.push({ position, left, label });
    }
    at += interval - offGrid;
  }

  return ticks;
}

/** "Sa 01.08., 12:30" — announced by the scrubber via aria-valuetext. */
export function formatStamp(
  slot: number,
  timeZone: string,
  language: string,
): string {
  return formatter(language, {
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
  return formatter(language, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(slot * 1000));
}
