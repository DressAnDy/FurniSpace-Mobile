import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { userIconDefinition } from "../../../icons/auth/definitions";
import { bellIconDefinition, chatIconDefinition, phoneIconDefinition, sendIconDefinition } from "../../../icons/communication/definitions";
import { paperclipIconDefinition } from "../../../icons/file/definitions";
import { arrowLeftIconDefinition, dashboardIconDefinition, homeIconDefinition } from "../../../icons/navigation/definitions";
import type { IconDefinition } from "../../../icons/types";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { styles } from "./MessageChatScreen.styles";

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
