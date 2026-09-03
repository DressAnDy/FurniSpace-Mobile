export type PaymentType = "DEPOSIT" | "REMAINING_PAYMENT" | "PROJECT_START_FEE" | string;

export type PaymentStatus = "PENDING" | "PROCESSING" | "PAID" | "EXPIRED" | "CANCELLED";

export type PaymentProvider = "SEPAY" | "PAYOS" | string;

export type PaymentMethod = "QR_CODE" | "PAYMENT_LINK" | string;

export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | string;

export type PaymentRouteParams = {
  orderId?: string;
  paymentId?: string;
  projectId?: string;
  paymentType?: PaymentType;
};

export type CreateSePayTransactionRequestDto = {
  paymentProvider: "SEPAY";
  paymentMethod: "QR_CODE";
};

export type CreatePayOsTransactionRequestDto = {
  paymentProvider: "PAYOS";
  paymentMethod: "PAYMENT_LINK";
};

export type PayOsPaymentLinkDto = {
  paymentId: string;
  paymentTransactionId: string;
  paymentCode: string;
  provider: "PAYOS" | string;
  method: "PAYMENT_LINK" | string;
  orderCode: number;
  amount: number;
  status: TransactionStatus;
  checkoutUrl: string;
  qrCode: string | null;
  paymentStatus: PaymentStatus;
};

export type CreatePaymentTransactionRequestDto =
  | CreateSePayTransactionRequestDto
  | CreatePayOsTransactionRequestDto;

export type PaymentDetailDto = {
  paymentId: string;
  projectId: string;
  orderId: string;
  quotationId?: string | null;
  paymentCode: string;
  paidBy: string | null;
  paymentType: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  expiredAt: string | null;
  isPayable: boolean;
  reused?: boolean;
  paidAt?: string | null;
  cancelledAt?: string | null;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateDepositRequestDto = {
  expiredAt?: string;
  note?: string;
};

export type PaymentTransactionDto = {
  paymentTransactionId: string;
  paymentId: string;
  transactionCode: string;
  transactionType?: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentProvider: PaymentProvider;
  paymentMethod: PaymentMethod;
  paymentUrl: string | null;
  qrContent: string | null;
  paymentStatus?: PaymentStatus;
  transferContent?: string | null;
  providerTransactionId?: string | null;
  providerReferenceCode?: string | null;
  failureReason?: string | null;
  transactionTime?: string | null;
  createdAt?: string;
};

export type PayOsAttemptView = {
  paymentTransactionId: string;
  paymentId: string;
  paymentCode?: string;
  checkoutUrl: string | null;
  qrContent: string | null;
  amount: number;
  currency: string;
  transactionStatus: TransactionStatus;
  paymentStatus?: PaymentStatus;
  transactionCode?: string;
  orderCode?: number;
  paymentProvider: "PAYOS";
  paymentMethod: "PAYMENT_LINK";
};

export type PaymentStatusByCodeDto = {
  paymentId: string;
  paymentCode: string;
  status: PaymentStatus;
  amount: number;
  paidAt: string | null;
};

export type PaymentListQuery = {
  projectId?: string;
  orderId?: string;
  status?: PaymentStatus;
  paymentType?: PaymentType;
  page?: number;
  limit?: number;
};

export type PaymentListResponseDto = {
  items: PaymentDetailDto[];
  page: number;
  limit: number;
  total: number;
};

export type CancelPaymentTransactionRequestDto = {
  cancelReason: string;
};

export type PaymentUpdatedRealtimeDto = {
  paymentId: string;
  projectId: string;
  paymentCode: string;
  status: PaymentStatus;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentTransactionId: string;
  transactionAmount: number;
  appliedAmount: number;
  paidAt: string | null;
  occurredAt: string;
};

export type VietQrTransferDetails = {
  bankCode?: string;
  accountNo?: string;
  accountName?: string;
  transferContent?: string;
  amount?: number;
};

export type SePayCheckoutState = {
  payment: PaymentDetailDto;
  transaction: PaymentTransactionDto | null;
  transferDetails: VietQrTransferDetails;
};

export type PayOsCheckoutState = {
  payment: PaymentDetailDto;
  attempt: PayOsAttemptView | null;
  checkoutUrl: string | null;
  qrContent: string | null;
};
