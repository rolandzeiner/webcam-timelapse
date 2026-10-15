import { describe, expect, it } from "vite-plus/test";

import { checkCardVersionWS } from "./shared-render";
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
