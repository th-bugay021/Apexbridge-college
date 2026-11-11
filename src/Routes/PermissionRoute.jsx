import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

function PermissionRoute({ permission, children, allowedRoles = [], fallback }) {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.includes(user.role)) return fallback ?? children;
  if (hasPermission(permission)) return children;

  return <Navigate to={user.role === "PARENT" ? "/dashboard" : "/403"} replace />;
}

export default PermissionRoute;
