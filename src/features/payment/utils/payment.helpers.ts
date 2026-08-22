import { PaymentDetailDto, PaymentType } from "../models/payment.model";

export function findPendingPayment(
  payments: PaymentDetailDto[],
  paymentType: PaymentType,
): PaymentDetailDto | undefined {
  return payments.find(
    (payment) =>
      payment.paymentType === paymentType && (payment.status === "PENDING" || payment.status === "PROCESSING"),
  );
}

export function hasPaidPayment(payments: PaymentDetailDto[], paymentType: PaymentType): boolean {
  return payments.some((payment) => payment.paymentType === paymentType && payment.status === "PAID");
}

export function canCustomerPayDeposit(
  payments: PaymentDetailDto[],
  orderStatus?: string | null,
  projectStatus?: string | null,
): boolean {
  if (hasPaidPayment(payments, "DEPOSIT")) {
    return false;
  }

  if (findPendingPayment(payments, "DEPOSIT")) {
    return true;
  }

  if (projectStatus === "ORDER_CONFIRMED") {
    return orderStatus === "CREATED" || orderStatus === "DEPOSIT_PENDING";
  }

  return false;
}

export function canCustomerPayRemaining(
  payments: PaymentDetailDto[],
  orderStatus?: string | null,
  projectStatus?: string | null,
): boolean {
  if (!hasPaidPayment(payments, "DEPOSIT")) {
    return false;
  }

  if (hasPaidPayment(payments, "REMAINING_PAYMENT")) {
    return false;
  }

  const pendingRemaining = findPendingPayment(payments, "REMAINING_PAYMENT");
  if (!pendingRemaining) {
    return false;
  }

  return (
    projectStatus === "DELIVERED" ||
    orderStatus === "FINAL_PAYMENT_PENDING" ||
    orderStatus === "DELIVERED"
  );
}
