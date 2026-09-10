export type DesignerDashboardScope = "mine" | "team" | "all";
export type DesignerDateRange = "today" | "thisWeek" | "thisMonth";
export type DesignerDueBucket = "OVERDUE" | "TODAY" | "THIS_WEEK" | "LATER" | string;
export type DesignerPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW" | string;

export type DesignerKpisDto = {
  measurementDue: number;
  proposalsInProgress: number;
  revisionRequested: number;
  overdueTasks: number;
};

export type DesignerKpisQuery = {
  scope?: DesignerDashboardScope;
  dateRange?: DesignerDateRange;
  search?: string;
};

export type DesignerWorkQueueItemDto = {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  customerName: string;
  assigneeName?: string | null;
  group: string;
  phase: string;
  status: string;
  priority: DesignerPriority;
  action: string;
  actionPath?: string | null;
  dueAt?: string | null;
  dueBucket?: DesignerDueBucket | null;
  warning?: string | null;
  lastUpdatedAt?: string | null;
};

export type DesignerWorkQueueResponseDto = {
  items: DesignerWorkQueueItemDto[];
  countsByGroup?: Record<string, number>;
  page: number;
  limit: number;
  total: number;
};

export type DesignerWorkQueueQuery = {
  scope?: DesignerDashboardScope;
  group?: string;
  dateRange?: DesignerDateRange;
  priority?: DesignerPriority;
  search?: string;
  page?: number;
  limit?: number;
};

export type DesignerCatalogVersionSummaryDto = {
  productVersionId: string;
  versionCode?: string | null;
  versionName: string;
  versionType?: string | null;
  material?: string | null;
  color?: string | null;
  width?: number | null;
  height?: number | null;
  depth?: number | null;
  dimensionUnit?: string | null;
  estimatedPrice?: number | null;
  isProjectSpecific?: boolean | null;
};

export type DesignerCatalogProductDto = {
  productId: string;
  productCode?: string | null;
  productName: string;
  categoryId?: string | null;
  categoryName?: string | null;
  businessTypeIds?: number[] | null;
  thumbnail?: string | null;
  eligibleVersionCount: number;
  eligibleVersions: DesignerCatalogVersionSummaryDto[];
};

export type DesignerCatalogProductListResponseDto = {
  items: DesignerCatalogProductDto[];
  page: number;
  pageSize: number;
  total: number;
};

export type DesignerCatalogProductsQuery = {
  keyword?: string;
  categoryId?: string;
  businessTypeId?: number;
  versionType?: string;
  page?: number;
  pageSize?: number;
};

export type CreateProposalRequestDto = {
  proposalName: string;
  description?: string | null;
};

export type UpdateProposalRequestDto = {
  proposalName: string;
  description?: string | null;
};

export type PublishProposalRequestDto = {
  note?: string | null;
};

export type PublishProposalResponseDto = {
  proposalId: string;
  projectId: string;
  proposalStatus: string;
  publishedAt?: string | null;
  projectStatus?: string | null;
};

export type ReopenProposalResponseDto = {
  proposalId: string;
  projectId: string;
  proposalStatus: string;
  projectStatus?: string | null;
  updatedAt?: string | null;
};

export type CreateProposalSceneRequestDto = {
  sceneName: string;
  sceneType?: "TWO_D" | "THREE_D" | string;
  sortOrder?: number;
};

export type UploadMeasurementImageInput = {
  scheduleId: string;
  uri: string;
  name: string;
  mimeType?: string | null;
  note?: string;
  projectAreaId?: string | null;
  visibility?: string;
};

export type MeasurementImageUploadResponseDto = {
  scheduleId?: string;
  file: {
    fileId: string;
    fileLinkId?: string;
    projectId?: string;
    originalFileName?: string;
    fileName?: string;
    mimeType?: string | null;
    publicUrl?: string | null;
    uploadedAt?: string | null;
    referenceId?: string;
    referenceType?: string;
  };
  areaLink?: {
    fileId: string;
    fileLinkId: string;
    projectAreaId: string;
  } | null;
};
