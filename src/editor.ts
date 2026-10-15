/**
 * Visual editor.
 *
 * Laid out in three tiers, the house layout for an editor past about ten
 * options: the camera and the title bare at the top, then one collapsed
 * group per part of the card in the card's own order, each saying in its
 * header what it is set to. What the groups hold is data, in
 * editor-fields.ts; this file only draws it.
 *
 * Every field goes through ha-form, so it inherits theme, i18n, dark mode
 * and a11y. The readings lists are the bespoke part — a list of rows, each
 * its own small form — and the colour swatch is the one native input,
 * because Home Assistant ships no colour selector that takes a CSS colour.
 */

import { LitElement, html, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { cardStyles } from "./card-styles";
import { type NormalisedConfig, normaliseConfig, normaliseRow, tidyConfig } from "./config";
import {
  BLOCK_KEYS,
  type EditorField,
  GROUP_FIELDS,
  type GroupId,
  GROUPS,
  groupSummary,
  type PlainGroup,
  rowSchema,
  TOP_FIELDS,
} from "./editor-fields";
import { localize } from "./localize/localize";
import type { ReadoutSide } from "./overlay-groups";
import type {
  HomeAssistant,
  LovelaceCardEditor,
  OverlayEntityConfig,
  WebcamTimelapseCardConfig,
} from "./types";

type Data = Record<string, unknown>;

const isReadings = (id: GroupId): id is ReadoutSide => id === "right" || id === "left";

@customElement("webcam-timelapse-card-editor")
export class WebcamTimelapseCardEditor extends LitElement implements LovelaceCardEditor {
  static override styles = cardStyles;

  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private config?: WebcamTimelapseCardConfig;
  /**
   * Groups whose panel is open, so their bodies are built only then. A
   * record of what the panel did, never an instruction to it: see
   * renderGroup for why `expanded` is not bound.
   */
  @state() private open = new Set<GroupId>();
  /** The readings row whose settings are showing; one at a time. */
  @state() private openRow: { side: ReadoutSide; index: number } | undefined;
  /**
   * Whether ha-expansion-panel is registered. Home Assistant loads it
   * lazily — ha-form pulls it in for an `expandable` schema — so a card
   * editor cannot count on it. Until it is there, the groups are drawn as
   * ha-form expandables, which loads it; then they switch to panels that
   * can carry a summary line.
   */
  @state() private panels = customElements.get("ha-expansion-panel") !== undefined;
  /** The theme's accent, which an unset row colour is drawn in. Read once. */
  private accent = "#03a9f4";

  public setConfig(config: WebcamTimelapseCardConfig): void {
    this.config = config;
  }

  protected override firstUpdated(): void {
    const accent = getComputedStyle(this).getPropertyValue("--primary-color").trim();
    // The colour input takes #rrggbb and nothing else.
    if (/^#[0-9a-f]{6}$/i.test(accent)) this.accent = accent;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.panels) {
      void customElements.whenDefined("ha-expansion-panel").then(() => {
        this.panels = true;
      });
    }
  }

  private get uiLanguage(): string {
    return this.hass?.locale?.language ?? this.hass?.language ?? "en";
  }

  private t = (key: string, value?: string): string => {
    const text = localize(key, this.uiLanguage);
    return value === undefined ? text : text.replace("{v}", value);
  };

  /** HA's own label for a generic field first, then this card's. */
  private computeLabel = (schema: { name: string }): string => {
    const generic = this.hass?.localize?.(`ui.panel.lovelace.editor.card.generic.${schema.name}`);
    if (generic) return generic;
    const own = this.t(`editor.${schema.name}`);
    return own.startsWith("editor.") ? schema.name : own;
  };

  private helperFrom =
    (prefix: string) =>
    (schema: { name: string }): string | undefined => {
      const key = `${prefix}.${schema.name}`;
      const helper = this.t(key);
      // localize() echoes the key back when there is no translation; an
      // undefined helper draws nothing, a key-shaped string looks broken.
      return helper === key ? undefined : helper;
    };

  private computeHelper = this.helperFrom("editor.helper");
  private computeRowHelper = this.helperFrom("editor.row_helper");

  private emit(config: WebcamTimelapseCardConfig): void {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Merge `changes` in and save the tidy result. Never mutates `config`. */
  private applyChanges(changes: Data): void {
    const next = tidyConfig({ ...this.config!, ...changes });
    this.config = next;
    this.emit(next);
  }

  // --- plain fields ---------------------------------------------------

  /**
   * One ha-form over some of the config's keys.
   *
   * Several forms share one config, so each reports only the keys the user
   * touched, diffed against what it was given. Replacing the config with
   * a form's whole value would drop every key another form owns.
   */
  private renderForm(fields: readonly EditorField[]): TemplateResult | typeof nothing {
    const shown = normaliseConfig(this.config!);
    const visible = fields.filter((field) => !field.visible || field.visible(shown));
    if (visible.length === 0) return nothing;
    const data: Data = Object.fromEntries(
      visible.map((field) => [field.name, (shown as Data)[field.name]]),
    );
    const schema = visible.map(({ name, selector, required }) => ({ name, selector, required }));
    return html`<ha-form
      .hass=${this.hass}
      .data=${data}
      .schema=${schema}
      .computeLabel=${this.computeLabel}
      .computeHelper=${this.computeHelper}
      @value-changed=${(event: CustomEvent<{ value: Data }>) => {
        event.stopPropagation();
        const next = event.detail.value;
        const changes = Object.fromEntries(
          visible.filter((f) => next[f.name] !== data[f.name]).map((f) => [f.name, next[f.name]]),
        );
        if (Object.keys(changes).length > 0) this.applyChanges(changes);
      }}
    ></ha-form>`;
  }

  // --- groups ---------------------------------------------------------

  /**
   * A collapsible group. Its body is built only while it is open: behind a
   * closed panel the forms would otherwise still be rendered and updated on
   * every keystroke elsewhere in the editor.
   *
   * `expanded` is deliberately not bound. The panel owns it. When it is
   * clicked it fires expanded-will-change, renders its slot, measures the
   * slot's height, pins that height in pixels and animates to it, and only
   * transitionend unpins it again. Bound to this editor's state, the
   * re-render triggered by expanded-will-change sets `expanded` before the
   * panel measures: the container is then already at its full height, there
   * is nothing to animate, transitionend never fires, and the pixel height
   * stays. 300 ms later the panel sets overflow to visible, and everything
   * the body grows by afterwards — a form finishing its render, a row
   * opening — spills over the panels below.
   */
  private renderGroup(group: { id: GroupId; icon: string }): TemplateResult {
    return html`<ha-expansion-panel
      outlined
      .header=${this.t(`editor.groups.${group.id}`)}
      .secondary=${groupSummary(group.id, this.config!, this.t)}
      @expanded-will-change=${(event: CustomEvent<{ expanded: boolean }>) => {
        event.stopPropagation();
        const open = new Set(this.open);
        if (event.detail.expanded) open.add(group.id);
        else open.delete(group.id);
        this.open = open;
      }}
    >
      <ha-icon slot="leading-icon" icon=${group.icon}></ha-icon>
      ${this.open.has(group.id) ? this.renderGroupBody(group.id) : nothing}
    </ha-expansion-panel>`;
  }

  private renderGroupBody(id: GroupId): TemplateResult {
    return isReadings(id)
      ? this.renderReadings(id)
      : html`<div class="ed-body">${this.renderForm(GROUP_FIELDS[id])}</div>`;
  }

  /** Before ha-expansion-panel exists: the same groups, through ha-form. */
  private renderFallback(): TemplateResult {
    const plain = GROUPS.filter(
      (group): group is { id: PlainGroup; icon: string } => !isReadings(group.id),
    );
    const shown = normaliseConfig(this.config!);
    return html`
      ${(["right", "left"] as const).map(
        (side) => html`<div class="ed-fallback">
          <h4>${this.t(`editor.groups.${side}`)}</h4>
          ${this.renderReadings(side)}
        </div>`,
      )}
      <ha-form
        .hass=${this.hass}
        .data=${shown}
        .schema=${plain.map((group) => ({
          type: "expandable",
          name: group.id,
          icon: group.icon,
          // Without it the values nest under the group's name and the card,
          // which reads a flat config, never sees them.
          flatten: true,
          schema: GROUP_FIELDS[group.id]
            .filter((field) => !field.visible || field.visible(shown))
            .map(({ name, selector }) => ({ name, selector })),
        }))}
        .computeLabel=${(schema: { name: string }) =>
          GROUPS.some((group) => group.id === schema.name)
            ? this.t(`editor.groups.${schema.name}`)
            : this.computeLabel(schema)}
        .computeHelper=${this.computeHelper}
        @value-changed=${(event: CustomEvent<{ value: Data }>) => {
          event.stopPropagation();
          this.applyChanges(event.detail.value);
        }}
      ></ha-form>
    `;
  }

  // --- readings -------------------------------------------------------

  private rows(side: ReadoutSide): OverlayEntityConfig[] {
    return this.config?.[BLOCK_KEYS[side].rows] ?? [];
  }

  private isFocused(side: ReadoutSide, index: number): boolean {
    return this.openRow?.side === side && this.openRow.index === index;
  }

  private toggleFocus(side: ReadoutSide, index: number): void {
    this.openRow = this.isFocused(side, index) ? undefined : { side, index };
  }

  private saveRows(side: ReadoutSide, rows: OverlayEntityConfig[]): void {
    this.applyChanges({ [BLOCK_KEYS[side].rows]: rows });
  }

  private addRow(side: ReadoutSide): void {
    const rows = this.rows(side);
    this.saveRows(side, [...rows, { entity: "" }]);
    // A new row opens, so its entity picker is the next thing on screen.
    this.openRow = { side, index: rows.length };
  }

  private removeRow(side: ReadoutSide, index: number): void {
    this.saveRows(
      side,
      this.rows(side).filter((_, i) => i !== index),
    );
    // The open row goes with the one removed, or moves up with its own.
    if (this.openRow?.side === side) {
      if (this.openRow.index === index) this.openRow = undefined;
      else if (this.openRow.index > index) this.openRow = { side, index: this.openRow.index - 1 };
    }
  }

  private moveRow(side: ReadoutSide, index: number, delta: -1 | 1): void {
    const rows = [...this.rows(side)];
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    [rows[index], rows[target]] = [rows[target]!, rows[index]!];
    this.saveRows(side, rows);
    // The settings stay with the reading they belong to, not with the slot.
    if (this.isFocused(side, index)) this.openRow = { side, index: target };
    else if (this.isFocused(side, target)) this.openRow = { side, index };
  }

  /** `patch` may set a key to undefined, which tidyConfig then drops. */
  private patchRow(side: ReadoutSide, index: number, patch: Data): void {
    const rows = this.rows(side).map((row, i) => (i === index ? { ...row, ...patch } : row));
    this.applyChanges({ [BLOCK_KEYS[side].rows]: rows });
  }

  private renderReadings(side: ReadoutSide): TemplateResult {
    const rows = this.rows(side);
    return html`<div class="ed-body">
      <p class="ed-hint">${this.t(`editor.overlay_${side}_hint`)}</p>
      ${this.renderForm([{ name: BLOCK_KEYS[side].title, selector: { text: {} } }])}
      ${
        rows.length > 0
          ? html`<ul class="ed-rows">
            ${rows.map((row, index) => this.renderRow(side, row, index, rows.length))}
          </ul>`
          : nothing
      }
      <div>
        <ha-button appearance="plain" @click=${() => this.addRow(side)}>
          <ha-icon icon="mdi:plus" slot="icon" aria-hidden="true"></ha-icon>
          ${this.t("editor.add_entity")}
        </ha-button>
      </div>
    </div>`;
  }

  private rowTitle(row: OverlayEntityConfig): string {
    const friendly = row.entity
      ? this.hass?.states[row.entity]?.attributes.friendly_name
      : undefined;
    return row.name || friendly || row.entity || this.t("editor.new_entity");
  }

  /** The row's collapsed line: the entity behind it, its unit, whether it graphs. */
  private rowSummary(row: OverlayEntityConfig, title: string): string {
    const unit =
      row.unit ??
      (row.entity ? this.hass?.states[row.entity]?.attributes.unit_of_measurement : undefined);
    return [
      row.entity && row.entity !== title ? row.entity : null,
      unit || null,
      row.graph ? this.t("editor.graph") : null,
    ]
      .filter((part): part is string => part !== null)
      .join(" · ");
  }

  /**
   * One reading in the block's list.
   *
   * A row of its own rather than a panel inside the group's panel: one row
   * open at a time, its settings inline beneath it, the way list items work
   * in clock-weather-card's rows editor. The head is a real button with
   * aria-expanded; reordering and removing are icon buttons beside it, so
   * neither needs the row open.
   */
  private renderRow(
    side: ReadoutSide,
    row: OverlayEntityConfig,
    index: number,
    count: number,
  ): TemplateResult {
    const title = this.rowTitle(row);
    const summary = this.rowSummary(row, title);
    const focused = this.isFocused(side, index);
    return html`<li class="ed-row ${focused ? "open" : ""}">
      <div class="ed-row-head">
        <button
          class="ed-row-main"
          type="button"
          aria-expanded=${focused ? "true" : "false"}
          @click=${() => this.toggleFocus(side, index)}
        >
          <span
            class="ed-dot"
            style="background:${row.color ?? "var(--primary-color)"}"
            aria-hidden="true"
          ></span>
          <span class="ed-row-titles">
            <span class="ed-row-name">${title}</span>
            ${summary ? html`<span class="ed-row-summary">${summary}</span>` : nothing}
          </span>
          <ha-icon class="ed-chevron" icon="mdi:chevron-down" aria-hidden="true"></ha-icon>
        </button>
        <ha-icon-button
          .label=${this.t("editor.move_up")}
          .disabled=${index === 0}
          @click=${() => this.moveRow(side, index, -1)}
        >
          <ha-icon icon="mdi:arrow-up" aria-hidden="true"></ha-icon>
        </ha-icon-button>
        <ha-icon-button
          .label=${this.t("editor.move_down")}
          .disabled=${index === count - 1}
          @click=${() => this.moveRow(side, index, 1)}
        >
          <ha-icon icon="mdi:arrow-down" aria-hidden="true"></ha-icon>
        </ha-icon-button>
        <ha-icon-button .label=${this.t("editor.remove")} @click=${() => this.removeRow(side, index)}>
          <ha-icon icon="mdi:delete-outline" aria-hidden="true"></ha-icon>
        </ha-icon-button>
      </div>
      ${focused ? this.renderRowSettings(side, row, index) : nothing}
    </li>`;
  }

  private renderRowSettings(
    side: ReadoutSide,
    row: OverlayEntityConfig,
    index: number,
  ): TemplateResult {
    const config: NormalisedConfig = normaliseConfig(this.config!);
    // Unset, a row's graph window is the card's, so that is what it shows.
    const data: Data = { ...normaliseRow(row, config.graph_hours) };
    return html`<div class="ed-row-body">
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${rowSchema(row, config)}
        .computeLabel=${this.computeLabel}
        .computeHelper=${this.computeRowHelper}
        @value-changed=${(event: CustomEvent<{ value: Data }>) => {
          event.stopPropagation();
          const next = event.detail.value;
          const changes = Object.fromEntries(
            Object.keys(next)
              .filter((key) => next[key] !== data[key])
              .map((key) => [key, next[key]]),
          );
          if (Object.keys(changes).length > 0) this.patchRow(side, index, changes);
        }}
      ></ha-form>
      ${this.renderColor(side, row, index)}
    </div>`;
  }

  /**
   * The colour swatch. Both @input and @change are wired: @input recolours
   * the preview while the picker is being dragged, @change is what some
   * platforms fire when it closes. The reset only appears once a colour
   * has been set, and clearing it saves no key at all.
   */
  private renderColor(side: ReadoutSide, row: OverlayEntityConfig, index: number): TemplateResult {
    const set = (event: Event): void =>
      this.patchRow(side, index, { color: (event.target as HTMLInputElement).value });
    const swatch = row.color && /^#[0-9a-f]{6}$/i.test(row.color) ? row.color : this.accent;
    return html`<div class="ed-color">
      <label class="swatch">
        <input
          type="color"
          aria-label=${`${this.t("editor.color")}: ${this.rowTitle(row)}`}
          .value=${swatch}
          @input=${set}
          @change=${set}
        />
        <span class="ed-color-text">
          <span>${this.t("editor.color")}</span>
          <span class="ed-hint">${row.color ? row.color : this.t("editor.color_default")}</span>
        </span>
      </label>
      ${
        row.color
          ? html`<ha-button
            appearance="plain"
            @click=${() => this.patchRow(side, index, { color: undefined })}
          >
            ${this.t("editor.color_reset")}
          </ha-button>`
          : nothing
      }
    </div>`;
  }

  protected override render(): TemplateResult {
    if (!this.hass || !this.config) return html`${nothing}`;

    return html`<div class="ed">
      ${this.renderForm(TOP_FIELDS)}
      <div class="ed-groups">
        ${this.panels ? GROUPS.map((group) => this.renderGroup(group)) : this.renderFallback()}
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "webcam-timelapse-card-editor": WebcamTimelapseCardEditor;
  }
}
