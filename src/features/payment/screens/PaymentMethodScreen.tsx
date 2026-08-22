import React, { useCallback, useState } from "react";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { arrowLeftIconDefinition, chevronRightIconDefinition } from "../../../icons/navigation/definitions";
import { checkIconDefinition } from "../../../icons/status/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { bootstrapPaymentMethod } from "../hooks/usePayments";
import { isPaymentTerminalStatus } from "../hooks/usePaymentRealtime";
import { PaymentDetailDto } from "../models/payment.model";
import { formatVndAmount, getPaymentStatusLabel, getPaymentTypeLabel } from "../utils/payment.mapper";
import { paymentBrandColors, styles } from "./PaymentMethodScreen.styles";

const brandLogo = require("../../../../assets/brand/furnispace-logo.png");
const sepayLogo = require("../../../../assets/brand/sepay-logo.png");
const payosLogo = require("../../../../assets/brand/payos-logo.png");

type PaymentMethodRoute = RouteProp<RootStackParamList, "PaymentMethod">;

export function PaymentMethodScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<PaymentMethodRoute>();
  const [payment, setPayment] = useState<PaymentDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayment = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await bootstrapPaymentMethod({
        orderId: route.params.orderId,
        paymentId: route.params.paymentId,
        paymentType: route.params.paymentType,
      });
      setPayment(result);
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError, "Unable to load payment."));
    } finally {
      setIsLoading(false);
    }
  }, [route.params.orderId, route.params.paymentId, route.params.paymentType]);

  useFocusEffect(
    useCallback(() => {
      void loadPayment();
    }, [loadPayment]),
  );

  const sharedParams = {
    orderId: route.params.orderId,
    paymentId: payment?.paymentId ?? route.params.paymentId,
    projectId: route.params.projectId,
    paymentType: route.params.paymentType,
  };

  const isPaid = payment?.status === "PAID";
  const canChooseMethod = Boolean(payment && !isPaymentTerminalStatus(payment.status) && payment.isPayable !== false);

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

          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={paymentBrandColors.gold} />
              <Text style={styles.stateText}>Loading payment details...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerState}>
              <Text style={styles.stateText}>{error}</Text>
            </View>
          ) : payment ? (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{getPaymentTypeLabel(payment.paymentType)}</Text>
                <Text style={styles.summaryAmount}>{formatVndAmount(payment.amount, payment.currency)}</Text>
                <Text style={styles.summaryMeta}>Reference: {payment.paymentCode}</Text>
                <View style={[styles.statusPill, isPaid && styles.statusPillPaid]}>
                  <Text style={[styles.statusPillText, isPaid && styles.statusPillTextPaid]}>
                    {getPaymentStatusLabel(payment.status)}
                  </Text>
                </View>
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
                  <Text style={styles.terminalText}>
                    This payment is {getPaymentStatusLabel(payment.status).toLowerCase()} and cannot be processed
                    again.
                  </Text>
                  <Pressable style={styles.primaryActionButton} onPress={handleBackToTracking}>
                    <Text style={styles.primaryActionButtonText}>Back to tracking</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>Payment method</Text>

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
