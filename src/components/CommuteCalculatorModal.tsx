import React, { useState } from 'react';
import { Property } from '../types';
import {
  X,
  Navigation,
  Clock,
  Footprints,
  Bike,
  Car,
  Train,
  MapPin,
  TrendingDown,
  DollarSign,
  Fuel,
  Compass,
} from 'lucide-react';

interface CommuteCalculatorModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

interface CampusDestination {
  id: string;
  name: string;
  lat: number;
  lng: number;
  metroStation: string;
  metroLine: string;
  metroColor: string;
}

const TOP_CAMPUSES: CampusDestination[] = [
  {
    id: 'dtu_main',
    name: 'Delhi Technological University (DTU) — Main Gate',
    lat: 28.7495,
    lng: 77.1175,
    metroStation: 'Samaypur Badli (Yellow Line)',
    metroLine: 'Yellow Line',
    metroColor: 'bg-amber-400 text-amber-950',
  },
  {
    id: 'dtu_gate2',
    name: 'DTU — Gate 2 (Hostel & Sports Complex)',
    lat: 28.7512,
    lng: 77.1190,
    metroStation: 'Samaypur Badli (Yellow Line)',
    metroLine: 'Yellow Line',
    metroColor: 'bg-amber-400 text-amber-950',
  },
  {
    id: 'nsut_gate1',
    name: 'NSUT Dwarka — Gate 1 (Netaji Subhas)',
    lat: 28.6096,
    lng: 77.0366,
    metroStation: 'Dwarka Mor (Blue Line)',
    metroLine: 'Blue Line',
    metroColor: 'bg-blue-600 text-white',
  },
  {
    id: 'du_north',
    name: 'Delhi University (DU) — North Campus Arts Faculty',
    lat: 28.6892,
    lng: 77.2104,
    metroStation: 'Vishwavidyalaya (Yellow Line)',
    metroLine: 'Yellow Line',
    metroColor: 'bg-amber-400 text-amber-950',
  },
  {
    id: 'iit_delhi',
    name: 'IIT Delhi — Main Gate Hauz Khas',
    lat: 28.5450,
    lng: 77.1926,
    metroStation: 'IIT (Magenta Line)',
    metroLine: 'Magenta Line',
    metroColor: 'bg-fuchsia-600 text-white',
  },
  {
    id: 'ipu_dwarka',
    name: 'GGSIPU — Sector 16C Dwarka Campus',
    lat: 28.5950,
    lng: 77.0195,
    metroStation: 'Dwarka Sector 14 (Blue Line)',
    metroLine: 'Blue Line',
    metroColor: 'bg-blue-600 text-white',
  },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const CommuteCalculatorModal: React.FC<CommuteCalculatorModalProps> = ({
  property,
  isOpen,
  onClose,
}) => {
  const [selectedCampusId, setSelectedCampusId] = useState<string>('dtu_main');
  const [activeMode, setActiveMode] = useState<'walk' | 'bike' | 'auto' | 'metro'>('walk');

  if (!isOpen || !property) return null;

  const [propLng, propLat] = property.location?.coordinates || [77.1175, 28.7495];
  const targetCampus = TOP_CAMPUSES.find(c => c.id === selectedCampusId) || TOP_CAMPUSES[0];

  const distanceKm = Math.max(0.3, calculateDistance(propLat, propLng, targetCampus.lat, targetCampus.lng));

  // Mode calculations
  // Walking: ~12 mins / km, ~65 calories / km
  const walkMinutes = Math.round(distanceKm * 12);
  const walkCalories = Math.round(distanceKm * 65);
  const walkSteps = Math.round(distanceKm * 1350);

  // Cycling: ~3.5 mins / km, CO2 saved ~160g / km
  const bikeMinutes = Math.max(2, Math.round(distanceKm * 3.5));
  const bikeCo2Saved = Math.round(distanceKm * 160);

  // Auto / E-Rickshaw: ~2.5 mins / km + 2 min wait
  const autoMinutes = Math.max(4, Math.round(distanceKm * 2.5 + 2));
  const autoFare = distanceKm <= 1.5 ? 20 : Math.round(25 + (distanceKm - 1.5) * 12);

  // Metro: Nearest station + train ride
  const metroWalkMin = Math.round(Math.min(distanceKm, 1.2) * 12);
  const metroRideMin = Math.max(6, Math.round(distanceKm * 2));
  const metroTotalMin = metroWalkMin + metroRideMin;
  const metroFare = distanceKm <= 2 ? 10 : distanceKm <= 5 ? 20 : distanceKm <= 12 ? 30 : 40;

  // Monthly 22-day college commute budget
  const monthlyAutoCost = autoFare * 2 * 22;
  const monthlyMetroCost = metroFare * 2 * 22;
  const monthlyWalkSavings = monthlyAutoCost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Campus Commute & Transit Calculator
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Accurate multi-modal transit times & cost matrix for students
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Property Context */}
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Starting Origin
              </span>
              <p className="font-bold text-gray-900 dark:text-white truncate text-xs sm:text-sm">
                {property.title}
              </p>
              <p className="text-gray-500 dark:text-slate-400 text-xs truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                {property.address}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-800">
                {distanceKm} km away
              </span>
            </div>
          </div>

          {/* Campus Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
              Select Campus Destination / Gate:
            </label>
            <select
              value={selectedCampusId}
              onChange={(e) => setSelectedCampusId(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-gray-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none font-medium shadow-2xs"
            >
              {TOP_CAMPUSES.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setActiveMode('walk')}
              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                activeMode === 'walk'
                  ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold ring-2 ring-blue-500/20'
                  : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Footprints className="w-4 h-4" />
              <span className="text-xs">Walking</span>
              <span className="text-[11px] font-extrabold">{walkMinutes} min</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('bike')}
              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                activeMode === 'bike'
                  ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/20'
                  : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span className="text-xs">Bicycle</span>
              <span className="text-[11px] font-extrabold">{bikeMinutes} min</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('auto')}
              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                activeMode === 'auto'
                  ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold ring-2 ring-amber-500/20'
                  : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Car className="w-4 h-4" />
              <span className="text-xs">Auto / E-Rick</span>
              <span className="text-[11px] font-extrabold">{autoMinutes} min</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('metro')}
              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                activeMode === 'metro'
                  ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold ring-2 ring-indigo-500/20'
                  : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Train className="w-4 h-4" />
              <span className="text-xs">Delhi Metro</span>
              <span className="text-[11px] font-extrabold">{metroTotalMin} min</span>
            </button>
          </div>

          {/* Mode Detailed Breakdown Box */}
          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-4 border border-gray-200 dark:border-slate-700/80 space-y-3">
            {activeMode === 'walk' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Footprints className="w-4 h-4 text-blue-600" /> Walking Route Breakdown
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                    ₹0 Commute Cost
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-gray-200 dark:border-slate-700">
                  <div>
                    <span className="text-gray-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Estimated Time</span>
                    <span className="text-base font-extrabold text-gray-900 dark:text-white">{walkMinutes} mins</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Total Steps</span>
                    <span className="text-base font-extrabold text-gray-900 dark:text-white">~{walkSteps}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Calories Burned</span>
                    <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">{walkCalories} kcal</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 italic">
                  {walkMinutes <= 15
                    ? '⚡ Ideal daily walk distance! No autos needed for daily college lectures.'
                    : 'A bit long for daily walking during summer; consider bicycle or campus shared e-rickshaw.'}
                </p>
              </div>
            )}

            {activeMode === 'bike' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Bike className="w-4 h-4 text-emerald-600" /> Bicycle / Yulu Commute
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                    Eco-Friendly
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-gray-200 dark:border-slate-700">
                  <div>
                    <span className="text-gray-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Transit Time</span>
                    <span className="text-base font-extrabold text-gray-900 dark:text-white">{bikeMinutes} mins</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Distance</span>
                    <span className="text-base font-extrabold text-gray-900 dark:text-white">{distanceKm} km</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-slate-500 block text-[10px] uppercase font-bold">CO2 Emission Saved</span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{bikeCo2Saved}g</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  Green commute! High-cycle density lanes exist around campus gates with safe student cycle stands.
                </p>
              </div>
            )}

            {activeMode === 'auto' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-amber-600" /> Shared E-Rickshaw / Auto
                  </span>
                  <span className="font-mono text-amber-700 dark:text-amber-300 font-bold text-xs bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">
                    ~₹{autoFare} per ride
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-gray-200 dark:border-slate-700">
                  <div>
                    <span className="text-gray-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Travel Time</span>
                    <span className="text-base font-extrabold text-gray-900 dark:text-white">{autoMinutes} mins</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Shared E-Rick Fare</span>
                    <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">₹{autoFare}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Daily Round Trip</span>
                    <span className="text-base font-extrabold text-gray-900 dark:text-white">₹{autoFare * 2}</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  E-rickshaws frequently ply every 2 minutes from nearby road crossings directly to university gate.
                </p>
              </div>
            )}

            {activeMode === 'metro' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Train className="w-4 h-4 text-indigo-600" /> Delhi Metro Rail
                  </span>
                  <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${targetCampus.metroColor}`}>
                    {targetCampus.metroStation}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-gray-200 dark:border-slate-700">
                  <div>
                    <span className="text-gray-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Walk to Station</span>
                    <span className="text-base font-extrabold text-gray-900 dark:text-white">{metroWalkMin} mins</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Metro Travel</span>
                    <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">{metroRideMin} mins</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Student SmartCard</span>
                    <span className="text-base font-extrabold text-gray-900 dark:text-white">₹{metroFare}</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  Air-conditioned and punctually reliable. 10% discount on non-peak hours with Delhi Metro SmartCard.
                </p>
              </div>
            )}
          </div>

          {/* Monthly Budget Projection */}
          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40 space-y-1.5">
            <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm">
              <span className="flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-emerald-600" /> Monthly College Commute Projection (22 Days)
              </span>
              <span className="font-mono text-emerald-700 dark:text-emerald-300">
                Save up to ₹{monthlyWalkSavings.toLocaleString()}/mo
              </span>
            </div>
            <div className="text-[11px] text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
              Living here: Walking/Cycling saves you ₹{monthlyWalkSavings.toLocaleString()} every month compared to daily auto rides (₹{monthlyAutoCost.toLocaleString()}/mo).
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-slate-800 dark:hover:bg-blue-500 transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
