import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { lockIconDefinition, logoutIconDefinition, mailIconDefinition, userIconDefinition } from "../../../icons/auth/definitions";
import { bellIconDefinition, chatIconDefinition, phoneIconDefinition } from "../../../icons/communication/definitions";
import { fileTextIconDefinition } from "../../../icons/file/definitions";
import { dashboardIconDefinition, chevronRightIconDefinition, homeIconDefinition } from "../../../icons/navigation/definitions";
import { projectIconDefinition } from "../../../icons/project/definitions";
import { helpIconDefinition, locationIconDefinition } from "../../../icons/common/definitions";
import type { IconDefinition } from "../../../icons/types";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";

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
    paddingBottom: 30,
  },
  brand: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    letterSpacing: 1,
  },
  title: {
    color: "#FFFFFF",
    fontFamily: "serif",
    fontSize: 31,
    marginTop: 4,
  },
  profileRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 18,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#C9A86A",
    borderRadius: 30,
    height: 60,
    justifyContent: "center",
    width: 60,
  },
  avatarText: {
    color: "#FFFFFF",
    fontFamily: "serif",
    fontSize: 19,
  },
  name: {
    color: "#FFFFFF",
    fontFamily: "serif",
    fontSize: 25,
    marginLeft: 15,
  },
  role: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    marginLeft: 15,
    marginTop: 2,
  },
  statusChip: {
    alignItems: "center",
    backgroundColor: "rgba(201,168,106,0.2)",
    borderColor: "rgba(201,168,106,0.3)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    marginLeft: 15,
    marginTop: 7,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusDot: {
    backgroundColor: "#C9A86A",
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  statusText: {
    color: "#C9A86A",
    fontSize: 10,
    letterSpacing: 0.25,
  },
  content: {
    paddingHorizontal: 19,
    paddingTop: 19,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(60,51,48,0.05)",
    borderRadius: 15,
    borderWidth: 1,
    padding: 16,
  },
  mt15: {
    marginTop: 15,
  },
  cardLabel: {
    color: "#7A6F68",
    fontSize: 10,
    letterSpacing: 1,
  },
  contactRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 11,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "#F5F2ED",
    borderRadius: 11,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  contactText: {
    color: "#2C2420",
    fontSize: 13,
    marginLeft: 11,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 11,
    marginTop: 11,
  },
  summaryBox: {
    alignItems: "center",
    backgroundColor: "rgba(245,242,237,0.6)",
    borderRadius: 15,
    flex: 1,
    paddingVertical: 9,
  },
  summaryValue: {
    color: "#2C2420",
    fontFamily: "serif",
    fontSize: 17,
  },
  summaryLabel: {
    color: "#7A6F68",
    fontSize: 10,
    letterSpacing: 0.25,
    marginTop: 2,
  },
  settingsCard: {
    overflow: "hidden",
    padding: 0,
  },
  settingRow: {
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  settingDivider: {
    borderBottomColor: "rgba(60,51,48,0.05)",
    borderBottomWidth: 1,
  },
  settingTextWrap: {
    flex: 1,
    marginHorizontal: 11,
  },
  settingTitle: {
    color: "#2C2420",
    fontSize: 13,
  },
  settingSubtitle: {
    color: "#7A6F68",
    fontSize: 11,
    marginTop: 1,
  },
  signOutCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#FFC9C9",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  signOutIconWrap: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 11,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  signOutTitle: {
    color: "#FB2C36",
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 11,
  },
  signOutSub: {
    color: "rgba(255,100,103,0.7)",
    fontSize: 11,
    fontWeight: "500",
    marginLeft: 11,
    marginTop: 1,
  },
  versionText: {
    color: "rgba(122,111,104,0.4)",
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 15,
    textAlign: "center",
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
    minWidth: 15,
    paddingHorizontal: 4,
    position: "absolute",
    right: -10,
    top: -5,
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
