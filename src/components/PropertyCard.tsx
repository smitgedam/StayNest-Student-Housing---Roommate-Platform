import React from 'react';
import { Property } from '../types';
import { Wifi, Wind, Utensils, ShieldCheck, MapPin, Zap, Bath } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onViewDetails: (property: Property) => void;
  isSelected?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onViewDetails,
  isSelected = false,
}) => {
  const formatType = (type: string) => {
    switch (type) {
      case 'single_room': return 'Single Room';
      case 'shared_room': return 'Shared Room';
      case 'pg': return 'PG Student Housing';
      case 'flat_1bhk': return '1BHK Apartment';
      case 'flat_2bhk': return '2BHK Apartment';
      case 'flat_3bhk_plus': return '3BHK+ Flat';
      default: return type;
    }
  };

  const photo = property.photos?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600';

  return (
    <article
      onClick={() => onViewDetails(property)}
      className={`group bg-white dark:bg-slate-900 rounded-xl border transition-all duration-200 overflow-hidden flex flex-col sm:flex-row cursor-pointer hover:shadow-md w-full min-w-0 ${
        isSelected
          ? 'border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900/40'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Thumbnail */}
      <div className="w-full sm:w-36 md:w-40 lg:w-44 h-40 sm:h-auto bg-slate-100 dark:bg-slate-800 relative shrink-0 overflow-hidden">
        <img
          src={photo}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent sm:hidden" />
        <div className="absolute bottom-2 left-2 sm:hidden text-white font-semibold text-xs drop-shadow-sm">
          {formatType(property.propertyType)}
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Kicker & Price row */}
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 hidden sm:block">
                {formatType(property.propertyType)}
              </span>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mt-0.5" title={property.title}>
                {property.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                <span className="truncate">{property.nearestCollege || property.address}</span>
              </p>
            </div>

            <div className="text-right shrink-0 pl-1">
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white whitespace-nowrap block">
                ₹{property.rentPerMonth.toLocaleString()}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 block font-normal leading-tight">per month</span>
            </div>
          </div>

          {/* Clean Typographic Amenities */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-300 mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 min-w-0">
            {property.amenities.wifi && (
              <span className="inline-flex items-center gap-1 shrink-0">
                <Wifi className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> WiFi
              </span>
            )}
            {property.amenities.wifi && (property.amenities.ac || property.amenities.foodIncluded) && (
              <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            )}
            {property.amenities.ac && (
              <span className="inline-flex items-center gap-1 shrink-0">
                <Wind className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> AC
              </span>
            )}
            {property.amenities.ac && property.amenities.foodIncluded && (
              <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            )}
            {property.amenities.foodIncluded && (
              <span className="inline-flex items-center gap-1 shrink-0">
                <Utensils className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Meals
              </span>
            )}
            {property.amenities.powerBackup && (
              <>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 shrink-0">
                  <Zap className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" /> Backup
                </span>
              </>
            )}
            {property.amenities.attachedBathroom && (
              <>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 shrink-0">
                  <Bath className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Bath
                </span>
              </>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 text-xs min-w-0 truncate">
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Verified
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
              🚶 {property.distanceKm ? Math.round(property.distanceKm * 12) : 8}m walk
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
              🛡️ 9.1 Safety
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(property);
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white transition shadow-xs shrink-0 whitespace-nowrap"
          >
            View Details
          </button>
        </div>
      </div>
    </article>
  );
};
