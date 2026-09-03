import React, { useMemo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { truckIconDefinition } from "../../../icons/commerce/definitions";
import { mapPinIconDefinition } from "../../../icons/common/definitions";
import { calendarIconDefinition } from "../../../icons/project/definitions";
import { arrowLeftIconDefinition } from "../../../icons/navigation/definitions";
import { checkIconDefinition } from "../../../icons/status/definitions";
import { ProjectScheduleDto } from "../models/project.tracking.model";
import {
  useConfirmProjectScheduleMutation,
  getPendingConfirmationSchedules,
  getUpcomingSchedules,
} from "../hooks/useProjectTracking";
import { useProjectSchedulesQuery } from "../hooks/useCustomerFlow";
import {
  formatScheduleStatusLabel,
  formatScheduleTypeLabel,
  isSchedulePendingConfirmation,
} from "../utils/schedule.mapper";
import { projectSchedulesStyles as styles } from "./ProjectSchedulesScreen.styles";

type Route = RouteProp<RootStackParamList, "ProjectSchedules">;

function SectionHeader({
  title,
  count,
  accent,
}: {
  title: string;
  count: number;
  accent?: boolean;
}): React.JSX.Element {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionDot, !accent && styles.sectionDotMuted]} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
  );
}

function splitScheduleDateTime(value: string | null | undefined): { date: string; time: string } {
  if (!value) {
    return { date: "—", time: "" };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { date: value, time: "" };
  }

  return {
    date: parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: parsed.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

function TimeSlot({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}): React.JSX.Element {
  const { date, time } = splitScheduleDateTime(value);

  return (
    <View style={styles.timeSlot}>
      <Text style={styles.timeSlotLabel}>{label}</Text>
      <Text style={styles.timeSlotDate}>{date}</Text>
      {time ? <Text style={styles.timeSlotTime}>{time}</Text> : null}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: React.ComponentProps<typeof AppIcon>["definition"];
  label: string;
  value: string;
  isLast?: boolean;
}): React.JSX.Element {
  return (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <View style={styles.infoRowIconWrap}>
        <AppIcon definition={icon} size={16} color="#8A6D3B" strokeWidth={1.8} />
      </View>
      <View style={styles.infoRowContent}>
        <Text style={styles.infoRowLabel}>{label}</Text>
        <Text style={styles.infoRowValue}>{value}</Text>
      </View>
    </View>
  );
}

function ScheduleCard({
  schedule,
  projectName,
  onConfirm,
  isBusy,
}: {
  schedule: ProjectScheduleDto;
  projectName?: string;
  onConfirm?: () => void;
  isBusy: boolean;
}): React.JSX.Element {
  const isPending = isSchedulePendingConfirmation(schedule.status);
  const displayProjectName = schedule.projectName ?? projectName ?? "—";
  const displayProjectCode = schedule.projectCode;
  const subtitle =
    displayProjectCode && displayProjectName !== "—"
      ? `${displayProjectCode} · ${displayProjectName}`
      : displayProjectName !== "—"
        ? displayProjectName
        : null;

  return (
    <View style={[styles.scheduleCardWrap, isPending && styles.scheduleCardWrapPending]}>
      <View style={[styles.scheduleCardInner, isPending && styles.scheduleCardInnerPending]}>
        <View style={[styles.cardBanner, isPending && styles.cardBannerPending]}>
          <View style={styles.cardBannerTop}>
            <View style={styles.cardBannerLeft}>
              <View style={styles.typeIconWrap}>
                <AppIcon definition={truckIconDefinition} size={18} color="#8A6D3B" strokeWidth={1.8} />
              </View>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{formatScheduleTypeLabel(schedule.scheduleType)}</Text>
              </View>
            </View>
            <View style={[styles.statusPill, !isPending && styles.statusPillConfirmed]}>
              <View style={[styles.statusDot, !isPending && styles.statusDotConfirmed]} />
              <Text style={[styles.statusPillText, !isPending && styles.statusPillConfirmedText]}>
                {formatScheduleStatusLabel(schedule.status)}
              </Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>
            {schedule.title ?? `${formatScheduleTypeLabel(schedule.scheduleType)} schedule`}
          </Text>
          {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
        </View>

        <View style={styles.scheduleCardBody}>
          <View style={styles.timeSection}>
            <Text style={styles.timeSectionLabel}>Delivery window</Text>
            <View style={styles.timeGrid}>
              <TimeSlot label="Start" value={schedule.scheduledAt} />
              <View style={styles.timeGridDivider} />
              <TimeSlot label="End" value={schedule.endAt} />
            </View>
          </View>

          <View style={styles.infoPanel}>
            <InfoRow
              icon={mapPinIconDefinition}
              label="Location"
              value={schedule.location?.trim() ? schedule.location : "—"}
            />
            <InfoRow icon={calendarIconDefinition} label="Project" value={displayProjectName} isLast />
          </View>

          <View style={styles.detailsSection}>
            <View style={styles.detailsTitleRow}>
              <Text style={styles.detailsTitle}>Details</Text>
              <View style={styles.detailsLine} />
            </View>
            <View style={styles.noteBox}>
              {schedule.description ? (
                <Text style={styles.description}>{schedule.description}</Text>
              ) : (
                <Text style={styles.descriptionMuted}>No additional schedule details were provided.</Text>
              )}
            </View>
          </View>

          {onConfirm ? (
            <View style={styles.cardFooter}>
              <Text style={styles.confirmHint}>Review the details above, then confirm when you're ready.</Text>
              <Pressable
                style={[styles.confirmButton, isBusy && styles.confirmButtonDisabled]}
                disabled={isBusy}
                onPress={onConfirm}
              >
                <AppIcon definition={checkIconDefinition} size={14} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.confirmButtonText}>Confirm Schedule</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function ProjectSchedulesScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { projectId, projectName } = route.params;

  const schedulesQuery = useProjectSchedulesQuery(projectId);
  const confirmScheduleMutation = useConfirmProjectScheduleMutation(projectId);

  const schedules = schedulesQuery.data ?? [];
  const pendingSchedules = useMemo(() => getPendingConfirmationSchedules(schedules), [schedules]);
  const otherSchedules = useMemo(
    () => getUpcomingSchedules(schedules).filter((schedule) => !isSchedulePendingConfirmation(schedule.status)),
    [schedules],
  );
  const confirmedCount = useMemo(
    () => schedules.filter((schedule) => !isSchedulePendingConfirmation(schedule.status)).length,
    [schedules],
  );

  const handleConfirmSchedule = (schedule: ProjectScheduleDto) => {
    Alert.alert(
      "Confirm Schedule",
      `Confirm ${schedule.title ?? formatScheduleTypeLabel(schedule.scheduleType)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            confirmScheduleMutation.mutate(schedule.scheduleId, {
              onSuccess: () => Alert.alert("Schedule Confirmed", "Your delivery schedule has been confirmed."),
              onError: () => Alert.alert("Error", "Unable to confirm the schedule. Please try again."),
            });
          },
        },
      ],
    );
  };

  const hasSchedules = pendingSchedules.length > 0 || otherSchedules.length > 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroDecorPrimary} />
          <View style={styles.heroDecorSecondary} />
          <View style={styles.heroTopRow}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <AppIcon definition={arrowLeftIconDefinition} size={18} color="#FFFFFF" strokeWidth={1.8} />
            </Pressable>
            <View style={styles.heroIconWrap}>
              <AppIcon definition={truckIconDefinition} size={18} color="#C9A86A" strokeWidth={1.8} />
            </View>
          </View>
          <Text style={styles.heroEyebrow}>FURNISPACE</Text>
          <Text style={styles.heroTitle}>Delivery Schedule</Text>
          {projectName ? <Text style={styles.heroProject}>{projectName}</Text> : null}
        </View>

        {!schedulesQuery.isLoading && hasSchedules ? (
          <View style={styles.statsStrip}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, pendingSchedules.length > 0 && styles.statValueAccent]}>
                {pendingSchedules.length}
              </Text>
              <Text style={styles.statLabel}>PENDING</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{confirmedCount}</Text>
              <Text style={styles.statLabel}>CONFIRMED</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{schedules.length}</Text>
              <Text style={styles.statLabel}>TOTAL</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.content}>
          {schedulesQuery.isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#C9A86A" />
              <Text style={styles.loadingText}>Loading schedules...</Text>
            </View>
          ) : !hasSchedules ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <AppIcon definition={truckIconDefinition} size={24} color="#8A6D3B" strokeWidth={1.8} />
              </View>
              <Text style={styles.emptyTitle}>No schedules yet</Text>
              <Text style={styles.emptyText}>Delivery schedules will appear here when your team sets them up.</Text>
            </View>
          ) : (
            <>
              {pendingSchedules.length > 0 ? (
                <>
                  <SectionHeader title="NEEDS YOUR CONFIRMATION" count={pendingSchedules.length} accent />
                  {pendingSchedules.map((schedule) => (
                    <ScheduleCard
                      key={schedule.scheduleId}
                      schedule={schedule}
                      projectName={projectName}
                      isBusy={confirmScheduleMutation.isPending}
                      onConfirm={() => handleConfirmSchedule(schedule)}
                    />
                  ))}
                </>
              ) : null}

              {otherSchedules.length > 0 ? (
                <>
                  <SectionHeader title="OTHER SCHEDULES" count={otherSchedules.length} />
                  {otherSchedules.map((schedule) => (
                    <ScheduleCard key={schedule.scheduleId} schedule={schedule} projectName={projectName} isBusy={false} />
                  ))}
                </>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
