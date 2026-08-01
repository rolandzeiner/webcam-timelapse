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
