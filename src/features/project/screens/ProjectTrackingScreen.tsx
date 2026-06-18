import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, Text, View } from "react-native";
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
import { styles } from "./ProjectTrackingScreen.styles";

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
