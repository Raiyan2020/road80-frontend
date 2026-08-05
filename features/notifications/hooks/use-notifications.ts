import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLangStore } from '@/i18n';
import { notificationsService } from '../services/notifications.service';

export function useNotifications(page: number = 1) {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    // `lang` last so the existing `['notifications']` prefix invalidations
    // (delete/delete-all mutations, push handler) keep matching.
    queryKey: ['notifications', page, lang],
    queryFn: () => notificationsService.getNotifications(page),
    refetchInterval: 15000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationsService.getUnreadCount(),
    select: (res: any) => Number(
      res?.data?.unread_count ??
      res?.data?.data?.unread_count ??
      res?.unread_count ??
      res?.count ??
      (Array.isArray(res?.data) ? res.data.length : 0)
    ),
    // Poll often enough to keep notification badges fresh.
    refetchInterval: 15000,
  });
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationsService.getUnreadCount(),
    refetchInterval: 15000,
    select: (res: any) => {
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res?.data?.data)) return res.data.data;
      return [];
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => notificationsService.deleteNotification(id),
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      await queryClient.cancelQueries({ queryKey: ['notifications-unread'] });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData(['notifications']);
      const previousUnread = queryClient.getQueryData(['notifications-unread']);

      // Optimistically update to the new value by filtering out the deleted ID
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.filter((notif: any) => notif.id.toString() !== deletedId.toString())
        };
      });

      queryClient.setQueriesData({ queryKey: ['notifications-unread'] }, (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.filter((notif: any) => notif.id.toString() !== deletedId.toString())
        };
      });

      return { previousNotifications, previousUnread };
    },
    onError: (err, newTodo, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
      if (context?.previousUnread) {
        queryClient.setQueryData(['notifications-unread'], context.previousUnread);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => notificationsService.deleteAllNotifications(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      await queryClient.cancelQueries({ queryKey: ['notifications-unread'] });

      queryClient.setQueriesData({ queryKey: ['notifications'] }, (old: any) => {
        if (!old) return old;
        return { ...old, data: [] };
      });
      queryClient.setQueriesData({ queryKey: ['notifications-unread'] }, (old: any) => {
        if (!old) return old;
        return { ...old, data: [] };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });
}
