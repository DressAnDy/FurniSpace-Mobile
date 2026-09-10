import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, Text, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { userIconDefinition } from "../../icons/auth/definitions";
import { chatIconDefinition } from "../../icons/communication/definitions";
import { dashboardIconDefinition, homeIconDefinition } from "../../icons/navigation/definitions";
import type { IconDefinition } from "../../icons/types";
import type { RootStackParamList } from "../../app/navigation/RootNavigator";
import { useAuthStore } from "../../features/auth/store/auth.store";
import { useProjectStore } from "../../features/project/store/project.store";
import { AppIcon } from "./AppIcon";
import { BASE_NAV_HEIGHT, styles } from "./AppBottomNav.styles";

export type AppBottomNavTab = "home" | "tracking" | "chat" | "profile";

type AppBottomNavProps = {
  activeTab?: AppBottomNavTab;
  chatBadge?: string;
  variant?: "fixed" | "inline";
};

export function AppBottomNav({ activeTab, chatBadge, variant = "fixed" }: AppBottomNavProps): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const role = useAuthStore((state) => state.user?.role ?? null);
  const isSales = role === "SALES";
  const isDesigner = role === "DESIGNER";
  const bottomInset = Math.max(insets.bottom, 8);
  const containerStyle: ViewStyle[] = [
    styles.bottomNav,
    { paddingBottom: bottomInset, minHeight: BASE_NAV_HEIGHT + bottomInset },
    variant === "fixed" ? styles.bottomNavFixed : null,
  ].filter(Boolean) as ViewStyle[];

  const homeRoute = isSales ? "SaleDashboard" : isDesigner ? "DesignerDashboard" : "Home";
  const projectsRoute = isSales ? "SaleProjects" : isDesigner ? "DesignerProjects" : "Tracking";
  const moreRoute = isSales ? "SaleMore" : isDesigner ? "DesignerMore" : "Profile";

  return (
    <View style={containerStyle}>
      <BottomNavItem
        active={activeTab === "home"}
        iconDefinition={homeIconDefinition}
        label={isSales || isDesigner ? "Dashboard" : "Home"}
        onPress={() => navigation.navigate(homeRoute)}
      />
      <BottomNavItem
        active={activeTab === "tracking"}
        iconDefinition={dashboardIconDefinition}
        label={isSales || isDesigner ? "Projects" : "Tracking"}
        onPress={() => navigation.navigate(projectsRoute)}
      />
      <BottomNavItem
        active={activeTab === "chat"}
        badge={chatBadge}
        iconDefinition={chatIconDefinition}
        label="Chat"
        onPress={() => {
          if (isSales) {
            navigation.navigate("SaleMessages");
            return;
          }
          if (isDesigner) {
            navigation.navigate("DesignerMessages");
            return;
          }
          navigation.navigate("Messages", activeProjectId ? { projectId: activeProjectId } : undefined);
        }}
      />
      <BottomNavItem
        active={activeTab === "profile"}
        iconDefinition={userIconDefinition}
        label={isSales || isDesigner ? "More" : "Profile"}
        onPress={() => navigation.navigate(moreRoute)}
      />
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
