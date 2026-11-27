// @vitest-environment happy-dom

/**
 * The finished export plays inside the card.
 *
 * A link to the video, opened in a new tab, is fine in a desktop
 * browser; a wall tablet's kiosk WebView opens it in place of the whole
 * dashboard, and a raw MP4 page has no way back. So Watch is a button
 * that plays the video over the stage, and Download is a plain download
 * link with no target.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import "./webcam-timelapse-card";
import { CARD_TAG, CARD_VERSION, WS_CARD_VERSION, WS_INDEX, WS_RESOLVE_MEDIA } from "./const";
import type { ExportStatus } from "./export";
import type { FrameIndex } from "./frames";
import type { HomeAssistant } from "./types";

type Card = HTMLElement & {
  hass: HomeAssistant;
  setConfig: (c: unknown) => void;
  updateComplete: Promise<unknown>;
};

const SLOT = 1_785_585_600;
const URL_SIGNED = "/media/local/webcam_timelapse/garden/garden.mp4?authSig=x";

const INDEX: FrameIndex = {
  base: "/api/webcam_timelapse/frames/x/",
  ext: ".webp",
  step: 60,
  t0: SLOT,
  count: 2,
  gaps: [],
  retention_days: 14,
  online: true,
  newest_slot: SLOT + 60,
};

const DONE: ExportStatus = {
  state: "done",
  done: 2,
  total: 2,
  error: null,
  message: null,
  result: {
    path: "/media/webcam_timelapse/garden/garden.mp4",
    file_name: "garden.mp4",
    media_content_id: "media-source://media_source/local/webcam_timelapse/garden/garden.mp4",
    frames: 2,
    skipped: 0,
    fps: 24,
    duration: 1,
    width: 1600,
    height: 1200,
    size_bytes: 1000,
    start: SLOT,
    end: SLOT + 60,
  },
};

function hass(): HomeAssistant {
  const callWS = vi.fn((msg: { type: string }) =>
    Promise.resolve(
      msg.type === WS_INDEX
        ? INDEX
        : msg.type === WS_CARD_VERSION
          ? { version: CARD_VERSION }
          : msg.type === WS_RESOLVE_MEDIA
            ? { url: URL_SIGNED }
            : { luma: [] },
    ),
  );
  return {
    states: { "camera.garden": { entity_id: "camera.garden", state: "idle", attributes: {} } },
    locale: { language: "en" },
    callWS,
    fetchWithAuth: () => Promise.resolve(new Response(new Blob(["webp"]))),
    connection: {
      subscribeMessage: (callback: (status: ExportStatus) => void) => {
        callback(DONE);
        return Promise.resolve(() => undefined);
      },
    },
  } as unknown as HomeAssistant;
}

const root = (el: Card): ShadowRoot => el.shadowRoot!;

/** Mount with frames, open the export panel, wait for the finished video. */
async function finishedExport(): Promise<Card> {
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:frame");
  const el = document.createElement(CARD_TAG) as Card;
  el.setConfig({ type: `custom:${CARD_TAG}`, camera_entity: "camera.garden", autoplay: false });
  el.hass = hass();
  document.body.appendChild(el);
  await vi.waitFor(() => expect(root(el).querySelector(".controls")).not.toBeNull());
  const toggle = Array.from(root(el).querySelectorAll<HTMLElement>(".controls ha-icon-button")).at(
    -1,
  )!;
  toggle.click();
  await vi.waitFor(() => expect(root(el).querySelector(".export-watch")).not.toBeNull());
  return el;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the finished export", () => {
  it("offers Watch as a button, not a link that leaves the dashboard", async () => {
    const el = await finishedExport();
    const watch = root(el).querySelector(".export-watch")!;
    expect(watch.tagName).toBe("BUTTON");
    expect(watch.hasAttribute("href")).toBe(false);
  });

  it("downloads without opening a new window", async () => {
    const el = await finishedExport();
    const download = root(el).querySelector<HTMLAnchorElement>(".export-download")!;
    expect(download.getAttribute("href")).toBe(URL_SIGNED);
    expect(download.getAttribute("download")).toBe("garden.mp4");
    expect(download.hasAttribute("target")).toBe(false);
  });

  it("plays over the stage and closes with the button", async () => {
    const el = await finishedExport();
    root(el).querySelector<HTMLButtonElement>(".export-watch")!.click();
    await el.updateComplete;

    const video = root(el).querySelector<HTMLVideoElement>(".stage .player video");
    expect(video?.getAttribute("src")).toBe(URL_SIGNED);
    expect(video?.hasAttribute("controls")).toBe(true);
    expect(video?.hasAttribute("playsinline")).toBe(true);

    root(el).querySelector<HTMLElement>(".player-close")!.click();
    await el.updateComplete;
    expect(root(el).querySelector(".player")).toBeNull();
  });

  it("closes on Escape", async () => {
    const el = await finishedExport();
    root(el).querySelector<HTMLButtonElement>(".export-watch")!.click();
    await el.updateComplete;

    root(el)
      .querySelector(".player")!
      .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await el.updateComplete;
    expect(root(el).querySelector(".player")).toBeNull();
  });

  it("does not open the camera dialog when the video is tapped", async () => {
    const el = await finishedExport();
    root(el).querySelector<HTMLButtonElement>(".export-watch")!.click();
    await el.updateComplete;

    const moreInfo = vi.fn();
    el.addEventListener("hass-more-info", moreInfo);
    root(el).querySelector<HTMLVideoElement>(".player video")!.click();
    expect(moreInfo).not.toHaveBeenCalled();
  });

  it("closes with the export panel", async () => {
    const el = await finishedExport();
    root(el).querySelector<HTMLButtonElement>(".export-watch")!.click();
    await el.updateComplete;

    Array.from(root(el).querySelectorAll<HTMLElement>(".controls ha-icon-button")).at(-1)!.click();
    await el.updateComplete;
    expect(root(el).querySelector(".player")).toBeNull();
  });
});
