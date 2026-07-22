import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/types';
import { useLangStore } from '@/i18n';
import { fetchDepartments } from '../services/offices.service';

export function useDepartments() {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: [...QUERY_KEYS.offices.departments, lang],
    queryFn: fetchDepartments,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
