import React, { useCallback, useState } from "react";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { AppIcon } from "../../../shared/components/AppIcon";
import type { IconDefinition } from "../../../icons/types";
import { mapPinIconDefinition } from "../../../icons/common/definitions";
import { rulerIconDefinition } from "../../../icons/design/definitions";
import { arrowLeftIconDefinition, chevronRightIconDefinition } from "../../../icons/navigation/definitions";
import { calendarIconDefinition, clipboardIconDefinition, projectIconDefinition } from "../../../icons/project/definitions";
import { getProjectStatusLabel } from "../../project/utils/project.mapper";
import { formatSaleDate, getSaleProjectStatusColors } from "../../sale/utils/sale.mapper";
import { DesignerFrame } from "../components/DesignerShared";
import {
  formatDesignerDateRangeLabel,
  useDesignerAssignedProjectsKpiQuery,
  useDesignerConfirmedMeasurementsQuery,
  useDesignerProposalConsultingQuery,
  useDesignerRevisionRequestedQuery,
} from "../hooks/useDesignerDashboard";
import type {
  DesignerAssignedProjectItemDto,
  DesignerConfirmedMeasurementItemDto,
  DesignerDateRange,
  DesignerRevisionRequestedItemDto,
} from "../models/designer.model";
import { DESIGNER, designerStyles as s } from "../styles/designer.styles";
import { dashboardStyles as d } from "../styles/designer.dashboard.styles";
import { detailStyles as detail } from "../styles/designer.detail.styles";

const PAGE_SIZE = 5;

type DesignerKpiKind = RootStackParamList["DesignerKpiList"]["kind"];
type DesignerKpiListProps = NativeStackScreenProps<RootStackParamList, "DesignerKpiList">;

const KIND_THEME: Record<
  DesignerKpiKind,
  { title: string; emptyTitle: string; emptyText: string; accent: string; icon: IconDefinition; pill: string }
> = {
  "confirmed-measurements": {
    title: "Confirmed measurements",
    emptyTitle: "No visits this window",
    emptyText: "Confirmed measurement schedules will show up here.",
    accent: "#B45309",
    icon: rulerIconDefinition,
    pill: "MEASUREMENTS",
  },
  "proposal-consulting": {
    title: "Proposal consulting",
    emptyTitle: "No consulting work",
    emptyText: "Projects in proposal consulting will land in this list.",
    accent: "#2F5D50",
    icon: clipboardIconDefinition,
    pill: "CONSULTING",
  },
  "revision-requested": {
    title: "Revision requests",
    emptyTitle: "Queue is clear",
    emptyText: "Customer revision requests for your proposals appear here.",
    accent: "#C9A86A",
    icon: calendarIconDefinition,
    pill: "REVISIONS",
  },
  "assigned-projects": {
    title: "Assigned projects",
    emptyTitle: "Nothing assigned",
    emptyText: "Projects currently assigned to you will show as stock here.",
    accent: "#2F5D50",
    icon: projectIconDefinition,
    pill: "ASSIGNED",
  },
};

function subtitleForKind(kind: DesignerKpiKind, dateRange?: DesignerDateRange): string {
  if (kind === "assigned-projects") {
    return "Stock · not filtered by week";
  }
  return dateRange ? formatDesignerDateRangeLabel(dateRange) : "Current window";
}

export function DesignerKpiListScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<DesignerKpiListProps["route"]>();
  const insets = useSafeAreaInsets();
  const { kind, dateRange } = route.params;
  const [page, setPage] = useState(1);
  const theme = KIND_THEME[kind];
  const subtitle = subtitleForKind(kind, dateRange);
  const listQuery = {
    scope: "mine" as const,
    ...(kind === "assigned-projects" ? {} : dateRange ? { dateRange } : {}),
    page,
    limit: PAGE_SIZE,
  };

  const measurementsQuery = useDesignerConfirmedMeasurementsQuery(listQuery, kind === "confirmed-measurements");
  const consultingQuery = useDesignerProposalConsultingQuery(listQuery, kind === "proposal-consulting");
  const revisionQuery = useDesignerRevisionRequestedQuery(listQuery, kind === "revision-requested");
  const assignedQuery = useDesignerAssignedProjectsKpiQuery(listQuery, kind === "assigned-projects");

  const activeQuery =
    kind === "confirmed-measurements"
      ? measurementsQuery
      : kind === "proposal-consulting"
        ? consultingQuery
        : kind === "revision-requested"
          ? revisionQuery
          : assignedQuery;

  const total = activeQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  useFocusEffect(
    useCallback(() => {
      void activeQuery.refetch();
    }, [activeQuery.refetch]),
  );

  const openProject = useCallback(
    (projectId: string, tab: "Overview" | "Measurement" = "Overview") => {
      navigation.navigate("DesignerProjectDetail", { projectId, tab });
    },
    [navigation],
  );

  const noun = total === 1 ? "item" : "items";

  return (
    <DesignerFrame>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={activeQuery.isRefetching}
            onRefresh={() => void activeQuery.refetch()}
            tintColor={DESIGNER.accent}
          />
        }
      >
        <View style={[d.hero, { paddingTop: Math.max(insets.top, 18) + 8 }]}>
          <View style={d.heroDecorLarge} />
          <View style={d.heroDecorMedium} />
          <View style={d.heroDecorSmall} />

          <View style={detail.topRow}>
            <Pressable style={detail.backButton} onPress={() => navigation.goBack()}>
              <AppIcon definition={arrowLeftIconDefinition} size={15} color={DESIGNER.white} />
            </Pressable>
            <View style={detail.titleWrap}>
              <Text style={d.brandMark}>FurniSpace · Designer</Text>
              <Text style={[d.heroTitle, { fontSize: 24, lineHeight: 30 }]} numberOfLines={2}>
                {theme.title}
              </Text>
              <Text style={d.heroSubtitle}>{subtitle}</Text>
            </View>
            <View style={[d.heroAvatar, { backgroundColor: theme.accent }]}>
              <AppIcon definition={theme.icon} size={15} color={DESIGNER.white} />
            </View>
          </View>

          <View style={d.heroDividerRow}>
            <View style={d.heroLine} />
            <View style={d.heroPill}>
              <View style={[d.heroPillDot, { backgroundColor: theme.accent === "#C9A86A" ? DESIGNER.gold : theme.accent }]} />
              <Text style={d.heroPillText}>
                {theme.pill} · {total} {noun}
              </Text>
            </View>
            <View style={d.heroLine} />
          </View>
        </View>

        <View style={d.kpiBody}>
          <Text style={d.projectsSummary}>
            {activeQuery.isLoading
              ? "Loading…"
              : `${total} ${noun} · page ${Math.min(page, totalPages)}/${totalPages}`}
          </Text>

          {activeQuery.isLoading ? (
            <ActivityIndicator color={DESIGNER.accent} />
          ) : activeQuery.isError ? (
            <View style={d.emptyState}>
              <Text style={d.emptyTitle}>Unable to load</Text>
              <Text style={d.emptyText}>{getErrorMessage(activeQuery.error, "Unable to load this list.")}</Text>
            </View>
          ) : total === 0 ? (
            <View style={d.emptyState}>
              <Text style={d.emptyTitle}>{theme.emptyTitle}</Text>
              <Text style={d.emptyText}>{theme.emptyText}</Text>
            </View>
          ) : kind === "confirmed-measurements" ? (
            (measurementsQuery.data?.items ?? []).map((item) => (
              <MeasurementCard
                key={item.scheduleId}
                item={item}
                accent={theme.accent}
                onOpen={() => openProject(item.projectId, "Measurement")}
              />
            ))
          ) : kind === "proposal-consulting" ? (
            (consultingQuery.data?.items ?? []).map((item) => (
              <ProjectKpiCard
                key={item.projectId}
                code={item.projectCode}
                name={item.projectName}
                meta={item.customerName ?? "Customer"}
                status={item.status}
                footer={formatSaleDate(item.updatedAt ?? item.submittedAt)}
                accent={theme.accent}
                onOpen={() => openProject(item.projectId)}
              />
            ))
          ) : kind === "revision-requested" ? (
            (revisionQuery.data?.items ?? []).map((item) => (
              <RevisionCard key={item.proposalId} item={item} accent={theme.accent} onOpen={() => openProject(item.projectId)} />
            ))
          ) : (
            (assignedQuery.data?.items ?? []).map((item) => (
              <AssignedProjectCard key={item.projectId} item={item} onOpen={() => openProject(item.projectId)} />
            ))
          )}

          {total > 0 ? (
            <View style={s.paginationRow}>
              <Pressable
                style={[s.paginationButton, !canPrev && s.paginationButtonDisabled]}
                disabled={!canPrev || activeQuery.isFetching}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
              >
                <Text style={[s.paginationButtonText, !canPrev && s.paginationButtonTextDisabled]}>Previous</Text>
              </Pressable>
              <Text style={s.paginationMeta}>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </Text>
              <Pressable
                style={[s.paginationButton, !canNext && s.paginationButtonDisabled]}
                disabled={!canNext || activeQuery.isFetching}
                onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                <Text style={[s.paginationButtonText, !canNext && s.paginationButtonTextDisabled]}>Next</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </DesignerFrame>
  );
}

function MeasurementCard({
  item,
  accent,
  onOpen,
}: {
  item: DesignerConfirmedMeasurementItemDto;
  accent: string;
  onOpen: () => void;
}): React.JSX.Element {
  return (
    <Pressable style={d.projectCard} onPress={onOpen}>
      <View style={[d.projectAccent, { backgroundColor: accent }]} />
      <View style={d.projectTop}>
        <View style={d.projectCopy}>
          <Text style={d.projectCode}>{item.projectCode}</Text>
          <Text style={d.projectName} numberOfLines={2}>
            {item.title || item.projectName}
          </Text>
          {item.location ? (
            <View style={d.kpiMetaRow}>
              <View style={d.kpiMetaIcon}>
                <AppIcon definition={mapPinIconDefinition} size={10} color={DESIGNER.accent} />
              </View>
              <Text style={d.kpiMetaText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          ) : (
            <Text style={d.projectType}>{item.projectName}</Text>
          )}
        </View>
        <View style={d.projectChevron}>
          <AppIcon definition={chevronRightIconDefinition} size={14} color={DESIGNER.muted} />
        </View>
      </View>
      <View style={d.projectFooter}>
        <Text style={d.kpiMetaText} numberOfLines={1}>
          {item.assignedStaffName || "Assigned to you"}
        </Text>
        <Text style={d.projectTarget}>{formatSaleDate(item.scheduledStart)}</Text>
      </View>
    </Pressable>
  );
}

function ProjectKpiCard({
  code,
  name,
  meta,
  status,
  footer,
  accent,
  onOpen,
}: {
  code: string;
  name: string;
  meta: string;
  status?: string | null;
  footer: string;
  accent: string;
  onOpen: () => void;
}): React.JSX.Element {
  const tone = getSaleProjectStatusColors(status ?? "");
  return (
    <Pressable style={d.projectCard} onPress={onOpen}>
      <View style={[d.projectAccent, { backgroundColor: accent }]} />
      <View style={d.projectTop}>
        <View style={d.projectCopy}>
          <Text style={d.projectCode}>{code}</Text>
          <Text style={d.projectName} numberOfLines={2}>
            {name}
          </Text>
          <Text style={d.projectType} numberOfLines={1}>
            {meta}
          </Text>
        </View>
        <View style={d.projectChevron}>
          <AppIcon definition={chevronRightIconDefinition} size={14} color={DESIGNER.muted} />
        </View>
      </View>
      <View style={d.projectFooter}>
        {status ? (
          <View style={[d.statusPill, { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor }]}>
            <Text style={[d.statusPillText, { color: tone.color }]}>{getProjectStatusLabel(status)}</Text>
          </View>
        ) : (
          <View />
        )}
        <Text style={d.projectTarget}>{footer}</Text>
      </View>
    </Pressable>
  );
}

function RevisionCard({
  item,
  accent,
  onOpen,
}: {
  item: DesignerRevisionRequestedItemDto;
  accent: string;
  onOpen: () => void;
}): React.JSX.Element {
  return (
    <Pressable style={d.projectCard} onPress={onOpen}>
      <View style={[d.projectAccent, { backgroundColor: accent }]} />
      <View style={d.projectTop}>
        <View style={d.projectCopy}>
          <Text style={d.projectCode}>{item.projectCode}</Text>
          <Text style={d.projectName} numberOfLines={2}>
            {item.proposalName || item.projectName}
          </Text>
          <Text style={d.projectType} numberOfLines={1}>
            {item.projectName}
          </Text>
        </View>
        <View style={d.projectChevron}>
          <AppIcon definition={chevronRightIconDefinition} size={14} color={DESIGNER.muted} />
        </View>
      </View>
      {item.revisionNote ? (
        <View style={d.kpiNote}>
          <Text style={d.kpiNoteText} numberOfLines={3}>
            {item.revisionNote}
          </Text>
        </View>
      ) : null}
      <View style={d.projectFooter}>
        <Text style={d.kpiMetaText}>Revision requested</Text>
        <Text style={d.projectTarget}>{formatSaleDate(item.revisionRequestedAt)}</Text>
      </View>
    </Pressable>
  );
}

function AssignedProjectCard({
  item,
  onOpen,
}: {
  item: DesignerAssignedProjectItemDto;
  onOpen: () => void;
}): React.JSX.Element {
  const tone = getSaleProjectStatusColors(item.status ?? "");
  const hasCustomization = Boolean(item.hasCustomerCustomizationRequest);
  const openCount = item.openCustomizationRequestCount ?? 0;
  const customizationLabel = hasCustomization
    ? openCount > 0
      ? `Yes · ${openCount} open`
      : item.latestCustomizationStatus
        ? `Yes · ${formatStatus(item.latestCustomizationStatus)}`
        : "Yes"
    : "No";

  return (
    <Pressable style={d.projectCard} onPress={onOpen}>
      <View style={[d.projectAccent, { backgroundColor: tone.color }]} />
      <View style={d.projectTop}>
        <View style={d.projectCopy}>
          <Text style={d.projectCode}>{item.projectCode}</Text>
          <Text style={d.projectName} numberOfLines={2}>
            {item.projectName}
          </Text>
          <Text style={d.projectType} numberOfLines={1}>
            {item.customerName || "Customer"}
          </Text>
        </View>
        <View style={d.projectChevron}>
          <AppIcon definition={chevronRightIconDefinition} size={14} color={DESIGNER.muted} />
        </View>
      </View>
      <View style={d.projectFooter}>
        <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
          {item.status ? (
            <View
              style={[
                d.statusPill,
                { alignSelf: "flex-start", backgroundColor: tone.backgroundColor, borderColor: tone.borderColor },
              ]}
            >
              <Text style={[d.statusPillText, { color: tone.color }]}>{getProjectStatusLabel(item.status)}</Text>
            </View>
          ) : null}
          <View style={[d.kpiFlag, hasCustomization ? d.kpiFlagYes : d.kpiFlagNo, { alignSelf: "flex-start" }]}>
            <Text style={[d.kpiFlagText, hasCustomization ? d.kpiFlagTextYes : d.kpiFlagTextNo]}>
              Customization {customizationLabel}
            </Text>
          </View>
        </View>
        <Text style={d.projectTarget}>{formatSaleDate(item.updatedAt ?? item.designerAssignedAt)}</Text>
      </View>
    </Pressable>
  );
}

function formatStatus(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
