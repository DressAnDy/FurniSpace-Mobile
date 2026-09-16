import React, { useCallback, useState } from "react";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { AppIcon } from "../../../shared/components/AppIcon";
import { arrowLeftIconDefinition } from "../../../icons/navigation/definitions";
import { formatVndAmount } from "../../payment/utils/payment.mapper";
import { getProjectStatusLabel } from "../../project/utils/project.mapper";
import { SaleFrame } from "../components/SaleShared";
import { useSalesOverdueTasksQuery, useSalesUnpaidRemainingQuery } from "../hooks/useSaleDashboard";
import type { SalesOverdueTaskItemDto, SalesUnpaidRemainingItemDto } from "../models/sale.model";
import { formatSaleDate, getSaleProjectStatusColors } from "../utils/sale.mapper";
import { SALE, saleStyles as s } from "../styles/sale.styles";

const PAGE_SIZE = 5;

type SaleKpiListProps = NativeStackScreenProps<RootStackParamList, "SaleKpiList">;

function titleForKind(kind: RootStackParamList["SaleKpiList"]["kind"]): { title: string; subtitle: string } {
  if (kind === "overdue-tasks") {
    return { title: "Overdue tasks", subtitle: "Past target completion date" };
  }
  return { title: "Unpaid remaining", subtitle: "Orders still owing" };
}

export function SaleKpiListScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<SaleKpiListProps["route"]>();
  const insets = useSafeAreaInsets();
  const kind = route.params.kind;
  const [page, setPage] = useState(1);
  const copy = titleForKind(kind);

  const unpaidQuery = useSalesUnpaidRemainingQuery(
    {
      scope: "mine",
      page,
      limit: PAGE_SIZE,
    },
    kind === "unpaid-remaining",
  );
  const overdueQuery = useSalesOverdueTasksQuery(
    {
      scope: "mine",
      page,
      limit: PAGE_SIZE,
    },
    kind === "overdue-tasks",
  );

  const activeQuery = kind === "overdue-tasks" ? overdueQuery : unpaidQuery;
  const total = activeQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  useFocusEffect(
    useCallback(() => {
      void activeQuery.refetch();
    }, [activeQuery.refetch]),
  );

  const handleOpenProject = useCallback(
    (projectId: string) => {
      navigation.navigate("SaleProjectDetail", { projectId, tab: "Overview" });
    },
    [navigation],
  );

  const handleOpenOrder = useCallback(
    (item: SalesUnpaidRemainingItemDto) => {
      if (item.orderId && item.projectId) {
        navigation.navigate("SaleOrderDetail", {
          orderId: item.orderId,
          projectId: item.projectId,
          projectName: item.projectName,
        });
        return;
      }
      if (item.projectId) {
        handleOpenProject(item.projectId);
      }
    },
    [handleOpenProject, navigation],
  );

  return (
    <SaleFrame>
      <View style={[s.header, { paddingTop: Math.max(insets.top, 18) + 8, paddingBottom: 16 }]}>
        <View style={s.headerTopRow}>
          <Pressable style={s.headerIcon} onPress={() => navigation.goBack()}>
            <AppIcon definition={arrowLeftIconDefinition} size={16} color={SALE.white} />
          </Pressable>
          <View style={s.headerCopy}>
            <Text style={s.headerEyebrow}>Dashboard</Text>
            <Text style={s.headerTitle}>{copy.title}</Text>
            <Text style={s.headerSubtitle}>{copy.subtitle}</Text>
          </View>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={activeQuery.isRefetching}
            onRefresh={() => void activeQuery.refetch()}
            tintColor={SALE.gold}
          />
        }
        contentContainerStyle={[s.content, s.contentGap, { paddingTop: 14 }]}
      >
        <Text style={s.sectionLabel}>
          {total} {kind === "overdue-tasks" ? "tasks" : "orders"} · Page {Math.min(page, totalPages)}/{totalPages}
        </Text>
        {activeQuery.isLoading ? (
          <ActivityIndicator color={SALE.gold} />
        ) : activeQuery.isError ? (
          <View style={s.emptyState}>
            <Text style={s.emptyStateText}>{getErrorMessage(activeQuery.error, "Unable to load this list.")}</Text>
          </View>
        ) : total === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyStateText}>Nothing in this list right now.</Text>
          </View>
        ) : kind === "overdue-tasks" ? (
          (overdueQuery.data?.items ?? []).map((item) => (
            <OverdueTaskCard key={item.projectId} item={item} onOpen={handleOpenProject} />
          ))
        ) : (
          (unpaidQuery.data?.items ?? []).map((item) => (
            <UnpaidRemainingCard key={item.orderId || item.projectId} item={item} onOpen={handleOpenOrder} />
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
      </ScrollView>
    </SaleFrame>
  );
}

function UnpaidRemainingCard({
  item,
  onOpen,
}: {
  item: SalesUnpaidRemainingItemDto;
  onOpen: (item: SalesUnpaidRemainingItemDto) => void;
}): React.JSX.Element {
  const tone = getSaleProjectStatusColors(item.status ?? "");
  return (
    <Pressable style={s.card} onPress={() => onOpen(item)}>
      <View style={s.topCardRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.cardTitle} numberOfLines={1}>
            {item.projectName}
          </Text>
          <Text style={s.cardMeta}>
            {item.orderCode || item.projectCode}
            {item.customerName ? ` · ${item.customerName}` : ""}
          </Text>
        </View>
        <View style={[s.status, { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor }]}>
          <Text style={[s.statusText, { color: tone.color }]} numberOfLines={1}>
            {item.paymentStatus || item.status || "Unpaid"}
          </Text>
        </View>
      </View>
      <View style={[s.buttonRow, { borderTopWidth: 0, marginTop: 8, paddingTop: 0 }]}>
        <Text style={s.infoValue}>{formatVndAmount(item.remainingAmount, item.currency ?? "VND")} remaining</Text>
        <Text style={s.sectionAction}>{formatSaleDate(item.updatedAt)}</Text>
      </View>
    </Pressable>
  );
}

function OverdueTaskCard({
  item,
  onOpen,
}: {
  item: SalesOverdueTaskItemDto;
  onOpen: (projectId: string) => void;
}): React.JSX.Element {
  const tone = getSaleProjectStatusColors(item.status ?? "");
  const overdueLabel =
    item.overdueDays != null && item.overdueDays > 0
      ? `${item.overdueDays} day${item.overdueDays === 1 ? "" : "s"} overdue`
      : "Overdue";
  return (
    <Pressable style={s.card} onPress={() => onOpen(item.projectId)}>
      <View style={s.topCardRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.cardTitle} numberOfLines={1}>
            {item.projectName}
          </Text>
          <Text style={s.cardMeta}>
            {item.projectCode}
            {item.customerName ? ` · ${item.customerName}` : ""}
          </Text>
        </View>
        <View style={[s.status, { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor }]}>
          <Text style={[s.statusText, { color: tone.color }]} numberOfLines={1}>
            {item.status ? getProjectStatusLabel(item.status) : "Overdue"}
          </Text>
        </View>
      </View>
      <View style={[s.buttonRow, { borderTopWidth: 0, marginTop: 8, paddingTop: 0 }]}>
        <Text style={[s.infoValue, { color: SALE.red }]}>{overdueLabel}</Text>
        <Text style={s.sectionAction}>Due {formatSaleDate(item.targetCompletionDate)}</Text>
      </View>
    </Pressable>
  );
}
