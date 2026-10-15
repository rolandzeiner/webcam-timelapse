/**
 * The editor shows the card's real defaults and saves only what changed.
 *
 * ha-form draws a missing boolean as off and a missing dropdown as blank,
 * so an editor fed the raw config lies about every default-on option. The
 * portfolio shipped that five times, each time in an editor that passed the
 * config straight to ha-form. These pin the fix in config.ts: the display
 * side fills every default in, the save side takes them back out.
 */
import { describe, expect, it } from "vite-plus/test";

import {
  DEFAULTS,
  normaliseConfig,
  normaliseRow,
  ROW_DEFAULTS,
  rowGraphHours,
  tidyConfig,
  tidyRow,
} from "./config";
import type { WebcamTimelapseCardConfig } from "./types";

const TYPE = "custom:webcam-timelapse-card";
const base = (extra: Partial<WebcamTimelapseCardConfig> = {}): WebcamTimelapseCardConfig => ({
  type: TYPE,
  camera_entity: "camera.river",
  ...extra,
});

describe("editor defaults", () => {
  it("shows every default, so a default-on toggle is drawn on", () => {
    const shown = normaliseConfig(base()) as Record<string, unknown>;
    for (const [key, value] of Object.entries(DEFAULTS)) {
      expect(shown[key], key).toBe(value);
    }
  });

  it("keeps what the user set over the defaults", () => {
    const flipped = Object.fromEntries(
      Object.entries(DEFAULTS)
        .filter(([, value]) => typeof value === "boolean")
        .map(([key, value]) => [key, !value]),
    );
    expect(normaliseConfig(base(flipped))).toMatchObject(flipped);
  });

  it("treats cleared values as unset rather than blanking the default", () => {
    const cleared = Object.fromEntries(Object.keys(DEFAULTS).map((key) => [key, ""]));
    expect(normaliseConfig(base(cleared))).toMatchObject(DEFAULTS);
  });

  it("saves only what differs from the defaults, with type first", () => {
    const saved = tidyConfig({ ...normaliseConfig(base()), show_export: false });
    expect(saved).toEqual({ type: TYPE, camera_entity: "camera.river", show_export: false });
    expect(Object.keys(saved)[0]).toBe("type");
  });

  it("round-trips an untouched config unchanged", () => {
    expect(tidyConfig(normaliseConfig(base()))).toEqual(base());
  });

  it("drops an emptied readings list", () => {
    expect(tidyConfig(base({ entities: [] }))).toEqual(base());
  });
});

describe("readings rows", () => {
  it("shows the row's defaults, with the card's graph window", () => {
    expect(normaliseRow({ entity: "sensor.a" }, 48)).toEqual({
      entity: "sensor.a",
      ...ROW_DEFAULTS,
      graph_hours: 48,
    });
  });

  it("saves a row without its defaults, entity first", () => {
    const row = tidyRow({ ...normaliseRow({ entity: "sensor.a" }, 24), unit: "°C" }, 24);
    expect(row).toEqual({ entity: "sensor.a", unit: "°C" });
    expect(Object.keys(row)[0]).toBe("entity");
  });

  it("keeps a row being added, before it has an entity", () => {
    expect(tidyRow({ entity: "" }, 24)).toEqual({ entity: "" });
  });

  it("lets a row follow the card's graph window until it sets its own", () => {
    const config = normaliseConfig(base({ graph_hours: 12 }));
    expect(rowGraphHours({ entity: "sensor.a" }, config)).toBe(12);
    expect(rowGraphHours({ entity: "sensor.a", graph_hours: 72 }, config)).toBe(72);
    // Set back to the card's own window, the key goes.
    const saved = tidyConfig(
      base({ graph_hours: 12, entities: [{ entity: "sensor.a", graph_hours: 12 }] }),
    );
    expect(saved.entities).toEqual([{ entity: "sensor.a" }]);
  });
});
