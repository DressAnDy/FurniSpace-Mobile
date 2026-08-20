import React from "react";
import { NotificationRealtimeBridge } from "./NotificationRealtimeBridge";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";

type AppProviderProps = {
  children: React.ReactNode;
};

export function AppProvider({ children }: AppProviderProps): React.JSX.Element {
  return (
    <QueryProvider>
      <NotificationRealtimeBridge />
      <ThemeProvider>{children}</ThemeProvider>
    </QueryProvider>
  );
}
