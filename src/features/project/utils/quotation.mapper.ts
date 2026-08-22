import { QuotationDetailDto, QuotationDto, QuotationItemDto } from "../models/quotation.model";
import {
  collectAmountSources,
  computeDepositFromPercent,
  findAmountByKeyPattern,
  isDepositAmountKey,
  isDepositPercentKey,
  pickAmount,
  pickAmountFromSources,
  readRecord,
} from "./amount.mapper";

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function unwrapQuotationRecord(raw: unknown): Record<string, unknown> {
  const record = readRecord(raw) ?? {};
  return readRecord(record.quotation) ?? readRecord(record.Quotation) ?? record;
}

function pickNestedDepositAmount(
  raw: Record<string, unknown>,
  totalAmount?: number,
  preVatAmount?: number,
): number | undefined {
  for (const key of ["deposit", "Deposit", "depositInfo", "DepositInfo", "paymentTerms", "PaymentTerms"]) {
    const nested = readRecord(raw[key]);
    if (!nested) {
      continue;
    }

    const amount = pickAmountFromSources(
      [nested],
      "depositAmount",
      "DepositAmount",
      "amount",
      "Amount",
      "value",
      "Value",
      "totalAmount",
      "TotalAmount",
    );

    if (amount != null && amount > 0) {
      return amount;
    }

    const percent = pickAmountFromSources(
      [nested],
      "depositPercent",
      "DepositPercent",
      "percent",
      "Percent",
      "rate",
      "Rate",
    );
    const computed = computeDepositFromPercent(percent, totalAmount, preVatAmount);
    if (computed != null && computed > 0) {
      return computed;
    }
  }

  return undefined;
}

function resolveDepositPercent(raw: Record<string, unknown>): number | undefined {
  const sources = collectAmountSources(raw);

  return (
    pickAmountFromSources(
      sources,
      "depositPercent",
      "DepositPercent",
      "requiredDepositPercent",
      "RequiredDepositPercent",
      "depositRate",
      "DepositRate",
    ) ??
    findAmountByKeyPattern(raw, (key) => /deposit/i.test(key) && isDepositPercentKey(key))
  );
}

function resolveDepositAmount(
  raw: Record<string, unknown>,
  totalAmount?: number,
  preVatAmount?: number,
): number | undefined {
  const sources = collectAmountSources(raw);
  const depositAmount = pickAmountFromSources(
    sources,
    "depositAmount",
    "DepositAmount",
    "requiredDepositAmount",
    "RequiredDepositAmount",
    "initialDepositAmount",
    "InitialDepositAmount",
    "depositTotalAmount",
    "DepositTotalAmount",
    "depositValue",
    "DepositValue",
    "deposit_amount",
    "initial_deposit_amount",
  );

  if (depositAmount != null && depositAmount > 0) {
    return depositAmount;
  }

  const nestedDeposit = pickNestedDepositAmount(raw, totalAmount, preVatAmount);
  if (nestedDeposit != null && nestedDeposit > 0) {
    return nestedDeposit;
  }

  const deepDeposit = findAmountByKeyPattern(raw, isDepositAmountKey);
  if (deepDeposit != null && deepDeposit > 0) {
    return deepDeposit;
  }

  const depositPercent = resolveDepositPercent(raw);
  const computed = computeDepositFromPercent(depositPercent, totalAmount, preVatAmount);
  if (computed != null && computed > 0) {
    return computed;
  }

  return computeDepositFromPercent(undefined, totalAmount, preVatAmount);
}

function normalizeQuotationItem(raw: unknown, index = 0): QuotationItemDto | null {
  const record = readRecord(raw);
  if (!record) {
    return null;
  }

  const itemName =
    readString(record.itemName) ??
    readString(record.ItemName) ??
    readString(record.productNameSnapshot) ??
    readString(record.ProductNameSnapshot) ??
    `Item ${index + 1}`;

  return {
    quotationItemId:
      readString(record.quotationItemId) ?? readString(record.QuotationItemId) ?? readString(record.id) ?? `item-${index}`,
    itemName,
    quantity: pickAmount(record, "quantity", "Quantity") ?? 0,
    unitPrice: pickAmount(record, "unitPrice", "UnitPrice") ?? 0,
    discountAmount: pickAmount(record, "discountAmount", "DiscountAmount") ?? 0,
    totalAmount:
      pickAmount(record, "totalAmount", "TotalAmount", "lineTotalAmount", "LineTotalAmount", "lineTotal", "LineTotal") ??
      0,
    isCustomized: Boolean(record.isCustomized ?? record.IsCustomized),
    productNameSnapshot: readString(record.productNameSnapshot) ?? readString(record.ProductNameSnapshot) ?? null,
    productVersionNameSnapshot:
      readString(record.productVersionNameSnapshot) ?? readString(record.ProductVersionNameSnapshot) ?? null,
  };
}

function normalizeQuotationBase(raw: unknown): QuotationDto {
  const record = unwrapQuotationRecord(raw);
  const sources = collectAmountSources(record);

  const subtotalAmount = pickAmountFromSources(sources, "subtotalAmount", "SubtotalAmount", "subtotal", "Subtotal");
  const totalDiscountAmount = pickAmountFromSources(
    sources,
    "totalDiscountAmount",
    "TotalDiscountAmount",
    "discountAmount",
    "DiscountAmount",
    "discount",
    "Discount",
  );
  const preVatAmount = pickAmountFromSources(
    sources,
    "preVatAmount",
    "PreVatAmount",
    "beforeVatAmount",
    "BeforeVatAmount",
  );
  const vatRate = pickAmountFromSources(sources, "vatRate", "VatRate");
  const vatAmount = pickAmountFromSources(sources, "vatAmount", "VatAmount");
  const totalAmount = pickAmountFromSources(sources, "totalAmount", "TotalAmount", "total", "Total");
  const depositPercent = resolveDepositPercent(record);
  const depositAmount = resolveDepositAmount(record, totalAmount, preVatAmount);

  return {
    quotationId: readString(record.quotationId) ?? readString(record.QuotationId) ?? "",
    projectId: readString(record.projectId) ?? readString(record.ProjectId) ?? "",
    proposalId: readString(record.proposalId) ?? readString(record.ProposalId) ?? "",
    quotationCode: readString(record.quotationCode) ?? readString(record.QuotationCode) ?? "",
    versionNo: pickAmount(record, "versionNo", "VersionNo") ?? 1,
    subtotalAmount: subtotalAmount ?? 0,
    totalDiscountAmount: totalDiscountAmount ?? 0,
    preVatAmount: preVatAmount ?? 0,
    vatRate: vatRate ?? 0,
    vatAmount: vatAmount ?? 0,
    totalAmount: totalAmount ?? 0,
    depositAmount: depositAmount ?? 0,
    depositPercent,
    currency: readString(record.currency) ?? readString(record.Currency) ?? "VND",
    status: (readString(record.status) ?? readString(record.Status) ?? "SENT") as QuotationDto["status"],
    validUntil: readString(record.validUntil) ?? readString(record.ValidUntil) ?? null,
    salesNote: readString(record.salesNote) ?? readString(record.SalesNote) ?? null,
    revisionReason: readString(record.revisionReason) ?? readString(record.RevisionReason) ?? null,
    rejectReason: readString(record.rejectReason) ?? readString(record.RejectReason) ?? null,
    sentAt: readString(record.sentAt) ?? readString(record.SentAt) ?? null,
    acceptedAt: readString(record.acceptedAt) ?? readString(record.AcceptedAt) ?? null,
  };
}

export function resolveQuotationDisplayDeposit(
  quotation: Pick<QuotationDto, "depositAmount" | "depositPercent" | "totalAmount" | "preVatAmount">,
): number {
  if (quotation.depositAmount > 0) {
    return quotation.depositAmount;
  }

  const computed = computeDepositFromPercent(
    quotation.depositPercent ?? undefined,
    quotation.totalAmount,
    quotation.preVatAmount,
  );

  return computed ?? 0;
}

export function enrichQuotationDeposit<T extends QuotationDto>(quotation: T, depositAmount?: number | null): T {
  const resolvedDeposit = depositAmount != null && depositAmount > 0 ? depositAmount : resolveQuotationDisplayDeposit(quotation);

  if (resolvedDeposit <= 0) {
    return quotation;
  }

  if (quotation.depositAmount === resolvedDeposit) {
    return quotation;
  }

  return { ...quotation, depositAmount: resolvedDeposit };
}

export function normalizeQuotationDetail(raw: unknown): QuotationDetailDto {
  const record = unwrapQuotationRecord(raw);
  const base = enrichQuotationDeposit(normalizeQuotationBase(record));
  const rawItems = record.items ?? record.Items;
  const items = Array.isArray(rawItems)
    ? rawItems.map((item, index) => normalizeQuotationItem(item, index)).filter((item): item is QuotationItemDto => item != null)
    : [];

  return {
    ...base,
    items,
  };
}

export function normalizeQuotationList(raw: unknown): QuotationDto[] {
  const record = readRecord(raw);
  const rawItems = Array.isArray(raw) ? raw : (record?.items ?? record?.Items);

  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems.map((item) => enrichQuotationDeposit(normalizeQuotationBase(item)));
}

export function formatQuotationDepositLabel(quotation: Pick<QuotationDto, "depositPercent">): string {
  const percent = quotation.depositPercent;
  if (percent != null && percent > 0) {
    const labelPercent = percent <= 1 ? Math.round(percent * 100) : Math.round(percent);
    return `Deposit (${labelPercent}%)`;
  }

  return "Deposit";
}

export function hasVisibleDeposit(
  quotation: Pick<QuotationDto, "depositAmount" | "depositPercent" | "totalAmount" | "preVatAmount">,
): boolean {
  return resolveQuotationDisplayDeposit(quotation) > 0;
}
