import { describe, expect, it } from "vitest";

import cardSource from "./webcam-timelapse-card.ts?raw";
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

/**
 * A selector's length declaration, in px.
 *
 * The unit is optional because a zero length is conventionally written
 * without one.
 */
function px(selector: string, property: string): number {
  const match = new RegExp(`${property}:\\s*(-?[\\d.]+)(px)?\\s*;`).exec(
    declarationsFor(selector),
  );
  if (match === null) throw new Error(`no ${property} on ${selector}`);
  return Number(match[1]);
}

/** 0.7rem against a 16px root, at line-height 1. */
const LABEL_HEIGHT = 11.2;

describe("timeline bands", () => {
  it("pins line-height so the label boxes have a known height", () => {
    // Inheriting HA's ~1.5 makes a 0.7rem label 17px tall, which spills
    // out of a 12px band and into the marks.
    expect(declarationsFor(".lab")).toMatch(/line-height:\s*1\s*;/);
  });

  it("centres the marks so the bar runs through them", () => {
    // This is what makes the slider and the ruler read as one object
    // rather than as a bar with a separate scale beneath it.
    const body = declarationsFor(".mark");
    expect(body).toMatch(/top:\s*50%/);
    expect(body).toMatch(/transform:\s*translate\(-50%,\s*-50%\)/);
  });

  it("orders the mark heights minor, day, month", () => {
    expect(px(".mark", "height")).toBeLessThan(px(".mark.day", "height"));
    expect(px(".mark.day", "height")).toBeLessThan(px(".mark.month", "height"));
  });

  it("keeps the tallest mark inside the track", () => {
    expect(px(".mark.month", "height")).toBeLessThanOrEqual(
      px(".track", "height"),
    );
  });

  it("keeps the slider a large enough pointer target", () => {
    // WCAG 2.2 SC 2.5.8 wants 24x24 CSS px. The bar itself is 6px, so the
    // track height is the whole of what makes this control hittable —
    // shrinking it to slim the card is exactly the tempting mistake.
    expect(px(".track", "height")).toBeGreaterThanOrEqual(24);
  });

  it("leaves air between the frame and the date band", () => {
    // The date band is the first thing under the picture. With no gap the
    // labels read as part of the frame rather than as the timeline's own
    // heading. Shorthand order is top, side, bottom.
    const margin = /margin:\s*([\d.]+)px/.exec(declarationsFor(".timeline"));
    expect(margin).not.toBeNull();
    expect(Number(margin?.[1])).toBeGreaterThan(0);
  });

  it("gives each label band room for its text", () => {
    expect(px(".band", "height")).toBeGreaterThanOrEqual(LABEL_HEIGHT);
  });

  it("keeps the marks behind the bar without reaching for z-index", () => {
    // Paint order is DOM order. A z-index here would re-enter the
    // stacking competition .layers exists to contain.
    expect(declarationsFor(".marks")).not.toMatch(/z-index/);
    expect(declarationsFor(".mark")).not.toMatch(/z-index/);
  });
});

describe("controls overlay", () => {
  it("floats the controls over the stage", () => {
    const body = declarationsFor(".controls");
    expect(body).toMatch(/position:\s*absolute/);
    expect(body).toMatch(/left:\s*50%/);
    expect(body).toMatch(/bottom:/);
  });

});

/** Everything inside the @container block, comments stripped. */
function narrowBlock(): string {
  const css = cardStyles.cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const start = css.indexOf("@container");
  return start === -1 ? "" : css.slice(start);
}

/** The declarations a selector carries inside the @container block. */
function narrowRule(selector: string): string {
  const match = new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`).exec(narrowBlock());
  return match?.[1] ?? "";
}

describe("narrow layout", () => {
  it("moves the readout to the top centre", () => {
    const body = narrowRule(".readout");
    expect(body).toMatch(/top:/);
    expect(body).toMatch(/left:\s*50%/);
    expect(body).toMatch(/transform:\s*translateX\(-50%\)/);
  });

  it("releases the corner the base rule pins", () => {
    // Setting top and left without clearing right and bottom leaves the
    // box anchored to both corners, so it stretches instead of moving.
    const body = narrowRule(".readout");
    expect(body).toMatch(/right:\s*auto/);
    expect(body).toMatch(/bottom:\s*auto/);
  });

  it("aligns the readout with the timestamp and the badge", () => {
    // All three are top-anchored overlays on the frame. Sharing a top
    // edge is what makes them read as one row; any drift between these
    // three numbers shows up as boxes floating at unrelated heights.
    const top = (body: string): string | undefined =>
      /top:\s*(\d+)px/.exec(body)?.[1];

    expect(top(narrowRule(".readout"))).toBe(top(declarationsFor(".stamp")));
    expect(top(narrowRule(".readout"))).toBe(top(declarationsFor(".badge")));
  });

  it("hides the sparklines", () => {
    expect(narrowRule(".spark-wrap")).toMatch(/display:\s*none/);
  });

  it("switches before the readout can reach the control pill", () => {
    // Above the breakpoint both sit on the bottom edge: the pill centred
    // at ~212px, the readout right-aligned at ~230px. They meet just past
    // 600px, so the switch has to happen above that — this is the number
    // that keeps the two from overlapping at any width.
    const match = /@container\s*\(max-width:\s*(\d+)px\)/.exec(narrowBlock());
    expect(match).not.toBeNull();
    expect(Number(match?.[1])).toBeGreaterThanOrEqual(620);
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

describe("timeline markup order", () => {
  it("renders dates, then the bar, then clock times", () => {
    const dates = cardSource.indexOf('class="band dates"');
    const track = cardSource.indexOf('<div class="track">');
    const times = cardSource.indexOf('class="band times"');

    expect(dates).toBeGreaterThan(-1);
    expect(track).toBeGreaterThan(dates);
    expect(times).toBeGreaterThan(track);
  });

  it("paints the marks before the rail", () => {
    // The marks sit behind the bar purely by DOM order — everything here
    // is z-index auto. Moving them after the rail would put the ruler on
    // top of the slider with no CSS change to explain it.
    const marks = cardSource.indexOf('class="marks"');
    const rail = cardSource.indexOf('class="rail"');

    expect(marks).toBeGreaterThan(-1);
    expect(rail).toBeGreaterThan(marks);
  });

  it("renders the controls inside the stage", () => {
    // The pill is absolutely positioned against .stage. Rendered as a
    // sibling it would anchor to the card instead and sit over the
    // timeline.
    const stage = cardSource.indexOf('<div class="stage" style=');
    const controls = cardSource.indexOf("${this.renderControls()}");

    expect(stage).toBeGreaterThan(-1);
    expect(controls).toBeGreaterThan(stage);
  });
});

describe("transport control order", () => {
  const at = (needle: string): number => cardSource.indexOf(needle);

  it("puts play between previous and next", () => {
    // The strongest convention in media UI: every player from VLC to a car
    // head unit centres play/pause between the two step buttons, so the
    // middle button is muscle memory. Breaking it makes people look.
    const previous = at("mdi:skip-previous");
    const play = at('class="play"');
    const next = at("mdi:skip-next");

    expect(previous).toBeGreaterThan(-1);
    expect(play).toBeGreaterThan(previous);
    expect(next).toBeGreaterThan(play);
  });

  it("keeps speed and the jump outside the transport group", () => {
    // Neither is transport: one changes how playback runs, the other
    // jumps somewhere. The divider is what says so.
    const next = at("mdi:skip-next");
    const separator = at('class="sep"');
    const speed = at('class="speed"');
    const now = at("mdi:update");

    expect(separator).toBeGreaterThan(next);
    expect(speed).toBeGreaterThan(separator);
    expect(now).toBeGreaterThan(speed);
  });

  it("gives play more weight than the buttons beside it", () => {
    const size = (body: string): number =>
      Number(/--mdc-icon-button-size:\s*(\d+)px/.exec(body)?.[1] ?? 0);

    expect(size(declarationsFor(".controls .play"))).toBeGreaterThan(
      size(declarationsFor(".controls")),
    );
  });
});
