import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { loginRequest, logoutRequest, refreshRequest, registerRequest } from "../api/auth";
import { registerAuthBridge } from "../api/axios";
import permissions from "../utils/permissions";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const accessTokenRef = useRef(null);

  const updateAccessToken = useCallback((token) => {
    accessTokenRef.current = token;
    setAccessToken(token);
  }, []);

  const acceptSession = useCallback((result) => {
    setUser({ ...result.user, name: result.user.name || result.user.fullName });
    updateAccessToken(result.accessToken);
  }, [updateAccessToken]);

  const handleAuthFailure = useCallback(() => {
    setUser(null);
    updateAccessToken(null);
  }, [updateAccessToken]);

  useEffect(() => {
    registerAuthBridge({
      getAccessToken: () => accessTokenRef.current,
      setAccessToken: updateAccessToken,
      onAuthFailure: handleAuthFailure,
    });
  }, [handleAuthFailure, updateAccessToken]);

  useEffect(() => {
    let isActive = true;
    refreshRequest()
      .then((result) => {
        if (isActive) acceptSession(result);
      })
      .catch(() => {
        if (isActive) {
          setUser(null);
          updateAccessToken(null);
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [acceptSession, updateAccessToken]);

  const hasPermission = (permission) => {
    if (!user) return false;

    const userPermissions = permissions[user.role] || [];

    if (userPermissions.includes("*")) {
      return true;
    }

    return userPermissions.includes(permission);
  };

  const login = async (credentials) => acceptSession(await loginRequest(credentials));
  const register = async (details) => acceptSession(await registerRequest(details));

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      updateAccessToken(null);
    }
  };

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
