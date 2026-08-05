import { useMutation, useQuery } from '@tanstack/react-query';
import { useLangStore } from '@/i18n';
import { homeService, FilterHistoryPayload } from '../services/home.service';

export function useSaveFilterHistory() {
  return useMutation({
    mutationFn: (payload: FilterHistoryPayload) => homeService.saveFilterHistory(payload),
  });
}

export function useCategoriesAppearInFilter() {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: ['categories-filter', lang],
    queryFn: () => homeService.getCategoriesAppearInFilter(),
  });
}

export function useHomeData() {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: ['home-data', lang],
    queryFn: () => homeService.getHomeData(),
  });
}

export function useAdsByHistory() {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: ['ads-by-history', lang],
    queryFn: () => homeService.getAdsByHistory(),
    staleTime: 5 * 60 * 1000,
  });
}
