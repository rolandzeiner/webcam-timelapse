/**
 * One table of defaults, shared by the card and its editor.
 *
 * ha-form knows nothing about a card's defaults. Given a config without a
 * key it draws a boolean as off, a dropdown as blank and a slider at its
 * minimum, so an editor fed the raw config shows every default-on option
 * switched off while the card renders it on. The rule: every optional
 * field's default lives here and nowhere else. The card reads its config
 * through normaliseConfig() and never writes an inline default (a
 * `!== false` read, a `?? 24` fallback); the editor shows
 * normaliseConfig(config) and saves tidyConfig(next).
 *
 * Verification gate, which should find nothing:
 *   rg -n 'config\.\w+ (!== false|\?\? (true|false|-?[0-9]))' src/
 *
 * A row's graph window is the one default that is not a constant: left
 * unset it follows the card's `graph_hours`, so it gets a function
 * (rowGraphHours) that the card and the editor both call.
 */
import type { OverlayEntityConfig, WebcamTimelapseCardConfig } from "./types";

/** Playback multipliers the card offers. */
export const SPEEDS = [1, 2, 4, 8, 16, 32, 64] as const;

export const DEFAULTS = {
  autoplay: false,
  // 32x, because at one-minute capture a fortnight is 20,000 frames and
  // anything slower takes longer to watch than it is worth.
  speed: 32,
  show_dayticks: true,
  show_graph: true,
  show_sun: false,
  graph_hours: 24,
  deflicker: 50,
  show_export: true,
} as const satisfies Partial<WebcamTimelapseCardConfig>;

/** Defaults of one readings row. */
export const ROW_DEFAULTS = {
  decimals: 1,
  show_icon: false,
  graph: false,
} as const satisfies Partial<OverlayEntityConfig>;

/**
 * The config as the card reads it: every DEFAULTS key is present, so a
 * numeric default reads as `number`, not `number | undefined`.
 */
export type NormalisedConfig = WebcamTimelapseCardConfig &
  Required<Pick<WebcamTimelapseCardConfig, keyof typeof DEFAULTS>>;

/** "" is what a cleared text field or dropdown hands back. */
const isUnset = (value: unknown): boolean => value === undefined || value === null || value === "";

/**
 * `config` with `defaults` filled in. Unset values fall back to the default
 * rather than blanking it, and the user's keys keep their order with the
 * defaults after them: ha-form saves back in this order, so filling the
 * defaults in first would move every changed option above the camera in
 * the saved YAML.
 */
function fill<T extends object>(config: T, defaults: object): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (!isUnset(value)) out[key] = value;
  }
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in out)) out[key] = value;
  }
  return out as T;
}

/** Only what differs from `defaults`, cleared fields dropped. */
function strip<T extends object>(config: T, defaults: object): T {
  const known: Record<string, unknown> = { ...defaults };
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (isUnset(value)) continue;
    if (key in known && known[key] === value) continue;
    out[key] = value;
  }
  return out as T;
}

/** The config with every default filled in: what the card renders and the editor shows. */
export function normaliseConfig(config: WebcamTimelapseCardConfig): NormalisedConfig {
  return fill(config, DEFAULTS) as NormalisedConfig;
}

/**
 * The config as the editor saves it: only what differs from DEFAULTS, each
 * readings row tidied the same way, `type` first. A default saved into the
 * YAML is pinned — a later change to DEFAULTS would never reach that card.
 */
export function tidyConfig(config: WebcamTimelapseCardConfig): WebcamTimelapseCardConfig {
  const graphHours = config.graph_hours ?? DEFAULTS.graph_hours;
  const out: Record<string, unknown> = strip(config, DEFAULTS);
  for (const key of ["entities", "entities_left"] as const) {
    const rows = config[key];
    if (rows === undefined) continue;
    if (rows.length === 0) delete out[key];
    else out[key] = rows.map((row) => tidyRow(row, graphHours));
  }
  const { type, ...rest } = out;
  return { type, ...rest } as WebcamTimelapseCardConfig;
}

/** One readings row with its defaults filled in, for the editor to show. */
export function normaliseRow(row: OverlayEntityConfig, graphHours: number): OverlayEntityConfig {
  return fill(row, { ...ROW_DEFAULTS, graph_hours: graphHours });
}

/**
 * One readings row as saved. The entity stays even while empty: it is what
 * keeps a freshly added row on screen until one is picked. A graph window
 * equal to the card's is dropped, so the row goes on following the card.
 */
export function tidyRow(row: OverlayEntityConfig, graphHours: number): OverlayEntityConfig {
  const { entity: _entity, ...rest } = strip(row, { ...ROW_DEFAULTS, graph_hours: graphHours });
  return { entity: row.entity ?? "", ...rest };
}

/** The graph window a row uses: its own, else the card's. */
export function rowGraphHours(row: OverlayEntityConfig, config: NormalisedConfig): number {
  return row.graph_hours ?? config.graph_hours;
}
