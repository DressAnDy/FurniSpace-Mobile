import React, { useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
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
import { chevronRightIconDefinition, searchIconDefinition } from "../../../icons/navigation/definitions";
import { projectIconDefinition } from "../../../icons/project/definitions";
import { filterIconDefinition, moreHorizontalIconDefinition } from "../../../icons/action/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import type { IconDefinition } from "../../../icons/types";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { useLogoutAction } from "../../auth/hooks/useAuthActions";
import { useAuthStore } from "../../auth/store/auth.store";
import { saleConversations } from "../data/sale.mock";
import {
  matchesSaleProjectFilter,
  saleProjectsFilterToStatus,
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
import { SALE, saleStyles as s } from "../styles/sale.styles";

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
              <Pressable style={s.headerIcon} onPress={() => navigation.navigate("Notifications")}>
                <AppIcon definition={bellIconDefinition} size={15} color={SALE.white} />
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
              onSuccess: () => {
                Alert.alert("Success", "Lead claimed. Project is now In Consultation.");
                navigation.navigate("SaleProjectDetail", { projectId: item.projectId, tab: "Overview" });
              },
              onError: (error) => Alert.alert("Error", getErrorMessage(error, "Unable to claim this request.")),
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
  const [filter, setFilter] = useState<"All" | "Active" | "Production" | "Delivery">("All");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const projectsQuery = useSaleAssignedProjectsQuery({
    search: query.trim() || undefined,
    status: saleProjectsFilterToStatus(filter),
    page,
    limit: pageSize,
  });

  const items = useMemo(() => {
    const list = projectsQuery.data?.items ?? [];
    if (filter === "Active") {
      return list.filter((item) => matchesSaleProjectFilter(item.rawStatus, "Active"));
    }
    return list;
  }, [filter, projectsQuery.data?.items]);

  const total = projectsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

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
            <View style={s.filterButton}>
              <AppIcon definition={filterIconDefinition} size={15} color={SALE.white} />
            </View>
          </View>
        </SaleHeader>
        <FilterChips
          options={["All", "Active", "Production", "Delivery"]}
          selected={filter}
          onSelect={handleFilterChange}
        />
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

export function SaleMessagesScreen(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const conversations = saleConversations.filter((item) =>
    `${item.name} ${item.meta}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <SaleFrame>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SaleHeader title="Messages">
          <View style={{ position: "absolute", right: 19, bottom: 68 }}>
            <View style={s.headerIcon}>
              <AppIcon definition={moreHorizontalIconDefinition} size={15} color={SALE.white} />
            </View>
          </View>
          <View style={s.searchRow}>
            <SearchBar value={query} onChange={setQuery} placeholder="Search conversations…" />
          </View>
        </SaleHeader>
        <FilterChips options={["All", "Customers", "Designers", "Internal"]} selected={filter} onSelect={setFilter} />
        <View style={[s.content, s.contentGap]}>
          <Text style={s.sectionLabel}>{conversations.length} conversations (mock)</Text>
          {conversations.map((item) => (
            <Pressable
              key={item.id}
              style={s.conversation}
              onPress={() => navigation.navigate("SaleChat", { conversationId: item.id })}
            >
              <View>
                <Avatar initials={item.initials} color={item.color} size={42} />
                {item.online ? <View style={s.online} /> : null}
              </View>
              <View style={s.conversationBody}>
                <View style={s.conversationTop}>
                  <View>
                    <Text style={s.conversationName}>{item.name}</Text>
                    <Text style={s.conversationMeta}>{item.meta}</Text>
                  </View>
                  <View>
                    <Text style={s.conversationTime}>{item.time}</Text>
                    {item.unread ? (
                      <View style={s.unread}>
                        <Text style={s.badgeText}>{item.unread}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <Text style={s.conversationPreview} numberOfLines={1}>
                  {item.preview}
                </Text>
              </View>
            </Pressable>
          ))}
          <Text style={s.centerMuted}>Chat API for Sales will be wired next.</Text>
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
    { icon: bellIconDefinition, title: "Notification Settings", subtitle: "Manage alerts and reminders" },
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
