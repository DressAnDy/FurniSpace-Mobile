import type { OrderDetailDto } from "../../project/models/order.model";
import { normalizeOrderDetail, normalizeOrderListItem } from "../../project/utils/order.mapper";
import type { SaleOrderDetailDto, SaleOrderItemDto } from "../models/sale.fulfillment.model";

export function mapSaleOrderListItem(raw: unknown): SaleOrderDetailDto | null {
  const normalized = normalizeOrderListItem(raw);
  if (!normalized) {
    return null;
  }

  return {
    ...normalized,
    totalAmount: normalized.originalTotalAmount,
  };
}

export function mapSaleOrderDetail(raw: unknown): SaleOrderDetailDto {
  const normalized: OrderDetailDto = normalizeOrderDetail(raw);
  const record = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};

  return {
    ...normalized,
    totalAmount: normalized.finalTotalAmount || normalized.originalTotalAmount,
    itemsGrossAmount: readOptionalNumber(record, "itemsGrossAmount", "ItemsGrossAmount"),
    totalItemDiscountAmount: readOptionalNumber(record, "totalItemDiscountAmount", "TotalItemDiscountAmount"),
    preVatAmount: readOptionalNumber(record, "preVatAmount", "PreVatAmount"),
    customerConfirmedDeliveryAt: readOptionalString(record, "customerConfirmedDeliveryAt", "CustomerConfirmedDeliveryAt"),
    awaitingCustomerConfirmation: readOptionalBoolean(record, "awaitingCustomerConfirmation", "AwaitingCustomerConfirmation"),
    deliveryDetails: readDeliveryDetails(record.deliveryDetails ?? record.DeliveryDetails),
    deliverySummary: readDeliverySummary(record.deliverySummary ?? record.DeliverySummary),
    deliveries: Array.isArray(record.deliveries ?? record.Deliveries)
      ? ((record.deliveries ?? record.Deliveries) as SaleOrderDetailDto["deliveries"])
      : [],
    items: normalized.items.map((item) => ({
      orderItemId: item.orderItemId,
      productNameSnapshot: item.itemName,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: 0,
      subtotalAmount: item.subtotalAmount,
      status: item.status,
      isCustomized: item.isCustomized,
    })),
  };
}

function readOptionalString(record: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function readOptionalNumber(record: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function readOptionalBoolean(record: Record<string, unknown>, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
  }
  return undefined;
}

function readDeliveryDetails(raw: unknown) {
  const record = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : null;
  if (!record) {
    return null;
  }

  return {
    orderId: readOptionalString(record, "orderId", "OrderId") ?? "",
    deliveryAddress: readOptionalString(record, "deliveryAddress", "DeliveryAddress"),
    receiverName: readOptionalString(record, "receiverName", "ReceiverName"),
    receiverPhone: readOptionalString(record, "receiverPhone", "ReceiverPhone"),
    deliveryNote: readOptionalString(record, "deliveryNote", "DeliveryNote"),
  };
}

function readDeliverySummary(raw: unknown) {
  const record = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : null;
  if (!record) {
    return null;
  }

  return {
    totalOrderedQuantity: readOptionalNumber(record, "totalOrderedQuantity", "TotalOrderedQuantity"),
    totalDeliveredQuantity: readOptionalNumber(record, "totalDeliveredQuantity", "TotalDeliveredQuantity"),
    remainingQuantity: readOptionalNumber(record, "remainingQuantity", "RemainingQuantity"),
    deliveryProgressPercent: readOptionalNumber(record, "deliveryProgressPercent", "DeliveryProgressPercent"),
    completedDeliveryCount: readOptionalNumber(record, "completedDeliveryCount", "CompletedDeliveryCount"),
    inProgressDeliveryCount: readOptionalNumber(record, "inProgressDeliveryCount", "InProgressDeliveryCount"),
    upcomingDeliveryCount: readOptionalNumber(record, "upcomingDeliveryCount", "UpcomingDeliveryCount"),
    nextDeliveryAt: readOptionalString(record, "nextDeliveryAt", "NextDeliveryAt"),
  };
}

export function formatSaleOrderStatusLabel(status: string | null | undefined): string {
  return (status ?? "UNKNOWN").replaceAll("_", " ");
}

export type GroupedSaleOrderLineItem = {
  groupKey: string;
  label: string;
  sourceItemIds: string[];
  quantity: number;
  unitPrice: number;
  subtotalAmount: number;
};

function resolveOrderItemLabel(item: SaleOrderItemDto): string {
  return item.itemName ?? item.productNameSnapshot ?? "Item";
}

function resolveOrderItemSubtotal(item: SaleOrderItemDto): number {
  if (typeof item.subtotalAmount === "number" && Number.isFinite(item.subtotalAmount)) {
    return item.subtotalAmount;
  }

  const gross = item.quantity * item.unitPrice;
  return Math.max(0, gross - (item.discountAmount ?? 0));
}

function resolveMergedOrderUnitPrice(items: SaleOrderItemDto[]): number {
  const priced = items.filter((item) => item.quantity > 0 && item.unitPrice > 0);
  if (priced.length === 0) {
    return items[0]?.unitPrice ?? 0;
  }

  const uniquePrices = new Set(priced.map((item) => item.unitPrice));
  if (uniquePrices.size === 1) {
    return priced[0].unitPrice;
  }

  const gross = priced.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const quantity = priced.reduce((sum, item) => sum + item.quantity, 0);
  return quantity > 0 ? Math.round(gross / quantity) : priced[0].unitPrice;
}

export function mergeSaleOrderLineItems(items: SaleOrderItemDto[] = []): GroupedSaleOrderLineItem[] {
  const groups = new Map<string, SaleOrderItemDto[]>();

  for (const item of items) {
    const key = resolveOrderItemLabel(item).trim().toLowerCase();
    const bucket = groups.get(key) ?? [];
    bucket.push(item);
    groups.set(key, bucket);
  }

  return Array.from(groups.entries()).map(([groupKey, bucket]) => ({
    groupKey,
    label: resolveOrderItemLabel(bucket[0]),
    sourceItemIds: bucket.map((item) => item.orderItemId),
    quantity: bucket.reduce((sum, item) => sum + item.quantity, 0),
    unitPrice: resolveMergedOrderUnitPrice(bucket),
    subtotalAmount: bucket.reduce((sum, item) => sum + resolveOrderItemSubtotal(item), 0),
  }));
}
