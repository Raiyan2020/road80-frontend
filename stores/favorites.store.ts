import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface FavoritesState {
  ids: number[];
  toggle: (id: number | string) => void;
  setFavorite: (id: number | string, liked: boolean) => void;
  mergeIds: (ids: Array<number | string>) => void;
  isFavorite: (id: number | string) => boolean;
}

const normalizeId = (id: number | string) => Number(id);

const normalizeIds = (ids: Array<number | string>) =>
  [
    ...new Set(
      ids
        .map(normalizeId)
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  ];

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const normalized = normalizeId(id);
        if (!Number.isFinite(normalized) || normalized <= 0) return;

        set((state) => ({
          ids: state.ids.includes(normalized)
            ? state.ids.filter((x) => x !== normalized)
            : [...state.ids, normalized],
        }));
      },
      setFavorite: (id, liked) => {
        const normalized = normalizeId(id);
        if (!Number.isFinite(normalized) || normalized <= 0) return;

        set((state) => {
          const has = state.ids.includes(normalized);
          if (liked && !has) return { ids: [...state.ids, normalized] };
          if (!liked && has) {
            return { ids: state.ids.filter((x) => x !== normalized) };
          }
          return state;
        });
      },
      mergeIds: (incoming) => {
        set((state) => ({
          ids: normalizeIds([...state.ids, ...incoming]),
        }));
      },
      isFavorite: (id) => get().ids.includes(normalizeId(id)),
    }),
    {
      name: 'road80_favorites',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ ids: state.ids }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<FavoritesState> | undefined;
        return {
          ...current,
          ids: normalizeIds(saved?.ids ?? []),
        };
      },
    },
  ),
);
