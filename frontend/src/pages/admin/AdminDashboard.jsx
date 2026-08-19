import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import AdminAppViewerModal from '../../components/AdminAppViewerModal';
import api from '../../services/api';
import { ShieldCheck, Search, Filter, Eye, CheckCircle2, Clock, XCircle, DollarSign, RefreshCw, FileText } from 'lucide-react';

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
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-purple-100 text-purple-800 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900">Admin Verification Portal</h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">Audit customer applications, verify selfies, and execute disbursement.</p>
          </div>

          <button
            onClick={fetchApplications}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-2xs text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Dashboard</span>
          </button>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Applications</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{metrics.totalApplications}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm bg-amber-50/30">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending Review</span>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">{metrics.pendingReviewCount}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/30">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Approved</span>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">{metrics.approvedCount}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm bg-indigo-50/30">
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Disbursed</span>
            <div className="text-2xl font-extrabold text-indigo-700 mt-1">{metrics.disbursedCount}</div>
          </div>

          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md col-span-2 lg:col-span-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Disbursed Volume</span>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">₹{metrics.totalDisbursedVolume?.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Stage Filter Buttons */}
          <div className="flex overflow-x-auto gap-1.5 text-xs font-bold">
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
                className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                  stageFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search applicant or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Applications Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading applications table...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-sm">No applications found matching filter criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Application ID</th>
                    <th className="py-3.5 px-4">Applicant</th>
                    <th className="py-3.5 px-4">Sanction Amount</th>
                    <th className="py-3.5 px-4">Tenure & EMI</th>
                    <th className="py-3.5 px-4">CIBIL & DTI</th>
                    <th className="py-3.5 px-4">Current Stage</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {applications.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">
                        {app.applicationNumber}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{app.user?.fullName || 'N/A'}</div>
                        <div className="text-slate-500 text-[11px]">{app.user?.email}</div>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-900">
                        ₹{app.selectedTerms?.amount?.toLocaleString('en-IN') || app.financials?.requestedAmount?.toLocaleString('en-IN') || 0}
                      </td>

                      <td className="py-4 px-4">
                        {app.selectedTerms?.monthlyEmi ? (
                          <div>
                            <span className="font-bold text-emerald-700">₹{app.selectedTerms.monthlyEmi?.toLocaleString('en-IN')}/m</span>
                            <span className="text-slate-400 text-[11px] block">{app.selectedTerms.tenureMonths} Months</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Pending</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {app.eligibility?.status ? (
                          <div>
                            <span className="font-bold text-slate-900">Score: {app.financials?.cibilScore || 'N/A'}</span>
                            <span className="text-slate-500 text-[11px] block">DTI: {app.eligibility?.dtiRatio}%</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Unevaluated</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                          app.currentStage === 'UNDER_ADMIN_REVIEW'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : app.currentStage === 'SELFIE_APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : app.currentStage === 'DISBURSED'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : app.currentStage === 'SELFIE_REJECTED'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {app.currentStage}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleOpenReview(app._id)}
                          className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-all inline-flex items-center space-x-1.5"
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
