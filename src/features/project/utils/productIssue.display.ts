import {
  ProductIssueReportDto,
  ProductIssueReportResolutionStatus,
  ProductIssueStatusFilter,
} from "../models/productIssue.model";

export function resolveProductIssueStatus(issue: ProductIssueReportDto): ProductIssueReportResolutionStatus {
  if (issue.status === "RESOLVED" || Boolean(issue.resolvedAt)) {
    return "RESOLVED";
  }

  return "OPEN";
}

export function filterProductIssuesByStatus(
  items: ProductIssueReportDto[],
  filter: ProductIssueStatusFilter,
): ProductIssueReportDto[] {
  if (filter === "ALL") {
    return items;
  }

  return items.filter((issue) => resolveProductIssueStatus(issue) === filter);
}

export function isEvidenceImage(mimeType: string | null | undefined, fileName?: string | null): boolean {
  if (mimeType?.toLowerCase().startsWith("image/")) {
    return true;
  }

  const name = (fileName ?? "").toLowerCase();
  return /\.(png|jpe?g|gif|webp|heic|bmp)$/i.test(name);
}
