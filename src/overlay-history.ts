/**
 * Recorder history for the time-synced overlay.
 *
 * The point of the overlay is that scrubbing to 03:40 last Tuesday shows
 * the reading *at that moment*, not the current one. That requires the
 * recorder's history, resolved per playhead position.
 *
 * Adapted from tankstellen-austria's `history.ts`; the differences are
 * deliberate and listed at each one.
 */

import type { HomeAssistant } from "./types";

export interface HistoryPoint {
  /** Epoch milliseconds. */
  at: number;
  value: number;
}

export interface ResolvedReading {
  value: number;
  /** When the reading was actually taken. */
  at: number;
  /** True when the reading is older than the caller's tolerance. */
  stale: boolean;
}

/**
 * Minimal-response entries from HA's history WS API.
 *
 * `lu` is last_updated as either unix-seconds or an ISO string depending
 * on HA version, `s` is the state. Both shapes are normalised — indexing
 * one directly is a live footgun across HA upgrades.
 */
interface RawHistoryEntry {
  lu?: number | string;
  last_updated?: string;
  last_changed?: string;
  s?: string | number;
  state?: string | number;
  a?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
}

/** States that carry no measurement and must never be plotted as zero. */
const NON_VALUES = new Set(["unknown", "unavailable", "none", ""]);

const cache = new Map<string, HistoryPoint[]>();
const inflight = new Map<string, Promise<Map<string, HistoryPoint[]>>>();

function parseTime(entry: RawHistoryEntry): number {
  if (typeof entry.lu === "number") return Math.round(entry.lu * 1000);
  const raw = entry.lu ?? entry.last_updated ?? entry.last_changed;
  return raw ? new Date(raw).getTime() : 0;
}

function parseAttributeTime(
  entry: RawHistoryEntry,
  attribute: string,
): number | null {
  const attrs = entry.a ?? entry.attributes;
  const raw = attrs?.[attribute];
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const parsed = new Date(raw).getTime();
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export interface OverlayHistoryOptions {
  days: number;
  /**
   * Entities whose real measurement time lives in a state attribute
   * rather than in `last_changed`.
   *
   * Off by default, and deliberately opt-in per entity: a generic card
   * cannot assume any attribute exists on an entity the user chose, and
   * requesting attributes turns a ~20 KB history payload into ~500 KB.
   * The Kleine Erlauf gauges are the motivating case — their Node-RED
   * feed publishes a `timestamp` attribute that lags `last_changed` by
   * about ten minutes.
   */
  timeAttributes?: Record<string, string>;
}

/**
 * Fetch history for several entities in one call.
 *
 * Batched rather than per-entity: an overlay with three gauges over
 * fourteen days is one round trip, not three, and the card mounts on a
 * tablet where each round trip is visible.
 */
export async function fetchOverlayHistory(
  hass: HomeAssistant,
  entityIds: string[],
  options: OverlayHistoryOptions,
): Promise<Map<string, HistoryPoint[]>> {
  const callWS = hass?.callWS?.bind(hass);
  if (!callWS || entityIds.length === 0) return new Map();

  const timeAttributes = options.timeAttributes ?? {};
  const key = `${entityIds.slice().sort().join(",")}|${options.days}`;

  // Coalesce concurrent fetches: `hass` updates arrive back-to-back and
  // would otherwise fire duplicate requests for the same window.
  const existing = inflight.get(key);
  if (existing) return existing;

  const end = new Date();
  const start = new Date(end.getTime() - options.days * 86400_000);
  const wantsAttributes = Object.keys(timeAttributes).length > 0;

  const promise = (async (): Promise<Map<string, HistoryPoint[]>> => {
    try {
      const result = await callWS<Record<string, RawHistoryEntry[]>>({
        type: "history/history_during_period",
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        entity_ids: entityIds,
        minimal_response: true,
        no_attributes: !wantsAttributes,
        significant_changes_only: true,
      });

      const out = new Map<string, HistoryPoint[]>();
      for (const entityId of entityIds) {
        const attribute = timeAttributes[entityId];
        const points = (result?.[entityId] ?? [])
          .map((entry): HistoryPoint => {
            const raw = String(entry.s ?? entry.state ?? "").trim();
            const value = NON_VALUES.has(raw.toLowerCase())
              ? Number.NaN
              : parseFloat(raw);
            const at =
              (attribute ? parseAttributeTime(entry, attribute) : null) ??
              parseTime(entry);
            return { at, value };
          })
          // `unknown` / `unavailable` are filtered rather than coerced.
          // They appear on every HA restart, and letting them through
          // would blank the overlay at exactly those moments.
          .filter((p) => Number.isFinite(p.value) && p.at > 0)
          .sort((a, b) => a.at - b.at);
        out.set(entityId, points);
        cache.set(entityId, points);
      }
      return out;
    } catch {
      // Serve the last good data rather than blanking the overlay on a
      // transient failure; the next refresh retries.
      return new Map(entityIds.map((id) => [id, cache.get(id) ?? []]));
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

/**
 * The reading in effect at `at`.
 *
 * Step / hold-last-known, never interpolated. These are discrete
 * measurements from a station: drawing a smooth ramp between two hourly
 * readings would invent a value that was never measured and present it
 * with the same authority as a real one. The numeric readout must always
 * be something the sensor actually reported.
 *
 * Returns null before the first reading in the window — an honest "no
 * data yet" rather than back-projecting the earliest value.
 */
export function resolveAt(
  points: HistoryPoint[],
  at: number,
  maxAgeMs: number,
): ResolvedReading | null {
  if (points.length === 0) return null;

  // Binary search for the last point at or before `at`.
  let low = 0;
  let high = points.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (points[mid]!.at <= at) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  if (found === -1) return null;

  const point = points[found]!;
  return { value: point.value, at: point.at, stale: at - point.at > maxAgeMs };
}

/**
 * A staleness threshold derived from the entity's own cadence.
 *
 * Hard-coding one would be wrong in both directions: a gauge that reports
 * hourly is not stale at 40 minutes, and a sensor that reports every
 * minute very much is. Twice the median observed interval, floored so a
 * sparse series does not flag everything.
 */
export function stalenessThreshold(points: HistoryPoint[], floorMs = 5_400_000): number {
  if (points.length < 3) return floorMs;
  const deltas: number[] = [];
  for (let i = 1; i < points.length; i++) {
    deltas.push(points[i]!.at - points[i - 1]!.at);
  }
  deltas.sort((a, b) => a - b);
  const median = deltas[deltas.length >> 1] ?? floorMs;
  return Math.max(median * 2, floorMs);
}

/**
 * Points inside a window centred on `at`, for the sparkline — plus the
 * reading already in effect when the window opens.
 *
 * That anchor carries more weight than it looks. The series is step /
 * hold-last-known and the recorder stores only *changes*, so a slow gauge
 * can cross an entire window without a single row while still having a
 * perfectly well-defined value throughout it. Without an anchor those
 * windows come back empty and the graph disappears, which reads as "the
 * sensor is broken" when the truth is "the sensor is steady". The
 * groundwater gauge is the motivating case: it moves a few millimetres a
 * day, so twenty-four hours of it is routinely zero rows.
 *
 * The anchor is clamped to the window start rather than kept at its real
 * timestamp. It is not a measurement — it is the value that was already
 * in effect at `from`, which is the same hold-last-known rule `resolveAt`
 * applies. Keeping the true time would also push it off-canvas, since the
 * sparkline scales x to the window.
 */
export function windowAround(
  points: HistoryPoint[],
  at: number,
  hours: number,
): HistoryPoint[] {
  const half = (hours * 3_600_000) / 2;
  const from = at - half;
  const to = at + half;

  const inside = points.filter((p) => p.at >= from && p.at <= to);

  // A reading landing exactly on the window start already says what was
  // in effect there; an anchor at the same instant would only stack a
  // second point on the same x.
  if (inside[0]?.at === from) return inside;

  // `points` is sorted ascending, so the last entry before the window is
  // the reading still standing when it opens.
  let anchor: HistoryPoint | undefined;
  for (const point of points) {
    if (point.at >= from) break;
    anchor = point;
  }

  return anchor ? [{ at: from, value: anchor.value }, ...inside] : inside;
}
