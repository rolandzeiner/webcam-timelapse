/**
 * Visual editor.
 *
 * Surface 2 of the three the house style allows: `<ha-form>` inside
 * `getConfigElement()`. The scalar fields are all schema-able, so they go
 * through ha-form and inherit theme, i18n, dark mode and a11y for free.
 *
 * The `entities` list is the documented exception — a dynamic Record that
 * ha-form cannot express — so it gets one bespoke section *below* the
 * form rather than replacing it.
 */

import { LitElement, html, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { cardStyles } from "./card-styles";
import { localize } from "./localize/localize";
import type { ReadoutSide } from "./overlay-groups";
import type {
  HomeAssistant,
  LovelaceCardEditor,
  OverlayEntityConfig,
  WebcamTimelapseCardConfig,
} from "./types";

/** Must stay in step with `SPEEDS` in `webcam-timelapse-card.ts`. */
const SPEEDS = [1, 2, 4, 8, 16, 32, 64];

/**
 * Text and number inputs go through ha-form selectors, never ha-textfield.
 *
 * `ha-textfield` is not registered in the card-editor context — it renders
 * as an unknown element with no content, which silently swallowed the
 * name, unit and decimals fields on every entity row and, later, the
 * overlay heading. Nothing errors; the inputs are simply absent. `ha-form`
 * loads its own selectors, so anything routed through it is safe.
 */
const OVERLAY_TITLE_SCHEMA = [
  { name: "overlay_title", selector: { text: {} } },
] as const;

const OVERLAY_TITLE_LEFT_SCHEMA = [
  { name: "overlay_title_left", selector: { text: {} } },
] as const;

const ROW_SCHEMA = [
  {
    type: "grid",
    schema: [
      { name: "name", selector: { text: {} } },
      { name: "unit", selector: { text: {} } },
      { name: "decimals", selector: { number: { min: 0, max: 4, mode: "box" } } },
      // Per-row override of the card's graph window. Left empty on almost
      // every row; it exists for the gauge whose cadence is nothing like
      // the others on the same card.
      {
        name: "graph_hours",
        selector: {
          number: { min: 1, max: 8760, mode: "box", unit_of_measurement: "h" },
        },
      },
    ],
  },
] as const;

interface HaFormEvent extends CustomEvent {
  detail: { value: WebcamTimelapseCardConfig };
}

@customElement("webcam-timelapse-card-editor")
export class WebcamTimelapseCardEditor
  extends LitElement
  implements LovelaceCardEditor
{
  static override styles = cardStyles;

  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private config?: WebcamTimelapseCardConfig;

  public setConfig(config: WebcamTimelapseCardConfig): void {
    this.config = config;
  }

  private get uiLanguage(): string {
    return this.hass?.locale?.language ?? this.hass?.language ?? "en";
  }

  private t(key: string): string {
    return localize(key, this.uiLanguage);
  }

  private get schema(): unknown[] {
    return [
      {
        name: "camera_entity",
        required: true,
        // Pinned to this integration: pointing the card at any other
        // camera would give it a live image but no archive to scrub.
        selector: {
          entity: { domain: "camera", integration: "webcam_timelapse" },
        },
      },
      { name: "title", selector: { text: {} } },
      {
        type: "grid",
        schema: [
          { name: "show_dayticks", selector: { boolean: {} } },
          { name: "show_graph", selector: { boolean: {} } },
          { name: "show_sun", selector: { boolean: {} } },
        ],
      },
      {
        type: "expandable",
        name: "playback",
        icon: "mdi:play-speed",
        // MANDATORY. Without it the values nest under `playback` and
        // `config.autoplay` reads undefined — the toggle flips but the
        // card never reacts, which is a genuinely confusing hour to lose.
        flatten: true,
        schema: [
          { name: "autoplay", selector: { boolean: {} } },
          {
            name: "speed",
            selector: {
              select: {
                mode: "dropdown",
                options: SPEEDS.map((s) => ({
                  value: s,
                  label: `${s}x`,
                })),
              },
            },
          },
          {
            name: "deflicker",
            selector: {
              number: { min: 0, max: 100, step: 5, mode: "slider" },
            },
          },
          {
            name: "graph_hours",
            selector: {
              number: { min: 1, max: 336, mode: "slider", unit_of_measurement: "h" },
            },
          },
        ],
      },
    ];
  }

  private computeLabel = (schema: { name: string }): string =>
    this.t(`editor.${schema.name}`);

  private computeHelper = (schema: { name: string }): string | undefined => {
    const helper = this.t(`editor.helper.${schema.name}`);
    // localize() echoes the key back when there is no translation; an
    // undefined helper renders nothing, a key-shaped string looks broken.
    return helper.startsWith("editor.") ? undefined : helper;
  };

  private onFormChange(event: HaFormEvent): void {
    event.stopPropagation();
    this.emit({ ...this.config, ...event.detail.value });
  }

  private emit(config: WebcamTimelapseCardConfig): void {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // --- entities list ------------------------------------------------

  /**
   * The config key each block's entities live under.
   *
   * The right-hand block keeps `entities` rather than moving to a
   * symmetrical `entities_right`, because that key is in every config
   * written so far and renaming it would migrate them all for cosmetics.
   */
  private static readonly ENTITY_KEY = {
    right: "entities",
    left: "entities_left",
  } as const satisfies Record<ReadoutSide, keyof WebcamTimelapseCardConfig>;

  private rows(side: ReadoutSide): OverlayEntityConfig[] {
    return this.config?.[WebcamTimelapseCardEditor.ENTITY_KEY[side]] ?? [];
  }

  /** Never mutate `this.config` in place — Lovelace holds that object. */
  private updateRows(side: ReadoutSide, rows: OverlayEntityConfig[]): void {
    this.emit({
      ...this.config!,
      [WebcamTimelapseCardEditor.ENTITY_KEY[side]]: rows,
    });
  }

  private addRow(side: ReadoutSide): void {
    this.updateRows(side, [...this.rows(side), { entity: "" }]);
  }

  private removeRow(side: ReadoutSide, index: number): void {
    this.updateRows(
      side,
      this.rows(side).filter((_, i) => i !== index),
    );
  }

  private moveRow(side: ReadoutSide, index: number, delta: -1 | 1): void {
    const rows = [...this.rows(side)];
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    [rows[index], rows[target]] = [rows[target]!, rows[index]!];
    this.updateRows(side, rows);
  }

  private patchRow(
    side: ReadoutSide,
    index: number,
    patch: Partial<OverlayEntityConfig>,
  ): void {
    const rows = this.rows(side).map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    this.updateRows(side, rows);
  }

  private renderRow(
    side: ReadoutSide,
    row: OverlayEntityConfig,
    index: number,
  ): TemplateResult {
    const label = row.name || row.entity || this.t("editor.entity");
    return html`
      <div class="ent-row" role="group" aria-label=${label}>
        <ha-entity-picker
          .hass=${this.hass}
          .value=${row.entity}
          allow-custom-entity
          @value-changed=${(e: CustomEvent<{ value: string }>) => {
            e.stopPropagation();
            this.patchRow(side, index, { entity: e.detail.value });
          }}
        ></ha-entity-picker>

        <ha-form
          .hass=${this.hass}
          .data=${row}
          .schema=${ROW_SCHEMA}
          .computeLabel=${this.computeLabel}
          @value-changed=${(e: CustomEvent<{ value: OverlayEntityConfig }>) => {
            e.stopPropagation();
            this.patchRow(side, index, e.detail.value);
          }}
        ></ha-form>

        <div class="ent-controls">
          <!-- The one sanctioned native control: HA ships no colour
               selector. Both @input and @change are wired — @input gives
               a live preview while dragging, @change is what fires on
               some platforms when the picker closes. -->
          <label class="swatch">
            <span>${this.t("editor.color")}</span>
            <input
              type="color"
              .value=${row.color ?? "#3d7ea6"}
              @input=${(e: Event) =>
                this.patchRow(side, index, {
                  color: (e.target as HTMLInputElement).value,
                })}
              @change=${(e: Event) =>
                this.patchRow(side, index, {
                  color: (e.target as HTMLInputElement).value,
                })}
            />
          </label>

          <ha-formfield .label=${this.t("editor.show_icon")}>
            <ha-switch
              .checked=${row.show_icon ?? false}
              @change=${(e: Event) =>
                this.patchRow(side, index, {
                  show_icon: (e.target as HTMLInputElement).checked,
                })}
            ></ha-switch>
          </ha-formfield>

          <ha-formfield .label=${this.t("editor.graph")}>
            <ha-switch
              .checked=${row.graph ?? false}
              @change=${(e: Event) =>
                this.patchRow(side, index, {
                  graph: (e.target as HTMLInputElement).checked,
                })}
            ></ha-switch>
          </ha-formfield>
        </div>

        <div class="ent-actions">
          <ha-icon-button
            .label=${this.t("editor.move_up")}
            .disabled=${index === 0}
            @click=${() => this.moveRow(side, index, -1)}
          >
            <ha-icon icon="mdi:arrow-up"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            .label=${this.t("editor.move_down")}
            .disabled=${index === this.rows(side).length - 1}
            @click=${() => this.moveRow(side, index, 1)}
          >
            <ha-icon icon="mdi:arrow-down"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            .label=${this.t("editor.remove")}
            @click=${() => this.removeRow(side, index)}
          >
            <ha-icon icon="mdi:delete-outline"></ha-icon>
          </ha-icon-button>
        </div>
      </div>
    `;
  }

  protected override render(): TemplateResult {
    if (!this.hass || !this.config) return html`${nothing}`;

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this.config}
        .schema=${this.schema}
        .computeLabel=${this.computeLabel}
        .computeHelper=${this.computeHelper}
        @value-changed=${this.onFormChange}
      ></ha-form>

      ${this.renderSection("right", OVERLAY_TITLE_SCHEMA)}
      ${this.renderSection("left", OVERLAY_TITLE_LEFT_SCHEMA)}
    `;
  }

  /**
   * One block's heading and entity list.
   *
   * Both sections are always shown. An empty left section is what tells
   * someone the second block exists at all — discovering it would
   * otherwise mean reading the YAML docs, and the card renders exactly
   * as before until a row is added to it.
   */
  private renderSection(
    side: ReadoutSide,
    titleSchema: unknown,
  ): TemplateResult {
    // Built outside the template on purpose. A nested backtick inside an
    // html`` body is valid JavaScript but it mis-segments the CI guard
    // that scans these templates for stray backticks, which would blunt
    // that check for everything below this point in the file.
    const heading = this.t("editor.overlay_" + side);
    const hint = this.t("editor.overlay_" + side + "_hint");

    return html`
      <div class="ent-section">
        <h4>${heading}</h4>
        <p class="ent-hint">${hint}</p>

        <div class="ent-title">
          <ha-form
            .hass=${this.hass}
            .data=${this.config}
            .schema=${titleSchema}
            .computeLabel=${this.computeLabel}
            .computeHelper=${this.computeHelper}
            @value-changed=${this.onFormChange}
          ></ha-form>
        </div>

        ${this.rows(side).map((row, index) => this.renderRow(side, row, index))}
        <ha-button @click=${() => this.addRow(side)}>
          <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
          ${this.t("editor.add_entity")}
        </ha-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "webcam-timelapse-card-editor": WebcamTimelapseCardEditor;
  }
}
