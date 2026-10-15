import { describe, expect, it } from "vite-plus/test";

import { DEFAULTS, normaliseConfig } from "./config";
import { GROUP_FIELDS, GROUPS, groupSummary, rowSchema, TOP_FIELDS } from "./editor-fields";
import de from "./localize/languages/de.json";
import en from "./localize/languages/en.json";
import type { WebcamTimelapseCardConfig } from "./types";

const config = (extra: Partial<WebcamTimelapseCardConfig> = {}): WebcamTimelapseCardConfig => ({
  type: "custom:webcam-timelapse-card",
  camera_entity: "camera.river",
  ...extra,
});

/** A translator that shows which key and value it was asked for. */
const t = (key: string, value?: string): string =>
  value === undefined
    ? key.replace("editor.summary.", "")
    : `${key.replace("editor.summary.", "")}(${value})`;

const names = (schema: unknown[]): string[] =>
  schema.flatMap((entry) => {
    const item = entry as { name?: string; schema?: unknown[] };
    return item.schema ? names(item.schema) : item.name ? [item.name] : [];
  });

describe("editor fields", () => {
  it("has a field for every option with a default", () => {
    // An option added with a default but no field here is YAML-only.
    const fields = new Set(
      [...TOP_FIELDS, ...Object.values(GROUP_FIELDS).flat()].map((field) => field.name),
    );
    expect(Object.keys(DEFAULTS).filter((key) => !fields.has(key as never))).toEqual([]);
  });

  it("puts every toggle on a row of its own", () => {
    // No grid around booleans: two switches side by side wrap their
    // labels into three lines on a phone and read as one control.
    for (const field of Object.values(GROUP_FIELDS).flat()) {
      expect(field.selector).not.toHaveProperty("grid");
    }
    const grids = rowSchema({ entity: "sensor.a", graph: true }, normaliseConfig(config())).filter(
      (entry) => (entry as { type?: string }).type === "grid",
    ) as { schema: { selector: object }[] }[];
    for (const grid of grids) {
      for (const field of grid.schema) expect(field.selector).not.toHaveProperty("boolean");
    }
  });

  it("offers the graph window only where a graph is drawn", () => {
    const on = normaliseConfig(config());
    expect(names(rowSchema({ entity: "sensor.a" }, on))).not.toContain("graph_hours");
    expect(names(rowSchema({ entity: "sensor.a", graph: true }, on))).toContain("graph_hours");
    const off = normaliseConfig(config({ show_graph: false }));
    expect(names(rowSchema({ entity: "sensor.a", graph: true }, off))).not.toContain("graph_hours");
    const window = GROUP_FIELDS.graphs.find((field) => field.name === "graph_hours")!;
    expect(window.visible?.(off)).toBe(false);
  });

  it("names every group in both languages", () => {
    for (const { id } of GROUPS) {
      expect(en.editor.groups[id as keyof typeof en.editor.groups], id).toBeTruthy();
      expect(de.editor.groups[id as keyof typeof de.editor.groups], id).toBeTruthy();
    }
    expect(Object.keys(de.editor.summary).toSorted()).toEqual(
      Object.keys(en.editor.summary).toSorted(),
    );
  });
});

describe("group summaries", () => {
  it("say what each group is set to without opening it", () => {
    expect(groupSummary("right", config(), t)).toBe("values_none");
    expect(
      groupSummary(
        "right",
        config({ overlay_title: "Kleine Erlauf", entities: [{ entity: "a" }, { entity: "b" }] }),
        t,
      ),
    ).toBe("Kleine Erlauf · values_many(2)");
    expect(groupSummary("left", config({ entities_left: [{ entity: "a" }] }), t)).toBe(
      "values_one",
    );
    expect(groupSummary("graphs", config(), t)).toBe(`graph_window(${DEFAULTS.graph_hours})`);
    expect(groupSummary("graphs", config({ show_graph: false }), t)).toBe("hidden");
    expect(groupSummary("timeline", config(), t)).toBe("day_marks");
    expect(groupSummary("timeline", config({ show_dayticks: false }), t)).toBe("no_marks");
    expect(groupSummary("playback", config({ autoplay: true }), t)).toBe(
      `${DEFAULTS.speed}x · autoplay · export_on`,
    );
  });

  it("does not count a row that has no entity yet", () => {
    expect(groupSummary("right", config({ entities: [{ entity: "" }] }), t)).toBe("values_none");
  });
});
