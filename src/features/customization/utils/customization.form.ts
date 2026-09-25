import { SubmitCustomizationRequestDto } from "../models/customization.model";

export type CustomizationFormValues = {
  requestTitle: string;
  requestDescription: string;
  requestedMaterial: string;
  requestedColor: string;
  requestedWidth: string;
  requestedHeight: string;
  requestedDepth: string;
  requestedChangeNote: string;
};

export type CustomizationFieldErrors = {
  requestTitle?: string;
  requestedWidth?: string;
  requestedHeight?: string;
  requestedDepth?: string;
  form?: string;
};

export function emptyCustomizationFormValues(): CustomizationFormValues {
  return {
    requestTitle: "",
    requestDescription: "",
    requestedMaterial: "",
    requestedColor: "",
    requestedWidth: "",
    requestedHeight: "",
    requestedDepth: "",
    requestedChangeNote: "",
  };
}

function parsePositiveNumber(raw: string, label: string): { value: number | null; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { value: null };
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { value: null, error: `${label} must be a number greater than 0.` };
  }

  return { value: parsed };
}

export function validateCustomizationForm(
  values: CustomizationFormValues,
  options: { includeChangeNote: boolean },
): { ok: true; payload: SubmitCustomizationRequestDto } | { ok: false; errors: CustomizationFieldErrors } {
  const errors: CustomizationFieldErrors = {};
  const requestTitle = values.requestTitle.trim();
  if (!requestTitle) {
    errors.requestTitle = "Title is required.";
  }

  const width = parsePositiveNumber(values.requestedWidth, "Width");
  const height = parsePositiveNumber(values.requestedHeight, "Height");
  const depth = parsePositiveNumber(values.requestedDepth, "Depth");
  if (width.error) {
    errors.requestedWidth = width.error;
  }
  if (height.error) {
    errors.requestedHeight = height.error;
  }
  if (depth.error) {
    errors.requestedDepth = depth.error;
  }

  const description = values.requestDescription.trim();
  const material = values.requestedMaterial.trim();
  const color = values.requestedColor.trim();
  const changeNote = values.requestedChangeNote.trim();
  const hasChange =
    Boolean(description || material || color || (options.includeChangeNote && changeNote)) ||
    width.value != null ||
    height.value != null ||
    depth.value != null;

  if (!hasChange && !width.error && !height.error && !depth.error) {
    errors.form = options.includeChangeNote
      ? "Add at least one change: description, material, color, dimensions, or a change note."
      : "Add at least one change: description, material, color, or dimensions.";
  }

  if (errors.requestTitle || errors.requestedWidth || errors.requestedHeight || errors.requestedDepth || errors.form) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    payload: {
      requestTitle,
      requestDescription: description || null,
      requestedMaterial: material || null,
      requestedColor: color || null,
      requestedWidth: width.value,
      requestedHeight: height.value,
      requestedDepth: depth.value,
      ...(options.includeChangeNote ? { requestedChangeNote: changeNote || null } : {}),
    },
  };
}
