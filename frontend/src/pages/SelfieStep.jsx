import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoan } from '../context/LoanContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Stepper from '../components/Stepper';
import CameraCapture from '../components/CameraCapture';
import { ArrowRight, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';

export default function SelfieStep() {
  const { application, refreshApplication } = useLoan();
  const navigate = useNavigate();

  const [selfieFile, setSelfieFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(application?.selfie?.photoPath || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRejected = application?.currentStage === 'SELFIE_REJECTED';

  const handleCapture = (file, dataUrl) => {
    setSelfieFile(file);
    setPreviewUrl(dataUrl);
    setError('');
  };

  const handleFileSelect = (file, dataUrl) => {
    setSelfieFile(file);
    setPreviewUrl(dataUrl);
    setError('');
  };

  const handleSubmitSelfie = async () => {
    if (!selfieFile && !previewUrl) {
      setError('Please capture or upload a live selfie photo before submitting.');
      return;
    }

    if (selfieFile && selfieFile.size > 10 * 1024 * 1024) {
      setError(`Selected photo is too large (${(selfieFile.size / (1024 * 1024)).toFixed(1)} MB). Please select an image under 10 MB.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      if (selfieFile) {
        formData.append('selfieImage', selfieFile);
      }

      const res = await api.post('/application/selfie/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.success) {
        await refreshApplication();
        navigate('/status');
      }
    } catch (err) {
      setError(err.message || 'Selfie upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <Stepper currentStep={8} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">Step 8: Live Selfie Photo Verification</h1>
          <p className="text-sm text-slate-600 mt-1">Final identity check before admin review and loan disbursement.</p>
        </div>

        {isRejected && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl space-y-1">
            <div className="flex items-center space-x-2 font-bold text-red-900">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span>Previous Selfie Photo Was Rejected by Admin</span>
            </div>
            <p className="text-xs text-red-700">Reason: {application?.selfie?.rejectionReason}</p>
            <p className="text-xs font-semibold text-red-900 mt-1">Please re-capture a clear, well-lit photo of your face.</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Grid: Live Camera + Example Guidance Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Live Camera Viewport (2 Columns on Desktop) */}
          <div className="lg:col-span-2">
            <CameraCapture
              onCapture={handleCapture}
              onFileSelect={handleFileSelect}
              previewUrl={previewUrl}
            />
          </div>

          {/* Example of a Good Selfie Guidance Section (1 Column on Desktop) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center space-x-2 text-slate-900">
              <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <h3 className="font-bold text-base">Example of a Good Selfie</h3>
            </div>

            {/* Demo Image Asset */}
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
              <img
                src="/example_selfie.svg"
                alt="Example of a Good Selfie"
                className="w-full h-auto object-cover max-h-48"
              />
            </div>

            {/* Checklist Guidance Points */}
            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-semibold">Face centered inside frame guide</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-semibold">Look directly at the camera</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-semibold">Good lighting on your face</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-semibold">Full face clearly visible</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-semibold">No sunglasses or face covering</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmitSelfie}
            disabled={loading || (!selfieFile && !previewUrl)}
            className={`py-3.5 px-8 rounded-xl font-extrabold shadow-md flex items-center space-x-2 text-base transition-all ${
              selfieFile || previewUrl
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Submit Application for Admin Review</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
