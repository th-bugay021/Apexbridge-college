import { useCallback, useEffect, useState } from "react";
import ThemeContext from "./themeContextStore";
const THEME_STORAGE_KEY = "apexbridge-landing-theme";

function readStoredTheme() {
  try {
    const theme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return theme === "light" || theme === "dark" ? theme : null;
  } catch {
    return null;
  }
}

function readSystemTheme() {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => readStoredTheme() || readSystemTheme());

  const changeTheme = useCallback((nextTheme) => {
    setTheme(nextTheme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Keep the selected theme for this visit if storage is unavailable.
    }
  }, []);

  const refreshTheme = useCallback(() => {
    const storedTheme = readStoredTheme();
    setTheme(storedTheme || readSystemTheme());
  }, []);

  useEffect(() => {
    function syncTheme(event) {
      if (event.key === THEME_STORAGE_KEY) refreshTheme();
    }

    window.addEventListener("storage", syncTheme);
    window.addEventListener("focus", refreshTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("focus", refreshTheme);
    };
  }, [refreshTheme]);

  useEffect(() => {
    const portalRoots = new Set();
    const applyPortalTheme = () => {
      document.querySelectorAll(".michael-ui").forEach((portalRoot) => {
        portalRoot.setAttribute("data-theme", theme);
        portalRoots.add(portalRoot);
      });
    };

    applyPortalTheme();
    const observer = new MutationObserver(applyPortalTheme);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      portalRoots.forEach((portalRoot) => portalRoot.removeAttribute("data-theme"));
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

