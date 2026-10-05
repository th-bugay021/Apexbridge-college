// import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "../Components/Ayomide/AppLayout";
import ProtectedRoute from "./ProtectedRoute";

import Login from "../Pages/Ayomide/Auth/Login";
import Register from "../Pages/Ayomide/Auth/Register";
import ForgotPassword from "../Pages/Ayomide/Auth/ForgotPassword";

import Settings from "../Pages/Ayomide/Settings/Settings";
import Profile from "../Pages/Ayomide/Settings/Profile";

import NotFound from "../Errors/NotFound";
import Unauthorized from "../Errors/Unauthorized";

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
            <Route path="/dashboard" element={<h1>Dashboard</h1>} />

            <Route path="/students" element={<h1>Students</h1>} />

            <Route path="/teachers" element={<h1>Teachers</h1>} />

            <Route path="/classes" element={<h1>Classes</h1>} />

            <Route path="/subjects" element={<h1>Subjects</h1>} />

            <Route path="/attendance" element={<h1>Attendance</h1>} />

            <Route path="/examinations" element={<h1>Examinations</h1>} />

            <Route path="/results" element={<h1>Results</h1>} />

            <Route path="/fees" element={<h1>Fees</h1>} />

            <Route path="/payments" element={<h1>Payments</h1>} />

            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="/403" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
