import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { NotificationListItem } from "../models/notification.model";

export function navigateFromNotification(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  item: Pick<NotificationListItem, "referenceType" | "referenceId" | "projectId" | "metadata">,
): void {
  if (item.referenceType === "PROJECT_CHAT_MESSAGE") {
    navigation.navigate("Messages");
    return;
  }

  if (item.referenceType === "QUOTATION" || item.referenceType === "ORDER" || item.referenceType === "PAYMENT") {
    navigation.navigate("Tracking");
    return;
  }

  if (item.projectId) {
    navigation.navigate("Tracking");
    return;
  }

  navigation.navigate("Home");
}
