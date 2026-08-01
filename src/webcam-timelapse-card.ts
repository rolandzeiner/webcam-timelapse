import "./editor";
/**
 * Webcam Timelapse Card
 *
 * Scrub, play and inspect an archived still-image webcam.
 */
import { LitElement, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import { cardStyles } from "./card-styles";
import { CARD_TAG, CARD_VERSION, WS_CARD_VERSION, WS_INDEX } from "./const";
import { localize } from "./localize/localize";
import { dayTicks, formatClock, formatStamp, type DayTick } from "./dayticks";
import {
  EMPTY_INDEX,
  type FrameIndex,
  hasFrames,
  nextPresent,
  prefetchDepth,
  PrefetchRing,
  presenceBitmap,
  urlAt,
} from "./frames";
import {
  fetchOverlayHistory,
  type HistoryPoint,
  resolveAt,
  stalenessThreshold,
  windowAround,
} from "./overlay-history";
import {
  checkCardVersionWS,
  renderVersionBanner,
} from "./shared-render";
import { sparkline } from "./sparkline";
import type {
  HomeAssistant,
  LovelaceCardEditor,
  WebcamTimelapseCardConfig,
} from "./types";
import { safeImageUri } from "./utils";

const SPEEDS = [1, 2, 4, 8, 16, 32] as const;
/** Milliseconds per frame at 1x. */
const BASE_FRAME_MS = 500;
/**
 * Floor on the frame interval, ~30 fps.
 *
 * Above this the browser cannot decode a ~50 KB WebP per frame anyway, so
 * asking for more just queues work that arrives late and makes playback
 * stutter rather than speeding it up. Advancing is gated on decode, so the
 * floor keeps the request rate matched to what the device can actually
 * paint.
 */
const MIN_FRAME_MS = 33;
/** Ignore image loads while the thumb has moved within this window. */
const SCRUB_QUIET_MS = 80;

interface WindowWithCustomCards extends Window {
  customCards?: {
    type: string;
    name: string;
    description: string;
    preview?: boolean;
    documentationURL?: string;
    getEntitySuggestion?: (
      hass: HomeAssistant,
      entityId: string,
    ) => { config: Record<string, unknown> } | null;
  }[];
}

@customElement(CARD_TAG)
export class WebcamTimelapseCard extends LitElement {
  static override styles = cardStyles;

  @property({ attribute: false }) hass?: HomeAssistant;

  @state() private config?: WebcamTimelapseCardConfig;
  @state() private index: FrameIndex = EMPTY_INDEX;
  @state() private position = 0;
  @state() private playing = false;
  @state() private speed = 1;
  @state() private trackWidth = 600;
  @state() private versionMismatch: string | null = null;
  @state() private indexError: string | undefined;
  @state() private frameError: string | undefined;
  @state() private history = new Map<string, HistoryPoint[]>();

  private present: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
  private ring = new PrefetchRing(prefetchDepth(1));
  private useLayerA = true;
  private frameGeneration = 0;
  private versionChecked = false;

  @query("img.layer.a") private layerA?: HTMLImageElement;
  @query("img.layer.b") private layerB?: HTMLImageElement;
  private playTimer: number | undefined;
  private indexTimer: number | undefined;
  private scrubRaf: number | undefined;
  private lastScrubAt = 0;
  private pendingPosition: number | undefined;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private visible = true;
  private onScreen = true;

  // --- config ------------------------------------------------------

  setConfig(config: WebcamTimelapseCardConfig): void {
    if (!config?.camera_entity) {
      throw new Error(localize("error.no_camera", this.hass?.locale?.language));
    }
    this.config = {
      autoplay: false,
      speed: 4,
      show_dayticks: true,
      show_graph: true,
      graph_hours: 24,
      ...config,
      // Drop malformed rows rather than crashing render on a hand-edited
      // YAML typo: one bad entry should cost that row, not the card.
      entities: (config.entities ?? []).filter((row) => row?.entity),
    };
    this.speed = SPEEDS.includes(this.config.speed as never)
      ? (this.config.speed as number)
      : 4;
  }

  static getConfigElement(): LovelaceCardEditor {
    // The editor is eagerly imported at the top of this module. Without
    // that import this returns an unupgraded element and HA silently
    // falls back to YAML mode with no error anywhere.
    return document.createElement(
      "webcam-timelapse-card-editor",
    ) as LovelaceCardEditor;
  }

  static getStubConfig(hass: HomeAssistant): Partial<WebcamTimelapseCardConfig> {
    const camera = Object.keys(hass.states).find(
      (id) =>
        id.startsWith("camera.") &&
        hass.entities?.[id]?.platform === "webcam_timelapse",
    );
    return { camera_entity: camera ?? "" };
  }

  getCardSize(): number {
    return 8;
  }

  getGridOptions(): Record<string, unknown> {
    return { columns: "full", rows: "auto", min_columns: 6, min_rows: 6 };
  }

  // --- lifecycle ---------------------------------------------------

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    this.intersectionObserver = new IntersectionObserver((entries) => {
      this.onScreen = entries.some((entry) => entry.isIntersecting);
      this.reconcilePlayback();
    });
    this.intersectionObserver.observe(this);
    this.resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) this.trackWidth = width - 24;
    });
    this.resizeObserver.observe(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.intersectionObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.stopPlayback();
    if (this.indexTimer) window.clearTimeout(this.indexTimer);
    if (this.scrubRaf) cancelAnimationFrame(this.scrubRaf);
    this.ring.clear();
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has("hass") && this.hass && this.index === EMPTY_INDEX) {
      void this.refreshIndex();
      void this.refreshHistory();
    }
    if (changed.has("hass") && this.hass && !this.versionChecked) {
      this.versionChecked = true;
      void checkCardVersionWS(this.hass, WS_CARD_VERSION, CARD_VERSION).then(
        (version) => {
          this.versionMismatch = version;
        },
      );
    }
  }

  private onVisibilityChange = (): void => {
    this.visible = document.visibilityState === "visible";
    this.reconcilePlayback();
    if (this.visible) void this.refreshIndex();
  };

  /**
   * A 24/7 wall tablet must not decode frames nobody is looking at, so
   * playback is gated on the card being both on-screen and in a visible
   * tab. The user's intent (`playing`) is kept separate from whether it is
   * currently *running*, so scrolling away and back resumes rather than
   * silently cancelling.
   */
  private reconcilePlayback(): void {
    if (this.playing && this.visible && this.onScreen) this.startPlayback();
    else this.stopPlayback();
  }

  // --- data --------------------------------------------------------

  private async refreshIndex(): Promise<void> {
    if (!this.hass?.callWS || !this.config) return;

    try {
      // Addressed by entity_id, resolved to a config entry server-side.
      // The frontend's `hass.entities` is the DISPLAY registry: it carries
      // `platform` but not `config_entry_id`, so the card genuinely cannot
      // do this mapping itself.
      const index = await this.hass.callWS<FrameIndex>({
        type: WS_INDEX,
        entity_id: this.config.camera_entity,
      });
      const wasAtEnd = this.position >= this.index.count - 1;
      this.index = index;
      this.present = presenceBitmap(index);
      // Following the live edge is the default posture; a user who has
      // scrubbed back stays where they put the playhead.
      if (wasAtEnd || this.position >= index.count) {
        this.position = Math.max(0, index.count - 1);
      }
      // The layers only exist once the index says there is something to
      // show, so the first paint has to be kicked after this render.
      await this.updateComplete;
      void this.swapInFrame();
      this.indexError = undefined;
    } catch (error) {
      // Distinguish "archive is empty" from "could not ask". Reporting a
      // failed lookup as "no frames yet" sends the user hunting for a
      // capture problem that does not exist.
      this.indexError =
        error instanceof Error ? error.message : "Could not load the timeline.";
    }

    this.scheduleIndexRefresh();
  }

  private async refreshHistory(): Promise<void> {
    const entities = this.config?.entities ?? [];
    if (!this.hass || entities.length === 0) return;

    const timeAttributes: Record<string, string> = {};
    for (const row of entities) {
      if (row.time_attribute) timeAttributes[row.entity] = row.time_attribute;
    }

    this.history = await fetchOverlayHistory(
      this.hass,
      entities.map((row) => row.entity),
      {
        // Cover the whole archive so scrubbing to the oldest frame still
        // resolves a reading; +1 day of slack for the retention boundary.
        days: (this.index.retention_days || 14) + 1,
        timeAttributes,
      },
    );
  }

  private scheduleIndexRefresh(): void {
    if (this.indexTimer) window.clearTimeout(this.indexTimer);
    // Align to the capture cadence plus jitter, so several open dashboards
    // do not all ask at the same instant.
    const delay = this.index.step * 1000 + Math.random() * 15000;
    this.indexTimer = window.setTimeout(() => void this.refreshIndex(), delay);
  }

  // --- playback ----------------------------------------------------

  private get frameDelay(): number {
    return Math.max(BASE_FRAME_MS / this.speed, MIN_FRAME_MS);
  }

  private startPlayback(): void {
    if (this.playTimer) return;
    const step = (): void => {
      const next = nextPresent(this.present, this.position + 1);
      if (next === null) {
        // Reached the end: settle on the newest frame rather than looping
        // silently past it.
        this.playing = false;
        this.stopPlayback();
        return;
      }
      this.goTo(next);
      this.playTimer = window.setTimeout(step, this.frameDelay);
    };
    this.playTimer = window.setTimeout(step, this.frameDelay);
  }

  private stopPlayback(): void {
    if (this.playTimer) window.clearTimeout(this.playTimer);
    this.playTimer = undefined;
  }

  private togglePlay(): void {
    this.playing = !this.playing;
    this.reconcilePlayback();
  }

  private cycleSpeed(): void {
    const next = SPEEDS[(SPEEDS.indexOf(this.speed as never) + 1) % SPEEDS.length];
    this.speed = next ?? 1;
    this.ring = new PrefetchRing(prefetchDepth(this.speed));
  }

  private goTo(position: number): void {
    this.position = Math.min(
      Math.max(position, 0),
      Math.max(0, this.index.count - 1),
    );
    void this.swapInFrame();
    this.prefetchAhead();
  }

  /**
   * Load the current frame into the hidden layer, then flip.
   *
   * Two `<img>` elements, never 2000: a decoded 1024x768 frame is ~3 MB,
   * so mounting one element per slot would be gigabytes on a tablet.
   * Decoding off-screen before flipping is what removes the white flash
   * you otherwise get between frames — `img.decode()` resolves only once
   * the bitmap is ready to paint.
   *
   * `generation` guards against a fast scrub: if the playhead moved on
   * while this decode was in flight, the result is stale and must not be
   * swapped in over a newer frame.
   */
  private async swapInFrame(): Promise<void> {
    const candidates = this.frameSources();
    if (candidates.length === 0) return;

    const generation = ++this.frameGeneration;
    const incoming = this.useLayerA ? this.layerB : this.layerA;
    if (!incoming) return;

    // Try each source in turn. A decode rejects on a 404 (a pruned frame,
    // or a camera proxy that has nothing cached yet) — falling through to
    // the next candidate matters because the archived frame is reliably
    // on disk even when the live proxy is not yet warm. Giving up after
    // the first failure is what renders as an unexplained black card.
    for (const url of candidates) {
      incoming.src = url;
      try {
        await incoming.decode();
      } catch {
        continue;
      }
      // A newer frame was requested while this decode was in flight;
      // swapping now would show an older image over a newer one.
      if (generation !== this.frameGeneration) return;

      this.useLayerA = !this.useLayerA;
      this.frameError = undefined;
      this.requestUpdate();
      return;
    }

    if (generation !== this.frameGeneration) return;
    // Every source failed. Say so — a silently black stage gives the user
    // nothing to act on and looks identical to a camera that is simply
    // dark at night.
    this.frameError = candidates[0];
    this.requestUpdate();
  }

  /**
   * Image sources for the current playhead, best first.
   *
   * At the live edge the camera's own proxy is preferred: it is
   * authenticated, same-origin and token-rotated, so the browser never
   * talks to the third-party camera host. The archived frame is always
   * included as a fallback because it is the source this card actually
   * guarantees — it is on disk by definition.
   */
  private frameSources(): string[] {
    const sources: string[] = [];
    const live = safeImageUri(
      this.hass?.states[this.config!.camera_entity]?.attributes
        .entity_picture as string | undefined,
    );
    if (this.atLive && live) sources.push(live);
    const archived = urlAt(this.index, this.position);
    if (archived) sources.push(archived);
    return sources;
  }

  private prefetchAhead(): void {
    const depth = prefetchDepth(this.speed);
    for (let n = 1; n <= depth; n++) {
      const next = nextPresent(this.present, this.position + n);
      if (next === null) break;
      const url = urlAt(this.index, next);
      if (url) this.ring.prefetch(url);
    }
  }

  /**
   * Scrub handler.
   *
   * The readout, stamp and thumb update immediately — they are all cheap
   * reads from in-memory arrays. Only the image `src` is throttled, and
   * that is the whole point: dragging across a fortnight otherwise queues
   * a couple of thousand image requests and locks up a low-end tablet.
   * The final position always loads, on `change`.
   */
  private onScrub(event: Event): void {
    const position = Number((event.target as HTMLInputElement).value);
    this.position = position;

    const now = performance.now();
    this.pendingPosition = position;
    if (now - this.lastScrubAt < SCRUB_QUIET_MS) return;
    this.lastScrubAt = now;

    if (this.scrubRaf) cancelAnimationFrame(this.scrubRaf);
    this.scrubRaf = requestAnimationFrame(() => {
      this.scrubRaf = undefined;
      if (this.pendingPosition !== undefined) this.goTo(this.pendingPosition);
    });
  }

  private onScrubCommit(event: Event): void {
    this.goTo(Number((event.target as HTMLInputElement).value));
  }

  private jumpToNow(): void {
    this.playing = false;
    this.stopPlayback();
    this.goTo(this.index.count - 1);
  }

  private stepBy(delta: 1 | -1): void {
    const next = nextPresent(this.present, this.position + delta, delta);
    if (next !== null) this.goTo(next);
  }

  // --- render ------------------------------------------------------

  private get timeZone(): string {
    return (
      this.hass?.config?.time_zone ??
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );
  }

  private get language(): string {
    return this.hass?.locale?.language ?? this.hass?.language ?? "en";
  }

  /**
   * Translate shortcut.
   *
   * Keyed off `hass.locale.language`, which is reactive — reading
   * localStorage directly (HA's pre-2024 source) would leave the card in
   * the old language until a reload.
   */
  private t(key: string, replace?: string): string {
    return replace === undefined
      ? localize(key, this.language)
      : localize(key, this.language, "{v}", replace);
  }

  private get atLive(): boolean {
    return this.position >= this.index.count - 1;
  }

  private get onGap(): boolean {
    return this.present.length > 0 && !this.present[this.position];
  }

  protected override render(): TemplateResult {
    if (!this.config || !this.hass) return html`<ha-card></ha-card>`;

    const slot = this.index.t0 === null
      ? null
      : this.index.t0 + this.position * this.index.step;

    return html`
      <ha-card .header=${this.config.title ?? nothing}>
        ${renderVersionBanner(this.versionMismatch, (k) => this.t(k))}
        ${this.renderStage(slot)}
        ${hasFrames(this.index)
          ? html`
              ${this.renderControls()} ${this.renderTrack(slot)}
              ${this.config.show_dayticks ? this.renderDayTicks() : nothing}
            `
          : nothing}
      </ha-card>
    `;
  }

  private renderStage(slot: number | null): TemplateResult {
    if (!hasFrames(this.index)) {
      return html`
        <div class="stage">
          <div class="empty">
            ${this.indexError
              ? html`
                  <div>${this.t("empty.index_failed")}</div>
                  <div class="detail">${this.indexError}</div>
                `
              : html`
                  <div>${this.t("empty.no_frames")}</div>
                  <div>${this.t("empty.first_soon")}</div>
                `}
          </div>
        </div>
      `;
    }

    const showA = this.useLayerA;
    return html`
      <div class="stage ${this.onGap ? "stale" : ""}">
        <img
          class="layer a ${showA ? "visible" : ""}"
          alt=""
          decoding="async"
          fetchpriority="high"
        />
        <img
          class="layer b ${!showA ? "visible" : ""}"
          alt=""
          decoding="async"
          fetchpriority="high"
        />
        ${this.frameError
          ? html`<div class="empty">
              <div>${this.t("empty.frame_failed")}</div>
              <div class="detail">${this.frameError}</div>
            </div>`
          : nothing}
        ${slot !== null
          ? html`<div class="stamp">
              <time datetime=${new Date(slot * 1000).toISOString()}>
                ${formatStamp(slot, this.timeZone, this.language)}
              </time>
            </div>`
          : nothing}
        ${slot !== null ? this.renderReadout(slot) : nothing}
        ${this.onGap
          ? html`<div class="badge gap">${this.t("badge.gap")}</div>`
          : this.atLive
            ? html`<div class="badge live">${this.t("badge.live")}</div>`
            : nothing}
      </div>
    `;
  }

  /**
   * The time-synced overlay.
   *
   * Every value is the reading in effect at the scrubbed moment, and each
   * row shows the time that reading was actually taken. Showing the
   * reading's own time is not decoration: these gauges report hourly, so
   * without it a value sitting next to a 12:05 frame silently implies a
   * 12:05 measurement.
   */
  private renderReadout(slot: number): TemplateResult | typeof nothing {
    const rows = this.config?.entities ?? [];
    if (rows.length === 0) return nothing;

    const at = slot * 1000;
    const rendered = rows.map((row) => {
      const points = this.history.get(row.entity) ?? [];
      const reading = resolveAt(points, at, stalenessThreshold(points));
      const name =
        row.name ??
        (this.hass?.states[row.entity]?.attributes.friendly_name as
          | string
          | undefined) ??
        row.entity;
      const unit =
        row.unit ??
        (this.hass?.states[row.entity]?.attributes.unit_of_measurement as
          | string
          | undefined) ??
        "";
      const color = row.color ?? "var(--wtl-accent)";

      const value =
        reading === null
          ? "—"
          : `${reading.value.toFixed(row.decimals ?? 1)}${unit ? ` ${unit}` : ""}`;

      const graph =
        row.graph && this.config?.show_graph !== false && reading !== null
          ? sparkline({
              points: windowAround(points, at, this.config?.graph_hours ?? 24),
              at,
              hours: this.config?.graph_hours ?? 24,
              color,
              label: `${name} history`,
            })
          : null;

      return html`
        <div class="readout-row ${reading?.stale ? "stale" : ""}">
          <span class="readout-name" style="color:${color}">${name}</span>
          <span class="readout-value">${value}</span>
          ${reading !== null
            ? html`<span class="readout-at"
                >${formatClock(
                  Math.round(reading.at / 1000),
                  this.timeZone,
                  this.language,
                )}</span
              >`
            : nothing}
        </div>
        ${graph ? html`<div class="spark-wrap">${graph}</div>` : nothing}
      `;
    });

    return html`<div class="readout">${rendered}</div>`;
  }

  private renderControls(): TemplateResult {
    return html`
      <div class="controls">
        <ha-icon-button
          .label=${this.playing ? this.t("controls.pause") : this.t("controls.play")}
          @click=${this.togglePlay}
        >
          <ha-icon .icon=${this.playing ? "mdi:pause" : "mdi:play"}></ha-icon>
        </ha-icon-button>
        <ha-icon-button .label=${this.t("controls.previous")} @click=${() => this.stepBy(-1)}>
          <ha-icon icon="mdi:skip-previous"></ha-icon>
        </ha-icon-button>
        <ha-icon-button .label=${this.t("controls.next")} @click=${() => this.stepBy(1)}>
          <ha-icon icon="mdi:skip-next"></ha-icon>
        </ha-icon-button>
        <button
          class="speed"
          @click=${this.cycleSpeed}
          aria-label=${this.t("controls.speed", String(this.speed))}
        >
          ${this.speed}×
        </button>
        <span class="spacer"></span>
        <ha-icon-button .label=${this.t("controls.now")} @click=${this.jumpToNow}>
          <ha-icon icon="mdi:update"></ha-icon>
        </ha-icon-button>
      </div>
    `;
  }

  private renderTrack(slot: number | null): TemplateResult {
    const last = Math.max(1, this.index.count - 1);
    const fill = (this.position / last) * 100;

    return html`
      <div class="track">
        <div class="rail"></div>
        <div class="fill" style="width:${fill}%"></div>
        ${this.index.gaps.map(([start, length]) => {
          const left = (start / last) * 100;
          const width = (length / last) * 100;
          return html`<div
            class="gap-run"
            style="left:${left}%;width:${width}%"
          ></div>`;
        })}
        <input
          type="range"
          min="0"
          max=${last}
          step="1"
          .value=${String(this.position)}
          aria-label=${this.t("track.label")}
          aria-valuetext=${slot !== null
            ? formatStamp(slot, this.timeZone, this.language)
            : ""}
          @input=${this.onScrub}
          @change=${this.onScrubCommit}
        />
      </div>
    `;
  }

  private renderDayTicks(): TemplateResult {
    const ticks: DayTick[] = dayTicks(
      this.index,
      this.timeZone,
      this.language,
      this.trackWidth,
    );
    return html`
      <div class="dayticks" aria-hidden="true">
        ${ticks.map(
          (tick) => html`
            <span
              class="tick ${tick.isMonthStart ? "month" : ""}"
              style="left:${tick.left}%"
              >${tick.label}</span
            >
          `,
        )}
      </div>
    `;
  }
}

const windowWithCards = window as WindowWithCustomCards;
windowWithCards.customCards = windowWithCards.customCards ?? [];
windowWithCards.customCards.push({
  type: CARD_TAG,
  name: "Webcam Timelapse",
  description: "Scrub and play back an archived still-image webcam.",
  preview: true,
  documentationURL: "https://github.com/rolandzeiner/webcam-timelapse",
  // HA 2026.6 entity-first picker. Additive — older HA ignores the key.
  // Gated on the registry platform so this card only ever suggests itself
  // for cameras it can actually serve an archive for; suggesting for every
  // camera entity is the documented anti-pattern.
  getEntitySuggestion: (hass, entityId) => {
    if (!entityId.startsWith("camera.")) return null;
    if (hass.entities?.[entityId]?.platform !== "webcam_timelapse") return null;
    return { config: { type: `custom:${CARD_TAG}`, camera_entity: entityId } };
  },
});

declare global {
  interface HTMLElementTagNameMap {
    "webcam-timelapse-card": WebcamTimelapseCard;
  }
}
