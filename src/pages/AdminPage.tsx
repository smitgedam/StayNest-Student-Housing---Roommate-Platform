import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  Trash2,
  Sparkles,
  Building,
  Utensils,
  Users,
  ArrowRight,
  Database,
  HardDrive,
  RefreshCw,
  Check,
  Copy,
  Terminal,
  Layers,
  Server,
  AlertTriangle,
} from 'lucide-react';

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

interface MongoDbStatus {
  isConnected: boolean;
  readyState: number;
  uriConfigured: boolean;
  dbName: string | null;
  host: string | null;
  mode: 'mongodb' | 'local_store';
  lastError: string | null;
  counts: {
    users: number;
    properties: number;
    messProviders: number;
    bookingRequests: number;
    reviews: number;
    messages: number;
    reports: number;
    maintenanceTickets: number;
    expenses: number;
    mealVotes: number;
    safetyReviews: number;
  };
}

export const AdminPage: React.FC<{ initialSubTab?: 'verifications' | 'reports' | 'test_roles' | 'database' }> = ({
  initialSubTab = 'verifications',
}) => {
  const { token, user, switchDemoAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<'verifications' | 'reports' | 'test_roles' | 'database'>(initialSubTab);
  const [verificationFilter, setVerificationFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const [verifications, setVerifications] = useState<OwnerVerificationItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  // MongoDB status & connection state
  const [dbStatus, setDbStatus] = useState<MongoDbStatus | null>(null);
  const [customMongoUri, setCustomMongoUri] = useState('');
  const [isConnectingDb, setIsConnectingDb] = useState(false);
  const [dbConnectMessage, setDbConnectMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSeedingDb, setIsSeedingDb] = useState(false);
  const [copiedSampleUri, setCopiedSampleUri] = useState(false);
  const [copiedWhitelistIp, setCopiedWhitelistIp] = useState(false);

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

  const fetchDbStatus = async () => {
    try {
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchDbStatus();
  }, [token]);

  const handleConnectMongo = async () => {
    if (!customMongoUri.trim()) return;
    setIsConnectingDb(true);
    setDbConnectMessage(null);
    try {
      const res = await fetch('/api/db/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: customMongoUri.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDbConnectMessage({ type: 'success', text: data.message || 'Connected to MongoDB successfully!' });
        fetchDbStatus();
        fetchAdminData();
      } else {
        setDbConnectMessage({ type: 'error', text: data.message || 'Failed to connect to MongoDB.' });
      }
    } catch (e: any) {
      setDbConnectMessage({ type: 'error', text: e.message || 'Network error connecting to MongoDB.' });
    } finally {
      setIsConnectingDb(false);
    }
  };

  const handleSeedMongo = async () => {
    setIsSeedingDb(true);
    setDbConnectMessage(null);
    try {
      const res = await fetch('/api/db/seed', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setDbConnectMessage({ type: 'success', text: data.message || 'Initial records seeded into MongoDB.' });
        fetchDbStatus();
      } else {
        setDbConnectMessage({ type: 'error', text: data.error || 'Seeding failed.' });
      }
    } catch (e: any) {
      setDbConnectMessage({ type: 'error', text: e.message || 'Network error seeding database.' });
    } finally {
      setIsSeedingDb(false);
    }
  };

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
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Admin Moderation & Trust Center
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            Audit owner property deeds & government IDs, approve publishing rights, and mediate listing reports.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('verifications')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'verifications'
                ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Verification Queue {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'reports'
                ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Reports ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('test_roles')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'test_roles'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Quick Test Roles
          </button>
          <button
            onClick={() => {
              setActiveTab('database');
              fetchDbStatus();
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'database'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            Database & MongoDB
            {dbStatus?.isConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" title="Connected to MongoDB" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'verifications' && (
        <div className="space-y-4">
          {/* Sub-tabs: Pending, Approved, Rejected */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVerificationFilter('pending')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                verificationFilter === 'pending'
                  ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setVerificationFilter('approved')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                verificationFilter === 'approved'
                  ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setVerificationFilter('rejected')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                verificationFilter === 'rejected'
                  ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              Rejected
            </button>
          </div>

          {/* Yellow Banner matching Wireframe Page 12 */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs px-4 py-2 rounded-xl">
            Approve sets <code className="font-bold">isVerified = true</code>, which immediately unlocks property listing publishing for that owner.
          </div>

          {/* Verifications List */}
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-500 dark:text-slate-400">Loading verification submissions...</div>
          ) : filteredVerifications.length === 0 ? (
            <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">No {verificationFilter} owner verifications.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVerifications.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-gray-200 dark:border-slate-700">
                      <FileText className="w-6 h-6 text-gray-400 dark:text-slate-400" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            item.verificationStatus === 'approved'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : item.verificationStatus === 'rejected'
                              ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {item.verificationStatus}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        {item.email} | submitted {new Date(item.submittedAt).toLocaleDateString()} | property proof + ID
                      </p>

                      {item.verificationRejectReason && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Reject note: {item.verificationRejectReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.verificationDocUrl && (
                      <button
                        onClick={() => setViewingDocUrl(item.verificationDocUrl!)}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View document
                      </button>
                    )}

                    {item.verificationStatus !== 'approved' && (
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="px-3.5 py-1.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-xs transition"
                      >
                        Approve
                      </button>
                    )}

                    {item.verificationStatus !== 'rejected' && (
                      <button
                        onClick={() => setRejectingOwnerId(item.id)}
                        className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 text-xs font-semibold rounded-lg transition"
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
      )}

      {/* Tab 2: Reports Queue */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs px-4 py-2 rounded-xl">
            Live student reports on listings (Fake listings, wrong pricing, already rented). Administrators can audit or take down listings.
          </div>

          {reports.length === 0 ? (
            <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">No active listing reports.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white text-sm">
                          {rep.propertyTitle} (₹{rep.propertyRent}/mo)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300">
                          {rep.reason}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Owner: {rep.ownerName} • Reported by: {rep.reporterName} • Status: {rep.propertyStatus}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        rep.status === 'resolved' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800">
                    <span className="font-bold">Student report details: </span>
                    {rep.details}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleResolveReport(rep.id, 'dismiss')}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold rounded-lg"
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

      {/* Tab 3: Quick Test Roles Tab */}
      {activeTab === 'test_roles' && (
        <div className="space-y-5">
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 text-xs p-4 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-blue-950 dark:text-blue-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Admin Role Switcher & Persona Tester
              </h3>
              <p className="text-xs text-blue-800 dark:text-blue-300 mt-0.5">
                This tab is strictly available to Administrators to test user flows, RBAC restrictions, and real-time behavior.
              </p>
            </div>
            <span className="text-[11px] font-mono bg-blue-100 dark:bg-blue-900 px-2.5 py-1 rounded-md font-bold text-blue-800 dark:text-blue-200">
              Active: {user?.role} ({user?.name})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Role */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <Users className="w-3.5 h-3.5" /> Student Persona
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-mono">rahul@college.edu</span>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base">Rahul Sharma</h4>
                <p className="text-xs text-gray-600 dark:text-slate-300">
                  Tests the student flow: browse verified listings, search radius on interactive Leaflet map, apply amenity filters, send booking requests, calculate roommate compatibility, and post verified resident reviews.
                </p>
              </div>
              <button
                onClick={() => switchDemoAccount('rahul@college.edu')}
                className="w-full py-2 bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5"
              >
                Switch to Student <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Verified Owner Role */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <Building className="w-3.5 h-3.5" /> Verified Owner
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-mono">vikram@staynest.com</span>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base">Vikram Malhotra</h4>
                <p className="text-xs text-gray-600 dark:text-slate-300">
                  Tests verified property owner features: publish new listings with map picker, 1-tap live availability toggle (AVAILABLE ↔ RENTED), stale-listing confirmation, and booking request acceptance.
                </p>
              </div>
              <button
                onClick={() => switchDemoAccount('vikram@staynest.com')}
                className="w-full py-2 bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5"
              >
                Switch to Verified Owner <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Unverified Owner Role */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    <ShieldAlert className="w-3.5 h-3.5" /> Unverified Owner
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-mono">suresh@staynest.com</span>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base">Suresh Raina</h4>
                <p className="text-xs text-gray-600 dark:text-slate-300">
                  Tests anti-fraud verification gate: publishing is strictly blocked until an admin verifies property proof & ID. Uploads documents to the admin queue.
                </p>
              </div>
              <button
                onClick={() => switchDemoAccount('suresh@staynest.com')}
                className="w-full py-2 bg-slate-900 dark:bg-amber-600 hover:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5"
              >
                Switch to Unverified Owner <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mess Provider Role */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <Utensils className="w-3.5 h-3.5" /> Mess Provider
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-mono">annapurna@staynest.com</span>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base">Annapurna Tiffin</h4>
                <p className="text-xs text-gray-600 dark:text-slate-300">
                  Tests food services: create and manage daily meal plans, configure delivery radius (km), kitchen map pin, trial meals, and chat with interested student tenants.
                </p>
              </div>
              <button
                onClick={() => switchDemoAccount('annapurna@staynest.com')}
                className="w-full py-2 bg-slate-900 dark:bg-purple-600 hover:bg-purple-600 dark:hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5"
              >
                Switch to Mess Provider <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    dbStatus?.isConnected
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                      : 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-gray-900 dark:text-white">
                      Active Backend Database Engine
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        dbStatus?.isConnected
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                          : 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          dbStatus?.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
                        }`}
                      />
                      {dbStatus?.isConnected ? 'MongoDB (Live Connected)' : 'Local File Store (Fallback Ready)'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {dbStatus?.isConnected
                      ? `Connected to MongoDB database "${dbStatus.dbName || 'staynest'}" via Mongoose ODM.`
                      : 'Running in Local Fast Store mode. Any operations write to persistent local storage with seamless sync.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchDbStatus}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
                </button>
                {dbStatus?.isConnected && (
                  <button
                    type="button"
                    onClick={handleSeedMongo}
                    disabled={isSeedingDb}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {isSeedingDb ? 'Seeding...' : 'Seed Sample Records'}
                  </button>
                )}
              </div>
            </div>

            {/* Diagnostics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-200 dark:border-slate-800">
                <span className="text-gray-500 dark:text-slate-400 block text-[11px]">Database Name</span>
                <span className="font-bold text-gray-900 dark:text-white font-mono">
                  {dbStatus?.dbName || (dbStatus?.isConnected ? 'staynest' : 'data_store.json')}
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-200 dark:border-slate-800">
                <span className="text-gray-500 dark:text-slate-400 block text-[11px]">Database Host</span>
                <span className="font-bold text-gray-900 dark:text-white font-mono truncate block" title={dbStatus?.host || 'localhost'}>
                  {dbStatus?.host || (dbStatus?.isConnected ? 'cluster0.mongodb.net' : 'Local Disk')}
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-200 dark:border-slate-800">
                <span className="text-gray-500 dark:text-slate-400 block text-[11px]">Driver / ORM</span>
                <span className="font-bold text-gray-900 dark:text-white font-mono">
                  Mongoose 8.x + Native GeoJSON
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-200 dark:border-slate-800">
                <span className="text-gray-500 dark:text-slate-400 block text-[11px]">ENV Configured</span>
                <span className="font-bold text-gray-900 dark:text-white font-mono">
                  {dbStatus?.uriConfigured ? 'Yes (MONGODB_URI)' : 'No (Local Mode)'}
                </span>
              </div>
            </div>

            {/* Last error notice if any */}
            {dbStatus?.lastError && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">MongoDB Atlas Network Access Notice:</span>
                    <span className="text-[11px] text-amber-800 dark:text-amber-300">{dbStatus.lastError}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('0.0.0.0/0');
                      setCopiedWhitelistIp(true);
                      setTimeout(() => setCopiedWhitelistIp(false), 2000);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex items-center gap-1 shadow-2xs transition"
                  >
                    {copiedWhitelistIp ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                    {copiedWhitelistIp ? 'Copied 0.0.0.0/0' : 'Copy 0.0.0.0/0'}
                  </button>
                  <a
                    href="https://cloud.mongodb.com/v2"
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-amber-100 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-lg flex items-center gap-1 transition"
                  >
                    <ExternalLink className="w-3 h-3" /> Atlas Console
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Collection Metrics */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Live Entity Counts in Database ({dbStatus?.mode === 'mongodb' ? 'MongoDB Collections' : 'Store Records'})
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { label: 'Properties', count: dbStatus?.counts?.properties ?? 0, icon: Building },
                { label: 'Users', count: dbStatus?.counts?.users ?? 0, icon: Users },
                { label: 'Mess Providers', count: dbStatus?.counts?.messProviders ?? 0, icon: Utensils },
                { label: 'Bookings', count: dbStatus?.counts?.bookingRequests ?? 0, icon: FileText },
                { label: 'Reviews', count: dbStatus?.counts?.reviews ?? 0, icon: CheckCircle2 },
                { label: 'Maintenance', count: dbStatus?.counts?.maintenanceTickets ?? 0, icon: HardDrive },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.label}
                    className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center gap-2.5"
                  >
                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-500 dark:text-slate-400 block">{c.label}</span>
                      <span className="text-sm font-black text-gray-900 dark:text-white">{c.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connect / Change MongoDB URI Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Connect Your MongoDB Database
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Enter your MongoDB Atlas cluster connection string or a local MongoDB URI below. The backend will test connection, initialize Mongoose schemas, and sync all models.
              </p>
            </div>

            {dbConnectMessage && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  dbConnectMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
                }`}
              >
                {dbConnectMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{dbConnectMessage.text}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  MongoDB Connection URI
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Terminal className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={customMongoUri}
                      onChange={(e) => setCustomMongoUri(e.target.value)}
                      placeholder="mongodb+srv://<username>:<password>@cluster0.mongodb.net/staynest?retryWrites=true&w=majority"
                      className="w-full text-xs font-mono rounded-xl border border-gray-300 dark:border-slate-700 pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleConnectMongo}
                    disabled={isConnectingDb || !customMongoUri.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {isConnectingDb ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Database className="w-3.5 h-3.5" />
                    )}
                    <span>{isConnectingDb ? 'Connecting...' : 'Connect & Sync'}</span>
                  </button>
                </div>
              </div>

              {/* Quick instructions / Help */}
              <div className="p-3.5 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-xs text-gray-900 dark:text-white block">
                  Quick MongoDB Atlas Setup (Free Tier):
                </span>
                <ol className="text-xs text-gray-600 dark:text-slate-300 space-y-1 list-decimal list-inside">
                  <li>
                    Create a free M0 cluster on{' '}
                    <a
                      href="https://www.mongodb.com/cloud/atlas/register"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      MongoDB Atlas
                    </a>.
                  </li>
                  <li>
                    In <strong>Network Access</strong>, add IP Address <code className="bg-gray-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">0.0.0.0/0</code> (Allow Access from Anywhere).
                  </li>
                  <li>
                    In <strong>Database Access</strong>, create a database user (e.g. username and secure password).
                  </li>
                  <li>
                    Click <strong>Connect  Drivers (Node.js)</strong> and copy the connection string.
                  </li>
                  <li>
                    Paste your string above with your user and password, then click <strong>Connect & Sync</strong>.
                  </li>
                </ol>

                <div className="pt-2 flex items-center justify-between border-t border-gray-200 dark:border-slate-700">
                  <span className="text-[11px] text-gray-500 dark:text-slate-400 font-mono">
                    Format: mongodb+srv://username:password@cluster.mongodb.net/staynest
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('mongodb+srv://<username>:<password>@cluster0.mongodb.net/staynest?retryWrites=true&w=majority');
                      setCopiedSampleUri(true);
                      setTimeout(() => setCopiedSampleUri(false), 2000);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    {copiedSampleUri ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSampleUri ? 'Copied Template' : 'Copy Sample Template'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Dialog */}
      {rejectingOwnerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Reject reason (sent to owner)</h3>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              placeholder="Explain what was missing in the uploaded property documents..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectingOwnerId(null)}
                className="px-3.5 py-1.5 text-xs text-gray-600 dark:text-slate-300 border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-3 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">Submitted Property Proof & ID Document</h4>
              <button onClick={() => setViewingDocUrl(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-lg border border-gray-200 dark:border-slate-700">
              <img src={viewingDocUrl} alt="Verification Document" className="w-full object-contain" />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setViewingDocUrl(null)}
                className="px-4 py-1.5 text-xs bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 text-white rounded-lg font-bold"
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
