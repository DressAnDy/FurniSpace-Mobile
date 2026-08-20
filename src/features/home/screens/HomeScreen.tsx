import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { bellIconDefinition } from "../../../icons/communication/definitions";
import {
  arrowRightIconDefinition,
  chevronRightIconDefinition,
} from "../../../icons/navigation/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { AppBottomNav } from "../../../shared/components/AppBottomNav";
import { useBottomNavMetrics } from "../../../shared/hooks/useBottomNavMetrics";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { useNotificationBadgeLabel } from "../../notification/hooks/useNotifications";
import { styles } from "./HomeScreen.styles";

type UpdateItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  tone: "primary" | "neutral";
};

const updates: UpdateItem[] = [
  {
    id: "u1",
    title: "3D Proposal Ready for Review",
    description: "Marcus uploaded the initial design concept - v2.1 available now",
    time: "2 hours ago",
    tone: "primary",
  },
  {
    id: "u2",
    title: "Message from Sales Team",
    description: "Installation scheduled for June 27th at 9:00 AM",
    time: "Yesterday",
    tone: "neutral",
  },
  {
    id: "u3",
    title: "Quotation Document Shared",
    description: "Your itemised quote is ready for review",
    time: "3 days ago",
    tone: "neutral",
  },
];

export function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const alertsBadge = useNotificationBadgeLabel();
  const { scrollPaddingBottom } = useBottomNavMetrics();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerWrap}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.greetingLabel}>GOOD AFTERNOON</Text>
              <Text style={styles.userName}>Sarah Anderson</Text>
            </View>

            <Pressable style={styles.notifyWrap} onPress={() => navigation.navigate("Notifications")}>
              <View style={styles.notifyIcon}>
                <AppIcon definition={bellIconDefinition} size={15} color="#FFFFFF" strokeWidth={1.8} />
              </View>
              {alertsBadge ? (
                <View style={styles.notifyBadge}>
                  <Text style={styles.notifyBadgeText}>{alertsBadge}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          <View style={styles.activeProjectRow}>
            <View style={styles.line} />
            <Text style={styles.activeProjectText}>ACTIVE PROJECT</Text>
            <View style={styles.line} />
          </View>
        </View>

        <View style={styles.projectCard}>
          <View style={styles.projectCardTopBorder} />
          <View style={styles.projectCardBody}>
            <View style={styles.projectHeadRow}>
              <View>
                <Text style={styles.projectTitle}>Urban Coffee House</Text>
                <Text style={styles.projectCode}>Project #FS-2024-089</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>IN PROGRESS</Text>
              </View>
            </View>

            <View style={styles.peopleRow}>
              <View style={styles.avatarRow}>
                <View style={[styles.avatarCircle, styles.avatarDark]}>
                  <Text style={styles.avatarText}>MC</Text>
                </View>
                <View style={[styles.avatarCircle, styles.avatarGold, styles.avatarOverlap]}>
                  <Text style={styles.avatarText}>JL</Text>
                </View>
              </View>
              <View>
                <Text style={styles.peopleName}>Marcus Chen + Jennifer Liu</Text>
                <Text style={styles.peopleRole}>Designer · Sales Manager</Text>
              </View>
            </View>

            <View style={styles.stageCard}>
              <Text style={styles.stageLabel}>CURRENT STAGE</Text>
              <View style={styles.stageTitleRow}>
                <View style={styles.stageDot} />
                <Text style={styles.stageTitle}>Designer Working</Text>
              </View>
              <Text style={styles.stageDescription}>Next: Proposal Ready · Est. Jun 28</Text>
            </View>

            <Pressable style={styles.projectButton}>
              <Text style={styles.projectButtonText}>View Project Details</Text>
              <AppIcon definition={arrowRightIconDefinition} size={15} color="#FFFFFF" strokeWidth={1.8} />
            </Pressable>
          </View>
        </View>

        <View style={styles.updateHeader}>
          <Text style={styles.updateTitle}>Recent Updates</Text>
          <Pressable style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>See all</Text>
            <AppIcon definition={chevronRightIconDefinition} size={11} color="#C9A86A" strokeWidth={2} />
          </Pressable>
        </View>

        {updates.map((item) => (
          <View key={item.id} style={styles.updateCard}>
            <View
              style={[
                styles.updateDot,
                item.tone === "primary" ? styles.updateDotPrimary : styles.updateDotNeutral,
              ]}
            />
            <View style={styles.updateBody}>
              <Text style={styles.updateCardTitle}>{item.title}</Text>
              <Text style={styles.updateCardDescription}>{item.description}</Text>
            </View>
            <Text style={styles.updateTime}>{item.time}</Text>
          </View>
        ))}
      </ScrollView>

      <AppBottomNav activeTab="home" />
    </View>
  );
}
