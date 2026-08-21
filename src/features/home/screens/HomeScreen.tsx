import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { bellIconDefinition } from "../../../icons/communication/definitions";
import {
  arrowRightIconDefinition,
  chevronRightIconDefinition,
} from "../../../icons/navigation/definitions";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { AppIcon } from "../../../shared/components/AppIcon";
import { AppBottomNav } from "../../../shared/components/AppBottomNav";
import { useBottomNavMetrics } from "../../../shared/hooks/useBottomNavMetrics";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { useAuthStore } from "../../auth/store/auth.store";
import { useNotificationBadgeLabel } from "../../notification/hooks/useNotifications";
import { useActiveProjectSummary } from "../../project/hooks/useProjects";
import { styles } from "./HomeScreen.styles";

type UpdateItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  tone: "primary" | "neutral";
};

const updates: UpdateItem[] = [
  {
    id: "u1",
    title: "3D Proposal Ready for Review",
    description: "Marcus uploaded the initial design concept — v2.1 available now",
    time: "2h ago",
    tone: "primary",
  },
  {
    id: "u2",
    title: "Message from Sales Team",
    description: "Installation scheduled for June 27th at 9:00 AM",
    time: "Yesterday",
    tone: "neutral",
  },
  {
    id: "u3",
    title: "Quotation Document Shared",
    description: "Your itemised quote is ready for review",
    time: "3 days ago",
    tone: "neutral",
  },
];

export function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const alertsBadge = useNotificationBadgeLabel();
  const { scrollPaddingBottom } = useBottomNavMetrics();
  const user = useAuthStore((state) => state.user);
  const { activeProject, projectsQuery } = useActiveProjectSummary();

  const greeting = getGreetingLabel();
  const userName = user?.fullName ?? "Guest";
  const firstName = userName.trim().split(/\s+/)[0] || userName;

  const teamLabel =
    activeProject && (activeProject.hasSalesAssigned || activeProject.hasDesignerAssigned)
      ? [activeProject.hasDesignerAssigned ? "Designer" : null, activeProject.hasSalesAssigned ? "Sales" : null]
          .filter(Boolean)
          .join(" · ")
      : "Waiting for team assignment";

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerWrap, { paddingTop: Math.max(insets.top, 12) + 16 }]}>
          <View style={styles.headerDecorLarge} />
          <View style={styles.headerDecorMedium} />
          <View style={styles.headerDecorSmall} />

          <View style={styles.headerTopRow}>
            <View style={styles.headerIntro}>
              <Text style={styles.brandMark}>FURNISPACE</Text>
              <Text style={styles.greetingLabel}>{greeting}</Text>
              <Text style={styles.userName}>{firstName}</Text>
              <Text style={styles.headerSubtitle}>Track progress and stay in sync with your team</Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.notifyWrap, pressed ? styles.notifyPressed : null]}
              onPress={() => navigation.navigate("Notifications")}
            >
              <View style={styles.notifyIcon}>
                <AppIcon definition={bellIconDefinition} size={16} color="#FFFFFF" strokeWidth={1.7} />
              </View>
              {alertsBadge ? (
                <View style={styles.notifyBadge}>
                  <Text style={styles.notifyBadgeText}>{alertsBadge}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          <View style={styles.activeProjectRow}>
            <View style={styles.line} />
            <View style={styles.activeProjectPill}>
              <View style={styles.activeProjectDot} />
              <Text style={styles.activeProjectText}>ACTIVE PROJECT</Text>
            </View>
            <View style={styles.line} />
          </View>
        </View>

        {projectsQuery.isLoading ? (
          <View style={styles.projectCard}>
            <View style={[styles.projectCardBody, styles.projectStateBody]}>
              <ActivityIndicator color="#C9A86A" />
              <Text style={styles.projectStateHint}>Loading your project…</Text>
            </View>
          </View>
        ) : projectsQuery.isError ? (
          <View style={styles.projectCard}>
            <View style={[styles.projectCardBody, styles.projectStateBody]}>
              <Text style={styles.projectStateText}>
                {getErrorMessage(projectsQuery.error, "Unable to load your projects.")}
              </Text>
            </View>
          </View>
        ) : !activeProject ? (
          <View style={styles.projectCard}>
            <View style={[styles.projectCardBody, styles.projectStateBody]}>
              <Text style={styles.projectStateTitle}>No project yet</Text>
              <Text style={styles.projectStateText}>
                Submit your first project to start tracking design progress here.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.projectCard}>
            <View style={styles.projectCardAccent} />
            <View style={styles.projectCardBody}>
              <View style={styles.projectHead}>
                <Text style={styles.projectTitle} numberOfLines={2}>
                  {activeProject.projectName}
                </Text>
                <Text style={styles.projectCode}>{activeProject.projectCode}</Text>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{activeProject.statusLabel}</Text>
                </View>
              </View>

              <View style={styles.peopleRow}>
                <View style={styles.avatarRow}>
                  {activeProject.hasDesignerAssigned ? (
                    <View style={[styles.avatarCircle, styles.avatarDark]}>
                      <Text style={styles.avatarText}>DS</Text>
                    </View>
                  ) : null}
                  {activeProject.hasSalesAssigned ? (
                    <View
                      style={[
                        styles.avatarCircle,
                        styles.avatarGold,
                        activeProject.hasDesignerAssigned ? styles.avatarOverlap : null,
                      ]}
                    >
                      <Text style={styles.avatarText}>SL</Text>
                    </View>
                  ) : (
                    !activeProject.hasDesignerAssigned && (
                      <View style={[styles.avatarCircle, styles.avatarMuted]}>
                        <Text style={styles.avatarTextMuted}>?</Text>
                      </View>
                    )
                  )}
                </View>
                <View style={styles.peopleCopy}>
                  <Text style={styles.peopleName}>{teamLabel}</Text>
                  <Text style={styles.peopleRole}>{activeProject.businessType || "Project team"}</Text>
                </View>
              </View>

              <View style={styles.stageCard}>
                <View style={styles.stageTopRow}>
                  <Text style={styles.stageLabel}>CURRENT STAGE</Text>
                  <Text style={styles.stageDate}>
                    Submitted {formatSubmittedDate(activeProject.submittedAt)}
                  </Text>
                </View>
                <View style={styles.stageTitleRow}>
                  <View style={styles.stageDot} />
                  <Text style={styles.stageTitle}>{activeProject.statusLabel}</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.projectButton, pressed ? styles.projectButtonPressed : null]}
                onPress={() => navigation.navigate("Tracking", { projectId: activeProject.projectId })}
              >
                <Text style={styles.projectButtonText}>View Project Details</Text>
                <View style={styles.projectButtonIcon}>
                  <AppIcon definition={arrowRightIconDefinition} size={14} color="#3A3330" strokeWidth={2} />
                </View>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.updateSection}>
          <View style={styles.updateHeader}>
            <View style={styles.updateHeaderCopy}>
              <Text style={styles.updateTitle}>Recent Updates</Text>
              <Text style={styles.updateSubtitle}>Latest activity on your project</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.seeAllButton, pressed ? styles.seeAllPressed : null]}
              onPress={() => navigation.navigate("Notifications")}
            >
              <Text style={styles.seeAllText}>See all</Text>
              <AppIcon definition={chevronRightIconDefinition} size={11} color="#A8894E" strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.updateList}>
            {updates.map((item, index) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.updateCard,
                  index === updates.length - 1 ? styles.updateCardLast : null,
                  item.tone === "primary" ? styles.updateCardPrimary : null,
                  pressed ? styles.updateCardPressed : null,
                ]}
                onPress={() => navigation.navigate("Notifications")}
              >
                <View
                  style={[
                    styles.updateRail,
                    item.tone === "primary" ? styles.updateRailPrimary : styles.updateRailNeutral,
                  ]}
                />
                <View style={styles.updateBody}>
                  <View style={styles.updateTitleRow}>
                    <Text style={styles.updateCardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.updateTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.updateCardDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <AppBottomNav activeTab="home" />
    </View>
  );
}

function getGreetingLabel(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "GOOD MORNING";
  }
  if (hour < 18) {
    return "GOOD AFTERNOON";
  }
  return "GOOD EVENING";
}

function formatSubmittedDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}
