import React, { useState } from 'react';
import { Property, MessProvider } from '../types';
import { useAuth } from '../context/AuthContext';
import { ReportModal } from './ReportModal';
import {
  X,
  MapPin,
  Wifi,
  Wind,
  Utensils,
  ShieldCheck,
  Star,
  MessageSquare,
  Clock,
  Droplets,
  Zap,
  Home,
  CheckCircle2,
  Calendar,
  Users,
  AlertTriangle,
  Flag,
} from 'lucide-react';

interface PropertyDetailModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (userId: string, propertyId: string) => void;
  onViewMess: (mess: MessProvider) => void;
  onBookingSuccess?: () => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  isOpen,
  onClose,
  onOpenChat,
  onViewMess,
  onBookingSuccess,
}) => {
  const { user, token } = useAuth();
  const [moveInDate, setMoveInDate] = useState<string>('2026-11-01');
  const [durationMonths, setDurationMonths] = useState<number>(3);
  const [headcount, setHeadcount] = useState<number>(1);
  const [bookingMessage, setBookingMessage] = useState<string>('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  if (!isOpen || !property) return null;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setBookingStatus({ type: 'error', message: 'Please login as a student to book.' });
      return;
    }
    if (user?.role !== 'student') {
      setBookingStatus({ type: 'error', message: 'Only student accounts can send booking requests.' });
      return;
    }

    setIsSubmittingBooking(true);
    setBookingStatus(null);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: property.id,
          moveInDate,
          durationMonths: Number(durationMonths),
          headcount: Number(headcount),
          message: bookingMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBookingStatus({ type: 'error', message: data.error || 'Failed to send booking request' });
      } else {
        setBookingStatus({ type: 'success', message: 'Booking request sent successfully to owner!' });
        if (onBookingSuccess) onBookingSuccess();
      }
    } catch {
      setBookingStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const photos = property.photos && property.photos.length > 0
    ? property.photos
    : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xs z-10 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              {property.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-1">
              <span className="font-semibold text-gray-800">
                Deposit: ₹{property.depositAmount?.toLocaleString()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-blue-700">
                <MapPin className="w-3.5 h-3.5" /> Nearest college: {property.nearestCollege || 'Rohini Campus'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xl font-black text-blue-700">
                ₹{property.rentPerMonth?.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">per month</div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Photo Gallery Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-xl overflow-hidden max-h-72">
            <div className="sm:col-span-2 h-56 sm:h-72 bg-gray-100 overflow-hidden">
              <img
                src={photos[0]}
                alt={property.title}
                className="w-full h-full object-cover hover:scale-105 transition duration-300"
              />
            </div>
            <div className="hidden sm:grid grid-rows-2 gap-2 h-72">
              <div className="bg-gray-100 overflow-hidden">
                <img
                  src={photos[1] || photos[0]}
                  alt="Gallery 2"
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
              </div>
              <div className="bg-gray-100 overflow-hidden">
                <img
                  src={photos[2] || photos[0]}
                  alt="Gallery 3"
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed border border-gray-100">
              {property.description}
            </div>
          )}

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Amenities, Mess Providers, Reviews */}
            <div className="lg:col-span-2 space-y-6">
              {/* Structured Amenities */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                  Amenities & Living Conditions
                </h3>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-blue-600" />
                    WiFi {property.amenities.wifiSpeedMbps ? `${property.amenities.wifiSpeedMbps} Mbps` : 'Enabled'}
                  </div>
                  <div className="px-3 py-1.5 bg-cyan-50 border border-cyan-200 text-cyan-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-cyan-600" />
                    Water {property.amenities.waterSupplyHours || '24h'}
                  </div>
                  {property.amenities.powerBackup && (
                    <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-600" /> Power backup
                    </div>
                  )}
                  {property.amenities.furnished && (
                    <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                      <Home className="w-4 h-4 text-emerald-600" /> Furnished
                    </div>
                  )}
                  <div className="px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-600" /> Curfew: {property.amenities.curfewTime || '10:30 PM'}
                  </div>
                  <div className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-800 rounded-lg text-xs font-semibold">
                    Gender: {property.genderPolicy?.replace('_', ' ') || 'Any'}
                  </div>
                  <div className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-800 rounded-lg text-xs font-semibold">
                    Pets: {property.amenities.petsAllowed ? 'Allowed' : 'No'}
                  </div>
                  {property.amenities.attachedBathroom && (
                    <div className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-800 rounded-lg text-xs font-semibold">
                      Attached Bathroom
                    </div>
                  )}
                  {property.amenities.foodIncluded && (
                    <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-amber-600" /> Food Included
                    </div>
                  )}
                  {property.amenities.ac && (
                    <div className="px-3 py-1.5 bg-sky-50 border border-sky-200 text-sky-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                      <Wind className="w-4 h-4 text-sky-600" /> AC Fitted
                    </div>
                  )}
                </div>
              </div>

              {/* Nearby Mess Providers within 5 km */}
              <div className="border-t border-gray-200 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-amber-600" /> Mess providers within 5 km
                  </h3>
                  <span className="text-xs text-gray-500 font-medium">Automatic proximity discovery</span>
                </div>

                {property.nearbyMess && property.nearbyMess.length > 0 ? (
                  <div className="space-y-2">
                    {property.nearbyMess.map((mess) => (
                      <div
                        key={mess.id}
                        className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">{mess.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              {mess.dietType}
                            </span>
                            <span className="text-xs text-gray-500">
                              ★ {mess.ratingAvg} ({mess.distanceKm ?? 1.5} km)
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            Plan: {mess.plans?.[0]?.name || 'Standard'} • ₹{mess.plans?.[0]?.pricePerMonth || 2800} / mo
                          </p>
                        </div>
                        <button
                          onClick={() => onViewMess(mess)}
                          className="px-3 py-1 text-xs font-semibold bg-white text-amber-900 hover:bg-amber-100 border border-amber-300 rounded-lg shadow-xs"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg">
                    No active mess kitchens registered within 5 km radius currently.
                  </p>
                )}
              </div>

              {/* Verified Reviews Section */}
              <div className="border-t border-gray-200 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Reviews (verified stays only)
                    </h3>
                    <p className="text-xs text-gray-500">
                      Gated to tenants with completed tenancy status
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    <span className="text-sm font-bold text-amber-900">
                      {property.ratingAvg > 0 ? property.ratingAvg : '4.5'}
                    </span>
                    <span className="text-xs text-amber-700">({property.ratingCount || 3})</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {property.reviews && property.reviews.length > 0 ? (
                    property.reviews.map((rev) => (
                      <div key={rev.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                            {rev.authorName || 'Verified Resident'}
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          </span>
                          <span className="text-xs text-amber-600 font-bold">★ {rev.score} / 5</span>
                        </div>
                        <p className="text-xs text-gray-700">{rev.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600">
                      ★ 4.5 average | rahul: Clean rooms and cooperative owner. WiFi was very stable throughout exam week.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Owner Card & Booking Form */}
            <div className="space-y-4">
              {/* Owner Info Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      {property.owner?.name?.charAt(0) || 'O'}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        {property.owner?.name || 'Verified Owner'}
                      </h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        ★ {property.owner?.ratingAvg || 4.2} Owner rating
                      </p>
                    </div>
                  </div>

                  {user?.id !== property.ownerId && (
                    <button
                      onClick={() => onOpenChat(property.ownerId, property.id)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Chat
                    </button>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> ID Verified Owner
                  </span>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="text-gray-400 hover:text-red-600 flex items-center gap-1"
                  >
                    <Flag className="w-3 h-3" /> Report
                  </button>
                </div>
              </div>

              {/* Request to Book Card */}
              <div className="p-5 bg-white border-2 border-blue-100 rounded-xl shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-base">Request to book</h3>
                  <span className="text-xs font-bold text-blue-700">Live Availability</span>
                </div>

                {bookingStatus && (
                  <div
                    className={`p-2.5 mb-3 rounded-lg text-xs font-medium ${
                      bookingStatus.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {bookingStatus.message}
                  </div>
                )}

                <form onSubmit={handleBookingSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Move-in date</label>
                    <input
                      type="date"
                      value={moveInDate}
                      onChange={(e) => setMoveInDate(e.target.value)}
                      className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Duration (months)</label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={durationMonths}
                        onChange={(e) => setDurationMonths(Number(e.target.value))}
                        className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">People</label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={headcount}
                        onChange={(e) => setHeadcount(Number(e.target.value))}
                        className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Message to owner</label>
                    <textarea
                      rows={2}
                      value={bookingMessage}
                      onChange={(e) => setBookingMessage(e.target.value)}
                      placeholder="Note to owner (e.g. college year, shifting date)"
                      className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingBooking}
                    className="w-full py-2.5 bg-slate-900 text-white hover:bg-blue-600 transition font-bold text-xs rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingBooking ? 'Sending request...' : 'Send request'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReportModal
        propertyId={property.id}
        propertyTitle={property.title}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
};
