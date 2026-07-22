'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/types';
import { useLangStore } from '@/i18n';
import { fetchHomeListings } from '../services/listings.service';

export function useHomeListings() {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    // `lang` goes last so the `QUERY_KEYS.listings.all` prefix still matches for
    // the optimistic-like/invalidate helpers in shared/hooks/useListing.ts.
    queryKey: [...QUERY_KEYS.listings.all, lang],
    queryFn: fetchHomeListings,
    staleTime: 60 * 1000,
  });
}
