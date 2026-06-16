import React from "react";
import { Alert } from "react-native";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { LoginForm } from "../components/LoginForm";
import { useLogin } from "../hooks/useLogin";

export function LoginScreen(): React.JSX.Element {
  const loginMutation = useLogin();

  return (
    <ScreenContainer>
      <LoginForm
        isSubmitting={loginMutation.isPending}
        onSubmit={(payload) => {
          loginMutation.mutate(payload, {
            onError: (error) => {
              const message = error instanceof Error ? error.message : "Unable to login. Please try again.";
              Alert.alert("Login failed", message);
            },
          });
        }}
      />
    </ScreenContainer>
  );
}
