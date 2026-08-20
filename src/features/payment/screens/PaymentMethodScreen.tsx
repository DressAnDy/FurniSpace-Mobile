import React, { useEffect, useState } from "react";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { paymentIconDefinition, walletIconDefinition } from "../../../icons/commerce/definitions";
import { arrowLeftIconDefinition, chevronRightIconDefinition } from "../../../icons/navigation/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { bootstrapPaymentMethod } from "../hooks/usePayments";
import { PaymentDetailDto } from "../models/payment.model";
import { formatVndAmount, getPaymentTypeLabel } from "../utils/payment.mapper";
import { styles } from "./PaymentMethodScreen.styles";

type PaymentMethodRoute = RouteProp<RootStackParamList, "PaymentMethod">;

export function PaymentMethodScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<PaymentMethodRoute>();
  const [payment, setPayment] = useState<PaymentDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void bootstrapPaymentMethod({
      orderId: route.params.orderId,
      paymentId: route.params.paymentId,
    })
      .then((result) => {
        if (active) {
          setPayment(result);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(getErrorMessage(loadError, "Unable to load payment."));
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [route.params.orderId, route.params.paymentId]);

  const sharedParams = {
    orderId: route.params.orderId,
    paymentId: payment?.paymentId ?? route.params.paymentId,
    projectId: route.params.projectId,
    paymentType: route.params.paymentType,
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
              <Text style={styles.headerTitle}>Choose payment</Text>
              <Text style={styles.headerSubtitle}>Select how you want to pay</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color="#C9A86A" />
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
              </View>

              <Text style={styles.sectionTitle}>Payment method</Text>

              <Pressable
                style={({ pressed }) => [styles.methodCard, pressed && styles.methodCardPressed]}
                onPress={() => navigation.navigate("SePayPayment", sharedParams)}
              >
                <View style={styles.methodCardTop}>
                  <View style={[styles.methodIconWrap, styles.methodIconSePay]}>
                    <AppIcon definition={walletIconDefinition} size={22} color="#A8843E" strokeWidth={1.8} />
                  </View>
                  <View style={styles.methodTextWrap}>
                    <Text style={styles.methodTitle}>SePay · Bank transfer</Text>
                    <Text style={styles.methodDescription}>
                      Scan VietQR or copy account details to transfer manually.
                    </Text>
                  </View>
                  <AppIcon definition={chevronRightIconDefinition} size={16} color="#7A6F68" strokeWidth={2} />
                </View>
                <View style={styles.methodFooter}>
                  <Text style={styles.methodFooterText}>Manual transfer</Text>
                  <View style={styles.methodBadge}>
                    <Text style={styles.methodBadgeText}>QR Code</Text>
                  </View>
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.methodCard, pressed && styles.methodCardPressed]}
                onPress={() => navigation.navigate("PayOSPayment", sharedParams)}
              >
                <View style={styles.methodCardTop}>
                  <View style={[styles.methodIconWrap, styles.methodIconPayOs]}>
                    <AppIcon definition={paymentIconDefinition} size={22} color="#2563EB" strokeWidth={1.8} />
                  </View>
                  <View style={styles.methodTextWrap}>
                    <Text style={styles.methodTitle}>PayOS · Online checkout</Text>
                    <Text style={styles.methodDescription}>
                      Open PayOS checkout to pay with bank, e-wallet, or card.
                    </Text>
                  </View>
                  <AppIcon definition={chevronRightIconDefinition} size={16} color="#7A6F68" strokeWidth={2} />
                </View>
                <View style={styles.methodFooter}>
                  <Text style={[styles.methodFooterText, { color: "#2563EB" }]}>Fast checkout</Text>
                  <View style={styles.methodBadge}>
                    <Text style={styles.methodBadgeText}>Payment link</Text>
                  </View>
                </View>
              </Pressable>
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
