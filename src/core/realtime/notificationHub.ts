import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { env } from "../config/env";
import { getAccessToken } from "../storage/secureStorage";
import { RealtimeNotificationPayloadDto } from "../../features/notification/models/notification.model";

export const NOTIFICATION_HUB_EVENTS = [
  "project.request.submitted",
  "project.request.accepted",
  "project.more_information.requested",
  "project.basic_information.updated",
  "project.status.changed",
  "notification.created",
  "project.designer.assigned",
  "proposal.published",
  "proposal.revision.requested",
  "proposal.selected",
  "quotation.sent",
  "quotation.accepted",
  "quotation.revision_requested",
  "quotation.revised",
  "quotation.rejected",
  "customization_request.submitted",
  "customization_request.designer_reviewed",
  "project_schedule.created",
  "project_schedule.updated",
  "project_schedule.confirmed",
  "project_schedule.completed",
  "project_schedule.cancelled",
  "project_chat.message_sent",
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
  "payment.cancelled",
  "payment.transaction.failed",
  "payment.transaction.cancelled",
  "production.request.assigned",
  "production.request.created",
  "production.request.completed",
  "production_item.cancelled",
] as const;

type NotificationEventHandler = (payload: RealtimeNotificationPayloadDto) => void;

let connection: HubConnection | null = null;
let connectTask: Promise<void> | null = null;
const handlers = new Set<NotificationEventHandler>();

function getNotificationHubUrl(): string {
  return `${env.apiUrl.replace(/\/$/, "")}/hubs/notifications`;
}

function attachEventHandlers(hub: HubConnection): void {
  for (const eventName of NOTIFICATION_HUB_EVENTS) {
    hub.on(eventName, (payload: RealtimeNotificationPayloadDto) => {
      for (const handler of handlers) {
        handler(payload);
      }
    });
  }
}

export function subscribeNotificationHub(handler: NotificationEventHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export async function connectNotificationHub(): Promise<void> {
  if (connectTask) {
    return connectTask;
  }

  connectTask = (async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return;
    }

    if (connection && connection.state === HubConnectionState.Connected) {
      return;
    }

    if (connection && connection.state === HubConnectionState.Connecting) {
      return;
    }

    if (connection) {
      await connection.stop().catch(() => undefined);
      connection = null;
    }

    const hub = new HubConnectionBuilder()
      .withUrl(getNotificationHubUrl(), {
        accessTokenFactory: async () => (await getAccessToken()) ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(__DEV__ ? LogLevel.Information : LogLevel.Warning)
      .build();

    attachEventHandlers(hub);
    connection = hub;
    await hub.start();
  })().finally(() => {
    connectTask = null;
  });

  return connectTask;
}

export async function disconnectNotificationHub(): Promise<void> {
  if (!connection) {
    return;
  }

  const hub = connection;
  connection = null;
  await hub.stop().catch(() => undefined);
}

export function getNotificationHubState(): HubConnectionState | null {
  return connection?.state ?? null;
}
