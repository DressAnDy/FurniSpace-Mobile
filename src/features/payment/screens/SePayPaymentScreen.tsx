import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { checkIconDefinition } from "../../../icons/status/definitions";
import { arrowLeftIconDefinition } from "../../../icons/navigation/definitions";
import { clipboardIconDefinition } from "../../../icons/project/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { copyToClipboard } from "../../../shared/utils/clipboard";
import { usePaymentRealtime } from "../hooks/usePaymentRealtime";
import { bootstrapSePayCheckout } from "../hooks/usePayments";
import {
  PaymentDetailDto,
  PaymentTransactionDto,
  PaymentUpdatedRealtimeDto,
  VietQrTransferDetails,
} from "../models/payment.model";
import { getPaymentStatusByCodeApi } from "../services/payment.api";
import {
  formatVndAmount,
  getPaymentStatusLabel,
  getPaymentTypeLabel,
} from "../utils/payment.mapper";
import { styles } from "./SePayPaymentScreen.styles";

type SePayPaymentRoute = RouteProp<RootStackParamList, "SePayPayment">;

type CheckoutState = {
  payment: PaymentDetailDto;
  transaction: PaymentTransactionDto | null;
  transferDetails: VietQrTransferDetails;
};

export function SePayPaymentScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<SePayPaymentRoute>();
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [isWaitingConfirmation, setIsWaitingConfirmation] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const payment = checkout?.payment ?? null;
  const transaction = checkout?.transaction ?? null;
  const transferDetails = checkout?.transferDetails;
  const isPaid = payment?.status === "PAID";
  const shouldPoll = Boolean(payment && !isPaid && isWaitingConfirmation);

  const transferContent = transferDetails?.transferContent ?? payment?.paymentCode ?? "";
  const accountNo = transferDetails?.accountNo ?? "";

  const loadCheckout = useCallback(async () => {
    setIsBootstrapping(true);
    setBootstrapError(null);

    try {
      const result = await bootstrapSePayCheckout({
        orderId: route.params.orderId,
        paymentId: route.params.paymentId,
      });

      setCheckout(result);
      setIsWaitingConfirmation(result.payment.status === "PROCESSING");
    } catch (error) {
      setBootstrapError(getErrorMessage(error, "Unable to prepare payment."));
    } finally {
      setIsBootstrapping(false);
    }
  }, [route.params.orderId, route.params.paymentId]);

  useEffect(() => {
    void loadCheckout();
  }, [loadCheckout]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" || !payment?.paymentCode || payment.status === "PAID") {
        return;
      }

      void getPaymentStatusByCodeApi(payment.paymentCode).then((status) => {
        if (status.status === "PAID") {
          setCheckout((current) =>
            current
              ? { ...current, payment: { ...current.payment, status: status.status, paidAt: status.paidAt } }
              : current,
          );
          setIsWaitingConfirmation(false);
        }
      }).catch(() => undefined);
    });
    return () => subscription.remove();
  }, [payment?.paymentCode, payment?.status]);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

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

    let active = true;
    const poll = async () => {
      try {
        const status = await getPaymentStatusByCodeApi(payment.paymentCode);
        if (!active) {
          return;
        }

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
    };

    void poll();
    const intervalId = setInterval(() => {
      void poll();
    }, 4000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [payment?.paymentCode, shouldPoll]);

  const statusLabel = useMemo(() => {
    if (!payment) {
      return "";
    }

    return getPaymentStatusLabel(payment.status);
  }, [payment]);

  const markCopied = (fieldKey: string) => {
    setCopiedField(fieldKey);
    if (copiedTimeoutRef.current) {
      clearTimeout(copiedTimeoutRef.current);
    }
    copiedTimeoutRef.current = setTimeout(() => {
      setCopiedField(null);
    }, 1800);
  };

  const handleCopy = async (value: string, fieldKey: string) => {
    try {
      await copyToClipboard(value);
      markCopied(fieldKey);
    } catch (error) {
      Alert.alert("Unable to copy", getErrorMessage(error, "Please copy manually."));
    }
  };

  const handleConfirmTransferred = () => {
    setIsWaitingConfirmation(true);
    Alert.alert(
      "Waiting for confirmation",
      "We are checking your transfer. This usually takes a few seconds after the bank processes it.",
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
              <Text style={styles.headerTitle}>SePay Payment</Text>
              <Text style={styles.headerSubtitle}>Scan QR or transfer manually</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {isBootstrapping ? (
            <View style={styles.centerState}>
              <ActivityIndicator color="#C9A86A" />
              <Text style={styles.stateText}>Preparing VietQR payment...</Text>
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
                    Your transfer has been confirmed. The order will update automatically.
                  </Text>
                </View>
              ) : transaction?.paymentUrl ? (
                <View style={styles.qrCard}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>Step 1 · Scan QR</Text>
                  </View>
                  <Text style={styles.qrTitle}>Scan VietQR to pay</Text>
                  <View style={styles.qrFrame}>
                    <Image source={{ uri: transaction.paymentUrl }} style={styles.qrImage} resizeMode="contain" />
                  </View>
                  <Text style={styles.qrHint}>
                    Open your banking app and scan this code. Confirm the amount and transfer content match the details
                    below.
                  </Text>
                </View>
              ) : null}

              {!isPaid ? (
                <View style={styles.infoCard}>
                  <View style={styles.infoHeader}>
                    <Text style={styles.infoTitle}>Transfer details</Text>
                    <Text style={styles.infoSubtitle}>
                      If you transfer manually, copy the content and account number exactly.
                    </Text>
                  </View>

                  <View style={styles.infoBody}>
                    <CopyableDetailBlock
                      copied={copiedField === "amount"}
                      label="Amount"
                      mono={false}
                      value={formatVndAmount(transferDetails?.amount ?? payment.amount, payment.currency)}
                    />

                    <CopyableDetailBlock
                      copied={copiedField === "content"}
                      highlight
                      label="Transfer content"
                      mono
                      value={transferContent}
                      onCopy={() => void handleCopy(transferContent, "content")}
                    />

                    {transferDetails?.bankCode ? (
                      <CopyableDetailBlock
                        copied={false}
                        label="Bank"
                        mono={false}
                        value={transferDetails.bankCode}
                      />
                    ) : null}

                    {accountNo ? (
                      <CopyableDetailBlock
                        copied={copiedField === "account"}
                        highlight
                        label="Account number"
                        mono
                        value={accountNo}
                        onCopy={() => void handleCopy(accountNo, "account")}
                      />
                    ) : null}

                    {transferDetails?.accountName ? (
                      <CopyableDetailBlock
                        copied={false}
                        label="Account name"
                        mono={false}
                        value={transferDetails.accountName}
                      />
                    ) : null}

                    <View style={styles.quickCopyRow}>
                      <Pressable
                        style={styles.quickCopyChip}
                        onPress={() => void handleCopy(transferContent, "content")}
                      >
                        <Text style={styles.quickCopyChipText}>Copy transfer content</Text>
                      </Pressable>
                      {accountNo ? (
                        <Pressable
                          style={styles.quickCopyChip}
                          onPress={() => void handleCopy(accountNo, "account")}
                        >
                          <Text style={styles.quickCopyChipText}>Copy account number</Text>
                        </Pressable>
                      ) : null}
                    </View>

                    {isWaitingConfirmation ? (
                      <View style={styles.waitingRow}>
                        <ActivityIndicator color="#C9A86A" size="small" />
                        <Text style={styles.waitingText}>Waiting for payment confirmation...</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}

              <View style={styles.footerActions}>
                {isPaid ? (
                  <Pressable style={styles.primaryButton} onPress={handleDone}>
                    <Text style={styles.primaryButtonText}>Back to tracking</Text>
                  </Pressable>
                ) : (
                  <>
                    <Pressable style={styles.primaryButton} onPress={handleConfirmTransferred}>
                      <Text style={styles.primaryButtonText}>I have transferred</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButton} onPress={() => void loadCheckout()}>
                      <Text style={styles.secondaryButtonText}>Refresh QR</Text>
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

function CopyableDetailBlock({
  label,
  value,
  mono,
  highlight,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  mono: boolean;
  highlight?: boolean;
  copied: boolean;
  onCopy?: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      disabled={!onCopy}
      style={[styles.detailBlock, highlight && styles.detailBlockHighlight]}
      onPress={onCopy}
    >
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueRow}>
        <Text style={[styles.detailValue, mono && styles.detailValueMono]} selectable>
          {value}
        </Text>
        {onCopy ? (
          <View style={[styles.copyAction, copied && styles.copyActionActive]}>
            {!copied ? (
              <AppIcon definition={clipboardIconDefinition} size={16} color="#3A3330" strokeWidth={1.8} />
            ) : (
              <AppIcon definition={checkIconDefinition} size={14} color="#15803D" strokeWidth={2} />
            )}
            <Text style={[styles.copyActionText, copied && styles.copyActionTextActive]}>
              {copied ? "Copied" : "Copy"}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
