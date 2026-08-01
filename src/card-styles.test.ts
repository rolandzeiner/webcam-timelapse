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
