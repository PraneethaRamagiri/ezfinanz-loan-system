import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const fetchedUserIdRef = useRef(null);

  const fetchApplicationStatus = useCallback(async (force = false) => {
    if (!token || !user || user.role === 'admin') {
      setLoading(false);
      return;
    }

    const currentUserId = user.id || user._id;
    if (!force && fetchedUserIdRef.current === currentUserId && application) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      fetchedUserIdRef.current = currentUserId;
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
  }, [token, user, application]);

  useEffect(() => {
    if (authLoading) return;

    if (!token || !user) {
      setApplication(null);
      fetchedUserIdRef.current = null;
      setLoading(false);
      return;
    }

    if (user.role === 'customer') {
      const currentUserId = user.id || user._id;
      if (fetchedUserIdRef.current !== currentUserId || !application) {
        fetchApplicationStatus();
      }
    } else {
      setLoading(false);
    }
  }, [token, user, authLoading, fetchApplicationStatus, application]);

  return (
    <LoanContext.Provider value={{
      application,
      setApplication: (app) => {
        if (user) fetchedUserIdRef.current = user.id || user._id;
        setApplication(app);
      },
      loading,
      error,
      refreshApplication: () => fetchApplicationStatus(true)
    }}>
      {children}
    </LoanContext.Provider>
  );
};

export const useLoan = () => useContext(LoanContext);

