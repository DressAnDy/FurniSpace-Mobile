import { ProposalItemSummaryDto } from "../models/proposal.model";

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

/** BE may use itemName, productName, productNameSnapshot, or nested product object. */
export function resolveProposalItemName(raw: Record<string, unknown>): string | undefined {
  const direct =
    readString(raw.itemName) ??
    readString(raw.ItemName) ??
    readString(raw.productName) ??
    readString(raw.ProductName) ??
    readString(raw.productNameSnapshot) ??
    readString(raw.ProductNameSnapshot) ??
    readString(raw.productVersionNameSnapshot) ??
    readString(raw.displayName) ??
    readString(raw.name) ??
    readString(raw.title);

  if (direct) {
    return direct;
  }

  const product = readRecord(raw.product);
  if (product) {
    return (
      readString(product.productName) ??
      readString(product.name) ??
      readString(product.displayName) ??
      readString(product.title)
    );
  }

  const productVersion = readRecord(raw.productVersion);
  if (productVersion) {
    return readString(productVersion.versionName) ?? readString(productVersion.name);
  }

  return undefined;
}

export function normalizeProposalItem(raw: unknown, index = 0): ProposalItemSummaryDto | null {
  const record = readRecord(raw);
  if (!record) {
    return null;
  }

  const proposalItemId =
    readString(record.proposalItemId) ?? readString(record.ProposalItemId) ?? readString(record.id) ?? `item-${index}`;

  const itemName = resolveProposalItemName(record) ?? `Item ${index + 1}`;

  return {
    proposalItemId,
    proposalId: readString(record.proposalId) ?? readString(record.ProposalId) ?? "",
    sceneId: readString(record.sceneId) ?? readString(record.SceneId) ?? null,
    itemName,
    quantity: readNumber(record.quantity) ?? readNumber(record.Quantity),
    unitPrice: readNumber(record.unitPrice) ?? readNumber(record.UnitPrice),
    totalAmount: readNumber(record.totalAmount) ?? readNumber(record.TotalAmount),
  };
}

export function normalizeProposalItems(rawItems: unknown): ProposalItemSummaryDto[] {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .map((item, index) => normalizeProposalItem(item, index))
    .filter((item): item is ProposalItemSummaryDto => item != null);
}

export function mergeProposalItems(
  primary: ProposalItemSummaryDto[],
  secondary: ProposalItemSummaryDto[],
): ProposalItemSummaryDto[] {
  if (secondary.length === 0) {
    return primary;
  }

  if (primary.length === 0) {
    return secondary;
  }

  const secondaryById = new Map(secondary.map((item) => [item.proposalItemId, item]));

  return primary.map((item, index) => {
    const enriched = secondaryById.get(item.proposalItemId);
    const itemName =
      item.itemName && item.itemName !== `Item ${index + 1}` ? item.itemName : (enriched?.itemName ?? item.itemName);

    return {
      ...item,
      itemName: itemName || enriched?.itemName || `Item ${index + 1}`,
      quantity: item.quantity ?? enriched?.quantity,
      unitPrice: item.unitPrice ?? enriched?.unitPrice,
      totalAmount: item.totalAmount ?? enriched?.totalAmount,
      sceneId: item.sceneId ?? enriched?.sceneId,
    };
  });
}

export function pickRicherProposalItems(
  detailItems: ProposalItemSummaryDto[],
  listItems: ProposalItemSummaryDto[],
): ProposalItemSummaryDto[] {
  const detailHasNames = detailItems.some(
    (item) => item.itemName && !/^Item \d+$/.test(item.itemName),
  );
  const listHasNames = listItems.some((item) => item.itemName && !/^Item \d+$/.test(item.itemName));

  if (listHasNames && !detailHasNames) {
    return listItems;
  }

  if (detailHasNames && !listHasNames) {
    return detailItems;
  }

  return mergeProposalItems(detailItems, listItems);
}
