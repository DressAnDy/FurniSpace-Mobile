import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import { NotificationFilter } from "../models/notification.model";
import {
  getNotificationsApi,
  getUnreadNotificationCountApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from "../services/notification.api";
import { mapNotificationDtoToListItem } from "../utils/notification.mapper";

export const NOTIFICATIONS_PAGE_SIZE = 6;

export function useNotificationsQuery(filter: NotificationFilter, page: number) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: [...queryKeys.notification.list(filter), page],
    enabled: isLoggedIn,
    queryFn: async () => {
      const response = await getNotificationsApi({
        page,
        limit: NOTIFICATIONS_PAGE_SIZE,
      });

      const items = response.items
        .map(mapNotificationDtoToListItem)
        .filter((item) => filter === "all" || item.category === filter);

      return {
        items,
        page: response.page,
        limit: response.limit,
        total: response.total,
      };
    },
  });
}

export function useUnreadNotificationCount() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.notification.unreadCount,
    enabled: isLoggedIn,
    queryFn: getUnreadNotificationCountApi,
    staleTime: 30_000,
  });
}

export function useNotificationBadgeLabel(): string | undefined {
  const { data } = useUnreadNotificationCount();
  const count = data?.unreadCount ?? 0;

  if (count <= 0) {
    return undefined;
  }

  return count > 99 ? "99+" : String(count);
}

export function useNotificationActions() {
  const queryClient = useQueryClient();

  const invalidateNotifications = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.notification.unreadCount }),
      queryClient.invalidateQueries({ queryKey: ["notification", "list"] }),
    ]);
  };

  const markReadMutation = useMutation({
    mutationFn: markNotificationReadApi,
    onSuccess: invalidateNotifications,
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsReadApi,
    onSuccess: invalidateNotifications,
  });

  return {
    markReadMutation,
    markAllReadMutation,
  };
}
