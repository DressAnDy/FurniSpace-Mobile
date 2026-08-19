import * as Keychain from "react-native-keychain";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_SERVICE = "furnispace.auth.access-token";
const REFRESH_TOKEN_SERVICE = "furnispace.auth.refresh-token";
const ACCESS_TOKEN_FALLBACK_KEY = "furnispace.auth.access-token.fallback";
const REFRESH_TOKEN_FALLBACK_KEY = "furnispace.auth.refresh-token.fallback";

async function safeSetGenericPassword(username: string, token: string, service: string, fallbackKey: string): Promise<void> {
  try {
    await Keychain.setGenericPassword(username, token, { service });
    await AsyncStorage.removeItem(fallbackKey);
  } catch {
    await AsyncStorage.setItem(fallbackKey, token);
  }
}

async function safeGetGenericPassword(service: string, fallbackKey: string): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword({ service });
    if (credentials) {
      return credentials.password;
    }
  } catch {
    // fallback below
  }

  return AsyncStorage.getItem(fallbackKey);
}

async function safeResetGenericPassword(service: string, fallbackKey: string): Promise<void> {
  try {
    await Keychain.resetGenericPassword({ service });
  } catch {
    // ignore and clear fallback anyway
  }

  await AsyncStorage.removeItem(fallbackKey);
}

export async function setAccessToken(token: string): Promise<void> {
  await safeSetGenericPassword("accessToken", token, ACCESS_TOKEN_SERVICE, ACCESS_TOKEN_FALLBACK_KEY);
}

export async function getAccessToken(): Promise<string | null> {
  return safeGetGenericPassword(ACCESS_TOKEN_SERVICE, ACCESS_TOKEN_FALLBACK_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  await safeSetGenericPassword("refreshToken", token, REFRESH_TOKEN_SERVICE, REFRESH_TOKEN_FALLBACK_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return safeGetGenericPassword(REFRESH_TOKEN_SERVICE, REFRESH_TOKEN_FALLBACK_KEY);
}

export async function clearAuthTokens(): Promise<void> {
  await Promise.all([
    safeResetGenericPassword(ACCESS_TOKEN_SERVICE, ACCESS_TOKEN_FALLBACK_KEY),
    safeResetGenericPassword(REFRESH_TOKEN_SERVICE, REFRESH_TOKEN_FALLBACK_KEY),
  ]);
}

export async function setAuthTokens(tokens: { accessToken?: string; refreshToken?: string }): Promise<void> {
  const jobs: Array<Promise<void>> = [];

  if (tokens.accessToken) {
    jobs.push(setAccessToken(tokens.accessToken));
  }

  if (tokens.refreshToken) {
    jobs.push(setRefreshToken(tokens.refreshToken));
  }

  await Promise.all(jobs);
}
