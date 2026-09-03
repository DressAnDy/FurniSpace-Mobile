import React, { useEffect, useMemo, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { AppIcon } from "../../../shared/components/AppIcon";
import { calendarIconDefinition } from "../../../icons/project/definitions";
import { arrowLeftIconDefinition } from "../../../icons/navigation/definitions";
import { formatVndAmount } from "../../payment/utils/payment.mapper";
import {
  useBulkUpdateQuotationFinancialsMutation,
  useCancelQuotationMutation,
  useReviseQuotationMutation,
  useSaleQuotationDetailQuery,
  useSendQuotationMutation,
  useUpdateQuotationHeaderMutation,
  refetchSaleProjectOverviewQueries,
} from "../hooks/useSaleCommercial";
import type { QuotationStatus } from "../models/sale.commercial.model";
import { formatSaleDate } from "../utils/sale.mapper";
import {
  canCancelSaleQuotation,
  canEditSaleQuotation,
  canReviseSaleQuotation,
  canSendSaleQuotation,
  computeQuotationItemDraftTotal,
  getGroupedItemValidationError,
  getQuotationStatusPillColors,
  mergeQuotationItemDrafts,
  toQuotationItemDrafts,
  estimateQuotationTotalFromDrafts,
  expandGroupedQuotationItemDrafts,
  type GroupedQuotationItemDraft,
  type QuotationItemDraft,
  validateQuotationForm,
  validateQuotationHeaderForSend,
} from "../utils/sale.quotation.mapper";
import { SALE, saleStyles as s } from "../styles/sale.styles";

type Route = RouteProp<RootStackParamList, "SaleQuotationDetail">;

function formatApiDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseApiDateOnly(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDigits(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function formatDigits(value: string): string {
  const parsed = parseDigits(value);
  return parsed > 0 ? parsed.toLocaleString("vi-VN") : "";
}

function formatStatusLabel(status: QuotationStatus): string {
  return status.replaceAll("_", " ");
}

function QuotationField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | null;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={s.quotationFieldBlock}>
      <Text style={s.quotationFieldLabel}>
        {label}
        {required ? " *" : ""}
      </Text>
      {children}
      {error ? <Text style={s.quotationFieldErrorText}>{error}</Text> : null}
    </View>
  );
}

export function SaleQuotationDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { quotationId, projectId } = route.params;
  const projectName = route.params.projectName;

  const quotationQuery = useSaleQuotationDetailQuery(quotationId);
  const updateHeaderMutation = useUpdateQuotationHeaderMutation(projectId);
  const bulkUpdateMutation = useBulkUpdateQuotationFinancialsMutation(projectId);
  const sendMutation = useSendQuotationMutation(projectId);
  const reviseMutation = useReviseQuotationMutation(projectId);
  const cancelMutation = useCancelQuotationMutation(projectId);

  const quotation = quotationQuery.data;
  const editable = quotation ? canEditSaleQuotation(quotation.status) : false;
  const showRevise = quotation ? canReviseSaleQuotation(quotation.status) : false;
  const showSend = quotation ? canSendSaleQuotation(quotation.status) : false;
  const showCancel = quotation ? canCancelSaleQuotation(quotation.status) : false;
  const showFooter = editable || showRevise || showSend || showCancel;

  const [validUntil, setValidUntil] = useState<Date>(() => {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 14);
    return fallback;
  });
  const [depositAmount, setDepositAmount] = useState("");
  const [salesNote, setSalesNote] = useState("");
  const [groupedDrafts, setGroupedDrafts] = useState<GroupedQuotationItemDraft[]>([]);
  const [sourceItemDrafts, setSourceItemDrafts] = useState<QuotationItemDraft[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showValidationHints, setShowValidationHints] = useState(false);

  useEffect(() => {
    if (!quotation) {
      return;
    }
    const parsedValidUntil = parseApiDateOnly(quotation.validUntil);
    if (parsedValidUntil) {
      setValidUntil(parsedValidUntil);
    }
    setDepositAmount(quotation.depositAmount ? String(quotation.depositAmount) : "");
    setSalesNote(quotation.salesNote ?? "");
    const itemDrafts = toQuotationItemDrafts(quotation.items ?? []);
    setSourceItemDrafts(itemDrafts);
    setGroupedDrafts(mergeQuotationItemDrafts(itemDrafts));
  }, [quotation]);

  const isBusy =
    updateHeaderMutation.isPending ||
    bulkUpdateMutation.isPending ||
    sendMutation.isPending ||
    reviseMutation.isPending ||
    cancelMutation.isPending;

  const itemValidationErrors = useMemo(() => {
    const errors = new Map<string, string>();
    for (const item of groupedDrafts) {
      const error = getGroupedItemValidationError(item);
      if (error) {
        errors.set(item.groupKey, error);
      }
    }
    return errors;
  }, [groupedDrafts]);

  const estimatedTotal = useMemo(() => {
    if (!quotation) {
      return 0;
    }
    return estimateQuotationTotalFromDrafts(groupedDrafts, quotation.vatRate ?? 0.08);
  }, [groupedDrafts, quotation]);

  const headerSendValidationError = useMemo(() => {
    if (!showValidationHints) {
      return null;
    }
    return validateQuotationHeaderForSend({
      validUntil,
      depositAmount,
      estimatedTotal,
    });
  }, [depositAmount, estimatedTotal, showValidationHints, validUntil]);

  const totals = useMemo(() => {
    if (!quotation) {
      return null;
    }
    return {
      preVat: formatVndAmount(quotation.preVatAmount, quotation.currency),
      vat: formatVndAmount(quotation.vatAmount, quotation.currency),
      total: formatVndAmount(quotation.totalAmount, quotation.currency),
      deposit: formatVndAmount(parseDigits(depositAmount) || quotation.depositAmount, quotation.currency),
    };
  }, [depositAmount, quotation]);

  const statusColors = quotation ? getQuotationStatusPillColors(quotation.status) : getQuotationStatusPillColors("DRAFT");
  const footerPad = showFooter ? 120 + Math.max(insets.bottom, 12) : 24 + insets.bottom;

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (event.type === "dismissed" || !date) {
      return;
    }
    setValidUntil(date);
  };

  const persistChanges = async (options?: { forSend?: boolean }) => {
    if (!quotation || !editable) {
      return quotation;
    }

    const validationError = validateQuotationForm({
      groupedDrafts,
      validUntil,
      depositAmount,
      vatRate: quotation.vatRate,
      forSend: options?.forSend ?? false,
    });
    if (validationError) {
      setShowValidationHints(true);
      throw new Error(validationError);
    }

    const depositValue = parseDigits(depositAmount);
    await updateHeaderMutation.mutateAsync({
      quotationId,
      payload: {
        validUntil: formatApiDateOnly(validUntil),
        depositAmount: depositValue > 0 ? depositValue : null,
        salesNote: salesNote.trim() || null,
      },
    });

    if (groupedDrafts.length > 0) {
      return bulkUpdateMutation.mutateAsync({
        quotationId,
        payload: {
          items: expandGroupedQuotationItemDrafts(groupedDrafts, sourceItemDrafts),
        },
      });
    }

    const refreshed = await quotationQuery.refetch();
    return refreshed.data ?? quotation;
  };

  const handleSave = () => {
    setShowValidationHints(true);
    void persistChanges()
      .then(() => Alert.alert("Saved", "Quotation updated."))
      .catch((error) => Alert.alert("Error", getErrorMessage(error, "Unable to save quotation.")));
  };

  const handleSend = () => {
    if (!quotation) {
      return;
    }
    Alert.alert("Send quotation", "Save changes and send this quotation to the customer?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send",
        onPress: () => {
          setShowValidationHints(true);
          void persistChanges({ forSend: true })
            .then(() => sendMutation.mutateAsync(quotationId))
            .then(async () => {
              if (projectId) {
                await refetchSaleProjectOverviewQueries(queryClient, projectId);
              }
              Alert.alert("Sent", "Quotation sent to customer.", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            })
            .catch((error) => Alert.alert("Error", getErrorMessage(error, "Unable to send quotation.")));
        },
      },
    ]);
  };

  const handleRevise = () => {
    reviseMutation.mutate(quotationId, {
      onSuccess: () => Alert.alert("Revised", "Quotation moved to REVISED. Update pricing and send again."),
      onError: (error) => Alert.alert("Error", getErrorMessage(error, "Unable to revise quotation.")),
    });
  };

  const handleCancel = () => {
    Alert.alert("Cancel quotation", "This draft will be cancelled.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel quotation",
        style: "destructive",
        onPress: () =>
          cancelMutation.mutate(quotationId, {
            onSuccess: () => {
              Alert.alert("Cancelled", "Quotation cancelled.", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            },
            onError: (error) => Alert.alert("Error", getErrorMessage(error, "Unable to cancel quotation.")),
          }),
      },
    ]);
  };

  const updateGroupedDraft = (groupKey: string, patch: Partial<GroupedQuotationItemDraft>) => {
    setGroupedDrafts((current) =>
      current.map((row) => (row.groupKey === groupKey ? { ...row, ...patch } : row)),
    );
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={[s.frame, s.fill]}>
        <View style={[s.header, { paddingTop: 12, paddingBottom: 16 }]}>
          <View style={s.headerTopRow}>
            <Pressable style={s.headerIcon} onPress={() => navigation.goBack()}>
              <AppIcon definition={arrowLeftIconDefinition} size={16} color="#FFFFFF" />
            </Pressable>
            <View style={s.headerCopy}>
              <Text style={s.headerEyebrow}>Quotation</Text>
              <Text style={[s.headerTitle, { fontSize: 18 }]} numberOfLines={1}>
                {projectName ?? "Project"}
              </Text>
              <Text style={s.headerSubtitle} numberOfLines={1}>
                {quotation?.quotationCode ?? quotationId.slice(0, 8)}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.content, s.contentGap, { paddingBottom: footerPad, paddingTop: 12 }]}
        >
          {quotationQuery.isLoading ? (
            <ActivityIndicator color={SALE.gold} />
          ) : !quotation ? (
            <Text style={s.centerMuted}>Unable to load quotation.</Text>
          ) : (
            <>
              <View style={s.quotationHero}>
                <View style={s.quotationHeroAccent} />
                <View style={s.quotationHeroBody}>
                  <View style={s.quotationHeroTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.quotationHeroAmount}>{totals?.total ?? "—"}</Text>
                      <Text style={s.quotationHeroMeta}>
                        v{quotation.versionNo ?? 1} · {groupedDrafts.length} item{groupedDrafts.length === 1 ? "" : "s"}
                      </Text>
                    </View>
                    <View style={[s.quotationStatusPill, { backgroundColor: statusColors.backgroundColor }]}>
                      <Text style={[s.quotationStatusText, { color: statusColors.color }]}>
                        {formatStatusLabel(quotation.status)}
                      </Text>
                    </View>
                  </View>

                  {totals ? (
                    <View style={s.quotationBreakdown}>
                      <View style={s.quotationBreakdownCell}>
                        <Text style={s.quotationBreakdownValue}>{totals.preVat}</Text>
                        <Text style={s.quotationBreakdownLabel}>Pre-VAT</Text>
                      </View>
                      <View style={s.quotationBreakdownCell}>
                        <Text style={s.quotationBreakdownValue}>{totals.vat}</Text>
                        <Text style={s.quotationBreakdownLabel}>VAT 8%</Text>
                      </View>
                      <View style={s.quotationBreakdownCell}>
                        <Text style={[s.quotationBreakdownValue, { color: SALE.gold }]}>{totals.deposit}</Text>
                        <Text style={s.quotationBreakdownLabel}>Deposit</Text>
                      </View>
                    </View>
                  ) : null}

                  {quotation.revisionReason ? (
                    <View style={s.quotationOverviewNote}>
                      <Text style={s.quotationOverviewNoteText}>{quotation.revisionReason}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {editable ? (
                <>
                  <View style={s.card}>
                    <Text style={s.sectionLabel}>Terms</Text>
                    <View style={{ marginTop: 12, gap: 14 }}>
                      <View style={s.quotationItemFields}>
                        <View style={{ flex: 1 }}>
                          <QuotationField label="Valid until" required>
                            <Pressable
                              style={[
                                s.quotationFieldInput,
                                { flexDirection: "row", alignItems: "center", gap: 8 },
                                showValidationHints && headerSendValidationError?.includes("Valid until")
                                  ? s.quotationFieldInputError
                                  : null,
                              ]}
                              onPress={() => setShowDatePicker(true)}
                            >
                              <AppIcon definition={calendarIconDefinition} size={14} color={SALE.muted} />
                              <Text style={{ color: SALE.ink, fontSize: 14 }}>
                                {formatSaleDate(formatApiDateOnly(validUntil))}
                              </Text>
                            </Pressable>
                          </QuotationField>
                        </View>
                        <View style={{ flex: 1 }}>
                          <QuotationField
                            label="Deposit"
                            required
                            error={
                              showValidationHints &&
                              headerSendValidationError &&
                              !headerSendValidationError.includes("Valid until")
                                ? headerSendValidationError
                                : null
                            }
                          >
                            <TextInput
                              value={formatDigits(depositAmount)}
                              onChangeText={(value) => setDepositAmount(value.replace(/\D/g, ""))}
                              keyboardType="number-pad"
                              placeholder="0"
                              placeholderTextColor="rgba(122,111,104,.45)"
                              style={[
                                s.quotationFieldInput,
                                showValidationHints &&
                                headerSendValidationError &&
                                !headerSendValidationError.includes("Valid until")
                                  ? s.quotationFieldInputError
                                  : null,
                              ]}
                            />
                          </QuotationField>
                        </View>
                      </View>

                      {showValidationHints && headerSendValidationError?.includes("Valid until") ? (
                        <Text style={s.quotationFieldErrorText}>{headerSendValidationError}</Text>
                      ) : null}

                      <QuotationField label="Sales note">
                        <TextInput
                          value={salesNote}
                          onChangeText={setSalesNote}
                          placeholder="Internal note (optional)"
                          placeholderTextColor="rgba(122,111,104,.45)"
                          style={[s.quotationFieldInput, s.quotationFieldInputMultiline]}
                          multiline
                        />
                      </QuotationField>
                    </View>

                    {showDatePicker ? (
                      <>
                        <DateTimePicker
                          value={validUntil}
                          mode="date"
                          display={Platform.OS === "ios" ? "spinner" : "default"}
                          onChange={handleDateChange}
                        />
                        {Platform.OS === "ios" ? (
                          <Pressable
                            style={[s.quotationFooterSecondary, { marginTop: 8, height: 40 }]}
                            onPress={() => setShowDatePicker(false)}
                          >
                            <Text style={s.quotationFooterSecondaryText}>Done</Text>
                          </Pressable>
                        ) : null}
                      </>
                    ) : null}
                  </View>

                  <View style={s.card}>
                    <View style={s.sectionRow}>
                      <Text style={[s.sectionLabel, { marginBottom: 0 }]}>Pricing</Text>
                      <Text style={s.sectionAction}>{groupedDrafts.length} items</Text>
                    </View>
                    <View style={{ marginTop: 12, gap: 10 }}>
                      {groupedDrafts.map((item) => {
                        const itemError = itemValidationErrors.get(item.groupKey) ?? null;
                        const lineTotal = computeQuotationItemDraftTotal(item);

                        return (
                        <View
                          key={item.groupKey}
                          style={[s.quotationItemCard, itemError ? s.quotationItemCardError : null]}
                        >
                          <View style={s.quotationItemHeader}>
                            <View style={{ flex: 1, gap: 4 }}>
                              <Text style={s.quotationItemName}>{item.label}</Text>
                              {item.sourceItemIds.length > 1 ? (
                                <Text style={s.quotationItemMergedHint}>
                                  Gộp từ {item.sourceItemIds.length} dòng
                                </Text>
                              ) : null}
                            </View>
                            <Text
                              style={[
                                s.quotationItemTotal,
                                lineTotal <= 0 ? s.quotationItemTotalInvalid : null,
                              ]}
                            >
                              {formatVndAmount(lineTotal, quotation.currency)}
                            </Text>
                          </View>
                          <View style={s.quotationItemFields}>
                            <View style={s.quotationItemField}>
                              <Text style={s.infoLabel}>Qty</Text>
                              <TextInput
                                value={item.quantity}
                                onChangeText={(value) =>
                                  updateGroupedDraft(item.groupKey, { quantity: value.replace(/\D/g, "") })
                                }
                                keyboardType="number-pad"
                                style={[
                                  s.quotationFieldInput,
                                  itemError?.includes("Số lượng") ? s.quotationFieldInputError : null,
                                ]}
                              />
                            </View>
                            <View style={[s.quotationItemField, { flex: 1.6 }]}>
                              <Text style={s.infoLabel}>Unit price</Text>
                              <TextInput
                                value={formatDigits(item.unitPrice)}
                                onChangeText={(value) =>
                                  updateGroupedDraft(item.groupKey, { unitPrice: value.replace(/\D/g, "") })
                                }
                                keyboardType="number-pad"
                                style={[
                                  s.quotationFieldInput,
                                  itemError?.includes("Đơn giá") ? s.quotationFieldInputError : null,
                                ]}
                              />
                            </View>
                          </View>
                          <QuotationField label="Discount">
                            <TextInput
                              value={formatDigits(item.discountAmount)}
                              onChangeText={(value) =>
                                updateGroupedDraft(item.groupKey, {
                                  discountAmount: value.replace(/\D/g, ""),
                                })
                              }
                              keyboardType="number-pad"
                              placeholder="0"
                              placeholderTextColor="rgba(122,111,104,.45)"
                              style={[
                                s.quotationFieldInput,
                                itemError?.includes("Giảm giá") || itemError?.includes("Thành tiền")
                                  ? s.quotationFieldInputError
                                  : null,
                              ]}
                            />
                          </QuotationField>
                          {itemError ? <Text style={s.quotationFieldErrorText}>{itemError}</Text> : null}
                        </View>
                      )})}
                    </View>
                  </View>
                </>
              ) : (
                <View style={s.card}>
                  <Text style={s.sectionLabel}>Summary</Text>
                  <View style={[s.infoGrid, { marginTop: 10 }]}>
                    <View style={s.infoCell}>
                      <Text style={s.infoLabel}>Valid until</Text>
                      <Text style={s.infoValue}>
                        {quotation.validUntil ? formatSaleDate(quotation.validUntil) : "—"}
                      </Text>
                    </View>
                    <View style={s.infoCell}>
                      <Text style={s.infoLabel}>Deposit</Text>
                      <Text style={s.infoValue}>{totals?.deposit ?? "—"}</Text>
                    </View>
                  </View>
                  {quotation.salesNote ? (
                    <Text style={[s.cardMeta, { marginTop: 12, lineHeight: 16 }]}>{quotation.salesNote}</Text>
                  ) : null}
                </View>
              )}
            </>
          )}
        </ScrollView>

        {showFooter && quotation ? (
          <View style={[s.quotationFooter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {showRevise ? (
              <Pressable
                style={[s.quotationFooterPrimary, isBusy && { opacity: 0.5 }]}
                disabled={isBusy}
                onPress={handleRevise}
              >
                <Text style={s.quotationFooterPrimaryText}>
                  {reviseMutation.isPending ? "Processing…" : "Mark as revised"}
                </Text>
              </Pressable>
            ) : (
              <View style={s.quotationFooterRow}>
                {editable ? (
                  <Pressable
                    style={[s.quotationFooterSecondary, isBusy && { opacity: 0.5 }]}
                    disabled={isBusy}
                    onPress={handleSave}
                  >
                    <Text style={s.quotationFooterSecondaryText}>
                      {updateHeaderMutation.isPending || bulkUpdateMutation.isPending ? "Saving…" : "Save"}
                    </Text>
                  </Pressable>
                ) : null}
                {showSend ? (
                  <Pressable
                    style={[s.quotationFooterPrimary, isBusy && { opacity: 0.5 }]}
                    disabled={isBusy}
                    onPress={handleSend}
                  >
                    <Text style={s.quotationFooterPrimaryText}>
                      {sendMutation.isPending ? "Sending…" : "Send to customer"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}
            {showCancel ? (
              <Pressable style={s.quotationCancelLink} disabled={isBusy} onPress={handleCancel}>
                <Text style={s.quotationCancelText}>Cancel quotation</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
