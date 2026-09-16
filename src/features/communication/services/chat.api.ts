import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { directUploadFile } from "../../../core/upload/directUpload";
import { ApiResponse } from "../../../shared/types/api";
import {
  ChatMessageDto,
  ChatMessageListQuery,
  ChatSearchQuery,
  ChatSearchResultDto,
  PaginatedResponse,
  ProjectChatListQuery,
  ProjectChatStatus,
  ProjectChatSummaryDto,
  SendTextMessageRequest,
} from "../models/chat.model";

export type ChatUploadFileType =
  | "REFERENCE_IMAGE"
  | "FLOOR_PLAN"
  | "PDF_DRAWING"
  | "ORDER_DOCUMENT"
  | "OTHER";

export type ChatFileVisibility = "CUSTOMER_VISIBLE" | "STAFF_ONLY" | "PRIVATE";

function resolveChatUploadFileType(mimeType: string, fileName: string): ChatUploadFileType {
  const mime = (mimeType || "").toLowerCase();
  const name = (fileName || "").toLowerCase();
  if (mime.startsWith("image/")) {
    return "REFERENCE_IMAGE";
  }
  if (mime.includes("pdf") || name.endsWith(".pdf")) {
    return "PDF_DRAWING";
  }
  return "OTHER";
}

export async function getProjectChatsApi(
  projectId: string,
  query: ProjectChatListQuery = {},
): Promise<PaginatedResponse<ProjectChatSummaryDto>> {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<ProjectChatSummaryDto>>>(
    endpoints.chat.listByProject(projectId),
    {
      params: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.chatType ? { chatType: query.chatType } : {}),
        page: query.page ?? 1,
        limit: query.limit ?? 20,
      },
    },
  );

  return response.data.data;
}

export async function getChatMessagesApi(
  chatId: string,
  query: ChatMessageListQuery = {},
): Promise<PaginatedResponse<ChatMessageDto>> {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<ChatMessageDto>>>(
    endpoints.chat.messages(chatId),
    {
      params: {
        page: query.page ?? 1,
        limit: query.limit ?? 30,
        sort: query.sort ?? "DESC",
      },
    },
  );

  return response.data.data;
}

export async function sendChatTextMessageApi(chatId: string, content: string): Promise<ChatMessageDto> {
  const payload: SendTextMessageRequest = {
    messageType: "TEXT",
    content,
  };

  const response = await httpClient.post<ApiResponse<ChatMessageDto>>(endpoints.chat.sendMessage(chatId), payload);
  return response.data.data;
}

export async function sendChatFileMessageApi(
  chatId: string,
  file: {
    uri: string;
    name: string;
    type: string;
    size?: number | null;
  },
  content?: string,
  options?: {
    fileType?: ChatUploadFileType;
    visibility?: ChatFileVisibility;
  },
): Promise<ChatMessageDto> {
  return directUploadFile<ChatMessageDto>({
    preparePath: endpoints.chat.fileUploadUrl(chatId),
    completePath: endpoints.chat.fileComplete(chatId),
    file: {
      uri: file.uri,
      name: file.name,
      mimeType: file.type,
      size: file.size,
    },
    prepareBody: {
      fileType: options?.fileType ?? resolveChatUploadFileType(file.type, file.name),
      visibility: options?.visibility ?? "CUSTOMER_VISIBLE",
    },
    completeBody: {
      content: content?.trim(),
    },
  });
}

export async function updateProjectChatStatusApi(
  chatId: string,
  status: Extract<ProjectChatStatus, "CLOSED">,
): Promise<ProjectChatSummaryDto> {
  const response = await httpClient.patch<ApiResponse<ProjectChatSummaryDto>>(endpoints.chat.updateStatus(chatId), {
    status,
  });
  return response.data.data;
}

export async function searchProjectChatMessagesApi(
  projectId: string,
  query: ChatSearchQuery,
): Promise<PaginatedResponse<ChatSearchResultDto>> {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<ChatSearchResultDto>>>(
    endpoints.chat.search(projectId),
    {
      params: {
        q: query.q,
        page: query.page ?? 1,
        limit: query.limit ?? 20,
      },
    },
  );

  return response.data.data;
}
