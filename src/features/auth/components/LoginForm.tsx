import React, { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  eyeIconDefinition,
  eyeOffIconDefinition,
  lockIconDefinition,
  mailIconDefinition,
} from "../../../icons/auth/definitions";
import { arrowRightIconDefinition, dashboardIconDefinition } from "../../../icons/navigation/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { styles } from "./LoginForm.styles";

type LoginFormProps = {
  isSubmitting: boolean;
  onSubmit: (payload: { email: string; password: string }) => void;
};

export function LoginForm({ isSubmitting, onSubmit }: LoginFormProps): React.JSX.Element {
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
    <View style={styles.screen}>
      <View style={styles.heroSection}>
        <View style={styles.heroBackground} />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.heroLogoBox}>
            <AppIcon definition={dashboardIconDefinition} size={24} color="#C9A86A" strokeWidth={1.8} />
          </View>
          <Text style={styles.heroTitle}>FurniSpace</Text>
          <Text style={styles.heroSubtitle}>INTERIOR · 3D · FURNITURE</Text>
        </View>
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
            <Pressable>
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

        <Pressable style={[styles.button, disabled && styles.buttonDisabled]} disabled={disabled} onPress={handleSubmit}>
          <Text style={styles.buttonText}>{isSubmitting ? "Signing In..." : "Sign In"}</Text>
          <AppIcon definition={arrowRightIconDefinition} size={15} color="#FFFFFF" strokeWidth={1.8} />
        </Pressable>

        <View style={styles.contactRow}>
          <Text style={styles.contactText}>Don&apos;t have an account? </Text>
          <Pressable>
            <Text style={styles.contactAction}>Contact your sales team</Text>
          </Pressable>
        </View>

        <Text style={styles.copyright}>© 2026 FURNISPACE</Text>
      </View>
    </View>
  );
}
