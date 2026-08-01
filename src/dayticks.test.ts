import { describe, expect, it } from "vitest";

import {
  dayTicks,
  formatClock,
  formatStamp,
  labelEvery,
  labelWidthFor,
  TIME_STEPS,
  timeStepFor,
  timeTicks,
} from "./dayticks";
import { EMPTY_INDEX, type FrameIndex } from "./frames";

const VIENNA = "Europe/Vienna";
const STEP = 600;

/** Local wall clock, "HH:MM", for a tick on a given index. */
function clockAt(index: FrameIndex, position: number, timeZone = VIENNA): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date((index.t0! + position * index.step) * 1000));
}

/** Seconds since local midnight for a tick, derived from its wall clock. */
function secondsOfDayAt(index: FrameIndex, position: number): number {
  const [hour, minute] = clockAt(index, position).split(":").map(Number);
  return (hour === 24 ? 0 : hour!) * 3600 + minute! * 60;
}

/** The spacing timeTicks will have chosen for this index and width. */
function chosenStep(index: FrameIndex, trackPx: number): number {
  const span = (index.count - 1) * index.step;
  const step = timeStepFor(span, index.step, trackPx);
  expect(step).not.toBeNull();
  return step!;
}

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

describe("timeStepFor", () => {
  it("only ever picks a spacing that divides evenly into a day", () => {
    // The property the ruler's readability rests on: ticks land on round
    // clock times and repeat identically on every day of the window.
    for (const step of TIME_STEPS) {
      expect(86400 % step).toBe(0);
    }
  });

  it("picks a coarser spacing as the window lengthens", () => {
    const hour = timeStepFor(6 * 3600, 600, 600);
    const fortnight = timeStepFor(14 * 86400, 600, 600);
    expect(hour).not.toBeNull();
    expect(fortnight).not.toBeNull();
    expect(fortnight!).toBeGreaterThan(hour!);
  });

  it("picks a coarser spacing as the card narrows", () => {
    const wide = timeStepFor(2 * 86400, 600, 900);
    const narrow = timeStepFor(2 * 86400, 600, 200);
    expect(narrow!).toBeGreaterThanOrEqual(wide!);
  });

  it("never goes finer than the capture grid", () => {
    // A mark between two frames would point at an instant the archive
    // cannot show.
    expect(timeStepFor(4 * 3600, 3600, 2000)).toBeGreaterThanOrEqual(3600);
  });

  it("gives up rather than smearing when nothing fits", () => {
    // A long archive in a narrow card: the day ticks carry it alone.
    expect(timeStepFor(60 * 86400, 600, 120)).toBeNull();
    expect(timeStepFor(0, 600, 600)).toBeNull();
  });
});

describe("timeTicks", () => {
  it("returns nothing for an empty archive", () => {
    expect(timeTicks(EMPTY_INDEX, VIENNA, "de-AT", 800)).toEqual([]);
  });

  it("lands every mark on an exact multiple of the spacing", () => {
    const index = spanning("2026-08-01T00:00:00Z", 2);
    const step = chosenStep(index, 800);
    const ticks = timeTicks(index, VIENNA, "de-AT", 800);

    expect(ticks.length).toBeGreaterThan(0);
    for (const tick of ticks) {
      expect(secondsOfDayAt(index, tick.position) % step).toBe(0);
    }
  });

  it("leaves midnight to the day tick", () => {
    // Midnight already carries a taller mark and a date label; a clock
    // label there would just be a second, worse answer to the same
    // question.
    const index = spanning("2026-08-01T00:00:00Z", 3);
    for (const tick of timeTicks(index, VIENNA, "de-AT", 800)) {
      expect(clockAt(index, tick.position)).not.toBe("00:00");
    }
  });

  it("stays inside the track", () => {
    const index = spanning("2026-08-01T00:00:00Z", 5);
    for (const tick of timeTicks(index, VIENNA, "de-AT", 800)) {
      expect(tick.left).toBeGreaterThanOrEqual(0);
      expect(tick.left).toBeLessThanOrEqual(100);
    }
  });

  it("re-aligns to the spacing after a DST shift", () => {
    // The failure this guards: accumulating a fixed interval from the
    // first mark carries the one-hour shift forward, so after the
    // transition a two-hour ruler reads 01:00, 03:00, 05:00 instead of
    // 00:00, 02:00, 04:00 — still on the hour, so a "ends in :00" check
    // would pass while the ruler quietly lied for the rest of the window.
    // Testing against the spacing is what actually distinguishes them.
    const index = spanning("2026-10-23T22:00:00Z", 4); // spans the 25-hour day
    const step = chosenStep(index, 800);
    const ticks = timeTicks(index, VIENNA, "de-AT", 800);

    expect(ticks.length).toBeGreaterThan(0);
    for (const tick of ticks) {
      expect(secondsOfDayAt(index, tick.position) % step).toBe(0);
    }
    // And it must still MARK the tail of the window. Alignment alone is
    // satisfied vacuously by an implementation that drifts off the grid
    // and then emits nothing for the rest of the archive.
    expect(ticks.some((tick) => tick.left > 75)).toBe(true);
  });

  it("re-aligns to the spacing after the spring-forward shift too", () => {
    const index = spanning("2026-03-27T23:00:00Z", 4); // spans the 23-hour day
    const step = chosenStep(index, 800);
    const ticks = timeTicks(index, VIENNA, "de-AT", 800);

    for (const tick of ticks) {
      expect(secondsOfDayAt(index, tick.position) % step).toBe(0);
    }
    expect(ticks.some((tick) => tick.left > 75)).toBe(true);
  });

  it("labels only some marks, but always at the same clock times", () => {
    const index = spanning("2026-08-01T00:00:00Z", 6);
    const ticks = timeTicks(index, VIENNA, "de-AT", 700);
    const labelled = ticks.filter((tick) => tick.label !== "");

    expect(labelled.length).toBeGreaterThan(0);
    expect(labelled.length).toBeLessThan(ticks.length);
    // Anchored to midnight, not to the first tick, so the labelled times
    // repeat day to day instead of drifting.
    expect(new Set(labelled.map((tick) => tick.label)).size).toBeLessThan(
      labelled.length,
    );
  });

  it("still answers 'what time is this' on a long window", () => {
    // Regression: the label interval scaled with the window until it hit
    // 24 h, at which point the only eligible instant was midnight — and
    // midnight is skipped in favour of the day tick. A fortnight of marks
    // rendered with no clock label anywhere, which is the one thing the
    // ruler exists to show.
    for (const px of [260, 400, 600, 900]) {
      const index = spanning("2026-08-01T00:00:00Z", 14);
      const labelled = timeTicks(index, VIENNA, "de-AT", px).filter(
        (tick) => tick.label !== "",
      );
      expect(labelled.length).toBeGreaterThan(0);
    }
  });

  it("never places two labels closer than they can be read", () => {
    for (const days of [1, 3, 14]) {
      for (const px of [260, 400, 600, 900]) {
        const index = spanning("2026-08-01T00:00:00Z", days);
        const labelled = timeTicks(index, VIENNA, "de-AT", px).filter(
          (tick) => tick.label !== "",
        );
        for (let i = 1; i < labelled.length; i++) {
          const gapPx = ((labelled[i]!.left - labelled[i - 1]!.left) / 100) * px;
          expect(gapPx).toBeGreaterThanOrEqual(45);
        }
      }
    }
  });

  it("does not crowd a narrow card", () => {
    const index = spanning("2026-08-01T00:00:00Z", 14);
    const wide = timeTicks(index, VIENNA, "de-AT", 900);
    const narrow = timeTicks(index, VIENNA, "de-AT", 260);
    expect(narrow.length).toBeLessThanOrEqual(wide.length);
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
