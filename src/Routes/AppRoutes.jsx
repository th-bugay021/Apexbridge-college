import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

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
import { StudentSampleProvider } from "../Pages/Christabel/StudentSampleContext";

const Examination = lazy(() => import("../Pages/Great/Examinations/Examination"));
const CreateExamination = lazy(() => import("../Pages/Great/Examinations/CreateExamination"));
const ResultsList = lazy(() => import("../Pages/Great/Results/ResultsList"));
const ClassResults = lazy(() => import("../Pages/Great/Results/ClassResults"));
const FeeStructures = lazy(() => import("../Pages/Great/Finance/FeeStructures"));
const StudentInvoices = lazy(() => import("../Pages/Great/Finance/StudentInvoices"));
const StudentList = lazy(() => import("../Pages/Christabel/Students/StudentList"));
const StudentProfile = lazy(() => import("../Pages/Christabel/Students/StudentProfile"));
const StudentClasses = lazy(() => import("../Pages/Christabel/Students/StudentClasses"));
const StudentClassDetail = lazy(() => import("../Pages/Christabel/Students/StudentClassDetail"));
const ParentList = lazy(() => import("../Pages/Christabel/Parents/ParentList"));

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

            <Route element={<StudentSampleProvider />}>
              <Route path="/students" element={<PermissionRoute permission="students.view"><Suspense fallback={<div role="status">Loading students…</div>}><StudentList /></Suspense></PermissionRoute>} />
              <Route path="/students/classes" element={<PermissionRoute permission="students.view"><Suspense fallback={<div role="status">Loading classes…</div>}><StudentClasses /></Suspense></PermissionRoute>} />
              <Route path="/students/classes/:classId" element={<PermissionRoute permission="students.view"><Suspense fallback={<div role="status">Loading class students…</div>}><StudentClassDetail /></Suspense></PermissionRoute>} />
              <Route path="/students/:id" element={<PermissionRoute permission="students.view"><Suspense fallback={<div role="status">Loading student profile…</div>}><StudentProfile /></Suspense></PermissionRoute>} />
              <Route path="/parents" element={<PermissionRoute permission="parents.view"><Suspense fallback={<div role="status">Loading parents…</div>}><ParentList /></Suspense></PermissionRoute>} />
            </Route>

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

            <Route element={<RoleRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "TEACHER"]} />}>
              <Route path="/examinations" element={<Suspense fallback={<div role="status">Loading examinations…</div>}><Examination /></Suspense>} />
              <Route path="/examinations/new" element={<Suspense fallback={<div role="status">Loading examination form…</div>}><CreateExamination /></Suspense>} />
              <Route path="/results" element={<Suspense fallback={<div role="status">Loading results…</div>}><ResultsList /></Suspense>} />
              <Route path="/results/class" element={<Suspense fallback={<div role="status">Loading class results…</div>}><ClassResults /></Suspense>} />
            </Route>
            <Route element={<RoleRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]} />}>
              <Route path="/fees" element={<Suspense fallback={<div role="status">Loading fee structures…</div>}><FeeStructures /></Suspense>} />
              <Route path="/payments" element={<Suspense fallback={<div role="status">Loading student invoices…</div>}><StudentInvoices /></Suspense>} />
            </Route>

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
