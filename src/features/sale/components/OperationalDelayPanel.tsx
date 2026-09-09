import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { closeIconDefinition } from "../../../icons/navigation/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { formatTrackingDate, formatTrackingDateTime } from "../../project/utils/project.tracking.mapper";
import {
  formatDelayLabel,
  useCreateDeliveryDelayReportMutation,
  useCreateProductionDelayReportMutation,
  useOperationalDelayReportQuery,
  useProjectOperationalDelayReportsQuery,
} from "../hooks/useOperationalDelayReports";
import {
  DELIVERY_DELAY_REASON_CODES,
  DeliveryDelayReasonCode,
  OperationalDelayPhase,
  PRODUCTION_DELAY_REASON_CODES,
  ProductionDelayReasonCode,
} from "../models/operationalDelay.model";
import { getOperationalDelayErrorMessage, getReportReasonCode } from "../services/operationalDelay.api";
import { styles } from "./OperationalDelayPanel.styles";

type OperationalDelayPanelProps = {
  projectId: string;
  phase: OperationalDelayPhase;
  productionRequestId?: string | null;
  orderId?: string | null;
  deliveryId?: string | null;
  allowCreate?: boolean;
  title?: string;
};

export function OperationalDelayPanel({
  projectId,
  phase,
  productionRequestId = null,
  orderId = null,
  deliveryId = null,
  allowCreate = true,
  title,
}: OperationalDelayPanelProps): React.JSX.Element {
  const listQuery = useProjectOperationalDelayReportsQuery(projectId, phase);
  const createProductionMutation = useCreateProductionDelayReportMutation();
  const createDeliveryMutation = useCreateDeliveryDelayReportMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [productionReasonCode, setProductionReasonCode] = useState<ProductionDelayReasonCode | "">("");
  const [deliveryReasonCode, setDeliveryReasonCode] = useState<DeliveryDelayReasonCode | "">("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const detailQuery = useOperationalDelayReportQuery(selectedReportId);
  const reports = listQuery.data?.items ?? [];
  const isSubmitting = createProductionMutation.isPending || createDeliveryMutation.isPending;
  const canCreateProduction = phase === "PRODUCTION" && Boolean(productionRequestId);
  const canCreate = allowCreate && (phase === "DELIVERY" || canCreateProduction);
  const panelTitle = title ?? `${formatDelayLabel(phase)} delays`;

  const openCreate = () => {
    if (!canCreate) {
      return;
    }
    setProductionReasonCode("");
    setDeliveryReasonCode("");
    setReasonDetail("");
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleSubmit = () => {
    const detail = reasonDetail.trim();
    if (!detail) {
      setFormError("Reason detail is required.");
      return;
    }
    if (detail.length > 4000) {
      setFormError("Reason detail must be at most 4000 characters.");
      return;
    }

    if (phase === "PRODUCTION") {
      if (!productionRequestId) {
        setFormError("A production request is required to record a production delay.");
        return;
      }
      if (!productionReasonCode) {
        setFormError("Production reason code is required.");
        return;
      }

      createProductionMutation.mutate(
        {
          projectId,
          productionRequestId,
          productionReasonCode,
          reasonDetail: detail,
        },
        {
          onSuccess: () => {
            setIsCreateOpen(false);
            setReasonDetail("");
            setProductionReasonCode("");
          },
          onError: (error) => setFormError(getOperationalDelayErrorMessage(error)),
        },
      );
      return;
    }

    if (!deliveryReasonCode) {
      setFormError("Delivery reason code is required.");
      return;
    }

    createDeliveryMutation.mutate(
      {
        projectId,
        orderId,
        deliveryId,
        deliveryReasonCode,
        reasonDetail: detail,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setReasonDetail("");
          setDeliveryReasonCode("");
        },
        onError: (error) => setFormError(getOperationalDelayErrorMessage(error)),
      },
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardLabel}>{panelTitle.toUpperCase()}</Text>
        {allowCreate ? (
          <Pressable
            accessibilityRole="button"
            disabled={!canCreate}
            onPress={openCreate}
            style={[styles.reportButton, !canCreate ? styles.reportButtonDisabled : null]}
          >
            <Text style={styles.reportButtonText}>Record risk / delay</Text>
          </Pressable>
        ) : null}
      </View>

      {phase === "PRODUCTION" && allowCreate && !productionRequestId ? (
        <Text style={styles.hintText}>Create a production request before recording a production delay.</Text>
      ) : null}

      {listQuery.isLoading ? <ActivityIndicator color="#C9A86A" /> : null}
      {listQuery.isError ? (
        <Text style={styles.errorText}>{getOperationalDelayErrorMessage(listQuery.error)}</Text>
      ) : null}
      {!listQuery.isLoading && !listQuery.isError && reports.length === 0 ? (
        <Text style={styles.hintText}>No {formatDelayLabel(phase).toLowerCase()} delay reports.</Text>
      ) : null}

      {reports.map((report) => {
        const reasonCode = getReportReasonCode(report);
        const isOverdue = report.delayState === "OVERDUE";
        return (
          <Pressable
            key={report.operationalDelayReportId}
            accessibilityRole="button"
            onPress={() => setSelectedReportId(report.operationalDelayReportId)}
            style={styles.issueRow}
          >
            <View style={styles.issueTitleRow}>
              <View style={[styles.badge, isOverdue ? styles.badgeOverdue : styles.badgeAtRisk]}>
                <Text style={[styles.badgeText, isOverdue ? styles.badgeTextOverdue : styles.badgeTextAtRisk]}>
                  {formatDelayLabel(report.delayState)}
                </Text>
              </View>
              <Text style={styles.issueTitle} numberOfLines={1}>
                {reasonCode ? formatDelayLabel(reasonCode) : "Schedule risk"}
              </Text>
            </View>
            <Text style={styles.issueMeta} numberOfLines={2}>
              {report.reasonDetail}
            </Text>
            <Text style={styles.issueMeta}>
              Deadline {formatTrackingDate(report.deadlineSnapshot)} · {report.reporterName ?? "Staff"} ·{" "}
              {formatTrackingDateTime(report.reportedAt)}
            </Text>
          </Pressable>
        );
      })}

      <Modal visible={isCreateOpen} animationType="slide" transparent onRequestClose={() => setIsCreateOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record {formatDelayLabel(phase).toLowerCase()} risk / delay</Text>
              <Pressable accessibilityRole="button" onPress={() => setIsCreateOpen(false)} style={styles.closeButton}>
                <AppIcon definition={closeIconDefinition} size={16} color="#3A3330" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.hintText}>This report is permanent and does not create a resolution workflow.</Text>

              <Text style={styles.fieldLabel}>{phase === "PRODUCTION" ? "Production reason" : "Delivery reason"}</Text>
              <View style={styles.typeRow}>
                {(phase === "PRODUCTION" ? PRODUCTION_DELAY_REASON_CODES : DELIVERY_DELAY_REASON_CODES).map((code) => {
                  const active =
                    phase === "PRODUCTION" ? productionReasonCode === code : deliveryReasonCode === code;
                  return (
                    <Pressable
                      key={code}
                      accessibilityRole="button"
                      onPress={() => {
                        if (phase === "PRODUCTION") {
                          setProductionReasonCode(code as ProductionDelayReasonCode);
                        } else {
                          setDeliveryReasonCode(code as DeliveryDelayReasonCode);
                        }
                      }}
                      style={[styles.typeChip, active ? styles.typeChipActive : null]}
                    >
                      <Text style={[styles.typeChipText, active ? styles.typeChipTextActive : null]}>
                        {formatDelayLabel(code)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Reason detail</Text>
              <TextInput
                multiline
                maxLength={4000}
                value={reasonDetail}
                onChangeText={setReasonDetail}
                placeholder="Describe the risk or delay…"
                placeholderTextColor="#A89F97"
                style={[styles.input, styles.textArea]}
              />

              {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={handleSubmit}
                style={[styles.primaryButton, isSubmitting ? styles.primaryButtonDisabled : null]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Save report</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(selectedReportId)}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedReportId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delay report</Text>
              <Pressable accessibilityRole="button" onPress={() => setSelectedReportId(null)} style={styles.closeButton}>
                <AppIcon definition={closeIconDefinition} size={16} color="#3A3330" />
              </Pressable>
            </View>
            {detailQuery.isLoading ? <ActivityIndicator color="#C9A86A" /> : null}
            {detailQuery.isError ? (
              <Text style={styles.errorText}>{getOperationalDelayErrorMessage(detailQuery.error)}</Text>
            ) : null}
            {detailQuery.data ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>State</Text>
                  <Text style={styles.detailValue}>{formatDelayLabel(detailQuery.data.delayState)}</Text>
                </View>
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Reason</Text>
                  <Text style={styles.detailValue}>
                    {formatDelayLabel(getReportReasonCode(detailQuery.data) ?? "OTHER")}
                  </Text>
                </View>
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Detail</Text>
                  <Text style={styles.detailValue}>{detailQuery.data.reasonDetail}</Text>
                </View>
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Deadline snapshot</Text>
                  <Text style={styles.detailValue}>{formatTrackingDate(detailQuery.data.deadlineSnapshot)}</Text>
                </View>
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Reported</Text>
                  <Text style={styles.detailValue}>
                    {detailQuery.data.reporterName ?? "Staff"} · {formatTrackingDateTime(detailQuery.data.reportedAt)}
                  </Text>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
