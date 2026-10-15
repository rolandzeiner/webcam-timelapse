/**
 * What the visual editor shows, as plain data.
 *
 * Kept apart from the editor element so a node test can read it: the guard
 * in editor-fields.test.ts fails when an option with a default has no field
 * here, which is how a new option used to end up YAML-only.
 *
 * The groups follow the card from top to bottom — the readings over the
 * picture, their graphs, the timeline under it, the player bar — so the
 * editor reads in the order the card does.
 */
import { DEFAULTS, type NormalisedConfig, normaliseConfig, SPEEDS } from "./config";
import type { ReadoutSide } from "./overlay-groups";
import type { OverlayEntityConfig, WebcamTimelapseCardConfig } from "./types";

export type FieldName = keyof typeof DEFAULTS | "camera_entity" | "title";

export interface EditorField {
  name: FieldName | "overlay_title" | "overlay_title_left";
  selector: Record<string, unknown>;
  required?: boolean;
  /**
   * Shown only while this holds. A function rather than ha-form's own
   * `visible` key, which needs frontend 2026.8 — well above this card's
   * floor, where the key is ignored and the field always drawn.
   */
  visible?: (config: NormalisedConfig) => boolean;
}

/** Everyone sets these, so they sit bare at the top. */
export const TOP_FIELDS: readonly EditorField[] = [
  {
    name: "camera_entity",
    required: true,
    // Pinned to this integration: any other camera would give the card a
    // live image and no archive to scrub.
    selector: { entity: { filter: { domain: "camera", integration: "webcam_timelapse" } } },
  },
  { name: "title", selector: { text: {} } },
];

export type PlainGroup = "graphs" | "timeline" | "playback";
export type GroupId = ReadoutSide | PlainGroup;

/** Every group in the card's own order, with its outline icon. */
export const GROUPS: readonly { id: GroupId; icon: string }[] = [
  { id: "right", icon: "mdi:dock-right" },
  { id: "left", icon: "mdi:dock-left" },
  { id: "graphs", icon: "mdi:chart-line" },
  { id: "timeline", icon: "mdi:timeline-clock-outline" },
  { id: "playback", icon: "mdi:play-circle-outline" },
];

/** The groups made of plain fields. Each toggle is a row of its own. */
export const GROUP_FIELDS: Record<PlainGroup, readonly EditorField[]> = {
  graphs: [
    { name: "show_graph", selector: { boolean: {} } },
    {
      name: "graph_hours",
      selector: { number: { min: 1, max: 336, mode: "slider", unit_of_measurement: "h" } },
      visible: (config) => config.show_graph,
    },
  ],
  timeline: [
    { name: "show_dayticks", selector: { boolean: {} } },
    { name: "show_sun", selector: { boolean: {} } },
  ],
  playback: [
    {
      name: "speed",
      selector: {
        select: {
          mode: "dropdown",
          options: SPEEDS.map((speed) => ({ value: speed, label: `${speed}x` })),
        },
      },
    },
    { name: "autoplay", selector: { boolean: {} } },
    { name: "deflicker", selector: { number: { min: 0, max: 100, step: 5, mode: "slider" } } },
    { name: "show_export", selector: { boolean: {} } },
  ],
};

/** The config key each readings block lives under, and its heading's. */
export const BLOCK_KEYS = {
  // `entities`, not a symmetrical `entities_right`: that key is in every
  // config written so far, and renaming it would migrate them all.
  right: { rows: "entities", title: "overlay_title" },
  left: { rows: "entities_left", title: "overlay_title_left" },
} as const satisfies Record<
  ReadoutSide,
  { rows: keyof WebcamTimelapseCardConfig; title: keyof WebcamTimelapseCardConfig }
>;

/**
 * One readings row's fields. Text and number inputs go through selectors,
 * never ha-textfield, which is not registered in the card editor and
 * renders as nothing at all. The two toggles are boolean selectors for the
 * same reason: ha-formfield, which used to draw their labels, leaves with
 * Home Assistant 2026.11.
 */
export function rowSchema(row: OverlayEntityConfig, config: NormalisedConfig): unknown[] {
  const graphed = row.graph === true && config.show_graph;
  return [
    { name: "entity", required: true, selector: { entity: {} } },
    {
      type: "grid",
      schema: [
        { name: "name", selector: { text: {} } },
        { name: "unit", selector: { text: {} } },
      ],
    },
    { name: "decimals", selector: { number: { min: 0, max: 4, mode: "box" } } },
    { name: "show_icon", selector: { boolean: {} } },
    { name: "graph", selector: { boolean: {} } },
    // Per-row override of the card's graph window. Only offered while the
    // row draws a graph: the window means nothing otherwise.
    ...(graphed
      ? [
          {
            name: "graph_hours",
            selector: { number: { min: 1, max: 8760, mode: "box", unit_of_measurement: "h" } },
          },
        ]
      : []),
  ];
}

type Translate = (key: string, value?: string) => string;

/**
 * The line under a collapsed group: what it is set to, so nobody has to open
 * a panel to find out. Two or three values at most.
 */
export function groupSummary(id: GroupId, raw: WebcamTimelapseCardConfig, t: Translate): string {
  const config = normaliseConfig(raw);
  switch (id) {
    case "right":
    case "left": {
      const keys = BLOCK_KEYS[id];
      const rows = (config[keys.rows] ?? []).filter((row) => row.entity);
      const count =
        rows.length === 0
          ? t("editor.summary.values_none")
          : rows.length === 1
            ? t("editor.summary.values_one")
            : t("editor.summary.values_many", String(rows.length));
      const title = config[keys.title]?.trim();
      return rows.length > 0 && title ? `${title} · ${count}` : count;
    }
    case "graphs":
      return config.show_graph
        ? t("editor.summary.graph_window", String(config.graph_hours))
        : t("editor.summary.hidden");
    case "timeline": {
      const parts = [
        config.show_dayticks ? t("editor.summary.day_marks") : null,
        config.show_sun ? t("editor.summary.nights") : null,
      ].filter((part): part is string => part !== null);
      return parts.length > 0 ? parts.join(" · ") : t("editor.summary.no_marks");
    }
    case "playback":
      return [
        `${config.speed}x`,
        config.autoplay ? t("editor.summary.autoplay") : null,
        config.show_export ? t("editor.summary.export_on") : t("editor.summary.export_off"),
      ]
        .filter((part): part is string => part !== null)
        .join(" · ");
  }
}
