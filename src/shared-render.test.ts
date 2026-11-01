/**
 * @vitest-environment happy-dom
 *
 * The integration-upgrade plumbing: the WebSocket version probe and the
 * reload banner it drives. The reload tests click the rendered button, so
 * this file needs a DOM; the rest of the suite stays in node.
 */
import { render } from "lit";
import { describe, expect, it, vi } from "vite-plus/test";

import { checkCardVersionWS, renderVersionBanner } from "./shared-render";
import type { HomeAssistant } from "./types";

function hassAnswering(callWS: () => Promise<unknown>): HomeAssistant {
  return { states: {}, callWS } as unknown as HomeAssistant;
}

describe("checkCardVersionWS", () => {
  it("reports the server version when it differs from the bundle", async () => {
    const hass = hassAnswering(async () => ({ version: "0.7.0" }));
    expect(await checkCardVersionWS(hass, "webcam_timelapse/card_version", "0.6.1")).toBe("0.7.0");
  });

  it("stays quiet when the versions match", async () => {
    const hass = hassAnswering(async () => ({ version: "0.6.1" }));
    expect(await checkCardVersionWS(hass, "webcam_timelapse/card_version", "0.6.1")).toBeNull();
  });

  it("stays quiet when the backend has no handler", async () => {
    // Older installs reject the unknown command; that is not a mismatch.
    const hass = hassAnswering(async () => {
      throw new Error("unknown_command");
    });
    expect(await checkCardVersionWS(hass, "webcam_timelapse/card_version", "0.6.1")).toBeNull();
  });

  it("stays quiet on an answer without a version", async () => {
    const hass = hassAnswering(async () => ({}));
    expect(await checkCardVersionWS(hass, "webcam_timelapse/card_version", "0.6.1")).toBeNull();
  });

  it("stays quiet without hass or a socket", async () => {
    expect(
      await checkCardVersionWS(undefined, "webcam_timelapse/card_version", "0.6.1"),
    ).toBeNull();
    expect(
      await checkCardVersionWS({ states: {} }, "webcam_timelapse/card_version", "0.6.1"),
    ).toBeNull();
  });
});

describe("the reload button", () => {
  // Started and left running, the cache deletes raced the unload and
  // usually lost, so the reload was served the same cached bundle.
  it("reloads only once the cache wipe has finished", async () => {
    const order: string[] = [];
    let finishDelete!: () => void;
    vi.stubGlobal("caches", {
      keys: async () => ["bundle"],
      delete: () =>
        new Promise<boolean>((resolve) => {
          finishDelete = () => {
            order.push("deleted");
            resolve(true);
          };
        }),
    });
    const reload = vi.spyOn(window.location, "reload").mockImplementation(() => {
      order.push("reload");
    });
    try {
      const host = document.createElement("div");
      render(
        renderVersionBanner("0.8.0", (key) => key),
        host,
      );
      host.querySelector("button")!.click();
      await new Promise((r) => setTimeout(r, 0));
      expect(order).toEqual([]);
      finishDelete();
      await new Promise((r) => setTimeout(r, 0));
      expect(order).toEqual(["deleted", "reload"]);
    } finally {
      reload.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
