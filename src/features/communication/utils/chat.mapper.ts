import {
  ChatListItem,
  ChatMessageDto,
  ChatMessageListItem,
  CustomerChatTab,
  ProjectChatSummaryDto,
  ProjectChatType,
} from "../models/chat.model";

const CHAT_TYPE_LABELS: Record<ProjectChatType, string> = {
  SALES: "Sales Consultant",
  DESIGNER: "Designer",
  PRODUCTION: "Production",
  DELIVERY: "Delivery",
  GENERAL: "General",
  INTERNAL: "Internal",
};

const AVATAR_COLORS = ["#3A3330", "#C9A86A", "#7A6F68", "#16A34A", "#2563EB"];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function getAvatarColor(seed: string): string {
  return AVATAR_COLORS[hashString(seed) % AVATAR_COLORS.length];
}

export function formatChatTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(diffMs)) {
    return "";
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "Just now";
  }

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `${minutes}m ago`;
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour));
    return `${hours}h ago`;
  }

  const days = Math.max(1, Math.floor(diffMs / day));
  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

export function formatMessageTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function getChatTypeLabel(chatType: ProjectChatType): string {
  return CHAT_TYPE_LABELS[chatType];
}

export function getCustomerTabLabel(tab: CustomerChatTab): string {
  return tab === "SALES" ? "Sales" : "Design";
}

export function mapProjectChatToListItem(dto: ProjectChatSummaryDto): ChatListItem {
  const displayName = dto.staffName || dto.title;

  return {
    chatId: dto.chatId,
    projectId: dto.projectId,
    chatType: dto.chatType,
    staffName: dto.staffName,
    title: dto.title,
    status: dto.status,
    initials: getInitials(displayName),
    avatarColor: getAvatarColor(dto.chatId),
    roleLabel: getChatTypeLabel(dto.chatType),
    preview: dto.lastMessage?.contentPreview ?? "No messages yet",
    timeLabel: dto.lastMessage ? formatChatTime(dto.lastMessage.createdAt) : formatChatTime(dto.createdAt),
    isOpen: dto.status === "OPEN",
  };
}

export function mapChatMessageToListItem(dto: ChatMessageDto, currentUserId: string | null): ChatMessageListItem {
  const isDeleted = Boolean(dto.deletedAt);
  const senderId = String(dto.senderId ?? "");
  const myId = currentUserId ? String(currentUserId) : "";

  return {
    id: dto.messageId,
    clientKey: dto.messageId,
    chatId: dto.chatId,
    senderId,
    senderName: dto.senderName,
    isMine: Boolean(myId && senderId && senderId === myId),
    messageType: dto.messageType,
    content: isDeleted ? null : dto.content,
    attachment: isDeleted ? null : dto.attachment,
    timeLabel: formatMessageTime(dto.createdAt),
    createdAt: dto.createdAt,
    isDeleted,
  };
}

export function sortMessagesAscending(messages: ChatMessageListItem[]): ChatMessageListItem[] {
  return [...messages].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}
