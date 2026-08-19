import React from 'react';
import { Check } from 'lucide-react';

const STEP_LABELS = [
  { id: 1, name: 'Auth', stage: 'DRAFT' },
  { id: 2, name: 'Verify', stage: 'EMAIL_VERIFIED' },
  { id: 3, name: 'KYC', stage: 'KYC_SUBMITTED' },
  { id: 4, name: 'Eligibility', stage: 'ELIGIBILITY_CALCULATED' },
  { id: 5, name: 'EMI Terms', stage: 'LOAN_TERMS_SELECTED' },
  { id: 6, name: 'Bank Details', stage: 'BANK_DETAILS_ADDED' },
  { id: 7, name: 'Declaration', stage: 'DECLARATION_ACCEPTED' },
  { id: 8, name: 'Live Selfie', stage: 'UNDER_ADMIN_REVIEW' },
  { id: 9, name: 'Admin Review', stage: 'SELFIE_APPROVED' },
  { id: 10, name: 'Disbursement', stage: 'DISBURSED' }
];

export default function Stepper({ currentStep = 1 }) {
  return (
    <div className="w-full py-4 px-2 sm:px-6 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto">
        {/* Desktop Stepper */}
        <div className="hidden lg:flex items-center justify-between">
          {STEP_LABELS.map((step, idx) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center group">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isCurrent
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-md scale-110'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : step.id}
                  </div>
                  <span
                    className={`mt-2 text-xs font-semibold tracking-tight transition-colors ${
                      isCurrent ? 'text-emerald-700 font-bold' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>

                {idx < STEP_LABELS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300 ${
                      step.id < currentStep ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile Stepper Bar */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
            <span className="uppercase text-emerald-700 font-bold tracking-wider">
              Step {currentStep} of {STEP_LABELS.length}: {STEP_LABELS[currentStep - 1]?.name}
            </span>
            <span className="text-slate-500">
              {Math.round((currentStep / STEP_LABELS.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / STEP_LABELS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
