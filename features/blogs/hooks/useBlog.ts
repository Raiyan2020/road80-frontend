'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/types';
import { useLangStore } from '@/i18n';
import { fetchBlogById } from '../services/blogs.service';

export function useBlog(id: number | string) {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: [...QUERY_KEYS.blogs.detail(id), lang],
    queryFn: () => fetchBlogById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
