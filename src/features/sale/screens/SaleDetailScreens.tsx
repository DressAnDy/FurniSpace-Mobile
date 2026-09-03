import React, { useEffect, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { plusIconDefinition } from "../../../icons/action/definitions";
import {
  sendIconDefinition,
  paperclipIconDefinition,
  phoneIconDefinition,
} from "../../../icons/communication/definitions";
import { calendarIconDefinition, clockIconDefinition } from "../../../icons/project/definitions";
import {
  downloadIconDefinition,
  fileTextIconDefinition,
  imageIconDefinition,
  pdfIconDefinition,
  uploadIconDefinition,
} from "../../../icons/file/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { useProjectDetailQuery } from "../../project/hooks/useProjects";
import type { ProjectDetailDto } from "../../project/models/project.model";
import type { ProjectScheduleDto, ProjectScheduleType } from "../../project/models/project.tracking.model";
import { getProjectStatusLabel } from "../../project/utils/project.mapper";
import { getScheduleStartAt } from "../../project/services/project.tracking.api";
import { saleConversations, type ProjectDetailTab } from "../data/sale.mock";
import {
  useAssignProjectDesignerMutation,
  useAvailableDesignersQuery,
} from "../hooks/useSaleDashboard";
import { useSaleProposalsQuery, useSaleQuotationsQuery, useSendQuotationMutation } from "../hooks/useSaleCommercial";
import { useSaleOrdersQuery } from "../hooks/useSaleFulfillment";
import {
  pickAndUploadProjectFile,
  useCreateProjectScheduleMutation,
  useSalePhaseDeadlinesQuery,
  useSaleProjectAreasQuery,
  useSaleProjectFilesQuery,
  useSaleProjectSchedulesQuery,
  useUploadProjectFileMutation,
} from "../hooks/useSaleOps";
import type { ProjectFileDto } from "../models/sale.ops.model";
import { formatSaleDate, getInitials } from "../utils/sale.mapper";
import { Avatar, DetailFixedActions, ProjectDetailHeader, ProjectTabs, SaleFrame } from "../components/SaleShared";
import { SALE, saleStyles as s } from "../styles/sale.styles";

type ProjectProps = NativeStackScreenProps<RootStackParamList, "SaleProjectDetail">;
type ChatProps = NativeStackScreenProps<RootStackParamList, "SaleChat">;

function formatScheduleTimeRange(schedule: ProjectScheduleDto): string {
  const start = getScheduleStartAt(schedule);
  const end = schedule.scheduledEnd || schedule.endAt;
  const startLabel = start
    ? new Date(start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "—";
  const endLabel = end
    ? new Date(end).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "";
  return endLabel ? `${startLabel}–${endLabel}` : startLabel;
}

function defaultScheduleWindow(): { start: Date; end: Date } {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(11, 0, 0, 0);
  return { start, end };
}

function formatScheduleClock(value: Date): string {
  return value.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function applyDateKeepTime(base: Date, nextDate: Date): Date {
  const merged = new Date(nextDate);
  merged.setHours(base.getHours(), base.getMinutes(), 0, 0);
  return merged;
}

function applyTimeKeepDate(base: Date, nextTime: Date): Date {
  const merged = new Date(base);
  merged.setHours(nextTime.getHours(), nextTime.getMinutes(), 0, 0);
  return merged;
}

export function SaleProjectDetailScreen({ route, navigation }: ProjectProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const activeTab: ProjectDetailTab = route.params?.tab ?? "Overview";
  const projectId = route.params?.projectId ?? null;
  const [scheduleModal, setScheduleModal] = useState(route.params?.openScheduleModal ?? false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const projectQuery = useProjectDetailQuery(projectId);
  const project = projectQuery.data ?? null;
  const needsDesigner =
    Boolean(project) &&
    !project?.assignedDesignerId &&
    (project?.status === "WAITING_FOR_DESIGNER_ASSIGNMENT" ||
      project?.status === "IN_CONSULTATION" ||
      project?.status === "NEED_BASIC_INFORMATION" ||
      !project?.assignedDesigner);
  const showFixedActions = activeTab !== "Chat";
  const bottomPad = showFixedActions ? 88 + Math.max(insets.bottom, 12) : 24;

  return (
    <SaleFrame>
      <ProjectDetailHeader
        projectCode={project?.projectCode}
        projectName={project?.projectName}
        businessType={project?.businessType}
        status={project?.status}
        statusLabel={project ? getProjectStatusLabel(project.status) : projectQuery.isLoading ? "Loading…" : undefined}
      />
      <ProjectTabs active={activeTab} projectId={projectId ?? undefined} />
      {activeTab === "Chat" ? (
        <ProjectChat />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.content, s.contentGap, { paddingTop: 16, paddingBottom: bottomPad }]}
        >
          {activeTab === "Overview" ? (
            projectQuery.isLoading ? (
              <ActivityIndicator color={SALE.gold} />
            ) : projectQuery.isError ? (
              <Text style={s.centerMuted}>{getErrorMessage(projectQuery.error, "Unable to load project.")}</Text>
            ) : (
              <OverviewTab project={project} projectId={projectId} />
            )
          ) : null}
          {activeTab === "Member" ? (
            projectQuery.isLoading ? (
              <ActivityIndicator color={SALE.gold} />
            ) : (
              <MemberTab
                project={project}
                projectId={projectId}
                pickerOpen={pickerOpen}
                onTogglePicker={() => setPickerOpen((open) => !open)}
              />
            )
          ) : null}
          {activeTab === "Files" ? <FilesTab projectId={projectId} /> : null}
          {activeTab === "Schedules" ? (
            <SchedulesTab projectId={projectId} project={project} onCreate={() => setScheduleModal(true)} />
          ) : null}
        </ScrollView>
      )}
      {showFixedActions ? (
        <DetailFixedActions
          showAssignDesigner={Boolean(needsDesigner)}
          onAssignDesigner={() => {
            if (activeTab !== "Member") {
              navigation.setParams({ tab: "Member", ...(projectId ? { projectId } : {}) } as never);
            }
            setPickerOpen(true);
          }}
          onMoreActions={() =>
            Alert.alert("More actions", "Request info, reopen proposal, and commercial shortcuts coming next.")
          }
        />
      ) : null}
      <CreateScheduleModal
        visible={scheduleModal}
        projectId={projectId}
        project={project}
        onClose={() => setScheduleModal(false)}
      />
    </SaleFrame>
  );
}

function OverviewTab({
  project,
  projectId,
}: {
  project: ProjectDetailDto | null;
  projectId: string | null;
}): React.JSX.Element {
  const phaseQuery = useSalePhaseDeadlinesQuery(projectId);
  const areasQuery = useSaleProjectAreasQuery(projectId);
  const proposalsQuery = useSaleProposalsQuery(projectId);
  const quotationsQuery = useSaleQuotationsQuery(projectId);
  const ordersQuery = useSaleOrdersQuery(projectId);
  const sendQuotationMutation = useSendQuotationMutation(projectId);

  if (!project) {
    return <Text style={s.centerMuted}>Select a project to view details.</Text>;
  }

  const brief =
    project.description?.trim() ||
    project.businessPurpose?.trim() ||
    "No project brief provided yet.";
  const furnitureItems = project.furnitureRequirement
    ? project.furnitureRequirement.split(/[,\n]/).map((item) => item.trim()).filter(Boolean)
    : [];
  const budget =
    project.budgetMin != null || project.budgetMax != null
      ? `₫ ${(project.budgetMin ?? 0).toLocaleString()} – ${(project.budgetMax ?? 0).toLocaleString()}`
      : "—";

  const draftQuotation = (quotationsQuery.data ?? []).find(
    (item) => item.status === "DRAFT" || item.status === "REVISED",
  );
  const primaryOrder = (ordersQuery.data ?? [])[0] ?? null;

  return (
    <>
      <View style={s.alert}>
        <View style={s.alertCopy}>
          <Text style={s.alertHeading}>Current status</Text>
          <Text style={s.alertBody}>{getProjectStatusLabel(project.status)}</Text>
        </View>
      </View>

      <View style={s.detailPanel}>
        <View style={s.detailPanelAccent} />
        <Text style={s.sectionLabel}>Ops snapshot</Text>
        <View style={s.infoGrid}>
          <Info label="Areas" value={String(areasQuery.data?.length ?? "—")} />
          <Info label="Proposals" value={String(proposalsQuery.data?.length ?? "—")} />
          <Info label="Quotations" value={String(quotationsQuery.data?.length ?? "—")} />
          <Info label="Orders" value={String(ordersQuery.data?.length ?? "—")} />
        </View>
        {(phaseQuery.data?.deadlines?.length ?? 0) > 0 ? (
          <Text style={[s.cardMeta, { marginTop: 10 }]}>
            Phase:{" "}
            {(phaseQuery.data?.deadlines ?? [])
              .map((item) => `${item.phase} ${formatSaleDate(item.dueDate)}`)
              .join(" · ")}
          </Text>
        ) : (
          <Text style={[s.cardMeta, { marginTop: 10 }]}>Phase deadlines not set yet.</Text>
        )}
      </View>

      {draftQuotation ? (
        <View style={s.card}>
          <Text style={s.sectionLabel}>Quotation ready</Text>
          <Text style={s.cardTitle}>{draftQuotation.quotationCode ?? "Draft quotation"}</Text>
          <Text style={s.cardMeta}>
            {draftQuotation.status} · ₫ {(draftQuotation.totalAmount ?? 0).toLocaleString()}
          </Text>
          <Pressable
            style={[s.buttonPrimary, { marginTop: 12 }]}
            disabled={sendQuotationMutation.isPending}
            onPress={() =>
              sendQuotationMutation.mutate(draftQuotation.quotationId, {
                onSuccess: () => Alert.alert("Sent", "Quotation sent to customer."),
                onError: (error) => Alert.alert("Error", getErrorMessage(error, "Unable to send quotation.")),
              })
            }
          >
            <Text style={s.buttonPrimaryText}>
              {sendQuotationMutation.isPending ? "Sending…" : "Send quotation"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {primaryOrder ? (
        <View style={s.card}>
          <Text style={s.sectionLabel}>Latest order</Text>
          <Text style={s.cardTitle}>{primaryOrder.orderCode ?? primaryOrder.orderId}</Text>
          <Text style={s.cardMeta}>
            {primaryOrder.status} · Deposit ₫ {(primaryOrder.depositAmount ?? 0).toLocaleString()} · Paid ₫{" "}
            {(primaryOrder.paidAmount ?? 0).toLocaleString()}
          </Text>
        </View>
      ) : null}

      <View style={s.card}>
        <Text style={s.sectionLabel}>Project Brief</Text>
        <Text style={[s.bodyText, { marginTop: 8 }]}>{brief}</Text>
      </View>
      <View style={s.card}>
        <Text style={s.sectionLabel}>Project Details</Text>
        <View style={s.infoGrid}>
          <Info label="Area" value={project.totalAreaSqm != null ? `${project.totalAreaSqm} sqm` : "—"} />
          <Info label="Budget" value={budget} />
          <Info label="Submitted" value={formatSaleDate(project.submittedAt)} />
          <Info label="Target Date" value={formatSaleDate(project.targetCompletionDate)} />
          <View style={{ width: "100%" }}>
            <Text style={s.infoLabel}>Address</Text>
            <Text style={s.infoValue}>{project.projectAddress || "—"}</Text>
          </View>
        </View>
      </View>
      {project.businessPurpose ? (
        <RequirementCard title="Business Purpose" items={[project.businessPurpose]} bullets />
      ) : null}
      {furnitureItems.length > 0 ? (
        <RequirementCard title="Furniture Requirements" items={furnitureItems} />
      ) : null}
    </>
  );
}

function RequirementCard({
  title,
  items,
  bullets = false,
}: {
  title: string;
  items: string[];
  bullets?: boolean;
}): React.JSX.Element {
  return (
    <View style={s.card}>
      <Text style={s.sectionLabel}>{title}</Text>
      {items.map((item, index) => (
        <View style={s.bulletRow} key={item}>
          {bullets ? <View style={s.bullet} /> : <Text style={s.cardMeta}>{index + 1}.</Text>}
          <Text style={[s.bodyText, { flex: 1 }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function MemberTab({
  project,
  projectId,
  pickerOpen,
  onTogglePicker,
}: {
  project: ProjectDetailDto | null;
  projectId: string | null;
  pickerOpen: boolean;
  onTogglePicker: () => void;
}): React.JSX.Element {
  const designersQuery = useAvailableDesignersQuery(pickerOpen || !project?.assignedDesignerId);
  const assignMutation = useAssignProjectDesignerMutation(projectId);
  const [selectedDesignerId, setSelectedDesignerId] = useState<string | null>(null);

  const sales = project?.assignedSales;
  const designer = project?.assignedDesigner;
  const customerLabel = project?.customerId ? `ID · ${project.customerId.slice(0, 8)}` : "Not linked";

  const handleAssign = () => {
    if (!selectedDesignerId) {
      Alert.alert("Select a designer", "Choose an available designer first.");
      return;
    }
    assignMutation.mutate(
      { designerId: selectedDesignerId, note: "Assigned from Sales mobile" },
      {
        onSuccess: () => {
          setSelectedDesignerId(null);
          Alert.alert("Assigned", "Designer has been assigned to this project.");
        },
        onError: (error) => Alert.alert("Error", getErrorMessage(error, "Unable to assign designer.")),
      },
    );
  };

  if (!project) {
    return <Text style={s.centerMuted}>Select a project to view members.</Text>;
  }

  return (
    <>
      <View style={s.detailPanel}>
        <View style={s.detailPanelAccent} />
        <Text style={s.sectionLabel}>Customer</Text>
        <View style={s.memberRow}>
          <Avatar initials="CU" color={SALE.charcoal} />
          <View style={s.memberCopy}>
            <Text style={s.memberName}>Project customer</Text>
            <Text style={s.memberRole}>{customerLabel}</Text>
            <Text style={s.memberMeta}>{project.projectAddress || "Address not provided"}</Text>
          </View>
          <View style={[s.memberBadge, s.memberBadgeReady]}>
            <Text style={[s.memberBadgeText, s.memberBadgeReadyText]}>Owner</Text>
          </View>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.sectionLabel}>Sales</Text>
        <View style={s.memberRow}>
          <Avatar initials={getInitials(sales?.fullName)} color={SALE.gold} />
          <View style={s.memberCopy}>
            <Text style={s.memberName}>{sales?.fullName ?? "Unassigned"}</Text>
            <Text style={s.memberRole}>Sales manager</Text>
          </View>
          <View style={[s.memberBadge, sales ? s.memberBadgeReady : s.memberBadgeWait]}>
            <Text style={[s.memberBadgeText, sales ? s.memberBadgeReadyText : s.memberBadgeWaitText]}>
              {sales ? "Assigned" : "Open"}
            </Text>
          </View>
        </View>
      </View>

      <View style={s.card}>
        <View style={s.sectionRow}>
          <Text style={s.sectionLabel}>Designer</Text>
          {!designer ? (
            <Pressable onPress={onTogglePicker}>
              <Text style={s.sectionAction}>{pickerOpen ? "Hide list" : "Pick designer"}</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={s.memberRow}>
          <Avatar initials={getInitials(designer?.fullName)} color="#4A7A5A" />
          <View style={s.memberCopy}>
            <Text style={s.memberName}>{designer?.fullName ?? "No designer yet"}</Text>
            <Text style={s.memberRole}>
              {designer ? "Lead designer" : "Waiting for designer assignment"}
            </Text>
          </View>
          <View style={[s.memberBadge, designer ? s.memberBadgeReady : s.memberBadgeWait]}>
            <Text style={[s.memberBadgeText, designer ? s.memberBadgeReadyText : s.memberBadgeWaitText]}>
              {designer ? "Assigned" : "Needed"}
            </Text>
          </View>
        </View>

        {!designer && pickerOpen ? (
          <>
            {designersQuery.isLoading ? (
              <ActivityIndicator color={SALE.gold} style={{ marginTop: 12 }} />
            ) : designersQuery.isError ? (
              <Text style={[s.centerMuted, { marginTop: 8 }]}>
                {getErrorMessage(designersQuery.error, "Unable to load designers.")}
              </Text>
            ) : (designersQuery.data ?? []).length === 0 ? (
              <Text style={[s.centerMuted, { marginTop: 8 }]}>No available designers right now.</Text>
            ) : (
              (designersQuery.data ?? []).map((item) => {
                const selected = selectedDesignerId === item.accountId;
                return (
                  <Pressable
                    key={item.accountId}
                    style={[s.designerPickRow, selected && s.designerPickSelected]}
                    onPress={() => setSelectedDesignerId(item.accountId)}
                  >
                    <Avatar initials={getInitials(item.fullName)} color={selected ? SALE.gold : SALE.charcoal} size={34} />
                    <View style={s.memberCopy}>
                      <Text style={s.memberName}>{item.fullName}</Text>
                      <Text style={s.memberRole}>{item.email ?? item.phone ?? "Available"}</Text>
                    </View>
                    {selected ? <Text style={s.availability}>Selected</Text> : null}
                  </Pressable>
                );
              })
            )}
            <Pressable
              style={[s.buttonPrimary, { marginTop: 14, height: 40 }]}
              disabled={assignMutation.isPending || !selectedDesignerId}
              onPress={handleAssign}
            >
              <Text style={s.buttonPrimaryText}>
                {assignMutation.isPending ? "Assigning…" : "Confirm assignment"}
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </>
  );
}

function FilesTab({ projectId }: { projectId: string | null }): React.JSX.Element {
  const filesQuery = useSaleProjectFilesQuery(projectId);
  const uploadMutation = useUploadProjectFileMutation(projectId);
  const files = filesQuery.data?.items ?? [];

  const handleUpload = async () => {
    if (!projectId) {
      return;
    }
    try {
      await pickAndUploadProjectFile(projectId, (input) => uploadMutation.mutateAsync(input));
    } catch (error) {
      Alert.alert("Upload failed", getErrorMessage(error, "Unable to upload file."));
    }
  };

  return (
    <>
      <Pressable style={s.uploadZone} onPress={() => void handleUpload()} disabled={uploadMutation.isPending}>
        <AppIcon definition={uploadIconDefinition} size={22} color={SALE.gold} />
        <Text style={[s.cardTitle, { marginTop: 10 }]}>
          {uploadMutation.isPending ? "Uploading…" : "Upload project files"}
        </Text>
        <Text style={[s.centerMuted, { marginTop: 4 }]}>PDF, images or documents up to 20 MB</Text>
      </Pressable>

      <View style={s.card}>
        <Text style={s.sectionLabel}>{files.length} files</Text>
        {filesQuery.isLoading ? (
          <ActivityIndicator color={SALE.gold} />
        ) : filesQuery.isError ? (
          <Text style={s.centerMuted}>{getErrorMessage(filesQuery.error, "Unable to load files.")}</Text>
        ) : files.length === 0 ? (
          <View style={s.emptyFilesBox}>
            <Text style={s.bodyText}>No files uploaded yet.</Text>
            <Text style={[s.centerMuted, { marginTop: 4 }]}>Floor plans, references, and reports appear here.</Text>
          </View>
        ) : (
          files.map((file) => <FileRow key={file.fileId} file={file} />)
        )}
      </View>
    </>
  );
}

function FileRow({ file }: { file: ProjectFileDto }): React.JSX.Element {
  const isImage = (file.mimeType ?? "").startsWith("image/");
  const isPdf = (file.mimeType ?? "").includes("pdf") || file.originalFileName.toLowerCase().endsWith(".pdf");
  return (
    <View style={s.fileRow}>
      <View style={s.fileIcon}>
        <AppIcon
          definition={isPdf ? pdfIconDefinition : isImage ? imageIconDefinition : fileTextIconDefinition}
          size={17}
          color={SALE.muted}
        />
      </View>
      <View style={s.fileCopy}>
        <Text style={s.fileName}>{file.originalFileName}</Text>
        <Text style={s.fileMeta}>
          {file.fileType} · {file.visibility} · {formatSaleDate(file.uploadedAt)}
        </Text>
      </View>
      <AppIcon definition={downloadIconDefinition} size={15} color={SALE.muted} />
    </View>
  );
}

function ProjectChat(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    "Hi, your start fee has been confirmed.",
    "Thank you. When will the designer be assigned?",
  ]);
  const send = () => {
    if (message.trim()) {
      setMessages((current) => [...current, message.trim()]);
      setMessage("");
    }
  };
  return (
    <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={s.fill} contentContainerStyle={s.messageArea}>
        <Text style={s.centerMuted}>CHAT API · COMING NEXT</Text>
        {messages.map((item, index) => (
          <View key={`${item}-${index}`} style={[s.bubble, index % 2 ? s.bubbleOther : s.bubbleOwn]}>
            <Text style={[s.bubbleText, index % 2 ? null : s.bubbleOwnText]}>{item}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={[s.composer, { paddingBottom: Math.max(insets.bottom, 9) }]}>
        <AppIcon definition={paperclipIconDefinition} size={19} color={SALE.muted} />
        <TextInput
          multiline
          value={message}
          onChangeText={setMessage}
          placeholder="Write a message…"
          placeholderTextColor="rgba(122,111,104,.5)"
          style={s.composerInput}
        />
        <Pressable style={s.send} onPress={send}>
          <AppIcon definition={sendIconDefinition} size={16} color={SALE.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function SchedulesTab({
  projectId,
  project,
  onCreate,
}: {
  projectId: string | null;
  project: ProjectDetailDto | null;
  onCreate: () => void;
}): React.JSX.Element {
  const schedulesQuery = useSaleProjectSchedulesQuery(projectId);
  const schedules = schedulesQuery.data ?? [];

  return (
    <>
      <View style={s.sectionRow}>
        <Text style={s.sectionLabel}>{schedules.length} schedules</Text>
        <Pressable style={{ flexDirection: "row", gap: 4 }} onPress={onCreate}>
          <AppIcon definition={plusIconDefinition} size={13} color={SALE.gold} />
          <Text style={s.sectionAction}>Create Schedule</Text>
        </Pressable>
      </View>

      {schedulesQuery.isLoading ? (
        <ActivityIndicator color={SALE.gold} />
      ) : schedulesQuery.isError ? (
        <Text style={s.centerMuted}>{getErrorMessage(schedulesQuery.error, "Unable to load schedules.")}</Text>
      ) : schedules.length === 0 ? (
        <Pressable style={[s.card, s.dashed]} onPress={onCreate}>
          <Text style={s.bodyText}>No schedules yet</Text>
          <Text style={[s.sectionAction, { marginTop: 7 }]}>＋ Add Measurement / Delivery</Text>
        </Pressable>
      ) : (
        schedules.map((schedule) => (
          <ScheduleCard
            key={schedule.scheduleId}
            title={schedule.title ?? schedule.scheduleType}
            status={schedule.status.replaceAll("_", " ")}
            date={formatSaleDate(getScheduleStartAt(schedule))}
            time={formatScheduleTimeRange(schedule)}
            type={schedule.scheduleType.replaceAll("_", " ")}
          />
        ))
      )}

      {project?.status === "MEASUREMENT_REQUIRED" ? (
        <Pressable style={[s.card, s.dashed]} onPress={onCreate}>
          <Text style={s.bodyText}>Schedule a site measurement visit</Text>
          <Text style={[s.sectionAction, { marginTop: 7 }]}>＋ Add Measurement Schedule</Text>
        </Pressable>
      ) : null}
    </>
  );
}

function ScheduleCard({
  title,
  status,
  date,
  time,
  type,
}: {
  title: string;
  status: string;
  date: string;
  time: string;
  type: string;
}): React.JSX.Element {
  return (
    <View style={s.card}>
      <View style={s.topCardRow}>
        <Text style={s.cardTitle}>{title}</Text>
        <View style={s.status}>
          <Text style={s.statusText}>{status}</Text>
        </View>
      </View>
      <View style={s.scheduleRow}>
        <View style={s.scheduleMeta}>
          <AppIcon definition={calendarIconDefinition} size={13} color={SALE.muted} />
          <Text style={s.infoValue}>{date}</Text>
        </View>
        <View style={s.scheduleMeta}>
          <AppIcon definition={clockIconDefinition} size={13} color={SALE.muted} />
          <Text style={s.infoValue}>{time}</Text>
        </View>
      </View>
      <View style={s.buttonRow}>
        <View style={[s.status, { borderWidth: 0, backgroundColor: SALE.pale }]}>
          <Text style={[s.statusText, { color: SALE.muted }]}>{type}</Text>
        </View>
      </View>
    </View>
  );
}

function CreateScheduleModal({
  visible,
  onClose,
  projectId,
  project,
}: {
  visible: boolean;
  onClose: () => void;
  projectId: string | null;
  project: ProjectDetailDto | null;
}): React.JSX.Element {
  const createMutation = useCreateProjectScheduleMutation(projectId);
  const [type, setType] = useState<"MEASUREMENT" | "DELIVERY" | "CONSULTATION">("MEASUREMENT");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState(project?.projectAddress ?? "");
  const [customerNote, setCustomerNote] = useState("");
  const [startAt, setStartAt] = useState(() => defaultScheduleWindow().start);
  const [endAt, setEndAt] = useState(() => defaultScheduleWindow().end);
  const [pickerMode, setPickerMode] = useState<"date" | "start" | "end" | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const window = defaultScheduleWindow();
    setStartAt(window.start);
    setEndAt(window.end);
    setLocation(project?.projectAddress ?? "");
    setPickerMode(null);
  }, [visible, project?.projectAddress]);

  const typeOptions: Array<{ label: string; value: typeof type }> = [
    { label: "Measurement", value: "MEASUREMENT" },
    { label: "Delivery", value: "DELIVERY" },
    { label: "Consultation", value: "CONSULTATION" },
  ];

  const canCreate = Boolean(projectId && title.trim() && endAt.getTime() > startAt.getTime());

  const closePicker = () => setPickerMode(null);

  const handlePickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setPickerMode(null);
    }

    if (event.type === "dismissed" || !date || !pickerMode) {
      return;
    }

    if (pickerMode === "date") {
      setStartAt((current) => applyDateKeepTime(current, date));
      setEndAt((current) => applyDateKeepTime(current, date));
      return;
    }

    if (pickerMode === "start") {
      const nextStart = applyTimeKeepDate(startAt, date);
      setStartAt(nextStart);
      setEndAt((current) => (current.getTime() <= nextStart.getTime()
        ? new Date(nextStart.getTime() + 2 * 60 * 60 * 1000)
        : current));
      return;
    }

    const nextEnd = applyTimeKeepDate(endAt, date);
    if (nextEnd.getTime() <= startAt.getTime()) {
      Alert.alert("Invalid time", "End time must be after start time.");
      return;
    }
    setEndAt(nextEnd);
  };

  const handleCreate = () => {
    if (!projectId || !canCreate) {
      return;
    }

    const scheduleType = type as ProjectScheduleType;
    const assignedStaffId =
      scheduleType === "MEASUREMENT" ? project?.assignedDesignerId ?? undefined : undefined;

    if (scheduleType === "MEASUREMENT" && !assignedStaffId) {
      Alert.alert("Missing designer", "Assign a designer before creating a measurement schedule.");
      return;
    }

    createMutation.mutate(
      {
        scheduleType,
        title: title.trim(),
        assignedStaffId,
        scheduledStart: startAt.toISOString(),
        scheduledEnd: endAt.toISOString(),
        location: location.trim() || project?.projectAddress || null,
        customerNote: customerNote.trim() || null,
      },
      {
        onSuccess: () => {
          setTitle("");
          setCustomerNote("");
          setPickerMode(null);
          onClose();
          Alert.alert("Created", "Schedule created and waiting for confirmation.");
        },
        onError: (error) => Alert.alert("Error", getErrorMessage(error, "Unable to create schedule.")),
      },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.modalBackdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={s.sheetHandle} />
          <View style={s.sheetHeader}>
            <View>
              <Text style={s.sheetTitle}>New Schedule</Text>
              <Text style={s.cardMeta}>{project?.projectCode ?? "Project"}</Text>
            </View>
            <Pressable style={s.settingIcon} onPress={onClose}>
              <Text style={{ color: SALE.muted, fontSize: 18 }}>×</Text>
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.sheetBody}>
            <View style={s.typeRow}>
              {typeOptions.map((item) => (
                <Pressable
                  key={item.value}
                  style={[s.typeOption, type === item.value && s.typeSelected]}
                  onPress={() => setType(item.value)}
                >
                  <Text style={[s.chipText, type === item.value && { color: SALE.charcoal }]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Schedule title"
              placeholderTextColor="rgba(122,111,104,.5)"
              style={s.sheetInput}
            />
            <View style={s.dateRow}>
              <Pressable style={s.dateField} onPress={() => setPickerMode("date")}>
                <Text style={s.dateText}>{formatSaleDate(startAt.toISOString())}</Text>
              </Pressable>
              <Pressable style={s.dateField} onPress={() => setPickerMode("start")}>
                <Text style={s.dateText}>{formatScheduleClock(startAt)}</Text>
              </Pressable>
              <Pressable style={s.dateField} onPress={() => setPickerMode("end")}>
                <Text style={s.dateText}>{formatScheduleClock(endAt)}</Text>
              </Pressable>
            </View>

            {pickerMode ? (
              <>
                <DateTimePicker
                  value={pickerMode === "end" ? endAt : startAt}
                  mode={pickerMode === "date" ? "date" : "time"}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  minimumDate={pickerMode === "date" ? new Date() : undefined}
                  onChange={handlePickerChange}
                />
                {Platform.OS === "ios" ? (
                  <Pressable style={s.buttonSecondary} onPress={closePicker}>
                    <Text style={s.buttonSecondaryText}>Done</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}

            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Location or meeting link"
              placeholderTextColor="rgba(122,111,104,.5)"
              style={s.sheetInput}
            />
            <TextInput
              value={customerNote}
              onChangeText={setCustomerNote}
              placeholder="Customer note (optional)"
              placeholderTextColor="rgba(122,111,104,.5)"
              style={s.sheetInput}
            />
            <View style={s.typeRow}>
              <Pressable style={[s.buttonSecondary, { height: 41 }]} onPress={onClose}>
                <Text style={s.buttonSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={!canCreate || createMutation.isPending}
                style={[
                  s.buttonPrimary,
                  { height: 41, flex: 2 },
                  (!canCreate || createMutation.isPending) && { backgroundColor: "rgba(122,111,104,.2)" },
                ]}
                onPress={handleCreate}
              >
                <Text style={s.buttonPrimaryText}>{createMutation.isPending ? "Creating…" : "Create"}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function SaleChatScreen({ route, navigation }: ChatProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const conversation = saleConversations.find((item) => item.id === route.params.conversationId) ?? saleConversations[0];
  const [message, setMessage] = useState("");
  const [items, setItems] = useState([
    "Xin chào, tôi muốn hỏi về tiến độ hiện tại.",
    "Chào anh/chị. Phí khởi động đã được xác nhận và chúng tôi đang phân công designer.",
  ]);
  const send = () => {
    if (message.trim()) {
      setItems((current) => [...current, message.trim()]);
      setMessage("");
    }
  };
  return (
    <SaleFrame>
      <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[s.header, { paddingTop: Math.max(insets.top, 18) + 8 }]}>
          <View style={s.detailHeaderTop}>
            <Pressable style={s.backButton} onPress={() => navigation.goBack()}>
              <Text style={{ color: SALE.white, fontSize: 19 }}>‹</Text>
            </Pressable>
            <Avatar initials={conversation.initials} color={conversation.color} size={36} />
            <View style={s.detailTitleWrap}>
              <Text style={s.detailTitle}>{conversation.name}</Text>
              <Text style={s.headerSubtitle}>{conversation.meta}</Text>
            </View>
            <AppIcon definition={phoneIconDefinition} size={18} color={SALE.white} />
          </View>
        </View>
        <ScrollView style={s.fill} contentContainerStyle={s.messageArea} keyboardShouldPersistTaps="handled">
          {items.map((item, index) => {
            const own = index % 2 === 1;
            return (
              <View key={`${item}-${index}`} style={[s.bubble, own ? s.bubbleOwn : s.bubbleOther]}>
                <Text style={[s.bubbleText, own && s.bubbleOwnText]}>{item}</Text>
              </View>
            );
          })}
        </ScrollView>
        <View style={[s.composer, { paddingBottom: Math.max(insets.bottom, 9) }]}>
          <AppIcon definition={paperclipIconDefinition} size={19} color={SALE.muted} />
          <TextInput
            multiline
            value={message}
            onChangeText={setMessage}
            placeholder="Write a message…"
            placeholderTextColor="rgba(122,111,104,.5)"
            style={s.composerInput}
          />
          <Pressable style={s.send} onPress={send}>
            <AppIcon definition={sendIconDefinition} size={16} color={SALE.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SaleFrame>
  );
}

function Info({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={s.infoCell}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}
