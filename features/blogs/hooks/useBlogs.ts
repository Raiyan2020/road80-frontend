'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/types';
import { fetchBlogs, fetchBlogById } from '../services/blogs.service';

export function useBlogs(currentPage: number = 1) {
  return useQuery({
    queryKey: [...QUERY_KEYS.blogs.all, currentPage],
    queryFn: () => fetchBlogs(currentPage),
    staleTime: 5 * 60 * 1000, 
  });
}

export function useBlogDetail(id: number | string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.blogs.all, 'detail', id],
    queryFn: () => fetchBlogById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

