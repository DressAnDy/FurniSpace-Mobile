import { chatIconDefinition, bellIconDefinition } from "../../../icons/communication/definitions";
import { cubeIconDefinition } from "../../../icons/design/definitions";
import { fileTextIconDefinition } from "../../../icons/file/definitions";
import { calendarIconDefinition } from "../../../icons/project/definitions";
import { checkIconDefinition } from "../../../icons/status/definitions";
import type { IconDefinition } from "../../../icons/types";
import {
  NotificationCategory,
  NotificationDto,
  NotificationListItem,
  RealtimeNotificationPayloadDto,
} from "../models/notification.model";
import {
  normalizeNotificationMetadata,
  parseChatTitleFromMessage,
  readMetadataString,
} from "./notification.metadata";

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  order: "Order",
  payment: "Payment",
  project: "Project",
};

export function resolveNotificationCategory(
  notificationType: string,
  referenceType: string | null,
): NotificationCategory {
  const type = notificationType.toLowerCase();

  if (referenceType === "PAYMENT" || type.includes("payment")) {
    return "payment";
  }

  if (
    referenceType === "ORDER" ||
    referenceType === "QUOTATION" ||
    type.includes("order") ||
    type.includes("quotation")
  ) {
    return "order";
  }

  return "project";
}

export function getNotificationCategoryLabel(category: NotificationCategory): string {
  return CATEGORY_LABELS[category];
}

type NotificationVisual = {
  iconDefinition: IconDefinition;
  iconColor: string;
  iconBackground: string;
};

function resolveNotificationVisual(notificationType: string, referenceType: string | null): NotificationVisual {
  const type = notificationType.toLowerCase();

  if (type.includes("chat") || referenceType === "PROJECT_CHAT_MESSAGE") {
    return { iconDefinition: chatIconDefinition, iconColor: "#7A6F68", iconBackground: "#F5F2ED" };
  }

  if (type.includes("quotation") || referenceType === "QUOTATION") {
    return { iconDefinition: fileTextIconDefinition, iconColor: "#9B8F86", iconBackground: "#F5F2ED" };
  }

  if (type.includes("schedule") || type.includes("installation") || type.includes("delivery")) {
    return { iconDefinition: calendarIconDefinition, iconColor: "#7A6F68", iconBackground: "#F5F2ED" };
  }

  if (type.includes("payment") || referenceType === "PAYMENT") {
    return { iconDefinition: fileTextIconDefinition, iconColor: "#C9A86A", iconBackground: "#F5F2ED" };
  }

  if (type.includes("order") || referenceType === "ORDER") {
    return { iconDefinition: cubeIconDefinition, iconColor: "#7A6F68", iconBackground: "#F5F2ED" };
  }

  if (type.includes("approved") || type.includes("accepted") || type.includes("completed") || type.includes("paid")) {
    return { iconDefinition: checkIconDefinition, iconColor: "#16A34A", iconBackground: "#ECFDF5" };
  }

  if (type.includes("proposal") || type.includes("design")) {
    return { iconDefinition: cubeIconDefinition, iconColor: "#C9A86A", iconBackground: "#F5F2ED" };
  }

  return { iconDefinition: bellIconDefinition, iconColor: "#7A6F68", iconBackground: "#F5F2ED" };
}

export function formatNotificationTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(diffMs)) {
    return "";
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "JUST NOW";
  }

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `${minutes} MIN${minutes > 1 ? "S" : ""} AGO`;
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour));
    return `${hours} HOUR${hours > 1 ? "S" : ""} AGO`;
  }

  const days = Math.max(1, Math.floor(diffMs / day));
  if (days < 7) {
    return `${days} DAY${days > 1 ? "S" : ""} AGO`;
  }

  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}

function buildChatNotificationPresentation(
  message: string,
  metadata: Record<string, unknown> | undefined,
  projectName?: string,
): Pick<NotificationListItem, "description" | "projectLabel" | "previewText"> {
  const chatTitle = parseChatTitleFromMessage(message);
  const contentPreview = readMetadataString(metadata, "contentPreview");
  const metadataProjectName = readMetadataString(metadata, "projectName");
  const resolvedProjectName = metadataProjectName ?? projectName;

  const projectLabel =
    resolvedProjectName && chatTitle
      ? `${resolvedProjectName} · ${chatTitle}`
      : resolvedProjectName ?? chatTitle;

  if (contentPreview) {
    return {
      projectLabel,
      previewText: contentPreview,
      description: contentPreview,
    };
  }

  return {
    projectLabel,
    previewText: message,
    description: message,
  };
}

export function enrichNotificationWithProjectName(
  item: NotificationListItem,
  projectNameById: Map<string, string>,
): NotificationListItem {
  if (item.referenceType !== "PROJECT_CHAT_MESSAGE") {
    return item;
  }

  const projectName = item.projectId ? projectNameById.get(item.projectId) : undefined;
  const presentation = buildChatNotificationPresentation(item.description, item.metadata, projectName);

  return {
    ...item,
    ...presentation,
  };
}

export function mapNotificationDtoToListItem(dto: NotificationDto): NotificationListItem {
  const visual = resolveNotificationVisual(dto.notificationType, dto.referenceType);
  const category = resolveNotificationCategory(dto.notificationType, dto.referenceType);
  const metadata = normalizeNotificationMetadata(dto.metadata);
  const isChatNotification = dto.referenceType === "PROJECT_CHAT_MESSAGE";
  const chatPresentation = isChatNotification ? buildChatNotificationPresentation(dto.message, metadata) : null;

  return {
    id: dto.notificationId,
    title: dto.title,
    description: chatPresentation?.description ?? dto.message,
    projectLabel: chatPresentation?.projectLabel,
    previewText: chatPresentation?.previewText,
    timeLabel: formatNotificationTime(dto.createdAt),
    iconDefinition: visual.iconDefinition,
    iconColor: visual.iconColor,
    iconBackground: visual.iconBackground,
    unread: !dto.isRead,
    category,
    categoryLabel: getNotificationCategoryLabel(category),
    notificationType: dto.notificationType,
    referenceType: dto.referenceType,
    referenceId: dto.referenceId,
    projectId: dto.projectId,
    metadata,
  };
}

export function mapRealtimePayloadToListItem(payload: RealtimeNotificationPayloadDto): NotificationListItem | null {
  if (!payload.notificationId) {
    return null;
  }

  const visual = resolveNotificationVisual(payload.notificationType, payload.referenceType);
  const category = resolveNotificationCategory(payload.notificationType, payload.referenceType);
  const metadata = normalizeNotificationMetadata(payload.metadata);
  const isChatNotification = payload.referenceType === "PROJECT_CHAT_MESSAGE";
  const chatPresentation = isChatNotification
    ? buildChatNotificationPresentation(payload.message, metadata)
    : null;

  return {
    id: payload.notificationId,
    title: payload.title,
    description: chatPresentation?.description ?? payload.message,
    projectLabel: chatPresentation?.projectLabel,
    previewText: chatPresentation?.previewText,
    timeLabel: formatNotificationTime(payload.createdAt || payload.occurredAt),
    iconDefinition: visual.iconDefinition,
    iconColor: visual.iconColor,
    iconBackground: visual.iconBackground,
    unread: true,
    category,
    categoryLabel: getNotificationCategoryLabel(category),
    notificationType: payload.notificationType,
    referenceType: payload.referenceType,
    referenceId: payload.referenceId,
    projectId: payload.projectId,
    metadata,
  };
}
