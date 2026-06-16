import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../../features/auth/screens/LoginScreen";
import { MessageChatScreen } from "../../features/communication/screens/MessageChatScreen";
import { MessagesScreen } from "../../features/communication/screens/MessagesScreen";
import { HomeScreen } from "../../features/home/screens/HomeScreen";
import { NotificationsScreen } from "../../features/notification/screens/NotificationsScreen";
import { ProfileScreen } from "../../features/profile/screens/ProfileScreen";
import { ProjectTrackingScreen } from "../../features/project/screens/ProjectTrackingScreen";
import { linking } from "./linking";

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  MessageChat: undefined;
  Messages: undefined;
  Notifications: undefined;
  Profile: undefined;
  Tracking: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MessageChat" component={MessageChatScreen} />
        <Stack.Screen name="Messages" component={MessagesScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Tracking" component={ProjectTrackingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
