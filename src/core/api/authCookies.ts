import type { AxiosResponse } from "axios";

type HeaderLike =
  | string
  | string[]
  | {
      toString: () => string;
    };

function toCookieLines(raw: HeaderLike | undefined): string[] {
  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw.flatMap((line) => line.split(/,(?=\s*[A-Za-z0-9_.-]+=)/g));
  }

  return String(raw)
    .split(/\r?\n/)
    .flatMap((line) => line.split(/,(?=\s*[A-Za-z0-9_.-]+=)/g));
}

function parseRawResponseHeaders(rawHeaders: string | undefined): string[] {
  if (!rawHeaders) {
    return [];
  }

  const cookieLines: string[] = [];
  for (const line of rawHeaders.split(/\r?\n/)) {
    const match = /^set-cookie:\s*(.+)$/i.exec(line.trim());
    if (match?.[1]) {
      cookieLines.push(match[1]);
    }
  }

  return cookieLines;
}

function readCookieValue(setCookie: string[], cookieName: string): string | null {
  for (const line of setCookie) {
    const trimmed = line.trim();
    if (!trimmed.toLowerCase().startsWith(`${cookieName.toLowerCase()}=`)) {
      continue;
    }

    const rawValue = trimmed.slice(cookieName.length + 1).split(";", 1)[0];
    if (!rawValue) {
      continue;
    }

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return null;
}

function readHeaderCaseInsensitive(headers: Record<string, unknown>, key: string): HeaderLike | undefined {
  const direct = headers[key] ?? headers[key.toLowerCase()] ?? headers[key.toUpperCase()];
  if (direct) {
    return direct as HeaderLike;
  }

  const matchedKey = Object.keys(headers).find((headerKey) => headerKey.toLowerCase() === key.toLowerCase());
  return matchedKey ? (headers[matchedKey] as HeaderLike) : undefined;
}

export function collectSetCookieFromAxiosResponse(response: AxiosResponse): string[] {
  const headerMap = (response.headers ?? {}) as Record<string, unknown>;
  const fromNormalizedHeaders = toCookieLines(readHeaderCaseInsensitive(headerMap, "set-cookie"));

  const request = response.request as
    | {
        responseHeaders?: Record<string, string> | string;
        _response?: string;
      }
    | undefined;

  const fromRequestObject =
    request?.responseHeaders && typeof request.responseHeaders === "object"
      ? toCookieLines(readHeaderCaseInsensitive(request.responseHeaders as Record<string, unknown>, "set-cookie"))
      : typeof request?.responseHeaders === "string"
        ? parseRawResponseHeaders(request.responseHeaders)
        : [];

  const fromRawString =
    typeof request?.responseHeaders === "string"
      ? parseRawResponseHeaders(request.responseHeaders)
      : parseRawResponseHeaders(typeof request?._response === "string" ? request._response : undefined);

  return [...fromNormalizedHeaders, ...fromRequestObject, ...fromRawString];
}

export function extractAuthTokensFromSetCookie(rawSetCookie: HeaderLike | string[] | undefined): {
  accessToken?: string;
  refreshToken?: string;
} {
  const cookieLines = Array.isArray(rawSetCookie) ? rawSetCookie : toCookieLines(rawSetCookie);

  const accessToken = readCookieValue(cookieLines, "access_token");
  const refreshToken = readCookieValue(cookieLines, "refresh_token");

  return {
    ...(accessToken ? { accessToken } : {}),
    ...(refreshToken ? { refreshToken } : {}),
  };
}

export function extractAuthTokensFromAxiosResponse(response: AxiosResponse): {
  accessToken?: string;
  refreshToken?: string;
} {
  return extractAuthTokensFromSetCookie(collectSetCookieFromAxiosResponse(response));
}
