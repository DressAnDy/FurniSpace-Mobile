export type SaleOrderStatus =
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
  | string;

export type SaleOrderItemDto = {
  orderItemId: string;
  productNameSnapshot?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  subtotalAmount?: number;
  status?: string;
};

export type SaleOrderDetailDto = {
  orderId: string;
  projectId: string;
  proposalId?: string | null;
  quotationId?: string | null;
  orderCode?: string;
  customerId?: string;
  salesId?: string;
  vatRate?: number;
  vatAmount?: number;
  originalTotalAmount?: number;
  itemAdjustmentAmount?: number;
  additionalDiscountAmount?: number;
  finalTotalAmount?: number;
  totalAmount?: number;
  depositAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  status: SaleOrderStatus;
  items?: SaleOrderItemDto[];
  createdAt?: string;
  updatedAt?: string;
};

export type SaleOrderListResponseDto = {
  items: SaleOrderDetailDto[];
  page?: number;
  limit?: number;
  total?: number;
};

export type AvailableProductionStaffDto = {
  accountId: string;
  fullName: string;
  email?: string;
  avatarUrl?: string | null;
  accountStatus?: string;
  isAvailable?: boolean;
  activeRequestCount?: number;
};

export type AvailableProductionStaffListResponseDto = {
  items: AvailableProductionStaffDto[];
  page?: number;
  pageSize?: number;
  totalItems?: number;
};

export type CreateProductionRequestDto = {
  assignedTo: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT" | string;
  note?: string | null;
};

export type ProductionRequestDto = {
  productionRequestId: string;
  productionCode?: string;
  projectId: string;
  projectCode?: string;
  projectName?: string;
  orderId: string;
  orderCode?: string;
  assignedTo?: string | null;
  assignedToName?: string | null;
  status: string;
  priority?: string;
  productionDeadline?: string | null;
  actualStartDate?: string | null;
  actualCompletionDate?: string | null;
  note?: string | null;
  items?: unknown[];
};

export type AssignProductionRequestDto = {
  assignedTo: string;
  assignmentNote?: string | null;
};

export type CreateDeliveryRequestDto = {
  projectScheduleId: string;
  note?: string | null;
  items: Array<{
    orderItemId: string;
    quantity: number;
    note?: string | null;
  }>;
};

export type DeliveryDto = {
  deliveryId: string;
  orderId: string;
  projectScheduleId?: string | null;
  status?: string;
  note?: string | null;
  createdAt?: string;
  completedAt?: string | null;
};

export type DeliveryListResponseDto = {
  items: DeliveryDto[];
  page?: number;
  limit?: number;
  total?: number;
};

export type DeliveryTrackingDto = {
  orderId: string;
  status?: string;
  deliveredQuantity?: number;
  totalQuantity?: number;
  remainingQuantity?: number;
  deliveryProgressPercent?: number;
  nextDeliveryAt?: string | null;
};

export type CreateOrderPaymentRequestDto = {
  expiredAt?: string;
  note?: string;
};
