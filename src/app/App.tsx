import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LogBox } from "react-native";
import { configureLocalNotifications } from "../core/notifications/localNotifications";
import { AppProvider } from "./providers/AppProvider";
import { RootNavigator } from "./navigation/RootNavigator";

LogBox.ignoreLogs([
  "Connection disconnected with error",
  "WebSocket closed with status code: 1006",
  "Failed to start the transport 'WebSockets'",
  "WebSocket failed to connect",
]);

export default function App(): React.JSX.Element {
  useEffect(() => {
    void configureLocalNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
