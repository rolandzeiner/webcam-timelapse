import "./editor";
/**
 * Webcam Timelapse Card
 *
 * Scrub, play and inspect an archived still-image webcam.
 */
import { LitElement, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import { cardStyles } from "./card-styles";
import {
  CARD_TAG,
  CARD_VERSION,
  WS_CARD_VERSION,
  WS_INDEX,
  WS_LUMA,
} from "./const";
import {
  DEFAULT_DEFLICKER,
  deflickerGains,
  type LumaSeries,
  radiusForStrength,
} from "./deflicker";
import { localize } from "./localize/localize";
import {
  dayTicks,
  formatClock,
  formatStamp,
  timeTicks,
  type DayTick,
  type TimeTick,
} from "./dayticks";
import {
  EMPTY_INDEX,
  fadeDurationMs,
  type FrameIndex,
  frameReadiness,
  hasFrames,
  nextPlaybackPosition,
  nextPresent,
  type PlaybackCadence,
  playbackCadence,
  prefetchDepth,
  PrefetchRing,
  prefetchWindow,
  presenceBitmap,
  shouldAutoplay,
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
import { prefersReducedMotion, safeImageUri } from "./utils";

const SPEEDS = [1, 2, 4, 8, 16, 32, 64] as const;
/** Speed a card starts at when config says nothing usable. */
const DEFAULT_SPEED = 32;
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
  /**
   * Furthest grid position already handed to the prefetch ring.
   *
   * Keeps the per-tick request count at roughly one instead of a whole
   * window. `prefetchWindow` detects a stale value itself, so nothing has
   * to reset this on a scrub or a jump.
   */
  private prefetchedThrough = -1;
  private useLayerA = true;
  private frameGeneration = 0;
  private swapChain: Promise<void> = Promise.resolve();
  private gains: Float32Array = new Float32Array(0);
  private versionChecked = false;
  private rulerCache?: { key: string; days: DayTick[]; times: TimeTick[] };
  private autoplayPending = true;

  @query("img.layer.a") private layerA?: HTMLImageElement;
  @query("img.layer.b") private layerB?: HTMLImageElement;
  private playToken: number | undefined;
  private playCounter = 0;
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
      speed: DEFAULT_SPEED,
      show_dayticks: true,
      show_graph: true,
      graph_hours: 24,
      deflicker: 50,
      ...config,
      // Drop malformed rows rather than crashing render on a hand-edited
      // YAML typo: one bad entry should cost that row, not the card.
      entities: (config.entities ?? []).filter((row) => row?.entity),
    };
    this.speed = SPEEDS.includes(this.config.speed as never)
      ? (this.config.speed as number)
      : DEFAULT_SPEED;
    // Size the ring for the speed the card actually starts at. Left at the
    // 1x default it held four slots while the window asked for sixteen, so
    // three quarters of every prefetch was dropped the moment it was
    // created and its fetch could be cancelled mid-flight.
    this.ring = new PrefetchRing(prefetchDepth(this.speed));
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
      // Autoplay rewinds to the first frame and paints it itself, so a
      // swap here as well would show the live edge for one frame before
      // jumping backwards.
      if (!this.startAutoplayIfRequested()) void this.swapInFrame();
      void this.refreshLuma();
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

  /**
   * Fetch the luminance curve and precompute per-frame gains.
   *
   * Done once per index refresh rather than per frame: the gains only
   * change when the archive does, and computing them during playback
   * would put a sort inside the frame budget.
   */
  private async refreshLuma(): Promise<void> {
    const strength = this.config?.deflicker ?? 0;
    const radius = radiusForStrength(strength);
    if (!this.hass?.callWS || radius === 0 || !this.config) {
      this.gains = new Float32Array(0);
      return;
    }

    try {
      const result = await this.hass.callWS<{ luma: LumaSeries }>({
        type: WS_LUMA,
        entity_id: this.config.camera_entity,
      });
      this.gains = deflickerGains(result.luma, {
        ...DEFAULT_DEFLICKER,
        radius,
      });
    } catch {
      // No correction is a fine outcome — the frames are still right.
      this.gains = new Float32Array(0);
    }
    this.requestUpdate();
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

  /**
   * How far to jump and how long to wait, at the current speed.
   *
   * Read fresh on every tick rather than cached, so cycling the speed
   * button takes effect on the next frame instead of the next replay.
   */
  private get cadence(): PlaybackCadence {
    return playbackCadence(this.speed);
  }

  private get frameDelay(): number {
    return this.cadence.frameDelay;
  }

  private get fadeDuration(): number {
    return fadeDurationMs(this.speed, this.frameDelay, {
      playing: this.playing,
      reducedMotion: prefersReducedMotion(),
    });
  }

  /**
   * Playback loop.
   *
   * Awaits each frame's decode before scheduling the next, rather than
   * advancing on a bare timer. That gating is not a nicety: both layers
   * are shared, so an un-awaited loop starts the next `img.src` while the
   * previous `decode()` is still pending on the same element. Firefox
   * rejects a decode whose src changed underneath it, so every swap
   * failed and the scrubber advanced over a frozen picture; Chrome
   * happens to be more forgiving, which is why this only showed on one
   * browser.
   *
   * A token rather than a timer handle, because the loop can be suspended
   * at an await that no `clearTimeout` can reach.
   */
  private async runPlayback(token: number): Promise<void> {
    let advance = false;
    while (this.playToken === token && this.playing) {
      if (advance) {
        // Stride, not one: above the decode ceiling the only way to play
        // faster is to skip frames rather than paint them sooner.
        const next = nextPlaybackPosition(
          this.present,
          this.position,
          this.cadence.stride,
        );
        if (next === null) {
          // Settle on the newest frame rather than looping silently past it.
          this.playing = false;
          break;
        }
        this.position = next;
      }
      // The first pass renders wherever the playhead already is. Without
      // it, replaying from the start would skip frame one — and having
      // togglePlay paint it instead would start a swap the loop then
      // races on the same <img>.
      advance = true;

      const started = performance.now();
      await this.swapInFrame();
      this.prefetchAhead();
      if (this.playToken !== token) return;

      // Subtract the decode from the frame budget so playback keeps its
      // requested rate instead of drifting slower by however long each
      // image took.
      const remaining = this.frameDelay - (performance.now() - started);
      if (remaining > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remaining));
      }
    }
  }

  private startPlayback(): void {
    if (this.playToken !== undefined) return;
    const token = ++this.playCounter;
    this.playToken = token;
    void this.runPlayback(token).finally(() => {
      if (this.playToken === token) this.playToken = undefined;
    });
  }

  private stopPlayback(): void {
    // Invalidating the token is what stops the loop; it checks after
    // every await.
    this.playToken = undefined;
  }

  /**
   * Honour `autoplay`, once, and only when it is safe to.
   *
   * Returns whether playback was actually started, so the caller can skip
   * the paint this would otherwise duplicate.
   *
   * Deferred until the index reports frames rather than run at connect
   * time: a freshly added camera has an empty archive, and flipping
   * `playing` with nothing to play would leave the button showing pause
   * over a still card.
   *
   * One-shot by design. The index refreshes on a timer, and re-evaluating
   * there would restart playback every few minutes on top of a user who
   * had deliberately paused. The flag clears as soon as frames exist,
   * whether or not autoplay was configured, so it can never fire later.
   *
   * prefers-reduced-motion overrides the config outright — a card that
   * begins animating on its own is exactly what that setting exists to
   * prevent, and the option's own help text promises this.
   */
  private startAutoplayIfRequested(): boolean {
    if (!this.autoplayPending || !hasFrames(this.index)) return false;
    this.autoplayPending = false;

    if (
      !shouldAutoplay({
        configured: this.config?.autoplay === true,
        reducedMotion: prefersReducedMotion(),
        alreadyPlaying: this.playing,
      })
    ) {
      return false;
    }
    // Via togglePlay so autoplay inherits the rewind rule: the playhead
    // rests at the live edge, and there is nothing forward to advance
    // into, so starting there would stop on the first tick.
    this.togglePlay();
    return true;
  }

  private togglePlay(): void {
    // Pressing play while parked on the newest frame should replay the
    // archive, not do nothing. Sitting at the live edge is the default
    // resting position, so "play" there almost always means "show me what
    // happened", and there is nothing forward to advance into.
    if (!this.playing && this.atLive) {
      const first = nextPresent(this.present, 0);
      // Position only — the loop paints it on its first pass.
      if (first !== null) this.position = first;
    }
    this.playing = !this.playing;
    this.reconcilePlayback();
  }

  private cycleSpeed(): void {
    const next = SPEEDS[(SPEEDS.indexOf(this.speed as never) + 1) % SPEEDS.length];
    this.speed = next ?? 1;
    // A new ring drops the references holding the old prefetches alive, so
    // forget how far ahead we had reached and let the window refill at the
    // new stride rather than skipping frames nothing is keeping warm.
    this.ring = new PrefetchRing(prefetchDepth(this.speed));
    this.prefetchedThrough = -1;
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
  private swapInFrame(): Promise<void> {
    // Queue behind any swap already running. Both <img> layers are shared,
    // so overlapping swaps write src on an element that is mid-decode —
    // which Firefox reports as a decode failure and Chrome silently
    // tolerates. Serialising removes the class of bug rather than the
    // symptom.
    this.swapChain = this.swapChain.then(() => this.performSwap());
    return this.swapChain;
  }

  private async performSwap(): Promise<void> {
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
      // Resolved against the same base the browser will use, so it can be
      // compared with currentSrc rather than with the relative form.
      const requested = new URL(url, document.baseURI).href;
      incoming.src = url;
      try {
        await incoming.decode();
      } catch {
        // Swallowed on purpose. decode() rejects in cases where the frame
        // is fine — Firefox does it whenever src was reassigned during a
        // previous decode — so the element's own state decides, not this
        // rejection. What that state must NOT be trusted for is whether
        // the frame is the one we asked for; frameReadiness handles that.
      }

      const readiness = frameReadiness({
        currentSrc: incoming.currentSrc,
        requested,
        complete: incoming.complete,
        naturalWidth: incoming.naturalWidth,
      });

      // The request finished and there is nothing there: a pruned frame or
      // a proxy with nothing cached. Fall through to the next source — the
      // archived frame is on disk even when the live proxy is not warm.
      if (readiness === "failed") continue;

      // Still holding the previous frame. Revealing the layer now would
      // paint a stale image under a playhead that has already moved on, so
      // drop this frame and leave the last good one up.
      if (readiness === "pending") return;

      // A newer frame was requested while this decode was in flight;
      // swapping now would show an older image over a newer one.
      if (generation !== this.frameGeneration) return;

      this.revealFrame(incoming, this.useLayerA ? this.layerA : this.layerB);
      this.useLayerA = !this.useLayerA;
      this.frameError = undefined;
      this.requestUpdate();
      return;
    }

    if (generation !== this.frameGeneration) return;

    // During playback a frame that will not load is a dropped frame, not
    // something to put a panel over the picture for. An archive with holes
    // at the start would otherwise strobe the error overlay on and off
    // against the last good frame. Stepping and scrubbing still report it:
    // there the user asked for one specific frame and deserves to know it
    // is missing.
    if (this.playing) return;

    // Every source failed. Say so — a silently black stage gives the user
    // nothing to act on and looks identical to a camera that is simply
    // dark at night.
    this.frameError = candidates[0];
    this.requestUpdate();
  }

  /**
   * Bring the decoded frame on screen over the one already there.
   *
   * The outgoing layer is pinned opaque and pushed underneath; only the
   * incoming layer animates, from transparent to opaque, on top. The
   * two therefore always composite to a full-coverage image and the
   * stage background never shows through. See the .layer comment in
   * card-styles.ts for why the obvious symmetric version pulses black.
   *
   * Leaving the outgoing layer at opacity 1 afterwards is intentional:
   * it is hidden beneath an opaque layer, and it becomes the next
   * incoming layer, which resets it. Nothing to clean up.
   */
  private revealFrame(
    incoming: HTMLImageElement,
    outgoing: HTMLImageElement | undefined,
  ): void {
    const duration = this.fadeDuration;

    if (outgoing) {
      outgoing.style.transition = "none";
      outgoing.style.opacity = "1";
      outgoing.style.zIndex = "1";
    }
    incoming.style.zIndex = "2";

    if (duration === 0) {
      incoming.style.transition = "none";
      incoming.style.opacity = "1";
      return;
    }

    incoming.style.transition = "none";
    incoming.style.opacity = "0";
    // Commit the 0 before animating. Without a forced reflow the browser
    // coalesces both writes into one style recalculation, sees only the
    // final value, and runs no transition at all.
    void incoming.offsetWidth;
    // Linear, not ease-in-out: with an opaque backdrop the opacity IS the
    // blend ratio between two images, and easing it makes the midpoint
    // linger on a half-and-half double exposure.
    incoming.style.transition = `opacity ${duration}ms linear`;
    incoming.style.opacity = "1";
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
    // Walk in strides, so the window holds the frames playback will
    // actually paint. Stepping one at a time would spend the whole
    // budget on frames the stride skips — at 64x, three quarters of it.
    const targets = prefetchWindow(
      this.present,
      this.position,
      prefetchDepth(this.speed),
      this.cadence.stride,
      this.prefetchedThrough,
    );
    for (const target of targets) {
      const url = urlAt(this.index, target);
      if (url) this.ring.prefetch(url);
      // Advance even when the URL could not be built, so a frame that
      // cannot be addressed is not retried on every tick forever.
      this.prefetchedThrough = target;
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
          ? this.renderTimeline(slot)
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

    // A CSS filter, so the correction costs GPU compositing rather than
    // any pixel work of ours — and the stored frame is never altered, so
    // turning deflicker off restores the original exactly.
    const gain = this.gains[this.position] ?? 1;
    const effects: string[] = [];
    if (gain !== 1) effects.push(`brightness(${gain.toFixed(3)})`);
    // Playhead is on a gap: keep the last real frame on screen but make
    // it visibly not-current rather than silently lying. This dims via
    // filter rather than opacity so it cannot fight the fade, which owns
    // opacity outright.
    if (this.onGap) effects.push("grayscale(0.5)", "brightness(0.5)");
    const filter = effects.length > 0 ? effects.join(" ") : "none";
    // Bound on the stage, not on the layers: Lit sets the whole style
    // attribute, so a binding on a layer would wipe the opacity, z-index
    // and transition that revealFrame() writes there.
    return html`
      <div class="stage" style="--wtl-frame-filter:${filter}">
        <div class="layers">
          <img class="layer a" alt="" decoding="async" fetchpriority="high" />
          <img class="layer b" alt="" decoding="async" fetchpriority="high" />
        </div>
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
        ${this.renderControls()}
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

      // ha-state-icon rather than a configured icon string: it resolves
      // the entity's own icon and falls back to the device-class default,
      // so a sensor with no explicit icon still shows the right one
      // instead of an empty box.
      const stateObj = this.hass?.states[row.entity];
      const icon =
        row.show_icon && stateObj
          ? html`<ha-state-icon
              class="readout-icon"
              style="color:${color}"
              .hass=${this.hass}
              .stateObj=${stateObj}
            ></ha-state-icon>`
          : nothing;

      return html`
        <div class="readout-row ${reading?.stale ? "stale" : ""}">
          ${icon}
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

    // Trimmed, so a heading of spaces is treated as none rather than
    // reserving a blank line above the readings.
    const heading = this.config?.overlay_title?.trim();

    return html`<div class="readout">
      ${heading ? html`<div class="readout-title">${heading}</div>` : nothing}
      ${rendered}
    </div>`;
  }

  /**
   * Transport first, then the controls that are not transport.
   *
   * Play sits between previous and next because that is where every media
   * player has put it for forty years — VLC, QuickTime, Spotify, phone
   * lock screens, car head units. Reaching for the middle button is
   * muscle memory, and a card that breaks it makes people look.
   *
   * Speed and jump-to-now are deliberately outside that group and behind
   * a divider: one changes how playback runs and the other jumps
   * somewhere, so neither belongs in a row the eye reads as a single
   * transport unit. Speed is nearer because it modifies playback; the
   * jump is terminal.
   */
  private renderControls(): TemplateResult {
    return html`
      <div class="controls">
        <ha-icon-button .label=${this.t("controls.previous")} @click=${() => this.stepBy(-1)}>
          <ha-icon icon="mdi:skip-previous"></ha-icon>
        </ha-icon-button>
        <ha-icon-button
          class="play"
          .label=${this.playing ? this.t("controls.pause") : this.t("controls.play")}
          @click=${this.togglePlay}
        >
          <ha-icon .icon=${this.playing ? "mdi:pause" : "mdi:play"}></ha-icon>
        </ha-icon-button>
        <ha-icon-button .label=${this.t("controls.next")} @click=${() => this.stepBy(1)}>
          <ha-icon icon="mdi:skip-next"></ha-icon>
        </ha-icon-button>

        <span class="sep" aria-hidden="true"></span>

        <button
          class="speed"
          @click=${this.cycleSpeed}
          aria-label=${this.t("controls.speed", String(this.speed))}
        >
          ${this.speed}×
        </button>
        <ha-icon-button .label=${this.t("controls.now")} @click=${this.jumpToNow}>
          <ha-icon icon="mdi:update"></ha-icon>
        </ha-icon-button>
      </div>
    `;
  }

  /**
   * Scrubber and ruler as one object.
   *
   * The marks live inside the track and are painted first, so the rail,
   * the fill and the thumb sit on top of them — a ruler the slider runs
   * along rather than a second widget under it. Paint order comes from
   * DOM order on purpose: every element here is at `z-index: auto`, and
   * introducing one would drag the whole overlay into the stacking
   * competition that `.layers` exists to keep it out of.
   *
   * Dates sit above the bar and clock times below, both keyed off the
   * same percentage as the marks, so the three bands cannot drift apart.
   */
  private renderTimeline(slot: number | null): TemplateResult {
    const last = Math.max(1, this.index.count - 1);
    const fill = (this.position / last) * 100;
    const ticks = this.config?.show_dayticks !== false;
    const { days, times } = ticks
      ? this.rulerFor()
      : { days: [] as DayTick[], times: [] as TimeTick[] };

    return html`
      <div class="timeline">
        ${ticks
          ? html`<div class="band dates" aria-hidden="true">
              ${days.map((tick) =>
                tick.label
                  ? html`<span class="lab date" style="left:${tick.left}%"
                      >${tick.label}</span
                    >`
                  : nothing,
              )}
            </div>`
          : nothing}

        <div class="track">
          ${ticks
            ? html`<div class="marks" aria-hidden="true">
                ${times.map(
                  (tick) =>
                    html`<span class="mark" style="left:${tick.left}%"></span>`,
                )}
                ${days.map(
                  (tick) =>
                    html`<span
                      class="mark ${tick.isMonthStart ? "month" : "day"}"
                      style="left:${tick.left}%"
                    ></span>`,
                )}
              </div>`
            : nothing}
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

        ${ticks
          ? html`<div class="band times" aria-hidden="true">
              ${times.map((tick) =>
                tick.label
                  ? html`<span class="lab time" style="left:${tick.left}%"
                      >${tick.label}</span
                    >`
                  : nothing,
              )}
            </div>`
          : nothing}
      </div>
    `;
  }

  /**
   * Day and time ticks for the current window, recomputed only when an
   * input actually changes.
   *
   * The day scan is O(frames) — it has to see every slot to notice a date
   * change — and this runs inside render(), which fires on every frame
   * swap. At one-minute capture that is a fortnight of slots scanned
   * fifteen times a second during 8x playback, for a result that changes
   * only when the archive grows or the card is resized.
   */
  private rulerFor(): { days: DayTick[]; times: TimeTick[] } {
    const key = [
      this.index.t0,
      this.index.count,
      this.index.step,
      Math.round(this.trackWidth),
      this.timeZone,
      this.language,
    ].join("|");
    if (this.rulerCache?.key !== key) {
      this.rulerCache = {
        key,
        days: dayTicks(this.index, this.timeZone, this.language, this.trackWidth),
        times: timeTicks(this.index, this.timeZone, this.language, this.trackWidth),
      };
    }
    return this.rulerCache;
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
