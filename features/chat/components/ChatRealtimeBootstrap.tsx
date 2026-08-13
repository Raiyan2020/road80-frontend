import { useEffect } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { connectRealtime, disconnectRealtime } from '@/lib/realtime';
import { useUserStore } from '@/stores/user.store';
import type { PaginatedEnvelope } from '@/features/hotels/types';
import {
  chatKeys,
  type ChatMessageCreatedEvent,
} from '@/features/chat/hooks/useChat';
import type { Message } from '@/features/chat/services/chat.service';

type MessagePage = PaginatedEnvelope<Message[]>;

function appendUnique(messages: Message[], message: Message): Message[] {
  const existingIndex = messages.findIndex((item) => item.id === message.id);
  if (existingIndex < 0) return [...messages, message];

  const next = [...messages];
  next[existingIndex] = message;
  return next;
}

function cacheRealtimeMessage(
  event: ChatMessageCreatedEvent,
  currentUserId: number,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  const conversationId = String(event.conversation_id);
  const message: Message = {
    ...event.message,
    is_mine: Number(event.message.sender.id) === Number(currentUserId),
  };

  queryClient.setQueryData<MessagePage>(
    chatKeys.messages(conversationId, 1),
    (current) => current
      ? { ...current, data: appendUnique(current.data ?? [], message) }
      : current,
  );

  queryClient.setQueryData<InfiniteData<MessagePage, number>>(
    chatKeys.infiniteMessages(conversationId),
    (current) => {
      if (!current?.pages.length) return current;
      const [newestPage, ...olderPages] = current.pages;
      return {
        ...current,
        pages: [
          {
            ...newestPage,
            data: appendUnique(newestPage.data ?? [], message),
          },
          ...olderPages,
        ],
      };
    },
  );

  // The server is authoritative for ordering, unread counts, and the list's
  // latest_message summary. Active inbox views refetch immediately.
  void queryClient.invalidateQueries({
    queryKey: chatKeys.allConversations,
    refetchType: 'active',
  });
}

/** Maintains one private per-account subscription for the authenticated app. */
export function ChatRealtimeBootstrap() {
  const queryClient = useQueryClient();
  const userId = useUserStore((state) => state.user?.id);
  const token = useUserStore((state) => state.user?.token);

  useEffect(() => {
    if (!userId || !token) {
      disconnectRealtime();
      return;
    }

    const echo = connectRealtime(token);
    if (!echo) return;

    const channelName = `user.${userId}`;
    const channel = echo
      .private(channelName)
      .listen('.chat.message.created', (event: ChatMessageCreatedEvent) => {
        if (!event?.message || Number(event.conversation_id) !== Number(event.message.conversation_id)) {
          console.warn('[realtime] ignored malformed chat.message.created event');
          return;
        }
        cacheRealtimeMessage(event, userId, queryClient);
      })
      .error((error: unknown) => {
        console.error('[realtime] private chat channel authorization failed', error);
      });

    return () => {
      channel.stopListening('.chat.message.created');
      echo.leave(channelName);
      disconnectRealtime();
    };
  }, [queryClient, token, userId]);

  return null;
}
