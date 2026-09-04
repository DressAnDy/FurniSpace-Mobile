import type {
  OrderPaymentDto,
  ProductionRequestDto,
  SaleOrderDetailDto,
  SaleOrderStatus,
} from "../models/sale.fulfillment.model";
import type { PhaseDeadlineItemDto } from "../../project/models/project.tracking.model";

export function findPendingSaleOrderPayment(
  payments: OrderPaymentDto[],
  paymentType: string,
): OrderPaymentDto | undefined {
  return payments.find(
    (payment) =>
      payment.paymentType === paymentType &&
      (payment.status === "PENDING" || payment.status === "PROCESSING"),
  );
}

export function hasPaidSaleOrderPayment(payments: OrderPaymentDto[], paymentType: string): boolean {
  return payments.some((payment) => payment.paymentType === paymentType && payment.status === "PAID");
}

export function hasPendingSaleOrderPayment(payments: OrderPaymentDto[], paymentType: string): boolean {
  return payments.some(
    (payment) =>
      payment.paymentType === paymentType &&
      (payment.status === "PENDING" || payment.status === "PROCESSING"),
  );
}

export function hasOrderDeliveryDetails(order: SaleOrderDetailDto | null | undefined): boolean {
  const details = order?.deliveryDetails;
  return Boolean(details?.deliveryAddress?.trim() && details?.receiverName?.trim() && details?.receiverPhone?.trim());
}

export function getProductionPhaseDeadline(deadlines: PhaseDeadlineItemDto[] = []): PhaseDeadlineItemDto | null {
  return deadlines.find((item) => item.phase === "PRODUCTION") ?? null;
}

export function normalizeSaleOrderStatus(status: string | null | undefined): string {
  return (status ?? "").trim().toUpperCase().replace(/\s+/g, "_");
}

export function getOrderProductionRequests(
  requests: ProductionRequestDto[] = [],
  orderId: string | null | undefined,
): ProductionRequestDto[] {
  if (!orderId) {
    return [];
  }
  // Only count requests that belong to this order — never attribute project-wide / orderId-less rows.
  return requests.filter((item) => item.orderId === orderId);
}

export function getExistingProductionRequest(
  requests: ProductionRequestDto[] = [],
  orderId?: string | null,
): ProductionRequestDto | null {
  return (
    getOrderProductionRequests(requests, orderId).find((item) => {
      const status = (item.status ?? "").toUpperCase();
      return status !== "CANCELLED";
    }) ?? null
  );
}

export function getActiveProductionRequest(
  requests: ProductionRequestDto[] = [],
  orderId?: string | null,
): ProductionRequestDto | null {
  return (
    getOrderProductionRequests(requests, orderId).find((item) => {
      const status = (item.status ?? "").toUpperCase();
      return status !== "COMPLETED" && status !== "CANCELLED";
    }) ?? null
  );
}

export function hasExistingProductionRequest(
  requests: ProductionRequestDto[] = [],
  orderId?: string | null,
): boolean {
  return Boolean(getExistingProductionRequest(requests, orderId));
}

export function hasActiveProductionRequest(
  requests: ProductionRequestDto[] = [],
  orderId?: string | null,
): boolean {
  return Boolean(getActiveProductionRequest(requests, orderId));
}

export function canShowProductionSection(
  order: SaleOrderDetailDto | null | undefined,
  productionRequests: ProductionRequestDto[] = [],
): boolean {
  const status = normalizeSaleOrderStatus(order?.status);
  // Always surface the card once deposit is paid so Sales can create (or review) production.
  if (status === "DEPOSIT_PAID") {
    return true;
  }
  if (status === "IN_PRODUCTION" && getExistingProductionRequest(productionRequests, order?.orderId)) {
    return true;
  }
  return false;
}

export function canSalesCreateDeposit(order: SaleOrderDetailDto | null | undefined): boolean {
  if (!order) {
    return false;
  }
  return order.status === "CREATED" || order.status === "DEPOSIT_PENDING";
}

export function canSalesStartProductionSetup(
  order: SaleOrderDetailDto | null | undefined,
  productionRequests: ProductionRequestDto[],
): boolean {
  if (normalizeSaleOrderStatus(order?.status) !== "DEPOSIT_PAID") {
    return false;
  }
  return !hasExistingProductionRequest(productionRequests, order?.orderId);
}

/** @deprecated Use canSalesStartProductionSetup — deadline is set in the same step as assign. */
export function canSalesCreateProductionRequest(
  order: SaleOrderDetailDto | null | undefined,
  _deadlines: PhaseDeadlineItemDto[],
  productionRequests: ProductionRequestDto[],
): boolean {
  return canSalesStartProductionSetup(order, productionRequests);
}

export function canSalesCreateRemainingPayment(order: SaleOrderDetailDto | null | undefined): boolean {
  if (!order) {
    return false;
  }
  if ((order.remainingAmount ?? 0) <= 0) {
    return false;
  }
  return (
    order.status === "FINAL_PAYMENT_PENDING" ||
    order.status === "DELIVERED"
  );
}

export function canSalesCompleteOrder(order: SaleOrderDetailDto | null | undefined): boolean {
  if (!order) {
    return false;
  }
  const status = normalizeSaleOrderStatus(order.status);
  if (status !== "DELIVERED" && status !== "FINAL_PAYMENT_PENDING") {
    return false;
  }
  return (order.remainingAmount ?? 0) <= 0;
}

export function canSalesCompleteProject(
  order: SaleOrderDetailDto | null | undefined,
  projectStatus?: string | null,
): boolean {
  if (normalizeSaleOrderStatus(order?.status) !== "COMPLETED") {
    return false;
  }
  if (!projectStatus) {
    return false;
  }
  const status = projectStatus.trim().toUpperCase();
  return status !== "COMPLETED" && status !== "REJECTED";
}

export function getSaleOrderStatusColors(status: SaleOrderStatus): { backgroundColor: string; color: string } {
  switch (status) {
    case "DEPOSIT_PAID":
    case "COMPLETED":
      return { backgroundColor: "#E8F8F0", color: "#009966" };
    case "DEPOSIT_PENDING":
    case "FINAL_PAYMENT_PENDING":
      return { backgroundColor: "#FFF4E5", color: "#BB4D00" };
    case "IN_PRODUCTION":
    case "DELIVERING":
    case "READY_FOR_DELIVERY":
      return { backgroundColor: "#EFF6FF", color: "#155DFC" };
    case "CANCELLED":
      return { backgroundColor: "#FFF5F5", color: "#FB2C36" };
    default:
      return { backgroundColor: "#F5F2ED", color: "#7A6F68" };
  }
}

export function getSaleOrderNextStepNote(
  order: SaleOrderDetailDto | null | undefined,
  payments: OrderPaymentDto[],
  deadlines: PhaseDeadlineItemDto[],
  productionRequests: ProductionRequestDto[],
): string | null {
  if (!order) {
    return null;
  }

  if ((order.status === "CREATED" || order.status === "DEPOSIT_PENDING") && !hasOrderDeliveryDetails(order)) {
    return "Waiting for customer to submit delivery details before deposit payment.";
  }

  if (canSalesCreateDeposit(order) && !hasPendingSaleOrderPayment(payments, "DEPOSIT") && !hasPaidSaleOrderPayment(payments, "DEPOSIT")) {
    return "Create deposit payment for the customer.";
  }

  if (hasPendingSaleOrderPayment(payments, "DEPOSIT")) {
    return "Deposit payment is pending — share QR/link with customer.";
  }

  if (canSalesStartProductionSetup(order, productionRequests)) {
    return "Choose staff, priority, and deadline, then assign production.";
  }

  if (canSalesCreateRemainingPayment(order) && !hasPendingSaleOrderPayment(payments, "REMAINING_PAYMENT")) {
    return "Create remaining payment for the customer (or wait if BE already created it).";
  }

  if (
    (normalizeSaleOrderStatus(order.status) === "DELIVERED" ||
      normalizeSaleOrderStatus(order.status) === "FINAL_PAYMENT_PENDING") &&
    (order.remainingAmount ?? 0) > 0
  ) {
    return "Remaining payment must be paid before completing the order.";
  }

  if (canSalesCompleteOrder(order)) {
    return "Complete order when remaining balance is settled.";
  }

  if (order.status === "COMPLETED") {
    return "Order completed. Complete the project to close this job.";
  }

  return null;
}
