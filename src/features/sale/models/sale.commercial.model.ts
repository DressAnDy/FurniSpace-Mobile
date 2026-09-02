export type ProposalStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "SELECTED"
  | "ARCHIVED"
  | "CANCELLED"
  | string;

export type ProposalSummaryDto = {
  proposalId: string;
  projectId: string;
  parentProposalId?: string | null;
  proposalName: string;
  description?: string | null;
  versionNo?: number;
  status: ProposalStatus;
  publishedAt?: string | null;
  selectedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ProposalSceneDto = {
  sceneId: string;
  proposalId?: string;
  sceneName: string;
  sceneType?: string;
  projectAreaId?: string | null;
  mongoSceneId?: string | null;
  previewFileId?: string | null;
};

export type ProposalItemDto = {
  proposalItemId: string;
  productNameSnapshot?: string;
  quantity?: number;
  customizationNote?: string | null;
};

export type ProposalDetailDto = ProposalSummaryDto & {
  scenes?: ProposalSceneDto[];
  items?: ProposalItemDto[];
};

export type ProposalListResponseDto = {
  items: ProposalSummaryDto[];
  page?: number;
  limit?: number;
  total?: number;
};

export type UpsertProposalRequestDto = {
  proposalName: string;
  description?: string | null;
};

export type PublishProposalRequestDto = {
  note?: string;
};

export type CreateProposalSceneRequestDto = {
  sceneName: string;
  sceneType?: string;
  projectAreaId?: string | null;
  mongoSceneId?: string | null;
  previewFileId?: string | null;
};

export type UpdateProposalItemRequestDto = {
  quantity?: number;
  customizationNote?: string | null;
};

export type QuotationStatus =
  | "DRAFT"
  | "SENT"
  | "REVISED"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | string;

export type QuotationItemDto = {
  quotationItemId: string;
  productNameSnapshot?: string;
  quantity: number;
  unitPrice: number;
  grossAmount?: number;
  discountAmount: number;
  totalAmount: number;
  isCustomized?: boolean;
};

export type QuotationSummaryDto = {
  quotationId: string;
  projectId: string;
  proposalId?: string | null;
  quotationCode?: string;
  versionNo?: number;
  subtotalAmount?: number;
  totalDiscountAmount?: number;
  preVatAmount?: number;
  vatRate?: number;
  vatAmount?: number;
  totalAmount?: number;
  depositAmount?: number;
  currency?: string;
  status: QuotationStatus;
  validUntil?: string | null;
  customerNote?: string | null;
  salesNote?: string | null;
  revisionReason?: string | null;
};

export type QuotationDetailDto = QuotationSummaryDto & {
  items?: QuotationItemDto[];
};

export type QuotationListResponseDto = {
  items: QuotationSummaryDto[];
  page?: number;
  limit?: number;
  total?: number;
};

export type UpdateQuotationHeaderRequestDto = {
  validUntil?: string | null;
  depositAmount?: number | null;
  customerNote?: string | null;
  salesNote?: string | null;
  revisionReason?: string | null;
};

export type UpdateQuotationItemFinancialsRequestDto = {
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
};

export type BulkQuotationFinancialsRequestDto = {
  items: Array<
    {
      quotationItemId: string;
    } & UpdateQuotationItemFinancialsRequestDto
  >;
};
