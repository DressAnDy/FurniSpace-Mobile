import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
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
} from "../../../icons/auth/definitions";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { getAccessToken } from "../../../core/storage/secureStorage";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { useChangePasswordAction } from "../hooks/useAuthActions";
import { styles } from "./RegisterScreen.styles";

const brandLogo = require("../../../../assets/brand/furnispace-logo.png");

export function ChangePasswordScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const changePasswordMutation = useChangePasswordAction();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    void getAccessToken().then((token) => {
      if (!active) {
        return;
      }

      if (!token) {
        Alert.alert("Sign in required", "Your session has expired. Please sign in again.", [
          { text: "OK", onPress: () => navigation.reset({ index: 0, routes: [{ name: "Login" }] }) },
        ]);
        setSessionReady(false);
        return;
      }

      setSessionReady(true);
    });

    return () => {
      active = false;
    };
  }, [navigation]);

  const disabled = useMemo(() => {
    if (!sessionReady || !currentPassword || !newPassword || !confirmPassword || changePasswordMutation.isPending) {
      return true;
    }
    return newPassword !== confirmPassword;
  }, [changePasswordMutation.isPending, confirmPassword, currentPassword, newPassword, sessionReady]);

  const handleSubmit = () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Validation", "New password and confirmation do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      Alert.alert("Validation", "New password must be different from current password.");
      return;
    }

    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          Alert.alert("Password changed", "Please sign in again with your new password.", [
            { text: "OK", onPress: () => navigation.reset({ index: 0, routes: [{ name: "Login" }] }) },
          ]);
        },
        onError: (error) => {
          Alert.alert("Change password failed", getErrorMessage(error, "Unable to change password."));
        },
      },
    );
  };

  if (sessionReady !== true) {
    return (
      <ScreenContainer>
        <View style={styles.screen} />
      </ScreenContainer>
    );
  }

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
            <View style={styles.heroDecorLarge} />
            <View style={styles.heroDecorSmall} />
            <View style={styles.heroContent}>
              <View style={styles.heroLogoFrame}>
                <Image source={brandLogo} style={styles.heroLogo} resizeMode="cover" />
              </View>
              <Text style={styles.heroTagline}>ACCOUNT SECURITY</Text>
            </View>
            <View style={styles.heroCurve} />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.title}>Change password</Text>
            <Text style={styles.subtitle}>Update your password. All active sessions will be signed out.</Text>

            <PasswordField
              label="CURRENT PASSWORD"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              visible={showCurrentPassword}
              onToggleVisible={() => setShowCurrentPassword((prev) => !prev)}
            />

            <PasswordField
              label="NEW PASSWORD"
              value={newPassword}
              onChangeText={setNewPassword}
              visible={showNewPassword}
              onToggleVisible={() => setShowNewPassword((prev) => !prev)}
            />

            <PasswordField
              label="CONFIRM NEW PASSWORD"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              visible={showNewPassword}
              onToggleVisible={() => setShowNewPassword((prev) => !prev)}
            />

            <Text style={styles.passwordHint}>8–128 chars, uppercase, lowercase, and number required.</Text>

            <Pressable
              style={[styles.button, disabled && styles.buttonDisabled]}
              disabled={disabled}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonText}>
                {changePasswordMutation.isPending ? "Updating..." : "Update password"}
              </Text>
            </Pressable>

            <Pressable style={styles.footerRow} onPress={() => navigation.goBack()}>
              <Text style={styles.footerLink}>Back to profile</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
  visible,
  onToggleVisible,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.fieldSection}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <AppIcon definition={lockIconDefinition} size={15} color="#9B8F86" />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          importantForAutofill="no"
          placeholder="••••••••"
          placeholderTextColor="rgba(122,111,104,0.5)"
          secureTextEntry={!visible}
          spellCheck={false}
          style={styles.input}
          textContentType="password"
          value={value}
          onChangeText={onChangeText}
        />
        <Pressable hitSlop={8} onPress={onToggleVisible}>
          <AppIcon definition={visible ? eyeOffIconDefinition : eyeIconDefinition} size={15} color="#9B8F86" />
        </Pressable>
      </View>
    </View>
  );
}
