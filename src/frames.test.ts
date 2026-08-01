import { describe, expect, it } from "vitest";

import {
  EMPTY_INDEX,
  type FrameIndex,
  hasFrames,
  nextPresent,
  positionAt,
  prefetchDepth,
  presenceBitmap,
  slotAt,
  timeAt,
  urlAt,
} from "./frames";

const T0 = 1_785_585_600;

function index(overrides: Partial<FrameIndex> = {}): FrameIndex {
  return {
    ...EMPTY_INDEX,
    base: "/webcam_timelapse_frames/abc/",
    t0: T0,
    count: 10,
    ...overrides,
  };
}

describe("slot addressing", () => {
  it("maps grid positions to epoch slots", () => {
    const i = index();
    expect(slotAt(i, 0)).toBe(T0);
    expect(slotAt(i, 3)).toBe(T0 + 1800);
    expect(slotAt(i, 9)).toBe(T0 + 5400);
  });

  it("returns null outside the archive", () => {
    const i = index();
    expect(slotAt(i, -1)).toBeNull();
    expect(slotAt(i, 10)).toBeNull();
    expect(slotAt(index({ t0: null, count: 0 }), 0)).toBeNull();
  });

  it("builds frame URLs the integration actually serves", () => {
    expect(urlAt(index(), 2)).toBe(
      `/webcam_timelapse_frames/abc/${T0 + 1200}.webp`,
    );
  });

  it("exposes milliseconds for Intl formatting", () => {
    expect(timeAt(index(), 1)).toBe((T0 + 600) * 1000);
  });

  it("round-trips a position through time and back", () => {
    const i = index();
    for (const position of [0, 1, 5, 9]) {
      expect(positionAt(i, timeAt(i, position)!)).toBe(position);
    }
  });

  it("clamps a timestamp outside the window onto the ends", () => {
    const i = index();
    expect(positionAt(i, (T0 - 99999) * 1000)).toBe(0);
    expect(positionAt(i, (T0 + 99999) * 1000)).toBe(9);
  });

  it("snaps a timestamp between slots to the nearest one", () => {
    const i = index();
    // 100 s past slot 1 is still nearest slot 1; 400 s past is nearer slot 2.
    expect(positionAt(i, (T0 + 600 + 100) * 1000)).toBe(1);
    expect(positionAt(i, (T0 + 600 + 400) * 1000)).toBe(2);
  });

  it("knows when the archive is empty", () => {
    expect(hasFrames(EMPTY_INDEX)).toBe(false);
    expect(hasFrames(index())).toBe(true);
  });
});

describe("presence bitmap", () => {
  it("marks every slot present when there are no gaps", () => {
    expect([...presenceBitmap(index({ count: 4 }))]).toEqual([1, 1, 1, 1]);
  });

  it("clears run-length-encoded holes", () => {
    const bitmap = presenceBitmap(index({ count: 7, gaps: [[2, 3]] }));
    expect([...bitmap]).toEqual([1, 1, 0, 0, 0, 1, 1]);
  });

  it("handles several holes", () => {
    const bitmap = presenceBitmap(
      index({ count: 8, gaps: [[1, 1], [4, 2]] }),
    );
    expect([...bitmap]).toEqual([1, 0, 1, 1, 0, 0, 1, 1]);
  });

  it("does not run off the end on an over-long gap", () => {
    const bitmap = presenceBitmap(index({ count: 3, gaps: [[1, 99]] }));
    expect([...bitmap]).toEqual([1, 0, 0]);
  });
});

describe("nextPresent", () => {
  const bitmap = Uint8Array.from([1, 0, 0, 0, 1, 1, 0, 1]);

  it("returns the starting position when it already holds a frame", () => {
    expect(nextPresent(bitmap, 0)).toBe(0);
    expect(nextPresent(bitmap, 4)).toBe(4);
  });

  it("skips a whole outage in one step", () => {
    // Playback must not stall for the length of the gap.
    expect(nextPresent(bitmap, 1)).toBe(4);
  });

  it("searches backwards too", () => {
    expect(nextPresent(bitmap, 3, -1)).toBe(0);
  });

  it("returns null when the search runs off the end", () => {
    expect(nextPresent(Uint8Array.from([1, 0, 0]), 1)).toBeNull();
    expect(nextPresent(bitmap, -1, -1)).toBeNull();
  });
});

describe("prefetchDepth", () => {
  it("scales with playback speed", () => {
    expect(prefetchDepth(1)).toBe(4);
    expect(prefetchDepth(2)).toBe(8);
  });

  it("is bounded at both ends so it cannot starve the current frame", () => {
    expect(prefetchDepth(0.25)).toBe(4);
    expect(prefetchDepth(99)).toBe(16);
  });
});
