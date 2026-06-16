import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { mailIconDefinition, phoneIconDefinition, chatIconDefinition, bellIconDefinition } from "../../../icons/communication/definitions";
import {
  arrowLeftIconDefinition,
  dashboardIconDefinition,
  homeIconDefinition,
} from "../../../icons/navigation/definitions";
import { calendarIconDefinition } from "../../../icons/project/definitions";
import { checkIconDefinition, pendingIconDefinition } from "../../../icons/status/definitions";
import type { IconDefinition } from "../../../icons/types";
import { AppIcon } from "../../../shared/components/AppIcon";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";

type TimelineStatus = "done" | "active" | "pending";

type TimelineItem = {
  id: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  status: TimelineStatus;
  note?: string;
};

const timelineItems: TimelineItem[] = [
  {
    id: "request-submitted",
    title: "Request Submitted",
    subtitle: "Project brief received",
    dateLabel: "May 15, 2026",
    status: "done",
  },
  {
    id: "sales-review",
    title: "Sales Review",
    subtitle: "Scope and budget confirmed",
    dateLabel: "May 17, 2026",
    status: "done",
  },
  {
    id: "designer-working",
    title: "Designer Working",
    subtitle: "Marcus Chen is crafting your space",
    dateLabel: "In Progress",
    status: "active",
    note: "Marcus is currently crafting your design. Expect the initial 3D proposal within 3 days.",
  },
  {
    id: "proposal-ready",
    title: "Proposal Ready",
    subtitle: "3D render & material board",
    dateLabel: "Est. Jun 15",
    status: "pending",
  },
  {
    id: "quotation",
    title: "Quotation",
    subtitle: "Itemised cost breakdown",
    dateLabel: "Pending",
    status: "pending",
  },
  {
    id: "production",
    title: "Production",
    subtitle: "Custom furniture manufacturing",
    dateLabel: "Pending",
    status: "pending",
  },
  {
    id: "installation",
    title: "Installation",
    subtitle: "On-site team deployment",
    dateLabel: "Jun 27, 2026",
    status: "pending",
  },
  {
    id: "handover",
    title: "Handover",
    subtitle: "Final walkthrough & sign-off",
    dateLabel: "Est. Jun 28",
    status: "pending",
  },
];

export function ProjectTrackingScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Pressable style={styles.backButton} onPress={() => navigation.navigate("Home")}>
              <AppIcon definition={arrowLeftIconDefinition} size={18} color="#FFFFFF" strokeWidth={1.8} />
            </Pressable>
            <View>
              <Text style={styles.brandText}>FURNISPACE</Text>
              <Text style={styles.headerTitle}>Project Tracking</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View>
                <Text style={styles.projectName}>Urban Coffee House</Text>
                <Text style={styles.projectMeta}>Project #FS-2024-089 · Cafe Interior</Text>
              </View>
              <View style={styles.activePill}>
                <View style={styles.activePillDot} />
                <Text style={styles.activePillText}>ACTIVE</Text>
              </View>
            </View>
            <View style={styles.stageRow}>
              <Text style={styles.stageText}>Stage 3 of 8</Text>
              <Text style={styles.stagePercent}>25%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.metricsRow}>
            <MetricCard value="45%" label="COMPLETE" />
            <MetricCard value="16" label="DAYS LEFT" />
            <MetricCard value="v2.1" label="PROPOSAL" />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>ASSIGNED TEAM</Text>
            <TeamRow initials="MC" initialsBackground="#3A3330" name="Marcus Chen" role="Lead Designer" />
            <TeamRow initials="JL" initialsBackground="#C9A86A" name="Jennifer Liu" role="Sales Manager" />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>PROJECT TIMELINE</Text>
            <View style={styles.timelineList}>
              {timelineItems.map((item, index) => (
                <TimelineRow key={item.id} item={item} isLast={index === timelineItems.length - 1} />
              ))}
            </View>
          </View>

          <View style={styles.completionCard}>
            <View style={styles.completionIconWrap}>
              <AppIcon definition={calendarIconDefinition} size={20} color="#C9A86A" />
            </View>
            <View>
              <Text style={styles.completionLabel}>ESTIMATED COMPLETION</Text>
              <Text style={styles.completionDate}>June 28, 2026</Text>
              <Text style={styles.completionMeta}>16 days · Downtown Plaza</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <BottomNavItem label="Home" iconDefinition={homeIconDefinition} onPress={() => navigation.navigate("Home")} />
        <BottomNavItem label="Tracking" iconDefinition={dashboardIconDefinition} active />
        <BottomNavItem
          label="Chat"
          iconDefinition={chatIconDefinition}
          badge="3"
          onPress={() => navigation.navigate("Messages")}
        />
        <BottomNavItem label="Alerts" iconDefinition={bellIconDefinition} badge="5" onPress={() => navigation.navigate("Notifications")} />
      </View>
    </View>
  );
}

function MetricCard({ value, label }: { value: string; label: string }): React.JSX.Element {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function TeamRow({
  initials,
  initialsBackground,
  name,
  role,
}: {
  initials: string;
  initialsBackground: string;
  name: string;
  role: string;
}): React.JSX.Element {
  return (
    <View style={styles.teamRow}>
      <View style={[styles.teamAvatar, { backgroundColor: initialsBackground }]}>
        <Text style={styles.teamInitials}>{initials}</Text>
      </View>
      <View style={styles.teamTextWrap}>
        <Text style={styles.teamName}>{name}</Text>
        <Text style={styles.teamRole}>{role}</Text>
      </View>
      <View style={styles.teamActions}>
        <Pressable style={styles.teamActionButton}>
          <AppIcon definition={phoneIconDefinition} size={13} color="#7A6F68" />
        </Pressable>
        <Pressable style={styles.teamActionButton}>
          <AppIcon definition={mailIconDefinition} size={13} color="#7A6F68" />
        </Pressable>
      </View>
    </View>
  );
}

function TimelineRow({ item, isLast }: { item: TimelineItem; isLast: boolean }): React.JSX.Element {
  const isActive = item.status === "active";
  const isDone = item.status === "done";

  return (
    <View style={[styles.timelineRow, isLast && styles.timelineRowLast]}>
      <View style={styles.timelineRailWrap}>
        <View
          style={[
            styles.timelineDot,
            isDone && styles.timelineDotDone,
            isActive && styles.timelineDotActive,
            item.status === "pending" && styles.timelineDotPending,
          ]}
        >
          <AppIcon
            definition={isDone ? checkIconDefinition : pendingIconDefinition}
            size={13}
            color={isDone ? "#16A34A" : isActive ? "#C9A86A" : "#9B8F86"}
            strokeWidth={2}
          />
        </View>
        {!isLast ? <View style={[styles.timelineLine, isDone && styles.timelineLineDone, isActive && styles.timelineLineActive]} /> : null}
      </View>

      <View style={styles.timelineContent}>
        <View style={styles.timelineHeader}>
          <View>
            <Text style={[styles.timelineTitle, isActive && styles.timelineTitleActive, item.status === "pending" && styles.timelineTitlePending]}>
              {item.title}
            </Text>
            <Text style={styles.timelineSubtitle}>{item.subtitle}</Text>
          </View>
          <View style={styles.timelineDateWrap}>
            <AppIcon definition={calendarIconDefinition} size={11} color="#7A6F68" />
            <Text style={styles.timelineDateText}>{item.dateLabel}</Text>
          </View>
        </View>

        {item.note ? (
          <View style={styles.timelineNote}>
            <Text style={styles.timelineNoteText}>{item.note}</Text>
          </View>
        ) : null}
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
    paddingBottom: 22,
  },
  headerTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 11,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 15,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  brandText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    letterSpacing: 1,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontFamily: "serif",
    fontSize: 25,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 15,
    borderWidth: 1,
    marginTop: 19,
    padding: 16,
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  projectName: {
    color: "#FFFFFF",
    fontFamily: "serif",
    fontSize: 24,
  },
  projectMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 2,
  },
  activePill: {
    alignItems: "center",
    backgroundColor: "rgba(255,185,0,0.2)",
    borderColor: "rgba(255,185,0,0.3)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    height: 24,
    marginTop: 1,
    paddingHorizontal: 10,
  },
  activePillDot: {
    backgroundColor: "#FFB900",
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  activePillText: {
    color: "#FFD230",
    fontSize: 10,
    letterSpacing: 0.25,
  },
  stageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  stageText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
  },
  stagePercent: {
    color: "#C9A86A",
    fontSize: 11,
  },
  progressTrack: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    height: 4,
    marginTop: 5,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: "#C9A86A",
    height: 4,
    width: "25%",
  },
  content: {
    padding: 19,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 9,
  },
  metricCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(60,51,48,0.05)",
    borderRadius: 15,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  metricValue: {
    color: "#C9A86A",
    fontFamily: "serif",
    fontSize: 18,
  },
  metricLabel: {
    color: "#7A6F68",
    fontSize: 10,
    letterSpacing: 0.25,
    marginTop: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(60,51,48,0.05)",
    borderRadius: 15,
    borderWidth: 1,
    marginTop: 15,
    padding: 16,
  },
  cardLabel: {
    color: "#7A6F68",
    fontSize: 10,
    letterSpacing: 1,
  },
  teamRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 11,
  },
  teamAvatar: {
    alignItems: "center",
    borderRadius: 19,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  teamInitials: {
    color: "#FFFFFF",
    fontSize: 11,
  },
  teamTextWrap: {
    flex: 1,
    marginLeft: 11,
  },
  teamName: {
    color: "#2C2420",
    fontSize: 13,
  },
  teamRole: {
    color: "#7A6F68",
    fontSize: 11,
  },
  teamActions: {
    flexDirection: "row",
    gap: 8,
  },
  teamActionButton: {
    alignItems: "center",
    backgroundColor: "#F5F2ED",
    borderRadius: 14,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  timelineList: {
    marginTop: 10,
  },
  timelineRow: {
    flexDirection: "row",
    minHeight: 62,
  },
  timelineRowLast: {
    minHeight: 47,
  },
  timelineRailWrap: {
    alignItems: "center",
    marginRight: 13,
    width: 26,
  },
  timelineDot: {
    alignItems: "center",
    backgroundColor: "#E8E4DF",
    borderColor: "rgba(60,51,48,0.12)",
    borderRadius: 13,
    borderWidth: 1,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  timelineDotDone: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A4F4CF",
  },
  timelineDotActive: {
    backgroundColor: "rgba(201,168,106,0.15)",
    borderColor: "rgba(201,168,106,0.4)",
  },
  timelineDotPending: {
    backgroundColor: "#E8E4DF",
  },
  timelineLine: {
    backgroundColor: "#E8E4DF",
    flex: 1,
    marginTop: 4,
    width: 1,
  },
  timelineLineDone: {
    backgroundColor: "#86EFAC",
  },
  timelineLineActive: {
    backgroundColor: "rgba(201,168,106,0.35)",
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 15,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timelineTitle: {
    color: "#2C2420",
    fontSize: 13,
  },
  timelineTitleActive: {
    color: "#C9A86A",
    fontFamily: "serif",
  },
  timelineTitlePending: {
    color: "#7A6F68",
  },
  timelineSubtitle: {
    color: "rgba(122,111,104,0.7)",
    fontSize: 11,
    marginTop: 1,
  },
  timelineDateWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    paddingLeft: 7,
  },
  timelineDateText: {
    color: "#7A6F68",
    fontSize: 10,
  },
  timelineNote: {
    backgroundColor: "rgba(201,168,106,0.06)",
    borderColor: "rgba(201,168,106,0.2)",
    borderRadius: 11,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timelineNoteText: {
    color: "#7A6F68",
    fontSize: 11,
    lineHeight: 18,
  },
  completionCard: {
    backgroundColor: "#3A3330",
    borderRadius: 15,
    flexDirection: "row",
    gap: 15,
    marginTop: 15,
    paddingHorizontal: 19,
    paddingVertical: 15,
  },
  completionIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 30,
  },
  completionLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    letterSpacing: 1,
  },
  completionDate: {
    color: "#FFFFFF",
    fontFamily: "serif",
    fontSize: 16,
    marginTop: 2,
  },
  completionMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
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
