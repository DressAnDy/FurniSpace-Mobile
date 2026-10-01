/**
 * NotificationsHub event catalog (SignalR method names).
 * Hub method = dotted event name; payload.notificationType = PascalCase (e.g. QuotationSent).
 */
export const NOTIFICATION_HUB_EVENTS = [
  // InApp
  "notification.created",
  "project.request.submitted",
  "project.request.accepted",
  "project.more_information.requested",
  "project.basic_information.updated",
  "project.designer.assigned",
  "project.proposal.reopened",
  "proposal.published",
  "proposal.selected",
  "proposal.revision.requested",
  "proposal.reopened_for_editing",
  "quotation.sent",
  "quotation.revised",
  "quotation.revision_requested",
  "quotation.rejected",
  "quotation.accepted",
  "customization_request.submitted",
  "customization_request.designer_reviewed",
  "customization.version.submitted_for_review",
  "customization.version.production_reviewed",
  "customization.version.accepted",
  "project_schedule.created",
  "project_schedule.confirmed",
  "project_schedule.change_requested",
  "project_showcase.submitted",
  "payment.created",
  "payment.updated",
  "payment.processing",
  "payment.expired",
  "payment.cancelled",
  "payment.transaction.failed",
  "payment.transaction.cancelled",
  "order.deposit.paid",
  "order.updated",
  "order.delivered",
  "order.completed",
  "order.delivery.created",
  "order.delivery.started",
  "order.delivery.completed",
  "delivery.batch.created",
  "production.request.created",
  "production.request.assigned",
  "production.request.completed",
  "production_item.cancelled",
  "production.delay.reported",
  "delivery.delay.reported",
  "product_issue.reported",
  "product_issue.resolved",
  "project_chat.message_sent",
  // RealtimeOnly (notificationId often null)
  "project.status.changed",
  "project_schedule.updated",
  "project_schedule.completed",
  "order.item.delivery_updated",
  "order.item.delivery_confirmed",
  "measurement_image.uploaded",
] as const;

export type NotificationHubEventName = (typeof NOTIFICATION_HUB_EVENTS)[number];

const PASCAL_COMPOUND_FIXES: Array<[RegExp, string]> = [
  [/^project\.chat\./, "project_chat."],
  [/^customization\.request\./, "customization_request."],
  [/^project\.schedule\./, "project_schedule."],
  [/^project\.showcase\./, "project_showcase."],
  [/^production\.item\./, "production_item."],
  [/^product\.issue\./, "product_issue."],
  [/^measurement\.image\./, "measurement_image."],
];

/**
 * Prefer SignalR event name; fall back to converting PascalCase notificationType.
 */
export function normalizeRealtimeEventKey(
  eventName?: string | null,
  notificationType?: string | null,
): string {
  const fromEvent = (eventName ?? "").trim();
  if (fromEvent.includes(".")) {
    return fromEvent.toLowerCase();
  }

  const raw = (notificationType ?? fromEvent).trim();
  if (!raw) {
    return "";
  }

  if (raw.includes(".")) {
    return raw.toLowerCase().replace(/[_\s]+/g, ".");
  }

  let dotted = raw
    .replace(/([a-z0-9])([A-Z])/g, "$1.$2")
    .replace(/[_\s]+/g, ".")
    .toLowerCase();

  for (const [pattern, replacement] of PASCAL_COMPOUND_FIXES) {
    dotted = dotted.replace(pattern, replacement);
  }

  return dotted;
}

export function eventStartsWith(eventKey: string, ...prefixes: string[]): boolean {
  return prefixes.some((prefix) => eventKey === prefix || eventKey.startsWith(prefix));
}

export function isChatRealtimeEvent(eventKey: string, referenceType?: string | null): boolean {
  return (
    eventKey === "project_chat.message_sent" ||
    eventKey.startsWith("project_chat.") ||
    (referenceType ?? "").toUpperCase() === "PROJECT_CHAT_MESSAGE"
  );
}
