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

import { nothing, svg, type SVGTemplateResult } from "lit";

import type { HistoryPoint } from "./overlay-history";

const WIDTH = 240;
const HEIGHT = 44;
const PADDING = 3;

export interface SparklineOptions {
  points: HistoryPoint[];
  /** Epoch ms of the playhead, drawn as a vertical marker at the right edge. */
  at: number;
  /** Hours of history behind the playhead; sets the horizontal scale. */
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
   * Milliseconds after which the held-forward tail is drawn as an
   * estimate rather than as measurement. From `seriesStats`, so the chart
   * and the dimmed numeric readout agree on what counts as stale.
   */
  staleAfter?: number;
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
  const { points, at, hours, color, label, quantum = 0, staleAfter } = options;
  if (points.length === 0) return null;

  // The window trails the playhead rather than straddling it. `hours` is
  // documented as "history behind the playhead", and for a wide window
  // the difference is the whole chart: a centred 720h window spent half
  // its width on a future that, at live, is always the flat hold-forward
  // line — so a slow gauge read as frozen while showing only 15 of the
  // 30 days it was asked for.
  const t1 = at;
  const span = hours * 3_600_000 || 1;
  const t0 = t1 - span;

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
  // The hold-forward is its own path, not the last leg of this one.
  //
  // Everything up to the final reading is measurement. From there to the
  // playhead is the hold-last-known rule being applied forward, and how
  // much to trust it depends entirely on how long ago that reading was.
  // Drawn as one continuous stroke there was no way to tell a value taken
  // a minute ago from one taken three days ago — the chart asserting more
  // than it knows, which is the thing the no-interpolation rule exists to
  // prevent, quietly dropped at the right-hand edge.
  const last = points[points.length - 1]!;
  const lastX = x(last.at);
  const lastY = y(last.value);
  const held = at > last.at ? `M ${lastX.toFixed(1)} ${lastY.toFixed(1)} H ${x(at).toFixed(1)}` : "";
  const stale = staleAfter !== undefined && at - last.at > staleAfter;

  // The playhead marker is gone: the window is trailing, so x(at) always
  // evaluated to the right edge of the box. A full-height line permanently
  // on the border said nothing the border did not, and the ink is better
  // spent on the scale caption beside the chart.
  return svg`
    <svg
      class="spark"
      viewBox="0 0 ${WIDTH} ${HEIGHT}"
      preserveAspectRatio="none"
      role="img"
      aria-label=${label}
    >
      <path
        d=${commands.join(" ")}
        fill="none"
        stroke=${color}
        stroke-width="1.5"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
      ${held
        ? svg`<path
            class="spark-held"
            d=${held}
            fill="none"
            stroke=${color}
            stroke-width="1.5"
            stroke-dasharray=${stale ? "2 2" : "0"}
            opacity=${stale ? "0.6" : "1"}
            vector-effect="non-scaling-stroke"
          />`
        : nothing}
      <path
        d="M ${lastX.toFixed(1)} ${lastY.toFixed(1)} L ${lastX.toFixed(1)} ${lastY.toFixed(1)}"
        stroke=${color}
        stroke-width="5"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  `;
}
