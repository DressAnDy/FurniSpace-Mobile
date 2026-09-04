import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { logoutIconDefinition, lockIconDefinition, shieldIconDefinition } from "../../../icons/auth/definitions";
import { bellIconDefinition } from "../../../icons/communication/definitions";
import { helpIconDefinition } from "../../../icons/common/definitions";
import { fileTextIconDefinition } from "../../../icons/file/definitions";
import { chevronDownIconDefinition, chevronRightIconDefinition, searchIconDefinition } from "../../../icons/navigation/definitions";
import { projectIconDefinition } from "../../../icons/project/definitions";
import { filterIconDefinition } from "../../../icons/action/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import type { IconDefinition } from "../../../icons/types";
import { AppError } from "../../../core/errors/AppError";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { mapAxiosError } from "../../../core/errors/errorMapper";
import { useLogoutAction } from "../../auth/hooks/useAuthActions";
import { useAuthStore } from "../../auth/store/auth.store";
import { useChatSearchQuery, useProjectChatsQuery } from "../../communication/hooks/useProjectChats";
import { formatChatTime } from "../../communication/utils/chat.mapper";
import {
  type SaleProjectListFilter,
  useClaimSalesAssignmentMutation,
  useSaleAssignedProjectsQuery,
  useSaleInboxProjectsQuery,
  useSalesActionQueueQuery,
  useSalesKpisQuery,
} from "../hooks/useSaleDashboard";
import type { SaleActionGroup, SalesActionQueueItemDto } from "../models/sale.model";
import {
  ACTION_GROUP_ORDER,
  getInitials,
  getPriorityColor,
  mapSalesKpisToMetrics,
} from "../utils/sale.mapper";
import { Avatar, FilterChips, SaleBottomNav, SaleFrame, SaleHeader, SectionTitle } from "../components/SaleShared";
import { useNotificationBadgeLabel } from "../../notification/hooks/useNotifications";
import { PROJECT_STATUS_FLOW_ORDER, getProjectStatusLabel } from "../../project/utils/project.mapper";
import { SALE, saleStyles as s } from "../styles/sale.styles";

const PROJECT_STATUS_FILTER_OPTIONS: Array<{ value: SaleProjectListFilter; label: string }> = [
  { value: "All", label: "All statuses" },
  { value: "Active", label: "Active" },
  { value: "Production", label: "Production" },
  { value: "Delivery", label: "Delivery" },
  ...PROJECT_STATUS_FLOW_ORDER.map((status) => ({
    value: status,
    label: getProjectStatusLabel(status),
  })),
];

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }): React.JSX.Element {
  return (
    <View style={s.search}>
      <AppIcon definition={searchIconDefinition} size={15} color="rgba(255,255,255,.55)" />
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="rgba(255,255,255,.4)" style={s.searchInput} />
    </View>
  );
}

function formatDashboardSubtitle(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function SaleDashboardScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentUser = useAuthStore((state) => state.user);
  const alertsBadge = useNotificationBadgeLabel();
  const [selectedGroup, setSelectedGroup] = useState<SaleActionGroup | "All">("All");
  const [queuePage, setQueuePage] = useState(1);
  const queuePageSize = 5;

  const kpisQuery = useSalesKpisQuery({ scope: "mine", dateRange: "thisWeek" });
  const queueQuery = useSalesActionQueueQuery({
    scope: "mine",
    dateRange: "thisWeek",
    ...(selectedGroup !== "All" ? { group: selectedGroup } : {}),
    page: queuePage,
    limit: queuePageSize,
  });

  const metrics = useMemo(
    () => (kpisQuery.data ? mapSalesKpisToMetrics(kpisQuery.data) : []),
    [kpisQuery.data],
  );
  const queueItems = queueQuery.data?.items ?? [];
  const countsByGroup = queueQuery.data?.countsByGroup ?? {};
  const totalActions = queueQuery.data?.total ?? 0;
  const allCount = useMemo(() => {
    const fromGroups = ACTION_GROUP_ORDER.reduce((sum, group) => sum + (countsByGroup[group] ?? 0), 0);
    return fromGroups > 0 ? fromGroups : totalActions;
  }, [countsByGroup, totalActions]);

  const groupChips = useMemo(() => {
    return [
      `All  ${allCount}`,
      ...ACTION_GROUP_ORDER.map((group) => {
        const count = countsByGroup[group] ?? 0;
        return `${group.split(" ")[0]}  ${count}`;
      }),
    ];
  }, [allCount, countsByGroup]);

  const selectedChip =
    selectedGroup === "All"
      ? groupChips[0]
      : groupChips.find((chip) => chip.startsWith(selectedGroup.split(" ")[0])) ?? groupChips[0];

  const totalPages = Math.max(1, Math.ceil(totalActions / queuePageSize));
  const canPrev = queuePage > 1;
  const canNext = queuePage < totalPages;
  const refreshing = kpisQuery.isRefetching || queueQuery.isRefetching;

  const handleGroupSelect = (value: string) => {
    const label = value.split("  ")[0];
    if (label === "All") {
      setSelectedGroup("All");
    } else {
      const matched = ACTION_GROUP_ORDER.find((group) => group.startsWith(label)) ?? "Intake";
      setSelectedGroup(matched);
    }
    setQueuePage(1);
  };

  return (
    <SaleFrame>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void kpisQuery.refetch();
              void queueQuery.refetch();
            }}
            tintColor={SALE.gold}
          />
        }
      >
        <SaleHeader
          title="Dashboard"
          subtitle={`${formatDashboardSubtitle()} · Live workspace`}
          trailing={
            <>
              <Pressable style={s.headerIcon} onPress={() => navigation.navigate("SaleNotifications")}>
                <AppIcon definition={bellIconDefinition} size={15} color={SALE.white} />
                {alertsBadge ? (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{alertsBadge}</Text>
                  </View>
                ) : null}
              </Pressable>
              <View style={s.avatarGold}>
                <Text style={s.avatarText}>{getInitials(currentUser?.fullName)}</Text>
              </View>
            </>
          }
        />

        <View style={s.dashboardBody}>
          <View style={s.dashboardSection}>
            <View style={s.quickActions}>
              <Pressable style={[s.quickAction, s.quickActionPrimary]} onPress={() => navigation.navigate("SaleRequests")}>
                <Text style={[s.quickActionLabel, s.quickActionLabelPrimary]}>Requests</Text>
                <Text style={[s.quickActionMeta, s.quickActionMetaPrimary]}>
                  {kpisQuery.data ? `${kpisQuery.data.newRequests} new` : "Open inbox"}
                </Text>
              </Pressable>
              <Pressable style={s.quickAction} onPress={() => navigation.navigate("SaleProjects")}>
                <Text style={s.quickActionLabel}>Projects</Text>
                <Text style={s.quickActionMeta}>
                  {kpisQuery.data ? `${kpisQuery.data.activeProjects} active` : "Assigned work"}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={s.dashboardSection}>
            <SectionTitle title="This week" />
            {kpisQuery.isLoading ? (
              <ActivityIndicator color={SALE.gold} />
            ) : kpisQuery.isError ? (
              <View style={s.emptyState}>
                <Text style={s.emptyStateText}>{getErrorMessage(kpisQuery.error, "Unable to load KPIs.")}</Text>
              </View>
            ) : (
              <View style={s.metricStrip}>
                {metrics.map((metric, index) => (
                  <View
                    key={metric.label}
                    style={[s.metricTile, index >= 3 ? s.metricTileWide : null]}
                  >
                    <Text style={[s.metricTileValue, { color: metric.color }]}>{metric.value}</Text>
                    <Text style={s.metricTileLabel}>{metric.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={s.dashboardSection}>
            <SectionTitle
              title="Action queue"
              action={totalActions > 0 ? `${totalActions} open` : undefined}
            />
            <View style={s.queueChipsWrap}>
              <FilterChips
                options={groupChips.length > 0 ? groupChips : ["All  0"]}
                selected={selectedChip}
                onSelect={handleGroupSelect}
              />
            </View>

            {queueQuery.isLoading ? (
              <ActivityIndicator color={SALE.gold} />
            ) : queueItems.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyStateText}>
                  {selectedGroup === "All"
                    ? "Nothing waiting in your queue right now."
                    : `Nothing waiting in ${selectedGroup.split(" ")[0].toLowerCase()} right now.`}
                </Text>
              </View>
            ) : (
              <>
                <View style={s.queueList}>
                  {queueItems.map((item) => (
                    <ActionQueueCard
                      key={item.id}
                      item={item}
                      onOpen={() =>
                        navigation.navigate("SaleProjectDetail", {
                          projectId: item.projectId,
                          tab: "Overview",
                        })
                      }
                    />
                  ))}
                </View>
                {totalActions > 0 ? (
                  <View style={s.paginationRow}>
                    <Pressable
                      style={[s.paginationButton, !canPrev && s.paginationButtonDisabled]}
                      disabled={!canPrev || queueQuery.isFetching}
                      onPress={() => setQueuePage((current) => Math.max(1, current - 1))}
                    >
                      <Text style={[s.paginationButtonText, !canPrev && s.paginationButtonTextDisabled]}>Previous</Text>
                    </Pressable>
                    <Text style={s.paginationMeta}>
                      {(queuePage - 1) * queuePageSize + 1}–{Math.min(queuePage * queuePageSize, totalActions)} of{" "}
                      {totalActions}
                    </Text>
                    <Pressable
                      style={[s.paginationButton, !canNext && s.paginationButtonDisabled]}
                      disabled={!canNext || queueQuery.isFetching}
                      onPress={() => setQueuePage((current) => Math.min(totalPages, current + 1))}
                    >
                      <Text style={[s.paginationButtonText, !canNext && s.paginationButtonTextDisabled]}>Next</Text>
                    </Pressable>
                  </View>
                ) : null}
              </>
            )}
          </View>
        </View>
      </ScrollView>
      <SaleBottomNav active="dashboard" />
    </SaleFrame>
  );
}

function ActionQueueCard({
  item,
  onOpen,
}: {
  item: SalesActionQueueItemDto;
  onOpen: () => void;
}): React.JSX.Element {
  const color = getPriorityColor(item.priority);
  return (
    <Pressable style={s.queueCard} onPress={onOpen}>
      <View style={s.queueCardTop}>
        <View style={s.queueCardCopy}>
          <Text style={s.cardTitle} numberOfLines={1}>
            {item.projectName}
          </Text>
          <Text style={s.cardMeta}>{item.projectCode}</Text>
        </View>
        <View style={[s.priorityBadge, { backgroundColor: color }]}>
          <Text style={s.priorityText}>{item.priority}</Text>
        </View>
      </View>
      <Text style={s.queueActionLabel}>Next action</Text>
      <Text style={s.queueActionText} numberOfLines={2}>
        {item.action}
      </Text>
      <View style={s.queueFooter}>
        <Text style={s.cardMeta} numberOfLines={1}>
          {item.customerName}
          {item.dueBucket ? ` · ${item.dueBucket}` : ""}
        </Text>
        <Text style={s.sectionAction}>Open</Text>
      </View>
    </Pressable>
  );
}

export function SaleRequestsScreen(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "New" | "In Review" | "Waiting Info">("All");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const inboxQuery = useSaleInboxProjectsQuery({
    filter,
    search: query.trim() || undefined,
    page,
    limit: pageSize,
  });
  const items = inboxQuery.data?.items ?? [];
  const total = inboxQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  // No claim-broadcast SignalR for other Sales — refresh when returning to this screen.
  useFocusEffect(
    useCallback(() => {
      void inboxQuery.refetch();
    }, [inboxQuery.refetch]),
  );

  const handleSearchChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value as typeof filter);
    setPage(1);
  };

  return (
    <SaleFrame>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={inboxQuery.isRefetching} onRefresh={() => void inboxQuery.refetch()} tintColor={SALE.gold} />
        }
      >
        <SaleHeader title="Project Requests">
          <View style={s.searchRow}>
            <SearchBar value={query} onChange={handleSearchChange} placeholder="Search by name or code…" />
            <View style={s.filterButton}>
              <AppIcon definition={filterIconDefinition} size={15} color={SALE.white} />
            </View>
          </View>
        </SaleHeader>
        <FilterChips
          options={["All", "New", "In Review", "Waiting Info"]}
          selected={filter}
          onSelect={handleFilterChange}
        />
        <View style={[s.content, s.contentGap]}>
          <Text style={s.sectionLabel}>
            {total} requests · Page {Math.min(page, totalPages)}/{totalPages}
          </Text>
          {inboxQuery.isLoading ? (
            <ActivityIndicator color={SALE.gold} />
          ) : inboxQuery.isError ? (
            <Text style={s.centerMuted}>{getErrorMessage(inboxQuery.error, "Unable to load requests.")}</Text>
          ) : items.length === 0 ? (
            <Text style={s.centerMuted}>No requests in this filter.</Text>
          ) : (
            items.map((item) => <RequestCard key={item.projectId} item={item} />)
          )}

          {total > 0 ? (
            <View style={s.paginationRow}>
              <Pressable
                style={[s.paginationButton, !canPrev && s.paginationButtonDisabled]}
                disabled={!canPrev || inboxQuery.isFetching}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
              >
                <Text style={[s.paginationButtonText, !canPrev && s.paginationButtonTextDisabled]}>Previous</Text>
              </Pressable>
              <Text style={s.paginationMeta}>
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </Text>
              <Pressable
                style={[s.paginationButton, !canNext && s.paginationButtonDisabled]}
                disabled={!canNext || inboxQuery.isFetching}
                onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                <Text style={[s.paginationButtonText, !canNext && s.paginationButtonTextDisabled]}>Next</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <SaleBottomNav active="requests" />
    </SaleFrame>
  );
}

function RequestCard({
  item,
}: {
  item: ReturnType<typeof mapRequestItem>;
}): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const claimMutation = useClaimSalesAssignmentMutation();
  const colors = { urgent: SALE.red, high: "#FF8904", medium: "#FFB900" } as const;
  const canClaim = item.rawStatus === "SUBMITTED" || item.rawStatus === "NEED_BASIC_INFORMATION";

  const handleAccept = () => {
    Alert.alert("Accept request", `Claim ${item.projectCode}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: () => {
          claimMutation.mutate(
            { projectId: item.projectId },
            {
              onSuccess: (response) => {
                const hasSalesChat = Boolean(response.salesChat?.chatId);
                Alert.alert(
                  "Lead claimed",
                  hasSalesChat
                    ? "Project is In Consultation. Sales chat is ready."
                    : "Project is now In Consultation.",
                );
                navigation.navigate("SaleProjectDetail", {
                  projectId: item.projectId,
                  tab: hasSalesChat ? "Chat" : "Overview",
                });
              },
              onError: (error) => {
                const appError = error instanceof AppError ? error : mapAxiosError(error);
                if (appError.code === "CONFLICT" || appError.status === 409) {
                  Alert.alert("Lead đã được nhận", "Sales khác đã claim lead này.");
                  return;
                }
                Alert.alert("Error", getErrorMessage(error, "Unable to claim this request."));
              },
            },
          );
        },
      },
    ]);
  };

  return (
    <View style={s.card}>
      <View style={s.topCardRow}>
        <View style={{ flexDirection: "row", flex: 1 }}>
          <View style={[s.priorityDot, { backgroundColor: colors[item.priority] }]} />
          <View>
            <Text style={s.cardTitle}>{item.name}</Text>
            <Text style={s.cardMeta}>{item.projectCode}</Text>
          </View>
        </View>
        <View style={s.status}>
          <Text style={s.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={s.infoGrid}>
        {[
          ["Type", item.type],
          ["Submitted", item.submitted],
          ["Status", item.status],
          ["Priority", item.priority],
        ].map(([label, value]) => (
          <InfoCell key={label} label={label} value={value} />
        ))}
      </View>
      <View style={s.buttonRow}>
        <Pressable
          style={s.buttonSecondary}
          onPress={() => navigation.navigate("SaleProjectDetail", { projectId: item.projectId, tab: "Overview" })}
        >
          <Text style={s.buttonSecondaryText}>View Details</Text>
        </Pressable>
        {canClaim ? (
          <Pressable style={s.buttonPrimary} disabled={claimMutation.isPending} onPress={handleAccept}>
            <Text style={s.buttonPrimaryText}>{claimMutation.isPending ? "Accepting…" : "Accept  →"}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function mapRequestItem(item: {
  projectId: string;
  projectCode: string;
  name: string;
  type: string;
  submitted: string;
  status: string;
  rawStatus: string;
  priority: "urgent" | "high" | "medium";
}) {
  return item;
}

export function SaleProjectsScreen(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SaleProjectListFilter>("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const projectsQuery = useSaleAssignedProjectsQuery({
    search: query.trim() || undefined,
    filter,
    page,
    limit: pageSize,
  });

  const items = projectsQuery.data?.items ?? [];
  const total = projectsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const selectedFilterLabel =
    PROJECT_STATUS_FILTER_OPTIONS.find((option) => option.value === filter)?.label ?? "All statuses";

  const handleSearchChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handleFilterChange = (value: SaleProjectListFilter) => {
    setFilter(value);
    setFilterOpen(false);
    setPage(1);
  };

  return (
    <SaleFrame>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={projectsQuery.isRefetching}
            onRefresh={() => void projectsQuery.refetch()}
            tintColor={SALE.gold}
          />
        }
      >
        <SaleHeader title="Assigned Projects">
          <View style={s.searchRow}>
            <SearchBar value={query} onChange={handleSearchChange} placeholder="Search project or code…" />
            <Pressable
              style={[s.filterButton, filterOpen && { backgroundColor: "rgba(201,168,106,0.28)" }]}
              onPress={() => setFilterOpen((open) => !open)}
            >
              <AppIcon definition={filterIconDefinition} size={15} color={SALE.white} />
            </Pressable>
          </View>
        </SaleHeader>

        <View style={s.filterDropdownWrap}>
          <Pressable
            style={[s.filterDropdownTrigger, filterOpen && s.filterDropdownTriggerOpen]}
            onPress={() => setFilterOpen((open) => !open)}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.filterDropdownLabel}>Status filter</Text>
              <Text style={s.filterDropdownValue} numberOfLines={1}>
                {selectedFilterLabel}
              </Text>
            </View>
            <AppIcon
              definition={chevronDownIconDefinition}
              size={14}
              color={SALE.muted}
            />
          </Pressable>

          {filterOpen ? (
            <View style={s.filterDropdownMenu}>
              {PROJECT_STATUS_FILTER_OPTIONS.map((option) => {
                const selected = filter === option.value;
                return (
                  <Pressable
                    key={String(option.value)}
                    style={[s.filterDropdownOption, selected && s.filterDropdownOptionSelected]}
                    onPress={() => handleFilterChange(option.value)}
                  >
                    <Text
                      style={[
                        s.filterDropdownOptionText,
                        selected && s.filterDropdownOptionTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                    {selected ? <Text style={s.filterDropdownCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <View style={[s.content, s.contentGap]}>
          <Text style={s.sectionLabel}>
            {total} projects · Page {Math.min(page, totalPages)}/{totalPages}
          </Text>
          {projectsQuery.isLoading ? (
            <ActivityIndicator color={SALE.gold} />
          ) : projectsQuery.isError ? (
            <Text style={s.centerMuted}>{getErrorMessage(projectsQuery.error, "Unable to load projects.")}</Text>
          ) : items.length === 0 ? (
            <Text style={s.centerMuted}>No assigned projects in this filter.</Text>
          ) : (
            items.map((item) => <ProjectCard key={item.projectId} item={item} />)
          )}

          {total > 0 ? (
            <View style={s.paginationRow}>
              <Pressable
                style={[s.paginationButton, !canPrev && s.paginationButtonDisabled]}
                disabled={!canPrev || projectsQuery.isFetching}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
              >
                <Text style={[s.paginationButtonText, !canPrev && s.paginationButtonTextDisabled]}>Previous</Text>
              </Pressable>
              <Text style={s.paginationMeta}>
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </Text>
              <Pressable
                style={[s.paginationButton, !canNext && s.paginationButtonDisabled]}
                disabled={!canNext || projectsQuery.isFetching}
                onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                <Text style={[s.paginationButtonText, !canNext && s.paginationButtonTextDisabled]}>Next</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <SaleBottomNav active="projects" />
    </SaleFrame>
  );
}

function ProjectCard({
  item,
}: {
  item: {
    projectId: string;
    projectCode: string;
    name: string;
    type: string;
    designer: string;
    status: string;
    nextAction: string;
    color: string;
  };
}): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={s.card}>
      <View style={s.topCardRow}>
        <View>
          <Text style={s.cardTitle}>{item.name}</Text>
          <Text style={s.cardMeta}>
            {item.projectCode} · {item.type}
          </Text>
        </View>
        <View style={s.status}>
          <Text style={[s.statusText, { color: item.color }]}>{item.status}</Text>
        </View>
      </View>
      <View style={s.infoGrid}>
        <InfoCell label="Designer" value={item.designer} />
        <InfoCell label="Next Action" value={item.nextAction} color={item.color} />
      </View>
      <Pressable
        style={[s.buttonSecondary, { marginTop: 12 }]}
        onPress={() => navigation.navigate("SaleProjectDetail", { projectId: item.projectId, tab: "Overview" })}
      >
        <Text style={[s.buttonSecondaryText, { color: SALE.ink }]}>View Project  →</Text>
      </Pressable>
    </View>
  );
}

function InfoCell({ label, value, color }: { label: string; value: string; color?: string }): React.JSX.Element {
  return (
    <View style={s.infoCell}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoValue, color ? { color, fontWeight: "600" } : null]}>{value}</Text>
    </View>
  );
}

function formatSaleChatSubtitle(chat: {
  chatType: string;
  roleLabel: string;
  staffName: string;
}): string {
  const typeLabel = chat.chatType === "DESIGNER" ? "Designer" : "Sales";
  const name = chat.staffName?.trim();
  if (!name) {
    return typeLabel;
  }
  const normalizedName = name.toLowerCase();
  if (
    normalizedName === typeLabel.toLowerCase() ||
    normalizedName === chat.roleLabel.toLowerCase() ||
    (normalizedName.includes("consultant") && chat.chatType === "SALES")
  ) {
    return typeLabel;
  }
  return `${typeLabel} · ${name}`;
}

export function SaleMessagesScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Sales" | "Designer">("All");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectOpen, setProjectOpen] = useState(false);

  const projectsQuery = useSaleAssignedProjectsQuery({ filter: "All", page: 1, limit: 50 });
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

  const salesChat = useMemo(
    () => chatsQuery.data?.find((item) => item.chatType === "SALES") ?? null,
    [chatsQuery.data],
  );
  const designerChat = useMemo(
    () => chatsQuery.data?.find((item) => item.chatType === "DESIGNER") ?? null,
    [chatsQuery.data],
  );

  const visibleChats = useMemo(() => {
    const chats = [salesChat, designerChat].filter(Boolean) as NonNullable<typeof salesChat>[];
    if (filter === "Sales") {
      return chats.filter((item) => item.chatType === "SALES");
    }
    if (filter === "Designer") {
      return chats.filter((item) => item.chatType === "DESIGNER");
    }
    return chats;
  }, [designerChat, filter, salesChat]);

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

  const openChat = (chat: NonNullable<typeof salesChat>) => {
    navigation.navigate("SaleChat", {
      chatId: chat.chatId,
      projectId: chat.projectId,
      title: chat.title,
      staffName: chat.staffName,
      chatType: chat.chatType,
      status: chat.status,
    });
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setProjectOpen(false);
    setFilter("All");
    setQuery("");
  };

  return (
    <SaleFrame>
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
            tintColor={SALE.gold}
          />
        }
      >
        <SaleHeader title="Messages">
          <View style={s.searchRow}>
            <SearchBar value={query} onChange={setQuery} placeholder="Search in this project…" />
          </View>
        </SaleHeader>

        <View style={s.messagesProjectPicker}>
          <Pressable
            style={[s.messagesProjectTrigger, projectOpen && s.messagesProjectTriggerOpen]}
            disabled={projects.length === 0}
            onPress={() => setProjectOpen((open) => !open)}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.messagesProjectLabel}>Project</Text>
              <Text style={s.messagesProjectValue} numberOfLines={1}>
                {selectedProject?.name ?? (projectsQuery.isLoading ? "Loading…" : "Select project")}
              </Text>
              <Text style={s.messagesProjectMeta} numberOfLines={1}>
                {projectMeta}
              </Text>
            </View>
            <AppIcon definition={chevronDownIconDefinition} size={14} color={SALE.muted} />
          </Pressable>

          {projectOpen && projects.length > 0 ? (
            <ScrollView style={s.messagesProjectMenu} nestedScrollEnabled>
              {projects.map((project) => {
                const selected = project.projectId === selectedProjectId;
                return (
                  <Pressable
                    key={project.projectId}
                    style={[s.messagesProjectOption, selected && s.messagesProjectOptionSelected]}
                    onPress={() => handleSelectProject(project.projectId)}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.messagesProjectOptionText} numberOfLines={1}>
                        {project.name}
                      </Text>
                      <Text style={s.messagesProjectOptionMeta} numberOfLines={1}>
                        {project.projectCode}
                        {project.type && project.type !== "—" ? ` · ${project.type}` : ""}
                      </Text>
                    </View>
                    {selected ? <Text style={s.messagesProjectOptionCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

        <View style={s.messagesFilterWrap}>
          <FilterChips
            options={["All", "Sales", "Designer"]}
            selected={filter}
            onSelect={(value) => setFilter(value as typeof filter)}
          />
        </View>

        <View style={s.messagesList}>
          {projectsQuery.isLoading || chatsQuery.isLoading ? (
            <ActivityIndicator color={SALE.gold} />
          ) : projectsQuery.isError ? (
            <Text style={s.centerMuted}>{getErrorMessage(projectsQuery.error, "Unable to load projects.")}</Text>
          ) : projects.length === 0 ? (
            <Text style={s.centerMuted}>No assigned projects yet.</Text>
          ) : isSearching ? (
            searchQuery.isLoading ? (
              <ActivityIndicator color={SALE.gold} />
            ) : (searchQuery.data?.length ?? 0) === 0 ? (
              <Text style={s.centerMuted}>No messages match “{debouncedQuery}”.</Text>
            ) : (
              (searchQuery.data ?? []).map((item) => {
                const chat = chatsQuery.data?.find((entry) => entry.chatId === item.chatId);
                return (
                  <Pressable
                    key={item.messageId}
                    style={s.conversation}
                    onPress={() => {
                      if (!chat) {
                        return;
                      }
                      openChat(chat);
                    }}
                  >
                    <View
                      style={[
                        s.conversationAccent,
                        chat?.chatType === "DESIGNER" ? s.conversationAccentDesigner : s.conversationAccentSales,
                      ]}
                    />
                    <Avatar initials={getInitials(item.senderName)} color={SALE.charcoal} size={44} />
                    <View style={s.conversationBody}>
                      <View style={s.conversationTop}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={s.conversationName} numberOfLines={1}>
                            {item.senderName}
                          </Text>
                          <Text style={s.conversationMeta} numberOfLines={1}>
                            {chat?.title ?? "Chat"}
                          </Text>
                        </View>
                        <Text style={s.conversationTime}>{formatChatTime(item.createdAt)}</Text>
                      </View>
                      <Text style={s.conversationPreview} numberOfLines={2}>
                        {item.content}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )
          ) : visibleChats.length === 0 ? (
            <Text style={s.centerMuted}>
              No chats yet for this project. Sales chat appears after claim; Designer chat after assign designer.
            </Text>
          ) : (
            visibleChats.map((item) => (
              <Pressable key={item.chatId} style={s.conversation} onPress={() => openChat(item)}>
                <View
                  style={[
                    s.conversationAccent,
                    item.chatType === "DESIGNER" ? s.conversationAccentDesigner : s.conversationAccentSales,
                  ]}
                />
                <View>
                  <Avatar
                    initials={item.chatType === "DESIGNER" ? "DS" : "SC"}
                    color={item.chatType === "DESIGNER" ? "#7A6F68" : SALE.charcoal}
                    size={44}
                  />
                  {item.isOpen ? <View style={s.online} /> : null}
                </View>
                <View style={s.conversationBody}>
                  <View style={s.conversationTop}>
                    <View style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
                      <Text style={s.conversationName} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={s.conversationMeta} numberOfLines={1}>
                        {formatSaleChatSubtitle(item)}
                      </Text>
                    </View>
                    <View>
                      <Text style={s.conversationTime}>{item.timeLabel}</Text>
                      <View
                        style={[
                          s.conversationStatusPill,
                          item.isOpen ? s.conversationStatusOpen : s.conversationStatusClosed,
                        ]}
                      >
                        <Text
                          style={[
                            s.conversationStatusText,
                            item.isOpen ? s.conversationStatusTextOpen : s.conversationStatusTextClosed,
                          ]}
                        >
                          {item.isOpen ? "Open" : "Closed"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={s.conversationPreview} numberOfLines={2}>
                    {item.preview}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
      <SaleBottomNav active="messages" />
    </SaleFrame>
  );
}

export function SaleMoreScreen(): React.JSX.Element {
  const currentUser = useAuthStore((state) => state.user);
  const logout = useLogoutAction();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const kpisQuery = useSalesKpisQuery({ scope: "mine", dateRange: "thisWeek" });
  const menu: { icon: IconDefinition; title: string; subtitle: string; action?: () => void }[] = [
    {
      icon: bellIconDefinition,
      title: "Notifications",
      subtitle: "Sales alerts and project updates",
      action: () => navigation.navigate("SaleNotifications"),
    },
    {
      icon: lockIconDefinition,
      title: "Change Password",
      subtitle: "Update your account password",
      action: () => navigation.navigate("ChangePassword"),
    },
    { icon: fileTextIconDefinition, title: "Sales Documents", subtitle: "Proposals, quotations & contracts" },
    { icon: projectIconDefinition, title: "Project Preferences", subtitle: "Defaults and assignment options" },
    { icon: shieldIconDefinition, title: "Privacy & Security", subtitle: "Access and account protection" },
    { icon: helpIconDefinition, title: "Help & Support", subtitle: "Contact the FurniSpace team" },
  ];
  return (
    <SaleFrame>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.profileHero}>
          <SaleHeader title="More & Settings" />
          <View style={s.profileRow}>
            <View style={s.profileAvatar}>
              <Text style={[s.avatarText, { fontSize: 16 }]}>{getInitials(currentUser?.fullName)}</Text>
            </View>
            <View>
              <Text style={s.profileName}>{currentUser?.fullName ?? "Sales User"}</Text>
              <Text style={s.profileRole}>Sales · FurniSpace</Text>
            </View>
          </View>
        </View>
        <View style={[s.content, s.contentGap, { paddingTop: 15 }]}>
          <View style={s.card}>
            <SectionTitle title="Account & Preferences" />
            {menu.map((item) => (
              <Pressable key={item.title} style={s.settingRow} onPress={item.action}>
                <View style={s.settingIcon}>
                  <AppIcon definition={item.icon} size={15} color={SALE.muted} />
                </View>
                <View style={s.settingCopy}>
                  <Text style={s.settingTitle}>{item.title}</Text>
                  <Text style={s.settingSubtitle}>{item.subtitle}</Text>
                </View>
                <AppIcon definition={chevronRightIconDefinition} size={15} color={SALE.muted} />
              </Pressable>
            ))}
          </View>
          <View style={s.card}>
            <SectionTitle title="Sales Workspace" />
            <View style={s.infoGrid}>
              <InfoCell label="Active projects" value={String(kpisQuery.data?.activeProjects ?? "—")} />
              <InfoCell label="Open requests" value={String(kpisQuery.data?.newRequests ?? "—")} />
              <InfoCell label="Waiting customer" value={String(kpisQuery.data?.waitingCustomer ?? "—")} />
              <InfoCell label="Payment follow-up" value={String(kpisQuery.data?.paymentFollowUp ?? "—")} />
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
              <AppIcon definition={logoutIconDefinition} size={15} color={SALE.red} />
            </View>
            <View style={s.settingCopy}>
              <Text style={s.signOutTitle}>{logout.isPending ? "Signing Out…" : "Sign Out"}</Text>
              <Text style={s.settingSubtitle}>{currentUser?.email ?? "sales@furnispace.vn"}</Text>
            </View>
          </Pressable>
          <Text style={s.centerMuted}>FURNISPACE SALES v1.0.0 · © 2026</Text>
        </View>
      </ScrollView>
      <SaleBottomNav active="more" />
    </SaleFrame>
  );
}
