import React from "react";
import { AppProvider } from "./providers/AppProvider";
import { RootNavigator } from "./navigation/RootNavigator";

export default function App(): React.JSX.Element {
  return (
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
}
