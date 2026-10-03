import React, { useEffect, useMemo, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { AppIcon } from "../../../shared/components/AppIcon";
import { KeyboardSafeScroll } from "../../../shared/components/KeyboardSafe";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { arrowLeftIconDefinition } from "../../../icons/navigation/definitions";
import { calendarIconDefinition } from "../../../icons/project/definitions";
import { trashIconDefinition } from "../../../icons/action/definitions";
import { fileIconDefinition, uploadIconDefinition } from "../../../icons/file/definitions";
import { useUpdateProjectBasicInfoMutation } from "../hooks/useCustomerFlow";
import { useProjectDetailQuery } from "../hooks/useProjects";
import { uploadCustomerProjectFileApi } from "../services/project.api";
import {
  BUSINESS_TYPE_MAX,
  FURNITURE_REQUIREMENT_MAX,
  PROJECT_ADDRESS_MAX,
  PROJECT_DESCRIPTION_MAX,
  PROJECT_NAME_MAX,
  buildUpdateBasicInfoPayload,
  validateUpdateProjectBasicInfoForm,
} from "../utils/projectRequest.form";
import { formatTrackingDate } from "../utils/project.tracking.mapper";
import { styles } from "./CreateProjectRequestScreen.styles";

type Route = RouteProp<RootStackParamList, "UpdateProjectBasicInfo">;
type FormErrors = ReturnType<typeof validateUpdateProjectBasicInfoForm>;

const BUSINESS_TYPES = ["Cafe", "Retail", "Office", "Restaurant", "Showroom"] as const;

function formatApiDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseApiDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatVndInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const groups: string[] = [];
  for (let end = digits.length; end > 0; end -= 3) {
    groups.unshift(digits.slice(Math.max(0, end - 3), end));
  }
  return groups.join(".");
}

function formatOptionalNumber(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? "" : String(value);
}

function formatOptionalMoney(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? "" : formatVndInput(String(Math.round(value)));
}

function resolveProjectFileType(
  asset: DocumentPicker.DocumentPickerAsset,
): "FLOOR_PLAN" | "REFERENCE_IMAGE" | "OTHER" {
  const mimeType = asset.mimeType?.toLowerCase() ?? "";
  const name = asset.name.toLowerCase();
  if (mimeType.startsWith("image/")) return "REFERENCE_IMAGE";
  if (mimeType.includes("pdf") || name.endsWith(".pdf")) return "FLOOR_PLAN";
  return "OTHER";
}

export function UpdateProjectBasicInfoScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { projectId } = route.params;
  const { data: project, isLoading } = useProjectDetailQuery(projectId);
  const updateMutation = useUpdateProjectBasicInfoMutation(projectId);

  const [projectName, setProjectName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [furnitureRequirement, setFurnitureRequirement] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [businessPurpose, setBusinessPurpose] = useState("");
  const [description, setDescription] = useState("");
  const [totalAreaSqm, setTotalAreaSqm] = useState("");
  const [numberOfFloors, setNumberOfFloors] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [targetCompletionDate, setTargetCompletionDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBusinessTypes, setShowBusinessTypes] = useState(false);
  const [projectFiles, setProjectFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!project || initialized) return;
    setProjectName(project.projectName ?? "");
    setBusinessType(project.businessType ?? "");
    setFurnitureRequirement(project.furnitureRequirement ?? "");
    setProjectAddress(project.projectAddress ?? "");
    setBusinessPurpose(project.businessPurpose ?? "");
    setDescription(project.description ?? "");
    setTotalAreaSqm(formatOptionalNumber(project.totalAreaSqm));
    setNumberOfFloors(formatOptionalNumber(project.numberOfFloors));
    setBudgetMin(formatOptionalMoney(project.budgetMin));
    setBudgetMax(formatOptionalMoney(project.budgetMax));
    setTargetCompletionDate(parseApiDate(project.targetCompletionDate));
    setInitialized(true);
  }, [project, initialized]);

  const formInput = useMemo(
    () => ({
      projectName,
      businessType,
      furnitureRequirement,
      projectAddress,
      businessPurpose,
      description,
      totalAreaSqm,
      numberOfFloors,
      budgetMin,
      budgetMax,
      targetCompletionDate: targetCompletionDate ? formatApiDate(targetCompletionDate) : null,
    }),
    [
      budgetMax,
      budgetMin,
      businessPurpose,
      businessType,
      description,
      furnitureRequirement,
      numberOfFloors,
      projectAddress,
      projectName,
      targetCompletionDate,
      totalAreaSqm,
    ],
  );

  const handlePickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf", "*/*"],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const copied: DocumentPicker.DocumentPickerAsset[] = [];
      for (const asset of result.assets) {
        try {
          const dest = `${FileSystem.cacheDirectory}update-${Date.now()}-${asset.name}`;
          await FileSystem.copyAsync({ from: asset.uri, to: dest });
          copied.push({ ...asset, uri: dest });
        } catch {
          copied.push(asset);
        }
      }
      setProjectFiles((current) => [...current, ...copied]);
    } catch (error) {
      Alert.alert("Unable to pick files", getErrorMessage(error, "Please try again."));
    }
  };

  const handleSubmit = async () => {
    setHasSubmitted(true);
    const nextErrors = validateUpdateProjectBasicInfoForm(formInput);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const { payload, targetCompletionDate: nextTargetDate } = buildUpdateBasicInfoPayload(formInput);
    const originalTargetDate = project?.targetCompletionDate?.slice(0, 10) ?? null;

    try {
      if (projectFiles.length > 0) {
        setIsUploadingFiles(true);
        for (const [index, file] of projectFiles.entries()) {
          await uploadCustomerProjectFileApi(projectId, {
            uri: file.uri,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size,
            fileType: resolveProjectFileType(file),
            visibility: "CUSTOMER_VISIBLE",
            displayOrder: index,
            note: "Customer updated project information attachment",
          });
        }
        setIsUploadingFiles(false);
      }

      updateMutation.mutate(
        {
          ...payload,
          targetCompletionDate: nextTargetDate,
          shouldUpdateTargetCompletionDate: nextTargetDate !== originalTargetDate,
        },
        {
          onSuccess: () => {
            Alert.alert("Information Updated", "Your project details have been saved.", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
          },
          onError: (error) => Alert.alert("Update Failed", getErrorMessage(error, "Request failed. Please try again.")),
        },
      );
    } catch (error) {
      setIsUploadingFiles(false);
      Alert.alert(
        "Upload Failed",
        getErrorMessage(error, "File upload failed. Information was not submitted."),
      );
    }
  };

  const showError = (field: keyof FormErrors) => (hasSubmitted ? errors[field] : undefined);
  const busy = updateMutation.isPending || isUploadingFiles;

  if (isLoading && !initialized) {
    return (
      <ScreenContainer style={styles.screen}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator size="large" color="#C9A86A" />
          <Text style={{ color: "#7A6F68" }}>Loading project...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.screen} keyboard={false}>
      <KeyboardSafeScroll style={styles.screen} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <AppIcon definition={arrowLeftIconDefinition} size={18} color="#FFFFFF" strokeWidth={1.8} />
            </Pressable>
            <View>
              <Text style={styles.brandText}>FURNISPACE</Text>
              <Text style={styles.headerTitle}>Update Information</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            {project?.status === "NEED_BASIC_INFORMATION"
              ? "Sales requested additional details. Update the fields below and save."
              : "Update your project basic information."}
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Project Information</Text>
            <FormField
              label="Project Name"
              required
              value={projectName}
              onChangeText={setProjectName}
              maxLength={PROJECT_NAME_MAX}
              error={showError("projectName")}
            />
            <BusinessTypeSelect
              value={businessType}
              open={showBusinessTypes}
              onToggle={() => setShowBusinessTypes((current) => !current)}
              onSelect={(value) => {
                setBusinessType(value);
                setShowBusinessTypes(false);
              }}
              error={showError("businessType")}
            />
            <FormField
              label="Furniture Requirement"
              required
              value={furnitureRequirement}
              onChangeText={setFurnitureRequirement}
              multiline
              maxLength={FURNITURE_REQUIREMENT_MAX}
              error={showError("furnitureRequirement")}
            />
            <FormField
              label="Project Address"
              value={projectAddress}
              onChangeText={setProjectAddress}
              maxLength={PROJECT_ADDRESS_MAX}
              error={showError("projectAddress")}
            />
            <FormField
              label="Business Purpose"
              value={businessPurpose}
              onChangeText={setBusinessPurpose}
              maxLength={PROJECT_DESCRIPTION_MAX}
            />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Space Details</Text>
            <View style={styles.fieldRow}>
              <View style={styles.fieldColumn}>
                <FormField
                  label="Total Area (sqm)"
                  value={totalAreaSqm}
                  onChangeText={setTotalAreaSqm}
                  keyboardType="decimal-pad"
                  error={showError("totalAreaSqm")}
                />
              </View>
              <View style={styles.fieldColumn}>
                <FormField
                  label="Number of Floors"
                  value={numberOfFloors}
                  onChangeText={setNumberOfFloors}
                  keyboardType="number-pad"
                  error={showError("numberOfFloors")}
                />
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Budget & Timeline</Text>
            <View style={styles.fieldRow}>
              <View style={styles.fieldColumn}>
                <FormField
                  label="Minimum Budget"
                  value={budgetMin}
                  onChangeText={(value) => setBudgetMin(formatVndInput(value))}
                  keyboardType="number-pad"
                  suffix="VND"
                  error={showError("budgetMin")}
                />
              </View>
              <View style={styles.fieldColumn}>
                <FormField
                  label="Maximum Budget"
                  value={budgetMax}
                  onChangeText={(value) => setBudgetMax(formatVndInput(value))}
                  keyboardType="number-pad"
                  suffix="VND"
                  error={showError("budgetMax")}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Target Completion Date</Text>
              <View style={[styles.dateField, showError("targetCompletionDate") ? styles.inputError : null]}>
                <Pressable style={styles.dateFieldMain} onPress={() => setShowDatePicker(true)}>
                  <AppIcon definition={calendarIconDefinition} size={16} color="#7A6F68" />
                  <Text style={[styles.dateFieldText, !targetCompletionDate && styles.dateFieldPlaceholder]}>
                    {targetCompletionDate ? formatTrackingDate(formatApiDate(targetCompletionDate)) : "Select date"}
                  </Text>
                </Pressable>
                {targetCompletionDate ? (
                  <Pressable hitSlop={8} onPress={() => setTargetCompletionDate(null)}>
                    <Text style={styles.dateClearText}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>
              {showError("targetCompletionDate") ? (
                <Text style={styles.errorText}>{showError("targetCompletionDate")}</Text>
              ) : null}
            </View>
          </View>

          {showDatePicker ? (
            <DateTimePicker
              value={targetCompletionDate ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date()}
              onValueChange={(_event, date) => {
                if (Platform.OS === "android") setShowDatePicker(false);
                if (!date) return;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const selected = new Date(date);
                selected.setHours(0, 0, 0, 0);
                setTargetCompletionDate(selected < today ? today : date);
              }}
              onDismiss={() => setShowDatePicker(false)}
            />
          ) : null}

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Attachments (optional)</Text>
            <Pressable style={styles.uploadArea} onPress={() => void handlePickFiles()}>
              <View style={styles.uploadIcon}>
                <AppIcon definition={uploadIconDefinition} size={24} color="#7A6F68" strokeWidth={1.8} />
              </View>
              <Text style={styles.uploadTitle}>Tap to select files</Text>
              <Text style={styles.uploadHint}>Images or PDFs · uploaded before saving info</Text>
            </Pressable>
            {projectFiles.map((file) => (
              <View key={`${file.uri}:${file.name}`} style={styles.fileRow}>
                <AppIcon definition={fileIconDefinition} size={18} color="#C9A86A" />
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={() => setProjectFiles((current) => current.filter((item) => item !== file))}
                >
                  <AppIcon definition={trashIconDefinition} size={17} color="#A45B54" />
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <FormField
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={PROJECT_DESCRIPTION_MAX}
              error={showError("description")}
            />
          </View>

          <Pressable
            style={[styles.submitButton, busy && styles.submitButtonDisabled]}
            disabled={busy}
            onPress={() => void handleSubmit()}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Save Changes</Text>
            )}
          </Pressable>
        </View>
      </KeyboardSafeScroll>
    </ScreenContainer>
  );
}

function BusinessTypeSelect({
  value,
  open,
  onToggle,
  onSelect,
  error,
}: Readonly<{
  value: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  error?: string;
}>): React.JSX.Element {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>
        Business Type
        <Text style={styles.requiredMark}> *</Text>
      </Text>
      <Pressable
        style={[styles.selectField, open && styles.selectFieldOpen, error ? styles.inputError : null]}
        onPress={onToggle}
      >
        <Text style={[styles.selectValue, !value && styles.selectPlaceholder]}>
          {value || "Select business type"}
        </Text>
      </Pressable>
      {open ? (
        <View style={styles.selectOptions}>
          {BUSINESS_TYPES.map((option, index) => (
            <Pressable
              key={option}
              style={[styles.selectOption, index < BUSINESS_TYPES.length - 1 && styles.selectOptionDivider]}
              onPress={() => onSelect(option)}
            >
              <Text style={styles.selectOptionText}>{option}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {value && !BUSINESS_TYPES.includes(value as (typeof BUSINESS_TYPES)[number]) ? (
        <TextInput
          style={[styles.input, { marginTop: 8 }]}
          value={value}
          onChangeText={onSelect}
          maxLength={BUSINESS_TYPE_MAX}
          placeholderTextColor="#B8ADA4"
        />
      ) : null}
    </View>
  );
}

function FormField({
  label,
  required,
  value,
  onChangeText,
  multiline,
  maxLength,
  keyboardType,
  suffix,
  error,
}: Readonly<{
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: "default" | "number-pad" | "decimal-pad";
  suffix?: string;
  error?: string;
}>): React.JSX.Element {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.requiredMark}> *</Text> : null}
      </Text>
      <View style={suffix ? styles.inputSuffixWrap : undefined}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            suffix ? styles.inputWithSuffix : null,
            error ? styles.inputError : null,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor="#B8ADA4"
          multiline={multiline}
          maxLength={maxLength}
          keyboardType={keyboardType}
        />
        {suffix ? <Text style={styles.inputSuffix}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}
