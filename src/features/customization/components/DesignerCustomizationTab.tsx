import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { useProjectProposalsQuery, useProposalItemsQuery } from "../../project/hooks/useCustomerFlow";
import { CustomizationStatus } from "../models/customization.model";
import { customizationStyles as styles } from "../styles/customization.styles";
import { CustomizationRequestFields } from "./CustomizationRequestFields";
import { CustomVersionCard, RequestSummary, StatusBadge } from "./CustomizationSummary";
import {
  useCustomizationRequestDetailQuery,
  useProjectCustomizationRequestsQuery,
  useSubmitCustomizationRequestMutation,
} from "../hooks/useCustomization";
import {
  formatCustomizationDate,
  getRequestNote,
  getRequestStatusLabel,
  getRequestStatusTone,
  getSourceProductLabel,
} from "../utils/customization.display";
import { getCustomizationErrorMessage } from "../utils/customization.errors";
import {
  CustomizationFieldErrors,
  CustomizationFormValues,
  emptyCustomizationFormValues,
  validateCustomizationForm,
} from "../utils/customization.form";

const STATUS_FILTERS: Array<{ id: "ALL" | CustomizationStatus; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "SUBMITTED", label: "Submitted" },
  { id: "REVIEWING", label: "Reviewing" },
  { id: "ACCEPTED", label: "Accepted" },
  { id: "CANCELLED", label: "Cancelled" },
];

type Banner = { tone: "success" | "error"; text: string };

export function DesignerCustomizationTab({ projectId }: { projectId: string | null }): React.JSX.Element {
  const [statusFilter, setStatusFilter] = useState<"ALL" | CustomizationStatus>("ALL");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [proposalItemId, setProposalItemId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<CustomizationFormValues>(emptyCustomizationFormValues());
  const [formErrors, setFormErrors] = useState<CustomizationFieldErrors>({});

  const listQuery = useProjectCustomizationRequestsQuery(projectId, {
    status: statusFilter === "ALL" ? null : statusFilter,
  });
  const detailQuery = useCustomizationRequestDetailQuery(selectedRequestId);
  const proposalsQuery = useProjectProposalsQuery(modalOpen ? projectId : null, { status: "PUBLISHED", limit: 50 });
  const itemsQuery = useProposalItemsQuery(modalOpen ? proposalId : null);
  const submitMutation = useSubmitCustomizationRequestMutation();

  const requests = listQuery.data?.items ?? [];
  const selected = detailQuery.data ?? requests.find((item) => item.customizationRequestId === selectedRequestId) ?? null;
  const publishedProposals = (proposalsQuery.data?.items ?? []).filter((proposal) => proposal.status === "PUBLISHED");
  const proposalItems = itemsQuery.data?.items ?? [];

  const solePublishedProposalId = publishedProposals.length === 1 ? publishedProposals[0].proposalId : null;

  useEffect(() => {
    if (!modalOpen || proposalId || !solePublishedProposalId) {
      return;
    }

    setProposalId(solePublishedProposalId);
  }, [modalOpen, proposalId, solePublishedProposalId]);

  const selectedProposalName = useMemo(
    () => publishedProposals.find((proposal) => proposal.proposalId === proposalId)?.proposalName ?? null,
    [publishedProposals, proposalId],
  );

  const openModal = () => {
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitMutation.isPending) {
      return;
    }
    setModalOpen(false);
  };

  const handleSubmit = () => {
    if (!proposalItemId) {
      setFormErrors({ form: "Choose a proposal item." });
      return;
    }

    const result = validateCustomizationForm(formValues, { includeChangeNote: true });
    if (!result.ok) {
      setFormErrors(result.errors);
      return;
    }

    submitMutation.mutate(
      {
        proposalItemId,
        payload: result.payload,
        projectId,
        proposalId,
      },
      {
        onSuccess: (request) => {
          setFormValues(emptyCustomizationFormValues());
          setFormErrors({});
          setStatusFilter("ALL");
          setSelectedRequestId(request.customizationRequestId);
          setModalOpen(false);
          setBanner({ tone: "success", text: "Customization request submitted for this proposal item." });
        },
        onError: (error) => {
          setBanner({ tone: "error", text: getCustomizationErrorMessage(error) });
        },
      },
    );
  };

  if (!projectId) {
    return <Text style={styles.helperText}>Select a project to view customization requests.</Text>;
  }

  if (selectedRequestId) {
    return (
      <View style={styles.sectionGap}>
        <Pressable onPress={() => setSelectedRequestId(null)} style={styles.detailHeader}>
          <Text style={styles.closeText}>Back to requests</Text>
        </Pressable>
        {banner ? (
          <View style={[styles.banner, banner.tone === "success" ? styles.bannerSuccess : styles.bannerError]}>
            <Text
              style={[styles.bannerText, banner.tone === "success" ? styles.bannerSuccessText : styles.bannerErrorText]}
            >
              {banner.text}
            </Text>
          </View>
        ) : null}
        {detailQuery.isLoading && !selected ? (
          <ActivityIndicator color="#2F5D50" />
        ) : !selected ? (
          <Text style={styles.helperText}>
            {getCustomizationErrorMessage(detailQuery.error, "Unable to load this customization request.")}
          </Text>
        ) : (
          <View>
            <View style={styles.rowBetween}>
              <Text style={[styles.itemTitle, { flex: 1, fontSize: 18 }]}>{selected.requestTitle}</Text>
              <StatusBadge label={getRequestStatusLabel(selected.status)} tone={getRequestStatusTone(selected.status)} />
            </View>
            <Text style={styles.metaLine}>
              {formatCustomizationDate(selected.createdAt)} · {(selected.versions ?? []).length} versions
            </Text>
            <RequestSummary request={selected} />
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Versions</Text>
            {(selected.versions ?? []).length === 0 ? (
              <Text style={styles.helperText}>
                No custom version yet. Draft and review versions are prepared outside the mobile app.
              </Text>
            ) : (
              (selected.versions ?? []).map((version) => (
                <CustomVersionCard
                  key={version.customizationRequestVersionId}
                  request={selected}
                  version={version}
                  audience="designer"
                />
              ))
            )}
            <Text style={styles.helperText}>
              Draft means the version is still being prepared. Reviewing with production review means it is waiting on
              feasibility. Feasible versions can be accepted by the customer. Not feasible versions were rejected by
              production. Accepted is the customer choice, and withdrawn versions are no longer active.
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View>
      {banner ? (
        <View style={[styles.banner, banner.tone === "success" ? styles.bannerSuccess : styles.bannerError]}>
          <Text style={[styles.bannerText, banner.tone === "success" ? styles.bannerSuccessText : styles.bannerErrorText]}>
            {banner.text}
          </Text>
        </View>
      ) : null}

      <View style={styles.rowBetween}>
        <Text style={styles.itemTitle}>Customization ({requests.length})</Text>
        <Pressable style={styles.customizeButton} onPress={openModal}>
          <Text style={styles.customizeButtonText}>Assisted request</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {STATUS_FILTERS.map((filter) => {
          const selectedFilter = statusFilter === filter.id;
          return (
            <Pressable
              key={filter.id}
              style={[styles.chip, selectedFilter && styles.chipActive]}
              onPress={() => setStatusFilter(filter.id)}
            >
              <Text style={[styles.chipText, selectedFilter && styles.chipTextActive]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {listQuery.isLoading ? (
        <ActivityIndicator color="#2F5D50" style={{ marginTop: 16 }} />
      ) : listQuery.isError ? (
        <Text style={styles.helperText}>{getErrorMessage(listQuery.error, "Unable to load customization requests.")}</Text>
      ) : requests.length === 0 ? (
        <Text style={styles.helperText}>
          {statusFilter === "ALL"
            ? "No customization requests yet."
            : "No customization requests for this filter."}
        </Text>
      ) : (
        requests.map((request) => {
          const note = getRequestNote(request);
          const sourceName = getSourceProductLabel(request);
          return (
            <Pressable
              key={request.customizationRequestId}
              style={styles.requestCard}
              onPress={() => setSelectedRequestId(request.customizationRequestId)}
            >
              <View style={styles.rowBetween}>
                <Text style={[styles.itemTitle, { flex: 1 }]}>{request.requestTitle}</Text>
                <StatusBadge label={getRequestStatusLabel(request.status)} tone={getRequestStatusTone(request.status)} />
              </View>
              <Text style={styles.metaLine}>
                {formatCustomizationDate(request.createdAt)} · {(request.versions ?? []).length} versions
              </Text>
              {note ? (
                <Text style={styles.metaLine} numberOfLines={2}>
                  {note}
                </Text>
              ) : null}
              {sourceName ? <Text style={styles.metaLine}>Source version: {sourceName}</Text> : null}
              {request.requestedMaterial ? (
                <Text style={styles.metaLine}>Material: {request.requestedMaterial}</Text>
              ) : null}
              {request.requestedColor ? <Text style={styles.metaLine}>Color: {request.requestedColor}</Text> : null}
            </Pressable>
          );
        })
      )}

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Designer assisted request</Text>
              <Pressable onPress={closeModal} hitSlop={8}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.helperText}>
                Create this request for the customer when they described the change in chat or review.
              </Text>
              <Text style={styles.fieldLabel}>Published proposal</Text>
              {proposalsQuery.isLoading ? (
                <ActivityIndicator color="#2F5D50" />
              ) : publishedProposals.length === 0 ? (
                <Text style={styles.helperText}>No published proposal is available for an assisted request.</Text>
              ) : (
                publishedProposals.map((proposal) => {
                  const active = proposal.proposalId === proposalId;
                  return (
                    <Pressable
                      key={proposal.proposalId}
                      style={[styles.selectorChip, active && styles.selectorChipActive]}
                      onPress={() => {
                        setProposalId(proposal.proposalId);
                        setProposalItemId(null);
                        setFormErrors({});
                      }}
                    >
                      <Text style={styles.selectorText}>
                        {proposal.proposalName} · v{proposal.versionNo}
                      </Text>
                    </Pressable>
                  );
                })
              )}

              <Text style={styles.fieldLabel}>Proposal item</Text>
              {!proposalId ? (
                <Text style={styles.helperText}>Choose a published proposal to load its items.</Text>
              ) : itemsQuery.isLoading ? (
                <ActivityIndicator color="#2F5D50" />
              ) : proposalItems.length === 0 ? (
                <Text style={styles.helperText}>This proposal has no items.</Text>
              ) : (
                proposalItems.map((item) => {
                  const active = item.proposalItemId === proposalItemId;
                  return (
                    <Pressable
                      key={item.proposalItemId}
                      style={[styles.selectorChip, active && styles.selectorChipActive]}
                      onPress={() => {
                        setProposalItemId(item.proposalItemId);
                        setFormErrors({});
                      }}
                    >
                      <Text style={styles.selectorText}>{item.productNameSnapshot || item.itemName}</Text>
                    </Pressable>
                  );
                })
              )}
              {selectedProposalName && proposalItemId ? (
                <Text style={styles.helperText}>Request will be filed on {selectedProposalName}.</Text>
              ) : null}

              <CustomizationRequestFields
                values={formValues}
                errors={formErrors}
                includeChangeNote
                onChange={(patch) => {
                  setFormValues((current) => ({ ...current, ...patch }));
                  setFormErrors({});
                }}
              />
              <Pressable
                style={[styles.customizeButton, styles.customizeButtonActive, { alignSelf: "stretch", marginTop: 16 }]}
                disabled={submitMutation.isPending}
                onPress={handleSubmit}
              >
                <Text style={[styles.customizeButtonText, styles.customizeButtonTextActive, { textAlign: "center" }]}>
                  {submitMutation.isPending ? "Submitting..." : "Submit assisted request"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
