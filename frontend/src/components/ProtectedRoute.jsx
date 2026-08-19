import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLoan } from '../context/LoanContext';

export default function ProtectedRoute({ children, adminOnly = false, requiredStage = null }) {
  const { user, token, loading: authLoading } = useAuth();
  const { application, loading: loanLoading } = useLoan();
  const location = useLocation();

  if (authLoading || loanLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading EZFinanz Portal...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/status" replace />;
  }

  if (!adminOnly && user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
