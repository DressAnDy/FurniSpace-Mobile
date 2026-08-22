import React, { useCallback, useEffect, useMemo } from "react";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ActivityIndicator, AppState, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { arrowLeftIconDefinition, chevronRightIconDefinition } from "../../../icons/navigation/definitions";
import { checkIconDefinition } from "../../../icons/status/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { bootstrapPaymentMethod } from "../hooks/usePayments";
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
  const queryClient = useQueryClient();
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
  const paymentQuery = useQuery({
    queryKey: methodQueryKey,
    queryFn: () =>
      bootstrapPaymentMethod({
        orderId: route.params.orderId,
        paymentId: route.params.paymentId,
        paymentType: route.params.paymentType,
      }),
    staleTime: 15_000,
  });
  const payment = paymentQuery.data ?? null;

  const handleRealtimeUpdate = useCallback(
    (payload: PaymentUpdatedRealtimeDto) => {
      queryClient.setQueryData<PaymentDetailDto>(methodQueryKey, (current) =>
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

  const isPaid = payment?.status === "PAID";
  const canChooseMethod = Boolean(payment && !isPaymentTerminalStatus(payment.status));
  const isProcessing = payment?.status === "PROCESSING";

  const handleBackToTracking = () => {
    if (route.params.projectId) {
      navigation.navigate("Tracking", { projectId: route.params.projectId });
      return;
    }

    navigation.navigate("Tracking");
  };

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
          <Text style={styles.pageTitle}>{isPaid ? "Payment completed" : "Choose payment"}</Text>
          <Text style={styles.pageSubtitle}>
            {isPaid ? "This payment has already been confirmed." : "Select how you want to pay"}
          </Text>

          {paymentQuery.isPending && !payment ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={paymentBrandColors.gold} />
              <Text style={styles.stateText}>Loading payment details...</Text>
            </View>
          ) : paymentQuery.isError && !payment ? (
            <View style={styles.centerState}>
              <Text style={styles.stateText}>
                {getErrorMessage(paymentQuery.error, "Unable to load payment.")}
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
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isPaid && styles.statusPillTextPaid,
                        isProcessing && styles.statusPillTextProcessing,
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
                    <Text style={styles.noticeTitle}>Payment unavailable</Text>
                    <Text style={styles.terminalText}>
                      This payment is {getPaymentStatusLabel(payment.status).toLowerCase()}. Return to tracking
                      to continue.
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
                    {paymentQuery.isFetching ? <ActivityIndicator color={paymentBrandColors.gold} size="small" /> : null}
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
