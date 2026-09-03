import React, { useEffect, useMemo, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
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
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { AppIcon } from "../../../shared/components/AppIcon";
import { arrowLeftIconDefinition } from "../../../icons/navigation/definitions";
import { calendarIconDefinition } from "../../../icons/project/definitions";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { useUpdateProjectBasicInfoMutation } from "../hooks/useCustomerFlow";
import { useProjectDetailQuery } from "../hooks/useProjects";
import { CreateProjectRequestDto } from "../models/project.model";
import { formatTrackingDate } from "../utils/project.tracking.mapper";
import { styles } from "./CreateProjectRequestScreen.styles";

type Route = RouteProp<RootStackParamList, "UpdateProjectBasicInfo">;
type FormErrors = Partial<Record<keyof CreateProjectRequestDto, string>>;

function validateForm(values: CreateProjectRequestDto): FormErrors {
  const errors: FormErrors = {};
  if (!values.projectName.trim()) errors.projectName = "Project name is required.";
  if (!values.businessType.trim()) errors.businessType = "Business type is required.";
  if (!values.furnitureRequirement.trim()) errors.furnitureRequirement = "Furniture requirement is required.";
  return errors;
}

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
  const [description, setDescription] = useState("");
  const [targetCompletionDate, setTargetCompletionDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!project || initialized) return;
    setProjectName(project.projectName ?? "");
    setBusinessType(project.businessType ?? "");
    setFurnitureRequirement(project.furnitureRequirement ?? "");
    setProjectAddress(project.projectAddress ?? "");
    setDescription(project.description ?? "");
    setTargetCompletionDate(parseApiDate(project.targetCompletionDate));
    setInitialized(true);
  }, [project, initialized]);

  const formValues = useMemo<CreateProjectRequestDto>(
    () => ({
      projectName: projectName.trim(),
      businessType: businessType.trim(),
      furnitureRequirement: furnitureRequirement.trim(),
      ...(projectAddress.trim() ? { projectAddress: projectAddress.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(targetCompletionDate ? { targetCompletionDate: formatApiDate(targetCompletionDate) } : {}),
    }),
    [businessType, description, furnitureRequirement, projectAddress, projectName, targetCompletionDate],
  );

  const handleTargetDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (event.type === "dismissed" || !date) return;
    setTargetCompletionDate(date);
  };

  const handleSubmit = () => {
    setHasSubmitted(true);
    const nextErrors = validateForm(formValues);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    updateMutation.mutate(formValues, {
      onSuccess: () => {
        Alert.alert("Information Updated", "Your project details have been saved.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      },
      onError: (error) => Alert.alert("Update Failed", getErrorMessage(error)),
    });
  };

  const showError = (field: keyof CreateProjectRequestDto) => (hasSubmitted ? errors[field] : undefined);

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
                <Text style={styles.headerTitle}>Update Basic Information</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              Sales requested additional details. Update the fields below and save.
            </Text>
          </View>

          <View style={styles.content}>
            <FormField label="Project Name" required value={projectName} onChangeText={setProjectName} error={showError("projectName")} />
            <FormField label="Business Type" required value={businessType} onChangeText={setBusinessType} error={showError("businessType")} />
            <FormField label="Furniture Requirement" required value={furnitureRequirement} onChangeText={setFurnitureRequirement} multiline error={showError("furnitureRequirement")} />
            <FormField label="Project Address" value={projectAddress} onChangeText={setProjectAddress} />
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Target Completion Date</Text>
              <Pressable style={styles.dateField} onPress={() => setShowDatePicker(true)}>
                <AppIcon definition={calendarIconDefinition} size={16} color="#7A6F68" />
                <Text style={[styles.dateFieldText, !targetCompletionDate && styles.dateFieldPlaceholder]}>
                  {targetCompletionDate ? formatTrackingDate(formatApiDate(targetCompletionDate)) : "Select date"}
                </Text>
              </Pressable>
            </View>
            {showDatePicker ? (
              <DateTimePicker value={targetCompletionDate ?? new Date()} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={handleTargetDateChange} />
            ) : null}
            <FormField label="Additional Notes" value={description} onChangeText={setDescription} multiline />

            <Pressable style={[styles.submitButton, updateMutation.isPending && styles.submitButtonDisabled]} disabled={updateMutation.isPending} onPress={handleSubmit}>
              {updateMutation.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Save Changes</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function FormField({
  label,
  required,
  value,
  onChangeText,
  multiline,
  error,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  error?: string;
}): React.JSX.Element {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.requiredMark}> *</Text> : null}
      </Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#B8ADA4"
        multiline={multiline}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}
