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
  const { points, at, hours, color, label } = options;
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
  // A flat series has zero range. Dividing by it would send every point
  // to Infinity and the line would vanish, and scaling against a floor of
  // 1 pins the line to the bottom of the box — which reads as "bottomed
  // out" rather than "unchanged". Centring is the honest rendering.
  const flat = max === min;
  const range = max - min;

  const x = (time: number): number =>
    PADDING + ((time - t0) / span) * (WIDTH - PADDING * 2);
  const y = (value: number): number =>
    flat
      ? HEIGHT / 2
      : HEIGHT - PADDING - ((value - min) / range) * (HEIGHT - PADDING * 2);

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
  const last = points[points.length - 1]!;
  commands.push(`H ${x(t1).toFixed(1)}`);

  const playheadX = x(at);
  const playheadValue = points.filter((p) => p.at <= at).pop() ?? last;

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
      <circle
        cx=${playheadX.toFixed(1)}
        cy=${y(playheadValue.value).toFixed(1)}
        r="2.5"
        fill=${color}
      />
    </svg>
  `;
}
