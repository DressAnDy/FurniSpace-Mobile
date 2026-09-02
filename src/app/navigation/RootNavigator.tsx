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
import { CreateProjectRequestScreen } from "../../features/project/screens/CreateProjectRequestScreen";
import { SePayPaymentScreen } from "../../features/payment/screens/SePayPaymentScreen";
import { PayOSPaymentScreen } from "../../features/payment/screens/PayOSPaymentScreen";
import { PaymentMethodScreen } from "../../features/payment/screens/PaymentMethodScreen";
import { ProjectChatStatus, ProjectChatType } from "../../features/communication/models/chat.model";
import { PaymentRouteParams } from "../../features/payment/models/payment.model";
import {
  SaleDashboardScreen,
  SaleMessagesScreen,
  SaleMoreScreen,
  SaleProjectsScreen,
  SaleRequestsScreen,
} from "../../features/sale/screens/SaleMainScreens";
import { SaleChatScreen, SaleProjectDetailScreen } from "../../features/sale/screens/SaleDetailScreens";
import type { ProjectDetailTab } from "../../features/sale/data/sale.mock";
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
  PaymentMethod: PaymentRouteParams;
  SePayPayment: PaymentRouteParams;
  PayOSPayment: PaymentRouteParams;
  Tracking: { projectId?: string } | undefined;
  CreateProjectRequest: undefined;
  VerifyEmail: { email?: string } | undefined;
  SaleDashboard: undefined;
  SaleRequests: undefined;
  SaleProjects: undefined;
  SaleMessages: undefined;
  SaleMore: undefined;
  SaleChat: { conversationId: string };
  SaleProjectDetail: { projectId?: string; tab?: ProjectDetailTab; openScheduleModal?: boolean } | undefined;
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
        <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} />
        <Stack.Screen name="SePayPayment" component={SePayPaymentScreen} />
        <Stack.Screen name="PayOSPayment" component={PayOSPaymentScreen} />
        <Stack.Screen name="Tracking" component={ProjectTrackingScreen} />
        <Stack.Screen name="CreateProjectRequest" component={CreateProjectRequestScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        <Stack.Screen name="SaleDashboard" component={SaleDashboardScreen} />
        <Stack.Screen name="SaleRequests" component={SaleRequestsScreen} />
        <Stack.Screen name="SaleProjects" component={SaleProjectsScreen} />
        <Stack.Screen name="SaleMessages" component={SaleMessagesScreen} />
        <Stack.Screen name="SaleMore" component={SaleMoreScreen} />
        <Stack.Screen name="SaleChat" component={SaleChatScreen} />
        <Stack.Screen name="SaleProjectDetail" component={SaleProjectDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
