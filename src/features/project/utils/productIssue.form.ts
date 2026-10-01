import {
  FieldErrors,
  enforceMaxLength,
  hasFieldErrors,
  parseRequiredPositiveInteger,
  requiredTrimmed,
} from "../../../shared/validation/formRules";
import type { DeliveryProductIssueType, ProductIssueEvidenceLocalFile } from "../models/productIssue.model";

export const PRODUCT_ISSUE_DESCRIPTION_MAX = 2000;
export const PRODUCT_ISSUE_EVIDENCE_MAX_FILES = 8;
export const PRODUCT_ISSUE_EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;

export type ProductIssueFormValues = {
  orderItemId: string;
  issueType: DeliveryProductIssueType;
  affectedQuantity: string;
  description: string;
  files: ProductIssueEvidenceLocalFile[];
};

export type ProductIssueFieldErrors = FieldErrors<
  "orderItemId" | "affectedQuantity" | "description" | "files"
>;

export type ProductIssueValidatedPayload = {
  orderItemId: string;
  issueType: DeliveryProductIssueType;
  description: string;
  affectedQuantity: number;
  files: ProductIssueEvidenceLocalFile[];
};

function isAllowedEvidenceFile(file: ProductIssueEvidenceLocalFile): boolean {
  const mime = (file.mimeType ?? "").toLowerCase();
  const name = (file.name ?? "").toLowerCase();
  if (mime.startsWith("image/") || mime === "application/pdf") {
    return true;
  }
  return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".pdf"].some((ext) => name.endsWith(ext));
}

export function validateProductIssueForm(
  values: ProductIssueFormValues,
  deliveredMax: number | null,
): { ok: true; payload: ProductIssueValidatedPayload } | { ok: false; errors: ProductIssueFieldErrors } {
  const errors: ProductIssueFieldErrors = {};

  if (!values.orderItemId.trim()) {
    errors.orderItemId = "Please select a delivered product.";
  }

  const quantity = parseRequiredPositiveInteger(values.affectedQuantity, {
    emptyMessage: "Enter how many units are affected.",
    invalidMessage: "Affected quantity must be a positive whole number.",
    max: deliveredMax ?? undefined,
    maxMessage:
      deliveredMax != null ? `Value must be less than or equal to ${deliveredMax}.` : undefined,
  });
  if (quantity.error) {
    errors.affectedQuantity = quantity.error;
  }

  const description = requiredTrimmed(values.description, "Description is required.");
  if (description.error) {
    errors.description = description.error;
  } else {
    const lengthCheck = enforceMaxLength(
      description.value,
      PRODUCT_ISSUE_DESCRIPTION_MAX,
      `Description must be at most ${PRODUCT_ISSUE_DESCRIPTION_MAX} characters.`,
    );
    if (lengthCheck.error) {
      errors.description = lengthCheck.error;
    }
  }

  if (values.files.length > PRODUCT_ISSUE_EVIDENCE_MAX_FILES) {
    errors.files = `You can attach at most ${PRODUCT_ISSUE_EVIDENCE_MAX_FILES} evidence files.`;
  } else {
    const invalidType = values.files.find((file) => !isAllowedEvidenceFile(file));
    if (invalidType) {
      errors.files = "Evidence files must be images or PDF.";
    } else {
      const oversized = values.files.find(
        (file) => typeof file.size === "number" && file.size > PRODUCT_ISSUE_EVIDENCE_MAX_BYTES,
      );
      if (oversized) {
        errors.files = "Each evidence file must be 10 MB or smaller.";
      }
    }
  }

  if (hasFieldErrors(errors) || quantity.value == null) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    payload: {
      orderItemId: values.orderItemId,
      issueType: values.issueType,
      description: description.value,
      affectedQuantity: quantity.value,
      files: values.files,
    },
  };
}
