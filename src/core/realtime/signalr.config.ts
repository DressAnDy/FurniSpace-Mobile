import { HttpTransportType, LogLevel } from "@microsoft/signalr";
import { env } from "../config/env";

export function getRealtimeBaseUrl(): string {
  const raw = (env.wsUrl || env.apiUrl).trim().replace(/\/$/, "");

  if (raw.startsWith("wss://")) {
    return raw.replace(/^wss:\/\//, "https://").replace(/\/ws$/i, "");
  }

  if (raw.startsWith("ws://")) {
    return raw.replace(/^ws:\/\//, "http://").replace(/\/ws$/i, "");
  }

  return raw.replace(/\/ws$/i, "");
}

export function getHubUrl(hubPath: string): string {
  const normalizedPath = hubPath.startsWith("/") ? hubPath : `/${hubPath}`;
  return `${getRealtimeBaseUrl()}${normalizedPath}`;
}

export function getSignalRTransportOptions(accessTokenFactory: () => Promise<string>) {
  return {
    accessTokenFactory,
    transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
    skipNegotiation: false,
  };
}

export const signalRLogLevel = __DEV__ ? LogLevel.Warning : LogLevel.Error;

export async function safeHubStart(start: () => Promise<void>): Promise<boolean> {
  try {
    await start();
    return true;
  } catch {
    return false;
  }
}
