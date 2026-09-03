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
    return requests;
  }
  const matched = requests.filter((item) => item.orderId === orderId);
  if (matched.length > 0) {
    return matched;
  }
  return requests.every((item) => !item.orderId) ? requests : [];
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
  if (canSalesStartProductionSetup(order, productionRequests)) {
    return true;
  }

  const status = normalizeSaleOrderStatus(order?.status);
  if (status !== "DEPOSIT_PAID" && status !== "IN_PRODUCTION") {
    return false;
  }

  return hasExistingProductionRequest(productionRequests, order?.orderId);
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
  return (
    order.status === "FINAL_PAYMENT_PENDING" ||
    order.status === "DELIVERED"
  );
}

export function canSalesCompleteOrder(order: SaleOrderDetailDto | null | undefined): boolean {
  if (!order) {
    return false;
  }
  return order.status === "DELIVERED" || order.status === "FINAL_PAYMENT_PENDING";
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
    return "Choose staff, priority, and deadline, then create production.";
  }

  if (canSalesCreateRemainingPayment(order) && !hasPaidSaleOrderPayment(payments, "REMAINING_PAYMENT")) {
    return "Create remaining payment if customer confirm-delivery did not auto-create it.";
  }

  if (canSalesCompleteOrder(order)) {
    return "Complete order after remaining payment is settled.";
  }

  if (order.status === "COMPLETED") {
    return "Order completed. Complete the project to close this job.";
  }

  return null;
}
