import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import {
  CustomizationRequestListQuery,
  SubmitCustomizationRequestDto,
} from "../models/customization.model";
import {
  acceptCustomizationRequestApi,
  getCustomizationRequestApi,
  getProjectCustomizationRequestsApi,
  submitCustomizationRequestApi,
} from "../services/customization.api";

type CustomizationScope = {
  projectId?: string | null;
  proposalId?: string | null;
};

function invalidateCustomizationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  scope: CustomizationScope,
): void {
  void queryClient.invalidateQueries({ queryKey: ["customization"] });
  void queryClient.invalidateQueries({ queryKey: ["notification"] });
  void queryClient.invalidateQueries({ queryKey: ["project", "list"] });
  void queryClient.invalidateQueries({ queryKey: ["proposal", "detail"] });
  void queryClient.invalidateQueries({ queryKey: ["proposal", "items"] });
  void queryClient.invalidateQueries({ queryKey: ["quotation"] });

  if (scope.projectId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(scope.projectId) });
    void queryClient.invalidateQueries({ queryKey: ["project", "proposals", scope.projectId] });
    void queryClient.invalidateQueries({ queryKey: ["project", "quotations", scope.projectId] });
  }

  if (scope.proposalId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.proposal.detail(scope.proposalId) });
    void queryClient.invalidateQueries({ queryKey: ["proposal", "items", scope.proposalId] });
  }
}

export function useProjectCustomizationRequestsQuery(
  projectId: string | null,
  query: CustomizationRequestListQuery = {},
) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.customization.byProject(projectId ?? "none", query),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: () => getProjectCustomizationRequestsApi(projectId!, query),
    staleTime: 15_000,
  });
}

export function useCustomizationRequestDetailQuery(customizationRequestId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.customization.detail(customizationRequestId ?? "none"),
    enabled: isLoggedIn && Boolean(customizationRequestId),
    queryFn: () => getCustomizationRequestApi(customizationRequestId!),
    staleTime: 15_000,
  });
}

export function useSubmitCustomizationRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      proposalItemId,
      payload,
    }: {
      proposalItemId: string;
      payload: SubmitCustomizationRequestDto;
      projectId?: string | null;
      proposalId?: string | null;
    }) => submitCustomizationRequestApi(proposalItemId, payload),
    onSuccess: (request, variables) => {
      queryClient.setQueryData(queryKeys.customization.detail(request.customizationRequestId), request);
      invalidateCustomizationQueries(queryClient, {
        projectId: variables.projectId ?? request.projectId,
        proposalId: variables.proposalId ?? request.proposalId,
      });
    },
  });
}

export function useAcceptCustomizationVersionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customizationRequestId,
      customizationRequestVersionId,
    }: {
      customizationRequestId: string;
      customizationRequestVersionId: string;
      projectId?: string | null;
      proposalId?: string | null;
    }) => acceptCustomizationRequestApi(customizationRequestId, { customizationRequestVersionId }),
    onSuccess: (request, variables) => {
      queryClient.setQueryData(queryKeys.customization.detail(request.customizationRequestId), request);
      invalidateCustomizationQueries(queryClient, {
        projectId: variables.projectId ?? request.projectId,
        proposalId: variables.proposalId ?? request.proposalId,
      });
    },
  });
}
