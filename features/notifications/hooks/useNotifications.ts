'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLangStore } from '@/i18n';
import { notificationsService } from '../services/notifications.service';

export function useNotifications(page = 1) {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    // `lang` last so the existing `['notifications']` prefix invalidations
    // (delete/delete-all mutations, push handler) keep matching.
    queryKey: ['notifications', page, lang],
    queryFn: () => notificationsService.getNotifications(page),
    select: (res) => res,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationsService.getUnreadCount,
    select: (res: any) =>
      Number(
        res?.data?.unread_count ??
        res?.data?.data?.unread_count ??
        res?.unread_count ??
        res?.count ??
        0
      ),
    refetchInterval: 60_000, // refresh every minute
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsService.deleteAllNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
