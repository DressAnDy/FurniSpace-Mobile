import React, { useMemo, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import {
  ActivityIndicator,
  Alert,
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
  formatProductIssueTypeLabel,
  useCreateProductIssueMutation,
  useProductIssueDetailQuery,
  useProjectProductIssuesQuery,
} from "../hooks/useProductIssues";
import {
  DELIVERY_PRODUCT_ISSUE_TYPES,
  DeliveryProductIssueType,
  ProductIssueEvidenceLocalFile,
  ProductIssueReportDto,
} from "../models/productIssue.model";
import { getProductIssueErrorMessage } from "../services/productIssue.api";
import { formatTrackingDate } from "../utils/project.tracking.mapper";
import { styles } from "./ProductIssuesCard.styles";

type ProductIssuesCardProps = {
  projectId: string | null;
  orderId?: string | null;
  /** CUSTOMER can create; SALES/PRODUCTION/ADMIN are read-only per BE docs. */
  allowCreate?: boolean;
};

export function ProductIssuesCard({
  projectId,
  orderId = null,
  allowCreate = true,
}: ProductIssuesCardProps): React.JSX.Element | null {
  const issuesQuery = useProjectProductIssuesQuery(projectId, Boolean(projectId));
  const orderQuery = useOrderDetailQuery(allowCreate ? orderId : null);
  const createMutation = useCreateProductIssueMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedOrderItemId, setSelectedOrderItemId] = useState<string>("");
  const [issueType, setIssueType] = useState<DeliveryProductIssueType>("DAMAGED");
  const [description, setDescription] = useState("");
  const [affectedQuantity, setAffectedQuantity] = useState("");
  const [files, setFiles] = useState<ProductIssueEvidenceLocalFile[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const issues = issuesQuery.data?.items ?? [];
  const eligibleItems = useMemo(
    () => (orderQuery.data?.items ?? []).filter((item) => (item.deliveredQuantity ?? 0) > 0),
    [orderQuery.data?.items],
  );
  const canReport = allowCreate && Boolean(orderId && eligibleItems.length > 0);
  const selectedItem = eligibleItems.find((item) => item.orderItemId === selectedOrderItemId) ?? null;

  if (!projectId) {
    return null;
  }

  const openCreate = () => {
    if (!allowCreate) {
      return;
    }
    if (!canReport) {
      Alert.alert(
        "Not available yet",
        "Product issues can be reported after at least one item has been delivered.",
      );
      return;
    }

    setSelectedOrderItemId(eligibleItems[0]?.orderItemId ?? "");
    setIssueType("DAMAGED");
    setDescription("");
    setAffectedQuantity("");
    setFiles([]);
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handlePickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true,
        type: ["image/*", "application/pdf"],
      });
      if (result.canceled || !result.assets?.length) {
        return;
      }

      setFiles((current) => [
        ...current,
        ...result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name ?? "evidence",
          mimeType: asset.mimeType,
        })),
      ]);
    } catch {
      Alert.alert("Unable to pick files", "Please try again.");
    }
  };

  const handleSubmit = () => {
    if (!orderId || !selectedItem) {
      setFormError("Please select a delivered product.");
      return;
    }

    const quantity = Number(affectedQuantity);
    if (!affectedQuantity.trim() || !Number.isInteger(quantity) || quantity <= 0) {
      setFormError("Affected quantity must be a positive whole number.");
      return;
    }
    if (quantity > selectedItem.deliveredQuantity) {
      setFormError(`Affected quantity must be ≤ ${selectedItem.deliveredQuantity}.`);
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
        issueType,
        description: description.trim(),
        affectedQuantity: quantity,
        files,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
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
          <Text style={styles.cardLabel}>PRODUCT ISSUES</Text>
          {allowCreate ? (
            <Pressable
              style={[styles.reportButton, !canReport && styles.reportButtonDisabled]}
              onPress={openCreate}
            >
              <Text style={styles.reportButtonText}>Report issue</Text>
            </Pressable>
          ) : null}
        </View>

        {issuesQuery.isPending ? (
          <ActivityIndicator color="#C9A86A" />
        ) : issuesQuery.isError ? (
          <Text style={styles.hintText}>
            {getProductIssueErrorMessage(issuesQuery.error, "Unable to load product issues.")}
          </Text>
        ) : issues.length === 0 ? (
          <Text style={styles.hintText}>
            {allowCreate
              ? canReport
                ? "No product issues reported yet. You can report damage or defects after delivery."
                : "Issues can be reported after at least one product is physically delivered."
              : "No product issues reported for this project yet."}
          </Text>
        ) : (
          issues.map((issue) => (
            <Pressable
              key={issue.deliveryProductIssueReportId}
              style={styles.issueRow}
              onPress={() => setSelectedIssueId(issue.deliveryProductIssueReportId)}
            >
              <Text style={styles.issueTitle}>
                {issue.productNameSnapshot ?? "Product"} · {formatProductIssueTypeLabel(issue.issueType)}
              </Text>
              <Text style={styles.issueMeta} numberOfLines={2}>
                {issue.description}
              </Text>
              <Text style={styles.issueMeta}>
                {formatTrackingDate(issue.reportedAt)}
                {issue.affectedQuantity != null ? ` · Qty ${issue.affectedQuantity}` : ""}
              </Text>
            </Pressable>
          ))
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
        onPickFiles={() => void handlePickFiles()}
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
  onPickFiles,
  onRemoveFile,
  onSubmit,
}: Readonly<{
  visible: boolean;
  eligibleItems: Array<{ orderItemId: string; itemName: string; deliveredQuantity: number }>;
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
  onPickFiles: () => void;
  onRemoveFile: (index: number) => void;
  onSubmit: () => void;
}>): React.JSX.Element {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report product issue</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <AppIcon definition={closeIconDefinition} size={14} color="#3A3330" strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Delivered product</Text>
            {eligibleItems.map((item) => {
              const active = item.orderItemId === selectedOrderItemId;
              return (
                <Pressable
                  key={item.orderItemId}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                  onPress={() => onSelectItem(item.orderItemId)}
                >
                  <Text style={styles.optionChipTitle}>{item.itemName}</Text>
                  <Text style={styles.optionChipMeta}>Delivered qty · {item.deliveredQuantity}</Text>
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
              placeholder="e.g. 1"
              placeholderTextColor="#A89F97"
            />

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
            <Pressable style={styles.secondaryButton} onPress={onPickFiles}>
              <Text style={styles.secondaryButtonText}>Add photos / PDF</Text>
            </Pressable>
            {files.map((file, index) => (
              <View key={`${file.uri}-${index}`} style={styles.fileRow}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <Pressable onPress={() => onRemoveFile(index)}>
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
      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>Evidence</Text>
        {(issue.evidenceFiles?.length ?? 0) === 0 ? (
          <Text style={styles.detailValue}>No evidence files.</Text>
        ) : (
          issue.evidenceFiles?.map((file) => (
            <Pressable key={file.fileId} onPress={() => void Linking.openURL(file.fileUrl)}>
              <Text style={styles.evidenceLink}>{file.originalFileName || "Open file"}</Text>
            </Pressable>
          ))
        )}
      </View>
    </>
  );
}
