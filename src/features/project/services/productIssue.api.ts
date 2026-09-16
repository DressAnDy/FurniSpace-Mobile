import axios from "axios";
import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { directUploadFile } from "../../../core/upload/directUpload";
import { ApiResponse } from "../../../shared/types/api";
import {
  CreateProductIssueInput,
  ProductIssueReportDto,
  ProductIssueReportListDto,
} from "../models/productIssue.model";

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
  const evidenceFileIds: string[] = [];
  for (const file of input.files ?? []) {
    const uploaded = await directUploadFile<{ fileId: string }>({
      preparePath: endpoints.orders.productIssueEvidenceUploadUrl(input.orderId),
      completePath: endpoints.orders.productIssueEvidenceComplete(input.orderId),
      file: {
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
      },
    });
    const uploadedRecord = uploaded as { fileId?: string; FileId?: string } | null;
    const fileId = uploadedRecord?.fileId ?? uploadedRecord?.FileId;
    if (!fileId) {
      throw new Error("Evidence upload did not return a file id.");
    }
    evidenceFileIds.push(fileId);
  }

  try {
    const response = await httpClient.post<ApiResponse<ProductIssueReportDto>>(
      endpoints.orders.productIssues(input.orderId),
      {
        orderItemId: input.orderItemId,
        issueType: input.issueType,
        description: input.description.trim(),
        ...(input.deliveryItemId ? { deliveryItemId: input.deliveryItemId } : {}),
        ...(input.affectedQuantity != null ? { affectedQuantity: input.affectedQuantity } : {}),
        ...(evidenceFileIds.length > 0 ? { evidenceFileIds } : {}),
      },
    );
    return response.data.data;
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw error;
    }
    const payload = error.response?.data as { message?: string; errorCode?: string | null } | undefined;
    const mapped = new Error(payload?.message?.trim() || "Unable to submit the product issue.") as Error & {
      errorCode?: string;
      status?: number;
    };
    mapped.status = error.response?.status;
    mapped.errorCode = payload?.errorCode ?? undefined;
    throw mapped;
  }
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
    PRODUCT_ISSUE_EVIDENCE_FILE_INVALID: "One or more evidence photos are not ready. Upload them again, then submit.",
  };

  if (coded.errorCode && messages[coded.errorCode]) {
    return messages[coded.errorCode];
  }

  return coded.message?.trim() || fallback;
}
