import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, UserCheck, CheckCircle2, XCircle, FileText, ExternalLink, Trash2 } from 'lucide-react';

interface OwnerVerificationItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  college?: string;
  isVerified: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'none';
  verificationDocUrl?: string;
  verificationRejectReason?: string;
  submittedAt: string;
}

interface ReportItem {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyRent: number;
  propertyStatus: string;
  ownerName: string;
  reporterName: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

export const AdminPage: React.FC<{ initialSubTab?: 'verifications' | 'reports' }> = ({
  initialSubTab = 'verifications',
}) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'verifications' | 'reports'>(initialSubTab);
  const [verificationFilter, setVerificationFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const [verifications, setVerifications] = useState<OwnerVerificationItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Reject reason dialog
  const [rejectingOwnerId, setRejectingOwnerId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Document unclear or invalid ownership proof.');

  // View document modal
  const [viewingDocUrl, setViewingDocUrl] = useState<string | null>(null);

  const fetchAdminData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [vRes, rRes] = await Promise.all([
        fetch('/api/admin/verifications', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/reports', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (vRes.ok) {
        const vData = await vRes.json();
        setVerifications(vData);
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        setReports(rData);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleApprove = async (ownerId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/verifications/${ownerId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch {
      // ignore
    }
  };

  const handleConfirmReject = async () => {
    if (!token || !rejectingOwnerId) return;
    try {
      const res = await fetch(`/api/admin/verifications/${rejectingOwnerId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        setRejectingOwnerId(null);
        fetchAdminData();
      }
    } catch {
      // ignore
    }
  };

  const handleResolveReport = async (reportId: string, action: 'dismiss' | 'unpublish_listing' | 'delete_listing') => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch {
      // ignore
    }
  };

  const filteredVerifications = verifications.filter((v) => v.verificationStatus === verificationFilter);
  const pendingCount = verifications.filter((v) => v.verificationStatus === 'pending').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Admin Moderation & Trust Center
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Audit owner property deeds & government IDs, approve publishing rights, and mediate listing reports.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('verifications')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'verifications'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Verification Queue {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Reports ({reports.length})
          </button>
        </div>
      </div>

      {activeTab === 'verifications' ? (
        <div className="space-y-4">
          {/* Sub-tabs: Pending, Approved, Rejected */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVerificationFilter('pending')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                verificationFilter === 'pending'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border text-gray-600 hover:bg-gray-50'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setVerificationFilter('approved')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                verificationFilter === 'approved'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border text-gray-600 hover:bg-gray-50'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setVerificationFilter('rejected')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                verificationFilter === 'rejected'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border text-gray-600 hover:bg-gray-50'
              }`}
            >
              Rejected
            </button>
          </div>

          {/* Yellow Banner matching Wireframe Page 12 */}
          <div className="bg-amber-50 border border-amber-300 text-amber-900 text-xs px-4 py-2 rounded-xl">
            Approve sets <code className="font-bold">isVerified = true</code>, which immediately unlocks property listing publishing for that owner.
          </div>

          {/* Verifications List */}
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-500">Loading verification submissions...</div>
          ) : filteredVerifications.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-xl border border-gray-200">
              <p className="text-sm font-semibold text-gray-700">No {verificationFilter} owner verifications.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVerifications.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            item.verificationStatus === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.verificationStatus === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.verificationStatus}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.email} | submitted {new Date(item.submittedAt).toLocaleDateString()} | property proof + ID
                      </p>

                      {item.verificationRejectReason && (
                        <p className="text-xs text-red-600 mt-1">
                          Reject note: {item.verificationRejectReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.verificationDocUrl && (
                      <button
                        onClick={() => setViewingDocUrl(item.verificationDocUrl!)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View document
                      </button>
                    )}

                    {item.verificationStatus !== 'approved' && (
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition"
                      >
                        Approve
                      </button>
                    )}

                    {item.verificationStatus !== 'rejected' && (
                      <button
                        onClick={() => setRejectingOwnerId(item.id)}
                        className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Tab 2: Reports Queue */
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-300 text-amber-900 text-xs px-4 py-2 rounded-xl">
            Live student reports on listings (Fake listings, wrong pricing, already rented). Administrators can audit or take down listings.
          </div>

          {reports.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-xl border border-gray-200">
              <p className="text-sm font-semibold text-gray-700">No active listing reports.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">
                          {rep.propertyTitle} (₹{rep.propertyRent}/mo)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                          {rep.reason}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Owner: {rep.ownerName} • Reported by: {rep.reporterName} • Status: {rep.propertyStatus}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        rep.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="font-bold">Student report details: </span>
                    {rep.details}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleResolveReport(rep.id, 'dismiss')}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
                    >
                      Dismiss report
                    </button>
                    <button
                      onClick={() => handleResolveReport(rep.id, 'unpublish_listing')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg"
                    >
                      Mark listing Rented
                    </button>
                    <button
                      onClick={() => handleResolveReport(rep.id, 'delete_listing')}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove listing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reject Reason Dialog */}
      {rejectingOwnerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Reject reason (sent to owner)</h3>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
              placeholder="Explain what was missing in the uploaded property documents..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectingOwnerId(null)}
                className="px-3.5 py-1.5 text-xs text-gray-600 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {viewingDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-sm text-gray-900">Submitted Property Proof & ID Document</h4>
              <button onClick={() => setViewingDocUrl(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-lg border border-gray-200">
              <img src={viewingDocUrl} alt="Verification Document" className="w-full object-contain" />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setViewingDocUrl(null)}
                className="px-4 py-1.5 text-xs bg-slate-900 text-white rounded-lg font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
