import { OrderDetailDto, OrderItemDto, OrderListItemDto } from "../models/order.model";
import { collectAmountSources, computeDepositFromPercent, pickAmount, pickAmountFromSources, readRecord } from "./amount.mapper";

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeOrderItem(raw: unknown, index = 0): OrderItemDto | null {
  const record = readRecord(raw);
  if (!record) {
    return null;
  }

  return {
    orderItemId: readString(record.orderItemId) ?? readString(record.OrderItemId) ?? `item-${index}`,
    itemName: readString(record.itemName) ?? readString(record.ItemName) ?? `Item ${index + 1}`,
    quantity: pickAmount(record, "quantity", "Quantity") ?? 0,
    unitPrice: pickAmount(record, "unitPrice", "UnitPrice") ?? 0,
    subtotalAmount: pickAmount(record, "subtotalAmount", "SubtotalAmount", "totalAmount", "TotalAmount") ?? 0,
    status: (readString(record.status) ?? readString(record.Status) ?? "PENDING") as OrderItemDto["status"],
    isCustomized: Boolean(record.isCustomized ?? record.IsCustomized),
  };
}

function resolveOrderTotalAmount(amounts: {
  originalTotalAmount?: number;
  finalTotalAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
}): number {
  for (const value of [amounts.finalTotalAmount, amounts.originalTotalAmount]) {
    if (value != null && value > 0) {
      return value;
    }
  }

  const paid = amounts.paidAmount ?? 0;
  const remaining = amounts.remainingAmount ?? 0;
  if (paid > 0 || remaining > 0) {
    return paid + remaining;
  }

  return 0;
}

export function resolveOrderDisplayTotal(order: {
  totalAmount?: number | null;
  originalTotalAmount?: number | null;
  finalTotalAmount?: number | null;
  paidAmount?: number | null;
  remainingAmount?: number | null;
}): number {
  return resolveOrderTotalAmount({
    originalTotalAmount: order.originalTotalAmount ?? order.totalAmount ?? undefined,
    finalTotalAmount: order.finalTotalAmount ?? undefined,
    paidAmount: order.paidAmount ?? undefined,
    remainingAmount: order.remainingAmount ?? undefined,
  });
}

function resolveOrderDepositAmount(
  record: Record<string, unknown>,
  totalAmount?: number,
): number | undefined {
  const sources = collectAmountSources(record);
  const depositAmount = pickAmountFromSources(sources, "depositAmount", "DepositAmount", "deposit", "Deposit");

  if (depositAmount != null && depositAmount > 0) {
    return depositAmount;
  }

  const depositPercent = pickAmountFromSources(sources, "depositPercent", "DepositPercent");
  const computed = computeDepositFromPercent(depositPercent, totalAmount);
  if (computed != null && computed > 0) {
    return computed;
  }

  return computeDepositFromPercent(undefined, totalAmount);
}

function normalizeOrderAmounts(record: Record<string, unknown>) {
  const sources = collectAmountSources(record);
  const originalTotalAmount = pickAmountFromSources(
    sources,
    "originalTotalAmount",
    "OriginalTotalAmount",
    "totalAmount",
    "TotalAmount",
  );
  const finalTotalAmount = pickAmountFromSources(
    sources,
    "finalTotalAmount",
    "FinalTotalAmount",
    "totalAmount",
    "TotalAmount",
  );
  const totalBase = finalTotalAmount ?? originalTotalAmount;

  return {
    originalTotalAmount,
    finalTotalAmount,
    depositAmount: resolveOrderDepositAmount(record, totalBase),
    paidAmount: pickAmountFromSources(sources, "paidAmount", "PaidAmount"),
    remainingAmount: pickAmountFromSources(sources, "remainingAmount", "RemainingAmount", "remaining", "Remaining"),
  };
}

export function normalizeOrderListItem(raw: unknown): OrderListItemDto | null {
  const record = readRecord(raw);
  if (!record) {
    return null;
  }

  const amounts = normalizeOrderAmounts(record);
  const totalAmount = resolveOrderTotalAmount(amounts);

  return {
    orderId: readString(record.orderId) ?? readString(record.OrderId) ?? "",
    projectId: readString(record.projectId) ?? readString(record.ProjectId) ?? "",
    quotationId: readString(record.quotationId) ?? readString(record.QuotationId) ?? "",
    orderCode: readString(record.orderCode) ?? readString(record.OrderCode) ?? "",
    originalTotalAmount: totalAmount,
    depositAmount: amounts.depositAmount ?? 0,
    paidAmount: amounts.paidAmount ?? 0,
    remainingAmount: amounts.remainingAmount ?? 0,
    status: (readString(record.status) ?? readString(record.Status) ?? "CREATED") as OrderListItemDto["status"],
    createdAt: readString(record.createdAt) ?? readString(record.CreatedAt) ?? "",
  };
}

export function normalizeOrderDetail(raw: unknown): OrderDetailDto {
  const record = readRecord(raw) ?? {};
  const amounts = normalizeOrderAmounts(record);
  const totalAmount = resolveOrderTotalAmount(amounts);
  const rawItems = record.items ?? record.Items;
  const items = Array.isArray(rawItems)
    ? rawItems.map((item, index) => normalizeOrderItem(item, index)).filter((item): item is OrderItemDto => item != null)
    : [];

  return {
    orderId: readString(record.orderId) ?? readString(record.OrderId) ?? "",
    projectId: readString(record.projectId) ?? readString(record.ProjectId) ?? "",
    proposalId: readString(record.proposalId) ?? readString(record.ProposalId) ?? "",
    quotationId: readString(record.quotationId) ?? readString(record.QuotationId) ?? "",
    orderCode: readString(record.orderCode) ?? readString(record.OrderCode) ?? "",
    customerId: readString(record.customerId) ?? readString(record.CustomerId) ?? "",
    salesId: readString(record.salesId) ?? readString(record.SalesId) ?? "",
    vatRate: pickAmount(record, "vatRate", "VatRate") ?? 0,
    vatAmount: pickAmount(record, "vatAmount", "VatAmount") ?? 0,
    originalTotalAmount: totalAmount,
    finalTotalAmount: amounts.finalTotalAmount ?? totalAmount,
    depositAmount: amounts.depositAmount ?? 0,
    paidAmount: amounts.paidAmount ?? 0,
    remainingAmount: amounts.remainingAmount ?? 0,
    status: (readString(record.status) ?? readString(record.Status) ?? "CREATED") as OrderDetailDto["status"],
    items,
    createdAt: readString(record.createdAt) ?? readString(record.CreatedAt),
    updatedAt: readString(record.updatedAt) ?? readString(record.UpdatedAt),
  };
}
