export type QuotationStatus =
  | "DRAFT"
  | "SENT"
  | "REVISION_REQUESTED"
  | "REVISED"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

/** Statuses visible to customer. */
export type CustomerVisibleQuotationStatus =
  | "SENT"
  | "REVISION_REQUESTED"
  | "REVISED"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

export type QuotationDto = {
  quotationId: string;
  projectId: string;
  proposalId: string;
  quotationCode: string;
  versionNo: number;
  subtotalAmount: number;
  totalDiscountAmount: number;
  preVatAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  depositAmount: number;
  depositPercent?: number | null;
  currency: string;
  status: QuotationStatus;
  validUntil: string | null;
  salesNote: string | null;
  revisionReason: string | null;
  rejectReason: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
};

export type QuotationItemDto = {
  quotationItemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalAmount: number;
  isCustomized: boolean;
  productNameSnapshot?: string | null;
  productVersionNameSnapshot?: string | null;
};

export type QuotationDetailDto = QuotationDto & {
  items: QuotationItemDto[];
};

export type QuotationListQuery = {
  status?: QuotationStatus;
  page?: number;
  limit?: number;
};

export type QuotationListResponseDto = {
  items: QuotationDto[];
  page: number;
  limit: number;
  total: number;
};

export type RequestQuotationRevisionRequestDto = {
  revisionReason: string;
};

export type RejectQuotationRequestDto = {
  rejectReason: string;
};
