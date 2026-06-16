import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { userIconDefinition } from "../../../icons/auth/definitions";
import { bellIconDefinition, chatIconDefinition, phoneIconDefinition, sendIconDefinition } from "../../../icons/communication/definitions";
import { paperclipIconDefinition } from "../../../icons/file/definitions";
import { arrowLeftIconDefinition, dashboardIconDefinition, homeIconDefinition } from "../../../icons/navigation/definitions";
import type { IconDefinition } from "../../../icons/types";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";

export function MessageChatScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.headerCircleButton} onPress={() => navigation.navigate("Messages")}>
          <AppIcon definition={arrowLeftIconDefinition} size={18} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerMeta}>
          <Text style={styles.headerName}>Marcus Chen</Text>
          <View style={styles.headerStatusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerStatus}>Lead Designer · Online</Text>
          </View>
        </View>

        <Pressable style={styles.headerCircleButton}>
          <AppIcon definition={phoneIconDefinition} size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView style={styles.chatBody} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
        <View style={styles.dayDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>TODAY</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.senderLabel}>Marcus Chen</Text>
        <View style={styles.incomingBubble}>
          <Text style={styles.incomingText}>
            Hi Sarah! I&apos;ve completed the initial concept for your cafe. Would you like to review it?
          </Text>
        </View>
        <Text style={styles.timeLeft}>10:30 AM</Text>

        <View style={styles.outgoingWrap}>
          <View style={styles.outgoingBubble}>
            <Text style={styles.outgoingText}>Yes, I&apos;d love to see it! When can we schedule a review call?</Text>
          </View>
        </View>
        <Text style={styles.timeRight}>10:35 AM</Text>

        <Text style={[styles.senderLabel, styles.mt12]}>Marcus Chen</Text>
        <View style={styles.incomingBubble}>
          <Text style={styles.incomingText}>
            I&apos;ve just uploaded the 3D model to the proposal section. You can view it anytime - I&apos;ll be online for
            questions.
          </Text>
        </View>
        <Text style={styles.timeLeft}>10:40 AM</Text>

        <Text style={[styles.senderLabel, styles.mt12]}>Marcus Chen</Text>
        <View style={styles.incomingBubble}>
          <View style={styles.filePreview}>
            <AppIcon definition={paperclipIconDefinition} size={14} color="#7A6F68" />
            <Text style={styles.fileName}>cafe_design_preview.jpg</Text>
          </View>
          <Text style={[styles.incomingText, styles.fileMessage]}>
            The design features warm wood tones and modern seating arrangements as discussed in our brief.
          </Text>
        </View>
        <Text style={styles.timeLeft}>10:41 AM</Text>

        <View style={styles.outgoingWrap}>
          <View style={styles.outgoingBubble}>
            <Text style={styles.outgoingText}>
              This looks amazing! I especially love the lighting fixtures. Could we adjust the bar counter a bit?
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.composer}>
        <Pressable style={styles.composerIconButton}>
          <AppIcon definition={paperclipIconDefinition} size={15} color="#7A6F68" />
        </Pressable>
        <TextInput placeholder="Type a message..." placeholderTextColor="rgba(122,111,104,0.7)" style={styles.composerInput} />
        <Pressable style={styles.sendButton}>
          <AppIcon definition={sendIconDefinition} size={14} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.bottomNav}>
        <BottomNavItem label="Home" iconDefinition={homeIconDefinition} onPress={() => navigation.navigate("Home")} />
        <BottomNavItem label="Tracking" iconDefinition={dashboardIconDefinition} onPress={() => navigation.navigate("Tracking")} />
        <BottomNavItem label="Chat" iconDefinition={chatIconDefinition} active />
        <BottomNavItem label="Alerts" iconDefinition={bellIconDefinition} badge="5" onPress={() => navigation.navigate("Notifications")} />
        <BottomNavItem label="Profile" iconDefinition={userIconDefinition} onPress={() => navigation.navigate("Profile")} />
      </View>
    </View>
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
        <AppIcon definition={iconDefinition} size={18} color={active ? "#C9A86A" : "rgba(122,111,104,0.8)"} />
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
  screen: { backgroundColor: "#FAF8F5", flex: 1 },
  header: {
    alignItems: "center",
    backgroundColor: "#3A3330",
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingTop: 38,
    paddingBottom: 11,
  },
  headerCircleButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  headerMeta: { flex: 1, marginHorizontal: 11 },
  headerName: { color: "#FFFFFF", fontSize: 13 },
  headerStatusRow: { alignItems: "center", flexDirection: "row", marginTop: 2 },
  onlineDot: { backgroundColor: "#10B981", borderRadius: 3, height: 6, width: 6 },
  headerStatus: { color: "rgba(255,255,255,0.6)", fontSize: 10, marginLeft: 6 },
  chatBody: { flex: 1 },
  chatContent: { paddingHorizontal: 15, paddingTop: 11, paddingBottom: 12 },
  dayDivider: { alignItems: "center", flexDirection: "row", marginBottom: 10 },
  dividerLine: { backgroundColor: "rgba(122,111,104,0.2)", flex: 1, height: 1 },
  dividerText: { color: "#7A6F68", fontSize: 10, marginHorizontal: 8 },
  senderLabel: { color: "#7A6F68", fontSize: 10, marginBottom: 5 },
  incomingBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(60,51,48,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: "75%",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  incomingText: { color: "#2C2420", fontSize: 13, lineHeight: 20 },
  outgoingWrap: { alignItems: "flex-end", marginTop: 8 },
  outgoingBubble: {
    backgroundColor: "#3A3330",
    borderRadius: 12,
    maxWidth: "75%",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  outgoingText: { color: "#FFFFFF", fontSize: 13, lineHeight: 20 },
  timeLeft: { color: "#7A6F68", fontSize: 10, marginTop: 4 },
  timeRight: { alignSelf: "flex-end", color: "#7A6F68", fontSize: 10, marginTop: 4 },
  mt12: { marginTop: 12 },
  filePreview: {
    alignItems: "center",
    backgroundColor: "#F5F2ED",
    borderRadius: 9,
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  fileName: { color: "#7A6F68", fontSize: 11, marginLeft: 6 },
  fileMessage: { marginTop: 0 },
  composer: {
    alignItems: "center",
    backgroundColor: "#FAF8F5",
    borderTopColor: "rgba(60,51,48,0.08)",
    borderTopWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  composerIconButton: {
    alignItems: "center",
    backgroundColor: "#F5F2ED",
    borderRadius: 13,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  composerInput: {
    backgroundColor: "#F5F2ED",
    borderRadius: 13,
    color: "#2C2420",
    flex: 1,
    fontSize: 12,
    height: 30,
    marginHorizontal: 8,
    paddingHorizontal: 11,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#C9A86A",
    borderRadius: 13,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  bottomNav: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopColor: "rgba(60,51,48,0.08)",
    borderTopWidth: 1,
    flexDirection: "row",
    height: 62,
  },
  bottomItem: { alignItems: "center", flex: 1, justifyContent: "center" },
  bottomIconWrap: { position: "relative" },
  bottomBadge: {
    alignItems: "center",
    backgroundColor: "#C9A86A",
    borderRadius: 8,
    height: 15,
    justifyContent: "center",
    minWidth: 15,
    paddingHorizontal: 4,
    position: "absolute",
    right: -10,
    top: -5,
  },
  bottomBadgeText: { color: "#FFFFFF", fontSize: 9 },
  bottomLabel: { color: "rgba(122,111,104,0.7)", fontSize: 10, marginTop: 4 },
  bottomLabelActive: { color: "#C9A86A" },
  bottomActiveIndicator: {
    backgroundColor: "#C9A86A",
    borderRadius: 999,
    height: 2,
    position: "absolute",
    top: 3,
    width: 20,
  },
});
