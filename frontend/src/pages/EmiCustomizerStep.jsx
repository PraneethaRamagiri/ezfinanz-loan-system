import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoan } from '../context/LoanContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Stepper from '../components/Stepper';
import LoanSummaryCard from '../components/LoanSummaryCard';
import { Sliders, ArrowRight, ShieldCheck } from 'lucide-react';

export default function EmiCustomizerStep() {
  const { application, refreshApplication } = useLoan();
  const navigate = useNavigate();

  const maxApproved = application?.eligibility?.maxApprovedAmount || 500000;
  const applicableRate = application?.eligibility?.applicableInterestRate || 14.5;

  const [amount, setAmount] = useState(application?.selectedTerms?.amount || Math.min(250000, maxApproved));
  const [tenureMonths, setTenureMonths] = useState(application?.selectedTerms?.tenureMonths || 24);
  const [terms, setTerms] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch calculated terms when amount or tenure changes
  useEffect(() => {
    const fetchCalculatedTerms = async () => {
      try {
        const res = await api.post('/loan/calculate-terms', {
          amount,
          tenureMonths,
          interestRate: applicableRate
        });
        if (res.success) {
          setTerms(res.data);
        }
      } catch (err) {
        console.error('Terms calculation error:', err);
      }
    };
    fetchCalculatedTerms();
  }, [amount, tenureMonths, applicableRate]);

  const handleLockTerms = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/loan/select-terms', {
        amount,
        tenureMonths
      });

      if (res.success) {
        await refreshApplication();
        navigate('/bank-details');
      }
    } catch (err) {
      setError(err.message || 'Failed to lock loan terms.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <Stepper currentStep={5} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Step 5: EMI & Loan Term Customization</h1>
          <p className="text-sm text-slate-600 mt-1">Adjust your required loan amount and repayment tenure to see instant calculations.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl flex items-center space-x-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sliders & Selectors (6 cols on desktop) */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-6">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              <span>Customize Loan Parameters</span>
            </h3>

            {/* Loan Amount Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Required Loan Amount</label>
                <span className="text-2xl font-black text-emerald-600">₹{Number(amount).toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="10000"
                max={maxApproved}
                step="5000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-xs text-slate-400 font-bold mt-1.5">
                <span>Min: ₹10,000</span>
                <span>Max Approved: ₹{Number(maxApproved).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Tenure Pill Buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Select Repayment Tenure (Months)</label>
              <div className="grid grid-cols-5 gap-2">
                {[6, 12, 18, 24, 36].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTenureMonths(m)}
                    className={`py-3.5 rounded-xl text-sm font-extrabold transition-all border cursor-pointer ${
                      tenureMonths === m
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m} M
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-600">
              <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Underwriting Conditions</span>
              </div>
              <p>Annual Interest Rate locked at <strong className="text-slate-900">{applicableRate}% p.a.</strong> based on your credit score tier.</p>
              <p>Processing fee (2% + 18% GST) & flat documentation charges (₹500) will be deducted upfront from loan principal.</p>
            </div>

            <button
              onClick={handleLockTerms}
              disabled={loading || !terms}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg flex items-center justify-center space-x-2 text-base transition-all mt-4 cursor-pointer hover:shadow-emerald-600/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Lock Loan Terms & Add Bank Account</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Right Live Loan Calculation Card (6 cols on desktop) */}
          <div className="lg:col-span-6">
            <LoanSummaryCard terms={terms} title="Live Financial Breakdown" />
          </div>
        </div>
      </main>
    </div>
  );
}
