import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapPickerProps {
  value: [number, number]; // [lng, lat]
  onChange: (coords: [number, number]) => void;
  height?: string;
  label?: string;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  value,
  onChange,
  height = '240px',
  label = 'Click on the map to pin exact location',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

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

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChange([Number(pos.lng.toFixed(5)), Number(pos.lat.toFixed(5))]);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        onChange([Number(e.latlng.lng.toFixed(5)), Number(e.latlng.lat.toFixed(5))]);
      });

      mapRef.current = map;
    } else {
      if (markerRef.current) {
        markerRef.current.setLatLng([initialLat, initialLng]);
      }
      mapRef.current.setView([initialLat, initialLng]);
    }
  }, [value]);

  return (
    <div className="space-y-1.5 relative isolate z-0">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-[11px]">
          [{value[0]?.toFixed(4)}, {value[1]?.toFixed(4)}]
        </span>
      </div>
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full rounded-lg border border-gray-300 overflow-hidden relative shadow-inner isolate z-0"
      />
    </div>
  );
};
