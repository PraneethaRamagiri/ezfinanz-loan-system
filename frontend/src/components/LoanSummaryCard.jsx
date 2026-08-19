import React from 'react';
import { Calculator, ArrowDownRight, Info, CheckCircle2, TrendingUp } from 'lucide-react';

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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 relative overflow-hidden">
      {/* Top Banner Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />

      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-none">{title}</h3>
            <p className="text-xs text-slate-500 mt-1">Reducing Balance & Newton-Raphson Yield</p>
          </div>
        </div>

        <span className="text-xs font-semibold uppercase px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
          APR {interestRate}% p.a.
        </span>
      </div>

      {/* Main EMI Highlight Box */}
      <div className="bg-slate-900 text-white rounded-xl p-5 mb-6 shadow-inner relative">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Monthly EMI</span>
            <div className="text-3xl font-extrabold tracking-tight text-white mt-1">
              ₹{Number(monthlyEmi).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              <span className="text-sm font-normal text-slate-400 ml-1">/ month</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-1 rounded-md">
              Tenure: {tenureMonths} Months
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-600">
          <span>Sanctioned Principal Loan</span>
          <span className="font-semibold text-slate-900">₹{Number(amount).toLocaleString('en-IN')}</span>
        </div>

        <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-600">
          <span>Processing Fee (2.0%)</span>
          <span className="font-medium text-slate-800">₹{Number(processingFee).toLocaleString('en-IN')}</span>
        </div>

        <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-600">
          <span>GST on Processing Fee (18%)</span>
          <span className="font-medium text-slate-800">₹{Number(gst).toLocaleString('en-IN')}</span>
        </div>

        <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-600">
          <span>Documentation Fee</span>
          <span className="font-medium text-slate-800">₹{Number(documentationFee).toLocaleString('en-IN')}</span>
        </div>

        <div className="flex justify-between py-2 border-b border-slate-200 text-slate-700 bg-slate-50 px-3 rounded-lg font-semibold">
          <span className="flex items-center text-slate-800">
            <ArrowDownRight className="w-4 h-4 text-red-500 mr-1.5" /> Total Deductions
          </span>
          <span className="text-red-600">- ₹{Number(totalDeductions).toLocaleString('en-IN')}</span>
        </div>

        {/* Net Disbursement Highlight */}
        <div className="flex justify-between py-3 px-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-bold text-base my-2 shadow-2xs">
          <span>Net Amount Transferred to Bank</span>
          <span className="text-emerald-700 font-extrabold text-lg">
            ₹{Number(netDisbursementAmount).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-600">
          <span>Total Interest Payable over Tenure</span>
          <span className="font-medium text-slate-800">₹{Number(totalInterest).toLocaleString('en-IN')}</span>
        </div>

        <div className="flex justify-between py-1.5 text-slate-700 font-semibold">
          <span>Total Repayment Amount</span>
          <span className="text-slate-900">₹{Number(totalRepayment).toLocaleString('en-IN')}</span>
        </div>

        {/* IRR Details Box */}
        <div className="mt-4 pt-3 border-t border-slate-200 bg-indigo-50/70 border-indigo-100 rounded-xl p-3.5 flex items-start space-x-3">
          <TrendingUp className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-indigo-950">Internal Rate of Return (IRR):</span>
              <span className="font-extrabold text-indigo-700 text-sm">{annualNominalIrr}% p.a.</span>
            </div>
            <p className="text-indigo-800/80 mt-0.5 leading-snug">
              Effective Annualized Rate (EAR): <strong className="text-indigo-900">{annualEffectiveIrr}%</strong> (Takes into account upfront fee deductions).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
