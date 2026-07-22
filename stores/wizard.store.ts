import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Stable identifier for the default country. This is deliberately NOT a
 * translated label: anything that lands in `road80_wizard` survives reloads and
 * every later language switch, so persisting a display string would freeze the
 * wizard's country in whatever language happened to be active when it was
 * written. Resolve the label at render time instead — either from the
 * `/countries` payload (which is already localized via `Accept-Language`) or,
 * for the offline default, from `t('postAd.defaults.kuwait')`.
 */
export const DEFAULT_COUNTRY_CODE = 'KW';

interface WizardState {
  // Add Wizard (17 steps)
  postAdForm: {
    listingType: string;
    propertyType: string;
    /** ISO-3166 alpha-2 country code (stable id), NOT a display label. */
    countryCode: string;
    governorate: string;
    area: string;
    rooms: number | string;
    bathrooms: number | string;
    size: number;
    balcony: string;
    parking: string;
    parkingSystems: string[];
    electricity: string;
    water: string;
    ac: string;
    // Files cannot be persisted in localStorage easily,
    // so we'll store them in a separate non-persisted state if needed,
    // or just accept that they are lost on refresh for now (standard behavior).
  };
  setPostAdValue: (key: string, value: unknown) => void;
  resetPostAdForm: () => void;

  // Quick Start (5 steps)
  quickStartForm: {
    name: string;
    purpose: string;
    propertyType: string;
    governorate: string;
    area: string;
  };
  setQuickStartValue: (key: string, value: unknown) => void;
  resetQuickStartForm: () => void;
}

const createInitPostAd = () => ({
  listingType: '',
  propertyType: '',
  countryCode: DEFAULT_COUNTRY_CODE,
  governorate: '',
  area: '',
  rooms: '' as number | string,
  bathrooms: '' as number | string,
  size: 400,
  balcony: '',
  parking: '',
  parkingSystems: [] as string[],
  electricity: '',
  water: '',
  ac: '',
});

const INIT_QUICK_START = {
  name: '',
  purpose: '',
  propertyType: '',
  governorate: '',
  area: '',
};

/**
 * v0 (pre-i18n-migration) persisted `postAdForm.country` as a *translated*
 * label, e.g. the Arabic literal for "Kuwait". Anyone upgrading still has that
 * string sitting in localStorage, so drop it and re-seed the stable code.
 */
const migrateWizard = (persisted: unknown, version: number): unknown => {
  if (version >= 1 || !persisted || typeof persisted !== 'object') return persisted;

  const state = persisted as Record<string, any>;
  const legacyPostAd = (state.postAdForm ?? {}) as Record<string, any>;
  const { country: _legacyCountryLabel, ...rest } = legacyPostAd;

  return {
    ...state,
    postAdForm: {
      ...createInitPostAd(),
      ...rest,
      countryCode: DEFAULT_COUNTRY_CODE,
    },
  };
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      postAdForm: createInitPostAd(),
      setPostAdValue: (key, value) =>
        set((s) => ({
          postAdForm: { ...s.postAdForm, [key]: value },
        })),
      resetPostAdForm: () => set({ postAdForm: createInitPostAd() }),

      quickStartForm: INIT_QUICK_START,
      setQuickStartValue: (key, value) =>
        set((s) => ({
          quickStartForm: { ...s.quickStartForm, [key]: value },
        })),
      resetQuickStartForm: () => set({ quickStartForm: INIT_QUICK_START }),
    }),
    {
      name: 'road80_wizard',
      version: 1,
      migrate: migrateWizard,
      partialize: (s) => ({
        postAdForm: s.postAdForm,
        quickStartForm: s.quickStartForm,
      }),
    }
  )
);
