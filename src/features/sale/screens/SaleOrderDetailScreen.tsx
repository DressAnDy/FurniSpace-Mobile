import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { AppIcon } from "../../../shared/components/AppIcon";
import { arrowLeftIconDefinition, chevronDownIconDefinition } from "../../../icons/navigation/definitions";
import { calendarIconDefinition } from "../../../icons/project/definitions";
import type { CreateProductionRequestDto } from "../models/sale.fulfillment.model";
import { resolveOrderDisplayTotal } from "../../project/utils/order.mapper";
import { useProjectDetailQuery } from "../../project/hooks/useProjects";
import { formatVndAmount } from "../../payment/utils/payment.mapper";
import { useSalePhaseDeadlinesQuery } from "../hooks/useSaleOps";
import {
  useAvailableProductionStaffQuery,
  useCompleteOrderMutation,
  useCompleteProjectMutation,
  useCreateProductionRequestMutation,
  useCreateSaleDepositMutation,
  useCreateSaleRemainingPaymentMutation,
  usePutProductionPhaseDeadlineMutation,
  useSaleOrderDetailQuery,
  useSaleOrderPaymentsQuery,
  useSaleProductionRequestsQuery,
} from "../hooks/useSaleFulfillment";
import { formatSaleDate } from "../utils/sale.mapper";
import {
  canSalesCompleteOrder,
  canSalesCompleteProject,
  canSalesCreateDeposit,
  canShowProductionSection,
  canSalesStartProductionSetup,
  getExistingProductionRequest,
  canSalesCreateRemainingPayment,
  findPendingSaleOrderPayment,
  getProductionPhaseDeadline,
  getSaleOrderNextStepNote,
  getSaleOrderStatusColors,
  hasOrderDeliveryDetails,
  hasPaidSaleOrderPayment,
  hasPendingSaleOrderPayment,
} from "../utils/sale.order.actions";
import { formatSaleOrderStatusLabel, mergeSaleOrderLineItems } from "../utils/sale.order.mapper";
import { SALE, saleStyles as s } from "../styles/sale.styles";

type Route = RouteProp<RootStackParamList, "SaleOrderDetail">;
type ProductionPriority = NonNullable<CreateProductionRequestDto["priority"]>;

const PRODUCTION_PRIORITIES: Array<{ value: ProductionPriority; label: string }> = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

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

function defaultProductionDueDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
}

function InfoRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={s.infoCell}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

export function SaleOrderDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { orderId, projectId, projectName } = route.params;

  const orderQuery = useSaleOrderDetailQuery(orderId);
  const projectQuery = useProjectDetailQuery(projectId);
  const paymentsQuery = useSaleOrderPaymentsQuery(orderId);
  const phaseQuery = useSalePhaseDeadlinesQuery(projectId);
  const productionRequestsQuery = useSaleProductionRequestsQuery(projectId, orderId);
  const productionStaffQuery = useAvailableProductionStaffQuery(projectId);

  const depositMutation = useCreateSaleDepositMutation(projectId);
  const remainingMutation = useCreateSaleRemainingPaymentMutation(projectId);
  const productionDeadlineMutation = usePutProductionPhaseDeadlineMutation(projectId);
  const productionRequestMutation = useCreateProductionRequestMutation(projectId);
  const completeOrderMutation = useCompleteOrderMutation(projectId);
  const completeProjectMutation = useCompleteProjectMutation();

  const order = orderQuery.data;
  const payments = paymentsQuery.data?.payments ?? [];
  const deadlines = phaseQuery.data?.deadlines ?? [];
  const productionRequests = productionRequestsQuery.data ?? [];
  const productionDeadline = getProductionPhaseDeadline(deadlines);

  const [productionDueDate, setProductionDueDate] = useState<Date>(() => defaultProductionDueDate());
  const [showProductionDatePicker, setShowProductionDatePicker] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<ProductionPriority>("NORMAL");
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const productionStaff = productionStaffQuery.data ?? [];
  const selectedStaff = productionStaff.find((staff) => staff.accountId === selectedStaffId) ?? null;
  const targetCompletionDate = phaseQuery.data?.targetCompletionDate ?? null;

  useEffect(() => {
    const parsed = parseApiDateOnly(productionDeadline?.dueDate);
    if (parsed) {
      setProductionDueDate(parsed);
    }
  }, [productionDeadline?.dueDate]);

  useEffect(() => {
    if (selectedStaffId || productionStaff.length === 0) {
      return;
    }
    setSelectedStaffId(productionStaff[0].accountId);
  }, [productionStaff, selectedStaffId]);

  useFocusEffect(
    useCallback(() => {
      void orderQuery.refetch();
      void paymentsQuery.refetch();
      void productionRequestsQuery.refetch();
      void phaseQuery.refetch();
    }, [orderQuery, paymentsQuery, productionRequestsQuery, phaseQuery]),
  );

  const statusColors = getSaleOrderStatusColors(order?.status ?? "CREATED");
  const displayTotal = order ? resolveOrderDisplayTotal(order) : 0;
  const nextStep = getSaleOrderNextStepNote(order, payments, deadlines, productionRequests);

  const showDepositAction = canSalesCreateDeposit(order) && hasOrderDeliveryDetails(order);
  const showRemainingAction =
    canSalesCreateRemainingPayment(order) && !hasPaidSaleOrderPayment(payments, "REMAINING_PAYMENT");
  const existingProductionRequest = getExistingProductionRequest(productionRequests, orderId);
  const showProductionSection = canShowProductionSection(order, productionRequests);
  const showProductionSetup = canSalesStartProductionSetup(order, productionRequests);
  const showCompleteAction = canSalesCompleteOrder(order);
  const showCompleteProjectAction = canSalesCompleteProject(order, projectQuery.data?.status);

  const pendingDeposit = findPendingSaleOrderPayment(payments, "DEPOSIT");
  const pendingRemaining = findPendingSaleOrderPayment(payments, "REMAINING_PAYMENT");
  const hasPendingDeposit = hasPendingSaleOrderPayment(payments, "DEPOSIT");

  const isStartingProduction =
    productionDeadlineMutation.isPending || productionRequestMutation.isPending;

  const isBusy =
    depositMutation.isPending ||
    remainingMutation.isPending ||
    isStartingProduction ||
    completeOrderMutation.isPending ||
    completeProjectMutation.isPending;

  const showFooter =
    showDepositAction ||
    hasPendingDeposit ||
    showRemainingAction ||
    showCompleteAction ||
    showCompleteProjectAction;

  const footerPad = showFooter ? 120 + Math.max(insets.bottom, 12) : 24 + insets.bottom;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        orderQuery.refetch(),
        projectQuery.refetch(),
        paymentsQuery.refetch(),
        phaseQuery.refetch(),
        productionRequestsQuery.refetch(),
        productionStaffQuery.refetch(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const openPaymentMethod = (paymentId: string, paymentType: "DEPOSIT" | "REMAINING_PAYMENT") => {
    navigation.navigate("PaymentMethod", {
      orderId,
      projectId,
      paymentId,
      paymentType,
    });
  };

  const handleCreateDeposit = () => {
    if (hasPendingDeposit && pendingDeposit?.paymentId) {
      openPaymentMethod(pendingDeposit.paymentId, "DEPOSIT");
      return;
    }

    depositMutation.mutate(
      { orderId, payload: {} },
      {
        onSuccess: (payment) => {
          Alert.alert("Deposit created", "Share payment QR/link with customer.", [
            {
              text: "Open payment",
              onPress: () => openPaymentMethod(payment.paymentId, "DEPOSIT"),
            },
            { text: "OK" },
          ]);
        },
        onError: (error) => Alert.alert("Error", getErrorMessage(error, "Unable to create deposit payment.")),
      },
    );
  };

  const handleCreateRemaining = () => {
    if (pendingRemaining?.paymentId && (pendingRemaining.status === "PENDING" || pendingRemaining.status === "PROCESSING")) {
      openPaymentMethod(pendingRemaining.paymentId, "REMAINING_PAYMENT");
      return;
    }

    remainingMutation.mutate(
      { orderId, payload: {} },
      {
        onSuccess: (payment) => {
          Alert.alert("Remaining payment created", "Share payment with customer if needed.", [
            {
              text: "Open payment",
              onPress: () => openPaymentMethod(payment.paymentId, "REMAINING_PAYMENT"),
            },
            { text: "OK" },
          ]);
        },
        onError: (error) => Alert.alert("Error", getErrorMessage(error, "Unable to create remaining payment.")),
      },
    );
  };

  const handleStartProduction = async () => {
    if (!selectedStaffId) {
      Alert.alert("Select staff", "Choose a production staff member first.");
      return;
    }

    const deadline = formatApiDateOnly(productionDueDate);
    const target = targetCompletionDate?.slice(0, 10);
    if (target && deadline > target) {
      Alert.alert("Invalid deadline", `Production deadline must be on or before the project target (${formatSaleDate(target)}).`);
      return;
    }

    try {
      await productionDeadlineMutation.mutateAsync({
        productionDeadline: deadline,
      });
      await productionRequestMutation.mutateAsync({
        orderId,
        payload: {
          assignedTo: selectedStaffId,
          priority: selectedPriority,
        },
      });
      Alert.alert("Production created", "Deadline saved and production staff assigned.");
      await Promise.all([phaseQuery.refetch(), productionRequestsQuery.refetch(), orderQuery.refetch()]);
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error, "Unable to create production."));
    }
  };

  const handleCompleteOrder = () => {
    Alert.alert("Complete order", "Mark this order as completed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        onPress: () =>
          completeOrderMutation.mutate(orderId, {
            onSuccess: () => {
              void projectQuery.refetch();
              Alert.alert("Order completed", "You can now complete the project.");
            },
            onError: (error) => Alert.alert("Error", getErrorMessage(error, "Unable to complete order.")),
          }),
      },
    ]);
  };

  const handleCompleteProject = () => {
    Alert.alert("Complete project", "Mark this project as completed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        onPress: () =>
          completeProjectMutation.mutate(projectId, {
            onSuccess: () => {
              Alert.alert("Completed", "Project marked complete.", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            },
            onError: (error) => Alert.alert("Error", getErrorMessage(error, "Unable to complete project.")),
          }),
      },
    ]);
  };

  const handleProductionDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setShowProductionDatePicker(false);
    }
    if (event.type === "dismissed" || !date) {
      return;
    }
    setProductionDueDate(date);
  };

  const groupedLineItems = useMemo(() => mergeSaleOrderLineItems(order?.items ?? []), [order?.items]);

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={[s.frame, s.fill]}>
        <View style={[s.header, { paddingTop: 12, paddingBottom: 16 }]}>
          <View style={s.headerTopRow}>
            <Pressable style={s.headerIcon} onPress={() => navigation.goBack()}>
              <AppIcon definition={arrowLeftIconDefinition} size={16} color="#FFFFFF" />
            </Pressable>
            <View style={s.headerCopy}>
              <Text style={s.headerEyebrow}>Order</Text>
              <Text style={[s.headerTitle, { fontSize: 18 }]} numberOfLines={1}>
                {projectName ?? "Project"}
              </Text>
              <Text style={s.headerSubtitle} numberOfLines={1}>
                {order?.orderCode ?? orderId.slice(0, 8)}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => void handleRefresh()} tintColor={SALE.gold} />
          }
          contentContainerStyle={[s.content, s.contentGap, { paddingBottom: footerPad, paddingTop: 12 }]}
        >
          {orderQuery.isLoading ? (
            <ActivityIndicator color={SALE.gold} />
          ) : !order ? (
            <Text style={s.centerMuted}>Unable to load order.</Text>
          ) : (
            <>
              <View style={s.quotationHero}>
                <View style={s.quotationHeroAccent} />
                <View style={s.quotationHeroBody}>
                  <View style={s.quotationHeroTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.quotationHeroAmount}>{formatVndAmount(displayTotal)}</Text>
                      <Text style={s.quotationHeroMeta}>
                        Deposit {formatVndAmount(order.depositAmount ?? 0)} · Paid{" "}
                        {formatVndAmount(order.paidAmount ?? 0)}
                      </Text>
                    </View>
                    <View style={[s.quotationStatusPill, { backgroundColor: statusColors.backgroundColor }]}>
                      <Text style={[s.quotationStatusText, { color: statusColors.color }]}>
                        {formatSaleOrderStatusLabel(order.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={s.quotationBreakdown}>
                    <View style={s.quotationBreakdownCell}>
                      <Text style={s.quotationBreakdownValue}>{formatVndAmount(order.paidAmount ?? 0)}</Text>
                      <Text style={s.quotationBreakdownLabel}>Paid</Text>
                    </View>
                    <View style={s.quotationBreakdownCell}>
                      <Text style={s.quotationBreakdownValue}>{formatVndAmount(order.remainingAmount ?? 0)}</Text>
                      <Text style={s.quotationBreakdownLabel}>Remaining</Text>
                    </View>
                    <View style={s.quotationBreakdownCell}>
                      <Text style={[s.quotationBreakdownValue, { color: SALE.gold }]}>
                        {groupedLineItems.length}
                      </Text>
                      <Text style={s.quotationBreakdownLabel}>Items</Text>
                    </View>
                  </View>

                  {nextStep ? (
                    <View style={s.quotationOverviewNote}>
                      <Text style={[s.quotationOverviewNoteText, { color: SALE.ink }]}>{nextStep}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {showProductionSection ? (
                <View style={s.quotationOverviewCard}>
                  <View style={s.quotationOverviewAccent} />
                  <View style={s.quotationOverviewBody}>
                    <View>
                      <Text style={s.productionAssignTitle}>Production Assignment</Text>
                      <Text style={s.productionAssignSubtitle}>
                        {!showProductionSetup && existingProductionRequest
                          ? "Production request is already created for this order."
                          : "Choose staff, priority, and deadline before creating the request."}
                      </Text>
                    </View>

                    {!showProductionSetup && existingProductionRequest ? (
                      <View style={s.infoGrid}>
                        <InfoRow
                          label="Staff"
                          value={existingProductionRequest.assignedToName ?? selectedStaff?.fullName ?? "Assigned"}
                        />
                        <InfoRow
                          label="Priority"
                          value={(existingProductionRequest.priority ?? selectedPriority).replaceAll("_", " ")}
                        />
                        <InfoRow
                          label="Deadline"
                          value={formatSaleDate(
                            existingProductionRequest.productionDeadline ?? productionDeadline?.dueDate,
                          )}
                        />
                        <InfoRow label="Status" value={existingProductionRequest.status ?? "PENDING"} />
                      </View>
                    ) : (
                      <View style={{ gap: 14 }}>
                        <View style={s.quotationFieldBlock}>
                          <Text style={s.quotationFieldLabel}>Staff</Text>
                          <Pressable
                            style={s.productionSelectRow}
                            onPress={() => setShowStaffPicker((open) => !open)}
                          >
                            <Text
                              style={selectedStaff ? s.productionSelectValue : s.productionSelectPlaceholder}
                              numberOfLines={1}
                            >
                              {selectedStaff?.fullName ?? "Select production staff"}
                            </Text>
                            <AppIcon definition={chevronDownIconDefinition} size={14} color={SALE.muted} />
                          </Pressable>
                          <Text style={s.productionFieldHint}>
                            {selectedStaff
                              ? `${selectedStaff.activeRequestCount ?? 0} active`
                              : productionStaffQuery.isLoading
                                ? "Loading staff…"
                                : `${productionStaff.length} available`}
                          </Text>
                          {showStaffPicker ? (
                            <View style={s.productionOptionList}>
                              {productionStaff.length === 0 ? (
                                <Text style={[s.cardMeta, { lineHeight: 16, padding: 8 }]}>
                                  No production staff available. Pull to refresh or try again later.
                                </Text>
                              ) : (
                                productionStaff.map((staff) => {
                                  const selected = selectedStaffId === staff.accountId;
                                  return (
                                    <Pressable
                                      key={staff.accountId}
                                      style={[
                                        s.productionStaffOption,
                                        selected && s.productionStaffOptionSelected,
                                      ]}
                                      onPress={() => {
                                        setSelectedStaffId(staff.accountId);
                                        setShowStaffPicker(false);
                                      }}
                                    >
                                      <Text style={s.productionStaffName}>{staff.fullName}</Text>
                                      <Text style={s.productionStaffMeta}>
                                        {staff.activeRequestCount ?? 0} active
                                      </Text>
                                    </Pressable>
                                  );
                                })
                              )}
                            </View>
                          ) : null}
                        </View>

                        <View style={s.quotationFieldBlock}>
                          <Text style={s.quotationFieldLabel}>Priority</Text>
                          <View style={s.productionPriorityRow}>
                            {PRODUCTION_PRIORITIES.map((option) => {
                              const selected = selectedPriority === option.value;
                              return (
                                <Pressable
                                  key={option.value}
                                  style={[s.productionPriorityChip, selected && s.typeSelected]}
                                  onPress={() => setSelectedPriority(option.value)}
                                >
                                  <Text style={[s.chipText, selected && { color: SALE.charcoal }]}>
                                    {option.label}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>

                        <View style={s.quotationFieldBlock}>
                          <Text style={s.quotationFieldLabel}>Production deadline</Text>
                          <Pressable
                            style={s.productionSelectRow}
                            onPress={() => setShowProductionDatePicker(true)}
                          >
                            <Text style={s.productionSelectValue}>
                              {formatSaleDate(formatApiDateOnly(productionDueDate))}
                            </Text>
                            <AppIcon definition={calendarIconDefinition} size={14} color={SALE.muted} />
                          </Pressable>
                          <Text style={s.productionFieldHint}>
                            Project target: {targetCompletionDate ? formatSaleDate(targetCompletionDate) : "—"}
                          </Text>
                        </View>

                        {showProductionDatePicker ? (
                          <>
                            <DateTimePicker
                              value={productionDueDate}
                              mode="date"
                              display={Platform.OS === "ios" ? "spinner" : "default"}
                              minimumDate={new Date()}
                              maximumDate={parseApiDateOnly(targetCompletionDate) ?? undefined}
                              onChange={handleProductionDateChange}
                            />
                            {Platform.OS === "ios" ? (
                              <Pressable
                                style={[s.quotationFooterSecondary, { height: 40, flex: undefined }]}
                                onPress={() => setShowProductionDatePicker(false)}
                              >
                                <Text style={s.quotationFooterSecondaryText}>Done</Text>
                              </Pressable>
                            ) : null}
                          </>
                        ) : null}

                        <Pressable
                          style={[s.productionCreateButton, (isBusy || !selectedStaffId) && { opacity: 0.5 }]}
                          disabled={isBusy || !selectedStaffId}
                          onPress={() => void handleStartProduction()}
                        >
                          <Text style={s.quotationFooterPrimaryText}>
                            {isStartingProduction ? "Creating…" : "Create Production"}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              ) : null}

              <View style={s.card}>
                <Text style={s.sectionLabel}>Delivery details</Text>
                {hasOrderDeliveryDetails(order) ? (
                  <View style={[s.infoGrid, { marginTop: 10 }]}>
                    <View style={{ width: "100%" }}>
                      <Text style={s.infoLabel}>Address</Text>
                      <Text style={s.infoValue}>{order.deliveryDetails?.deliveryAddress ?? "—"}</Text>
                    </View>
                    <InfoRow label="Receiver" value={order.deliveryDetails?.receiverName ?? "—"} />
                    <InfoRow label="Phone" value={order.deliveryDetails?.receiverPhone ?? "—"} />
                    {order.deliveryDetails?.deliveryNote ? (
                      <View style={{ width: "100%" }}>
                        <Text style={s.infoLabel}>Note</Text>
                        <Text style={[s.bodyText, { marginTop: 4 }]}>{order.deliveryDetails.deliveryNote}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <Text style={[s.cardMeta, { marginTop: 10, lineHeight: 16 }]}>
                    Customer has not submitted delivery details yet. Deposit payment requires address, receiver name,
                    and phone.
                  </Text>
                )}
              </View>

              {groupedLineItems.length > 0 ? (
                <View style={s.card}>
                  <Text style={s.sectionLabel}>Line items</Text>
                  <View style={{ marginTop: 10, gap: 8 }}>
                    {groupedLineItems.map((item) => (
                      <View key={item.groupKey} style={s.quotationItemCard}>
                        <View style={s.quotationItemHeader}>
                          <View style={{ flex: 1, gap: 4 }}>
                            <Text style={s.quotationItemName}>{item.label}</Text>
                            {item.sourceItemIds.length > 1 ? (
                              <Text style={s.quotationItemMergedHint}>
                                Gộp từ {item.sourceItemIds.length} dòng
                              </Text>
                            ) : null}
                          </View>
                          <Text style={s.quotationItemTotal}>{formatVndAmount(item.subtotalAmount)}</Text>
                        </View>
                        <Text style={s.cardMeta}>
                          Qty {item.quantity} · {formatVndAmount(item.unitPrice)} / unit
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>

        {order && showFooter ? (
          <View style={[s.quotationFooter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {showDepositAction && !hasPaidSaleOrderPayment(payments, "DEPOSIT") ? (
              <Pressable
                style={[s.quotationFooterPrimary, isBusy && { opacity: 0.5 }]}
                disabled={isBusy}
                onPress={handleCreateDeposit}
              >
                <Text style={s.quotationFooterPrimaryText}>
                  {depositMutation.isPending
                    ? "Creating…"
                    : hasPendingDeposit
                      ? "Open deposit payment"
                      : "Create deposit payment"}
                </Text>
              </Pressable>
            ) : null}

            {showRemainingAction ? (
              <Pressable
                style={[s.quotationFooterPrimary, isBusy && { opacity: 0.5 }]}
                disabled={isBusy}
                onPress={handleCreateRemaining}
              >
                <Text style={s.quotationFooterPrimaryText}>
                  {remainingMutation.isPending
                    ? "Creating…"
                    : pendingRemaining &&
                        (pendingRemaining.status === "PENDING" || pendingRemaining.status === "PROCESSING")
                      ? "Open remaining payment"
                      : "Create remaining payment"}
                </Text>
              </Pressable>
            ) : null}

            {showCompleteAction ? (
              <Pressable
                style={[s.quotationFooterSecondary, isBusy && { opacity: 0.5 }]}
                disabled={isBusy}
                onPress={handleCompleteOrder}
              >
                <Text style={s.quotationFooterSecondaryText}>
                  {completeOrderMutation.isPending ? "Completing…" : "Complete order"}
                </Text>
              </Pressable>
            ) : null}

            {showCompleteProjectAction ? (
              <Pressable
                style={[s.quotationFooterPrimary, isBusy && { opacity: 0.5 }]}
                disabled={isBusy}
                onPress={handleCompleteProject}
              >
                <Text style={s.quotationFooterPrimaryText}>
                  {completeProjectMutation.isPending ? "Completing…" : "Complete project"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
