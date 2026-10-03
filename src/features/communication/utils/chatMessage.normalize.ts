import { ChatAttachmentDto, ChatMessageDto, ChatMessageType } from "../models/chat.model";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function pickString(source: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    // Guid / numeric ids sometimes arrive as non-strings from serializers.
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return null;
}

function pickDateIso(source: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      const ms = value < 1_000_000_000_000 ? value * 1000 : value;
      const date = new Date(ms);
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
  }

  return null;
}

function normalizeMessageType(value: string | null): ChatMessageType | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  if (normalized === "TEXT" || normalized === "FILE" || normalized === "SYSTEM") {
    return normalized;
  }
  return null;
}

function normalizeAttachment(raw: unknown): ChatAttachmentDto | null {
  const attachment = asRecord(raw);
  if (!attachment) {
    return null;
  }

  return {
    fileId: pickString(attachment, "fileId", "FileId") ?? "",
    originalFileName: pickString(attachment, "originalFileName", "OriginalFileName") ?? "file",
    mimeType: pickString(attachment, "mimeType", "MimeType") ?? "application/octet-stream",
    fileSizeBytes: Number(attachment.fileSizeBytes ?? attachment.FileSizeBytes ?? 0),
    fileUrl: pickString(attachment, "fileUrl", "FileUrl") ?? "",
  };
}

export function normalizeChatMessageDto(
  rawMessage: unknown,
  fallbacks?: { chatId?: string | null },
): ChatMessageDto | null {
  const root = asRecord(rawMessage);
  if (!root) {
    return null;
  }

  // Some APIs wrap the DTO again under data/message.
  const raw = asRecord(root.data) ?? asRecord(root.message) ?? asRecord(root.Message) ?? root;

  const messageId = pickString(raw, "messageId", "MessageId", "id", "Id");
  const chatId = pickString(raw, "chatId", "ChatId") ?? fallbacks?.chatId?.trim() ?? null;
  const senderId =
    pickString(raw, "senderId", "SenderId", "senderAccountId", "SenderAccountId", "userId", "UserId") ??
    "unknown";
  const senderName = pickString(raw, "senderName", "SenderName") ?? "Unknown";
  const attachment = normalizeAttachment(raw.attachment ?? raw.Attachment);
  let content = pickString(raw, "content", "Content", "text", "Text", "body", "Body");
  if (content == null && typeof raw.content === "string") {
    content = raw.content;
  } else if (content == null && typeof raw.Content === "string") {
    content = raw.Content;
  }

  let messageType = normalizeMessageType(pickString(raw, "messageType", "MessageType", "type", "Type"));
  if (!messageType && attachment?.fileUrl) {
    messageType = "FILE";
  } else if (!messageType && content != null) {
    messageType = "TEXT";
  }
  const createdAt =
    pickDateIso(raw, "createdAt", "CreatedAt", "sentAt", "SentAt", "timestamp", "Timestamp") ??
    new Date().toISOString();

  if (!messageId || !chatId || !messageType) {
    return null;
  }

  return {
    messageId,
    chatId,
    senderId,
    senderName,
    senderRole: pickString(raw, "senderRole", "SenderRole") ?? "",
    messageType,
    content,
    attachment,
    createdAt,
    editedAt: pickDateIso(raw, "editedAt", "EditedAt"),
    deletedAt: pickDateIso(raw, "deletedAt", "DeletedAt"),
    readAt: pickDateIso(raw, "readAt", "ReadAt"),
  };
}

export function normalizeChatMessagesPage(raw: unknown): {
  items: unknown[];
  page: number;
  limit: number;
  total: number;
} {
  if (Array.isArray(raw)) {
    return { items: raw, page: 1, limit: raw.length, total: raw.length };
  }

  const record = asRecord(raw);
  if (!record) {
    return { items: [], page: 1, limit: 0, total: 0 };
  }

  const nested = asRecord(record.data) ?? asRecord(record.Data);
  const source = nested ?? record;
  const itemsRaw = source.items ?? source.Items ?? source.messages ?? source.Messages;
  const items = Array.isArray(itemsRaw) ? itemsRaw : [];

  return {
    items,
    page: Number(source.page ?? source.Page ?? 1) || 1,
    limit: Number(source.limit ?? source.Limit ?? items.length) || items.length,
    total: Number(source.total ?? source.Total ?? items.length) || items.length,
  };
}
