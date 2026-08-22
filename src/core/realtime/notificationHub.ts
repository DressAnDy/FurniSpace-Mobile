import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { getAccessToken } from "../storage/secureStorage";
import { RealtimeNotificationPayloadDto } from "../../features/notification/models/notification.model";
import {
  getHubUrl,
  getSignalRRetryDelay,
  getSignalRTransportOptions,
  safeHubStart,
  signalRLogLevel,
} from "./signalr.config";

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
let connectTask: Promise<boolean> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let allowReconnect = true;
const handlers = new Set<NotificationEventHandler>();

function getNotificationHubUrl(): string {
  return getHubUrl("/hubs/notifications");
}

function clearReconnectTimer(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function scheduleNotificationHubReconnect(): void {
  if (!allowReconnect || connectTask || reconnectTimer) {
    return;
  }

  const delay = Math.min(2000 * 2 ** reconnectAttempt, 30000);
  reconnectAttempt += 1;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void getAccessToken().then((token) => {
      if (!token || !allowReconnect) {
        return;
      }

      void connectNotificationHub().then((connected) => {
        if (connected) {
          reconnectAttempt = 0;
        }
      });
    });
  }, delay);
}

function attachEventHandlers(hub: HubConnection): void {
  for (const eventName of NOTIFICATION_HUB_EVENTS) {
    hub.off(eventName);
    hub.on(eventName, (payload: RealtimeNotificationPayloadDto) => {
      for (const handler of handlers) {
        handler(payload);
      }
    });
  }
}

function attachLifecycleHandlers(hub: HubConnection): void {
  hub.onreconnected(() => {
    reconnectAttempt = 0;
  });

  hub.onclose((error) => {
    if (connection === hub) {
      connection = null;
    }

    if (error) {
      scheduleNotificationHubReconnect();
    }
  });
}

export function subscribeNotificationHub(handler: NotificationEventHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

async function disposeConnection(hub: HubConnection | null): Promise<void> {
  if (!hub) {
    return;
  }

  await hub.stop().catch(() => undefined);
}

export async function connectNotificationHub(): Promise<boolean> {
  if (connectTask) {
    return connectTask;
  }

  connectTask = (async () => {
    allowReconnect = true;
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return false;
    }

    if (connection?.state === HubConnectionState.Connected) {
      return true;
    }

    if (connection?.state === HubConnectionState.Connecting) {
      return false;
    }

    clearReconnectTimer();

    if (connection) {
      const staleConnection = connection;
      connection = null;
      await disposeConnection(staleConnection);
    }

    const hub = new HubConnectionBuilder()
      .withUrl(getNotificationHubUrl(), getSignalRTransportOptions(async () => (await getAccessToken()) ?? ""))
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          return getSignalRRetryDelay(retryContext.previousRetryCount, retryContext.retryReason);
        },
      })
      .configureLogging(signalRLogLevel)
      .build();

    attachEventHandlers(hub);
    attachLifecycleHandlers(hub);
    connection = hub;

    const started = await safeHubStart(() => hub.start());
    if (started) {
      reconnectAttempt = 0;
    } else if (connection === hub) {
      connection = null;
      scheduleNotificationHubReconnect();
    }

    return started;
  })().finally(() => {
    connectTask = null;
  });

  return connectTask;
}

export async function disconnectNotificationHub(): Promise<void> {
  allowReconnect = false;
  clearReconnectTimer();
  reconnectAttempt = 0;

  if (!connection) {
    return;
  }

  const hub = connection;
  connection = null;
  await disposeConnection(hub);
}

export async function restartNotificationHub(): Promise<boolean> {
  clearReconnectTimer();
  allowReconnect = true;
  const hub = connection;
  connection = null;
  await disposeConnection(hub);
  return connectNotificationHub();
}

export function getNotificationHubState(): HubConnectionState | null {
  return connection?.state ?? null;
}
