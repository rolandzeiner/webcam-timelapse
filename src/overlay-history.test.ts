import { describe, expect, it } from "vitest";

import {
  type HistoryPoint,
  resolveAt,
  seriesStats,
  stalenessThreshold,
  windowAround,
} from "./overlay-history";
import { formatExtent, formatSpan, safeImageUri } from "./utils";

const HOUR = 3_600_000;
const T0 = Date.UTC(2026, 7, 1, 12, 0, 0);

const hourly: HistoryPoint[] = [
  { at: T0, value: 137 },
  { at: T0 + HOUR, value: 138 },
  { at: T0 + 2 * HOUR, value: 141 },
];

describe("resolveAt", () => {
  it("holds the last known reading between measurements", () => {
    // The gauges report hourly. Half an hour after a reading the value in
    // effect is still that reading — not an interpolation towards the next
    // one, which was never measured.
    const resolved = resolveAt(hourly, T0 + HOUR / 2, 2 * HOUR);
    expect(resolved?.value).toBe(137);
    expect(resolved?.at).toBe(T0);
  });

  it("returns an exact hit unchanged", () => {
    expect(resolveAt(hourly, T0 + HOUR, 2 * HOUR)?.value).toBe(138);
  });

  it("never interpolates", () => {
    // Between 138 and 141 there is no 139 or 140 anywhere.
    for (let m = 0; m < 60; m += 5) {
      const value = resolveAt(hourly, T0 + HOUR + m * 60_000, 2 * HOUR)?.value;
      expect(value).toBe(138);
    }
  });

  it("returns null before the first reading", () => {
    // Honest "no data yet" rather than back-projecting the earliest value
    // onto frames that predate it.
    expect(resolveAt(hourly, T0 - 1, 2 * HOUR)).toBeNull();
  });

  it("holds the last reading past the end, flagged stale", () => {
    const resolved = resolveAt(hourly, T0 + 10 * HOUR, 2 * HOUR);
    expect(resolved?.value).toBe(141);
    expect(resolved?.stale).toBe(true);
  });

  it("does not flag a fresh reading as stale", () => {
    expect(resolveAt(hourly, T0 + HOUR + 60_000, 2 * HOUR)?.stale).toBe(false);
  });

  it("handles an empty series", () => {
    expect(resolveAt([], T0, HOUR)).toBeNull();
  });

  it("handles a single reading", () => {
    const one = [{ at: T0, value: 7 }];
    expect(resolveAt(one, T0 + HOUR, 2 * HOUR)?.value).toBe(7);
    expect(resolveAt(one, T0 - HOUR, 2 * HOUR)).toBeNull();
  });

  it("binary search agrees with a linear scan", () => {
    const many: HistoryPoint[] = Array.from({ length: 500 }, (_, i) => ({
      at: T0 + i * 60_000,
      value: i,
    }));
    for (const probe of [0, 1, 250, 499, 700]) {
      const at = T0 + probe * 60_000 + 30_000;
      const expected = many.filter((p) => p.at <= at).pop() ?? null;
      expect(resolveAt(many, at, HOUR)?.at ?? null).toBe(expected?.at ?? null);
    }
  });
});

describe("stalenessThreshold", () => {
  it("derives from the series' own cadence", () => {
    // A minutely sensor should be considered stale far sooner than an
    // hourly one; a fixed threshold would be wrong for one of them.
    const minutely: HistoryPoint[] = Array.from({ length: 10 }, (_, i) => ({
      at: T0 + i * 60_000,
      value: i,
    }));
    const sixHourly: HistoryPoint[] = Array.from({ length: 10 }, (_, i) => ({
      at: T0 + i * 6 * HOUR,
      value: i,
    }));
    expect(stalenessThreshold(sixHourly)).toBeGreaterThan(
      stalenessThreshold(minutely),
    );
  });

  it("applies a floor so a sparse series does not flag everything", () => {
    expect(stalenessThreshold(hourly.slice(0, 2))).toBe(5_400_000);
    expect(stalenessThreshold([])).toBe(5_400_000);
  });
});

describe("windowAround", () => {
  it("keeps only points inside the window", () => {
    // Window is [T0-1h, T0+1h] — trailing, so it ends at the playhead.
    const points = windowAround(hourly, T0 + HOUR, 2);
    expect(points.map((p) => p.value)).toEqual([137, 138]);
  });

  it("excludes points outside it", () => {
    expect(windowAround(hourly, T0, 1).map((p) => p.value)).toEqual([137]);
  });

  it("ends at the playhead rather than straddling it", () => {
    // Nothing ahead of the playhead may appear. The 141 is two hours into
    // the future here, and a chart that showed it would be claiming a
    // reading that has not been taken at the moment being scrubbed to.
    expect(windowAround(hourly, T0 + HOUR, 24).map((p) => p.value)).toEqual([
      137, 138,
    ]);
  });

  it("carries the reading in effect when the window opens", () => {
    // Window is [T0+1.5h, T0+3.5h]. Only the 141 falls inside it; the 138
    // before it is the value that was standing as the window opened and
    // has to come along, or the line starts in mid-air.
    const points = windowAround(hourly, T0 + 3.5 * HOUR, 2);
    expect(points.map((p) => p.value)).toEqual([138, 141]);
  });

  it("clamps the anchor to the window start", () => {
    // The anchor is not a measurement — it is the value already in effect
    // at `from`. Dated at its real time it would scale off-canvas.
    const from = T0 + 2.5 * HOUR;
    const [anchor] = windowAround(hourly, T0 + 4.5 * HOUR, 2);
    expect(anchor).toEqual({ at: from, value: 141 });
  });

  it("adds no anchor when a reading lands on the window start", () => {
    // The 138 sits exactly at `from`; anchoring would stack a second
    // point on the same x for nothing.
    expect(windowAround(hourly, T0 + 3 * HOUR, 2)).toEqual(hourly.slice(1));
  });

  it("adds no anchor when nothing precedes the window", () => {
    expect(windowAround(hourly, T0 + HOUR, 2)).toEqual(hourly.slice(0, 2));
    expect(windowAround(hourly, T0 - 10 * HOUR, 2)).toEqual([]);
  });

  it("keeps a steady gauge in the window", () => {
    // The groundwater regression. The recorder stores changes, so a gauge
    // that has not moved for days has zero rows inside any recent window
    // — but it still has a value throughout it. Before the anchor this
    // returned [] and the sparkline vanished, which read as a dead sensor.
    const steady: HistoryPoint[] = [{ at: T0, value: 253.336 }];
    const twoDaysLater = T0 + 48 * HOUR;

    expect(windowAround(steady, twoDaysLater, 24)).toEqual([
      { at: twoDaysLater - 24 * HOUR, value: 253.336 },
    ]);
  });
});

describe("seriesStats", () => {
  it("reads the quantum off the series' own deltas", () => {
    const millimetres: HistoryPoint[] = Array.from({ length: 20 }, (_, i) => ({
      at: T0 + i * HOUR,
      value: 253.336 + i * 0.001,
    }));
    expect(seriesStats(millimetres).quantum).toBeCloseTo(0.001, 6);
  });

  it("survives binary floating point", () => {
    // 253.336 − 253.335 is 0.0009999999998, and flooring that to a 1-2-5
    // value lands a whole decade low. This is the case that makes a
    // naive smallest-delta estimator useless on real sensor data.
    const drifting: HistoryPoint[] = [
      { at: T0, value: 253.335 },
      { at: T0 + HOUR, value: 253.336 },
      { at: T0 + 2 * HOUR, value: 253.337 },
      { at: T0 + 3 * HOUR, value: 253.338 },
    ];
    expect(seriesStats(drifting).quantum).toBeCloseTo(0.001, 6);
  });

  it("ignores one hair-splitting delta among many", () => {
    // The tenth percentile, not the minimum: a single anomalous reading
    // would otherwise define the quantum for the whole series and defeat
    // the floor that depends on it.
    const mostlyWhole: HistoryPoint[] = Array.from({ length: 30 }, (_, i) => ({
      at: T0 + i * HOUR,
      value: 100 + i,
    }));
    mostlyWhole.push({ at: T0 + 30 * HOUR, value: 130.0001 });
    expect(seriesStats(mostlyWhole).quantum).toBeGreaterThan(0.5);
  });

  it("reports no quantum for a series that never moved", () => {
    const flat: HistoryPoint[] = [
      { at: T0, value: 7 },
      { at: T0 + HOUR, value: 7 },
    ];
    expect(seriesStats(flat).quantum).toBe(0);
    expect(seriesStats([]).quantum).toBe(0);
  });

  it("computes once per series identity", () => {
    // The whole point: this used to run inside the row loop on every
    // rendered frame, sorting the entire fetched history each time.
    expect(seriesStats(hourly)).toBe(seriesStats(hourly));
  });

  it("carries the same staleness threshold as before", () => {
    expect(seriesStats(hourly).staleAfter).toBe(stalenessThreshold(hourly));
  });
});

describe("formatExtent", () => {
  it("keeps two significant digits", () => {
    expect(formatExtent(0.009)).toBe("0.009");
    expect(formatExtent(0.0094)).toBe("0.0094");
    expect(formatExtent(1.234)).toBe("1.2");
  });

  it("does not eat trailing zeros outside a decimal", () => {
    // "40".replace(/0+$/, "") is "4" — a whole order of magnitude, from
    // a lazy strip. Worth a test of its own.
    expect(formatExtent(40)).toBe("40");
    expect(formatExtent(9)).toBe("9");
  });

  it("rounds large extents to whole units", () => {
    expect(formatExtent(1234)).toBe("1234");
  });

  it("has something to say about nothing", () => {
    expect(formatExtent(0)).toBe("0");
    expect(formatExtent(Number.NaN)).toBe("0");
  });
});

describe("formatSpan", () => {
  it("picks the unit from the size of the window", () => {
    expect(formatSpan(0.5)).toBe("30 min");
    expect(formatSpan(24)).toBe("24 h");
    expect(formatSpan(720)).toBe("30 d");
  });

  it("switches to days before the hours get silly", () => {
    expect(formatSpan(47)).toBe("47 h");
    expect(formatSpan(48)).toBe("2 d");
  });
});

describe("safeImageUri", () => {
  it("allows same-origin paths and https", () => {
    expect(safeImageUri("/api/camera_proxy/camera.x?token=1")).toBe(
      "/api/camera_proxy/camera.x?token=1",
    );
    expect(safeImageUri("https://example.invalid/a.jpg")).toBe(
      "https://example.invalid/a.jpg",
    );
  });

  it("refuses script and data URLs", () => {
    expect(safeImageUri("javascript:alert(1)")).toBeUndefined();
    expect(safeImageUri("data:image/png;base64,AAAA")).toBeUndefined();
    expect(safeImageUri("http://insecure.invalid/a.jpg")).toBeUndefined();
    expect(safeImageUri(undefined)).toBeUndefined();
  });
});
