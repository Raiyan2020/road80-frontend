import api from '@/lib/api-client';
import type { ApiEnvelope, PaginatedEnvelope } from '@/features/hotels/types';

export interface ChatParticipant {
  id: number;
  name: string;
  image: string | null;
  /** Present on message senders. */
  type?: 'user' | 'company' | 'hotel';
}

/** flutter-hotel-feature-api.md §4.8 */
export interface Message {
  id: number;
  body: string;
  read_at: string | null;
  sender: ChatParticipant;
  created_at: string | null;
}

/** flutter-hotel-feature-api.md §4.7 */
export interface Conversation {
  id: number;
  /** The *other* party: the hotel for a user, the user for a hotel. */
  participant: ChatParticipant;
  latest_message: Message | null;
  updated_at: string | null;
}

/**
 * In-app messaging between a user and a hotel (use case 1.6).
 *
 * External channels (phone, WhatsApp, website, socials) sit alongside this and
 * are not replaced by it — «تظل وسائل التواصل الخارجية ... خيارات مستقلة».
 */
export const chatService = {
  /**
   * Start a conversation with a hotel, or return the existing one.
   * **Idempotent** — the same user + hotel always resolves to one conversation,
   * so callers must not guard against duplicates themselves.
   * Errors: `hotel_not_available` (profile hidden/suspended),
   * `hotel_cannot_start_chat` (a hotel account tried to initiate).
   */
  startWithHotel: (hotelId: number | string) =>
    api.post<ApiEnvelope<Conversation>>(`/hotels/${hotelId}/conversations`),

  /** A user sees their hotel threads; a hotel sees incoming user threads. */
  conversations: (page = 1) =>
    api.get<PaginatedEnvelope<Conversation[]>>('/conversations', {
      query: { page: String(page) },
    }),

  /** Oldest first, so the transcript reads top-to-bottom. */
  messages: (conversationId: number | string, page = 1) =>
    api.get<PaginatedEnvelope<Message[]>>(
      `/conversations/${conversationId}/messages`,
      { query: { page: String(page) } },
    ),

  /** Triggers a `new_message` push to the other party. */
  send: (conversationId: number | string, body: string) =>
    api.post<ApiEnvelope<Message>>(`/conversations/${conversationId}/messages`, {
      body,
    }),
};
