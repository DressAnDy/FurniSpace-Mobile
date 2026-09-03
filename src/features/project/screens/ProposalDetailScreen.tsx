import React, { useMemo, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { getCustomerFlowErrorMessage } from "../utils/customer-flow.errors";
import { AppIcon } from "../../../shared/components/AppIcon";
import { arrowLeftIconDefinition } from "../../../icons/navigation/definitions";
import { formatVndAmount } from "../../payment/utils/payment.mapper";
import {
  useProposalDetailQuery,
  useRequestProposalRevisionMutation,
  useSelectFinalProposalMutation,
} from "../hooks/useCustomerFlow";
import { canRequestProposalRevision, canSelectProposal } from "../utils/project.customer-flow.mapper";
import { customerFlowStyles as styles } from "./CustomerFlowScreen.styles";

type Route = RouteProp<RootStackParamList, "ProposalDetail">;

export function ProposalDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { proposalId, projectId, projectName } = route.params;

  const proposalQuery = useProposalDetailQuery(proposalId);
  const selectFinalMutation = useSelectFinalProposalMutation(projectId);
  const requestRevisionMutation = useRequestProposalRevisionMutation(projectId);

  const [revisionNote, setRevisionNote] = useState("");
  const [showRevisionInput, setShowRevisionInput] = useState(false);

  const proposal = proposalQuery.data;
  const canSelect = proposal ? canSelectProposal(proposal.status) : false;
  const canRevise = proposal ? canRequestProposalRevision(proposal.status) : false;
  const isBusy = selectFinalMutation.isPending || requestRevisionMutation.isPending;

  const totalItemsAmount = useMemo(() => {
    return (proposal?.items ?? []).reduce((sum, item) => sum + (item.totalAmount ?? 0), 0);
  }, [proposal?.items]);

  const handleSelectFinal = () => {
    Alert.alert(
      "Select Final Proposal",
      "Confirm this design option? Other published proposals will be rejected and sales will prepare your quotation.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            selectFinalMutation.mutate(
              { proposalId },
              {
                onSuccess: () => {
                  Alert.alert("Proposal Selected", "Sales is preparing your quotation.", [
                    { text: "OK", onPress: () => navigation.navigate("Tracking", { projectId }) },
                  ]);
                },
                onError: (error) => Alert.alert("Unable to select", getCustomerFlowErrorMessage(error)),
              },
            );
          },
        },
      ],
    );
  };

  const handleRequestRevision = () => {
    const note = revisionNote.trim();
    if (!note) {
      Alert.alert("Revision note required", "Please describe what you would like changed.");
      return;
    }

    requestRevisionMutation.mutate(
      { proposalId, revisionNote: note },
      {
        onSuccess: () => {
          Alert.alert("Revision Requested", "Your designer will update and republish the proposal.", [
            { text: "OK", onPress: () => navigation.goBack() },
          ]);
        },
        onError: (error) => Alert.alert("Unable to request revision", getCustomerFlowErrorMessage(error)),
      },
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <AppIcon definition={arrowLeftIconDefinition} size={18} color="#FFFFFF" strokeWidth={1.8} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandText}>FURNISPACE</Text>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {proposal?.proposalName ?? "Proposal"}
              </Text>
            </View>
          </View>
          {projectName ? <Text style={styles.headerSubtitle}>{projectName}</Text> : null}
        </View>

        <View style={styles.content}>
          {proposalQuery.isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#C9A86A" />
              <Text style={styles.loadingText}>Loading proposal...</Text>
            </View>
          ) : !proposal ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>Unable to load proposal details.</Text>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>OVERVIEW</Text>
                <Text style={styles.noteText}>
                  Version {proposal.versionNo} · {proposal.status.replaceAll("_", " ")}
                </Text>
                {proposal.revisionNote ? (
                  <Text style={[styles.noteText, { marginTop: 8 }]}>Revision note: {proposal.revisionNote}</Text>
                ) : null}
              </View>

              {(proposal.scenes?.length ?? 0) > 0 ? (
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>SCENES ({proposal.scenes.length})</Text>
                  {proposal.scenes.map((scene) => (
                    <View key={scene.sceneId} style={styles.itemRow}>
                      <Text style={styles.itemName}>{scene.sceneName}</Text>
                      <Text style={styles.itemAmount}>{scene.sceneType?.replaceAll("_", " ") ?? "Scene"}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.card}>
                <Text style={styles.cardLabel}>ITEMS ({proposal.items.length})</Text>
                {proposal.items.length === 0 ? (
                  <Text style={styles.emptyText}>No items listed yet.</Text>
                ) : (
                  proposal.items.map((item, index) => (
                    <View key={item.proposalItemId} style={styles.itemRow}>
                      <Text style={styles.itemName}>
                        {item.itemName || item.productNameSnapshot || `Item ${index + 1}`}
                        {item.quantity ? ` × ${item.quantity}` : ""}
                      </Text>
                      {item.totalAmount != null ? (
                        <Text style={styles.itemAmount}>{formatVndAmount(item.totalAmount)}</Text>
                      ) : null}
                    </View>
                  ))
                )}
                {totalItemsAmount > 0 ? (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Items subtotal</Text>
                    <Text style={styles.totalValue}>{formatVndAmount(totalItemsAmount)}</Text>
                  </View>
                ) : null}
              </View>

              {canSelect ? (
                <Pressable
                  style={[styles.primaryButton, isBusy && styles.buttonDisabled]}
                  disabled={isBusy}
                  onPress={handleSelectFinal}
                >
                  <Text style={styles.primaryButtonText}>Select as Final Proposal</Text>
                </Pressable>
              ) : null}

              {canRevise ? (
                <>
                  {!showRevisionInput ? (
                    <Pressable style={styles.secondaryButton} onPress={() => setShowRevisionInput(true)}>
                      <Text style={styles.secondaryButtonText}>Request Revision</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.card}>
                      <Text style={styles.cardLabel}>REVISION NOTE</Text>
                      <TextInput
                        style={styles.input}
                        multiline
                        placeholder="Describe changes you need..."
                        placeholderTextColor="#9B8F86"
                        value={revisionNote}
                        onChangeText={setRevisionNote}
                        maxLength={1000}
                      />
                      <Pressable
                        style={[styles.primaryButton, isBusy && styles.buttonDisabled]}
                        disabled={isBusy}
                        onPress={handleRequestRevision}
                      >
                        <Text style={styles.primaryButtonText}>Submit Revision Request</Text>
                      </Pressable>
                    </View>
                  )}
                </>
              ) : null}

              {proposal.status === "SELECTED" ? (
                <View style={styles.card}>
                  <Text style={styles.noteText}>
                    You selected this proposal. Sales is preparing your quotation — you will be notified when it is sent.
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
