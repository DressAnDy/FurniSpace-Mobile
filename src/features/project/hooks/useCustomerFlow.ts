import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import { OrderDto } from "../models/project.tracking.model";
import { OrderListItemDto } from "../models/order.model";
import { ProposalListQuery } from "../models/proposal.model";
import { QuotationListQuery } from "../models/quotation.model";
import { getOrderByIdApi, getProjectOrdersApi } from "../services/order.api";
import { getProjectSchedulesApi } from "../services/project.tracking.api";
import {
  getProjectProposalsApi,
  getProposalByIdApi,
  getProposalItemsApi,
  requestProposalRevisionApi,
  selectFinalProposalApi,
} from "../services/proposal.api";
import { pickRicherProposalItems } from "../utils/proposal.mapper";
import { enrichQuotationDeposit, resolveQuotationDisplayDeposit } from "../utils/quotation.mapper";
import { resolveOrderDisplayTotal } from "../utils/order.mapper";
import { getPaymentsApi } from "../../payment/services/payment.api";
import { updateProjectBasicInfoApi } from "../services/project.api";
import {
  acceptQuotationApi,
  getProjectQuotationsApi,
  getQuotationByIdApi,
  rejectQuotationApi,
  requestQuotationRevisionApi,
} from "../services/quotation.api";
import { refetchProjectTrackingQueries } from "./useProjectTracking";

async function resolveQuotationDepositAmount(
  quotation: Awaited<ReturnType<typeof getQuotationByIdApi>>,
): Promise<number | null> {
  const mappedDeposit = resolveQuotationDisplayDeposit(quotation);
  if (mappedDeposit > 0) {
    return mappedDeposit;
  }

  try {
    const orders = await getProjectOrdersApi(quotation.projectId);
    const order = orders.find((item) => item.quotationId === quotation.quotationId);
    if (order?.depositAmount != null && order.depositAmount > 0) {
      return order.depositAmount;
    }
  } catch {
    // Ignore order lookup failures and continue with payment fallback.
  }

  try {
    const payments = await getPaymentsApi({ projectId: quotation.projectId, limit: 20 });
    const depositPayment = payments.items.find((payment) => payment.paymentType === "DEPOSIT");
    if (depositPayment?.amount != null && depositPayment.amount > 0) {
      return depositPayment.amount;
    }
  } catch {
    // Ignore payment lookup failures and fall back to computed deposit.
  }

  return null;
}

function mapOrderListItem(item: OrderListItemDto): OrderDto {
  const totalAmount = resolveOrderDisplayTotal({
    originalTotalAmount: item.originalTotalAmount,
    paidAmount: item.paidAmount,
    remainingAmount: item.remainingAmount,
  });

  return {
    orderId: item.orderId,
    projectId: item.projectId,
    orderCode: item.orderCode,
    status: item.status,
    totalAmount,
    paidAmount: item.paidAmount,
    remainingAmount: item.remainingAmount,
    createdAt: item.createdAt,
  };
}

export function useProjectProposalsQuery(projectId: string | null, query: ProposalListQuery = {}) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.project.proposals(projectId ?? "none", query),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: () => getProjectProposalsApi(projectId!, query),
    staleTime: 30_000,
  });
}

export function useProposalDetailQuery(proposalId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.proposal.detail(proposalId ?? "none"),
    enabled: isLoggedIn && Boolean(proposalId),
    queryFn: async () => {
      const detail = await getProposalByIdApi(proposalId!);
      if (detail.items.length > 0) {
        return detail;
      }

      const itemsResponse = await getProposalItemsApi(proposalId!, { limit: 50 }).catch(() => null);
      if (!itemsResponse) {
        return detail;
      }

      return {
        ...detail,
        items: pickRicherProposalItems(detail.items, itemsResponse.items),
      };
    },
    staleTime: 30_000,
  });
}

export function useProposalItemsQuery(proposalId: string | null, sceneId?: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.proposal.items(proposalId ?? "none", sceneId ? { sceneId } : {}),
    enabled: isLoggedIn && Boolean(proposalId),
    queryFn: () => getProposalItemsApi(proposalId!, { ...(sceneId ? { sceneId } : {}), limit: 50 }),
    staleTime: 30_000,
  });
}

export function useProjectQuotationsQuery(projectId: string | null, query: QuotationListQuery = {}) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.project.quotations(projectId ?? "none", query),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: async () => {
      const response = await getProjectQuotationsApi(projectId!, query);
      return {
        ...response,
        items: response.items.map((quotation) => enrichQuotationDeposit(quotation)),
      };
    },
    staleTime: 30_000,
  });
}

export function useQuotationDetailQuery(quotationId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.quotation.detail(quotationId ?? "none"),
    enabled: isLoggedIn && Boolean(quotationId),
    queryFn: async () => {
      const detail = await getQuotationByIdApi(quotationId!);
      const depositAmount = await resolveQuotationDepositAmount(detail);
      return enrichQuotationDeposit(detail, depositAmount);
    },
    staleTime: 30_000,
  });
}

export function useOrderDetailQuery(orderId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.order.detail(orderId ?? "none"),
    enabled: isLoggedIn && Boolean(orderId),
    queryFn: () => getOrderByIdApi(orderId!),
    staleTime: 30_000,
  });
}

export function prefetchOrderDetailQuery(
  queryClient: ReturnType<typeof useQueryClient>,
  orderId: string,
): Promise<void> {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.order.detail(orderId),
    queryFn: () => getOrderByIdApi(orderId),
    staleTime: 30_000,
  });
}

export function useProjectOrdersQuery(projectId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.project.orders(projectId ?? "none"),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: async () => {
      const items = await getProjectOrdersApi(projectId!);
      return items.map(mapOrderListItem);
    },
    staleTime: 30_000,
  });
}

export function useProjectSchedulesQuery(projectId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.project.schedules(projectId ?? "none"),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: () => getProjectSchedulesApi(projectId!),
    staleTime: 30_000,
  });
}

function invalidateCustomerFlow(queryClient: ReturnType<typeof useQueryClient>, projectId: string): void {
  void refetchProjectTrackingQueries(queryClient, projectId);
  void queryClient.invalidateQueries({ queryKey: ["project", "proposals", projectId] });
  void queryClient.invalidateQueries({ queryKey: ["project", "quotations", projectId] });
  void queryClient.invalidateQueries({ queryKey: ["proposal", "detail"] });
  void queryClient.invalidateQueries({ queryKey: ["quotation", "detail"] });
  void queryClient.invalidateQueries({ queryKey: ["order", "detail"] });
}

export function useSelectFinalProposalMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ proposalId, note }: { proposalId: string; note?: string }) =>
      selectFinalProposalApi(proposalId, note ? { note } : {}),
    onSuccess: () => {
      if (projectId) {
        invalidateCustomerFlow(queryClient, projectId);
      }
    },
  });
}

export function useRequestProposalRevisionMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ proposalId, revisionNote }: { proposalId: string; revisionNote: string }) =>
      requestProposalRevisionApi(proposalId, { revisionNote }),
    onSuccess: () => {
      if (projectId) {
        invalidateCustomerFlow(queryClient, projectId);
      }
    },
  });
}

export function useAcceptQuotationMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quotationId: string) => acceptQuotationApi(quotationId),
    onSuccess: () => {
      if (projectId) {
        invalidateCustomerFlow(queryClient, projectId);
      }
    },
  });
}

export function useRequestQuotationRevisionMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quotationId, revisionReason }: { quotationId: string; revisionReason: string }) =>
      requestQuotationRevisionApi(quotationId, { revisionReason }),
    onSuccess: () => {
      if (projectId) {
        invalidateCustomerFlow(queryClient, projectId);
      }
    },
  });
}

export function useRejectQuotationMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quotationId, rejectReason }: { quotationId: string; rejectReason: string }) =>
      rejectQuotationApi(quotationId, { rejectReason }),
    onSuccess: () => {
      if (projectId) {
        invalidateCustomerFlow(queryClient, projectId);
      }
    },
  });
}

export function useUpdateProjectBasicInfoMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof updateProjectBasicInfoApi>[1]) =>
      updateProjectBasicInfoApi(projectId!, payload),
    onSuccess: () => {
      if (projectId) {
        invalidateCustomerFlow(queryClient, projectId);
      }
    },
  });
}
