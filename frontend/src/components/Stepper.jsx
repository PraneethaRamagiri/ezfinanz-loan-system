import React from 'react';
import { Check, Clock, AlertTriangle } from 'lucide-react';

const STEP_LABELS = [
  { id: 1, name: 'Auth' },
  { id: 2, name: 'Verify' },
  { id: 3, name: 'KYC' },
  { id: 4, name: 'Eligibility' },
  { id: 5, name: 'EMI Terms' },
  { id: 6, name: 'Bank Details' },
  { id: 7, name: 'Declaration' },
  { id: 8, name: 'Live Selfie' },
  { id: 9, name: 'Admin Review' },
  { id: 10, name: 'Disbursement' }
];

export default function Stepper({ currentStep = 1, currentStage = '' }) {
  // Determine status for each step based on currentStage and currentStep
  const getStepStatus = (stepId) => {
    if (currentStage === 'UNDER_ADMIN_REVIEW') {
      if (stepId <= 8) return 'completed';
      if (stepId === 9) return 'waiting';
      return 'inactive';
    }

    if (currentStage === 'SELFIE_REJECTED') {
      if (stepId <= 7) return 'completed';
      if (stepId === 8) return 'action_required';
      return 'inactive';
    }

    if (currentStage === 'SELFIE_APPROVED') {
      if (stepId <= 9) return 'completed';
      if (stepId === 10) return 'current';
      return 'inactive';
    }

    if (currentStage === 'DISBURSED') {
      return 'completed';
    }

    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'inactive';
  };

  return (
    <div className="w-full py-4 px-2 sm:px-6 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto">
        {/* Desktop Stepper */}
        <div className="hidden lg:flex items-center justify-between">
          {STEP_LABELS.map((step, idx) => {
            const status = getStepStatus(step.id);
            const isCompleted = status === 'completed';
            const isCurrent = status === 'current';
            const isWaiting = status === 'waiting';
            const isActionRequired = status === 'action_required';

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center group relative">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-md scale-110'
                        : isWaiting
                        ? 'bg-amber-500 text-white ring-4 ring-amber-100 shadow-md animate-pulse'
                        : isActionRequired
                        ? 'bg-red-600 text-white ring-4 ring-red-100 shadow-md'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : isWaiting ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : isActionRequired ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-semibold tracking-tight transition-colors ${
                      isCurrent
                        ? 'text-emerald-700 font-bold'
                        : isWaiting
                        ? 'text-amber-800 font-bold'
                        : isCompleted
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.name}
                  </span>
                  {isWaiting && (
                    <span className="absolute -bottom-4 text-[10px] font-black text-amber-700 uppercase tracking-widest whitespace-nowrap">
                      Waiting Admin
                    </span>
                  )}
                </div>

                {idx < STEP_LABELS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300 ${
                      isCompleted ? 'bg-emerald-600' : isWaiting ? 'bg-amber-300' : 'bg-slate-200'
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
              {currentStage === 'UNDER_ADMIN_REVIEW'
                ? 'Step 9 of 10: Admin Review (Waiting for Admin Approval 🟡)'
                : `Step ${currentStep} of ${STEP_LABELS.length}: ${STEP_LABELS[currentStep - 1]?.name}`}
            </span>
            <span className="text-slate-500">
              {currentStage === 'UNDER_ADMIN_REVIEW' ? '85% Complete (Under Review)' : `${Math.round((currentStep / STEP_LABELS.length) * 100)}% Complete`}
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                currentStage === 'UNDER_ADMIN_REVIEW' ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              style={{
                width: `${currentStage === 'UNDER_ADMIN_REVIEW' ? 85 : Math.round((currentStep / STEP_LABELS.length) * 100)}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
