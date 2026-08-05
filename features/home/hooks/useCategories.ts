import { queryOptions, useQuery } from '@tanstack/react-query';
import { useLangStore } from '@/i18n';
import { fetchCategories } from '../services/home.service';

/** Shared with the splash-time prefetch — see homeDataQueryOptions. */
export const categoriesQueryOptions = (lang: string) =>
  queryOptions({
    queryKey: ['categories', lang],
    queryFn: fetchCategories,
    staleTime: 60 * 60 * 1000, // 1 hour — categories rarely change
  });

export function useCategories() {
  const lang = useLangStore((s) => s.lang);
  return useQuery(categoriesQueryOptions(lang));
}
