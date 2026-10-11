import React, { useState, useEffect } from 'react';
import { BookingRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { CalendarCheck, Star, ShieldCheck, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

export const MyBookingsPage: React.FC = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Review state
  const [reviewScoreMap, setReviewScoreMap] = useState<Record<string, number>>({});
  const [reviewTextMap, setReviewTextMap] = useState<Record<string, string>>({});
  const [submittingReviewId, setSubmittingReviewId] = useState<string | null>(null);
  const [reviewMessageMap, setReviewMessageMap] = useState<Record<string, string>>({});

  const fetchBookings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/bookings/sent', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const handleCancelBooking = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchBookings();
      }
    } catch {
      // ignore
    }
  };

  const handleCompleteStay = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/bookings/${id}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchBookings();
      }
    } catch {
      // ignore
    }
  };

  const handleSubmitReview = async (bookingId: string) => {
    if (!token) return;
    const score = reviewScoreMap[bookingId] || 5;
    const text = reviewTextMap[bookingId] || '';

    setSubmittingReviewId(bookingId);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingRequestId: bookingId,
          score,
          text,
          target: 'property',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReviewMessageMap({ ...reviewMessageMap, [bookingId]: data.error || 'Failed to submit review' });
      } else {
        setReviewMessageMap({ ...reviewMessageMap, [bookingId]: 'Verified review published!' });
        fetchBookings();
      }
    } catch {
      setReviewMessageMap({ ...reviewMessageMap, [bookingId]: 'Error submitting review' });
    } finally {
      setSubmittingReviewId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          My bookings
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Track your rental applications, stay completion, and post verified resident reviews.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-gray-500">Loading your bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl border border-gray-200 space-y-2">
          <p className="text-sm font-semibold text-gray-700">No booking requests submitted yet.</p>
          <p className="text-xs text-gray-500">Browse available properties and send a booking request to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((bk) => (
            <div
              key={bk.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{bk.propertyTitle}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Move-in {new Date(bk.moveInDate).toLocaleDateString()} | {bk.durationMonths} months | {bk.headcount} {bk.headcount === 1 ? 'person' : 'people'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      bk.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : bk.status === 'accepted'
                        ? 'bg-blue-100 text-blue-800'
                        : bk.status === 'completed_stay'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {bk.status.replace('_', ' ')}
                  </span>

                  {bk.status === 'pending' && (
                    <button
                      onClick={() => handleCancelBooking(bk.id)}
                      className="px-3 py-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold"
                    >
                      Cancel request
                    </button>
                  )}

                  {bk.status === 'accepted' && (
                    <button
                      onClick={() => handleCompleteStay(bk.id)}
                      className="px-3.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs"
                    >
                      Mark stay complete
                    </button>
                  )}
                </div>
              </div>

              {bk.message && (
                <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <span className="font-semibold text-gray-800">Your note: </span>
                  {bk.message}
                </p>
              )}

              {/* Review Section (Unlocks only on completed_stay) */}
              {bk.status === 'completed_stay' && (
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Write a review (verified stay)
                    </h4>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      One verified review per tenancy
                    </span>
                  </div>

                  {bk.hasReviewed || bk.review ? (
                    <div className="p-3 bg-white rounded-lg border border-emerald-100 text-xs space-y-1">
                      <div className="flex items-center gap-1 font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        ★ {bk.review?.score || 5} / 5 Score submitted
                      </div>
                      <p className="text-gray-700 italic">"{bk.review?.text || 'Great stay!'}"</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviewMessageMap[bk.id] && (
                        <div className="p-2 bg-emerald-100 text-emerald-800 text-xs rounded font-medium">
                          {reviewMessageMap[bk.id]}
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-700 mb-1">Score</label>
                          <select
                            value={reviewScoreMap[bk.id] || 5}
                            onChange={(e) =>
                              setReviewScoreMap({ ...reviewScoreMap, [bk.id]: Number(e.target.value) })
                            }
                            className="text-xs rounded-lg border border-gray-300 p-2 bg-white focus:outline-none"
                          >
                            <option value={5}>5 - Excellent</option>
                            <option value={4}>4 - Very Good</option>
                            <option value={3}>3 - Average</option>
                            <option value={2}>2 - Poor</option>
                            <option value={1}>1 - Terrible</option>
                          </select>
                        </div>

                        <div className="flex-1">
                          <label className="block text-[11px] font-semibold text-gray-700 mb-1">Comment</label>
                          <input
                            type="text"
                            value={reviewTextMap[bk.id] || ''}
                            onChange={(e) =>
                              setReviewTextMap({ ...reviewTextMap, [bk.id]: e.target.value })
                            }
                            placeholder="How was the stay? Cleanliness, amenities, landlord cooperativeness..."
                            className="w-full text-xs rounded-lg border border-gray-300 p-2 bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleSubmitReview(bk.id)}
                        disabled={submittingReviewId === bk.id}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition disabled:opacity-50"
                      >
                        {submittingReviewId === bk.id ? 'Submitting...' : 'Submit review'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
