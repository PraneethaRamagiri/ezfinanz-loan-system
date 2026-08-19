import React, { useState } from 'react';
import { useLoan } from '../context/LoanContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Stepper from '../components/Stepper';
import { CheckCircle, Download, AlertCircle, ShieldCheck } from 'lucide-react';

export default function Disbursement() {
  const { application } = useLoan();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const disbursement = application?.disbursement;
  const selectedTerms = application?.selectedTerms;
  const bankDetails = application?.bankDetails;

  const handleDownloadSanctionLetter = async () => {
    setDownloading(true);
    setDownloadError('');

    try {
      const response = await api.get('/application/sanction-letter', {
        responseType: 'blob'
      });

      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const appNum = application?.applicationNumber || 'EZF-2026';
      link.setAttribute('download', `EZFinanz_Sanction_Letter_${appNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
      setDownloadError(err.message || 'Unable to download the sanction letter. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const appNumber = application?.applicationNumber || 'EZF-2026-XXXX';
  const disbDate = disbursement?.disbursedAt
    ? new Date(disbursement.disbursedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const maskedAccount = bankDetails?.accountNumber
    ? `•••• ${bankDetails.accountNumber.slice(-4)}`
    : '•••• 1234';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <Stepper currentStep={10} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10 space-y-6">
        {/* Executive Confirmation Card */}
        <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-700" />

          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50 shadow-inner">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
          </div>

          <span className="inline-flex items-center space-x-1.5 uppercase tracking-widest text-xs font-black px-4 py-1.5 bg-emerald-100 text-emerald-900 rounded-full mb-3 border border-emerald-200">
            <span>✓ Loan Disbursed</span>
          </span>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Loan Disbursed Successfully!</h1>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto font-medium">
            Your net loan funds have been credited to your verified target bank account via IMPS/NEFT transfer.
          </p>

          {downloadError && (
            <div className="mt-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{downloadError}</span>
            </div>
          )}

          {/* Key Receipt Box */}
          <div className="mt-8 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl text-left space-y-5 border border-slate-800 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-slate-800 pb-5 gap-3">
              <div>
                <span className="text-xs uppercase font-black tracking-widest text-emerald-400">Net Disbursed Amount</span>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
                  ₹{disbursement?.disbursedAmount ? Number(disbursement.disbursedAmount).toLocaleString('en-IN') : Number(selectedTerms?.netDisbursementAmount || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="sm:text-right">
                <span className="text-xs font-mono font-bold text-slate-400 block uppercase">Bank Transaction Ref (UTR)</span>
                <span className="font-mono text-sm font-black text-emerald-300">{disbursement?.utrNumber || 'EZF-DISB-2026-998877'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-medium">
              <div>
                <span className="text-slate-400 block font-semibold">Application Reference</span>
                <strong className="text-sm text-slate-100 font-mono font-bold">{appNumber}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Target Bank Account</span>
                <strong className="text-sm text-slate-100 font-bold">{bankDetails?.bankName || 'Bank Account'} ({maskedAccount})</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Disbursement Date</span>
                <strong className="text-sm text-slate-100 font-bold">{disbDate}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Monthly EMI</span>
                <strong className="text-sm text-emerald-400 font-black">₹{selectedTerms?.monthlyEmi?.toLocaleString('en-IN')} / month</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Repayment Tenure</span>
                <strong className="text-sm text-slate-100 font-bold">{selectedTerms?.tenureMonths} Months</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">First EMI Due Date</span>
                <strong className="text-sm text-slate-100 font-bold">5th of Next Month</strong>
              </div>
            </div>
          </div>

          {/* Primary CTA: Download Sanction Letter PDF */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleDownloadSanctionLetter}
              disabled={downloading}
              className="py-4 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-xl flex items-center space-x-3 text-base transition-all cursor-pointer hover:shadow-emerald-600/30 disabled:opacity-50"
            >
              {downloading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              <span>{downloading ? 'Generating Official PDF...' : 'Download Sanction Letter (PDF)'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
