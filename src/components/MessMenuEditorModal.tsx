import React, { useState, useEffect } from 'react';
import { MessProvider, MealTimetableDay } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  UtensilsCrossed,
  Sparkles,
  Coffee,
  Sun,
  Moon,
  Cookie,
  CheckCircle2,
  Save,
  RotateCcw,
} from 'lucide-react';

interface MessMenuEditorModalProps {
  mess: MessProvider | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const DEFAULT_DAYS: MealTimetableDay[] = [
  {
    day: 'Monday',
    breakfast: 'Aloo Pyaz Paratha with fresh curd, butter & ginger chai',
    lunch: 'Rajma Rasila, steamed Jeera Rice, Tawa Roti, Cucumber Salad',
    eveningSnacks: 'Vegetable Cutlet with hot tea',
    dinner: 'Shahi Paneer, Dal Tadka, Tandoori Roti, Boondi Raita',
    todaySpecial: 'Shahi Paneer & Hot Gulab Jamun',
  },
  {
    day: 'Tuesday',
    breakfast: 'Poha with roasted peanuts, Sev & Lemon Chai',
    lunch: 'Kadhi Pakoda, steamed rice, Aloo Gobhi dry, papad',
    eveningSnacks: 'Crispy Samosa with mint chutney',
    dinner: 'Kadhai Paneer / Egg Curry, Arhar Dal, Phulkas, Green Salad',
    todaySpecial: 'Special Kadhi Pakoda with Ghee Rice',
  },
  {
    day: 'Wednesday',
    breakfast: 'Masala Idli with coconut chutney & piping hot Sambhar',
    lunch: 'Chole Bhature / Chole Kulche with pickled onions and mint raita',
    eveningSnacks: 'Bread Pakora with tea',
    dinner: 'Matar Paneer, Chana Dal, Jeera Rice, Chapati',
    todaySpecial: 'Amritsari Chole with fluffy Bhature',
  },
  {
    day: 'Thursday',
    breakfast: 'Methi Paratha with tomato chutney and masala chai',
    lunch: 'Dal Makhani (slow-cooked 12 hrs), Jeera Rice, Mix Veg sabzi',
    eveningSnacks: 'Pao Bhaji / Maggi with tea',
    dinner: 'Paneer Butter Masala, Yellow Dal, Butter Naan / Tawa Roti',
    todaySpecial: 'Authentic Dal Makhani & Jeera Rice',
  },
  {
    day: 'Friday',
    breakfast: 'Uttapam / Besan Chilla with coconut dip & tea',
    lunch: 'Kashmiri Dum Aloo, Dal Fry, Basmati Rice, Onion Salad',
    eveningSnacks: 'Aloo Tikki Chaat with sweet tamarind chutney',
    dinner: 'Paneer Do Pyaza / Chicken Masala, Moong Dal, Roti',
    todaySpecial: 'Paneer Do Pyaza & Kheer',
  },
  {
    day: 'Saturday',
    breakfast: 'Poori Bhaji (Spicy Aloo curry) with Halwa',
    lunch: 'Veg Pulao with crunchy Boondi Raita & Dal Fry',
    eveningSnacks: 'Onion & Paneer Pakoras with Chai',
    dinner: 'Palak Paneer, Rajma curry, Tawa Roti, Papad',
    todaySpecial: 'Poori Bhaji & Suji Halwa for Breakfast',
  },
  {
    day: 'Sunday',
    breakfast: 'Special Masala Dosa / Bedmi Poori with Aloo Sabzi',
    lunch: 'Hyderabadi Veg Biryani / Chicken Biryani with Mirchi ka Salan & Raita',
    eveningSnacks: 'Bun Maska with Kadak Chai',
    dinner: 'Chef Special Paneer Lababdar, Dal Tadka, Gulaab Jamun',
    todaySpecial: 'Dum Biryani with Mirchi ka Salan & Gulab Jamun Feast',
  },
];

export const MessMenuEditorModal: React.FC<MessMenuEditorModalProps> = ({
  mess,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { token } = useAuth();
  const [timetable, setTimetable] = useState<MealTimetableDay[]>(DEFAULT_DAYS);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !mess) return;
    setSaveSuccess(false);
    setSaveError(null);

    const fetchCurrentMenu = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/mess/${mess.id}/menu`);
        if (res.ok) {
          const data = await res.json();
          if (data.timetable && Array.isArray(data.timetable) && data.timetable.length > 0) {
            setTimetable(data.timetable);
          } else {
            setTimetable(DEFAULT_DAYS);
          }
        }
      } catch {
        setTimetable(DEFAULT_DAYS);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentMenu();
  }, [isOpen, mess?.id]);

  if (!isOpen || !mess) return null;

  const currentDayData = timetable[selectedDayIndex] || DEFAULT_DAYS[0];

  const handleUpdateField = (field: keyof MealTimetableDay, value: string) => {
    setSaveSuccess(false);
    const updated = [...timetable];
    updated[selectedDayIndex] = {
      ...updated[selectedDayIndex],
      [field]: value,
    };
    setTimetable(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !mess) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/mess/${mess.id}/menu`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ timetable }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || 'Failed to update menu timetable');
      } else {
        setSaveSuccess(true);
        onSaved();
        setTimeout(() => {
          setSaveSuccess(false);
        }, 2500);
      }
    } catch {
      setSaveError('Network error while saving menu timetable');
    } finally {
      setSaving(false);
    }
  };

  const [resetNotice, setResetNotice] = useState<string | null>(null);

  const handleResetToDefault = () => {
    const updated = [...timetable];
    updated[selectedDayIndex] = { ...DEFAULT_DAYS[selectedDayIndex] };
    setTimetable(updated);
    setResetNotice(`Reset ${DEFAULT_DAYS[selectedDayIndex].day} to standard campus dishes`);
    setTimeout(() => {
      setResetNotice(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-amber-50/60 dark:bg-amber-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Set Weekly Menu Timetable
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Custom menu schedule and daily specials for <span className="font-semibold">{mess.name}</span>
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
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Weekly menu saved and updated live for all students!</span>
            </div>
          )}

          {saveError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl font-medium">
              {saveError}
            </div>
          )}

          {resetNotice && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs rounded-xl font-medium flex items-center gap-1.5 animate-fadeIn">
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>{resetNotice}</span>
            </div>
          )}

          {/* Day Selector Pills */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              Select Day to Edit
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {timetable.map((dayItem, idx) => {
                const isSelected = selectedDayIndex === idx;
                return (
                  <button
                    key={dayItem.day}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {dayItem.day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today's Special Dish */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                {currentDayData.day}'s Special Dish
              </label>
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                Highlighted banner on menu
              </span>
            </div>
            <input
              type="text"
              value={currentDayData.todaySpecial || ''}
              onChange={(e) => handleUpdateField('todaySpecial', e.target.value)}
              placeholder="e.g. Shahi Paneer & Hot Gulab Jamun"
              className="w-full text-xs rounded-lg border border-amber-300 dark:border-amber-800 p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* 4 Meal Slots Input */}
          <div className="space-y-3.5">
            {/* Breakfast */}
            <div className="p-3.5 bg-gray-50 dark:bg-slate-800/70 rounded-xl border border-gray-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-amber-600" /> Breakfast
                </label>
                <span className="text-[10px] font-mono text-gray-400 dark:text-slate-400">8:00 AM - 10:30 AM</span>
              </div>
              <textarea
                rows={2}
                value={currentDayData.breakfast || ''}
                onChange={(e) => handleUpdateField('breakfast', e.target.value)}
                placeholder="Items served (e.g. Aloo Pyaz Paratha with fresh curd, butter & ginger chai)"
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none resize-none"
                required
              />
            </div>

            {/* Lunch */}
            <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-blue-600" /> Lunch (Full Thali)
                </label>
                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">12:30 PM - 3:00 PM</span>
              </div>
              <textarea
                rows={2}
                value={currentDayData.lunch || ''}
                onChange={(e) => handleUpdateField('lunch', e.target.value)}
                placeholder="Items served (e.g. Rajma Rasila, steamed Jeera Rice, Tawa Roti, Cucumber Salad)"
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none resize-none"
                required
              />
            </div>

            {/* Evening Snacks */}
            <div className="p-3.5 bg-gray-50 dark:bg-slate-800/70 rounded-xl border border-gray-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Cookie className="w-4 h-4 text-amber-600" /> Evening Snacks
                </label>
                <span className="text-[10px] font-mono text-gray-400 dark:text-slate-400">5:00 PM - 6:30 PM</span>
              </div>
              <textarea
                rows={2}
                value={currentDayData.eveningSnacks || ''}
                onChange={(e) => handleUpdateField('eveningSnacks', e.target.value)}
                placeholder="Items served (e.g. Vegetable Cutlet with hot tea)"
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none resize-none"
                required
              />
            </div>

            {/* Dinner */}
            <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900/50 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-indigo-600" /> Dinner
                </label>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">8:00 PM - 10:30 PM</span>
              </div>
              <textarea
                rows={2}
                value={currentDayData.dinner || ''}
                onChange={(e) => handleUpdateField('dinner', e.target.value)}
                placeholder="Items served (e.g. Shahi Paneer, Dal Tadka, Tandoori Roti, Boondi Raita)"
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none resize-none"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset {currentDayData.day} to sample dishes
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving Menu...' : 'Save Weekly Menu'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
