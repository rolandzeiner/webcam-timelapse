import { describe, expect, it } from "vite-plus/test";

import source from "./editor.ts?raw";

describe("editor element choice", () => {
  it("never uses ha-textfield", () => {
    // ha-textfield is not registered in the card-editor context: it
    // renders as an unknown element with no content and no error. That
    // silently swallowed the name, unit and decimals inputs on every
    // entity row, and later the overlay heading — the config looked
    // complete while three fields simply were not on screen.
    //
    // Every other ha-* element the editor uses does render. Text and
    // number inputs must go through ha-form selectors, which load their
    // own dependencies.
    expect(source).not.toMatch(/<ha-textfield/);
  });

  it("never uses ha-formfield, and labels the row toggles through ha-form", () => {
    // Home Assistant 2026.11 removes ha-formfield. Wrapped around a
    // hand-placed switch it was the only thing drawing the label, so the
    // "Show icon" and "Graph" toggles would have turned into two bare
    // switches with no text and no accessible name. Like ha-textfield,
    // nothing errors.
    //
    // A boolean selector in the row schema is drawn by the running
    // frontend, label included, on every version the card supports.
    expect(source).not.toMatch(/<ha-formfield/);
    expect(source).not.toMatch(/<ha-switch/);
    expect(source).toMatch(/name: "show_icon", selector: \{ boolean: \{\} \}/);
    expect(source).toMatch(/name: "graph", selector: \{ boolean: \{\} \}/);
  });

  it("routes the overlay heading and row fields through ha-form", () => {
    expect(source).toMatch(/OVERLAY_TITLE_SCHEMA/);
    expect(source).toMatch(/ROW_SCHEMA/);
    // Both must reach a real <ha-form>, not just be declared.
    expect(source.match(/<ha-form/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("offers both readings blocks", () => {
    // The left block is only discoverable here. If the section is never
    // rendered, the feature exists in YAML only and nobody finds it.
    expect(source).toMatch(/renderSection\("right"/);
    expect(source).toMatch(/renderSection\("left"/);
    expect(source).toMatch(/OVERLAY_TITLE_LEFT_SCHEMA/);
  });

  it("writes each block to its own config key", () => {
    // The right-hand block must keep writing to `entities`. Pointing it
    // anywhere else silently orphans every config already in the wild.
    expect(source).toMatch(/right:\s*"entities"/);
    expect(source).toMatch(/left:\s*"entities_left"/);
  });

  it("keeps every text and number input in a selector", () => {
    // A bare <input> would hit the same class of problem from the other
    // side: unstyled and inconsistent with the rest of the editor. The
    // colour swatch is the one sanctioned exception, because HA ships no
    // colour selector.
    const bareInputs = source.match(/<input\b[^>]*type="(?!color)/g);
    expect(bareInputs).toBeNull();
  });
});
