import { getProjectChatsApi } from "../../communication/services/chat.api";
import { ProjectChatStatus, ProjectChatType } from "../../communication/models/chat.model";
import { NotificationListItem } from "../models/notification.model";
import { inferChatTypeFromMessage, parseChatTitleFromMessage, readMetadataString } from "./notification.metadata";

export type ChatNotificationTarget = {
  chatId: string;
  projectId: string;
  title: string;
  staffName: string;
  chatType: ProjectChatType;
  status: ProjectChatStatus;
};

export async function resolveChatNotificationTarget(
  item: Pick<NotificationListItem, "referenceType" | "referenceId" | "projectId" | "metadata" | "description">,
): Promise<ChatNotificationTarget | null> {
  if (item.referenceType !== "PROJECT_CHAT_MESSAGE") {
    return null;
  }

  const projectId = item.projectId ?? readMetadataString(item.metadata, "projectId");
  if (!projectId) {
    return null;
  }

  const chatIdFromMetadata = readMetadataString(item.metadata, "chatId");
  const chatTypeFromMetadata = readMetadataString(item.metadata, "chatType") as ProjectChatType | undefined;
  const inferredChatType = chatTypeFromMetadata ?? inferChatTypeFromMessage(item.description) ?? "SALES";
  const parsedChatTitle = parseChatTitleFromMessage(item.description);
  const statusFromMetadata = readMetadataString(item.metadata, "status") as ProjectChatStatus | undefined;

  try {
    const response = await getProjectChatsApi(projectId);
    const chats = response.items;

    const chat =
      (chatIdFromMetadata ? chats.find((entry) => entry.chatId === chatIdFromMetadata) : undefined) ??
      chats.find((entry) => entry.chatType === inferredChatType) ??
      chats.find((entry) => entry.chatType === "SALES") ??
      chats[0];

    if (chat) {
      return {
        chatId: chat.chatId,
        projectId,
        chatType: chat.chatType,
        title: chat.title || parsedChatTitle || "Project Chat",
        staffName: readMetadataString(item.metadata, "senderName") ?? chat.staffName,
        status: chat.status,
      };
    }
  } catch {
    // Fall through to metadata-only target when list fetch fails.
  }

  if (chatIdFromMetadata) {
    return {
      chatId: chatIdFromMetadata,
      projectId,
      chatType: inferredChatType,
      title: parsedChatTitle ?? "Project Chat",
      staffName: readMetadataString(item.metadata, "senderName") ?? "Team member",
      status: statusFromMetadata === "CLOSED" || statusFromMetadata === "ARCHIVED" ? statusFromMetadata : "OPEN",
    };
  }

  return null;
}
