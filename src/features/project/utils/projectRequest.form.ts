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

export type UpdateBasicInfoFormInput = ProjectRequestFormInput & {
  businessPurpose: string;
};

/** Validation messages aligned with FE web / mobile handoff. */
export function validateUpdateProjectBasicInfoForm(
  values: UpdateBasicInfoFormInput,
): ProjectRequestFieldErrors & { businessPurpose?: string } {
  const errors: ProjectRequestFieldErrors & { businessPurpose?: string } = {};

  const projectName = requiredTrimmed(values.projectName, "Project name is required.");
  if (projectName.error) {
    errors.projectName = projectName.error;
  }

  const businessType = requiredTrimmed(values.businessType, "Business type is required.");
  if (businessType.error) {
    errors.businessType = businessType.error;
  }

  const furnitureRequirement = requiredTrimmed(
    values.furnitureRequirement,
    "Furniture requirement is required.",
  );
  if (furnitureRequirement.error) {
    errors.furnitureRequirement = furnitureRequirement.error;
  }

  const areaRaw = values.totalAreaSqm.trim().replace(",", ".");
  if (areaRaw) {
    const area = Number(areaRaw);
    if (!Number.isFinite(area)) {
      errors.totalAreaSqm = "Total Area (sqm) must be a valid number.";
    } else if (area < 0) {
      errors.totalAreaSqm = "Total Area (sqm) cannot be negative.";
    } else if (area > 10_000) {
      errors.totalAreaSqm =
        "Total Area (sqm) cannot exceed 10,000. This project request is not feasible.";
    }
  }

  const floorsRaw = values.numberOfFloors.trim();
  if (floorsRaw) {
    const floors = Number(floorsRaw.replace(/[,\s]/g, ""));
    if (!Number.isInteger(floors) || floors <= 0) {
      errors.numberOfFloors = "Number of Floors must be an integer greater than 0.";
    }
  }

  const budgetMin = values.budgetMin.trim() ? parseVndAmount(values.budgetMin) : undefined;
  const budgetMax = values.budgetMax.trim() ? parseVndAmount(values.budgetMax) : undefined;
  if (values.budgetMin.trim()) {
    if (budgetMin === undefined) {
      errors.budgetMin = "Minimum Budget must be a valid number.";
    } else if (budgetMin < 100_000) {
      errors.budgetMin = "Minimum Budget must be at least 100,000.";
    } else if (budgetMin > 1_000_000_000) {
      errors.budgetMin = "Minimum Budget cannot exceed 1,000,000,000.";
    }
  }
  if (values.budgetMax.trim()) {
    if (budgetMax === undefined) {
      errors.budgetMax = "Maximum Budget must be a valid number.";
    } else if (budgetMax < 100_000) {
      errors.budgetMax = "Maximum Budget must be at least 100,000.";
    } else if (budgetMax > 1_000_000_000) {
      errors.budgetMax = "Maximum Budget cannot exceed 1,000,000,000.";
    }
  }
  if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
    errors.budgetMax = "Minimum Budget cannot be greater than Maximum Budget.";
  }

  if (values.targetCompletionDate) {
    const selected = new Date(`${values.targetCompletionDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(selected.getTime()) || selected < today) {
      errors.targetCompletionDate = "Target completion date cannot be in the past.";
    }
  }

  return errors;
}

export function buildUpdateBasicInfoPayload(values: UpdateBasicInfoFormInput): {
  payload: import("../models/project.model").UpdateProjectBasicInfoRequestDto;
  targetCompletionDate: string | null;
} {
  const areaRaw = values.totalAreaSqm.trim().replace(",", ".");
  const floorsRaw = values.numberOfFloors.trim();
  const budgetMin = values.budgetMin.trim() ? parseVndAmount(values.budgetMin) : undefined;
  const budgetMax = values.budgetMax.trim() ? parseVndAmount(values.budgetMax) : undefined;

  return {
    payload: {
      projectName: values.projectName.trim(),
      businessType: values.businessType.trim(),
      furnitureRequirement: values.furnitureRequirement.trim(),
      projectAddress: values.projectAddress.trim() || null,
      businessPurpose: values.businessPurpose.trim() || null,
      description: values.description.trim() || null,
      totalAreaSqm: areaRaw ? Number(areaRaw) : null,
      numberOfFloors: floorsRaw ? Number(floorsRaw.replace(/[,\s]/g, "")) : null,
      budgetMin: budgetMin ?? null,
      budgetMax: budgetMax ?? null,
    },
    targetCompletionDate: values.targetCompletionDate,
  };
}
