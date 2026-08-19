import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const LoanContext = createContext();

export const STAGES = [
  'DRAFT',
  'EMAIL_VERIFIED',
  'PHONE_VERIFIED',
  'KYC_SUBMITTED',
  'ELIGIBILITY_CALCULATED',
  'LOAN_TERMS_SELECTED',
  'BANK_DETAILS_ADDED',
  'DECLARATION_ACCEPTED',
  'UNDER_ADMIN_REVIEW',
  'SELFIE_APPROVED',
  'SELFIE_REJECTED',
  'DISBURSED',
  'REJECTED'
];

export const LoanProvider = ({ children }) => {
  const { user, token, loading: authLoading } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchApplicationStatus = useCallback(async () => {
    if (!token || !user || user.role === 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/application/status');
      if (res.success) {
        setApplication(res.data.application);
      }
    } catch (err) {
      console.warn('Loan status fetch:', err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    // Wait until AuthContext finishes checking authentication
    if (authLoading) return;

    if (!token || !user) {
      setApplication(null);
      setLoading(false);
      return;
    }

    if (user.role === 'customer') {
      fetchApplicationStatus();
    } else {
      setLoading(false);
    }
  }, [token, user, authLoading, fetchApplicationStatus]);

  return (
    <LoanContext.Provider value={{
      application,
      setApplication,
      loading,
      error,
      refreshApplication: fetchApplicationStatus
    }}>
      {children}
    </LoanContext.Provider>
  );
};

export const useLoan = () => useContext(LoanContext);
