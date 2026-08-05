export const notifications = {
  // Tabs at the top of the notifications screen
  tabs: {
    all: 'All',
    unread: 'Unread',
  },

  // Notification list / cards
  list: {
    empty: 'No notifications yet',
    viewAd: 'View ad',
    noTarget: 'This notification has no linked content',
    defaultTitle: 'Notification',
  },

  // Bulk / row actions
  actions: {
    clearAll: 'Clear all',
    deleting: 'Deleting...',
    deleteNotification: 'Delete notification',
  },

  // Delete confirmation dialog
  confirmDelete: {
    title: 'Confirm deletion',
    messageAll: 'Are you sure you want to delete all notifications?',
    messageSingle: 'Are you sure you want to delete this notification?',
  },

  // Toast messages
  toast: {
    deleteAllSuccess: 'All notifications deleted',
    deleteAllError: 'Something went wrong while deleting the notifications',
    deleteSuccess: 'Notification deleted',
    deleteError: 'Something went wrong while deleting the notification',
  },

  // Incoming push notifications
  push: {
    defaultTitle: 'New notification',
  },

  // Forced logout triggered by an account push notification
  forceLogout: {
    blocked: 'Your account has been suspended by an administrator',
    deleted: 'Your account has been deleted by an administrator',
    sessionExpired: 'Your session has expired, please log in again',
  },

  // Relative time
  time: {
    justNow: 'Just now',
  },
};
