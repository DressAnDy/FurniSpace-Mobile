import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import { NotificationFilter, NotificationListItem } from "../models/notification.model";
import {
  getNotificationsApi,
  getUnreadNotificationCountApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from "../services/notification.api";
import { mapNotificationDtoToListItem } from "../utils/notification.mapper";

export const NOTIFICATIONS_PAGE_SIZE = 20;
const FILTERED_FETCH_LIMIT = 100;
const NOTIFICATIONS_STALE_TIME_MS = 60_000;

function filterNotificationItems(items: NotificationListItem[], filter: NotificationFilter): NotificationListItem[] {
  return items.filter((item) => filter === "all" || item.category === filter);
}

function paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

async function fetchNotificationsPage(filter: NotificationFilter, page: number) {
  if (filter === "all") {
    const response = await getNotificationsApi({
      page,
      limit: NOTIFICATIONS_PAGE_SIZE,
    });

    const items = response.items.map(mapNotificationDtoToListItem);

    return {
      items,
      page: response.page,
      limit: response.limit,
      total: response.total,
    };
  }

  const response = await getNotificationsApi({
    page: 1,
    limit: FILTERED_FETCH_LIMIT,
  });

  const filteredItems = filterNotificationItems(response.items.map(mapNotificationDtoToListItem), filter);

  return {
    items: paginateItems(filteredItems, page, NOTIFICATIONS_PAGE_SIZE),
    page,
    limit: NOTIFICATIONS_PAGE_SIZE,
    total: filteredItems.length,
  };
}

export function prefetchNotificationQueries(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.prefetchQuery({
    queryKey: queryKeys.notification.unreadCount,
    queryFn: getUnreadNotificationCountApi,
    staleTime: NOTIFICATIONS_STALE_TIME_MS,
  });

  void queryClient.prefetchQuery({
    queryKey: [...queryKeys.notification.list("all"), 1],
    queryFn: () => fetchNotificationsPage("all", 1),
    staleTime: NOTIFICATIONS_STALE_TIME_MS,
  });
}

export function useNotificationsQuery(filter: NotificationFilter, page: number) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: [...queryKeys.notification.list(filter), page],
    enabled: isLoggedIn,
    staleTime: NOTIFICATIONS_STALE_TIME_MS,
    placeholderData: keepPreviousData,
    queryFn: () => fetchNotificationsPage(filter, page),
  });
}

export function useUnreadNotificationCount() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.notification.unreadCount,
    enabled: isLoggedIn,
    queryFn: getUnreadNotificationCountApi,
    staleTime: NOTIFICATIONS_STALE_TIME_MS,
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
