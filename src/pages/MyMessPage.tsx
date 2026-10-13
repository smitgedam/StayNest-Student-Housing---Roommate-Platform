import React, { useState, useEffect } from 'react';
import { MessProvider, MealPlan } from '../types';
import { useAuth } from '../context/AuthContext';
import { MapPicker } from '../components/MapPicker';
import { MessMenuEditorModal } from '../components/MessMenuEditorModal';
import { Utensils, Plus, Trash2, CheckCircle2, Star, Edit3, Calendar, UtensilsCrossed, AlertTriangle } from 'lucide-react';

export const MyMessPage: React.FC = () => {
  const { user, token } = useAuth();
  const [myMessList, setMyMessList] = useState<MessProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMenuMess, setEditingMenuMess] = useState<MessProvider | null>(null);

  // Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dietType, setDietType] = useState('veg');
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState('5');
  const [address, setAddress] = useState('Shop 15, Sector 17, Rohini, Delhi');
  const [coords, setCoords] = useState<[number, number]>([77.119, 28.748]);
  const [plans, setPlans] = useState<MealPlan[]>([
    { name: 'Lunch + Dinner Regular', pricePerMonth: 2800, mealsIncluded: ['Lunch', 'Dinner'] },
  ]);
  const [trialMealAvailable, setTrialMealAvailable] = useState(true);
  const [trialMealPrice, setTrialMealPrice] = useState('60');

  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchMyMess = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/mess/mine/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyMessList(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyMess();
  }, [token]);

  const handleAddPlan = () => {
    setPlans([
      ...plans,
      { name: 'Single Meal Plan', pricePerMonth: 1800, mealsIncluded: ['Dinner'] },
    ]);
  };

  const handleRemovePlan = (idx: number) => {
    setPlans(plans.filter((_, i) => i !== idx));
  };

  const handleUpdatePlan = (idx: number, field: keyof MealPlan, value: unknown) => {
    const updated = [...plans];
    (updated[idx] as any)[field] = value;
    setPlans(updated);
  };

  const handleCreateMess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch('/api/mess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          dietType,
          deliveryRadiusKm: Number(deliveryRadiusKm),
          address,
          location: {
            type: 'Point',
            coordinates: coords,
          },
          plans,
          trialMealAvailable,
          trialMealPrice: trialMealPrice ? Number(trialMealPrice) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create mess listing');
      } else {
        setFormSuccess('Mess service published to students and nearby properties!');
        setName('');
        setDescription('');
        fetchMyMess();
      }
    } catch {
      setFormError('Network error while saving mess listing');
    }
  };

  const handleToggleActive = async (mess: MessProvider) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/mess/${mess.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !mess.active }),
      });
      if (res.ok) {
        fetchMyMess();
      }
    } catch {
      // ignore
    }
  };

  const [messToDelete, setMessToDelete] = useState<MessProvider | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteMess = async () => {
    if (!token || !messToDelete) return;
    setIsDeleting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch(`/api/mess/${messToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFormSuccess(`"${messToDelete.name}" listing was permanently deleted from the web application.`);
        // Remove immediately from state so it does not display in the web application
        setMyMessList((prev) => prev.filter((m) => m.id !== messToDelete.id));
        setMessToDelete(null);
        fetchMyMess();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to delete mess listing');
      }
    } catch {
      setFormError('Network error while deleting mess listing');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          My mess
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
          Manage your student kitchen service, subscription tiers, and campus delivery radius.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Create Mess Listing (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-gray-100 dark:border-slate-800 pb-3">
            <h2 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Create mess listing
            </h2>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-lg font-medium">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg font-semibold">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleCreateMess} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Business name (e.g. Annapurna Tiffin)"
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2.5 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What you serve (homestyle north indian, roti varieties, spice options...)"
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2.5 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Diet</label>
                <select
                  value={dietType}
                  onChange={(e) => setDietType(e.target.value)}
                  className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2.5 focus:border-blue-500 focus:outline-none"
                >
                  <option value="veg">Pure Vegetarian</option>
                  <option value="non-veg">Non-vegetarian</option>
                  <option value="both">Both (Veg & Non-veg options)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Delivery radius (km)</label>
                <input
                  type="number"
                  value={deliveryRadiusKm}
                  onChange={(e) => setDeliveryRadiusKm(e.target.value)}
                  className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2.5 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Kitchen Map & Address Picker - Single Unified Address Bar */}
            <MapPicker
              label="Kitchen Address"
              required
              address={address}
              onAddressChange={(newAddr) => setAddress(newAddr)}
              value={coords}
              onChange={(c) => setCoords(c)}
              hideSuggestions={true}
              landmarkExample="e.g. Near DTU Gate 2 Main Market, Opposite Metro Pillar 420, Near Red Cross Hospital, Next to Haldiram's"
              placeholder="Enter kitchen address (marker moves in real time, or drag pin)..."
            />

            {/* Plans Editor */}
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider">
                  Subscription Plans
                </label>
                <button
                  type="button"
                  onClick={handleAddPlan}
                  className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add plan
                </button>
              </div>

              {plans.map((p, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-750 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => handleUpdatePlan(idx, 'name', e.target.value)}
                      placeholder="Plan name"
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded p-1.5"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      value={p.pricePerMonth}
                      onChange={(e) => handleUpdatePlan(idx, 'pricePerMonth', Number(e.target.value))}
                      placeholder="Rs / mo"
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded p-1.5"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={p.mealsIncluded.join(', ')}
                      onChange={(e) =>
                        handleUpdatePlan(idx, 'mealsIncluded', e.target.value.split(',').map((s) => s.trim()))
                      }
                      placeholder="lunch, dinner"
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded p-1.5"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    {plans.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlan(idx)}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Trial Meal Option */}
            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trialMealAvailable}
                  onChange={(e) => setTrialMealAvailable(e.target.checked)}
                  className="rounded text-blue-600 border-gray-300 dark:border-slate-700"
                />
                Trial meal available
              </label>

              {trialMealAvailable && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 dark:text-slate-400">Trial Price ₹:</span>
                  <input
                    type="number"
                    value={trialMealPrice}
                    onChange={(e) => setTrialMealPrice(e.target.value)}
                    className="w-20 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-1"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-xs"
            >
              Publish mess listing
            </button>
          </form>
        </div>

        {/* Right Column: My Listings (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
            <h2 className="font-bold text-base text-gray-900 dark:text-white">My listings</h2>
            <span className="text-xs text-gray-500 dark:text-slate-400">{myMessList.length} services</span>
          </div>

          {loading ? (
            <p className="text-xs text-gray-500 dark:text-slate-400 py-4 text-center">Loading listings...</p>
          ) : myMessList.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-slate-400 py-4 text-center">No mess services listed yet.</p>
          ) : (
            <div className="space-y-3">
              {myMessList.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{m.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 uppercase">
                          {m.dietType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Rating {m.ratingAvg} • Radius: {m.deliveryRadiusKm} km • {m.address}
                      </p>
                    </div>

                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={m.active}
                        onChange={() => handleToggleActive(m)}
                        className="rounded text-blue-600 border-gray-300 dark:border-slate-700"
                      />
                      Active
                    </label>
                  </div>

                  {/* Actions: Edit 7-Day Menu & Delete listing */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/70 dark:border-slate-800 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingMenuMess(m)}
                      className="px-3 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900 rounded-lg transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Set / Edit 7-Day Menu
                    </button>

                    <button
                      type="button"
                      onClick={() => setMessToDelete(m)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition flex items-center gap-1 border border-red-200 dark:border-red-900/60"
                      title="Delete listing completely from the web application"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      Delete Listing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {messToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 dark:border-red-950/80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  Permanently Delete Mess Listing?
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Confirmation required before complete removal
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed bg-red-50/70 dark:bg-red-950/30 p-3 rounded-xl border border-red-100 dark:border-red-900/40">
              Are you sure you want to completely delete <strong>&quot;{messToDelete.name}&quot;</strong>? This will permanently delete your kitchen listing, meal subscription plans, and weekly menu timetable. Once deleted, it will not display in the web application.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMessToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteMess}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Completely'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7-Day Menu Timetable Customization Modal for Mess Providers */}
      <MessMenuEditorModal
        mess={editingMenuMess}
        isOpen={Boolean(editingMenuMess)}
        onClose={() => setEditingMenuMess(null)}
        onSaved={fetchMyMess}
      />
    </div>
  );
};
