/**
 * A small SVG sparkline for the overlay.
 *
 * Written rather than lifted from tankstellen-austria: that one is 564
 * lines built around hourly envelopes, median deltas and refuel
 * recommendation windows, none of which mean anything here. What this
 * card needs is "show the shape of the last few hours behind a
 * playhead", which is a much smaller job.
 *
 * Pure module — takes numbers, returns an SVG template.
 */

import { svg, type SVGTemplateResult } from "lit";

import type { HistoryPoint } from "./overlay-history";
import type { NightBand } from "./sun";

const WIDTH = 240;
const HEIGHT = 44;
const PADDING = 3;

export interface SparklineOptions {
  points: HistoryPoint[];
  /** Epoch ms of the playhead, drawn as a vertical marker down the middle. */
  at: number;
  /** Window width in hours, centred on the playhead; sets the horizontal scale. */
  hours: number;
  color: string;
  /** Accessible summary; the SVG is otherwise aria-hidden. */
  label: string;
  /**
   * The smallest change the series resolves, from `seriesStats`.
   *
   * Floors the plotted range. Without it the y scale is degenerate: any
   * non-zero variation, however small, is stretched to the full height of
   * the box, so a gauge jittering on its last digit is drawn exactly like
   * one that moved a metre. Absent or 0, no floor is applied.
   */
  quantum?: number;
  /**
   * Night to shade behind the line, as fractions of this same window.
   *
   * Already clipped and already vetted for legibility by `nightBands`,
   * which is where that judgement lives so the chart and the scrubber
   * cannot come to different conclusions about it.
   */
  nights?: NightBand[];
}

/** The smallest 1-2-5 × 10^k value at or above `raw`. */
function niceStep(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const decade = Math.pow(10, Math.floor(Math.log10(raw)));
  const leading = raw / decade;
  return (leading > 5 ? 10 : leading > 2 ? 5 : leading > 1 ? 2 : 1) * decade;
}

/** How far the series actually moved inside the window. */
export function extentOf(points: HistoryPoint[]): number {
  if (points.length === 0) return 0;
  let min = Infinity;
  let max = -Infinity;
  for (const point of points) {
    if (point.value < min) min = point.value;
    if (point.value > max) max = point.value;
  }
  return max - min;
}

/**
 * Render the sparkline, or `null` when there is nothing to draw.
 *
 * Returning null rather than an empty box lets the caller omit the
 * element entirely — an empty chart frame reads as "broken", whereas no
 * chart reads as "not applicable", which is what no data at all means.
 *
 * One point is enough. The line is a step held to the right edge, so a
 * lone reading is a legitimate partial series: the value from then until
 * the end of the window, and honestly nothing before it. This used to
 * require two, which quietly hid the graph for any gauge whose value
 * simply had not changed inside the window — see `windowAround`, whose
 * anchor point is usually the single point in question.
 */
export function sparkline(options: SparklineOptions): SVGTemplateResult | null {
  const { points, at, hours, color, label, quantum = 0, nights = [] } = options;
  if (points.length === 0) return null;

  // Centred on the playhead, which is where the marker sits.
  //
  // A trailing window is defensible on paper — it doubles the history on
  // screen and spends no width on a future that is empty at live. On this
  // card it is the wrong call. The chart belongs to a scrubber: the
  // marker is the moment you are looking at, and putting it in the middle
  // is what makes the picture, the number and the line read as one
  // instrument. Reviewing an archive, the half ahead of the marker is the
  // most useful half — it is what happened next.
  const half = (hours * 3_600_000) / 2;
  const t0 = at - half;
  const t1 = at + half;
  const span = t1 - t0 || 1;

  let min = Infinity;
  let max = -Infinity;
  for (const point of points) {
    if (point.value < min) min = point.value;
    if (point.value > max) max = point.value;
  }
  const observed = max - min;
  const mid = (min + max) / 2;

  // Floor the plotted range at four quantisation steps.
  //
  // Scaling to the window's own extremes makes rendered amplitude a step
  // function of real variation: zero for a flat series, full height for
  // every other one, with nothing between. A groundwater gauge whose
  // window holds a single 1 mm tick was drawn at the same height as a
  // river that swung 40 cm — the same ink for a four-hundredth of the
  // movement. Four steps means full height starts to mean "at least four
  // distinguishable levels", so the picture and the last printed digit
  // finally agree about whether anything happened.
  //
  // The relative term keeps float noise on a large-magnitude sensor from
  // blowing the domain open; 253 m of datum offset is a lot of mantissa.
  const floor = Math.max(4 * quantum, Math.abs(mid) * 1e-9);
  const wanted = Math.max(observed, floor) || 1;

  let lo = mid - wanted / 2;
  let hi = mid + wanted / 2;

  // Round outward to 1-2-5 bounds, so the scale only moves when the data
  // crosses a round number instead of on every frame.
  //
  // Recomputing the domain from the window extremes each frame means an
  // extreme falling off the left edge instantly rescales everything still
  // on screen. During replay the viewer sees the gauge moving and the
  // axis moving at once, with no way to tell them apart — a 40 cm peak
  // leaving a window can change every remaining point's height five-fold
  // between one frame and the next. Rounding also stops the line touching
  // both edges every time, which makes how much of the box it fills mean
  // something.
  //
  // A genuinely flat series skips this and stays exactly centred: it is
  // the one case where the midpoint is the whole message.
  if (observed > 0) {
    const step = niceStep(wanted / 4);
    lo = Math.floor(lo / step) * step;
    hi = Math.ceil(hi / step) * step;
    if (!(hi > lo)) {
      lo = mid - wanted / 2;
      hi = mid + wanted / 2;
    }
  }
  const range = hi - lo || 1;

  const x = (time: number): number =>
    PADDING + ((time - t0) / span) * (WIDTH - PADDING * 2);
  const y = (value: number): number =>
    HEIGHT - PADDING - ((value - lo) / range) * (HEIGHT - PADDING * 2);

  // Step, not a smooth curve. These are discrete readings held until the
  // next one; a curve through them would imply intermediate values that
  // were never measured — the same reason resolveAt does not interpolate.
  const commands: string[] = [];
  points.forEach((point, index) => {
    const px = x(point.at);
    const py = y(point.value);
    if (index === 0) {
      commands.push(`M ${px.toFixed(1)} ${py.toFixed(1)}`);
    } else {
      commands.push(`H ${px.toFixed(1)}`, `V ${py.toFixed(1)}`);
    }
  });
  // Held flat to the end of the window, in the same stroke.
  //
  // A gauge that has not reported since the last reading is not a gap in
  // the data — under hold-last-known its value is exactly that reading,
  // and that is what the number beside the chart shows too. Drawing the
  // held part as a dashed or faded line said "something is missing here"
  // about the ordinary behaviour of any slow sensor, and made a working
  // chart look broken. It is the last recorded value; draw it as one.
  const last = points[points.length - 1]!;
  commands.push(`H ${x(t1).toFixed(1)}`);

  // Night goes down before anything else, so the line and the marker
  // stay on top of it. Paint order is document order — reaching for
  // z-index here would pull the chart into the stacking competition the
  // stage's own rules exist to keep it out of.
  const interior = WIDTH - PADDING * 2;
  const visibleBands = nights.map((night) => ({
    left: PADDING + night.left * interior,
    width: night.width * interior,
  }));

  const playheadX = x(at);
  // Scan back rather than filter: `windowAround` only ever hands over
  // points at or before `at`, but this module is also called directly,
  // and a copy of the window per row per frame is not free at 64x.
  let current = last;
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i]!.at <= at) {
      current = points[i]!;
      break;
    }
  }

  return svg`
    <svg
      class="spark"
      viewBox="0 0 ${WIDTH} ${HEIGHT}"
      preserveAspectRatio="none"
      role="img"
      aria-label=${label}
    >
      ${visibleBands.map(
        (band) => svg`<rect
          class="spark-night"
          x=${band.left.toFixed(1)}
          y="0"
          width=${band.width.toFixed(1)}
          height=${HEIGHT}
        />`,
      )}
      <path
        d=${commands.join(" ")}
        fill="none"
        stroke=${color}
        stroke-width="1.5"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
      <line
        x1=${playheadX.toFixed(1)}
        y1="0"
        x2=${playheadX.toFixed(1)}
        y2=${HEIGHT}
        stroke="currentColor"
        stroke-width="1"
        opacity="0.5"
        vector-effect="non-scaling-stroke"
      />
      <path
        d="M ${playheadX.toFixed(1)} ${y(current.value).toFixed(1)} L ${playheadX.toFixed(1)} ${y(current.value).toFixed(1)}"
        stroke=${color}
        stroke-width="5"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  `;
}
