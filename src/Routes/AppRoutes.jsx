import { BrowserRouter, Routes, Route } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import PermissionRoute from "./PermissionRoute";

import AppLayout from "../Components/Ayomide/AppLayout";

import Login from "../Pages/Ayomide/Auth/Login";
import Register from "../Pages/Ayomide/Auth/Register";
import ForgotPassword from "../Pages/Ayomide/Auth/ForgotPassword";

import Settings from "../Pages/Ayomide/Settings/Settings";
import Profile from "../Pages/Ayomide/Settings/Profile";

import HomePage from "../Pages/Michael/Homepage/HomePage";
import NotFound from "../Errors/NotFound";
import Unauthorized from "../Errors/Unauthorized";
import TeacherList from "../Pages/Michael/Teachers/TeacherList";
import TeacherProfile from "../Pages/Michael/Teachers/TeacherProfile";
import MyTeacherProfile from "../Pages/Michael/Teachers/MyProfile";
import PerformanceList from "../Pages/Michael/Teachers/PerformanceList";
import PerformanceDetail from "../Pages/Michael/Teachers/PerformanceDetail";
import DashboardLanding from "../Pages/Kingston/Dashboard/DashboardLanding";
import Subjects from "../Pages/Michael/Academics/Subjects";
import Classes from "../Pages/Michael/Academics/Classes";
import ClassDetails from "../Pages/Michael/Academics/ClassDetails";
import Attendance from "../Pages/Michael/Attendance/Attendance";
import MyTimetable from "../Pages/Michael/Timetable/MyTimetable";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Application routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route
              element={<RoleRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "TEACHER"]} />}
            >
              <Route path="/dashboard" element={<DashboardLanding />} />
            </Route>

            <Route
              path="/students"
              element={
                <PermissionRoute permission="students.view">
                  {/* <Students />- */}
                </PermissionRoute>
              }
            />

            <Route element={<RoleRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]} />}>
              <Route path="/teachers/performance" element={<PerformanceList />} />
              <Route path="/teachers/:id/performance" element={<PerformanceDetail />} />
              <Route path="/teachers" element={<TeacherList />} />
              <Route path="/teachers/:id" element={<TeacherProfile />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={["TEACHER"]} />}>
              <Route path="/teachers/me/performance" element={<PerformanceDetail />} />
              <Route path="/teachers/me" element={<MyTeacherProfile />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]} />}>
              <Route path="/subjects" element={<Subjects />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"]} />}>
              <Route path="/classes" element={<Classes />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "TEACHER"]} />}>
              <Route path="/classes/:id" element={<ClassDetails />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"]} />}>
              <Route path="/attendance" element={<Attendance />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={["TEACHER", "STUDENT"]} />}>
              <Route path="/timetable" element={<MyTimetable />} />
            </Route>

            <Route path="/examinations" element={<h1>Examinations</h1>} />

            <Route path="/results" element={<h1>Results</h1>} />

            <Route path="/fees" element={<h1>Fees</h1>} />

            <Route path="/payments" element={<h1>Payments</h1>} />

            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="/403" element={<Unauthorized />} />
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
