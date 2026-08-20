import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ChangePasswordScreen } from "../../features/auth/screens/ChangePasswordScreen";
import { ForgotPasswordScreen } from "../../features/auth/screens/ForgotPasswordScreen";
import { LoginScreen } from "../../features/auth/screens/LoginScreen";
import { RegisterScreen } from "../../features/auth/screens/RegisterScreen";
import { ResetPasswordScreen } from "../../features/auth/screens/ResetPasswordScreen";
import { VerifyEmailScreen } from "../../features/auth/screens/VerifyEmailScreen";
import { MessageChatScreen } from "../../features/communication/screens/MessageChatScreen";
import { MessagesScreen } from "../../features/communication/screens/MessagesScreen";
import { HomeScreen } from "../../features/home/screens/HomeScreen";
import { NotificationsScreen } from "../../features/notification/screens/NotificationsScreen";
import { ProfileScreen } from "../../features/profile/screens/ProfileScreen";
import { ProjectTrackingScreen } from "../../features/project/screens/ProjectTrackingScreen";
import { ProjectChatStatus, ProjectChatType } from "../../features/communication/models/chat.model";
import { linking } from "./linking";

export type RootStackParamList = {
  ChangePassword: undefined;
  Home: undefined;
  ForgotPassword: undefined;
  Login: undefined;
  MessageChat: {
    chatId: string;
    projectId: string;
    title: string;
    staffName: string;
    chatType: ProjectChatType;
    status: ProjectChatStatus;
  };
  Messages: { projectId?: string } | undefined;
  Notifications: undefined;
  Profile: undefined;
  Register: undefined;
  ResetPassword: { email?: string; token?: string } | undefined;
  Tracking: { projectId?: string } | undefined;
  VerifyEmail: { email?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MessageChat" component={MessageChatScreen} />
        <Stack.Screen name="Messages" component={MessagesScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="Tracking" component={ProjectTrackingScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
