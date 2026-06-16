import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { bellIconDefinition, chatIconDefinition } from "../../../icons/communication/definitions";
import {
  arrowRightIconDefinition,
  chevronRightIconDefinition,
  dashboardIconDefinition,
  homeIconDefinition,
} from "../../../icons/navigation/definitions";
import type { IconDefinition } from "../../../icons/types";
import { AppIcon } from "../../../shared/components/AppIcon";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";

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

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerWrap}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.greetingLabel}>GOOD AFTERNOON</Text>
              <Text style={styles.userName}>Sarah Anderson</Text>
            </View>

            <View style={styles.notifyWrap}>
              <View style={styles.notifyIcon}>
                <AppIcon definition={bellIconDefinition} size={15} color="#FFFFFF" strokeWidth={1.8} />
              </View>
              <View style={styles.notifyBadge}>
                <Text style={styles.notifyBadgeText}>5</Text>
              </View>
            </View>
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

      <View style={styles.bottomNav}>
        <BottomNavItem label="Home" iconDefinition={homeIconDefinition} active />
        <BottomNavItem
          label="Tracking"
          iconDefinition={dashboardIconDefinition}
          onPress={() => navigation.navigate("Tracking")}
        />
        <BottomNavItem label="Chat" iconDefinition={chatIconDefinition} badge="3" onPress={() => navigation.navigate("Messages")} />
        <BottomNavItem label="Alerts" iconDefinition={bellIconDefinition} badge="5" onPress={() => navigation.navigate("Notifications")} />
      </View>
    </View>
  );
}

type BottomNavItemProps = {
  label: string;
  iconDefinition: IconDefinition;
  active?: boolean;
  badge?: string;
  onPress?: () => void;
};

function BottomNavItem({
  label,
  iconDefinition,
  active = false,
  badge,
  onPress,
}: BottomNavItemProps): React.JSX.Element {
  return (
    <Pressable style={styles.bottomItem} onPress={onPress}>
      <View style={styles.bottomIconWrap}>
        <AppIcon
          definition={iconDefinition}
          size={19}
          color={active ? "#C9A86A" : "rgba(122,111,104,0.8)"}
          strokeWidth={1.9}
        />
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
  headerWrap: {
    backgroundColor: "#C1A06A",
    paddingBottom: 16,
    paddingHorizontal: 22,
    paddingTop: 52,
  },
  headerTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  greetingLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    letterSpacing: 1.1,
  },
  userName: {
    color: "#FFFFFF",
    fontFamily: "serif",
    fontSize: 30,
    marginTop: 4,
  },
  notifyWrap: {
    position: "relative",
  },
  notifyIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  notifyBadge: {
    alignItems: "center",
    backgroundColor: "#C9A86A",
    borderRadius: 8,
    height: 16,
    justifyContent: "center",
    position: "absolute",
    right: -5,
    top: -6,
    width: 16,
  },
  notifyBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
  },
  activeProjectRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  line: {
    backgroundColor: "rgba(255,255,255,0.2)",
    flex: 1,
    height: 1,
  },
  activeProjectText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    letterSpacing: 1,
  },
  projectCard: {
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(60,51,48,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: -8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    width: "91%",
  },
  projectCardTopBorder: {
    backgroundColor: "#C9A86A",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: 4,
  },
  projectCardBody: {
    padding: 18,
  },
  projectHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  projectTitle: {
    color: "#2C2420",
    fontFamily: "serif",
    fontSize: 24,
  },
  projectCode: {
    color: "#7A6F68",
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderColor: "#FEE685",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    height: 24,
    paddingHorizontal: 10,
  },
  statusDot: {
    backgroundColor: "#FE9A00",
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  statusText: {
    color: "#BB4D00",
    fontSize: 10,
    letterSpacing: 0.25,
  },
  peopleRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 14,
  },
  avatarRow: {
    flexDirection: "row",
    marginRight: 12,
  },
  avatarCircle: {
    alignItems: "center",
    borderColor: "#FFFFFF",
    borderRadius: 13,
    borderWidth: 2,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  avatarDark: {
    backgroundColor: "#3A3330",
  },
  avatarGold: {
    backgroundColor: "#C9A86A",
  },
  avatarOverlap: {
    marginLeft: -7,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 9,
  },
  peopleName: {
    color: "#7A6F68",
    fontSize: 11,
  },
  peopleRole: {
    color: "rgba(122,111,104,0.6)",
    fontSize: 10,
    marginTop: 2,
  },
  stageCard: {
    backgroundColor: "rgba(245,242,237,0.65)",
    borderRadius: 15,
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  stageLabel: {
    color: "#7A6F68",
    fontSize: 10,
    letterSpacing: 1,
  },
  stageTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 6,
  },
  stageDot: {
    backgroundColor: "#C9A86A",
    borderRadius: 4,
    height: 8,
    marginRight: 8,
    width: 8,
  },
  stageTitle: {
    color: "#2C2420",
    fontFamily: "serif",
    fontSize: 13,
  },
  stageDescription: {
    color: "#7A6F68",
    fontSize: 11,
    marginTop: 6,
  },
  projectButton: {
    alignItems: "center",
    backgroundColor: "#3A3330",
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  projectButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
  },
  updateHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  updateTitle: {
    color: "#2C2420",
    fontFamily: "serif",
    fontSize: 17,
    fontStyle: "italic",
  },
  seeAllButton: {
    alignItems: "center",
    flexDirection: "row",
  },
  seeAllText: {
    color: "#C9A86A",
    fontSize: 11,
  },
  updateCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(60,51,48,0.05)",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 9,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  updateDot: {
    borderRadius: 4,
    height: 8,
    marginTop: 5,
    width: 8,
  },
  updateDotPrimary: {
    backgroundColor: "#C9A86A",
  },
  updateDotNeutral: {
    backgroundColor: "#9B8F86",
  },
  updateBody: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  updateCardTitle: {
    color: "#2C2420",
    fontSize: 13,
  },
  updateCardDescription: {
    color: "#7A6F68",
    fontSize: 11,
    marginTop: 2,
  },
  updateTime: {
    color: "rgba(122,111,104,0.6)",
    fontSize: 10,
    marginTop: 2,
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
  bottomBadge: {
    alignItems: "center",
    backgroundColor: "#C9A86A",
    borderRadius: 8,
    height: 15,
    justifyContent: "center",
    position: "absolute",
    right: -10,
    top: -5,
    width: 15,
  },
  bottomBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
  },
});
