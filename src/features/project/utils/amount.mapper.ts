export function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function readAmount(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replaceAll(",", "").trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

export function pickAmount(source: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const amount = readAmount(source[key]);
    if (amount != null) {
      return amount;
    }
  }

  return undefined;
}

export function pickAmountFromSources(
  sources: Array<Record<string, unknown> | null | undefined>,
  ...keys: string[]
): number | undefined {
  for (const source of sources) {
    if (!source) {
      continue;
    }

    const amount = pickAmount(source, ...keys);
    if (amount != null) {
      return amount;
    }
  }

  return undefined;
}

export function collectAmountSources(raw: Record<string, unknown>): Record<string, unknown>[] {
  const nestedKeys = [
    "pricing",
    "pricingSummary",
    "summary",
    "totals",
    "amounts",
    "financialSummary",
    "financials",
    "paymentSummary",
    "paymentTerms",
    "quotationSummary",
  ];
  const sources = [raw];

  for (const key of nestedKeys) {
    const nested = readRecord(raw[key]);
    if (nested) {
      sources.push(nested);
    }
  }

  return sources;
}

export function isDepositPercentKey(key: string): boolean {
  return /percent|rate|ratio/i.test(key);
}

export function isDepositAmountKey(key: string): boolean {
  if (/deposit/i.test(key) && isDepositPercentKey(key)) {
    return false;
  }

  return /deposit|initial.?payment|down.?payment|advance/i.test(key);
}

export function findAmountByKeyPattern(value: unknown, matcher: (key: string) => boolean, depth = 0): number | undefined {
  if (depth > 5) {
    return undefined;
  }

  const record = readRecord(value);
  if (!record) {
    return undefined;
  }

  for (const [key, nestedValue] of Object.entries(record)) {
    if (matcher(key)) {
      const amount = readAmount(nestedValue);
      if (amount != null) {
        return amount;
      }
    }

    const nestedAmount = findAmountByKeyPattern(nestedValue, matcher, depth + 1);
    if (nestedAmount != null) {
      return nestedAmount;
    }
  }

  return undefined;
}

export function normalizeDepositPercent(value: number | undefined): number | undefined {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  if (value <= 1) {
    return value;
  }

  if (value <= 100) {
    return value / 100;
  }

  return undefined;
}

export function computeDepositFromPercent(
  percent: number | undefined,
  totalAmount?: number,
  preVatAmount?: number,
  defaultPercent = 0.3,
): number | undefined {
  const rate = normalizeDepositPercent(percent) ?? defaultPercent;
  const base = preVatAmount ?? totalAmount;

  if (base == null || base <= 0) {
    return undefined;
  }

  return Math.round(base * rate);
}
