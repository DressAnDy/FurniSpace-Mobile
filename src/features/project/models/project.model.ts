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

export type ProjectDetailDto = {
  projectId: string;
  customerId: string;
  assignedSalesId: string | null;
  assignedDesignerId: string | null;
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
};

export type ProjectListResponseDto = {
  items: ProjectListItemDto[];
  page: number;
  limit: number;
  total: number;
};

export type ProjectListQuery = {
  status?: ProjectStatus;
  search?: string;
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
