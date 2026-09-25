import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { formatVndAmount } from "../../payment/utils/payment.mapper";
import { ProposalItemSummaryDto, ProposalStatus } from "../../project/models/proposal.model";
import { customerFlowStyles as flow } from "../../project/screens/CustomerFlowScreen.styles";
import {
  CustomVersionCard,
  RequestSummary,
  StatusBadge,
} from "./CustomizationSummary";
import { CustomizationRequestFields } from "./CustomizationRequestFields";
import {
  useAcceptCustomizationVersionMutation,
  useProjectCustomizationRequestsQuery,
  useSubmitCustomizationRequestMutation,
} from "../hooks/useCustomization";
import { customizationStyles as styles } from "../styles/customization.styles";
import {
  formatCustomizationDate,
  formatSizeLine,
  getRequestStatusLabel,
  getRequestStatusTone,
  isCustomerVisibleVersion,
  requestWaitingCopy,
} from "../utils/customization.display";
import { getCustomizationErrorMessage } from "../utils/customization.errors";
import {
  CustomizationFieldErrors,
  CustomizationFormValues,
  emptyCustomizationFormValues,
  validateCustomizationForm,
} from "../utils/customization.form";

type Props = {
  projectId: string;
  proposalId: string;
  proposalStatus: ProposalStatus;
  items: ProposalItemSummaryDto[];
};

function itemMeta(item: ProposalItemSummaryDto): string[] {
  const lines: string[] = [];
  const version = item.productVersionNameSnapshot;
  if (version) {
    lines.push(`Version: ${version}`);
  }
  if (item.materialSnapshot) {
    lines.push(`Material: ${item.materialSnapshot}`);
  }
  const size = formatSizeLine(item.widthSnapshot, item.heightSnapshot, item.depthSnapshot, item.dimensionUnit);
  if (size) {
    lines.push(`Dimensions: ${size}`);
  }
  const commerce = [
    item.quantity != null ? `Qty ${item.quantity}` : null,
    item.unitPrice != null ? formatVndAmount(item.unitPrice) : null,
  ].filter((part): part is string => Boolean(part));
  if (commerce.length > 0) {
    lines.push(commerce.join(" · "));
  }
  return lines;
}

export function CustomerProposalCustomization({
  projectId,
  proposalId,
  proposalStatus,
  items,
}: Props): React.JSX.Element {
  const canCustomize = proposalStatus === "PUBLISHED";
  const requestsQuery = useProjectCustomizationRequestsQuery(projectId, { proposalId });
  const submitMutation = useSubmitCustomizationRequestMutation();
  const acceptMutation = useAcceptCustomizationVersionMutation();
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<CustomizationFormValues>(emptyCustomizationFormValues);
  const [formErrors, setFormErrors] = useState<CustomizationFieldErrors>({});

  const requests = (requestsQuery.data?.items ?? []).filter(
    (request) => !request.proposalId || request.proposalId === proposalId,
  );
  const showCustomVersions = requestsQuery.isLoading || requestsQuery.isError || requests.length > 0;
  const totalItemsAmount = items.reduce((sum, item) => sum + (item.totalAmount ?? 0), 0);

  const handleSubmit = (proposalItemId: string) => {
    const result = validateCustomizationForm(formValues, { includeChangeNote: false });
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
        onSuccess: () => {
          setFormValues(emptyCustomizationFormValues());
          setFormErrors({});
          setActiveItemId(null);
          Alert.alert("Request submitted", "Customization request submitted for this proposal item.");
        },
        onError: (error) => Alert.alert("Unable to submit", getCustomizationErrorMessage(error)),
      },
    );
  };

  const handleAccept = (customizationRequestId: string, customizationRequestVersionId: string) => {
    Alert.alert(
      "Accept custom version",
      "Accept this feasible version? It will be recorded on the request, and other active versions will be withdrawn.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: () => {
            acceptMutation.mutate(
              {
                customizationRequestId,
                customizationRequestVersionId,
                projectId,
                proposalId,
              },
              {
                onSuccess: () => {
                  Alert.alert(
                    "Version accepted",
                    "This custom version has been accepted. Proposal and quotation details will refresh from the server.",
                  );
                },
                onError: (error) => Alert.alert("Unable to accept", getCustomizationErrorMessage(error)),
              },
            );
          },
        },
      ],
    );
  };

  return (
    <>
      <View style={flow.card}>
        <Text style={flow.cardLabel}>FURNITURE & ITEMS ({items.length})</Text>
        {!canCustomize ? (
          <Text style={styles.helperText}>Customize is available only while this proposal is published.</Text>
        ) : null}
        {items.length === 0 ? (
          <Text style={flow.emptyText}>No items listed yet.</Text>
        ) : (
          items.map((item, index) => {
            const isLast = index === items.length - 1 && activeItemId !== item.proposalItemId;
            const isActive = activeItemId === item.proposalItemId;
            const meta = itemMeta(item);

            return (
              <View key={item.proposalItemId} style={[styles.itemBlock, isLast && styles.itemBlockLast]}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.itemTitle, { flex: 1 }]}>
                    {item.productNameSnapshot || item.itemName}
                  </Text>
                  {item.totalAmount != null ? (
                    <Text style={styles.itemPrice}>{formatVndAmount(item.totalAmount)}</Text>
                  ) : null}
                </View>
                {meta.map((line) => (
                  <Text key={line} style={styles.metaLine}>
                    {line}
                  </Text>
                ))}
                <Pressable
                  style={[
                    styles.customizeButton,
                    isActive && styles.customizeButtonActive,
                    !canCustomize && flow.buttonDisabled,
                  ]}
                  disabled={!canCustomize}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canCustomize }}
                  onPress={() => {
                    setFormErrors({});
                    setFormValues(emptyCustomizationFormValues());
                    setActiveItemId(isActive ? null : item.proposalItemId);
                  }}
                >
                  <Text style={[styles.customizeButtonText, isActive && styles.customizeButtonTextActive]}>
                    {isActive ? "Close" : "Customize"}
                  </Text>
                </Pressable>
                {isActive ? (
                  <View style={styles.formBlock}>
                    <CustomizationRequestFields
                      values={formValues}
                      errors={formErrors}
                      onChange={(patch) => {
                        setFormValues((current) => ({ ...current, ...patch }));
                        setFormErrors({});
                      }}
                    />
                    <Pressable
                      style={[flow.primaryButton, submitMutation.isPending && flow.buttonDisabled]}
                      disabled={submitMutation.isPending}
                      onPress={() => handleSubmit(item.proposalItemId)}
                    >
                      <Text style={flow.primaryButtonText}>
                        {submitMutation.isPending ? "Submitting..." : "Submit request"}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
        {totalItemsAmount > 0 ? (
          <View style={flow.totalRow}>
            <Text style={flow.totalLabel}>Items subtotal</Text>
            <Text style={flow.totalValue}>{formatVndAmount(totalItemsAmount)}</Text>
          </View>
        ) : null}
      </View>

      {showCustomVersions ? (
        <View style={flow.card}>
          <Text style={flow.cardLabel}>CUSTOM VERSIONS</Text>
          <Text style={[styles.helperText, { marginBottom: 4 }]}>
            Request status and version status are separate. Pull down to refresh after production review.
          </Text>
          {requestsQuery.isLoading ? (
            <View style={flow.loadingWrap}>
              <ActivityIndicator color="#C9A86A" />
              <Text style={flow.loadingText}>Loading customization requests...</Text>
            </View>
          ) : requestsQuery.isError ? (
            <Text style={flow.emptyText}>
              {getCustomizationErrorMessage(requestsQuery.error, "Unable to load customization requests.")}
            </Text>
          ) : (
            requests.map((request, index) => {
              const visibleVersions = (request.versions ?? []).filter(isCustomerVisibleVersion);
              const accepted = request.acceptedVersion;
              const acceptedId = accepted?.customizationRequestVersionId ?? request.acceptedRequestVersionId;
              const versions = accepted
                ? [
                    accepted,
                    ...visibleVersions.filter(
                      (version) => version.customizationRequestVersionId !== accepted.customizationRequestVersionId,
                    ),
                  ]
                : visibleVersions;
              const waitingCopy = requestWaitingCopy(request);

              return (
                <View
                  key={request.customizationRequestId}
                  style={[styles.requestCard, index === requests.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <View style={styles.rowBetween}>
                    <Text style={[styles.itemTitle, { flex: 1 }]}>{request.requestTitle}</Text>
                    <StatusBadge
                      label={getRequestStatusLabel(request.status)}
                      tone={getRequestStatusTone(request.status)}
                    />
                  </View>
                  <Text style={styles.requestMeta}>{formatCustomizationDate(request.createdAt)}</Text>
                  <RequestSummary request={request} />
                  {waitingCopy ? <Text style={styles.helperText}>{waitingCopy}</Text> : null}
                  {versions.map((version) => (
                    <CustomVersionCard
                      key={version.customizationRequestVersionId}
                      request={request}
                      version={version}
                      audience="customer"
                      acceptPending={
                        acceptMutation.isPending &&
                        acceptMutation.variables?.customizationRequestVersionId ===
                          version.customizationRequestVersionId
                      }
                      onAccept={
                        version.customizationRequestVersionId === acceptedId
                          ? undefined
                          : () =>
                              handleAccept(request.customizationRequestId, version.customizationRequestVersionId)
                      }
                    />
                  ))}
                </View>
              );
            })
          )}
        </View>
      ) : null}
    </>
  );
}
