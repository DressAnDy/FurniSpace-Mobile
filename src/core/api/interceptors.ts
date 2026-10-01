import { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { endpoints } from "./endpoints";
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from "../storage/secureStorage";
import { extractAuthTokensFromSetCookie } from "./authCookies";
import { postAuthJson } from "./authTransport";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshTask: Promise<void> | null = null;
const tokenRefreshHandlers = new Set<() => void>();

export function subscribeAuthTokenRefresh(handler: () => void): () => void {
  tokenRefreshHandlers.add(handler);
  return () => tokenRefreshHandlers.delete(handler);
}

function shouldSkipRefresh(url?: string): boolean {
  if (!url) {
    return false;
  }

  return (
    url.includes(endpoints.auth.refresh) ||
    url.includes(endpoints.auth.login) ||
    url.includes(endpoints.auth.logout) ||
    url.includes("/auth/verify-email")
  );
}

function readJwtExpiryMs(token: string): number | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) {
      return null;
    }

    const normalized = payloadPart.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const json = typeof globalThis.atob === "function" ? globalThis.atob(padded) : "";
    if (!json) {
      return null;
    }
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function runTokenRefresh(): Promise<void> {
  const savedRefreshToken = await getRefreshToken();
  if (!savedRefreshToken) {
    throw new Error("Missing refresh token");
  }

  refreshTask ??= (async () => {
    const response = await postAuthJson(endpoints.auth.refresh, { refreshToken: savedRefreshToken });
    const tokens = extractAuthTokensFromSetCookie(response.setCookieLines);
    await setAuthTokens(tokens);
    for (const handler of tokenRefreshHandlers) {
      handler();
    }
  })().finally(() => {
    refreshTask = null;
  });

  await refreshTask;
}

/**
 * SignalR should refresh JWT before reconnect / negotiate when close to expiry.
 */
export async function ensureFreshAccessToken(skewMs = 60_000): Promise<string | null> {
  const token = await getAccessToken();
  if (!token) {
    return null;
  }

  const expiresAt = readJwtExpiryMs(token);
  const nearExpiry = expiresAt != null && expiresAt <= Date.now() + skewMs;
  if (!nearExpiry) {
    return token;
  }

  try {
    await runTokenRefresh();
  } catch {
    // Keep current token; hub start may still work briefly.
  }

  return (await getAccessToken()) ?? token;
}

export function setupInterceptors(client: AxiosInstance): void {
  client.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableRequestConfig | undefined;
      const status = error.response?.status;

      if (!originalRequest || status !== 401 || originalRequest._retry || shouldSkipRefresh(originalRequest.url)) {
        throw error;
      }

      const savedRefreshToken = await getRefreshToken();
      if (!savedRefreshToken) {
        throw error;
      }

      originalRequest._retry = true;

      try {
        await runTokenRefresh();
        const accessToken = await getAccessToken();
        if (accessToken) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return client(originalRequest);
      } catch (refreshError) {
        await clearAuthTokens();
        throw refreshError;
      }
    },
  );
}
