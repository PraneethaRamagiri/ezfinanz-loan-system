import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoanProvider } from './context/LoanContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyContact from './pages/VerifyContact';
import KycStep from './pages/KycStep';
import EligibilityStep from './pages/EligibilityStep';
import EmiCustomizerStep from './pages/EmiCustomizerStep';
import BankDetailsStep from './pages/BankDetailsStep';
import DeclarationStep from './pages/DeclarationStep';
import SelfieStep from './pages/SelfieStep';
import ApplicationStatus from './pages/ApplicationStatus';
import Disbursement from './pages/Disbursement';

import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <LoanProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Customer Routes */}
            <Route path="/verify-contact" element={<ProtectedRoute><VerifyContact /></ProtectedRoute>} />
            <Route path="/kyc" element={<ProtectedRoute><KycStep /></ProtectedRoute>} />
            <Route path="/eligibility" element={<ProtectedRoute><EligibilityStep /></ProtectedRoute>} />
            <Route path="/loan-customizer" element={<ProtectedRoute><EmiCustomizerStep /></ProtectedRoute>} />
            <Route path="/bank-details" element={<ProtectedRoute><BankDetailsStep /></ProtectedRoute>} />
            <Route path="/declaration" element={<ProtectedRoute><DeclarationStep /></ProtectedRoute>} />
            <Route path="/selfie-upload" element={<ProtectedRoute><SelfieStep /></ProtectedRoute>} />
            <Route path="/status" element={<ProtectedRoute><ApplicationStatus /></ProtectedRoute>} />
            <Route path="/disbursement" element={<ProtectedRoute><Disbursement /></ProtectedRoute>} />

            {/* Protected Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />

            {/* Default Catch-All */}
            <Route path="*" element={<Navigate to="/status" replace />} />
          </Routes>
        </LoanProvider>
      </AuthProvider>
    </Router>
  );
}
