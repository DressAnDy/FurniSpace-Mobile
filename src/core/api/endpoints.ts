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
  chat: {
    listByProject: (projectId: string) => `/projects/${projectId}/chats`,
    messages: (chatId: string) => `/project-chats/${chatId}/messages`,
    sendMessage: (chatId: string) => `/project-chats/${chatId}/messages`,
    sendFile: (chatId: string) => `/project-chats/${chatId}/messages/files`,
    search: (projectId: string) => `/projects/${projectId}/chat-messages/search`,
  },
  projects: {
    list: "/projects",
    create: "/projects",
    byUser: (userId: string) => `/projects/by-user/${userId}`,
    detail: (projectId: string) => `/projects/${projectId}`,
    publishedProposal: (projectId: string) => `/projects/${projectId}/published-proposal`,
    updateBasicInfo: (projectId: string) => `/projects/${projectId}/basic-information`,
    updateTargetDate: (projectId: string) => `/projects/${projectId}/target-completion-date`,
    reopenProposal: (projectId: string) => `/projects/${projectId}/reopen-proposal`,
  },
} as const;
