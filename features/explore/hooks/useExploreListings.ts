'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/types';
import { useLangStore } from '@/i18n';
import { fetchExploreFeed, mapRawExploreToListing } from '../services/explore.service';
import { ExploreFilters } from '../types';

export function useExploreListings(filters?: ExploreFilters) {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: filters
      ? [...QUERY_KEYS.listings.explore, filters, lang]
      : [...QUERY_KEYS.listings.explore, lang],
    queryFn: async () => {
        const res = await fetchExploreFeed(filters);
        if (res && res.data) {
           return {
             listings: res.data.map(mapRawExploreToListing),
             pagination: res.pagination,
           };
        }
        return { listings: [], pagination: undefined };
    },
    staleTime: 0,
  });
}
