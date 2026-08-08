/**
 * When the sun was down, for any moment in the archive.
 *
 * Computed from the home's coordinates rather than read from `sun.sun`.
 * That entity only publishes what happens *next* — `next_rising`,
 * `next_setting` — and the chart routinely asks about last Tuesday. Its
 * recorded history would answer that, but only where the recorder kept
 * it: `sun.sun` republishes its elevation constantly and is one of the
 * first entities people exclude, and the default purge keeps ten days
 * against an archive that can hold thirty. A card that shaded night for
 * the recent part of a window and nothing for the older part would look
 * broken in a way no user could diagnose.
 *
 * The coordinates come from `hass.config`, which is the same location the
 * sun integration works from, so the two agree to well under a minute —
 * about a tenth of a pixel at any window this chart draws.
 *
 * Pure module: takes a window and a location, returns spans.
 */

/** A stretch of time with the sun below the horizon. Epoch ms. */
export interface NightSpan {
  from: number;
  to: number;
}

const DAY_MS = 86_400_000;
/** Julian date of the Unix epoch. */
const JULIAN_EPOCH = 2_440_587.5;
const JULIAN_2000 = 2_451_545.0;
const RAD = Math.PI / 180;
const OBLIQUITY = 23.4397;

/**
 * Sun altitude counted as the boundary between day and night.
 *
 * -0.833° rather than 0°: the sun is a disc, not a point, so its upper
 * limb clears the horizon while the centre is still below it, and
 * refraction lifts the whole image by roughly another half degree. Home
 * Assistant's sun integration uses the same convention, which is what
 * keeps this in agreement with it.
 */
const HORIZON = -0.833;

interface SolarDay {
  /** Mean solar noon, epoch ms. Always defined. */
  noon: number;
  /** Sunrise, or null when the sun does not cross the horizon that day. */
  rise: number | null;
  /** Sunset, or null when the sun does not cross the horizon that day. */
  set: number | null;
  /** True when the sun stayed below the horizon for the whole day. */
  polarNight: boolean;
}

/**
 * The standard sunrise equation, for the solar day `index` days after
 * 2000-01-01.
 *
 * Longitude is east-positive, as Home Assistant reports it. The equation
 * is conventionally written with west-positive longitude, so every term
 * carrying it has the sign flipped here — getting that backwards moves
 * sunrise by four minutes per degree and is invisible near Greenwich,
 * which is exactly why it is called out rather than left implicit.
 */
function solarDay(index: number, latitude: number, longitude: number): SolarDay {
  const meanSolarNoon = JULIAN_2000 + 0.0009 - longitude / 360 + index;
  const noon = julianToMs(meanSolarNoon);

  const anomaly = (357.5291 + 0.98560028 * (meanSolarNoon - JULIAN_2000)) % 360;
  const centre =
    1.9148 * Math.sin(anomaly * RAD) +
    0.02 * Math.sin(2 * anomaly * RAD) +
    0.0003 * Math.sin(3 * anomaly * RAD);
  const eclipticLongitude = (anomaly + centre + 180 + 102.9372) % 360;

  const transit =
    meanSolarNoon +
    0.0053 * Math.sin(anomaly * RAD) -
    0.0069 * Math.sin(2 * eclipticLongitude * RAD);

  const sinDeclination =
    Math.sin(eclipticLongitude * RAD) * Math.sin(OBLIQUITY * RAD);
  const cosDeclination = Math.cos(Math.asin(sinDeclination));

  const hourAngle =
    (Math.sin(HORIZON * RAD) - Math.sin(latitude * RAD) * sinDeclination) /
    (Math.cos(latitude * RAD) * cosDeclination);

  // No solution: the sun never reaches the horizon. Which side it stayed
  // on is carried by the sign — above +1 means it never climbed high
  // enough, so the day is polar night; below -1 means it never sank far
  // enough, so the day is midnight sun.
  if (!Number.isFinite(hourAngle) || Math.abs(hourAngle) > 1) {
    return { noon, rise: null, set: null, polarNight: hourAngle > 1 };
  }

  const omega = Math.acos(hourAngle) / RAD;
  return {
    noon,
    rise: julianToMs(transit - omega / 360),
    set: julianToMs(transit + omega / 360),
    polarNight: false,
  };
}

function julianToMs(julian: number): number {
  return (julian - JULIAN_EPOCH) * DAY_MS;
}

/** The solar-day index containing `ms` at this longitude. */
function dayIndexOf(ms: number, longitude: number): number {
  return Math.round(
    ms / DAY_MS + JULIAN_EPOCH - JULIAN_2000 - 0.0009 + longitude / 360,
  );
}

/**
 * Every stretch of night overlapping `[from, to]`, clipped to it.
 *
 * Walks one day either side of the window, because the night straddling
 * each edge belongs to the solar day outside it — a window opening at
 * 02:00 sits inside a night that began the previous evening, and a walk
 * starting at the window would miss it and shade the wrong half.
 *
 * Touching spans are merged, which is what makes polar night render as
 * one band across weeks instead of a row of day-wide rectangles with
 * seams between them.
 */
export function nightSpans(
  from: number,
  to: number,
  latitude: number,
  longitude: number,
): NightSpan[] {
  if (
    !Number.isFinite(from) ||
    !Number.isFinite(to) ||
    to <= from ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90
  ) {
    return [];
  }

  const first = dayIndexOf(from, longitude) - 1;
  const last = dayIndexOf(to, longitude) + 1;
  // A sanity stop, not a policy — whether a window this wide is worth
  // shading at all is the caller's call, made on how wide the bands come
  // out. This only keeps an absurd range from spinning the loop.
  if (last - first > 800) return [];

  const spans: NightSpan[] = [];
  for (let index = first; index <= last; index++) {
    const today = solarDay(index, latitude, longitude);

    if (today.set === null) {
      // Midnight sun contributes nothing; polar night is the whole day.
      if (today.polarNight) {
        add(spans, today.noon - DAY_MS / 2, today.noon + DAY_MS / 2);
      }
      continue;
    }

    // Night runs from this evening's sunset to tomorrow's sunrise — not
    // from today's own sunrise, which would shade the daylight instead.
    // With no sunrise tomorrow the night runs into that day, and the next
    // iteration merges onto the end of it.
    const tomorrow = solarDay(index + 1, latitude, longitude);
    add(spans, today.set, tomorrow.rise ?? tomorrow.noon - DAY_MS / 2);
  }

  return clip(spans, from, to);
}

/**
 * A night span as a fraction of the window it was asked about.
 *
 * Fractions rather than pixels or percent, because the two things that
 * draw these — a 234-unit viewBox and a full-width track — agree on
 * nothing else.
 */
export interface NightBand {
  /** 0 at the start of the window, 1 at the end. */
  left: number;
  width: number;
}

/**
 * Narrowest a band may be drawn, as a fraction of the width.
 *
 * Below roughly this the bands stop reading as night and start reading
 * as hatching over whatever they sit behind: thirty nights across thirty
 * days is a band every few pixels. One definition for both the chart and
 * the scrubber, so the two cannot drift into disagreeing about when a
 * window is too wide to shade.
 */
export const MIN_NIGHT_FRACTION = 4 / 234;

/**
 * Night across `[from, to]`, ready to position, or nothing when the
 * window is too wide for the bands to mean anything.
 *
 * The check is on the widest band rather than on the window's length, so
 * it calibrates itself — it holds at a latitude where a night runs
 * twenty hours just as well as at one where it runs eight.
 */
export function nightBands(
  from: number,
  to: number,
  latitude: number,
  longitude: number,
): NightBand[] {
  const span = to - from;
  if (!(span > 0)) return [];

  const bands = nightSpans(from, to, latitude, longitude).map((night) => ({
    left: (night.from - from) / span,
    width: (night.to - night.from) / span,
  }));

  const widest = bands.reduce((most, band) => Math.max(most, band.width), 0);
  return widest >= MIN_NIGHT_FRACTION ? bands : [];
}

/** Append, merging into the previous span when the two touch. */
function add(spans: NightSpan[], from: number, to: number): void {
  if (to <= from) return;
  const previous = spans[spans.length - 1];
  if (previous && from <= previous.to) {
    previous.to = Math.max(previous.to, to);
    return;
  }
  spans.push({ from, to });
}

function clip(spans: NightSpan[], from: number, to: number): NightSpan[] {
  const out: NightSpan[] = [];
  for (const span of spans) {
    const start = Math.max(span.from, from);
    const end = Math.min(span.to, to);
    if (end > start) out.push({ from: start, to: end });
  }
  return out;
}
