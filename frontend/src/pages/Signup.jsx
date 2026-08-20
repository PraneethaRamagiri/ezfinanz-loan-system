import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLoan } from '../context/LoanContext';
import api from '../services/api';
import { User, Mail, Phone, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Real-time inline error states
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { loginSuccess } = useAuth();
  const { setApplication } = useLoan();
  const navigate = useNavigate();

  // Validate Full Name while typing
  const handleNameChange = (e) => {
    const val = e.target.value;
    setFullName(val); // Never clear user input!

    if (!val.trim()) {
      setNameError('');
      return;
    }

    const nameRegex = /^[a-zA-Z\s.-]+$/;
    if (!nameRegex.test(val.trim())) {
      setNameError('Name can contain only letters, spaces, hyphens, and periods.');
    } else if (val.trim().length < 2) {
      setNameError('Full name must be at least 2 characters long.');
    } else {
      setNameError('');
    }
  };

  // Validate Phone Number while typing
  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setPhone(val); // Never clear user input!

    if (!val) {
      setPhoneError('');
      return;
    }

    const cleanDigits = val.replace(/[^0-9]/g, '');
    if (val !== cleanDigits) {
      setPhoneError('Mobile number must contain digits only.');
    } else if (val.length > 0 && !/^[6-9]/.test(val)) {
      setPhoneError('Indian mobile numbers must start with 6, 7, 8, or 9.');
    } else if (val.length > 0 && val.length !== 10) {
      setPhoneError('Mobile number must be exactly 10 digits.');
    } else {
      setPhoneError('');
    }
  };

  const handleSignup = async (e) => {
    e?.preventDefault();
    setError('');

    // Re-verify name and phone before submit
    const nameCheck = /^[a-zA-Z\s.-]{2,50}$/.test(fullName.trim());
    if (!nameCheck) {
      const err = 'Name can contain only letters, spaces, hyphens, and periods.';
      setNameError(err);
      setError(err);
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const phoneCheck = /^[6-9]\d{9}$/.test(cleanPhone);
    if (!phoneCheck) {
      const err = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9 (e.g. 9876543210).';
      setPhoneError(err);
      setError(err);
      return;
    }

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/signup', {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: cleanPhone,
        password,
        role: 'customer'
      });

      if (res.success) {
        loginSuccess(res.data.token, res.data.user);
        if (res.data.application) {
          setApplication(res.data.application);
        }
        navigate('/verify-contact');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const isFormInvalid = !!nameError || !!phoneError || !fullName || !phone || !email || !password;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Official EZFinanz Primary Logo Wordmark */}
        <div className="flex justify-center mb-4">
          <img
            src="/assets/ezfinanz_logo.png"
            alt="EZFinanz"
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-xs"
          />
        </div>

        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Apply for EZFINANZ Loan
        </h2>
        <p className="mt-1.5 text-sm text-slate-600 font-medium">
          Create your digital applicant profile in under 2 minutes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <span className="shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSignup}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Legal Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={handleNameChange}
                  placeholder="Rajesh Kumar"
                  className={`block w-full pl-11 pr-3.5 py-3 border rounded-xl focus:ring-2 focus:border-transparent text-sm font-medium text-slate-900 placeholder-slate-400 transition-all ${
                    nameError ? 'border-red-400 focus:ring-red-400 bg-red-50/20' : 'border-slate-300 focus:ring-emerald-500'
                  }`}
                />
              </div>
              {nameError && (
                <p className="mt-1.5 text-xs font-bold text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{nameError}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rajesh@example.com"
                  className="block w-full pl-11 pr-3.5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-medium text-slate-900 placeholder-slate-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Mobile Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="9876543210"
                  className={`block w-full pl-11 pr-3.5 py-3 border rounded-xl focus:ring-2 focus:border-transparent text-sm font-medium text-slate-900 placeholder-slate-400 transition-all ${
                    phoneError ? 'border-red-400 focus:ring-red-400 bg-red-50/20' : 'border-slate-300 focus:ring-emerald-500'
                  }`}
                />
              </div>
              {phoneError && (
                <p className="mt-1.5 text-xs font-bold text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{phoneError}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-3.5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-medium text-slate-900 placeholder-slate-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isFormInvalid}
              className={`w-full py-3.5 font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-base mt-3 cursor-pointer ${
                isFormInvalid
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-600/20'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account & Start KYC</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-extrabold text-emerald-600 hover:text-emerald-700">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
