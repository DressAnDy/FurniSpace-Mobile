import type { IconDefinition } from "../../../icons/types";

export type NotificationCategory =
  | "order"
  | "payment"
  | "project"
  | "lead"
  | "proposal"
  | "quotation"
  | "chat"
  | "production";

export type NotificationReferenceType =
  | "PROJECT"
  | "PROPOSAL"
  | "QUOTATION"
  | "ORDER"
  | "PAYMENT"
  | "PRODUCTION_REQUEST"
  | "CUSTOMIZATION_REQUEST"
  | "PROJECT_SCHEDULE"
  | "PROJECT_CHAT_MESSAGE"
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
  metadata?: unknown;
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

export type NotificationFilter = "all" | Extract<NotificationCategory, "order" | "payment" | "project">;
export type SaleNotificationFilter = "all" | "unread" | NotificationCategory;

export type NotificationListItem = {
  id: string;
  title: string;
  description: string;
  projectLabel?: string;
  previewText?: string;
  timeLabel: string;
  iconDefinition: IconDefinition;
  iconColor: string;
  iconBackground: string;
  unread: boolean;
  category: NotificationCategory;
  categoryLabel: string;
  notificationType: string;
  referenceType: NotificationReferenceType;
  referenceId: string | null;
  projectId: string | null;
  metadata?: Record<string, unknown>;
};
