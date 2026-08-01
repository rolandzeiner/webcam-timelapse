/**
 * Timelapse deflicker.
 *
 * Moving cloud makes consecutive frames jump in brightness, and at
 * playback speed that reads as a strobe. The standard fix — the one
 * LRTimelapse and `ffmpeg -vf deflicker` implement — is to smooth the
 * *luminance curve* rather than the images: measure each frame's
 * brightness, take a rolling average of that curve, and scale each frame
 * toward its own smoothed value.
 *
 * The property that makes this work is that slow changes survive. A
 * sunset moves the smoothed curve with it, so nothing is flattened; only
 * excursions faster than the window get pulled back. Normalising every
 * frame to a fixed target would instead erase dusk entirely and make a
 * fourteen-day timelapse look like it happened at noon.
 *
 * Pure module — takes numbers, returns numbers.
 */

/** Luminance per grid position; null where none was recorded. */
export type LumaSeries = (number | null)[];

export interface DeflickerOptions {
  /**
   * Half-width of the smoothing window, in frames.
   *
   * Expressed in frames rather than minutes because what the eye objects
   * to is variation per *played* second, which is a frame count. Bigger
   * = smoother, but slower to follow a genuine change.
   */
  radius: number;
  /**
   * Largest correction allowed, as a multiplier.
   *
   * A hard clamp matters: a frame that is genuinely almost black (dusk,
   * a bird on the lens) would otherwise demand an enormous gain and come
   * back as grey noise. Better to leave one frame dark than to invent
   * detail that was never captured.
   */
  maxGain: number;
}

export const DEFAULT_DEFLICKER: DeflickerOptions = {
  radius: 6,
  maxGain: 1.5,
};

/**
 * Mean of a window with the extremes discarded.
 *
 * A plain median is the obvious choice for outlier resistance and is
 * wrong here. Cloud edges produce a near-square alternation, and for an
 * alternating signal roughly half the window sits at each level, so the
 * median returns the frame's *own* value — gain 1, no correction, on
 * exactly the footage this exists to fix. (Measured: jitter fell 45 to
 * 40 instead of 45 to 4.)
 *
 * A plain mean corrects alternation properly but is dragged by a single
 * black frame. Trimming the tails first keeps the mean's behaviour on
 * periodic flicker and the median's immunity to one bad frame, which is
 * why ffmpeg's deflicker offers this family rather than a bare median.
 *
 * Copies, so the caller's array is untouched.
 */
function trimmedMean(values: number[], trimFraction = 0.15): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const cut = Math.floor(sorted.length * trimFraction);
  // Never trim away the whole window on a short one.
  const kept = sorted.length - 2 * cut >= 3 ? sorted.slice(cut, sorted.length - cut) : sorted;
  return kept.reduce((sum, value) => sum + value, 0) / kept.length;
}

/**
 * Per-frame brightness multipliers.
 *
 * Returns 1 wherever no correction can be computed — an unmeasured
 * frame, or a frame so dark that scaling it is meaningless. 1 is the
 * identity for `filter: brightness()`, so the caller needs no special
 * case.
 *
 * The smoothed target is a trimmed mean — see `trimmedMean` for why a
 * plain median, the intuitive choice, silently does nothing on exactly
 * the footage this is meant to fix.
 */
export function deflickerGains(
  luma: LumaSeries,
  options: DeflickerOptions = DEFAULT_DEFLICKER,
): Float32Array {
  const gains = new Float32Array(luma.length).fill(1);
  const { radius, maxGain } = options;
  if (radius < 1 || luma.length === 0) return gains;

  const minGain = 1 / maxGain;
  // Below this the frame carries too little signal for a multiplier to
  // recover anything real.
  const floor = 8;

  for (let i = 0; i < luma.length; i++) {
    const own = luma[i];
    if (own === null || own === undefined || own < floor) continue;

    const from = Math.max(0, i - radius);
    const to = Math.min(luma.length - 1, i + radius);
    const window: number[] = [];
    for (let j = from; j <= to; j++) {
      const value = luma[j];
      if (value !== null && value !== undefined && value >= floor) {
        window.push(value);
      }
    }
    if (window.length < 3) continue;

    const target = trimmedMean(window);
    gains[i] = Math.min(Math.max(target / own, minGain), maxGain);
  }

  return gains;
}

/**
 * Map a 0-100 strength onto a window radius.
 *
 * One dial is enough for a user: "how hard should this try". Zero is off
 * so the setting has an honest way to mean "leave my footage alone".
 */
export function radiusForStrength(strength: number): number {
  const clamped = Math.min(Math.max(strength, 0), 100);
  if (clamped === 0) return 0;
  return Math.max(1, Math.round((clamped / 100) * 12));
}
