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
  config?: { time_zone?: string } & Record<string, unknown>;
  localize?: (key: string, ...args: unknown[]) => string;
  callWS?<T = unknown>(msg: { type: string; [key: string]: unknown }): Promise<T>;
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

/** Tag-map entry for the built-in error card. */
export type LovelaceCard = HTMLElement;

/** `bubbles: true` + `composed: true` are required so the event crosses
 *  the editor's shadow boundary and reaches the dashboard's
 *  card-editor listener. */
export function fireEvent<T>(
  node: HTMLElement,
  type: string,
  detail: T,
): void {
  node.dispatchEvent(
    new CustomEvent(type, { detail, bubbles: true, composed: true }),
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "skill-demo-austria-card-editor": LovelaceCardEditor;
    "hui-error-card": LovelaceCard;
    "ha-form": HaFormElement;
    "ha-selector": HaSelectorElement;
  }
}

interface HaFormElement extends HTMLElement {
  hass?: HomeAssistant;
  data?: Record<string, unknown>;
  schema?: ReadonlyArray<HaFormSchema>;
  computeLabel?: (field: { name: string }) => string;
  computeHelper?: (field: { name: string }) => string | undefined;
}

interface HaSelectorElement extends HTMLElement {
  hass?: HomeAssistant;
  selector?: HASelector;
  value?: unknown;
  label?: string;
  required?: boolean;
}

// HASelector — exhaustive union of the ha-form selectors useful in card
// configs as of HA 2026. The canonical (and longer) list lives in
// `frontend/src/data/selector.ts`; this covers every variant the
// Skill Demo card surfaces in its showcase editor.
export type HASelector =
  | {
      entity: {
        domain?: string | string[];
        integration?: string;
        device_class?: string | string[];
        multiple?: boolean;
        filter?: Record<string, unknown>;
      };
    }
  | { area: { multiple?: boolean } }
  | { floor: { multiple?: boolean } }
  | { label: { multiple?: boolean } }
  | { device: { integration?: string; multiple?: boolean } }
  | { boolean: Record<string, never> }
  | {
      text: {
        type?: "text" | "password" | "url" | "email" | "tel" | "search";
        multiline?: boolean;
        prefix?: string;
        suffix?: string;
      };
    }
  | {
      number: {
        min?: number;
        max?: number;
        step?: number;
        mode?: "box" | "slider";
        unit_of_measurement?: string;
      };
    }
  | {
      select: {
        mode?: "dropdown" | "list";
        multiple?: boolean;
        custom_value?: boolean;
        options: ReadonlyArray<{ value: string; label: string }>;
      };
    }
  | { color_rgb: Record<string, never> }
  | { color_temp: { min_mireds?: number; max_mireds?: number } }
  | { ui_color: { default_color?: string; include_state?: boolean; include_none?: boolean } }
  | { icon: { placeholder?: string; fallbackPath?: string } }
  | { time: Record<string, never> }
  | { date: Record<string, never> }
  | { datetime: Record<string, never> }
  | {
      duration: {
        enable_day?: boolean;
        enable_millisecond?: boolean;
      };
    }
  | { object: Record<string, never> }
  | { template: Record<string, never> }
  | { theme: { include_default?: boolean } }
  | { language: { languages?: ReadonlyArray<string>; native_name?: boolean; no_sort?: boolean } }
  | { country: { countries?: ReadonlyArray<string>; no_sort?: boolean } }
  | {
      ui_action: {
        actions?: ReadonlyArray<
          | "more-info"
          | "toggle"
          | "call-service"
          | "perform-action"
          | "navigate"
          | "url"
          | "none"
        >;
        default_action?: string;
      };
    }
  | {
      target: {
        entity?: { domain?: string | string[]; integration?: string };
        device?: { integration?: string };
        area?: Record<string, never>;
      };
    }
  | {
      attribute: {
        entity_id?: string;
        hide_attributes?: ReadonlyArray<string>;
      };
    }
  | {
      state: {
        entity_id?: string;
        attribute?: string;
      };
    }
  | {
      qr_code: {
        data?: string;
        scale?: number;
        error_correction_level?: "low" | "medium" | "quartile" | "high";
      };
    }
  | { constant: { value: string | number | boolean; label?: string } };

export interface HaFormBaseSchema {
  name: string;
  required?: boolean;
}
export interface HaFormSelectorSchema extends HaFormBaseSchema {
  selector: HASelector;
}
export interface HaFormGridSchema {
  type: "grid";
  name: "";
  schema: ReadonlyArray<HaFormSchema>;
}
export interface HaFormExpandableSchema {
  type: "expandable";
  name: string;
  title?: string;
  /**
   * REQUIRED for flat config shapes. Without it, ha-form's value-changed
   * reducer nests the inner fields under data[name] and the card
   * silently misses them.
   */
  flatten?: boolean;
  schema: ReadonlyArray<HaFormSchema>;
}
export type HaFormSchema =
  | HaFormSelectorSchema
  | HaFormGridSchema
  | HaFormExpandableSchema;

/** Card config.
 *
 * The first block is the *real* card config — the fields the card body
 * reads to render itself. The rest are showcase fields surfaced by the
 * editor to demonstrate every native ha-form selector available in HA
 * 2026. They are stored on the config object (so a `show_debug: true`
 * card body can dump them) but otherwise have no effect.
 *
 * All showcase fields are optional — leaving them blank produces a
 * valid card. Field names are namespaced (`txt_*`, `num_*`, `pick_*`,
 * `data_*`, `flag_*`) so they cannot collide with future first-class
 * config keys. */
export interface SkillDemoAustriaCardConfig extends LovelaceCardConfig {
  type: string;
  name?: string;
  /** Required — the `*_example` sensor from the integration. */
  entity?: string;
  /** Optional — the `*_online` binary sensor. Renders the status pip. */
  status_entity?: string;
  show_hero?: boolean;
  /** When true, the card body renders a `<details>` block dumping the
   *  full resolved config so users can verify their editor selections. */
  show_debug?: boolean;

  // ── Text inputs ────────────────────────────────────────────────────
  txt_single?: string;
  txt_multi?: string;
  txt_password?: string;
  txt_url?: string;
  txt_email?: string;

  // ── Numbers ───────────────────────────────────────────────────────
  num_box?: number;
  num_slider?: number;

  // ── Toggle ────────────────────────────────────────────────────────
  flag_boolean?: boolean;

  // ── Choosers ──────────────────────────────────────────────────────
  pick_dropdown?: string;
  pick_list?: string;
  pick_multi?: ReadonlyArray<string>;
  pick_custom?: string;

  // ── HA registry pickers ───────────────────────────────────────────
  pick_entity_multi?: ReadonlyArray<string>;
  pick_device?: string;
  pick_area?: string;
  pick_floor?: string;
  pick_label?: string;

  // ── Date / Time ───────────────────────────────────────────────────
  pick_time?: string;
  pick_date?: string;
  pick_datetime?: string;
  pick_duration?: { hours?: number; minutes?: number; seconds?: number };

  // ── Visual ────────────────────────────────────────────────────────
  pick_icon?: string;
  pick_color_rgb?: ReadonlyArray<number>;
  pick_ui_color?: string;
  pick_theme?: string;

  // ── Data ──────────────────────────────────────────────────────────
  data_template?: string;
  data_object?: Record<string, unknown>;
  data_attribute?: string;
  data_state?: string;

  // ── HA-specific ───────────────────────────────────────────────────
  pick_language?: string;
  pick_country?: string;
  pick_action?: Record<string, unknown>;
  pick_target?: Record<string, unknown>;
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
   * Show the entity's own icon ahead of its label.
   *
   * Resolved from the entity rather than configured here, so it follows
   * whatever the user has set in Home Assistant — including the
   * device-class default when no icon is set explicitly.
   */
  show_icon?: boolean;
  /**
   * Read the measurement time from this state attribute instead of
   * `last_changed`. Opt-in per entity — see overlay-history.ts.
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
  /** Hours of history shown behind the playhead. */
  graph_hours?: number;
  /** Empty by default — the card is not tied to any domain. */
  entities?: OverlayEntityConfig[];
  /**
   * Heading above the overlay readings.
   *
   * Empty or absent renders nothing at all, which is the original look —
   * the heading is opt-in so existing cards are untouched.
   */
  overlay_title?: string;
  /** Smooth cloud-driven brightness jumps during playback. 0 = off. */
  deflicker?: number;
}

/**
 * Playback multipliers.
 *
 * Goes well past 8x because the useful range depends on the capture
 * interval, which the user controls. At a ten-minute cadence a fortnight
 * is ~2000 frames and 8x is plenty; at one minute it is ~20,000, and 8x
 * would take twenty minutes to play through.
 */
