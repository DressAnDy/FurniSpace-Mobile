import React from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { arrowLeftIconDefinition, chevronRightIconDefinition } from "../../../icons/navigation/definitions";
import { formatTrackingDate } from "../utils/project.tracking.mapper";
import { useProjectProposalsQuery } from "../hooks/useCustomerFlow";
import { customerFlowStyles as styles } from "./CustomerFlowScreen.styles";

type Route = RouteProp<RootStackParamList, "ProjectProposals">;

function getProposalStatusStyle(status: string): { pill: object; text: object } {
  if (status === "PUBLISHED") {
    return { pill: styles.statusPublished, text: styles.statusPublishedText };
  }

  if (status === "SELECTED") {
    return { pill: styles.statusSelected, text: styles.statusSelectedText };
  }

  return { pill: {}, text: {} };
}

export function ProjectProposalsScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { projectId, projectName } = route.params;
  const proposalsQuery = useProjectProposalsQuery(projectId);

  const proposals = proposalsQuery.data?.items ?? [];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <AppIcon definition={arrowLeftIconDefinition} size={18} color="#FFFFFF" strokeWidth={1.8} />
            </Pressable>
            <View>
              <Text style={styles.brandText}>FURNISPACE</Text>
              <Text style={styles.headerTitle}>Proposals</Text>
            </View>
          </View>
          {projectName ? <Text style={styles.headerSubtitle}>{projectName}</Text> : null}
        </View>

        <View style={styles.content}>
          {proposalsQuery.isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#C9A86A" />
              <Text style={styles.loadingText}>Loading proposals...</Text>
            </View>
          ) : proposals.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>
                No proposals available yet. Your designer will publish options when they are ready for review.
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>DESIGN OPTIONS</Text>
              {proposals.map((proposal, index) => {
                const statusStyle = getProposalStatusStyle(proposal.status);
                const isLast = index === proposals.length - 1;

                return (
                  <Pressable
                    key={proposal.proposalId}
                    style={[styles.listItem, isLast && styles.listItemLast]}
                    onPress={() =>
                      navigation.navigate("ProposalDetail", {
                        proposalId: proposal.proposalId,
                        projectId,
                        projectName,
                      })
                    }
                  >
                    <View style={styles.listItemTextWrap}>
                      <Text style={styles.listItemTitle}>{proposal.proposalName}</Text>
                      <Text style={styles.listItemMeta}>
                        v{proposal.versionNo}
                        {proposal.publishedAt ? ` · Published ${formatTrackingDate(proposal.publishedAt)}` : ""}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, statusStyle.pill]}>
                      <Text style={[styles.statusPillText, statusStyle.text]}>{proposal.status.replaceAll("_", " ")}</Text>
                    </View>
                    <AppIcon definition={chevronRightIconDefinition} size={14} color="#9B8F86" strokeWidth={2} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
