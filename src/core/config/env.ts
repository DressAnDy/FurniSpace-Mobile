type AppEnv = {
  apiUrl: string;
  authApiUrl: string;
  wsUrl: string;
  timeoutMs: number;
};

const DEFAULT_TIMEOUT_MS = 15000;

function readRequiredEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim()) {
      return value;
    }
  }

  throw new Error(`Missing required env: ${keys.join(" or ")}`);
}

export const env: AppEnv = {
  apiUrl: readRequiredEnv("EXPO_PUBLIC_API_URL", "VITE_API_URL"),
  authApiUrl: readRequiredEnv("EXPO_PUBLIC_AUTH_API_URL", "VITE_AUTH_API_URL"),
  wsUrl: readRequiredEnv("EXPO_PUBLIC_WS_URL", "VITE_WS_URL"),
  timeoutMs: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS),
};
