import {
  PayOsAttemptView,
  PayOsPaymentLinkDto,
  PaymentTransactionDto,
} from "../models/payment.model";

export function resolvePayOsCheckoutUrl(input: {
  paymentUrl?: string | null;
  checkoutUrl?: string | null;
}): string | null {
  const value = input.checkoutUrl ?? input.paymentUrl;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function resolvePayOsQrContent(input: {
  qrContent?: string | null;
  qrCode?: string | null;
}): string | null {
  const value = input.qrContent ?? input.qrCode;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function mapPayOsPaymentLinkToAttempt(dto: PayOsPaymentLinkDto): PayOsAttemptView {
  return {
    paymentTransactionId: dto.paymentTransactionId,
    paymentId: dto.paymentId,
    paymentCode: dto.paymentCode,
    checkoutUrl: resolvePayOsCheckoutUrl({ checkoutUrl: dto.checkoutUrl }),
    qrContent: resolvePayOsQrContent({ qrCode: dto.qrCode }),
    amount: dto.amount,
    currency: "VND",
    transactionStatus: dto.status,
    paymentStatus: dto.paymentStatus,
    orderCode: dto.orderCode,
    paymentProvider: "PAYOS",
    paymentMethod: "PAYMENT_LINK",
  };
}

export function mapPayOsTransactionToAttempt(dto: PaymentTransactionDto): PayOsAttemptView {
  return {
    paymentTransactionId: dto.paymentTransactionId,
    paymentId: dto.paymentId,
    checkoutUrl: resolvePayOsCheckoutUrl({ paymentUrl: dto.paymentUrl }),
    qrContent: resolvePayOsQrContent({ qrContent: dto.qrContent }),
    amount: dto.amount,
    currency: dto.currency,
    transactionStatus: dto.status,
    paymentStatus: dto.paymentStatus,
    transactionCode: dto.transactionCode?.trim() ? dto.transactionCode : undefined,
    orderCode: dto.providerReferenceCode ? Number(dto.providerReferenceCode) : undefined,
    paymentProvider: "PAYOS",
    paymentMethod: "PAYMENT_LINK",
  };
}

export function buildPayOsCheckoutState(
  payment: import("../models/payment.model").PaymentDetailDto,
  attempt: PayOsAttemptView | null,
) {
  return {
    payment: attempt?.paymentStatus
      ? {
          ...payment,
          status: attempt.paymentStatus,
        }
      : payment,
    attempt,
    checkoutUrl: attempt?.checkoutUrl ?? null,
    qrContent: attempt?.qrContent ?? null,
  };
}
