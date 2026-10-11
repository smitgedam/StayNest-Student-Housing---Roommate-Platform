import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, token, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [college, setCollege] = useState(user?.college || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Roommate preferences
  const [sleepSchedule, setSleepSchedule] = useState<'early' | 'late' | 'flexible'>(
    user?.roommatePrefs?.sleepSchedule || 'flexible'
  );
  const [diet, setDiet] = useState<'veg' | 'non-veg' | 'both'>(
    user?.roommatePrefs?.diet || 'both'
  );
  const [smoking, setSmoking] = useState<'no' | 'yes' | 'occasional'>(
    user?.roommatePrefs?.smoking || 'no'
  );
  const [studyHabits, setStudyHabits] = useState<'quiet' | 'moderate' | 'social'>(
    user?.roommatePrefs?.studyHabits || 'moderate'
  );
  const [lookingForRoommate, setLookingForRoommate] = useState(
    Boolean(user?.roommatePrefs?.lookingForRoommate)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setCollege(user.college || '');
      setPhone(user.phone || '');
      if (user.roommatePrefs) {
        setSleepSchedule(user.roommatePrefs.sleepSchedule || 'flexible');
        setDiet(user.roommatePrefs.diet || 'both');
        setSmoking(user.roommatePrefs.smoking || 'no');
        setStudyHabits(user.roommatePrefs.studyHabits || 'moderate');
        setLookingForRoommate(Boolean(user.roommatePrefs.lookingForRoommate));
      }
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    setMessage(null);

    try {
      // 1. Update basic profile
      await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, college, phone }),
      });

      // 2. Update roommate prefs if student
      if (user?.role === 'student') {
        await fetch('/api/users/me/roommate-prefs', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sleepSchedule,
            diet,
            smoking,
            studyHabits,
            lookingForRoommate,
          }),
        });
      }

      await refreshUser();
      setMessage('Profile and roommate preferences saved successfully!');
    } catch {
      setMessage('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Profile
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Manage your personal details and roommate matching criteria.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-5">
        {/* Verification Status Card */}
        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user?.isVerified ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            )}
            <div>
              <div className="text-xs font-bold text-gray-900">
                {user?.isVerified ? 'Verified Account' : 'Unverified Account'}
              </div>
              <div className="text-[11px] text-gray-500">
                Role: <span className="capitalize font-semibold text-gray-700">{user?.role}</span>
              </div>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              user?.isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {user?.isVerified ? 'Verified' : 'Pending verification'}
          </span>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg">
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full text-xs rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">College</label>
            <input
              type="text"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="Institution (e.g. DTU, NSUT)"
              className="w-full text-xs rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contact number"
              className="w-full text-xs rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Roommate Preferences Section (matching Wireframe Page 8) */}
          {user?.role === 'student' && (
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                Roommate preferences
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sleep schedule</label>
                  <select
                    value={sleepSchedule}
                    onChange={(e) => setSleepSchedule(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="early">Early bird</option>
                    <option value="late">Night owl</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Diet</label>
                  <select
                    value={diet}
                    onChange={(e) => setDiet(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-vegetarian</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Smoking</label>
                  <select
                    value={smoking}
                    onChange={(e) => setSmoking(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                    <option value="occasional">Occasional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Study habits</label>
                  <select
                    value={studyHabits}
                    onChange={(e) => setStudyHabits(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="quiet">Quiet</option>
                    <option value="moderate">Moderate</option>
                    <option value="social">Social</option>
                  </select>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lookingForRoommate}
                    onChange={(e) => setLookingForRoommate(e.target.checked)}
                    className="rounded text-blue-600 border-gray-300"
                  />
                  I am looking for a roommate (Opt-in to appear in roommate finder)
                </label>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition shadow-xs disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
