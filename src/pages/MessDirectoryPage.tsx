import React, { useState, useEffect } from 'react';
import { MessProvider } from '../types';
import { Utensils, Star, MapPin, Search, CheckCircle2, Phone, MessageSquare, UtensilsCrossed, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { DailyMessMenuModal } from '../components/DailyMessMenuModal';

interface MessDirectoryPageProps {
  onOpenChat: (userId: string) => void;
  selectedMess?: MessProvider | null;
}

export const MessDirectoryPage: React.FC<MessDirectoryPageProps> = ({ onOpenChat }) => {
  const { user } = useAuth();
  const { isMessFavorite, toggleMessFavorite } = useFavorites();
  const [messList, setMessList] = useState<MessProvider[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [diet, setDiet] = useState('any');
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('5000');

  // Selected detail modal
  const [activeMess, setActiveMess] = useState<MessProvider | null>(null);
  const [selectedDailyMenuMess, setSelectedDailyMenuMess] = useState<MessProvider | null>(null);

  const fetchMess = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (diet && diet !== 'any') params.append('dietType', diet);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const res = await fetch(`/api/mess?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMessList(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMess();
  }, []);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMess();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Mess and Tiffin Directory
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
          Nutritious homestyle meals & subscription tiffins delivered right to your PG/room gate.
        </p>
      </div>

      {/* Filter Bar (matching Wireframe Page 6) */}
      <form onSubmit={handleApply} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or area"
              className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 pl-9 pr-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="w-32">
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

        <div className="w-28">
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Min price</label>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
            placeholder="0"
          />
        </div>

        <div className="w-28">
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Max price</label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
            placeholder="5000"
          />
        </div>

        <button
          type="submit"
          className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-xs transition"
        >
          Apply
        </button>
      </form>

      {/* Mess Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-500 dark:text-slate-400">Loading mess services...</div>
      ) : messList.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">No mess services found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {messList.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">{item.name}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-semibold capitalize text-slate-600 dark:text-slate-300">
                      {item.dietType === 'veg' ? '🌱 Pure Veg' : item.dietType === 'non-veg' ? '🍗 Non-Veg' : '🍲 Veg & Non-Veg'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleMessFavorite(item)}
                      className={`p-1.5 rounded-lg transition ${
                        isMessFavorite(item.id)
                          ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/70 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                          : 'text-gray-400 hover:text-rose-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                      title={isMessFavorite(item.id) ? 'Remove from favorites' : 'Save mess to favorites'}
                      aria-label={isMessFavorite(item.id) ? 'Remove from favorites' : 'Save mess to favorites'}
                    >
                      <Heart className={`w-4 h-4 transition-transform duration-200 ${isMessFavorite(item.id) ? 'fill-rose-500 text-rose-500 scale-105' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    Rating {item.ratingAvg}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {item.distanceKm ?? 1.8} km away
                  </span>
                </div>

                {item.description && (
                  <p className="text-xs text-gray-600 dark:text-slate-300 line-clamp-2">{item.description}</p>
                )}

                {/* Primary Plan */}
                <div className="bg-gray-50 dark:bg-slate-800/80 p-3 rounded-lg border border-gray-100 dark:border-slate-800 text-xs text-gray-700 dark:text-slate-300 space-y-1">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Plan: {item.plans?.[0]?.name || 'Regular Plan'}
                  </div>
                  <div className="text-blue-700 dark:text-blue-400 font-extrabold text-sm">
                    ₹{item.plans?.[0]?.pricePerMonth?.toLocaleString() || '2,800'} / month
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400">
                    Includes: {item.plans?.[0]?.mealsIncluded?.join(', ') || 'Lunch, Dinner'}
                  </div>
                </div>

                {item.trialMealAvailable && (
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Trial meal available {item.trialMealPrice ? `(₹${item.trialMealPrice})` : ''}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-gray-500 dark:text-slate-400">
                  Delivers up to {item.deliveryRadiusKm} km
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedDailyMenuMess(item)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 dark:hover:bg-amber-900 rounded-lg transition flex items-center gap-1 shadow-2xs"
                  >
                    <UtensilsCrossed className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    Today's Menu & Votes
                  </button>
                  <button
                    onClick={() => setActiveMess(item)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition"
                  >
                    All plans
                  </button>
                  {user?.id !== item.ownerId && (
                    <button
                      onClick={() => onOpenChat(item.ownerId)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition shadow-xs flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" /> Contact
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mess Details & Subscription Modal */}
      {activeMess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start justify-between border-b dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{activeMess.name}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">{activeMess.address}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleMessFavorite(activeMess)}
                  className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 text-xs font-semibold ${
                    isMessFavorite(activeMess.id)
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                      : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700'
                  }`}
                  title={isMessFavorite(activeMess.id) ? 'Remove from favorites' : 'Save to favorites'}
                >
                  <Heart
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isMessFavorite(activeMess.id) ? 'fill-rose-500 text-rose-500 scale-105' : 'text-gray-500 dark:text-slate-400'
                    }`}
                  />
                  <span>{isMessFavorite(activeMess.id) ? 'Saved' : 'Save'}</span>
                </button>
                <button onClick={() => setActiveMess(null)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
                  ✕
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-700 dark:text-slate-300">{activeMess.description}</p>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-slate-200">
                Available Meal Subscription Plans
              </h4>
              {activeMess.plans.map((p, i) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-sm text-gray-900 dark:text-white">{p.name}</h5>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Meals: {p.mealsIncluded.join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-blue-700 dark:text-blue-400 text-sm">₹{p.pricePerMonth}</span>
                    <span className="text-[10px] text-gray-500 dark:text-slate-400 block">/ month</span>
                  </div>
                </div>
              ))}
            </div>

            {activeMess.trialMealAvailable && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-medium flex items-center justify-between border border-emerald-200 dark:border-emerald-900">
                <span>Trial single meal available before monthly subscription</span>
                <span className="font-bold">₹{activeMess.trialMealPrice || 60}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveMess(null)}
                className="px-4 py-2 text-xs text-gray-600 dark:text-slate-300 border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Close
              </button>
              {user?.id !== activeMess.ownerId && (
                <button
                  onClick={() => {
                    const ownerId = activeMess.ownerId;
                    setActiveMess(null);
                    onOpenChat(ownerId);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-xs"
                >
                  Message Provider
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <DailyMessMenuModal
        mess={selectedDailyMenuMess}
        isOpen={Boolean(selectedDailyMenuMess)}
        onClose={() => setSelectedDailyMenuMess(null)}
      />
    </div>
  );
};
