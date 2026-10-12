import React, { useState, useEffect } from 'react';
import { Property, BookingRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { MapPicker } from '../components/MapPicker';
import { MaintenanceModal } from '../components/MaintenanceModal';
import { RentAgreementModal } from '../components/RentAgreementModal';
import {
  Building,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Upload,
  Trash2,
  RefreshCw,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Wrench,
  FileText,
} from 'lucide-react';

export const OwnerDashboardPage: React.FC = () => {
  const { user, token, refreshUser } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // New Modals State
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  // New property form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('single_room');
  const [rentPerMonth, setRentPerMonth] = useState('6500');
  const [depositAmount, setDepositAmount] = useState('10000');
  const [genderPolicy, setGenderPolicy] = useState('any');
  const [address, setAddress] = useState('Plot 45, Sector 17, Rohini, Delhi');
  const [nearestCollege, setNearestCollege] = useState('Delhi Technological University (DTU - Gate 2)');
  const [coords, setCoords] = useState<[number, number]>([77.1175, 28.7495]); // [lng, lat]

  // Amenities
  const [amenities, setAmenities] = useState({
    wifi: true,
    ac: true,
    furnished: true,
    foodIncluded: false,
    parking: true,
    laundry: true,
    powerBackup: true,
    attachedBathroom: true,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification upload dialog
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationDocUrl, setVerificationDocUrl] = useState(
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600'
  );
  const [verificationSubmitting, setVerificationSubmitting] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [propsRes, bkRes] = await Promise.all([
        fetch('/api/properties/mine/all', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/bookings/received', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (propsRes.ok) {
        const pData = await propsRes.json();
        setProperties(pData);
      }
      if (bkRes.ok) {
        const bData = await bkRes.json();
        setBookingRequests(bData);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleToggleStatus = async (propId: string, currentStatus: string) => {
    if (!token) return;
    const newStatus = currentStatus === 'available' ? 'rented' : 'available';
    try {
      const res = await fetch(`/api/properties/${propId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      // ignore
    }
  };

  const handleConfirmStillAvailable = async (propId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/properties/${propId}/confirm-active`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteProperty = async (propId: string) => {
    if (!token || !window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      const res = await fetch(`/api/properties/${propId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      // ignore
    }
  };

  const handleAcceptBooking = async (bkId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/bookings/${bkId}/accept`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      // ignore
    }
  };

  const handleDeclineBooking = async (bkId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/bookings/${bkId}/decline`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      // ignore
    }
  };

  const handleCompleteBooking = async (bkId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/bookings/${bkId}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      // ignore
    }
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!user?.isVerified) {
      setFormError('Blocked until an admin verifies the owner. Please submit verification proof below.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          propertyType,
          rentPerMonth: Number(rentPerMonth),
          depositAmount: Number(depositAmount),
          genderPolicy,
          address,
          nearestCollege,
          location: {
            type: 'Point',
            coordinates: coords,
          },
          amenities,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to publish listing');
      } else {
        setFormSuccess('Property listing published successfully with live availability!');
        setTitle('');
        setDescription('');
        fetchData();
      }
    } catch {
      setFormError('Network error while creating listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!token) return;
    setVerificationSubmitting(true);
    try {
      const res = await fetch('/api/users/submit-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ docUrl: verificationDocUrl }),
      });
      if (res.ok) {
        await refreshUser();
        setShowVerificationModal(false);
        setFormError(null);
      }
    } catch {
      // ignore
    } finally {
      setVerificationSubmitting(false);
    }
  };

  // Find any stale listings needing prompt (Page 14 wireframe)
  const staleListing = properties.find((p) => p.isStale && p.status === 'available');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Owner Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            Manage your properties, live availability toggle, and incoming student booking requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMaintenanceModal(true)}
            className="px-3 py-1.5 bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 rounded-xl text-xs font-bold hover:bg-orange-100 transition flex items-center gap-1.5 shadow-2xs"
          >
            <Wrench className="w-3.5 h-3.5 text-orange-600" />
            Maintenance Tickets
          </button>

          <button
            type="button"
            onClick={() => setShowAgreementModal(true)}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-1.5 shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            Draft Lease Agreement
          </button>

          {user?.isVerified ? (
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Verified Owner
            </span>
          ) : (
            <button
              onClick={() => setShowVerificationModal(true)}
              className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-full text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Verification: {user?.verificationStatus === 'pending' ? 'Pending Admin Review' : 'Action Required'}
            </button>
          )}
        </div>
      </div>

      {/* Stale Listing Nudge Banner (Page 14 Wireframe) */}
      {staleListing && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-xl space-y-3 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Still available?
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                <span className="font-semibold">{staleListing.title}</span> had no activity for {staleListing.daysSinceConfirmed ?? 7} days. Confirm so students see live data.
              </p>
            </div>
            <span className="text-[11px] text-amber-700 dark:text-amber-400 italic hidden sm:block">
              No reply in 3 more days: listing auto-hides
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => handleConfirmStillAvailable(staleListing.id)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
            >
              Yes, still available
            </button>
            <button
              onClick={() => handleToggleStatus(staleListing.id, staleListing.status)}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold transition"
            >
              Mark rented
            </button>
            <button
              onClick={() => handleDeleteProperty(staleListing.id)}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-xs font-semibold transition"
            >
              Remove listing
            </button>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List New Property Form (6 Cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
            <h2 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" /> List new property
            </h2>
            <span className="text-xs text-gray-500 dark:text-slate-400">Live instantly upon publish</span>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200 rounded-lg text-xs font-medium space-y-1">
              <div>{formError}</div>
              {!user?.isVerified && (
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(true)}
                  className="font-bold underline hover:text-red-900 dark:hover:text-red-100"
                >
                  Submit Property Proof & ID Document for Admin Review
                </button>
              )}
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-semibold">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleCreateProperty} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Listing headline (e.g. Sunrise PG near Gate 2)"
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2.5 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2.5 focus:border-blue-500 focus:outline-none"
                >
                  <option value="single_room">Single room</option>
                  <option value="shared_room">Shared room</option>
                  <option value="pg">PG</option>
                  <option value="flat_1bhk">1BHK</option>
                  <option value="flat_2bhk">2BHK</option>
                  <option value="flat_3bhk_plus">3BHK+</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Rent (₹/mo)</label>
                <input
                  type="number"
                  value={rentPerMonth}
                  onChange={(e) => setRentPerMonth(e.target.value)}
                  className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2.5 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Deposit (₹)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Gender Policy</label>
                <select
                  value={genderPolicy}
                  onChange={(e) => setGenderPolicy(e.target.value)}
                  className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2.5 focus:border-blue-500 focus:outline-none"
                >
                  <option value="any">Any</option>
                  <option value="male_only">Male only</option>
                  <option value="female_only">Female only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Nearest College</label>
                <input
                  type="text"
                  value={nearestCollege}
                  onChange={(e) => setNearestCollege(e.target.value)}
                  placeholder="e.g. DTU Gate 2 (200m)"
                  className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, area, city"
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2.5 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            {/* Interactive Map Pin Picker */}
            <MapPicker
              value={coords}
              onChange={(newCoords) => setCoords(newCoords)}
              label="Click map to pin location for live proximity search"
            />

            {/* Amenities Checkboxes */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">Amenities</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-700 dark:text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.wifi}
                    onChange={(e) => setAmenities({ ...amenities, wifi: e.target.checked })}
                    className="rounded border-gray-300 dark:border-slate-700 text-blue-600"
                  />
                  WiFi
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.ac}
                    onChange={(e) => setAmenities({ ...amenities, ac: e.target.checked })}
                    className="rounded border-gray-300 dark:border-slate-700 text-blue-600"
                  />
                  AC
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.furnished}
                    onChange={(e) => setAmenities({ ...amenities, furnished: e.target.checked })}
                    className="rounded border-gray-300 dark:border-slate-700 text-blue-600"
                  />
                  Furnished
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.foodIncluded}
                    onChange={(e) => setAmenities({ ...amenities, foodIncluded: e.target.checked })}
                    className="rounded border-gray-300 dark:border-slate-700 text-blue-600"
                  />
                  Food
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.parking}
                    onChange={(e) => setAmenities({ ...amenities, parking: e.target.checked })}
                    className="rounded border-gray-300 dark:border-slate-700 text-blue-600"
                  />
                  Parking
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.laundry}
                    onChange={(e) => setAmenities({ ...amenities, laundry: e.target.checked })}
                    className="rounded border-gray-300 dark:border-slate-700 text-blue-600"
                  />
                  Laundry
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.powerBackup}
                    onChange={(e) => setAmenities({ ...amenities, powerBackup: e.target.checked })}
                    className="rounded border-gray-300 dark:border-slate-700 text-blue-600"
                  />
                  Power backup
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.attachedBathroom}
                    onChange={(e) => setAmenities({ ...amenities, attachedBathroom: e.target.checked })}
                    className="rounded border-gray-300 dark:border-slate-700 text-blue-600"
                  />
                  Attached bath
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Publish listing'}
            </button>

            {/* Wireframe Page 5 yellow indicator */}
            {!user?.isVerified && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs p-3 rounded-lg flex items-center justify-between">
                <span>Blocked until an admin verifies the owner</span>
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(true)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold"
                >
                  Verify now
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: My Properties & Booking Requests (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* My Properties Section */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h2 className="font-bold text-base text-gray-900 dark:text-white">My properties</h2>
              <span className="text-xs text-gray-500 dark:text-slate-400">{properties.length} listings</span>
            </div>

            {loading ? (
              <p className="text-xs text-gray-500 dark:text-slate-400 py-4 text-center">Loading properties...</p>
            ) : properties.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-slate-400 py-4 text-center">No properties listed yet.</p>
            ) : (
              <div className="space-y-2.5">
                {properties.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/40 hover:border-gray-300 dark:hover:border-slate-700 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{prop.title}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            prop.status === 'available'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {prop.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        ₹{prop.rentPerMonth.toLocaleString()} / mo • {prop.address}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(prop.id, prop.status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          prop.status === 'available'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                        }`}
                      >
                        {prop.status === 'available' ? 'Mark rented' : 'Relist'}
                      </button>
                      <button
                        onClick={() => handleDeleteProperty(prop.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition"
                        title="Delete listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booking Requests Section */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h2 className="font-bold text-base text-gray-900 dark:text-white">Booking requests</h2>
              <span className="text-xs text-gray-500 dark:text-slate-400">{bookingRequests.length} requests</span>
            </div>

            {loading ? (
              <p className="text-xs text-gray-500 dark:text-slate-400 py-4 text-center">Loading requests...</p>
            ) : bookingRequests.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-slate-400 py-4 text-center">No booking requests received yet.</p>
            ) : (
              <div className="space-y-3">
                {bookingRequests.map((bk) => (
                  <div
                    key={bk.id}
                    className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 space-y-2.5 bg-gray-50/50 dark:bg-slate-800/40"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">{bk.studentName}</h4>
                        <p className="text-xs text-gray-600 dark:text-slate-400">
                          {bk.studentCollege} | move-in {new Date(bk.moveInDate).toLocaleDateString()} | {bk.durationMonths} months | {bk.headcount} {bk.headcount === 1 ? 'person' : 'people'}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mt-0.5">
                          Listing: {bk.propertyTitle}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          bk.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : bk.status === 'accepted'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            : bk.status === 'completed_stay'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {bk.status.replace('_', ' ')}
                      </span>
                    </div>

                    {bk.message && (
                      <p className="text-xs text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800 italic">
                        "{bk.message}"
                      </p>
                    )}

                    {/* Actions: Accept, Decline, Complete */}
                    <div className="flex items-center gap-2 pt-1">
                      {bk.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAcceptBooking(bk.id)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineBooking(bk.id)}
                            className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold transition"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {bk.status === 'accepted' && (
                        <button
                          onClick={() => handleCompleteBooking(bk.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                        >
                          Complete stay
                        </button>
                      )}

                      {bk.status === 'completed_stay' && (
                        <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Tenancy completed (Reviews unlocked)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Owner Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-slate-800 space-y-4 text-gray-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Owner Verification Submission
              </h3>
              <button onClick={() => setShowVerificationModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-slate-400">
              StayNest gates rental listings to verified owners to prevent scams. Please provide proof of property ownership (electricity bill, property tax receipt, or ownership deed) and ID.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Document URL / Proof Link
              </label>
              <input
                type="text"
                value={verificationDocUrl}
                onChange={(e) => setVerificationDocUrl(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2.5 focus:border-blue-500 focus:outline-none"
                placeholder="https://..."
              />
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-lg text-xs text-blue-800 dark:text-blue-300">
              Current Status: <span className="font-bold capitalize">{user?.verificationStatus || 'None'}</span>
              {user?.verificationRejectReason && (
                <div className="mt-1 text-red-600 dark:text-red-400 font-semibold">
                  Reason for rejection: {user.verificationRejectReason}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowVerificationModal(false)}
                className="px-4 py-2 text-xs text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={verificationSubmitting}
                onClick={handleSubmitVerification}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                {verificationSubmitting ? 'Submitting...' : 'Submit to Admin Queue'}
              </button>
            </div>
          </div>
        </div>
      )}

      <MaintenanceModal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
      />

      <RentAgreementModal
        property={properties[0] || null}
        isOpen={showAgreementModal}
        onClose={() => setShowAgreementModal(false)}
      />
    </div>
  );
};
