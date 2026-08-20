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
  const bottomInset = Math.max(insets.bottom, 8);
  const containerStyle: ViewStyle[] = [
    styles.bottomNav,
    { paddingBottom: bottomInset, minHeight: BASE_NAV_HEIGHT + bottomInset },
    variant === "fixed" ? styles.bottomNavFixed : null,
  ].filter(Boolean) as ViewStyle[];

  return (
    <View style={containerStyle}>
      <BottomNavItem
        active={activeTab === "home"}
        iconDefinition={homeIconDefinition}
        label="Home"
        onPress={() => navigation.navigate("Home")}
      />
      <BottomNavItem
        active={activeTab === "tracking"}
        iconDefinition={dashboardIconDefinition}
        label="Tracking"
        onPress={() => navigation.navigate("Tracking")}
      />
      <BottomNavItem
        active={activeTab === "chat"}
        badge={chatBadge}
        iconDefinition={chatIconDefinition}
        label="Chat"
        onPress={() => navigation.navigate("Messages", activeProjectId ? { projectId: activeProjectId } : undefined)}
      />
      <BottomNavItem
        active={activeTab === "profile"}
        iconDefinition={userIconDefinition}
        label="Profile"
        onPress={() => navigation.navigate("Profile")}
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
