import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import {
  eyeIconDefinition,
  eyeOffIconDefinition,
  lockIconDefinition,
  mailIconDefinition,
} from "../../../icons/auth/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { styles } from "./LoginForm.styles";

const brandLogo = require("../../../../assets/brand/furnispace-logo.png");

type LoginFormProps = {
  isSubmitting: boolean;
  onSubmit: (payload: { email: string; password: string }) => void;
  onForgotPassword?: () => void;
  onRegister?: () => void;
};

export function LoginForm({ isSubmitting, onSubmit, onForgotPassword, onRegister }: LoginFormProps): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const disabled = useMemo(() => !email || !password || isSubmitting, [email, password, isSubmitting]);

  const handleSubmit = () => {
    if (disabled) {
      return;
    }
    onSubmit({ email: email.trim(), password });
  };

  return (
    <ScrollView
      style={styles.screen}
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
          <Text style={styles.heroTagline}>THI CÔNG NỘI THẤT GỖ · HỖ TRỢ 3D · TRỰC QUAN HÓA</Text>
        </View>
        <View style={styles.heroCurve} />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to track your project</Text>

        <View style={styles.fieldSection}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <View style={styles.inputWrap}>
            <AppIcon definition={mailIconDefinition} size={15} color="#9B8F86" />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="sarah@example.com"
              placeholderTextColor="rgba(122,111,104,0.5)"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        <View style={styles.fieldSection}>
          <View style={styles.passwordRow}>
            <Text style={styles.label}>PASSWORD</Text>
            <Pressable onPress={onForgotPassword}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          </View>
          <View style={styles.inputWrap}>
            <AppIcon definition={lockIconDefinition} size={15} color="#9B8F86" />
            <TextInput
              autoCapitalize="none"
              placeholder="••••••••"
              placeholderTextColor="rgba(122,111,104,0.5)"
              secureTextEntry={!isPasswordVisible}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable onPress={() => setIsPasswordVisible((prev) => !prev)}>
              <AppIcon
                definition={isPasswordVisible ? eyeOffIconDefinition : eyeIconDefinition}
                size={15}
                color="#9B8F86"
              />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.button, disabled && styles.buttonDisabled, pressed && !disabled && styles.buttonPressed]}
          disabled={disabled}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>{isSubmitting ? "Signing In..." : "Sign In"}</Text>
        </Pressable>

        <View style={styles.contactRow}>
          <Text style={styles.contactText}>Don&apos;t have an account? </Text>
          <Pressable onPress={onRegister} hitSlop={8}>
            <Text style={styles.contactAction}>Sign up</Text>
          </Pressable>
        </View>

        <Text style={styles.copyright}>© 2026 FURNISPACE</Text>
      </View>
    </ScrollView>
  );
}
