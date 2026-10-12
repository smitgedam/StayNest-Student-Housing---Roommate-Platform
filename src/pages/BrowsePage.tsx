import React, { useState, useEffect } from 'react';
import { Property, MessProvider } from '../types';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyMap } from '../components/PropertyMap';
import { PropertyDetailModal } from '../components/PropertyDetailModal';
import { Search, MapPin, SlidersHorizontal, RotateCcw, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

interface BrowsePageProps {
  onOpenChat: (userId: string, propertyId?: string) => void;
  onOpenBookings: () => void;
  onViewMessDetails: (mess: MessProvider) => void;
}

export const BrowsePage: React.FC<BrowsePageProps> = ({
  onOpenChat,
  onOpenBookings,
  onViewMessDetails,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [propertyType, setPropertyType] = useState<string>('any');
  const [minRent, setMinRent] = useState<string>('0');
  const [maxRent, setMaxRent] = useState<string>('15000');
  const [radiusKm, setRadiusKm] = useState<number>(20);
  const [centerCoords, setCenterCoords] = useState<[number, number]>([28.7495, 77.1175]); // DTU campus center

  // Amenities
  const [wifi, setWifi] = useState<boolean>(false);
  const [ac, setAc] = useState<boolean>(false);
  const [foodIncluded, setFoodIncluded] = useState<boolean>(false);
  const [parking, setParking] = useState<boolean>(false);
  const [powerBackup, setPowerBackup] = useState<boolean>(false);

  // Responsive state
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [showFiltersMobile, setShowFiltersMobile] = useState<boolean>(false);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (centerCoords) {
        params.append('lat', centerCoords[0].toString());
        params.append('lng', centerCoords[1].toString());
      }
      if (radiusKm) params.append('radiusKm', radiusKm.toString());
      if (minRent) params.append('minRent', minRent);
      if (maxRent) params.append('maxRent', maxRent);
      if (propertyType && propertyType !== 'any') params.append('propertyType', propertyType);
      if (searchQuery) params.append('q', searchQuery);
      if (wifi) params.append('wifi', 'true');
      if (ac) params.append('ac', 'true');
      if (foodIncluded) params.append('foodIncluded', 'true');
      if (parking) params.append('parking', 'true');
      if (powerBackup) params.append('powerBackup', 'true');

      const res = await fetch(`/api/properties?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [centerCoords]);

  // Listen for real-time property status updates
  useEffect(() => {
    if (!socket) return;
    const handleStatusChange = () => {
      fetchProperties();
    };
    socket.on('property:status_changed', handleStatusChange);
    return () => {
      socket.off('property:status_changed', handleStatusChange);
    };
  }, [socket]);

  const handleApplyFilters = () => {
    fetchProperties();
  };

  const handleResetFilters = () => {
    setPropertyType('any');
    setMinRent('0');
    setMaxRent('15000');
    setRadiusKm(20);
    setSearchQuery('');
    setWifi(false);
    setAc(false);
    setFoodIncluded(false);
    setParking(false);
    setPowerBackup(false);
    setCenterCoords([28.7495, 77.1175]);
    setTimeout(() => {
      fetchProperties();
    }, 50);
  };

  const handleNearMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenterCoords([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          // Fallback to campus default
          setCenterCoords([28.7495, 77.1175]);
        }
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Find your nest
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            Real-time accurate student rentals, mapped & verified near your college.
          </p>
        </div>

        {user?.role === 'student' && (
          <button
            onClick={onOpenBookings}
            className="self-start sm:self-auto px-4 py-2 border border-gray-300 dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-400 rounded-lg text-xs font-bold text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-900 shadow-xs transition"
          >
            My Requests / Bookings
          </button>
        )}
      </div>

      {/* Mobile view and filter controls */}
      <div className="flex lg:hidden items-center justify-between gap-2 pb-4">
        <button
          onClick={() => setShowFiltersMobile(!showFiltersMobile)}
          className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          {showFiltersMobile ? 'Hide Filters' : 'Filter Properties'}
        </button>

        <div className="flex md:hidden bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMobileView('list')}
            className={`px-3 py-1.5 rounded-md transition ${mobileView === 'list' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            List ({properties.length})
          </button>
          <button
            onClick={() => setMobileView('map')}
            className={`px-3 py-1.5 rounded-md transition ${mobileView === 'map' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Map View
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Filters (3 Cols) */}
        <div className={`${showFiltersMobile ? 'block' : 'hidden'} lg:block lg:col-span-3 bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4`}>
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
            <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Filters
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetFilters}
                className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
              <button
                type="button"
                onClick={() => setShowFiltersMobile(false)}
                className="lg:hidden text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Property type</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2.5 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:border-blue-500"
            >
              <option value="any">Any</option>
              <option value="single_room">Single room</option>
              <option value="shared_room">Shared room</option>
              <option value="pg">PG</option>
              <option value="flat_1bhk">1BHK flat</option>
              <option value="flat_2bhk">2BHK flat</option>
              <option value="flat_3bhk_plus">3BHK+ flat</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Min rent</label>
              <input
                type="number"
                value={minRent}
                onChange={(e) => setMinRent(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Max rent</label>
              <input
                type="number"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:border-blue-500"
                placeholder="15000"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              <span>Radius</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">{radiusKm} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Amenity Checkboxes */}
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
            <span className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Amenities</span>

            <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={wifi}
                onChange={(e) => setWifi(e.target.checked)}
                className="rounded border-gray-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              WiFi
            </label>

            <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={ac}
                onChange={(e) => setAc(e.target.checked)}
                className="rounded border-gray-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              AC
            </label>

            <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={foodIncluded}
                onChange={(e) => setFoodIncluded(e.target.checked)}
                className="rounded border-gray-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              Food included
            </label>

            <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={parking}
                onChange={(e) => setParking(e.target.checked)}
                className="rounded border-gray-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              Parking
            </label>

            <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={powerBackup}
                onChange={(e) => setPowerBackup(e.target.checked)}
                className="rounded border-gray-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              Power backup
            </label>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={() => {
                handleApplyFilters();
                setShowFiltersMobile(false);
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition shadow-xs"
            >
              Apply
            </button>
            <button
              onClick={handleResetFilters}
              className="w-full py-2 bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-700 font-medium text-xs rounded-lg transition"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Center/Right Columns: Search, Listings, Map (9 Cols) */}
        <div className="lg:col-span-9 space-y-4 min-w-0">
          {/* Search Bar + Near Me */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                placeholder="Search address, title, or nearest campus (e.g. Rohini, Gate 2, DTU)"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl border border-gray-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
              />
            </div>
            <button
              onClick={handleNearMe}
              className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl flex items-center gap-1.5 shadow-xs transition shrink-0"
            >
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Near me
            </button>
          </div>

          {/* Yellow Banner matching Wireframe Page 3 */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Only status = available listings appear in real-time search.</span>
          </div>

          {/* Split Content: Cards on left, Leaflet Map on right */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 min-w-0">
            {/* Listing Cards (7 cols) */}
            <div className={`${mobileView === 'map' ? 'hidden md:block' : 'block'} md:col-span-7 min-w-0 space-y-3`}>
              {loading ? (
                <div className="p-12 text-center text-xs text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
                  Finding available nests...
                </div>
              ) : properties.length === 0 ? (
                <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 space-y-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">No properties matched this filter.</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Try widening your rent range or radius slider.</p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-2 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (
                properties.map((prop) => (
                  <PropertyCard
                    key={prop.id}
                    property={prop}
                    onViewDetails={(p) => setSelectedProperty(p)}
                    isSelected={selectedProperty?.id === prop.id}
                  />
                ))
              )}
            </div>

            {/* Map (5 cols) */}
            <div className={`${mobileView === 'list' ? 'hidden md:block' : 'block'} md:col-span-5 min-w-0 h-[calc(100vh-280px)] min-h-[380px] md:h-[calc(100vh-140px)] md:sticky md:top-20 z-0 isolate`}>
              <PropertyMap
                properties={properties}
                center={centerCoords}
                radiusKm={radiusKm}
                onSelectProperty={(p) => setSelectedProperty(p)}
                selectedPropertyId={selectedProperty?.id}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Property Detail Modal */}
      <PropertyDetailModal
        property={selectedProperty}
        isOpen={Boolean(selectedProperty)}
        onClose={() => setSelectedProperty(null)}
        onOpenChat={onOpenChat}
        onViewMess={onViewMessDetails}
        onBookingSuccess={() => {
          fetchProperties();
        }}
      />
    </div>
  );
};
