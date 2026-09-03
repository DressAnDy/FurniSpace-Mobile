import type { ProjectListItemDto, ProjectStatus } from "../../project/models/project.model";
import { getProjectStatusLabel } from "../../project/utils/project.mapper";
import type {
  SaleActionPriority,
  SaleAlertCard,
  SaleMetricCard,
  SalesActionQueueItemDto,
  SalesKpisDto,
} from "../models/sale.model";

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "#FB2C36",
  HIGH: "#FF6900",
  MEDIUM: "#FFB900",
  LOW: "#51A2FF",
};

const STATUS_COLORS: Partial<Record<ProjectStatus, string>> = {
  WAITING_FOR_DESIGNER_ASSIGNMENT: "#E17100",
  PROPOSAL_CONSULTING: "#9810FA",
  ORDER_CONFIRMED: "#009966",
  DELIVERING: "#0092B8",
  IN_PRODUCTION: "#497D00",
  READY_FOR_DELIVERY: "#155DFC",
  NEED_BASIC_INFORMATION: "#FF8904",
  SUBMITTED: "#C9A86A",
  IN_CONSULTATION: "#3A6B9A",
};

export function mapSalesKpisToMetrics(kpis: SalesKpisDto): SaleMetricCard[] {
  return [
    { value: String(kpis.newRequests), label: "New requests", color: "#C9A86A" },
    { value: String(kpis.activeProjects), label: "Active", color: "#3A3330" },
    { value: String(kpis.waitingCustomer), label: "Waiting", color: "#7A6F68" },
    { value: String(kpis.paymentFollowUp), label: "Payments", color: "#DC2626" },
    { value: String(kpis.overdueTasks), label: "Overdue", color: "#DC2626" },
  ];
}

export function getPriorityColor(priority: SaleActionPriority | string): string {
  return PRIORITY_COLORS[String(priority).toUpperCase()] ?? "#7A6F68";
}

export function mapActionQueueToAlerts(items: SalesActionQueueItemDto[]): SaleAlertCard[] {
  return items.slice(0, 8).map((item) => ({
    id: item.id,
    projectId: item.projectId,
    title: item.action || item.group,
    description: item.warning || item.customerName || item.phase,
    code: item.projectCode,
    color: getPriorityColor(item.priority),
    priority: formatPriorityLabel(item.priority),
  }));
}

export function formatPriorityLabel(priority: string): string {
  const normalized = priority.trim();
  if (!normalized) {
    return "Medium";
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
}

export function formatSaleDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function getStatusColor(status: ProjectStatus | string): string {
  return STATUS_COLORS[status as ProjectStatus] ?? "#7A6F68";
}

export function mapProjectToSaleRequestCard(item: ProjectListItemDto) {
  return {
    projectId: item.projectId,
    projectCode: item.projectCode,
    name: item.projectName,
    customer: "—",
    type: item.businessType || "—",
    area: "—",
    budget: "—",
    submitted: formatSaleDate(item.submittedAt),
    status: getProjectStatusLabel(item.status),
    rawStatus: item.status,
    priority: inferRequestPriority(item.status, item.submittedAt),
  };
}

export function mapProjectToSaleProjectCard(item: ProjectListItemDto) {
  return {
    projectId: item.projectId,
    projectCode: item.projectCode,
    name: item.projectName,
    customer: "—",
    type: item.businessType || "—",
    designer: item.assignedDesignerId ? "Assigned" : "—",
    target: "—",
    status: getProjectStatusLabel(item.status),
    rawStatus: item.status,
    nextAction: inferNextAction(item.status),
    color: getStatusColor(item.status),
  };
}

function inferRequestPriority(status: ProjectStatus, submittedAt: string): "urgent" | "high" | "medium" {
  const ageHours = (Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60);
  if (status === "SUBMITTED" && ageHours >= 48) {
    return "urgent";
  }
  if (status === "SUBMITTED" || status === "NEED_BASIC_INFORMATION") {
    return "high";
  }
  return "medium";
}

function inferNextAction(status: ProjectStatus): string {
  switch (status) {
    case "SUBMITTED":
      return "Review request";
    case "NEED_BASIC_INFORMATION":
      return "Wait for customer info";
    case "IN_CONSULTATION":
      return "Collect start fee / verify info";
    case "WAITING_FOR_DESIGNER_ASSIGNMENT":
      return "Assign Designer";
    case "MEASUREMENT_REQUIRED":
      return "Schedule measurement";
    case "PROPOSAL_CONSULTING":
      return "Follow proposal";
    case "QUOTATION_SENT":
      return "Follow quotation";
    case "ORDER_CONFIRMED":
      return "Follow deposit";
    case "IN_PRODUCTION":
      return "Track production";
    case "DELIVERING":
      return "Track delivery";
    default:
      return getProjectStatusLabel(status);
  }
}

export function getInitials(fullName: string | null | undefined): string {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "FS";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const ACTION_GROUP_ORDER = [
  "Intake",
  "Design",
  "Proposal and Quotation",
  "Order and Payment",
  "Delivery",
] as const;

export function normalizeComparableText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function isSameProjectText(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeComparableText(a);
  const right = normalizeComparableText(b);
  return left.length > 0 && left === right;
}

function splitProjectRequirementItems(value: string | null | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildProjectOverviewContent(project: {
  description: string | null;
  businessPurpose: string | null;
  furnitureRequirement: string | null;
}): {
  brief: string | null;
  businessPurpose: string | null;
  furnitureItems: string[];
} {
  const description = project.description?.trim() ?? "";
  const businessPurpose = project.businessPurpose?.trim() ?? "";
  const seenFurniture = new Set<string>();

  const furnitureItems = splitProjectRequirementItems(project.furnitureRequirement).filter((item) => {
    const key = normalizeComparableText(item);
    if (!key || seenFurniture.has(key)) {
      return false;
    }
    if (isSameProjectText(item, description) || isSameProjectText(item, businessPurpose)) {
      return false;
    }
    seenFurniture.add(key);
    return true;
  });

  const showBusinessPurpose = Boolean(businessPurpose) && !isSameProjectText(businessPurpose, description);

  if (description) {
    return {
      brief: description,
      businessPurpose: showBusinessPurpose ? businessPurpose : null,
      furnitureItems,
    };
  }

  if (showBusinessPurpose) {
    return {
      brief: null,
      businessPurpose,
      furnitureItems,
    };
  }

  if (furnitureItems.length > 0) {
    return {
      brief: null,
      businessPurpose: null,
      furnitureItems,
    };
  }

  return {
    brief: "No project brief provided yet.",
    businessPurpose: null,
    furnitureItems: [],
  };
}
