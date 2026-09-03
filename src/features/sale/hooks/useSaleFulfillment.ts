import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import { refetchSaleProjectOverviewQueries } from "./useSaleCommercial";
import {
  AssignProductionRequestDto,
  CreateOrderPaymentRequestDto,
  CreateProductionRequestDto,
} from "../models/sale.fulfillment.model";
import {
  assignProductionRequestApi,
  completeOrderApi,
  completeProjectApi,
  createProductionRequestApi,
  createSaleOrderDepositPaymentApi,
  createSaleOrderRemainingPaymentApi,
  getAvailableProductionStaffApi,
  getOrderDeliveriesApi,
  getOrderDeliveryTrackingApi,
  getProductionRequestsApi,
  getSaleOrderByIdApi,
  getSaleOrderPaymentsApi,
  getSaleProjectOrdersApi,
  prepareFinalPaymentApi,
  putProductionPhaseDeadlineApi,
} from "../services/sale.fulfillment.api";

function refreshSaleProjectOverview(queryClient: QueryClient, projectId: string | null): void {
  if (projectId) {
    void refetchSaleProjectOverviewQueries(queryClient, projectId);
  }
}

export function useSaleOrdersQuery(projectId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.sale.orders(projectId ?? "none"),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: () => getSaleProjectOrdersApi(projectId!),
  });
}

export function useSaleOrderDetailQuery(orderId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.order.detail(orderId ?? "none"),
    enabled: isLoggedIn && Boolean(orderId),
    queryFn: () => getSaleOrderByIdApi(orderId!),
  });
}

export function useSaleOrderPaymentsQuery(
  orderId: string | null,
  query: { status?: string; paymentType?: string } = {},
) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: ["sale", "order", orderId ?? "none", "payments", query],
    enabled: isLoggedIn && Boolean(orderId),
    queryFn: () => getSaleOrderPaymentsApi(orderId!, query),
  });
}

export function useAvailableProductionStaffQuery(projectId?: string) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: ["sale", "production-staff", projectId ?? "all"],
    enabled: isLoggedIn,
    queryFn: () => getAvailableProductionStaffApi({ projectId, page: 1, pageSize: 50 }),
  });
}

export function useSaleProductionRequestsQuery(projectId: string | null, orderId?: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.sale.productionRequests({ projectId, orderId }),
    enabled: isLoggedIn && Boolean(projectId || orderId),
    queryFn: () =>
      getProductionRequestsApi({
        projectId: projectId ?? undefined,
        orderId: orderId ?? undefined,
        page: 1,
        limit: 20,
      }),
  });
}

export function useOrderDeliveriesQuery(orderId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.sale.deliveries(orderId ?? "none"),
    enabled: isLoggedIn && Boolean(orderId),
    queryFn: () => getOrderDeliveriesApi(orderId!),
  });
}

export function useOrderDeliveryTrackingQuery(orderId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.sale.deliveryTracking(orderId ?? "none"),
    enabled: isLoggedIn && Boolean(orderId),
    queryFn: () => getOrderDeliveryTrackingApi(orderId!),
  });
}

export function usePutProductionPhaseDeadlineMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { productionDeadline: string }) => putProductionPhaseDeadlineApi(projectId!, payload),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.phaseDeadlines(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.orders(projectId) });
        refreshSaleProjectOverview(queryClient, projectId);
      }
    },
  });
}

export function useCreateSaleDepositMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload?: CreateOrderPaymentRequestDto }) =>
      createSaleOrderDepositPaymentApi(orderId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.order.detail(variables.orderId) });
      void queryClient.invalidateQueries({ queryKey: ["sale", "order", variables.orderId, "payments"] });
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.orders(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
        refreshSaleProjectOverview(queryClient, projectId);
      }
    },
  });
}

export function useCreateSaleRemainingPaymentMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload?: CreateOrderPaymentRequestDto }) =>
      createSaleOrderRemainingPaymentApi(orderId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.order.detail(variables.orderId) });
      void queryClient.invalidateQueries({ queryKey: ["sale", "order", variables.orderId, "payments"] });
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.orders(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
        refreshSaleProjectOverview(queryClient, projectId);
      }
    },
  });
}

export function useCreateProductionRequestMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: CreateProductionRequestDto }) =>
      createProductionRequestApi(orderId, payload),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: ["sale", "production-requests"] });
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.orders(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
        refreshSaleProjectOverview(queryClient, projectId);
      }
    },
  });
}

export function useAssignProductionRequestMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productionRequestId,
      payload,
    }: {
      productionRequestId: string;
      payload: AssignProductionRequestDto;
    }) => assignProductionRequestApi(productionRequestId, payload),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: ["sale", "production-requests"] });
      }
    },
  });
}

export function usePrepareFinalPaymentMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => prepareFinalPaymentApi(orderId),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.orders(projectId) });
      }
    },
  });
}

export function useCompleteOrderMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => completeOrderApi(orderId),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.order.detail(data.orderId) });
      void queryClient.invalidateQueries({ queryKey: ["sale", "order", data.orderId, "payments"] });
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.orders(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
        refreshSaleProjectOverview(queryClient, projectId);
      }
    },
  });
}

export function useCompleteProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => completeProjectApi(projectId),
    onSuccess: (_data, projectId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["project", "list"] });
      refreshSaleProjectOverview(queryClient, projectId);
    },
  });
}
