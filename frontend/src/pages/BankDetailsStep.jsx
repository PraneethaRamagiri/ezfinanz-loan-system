import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLoan } from '../context/LoanContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Stepper from '../components/Stepper';
import { validateBankAccountNumber, validateIFSC, validateBankAndIfsc, BANK_IFSC_MAP } from '../utils/validators';
import { Landmark, CheckCircle2, ArrowRight, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';

export default function BankDetailsStep() {
  const { user } = useAuth();
  const { application, refreshApplication } = useLoan();
  const navigate = useNavigate();

  const [accountHolderName, setAccountHolderName] = useState(application?.bankDetails?.accountHolderName || application?.kyc?.fullName || user?.fullName || '');
  const [accountNumber, setAccountNumber] = useState(application?.bankDetails?.accountNumber || '');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(application?.bankDetails?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(application?.bankDetails?.ifscCode || 'SBIN0000847');
  const [bankName, setBankName] = useState(application?.bankDetails?.bankName || 'State Bank of India');
  const [accountType, setAccountType] = useState(application?.bankDetails?.accountType || 'Savings');

  const [fieldErrors, setFieldErrors] = useState({});
  const [pennyDropSuccess, setPennyDropSuccess] = useState(application?.bankDetails?.isVerified || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fillDemoBank = () => {
    setAccountHolderName(application?.kyc?.fullName || 'Rajesh Kumar');
    setAccountNumber('918273645019');
    setConfirmAccountNumber('918273645019');
    setIfscCode('SBIN0000847');
    setBankName('State Bank of India');
    setAccountType('Savings');
    setPennyDropSuccess(true);
    setFieldErrors({});
    setError('');
  };

  const handleAccountNumberChange = (val) => {
    const cleanNum = val.replace(/[^0-9]/g, '');
    setAccountNumber(cleanNum);
    setPennyDropSuccess(false);
    const err = validateBankAccountNumber(cleanNum);
    setFieldErrors((prev) => ({
      ...prev,
      accountNumber: err,
      confirmAccountNumber: confirmAccountNumber && cleanNum !== confirmAccountNumber ? 'Account numbers do not match.' : null
    }));
  };

  const handleConfirmAccountNumberChange = (val) => {
    const cleanNum = val.replace(/[^0-9]/g, '');
    setConfirmAccountNumber(cleanNum);
    setPennyDropSuccess(false);
    let matchErr = null;
    if (accountNumber && cleanNum !== accountNumber) {
      matchErr = 'Account numbers do not match.';
    }
    setFieldErrors((prev) => ({ ...prev, confirmAccountNumber: matchErr }));
  };

  const handleIfscChange = (val) => {
    const code = val.toUpperCase().trim();
    setIfscCode(code);
    setPennyDropSuccess(false);

    // Auto-suggest bank name if recognized prefix
    const prefix = code.substring(0, 4);
    let suggestedBank = bankName;
    if (BANK_IFSC_MAP[prefix]) {
      suggestedBank = BANK_IFSC_MAP[prefix];
      setBankName(suggestedBank);
    }

    const ifscErr = validateIFSC(code);
    const bankIfscErr = validateBankAndIfsc(suggestedBank, code);

    setFieldErrors((prev) => ({
      ...prev,
      ifscCode: ifscErr,
      bankName: bankIfscErr
    }));
  };

  const handleBankNameChange = (val) => {
    setBankName(val);
    setPennyDropSuccess(false);
    const bankIfscErr = validateBankAndIfsc(val, ifscCode);
    setFieldErrors((prev) => ({
      ...prev,
      bankName: bankIfscErr
    }));
  };

  const handlePennyDropTest = () => {
    const accErr = validateBankAccountNumber(accountNumber);
    if (accErr) {
      setError(accErr);
      return;
    }
    if (!accountNumber || accountNumber !== confirmAccountNumber) {
      setError('Account numbers do not match.');
      return;
    }
    const bankIfscErr = validateBankAndIfsc(bankName, ifscCode);
    if (bankIfscErr) {
      setError(bankIfscErr);
      return;
    }
    setError('');
    setPennyDropSuccess(true);
  };

  const validateAllFields = () => {
    const errors = {};
    if (!accountHolderName.trim()) errors.accountHolderName = 'Account Holder Name is required.';
    const accErr = validateBankAccountNumber(accountNumber);
    if (accErr) errors.accountNumber = accErr;
    if (accountNumber !== confirmAccountNumber) errors.confirmAccountNumber = 'Account numbers do not match.';
    const ifscErr = validateIFSC(ifscCode);
    if (ifscErr) errors.ifscCode = ifscErr;
    const bankIfscErr = validateBankAndIfsc(bankName, ifscCode);
    if (bankIfscErr) errors.bankName = bankIfscErr;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateAllFields()) {
      setError('Please resolve all bank detail validation errors before proceeding.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/bank/add', {
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.replace(/\s+/g, ''),
        ifscCode: ifscCode.toUpperCase().trim(),
        bankName: bankName.trim(),
        accountType
      });

      if (res.success) {
        await refreshApplication();
        navigate('/declaration');
      }
    } catch (err) {
      if (err.details) {
        setFieldErrors(err.details);
      }
      setError(err.message || 'Failed to save bank details.');
    } finally {
      setLoading(false);
    }
  };

  const hasErrors = Object.values(fieldErrors).some((err) => Boolean(err));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <Stepper currentStep={6} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Step 6: Bank Account Details</h1>
            <p className="text-sm text-slate-600 mt-1">Provide target bank account for loan disbursement.</p>
          </div>

          <button
            type="button"
            onClick={fillDemoBank}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Auto-Fill Demo Bank</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center space-x-2">
              <Landmark className="w-5 h-5 text-emerald-600" />
              <span>Disbursement Bank Account</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Account Holder Name</label>
                <input
                  type="text"
                  required
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Bank Account Number</label>
                  <input
                    type="password"
                    required
                    maxLength={18}
                    value={accountNumber}
                    onChange={(e) => handleAccountNumberChange(e.target.value)}
                    placeholder="Enter 9 to 18 digit account number"
                    className={`w-full px-3 py-2 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.accountNumber ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                    }`}
                  />
                  {fieldErrors.accountNumber && (
                    <p className="text-xs text-red-600 font-semibold mt-1">❌ {fieldErrors.accountNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Confirm Account Number</label>
                  <input
                    type="text"
                    required
                    maxLength={18}
                    value={confirmAccountNumber}
                    onChange={(e) => handleConfirmAccountNumberChange(e.target.value)}
                    placeholder="Re-enter account number"
                    className={`w-full px-3 py-2 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.confirmAccountNumber ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                    }`}
                  />
                  {fieldErrors.confirmAccountNumber && (
                    <p className="text-xs text-red-600 font-semibold mt-1">❌ {fieldErrors.confirmAccountNumber}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">IFSC Code</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => handleIfscChange(e.target.value)}
                    placeholder="SBIN0000847"
                    className={`w-full px-3 py-2 border rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.ifscCode ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                    }`}
                  />
                  {fieldErrors.ifscCode && (
                    <p className="text-xs text-red-600 font-semibold mt-1">❌ {fieldErrors.ifscCode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Bank Name</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => handleBankNameChange(e.target.value)}
                    placeholder="State Bank of India"
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.bankName ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                    }`}
                  />
                  {fieldErrors.bankName && (
                    <p className="text-xs text-red-600 font-semibold mt-1">❌ {fieldErrors.bankName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Account Type</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Savings">Savings Account</option>
                    <option value="Current">Current Account</option>
                  </select>
                </div>
              </div>

              {/* Simulated Penny Drop Verification Widget */}
              <div className="pt-2">
                {pennyDropSuccess && !hasErrors ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-emerald-900 text-sm font-bold">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <p>Penny Drop Verification Successful!</p>
                      <p className="text-xs font-normal text-emerald-700">Account details and Bank Name matched with IFSC profile via ₹1 test deposit.</p>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePennyDropTest}
                    disabled={hasErrors}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all border flex items-center justify-center space-x-2 ${
                      hasErrors
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 cursor-pointer'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Run Penny Drop Test Deposit</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading || hasErrors}
              className={`py-3.5 px-8 rounded-xl font-extrabold shadow-md flex items-center space-x-2 text-base transition-all ${
                hasErrors
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Save Bank & Proceed to Declaration</span>
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
