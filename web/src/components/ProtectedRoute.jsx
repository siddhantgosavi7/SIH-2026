import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, role }) {
  const { token, session } = useAuth();
  if (!token) {
    return <Navigate to="/" replace />;
  }
  if (role && session?.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
