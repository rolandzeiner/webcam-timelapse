import { describe, expect, it } from "vitest";

import {
  BASE_FPS,
  EMPTY_INDEX,
  FADE_MAX_SPEED,
  FADE_MS,
  fadeDurationMs,
  type FrameIndex,
  hasFrames,
  MAX_TICK_FPS,
  MIN_FRAME_MS,
  nextPlaybackPosition,
  nextPresent,
  playbackCadence,
  positionAt,
  prefetchDepth,
  prefetchWindow,
  presenceBitmap,
  shouldAutoplay,
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

describe("playbackCadence", () => {
  /**
   * Archive frames consumed per second of wall clock, which is the only
   * thing a viewer can actually perceive.
   *
   * Asserting on this rather than on `stride` or `frameDelay` individually
   * is deliberate: those two trade off against each other, so either alone
   * can look right while the product is wrong.
   */
  const framesPerSecond = (speed: number): number => {
    const { stride, frameDelay } = playbackCadence(speed);
    return (stride * 1000) / frameDelay;
  };

  /** Effective multiplier, where 1x is `BASE_FPS` frames per second. */
  const effectiveSpeed = (speed: number): number =>
    framesPerSecond(speed) / BASE_FPS;

  it("is exact below the decode ceiling", () => {
    for (const speed of [1, 2, 4, 8]) {
      expect(playbackCadence(speed).stride).toBe(1);
      expect(effectiveSpeed(speed)).toBeCloseTo(speed, 6);
    }
  });

  it("keeps every doubling of the label a real doubling of the rate", () => {
    // The bug this function exists to kill: 16x, 32x and 64x all clamped to
    // the same 33 ms tick at stride 1, so the top three buttons played at
    // one identical rate. Ratios, not absolutes, because the ceiling costs
    // 16x about 5% and that shortfall is honest.
    expect(effectiveSpeed(32) / effectiveSpeed(16)).toBeCloseTo(2, 1);
    expect(effectiveSpeed(64) / effectiveSpeed(32)).toBeCloseTo(2, 1);
    expect(effectiveSpeed(64) / effectiveSpeed(16)).toBeCloseTo(4, 1);
  });

  it("buys speed above the ceiling by skipping, never by painting sooner", () => {
    for (const speed of [1, 2, 4, 8, 16, 32, 64]) {
      // The decode floor is a hard wall: asking for a shorter tick than
      // this queues work that lands late and reads as stutter.
      expect(playbackCadence(speed).frameDelay).toBeGreaterThanOrEqual(
        MIN_FRAME_MS,
      );
      expect(framesPerSecond(speed)).toBeLessThanOrEqual(MAX_TICK_FPS * 4 + 1e-9);
    }
    // Everything at or above 32x pays for its speed in stride.
    expect(playbackCadence(32).stride).toBe(2);
    expect(playbackCadence(64).stride).toBe(4);
  });

  it("leaves 16x painting every frame", () => {
    // 16x wants 32 fps against a ~30 fps ceiling. Skipping every second
    // frame there would overshoot by far more than painting them all
    // undershoots, so it must stay at stride 1 — unchanged from before
    // strides existed.
    expect(playbackCadence(16)).toEqual({ stride: 1, frameDelay: MIN_FRAME_MS });
  });

  it("always advances by a whole positive number of frames", () => {
    for (const speed of [0, -4, 0.25, 1, 16, 64, 4096]) {
      const { stride } = playbackCadence(speed);
      expect(Number.isInteger(stride)).toBe(true);
      expect(stride).toBeGreaterThanOrEqual(1);
      expect(Number.isFinite(playbackCadence(speed).frameDelay)).toBe(true);
    }
  });
});

describe("nextPlaybackPosition", () => {
  /** All frames present, no outages. */
  const full = (count: number): Uint8Array => new Uint8Array(count).fill(1);

  it("advances by the stride it is given", () => {
    expect(nextPlaybackPosition(full(100), 10, 1)).toBe(11);
    expect(nextPlaybackPosition(full(100), 10, 2)).toBe(12);
    expect(nextPlaybackPosition(full(100), 10, 4)).toBe(14);
  });

  it("steps over an outage the stride lands inside", () => {
    const present = full(100);
    for (let i = 12; i < 20; i++) present[i] = 0;
    // Stride 4 from 10 aims at 14, which is a hole; playback must not
    // stall on blanks, it jumps to the far side of the gap.
    expect(nextPlaybackPosition(present, 10, 4)).toBe(20);
  });

  it("lands on the newest frame when a wide stride overshoots it", () => {
    // The regression a stride introduces: 64x jumps four at a time, so
    // from position 97 of 100 it clears the end entirely. Stopping there
    // would leave the last frames unwatchable at speed and never reach
    // the live edge.
    expect(nextPlaybackPosition(full(100), 97, 4)).toBe(99);
    expect(nextPlaybackPosition(full(100), 98, 2)).toBe(99);
  });

  it("stops once the newest frame is reached", () => {
    expect(nextPlaybackPosition(full(100), 99, 1)).toBeNull();
    expect(nextPlaybackPosition(full(100), 99, 4)).toBeNull();
    expect(nextPlaybackPosition(new Uint8Array(0), 0, 4)).toBeNull();
  });

  it("ignores trailing blanks rather than treating them as the end", () => {
    const present = full(100);
    for (let i = 90; i < 100; i++) present[i] = 0;
    // 89 is the newest frame that exists; the overshoot fallback must
    // find it, and must then terminate on it.
    expect(nextPlaybackPosition(present, 87, 4)).toBe(89);
    expect(nextPlaybackPosition(present, 89, 4)).toBeNull();
  });

  it("never hands the playback loop a position that is not progress", () => {
    // The loop treats any non-null result as an advance, so a value at or
    // behind the playhead would spin it forever on one frame.
    const present = full(50);
    for (const hole of [7, 8, 9, 30, 31]) present[hole] = 0;
    for (const stride of [1, 2, 4, 8]) {
      for (let position = 0; position < 50; position++) {
        const next = nextPlaybackPosition(present, position, stride);
        if (next !== null) expect(next).toBeGreaterThan(position);
      }
    }
  });

  it("terminates from every starting position at every stride", () => {
    const present = full(40);
    for (const hole of [5, 6, 20, 21, 22, 39]) present[hole] = 0;
    for (const stride of [1, 2, 3, 4, 8, 64]) {
      let position = 0;
      let steps = 0;
      for (;;) {
        const next = nextPlaybackPosition(present, position, stride);
        if (next === null) break;
        position = next;
        expect(++steps).toBeLessThanOrEqual(present.length);
      }
      // Wherever it stopped, it stopped on the newest surviving frame.
      expect(position).toBe(38);
    }
  });
});

describe("prefetchWindow", () => {
  const full = (count: number): Uint8Array => new Uint8Array(count).fill(1);

  it("fills the whole window from a standing start", () => {
    expect(prefetchWindow(full(100), 0, 4, 1, -1)).toEqual([1, 2, 3, 4]);
    expect(prefetchWindow(full(100), 0, 4, 2, -1)).toEqual([2, 4, 6, 8]);
  });

  it("asks for one frame per tick once the window is full", () => {
    // The fix. Playback advances by `stride` and the window slides by the
    // same amount, so exactly one position enters it per tick. Re-issuing
    // all 16 was ~485 requests a second at 32x against a cold cache.
    const present = full(500);
    for (const stride of [1, 2, 4]) {
      let through = -1;
      let position = 0;
      // Prime the window, then measure the steady state.
      for (const target of prefetchWindow(present, position, 16, stride, through)) {
        through = target;
      }
      for (let tick = 0; tick < 20; tick++) {
        position += stride;
        const targets = prefetchWindow(present, position, 16, stride, through);
        expect(targets).toHaveLength(1);
        through = targets[0] ?? through;
      }
    }
  });

  it("never re-requests a frame it already asked for", () => {
    const present = full(200);
    const seen = new Set<number>();
    let through = -1;
    for (let position = 0; position < 100; position += 2) {
      for (const target of prefetchWindow(present, position, 8, 2, through)) {
        expect(seen.has(target)).toBe(false);
        seen.add(target);
        through = target;
      }
    }
    expect(seen.size).toBeGreaterThan(0);
  });

  it("refills after the playhead jumps backwards", () => {
    // Scrubbing back leaves `through` beyond the new window. Treating that
    // as "already fetched" would starve playback of every frame ahead of
    // it, so a stale marker has to be discarded rather than trusted.
    const present = full(300);
    const through = 250;
    expect(prefetchWindow(present, 10, 4, 1, through)).toEqual([11, 12, 13, 14]);
  });

  it("keeps its place on a small step that stays inside the window", () => {
    // Those frames are already in flight or cached; re-requesting them is
    // the waste this function exists to avoid.
    expect(prefetchWindow(full(300), 10, 8, 1, 14)).toEqual([15, 16, 17, 18]);
  });

  it("collapses strided targets that a gap lands on the same frame", () => {
    const present = full(100);
    for (let i = 11; i < 30; i++) present[i] = 0;
    // Targets 12, 14, 16 … all resolve to 30; it must be asked for once.
    const targets = prefetchWindow(present, 10, 6, 2, -1);
    expect(new Set(targets).size).toBe(targets.length);
    expect(targets[0]).toBe(30);
  });

  it("stops at the end of the archive instead of running off it", () => {
    expect(prefetchWindow(full(20), 17, 8, 1, -1)).toEqual([18, 19]);
    expect(prefetchWindow(full(20), 19, 8, 1, -1)).toEqual([]);
    expect(prefetchWindow(new Uint8Array(0), 0, 8, 1, -1)).toEqual([]);
  });

  it("never hands back a position behind the playhead", () => {
    const present = full(120);
    for (const hole of [12, 13, 40]) present[hole] = 0;
    for (const stride of [1, 2, 4]) {
      for (let position = 0; position < 110; position++) {
        for (const target of prefetchWindow(present, position, 8, stride, -1)) {
          expect(target).toBeGreaterThan(position);
        }
      }
    }
  });
});

describe("shouldAutoplay", () => {
  const base = { configured: true, reducedMotion: false, alreadyPlaying: false };

  it("starts when the card asks for it", () => {
    expect(shouldAutoplay(base)).toBe(true);
  });

  it("stays put when it does not", () => {
    expect(shouldAutoplay({ ...base, configured: false })).toBe(false);
  });

  it("refuses under prefers-reduced-motion, whatever the config says", () => {
    // The override the option's own help text promises: a card that
    // begins animating by itself is the exact thing that setting exists
    // to prevent.
    expect(shouldAutoplay({ ...base, reducedMotion: true })).toBe(false);
  });

  it("does not restart something already playing", () => {
    expect(shouldAutoplay({ ...base, alreadyPlaying: true })).toBe(false);
  });
});

describe("fadeDurationMs", () => {
  const playing = { playing: true, reducedMotion: false };
  const idle = { playing: false, reducedMotion: false };
  /**
   * The card's own budget.
   *
   * Taken from `playbackCadence` rather than recomputed here, so the test
   * cannot keep passing against a formula the card no longer uses.
   */
  const budget = (speed: number): number => playbackCadence(speed).frameDelay;

  it("never lets a fade outlast the frame budget", () => {
    // The whole point. A fade longer than the budget is cut off by the
    // next swap, so both layers stay part-opaque and the stage ghosts
    // permanently — the bug a fixed 160 ms transition had from 4x up.
    for (const speed of [1, 2, 4, 8, 16, 32, 64]) {
      expect(fadeDurationMs(speed, budget(speed), playing)).toBeLessThanOrEqual(
        budget(speed),
      );
    }
  });

  it("cuts rather than blends once playback approaches video rates", () => {
    expect(fadeDurationMs(FADE_MAX_SPEED + 1, budget(8), playing)).toBe(0);
    expect(fadeDurationMs(32, budget(32), playing)).toBe(0);
  });

  it("blends at the speeds a human actually watches", () => {
    expect(fadeDurationMs(1, budget(1), playing)).toBeGreaterThan(0);
    expect(fadeDurationMs(4, budget(4), playing)).toBeGreaterThan(0);
  });

  it("gives stepping and scrubbing the full blend", () => {
    // Nothing competes for the budget when playback is stopped, so the
    // speed selector must not shorten a single deliberate step.
    expect(fadeDurationMs(32, budget(32), idle)).toBe(FADE_MS);
    expect(fadeDurationMs(1, budget(1), idle)).toBe(FADE_MS);
  });

  it("is off entirely under prefers-reduced-motion", () => {
    // Checked here rather than in CSS: the transition is an inline style,
    // so a media query in the stylesheet could never override it.
    for (const state of [playing, idle]) {
      expect(
        fadeDurationMs(1, budget(1), { ...state, reducedMotion: true }),
      ).toBe(0);
    }
  });
});
