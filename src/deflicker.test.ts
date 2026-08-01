import { describe, expect, it } from "vitest";

import {
  DEFAULT_DEFLICKER,
  deflickerGains,
  type LumaSeries,
  radiusForStrength,
} from "./deflicker";

/** Apply the gains and report the corrected luminance series. */
function corrected(luma: LumaSeries, radius = 6): number[] {
  const gains = deflickerGains(luma, { ...DEFAULT_DEFLICKER, radius });
  return luma.map((value, i) => (value ?? 0) * (gains[i] ?? 1));
}

/** Mean absolute frame-to-frame change — a proxy for perceived strobe. */
function jitter(series: number[]): number {
  let total = 0;
  for (let i = 1; i < series.length; i++) {
    total += Math.abs(series[i]! - series[i - 1]!);
  }
  return total / Math.max(1, series.length - 1);
}

describe("deflickerGains", () => {
  it("reduces frame-to-frame jitter from passing cloud", () => {
    // A steady scene with cloud shadow flapping the brightness around.
    // A near-square alternation, which is what a cloud edge actually
    // produces and what a median-based target fails to correct at all.
    const luma = Array.from({ length: 60 }, (_, i) =>
      i % 2 === 0 ? 120 : 165,
    );
    const before = jitter(luma);
    const after = jitter(corrected(luma));

    expect(after).toBeLessThan(before / 3);
  });

  it("leaves an already-steady series alone", () => {
    const luma = Array.from({ length: 40 }, () => 140);
    const gains = deflickerGains(luma);
    for (const gain of gains) expect(gain).toBeCloseTo(1, 5);
  });

  it("preserves a slow genuine change", () => {
    // Dusk: a long, monotonic fall. The correction must follow it rather
    // than flatten it — otherwise a fortnight of footage looks like noon
    // throughout, which is the failure mode of normalising to a fixed
    // target instead of a rolling one.
    const luma = Array.from({ length: 120 }, (_, i) => 200 - i * 1.4);
    const out = corrected(luma);

    expect(out[0]! - out[out.length - 1]!).toBeGreaterThan(120);
    // Still monotonically falling, no reversals introduced.
    for (let i = 1; i < out.length; i++) {
      expect(out[i]!).toBeLessThanOrEqual(out[i - 1]! + 1e-6);
    }
  });

  it("never exceeds the gain clamp", () => {
    const luma = [10, 200, 200, 200, 200, 200, 200, 200, 200];
    const gains = deflickerGains(luma);
    for (const gain of gains) {
      expect(gain).toBeLessThanOrEqual(DEFAULT_DEFLICKER.maxGain + 1e-6);
      expect(gain).toBeGreaterThanOrEqual(1 / DEFAULT_DEFLICKER.maxGain - 1e-6);
    }
  });

  it("does not try to rescue a nearly-black frame", () => {
    // Below the floor, a multiplier only amplifies noise. Leaving the
    // frame dark is the honest result.
    const luma = [150, 150, 150, 2, 150, 150, 150];
    const gains = deflickerGains(luma);
    expect(gains[3]).toBe(1);
  });

  it("is unmoved by a single outlier", () => {
    // One bird across the lens must not mis-correct its neighbours — the
    // property the trimming buys back after abandoning the median.
    const flat = Array.from({ length: 21 }, () => 150);
    const spiked = [...flat];
    spiked[10] = 250;

    const gains = deflickerGains(spiked);
    for (let i = 0; i < spiked.length; i++) {
      if (i === 10) continue;
      expect(gains[i]).toBeCloseTo(1, 2);
    }
  });

  it("skips positions with no recorded luminance", () => {
    const luma: LumaSeries = [150, null, 150, 150, null, 150, 150];
    const gains = deflickerGains(luma);
    expect(gains[1]).toBe(1);
    expect(gains[4]).toBe(1);
  });

  it("is a no-op at radius 0", () => {
    const luma = [100, 200, 100, 200];
    const gains = deflickerGains(luma, { ...DEFAULT_DEFLICKER, radius: 0 });
    for (const gain of gains) expect(gain).toBe(1);
  });

  it("handles an empty series", () => {
    expect(deflickerGains([]).length).toBe(0);
  });

  it("does not mutate its input", () => {
    const luma = [120, 165, 120, 165];
    const copy = [...luma];
    deflickerGains(luma);
    expect(luma).toEqual(copy);
  });
});

describe("radiusForStrength", () => {
  it("0 means genuinely off", () => {
    expect(radiusForStrength(0)).toBe(0);
  });

  it("scales with strength and clamps to the valid range", () => {
    expect(radiusForStrength(50)).toBeGreaterThan(radiusForStrength(10));
    expect(radiusForStrength(100)).toBeGreaterThanOrEqual(radiusForStrength(50));
    expect(radiusForStrength(-20)).toBe(0);
    expect(radiusForStrength(999)).toBe(radiusForStrength(100));
  });
});
