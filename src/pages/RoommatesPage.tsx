import React, { useState, useEffect } from 'react';
import { RoommateCandidate } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Tag,
  DollarSign,
} from 'lucide-react';
import { RoommateQuizModal } from '../components/RoommateQuizModal';
import { RoommateBreakdownModal } from '../components/RoommateBreakdownModal';

interface RoommatesPageProps {
  onOpenChat: (userId: string) => void;
  onOpenProfile: () => void;
}

export const RoommatesPage: React.FC<RoommatesPageProps> = ({
  onOpenChat,
  onOpenProfile,
}) => {
  const { user, token } = useAuth();
  const [candidates, setCandidates] = useState<RoommateCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedCandidateForBreakdown, setSelectedCandidateForBreakdown] = useState<RoommateCandidate | null>(null);

  // Filters
  const [sleepSchedule, setSleepSchedule] = useState('any');
  const [diet, setDiet] = useState('any');
  const [smoking, setSmoking] = useState('any');
  const [studyHabits, setStudyHabits] = useState('any');
  const [cleanliness, setCleanliness] = useState('any');
  const [interest, setInterest] = useState('any');

  const fetchRoommates = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sleepSchedule && sleepSchedule !== 'any') params.append('sleepSchedule', sleepSchedule);
      if (diet && diet !== 'any') params.append('diet', diet);
      if (smoking && smoking !== 'any') params.append('smoking', smoking);
      if (studyHabits && studyHabits !== 'any') params.append('studyHabits', studyHabits);
      if (cleanliness && cleanliness !== 'any') params.append('cleanliness', cleanliness);
      if (interest && interest !== 'any') params.append('interest', interest);

      const res = await fetch(`/api/users/roommates/find?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoommates();
  }, [token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRoommates();
  };

  const myInterests = user?.roommatePrefs?.interests || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Quiz CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Roommate Compatibility Matcher
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              Smart Match Algorithm
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            Algorithmic compatibility matching for students splitting 2BHK/3BHK flats near campus based on sleep, study, kitchen habits & interests.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {user?.role === 'student' && (
            <button
              onClick={() => setShowQuizModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-blue-500 hover:to-indigo-500 transition shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Take Compatibility Quiz
            </button>
          )}

          <button
            onClick={onOpenProfile}
            className="px-3.5 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition"
          >
            My Profile
          </button>
        </div>
      </div>

      {/* Filter Bar with Enhanced Criteria */}
      <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex flex-wrap items-end gap-3">
        <div className="w-32">
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Sleep schedule</label>
          <select
            value={sleepSchedule}
            onChange={(e) => setSleepSchedule(e.target.value)}
            className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="any" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Any</option>
            <option value="early" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Early bird</option>
            <option value="late" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Night owl</option>
            <option value="flexible" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Flexible</option>
          </select>
        </div>

        <div className="w-28">
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Diet</label>
          <select
            value={diet}
            onChange={(e) => setDiet(e.target.value)}
            className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="any" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Any</option>
            <option value="veg" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Veg</option>
            <option value="non-veg" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Non-veg</option>
            <option value="both" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Both</option>
          </select>
        </div>

        <div className="w-32">
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Study habits</label>
          <select
            value={studyHabits}
            onChange={(e) => setStudyHabits(e.target.value)}
            className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="any" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Any</option>
            <option value="quiet" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Quiet / Silent</option>
            <option value="moderate" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Moderate</option>
            <option value="social" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Social / Group</option>
          </select>
        </div>

        <div className="w-32">
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Cleanliness</label>
          <select
            value={cleanliness}
            onChange={(e) => setCleanliness(e.target.value)}
            className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="any" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Any</option>
            <option value="neat_freak" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Neat freak</option>
            <option value="moderate" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Moderate</option>
            <option value="relaxed" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Relaxed</option>
          </select>
        </div>

        <div className="w-32">
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Interest</label>
          <select
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="any" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Any interest</option>
            <option value="Coding" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Coding</option>
            <option value="Gaming" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Gaming</option>
            <option value="Gym & Fitness" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Gym & Fitness</option>
            <option value="Music" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Music</option>
            <option value="Cricket" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Cricket</option>
            <option value="Reading" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Reading</option>
          </select>
        </div>

        <div className="w-28">
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Smoking</label>
          <select
            value={smoking}
            onChange={(e) => setSmoking(e.target.value)}
            className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="any" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Any</option>
            <option value="no" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">No smoking</option>
            <option value="occasional" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Occasional</option>
            <option value="yes" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Smoking</option>
          </select>
        </div>

        <button
          type="submit"
          className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-xs transition"
        >
          Filter
        </button>
      </form>

      {/* Candidates Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-500 dark:text-slate-400">
          Running multi-vector compatibility algorithm...
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">No student roommates found matching this filter.</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Try resetting filter options or widening criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {candidates.map((c) => {
            const sharedInterests = (c.roommatePrefs.interests || []).filter(i => myInterests.includes(i));
            const primaryReason = c.matchReasons?.[0] || 'Compatible study & lifestyle pattern';

            return (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top user row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm shadow-2xs">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{c.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{c.college || 'College Student'}</p>
                      </div>
                    </div>

                    {/* Algorithmic Match Score Pill */}
                    <button
                      type="button"
                      onClick={() => setSelectedCandidateForBreakdown(c)}
                      className="text-right shrink-0 group hover:opacity-90 transition"
                      title="Click to view detailed compatibility breakdown"
                    >
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block group-hover:underline">
                        {c.compatibility}% Match
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">view score →</span>
                    </button>
                  </div>

                  {/* Why you match preview */}
                  <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{primaryReason}</span>
                  </div>

                  {/* Clean Lifestyle Separators */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-300 pt-1">
                    {c.roommatePrefs.sleepSchedule && (
                      <span className="capitalize">{c.roommatePrefs.sleepSchedule} sleeper</span>
                    )}
                    {c.roommatePrefs.sleepSchedule && c.roommatePrefs.cleanliness && (
                      <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                    )}
                    {c.roommatePrefs.cleanliness && (
                      <span className="capitalize">{c.roommatePrefs.cleanliness.replace('_', ' ')}</span>
                    )}
                    {c.roommatePrefs.cleanliness && c.roommatePrefs.diet && (
                      <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                    )}
                    {c.roommatePrefs.diet && (
                      <span className="capitalize">{c.roommatePrefs.diet} diet</span>
                    )}
                    {c.roommatePrefs.diet && c.roommatePrefs.studyHabits && (
                      <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                    )}
                    {c.roommatePrefs.studyHabits && (
                      <span className="capitalize">{c.roommatePrefs.studyHabits} study</span>
                    )}
                  </div>

                  {/* Interests Tags */}
                  {c.roommatePrefs.interests && c.roommatePrefs.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {c.roommatePrefs.interests.slice(0, 3).map((int) => {
                        const isShared = myInterests.includes(int);
                        return (
                          <span
                            key={int}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                              isShared
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                            }`}
                          >
                            {isShared && '✨ '} {int}
                          </span>
                        );
                      })}
                      {c.roommatePrefs.interests.length > 3 && (
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 self-center">
                          +{c.roommatePrefs.interests.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCandidateForBreakdown(c)}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    Breakdown
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenChat(c.id)}
                    className="flex-1 py-2 bg-slate-900 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Message
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quiz Modal */}
      <RoommateQuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        onUpdated={fetchRoommates}
      />

      {/* Score Breakdown Modal */}
      <RoommateBreakdownModal
        candidate={selectedCandidateForBreakdown}
        isOpen={Boolean(selectedCandidateForBreakdown)}
        onClose={() => setSelectedCandidateForBreakdown(null)}
        onOpenChat={onOpenChat}
      />
    </div>
  );
};
