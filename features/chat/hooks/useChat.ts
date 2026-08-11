import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService, type Message } from '../services/chat.service';

export const chatKeys = {
  conversations: (page: number) => ['conversations', page] as const,
  messages: (id: number | string, page: number) =>
    ['conversation', String(id), 'messages', page] as const,
};

export function useConversations(page = 1) {
  return useQuery({
    queryKey: chatKeys.conversations(page),
    queryFn: () => chatService.conversations(page),
    // A thread list goes stale the moment the other party replies, and there is
    // no socket here — refetch on focus and poll while the screen is open.
    staleTime: 0,
    refetchInterval: 30_000,
  });
}

export function useMessages(conversationId: number | string | undefined, page = 1) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId ?? '', page),
    queryFn: () => chatService.messages(conversationId!, page),
    enabled: !!conversationId,
    staleTime: 0,
    // Polling stands in for realtime. 15s is a deliberate compromise: tighter
    // drains battery and mobile data for a feature used in short bursts.
    refetchInterval: 15_000,
  });
}

export function useSendMessage(conversationId: number | string | undefined) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (body: string) => chatService.send(conversationId!, body),
    // Not retried: sending is NOT idempotent, and a retry after a timeout that
    // actually succeeded would post the message twice. See `offline-connectivity`.
    retry: false,
    meta: { hideToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['conversation', String(conversationId), 'messages'],
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return { sendMessage: mutation.mutateAsync, isSending: mutation.isPending };
}

/**
 * Start (or resume) a conversation with a hotel. The endpoint is idempotent, so
 * a user returning to a hotel continues the existing thread rather than opening
 * a second one — «يمكن للمستخدم العودة إلى المحادثة السابقة».
 */
export function useStartConversation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (hotelId: number | string) => chatService.startWithHotel(hotelId),
    meta: { hideToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
  return { startConversation: mutation.mutateAsync, isStarting: mutation.isPending };
}

export function useStartCompanyConversation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (companyId: number | string) => chatService.startWithCompany(companyId),
    meta: { hideToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return {
    startCompanyConversation: mutation.mutateAsync,
    isStartingCompanyConversation: mutation.isPending,
  };
}

/** Groups a transcript by calendar day for date separators. */
export function groupByDay(messages: Message[]) {
  const groups: { day: string; items: Message[] }[] = [];
  messages.forEach((m) => {
    const day = m.created_at ? m.created_at.slice(0, 10) : '';
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(m);
    else groups.push({ day, items: [m] });
  });
  return groups;
}
