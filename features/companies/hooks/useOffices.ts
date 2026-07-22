'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/types';
import { useLangStore } from '@/i18n';
import { fetchOffices, fetchOfficeById, fetchDepartments } from '../services/offices.service';

export function useOffices(category?: string | null) {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: category
      ? [...QUERY_KEYS.offices.all, category, lang]
      : [...QUERY_KEYS.offices.all, lang],
    queryFn: () => fetchOffices(category ?? undefined),
    staleTime: 5 * 60 * 1000,
  });
}

export function useOffice(id: string) {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: [...QUERY_KEYS.offices.detail(id), lang],
    queryFn: () => fetchOfficeById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartments() {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: ['departments', lang],
    queryFn: () => fetchDepartments(),
    staleTime: 5 * 60 * 1000,
  });
}
