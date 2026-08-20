import React, { useEffect } from "react";
import { configureLocalNotifications } from "../core/notifications/localNotifications";
import { AppProvider } from "./providers/AppProvider";
import { RootNavigator } from "./navigation/RootNavigator";

export default function App(): React.JSX.Element {
  useEffect(() => {
    void configureLocalNotifications();
  }, []);

  return (
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
}
