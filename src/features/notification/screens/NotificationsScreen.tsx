import React, { useMemo, useState } from "react";
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
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { AppBottomNav } from "../../../shared/components/AppBottomNav";
import { useBottomNavMetrics } from "../../../shared/hooks/useBottomNavMetrics";
import {
  useNotificationActions,
  useNotificationsQuery,
  useUnreadNotificationCount,
} from "../hooks/useNotifications";
import { NotificationCategory, NotificationFilter, NotificationListItem } from "../models/notification.model";
import { navigateFromNotification } from "../utils/notification.navigation";
import { styles } from "./NotificationsScreen.styles";

const CATEGORY_FILTERS: Array<{ key: NotificationFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "order", label: "Order" },
  { key: "payment", label: "Payment" },
  { key: "project", label: "Project" },
];

export function NotificationsScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { scrollPaddingBottom } = useBottomNavMetrics();
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const { data: unreadData } = useUnreadNotificationCount();
  const { markReadMutation, markAllReadMutation } = useNotificationActions();
  const notificationsQuery = useNotificationsQuery(filter);

  const unreadCount = unreadData?.unreadCount ?? 0;

  const visibleItems = useMemo(
    () => notificationsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [notificationsQuery.data?.pages],
  );

  const handleRefresh = () => {
    void notificationsQuery.refetch();
  };

  const handleLoadMore = () => {
    if (notificationsQuery.hasNextPage && !notificationsQuery.isFetchingNextPage) {
      void notificationsQuery.fetchNextPage();
    }
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

    navigateFromNotification(navigation, item);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={notificationsQuery.isRefetching} onRefresh={handleRefresh} />}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
          if (distanceFromBottom < 120) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={200}
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
          {notificationsQuery.isLoading ? (
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
            <>
              {visibleItems.map((item) => (
                <NotificationCard key={item.id} item={item} onPress={() => handleNotificationPress(item)} />
              ))}
              {notificationsQuery.isFetchingNextPage ? (
                <View style={styles.loadMoreState}>
                  <ActivityIndicator color="#C9A86A" />
                </View>
              ) : null}
            </>
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

function NotificationCard({
  item,
  onPress,
}: {
  item: NotificationListItem;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable style={[styles.card, item.unread && styles.cardUnread]} onPress={onPress}>
      <View style={[styles.cardIconWrap, { backgroundColor: item.iconBackground }]}>
        <AppIcon definition={item.iconDefinition} size={16} color={item.iconColor} strokeWidth={1.9} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <CategoryBadge category={item.category} label={item.categoryLabel} />
        </View>
        <Text style={styles.cardDescription}>{item.description}</Text>
        <Text style={styles.cardTime}>{item.timeLabel}</Text>
      </View>
      {item.unread ? <View style={styles.unreadDot} /> : null}
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
