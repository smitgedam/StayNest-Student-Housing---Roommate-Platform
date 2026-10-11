import React from 'react';
import { Property } from '../types';
import { Wifi, Wind, Utensils, ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react';

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
      case 'pg': return 'PG';
      case 'flat_1bhk': return '1BHK Flat';
      case 'flat_2bhk': return '2BHK Flat';
      case 'flat_3bhk_plus': return '3BHK+ Flat';
      default: return type;
    }
  };

  const photo = property.photos?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600';

  return (
    <div
      className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden flex flex-col sm:flex-row hover:shadow-md ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
      }`}
    >
      {/* Thumbnail */}
      <div className="sm:w-44 h-40 sm:h-auto bg-gray-100 relative shrink-0">
        <img
          src={photo}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
          {formatType(property.propertyType)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-1 hover:text-blue-600 cursor-pointer" onClick={() => onViewDetails(property)}>
                {property.title}
              </h3>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
                <span className="truncate">{property.nearestCollege || property.address}</span>
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-base font-extrabold text-blue-700">
                ₹{property.rentPerMonth.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 block">/ month</span>
            </div>
          </div>

          {/* Key Amenities */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {property.amenities.wifi && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                <Wifi className="w-3 h-3" /> WiFi
              </span>
            )}
            {property.amenities.ac && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md">
                <Wind className="w-3 h-3" /> AC
              </span>
            )}
            {property.amenities.foodIncluded && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md">
                <Utensils className="w-3 h-3" /> Food
              </span>
            )}
            {property.amenities.powerBackup && (
              <span className="text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                Power backup
              </span>
            )}
            {property.amenities.attachedBathroom && (
              <span className="text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                Attach bath
              </span>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <ShieldCheck className="w-3 h-3" /> Verified Listing
            </span>
            {property.distanceKm !== undefined && property.distanceKm !== null && (
              <span className="text-xs text-gray-500 font-medium">
                {property.distanceKm} km away
              </span>
            )}
          </div>

          <button
            onClick={() => onViewDetails(property)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-900 text-white hover:bg-blue-600 transition shadow-xs"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};
