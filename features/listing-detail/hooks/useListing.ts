'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/types';
import { useLangStore } from '@/i18n';
import { fetchListingById } from '../services/listing-detail.service';

export function useListing(id: number) {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: [...QUERY_KEYS.listings.detail(id), lang],
    queryFn: () => fetchListingById(id),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}
