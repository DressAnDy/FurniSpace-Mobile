import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { dashboardIconDefinition, menuIconDefinition, arrowLeftIconDefinition } from "../../../icons/navigation/definitions";
import { calendarIconDefinition, projectIconDefinition } from "../../../icons/project/definitions";
import { chatIconDefinition } from "../../../icons/communication/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import type { IconDefinition } from "../../../icons/types";
import { designerProjectTabs, type DesignerProjectTab } from "../data/designer.mock";
import { DESIGNER, designerStyles as s } from "../styles/designer.styles";
import { detailStyles as detail } from "../styles/designer.detail.styles";
import { getProjectStatusLabel } from "../../project/utils/project.mapper";
import type { ProjectStatus } from "../../project/models/project.model";
import { buildProjectTrackingSummary } from "../../project/utils/project.tracking.mapper";
import { getSaleProjectStatusColors } from "../../sale/utils/sale.mapper";

export type DesignerNavTab = "dashboard" | "projects" | "schedules" | "messages" | "more";

const navItems: {
  key: DesignerNavTab;
  label: string;
  icon: IconDefinition;
  route: keyof RootStackParamList;
}[] = [
  { key: "dashboard", label: "Dashboard", icon: dashboardIconDefinition, route: "DesignerDashboard" },
  { key: "projects", label: "Projects", icon: projectIconDefinition, route: "DesignerProjects" },
  { key: "schedules", label: "Schedules", icon: calendarIconDefinition, route: "DesignerSchedules" },
  { key: "messages", label: "Messages", icon: chatIconDefinition, route: "DesignerMessages" },
  { key: "more", label: "More", icon: menuIconDefinition, route: "DesignerMore" },
];

export function DesignerFrame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <View style={s.screen}>
      <View style={s.frame}>{children}</View>
    </View>
  );
}

export function DesignerBottomNav({ active }: { active: DesignerNavTab }): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.nav, s.navFixed, { paddingBottom: Math.max(insets.bottom, 4) }]}>
      {navItems.map((item) => {
        const isActive = active === item.key;
        return (
          <Pressable
            accessibilityRole="button"
            key={item.key}
            style={s.navItem}
            onPress={() => navigation.navigate(item.route as never)}
          >
            {isActive ? <View style={s.navIndicator} /> : null}
            <View style={s.navIcon}>
              <AppIcon definition={item.icon} size={19} color={isActive ? DESIGNER.charcoal : "rgba(122,111,104,.8)"} />
            </View>
            <Text style={[s.navLabel, isActive && s.navLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function DesignerHeader({
  title,
  subtitle,
  children,
  trailing,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  trailing?: React.ReactNode;
}): React.JSX.Element {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: Math.max(insets.top, 18) + 8 }]}>
      <View style={s.headerTopRow}>
        <View style={s.headerCopy}>
          <Text style={s.headerEyebrow}>FurniSpace · Designer</Text>
          <Text style={s.headerTitle}>{title}</Text>
          {subtitle ? <Text style={s.headerSubtitle}>{subtitle}</Text> : null}
        </View>
        {trailing ? <View style={s.headerActions}>{trailing}</View> : null}
      </View>
      {children}
    </View>
  );
}

export function FilterChips({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}): React.JSX.Element {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
      {options.map((option) => {
        const active = selected === option;
        return (
          <Pressable key={option} style={[s.chip, active && s.chipActive]} onPress={() => onSelect(option)}>
            <Text style={[s.chipText, active && s.chipTextActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }): React.JSX.Element {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionLabel}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction}>
          <Text style={s.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Avatar({
  initials,
  color = DESIGNER.accent,
  size = 38,
}: {
  initials: string;
  color?: string;
  size?: number;
}): React.JSX.Element {
  return (
    <View style={[s.roundAvatar, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={s.avatarText}>{initials}</Text>
    </View>
  );
}

export function DesignerProjectTabs({
  active,
  projectId,
}: {
  active: DesignerProjectTab;
  projectId?: string;
}): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={detail.tabsBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={detail.tabs}>
        {designerProjectTabs.map((tab) => {
          const selected = active === tab;
          return (
            <Pressable
              key={tab}
              style={[detail.tabChip, selected && detail.tabChipActive]}
              onPress={() => navigation.setParams({ tab, ...(projectId ? { projectId } : {}) } as never)}
            >
              <Text style={[detail.tabChipText, selected && detail.tabChipTextActive]}>{tab}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function DesignerProjectDetailHeader({
  projectCode,
  projectName,
  businessType,
  status,
  statusLabel,
}: {
  projectCode?: string | null;
  projectName?: string | null;
  businessType?: string | null;
  status?: ProjectStatus | null;
  statusLabel?: string;
}): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const tracking = status ? buildProjectTrackingSummary(status) : null;
  const stages = tracking?.stages ?? [];
  const activeStage =
    tracking?.isRejected
      ? "Rejected"
      : stages.find((stage) => stage.uiState === "ACTIVE")?.label ??
        (status === "COMPLETED" ? "Delivery & Completion" : null);
  const tone = getSaleProjectStatusColors(status ?? "MEASUREMENT_REQUIRED");
  const resolvedStatus = statusLabel ?? (status ? getProjectStatusLabel(status) : "—");

  return (
    <View style={[detail.hero, { paddingTop: Math.max(insets.top, 18) + 8 }]}>
      <View style={detail.heroDecorLarge} />
      <View style={detail.heroDecorMedium} />

      <View style={detail.topRow}>
        <Pressable style={detail.backButton} onPress={() => navigation.navigate("DesignerProjects")}>
          <AppIcon definition={arrowLeftIconDefinition} size={15} color={DESIGNER.white} />
        </Pressable>
        <View style={detail.titleWrap}>
          <Text style={detail.code}>
            {(projectCode ?? "PRJ-…") + (businessType ? ` · ${businessType}` : "")}
          </Text>
          <Text style={detail.title} numberOfLines={2}>
            {projectName ?? "Project detail"}
          </Text>
        </View>
        <View
          style={[
            detail.statusPill,
            { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor },
          ]}
        >
          <Text style={[detail.statusPillText, { color: tone.color }]} numberOfLines={2}>
            {resolvedStatus}
          </Text>
        </View>
      </View>

      {stages.length > 0 ? (
        <View style={detail.progressWrap}>
          <View style={detail.progressTrack}>
            {stages.map((stage, index) => {
              const isDone = stage.uiState === "COMPLETED";
              const isCurrent = stage.uiState === "ACTIVE";
              return (
                <React.Fragment key={stage.id}>
                  <View
                    style={[
                      detail.progressDot,
                      isDone && detail.progressDotDone,
                      isCurrent && detail.progressDotCurrent,
                    ]}
                  />
                  {index < stages.length - 1 ? (
                    <View style={[detail.progressLine, isDone && detail.progressLineDone]} />
                  ) : null}
                </React.Fragment>
              );
            })}
          </View>
          {activeStage ? <Text style={detail.stageLabel}>{activeStage}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}
