import type { ProjectStatus } from "../models/project.model";
import { RealtimeNotificationPayloadDto } from "../../notification/models/notification.model";
import { readMetadataString } from "../../notification/utils/notification.metadata";
import { normalizeRealtimeEventKey } from "../../../core/realtime/notificationEvents";

export const PROJECT_TRACKING_REFRESH_EVENTS = new Set([
  "project.request.submitted",
  "project.request.accepted",
  "project.more_information.requested",
  "project.basic_information.updated",
  "project.status.changed",
  "project.designer.assigned",
  "project.proposal.reopened",
  "proposal.published",
  "proposal.revision.requested",
  "proposal.selected",
  "proposal.reopened_for_editing",
  "quotation.sent",
  "quotation.accepted",
  "quotation.revision_requested",
  "quotation.revised",
  "quotation.rejected",
  "customization_request.submitted",
  "customization_request.designer_reviewed",
  "customization.version.submitted_for_review",
  "customization.version.production_reviewed",
  "customization.version.accepted",
  "project_schedule.created",
  "project_schedule.updated",
  "project_schedule.confirmed",
  "project_schedule.completed",
  "project_schedule.change_requested",
  "project_showcase.submitted",
  "order.deposit.paid",
  "order.updated",
  "order.delivered",
  "order.completed",
  "order.delivery.created",
  "order.delivery.started",
  "order.delivery.completed",
  "order.item.delivery_updated",
  "order.item.delivery_confirmed",
  "delivery.batch.created",
  "payment.created",
  "payment.processing",
  "payment.updated",
  "payment.expired",
  "payment.cancelled",
  "production.request.assigned",
  "production.request.created",
  "production.request.completed",
  "production_item.cancelled",
  "production.delay.reported",
  "delivery.delay.reported",
  "product_issue.reported",
  "product_issue.resolved",
  "measurement_image.uploaded",
]);

const PROJECT_EVENT_PREFIXES = [
  "project.",
  "proposal.",
  "quotation.",
  "order.",
  "payment.",
  "project_schedule.",
  "production.",
  "delivery.",
  "customization.",
  "customization_request.",
  "product_issue.",
  "measurement_image.",
];

export function resolveTrackingProjectId(payload: RealtimeNotificationPayloadDto): string | null {
  const fromPayload = payload.projectId?.trim();
  if (fromPayload) {
    return fromPayload;
  }

  const metadata = payload.metadata;
  const fromMetadata =
    readMetadataString(metadata, "projectId") ??
    readMetadataString(metadata, "ProjectId") ??
    readMetadataString(metadata, "projectID") ??
    readMetadataString(metadata, "ProjectID") ??
    readMetadataString(metadata, "project_id") ??
    readMetadataString(metadata, "project-id");
  if (fromMetadata) {
    return fromMetadata;
  }

  if (payload.referenceType === "PROJECT" && payload.referenceId?.trim()) {
    return payload.referenceId.trim();
  }

  return null;
}

export function resolveRealtimeEventKey(
  payload: Pick<RealtimeNotificationPayloadDto, "notificationType">,
  eventName?: string | null,
): string {
  return normalizeRealtimeEventKey(eventName, payload.notificationType);
}

export function isProjectTrackingRefreshEvent(eventKey: string): boolean {
  if (PROJECT_TRACKING_REFRESH_EVENTS.has(eventKey)) {
    return true;
  }

  return PROJECT_EVENT_PREFIXES.some((prefix) => eventKey.startsWith(prefix));
}

/**
 * Prefer hub eventName. If envelope has no projectId, still refresh (thin payload).
 */
export function shouldRefreshProjectTracking(
  payload: RealtimeNotificationPayloadDto,
  activeProjectId: string,
  eventName?: string | null,
): boolean {
  const eventKey = resolveRealtimeEventKey(payload, eventName);
  if (!isProjectTrackingRefreshEvent(eventKey)) {
    return false;
  }

  const eventProjectId = resolveTrackingProjectId(payload);
  if (!eventProjectId) {
    return true;
  }

  return eventProjectId === activeProjectId;
}

export function readNewProjectStatus(payload: RealtimeNotificationPayloadDto): ProjectStatus | string | null {
  return (
    readMetadataString(payload.metadata, "newProjectStatus") ??
    readMetadataString(payload.metadata, "NewProjectStatus") ??
    null
  );
}
