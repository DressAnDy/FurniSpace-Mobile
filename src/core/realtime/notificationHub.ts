import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { ensureFreshAccessToken } from "../api/interceptors";
import { RealtimeNotificationPayloadDto } from "../../features/notification/models/notification.model";
import { NOTIFICATION_HUB_EVENTS } from "./notificationEvents";
import {
  getHubUrl,
  getSignalRRetryDelay,
  getSignalRTransportOptions,
  safeHubStart,
  signalRLogLevel,
} from "./signalr.config";

export { NOTIFICATION_HUB_EVENTS } from "./notificationEvents";

export type NotificationHubHandler = (
  payload: RealtimeNotificationPayloadDto,
  eventName: string,
) => void;

let connection: HubConnection | null = null;
let connectTask: Promise<boolean> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let allowReconnect = true;
const handlers = new Set<NotificationHubHandler>();

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
    void ensureFreshAccessToken().then((token) => {
      if (!token || !allowReconnect) {
        return;
      }

      void connectNotificationHub().then((connected) => {
        if (connected) {
          reconnectAttempt = 0;
        } else {
          scheduleNotificationHubReconnect();
        }
      });
    });
  }, delay);
}

function normalizePayload(payload: unknown, eventName: string): RealtimeNotificationPayloadDto {
  const raw = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const pickString = (...keys: string[]): string | null => {
    for (const key of keys) {
      const value = raw[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
    return null;
  };

  const metadataRaw = raw.metadata ?? raw.Metadata;
  const metadata =
    metadataRaw && typeof metadataRaw === "object" ? (metadataRaw as Record<string, unknown>) : undefined;

  return {
    notificationId: pickString("notificationId", "NotificationId"),
    title: pickString("title", "Title") ?? eventName,
    message: pickString("message", "Message"),
    notificationType: pickString("notificationType", "NotificationType") ?? eventName,
    projectId: pickString("projectId", "ProjectId"),
    referenceType: pickString("referenceType", "ReferenceType"),
    referenceId: pickString("referenceId", "ReferenceId"),
    createdAt: pickString("createdAt", "CreatedAt") ?? new Date().toISOString(),
    occurredAt: pickString("occurredAt", "OccurredAt") ?? new Date().toISOString(),
    metadata,
  };
}

function attachEventHandlers(hub: HubConnection): void {
  for (const eventName of NOTIFICATION_HUB_EVENTS) {
    hub.off(eventName);
    hub.on(eventName, (payload: unknown) => {
      const normalized = normalizePayload(payload, eventName);
      for (const handler of handlers) {
        handler(normalized, eventName);
      }
    });
  }
}

function attachLifecycleHandlers(hub: HubConnection): void {
  hub.onreconnected(() => {
    reconnectAttempt = 0;
  });

  hub.onclose(() => {
    if (connection === hub) {
      connection = null;
    }

    scheduleNotificationHubReconnect();
  });
}

export function subscribeNotificationHub(handler: NotificationHubHandler): () => void {
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
    const accessToken = await ensureFreshAccessToken();
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
      .withUrl(getNotificationHubUrl(), getSignalRTransportOptions())
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
