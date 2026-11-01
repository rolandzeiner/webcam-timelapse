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
  // usually lost, so the reload was served the same cached bundle. The
  // tests run in node, so the button's click handler is taken from the
  // banner template and `window` is a stub.
  it("reloads only once the cache wipe has finished", async () => {
    const order: string[] = [];
    let finishDelete!: () => void;
    const caches = {
      keys: async () => ["bundle"],
      delete: () =>
        new Promise<boolean>((resolve) => {
          finishDelete = () => {
            order.push("deleted");
            resolve(true);
          };
        }),
    };
    const reload = vi.fn(() => {
      order.push("reload");
    });
    vi.stubGlobal("window", { caches, location: { reload } });
    try {
      const banner = renderVersionBanner("0.8.0", (key) => key);
      const onClick = (banner as { values: unknown[] }).values.find(
        (v): v is () => void => typeof v === "function",
      );
      onClick!();
      await new Promise((r) => setTimeout(r, 0));
      expect(order).toEqual([]);
      finishDelete();
      await new Promise((r) => setTimeout(r, 0));
      expect(order).toEqual(["deleted", "reload"]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
