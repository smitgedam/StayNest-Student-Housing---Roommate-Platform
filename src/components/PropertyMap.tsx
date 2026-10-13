import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Property } from '../types';
import { reverseGeocodeCoords } from '../utils/geocoding';

interface PropertyMapProps {
  properties: Property[];
  center: [number, number]; // [lat, lng]
  radiusKm?: number;
  onSelectProperty?: (property: Property) => void;
  selectedPropertyId?: string | null;
  onCenterChange?: (coords: [number, number]) => void;
  onAddressResolved?: (address: string, coords: [number, number]) => void;
}

// Safely sanitize coordinates, falling back to DTU campus center if invalid or NaN
export const sanitizeCoords = (coords: any, fallback: [number, number] = [28.7495, 77.1175]): [number, number] => {
  if (!coords || !Array.isArray(coords) || coords.length < 2) return fallback;
  const lat = Number(coords[0]);
  const lng = Number(coords[1]);
  if (!Number.isFinite(lat) || Number.isNaN(lat) || !Number.isFinite(lng) || Number.isNaN(lng)) {
    return fallback;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return fallback;
  }
  return [lat, lng];
};

export const PropertyMap: React.FC<PropertyMapProps> = ({
  properties,
  center,
  radiusKm = 10,
  onSelectProperty,
  selectedPropertyId,
  onCenterChange,
  onAddressResolved,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circleRef = useRef<L.Circle | null>(null);
  const centerMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const [initLat, initLng] = sanitizeCoords(center);

    const map = L.map(mapContainerRef.current, {
      center: [initLat, initLng],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Clicking anywhere on map places marker, updates 10km radius circle, and resolves address
    map.on('click', async (e: L.LeafletMouseEvent) => {
      if (!e.latlng || !Number.isFinite(e.latlng.lat) || !Number.isFinite(e.latlng.lng) || Number.isNaN(e.latlng.lat) || Number.isNaN(e.latlng.lng)) {
        return;
      }
      const coords: [number, number] = [Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))];
      if (centerMarkerRef.current) {
        centerMarkerRef.current.setLatLng(e.latlng);
      }
      if (circleRef.current) {
        circleRef.current.setLatLng(e.latlng);
      }
      if (onCenterChange) {
        onCenterChange(coords);
      }
      const resolvedAddress = await reverseGeocodeCoords(coords[0], coords[1]);
      if (centerMarkerRef.current) {
        centerMarkerRef.current.setTooltipContent(`📍 ${resolvedAddress}`).openTooltip();
      }
      if (onAddressResolved) {
        onAddressResolved(resolvedAddress, coords);
      }
    });

    mapInstanceRef.current = map;

    // Handle resize events so map tiles adapt cleanly to responsive viewport changes
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current && mapContainerRef.current) {
        if (mapContainerRef.current.offsetWidth > 0 && mapContainerRef.current.offsetHeight > 0) {
          mapInstanceRef.current.invalidateSize({ pan: false });
        }
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      try {
        map.stop();
        map.remove();
      } catch {
        // Safe ignore
      }
      mapInstanceRef.current = null;
      circleRef.current = null;
      centerMarkerRef.current = null;
      markersRef.current = [];
    };
  }, []);

  // Update map center, radius circle, and markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const [flyLat, flyLng] = sanitizeCoords(center);

    // Smoothly fly map to new center coordinates when container is rendered and sized
    try {
      map.stop();
      const container = mapContainerRef.current;
      const size = map.getSize();
      const isVisible = container && container.offsetWidth > 0 && container.offsetHeight > 0;
      const targetZoom = Math.max(map.getZoom() || 13, 13);

      if (isVisible && size && size.x > 0 && size.y > 0) {
        map.flyTo([flyLat, flyLng], targetZoom, {
          duration: 0.8,
        });
      } else {
        map.setView([flyLat, flyLng], targetZoom, { animate: false });
      }
    } catch {
      try {
        map.setView([flyLat, flyLng], 13, { animate: false });
      } catch {
        // Fallback ignore
      }
    }

    // Update or create draggable center marker
    if (centerMarkerRef.current) {
      centerMarkerRef.current.setLatLng([flyLat, flyLng]);
    } else {
      const centerIcon = L.divIcon({
        className: 'user-center-marker',
        html: `
          <div style="background-color: #2563eb; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 14px rgba(37,99,235,0.8); cursor: grab; display: flex; align-items: center; justify-content: center;">
            <div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const centerMarker = L.marker([flyLat, flyLng], {
        icon: centerIcon,
        draggable: true,
        title: 'Search Center (10 km range)',
      }).addTo(map);

      centerMarker.bindTooltip('Location search pin (10 km range)', { permanent: false, direction: 'top' });

      // When user drags marker anywhere on map, auto-resolve address and notify parent
      centerMarker.on('dragend', async () => {
        const pos = centerMarker.getLatLng();
        if (!pos || !Number.isFinite(pos.lat) || !Number.isFinite(pos.lng) || Number.isNaN(pos.lat) || Number.isNaN(pos.lng)) return;
        const coords: [number, number] = [Number(pos.lat.toFixed(5)), Number(pos.lng.toFixed(5))];
        if (circleRef.current) {
          circleRef.current.setLatLng(pos);
        }
        if (onCenterChange) {
          onCenterChange(coords);
        }
        const resolvedAddress = await reverseGeocodeCoords(coords[0], coords[1]);
        centerMarker.setTooltipContent(`📍 ${resolvedAddress}`).openTooltip();
        if (onAddressResolved) {
          onAddressResolved(resolvedAddress, coords);
        }
      });

      centerMarkerRef.current = centerMarker;
    }

    // Update radius circle
    if (circleRef.current) {
      circleRef.current.remove();
    }
    const safeRadius = typeof radiusKm === 'number' && isFinite(radiusKm) && radiusKm > 0 ? radiusKm : 10;
    circleRef.current = L.circle([flyLat, flyLng], {
      radius: safeRadius * 1000,
      color: '#3b82f6',
      fillColor: '#93c5fd',
      fillOpacity: 0.15,
      weight: 1.5,
    }).addTo(map);

    // Clear previous property markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add property pins
    properties.forEach(prop => {
      if (!prop.location?.coordinates || prop.location.coordinates.length < 2) return;
      const [lng, lat] = prop.location.coordinates;
      const numLat = Number(lat);
      const numLng = Number(lng);
      if (!isFinite(numLat) || isNaN(numLat) || !isFinite(numLng) || isNaN(numLng)) return;

      const isSelected = selectedPropertyId === prop.id;

      const markerHtml = `
        <div style="
          background-color: ${isSelected ? '#1e40af' : '#0f172a'};
          color: white;
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          border: 2px solid ${isSelected ? '#60a5fa' : '#ffffff'};
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          transform: translateY(-50%);
        ">
          ₹${(prop.rentPerMonth / 1000).toFixed(1)}k
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-prop-pin',
        html: markerHtml,
        iconSize: [50, 24],
        iconAnchor: [25, 12],
      });

      const marker = L.marker([numLat, numLng], { icon: customIcon }).addTo(map);

      marker.bindPopup(`
        <div class="p-1 min-w-[170px]">
          <h4 class="font-bold text-sm text-slate-900 dark:text-white mb-1">${prop.title}</h4>
          <p class="text-xs text-slate-600 dark:text-slate-300 mb-1">₹${prop.rentPerMonth.toLocaleString()} / month</p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 capitalize">${prop.propertyType.replace('_', ' ')}</p>
        </div>
      `);

      marker.on('click', () => {
        if (onSelectProperty) {
          onSelectProperty(prop);
        }
      });

      markersRef.current.push(marker);
    });
  }, [properties, center, radiusKm, selectedPropertyId]);

  return (
    <div className="relative w-full h-full min-h-[300px] sm:min-h-[350px] rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-xs isolate z-0">
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px] sm:min-h-[350px]" />
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-slate-300 shadow-xs border border-gray-200 dark:border-slate-700 pointer-events-none flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
        <span>Showing properties within {radiusKm} km</span>
      </div>
    </div>
  );
};
