import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/constants/queryKeys";
import {
  RejectProjectRequestDto,
  UpdateProjectBasicInfoRequestDto,
  UpdateProjectStatusRequestDto,
  UpdateTargetCompletionDateRequestDto,
} from "../../project/models/project.model";
import { ReopenProjectProposalResponseDto } from "../../project/models/project.tracking.model";
import {
  rejectProjectApi,
  reopenProjectProposalApi,
  updateProjectBasicInfoApi,
  updateProjectStatusApi,
  updateProjectTargetCompletionDateApi,
} from "../../project/services/project.api";

export function useUpdateProjectStatusMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProjectStatusRequestDto) => updateProjectStatusApi(projectId!, payload),
    onSuccess: () => {
      if (!projectId) {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["project", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["sale"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.payment.projectStartFeeStatus(projectId) });
    },
  });
}

export function useRejectProjectMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RejectProjectRequestDto) => rejectProjectApi(projectId!, payload),
    onSuccess: () => {
      if (!projectId) {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["project", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["sale"] });
    },
  });
}

export function useUpdateProjectBasicInfoMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProjectBasicInfoRequestDto) => updateProjectBasicInfoApi(projectId!, payload),
    onSuccess: () => {
      if (!projectId) {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["project", "list"] });
    },
  });
}

export function useUpdateProjectTargetCompletionDateMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTargetCompletionDateRequestDto) =>
      updateProjectTargetCompletionDateApi(projectId!, payload),
    onSuccess: () => {
      if (!projectId) {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.project.phaseDeadlines(projectId) });
    },
  });
}

export function useReopenProjectProposalMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => reopenProjectProposalApi(projectId!),
    onSuccess: (_data: ReopenProjectProposalResponseDto) => {
      if (!projectId) {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["project", "list"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sale.proposals(projectId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sale.quotations(projectId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sale.orders(projectId) });
    },
  });
}
