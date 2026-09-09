import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ActivityIndicator, AppState, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { arrowLeftIconDefinition, chevronRightIconDefinition } from "../../../icons/navigation/definitions";
import { checkIconDefinition } from "../../../icons/status/definitions";
import { mapPinIconDefinition } from "../../../icons/common/definitions";
import { phoneIconDefinition } from "../../../icons/communication/definitions";
import { userIconDefinition } from "../../../icons/auth/definitions";
import { truckIconDefinition } from "../../../icons/commerce/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { useAuthStore } from "../../auth/store/auth.store";
import { getProjectByIdApi } from "../../project/services/project.api";
import { getOrderByIdApi, hasOrderDeliveryDetails } from "../../project/services/project.tracking.api";
import { UpdateOrderDeliveryDetailsRequestDto } from "../../project/models/project.tracking.model";
import { bootstrapPaymentMethod, isDeliveryDetailsRequiredError } from "../hooks/usePayments";
import { isPaymentTerminalStatus, usePaymentRealtime } from "../hooks/usePaymentRealtime";
import { PaymentDetailDto, PaymentUpdatedRealtimeDto } from "../models/payment.model";
import { formatVndAmount, getPaymentStatusLabel, getPaymentTypeLabel } from "../utils/payment.mapper";
import { paymentBrandColors, styles } from "./PaymentMethodScreen.styles";

const brandLogo = require("../../../../assets/brand/furnispace-logo.png");
const sepayLogo = require("../../../../assets/brand/sepay-logo.png");
const payosLogo = require("../../../../assets/brand/payos-logo.png");

type PaymentMethodRoute = RouteProp<RootStackParamList, "PaymentMethod">;

export function PaymentMethodScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<PaymentMethodRoute>();
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsDeliveryDetails, setNeedsDeliveryDetails] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [receiverName, setReceiverName] = useState(currentUser?.fullName ?? "");
  const [receiverPhone, setReceiverPhone] = useState(currentUser?.phone ?? "");
  const [deliveryNote, setDeliveryNote] = useState("");

  const methodQueryKey = useMemo(
    () =>
      [
        "payment",
        "method",
        route.params.paymentId ?? "order",
        route.params.orderId ?? "none",
        route.params.paymentType ?? "DEPOSIT",
      ] as const,
    [route.params.orderId, route.params.paymentId, route.params.paymentType],
  );

  const resolvePayment = useCallback(
    async (deliveryDetails?: UpdateOrderDeliveryDetailsRequestDto) => {
      if (route.params.orderId && !route.params.paymentId) {
        try {
          const order = await getOrderByIdApi(route.params.orderId);
          if (!hasOrderDeliveryDetails(order) && !deliveryDetails) {
            let defaultAddress = order.deliveryAddress ?? "";
            if (!defaultAddress && route.params.projectId) {
              const project = await getProjectByIdApi(route.params.projectId);
              defaultAddress = project.projectAddress ?? "";
            }

            setDeliveryAddress(defaultAddress);
            setReceiverName((prev) => order.receiverName?.trim() || prev || currentUser?.fullName || "");
            setReceiverPhone((prev) => order.receiverPhone?.trim() || prev || currentUser?.phone || "");
            setDeliveryNote(order.deliveryNote?.trim() ?? "");
            setNeedsDeliveryDetails(true);
            throw new Error("ORDER_DELIVERY_DETAILS_REQUIRED");
          }
        } catch (probeError) {
          if (isDeliveryDetailsRequiredError(probeError)) {
            throw probeError;
          }
          // Continue into payment bootstrap; BE will reject if details are still missing.
        }
      }

      return bootstrapPaymentMethod({
        orderId: route.params.orderId,
        paymentId: route.params.paymentId,
        paymentType: route.params.paymentType,
        deliveryDetails,
      });
    },
    [
      currentUser?.fullName,
      currentUser?.phone,
      route.params.orderId,
      route.params.paymentId,
      route.params.paymentType,
      route.params.projectId,
    ],
  );

  const paymentQuery = useQuery({
    queryKey: methodQueryKey,
    queryFn: async () => {
      try {
        const payment = await resolvePayment();
        setNeedsDeliveryDetails(false);
        setError(null);
        return payment;
      } catch (loadError: unknown) {
        if (isDeliveryDetailsRequiredError(loadError)) {
          setNeedsDeliveryDetails(true);
          setError(null);
          return null;
        }
        setError(getErrorMessage(loadError, "Unable to load payment."));
        throw loadError;
      }
    },
    staleTime: 15_000,
  });

  const payment = paymentQuery.data ?? null;
  const isPaid = payment?.status === "PAID";
  const isProcessing = payment?.status === "PROCESSING";
  const isPending = payment?.status === "PENDING";
  // PENDING/PROCESSING must stay checkoutable even if BE marks isPayable=false
  // (e.g. expiredAt edge / leftover attempt). Terminal statuses stay locked.
  const canChooseMethod = Boolean(
    payment &&
      (payment.status === "PENDING" ||
        payment.status === "PROCESSING" ||
        (payment.isPayable === true && !isPaymentTerminalStatus(payment.status))),
  );

  const handleRealtimeUpdate = useCallback(
    (payload: PaymentUpdatedRealtimeDto) => {
      queryClient.setQueryData<PaymentDetailDto | null>(methodQueryKey, (current) =>
        current ? { ...current, status: payload.status, paidAt: payload.paidAt } : current,
      );
      queryClient.setQueryData<PaymentDetailDto>(
        ["payment", "detail", payload.paymentId],
        (current) => (current ? { ...current, status: payload.status, paidAt: payload.paidAt } : current),
      );
      void queryClient.invalidateQueries({ queryKey: ["payment", "list"] });
    },
    [methodQueryKey, queryClient],
  );

  usePaymentRealtime({
    paymentId: payment?.paymentId ?? null,
    enabled: Boolean(payment),
    onUpdated: handleRealtimeUpdate,
  });

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void paymentQuery.refetch();
      }
    });
    return () => subscription.remove();
  }, [paymentQuery.refetch]);

  const sharedParams = {
    orderId: route.params.orderId,
    paymentId: payment?.paymentId ?? route.params.paymentId,
    projectId: route.params.projectId,
    paymentType: route.params.paymentType,
  };

  const handleBackToTracking = () => {
    if (route.params.projectId) {
      navigation.navigate("Tracking", { projectId: route.params.projectId });
      return;
    }
    navigation.navigate("Tracking");
  };

  const handleSaveDeliveryDetails = async () => {
    const payload = {
      deliveryAddress: deliveryAddress.trim(),
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      deliveryNote: deliveryNote.trim() || null,
    };

    if (!payload.deliveryAddress || !payload.receiverName || !payload.receiverPhone) {
      setError("Please fill delivery address, receiver name, and phone.");
      return;
    }

    setIsSavingDelivery(true);
    setError(null);
    try {
      const result = await resolvePayment(payload);
      setNeedsDeliveryDetails(false);
      queryClient.setQueryData(methodQueryKey, result);
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, "Unable to save delivery details."));
    } finally {
      setIsSavingDelivery(false);
    }
  };

  const isLoading = paymentQuery.isPending && !payment && !needsDeliveryDetails;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroDecorLarge} />
          <View style={styles.heroDecorSmall} />
          <View style={styles.heroTopRow}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <AppIcon definition={arrowLeftIconDefinition} size={18} color="#FFFFFF" strokeWidth={1.8} />
            </Pressable>
          </View>
          <View style={styles.heroContent}>
            <View style={styles.heroLogoFrame}>
              <Image source={brandLogo} style={styles.heroLogo} resizeMode="cover" />
            </View>
            <Text style={styles.heroTagline}>SECURE PAYMENT · FURNISPACE</Text>
          </View>
          <View style={styles.heroCurve} />
        </View>

        <View style={styles.content}>
          <Text style={styles.pageTitle}>
            {needsDeliveryDetails ? "Delivery details" : isPaid ? "Payment completed" : "Choose payment"}
          </Text>
          <Text style={styles.pageSubtitle}>
            {needsDeliveryDetails
              ? "Confirm where and to whom we should deliver before opening deposit payment."
              : isPaid
                ? "This payment has already been confirmed."
                : "Select how you want to pay"}
          </Text>

          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={paymentBrandColors.gold} />
              <Text style={styles.stateText}>Loading payment details...</Text>
            </View>
          ) : needsDeliveryDetails ? (
            <View style={styles.deliveryCard}>
              <View style={styles.deliveryCardAccent} />
              <View style={styles.deliveryCardBody}>
                <View style={styles.deliveryHeaderRow}>
                  <View style={styles.deliveryIconBadge}>
                    <AppIcon definition={truckIconDefinition} size={16} color="#B89558" strokeWidth={1.8} />
                  </View>
                  <View style={styles.deliveryHeaderCopy}>
                    <Text style={styles.deliveryEyebrow}>BEFORE DEPOSIT</Text>
                    <Text style={styles.deliveryHeaderTitle}>Where should we deliver?</Text>
                  </View>
                </View>

                <View style={styles.deliveryFieldBlock}>
                  <View style={styles.deliveryLabelRow}>
                    <AppIcon definition={mapPinIconDefinition} size={12} color="#9B8F86" strokeWidth={1.8} />
                    <Text style={styles.deliveryFieldLabel}>Delivery address</Text>
                  </View>
                  <TextInput
                    style={[styles.deliveryInput, styles.deliveryInputMultiline]}
                    value={deliveryAddress}
                    onChangeText={setDeliveryAddress}
                    placeholder="Street, district, city"
                    placeholderTextColor="#A89F97"
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.deliverySplitRow}>
                  <View style={[styles.deliveryFieldBlock, styles.deliveryFieldHalf]}>
                    <View style={styles.deliveryLabelRow}>
                      <AppIcon definition={userIconDefinition} size={12} color="#9B8F86" strokeWidth={1.8} />
                      <Text style={styles.deliveryFieldLabel}>Receiver</Text>
                    </View>
                    <TextInput
                      style={styles.deliveryInput}
                      value={receiverName}
                      onChangeText={setReceiverName}
                      placeholder="Full name"
                      placeholderTextColor="#A89F97"
                    />
                  </View>
                  <View style={[styles.deliveryFieldBlock, styles.deliveryFieldHalf]}>
                    <View style={styles.deliveryLabelRow}>
                      <AppIcon definition={phoneIconDefinition} size={12} color="#9B8F86" strokeWidth={1.8} />
                      <Text style={styles.deliveryFieldLabel}>Phone</Text>
                    </View>
                    <TextInput
                      style={styles.deliveryInput}
                      value={receiverPhone}
                      onChangeText={setReceiverPhone}
                      placeholder="Phone number"
                      placeholderTextColor="#A89F97"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.deliveryFieldBlock}>
                  <View style={styles.deliveryLabelRow}>
                    <Text style={styles.deliveryFieldLabel}>Delivery note</Text>
                    <View style={styles.optionalPill}>
                      <Text style={styles.optionalPillText}>Optional</Text>
                    </View>
                  </View>
                  <TextInput
                    style={[styles.deliveryInput, styles.deliveryInputNote]}
                    value={deliveryNote}
                    onChangeText={setDeliveryNote}
                    placeholder="e.g. Call before arrival"
                    placeholderTextColor="#A89F97"
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                {error ? <Text style={styles.formErrorText}>{error}</Text> : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.deliveryContinueButton,
                    isSavingDelivery && styles.primaryActionButtonDisabled,
                    pressed && !isSavingDelivery ? styles.deliveryContinueButtonPressed : null,
                  ]}
                  disabled={isSavingDelivery}
                  onPress={() => void handleSaveDeliveryDetails()}
                >
                  {isSavingDelivery ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View style={styles.deliveryContinueContent}>
                      <Text style={styles.deliveryContinueText}>Continue to payment</Text>
                      <View style={styles.deliveryContinueIcon}>
                        <AppIcon definition={chevronRightIconDefinition} size={14} color="#3A3330" strokeWidth={2.2} />
                      </View>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>
          ) : paymentQuery.isError && !payment ? (
            <View style={styles.centerState}>
              <Text style={styles.stateText}>
                {error ?? getErrorMessage(paymentQuery.error, "Unable to load payment.")}
              </Text>
              <Pressable style={styles.retryButton} onPress={() => void paymentQuery.refetch()}>
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : payment ? (
            <>
              <View style={styles.summaryCard}>
                <View style={styles.summaryTopRow}>
                  <Text style={styles.summaryLabel}>{getPaymentTypeLabel(payment.paymentType)}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      isPaid && styles.statusPillPaid,
                      isProcessing && styles.statusPillProcessing,
                      isPending && styles.statusPillPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isPaid && styles.statusPillTextPaid,
                        isProcessing && styles.statusPillTextProcessing,
                        isPending && styles.statusPillTextPending,
                      ]}
                    >
                      {getPaymentStatusLabel(payment.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.summaryAmount}>{formatVndAmount(payment.amount, payment.currency)}</Text>
                <Text style={styles.summaryMeta}>Reference · {payment.paymentCode}</Text>
              </View>

              {isPaid ? (
                <>
                  <View style={styles.successCard}>
                    <AppIcon definition={checkIconDefinition} size={28} color="#15803D" strokeWidth={2} />
                    <Text style={styles.successTitle}>Payment successful</Text>
                    <Text style={styles.successText}>
                      This order has already been paid. No further action is required.
                    </Text>
                  </View>
                  <Pressable style={styles.primaryActionButton} onPress={handleBackToTracking}>
                    <Text style={styles.primaryActionButtonText}>Back to tracking</Text>
                  </Pressable>
                </>
              ) : !canChooseMethod ? (
                <>
                  <View style={styles.noticeCard}>
                    <Text style={styles.noticeTitle}>
                      {payment.status === "EXPIRED"
                        ? "Payment expired"
                        : payment.status === "CANCELLED"
                          ? "Payment cancelled"
                          : "Payment unavailable"}
                    </Text>
                    <Text style={styles.terminalText}>
                      {payment.status === "EXPIRED"
                        ? "This invoice has expired. Ask sales to reissue payment, then try again."
                        : payment.status === "CANCELLED"
                          ? "This payment was cancelled. Return to tracking for the latest invoice."
                          : `This payment is ${getPaymentStatusLabel(payment.status).toLowerCase()}. Return to tracking to continue.`}
                    </Text>
                  </View>
                  <Pressable style={styles.primaryActionButton} onPress={handleBackToTracking}>
                    <Text style={styles.primaryActionButtonText}>Back to tracking</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <View style={styles.sectionHeader}>
                    <View>
                      <Text style={styles.sectionEyebrow}>PAY SECURELY</Text>
                      <Text style={styles.sectionTitle}>Choose a method</Text>
                    </View>
                    {paymentQuery.isFetching ? (
                      <ActivityIndicator color={paymentBrandColors.gold} size="small" />
                    ) : null}
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.methodCard,
                      styles.methodCardSePay,
                      pressed && styles.methodCardPressed,
                    ]}
                    onPress={() => navigation.navigate("SePayPayment", sharedParams)}
                  >
                    <View style={styles.methodCardTop}>
                      <View style={styles.methodLogoWrap}>
                        <Image source={sepayLogo} style={styles.methodLogo} resizeMode="cover" />
                      </View>
                      <View style={styles.methodTextWrap}>
                        <Text style={styles.methodTitle}>SePay · Bank transfer</Text>
                        <Text style={styles.methodDescription}>
                          Scan VietQR or copy account details to transfer manually.
                        </Text>
                      </View>
                      <AppIcon
                        definition={chevronRightIconDefinition}
                        size={16}
                        color={paymentBrandColors.sepay}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={[styles.methodFooter, styles.methodFooterSePay]}>
                      <Text style={styles.methodFooterTextSePay}>Manual transfer</Text>
                      <View style={[styles.methodBadge, styles.methodBadgeSePay]}>
                        <Text style={styles.methodBadgeTextSePay}>QR Code</Text>
                      </View>
                    </View>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.methodCard,
                      styles.methodCardPayOs,
                      pressed && styles.methodCardPressed,
                    ]}
                    onPress={() => navigation.navigate("PayOSPayment", sharedParams)}
                  >
                    <View style={styles.methodCardTop}>
                      <View style={styles.methodLogoWrap}>
                        <Image source={payosLogo} style={styles.methodLogo} resizeMode="cover" />
                      </View>
                      <View style={styles.methodTextWrap}>
                        <Text style={styles.methodTitle}>PayOS · Online checkout</Text>
                        <Text style={styles.methodDescription}>
                          Open PayOS checkout to pay with bank, e-wallet, or card.
                        </Text>
                      </View>
                      <AppIcon
                        definition={chevronRightIconDefinition}
                        size={16}
                        color={paymentBrandColors.payos}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={[styles.methodFooter, styles.methodFooterPayOs]}>
                      <Text style={styles.methodFooterTextPayOs}>Fast checkout</Text>
                      <View style={[styles.methodBadge, styles.methodBadgePayOs]}>
                        <Text style={styles.methodBadgeTextPayOs}>Payment link</Text>
                      </View>
                    </View>
                  </Pressable>
                </>
              )}
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
