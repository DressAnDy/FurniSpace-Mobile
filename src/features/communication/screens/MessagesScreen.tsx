import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { bellIconDefinition, chatIconDefinition } from "../../../icons/communication/definitions";
import { dashboardIconDefinition, homeIconDefinition, searchIconDefinition } from "../../../icons/navigation/definitions";
import type { IconDefinition } from "../../../icons/types";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { styles } from "./MessagesScreen.styles";

type ConversationItem = {
  id: string;
  initials: string;
  avatarColor: string;
  name: string;
  role: string;
  message: string;
  time: string;
  unreadCount?: number;
  showOnlineDot?: boolean;
};

const conversations: ConversationItem[] = [
  {
    id: "marcus",
    initials: "MC",
    avatarColor: "#3A3330",
    name: "Marcus Chen",
    role: "Lead Designer",
    message: "I've uploaded the revised 3D model. Please take a look when you have a moment.",
    time: "2h ago",
    unreadCount: 2,
    showOnlineDot: true,
  },
  {
    id: "jennifer",
    initials: "JL",
    avatarColor: "#C9A86A",
    name: "Jennifer Liu",
    role: "Sales Manager",
    message: "The installation team will arrive on June 27th at 9:00 AM. Please confirm.",
    time: "Yesterday",
    unreadCount: 1,
  },
  {
    id: "project-team",
    initials: "PT",
    avatarColor: "#7A6F68",
    name: "Project Team",
    role: "Group · 4 members",
    message: "Sarah: Thank you for the update! Looking forward to the final proposal.",
    time: "2 days ago",
  },
];

export function MessagesScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.brand}>FURNISPACE</Text>
          <Text style={styles.title}>Messages</Text>
          <View style={styles.searchBox}>
            <AppIcon definition={searchIconDefinition} size={14} color="rgba(255,255,255,0.5)" />
            <TextInput
              placeholder="Search conversations..."
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={styles.searchInput}
            />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionLabel}>ALL CONVERSATIONS</Text>
          {conversations.map((item) => (
            <ConversationCard key={item.id} item={item} onPress={() => navigation.navigate("MessageChat")} />
          ))}
          <Text style={styles.footerText}>All conversations shown</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <BottomNavItem label="Home" iconDefinition={homeIconDefinition} onPress={() => navigation.navigate("Home")} />
        <BottomNavItem
          label="Tracking"
          iconDefinition={dashboardIconDefinition}
          onPress={() => navigation.navigate("Tracking")}
        />
        <BottomNavItem label="Chat" iconDefinition={chatIconDefinition} active />
        <BottomNavItem label="Alerts" iconDefinition={bellIconDefinition} badge="5" onPress={() => navigation.navigate("Notifications")} />
      </View>
    </View>
  );
}

function ConversationCard({ item, onPress }: { item: ConversationItem; onPress?: () => void }): React.JSX.Element {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={styles.leftInfo}>
          <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
            <Text style={styles.avatarText}>{item.initials}</Text>
          </View>
          <View style={styles.nameWrap}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.role}>{item.role}</Text>
          </View>
        </View>
        <View style={styles.rightInfo}>
          <Text style={styles.time}>{item.time}</Text>
          {item.unreadCount ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.messageRow}>
        {item.showOnlineDot ? <View style={styles.onlineDot} /> : null}
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
      </View>
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
