import React, { useState } from 'react';
import { X, CheckCircle, XCircle, DollarSign, Calendar, User, FileText, Landmark, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { maskIdNumber, maskAccountNumber } from '../utils/validators';
import { getUploadUrl } from '../utils/urlHelper';

export default function AdminAppViewerModal({ appData, onClose, onRefresh }) {
  const [activeTab, setActiveTab] = useState('selfie');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!appData) return null;

  const {
    _id,
    applicationNumber,
    user,
    currentStage,
    kyc,
    financials,
    eligibility,
    selectedTerms,
    bankDetails,
    declaration,
    selfie,
    disbursement,
    createdAt
  } = appData;

  const handleApproveSelfie = async () => {
    setLoadingAction(true);
    setErrorMsg(null);
    try {
      const res = await api.post(`/admin/applications/${_id}/selfie-review`, { action: 'APPROVE' });
      if (res.success) {
        onRefresh();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to approve selfie.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRejectSelfie = async () => {
    if (!rejectionReason.trim()) {
      setErrorMsg('Please enter a rejection reason.');
      return;
    }
    setLoadingAction(true);
    setErrorMsg(null);
    try {
      const res = await api.post(`/admin/applications/${_id}/selfie-review`, {
        action: 'REJECT',
        rejectionReason: rejectionReason.trim()
      });
      if (res.success) {
        setShowRejectModal(false);
        onRefresh();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reject selfie.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConfirmDisbursement = async () => {
    setLoadingAction(true);
    setErrorMsg(null);
    try {
      const res = await api.post(`/admin/applications/${_id}/disburse`, { notes: 'Disbursement executed by Admin' });
      if (res.success) {
        onRefresh();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Disbursement failed.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-xl font-extrabold tracking-tight">{user?.fullName || 'Applicant'}</span>
              <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {currentStage}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Application ID: <span className="font-mono text-slate-200">{applicationNumber}</span> | Submitted: {new Date(createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 flex overflow-x-auto px-4 gap-1 text-sm font-semibold text-slate-600">
          {[
            { id: 'selfie', label: 'Selfie Verification' },
            { id: 'kyc', label: 'Identity & KYC' },
            { id: 'financials', label: 'Financials & Eligibility' },
            { id: 'terms', label: 'Loan & EMI Terms' },
            { id: 'bank', label: 'Bank Account' },
            { id: 'declaration', label: 'Declaration & Logs' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700 font-bold bg-white rounded-t-lg'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: SELFIE VERIFICATION */}
          {activeTab === 'selfie' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="bg-slate-950 rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border-2 border-slate-800 shadow-inner">
                  {selfie?.photoPath ? (
                    <div className="w-full h-full relative flex items-center justify-center">
                      <img
                        src={getUploadUrl(selfie.photoPath)}
                        alt="Submitted Selfie"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'block';
                          }
                        }}
                      />
                      <div className="hidden p-4 text-center text-slate-400 text-xs font-semibold">
                        <p>⚠️ Selfie image could not be loaded.</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No selfie submitted yet.</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-2">
                    <h4 className="font-bold text-slate-900 border-b pb-2">Selfie Audit Status</h4>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <strong className={`font-bold ${selfie?.status === 'APPROVED' ? 'text-emerald-600' : selfie?.status === 'REJECTED' ? 'text-red-600' : 'text-amber-600'}`}>
                        {selfie?.status || 'PENDING'}
                      </strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Uploaded At:</span>
                      <span>{selfie?.uploadedAt ? new Date(selfie.uploadedAt).toLocaleString() : 'N/A'}</span>
                    </p>
                    {selfie?.rejectionReason && (
                      <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg mt-2 text-xs font-semibold">
                        Rejection Reason: {selfie.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="space-y-3 pt-2">
                    {selfie?.status !== 'APPROVED' && (
                      <div className="flex gap-3">
                        <button
                          onClick={handleApproveSelfie}
                          disabled={loadingAction}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span>Approve Photo</span>
                        </button>
                        <button
                          onClick={() => setShowRejectModal(true)}
                          disabled={loadingAction}
                          className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm"
                        >
                          <XCircle className="w-5 h-5" />
                          <span>Reject Photo</span>
                        </button>
                      </div>
                    )}

                    {/* Disbursement Trigger */}
                    {currentStage === 'SELFIE_APPROVED' && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                        <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          <span>Selfie Approved - Ready for Disbursement</span>
                        </div>
                        <button
                          onClick={handleConfirmDisbursement}
                          disabled={loadingAction}
                          className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-base"
                        >
                          <DollarSign className="w-5 h-5" />
                          <span>Confirm & Disburse ₹{selectedTerms?.netDisbursementAmount?.toLocaleString('en-IN') || 0}</span>
                        </button>
                      </div>
                    )}

                    {currentStage === 'DISBURSED' && (
                      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 font-bold text-sm space-y-1">
                        <p className="flex justify-between">
                          <span>Disbursement UTR:</span>
                          <span className="font-mono text-indigo-700">{disbursement?.utrNumber}</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Disbursed Amount:</span>
                          <span>₹{disbursement?.disbursedAmount?.toLocaleString('en-IN')}</span>
                        </p>
                        <p className="flex justify-between text-xs text-slate-500 font-normal mt-1">
                          <span>Date:</span>
                          <span>{new Date(disbursement?.disbursedAt).toLocaleString()}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KYC */}
          {activeTab === 'kyc' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 border-b pb-2">Personal Details</h4>
                <p><span className="text-slate-500">Full Name:</span> <strong>{kyc?.fullName}</strong></p>
                <p><span className="text-slate-500">Date of Birth:</span> <strong>{kyc?.dob ? new Date(kyc.dob).toLocaleDateString() : 'N/A'} (Age: {kyc?.age})</strong></p>
                <p><span className="text-slate-500">Gender:</span> <strong>{kyc?.gender}</strong></p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 border-b pb-2">Identity & Document</h4>
                <p><span className="text-slate-500">ID Type:</span> <strong>{kyc?.idType}</strong></p>
                <p><span className="text-slate-500">ID Number:</span> <strong className="font-mono">{maskIdNumber(kyc?.idType, kyc?.idNumber)}</strong></p>
                <p><span className="text-slate-500">Address:</span> <strong>{kyc?.address?.line1}, {kyc?.address?.city}, {kyc?.address?.state} - {kyc?.address?.pincode}</strong></p>
                {kyc?.documentPath && (
                  <div className="pt-2">
                    <a
                      href={getUploadUrl(kyc.documentPath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Uploaded KYC Document</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIALS */}
          {activeTab === 'financials' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 border-b pb-2">Submitted Financial Data</h4>
                <p><span className="text-slate-500">Monthly Net Income:</span> <strong>₹{financials?.monthlyIncome?.toLocaleString('en-IN')}</strong></p>
                <p><span className="text-slate-500">Requested Amount:</span> <strong>₹{financials?.requestedAmount?.toLocaleString('en-IN')}</strong></p>
                <p><span className="text-slate-500">CIBIL Score:</span> <strong className="text-emerald-700">{financials?.cibilScore}</strong></p>
                <p><span className="text-slate-500">Current Monthly Debts:</span> <strong>₹{financials?.existingDebts?.toLocaleString('en-IN')}</strong></p>
                <p><span className="text-slate-500">Employer:</span> <strong>{financials?.employerName} ({financials?.designation})</strong></p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 border-b pb-2">Underwriting Results</h4>
                <p><span className="text-slate-500">Decision Status:</span> <strong className="text-emerald-600 font-extrabold">{eligibility?.status}</strong></p>
                <p><span className="text-slate-500">Debt-to-Income (DTI):</span> <strong>{eligibility?.dtiRatio}%</strong></p>
                <p><span className="text-slate-500">Risk Tier:</span> <strong>{eligibility?.riskRating}</strong></p>
                <p><span className="text-slate-500">Max Approved Credit Limit:</span> <strong className="text-emerald-700 text-base">₹{eligibility?.maxApprovedAmount?.toLocaleString('en-IN')}</strong></p>
                <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200 mt-2">{eligibility?.reason}</p>
              </div>
            </div>
          )}

          {/* TAB 4: LOAN TERMS */}
          {activeTab === 'terms' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-3">
              <h4 className="font-bold text-slate-900 border-b pb-2">Locked Loan Calculation Summary</h4>
              <div className="grid grid-cols-2 gap-3">
                <p><span className="text-slate-500">Sanctioned Amount:</span> <strong>₹{selectedTerms?.amount?.toLocaleString('en-IN')}</strong></p>
                <p><span className="text-slate-500">Tenure:</span> <strong>{selectedTerms?.tenureMonths} Months</strong></p>
                <p><span className="text-slate-500">Monthly EMI:</span> <strong className="text-emerald-700 text-base">₹{selectedTerms?.monthlyEmi?.toLocaleString('en-IN')}</strong></p>
                <p><span className="text-slate-500">APR:</span> <strong>{selectedTerms?.interestRate}% p.a.</strong></p>
                <p><span className="text-slate-500">Net Disbursement:</span> <strong className="text-emerald-700">₹{selectedTerms?.netDisbursementAmount?.toLocaleString('en-IN')}</strong></p>
                <p><span className="text-slate-500">Annualized IRR:</span> <strong>{selectedTerms?.annualNominalIrr}%</strong></p>
              </div>
            </div>
          )}

          {/* TAB 5: BANK ACCOUNT */}
          {activeTab === 'bank' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-2">
              <h4 className="font-bold text-slate-900 border-b pb-2">Target Bank Account</h4>
              <p><span className="text-slate-500">Account Holder:</span> <strong>{bankDetails?.accountHolderName}</strong></p>
              <p><span className="text-slate-500">Account Number:</span> <strong className="font-mono">{maskAccountNumber(bankDetails?.accountNumber)}</strong></p>
              <p><span className="text-slate-500">Bank Name:</span> <strong>{bankDetails?.bankName}</strong></p>
              <p><span className="text-slate-500">IFSC Code:</span> <strong className="font-mono">{bankDetails?.ifscCode}</strong></p>
              <p><span className="text-slate-500">Penny Drop Check:</span> <span className="text-emerald-700 font-bold">Verified</span></p>
            </div>
          )}

          {/* TAB 6: DECLARATION */}
          {activeTab === 'declaration' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-2">
              <h4 className="font-bold text-slate-900 border-b pb-2">Legal Undertaking</h4>
              <p><span className="text-slate-500">Terms Accepted:</span> <strong>{declaration?.accepted ? 'Yes' : 'No'}</strong></p>
              <p><span className="text-slate-500">Accepted Timestamp:</span> <span>{declaration?.acceptedAt ? new Date(declaration.acceptedAt).toLocaleString() : 'N/A'}</span></p>
              <p><span className="text-slate-500">IP Address:</span> <span className="font-mono">{declaration?.ipAddress || '127.0.0.1'}</span></p>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Selfie Rejection Reason</h3>
            <p className="text-xs text-slate-500">Provide feedback for the applicant so they can re-upload a clear selfie.</p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Preset Reasons</label>
              <select
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Select a reason...</option>
                <option value="Blurry or low-resolution photo. Face features not clear.">Blurry or low resolution photo</option>
                <option value="Face does not match identity document photo.">Face does not match ID document</option>
                <option value="Poor lighting or shadow obscuring facial features.">Poor lighting or shadow</option>
                <option value="Obstruction present (sunglasses, hat, or face mask).">Obstruction present (glasses/hat)</option>
              </select>
            </div>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Or enter custom rejection notes..."
              className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSelfie}
                disabled={loadingAction}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md text-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
