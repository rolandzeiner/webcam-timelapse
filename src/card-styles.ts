import { css } from "lit";

/**
 * Card styles.
 *
 * Tokens are namespaced `--wtl-*` and all derive from HA theme variables,
 * so the card follows the user's theme rather than imposing its own
 * palette. Layout responds to `@container` rather than `@media`: a card
 * can sit in a narrow sidebar column on a wide screen, and viewport width
 * says nothing useful about that.
 */
export const cardStyles = css`
  :host {
    --wtl-accent: var(--primary-color, #03a9f4);
    --wtl-surface: var(--card-background-color, #fff);
    --wtl-text: var(--primary-text-color, #212121);
    --wtl-muted: var(--secondary-text-color, #727272);
    --wtl-divider: var(--divider-color, #e0e0e0);
    --wtl-gap: var(--error-color, #db4437);
    --wtl-radius: var(--ha-card-border-radius, 12px);
    /* Frames are ~4:3; reserving the box up front stops the card from
       jumping when the first image decodes. */
    --wtl-aspect: 4 / 3;

    display: block;
    container-type: inline-size;
  }

  ha-card {
    overflow: hidden;
  }

  /* --- stage ------------------------------------------------------- */

  .stage {
    position: relative;
    width: 100%;
    aspect-ratio: var(--wtl-aspect);
    background: #000;
    overflow: hidden;
  }

  /* Wrapper whose only job is to be a stacking context.

     revealFrame() writes z-index onto the two layers so the incoming
     frame paints over the outgoing one. Without this wrapper that
     z-index competes with every other child of .stage — the timestamp,
     the live/gap badge, the sensor readout, the error panel — all of
     which are positioned at z-index auto and had been relying on DOM
     order to paint on top. Adding z-index to the images silently pushed
     the whole overlay underneath an opaque photo.

     position + a numeric z-index makes this element a stacking context,
     so the layers' z-index is scoped to this subtree and can only ever
     rank the two images against each other. */
  .layers {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
  }

  /* opacity, z-index and transition are set imperatively by
     revealFrame() and are deliberately absent here.

     They used to live in this block as a symmetric crossfade: outgoing
     1 -> 0 while incoming 0 -> 1. That is not a crossfade. Two stacked
     elements with independent opacities do not composite to an opaque
     result — at the midpoint the stage renders

         0.5*new + 0.25*old + 0.25*background

     and this background is #000, so every frame transition dipped ~25%
     toward black. A per-frame luminance pulse is exactly the artifact
     the deflicker pass exists to remove.

     The fix holds the outgoing frame fully opaque underneath and fades
     only the incoming one in on top of it, compositing to

         b*new + (1-b)*old

     with no background term. That needs z-order to follow which layer
     is incoming, and DOM order cannot express it: layer b always paints
     over layer a. Hence z-index, hence inline.

     Gap dimming is folded into --wtl-frame-filter rather than opacity,
     so it cannot collide with the fade. */
  .layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0;
    filter: var(--wtl-frame-filter, none);
  }

  .empty .detail {
    font-size: var(--ha-font-size-s, 0.8rem);
    opacity: 0.75;
    max-width: 34ch;
  }

  .empty {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    gap: 8px;
    padding: 16px;
    text-align: center;
    color: var(--wtl-muted);
    font-size: var(--ha-font-size-m, 0.9rem);
  }

  /* --- overlays ---------------------------------------------------- */

  .stamp,
  .badge {
    position: absolute;
    padding: 4px 8px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: var(--ha-font-size-s, 0.8rem);
    /* Digits must not shift width as the clock ticks. */
    font-variant-numeric: tabular-nums;
    backdrop-filter: blur(2px);
  }

  /* Top-left, because the controls now own the bottom of the stage. */
  .stamp {
    left: 8px;
    top: 8px;
  }

  .badge {
    right: 8px;
    top: 8px;
    letter-spacing: 0.06em;
    font-weight: var(--ha-font-weight-medium, 600);
  }

  .badge.live {
    background: var(--wtl-accent);
  }

  .badge.gap {
    background: var(--wtl-gap);
  }

  /* Back on the bottom-right corner. It shares that edge with the centred
     control pill, which is fine while there is room between them — the
     container query below moves it to the top before the two can meet. */
  .readout {
    position: absolute;
    right: 8px;
    bottom: 8px;
    display: grid;
    gap: 2px;
    padding: 8px 10px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    backdrop-filter: blur(2px);
    font-variant-numeric: tabular-nums;
  }

  /* Opt-in heading for the readings block. Only rendered when the config
     carries a non-empty string, so the default look is unchanged. */
  .readout-title {
    font-size: var(--ha-font-size-s, 0.85rem);
    font-weight: var(--ha-font-weight-medium, 600);
    color: rgba(255, 255, 255, 0.95);
    margin-bottom: 2px;
    /* The readout block is right-aligned against the frame; a heading
       that hugged the same edge would drift away from the labels it
       introduces. */
    text-align: left;
  }

  .readout-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: var(--ha-font-size-s, 0.85rem);
    /* Pinned so the icon has a known box to be centred against. With an
       inherited line-height the row's height varies with the theme, and
       a centred icon drifts off the text by however much it differs. */
    line-height: 1.25;
  }

  /* display is explicit because a custom element is inline by default,
     and width/height on an inline box are ignored — the icon then sized
     itself from --mdc-icon-size alone and sat on the text baseline
     rather than beside it.

     The row is baseline-aligned for the text, so the icon opts out with
     align-self and centres on the line box instead. At 1.25 line-height
     the box is 1.25em and the icon 1.05em, putting its centre 0.625em
     down; the text's optical centre (baseline at ~1.03em, cap height
     ~0.7em) lands at ~0.68em. Close enough to read as aligned, and it
     holds at any font size because every term is in em. */
  .readout-icon {
    display: block;
    --mdc-icon-size: 1.05em;
    width: 1.05em;
    height: 1.05em;
    flex: none;
    align-self: center;
    /* Optical nudge, not geometry. Centring on the line box is correct to
       within half a pixel, but the row's cross size is set by the text's
       descenders, which sit lower than anything in an MDI glyph — so a
       mathematically centred icon still reads slightly low. Bottom margin
       lifts a centre-aligned item by half its value. */
    margin-bottom: 0.16em;
  }

  .readout-name {
    color: rgba(255, 255, 255, 0.75);
  }

  .readout-value {
    margin-left: auto;
    font-weight: var(--ha-font-weight-medium, 600);
  }

  .readout-row.stale .readout-value {
    opacity: 0.55;
  }

  .spark-wrap {
    margin: 2px 0 4px;
    color: rgba(255, 255, 255, 0.7);
  }

  .spark {
    display: block;
    width: 100%;
    height: 34px;
  }

  .readout-at {
    font-size: var(--ha-font-size-xs, 0.7rem);
    color: rgba(255, 255, 255, 0.6);
  }

  /* --- controls ---------------------------------------------------- */

  /* A pill over the frame instead of a bar under it. Removing the row
     from the flow is most of the height this card saves, and the
     controls belong to the picture anyway. Same dark scrim as the other
     stage overlays so it stays legible over any frame. */
  .controls {
    position: absolute;
    left: 50%;
    bottom: 8px;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 2px 6px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(2px);
    color: #fff;
    /* Smaller than the 48px default so the pill stays slim, still well
       over the 24px WCAG 2.5.8 minimum target. */
    --mdc-icon-button-size: 40px;
    --mdc-icon-size: 20px;
  }

  .speed {
    min-width: 40px;
    padding: 6px 8px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }

  .speed:hover {
    background: rgba(255, 255, 255, 0.18);
  }

  .speed:focus-visible {
    outline: 2px solid var(--wtl-accent);
    outline-offset: 2px;
  }

  /* --- scrubber ---------------------------------------------------- */

  /* Dates, bar and clock times as one block. The bands are in normal
     flow and the marks live inside the track, so all three are keyed off
     the same percentage and cannot drift apart. */
  /* The top margin is load-bearing: the date band is the first thing
     under the frame, and with no gap the labels read as part of the
     picture rather than as the timeline's heading. */
  .timeline {
    margin: 12px 12px 8px;
  }

  .band {
    position: relative;
    height: 12px;
  }

  .band.dates {
    margin-bottom: 1px;
  }

  .band.times {
    margin-top: 1px;
  }

  .track {
    position: relative;
    height: 40px; /* WCAG 2.5.8 target size, kept even though the bar is thin */
  }

  /* Behind the bar, not beside it. Paint order is DOM order — the marks
     render before the rail — because a z-index here would re-enter the
     stacking competition .layers exists to contain. */
  .marks {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  /* Centred on the rail so each mark reads as a tick the bar runs
     through, showing equally above and below it. */
  .mark {
    position: absolute;
    top: 50%;
    width: 1px;
    height: 14px;
    transform: translate(-50%, -50%);
    background: var(--wtl-divider);
  }

  .mark.day {
    height: 22px;
    background: var(--wtl-muted);
  }

  .mark.month {
    height: 30px;
    width: 2px;
    background: var(--wtl-muted);
  }

  .rail,
  .fill,
  .gap-run {
    position: absolute;
    top: 50%;
    height: 6px;
    transform: translateY(-50%);
    border-radius: 3px;
    pointer-events: none;
  }

  .rail {
    left: 0;
    right: 0;
    background: var(--wtl-divider);
  }

  .fill {
    left: 0;
    background: var(--wtl-accent);
    opacity: 0.65;
  }

  .gap-run {
    background: repeating-linear-gradient(
      45deg,
      var(--wtl-gap) 0 3px,
      transparent 3px 6px
    );
    opacity: 0.8;
  }

  input[type="range"] {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    background: transparent;
    appearance: none;
    cursor: pointer;
  }

  input[type="range"]:focus-visible {
    outline: 2px solid var(--wtl-accent);
    outline-offset: 2px;
    border-radius: 4px;
  }

  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border: 2px solid var(--wtl-surface);
    border-radius: 50%;
    background: var(--wtl-accent);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  }

  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border: 2px solid var(--wtl-surface);
    border-radius: 50%;
    background: var(--wtl-accent);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  }

  /* --- ruler labels ------------------------------------------------ */

  /* Two bands, dates above the bar and clock times below, so the label
     families never have to be thinned against each other — each only
     collides with its own kind. Dates go on top because a day boundary
     is the coarser unit: the eye reads them as headings over the scale.

     line-height is pinned rather than inherited. The bands are fixed
     height, so a label's box height has to be known here; inheriting
     HA's 1.5 made the date box 17px tall in a 12px band and it spilled
     into the marks below. */
  .lab {
    position: absolute;
    left: 0;
    transform: translateX(-50%);
    font-size: var(--ha-font-size-xs, 0.7rem);
    line-height: 1;
    color: var(--wtl-muted);
    white-space: nowrap;
    pointer-events: none;
  }

  .lab.time {
    top: 0;
    /* Clock digits must not shuffle the label's centre as they change. */
    font-variant-numeric: tabular-nums;
    opacity: 0.7;
  }

  /* Slightly stronger than the clock row: it is the heading, and it
     appears far less often, so it can afford the weight without turning
     the timeline into noise. */
  .lab.date {
    bottom: 0;
    font-weight: 500;
    color: var(--wtl-text);
  }

  /* --- editor ------------------------------------------------------ */

  .ent-section {
    padding: 8px 0 4px;
  }

  .ent-section h4 {
    margin: 8px 0 2px;
    font-weight: var(--ha-font-weight-medium, 500);
  }

  .ent-hint {
    margin: 0 0 12px;
    color: var(--wtl-muted);
    font-size: var(--ha-font-size-s, 0.875rem);
  }

  /* The heading applies to the whole readings block, not to any one row,
     so it sits above them at full width. ha-form is block-level already;
     the wrapper carries only the spacing. */
  .ent-title {
    display: block;
    margin-bottom: 4px;
  }

  .ent-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    padding: 12px 0;
    border-top: 1px solid var(--wtl-divider);
  }

  /* The row is a two-column grid and ha-form is a direct child, so
     without this it lands in the narrow auto column beside the entity
     picker instead of under it. */
  .ent-row ha-form {
    grid-column: 1 / -1;
  }

  .ent-controls {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .ent-actions {
    display: flex;
    align-items: start;
  }

  .swatch {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--ha-font-size-s, 0.875rem);
    color: var(--wtl-muted);
  }

  .swatch input[type="color"] {
    width: 44px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--wtl-divider);
    border-radius: 6px;
    background: none;
    cursor: pointer;
  }

  /* --- version banner ---------------------------------------------- */

  .banner {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 8px 12px;
    background: var(--warning-color, #ffa726);
    color: #000;
    font-size: var(--ha-font-size-s, 0.85rem);
  }

  .banner button {
    margin-left: auto;
    border: 0;
    border-radius: 4px;
    padding: 4px 8px;
    font: inherit;
    cursor: pointer;
  }

  /* --- responsive -------------------------------------------------- */

  /* Breakpoint set by the collision, not by a round number.

     The control pill is centred and the readout is right-aligned, so the
     two close on each other as the card narrows. The pill is ~212px, and
     a three-sensor readout runs ~230px, which puts the meeting point just
     past 600px — hence 620px, with a little margin because the readout's
     width follows its content. Below that the readout moves to the top,
     where nothing else is competing for the space. */
  @container (max-width: 620px) {
    /* Cleared explicitly: the base rule pins the bottom-right corner, and
       an unset side would leave the box anchored to both. */
    .readout {
      right: auto;
      bottom: auto;
      /* Same top edge as the timestamp and the badge, so the three
         overlays read as one row across the top of the frame instead of
         three boxes at unrelated heights. Kept in step with .stamp and
         .badge by a test rather than by memory. */
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      max-width: calc(100% - 16px);
    }

    /* The numbers are the point; the chart is the first thing that should
       go. A sparkline needs width this card no longer has, and dropping
       it also shortens the block so it covers less of the frame. */
    .spark-wrap {
      display: none;
    }
  }

  /* prefers-reduced-motion is handled entirely in TypeScript, not here.

     The frame fade's transition is an inline style, and inline beats a
     stylesheet rule regardless of the media query, so a rule in this
     file would look correct and do nothing. fadeDurationMs() returns 0
     instead, and startAutoplayIfRequested() refuses to start playback,
     both via prefersReducedMotion(). */

  @media (forced-colors: active) {
    .fill,
    .gap-run {
      forced-color-adjust: none;
    }
  }
`;
