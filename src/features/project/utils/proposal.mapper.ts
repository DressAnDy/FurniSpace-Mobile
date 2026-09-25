import { ProposalItemSummaryDto } from "../models/proposal.model";

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
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
  const unitPrice =
    readNumber(record.unitPrice) ??
    readNumber(record.UnitPrice) ??
    readNumber(record.unitPriceSnapshot) ??
    readNumber(record.UnitPriceSnapshot);
  const totalAmount =
    readNumber(record.totalAmount) ??
    readNumber(record.TotalAmount) ??
    readNumber(record.subtotalAmount) ??
    readNumber(record.SubtotalAmount);

  return {
    proposalItemId,
    proposalId: readString(record.proposalId) ?? readString(record.ProposalId) ?? "",
    sceneId: readString(record.sceneId) ?? readString(record.SceneId) ?? null,
    itemName,
    quantity: readNumber(record.quantity) ?? readNumber(record.Quantity),
    unitPrice,
    totalAmount,
    productNameSnapshot: readString(record.productNameSnapshot) ?? readString(record.ProductNameSnapshot) ?? null,
    productVersionNameSnapshot:
      readString(record.productVersionNameSnapshot) ??
      readString(record.ProductVersionNameSnapshot) ??
      readString(record.versionNameSnapshot) ??
      readString(record.VersionNameSnapshot) ??
      null,
    materialSnapshot: readString(record.materialSnapshot) ?? readString(record.MaterialSnapshot) ?? null,
    widthSnapshot: readNumber(record.widthSnapshot) ?? readNumber(record.WidthSnapshot) ?? null,
    heightSnapshot: readNumber(record.heightSnapshot) ?? readNumber(record.HeightSnapshot) ?? null,
    depthSnapshot: readNumber(record.depthSnapshot) ?? readNumber(record.DepthSnapshot) ?? null,
    dimensionUnit: readString(record.dimensionUnit) ?? readString(record.DimensionUnit) ?? null,
    sourceProductVersionId:
      readString(record.sourceProductVersionId) ??
      readString(record.SourceProductVersionId) ??
      readString(record.productVersionId) ??
      readString(record.ProductVersionId) ??
      null,
    isCustomized: readBoolean(record.isCustomized) ?? readBoolean(record.IsCustomized),
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
      productNameSnapshot: item.productNameSnapshot ?? enriched?.productNameSnapshot,
      productVersionNameSnapshot: item.productVersionNameSnapshot ?? enriched?.productVersionNameSnapshot,
      materialSnapshot: item.materialSnapshot ?? enriched?.materialSnapshot,
      widthSnapshot: item.widthSnapshot ?? enriched?.widthSnapshot,
      heightSnapshot: item.heightSnapshot ?? enriched?.heightSnapshot,
      depthSnapshot: item.depthSnapshot ?? enriched?.depthSnapshot,
      dimensionUnit: item.dimensionUnit ?? enriched?.dimensionUnit,
      sourceProductVersionId: item.sourceProductVersionId ?? enriched?.sourceProductVersionId,
      isCustomized: item.isCustomized ?? enriched?.isCustomized,
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
