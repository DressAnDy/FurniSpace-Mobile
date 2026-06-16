import axios from "axios";
import { env } from "../config/env";
import { setupInterceptors } from "./interceptors";

export const httpClient = axios.create({
  baseURL: env.apiUrl,
  timeout: env.timeoutMs,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

setupInterceptors(httpClient);

export const authHttpClient = axios.create({
  baseURL: env.authApiUrl,
  timeout: env.timeoutMs,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

setupInterceptors(authHttpClient);
