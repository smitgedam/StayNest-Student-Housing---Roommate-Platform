import React, { useState, useEffect } from 'react';
import { MaintenanceTicket } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Wifi,
  Droplets,
  Hammer,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPropertyId?: string;
  defaultPropertyTitle?: string;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  onClose,
  defaultPropertyId,
  defaultPropertyTitle,
}) => {
  const { user, token } = useAuth();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form State
  const [category, setCategory] = useState<'plumbing' | 'electrical' | 'wifi' | 'appliance' | 'carpentry' | 'other'>('plumbing');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [roomNo, setRoomNo] = useState('Room 204');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/maintenance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTickets();
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !title || !description) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: defaultPropertyId,
          propertyTitle: defaultPropertyTitle || 'Campus Student Housing',
          roomNo,
          category,
          priority,
          title,
          description,
        }),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setTitle('');
        setDescription('');
        fetchTickets();
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string, notes?: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/maintenance/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          resolutionNotes: notes,
        }),
      });
      if (res.ok) {
        fetchTickets();
      }
    } catch {
      // ignore
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'plumbing': return <Droplets className="w-4 h-4 text-blue-500" />;
      case 'electrical': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'wifi': return <Wifi className="w-4 h-4 text-sky-500" />;
      case 'carpentry': return <Hammer className="w-4 h-4 text-amber-600" />;
      default: return <Wrench className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (pri: string) => {
    switch (pri) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-bold';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'resolved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold';
      case 'in_progress': return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Student Maintenance & Issue Ticket Tracker
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Fast resolution for plumbing, electricity, Wi-Fi & appliances
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Action Row */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                Maintenance Requests ({tickets.length})
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                Average technician dispatch time: 4 hours
              </p>
            </div>

            {!showCreateForm && user?.role === 'student' && (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="px-3.5 py-1.5 bg-slate-900 dark:bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-slate-800 dark:hover:bg-blue-500 transition shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Raise Issue Ticket
              </button>
            )}
          </div>

          {/* Create Ticket Form */}
          {showCreateForm && (
            <form
              onSubmit={handleCreateTicket}
              className="bg-gray-50 dark:bg-slate-800/80 p-4 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3"
            >
              <div className="font-bold text-xs text-gray-900 dark:text-white">
                Report Accommodation Issue:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Issue Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  >
                    <option value="plumbing">🚰 Plumbing & Water</option>
                    <option value="electrical">⚡ Electrical & Lights</option>
                    <option value="wifi">📶 Wi-Fi & Internet</option>
                    <option value="appliance">❄️ AC / Geyser / Appliance</option>
                    <option value="carpentry">🪑 Furniture & Carpentry</option>
                    <option value="other">📦 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-semibold"
                  >
                    <option value="low">Low - Routine</option>
                    <option value="medium">Medium - Standard</option>
                    <option value="high">High - Same day needed</option>
                    <option value="urgent">Urgent - Water leak / Blackout</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Room / Flat No.
                  </label>
                  <input
                    type="text"
                    value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                    placeholder="e.g. Room 204"
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Issue Summary
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Leaking washroom tap, Wi-Fi router restarting"
                  className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Detailed Description & Preferred Visit Time
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue clearly. Mention if technician can visit in morning or evening."
                  className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-slate-900 dark:bg-blue-600 text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          )}

          {/* Tickets List */}
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-500">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-200 dark:border-slate-700">
              <p className="font-semibold text-gray-700 dark:text-slate-300">No active maintenance tickets.</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                Everything is working in good order!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="p-4 bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700/80 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 shrink-0 mt-0.5">
                        {getCategoryIcon(t.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                            {t.title}
                          </h4>
                          <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${getPriorityBadge(t.priority)}`}>
                            {t.priority}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          {t.propertyTitle} • {t.roomNo} • Raised by {t.studentName || 'Student'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusBadge(t.status)}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800">
                    {t.description}
                  </p>

                  {/* Technician and Resolution Info */}
                  {t.assignedTechnician && (
                    <div className="flex items-center justify-between text-xs p-2 bg-blue-50/70 dark:bg-blue-950/40 rounded-lg text-blue-800 dark:text-blue-300">
                      <span className="font-semibold flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        Technician: {t.assignedTechnician}
                      </span>
                      {t.resolutionNotes && (
                        <span className="text-[11px] text-blue-700 dark:text-blue-400 italic">
                          {t.resolutionNotes}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Owner Controls */}
                  {user?.role === 'owner' && t.status !== 'resolved' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                      {t.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(t.id, 'in_progress', 'Technician dispatched for site visit.')}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold transition"
                        >
                          Mark In Progress
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(t.id, 'resolved', 'Fixed and verified with tenant.')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition"
                      >
                        Mark Resolved ✓
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-slate-800 dark:hover:bg-blue-500 transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
