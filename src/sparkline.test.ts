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

  it("holds a flat series at a constant level", () => {
    // max === min, so the range guard kicks in. The line must stay level
    // rather than divide by zero and vanish.
    const flat: HistoryPoint[] = [
      { at: T0, value: 253.336 },
      { at: T0 + HOUR, value: 253.336 },
      { at: T0 + 2 * HOUR, value: 253.336 },
    ];
    const levels = levelsOf(pathOf(draw(flat, T0 + HOUR, 24)));
    expect(levels.length).toBeGreaterThan(0);
    expect(new Set(levels).size).toBe(1);
    expect(levels.every(Number.isFinite)).toBe(true);
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
    // no *value* at that instant, but there is plenty of history, and the
    // chart is the thing that shows it.
    const points: HistoryPoint[] = [
      { at: T0, value: 253.336 },
      { at: T0 + 2 * HOUR, value: 253.34 },
    ];
    const at = T0 - HOUR;

    expect(resolveAt(points, at, 2 * HOUR)).toBeNull();
    expect(draw(windowAround(points, at, 24), at, 24)).not.toBeNull();
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
