import React from "react";
import { Text, TextInput, View } from "react-native";
import {
  CustomizationFieldErrors,
  CustomizationFormValues,
} from "../utils/customization.form";
import { customizationStyles as styles } from "../styles/customization.styles";

type Props = {
  values: CustomizationFormValues;
  errors: CustomizationFieldErrors;
  onChange: (patch: Partial<CustomizationFormValues>) => void;
  includeChangeNote?: boolean;
};

export function CustomizationRequestFields({
  values,
  errors,
  onChange,
  includeChangeNote = false,
}: Props): React.JSX.Element {
  return (
    <View>
      <Text style={styles.fieldLabel}>Title</Text>
      <TextInput
        value={values.requestTitle}
        onChangeText={(requestTitle) => onChange({ requestTitle })}
        placeholder="Change sofa material"
        placeholderTextColor="#9B8F86"
        style={[styles.textInput, errors.requestTitle ? styles.inputError : null]}
        maxLength={200}
      />
      {errors.requestTitle ? <Text style={styles.errorText}>{errors.requestTitle}</Text> : null}

      <Text style={styles.fieldLabel}>Describe the change</Text>
      <TextInput
        value={values.requestDescription}
        onChangeText={(requestDescription) => onChange({ requestDescription })}
        placeholder="Use easier-to-clean fabric"
        placeholderTextColor="#9B8F86"
        style={[styles.textInput, styles.textArea]}
        multiline
        maxLength={2000}
      />

      <Text style={styles.fieldLabel}>Material</Text>
      <TextInput
        value={values.requestedMaterial}
        onChangeText={(requestedMaterial) => onChange({ requestedMaterial })}
        placeholder="Performance fabric"
        placeholderTextColor="#9B8F86"
        style={styles.textInput}
        maxLength={200}
      />

      <Text style={styles.fieldLabel}>Color</Text>
      <TextInput
        value={values.requestedColor}
        onChangeText={(requestedColor) => onChange({ requestedColor })}
        placeholder="Warm grey"
        placeholderTextColor="#9B8F86"
        style={styles.textInput}
        maxLength={200}
      />

      <View style={styles.dimensionRow}>
        <View style={styles.dimensionCol}>
          <Text style={styles.fieldLabel}>Width (cm)</Text>
          <TextInput
            value={values.requestedWidth}
            onChangeText={(requestedWidth) => onChange({ requestedWidth })}
            placeholder="0"
            placeholderTextColor="#9B8F86"
            keyboardType="decimal-pad"
            style={[styles.textInput, errors.requestedWidth ? styles.inputError : null]}
          />
          {errors.requestedWidth ? <Text style={styles.errorText}>{errors.requestedWidth}</Text> : null}
        </View>
        <View style={styles.dimensionCol}>
          <Text style={styles.fieldLabel}>Height (cm)</Text>
          <TextInput
            value={values.requestedHeight}
            onChangeText={(requestedHeight) => onChange({ requestedHeight })}
            placeholder="0"
            placeholderTextColor="#9B8F86"
            keyboardType="decimal-pad"
            style={[styles.textInput, errors.requestedHeight ? styles.inputError : null]}
          />
          {errors.requestedHeight ? <Text style={styles.errorText}>{errors.requestedHeight}</Text> : null}
        </View>
        <View style={styles.dimensionCol}>
          <Text style={styles.fieldLabel}>Depth (cm)</Text>
          <TextInput
            value={values.requestedDepth}
            onChangeText={(requestedDepth) => onChange({ requestedDepth })}
            placeholder="0"
            placeholderTextColor="#9B8F86"
            keyboardType="decimal-pad"
            style={[styles.textInput, errors.requestedDepth ? styles.inputError : null]}
          />
          {errors.requestedDepth ? <Text style={styles.errorText}>{errors.requestedDepth}</Text> : null}
        </View>
      </View>

      {includeChangeNote ? (
        <>
          <Text style={styles.fieldLabel}>Change note</Text>
          <TextInput
            value={values.requestedChangeNote}
            onChangeText={(requestedChangeNote) => onChange({ requestedChangeNote })}
            placeholder="Note from the customer conversation"
            placeholderTextColor="#9B8F86"
            style={[styles.textInput, styles.textArea]}
            multiline
            maxLength={2000}
          />
        </>
      ) : null}

      {errors.form ? <Text style={styles.errorText}>{errors.form}</Text> : null}
    </View>
  );
}
