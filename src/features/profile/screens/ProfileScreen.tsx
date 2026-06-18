import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, Text, View } from "react-native";
import { lockIconDefinition, logoutIconDefinition, mailIconDefinition, userIconDefinition } from "../../../icons/auth/definitions";
import { bellIconDefinition, chatIconDefinition, phoneIconDefinition } from "../../../icons/communication/definitions";
import { fileTextIconDefinition } from "../../../icons/file/definitions";
import { dashboardIconDefinition, chevronRightIconDefinition, homeIconDefinition } from "../../../icons/navigation/definitions";
import { projectIconDefinition } from "../../../icons/project/definitions";
import { helpIconDefinition, locationIconDefinition } from "../../../icons/common/definitions";
import type { IconDefinition } from "../../../icons/types";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { styles } from "./ProfileScreen.styles";

export function ProfileScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.brand}>FURNISPACE</Text>
          <Text style={styles.title}>My Profile</Text>

          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>SA</Text>
            </View>
            <View>
              <Text style={styles.name}>Sarah Anderson</Text>
              <Text style={styles.role}>Business Owner</Text>
              <View style={styles.statusChip}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>ACTIVE CLIENT</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>CONTACT INFORMATION</Text>
            <ContactRow icon={mailIconDefinition} text="sarah.anderson@urbancafe.co" />
            <ContactRow icon={phoneIconDefinition} text="+84 901 234 567" />
            <ContactRow icon={projectIconDefinition} text="Urban Coffee House" />
            <ContactRow icon={locationIconDefinition} text="Downtown Plaza, Ho Chi Minh City" />
          </View>

          <View style={[styles.card, styles.mt15]}>
            <Text style={styles.cardLabel}>ACCOUNT SUMMARY</Text>
            <View style={styles.summaryRow}>
              <SummaryBox value="1" label="ACTIVE PROJECT" />
              <SummaryBox value="Jan 2026" label="MEMBER SINCE" />
            </View>
          </View>

          <View style={[styles.card, styles.settingsCard, styles.mt15]}>
            <SettingRow
              icon={bellIconDefinition}
              title="Notification Settings"
              subtitle="Manage alerts and reminders"
            />
            <SettingRow
              icon={lockIconDefinition}
              title="Change Password"
              subtitle="Update your account password"
            />
            <SettingRow
              icon={fileTextIconDefinition}
              title="Project Documents"
              subtitle="Contracts, proposals & invoices"
            />
            <SettingRow icon={helpIconDefinition} title="Help & Support" subtitle="Contact the FurniSpace team" isLast />
          </View>

          <Pressable style={[styles.signOutCard, styles.mt15]}>
            <View style={styles.signOutIconWrap}>
              <AppIcon definition={logoutIconDefinition} size={15} color="#FB2C36" />
            </View>
            <View>
              <Text style={styles.signOutTitle}>Sign Out</Text>
              <Text style={styles.signOutSub}>sarah.anderson@urbancafe.co</Text>
            </View>
          </Pressable>

          <Text style={styles.versionText}>FURNISPACE v1.0.0 · © 2026</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <BottomNavItem label="Home" iconDefinition={homeIconDefinition} onPress={() => navigation.navigate("Home")} />
        <BottomNavItem
          label="Tracking"
          iconDefinition={dashboardIconDefinition}
          onPress={() => navigation.navigate("Tracking")}
        />
        <BottomNavItem label="Chat" iconDefinition={chatIconDefinition} badge="3" onPress={() => navigation.navigate("Messages")} />
        <BottomNavItem label="Alerts" iconDefinition={bellIconDefinition} badge="5" onPress={() => navigation.navigate("Notifications")} />
        <BottomNavItem label="Profile" iconDefinition={userIconDefinition} active />
      </View>
    </View>
  );
}

function ContactRow({ icon, text }: { icon: IconDefinition; text: string }): React.JSX.Element {
  return (
    <View style={styles.contactRow}>
      <View style={styles.iconWrap}>
        <AppIcon definition={icon} size={15} color="#7A6F68" />
      </View>
      <Text style={styles.contactText}>{text}</Text>
    </View>
  );
}

function SummaryBox({ value, label }: { value: string; label: string }): React.JSX.Element {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  isLast = false,
}: {
  icon: IconDefinition;
  title: string;
  subtitle: string;
  isLast?: boolean;
}): React.JSX.Element {
  return (
    <Pressable style={[styles.settingRow, !isLast && styles.settingDivider]}>
      <View style={styles.iconWrap}>
        <AppIcon definition={icon} size={15} color="#7A6F68" />
      </View>
      <View style={styles.settingTextWrap}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <AppIcon definition={chevronRightIconDefinition} size={15} color="#7A6F68" />
    </Pressable>
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
        <AppIcon definition={iconDefinition} size={18} color={active ? "#C9A86A" : "rgba(122,111,104,0.8)"} strokeWidth={1.9} />
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
