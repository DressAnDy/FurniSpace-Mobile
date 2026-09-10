import React, { useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { userIconDefinition } from "../../../icons/auth/definitions";
import { mapPinIconDefinition } from "../../../icons/common/definitions";
import { clockIconDefinition } from "../../../icons/project/definitions";
import { checkIconDefinition } from "../../../icons/status/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import type { ProjectScheduleDto } from "../../project/models/project.tracking.model";
import { getScheduleStartAt } from "../../project/services/project.tracking.api";
import {
  formatScheduleStatusLabel,
  formatScheduleTypeLabel,
} from "../../project/utils/schedule.mapper";
import { DesignerBottomNav, DesignerFrame, FilterChips } from "../components/DesignerShared";
import {
  useDesignerMySchedulesQuery,
  useUpdateScheduleStatusMutation,
} from "../hooks/useDesignerDashboard";
import { DESIGNER, designerStyles as s } from "../styles/designer.styles";
import { scheduleStyles as styles } from "../styles/designer.schedules.styles";

const PAGE_SIZE = 5;

type ScheduleFilter = "Upcoming" | "Pending" | "Confirmed" | "Done" | "All";

const FILTERS: ScheduleFilter[] = ["Upcoming", "Pending", "Confirmed", "Done", "All"];

function statusForFilter(filter: ScheduleFilter): string | undefined {
  if (filter === "Pending") {
    return "PENDING_CONFIRMATION";
  }
  if (filter === "Confirmed") {
    return "CONFIRMED";
  }
  if (filter === "Done") {
    return "COMPLETED";
  }
  return undefined;
}

function getScheduleEndAt(schedule: ProjectScheduleDto): string {
  return schedule.scheduledEnd || schedule.endAt || "";
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimeRange(schedule: ProjectScheduleDto): string {
  const start = formatDateTime(getScheduleStartAt(schedule));
  const endRaw = getScheduleEndAt(schedule);
  if (!endRaw) {
    return start;
  }
  const endParsed = new Date(endRaw);
  if (Number.isNaN(endParsed.getTime())) {
    return start;
  }
  const endTime = endParsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${start} – ${endTime}`;
}

function statusTone(status: string): { color: string; bg: string } {
  const normalized = status.toUpperCase();
  if (normalized === "CANCELLED") {
    return { color: DESIGNER.red, bg: "rgba(251,44,54,0.1)" };
  }
  if (normalized === "PENDING_CONFIRMATION") {
    return { color: "#8B6B4A", bg: "rgba(139,107,74,0.14)" };
  }
  if (normalized === "COMPLETED") {
    return { color: DESIGNER.muted, bg: "rgba(122,111,104,0.12)" };
  }
  return { color: DESIGNER.accent, bg: "rgba(47,93,80,0.12)" };
}

function canCompleteSchedule(status: string): boolean {
  const normalized = status.toUpperCase();
  return normalized === "CONFIRMED" || normalized === "MEASUREMENT_CONFIRMED";
}

function ScheduleCard({
  schedule,
  completing,
  onComplete,
  onOpenProject,
}: {
  schedule: ProjectScheduleDto;
  completing: boolean;
  onComplete: () => void;
  onOpenProject: () => void;
}): React.JSX.Element {
  const tone = statusTone(schedule.status);
  const projectLine = [schedule.projectCode, schedule.projectName].filter(Boolean).join(" · ");

  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: tone.color }]} />
      <View style={styles.tagRow}>
        <View style={[styles.tag, { backgroundColor: "rgba(139,107,74,0.14)" }]}>
          <Text style={[styles.tagText, { color: "#8B6B4A" }]}>
            {formatScheduleTypeLabel(schedule.scheduleType)}
          </Text>
        </View>
        <View style={[styles.tag, { backgroundColor: tone.bg }]}>
          <Text style={[styles.tagText, { color: tone.color }]}>
            {formatScheduleStatusLabel(schedule.status)}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>
        {schedule.title || `${formatScheduleTypeLabel(schedule.scheduleType)} schedule`}
      </Text>
      {projectLine ? <Text style={styles.subtitle}>{projectLine}</Text> : null}

      <View style={styles.metaList}>
        <View style={styles.metaRow}>
          <View style={styles.metaIcon}>
            <AppIcon definition={clockIconDefinition} size={13} color={DESIGNER.accent} />
          </View>
          <View style={styles.metaCopy}>
            <Text style={styles.metaLabel}>When</Text>
            <Text style={styles.metaValue}>{formatTimeRange(schedule)}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaIcon}>
            <AppIcon definition={mapPinIconDefinition} size={13} color={DESIGNER.accent} />
          </View>
          <View style={styles.metaCopy}>
            <Text style={styles.metaLabel}>Location</Text>
            <Text style={styles.metaValue}>{schedule.location?.trim() || "—"}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaIcon}>
            <AppIcon definition={userIconDefinition} size={13} color={DESIGNER.accent} />
          </View>
          <View style={styles.metaCopy}>
            <Text style={styles.metaLabel}>Assignment</Text>
            <Text style={styles.metaValue}>Assigned to you</Text>
          </View>
        </View>
      </View>

      {schedule.description?.trim() ? (
        <View style={styles.detailsBox}>
          <Text style={styles.detailsText}>{schedule.description}</Text>
        </View>
      ) : null}

      <View style={styles.footerActions}>
        {canCompleteSchedule(schedule.status) ? (
          <Pressable
            style={[styles.primaryBtn, completing && styles.primaryBtnDisabled]}
            disabled={completing}
            onPress={onComplete}
          >
            <AppIcon definition={checkIconDefinition} size={14} color={DESIGNER.white} />
            <Text style={styles.primaryBtnText}>{completing ? "Completing…" : "Complete"}</Text>
          </Pressable>
        ) : null}
        {schedule.projectId ? (
          <Pressable style={styles.secondaryBtn} onPress={onOpenProject}>
            <Text style={styles.secondaryBtnText}>Open project</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function DesignerSchedulesScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<ScheduleFilter>("Upcoming");
  const [page, setPage] = useState(1);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const status = statusForFilter(filter);
  const schedulesQuery = useDesignerMySchedulesQuery({
    page,
    limit: PAGE_SIZE,
    ...(status ? { status } : {}),
  });
  const updateStatus = useUpdateScheduleStatusMutation(null);

  const items = schedulesQuery.data?.items ?? [];
  const total = schedulesQuery.data?.total ?? items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    // Upcoming: hide completed/cancelled on the current server page
    if (filter !== "Upcoming") {
      return items;
    }
    return items.filter((item) => {
      const normalized = item.status.toUpperCase();
      return normalized !== "COMPLETED" && normalized !== "CANCELLED";
    });
  }, [items, filter]);

  const handleComplete = (schedule: ProjectScheduleDto) => {
    Alert.alert(
      "Complete Schedule",
      `Mark "${schedule.title || formatScheduleTypeLabel(schedule.scheduleType)}" as completed?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: () => {
            setCompletingId(schedule.scheduleId);
            updateStatus.mutate(
              { scheduleId: schedule.scheduleId, payload: { status: "COMPLETED" } },
              {
                onSuccess: () => Alert.alert("Done", "Schedule marked as completed."),
                onError: (error) =>
                  Alert.alert("Error", getErrorMessage(error, "Unable to complete schedule.")),
                onSettled: () => setCompletingId(null),
              },
            );
          },
        },
      ],
    );
  };

  let bodyContent: React.ReactNode;
  if (schedulesQuery.isLoading && !schedulesQuery.data) {
    bodyContent = (
      <View style={styles.centerState}>
        <ActivityIndicator color={DESIGNER.accent} />
      </View>
    );
  } else if (schedulesQuery.isError) {
    bodyContent = (
      <View style={styles.centerState}>
        <Text style={styles.centerMuted}>
          {getErrorMessage(schedulesQuery.error, "Unable to load schedules.")}
        </Text>
      </View>
    );
  } else if (pageItems.length === 0) {
    bodyContent = (
      <View style={styles.centerState}>
        <Text style={styles.centerMuted}>
          {total === 0 ? "No schedules assigned yet." : `No ${filter.toLowerCase()} schedules.`}
        </Text>
      </View>
    );
  } else {
    bodyContent = pageItems.map((schedule) => (
      <ScheduleCard
        key={schedule.scheduleId}
        schedule={schedule}
        completing={completingId === schedule.scheduleId}
        onComplete={() => handleComplete(schedule)}
        onOpenProject={() =>
          navigation.navigate("DesignerProjectDetail", {
            projectId: schedule.projectId,
            tab: schedule.scheduleType === "MEASUREMENT" ? "Measurement" : "Overview",
          })
        }
      />
    ));
  }

  return (
    <DesignerFrame>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={schedulesQuery.isRefetching}
            onRefresh={() => void schedulesQuery.refetch()}
            tintColor={DESIGNER.accent}
          />
        }
      >
        <View style={[styles.hero, { paddingTop: Math.max(insets.top, 18) + 10 }]}>
          <View style={styles.heroDecor} />
          <Text style={styles.brandMark}>FurniSpace · Designer</Text>
          <Text style={styles.heroTitle}>Schedules</Text>
          <Text style={styles.heroSubtitle}>Your assigned visits and measurement appointments</Text>
        </View>

        <View style={styles.body}>
          <FilterChips
            options={FILTERS}
            selected={filter}
            onSelect={(value) => {
              setFilter(value as ScheduleFilter);
              setPage(1);
            }}
          />
          {!schedulesQuery.isLoading || schedulesQuery.data ? (
            <Text style={styles.summary}>
              {total} schedule{total === 1 ? "" : "s"}
              {filter !== "All" ? ` · ${filter}` : ""}
              {totalPages > 1 ? ` · page ${page}/${totalPages}` : ""}
            </Text>
          ) : null}
          {bodyContent}
          {totalPages > 1 ? (
            <View style={s.paginationRow}>
              <Pressable
                disabled={page <= 1}
                style={[s.paginationButton, page <= 1 && s.paginationButtonDisabled]}
                onPress={() => setPage((value) => Math.max(1, value - 1))}
              >
                <Text style={[s.paginationButtonText, page <= 1 && s.paginationButtonTextDisabled]}>
                  Previous
                </Text>
              </Pressable>
              <Text style={s.paginationMeta}>
                {page}/{totalPages}
              </Text>
              <Pressable
                disabled={page >= totalPages}
                style={[s.paginationButton, page >= totalPages && s.paginationButtonDisabled]}
                onPress={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                <Text
                  style={[s.paginationButtonText, page >= totalPages && s.paginationButtonTextDisabled]}
                >
                  Next
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <DesignerBottomNav active="schedules" />
    </DesignerFrame>
  );
}
