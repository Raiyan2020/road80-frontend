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

        // One unmappable ad must cost one ad, not the whole grid. A bare
        // `.map()` here rejected the query on the first bad row and the page
        // rendered as "no results" with nothing logged.
        const { items, skipped } = mapRowsSafely(res.data, mapRawExploreToListing);

        if (skipped.length > 0 && import.meta.env.DEV) {
          console.warn(
            `[explore] skipped ${skipped.length} of ${res.data?.length ?? 0} listing(s) that failed to map`,
            skipped,
          );
        }

        return { listings: items, pagination: res.pagination };
    },
    staleTime: 0,
  });
}
