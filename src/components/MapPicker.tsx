import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Search, MapPin, Loader2, AlertCircle, Building2, X } from 'lucide-react';
import { geocodeAddress, reverseGeocodeCoords, FAMOUS_CAMPUS_LANDMARKS } from '../utils/geocoding';

interface MapPickerProps {
  value: [number, number]; // [lng, lat]
  onChange: (coords: [number, number]) => void;
  height?: string;
  label?: string; // Form label e.g. "Kitchen Address *"
  address?: string; // Current controlled address value
  defaultAddressSearch?: string;
  onAddressChange?: (address: string) => void;
  placeholder?: string;
  hideSuggestions?: boolean; // When true (My Mess tab), remove suggested landmark chips and show example
  landmarkExample?: string; // Example text to show
  required?: boolean;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  value,
  onChange,
  height = '260px',
  label = 'Address',
  address,
  defaultAddressSearch = '',
  onAddressChange,
  placeholder = 'Enter address in real-time (marker moves automatically)...',
  hideSuggestions = false,
  landmarkExample = 'e.g. Near DTU Gate 2 Main Market, Opposite Metro Pillar 420, Near Red Cross Hospital, Next to Haldiram\'s',
  required = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [addressSearch, setAddressSearch] = useState(address ?? defaultAddressSearch);
  const [geocoding, setGeocoding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [locationNotFound, setLocationNotFound] = useState(false);
  const [landmarkSearch, setLandmarkSearch] = useState('');
  const [showLandmarkBox, setShowLandmarkBox] = useState(false);

  // Keep addressSearch in sync with parent address prop if provided
  useEffect(() => {
    if (address !== undefined && address !== addressSearch) {
      setAddressSearch(address);
    }
  }, [address]);

  // Reverse geocoding when marker is moved via drag or map click
  const handleMarkerMoved = useCallback(
    async (lat: number, lng: number) => {
      setStatusMessage('Locating address from pin...');
      try {
        const resolved = await reverseGeocodeCoords(lat, lng);
        setAddressSearch(resolved);
        onAddressChange?.(resolved);
        setLocationNotFound(false);
        setShowLandmarkBox(false);
        setStatusMessage(`Address filled: ${resolved}`);
        if (markerRef.current) {
          markerRef.current.bindTooltip(`📍 ${resolved}`, { direction: 'top' }).openTooltip();
        }
      } catch {
        setStatusMessage(`Pinned at [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
      }
    },
    [onAddressChange]
  );

  // Move marker to coordinates
  const moveMarkerToCoords = useCallback(
    (lat: number, lng: number, labelName?: string) => {
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], 15, { duration: 0.7 });
      }
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        if (labelName) {
          markerRef.current.bindTooltip(`📍 ${labelName}`, { direction: 'top' }).openTooltip();
        }
      }
      onChange([Number(lng.toFixed(5)), Number(lat.toFixed(5))]);
    },
    [onChange]
  );

  // Geocode address and move marker
  const locateAddress = useCallback(
    async (queryText: string) => {
      if (!queryText || queryText.trim().length < 2) {
        setLocationNotFound(false);
        return;
      }

      setGeocoding(true);
      setStatusMessage('Finding address...');
      try {
        const result = await geocodeAddress(queryText);
        if (result) {
          const [lat, lng] = result.coords;
          moveMarkerToCoords(lat, lng, result.label);
          setLocationNotFound(false);
          setShowLandmarkBox(false);
          setStatusMessage(`Marker moved to: ${result.label}`);
          onAddressChange?.(queryText);
        } else {
          setLocationNotFound(true);
          setShowLandmarkBox(true);
          setStatusMessage('Location not found. Enter nearest landmark below.');
        }
      } catch {
        setLocationNotFound(true);
        setShowLandmarkBox(true);
        setStatusMessage('Address lookup error. Try nearest famous landmark.');
      } finally {
        setGeocoding(false);
      }
    },
    [moveMarkerToCoords, onAddressChange]
  );

  // Real-time geocoding as user types in address bar (350ms debounce)
  const handleAddressInputChange = (newAddress: string) => {
    setAddressSearch(newAddress);
    onAddressChange?.(newAddress);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (newAddress.trim().length >= 3) {
      debounceTimerRef.current = setTimeout(() => {
        locateAddress(newAddress);
      }, 350);
    } else {
      setLocationNotFound(false);
      setShowLandmarkBox(false);
    }
  };

  // Handle snapping to landmark
  const handleSelectLandmark = async (landmarkName: string, coords: [number, number]) => {
    const [lat, lng] = coords;
    moveMarkerToCoords(lat, lng, landmarkName);
    const updatedAddress = addressSearch.trim()
      ? `${addressSearch} (Near ${landmarkName})`
      : landmarkName;
    setAddressSearch(updatedAddress);
    onAddressChange?.(updatedAddress);
    setLocationNotFound(false);
    setShowLandmarkBox(false);
    setStatusMessage(`Marker snapped to landmark: ${landmarkName}`);
  };

  // Custom landmark entered by user
  const handleCustomLandmarkSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!landmarkSearch.trim()) return;

    setGeocoding(true);
    try {
      const result = await geocodeAddress(landmarkSearch);
      if (result) {
        const [lat, lng] = result.coords;
        moveMarkerToCoords(lat, lng, result.label);
        const updatedAddress = addressSearch.trim()
          ? `${addressSearch} (Near ${result.label})`
          : result.label;
        setAddressSearch(updatedAddress);
        onAddressChange?.(updatedAddress);
        setLocationNotFound(false);
        setShowLandmarkBox(false);
        setStatusMessage(`Marker placed near landmark: ${result.label}`);
      } else {
        setStatusMessage(`Landmark "${landmarkSearch}" not found. Drag the pin directly on the map.`);
      }
    } finally {
      setGeocoding(false);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const [lng, lat] = value;
    const initialLat = lat || 28.7495;
    const initialLng = lng || 77.1175;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      // Drag and drop marker anywhere on map: address is filled automatically!
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChange([Number(pos.lng.toFixed(5)), Number(pos.lat.toFixed(5))]);
        handleMarkerMoved(pos.lat, pos.lng);
      });

      // Clicking anywhere on map also places marker and fills address automatically
      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        onChange([Number(e.latlng.lng.toFixed(5)), Number(e.latlng.lat.toFixed(5))]);
        handleMarkerMoved(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;

      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    } else {
      if (markerRef.current) {
        markerRef.current.setLatLng([initialLat, initialLng]);
      }
    }
  }, [value, onChange, handleMarkerMoved]);

  return (
    <div className="space-y-2 relative isolate z-0">
      {/* Single Address Bar with Form Label */}
      <div>
        {label && (
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="flex gap-1.5 items-center">
          <div className="relative flex-1">
            <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={addressSearch}
              onChange={(e) => handleAddressInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  locateAddress(addressSearch);
                }
              }}
              placeholder={placeholder}
              required={required}
              className="w-full text-xs pl-8 pr-16 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-blue-500 shadow-2xs"
            />
            {geocoding && (
              <div className="absolute right-2 top-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => locateAddress(addressSearch)}
            disabled={geocoding || !addressSearch.trim()}
            className="px-3 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition flex items-center gap-1 shrink-0 disabled:opacity-50 shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Locate</span>
          </button>
        </div>
      </div>

      {/* Famous Landmark Option if Location is Not Found or user toggles */}
      {(locationNotFound || showLandmarkBox) && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-2.5 text-xs animate-fadeIn">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Location not found by Leaflet? Enter Nearest Landmark:</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setLocationNotFound(false);
                setShowLandmarkBox(false);
              }}
              className="text-amber-700 hover:text-amber-900 dark:hover:text-amber-100 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Building2 className="w-3.5 h-3.5 text-amber-600 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={landmarkSearch}
                onChange={(e) => setLandmarkSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCustomLandmarkSearch();
                  }
                }}
                placeholder={landmarkExample}
                className="w-full text-xs pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="button"
              onClick={handleCustomLandmarkSearch}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition shrink-0"
            >
              Pin Landmark
            </button>
          </div>

          {/* Conditional rendering: if hideSuggestions (My Mess tab), remove suggested landmarks and provide example */}
          {hideSuggestions ? (
            <div className="p-2.5 bg-amber-100/70 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-[11px] space-y-1">
              <span className="font-bold flex items-center gap-1">
                💡 Example of famous / well-known landmarks to enter:
              </span>
              <p className="text-amber-800 dark:text-amber-300 font-mono text-[10.5px]">
                {landmarkExample}
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400">
                Tip: Enter any landmark like campus gates, metro stations, well-known hospitals, or public markets to accurately pin your kitchen.
              </p>
            </div>
          ) : (
            <div className="pt-1">
              <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold block mb-1">
                Quick Pick Known Landmarks:
              </span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {FAMOUS_CAMPUS_LANDMARKS.slice(0, 6).map((lm) => (
                  <button
                    key={lm.name}
                    type="button"
                    onClick={() => handleSelectLandmark(lm.name, lm.coords)}
                    className="px-2 py-1 text-[11px] font-medium bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/70 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 rounded-md transition text-left"
                  >
                    📍 {lm.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live status bar & pinned coordinates */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
        <span className="truncate max-w-[280px] sm:max-w-md font-medium text-slate-700 dark:text-slate-300">
          {statusMessage || 'Drag marker or enter address to auto-position pin'}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowLandmarkBox(!showLandmarkBox)}
            className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
          >
            <Building2 className="w-3 h-3" /> Landmark
          </button>
          <span className="font-mono bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-2 py-0.5 rounded text-[11px] border border-gray-200 dark:border-slate-700">
            [{value[0]?.toFixed(4)}, {value[1]?.toFixed(4)}]
          </span>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full rounded-lg border border-gray-300 dark:border-slate-700 overflow-hidden relative shadow-inner isolate z-0"
      />
    </div>
  );
};


