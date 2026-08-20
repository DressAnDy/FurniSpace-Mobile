import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { searchIconDefinition } from "../../../icons/navigation/definitions";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { AppBottomNav } from "../../../shared/components/AppBottomNav";
import { useBottomNavMetrics } from "../../../shared/hooks/useBottomNavMetrics";
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
  const { scrollPaddingBottom } = useBottomNavMetrics();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
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

      <AppBottomNav activeTab="chat" />
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
