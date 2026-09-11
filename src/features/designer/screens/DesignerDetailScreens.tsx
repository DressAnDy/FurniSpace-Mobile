import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { useAuthStore } from "../../auth/store/auth.store";
import { useProjectDetailQuery } from "../../project/hooks/useProjects";
import { getProjectStatusLabel, resolveProjectMemberDisplay } from "../../project/utils/project.mapper";
import { getScheduleStartAt } from "../../project/services/project.tracking.api";
import type { ProjectScheduleDto } from "../../project/models/project.tracking.model";
import { SaleProjectChatTab } from "../../sale/screens/SaleProjectChatTab";
import { useCreateProjectAreaMutation, useSalePhaseDeadlinesQuery } from "../../sale/hooks/useSaleOps";
import { formatSaleDate, getInitials, getSaleProjectStatusColors } from "../../sale/utils/sale.mapper";
import type { DesignerProjectTab } from "../data/designer.mock";
import { designerProjectTabs } from "../data/designer.mock";
import {
  DesignerFrame,
  DesignerProjectDetailHeader,
  DesignerProjectTabs,
} from "../components/DesignerShared";
import {
  invalidateMeasurementImageQueries,
  useDesignerAreasQuery,
  useDesignerCatalogProductsQuery,
  useDesignerMeasurementImagesQuery,
  useDesignerSchedulesQuery,
  useUploadMeasurementImageMutation,
} from "../hooks/useDesignerDashboard";
import { DESIGNER, designerStyles as s } from "../styles/designer.styles";
import { detailStyles as detail } from "../styles/designer.detail.styles";
import { AppIcon } from "../../../shared/components/AppIcon";
import { chevronDownIconDefinition } from "../../../icons/navigation/definitions";
import { rulerIconDefinition } from "../../../icons/design/definitions";
import { cameraIconDefinition } from "../../../icons/common/definitions";
import { imageIconDefinition, uploadIconDefinition } from "../../../icons/file/definitions";
import {
  getMeasurementImageErrorMessage,
  isAllowedMeasurementMimeType,
  isEligibleMeasurementScheduleStatus,
  mapWithConcurrency,
  MEASUREMENT_UPLOAD_CONCURRENCY,
  normalizeMeasurementMimeType,
} from "../utils/measurementImages";

type Props = NativeStackScreenProps<RootStackParamList, "DesignerProjectDetail">;

type PendingMeasurementFile = {
  uri: string;
  name: string;
  mimeType: string;
};

const LAYOUT_MODE_OPTIONS = [
  { value: false, label: "Standard rectangle" },
  { value: true, label: "Special layout" },
] as const;

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatScheduleWhen(schedule: ProjectScheduleDto): string {
  const start = getScheduleStartAt(schedule);
  if (!start) {
    return "—";
  }
  return new Date(start).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DesignerProjectDetailScreen({ route }: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const projectId = route.params?.projectId ?? null;
  const requestedTab = route.params?.tab ?? "Overview";
  const activeTab: DesignerProjectTab = designerProjectTabs.includes(requestedTab as DesignerProjectTab)
    ? (requestedTab as DesignerProjectTab)
    : "Overview";
  const [isRefreshing, setIsRefreshing] = useState(false);
  const projectQuery = useProjectDetailQuery(projectId);
  const project = projectQuery.data ?? null;

  const handleRefresh = useCallback(async () => {
    if (!projectId) {
      return;
    }
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: queryKeys.project.detail(projectId) }),
        queryClient.refetchQueries({ queryKey: queryKeys.project.schedules(projectId) }),
        queryClient.refetchQueries({ queryKey: queryKeys.sale.areas(projectId) }),
        queryClient.refetchQueries({ queryKey: queryKeys.sale.measurementImages(projectId) }),
        queryClient.refetchQueries({ queryKey: queryKeys.designer.catalogProducts(projectId) }),
        queryClient.refetchQueries({ queryKey: queryKeys.project.phaseDeadlines(projectId) }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [projectId, queryClient]);

  return (
    <DesignerFrame>
      <DesignerProjectDetailHeader
        projectCode={project?.projectCode}
        projectName={project?.projectName}
        businessType={project?.businessType}
        status={project?.status}
        statusLabel={project ? getProjectStatusLabel(project.status) : projectQuery.isLoading ? "Loading…" : undefined}
      />
      <DesignerProjectTabs active={activeTab} projectId={projectId ?? undefined} />
      {activeTab === "Chat" ? (
        <SaleProjectChatTab projectId={projectId} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void handleRefresh()}
              tintColor={DESIGNER.accent}
            />
          }
          contentContainerStyle={detail.body}
        >
          {activeTab === "Overview" ? (
            projectQuery.isLoading ? (
              <ActivityIndicator color={DESIGNER.accent} />
            ) : projectQuery.isError ? (
              <Text style={s.centerMuted}>{getErrorMessage(projectQuery.error, "Unable to load project.")}</Text>
            ) : (
              <OverviewTab projectId={projectId} />
            )
          ) : null}
          {activeTab === "Measurement" ? <MeasurementTab projectId={projectId} /> : null}
          {activeTab === "Areas" ? (
            <AreasTab
              projectId={projectId}
              totalAreaSqm={project?.totalAreaSqm ?? null}
              numberOfFloors={project?.numberOfFloors ?? null}
            />
          ) : null}
          {activeTab === "Catalog" ? <CatalogTab projectId={projectId} /> : null}
        </ScrollView>
      )}
    </DesignerFrame>
  );
}

function OverviewTab({ projectId }: { projectId: string | null }): React.JSX.Element {
  const currentUser = useAuthStore((state) => state.user);
  const projectQuery = useProjectDetailQuery(projectId);
  const phaseQuery = useSalePhaseDeadlinesQuery(projectId);
  const project = projectQuery.data;

  if (!project) {
    return <Text style={s.centerMuted}>Select a project to view details.</Text>;
  }

  const tone = getSaleProjectStatusColors(project.status);
  const salesMember = resolveProjectMemberDisplay(
    project.assignedSales,
    project.assignedSalesId,
    null,
    "Assigned",
  );
  const designerMember = resolveProjectMemberDisplay(
    project.assignedDesigner,
    project.assignedDesignerId,
    currentUser ? { accountId: currentUser.accountId, fullName: currentUser.fullName } : null,
    "You",
  );
  const salesName = salesMember.fullName ?? "—";
  const designerName = designerMember.fullName ?? "You";
  const budget =
    project.budgetMin != null || project.budgetMax != null
      ? `${(project.budgetMin ?? 0).toLocaleString()} - ${(project.budgetMax ?? 0).toLocaleString()}`
      : "—";
  const proposalDeadline = (phaseQuery.data?.deadlines ?? []).find((item) => item.phase === "PROPOSAL");
  const targetDate = formatSaleDate(phaseQuery.data?.targetCompletionDate ?? project.targetCompletionDate);

  return (
    <>
      <View style={detail.card}>
        <View style={[detail.cardAccent, { backgroundColor: DESIGNER.accent }]} />
        <Text style={detail.sectionLabel}>Project Information</Text>
        <Text style={detail.cardMeta}>Core project brief shared by sales and customer.</Text>
        <View style={detail.infoGrid}>
          <View style={detail.infoCell}>
            <Text style={detail.infoLabel}>Project Code</Text>
            <Text style={detail.infoValue}>{project.projectCode || "—"}</Text>
          </View>
          <View style={detail.infoCell}>
            <Text style={detail.infoLabel}>Business Type</Text>
            <Text style={detail.infoValue}>{project.businessType || "—"}</Text>
          </View>
          <View style={detail.infoCellWide}>
            <Text style={detail.infoLabel}>Address</Text>
            <Text style={detail.infoValue}>{project.projectAddress || "—"}</Text>
          </View>
          <View style={detail.infoCell}>
            <Text style={detail.infoLabel}>Floors</Text>
            <Text style={detail.infoValue}>
              {project.numberOfFloors != null ? String(project.numberOfFloors) : "—"}
            </Text>
          </View>
          <View style={detail.infoCell}>
            <Text style={detail.infoLabel}>Total Area</Text>
            <Text style={detail.infoValue}>
              {project.totalAreaSqm != null ? `${project.totalAreaSqm} sqm` : "—"}
            </Text>
          </View>
          <View style={detail.infoCell}>
            <Text style={detail.infoLabel}>Budget</Text>
            <Text style={detail.infoValue}>{budget}</Text>
          </View>
          <View style={detail.infoCell}>
            <Text style={detail.infoLabel}>Target Date</Text>
            <Text style={detail.infoValue}>{formatSaleDate(project.targetCompletionDate)}</Text>
          </View>
          <View style={detail.infoCellWide}>
            <Text style={detail.infoLabel}>Status</Text>
            <Text style={[detail.infoValue, { color: tone.color }]}>
              {getProjectStatusLabel(project.status)}
            </Text>
          </View>
        </View>
      </View>

      <View style={detail.card}>
        <View style={[detail.cardAccent, { backgroundColor: DESIGNER.gold }]} />
        <View style={detail.measureHeaderRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={detail.sectionLabel}>Design Timeline</Text>
            <Text style={detail.cardMeta}>Design phase deadlines and backend-calculated progress.</Text>
          </View>
          {targetDate !== "—" ? (
            <View style={detail.timelineTargetPill}>
              <Text style={detail.timelineTargetText}>Target {targetDate}</Text>
            </View>
          ) : null}
        </View>

        {phaseQuery.isLoading ? (
          <ActivityIndicator color={DESIGNER.accent} style={{ marginTop: 12 }} />
        ) : !proposalDeadline ? (
          <Text style={[detail.cardMeta, { marginTop: 12 }]}>Phase deadlines not set yet.</Text>
        ) : (
          <View style={detail.timelineCard}>
            <View style={detail.timelineTop}>
              <View
                style={[
                  detail.timelineStatusPill,
                  proposalDeadline.status === "ON_TRACK" || proposalDeadline.status === "PLANNED"
                    ? detail.timelineStatusOnTrack
                    : proposalDeadline.status === "OVERDUE" || proposalDeadline.status === "COMPLETED_LATE"
                      ? detail.timelineStatusOverdue
                      : detail.timelineStatusDone,
                ]}
              >
                <Text
                  style={[
                    detail.timelineStatusText,
                    proposalDeadline.status === "OVERDUE" || proposalDeadline.status === "COMPLETED_LATE"
                      ? { color: DESIGNER.red }
                      : proposalDeadline.status === "COMPLETED_ON_TIME"
                        ? { color: "#A8843E" }
                        : null,
                  ]}
                >
                  {formatPhaseDeadlineStatus(proposalDeadline.status)}
                </Text>
              </View>
              <Text style={detail.timelinePhaseLabel}>Proposal</Text>
            </View>
            <Text style={detail.timelineMeta}>
              Start {formatSaleDate(proposalDeadline.startedAt)} · Due {formatSaleDate(proposalDeadline.dueDate)} ·
              Done {formatSaleDate(proposalDeadline.completedAt)}
            </Text>
          </View>
        )}
      </View>

      <View style={detail.card}>
        <Text style={detail.sectionLabel}>Customer Requirements</Text>
        <View style={detail.formField}>
          <Text style={detail.formLabel}>Furniture Requirement</Text>
          <Text style={detail.briefText}>{project.furnitureRequirement?.trim() || "—"}</Text>
        </View>
        <View style={detail.formField}>
          <Text style={detail.formLabel}>Description</Text>
          <Text style={detail.briefText}>{project.description?.trim() || "—"}</Text>
        </View>
        {project.businessPurpose?.trim() ? (
          <View style={detail.formField}>
            <Text style={detail.formLabel}>Business Purpose</Text>
            <Text style={detail.briefText}>{project.businessPurpose.trim()}</Text>
          </View>
        ) : null}
      </View>

      <View style={detail.card}>
        <Text style={detail.sectionLabel}>Members</Text>
        <View style={[detail.memberRow, detail.memberRowFirst]}>
          <View style={[detail.memberAvatar, detail.memberAvatarSales]}>
            <Text style={detail.memberAvatarText}>{getInitials(salesName === "—" ? "S" : salesName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={detail.memberRole}>Sales</Text>
            <Text style={detail.memberName}>{salesName}</Text>
            {project.assignedSalesId && salesName === "Assigned" ? (
              <Text style={detail.itemMeta}>Sales is assigned to this project</Text>
            ) : null}
          </View>
        </View>
        <View style={detail.memberRow}>
          <View style={detail.memberAvatar}>
            <Text style={detail.memberAvatarText}>{getInitials(designerName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={detail.memberRole}>Designer</Text>
            <Text style={detail.memberName}>{designerName}</Text>
          </View>
        </View>
      </View>
    </>
  );
}

function formatPhaseDeadlineStatus(status: string): string {
  switch (status) {
    case "ON_TRACK":
      return "On Track";
    case "PLANNED":
      return "Planned";
    case "OVERDUE":
      return "Overdue";
    case "COMPLETED_ON_TIME":
      return "Completed on time";
    case "COMPLETED_LATE":
      return "Completed late";
    default:
      return status;
  }
}

function MeasurementTab({ projectId }: { projectId: string | null }): React.JSX.Element {
  const queryClient = useQueryClient();
  const schedulesQuery = useDesignerSchedulesQuery(projectId);
  const areasQuery = useDesignerAreasQuery(projectId);
  const uploadMutation = useUploadMeasurementImageMutation(projectId);

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [galleryAreaId, setGalleryAreaId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);

  const activeAreas = useMemo(
    () => (areasQuery.data ?? []).filter((area) => area.status !== "CANCELLED"),
    [areasQuery.data],
  );
  const eligibleSchedules = useMemo(
    () =>
      (schedulesQuery.data ?? []).filter(
        (item) => item.scheduleType === "MEASUREMENT" && isEligibleMeasurementScheduleStatus(item.status),
      ),
    [schedulesQuery.data],
  );

  const imagesQuery = useDesignerMeasurementImagesQuery(projectId, {
    ...(galleryAreaId ? { projectAreaId: galleryAreaId } : {}),
    page: 1,
    limit: 40,
  });

  useEffect(() => {
    if (!selectedScheduleId && eligibleSchedules[0]) {
      setSelectedScheduleId(eligibleSchedules[0].scheduleId);
    }
  }, [eligibleSchedules, selectedScheduleId]);

  useEffect(() => {
    if (!selectedAreaId && activeAreas[0]) {
      setSelectedAreaId(activeAreas[0].projectAreaId);
    }
  }, [activeAreas, selectedAreaId]);

  const selectedSchedule =
    eligibleSchedules.find((item) => item.scheduleId === selectedScheduleId) ?? null;
  const selectedArea = activeAreas.find((item) => item.projectAreaId === selectedAreaId) ?? null;
  const canUpload = Boolean(selectedSchedule && selectedArea && !uploadMutation.isPending);
  const gallery = imagesQuery.data?.items ?? [];

  const uploadFiles = async (files: PendingMeasurementFile[]) => {
    if (!selectedSchedule || !selectedArea) {
      Alert.alert("Selection required", "Choose a measurement schedule and project area first.");
      return;
    }
    if (activeAreas.length === 0) {
      Alert.alert("No areas", "Create at least one project area before uploading measurement photos.");
      return;
    }
    if (eligibleSchedules.length === 0) {
      Alert.alert("No eligible schedule", "Need a CONFIRMED measurement schedule before capturing photos.");
      return;
    }

    const validFiles = files.filter((file) => isAllowedMeasurementMimeType(file.mimeType));
    if (validFiles.length === 0) {
      Alert.alert("Invalid files", "Only JPG, PNG, or WebP images are allowed.");
      return;
    }
    if (validFiles.length < files.length) {
      Alert.alert("Some files skipped", "Only JPG, PNG, or WebP images will be uploaded.");
    }

    let successCount = 0;
    let failCount = 0;
    const failures: string[] = [];
    setUploadProgress({ done: 0, total: validFiles.length });

    const results = await mapWithConcurrency(
      validFiles,
      MEASUREMENT_UPLOAD_CONCURRENCY,
      async (file) => {
        await uploadMutation.mutateAsync({
          scheduleId: selectedSchedule.scheduleId,
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType,
          projectAreaId: selectedArea.projectAreaId,
          note: note.trim() || undefined,
          visibility: "STAFF_ONLY",
        });
      },
      (done, total) => setUploadProgress({ done, total }),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        successCount += 1;
      } else {
        failCount += 1;
        failures.push(getMeasurementImageErrorMessage(result.reason));
      }
    }

    invalidateMeasurementImageQueries(queryClient, projectId, selectedSchedule.scheduleId);
    setUploadProgress(null);
    if (failCount === 0) {
      Alert.alert(
        "Synced",
        `${successCount}/${validFiles.length} photo${validFiles.length === 1 ? "" : "s"} uploaded and linked.`,
      );
      return;
    }
    if (successCount === 0) {
      Alert.alert("Upload failed", failures[0] || "Unable to upload photo.");
      return;
    }
    Alert.alert(
      "Partial upload",
      `${successCount}/${validFiles.length} uploaded, ${failCount} failed.${
        failures[0] ? `\n\n${failures[0]}` : ""
      }`,
    );
  };

  const handleCapture = async () => {
    if (!canUpload) {
      Alert.alert("Selection required", "Choose schedule and area before capturing.");
      return;
    }
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Camera permission needed", "Enable camera access to capture measurement photos.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.55,
        allowsEditing: false,
        exif: false,
      });
      if (result.canceled || !result.assets?.[0]) {
        return;
      }
      const asset = result.assets[0];
      const mimeType = normalizeMeasurementMimeType(asset.mimeType, asset.fileName);
      const extension = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
      await uploadFiles([
        {
          uri: asset.uri,
          name: asset.fileName ?? `measurement-${Date.now()}.${extension}`,
          mimeType,
        },
      ]);
    } catch {
      Alert.alert("Unable to open camera", "Please try again.");
    }
  };

  const handlePickLibrary = async () => {
    if (!canUpload) {
      Alert.alert("Selection required", "Choose schedule and area before uploading.");
      return;
    }
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Photos permission needed", "Enable photo library access to upload measurement images.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.55,
        allowsMultipleSelection: true,
        selectionLimit: 12,
        exif: false,
      });
      if (result.canceled || !result.assets?.length) {
        return;
      }
      await uploadFiles(
        result.assets.map((asset, index) => {
          const mimeType = normalizeMeasurementMimeType(asset.mimeType, asset.fileName);
          const extension = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
          return {
            uri: asset.uri,
            name: asset.fileName ?? `measurement-${Date.now()}-${index}.${extension}`,
            mimeType,
          };
        }),
      );
    } catch {
      Alert.alert("Unable to pick images", "Please try again.");
    }
  };

  const handlePickFiles = async () => {
    if (!canUpload) {
      Alert.alert("Selection required", "Choose schedule and area before uploading.");
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true,
        type: ["image/jpeg", "image/png", "image/webp", "image/*"],
      });
      if (result.canceled || !result.assets?.length) {
        return;
      }
      await uploadFiles(
        result.assets.map((asset, index) => ({
          uri: asset.uri,
          name: asset.name ?? `measurement-${Date.now()}-${index}.jpg`,
          mimeType: normalizeMeasurementMimeType(asset.mimeType, asset.name),
        })),
      );
    } catch {
      Alert.alert("Unable to pick images", "Please try again.");
    }
  };

  const isBusy = uploadMutation.isPending || uploadProgress != null;

  return (
    <>
      <View style={detail.card}>
        <View style={[detail.cardAccent, { backgroundColor: DESIGNER.accent }]} />
        <View style={detail.measureHeaderRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={detail.sectionLabel}>Measurement session</Text>
            <Text style={detail.cardMeta}>
              Capture from mobile, sync to schedule, and link to a project area.
            </Text>
          </View>
          <View style={detail.measureHeaderIcon}>
            <AppIcon definition={cameraIconDefinition} size={16} color={DESIGNER.accent} />
          </View>
        </View>

        {schedulesQuery.isLoading || areasQuery.isLoading ? (
          <ActivityIndicator color={DESIGNER.accent} style={{ marginTop: 12 }} />
        ) : eligibleSchedules.length === 0 ? (
          <View style={detail.measureEmpty}>
            <Text style={detail.itemTitle}>No eligible schedule</Text>
            <Text style={[detail.cardMeta, { marginTop: 4, textAlign: "center" }]}>
              Need a MEASUREMENT schedule with status CONFIRMED before uploading photos.
            </Text>
          </View>
        ) : activeAreas.length === 0 ? (
          <View style={detail.measureEmpty}>
            <Text style={detail.itemTitle}>No project areas</Text>
            <Text style={[detail.cardMeta, { marginTop: 4, textAlign: "center" }]}>
              Create at least one area in the Areas tab, then come back to capture photos.
            </Text>
          </View>
        ) : (
          <>
            <View style={detail.formField}>
              <Text style={detail.formLabel}>Measurement schedule</Text>
              <Pressable
                style={detail.formSelect}
                onPress={() => {
                  setScheduleOpen((open) => !open);
                  setAreaOpen(false);
                }}
              >
                <Text style={detail.formSelectText} numberOfLines={1}>
                  {selectedSchedule
                    ? `${selectedSchedule.title || "Measurement visit"} · ${formatScheduleWhen(selectedSchedule)}`
                    : "Select schedule"}
                </Text>
                <AppIcon definition={chevronDownIconDefinition} size={14} color={DESIGNER.muted} />
              </Pressable>
              {scheduleOpen
                ? eligibleSchedules.map((schedule) => {
                    const selected = schedule.scheduleId === selectedScheduleId;
                    return (
                      <Pressable
                        key={schedule.scheduleId}
                        style={[
                          detail.formChip,
                          selected && detail.formChipActive,
                          { marginTop: 8, alignSelf: "stretch" },
                        ]}
                        onPress={() => {
                          setSelectedScheduleId(schedule.scheduleId);
                          setScheduleOpen(false);
                        }}
                      >
                        <Text style={[detail.formChipText, selected && detail.formChipTextActive]}>
                          {schedule.title || "Measurement visit"} · {schedule.status}
                        </Text>
                      </Pressable>
                    );
                  })
                : null}
            </View>

            <View style={detail.formField}>
              <Text style={detail.formLabel}>Project area</Text>
              <Pressable
                style={detail.formSelect}
                onPress={() => {
                  setAreaOpen((open) => !open);
                  setScheduleOpen(false);
                }}
              >
                <Text style={detail.formSelectText} numberOfLines={1}>
                  {selectedArea
                    ? `${selectedArea.areaName}${selectedArea.floorNumber != null ? ` · Floor ${selectedArea.floorNumber}` : ""}`
                    : "Select area"}
                </Text>
                <AppIcon definition={chevronDownIconDefinition} size={14} color={DESIGNER.muted} />
              </Pressable>
              {areaOpen
                ? activeAreas.map((area) => {
                    const selected = area.projectAreaId === selectedAreaId;
                    return (
                      <Pressable
                        key={area.projectAreaId}
                        style={[
                          detail.formChip,
                          selected && detail.formChipActive,
                          { marginTop: 8, alignSelf: "stretch" },
                        ]}
                        onPress={() => {
                          setSelectedAreaId(area.projectAreaId);
                          setAreaOpen(false);
                        }}
                      >
                        <Text style={[detail.formChipText, selected && detail.formChipTextActive]}>
                          {area.areaName}
                          {area.floorNumber != null ? ` · Floor ${area.floorNumber}` : ""}
                        </Text>
                      </Pressable>
                    );
                  })
                : null}
            </View>

            <View style={detail.formField}>
              <Text style={detail.formLabel}>Note (optional)</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="e.g. Corner wall left"
                placeholderTextColor={DESIGNER.muted}
                style={detail.formInput}
              />
            </View>

            <View style={detail.measureActions}>
              <Pressable
                style={[detail.measureCaptureButton, { opacity: canUpload ? 1 : 0.55 }]}
                disabled={!canUpload}
                onPress={() => void handleCapture()}
              >
                <AppIcon definition={cameraIconDefinition} size={14} color={DESIGNER.white} />
                <Text style={detail.measureCaptureText}>{isBusy ? "Syncing…" : "Capture"}</Text>
              </Pressable>
              <Pressable
                style={[detail.measureUploadButton, { opacity: canUpload ? 1 : 0.55 }]}
                disabled={!canUpload}
                onPress={() => void handlePickLibrary()}
              >
                <AppIcon definition={imageIconDefinition} size={14} color={DESIGNER.accent} />
                <Text style={detail.measureUploadText}>Gallery</Text>
              </Pressable>
            </View>
            <Pressable
              style={[detail.measureUploadButton, { marginTop: 8, opacity: canUpload ? 1 : 0.55 }]}
              disabled={!canUpload}
              onPress={() => void handlePickFiles()}
            >
              <AppIcon definition={uploadIconDefinition} size={14} color={DESIGNER.accent} />
              <Text style={detail.measureUploadText}>Upload files</Text>
            </Pressable>
            {uploadProgress ? (
              <Text style={[detail.cardMeta, { marginTop: 10 }]}>
                Uploading {uploadProgress.done}/{uploadProgress.total}…
              </Text>
            ) : (
              <Text style={[detail.cardMeta, { marginTop: 10 }]}>
                JPG / PNG / WebP · each photo uploads separately and links to the selected area.
              </Text>
            )}
          </>
        )}
      </View>

      <View style={detail.card}>
        <View style={[detail.cardAccent, { backgroundColor: DESIGNER.gold }]} />
        <View style={detail.measureHeaderRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={detail.sectionLabel}>Project gallery</Text>
            <Text style={detail.cardMeta}>
              {imagesQuery.isLoading
                ? "Loading photos…"
                : `${gallery.length} photo${gallery.length === 1 ? "" : "s"} synced from measurement`}
            </Text>
          </View>
          <View style={[detail.measureHeaderIcon, detail.measureHeaderIconGold]}>
            <AppIcon definition={imageIconDefinition} size={16} color={DESIGNER.gold} />
          </View>
        </View>

        {activeAreas.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={detail.formChipRow}>
              <Pressable
                style={[detail.formChip, !galleryAreaId && detail.formChipActive]}
                onPress={() => setGalleryAreaId(null)}
              >
                <Text style={[detail.formChipText, !galleryAreaId && detail.formChipTextActive]}>All areas</Text>
              </Pressable>
              {activeAreas.map((area) => {
                const active = galleryAreaId === area.projectAreaId;
                return (
                  <Pressable
                    key={area.projectAreaId}
                    style={[detail.formChip, active && detail.formChipActive]}
                    onPress={() => setGalleryAreaId(area.projectAreaId)}
                  >
                    <Text style={[detail.formChipText, active && detail.formChipTextActive]}>{area.areaName}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        ) : null}

        {imagesQuery.isLoading ? (
          <ActivityIndicator color={DESIGNER.accent} style={{ marginTop: 12 }} />
        ) : gallery.length === 0 ? (
          <View style={detail.measureEmpty}>
            <AppIcon definition={imageIconDefinition} size={22} color={DESIGNER.muted} />
            <Text style={[detail.itemTitle, { marginTop: 8 }]}>No photos yet</Text>
            <Text style={[detail.cardMeta, { marginTop: 4, textAlign: "center" }]}>
              Images captured here sync to Designer web Measurement Images.
            </Text>
          </View>
        ) : (
          <View style={detail.galleryGrid}>
            {gallery.map((item) => {
              const uri = item.url ?? null;
              const areaNames = (item.areas ?? []).map((area) => area.areaName).filter(Boolean).join(", ");
              return (
                <View key={item.fileId} style={detail.galleryTile}>
                  {uri ? (
                    <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  ) : (
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                      <Text style={detail.itemMeta}>No preview</Text>
                    </View>
                  )}
                  {areaNames ? (
                    <View style={detail.galleryTileCaption}>
                      <Text style={detail.galleryTileCaptionText} numberOfLines={1}>
                        {areaNames}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </>
  );
}

function AreasTab({
  projectId,
  totalAreaSqm,
  numberOfFloors,
}: {
  projectId: string | null;
  totalAreaSqm: number | null;
  numberOfFloors: number | null;
}): React.JSX.Element {
  const areasQuery = useDesignerAreasQuery(projectId);
  const createMutation = useCreateProjectAreaMutation(projectId);
  const areas = areasQuery.data ?? [];
  const activeFloorAreas = useMemo(
    () => areas.filter((area) => area.areaType === "FLOOR" && area.status !== "CANCELLED"),
    [areas],
  );
  const maxFloors = numberOfFloors != null && numberOfFloors > 0 ? Math.floor(numberOfFloors) : null;
  const usedFloorNumbers = useMemo(() => {
    const used = new Set<number>();
    for (const area of activeFloorAreas) {
      if (area.floorNumber != null && area.floorNumber > 0) {
        used.add(area.floorNumber);
      }
    }
    return used;
  }, [activeFloorAreas]);
  const nextFloorNumber = useMemo(() => {
    const limit = maxFloors ?? 1;
    if (activeFloorAreas.length >= limit) {
      return null;
    }
    for (let floor = 1; floor <= limit; floor += 1) {
      if (!usedFloorNumbers.has(floor)) {
        return floor;
      }
    }
    return null;
  }, [activeFloorAreas.length, maxFloors, usedFloorNumbers]);
  const floorLimit = maxFloors ?? 1;
  const remainingFloors = Math.max(0, floorLimit - activeFloorAreas.length);
  const canCreateMore = nextFloorNumber != null;

  const [areaName, setAreaName] = useState("");
  const [isSpecialLayout, setIsSpecialLayout] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");
  const [height, setHeight] = useState("");
  const [areaSqmInput, setAreaSqmInput] = useState("");
  const [description, setDescription] = useState("");
  const [currentCondition, setCurrentCondition] = useState("");
  const [requirementNote, setRequirementNote] = useState("");

  const widthValue = parseOptionalNumber(width);
  const lengthValue = parseOptionalNumber(length);
  const heightValue = parseOptionalNumber(height);
  const computedAreaSqm =
    widthValue != null && lengthValue != null && widthValue > 0 && lengthValue > 0
      ? Math.round(widthValue * lengthValue * 100) / 100
      : null;
  const areaSqmValue = isSpecialLayout ? parseOptionalNumber(areaSqmInput) : computedAreaSqm;
  const layoutLabel =
    LAYOUT_MODE_OPTIONS.find((option) => option.value === isSpecialLayout)?.label ?? "Standard rectangle";
  const exceedsTotalArea =
    totalAreaSqm != null && areaSqmValue != null && areaSqmValue > totalAreaSqm;

  const resetForm = () => {
    setAreaName("");
    setIsSpecialLayout(false);
    setLayoutOpen(false);
    setWidth("");
    setLength("");
    setHeight("");
    setAreaSqmInput("");
    setDescription("");
    setCurrentCondition("");
    setRequirementNote("");
  };

  const handleCreate = () => {
    if (!projectId) {
      return;
    }
    if (!canCreateMore || nextFloorNumber == null) {
      Alert.alert(
        "Floor limit reached",
        `This project has ${floorLimit} floor${floorLimit === 1 ? "" : "s"}. You can create at most ${floorLimit} area${floorLimit === 1 ? "" : "s"}.`,
      );
      return;
    }
    if (!areaName.trim()) {
      Alert.alert("Area name required", "Enter an area name before creating.");
      return;
    }
    if (heightValue == null || heightValue <= 0) {
      Alert.alert("Height required", "Enter a height greater than 0.");
      return;
    }
    if (!isSpecialLayout) {
      if (widthValue == null || widthValue <= 0 || lengthValue == null || lengthValue <= 0) {
        Alert.alert("Dimensions required", "Standard rectangle needs width and length greater than 0.");
        return;
      }
      if (computedAreaSqm == null || computedAreaSqm <= 0) {
        Alert.alert("Area required", "Width × Length must be greater than 0.");
        return;
      }
    }
    if (totalAreaSqm != null && areaSqmValue != null && areaSqmValue > totalAreaSqm) {
      Alert.alert(
        "Area too large",
        `Width × Length (${areaSqmValue} m²) must be ≤ project total area (${totalAreaSqm} m²).`,
      );
      return;
    }

    createMutation.mutate(
      {
        areaName: areaName.trim(),
        areaType: "FLOOR",
        floorNumber: nextFloorNumber,
        isSpecialLayout,
        description: description.trim() || null,
        width: widthValue,
        length: lengthValue,
        height: heightValue,
        areaSqm: areaSqmValue,
        currentCondition: currentCondition.trim() || null,
        requirementNote: requirementNote.trim() || null,
        status: "DRAFT",
      },
      {
        onSuccess: () => {
          resetForm();
          Alert.alert("Created", `Floor ${nextFloorNumber} area added.`);
        },
        onError: (error) => Alert.alert("Unable to create", getErrorMessage(error)),
      },
    );
  };

  return (
    <View style={detail.card}>
      <View style={[detail.cardAccent, { backgroundColor: DESIGNER.accent }]} />
      <Text style={detail.sectionLabel}>Project Areas</Text>
      <Text style={detail.cardMeta}>
        Project areas are reusable project-level spaces. Create them before building proposal scenes.
      </Text>
      <Text style={[detail.cardMeta, { marginTop: 6 }]}>
        Floors: {floorLimit} · Areas used: {activeFloorAreas.length}/{floorLimit}
        {nextFloorNumber != null ? ` · Next floor #${nextFloorNumber}` : ""}
      </Text>

      {canCreateMore ? (
      <View style={detail.formPanel}>
        <View style={detail.formPanelTitleRow}>
          <AppIcon definition={rulerIconDefinition} size={16} color={DESIGNER.gold} />
          <Text style={detail.formPanelTitle}>Add Project Area · Floor {nextFloorNumber}</Text>
        </View>

        <View style={detail.formField}>
          <Text style={detail.formLabel}>Area Name</Text>
          <TextInput
            value={areaName}
            onChangeText={setAreaName}
            placeholder="e.g. Ground floor"
            placeholderTextColor={DESIGNER.muted}
            style={detail.formInput}
          />
        </View>

        <View style={detail.formField}>
          <Text style={detail.formLabel}>Layout Mode</Text>
          <Pressable style={detail.formSelect} onPress={() => setLayoutOpen((open) => !open)}>
            <Text style={detail.formSelectText}>{layoutLabel}</Text>
            <AppIcon definition={chevronDownIconDefinition} size={14} color={DESIGNER.muted} />
          </Pressable>
          {layoutOpen
            ? LAYOUT_MODE_OPTIONS.map((option) => {
                const selected = option.value === isSpecialLayout;
                return (
                  <Pressable
                    key={option.label}
                    style={[detail.formChip, selected && detail.formChipActive, { marginTop: 8, alignSelf: "stretch" }]}
                    onPress={() => {
                      setIsSpecialLayout(option.value);
                      setLayoutOpen(false);
                    }}
                  >
                    <Text style={[detail.formChipText, selected && detail.formChipTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })
            : null}
        </View>

        <View style={detail.formRow}>
          <View style={[detail.formField, detail.formCol, { marginTop: 0 }]}>
            <Text style={detail.formLabel}>Width (m)</Text>
            <TextInput
              value={width}
              onChangeText={setWidth}
              keyboardType="decimal-pad"
              placeholder={isSpecialLayout ? "Optional" : "0"}
              placeholderTextColor={DESIGNER.muted}
              style={detail.formInput}
            />
          </View>
          <View style={[detail.formField, detail.formCol, { marginTop: 0 }]}>
            <Text style={detail.formLabel}>Length (m)</Text>
            <TextInput
              value={length}
              onChangeText={setLength}
              keyboardType="decimal-pad"
              placeholder={isSpecialLayout ? "Optional" : "0"}
              placeholderTextColor={DESIGNER.muted}
              style={detail.formInput}
            />
          </View>
          <View style={[detail.formField, detail.formCol, { marginTop: 0 }]}>
            <Text style={detail.formLabel}>Height (m)</Text>
            <TextInput
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={DESIGNER.muted}
              style={detail.formInput}
            />
          </View>
        </View>

        <View style={detail.formField}>
          <Text style={detail.formLabel}>Area m2</Text>
          {isSpecialLayout ? (
            <TextInput
              value={areaSqmInput}
              onChangeText={setAreaSqmInput}
              keyboardType="decimal-pad"
              placeholder="Optional"
              placeholderTextColor={DESIGNER.muted}
              style={[detail.formInput, exceedsTotalArea && { borderColor: DESIGNER.red }]}
            />
          ) : (
            <TextInput
              editable={false}
              value={computedAreaSqm != null ? String(computedAreaSqm) : "—"}
              style={[
                detail.formInput,
                detail.formReadonly,
                exceedsTotalArea && { borderColor: DESIGNER.red, color: DESIGNER.red },
              ]}
            />
          )}
          {exceedsTotalArea ? (
            <Text style={{ color: DESIGNER.red, fontSize: 11, marginTop: 6 }}>
              Must be ≤ {totalAreaSqm} m² (project total area).
            </Text>
          ) : null}
        </View>

        <View style={detail.formField}>
          <Text style={detail.formLabel}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Optional"
            placeholderTextColor={DESIGNER.muted}
            multiline
            style={[detail.formInput, detail.formTextArea]}
          />
        </View>

        <View style={detail.formField}>
          <Text style={detail.formLabel}>Current Condition</Text>
          <TextInput
            value={currentCondition}
            onChangeText={setCurrentCondition}
            placeholder="Optional"
            placeholderTextColor={DESIGNER.muted}
            multiline
            style={[detail.formInput, detail.formTextArea]}
          />
        </View>

        <View style={detail.formField}>
          <Text style={detail.formLabel}>Requirement Note</Text>
          <TextInput
            value={requirementNote}
            onChangeText={setRequirementNote}
            placeholder="Optional"
            placeholderTextColor={DESIGNER.muted}
            multiline
            style={[detail.formInput, detail.formTextArea]}
          />
        </View>

        <Pressable
          style={[
            detail.createAreaButton,
            { opacity: createMutation.isPending || exceedsTotalArea ? 0.65 : 1 },
          ]}
          disabled={createMutation.isPending || !projectId || exceedsTotalArea}
          onPress={handleCreate}
        >
          <Text style={detail.createAreaButtonText}>
            {createMutation.isPending ? "Creating…" : `Create Area · Floor ${nextFloorNumber}`}
          </Text>
        </Pressable>
      </View>
      ) : (
        <View style={[detail.formPanel, { marginTop: 14 }]}>
          <Text style={detail.formPanelTitle}>Floor limit reached</Text>
          <Text style={[detail.cardMeta, { marginTop: 6 }]}>
            Overview has {floorLimit} floor{floorLimit === 1 ? "" : "s"}, so only {floorLimit} area
            {floorLimit === 1 ? "" : "s"} can be created.
          </Text>
        </View>
      )}

      <Text style={detail.areaListHeader}>
        {areasQuery.isLoading
          ? "Loading areas…"
          : `${areas.length} area${areas.length === 1 ? "" : "s"} · ${remainingFloors} remaining`}
      </Text>
      {areasQuery.isLoading ? (
        <ActivityIndicator color={DESIGNER.accent} style={{ marginTop: 12 }} />
      ) : areas.length === 0 ? (
        <Text style={[detail.cardMeta, { marginTop: 8 }]}>No areas yet. Use the form above to create one.</Text>
      ) : (
        areas.map((area, index) => (
          <View
            key={area.projectAreaId}
            style={[detail.dividerBlock, index === 0 && { borderTopWidth: 0, marginTop: 10, paddingTop: 0 }]}
          >
            <Text style={detail.itemTitle}>
              {area.areaName}
              {area.floorNumber != null ? ` · Floor ${area.floorNumber}` : ""}
            </Text>
            <Text style={detail.itemMeta}>
              {area.isSpecialLayout ? "Special layout" : "Standard rectangle"} · {area.status}
              {area.areaSqm != null ? ` · ${area.areaSqm} sqm` : ""}
              {area.width != null && area.length != null
                ? ` · ${area.width}×${area.length}${area.height != null ? `×${area.height}` : ""} m`
                : area.height != null
                  ? ` · H ${area.height} m`
                  : ""}
            </Text>
            {area.requirementNote ? (
              <Text style={[detail.itemMeta, { marginTop: 4 }]}>{area.requirementNote}</Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}

function CatalogTab({ projectId }: { projectId: string | null }): React.JSX.Element {
  const [keyword, setKeyword] = useState("");
  const catalogQuery = useDesignerCatalogProductsQuery(projectId, {
    keyword: keyword.trim() || undefined,
    page: 1,
    pageSize: 30,
  });
  const products = catalogQuery.data?.items ?? [];

  return (
    <View style={detail.card}>
      <View style={[detail.cardAccent, { backgroundColor: DESIGNER.gold }]} />
      <Text style={detail.sectionLabel}>Eligible catalog</Text>
      <TextInput
        value={keyword}
        onChangeText={setKeyword}
        placeholder="Search products…"
        placeholderTextColor={DESIGNER.muted}
        style={detail.searchInput}
      />
      <Text style={detail.cardMeta}>Preview only on mobile — no 3D models.</Text>
      {catalogQuery.isLoading ? (
        <ActivityIndicator color={DESIGNER.accent} style={{ marginTop: 12 }} />
      ) : catalogQuery.isError ? (
        <Text style={[s.centerMuted, { marginTop: 12 }]}>
          {getErrorMessage(catalogQuery.error, "Unable to load catalog.")}
        </Text>
      ) : products.length === 0 ? (
        <Text style={[detail.cardMeta, { marginTop: 12 }]}>No eligible products for this project.</Text>
      ) : (
        products.map((product, index) => (
          <View
            key={product.productId}
            style={[detail.dividerBlock, index === 0 && { borderTopWidth: 0, marginTop: 10, paddingTop: 0 }]}
          >
            <Text style={detail.itemTitle}>{product.productName}</Text>
            <Text style={detail.itemMeta}>
              {product.productCode ?? "—"} · {product.eligibleVersionCount} version
              {product.eligibleVersionCount === 1 ? "" : "s"}
            </Text>
            {(product.eligibleVersions ?? []).slice(0, 2).map((version) => (
              <Text key={version.productVersionId} style={[detail.itemMeta, { marginTop: 2 }]}>
                {version.versionName}
                {version.estimatedPrice != null
                  ? ` · ₫ ${Number(version.estimatedPrice).toLocaleString()}`
                  : ""}
              </Text>
            ))}
          </View>
        ))
      )}
    </View>
  );
}
