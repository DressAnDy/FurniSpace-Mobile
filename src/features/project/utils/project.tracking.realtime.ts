import { RealtimeNotificationPayloadDto } from "../../notification/models/notification.model";
import { readMetadataString } from "../../notification/utils/notification.metadata";

export const PROJECT_TRACKING_REFRESH_EVENTS = new Set([
  "project.request.submitted",
  "project.request.accepted",
  "project.more_information.requested",
  "project.basic_information.updated",
  "project.status.changed",
  "project.designer.assigned",
  "proposal.published",
  "proposal.revision.requested",
  "proposal.selected",
  "quotation.sent",
  "quotation.accepted",
  "quotation.revision_requested",
  "quotation.revised",
  "quotation.rejected",
  "project_schedule.created",
  "project_schedule.updated",
  "project_schedule.confirmed",
  "project_schedule.completed",
  "project_schedule.cancelled",
  "order.deposit.paid",
  "order.updated",
  "order.delivered",
  "order.completed",
  "order.item.delivery_updated",
  "order.item.delivery_confirmed",
  "payment.created",
  "payment.processing",
  "payment.updated",
  "payment.expired",
  "production.request.assigned",
  "production.request.created",
  "production.request.completed",
]);

const PROJECT_EVENT_PREFIXES = ["project.", "proposal.", "quotation.", "order.", "payment.", "project_schedule.", "production."];

export function resolveTrackingProjectId(payload: RealtimeNotificationPayloadDto): string | null {
  const fromPayload = payload.projectId?.trim();
  if (fromPayload) {
    return fromPayload;
  }

  const metadata = payload.metadata;
  return (
    readMetadataString(metadata, "projectId") ??
    readMetadataString(metadata, "ProjectId") ??
    null
  );
}

export function isProjectTrackingRefreshEvent(notificationType: string): boolean {
  if (PROJECT_TRACKING_REFRESH_EVENTS.has(notificationType)) {
    return true;
  }

  return PROJECT_EVENT_PREFIXES.some((prefix) => notificationType.startsWith(prefix));
}

export function shouldRefreshProjectTracking(
  payload: RealtimeNotificationPayloadDto,
  activeProjectId: string,
): boolean {
  if (!isProjectTrackingRefreshEvent(payload.notificationType)) {
    return false;
  }

  const eventProjectId = resolveTrackingProjectId(payload);
  if (!eventProjectId) {
    return false;
  }

  return eventProjectId === activeProjectId;
}
