import React from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { arrowLeftIconDefinition, chevronRightIconDefinition } from "../../../icons/navigation/definitions";
import { formatVndAmount } from "../../payment/utils/payment.mapper";
import { formatTrackingDate } from "../utils/project.tracking.mapper";
import { prefetchOrderDetailQuery, useProjectOrdersQuery } from "../hooks/useCustomerFlow";
import { resolveOrderDisplayTotal } from "../utils/order.mapper";
import { canPayOrderDeposit } from "../utils/project.customer-flow.mapper";
import { OrderStatus } from "../models/order.model";
import { projectOrdersStyles as styles } from "./ProjectOrdersScreen.styles";

type Route = RouteProp<RootStackParamList, "ProjectOrders">;

function formatStatusLabel(status: OrderStatus | string): string {
  return status.replaceAll("_", " ");
}

function formatOrderShortCode(code: string): string {
  const parts = code.split("-");
  if (parts.length >= 3) {
    return `${parts[0]}-...-${parts[parts.length - 1]}`;
  }

  return code;
}

function getStatusStyles(status: OrderStatus | string) {
  switch (status) {
    case "CREATED":
    case "DEPOSIT_PENDING":
      return { pill: styles.statusDeposit, text: styles.statusDepositText };
    case "DEPOSIT_PAID":
    case "IN_PRODUCTION":
      return { pill: styles.statusProduction, text: styles.statusProductionText };
    case "READY_FOR_DELIVERY":
    case "DELIVERING":
      return { pill: styles.statusDelivery, text: styles.statusDeliveryText };
    case "FINAL_PAYMENT_PENDING":
      return { pill: styles.statusPayment, text: styles.statusPaymentText };
    case "COMPLETED":
      return { pill: styles.statusCompleted, text: styles.statusCompletedText };
    case "CANCELLED":
      return { pill: styles.statusCancelled, text: styles.statusCancelledText };
    default:
      return { pill: {}, text: {} };
  }
}

export function ProjectOrdersScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { projectId, projectName } = route.params;
  const queryClient = useQueryClient();
  const ordersQuery = useProjectOrdersQuery(projectId);

  const orders = ordersQuery.data ?? [];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroDecor} />
          <View style={styles.heroTopRow}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <AppIcon definition={arrowLeftIconDefinition} size={18} color="#FFFFFF" strokeWidth={1.8} />
            </Pressable>
          </View>
          <Text style={styles.heroEyebrow}>FURNISPACE</Text>
          <Text style={styles.heroTitle}>Orders</Text>
          {projectName ? <Text style={styles.heroProject}>{projectName}</Text> : null}
        </View>

        <View style={styles.content}>
          {ordersQuery.isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#C9A86A" />
              <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>📦</Text>
              </View>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptyText}>
                Accept a quotation to create your order and pay the deposit.
              </Text>
            </View>
          ) : (
            <>
              {orders.map((order, index) => {
                const statusStyles = getStatusStyles(order.status);
                const needsDeposit = canPayOrderDeposit(order.status);
                const orderCode = order.orderCode ?? order.orderId.slice(0, 8);
                const displayTotal = resolveOrderDisplayTotal(order);

                return (
                  <Pressable
                    key={order.orderId}
                    style={styles.orderCard}
                    onPressIn={() => {
                      void prefetchOrderDetailQuery(queryClient, order.orderId);
                    }}
                    onPress={() =>
                      navigation.navigate("OrderDetail", {
                        orderId: order.orderId,
                        projectId,
                        projectName,
                      })
                    }
                  >
                    <View style={styles.cardTopRow}>
                      <View style={styles.orderBadge}>
                        <Text style={styles.orderBadgeText}>Order #{orders.length - index}</Text>
                      </View>
                      <View style={[styles.statusPill, statusStyles.pill]}>
                        <Text style={[styles.statusPillText, statusStyles.text]}>
                          {formatStatusLabel(order.status)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardTitle}>Order #{orders.length - index}</Text>
                    <Text style={styles.cardCode} numberOfLines={1}>
                      {formatOrderShortCode(orderCode)}
                    </Text>

                    {needsDeposit ? (
                      <View style={styles.depositDueBadge}>
                        <Text style={styles.depositDueText}>DEPOSIT DUE</Text>
                      </View>
                    ) : null}

                    <View style={styles.amountRow}>
                      <View>
                        <Text style={styles.amountLabel}>TOTAL</Text>
                        <Text style={styles.amountValue}>
                          {displayTotal > 0 ? formatVndAmount(displayTotal) : "—"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.metaText}>
                        Paid: {order.paidAmount != null ? formatVndAmount(order.paidAmount) : "—"}
                        {order.remainingAmount != null
                          ? `\nRemaining: ${formatVndAmount(order.remainingAmount)}`
                          : ""}
                        {order.createdAt ? `\nPlaced ${formatTrackingDate(order.createdAt)}` : ""}
                      </Text>
                      <View style={styles.chevronWrap}>
                        <AppIcon definition={chevronRightIconDefinition} size={14} color="#8A6D3B" strokeWidth={2.2} />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
