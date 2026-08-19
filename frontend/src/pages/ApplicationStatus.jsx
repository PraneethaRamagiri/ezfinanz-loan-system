import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLoan } from '../context/LoanContext';
import Navbar from '../components/Navbar';
import Stepper from '../components/Stepper';
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, FileCheck, ShieldCheck } from 'lucide-react';

export default function ApplicationStatus() {
  const { application, refreshApplication, loading } = useLoan();
  const navigate = useNavigate();

  useEffect(() => {
    if (!application) {
      refreshApplication();
    }
  }, [application, refreshApplication]);

  useEffect(() => {
    if (application?.currentStage === 'DISBURSED') {
      navigate('/disbursement');
    }
  }, [application, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">Fetching application status timeline...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4 w-full">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <FileCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">No Active Application Found</h2>
            <p className="text-sm text-slate-600">
              You haven't started a personal loan application yet. Begin your application now for an instant eligibility check and fast disbursement.
            </p>
            <div className="pt-2">
              <Link
                to="/verify-contact"
                className="inline-flex items-center space-x-2 py-3.5 px-7 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all"
              >
                <span>Start Loan Application</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { currentStage, applicationNumber, selfie, selectedTerms, disbursement } = application;

  const getStepNumber = (stage) => {
    switch (stage) {
      case 'DRAFT': return 1;
      case 'EMAIL_VERIFIED': return 2;
      case 'PHONE_VERIFIED': return 2;
      case 'KYC_SUBMITTED': return 3;
      case 'ELIGIBILITY_CALCULATED': return 4;
      case 'LOAN_TERMS_SELECTED': return 5;
      case 'BANK_DETAILS_ADDED': return 6;
      case 'DECLARATION_ACCEPTED': return 7;
      case 'UNDER_ADMIN_REVIEW': return 8;
      case 'SELFIE_REJECTED': return 8;
      case 'SELFIE_APPROVED': return 9;
      case 'DISBURSED': return 10;
      default: return 1;
    }
  };

  const currentStepNum = getStepNumber(currentStage);

  const getNextStepRoute = (stage) => {
    switch (stage) {
      case 'DRAFT': return '/verify-contact';
      case 'EMAIL_VERIFIED': return '/verify-contact';
      case 'PHONE_VERIFIED': return '/kyc';
      case 'KYC_SUBMITTED': return '/eligibility';
      case 'ELIGIBILITY_CALCULATED': return '/loan-customizer';
      case 'LOAN_TERMS_SELECTED': return '/bank-details';
      case 'BANK_DETAILS_ADDED': return '/declaration';
      case 'DECLARATION_ACCEPTED': return '/selfie-upload';
      case 'SELFIE_REJECTED': return '/selfie-upload';
      case 'SELFIE_APPROVED': return '/status';
      default: return '/status';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <Stepper currentStep={currentStepNum} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Hero Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-700" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Loan Application Ref</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">{applicationNumber}</h2>
              <p className="text-xs font-medium text-slate-500 mt-1">Submitted on {new Date(application.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>

            <div className="sm:text-right">
              {currentStage === 'UNDER_ADMIN_REVIEW' ? (
                <span className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                  <Clock className="w-4 h-4 animate-spin text-amber-700" />
                  <span>UNDER ADMIN REVIEW</span>
                </span>
              ) : currentStage === 'SELFIE_APPROVED' ? (
                <span className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>APPROVED - AWAITING DISBURSEMENT</span>
                </span>
              ) : currentStage === 'SELFIE_REJECTED' ? (
                <span className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-black bg-red-100 text-red-900 border border-red-300 shadow-2xs">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>ACTION REQUIRED</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs">
                  <span>APPLICATION IN PROGRESS</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Prompt Banner */}
        {currentStage === 'SELFIE_REJECTED' && (
          <div className="p-5 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <h4 className="font-extrabold text-red-950 text-base">Selfie Photo Rejected by Admin</h4>
              <p className="text-xs text-red-700 mt-0.5">Reason: {selfie?.rejectionReason}</p>
            </div>
            <Link
              to="/selfie-upload"
              className="py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Re-upload Selfie
            </Link>
          </div>
        )}

        {currentStage !== 'UNDER_ADMIN_REVIEW' && currentStage !== 'SELFIE_APPROVED' && currentStage !== 'DISBURSED' && currentStage !== 'SELFIE_REJECTED' && (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <h4 className="font-black text-emerald-950 text-base">Continue Loan Application</h4>
              <p className="text-xs text-emerald-800 mt-0.5">Your progress is automatically saved. Resume whenever ready.</p>
            </div>
            <Link
              to={getNextStepRoute(currentStage)}
              className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span>Resume Step {currentStepNum}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* 10-Step Timeline Journey Tracker */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-5">
          <h3 className="font-black text-slate-900 text-lg border-b border-slate-100 pb-3 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Application Milestones & Journey Tracker</span>
          </h3>

          <div className="space-y-4 text-sm">
            {[
              { title: 'Account Registration & Authentication', desc: 'Email and phone OTP verified', done: currentStepNum >= 2 },
              { title: 'Identity & Address KYC', desc: 'PAN / Aadhaar details saved', done: currentStepNum >= 3 },
              { title: 'Underwriting Eligibility Check', desc: `Status: ${application.eligibility?.status || 'Completed'}`, done: currentStepNum >= 4 },
              { title: 'EMI & Loan Term Selection', desc: selectedTerms ? `₹${selectedTerms.amount?.toLocaleString('en-IN')} for ${selectedTerms.tenureMonths}M (EMI: ₹${selectedTerms.monthlyEmi?.toLocaleString('en-IN')})` : 'Terms pending', done: currentStepNum >= 5 },
              { title: 'Disbursement Bank Account', desc: application.bankDetails?.bankName ? `${application.bankDetails.bankName} (Verified)` : 'Bank pending', done: currentStepNum >= 6 },
              { title: 'Legal Declaration Signed', desc: application.declaration?.accepted ? 'Consent recorded' : 'Declaration pending', done: currentStepNum >= 7 },
              { title: 'Live Selfie Submitted', desc: selfie?.photoPath ? 'Selfie uploaded' : 'Selfie pending', done: currentStepNum >= 8 },
              { title: 'Admin Audit Verification', desc: currentStage === 'SELFIE_APPROVED' || currentStage === 'DISBURSED' ? 'Selfie Approved by Admin' : currentStage === 'UNDER_ADMIN_REVIEW' ? 'Under active review...' : 'Awaiting review', done: currentStage === 'SELFIE_APPROVED' || currentStage === 'DISBURSED' },
              { title: 'Bank Funds Disbursement', desc: currentStage === 'DISBURSED' ? `Disbursed UTR: ${disbursement?.utrNumber}` : 'Pending final confirmation', done: currentStage === 'DISBURSED' }
            ].map((milestone, i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  milestone.done ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1 border-b border-slate-100 pb-3">
                  <h4 className={`text-sm ${milestone.done ? 'text-slate-900 font-extrabold' : 'text-slate-500 font-medium'}`}>{milestone.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">{milestone.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
