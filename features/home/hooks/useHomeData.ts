import { useQuery } from '@tanstack/react-query';
import { useLangStore } from '@/i18n';
import { homeService } from '@/shared/services/home.service';

export function useHomeData() {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: ['home-data', lang],
    queryFn: () => homeService.getHomeData(),
    staleTime: 60 * 1000,
  });
}
