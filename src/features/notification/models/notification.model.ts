import type { IconDefinition } from "../../../icons/types";

export type NotificationReferenceType =
  | "QUOTATION"
  | "ORDER"
  | "PAYMENT"
  | "PROJECT_CHAT_MESSAGE"
  | "CUSTOMIZATION_REQUEST"
  | string
  | null;

export type NotificationDto = {
  notificationId: string;
  receiverId: string;
  projectId: string | null;
  title: string;
  message: string;
  notificationType: string;
  referenceType: NotificationReferenceType;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
};

export type NotificationListResponseDto = {
  items: NotificationDto[];
  page: number;
  limit: number;
  total: number;
};

export type UnreadCountResponseDto = {
  unreadCount: number;
};

export type MarkReadResponseDto = {
  notificationId: string;
  isRead: boolean;
  readAt: string;
};

export type RealtimeNotificationPayloadDto = {
  notificationId: string | null;
  title: string;
  message: string;
  notificationType: string;
  projectId: string | null;
  referenceType: NotificationReferenceType;
  referenceId: string | null;
  createdAt: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
};

export type NotificationListQuery = {
  isUnread?: boolean;
  page?: number;
  limit?: number;
};

export type NotificationFilter = "all" | "unread" | "read";

export type NotificationListItem = {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  iconDefinition: IconDefinition;
  iconColor: string;
  iconBackground: string;
  unread: boolean;
  notificationType: string;
  referenceType: NotificationReferenceType;
  referenceId: string | null;
  projectId: string | null;
  metadata?: Record<string, unknown>;
};
