import React, { useEffect, useMemo, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
import { useAuthStore } from "../../auth/store/auth.store";
import { useProjectDetailQuery } from "../../project/hooks/useProjects";
import type { ProjectDetailDto } from "../../project/models/project.model";
import type { ProjectScheduleDto, ProjectScheduleType } from "../../project/models/project.tracking.model";
import { getProjectStatusLabel, resolveProjectMemberDisplay } from "../../project/utils/project.mapper";
import { getScheduleStartAt } from "../../project/services/project.tracking.api";
import {
  useCreateProjectStartFeeMutation,
  useProjectStartFeeStatusQuery,
} from "../../payment/hooks/usePayments";
import { formatVndAmount, getPaymentStatusLabel } from "../../payment/utils/payment.mapper";
import type { PaymentStatus } from "../../payment/models/payment.model";
import { type ProjectDetailTab } from "../data/sale.mock";
import {
  useAssignProjectDesignerMutation,
  useAvailableDesignersQuery,
} from "../hooks/useSaleDashboard";
import type { SpaceDataStatus } from "../services/sale.api";
import { useSaleProposalsQuery, useSaleQuotationsQuery, useCreateQuotationMutation } from "../hooks/useSaleCommercial";
import { useSaleProjectOverviewRealtime } from "../hooks/useSaleProjectOverviewRealtime";
import { useSaleOrdersQuery, useCompleteProjectMutation, useSaleProductionRequestsQuery } from "../hooks/useSaleFulfillment";
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
import { resolveOrderDisplayTotal } from "../../project/utils/order.mapper";
import { buildProjectOverviewContent, formatSaleDate, getInitials, getSaleProjectStatusColors } from "../utils/sale.mapper";
import { formatSaleOrderStatusLabel } from "../utils/sale.order.mapper";
import {
  canSalesCompleteProject,
  canSalesStartProductionSetup,
  getSaleOrderStatusColors,
} from "../utils/sale.order.actions";
import { getQuotationStatusPillColors } from "../utils/sale.quotation.mapper";
import { Avatar, DetailFixedActions, ProjectDetailHeader, ProjectTabs, SaleFrame } from "../components/SaleShared";
import { SaleProjectChatTab } from "./SaleProjectChatTab";
import { SALE, saleStyles as s } from "../styles/sale.styles";

type ProjectProps = NativeStackScreenProps<RootStackParamList, "SaleProjectDetail">;

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

function formatApiDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseApiDateOnly(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function defaultProposalDueDate(targetCompletionDate: string | null | undefined): Date {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const proposal = new Date(today);
  proposal.setDate(proposal.getDate() + 7);
  const target = parseApiDateOnly(targetCompletionDate);
  if (target && proposal.getTime() > target.getTime()) {
    const fallback = new Date(target);
    fallback.setDate(fallback.getDate() - 14);
    return fallback.getTime() >= today.getTime() ? fallback : today;
  }
  return proposal;
}

function validateProposalDeadline(
  proposal: Date,
  targetCompletionDate: string | null | undefined,
): string | null {
  const target = parseApiDateOnly(targetCompletionDate);
  if (target && proposal.getTime() > target.getTime()) {
    return "Proposal deadline must be on or before target completion date.";
  }
  return null;
}

function getDesignerSlotCount(item: {
  availableSlot?: number | null;
  maxActiveProjects?: number | null;
  currentActiveProjectCount?: number | null;
  workload?: number | null;
}): number | null {
  if (typeof item.availableSlot === "number") {
    return item.availableSlot;
  }
  if (typeof item.maxActiveProjects === "number" && typeof item.currentActiveProjectCount === "number") {
    return Math.max(0, item.maxActiveProjects - item.currentActiveProjectCount);
  }
  if (typeof item.workload === "number") {
    return Math.max(0, 2 - item.workload);
  }
  return null;
}

function formatDesignerSlotPill(slots: number | null): string {
  if (slots == null) {
    return "Open";
  }
  if (slots <= 0) {
    return "Full";
  }
  return slots === 1 ? "1 slot" : `${slots} slots`;
}

const MIN_START_FEE_AMOUNT = 5_000;

function parseAmountDigits(value: string): number | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return null;
  }
  const parsed = Number(digits);
  return Number.isFinite(parsed) && parsed >= MIN_START_FEE_AMOUNT ? parsed : null;
}

function formatAmountDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  return Number(digits).toLocaleString("vi-VN");
}

function shouldShowStartFeeSection(
  project: ProjectDetailDto,
  feeStatus:
    | {
        requiresProjectStartFee: boolean;
        projectStartFeeStatus: PaymentStatus | null;
        isEligibleForDesignerAssignment?: boolean;
      }
    | undefined,
): boolean {
  if (project.assignedDesignerId || project.assignedDesigner?.accountId) {
    return false;
  }
  if (project.status === "REJECTED" || project.status === "COMPLETED") {
    return false;
  }
  if (feeStatus?.projectStartFeeStatus === "PAID" || feeStatus?.isEligibleForDesignerAssignment) {
    return false;
  }
  if (project.status !== "IN_CONSULTATION" && project.status !== "NEED_BASIC_INFORMATION") {
    return false;
  }
  if (feeStatus?.requiresProjectStartFee) {
    return true;
  }
  return project.status === "IN_CONSULTATION" || project.status === "NEED_BASIC_INFORMATION";
}

export function SaleProjectDetailScreen({ route, navigation }: ProjectProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const activeTab: ProjectDetailTab = route.params?.tab ?? "Overview";
  const projectId = route.params?.projectId ?? null;
  const [scheduleModal, setScheduleModal] = useState(route.params?.openScheduleModal ?? false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const projectQuery = useProjectDetailQuery(projectId);
  const project = projectQuery.data ?? null;
  const startFeeStatusQuery = useProjectStartFeeStatusQuery(projectId);
  const startFeeStatus = startFeeStatusQuery.data;
  useSaleProjectOverviewRealtime({
    projectId,
    enabled: activeTab === "Overview",
  });
  const needsDesigner =
    Boolean(project) &&
    !project?.assignedDesignerId &&
    !project?.assignedDesigner &&
    (project?.status === "WAITING_FOR_DESIGNER_ASSIGNMENT" || Boolean(startFeeStatus?.isEligibleForDesignerAssignment));
  const showFixedActions = activeTab !== "Chat" && Boolean(needsDesigner);
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
        <SaleProjectChatTab projectId={projectId} />
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
                onAssigned={() => setPickerOpen(false)}
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

function ProjectStartFeeCard({
  projectId,
  project,
}: {
  projectId: string | null;
  project: ProjectDetailDto;
}): React.JSX.Element | null {
  const statusQuery = useProjectStartFeeStatusQuery(projectId);
  const createMutation = useCreateProjectStartFeeMutation(projectId);
  const [amountInput, setAmountInput] = useState("");
  const [note, setNote] = useState("Project start fee");
  const parsedAmount = parseAmountDigits(amountInput);
  const canCreateFee = Boolean(parsedAmount) && Boolean(projectId);

  const feeStatus = statusQuery.data;
  const isPaid = feeStatus?.projectStartFeeStatus === "PAID";
  const paymentId = feeStatus?.paymentId ?? createMutation.data?.paymentId ?? null;
  const hasPendingPayment = Boolean(paymentId) && !isPaid;

  useEffect(() => {
    if (createMutation.data?.amount) {
      setAmountInput(formatAmountDigits(String(createMutation.data.amount)));
    }
  }, [createMutation.data?.amount]);

  const handleCreate = () => {
    const amount = parseAmountDigits(amountInput);
    if (!amount) {
      Alert.alert("Invalid amount", `Enter at least ${formatVndAmount(MIN_START_FEE_AMOUNT)}.`);
      return;
    }
    createMutation.mutate(
      {
        amount,
        ...(note.trim() ? { note: note.trim() } : {}),
      },
      {
        onSuccess: () => {
          Alert.alert("Start fee created", "The customer can choose a payment method in their app.");
        },
        onError: (error) => Alert.alert("Error", getErrorMessage(error, "Unable to create start fee.")),
      },
    );
  };

  if (statusQuery.isLoading) {
    return (
      <View style={[s.card, { alignItems: "center", paddingVertical: 20 }]}>
        <ActivityIndicator color={SALE.gold} />
        <Text style={[s.cardMeta, { marginTop: 8 }]}>Checking start fee…</Text>
      </View>
    );
  }

  if (isPaid || feeStatus?.isEligibleForDesignerAssignment) {
    return null;
  }

  if (hasPendingPayment) {
    const statusLabel = feeStatus?.projectStartFeeStatus
      ? getPaymentStatusLabel(feeStatus.projectStartFeeStatus)
      : "Pending";

    return (
      <View style={s.card}>
        <Text style={s.sectionLabel}>Project start fee</Text>
        <Text style={[s.cardTitle, { marginTop: 6 }]}>Awaiting customer payment</Text>
        <Text style={[s.cardMeta, { marginTop: 6 }]}>
          Status: {statusLabel}
          {paymentId ? ` · Payment ready` : ""}
        </Text>
        <Text style={[s.bodyText, { marginTop: 10 }]}>
          Waiting for the customer to choose a payment method and complete the transfer. Status updates automatically
          after payment.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.card}>
      <Text style={s.sectionLabel}>Project start fee</Text>
      <Text style={[s.bodyText, { marginTop: 8 }]}>
        Collect the start fee before assigning a designer. Minimum amount is {formatVndAmount(MIN_START_FEE_AMOUNT)}.
      </Text>

      <Text style={[s.infoLabel, { marginTop: 14 }]}>Amount (VND)</Text>
      <TextInput
        value={amountInput}
        onChangeText={(value) => setAmountInput(formatAmountDigits(value))}
        keyboardType="number-pad"
        placeholder={`Minimum ${MIN_START_FEE_AMOUNT.toLocaleString("vi-VN")}`}
        placeholderTextColor="rgba(122,111,104,.5)"
        style={[s.sheetInput, { marginTop: 6, height: 44 }]}
      />
      {amountInput.length > 0 && !parsedAmount ? (
        <Text style={[s.cardMeta, { marginTop: 6, color: SALE.red }]}>
          Amount must be at least {formatVndAmount(MIN_START_FEE_AMOUNT)}.
        </Text>
      ) : null}

      <Text style={[s.infoLabel, { marginTop: 12 }]}>Note (optional)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Project start fee"
        placeholderTextColor="rgba(122,111,104,.5)"
        style={[s.sheetInput, { marginTop: 6, height: 44 }]}
      />

      <Pressable
        style={[
          s.buttonPrimary,
          { marginTop: 16 },
          (createMutation.isPending || !canCreateFee) && { opacity: 0.7 },
        ]}
        disabled={createMutation.isPending || !canCreateFee}
        onPress={handleCreate}
      >
        <Text style={s.buttonPrimaryText}>
          {createMutation.isPending ? "Creating…" : "Create start fee"}
        </Text>
      </Pressable>

      {project.status !== "IN_CONSULTATION" ? (
        <Text style={[s.cardMeta, { marginTop: 10 }]}>
          Start fee is usually created while the project is In Consultation.
        </Text>
      ) : null}
    </View>
  );
}

function OverviewTab({
  project,
  projectId,
}: {
  project: ProjectDetailDto | null;
  projectId: string | null;
}): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const phaseQuery = useSalePhaseDeadlinesQuery(projectId);
  const areasQuery = useSaleProjectAreasQuery(projectId);
  const proposalsQuery = useSaleProposalsQuery(projectId);
  const quotationsQuery = useSaleQuotationsQuery(projectId);
  const ordersQuery = useSaleOrdersQuery(projectId);
  const primaryOrderId = ordersQuery.data?.[0]?.orderId ?? null;
  const productionRequestsQuery = useSaleProductionRequestsQuery(projectId, primaryOrderId);
  const startFeeStatusQuery = useProjectStartFeeStatusQuery(projectId);
  const completeProjectMutation = useCompleteProjectMutation();

  if (!project) {
    return <Text style={s.centerMuted}>Select a project to view details.</Text>;
  }

  const overviewContent = buildProjectOverviewContent(project);
  const budget =
    project.budgetMin != null || project.budgetMax != null
      ? `₫ ${(project.budgetMin ?? 0).toLocaleString()} – ${(project.budgetMax ?? 0).toLocaleString()}`
      : "—";

  const actionableQuotation = (quotationsQuery.data ?? []).find(
    (item) =>
      item.status === "DRAFT" ||
      item.status === "REVISED" ||
      item.status === "REVISION_REQUESTED",
  );
  const overviewQuotation =
    actionableQuotation ??
    (quotationsQuery.data ?? []).find(
      (item) => item.status !== "CANCELLED" && item.status !== "REJECTED",
    ) ??
    null;
  const needsQuotationFallback =
    project.status === "PROPOSAL_SELECTED" &&
    (quotationsQuery.data?.length ?? 0) === 0 &&
    !quotationsQuery.isLoading;
  const createQuotationMutation = useCreateQuotationMutation(projectId);
  const primaryOrder = (ordersQuery.data ?? [])[0] ?? null;
  const productionRequests = productionRequestsQuery.data ?? [];
  const showAssignProduction = canSalesStartProductionSetup(primaryOrder, productionRequests);
  // Once an order exists, ACCEPTED/SENT quotation mirrors the same commercial totals — keep only actionable drafts.
  const showOverviewQuotation = Boolean(
    overviewQuotation && projectId && (actionableQuotation || !primaryOrder),
  );
  const statusTone = getSaleProjectStatusColors(project.status);

  return (
    <>
      <View style={[s.alert, { backgroundColor: statusTone.backgroundColor, borderColor: statusTone.borderColor }]}>
        <View style={[s.detailPanelAccent, { backgroundColor: statusTone.color }]} />
        <View style={s.alertCopy}>
          <Text style={s.alertHeading}>Current status</Text>
          <Text style={[s.alertBody, { color: statusTone.color }]}>
            {getProjectStatusLabel(project.status)}
          </Text>
        </View>
      </View>

      {shouldShowStartFeeSection(project, startFeeStatusQuery.data) ? (
        <ProjectStartFeeCard projectId={projectId} project={project} />
      ) : null}

      <View style={s.quotationOverviewCard}>
        <View style={s.quotationOverviewAccent} />
        <View style={s.quotationOverviewBody}>
          <Text style={s.sectionLabel}>Ops snapshot</Text>
          <View style={s.snapshotStats}>
            {[
              ["Areas", String(areasQuery.data?.length ?? 0)],
              ["Proposals", String(proposalsQuery.data?.length ?? 0)],
              ["Quotations", String(quotationsQuery.data?.length ?? 0)],
              ["Orders", String(ordersQuery.data?.length ?? 0)],
            ].map(([label, value]) => (
              <View key={label} style={s.snapshotStat}>
                <Text style={s.snapshotStatValue}>{value}</Text>
                <Text style={s.snapshotStatLabel}>{label}</Text>
              </View>
            ))}
          </View>
          {(phaseQuery.data?.deadlines?.length ?? 0) > 0 ? (
            <View style={s.phaseRow}>
              {(phaseQuery.data?.deadlines ?? []).map((item) => (
                <View key={item.phase} style={s.phaseChip}>
                  <Text style={s.phaseChipLabel}>{item.phase}</Text>
                  <Text style={s.phaseChipValue}>{formatSaleDate(item.dueDate)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={s.cardMeta}>Phase deadlines not set yet.</Text>
          )}
        </View>
      </View>

      {needsQuotationFallback && projectId ? (
        <View style={s.quotationOverviewCard}>
          <View style={s.quotationOverviewAccent} />
          <View style={s.quotationOverviewBody}>
            <Text style={s.sectionLabel}>Quotation missing</Text>
            <Text style={[s.cardMeta, { lineHeight: 16 }]}>
              Proposal is selected but no quotation draft was found. Create a recovery draft to continue.
            </Text>
            <Pressable
              style={[
                s.fixedPrimary,
                { flex: undefined, width: "100%" },
                createQuotationMutation.isPending && { opacity: 0.6 },
              ]}
              disabled={createQuotationMutation.isPending}
              onPress={() =>
                createQuotationMutation.mutate(undefined, {
                  onSuccess: (quotation) => {
                    Alert.alert("Draft created", "Quotation draft is ready to edit.", [
                      {
                        text: "Open",
                        onPress: () =>
                          navigation.navigate("SaleQuotationDetail", {
                            quotationId: quotation.quotationId,
                            projectId,
                            projectName: project.projectName,
                          }),
                      },
                      { text: "OK" },
                    ]);
                    void quotationsQuery.refetch();
                  },
                  onError: (error) =>
                    Alert.alert("Error", getErrorMessage(error, "Unable to create quotation draft.")),
                })
              }
            >
              <Text style={[s.buttonPrimaryText, { fontSize: 13 }]}>
                {createQuotationMutation.isPending ? "Creating…" : "Create quotation draft"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {showOverviewQuotation && overviewQuotation && projectId ? (
        <View style={s.quotationOverviewCard}>
          <View style={s.quotationOverviewAccent} />
          <View style={s.quotationOverviewBody}>
            <Pressable
              onPress={() =>
                navigation.navigate("SaleQuotationDetail", {
                  quotationId: overviewQuotation.quotationId,
                  projectId,
                  projectName: project.projectName,
                })
              }
            >
              <View style={s.quotationOverviewTop}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.sectionLabel}>
                    {overviewQuotation.status === "REVISION_REQUESTED"
                      ? "Revision requested"
                      : actionableQuotation
                        ? "Quotation"
                        : "Latest quotation"}
                  </Text>
                  <Text style={s.quotationOverviewAmount}>
                    {formatVndAmount(overviewQuotation.totalAmount, overviewQuotation.currency)}
                  </Text>
                  <Text style={s.quotationOverviewCode}>
                    {overviewQuotation.quotationCode ?? "Draft"} · v{overviewQuotation.versionNo ?? 1}
                    {overviewQuotation.validUntil ? ` · Until ${formatSaleDate(overviewQuotation.validUntil)}` : ""}
                  </Text>
                </View>
                <View
                  style={[
                    s.quotationStatusPill,
                    {
                      backgroundColor: getQuotationStatusPillColors(overviewQuotation.status).backgroundColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.quotationStatusText,
                      { color: getQuotationStatusPillColors(overviewQuotation.status).color },
                    ]}
                  >
                    {overviewQuotation.status.replaceAll("_", " ")}
                  </Text>
                </View>
              </View>

              {!actionableQuotation ? (
                <View style={[s.quotationBreakdown, { marginTop: 12 }]}>
                  <View style={s.quotationBreakdownCell}>
                    <Text style={s.quotationBreakdownValue}>
                      {formatVndAmount(overviewQuotation.depositAmount ?? 0, overviewQuotation.currency)}
                    </Text>
                    <Text style={s.quotationBreakdownLabel}>Deposit</Text>
                  </View>
                  <View style={s.quotationBreakdownCell}>
                    <Text style={s.quotationBreakdownValue}>
                      {overviewQuotation.validUntil ? formatSaleDate(overviewQuotation.validUntil) : "—"}
                    </Text>
                    <Text style={s.quotationBreakdownLabel}>Valid until</Text>
                  </View>
                </View>
              ) : null}
            </Pressable>

            {overviewQuotation.revisionReason ? (
              <View style={s.quotationOverviewNote}>
                <Text style={s.quotationOverviewNoteText}>{overviewQuotation.revisionReason}</Text>
              </View>
            ) : null}

            {actionableQuotation ? (
              <Pressable
                style={[s.fixedPrimary, { flex: undefined, width: "100%" }]}
                onPress={() =>
                  navigation.navigate("SaleQuotationDetail", {
                    quotationId: actionableQuotation.quotationId,
                    projectId,
                    projectName: project.projectName,
                  })
                }
              >
                <Text style={[s.buttonPrimaryText, { fontSize: 13 }]}>
                  {actionableQuotation.status === "REVISION_REQUESTED" ? "Review & revise" : "Edit & send"}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={[s.buttonSecondary, { flex: undefined, width: "100%", height: 40 }]}
                onPress={() =>
                  navigation.navigate("SaleQuotationDetail", {
                    quotationId: overviewQuotation.quotationId,
                    projectId,
                    projectName: project.projectName,
                  })
                }
              >
                <Text style={s.buttonSecondaryText}>View quotation</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : null}

      {primaryOrder && projectId ? (
        <View style={s.quotationOverviewCard}>
          <View style={s.quotationOverviewAccent} />
          <View style={s.quotationOverviewBody}>
            <Pressable
              onPress={() =>
                navigation.navigate("SaleOrderDetail", {
                  orderId: primaryOrder.orderId,
                  projectId,
                  projectName: project.projectName,
                })
              }
            >
              <View style={s.quotationOverviewTop}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.sectionLabel}>Latest order</Text>
                  <Text style={s.quotationOverviewAmount}>
                    {formatVndAmount(resolveOrderDisplayTotal(primaryOrder))}
                  </Text>
                </View>
                <View
                  style={[
                    s.quotationStatusPill,
                    { backgroundColor: getSaleOrderStatusColors(primaryOrder.status).backgroundColor },
                  ]}
                >
                  <Text
                    style={[
                      s.quotationStatusText,
                      { color: getSaleOrderStatusColors(primaryOrder.status).color },
                    ]}
                  >
                    {formatSaleOrderStatusLabel(primaryOrder.status)}
                  </Text>
                </View>
              </View>

              <Text style={s.quotationOverviewCode} numberOfLines={1}>
                {primaryOrder.orderCode ?? primaryOrder.orderId.slice(0, 8)}
              </Text>

              <View style={[s.quotationBreakdown, { marginTop: 12 }]}>
                <View style={s.quotationBreakdownCell}>
                  <Text style={s.quotationBreakdownValue}>{formatVndAmount(primaryOrder.paidAmount ?? 0)}</Text>
                  <Text style={s.quotationBreakdownLabel}>Paid</Text>
                </View>
                <View style={s.quotationBreakdownCell}>
                  <Text style={[s.quotationBreakdownValue, { color: SALE.gold }]}>
                    {formatVndAmount(primaryOrder.remainingAmount ?? 0)}
                  </Text>
                  <Text style={s.quotationBreakdownLabel}>Remaining</Text>
                </View>
              </View>
            </Pressable>

            {showAssignProduction ? (
              <Pressable
                style={[s.fixedPrimary, { flex: undefined, width: "100%" }]}
                onPress={() =>
                  navigation.navigate("SaleOrderDetail", {
                    orderId: primaryOrder.orderId,
                    projectId,
                    projectName: project.projectName,
                  })
                }
              >
                <Text style={[s.buttonPrimaryText, { fontSize: 13 }]}>Assign production</Text>
              </Pressable>
            ) : canSalesCompleteProject(primaryOrder, project.status) ? (
              <Pressable
                style={[s.fixedPrimary, { flex: undefined, width: "100%" }, completeProjectMutation.isPending && { opacity: 0.6 }]}
                disabled={completeProjectMutation.isPending}
                onPress={() => {
                  Alert.alert("Complete project", "Mark this project as completed?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Complete",
                      onPress: () =>
                        completeProjectMutation.mutate(projectId, {
                          onSuccess: () => Alert.alert("Completed", "Project marked complete."),
                          onError: (error) =>
                            Alert.alert("Error", getErrorMessage(error, "Unable to complete project.")),
                        }),
                    },
                  ]);
                }}
              >
                <Text style={[s.buttonPrimaryText, { fontSize: 13 }]}>
                  {completeProjectMutation.isPending ? "Completing…" : "Complete project"}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={[s.buttonSecondary, { flex: undefined, width: "100%", height: 40 }]}
                onPress={() =>
                  navigation.navigate("SaleOrderDetail", {
                    orderId: primaryOrder.orderId,
                    projectId,
                    projectName: project.projectName,
                  })
                }
              >
                <Text style={s.buttonSecondaryText}>View order</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : null}

      {overviewContent.brief ? (
        <View style={s.card}>
          <Text style={s.sectionLabel}>Project Brief</Text>
          <Text style={[s.bodyText, { marginTop: 8 }]}>{overviewContent.brief}</Text>
        </View>
      ) : null}
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
      {overviewContent.businessPurpose ? (
        <RequirementCard title="Business Purpose" items={[overviewContent.businessPurpose]} bullets />
      ) : null}
      {overviewContent.furnitureItems.length > 0 ? (
        <RequirementCard title="Furniture Requirements" items={overviewContent.furnitureItems} />
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
  onAssigned,
}: {
  project: ProjectDetailDto | null;
  projectId: string | null;
  pickerOpen: boolean;
  onTogglePicker: () => void;
  onAssigned?: () => void;
}): React.JSX.Element {
  const designerId = project?.assignedDesignerId ?? project?.assignedDesigner?.accountId ?? null;
  const authUser = useAuthStore((state) => state.user);
  const needsDesignerName = Boolean(designerId && !project?.assignedDesigner?.fullName?.trim());
  const designersQuery = useAvailableDesignersQuery(pickerOpen || !designerId || needsDesignerName);
  const phaseQuery = useSalePhaseDeadlinesQuery(projectId);
  const assignMutation = useAssignProjectDesignerMutation(projectId);
  const [selectedDesignerId, setSelectedDesignerId] = useState<string | null>(null);
  const [spaceDataStatus, setSpaceDataStatus] = useState<SpaceDataStatus>("INSUFFICIENT");
  const [proposalDeadline, setProposalDeadline] = useState<Date>(() => defaultProposalDueDate(null));
  const [showProposalPicker, setShowProposalPicker] = useState(false);

  const spaceDataOptions: Array<{ value: SpaceDataStatus; label: string; description: string }> = [
    {
      value: "INSUFFICIENT",
      label: "Insufficient - needs measurement",
      description: "Designer will schedule an on-site measurement.",
    },
    {
      value: "SUFFICIENT",
      label: "Sufficient - ready for design review",
      description: "Space data is ready — skip measurement.",
    },
  ];

  const salesMember = resolveProjectMemberDisplay(
    project?.assignedSales,
    project?.assignedSalesId,
    authUser,
    "Assigned sales",
  );
  const designerFromList = designerId
    ? (designersQuery.data ?? []).find((item) => item.accountId === designerId)
    : null;
  const designerMember = resolveProjectMemberDisplay(
    designerFromList
      ? { accountId: designerFromList.accountId, fullName: designerFromList.fullName }
      : project?.assignedDesigner,
    designerId,
    authUser,
    "Assigned designer",
  );
  const customerLabel = project?.customerId ? `ID · ${project.customerId.slice(0, 8)}` : "Not linked";
  const targetCompletionDate =
    project?.targetCompletionDate ?? phaseQuery.data?.targetCompletionDate ?? null;
  const availableDesigners = useMemo(() => {
    const items = [...(designersQuery.data ?? [])];
    items.sort((a, b) => {
      const slotA = getDesignerSlotCount(a) ?? -1;
      const slotB = getDesignerSlotCount(b) ?? -1;
      if (slotB !== slotA) {
        return slotB - slotA;
      }
      return (a.fullName ?? "").localeCompare(b.fullName ?? "");
    });
    return items;
  }, [designersQuery.data]);

  useEffect(() => {
    if (!pickerOpen) {
      setShowProposalPicker(false);
      return;
    }

    const deadlines = phaseQuery.data?.deadlines ?? [];
    const proposalExisting = deadlines.find((item) => item.phase === "PROPOSAL")?.dueDate;
    setProposalDeadline(
      parseApiDateOnly(proposalExisting) ?? defaultProposalDueDate(targetCompletionDate),
    );
  }, [pickerOpen, phaseQuery.data, targetCompletionDate]);

  const handleProposalPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setShowProposalPicker(false);
    }
    if (event.type === "dismissed" || !date) {
      return;
    }
    setProposalDeadline(date);
  };

  const handleAssign = () => {
    if (!selectedDesignerId) {
      Alert.alert("Select a designer", "Choose an available designer first.");
      return;
    }

    const validationError = validateProposalDeadline(proposalDeadline, targetCompletionDate);
    if (validationError) {
      Alert.alert("Invalid deadline", validationError);
      return;
    }

    assignMutation.mutate(
      {
        designerId: selectedDesignerId,
        spaceDataStatus,
        proposalDeadline: formatApiDateOnly(proposalDeadline),
        note: "Assigned from Sales mobile",
      },
      {
        onSuccess: () => {
          setSelectedDesignerId(null);
          setSpaceDataStatus("INSUFFICIENT");
          setShowProposalPicker(false);
          onAssigned?.();
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
          <Avatar initials={getInitials(salesMember.fullName)} color={SALE.gold} />
          <View style={s.memberCopy}>
            <Text style={s.memberName}>{salesMember.fullName ?? "Unassigned"}</Text>
            <Text style={s.memberRole}>Sales manager</Text>
          </View>
          <View style={[s.memberBadge, salesMember.isAssigned ? s.memberBadgeReady : s.memberBadgeWait]}>
            <Text
              style={[
                s.memberBadgeText,
                salesMember.isAssigned ? s.memberBadgeReadyText : s.memberBadgeWaitText,
              ]}
            >
              {salesMember.isAssigned ? "Assigned" : "Open"}
            </Text>
          </View>
        </View>
      </View>

      <View style={s.card}>
        <View style={s.sectionRow}>
          <Text style={s.sectionLabel}>Designer</Text>
          {!designerMember.isAssigned ? (
            <Pressable onPress={onTogglePicker}>
              <Text style={s.sectionAction}>{pickerOpen ? "Hide list" : "Pick designer"}</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={s.memberRow}>
          <Avatar initials={getInitials(designerMember.fullName)} color="#4A7A5A" />
          <View style={s.memberCopy}>
            <Text style={s.memberName}>{designerMember.fullName ?? "No designer yet"}</Text>
            <Text style={s.memberRole}>
              {designerMember.isAssigned ? "Lead designer" : "Waiting for designer assignment"}
            </Text>
          </View>
          <View style={[s.memberBadge, designerMember.isAssigned ? s.memberBadgeReady : s.memberBadgeWait]}>
            <Text
              style={[
                s.memberBadgeText,
                designerMember.isAssigned ? s.memberBadgeReadyText : s.memberBadgeWaitText,
              ]}
            >
              {designerMember.isAssigned ? "Assigned" : "Needed"}
            </Text>
          </View>
        </View>

        {!designerMember.isAssigned && pickerOpen ? (
          <>
            <View style={[s.quotationFieldBlock, { marginTop: 14 }]}>
              <Text style={s.quotationFieldLabel}>Available designers</Text>
              <Text style={s.productionFieldHint}>Shows designers with open assignment slots.</Text>
              {designersQuery.isLoading ? (
                <ActivityIndicator color={SALE.gold} style={{ marginTop: 8 }} />
              ) : designersQuery.isError ? (
                <Text style={[s.centerMuted, { marginTop: 4 }]}>
                  {getErrorMessage(designersQuery.error, "Unable to load designers.")}
                </Text>
              ) : availableDesigners.length === 0 ? (
                <Text style={[s.centerMuted, { marginTop: 4 }]}>No designers with open slots right now.</Text>
              ) : (
                <View style={s.designerPickList}>
                  {availableDesigners.map((item) => {
                    const selected = selectedDesignerId === item.accountId;
                    const slots = getDesignerSlotCount(item);
                    const full = slots != null && slots <= 0;
                    const low = slots != null && slots === 1;
                    return (
                      <Pressable
                        key={item.accountId}
                        style={[
                          s.designerPickCard,
                          selected && s.designerPickCardSelected,
                          full && s.designerPickCardDisabled,
                        ]}
                        disabled={full}
                        onPress={() => setSelectedDesignerId(item.accountId)}
                      >
                        <Avatar
                          initials={getInitials(item.fullName)}
                          color={selected ? SALE.gold : SALE.charcoal}
                          size={36}
                        />
                        <View style={[s.memberCopy, { flex: 1 }]}>
                          <Text style={s.memberName} numberOfLines={1}>
                            {item.fullName}
                          </Text>
                          <Text style={s.designerPickMeta} numberOfLines={1}>
                            {item.email ?? item.phone ?? "Designer"}
                            {typeof item.currentActiveProjectCount === "number"
                              ? ` · ${item.currentActiveProjectCount} active`
                              : ""}
                          </Text>
                        </View>
                        <View
                          style={[
                            s.designerSlotPill,
                            low && s.designerSlotPillLow,
                            full && s.designerSlotPillFull,
                          ]}
                        >
                          <Text
                            style={[
                              s.designerSlotPillText,
                              low && s.designerSlotPillTextLow,
                              full && s.designerSlotPillTextFull,
                            ]}
                          >
                            {formatDesignerSlotPill(slots)}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={s.assignSetupBlock}>
              <View style={s.quotationFieldBlock}>
                <Text style={s.quotationFieldLabel}>Proposal deadline</Text>
                <Text style={s.productionFieldHint}>
                  Required · on or before target
                  {targetCompletionDate ? ` (${formatSaleDate(targetCompletionDate)})` : ""}
                </Text>
                <Pressable style={s.assignDateRow} onPress={() => setShowProposalPicker(true)}>
                  <AppIcon definition={calendarIconDefinition} size={15} color={SALE.gold} />
                  <Text style={s.assignDateValue}>
                    {formatSaleDate(formatApiDateOnly(proposalDeadline))}
                  </Text>
                </Pressable>
                {showProposalPicker ? (
                  <>
                    <DateTimePicker
                      value={proposalDeadline}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={handleProposalPickerChange}
                    />
                    {Platform.OS === "ios" ? (
                      <Pressable
                        style={[s.buttonPrimary, { marginTop: 4, height: 40, flex: undefined }]}
                        onPress={() => setShowProposalPicker(false)}
                      >
                        <Text style={s.buttonPrimaryText}>Done</Text>
                      </Pressable>
                    ) : null}
                  </>
                ) : null}
              </View>

              <View style={s.quotationFieldBlock}>
                <Text style={s.quotationFieldLabel}>Space data status</Text>
                <View style={{ gap: 8 }}>
                  {spaceDataOptions.map((option) => {
                    const selected = spaceDataStatus === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        style={[s.spaceStatusOption, selected && s.spaceStatusOptionSelected]}
                        onPress={() => setSpaceDataStatus(option.value)}
                      >
                        <View style={[s.spaceStatusRadio, selected && s.spaceStatusRadioSelected]}>
                          {selected ? <View style={s.spaceStatusRadioDot} /> : null}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.spaceStatusTitle}>{option.label}</Text>
                          <Text style={s.spaceStatusDesc}>{option.description}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {!selectedDesignerId ? (
                <Text style={[s.cardMeta, { color: SALE.red }]}>
                  Select a designer above to continue.
                </Text>
              ) : null}

              <Pressable
                style={[
                  s.productionCreateButton,
                  { marginTop: 2 },
                  (assignMutation.isPending || !selectedDesignerId) && { opacity: 0.45 },
                ]}
                disabled={assignMutation.isPending || !selectedDesignerId}
                onPress={handleAssign}
              >
                <Text style={s.quotationFooterPrimaryText}>
                  {assignMutation.isPending ? "Assigning…" : "Confirm assignment"}
                </Text>
              </Pressable>
            </View>
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
          <Text style={[s.sectionAction, { marginTop: 7 }]}>＋ Add schedule</Text>
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
  const [type, setType] = useState<"MEASUREMENT" | "CONSULTATION">("MEASUREMENT");
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

function Info({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={s.infoCell}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}
