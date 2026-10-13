import React, { useState, useEffect, useRef } from 'react';
import { Property, MessProvider } from '../types';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyMap } from '../components/PropertyMap';
import { PropertyDetailModal } from '../components/PropertyDetailModal';
import { Search, MapPin, SlidersHorizontal, RotateCcw, AlertCircle, X, Navigation, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { geocodeAddress, POPULAR_CAMPUS_AREAS, CITY_FAMOUS_LANDMARKS, CITIES_LIST, CITY_DEFAULT_COORDS, LandmarkItem } from '../utils/geocoding';

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
  const [selectedCity, setSelectedCity] = useState<string>('Delhi / NCR');
  const [cityInputText, setCityInputText] = useState<string>('Delhi / NCR');
  const [isGeocodingCity, setIsGeocodingCity] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [geocodedLabel, setGeocodedLabel] = useState<string | null>('DTU Campus Center, Rohini');
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [locationNotFound, setLocationNotFound] = useState<boolean>(false);
  const [showLandmarkPicker, setShowLandmarkPicker] = useState<boolean>(false);
  const geocodeTimeoutRef = useRef<any>(null);

  const [propertyType, setPropertyType] = useState<string>('any');
  const [minRent, setMinRent] = useState<string>('0');
  const [maxRent, setMaxRent] = useState<string>('15000');
  const [radiusKm, setRadiusKm] = useState<number>(10);
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

  const handleCityChange = async (newCity: string) => {
    const trimmed = newCity.trim();
    if (!trimmed) return;

    setSelectedCity(trimmed);
    setCityInputText(trimmed);

    // 1. Check if known preset coordinates exist
    const matchedPreset = Object.keys(CITY_DEFAULT_COORDS).find(
      (c) => c.toLowerCase() === trimmed.toLowerCase()
    );
    if (matchedPreset) {
      const defaultCoords = CITY_DEFAULT_COORDS[matchedPreset];
      setCenterCoords(defaultCoords);
      setGeocodedLabel(`${matchedPreset} Center`);
      setSearchQuery('');
      setLocationNotFound(false);
      return;
    }

    // 2. Geocode custom city anywhere in India or globally
    setIsGeocodingCity(true);
    try {
      const result = await geocodeAddress(trimmed);
      if (result) {
        setCenterCoords(result.coords);
        setGeocodedLabel(result.label || `${trimmed} Center`);
        setSearchQuery('');
        setLocationNotFound(false);
      } else {
        setLocationNotFound(true);
      }
    } catch {
      setLocationNotFound(true);
    } finally {
      setIsGeocodingCity(false);
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (centerCoords) {
        params.append('lat', centerCoords[0].toString());
        params.append('lng', centerCoords[1].toString());
      }
      params.append('radiusKm', (radiusKm || 10).toString());
      if (minRent) params.append('minRent', minRent);
      if (maxRent) params.append('maxRent', maxRent);
      if (propertyType && propertyType !== 'any') params.append('propertyType', propertyType);
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

  // Re-fetch properties whenever search center or radius changes
  useEffect(() => {
    fetchProperties();
  }, [centerCoords, radiusKm]);

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

  // Automatically search address and move marker on map
  const handleMoveMarkerToAddress = async (addressText: string) => {
    if (!addressText || addressText.trim().length < 2) {
      setLocationNotFound(false);
      return;
    }
    setIsGeocoding(true);
    try {
      const result = await geocodeAddress(addressText);
      if (result) {
        setCenterCoords(result.coords);
        setGeocodedLabel(result.label);
        setLocationNotFound(false);
      } else {
        // Fallback: check matching properties in loaded list
        const match = properties.find(
          (p) =>
            p.address?.toLowerCase().includes(addressText.toLowerCase()) ||
            p.nearestCollege?.toLowerCase().includes(addressText.toLowerCase()) ||
            p.title.toLowerCase().includes(addressText.toLowerCase())
        );
        if (match && match.location?.coordinates) {
          const [lng, lat] = match.location.coordinates;
          setCenterCoords([lat, lng]);
          setGeocodedLabel(match.address || match.title);
          setLocationNotFound(false);
        } else {
          // Address not found by Leaflet/OSM: display famous landmarks option
          setLocationNotFound(true);
        }
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  // Real-time auto-move marker as user types in address bar (350ms debounce)
  // Matches exact behavior of MapPicker in Mess Providers role
  const handleAddressInputChange = (newAddress: string) => {
    setSearchQuery(newAddress);
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }
    if (newAddress.trim().length >= 2) {
      geocodeTimeoutRef.current = setTimeout(() => {
        handleMoveMarkerToAddress(newAddress);
      }, 350);
    } else {
      setLocationNotFound(false);
    }
  };

  // When user clicks map or drags pin, address is updated cleanly without trigger loops
  const handleMarkerAddressResolved = (address: string, coords: [number, number]) => {
    setSearchQuery(address);
    setCenterCoords(coords);
    setGeocodedLabel(address);
    setLocationNotFound(false);
    setShowLandmarkPicker(false);
  };

  // When user picks a famous landmark to snap marker
  const handleSnapToLandmark = (landmark: LandmarkItem) => {
    setCenterCoords(landmark.coords);
    setSearchQuery(landmark.name);
    setGeocodedLabel(`${landmark.name}, ${landmark.city}`);
    setLocationNotFound(false);
    setShowLandmarkPicker(false);
  };

  const handleApplyFilters = () => {
    if (cityInputText.trim() && cityInputText.trim().toLowerCase() !== selectedCity.toLowerCase()) {
      handleCityChange(cityInputText);
    }
    if (searchQuery.trim().length >= 2) {
      handleMoveMarkerToAddress(searchQuery);
    }
    fetchProperties();
  };

  const handleSelectQuickLocation = (loc: typeof POPULAR_CAMPUS_AREAS[0]) => {
    setSearchQuery(loc.name);
    setCenterCoords(loc.coords);
    setGeocodedLabel(loc.name);
    setLocationNotFound(false);
    setShowLandmarkPicker(false);
    setTimeout(() => {
      fetchProperties();
    }, 50);
  };

  const handleResetFilters = () => {
    setSelectedCity('Delhi / NCR');
    setCityInputText('Delhi / NCR');
    setPropertyType('any');
    setMinRent('0');
    setMaxRent('15000');
    setRadiusKm(10);
    setSearchQuery('');
    setWifi(false);
    setAc(false);
    setFoodIncluded(false);
    setParking(false);
    setPowerBackup(false);
    setCenterCoords([28.7495, 77.1175]);
    setGeocodedLabel('DTU Campus Center, Rohini');
  };

  const handleNearMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenterCoords([pos.coords.latitude, pos.coords.longitude]);
          setGeocodedLabel('Your Current GPS Location');
        },
        () => {
          // Fallback to campus default
          setCenterCoords([28.7495, 77.1175]);
          setGeocodedLabel('DTU Campus Center, Rohini');
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                City / Region
              </label>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                Type any city
              </span>
            </div>

            <div className="relative flex items-center">
              <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 absolute left-2.5 top-3 pointer-events-none" />
              <input
                type="text"
                list="popular-cities-list"
                value={cityInputText}
                onChange={(e) => {
                  const val = e.target.value;
                  setCityInputText(val);
                  if (CITIES_LIST.some((c) => c.toLowerCase() === val.toLowerCase())) {
                    handleCityChange(val);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCityChange(cityInputText);
                  }
                }}
                onBlur={() => {
                  if (cityInputText.trim() && cityInputText.trim().toLowerCase() !== selectedCity.toLowerCase()) {
                    handleCityChange(cityInputText);
                  }
                }}
                placeholder="Type any city (e.g. Pune, Jaipur, Colombo)..."
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 pl-8 pr-14 py-2 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
              />
              <button
                type="button"
                onClick={() => handleCityChange(cityInputText)}
                disabled={isGeocodingCity || !cityInputText.trim()}
                className="absolute right-1 px-2.5 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition disabled:opacity-50 flex items-center gap-1 shadow-2xs"
                title="Search and center this city"
              >
                {isGeocodingCity ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Find'}
              </button>
            </div>

            <datalist id="popular-cities-list">
              {CITIES_LIST.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            {/* Quick popular city shortcuts */}
            <div className="mt-2 flex flex-wrap gap-1">
              {['Delhi / NCR', 'Bengaluru', 'Mumbai', 'Pune', 'Hyderabad', 'Jaipur'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCityChange(c)}
                  className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition ${
                    selectedCity.toLowerCase() === c.toLowerCase()
                      ? 'bg-blue-600 text-white shadow-2xs font-bold'
                      : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700'
                  }`}
                >
                  {c.split('/')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Property type</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2.5 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              <option value="any" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1">Any</option>
              <option value="single_room" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1">Single room</option>
              <option value="shared_room" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1">Shared room</option>
              <option value="pg" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1">PG</option>
              <option value="flat_1bhk" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1">1BHK flat</option>
              <option value="flat_2bhk" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1">2BHK flat</option>
              <option value="flat_3bhk_plus" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1">3BHK+ flat</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Min rent</label>
              <input
                type="number"
                value={minRent}
                onChange={(e) => setMinRent(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Max rent</label>
              <input
                type="number"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full py-2 bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-700 font-medium text-xs rounded-lg transition"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Center/Right Columns: Search, Listings, Map (9 Cols) */}
        <div className="lg:col-span-9 space-y-3 min-w-0">
          {/* Address Search Bar + Near Me */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleAddressInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyFilters();
                    }
                  }}
                  placeholder="Enter any address or campus (e.g. DTU Gate 2, Rohini Sector 17, Bawana Road, NSP)..."
                  className="w-full pl-10 pr-20 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl border border-gray-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                />
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  disabled={isGeocoding}
                  className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs disabled:opacity-50"
                  title="Search address and fly marker"
                >
                  {isGeocoding ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5" />
                  )}
                  <span>Pin</span>
                </button>
              </div>

              <button
                onClick={handleNearMe}
                className="px-3.5 sm:px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl flex items-center gap-1.5 shadow-xs transition shrink-0"
              >
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Near me
              </button>
            </div>

            {/* Active Marker Position Indicator & Landmark Picker Trigger */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-200/60 dark:border-blue-900/40 font-medium">
                <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate max-w-[260px] sm:max-w-md">
                  Marker at: <strong className="font-bold">{geocodedLabel || `${centerCoords[0].toFixed(4)}, ${centerCoords[1].toFixed(4)}`}</strong>
                </span>
                <span className="font-mono text-[10px] text-blue-500">
                  [{centerCoords[0].toFixed(3)}, {centerCoords[1].toFixed(3)}]
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowLandmarkPicker(!showLandmarkPicker)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition border flex items-center gap-1 ${
                    showLandmarkPicker || locationNotFound
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800/80 hover:bg-amber-50'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Famous Landmarks</span>
                </button>

                {/* Quick Landmark Pills for selected city */}
                <div className="hidden sm:flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                  {(CITY_FAMOUS_LANDMARKS[selectedCity] || CITY_FAMOUS_LANDMARKS['Delhi / NCR']).slice(0, 4).map((loc) => (
                    <button
                      key={loc.name}
                      type="button"
                      onClick={() => handleSnapToLandmark(loc)}
                      className="px-2 py-0.5 text-[11px] font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-md transition shrink-0"
                    >
                      {loc.name.split('(')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Landmark Section: Suggested famous landmarks based on selected city */}
            {(locationNotFound || showLandmarkPicker) && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-3 animate-fadeIn shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      {locationNotFound
                        ? `Location "${searchQuery}" was not found on map by Leaflet`
                        : `Famous Landmarks in ${selectedCity}`}
                    </span>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                      Famous landmarks suggested for <strong>{selectedCity}</strong>. Click any landmark to move the marker and center rentals in that zone:
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLocationNotFound(false);
                      setShowLandmarkPicker(false);
                    }}
                    className="text-amber-600 hover:text-amber-800 dark:hover:text-amber-200 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* City Selector Pills inside Landmark drawer */}
                <div className="pt-1 border-t border-amber-200/80 dark:border-amber-900/50 space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 block">
                    Choose City / Zone:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                    {CITIES_LIST.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleCityChange(city)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition shrink-0 ${
                          selectedCity === city
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-950/60'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid of famous landmarks for the selected city */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-60 overflow-y-auto">
                  {(CITY_FAMOUS_LANDMARKS[selectedCity] || CITY_FAMOUS_LANDMARKS['Delhi / NCR']).map((landmark) => (
                    <button
                      key={landmark.name}
                      type="button"
                      onClick={() => handleSnapToLandmark(landmark)}
                      className="p-2 text-left bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-amber-200 dark:border-slate-700 rounded-lg hover:border-amber-500 hover:bg-amber-50/70 dark:hover:bg-slate-700 transition"
                    >
                      <div className="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{landmark.name}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-slate-400 truncate pl-4.5 mt-0.5">
                        {landmark.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                onCenterChange={(coords) => setCenterCoords(coords)}
                onAddressResolved={handleMarkerAddressResolved}
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
