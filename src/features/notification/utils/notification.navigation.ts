import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { NotificationListItem } from "../models/notification.model";
import { readMetadataString } from "./notification.metadata";
import { resolveChatNotificationTarget } from "./notification.chatResolve";

type NavigateFromNotificationOptions = {
  setActiveProjectId?: (projectId: string) => void;
};

function navigateProjectFlow(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  projectId: string,
  projectName: string | undefined,
  options: NavigateFromNotificationOptions | undefined,
): void {
  options?.setActiveProjectId?.(projectId);
  navigation.navigate("Tracking", { projectId });
}

export async function navigateFromNotification(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  item: Pick<
    NotificationListItem,
    "referenceType" | "referenceId" | "projectId" | "metadata" | "description" | "notificationType"
  >,
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
    const paymentType = readMetadataString(item.metadata, "paymentType") ?? undefined;

    if (projectId) {
      options?.setActiveProjectId?.(projectId);
    }

    if (paymentId || orderId) {
      navigation.navigate("PaymentMethod", {
        paymentId: paymentId ?? undefined,
        orderId: orderId ?? undefined,
        projectId: projectId ?? undefined,
        paymentType,
      });
      return;
    }
  }

  const projectId = item.projectId ?? readMetadataString(item.metadata, "projectId");
  const projectName = readMetadataString(item.metadata, "projectName");

  if (item.referenceType === "PROPOSAL" || item.notificationType.startsWith("proposal.")) {
    const proposalId = readMetadataString(item.metadata, "proposalId") ?? item.referenceId;

    if (projectId && proposalId) {
      options?.setActiveProjectId?.(projectId);
      navigation.navigate("ProposalDetail", { proposalId, projectId, projectName });
      return;
    }

    if (projectId) {
      options?.setActiveProjectId?.(projectId);
      navigation.navigate("ProjectProposals", { projectId, projectName });
      return;
    }
  }

  if (item.referenceType === "QUOTATION" || item.notificationType.startsWith("quotation.")) {
    const quotationId = readMetadataString(item.metadata, "quotationId") ?? item.referenceId;

    if (projectId && quotationId) {
      options?.setActiveProjectId?.(projectId);
      navigation.navigate("QuotationDetail", { quotationId, projectId, projectName });
      return;
    }

    if (projectId) {
      options?.setActiveProjectId?.(projectId);
      navigation.navigate("ProjectQuotations", { projectId, projectName });
      return;
    }
  }

  if (item.referenceType === "ORDER" || item.notificationType.startsWith("order.")) {
    const orderId = readMetadataString(item.metadata, "orderId") ?? item.referenceId;

    if (projectId && orderId) {
      options?.setActiveProjectId?.(projectId);
      navigation.navigate("OrderDetail", { orderId, projectId, projectName });
      return;
    }

    if (projectId) {
      options?.setActiveProjectId?.(projectId);
      navigation.navigate("ProjectOrders", { projectId, projectName });
      return;
    }
  }

  if (projectId) {
    navigateProjectFlow(navigation, projectId, projectName, options);
    return;
  }

  navigation.navigate("Home");
}
