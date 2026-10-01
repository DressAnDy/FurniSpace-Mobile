import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { PaymentUpdatedRealtimeDto } from "../../features/payment/models/payment.model";
import { ensureFreshAccessToken } from "../api/interceptors";
import {
  getHubUrl,
  getSignalRRetryDelay,
  getSignalRTransportOptions,
  safeHubStart,
  signalRLogLevel,
} from "./signalr.config";

export const PAYMENT_UPDATED_EVENT = "payment.updated";

type PaymentEventHandler = (payload: PaymentUpdatedRealtimeDto) => void;

let connection: HubConnection | null = null;
let connectTask: Promise<boolean> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let allowReconnect = true;
const handlers = new Set<PaymentEventHandler>();
const joinedPaymentIds = new Set<string>();

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function pickString(source: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function pickNumber(source: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return 0;
}

function normalizePaymentUpdatedPayload(payload: unknown): PaymentUpdatedRealtimeDto | null {
  const raw = asRecord(payload);
  if (!raw) {
    return null;
  }

  const paymentId = pickString(raw, "paymentId", "PaymentId");
  const projectId = pickString(raw, "projectId", "ProjectId");
  const paymentCode = pickString(raw, "paymentCode", "PaymentCode");
  const status = pickString(raw, "status", "Status");
  const paymentTransactionId = pickString(raw, "paymentTransactionId", "PaymentTransactionId") ?? "";
  const occurredAt = pickString(raw, "occurredAt", "OccurredAt") ?? new Date().toISOString();

  if (!paymentId || !projectId || !paymentCode) {
    return null;
  }

  return {
    paymentId,
    projectId,
    paymentCode,
    status: status as PaymentUpdatedRealtimeDto["status"],
    amount: pickNumber(raw, "amount", "Amount"),
    paidAmount: pickNumber(raw, "paidAmount", "PaidAmount"),
    remainingAmount: pickNumber(raw, "remainingAmount", "RemainingAmount"),
    paymentTransactionId,
    transactionAmount: pickNumber(raw, "transactionAmount", "TransactionAmount"),
    appliedAmount: pickNumber(raw, "appliedAmount", "AppliedAmount"),
    paidAt: pickString(raw, "paidAt", "PaidAt"),
    occurredAt,
  };
}

function clearReconnectTimer(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function schedulePaymentHubReconnect(): void {
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
      void connectPaymentHub().then((connected) => {
        if (connected) {
          reconnectAttempt = 0;
        } else {
          schedulePaymentHubReconnect();
        }
      });
    });
  }, delay);
}

function attachEventHandlers(hub: HubConnection): void {
  hub.off(PAYMENT_UPDATED_EVENT);
  hub.on(PAYMENT_UPDATED_EVENT, (payload: unknown) => {
    const normalized = normalizePaymentUpdatedPayload(payload);
    if (!normalized) {
      return;
    }

    for (const handler of handlers) {
      handler(normalized);
    }
  });

  hub.onreconnected(async () => {
    reconnectAttempt = 0;
    await rejoinActivePayments();
  });

  hub.onclose(() => {
    if (connection === hub) {
      connection = null;
    }
    schedulePaymentHubReconnect();
  });
}

async function rejoinActivePayments(): Promise<void> {
  if (!connection || connection.state !== HubConnectionState.Connected) {
    return;
  }

  await Promise.all(
    [...joinedPaymentIds].map((paymentId) => connection!.invoke("JoinPayment", paymentId).catch(() => undefined)),
  );
}

async function invokeJoinPayment(paymentId: string): Promise<void> {
  if (!connection || connection.state !== HubConnectionState.Connected) {
    return;
  }

  await connection.invoke("JoinPayment", paymentId).catch(() => undefined);
}

async function ensureJoinedPayment(paymentId: string, attempt = 0): Promise<void> {
  const connected = await connectPaymentHub();
  if (connected) {
    await invokeJoinPayment(paymentId);
    return;
  }

  if (attempt >= 5) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
  await ensureJoinedPayment(paymentId, attempt + 1);
}

export function subscribePaymentHub(handler: PaymentEventHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export async function connectPaymentHub(): Promise<boolean> {
  if (connection?.state === HubConnectionState.Connected) {
    return true;
  }

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

    clearReconnectTimer();

    if (connection) {
      await connection.stop().catch(() => undefined);
      connection = null;
    }

    const hub = new HubConnectionBuilder()
      .withUrl(getHubUrl("/hubs/payments"), getSignalRTransportOptions())
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (context) =>
          getSignalRRetryDelay(context.previousRetryCount, context.retryReason),
      })
      .configureLogging(signalRLogLevel)
      .build();

    attachEventHandlers(hub);
    connection = hub;

    const started = await safeHubStart(() => hub.start());
    if (started) {
      reconnectAttempt = 0;
      await rejoinActivePayments();
    } else {
      if (connection === hub) {
        connection = null;
      }
      schedulePaymentHubReconnect();
    }

    return started;
  })().finally(() => {
    connectTask = null;
  });

  return connectTask;
}

export async function disconnectPaymentHub(): Promise<void> {
  allowReconnect = false;
  joinedPaymentIds.clear();
  clearReconnectTimer();
  reconnectAttempt = 0;

  if (!connection) {
    return;
  }

  const hub = connection;
  connection = null;
  await hub.stop().catch(() => undefined);
}

export async function restartPaymentHub(): Promise<boolean> {
  clearReconnectTimer();
  allowReconnect = true;
  const hub = connection;
  connection = null;
  await hub?.stop().catch(() => undefined);
  return connectPaymentHub();
}

export async function joinPaymentHub(paymentId: string): Promise<void> {
  joinedPaymentIds.add(paymentId);
  await ensureJoinedPayment(paymentId);
}

export async function leavePaymentHub(paymentId: string): Promise<void> {
  joinedPaymentIds.delete(paymentId);

  if (!connection || connection.state !== HubConnectionState.Connected) {
    return;
  }

  await connection.invoke("LeavePayment", paymentId).catch(() => undefined);
}

export function getPaymentHubState(): HubConnectionState | null {
  return connection?.state ?? null;
}
