import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { logoutIconDefinition, lockIconDefinition } from "../../../icons/auth/definitions";
import { bellIconDefinition, chatIconDefinition } from "../../../icons/communication/definitions";
import {
  chevronDownIconDefinition,
  chevronRightIconDefinition,
  searchIconDefinition,
} from "../../../icons/navigation/definitions";
import { calendarIconDefinition, clipboardIconDefinition, projectIconDefinition } from "../../../icons/project/definitions";
import { rulerIconDefinition } from "../../../icons/design/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import type { IconDefinition } from "../../../icons/types";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { useLogoutAction } from "../../auth/hooks/useAuthActions";
import { useAuthStore } from "../../auth/store/auth.store";
import { useChatSearchQuery, useProjectChatsQuery } from "../../communication/hooks/useProjectChats";
import { formatChatTime } from "../../communication/utils/chat.mapper";
import { useNotificationBadgeLabel } from "../../notification/hooks/useNotifications";
import { getProjectStatusLabel } from "../../project/utils/project.mapper";
import { formatSaleDate, getInitials, getSaleProjectStatusColors } from "../../sale/utils/sale.mapper";
import {
  DesignerProjectListFilter,
  formatDesignerDateRangeLabel,
  mapDesignerKpisToMetrics,
  resolveDesignerKpiCounts,
  useDesignerAssignedProjectsKpiQuery,
  useDesignerAssignedProjectsQuery,
  useDesignerKpisQuery,
} from "../hooks/useDesignerDashboard";
import type { DesignerAssignedProjectItemDto, DesignerDateRange, DesignerMetricKey } from "../models/designer.model";
import {
  DesignerBottomNav,
  DesignerFrame,
  DesignerHeader,
  FilterChips,
  SectionTitle,
} from "../components/DesignerShared";
import { DESIGNER, designerStyles as s } from "../styles/designer.styles";
import { dashboardStyles as d } from "../styles/designer.dashboard.styles";

function formatDashboardSubtitle(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getGreetingLabel(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
}

const KPI_ICONS: Record<DesignerMetricKey, IconDefinition> = {
  confirmedMeasurements: rulerIconDefinition,
  proposalConsulting: clipboardIconDefinition,
  revisionRequests: calendarIconDefinition,
  assignedProjects: projectIconDefinition,
};

const DATE_RANGE_OPTIONS: Array<{ value: DesignerDateRange; label: string }> = [
  { value: "today", label: "Today" },
  { value: "thisWeek", label: "This week" },
  { value: "thisMonth", label: "This month" },
];

const LATEST_PROJECTS_LIMIT = 3;

function latestProjectTimestamp(item: DesignerAssignedProjectItemDto): number {
  const raw = item.updatedAt ?? item.designerAssignedAt;
  const value = raw ? Date.parse(raw) : Number.NaN;
  return Number.isFinite(value) ? value : 0;
}

export function DesignerDashboardScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((state) => state.user);
  const alertsBadge = useNotificationBadgeLabel();
  const [dateRange, setDateRange] = useState<DesignerDateRange>("thisWeek");

  const kpisQuery = useDesignerKpisQuery({ scope: "mine", dateRange });
  const latestProjectsQuery = useDesignerAssignedProjectsKpiQuery({
    scope: "mine",
    page: 1,
    limit: 20,
  });

  const metrics = useMemo(
    () => (kpisQuery.data ? mapDesignerKpisToMetrics(kpisQuery.data, dateRange) : []),
    [dateRange, kpisQuery.data],
  );
  const kpiCounts = kpisQuery.data ? resolveDesignerKpiCounts(kpisQuery.data) : null;
  const latestProjects = useMemo(() => {
    return [...(latestProjectsQuery.data?.items ?? [])]
      .sort((left, right) => latestProjectTimestamp(right) - latestProjectTimestamp(left))
      .slice(0, LATEST_PROJECTS_LIMIT);
  }, [latestProjectsQuery.data?.items]);
  const assignedTotal = latestProjectsQuery.data?.total ?? latestProjects.length;
  const refreshing = kpisQuery.isRefetching || latestProjectsQuery.isRefetching;
  const firstName = currentUser?.fullName?.trim().split(/\s+/)[0] || "Designer";
  const dateRangeChips = DATE_RANGE_OPTIONS.map((option) => option.label);
  const selectedDateChip =
    DATE_RANGE_OPTIONS.find((option) => option.value === dateRange)?.label ?? "This week";

  const refreshDashboard = useCallback(() => {
    void kpisQuery.refetch();
    void latestProjectsQuery.refetch();
  }, [kpisQuery.refetch, latestProjectsQuery.refetch]);

  useFocusEffect(
    useCallback(() => {
      refreshDashboard();
    }, [refreshDashboard]),
  );

  const openKpiCard = useCallback(
    (key: DesignerMetricKey) => {
      if (key === "confirmedMeasurements") {
        navigation.navigate("DesignerKpiList", { kind: "confirmed-measurements", dateRange });
        return;
      }
      if (key === "proposalConsulting") {
        navigation.navigate("DesignerKpiList", { kind: "proposal-consulting", dateRange });
        return;
      }
      if (key === "revisionRequests") {
        navigation.navigate("DesignerKpiList", { kind: "revision-requested", dateRange });
        return;
      }
      navigation.navigate("DesignerKpiList", { kind: "assigned-projects" });
    },
    [dateRange, navigation],
  );

  return (
    <DesignerFrame>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshDashboard}
            tintColor={DESIGNER.accent}
          />
        }
      >
        <View style={[d.hero, { paddingTop: Math.max(insets.top, 18) + 10 }]}>
          <View style={d.heroDecorLarge} />
          <View style={d.heroDecorMedium} />
          <View style={d.heroDecorSmall} />

          <View style={d.heroTopRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={d.brandMark}>FurniSpace · Designer</Text>
              <Text style={d.greetingLabel}>{getGreetingLabel()}</Text>
              <Text style={d.heroTitle}>{firstName}</Text>
              <Text style={d.heroSubtitle}>
                {formatDashboardSubtitle()} · Measurement, proposals, and Sales sync
              </Text>
            </View>
            <View style={d.heroActions}>
              <Pressable style={d.heroIconButton} onPress={() => navigation.navigate("DesignerNotifications")}>
                <AppIcon definition={bellIconDefinition} size={15} color={DESIGNER.white} />
                {alertsBadge ? (
                  <View style={d.badge}>
                    <Text style={d.badgeText}>{alertsBadge}</Text>
                  </View>
                ) : null}
              </Pressable>
              <View style={d.heroAvatar}>
                <Text style={d.heroAvatarText}>{getInitials(currentUser?.fullName)}</Text>
              </View>
            </View>
          </View>

          <View style={d.heroDividerRow}>
            <View style={d.heroLine} />
            <View style={d.heroPill}>
              <View style={d.heroPillDot} />
              <Text style={d.heroPillText}>DESIGN WORKSPACE</Text>
            </View>
            <View style={d.heroLine} />
          </View>
        </View>

        <View style={d.body}>
          <View style={d.section}>
            <View style={d.quickRow}>
              <Pressable
                style={[d.quickCard, d.quickCardPrimary]}
                onPress={() => navigation.navigate("DesignerProjects")}
              >
                <View style={[d.quickIconWrap, d.quickIconWrapPrimary]}>
                  <AppIcon definition={projectIconDefinition} size={12} color={DESIGNER.white} />
                </View>
                <Text style={[d.quickLabel, d.quickLabelPrimary]}>Projects</Text>
                <Text style={[d.quickMeta, d.quickMetaPrimary]}>
                  {kpiCounts
                    ? `${kpiCounts.assignedProjects} assigned · ${kpiCounts.proposalConsulting} consulting`
                    : "Open assigned work"}
                </Text>
              </Pressable>
              <Pressable style={d.quickCard} onPress={() => navigation.navigate("DesignerSchedules")}>
                <View style={d.quickIconWrap}>
                  <AppIcon definition={calendarIconDefinition} size={12} color={DESIGNER.accent} />
                </View>
                <Text style={d.quickLabel}>Schedules</Text>
                <Text style={d.quickMeta}>Visits & measurements</Text>
              </Pressable>
            </View>
          </View>

          <View style={d.section}>
            <View style={d.sectionHeader}>
              <Text style={d.sectionLabel}>Workspace</Text>
              <Text style={d.sectionAction}>{formatDesignerDateRangeLabel(dateRange)}</Text>
            </View>
            <View style={d.chipsWrap}>
              <FilterChips
                options={dateRangeChips}
                selected={selectedDateChip}
                onSelect={(value) => {
                  const matched = DATE_RANGE_OPTIONS.find((option) => option.label === value);
                  if (matched) {
                    setDateRange(matched.value);
                  }
                }}
              />
            </View>
            {kpisQuery.isLoading ? (
              <ActivityIndicator color={DESIGNER.accent} />
            ) : kpisQuery.isError ? (
              <View style={d.emptyState}>
                <Text style={d.emptyText}>{getErrorMessage(kpisQuery.error, "Unable to load KPIs.")}</Text>
              </View>
            ) : (
              <View style={d.metricGrid}>
                {metrics.map((metric) => (
                  <Pressable
                    key={metric.key}
                    accessibilityRole="button"
                    accessibilityLabel={`${metric.label}, ${metric.value}`}
                    style={({ pressed }) => [d.metricCard, pressed && d.metricCardPressed]}
                    onPress={() => openKpiCard(metric.key)}
                  >
                    <View style={[d.metricAccent, { backgroundColor: metric.color }]} />
                    <View style={d.metricIconRow}>
                      <View style={[d.metricIcon, { backgroundColor: `${metric.color}18` }]}>
                        <AppIcon definition={KPI_ICONS[metric.key]} size={13} color={metric.color} />
                      </View>
                    </View>
                    <Text style={[d.metricValue, { color: metric.color }]}>{metric.value}</Text>
                    <Text style={d.metricLabel}>{metric.label}</Text>
                    <Text style={d.metricHint}>{metric.hint}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={d.section}>
            <View style={d.sectionHeader}>
              <Text style={d.sectionLabel}>Latest projects</Text>
              <Pressable onPress={() => navigation.navigate("DesignerProjects")}>
                <Text style={d.sectionAction}>
                  {assignedTotal > 0 ? `See all · ${assignedTotal}` : "See all"}
                </Text>
              </Pressable>
            </View>
            {latestProjectsQuery.isLoading ? (
              <ActivityIndicator color={DESIGNER.accent} style={{ marginTop: 12 }} />
            ) : latestProjectsQuery.isError ? (
              <View style={d.emptyState}>
                <Text style={d.emptyTitle}>Unable to load</Text>
                <Text style={d.emptyText}>
                  {getErrorMessage(latestProjectsQuery.error, "Unable to load latest projects.")}
                </Text>
              </View>
            ) : latestProjects.length === 0 ? (
              <View style={d.emptyState}>
                <Text style={d.emptyTitle}>No assigned projects</Text>
                <Text style={d.emptyText}>Projects assigned to you will show up here.</Text>
              </View>
            ) : (
              <View style={d.queueList}>
                {latestProjects.map((item) => (
                  <LatestProjectCard
                    key={item.projectId}
                    item={item}
                    onOpen={() =>
                      navigation.navigate("DesignerProjectDetail", {
                        projectId: item.projectId,
                        tab: "Overview",
                      })
                    }
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      <DesignerBottomNav active="dashboard" />
    </DesignerFrame>
  );
}

function LatestProjectCard({
  item,
  onOpen,
}: {
  item: DesignerAssignedProjectItemDto;
  onOpen: () => void;
}): React.JSX.Element {
  const tone = getSaleProjectStatusColors(item.status ?? "");
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
        {item.status ? (
          <View style={[d.statusPill, { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor }]}>
            <Text style={[d.statusPillText, { color: tone.color }]}>{getProjectStatusLabel(item.status)}</Text>
          </View>
        ) : (
          <View />
        )}
        <Text style={d.projectTarget}>{formatSaleDate(item.updatedAt ?? item.designerAssignedAt)}</Text>
      </View>
    </Pressable>
  );
}

export function DesignerProjectsScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<DesignerProjectListFilter>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const projectsQuery = useDesignerAssignedProjectsQuery({
    filter,
    search,
    page,
    limit: pageSize,
  });
  const items = projectsQuery.data?.items ?? [];
  const total = projectsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const filterChips: Array<{ value: DesignerProjectListFilter; label: string }> = [
    { value: "All", label: "All" },
    { value: "Active", label: "Active" },
    { value: "Measurement", label: "Measurement" },
    { value: "Proposal", label: "Proposal" },
  ];

  return (
    <DesignerFrame>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={projectsQuery.isRefetching}
            onRefresh={() => void projectsQuery.refetch()}
            tintColor={DESIGNER.accent}
          />
        }
      >
        <View style={[d.hero, { paddingTop: Math.max(insets.top, 18) + 10, paddingBottom: 18 }]}>
          <View style={d.heroDecorLarge} />
          <View style={d.heroDecorMedium} />
          <View style={d.heroDecorSmall} />

          <View style={d.heroTopRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={d.brandMark}>FurniSpace · Designer</Text>
              <Text style={d.heroTitle}>Projects</Text>
              <Text style={d.heroSubtitle}>Assigned spaces ready for measurement and proposals</Text>
            </View>
            <View style={d.heroAvatar}>
              <AppIcon definition={projectIconDefinition} size={15} color={DESIGNER.white} />
            </View>
          </View>

          <View style={d.projectsSearch}>
            <AppIcon definition={searchIconDefinition} size={15} color="rgba(255,255,255,.55)" />
            <TextInput
              value={search}
              onChangeText={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search projects…"
              placeholderTextColor="rgba(255,255,255,.4)"
              style={d.projectsSearchInput}
            />
          </View>
        </View>

        <View style={d.projectsChipsWrap}>
          <FilterChips
            options={filterChips.map((item) => item.label)}
            selected={filterChips.find((item) => item.value === filter)?.label ?? "All"}
            onSelect={(label) => {
              const matched = filterChips.find((item) => item.label === label)?.value ?? "All";
              setFilter(matched);
              setPage(1);
            }}
          />
        </View>

        <View style={d.projectsBody}>
          <Text style={d.projectsSummary}>
            {projectsQuery.isLoading
              ? "Loading assigned projects…"
              : `${total} project${total === 1 ? "" : "s"} · ${filterChips.find((item) => item.value === filter)?.label ?? "All"}`}
          </Text>

          {projectsQuery.isLoading ? (
            <ActivityIndicator color={DESIGNER.accent} />
          ) : projectsQuery.isError ? (
            <View style={d.emptyState}>
              <Text style={d.emptyText}>{getErrorMessage(projectsQuery.error, "Unable to load projects.")}</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={d.emptyState}>
              <Text style={d.emptyTitle}>No projects here</Text>
              <Text style={d.emptyText}>
                {search.trim()
                  ? `Nothing matches “${search.trim()}”.`
                  : "No assigned projects in this filter yet."}
              </Text>
            </View>
          ) : (
            items.map((item) => {
              const tone = getSaleProjectStatusColors(item.statusCode);
              return (
                <Pressable
                  key={item.projectId}
                  style={d.projectCard}
                  onPress={() =>
                    navigation.navigate("DesignerProjectDetail", {
                      projectId: item.projectId,
                      tab: "Overview",
                    })
                  }
                >
                  <View style={[d.projectAccent, { backgroundColor: tone.color }]} />
                  <View style={d.projectTop}>
                    <View style={d.projectCopy}>
                      <Text style={d.projectCode}>{item.projectCode}</Text>
                      <Text style={d.projectName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={d.projectType} numberOfLines={1}>
                        {item.type !== "—" ? item.type : "Project"} · {item.customer}
                      </Text>
                    </View>
                    <View style={d.projectChevron}>
                      <AppIcon definition={chevronRightIconDefinition} size={14} color={DESIGNER.muted} />
                    </View>
                  </View>
                  <View style={d.projectFooter}>
                    <View
                      style={[
                        d.statusPill,
                        { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor },
                      ]}
                    >
                      <Text style={[d.statusPillText, { color: tone.color }]}>{item.status}</Text>
                    </View>
                    {item.target ? (
                      <Text style={d.projectTarget} numberOfLines={1}>
                        Target {item.target}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })
          )}

          {totalPages > 1 ? (
            <View style={s.paginationRow}>
              <Pressable
                disabled={page <= 1}
                style={[s.paginationButton, page <= 1 && s.paginationButtonDisabled]}
                onPress={() => setPage((value) => Math.max(1, value - 1))}
              >
                <Text style={[s.paginationButtonText, page <= 1 && s.paginationButtonTextDisabled]}>Previous</Text>
              </Pressable>
              <Text style={s.paginationMeta}>
                {page}/{totalPages}
              </Text>
              <Pressable
                disabled={page >= totalPages}
                style={[s.paginationButton, page >= totalPages && s.paginationButtonDisabled]}
                onPress={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                <Text style={[s.paginationButtonText, page >= totalPages && s.paginationButtonTextDisabled]}>Next</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <DesignerBottomNav active="projects" />
    </DesignerFrame>
  );
}

export function DesignerMessagesScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectOpen, setProjectOpen] = useState(false);

  const projectsQuery = useDesignerAssignedProjectsQuery({ filter: "All", page: 1, limit: 50 });
  const projects = projectsQuery.data?.items ?? [];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (selectedProjectId || projects.length === 0) {
      return;
    }
    setSelectedProjectId(projects[0].projectId);
  }, [projects, selectedProjectId]);

  const chatsQuery = useProjectChatsQuery(selectedProjectId);
  const searchQuery = useChatSearchQuery(selectedProjectId, debouncedQuery);
  const isSearching = debouncedQuery.length >= 2;
  const designerChat = useMemo(
    () => chatsQuery.data?.find((item) => item.chatType === "DESIGNER") ?? null,
    [chatsQuery.data],
  );
  const salesChat = useMemo(
    () => chatsQuery.data?.find((item) => item.chatType === "SALES") ?? null,
    [chatsQuery.data],
  );
  const visibleChats = useMemo(
    () => [designerChat, salesChat].filter(Boolean) as NonNullable<typeof designerChat>[],
    [designerChat, salesChat],
  );
  const selectedProject = projects.find((item) => item.projectId === selectedProjectId) ?? null;
  const projectMeta = selectedProject
    ? [
        selectedProject.projectCode,
        selectedProject.type && selectedProject.type !== "—" ? selectedProject.type : null,
        `${visibleChats.length} thread${visibleChats.length === 1 ? "" : "s"}`,
      ]
        .filter(Boolean)
        .join(" · ")
    : projectsQuery.isLoading
      ? "Loading projects…"
      : "No assigned projects";

  const openChat = (chat: NonNullable<typeof designerChat>) => {
    navigation.navigate("DesignerChat", {
      chatId: chat.chatId,
      projectId: chat.projectId,
      title: chat.title,
      staffName: chat.staffName,
      chatType: chat.chatType,
      status: chat.status,
    });
  };

  return (
    <DesignerFrame>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={projectsQuery.isRefetching || chatsQuery.isRefetching}
            onRefresh={() => {
              void projectsQuery.refetch();
              void chatsQuery.refetch();
              if (isSearching) {
                void searchQuery.refetch();
              }
            }}
            tintColor={DESIGNER.accent}
          />
        }
      >
        <View style={[d.hero, { paddingTop: Math.max(insets.top, 18) + 10, paddingBottom: 18 }]}>
          <View style={d.heroDecorLarge} />
          <View style={d.heroDecorMedium} />
          <View style={d.heroDecorSmall} />

          <View style={d.heroTopRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={d.brandMark}>FurniSpace · Designer</Text>
              <Text style={d.heroTitle}>Messages</Text>
              <Text style={d.heroSubtitle}>Designer and sales threads for assigned projects</Text>
            </View>
            <View style={d.heroAvatar}>
              <AppIcon definition={chatIconDefinition} size={15} color={DESIGNER.white} />
            </View>
          </View>

          <View style={d.projectsSearch}>
            <AppIcon definition={searchIconDefinition} size={15} color="rgba(255,255,255,.55)" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search in this project…"
              placeholderTextColor="rgba(255,255,255,.4)"
              style={d.projectsSearchInput}
            />
          </View>
        </View>

        <View style={d.messagesBody}>
          <View style={d.messagesPicker}>
            <Pressable
              style={[d.messagesPickerTrigger, projectOpen && d.messagesPickerTriggerOpen]}
              disabled={projects.length === 0}
              onPress={() => setProjectOpen((open) => !open)}
            >
              <View style={d.messagesPickerIcon}>
                <AppIcon definition={projectIconDefinition} size={15} color={DESIGNER.accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={d.messagesPickerLabel}>Project</Text>
                <Text style={d.messagesPickerValue} numberOfLines={1}>
                  {selectedProject?.name ?? (projectsQuery.isLoading ? "Loading…" : "Select project")}
                </Text>
                <Text style={d.messagesPickerMeta} numberOfLines={1}>
                  {projectMeta}
                </Text>
              </View>
              <View style={d.messagesPickerChevron}>
                <AppIcon definition={chevronDownIconDefinition} size={14} color={DESIGNER.muted} />
              </View>
            </Pressable>

            {projectOpen && projects.length > 0 ? (
              <ScrollView style={d.messagesPickerMenu} nestedScrollEnabled>
                {projects.map((item) => {
                  const selected = item.projectId === selectedProjectId;
                  return (
                    <Pressable
                      key={item.projectId}
                      style={[d.messagesPickerOption, selected && d.messagesPickerOptionSelected]}
                      onPress={() => {
                        setSelectedProjectId(item.projectId);
                        setProjectOpen(false);
                        setQuery("");
                      }}
                    >
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={d.messagesPickerOptionText} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={d.messagesPickerOptionMeta} numberOfLines={1}>
                          {item.projectCode}
                          {item.type && item.type !== "—" ? ` · ${item.type}` : ""}
                        </Text>
                      </View>
                      {selected ? <Text style={d.messagesPickerCheck}>✓</Text> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>

          <Text style={d.messagesSummary}>
            {isSearching
              ? `Search results for “${debouncedQuery}”`
              : projectsQuery.isLoading || chatsQuery.isLoading
                ? "Loading conversations…"
                : `${visibleChats.length} conversation${visibleChats.length === 1 ? "" : "s"}`}
          </Text>

          {projectsQuery.isLoading || chatsQuery.isLoading ? (
            <ActivityIndicator color={DESIGNER.accent} />
          ) : projectsQuery.isError ? (
            <View style={d.emptyState}>
              <Text style={d.emptyText}>{getErrorMessage(projectsQuery.error, "Unable to load projects.")}</Text>
            </View>
          ) : projects.length === 0 ? (
            <View style={d.emptyState}>
              <Text style={d.emptyTitle}>No projects yet</Text>
              <Text style={d.emptyText}>Assign a project to start Designer–Sales chats.</Text>
            </View>
          ) : isSearching ? (
            searchQuery.isLoading ? (
              <ActivityIndicator color={DESIGNER.accent} />
            ) : (searchQuery.data?.length ?? 0) === 0 ? (
              <View style={d.emptyState}>
                <Text style={d.emptyTitle}>No matches</Text>
                <Text style={d.emptyText}>Nothing matches “{debouncedQuery}”.</Text>
              </View>
            ) : (
              (searchQuery.data ?? []).map((item) => {
                const chat = chatsQuery.data?.find((entry) => entry.chatId === item.chatId);
                const isDesigner = chat?.chatType === "DESIGNER";
                return (
                  <Pressable
                    key={item.messageId}
                    style={d.messageCard}
                    onPress={() => {
                      if (!chat) {
                        return;
                      }
                      openChat(chat);
                    }}
                  >
                    <View
                      style={[
                        d.messageAccent,
                        isDesigner ? d.messageAccentDesigner : d.messageAccentSales,
                      ]}
                    />
                    <View style={[d.messageAvatar, { backgroundColor: isDesigner ? DESIGNER.accent : DESIGNER.charcoal }]}>
                      <Text style={d.messageAvatarText}>{getInitials(item.senderName)}</Text>
                    </View>
                    <View style={d.messageBody}>
                      <View style={d.messageTop}>
                        <Text style={d.messageTitle} numberOfLines={1}>
                          {item.senderName}
                        </Text>
                        <Text style={d.messageTime}>{formatChatTime(item.createdAt)}</Text>
                      </View>
                      <Text style={d.messagePreview} numberOfLines={2}>
                        {item.content}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )
          ) : visibleChats.length === 0 ? (
            <View style={d.emptyState}>
              <Text style={d.emptyTitle}>No conversations</Text>
              <Text style={d.emptyText}>No Designer–Sales chat yet for this project.</Text>
            </View>
          ) : (
            visibleChats.map((item) => {
              const isDesigner = item.chatType === "DESIGNER";
              return (
                <Pressable key={item.chatId} style={d.messageCard} onPress={() => openChat(item)}>
                  <View
                    style={[d.messageAccent, isDesigner ? d.messageAccentDesigner : d.messageAccentSales]}
                  />
                  <View
                    style={[
                      d.messageAvatar,
                      { backgroundColor: isDesigner ? DESIGNER.accent : DESIGNER.charcoal },
                    ]}
                  >
                    <Text style={d.messageAvatarText}>{isDesigner ? "DS" : "SC"}</Text>
                  </View>
                  <View style={d.messageBody}>
                    <View style={d.messageTop}>
                      <Text style={d.messageTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={d.messageTime}>{item.timeLabel}</Text>
                    </View>
                    <Text style={d.messagePreview} numberOfLines={2}>
                      {item.preview}
                    </Text>
                    <View style={d.messageFooter}>
                      <View
                        style={[
                          d.messageTypePill,
                          isDesigner ? d.messageTypePillDesigner : d.messageTypePillSales,
                        ]}
                      >
                        <Text
                          style={[
                            d.messageTypeText,
                            isDesigner ? d.messageTypeTextDesigner : d.messageTypeTextSales,
                          ]}
                        >
                          {isDesigner ? "Designer" : "Sales"}
                        </Text>
                      </View>
                      <Text style={d.messageStatus}>{item.status}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
      <DesignerBottomNav active="messages" />
    </DesignerFrame>
  );
}

export function DesignerMoreScreen(): React.JSX.Element {
  const currentUser = useAuthStore((state) => state.user);
  const logout = useLogoutAction();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const kpisQuery = useDesignerKpisQuery({ scope: "mine", dateRange: "thisWeek" });
  const kpiCounts = kpisQuery.data ? resolveDesignerKpiCounts(kpisQuery.data) : null;
  const menu: { icon: IconDefinition; title: string; subtitle: string; action?: () => void }[] = [
    {
      icon: calendarIconDefinition,
      title: "Schedules",
      subtitle: "Assigned visits and measurement appointments",
      action: () => navigation.navigate("DesignerSchedules"),
    },
    {
      icon: bellIconDefinition,
      title: "Notifications",
      subtitle: "Design alerts and project updates",
      action: () => navigation.navigate("DesignerNotifications"),
    },
    {
      icon: lockIconDefinition,
      title: "Change Password",
      subtitle: "Update your account password",
      action: () => navigation.navigate("ChangePassword"),
    },
  ];

  return (
    <DesignerFrame>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.profileHero}>
          <DesignerHeader title="More & Settings" />
          <View style={s.profileRow}>
            <View style={[s.profileAvatar, { backgroundColor: DESIGNER.accent }]}>
              <Text style={[s.avatarText, { fontSize: 16 }]}>{getInitials(currentUser?.fullName)}</Text>
            </View>
            <View>
              <Text style={s.profileName}>{currentUser?.fullName ?? "Designer"}</Text>
              <Text style={s.profileRole}>Designer · FurniSpace</Text>
            </View>
          </View>
        </View>
        <View style={[s.content, s.contentGap, { paddingTop: 15 }]}>
          <View style={s.card}>
            <SectionTitle title="Account" />
            {menu.map((item) => (
              <Pressable key={item.title} style={s.settingRow} onPress={item.action}>
                <View style={s.settingIcon}>
                  <AppIcon definition={item.icon} size={15} color={DESIGNER.muted} />
                </View>
                <View style={s.settingCopy}>
                  <Text style={s.settingTitle}>{item.title}</Text>
                  <Text style={s.settingSubtitle}>{item.subtitle}</Text>
                </View>
                <AppIcon definition={chevronRightIconDefinition} size={15} color={DESIGNER.muted} />
              </Pressable>
            ))}
          </View>
          <View style={s.card}>
            <SectionTitle title="Design Workspace" />
            <View style={s.infoGrid}>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>Confirmed measures</Text>
                <Text style={s.infoValue}>{String(kpiCounts?.confirmedMeasurements ?? "—")}</Text>
              </View>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>Proposal consulting</Text>
                <Text style={s.infoValue}>{String(kpiCounts?.proposalConsulting ?? "—")}</Text>
              </View>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>Revision requests</Text>
                <Text style={s.infoValue}>{String(kpiCounts?.revisionRequests ?? "—")}</Text>
              </View>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>Assigned projects</Text>
                <Text style={s.infoValue}>{String(kpiCounts?.assignedProjects ?? "—")}</Text>
              </View>
            </View>
          </View>
          <Pressable
            style={s.signOut}
            disabled={logout.isPending}
            onPress={() =>
              logout.mutate(undefined, {
                onSettled: () => navigation.reset({ index: 0, routes: [{ name: "Login" }] }),
              })
            }
          >
            <View style={[s.settingIcon, { backgroundColor: "#FFE2E2" }]}>
              <AppIcon definition={logoutIconDefinition} size={15} color={DESIGNER.red} />
            </View>
            <View style={s.settingCopy}>
              <Text style={s.signOutTitle}>{logout.isPending ? "Signing Out…" : "Sign Out"}</Text>
              <Text style={s.settingSubtitle}>{currentUser?.email ?? "designer@furnispace.vn"}</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
      <DesignerBottomNav active="more" />
    </DesignerFrame>
  );
}
