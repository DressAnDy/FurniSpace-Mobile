import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import {
  AssignProductionRequestDto,
  CreateDeliveryRequestDto,
  CreateOrderPaymentRequestDto,
  CreateProductionRequestDto,
} from "../models/sale.fulfillment.model";
import {
  assignProductionRequestApi,
  completeOrderApi,
  completeOrderDeliveryBatchApi,
  completeProjectApi,
  createOrderDeliveryApi,
  createProductionRequestApi,
  createSaleOrderDepositPaymentApi,
  createSaleOrderRemainingPaymentApi,
  getAvailableProductionStaffApi,
  getOrderDeliveriesApi,
  getOrderDeliveryTrackingApi,
  getProductionRequestsApi,
  getSaleOrderByIdApi,
  getSaleProjectOrdersApi,
  prepareFinalPaymentApi,
} from "../services/sale.fulfillment.api";

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
    queryKey: ["sale", "order", orderId ?? "none"],
    enabled: isLoggedIn && Boolean(orderId),
    queryFn: () => getSaleOrderByIdApi(orderId!),
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

export function useSaleProductionRequestsQuery(projectId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.sale.productionRequests({ projectId }),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: () => getProductionRequestsApi({ projectId: projectId!, page: 1, limit: 20 }),
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

export function useCreateSaleDepositMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload?: CreateOrderPaymentRequestDto }) =>
      createSaleOrderDepositPaymentApi(orderId, payload),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.orders(projectId) });
      }
    },
  });
}

export function useCreateSaleRemainingPaymentMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload?: CreateOrderPaymentRequestDto }) =>
      createSaleOrderRemainingPaymentApi(orderId, payload),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.orders(projectId) });
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
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.productionRequests({ projectId }) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.orders(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
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
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.productionRequests({ projectId }) });
      }
    },
  });
}

export function useCreateOrderDeliveryMutation(orderId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDeliveryRequestDto) => createOrderDeliveryApi(orderId!, payload),
    onSuccess: () => {
      if (orderId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.deliveries(orderId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.deliveryTracking(orderId) });
      }
    },
  });
}

export function useCompleteOrderDeliveryMutation(orderId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deliveryId: string) => completeOrderDeliveryBatchApi(orderId!, deliveryId),
    onSuccess: () => {
      if (orderId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.deliveries(orderId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.deliveryTracking(orderId) });
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
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.orders(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
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
    },
  });
}
