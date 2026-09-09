import { endpoints } from "../../../core/api/endpoints";
import { httpClient } from "../../../core/api/httpClient";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { ApiResponse } from "../../../shared/types/api";
import {
  CreateDeliveryDelayReportInput,
  CreateProductionDelayReportInput,
  OperationalDelayPhase,
  OperationalDelayReportDto,
  OperationalDelayReportListDto,
} from "../models/operationalDelay.model";

export async function getProjectOperationalDelayReportsApi(
  projectId: string,
  phase: OperationalDelayPhase,
): Promise<OperationalDelayReportListDto> {
  const response = await httpClient.get<ApiResponse<OperationalDelayReportListDto>>(
    endpoints.delayReports.byProject(projectId),
    { params: { phase } },
  );
  return {
    items: response.data.data?.items ?? [],
  };
}

export async function getOperationalDelayReportApi(reportId: string): Promise<OperationalDelayReportDto> {
  const response = await httpClient.get<ApiResponse<OperationalDelayReportDto>>(
    endpoints.delayReports.detail(reportId),
  );
  return response.data.data;
}

export async function createProductionDelayReportApi(
  input: CreateProductionDelayReportInput,
): Promise<OperationalDelayReportDto> {
  const response = await httpClient.post<ApiResponse<OperationalDelayReportDto>>(
    endpoints.delayReports.production(input.projectId),
    {
      productionRequestId: input.productionRequestId,
      productionReasonCode: input.productionReasonCode,
      reasonDetail: input.reasonDetail.trim(),
    },
  );
  return response.data.data;
}

export async function createDeliveryDelayReportApi(
  input: CreateDeliveryDelayReportInput,
): Promise<OperationalDelayReportDto> {
  const payload: Record<string, string> = {
    deliveryReasonCode: input.deliveryReasonCode,
    reasonDetail: input.reasonDetail.trim(),
  };
  if (input.orderId) {
    payload.orderId = input.orderId;
  }
  if (input.deliveryId) {
    payload.deliveryId = input.deliveryId;
  }

  const response = await httpClient.post<ApiResponse<OperationalDelayReportDto>>(
    endpoints.delayReports.delivery(input.projectId),
    payload,
  );
  return response.data.data;
}

export function getReportReasonCode(report: OperationalDelayReportDto): string | null {
  return report.reportPhase === "PRODUCTION" ? report.productionReasonCode : report.deliveryReasonCode;
}

export function getOperationalDelayErrorMessage(error: unknown, fallback = "Unable to save the delay report."): string {
  const coded = error as { response?: { data?: { errorCode?: string | null; message?: string | null; errors?: string[] | null } } };
  const payload = coded.response?.data;
  const messages: Record<string, string> = {
    OPERATIONAL_DELAY_INVALID_REQUEST: "The delay report request is invalid.",
    OPERATIONAL_DELAY_PRODUCTION_DEADLINE_MISSING: "Set the production deadline before recording this report.",
    OPERATIONAL_DELAY_TARGET_COMPLETION_DATE_MISSING:
      "Set the project target completion date before recording this report.",
    OPERATIONAL_DELAY_PRODUCTION_REQUEST_PROJECT_MISMATCH: "The production request does not belong to this project.",
    OPERATIONAL_DELAY_ORDER_PROJECT_MISMATCH: "The order does not belong to this project.",
    OPERATIONAL_DELAY_DELIVERY_PROJECT_MISMATCH: "The delivery batch does not belong to this project.",
    OPERATIONAL_DELAY_PROJECT_NOT_FOUND: "Project was not found.",
    OPERATIONAL_DELAY_PRODUCTION_REQUEST_NOT_FOUND: "Production request was not found.",
    OPERATIONAL_DELAY_REPORT_NOT_FOUND: "Delay report was not found.",
  };

  if (payload?.errorCode && messages[payload.errorCode]) {
    return messages[payload.errorCode];
  }

  return payload?.message ?? payload?.errors?.[0] ?? getErrorMessage(error, fallback);
}
