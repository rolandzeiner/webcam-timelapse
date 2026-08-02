import { describe, expect, it } from "vitest";

import { cardStyles } from "./card-styles";

/**
 * The stage's paint order cannot be unit-tested.
 *
 * It depends on stacking contexts, which need a real layout engine —
 * jsdom implements neither layout nor compositing, so adding it would buy
 * nothing here. What CAN be checked is the mechanism the fix rests on,
 * which is what actually got deleted-by-accident once already.
 */

interface Rule {
  selectors: string[];
  body: string;
}

/**
 * Crude but sufficient rule splitter.
 *
 * Comments are stripped first, then every `… { … }` pair without nested
 * braces is taken as a rule. At-rule wrappers (`@media`) do not match, so
 * the rules inside them surface as top-level ones — fine for these
 * assertions, which care about declarations rather than cascade order.
 */
function parseRules(css: string): Rule[] {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: Rule[] = [];
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(stripped)) !== null) {
    rules.push({
      selectors: match[1]!
        .split(",")
        .map((selector) => selector.trim())
        .filter(Boolean),
      body: match[2]!,
    });
  }
  return rules;
}

/** Every declaration that applies to an exact selector, concatenated. */
function declarationsFor(selector: string): string {
  return parseRules(cardStyles.cssText)
    .filter((rule) => rule.selectors.includes(selector))
    .map((rule) => rule.body)
    .join("\n");
}

describe("stage stacking", () => {
  it("gives .layers its own stacking context", () => {
    // revealFrame() writes z-index onto the two <img> layers so the
    // incoming frame paints over the outgoing one. Both conditions below
    // are required to trap that inside the wrapper: a positioned element
    // with a numeric z-index establishes a stacking context, either one
    // alone does not.
    const body = declarationsFor(".layers");

    expect(body).toMatch(/position:\s*(absolute|relative|fixed|sticky)/);
    expect(body).toMatch(/z-index:\s*-?\d+/);
  });

  it("declares z-index exactly once in the whole stylesheet", () => {
    // The regression: the timestamp, live/gap badge and sensor readout
    // are all position:absolute at z-index auto, so they paint in DOM
    // order — which only beats the images because the images' z-index is
    // confined to .layers. A second z-index anywhere in this file would
    // re-enter that competition, so this is a deliberate tripwire rather
    // than a style rule. If a new one is genuinely needed, work out where
    // it lands relative to .layers first, then change this test.
    const declarations = cardStyles.cssText
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .match(/z-index\s*:/g);

    expect(declarations).toHaveLength(1);
    expect(declarationsFor(".layers")).toMatch(/z-index/);
  });

  it("keeps the overlays positioned, which is what makes them siblings", () => {
    // If one of these ever stopped being positioned it would leave the
    // painting group entirely and the containment above would no longer
    // be what keeps it visible.
    for (const selector of [".stamp", ".badge", ".readout", ".empty"]) {
      expect(declarationsFor(selector)).toMatch(/position:\s*absolute/);
    }
  });

  it("does not set the layer fade in CSS", () => {
    // opacity and transition on .layer are written imperatively, timed to
    // the frame budget. A stylesheet rule would be overridden silently and
    // read as dead code to the next person.
    const body = declarationsFor(".layer");

    expect(body).not.toMatch(/transition:/);
    expect(body).toMatch(/filter:\s*var\(--wtl-frame-filter/);
  });
});

describe("reduced motion", () => {
  it("is not attempted from CSS", () => {
    // The fade's transition is an inline style, and inline beats a
    // stylesheet rule regardless of the media query — a
    // prefers-reduced-motion block targeting .layer would look correct
    // and do nothing. It is handled in TypeScript instead, via
    // fadeDurationMs() and shouldAutoplay().
    const reducedMotionBlocks = cardStyles.cssText
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .match(/prefers-reduced-motion/g);

    expect(reducedMotionBlocks).toBeNull();
  });
});

describe("ruler bands", () => {
  /**
   * A selector's length declaration, in px.
   *
   * The unit is optional because a zero length is conventionally written
   * without one, and `top: 0` is exactly the declaration that starts the
   * date band.
   */
  const px = (selector: string, property: string): number => {
    const match = new RegExp(`${property}:\\s*(-?[\\d.]+)(px)?\\s*;`).exec(
      declarationsFor(selector),
    );
    if (match === null) throw new Error(`no ${property} on ${selector}`);
    return Number(match[1]);
  };

  /**
   * Worst-case rendered height of a label, in px.
   *
   * The bands are placed by absolute `top`, so a label's box height has
   * to be known to know whether two bands touch. 0.7rem against a 16px
   * root is 11.2px.
   */
  const labelHeight = 11.2;

  it("pins line-height so the label boxes have a known height", () => {
    // The bug this guards: without it the labels inherit HA's ~1.5, the
    // date's box grows to ~17px from top 0, and it eats the top of the
    // mark row — which renders as a gap bitten out of the ticks around
    // every date label.
    expect(declarationsFor(".lab")).toMatch(/line-height:\s*1\s*;/);
  });

  it("keeps the date band clear of the marks", () => {
    expect(px(".lab.date", "top") + labelHeight).toBeLessThanOrEqual(
      px(".mark", "top"),
    );
  });

  it("keeps the tallest mark clear of the clock band", () => {
    // Month marks are the tall ones, and they are the rarest, so an
    // overlap here would show up on one day in thirty.
    const markBottom = px(".mark", "top") + px(".tick.month .mark", "height");
    expect(markBottom).toBeLessThanOrEqual(px(".lab.time", "top"));
  });

  it("leaves room for the clock band inside the ruler", () => {
    expect(px(".lab.time", "top") + labelHeight).toBeLessThanOrEqual(
      px(".ruler", "height"),
    );
  });

  it("orders the bands date, marks, clock", () => {
    expect(px(".lab.date", "top")).toBeLessThan(px(".mark", "top"));
    expect(px(".mark", "top")).toBeLessThan(px(".lab.time", "top"));
  });
});

describe("readout icon alignment", () => {
  it("pins the row's line-height so there is a stable box to centre in", () => {
    // Same class of bug as the ruler: an inherited line-height makes the
    // row height theme-dependent, and a centred icon drifts off the text
    // by however much it differs.
    expect(declarationsFor(".readout-row")).toMatch(/line-height:\s*[\d.]+\s*;/);
  });

  it("gives the icon a display, because width on an inline box is ignored", () => {
    // A custom element is inline by default. Without this the width and
    // height below do nothing and the icon sits on the text baseline.
    expect(declarationsFor(".readout-icon")).toMatch(/display:\s*(block|flex)/);
  });

  it("sizes the icon in em so it tracks the text at any font size", () => {
    const body = declarationsFor(".readout-icon");
    expect(body).toMatch(/width:\s*[\d.]+em/);
    expect(body).toMatch(/height:\s*[\d.]+em/);
    expect(body).not.toMatch(/width:\s*[\d.]+px/);
  });

  it("opts the icon out of the row's baseline alignment", () => {
    // The text wants baseline alignment; a replaced box baseline-aligned
    // against it perches on the baseline instead of beside it.
    expect(declarationsFor(".readout-row")).toMatch(/align-items:\s*baseline/);
    expect(declarationsFor(".readout-icon")).toMatch(/align-self:\s*center/);
  });

  it("spans ha-form across the whole entity row", () => {
    // .ent-row is a two-column grid and ha-form is a direct child, so
    // without an explicit span it lands in the narrow auto column beside
    // the entity picker rather than under it.
    expect(declarationsFor(".ent-row ha-form")).toMatch(
      /grid-column:\s*1\s*\/\s*-1/,
    );
  });
});
