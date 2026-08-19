import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLoan } from '../context/LoanContext';
import api from '../services/api';
import Stepper from '../components/Stepper';
import Navbar from '../components/Navbar';
import { Mail, Phone, CheckCircle2, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function VerifyContact() {
  const { user, setUser } = useAuth();
  const { application, refreshApplication } = useLoan();
  const navigate = useNavigate();

  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [phoneSent, setPhoneSent] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const isEmailDone = user?.isEmailVerified;
  const isPhoneDone = user?.isPhoneVerified;

  const handleSendEmailOtp = async () => {
    setLoadingEmail(true);
    setError(null);
    try {
      const res = await api.post('/auth/send-email-otp');
      if (res.success) {
        setEmailSent(true);
        setMessage('Simulated OTP sent to email! Check hint code below.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setLoadingEmail(true);
    setError(null);
    try {
      const res = await api.post('/auth/verify-email-otp', { otp: emailOtp || '123456' });
      if (res.success) {
        setUser({ ...user, isEmailVerified: true });
        await refreshApplication();
        setMessage('Email verified successfully!');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    setLoadingPhone(true);
    setError(null);
    try {
      const res = await api.post('/auth/send-phone-otp');
      if (res.success) {
        setPhoneSent(true);
        setMessage('Simulated SMS OTP sent to mobile! Check hint code below.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPhone(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    setLoadingPhone(true);
    setError(null);
    try {
      const res = await api.post('/auth/verify-phone-otp', { otp: phoneOtp || '654321' });
      if (res.success) {
        setUser({ ...user, isPhoneVerified: true });
        await refreshApplication();
        setMessage('Phone number verified successfully!');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPhone(false);
    }
  };

  const handleProceedToKyc = () => {
    navigate('/kyc');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <Stepper currentStep={2} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">Verify Contact Information</h1>
          <p className="text-sm text-slate-600 mt-1">
            Complete both email and phone number verification before proceeding to KYC.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Email Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${isEmailDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Email Verification</h3>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>

              {isEmailDone ? (
                <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>VERIFIED</span>
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
                  Verification Required
                </span>
              )}
            </div>

            {!isEmailDone && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-emerald-500"
                  />
                  {!emailSent ? (
                    <button
                      onClick={handleSendEmailOtp}
                      disabled={loadingEmail}
                      className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl text-sm hover:bg-slate-800"
                    >
                      Send OTP
                    </button>
                  ) : (
                    <button
                      onClick={handleVerifyEmailOtp}
                      disabled={loadingEmail}
                      className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 shadow-sm"
                    >
                      Verify OTP
                    </button>
                  )}
                </div>

                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Demo Mode OTP Hint: <strong>123456</strong></span>
                  </span>
                  <button
                    onClick={() => { setEmailOtp('123456'); setEmailSent(true); }}
                    className="text-emerald-700 underline font-bold hover:text-emerald-800"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Phone Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${isPhoneDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Phone OTP Verification</h3>
                  <p className="text-xs text-slate-500">{user?.phone}</p>
                </div>
              </div>

              {isPhoneDone ? (
                <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>VERIFIED</span>
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
                  Verification Required
                </span>
              )}
            </div>

            {!isPhoneDone && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    placeholder="Enter 6-digit SMS OTP"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-emerald-500"
                  />
                  {!phoneSent ? (
                    <button
                      onClick={handleSendPhoneOtp}
                      disabled={loadingPhone}
                      className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl text-sm hover:bg-slate-800"
                    >
                      Send SMS OTP
                    </button>
                  ) : (
                    <button
                      onClick={handleVerifyPhoneOtp}
                      disabled={loadingPhone}
                      className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 shadow-sm"
                    >
                      Verify SMS OTP
                    </button>
                  )}
                </div>

                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Demo Mode SMS OTP Hint: <strong>654321</strong></span>
                  </span>
                  <button
                    onClick={() => { setPhoneOtp('654321'); setPhoneSent(true); }}
                    className="text-emerald-700 underline font-bold hover:text-emerald-800"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Continue Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleProceedToKyc}
            disabled={!isEmailDone || !isPhoneDone}
            className={`py-3.5 px-8 rounded-xl font-extrabold shadow-md flex items-center space-x-2 text-base transition-all ${
              isEmailDone && isPhoneDone
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Proceed to Step 3: KYC Details</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
}
