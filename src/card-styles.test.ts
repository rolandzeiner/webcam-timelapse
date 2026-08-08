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

/**
 * Everything inside one @container block, comments stripped.
 *
 * There are two: the pair's earlier switch and the single block's. They
 * are addressed by their breakpoint rather than by position so neither
 * test can silently start reading the other one's rules.
 */
function narrowBlock(maxWidth = SINGLE_BREAKPOINT): string {
  const css = cardStyles.cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const start = css.indexOf(`@container (max-width: ${maxWidth}px)`);
  if (start === -1) return "";
  const next = css.indexOf("@container", start + 1);
  return css.slice(start, next === -1 ? undefined : next);
}

/** The declarations a selector carries inside a @container block. */
function narrowRule(selector: string, maxWidth = SINGLE_BREAKPOINT): string {
  const pattern = new RegExp(`(?:^|[{;}\\s])${escape(selector)}\\s*\\{([^}]*)\\}`);
  return pattern.exec(narrowBlock(maxWidth))?.[1] ?? "";
}

function escape(selector: string): string {
  return selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The breakpoints, read off the stylesheet rather than hard-coded twice. */
const BREAKPOINTS = [
  ...cardStyles.cssText.matchAll(/@container\s*\(max-width:\s*(\d+)px\)/g),
].map((match) => Number(match[1]));
const SINGLE_BREAKPOINT = Math.min(...BREAKPOINTS);
const PAIR_BREAKPOINT = Math.max(...BREAKPOINTS);

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

  it("keeps the sparklines", () => {
    // Reversed deliberately. Width used to drop the chart on the theory
    // that the numbers are the point — but a chart that vanishes reads as
    // a broken sensor, and chasing that costs far more than a cramped
    // sparkline does. If it has to go again, make it opt-in.
    expect(narrowRule(".spark-wrap")).not.toMatch(/display:\s*none/);
  });

  it("switches before the readout can reach the control pill", () => {
    // Above the breakpoint both sit on the bottom edge: the pill centred
    // at ~212px, the readout right-aligned at ~230px. They meet just past
    // 600px, so the switch has to happen above that — this is the number
    // that keeps the two from overlapping at any width.
    expect(SINGLE_BREAKPOINT).toBeGreaterThanOrEqual(620);
  });

  it("re-centres a lone left block", () => {
    // .readout.left pins the opposite edge and is more specific than the
    // centring rule, so without an override here it would sit at the
    // frame edge with the centring transform still pulling on it.
    expect(narrowRule(".readout.left")).toMatch(/left:\s*50%/);
  });
});

describe("two readout blocks", () => {
  it("leaves a single block's layout entirely alone", () => {
    // THE rule this feature is built around: one configured block must
    // render exactly where it always did. The guarantee is mechanical
    // rather than visual — the wrapper generates no box, and every rule
    // that could move a block is scoped to .pair, which only exists when
    // there are two. If a declaration here ever escapes that scope, a
    // single-block card starts moving and this catches it.
    expect(declarationsFor(".readouts")).toMatch(/display:\s*contents/);

    const selectors = [
      ...narrowBlock(PAIR_BREAKPOINT).matchAll(/([^{}]+)\{/g),
    ]
      .map((match) => match[1]!.trim())
      .filter((selector) => !selector.startsWith("@container"));

    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) {
      expect(selector).toMatch(/^\.readouts\.pair\b/);
    }
  });

  it("pins the second block to the opposite corner", () => {
    const body = declarationsFor(".readout.left");
    expect(body).toMatch(/left:\s*8px/);
    // Without this the box stays anchored to both edges and stretches
    // across the frame instead of moving to the left corner.
    expect(body).toMatch(/right:\s*auto/);
  });

  it("stacks the pair with the right-hand block on top when narrow", () => {
    // Roland's call: the block that was there first stays on top. DOM
    // order is left-then-right, so column-reverse is what delivers that.
    // A plain `column` would silently invert it.
    const body = narrowRule(".readouts.pair", PAIR_BREAKPOINT);
    expect(body).toMatch(/flex-direction:\s*column-reverse/);
    expect(body).toMatch(/align-items:\s*center/);
  });

  it("returns the stacked blocks to normal flow", () => {
    // Absolutely-positioned children cannot stack in a column, and the
    // centring transform they inherit from the single-block rules would
    // drag them half their width off centre.
    const body = narrowRule(".readouts.pair .readout", PAIR_BREAKPOINT);
    expect(body).toMatch(/position:\s*static/);
    expect(body).toMatch(/transform:\s*none/);
  });

  it("keeps the sparklines in the stacked layout too", () => {
    expect(
      narrowRule(".readouts.pair .spark-wrap", PAIR_BREAKPOINT),
    ).not.toMatch(/display:\s*none/);
  });

  it("switches earlier than a single block does", () => {
    // Re-derived, not inherited. The pill's left edge is at W/2 - 106 and
    // the left-hand block's right edge at ~238, which meet at W ≈ 688 —
    // so the pair has to leave the bottom edge well before 620, or it
    // overlaps the pill across most of a phone's width.
    expect(PAIR_BREAKPOINT).toBeGreaterThan(SINGLE_BREAKPOINT);
    expect(PAIR_BREAKPOINT).toBeGreaterThanOrEqual(688);
  });

  it("aligns the stacked pair with the timestamp and the badge", () => {
    const top = (body: string): string | undefined =>
      /top:\s*(\d+)px/.exec(body)?.[1];

    expect(top(narrowRule(".readouts.pair", PAIR_BREAKPOINT))).toBe(
      top(declarationsFor(".stamp")),
    );
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

describe("night shading", () => {
  it("paints the scrubber's night under everything on the track", () => {
    // Paint order is document order, same as the marks. A z-index here
    // would pull the track into the stacking competition .layers exists
    // to contain.
    const track = cardSource.slice(cardSource.indexOf('<div class="track">'));
    expect(track.indexOf('class="nights"')).toBeLessThan(
      track.indexOf('class="marks"'),
    );
    expect(track.indexOf('class="nights"')).toBeLessThan(
      track.indexOf('class="rail"'),
    );
  });

  it("does not tie night to the ruler toggle", () => {
    // Different questions. Someone who turned the day markers off has
    // said nothing about wanting the dark stretches unmarked.
    expect(cardSource).toMatch(
      /const nights =\s*this\.config\?\.show_sun === true/,
    );
  });

  it("keeps night off unless it is asked for", () => {
    // Strict === true, so an absent key is off. Shading is right for a
    // camera pointed outdoors and noise for one pointed at a wall, and
    // the card cannot tell which it has.
    expect(cardSource).not.toMatch(/show_sun !== false/);
    expect(cardSource).toMatch(/show_sun: false/);
  });

  it("follows the theme's own colour on the scrubber", () => {
    // Unlike the overlay bands this sits on the card surface, which may
    // be light. A fixed white would vanish there.
    expect(declarationsFor(".night")).toMatch(/background:\s*currentColor/);
  });
});

describe("sparkline scale caption", () => {
  it("keeps the labels out of the SVG", () => {
    // The chart is preserveAspectRatio="none", so an in-chart <text>
    // would be stretched horizontally by whatever width the block
    // happens to be — content-driven in the corner layout, near
    // full-bleed in the stacked one. The caption has to be HTML.
    const spark = cardSource.slice(cardSource.indexOf("sparkline({"));
    expect(spark).not.toMatch(/<text/);
    expect(cardSource).toMatch(/class="spark-scale"/);
  });

  it("pushes the two ends apart", () => {
    // How far it moved reads against the chart's vertical extent, how
    // long over against its horizontal one. Each label sits on the axis
    // it describes, or neither means anything.
    expect(declarationsFor(".spark-scale")).toMatch(
      /justify-content:\s*space-between/,
    );
  });

  it("does not wrap the caption onto a second line", () => {
    // The block is sized by its content and sits over a photograph. A
    // caption that wrapped would grow the scrim rather than truncate.
    expect(declarationsFor(".spark-scale")).toMatch(/white-space:\s*nowrap/);
  });
});

describe("folding a readings block away", () => {
  it("keeps the eye a large enough pointer target", () => {
    // ha-icon-button defaults to 48px, which would dwarf a block only a
    // few rows tall — but shrinking it is exactly where WCAG 2.5.8 gets
    // broken, so the floor is pinned here rather than remembered.
    const size = Number(
      declarationsFor(".readout-fold").match(
        /--mdc-icon-button-size:\s*(\d+)px/,
      )?.[1],
    );
    expect(size).toBeGreaterThanOrEqual(24);
    expect(size).toBeLessThan(40);
  });

  it("sheds the block's padding once folded", () => {
    // A folded block that kept its padding would leave a dark square on
    // the picture — the thing folding it away was meant to clear.
    expect(declarationsFor(".readout.folded")).toMatch(/padding:\s*2px/);
  });

  it("puts the eye on the trailing edge with or without a heading", () => {
    // The heading is optional. Justified from the end, a title-less block
    // still lands the eye on the block's trailing edge instead of its
    // leading one; the title takes the slack when there is one.
    expect(declarationsFor(".readout-head")).toMatch(
      /justify-content:\s*flex-end/,
    );
    expect(declarationsFor(".readout-title")).toMatch(/flex:\s*1/);
  });

  it("names the action on the icon, not the state", () => {
    // A visible block offers "hide": the crossed-out eye is where you are
    // going, not where you are. The other way round is the toggle trap
    // where the control describes itself and everyone presses it twice.
    expect(cardSource).toMatch(
      /folded \? "mdi:eye-outline" : "mdi:eye-off-outline"/,
    );
  });

  it("tells assistive tech whether the block is open", () => {
    expect(cardSource).toMatch(/aria-expanded=\$\{folded \? "false" : "true"\}/);
  });

  it("keeps the fold out of the stage's click handler", () => {
    // .readout-fold is inside .readout but outside .readout-row, so
    // without its own veto every fold would also open the camera's
    // more-info dialog behind the block.
    expect(cardSource).toMatch(/classList\.contains\("readout-fold"\)/);
  });

  it("skips the per-row work for a folded block", () => {
    // resolveAt and windowAround run for every row on every frame, and at
    // 32x that is the card's hottest loop. The early return is the point
    // — a hidden block should cost nothing to play past.
    const body = cardSource.slice(cardSource.indexOf("private renderReadout("));
    const guard = body.indexOf("this.folded.has(group.side)");
    const work = body.indexOf("const reading = resolveAt(");
    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(work);
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
    const stage = cardSource.indexOf('class="stage"');
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

describe("ruler visibility", () => {
  const colour = (body: string): string =>
    /background:\s*([^;]+);/.exec(body)?.[1]?.trim() ?? "";
  const alpha = (body: string): number =>
    Number(/opacity:\s*([\d.]+)/.exec(body)?.[1] ?? 1);

  it("does not paint the marks in the rail's own colour", () => {
    // The bug: both were var(--wtl-divider), the token for "barely
    // there". A scale drawn in the same colour as the bar it sits behind
    // dissolves into it and reads as hidden rather than quiet.
    expect(colour(declarationsFor(".mark"))).not.toBe(
      colour(declarationsFor(".rail")),
    );
  });

  it("grades the marks from minor to month", () => {
    // The hierarchy is the information: minor ticks say the scale is
    // continuous, day boundaries are what you navigate by, month starts
    // are rarest and strongest. Prominence has to rise monotonically or
    // the grading says nothing.
    const minor = alpha(declarationsFor(".mark"));
    const day = alpha(declarationsFor(".mark.day"));
    const month = alpha(declarationsFor(".mark.month"));

    expect(minor).toBeLessThan(day);
    expect(day).toBeLessThanOrEqual(month);
  });

  it("keeps a minor tick visible past the rail it crosses", () => {
    // A centred mark only shows the part clearing the rail — half its
    // height each side, minus half the rail. Too little and the contrast
    // has nothing to work with.
    const markHeight = px(".mark", "height");
    const railHeight = px(".rail", "height");
    const clearance = (markHeight - railHeight) / 2;

    expect(clearance).toBeGreaterThanOrEqual(5);
  });
});

describe("more-info targets", () => {
  it("lets the event out of the shadow root", () => {
    // The bug that makes this feature silently do nothing: without
    // composed:true the event stops at the card's shadow boundary and
    // never reaches the Lovelace view listening for it. bubbles alone is
    // not enough.
    const event = /new CustomEvent\(\s*"hass-more-info",[\s\S]{0,240}?\}\)/.exec(
      cardSource,
    )?.[0];

    expect(event).toBeDefined();
    expect(event).toMatch(/bubbles:\s*true/);
    expect(event).toMatch(/composed:\s*true/);
  });

  it("gives both click targets a keyboard path", () => {
    // A div with role="button" does not activate on a keypress by
    // itself, so WCAG 2.1.1 is only met because the handler is written.
    expect(cardSource).toMatch(/onActivateKey/);
    expect(cardSource).toMatch(/event\.key !== "Enter" && event\.key !== " "/);

    const keydowns = cardSource.match(/@keydown=/g);
    expect(keydowns?.length).toBeGreaterThanOrEqual(2);
  });

  it("exposes both targets to assistive technology", () => {
    const roles = cardSource.match(/role="button"/g);
    const tabstops = cardSource.match(/tabindex="0"/g);

    expect(roles?.length).toBeGreaterThanOrEqual(2);
    expect(tabstops?.length).toBeGreaterThanOrEqual(2);
  });

  it("shows focus on both targets", () => {
    // Keyboard users need to see where they are; the targets are a bare
    // div and a flex row, neither of which has a default focus ring worth
    // anything against a photo.
    expect(declarationsFor(".layers:focus-visible")).toMatch(/outline:/);
    expect(declarationsFor(".readout-row:focus-visible")).toMatch(/outline:/);
  });

  it("keeps the passive labels out of the way of the click", () => {
    // The timestamp and the badge sit over the picture. Left clickable
    // they punch two dead rectangles into the camera's click target.
    const body = declarationsFor(".stamp");
    expect(body).toMatch(/pointer-events:\s*none/);
  });
});

describe("picture click target", () => {
  it("binds the click on the stage, not on the image layers", () => {
    // The layers are absolutely positioned under four sibling overlays.
    // A handler bound there only fires when the layers happen to win
    // hit-testing at that point, so any overlay that grows — or an error
    // panel covering the frame — silently takes the target away. The
    // stage is the common ancestor and receives the click however it was
    // routed.
    expect(cardSource).toMatch(/class="stage"[\s\S]{0,120}@click=\$\{this\.onStageClick\}/);
  });

  it("ignores clicks aimed at a control or a reading", () => {
    // Both sit inside the stage, so their clicks bubble through it.
    // Without the guard, tapping pause would also open the camera dialog.
    const handler = /onStageClick\([\s\S]{0,1200}?\n  \}/.exec(cardSource)?.[0];

    expect(handler).toBeDefined();
    expect(handler).toMatch(/composedPath\(\)/);
    expect(handler).toMatch(/"controls"/);
    expect(handler).toMatch(/"readout-row"/);
  });

  it("only inspects the path below the stage", () => {
    // composedPath runs from the target up through Home Assistant's own
    // DOM to window. Searching all of it for a class as common as
    // "controls" lets any ancestor above this card veto every click on
    // the picture — the whole feature dies silently.
    const handler = /onStageClick\([\s\S]{0,900}?\n  \}/.exec(cardSource)?.[0];

    expect(handler).toMatch(/currentTarget/);
    expect(handler).toMatch(/slice\(0, boundary\)/);
  });

  it("reads the composed path rather than the retargeted target", () => {
    // A click starting inside a control's shadow root is retargeted to
    // the host, so event.target would not carry the class being checked.
    const handler = /onStageClick\([\s\S]{0,1200}?\n  \}/.exec(cardSource)?.[0];
    expect(handler).not.toMatch(/event\.target/);
  });
});
