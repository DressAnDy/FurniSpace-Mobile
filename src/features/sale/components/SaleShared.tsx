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

export type SaleNavTab = "dashboard" | "requests" | "projects" | "messages" | "more";

const navItems: { key: SaleNavTab; label: string; icon: IconDefinition; route: keyof RootStackParamList; badge?: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: dashboardIconDefinition, route: "SaleDashboard" },
  { key: "requests", label: "Requests", icon: clipboardIconDefinition, route: "SaleRequests", badge: "7" },
  { key: "projects", label: "Projects", icon: projectIconDefinition, route: "SaleProjects" },
  { key: "messages", label: "Messages", icon: chatIconDefinition, route: "SaleMessages", badge: "4" },
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
          <Text style={s.headerEyebrow}>FurniSpace · Sales</Text>
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
      {action ? <Pressable onPress={onAction}><Text style={s.sectionAction}>{action}</Text></Pressable> : null}
    </View>
  );
}

export function ProjectDetailHeader({
  projectCode,
  projectName,
  businessType,
  statusLabel,
}: {
  projectCode?: string;
  projectName?: string;
  businessType?: string;
  statusLabel?: string;
} = {}): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
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
        {Array.from({ length: 15 }, (_, index) => (
          <React.Fragment key={index}>
            <View style={[s.progressDot, index < 3 && s.progressDone, index === 3 && s.progressCurrent]} />
            {index < 14 ? <View style={[s.progressLine, index < 3 && s.progressLineDone]} /> : null}
          </React.Fragment>
        ))}
      </View>
      <Text style={s.progressLabel}>
        Status · <Text style={s.progressGold}>{statusLabel ?? "Loading"}</Text>
      </Text>
    </View>
  );
}

export function ProjectTabs({ active, projectId }: { active: ProjectDetailTab; projectId?: string }): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
      {projectTabs.map((tab) => {
        const selected = active === tab;
        return (
          <Pressable
            key={tab}
            style={[s.chip, selected && s.chipActive]}
            onPress={() => navigation.setParams({ tab, ...(projectId ? { projectId } : {}) } as never)}
          >
            <Text style={[s.chipText, selected && s.chipTextActive]}>{tab}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function DetailFixedActions(): React.JSX.Element {
  return (
    <View style={s.fixedActions}>
      <Pressable style={s.fixedPrimary}><Text style={s.buttonPrimaryText}>Assign Designer</Text></Pressable>
      <Pressable style={s.fixedSecondary}><Text style={s.buttonSecondaryText}>More Actions</Text></Pressable>
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
