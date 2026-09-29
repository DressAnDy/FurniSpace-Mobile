import type { QueryClient } from "@tanstack/react-query";
import { DeviceEventEmitter } from "react-native";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { readMetadataString } from "../../notification/utils/notification.metadata";

export const PRODUCT_ISSUE_RESOLVED_EVENT = "product-issue:resolved";

type ProductIssueEventSource = {
  notificationType?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  projectId?: string | null;
  metadata?: Record<string, unknown>;
};

export function isProductIssueNotification(source: ProductIssueEventSource): boolean {
  const type = (source.notificationType ?? "").toLowerCase();
  const referenceType = (source.referenceType ?? "").toUpperCase();

  if (type.startsWith("product_issue.")) {
    return true;
  }

  if (
    type.includes("productissuereported") ||
    type.includes("productissueresolved") ||
    type.includes("productissue") ||
    type.includes("product_issue")
  ) {
    return true;
  }

  return referenceType === "DELIVERY_PRODUCT_ISSUE_REPORT";
}

export function isProductIssueResolvedEvent(source: ProductIssueEventSource): boolean {
  const type = (source.notificationType ?? "").toLowerCase();
  return type.includes("product_issue.resolved") || type.includes("productissueresolved");
}

export function extractProductIssueId(source: ProductIssueEventSource): string | null {
  const fromMeta =
    readMetadataString(source.metadata, "issueId") ??
    readMetadataString(source.metadata, "deliveryProductIssueReportId");
  if (fromMeta) {
    return fromMeta;
  }

  if ((source.referenceType ?? "").toUpperCase() === "DELIVERY_PRODUCT_ISSUE_REPORT" && source.referenceId) {
    return source.referenceId;
  }

  return null;
}

export function extractProductIssueOrderId(source: ProductIssueEventSource): string | null {
  return readMetadataString(source.metadata, "orderId") ?? null;
}

export function invalidateProductIssueQueries(queryClient: QueryClient, source: ProductIssueEventSource): void {
  void queryClient.invalidateQueries({ queryKey: ["product-issue"] });

  const issueId = extractProductIssueId(source);
  if (issueId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.productIssue.detail(issueId) });
  }

  const orderId = extractProductIssueOrderId(source);
  if (orderId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.productIssue.byOrder(orderId) });
  }

  if (source.projectId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.productIssue.byProject(source.projectId) });
  }

  if (isProductIssueResolvedEvent(source)) {
    DeviceEventEmitter.emit(PRODUCT_ISSUE_RESOLVED_EVENT, { issueId });
  }
}
