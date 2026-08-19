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
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { mailIconDefinition } from "../../../icons/auth/definitions";
import { arrowRightIconDefinition, dashboardIconDefinition } from "../../../icons/navigation/definitions";
import { checkIconDefinition } from "../../../icons/status/definitions";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { useResendOtpAction, useVerifyEmailAction } from "../hooks/useAuthActions";
import { styles } from "./VerifyEmailScreen.styles";

export function VerifyEmailScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const email = (route.params as { email?: string } | undefined)?.email?.trim() ?? "";
  const [otpCode, setOtpCode] = useState("");
  const verifyMutation = useVerifyEmailAction();
  const resendMutation = useResendOtpAction();

  const disabled = useMemo(
    () => !email || otpCode.trim().length !== 6 || verifyMutation.isPending,
    [email, otpCode, verifyMutation.isPending],
  );

  const handleVerify = () => {
    if (disabled) {
      return;
    }

    verifyMutation.mutate(
      { email, otpCode: otpCode.trim() },
      {
        onSuccess: () => navigation.reset({ index: 0, routes: [{ name: "Home" }] }),
        onError: (error) => {
          Alert.alert("Verify failed", getErrorMessage(error, "OTP verification failed."));
        },
      },
    );
  };

  const handleResend = () => {
    if (!email) {
      Alert.alert("Missing email", "Please go back and register again.");
      return;
    }

    resendMutation.mutate(
      { email },
      {
        onSuccess: () => Alert.alert("OTP sent", "If account requires verification, a new OTP has been sent."),
        onError: (error) => {
          Alert.alert("Error", getErrorMessage(error, "Unable to resend OTP."));
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
              <Text style={styles.heroSubtitle}>EMAIL VERIFICATION</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.title}>Verify email</Text>
            <Text style={styles.subtitle}>Enter the 6-digit OTP sent to your inbox to activate your account.</Text>

            <View style={styles.fieldSection}>
              <Text style={styles.label}>EMAIL</Text>
              <View style={[styles.inputWrap, styles.inputWrapReadOnly]}>
                <AppIcon definition={mailIconDefinition} size={15} color="#C9A86A" />
                <TextInput
                  editable={false}
                  pointerEvents="none"
                  selectTextOnFocus={false}
                  style={[styles.input, styles.inputReadOnly]}
                  value={email}
                />
              </View>
            </View>

            <View style={styles.fieldSection}>
              <Text style={styles.label}>OTP CODE</Text>
              <View style={styles.inputWrap}>
                <AppIcon definition={checkIconDefinition} size={15} color="#9B8F86" />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="one-time-code"
                  autoCorrect={false}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="000000"
                  placeholderTextColor="rgba(122,111,104,0.35)"
                  style={[styles.input, styles.inputOtp]}
                  textContentType="oneTimeCode"
                  value={otpCode}
                  onChangeText={(value) => setOtpCode(value.replace(/\D/g, ""))}
                />
              </View>
              <Text style={styles.otpHint}>OTP expires in 5 minutes. Check spam folder if not received.</Text>
            </View>

            <Pressable
              style={[styles.button, disabled && styles.buttonDisabled]}
              disabled={disabled}
              onPress={handleVerify}
            >
              <Text style={styles.buttonText}>{verifyMutation.isPending ? "Verifying..." : "Verify email"}</Text>
              <AppIcon definition={arrowRightIconDefinition} size={15} color="#FFFFFF" strokeWidth={1.8} />
            </Pressable>

            <Pressable style={styles.linkButton} disabled={resendMutation.isPending} onPress={handleResend}>
              <Text style={styles.linkText}>{resendMutation.isPending ? "Sending..." : "Resend OTP"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
