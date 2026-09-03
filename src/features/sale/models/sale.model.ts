export type SaleDashboardScope = "mine" | "team" | "all";

export type SaleDateRange = "today" | "thisWeek" | "thisMonth";

export type SaleActionGroup =
  | "Intake"
  | "Design"
  | "Proposal and Quotation"
  | "Order and Payment"
  | "Delivery";

export type SaleActionPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW" | string;

export type SaleDueBucket = "OVERDUE" | "TODAY" | "THIS_WEEK" | "LATER" | string;

export type SalesKpisDto = {
  newRequests: number;
  waitingCustomer: number;
  paymentFollowUp: number;
  overdueTasks: number;
  activeProjects: number;
};

export type SalesKpisQuery = {
  scope?: SaleDashboardScope;
  dateRange?: SaleDateRange;
  search?: string;
};

export type SalesActionQueueItemDto = {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  customerName: string;
  assigneeName?: string | null;
  group: SaleActionGroup | string;
  phase: string;
  status: string;
  priority: SaleActionPriority;
  action: string;
  actionPath?: string | null;
  dueAt?: string | null;
  dueBucket?: SaleDueBucket | null;
  warning?: string | null;
  lastUpdatedAt?: string | null;
};

export type SalesActionQueueResponseDto = {
  items: SalesActionQueueItemDto[];
  countsByGroup?: Record<string, number>;
  page: number;
  limit: number;
  total: number;
};

export type SalesActionQueueQuery = {
  scope?: SaleDashboardScope;
  group?: SaleActionGroup | string;
  dateRange?: SaleDateRange;
  priority?: SaleActionPriority;
  search?: string;
  page?: number;
  limit?: number;
};

export type ClaimSalesAssignmentRequestDto = {
  note?: string;
};

export type ClaimSalesAssignmentResponseDto = {
  projectId: string;
  assignedSalesId: string;
  status: string;
  salesAssignedAt: string;
  salesChat?: {
    chatId: string;
    projectId: string;
    chatType: string;
    status: string;
    title: string;
  } | null;
};

export type RequestProjectInformationDto = {
  message: string;
};

export type RequestProjectInformationResponseDto = {
  projectId: string;
  status: string;
  requestedAt: string;
};

export type SaleMetricCard = {
  value: string;
  label: string;
  color: string;
};

export type SaleAlertCard = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  code: string;
  color: string;
  priority: string;
};

export type DashboardPhaseDeadlinePhase = "PROPOSAL" | "PRODUCTION";

export type DashboardPhaseDeadlineStatus =
  | "OVERDUE"
  | "ON_TRACK"
  | "COMPLETED_ON_TIME"
  | "COMPLETED_LATE";

export type DashboardPhaseDeadlineItemDto = {
  projectId: string;
  projectCode: string;
  projectName: string;
  phase: DashboardPhaseDeadlinePhase;
  dueDate: string;
  completedAt: string | null;
  projectStatus: string;
  assignedSalesId: string | null;
  assignedSalesName: string | null;
  assignedDesignerId: string | null;
  assignedDesignerName: string | null;
  assignedProductionId: string | null;
  assignedProductionName: string | null;
  status: DashboardPhaseDeadlineStatus;
  group: string;
  days: number;
};

export type DashboardPhaseDeadlinesQuery = {
  phase?: DashboardPhaseDeadlinePhase;
  status?: DashboardPhaseDeadlineStatus;
  salesId?: string;
  designerId?: string;
  productionId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type DashboardPhaseDeadlinesResponseDto = {
  items: DashboardPhaseDeadlineItemDto[];
  countsByGroup: Record<string, number>;
  page: number;
  limit: number;
  total: number;
};
