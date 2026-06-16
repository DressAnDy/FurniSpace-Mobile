import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}
