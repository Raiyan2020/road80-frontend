import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import { SpinnerIcon, BellIcon } from './Icons';
import { useNotifications, useDeleteNotification, useDeleteAllNotifications, useUnreadNotifications } from '../features/notifications/hooks/use-notifications';
import { getNotificationCopy } from '../shared/utils/notifications';

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

const NotificationsPage: React.FC = () => {
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
          toast.success('تم حذف كل الإشعارات بنجاح', { closeButton: true });
          setPendingDelete(null);
        },
        onError: () => {
          toast.error('حدث خطأ أثناء حذف الإشعارات', { closeButton: true });
        },
      });
      return;
    }

    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success('تم حذف الإشعار بنجاح', { closeButton: true });
        setPendingDelete(null);
      },
      onError: () => {
        toast.error('حدث خطأ أثناء حذف الإشعار', { closeButton: true });
      },
    });
  };

  return (
    <div className="w-full min-h-screen bg-bg dark:bg-slate-950 p-4 pb-24 animate-fade-in" dir="rtl">
      {notifications.length > 0 && activeTab === 'all' && (
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => setPendingDelete({ type: 'all' })}
            disabled={isDeleting}
            className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
          >
            {deleteAllMutation.isPending ? 'جاري الحذف...' : 'مسح الكل'}
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-pale dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'all' ? 'bg-navy text-white dark:bg-slate-800 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800/50'}`}
        >
          الكل
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'unread' ? 'bg-navy text-white dark:bg-slate-800 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800/50'}`}
        >
          غير مقروءة
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
            const adId = getNotificationAdId(notif);
            const canOpenTarget = Boolean(adId);
            const cardClasses = `w-full text-right p-4 rounded-xl shadow-sm border relative group transition-colors duration-300 ${canOpenTarget ? 'hover:border-navy/30 dark:hover:border-blue/30' : ''} ${isRead ? 'bg-white dark:bg-slate-900 border-pale dark:border-slate-800' : 'bg-navy/5 dark:bg-blue/5 border-navy/20 dark:border-blue/20'}`;
            return (
            <div
              key={notif.id}
              className={`${cardClasses} overflow-hidden`}
            >
              <button 
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClickCapture={(e) => {
                    e.stopPropagation();
                    setPendingDelete({ type: 'single', id: notif.id.toString() });
                  }}
                  disabled={isDeleting}
                  className="absolute top-3 left-3 w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center opacity-70 hover:opacity-100 active:scale-95"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
              </button>
              {canOpenTarget ? (
                <Link
                  to="/ad/$id"
                  params={{ id: String(adId) }}
                  className="block pr-10"
                >
                  <h4 className="font-bold text-navy dark:text-slate-200 text-sm mb-1 ml-6">{title}</h4>
                  {!!message && <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-2 whitespace-pre-line">{message}</p>}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center justify-center rounded-lg bg-navy px-3 py-2 text-xs font-bold text-white transition active:scale-95 dark:bg-blue">
                      عرض الإعلان
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">{notif.created_at_diff || notif.created_at}</span>
                  </div>
                </Link>
              ) : (
                <>
                  <h4 className="font-bold text-navy dark:text-slate-200 text-sm mb-1 ml-6">{title}</h4>
                  {!!message && <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-2 whitespace-pre-line">{message}</p>}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500">
                      لا يوجد رابط مرتبط بهذا الإشعار
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">{notif.created_at_diff || notif.created_at}</span>
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
           <p className="text-sm font-bold text-gray-500 dark:text-slate-400 leading-relaxed">لا توجد إشعارات حالياً</p>
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-right shadow-2xl dark:bg-slate-900">
            <h3 className="mb-2 text-base font-bold text-navy dark:text-slate-100">تأكيد الحذف</h3>
            <p className="mb-5 text-sm font-medium leading-6 text-gray-500 dark:text-slate-400">
              {pendingDelete.type === 'all'
                ? 'هل أنت متأكد من حذف كل الإشعارات؟'
                : 'هل أنت متأكد من حذف هذا الإشعار؟'}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition active:scale-95 disabled:opacity-60"
              >
                {isDeleting ? 'جاري الحذف...' : 'حذف'}
              </button>
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 transition active:scale-95 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
