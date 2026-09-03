import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import {
  BulkQuotationFinancialsRequestDto,
  CreateProposalSceneRequestDto,
  PublishProposalRequestDto,
  UpdateProposalItemRequestDto,
  UpdateQuotationHeaderRequestDto,
  UpdateQuotationItemFinancialsRequestDto,
  UpsertProposalRequestDto,
} from "../models/sale.commercial.model";
import {
  bulkUpdateQuotationFinancialsApi,
  cancelQuotationApi,
  createProposalApi,
  createProposalSceneApi,
  createQuotationApi,
  getProjectProposalsApi,
  getProjectQuotationsApi,
  getProposalByIdApi,
  getQuotationByIdApi,
  publishProposalApi,
  reopenProposalForEditingApi,
  reviseQuotationApi,
  sendQuotationApi,
  updateProposalApi,
  updateProposalItemApi,
  updateQuotationHeaderApi,
  updateQuotationItemFinancialsApi,
} from "../services/sale.commercial.api";

export function useSaleProposalsQuery(projectId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.sale.proposals(projectId ?? "none"),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: () => getProjectProposalsApi(projectId!),
  });
}

export function useSaleProposalDetailQuery(proposalId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: ["sale", "proposal", proposalId ?? "none"],
    enabled: isLoggedIn && Boolean(proposalId),
    queryFn: () => getProposalByIdApi(proposalId!),
  });
}

export function useSaleQuotationsQuery(projectId: string | null, status?: string) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.sale.quotations(projectId ?? "none", status),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: () => getProjectQuotationsApi(projectId!, status),
  });
}

export function useSaleQuotationDetailQuery(quotationId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: ["sale", "quotation", quotationId ?? "none"],
    enabled: isLoggedIn && Boolean(quotationId),
    queryFn: () => getQuotationByIdApi(quotationId!),
  });
}

export function useCreateProposalMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertProposalRequestDto) => createProposalApi(projectId!, payload),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.proposals(projectId) });
      }
    },
  });
}

export function useUpdateProposalMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, payload }: { proposalId: string; payload: UpsertProposalRequestDto }) =>
      updateProposalApi(proposalId, payload),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.proposals(projectId) });
      }
    },
  });
}

export function usePublishProposalMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, payload }: { proposalId: string; payload?: PublishProposalRequestDto }) =>
      publishProposalApi(proposalId, payload),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.proposals(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
      }
    },
  });
}

export function useReopenProposalEditingMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: string) => reopenProposalForEditingApi(proposalId),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.proposals(projectId) });
      }
    },
  });
}

export function useCreateProposalSceneMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, payload }: { proposalId: string; payload: CreateProposalSceneRequestDto }) =>
      createProposalSceneApi(proposalId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["sale", "proposal", variables.proposalId] });
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.proposals(projectId) });
      }
    },
  });
}

export function useUpdateProposalItemMutation() {
  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: UpdateProposalItemRequestDto }) =>
      updateProposalItemApi(itemId, payload),
  });
}

export function useCreateQuotationMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => createQuotationApi(projectId!),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.quotations(projectId) });
      }
    },
  });
}

export function useUpdateQuotationHeaderMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quotationId, payload }: { quotationId: string; payload: UpdateQuotationHeaderRequestDto }) =>
      updateQuotationHeaderApi(quotationId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["sale", "quotation", variables.quotationId] });
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.quotations(projectId) });
      }
    },
  });
}

export function useUpdateQuotationItemFinancialsMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      quotationId,
      itemId,
      payload,
    }: {
      quotationId: string;
      itemId: string;
      payload: UpdateQuotationItemFinancialsRequestDto;
    }) => updateQuotationItemFinancialsApi(quotationId, itemId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["sale", "quotation", variables.quotationId] });
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.quotations(projectId) });
      }
    },
  });
}

export function useBulkUpdateQuotationFinancialsMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quotationId, payload }: { quotationId: string; payload: BulkQuotationFinancialsRequestDto }) =>
      bulkUpdateQuotationFinancialsApi(quotationId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["sale", "quotation", variables.quotationId] });
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.quotations(projectId) });
      }
    },
  });
}

export function useSendQuotationMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quotationId: string) => sendQuotationApi(quotationId),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.quotations(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
      }
    },
  });
}

export function useReviseQuotationMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quotationId: string) => reviseQuotationApi(quotationId),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.quotations(projectId) });
      }
    },
  });
}

export function useCancelQuotationMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quotationId: string) => cancelQuotationApi(quotationId),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.quotations(projectId) });
      }
    },
  });
}
