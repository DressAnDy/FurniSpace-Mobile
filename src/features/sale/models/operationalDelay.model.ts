export type OperationalDelayPhase = "PRODUCTION" | "DELIVERY";
export type OperationalDelayState = "AT_RISK" | "OVERDUE";

export type ProductionDelayReasonCode =
  | "MATERIAL_DELAY"
  | "TECHNICAL_ISSUE"
  | "CUSTOMIZATION_ISSUE"
  | "CAPACITY_CONSTRAINT"
  | "QUALITY_REWORK"
  | "DEPENDENCY_DELAY"
  | "OTHER";

export const PRODUCTION_DELAY_REASON_CODES: ProductionDelayReasonCode[] = [
  "MATERIAL_DELAY",
  "TECHNICAL_ISSUE",
  "CUSTOMIZATION_ISSUE",
  "CAPACITY_CONSTRAINT",
  "QUALITY_REWORK",
  "DEPENDENCY_DELAY",
  "OTHER",
];

export type DeliveryDelayReasonCode =
  | "CUSTOMER_RESCHEDULE"
  | "VEHICLE_ISSUE"
  | "PRODUCT_NOT_READY"
  | "SITE_NOT_READY"
  | "STAFF_UNAVAILABLE"
  | "WEATHER"
  | "ACCESS_RESTRICTION"
  | "OTHER";

export const DELIVERY_DELAY_REASON_CODES: DeliveryDelayReasonCode[] = [
  "CUSTOMER_RESCHEDULE",
  "VEHICLE_ISSUE",
  "PRODUCT_NOT_READY",
  "SITE_NOT_READY",
  "STAFF_UNAVAILABLE",
  "WEATHER",
  "ACCESS_RESTRICTION",
  "OTHER",
];

export type OperationalDelayReportDto = {
  operationalDelayReportId: string;
  projectId: string;
  projectName: string | null;
  reportPhase: OperationalDelayPhase;
  productionRequestId: string | null;
  orderId: string | null;
  deliveryId: string | null;
  deadlineSnapshot: string;
  delayState: OperationalDelayState;
  productionReasonCode: string | null;
  deliveryReasonCode: string | null;
  reasonDetail: string;
  reportedBy: string;
  reporterName: string | null;
  reportedAt: string;
  createdAt: string;
};

export type OperationalDelayReportListDto = {
  items: OperationalDelayReportDto[];
};

export type CreateProductionDelayReportInput = {
  projectId: string;
  productionRequestId: string;
  productionReasonCode: ProductionDelayReasonCode;
  reasonDetail: string;
};

export type CreateDeliveryDelayReportInput = {
  projectId: string;
  orderId?: string | null;
  deliveryId?: string | null;
  deliveryReasonCode: DeliveryDelayReasonCode;
  reasonDetail: string;
};
