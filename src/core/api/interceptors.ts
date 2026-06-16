import { AxiosInstance } from "axios";
import { getAccessToken } from "../storage/secureStorage";

export function setupInterceptors(client: AxiosInstance): void {
  client.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}
