import { ChatAttachmentDto, ChatMessageDto, ChatMessageType } from "../models/chat.model";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function pickString(source: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
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

export function normalizeChatMessageDto(rawMessage: unknown): ChatMessageDto | null {
  const root = asRecord(rawMessage);
  if (!root) {
    return null;
  }

  // Some APIs wrap the DTO again under data/message.
  const raw = asRecord(root.data) ?? asRecord(root.message) ?? asRecord(root.Message) ?? root;

  const messageId = pickString(raw, "messageId", "MessageId");
  const chatId = pickString(raw, "chatId", "ChatId");
  const senderId = pickString(raw, "senderId", "SenderId");
  const senderName = pickString(raw, "senderName", "SenderName") ?? "Unknown";
  const messageType = pickString(raw, "messageType", "MessageType") as ChatMessageType | null;
  const createdAt = pickString(raw, "createdAt", "CreatedAt");

  if (!messageId || !chatId || !senderId || !messageType || !createdAt) {
    return null;
  }

  return {
    messageId,
    chatId,
    senderId,
    senderName,
    senderRole: pickString(raw, "senderRole", "SenderRole") ?? "",
    messageType,
    content: pickString(raw, "content", "Content"),
    attachment: normalizeAttachment(raw.attachment ?? raw.Attachment),
    createdAt,
    editedAt: pickString(raw, "editedAt", "EditedAt"),
    deletedAt: pickString(raw, "deletedAt", "DeletedAt"),
    readAt: pickString(raw, "readAt", "ReadAt"),
  };
}
