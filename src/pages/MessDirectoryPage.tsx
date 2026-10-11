import React, { useState, useEffect } from 'react';
import { MessProvider } from '../types';
import { Utensils, Star, MapPin, Search, CheckCircle2, Phone, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MessDirectoryPageProps {
  onOpenChat: (userId: string) => void;
  selectedMess?: MessProvider | null;
}

export const MessDirectoryPage: React.FC<MessDirectoryPageProps> = ({ onOpenChat }) => {
  const { user } = useAuth();
  const [messList, setMessList] = useState<MessProvider[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [diet, setDiet] = useState('any');
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('5000');

  // Selected detail modal
  const [activeMess, setActiveMess] = useState<MessProvider | null>(null);

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
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Mess and Tiffin Directory
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Nutritious homestyle meals & subscription tiffins delivered right to your PG/room gate.
        </p>
      </div>

      {/* Filter Bar (matching Wireframe Page 6) */}
      <form onSubmit={handleApply} className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or area"
              className="w-full text-xs rounded-lg border border-gray-300 pl-9 pr-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
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

        <div className="w-28">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Min price</label>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
            placeholder="0"
          />
        </div>

        <div className="w-28">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Max price</label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
            placeholder="5000"
          />
        </div>

        <button
          type="submit"
          className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-xs transition"
        >
          Apply
        </button>
      </form>

      {/* Mess Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-500">Loading mess services...</div>
      ) : messList.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl border border-gray-200">
          <p className="text-sm font-semibold text-gray-700">No mess services found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {messList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      item.dietType === 'veg'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.dietType === 'non-veg'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.dietType}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1 font-semibold text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    Rating {item.ratingAvg}
                  </span>
                  <span>|</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {item.distanceKm ?? 1.8} km away
                  </span>
                </div>

                {item.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                )}

                {/* Primary Plan */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs text-gray-700 space-y-1">
                  <div className="font-semibold text-gray-900">
                    Plan: {item.plans?.[0]?.name || 'Regular Plan'}
                  </div>
                  <div className="text-blue-700 font-extrabold text-sm">
                    ₹{item.plans?.[0]?.pricePerMonth?.toLocaleString() || '2,800'} / month
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Includes: {item.plans?.[0]?.mealsIncluded?.join(', ') || 'Lunch, Dinner'}
                  </div>
                </div>

                {item.trialMealAvailable && (
                  <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Trial meal available {item.trialMealPrice ? `(₹${item.trialMealPrice})` : ''}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">
                  Delivers up to {item.deliveryRadiusKm} km
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveMess(item)}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    All plans
                  </button>
                  {user?.id !== item.ownerId && (
                    <button
                      onClick={() => onOpenChat(item.ownerId)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-blue-600 rounded-lg transition shadow-xs flex items-center gap-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{activeMess.name}</h3>
                <p className="text-xs text-gray-500">{activeMess.address}</p>
              </div>
              <button onClick={() => setActiveMess(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-700">{activeMess.description}</p>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                Available Meal Subscription Plans
              </h4>
              {activeMess.plans.map((p, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-sm text-gray-900">{p.name}</h5>
                    <p className="text-xs text-gray-500">Meals: {p.mealsIncluded.join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-blue-700 text-sm">₹{p.pricePerMonth}</span>
                    <span className="text-[10px] text-gray-500 block">/ month</span>
                  </div>
                </div>
              ))}
            </div>

            {activeMess.trialMealAvailable && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium flex items-center justify-between">
                <span>Trial single meal available before monthly subscription</span>
                <span className="font-bold">₹{activeMess.trialMealPrice || 60}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveMess(null)}
                className="px-4 py-2 text-xs text-gray-600 border rounded-lg"
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
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Message Provider
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
