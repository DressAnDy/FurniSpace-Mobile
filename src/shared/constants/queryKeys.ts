export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  notification: {
    unreadCount: ["notification", "unread-count"] as const,
    list: (filter: string) => ["notification", "list", filter] as const,
  },
  chat: {
    projectList: (projectId: string) => ["chat", "project-list", projectId] as const,
    messages: (chatId: string) => ["chat", "messages", chatId] as const,
    search: (projectId: string, query: string) => ["chat", "search", projectId, query] as const,
  },
  project: {
    list: (query: ProjectListQueryKey) => ["project", "list", query] as const,
    detail: (projectId: string) => ["project", "detail", projectId] as const,
  },
  payment: {
    detail: (paymentId: string) => ["payment", "detail", paymentId] as const,
    list: (query: PaymentListQueryKey) => ["payment", "list", query] as const,
    statusByCode: (paymentCode: string) => ["payment", "status-by-code", paymentCode] as const,
  },
} as const;

type PaymentListQueryKey = {
  projectId?: string;
  orderId?: string;
  status?: string;
  paymentType?: string;
  page?: number;
  limit?: number;
};

type ProjectListQueryKey = {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
};
