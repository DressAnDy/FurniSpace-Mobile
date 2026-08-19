import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Alert } from "react-native";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { LoginForm } from "../components/LoginForm";
import { useLogin } from "../hooks/useLogin";

export function LoginScreen(): React.JSX.Element {
  const loginMutation = useLogin();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScreenContainer>
      <LoginForm
        isSubmitting={loginMutation.isPending}
        onForgotPassword={() => navigation.navigate("ForgotPassword")}
        onRegister={() => navigation.navigate("Register")}
        onSubmit={(payload) => {
          loginMutation.mutate(payload, {
            onSuccess: () => navigation.reset({ index: 0, routes: [{ name: "Home" }] }),
            onError: (error) => {
              Alert.alert("Login failed", getErrorMessage(error, "Unable to login. Please try again."));
            },
          });
        }}
      />
    </ScreenContainer>
  );
}
