import React, { useState, useEffect } from 'react';
import { RoommateCandidate } from '../types';
import { useAuth } from '../context/AuthContext';
import { Users, Search, MessageSquare, Sparkles, CheckCircle2 } from 'lucide-react';

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

  // Filters
  const [sleepSchedule, setSleepSchedule] = useState('any');
  const [diet, setDiet] = useState('any');
  const [smoking, setSmoking] = useState('any');
  const [studyHabits, setStudyHabits] = useState('any');

  const fetchRoommates = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sleepSchedule && sleepSchedule !== 'any') params.append('sleepSchedule', sleepSchedule);
      if (diet && diet !== 'any') params.append('diet', diet);
      if (smoking && smoking !== 'any') params.append('smoking', smoking);
      if (studyHabits && studyHabits !== 'any') params.append('studyHabits', studyHabits);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Find Roommates
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Algorithmic compatibility matching for students splitting 2BHK/3BHK flats near campus.
          </p>
        </div>

        {user?.role === 'student' && (
          <button
            onClick={onOpenProfile}
            className="self-start sm:self-auto px-3.5 py-1.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
          >
            Edit My Roommate Profile
          </button>
        )}
      </div>

      {/* Filter Bar (matching Wireframe Page 7) */}
      <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-end gap-3">
        <div className="w-36">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Sleep schedule</label>
          <select
            value={sleepSchedule}
            onChange={(e) => setSleepSchedule(e.target.value)}
            className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="any">Any</option>
            <option value="early">Early bird</option>
            <option value="late">Night owl</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>

        <div className="w-32">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Diet</label>
          <select
            value={diet}
            onChange={(e) => setDiet(e.target.value)}
            className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="any">Any</option>
            <option value="veg">Veg</option>
            <option value="non-veg">Non-veg</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div className="w-32">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Smoking</label>
          <select
            value={smoking}
            onChange={(e) => setSmoking(e.target.value)}
            className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="any">Any</option>
            <option value="no">No smoking</option>
            <option value="occasional">Occasional</option>
            <option value="yes">Smoking</option>
          </select>
        </div>

        <div className="w-32">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Study habits</label>
          <select
            value={studyHabits}
            onChange={(e) => setStudyHabits(e.target.value)}
            className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="any">Any</option>
            <option value="quiet">Quiet</option>
            <option value="moderate">Moderate</option>
            <option value="social">Social</option>
          </select>
        </div>

        <button
          type="submit"
          className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-xs transition"
        >
          Search
        </button>
      </form>

      {/* Candidates Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-500">Calculating compatibility matches...</div>
      ) : candidates.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl border border-gray-200">
          <p className="text-sm font-semibold text-gray-700">No student roommates found matching this filter.</p>
          <p className="text-xs text-gray-500 mt-1">Try resetting filter options or widening criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {candidates.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm leading-tight">{c.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{c.college || 'College Student'}</p>
                    </div>
                  </div>

                  {/* Algorithmic Match Score */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    {c.compatibility}% Match
                  </span>
                </div>

                {/* Habit Badges matching Wireframe Page 7 */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {c.roommatePrefs.sleepSchedule && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-[11px] font-medium capitalize">
                      {c.roommatePrefs.sleepSchedule}
                    </span>
                  )}
                  {c.roommatePrefs.diet && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-[11px] font-medium capitalize">
                      {c.roommatePrefs.diet}
                    </span>
                  )}
                  {c.roommatePrefs.smoking && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-[11px] font-medium capitalize">
                      {c.roommatePrefs.smoking === 'no' ? 'no smoking' : c.roommatePrefs.smoking}
                    </span>
                  )}
                  {c.roommatePrefs.studyHabits && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-[11px] font-medium capitalize">
                      {c.roommatePrefs.studyHabits}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => onOpenChat(c.id)}
                  className="w-full py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
