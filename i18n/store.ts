import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'ar' | 'en';
export type Dir = 'rtl' | 'ltr';

export const LANG_DIR: Record<Lang, Dir> = {
  ar: 'rtl',
  en: 'ltr',
};

export const LANG_LABELS: Record<Lang, string> = {
  ar: 'العربية',
  en: 'English',
};

/**
 * Applies the language to the document element. Kept outside the store so the
 * pre-hydration script in index.html and the store can share one code path.
 */
export function applyLangToDocument(lang: Lang) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dir = LANG_DIR[lang];
}

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: 'ar',
      setLang: (lang) => {
        applyLangToDocument(lang);
        set({ lang });
      },
      toggleLang: () => get().setLang(get().lang === 'ar' ? 'en' : 'ar'),
    }),
    {
      name: 'road80_lang',
      onRehydrateStorage: () => (state) => {
        applyLangToDocument(state?.lang ?? 'ar');
      },
    }
  )
);

/** Non-reactive read — for use outside React (zod schemas, service layer). */
export const getLang = (): Lang => useLangStore.getState().lang;
