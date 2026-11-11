import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import "./ProtectedRoute.css";

const THEME_STORAGE_KEY = "apexbridge-landing-theme";

function getLoaderTheme() {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  } catch {
    // Fall back to the operating system preference when storage is unavailable.
  }

  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

function SessionLoader() {
  const [theme] = useState(getLoaderTheme);

  return (
    <main className="session-loader" data-theme={theme} role="status" aria-label="Loading" aria-live="polite">
      <span className="session-loader__spinner" aria-hidden="true" />
    </main>
  );
}

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <SessionLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
