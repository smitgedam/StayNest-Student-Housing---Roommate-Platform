import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, X } from 'lucide-react';

interface ReportModalProps {
  propertyId: string;
  propertyTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  propertyId,
  propertyTitle,
  isOpen,
  onClose,
}) => {
  const { token } = useAuth();
  const [reason, setReason] = useState<string>('Fake listing');
  const [details, setDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMessage('Please login to report a listing.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId,
          reason,
          details,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to submit report');
      } else {
        setSuccessMessage('Report submitted successfully to StayNest moderation team.');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch {
      setErrorMessage('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-gray-900 text-lg">Report this listing</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs text-gray-600 mb-4">
            Listing: <span className="font-semibold text-gray-900">{propertyTitle}</span>
          </p>

          {successMessage ? (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-sm font-medium text-center">
              {successMessage}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Fake listing">Fake listing</option>
                  <option value="Already rented">Already rented</option>
                  <option value="Wrong details">Wrong details</option>
                  <option value="Abusive owner">Abusive owner</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Details</label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="What is wrong with this listing?"
                  className="w-full text-sm rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] p-2 rounded">
                Reports are audited by StayNest administrators to guarantee trust & safety.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
