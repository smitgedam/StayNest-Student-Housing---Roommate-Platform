import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Sparkles,
  CheckCircle2,
  Moon,
  Sun,
  BookOpen,
  Users,
  Utensils,
  Cigarette,
  DollarSign,
  Heart,
  Tag,
} from 'lucide-react';

interface RoommateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const INTEREST_OPTIONS = [
  'Coding',
  'Gaming',
  'Gym & Fitness',
  'Tech Projects',
  'Music',
  'Reading',
  'Cooking',
  'Cricket',
  'Football',
  'Anime',
  'Movies & Netflix',
  'Debating',
  'Photography',
  'Badminton',
];

export const RoommateQuizModal: React.FC<RoommateQuizModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { user, token, updateUser } = useAuth();

  const currentPrefs = user?.roommatePrefs || {};

  const [sleepSchedule, setSleepSchedule] = useState<'early' | 'late' | 'flexible'>(currentPrefs.sleepSchedule || 'early');
  const [diet, setDiet] = useState<'veg' | 'non-veg' | 'both'>(currentPrefs.diet || 'veg');
  const [smoking, setSmoking] = useState<'no' | 'occasional' | 'yes'>(currentPrefs.smoking || 'no');
  const [studyHabits, setStudyHabits] = useState<'quiet' | 'moderate' | 'social'>(currentPrefs.studyHabits || 'quiet');
  const [cleanliness, setCleanliness] = useState<'neat_freak' | 'moderate' | 'relaxed'>(currentPrefs.cleanliness || 'neat_freak');
  const [guestPolicy, setGuestPolicy] = useState<'no_parties' | 'weekends_only' | 'flexible'>(currentPrefs.guestPolicy || 'no_parties');
  const [foodSharing, setFoodSharing] = useState<'cook_together' | 'independent' | 'mess_tiffin'>(currentPrefs.foodSharing || 'cook_together');
  const [budgetMin, setBudgetMin] = useState<number>(currentPrefs.budgetMin || 6000);
  const [budgetMax, setBudgetMax] = useState<number>(currentPrefs.budgetMax || 12000);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(currentPrefs.interests || ['Coding', 'Tech Projects', 'Gym & Fitness']);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/users/me/roommate-prefs', {
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
          cleanliness,
          guestPolicy,
          foodSharing,
          budgetMin: Number(budgetMin),
          budgetMax: Number(budgetMax),
          interests: selectedInterests,
          lookingForRoommate: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          updateUser(data.user);
        }
        setSuccess(true);
        setTimeout(() => {
          onUpdated();
          onClose();
        }, 1000);
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Lifestyle Compatibility Quiz & Preferences
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Personalize your roommate recommendation algorithm
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-medium border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Preferences updated! Recalculating your compatibility scores...
            </div>
          )}

          {/* Sleep Schedule & Cleanliness */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-xs">
              <Moon className="w-4 h-4 text-blue-600" /> Daily Lifestyle & Sleep Schedule
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'early', label: '🌅 Early Riser', sub: 'Sleep by 11 PM' },
                { val: 'late', label: '🌙 Night Owl', sub: 'Study past 2 AM' },
                { val: 'flexible', label: '⚡ Flexible', sub: 'Adapts easily' },
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setSleepSchedule(opt.val as any)}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    sleepSchedule === opt.val
                      ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                      : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50'
                  }`}
                >
                  <span className="block text-xs font-semibold">{opt.label}</span>
                  <span className="block text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cleanliness & Room Upkeep */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-xs">
              🧹 Cleanliness & Room Order
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'neat_freak', label: 'Sparkling Tidy', sub: 'Neat freak & organized' },
                { val: 'moderate', label: 'Balanced', sub: 'Tidy on weekends' },
                { val: 'relaxed', label: 'Relaxed / Casual', sub: 'Easygoing style' },
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setCleanliness(opt.val as any)}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    cleanliness === opt.val
                      ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50'
                  }`}
                >
                  <span className="block text-xs font-semibold">{opt.label}</span>
                  <span className="block text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Study Atmosphere & Guest Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                📚 Study Habits
              </label>
              <select
                value={studyHabits}
                onChange={(e) => setStudyHabits(e.target.value as any)}
                className="w-full text-xs rounded-xl border border-gray-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-medium"
              >
                <option value="quiet">Dead silence & pin-drop quiet</option>
                <option value="moderate">Moderate / Background music</option>
                <option value="social">Social / Group study sessions</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                🎉 Guest & Party Policy
              </label>
              <select
                value={guestPolicy}
                onChange={(e) => setGuestPolicy(e.target.value as any)}
                className="w-full text-xs rounded-xl border border-gray-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-medium"
              >
                <option value="no_parties">No late parties / Quiet flat</option>
                <option value="weekends_only">Weekends only with notice</option>
                <option value="flexible">Casual & flexible</option>
              </select>
            </div>
          </div>

          {/* Diet & Smoking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                🥗 Dietary Preference
              </label>
              <select
                value={diet}
                onChange={(e) => setDiet(e.target.value as any)}
                className="w-full text-xs rounded-xl border border-gray-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-medium"
              >
                <option value="veg">Strictly Vegetarian Kitchen</option>
                <option value="non-veg">Non-Vegetarian</option>
                <option value="both">Both / Flexible</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                🚭 Smoking Habits
              </label>
              <select
                value={smoking}
                onChange={(e) => setSmoking(e.target.value as any)}
                className="w-full text-xs rounded-xl border border-gray-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-medium"
              >
                <option value="no">Strictly Non-Smoker</option>
                <option value="occasional">Occasional outside balcony</option>
                <option value="yes">Smoker</option>
              </select>
            </div>
          </div>

          {/* Monthly Budget Range (₹) */}
          <div className="space-y-2 bg-gray-50 dark:bg-slate-800/60 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-900 dark:text-white">
                💰 Monthly Room Budget Range (₹)
              </span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                ₹{budgetMin.toLocaleString()} – ₹{budgetMax.toLocaleString()}/mo
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] text-gray-500 dark:text-slate-400 mb-1">Minimum (₹)</label>
                <input
                  type="number"
                  step="500"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 dark:text-slate-400 mb-1">Maximum (₹)</label>
                <input
                  type="number"
                  step="500"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Hobbies & Passions Tag Cloud */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-900 dark:text-white">
              ✨ Select Interests & Hobbies (Powers matching bonus)
            </label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/30'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-slate-900 dark:bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-blue-500 transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {submitting ? 'Saving...' : 'Recalculate AI Match Scores'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
