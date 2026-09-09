export type DeliveryProductIssueType =
  | "DAMAGED"
  | "WRONG_ITEM"
  | "WRONG_SPECIFICATION"
  | "MISSING_PART"
  | "QUALITY_DEFECT"
  | "INSTALLATION_ISSUE"
  | "QUANTITY_MISMATCH"
  | "OTHER";

export const DELIVERY_PRODUCT_ISSUE_TYPES: DeliveryProductIssueType[] = [
  "DAMAGED",
  "WRONG_ITEM",
  "WRONG_SPECIFICATION",
  "MISSING_PART",
  "QUALITY_DEFECT",
  "INSTALLATION_ISSUE",
  "QUANTITY_MISMATCH",
  "OTHER",
];

export type ProductIssueEvidenceFileDto = {
  fileId: string;
  fileLinkId: string;
  originalFileName: string;
  fileUrl: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
};

export type ProductIssueReportDto = {
  deliveryProductIssueReportId: string;
  projectId: string;
  projectName: string | null;
  orderId: string;
  orderItemId: string;
  productNameSnapshot: string | null;
  deliveryItemId: string | null;
  issueType: DeliveryProductIssueType;
  description: string;
  affectedQuantity: number | null;
  reportedBy: string;
  reporterName: string | null;
  reportedAt: string;
  createdAt: string;
  evidenceFiles?: ProductIssueEvidenceFileDto[];
};

export type ProductIssueReportListDto = {
  items: ProductIssueReportDto[];
};

export type ProductIssueEvidenceLocalFile = {
  uri: string;
  name: string;
  mimeType?: string | null;
};

export type CreateProductIssueInput = {
  orderId: string;
  orderItemId: string;
  deliveryItemId?: string | null;
  issueType: DeliveryProductIssueType;
  description: string;
  affectedQuantity?: number | null;
  files?: ProductIssueEvidenceLocalFile[];
};
