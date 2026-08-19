import React from 'react';
import { Calculator, ArrowDownRight, TrendingUp, Sparkles, CheckCircle } from 'lucide-react';

export default function LoanSummaryCard({ terms, title = "Calculated Loan Summary" }) {
  if (!terms) return null;

  const {
    amount,
    tenureMonths,
    interestRate,
    monthlyEmi,
    processingFee,
    gst,
    documentationFee,
    totalDeductions,
    netDisbursementAmount,
    totalInterest,
    totalRepayment,
    annualNominalIrr,
    annualEffectiveIrr
  } = terms;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 relative overflow-hidden space-y-5">
      {/* Top Gradient Banner */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-700" />

      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 shadow-2xs">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Reducing Balance & IRR Engine</p>
          </div>
        </div>

        <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200/80 shadow-2xs">
          APR {interestRate}% p.a.
        </span>
      </div>

      {/* Main Monthly EMI Prominent Highlight Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-2xl p-6 shadow-2xl relative border border-slate-800 overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-baseline justify-between relative z-10">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">Monthly EMI</span>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1.5 flex items-baseline space-x-1">
              <span>₹{Number(monthlyEmi).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              <span className="text-sm font-medium text-slate-300">/ month</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/90 border border-emerald-700/80 px-3 py-1.5 rounded-xl block shadow-xs">
              Tenure: {tenureMonths} Months
            </span>
          </div>
        </div>
      </div>

      {/* Financial Metrics Table Grid */}
      <div className="space-y-2.5 text-xs sm:text-sm">
        <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
          <span className="font-semibold text-slate-600">Sanctioned Loan Amount</span>
          <span className="font-extrabold text-slate-900">₹{Number(amount).toLocaleString('en-IN')}</span>
        </div>

        <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
          <span>Processing Fee (2.0%)</span>
          <span className="font-semibold text-slate-800">₹{Number(processingFee).toLocaleString('en-IN')}</span>
        </div>

        <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
          <span>GST on Processing Fee (18%)</span>
          <span className="font-semibold text-slate-800">₹{Number(gst).toLocaleString('en-IN')}</span>
        </div>

        <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
          <span>Documentation / Stamp Charges</span>
          <span className="font-semibold text-slate-800">₹{Number(documentationFee).toLocaleString('en-IN')}</span>
        </div>

        <div className="flex justify-between py-2.5 border-b border-slate-200 text-slate-700 bg-slate-50/80 px-3.5 rounded-xl font-bold">
          <span className="flex items-center text-slate-800">
            <ArrowDownRight className="w-4 h-4 text-red-500 mr-1.5" /> Total Upfront Charges
          </span>
          <span className="text-red-600 font-extrabold">- ₹{Number(totalDeductions).toLocaleString('en-IN')}</span>
        </div>

        {/* Net Disbursement Prominent Card */}
        <div className="flex justify-between items-center py-3.5 px-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 font-bold text-sm my-3 shadow-xs">
          <div>
            <span className="block text-xs uppercase tracking-wider text-emerald-800 font-extrabold">Net Disbursement Amount</span>
            <span className="text-xs font-normal text-emerald-700">Directly transferred to bank account</span>
          </div>
          <span className="text-emerald-700 font-black text-xl">
            ₹{Number(netDisbursementAmount).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
          <span className="font-semibold text-slate-600">Total Interest Payable over Tenure</span>
          <span className="font-bold text-slate-900">₹{Number(totalInterest).toLocaleString('en-IN')}</span>
        </div>

        <div className="flex justify-between py-2.5 border-b border-slate-100 text-slate-800 font-extrabold text-sm">
          <span>Total Repayment Amount</span>
          <span className="text-slate-900 text-base">₹{Number(totalRepayment).toLocaleString('en-IN')}</span>
        </div>

        {/* Annualized IRR Metric Box */}
        <div className="mt-4 pt-3 border-t border-slate-200 bg-indigo-50/80 border border-indigo-100 rounded-2xl p-4 flex items-start space-x-3 shadow-2xs">
          <TrendingUp className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-indigo-950">Annualized IRR:</span>
              <span className="font-black text-indigo-700 text-sm">{annualNominalIrr}% p.a.</span>
            </div>
            <p className="text-indigo-800/80 mt-1 leading-snug">
              Effective Annualized Rate (EAR): <strong className="text-indigo-950 font-bold">{annualEffectiveIrr}%</strong> (Accounts for upfront processing fees & deductions).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
