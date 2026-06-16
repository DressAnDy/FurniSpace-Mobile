import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  eyeIconDefinition,
  eyeOffIconDefinition,
  lockIconDefinition,
  mailIconDefinition,
} from "../../../icons/auth/definitions";
import { arrowRightIconDefinition, dashboardIconDefinition } from "../../../icons/navigation/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";

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

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FAF8F5",
    flex: 1,
  },
  heroSection: {
    height: 240,
    overflow: "hidden",
    position: "relative",
  },
  heroBackground: {
    backgroundColor: "#3A3330",
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(44,36,32,0.68)",
  },
  heroContent: {
    alignItems: "center",
    bottom: 14,
    left: 0,
    position: "absolute",
    right: 0,
  },
  heroLogoBox: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 15,
    borderWidth: 1,
    height: 45,
    justifyContent: "center",
    width: 45,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontFamily: "serif",
    fontSize: 42,
    letterSpacing: 1.2,
    marginTop: 8,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    letterSpacing: 1.8,
    marginTop: 4,
  },
  title: {
    color: "#2C2420",
    fontFamily: "serif",
    fontSize: 31,
  },
  subtitle: {
    color: "#7A6F68",
    fontSize: 13,
    marginTop: 4,
  },
  formSection: {
    paddingHorizontal: 19,
    paddingTop: 22,
  },
  fieldSection: {
    marginTop: 15,
  },
  label: {
    color: "#7A6F68",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: "#F5F2ED",
    borderRadius: 15,
    flexDirection: "row",
    height: 45,
    marginTop: 7,
    paddingHorizontal: 15,
  },
  input: {
    color: "#2C2420",
    flex: 1,
    fontSize: 13,
    marginLeft: 11,
  },
  passwordRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  forgotText: {
    color: "#C9A86A",
    fontSize: 11,
    fontWeight: "500",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#3A3330",
    borderRadius: 15,
    flexDirection: "row",
    gap: 8,
    height: 45,
    justifyContent: "center",
    marginTop: 15,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  contactRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  contactText: {
    color: "#7A6F68",
    fontSize: 11,
  },
  contactAction: {
    color: "#C9A86A",
    fontSize: 15,
    fontWeight: "500",
  },
  copyright: {
    color: "rgba(122,111,104,0.4)",
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 22,
    textAlign: "center",
  },
});
