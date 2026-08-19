import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import AdminAppViewerModal from '../../components/AdminAppViewerModal';
import api from '../../services/api';
import { ShieldCheck, Search, Eye, RefreshCw, FileText, Landmark, Clock, CheckCircle2, DollarSign, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalApplications: 0,
    pendingReviewCount: 0,
    approvedCount: 0,
    disbursedCount: 0,
    rejectedCount: 0,
    totalDisbursedVolume: 0
  });

  const [applications, setApplications] = useState([]);
  const [stageFilter, setStageFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedAppId, setSelectedAppId] = useState(null);
  const [selectedAppData, setSelectedAppData] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/applications', {
        params: {
          stage: stageFilter,
          search: searchQuery
        }
      });

      if (res.success) {
        setMetrics(res.metrics);
        setApplications(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch admin applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [stageFilter, searchQuery]);

  const handleOpenReview = async (appId) => {
    setSelectedAppId(appId);
    try {
      const res = await api.get(`/admin/applications/${appId}`);
      if (res.success) {
        setSelectedAppData(res.data.application);
      }
    } catch (err) {
      console.error('Failed to open app modal:', err);
    }
  };

  const handleRefreshModal = async () => {
    if (selectedAppId) {
      await handleOpenReview(selectedAppId);
      await fetchApplications();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2.5 bg-purple-100 text-purple-800 rounded-2xl shadow-2xs">
                <ShieldCheck className="w-6 h-6 text-purple-700" />
              </span>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Verification Portal</h1>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Underwrite applications, audit live selfies, and execute bank disbursements.</p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchApplications}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl border border-slate-200 shadow-2xs text-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Dashboard</span>
          </button>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Total Applications</span>
            <div className="text-3xl font-black text-slate-900 mt-2">{metrics.totalApplications}</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm bg-amber-50/40 relative overflow-hidden">
            <span className="text-xs font-black text-amber-800 uppercase tracking-widest block flex items-center justify-between">
              <span>Pending Review</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </span>
            <div className="text-3xl font-black text-amber-700 mt-2">{metrics.pendingReviewCount}</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-sm bg-emerald-50/40 relative overflow-hidden">
            <span className="text-xs font-black text-emerald-800 uppercase tracking-widest block flex items-center justify-between">
              <span>Selfie Approved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </span>
            <div className="text-3xl font-black text-emerald-700 mt-2">{metrics.approvedCount}</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-indigo-200 shadow-sm bg-indigo-50/40 relative overflow-hidden">
            <span className="text-xs font-black text-indigo-800 uppercase tracking-widest block flex items-center justify-between">
              <span>Disbursed</span>
              <DollarSign className="w-4 h-4 text-indigo-600" />
            </span>
            <div className="text-3xl font-black text-indigo-700 mt-2">{metrics.disbursedCount}</div>
          </div>

          <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl col-span-2 lg:col-span-1 relative overflow-hidden border border-slate-800">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block flex items-center justify-between">
              <span>Total Volume</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2 tracking-tight">₹{metrics.totalDisbursedVolume?.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Stage Filter Buttons */}
          <div className="flex overflow-x-auto gap-1.5 text-xs font-extrabold">
            {[
              { id: 'ALL', label: 'All Applications' },
              { id: 'UNDER_ADMIN_REVIEW', label: 'Pending Review' },
              { id: 'SELFIE_APPROVED', label: 'Approved' },
              { id: 'DISBURSED', label: 'Disbursed' },
              { id: 'SELFIE_REJECTED', label: 'Rejected' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStageFilter(tab.id)}
                className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  stageFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search applicant or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Applications Data Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Loading applications table...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="font-bold text-sm text-slate-700">No applications found matching filter criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-500 uppercase font-black tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-5">Application ID</th>
                    <th className="py-4 px-5">Applicant</th>
                    <th className="py-4 px-5">Sanction Amount</th>
                    <th className="py-4 px-5">Tenure & EMI</th>
                    <th className="py-4 px-5">CIBIL & DTI</th>
                    <th className="py-4 px-5">Current Stage</th>
                    <th className="py-4 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {applications.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-5 font-mono font-extrabold text-slate-900">
                        {app.applicationNumber}
                      </td>

                      <td className="py-4 px-5">
                        <div className="font-black text-slate-900">{app.user?.fullName || 'N/A'}</div>
                        <div className="text-slate-500 text-[11px] font-medium">{app.user?.email}</div>
                      </td>

                      <td className="py-4 px-5 font-black text-slate-900 text-sm">
                        ₹{app.selectedTerms?.amount?.toLocaleString('en-IN') || app.financials?.requestedAmount?.toLocaleString('en-IN') || 0}
                      </td>

                      <td className="py-4 px-5">
                        {app.selectedTerms?.monthlyEmi ? (
                          <div>
                            <span className="font-black text-emerald-700">₹{app.selectedTerms.monthlyEmi?.toLocaleString('en-IN')}/m</span>
                            <span className="text-slate-400 text-[11px] font-semibold block">{app.selectedTerms.tenureMonths} Months</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">Pending</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        {app.eligibility?.status ? (
                          <div>
                            <span className="font-extrabold text-slate-900">Score: {app.financials?.cibilScore || 'N/A'}</span>
                            <span className="text-slate-500 text-[11px] font-semibold block">DTI: {app.eligibility?.dtiRatio}%</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">Unevaluated</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black ${
                          app.currentStage === 'UNDER_ADMIN_REVIEW'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : app.currentStage === 'SELFIE_APPROVED'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : app.currentStage === 'DISBURSED'
                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                            : app.currentStage === 'SELFIE_REJECTED'
                            ? 'bg-red-100 text-red-900 border border-red-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {app.currentStage}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handleOpenReview(app._id)}
                          className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition-all inline-flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* 360-Degree Modal Drawer */}
      {selectedAppData && (
        <AdminAppViewerModal
          appData={selectedAppData}
          onClose={() => { setSelectedAppId(null); setSelectedAppData(null); }}
          onRefresh={handleRefreshModal}
        />
      )}
    </div>
  );
}
