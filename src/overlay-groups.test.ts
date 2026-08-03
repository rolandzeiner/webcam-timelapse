import { describe, expect, it } from "vitest";

import { overlayGroups } from "./overlay-groups";
import type { WebcamTimelapseCardConfig } from "./types";

/** The two keys every test here needs; the rest of the config is irrelevant. */
function config(
  overrides: Partial<WebcamTimelapseCardConfig>,
): WebcamTimelapseCardConfig {
  return { type: "custom:webcam-timelapse-card", camera_entity: "camera.x", ...overrides };
}

describe("overlay groups", () => {
  it("puts a lone `entities` block on the right", () => {
    // THE regression that matters. Every config written before there was
    // a second block uses `entities`, and every one of them must still
    // land in the corner it has always had. If this ever reports "left",
    // existing dashboards move on upgrade.
    const groups = overlayGroups(
      config({ entities: [{ entity: "sensor.level" }] }),
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.side).toBe("right");
  });

  it("puts a lone `entities_left` block on the left", () => {
    // The side is in the key name, not in how many blocks happen to be
    // configured — so the left block alone still renders left rather
    // than falling back to the original corner.
    const groups = overlayGroups(
      config({ entities_left: [{ entity: "sensor.temp" }] }),
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.side).toBe("left");
  });

  it("orders the pair left-first so the narrow column can reverse it", () => {
    // Not cosmetic. The narrow layout stacks with column-reverse, which
    // is what lifts the right-hand block above the left one. That only
    // works if the left block is first in the DOM.
    const groups = overlayGroups(
      config({
        entities: [{ entity: "sensor.level" }],
        entities_left: [{ entity: "sensor.temp" }],
      }),
    );

    expect(groups.map((group) => group.side)).toEqual(["left", "right"]);
  });

  it("renders nothing when neither block has entities", () => {
    expect(overlayGroups(config({}))).toEqual([]);
    expect(overlayGroups(config({ entities: [], entities_left: [] }))).toEqual([]);
    expect(overlayGroups(undefined)).toEqual([]);
  });

  it("keeps each heading with its own block", () => {
    const groups = overlayGroups(
      config({
        overlay_title: "Pegel",
        entities: [{ entity: "sensor.level" }],
        overlay_title_left: "Wetter",
        entities_left: [{ entity: "sensor.temp" }],
      }),
    );

    expect(groups).toEqual([
      expect.objectContaining({ side: "left", title: "Wetter" }),
      expect.objectContaining({ side: "right", title: "Pegel" }),
    ]);
  });

  it("treats a blank heading as none", () => {
    // A heading of spaces would otherwise reserve an empty line above
    // the readings, which reads as a rendering bug rather than a typo.
    const groups = overlayGroups(
      config({ overlay_title: "   ", entities: [{ entity: "sensor.level" }] }),
    );

    expect(groups[0]?.title).toBeUndefined();
  });
});
