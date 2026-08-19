import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLoan } from '../context/LoanContext';
import { ShieldCheck, LogOut, User, Landmark, HelpCircle } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { application } = useLoan();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="bg-emerald-600 text-white p-2 rounded-xl group-hover:bg-emerald-700 transition-colors shadow-sm">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">EZ<span className="text-emerald-600">FINANZ</span></span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">Personal Loans</span>
          </div>
        </Link>

        {/* User Info & Actions */}
        {user ? (
          <div className="flex items-center space-x-4">
            {user.role === 'admin' ? (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ADMIN PORTAL</span>
              </span>
            ) : application?.applicationNumber ? (
              <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                App ID: <strong className="ml-1 text-slate-900">{application.applicationNumber}</strong>
              </span>
            ) : null}

            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-800 leading-none">{user.fullName}</p>
                <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-700 hover:text-emerald-600 px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg shadow-sm transition-all"
            >
              Apply Now
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
