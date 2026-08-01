import * as en from './languages/en.json';
import * as de from './languages/de.json';

const languages: Record<string, Record<string, unknown>> = {
  en: en,
  de: de,
};

function resolveTranslation(path: string, dictionary: Record<string, unknown>): string | undefined {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }

    return undefined;
  }, dictionary);

  return typeof value === 'string' ? value : undefined;
}

/**
 * Translate a dot-path key. Pass `hass.locale?.language` (or
 * `hass.language` on older HA versions) as `lang` so the helper picks
 * up language changes without a page reload.
 *
 * The legacy `localStorage.getItem('selectedLanguage')` source HA used
 * pre-2024 is NOT reactive — switching language in the user-profile
 * panel won't refresh the card until the next reload. `hass.locale.language`
 * is a reactive property, so cards re-render automatically when it changes.
 *
 * Pure-string-in / string-out: the language source is the caller's
 * responsibility, so this module has no DOM or hass dependency and is
 * trivially testable.
 */
export function localize(
  string: string,
  lang: string | undefined = undefined,
  search = '',
  replace = '',
): string {
  // Normalise: HA uses BCP-47 ('en-GB', 'de-AT'); our dictionaries are
  // keyed by ISO-639-1 lowercase ('en', 'de'). Strip the region.
  const code = (lang ?? 'en').toLowerCase().split(/[-_]/)[0] ?? 'en';

  // noUncheckedIndexedAccess narrows languages[k] to T | undefined; coerce
  // to the always-present `en` fallback at each lookup so resolveTranslation
  // sees a real Record, not Record | undefined.
  const dict = languages[code] ?? languages.en ?? {};
  const enDict = languages.en ?? {};
  let translated = resolveTranslation(string, dict);

  if (translated === undefined) translated = resolveTranslation(string, enDict);
  if (translated === undefined) translated = string;

  if (search !== '' && replace !== '') {
    translated = translated.replace(search, replace);
  }
  return translated;
}
