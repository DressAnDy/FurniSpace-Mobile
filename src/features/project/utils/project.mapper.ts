import { ProjectListItemDto, ProjectStatus, ProjectSummaryItem } from "../models/project.model";

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
  ORDER_CONFIRMED: "Order Confirmed",
  IN_PRODUCTION: "In Production",
  READY_FOR_DELIVERY: "Ready for Delivery",
  DELIVERING: "Delivering",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

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
