'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listingService } from '../services/listing.service';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/lib/types';
import { t } from '@/i18n';

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => listingService.toggleLike(id),

    // ── Optimistic update: flip the heart INSTANTLY before the server responds ──
    onMutate: async (id: number) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.listings.all });

      // Snapshot previous data so we can roll back on error
      const previousData = queryClient.getQueriesData({ queryKey: QUERY_KEYS.listings.all });

      // Optimistically flip `isLiked` on every cached listing with this id
      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.listings.all },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (old: any) => {
          if (!old) return old;

          // Handle array responses (home feed, explore feed)
          if (Array.isArray(old)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return old.map((item: any) =>
              item.id === id 
                ? { ...item, isLiked: !item.isLiked, is_liked: !item.is_liked } 
                : item
            );
          }

          // Handle paginated responses { data: [...] }
          if (old?.data && Array.isArray(old.data)) {
            return {
              ...old,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data: old.data.map((item: any) =>
                item.id === id 
                    ? { ...item, isLiked: !item.isLiked, is_liked: !item.is_liked } 
                    : item
              ),
            };
          }

          // Handle single listing detail
          if (old?.id === id) {
            return { ...old, isLiked: !old.isLiked, is_liked: !old.is_liked };
          }

          return old;
        }
      );

      return { previousData };
    },

    onSuccess: (response) => {
      if (response.status) {
        toast.success(response.message, { closeButton: true });
      } else {
        toast.error(response.message || t('common.actionFailed'));
      }
      // Refetch in background to sync with real server state
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.listings.all });
      queryClient.invalidateQueries({ queryKey: ['ads-by-history'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },

    // ── Roll back on error ──
    onError: (error: Error, _id, context) => {
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error(error?.message || t('common.tryAgain'));
    },
  });
}
