import React, { useMemo, useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { arrowLeftIconDefinition } from "../../../icons/navigation/definitions";
import { calendarIconDefinition } from "../../../icons/project/definitions";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { useCreateProjectMutation } from "../hooks/useProjects";
import { CreateProjectRequestDto } from "../models/project.model";
import { formatTrackingDate } from "../utils/project.tracking.mapper";
import { styles } from "./CreateProjectRequestScreen.styles";

type FormErrors = Partial<Record<keyof CreateProjectRequestDto, string>>;

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

export function CreateProjectRequestScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const createProjectMutation = useCreateProjectMutation();

  const [projectName, setProjectName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [furnitureRequirement, setFurnitureRequirement] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [description, setDescription] = useState("");
  const [targetCompletionDate, setTargetCompletionDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

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
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    createProjectMutation.mutate(formValues, {
      onSuccess: (project) => {
        Alert.alert("Request Submitted", "Your project request has been sent. Our team will review it shortly.", [
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

            <FormField
              label="Project Name"
              required
              value={projectName}
              onChangeText={setProjectName}
              placeholder="Urban Coffee House"
              error={showError("projectName")}
            />

            <FormField
              label="Business Type"
              required
              value={businessType}
              onChangeText={setBusinessType}
              placeholder="Cafe Interior, Office, Retail..."
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

            <TargetDateField
              value={targetCompletionDate}
              onPress={() => setShowDatePicker(true)}
              onClear={() => setTargetCompletionDate(null)}
              error={showError("targetCompletionDate")}
            />

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

            <FormField
              label="Additional Notes"
              value={description}
              onChangeText={setDescription}
              placeholder="Budget range, timeline, style preferences..."
              multiline
              error={showError("description")}
            />

            <Pressable
              style={[styles.submitButton, createProjectMutation.isPending && styles.submitButtonDisabled]}
              disabled={createProjectMutation.isPending}
              onPress={handleSubmit}
            >
              {createProjectMutation.isPending ? (
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

function TargetDateField({
  value,
  onPress,
  onClear,
  error,
}: {
  value: Date | null;
  onPress: () => void;
  onClear: () => void;
  error?: string;
}): React.JSX.Element {
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
  error,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
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
        placeholder={placeholder}
        placeholderTextColor="#B8ADA4"
        multiline={multiline}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}
