export const endpoints = {
  auth: {
    login: "/auth/login",
    refresh: "/auth/refresh",
    me: "/auth/me",
    changePassword: "/auth/me/password",
    logout: "/auth/logout",
  },
  notifications: {
    list: "/notifications/me",
    unreadCount: "/notifications/me/unread-count",
    markRead: (notificationId: string) => `/notifications/${notificationId}/read`,
    markAllRead: "/notifications/me/read-all",
  },
} as const;
