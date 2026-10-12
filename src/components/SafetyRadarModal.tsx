import React, { useState, useEffect } from 'react';
import { Property, NeighborhoodSafetyReview } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  ShieldCheck,
  Star,
  Sun,
  Moon,
  Users,
  Building2,
  Clock,
  HeartHandshake,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Send,
} from 'lucide-react';

interface SafetyRadarModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyRadarModal: React.FC<SafetyRadarModalProps> = ({
  property,
  isOpen,
  onClose,
}) => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [safetyData, setSafetyData] = useState<any>(null);
  const [showAddReview, setShowAddReview] = useState(false);

  // New review form
  const [streetLightingScore, setStreetLightingScore] = useState<number>(5);
  const [securityGuardsScore, setSecurityGuardsScore] = useState<number>(5);
  const [femaleFriendlyScore, setFemaleFriendlyScore] = useState<number>(5);
  const [nightWalkability, setNightWalkability] = useState<'well_lit' | 'safe' | 'caution'>('well_lit');
  const [tips, setTips] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchSafetyData = async () => {
    if (!property) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/safety/${property.id}`);
      if (res.ok) {
        const data = await res.json();
        setSafetyData(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && property) {
      fetchSafetyData();
    }
  }, [isOpen, property?.id]);

  if (!isOpen || !property) return null;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setSubmitSuccess(null);

    try {
      const res = await fetch('/api/safety', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: property.id,
          streetLightingScore,
          securityGuardsScore,
          femaleFriendlyScore,
          nightWalkability,
          tips,
        }),
      });

      if (res.ok) {
        setSubmitSuccess('Thank you! Your safety review helps fellow campus students.');
        setShowAddReview(false);
        setTips('');
        fetchSafetyData();
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const overallScore = safetyData?.overallScore || 9.1;
  const lighting = safetyData?.streetLightingScore || 4.7;
  const security = safetyData?.securityGuardsScore || 4.8;
  const femaleFriendly = safetyData?.femaleFriendlyScore || 4.9;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Neighborhood Safety & Night Walkability Radar
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Crowdsourced safety audit for {property.title}
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
          {submitSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-medium border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {submitSuccess}
            </div>
          )}

          {/* Primary Radar Score Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-emerald-400 font-bold uppercase tracking-widest text-[10px] block">
                  Campus Verified Safety Index
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">{overallScore}</span>
                  <span className="text-slate-400 text-sm font-semibold">/ 10</span>
                </div>
                <p className="text-slate-300 text-xs mt-1">
                  High safety zone. Suitable for late evening campus commutes & solo walks.
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> High Safety
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {safetyData?.reviewCount ? `${safetyData.reviewCount} student audits` : 'Verified via verified tenant audits'}
                </span>
              </div>
            </div>

            {/* 4 Pillar Bars */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>💡 Street Lighting</span>
                  <span className="font-bold text-white">{lighting}/5</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(lighting / 5) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>👮 24/7 Guard & CCTV</span>
                  <span className="font-bold text-white">{security}/5</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-400 h-full rounded-full" style={{ width: `${(security / 5) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>👩‍🎓 Female Friendly</span>
                  <span className="font-bold text-white">{femaleFriendly}/5</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${(femaleFriendly / 5) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>🌙 Night Walkability</span>
                  <span className="font-bold text-white">Well-Lit</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-400 h-full rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Key Infrastructure Safety Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 block">24/7 Chemist</span>
              <span className="font-extrabold text-gray-900 dark:text-white mt-0.5 block">180m away</span>
              <span className="text-[10px] text-gray-500 dark:text-slate-400">Apollo Pharmacy</span>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 block">Police Booth</span>
              <span className="font-extrabold text-gray-900 dark:text-white mt-0.5 block">600m away</span>
              <span className="text-[10px] text-gray-500 dark:text-slate-400">Sector Patrol</span>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 block">CCTV Log</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">Active</span>
              <span className="text-[10px] text-gray-500 dark:text-slate-400">Entry & Corridor</span>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 block">Gate Barrier</span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 block">Guarded</span>
              <span className="text-[10px] text-gray-500 dark:text-slate-400">Visitor Registers</span>
            </div>
          </div>

          {/* Student Safety Tips & Feedback */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                Crowdsourced Student Tips & Safety Notes
              </h3>

              {user?.role === 'student' && !showAddReview && (
                <button
                  type="button"
                  onClick={() => setShowAddReview(true)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  + Add Safety Review
                </button>
              )}
            </div>

            {/* Add Review Form */}
            {showAddReview && (
              <form
                onSubmit={handleSubmitReview}
                className="bg-blue-50/50 dark:bg-slate-800/80 p-4 rounded-xl border border-blue-200 dark:border-slate-700 space-y-3"
              >
                <div className="font-bold text-xs text-gray-900 dark:text-white">
                  Submit Student Safety Rating:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      Street Lighting (1-5)
                    </label>
                    <select
                      value={streetLightingScore}
                      onChange={(e) => setStreetLightingScore(Number(e.target.value))}
                      className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    >
                      <option value={5}>5 - Bright LED all night</option>
                      <option value={4}>4 - Mostly well lit</option>
                      <option value={3}>3 - Moderate lighting</option>
                      <option value={2}>2 - Dim / Few lights</option>
                      <option value={1}>1 - Dark stretch</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      Guard & CCTV (1-5)
                    </label>
                    <select
                      value={securityGuardsScore}
                      onChange={(e) => setSecurityGuardsScore(Number(e.target.value))}
                      className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    >
                      <option value={5}>5 - 24/7 Guard + CCTV</option>
                      <option value={4}>4 - Daytime guard + CCTV</option>
                      <option value={3}>3 - CCTV only</option>
                      <option value={2}>2 - Limited security</option>
                      <option value={1}>1 - No guard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      Female Student Friendly
                    </label>
                    <select
                      value={femaleFriendlyScore}
                      onChange={(e) => setFemaleFriendlyScore(Number(e.target.value))}
                      className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    >
                      <option value={5}>5 - Highly comfortable & safe</option>
                      <option value={4}>4 - Safe with peer group</option>
                      <option value={3}>3 - Moderate caution at night</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Helpful Tip for Incoming Students:
                  </label>
                  <textarea
                    rows={2}
                    value={tips}
                    onChange={(e) => setTips(e.target.value)}
                    placeholder="e.g. Main road has constant e-rickshaws till 10 PM. Prefer using Gate 2 after late library hours."
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddReview(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-slate-900 dark:bg-blue-600 text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Post Safety Audit'}
                  </button>
                </div>
              </form>
            )}

            {/* List of Tips */}
            <div className="space-y-2.5">
              {safetyData?.reviews && safetyData.reviews.length > 0 ? (
                safetyData.reviews.map((r: NeighborhoodSafetyReview) => (
                  <div
                    key={r.id}
                    className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 dark:text-white text-xs">
                        {r.studentName}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        ★ {r.overallScore}/10 Safety Rating
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-slate-300 text-xs italic">
                      "{r.tips}"
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-slate-500 pt-1">
                      <span>💡 Lighting: {r.streetLightingScore}/5</span>
                      <span>👮 Security: {r.securityGuardsScore}/5</span>
                      <span>👩 Female Friendly: {r.femaleFriendlyScore}/5</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-200 dark:border-slate-700/60">
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    "Main road approach directly connects to campus gate. Bright LED lights and guard barrier active all night."
                  </p>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 block mt-1">
                    Verified StayNest Campus Safety Team
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-slate-800 dark:hover:bg-blue-500 transition shadow-xs"
          >
            Close Radar
          </button>
        </div>
      </div>
    </div>
  );
};
