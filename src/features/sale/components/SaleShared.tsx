import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { dashboardIconDefinition, menuIconDefinition } from "../../../icons/navigation/definitions";
import { clipboardIconDefinition, projectIconDefinition } from "../../../icons/project/definitions";
import { chatIconDefinition } from "../../../icons/communication/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import type { IconDefinition } from "../../../icons/types";
import { projectTabs, type ProjectDetailTab } from "../data/sale.mock";
import { SALE, saleStyles as s } from "../styles/sale.styles";
import type { ProjectStatus } from "../../project/models/project.model";
import { buildProjectTrackingSummary } from "../../project/utils/project.tracking.mapper";

export type SaleNavTab = "dashboard" | "requests" | "projects" | "messages" | "more";

const navItems: { key: SaleNavTab; label: string; icon: IconDefinition; route: keyof RootStackParamList; badge?: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: dashboardIconDefinition, route: "SaleDashboard" },
  { key: "requests", label: "Requests", icon: clipboardIconDefinition, route: "SaleRequests" },
  { key: "projects", label: "Projects", icon: projectIconDefinition, route: "SaleProjects" },
  { key: "messages", label: "Messages", icon: chatIconDefinition, route: "SaleMessages" },
  { key: "more", label: "More", icon: menuIconDefinition, route: "SaleMore" },
];

export function SaleFrame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <View style={s.screen}>
      <View style={s.frame}>{children}</View>
    </View>
  );
}

export function SaleBottomNav({ active }: { active: SaleNavTab }): React.JSX.Element {
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
              <AppIcon definition={item.icon} size={19} color={isActive ? SALE.charcoal : "rgba(122,111,104,.8)"} />
              {item.badge ? (
                <View style={s.badge}><Text style={s.badgeText}>{item.badge}</Text></View>
              ) : null}
            </View>
            <Text style={[s.navLabel, isActive && s.navLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SaleHeader({
  title,
  titleNode,
  subtitle,
  children,
  trailing,
}: {
  title: string;
  titleNode?: React.ReactNode;
  subtitle?: string;
  children?: React.ReactNode;
  trailing?: React.ReactNode;
}): React.JSX.Element {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: Math.max(insets.top, 18) + 8 }]}>
      <View style={s.headerTopRow}>
        <View style={s.headerCopy}>
          <Text style={s.headerEyebrow}>FurniSpace · Sales</Text>
          {titleNode ?? <Text style={s.headerTitle}>{title}</Text>}
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
      {action ? <Pressable onPress={onAction}><Text style={s.sectionAction}>{action}</Text></Pressable> : null}
    </View>
  );
}

export function ProjectDetailHeader({
  projectCode,
  projectName,
  businessType,
  statusLabel,
  status,
}: {
  projectCode?: string;
  projectName?: string;
  businessType?: string;
  statusLabel?: string;
  status?: ProjectStatus;
} = {}): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const tracking = status ? buildProjectTrackingSummary(status) : null;
  const stages = tracking?.stages ?? [];
  const stageLabel =
    tracking?.isRejected
      ? "Rejected"
      : tracking?.stages.find((stage) => stage.uiState === "ACTIVE")?.label ??
        (status === "COMPLETED" ? "Delivery & Completion" : null);

  return (
    <View style={[s.header, { paddingTop: Math.max(insets.top, 18) + 8 }]}>
      <View style={s.detailHeaderTop}>
        <Pressable style={s.backButton} onPress={() => navigation.navigate("SaleProjects")}>
          <Text style={{ color: SALE.white, fontSize: 19 }}>‹</Text>
        </Pressable>
        <View style={s.detailTitleWrap}>
          <Text style={s.detailCode}>
            {(projectCode ?? "PRJ-…") + (businessType ? ` · ${businessType.toUpperCase()}` : "")}
          </Text>
          <Text style={s.detailTitle}>{projectName ?? "Project detail"}</Text>
        </View>
        <View style={s.status}>
          <Text style={s.statusText}>{statusLabel ?? "—"}</Text>
        </View>
      </View>
      <View style={s.progress}>
        {stages.length > 0
          ? stages.map((stage, index) => {
              const isDone = stage.uiState === "COMPLETED";
              const isCurrent = stage.uiState === "ACTIVE";
              return (
                <React.Fragment key={stage.id}>
                  <View
                    style={[
                      s.progressDot,
                      isDone && s.progressDone,
                      isCurrent && s.progressCurrent,
                    ]}
                  />
                  {index < stages.length - 1 ? (
                    <View style={[s.progressLine, isDone && s.progressLineDone]} />
                  ) : null}
                </React.Fragment>
              );
            })
          : Array.from({ length: 6 }, (_, index) => (
              <React.Fragment key={index}>
                <View style={s.progressDot} />
                {index < 5 ? <View style={s.progressLine} /> : null}
              </React.Fragment>
            ))}
      </View>
      <Text style={s.progressLabel}>
        {tracking?.isRejected ? (
          <>Rejected · <Text style={s.progressGold}>{statusLabel ?? "Rejected"}</Text></>
        ) : (
          <>
            {stageLabel ? `${stageLabel} · ` : "Status · "}
            <Text style={s.progressGold}>
              {statusLabel ?? "Loading"}
              {tracking ? ` · ${tracking.progressPercent}%` : ""}
            </Text>
          </>
        )}
      </Text>
    </View>
  );
}

export function ProjectTabs({ active, projectId }: { active: ProjectDetailTab; projectId?: string }): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={s.tabsBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
        {projectTabs.map((tab) => {
          const selected = active === tab;
          return (
            <Pressable
              key={tab}
              style={[s.tabChip, selected && s.tabChipActive]}
              onPress={() => navigation.setParams({ tab, ...(projectId ? { projectId } : {}) } as never)}
            >
              <Text style={[s.tabChipText, selected && s.tabChipTextActive]}>{tab}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function DetailFixedActions({
  showAssignDesigner = true,
  onAssignDesigner,
}: {
  showAssignDesigner?: boolean;
  onAssignDesigner?: () => void;
} = {}): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  if (!showAssignDesigner) {
    return null;
  }

  return (
    <View style={[s.fixedActions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <Pressable style={s.fixedPrimary} onPress={onAssignDesigner}>
        <Text style={s.buttonPrimaryText}>Assign Designer</Text>
      </Pressable>
    </View>
  );
}

export function Avatar({ initials, color, size = 38 }: { initials: string; color: string; size?: number }): React.JSX.Element {
  return (
    <View style={[s.roundAvatar, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={s.avatarText}>{initials}</Text>
    </View>
  );
}
