const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, { body, accessToken, ...options } = {}) {
  const headers = new Headers(options.headers);
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const result = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.error?.message || "The request could not be completed. Please try again.");
  }
  return result;
}

export const loginRequest = (credentials) => request("/auth/login", { method: "POST", body: credentials });
export const registerRequest = (details) => request("/auth/register", { method: "POST", body: details });
export const refreshRequest = () => request("/auth/refresh", { method: "POST" });
export const logoutRequest = () => request("/auth/logout", { method: "POST" });
