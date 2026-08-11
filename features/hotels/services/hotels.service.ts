import api from '@/lib/api-client';
import type {
  ApiEnvelope,
  Hotel,
  HotelContent,
  HotelListFilters,
  HotelRating,
  PaginatedEnvelope,
} from '../types';

/** Strip empty filter values so we never send `?country_id=&search=`. */
const cleanQuery = (filters: HotelListFilters): Record<string, string> => {
  const query: Record<string, string> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query[key] = String(value);
  });
  return query;
};

/**
 * Public hotel browsing (use cases 1.4, 1.5, 5.2).
 *
 * Every endpoint here requires auth per flutter-hotel-feature-api.md §7 — a
 * shared `share_url` opened by a signed-out recipient will 401. The hotel route
 * forwards them through login and back; see routes/hotels/$id.tsx.
 */
export const hotelsService = {
  list: (filters: HotelListFilters = {}) =>
    api.get<PaginatedEnvelope<Hotel[]>>('/hotels', { query: cleanQuery(filters) }),

  detail: (id: number | string) => api.get<ApiEnvelope<Hotel>>(`/hotels/${id}`),

  /** Visitors only ever receive `status: 'active'` items. */
  contents: (id: number | string, page = 1) =>
    api.get<PaginatedEnvelope<HotelContent[]>>(`/hotels/${id}/contents`, {
      query: { page: String(page) },
    }),

  content: (id: number | string, contentId: number | string) =>
    api.get<ApiEnvelope<HotelContent>>(`/hotels/${id}/contents/${contentId}`),

  ratings: (id: number | string, page = 1) =>
    api.get<PaginatedEnvelope<HotelRating[]>>(`/hotels/${id}/ratings`, {
      query: { page: String(page) },
    }),

  /**
   * Add or update this user's rating (use case 5.2).
   * One rating per user per hotel — re-submitting updates the existing one.
   * Rejected with `cannot_rate_own_hotel` if a hotel rates itself.
   */
  rate: (id: number | string, body: { stars: number; comment?: string }) =>
    api.post<ApiEnvelope<HotelRating>>(`/hotels/${id}/ratings`, body),
};
