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
  const values = (result as unknown as { values?: unknown[] })?.values ?? [];
  const found = values.find(
    (value) => typeof value === "string" && value.startsWith("M "),
  );
  return typeof found === "string" ? found : "";
}

/** Every `V y` command in a path, in order. */
function levelsOf(path: string): number[] {
  return [...path.matchAll(/V (-?[\d.]+)/g)].map((m) => Number(m[1]));
}

function draw(points: HistoryPoint[], at: number, hours: number) {
  return sparkline({ points, at, hours, color: "#20b2aa", label: "test" });
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

  it("puts the playhead at the right edge, not the middle", () => {
    // `graph_hours` is documented as history *behind* the playhead. A
    // centred window spent half its width on the future — at live, always
    // the flat hold-forward line — so a wide window showed half the
    // history it was asked for and read as frozen next to a fast gauge.
    const startX = (points: HistoryPoint[]): number =>
      Number(pathOf(draw(points, T0, 24)).match(/^M ([\d.]+)/)?.[1]);

    expect(startX([{ at: T0, value: 253.336 }])).toBeCloseTo(237, 0);
    expect(startX([{ at: T0 - 24 * HOUR, value: 253.336 }])).toBeCloseTo(3, 0);
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

  it("draws nothing before the gauge's first ever reading", () => {
    // The playhead sits before the first reading — the case for a sensor
    // added after the archive started. Under a trailing window there is
    // honestly nothing behind the playhead: the whole series is in the
    // future, and drawing it would show readings that had not been taken
    // yet. No chart is the right answer, and it agrees with resolveAt.
    //
    // The regression this file exists for is the *steady* gauge above,
    // where the window is empty but a value was in effect throughout —
    // that one still draws, via the anchor.
    const points: HistoryPoint[] = [
      { at: T0, value: 253.336 },
      { at: T0 + 2 * HOUR, value: 253.34 },
    ];
    const at = T0 - HOUR;

    expect(resolveAt(points, at, 2 * HOUR)).toBeNull();
    expect(windowAround(points, at, 24)).toEqual([]);
    expect(draw(windowAround(points, at, 24), at, 24)).toBeNull();
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
    expect(cardSource).toMatch(/row\.graph && this\.config\?\.show_graph !== false/);
  });
});
