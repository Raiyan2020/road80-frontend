import { queryOptions, useQuery } from '@tanstack/react-query';
import { useLangStore } from '@/i18n';
import { homeService } from '@/shared/services/home.service';

/**
 * Shared definition so the splash-time prefetch and this hook resolve to the
 * exact same cache entry. Keeping the key in one place is the whole point —
 * a drifted key means the prefetch warms a slot nothing ever reads.
 */
export const homeDataQueryOptions = (lang: string) =>
  queryOptions({
    queryKey: ['home-data', lang],
    queryFn: () => homeService.getHomeData(),
    staleTime: 60 * 1000,
  });

export function useHomeData() {
  const lang = useLangStore((s) => s.lang);
  return useQuery(homeDataQueryOptions(lang));
}
