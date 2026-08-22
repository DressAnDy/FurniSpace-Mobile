import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import { PaymentDetailDto, PaymentListQuery, PayOsCheckoutState } from "../models/payment.model";
import {
  createOrderDepositPaymentApi,
  createPayOsTransactionApi,
  createSePayTransactionApi,
  getActivePaymentTransactionApi,
  getPaymentDetailApi,
  getPaymentsApi,
  getPaymentStatusByCodeApi,
} from "../services/payment.api";
import { buildTransferDetails } from "../utils/payment.mapper";
import { buildPayOsCheckoutState, mapPayOsTransactionToAttempt } from "../utils/payos.mapper";

export function usePaymentDetailQuery(paymentId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.payment.detail(paymentId ?? "none"),
    enabled: isLoggedIn && Boolean(paymentId),
    queryFn: () => getPaymentDetailApi(paymentId!),
  });
}

export function usePaymentsQuery(query: PaymentListQuery) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.payment.list(query),
    enabled: isLoggedIn,
    queryFn: () => getPaymentsApi(query),
  });
}

export function usePaymentStatusByCodeQuery(paymentCode: string | null, enabled: boolean) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.payment.statusByCode(paymentCode ?? "none"),
    enabled: isLoggedIn && enabled && Boolean(paymentCode),
    queryFn: () => getPaymentStatusByCodeApi(paymentCode!),
    refetchInterval: enabled ? 4000 : false,
  });
}

export function useCreateDepositPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, note }: { orderId: string; note?: string }) =>
      createOrderDepositPaymentApi(orderId, note ? { note } : {}),
    onSuccess: (payment) => {
      queryClient.setQueryData(queryKeys.payment.detail(payment.paymentId), payment);
    },
  });
}

export async function ensurePayment(input: {
  orderId?: string;
  paymentId?: string;
  paymentType?: PaymentDetailDto["paymentType"];
}): Promise<PaymentDetailDto> {
  if (input.paymentId) {
    return getPaymentDetailApi(input.paymentId);
  }

  if (!input.orderId) {
    throw new Error("Missing order or payment information.");
  }

  const existingPayment = await findExistingPaymentForOrder(input.orderId, input.paymentType);
  if (existingPayment) {
    return existingPayment;
  }

  return createOrderDepositPaymentApi(input.orderId);
}

async function findExistingPaymentForOrder(
  orderId: string,
  paymentType?: PaymentDetailDto["paymentType"],
): Promise<PaymentDetailDto | null> {
  const response = await getPaymentsApi({ orderId, limit: 20 });
  const items = response.items ?? [];
  const scopedItems = paymentType ? items.filter((item) => item.paymentType === paymentType) : items;
  const candidates = scopedItems.length > 0 ? scopedItems : items;

  const paidPayment = candidates.find((item) => item.status === "PAID");
  if (paidPayment) {
    return getPaymentDetailApi(paidPayment.paymentId);
  }

  const activePayment = candidates.find((item) => item.status === "PENDING" || item.status === "PROCESSING");
  if (activePayment) {
    return getPaymentDetailApi(activePayment.paymentId);
  }

  return null;
}

export async function prepareSePayCheckout(paymentId: string) {
  const payment = await getPaymentDetailApi(paymentId);

  if (payment.status === "PAID") {
    return {
      payment,
      transaction: null,
      transferDetails: buildTransferDetails(payment.paymentCode, payment.amount),
    };
  }

  const activeTransaction = await getActivePaymentTransactionApi(paymentId);
  if (activeTransaction?.paymentProvider === "SEPAY" && activeTransaction.paymentUrl) {
    return {
      payment,
      transaction: activeTransaction,
      transferDetails: buildTransferDetails(
        payment.paymentCode,
        payment.amount,
        activeTransaction.paymentUrl,
        activeTransaction.transferContent,
      ),
    };
  }

  const transaction = await createSePayTransactionApi(paymentId);
  return {
    payment: {
      ...payment,
      status: transaction.paymentStatus ?? payment.status,
    },
    transaction,
    transferDetails: buildTransferDetails(
      payment.paymentCode,
      payment.amount,
      transaction.paymentUrl,
      transaction.transferContent,
    ),
  };
}

function isPayOsPendingAttempt(transaction: Awaited<ReturnType<typeof getActivePaymentTransactionApi>>): boolean {
  if (!transaction || transaction.paymentProvider !== "PAYOS") {
    return false;
  }

  return transaction.status === "PENDING" && Boolean(transaction.paymentUrl || transaction.qrContent);
}

export async function preparePayOsCheckout(paymentId: string): Promise<PayOsCheckoutState> {
  const payment = await getPaymentDetailApi(paymentId);

  if (payment.status === "PAID") {
    return buildPayOsCheckoutState(payment, null);
  }

  const activeTransaction = await getActivePaymentTransactionApi(paymentId);
  if (isPayOsPendingAttempt(activeTransaction)) {
    return buildPayOsCheckoutState(payment, mapPayOsTransactionToAttempt(activeTransaction!));
  }

  const transaction = await createPayOsTransactionApi(paymentId);
  return buildPayOsCheckoutState(payment, mapPayOsTransactionToAttempt(transaction));
}

export async function bootstrapSePayCheckout(input: { orderId?: string; paymentId?: string }) {
  const payment = await ensurePayment(input);

  if (payment.status === "PAID") {
    return {
      payment,
      transaction: null,
      transferDetails: buildTransferDetails(payment.paymentCode, payment.amount),
    };
  }

  return prepareSePayCheckout(payment.paymentId);
}

export async function bootstrapPayOsCheckout(input: { orderId?: string; paymentId?: string }): Promise<PayOsCheckoutState> {
  const payment = await ensurePayment(input);

  if (payment.status === "PAID") {
    return buildPayOsCheckoutState(payment, null);
  }

  return preparePayOsCheckout(payment.paymentId);
}

export async function bootstrapPaymentMethod(input: {
  orderId?: string;
  paymentId?: string;
  paymentType?: PaymentDetailDto["paymentType"];
}) {
  return ensurePayment(input);
}
