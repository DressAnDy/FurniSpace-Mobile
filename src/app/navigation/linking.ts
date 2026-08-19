import { LinkingOptions } from "@react-navigation/native";
import { RootStackParamList } from "./RootNavigator";

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["furnispace://"],
  config: {
    screens: {
      ChangePassword: "change-password",
      ForgotPassword: "forgot-password",
      Home: "home",
      Login: "login",
      MessageChat: "message-chat",
      Messages: "messages",
      Notifications: "notifications",
      Profile: "profile",
      Register: "register",
      ResetPassword: "reset-password",
      Tracking: "tracking",
      VerifyEmail: "verify-email",
    },
  },
};
