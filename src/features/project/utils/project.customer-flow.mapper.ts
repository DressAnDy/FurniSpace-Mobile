import type { ProjectStatus } from "../models/project.model";

export type CustomerFlowScreen =
  | "project_detail"
  | "update_basic_info"
  | "proposals"
  | "proposal_detail"
  | "quotations"
  | "quotation_detail"
  | "orders"
  | "order_detail"
  | "payment_deposit"
  | "payment_remaining"
  | "tracking"
  | "schedules"
  | "chat";

export type CustomerFlowActionId =
  | "update_basic_information"
  | "view_proposals"
  | "view_quotations"
  | "view_orders"
  | "pay_deposit"
  | "pay_remaining"
  | "confirm_schedule"
  | "confirm_delivery"
  | "reopen_proposal"
  | "open_chat";

export type CustomerFlowAction = {
  id: CustomerFlowActionId;
  label: string;
  screen: CustomerFlowScreen;
  primary?: boolean;
};

export type CustomerFlowStage = "project" | "proposal" | "quotation" | "order" | "production";

export type CustomerFlowDecision = {
  stage: CustomerFlowStage;
  headline: string;
  description: string;
  actions: CustomerFlowAction[];
  /** APIs mobile should load in parallel on project detail / tracking. */
  fetchKeys: Array<
    | "project_detail"
    | "phase_deadlines"
    | "proposals"
    | "published_proposal"
    | "quotations"
    | "orders"
    | "payments"
    | "schedules"
  >;
  isTerminal?: boolean;
};

const BASE_FETCH = ["project_detail", "phase_deadlines", "schedules"] as const;

export function resolveCustomerFlowDecision(status: ProjectStatus): CustomerFlowDecision {
  switch (status) {
    case "SUBMITTED":
      return {
        stage: "project",
        headline: "Request submitted",
        description: "Your project is waiting for sales to accept and start consultation.",
        actions: [{ id: "open_chat", label: "Message team", screen: "chat" }],
        fetchKeys: [...BASE_FETCH],
      };

    case "IN_CONSULTATION":
      return {
        stage: "project",
        headline: "In consultation",
        description: "Discuss scope and requirements with your sales team.",
        actions: [
          { id: "open_chat", label: "Open chat", screen: "chat", primary: true },
        ],
        fetchKeys: [...BASE_FETCH],
      };

    case "NEED_BASIC_INFORMATION":
      return {
        stage: "project",
        headline: "More information needed",
        description: "Sales requested additional project details.",
        actions: [
          {
            id: "update_basic_information",
            label: "Update basic information",
            screen: "update_basic_info",
            primary: true,
          },
        ],
        fetchKeys: [...BASE_FETCH],
      };

    case "WAITING_FOR_DESIGNER_ASSIGNMENT":
    case "MEASUREMENT_REQUIRED":
    case "SPACE_VERIFIED":
      return {
        stage: "project",
        headline: "Designer assignment & measurement",
        description: "Your team is preparing site measurement and design kickoff.",
        actions: [
          { id: "confirm_schedule", label: "Confirm schedule", screen: "schedules", primary: true },
        ],
        fetchKeys: [...BASE_FETCH],
      };

    case "PROPOSAL_CONSULTING":
      return {
        stage: "proposal",
        headline: "Review proposals",
        description: "Compare published design options and select your final proposal.",
        actions: [
          { id: "view_proposals", label: "View proposals", screen: "proposals", primary: true },
          { id: "open_chat", label: "Discuss with designer", screen: "chat" },
        ],
        fetchKeys: [...BASE_FETCH, "proposals", "published_proposal"],
      };

    case "PROPOSAL_SELECTED":
      return {
        stage: "quotation",
        headline: "Waiting for quotation",
        description: "You selected a proposal. Sales is preparing your quotation.",
        actions: [
          { id: "view_proposals", label: "View selected proposal", screen: "proposals" },
          { id: "reopen_proposal", label: "Reopen proposal", screen: "proposals" },
        ],
        fetchKeys: [...BASE_FETCH, "proposals", "quotations"],
      };

    case "QUOTATION_SENT":
      return {
        stage: "quotation",
        headline: "Quotation ready",
        description: "Review totals and decide to accept, request revision, or reject.",
        actions: [
          { id: "view_quotations", label: "Review quotation", screen: "quotations", primary: true },
          { id: "reopen_proposal", label: "Reopen proposal", screen: "proposals" },
        ],
        fetchKeys: [...BASE_FETCH, "quotations", "orders"],
      };

    case "QUOTATION_REVISION_REQUESTED":
      return {
        stage: "quotation",
        headline: "Quotation revision in progress",
        description: "Sales is updating your quotation based on your feedback.",
        actions: [{ id: "view_quotations", label: "View quotation status", screen: "quotations", primary: true }],
        fetchKeys: [...BASE_FETCH, "quotations"],
      };

    case "ORDER_CONFIRMED":
      return {
        stage: "order",
        headline: "Order confirmed",
        description: "Pay the deposit to start production.",
        actions: [
          { id: "pay_deposit", label: "Pay deposit", screen: "payment_deposit", primary: true },
          { id: "view_quotations", label: "View accepted quotation", screen: "quotations" },
        ],
        fetchKeys: [...BASE_FETCH, "orders", "quotations", "payments"],
      };

    case "IN_PRODUCTION":
    case "READY_FOR_DELIVERY":
      return {
        stage: "production",
        headline: "In production",
        description: "Your order is being manufactured. Track milestones and schedules.",
        actions: [
          { id: "confirm_schedule", label: "Delivery Schedule", screen: "schedules", primary: true },
          { id: "view_orders", label: "View order", screen: "orders" },
        ],
        fetchKeys: [...BASE_FETCH, "orders", "payments", "schedules"],
      };

    case "DELIVERING":
      return {
        stage: "production",
        headline: "Delivering",
        description: "Review your delivery schedule, then confirm receipt when items arrive.",
        actions: [
          { id: "confirm_schedule", label: "Delivery Schedule", screen: "schedules", primary: true },
          { id: "confirm_delivery", label: "Confirm delivery received", screen: "orders" },
        ],
        fetchKeys: [...BASE_FETCH, "orders", "schedules"],
      };

    case "DELIVERED":
      return {
        stage: "production",
        headline: "Delivered",
        description: "Confirm receipt and pay the remaining balance to complete your order.",
        actions: [
          { id: "pay_remaining", label: "Pay remaining balance", screen: "payment_remaining", primary: true },
          { id: "view_orders", label: "View order", screen: "orders" },
        ],
        fetchKeys: [...BASE_FETCH, "orders", "payments"],
      };

    case "COMPLETED":
      return {
        stage: "production",
        headline: "Project completed",
        description: "Your project has reached the final stage.",
        actions: [{ id: "view_orders", label: "View order history", screen: "orders" }],
        fetchKeys: [...BASE_FETCH, "orders", "payments"],
        isTerminal: true,
      };

    case "REJECTED":
      return {
        stage: "project",
        headline: "Project rejected",
        description: "This project is no longer active.",
        actions: [],
        fetchKeys: ["project_detail"],
        isTerminal: true,
      };

    default:
      return {
        stage: "project",
        headline: "Project update",
        description: "Track your project progress.",
        actions: [{ id: "open_chat", label: "Open chat", screen: "chat" }],
        fetchKeys: [...BASE_FETCH],
      };
  }
}

/** Proposal list item — customer can act only on PUBLISHED. */
export function canSelectProposal(status: string): boolean {
  return status === "PUBLISHED";
}

export function canRequestProposalRevision(status: string): boolean {
  return status === "PUBLISHED";
}

/** Quotation — customer can decide on SENT or REVISED. */
export function canAcceptQuotation(status: string): boolean {
  return status === "SENT" || status === "REVISED";
}

export function canRequestQuotationRevision(status: string): boolean {
  return status === "SENT" || status === "REVISED";
}

export function canRejectQuotation(status: string): boolean {
  return status === "SENT" || status === "REVISED";
}

/** Order deposit — after quotation accept. */
export function canPayOrderDeposit(status: string): boolean {
  return status === "CREATED" || status === "DEPOSIT_PENDING";
}

export function canPayOrderRemaining(orderStatus: string): boolean {
  return orderStatus === "FINAL_PAYMENT_PENDING" || orderStatus === "DELIVERED";
}

export function canReopenProposalByProjectStatus(status: ProjectStatus, depositPaid: boolean): boolean {
  if (depositPaid) {
    return false;
  }

  return status === "PROPOSAL_SELECTED" || status === "QUOTATION_SENT" || status === "ORDER_CONFIRMED";
}
