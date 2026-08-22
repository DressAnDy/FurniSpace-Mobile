import { getBackendErrorCode } from "../../../core/errors/getBackendErrorCode";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";

const CUSTOMER_FLOW_ERROR_MESSAGES: Record<string, string> = {
  INVALID_PROPOSAL_STATUS: "This proposal is no longer available for that action.",
  CUSTOMIZATION_REQUEST_PENDING:
    "A customization request is still pending. Please wait for the team to finish before continuing.",
  QUOTATION_EXPIRED: "This quotation has expired. Please contact sales for an updated quote.",
  INVALID_QUOTATION_STATUS: "This quotation is no longer available for that action.",
  QUOTATION_NOT_READY_TO_SEND: "The quotation is not ready yet. Please try again later.",
  QUOTATION_NOT_AVAILABLE: "This quotation is not available to view.",
  PROJECT_REOPEN_NOT_ALLOWED: "Proposal cannot be reopened at this stage.",
  PROJECT_DEPOSIT_ALREADY_PAID: "Deposit has already been paid. Proposal cannot be reopened.",
};

export function getCustomerFlowErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const errorCode = getBackendErrorCode(error);

  if (errorCode && CUSTOMER_FLOW_ERROR_MESSAGES[errorCode]) {
    return CUSTOMER_FLOW_ERROR_MESSAGES[errorCode];
  }

  return getErrorMessage(error, fallback);
}

export function isCustomizationPendingError(error: unknown): boolean {
  return getBackendErrorCode(error) === "CUSTOMIZATION_REQUEST_PENDING";
}

export function isQuotationExpiredError(error: unknown): boolean {
  return getBackendErrorCode(error) === "QUOTATION_EXPIRED";
}
