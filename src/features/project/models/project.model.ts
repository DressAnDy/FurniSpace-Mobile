export type ProjectStatus =
  | "SUBMITTED"
  | "IN_CONSULTATION"
  | "NEED_BASIC_INFORMATION"
  | "WAITING_FOR_DESIGNER_ASSIGNMENT"
  | "MEASUREMENT_REQUIRED"
  | "SPACE_VERIFIED"
  | "PROPOSAL_CONSULTING"
  | "PROPOSAL_SELECTED"
  | "QUOTATION_SENT"
  | "QUOTATION_REVISION_REQUESTED"
  | "ORDER_CONFIRMED"
  | "IN_PRODUCTION"
  | "READY_FOR_DELIVERY"
  | "DELIVERING"
  | "DELIVERED"
  | "COMPLETED"
  | "REJECTED";

export type ProjectListItemDto = {
  projectId: string;
  projectCode: string;
  projectName: string;
  businessType: string;
  status: ProjectStatus;
  customerId: string;
  assignedSalesId: string | null;
  assignedDesignerId: string | null;
  submittedAt: string;
};

export type ProjectAssigneeDto = {
  accountId: string;
  fullName: string;
};

export type ProjectPhaseDeadlineDto = {
  phase: "PROPOSAL" | "PRODUCTION";
  dueDate: string;
  startedAt?: string | null;
  completedAt: string | null;
  status: "PLANNED" | "ON_TRACK" | "OVERDUE" | "COMPLETED_ON_TIME" | "COMPLETED_LATE";
  overdueDays: number;
};

export type ProjectDeliverySummaryDto = {
  status: string;
  deliveredQuantity: number;
  totalQuantity: number;
  remainingQuantity: number;
  deliveryProgressPercent: number;
  nextDeliveryAt: string | null;
};

export type ProjectDetailDto = {
  projectId: string;
  customerId: string;
  assignedSalesId: string | null;
  assignedDesignerId: string | null;
  assignedSales?: ProjectAssigneeDto | null;
  assignedDesigner?: ProjectAssigneeDto | null;
  projectCode: string;
  projectName: string;
  businessType: string;
  projectAddress: string | null;
  businessPurpose: string | null;
  furnitureRequirement: string | null;
  description: string | null;
  totalAreaSqm: number | null;
  numberOfFloors: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  targetCompletionDate: string | null;
  status: ProjectStatus;
  submittedAt: string;
  phaseDeadlines?: ProjectPhaseDeadlineDto[];
  deliverySummary?: ProjectDeliverySummaryDto | null;
};

export type ProjectListResponseDto = {
  items: ProjectListItemDto[];
  page: number;
  limit: number;
  total: number;
};

export type ProjectByUserItemDto = {
  projectId: string;
  projectCode: string;
  projectName: string;
  businessType: string;
  projectAddress?: string | null;
  totalAreaSqm?: number | null;
  numberOfFloors?: number | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  targetCompletionDate?: string | null;
  status: ProjectStatus;
  customer?: {
    accountId: string;
    fullName: string;
    email?: string;
    phone?: string;
  } | null;
  assignedSales: ProjectAssigneeDto | null;
  assignedDesigner: ProjectAssigneeDto | null;
  submittedAt: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectByUserListResponseDto = {
  items: ProjectByUserItemDto[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ProjectListQuery = {
  status?: ProjectStatus;
  search?: string;
  assignedSalesId?: string;
  assignedDesignerId?: string;
  page?: number;
  limit?: number;
};

export type CreateProjectRequestDto = {
  projectName: string;
  businessType: string;
  furnitureRequirement: string;
  projectAddress?: string;
  businessPurpose?: string;
  description?: string;
  totalAreaSqm?: number;
  numberOfFloors?: number;
  budgetMin?: number;
  budgetMax?: number;
  targetCompletionDate?: string;
};

export type UpdateProjectBasicInfoRequestDto = CreateProjectRequestDto;

export type UpdateTargetCompletionDateRequestDto = {
  targetCompletionDate: string;
};

export type ProjectSummaryItem = {
  projectId: string;
  projectCode: string;
  projectName: string;
  businessType: string;
  status: ProjectStatus;
  statusLabel: string;
  submittedAt: string;
  hasSalesAssigned: boolean;
  hasDesignerAssigned: boolean;
};
