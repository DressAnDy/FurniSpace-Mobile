import React, { useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { userIconDefinition } from "../../../icons/auth/definitions";
import { bellIconDefinition, chatIconDefinition } from "../../../icons/communication/definitions";
import { cubeIconDefinition } from "../../../icons/design/definitions";
import { fileTextIconDefinition } from "../../../icons/file/definitions";
import { dashboardIconDefinition, homeIconDefinition } from "../../../icons/navigation/definitions";
import { calendarIconDefinition } from "../../../icons/project/definitions";
import { checkIconDefinition } from "../../../icons/status/definitions";
import type { IconDefinition } from "../../../icons/types";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";

type NotificationFilter = "all" | "unread" | "read";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  iconDefinition: IconDefinition;
  iconColor: string;
  iconBackground: string;
  unread: boolean;
};

const notifications: NotificationItem[] = [
  {
    id: "proposal-ready",
    title: "3D Proposal Ready for Review",
    description: "Marcus Chen has uploaded your Urban Coffee House design - v2.1 is available now.",
    timeLabel: "2 HOURS AGO",
    iconDefinition: cubeIconDefinition,
    iconColor: "#C9A86A",
    iconBackground: "#F5F2ED",
    unread: true,
  },
  {
    id: "new-message",
    title: "New Message from Designer",
    description: "Marcus: I've uploaded the revised 3D model. Please take a look and share your thoughts.",
    timeLabel: "2 HOURS AGO",
    iconDefinition: chatIconDefinition,
    iconColor: "#7A6F68",
    iconBackground: "#F5F2ED",
    unread: true,
  },
  {
    id: "installation-confirmed",
    title: "Installation Date Confirmed",
    description: "Your installation is scheduled for June 27, 2026 at 9:00 AM. Please ensure site access.",
    timeLabel: "1 DAY AGO",
    iconDefinition: calendarIconDefinition,
    iconColor: "#7A6F68",
    iconBackground: "#F5F2ED",
    unread: true,
  },
  {
    id: "quotation",
    title: "Quotation Document Available",
    description: "Your itemised project quotation is ready. Review and approve to begin production.",
    timeLabel: "2 DAYS AGO",
    iconDefinition: fileTextIconDefinition,
    iconColor: "#9B8F86",
    iconBackground: "#F5F2ED",
    unread: false,
  },
  {
    id: "production-update",
    title: "Production Update",
    description: "Custom furniture pieces are now in production at the workshop.",
    timeLabel: "3 DAYS AGO",
    iconDefinition: cubeIconDefinition,
    iconColor: "#9B8F86",
    iconBackground: "#F5F2ED",
    unread: false,
  },
  {
    id: "proposal-approved",
    title: "Proposal Approved - Moving to Quotation",
    description: "Your design proposal has been approved and the project has advanced to quotation stage.",
    timeLabel: "5 DAYS AGO",
    iconDefinition: checkIconDefinition,
    iconColor: "#16A34A",
    iconBackground: "#ECFDF5",
    unread: false,
  },
];

export function NotificationsScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const unreadCount = useMemo(() => notifications.filter((item) => item.unread).length, []);
  const readCount = notifications.length - unreadCount;

  const visibleItems = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => item.unread);
    }
    if (filter === "read") {
      return notifications.filter((item) => !item.unread);
    }
    return notifications;
  }, [filter]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.brand}>FURNISPACE</Text>
              <Text style={styles.title}>Notifications</Text>
            </View>
            <View style={styles.newBadge}>
              <View style={styles.newDot} />
              <Text style={styles.newText}>{unreadCount} new</Text>
            </View>
          </View>

          <View style={styles.filterRow}>
            <FilterChip label="All" active={filter === "all"} onPress={() => setFilter("all")} />
            <FilterChip label={`Unread (${unreadCount})`} active={filter === "unread"} onPress={() => setFilter("unread")} />
            <FilterChip label={`Read (${readCount})`} active={filter === "read"} onPress={() => setFilter("read")} />
          </View>
        </View>

        <View style={styles.content}>
          {visibleItems.map((item) => (
            <NotificationCard key={item.id} item={item} />
          ))}
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
        <BottomNavItem label="Alerts" iconDefinition={bellIconDefinition} badge={String(unreadCount)} active />
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

function NotificationCard({ item }: { item: NotificationItem }): React.JSX.Element {
  return (
    <Pressable style={[styles.card, item.unread && styles.cardUnread]}>
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

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FAF8F5",
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: "#3A3330",
    paddingHorizontal: 19,
    paddingTop: 38,
    paddingBottom: 14,
  },
  headerTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brand: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    letterSpacing: 1,
  },
  title: {
    color: "#FFFFFF",
    fontFamily: "serif",
    fontSize: 35,
    marginTop: 2,
  },
  newBadge: {
    alignItems: "center",
    backgroundColor: "rgba(201,168,106,0.22)",
    borderColor: "rgba(201,168,106,0.35)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  newDot: {
    backgroundColor: "#C9A86A",
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  newText: {
    color: "#DCC89A",
    fontSize: 10,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 11,
  },
  filterChip: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: "#C9A86A",
  },
  filterChipText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 19,
    paddingTop: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(60,51,48,0.05)",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardUnread: {
    borderColor: "rgba(201,168,106,0.42)",
  },
  cardIconWrap: {
    alignItems: "center",
    borderRadius: 15,
    height: 30,
    justifyContent: "center",
    marginTop: 2,
    width: 30,
  },
  cardContent: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  cardTitle: {
    color: "#2C2420",
    fontSize: 13,
  },
  cardDescription: {
    color: "#7A6F68",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 2,
  },
  cardTime: {
    color: "rgba(122,111,104,0.55)",
    fontSize: 10,
    marginTop: 6,
  },
  unreadDot: {
    backgroundColor: "#C9A86A",
    borderRadius: 3,
    height: 6,
    marginTop: 6,
    width: 6,
  },
  bottomNav: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopColor: "rgba(60,51,48,0.08)",
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    height: 74,
    left: 0,
    position: "absolute",
    right: 0,
  },
  bottomItem: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  bottomIconWrap: {
    position: "relative",
  },
  bottomBadge: {
    alignItems: "center",
    backgroundColor: "#C9A86A",
    borderRadius: 8,
    height: 15,
    justifyContent: "center",
    position: "absolute",
    right: -10,
    top: -5,
    minWidth: 15,
    paddingHorizontal: 4,
  },
  bottomBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
  },
  bottomLabel: {
    color: "rgba(122,111,104,0.7)",
    fontSize: 10,
    marginTop: 4,
  },
  bottomLabelActive: {
    color: "#C9A86A",
  },
  bottomActiveIndicator: {
    backgroundColor: "#C9A86A",
    borderRadius: 999,
    height: 2,
    position: "absolute",
    top: 6,
    width: 20,
  },
});
