import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { NotificationListItem } from "../models/notification.model";
import { readMetadataString } from "./notification.metadata";
import { resolveChatNotificationTarget } from "./notification.chatResolve";

type NavigateFromNotificationOptions = {
  setActiveProjectId?: (projectId: string) => void;
  role?: "CUSTOMER" | "SALES" | "DESIGNER" | "PRODUCTION" | "ADMIN" | null;
};

function isSalesRole(role: NavigateFromNotificationOptions["role"]): boolean {
  return role === "SALES";
}

function navigateSalesHome(navigation: NativeStackNavigationProp<RootStackParamList>): void {
  navigation.navigate("SaleDashboard");
}

function navigateProjectFlow(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  projectId: string,
  projectName: string | undefined,
  options: NavigateFromNotificationOptions | undefined,
): void {
  options?.setActiveProjectId?.(projectId);
  if (isSalesRole(options?.role)) {
    navigation.navigate("SaleProjectDetail", { projectId, tab: "Overview" });
    return;
  }
  navigation.navigate("Tracking", { projectId });
}

function normalizeType(value: string | null | undefined): string {
  return (value ?? "").toLowerCase();
}

export async function navigateFromNotification(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  item: Pick<
    NotificationListItem,
    "referenceType" | "referenceId" | "projectId" | "metadata" | "description" | "notificationType"
  >,
  options?: NavigateFromNotificationOptions,
): Promise<void> {
  const sales = isSalesRole(options?.role);
  const type = normalizeType(item.notificationType);
  const referenceType = (item.referenceType ?? "").toUpperCase();

  if (referenceType === "PROJECT_CHAT_MESSAGE" || type.includes("project_chat") || type.includes("chat")) {
    const target = await resolveChatNotificationTarget(item);

    if (target) {
      options?.setActiveProjectId?.(target.projectId);
      if (sales) {
        navigation.navigate("SaleChat", {
          chatId: target.chatId,
          projectId: target.projectId,
          title: target.title,
          staffName: target.staffName,
          chatType: target.chatType,
          status: target.status,
        });
        return;
      }
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
      if (sales) {
        navigation.navigate("SaleProjectDetail", { projectId: item.projectId, tab: "Chat" });
        return;
      }
      navigation.navigate("Messages", { projectId: item.projectId });
      return;
    }

    if (sales) {
      navigation.navigate("SaleMessages");
      return;
    }

    navigation.navigate("Messages");
    return;
  }

  if (referenceType === "PAYMENT" || type.includes("payment")) {
    const paymentId = readMetadataString(item.metadata, "paymentId") ?? item.referenceId ?? undefined;
    const orderId = readMetadataString(item.metadata, "orderId");
    const projectId = item.projectId ?? readMetadataString(item.metadata, "projectId");
    const paymentType = readMetadataString(item.metadata, "paymentType") ?? undefined;

    if (projectId) {
      options?.setActiveProjectId?.(projectId);
    }

    if (sales && projectId && orderId) {
      navigation.navigate("SaleOrderDetail", { orderId, projectId, projectName: readMetadataString(item.metadata, "projectName") });
      return;
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

    if (sales && projectId) {
      navigation.navigate("SaleProjectDetail", { projectId, tab: "Overview" });
      return;
    }
  }

  const projectId = item.projectId ?? readMetadataString(item.metadata, "projectId");
  const projectName = readMetadataString(item.metadata, "projectName");

  if (referenceType === "PROPOSAL" || type.includes("proposal") || type.includes("customization")) {
    const proposalId = readMetadataString(item.metadata, "proposalId") ?? item.referenceId;

    if (sales) {
      if (projectId) {
        options?.setActiveProjectId?.(projectId);
        navigation.navigate("SaleProjectDetail", { projectId, tab: "Overview" });
        return;
      }
      navigateSalesHome(navigation);
      return;
    }

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

  if (referenceType === "QUOTATION" || type.includes("quotation")) {
    const quotationId = readMetadataString(item.metadata, "quotationId") ?? item.referenceId;

    if (projectId && quotationId) {
      options?.setActiveProjectId?.(projectId);
      if (sales) {
        navigation.navigate("SaleQuotationDetail", { quotationId, projectId, projectName });
      } else {
        navigation.navigate("QuotationDetail", { quotationId, projectId, projectName });
      }
      return;
    }

    if (projectId) {
      options?.setActiveProjectId?.(projectId);
      if (sales) {
        navigation.navigate("SaleProjectDetail", { projectId, tab: "Overview" });
      } else {
        navigation.navigate("ProjectQuotations", { projectId, projectName });
      }
      return;
    }
  }

  if (referenceType === "ORDER" || type.includes("order")) {
    const orderId = readMetadataString(item.metadata, "orderId") ?? item.referenceId;

    if (projectId && orderId) {
      options?.setActiveProjectId?.(projectId);
      if (sales) {
        navigation.navigate("SaleOrderDetail", { orderId, projectId, projectName });
      } else {
        navigation.navigate("OrderDetail", { orderId, projectId, projectName });
      }
      return;
    }

    if (projectId) {
      options?.setActiveProjectId?.(projectId);
      if (sales) {
        navigation.navigate("SaleProjectDetail", { projectId, tab: "Overview" });
      } else {
        navigation.navigate("ProjectOrders", { projectId, projectName });
      }
      return;
    }
  }

  if (referenceType === "PRODUCTION_REQUEST" || type.includes("production")) {
    if (sales && projectId) {
      const orderId = readMetadataString(item.metadata, "orderId");
      options?.setActiveProjectId?.(projectId);
      if (orderId) {
        navigation.navigate("SaleOrderDetail", { orderId, projectId, projectName });
      } else {
        navigation.navigate("SaleProjectDetail", { projectId, tab: "Overview" });
      }
      return;
    }
  }

  if (referenceType === "PROJECT_SCHEDULE" || type.includes("schedule")) {
    if (projectId) {
      options?.setActiveProjectId?.(projectId);
      if (sales) {
        navigation.navigate("SaleProjectDetail", { projectId, tab: "Schedules" });
      } else {
        navigation.navigate("ProjectSchedules", { projectId, projectName });
      }
      return;
    }
  }

  if (
    referenceType === "PROJECT" ||
    type.includes("project.request") ||
    type.includes("projectrequestsubmitted") ||
    type.includes("basic_information")
  ) {
    if (sales) {
      if (type.includes("project.request.submitted") || type.includes("projectrequestsubmitted")) {
        if (projectId) {
          navigation.navigate("SaleProjectDetail", { projectId, tab: "Overview" });
          return;
        }
        navigation.navigate("SaleRequests");
        return;
      }
      if (projectId) {
        navigateProjectFlow(navigation, projectId, projectName, options);
        return;
      }
      navigateSalesHome(navigation);
      return;
    }
  }

  if (projectId) {
    navigateProjectFlow(navigation, projectId, projectName, options);
    return;
  }

  if (sales) {
    navigateSalesHome(navigation);
    return;
  }

  navigation.navigate("Home");
}
