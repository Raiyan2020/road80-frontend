'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/types';
import { useLangStore } from '@/i18n';
import { fetchBlogs, fetchBlogById } from '../services/blogs.service';

export function useBlogs(currentPage: number = 1) {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: [...QUERY_KEYS.blogs.all, currentPage, lang],
    queryFn: () => fetchBlogs(currentPage),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBlogDetail(id: number | string | undefined) {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: [...QUERY_KEYS.blogs.all, 'detail', id, lang],
    queryFn: () => fetchBlogById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

