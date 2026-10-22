import { useAuth } from "../../../Context/AuthContext";
import TeacherDashboard from "./TeacherDashboard";

export default function DashboardLanding() {
  const { user } = useAuth();
  return user?.role === "TEACHER" ? <TeacherDashboard /> : <h1>Dashboard</h1>;
}
