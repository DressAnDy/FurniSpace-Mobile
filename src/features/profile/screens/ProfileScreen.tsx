import React, { useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { getAccessToken } from "../../../core/storage/secureStorage";
import { lockIconDefinition, logoutIconDefinition, mailIconDefinition } from "../../../icons/auth/definitions";
import { bellIconDefinition, phoneIconDefinition } from "../../../icons/communication/definitions";
import { fileTextIconDefinition } from "../../../icons/file/definitions";
import { chevronRightIconDefinition } from "../../../icons/navigation/definitions";
import { projectIconDefinition } from "../../../icons/project/definitions";
import { helpIconDefinition, locationIconDefinition } from "../../../icons/common/definitions";
import type { IconDefinition } from "../../../icons/types";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { AppBottomNav } from "../../../shared/components/AppBottomNav";
import { useBottomNavMetrics } from "../../../shared/hooks/useBottomNavMetrics";
import { useLogoutAction } from "../../auth/hooks/useAuthActions";
import { useAuthStore } from "../../auth/store/auth.store";
import { useLatestUserProject } from "../../project/hooks/useProjects";
import { styles } from "./ProfileScreen.styles";

export function ProfileScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const logoutMutation = useLogoutAction();
  const currentUser = useAuthStore((state) => state.user);
  const { scrollPaddingBottom } = useBottomNavMetrics();
  const { latestProject, totalProjects, projectsQuery } = useLatestUserProject(currentUser?.accountId);

  const displayName = currentUser?.fullName ?? "Guest";
  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const projectLabel = latestProject?.projectName ?? (projectsQuery.isLoading ? "Loading project…" : "No project yet");
  const projectMeta = latestProject ? `${latestProject.projectCode} · ${latestProject.businessType}` : undefined;
  const projectCountLabel = totalProjects > 0 ? String(totalProjects) : projectsQuery.isLoading ? "…" : "0";

  const handleChangePassword = async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      Alert.alert("Sign in required", "Please sign in before changing your password.", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
      return;
    }

    navigation.navigate("ChangePassword");
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.brand}>FURNISPACE</Text>
          <Text style={styles.title}>My Profile</Text>

          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileCopy}>
              <Text style={styles.name}>{displayName}</Text>
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
            <ContactRow icon={mailIconDefinition} text={currentUser?.email ?? "—"} />
            <ContactRow icon={phoneIconDefinition} text={currentUser?.phone ?? "—"} />
            <ContactRow
              icon={projectIconDefinition}
              text={projectLabel}
              meta={projectMeta}
              loading={projectsQuery.isLoading}
            />
            <ContactRow
              icon={locationIconDefinition}
              text="Downtown Plaza, Ho Chi Minh City"
              isLast
            />
          </View>

          <View style={[styles.card, styles.mt15]}>
            <Text style={styles.cardLabel}>ACCOUNT SUMMARY</Text>
            <View style={styles.summaryRow}>
              <SummaryBox value={projectCountLabel} label="TOTAL PROJECTS" />
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
              onPress={handleChangePassword}
            />
            <SettingRow
              icon={fileTextIconDefinition}
              title="Project Documents"
              subtitle="Contracts, proposals & invoices"
            />
            <SettingRow icon={helpIconDefinition} title="Help & Support" subtitle="Contact the FurniSpace team" isLast />
          </View>

          <Pressable
            style={[styles.signOutCard, styles.mt15]}
            disabled={logoutMutation.isPending}
            onPress={() =>
              logoutMutation.mutate(undefined, {
                onSettled: () => navigation.navigate("Login"),
              })
            }
          >
            <View style={styles.signOutIconWrap}>
              <AppIcon definition={logoutIconDefinition} size={15} color="#FB2C36" />
            </View>
            <View style={styles.signOutCopy}>
              <Text style={styles.signOutTitle}>Sign Out</Text>
              <Text style={styles.signOutSub}>{currentUser?.email ?? "—"}</Text>
            </View>
          </Pressable>

          <Text style={styles.versionText}>FURNISPACE v1.0.0 · © 2026</Text>
        </View>
      </ScrollView>

      <AppBottomNav activeTab="profile" />
    </View>
  );
}

function ContactRow({
  icon,
  text,
  meta,
  loading = false,
  isLast = false,
}: {
  icon: IconDefinition;
  text: string;
  meta?: string;
  loading?: boolean;
  isLast?: boolean;
}): React.JSX.Element {
  return (
    <View style={[styles.contactRow, isLast ? styles.contactRowLast : null]}>
      <View style={styles.iconWrap}>
        {loading ? (
          <ActivityIndicator color="#C9A86A" size="small" />
        ) : (
          <AppIcon definition={icon} size={15} color="#7A6F68" />
        )}
      </View>
      <View style={styles.contactCopy}>
        <Text style={styles.contactText} numberOfLines={1}>
          {text}
        </Text>
        {meta ? (
          <Text style={styles.contactMeta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function SummaryBox({ value, label }: { value: string; label: string }): React.JSX.Element {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  isLast = false,
  onPress,
}: {
  icon: IconDefinition;
  title: string;
  subtitle: string;
  isLast?: boolean;
  onPress?: () => void;
}): React.JSX.Element {
  const rowStyle = [styles.settingRow, !isLast && styles.settingDivider];
  const content = (
    <>
      <View style={styles.iconWrap}>
        <AppIcon definition={icon} size={15} color="#7A6F68" />
      </View>
      <View style={styles.settingTextWrap}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <AppIcon definition={chevronRightIconDefinition} size={15} color="#7A6F68" />
    </>
  );

  if (!onPress) {
    return <View style={rowStyle}>{content}</View>;
  }

  return (
    <Pressable accessibilityRole="button" style={rowStyle} onPress={onPress}>
      {content}
    </Pressable>
  );
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "FS";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
