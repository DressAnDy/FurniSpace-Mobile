import type { ProjectStatus } from "../models/project.model";
import type {
  MacroStageId,
  MacroStageItem,
  MacroStageUiState,
  PhaseDeadlineItemDto,
  PhaseDeadlineStatus,
  ProjectTrackingSummary,
} from "../models/project.tracking.model";
import { getProjectStatusLabel } from "./project.mapper";

export const PROJECT_WORKFLOW_STAGE_CATALOG: ReadonlyArray<{
  id: MacroStageId;
  label: string;
  statuses: readonly ProjectStatus[];
}> = [
  {
    id: "INTAKE",
    label: "Intake & Consultation",
    statuses: ["SUBMITTED", "IN_CONSULTATION", "NEED_BASIC_INFORMATION"],
  },
  {
    id: "DESIGNER_ASSIGNMENT",
    label: "Designer Assignment & Measurement",
    statuses: ["WAITING_FOR_DESIGNER_ASSIGNMENT", "MEASUREMENT_REQUIRED", "SPACE_VERIFIED"],
  },
  {
    id: "DESIGN_REVIEW",
    label: "Design & Proposal",
    statuses: ["PROPOSAL_CONSULTING", "PROPOSAL_SELECTED"],
  },
  {
    id: "QUOTATION_ORDER",
    label: "Quotation & Order",
    statuses: ["QUOTATION_SENT", "QUOTATION_REVISION_REQUESTED", "ORDER_CONFIRMED"],
  },
  {
    id: "PRODUCTION",
    label: "Production",
    statuses: ["IN_PRODUCTION", "READY_FOR_DELIVERY"],
  },
  {
    id: "DELIVERY",
    label: "Delivery & Completion",
    statuses: ["DELIVERING", "DELIVERED", "COMPLETED"],
  },
] as const;

const PHASE_DEADLINE_LABELS: Record<PhaseDeadlineItemDto["phase"], string> = {
  PROPOSAL: "Proposal",
  PRODUCTION: "Production",
};

const PHASE_DEADLINE_STATUS_LABELS: Record<PhaseDeadlineStatus, string> = {
  PLANNED: "Planned",
  ON_TRACK: "On track",
  OVERDUE: "Overdue",
  COMPLETED_ON_TIME: "On time",
  COMPLETED_LATE: "Late",
};

export function resolveActiveStageIndex(status: ProjectStatus): number {
  if (status === "REJECTED") {
    return -1;
  }

  const index = PROJECT_WORKFLOW_STAGE_CATALOG.findIndex((stage) => stage.statuses.includes(status));
  return index >= 0 ? index : 0;
}

function resolveStageUiState(stageIndex: number, activeStageIndex: number): MacroStageUiState {
  if (stageIndex < activeStageIndex) {
    return "COMPLETED";
  }

  if (stageIndex === activeStageIndex) {
    return "ACTIVE";
  }

  return "NOT_STARTED";
}

export function buildProjectTrackingSummary(status: ProjectStatus): ProjectTrackingSummary {
  if (status === "REJECTED") {
    return {
      isRejected: true,
      stages: [],
      activeStageIndex: -1,
      progressPercent: 0,
      currentStatusLabel: getProjectStatusLabel(status),
    };
  }

  const activeStageIndex = resolveActiveStageIndex(status);
  const stages: MacroStageItem[] = PROJECT_WORKFLOW_STAGE_CATALOG.map((stage, index) => ({
    id: stage.id,
    label: stage.label,
    statuses: [...stage.statuses],
    uiState: resolveStageUiState(index, activeStageIndex),
  }));

  const completedCount = stages.filter((stage) => stage.uiState === "COMPLETED").length;
  const activeCount = stages.some((stage) => stage.uiState === "ACTIVE") ? 0.5 : 0;
  const progressPercent = Math.round(((completedCount + activeCount) / stages.length) * 100);

  return {
    isRejected: false,
    stages,
    activeStageIndex,
    progressPercent,
    currentStatusLabel: getProjectStatusLabel(status),
  };
}

export function formatTrackingDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function computeDaysUntil(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const target = new Date(value);
  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getPhaseDeadlineMetricLabel(deadlines: PhaseDeadlineItemDto[]): string {
  if (deadlines.length === 0) {
    return "—";
  }

  const active = deadlines.find((item) => item.status === "ON_TRACK" || item.status === "OVERDUE");
  const target = active ?? deadlines[deadlines.length - 1];
  const phaseLabel = PHASE_DEADLINE_LABELS[target.phase];
  const statusLabel = PHASE_DEADLINE_STATUS_LABELS[target.status] ?? target.status;
  return `${phaseLabel}: ${statusLabel}`;
}

export function getPhaseDeadlineStatusColor(status: PhaseDeadlineStatus): string {
  switch (status) {
    case "OVERDUE":
    case "COMPLETED_LATE":
      return "#DC2626";
    case "COMPLETED_ON_TIME":
      return "#16A34A";
    case "ON_TRACK":
      return "#C9A86A";
    default:
      return "#7A6F68";
  }
}

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
