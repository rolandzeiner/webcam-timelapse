import { describe, expect, it } from "vite-plus/test";

import de from "./languages/de.json";
import en from "./languages/en.json";
import { localize } from "./localize";

/** Every leaf key of a dictionary, as the dot-path localize() takes. */
function keysOf(dictionary: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(dictionary).flatMap(([key, value]) =>
    value && typeof value === "object"
      ? keysOf(value as Record<string, unknown>, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe("localize", () => {
  it("resolves a nested key in the requested language", () => {
    expect(localize("controls.play", "de")).toBe("Abspielen");
    expect(localize("controls.play", "en")).toBe("Play");
  });

  it("strips the region from a BCP-47 tag", () => {
    // HA hands over 'de-AT'; the dictionaries are keyed by 'de'.
    expect(localize("controls.play", "de-AT")).toBe("Abspielen");
    expect(localize("controls.play", "DE_at")).toBe("Abspielen");
  });

  it("falls back to English for a language it does not ship", () => {
    expect(localize("controls.play", "fr")).toBe("Play");
  });

  it("defaults to English without a language", () => {
    expect(localize("controls.play")).toBe("Play");
  });

  it("echoes an unknown key back", () => {
    // The editor relies on this to tell "no helper text" from a real one.
    expect(localize("editor.no_such_key", "de")).toBe("editor.no_such_key");
  });

  it("does not return a branch of the dictionary as a string", () => {
    expect(localize("controls", "en")).toBe("controls");
  });

  it("substitutes the placeholder", () => {
    expect(localize("controls.speed", "en", "{v}", "2")).toBe("Playback speed 2x");
  });

  it("leaves the placeholder alone without a replacement", () => {
    expect(localize("controls.speed", "en", "{v}")).toBe("Playback speed {v}x");
  });
});

describe("dictionaries", () => {
  it("resolve every key they carry", () => {
    // A top-level key that is a reserved word (`export`) cannot be a named
    // export of the JSON module, so a namespace import silently drops it
    // and every key under it echoes back untranslated.
    for (const [lang, dictionary] of [
      ["en", en],
      ["de", de],
    ] as const) {
      for (const key of keysOf(dictionary)) {
        expect(localize(key, lang), `${lang}: ${key}`).not.toBe(key);
      }
    }
  });

  it("carry the same keys in every language", () => {
    // A key missing from one dictionary falls back to English without a
    // trace, so a German user sees one English label and nothing fails.
    expect(keysOf(de).toSorted()).toEqual(keysOf(en).toSorted());
  });
});
