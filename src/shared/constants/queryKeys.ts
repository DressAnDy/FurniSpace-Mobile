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
    byUser: (userId: string, query: ProjectListQueryKey) => ["project", "by-user", userId, query] as const,
    detail: (projectId: string) => ["project", "detail", projectId] as const,
    phaseDeadlines: (projectId: string) => ["project", "phase-deadlines", projectId] as const,
    schedules: (projectId: string) => ["project", "schedules", projectId] as const,
    orders: (projectId: string) => ["project", "orders", projectId] as const,
    proposals: (projectId: string, query?: { status?: string; page?: number; limit?: number }) =>
      ["project", "proposals", projectId, query ?? {}] as const,
    publishedProposal: (projectId: string) => ["project", "published-proposal", projectId] as const,
    quotations: (projectId: string, query?: { status?: string; page?: number; limit?: number }) =>
      ["project", "quotations", projectId, query ?? {}] as const,
  },
  proposal: {
    detail: (proposalId: string) => ["proposal", "detail", proposalId] as const,
    items: (proposalId: string, query?: { sceneId?: string; page?: number; limit?: number }) =>
      ["proposal", "items", proposalId, query ?? {}] as const,
  },
  quotation: {
    detail: (quotationId: string) => ["quotation", "detail", quotationId] as const,
  },
  order: {
    detail: (orderId: string) => ["order", "detail", orderId] as const,
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
