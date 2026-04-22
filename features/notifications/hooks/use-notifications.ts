import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '../services/notifications.service';

export function useNotifications(page: number = 1) {
  return useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationsService.getNotifications(page),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationsService.getUnreadCount(),
    // Poll for unread count every minute or so, 
    // though real-time is handled by FCM
    refetchInterval: 60000, 
  });
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationsService.getUnreadCount(), // Assuming it returns the list as per the postman JSON
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
