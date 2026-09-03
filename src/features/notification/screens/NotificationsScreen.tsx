import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { AppBottomNav } from "../../../shared/components/AppBottomNav";
import { useBottomNavMetrics } from "../../../shared/hooks/useBottomNavMetrics";
import { NOTIFICATIONS_PAGE_SIZE, useNotificationActions, useNotificationsQuery, useUnreadNotificationCount } from "../hooks/useNotifications";
import { NotificationCategory, NotificationFilter, NotificationListItem } from "../models/notification.model";
import { useProjectsQuery } from "../../project/hooks/useProjects";
import { useProjectStore } from "../../project/store/project.store";
import { useAuthStore } from "../../auth/store/auth.store";
import { enrichNotificationWithProjectName } from "../utils/notification.mapper";
import { navigateFromNotification } from "../utils/notification.navigation";
import { styles } from "./NotificationsScreen.styles";

const CATEGORY_FILTERS: Array<{ key: NotificationFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "order", label: "Order" },
  { key: "payment", label: "Payment" },
  { key: "project", label: "Project" },
];

const SWIPE_THRESHOLD = 48;

export function NotificationsScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { scrollPaddingBottom } = useBottomNavMetrics();
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [page, setPage] = useState(1);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const setActiveProjectId = useProjectStore((state) => state.setActiveProjectId);
  const userRole = useAuthStore((state) => state.user?.role ?? null);
  const { data: unreadData } = useUnreadNotificationCount();
  const { markReadMutation, markAllReadMutation } = useNotificationActions();
  const projectsQuery = useProjectsQuery({ limit: 100 });
  const notificationsQuery = useNotificationsQuery(filter, page);

  const unreadCount = unreadData?.unreadCount ?? 0;
  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projectsQuery.data?.items ?? []) {
      map.set(project.projectId, project.projectName);
    }
    return map;
  }, [projectsQuery.data?.items]);

  const visibleItems = useMemo(
    () => (notificationsQuery.data?.items ?? []).map((item) => enrichNotificationWithProjectName(item, projectNameById)),
    [notificationsQuery.data?.items, projectNameById],
  );
  const totalItems = notificationsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / NOTIFICATIONS_PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    if (page > totalPages && totalItems > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages, totalItems]);

  const handleRefresh = () => {
    void notificationsQuery.refetch();
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(undefined, {
      onError: (error) => {
        Alert.alert("Unable to mark all read", getErrorMessage(error, "Please try again."));
      },
    });
  };

  const handleNotificationPress = (item: NotificationListItem) => {
    if (item.unread) {
      markReadMutation.mutate(item.id, {
        onError: (error) => {
          Alert.alert("Unable to mark read", getErrorMessage(error, "Please try again."));
        },
      });
    }

    setNavigatingId(item.id);
    void navigateFromNotification(navigation, item, { setActiveProjectId, role: userRole })
      .catch((error: unknown) => {
        Alert.alert("Unable to open notification", getErrorMessage(error, "Please try again."));
      })
      .finally(() => {
        setNavigatingId(null);
      });
  };

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;
  const isPageLoading = notificationsQuery.isFetching && !notificationsQuery.isLoading;

  const goToNextPage = useCallback(() => {
    if (!isPageLoading && canGoNext) {
      setPage((current) => current + 1);
    }
  }, [canGoNext, isPageLoading]);

  const goToPrevPage = useCallback(() => {
    if (!isPageLoading && canGoPrev) {
      setPage((current) => Math.max(1, current - 1));
    }
  }, [canGoPrev, isPageLoading]);

  const pageSwipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-24, 24])
        .failOffsetY([-14, 14])
        .runOnJS(true)
        .onEnd((event) => {
          if (event.translationX <= -SWIPE_THRESHOLD) {
            goToNextPage();
            return;
          }

          if (event.translationX >= SWIPE_THRESHOLD) {
            goToPrevPage();
          }
        }),
    [goToNextPage, goToPrevPage],
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={notificationsQuery.isRefetching} onRefresh={handleRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.brand}>FURNISPACE</Text>
              <Text style={styles.title}>Notifications</Text>
            </View>
            <View style={styles.headerActions}>
              {unreadCount > 0 ? (
                <Pressable
                  disabled={markAllReadMutation.isPending}
                  style={styles.markAllButton}
                  onPress={handleMarkAllRead}
                >
                  <Text style={styles.markAllText}>Mark all read</Text>
                </Pressable>
              ) : null}
              <View style={styles.newBadge}>
                <View style={styles.newDot} />
                <Text style={styles.newText}>{unreadCount} new</Text>
              </View>
            </View>
          </View>

          <View style={styles.filterRow}>
            {CATEGORY_FILTERS.map((item) => (
              <FilterChip
                key={item.key}
                active={filter === item.key}
                label={item.label}
                onPress={() => setFilter(item.key)}
              />
            ))}
          </View>
        </View>

        <View style={styles.content}>
          {notificationsQuery.isPending && !notificationsQuery.data ? (
            <View style={styles.centerState}>
              <ActivityIndicator color="#C9A86A" />
            </View>
          ) : notificationsQuery.isError ? (
            <View style={styles.centerState}>
              <Text style={styles.emptyText}>
                {getErrorMessage(notificationsQuery.error, "Unable to load notifications.")}
              </Text>
              <Pressable style={styles.retryButton} onPress={handleRefresh}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : visibleItems.length === 0 ? (
            <View style={styles.centerState}>
              <Text style={styles.emptyText}>No notifications yet.</Text>
            </View>
          ) : (
            <GestureDetector gesture={pageSwipeGesture}>
              <View style={styles.swipeArea}>
                <View style={styles.listMetaRow}>
                  <Text style={styles.listMetaText}>
                    Showing {(page - 1) * NOTIFICATIONS_PAGE_SIZE + 1}–
                    {Math.min(page * NOTIFICATIONS_PAGE_SIZE, totalItems)} of {totalItems}
                  </Text>
                  {totalPages > 1 ? <Text style={styles.swipeHintText}>Swipe left or right to change page</Text> : null}
                </View>

                {visibleItems.map((item) => (
                  <NotificationCard
                    key={item.id}
                    isNavigating={navigatingId === item.id}
                    item={item}
                    onPress={() => handleNotificationPress(item)}
                  />
                ))}

                {totalPages > 1 ? (
                  <PaginationBar
                    canGoNext={canGoNext}
                    canGoPrev={canGoPrev}
                    isLoading={isPageLoading}
                    page={page}
                    totalPages={totalPages}
                    onNext={goToNextPage}
                    onPrev={goToPrevPage}
                  />
                ) : null}
              </View>
            </GestureDetector>
          )}
        </View>
      </ScrollView>

      <AppBottomNav />
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable style={[styles.filterChip, active && styles.filterChipActive]} onPress={onPress}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function PaginationBar({
  page,
  totalPages,
  canGoPrev,
  canGoNext,
  isLoading,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  isLoading: boolean;
  onPrev: () => void;
  onNext: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.paginationBar}>
      <Pressable
        disabled={!canGoPrev || isLoading}
        style={[styles.paginationButton, !canGoPrev && styles.paginationButtonDisabled]}
        onPress={onPrev}
      >
        <Text style={[styles.paginationButtonText, !canGoPrev && styles.paginationButtonTextDisabled]}>Prev</Text>
      </Pressable>

      <View style={styles.paginationCenter}>
        {isLoading ? <ActivityIndicator color="#C9A86A" size="small" /> : null}
        <Text style={styles.paginationLabel}>
          Page {page} / {totalPages}
        </Text>
      </View>

      <Pressable
        disabled={!canGoNext || isLoading}
        style={[styles.paginationButton, !canGoNext && styles.paginationButtonDisabled]}
        onPress={onNext}
      >
        <Text style={[styles.paginationButtonText, !canGoNext && styles.paginationButtonTextDisabled]}>Next</Text>
      </Pressable>
    </View>
  );
}

function NotificationCard({
  item,
  isNavigating,
  onPress,
}: {
  item: NotificationListItem;
  isNavigating: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      disabled={isNavigating}
      style={[styles.card, item.unread && styles.cardUnread]}
      onPress={onPress}
    >
      {item.unread ? <View style={styles.cardUnreadAccent} /> : null}

      <View style={[styles.cardIconWrap, { backgroundColor: item.iconBackground }]}>
        <AppIcon definition={item.iconDefinition} size={17} color={item.iconColor} strokeWidth={1.9} />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, item.unread && styles.cardTitleUnread]} numberOfLines={2}>
            {item.title}
          </Text>
          <CategoryBadge category={item.category} label={item.categoryLabel} />
        </View>
        {item.projectLabel ? (
          <Text style={styles.cardProjectLabel} numberOfLines={1}>
            {item.projectLabel}
          </Text>
        ) : null}
        <Text style={styles.cardDescription} numberOfLines={3}>
          {item.description}
        </Text>
        <Text style={styles.cardTime}>{item.timeLabel}</Text>
      </View>

      {isNavigating ? (
        <ActivityIndicator color="#C9A86A" size="small" style={styles.cardNavigatingIndicator} />
      ) : item.unread ? (
        <View style={styles.unreadDot} />
      ) : null}
    </Pressable>
  );
}

function CategoryBadge({ category, label }: { category: NotificationCategory; label: string }): React.JSX.Element {
  return (
    <View style={[styles.categoryBadge, styles[`categoryBadge_${category}`]]}>
      <Text style={[styles.categoryBadgeText, styles[`categoryBadgeText_${category}`]]}>{label}</Text>
    </View>
  );
}
