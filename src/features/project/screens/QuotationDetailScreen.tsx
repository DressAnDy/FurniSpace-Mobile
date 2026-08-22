import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { getCustomerFlowErrorMessage, isQuotationExpiredError } from "../utils/customer-flow.errors";
import { AppIcon } from "../../../shared/components/AppIcon";
import { arrowLeftIconDefinition } from "../../../icons/navigation/definitions";
import { formatVndAmount } from "../../payment/utils/payment.mapper";
import { formatTrackingDate } from "../utils/project.tracking.mapper";
import { formatQuotationDepositLabel, hasVisibleDeposit, resolveQuotationDisplayDeposit } from "../utils/quotation.mapper";
import {
  useAcceptQuotationMutation,
  useQuotationDetailQuery,
  useRejectQuotationMutation,
  useRequestQuotationRevisionMutation,
} from "../hooks/useCustomerFlow";
import {
  canAcceptQuotation,
  canRejectQuotation,
  canRequestQuotationRevision,
} from "../utils/project.customer-flow.mapper";
import { QuotationStatus } from "../models/quotation.model";
import { quotationDetailStyles as styles } from "./QuotationDetailScreen.styles";

type Route = RouteProp<RootStackParamList, "QuotationDetail">;
type ActionMode = "none" | "revision" | "reject";

function formatStatusLabel(status: QuotationStatus): string {
  return status.replaceAll("_", " ");
}

function getStatusStyles(status: QuotationStatus) {
  switch (status) {
    case "SENT":
    case "REVISED":
      return { pill: styles.statusSent, text: styles.statusSentText };
    case "ACCEPTED":
      return { pill: styles.statusAccepted, text: styles.statusAcceptedText };
    case "REJECTED":
    case "CANCELLED":
      return { pill: styles.statusRejected, text: styles.statusRejectedText };
    case "REVISION_REQUESTED":
    case "EXPIRED":
      return { pill: styles.statusWarning, text: styles.statusWarningText };
    default:
      return { pill: styles.statusMuted, text: styles.statusMutedText };
  }
}

export function QuotationDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { quotationId, projectId, projectName } = route.params;

  const quotationQuery = useQuotationDetailQuery(quotationId);
  const acceptMutation = useAcceptQuotationMutation(projectId);
  const revisionMutation = useRequestQuotationRevisionMutation(projectId);
  const rejectMutation = useRejectQuotationMutation(projectId);

  const [actionMode, setActionMode] = useState<ActionMode>("none");
  const [reasonText, setReasonText] = useState("");

  const quotation = quotationQuery.data;
  const isExpired =
    quotation?.validUntil != null && new Date(quotation.validUntil).getTime() < Date.now() - 24 * 60 * 60 * 1000;

  const canAccept = quotation ? canAcceptQuotation(quotation.status) && !isExpired : false;
  const canRevise = quotation ? canRequestQuotationRevision(quotation.status) && !isExpired : false;
  const canReject = quotation ? canRejectQuotation(quotation.status) : false;
  const isBusy = acceptMutation.isPending || revisionMutation.isPending || rejectMutation.isPending;
  const hasActions = (canAccept || canRevise || canReject) && actionMode === "none";
  const depositLabel = quotation ? formatQuotationDepositLabel(quotation) : "Deposit";
  const displayDepositAmount = quotation ? resolveQuotationDisplayDeposit(quotation) : 0;

  const handleAccept = () => {
    Alert.alert(
      "Accept Quotation",
      `Confirm order total ${quotation ? formatVndAmount(quotation.totalAmount, quotation.currency) : ""}? ${depositLabel}: ${quotation ? formatVndAmount(displayDepositAmount, quotation.currency) : ""}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: () => {
            acceptMutation.mutate(quotationId, {
              onSuccess: () => {
                Alert.alert("Quotation Accepted", "Your order has been created. Proceed to pay the deposit.", [
                  {
                    text: "Pay Deposit",
                    onPress: () => navigation.navigate("Tracking", { projectId }),
                  },
                ]);
              },
              onError: (error) => {
                const title = isQuotationExpiredError(error) ? "Quotation Expired" : "Unable to accept";
                Alert.alert(title, getCustomerFlowErrorMessage(error));
              },
            });
          },
        },
      ],
    );
  };

  const handleSubmitReason = () => {
    const reason = reasonText.trim();
    if (!reason) {
      Alert.alert("Reason required", "Please enter a reason.");
      return;
    }

    if (actionMode === "revision") {
      revisionMutation.mutate(
        { quotationId, revisionReason: reason },
        {
          onSuccess: () => {
            Alert.alert("Revision Requested", "Sales will update and resend your quotation.", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
          },
          onError: (error) => Alert.alert("Unable to request revision", getCustomerFlowErrorMessage(error)),
        },
      );
      return;
    }

    if (actionMode === "reject") {
      rejectMutation.mutate(
        { quotationId, rejectReason: reason },
        {
          onSuccess: () => {
            Alert.alert("Quotation Rejected", "Sales has been notified.", [
              { text: "OK", onPress: () => navigation.navigate("Tracking", { projectId }) },
            ]);
          },
          onError: (error) => Alert.alert("Unable to reject", getCustomerFlowErrorMessage(error)),
        },
      );
    }
  };

  const statusStyles = quotation ? getStatusStyles(quotation.status) : null;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroDecor} />
          <View style={styles.heroTopRow}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <AppIcon definition={arrowLeftIconDefinition} size={18} color="#FFFFFF" strokeWidth={1.8} />
            </Pressable>
          </View>
          <Text style={styles.heroEyebrow}>FURNISPACE</Text>
          <Text style={styles.heroTitle}>Quotation</Text>
          {quotation ? (
            <>
              <Text style={styles.heroCode}>{quotation.quotationCode}</Text>
              {projectName ? <Text style={styles.heroProject}>{projectName}</Text> : null}
              <View style={styles.heroMetaRow}>
                <View style={[styles.statusPill, statusStyles?.pill]}>
                  <Text style={[styles.statusPillText, statusStyles?.text]}>{formatStatusLabel(quotation.status)}</Text>
                </View>
                <Text style={styles.heroMetaText}>v{quotation.versionNo}</Text>
                {quotation.validUntil ? (
                  <Text style={styles.heroMetaText}>Valid until {formatTrackingDate(quotation.validUntil)}</Text>
                ) : null}
              </View>
            </>
          ) : (
            <Text style={styles.heroCode}>Loading details...</Text>
          )}
        </View>

        <View style={styles.content}>
          {quotationQuery.isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#C9A86A" />
              <Text style={styles.loadingText}>Loading quotation...</Text>
            </View>
          ) : !quotation ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Unable to load quotation details.</Text>
            </View>
          ) : (
            <>
              {isExpired ? (
                <View style={styles.expiredBanner}>
                  <Text style={styles.expiredBannerText}>This quotation has expired and can no longer be accepted.</Text>
                </View>
              ) : null}

              <View style={styles.totalCard}>
                <Text style={styles.totalCardLabel}>TOTAL AMOUNT</Text>
                <Text style={styles.totalCardAmount}>{formatVndAmount(quotation.totalAmount, quotation.currency)}</Text>
                <Text style={styles.totalCardDeposit}>
                  {depositLabel}:{" "}
                  {hasVisibleDeposit(quotation)
                    ? formatVndAmount(displayDepositAmount, quotation.currency)
                    : "Pending from sales"}
                </Text>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>ITEMS ({quotation.items.length})</Text>
                {quotation.items.map((item, index) => (
                  <View
                    key={item.quotationItemId}
                    style={[styles.lineItem, index === quotation.items.length - 1 && styles.lineItemLast]}
                  >
                    <View style={styles.lineItemHeader}>
                      <Text style={styles.lineItemName}>{item.itemName}</Text>
                      <Text style={styles.lineItemAmount}>{formatVndAmount(item.totalAmount, quotation.currency)}</Text>
                    </View>
                    <View style={styles.lineItemMeta}>
                      <View style={styles.qtyBadge}>
                        <Text style={styles.qtyBadgeText}>× {item.quantity}</Text>
                      </View>
                      <Text style={styles.lineItemUnitPrice}>
                        {formatVndAmount(item.unitPrice, quotation.currency)} / unit
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>PRICING BREAKDOWN</Text>
                <View style={styles.breakdownBox}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Subtotal</Text>
                    <Text style={styles.breakdownValue}>
                      {formatVndAmount(quotation.subtotalAmount, quotation.currency)}
                    </Text>
                  </View>
                  {(quotation.totalDiscountAmount ?? 0) > 0 ? (
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Discount</Text>
                      <Text style={[styles.breakdownValue, styles.breakdownDiscount]}>
                        -{formatVndAmount(quotation.totalDiscountAmount, quotation.currency)}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Before VAT</Text>
                    <Text style={styles.breakdownValue}>
                      {formatVndAmount(quotation.preVatAmount, quotation.currency)}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>VAT ({Math.round((quotation.vatRate ?? 0) * 100)}%)</Text>
                    <Text style={styles.breakdownValue}>{formatVndAmount(quotation.vatAmount, quotation.currency)}</Text>
                  </View>
                  <View style={styles.breakdownDivider} />
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownTotalLabel}>Total</Text>
                    <Text style={styles.breakdownTotalValue}>
                      {formatVndAmount(quotation.totalAmount, quotation.currency)}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{depositLabel}</Text>
                    <Text style={styles.breakdownValue}>
                      {hasVisibleDeposit(quotation)
                        ? formatVndAmount(displayDepositAmount, quotation.currency)
                        : "Pending from sales"}
                    </Text>
                  </View>
                </View>
              </View>

              {quotation.salesNote ? (
                <View style={styles.noteBanner}>
                  <Text style={styles.noteBannerLabel}>NOTE FROM SALES</Text>
                  <Text style={styles.noteBannerText}>{quotation.salesNote}</Text>
                </View>
              ) : null}

              {hasActions ? (
                <View style={styles.actionsCard}>
                  <Text style={styles.actionsTitle}>YOUR DECISION</Text>
                  {canAccept ? (
                    <Pressable
                      style={[styles.primaryButton, isBusy && styles.buttonDisabled]}
                      disabled={isBusy}
                      onPress={handleAccept}
                    >
                      <Text style={styles.primaryButtonText}>Accept Quotation</Text>
                    </Pressable>
                  ) : null}
                  {canRevise ? (
                    <Pressable style={styles.secondaryButton} onPress={() => setActionMode("revision")}>
                      <Text style={styles.secondaryButtonText}>Request Revision</Text>
                    </Pressable>
                  ) : null}
                  {canReject ? (
                    <Pressable style={styles.dangerButton} onPress={() => setActionMode("reject")}>
                      <Text style={styles.dangerButtonText}>Reject Quotation</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {actionMode !== "none" ? (
                <View style={styles.formCard}>
                  <Text style={styles.formLabel}>
                    {actionMode === "revision" ? "REVISION REASON" : "REJECT REASON"}
                  </Text>
                  <TextInput
                    style={styles.input}
                    multiline
                    placeholder="Enter your reason..."
                    placeholderTextColor="#9B8F86"
                    value={reasonText}
                    onChangeText={setReasonText}
                  />
                  <Pressable
                    style={[styles.primaryButton, { marginTop: 12 }, isBusy && styles.buttonDisabled]}
                    disabled={isBusy}
                    onPress={handleSubmitReason}
                  >
                    <Text style={styles.primaryButtonText}>Submit</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.secondaryButton, { marginTop: 10 }]}
                    onPress={() => {
                      setActionMode("none");
                      setReasonText("");
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </Pressable>
                </View>
              ) : null}

              {quotation.status === "ACCEPTED" ? (
                <View style={styles.acceptedCard}>
                  <Text style={styles.acceptedText}>
                    Quotation accepted{quotation.acceptedAt ? ` on ${formatTrackingDate(quotation.acceptedAt)}` : ""}.
                    Proceed to pay the deposit from Project Tracking.
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
