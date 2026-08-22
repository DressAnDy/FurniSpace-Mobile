import React, { useMemo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { arrowLeftIconDefinition } from "../../../icons/navigation/definitions";
import { formatVndAmount } from "../../payment/utils/payment.mapper";
import {
  canCustomerPayDeposit,
  canCustomerPayRemaining,
  findPendingPayment,
  hasPaidPayment,
} from "../../payment/utils/payment.helpers";
import { usePaymentsQuery } from "../../payment/hooks/usePayments";
import {
  useConfirmOrderDeliveryMutation,
  useProjectTrackingQueries,
} from "../hooks/useProjectTracking";
import { useOrderDetailQuery } from "../hooks/useCustomerFlow";
import { customerFlowStyles as styles } from "./CustomerFlowScreen.styles";

type Route = RouteProp<RootStackParamList, "OrderDetail">;

export function OrderDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { orderId, projectId, projectName } = route.params;

  const orderQuery = useOrderDetailQuery(orderId);
  const paymentsQuery = usePaymentsQuery({ orderId, limit: 20 });
  const { data: trackingData } = useProjectTrackingQueries(projectId);
  const confirmDeliveryMutation = useConfirmOrderDeliveryMutation(projectId);

  const order = orderQuery.data;
  const payments = paymentsQuery.data?.items ?? [];
  const pendingDepositPayment = useMemo(() => findPendingPayment(payments, "DEPOSIT"), [payments]);
  const pendingRemainingPayment = useMemo(() => findPendingPayment(payments, "REMAINING_PAYMENT"), [payments]);
  const paidDeposit = useMemo(() => hasPaidPayment(payments, "DEPOSIT"), [payments]);
  const paidRemaining = useMemo(() => hasPaidPayment(payments, "REMAINING_PAYMENT"), [payments]);

  const canPayDeposit = canCustomerPayDeposit(payments, order?.status, trackingData?.project?.status);
  const canPayRemaining = canCustomerPayRemaining(payments, order?.status, trackingData?.project?.status);
  const canConfirmDelivery = trackingData?.project?.status === "DELIVERING";

  const orderStatusNote = useMemo(() => {
    if (paidRemaining) {
      return "Remaining balance has been paid. Thank you.";
    }

    if (paidDeposit && !canPayDeposit) {
      return "Deposit has been paid. Production is in progress.";
    }

    return null;
  }, [canPayDeposit, paidDeposit, paidRemaining]);

  const handlePayDeposit = () => {
    navigation.navigate("PaymentMethod", {
      orderId,
      projectId,
      paymentId: pendingDepositPayment?.paymentId,
      paymentType: "DEPOSIT",
    });
  };

  const handlePayRemaining = () => {
    navigation.navigate("PaymentMethod", {
      orderId,
      projectId,
      paymentId: pendingRemainingPayment?.paymentId,
      paymentType: "REMAINING_PAYMENT",
    });
  };

  const handleConfirmDelivery = () => {
    Alert.alert("Confirm Delivery", "Have you received all items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () => {
          confirmDeliveryMutation.mutate(orderId, {
            onSuccess: () => Alert.alert("Delivery Confirmed", "Thank you for confirming receipt."),
            onError: () => Alert.alert("Error", "Unable to confirm delivery. Please try again."),
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <AppIcon definition={arrowLeftIconDefinition} size={18} color="#FFFFFF" strokeWidth={1.8} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandText}>FURNISPACE</Text>
              <Text style={styles.headerTitle}>{order?.orderCode ?? "Order"}</Text>
            </View>
          </View>
          {projectName ? <Text style={styles.headerSubtitle}>{projectName}</Text> : null}
        </View>

        <View style={styles.content}>
          {orderQuery.isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#C9A86A" />
              <Text style={styles.loadingText}>Loading order...</Text>
            </View>
          ) : !order ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>Unable to load order details.</Text>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>ORDER SUMMARY</Text>
                <Text style={styles.noteText}>Status: {order.status.replaceAll("_", " ")}</Text>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatVndAmount(order.finalTotalAmount)}</Text>
                </View>
                <View style={styles.itemRow}>
                  <Text style={styles.itemName}>Deposit</Text>
                  <Text style={styles.itemAmount}>{formatVndAmount(order.depositAmount)}</Text>
                </View>
                <View style={styles.itemRow}>
                  <Text style={styles.itemName}>Paid</Text>
                  <Text style={styles.itemAmount}>{formatVndAmount(order.paidAmount)}</Text>
                </View>
                <View style={styles.itemRow}>
                  <Text style={styles.itemName}>Remaining</Text>
                  <Text style={styles.itemAmount}>{formatVndAmount(order.remainingAmount)}</Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardLabel}>ITEMS ({order.items.length})</Text>
                {order.items.map((item) => (
                  <View key={item.orderItemId} style={styles.itemRow}>
                    <Text style={styles.itemName}>
                      {item.itemName} × {item.quantity}
                      {item.isCustomized ? " (custom)" : ""}
                    </Text>
                    <Text style={styles.itemAmount}>{formatVndAmount(item.subtotalAmount)}</Text>
                  </View>
                ))}
              </View>

              {canPayDeposit ? (
                <Pressable style={styles.primaryButton} onPress={handlePayDeposit}>
                  <Text style={styles.primaryButtonText}>
                    Pay Deposit{pendingDepositPayment ? "" : " (30%)"}
                  </Text>
                </Pressable>
              ) : null}

              {canConfirmDelivery ? (
                <Pressable
                  style={[styles.primaryButton, confirmDeliveryMutation.isPending && styles.buttonDisabled]}
                  disabled={confirmDeliveryMutation.isPending}
                  onPress={handleConfirmDelivery}
                >
                  <Text style={styles.primaryButtonText}>Confirm Delivery</Text>
                </Pressable>
              ) : null}

              {canPayRemaining ? (
                <Pressable style={styles.primaryButton} onPress={handlePayRemaining}>
                  <Text style={styles.primaryButtonText}>Pay Remaining Balance</Text>
                </Pressable>
              ) : null}

              {orderStatusNote ? (
                <View style={styles.card}>
                  <Text style={styles.noteText}>{orderStatusNote}</Text>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
