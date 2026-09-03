import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { mailIconDefinition, phoneIconDefinition } from "../../../icons/communication/definitions";
import { arrowLeftIconDefinition, chevronDownIconDefinition } from "../../../icons/navigation/definitions";
import { calendarIconDefinition } from "../../../icons/project/definitions";
import { checkIconDefinition, pendingIconDefinition } from "../../../icons/status/definitions";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { AppBottomNav } from "../../../shared/components/AppBottomNav";
import { useBottomNavMetrics } from "../../../shared/hooks/useBottomNavMetrics";
import {
  canCustomerPayDeposit,
  canCustomerPayRemaining,
  findPendingPayment,
  hasPaidPayment,
} from "../../payment/utils/payment.helpers";
import type { MacroStageItem, PhaseDeadlineItemDto, ProjectScheduleDto } from "../models/project.tracking.model";
import { ProjectSwitcherModal } from "../components/ProjectSwitcherModal";
import { useActiveProjectSummary } from "../hooks/useProjects";
import { useActiveProjectId, useProjectStore } from "../store/project.store";
import {
  canReopenProposal,
  getPrimaryOrder,
  getUpcomingSchedules,
  useConfirmOrderDeliveryMutation,
  useProjectTrackingQueries,
  useReopenProjectProposalMutation,
} from "../hooks/useProjectTracking";
import { useProjectSwitcherPrefetch } from "../hooks/useProjectSwitcherPrefetch";
import { useProjectTrackingRealtime } from "../hooks/useProjectTrackingRealtime";
import { getScheduleStartAt } from "../services/project.tracking.api";
import {
  buildProjectTrackingSummary,
  computeDaysUntil,
  formatTrackingDate,
  getInitials,
  getPhaseDeadlineMetricLabel,
  getPhaseDeadlineStatusColor,
} from "../utils/project.tracking.mapper";
import { getProjectStatusLabel } from "../utils/project.mapper";
import {
  resolveCustomerFlowDecision,
  type CustomerFlowAction,
} from "../utils/project.customer-flow.mapper";
import { formatScheduleStatusLabel, formatScheduleTypeLabel } from "../utils/schedule.mapper";
import { styles } from "./ProjectTrackingScreen.styles";

type TrackingRoute = RouteProp<RootStackParamList, "Tracking">;

type TimelineVisualStatus = "done" | "active" | "pending";

function mapStageUiState(uiState: MacroStageItem["uiState"]): TimelineVisualStatus {
  if (uiState === "COMPLETED") {
    return "done";
  }

  if (uiState === "ACTIVE") {
    return "active";
  }

  return "pending";
}

export function ProjectTrackingScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<TrackingRoute>();
  const { scrollPaddingBottom } = useBottomNavMetrics();
  const setActiveProjectId = useProjectStore((state) => state.setActiveProjectId);
  const projectId = useActiveProjectId(route.params?.projectId);
  const { activeProjectId, projectsQuery } = useActiveProjectSummary();
  const [isProjectSwitcherOpen, setIsProjectSwitcherOpen] = useState(false);

  const projects = projectsQuery.data?.items ?? [];
  const hasMultipleProjects = projects.length > 1;
  const { prefetchProject, prefetchAllProjects } = useProjectSwitcherPrefetch(projects);

  const { data, isLoading, isError, refetchAll } = useProjectTrackingQueries(projectId);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const confirmDeliveryMutation = useConfirmOrderDeliveryMutation(projectId);
  const reopenProposalMutation = useReopenProjectProposalMutation(projectId);

  useProjectTrackingRealtime({
    projectId,
    enabled: Boolean(projectId),
    refetchAll,
  });

  const handlePullRefresh = useCallback(async () => {
    if (!projectId) {
      return;
    }

    setIsPullRefreshing(true);
    try {
      await refetchAll();
    } finally {
      setIsPullRefreshing(false);
    }
  }, [projectId, refetchAll]);

  const handleSelectProject = useCallback(
    (nextProjectId: string) => {
      prefetchProject(nextProjectId);
      setActiveProjectId(nextProjectId);
      navigation.setParams({ projectId: nextProjectId });
    },
    [navigation, prefetchProject, setActiveProjectId],
  );

  useEffect(() => {
    if (route.params?.projectId) {
      setActiveProjectId(route.params.projectId);
    }
  }, [route.params?.projectId, setActiveProjectId]);

  const upcomingSchedules = useMemo(() => getUpcomingSchedules(data?.schedules ?? []), [data?.schedules]);
  const primaryOrder = useMemo(() => getPrimaryOrder(data?.orders ?? []), [data?.orders]);

  const payments = data?.payments.items ?? [];
  const pendingDepositPayment = useMemo(() => findPendingPayment(payments, "DEPOSIT"), [payments]);
  const pendingRemainingPayment = useMemo(() => findPendingPayment(payments, "REMAINING_PAYMENT"), [payments]);
  const paidDeposit = useMemo(() => hasPaidPayment(payments, "DEPOSIT"), [payments]);

  const handleConfirmDelivery = () => {
    if (!primaryOrder) {
      return;
    }

    Alert.alert("Confirm Delivery", "Have you received all items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () => {
          confirmDeliveryMutation.mutate(primaryOrder.orderId, {
            onError: () => Alert.alert("Error", "Unable to confirm delivery. Please try again."),
          });
        },
      },
    ]);
  };

  const handleReopenProposal = () => {
    Alert.alert(
      "Reopen Proposal",
      "Reopen the design stage? This is only available before the deposit is paid.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reopen",
          onPress: () => {
            reopenProposalMutation.mutate(undefined, {
              onSuccess: () => Alert.alert("Success", "Proposal has been reopened."),
              onError: () => Alert.alert("Error", "Unable to reopen proposal. Please try again."),
            });
          },
        },
      ],
    );
  };

  const handlePayDeposit = () => {
    if (!primaryOrder) {
      return;
    }

    navigation.navigate("PaymentMethod", {
      orderId: primaryOrder.orderId,
      projectId: projectId ?? undefined,
      paymentId: pendingDepositPayment?.paymentId,
      paymentType: "DEPOSIT",
    });
  };

  const handlePayRemaining = () => {
    if (!primaryOrder) {
      return;
    }

    navigation.navigate("PaymentMethod", {
      orderId: primaryOrder.orderId,
      projectId: projectId ?? undefined,
      paymentId: pendingRemainingPayment?.paymentId,
      paymentType: "REMAINING_PAYMENT",
    });
  };

  const projectSummary = useMemo(
    () => projects.find((item) => item.projectId === projectId) ?? null,
    [projectId, projects],
  );

  const project = data?.project;
  const tracking = useMemo(() => {
    if (data?.tracking) {
      return data.tracking;
    }

    if (projectSummary) {
      return buildProjectTrackingSummary(projectSummary.status);
    }

    return buildProjectTrackingSummary("SUBMITTED");
  }, [data?.tracking, projectSummary]);
  const displayProjectName = project?.projectName ?? projectSummary?.projectName ?? "—";
  const displayProjectMeta = project
    ? `Project #${project.projectCode} · ${project.businessType}`
    : projectSummary
      ? `Project #${projectSummary.projectCode} · ${projectSummary.businessType}`
      : "Loading...";
  const displayStatusLabel = projectSummary ? projectSummary.statusLabel : tracking.currentStatusLabel;

  const flowDecision = useMemo(
    () => (project ? resolveCustomerFlowDecision(project.status) : null),
    [project],
  );

  const handleFlowAction = useCallback(
    (action: CustomerFlowAction) => {
      if (!projectId || !project) {
        return;
      }

      switch (action.id) {
        case "update_basic_information":
          navigation.navigate("UpdateProjectBasicInfo", { projectId });
          break;
        case "view_proposals":
          navigation.navigate("ProjectProposals", { projectId, projectName: project.projectName });
          break;
        case "view_quotations":
          navigation.navigate("ProjectQuotations", { projectId, projectName: project.projectName });
          break;
        case "view_orders":
          navigation.navigate("ProjectOrders", { projectId, projectName: project.projectName });
          break;
        case "pay_deposit":
          handlePayDeposit();
          break;
        case "pay_remaining":
          handlePayRemaining();
          break;
        case "confirm_schedule":
          navigation.navigate("ProjectSchedules", { projectId, projectName: project.projectName });
          break;
        case "confirm_delivery":
          handleConfirmDelivery();
          break;
        case "reopen_proposal":
          handleReopenProposal();
          break;
        case "open_chat":
          navigation.navigate("Messages", { projectId });
          break;
        default:
          break;
      }
    },
    [
      handleConfirmDelivery,
      handlePayDeposit,
      handlePayRemaining,
      handleReopenProposal,
      navigation,
      project,
      projectId,
    ],
  );

  const daysLeft = computeDaysUntil(project?.targetCompletionDate ?? data?.phaseDeadlines.targetCompletionDate);
  const progressPercent = tracking.progressPercent;
  const activeStageNumber = tracking.activeStageIndex >= 0 ? tracking.activeStageIndex + 1 : 0;
  const totalStages = tracking.stages.length || 6;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isPullRefreshing} onRefresh={() => void handlePullRefresh()} tintColor="#C9A86A" />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Pressable style={styles.backButton} onPress={() => navigation.navigate("Home")}>
              <AppIcon definition={arrowLeftIconDefinition} size={18} color="#FFFFFF" strokeWidth={1.8} />
            </Pressable>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.brandText}>FURNISPACE</Text>
              <Text style={styles.headerTitle}>Project Tracking</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryTextWrap}>
                <Text style={styles.projectName} numberOfLines={2}>
                  {displayProjectName}
                </Text>
                <Text style={styles.projectMeta} numberOfLines={2}>
                  {displayProjectMeta}
                </Text>
              </View>
              <View style={[styles.activePill, tracking.isRejected && styles.rejectedPill]}>
                <View style={[styles.activePillDot, tracking.isRejected && styles.rejectedPillDot]} />
                <Text style={[styles.activePillText, tracking.isRejected && styles.rejectedPillText]}>
                  {tracking.isRejected ? "REJECTED" : project?.status === "COMPLETED" ? "COMPLETED" : "ACTIVE"}
                </Text>
              </View>
            </View>

            {!tracking.isRejected ? (
              <>
                <View style={styles.stageRow}>
                  <Text style={styles.stageText}>
                    Stage {activeStageNumber} of {totalStages}
                  </Text>
                  <Text style={styles.stagePercent}>{progressPercent}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.max(progressPercent, 4)}%` }]} />
                </View>
                <Text style={styles.currentStatusText}>{displayStatusLabel}</Text>
                {hasMultipleProjects ? (
                  <Pressable
                    style={styles.switchProjectButton}
                    onPress={() => {
                      prefetchAllProjects();
                      setIsProjectSwitcherOpen(true);
                    }}
                  >
                    <Text style={styles.switchProjectButtonText}>Switch Project</Text>
                    <AppIcon definition={chevronDownIconDefinition} size={12} color="#E8D4A8" strokeWidth={2} />
                  </Pressable>
                ) : null}
              </>
            ) : (
              <Text style={styles.rejectedMessage}>
                This project was rejected and is no longer in the tracking workflow.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {!projectId ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateCardText}>
                No active project yet. Submit a request to start your FurniSpace journey.
              </Text>
              <Pressable style={styles.submitRequestButton} onPress={() => navigation.navigate("CreateProjectRequest")}>
                <Text style={styles.submitRequestButtonText}>Submit Project Request</Text>
              </Pressable>
            </View>
          ) : isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#C9A86A" />
              <Text style={styles.loadingText}>Loading project tracking...</Text>
            </View>
          ) : isError || !project ? (
            <StateCard message="Unable to load tracking data. Pull down to retry." />
          ) : (
            <>
              <View style={styles.metricsRow}>
                <MetricCard value={`${progressPercent}%`} label="COMPLETE" />
                <MetricCard value={daysLeft != null ? String(Math.max(daysLeft, 0)) : "—"} label="DAYS LEFT" />
                <MetricCard value={getPhaseDeadlineMetricLabel(data?.phaseDeadlines.deadlines ?? [])} label="PHASE KPI" />
              </View>

              <CustomerActionsCard
                flowDecision={flowDecision}
                canPayDeposit={canCustomerPayDeposit(payments, primaryOrder?.status, project.status)}
                canPayRemaining={canCustomerPayRemaining(payments, primaryOrder?.status, project.status)}
                canReopen={canReopenProposal(project.status, primaryOrder) && !paidDeposit}
                onFlowAction={handleFlowAction}
                isBusy={confirmDeliveryMutation.isPending || reopenProposalMutation.isPending}
              />

              {(project.assignedSales || project.assignedDesigner) ? (
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>ASSIGNED TEAM</Text>
                  {project.assignedSales ? (
                    <TeamRow
                      initials={getInitials(project.assignedSales.fullName)}
                      initialsBackground="#C9A86A"
                      name={project.assignedSales.fullName}
                      role="Sales Manager"
                    />
                  ) : null}
                  {project.assignedDesigner ? (
                    <TeamRow
                      initials={getInitials(project.assignedDesigner.fullName)}
                      initialsBackground="#3A3330"
                      name={project.assignedDesigner.fullName}
                      role="Lead Designer"
                    />
                  ) : null}
                </View>
              ) : null}

              {!tracking.isRejected ? (
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>PROJECT TIMELINE</Text>
                  <View style={styles.timelineList}>
                    {tracking.stages.map((item, index) => (
                      <TimelineRow
                        key={item.id}
                        title={item.label}
                        subtitle={item.uiState === "ACTIVE" ? tracking.currentStatusLabel : getProjectStatusLabel(item.statuses[item.statuses.length - 1])}
                        dateLabel={item.uiState === "ACTIVE" ? "In Progress" : item.uiState === "COMPLETED" ? "Completed" : "Pending"}
                        status={mapStageUiState(item.uiState)}
                        note={
                          item.uiState === "ACTIVE"
                            ? `Current stage: ${tracking.currentStatusLabel}.`
                            : undefined
                        }
                        isLast={index === tracking.stages.length - 1}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={styles.card}>
                <Text style={styles.cardLabel}>PHASE DEADLINES</Text>
                {(data?.phaseDeadlines.deadlines.length ?? 0) === 0 ? (
                  <Text style={styles.emptyHint}>Project phase deadlines have not been planned.</Text>
                ) : (
                  (data?.phaseDeadlines.deadlines ?? []).map((deadline) => (
                    <PhaseDeadlineRow key={deadline.phase} deadline={deadline} />
                  ))
                )}
              </View>

              {upcomingSchedules.length > 0 ? (
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>UPCOMING SCHEDULES</Text>
                  {upcomingSchedules.map((schedule) => (
                    <ScheduleRow key={schedule.scheduleId} schedule={schedule} />
                  ))}
                </View>
              ) : null}

              {primaryOrder ? (
                <Pressable
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate("OrderDetail", {
                      orderId: primaryOrder.orderId,
                      projectId: projectId!,
                      projectName: project.projectName,
                    })
                  }
                >
                  <Text style={styles.cardLabel}>ORDER STATUS</Text>
                  <Text style={styles.orderStatusText}>{primaryOrder.status.replaceAll("_", " ")}</Text>
                  {primaryOrder.totalAmount != null ? (
                    <Text style={styles.orderMetaText}>
                      Total {primaryOrder.totalAmount.toLocaleString()} · Deposit{" "}
                      {(primaryOrder.depositAmount ?? 0).toLocaleString()} · Paid{" "}
                      {(primaryOrder.paidAmount ?? 0).toLocaleString()}
                    </Text>
                  ) : null}
                  {project.deliverySummary ? (
                    <Text style={styles.orderMetaText}>
                      Delivery {project.deliverySummary.deliveredQuantity}/
                      {project.deliverySummary.totalQuantity} (
                      {project.deliverySummary.deliveryProgressPercent}%)
                    </Text>
                  ) : null}
                  <Text style={[styles.emptyHint, { marginTop: 8 }]}>Tap to view order details</Text>
                </Pressable>
              ) : null}

              <View style={styles.completionCard}>
                <View style={styles.completionIconWrap}>
                  <AppIcon definition={calendarIconDefinition} size={20} color="#C9A86A" />
                </View>
                <View style={styles.completionTextWrap}>
                  <Text style={styles.completionLabel}>TARGET COMPLETION</Text>
                  <Text style={styles.completionDate}>
                    {formatTrackingDate(project.targetCompletionDate ?? data?.phaseDeadlines.targetCompletionDate)}
                  </Text>
                  <Text style={styles.completionMeta}>
                    {daysLeft != null ? `${Math.max(daysLeft, 0)} days left` : "No target date"}
                    {project.projectAddress ? ` · ${project.projectAddress}` : ""}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <ProjectSwitcherModal
        visible={isProjectSwitcherOpen}
        projects={projects}
        activeProjectId={activeProjectId ?? projectId}
        onClose={() => setIsProjectSwitcherOpen(false)}
        onSelect={handleSelectProject}
        onPrefetch={prefetchProject}
      />

      <AppBottomNav activeTab="tracking" />
    </View>
  );
}

function StateCard({ message }: { message: string }): React.JSX.Element {
  return (
    <View style={styles.stateCard}>
      <Text style={styles.stateCardText}>{message}</Text>
    </View>
  );
}

function MetricCard({ value, label }: { value: string; label: string }): React.JSX.Element {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue} numberOfLines={2}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function CustomerActionsCard({
  flowDecision,
  canPayDeposit,
  canPayRemaining,
  canReopen,
  onFlowAction,
  isBusy,
}: {
  flowDecision: ReturnType<typeof resolveCustomerFlowDecision> | null;
  canPayDeposit: boolean;
  canPayRemaining: boolean;
  canReopen: boolean;
  onFlowAction: (action: CustomerFlowAction) => void;
  isBusy: boolean;
}): React.JSX.Element | null {
  if (!flowDecision) {
    return null;
  }

  const actions = flowDecision.actions.filter((action) => {
    if (action.id === "pay_deposit" && !canPayDeposit) return false;
    if (action.id === "pay_remaining" && !canPayRemaining) return false;
    if (action.id === "reopen_proposal" && !canReopen) return false;
    return true;
  });

  if (actions.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>ACTIONS</Text>
      {actions.map((action) => (
        <Pressable
          key={action.id}
          style={[styles.actionButton, isBusy && styles.actionButtonDisabled]}
          disabled={isBusy}
          onPress={() => onFlowAction(action)}
        >
          <Text style={styles.actionButtonText}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function TeamRow({
  initials,
  initialsBackground,
  name,
  role,
}: {
  initials: string;
  initialsBackground: string;
  name: string;
  role: string;
}): React.JSX.Element {
  return (
    <View style={styles.teamRow}>
      <View style={[styles.teamAvatar, { backgroundColor: initialsBackground }]}>
        <Text style={styles.teamInitials}>{initials}</Text>
      </View>
      <View style={styles.teamTextWrap}>
        <Text style={styles.teamName}>{name}</Text>
        <Text style={styles.teamRole}>{role}</Text>
      </View>
      <View style={styles.teamActions}>
        <Pressable style={styles.teamActionButton}>
          <AppIcon definition={phoneIconDefinition} size={13} color="#7A6F68" />
        </Pressable>
        <Pressable style={styles.teamActionButton}>
          <AppIcon definition={mailIconDefinition} size={13} color="#7A6F68" />
        </Pressable>
      </View>
    </View>
  );
}

function PhaseDeadlineRow({ deadline }: { deadline: PhaseDeadlineItemDto }): React.JSX.Element {
  const statusColor = getPhaseDeadlineStatusColor(deadline.status);

  return (
    <View style={styles.deadlineRow}>
      <View style={styles.deadlineTextWrap}>
        <Text style={styles.deadlinePhase}>{deadline.phase}</Text>
        <Text style={styles.deadlineDate}>Due {formatTrackingDate(deadline.dueDate)}</Text>
      </View>
      <Text style={[styles.deadlineStatus, { color: statusColor }]}>{deadline.status.replaceAll("_", " ")}</Text>
    </View>
  );
}

function ScheduleRow({ schedule }: { schedule: ProjectScheduleDto }): React.JSX.Element {
  return (
    <View style={styles.scheduleRow}>
      <View style={styles.scheduleTextWrap}>
        <Text style={styles.scheduleTitle}>{schedule.title ?? formatScheduleTypeLabel(schedule.scheduleType)}</Text>
        <Text style={styles.scheduleMeta}>
          {formatTrackingDate(getScheduleStartAt(schedule))} · {formatScheduleStatusLabel(schedule.status)}
          {schedule.location ? ` · ${schedule.location}` : ""}
        </Text>
      </View>
    </View>
  );
}

function TimelineRow({
  title,
  subtitle,
  dateLabel,
  status,
  note,
  isLast,
}: {
  title: string;
  subtitle: string;
  dateLabel: string;
  status: TimelineVisualStatus;
  note?: string;
  isLast: boolean;
}): React.JSX.Element {
  const isActive = status === "active";
  const isDone = status === "done";

  return (
    <View style={[styles.timelineRow, isLast && styles.timelineRowLast]}>
      <View style={styles.timelineRailWrap}>
        <View
          style={[
            styles.timelineDot,
            isDone && styles.timelineDotDone,
            isActive && styles.timelineDotActive,
            status === "pending" && styles.timelineDotPending,
          ]}
        >
          <AppIcon
            definition={isDone ? checkIconDefinition : pendingIconDefinition}
            size={13}
            color={isDone ? "#16A34A" : isActive ? "#C9A86A" : "#9B8F86"}
            strokeWidth={2}
          />
        </View>
        {!isLast ? (
          <View style={[styles.timelineLine, isDone && styles.timelineLineDone, isActive && styles.timelineLineActive]} />
        ) : null}
      </View>

      <View style={styles.timelineContent}>
        <View style={styles.timelineHeader}>
          <View style={styles.timelineTitleWrap}>
            <Text
              style={[
                styles.timelineTitle,
                isActive && styles.timelineTitleActive,
                status === "pending" && styles.timelineTitlePending,
              ]}
            >
              {title}
            </Text>
            <Text style={styles.timelineSubtitle}>{subtitle}</Text>
          </View>
          <View style={styles.timelineDateWrap}>
            <AppIcon definition={calendarIconDefinition} size={11} color="#7A6F68" />
            <Text style={styles.timelineDateText}>{dateLabel}</Text>
          </View>
        </View>

        {note ? (
          <View style={styles.timelineNote}>
            <Text style={styles.timelineNoteText}>{note}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
