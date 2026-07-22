import { useQuery } from '@tanstack/react-query';
import { useLangStore } from '@/i18n';
import { fetchCategories } from '../services/home.service';

export function useCategories() {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: ['categories', lang],
    queryFn: fetchCategories,
    staleTime: 60 * 60 * 1000, // 1 hour — categories rarely change
  });
}
