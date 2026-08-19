import React, { useState } from 'react';
import { useLoan } from '../context/LoanContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Stepper from '../components/Stepper';
import { CheckCircle, Download, AlertCircle } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <Stepper currentStep={10} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10 space-y-6">
        {/* Success Celebration Card */}
        <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-600" />

          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50 shadow-inner">
            <CheckCircle className="w-10 h-10" />
          </div>

          <span className="inline-block uppercase tracking-widest text-xs font-extrabold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full mb-2">
            Disbursement Complete
          </span>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Loan Disbursed Successfully!</h1>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Your net loan amount has been credited to your verified bank account.
          </p>

          {downloadError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{downloadError}</span>
            </div>
          )}

          {/* Key Receipt Box */}
          <div className="mt-8 bg-slate-900 text-white rounded-2xl p-6 shadow-2xl text-left space-y-4">
            <div className="flex justify-between items-baseline border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400">Net Disbursed Amount</span>
                <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                  ₹{disbursement?.disbursedAmount ? Number(disbursement.disbursedAmount).toLocaleString('en-IN') : Number(selectedTerms?.netDisbursementAmount || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-slate-400 block">Bank Transaction Ref (UTR)</span>
                <span className="font-mono text-sm font-bold text-white">{disbursement?.utrNumber || 'EZF-DISB-2026-998877'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Target Bank Account</span>
                <strong className="text-sm text-slate-100">{bankDetails?.bankName} (•••• {bankDetails?.accountNumber?.slice(-4) || '1234'})</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Monthly EMI</span>
                <strong className="text-sm text-emerald-400">₹{selectedTerms?.monthlyEmi?.toLocaleString('en-IN')} / month</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Repayment Tenure</span>
                <strong className="text-sm text-slate-100">{selectedTerms?.tenureMonths} Months</strong>
              </div>
              <div>
                <span className="text-slate-400 block">First EMI Due Date</span>
                <strong className="text-sm text-slate-100">5th of Next Month</strong>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={handleDownloadSanctionLetter}
              disabled={downloading}
              className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-sm transition-all border border-slate-300 flex items-center space-x-2 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {downloading ? (
                <div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-emerald-600" />
              )}
              <span>{downloading ? 'Generating PDF...' : 'Download Sanction Letter (PDF)'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
