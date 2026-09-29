import React, { useEffect, useMemo, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { closeIconDefinition } from "../../../icons/navigation/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { useOrderDetailQuery } from "../hooks/useCustomerFlow";
import {
  formatProductIssueStatusLabel,
  formatProductIssueTypeLabel,
  useCreateProductIssueMutation,
  useOrderProductIssuesQuery,
  useProductIssueDetailQuery,
  useProjectProductIssuesQuery,
} from "../hooks/useProductIssues";
import {
  DELIVERY_PRODUCT_ISSUE_TYPES,
  DeliveryProductIssueType,
  ProductIssueEvidenceLocalFile,
  ProductIssueReportDto,
  ProductIssueStatusFilter,
} from "../models/productIssue.model";
import { OrderItemDto } from "../models/order.model";
import { getProductIssueErrorMessage } from "../services/productIssue.api";
import {
  filterProductIssuesByStatus,
  isEvidenceImage,
  resolveProductIssueStatus,
} from "../utils/productIssue.display";
import { PRODUCT_ISSUE_RESOLVED_EVENT } from "../utils/productIssue.realtime";
import { formatTrackingDate } from "../utils/project.tracking.mapper";
import { styles } from "./ProductIssuesCard.styles";

export type ProductIssueOrderItemOption = {
  orderItemId: string;
  itemName: string;
  deliveredQuantity: number;
  quantity?: number;
};

type ProductIssuesCardProps = {
  projectId: string | null;
  orderId?: string | null;
  orderItems?: ProductIssueOrderItemOption[] | OrderItemDto[] | null;
  title?: string;
  allowCreate?: boolean;
  /** Deep link / notification: open detail modal for this issue id. */
  initialIssueId?: string | null;
};

const STATUS_FILTERS: Array<{ id: ProductIssueStatusFilter; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "OPEN", label: "Open" },
  { id: "RESOLVED", label: "Resolved" },
];

function toEligibleItems(
  items: Array<ProductIssueOrderItemOption | OrderItemDto> | null | undefined,
): ProductIssueOrderItemOption[] {
  return (items ?? [])
    .filter((item) => (item.deliveredQuantity ?? 0) > 0)
    .map((item) => ({
      orderItemId: item.orderItemId,
      itemName: item.itemName,
      deliveredQuantity: item.deliveredQuantity,
      quantity: "quantity" in item ? item.quantity : undefined,
    }));
}

export function ProductIssuesCard({
  projectId,
  orderId = null,
  orderItems = null,
  title = "Product issues",
  allowCreate = false,
  initialIssueId = null,
}: ProductIssuesCardProps): React.JSX.Element | null {
  const listByOrder = Boolean(orderId);
  const projectIssuesQuery = useProjectProductIssuesQuery(projectId, Boolean(projectId) && !listByOrder);
  const orderIssuesQuery = useOrderProductIssuesQuery(orderId, listByOrder);
  const issuesQuery = listByOrder ? orderIssuesQuery : projectIssuesQuery;

  const needsOrderFetch = allowCreate && Boolean(orderId) && !orderItems;
  const orderQuery = useOrderDetailQuery(needsOrderFetch ? orderId : null);
  const createMutation = useCreateProductIssueMutation();

  const [statusFilter, setStatusFilter] = useState<ProductIssueStatusFilter>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedOrderItemId, setSelectedOrderItemId] = useState("");
  const [issueType, setIssueType] = useState<DeliveryProductIssueType>("DAMAGED");
  const [description, setDescription] = useState("");
  const [affectedQuantity, setAffectedQuantity] = useState("");
  const [files, setFiles] = useState<ProductIssueEvidenceLocalFile[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const issues = issuesQuery.data?.items ?? [];
  const visibleIssues = useMemo(() => filterProductIssuesByStatus(issues, statusFilter), [issues, statusFilter]);
  const eligibleItems = useMemo(() => {
    if (orderItems) {
      return toEligibleItems(orderItems);
    }
    return toEligibleItems(orderQuery.data?.items);
  }, [orderItems, orderQuery.data?.items]);

  const canReport = allowCreate && Boolean(orderId && eligibleItems.length > 0);
  const selectedItem = eligibleItems.find((item) => item.orderItemId === selectedOrderItemId) ?? null;
  const orderItemsLoading = needsOrderFetch && orderQuery.isPending;

  useEffect(() => {
    if (!initialIssueId) {
      return;
    }

    setSelectedIssueId(initialIssueId);
    const matched = issues.find((issue) => issue.deliveryProductIssueReportId === initialIssueId);
    if (matched && resolveProductIssueStatus(matched) === "RESOLVED") {
      setStatusFilter("ALL");
    }
  }, [initialIssueId, issues]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(PRODUCT_ISSUE_RESOLVED_EVENT, () => {
      setStatusFilter("ALL");
      void issuesQuery.refetch();
    });
    return () => subscription.remove();
  }, [issuesQuery]);

  useEffect(() => {
    if (!isCreateOpen || selectedOrderItemId || eligibleItems.length === 0) {
      return;
    }
    setSelectedOrderItemId(eligibleItems[0].orderItemId);
  }, [eligibleItems, isCreateOpen, selectedOrderItemId]);

  if (!projectId) {
    return null;
  }

  const resetForm = () => {
    setSelectedOrderItemId(eligibleItems[0]?.orderItemId ?? "");
    setIssueType("DAMAGED");
    setDescription("");
    setAffectedQuantity("");
    setFiles([]);
    setFormError(null);
  };

  const openCreate = () => {
    if (!allowCreate) {
      return;
    }
    if (!orderId) {
      Alert.alert("Choose an order", "Select an order with delivered items before reporting an issue.");
      return;
    }
    if (orderItemsLoading) {
      Alert.alert("Please wait", "Loading order items...");
      return;
    }
    if (!canReport) {
      Alert.alert(
        "Not available yet",
        "Issues can be reported after at least one product is physically delivered.",
      );
      return;
    }

    resetForm();
    setIsCreateOpen(true);
  };

  const appendEvidenceFiles = (next: ProductIssueEvidenceLocalFile[]) => {
    if (next.length === 0) {
      return;
    }
    setFiles((current) => [...current, ...next]);
  };

  const handlePickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true,
        type: ["image/*", "application/pdf"],
      });
      if (result.canceled || !result.assets?.length) {
        return;
      }

      appendEvidenceFiles(
        result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name ?? "evidence",
          mimeType: asset.mimeType,
          size: asset.size,
        })),
      );
    } catch {
      Alert.alert("Unable to pick files", "Please try again.");
    }
  };

  const handlePickPhotos = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "Allow photo library access to attach evidence.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ["images"],
        quality: 0.85,
        selectionLimit: 6,
      });
      if (result.canceled || !result.assets?.length) {
        return;
      }

      appendEvidenceFiles(
        result.assets.map((asset, index) => ({
          uri: asset.uri,
          name: asset.fileName ?? `evidence-${index + 1}.jpg`,
          mimeType: asset.mimeType ?? "image/jpeg",
          size: asset.fileSize,
        })),
      );
    } catch {
      Alert.alert("Unable to pick photos", "Please try again.");
    }
  };

  const handleSubmit = () => {
    if (!orderId || !selectedItem) {
      setFormError("Please select a delivered product.");
      return;
    }

    if (!affectedQuantity.trim()) {
      setFormError("Enter how many units are affected.");
      return;
    }

    const quantity = Number(affectedQuantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setFormError("Affected quantity must be a positive whole number.");
      return;
    }
    if (quantity > selectedItem.deliveredQuantity) {
      setFormError(`Value must be less than or equal to ${selectedItem.deliveredQuantity}.`);
      return;
    }
    if (!description.trim()) {
      setFormError("Description is required.");
      return;
    }

    setFormError(null);
    createMutation.mutate(
      {
        orderId,
        orderItemId: selectedItem.orderItemId,
        deliveryItemId: null,
        issueType,
        description: description.trim(),
        affectedQuantity: quantity,
        files,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          resetForm();
          setStatusFilter("ALL");
          Alert.alert("Reported", "Your product issue has been submitted.");
        },
        onError: (error) => {
          setFormError(getProductIssueErrorMessage(error, "Unable to submit the product issue."));
        },
      },
    );
  };

  return (
    <>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.cardLabel}>{title.toUpperCase()}</Text>
            {allowCreate ? (
              <Text style={styles.headerHint}>
                Report damage or defects on items that already have delivered quantity.
              </Text>
            ) : (
              <Text style={styles.headerHint}>View issues reported across this project. Create is only on Tracking.</Text>
            )}
          </View>
          {allowCreate ? (
            <Pressable
              style={[styles.reportButton, (!canReport || orderItemsLoading) && styles.reportButtonDisabled]}
              onPress={openCreate}
              disabled={orderItemsLoading}
            >
              <Text style={styles.reportButtonText}>Report an issue</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter.id;
            return (
              <Pressable
                key={filter.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setStatusFilter(filter.id)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{filter.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {allowCreate && orderId && orderItemsLoading ? (
          <View style={styles.inlineLoading}>
            <ActivityIndicator color="#C9A86A" />
            <Text style={styles.hintText}>Checking delivered items...</Text>
          </View>
        ) : null}

        {issuesQuery.isPending ? (
          <ActivityIndicator color="#C9A86A" />
        ) : issuesQuery.isError ? (
          <Text style={styles.hintText}>
            {getProductIssueErrorMessage(issuesQuery.error, "Unable to load product issues.")}
          </Text>
        ) : issues.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No reports yet</Text>
            <Text style={styles.hintText}>
              {allowCreate
                ? canReport
                  ? "Tap “Report an issue” to file a report for a delivered product."
                  : "Issues can be reported after at least one product is physically delivered."
                : "No product issues have been reported for this project yet."}
            </Text>
          </View>
        ) : visibleIssues.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No {statusFilter.toLowerCase()} issues</Text>
            <Text style={styles.hintText}>Try another filter to see more reports.</Text>
          </View>
        ) : (
          visibleIssues.map((issue) => {
            const status = resolveProductIssueStatus(issue);
            return (
              <Pressable
                key={issue.deliveryProductIssueReportId}
                style={styles.issueRow}
                onPress={() => setSelectedIssueId(issue.deliveryProductIssueReportId)}
              >
                <View style={styles.issueTitleRow}>
                  <Text style={[styles.issueTitle, { flex: 1 }]} numberOfLines={2}>
                    {issue.productNameSnapshot ?? "Product"}
                  </Text>
                  <View style={[styles.typeBadge, status === "RESOLVED" ? styles.statusResolved : styles.statusOpen]}>
                    <Text
                      style={[
                        styles.typeBadgeText,
                        status === "RESOLVED" ? styles.statusResolvedText : styles.statusOpenText,
                      ]}
                    >
                      {formatProductIssueStatusLabel(status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.issueMeta}>{formatProductIssueTypeLabel(issue.issueType)}</Text>
                <Text style={styles.issueMeta} numberOfLines={2}>
                  {issue.description}
                </Text>
                <Text style={styles.issueMeta}>
                  {formatTrackingDate(issue.reportedAt)}
                  {issue.affectedQuantity != null ? ` · Qty ${issue.affectedQuantity}` : ""}
                </Text>
              </Pressable>
            );
          })
        )}
      </View>

      <CreateIssueModal
        visible={allowCreate && isCreateOpen}
        eligibleItems={eligibleItems}
        selectedOrderItemId={selectedOrderItemId}
        issueType={issueType}
        description={description}
        affectedQuantity={affectedQuantity}
        files={files}
        formError={formError}
        isSubmitting={createMutation.isPending}
        onClose={() => setIsCreateOpen(false)}
        onSelectItem={setSelectedOrderItemId}
        onSelectType={setIssueType}
        onChangeDescription={setDescription}
        onChangeQuantity={setAffectedQuantity}
        onPickPhotos={() => void handlePickPhotos()}
        onPickDocuments={() => void handlePickDocuments()}
        onRemoveFile={(index) => setFiles((current) => current.filter((_, i) => i !== index))}
        onSubmit={handleSubmit}
      />

      <IssueDetailModal issueId={selectedIssueId} onClose={() => setSelectedIssueId(null)} />
    </>
  );
}

function CreateIssueModal({
  visible,
  eligibleItems,
  selectedOrderItemId,
  issueType,
  description,
  affectedQuantity,
  files,
  formError,
  isSubmitting,
  onClose,
  onSelectItem,
  onSelectType,
  onChangeDescription,
  onChangeQuantity,
  onPickPhotos,
  onPickDocuments,
  onRemoveFile,
  onSubmit,
}: Readonly<{
  visible: boolean;
  eligibleItems: ProductIssueOrderItemOption[];
  selectedOrderItemId: string;
  issueType: DeliveryProductIssueType;
  description: string;
  affectedQuantity: string;
  files: ProductIssueEvidenceLocalFile[];
  formError: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSelectItem: (orderItemId: string) => void;
  onSelectType: (type: DeliveryProductIssueType) => void;
  onChangeDescription: (value: string) => void;
  onChangeQuantity: (value: string) => void;
  onPickPhotos: () => void;
  onPickDocuments: () => void;
  onRemoveFile: (index: number) => void;
  onSubmit: () => void;
}>): React.JSX.Element {
  const selected = eligibleItems.find((item) => item.orderItemId === selectedOrderItemId) ?? null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report a delivered product issue</Text>
            <Pressable style={styles.closeButton} onPress={onClose} disabled={isSubmitting}>
              <AppIcon definition={closeIconDefinition} size={14} color="#3A3330" strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Delivered product</Text>
            <Text style={styles.fieldHint}>Only items with delivered quantity &gt; 0 can be reported.</Text>
            {eligibleItems.map((item) => {
              const active = item.orderItemId === selectedOrderItemId;
              return (
                <Pressable
                  key={item.orderItemId}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                  onPress={() => onSelectItem(item.orderItemId)}
                >
                  <Text style={styles.optionChipTitle}>{item.itemName}</Text>
                  <Text style={styles.optionChipMeta}>
                    Delivered {item.deliveredQuantity}
                    {item.quantity != null ? ` / ${item.quantity}` : ""}
                  </Text>
                </Pressable>
              );
            })}

            <Text style={styles.fieldLabel}>Issue type</Text>
            <View style={styles.typeRow}>
              {DELIVERY_PRODUCT_ISSUE_TYPES.map((type) => {
                const active = type === issueType;
                return (
                  <Pressable
                    key={type}
                    style={[styles.typeChip, active && styles.typeChipActive]}
                    onPress={() => onSelectType(type)}
                  >
                    <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                      {formatProductIssueTypeLabel(type)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Affected quantity</Text>
            <TextInput
              style={styles.input}
              value={affectedQuantity}
              onChangeText={onChangeQuantity}
              keyboardType="number-pad"
              placeholder={selected ? `1 – ${selected.deliveredQuantity}` : "e.g. 1"}
              placeholderTextColor="#A89F97"
            />
            {selected ? (
              <Text style={styles.fieldHint}>
                Enter how many units are affected (max {selected.deliveredQuantity}).
              </Text>
            ) : null}

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={onChangeDescription}
              multiline
              placeholder="Describe the issue..."
              placeholderTextColor="#A89F97"
            />

            <Text style={styles.fieldLabel}>Evidence (optional)</Text>
            <View style={styles.evidenceActions}>
              <Pressable style={[styles.secondaryButton, styles.evidenceAction]} onPress={onPickPhotos}>
                <Text style={styles.secondaryButtonText}>Add photos</Text>
              </Pressable>
              <Pressable style={[styles.secondaryButton, styles.evidenceAction]} onPress={onPickDocuments}>
                <Text style={styles.secondaryButtonText}>Add PDF / file</Text>
              </Pressable>
            </View>
            {files.map((file, index) => (
              <View key={`${file.uri}-${index}`} style={styles.fileRow}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <Pressable onPress={() => onRemoveFile(index)} disabled={isSubmitting}>
                  <Text style={styles.removeFileText}>Remove</Text>
                </Pressable>
              </View>
            ))}

            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

            <Pressable
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
              disabled={isSubmitting}
              onPress={onSubmit}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Submit report</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function IssueDetailModal({
  issueId,
  onClose,
}: Readonly<{
  issueId: string | null;
  onClose: () => void;
}>): React.JSX.Element {
  const detailQuery = useProductIssueDetailQuery(issueId);
  const issue = detailQuery.data;

  return (
    <Modal visible={Boolean(issueId)} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Issue detail</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <AppIcon definition={closeIconDefinition} size={14} color="#3A3330" strokeWidth={2} />
            </Pressable>
          </View>

          {detailQuery.isPending ? (
            <ActivityIndicator color="#C9A86A" />
          ) : detailQuery.isError || !issue ? (
            <Text style={styles.hintText}>
              {getProductIssueErrorMessage(detailQuery.error, "Unable to load issue detail.")}
            </Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <IssueDetailBody issue={issue} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function IssueDetailBody({ issue }: Readonly<{ issue: ProductIssueReportDto }>): React.JSX.Element {
  const status = resolveProductIssueStatus(issue);

  return (
    <>
      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>Product</Text>
        <Text style={styles.detailValue}>{issue.productNameSnapshot ?? "Product"}</Text>
      </View>
      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>Type</Text>
        <Text style={styles.detailValue}>{formatProductIssueTypeLabel(issue.issueType)}</Text>
      </View>
      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>Status</Text>
        <Text style={styles.detailValue}>{formatProductIssueStatusLabel(status)}</Text>
      </View>
      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>Description</Text>
        <Text style={styles.detailValue}>{issue.description}</Text>
      </View>
      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>Affected quantity</Text>
        <Text style={styles.detailValue}>{issue.affectedQuantity ?? "—"}</Text>
      </View>
      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>Reported</Text>
        <Text style={styles.detailValue}>
          {formatTrackingDate(issue.reportedAt)}
          {issue.reporterName ? ` · ${issue.reporterName}` : ""}
        </Text>
      </View>
      {status === "RESOLVED" ? (
        <>
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Resolved</Text>
            <Text style={styles.detailValue}>{formatTrackingDate(issue.resolvedAt)}</Text>
          </View>
          {issue.resolutionNote ? (
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Resolution note</Text>
              <Text style={styles.detailValue}>{issue.resolutionNote}</Text>
            </View>
          ) : null}
        </>
      ) : null}
      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>Evidence</Text>
        {(issue.evidenceFiles?.length ?? 0) === 0 ? (
          <Text style={styles.detailValue}>No evidence files.</Text>
        ) : (
          issue.evidenceFiles?.map((file) => {
            const isImage = isEvidenceImage(file.mimeType, file.originalFileName);
            return (
              <Pressable key={file.fileId} onPress={() => void Linking.openURL(file.fileUrl)}>
                {isImage ? (
                  <Image source={{ uri: file.fileUrl }} style={styles.evidenceThumb} resizeMode="cover" />
                ) : (
                  <View style={styles.evidenceFileChip}>
                    <Text style={styles.evidenceFileChipText} numberOfLines={1}>
                      {file.originalFileName || "Open attachment"}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })
        )}
      </View>
    </>
  );
}
