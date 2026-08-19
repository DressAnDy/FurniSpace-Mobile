export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  notification: {
    unreadCount: ["notification", "unread-count"] as const,
    list: (filter: string) => ["notification", "list", filter] as const,
  },
} as const;
