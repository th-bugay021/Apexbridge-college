import axios from "axios";

// Shares the in-memory access token through AuthContext and refreshes once via the HttpOnly cookie.
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

let authBridge = {
  getAccessToken: () => null,
  setAccessToken: () => {},
  onAuthFailure: () => {},
};
let refreshPromise = null;

export function registerAuthBridge(bridge) {
  authBridge = { ...authBridge, ...bridge };
}

api.interceptors.request.use((config) => {
  const token = authBridge.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const url = request?.url || "";
    const isAuthRequest = /\/auth\/(login|refresh)(?:\?|$)/.test(url);

    if (error.response?.status !== 401 || !request || request._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${baseURL.replace(/\/$/, "")}/auth/refresh`, {}, {
            withCredentials: true,
            timeout: 15000,
            headers: { "Content-Type": "application/json" },
          })
          .then(({ data }) => {
            const token = data?.accessToken;
            if (!token) throw new Error("Refresh response did not include an access token");
            authBridge.setAccessToken(token);
            return token;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const token = await refreshPromise;
      request.headers = request.headers || {};
      request.headers.Authorization = `Bearer ${token}`;
      return api(request);
    } catch (refreshError) {
      authBridge.onAuthFailure();
      return Promise.reject(refreshError);
    }
  },
);

export default api;
