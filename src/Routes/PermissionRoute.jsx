import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

function PermissionRoute({ permission, children }) {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

export default PermissionRoute;