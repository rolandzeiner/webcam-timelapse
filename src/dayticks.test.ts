import { describe, expect, it } from "vitest";

import { dayTicks, formatClock, formatStamp, labelEvery, labelWidthFor } from "./dayticks";
import { EMPTY_INDEX, type FrameIndex } from "./frames";

const VIENNA = "Europe/Vienna";
const STEP = 600;

/** An index covering `days` days starting at a given local midnight. */
function spanning(startIso: string, days: number): FrameIndex {
  const t0 = Math.floor(new Date(startIso).getTime() / 1000);
  return {
    ...EMPTY_INDEX,
    base: "/frames/",
    t0,
    step: STEP,
    count: (days * 86400) / STEP,
  };
}

/** Distinct local calendar dates in the window, minus the first.
 *
 * Derived rather than hardcoded on purpose: how many midnights fall inside
 * a fixed number of SECONDS depends on whether a DST transition shortened
 * or lengthened one of the days, which is exactly what these tests probe.
 */
function expectedBoundaries(index: FrameIndex, timeZone: string): number {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dates = new Set<string>();
  for (let i = 0; i < index.count; i++) {
    dates.add(fmt.format(new Date((index.t0! + i * STEP) * 1000)));
  }
  return dates.size - 1;
}

describe("DST correctness", () => {
  // The reason this module exists. Deriving ticks by adding 86400 to t0
  // assumes every day is 24 hours; Europe/Vienna has a 23-hour day on
  // 2026-03-29 and a 25-hour day on 2026-10-25, so every tick after a
  // transition would drift by an hour and the timeline would quietly lie.

  it("puts ticks at real local midnights across the spring-forward day", () => {
    // 2026-03-28 00:00 local = 2026-03-27T23:00Z (CET, UTC+1)
    const index = spanning("2026-03-27T23:00:00Z", 4);
    const ticks = dayTicks(index, VIENNA, "de-AT", 800);

    for (const tick of ticks) {
      const slot = index.t0! + tick.position * STEP;
      const local = new Intl.DateTimeFormat("en-GB", {
        timeZone: VIENNA,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(slot * 1000));
      expect(local).toBe("00:00");
    }
    expect(ticks.length).toBe(expectedBoundaries(index, VIENNA));
  });

  it("puts ticks at real local midnights across the fall-back day", () => {
    // 2026-10-24 00:00 local = 2026-10-23T22:00Z (CEST, UTC+2)
    const index = spanning("2026-10-23T22:00:00Z", 4);
    const ticks = dayTicks(index, VIENNA, "de-AT", 800);

    for (const tick of ticks) {
      const slot = index.t0! + tick.position * STEP;
      const local = new Intl.DateTimeFormat("en-GB", {
        timeZone: VIENNA,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(slot * 1000));
      expect(local).toBe("00:00");
    }
    expect(ticks.length).toBe(expectedBoundaries(index, VIENNA));
  });

  it("spaces the 25-hour day by more slots than a normal day", () => {
    const index = spanning("2026-10-23T22:00:00Z", 4);
    const ticks = dayTicks(index, VIENNA, "de-AT", 800);
    const gaps = ticks.slice(1).map((t, n) => t.position - ticks[n]!.position);

    // 24 h = 144 slots, 25 h = 150. A naive +86400 would give 144 twice.
    expect(gaps).toContain(150);
  });

  it("honours the requested timezone rather than the host's", () => {
    const index = spanning("2026-08-01T00:00:00Z", 3);
    const vienna = dayTicks(index, VIENNA, "de-AT", 800);
    const tokyo = dayTicks(index, "Asia/Tokyo", "de-AT", 800);

    expect(vienna[0]!.position).not.toBe(tokyo[0]!.position);
  });
});

describe("tick structure", () => {
  it("returns nothing for an empty archive", () => {
    expect(dayTicks(EMPTY_INDEX, VIENNA, "de-AT", 800)).toEqual([]);
  });

  it("places ticks proportionally along the track", () => {
    const index = spanning("2026-08-01T00:00:00Z", 4);
    const ticks = dayTicks(index, VIENNA, "de-AT", 800);

    for (const tick of ticks) {
      expect(tick.left).toBeGreaterThan(0);
      expect(tick.left).toBeLessThan(100);
    }
    expect(ticks.map((t) => t.left)).toEqual(
      [...ticks.map((t) => t.left)].sort((a, b) => a - b),
    );
  });

  it("always keeps the label on a month boundary", () => {
    // Spans 30 Jul → 3 Aug, so 1 August falls inside the window.
    const index = spanning("2026-07-29T22:00:00Z", 5);
    const ticks = dayTicks(index, VIENNA, "de-AT", 200);
    const monthStart = ticks.find((t) => t.isMonthStart);

    expect(monthStart).toBeDefined();
    expect(monthStart!.label).not.toBe("");
  });
});

describe("label thinning", () => {
  it("drops to shorter forms as the track narrows", () => {
    expect(labelWidthFor(800)).toBe("long");
    expect(labelWidthFor(560)).toBe("long");
    expect(labelWidthFor(480)).toBe("short");
    expect(labelWidthFor(320)).toBe("date");
  });

  it("labels every day when they all fit", () => {
    expect(labelEvery(4, 800, 110)).toBe(1);
  });

  it("skips days when they would collide", () => {
    expect(labelEvery(14, 320, 110)).toBeGreaterThan(1);
  });

  it("never returns zero, which would be an infinite label", () => {
    expect(labelEvery(0, 100, 110)).toBe(1);
    expect(labelEvery(99, 10, 110)).toBeGreaterThanOrEqual(1);
  });

  it("renders every tick even when labels are thinned", () => {
    const index = spanning("2026-08-01T00:00:00Z", 14);
    const ticks = dayTicks(index, VIENNA, "de-AT", 300);

    expect(ticks.length).toBe(expectedBoundaries(index, VIENNA));
    expect(ticks.some((t) => t.label === "")).toBe(true);
    expect(ticks.some((t) => t.label !== "")).toBe(true);
  });
});

describe("formatting", () => {
  const slot = Math.floor(new Date("2026-08-01T10:30:00Z").getTime() / 1000);

  it("formats a scrubber stamp in the camera's timezone", () => {
    // 10:30Z is 12:30 in Vienna (CEST).
    expect(formatStamp(slot, VIENNA, "de-AT")).toContain("12:30");
  });

  it("formats a compact clock", () => {
    expect(formatClock(slot, VIENNA, "de-AT")).toBe("12:30");
  });
});
