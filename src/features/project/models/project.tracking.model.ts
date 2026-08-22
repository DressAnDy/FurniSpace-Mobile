import type { ProjectStatus } from "./project.model";

export type MacroStageId =
  | "INTAKE"
  | "DESIGNER_ASSIGNMENT"
  | "DESIGN_REVIEW"
  | "QUOTATION_ORDER"
  | "PRODUCTION"
  | "DELIVERY";

export type MacroStageUiState = "COMPLETED" | "ACTIVE" | "NOT_STARTED";

export type MacroStageItem = {
  id: MacroStageId;
  label: string;
  uiState: MacroStageUiState;
  statuses: ProjectStatus[];
};

export type ProjectTrackingSummary = {
  isRejected: boolean;
  stages: MacroStageItem[];
  activeStageIndex: number;
  progressPercent: number;
  currentStatusLabel: string;
};

export type PhaseDeadlinePhase = "PROPOSAL" | "PRODUCTION";

export type PhaseDeadlineStatus =
  | "PLANNED"
  | "ON_TRACK"
  | "OVERDUE"
  | "COMPLETED_ON_TIME"
  | "COMPLETED_LATE";

export type PhaseDeadlineItemDto = {
  phase: PhaseDeadlinePhase;
  dueDate: string;
  completedAt: string | null;
  status: PhaseDeadlineStatus;
  overdueDays: number;
};

export type PhaseDeadlinesResponseDto = {
  projectId: string;
  targetCompletionDate: string | null;
  deadlines: PhaseDeadlineItemDto[];
};

export type ProjectScheduleType =
  | "MEASUREMENT"
  | "CONSULTATION"
  | "DESIGN_REVIEW"
  | "DELIVERY"
  | "HANDOVER"
  | "OTHER";

export type ProjectScheduleStatus =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | string;

export type ProjectScheduleDto = {
  scheduleId: string;
  projectId: string;
  scheduleType: ProjectScheduleType;
  title?: string | null;
  description?: string | null;
  scheduledAt: string;
  endAt?: string | null;
  location?: string | null;
  projectCode?: string | null;
  projectName?: string | null;
  status: ProjectScheduleStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectScheduleListResponseDto = {
  items: ProjectScheduleDto[];
  page?: number;
  limit?: number;
  total?: number;
};

export type UpdateProjectScheduleStatusRequestDto = {
  status: "CONFIRMED";
};

export type OrderStatus =
  | "PENDING_DEPOSIT"
  | "DEPOSIT_PAID"
  | "IN_PRODUCTION"
  | "READY_FOR_DELIVERY"
  | "DELIVERING"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | string;

export type OrderDto = {
  orderId: string;
  projectId: string;
  orderCode?: string;
  status: OrderStatus;
  totalAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  depositPercent?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderListResponseDto = {
  items: OrderDto[];
  page?: number;
  limit?: number;
  total?: number;
};
