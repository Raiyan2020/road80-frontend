import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Header
  headerTitle: string;
  setHeaderTitle: (title: string) => void;
  showBack: boolean;
  setShowBack: (val: boolean) => void;
  isMenuOpen: boolean;
  setMenuOpen: (val: boolean) => void;

  // Country
  selectedCountryCode: string;
  setSelectedCountry: (code: string) => void;

  // Preferences (from QuickWizard)
  preferences: {
    propertyType: string;
    purpose: string;
    area: string;
    // Store IDs for pre-filling forms
    countryId?: number;
    stateId?: number;
    cityId?: number;
    categoryValues?: number[];
  } | null;
  setPreferences: (p: UIState['preferences']) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () =>
        set((s) => {
          const next = s.theme === 'light' ? 'dark' : 'light';
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', next === 'dark');
          }
          return { theme: next };
        }),

      // Empty by default — the header title is supplied per-route by __root.tsx
      // and translated there. Storing a literal here would freeze one language.
      headerTitle: '',
      setHeaderTitle: (headerTitle) => set({ headerTitle }),
      showBack: false,
      setShowBack: (showBack) => set({ showBack }),
      isMenuOpen: false,
      setMenuOpen: (isMenuOpen) => set({ isMenuOpen }),

      selectedCountryCode: 'KW',
      setSelectedCountry: (code) => set({ selectedCountryCode: code }),

      preferences: null,
      setPreferences: (p) => set({ preferences: p }),
    }),
    {
      name: 'road80_ui',
      // Only persist theme + country + prefs — never server data
      partialize: (s) => ({
        theme: s.theme,
        selectedCountryCode: s.selectedCountryCode,
        preferences: s.preferences,
      }),
    }
  )
);
