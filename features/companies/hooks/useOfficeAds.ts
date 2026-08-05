import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/types';
import { useLangStore } from '@/i18n';
import { fetchOfficeAds } from '../services/offices.service';

export function useOfficeAds(id: string | number) {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: [...QUERY_KEYS.offices.ads(id), lang],
    queryFn: () => fetchOfficeAds(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
