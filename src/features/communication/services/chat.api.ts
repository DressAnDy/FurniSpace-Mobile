import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { ApiResponse } from "../../../shared/types/api";
import {
  ChatMessageDto,
  ChatMessageListQuery,
  ChatSearchQuery,
  ChatSearchResultDto,
  PaginatedResponse,
  ProjectChatListQuery,
  ProjectChatSummaryDto,
  SendTextMessageRequest,
} from "../models/chat.model";

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
  },
  content?: string,
): Promise<ChatMessageDto> {
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  if (content?.trim()) {
    formData.append("content", content.trim());
  }

  const response = await httpClient.post<ApiResponse<ChatMessageDto>>(endpoints.chat.sendFile(chatId), formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
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
