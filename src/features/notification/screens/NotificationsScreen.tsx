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
import { userIconDefinition } from "../../../icons/auth/definitions";
import { bellIconDefinition, chatIconDefinition } from "../../../icons/communication/definitions";
import { dashboardIconDefinition, homeIconDefinition } from "../../../icons/navigation/definitions";
import type { IconDefinition } from "../../../icons/types";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import {
  useNotificationActions,
  useNotificationBadgeLabel,
  useNotificationsQuery,
  useUnreadNotificationCount,
} from "../hooks/useNotifications";
import { NotificationFilter, NotificationListItem } from "../models/notification.model";
import { navigateFromNotification } from "../utils/notification.navigation";
import { styles } from "./NotificationsScreen.styles";

export function NotificationsScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const alertsBadge = useNotificationBadgeLabel();
  const { data: unreadData } = useUnreadNotificationCount();
  const { markReadMutation, markAllReadMutation } = useNotificationActions();
  const notificationsQuery = useNotificationsQuery(filter);

  const unreadCount = unreadData?.unreadCount ?? 0;
  const readCount = filter === "read" ? (notificationsQuery.data?.pages[0]?.total ?? 0) : 0;

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
        contentContainerStyle={styles.scrollContent}
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
            <FilterChip label="All" active={filter === "all"} onPress={() => setFilter("all")} />
            <FilterChip label={`Unread (${unreadCount})`} active={filter === "unread"} onPress={() => setFilter("unread")} />
            <FilterChip label={filter === "read" ? `Read (${readCount})` : "Read"} active={filter === "read"} onPress={() => setFilter("read")} />
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

      <View style={styles.bottomNav}>
        <BottomNavItem label="Home" iconDefinition={homeIconDefinition} onPress={() => navigation.navigate("Home")} />
        <BottomNavItem
          label="Tracking"
          iconDefinition={dashboardIconDefinition}
          onPress={() => navigation.navigate("Tracking")}
        />
        <BottomNavItem label="Chat" iconDefinition={chatIconDefinition} badge="3" onPress={() => navigation.navigate("Messages")} />
        <BottomNavItem label="Alerts" iconDefinition={bellIconDefinition} badge={alertsBadge} active />
        <BottomNavItem label="Profile" iconDefinition={userIconDefinition} onPress={() => navigation.navigate("Profile")} />
      </View>
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
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
        <Text style={styles.cardTime}>{item.timeLabel}</Text>
      </View>
      {item.unread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

function BottomNavItem({
  label,
  iconDefinition,
  active = false,
  badge,
  onPress,
}: {
  label: string;
  iconDefinition: IconDefinition;
  active?: boolean;
  badge?: string;
  onPress?: () => void;
}): React.JSX.Element {
  return (
    <Pressable style={styles.bottomItem} onPress={onPress}>
      <View style={styles.bottomIconWrap}>
        <AppIcon definition={iconDefinition} size={19} color={active ? "#C9A86A" : "rgba(122,111,104,0.8)"} strokeWidth={1.9} />
        {badge ? (
          <View style={styles.bottomBadge}>
            <Text style={styles.bottomBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.bottomLabel, active && styles.bottomLabelActive]}>{label}</Text>
      {active ? <View style={styles.bottomActiveIndicator} /> : null}
    </Pressable>
  );
}
