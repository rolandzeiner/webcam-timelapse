// @vitest-environment happy-dom

/**
 * What the card renders around the picture: the fixed-height class a
 * sections cell with a set number of rows gets, and the warnings for an
 * entity that is not in hass.states. Layout itself needs a browser
 * (scripts/card-layout-audit.mjs in the spanish-breakfast skill); this
 * checks the mechanism those layouts rest on.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import "./webcam-timelapse-card";
import { CARD_TAG, CARD_VERSION, WS_CARD_VERSION, WS_INDEX } from "./const";
import type { FrameIndex } from "./frames";
import type { HomeAssistant, WebcamTimelapseCardConfig } from "./types";

type Card = HTMLElement & {
  hass: HomeAssistant;
  layout?: string;
  setConfig: (c: unknown) => void;
  updateComplete: Promise<unknown>;
};

const INDEX: FrameIndex = {
  base: "/api/webcam_timelapse/frames/x",
  ext: ".webp",
  step: 60,
  t0: null,
  count: 0,
  gaps: [],
  retention_days: 14,
  online: true,
  newest_slot: null,
};

function hass(states: string[]): HomeAssistant {
  const callWS = vi.fn((msg: { type: string }) =>
    Promise.resolve(
      msg.type === WS_INDEX
        ? INDEX
        : msg.type === WS_CARD_VERSION
          ? { version: CARD_VERSION }
          : { luma: [] },
    ),
  );
  return {
    states: Object.fromEntries(
      states.map((id) => [id, { entity_id: id, state: "idle", attributes: {} }]),
    ),
    locale: { language: "en" },
    callWS,
  } as unknown as HomeAssistant;
}

async function mount(
  h: HomeAssistant,
  config: Partial<WebcamTimelapseCardConfig> = {},
  layout?: string,
): Promise<Card> {
  const el = document.createElement(CARD_TAG) as Card;
  el.setConfig({ type: `custom:${CARD_TAG}`, camera_entity: "camera.garden", ...config });
  if (layout) el.layout = layout;
  el.hass = h;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const card = (el: Card): HTMLElement => el.shadowRoot!.querySelector("ha-card")!;

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the fixed-height class", () => {
  it("is set in a sections cell whose rows are stored as a number", async () => {
    const el = await mount(hass(["camera.garden"]), { grid_options: { rows: 6 } }, "grid");
    expect(card(el).classList.contains("fixed-height")).toBe(true);
  });

  it("is not set while the rows are auto, the card's own default", async () => {
    const el = await mount(hass(["camera.garden"]), {}, "grid");
    expect(card(el).classList.contains("fixed-height")).toBe(false);
  });

  it("is not set outside a sections cell, whatever is stored", async () => {
    const el = await mount(hass(["camera.garden"]), { grid_options: { rows: 6 } });
    expect(card(el).classList.contains("fixed-height")).toBe(false);
  });
});
