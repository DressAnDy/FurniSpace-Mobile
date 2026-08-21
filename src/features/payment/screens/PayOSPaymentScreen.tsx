import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as WebBrowser from "expo-web-browser";
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { checkIconDefinition } from "../../../icons/status/definitions";
import { arrowLeftIconDefinition } from "../../../icons/navigation/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { PaymentQrCode } from "../../../shared/components/PaymentQrCode";
import { usePaymentRealtime } from "../hooks/usePaymentRealtime";
import { bootstrapPayOsCheckout } from "../hooks/usePayments";
import {
  PayOsCheckoutState,
  PaymentUpdatedRealtimeDto,
} from "../models/payment.model";
import { getPaymentStatusByCodeApi } from "../services/payment.api";
import {
  formatVndAmount,
  getPaymentStatusLabel,
  getPaymentTypeLabel,
} from "../utils/payment.mapper";
import { styles } from "./PayOSPaymentScreen.styles";

type PayOSPaymentRoute = RouteProp<RootStackParamList, "PayOSPayment">;

export function PayOSPaymentScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<PayOSPaymentRoute>();
  const [checkout, setCheckout] = useState<PayOsCheckoutState | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [isWaitingConfirmation, setIsWaitingConfirmation] = useState(false);
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);
  const checkoutOpenedRef = useRef(false);

  const payment = checkout?.payment ?? null;
  const checkoutUrl = checkout?.checkoutUrl ?? null;
  const qrContent = checkout?.qrContent ?? null;
  const isPaid = payment?.status === "PAID";
  const shouldPoll = Boolean(payment && !isPaid && isWaitingConfirmation);

  const loadCheckout = useCallback(async () => {
    setIsBootstrapping(true);
    setBootstrapError(null);

    try {
      const result = await bootstrapPayOsCheckout({
        orderId: route.params.orderId,
        paymentId: route.params.paymentId,
      });

      setCheckout(result);
      setIsWaitingConfirmation(result.payment.status === "PROCESSING");
    } catch (error) {
      setBootstrapError(getErrorMessage(error, "Unable to prepare PayOS payment."));
    } finally {
      setIsBootstrapping(false);
    }
  }, [route.params.orderId, route.params.paymentId]);

  useEffect(() => {
    void loadCheckout();
  }, [loadCheckout]);

  const refreshPaymentStatus = useCallback(async () => {
    if (!payment?.paymentCode) {
      return;
    }

    try {
      const status = await getPaymentStatusByCodeApi(payment.paymentCode);
      if (status.status === "PAID") {
        setCheckout((current) =>
          current
            ? {
                ...current,
                payment: {
                  ...current.payment,
                  status: status.status,
                  paidAt: status.paidAt,
                },
              }
            : current,
        );
        setIsWaitingConfirmation(false);
      }
    } catch {
      // Ignore polling errors; SignalR remains primary.
    }
  }, [payment?.paymentCode]);

  const handlePaymentUpdated = useCallback((payload: PaymentUpdatedRealtimeDto) => {
    setCheckout((current) => {
      if (!current || current.payment.paymentId !== payload.paymentId) {
        return current;
      }

      return {
        ...current,
        payment: {
          ...current.payment,
          status: payload.status,
          paidAt: payload.paidAt,
        },
      };
    });

    if (payload.status === "PAID") {
      setIsWaitingConfirmation(false);
    }
  }, []);

  usePaymentRealtime({
    paymentId: payment?.paymentId ?? null,
    enabled: Boolean(payment && !isPaid),
    onUpdated: handlePaymentUpdated,
  });

  useEffect(() => {
    if (!shouldPoll || !payment?.paymentCode) {
      return;
    }

    void refreshPaymentStatus();
    const intervalId = setInterval(() => {
      void refreshPaymentStatus();
    }, 4000);

    return () => {
      clearInterval(intervalId);
    };
  }, [payment?.paymentCode, refreshPaymentStatus, shouldPoll]);

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active" && isWaitingConfirmation) {
        void refreshPaymentStatus();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    return () => {
      subscription.remove();
    };
  }, [isWaitingConfirmation, refreshPaymentStatus]);

  const statusLabel = useMemo(() => {
    if (!payment) {
      return "";
    }

    return getPaymentStatusLabel(payment.status);
  }, [payment]);

  const openCheckout = async () => {
    if (!checkoutUrl) {
      Alert.alert("Checkout unavailable", "Please refresh and try again.");
      return;
    }

    setIsOpeningCheckout(true);
    checkoutOpenedRef.current = true;

    try {
      await WebBrowser.openBrowserAsync(checkoutUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        showTitle: true,
        enableBarCollapsing: true,
      });
      setIsWaitingConfirmation(true);
      void refreshPaymentStatus();
    } catch (error) {
      Alert.alert("Unable to open checkout", getErrorMessage(error, "Please try again."));
    } finally {
      setIsOpeningCheckout(false);
    }
  };

  const handleConfirmCompleted = () => {
    setIsWaitingConfirmation(true);
    void refreshPaymentStatus();
    Alert.alert(
      "Checking payment",
      "We are verifying your PayOS payment. This may take a few seconds after checkout.",
    );
  };

  const handleDone = () => {
    if (route.params.projectId) {
      navigation.navigate("Tracking", { projectId: route.params.projectId });
      return;
    }

    navigation.navigate("Tracking");
  };

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
              <Text style={styles.headerTitle}>PayOS Payment</Text>
              <Text style={styles.headerSubtitle}>Secure online checkout</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {isBootstrapping ? (
            <View style={styles.centerState}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.stateText}>Preparing PayOS checkout...</Text>
            </View>
          ) : bootstrapError ? (
            <View style={styles.centerState}>
              <Text style={styles.stateText}>{bootstrapError}</Text>
              <Pressable style={styles.retryButton} onPress={() => void loadCheckout()}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : payment ? (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{getPaymentTypeLabel(payment.paymentType)}</Text>
                <Text style={styles.summaryAmount}>{formatVndAmount(payment.amount, payment.currency)}</Text>
                <Text style={styles.summaryMeta}>Reference: {payment.paymentCode}</Text>
                <View
                  style={[
                    styles.statusPill,
                    payment.status === "PROCESSING" && styles.statusPillProcessing,
                    payment.status === "PAID" && styles.statusPillPaid,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      payment.status === "PROCESSING" && styles.statusPillTextProcessing,
                      payment.status === "PAID" && styles.statusPillTextPaid,
                    ]}
                  >
                    {statusLabel}
                  </Text>
                </View>
              </View>

              {isPaid ? (
                <View style={styles.successCard}>
                  <AppIcon definition={checkIconDefinition} size={28} color="#15803D" strokeWidth={2} />
                  <Text style={styles.successTitle}>Payment successful</Text>
                  <Text style={styles.successText}>
                    PayOS confirmed your payment. The order will update automatically.
                  </Text>
                </View>
              ) : (
                <>
                  {qrContent ? (
                    <View style={styles.qrCard}>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>Scan QR · PayOS</Text>
                      </View>
                      <Text style={styles.qrTitle}>Scan to pay with banking app</Text>
                      <PaymentQrCode
                        caption="Open your banking app and scan this PayOS QR code. You can also use the checkout link below."
                        value={qrContent}
                      />
                    </View>
                  ) : null}

                  <View style={styles.checkoutCard}>
                    <Text style={styles.checkoutTitle}>Or pay via PayOS checkout</Text>
                    <Text style={styles.checkoutText}>
                      Open PayOS in browser to choose bank transfer, e-wallet, or card. Returning to the app does not
                      always mean payment is complete — wait for confirmation below.
                    </Text>
                  </View>

                  <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Provider</Text>
                      <Text style={styles.infoValue}>PayOS</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Method</Text>
                      <Text style={styles.infoValue}>QR Code</Text>
                    </View>
                    {checkout?.attempt?.transactionCode ? (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Transaction</Text>
                        <Text style={styles.infoValue}>{checkout.attempt.transactionCode}</Text>
                      </View>
                    ) : null}

                    {isWaitingConfirmation ? (
                      <View style={styles.waitingRow}>
                        <ActivityIndicator color="#2563EB" size="small" />
                        <Text style={styles.waitingText}>Waiting for PayOS confirmation...</Text>
                      </View>
                    ) : null}
                  </View>
                </>
              )}

              <View style={styles.footerActions}>
                {isPaid ? (
                  <Pressable style={styles.primaryButton} onPress={handleDone}>
                    <Text style={styles.primaryButtonText}>Back to tracking</Text>
                  </Pressable>
                ) : (
                  <>
                    <Pressable
                      disabled={!checkoutUrl || isOpeningCheckout}
                      style={[styles.primaryButton, (!checkoutUrl || isOpeningCheckout) && { opacity: 0.6 }]}
                      onPress={() => void openCheckout()}
                    >
                      {isOpeningCheckout ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          {checkoutOpenedRef.current ? "Open PayOS again" : "Open PayOS checkout"}
                        </Text>
                      )}
                    </Pressable>
                    <Pressable style={styles.secondaryButton} onPress={handleConfirmCompleted}>
                      <Text style={styles.secondaryButtonText}>I completed payment</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButton} onPress={() => void loadCheckout()}>
                      <Text style={styles.secondaryButtonText}>Refresh checkout link</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
