import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Property } from '../types';

interface PropertyMapProps {
  properties: Property[];
  center: [number, number]; // [lat, lng]
  radiusKm?: number;
  onSelectProperty?: (property: Property) => void;
  selectedPropertyId?: string | null;
}

export const PropertyMap: React.FC<PropertyMapProps> = ({
  properties,
  center,
  radiusKm = 20,
  onSelectProperty,
  selectedPropertyId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circleRef = useRef<L.Circle | null>(null);
  const centerMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center[0], center[1]],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Handle resize events so map tiles adapt cleanly to responsive viewport changes
      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  // Update map center, radius circle, and markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.setView([center[0], center[1]], map.getZoom() || 13);

    // Update or create center marker
    if (centerMarkerRef.current) {
      centerMarkerRef.current.setLatLng([center[0], center[1]]);
    } else {
      const centerIcon = L.divIcon({
        className: 'user-center-marker',
        html: `
          <div style="background-color: #2563eb; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(37,99,235,0.6);"></div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      centerMarkerRef.current = L.marker([center[0], center[1]], { icon: centerIcon })
        .addTo(map)
        .bindTooltip('Search location (Campus / You)', { permanent: false, direction: 'top' });
    }

    // Update radius circle
    if (circleRef.current) {
      circleRef.current.remove();
    }
    if (radiusKm > 0) {
      circleRef.current = L.circle([center[0], center[1]], {
        radius: radiusKm * 1000,
        color: '#3b82f6',
        fillColor: '#93c5fd',
        fillOpacity: 0.15,
        weight: 1.5,
      }).addTo(map);
    }

    // Clear previous property markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add property pins
    properties.forEach(prop => {
      if (!prop.location?.coordinates || prop.location.coordinates.length < 2) return;
      const [lng, lat] = prop.location.coordinates;
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

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

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
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-slate-300 shadow-xs border border-gray-200 dark:border-slate-700 pointer-events-none">
        Showing properties within {radiusKm} km
      </div>
    </div>
  );
};
