import React, { useState, useEffect } from 'react';
import { MessProvider } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  UtensilsCrossed,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Clock,
  QrCode,
  CheckCircle2,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Award,
} from 'lucide-react';

interface DailyMessMenuModalProps {
  mess: MessProvider | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DailyMessMenuModal: React.FC<DailyMessMenuModalProps> = ({
  mess,
  isOpen,
  onClose,
}) => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [menuData, setMenuData] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);

  const fetchMenu = async () => {
    if (!mess) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/mess/${mess.id}/menu`);
      if (res.ok) {
        const data = await res.json();
        setMenuData(data);
        if (data.currentDay) {
          setSelectedDay(data.currentDay);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && mess) {
      fetchMenu();
    }
  }, [isOpen, mess?.id]);

  if (!isOpen || !mess) return null;

  const handleVote = async (vote: 'up' | 'down') => {
    if (!token) return;
    setUserVote(vote);
    try {
      const res = await fetch(`/api/mess/${mess.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mealType: 'lunch',
          vote,
          dishFeedback: feedbackText || undefined,
        }),
      });
      if (res.ok) {
        setVoteSubmitted(true);
        fetchMenu();
      }
    } catch {
      // ignore
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const currentDayMenu = menuData?.timetable?.find((m: any) => m.day === selectedDay) || {
    breakfast: 'Aloo Paratha with Curd & Pickle',
    lunch: 'Rajma Chawal, Roti, Salad',
    eveningSnacks: 'Samosa & Tea',
    dinner: 'Shahi Paneer, Dal, Jeera Rice, Phulka',
    todaySpecial: 'Special Paneer Dish & Sweet',
  };

  const approvalRate = menuData?.stats?.approvalRate || 92;
  const totalVotes = menuData?.stats?.totalVotes || 18;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Live Daily Mess Menu & Meal Rating
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Weekly timetable & student feedback for {mess.name}
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
          {/* Today's Special Dish Banner */}
          {currentDayMenu.todaySpecial && (
            <div className="p-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-100" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100 block">
                    {selectedDay}'s Chef Special
                  </span>
                  <p className="font-extrabold text-xs sm:text-sm truncate">
                    {currentDayMenu.todaySpecial}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPassModal(true)}
                className="px-3 py-1.5 bg-white text-amber-900 rounded-lg text-xs font-bold shrink-0 hover:bg-amber-50 transition shadow-xs flex items-center gap-1"
              >
                <QrCode className="w-3.5 h-3.5" />
                Get Meal Pass
              </button>
            </div>
          )}

          {/* Day of Week Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {days.map((day) => {
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-xs'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>

          {/* 4 Meal Slots */}
          <div className="space-y-3">
            <div className="p-3.5 bg-gray-50 dark:bg-slate-800/70 rounded-xl border border-gray-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-amber-600" /> 🥞 Breakfast
                </span>
                <span className="text-[10px] font-mono text-gray-400 dark:text-slate-400">8:00 AM - 10:30 AM</span>
              </div>
              <p className="text-gray-700 dark:text-slate-200 font-medium text-xs pt-1">
                {currentDayMenu.breakfast}
              </p>
            </div>

            <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-blue-600" /> 🍛 Lunch (Full Thali)
                </span>
                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">12:30 PM - 3:00 PM</span>
              </div>
              <p className="text-gray-700 dark:text-slate-200 font-medium text-xs pt-1">
                {currentDayMenu.lunch}
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 dark:bg-slate-800/70 rounded-xl border border-gray-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Cookie className="w-4 h-4 text-amber-600" /> ☕ Evening Snacks
                </span>
                <span className="text-[10px] font-mono text-gray-400 dark:text-slate-400">5:00 PM - 6:30 PM</span>
              </div>
              <p className="text-gray-700 dark:text-slate-200 font-medium text-xs pt-1">
                {currentDayMenu.eveningSnacks}
              </p>
            </div>

            <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900/50 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-indigo-600" /> 🍲 Dinner
                </span>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">8:00 PM - 10:30 PM</span>
              </div>
              <p className="text-gray-700 dark:text-slate-200 font-medium text-xs pt-1">
                {currentDayMenu.dinner}
              </p>
            </div>
          </div>

          {/* Student Community Meal Approval Meter */}
          <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900 dark:text-white text-xs block">
                  Student Community Meal Approval
                </span>
                <span className="text-[11px] text-gray-500 dark:text-slate-400">
                  Based on {totalVotes} student meal reviews today
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {approvalRate}% Approved
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${approvalRate}%` }}
              />
            </div>

            {/* Voting Buttons */}
            {user?.role === 'student' && (
              <div className="pt-2 border-t border-gray-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                    Did you like today's meal?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleVote('up')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        userVote === 'up'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Delicious 🔥
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVote('down')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        userVote === 'down'
                          ? 'bg-red-600 text-white'
                          : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-100'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> Needs Improvement
                    </button>
                  </div>
                </div>

                {voteSubmitted && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Feedback recorded! Thank you for rating today's student mess food.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-slate-800 dark:hover:bg-blue-500 transition shadow-xs"
          >
            Close Menu
          </button>
        </div>
      </div>

      {/* QR Pass Preview Sub-Modal */}
      {showPassModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 border border-gray-200 dark:border-slate-800 shadow-2xl">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Student Daily Mess Token
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {mess.name} • {selectedDay} Lunch
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl inline-block border border-gray-200 dark:border-slate-700">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=StayNest_MessPass_${mess.id}_${user?.id || 'guest'}_${selectedDay}`}
                alt="Mess Pass QR"
                className="w-36 h-36 mx-auto rounded-lg"
              />
              <span className="font-mono text-[10px] text-gray-400 dark:text-slate-500 block mt-2">
                TOKEN #{Math.floor(100000 + Math.random() * 900000)}
              </span>
            </div>

            <p className="text-xs text-gray-600 dark:text-slate-300 font-medium">
              Show this QR token at the kitchen serving counter.
            </p>

            <button
              onClick={() => setShowPassModal(false)}
              className="w-full py-2 bg-slate-900 dark:bg-blue-600 text-white font-bold text-xs rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
