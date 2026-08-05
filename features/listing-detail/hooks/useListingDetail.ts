'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/types';
import { useLangStore } from '@/i18n';
import { fetchListingById } from '../services/listing-detail.service';

/**
 * Hook to fetch and observe a single listing detail.
 * Keeps the UI in sync with the client-side cache (e.g. for optimistic updates).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useListingDetail(id: number, initialData?: any) {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    // Same key shape as useListing so both hooks share one cache entry per language.
    queryKey: [...QUERY_KEYS.listings.detail(id), lang],
    queryFn: () => fetchListingById(id),
    initialData,
    staleTime: 5 * 60 * 1000,
  });
}
