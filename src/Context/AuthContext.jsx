// eslint-disable-next-line no-unused-vars
import React, { createContext, useContext, useState } from "react";
import permissions from "../utils/permissions";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const hasPermission = (permission) => {
    if (!user) return false;

    const userPermissions = permissions[user.role] || [];

    if (userPermissions.includes("*")) {
      return true;
    }

    return userPermissions.includes(permission);
  };

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        login,
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
