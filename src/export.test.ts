import { describe, expect, it } from "vite-plus/test";

import {
  clampRange,
  clampSize,
  type ExportStatus,
  exportRequest,
  formatLength,
  formatSize,
  framesIn,
  fullRange,
  lastHours,
  overlayRequest,
  presetFits,
  progress,
  rangeBand,
  rangeSlots,
  READINGS_SIZE,
  TIMESTAMP_SIZE,
  toHex,
  withEnd,
  withStart,
} from "./export";
import { EMPTY_INDEX, type FrameIndex, presenceBitmap } from "./frames";
import type { WebcamTimelapseCardConfig } from "./types";

const T0 = 1_785_000_000;

/** A five-minute archive of `count` slots. */
function index(count: number, gaps: [number, number][] = []): FrameIndex {
  return { ...EMPTY_INDEX, step: 300, t0: T0, count, gaps };
}

const config = (extra: Partial<WebcamTimelapseCardConfig> = {}): WebcamTimelapseCardConfig => ({
  type: "custom:webcam-timelapse-card",
  camera_entity: "camera.greenhouse",
  ...extra,
});

/** Stands in for the browser: resolves two known inputs, echoes the rest. */
const resolve = (value: string): string =>
  ({
    "var(--wtl-accent)": "rgb(3, 169, 244)",
    "var(--warm)": "rgb(255, 152, 0)",
  })[value] ?? value;

describe("ranges", () => {
  it("covers the whole archive by default", () => {
    expect(fullRange(index(288))).toEqual({ start: 0, end: 287 });
    expect(fullRange(index(1))).toEqual({ start: 0, end: 0 });
  });

  it("has no range for an empty archive", () => {
    expect(fullRange(EMPTY_INDEX)).toBeNull();
    expect(lastHours(EMPTY_INDEX, 24)).toBeNull();
  });

  it("clamps a range into the archive and orders its ends", () => {
    expect(clampRange({ start: -5, end: 999 }, 100)).toEqual({ start: 0, end: 99 });
    expect(clampRange({ start: 80, end: 20 }, 100)).toEqual({ start: 20, end: 80 });
    expect(clampRange({ start: 3.4, end: 7.6 }, 100)).toEqual({ start: 3, end: 8 });
    expect(clampRange({ start: 5, end: 9 }, 0)).toEqual({ start: 0, end: 0 });
  });

  it("moves one end at a time", () => {
    const range = { start: 10, end: 50 };
    expect(withStart(range, 20, 100)).toEqual({ start: 20, end: 50 });
    expect(withEnd(range, 40, 100)).toEqual({ start: 10, end: 40 });
  });

  it("does not swap the ends when one is marked past the other", () => {
    // Pressing "start here" beyond the end must leave a start there. A
    // swap would hand back a range that looks deliberate and is the
    // opposite of what was pressed.
    expect(withStart({ start: 10, end: 50 }, 70, 100)).toEqual({ start: 70, end: 70 });
    expect(withEnd({ start: 10, end: 50 }, 4, 100)).toEqual({ start: 4, end: 4 });
  });

  it("keeps a marked end inside the archive", () => {
    expect(withStart({ start: 0, end: 50 }, -3, 100)).toEqual({ start: 0, end: 50 });
    expect(withEnd({ start: 0, end: 50 }, 400, 100)).toEqual({ start: 0, end: 99 });
  });

  it("selects the last N hours, ending on the newest frame", () => {
    // Twelve five-minute slots to the hour.
    expect(lastHours(index(1000), 24)).toEqual({ start: 999 - 288, end: 999 });
    // An archive shorter than the preset is simply all of it.
    expect(lastHours(index(100), 24)).toEqual({ start: 0, end: 99 });
  });

  it("only offers a preset the archive is longer than", () => {
    expect(presetFits(index(289), 24)).toBe(true);
    expect(presetFits(index(288), 24)).toBe(false);
    expect(presetFits(index(100), 24)).toBe(false);
  });

  it("converts a range to the slots the integration is asked for", () => {
    expect(rangeSlots(index(100), { start: 2, end: 10 })).toEqual({
      start: T0 + 600,
      end: T0 + 3000,
    });
    expect(rangeSlots(index(100), { start: 2, end: 100 })).toBeNull();
    expect(rangeSlots(EMPTY_INDEX, { start: 0, end: 0 })).toBeNull();
  });

  it("places the range on the scrubber", () => {
    expect(rangeBand({ start: 0, end: 99 }, 100)).toEqual({ left: 0, width: 100 });
    const band = rangeBand({ start: 25, end: 75 }, 101);
    expect(band.left).toBeCloseTo(25);
    expect(band.width).toBeCloseTo(50);
    // A one-frame archive must not divide by zero.
    expect(rangeBand({ start: 0, end: 0 }, 1)).toEqual({ left: 0, width: 0 });
  });
});

describe("frame count", () => {
  it("counts only the frames that exist", () => {
    // Gaps are skipped in the video, so the promised length has to come
    // from what is on disk and not from the width of the selection.
    const present = presenceBitmap(index(20, [[5, 10]]));
    expect(framesIn(present, { start: 0, end: 19 })).toBe(10);
    expect(framesIn(present, { start: 0, end: 4 })).toBe(5);
    expect(framesIn(present, { start: 5, end: 14 })).toBe(0);
    expect(framesIn(present, { start: 14, end: 15 })).toBe(1);
  });

  it("tolerates a range that overruns the bitmap", () => {
    const present = presenceBitmap(index(4));
    expect(framesIn(present, { start: -2, end: 50 })).toBe(4);
    expect(framesIn(new Uint8Array(0), { start: 0, end: 5 })).toBe(0);
  });
});

describe("formatting", () => {
  it("writes a running time the way it would be said", () => {
    expect(formatLength(0)).toBe("0 s");
    expect(formatLength(Number.NaN)).toBe("0 s");
    // Short clips keep a decimal: 1 s and 2 s would hide a factor of two.
    expect(formatLength(1.25)).toBe("1.3 s");
    expect(formatLength(9.96)).toBe("10 s");
    expect(formatLength(12)).toBe("12 s");
    expect(formatLength(59.4)).toBe("59 s");
    expect(formatLength(65)).toBe("1:05 min");
    expect(formatLength(168)).toBe("2:48 min");
    expect(formatLength(3723)).toBe("1:02:03 h");
  });

  it("writes a file size in a sensible unit", () => {
    expect(formatSize(0)).toBe("0 MB");
    expect(formatSize(2_700_000)).toBe("2.7 MB");
    expect(formatSize(11_300_000)).toBe("11 MB");
    expect(formatSize(1_530_000_000)).toBe("1.5 GB");
  });

  it("turns a computed colour into hex", () => {
    expect(toHex("rgb(3, 169, 244)")).toBe("#03a9f4");
    expect(toHex("rgba(255, 152, 0, 0.5)")).toBe("#ff9800");
    expect(toHex("rgb(255 152 0)")).toBe("#ff9800");
    expect(toHex("  rgb(0, 0, 0) ")).toBe("#000000");
  });

  it("passes on what it cannot read, for the server to fall back on", () => {
    expect(toHex("color(display-p3 1 0.5 0)")).toBe("color(display-p3 1 0.5 0)");
    expect(toHex("#ff9800")).toBe("#ff9800");
    expect(toHex("")).toBe("");
  });
});

describe("sizes", () => {
  it("defaults the readings to under a third of the picture", () => {
    expect(READINGS_SIZE.default).toBe(30);
    expect(TIMESTAMP_SIZE.default).toBe(15);
  });

  it("clamps and rounds a size", () => {
    expect(clampSize(30, READINGS_SIZE)).toBe(30);
    expect(clampSize(42.4, READINGS_SIZE)).toBe(42);
    expect(clampSize(1, READINGS_SIZE)).toBe(10);
    expect(clampSize(500, TIMESTAMP_SIZE)).toBe(50);
    expect(clampSize(Number.NaN, TIMESTAMP_SIZE)).toBe(15);
  });
});

describe("progress", () => {
  const status = (done: number, total: number): ExportStatus => ({
    state: "running",
    done,
    total,
    error: null,
    message: null,
    result: null,
  });

  it("is zero until the frames have been counted", () => {
    expect(progress(null)).toBe(0);
    expect(progress(status(0, 0))).toBe(0);
  });

  it("is the share of frames done, never out of range", () => {
    expect(progress(status(72, 288))).toBe(0.25);
    expect(progress(status(288, 288))).toBe(1);
    expect(progress(status(300, 288))).toBe(1);
  });
});

describe("request", () => {
  const choices = {
    fps: 24,
    timestamp: true,
    timestampSize: 15,
    readings: true,
    readingsSize: 30,
    positions: {},
  };

  it("sends no overlay for a card with no readings", () => {
    expect(overlayRequest(config(), resolve)).toBeNull();
    expect(overlayRequest(config({ entities: [], entities_left: [] }), resolve)).toBeNull();
  });

  it("describes the readings in the card's own config shape", () => {
    const overlay = overlayRequest(
      config({
        overlay_title: "Greenhouse",
        graph_hours: 12,
        show_sun: true,
        entities: [
          { entity: "sensor.co2", graph: true, show_icon: true },
          { entity: "sensor.temp", color: "var(--warm)", decimals: 1 },
        ],
        entities_left: [{ entity: "sensor.rh", color: "#4caf50" }],
      }),
      resolve,
    );

    expect(overlay).toEqual({
      entities: [
        { entity: "sensor.co2", graph: true, show_icon: true },
        // Resolved by the browser: only it can read a CSS variable.
        { entity: "sensor.temp", color: "#ff9800", decimals: 1 },
      ],
      entities_left: [{ entity: "sensor.rh", color: "#4caf50" }],
      overlay_title: "Greenhouse",
      overlay_title_left: "",
      graph_hours: 12,
      show_graph: true,
      show_sun: true,
      accent_color: "#03a9f4",
    });
  });

  it("carries the card's show_graph switch", () => {
    const overlay = overlayRequest(
      config({ show_graph: false, entities: [{ entity: "sensor.co2", graph: true }] }),
      resolve,
    );
    expect(overlay?.show_graph).toBe(false);
  });

  it("builds the whole start message", () => {
    const request = exportRequest(
      config({ deflicker: 35, entities: [{ entity: "sensor.co2" }] }),
      index(100),
      { start: 10, end: 20 },
      choices,
      "de",
      resolve,
    );

    expect(request).toMatchObject({
      entity_id: "camera.greenhouse",
      start: T0 + 3000,
      end: T0 + 6000,
      fps: 24,
      deflicker: 35,
      timestamp: true,
      language: "de",
    });
    expect(request?.overlay).not.toBeNull();
  });

  it("leaves the readings out when they are switched off", () => {
    const request = exportRequest(
      config({ entities: [{ entity: "sensor.co2" }] }),
      index(100),
      { start: 0, end: 99 },
      { ...choices, fps: 30, timestamp: false, readings: false },
      "en",
      resolve,
    );

    expect(request?.overlay).toBeNull();
    expect(request?.timestamp).toBe(false);
    expect(request?.fps).toBe(30);
  });

  it("keeps deflicker inside what the integration accepts", () => {
    const at = (deflicker: number | undefined): unknown =>
      exportRequest(
        config(deflicker === undefined ? {} : { deflicker }),
        index(10),
        { start: 0, end: 9 },
        choices,
        "en",
        resolve,
      )?.deflicker;

    expect(at(undefined)).toBe(0);
    expect(at(250)).toBe(100);
    expect(at(-5)).toBe(0);
    expect(at(42.6)).toBe(43);
  });

  it("asks for the sizes chosen, and the card's own sides by default", () => {
    const request = exportRequest(
      config({ entities: [{ entity: "sensor.co2" }] }),
      index(10),
      { start: 0, end: 9 },
      choices,
      "en",
      resolve,
    );

    expect(request).toMatchObject({
      timestamp_size: 15,
      readings_size: 30,
      // null, not a side: the integration then uses the card's placement.
      readings_position: null,
      readings_position_left: null,
    });
  });

  it("sends a position per block", () => {
    const request = exportRequest(
      config({ entities: [{ entity: "sensor.co2" }] }),
      index(10),
      { start: 0, end: 9 },
      { ...choices, positions: { right: "top", left: "bottom" } },
      "en",
      resolve,
    );

    expect(request?.readings_position).toBe("top");
    expect(request?.readings_position_left).toBe("bottom");
  });

  it("keeps the sizes inside what the integration accepts", () => {
    const request = exportRequest(
      config(),
      index(10),
      { start: 0, end: 9 },
      { ...choices, timestampSize: 2, readingsSize: 99.6 },
      "en",
      resolve,
    );

    expect(request?.timestamp_size).toBe(TIMESTAMP_SIZE.min);
    expect(request?.readings_size).toBe(READINGS_SIZE.max);
  });

  it("has nothing to send for a range outside the archive", () => {
    expect(
      exportRequest(config(), EMPTY_INDEX, { start: 0, end: 0 }, choices, "en", resolve),
    ).toBeNull();
  });
});
