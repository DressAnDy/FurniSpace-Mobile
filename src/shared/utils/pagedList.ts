export type PagedList<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

export function unwrapPagedList<T>(data: unknown): PagedList<T> {
  if (Array.isArray(data)) {
    return { items: data as T[], page: 1, limit: data.length, total: data.length };
  }

  if (!data || typeof data !== "object") {
    return { items: [], page: 1, limit: 0, total: 0 };
  }

  const raw = data as Record<string, unknown>;
  const items = Array.isArray(raw.items) ? (raw.items as T[]) : [];
  const page = typeof raw.page === "number" && raw.page > 0 ? raw.page : 1;
  const limit = typeof raw.limit === "number" && raw.limit > 0 ? raw.limit : items.length;
  const total = typeof raw.total === "number" && raw.total >= 0 ? raw.total : items.length;

  return { items, page, limit, total };
}
