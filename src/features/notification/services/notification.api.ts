import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { ApiResponse } from "../../../shared/types/api";
import {
  MarkReadResponseDto,
  NotificationListQuery,
  NotificationListResponseDto,
  UnreadCountResponseDto,
} from "../models/notification.model";

export async function getNotificationsApi(query: NotificationListQuery = {}): Promise<NotificationListResponseDto> {
  const response = await httpClient.get<ApiResponse<NotificationListResponseDto>>(endpoints.notifications.list, {
    params: {
      ...(query.isUnread !== undefined ? { isUnread: query.isUnread } : {}),
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    },
  });
  return response.data.data;
}

export async function getUnreadNotificationCountApi(): Promise<UnreadCountResponseDto> {
  const response = await httpClient.get<ApiResponse<UnreadCountResponseDto>>(endpoints.notifications.unreadCount);
  return response.data.data;
}

export async function markNotificationReadApi(notificationId: string): Promise<MarkReadResponseDto> {
  const response = await httpClient.patch<ApiResponse<MarkReadResponseDto>>(
    endpoints.notifications.markRead(notificationId),
  );
  return response.data.data;
}

export async function markAllNotificationsReadApi(): Promise<void> {
  await httpClient.patch<ApiResponse<Record<string, never>>>(endpoints.notifications.markAllRead);
}
