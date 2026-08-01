// Shared render helpers + small utilities. Extracted so the
// version-banner + the WS card-version probe live in one place — the
// card stays focused on its domain rendering rather than carrying its
// own copy of the integration-upgrade plumbing.
//
// Conventions:
// - Pure functions: no `this`, take what they need as arguments,
//   return a TemplateResult or a Promise. The card keeps its own
//   reactive state (@state _versionMismatch) and calls these helpers
//   from render() / firstUpdated() / willUpdate().
// - Localisation goes through the card's translate callback so the
//   helper does not own a hidden module-level language state. Pass
//   the card's `t(key)` shortcut in as a parameter.
//
// Wire-up at the card class:
//
//     @state private _versionMismatch: string | null = null;
//
//     protected override willUpdate(changed: PropertyValues): void {
//       if (changed.has("hass") && this.hass && !this._versionChecked) {
//         this._versionChecked = true;
//         void checkCardVersionWS(
//           this.hass,
//           "skill_demo_austria/card_version",
//           CARD_VERSION,
//         ).then((v) => { this._versionMismatch = v; });
//       }
//     }
//
//     protected render(): TemplateResult {
//       return html`
//         <ha-card>
//           ${renderVersionBanner(this._versionMismatch, (k) => this._t(k))}
//           ${/* … */}
//         </ha-card>
//       `;
//     }

import { html, nothing, type TemplateResult } from "lit";

import type { HomeAssistant } from "./types";

/**
 * Probe the backend's card-version WebSocket command. Returns the
 * server-reported version when it differs from the bundled
 * CARD_VERSION (i.e. banner should appear), or null otherwise. Silent
 * on transport error — older HA installs without the handler simply
 * don't surface a mismatch, which is correct (cache-buster URL still
 * applies on next page load).
 */
export async function checkCardVersionWS(
  hass: HomeAssistant | undefined,
  type: string,
  bundleVersion: string,
): Promise<string | null> {
  if (!hass?.callWS) return null;
  try {
    const r = await hass.callWS<{ version?: string }>({ type });
    if (r?.version && r.version !== bundleVersion) return r.version;
  } catch {
    // Silent: older backend without the WS handler.
  }
  return null;
}

/**
 * Best-effort cache-storage wipe followed by a hard reload. Bare
 * ``window.location.reload()`` re-serves the cached card JS — the
 * banner returns on next mount, infinite loop. The ``caches.delete``
 * pass invalidates Lovelace's bundle cache so the reload actually
 * fetches the freshly-deployed script.
 *
 * Called from the version-banner button. Catches every error along
 * the way: cache wipe is best-effort; the reload must happen
 * regardless.
 */
export function reloadAfterCacheWipe(): void {
  try {
    window.caches?.keys?.().then((keys) => {
      keys.forEach((k) => window.caches?.delete?.(k));
    });
  } catch {
    // best-effort cache wipe
  }
  window.location.reload();
}

/**
 * Render the version-mismatch banner. Returns the lit ``nothing``
 * sentinel when there is no mismatch, so call sites can splat it
 * unconditionally into their template.
 *
 * `t` is the card's translate callback. Provide two keys in the
 * localize bundle:
 *
 *   - ``version_update``: text shown next to the reload button. May
 *     contain a ``{v}`` placeholder for the server-reported version.
 *   - ``version_reload``: button label.
 */
export function renderVersionBanner(
  mismatch: string | null,
  t: (key: string) => string,
): TemplateResult | typeof nothing {
  if (!mismatch) return nothing;
  const updateMsg = t("version_update").replace("{v}", mismatch);
  const reloadLabel = t("version_reload");
  return html`
    <div class="banner" role="alert" aria-live="assertive">
      <span>${updateMsg}</span>
      <button
        type="button"
        aria-label=${reloadLabel}
        @click=${reloadAfterCacheWipe}
      >
        ${reloadLabel}
      </button>
    </div>
  `;
}
