import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { useResetPasswordAction } from "../hooks/useAuthActions";
import { styles } from "./AuthFlowScreen.styles";

export function ResetPasswordScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const params = (route.params as { email?: string; token?: string } | undefined) ?? {};
  const mutation = useResetPasswordAction();
  const [email, setEmail] = useState(params.email ?? "");
  const [token, setToken] = useState(params.token ?? "");
  const [newPassword, setNewPassword] = useState("");

  const disabled = useMemo(
    () => !email.trim() || !token.trim() || !newPassword.trim() || mutation.isPending,
    [email, token, newPassword, mutation.isPending],
  );

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>Paste token from email and set a new strong password.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>RESET TOKEN</Text>
          <TextInput value={token} onChangeText={setToken} style={styles.input} autoCapitalize="none" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>NEW PASSWORD</Text>
          <TextInput value={newPassword} onChangeText={setNewPassword} style={styles.input} secureTextEntry />
        </View>

        <Pressable
          style={[styles.button, disabled && styles.buttonDisabled]}
          disabled={disabled}
          onPress={() =>
            mutation.mutate(
              { email: email.trim(), token: token.trim(), newPassword },
              {
                onSuccess: () => {
                  Alert.alert("Success", "Password reset successfully. Please login again.");
                  navigation.navigate("Login");
                },
                onError: (error) => {
                  const message = error instanceof Error ? error.message : "Unable to reset password.";
                  Alert.alert("Reset failed", message);
                },
              },
            )
          }
        >
          <Text style={styles.buttonText}>{mutation.isPending ? "Submitting..." : "Reset password"}</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
