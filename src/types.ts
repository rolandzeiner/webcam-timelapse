// Local mirror of the HA / Lovelace types this card actually uses.
// We only depend on a handful of fields, so pinning a local shape is
// cheaper than carrying a transitive npm dep that drifts behind
// HA-internal types.

/** Single entity in `hass.states`. */
export interface HassEntity {
  state: string;
  attributes: Record<string, unknown> & {
    friendly_name?: string;
    attribution?: string;
    unit_of_measurement?: string;
    device_class?: string;
  };
  last_changed?: string;
  last_updated?: string;
  entity_id?: string;
}

/** Entity-registry entry (subset). `platform` is the integration domain
 *  that owns the entity — the field the entity-first card picker gates on
 *  in `getEntitySuggestion`. */
export interface HassEntityRegistryEntry {
  platform?: string;
  /** Which config entry owns this entity. HA's frontend already exposes
   *  this, so the card can resolve an entry_id from an entity_id without
   *  the integration having to publish a redundant state attribute. */
  config_entry_id?: string;
  [key: string]: unknown;
}

/** Minimal HA shape — only the fields this card touches. */
export interface HomeAssistant {
  states: Record<string, HassEntity>;
  /** Entity-registry map, keyed by entity_id. Present in real HA; the
   *  card-picker suggestion hook reads `entities[id].platform`. */
  entities?: Record<string, HassEntityRegistryEntry>;
  language?: string;
  locale?: { language?: string };
  themes?: { darkMode?: boolean } & Record<string, unknown>;
  config?: {
    time_zone?: string;
    /** The home's coordinates, as the sun integration uses them. */
    latitude?: number;
    longitude?: number;
  } & Record<string, unknown>;
  localize?: (key: string, ...args: unknown[]) => string;
  callWS?<T = unknown>(msg: { type: string; [key: string]: unknown }): Promise<T>;
  /** The live WebSocket connection; only the subscribe call is used. */
  connection?: {
    subscribeMessage<T>(
      callback: (message: T) => void,
      msg: { type: string; [key: string]: unknown },
    ): Promise<() => Promise<void> | void>;
  };
  /** Absolute URL for a path on this Home Assistant instance. */
  hassUrl?: (path?: string) => string;
}

/** Marker every card config extends. */
export interface LovelaceCardConfig {
  type: string;
  [key: string]: unknown;
}

/** Custom-card editor contract — Lovelace expects an HTMLElement that
 *  accepts `setConfig(config)` and reads `hass`. */
export interface LovelaceCardEditor extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: LovelaceCardConfig): void;
}

/** One overlay row. Nothing about any particular sensor is assumed. */
export interface OverlayEntityConfig {
  entity: string;
  name?: string;
  color?: string;
  unit?: string;
  decimals?: number;
  /** Draw a sparkline for this entity as well as the numeric readout. */
  graph?: boolean;
  /**
   * Override the card's `graph_hours` for this row.
   *
   * One window rarely suits every gauge on a card. A river pegel moves
   * every few minutes and reads well over a day; groundwater moves
   * millimetres a day and is a flat line until you give it weeks. Absent,
   * the card-level value applies.
   */
  graph_hours?: number;
  /**
   * Show the entity's own icon ahead of its label.
   *
   * Resolved from the entity rather than configured here, so it follows
   * whatever the user has set in Home Assistant — including the
   * device-class default when no icon is set explicitly.
   */
  show_icon?: boolean;
  /**
   * Read the measurement time from this state attribute instead of
   * `last_updated`. Opt-in per entity — see overlay-history.ts.
   */
  time_attribute?: string;
}

export interface WebcamTimelapseCardConfig extends LovelaceCardConfig {
  camera_entity: string;
  title?: string;
  autoplay?: boolean;
  speed?: number;
  show_dayticks?: boolean;
  show_graph?: boolean;
  /**
   * Shade the hours between sunset and sunrise on every chart.
   *
   * Off by default: it is the right context for an outdoor camera and
   * pure noise for one pointed at a workshop wall, and the card cannot
   * tell which it is looking at.
   */
  show_sun?: boolean;
  /** Width of the sparkline's window in hours, centred on the playhead. */
  graph_hours?: number;
  /**
   * The right-hand readings block. Empty by default — the card is not
   * tied to any domain.
   *
   * Deliberately not renamed to `entities_right` when the second block
   * arrived: this key is in every config written so far, and it keeps
   * the bottom-right corner it has always had.
   */
  entities?: OverlayEntityConfig[];
  /**
   * Heading above the overlay readings.
   *
   * Empty or absent renders nothing at all, which is the original look —
   * the heading is opt-in so existing cards are untouched.
   */
  overlay_title?: string;
  /**
   * The second, left-hand readings block. Opt-in and independent: a card
   * with only this key renders one block on the left, and one with only
   * `entities` is unchanged from before the block existed.
   */
  entities_left?: OverlayEntityConfig[];
  /** Heading above the left-hand readings. Same opt-in rule as `overlay_title`. */
  overlay_title_left?: string;
  /** Smooth cloud-driven brightness jumps during playback. 0 = off. */
  deflicker?: number;
  /**
   * Offer the video export under the timeline.
   *
   * On by default. A wall tablet that only ever shows the camera can
   * turn it off and get the row back.
   */
  show_export?: boolean;
}
