export type CustomizationStatus = "SUBMITTED" | "REVIEWING" | "ACCEPTED" | "CANCELLED";

export type CustomizationVersionStatus =
  | "DRAFT"
  | "REVIEWING"
  | "PRODUCTION_REJECTED"
  | "ACCEPTED"
  | "WITHDRAWN";

export type ProductionFeasibilityStatus = "PENDING" | "FEASIBLE" | "NOT_FEASIBLE";

export type CustomizationRequestListQuery = {
  proposalId?: string | null;
  sourceProductVersionId?: string | null;
  status?: CustomizationStatus | null;
};

export type SubmitCustomizationRequestDto = {
  requestTitle: string;
  requestDescription?: string | null;
  requestedWidth?: number | null;
  requestedHeight?: number | null;
  requestedDepth?: number | null;
  requestedMaterial?: string | null;
  requestedColor?: string | null;
  requestedChangeNote?: string | null;
};

export type AcceptCustomizationRequestDto = {
  customizationRequestVersionId: string;
};

export type ApprovedProductVersionSummaryDto = {
  productVersionId?: string | null;
  productId?: string | null;
  productName?: string | null;
  versionName?: string | null;
  versionCode?: string | null;
  material?: string | null;
  color?: string | null;
};

export type CustomizationProductVersionDto = {
  productVersionId?: string | null;
  productId?: string | null;
  versionName?: string | null;
  versionCode?: string | null;
  versionType?: string | null;
  isProjectSpecific?: boolean | null;
  material?: string | null;
  color?: string | null;
  width?: number | null;
  height?: number | null;
  depth?: number | null;
  dimensionUnit?: string | null;
  estimatedPrice?: number | null;
  price?: number | null;
};

export type CustomizationRequestVersionDto = {
  customizationRequestVersionId: string;
  customizationRequestId: string;
  versionNo: number;
  createdByDesignerId?: string | null;
  versionTitle?: string | null;
  designerNote?: string | null;
  status: CustomizationVersionStatus;
  feasibilityStatus: ProductionFeasibilityStatus;
  feasibilityNote?: string | null;
  estimatedProductionDays?: number | null;
  estimatedAdditionalCost?: number | null;
  additionalCostReason?: string | null;
  materialAvailable?: boolean | null;
  productionRiskNote?: string | null;
  alternativeMaterialNote?: string | null;
  submittedForReviewAt?: string | null;
  productionReviewedAt?: string | null;
  productionRejectedAt?: string | null;
  acceptedAt?: string | null;
  withdrawnAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  isAccepted: boolean;
  productVersion: CustomizationProductVersionDto;
};

export type CustomizationRequestDto = {
  customizationRequestId: string;
  projectId: string;
  proposalId: string;
  sourceProductVersionId: string;
  requestedByCustomerId?: string | null;
  requestTitle: string;
  requestDescription?: string | null;
  requestedWidth?: number | null;
  requestedHeight?: number | null;
  requestedDepth?: number | null;
  requestedMaterial?: string | null;
  requestedColor?: string | null;
  requestedChangeNote?: string | null;
  acceptedRequestVersionId?: string | null;
  status?: CustomizationStatus | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  sourceProductVersion?: ApprovedProductVersionSummaryDto | null;
  acceptedVersion?: CustomizationRequestVersionDto | null;
  versions?: CustomizationRequestVersionDto[] | null;
};

export type CustomizationRequestListResponseDto = {
  items: CustomizationRequestDto[];
};
