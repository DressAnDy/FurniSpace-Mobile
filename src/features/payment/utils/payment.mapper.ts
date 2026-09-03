import { PaymentStatus, PaymentType, VietQrTransferDetails } from "../models/payment.model";

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: "Deposit payment",
  REMAINING_PAYMENT: "Remaining payment",
  PROJECT_START_FEE: "Project start fee",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Awaiting transfer",
  PAID: "Paid",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

export function formatVndAmount(amount: number | null | undefined, currency = "VND"): string {
  if (amount == null || !Number.isFinite(amount)) {
    return "—";
  }

  if (currency !== "VND") {
    return `${amount.toLocaleString("vi-VN")} ${currency}`;
  }

  return `${amount.toLocaleString("vi-VN")} ₫`;
}

export function getPaymentTypeLabel(paymentType: PaymentType): string {
  return PAYMENT_TYPE_LABELS[paymentType] ?? "Payment";
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

export function parseVietQrUrl(paymentUrl: string | null | undefined): VietQrTransferDetails {
  if (!paymentUrl) {
    return {};
  }

  try {
    const url = new URL(paymentUrl);
    const amountRaw = url.searchParams.get("amount");
    const amount = amountRaw ? Number(amountRaw) : undefined;

    return {
      bankCode: url.searchParams.get("bank") ?? undefined,
      accountNo: url.searchParams.get("acc") ?? undefined,
      accountName: url.searchParams.get("accountName") ?? undefined,
      transferContent: url.searchParams.get("des") ?? url.searchParams.get("content") ?? undefined,
      amount: Number.isFinite(amount) ? amount : undefined,
    };
  } catch {
    return {};
  }
}

export function buildTransferDetails(
  paymentCode: string,
  amount: number,
  paymentUrl?: string | null,
  transferContent?: string | null,
): VietQrTransferDetails {
  const parsed = parseVietQrUrl(paymentUrl);

  return {
    ...parsed,
    amount: parsed.amount ?? amount,
    transferContent: transferContent ?? parsed.transferContent ?? paymentCode,
  };
}
