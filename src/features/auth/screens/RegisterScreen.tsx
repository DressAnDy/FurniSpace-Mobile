import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  eyeIconDefinition,
  eyeOffIconDefinition,
  lockIconDefinition,
  mailIconDefinition,
  userIconDefinition,
} from "../../../icons/auth/definitions";
import { arrowRightIconDefinition, dashboardIconDefinition } from "../../../icons/navigation/definitions";
import { phoneIconDefinition } from "../../../icons/communication/definitions";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { useRegisterAction } from "../hooks/useAuthActions";
import { styles } from "./RegisterScreen.styles";

export function RegisterScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const registerMutation = useRegisterAction();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const disabled = useMemo(
    () => !fullName.trim() || !email.trim() || !password.trim() || registerMutation.isPending,
    [email, fullName, password, registerMutation.isPending],
  );

  const handleRegister = () => {
    if (disabled) {
      return;
    }

    registerMutation.mutate(
      { email: email.trim(), password, fullName: fullName.trim(), phone: phone.trim() || undefined },
      {
        onSuccess: () => {
          Alert.alert("Success", "Account created. Please verify OTP sent to your email.");
          navigation.navigate("VerifyEmail", { email: email.trim() });
        },
                onError: (error) => {
                  Alert.alert("Register failed", getErrorMessage(error, "Unable to register."));
                },
      },
    );
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        style={styles.screen}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <View style={styles.heroBackground} />
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <View style={styles.heroLogoBox}>
                <AppIcon definition={dashboardIconDefinition} size={20} color="#C9A86A" strokeWidth={1.8} />
              </View>
              <Text style={styles.heroTitle}>FurniSpace</Text>
              <Text style={styles.heroSubtitle}>JOIN AS CUSTOMER</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Register to track your interior project and verify email with OTP.</Text>

            <View style={styles.fieldSection}>
              <Text style={styles.label}>FULL NAME</Text>
              <View style={styles.inputWrap}>
                <AppIcon definition={userIconDefinition} size={15} color="#9B8F86" />
                <TextInput
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholder="Nguyen Van A"
                  placeholderTextColor="rgba(122,111,104,0.5)"
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            <View style={styles.fieldSection}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrap}>
                <AppIcon definition={mailIconDefinition} size={15} color="#9B8F86" />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="customer@example.com"
                  placeholderTextColor="rgba(122,111,104,0.5)"
                  style={styles.input}
                  textContentType="emailAddress"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.fieldSection}>
              <Text style={styles.label}>PHONE (OPTIONAL)</Text>
              <View style={styles.inputWrap}>
                <AppIcon definition={phoneIconDefinition} size={15} color="#9B8F86" />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="tel"
                  autoCorrect={false}
                  keyboardType="phone-pad"
                  placeholder="+84901234567"
                  placeholderTextColor="rgba(122,111,104,0.5)"
                  style={styles.input}
                  textContentType="telephoneNumber"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            <View style={styles.fieldSection}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrap}>
                <AppIcon definition={lockIconDefinition} size={15} color="#9B8F86" />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="password-new"
                  autoCorrect={false}
                  importantForAutofill="no"
                  placeholder="••••••••"
                  placeholderTextColor="rgba(122,111,104,0.5)"
                  secureTextEntry={!isPasswordVisible}
                  spellCheck={false}
                  style={styles.input}
                  textContentType="newPassword"
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable
                  hitSlop={8}
                  onPress={() => setIsPasswordVisible((prev) => !prev)}
                >
                  <AppIcon
                    definition={isPasswordVisible ? eyeOffIconDefinition : eyeIconDefinition}
                    size={15}
                    color="#9B8F86"
                  />
                </Pressable>
              </View>
              <Text style={styles.passwordHint}>8–128 chars, uppercase, lowercase, and number required.</Text>
            </View>

            <Pressable
              style={[styles.button, disabled && styles.buttonDisabled]}
              disabled={disabled}
              onPress={handleRegister}
            >
              <Text style={styles.buttonText}>{registerMutation.isPending ? "Creating..." : "Create account"}</Text>
              <AppIcon definition={arrowRightIconDefinition} size={15} color="#FFFFFF" strokeWidth={1.8} />
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Pressable onPress={() => navigation.navigate("Login")}>
                <Text style={styles.footerLink}>Sign in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
