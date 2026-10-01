import {
  ChatAttachmentDto,
  ChatListItem,
  ChatMessageDto,
  ChatMessageListItem,
  CustomerChatTab,
  ProjectChatSummaryDto,
  ProjectChatType,
  SALE_CHAT_CHANNELS,
  SaleChatChannel,
} from "../models/chat.model";

const CHAT_TYPE_LABELS: Record<ProjectChatType, string> = {
  SALES: "Sales Consultant",
  DESIGNER: "Designer",
  DESIGNER_SALES: "Designer",
  PRODUCTION: "Production",
  DELIVERY: "Delivery",
  GENERAL: "General",
  INTERNAL: "Internal",
};

const SALE_CHANNEL_LABELS: Record<SaleChatChannel, string> = {
  SALES: "Customer",
  DESIGNER_SALES: "Designer",
  PRODUCTION: "Production",
};

const ALL_CHAT_TYPES = new Set<string>([
  "SALES",
  "DESIGNER",
  "DESIGNER_SALES",
  "PRODUCTION",
  "DELIVERY",
  "GENERAL",
  "INTERNAL",
]);

const AVATAR_COLORS = ["#3A3330", "#C9A86A", "#7A6F68", "#16A34A", "#2563EB"];

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeChatAttachment(value: unknown): ChatAttachmentDto | null {
  if (!value || typeof value !== "object") return null;
  const attachment = value as Record<string, unknown>;
  const fileUrl =
    readString(attachment.fileUrl) ||
    readString(attachment.publicUrl) ||
    readString(attachment.url);
  const rawFileSize = attachment.fileSizeBytes ?? attachment.fileSize;
  return {
    fileId: readString(attachment.fileId),
    originalFileName:
      readString(attachment.originalFileName) ||
      readString(attachment.fileName) ||
      "Attached file",
    mimeType: readString(attachment.mimeType, "application/octet-stream"),
    fileSizeBytes: typeof rawFileSize === "number" ? rawFileSize : 0,
    fileUrl,
  };
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function normalizeProjectChatType(value: unknown): ProjectChatType | null {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (!ALL_CHAT_TYPES.has(raw)) {
    return null;
  }
  return raw as ProjectChatType;
}

export function isSaleChatChannel(chatType: ProjectChatType): chatType is SaleChatChannel {
  return (SALE_CHAT_CHANNELS as readonly string[]).includes(chatType);
}

export function getSaleChannelLabel(chatType: ProjectChatType): string {
  if (isSaleChatChannel(chatType)) {
    return SALE_CHANNEL_LABELS[chatType];
  }
  return getChatTypeLabel(chatType);
}

export function getSaleChannelInitials(chatType: ProjectChatType): string {
  if (chatType === "DESIGNER_SALES") return "DS";
  if (chatType === "PRODUCTION") return "PR";
  if (chatType === "SALES") return "CU";
  return "CH";
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
  return CHAT_TYPE_LABELS[chatType] ?? chatType;
}

export function getCustomerTabLabel(tab: CustomerChatTab): string {
  return tab === "SALES" ? "Sales" : "Design";
}

export function formatSaleChatSubtitle(chat: {
  chatType: ProjectChatType;
  roleLabel: string;
  staffName: string;
  channelLabel: string;
}): string {
  const typeLabel = chat.channelLabel || getSaleChannelLabel(chat.chatType);
  const name = chat.staffName?.trim();
  if (!name) {
    return typeLabel;
  }
  const normalizedName = name.toLowerCase();
  if (
    normalizedName === typeLabel.toLowerCase() ||
    normalizedName === chat.roleLabel.toLowerCase() ||
    (normalizedName.includes("consultant") && chat.chatType === "SALES")
  ) {
    return typeLabel;
  }
  return `${typeLabel} · ${name}`;
}

export function mapProjectChatToListItem(dto: ProjectChatSummaryDto): ChatListItem | null {
  const chatType = normalizeProjectChatType(dto.chatType);
  if (!chatType) {
    return null;
  }

  const displayName = dto.staffName || dto.title;

  return {
    chatId: dto.chatId,
    projectId: dto.projectId,
    chatType,
    staffName: dto.staffName,
    title: dto.title,
    status: dto.status,
    initials: getInitials(displayName),
    avatarColor: getAvatarColor(dto.chatId),
    roleLabel: getChatTypeLabel(chatType),
    channelLabel: getSaleChannelLabel(chatType),
    preview: dto.lastMessage?.contentPreview ?? "No messages yet",
    timeLabel: dto.lastMessage ? formatChatTime(dto.lastMessage.createdAt) : formatChatTime(dto.createdAt),
    isOpen: dto.status === "OPEN",
    lastMessageSenderId: dto.lastMessage?.senderId ?? null,
    lastMessageCreatedAt: dto.lastMessage?.createdAt ?? null,
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
    attachment: isDeleted ? null : normalizeChatAttachment(dto.attachment),
    timeLabel: formatMessageTime(dto.createdAt),
    createdAt: dto.createdAt,
    isDeleted,
  };
}

export function sortMessagesAscending(messages: ChatMessageListItem[]): ChatMessageListItem[] {
  return [...messages].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export function hasUnreadSaleChat(
  chat: Pick<ChatListItem, "lastMessageSenderId" | "lastMessageCreatedAt">,
  currentUserId: string | null,
  readAtIso: string | null | undefined,
  pendingCount = 0,
): boolean {
  if (pendingCount > 0) {
    return true;
  }
  const senderId = chat.lastMessageSenderId;
  const createdAt = chat.lastMessageCreatedAt;
  if (!senderId || !createdAt || !currentUserId) {
    return false;
  }
  if (String(senderId) === String(currentUserId)) {
    return false;
  }
  if (!readAtIso) {
    return true;
  }
  return createdAt > readAtIso;
}
