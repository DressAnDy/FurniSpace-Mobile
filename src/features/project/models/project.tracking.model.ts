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
  startedAt?: string | null;
  completedAt: string | null;
  status: PhaseDeadlineStatus;
  overdueDays: number;
};

export type PhaseDeadlinesResponseDto = {
  projectId: string;
  targetCompletionDate: string | null;
  deadlines: PhaseDeadlineItemDto[];
};

export type DeliverySummaryDto = {
  status: string;
  deliveredQuantity: number;
  totalQuantity: number;
  remainingQuantity: number;
  deliveryProgressPercent: number;
  nextDeliveryAt: string | null;
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
  projectAreaId?: string | null;
  createdBy?: string | null;
  assignedStaffId?: string | null;
  scheduleType: ProjectScheduleType;
  title?: string | null;
  description?: string | null;
  /** BE field */
  scheduledStart: string;
  /** BE field */
  scheduledEnd?: string | null;
  /** Legacy fallback from older payloads */
  scheduledAt?: string;
  endAt?: string | null;
  location?: string | null;
  projectCode?: string | null;
  projectName?: string | null;
  status: ProjectScheduleStatus;
  customerNote?: string | null;
  internalNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string | null;
  completedAt?: string | null;
  canMoveToProposalConsulting?: boolean | null;
};

export type ProjectScheduleListResponseDto = {
  items: ProjectScheduleDto[];
  page?: number;
  limit?: number;
  total?: number;
};

export type UpdateProjectScheduleStatusRequestDto = {
  status: "CONFIRMED";
  note?: string;
};

export type OrderStatus =
  | "CREATED"
  | "DEPOSIT_PENDING"
  | "DEPOSIT_PAID"
  | "IN_PRODUCTION"
  | "READY_FOR_DELIVERY"
  | "DELIVERING"
  | "AWAITING_CUSTOMER_CONFIRMATION"
  | "DELIVERED"
  | "FINAL_PAYMENT_PENDING"
  | "COMPLETED"
  | "CANCELLED"
  /** Legacy aliases kept for resilience */
  | "PENDING_DEPOSIT"
  | string;

export type OrderDto = {
  orderId: string;
  projectId: string;
  quotationId?: string | null;
  orderCode?: string;
  status: OrderStatus;
  totalAmount?: number;
  depositAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  depositPercent?: number;
  deliveryAddress?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  customerConfirmedDeliveryAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderListResponseDto = {
  items: OrderDto[];
  page?: number;
  limit?: number;
  total?: number;
};

export type UpdateOrderDeliveryDetailsRequestDto = {
  deliveryAddress: string;
  receiverName: string;
  receiverPhone: string;
};

export type ConfirmOrderDeliveryResponseDto = {
  orderId: string;
  projectId: string;
  orderStatus: OrderStatus;
  projectStatus: ProjectStatus | string;
  customerConfirmedDeliveryAt: string;
};

export type ReopenProjectProposalResponseDto = {
  projectId: string;
  oldStatus: ProjectStatus | string;
  newStatus: ProjectStatus | string;
  orderId?: string | null;
  orderStatus?: OrderStatus | string | null;
  quotationId?: string | null;
  quotationStatus?: string | null;
  selectedProposalId?: string | null;
  selectedProposalStatus?: string | null;
  restoredProposalCount?: number;
  updatedAt?: string;
};
