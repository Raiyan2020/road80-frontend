'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/types';
import { fetchExploreFeed, mapRawExploreToListing } from '../services/explore.service';
import { ExploreFilters } from '../types';

export function useExploreListings(filters?: ExploreFilters) {
  return useQuery({
    queryKey: filters ? [...QUERY_KEYS.listings.explore, filters] : QUERY_KEYS.listings.explore,
    queryFn: async () => {
        const res = await fetchExploreFeed(filters);
        if (res && res.data) {
           return res.data.map(mapRawExploreToListing);
        }
        return [];
    },
    staleTime: 0,
  });
}
