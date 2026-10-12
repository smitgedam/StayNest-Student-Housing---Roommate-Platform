import React, { useState } from 'react';
import { RoommateCandidate } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  DollarSign,
  Calculator,
  Moon,
  BookOpen,
  Utensils,
  Tag,
  GraduationCap,
} from 'lucide-react';

interface RoommateBreakdownModalProps {
  candidate: RoommateCandidate | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (userId: string) => void;
}

export const RoommateBreakdownModal: React.FC<RoommateBreakdownModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onOpenChat,
}) => {
  const { user } = useAuth();
  const [flatRentEstimate, setFlatRentEstimate] = useState<number>(18000);

  if (!isOpen || !candidate) return null;

  const myInterests = user?.roommatePrefs?.interests || [];
  const candidateInterests = candidate.roommatePrefs.interests || [];

  const perPersonShare = Math.round(flatRentEstimate / 2);

  const breakdown = candidate.breakdown || {
    lifestyle: 90,
    study: 85,
    habits: 88,
    interests: 82,
    budget: 95,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  {candidate.name}
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full font-bold">
                  {candidate.compatibility}% Match
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {candidate.college || 'College Student'}
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
          {/* Match Reasons Highlight Card */}
          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200 text-xs">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Why You & {candidate.name.split(' ')[0]} are Compatible:
            </div>
            <ul className="space-y-1.5 pt-1 text-xs text-emerald-800 dark:text-emerald-300">
              {candidate.matchReasons && candidate.matchReasons.length > 0 ? (
                candidate.matchReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Compatible sleep patterns & study environment expectations</span>
                </li>
              )}
            </ul>
          </div>

          {/* 5-Vector Compatibility Breakdown */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-xs">
              Algorithmic Compatibility Breakdown:
            </h3>

            <div className="space-y-2 bg-gray-50 dark:bg-slate-800/60 p-4 rounded-xl border border-gray-200 dark:border-slate-700/80">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-slate-300 font-medium">🌙 Lifestyle & Sleep Synchronization</span>
                  <span className="font-bold text-gray-900 dark:text-white font-mono">{breakdown.lifestyle}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${breakdown.lifestyle}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-slate-300 font-medium">📚 Study & Living Atmosphere</span>
                  <span className="font-bold text-gray-900 dark:text-white font-mono">{breakdown.study}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${breakdown.study}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-slate-300 font-medium">🥗 Habits, Kitchen & Diet</span>
                  <span className="font-bold text-gray-900 dark:text-white font-mono">{breakdown.habits}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${breakdown.habits}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-slate-300 font-medium">✨ Mutual Interests & Hobbies</span>
                  <span className="font-bold text-gray-900 dark:text-white font-mono">{breakdown.interests}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${breakdown.interests}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-slate-300 font-medium">💰 Budget Compatibility</span>
                  <span className="font-bold text-gray-900 dark:text-white font-mono">{breakdown.budget}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full" style={{ width: `${breakdown.budget}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Interests Cloud */}
          {candidateInterests.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-xs">
                Candidate Interests & Hobbies:
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {candidateInterests.map((interest) => {
                  const isShared = myInterests.includes(interest);
                  return (
                    <span
                      key={interest}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isShared
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                          : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {isShared && '✨ '} {interest}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shared 2BHK Rent Split Calculator */}
          <div className="p-4 bg-blue-50/50 dark:bg-slate-800/80 rounded-xl border border-blue-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 dark:text-white text-xs flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-blue-600" />
                2BHK Flat Share Calculator
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">50-50 Split</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-[10px] text-gray-500 dark:text-slate-400 mb-1">
                  Estimated 2BHK Flat Rent (₹)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={flatRentEstimate}
                  onChange={(e) => setFlatRentEstimate(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="text-right">
                <span className="block text-[10px] text-gray-500 dark:text-slate-400 mb-1">
                  Your Share
                </span>
                <span className="text-base font-black text-blue-600 dark:text-blue-400 font-mono">
                  ₹{perPersonShare.toLocaleString()}/mo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-950/40 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Close
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenChat(candidate.id);
            }}
            className="px-5 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-slate-800 dark:hover:bg-blue-500 transition shadow-xs flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4" />
            Connect & Message {candidate.name.split(' ')[0]}
          </button>
        </div>
      </div>
    </div>
  );
};
