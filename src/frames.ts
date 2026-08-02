/**
 * Frame-index maths: slot ↔ time ↔ URL, gap handling, preloading.
 *
 * Pure module — no DOM, no Lit, no `hass`. Everything the scrubber needs
 * to answer "which frame is at position i, and does it exist?" lives here
 * so it can be unit-tested without mounting a card.
 *
 * The archive is addressed as a DENSE grid: frame `i` is always at
 * `t0 + i * step`, whether or not it exists. Holes are delivered
 * run-length encoded and expanded once into a presence bitmap, which
 * keeps the wire payload tiny (a two-day outage is one pair) while making
 * lookups O(1) during a drag.
 */

/** The `webcam_timelapse/index` websocket response. */
export interface FrameIndex {
  base: string;
  ext: string;
  step: number;
  t0: number | null;
  count: number;
  gaps: [number, number][];
  retention_days: number;
  online: boolean;
  newest_slot: number | null;
}

export const EMPTY_INDEX: FrameIndex = {
  base: "",
  ext: ".webp",
  step: 600,
  t0: null,
  count: 0,
  gaps: [],
  retention_days: 0,
  online: true,
  newest_slot: null,
};

/** Epoch seconds for grid position `i`. */
export function slotAt(index: FrameIndex, i: number): number | null {
  if (index.t0 === null || i < 0 || i >= index.count) return null;
  return index.t0 + i * index.step;
}

/** Milliseconds for grid position `i`, for Date/Intl formatting. */
export function timeAt(index: FrameIndex, i: number): number | null {
  const slot = slotAt(index, i);
  return slot === null ? null : slot * 1000;
}

/** Grid position nearest to an epoch-millisecond timestamp, clamped. */
export function positionAt(index: FrameIndex, ms: number): number {
  if (index.t0 === null || index.count === 0) return 0;
  const raw = Math.round((ms / 1000 - index.t0) / index.step);
  return Math.min(Math.max(raw, 0), index.count - 1);
}

/** URL of the frame at grid position `i`. */
export function urlAt(index: FrameIndex, i: number): string | null {
  const slot = slotAt(index, i);
  return slot === null ? null : `${index.base}${slot}${index.ext}`;
}

/**
 * Expand run-length-encoded gaps into a presence bitmap.
 *
 * One byte per slot: 2 KB for a fortnight at ten-minute spacing, which is
 * far cheaper than re-scanning the gap ranges on every pointer move during
 * a drag.
 */
export function presenceBitmap(index: FrameIndex): Uint8Array {
  const present = new Uint8Array(index.count).fill(1);
  for (const [start, length] of index.gaps) {
    const from = Math.max(0, start);
    const to = Math.min(index.count, start + length);
    for (let i = from; i < to; i++) present[i] = 0;
  }
  return present;
}

/**
 * Next grid position that actually holds a frame.
 *
 * Playback uses this to step over an outage in one jump instead of
 * stalling on a run of blanks — a six-hour gap should not mean six hours
 * of nothing at 4× speed. Returns `null` when the search runs off the end,
 * which is the signal to stop (or loop).
 */
export function nextPresent(
  present: Uint8Array,
  from: number,
  direction: 1 | -1 = 1,
): number | null {
  for (let i = from; i >= 0 && i < present.length; i += direction) {
    if (present[i]) return i;
  }
  return null;
}

/** Whether the archive holds anything at all. */
export function hasFrames(index: FrameIndex): boolean {
  return index.t0 !== null && index.count > 0;
}

/**
 * A bounded ring of in-flight `Image` objects.
 *
 * Deliberately a *ring*, not a cache. The browser's own HTTP cache is the
 * real frame cache — the integration serves frames with long-lived
 * `Cache-Control` because they are immutable once written — so all this
 * has to do is keep a decode warm for the frames playback is about to
 * reach, and hold a reference long enough that the fetch is not cancelled.
 *
 * Holding decoded bitmaps instead would be a mistake: a decoded 1024×768
 * frame is ~3 MB, so even a modest 24-frame cache is 75 MB of heap on a
 * low-end tablet.
 */
export class PrefetchRing {
  private readonly slots: (HTMLImageElement | null)[];
  private cursor = 0;

  constructor(private readonly size: number) {
    this.slots = new Array<HTMLImageElement | null>(size).fill(null);
  }

  prefetch(url: string): void {
    const image = new Image();
    image.decoding = "async";
    image.fetchPriority = "low";
    image.src = url;
    this.slots[this.cursor] = image;
    this.cursor = (this.cursor + 1) % this.size;
  }

  clear(): void {
    this.slots.fill(null);
    this.cursor = 0;
  }
}

/**
 * How many frames ahead to prefetch at a given speed.
 *
 * Scales with playback rate so fast playback stays ahead of itself, but is
 * capped: an unbounded window would queue hundreds of requests on a long
 * archive and starve the frame actually being displayed.
 *
 * The cap is what makes this correct above the decode ceiling rather than
 * merely safe. Ticks per second are flat at `MAX_TICK_FPS` from 16x up, so
 * the number of *paints* the window has to cover stops growing there too —
 * a depth of 16 is always about half a second of lookahead, whatever the
 * speed. Distance still scales, because the caller walks in strides of
 * `playbackCadence().stride`; raising the depth on top of that would only
 * queue more requests per tick, which is the starvation the cap prevents.
 */
export function prefetchDepth(speed: number): number {
  return Math.min(Math.max(Math.round(4 * speed), 4), 16);
}

/** Milliseconds per frame at 1x. */
export const BASE_FRAME_MS = 500;

/**
 * Floor on the frame interval, ~30 fps.
 *
 * Above this the browser cannot decode a ~50 KB WebP per frame anyway, so
 * asking for more just queues work that arrives late and makes playback
 * stutter rather than speeding it up. Advancing is gated on decode, so the
 * floor keeps the request rate matched to what the device can actually
 * paint.
 */
export const MIN_FRAME_MS = 33;

/** Paints per second the floor allows, ~30. */
export const MAX_TICK_FPS = 1000 / MIN_FRAME_MS;

/** Archive frames per second at 1x, i.e. the unit the speed multiplies. */
export const BASE_FPS = 1000 / BASE_FRAME_MS;

/** How playback advances at a given speed: how far per tick, and how often. */
export interface PlaybackCadence {
  /** Grid positions to advance per tick. Always a positive integer. */
  stride: number;
  /** Milliseconds between ticks. Never below `MIN_FRAME_MS`. */
  frameDelay: number;
}

/**
 * Frames-per-tick and milliseconds-per-tick for a playback speed.
 *
 * Speed above `MIN_FRAME_MS` cannot come from painting sooner — the decode
 * ceiling is a hard wall, and advance is gated on decode. It has to come
 * from painting *fewer* frames. So beyond the ceiling the tick interval
 * pins to the floor and the stride opens up instead: at 32x every second
 * frame is painted, at 64x every fourth.
 *
 * Without this, `500 / speed` clamped at 33 ms made 16x, 32x and 64x
 * produce byte-identical timing — three buttons, one playback rate, and a
 * speed label that lied about everything above 15x.
 *
 * Rounding rather than flooring the stride is what keeps 16x honest: it
 * wants 32 fps against a ~30 fps ceiling, close enough that skipping every
 * second frame would overshoot far worse than painting them all does.
 */
export function playbackCadence(speed: number): PlaybackCadence {
  const desiredFps = Math.max(speed, 0) * BASE_FPS;
  // A zero or negative speed has no meaningful cadence; hand back the 1x
  // one rather than dividing by zero into an infinite stride.
  if (desiredFps <= 0) return { stride: 1, frameDelay: BASE_FRAME_MS };

  const stride = Math.max(1, Math.round(desiredFps / MAX_TICK_FPS));
  const frameDelay = Math.max((1000 * stride) / desiredFps, MIN_FRAME_MS);
  return { stride, frameDelay };
}

/**
 * Where playback goes next, or `null` to stop.
 *
 * Wraps the stride in the two rules that keep fast playback honest at the
 * ends of the archive:
 *
 * A stride wider than one can jump clean over the last frame — at 64x it
 * overshoots by up to three — which would strand the playhead short of
 * live, never light the `atLive` state, and leave the newest frame
 * unwatchable at speed. So an overshoot falls back to the newest frame
 * instead of stopping early.
 *
 * That fallback must only ever move *forward*. Returning a position at or
 * behind the current one would hand the playback loop a value it treats as
 * progress, and the loop would spin on the last frame forever.
 */
export function nextPlaybackPosition(
  present: Uint8Array,
  position: number,
  stride: number,
): number | null {
  const next = nextPresent(present, position + Math.max(1, stride));
  if (next !== null) return next;

  const last = nextPresent(present, present.length - 1, -1);
  return last !== null && last > position ? last : null;
}

/** Longest frame-to-frame blend, used when stepping or scrubbing. */
export const FADE_MS = 120;

/**
 * Fastest playback that still blends frames.
 *
 * Above 4x the frame budget is 63 ms or less, which is near enough to
 * video that a hard cut reads as motion rather than as a jump.
 */
export const FADE_MAX_SPEED = 4;

/**
 * Whether a card configured to autoplay may actually start.
 *
 * Split out from the card so the one rule with a legal-ish flavour to it
 * is testable: prefers-reduced-motion overrides the config outright. A
 * card that begins animating on its own is precisely what that setting
 * exists to prevent, and the option's help text promises the override.
 *
 * The caller owns the one-shot arming and the "are there frames yet"
 * check; this is only the decision.
 */
export function shouldAutoplay(state: {
  configured: boolean;
  reducedMotion: boolean;
  alreadyPlaying: boolean;
}): boolean {
  return state.configured && !state.reducedMotion && !state.alreadyPlaying;
}

/**
 * How long the incoming frame should take to fade in, in milliseconds.
 *
 * Zero means a hard cut.
 *
 * The invariant that matters: during playback the fade must always fit
 * inside the frame budget. A fade longer than the budget is interrupted
 * by the next swap, so neither layer ever reaches 0 or 1 and the stage
 * shows a permanent double exposure. A fixed 160 ms transition did
 * exactly this at every speed from 4x up, which is why the duration is
 * derived from the budget rather than chosen once.
 *
 * Stepping and scrubbing take the full blend: no next frame is competing
 * for the budget, and a hard cut between two stills reads as a flinch.
 */
export function fadeDurationMs(
  speed: number,
  frameDelay: number,
  options: { playing: boolean; reducedMotion: boolean },
): number {
  if (options.reducedMotion) return 0;
  if (!options.playing) return FADE_MS;
  if (speed > FADE_MAX_SPEED) return 0;
  return Math.min(FADE_MS, Math.round(frameDelay / 2));
}
