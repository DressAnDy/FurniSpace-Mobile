export type OrderStatus =
  | "CREATED"
  | "DEPOSIT_PENDING"
  | "DEPOSIT_PAID"
  | "IN_PRODUCTION"
  | "READY_FOR_DELIVERY"
  | "DELIVERING"
  | "FINAL_PAYMENT_PENDING"
  | "COMPLETED"
  | "CANCELLED";

export type OrderItemStatus = "PENDING" | "IN_PRODUCTION" | "READY" | "DELIVERED" | "CANCELLED" | string;

export type OrderListItemDto = {
  orderId: string;
  projectId: string;
  quotationId: string;
  orderCode: string;
  originalTotalAmount: number;
  depositAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: OrderStatus;
  createdAt: string;
};

export type OrderItemDto = {
  orderItemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  subtotalAmount: number;
  status: OrderItemStatus;
  isCustomized: boolean;
};

export type OrderDetailDto = {
  orderId: string;
  projectId: string;
  proposalId: string;
  quotationId: string;
  orderCode: string;
  customerId: string;
  salesId: string;
  vatRate: number;
  vatAmount: number;
  originalTotalAmount: number;
  finalTotalAmount: number;
  depositAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: OrderStatus;
  items: OrderItemDto[];
  createdAt?: string;
  updatedAt?: string;
};

export type OrderListResponseDto = {
  items: OrderListItemDto[];
  page?: number;
  limit?: number;
  total?: number;
};
