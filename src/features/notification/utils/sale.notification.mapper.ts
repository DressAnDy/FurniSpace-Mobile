import { chatIconDefinition, bellIconDefinition } from "../../../icons/communication/definitions";
import { cubeIconDefinition } from "../../../icons/design/definitions";
import { fileTextIconDefinition } from "../../../icons/file/definitions";
import { calendarIconDefinition, clipboardIconDefinition } from "../../../icons/project/definitions";
import { checkIconDefinition } from "../../../icons/status/definitions";
import type { IconDefinition } from "../../../icons/types";
import type {
  NotificationCategory,
  NotificationDto,
  NotificationListItem,
  SaleNotificationFilter,
} from "../models/notification.model";
import {
  enrichNotificationWithProjectName,
  formatNotificationTime,
  mapNotificationDtoToListItem,
} from "./notification.mapper";
import { normalizeNotificationMetadata } from "./notification.metadata";

const SALE_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  lead: "Lead",
  proposal: "Proposal",
  quotation: "Quotation",
  order: "Order",
  payment: "Payment",
  chat: "Chat",
  production: "Production",
  project: "Project",
};

type NotificationVisual = {
  iconDefinition: IconDefinition;
  iconColor: string;
  iconBackground: string;
};

export function resolveSaleNotificationCategory(
  notificationType: string,
  referenceType: string | null,
): NotificationCategory {
  const type = notificationType.toLowerCase().replaceAll("_", ".");
  const ref = (referenceType ?? "").toUpperCase();

  if (ref === "PROJECT_CHAT_MESSAGE" || type.includes("chat") || type.includes("project_chat")) {
    return "chat";
  }
  if (ref === "PAYMENT" || type.includes("payment")) {
    return "payment";
  }
  if (ref === "PRODUCTION_REQUEST" || type.includes("production")) {
    return "production";
  }
  if (ref === "ORDER" || type.includes("order")) {
    return "order";
  }
  if (ref === "QUOTATION" || type.includes("quotation")) {
    return "quotation";
  }
  if (ref === "PROPOSAL" || type.includes("proposal") || type.includes("customization")) {
    return "proposal";
  }
  if (
    type.includes("project.request.submitted") ||
    type.includes("projectrequestsubmitted") ||
    type.includes("basic_information") ||
    type.includes("basicinformation")
  ) {
    return "lead";
  }
  if (ref === "PROJECT" || ref === "PROJECT_SCHEDULE" || type.includes("project") || type.includes("schedule")) {
    return "project";
  }

  return "project";
}

function resolveSaleNotificationVisual(
  notificationType: string,
  referenceType: string | null,
  category: NotificationCategory,
): NotificationVisual {
  const type = notificationType.toLowerCase();

  if (category === "chat" || referenceType === "PROJECT_CHAT_MESSAGE") {
    return { iconDefinition: chatIconDefinition, iconColor: "#7A6F68", iconBackground: "#F5F2ED" };
  }
  if (category === "lead") {
    return { iconDefinition: clipboardIconDefinition, iconColor: "#BB4D00", iconBackground: "#FFF4E5" };
  }
  if (category === "quotation" || referenceType === "QUOTATION") {
    return { iconDefinition: fileTextIconDefinition, iconColor: "#A8843E", iconBackground: "rgba(201,168,106,0.16)" };
  }
  if (category === "proposal" || referenceType === "PROPOSAL") {
    return { iconDefinition: cubeIconDefinition, iconColor: "#155DFC", iconBackground: "#EFF6FF" };
  }
  if (category === "payment" || referenceType === "PAYMENT") {
    return { iconDefinition: checkIconDefinition, iconColor: "#15803D", iconBackground: "#ECFDF5" };
  }
  if (category === "order" || referenceType === "ORDER") {
    return { iconDefinition: cubeIconDefinition, iconColor: "#155DFC", iconBackground: "#EFF6FF" };
  }
  if (category === "production" || referenceType === "PRODUCTION_REQUEST") {
    return { iconDefinition: calendarIconDefinition, iconColor: "#7A6F68", iconBackground: "#F5F2ED" };
  }
  if (type.includes("accepted") || type.includes("completed") || type.includes("paid")) {
    return { iconDefinition: checkIconDefinition, iconColor: "#16A34A", iconBackground: "#ECFDF5" };
  }

  return { iconDefinition: bellIconDefinition, iconColor: "#7A6F68", iconBackground: "#F5F2ED" };
}

export function mapSaleNotificationDtoToListItem(dto: NotificationDto): NotificationListItem {
  const base = mapNotificationDtoToListItem(dto);
  const category = resolveSaleNotificationCategory(dto.notificationType, dto.referenceType);
  const visual = resolveSaleNotificationVisual(dto.notificationType, dto.referenceType, category);
  const metadata = normalizeNotificationMetadata(dto.metadata);

  return {
    ...base,
    timeLabel: formatNotificationTime(dto.createdAt),
    category,
    categoryLabel: SALE_CATEGORY_LABELS[category],
    iconDefinition: visual.iconDefinition,
    iconColor: visual.iconColor,
    iconBackground: visual.iconBackground,
    metadata,
  };
}

export function filterSaleNotificationItems(
  items: NotificationListItem[],
  filter: SaleNotificationFilter,
): NotificationListItem[] {
  if (filter === "all") {
    return items;
  }
  if (filter === "unread") {
    return items.filter((item) => item.unread);
  }
  return items.filter((item) => item.category === filter);
}

export function enrichSaleNotifications(
  items: NotificationListItem[],
  projectNameById: Map<string, string>,
): NotificationListItem[] {
  return items.map((item) => {
    const enriched = enrichNotificationWithProjectName(item, projectNameById);
    if (enriched.projectLabel || !item.projectId) {
      return enriched;
    }
    const projectName = projectNameById.get(item.projectId);
    if (!projectName) {
      return enriched;
    }
    return { ...enriched, projectLabel: projectName };
  });
}
