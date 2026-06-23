/**
 * Axios client configuration
 * Base URL is read from the VITE_API_BASE_URL environment variable.
 * Change .env to point at a different host or a local proxy.
 */
import axios, { AxiosError, AxiosResponse } from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://verome-api.deno.dev";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor – log every outgoing call ────────────────────────────
client.interceptors.request.use((config) => {
  console.log(`[API] ➡ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.params ?? "");
  return config;
});

// ── Response interceptor – normalise errors ───────────────────────────────────
client.interceptors.response.use(
  (res: AxiosResponse) => {
    console.log(`[API] ✅ ${res.status} ${res.config.url}`);
    return res;
  },
  (err: AxiosError) => {
    if (!err.response) {
      // Network-level failure – could be CORS, offline, timeout
      const msg =
        err.code === "ERR_NETWORK"
          ? "Network error — this is likely a CORS issue. The API server must allow requests from this origin. Check the browser console Network tab for details."
          : err.code === "ECONNABORTED"
          ? "Request timed out. The API server took too long to respond."
          : `Network failure: ${err.message}`;
      console.error("[API] 🔴 Network error:", err);
      return Promise.reject(new Error(msg));
    }
    const status = err.response.status;
    const data: any = err.response.data;
    const msg =
      data?.error ?? data?.message ?? `HTTP ${status}: ${err.response.statusText}`;
    console.error(`[API] 🔴 ${status}`, data);
    return Promise.reject(new Error(msg));
  }
);

export default client;
