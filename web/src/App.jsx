import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { MyProfile } from './pages/MyProfile';
import { DepartmentQueue } from './pages/DepartmentQueue';
import { StaffComplaints } from './pages/StaffComplaints';
import { ResolveComplaint } from './pages/ResolveComplaint';
import { AdminLayout } from './admin/AdminLayout';
import { AdminHome } from './pages/admin/AdminHome';
import { AdminProblems } from './pages/admin/AdminProblems';
import { AdminProblemDetail } from './pages/admin/AdminProblemDetail';
import { AdminComplaints } from './pages/admin/AdminComplaints';
import { AdminComplaintDetail } from './pages/admin/AdminComplaintDetail';
import { AdminStudents } from './pages/admin/AdminStudents';
import { AdminStudentDetail } from './pages/admin/AdminStudentDetail';
import { AdminStaff } from './pages/admin/AdminStaff';
import { AdminProfile } from './pages/admin/AdminProfile';
import { DepartmentLayout } from './components/DepartmentLayout';
import { AdminSuggestionsList } from './pages/AdminSuggestionsList';
import { AdminSuggestionDetail } from './pages/AdminSuggestionDetail';
import { ViewStudents } from './pages/ViewStudents';
import { UserComplaintDetail } from './pages/UserComplaintDetail';
import { Inbox } from './pages/Inbox';
import { Notifications } from './pages/Notifications';
import './styles.css';

function DashboardEntry() {
  const { session } = useAuth();
  return <Navigate to={session?.role === 'admin' ? '/admin' : session?.role === 'staff' ? '/department' : '/myProfile'} replace />;
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
            <Route path="students/:id" element={<AdminStudentDetail />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
          <Route
            path="/myProfile"
            element={
              <ProtectedRoute>
                <MyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department"
            element={
              <ProtectedRoute role="staff">
                <DepartmentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DepartmentQueue />} />
            <Route path="complaints" element={<StaffComplaints />} />
            <Route path="problems/:id/resolve" element={<ResolveComplaint />} />
            <Route path="problems/:id/students" element={<ViewStudents />} />
            <Route path="suggestions" element={<AdminSuggestionsList />} />
            <Route path="suggestions/:id" element={<AdminSuggestionDetail />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
          <Route
            path="/myProfile"
            element={<ProtectedRoute><MyProfile /></ProtectedRoute>}
          />
          <Route
            path="/user/complaints/:id"
            element={<ProtectedRoute><UserComplaintDetail /></ProtectedRoute>}
          />
          <Route
            path="/user/inbox"
            element={<ProtectedRoute><Inbox /></ProtectedRoute>}
          />
          <Route
            path="/user/notifications"
            element={<ProtectedRoute><Notifications /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
}
