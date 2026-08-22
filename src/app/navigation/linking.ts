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
      PaymentMethod: "payment",
      PayOSPayment: "payos-payment",
      ResetPassword: "reset-password",
      SePayPayment: "sepay-payment",
      Tracking: {
        path: "tracking/:projectId?",
        parse: { projectId: (value: string) => value },
      },
      ProjectProposals: "projects/:projectId/proposals",
      ProposalDetail: "proposals/:proposalId",
      ProjectQuotations: "projects/:projectId/quotations",
      QuotationDetail: "quotations/:quotationId",
      ProjectOrders: "projects/:projectId/orders",
      OrderDetail: "orders/:orderId",
      ProjectSchedules: "projects/:projectId/schedules",
      CreateProjectRequest: "projects/new",
      VerifyEmail: "verify-email",
    },
  },
};
