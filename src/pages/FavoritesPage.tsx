import React, { useState } from 'react';
import { Property, MessProvider } from '../types';
import { useFavorites } from '../context/FavoritesContext';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyDetailModal } from '../components/PropertyDetailModal';
import { DailyMessMenuModal } from '../components/DailyMessMenuModal';
import {
  Heart,
  Home,
  UtensilsCrossed,
  Search,
  Trash2,
  MapPin,
  Star,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface FavoritesPageProps {
  onOpenChat: (userId: string, propertyId?: string) => void;
  onNavigateTab: (tab: string) => void;
  onViewMessDetails?: (mess: MessProvider) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  onOpenChat,
  onNavigateTab,
  onViewMessDetails,
}) => {
  const {
    favoriteProperties,
    favoriteMesses,
    totalFavoritesCount,
    removePropertyFavorite,
    removeMessFavorite,
    clearAllFavorites,
  } = useFavorites();

  const [activeTab, setActiveTab] = useState<'all' | 'properties' | 'mess'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedDailyMenuMess, setSelectedDailyMenuMess] = useState<MessProvider | null>(null);
  const [activeMessModal, setActiveMessModal] = useState<MessProvider | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Filtered lists based on search
  const query = searchQuery.trim().toLowerCase();

  const filteredProperties = favoriteProperties.filter((p) => {
    if (!query) return true;
    return (
      p.title.toLowerCase().includes(query) ||
      p.address.toLowerCase().includes(query) ||
      p.nearestCollege?.toLowerCase().includes(query) ||
      p.propertyType.toLowerCase().includes(query)
    );
  });

  const filteredMesses = favoriteMesses.filter((m) => {
    if (!query) return true;
    return (
      m.name.toLowerCase().includes(query) ||
      m.address.toLowerCase().includes(query) ||
      m.dietType.toLowerCase().includes(query) ||
      m.description?.toLowerCase().includes(query)
    );
  });

  const showProperties = activeTab === 'all' || activeTab === 'properties';
  const showMesses = activeTab === 'all' || activeTab === 'mess';

  const totalFilteredCount =
    (showProperties ? filteredProperties.length : 0) +
    (showMesses ? filteredMesses.length : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                My Favorites
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
                {totalFavoritesCount} saved
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Easily compare, manage, and book your saved student accommodations and mess meal subscriptions.
            </p>
          </div>
        </div>

        {totalFavoritesCount > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {confirmClear ? (
              <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 p-1.5 rounded-xl border border-rose-200 dark:border-rose-900">
                <span className="text-xs text-rose-700 dark:text-rose-300 font-medium px-1">
                  Clear all?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearAllFavorites();
                    setConfirmClear(false);
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition"
                >
                  Yes, clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/60 transition flex items-center gap-1.5"
                title="Remove all saved favorites"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs & Search Controls */}
      {totalFavoritesCount > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              All Saved
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700">
                {totalFavoritesCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('properties')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'properties'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Properties
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700">
                {favoriteProperties.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mess')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'mess'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Mess & Tiffins
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700">
                {favoriteMesses.length}
              </span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[240px] sm:max-w-xs flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in your favorites..."
              className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 pl-9 pr-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-xs"
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {totalFavoritesCount === 0 ? (
        /* Empty State: No favorites at all */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-10 sm:p-14 text-center max-w-2xl mx-auto space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              No favorites saved yet
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto">
              Tap the heart icon on any PG, flat, or student mess listing to bookmark them here for quick comparison and direct booking.
            </p>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('browse')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Home className="w-4 h-4" />
              Browse Properties
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('mess')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <UtensilsCrossed className="w-4 h-4" />
              Explore Mess Directory
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : totalFilteredCount === 0 ? (
        /* Search has no matches */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">
            No saved listings matched "{searchQuery}"
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Try searching a different name, address, or switch between tabs.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-2 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear search filter
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section: Properties */}
          {showProperties && filteredProperties.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                    Saved Accommodations ({filteredProperties.length})
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {filteredProperties.map((prop) => (
                  <PropertyCard
                    key={prop.id}
                    property={prop}
                    onViewDetails={(p) => setSelectedProperty(p)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section: Mess Providers */}
          {showMesses && filteredMesses.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                    Saved Mess & Tiffin Services ({filteredMesses.length})
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMesses.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between relative group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-semibold capitalize text-slate-600 dark:text-slate-300">
                            {item.dietType === 'veg'
                              ? '🌱 Pure Veg'
                              : item.dietType === 'non-veg'
                              ? '🍗 Non-Veg'
                              : '🍲 Veg & Non-Veg'}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeMessFavorite(item.id)}
                            className="p-1.5 rounded-lg text-rose-500 bg-rose-50 dark:bg-rose-950/70 hover:bg-rose-100 transition"
                            title="Remove from favorites"
                            aria-label="Remove from favorites"
                          >
                            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
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
                        <p className="text-xs text-gray-600 dark:text-slate-300 line-clamp-2">
                          {item.description}
                        </p>
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
                          Today's Menu
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveMessModal(item)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition"
                        >
                          All plans
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenChat(item.ownerId)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition shadow-xs flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" /> Contact
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Property Detail Modal */}
      <PropertyDetailModal
        property={selectedProperty}
        isOpen={Boolean(selectedProperty)}
        onClose={() => setSelectedProperty(null)}
        onOpenChat={onOpenChat}
        onViewMess={(m) => {
          setSelectedProperty(null);
          if (onViewMessDetails) {
            onViewMessDetails(m);
          } else {
            setActiveMessModal(m);
          }
        }}
      />

      {/* Daily Mess Menu Modal */}
      <DailyMessMenuModal
        mess={selectedDailyMenuMess}
        isOpen={Boolean(selectedDailyMenuMess)}
        onClose={() => setSelectedDailyMenuMess(null)}
      />

      {/* Mess Details & Subscription Modal */}
      {activeMessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start justify-between border-b dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  {activeMessModal.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {activeMessModal.address}
                </p>
              </div>
              <button
                onClick={() => setActiveMessModal(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-700 dark:text-slate-300">
              {activeMessModal.description}
            </p>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-slate-200">
                Available Meal Subscription Plans
              </h4>
              {activeMessModal.plans.map((p, i) => (
                <div
                  key={i}
                  className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-gray-900 dark:text-white">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-slate-400">
                      Meals: {p.mealsIncluded.join(', ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-blue-700 dark:text-blue-400">
                      ₹{p.pricePerMonth?.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 block">/ month</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setActiveMessModal(null)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const ownerId = activeMessModal.ownerId;
                  setActiveMessModal(null);
                  onOpenChat(ownerId);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
              >
                Chat with Provider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
