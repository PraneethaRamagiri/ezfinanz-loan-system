import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLoan } from '../context/LoanContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Stepper from '../components/Stepper';
import { validateDateOfBirth, validatePAN, validateAadhaar, validateIdDocument } from '../utils/validators';
import { UserCheck, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

export default function KycStep() {
  const { user } = useAuth();
  const { application, refreshApplication } = useLoan();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(application?.kyc?.fullName || user?.fullName || '');
  const [dob, setDob] = useState(application?.kyc?.dob ? new Date(application.kyc.dob).toISOString().split('T')[0] : '1992-06-15');
  const [gender, setGender] = useState(application?.kyc?.gender || 'Male');
  const [addressLine1, setAddressLine1] = useState(application?.kyc?.address?.line1 || '');
  const [addressLine2, setAddressLine2] = useState(application?.kyc?.address?.line2 || '');
  const [city, setCity] = useState(application?.kyc?.address?.city || '');
  const [state, setState] = useState(application?.kyc?.address?.state || '');
  const [pincode, setPincode] = useState(application?.kyc?.address?.pincode || '');
  const [idType, setIdType] = useState(application?.kyc?.idType || 'PAN');
  const [idNumber, setIdNumber] = useState(application?.kyc?.idNumber || '');
  const [documentFile, setDocumentFile] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fillDemoKyc = () => {
    setFullName('Rajesh Kumar');
    setDob('1992-06-15');
    setGender('Male');
    setAddressLine1('Flat 402, Green Valley Apartments');
    setAddressLine2('Kondapur Main Road');
    setCity('Hyderabad');
    setState('Telangana');
    setPincode('500084');
    setIdType('PAN');
    setIdNumber('ABCDE1234F');
    setFieldErrors({});
    setError('');
  };

  const handleIdTypeChange = (newType) => {
    setIdType(newType);
    setFieldErrors((prev) => ({ ...prev, idNumber: null }));
    if (idNumber) {
      const err = validateIdDocument(newType, idNumber);
      if (err) setFieldErrors((prev) => ({ ...prev, idNumber: err }));
    }
  };

  const handleIdNumberChange = (val) => {
    let formatted = val;
    if (idType === 'PAN') {
      formatted = val.toUpperCase().trim();
    } else {
      formatted = val.replace(/[^0-9]/g, '');
    }
    setIdNumber(formatted);
    const err = validateIdDocument(idType, formatted);
    setFieldErrors((prev) => ({ ...prev, idNumber: err }));
  };

  const handleDobChange = (val) => {
    setDob(val);
    const err = validateDateOfBirth(val);
    setFieldErrors((prev) => ({ ...prev, dob: err }));
  };

  const handlePincodeChange = (val) => {
    const cleanPin = val.replace(/[^0-9]/g, '');
    setPincode(cleanPin);
    if (cleanPin && cleanPin.length !== 6) {
      setFieldErrors((prev) => ({ ...prev, pincode: 'Pincode must be exactly 6 digits.' }));
    } else {
      setFieldErrors((prev) => ({ ...prev, pincode: null }));
    }
  };

  const validateAllFields = () => {
    const errors = {};
    if (!fullName.trim()) errors.fullName = 'Full Name is required.';
    const dobErr = validateDateOfBirth(dob);
    if (dobErr) errors.dob = dobErr;
    if (!addressLine1.trim()) errors.addressLine1 = 'Address Line 1 is required.';
    if (!city.trim()) errors.city = 'City is required.';
    if (!state.trim()) errors.state = 'State is required.';
    if (!pincode || pincode.replace(/\s+/g, '').length !== 6) errors.pincode = 'Pincode must be exactly 6 digits.';
    const idErr = validateIdDocument(idType, idNumber);
    if (idErr) errors.idNumber = idErr;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateAllFields()) {
      setError('Please resolve all validation errors before proceeding.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      formData.append('dob', dob);
      formData.append('gender', gender);
      formData.append('addressLine1', addressLine1.trim());
      formData.append('addressLine2', addressLine2 ? addressLine2.trim() : '');
      formData.append('city', city.trim());
      formData.append('state', state.trim());
      formData.append('pincode', pincode);
      formData.append('idType', idType);
      formData.append('idNumber', idType === 'PAN' ? idNumber.toUpperCase().trim() : idNumber.replace(/\s+/g, ''));

      if (documentFile) {
        formData.append('document', documentFile);
      }

      const res = await api.post('/kyc/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.success) {
        await refreshApplication();
        navigate('/eligibility');
      }
    } catch (err) {
      if (err.details) {
        setFieldErrors(err.details);
      }
      setError(err.message || 'KYC submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const hasErrors = Object.values(fieldErrors).some((err) => Boolean(err));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <Stepper currentStep={3} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Step 3: KYC Details</h1>
            <p className="text-sm text-slate-600 mt-1">Fill in basic identity and current residence details.</p>
          </div>

          <button
            type="button"
            onClick={fillDemoKyc}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Auto-Fill Sample KYC</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <span>Personal Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: null }));
                  }}
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 ${
                    fieldErrors.fullName ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                  }`}
                />
                {fieldErrors.fullName && (
                  <p className="text-xs text-red-600 font-semibold mt-1">{fieldErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => handleDobChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 ${
                    fieldErrors.dob ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                  }`}
                />
                {fieldErrors.dob && (
                  <p className="text-xs text-red-600 font-semibold mt-1">{fieldErrors.dob}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">Current Residence Address</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Address Line 1</label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="House/Flat No, Street Name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Locality, Landmark"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.pincode ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                    }`}
                  />
                  {fieldErrors.pincode && (
                    <p className="text-xs text-red-600 font-semibold mt-1">{fieldErrors.pincode}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Identity Info Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">Identity Document Verification</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">ID Document Type</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer font-semibold text-sm">
                    <input
                      type="radio"
                      name="idType"
                      value="PAN"
                      checked={idType === 'PAN'}
                      onChange={() => handleIdTypeChange('PAN')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>PAN Card</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer font-semibold text-sm">
                    <input
                      type="radio"
                      name="idType"
                      value="Aadhaar"
                      checked={idType === 'Aadhaar'}
                      onChange={() => handleIdTypeChange('Aadhaar')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Aadhaar Card</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {idType} Number <span className="text-slate-400 font-normal text-xs">(Format Validation)</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={idType === 'PAN' ? 10 : 12}
                  value={idNumber}
                  onChange={(e) => handleIdNumberChange(e.target.value)}
                  placeholder={idType === 'PAN' ? 'ABCDE1234F' : '123456789012'}
                  className={`w-full px-3 py-2 border rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500 ${
                    fieldErrors.idNumber ? 'border-red-500 bg-red-50/50 text-red-900' : 'border-slate-300'
                  }`}
                />
                {fieldErrors.idNumber && (
                  <p className="text-xs text-red-600 font-semibold mt-1 flex items-center space-x-1">
                    <span>❌</span>
                    <span>{fieldErrors.idNumber}</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Upload ID Document Copy (Optional)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={(e) => setDocumentFile(e.target.files[0])}
                className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading || hasErrors}
              className={`py-3.5 px-8 rounded-xl font-extrabold shadow-md flex items-center space-x-2 text-base transition-all ${
                hasErrors
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Save KYC & Check Loan Eligibility</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
