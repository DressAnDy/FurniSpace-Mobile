import {
  CustomizationRequestDto,
  CustomizationRequestVersionDto,
  CustomizationStatus,
  CustomizationVersionStatus,
} from "../models/customization.model";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export function formatCustomizationDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function getRequestStatusLabel(status: CustomizationStatus | null | undefined): string {
  switch (status) {
    case "SUBMITTED":
      return "Submitted";
    case "REVIEWING":
      return "Reviewing";
    case "ACCEPTED":
      return "Accepted";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Unknown";
  }
}

export function getRequestStatusTone(status: CustomizationStatus | null | undefined): StatusTone {
  switch (status) {
    case "SUBMITTED":
      return "warning";
    case "REVIEWING":
      return "info";
    case "ACCEPTED":
      return "success";
    case "CANCELLED":
      return "neutral";
    default:
      return "neutral";
  }
}

export function getVersionStatusLabel(status: CustomizationVersionStatus): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "REVIEWING":
      return "Reviewing";
    case "PRODUCTION_REJECTED":
      return "Production rejected";
    case "ACCEPTED":
      return "Accepted";
    case "WITHDRAWN":
      return "Withdrawn";
    default:
      return status;
  }
}

export function getVersionStatusTone(status: CustomizationVersionStatus): StatusTone {
  switch (status) {
    case "DRAFT":
      return "neutral";
    case "REVIEWING":
      return "info";
    case "PRODUCTION_REJECTED":
      return "danger";
    case "ACCEPTED":
      return "success";
    case "WITHDRAWN":
      return "neutral";
    default:
      return "neutral";
  }
}

export function getFeasibilityPresentation(
  version: CustomizationRequestVersionDto,
): { label: string; tone: StatusTone } {
  if (version.feasibilityStatus === "FEASIBLE") {
    return { label: "Feasible", tone: "success" };
  }

  if (version.feasibilityStatus === "NOT_FEASIBLE") {
    return { label: "Not feasible", tone: "danger" };
  }

  if (version.status === "REVIEWING") {
    return { label: "Production review", tone: "warning" };
  }

  return { label: "Pending", tone: "neutral" };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Hide raw backend ids (UUID / opaque tokens) from customer-facing copy. */
export function isTechnicalId(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (UUID_PATTERN.test(trimmed)) {
    return true;
  }

  if (/^[0-9a-f]{24,}$/i.test(trimmed)) {
    return true;
  }

  return false;
}

export function pickDisplayName(...candidates: Array<string | null | undefined>): string | null {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed && !isTechnicalId(trimmed)) {
      return trimmed;
    }
  }

  return null;
}

export function getSourceProductLabel(request: CustomizationRequestDto): string | null {
  const source = request.sourceProductVersion;
  return pickDisplayName(source?.versionName, source?.productName, source?.versionCode);
}

export function getVersionTitle(version: CustomizationRequestVersionDto, requestTitle: string): string {
  return (
    pickDisplayName(version.versionTitle, version.productVersion.versionName, requestTitle) ??
    (version.versionNo ? `Custom version #${version.versionNo}` : "Custom version")
  );
}

export function getVersionDisplayLabel(version: CustomizationRequestVersionDto): string | null {
  const name = pickDisplayName(version.productVersion.versionName, version.versionTitle);
  if (name && version.versionNo) {
    return `${name} · #${version.versionNo}`;
  }

  if (version.versionNo) {
    return `Version #${version.versionNo}`;
  }

  return name;
}

export function getRequestNote(request: CustomizationRequestDto): string | null {
  return request.requestedChangeNote || request.requestDescription || null;
}

function normalizeDimensionUnit(
  width: number | null | undefined,
  height: number | null | undefined,
  depth: number | null | undefined,
  unit?: string | null,
): string | null {
  const trimmed = unit?.trim();
  if (!trimmed) {
    return null;
  }

  const lower = trimmed.toLowerCase();
  const max = Math.max(width ?? 0, height ?? 0, depth ?? 0);

  // Furniture snapshots sometimes return "m" while values are clearly in cm.
  if ((lower === "m" || lower === "metre" || lower === "meter" || lower === "meters") && max >= 10) {
    return "cm";
  }

  if (lower === "centimetre" || lower === "centimeter" || lower === "centimeters") {
    return "cm";
  }

  return trimmed;
}

export function formatSizeLine(
  width: number | null | undefined,
  height: number | null | undefined,
  depth: number | null | undefined,
  unit?: string | null,
): string | null {
  const parts = [
    width != null ? `W ${width}` : null,
    height != null ? `H ${height}` : null,
    depth != null ? `D ${depth}` : null,
  ].filter((part): part is string => Boolean(part));

  if (parts.length === 0) {
    return null;
  }

  const displayUnit = normalizeDimensionUnit(width, height, depth, unit);
  return displayUnit ? `${parts.join(" × ")} ${displayUnit}` : parts.join(" × ");
}

export function isCustomerVisibleVersion(version: CustomizationRequestVersionDto): boolean {
  return version.status !== "DRAFT";
}

export function canAcceptCustomVersion(
  request: CustomizationRequestDto,
  version: CustomizationRequestVersionDto,
): boolean {
  if (request.status === "ACCEPTED" || request.status === "CANCELLED") {
    return false;
  }

  if (version.isAccepted || version.status !== "REVIEWING") {
    return false;
  }

  return version.feasibilityStatus === "FEASIBLE";
}

export function requestWaitingCopy(request: CustomizationRequestDto): string | null {
  const visibleVersions = (request.versions ?? []).filter(isCustomerVisibleVersion);
  if (visibleVersions.length > 0 || request.acceptedVersion) {
    return null;
  }

  if (request.status === "SUBMITTED") {
    return "Request submitted. A custom version is not ready for review yet.";
  }

  if (request.status === "REVIEWING") {
    return "The design team is preparing this version. You can accept it after production marks it feasible.";
  }

  if (request.status === "CANCELLED") {
    return "This customization request was cancelled.";
  }

  return null;
}
