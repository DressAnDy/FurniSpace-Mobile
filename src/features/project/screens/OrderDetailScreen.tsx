import React, { useMemo, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
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
} from "../hooks/useProjectTracking";
import { useOrderDetailQuery } from "../hooks/useCustomerFlow";
import { useProjectDetailQuery } from "../hooks/useProjects";
import { orderDetailStyles as styles } from "./OrderDetailScreen.styles";

type Route = RouteProp<RootStackParamList, "OrderDetail">;

export function OrderDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { orderId, projectId, projectName } = route.params;

  const orderQuery = useOrderDetailQuery(orderId);
  const paymentsQuery = usePaymentsQuery({ orderId, limit: 20 });
  const projectQuery = useProjectDetailQuery(projectId);
  const confirmDeliveryMutation = useConfirmOrderDeliveryMutation(projectId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const order = orderQuery.data;
  const payments = paymentsQuery.data?.items ?? [];
  const pendingDepositPayment = useMemo(() => findPendingPayment(payments, "DEPOSIT"), [payments]);
  const pendingRemainingPayment = useMemo(() => findPendingPayment(payments, "REMAINING_PAYMENT"), [payments]);
  const paidDeposit = useMemo(() => hasPaidPayment(payments, "DEPOSIT"), [payments]);
  const paidRemaining = useMemo(() => hasPaidPayment(payments, "REMAINING_PAYMENT"), [payments]);

  const canPayDeposit = canCustomerPayDeposit(payments, order?.status, projectQuery.data?.status);
  const canPayRemaining = canCustomerPayRemaining(payments, order?.status, projectQuery.data?.status);
  const canConfirmDelivery = projectQuery.data?.status === "DELIVERING";
  const actionsReady = !paymentsQuery.isPending && !projectQuery.isPending;

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([orderQuery.refetch(), paymentsQuery.refetch(), projectQuery.refetch()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void handleRefresh()} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroDecor} />
          <View style={styles.heroRow}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <AppIcon definition={arrowLeftIconDefinition} size={18} color="#FFFFFF" strokeWidth={1.8} />
            </Pressable>
            <View style={styles.heroText}>
              <Text style={styles.brand}>FURNISPACE</Text>
              <Text style={styles.title}>{order?.orderCode ?? "Order details"}</Text>
            </View>
          </View>
          {projectName ? <Text style={styles.projectName}>{projectName}</Text> : null}
        </View>

        <View style={styles.content}>
          {orderQuery.isPending && !order ? (
            <View style={styles.state}>
              <ActivityIndicator size="large" color="#C9A86A" />
              <Text style={styles.stateText}>Loading order details...</Text>
            </View>
          ) : orderQuery.isError || !order ? (
            <View style={styles.state}>
              <Text style={styles.stateText}>Unable to load order details.</Text>
              <Pressable style={styles.retryButton} onPress={() => void orderQuery.refetch()}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardLabel}>ORDER SUMMARY</Text>
                  <View style={[styles.statusPill, order.status === "COMPLETED" && styles.statusComplete]}>
                    <Text style={[styles.statusText, order.status === "COMPLETED" && styles.statusCompleteText]}>
                      {order.status.replaceAll("_", " ")}
                    </Text>
                  </View>
                </View>
                <View style={styles.totalBlock}>
                  <Text style={styles.totalLabel}>TOTAL ORDER VALUE</Text>
                  <Text style={styles.totalValue}>{formatVndAmount(order.finalTotalAmount)}</Text>
                </View>
                <View style={styles.moneyRow}>
                  <Text style={styles.moneyLabel}>Deposit</Text>
                  <Text style={styles.moneyValue}>{formatVndAmount(order.depositAmount)}</Text>
                </View>
                <View style={styles.moneyRow}>
                  <Text style={styles.moneyLabel}>Paid</Text>
                  <Text style={styles.moneyValue}>{formatVndAmount(order.paidAmount)}</Text>
                </View>
                <View style={[styles.moneyRow, styles.moneyRowLast]}>
                  <Text style={styles.moneyLabel}>Remaining</Text>
                  <Text style={styles.moneyValue}>{formatVndAmount(order.remainingAmount)}</Text>
                </View>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardLabel}>ORDER ITEMS</Text>
                  <Text style={styles.statusText}>{order.items.length} items</Text>
                </View>
                {order.items.map((item, index) => (
                  <View
                    key={item.orderItemId}
                    style={[styles.itemRow, index === order.items.length - 1 && styles.itemRowLast]}
                  >
                    <View style={styles.itemIndex}>
                      <Text style={styles.itemIndexText}>{String(index + 1).padStart(2, "0")}</Text>
                    </View>
                    <View style={styles.itemMain}>
                      <Text style={styles.itemName}>{item.itemName}</Text>
                      <Text style={styles.itemMeta}>
                        Qty {item.quantity}{item.isCustomized ? " · Customized" : ""}
                      </Text>
                    </View>
                    <Text style={styles.itemAmount}>{formatVndAmount(item.subtotalAmount)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.actionCard}>
                <Text style={styles.actionTitle}>Next action</Text>
                <Text style={styles.actionSubtitle}>Complete the available step to keep your order moving.</Text>
                {!actionsReady ? (
                  <View style={styles.actionLoading}>
                    <ActivityIndicator color="#C9A86A" size="small" />
                    <Text style={styles.actionLoadingText}>Checking payment status...</Text>
                  </View>
                ) : canPayDeposit ? (
                  <Pressable style={styles.primaryButton} onPress={handlePayDeposit}>
                    <Text style={styles.primaryButtonText}>
                      Pay Deposit{pendingDepositPayment ? "" : " (30%)"}
                    </Text>
                  </Pressable>
                ) : canConfirmDelivery ? (
                  <Pressable
                    style={[styles.primaryButton, confirmDeliveryMutation.isPending && styles.buttonDisabled]}
                    disabled={confirmDeliveryMutation.isPending}
                    onPress={handleConfirmDelivery}
                  >
                    <Text style={styles.primaryButtonText}>Confirm Delivery</Text>
                  </Pressable>
                ) : canPayRemaining ? (
                  <Pressable style={styles.primaryButton} onPress={handlePayRemaining}>
                    <Text style={styles.primaryButtonText}>Pay Remaining Balance</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.actionLoadingText}>No action is required right now.</Text>
                )}
              </View>

              {orderStatusNote ? (
                <View style={styles.noteCard}>
                  <View style={styles.noteDot} />
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
