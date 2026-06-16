import { LinkingOptions } from "@react-navigation/native";
import { RootStackParamList } from "./RootNavigator";

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["furnispace://"],
  config: {
    screens: {
      Home: "home",
      Login: "login",
      MessageChat: "message-chat",
      Messages: "messages",
      Notifications: "notifications",
      Profile: "profile",
      Tracking: "tracking",
    },
  },
};
