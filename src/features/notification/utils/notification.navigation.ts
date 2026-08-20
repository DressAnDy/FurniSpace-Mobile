import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { NotificationListItem } from "../models/notification.model";
import { readMetadataString } from "./notification.metadata";
import { resolveChatNotificationTarget } from "./notification.chatResolve";

type NavigateFromNotificationOptions = {
  setActiveProjectId?: (projectId: string) => void;
};

export async function navigateFromNotification(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  item: Pick<NotificationListItem, "referenceType" | "referenceId" | "projectId" | "metadata" | "description">,
  options?: NavigateFromNotificationOptions,
): Promise<void> {
  if (item.referenceType === "PROJECT_CHAT_MESSAGE") {
    const target = await resolveChatNotificationTarget(item);

    if (target) {
      options?.setActiveProjectId?.(target.projectId);
      navigation.navigate("MessageChat", {
        chatId: target.chatId,
        projectId: target.projectId,
        title: target.title,
        staffName: target.staffName,
        chatType: target.chatType,
        status: target.status,
      });
      return;
    }

    if (item.projectId) {
      options?.setActiveProjectId?.(item.projectId);
      navigation.navigate("Messages", { projectId: item.projectId });
      return;
    }

    navigation.navigate("Messages");
    return;
  }

  if (item.referenceType === "PAYMENT") {
    const paymentId = readMetadataString(item.metadata, "paymentId") ?? item.referenceId ?? undefined;
    const orderId = readMetadataString(item.metadata, "orderId");
    const projectId = item.projectId ?? readMetadataString(item.metadata, "projectId");

    if (projectId) {
      options?.setActiveProjectId?.(projectId);
    }

    if (paymentId || orderId) {
      navigation.navigate("PaymentMethod", {
        paymentId: paymentId ?? undefined,
        orderId: orderId ?? undefined,
        projectId: projectId ?? undefined,
      });
      return;
    }
  }

  if (item.referenceType === "QUOTATION" || item.referenceType === "ORDER") {
    if (item.projectId) {
      options?.setActiveProjectId?.(item.projectId);
      navigation.navigate("Tracking", { projectId: item.projectId });
      return;
    }

    navigation.navigate("Tracking");
    return;
  }

  if (item.projectId) {
    options?.setActiveProjectId?.(item.projectId);
    navigation.navigate("Tracking", { projectId: item.projectId });
    return;
  }

  navigation.navigate("Home");
}
