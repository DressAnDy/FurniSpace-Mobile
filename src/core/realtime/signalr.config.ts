import { Platform } from "react-native";
import { HttpTransportType, LogLevel } from "@microsoft/signalr";
import { ensureFreshAccessToken } from "../api/interceptors";
import { env } from "../config/env";

export function getRealtimeBaseUrl(): string {
  const raw = (env.wsUrl || env.apiUrl).trim().replace(/\/$/, "");

  let httpBase = raw;
  if (raw.startsWith("wss://")) {
    httpBase = raw.replace(/^wss:\/\//, "https://");
  } else if (raw.startsWith("ws://")) {
    httpBase = raw.replace(/^ws:\/\//, "http://");
  }

  // Hubs live on API host without trailing /api (same as VITE_API_BASE_URL).
  return httpBase.replace(/\/ws$/i, "").replace(/\/api$/i, "");
}

export function getHubUrl(hubPath: string): string {
  const normalizedPath = hubPath.startsWith("/") ? hubPath : `/${hubPath}`;
  return `${getRealtimeBaseUrl()}${normalizedPath}`;
}

/**
 * Always pass JWT via accessTokenFactory (negotiate + WebSocket query).
 * Do not rely on cookies alone on mobile.
 */
export function getSignalRTransportOptions() {
  return {
    accessTokenFactory: async () => (await ensureFreshAccessToken()) ?? "",
    // Native WebSocket often fails against ASP.NET SignalR (proxy/TLS). Long polling is reliable on mobile.
    transport:
      Platform.OS === "web"
        ? HttpTransportType.WebSockets | HttpTransportType.LongPolling
        : HttpTransportType.LongPolling,
    skipNegotiation: false,
  };
}

export const signalRLogLevel = LogLevel.Critical;

export function isStaleSignalRConnectionError(error: Error | undefined): boolean {
  const message = error?.message ?? "";
  return message.includes("404") || message.includes("No Connection with that ID");
}

export function getSignalRRetryDelay(previousRetryCount: number, error?: Error): number | null {
  if (isStaleSignalRConnectionError(error)) {
    return null;
  }

  const delays = [0, 2000, 5000, 10000, 30000];
  return delays[previousRetryCount] ?? 30000;
}

export async function safeHubStart(start: () => Promise<void>): Promise<boolean> {
  try {
    await ensureFreshAccessToken();
    await start();
    return true;
  } catch {
    return false;
  }
}
