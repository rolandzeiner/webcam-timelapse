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

function hass(states: string[], language = "en", index: FrameIndex = INDEX): HomeAssistant {
  const callWS = vi.fn((msg: { type: string }) =>
    Promise.resolve(
      msg.type === WS_INDEX
        ? index
        : msg.type === WS_CARD_VERSION
          ? { version: CARD_VERSION }
          : { luma: [] },
    ),
  );
  return {
    states: Object.fromEntries(
      states.map((id) => [id, { entity_id: id, state: "idle", attributes: {} }]),
    ),
    locale: { language },
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

describe("the missing-entity warning", () => {
  const alerts = (el: Card): HTMLElement[] =>
    Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('ha-alert[alert-type="warning"]'));

  it("replaces the stage when the camera is not in hass.states", async () => {
    const el = await mount(hass([]));
    expect(el.shadowRoot!.querySelector(".stage")).toBeNull();
    expect(alerts(el)).toHaveLength(1);
    expect(alerts(el)[0]!.textContent).toContain("Entity not available: camera.garden");
  });

  it("speaks the user's language", async () => {
    const el = await mount(hass([], "de"));
    expect(alerts(el)[0]!.textContent).toContain("Entität nicht verfügbar: camera.garden");
  });

  it("keeps the stage and lists every missing readout entity under it", async () => {
    const el = await mount(hass(["camera.garden"]), {
      entities: [{ entity: "sensor.temp" }, { entity: "sensor.hum" }, { entity: "sensor.temp" }],
    });
    expect(el.shadowRoot!.querySelector(".stage")).not.toBeNull();
    expect(alerts(el)).toHaveLength(1);
    expect(alerts(el)[0]!.textContent).toContain("Entity not available: sensor.temp, sensor.hum");
    const stage = el.shadowRoot!.querySelector(".stage")!;
    expect(
      stage.compareDocumentPosition(alerts(el)[0]!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("stays silent while every entity is present", async () => {
    const el = await mount(hass(["camera.garden", "sensor.temp"]), {
      entities: [{ entity: "sensor.temp" }],
    });
    expect(alerts(el)).toHaveLength(0);
  });
});

describe("archived frames", () => {
  it("are fetched with the user's token and shown as object URLs", async () => {
    // The frame view requires authentication and an <img> cannot send a
    // token, so a bare path on a layer would only ever load a 401.
    const slot = 1_785_585_600;
    const h = hass(["camera.garden"], "en", {
      ...INDEX,
      base: "/api/webcam_timelapse/frames/x/",
      t0: slot,
      count: 1,
    });
    const fetchWithAuth = vi.fn(() => Promise.resolve(new Response(new Blob(["webp"]))));
    h.fetchWithAuth = fetchWithAuth;
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:frame");

    const el = await mount(h);

    await vi.waitFor(() => {
      const layers = Array.from(el.shadowRoot!.querySelectorAll<HTMLImageElement>("img.layer"));
      expect(layers.some((img) => img.src === "blob:frame")).toBe(true);
    });
    expect(fetchWithAuth).toHaveBeenCalledWith(`/api/webcam_timelapse/frames/x/${slot}.webp`);
  });
});
