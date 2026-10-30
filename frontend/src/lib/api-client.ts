import axios from "axios";

const getApiBaseUrl = () => {
  const metaEnv = typeof import.meta !== "undefined" ? (import.meta as any).env : null;
  if (metaEnv?.VITE_API_URL) return metaEnv.VITE_API_URL;
  if (metaEnv?.NEXT_PUBLIC_API_URL) return metaEnv.NEXT_PUBLIC_API_URL;

  try {
    if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
  } catch (_) {}

  // If running locally in browser, default to local backend
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:8000/api/v1";
  }

  return "https://telegram-bot-stor1.onrender.com/api/v1";
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000, // 12 seconds timeout to prevent infinite loading
  withCredentials: true, // Sends HTTP-Only access_token cookie
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const isPublic = config.url?.startsWith("/public");
    const adminToken = localStorage.getItem("access_token");
    const customerToken = localStorage.getItem("customer_token");

    const token = isPublic ? (customerToken || adminToken) : (adminToken || customerToken);
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const isPublic = error.config?.url?.startsWith("/public");
      const isAdminRoute = window.location.pathname.startsWith("/admin") || window.location.pathname === "/";
      if (!isPublic && isAdminRoute && !window.location.pathname.startsWith("/login")) {
        localStorage.removeItem("access_token");
        document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
