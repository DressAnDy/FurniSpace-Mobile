import { ProjectDetailDto, ProjectAssigneeDto, ProjectListItemDto, ProjectStatus, ProjectSummaryItem } from "../models/project.model";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  SUBMITTED: "Submitted",
  IN_CONSULTATION: "In Consultation",
  NEED_BASIC_INFORMATION: "Need Information",
  WAITING_FOR_DESIGNER_ASSIGNMENT: "Waiting for Designer",
  MEASUREMENT_REQUIRED: "Measurement Required",
  SPACE_VERIFIED: "Space Verified",
  PROPOSAL_CONSULTING: "Proposal Consulting",
  PROPOSAL_SELECTED: "Proposal Selected",
  QUOTATION_SENT: "Quotation Sent",
  QUOTATION_REVISION_REQUESTED: "Quotation Revision",
  ORDER_CONFIRMED: "Order Confirmed",
  IN_PRODUCTION: "In Production",
  READY_FOR_DELIVERY: "Ready for Delivery",
  DELIVERING: "Delivering",
  AWAITING_CUSTOMER_CONFIRMATION: "Awaiting Customer Confirmation",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

/** Pipeline order for Sales project lists — earlier = higher priority. */
export const PROJECT_STATUS_FLOW_ORDER: readonly ProjectStatus[] = [
  "SUBMITTED",
  "IN_CONSULTATION",
  "NEED_BASIC_INFORMATION",
  "WAITING_FOR_DESIGNER_ASSIGNMENT",
  "MEASUREMENT_REQUIRED",
  "SPACE_VERIFIED",
  "PROPOSAL_CONSULTING",
  "PROPOSAL_SELECTED",
  "QUOTATION_SENT",
  "QUOTATION_REVISION_REQUESTED",
  "ORDER_CONFIRMED",
  "IN_PRODUCTION",
  "READY_FOR_DELIVERY",
  "DELIVERING",
  "AWAITING_CUSTOMER_CONFIRMATION",
  "DELIVERED",
  "COMPLETED",
] as const;

const PROJECT_STATUS_FLOW_RANK = new Map<string, number>(
  PROJECT_STATUS_FLOW_ORDER.map((status, index) => [status, index]),
);

export function getProjectStatusFlowRank(status: string | null | undefined): number {
  const normalized = (status ?? "").trim().toUpperCase().replace(/\s+/g, "_");
  if (normalized === "REJECTED") {
    return PROJECT_STATUS_FLOW_ORDER.length;
  }
  return PROJECT_STATUS_FLOW_RANK.get(normalized) ?? PROJECT_STATUS_FLOW_ORDER.length + 1;
}

export function compareProjectsByStatusFlow(
  left: { status: string; submittedAt?: string | null },
  right: { status: string; submittedAt?: string | null },
): number {
  const rankDiff = getProjectStatusFlowRank(left.status) - getProjectStatusFlowRank(right.status);
  if (rankDiff !== 0) {
    return rankDiff;
  }

  const leftTime = left.submittedAt ? new Date(left.submittedAt).getTime() : 0;
  const rightTime = right.submittedAt ? new Date(right.submittedAt).getTime() : 0;
  return rightTime - leftTime;
}

export function getProjectStatusLabel(status: ProjectStatus): string {
  return STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function mapProjectListItemToSummary(dto: ProjectListItemDto): ProjectSummaryItem {
  return {
    projectId: dto.projectId,
    projectCode: dto.projectCode,
    projectName: dto.projectName,
    businessType: dto.businessType,
    status: dto.status,
    statusLabel: getProjectStatusLabel(dto.status),
    submittedAt: dto.submittedAt,
    hasSalesAssigned: Boolean(dto.assignedSalesId),
    hasDesignerAssigned: Boolean(dto.assignedDesignerId),
  };
}

export function pickLatestProject(projects: ProjectSummaryItem[]): ProjectSummaryItem | null {
  if (projects.length === 0) {
    return null;
  }

  return [...projects].sort(
    (left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime(),
  )[0];
}

export function pickDefaultActiveProject(projects: ProjectSummaryItem[]): ProjectSummaryItem | null {
  if (projects.length === 0) {
    return null;
  }

  const active = projects.find((project) => project.status !== "COMPLETED" && project.status !== "REJECTED");
  return active ?? projects[0];
}

export function normalizeProjectDetailDto(dto: ProjectDetailDto): ProjectDetailDto {
  const assignedDesignerId = dto.assignedDesignerId ?? dto.assignedDesigner?.accountId ?? null;
  const assignedSalesId = dto.assignedSalesId ?? dto.assignedSales?.accountId ?? null;

  return {
    ...dto,
    assignedDesignerId,
    assignedSalesId,
    assignedDesigner: dto.assignedDesigner?.fullName?.trim() ? dto.assignedDesigner : null,
    assignedSales: dto.assignedSales?.fullName?.trim() ? dto.assignedSales : null,
  };
}

export function resolveProjectMemberDisplay(
  assignee: ProjectAssigneeDto | null | undefined,
  assigneeId: string | null | undefined,
  currentUser?: { accountId: string; fullName: string } | null,
  fallbackLabel = "Assigned",
): { memberId: string | null; fullName: string | null; isAssigned: boolean } {
  const memberId = assigneeId ?? assignee?.accountId ?? null;
  const resolvedName =
    assignee?.fullName?.trim() ||
    (currentUser && memberId === currentUser.accountId ? currentUser.fullName.trim() : "") ||
    (memberId ? fallbackLabel : "");

  return {
    memberId,
    fullName: resolvedName || null,
    isAssigned: Boolean(memberId),
  };
}
