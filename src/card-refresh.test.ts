// @vitest-environment happy-dom

/**
 * The frame-index poll's lifecycle: it stops when the card leaves the page
 * and starts again when the same element comes back, which is what a
 * dashboard view navigated away from and back does.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import "./webcam-timelapse-card";
import { CARD_TAG, CARD_VERSION, WS_CARD_VERSION, WS_INDEX } from "./const";
import type { FrameIndex } from "./frames";
import type { HomeAssistant } from "./types";

type Card = HTMLElement & {
  hass: HomeAssistant;
  preview: boolean;
  setConfig: (c: unknown) => void;
  updateComplete: Promise<unknown>;
};

/** The step the index reports, and the most jitter added on top of it. */
const STEP_S = 60;
const INTERVAL_MS = STEP_S * 1000 + 15_000;

const INDEX: FrameIndex = {
  base: "/api/webcam_timelapse/frames/x",
  ext: ".webp",
  step: STEP_S,
  t0: null,
  count: 0,
  gaps: [],
  retention_days: 14,
  online: true,
  newest_slot: null,
};

/** Every answer arrives on a zero-delay timer, so a test decides whether
 *  it lands before or after the card is removed. */
function hass(): HomeAssistant {
  const callWS = vi.fn(
    (msg: { type: string }) =>
      new Promise((resolve) => {
        setTimeout(() => {
          if (msg.type === WS_INDEX) resolve(INDEX);
          else if (msg.type === WS_CARD_VERSION) resolve({ version: CARD_VERSION });
          else resolve({ luma: [] });
        }, 0);
      }),
  );
  return {
    states: { "camera.garden": { entity_id: "camera.garden", state: "idle", attributes: {} } },
    callWS,
  } as unknown as HomeAssistant;
}

const indexCalls = (h: HomeAssistant): number =>
  (h.callWS as ReturnType<typeof vi.fn>).mock.calls.filter(
    (c) => (c[0] as { type: string }).type === WS_INDEX,
  ).length;

async function mount(h: HomeAssistant): Promise<Card> {
  const el = document.createElement(CARD_TAG) as Card;
  el.setConfig({ type: `custom:${CARD_TAG}`, camera_entity: "camera.garden" });
  el.hass = h;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

async function advance(el: Card, ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
  await el.updateComplete;
}

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("frame index polling", () => {
  it("stops for good once the card is removed", async () => {
    const h = hass();
    const el = await mount(h);
    el.remove();
    // Lets the first fetch land on the detached card.
    await advance(el, 0);
    const before = indexCalls(h);
    await advance(el, 2 * INTERVAL_MS);
    expect(indexCalls(h)).toBe(before);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("starts again when the card comes back", async () => {
    const h = hass();
    const el = await mount(h);
    await advance(el, 0);
    el.remove();
    document.body.appendChild(el);
    await el.updateComplete;
    const before = indexCalls(h);
    await advance(el, INTERVAL_MS);
    expect(indexCalls(h)).toBeGreaterThan(before);
  });
});

const FRAMES: FrameIndex = {
  ...INDEX,
  t0: 1_700_000_000,
  count: 3,
  newest_slot: 1_700_000_000 + 2 * STEP_S,
};

/** Like hass(), with the index and the bundle version the box reports. */
function hassWith(index: FrameIndex, version: string): HomeAssistant {
  const callWS = vi.fn(
    (msg: { type: string }) =>
      new Promise((resolve) => {
        setTimeout(() => {
          if (msg.type === WS_INDEX) resolve(index);
          else if (msg.type === WS_CARD_VERSION) resolve({ version });
          else resolve({ luma: [] });
        }, 0);
      }),
  );
  return {
    states: { "camera.garden": { entity_id: "camera.garden", state: "idle", attributes: {} } },
    locale: { language: "en" },
    callWS,
  } as unknown as HomeAssistant;
}

async function mountPreview(
  h: HomeAssistant,
  preview: boolean,
  config: Record<string, unknown> = {},
): Promise<Card> {
  const el = document.createElement(CARD_TAG) as Card;
  el.preview = preview;
  el.setConfig({ type: `custom:${CARD_TAG}`, camera_entity: "camera.garden", ...config });
  el.hass = h;
  document.body.appendChild(el);
  // Lets the index and version answers land and the card render them.
  await advance(el, 0);
  await advance(el, 0);
  return el;
}

const playLabel = (el: Card): string | undefined =>
  (el.shadowRoot?.querySelector(".controls .play") as (HTMLElement & { label?: string }) | null)
    ?.label;

describe("edit-dialog preview", () => {
  it("shows the stale-bundle banner on a dashboard, not in the preview", async () => {
    const dashboard = await mountPreview(hassWith(INDEX, "0.0.1"), false);
    expect(dashboard.shadowRoot?.querySelector(".banner")).not.toBeNull();

    const preview = await mountPreview(hassWith(INDEX, "0.0.1"), true);
    expect(preview.shadowRoot?.querySelector(".banner")).toBeNull();
  });

  it("honours autoplay on a dashboard, never in the preview", async () => {
    const dashboard = await mountPreview(hassWith(FRAMES, CARD_VERSION), false, {
      autoplay: true,
    });
    expect(playLabel(dashboard)).toBe("Pause");

    const preview = await mountPreview(hassWith(FRAMES, CARD_VERSION), true, { autoplay: true });
    expect(playLabel(preview)).toBe("Play");
  });
});
