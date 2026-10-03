import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { ChatMessageDto, ProjectChatMessageSentPayload } from "../../features/communication/models/chat.model";
import { ensureFreshAccessToken } from "../api/interceptors";
import {
  getHubUrl,
  getSignalRRetryDelay,
  getSignalRTransportOptions,
  safeHubStart,
  signalRLogLevel,
} from "./signalr.config";

export const PROJECT_CHAT_MESSAGE_SENT_EVENT = "project_chat.message_sent";

type ProjectChatEventHandler = (payload: ProjectChatMessageSentPayload) => void;

let connection: HubConnection | null = null;
let connectTask: Promise<boolean> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let allowReconnect = true;
const handlers = new Set<ProjectChatEventHandler>();
const joinedChatIds = new Set<string>();

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

function normalizeChatMessage(rawMessage: unknown): ChatMessageDto | null {
  const raw = asRecord(rawMessage);
  if (!raw) {
    return null;
  }

  const messageId = pickString(raw, "messageId", "MessageId");
  const chatId = pickString(raw, "chatId", "ChatId");
  const senderId = pickString(raw, "senderId", "SenderId");
  const senderName = pickString(raw, "senderName", "SenderName") ?? "Unknown";
  const messageType = pickString(raw, "messageType", "MessageType") as ChatMessageDto["messageType"] | null;
  const createdAt = pickString(raw, "createdAt", "CreatedAt");

  if (!messageId || !chatId || !senderId || !messageType || !createdAt) {
    return null;
  }

  const attachmentRaw = asRecord(raw.attachment ?? raw.Attachment);

  return {
    messageId,
    chatId,
    senderId,
    senderName,
    senderRole: pickString(raw, "senderRole", "SenderRole") ?? "",
    messageType,
    content: (pickString(raw, "content", "Content") as string | null) ?? null,
    attachment: attachmentRaw
      ? {
          fileId: pickString(attachmentRaw, "fileId", "FileId") ?? "",
          originalFileName: pickString(attachmentRaw, "originalFileName", "OriginalFileName") ?? "file",
          mimeType: pickString(attachmentRaw, "mimeType", "MimeType") ?? "application/octet-stream",
          fileSizeBytes: Number(attachmentRaw.fileSizeBytes ?? attachmentRaw.FileSizeBytes ?? 0),
          fileUrl: pickString(attachmentRaw, "fileUrl", "FileUrl") ?? "",
        }
      : null,
    createdAt,
    editedAt: pickString(raw, "editedAt", "EditedAt"),
    deletedAt: pickString(raw, "deletedAt", "DeletedAt"),
    readAt: pickString(raw, "readAt", "ReadAt"),
  };
}

function normalizeProjectChatPayload(payload: unknown): ProjectChatMessageSentPayload | null {
  const raw = asRecord(payload);
  if (!raw) {
    return null;
  }

  const message = normalizeChatMessage(raw.message ?? raw.Message);
  const chatId = pickString(raw, "chatId", "ChatId") ?? message?.chatId ?? null;
  const projectId = pickString(raw, "projectId", "ProjectId");

  if (!message || !chatId || !projectId) {
    return null;
  }

  return {
    projectId,
    chatId,
    message: {
      ...message,
      chatId,
    },
  };
}

function clearReconnectTimer(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function scheduleProjectChatHubReconnect(): void {
  if (!allowReconnect || connectTask || reconnectTimer || joinedChatIds.size === 0) {
    return;
  }

  const delay = Math.min(2000 * 2 ** reconnectAttempt, 30000);
  reconnectAttempt += 1;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void ensureFreshAccessToken().then((token) => {
      if (!token || !allowReconnect || joinedChatIds.size === 0) {
        return;
      }
      void connectProjectChatHub().then((connected) => {
        if (connected) {
          reconnectAttempt = 0;
        } else {
          scheduleProjectChatHubReconnect();
        }
      });
    });
  }, delay);
}

function attachEventHandlers(hub: HubConnection): void {
  hub.off(PROJECT_CHAT_MESSAGE_SENT_EVENT);
  hub.on(PROJECT_CHAT_MESSAGE_SENT_EVENT, (payload: unknown) => {
    const normalized = normalizeProjectChatPayload(payload);
    if (!normalized) {
      return;
    }

    for (const handler of handlers) {
      handler(normalized);
    }
  });

  hub.onreconnected(async () => {
    reconnectAttempt = 0;
    await rejoinActiveChats();
  });

  hub.onclose(() => {
    if (connection === hub) {
      connection = null;
    }
    scheduleProjectChatHubReconnect();
  });
}

async function rejoinActiveChats(): Promise<void> {
  if (!connection || connection.state !== HubConnectionState.Connected) {
    return;
  }

  await Promise.all(
    [...joinedChatIds].map((chatId) =>
      connection!
        .invoke("JoinChat", chatId)
        .catch(async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          await connection?.invoke("JoinChat", chatId).catch(() => undefined);
        }),
    ),
  );
}

async function invokeJoinChat(chatId: string): Promise<void> {
  if (!connection || connection.state !== HubConnectionState.Connected) {
    return;
  }

  await connection.invoke("JoinChat", chatId).catch(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await connection?.invoke("JoinChat", chatId).catch(() => undefined);
  });
}

async function ensureJoinedChat(chatId: string, attempt = 0): Promise<void> {
  const connected = await connectProjectChatHub();
  if (connected) {
    await invokeJoinChat(chatId);
    return;
  }

  if (attempt >= 5) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
  await ensureJoinedChat(chatId, attempt + 1);
}

export function subscribeProjectChatHub(handler: ProjectChatEventHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export async function connectProjectChatHub(): Promise<boolean> {
  if (connection?.state === HubConnectionState.Connected) {
    return true;
  }

  if (connectTask) {
    return connectTask;
  }

  connectTask = (async () => {
    allowReconnect = true;
    const accessToken = await ensureFreshAccessToken();
    if (!accessToken) {
      return false;
    }

    if (connection?.state === HubConnectionState.Connected) {
      return true;
    }

    clearReconnectTimer();

    if (connection) {
      await connection.stop().catch(() => undefined);
      connection = null;
    }

    const hub = new HubConnectionBuilder()
      .withUrl(getHubUrl("/hubs/project-chat"), getSignalRTransportOptions())
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (context) =>
          getSignalRRetryDelay(context.previousRetryCount, context.retryReason),
      })
      .configureLogging(signalRLogLevel)
      .build();

    attachEventHandlers(hub);
    connection = hub;

    const started = await safeHubStart(() => hub.start());
    if (started) {
      reconnectAttempt = 0;
      await rejoinActiveChats();
    } else {
      if (connection === hub) {
        connection = null;
      }
      scheduleProjectChatHubReconnect();
    }

    return started;
  })().finally(() => {
    connectTask = null;
  });

  return connectTask;
}

export async function disconnectProjectChatHub(): Promise<void> {
  allowReconnect = false;
  joinedChatIds.clear();
  clearReconnectTimer();
  reconnectAttempt = 0;

  if (!connection) {
    return;
  }

  const hub = connection;
  connection = null;
  await hub.stop().catch(() => undefined);
}

export async function restartProjectChatHub(): Promise<boolean> {
  if (joinedChatIds.size === 0) {
    return false;
  }

  clearReconnectTimer();
  allowReconnect = true;
  const hub = connection;
  connection = null;
  await hub?.stop().catch(() => undefined);
  return connectProjectChatHub();
}

export async function joinProjectChat(chatId: string): Promise<void> {
  joinedChatIds.add(chatId);
  await ensureJoinedChat(chatId);
}

export async function leaveProjectChat(chatId: string): Promise<void> {
  joinedChatIds.delete(chatId);

  if (!connection || connection.state !== HubConnectionState.Connected) {
    return;
  }

  await connection.invoke("LeaveChat", chatId).catch(() => undefined);
}

export function getProjectChatHubState(): HubConnectionState | null {
  return connection?.state ?? null;
}

export function hasJoinedProjectChats(): boolean {
  return joinedChatIds.size > 0;
}
