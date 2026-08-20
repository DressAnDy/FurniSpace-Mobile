export type ProjectChatType = "SALES" | "DESIGNER" | "PRODUCTION" | "DELIVERY" | "GENERAL" | "INTERNAL";

export type ProjectChatStatus = "OPEN" | "CLOSED" | "ARCHIVED";

export type ChatMessageType = "TEXT" | "FILE" | "SYSTEM";

export type ChatLastMessageDto = {
  messageId: string;
  senderId: string;
  senderName: string;
  messageType: ChatMessageType;
  contentPreview: string;
  createdAt: string;
};

export type ProjectChatSummaryDto = {
  chatId: string;
  projectId: string;
  chatType: ProjectChatType;
  staffId: string;
  staffName: string;
  title: string;
  status: ProjectChatStatus;
  lastMessage: ChatLastMessageDto | null;
  createdAt: string;
  closedAt: string | null;
};

export type ChatAttachmentDto = {
  fileId: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileUrl: string;
};

export type ChatMessageDto = {
  messageId: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  messageType: ChatMessageType;
  content: string | null;
  attachment: ChatAttachmentDto | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  readAt: string | null;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

export type ProjectChatListQuery = {
  status?: ProjectChatStatus;
  chatType?: ProjectChatType;
  page?: number;
  limit?: number;
};

export type ChatMessageListQuery = {
  page?: number;
  limit?: number;
  sort?: "ASC" | "DESC";
};

export type SendTextMessageRequest = {
  messageType: "TEXT";
  content: string;
};

export type ChatSearchResultDto = {
  messageId: string;
  chatId: string;
  projectId: string;
  senderId: string;
  senderName: string;
  messageType: ChatMessageType;
  content: string;
  createdAt: string;
};

export type ChatSearchQuery = {
  q: string;
  page?: number;
  limit?: number;
};

export type ProjectChatMessageSentPayload = {
  projectId: string;
  chatId: string;
  message: ChatMessageDto;
};

export type ChatListItem = {
  chatId: string;
  projectId: string;
  chatType: ProjectChatType;
  staffName: string;
  title: string;
  status: ProjectChatStatus;
  initials: string;
  avatarColor: string;
  roleLabel: string;
  preview: string;
  timeLabel: string;
  isOpen: boolean;
};

export type ChatMessageListItem = {
  id: string;
  clientKey: string;
  chatId: string;
  senderId: string;
  senderName: string;
  isMine: boolean;
  messageType: ChatMessageType;
  content: string | null;
  attachment: ChatAttachmentDto | null;
  timeLabel: string;
  createdAt: string;
  isDeleted: boolean;
};

export type CustomerChatTab = "SALES" | "DESIGNER";
