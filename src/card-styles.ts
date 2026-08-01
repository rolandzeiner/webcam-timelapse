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

  .stamp {
    left: 8px;
    bottom: 8px;
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

  .readout-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: var(--ha-font-size-s, 0.85rem);
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

  .controls {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 8px;
  }

  .spacer {
    flex: 1;
  }

  .speed {
    min-width: 44px;
    padding: 6px 8px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--wtl-text);
    font: inherit;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }

  .speed:hover {
    background: var(--wtl-divider);
  }

  .speed:focus-visible {
    outline: 2px solid var(--wtl-accent);
    outline-offset: 2px;
  }

  /* --- scrubber ---------------------------------------------------- */

  .track {
    position: relative;
    height: 44px; /* WCAG 2.5.8 target size, kept even though the bar is thin */
    margin: 0 12px;
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

  /* --- day ticks --------------------------------------------------- */

  .dayticks {
    position: relative;
    height: 20px;
    margin: 0 12px 8px;
  }

  .tick {
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    font-size: var(--ha-font-size-xs, 0.7rem);
    color: var(--wtl-muted);
    white-space: nowrap;
  }

  .tick::before {
    content: "";
    display: block;
    width: 1px;
    height: 5px;
    margin: 0 auto 2px;
    background: var(--wtl-divider);
  }

  .tick.month::before {
    height: 8px;
    width: 2px;
    background: var(--wtl-muted);
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

  .ent-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    padding: 12px 0;
    border-top: 1px solid var(--wtl-divider);
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

  @container (max-width: 380px) {
    .readout {
      position: static;
      border-radius: 0;
      background: transparent;
      color: var(--wtl-text);
      backdrop-filter: none;
    }

    .readout-name,
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
      color: var(--wtl-muted);
    }
  }

  /* The frame fade is NOT disabled here. Its transition is an inline
     style, and inline beats a stylesheet rule regardless of the media
     query, so a rule here would look correct and do nothing. The check
     lives in prefersReducedMotion(), read at swap time. */

  @media (forced-colors: active) {
    .fill,
    .gap-run {
      forced-color-adjust: none;
    }
  }
`;
