import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import { SpinnerIcon, BellIcon } from './Icons';
import { useNotifications, useDeleteNotification, useDeleteAllNotifications, useUnreadNotifications } from '../features/notifications/hooks/use-notifications';
import { getNotificationCopy } from '../shared/utils/notifications';
import { resolveNotificationTarget } from '../shared/utils/notification-routing';
import { useTranslation } from '../i18n';
import type { Lang } from '../i18n';

const getNotificationData = (notif: any) => {
  if (typeof notif?.data === 'string') {
    try {
      return JSON.parse(notif.data);
    } catch {
      return {};
    }
  }

  return notif?.data || {};
};

const getNotificationAdId = (notif: any) => {
  const data = getNotificationData(notif);
  return (
    data.ad_id ??
    data.adId ??
    data.ad?.id ??
    data.listing_id ??
    data.listingId ??
    notif?.ad_id ??
    notif?.adId ??
    notif?.listing_id ??
    notif?.listingId ??
    null
  );
};

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const RELATIVE_UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: 'day', ms: 24 * 60 * 60 * 1000 },
  { unit: 'hour', ms: 60 * 60 * 1000 },
  { unit: 'minute', ms: 60 * 1000 },
];

/**
 * Laravel commonly serialises as "2026-07-22 10:33:12", which `Date.parse`
 * rejects on some engines — retry with an ISO-8601 separator before giving up.
 */
const parseTimestamp = (value: string | undefined): number => {
  if (!value) return NaN;
  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) return direct;
  return Date.parse(value.trim().replace(' ', 'T'));
};

/**
 * Localised "5 minutes ago" label.
 *
 * Local `Intl` formatting is always preferred over the API's `created_at_diff`:
 * that string is rendered server-side and frozen in the language of the
 * response, so it goes stale the moment the user switches language. It is used
 * only when we genuinely cannot parse the timestamp ourselves — and the raw
 * ISO-8601 string is never shown, since it is not a human-readable label.
 */
const formatRelativeTime = (
  createdAt: string | undefined,
  fallback: string | undefined,
  lang: Lang,
  justNow: string
): string => {
  const timestamp = parseTimestamp(createdAt);
  if (Number.isNaN(timestamp)) return fallback || '';

  const diff = timestamp - Date.now();
  const abs = Math.abs(diff);

  // A year or older reads better as an absolute, locale-formatted date than as
  // a vague "last year" — and it is the localized replacement for the raw
  // timestamp this function used to fall back to.
  if (abs >= YEAR_MS) {
    return new Intl.DateTimeFormat(lang, { dateStyle: 'medium' }).format(timestamp);
  }

  for (const { unit, ms } of RELATIVE_UNITS) {
    if (abs >= ms) {
      const value = Math.round(diff / ms);
      return new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(value, unit);
    }
  }

  return justNow;
};

const NotificationsPage: React.FC = () => {
  const { t, dir, lang } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [pendingDelete, setPendingDelete] = useState<null | { type: 'single'; id: string } | { type: 'all' }>(null);

  const { data: allResponse, isLoading: loadingAll } = useNotifications(1);
  const { data: unreadResponse, isLoading: loadingUnread } = useUnreadNotifications();

  const deleteMutation = useDeleteNotification();
  const deleteAllMutation = useDeleteAllNotifications();

  const allNotifications = (allResponse as any)?.data || [];
  const unreadNotifications = (unreadResponse as any) || [];

  const notifications = activeTab === 'all' ? allNotifications : unreadNotifications;
  const loading = activeTab === 'all' ? loadingAll : loadingUnread;
  const isDeleting = deleteMutation.isPending || deleteAllMutation.isPending;

  const handleConfirmDelete = () => {
    if (!pendingDelete || isDeleting) return;

    if (pendingDelete.type === 'all') {
      deleteAllMutation.mutate(undefined, {
        onSuccess: () => {
          toast.success(t('notifications.toast.deleteAllSuccess'), { closeButton: true });
          setPendingDelete(null);
        },
        onError: () => {
          toast.error(t('notifications.toast.deleteAllError'), { closeButton: true });
        },
      });
      return;
    }

    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success(t('notifications.toast.deleteSuccess'), { closeButton: true });
        setPendingDelete(null);
      },
      onError: () => {
        toast.error(t('notifications.toast.deleteError'), { closeButton: true });
      },
    });
  };

  return (
    <div className="w-full min-h-screen bg-bg dark:bg-slate-950 p-4 pb-24 animate-fade-in" dir={dir}>
      {notifications.length > 0 && activeTab === 'all' && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setPendingDelete({ type: 'all' })}
            disabled={isDeleting}
            className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
          >
            {deleteAllMutation.isPending ? t('notifications.actions.deleting') : t('notifications.actions.clearAll')}
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-pale dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'all' ? 'bg-navy text-white dark:bg-slate-800 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800/50'}`}
        >
          {t('notifications.tabs.all')}
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'unread' ? 'bg-navy text-white dark:bg-slate-800 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800/50'}`}
        >
          {t('notifications.tabs.unread')}
          {unreadNotifications.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
              {unreadNotifications.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <SpinnerIcon className="w-8 h-8 text-navy dark:text-blue animate-spin" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="flex flex-col gap-3">
          {notifications.map((notif: any) => {
            const isRead = notif.read_at !== null;
            const { title, body: message } = getNotificationCopy(notif);
            // Resolves ads *and* the hotel types (`new_message`,
            // `hotel_content_hidden`) to a destination — see notification-routing.
            const target = resolveNotificationTarget(notif);
            const canOpenTarget = Boolean(target);
            const openLabel =
              target?.to === '/conversations/$id'
                ? t('hotels.chat.title')
                : target?.to === '/profile/hotel-contents'
                  ? t('hotels.content.manageCta')
                  : t('notifications.list.viewAd');
            const timeLabel = formatRelativeTime(
              notif.created_at,
              notif.created_at_diff,
              lang,
              t('notifications.time.justNow')
            );
            const cardClasses = `w-full text-start p-4 rounded-xl shadow-sm border relative group transition-colors duration-300 ${canOpenTarget ? 'hover:border-navy/30 dark:hover:border-blue/30' : ''} ${isRead ? 'bg-white dark:bg-slate-900 border-pale dark:border-slate-800' : 'bg-navy/5 dark:bg-blue/5 border-navy/20 dark:border-blue/20'}`;
            return (
            <div
              key={notif.id}
              className={`${cardClasses} overflow-hidden`}
            >
              <button
                  type="button"
                  aria-label={t('notifications.actions.deleteNotification')}
                  title={t('notifications.actions.deleteNotification')}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClickCapture={(e) => {
                    e.stopPropagation();
                    setPendingDelete({ type: 'single', id: notif.id.toString() });
                  }}
                  disabled={isDeleting}
                  className="absolute top-3 end-3 w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center opacity-70 hover:opacity-100 active:scale-95"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
              </button>
              {canOpenTarget && target ? (
                <Link
                  to={target.to}
                  {...('params' in target ? { params: target.params } : {})}
                  className="block pe-10"
                >
                  <h4 className="font-bold text-navy dark:text-slate-200 text-sm mb-1 me-6">{title}</h4>
                  {!!message && <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-2 whitespace-pre-line">{message}</p>}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center justify-center rounded-lg bg-navy px-3 py-2 text-xs font-bold text-white transition active:scale-95 dark:bg-blue">
                      {openLabel}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">{timeLabel}</span>
                  </div>
                </Link>
              ) : (
                <>
                  <h4 className="font-bold text-navy dark:text-slate-200 text-sm mb-1 me-6">{title}</h4>
                  {!!message && <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-2 whitespace-pre-line">{message}</p>}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500">
                      {t('notifications.list.noTarget')}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">{timeLabel}</span>
                  </div>
                </>
              )}
            </div>
          )})}
        </div>
      ) : (
        <div className="py-32 flex flex-col items-center justify-center text-center px-6">
           <div className="w-16 h-16 bg-navy/5 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <BellIcon className="w-8 h-8 text-navy/40 dark:text-slate-500" />
           </div>
           <p className="text-sm font-bold text-gray-500 dark:text-slate-400 leading-relaxed">{t('notifications.list.empty')}</p>
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-start shadow-2xl dark:bg-slate-900">
            <h3 className="mb-2 text-base font-bold text-navy dark:text-slate-100">{t('notifications.confirmDelete.title')}</h3>
            <p className="mb-5 text-sm font-medium leading-6 text-gray-500 dark:text-slate-400">
              {pendingDelete.type === 'all'
                ? t('notifications.confirmDelete.messageAll')
                : t('notifications.confirmDelete.messageSingle')}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition active:scale-95 disabled:opacity-60"
              >
                {isDeleting ? t('notifications.actions.deleting') : t('common.delete')}
              </button>
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 transition active:scale-95 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
