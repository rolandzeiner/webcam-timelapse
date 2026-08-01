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
import type {
  HomeAssistant,
  LovelaceCardEditor,
  OverlayEntityConfig,
  WebcamTimelapseCardConfig,
} from "./types";

const SPEEDS = [1, 2, 4, 8, 16, 32];

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

  private get rows(): OverlayEntityConfig[] {
    return this.config?.entities ?? [];
  }

  /** Never mutate `this.config` in place — Lovelace holds that object. */
  private updateRows(rows: OverlayEntityConfig[]): void {
    this.emit({ ...this.config!, entities: rows });
  }

  private addRow(): void {
    this.updateRows([...this.rows, { entity: "" }]);
  }

  private removeRow(index: number): void {
    this.updateRows(this.rows.filter((_, i) => i !== index));
  }

  private moveRow(index: number, delta: -1 | 1): void {
    const rows = [...this.rows];
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    [rows[index], rows[target]] = [rows[target]!, rows[index]!];
    this.updateRows(rows);
  }

  private patchRow(index: number, patch: Partial<OverlayEntityConfig>): void {
    const rows = this.rows.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    this.updateRows(rows);
  }

  private renderRow(row: OverlayEntityConfig, index: number): TemplateResult {
    const label = row.name || row.entity || this.t("editor.entity");
    return html`
      <div class="ent-row" role="group" aria-label=${label}>
        <ha-entity-picker
          .hass=${this.hass}
          .value=${row.entity}
          allow-custom-entity
          @value-changed=${(e: CustomEvent<{ value: string }>) => {
            e.stopPropagation();
            this.patchRow(index, { entity: e.detail.value });
          }}
        ></ha-entity-picker>

        <div class="ent-controls">
          <ha-textfield
            .label=${this.t("editor.name")}
            .value=${row.name ?? ""}
            @change=${(e: Event) =>
              this.patchRow(index, {
                name: (e.target as HTMLInputElement).value,
              })}
          ></ha-textfield>

          <ha-textfield
            .label=${this.t("editor.unit")}
            .value=${row.unit ?? ""}
            @change=${(e: Event) =>
              this.patchRow(index, {
                unit: (e.target as HTMLInputElement).value,
              })}
          ></ha-textfield>

          <ha-textfield
            .label=${this.t("editor.decimals")}
            type="number"
            min="0"
            max="4"
            .value=${String(row.decimals ?? 1)}
            @change=${(e: Event) =>
              this.patchRow(index, {
                decimals: Number((e.target as HTMLInputElement).value),
              })}
          ></ha-textfield>

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
                this.patchRow(index, {
                  color: (e.target as HTMLInputElement).value,
                })}
              @change=${(e: Event) =>
                this.patchRow(index, {
                  color: (e.target as HTMLInputElement).value,
                })}
            />
          </label>

          <ha-formfield .label=${this.t("editor.graph")}>
            <ha-switch
              .checked=${row.graph ?? false}
              @change=${(e: Event) =>
                this.patchRow(index, {
                  graph: (e.target as HTMLInputElement).checked,
                })}
            ></ha-switch>
          </ha-formfield>
        </div>

        <div class="ent-actions">
          <ha-icon-button
            .label=${this.t("editor.move_up")}
            .disabled=${index === 0}
            @click=${() => this.moveRow(index, -1)}
          >
            <ha-icon icon="mdi:arrow-up"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            .label=${this.t("editor.move_down")}
            .disabled=${index === this.rows.length - 1}
            @click=${() => this.moveRow(index, 1)}
          >
            <ha-icon icon="mdi:arrow-down"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            .label=${this.t("editor.remove")}
            @click=${() => this.removeRow(index)}
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

      <div class="ent-section">
        <h4>${this.t("editor.overlay")}</h4>
        <p class="ent-hint">${this.t("editor.overlay_hint")}</p>
        ${this.rows.map((row, index) => this.renderRow(row, index))}
        <ha-button @click=${this.addRow}>
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
