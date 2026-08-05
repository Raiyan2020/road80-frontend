import { useLangStore, getLang, LANG_DIR, applyLangToDocument } from './store';
import type { Lang, Dir } from './store';
import { ar } from './locales/ar';
import { en } from './locales/en';

export type { Lang, Dir };
export { useLangStore, getLang, LANG_DIR, LANG_LABELS, applyLangToDocument } from './store';

const DICTS = { ar, en } as const;

/** Union of every dotted leaf path in the Arabic dictionary (the source of truth). */
type Leaves<T> = T extends string
  ? ''
  : {
      [K in keyof T & string]: T[K] extends string ? K : `${K}.${Leaves<T[K]>}`;
    }[keyof T & string];

export type TranslationKey = Leaves<typeof ar>;

export type TParams = Record<string, string | number>;

function lookup(dict: unknown, key: string): string | undefined {
  let node: any = dict;
  for (const part of key.split('.')) {
    if (node == null || typeof node !== 'object') return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/** Replaces {name} placeholders with the matching param. */
function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in params ? String(params[name]) : match
  );
}

const pluralRules = new Map<Lang, Intl.PluralRules>();

function pluralCategory(lang: Lang, count: number): string {
  let rules = pluralRules.get(lang);
  if (!rules) {
    rules = new Intl.PluralRules(lang);
    pluralRules.set(lang, rules);
  }
  return rules.select(count);
}

/**
 * Resolves a key, preferring a plural variant when a numeric `count` param is
 * present. `t('listing.views', { count: 1 })` checks `listing.views_one` first
 * and falls back to `listing.views`. Arabic has six plural categories, so the
 * variant is chosen via Intl.PluralRules rather than an `n === 1` check.
 */
function resolve(lang: Lang, key: string, params?: TParams): string | undefined {
  const dict = DICTS[lang];
  const count = params?.count;

  if (typeof count === 'number') {
    const variant = lookup(dict, `${key}_${pluralCategory(lang, count)}`);
    if (variant !== undefined) return variant;
  }

  return lookup(dict, key);
}

export function translate(lang: Lang, key: TranslationKey, params?: TParams): string {
  const hit = resolve(lang, key, params) ?? resolve('ar', key, params);
  if (hit === undefined) {
    if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`);
    return key;
  }
  return interpolate(hit, params);
}

/**
 * Non-reactive translate — for zod schemas, service layers, and anywhere a hook
 * can't run. Read at call time so it always reflects the current language.
 */
export const t = (key: TranslationKey, params?: TParams): string =>
  translate(getLang(), key, params);

/** Reactive translate. Components re-render when the language changes. */
export function useTranslation() {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const toggleLang = useLangStore((s) => s.toggleLang);

  return {
    lang,
    dir: LANG_DIR[lang],
    isRTL: LANG_DIR[lang] === 'rtl',
    setLang,
    toggleLang,
    t: (key: TranslationKey, params?: TParams) => translate(lang, key, params),
  };
}

/**
 * Picks the right side of an API payload that ships both languages
 * (e.g. `{ name_ar, name_en }`), falling back to whichever exists.
 */
export function pickLocalized<T extends Record<string, any>>(
  obj: T | null | undefined,
  base: string,
  lang: Lang = getLang()
): string {
  if (!obj) return '';
  return obj[`${base}_${lang}`] ?? obj[`${base}_ar`] ?? obj[`${base}_en`] ?? obj[base] ?? '';
}
