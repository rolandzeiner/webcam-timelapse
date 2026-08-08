/**
 * Small shared utilities.
 */

/**
 * Allow only URLs this card is willing to put in an `<img src>`.
 *
 * `entity_picture` comes from `hass`, which is trusted — but it is still
 * a value crossing into a DOM sink, and the cost of gating it is one
 * function. Same-origin absolute paths and https are permitted; anything
 * else (notably `javascript:` and `data:`) is refused.
 */
export function safeImageUri(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const value = raw.trim();
  if (value.startsWith("/")) return value;
  if (value.startsWith("https://")) return value;
  return undefined;
}

/**
 * How far a gauge moved, for the sparkline's caption.
 *
 * Two significant digits, in the sensor's own unit — enough to tell 9 mm
 * from 90 mm, and not enough to imply a precision the gauge does not
 * have. No unit conversion: the card cannot know that 0.009 m would read
 * better as 9 mm without assuming a domain, and guessing wrong on someone
 * else's sensor is worse than a leading zero.
 */
export function formatExtent(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 100) return Math.round(value).toString();
  const text = value.toPrecision(2);
  // Only ever strip inside a decimal — "40" must not become "4".
  return text.includes(".")
    ? text.replace(/0+$/, "").replace(/\.$/, "")
    : text;
}

/**
 * A graph window as a short duration.
 *
 * min / h / d are the international unit symbols and read the same in
 * both shipped locales, so they stay out of the translation files.
 */
export function formatSpan(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} d`;
}

/**
 * Whether the viewer has asked the OS to reduce motion.
 *
 * Read at the moment it is needed rather than cached, so toggling the
 * system setting takes effect without reloading the dashboard.
 * Defaults to false where matchMedia is unavailable (jsdom).
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
