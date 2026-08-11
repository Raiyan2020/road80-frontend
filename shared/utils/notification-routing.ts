/**
 * Maps a notification payload to an in-app destination, and provides the hook
 * push handlers use to navigate from outside React.
 *
 * The backend sends these hotel-related types (flutter-hotel-feature-api.md §12):
 *   new_message          → data: { conversation_id, subject }
 *   hotel_content_hidden → data: { reason, content_id }
 *
 * Payload shape varies by transport: the in-app list returns the notification
 * row itself, FCM web delivers `{ data: {...} }`, and the native bridge passes
 * the data object directly — so every lookup checks both levels.
 */

export type NotificationTarget =
  | { to: '/ad/$id'; params: { id: string } }
  | { to: '/conversations/$id'; params: { id: string } }
  | { to: '/profile/hotel-contents' }
  | null;

const readField = (notif: any, key: string): string | undefined => {
  const candidates = [notif?.data, notif, notif?.data?.data];
  for (const source of candidates) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== '') return String(value);
  }
  return undefined;
};

const readType = (notif: any): string | undefined => readField(notif, 'type');

/** Ad id, kept compatible with the existing `getNotificationAdId` behaviour. */
const readAdId = (notif: any): string | undefined =>
  readField(notif, 'ad_id') ?? readField(notif, 'adId');

export function resolveNotificationTarget(notif: any): NotificationTarget {
  const type = readType(notif);

  // UC 1.6 — «ويمكنه الدخول إلى المحادثة ومتابعتها»: a new-message notification
  // must open the conversation it belongs to.
  if (type === 'new_message') {
    const conversationId = readField(notif, 'conversation_id');
    if (conversationId) return { to: '/conversations/$id', params: { id: conversationId } };
  }

  // UC 2.2 — the hotel is told its content was hidden and why. The owner's
  // content screen is where the hidden badge and `hidden_reason` are shown.
  if (type === 'hotel_content_hidden') {
    return { to: '/profile/hotel-contents' };
  }

  const adId = readAdId(notif);
  if (adId) return { to: '/ad/$id', params: { id: adId } };

  return null;
}

// ── Navigating from outside React ──────────────────────────────────────────
// Push handlers live in plain modules, so the router is registered here by
// routes/__root.tsx on mount (the same approach the deep-link handler uses).

type Navigator = (target: Exclude<NotificationTarget, null>) => void;

let appNavigator: Navigator | null = null;

export const setAppNavigator = (fn: Navigator | null) => {
  appNavigator = fn;
};

/**
 * Navigate to a notification's target. Returns false when there is no target or
 * the router is not mounted yet, so callers can fall back to a plain toast.
 */
export const navigateToNotification = (notif: any): boolean => {
  const target = resolveNotificationTarget(notif);
  if (!target || !appNavigator) return false;
  appNavigator(target);
  return true;
};
