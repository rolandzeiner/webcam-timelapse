import "./editor";
/**
 * Webcam Timelapse Card
 *
 * Scrub, play and inspect an archived still-image webcam.
 */
import { LitElement, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import { cardStyles } from "./card-styles";
import { DEFAULTS, type NormalisedConfig, normaliseConfig, rowGraphHours, SPEEDS } from "./config";
import { Coalescer } from "./coalesce";
import {
  CARD_TAG,
  CARD_VERSION,
  WS_CARD_VERSION,
  WS_EXPORT_CANCEL,
  WS_EXPORT_START,
  WS_EXPORT_SUBSCRIBE,
  WS_INDEX,
  WS_LUMA,
  WS_RESOLVE_MEDIA,
} from "./const";
import { DEFAULT_DEFLICKER, deflickerGains, type LumaSeries, radiusForStrength } from "./deflicker";
import {
  ASPECT_ICONS,
  clampRange,
  cropAxis,
  cropWindow,
  DEFAULT_EXPORT_FPS,
  estimateSize,
  EXPORT_ASPECTS,
  EXPORT_EVERY,
  EXPORT_FPS,
  EXPORT_MIN_FREE_BYTES,
  EXPORT_SIZE_DEFAULTS,
  type ExportAspect,
  EXPORT_POSITIONS,
  EXPORT_PRESETS,
  type ExportPosition,
  type ExportRange,
  exportRequest,
  type ExportStatus,
  formatLength,
  formatSize,
  framesIn,
  framesUsed,
  fullRange,
  lastHours,
  mediaBrowserPath,
  outputSize,
  presetFits,
  progress,
  rangeBand,
  ratioLabel,
  READINGS_SIZE,
  SOFT_CROP_PIXELS,
  TIMESTAMP_SIZE,
  withEnd,
  withStart,
} from "./export";
import { localize } from "./localize/localize";
import {
  overlayEntities,
  overlayGroups,
  type OverlayGroup,
  type ReadoutSide,
} from "./overlay-groups";
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
  seriesStats,
  windowAround,
} from "./overlay-history";
import { checkCardVersionWS, renderVersionBanner } from "./shared-render";
import { extentOf, sparkline } from "./sparkline";
import { type NightBand, nightBands } from "./sun";
import type { HomeAssistant, LovelaceCardEditor, WebcamTimelapseCardConfig } from "./types";
import { formatExtent, formatSpan, prefersReducedMotion, safeImageUri } from "./utils";

/**
 * Playback multipliers.
 *
 * Goes well past 8x because the useful range depends on the capture
 * interval, which the user controls. At a ten-minute cadence a fortnight
 * is ~2000 frames and 8x is plenty; at one minute it is ~20,000, and 8x
 * would take twenty minutes to play through.
 */
const DEFAULT_SPEED = DEFAULTS.speed;
/** Ignore image loads while the thumb has moved within this window. */
const SCRUB_QUIET_MS = 80;
/**
 * How long a deliberate frame request may wait for a slow load.
 *
 * Only ever reached when the element is still holding the previous
 * picture after `decode()` came back — the load is in flight and a moment
 * of patience is the difference between the right frame and no update at
 * all. Long enough for a cold frame over a slow link, short enough that a
 * genuinely dead source still reports itself.
 */
const FRAME_SETTLE_MS = 1500;

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

  // Set by HA: "grid" in a sections view, "panel" in a panel view, unset in
  // the add-card picker and masonry. Reflected so the styles can fill the
  // cell only when there is one -- see the grid-cell rules in card-styles.ts.
  @property({ reflect: true }) public layout?: string;

  @state() private config?: NormalisedConfig;
  @state() private index: FrameIndex = EMPTY_INDEX;
  @state() private position = 0;
  @state() private playing = false;
  @state() private speed = 1;
  @state() private trackWidth = 600;
  @state() private versionMismatch: string | null = null;
  @state() private indexError: string | undefined;
  @state() private frameError: string | undefined;
  @state() private history = new Map<string, HistoryPoint[]>();
  /**
   * Readings blocks the viewer has folded away, by side.
   *
   * Deliberately not persisted. The blocks are an overlay on a picture,
   * and hiding one is a "let me look at this frame" gesture rather than a
   * setting — a card that came back folded would look broken to the next
   * person at the dashboard, with the only clue a 24px eye in the corner.
   * Replaced rather than mutated, because Lit compares by identity.
   */
  @state() private folded = new Set<ReadoutSide>();

  // --- video export ---
  @state() private exportOpen = false;
  /**
   * The stretch chosen for export, in grid positions.
   *
   * Null means "not chosen yet", which the panel reads as the whole
   * archive. Kept null rather than filled in eagerly so a range the user
   * never touched keeps following the archive as it grows, instead of
   * freezing at whatever the newest frame was when the panel opened.
   */
  @state() private exportRange: ExportRange | null = null;
  @state() private exportFps: number = DEFAULT_EXPORT_FPS;
  @state() private exportStamp = true;
  @state() private exportReadings = true;
  /** The shape the video is cropped to. */
  @state() private exportAspect: ExportAspect = "native";
  /** 0..100, where the crop sits along the axis it slides on. */
  @state() private exportCrop = 50;
  /** Use every n-th frame of the range. */
  @state() private exportEvery = 1;
  /** Overlay sizes, kept per format — see EXPORT_SIZE_DEFAULTS. */
  @state() private exportSizes: Record<ExportAspect, { timestamp: number; readings: number }> = {
    ...EXPORT_SIZE_DEFAULTS,
  };
  /**
   * The frame's own pixel size, read off the picture on screen. The card
   * is never told it, and it is what the crop, the video's size and the
   * file-size estimate are worked out from. Null until a frame has shown.
   */
  @state() private frameSize: readonly [number, number] | null = null;
  /** A drag in progress on a range handle or on the crop window. */
  private exportDrag:
    | { kind: "start" | "end"; track: DOMRect; before: ExportRange | null; position: number }
    | { kind: "crop"; from: number; crop: number; travel: number; axis: "x" | "y" }
    | undefined;
  /** Positions the viewer picked; a block not in here keeps its card side. */
  @state() private exportPositions: Partial<Record<ReadoutSide, ExportPosition>> = {};
  @state() private exportStatus: ExportStatus | null = null;
  /** Why the last attempt to start or cancel was refused, as a string key. */
  @state() private exportError: string | undefined;
  /** Signed download link for the finished video, once resolved. */
  @state() private exportUrl: string | undefined;
  /** Which video `exportUrl` belongs to, so it is resolved once. */
  private exportUrlFor: string | undefined;
  private exportUnsubscribe: (() => Promise<void> | void) | undefined;
  /** Counts subscriptions, so a stale one resolving late is dropped. */
  private exportSubscription = 0;

  /** Not @state: derived from the playhead, never a reason to re-render. */
  private nightCache?: { key: string; bands: NightBand[] };

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
  /**
   * Latest-wins gate over the frame swap.
   *
   * Both `<img>` layers are shared, so swaps must not overlap — but they
   * must not QUEUE either. Every swap paints wherever the playhead is
   * when it starts, so a request made while one is running is only ever a
   * request for the newest position, and the ones in between are already
   * obsolete. See coalesce.ts for what chaining them instead cost.
   */
  private readonly swaps = new Coalescer(() => this.performSwap());
  private gains: Float32Array = new Float32Array(0);
  private versionChecked = false;
  private rulerCache?: { key: string; days: DayTick[]; times: TimeTick[] };
  private autoplayPending = true;

  @query("img.layer.a") private layerA?: HTMLImageElement;
  @query("img.layer.b") private layerB?: HTMLImageElement;
  private playToken: number | undefined;
  private playCounter = 0;
  private indexTimer: number | undefined;
  /** Trailing edge of the scrub throttle: fires once the drag settles. */
  private scrubSettle: number | undefined;
  private lastScrubAt = 0;
  private pendingPosition: number | undefined;
  /** Last position a swap actually painted, so repeats cost nothing. */
  private loadedPosition: number | undefined;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private visible = true;
  private onScreen = true;

  // --- config ------------------------------------------------------

  setConfig(config: WebcamTimelapseCardConfig): void {
    if (!config?.camera_entity) {
      throw new Error(localize("error.no_camera", this.hass?.locale?.language));
    }
    this.config = normaliseConfig({
      ...config,
      // Drop malformed rows rather than crashing render on a hand-edited
      // YAML typo: one bad entry should cost that row, not the card.
      // Both blocks, or the left one is a hand-edit away from the crash
      // this exists to prevent.
      entities: (config.entities ?? []).filter((row) => row?.entity),
      entities_left: (config.entities_left ?? []).filter((row) => row?.entity),
    });
    this.speed = SPEEDS.includes(this.config.speed as never) ? this.config.speed : DEFAULT_SPEED;
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
    return document.createElement("webcam-timelapse-card-editor");
  }

  static getStubConfig(hass: HomeAssistant): Partial<WebcamTimelapseCardConfig> {
    const camera = Object.keys(hass.states).find(
      (id) => id.startsWith("camera.") && hass.entities?.[id]?.platform === "webcam_timelapse",
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
    // A dashboard view that is navigated away from and back re-attaches
    // the same element, with the panel still marked open.
    if (this.exportOpen) void this.subscribeExport();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.intersectionObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.stopPlayback();
    if (this.indexTimer) window.clearTimeout(this.indexTimer);
    if (this.scrubSettle) window.clearTimeout(this.scrubSettle);
    this.ring.clear();
    this.unsubscribeExport();
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has("hass") && this.hass && this.index === EMPTY_INDEX) {
      void this.refreshIndex();
      void this.refreshHistory();
    }
    if (changed.has("hass") && this.hass && !this.versionChecked) {
      this.versionChecked = true;
      void checkCardVersionWS(this.hass, WS_CARD_VERSION, CARD_VERSION).then((version) => {
        this.versionMismatch = version;
      });
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
      this.indexError = error instanceof Error ? error.message : "Could not load the timeline.";
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
    const strength = this.config?.deflicker ?? DEFAULTS.deflicker;
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
    const entities = overlayEntities(this.config);
    if (!this.hass || entities.length === 0) return;

    const timeAttributes: Record<string, string> = {};
    for (const row of entities) {
      if (row.time_attribute) timeAttributes[row.entity] = row.time_attribute;
    }

    // Half of a graph window sits behind the playhead, and the playhead
    // can be parked on the oldest frame in the archive. A row asking for
    // a window wider than the archive would otherwise get a graph that
    // truncates at the fetch boundary instead of filling.
    const graphHours = Math.max(
      this.config?.graph_hours ?? DEFAULTS.graph_hours,
      ...entities.map((row) => row.graph_hours ?? 0),
    );

    this.history = await fetchOverlayHistory(
      this.hass,
      entities.map((row) => row.entity),
      {
        // Cover the whole archive so scrubbing to the oldest frame still
        // resolves a reading; +1 day of slack for the retention boundary.
        days: (this.index.retention_days || 14) + 1 + Math.ceil(graphHours / 48),
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
        const next = nextPlaybackPosition(this.present, this.position, this.cadence.stride);
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
        configured: this.config?.autoplay ?? DEFAULTS.autoplay,
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

  private togglePlay = (): void => {
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
  };

  private cycleSpeed = (): void => {
    const next = SPEEDS[(SPEEDS.indexOf(this.speed as never) + 1) % SPEEDS.length];
    this.speed = next ?? 1;
    // A new ring drops the references holding the old prefetches alive, so
    // forget how far ahead we had reached and let the window refill at the
    // new stride rather than skipping frames nothing is keeping warm.
    this.ring = new PrefetchRing(prefetchDepth(this.speed));
    this.prefetchedThrough = -1;
  };

  private goTo(position: number): void {
    this.position = Math.min(Math.max(position, 0), Math.max(0, this.index.count - 1));
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
    // Collapse into any swap already running rather than queueing behind
    // it. Both <img> layers are shared, so overlapping swaps write src on
    // an element that is mid-decode — which Firefox reports as a decode
    // failure and Chrome silently tolerates. Serialising removes that
    // class of bug; coalescing stops the serialisation turning a drag
    // into a hundred sequential fetches the picture has to crawl through.
    return this.swaps.request();
  }

  private async performSwap(): Promise<void> {
    // Snapshot the playhead this run is painting. A swap can await for
    // hundreds of milliseconds and the playhead is free to move while it
    // does, so every later decision — which sources, and what to record
    // as painted — has to name the same frame the URLs came from.
    const position = this.position;
    const candidates = this.frameSources(position);
    if (candidates.length === 0) return;

    const generation = ++this.frameGeneration;
    const incoming = this.useLayerA ? this.layerB : this.layerA;
    if (!incoming) return;

    /** A source that never finished loading, as opposed to one that 404'd. */
    let sawPending = false;

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

      let readiness = frameReadiness({
        currentSrc: incoming.currentSrc,
        requested,
        complete: incoming.complete,
        naturalWidth: incoming.naturalWidth,
      });

      // Still holding the previous frame: the load has not finished, so
      // there is nothing to reveal YET. Dropping it here is right during
      // playback — the next tick paints over it in a few tens of
      // milliseconds — but on the scrub and step paths there is no next
      // tick. The user asked for one specific frame, and giving up
      // silently leaves the previous picture on screen for good, under a
      // clock and a thumb that both say otherwise. So wait for the load
      // the browser is already running, then ask again.
      if (readiness === "pending" && !this.playing) {
        await this.awaitLoad(incoming);
        readiness = frameReadiness({
          currentSrc: incoming.currentSrc,
          requested,
          complete: incoming.complete,
          naturalWidth: incoming.naturalWidth,
        });
      }

      // The request finished and there is nothing there: a pruned frame or
      // a proxy with nothing cached. Fall through to the next source — the
      // archived frame is on disk even when the live proxy is not warm.
      if (readiness === "failed") continue;

      // Never arrived. Try the next source rather than stop here: a live
      // proxy that hangs is exactly the case the archived frame exists to
      // cover, and it is on disk by definition. Reassigning src aborts
      // the stalled request on the way past.
      if (readiness === "pending") {
        sawPending = true;
        continue;
      }

      // A newer frame was requested while this decode was in flight;
      // swapping now would show an older image over a newer one.
      if (generation !== this.frameGeneration) return;

      this.revealFrame(incoming, this.useLayerA ? this.layerA : this.layerB);
      this.useLayerA = !this.useLayerA;
      this.noteFrameSize(incoming.naturalWidth, incoming.naturalHeight);
      this.loadedPosition = position;
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

    // A source that is still loading is not a source that failed. Leave
    // the last good frame up and say nothing — an error panel over a
    // frame that is merely slow is worse than a moment of the previous
    // picture.
    if (sawPending) return;

    // Every source failed. Say so — a silently black stage gives the user
    // nothing to act on and looks identical to a camera that is simply
    // dark at night.
    this.frameError = candidates[0];
    this.requestUpdate();
  }

  /**
   * Wait for an `<img>` load to finish, one way or the other.
   *
   * `decode()` is not a reliable "it arrived" signal: it rejects whenever
   * src was reassigned during a previous decode, and Firefox does that
   * routinely on shared layers. The load events are, so this listens for
   * them directly and lets the caller re-read the element afterwards.
   *
   * Capped, because a source that never answers must not wedge the swap
   * queue — the coalescer only runs one swap at a time, so an unbounded
   * wait here would freeze every later frame too. Resolves rather than
   * rejects on timeout: `frameReadiness` decides what the element holds,
   * not this.
   */
  private awaitLoad(image: HTMLImageElement): Promise<void> {
    return new Promise<void>((resolve) => {
      let timer: number | undefined;
      const finish = (): void => {
        if (timer !== undefined) window.clearTimeout(timer);
        image.removeEventListener("load", finish);
        image.removeEventListener("error", finish);
        resolve();
      };
      image.addEventListener("load", finish);
      image.addEventListener("error", finish);
      timer = window.setTimeout(finish, FRAME_SETTLE_MS);
    });
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
  private revealFrame(incoming: HTMLImageElement, outgoing: HTMLImageElement | undefined): void {
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
  private frameSources(position: number): string[] {
    const sources: string[] = [];
    const live = safeImageUri(
      this.hass?.states[this.config!.camera_entity]?.attributes.entity_picture as
        | string
        | undefined,
    );
    if (position >= this.index.count - 1 && live) sources.push(live);
    const archived = urlAt(this.index, position);
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
   * reads from in-memory arrays. Only the image load is throttled, and
   * that is the whole point: dragging across a fortnight otherwise fires
   * a couple of thousand prefetch requests and locks up a low-end tablet.
   *
   * Leading AND trailing. The leading edge is what makes the picture
   * follow the thumb instead of waiting for it to stop; the trailing one
   * is what guarantees the position the thumb actually SETTLES on gets
   * loaded. Leading-only looks fine in a slow drag — every move is its own
   * quiet window — and fails exactly when the user flicks the slider: the
   * whole flick lands inside one window, every move after the first is
   * discarded, and the card keeps showing the frame from wherever the
   * flick began. `change` used to be the only thing rescuing that, which
   * left the correctness of the picture resting on an event the throttle
   * knows nothing about.
   */
  private onScrub = (event: Event): void => {
    this.scrubTo(Number((event.target as HTMLInputElement).value));
  };

  /**
   * Move the playhead the way a drag does: the thumb follows at once,
   * the picture at most every SCRUB_QUIET_MS and once more when it stops.
   * Shared by the scrubber and the export range handles, which show the
   * frame they are being dragged to.
   */
  private scrubTo(position: number): void {
    this.position = position;
    this.pendingPosition = position;

    const now = performance.now();
    if (now - this.lastScrubAt >= SCRUB_QUIET_MS) {
      this.lastScrubAt = now;
      this.loadPendingPosition();
    }

    // Re-armed on every move, so it fires SCRUB_QUIET_MS after the LAST
    // one — the moment the drag settles — rather than mid-flick.
    if (this.scrubSettle) window.clearTimeout(this.scrubSettle);
    this.scrubSettle = window.setTimeout(() => {
      this.scrubSettle = undefined;
      this.loadPendingPosition();
    }, SCRUB_QUIET_MS);
  }

  /**
   * Load whatever position the thumb is on now, skipping a repeat.
   *
   * `loadedPosition` is what the swap last actually PAINTED, not what was
   * last requested — so the leading and trailing edges of one flick
   * collapse into a single load, while a scrub back to a position that
   * some earlier navigation had visited still reloads. Keyed off the
   * request instead, a step or a playback run would leave a stale marker
   * behind and swallow a legitimate scrub to that same frame.
   */
  private loadPendingPosition(): void {
    const position = this.pendingPosition;
    if (position === undefined || position === this.loadedPosition) return;
    this.goTo(position);
  }

  private onScrubCommit = (event: Event): void => {
    // Belt and braces: `change` also fires for a keyboard step or a click
    // on the track, where there may never be a second `input` to settle.
    if (this.scrubSettle) window.clearTimeout(this.scrubSettle);
    this.scrubSettle = undefined;
    this.pendingPosition = Number((event.target as HTMLInputElement).value);
    this.loadPendingPosition();
  };

  private jumpToNow = (): void => {
    this.playing = false;
    this.stopPlayback();
    this.goTo(this.index.count - 1);
  };

  private stepBy(delta: 1 | -1): void {
    const next = nextPresent(this.present, this.position + delta, delta);
    if (next !== null) this.goTo(next);
  }

  // --- video export ------------------------------------------------

  /** The range the panel is showing: the chosen one, or the whole archive. */
  private get exportSelection(): ExportRange | null {
    const full = fullRange(this.index);
    if (full === null) return null;
    return this.exportRange === null ? full : clampRange(this.exportRange, this.index.count);
  }

  private get exportRunning(): boolean {
    return this.exportStatus?.state === "running";
  }

  /** The overlay sizes of the format chosen. */
  private get exportSize(): { timestamp: number; readings: number } {
    return this.exportSizes[this.exportAspect];
  }

  private setExportSize(key: "timestamp" | "readings", value: number): void {
    this.exportSizes = {
      ...this.exportSizes,
      [this.exportAspect]: { ...this.exportSize, [key]: value },
    };
  }

  /** Remember the frame's size when it changes; most frames repeat it. */
  private noteFrameSize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    if (this.frameSize?.[0] === width && this.frameSize[1] === height) return;
    this.frameSize = [width, height];
  }

  /** Which way the crop slides, or null when the chosen format cuts nothing. */
  private get exportCropAxis(): "x" | "y" | null {
    return this.frameSize ? cropAxis(this.frameSize, this.exportAspect) : null;
  }

  private onHandleDown(event: PointerEvent, kind: "start" | "end"): void {
    const track = (event.currentTarget as HTMLElement).parentElement;
    if (!track || this.exportRunning) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    // Nothing changes on the press itself (WCAG 2.5.2): the range moves
    // only once the pointer does, and a cancelled drag puts it back.
    this.exportDrag = {
      kind,
      track: track.getBoundingClientRect(),
      before: this.exportRange,
      position: this.position,
    };
  }

  /**
   * Drag a range end along the scrubber. The playhead goes with it, so the
   * picture shows the frame the video would open or close on — the same
   * reason the range is otherwise set by marking the playhead.
   */
  private onHandleMove = (event: PointerEvent): void => {
    const drag = this.exportDrag;
    const range = this.exportSelection;
    if (!drag || drag.kind === "crop" || range === null || drag.track.width <= 0) return;
    const last = Math.max(0, this.index.count - 1);
    const share = Math.min(1, Math.max(0, (event.clientX - drag.track.left) / drag.track.width));
    const position = Math.round(share * last);
    this.exportRange =
      drag.kind === "start"
        ? withStart(range, position, this.index.count)
        : withEnd(range, position, this.index.count);
    this.scrubTo(position);
  };

  private onCropDown = (event: PointerEvent): void => {
    const axis = this.exportCropAxis;
    const frame = (event.currentTarget as HTMLElement).parentElement;
    if (!axis || !frame || !this.frameSize) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    const rect = frame.getBoundingClientRect();
    const kept = cropWindow(this.frameSize, this.exportAspect, this.exportCrop);
    // How far the window can move, in screen pixels: the frame's extent
    // less the window's own along the axis it slides on.
    const travel =
      axis === "x" ? rect.width * (1 - kept.width / 100) : rect.height * (1 - kept.height / 100);
    this.exportDrag = {
      kind: "crop",
      from: axis === "x" ? event.clientX : event.clientY,
      crop: this.exportCrop,
      travel,
      axis,
    };
  };

  private onCropMove = (event: PointerEvent): void => {
    const drag = this.exportDrag;
    if (!drag || drag.kind !== "crop" || drag.travel <= 0) return;
    const moved = (drag.axis === "x" ? event.clientX : event.clientY) - drag.from;
    this.exportCrop = Math.min(
      100,
      Math.max(0, Math.round(drag.crop + (moved / drag.travel) * 100)),
    );
  };

  private endExportDrag = (event: PointerEvent): void => {
    const drag = this.exportDrag;
    this.exportDrag = undefined;
    if (!drag) return;
    if (event.type === "pointercancel") {
      if (drag.kind === "crop") this.exportCrop = drag.crop;
      else {
        this.exportRange = drag.before;
        this.scrubTo(drag.position);
      }
    }
    if (drag.kind !== "crop") this.loadPendingPosition();
  };

  private toggleExport = (): void => {
    this.exportOpen = !this.exportOpen;
    this.exportError = undefined;
    if (this.exportOpen) void this.subscribeExport();
    else this.unsubscribeExport();
  };

  /**
   * Follow this camera's export status for as long as the panel is open.
   *
   * Subscribed on open rather than when an export starts, so a panel
   * opened on a second device — or reopened after the dashboard was
   * closed mid-encode — shows the export that is already running, or the
   * link to the one that finished, instead of an idle form.
   */
  private async subscribeExport(): Promise<void> {
    this.unsubscribeExport();
    const connection = this.hass?.connection;
    if (!connection || !this.config) return;

    const generation = ++this.exportSubscription;
    try {
      const unsubscribe = await connection.subscribeMessage<ExportStatus>(
        (status) => {
          if (generation === this.exportSubscription) this.onExportStatus(status);
        },
        { type: WS_EXPORT_SUBSCRIBE, entity_id: this.config.camera_entity },
      );
      // The panel was closed, or reopened, while this was in flight.
      if (generation !== this.exportSubscription) {
        void unsubscribe();
        return;
      }
      this.exportUnsubscribe = unsubscribe;
    } catch (error) {
      if (generation === this.exportSubscription) {
        this.exportError = this.exportErrorKey(error);
      }
    }
  }

  private unsubscribeExport(): void {
    this.exportSubscription++;
    const unsubscribe = this.exportUnsubscribe;
    this.exportUnsubscribe = undefined;
    // Rejects if the socket has already gone, which is the same outcome.
    if (unsubscribe) void Promise.resolve(unsubscribe()).catch(() => undefined);
  }

  private onExportStatus(status: ExportStatus): void {
    this.exportStatus = status;
    if (status.state !== "done" || !status.result) {
      this.exportUrl = undefined;
      this.exportUrlFor = undefined;
      return;
    }
    void this.resolveExportUrl(status.result.media_content_id);
  }

  /**
   * Turn the finished video's media id into a link the browser can open.
   *
   * Media files are served behind authentication, so the id has to be
   * exchanged for a short-lived signed URL. Failing to get one is not an
   * error worth showing: the video exists either way, and the panel says
   * where it was saved.
   */
  private async resolveExportUrl(mediaContentId: string): Promise<void> {
    if (this.exportUrlFor === mediaContentId || !this.hass?.callWS) return;
    this.exportUrlFor = mediaContentId;
    this.exportUrl = undefined;
    try {
      const resolved = await this.hass.callWS<{ url: string }>({
        type: WS_RESOLVE_MEDIA,
        media_content_id: mediaContentId,
      });
      if (this.exportUrlFor !== mediaContentId) return;
      this.exportUrl = this.hass.hassUrl?.(resolved.url) ?? resolved.url;
    } catch {
      // No media browser on this install; the saved-as line still applies.
    }
  }

  /**
   * Follow a link to another Home Assistant panel without reloading.
   *
   * A plain href would load the whole frontend again. This is what HA's
   * own `navigate()` does: push the path and tell the app it moved. A
   * click with a modifier key, or any button but the first, is left to
   * the browser, so opening the link in a new tab still works.
   */
  private navigateInApp = (event: MouseEvent): void => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const href = (event.currentTarget as HTMLAnchorElement).getAttribute("href");
    if (!href) return;
    event.preventDefault();
    history.pushState(null, "", href);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  };

  /** A stable string key for a refused WebSocket command. */
  private exportErrorKey(error: unknown): string {
    const code =
      typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    return code || "unknown";
  }

  /**
   * What a CSS colour comes out as, asked of the browser.
   *
   * A row's colour can be anything CSS accepts, including a theme
   * variable, and the integration has no stylesheet to resolve one
   * against. The probe sits inside this card's shadow root so that the
   * card's own custom properties — the accent above all — are in scope.
   */
  private resolveColor = (value: string): string => {
    const probe = document.createElement("span");
    probe.style.display = "none";
    probe.style.color = value;
    this.renderRoot.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    return computed || value;
  };

  private startExport = async (): Promise<void> => {
    const range = this.exportSelection;
    if (!this.hass?.callWS || !this.config || range === null) return;

    const request = exportRequest(
      this.config,
      this.index,
      range,
      {
        fps: this.exportFps,
        timestamp: this.exportStamp,
        timestampSize: this.exportSize.timestamp,
        readings: this.exportReadings,
        readingsSize: this.exportSize.readings,
        positions: this.exportPositions,
        aspect: this.exportAspect,
        cropPosition: this.exportCrop,
        every: this.exportEvery,
      },
      this.language,
      this.resolveColor,
    );
    if (request === null) return;

    this.exportError = undefined;
    try {
      // The status subscription carries everything from here on; the
      // reply only matters for the first paint of the progress bar.
      this.exportStatus = await this.hass.callWS<ExportStatus>({
        type: WS_EXPORT_START,
        ...request,
      });
    } catch (error) {
      this.exportError = this.exportErrorKey(error);
    }
  };

  private cancelExport = async (): Promise<void> => {
    if (!this.hass?.callWS || !this.config) return;
    try {
      await this.hass.callWS({
        type: WS_EXPORT_CANCEL,
        entity_id: this.config.camera_entity,
      });
    } catch (error) {
      this.exportError = this.exportErrorKey(error);
    }
  };

  private markExportStart = (): void => {
    const range = this.exportSelection;
    if (range) this.exportRange = withStart(range, this.position, this.index.count);
  };

  private markExportEnd = (): void => {
    const range = this.exportSelection;
    if (range) this.exportRange = withEnd(range, this.position, this.index.count);
  };

  /** `hours` back from the newest frame; null selects the whole archive. */
  private presetExport(hours: number | null): void {
    this.exportRange = hours === null ? null : lastHours(this.index, hours);
  }

  /** An export error in the viewer's language, or the server's own words. */
  private exportErrorText(key: string, fallback?: string | null): string {
    const translated = this.t(`export.error.${key}`);
    // localize() hands the key back when it has no entry for it.
    if (!translated.startsWith("export.error.")) return translated;
    return fallback || this.t("export.error.unknown");
  }

  // --- render ------------------------------------------------------

  private get timeZone(): string {
    return this.hass?.config?.time_zone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
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

    const slot = this.index.t0 === null ? null : this.index.t0 + this.position * this.index.step;

    return html`
      <ha-card .header=${this.config.title ?? nothing}>
        ${renderVersionBanner(this.versionMismatch, (k) => this.t(k))}
        ${this.renderStage(slot)}
        ${hasFrames(this.index) ? this.renderTimeline(slot) : nothing}
        ${
          hasFrames(this.index) && this.config.show_export && this.exportOpen
            ? this.renderExport()
            : nothing
        }
      </ha-card>
    `;
  }

  private renderStage(slot: number | null): TemplateResult {
    if (!hasFrames(this.index)) {
      return html`
        <div class="stage">
          <div class="empty">
            ${
              this.indexError
                ? html`
                  <div>${this.t("empty.index_failed")}</div>
                  <div class="detail">${this.indexError}</div>
                `
                : html`
                  <div>${this.t("empty.no_frames")}</div>
                  <div>${this.t("empty.first_soon")}</div>
                `
            }
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
      <div
        class="stage"
        style="--wtl-frame-filter:${filter}"
        @click=${this.onStageClick}
      >
        <div
          class="layers"
          role="button"
          tabindex="0"
          aria-label=${this.t("actions.show_camera")}
          @keydown=${(event: KeyboardEvent) =>
            this.onActivateKey(event, this.config!.camera_entity)}
        >
          <img class="layer a" alt="" decoding="async" fetchpriority="high" />
          <img class="layer b" alt="" decoding="async" fetchpriority="high" />
        </div>
        ${this.renderCropMask()}
        ${
          this.frameError
            ? html`<div class="empty">
              <div>${this.t("empty.frame_failed")}</div>
              <div class="detail">${this.frameError}</div>
            </div>`
            : nothing
        }
        ${
          slot !== null
            ? html`<div class="stamp">
              <time datetime=${new Date(slot * 1000).toISOString()}>
                ${formatStamp(slot, this.timeZone, this.language)}
              </time>
            </div>`
            : nothing
        }
        ${slot !== null ? this.renderReadouts(slot) : nothing}
        ${
          this.onGap
            ? html`<div class="badge gap">${this.t("badge.gap")}</div>`
            : this.atLive
              ? html`<div class="badge live">${this.t("badge.live")}</div>`
              : nothing
        }
        ${this.renderControls()}
      </div>
    `;
  }

  /**
   * The readings blocks, wrapped so the narrow layout can stack them.
   *
   * The wrapper is inert until there are two blocks — `display: contents`
   * means it generates no box at all, so a single block still positions
   * itself against the stage exactly as it did before there was a second
   * one. `pair` is what switches the wrapper on, and nothing in the
   * stylesheet touches a block's box without going through that class.
   */
  private renderReadouts(slot: number): TemplateResult | typeof nothing {
    const groups = overlayGroups(this.config);
    if (groups.length === 0) return nothing;

    return html`<div class="readouts ${groups.length > 1 ? "pair" : ""}">
      ${groups.map((group) => this.renderReadout(slot, group))}
    </div>`;
  }

  /**
   * One time-synced overlay block.
   *
   * Every value is the reading in effect at the scrubbed moment, and each
   * row shows the time that reading was actually taken. Showing the
   * reading's own time is not decoration: these gauges report hourly, so
   * without it a value sitting next to a 12:05 frame silently implies a
   * 12:05 measurement.
   */
  private renderReadout(slot: number, group: OverlayGroup): TemplateResult {
    const classes = `readout ${group.side === "left" ? "left" : ""}`;

    // Folded blocks return before any of the per-row work below. That is
    // not just tidiness: resolveAt and windowAround run for every row on
    // every frame, and at 32x that is the card's hottest loop. A hidden
    // block should cost nothing to play past.
    if (this.folded.has(group.side)) {
      return html`<div class="${classes} folded">
        ${this.renderFoldToggle(group.side, true)}
      </div>`;
    }

    const rows = group.entities;

    const at = slot * 1000;
    const rendered = rows.map((row) => {
      const points = this.history.get(row.entity) ?? [];
      const stats = seriesStats(points);
      const reading = resolveAt(points, at, stats.staleAfter);
      const name =
        row.name ?? this.hass?.states[row.entity]?.attributes.friendly_name ?? row.entity;
      const unit = row.unit ?? this.hass?.states[row.entity]?.attributes.unit_of_measurement ?? "";
      const color = row.color ?? "var(--wtl-accent)";

      const value =
        reading === null
          ? "—"
          : `${reading.value.toFixed(row.decimals ?? 1)}${unit ? ` ${unit}` : ""}`;

      // Deliberately NOT gated on `reading` — the graph and the number
      // answer different questions. The number is "what was the value at
      // this instant", which is honestly nothing when the playhead sits
      // before the first reading. The graph is "what has this gauge
      // done", which still has an answer there. Tying them meant a
      // sensor added last week lost its chart across the whole earlier
      // half of the archive, and a stale one lost it entirely. Whether
      // there is anything to draw is sparkline's call, not this one's.
      const graphHours = this.config ? rowGraphHours(row, this.config) : DEFAULTS.graph_hours;
      const drawGraph = row.graph === true && this.config?.show_graph === true;
      const windowed = drawGraph ? windowAround(points, at, graphHours) : [];
      const nights =
        drawGraph && this.config?.show_sun === true ? this.nightsAround(at, graphHours) : [];
      const graph = drawGraph
        ? sparkline({
            points: windowed,
            at,
            hours: graphHours,
            color,
            label: `${name} history`,
            quantum: stats.quantum,
            nights,
          })
        : null;

      // The caption is the chart's units, and without it the chart is an
      // interval scale with no origin and no unit — redrawn every frame,
      // per row. Two of these sit side by side over one picture with a
      // forty-fold difference in vertical gain and a thirty-fold one in
      // time base, both filling the same 34px box. Saying how far the
      // gauge moved and over how long is what makes them comparable, and
      // it is the only thing the autoscale destroys that the numeric
      // readout beside it does not already carry.
      const extent = graph === null ? 0 : extentOf(windowed);
      const scale =
        graph === null
          ? nothing
          : html`<div class="spark-scale">
            <span
              >${
                extent === 0
                  ? this.t("spark.flat")
                  : this.t("spark.range", `${formatExtent(extent)}${unit ? ` ${unit}` : ""}`)
              }</span
            >
            <span>${formatSpan(graphHours)}</span>
          </div>`;

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
        <div
          class="readout-row ${reading?.stale ? "stale" : ""}"
          role="button"
          tabindex="0"
          aria-label=${this.t("actions.show_entity", name)}
          @click=${() => this.fireMoreInfo(row.entity)}
          @keydown=${(event: KeyboardEvent) => this.onActivateKey(event, row.entity)}
        >
          ${icon}
          <span class="readout-name" style="color:${color}">${name}</span>
          <span class="readout-value">${value}</span>
          ${
            reading !== null
              ? html`<span class="readout-at"
                >${formatClock(Math.round(reading.at / 1000), this.timeZone, this.language)}</span
              >`
              : nothing
          }
        </div>
        ${graph ? html`<div class="spark-wrap">${graph}${scale}</div>` : nothing}
      `;
    });

    // The side is a modifier on the same element, not a separate one:
    // .readout-row has to stay where it is for onStageClick to keep
    // telling a reading apart from the picture behind it.
    return html`<div class=${classes}>
      <div class="readout-head">
        ${group.title ? html`<div class="readout-title">${group.title}</div>` : nothing}
        ${this.renderFoldToggle(group.side, false)}
      </div>
      ${rendered}
    </div>`;
  }

  /**
   * Night spans covering one chart's window.
   *
   * Memoised on the window and the location, because every graphed row on
   * the card asks for the same span at the same moment and the answer
   * only changes when the playhead does. Rebuilding it per row per frame
   * would repeat the same work six times over.
   */
  private nightsAround(at: number, hours: number): NightBand[] {
    const half = (hours * 3_600_000) / 2;
    return this.nightsBetween(at - half, at + half);
  }

  /**
   * Night across an arbitrary window, memoised on the window itself.
   *
   * Every graphed row asks for the same window at the same moment, and
   * the scrubber asks for the archive's, so the cache key is the window
   * and not the caller. One entry is enough in practice: the rows all
   * share a window and the scrubber's changes only when the archive does.
   */
  private nightsBetween(from: number, to: number): NightBand[] {
    const latitude = this.hass?.config?.latitude;
    const longitude = this.hass?.config?.longitude;
    if (latitude === undefined || longitude === undefined) return [];

    const key = `${from}|${to}|${latitude}|${longitude}`;
    if (this.nightCache?.key !== key) {
      this.nightCache = {
        key,
        bands: nightBands(from, to, latitude, longitude),
      };
    }
    return this.nightCache.bands;
  }

  /**
   * The eye that folds a readings block away and brings it back.
   *
   * The icon names the state you are moving to, not the one you are in:
   * a crossed-out eye on a visible block reads as "hide this", which is
   * what pressing it does. Labelling it the other way round is the
   * classic toggle trap — the control describes itself instead of its
   * effect, and everyone presses it twice to find out.
   *
   * A folded block collapses to this button alone rather than vanishing.
   * Something has to stay on the picture or the readings are gone for
   * good, and the control that removed them is the honest handle for
   * getting them back.
   */
  private renderFoldToggle(side: ReadoutSide, folded: boolean): TemplateResult {
    const label = this.t(folded ? "actions.show_readings" : "actions.hide_readings");
    return html`<ha-icon-button
      class="readout-fold"
      .label=${label}
      aria-expanded=${folded ? "false" : "true"}
      @click=${() => this.toggleFold(side)}
    >
      <ha-icon icon=${folded ? "mdi:eye-outline" : "mdi:eye-off-outline"}></ha-icon>
    </ha-icon-button>`;
  }

  /** Replaced, not mutated — Lit's dirty check on `folded` is by identity. */
  private toggleFold(side: ReadoutSide): void {
    const next = new Set(this.folded);
    if (!next.delete(side)) next.add(side);
    this.folded = next;
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
  /**
   * Open Home Assistant's more-info dialog for an entity.
   *
   * `composed` is what carries the event out of this card's shadow root;
   * without it the event stops at the boundary and the dialog never
   * opens. `bubbles` gets it up to the Lovelace view that listens.
   */
  private fireMoreInfo(entityId: string): void {
    if (!entityId) return;
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Keyboard equivalent for the click targets.
   *
   * These are `div`s with `role="button"`, and a div does not activate on
   * a keypress by itself — WCAG 2.1.1 is only satisfied if the handler is
   * written. Space is preventDefault-ed because its default action on a
   * focused element is to scroll the page.
   */
  private onActivateKey(event: KeyboardEvent, entityId: string): void {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    this.fireMoreInfo(entityId);
  }

  /**
   * Any click on the picture that was not aimed at something else.
   *
   * Bound on the stage rather than on the image layers, so it does not
   * depend on which element wins hit-testing. The layers are absolutely
   * positioned under four sibling overlays with their own stacking
   * behaviour; a handler bound there only fires when the layers happen to
   * be the topmost thing at that point, and any overlay that grows —
   * or an error panel that covers the frame outright — silently takes the
   * whole target away. The stage is the common ancestor, so the click
   * arrives however it was routed.
   *
   * `composedPath` rather than `event.target` because the click may have
   * started inside a control's shadow root, where `target` is retargeted
   * to the host and the class check would miss.
   */
  private onStageClick = (event: MouseEvent): void => {
    const path = event.composedPath();
    // Only the segment below the stage. composedPath runs all the way up
    // through Home Assistant's own DOM to window, so searching the whole
    // of it for a class as common as "controls" lets any ancestor
    // anywhere above this card veto every click on the picture.
    const boundary = path.indexOf(event.currentTarget as EventTarget);
    const inside = boundary === -1 ? path : path.slice(0, boundary);

    const aimedElsewhere = inside.some(
      (node) =>
        node instanceof HTMLElement &&
        (node.classList.contains("controls") ||
          node.classList.contains("crop-window") ||
          node.classList.contains("readout-row") ||
          node.classList.contains("readout-fold")),
    );
    if (aimedElsewhere) return;
    if (this.config) this.fireMoreInfo(this.config.camera_entity);
  };

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
        ${
          this.config?.show_export === true
            ? html`<ha-icon-button
                .label=${this.t(this.exportOpen ? "export.close" : "export.open")}
                @click=${this.toggleExport}
              >
                <ha-icon .icon=${this.exportOpen ? "mdi:close" : "mdi:movie-open-outline"}></ha-icon>
              </ha-icon-button>`
            : nothing
        }
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
    const ticks = this.config?.show_dayticks === true;
    const { days, times } = ticks
      ? this.rulerFor()
      : { days: [] as DayTick[], times: [] as TimeTick[] };

    // Independent of show_dayticks: night is context for the footage, not
    // part of the ruler, and someone who turned the ruler off has not
    // said anything about wanting the dark stretches unmarked.
    const nights =
      this.config?.show_sun === true && this.index.t0 !== null
        ? this.nightsBetween(this.index.t0 * 1000, (this.index.t0 + last * this.index.step) * 1000)
        : [];

    return html`
      <div class="timeline">
        ${
          ticks
            ? html`<div class="band dates" aria-hidden="true">
              ${days.map((tick) =>
                tick.label
                  ? html`<span class="lab date" style="left:${tick.left}%"
                      >${tick.label}</span
                    >`
                  : nothing,
              )}
            </div>`
            : nothing
        }

        <div class="track">
          ${
            nights.length > 0
              ? html`<div class="nights" aria-hidden="true">
                ${nights.map(
                  (band) =>
                    html`<span
                      class="night"
                      style="left:${(band.left * 100).toFixed(3)}%;width:${(
                        band.width * 100
                      ).toFixed(3)}%"
                    ></span>`,
                )}
              </div>`
              : nothing
          }
          ${this.renderExportBand()}
          ${
            ticks
              ? html`<div class="marks" aria-hidden="true">
                ${times.map((tick) => html`<span class="mark" style="left:${tick.left}%"></span>`)}
                ${days.map(
                  (tick) =>
                    html`<span
                      class="mark ${tick.isMonthStart ? "month" : "day"}"
                      style="left:${tick.left}%"
                    ></span>`,
                )}
              </div>`
              : nothing
          }
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
          aria-valuetext=${slot !== null ? formatStamp(slot, this.timeZone, this.language) : ""}
          @input=${this.onScrub}
          @change=${this.onScrubCommit}
          />
          ${this.renderExportHandles()}
        </div>

        ${
          ticks
            ? html`<div class="band times" aria-hidden="true">
              ${times.map((tick) =>
                tick.label
                  ? html`<span class="lab time" style="left:${tick.left}%"
                      >${tick.label}</span
                    >`
                  : nothing,
              )}
            </div>`
            : nothing
        }
      </div>
    `;
  }

  /**
   * The chosen range, drawn on the scrubber while the panel is open.
   *
   * Only while it is open: the band is feedback for an edit in progress,
   * and a tinted stretch left on the bar afterwards would read as
   * something about the archive rather than about a form that is closed.
   */
  private renderExportBand(): TemplateResult | typeof nothing {
    const range = this.exportOpen ? this.exportSelection : null;
    if (range === null) return nothing;
    const band = rangeBand(range, this.index.count);
    return html`<div
      class="export-band"
      role="img"
      aria-label=${this.t("export.band")}
      style="left:${band.left.toFixed(3)}%;width:${band.width.toFixed(3)}%"
    ></div>`;
  }

  /**
   * Export, under the timeline.
   *
   * The range is set with the playhead rather than with date pickers:
   * scrub to the frame the video should open on, mark it, scrub to the
   * one it should close on, mark that. The picture is the thing being
   * chosen, so the picture is what the choice is made against — a typed
   * timestamp would have the user reading the clock in the corner and
   * copying it into a field.
   */
  /**
   * The export panel, under the timeline while it is open.
   *
   * Opened from the player bar rather than from a row of its own, so a
   * closed panel adds no height to the card.
   */
  private renderExport(): TemplateResult {
    return html`<div class="export">${this.renderExportPanel()}</div>`;
  }

  private renderExportPanel(): TemplateResult | typeof nothing {
    const range = this.exportSelection;
    if (range === null) return nothing;

    const stamp = (position: number): string => {
      const slot = this.index.t0! + position * this.index.step;
      return formatStamp(slot, this.timeZone, this.language);
    };
    const used = framesUsed(framesIn(this.present, range), this.exportEvery);
    const running = this.exportRunning;
    const hasReadings = overlayEntities(this.config).length > 0;
    const presets = EXPORT_PRESETS.filter((hours) => presetFits(this.index, hours));

    return html`
      <div class="export-panel">
        <div class="export-ends">
          <div class="export-end">
            <span class="export-label">${this.t("export.from")}</span>
            <span class="export-stamp">${stamp(range.start)}</span>
            <button
              class="export-chip"
              ?disabled=${running}
              @click=${this.markExportStart}
            >
              ${this.t("export.start_here")}
            </button>
          </div>
          <div class="export-end">
            <span class="export-label">${this.t("export.to")}</span>
            <span class="export-stamp">${stamp(range.end)}</span>
            <button
              class="export-chip"
              ?disabled=${running}
              @click=${this.markExportEnd}
            >
              ${this.t("export.end_here")}
            </button>
          </div>
        </div>

        ${
          presets.length > 0
            ? html`<div class="export-row">
              ${presets.map(
                (hours) =>
                  html`<button
                    class="export-chip"
                    ?disabled=${running}
                    @click=${() => this.presetExport(hours)}
                  >
                    ${
                      hours < 48
                        ? this.t("export.preset_hours", String(hours))
                        : this.t("export.preset_days", String(hours / 24))
                    }
                  </button>`,
              )}
              <button
                class="export-chip"
                ?disabled=${running}
                @click=${() => this.presetExport(null)}
              >
                ${this.t("export.preset_all")}
              </button>
            </div>`
            : nothing
        }

        <div class="export-row" role="group" aria-label=${this.t("export.fps")}>
          <span class="export-label">${this.t("export.fps")}</span>
          ${EXPORT_FPS.map(
            (fps) =>
              html`<button
                class="export-chip"
                aria-pressed=${this.exportFps === fps ? "true" : "false"}
                ?disabled=${running}
                @click=${() => {
                  this.exportFps = fps;
                }}
              >
                ${fps}
              </button>`,
          )}
        </div>

        <div class="export-row" role="group" aria-label=${this.t("export.every")}>
          <span class="export-label">${this.t("export.every")}</span>
          ${EXPORT_EVERY.map(
            (every) =>
              html`<button
                class="export-chip"
                aria-pressed=${this.exportEvery === every ? "true" : "false"}
                ?disabled=${running}
                @click=${() => {
                  this.exportEvery = every;
                }}
              >
                ${every === 1 ? this.t("export.every_all") : this.t("export.every_n", String(every))}
              </button>`,
          )}
        </div>
        ${
          this.exportEvery > 1
            ? html`<p class="export-hint">${this.t("export.every_hint")}</p>`
            : nothing
        }

        ${this.renderExportFormat(running)}

        ${
          this.exportAspect === "9:16" || this.exportAspect === "1:1"
            ? html`<p class="export-hint">${this.t("export.sizes_hint")}</p>`
            : nothing
        }
        <div class="export-row">
          <label class="export-check">
            <input
              type="checkbox"
              .checked=${this.exportStamp}
              ?disabled=${running}
              @change=${(event: Event) => {
                this.exportStamp = (event.target as HTMLInputElement).checked;
              }}
            />
            ${this.t("export.timestamp")}
          </label>
          ${
            this.exportStamp
              ? this.renderExportSize(
                  TIMESTAMP_SIZE,
                  this.exportSize.timestamp,
                  running,
                  (size) => {
                    this.setExportSize("timestamp", size);
                  },
                )
              : nothing
          }
        </div>
        ${
          hasReadings
            ? html`<div class="export-row">
                <label class="export-check">
                  <input
                    type="checkbox"
                    .checked=${this.exportReadings}
                    ?disabled=${running}
                    @change=${(event: Event) => {
                      this.exportReadings = (event.target as HTMLInputElement).checked;
                    }}
                  />
                  ${this.t("export.readings")}
                </label>
                ${
                  this.exportReadings
                    ? this.renderExportSize(
                        READINGS_SIZE,
                        this.exportSize.readings,
                        running,
                        (size) => {
                          this.setExportSize("readings", size);
                        },
                      )
                    : nothing
                }
              </div>
              ${this.exportReadings ? this.renderExportPositions(running) : nothing}`
            : nothing
        }

        ${this.renderExportSummary(used)}

        ${
          running
            ? nothing
            : html`<div class="export-row">
              <button
                class="export-go"
                ?disabled=${used === 0}
                @click=${this.startExport}
              >
                <ha-icon icon="mdi:movie-open-outline"></ha-icon>
                ${this.t("export.start")}
              </button>
            </div>`
        }
        ${this.renderExportStatus()}
        ${
          this.exportStatus?.folder
            ? html`<div class="export-folder">
              <span>${this.t("export.folder", this.exportStatus.folder)}</span>
              ${
                this.exportStatus.folder_media_id
                  ? html`<a
                      class="export-browse"
                      href=${mediaBrowserPath(this.exportStatus.folder_media_id)}
                      @click=${this.navigateInApp}
                      >${this.t("export.browse")}</a
                    >`
                  : nothing
              }
            </div>`
            : nothing
        }
      </div>
    `;
  }

  /**
   * The format tiles, and with a crop the slider that places it.
   *
   * The slider is the keyboard's way to move the crop; the window drawn
   * over the picture is the pointer's, and shows what is kept.
   */
  private renderExportFormat(running: boolean): TemplateResult {
    const size = this.frameSize;
    const axis = this.exportCropAxis;
    const video = size ? outputSize(size, this.exportAspect, this.exportCrop) : null;
    const hint =
      this.exportAspect === "native"
        ? this.t("export.format_native")
        : axis === null
          ? this.t("export.format_same")
          : this.t("export.format_crop");
    const soft = axis !== null && video !== null && Math.min(...video) < SOFT_CROP_PIXELS;
    const ends = axis === "y" ? ["top", "bottom"] : ["left", "right"];

    return html`<div class="export-format">
      <span class="export-label" id="export-format-label">${this.t("export.format")}</span>
      <div class="export-tiles" role="group" aria-labelledby="export-format-label">
        ${EXPORT_ASPECTS.map(
          (aspect) =>
            html`<button
              class="export-tile"
              aria-pressed=${this.exportAspect === aspect ? "true" : "false"}
              ?disabled=${running}
              @click=${() => {
                this.exportAspect = aspect;
                this.exportCrop = 50;
              }}
            >
              <ha-icon icon=${ASPECT_ICONS[aspect]} aria-hidden="true"></ha-icon>
              <span>${this.t(`export.aspects.${aspect === "native" ? "native" : aspect.replace(":", "_")}`)}</span>
              <span class="export-ratio">
                ${aspect === "native" ? (size ? ratioLabel(size) : "") : aspect}
              </span>
            </button>`,
        )}
      </div>
      <p class="export-hint">${hint}</p>
      ${
        axis !== null
          ? html`<div class="export-crop">
            <label class="export-label" for="export-crop">${this.t("export.crop")}</label>
            <input
              id="export-crop"
              type="range"
              min="0"
              max="100"
              step="1"
              .value=${String(this.exportCrop)}
              aria-valuetext=${
                this.exportCrop === 50
                  ? this.t("export.crop_middle")
                  : `${this.t(`export.positions.${this.exportCrop < 50 ? ends[0] : ends[1]}`)}, ${this.exportCrop} %`
              }
              ?disabled=${running}
              @input=${(event: Event) => {
                this.exportCrop = Number((event.target as HTMLInputElement).value);
              }}
            />
            <button
              class="export-chip"
              ?disabled=${running || this.exportCrop === 50}
              @click=${() => {
                this.exportCrop = 50;
              }}
            >
              ${this.t("export.crop_center")}
            </button>
            <span class="export-crop-ends" aria-hidden="true">
              <span>${this.t(`export.positions.${ends[0]}`)}</span>
              <span>${this.t(`export.positions.${ends[1]}`)}</span>
            </span>
          </div>`
          : nothing
      }
      ${
        soft && video
          ? html`<p class="export-note" role="status">
            <ha-icon icon="mdi:information-outline" aria-hidden="true"></ha-icon>
            <span>${this.t("export.soft_crop", `${video[0]} × ${video[1]}`)}</span>
          </p>`
          : nothing
      }
    </div>`;
  }

  /**
   * Frames, length and an estimate of the file's size, with a warning when
   * the volume the video goes to would be left short.
   */
  private renderExportSummary(frames: number): TemplateResult {
    if (frames === 0) {
      return html`<div class="export-summary">${this.t("export.summary_empty")}</div>`;
    }
    const size = this.frameSize;
    const estimate = size
      ? estimateSize(frames, outputSize(size, this.exportAspect, this.exportCrop))
      : null;
    const free = this.exportStatus?.free_bytes;
    const short =
      estimate !== null && typeof free === "number" && free - estimate.high < EXPORT_MIN_FREE_BYTES;

    return html`<dl class="export-stats">
        <div>
          <dt>${this.t("export.frames")}</dt>
          <dd>${frames.toLocaleString(this.language)}</dd>
        </div>
        <div>
          <dt>${this.t("export.length")}</dt>
          <dd>${formatLength(frames / this.exportFps)}</dd>
        </div>
        <div>
          <dt>${this.t("export.file_size")}</dt>
          <dd>${estimate ? this.t("export.about", formatSize(estimate.bytes)) : "–"}</dd>
        </div>
      </dl>
      ${
        estimate
          ? html`<p class="export-hint">
            ${this.t("export.size_estimate")
              .replace("{low}", formatSize(estimate.low))
              .replace("{high}", formatSize(estimate.high))}
          </p>`
          : nothing
      }
      ${
        short && typeof free === "number"
          ? html`<p class="export-warning" role="status">
            ${this.t("export.low_disk", formatSize(free))}
          </p>`
          : nothing
      }`;
  }

  /**
   * The crop, drawn over the picture while the panel is open: what the
   * video keeps stays bright, the rest is dimmed, and the window can be
   * dragged. Sized to the frame inside the stage rather than to the stage,
   * because the picture is letterboxed into it.
   */
  private renderCropMask(): TemplateResult | typeof nothing {
    const size = this.frameSize;
    if (!this.exportOpen || !size || this.exportCropAxis === null) return nothing;
    const kept = cropWindow(size, this.exportAspect, this.exportCrop);
    return html`<div
      class="crop-frame"
      aria-hidden="true"
      style="--wtl-frame-ratio:${(size[0] / size[1]).toFixed(4)}"
    >
      <div
        class="crop-window ${this.exportCropAxis}"
        style="left:${kept.left.toFixed(3)}%;top:${kept.top.toFixed(3)}%;width:${kept.width.toFixed(3)}%;height:${kept.height.toFixed(3)}%"
        @pointerdown=${this.onCropDown}
        @pointermove=${this.onCropMove}
        @pointerup=${this.endExportDrag}
        @pointercancel=${this.endExportDrag}
        @click=${(event: Event) => event.stopPropagation()}
      ></div>
    </div>`;
  }

  /**
   * Grips on both ends of the export band, for dragging the range.
   *
   * Pointer only, and hidden from assistive technology: the keyboard sets
   * the same range by moving the playhead and marking it, which the
   * buttons in the panel do. Above the scrubber's input in paint order,
   * which is what lets them take the pointer from it.
   */
  private renderExportHandles(): TemplateResult | typeof nothing {
    const range = this.exportOpen ? this.exportSelection : null;
    if (range === null || this.exportRunning) return nothing;
    const band = rangeBand(range, this.index.count);
    const handle = (kind: "start" | "end", left: number): TemplateResult =>
      html`<span
        class="export-handle ${kind}"
        aria-hidden="true"
        style="left:${left.toFixed(3)}%"
        @pointerdown=${(event: PointerEvent) => this.onHandleDown(event, kind)}
        @pointermove=${this.onHandleMove}
        @pointerup=${this.endExportDrag}
        @pointercancel=${this.endExportDrag}
      ></span>`;
    return html`${handle("start", band.left)}${handle("end", band.left + band.width)}`;
  }

  /**
   * A size as a share of the video's width.
   *
   * A share rather than a pixel count, because the card does not know
   * the size of the frames and the share is how an overlay is judged
   * anyway: "the readings cover a third of the picture".
   */
  private renderExportSize(
    bounds: { min: number; max: number; step: number },
    value: number,
    disabled: boolean,
    onChange: (size: number) => void,
  ): TemplateResult {
    const label = this.t("export.size_value", String(value));
    return html`<label class="export-size">
      <span class="export-label">${this.t("export.size")}</span>
      <input
        type="range"
        min=${bounds.min}
        max=${bounds.max}
        step=${bounds.step}
        .value=${String(value)}
        aria-valuetext=${label}
        ?disabled=${disabled}
        @input=${(event: Event) => onChange(Number((event.target as HTMLInputElement).value))}
      />
      <span class="export-size-value">${label}</span>
    </label>`;
  }

  /**
   * Where each readings block goes in the video — one row per block the
   * card shows. Unchosen, a block sits where the card draws it.
   */
  private renderExportPositions(disabled: boolean): TemplateResult[] {
    const groups = overlayGroups(this.config);
    return groups.map((group) => {
      const current = this.exportPositions[group.side] ?? group.side;
      const label =
        groups.length === 1
          ? this.t("export.position")
          : (group.title ??
            this.t(group.side === "left" ? "export.block_left" : "export.block_right"));
      return html`<div class="export-row" role="group" aria-label=${label}>
        <span class="export-label">${label}</span>
        ${EXPORT_POSITIONS.map(
          (position) =>
            html`<button
              class="export-chip"
              aria-pressed=${current === position ? "true" : "false"}
              ?disabled=${disabled}
              @click=${() => {
                this.exportPositions = {
                  ...this.exportPositions,
                  [group.side]: position,
                };
              }}
            >
              ${this.t(`export.positions.${position}`)}
            </button>`,
        )}
      </div>`;
    });
  }

  /** Progress, the finished video, or what went wrong. */
  private renderExportStatus(): TemplateResult | typeof nothing {
    // A refused command is about the attempt just made, so it outranks
    // whatever the last export's status happens to be.
    if (this.exportError) {
      return html`<div class="export-status" role="alert">
        <span class="export-error">${this.exportErrorText(this.exportError)}</span>
      </div>`;
    }

    const status = this.exportStatus;
    if (!status || status.state === "idle") return nothing;

    if (status.state === "running") {
      const share = progress(status);
      return html`<div class="export-status" role="status">
        <span>
          ${
            status.total > 0
              ? this.t("export.running")
                  .replace("{done}", String(status.done))
                  .replace("{total}", String(status.total))
              : this.t("export.preparing")
          }
        </span>
        <div
          class="export-progress"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow=${Math.round(share * 100)}
        >
          <span style="width:${(share * 100).toFixed(1)}%"></span>
        </div>
        <button class="export-chip" @click=${this.cancelExport}>
          ${this.t("export.cancel")}
        </button>
      </div>`;
    }

    if (status.state === "done" && status.result) {
      const result = status.result;
      return html`<div class="export-status" role="status">
        <span>
          ${this.t("export.done")} · ${formatLength(result.duration)} ·
          ${formatSize(result.size_bytes)}
        </span>
        <span class="detail">${this.t("export.saved", result.path)}</span>
        ${
          this.exportUrl
            ? html`<span class="export-links">
              <a class="export-watch" href=${this.exportUrl} target="_blank" rel="noopener">
                <ha-icon icon="mdi:play-circle-outline"></ha-icon>
                ${this.t("export.watch")}
              </a>
              <a
                class="export-download"
                href=${this.exportUrl}
                download=${result.file_name}
                target="_blank"
                rel="noopener"
              >
                <ha-icon icon="mdi:download"></ha-icon>
                ${this.t("export.download")}
              </a>
            </span>`
            : nothing
        }
      </div>`;
    }

    if (status.state === "cancelled") {
      return html`<div class="export-status" role="status">
        <span class="detail">${this.t("export.cancelled")}</span>
      </div>`;
    }

    return html`<div class="export-status" role="alert">
      <span class="export-error"
        >${this.exportErrorText(status.error ?? "unknown", status.message)}</span
      >
    </div>`;
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
