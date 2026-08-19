import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoan } from '../context/LoanContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Stepper from '../components/Stepper';
import { Calculator, AlertCircle, CheckCircle2, XCircle, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';

export default function EligibilityStep() {
  const { application, refreshApplication } = useLoan();
  const navigate = useNavigate();

  const [monthlyIncome, setMonthlyIncome] = useState(application?.financials?.monthlyIncome || 75000);
  const [requestedAmount, setRequestedAmount] = useState(application?.financials?.requestedAmount || 300000);
  const [cibilScore, setCibilScore] = useState(application?.financials?.cibilScore || 760);
  const [existingDebts, setExistingDebts] = useState(application?.financials?.existingDebts || 12000);
  const [employerName, setEmployerName] = useState(application?.financials?.employerName || 'TechCorp Pvt Ltd');
  const [designation, setDesignation] = useState(application?.financials?.designation || 'Software Architect');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(application?.eligibility || null);

  const setScenario = (income, requested, cibil, debts) => {
    setMonthlyIncome(income);
    setRequestedAmount(requested);
    setCibilScore(cibil);
    setExistingDebts(debts);
  };

  const handleCheckEligibility = async (e) => {
    e?.preventDefault();
    if (!monthlyIncome || !requestedAmount || !cibilScore) {
      setError('Please fill in monthly income, requested loan amount, and CIBIL score.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/loan/check-eligibility', {
        monthlyIncome,
        requestedAmount,
        cibilScore,
        existingDebts,
        employerName,
        designation
      });

      if (res.success) {
        setResult(res.data.eligibility);
        await refreshApplication();
      }
    } catch (err) {
      setError(err.message || 'Eligibility check failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    navigate('/loan-customizer');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <Stepper currentStep={4} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Step 4: Loan Eligibility Check</h1>
            <p className="text-sm text-slate-600 mt-1">Enter your financial information to run the underwriting engine.</p>
          </div>

          {/* Quick Scenario Fill Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setScenario(85000, 300000, 780, 10000)}
              className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100"
            >
              Eligible (780 Score)
            </button>
            <button
              type="button"
              onClick={() => setScenario(45000, 250000, 680, 18000)}
              className="px-2.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100"
            >
              Partial (680 Score)
            </button>
            <button
              type="button"
              onClick={() => setScenario(20000, 300000, 590, 15000)}
              className="px-2.5 py-1.5 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100"
            >
              Ineligible (590 Score)
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <span>Financial Inputs</span>
            </h3>

            <form onSubmit={handleCheckEligibility} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Net Monthly Income (₹)</label>
                <input
                  type="number"
                  required
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Requested Loan Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">CIBIL / Credit Score (300 - 900)</label>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cibilScore >= 750 ? 'bg-emerald-100 text-emerald-800' : cibilScore >= 650 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                    Score: {cibilScore}
                  </span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="900"
                  value={cibilScore}
                  onChange={(e) => setCibilScore(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Existing Monthly Debts / EMIs (₹)</label>
                <input
                  type="number"
                  value={existingDebts}
                  onChange={(e) => setExistingDebts(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Employer Name</label>
                  <input
                    type="text"
                    required
                    value={employerName}
                    onChange={(e) => setEmployerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center space-x-2 mt-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Run Underwriting Engine</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Results Card (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {result ? (
              <div className={`bg-white rounded-2xl p-6 border shadow-md relative overflow-hidden ${
                result.status === 'ELIGIBLE' ? 'border-emerald-300' : result.status === 'PARTIALLY_ELIGIBLE' ? 'border-amber-300' : 'border-red-300'
              }`}>
                {/* Result Status Banner */}
                <div className={`p-4 rounded-xl mb-4 flex items-center space-x-3 ${
                  result.status === 'ELIGIBLE' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : result.status === 'PARTIALLY_ELIGIBLE' ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-red-50 text-red-900 border border-red-200'
                }`}>
                  {result.status === 'ELIGIBLE' ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                  ) : result.status === 'PARTIALLY_ELIGIBLE' ? (
                    <AlertCircle className="w-8 h-8 text-amber-600 shrink-0" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-extrabold text-base leading-tight">
                      {result.status === 'ELIGIBLE' ? 'Fully Approved!' : result.status === 'PARTIALLY_ELIGIBLE' ? 'Partially Approved' : 'Not Approved'}
                    </h4>
                    <p className="text-xs mt-0.5 font-medium opacity-90">{result.riskRating} Risk Tier</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Debt-to-Income (DTI):</span>
                    <strong className="font-bold text-slate-900">{result.dtiRatio}%</strong>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Max Approved Credit Limit:</span>
                    <strong className="font-extrabold text-emerald-700 text-base">₹{result.maxApprovedAmount?.toLocaleString('en-IN')}</strong>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Applicable Interest Rate:</span>
                    <strong className="font-bold text-slate-900">{result.applicableInterestRate}% p.a.</strong>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 italic">
                    {result.reason}
                  </div>
                </div>

                {result.status !== 'NOT_ELIGIBLE' && (
                  <button
                    onClick={handleProceed}
                    className="w-full mt-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md flex items-center justify-center space-x-2 text-base transition-all"
                  >
                    <span>Proceed to EMI Customizer</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-slate-100 rounded-2xl p-8 text-center border border-dashed border-slate-300">
                <Calculator className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h4 className="font-bold text-slate-700">Awaiting Calculations</h4>
                <p className="text-xs text-slate-500 mt-1">Fill in the inputs and click "Run Underwriting Engine" to see eligibility results.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
