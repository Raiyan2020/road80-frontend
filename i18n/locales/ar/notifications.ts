export const notifications = {
  // Tabs at the top of the notifications screen
  tabs: {
    all: 'الكل',
    unread: 'غير مقروءة',
  },

  // Notification list / cards
  list: {
    empty: 'لا توجد إشعارات حالياً',
    viewAd: 'عرض الإعلان',
    noTarget: 'لا يوجد رابط مرتبط بهذا الإشعار',
    defaultTitle: 'إشعار',
  },

  // Bulk / row actions
  actions: {
    clearAll: 'مسح الكل',
    deleting: 'جاري الحذف...',
    deleteNotification: 'حذف الإشعار',
  },

  // Delete confirmation dialog
  confirmDelete: {
    title: 'تأكيد الحذف',
    messageAll: 'هل أنت متأكد من حذف كل الإشعارات؟',
    messageSingle: 'هل أنت متأكد من حذف هذا الإشعار؟',
  },

  // Toast messages
  toast: {
    deleteAllSuccess: 'تم حذف كل الإشعارات بنجاح',
    deleteAllError: 'حدث خطأ أثناء حذف الإشعارات',
    deleteSuccess: 'تم حذف الإشعار بنجاح',
    deleteError: 'حدث خطأ أثناء حذف الإشعار',
  },

  // Incoming push notifications
  push: {
    defaultTitle: 'إشعار جديد',
  },

  // Forced logout triggered by an account push notification
  forceLogout: {
    blocked: 'تم تعليق حسابك من قبل الإدارة',
    deleted: 'تم حذف حسابك من قبل الإدارة',
    sessionExpired: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً',
  },

  // Relative time
  time: {
    justNow: 'الآن',
  },
};
