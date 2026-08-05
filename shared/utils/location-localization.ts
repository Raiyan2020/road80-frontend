import { getLang } from '@/i18n';

type NamedRecord = { id: number; name: string };
type CountryRecord = NamedRecord & { country_code: string };

const ENGLISH_COUNTRY_NAMES: Record<string, string> = {
  KW: 'Kuwait',
  BH: 'Bahrain',
  AE: 'United Arab Emirates',
  SY: 'Syria',
  LB: 'Lebanon',
  SA: 'Saudi Arabia',
  QA: 'Qatar',
  IQ: 'Iraq',
  UK: 'United Kingdom',
  JO: 'Jordan',
  USA: 'United States',
};

/** Exact English names for non-place concepts that should not be transliterated. */
const ENGLISH_LOCATION_NAMES: Record<number, string> = {
  7: 'Capital Governorate',
};

const ARABIC_CHAR_TO_LATIN: Record<string, string> = {
  'ء': "'", 'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa', 'ب': 'b', 'ة': 'a',
  'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
  'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't',
  'ظ': 'z', 'ع': "'", 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l',
  'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ؤ': 'w', 'ي': 'y', 'ى': 'a', 'ئ': 'y',
};

const ARABIC_RE = /[\u0600-\u06ff]/;
const DIACRITICS_RE = /[\u064b-\u065f\u0670\u06d6-\u06edـ]/g;

/**
 * Last-resort place-name transliteration for location rows whose English name
 * is missing in the API. Place names are transliterated rather than translated,
 * which keeps them recognizable while preventing Arabic-only options in EN UI.
 */
function transliterateArabicPlaceName(value: string): string {
  const latin = value
    .replace(DIACRITICS_RE, '')
    .split('')
    .map((char) => ARABIC_CHAR_TO_LATIN[char] ?? char)
    .join('')
    .replace(/\bal/g, 'al-')
    .replace(/\s+/g, ' ')
    .trim();

  return latin.replace(/(^|\s|-)([a-z])/g, (_, prefix: string, letter: string) =>
    `${prefix}${letter.toUpperCase()}`
  );
}

export function localizeCountries<T extends CountryRecord>(countries: T[]): T[] {
  if (getLang() !== 'en') return countries;
  return countries.map((country) => ({
    ...country,
    name: ENGLISH_COUNTRY_NAMES[country.country_code] ||
      (ARABIC_RE.test(country.name) ? transliterateArabicPlaceName(country.name) : country.name),
  }));
}

function localizeNamedRecords<T extends NamedRecord>(
  locations: T[],
  overrides: Record<number, string> = {},
): T[] {
  if (getLang() !== 'en') return locations;
  return locations.map((location) => ({
    ...location,
    name: overrides[location.id] ||
      (ARABIC_RE.test(location.name) ? transliterateArabicPlaceName(location.name) : location.name),
  }));
}

export const localizeStates = <T extends NamedRecord>(states: T[]): T[] =>
  localizeNamedRecords(states, ENGLISH_LOCATION_NAMES);

export const localizeCities = <T extends NamedRecord>(cities: T[]): T[] =>
  localizeNamedRecords(cities);
