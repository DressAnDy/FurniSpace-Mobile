export type FieldErrors<T extends string = string> = Partial<Record<T, string>> & {
  form?: string;
};

export function requiredTrimmed(
  value: string | null | undefined,
  message: string,
): { value: string; error?: string } {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return { value: "", error: message };
  }
  return { value: trimmed };
}

export function enforceMaxLength(
  value: string,
  max: number,
  message: string,
): { value: string; error?: string } {
  if (value.length > max) {
    return { value, error: message };
  }
  return { value };
}

export function parseOptionalPositiveNumber(
  raw: string | null | undefined,
  label: string,
): { value: number | null; error?: string } {
  const trimmed = (raw ?? "").trim().replace(",", ".");
  if (!trimmed) {
    return { value: null };
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return { value: null, error: `${label} must be a valid number.` };
  }
  if (parsed <= 0) {
    return { value: null, error: `${label} must be greater than 0.` };
  }

  return { value: parsed };
}

export function parseRequiredPositiveInteger(
  raw: string | null | undefined,
  options: {
    emptyMessage: string;
    invalidMessage: string;
    max?: number;
    maxMessage?: string;
  },
): { value: number | null; error?: string } {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return { value: null, error: options.emptyMessage };
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { value: null, error: options.invalidMessage };
  }

  if (options.max != null && parsed > options.max) {
    return {
      value: null,
      error: options.maxMessage ?? `Value must be less than or equal to ${options.max}.`,
    };
  }

  return { value: parsed };
}

export function hasFieldErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some((value) => Boolean(value));
}

/** Keep typed decimals only (digits + one `.` / `,`). */
export function sanitizeDecimalInput(value: string): string {
  const normalized = value.replace(/,/g, ".");
  const cleaned = normalized.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot < 0) {
    return cleaned;
  }
  return `${cleaned.slice(0, firstDot + 1)}${cleaned.slice(firstDot + 1).replace(/\./g, "")}`;
}

export function sanitizeIntegerInput(value: string): string {
  return value.replace(/\D/g, "");
}
