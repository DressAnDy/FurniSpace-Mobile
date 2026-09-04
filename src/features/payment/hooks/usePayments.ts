import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import {
  getOrderByIdApi,
  hasOrderDeliveryDetails,
  isDepositEligibleOrderStatus,
  updateOrderDeliveryDetailsApi,
} from "../../project/services/project.tracking.api";
import { UpdateOrderDeliveryDetailsRequestDto } from "../../project/models/project.tracking.model";
import { PaymentDetailDto, PaymentListQuery, PayOsCheckoutState } from "../models/payment.model";
import type { CreateProjectStartFeeRequestDto } from "../models/payment.model";
import {
  createOrderDepositPaymentApi,
  createPayOsPaymentLinkApi,
  createPayOsTransactionApi,
  createProjectStartFeeApi,
  createSePayTransactionApi,
  createSePayVietQrApi,
  getActivePaymentTransactionApi,
  getPaymentDetailApi,
  getPaymentsApi,
  getPaymentStatusByCodeApi,
  getPaymentSummaryApi,
  getProjectStartFeeStatusApi,
} from "../services/payment.api";
import { buildTransferDetails } from "../utils/payment.mapper";
import { usesPaymentHelperCheckout } from "../utils/payment.helpers";
import { buildPayOsCheckoutState, mapPayOsPaymentLinkToAttempt, mapPayOsTransactionToAttempt } from "../utils/payos.mapper";

const PAYOS_RETURN_URL = "furnispace://payos-payment";
const PAYOS_CANCEL_URL = "furnispace://payment";

export function isDeliveryDetailsRequiredError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /ORDER_DELIVERY_DETAILS_REQUIRED|delivery details/i.test(message);
}

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

export function usePaymentSummaryQuery(enabled = true) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.payment.summary,
    enabled: isLoggedIn && enabled,
    queryFn: () => getPaymentSummaryApi(),
  });
}

export function useProjectStartFeeStatusQuery(projectId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.payment.projectStartFeeStatus(projectId ?? "none"),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: () => getProjectStartFeeStatusApi(projectId!),
    refetchInterval: (query) => {
      const status = query.state.data?.projectStartFeeStatus;
      if (status === "PENDING" || status === "PROCESSING") {
        return 5000;
      }
      return false;
    },
  });
}

export function useCreateProjectStartFeeMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectStartFeeRequestDto = {}) => createProjectStartFeeApi(projectId!, payload),
    onSuccess: (payment) => {
      if (projectId) {
        queryClient.setQueryData(queryKeys.payment.detail(payment.paymentId), payment);
        void queryClient.invalidateQueries({ queryKey: queryKeys.payment.projectStartFeeStatus(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.payment.summary });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
      }
    },
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

export async function ensureOrderDeliveryDetails(
  orderId: string,
  deliveryDetails?: UpdateOrderDeliveryDetailsRequestDto,
): Promise<void> {
  const order = await getOrderByIdApi(orderId);

  if (hasOrderDeliveryDetails(order)) {
    return;
  }

  if (!deliveryDetails) {
    throw new Error("ORDER_DELIVERY_DETAILS_REQUIRED");
  }

  await updateOrderDeliveryDetailsApi(orderId, deliveryDetails);
}

export async function ensurePayment(input: {
  orderId?: string;
  paymentId?: string;
  paymentType?: PaymentDetailDto["paymentType"];
  deliveryDetails?: UpdateOrderDeliveryDetailsRequestDto;
}): Promise<PaymentDetailDto> {
  if (input.paymentId) {
    const payment = await getPaymentDetailApi(input.paymentId);
    if (
      payment.status === "PAID" ||
      !input.orderId ||
      (payment.status !== "EXPIRED" && payment.status !== "CANCELLED")
    ) {
      return payment;
    }

    const replacement = await findExistingPaymentForOrder(
      input.orderId,
      input.paymentType ?? payment.paymentType,
    );
    if (replacement) {
      return replacement;
    }

    return payment;
  }

  if (!input.orderId) {
    throw new Error("Missing order or payment information.");
  }

  const paymentType = input.paymentType ?? "DEPOSIT";
  const existingPayment = await findExistingPaymentForOrder(input.orderId, paymentType);
  if (existingPayment) {
    return existingPayment;
  }

  if (input.paymentType === "DEPOSIT" || !input.paymentType) {
    const order = await getOrderByIdApi(input.orderId);
    if (isDepositEligibleOrderStatus(order.status)) {
      await ensureOrderDeliveryDetails(input.orderId, input.deliveryDetails);
    }
  }

  if (paymentType === "REMAINING_PAYMENT") {
    throw new Error("Remaining payment has not been issued yet. Please contact sales after delivery.");
  }

  try {
    return await createOrderDepositPaymentApi(input.orderId);
  } catch (error) {
    if (isDeliveryDetailsRequiredError(error) && input.deliveryDetails) {
      await updateOrderDeliveryDetailsApi(input.orderId, input.deliveryDetails);
      return createOrderDepositPaymentApi(input.orderId);
    }
    throw error;
  }
}

async function findExistingPaymentForOrder(
  orderId: string,
  paymentType?: PaymentDetailDto["paymentType"],
): Promise<PaymentDetailDto | null> {
  const response = await getPaymentsApi({ orderId, limit: 20 });
  const items = response.items ?? [];
  const candidates = paymentType ? items.filter((item) => item.paymentType === paymentType) : items;

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
  const role = useAuthStore.getState().user?.role;
  if (usesPaymentHelperCheckout(role)) {
    return prepareStaffSePayCheckout(paymentId);
  }
  return prepareCustomerSePayCheckout(paymentId);
}

async function prepareStaffSePayCheckout(paymentId: string) {
  const payment = await getPaymentDetailApi(paymentId);

  if (payment.status === "PAID") {
    return {
      payment,
      transaction: null,
      transferDetails: buildTransferDetails(payment.paymentCode, payment.amount),
    };
  }

  const vietQr = await createSePayVietQrApi(paymentId);
  return {
    payment,
    transaction: null,
    transferDetails: buildTransferDetails(
      payment.paymentCode,
      payment.amount,
      vietQr.qrUrl ?? vietQr.qrContent,
      vietQr.transferContent ?? payment.paymentCode,
    ),
  };
}

async function prepareCustomerSePayCheckout(paymentId: string) {
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
  const role = useAuthStore.getState().user?.role;
  if (usesPaymentHelperCheckout(role)) {
    return prepareStaffPayOsCheckout(paymentId);
  }
  return prepareCustomerPayOsCheckout(paymentId);
}

async function prepareStaffPayOsCheckout(paymentId: string): Promise<PayOsCheckoutState> {
  const payment = await getPaymentDetailApi(paymentId);

  if (payment.status === "PAID") {
    return buildPayOsCheckoutState(payment, null);
  }

  const link = await createPayOsPaymentLinkApi(paymentId, {
    returnUrl: PAYOS_RETURN_URL,
    cancelUrl: PAYOS_CANCEL_URL,
  });
  return buildPayOsCheckoutState(payment, mapPayOsPaymentLinkToAttempt(link));
}

async function prepareCustomerPayOsCheckout(paymentId: string): Promise<PayOsCheckoutState> {
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
  deliveryDetails?: UpdateOrderDeliveryDetailsRequestDto;
}) {
  return ensurePayment(input);
}
