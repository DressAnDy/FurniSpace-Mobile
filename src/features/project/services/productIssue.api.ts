import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { env } from "../../../core/config/env";
import { getAccessToken } from "../../../core/storage/secureStorage";
import { ApiResponse } from "../../../shared/types/api";
import {
  CreateProductIssueInput,
  ProductIssueReportDto,
  ProductIssueReportListDto,
} from "../models/productIssue.model";

function trimApiUrl(value: string): string {
  let apiUrl = value;
  while (apiUrl.endsWith("/")) {
    apiUrl = apiUrl.slice(0, -1);
  }
  return apiUrl;
}

export async function getProjectProductIssuesApi(projectId: string): Promise<ProductIssueReportListDto> {
  const response = await httpClient.get<ApiResponse<ProductIssueReportListDto>>(
    endpoints.productIssues.byProject(projectId),
  );
  return {
    items: response.data.data?.items ?? [],
  };
}

export async function getOrderProductIssuesApi(orderId: string): Promise<ProductIssueReportListDto> {
  const response = await httpClient.get<ApiResponse<ProductIssueReportListDto>>(
    endpoints.orders.productIssues(orderId),
  );
  return {
    items: response.data.data?.items ?? [],
  };
}

export async function getProductIssueApi(issueId: string): Promise<ProductIssueReportDto> {
  const response = await httpClient.get<ApiResponse<ProductIssueReportDto>>(
    endpoints.productIssues.detail(issueId),
  );
  return response.data.data;
}

export async function createProductIssueApi(input: CreateProductIssueInput): Promise<ProductIssueReportDto> {
  const formData = new FormData();
  formData.append("orderItemId", input.orderItemId);
  formData.append("issueType", input.issueType);
  formData.append("description", input.description.trim());

  if (input.deliveryItemId) {
    formData.append("deliveryItemId", input.deliveryItemId);
  }
  if (input.affectedQuantity != null) {
    formData.append("affectedQuantity", String(input.affectedQuantity));
  }

  for (const file of input.files ?? []) {
    formData.append("files", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? "application/octet-stream",
    } as unknown as Blob);
  }

  const token = await getAccessToken();
  const url = `${trimApiUrl(env.apiUrl)}${endpoints.orders.productIssues(input.orderId)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-Correlation-ID": `mobile-product-issue-${Date.now()}`,
    },
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<ProductIssueReportDto>
    | { message?: string; errorCode?: string; errors?: string[] }
    | null;

  if (!response.ok) {
    const message =
      (payload && "message" in payload && payload.message) ||
      (payload && "errors" in payload && Array.isArray(payload.errors) ? payload.errors[0] : null) ||
      "Unable to submit the product issue.";
    const error = new Error(String(message)) as Error & { errorCode?: string; status?: number };
    error.status = response.status;
    if (payload && "errorCode" in payload && payload.errorCode) {
      error.errorCode = payload.errorCode;
    }
    throw error;
  }

  if (payload && "data" in payload && payload.data) {
    return payload.data;
  }

  throw new Error("Invalid product issue response.");
}

export function getProductIssueErrorMessage(error: unknown, fallback = "Unable to load product issues."): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const coded = error as Error & { errorCode?: string; status?: number };
  if (coded.status === 413) {
    return "One or more evidence files are too large.";
  }
  if (coded.status === 415) {
    return "One or more evidence files use an unsupported format.";
  }
  if (coded.status === 403) {
    return "You do not have permission to access product issues for this order.";
  }
  if (coded.status === 404) {
    return "Product issues were not found for this project.";
  }

  const messages: Record<string, string> = {
    PRODUCT_ISSUE_NOT_DELIVERED: "This product has not been delivered yet.",
    PRODUCT_ISSUE_INVALID_AFFECTED_QUANTITY: "Affected quantity must be within the delivered quantity.",
    PRODUCT_ISSUE_DELIVERY_ITEM_ORDER_ITEM_MISMATCH: "The selected delivery item does not match this order item.",
    PRODUCT_ISSUE_FORBIDDEN: "You do not have permission to report an issue for this order.",
  };

  if (coded.errorCode && messages[coded.errorCode]) {
    return messages[coded.errorCode];
  }

  return coded.message?.trim() || fallback;
}
