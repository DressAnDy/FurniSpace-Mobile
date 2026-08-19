import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { useForgotPasswordAction } from "../hooks/useAuthActions";
import { styles } from "./AuthFlowScreen.styles";

export function ForgotPasswordScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const mutation = useForgotPasswordAction();
  const [email, setEmail] = useState("");

  const disabled = useMemo(() => !email.trim() || mutation.isPending, [email, mutation.isPending]);

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={styles.title}>Forgot password</Text>
        <Text style={styles.subtitle}>We will send a reset link/token to this email if account exists.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="customer@example.com"
          />
        </View>

        <Pressable
          style={[styles.button, disabled && styles.buttonDisabled]}
          disabled={disabled}
          onPress={() =>
            mutation.mutate(
              { email: email.trim() },
              {
                onSuccess: () => {
                  Alert.alert("Check email", "If account exists, reset email has been sent.");
                  navigation.navigate("ResetPassword", { email: email.trim() });
                },
                onError: (error) => {
                  const message = error instanceof Error ? error.message : "Unable to submit request.";
                  Alert.alert("Request failed", message);
                },
              },
            )
          }
        >
          <Text style={styles.buttonText}>{mutation.isPending ? "Sending..." : "Send reset email"}</Text>
        </Pressable>

        <Pressable style={styles.linkButton} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.linkText}>Back to login</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
