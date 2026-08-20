import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

function isCategoryFilter(filter: NotificationFilter): filter is Exclude<NotificationFilter, "all"> {
  return filter !== "all";
}

export function useNotificationsQuery(filter: NotificationFilter) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useInfiniteQuery({
    queryKey: queryKeys.notification.list(filter),
    enabled: isLoggedIn,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await getNotificationsApi({
        page: pageParam,
        limit: 20,
      });

      const items = response.items
        .map(mapNotificationDtoToListItem)
        .filter((item) => !isCategoryFilter(filter) || item.category === filter);

      return {
        ...response,
        items,
      };
    },
    getNextPageParam: (lastPage) => {
      const loadedCount = lastPage.page * lastPage.limit;
      return loadedCount < lastPage.total ? lastPage.page + 1 : undefined;
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
