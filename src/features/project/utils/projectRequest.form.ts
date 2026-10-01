import {
  FieldErrors,
  enforceMaxLength,
  hasFieldErrors,
  parseOptionalPositiveNumber,
  requiredTrimmed,
} from "../../../shared/validation/formRules";
import type { CreateProjectRequestDto } from "../models/project.model";

export const PROJECT_NAME_MAX = 150;
export const BUSINESS_TYPE_MAX = 100;
export const FURNITURE_REQUIREMENT_MAX = 2000;
export const PROJECT_ADDRESS_MAX = 500;
export const PROJECT_DESCRIPTION_MAX = 2000;

export type ProjectRequestFieldErrors = FieldErrors<
  | "projectName"
  | "businessType"
  | "furnitureRequirement"
  | "projectAddress"
  | "description"
  | "totalAreaSqm"
  | "numberOfFloors"
  | "budgetMin"
  | "budgetMax"
  | "targetCompletionDate"
>;

export type ProjectRequestFormInput = {
  projectName: string;
  businessType: string;
  furnitureRequirement: string;
  projectAddress: string;
  description: string;
  totalAreaSqm: string;
  numberOfFloors: string;
  budgetMin: string;
  budgetMax: string;
  targetCompletionDate: string | null;
};

function parseVndAmount(value: string): number | undefined {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return undefined;
  }
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function validateProjectRequestForm(
  values: ProjectRequestFormInput,
): { ok: true; payload: CreateProjectRequestDto } | { ok: false; errors: ProjectRequestFieldErrors } {
  const errors: ProjectRequestFieldErrors = {};

  const projectName = requiredTrimmed(values.projectName, "Project name is required.");
  if (projectName.error) {
    errors.projectName = projectName.error;
  } else {
    const length = enforceMaxLength(
      projectName.value,
      PROJECT_NAME_MAX,
      `Project name must be at most ${PROJECT_NAME_MAX} characters.`,
    );
    if (length.error) {
      errors.projectName = length.error;
    } else if (projectName.value.length < 2) {
      errors.projectName = "Project name must be at least 2 characters.";
    }
  }

  const businessType = requiredTrimmed(values.businessType, "Business type is required.");
  if (businessType.error) {
    errors.businessType = businessType.error;
  } else {
    const length = enforceMaxLength(
      businessType.value,
      BUSINESS_TYPE_MAX,
      `Business type must be at most ${BUSINESS_TYPE_MAX} characters.`,
    );
    if (length.error) {
      errors.businessType = length.error;
    }
  }

  const furnitureRequirement = requiredTrimmed(
    values.furnitureRequirement,
    "Furniture requirement is required.",
  );
  if (furnitureRequirement.error) {
    errors.furnitureRequirement = furnitureRequirement.error;
  } else {
    const length = enforceMaxLength(
      furnitureRequirement.value,
      FURNITURE_REQUIREMENT_MAX,
      `Furniture requirement must be at most ${FURNITURE_REQUIREMENT_MAX} characters.`,
    );
    if (length.error) {
      errors.furnitureRequirement = length.error;
    }
  }

  const projectAddress = values.projectAddress.trim();
  if (projectAddress) {
    const length = enforceMaxLength(
      projectAddress,
      PROJECT_ADDRESS_MAX,
      `Address must be at most ${PROJECT_ADDRESS_MAX} characters.`,
    );
    if (length.error) {
      errors.projectAddress = length.error;
    }
  }

  const description = values.description.trim();
  if (description) {
    const length = enforceMaxLength(
      description,
      PROJECT_DESCRIPTION_MAX,
      `Notes must be at most ${PROJECT_DESCRIPTION_MAX} characters.`,
    );
    if (length.error) {
      errors.description = length.error;
    }
  }

  const area = parseOptionalPositiveNumber(values.totalAreaSqm, "Total area");
  if (area.error) {
    errors.totalAreaSqm = area.error;
  }

  const floorsRaw = values.numberOfFloors.trim();
  if (floorsRaw) {
    const floors = Number(floorsRaw.replace(/[,\s]/g, ""));
    if (!Number.isInteger(floors) || floors <= 0) {
      errors.numberOfFloors = "Number of floors must be a positive whole number.";
    }
  }

  const budgetMin = values.budgetMin.trim() ? parseVndAmount(values.budgetMin) : undefined;
  const budgetMax = values.budgetMax.trim() ? parseVndAmount(values.budgetMax) : undefined;
  if (values.budgetMin.trim() && (budgetMin === undefined || budgetMin < 0)) {
    errors.budgetMin = "Minimum budget is invalid.";
  }
  if (values.budgetMax.trim() && (budgetMax === undefined || budgetMax < 0)) {
    errors.budgetMax = "Maximum budget is invalid.";
  }
  if (budgetMin != null && budgetMax != null && budgetMax < budgetMin) {
    errors.budgetMax = "Maximum budget must be greater than or equal to minimum budget.";
  }

  if (values.targetCompletionDate) {
    const selected = new Date(`${values.targetCompletionDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(selected.getTime()) || selected < today) {
      errors.targetCompletionDate = "Target completion date cannot be in the past.";
    }
  }

  if (hasFieldErrors(errors)) {
    return { ok: false, errors };
  }

  const floorsValue = floorsRaw
    ? Number(floorsRaw.replace(/[,\s]/g, ""))
    : undefined;

  return {
    ok: true,
    payload: {
      projectName: projectName.value,
      businessType: businessType.value,
      furnitureRequirement: furnitureRequirement.value,
      ...(projectAddress ? { projectAddress } : {}),
      ...(description ? { description } : {}),
      ...(area.value != null ? { totalAreaSqm: area.value } : {}),
      ...(floorsValue != null ? { numberOfFloors: floorsValue } : {}),
      ...(budgetMin != null ? { budgetMin } : {}),
      ...(budgetMax != null ? { budgetMax } : {}),
      ...(values.targetCompletionDate ? { targetCompletionDate: values.targetCompletionDate } : {}),
    },
  };
}

export function validateUpdateProjectBasicInfoForm(values: {
  projectName: string;
  businessType: string;
  furnitureRequirement: string;
  projectAddress: string;
  description: string;
  targetCompletionDate?: string | null;
}): ProjectRequestFieldErrors {
  const result = validateProjectRequestForm({
    ...values,
    totalAreaSqm: "",
    numberOfFloors: "",
    budgetMin: "",
    budgetMax: "",
    targetCompletionDate: values.targetCompletionDate ?? null,
  });

  if (result.ok) {
    return {};
  }

  const { totalAreaSqm: _a, numberOfFloors: _b, budgetMin: _c, budgetMax: _d, ...rest } = result.errors;
  return rest;
}
