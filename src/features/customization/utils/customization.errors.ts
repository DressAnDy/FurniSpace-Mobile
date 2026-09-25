import { getBackendErrorCode } from "../../../core/errors/getBackendErrorCode";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";

const CUSTOMIZATION_ERROR_MESSAGES: Record<string, string> = {
  CUSTOMIZATION_REQUEST_PENDING: "A customization request is still pending for this item.",
  VERSION_CODE_ALREADY_EXISTS: "This version code already exists.",
  CUSTOMIZATION_VERSION_NUMBER_CONFLICT: "A custom version with this number already exists.",
  PRODUCT_VERSION_FILE_LINK_CONFLICT: "This product version file is already linked.",
  SOURCE_PRODUCT_VERSION_NOT_FOUND: "The source product version for this item could not be found.",
  SOURCE_PRODUCT_VERSION_PRICE_REQUIRED: "The source product version needs a price before it can be customized.",
  APPROVED_PRODUCT_VERSION_NOT_FOUND: "An approved product version could not be found for this item.",
  APPROVED_PRODUCT_VERSION_INVALID_TYPE: "This product version type cannot be customized.",
  ESTIMATED_ADDITIONAL_COST_REQUIRED: "An estimated additional cost is required for this custom version.",
  CUSTOMIZATION_VERSION_NOT_REVIEWING: "This custom version is not in production review.",
  CUSTOMIZATION_VERSION_NOT_FEASIBLE: "This custom version is not marked feasible, so it cannot be accepted.",
  CUSTOMIZATION_NOT_IN_REVIEWING: "This customization request is not in review.",
};

export function getCustomizationErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const errorCode = getBackendErrorCode(error);
  if (errorCode && CUSTOMIZATION_ERROR_MESSAGES[errorCode]) {
    return CUSTOMIZATION_ERROR_MESSAGES[errorCode];
  }

  return getErrorMessage(error, fallback);
}
