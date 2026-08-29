import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { MyProfile } from './pages/MyProfile';
import { AdminLayout } from './admin/AdminLayout';
import { AdminHome } from './pages/admin/AdminHome';
import { AdminProblems } from './pages/admin/AdminProblems';
import { AdminProblemDetail } from './pages/admin/AdminProblemDetail';
import { AdminComplaints } from './pages/admin/AdminComplaints';
import { AdminComplaintDetail } from './pages/admin/AdminComplaintDetail';
import { AdminStudents } from './pages/admin/AdminStudents';
import { AdminStaff } from './pages/admin/AdminStaff';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminProfile } from './pages/admin/AdminProfile';
import './styles.css';

function DashboardEntry() {
  const { session } = useAuth();
  return <Navigate to={session?.role === 'admin' ? '/admin' : '/myProfile'} replace />;
}

function ToastContainer() {
  const { message, setMessage } = useAuth();
  if (!message) return null;

  return (
    <div className="toast-popup" key={message}>
      <span>{message}</span>
      <button className="toast-close" onClick={() => setMessage('')}>✕</button>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardEntry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminHome />} />
            <Route path="problems" element={<AdminProblems />} />
            <Route path="problems/:id" element={<AdminProblemDetail />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="complaints/:id" element={<AdminComplaintDetail />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
          <Route
            path="/myProfile"
            element={
              <ProtectedRoute>
                <MyProfile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
}
