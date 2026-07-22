import { useQuery } from '@tanstack/react-query';
import { useLangStore } from '@/i18n';
import { fetchFilterOptions } from '../services/home.service';

export function useFilterOptions() {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: ['filter-options', lang],
    queryFn: fetchFilterOptions,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
