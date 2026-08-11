import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLangStore } from '@/i18n';
import { hotelsService } from '../services/hotels.service';
import type { HotelListFilters } from '../types';

/**
 * Query keys are hierarchical so a mutation can invalidate the narrowest
 * subtree — see the `state-ownership` skill.
 *
 *   ['hotels', lang, filters]        list
 *   ['hotel', id, lang]              one hotel
 *   ['hotel', id, 'contents']        its content
 *   ['hotel', id, 'ratings']         its ratings
 */
export const hotelKeys = {
  list: (lang: string, filters: HotelListFilters) => ['hotels', lang, filters] as const,
  detail: (id: number | string, lang: string) => ['hotel', String(id), lang] as const,
  contents: (id: number | string, page: number) =>
    ['hotel', String(id), 'contents', page] as const,
  ratings: (id: number | string, page: number) =>
    ['hotel', String(id), 'ratings', page] as const,
};

/**
 * Keyed by language: the backend localises `country_name` / `state_name` from
 * the Accept-Language header, so the cached list must not leak across languages.
 */
export function useHotelsList(filters: HotelListFilters) {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: hotelKeys.list(lang, filters),
    queryFn: () => hotelsService.list(filters),
  });
}

export function useHotel(id: number | string | undefined) {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: hotelKeys.detail(id ?? '', lang),
    queryFn: () => hotelsService.detail(id!),
    enabled: !!id,
  });
}

export function useHotelContents(id: number | string | undefined, page = 1) {
  return useQuery({
    queryKey: hotelKeys.contents(id ?? '', page),
    queryFn: () => hotelsService.contents(id!, page),
    enabled: !!id,
  });
}

export function useHotelContent(
  id: number | string | undefined,
  contentId: number | string | undefined,
) {
  return useQuery({
    queryKey: ['hotel', String(id), 'content', String(contentId)],
    queryFn: () => hotelsService.content(id!, contentId!),
    enabled: !!id && !!contentId,
    // A hidden or deleted item 404s (use case 1.5) — that is a real answer,
    // not a transient failure, so don't burn a retry on it.
    retry: false,
    meta: { hideToast: true },
  });
}

export function useHotelRatings(id: number | string | undefined, page = 1) {
  return useQuery({
    queryKey: hotelKeys.ratings(id ?? '', page),
    queryFn: () => hotelsService.ratings(id!, page),
    enabled: !!id,
  });
}

/**
 * Add or update this user's rating (use case 5.2).
 * The hotel's `rate` and `ratings_count` are recomputed server-side, so the
 * hotel record is invalidated alongside the ratings list.
 */
export function useRateHotel(id: number | string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { stars: number; comment?: string }) =>
      hotelsService.rate(id!, body),
    meta: { hideToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel', String(id)] });
      queryClient.invalidateQueries({ queryKey: ['hotels'] });
    },
  });
}
