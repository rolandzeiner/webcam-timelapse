import "./editor";
/**
 * Webcam Timelapse Card
 *
 * Scrub, play and inspect an archived still-image webcam.
 */
import { LitElement, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import { cardStyles } from "./card-styles";
import { Coalescer } from "./coalesce";
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
import {
  checkCardVersionWS,
  renderVersionBanner,
} from "./shared-render";
import { extentOf, sparkline } from "./sparkline";
import { type NightSpan, nightSpans } from "./sun";
import type {
  HomeAssistant,
  LovelaceCardEditor,
  WebcamTimelapseCardConfig,
} from "./types";
import {
  formatExtent,
  formatSpan,
  prefersReducedMotion,
  safeImageUri,
} from "./utils";

const SPEEDS = [1, 2, 4, 8, 16, 32, 64] as const;
/** Speed a card starts at when config says nothing usable. */
const DEFAULT_SPEED = 32;
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

  /** Not @state: derived from the playhead, never a reason to re-render. */
  private nightCache?: { key: string; spans: NightSpan[] };

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
    this.config = {
      autoplay: false,
      speed: DEFAULT_SPEED,
      show_dayticks: true,
      show_graph: true,
      show_sun: false,
      graph_hours: 24,
      deflicker: 50,
      ...config,
      // Drop malformed rows rather than crashing render on a hand-edited
      // YAML typo: one bad entry should cost that row, not the card.
      // Both blocks, or the left one is a hand-edit away from the crash
      // this exists to prevent.
      entities: (config.entities ?? []).filter((row) => row?.entity),
      entities_left: (config.entities_left ?? []).filter((row) => row?.entity),
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
    if (this.scrubSettle) window.clearTimeout(this.scrubSettle);
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
      this.config?.graph_hours ?? 24,
      ...entities.map((row) => row.graph_hours ?? 0),
    );

    this.history = await fetchOverlayHistory(
      this.hass,
      entities.map((row) => row.entity),
      {
        // Cover the whole archive so scrubbing to the oldest frame still
        // resolves a reading; +1 day of slack for the retention boundary.
        days:
          (this.index.retention_days || 14) + 1 + Math.ceil(graphHours / 48),
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
  private frameSources(position: number): string[] {
    const sources: string[] = [];
    const live = safeImageUri(
      this.hass?.states[this.config!.camera_entity]?.attributes
        .entity_picture as string | undefined,
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
  private onScrub(event: Event): void {
    const position = Number((event.target as HTMLInputElement).value);
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

  private onScrubCommit(event: Event): void {
    // Belt and braces: `change` also fires for a keyboard step or a click
    // on the track, where there may never be a second `input` to settle.
    if (this.scrubSettle) window.clearTimeout(this.scrubSettle);
    this.scrubSettle = undefined;
    this.pendingPosition = Number((event.target as HTMLInputElement).value);
    this.loadPendingPosition();
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
        ${slot !== null ? this.renderReadouts(slot) : nothing}
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

      // Deliberately NOT gated on `reading` — the graph and the number
      // answer different questions. The number is "what was the value at
      // this instant", which is honestly nothing when the playhead sits
      // before the first reading. The graph is "what has this gauge
      // done", which still has an answer there. Tying them meant a
      // sensor added last week lost its chart across the whole earlier
      // half of the archive, and a stale one lost it entirely. Whether
      // there is anything to draw is sparkline's call, not this one's.
      const graphHours = row.graph_hours ?? this.config?.graph_hours ?? 24;
      const drawGraph = row.graph === true && this.config?.show_graph !== false;
      const windowed = drawGraph ? windowAround(points, at, graphHours) : [];
      const nights =
        drawGraph && this.config?.show_sun === true
          ? this.nightsAround(at, graphHours)
          : [];
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
      const scale = graph === null
        ? nothing
        : html`<div class="spark-scale">
            <span
              >${extent === 0
                ? this.t("spark.flat")
                : this.t("spark.range", `${formatExtent(extent)}${unit ? ` ${unit}` : ""}`)}</span
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
          @keydown=${(event: KeyboardEvent) =>
            this.onActivateKey(event, row.entity)}
        >
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
        ${graph
          ? html`<div class="spark-wrap">${graph}${scale}</div>`
          : nothing}
      `;
    });

    // The side is a modifier on the same element, not a separate one:
    // .readout-row has to stay where it is for onStageClick to keep
    // telling a reading apart from the picture behind it.
    return html`<div class=${classes}>
      <div class="readout-head">
        ${group.title
          ? html`<div class="readout-title">${group.title}</div>`
          : nothing}
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
  private nightsAround(at: number, hours: number): NightSpan[] {
    const half = (hours * 3_600_000) / 2;
    const latitude = this.hass?.config?.latitude;
    const longitude = this.hass?.config?.longitude;
    if (latitude === undefined || longitude === undefined) return [];

    const key = `${at}|${hours}|${latitude}|${longitude}`;
    if (this.nightCache?.key !== key) {
      this.nightCache = {
        key,
        spans: nightSpans(at - half, at + half, latitude, longitude),
      };
    }
    return this.nightCache.spans;
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
  private onStageClick(event: MouseEvent): void {
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
          node.classList.contains("readout-row") ||
          node.classList.contains("readout-fold")),
    );
    if (aimedElsewhere) return;
    if (this.config) this.fireMoreInfo(this.config.camera_entity);
  }

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
