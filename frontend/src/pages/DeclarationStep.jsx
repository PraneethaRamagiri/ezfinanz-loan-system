import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLoan } from '../context/LoanContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Stepper from '../components/Stepper';
import { FileText, ShieldCheck, ArrowRight, CheckSquare, Square } from 'lucide-react';

export default function DeclarationStep() {
  const { user } = useAuth();
  const { application, refreshApplication } = useLoan();
  const navigate = useNavigate();

  const [accepted, setAccepted] = useState(application?.declaration?.accepted || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAcceptDeclaration = async (e) => {
    e.preventDefault();
    if (!accepted) {
      setError('You must accept the terms and legal declaration to proceed.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/application/declaration/accept', { accepted: true });
      if (res.success) {
        await refreshApplication();
        navigate('/selfie-upload');
      }
    } catch (err) {
      setError(err.message || 'Failed to accept declaration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <Stepper currentStep={7} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Step 7: Legal Declaration & Consent</h1>
          <p className="text-sm text-slate-600 mt-1">Review loan agreement terms and grant authorization.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleAcceptDeclaration} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>EZFinanz Borrower Undertaking</span>
            </h3>

            {/* Scrollable Terms Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 h-64 overflow-y-auto text-xs text-slate-700 space-y-3 leading-relaxed">
              <p className="font-bold text-slate-900">1. Truthfulness of Information</p>
              <p>I hereby confirm that all details furnished in this application including personal identity, age, current residential address, employment history, net monthly income, and existing liabilities are true, correct, and accurate to the best of my knowledge.</p>

              <p className="font-bold text-slate-900">2. Credit Bureau Authorization</p>
              <p>I explicitly authorize EZFinanz and its underwriting partners to pull, verify, and monitor my credit score, repayment history, and CIBIL report from accredited credit information companies (CIC) for underwriting and risk management purposes.</p>

              <p className="font-bold text-slate-900">3. Repayment & Auto-Debit Consent</p>
              <p>I agree to honor the calculated monthly EMI schedule on the specified due date each month. I grant consent for setting up NACH / e-Mandate auto-debit collection on the bank account provided in Step 6.</p>

              <p className="font-bold text-slate-900">4. Processing Fees & Deduction Undertaking</p>
              <p>I understand and agree that processing fees (2%), applicable GST (18%), and documentation charges (₹500) will be deducted upfront from the sanctioned loan principal prior to net disbursement.</p>
            </div>

            {/* Digital Signature Box */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block">Digital Consent Signed By:</span>
                <strong className="text-slate-900 font-bold text-sm">{application?.kyc?.fullName || user?.fullName}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Timestamp & IP:</span>
                <span className="font-mono text-slate-700">{new Date().toLocaleDateString()} (IP: 127.0.0.1)</span>
              </div>
            </div>

            {/* Mandatory Checkbox */}
            <label className="flex items-start space-x-3 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-slate-800 leading-snug">
                I have read, understood, and accept all the terms of the loan agreement, fee structure, credit check authorization, and auto-debit consent.
              </span>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !accepted}
              className={`py-3.5 px-8 rounded-xl font-extrabold shadow-md flex items-center space-x-2 text-base transition-all ${
                accepted
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Confirm & Proceed to Live Selfie</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
