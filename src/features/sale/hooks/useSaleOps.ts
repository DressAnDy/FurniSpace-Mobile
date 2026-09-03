import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import { getProjectPhaseDeadlinesApi, getProjectSchedulesApi } from "../../project/services/project.tracking.api";
import {
  CreateProjectScheduleRequestDto,
  ProjectMeasurementImagesQuery,
  UpsertPhaseDeadlinesRequestDto,
  UpsertProjectAreaRequestDto,
  UploadProjectFileInput,
} from "../models/sale.ops.model";
import {
  assertSalesCanCreateSchedule,
  assertSalesCanUpdateScheduleStatus,
} from "../utils/sale.schedule.rules";
import {
  cancelProjectAreaApi,
  createProjectAreaApi,
  createProjectScheduleApi,
  deleteProjectScheduleApi,
  getProjectAreasApi,
  getProjectFilesApi,
  getProjectMeasurementImagesApi,
  getProjectScheduleByIdApi,
  linkAreaMeasurementImageApi,
  putProjectPhaseDeadlinesApi,
  searchProjectFilesApi,
  unlinkAreaMeasurementImageApi,
  updateProjectAreaApi,
  updateProjectScheduleApi,
  updateProjectScheduleStatusApi,
  uploadProjectFileApi,
} from "../services/sale.ops.api";
import { UpdateProjectScheduleStatusRequestDto } from "../../project/models/project.tracking.model";

export function useSaleProjectSchedulesQuery(projectId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.project.schedules(projectId ?? "none"),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: () => getProjectSchedulesApi(projectId!),
  });
}

export function useSalePhaseDeadlinesQuery(projectId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.project.phaseDeadlines(projectId ?? "none"),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: () => getProjectPhaseDeadlinesApi(projectId!),
  });
}

export function useSaleProjectAreasQuery(projectId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.sale.areas(projectId ?? "none"),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: () => getProjectAreasApi(projectId!),
  });
}

export function useSaleProjectFilesQuery(projectId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.sale.files(projectId ?? "none"),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: () => getProjectFilesApi(projectId!, { page: 1, limit: 50 }),
  });
}

export function useProjectMeasurementImagesQuery(
  projectId: string | null,
  query: ProjectMeasurementImagesQuery = {},
) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.sale.measurementImages(projectId ?? "none", query),
    enabled: isLoggedIn && Boolean(projectId),
    queryFn: () => getProjectMeasurementImagesApi(projectId!, query),
  });
}

export function useProjectScheduleDetailQuery(scheduleId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.projectSchedule.detail(scheduleId ?? "none"),
    enabled: isLoggedIn && Boolean(scheduleId),
    queryFn: () => getProjectScheduleByIdApi(scheduleId!),
  });
}

export function usePutPhaseDeadlinesMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertPhaseDeadlinesRequestDto) => putProjectPhaseDeadlinesApi(projectId!, payload),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.phaseDeadlines(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
      }
    },
  });
}

export function useCreateProjectScheduleMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectScheduleRequestDto) => {
      assertSalesCanCreateSchedule(payload.scheduleType);
      return createProjectScheduleApi(projectId!, payload);
    },
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.schedules(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
      }
    },
  });
}

export function useUpdateProjectScheduleMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      payload,
    }: {
      scheduleId: string;
      payload: Parameters<typeof updateProjectScheduleApi>[1];
    }) => updateProjectScheduleApi(scheduleId, payload),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.schedules(projectId) });
      }
    },
  });
}

export function useDeleteProjectScheduleMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scheduleId: string) => deleteProjectScheduleApi(scheduleId),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.schedules(projectId) });
      }
    },
  });
}

export function useUpdateProjectScheduleStatusMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      payload,
    }: {
      scheduleId: string;
      payload: UpdateProjectScheduleStatusRequestDto;
    }) => {
      assertSalesCanUpdateScheduleStatus(payload.status);
      return updateProjectScheduleStatusApi(scheduleId, payload);
    },
    onSuccess: (_data, variables) => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.project.schedules(projectId) });
      }
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectSchedule.detail(variables.scheduleId),
      });
    },
  });
}

export function useLinkAreaMeasurementImageMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ areaId, fileId }: { areaId: string; fileId: string }) =>
      linkAreaMeasurementImageApi(areaId, fileId),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.measurementImages(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.areas(projectId) });
      }
    },
  });
}

export function useUnlinkAreaMeasurementImageMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ areaId, fileId }: { areaId: string; fileId: string }) =>
      unlinkAreaMeasurementImageApi(areaId, fileId),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.measurementImages(projectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.areas(projectId) });
      }
    },
  });
}

export function useCreateProjectAreaMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertProjectAreaRequestDto) => createProjectAreaApi(projectId!, payload),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.areas(projectId) });
      }
    },
  });
}

export function useUpdateProjectAreaMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ areaId, payload }: { areaId: string; payload: UpsertProjectAreaRequestDto }) =>
      updateProjectAreaApi(areaId, payload),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.areas(projectId) });
      }
    },
  });
}

export function useCancelProjectAreaMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (areaId: string) => cancelProjectAreaApi(areaId),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.areas(projectId) });
      }
    },
  });
}

export function useUploadProjectFileMutation(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadProjectFileInput) => uploadProjectFileApi(projectId!, input),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sale.files(projectId) });
      }
    },
  });
}

export function useSearchProjectFilesQuery(projectId: string | null, q: string) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.sale.files(projectId ?? "none", { q }),
    enabled: isLoggedIn && Boolean(projectId) && q.trim().length > 0,
    queryFn: () => searchProjectFilesApi(projectId!, q.trim()),
  });
}

export async function pickAndUploadProjectFile(
  projectId: string,
  upload: (input: UploadProjectFileInput) => Promise<unknown>,
): Promise<void> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]) {
    return;
  }
  const asset = result.assets[0];
  await upload({
    uri: asset.uri,
    name: asset.name || "upload.bin",
    type: asset.mimeType || "application/octet-stream",
    fileType: "OTHER",
    visibility: "STAFF_ONLY",
  });
}
