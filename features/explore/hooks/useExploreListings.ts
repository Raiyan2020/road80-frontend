'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/types';
import { useLangStore } from '@/i18n';
import { fetchExploreFeed, mapRawExploreToListing } from '../services/explore.service';
import { mapRowsSafely } from '../utils/map-rows-safely';
import { ExploreFilters } from '../types';

export function useExploreListings(filters?: ExploreFilters) {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: filters
      ? [...QUERY_KEYS.listings.explore, filters, lang]
      : [...QUERY_KEYS.listings.explore, lang],
    queryFn: async () => {
        const res = await fetchExploreFeed(filters);

        const { items, skipped } = mapRowsSafely(res.data, mapRawExploreToListing);

        if (skipped.length > 0 && import.meta.env.DEV) {
          console.warn(
            `[explore] skipped ${skipped.length} of ${res.data?.length ?? 0} listing(s) that failed to map`,
            skipped,
          );
        }

        return { listings: items, pagination: res.pagination };
    },
    meta: { hideToast: true },
    staleTime: 0,
  });
}
