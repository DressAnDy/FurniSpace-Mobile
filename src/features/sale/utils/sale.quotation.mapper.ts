import { normalizeQuotationDetail, normalizeQuotationList } from "../../project/utils/quotation.mapper";
import type { QuotationDto, QuotationDetailDto as ProjectQuotationDetailDto } from "../../project/models/quotation.model";
import type {
  QuotationDetailDto,
  QuotationItemDto,
  QuotationStatus,
  QuotationSummaryDto,
} from "../models/sale.commercial.model";

function readRecord(raw: unknown): Record<string, unknown> | null {
  return typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : null;
}

function readOptionalString(raw: Record<string, unknown> | null, key: string): string | null {
  const value = raw?.[key];
  return typeof value === "string" ? value : null;
}

function mapSaleQuotationItem(item: ProjectQuotationDetailDto["items"][number]): QuotationItemDto {
  return {
    quotationItemId: item.quotationItemId,
    productNameSnapshot: item.productNameSnapshot ?? item.itemName,
    itemName: item.itemName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    grossAmount: item.quantity * item.unitPrice,
    discountAmount: item.discountAmount,
    totalAmount: item.totalAmount,
    isCustomized: item.isCustomized,
  };
}

function mapProjectToSaleDetail(
  normalized: QuotationDto & { items?: ProjectQuotationDetailDto["items"] },
  raw?: unknown,
): QuotationDetailDto {
  const record = readRecord(raw);
  return {
    quotationId: normalized.quotationId,
    projectId: normalized.projectId,
    proposalId: normalized.proposalId,
    quotationCode: normalized.quotationCode,
    versionNo: normalized.versionNo,
    subtotalAmount: normalized.subtotalAmount,
    totalDiscountAmount: normalized.totalDiscountAmount,
    preVatAmount: normalized.preVatAmount,
    vatRate: normalized.vatRate,
    vatAmount: normalized.vatAmount,
    totalAmount: normalized.totalAmount,
    depositAmount: normalized.depositAmount,
    currency: normalized.currency,
    status: normalized.status as QuotationStatus,
    validUntil: normalized.validUntil,
    customerNote: readOptionalString(record, "customerNote"),
    salesNote: normalized.salesNote,
    revisionReason: normalized.revisionReason,
    rejectReason: normalized.rejectReason,
    sentAt: normalized.sentAt,
    acceptedAt: normalized.acceptedAt,
    rejectedAt: readOptionalString(record, "rejectedAt"),
    createdAt: readOptionalString(record, "createdAt") ?? undefined,
    updatedAt: readOptionalString(record, "updatedAt") ?? undefined,
    items: (normalized.items ?? []).map(mapSaleQuotationItem),
  };
}

function mapProjectToSaleSummary(normalized: QuotationDto, raw?: unknown): QuotationSummaryDto {
  const detail = mapProjectToSaleDetail({ ...normalized, items: [] }, raw);
  const { items: _items, ...summary } = detail;
  return summary;
}

export function mapSaleQuotationSummary(raw: unknown): QuotationSummaryDto {
  const normalized = normalizeQuotationList([raw])[0];
  return mapProjectToSaleSummary(normalized, raw);
}

export function mapSaleQuotationDetail(raw: unknown): QuotationDetailDto {
  return mapProjectToSaleDetail(normalizeQuotationDetail(raw), raw);
}

export function mapSaleQuotationList(rawItems: unknown[]): QuotationSummaryDto[] {
  return normalizeQuotationList(rawItems).map((item, index) =>
    mapProjectToSaleSummary(item, rawItems[index]),
  );
}

export function canEditSaleQuotation(status: QuotationStatus): boolean {
  return status === "DRAFT" || status === "REVISION_REQUESTED" || status === "REVISED";
}

export function canSendSaleQuotation(status: QuotationStatus): boolean {
  return status === "DRAFT" || status === "REVISED";
}

export function canReviseSaleQuotation(status: QuotationStatus): boolean {
  return status === "REVISION_REQUESTED";
}

export function canCancelSaleQuotation(status: QuotationStatus): boolean {
  return status === "DRAFT" || status === "REVISION_REQUESTED" || status === "REVISED";
}

export function getQuotationStatusPillColors(status: QuotationStatus): {
  backgroundColor: string;
  color: string;
} {
  switch (status) {
    case "REVISION_REQUESTED":
      return { backgroundColor: "#FFF4E5", color: "#BB4D00" };
    case "REVISED":
      return { backgroundColor: "#EFF6FF", color: "#155DFC" };
    case "SENT":
    case "ACCEPTED":
      return { backgroundColor: "#E8F8F0", color: "#009966" };
    case "REJECTED":
    case "CANCELLED":
    case "EXPIRED":
      return { backgroundColor: "#FFF5F5", color: "#E17100" };
    default:
      return { backgroundColor: "#F5F2ED", color: "#7A6F68" };
  }
}

export type QuotationItemDraft = {
  quotationItemId: string;
  label: string;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
};

export type GroupedQuotationItemDraft = {
  groupKey: string;
  label: string;
  sourceItemIds: string[];
  quantity: string;
  unitPrice: string;
  discountAmount: string;
};

function readDraftAmount(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function resolveItemLabel(item: QuotationItemDto): string {
  return item.itemName ?? item.productNameSnapshot ?? "Item";
}

function resolveGroupKey(label: string): string {
  return label.trim().toLowerCase();
}

function resolveMergedUnitPrice(items: QuotationItemDraft[]): number {
  const priced = items
    .map((item) => ({
      quantity: readDraftAmount(item.quantity),
      unitPrice: readDraftAmount(item.unitPrice),
    }))
    .filter((item) => item.quantity > 0 && item.unitPrice > 0);

  if (priced.length === 0) {
    return readDraftAmount(items[0]?.unitPrice ?? "0");
  }

  const uniquePrices = new Set(priced.map((item) => item.unitPrice));
  if (uniquePrices.size === 1) {
    return priced[0].unitPrice;
  }

  const gross = priced.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const quantity = priced.reduce((sum, item) => sum + item.quantity, 0);
  return quantity > 0 ? Math.round(gross / quantity) : priced[0].unitPrice;
}

export function toQuotationItemDrafts(items: QuotationItemDto[]): QuotationItemDraft[] {
  return items.map((item) => ({
    quotationItemId: item.quotationItemId,
    label: resolveItemLabel(item),
    quantity: String(item.quantity ?? 0),
    unitPrice: String(item.unitPrice ?? 0),
    discountAmount: String(item.discountAmount ?? 0),
  }));
}

export function mergeQuotationItemDrafts(items: QuotationItemDraft[]): GroupedQuotationItemDraft[] {
  const groups = new Map<string, QuotationItemDraft[]>();

  for (const item of items) {
    const key = resolveGroupKey(item.label);
    const bucket = groups.get(key) ?? [];
    bucket.push(item);
    groups.set(key, bucket);
  }

  return Array.from(groups.entries()).map(([groupKey, bucket]) => ({
    groupKey,
    label: bucket[0]?.label ?? "Item",
    sourceItemIds: bucket.map((item) => item.quotationItemId),
    quantity: String(bucket.reduce((sum, item) => sum + readDraftAmount(item.quantity), 0)),
    unitPrice: String(resolveMergedUnitPrice(bucket)),
    discountAmount: String(bucket.reduce((sum, item) => sum + readDraftAmount(item.discountAmount), 0)),
  }));
}

function distributeIntegerTotal(total: number, weights: number[]): number[] {
  const count = weights.length;
  if (count === 0) {
    return [];
  }
  if (total <= 0) {
    return Array(count).fill(0);
  }

  const normalizedWeights = weights.every((weight) => weight <= 0)
    ? Array(count).fill(1)
    : weights.map((weight) => Math.max(weight, 0));

  if (total >= count) {
    const allocated = Array(count).fill(1);
    let remaining = total - count;
    const weightSum = normalizedWeights.reduce((sum, weight) => sum + weight, 0) || count;
    const extraShares = normalizedWeights.map((weight) => (remaining * weight) / weightSum);
    const extraAllocated = extraShares.map((share) => Math.floor(share));
    remaining -= extraAllocated.reduce((sum, value) => sum + value, 0);

    for (let index = 0; index < count; index += 1) {
      allocated[index] += extraAllocated[index];
    }

    const ranked = extraShares
      .map((share, index) => ({ index, fraction: share - Math.floor(share) }))
      .sort((left, right) => right.fraction - left.fraction);

    for (let step = 0; step < remaining; step += 1) {
      allocated[ranked[step % ranked.length].index] += 1;
    }

    return allocated;
  }

  const allocated = Array(count).fill(0);
  for (let index = 0; index < total; index += 1) {
    allocated[index] = 1;
  }
  return allocated;
}

export function expandGroupedQuotationItemDrafts(
  groups: GroupedQuotationItemDraft[],
  originalItems: QuotationItemDraft[] = [],
): Array<{
  quotationItemId: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
}> {
  const originalById = new Map(originalItems.map((item) => [item.quotationItemId, item]));
  const payload: Array<{
    quotationItemId: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
  }> = [];

  for (const group of groups) {
    const quantity = readDraftAmount(group.quantity);
    const unitPrice = readDraftAmount(group.unitPrice);
    const discountAmount = readDraftAmount(group.discountAmount);
    const sourceIds = group.sourceItemIds;

    if (sourceIds.length === 0) {
      continue;
    }

    if (sourceIds.length === 1) {
      payload.push({
        quotationItemId: sourceIds[0],
        quantity,
        unitPrice,
        discountAmount,
      });
      continue;
    }

    const weights = sourceIds.map((itemId) => readDraftAmount(originalById.get(itemId)?.quantity ?? "1"));
    const quantities = distributeIntegerTotal(quantity, weights);
    const discounts = distributeIntegerTotal(discountAmount, weights);

    for (let index = 0; index < sourceIds.length; index += 1) {
      payload.push({
        quotationItemId: sourceIds[index],
        quantity: quantities[index] ?? 0,
        unitPrice,
        discountAmount: discounts[index] ?? 0,
      });
    }
  }

  return payload;
}

export function computeQuotationItemDraftTotal(item: Pick<GroupedQuotationItemDraft, "quantity" | "unitPrice" | "discountAmount">): number {
  const gross = readDraftAmount(item.quantity) * readDraftAmount(item.unitPrice);
  return Math.max(gross - readDraftAmount(item.discountAmount), 0);
}

export function estimateQuotationTotalFromDrafts(
  groups: GroupedQuotationItemDraft[],
  vatRate = 0.08,
): number {
  const preVatAmount = groups.reduce((sum, group) => sum + computeQuotationItemDraftTotal(group), 0);
  const vatAmount = Math.round(preVatAmount * vatRate);
  return preVatAmount + vatAmount;
}

export function getGroupedItemValidationError(group: GroupedQuotationItemDraft): string | null {
  const quantity = readDraftAmount(group.quantity);
  const unitPrice = readDraftAmount(group.unitPrice);
  const discountAmount = readDraftAmount(group.discountAmount);
  const gross = quantity * unitPrice;
  const lineTotal = computeQuotationItemDraftTotal(group);

  if (quantity <= 0) {
    return "Số lượng phải lớn hơn 0.";
  }
  if (unitPrice <= 0) {
    return "Đơn giá phải lớn hơn 0.";
  }
  if (discountAmount > gross) {
    return "Giảm giá không được vượt thành tiền dòng.";
  }
  if (lineTotal <= 0) {
    return "Thành tiền dòng phải lớn hơn 0.";
  }
  if (group.sourceItemIds.length > 1 && quantity < group.sourceItemIds.length) {
    return `Đang gộp ${group.sourceItemIds.length} dòng — số lượng tối thiểu là ${group.sourceItemIds.length}.`;
  }

  return null;
}

export function validateGroupedQuotationItemDrafts(groups: GroupedQuotationItemDraft[]): string | null {
  for (const group of groups) {
    const itemError = getGroupedItemValidationError(group);
    if (itemError) {
      return `“${group.label}”: ${itemError}`;
    }
  }

  return null;
}

export function validateQuotationHeaderForSend(params: {
  validUntil: Date;
  depositAmount: string;
  estimatedTotal: number;
}): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const validUntil = new Date(params.validUntil);
  validUntil.setHours(0, 0, 0, 0);
  if (validUntil < today) {
    return "Valid until không được ở quá khứ.";
  }

  const depositValue = readDraftAmount(params.depositAmount);
  if (params.estimatedTotal <= 0) {
    return "Tổng quotation phải lớn hơn 0 trước khi gửi.";
  }
  if (depositValue <= 0) {
    return "Cần nhập deposit trước khi gửi.";
  }

  return null;
}

export function validateQuotationForm(params: {
  groupedDrafts: GroupedQuotationItemDraft[];
  validUntil: Date;
  depositAmount: string;
  vatRate?: number;
  forSend?: boolean;
}): string | null {
  const itemError = validateGroupedQuotationItemDrafts(params.groupedDrafts);
  if (itemError) {
    return itemError;
  }

  if (!params.forSend) {
    return null;
  }

  return validateQuotationHeaderForSend({
    validUntil: params.validUntil,
    depositAmount: params.depositAmount,
    estimatedTotal: estimateQuotationTotalFromDrafts(params.groupedDrafts, params.vatRate ?? 0.08),
  });
}
