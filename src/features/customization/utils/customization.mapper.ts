import {
  ApprovedProductVersionSummaryDto,
  CustomizationProductVersionDto,
  CustomizationRequestDto,
  CustomizationRequestVersionDto,
  CustomizationStatus,
  CustomizationVersionStatus,
  ProductionFeasibilityStatus,
} from "../models/customization.model";

const REQUEST_STATUSES = new Set<CustomizationStatus>(["SUBMITTED", "REVIEWING", "ACCEPTED", "CANCELLED"]);
const VERSION_STATUSES = new Set<CustomizationVersionStatus>([
  "DRAFT",
  "REVIEWING",
  "PRODUCTION_REJECTED",
  "ACCEPTED",
  "WITHDRAWN",
]);
const FEASIBILITY_STATUSES = new Set<ProductionFeasibilityStatus>(["PENDING", "FEASIBLE", "NOT_FEASIBLE"]);

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

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

function pick(record: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

function readRequestStatus(value: unknown): CustomizationStatus | null {
  const text = readString(value)?.toUpperCase();
  if (text && REQUEST_STATUSES.has(text as CustomizationStatus)) {
    return text as CustomizationStatus;
  }

  return null;
}

function readVersionStatus(value: unknown): CustomizationVersionStatus {
  const text = readString(value)?.toUpperCase();
  if (text && VERSION_STATUSES.has(text as CustomizationVersionStatus)) {
    return text as CustomizationVersionStatus;
  }

  return "DRAFT";
}

function readFeasibilityStatus(value: unknown): ProductionFeasibilityStatus {
  const text = readString(value)?.toUpperCase();
  if (text && FEASIBILITY_STATUSES.has(text as ProductionFeasibilityStatus)) {
    return text as ProductionFeasibilityStatus;
  }

  return "PENDING";
}

function normalizeProductVersion(raw: unknown): CustomizationProductVersionDto {
  const record = readRecord(raw);
  if (!record) {
    return {};
  }

  return {
    productVersionId: readString(pick(record, "productVersionId", "ProductVersionId")) ?? null,
    productId: readString(pick(record, "productId", "ProductId")) ?? null,
    versionName: readString(pick(record, "versionName", "VersionName")) ?? null,
    versionCode: readString(pick(record, "versionCode", "VersionCode")) ?? null,
    versionType: readString(pick(record, "versionType", "VersionType")) ?? null,
    isProjectSpecific: readBoolean(pick(record, "isProjectSpecific", "IsProjectSpecific")) ?? null,
    material: readString(pick(record, "material", "Material")) ?? null,
    color: readString(pick(record, "color", "Color")) ?? null,
    width: readNumber(pick(record, "width", "Width")) ?? null,
    height: readNumber(pick(record, "height", "Height")) ?? null,
    depth: readNumber(pick(record, "depth", "Depth")) ?? null,
    dimensionUnit: readString(pick(record, "dimensionUnit", "DimensionUnit")) ?? null,
    estimatedPrice: readNumber(pick(record, "estimatedPrice", "EstimatedPrice")) ?? null,
    price: readNumber(pick(record, "price", "Price")) ?? null,
  };
}

function normalizeSourceProductVersion(raw: unknown): ApprovedProductVersionSummaryDto | null {
  const record = readRecord(raw);
  if (!record) {
    return null;
  }

  return {
    productVersionId: readString(pick(record, "productVersionId", "ProductVersionId")) ?? null,
    productId: readString(pick(record, "productId", "ProductId")) ?? null,
    productName:
      readString(pick(record, "productName", "ProductName", "name", "Name")) ?? null,
    versionName: readString(pick(record, "versionName", "VersionName")) ?? null,
    versionCode: readString(pick(record, "versionCode", "VersionCode")) ?? null,
    material: readString(pick(record, "material", "Material")) ?? null,
    color: readString(pick(record, "color", "Color")) ?? null,
  };
}

export function normalizeCustomizationVersion(raw: unknown): CustomizationRequestVersionDto | null {
  const record = readRecord(raw);
  if (!record) {
    return null;
  }

  const customizationRequestVersionId = readString(
    pick(record, "customizationRequestVersionId", "CustomizationRequestVersionId", "id", "Id"),
  );
  if (!customizationRequestVersionId) {
    return null;
  }

  return {
    customizationRequestVersionId,
    customizationRequestId: readString(pick(record, "customizationRequestId", "CustomizationRequestId")) ?? "",
    versionNo: readNumber(pick(record, "versionNo", "VersionNo")) ?? 0,
    createdByDesignerId: readString(pick(record, "createdByDesignerId", "CreatedByDesignerId")) ?? null,
    versionTitle: readString(pick(record, "versionTitle", "VersionTitle")) ?? null,
    designerNote: readString(pick(record, "designerNote", "DesignerNote")) ?? null,
    status: readVersionStatus(pick(record, "status", "Status")),
    feasibilityStatus: readFeasibilityStatus(pick(record, "feasibilityStatus", "FeasibilityStatus")),
    feasibilityNote: readString(pick(record, "feasibilityNote", "FeasibilityNote")) ?? null,
    estimatedProductionDays: readNumber(pick(record, "estimatedProductionDays", "EstimatedProductionDays")) ?? null,
    estimatedAdditionalCost: readNumber(pick(record, "estimatedAdditionalCost", "EstimatedAdditionalCost")) ?? null,
    additionalCostReason: readString(pick(record, "additionalCostReason", "AdditionalCostReason")) ?? null,
    materialAvailable: readBoolean(pick(record, "materialAvailable", "MaterialAvailable")) ?? null,
    productionRiskNote: readString(pick(record, "productionRiskNote", "ProductionRiskNote")) ?? null,
    alternativeMaterialNote: readString(pick(record, "alternativeMaterialNote", "AlternativeMaterialNote")) ?? null,
    submittedForReviewAt: readString(pick(record, "submittedForReviewAt", "SubmittedForReviewAt")) ?? null,
    productionReviewedAt: readString(pick(record, "productionReviewedAt", "ProductionReviewedAt")) ?? null,
    productionRejectedAt: readString(pick(record, "productionRejectedAt", "ProductionRejectedAt")) ?? null,
    acceptedAt: readString(pick(record, "acceptedAt", "AcceptedAt")) ?? null,
    withdrawnAt: readString(pick(record, "withdrawnAt", "WithdrawnAt")) ?? null,
    createdAt: readString(pick(record, "createdAt", "CreatedAt")) ?? null,
    updatedAt: readString(pick(record, "updatedAt", "UpdatedAt")) ?? null,
    isAccepted: readBoolean(pick(record, "isAccepted", "IsAccepted")) ?? false,
    productVersion: normalizeProductVersion(pick(record, "productVersion", "ProductVersion")),
  };
}

export function normalizeCustomizationRequest(raw: unknown): CustomizationRequestDto | null {
  const record = readRecord(raw);
  if (!record) {
    return null;
  }

  const customizationRequestId = readString(
    pick(record, "customizationRequestId", "CustomizationRequestId", "id", "Id"),
  );
  if (!customizationRequestId) {
    return null;
  }

  const versionsRaw = pick(record, "versions", "Versions");
  const versions = Array.isArray(versionsRaw)
    ? versionsRaw
        .map((item) => normalizeCustomizationVersion(item))
        .filter((item): item is CustomizationRequestVersionDto => item != null)
    : [];

  return {
    customizationRequestId,
    projectId: readString(pick(record, "projectId", "ProjectId")) ?? "",
    proposalId: readString(pick(record, "proposalId", "ProposalId")) ?? "",
    sourceProductVersionId: readString(pick(record, "sourceProductVersionId", "SourceProductVersionId")) ?? "",
    requestedByCustomerId: readString(pick(record, "requestedByCustomerId", "RequestedByCustomerId")) ?? null,
    requestTitle: readString(pick(record, "requestTitle", "RequestTitle")) ?? "Customization request",
    requestDescription: readString(pick(record, "requestDescription", "RequestDescription")) ?? null,
    requestedWidth: readNumber(pick(record, "requestedWidth", "RequestedWidth")) ?? null,
    requestedHeight: readNumber(pick(record, "requestedHeight", "RequestedHeight")) ?? null,
    requestedDepth: readNumber(pick(record, "requestedDepth", "RequestedDepth")) ?? null,
    requestedMaterial: readString(pick(record, "requestedMaterial", "RequestedMaterial")) ?? null,
    requestedColor: readString(pick(record, "requestedColor", "RequestedColor")) ?? null,
    requestedChangeNote: readString(pick(record, "requestedChangeNote", "RequestedChangeNote")) ?? null,
    acceptedRequestVersionId: readString(pick(record, "acceptedRequestVersionId", "AcceptedRequestVersionId")) ?? null,
    status: readRequestStatus(pick(record, "status", "Status")),
    createdAt: readString(pick(record, "createdAt", "CreatedAt")) ?? null,
    updatedAt: readString(pick(record, "updatedAt", "UpdatedAt")) ?? null,
    sourceProductVersion: normalizeSourceProductVersion(pick(record, "sourceProductVersion", "SourceProductVersion")),
    acceptedVersion: normalizeCustomizationVersion(pick(record, "acceptedVersion", "AcceptedVersion")),
    versions,
  };
}

export function normalizeCustomizationRequestList(raw: unknown): CustomizationRequestDto[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => normalizeCustomizationRequest(item))
      .filter((item): item is CustomizationRequestDto => item != null);
  }

  const record = readRecord(raw);
  if (!record) {
    return [];
  }

  const items = record.items ?? record.Items;
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => normalizeCustomizationRequest(item))
    .filter((item): item is CustomizationRequestDto => item != null);
}
