import { describe, expect, it } from "vitest";

import {
  type HistoryPoint,
  resolveAt,
  stalenessThreshold,
  windowAround,
} from "./overlay-history";
import { safeImageUri } from "./utils";

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
    const points = windowAround(hourly, T0 + HOUR, 2);
    expect(points.map((p) => p.value)).toEqual([137, 138, 141]);
  });

  it("excludes points outside it", () => {
    expect(windowAround(hourly, T0, 1).map((p) => p.value)).toEqual([137]);
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
