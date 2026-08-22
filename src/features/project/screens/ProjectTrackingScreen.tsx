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
import type { MacroStageItem, PhaseDeadlineItemDto, ProjectScheduleDto } from "../models/project.tracking.model";
import { ProjectSwitcherModal } from "../components/ProjectSwitcherModal";
import { useActiveProjectSummary } from "../hooks/useProjects";
import { useActiveProjectId, useProjectStore } from "../store/project.store";
import {
  canReopenProposal,
  getPendingConfirmationSchedules,
  getPrimaryOrder,
  getUpcomingSchedules,
  useConfirmOrderDeliveryMutation,
  useConfirmProjectScheduleMutation,
  useProjectTrackingQueries,
  useReopenProjectProposalMutation,
} from "../hooks/useProjectTracking";
import { useProjectTrackingRealtime } from "../hooks/useProjectTrackingRealtime";
import {
  buildProjectTrackingSummary,
  computeDaysUntil,
  formatTrackingDate,
  getInitials,
  getPhaseDeadlineMetricLabel,
  getPhaseDeadlineStatusColor,
} from "../utils/project.tracking.mapper";
import { getProjectStatusLabel } from "../utils/project.mapper";
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

  const { data, isLoading, isError, refetchAll } = useProjectTrackingQueries(projectId);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const confirmScheduleMutation = useConfirmProjectScheduleMutation(projectId);
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
      setActiveProjectId(nextProjectId);
      navigation.setParams({ projectId: nextProjectId });
    },
    [navigation, setActiveProjectId],
  );

  useEffect(() => {
    if (route.params?.projectId) {
      setActiveProjectId(route.params.projectId);
    }
  }, [route.params?.projectId, setActiveProjectId]);

  const pendingSchedules = useMemo(
    () => getPendingConfirmationSchedules(data?.schedules ?? []),
    [data?.schedules],
  );
  const upcomingSchedules = useMemo(() => getUpcomingSchedules(data?.schedules ?? []), [data?.schedules]);
  const primaryOrder = useMemo(() => getPrimaryOrder(data?.orders ?? []), [data?.orders]);

  const pendingDepositPayment = useMemo(() => {
    return (data?.payments.items ?? []).find(
      (payment) => payment.paymentType === "DEPOSIT" && (payment.status === "PENDING" || payment.status === "PROCESSING"),
    );
  }, [data?.payments.items]);

  const paidDeposit = useMemo(() => {
    return (data?.payments.items ?? []).some(
      (payment) => payment.paymentType === "DEPOSIT" && payment.status === "PAID",
    );
  }, [data?.payments.items]);

  const handleConfirmSchedule = (schedule: ProjectScheduleDto) => {
    Alert.alert("Confirm Schedule", `Confirm ${schedule.title ?? schedule.scheduleType}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () => {
          confirmScheduleMutation.mutate(schedule.scheduleId, {
            onError: () => Alert.alert("Error", "Unable to confirm the schedule. Please try again."),
          });
        },
      },
    ]);
  };

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

  const tracking = data?.tracking ?? buildProjectTrackingSummary("SUBMITTED");
  const project = data?.project;
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
                  {project?.projectName ?? "—"}
                </Text>
                <Text style={styles.projectMeta} numberOfLines={2}>
                  {project ? `Project #${project.projectCode} · ${project.businessType}` : "Loading..."}
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
                <Text style={styles.currentStatusText}>{tracking.currentStatusLabel}</Text>
                {hasMultipleProjects ? (
                  <Pressable style={styles.switchProjectButton} onPress={() => setIsProjectSwitcherOpen(true)}>
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
                status={project.status}
                hasPendingSchedules={pendingSchedules.length > 0}
                canPayDeposit={project.status === "ORDER_CONFIRMED" && !paidDeposit}
                canConfirmDelivery={project.status === "DELIVERING"}
                canReopen={canReopenProposal(project.status) && !paidDeposit}
                onConfirmSchedule={() => pendingSchedules[0] && handleConfirmSchedule(pendingSchedules[0])}
                onPayDeposit={handlePayDeposit}
                onConfirmDelivery={handleConfirmDelivery}
                onReopenProposal={handleReopenProposal}
                isBusy={
                  confirmScheduleMutation.isPending ||
                  confirmDeliveryMutation.isPending ||
                  reopenProposalMutation.isPending
                }
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
                    <ScheduleRow
                      key={schedule.scheduleId}
                      schedule={schedule}
                      onConfirm={
                        schedule.status === "PENDING_CONFIRMATION"
                          ? () => handleConfirmSchedule(schedule)
                          : undefined
                      }
                    />
                  ))}
                </View>
              ) : null}

              {primaryOrder ? (
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>ORDER STATUS</Text>
                  <Text style={styles.orderStatusText}>{primaryOrder.status.replaceAll("_", " ")}</Text>
                  {primaryOrder.totalAmount != null ? (
                    <Text style={styles.orderMetaText}>
                      Total {primaryOrder.totalAmount.toLocaleString()} · Paid {(primaryOrder.paidAmount ?? 0).toLocaleString()}
                    </Text>
                  ) : null}
                </View>
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
  status,
  hasPendingSchedules,
  canPayDeposit,
  canConfirmDelivery,
  canReopen,
  onConfirmSchedule,
  onPayDeposit,
  onConfirmDelivery,
  onReopenProposal,
  isBusy,
}: {
  status: string;
  hasPendingSchedules: boolean;
  canPayDeposit: boolean;
  canConfirmDelivery: boolean;
  canReopen: boolean;
  onConfirmSchedule: () => void;
  onPayDeposit: () => void;
  onConfirmDelivery: () => void;
  onReopenProposal: () => void;
  isBusy: boolean;
}): React.JSX.Element | null {
  const actions: Array<{ label: string; onPress: () => void }> = [];

  if (status === "NEED_BASIC_INFORMATION") {
    actions.push({ label: "Update Basic Information", onPress: () => undefined });
  }

  if (hasPendingSchedules) {
    actions.push({ label: "Confirm Schedule", onPress: onConfirmSchedule });
  }

  if (canPayDeposit) {
    actions.push({ label: "Pay Deposit (30%)", onPress: onPayDeposit });
  }

  if (canConfirmDelivery) {
    actions.push({ label: "Confirm Delivery", onPress: onConfirmDelivery });
  }

  if (canReopen) {
    actions.push({ label: "Reopen Proposal", onPress: onReopenProposal });
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>ACTIONS</Text>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          style={[styles.actionButton, isBusy && styles.actionButtonDisabled]}
          disabled={isBusy}
          onPress={action.onPress}
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

function ScheduleRow({
  schedule,
  onConfirm,
}: {
  schedule: ProjectScheduleDto;
  onConfirm?: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.scheduleRow}>
      <View style={styles.scheduleTextWrap}>
        <Text style={styles.scheduleTitle}>{schedule.title ?? schedule.scheduleType.replaceAll("_", " ")}</Text>
        <Text style={styles.scheduleMeta}>
          {formatTrackingDate(schedule.scheduledAt)} · {schedule.status.replaceAll("_", " ")}
        </Text>
      </View>
      {onConfirm ? (
        <Pressable style={styles.scheduleConfirmButton} onPress={onConfirm}>
          <Text style={styles.scheduleConfirmText}>Confirm</Text>
        </Pressable>
      ) : null}
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
