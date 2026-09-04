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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { AppIcon } from "../../../shared/components/AppIcon";
import { arrowLeftIconDefinition } from "../../../icons/navigation/definitions";
import {
  NOTIFICATIONS_PAGE_SIZE,
  useNotificationActions,
  useNotificationBadgeLabel,
  useSaleNotificationsQuery,
  useUnreadNotificationCount,
} from "../hooks/useNotifications";
import { NotificationCategory, NotificationListItem, SaleNotificationFilter } from "../models/notification.model";
import { useAuthStore } from "../../auth/store/auth.store";
import { useProjectStore } from "../../project/store/project.store";
import { useSaleAssignedProjectsQuery } from "../../sale/hooks/useSaleDashboard";
import { SaleBottomNav, SaleFrame } from "../../sale/components/SaleShared";
import { SALE, saleStyles as saleS } from "../../sale/styles/sale.styles";
import { enrichSaleNotifications } from "../utils/sale.notification.mapper";
import { navigateFromNotification } from "../utils/notification.navigation";
import { styles } from "./SaleNotificationsScreen.styles";

const SALE_FILTERS: Array<{ key: SaleNotificationFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "lead", label: "Lead" },
  { key: "quotation", label: "Quotation" },
  { key: "order", label: "Order" },
  { key: "payment", label: "Payment" },
  { key: "chat", label: "Chat" },
  { key: "production", label: "Production" },
];

const SWIPE_THRESHOLD = 48;

const CATEGORY_BADGE: Record<NotificationCategory, { bg: string; color: string }> = {
  lead: { bg: "#FFF4E5", color: "#BB4D00" },
  proposal: { bg: "#EFF6FF", color: "#155DFC" },
  quotation: { bg: "rgba(201,168,106,0.18)", color: "#A8843E" },
  order: { bg: "#EFF6FF", color: "#155DFC" },
  payment: { bg: "#ECFDF5", color: "#15803D" },
  chat: { bg: "#F5F2ED", color: "#7A6F68" },
  production: { bg: "#F5F2ED", color: "#7A6F68" },
  project: { bg: "#F5F2ED", color: "#7A6F68" },
};

export function SaleNotificationsScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<SaleNotificationFilter>("all");
  const [page, setPage] = useState(1);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const setActiveProjectId = useProjectStore((state) => state.setActiveProjectId);
  const userRole = useAuthStore((state) => state.user?.role ?? null);
  const { data: unreadData } = useUnreadNotificationCount();
  const badgeLabel = useNotificationBadgeLabel();
  const { markReadMutation, markAllReadMutation } = useNotificationActions();
  const projectsQuery = useSaleAssignedProjectsQuery({ page: 1, limit: 100 });
  const notificationsQuery = useSaleNotificationsQuery(filter, page);

  const unreadCount = unreadData?.unreadCount ?? 0;
  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projectsQuery.data?.items ?? []) {
      map.set(project.projectId, project.name);
    }
    return map;
  }, [projectsQuery.data?.items]);

  const visibleItems = useMemo(
    () => enrichSaleNotifications(notificationsQuery.data?.items ?? [], projectNameById),
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
    void navigateFromNotification(navigation, item, { setActiveProjectId, role: userRole ?? "SALES" })
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
    <SaleFrame>
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 18) + 8 }]}>
          <View style={styles.headerTopRow}>
            <Pressable style={saleS.headerIcon} onPress={() => navigation.navigate("SaleDashboard")}>
              <AppIcon definition={arrowLeftIconDefinition} size={15} color={SALE.white} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.headerEyebrow}>Sales inbox</Text>
              <Text style={styles.headerTitle}>Notifications</Text>
            </View>
            <View style={styles.headerActions}>
              {unreadCount > 0 ? (
                <Pressable
                  disabled={markAllReadMutation.isPending}
                  style={styles.markAllButton}
                  onPress={handleMarkAllRead}
                >
                  <Text style={styles.markAllText}>
                    {markAllReadMutation.isPending ? "…" : "Mark all"}
                  </Text>
                </Pressable>
              ) : null}
              <View style={styles.newBadge}>
                <Text style={styles.newText}>{badgeLabel ?? "0"} new</Text>
              </View>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {SALE_FILTERS.map((item) => (
              <Pressable
                key={item.key}
                style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
                onPress={() => setFilter(item.key)}
              >
                <Text style={[styles.filterChipText, filter === item.key && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={[styles.content, { paddingBottom: 96 + Math.max(insets.bottom, 8) }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={notificationsQuery.isRefetching}
              onRefresh={handleRefresh}
              tintColor={SALE.gold}
            />
          }
        >
          {notificationsQuery.isPending && !notificationsQuery.data ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={SALE.gold} />
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
              <Text style={styles.emptyText}>
                {filter === "unread" ? "No unread notifications." : "No sales notifications yet."}
              </Text>
            </View>
          ) : (
            <GestureDetector gesture={pageSwipeGesture}>
              <View style={styles.swipeArea}>
                <View style={styles.listMetaRow}>
                  <Text style={styles.listMetaText}>
                    Showing {(page - 1) * NOTIFICATIONS_PAGE_SIZE + 1}–
                    {Math.min(page * NOTIFICATIONS_PAGE_SIZE, totalItems)} of {totalItems}
                  </Text>
                </View>

                {visibleItems.map((item) => (
                  <SaleNotificationCard
                    key={item.id}
                    isNavigating={navigatingId === item.id}
                    item={item}
                    onPress={() => handleNotificationPress(item)}
                  />
                ))}

                {totalPages > 1 ? (
                  <View style={styles.paginationBar}>
                    <Pressable
                      disabled={!canGoPrev || isPageLoading}
                      style={[styles.paginationButton, !canGoPrev && styles.paginationButtonDisabled]}
                      onPress={goToPrevPage}
                    >
                      <Text style={styles.paginationButtonText}>Prev</Text>
                    </Pressable>
                    <Text style={styles.paginationLabel}>
                      {isPageLoading ? "…" : `Page ${page} / ${totalPages}`}
                    </Text>
                    <Pressable
                      disabled={!canGoNext || isPageLoading}
                      style={[styles.paginationButton, !canGoNext && styles.paginationButtonDisabled]}
                      onPress={goToNextPage}
                    >
                      <Text style={styles.paginationButtonText}>Next</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </GestureDetector>
          )}
        </ScrollView>

        <SaleBottomNav active="dashboard" />
      </View>
    </SaleFrame>
  );
}

function SaleNotificationCard({
  item,
  isNavigating,
  onPress,
}: {
  item: NotificationListItem;
  isNavigating: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const badge = CATEGORY_BADGE[item.category];

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
          <View style={[styles.categoryBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.categoryBadgeText, { color: badge.color }]}>{item.categoryLabel}</Text>
          </View>
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
        <ActivityIndicator color={SALE.gold} size="small" style={styles.cardNavigatingIndicator} />
      ) : item.unread ? (
        <View style={styles.unreadDot} />
      ) : null}
    </Pressable>
  );
}
