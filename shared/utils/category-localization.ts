/**
 * Rendering API categories in the active language.
 *
 * `/categories` and `/home/categories-appear-in-filter` return a single `name` /
 * `value` string per row and no `*_ar` / `*_en` pair, so `pickLocalized` can't
 * help. The backend is supposed to honour the `Accept-Language` header we send
 * from `lib/api-client.ts`, but it answers in Arabic regardless — which leaves
 * Arabic category names sitting inside an otherwise-English UI.
 *
 * These helpers translate at DISPLAY time and deliberately do NOT return
 * localized copies of the category objects, unlike `location-localization.ts`.
 * `ExplorePage`'s client-side filter matches selected `value` strings against
 * listing text (components/ExplorePage.tsx:104-137); rewriting `value` in the
 * data would make every English-language filter match zero listings. Localize
 * where you render, never where you match — matching belongs to
 * `shared/utils/category-match.ts`.
 *
 * Unknown categories fall through to the raw API string, so a new category type
 * shows up untranslated rather than disappearing.
 */

import { getLang, translate } from '@/i18n';
import type { TranslationKey } from '@/i18n';

/**
 * Value ids are stable across languages, so they are the primary key. 3/4/5 are
 * the contract types the home cards ship artwork for.
 */
const VALUE_ID_KEYS: Record<number, TranslationKey> = {
  3: 'categories.values.rent',
  4: 'categories.values.sale',
  5: 'categories.values.hotels',
};

/** Lowercases, and folds the Arabic spellings that vary across API responses. */
export const normalizeCategoryText = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ً-ْ]/g, '');

/**
 * Name-keyed fallback for rows whose id we don't recognise. Keys are normalized
 * Arabic; the English spellings are listed too so the lookup keeps working if
 * the backend starts honouring `Accept-Language`.
 */
const buildLookup = (
  entries: Array<[TranslationKey, string[]]>
): Record<string, TranslationKey> => {
  const out: Record<string, TranslationKey> = {};
  for (const [key, names] of entries) {
    for (const name of names) out[normalizeCategoryText(name)] = key;
  }
  return out;
};

const NAME_KEYS = buildLookup([
  ['categories.names.propertyType', ['نوع العقار', 'Property Type']],
  [
    'categories.names.listingType',
    ['نوع التعاقد', 'نوع الإعلان', 'Ad Type', 'Listing Type', 'Contract Type'],
  ],
]);

const VALUE_KEYS = buildLookup([
  // Contract / ad types. `للإيجار` / `للبيع` appear in older payloads.
  ['categories.values.rent', ['إيجار', 'للإيجار', 'For rent', 'Rent']],
  ['categories.values.sale', ['بيع', 'للبيع', 'For sale', 'Sale']],
  ['categories.values.hotels', ['فنادق', 'فندق', 'Hotels', 'Hotel']],

  // Property types
  ['categories.values.apartment', ['شقة', 'Apartment', 'Flat']],
  ['categories.values.villa', ['فيلا', 'Villa']],
  ['categories.values.house', ['بيت', 'House']],
  ['categories.values.floor', ['دور', 'Floor']],
  ['categories.values.building', ['عمارة', 'Building']],
  ['categories.values.duplex', ['دوبلكس', 'Duplex']],
  ['categories.values.chalet', ['شاليه', 'Chalet']],
  ['categories.values.office', ['مكتب', 'Office']],
  ['categories.values.land', ['أرض', 'Land']],
  ['categories.values.complex', ['مجمع', 'Complex']],
  ['categories.values.shop', ['محل', 'Shop']],
  ['categories.values.warehouse', ['مخزن', 'Warehouse']],
]);

const render = (key: TranslationKey | undefined, fallback: string) =>
  key ? translate(getLang(), key) : fallback;

/** Translation key for a category value, or undefined if we don't know it. */
export const categoryValueKey = (
  value: string,
  id?: number | null
): TranslationKey | undefined =>
  (id != null ? VALUE_ID_KEYS[id] : undefined) ??
  VALUE_KEYS[normalizeCategoryText(value ?? '')];

/** Category group name ("نوع العقار") in the active language. */
export const localizeCategoryName = (name: string): string =>
  render(NAME_KEYS[normalizeCategoryText(name ?? '')], name ?? '');

/**
 * Category value ("إيجار") in the active language. Pass the value's `id` when
 * you have it — ids survive a backend that starts localizing its responses.
 */
export const localizeCategoryValue = (
  value: string,
  id?: number | null
): string => render(categoryValueKey(value, id), value ?? '');
