import { describe, expect, it } from "vitest";

import cardSource from "./webcam-timelapse-card.ts?raw";
import { type HistoryPoint, resolveAt, windowAround } from "./overlay-history";
import { sparkline } from "./sparkline";

const HOUR = 3_600_000;
const T0 = Date.UTC(2026, 7, 1, 12, 0, 0);

/**
 * The `d` attribute out of the returned template.
 *
 * The tests run without a DOM, so the template is never rendered — its
 * interpolated values are read directly. The path is the only value that
 * starts with a move command, which makes it findable without depending
 * on the order the attributes happen to appear in.
 */
function pathOf(result: ReturnType<typeof sparkline>): string {
  return pathsOf(result)[0] ?? "";
}

/**
 * Every path `d` in the template, outermost first.
 *
 * Recursive because the held-forward tail lives in a nested `svg`
 * template — a flat read of the outer values misses it entirely, which
 * is exactly the kind of silent pass this file is meant to prevent. The
 * dot is not picked up: its `d` is built from several interpolations, so
 * lit stores it as separate parts rather than as one "M …" string.
 */
function pathsOf(result: unknown): string[] {
  const values = (result as { values?: unknown[] })?.values;
  if (!Array.isArray(values)) return [];
  const found: string[] = [];
  for (const value of values) {
    if (typeof value === "string" && value.startsWith("M ")) {
      found.push(value);
    } else if (value && typeof value === "object") {
      found.push(...pathsOf(value));
    }
  }
  return found;
}


/**
 * The static text of a template and everything nested inside it.
 *
 * Classes are static attributes rather than interpolated values, so they
 * live in `strings` and are invisible to a walk over `values` alone.
 */
function markupOf(result: unknown): string {
  // Repeated marks arrive as an array of templates rather than as one
  // template, so a walk that only recurses into objects carrying
  // `values` goes straight past them.
  if (Array.isArray(result)) return result.map(markupOf).join("");

  const node = result as { strings?: readonly string[]; values?: unknown[] };
  if (!Array.isArray(node?.values) || !node.strings) return "";

  // Interleaved, not concatenated. Appending all the static text and then
  // all the nested text reproduces the right characters in the wrong
  // order, which silently defeats any assertion about paint order — and
  // paint order is the whole reason the night bands sit where they do.
  let markup = "";
  node.strings.forEach((text, index) => {
    markup += text;
    const value = node.values?.[index];
    if (value && typeof value === "object") markup += markupOf(value);
  });
  return markup;
}

/** How many night bands the chart drew. */
function nightBandsOf(result: unknown): number {
  return markupOf(result).split('class="spark-night"').length - 1;
}

/** True when the night bands are emitted before the line that sits on them. */
function nightIsBehindTheLine(result: unknown): boolean {
  const markup = markupOf(result);
  return markup.indexOf('class="spark-night"') < markup.indexOf("<path");
}

/** Every `V y` command in a path, in order. */
function levelsOf(path: string): number[] {
  return [...path.matchAll(/V (-?[\d.]+)/g)].map((m) => Number(m[1]));
}

function draw(
  points: HistoryPoint[],
  at: number,
  hours: number,
  quantum?: number,
) {
  return sparkline({
    points,
    at,
    hours,
    color: "#20b2aa",
    label: "test",
    ...(quantum === undefined ? {} : { quantum }),
  });
}

/**
 * Every y in a path — the one in the opening move as well as the `V`s.
 *
 * levelsOf alone misses the first point, which for a two-point series is
 * half the data and makes a full-height swing measure as zero.
 */
function ysOf(path: string): number[] {
  const opening = Number(path.match(/^M [\d.]+ ([\d.]+)/)?.[1]);
  return [...(Number.isFinite(opening) ? [opening] : []), ...levelsOf(path)];
}

/** Peak-to-trough height of the drawn line, in viewBox units of 38. */
function swingOf(points: HistoryPoint[], at: number, hours: number, quantum?: number): number {
  const ys = ysOf(pathOf(draw(points, at, hours, quantum)));
  return Math.max(...ys) - Math.min(...ys);
}

describe("sparkline", () => {
  it("draws nothing when there is no data", () => {
    // No chart reads as "not applicable". An empty chart frame reads as
    // "broken", which is the wrong thing to say about a sensor that
    // simply has no history in the window.
    expect(draw([], T0, 24)).toBeNull();
  });

  it("draws a single held reading across the window", () => {
    // One point is a legitimate partial series under hold-last-known:
    // that value from then until the right edge, and nothing before it.
    // Requiring two is what hid the graph for slow gauges.
    const path = pathOf(draw([{ at: T0, value: 253.336 }], T0, 24));
    expect(path).not.toBe("");
    expect(path).toMatch(/^M /);
    expect(path).toMatch(/H [\d.]+$/);
  });

  it("draws the held stretch in the same stroke as the rest", () => {
    // A gauge that has not reported since its last reading is not a gap.
    // Its value is that reading, which is what the number beside the
    // chart shows too — so the line carries on solid. Dashing or fading
    // it said "something is missing" about the ordinary behaviour of any
    // slow sensor, and made a working chart look broken.
    const paths = pathsOf(draw([{ at: T0 - 6 * HOUR, value: 253.336 }], T0, 24));
    expect(paths).toHaveLength(1);
    expect(JSON.stringify(paths)).not.toContain("2 2");
  });

  it("centres a flat series instead of pinning it to the floor", () => {
    // max === min, so the range guard kicks in. The line must stay level
    // rather than divide by zero and vanish — and it must sit mid-box
    // (22 of the 44-high viewBox). Scaling against a floor of 1 put it at
    // y=41, hard on the bottom edge, which reads as a gauge that has
    // bottomed out rather than one that simply has not moved.
    const flat: HistoryPoint[] = [
      { at: T0 - 2 * HOUR, value: 253.336 },
      { at: T0 - HOUR, value: 253.336 },
      { at: T0, value: 253.336 },
    ];
    const levels = levelsOf(pathOf(draw(flat, T0, 24)));
    expect(levels.length).toBeGreaterThan(0);
    expect(levels.every((level) => level === 22)).toBe(true);
  });

  it("puts the playhead down the middle", () => {
    // The chart belongs to a scrubber: the marker is the moment you are
    // looking at, and centring it is what makes the picture, the number
    // and the line read as one instrument. A reading taken exactly at the
    // playhead therefore lands at the centre of the box, not at an edge.
    const startX = (points: HistoryPoint[]): number =>
      Number(pathOf(draw(points, T0, 24)).match(/^M ([\d.]+)/)?.[1]);

    expect(startX([{ at: T0, value: 253.336 }])).toBeCloseTo(120, 0);
    expect(startX([{ at: T0 - 12 * HOUR, value: 253.336 }])).toBeCloseTo(3, 0);
  });

  it("steps rather than ramping between readings", () => {
    // A curve through discrete readings would invent values that were
    // never measured. H-then-V, always.
    const path = pathOf(
      draw(
        [
          { at: T0, value: 137 },
          { at: T0 + HOUR, value: 141 },
        ],
        T0 + HOUR,
        4,
      ),
    );
    expect(path).toMatch(/^M [\d.]+ [\d.]+ H [\d.]+ V [\d.]+ H [\d.]+$/);
  });

  it("draws a gauge that has not moved for days", () => {
    // The end-to-end groundwater regression, windowing included: the
    // station last changed value 48h ago and the playhead sits on now.
    // Before the fix windowAround returned [] and sparkline bailed at
    // <2, so the row kept its number and silently lost its graph.
    const steady: HistoryPoint[] = [
      { at: T0 - 72 * HOUR, value: 253.388 },
      { at: T0 - 48 * HOUR, value: 253.336 },
    ];
    const points = windowAround(steady, T0, 24);

    expect(points).toHaveLength(1);
    expect(draw(points, T0, 24)).not.toBeNull();
  });

  it("draws even when no reading is in effect yet", () => {
    // The playhead sits before the gauge's first ever reading — the case
    // for any sensor added after the archive started. There is honestly
    // no *value* at that instant, but the window straddles the playhead,
    // so there is history on screen and the chart is the thing that shows
    // it. Gating the chart on the number is what made a recently added
    // sensor lose its graph across the whole earlier half of the archive.
    const points: HistoryPoint[] = [
      { at: T0, value: 253.336 },
      { at: T0 + 2 * HOUR, value: 253.34 },
    ];
    const at = T0 - HOUR;

    expect(resolveAt(points, at, 2 * HOUR)).toBeNull();
    expect(draw(windowAround(points, at, 24), at, 24)).not.toBeNull();
  });

  it("does not stretch a single quantisation step to full height", () => {
    // The complaint that started this: rendered amplitude was a step
    // function of real movement — zero for a flat series, full height for
    // everything else. A groundwater gauge whose window holds one 1mm
    // tick was drawn exactly like a river that swung 40cm. With the range
    // floored at four steps, one step gets about a quarter of the box.
    const oneStep: HistoryPoint[] = [
      { at: T0 - 6 * HOUR, value: 253.336 },
      { at: T0 - HOUR, value: 253.337 },
    ];

    // Unfloored this was the full 38-unit interior, whatever the step.
    expect(swingOf(oneStep, T0, 24)).toBeGreaterThan(30);
    expect(swingOf(oneStep, T0, 24, 0.001)).toBeLessThan(12);
  });

  it("still fills the box once the gauge really moves", () => {
    // The floor must not flatten a genuine signal. Ten steps of the same
    // quantum is real movement and has to read as such.
    const moved: HistoryPoint[] = Array.from({ length: 11 }, (_, i) => ({
      at: T0 - (10 - i) * HOUR,
      value: 253.336 + i * 0.001,
    }));
    // Not the full 38: rounding the bounds outward deliberately leaves
    // headroom, which is what makes "fills the box" mean something.
    expect(swingOf(moved, T0, 24, 0.001)).toBeGreaterThan(18);
  });

  it("holds the scale steady while the extremes only wobble", () => {
    // Per-frame rescaling mixed axis motion into the signal: the domain
    // was rebuilt from the window's exact extremes, so every frame in
    // which the peak drifted a little restretched everything else on
    // screen, and the viewer could not tell the gauge moving from the
    // scale moving. Rounded bounds only shift when the data crosses a
    // round number, so a wobbling peak moves nothing.
    //
    // A peak leaving the window entirely still rescales, and should —
    // that is a real change in what is on screen, not axis jitter.
    const peak: HistoryPoint[] = [
      { at: T0 - 20 * HOUR, value: 141 },
      { at: T0 - 10 * HOUR, value: 120 },
      { at: T0 - HOUR, value: 122 },
    ];
    const lower: HistoryPoint[] = [
      { at: T0 - 20 * HOUR, value: 140.6 },
      { at: T0 - 10 * HOUR, value: 120 },
      { at: T0 - HOUR, value: 122 },
    ];

    expect(levelsOf(pathOf(draw(lower, T0, 24))).at(-1)).toBe(
      levelsOf(pathOf(draw(peak, T0, 24))).at(-1),
    );
  });

  it("draws a long-unreported gauge exactly like a fresh one", () => {
    // Two days without a row is normal for a slow station, not a fault.
    // The chart says the same thing either way: the last recorded value,
    // held. Nothing about how long ago it was recorded changes the line —
    // the timestamp beside it is what carries that.
    const points: HistoryPoint[] = [{ at: T0 - 48 * HOUR, value: 253.336 }];
    const fresh = pathOf(draw(points, T0 - 47 * HOUR, 720));
    const long = pathOf(draw(points, T0, 720));

    expect(levelsOf(fresh)).toEqual(levelsOf(long));
    expect(JSON.stringify([fresh, long])).not.toContain("2 2");
  });

  it("shades the night behind the line", () => {
    const points: HistoryPoint[] = [{ at: T0 - 6 * HOUR, value: 253.336 }];
    // Fractions of the window, which is what nightBands hands over.
    const drawn = sparkline({
      points,
      at: T0,
      hours: 24,
      color: "#20b2aa",
      label: "test",
      nights: [{ left: 0.1, width: 0.3 }],
    });

    expect(nightBandsOf(drawn)).toBe(1);
    // Behind, not over: paint order is document order, and a z-index here
    // would pull the chart into the stacking competition it is kept out
    // of. Context belongs under the data either way.
    expect(nightIsBehindTheLine(drawn)).toBe(true);
  });

  it("draws exactly the bands it is handed", () => {
    // Whether a window is too wide to shade is nightBands' judgement, not
    // this module's — one definition, so the chart and the scrubber
    // cannot come to different conclusions. Here that means no filtering:
    // what arrives gets drawn.
    const points: HistoryPoint[] = [{ at: T0 - 6 * HOUR, value: 253.336 }];
    const drawn = sparkline({
      points,
      at: T0,
      hours: 24,
      color: "#20b2aa",
      label: "test",
      nights: [
        { left: 0, width: 0.2 },
        { left: 0.5, width: 0.2 },
      ],
    });

    expect(nightBandsOf(drawn)).toBe(2);
  });

  it("widens the time scale with the hours option", () => {
    // A per-entity graph_hours only means anything if the horizontal
    // scale follows it: the same point must land further right in a
    // wider window, because more of that window is behind it.
    const point: HistoryPoint[] = [{ at: T0 - 6 * HOUR, value: 253.336 }];
    const startX = (hours: number): number =>
      Number(pathOf(draw(point, T0, hours)).match(/^M ([\d.]+)/)?.[1]);

    expect(startX(720)).toBeGreaterThan(startX(24));
  });
});

describe("the card's graph gate", () => {
  /**
   * Source-level, in the style of card-styles.test.ts.
   *
   * renderReadout needs Lit and a DOM to exercise, and the suite runs on
   * neither. What can be pinned is the condition itself, which is the
   * thing that regressed: the graph must not depend on there being a
   * current reading. Whether anything is drawable is sparkline's call.
   */
  it("does not hide the graph when the reading is null", () => {
    expect(cardSource).not.toMatch(/show_graph !== false && reading !== null/);
  });

  it("still asks sparkline for the chart", () => {
    // The gate may only consult the two things that are about wanting a
    // chart. Anything about whether a reading resolved does not belong.
    expect(cardSource).toMatch(
      /const drawGraph =\s*row\.graph === true && this\.config\?\.show_graph !== false;/,
    );
  });
});
