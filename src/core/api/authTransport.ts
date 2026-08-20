import { AppError } from "../errors/AppError";
import { env } from "../config/env";
import { ApiResponse } from "../../shared/types/api";

type AuthTransportResponse<T> = {
  payload: ApiResponse<T>;
  setCookieLines: string[];
};

function parseRawResponseHeaders(rawHeaders: string): string[] {
  const cookieLines: string[] = [];

  for (const line of rawHeaders.split(/\r?\n/)) {
    const match = /^set-cookie:\s*(.+)$/i.exec(line.trim());
    if (match?.[1]) {
      cookieLines.push(match[1]);
    }
  }

  return cookieLines;
}

function mapStatusToErrorCode(status: number): AppError["code"] {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 400 || status === 422) return "VALIDATION_ERROR";
  if (status === 409) return "CONFLICT";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN_ERROR";
}

function postJson<T>(path: string, body: unknown, accessToken?: string): Promise<AuthTransportResponse<T>> {
  const url = `${env.authApiUrl}${path}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "application/json");
    if (accessToken) {
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    }
    xhr.timeout = env.timeoutMs;

    xhr.onload = () => {
      let payload: ApiResponse<T>;
      try {
        payload = JSON.parse(xhr.responseText) as ApiResponse<T>;
      } catch {
        reject(new AppError("Invalid response from server.", "SERVER_ERROR", xhr.status));
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        const firstError =
          payload.errors && payload.errors.length > 0
            ? typeof payload.errors[0] === "string"
              ? payload.errors[0]
              : String(payload.errors[0])
            : undefined;

        reject(
          new AppError(
            payload.message ?? firstError ?? "Request failed.",
            mapStatusToErrorCode(xhr.status),
            xhr.status,
          ),
        );
        return;
      }

      resolve({
        payload,
        setCookieLines: parseRawResponseHeaders(xhr.getAllResponseHeaders()),
      });
    };

    xhr.onerror = () => reject(new AppError("Network error. Please check your connection.", "NETWORK_ERROR"));
    xhr.ontimeout = () => reject(new AppError("Request timeout. Please try again.", "NETWORK_ERROR"));
    xhr.send(JSON.stringify(body));
  });
}

export function postAuthJson<T>(path: string, body: unknown): Promise<AuthTransportResponse<T>> {
  return postJson<T>(path, body);
}

export function postAuthJsonWithBearer<T>(
  path: string,
  body: unknown,
  accessToken: string,
): Promise<AuthTransportResponse<T>> {
  return postJson<T>(path, body, accessToken);
}
