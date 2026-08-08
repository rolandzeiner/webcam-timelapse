import { describe, expect, it } from "vitest";

import { nightSpans } from "./sun";

const DAY = 86_400_000;

/** Wieselburg an der Erlauf, the camera this card was built around. */
const WIESELBURG = { lat: 48.13, lon: 15.14 };

/** Local wall-clock HH:MM of an epoch ms, in a named zone. */
function clock(ms: number, zone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(ms));
}

/** The one night fully inside a three-day window around `day`. */
function nightOf(day: string, lat: number, lon: number) {
  const noon = Date.parse(`${day}T12:00:00Z`);
  const spans = nightSpans(noon - DAY, noon + DAY, lat, lon);
  // The middle span is the one whose both ends are real events rather
  // than the window's own edges.
  return spans[1]!;
}

describe("nightSpans", () => {
  it("agrees with the published times for the camera's own location", () => {
    // Wieselburg, 8 August 2026: sunset 20:29, sunrise next day 05:45
    // CEST. Anything more than a minute or two out means a sign or a
    // conversion is wrong, which is the entire risk in this file.
    const night = nightOf("2026-08-08", WIESELBURG.lat, WIESELBURG.lon);
    expect(clock(night.from, "Europe/Vienna")).toBe("20:27");
    expect(clock(night.to, "Europe/Vienna")).toBe("05:46");
  });

  it("tracks the seasons", () => {
    const summer = nightOf("2026-06-21", WIESELBURG.lat, WIESELBURG.lon);
    const winter = nightOf("2026-12-21", WIESELBURG.lat, WIESELBURG.lon);

    // Shortest night of the year against the longest.
    expect(summer.to - summer.from).toBeLessThan(8.5 * 3_600_000);
    expect(winter.to - winter.from).toBeGreaterThan(15 * 3_600_000);
  });

  it("puts day and night within minutes of equal at the equinox", () => {
    const night = nightOf("2026-03-20", 51.48, 0);
    const hours = (night.to - night.from) / 3_600_000;
    // Not exactly 12: the -0.833° horizon means the sun is up slightly
    // longer than it is geometrically above the horizon.
    expect(hours).toBeGreaterThan(11.5);
    expect(hours).toBeLessThan(12.1);
  });

  it("handles the southern hemisphere", () => {
    // Sydney in August is winter — nights are the long ones there.
    const night = nightOf("2026-08-08", -33.87, 151.21);
    expect(clock(night.from, "Australia/Sydney")).toBe("17:21");
    expect(night.to - night.from).toBeGreaterThan(13 * 3_600_000);
  });

  it("returns one unbroken band through polar night", () => {
    // Tromsø in December. The merge is what matters: without it this
    // comes back as a row of day-wide rectangles with seams between
    // them, which would draw as stripes rather than as one dark stretch.
    const noon = Date.parse("2026-12-21T12:00:00Z");
    const spans = nightSpans(noon - 3 * DAY, noon + 3 * DAY, 69.65, 18.96);
    expect(spans).toHaveLength(1);
    expect(spans[0]!.from).toBe(noon - 3 * DAY);
    expect(spans[0]!.to).toBe(noon + 3 * DAY);
  });

  it("returns nothing under the midnight sun", () => {
    const noon = Date.parse("2026-06-21T12:00:00Z");
    expect(nightSpans(noon - 2 * DAY, noon + 2 * DAY, 69.65, 18.96)).toEqual(
      [],
    );
  });

  it("includes the night straddling the start of the window", () => {
    // A window opening at 02:00 is inside a night that began the evening
    // before. Walking only from the window start would miss it and shade
    // the wrong half of the chart.
    const from = Date.parse("2026-08-08T00:00:00Z"); // 02:00 CEST
    const spans = nightSpans(from, from + 6 * 3_600_000, WIESELBURG.lat, WIESELBURG.lon);
    expect(spans[0]!.from).toBe(from);
    expect(clock(spans[0]!.to, "Europe/Vienna")).toBe("05:45");
  });

  it("clips to the window it was asked about", () => {
    const from = Date.parse("2026-08-08T00:00:00Z");
    const to = from + 2 * 3_600_000;
    for (const span of nightSpans(from, to, WIESELBURG.lat, WIESELBURG.lon)) {
      expect(span.from).toBeGreaterThanOrEqual(from);
      expect(span.to).toBeLessThanOrEqual(to);
    }
  });

  it("refuses a window it cannot answer for", () => {
    const now = Date.parse("2026-08-08T00:00:00Z");
    expect(nightSpans(now, now, WIESELBURG.lat, WIESELBURG.lon)).toEqual([]);
    expect(nightSpans(now + DAY, now, WIESELBURG.lat, WIESELBURG.lon)).toEqual([]);
    expect(nightSpans(now, now + DAY, 91, 15)).toEqual([]);
    expect(nightSpans(now, now + DAY, Number.NaN, 15)).toEqual([]);
    // Wider than any archive; the loop guard rather than a real answer.
    expect(nightSpans(now, now + 900 * DAY, WIESELBURG.lat, WIESELBURG.lon)).toEqual([]);
  });
});
