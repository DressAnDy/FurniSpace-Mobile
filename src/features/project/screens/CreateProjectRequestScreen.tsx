import React, { useMemo, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { TextInputProps } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { arrowLeftIconDefinition, chevronDownIconDefinition } from "../../../icons/navigation/definitions";
import { calendarIconDefinition } from "../../../icons/project/definitions";
import { trashIconDefinition } from "../../../icons/action/definitions";
import { fileIconDefinition, uploadIconDefinition } from "../../../icons/file/definitions";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { useCreateProjectMutation } from "../hooks/useProjects";
import { CreateProjectRequestDto } from "../models/project.model";
import { uploadCustomerProjectFileApi } from "../services/project.api";
import { formatTrackingDate } from "../utils/project.tracking.mapper";
import { styles } from "./CreateProjectRequestScreen.styles";

type FormErrors = Partial<Record<keyof CreateProjectRequestDto, string>>;
const BUSINESS_TYPES = ["Cafe", "Retail", "Office", "Restaurant", "Showroom"] as const;

function validateForm(values: CreateProjectRequestDto): FormErrors {
  const errors: FormErrors = {};

  if (!values.projectName.trim()) {
    errors.projectName = "Project name is required.";
  }

  if (!values.businessType.trim()) {
    errors.businessType = "Business type is required.";
  }

  if (!values.furnitureRequirement.trim()) {
    errors.furnitureRequirement = "Furniture requirement is required.";
  }

  return errors;
}

function formatApiDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function parseOptionalNumber(value: string): number | undefined {
  const normalized = value.trim().replace(/[,\s]/g, "");
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseVndAmount(value: string): number | undefined {
  const digits = value.replace(/\D/g, "");
  if (!digits) return undefined;
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatVndInput(value: string): string {
  let digits = value.replace(/\D/g, "");
  while (digits.length > 1 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  const groups: string[] = [];
  for (let end = digits.length; end > 0; end -= 3) {
    groups.unshift(digits.slice(Math.max(0, end - 3), end));
  }
  return groups.join(".");
}

function resolveProjectFileType(
  asset: DocumentPicker.DocumentPickerAsset,
): "REFERENCE_IMAGE" | "PDF_DRAWING" | "MODEL_3D" | "OTHER" {
  const mimeType = asset.mimeType?.toLowerCase() ?? "";
  const name = asset.name.toLowerCase();
  if (mimeType.startsWith("image/")) return "REFERENCE_IMAGE";
  if (mimeType.includes("pdf") || name.endsWith(".pdf")) return "PDF_DRAWING";
  if (
    mimeType.startsWith("model/") ||
    [".glb", ".gltf", ".obj", ".fbx", ".stl", ".3ds"].some((extension) => name.endsWith(extension))
  ) {
    return "MODEL_3D";
  }
  return "OTHER";
}

export function CreateProjectRequestScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const createProjectMutation = useCreateProjectMutation();

  const [projectName, setProjectName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [furnitureRequirement, setFurnitureRequirement] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [description, setDescription] = useState("");
  const [totalAreaSqm, setTotalAreaSqm] = useState("");
  const [numberOfFloors, setNumberOfFloors] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [projectFiles, setProjectFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [targetCompletionDate, setTargetCompletionDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBusinessTypes, setShowBusinessTypes] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const formValues = useMemo<CreateProjectRequestDto>(
    () => ({
      projectName: projectName.trim(),
      businessType: businessType.trim(),
      furnitureRequirement: furnitureRequirement.trim(),
      ...(projectAddress.trim() ? { projectAddress: projectAddress.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(parseOptionalNumber(totalAreaSqm) !== undefined
        ? { totalAreaSqm: parseOptionalNumber(totalAreaSqm) }
        : {}),
      ...(parseOptionalNumber(numberOfFloors) !== undefined
        ? { numberOfFloors: parseOptionalNumber(numberOfFloors) }
        : {}),
      ...(parseVndAmount(budgetMin) !== undefined ? { budgetMin: parseVndAmount(budgetMin) } : {}),
      ...(parseVndAmount(budgetMax) !== undefined ? { budgetMax: parseVndAmount(budgetMax) } : {}),
      ...(targetCompletionDate ? { targetCompletionDate: formatApiDate(targetCompletionDate) } : {}),
    }),
    [
      budgetMax,
      budgetMin,
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

  const handleTargetDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (event.type === "dismissed" || !date) {
      return;
    }

    setTargetCompletionDate(date);
  };

  const handleSubmit = () => {
    setHasSubmitted(true);
    const nextErrors = validateForm(formValues);
    const parsedArea = parseOptionalNumber(totalAreaSqm);
    const parsedFloors = parseOptionalNumber(numberOfFloors);
    const parsedBudgetMin = parseVndAmount(budgetMin);
    const parsedBudgetMax = parseVndAmount(budgetMax);
    if (totalAreaSqm.trim() && (!parsedArea || parsedArea <= 0)) {
      nextErrors.totalAreaSqm = "Total area must be greater than 0.";
    }
    if (numberOfFloors.trim() && (!parsedFloors || parsedFloors <= 0 || !Number.isInteger(parsedFloors))) {
      nextErrors.numberOfFloors = "Number of floors must be a positive whole number.";
    }
    if (budgetMin.trim() && (parsedBudgetMin === undefined || parsedBudgetMin < 0)) {
      nextErrors.budgetMin = "Minimum budget is invalid.";
    }
    if (budgetMax.trim() && (parsedBudgetMax === undefined || parsedBudgetMax < 0)) {
      nextErrors.budgetMax = "Maximum budget is invalid.";
    }
    if (parsedBudgetMin !== undefined && parsedBudgetMax !== undefined && parsedBudgetMax < parsedBudgetMin) {
      nextErrors.budgetMax = "Maximum budget must be greater than or equal to minimum budget.";
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    createProjectMutation.mutate(formValues, {
      onSuccess: async (project) => {
        setIsUploadingFiles(projectFiles.length > 0);
        const uploadResults = await Promise.allSettled(
          projectFiles.map((file, index) =>
            uploadCustomerProjectFileApi(project.projectId, {
              uri: file.uri,
              name: file.name,
              mimeType: file.mimeType,
              fileType: resolveProjectFileType(file),
              isPrimary: index === 0,
              displayOrder: index,
              note: "Uploaded from mobile project request",
            }),
          ),
        );
        setIsUploadingFiles(false);
        const failedUploads = uploadResults.filter(
          (result): result is PromiseRejectedResult => result.status === "rejected",
        );
        const uploadError = failedUploads[0]
          ? getErrorMessage(failedUploads[0].reason, "The selected file was rejected by the server.")
          : null;
        const message = failedUploads.length
          ? `Project was created, but ${failedUploads.length} file(s) could not be uploaded.\n\n${uploadError}`
          : "Your project request has been sent. Our team will review it shortly.";
        Alert.alert("Request Submitted", message, [
          {
            text: "View Tracking",
            onPress: () => navigation.replace("Tracking", { projectId: project.projectId }),
          },
        ]);
      },
      onError: (error) => {
        Alert.alert("Submission Failed", getErrorMessage(error));
      },
    });
  };

  const handlePickFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf", "model/*", "application/octet-stream"],
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      setProjectFiles((current) => {
        const existing = new Set(current.map((file) => `${file.name}:${file.size ?? 0}`));
        return [
          ...current,
          ...result.assets.filter((file) => !existing.has(`${file.name}:${file.size ?? 0}`)),
        ];
      });
    }
  };

  const showError = (field: keyof CreateProjectRequestDto) => (hasSubmitted ? errors[field] : undefined);

  return (
    <ScreenContainer style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                <AppIcon definition={arrowLeftIconDefinition} size={18} color="#FFFFFF" strokeWidth={1.8} />
              </Pressable>
              <View>
                <Text style={styles.brandText}>FURNISPACE</Text>
                <Text style={styles.headerTitle}>Submit Project Request</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              Tell us about your space and furniture needs. Your request will start at the Submitted stage.
            </Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.hintText}>
              Required fields are marked with *. After submission, track progress on the Tracking screen.
            </Text>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Project Information</Text>
              <FormField
                label="Project Name"
                required
                value={projectName}
                onChangeText={setProjectName}
                placeholder="Urban Coffee House"
                error={showError("projectName")}
              />

              <BusinessTypeSelect
                label="Business Type"
                required
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
                placeholder="Describe the furniture and scope you need"
                multiline
                error={showError("furnitureRequirement")}
              />

              <FormField
                label="Project Address"
                value={projectAddress}
                onChangeText={setProjectAddress}
                placeholder="Street, district, city"
                error={showError("projectAddress")}
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
                    placeholder="e.g., 120"
                    keyboardType="decimal-pad"
                    error={showError("totalAreaSqm")}
                  />
                </View>
                <View style={styles.fieldColumn}>
                  <FormField
                    label="Number of Floors"
                    value={numberOfFloors}
                    onChangeText={setNumberOfFloors}
                    placeholder="e.g., 1"
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
                    placeholder="e.g., 100.000"
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
                    placeholder="e.g., 1.000.000"
                    keyboardType="number-pad"
                    suffix="VND"
                    error={showError("budgetMax")}
                  />
                </View>
              </View>

              <TargetDateField
                value={targetCompletionDate}
                onPress={() => setShowDatePicker(true)}
                onClear={() => setTargetCompletionDate(null)}
                error={showError("targetCompletionDate")}
              />
            </View>

            {showDatePicker ? (
              <DateTimePicker
                value={targetCompletionDate ?? startOfToday()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={startOfToday()}
                onChange={handleTargetDateChange}
              />
            ) : null}

            {Platform.OS === "ios" && showDatePicker ? (
              <Pressable style={styles.datePickerDoneButton} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.datePickerDoneText}>Done</Text>
              </Pressable>
            ) : null}

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Project Files</Text>
              <Pressable style={styles.uploadArea} onPress={() => void handlePickFiles()}>
                <View style={styles.uploadIcon}>
                  <AppIcon definition={uploadIconDefinition} size={24} color="#7A6F68" strokeWidth={1.8} />
                </View>
                <Text style={styles.uploadTitle}>Tap to select project files</Text>
                <Text style={styles.uploadHint}>Images, PDFs and 3D files</Text>
              </Pressable>
              {projectFiles.map((file) => (
                <View key={`${file.name}:${file.size ?? 0}`} style={styles.fileRow}>
                  <AppIcon definition={fileIconDefinition} size={18} color="#C9A86A" />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                    <Text style={styles.fileSize}>{file.size ? `${Math.ceil(file.size / 1024)} KB` : "Selected"}</Text>
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
                placeholder="Style preferences and other requirements..."
                multiline
                error={showError("description")}
              />
            </View>

            <Pressable
              style={[
                styles.submitButton,
                (createProjectMutation.isPending || isUploadingFiles) && styles.submitButtonDisabled,
              ]}
              disabled={createProjectMutation.isPending || isUploadingFiles}
              onPress={handleSubmit}
            >
              {createProjectMutation.isPending || isUploadingFiles ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Request</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function BusinessTypeSelect({
  label,
  required,
  value,
  open,
  onToggle,
  onSelect,
  error,
}: Readonly<{
  label: string;
  required?: boolean;
  value: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  error?: string;
}>): React.JSX.Element {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.requiredMark}> *</Text> : null}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={[styles.selectField, open && styles.selectFieldOpen, error ? styles.inputError : null]}
        onPress={onToggle}
      >
        <Text style={[styles.selectValue, !value && styles.selectPlaceholder]}>
          {value || "Select business type"}
        </Text>
        <View style={open ? styles.selectChevronOpen : undefined}>
          <AppIcon definition={chevronDownIconDefinition} size={16} color="#3A3330" strokeWidth={2} />
        </View>
      </Pressable>
      {open ? (
        <View style={styles.selectOptions}>
          {BUSINESS_TYPES.map((option, index) => {
            const selected = option === value;
            return (
              <Pressable
                key={option}
                style={[
                  styles.selectOption,
                  index < BUSINESS_TYPES.length - 1 && styles.selectOptionDivider,
                  selected && styles.selectOptionSelected,
                ]}
                onPress={() => onSelect(option)}
              >
                <Text style={[styles.selectOptionText, selected && styles.selectOptionTextSelected]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function TargetDateField({
  value,
  onPress,
  onClear,
  error,
}: Readonly<{
  value: Date | null;
  onPress: () => void;
  onClear: () => void;
  error?: string;
}>): React.JSX.Element {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>Target Completion Date</Text>
      <View style={[styles.dateField, error ? styles.inputError : null]}>
        <Pressable style={styles.dateFieldMain} onPress={onPress}>
          <AppIcon definition={calendarIconDefinition} size={16} color="#7A6F68" />
          <Text style={[styles.dateFieldText, !value && styles.dateFieldPlaceholder]}>
            {value ? formatTrackingDate(formatApiDate(value)) : "Select your target completion date"}
          </Text>
        </Pressable>
        {value ? (
          <Pressable hitSlop={8} onPress={onClear}>
            <Text style={styles.dateClearText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function FormField({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  suffix,
  error,
}: Readonly<{
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
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
          placeholder={placeholder}
          placeholderTextColor="#B8ADA4"
          multiline={multiline}
          keyboardType={keyboardType}
        />
        {suffix ? <Text style={styles.inputSuffix}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}
