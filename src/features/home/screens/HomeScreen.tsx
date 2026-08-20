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
    description: "Marcus uploaded the initial design concept - v2.1 available now",
    time: "2 hours ago",
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
  const alertsBadge = useNotificationBadgeLabel();
  const { scrollPaddingBottom } = useBottomNavMetrics();
  const user = useAuthStore((state) => state.user);
  const { activeProject, projectsQuery } = useActiveProjectSummary();

  const greeting = getGreetingLabel();
  const userName = user?.fullName ?? "Guest";

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerWrap}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.greetingLabel}>{greeting}</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>

            <Pressable style={styles.notifyWrap} onPress={() => navigation.navigate("Notifications")}>
              <View style={styles.notifyIcon}>
                <AppIcon definition={bellIconDefinition} size={15} color="#FFFFFF" strokeWidth={1.8} />
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
            <Text style={styles.activeProjectText}>ACTIVE PROJECT</Text>
            <View style={styles.line} />
          </View>
        </View>

        {projectsQuery.isLoading ? (
          <View style={styles.projectCard}>
            <View style={[styles.projectCardBody, styles.projectStateBody]}>
              <ActivityIndicator color="#C9A86A" />
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
              <Text style={styles.projectStateText}>No projects yet. Submit your first project to get started.</Text>
            </View>
          </View>
        ) : (
          <View style={styles.projectCard}>
            <View style={styles.projectCardTopBorder} />
            <View style={styles.projectCardBody}>
              <View style={styles.projectHeadRow}>
                <View>
                  <Text style={styles.projectTitle}>{activeProject.projectName}</Text>
                  <Text style={styles.projectCode}>{activeProject.projectCode}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{activeProject.statusLabel.toUpperCase()}</Text>
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
                  ) : null}
                </View>
                <View>
                  <Text style={styles.peopleName}>
                    {activeProject.hasSalesAssigned || activeProject.hasDesignerAssigned
                      ? [activeProject.hasDesignerAssigned ? "Designer" : null, activeProject.hasSalesAssigned ? "Sales" : null]
                          .filter(Boolean)
                          .join(" · ")
                      : "Waiting for team assignment"}
                  </Text>
                  <Text style={styles.peopleRole}>{activeProject.businessType}</Text>
                </View>
              </View>

              <View style={styles.stageCard}>
                <Text style={styles.stageLabel}>CURRENT STAGE</Text>
                <View style={styles.stageTitleRow}>
                  <View style={styles.stageDot} />
                  <Text style={styles.stageTitle}>{activeProject.statusLabel}</Text>
                </View>
                <Text style={styles.stageDescription}>
                  Submitted {new Date(activeProject.submittedAt).toLocaleDateString()}
                </Text>
              </View>

              <Pressable
                style={styles.projectButton}
                onPress={() => navigation.navigate("Tracking", { projectId: activeProject.projectId })}
              >
                <Text style={styles.projectButtonText}>View Project Details</Text>
                <AppIcon definition={arrowRightIconDefinition} size={15} color="#FFFFFF" strokeWidth={1.8} />
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.updateHeader}>
          <Text style={styles.updateTitle}>Recent Updates</Text>
          <Pressable style={styles.seeAllButton} onPress={() => navigation.navigate("Notifications")}>
            <Text style={styles.seeAllText}>See all</Text>
            <AppIcon definition={chevronRightIconDefinition} size={11} color="#C9A86A" strokeWidth={2} />
          </Pressable>
        </View>

        {updates.map((item) => (
          <View key={item.id} style={styles.updateCard}>
            <View
              style={[
                styles.updateDot,
                item.tone === "primary" ? styles.updateDotPrimary : styles.updateDotNeutral,
              ]}
            />
            <View style={styles.updateBody}>
              <Text style={styles.updateCardTitle}>{item.title}</Text>
              <Text style={styles.updateCardDescription}>{item.description}</Text>
            </View>
            <Text style={styles.updateTime}>{item.time}</Text>
          </View>
        ))}
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
