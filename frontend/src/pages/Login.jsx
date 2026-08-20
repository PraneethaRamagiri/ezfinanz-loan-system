import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLoan } from '../context/LoanContext';
import api from '../services/api';
import { Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAdminInfo, setShowAdminInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { loginSuccess } = useAuth();
  const { setApplication, refreshApplication } = useLoan();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email/phone number and password.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.success) {
        loginSuccess(res.data.token, res.data.user);
        if (res.data.application) {
          setApplication(res.data.application);
        }
        if (res.data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/status');
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMock = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/google-login-mock', {
        email: 'google.demo@ezfinanz.com',
        fullName: 'Google Social Demo',
        createFresh: true
      });
      if (res.success) {
        loginSuccess(res.data.token, res.data.user);
        if (res.data.application) {
          setApplication(res.data.application);
        }
        navigate('/verify-contact');
      }
    } catch (err) {
      setError(err.message || 'Google mock login failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Customer@123456');
    setError('');
  };

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
          Sign in to your account
        </h2>
        <p className="mt-1.5 text-sm text-slate-600 font-medium">
          Digital Personal Loan Portal
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

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email or Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com or 9876543210"
                  className="block w-full pl-11 pr-3.5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-medium text-slate-900 placeholder-slate-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
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
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-base cursor-pointer hover:shadow-emerald-600/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Social Google Login Mock */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2.5 text-slate-400 font-bold tracking-wider">Or Sign In With</span></div>
            </div>

            <button
              onClick={handleGoogleMock}
              type="button"
              className="mt-4 w-full py-3 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center space-x-2 text-sm transition-all shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Simulated Google OAuth</span>
            </button>
          </div>

          {/* Demo Accounts & Admin Credentials Quick-Fill Widget */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Auto-Fill Demo Accounts</p>
              <button
                type="button"
                onClick={() => setShowAdminInfo(!showAdminInfo)}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
              >
                🔑 Click here for Admin Credentials
              </button>
            </div>

            {showAdminInfo && (
              <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-950 space-y-1">
                <div className="font-extrabold flex items-center justify-between">
                  <span>🛡️ System Admin Access:</span>
                  <span className="bg-purple-200 text-purple-900 text-[10px] px-2 py-0.5 rounded-md uppercase font-black">Role: Admin</span>
                </div>
                <p><span className="text-purple-700 font-semibold">Email:</span> <code className="bg-purple-100 px-1.5 py-0.5 rounded font-mono font-bold">admin@ezfinanz.com</code></p>
                <p><span className="text-purple-700 font-semibold">Password:</span> <code className="bg-purple-100 px-1.5 py-0.5 rounded font-mono font-bold">Admin@123456</code></p>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@ezfinanz.com');
                    setPassword('Admin@123456');
                    setError('');
                  }}
                  className="mt-1.5 w-full py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-center transition-colors cursor-pointer"
                >
                  Auto-Fill Admin Credentials & Prepare Login
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemoAccount('eligible@example.com')}
                className="p-2 bg-emerald-50 text-emerald-900 rounded-xl font-bold hover:bg-emerald-100 text-center border border-emerald-200 transition-colors cursor-pointer"
              >
                👤 Eligible
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('disbursed@example.com')}
                className="p-2 bg-indigo-50 text-indigo-900 rounded-xl font-bold hover:bg-indigo-100 text-center border border-indigo-200 transition-colors cursor-pointer"
              >
                💳 Disbursed
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('9812345678')}
                className="p-2 bg-amber-50 text-amber-900 rounded-xl font-bold hover:bg-amber-100 text-center border border-amber-200 transition-colors cursor-pointer"
              >
                📱 Mobile
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs">
            <span className="text-slate-600 font-medium">Don't have an account? </span>
            <Link to="/signup" className="font-extrabold text-emerald-600 hover:text-emerald-700">
              Register now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
