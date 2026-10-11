import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth';
import { BookingRequest } from '../types';

export const bookingsRouter = Router();

// POST /api/bookings - Student submits structured booking request
bookingsRouter.post('/', authMiddleware, requireRole('student'), (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { propertyId, moveInDate, durationMonths, headcount, message } = req.body;

  if (!propertyId || !moveInDate || !durationMonths) {
    res.status(400).json({ error: 'Property ID, move-in date, and duration in months are required.' });
    return;
  }

  const property = db.getPropertyById(propertyId);
  if (!property) {
    res.status(404).json({ error: 'Property not found.' });
    return;
  }

  if (property.status !== 'available') {
    res.status(400).json({ error: 'This property is currently marked as rented and is not accepting bookings.' });
    return;
  }

  const now = new Date().toISOString();
  const newBooking: BookingRequest = {
    id: `bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    propertyId: property.id,
    studentId: req.user.id,
    ownerId: property.ownerId,
    moveInDate,
    durationMonths: Number(durationMonths) || 1,
    headcount: Number(headcount) || 1,
    message: message || '',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  db.createBooking(newBooking);

  res.status(201).json({
    message: 'Booking request sent successfully to property owner.',
    booking: newBooking,
  });
});

// GET /api/bookings/received - Owner receives requests
bookingsRouter.get('/received', authMiddleware, requireRole('owner', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const bookings = db.getBookings().filter(b => b.ownerId === req.user!.id);

  const enriched = bookings.map(b => {
    const student = db.getUserById(b.studentId);
    const property = db.getPropertyById(b.propertyId);
    return {
      ...b,
      studentName: student ? student.name : 'Student',
      studentEmail: student ? student.email : '',
      studentCollege: student ? student.college : 'College Student',
      studentPhone: student ? student.phone : '',
      propertyTitle: property ? property.title : 'Property',
      propertyRent: property ? property.rentPerMonth : 0,
      propertyAddress: property ? property.address : '',
    };
  });

  // Sort newest first
  enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(enriched);
});

// GET /api/bookings/sent - Student views their booking requests
bookingsRouter.get('/sent', authMiddleware, requireRole('student', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const bookings = db.getBookings().filter(b => b.studentId === req.user!.id);

  const enriched = bookings.map(b => {
    const owner = db.getUserById(b.ownerId);
    const property = db.getPropertyById(b.propertyId);
    const existingReview = db.getReviews().find(r => r.bookingRequestId === b.id && r.authorId === req.user!.id);

    return {
      ...b,
      ownerName: owner ? owner.name : 'Owner',
      ownerPhone: owner ? owner.phone : '',
      propertyTitle: property ? property.title : 'Property',
      propertyRent: property ? property.rentPerMonth : 0,
      propertyAddress: property ? property.address : '',
      propertyPhotos: property ? property.photos : [],
      hasReviewed: Boolean(existingReview),
      review: existingReview || null,
    };
  });

  enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(enriched);
});

// PATCH /api/bookings/:id/accept - Owner accepts booking
bookingsRouter.patch('/:id/accept', authMiddleware, requireRole('owner', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const booking = db.getBookingById(req.params.id);
  if (!booking) {
    res.status(404).json({ error: 'Booking request not found' });
    return;
  }

  if (booking.ownerId !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden. You do not own this property booking.' });
    return;
  }

  if (booking.status !== 'pending') {
    res.status(400).json({ error: `Cannot accept booking with status ${booking.status}` });
    return;
  }

  const updated = db.updateBooking(booking.id, { status: 'accepted' });

  res.json({
    message: 'Booking request accepted. Suggestion: mark property rented if now occupied.',
    booking: updated,
  });
});

// PATCH /api/bookings/:id/decline - Owner declines booking
bookingsRouter.patch('/:id/decline', authMiddleware, requireRole('owner', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const booking = db.getBookingById(req.params.id);
  if (!booking) {
    res.status(404).json({ error: 'Booking request not found' });
    return;
  }

  if (booking.ownerId !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  if (booking.status !== 'pending') {
    res.status(400).json({ error: `Cannot decline booking with status ${booking.status}` });
    return;
  }

  const updated = db.updateBooking(booking.id, { status: 'declined' });

  res.json({
    message: 'Booking request declined.',
    booking: updated,
  });
});

// PATCH /api/bookings/:id/complete - Either party completes stay (unlocks review eligibility!)
bookingsRouter.patch('/:id/complete', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const booking = db.getBookingById(req.params.id);
  if (!booking) {
    res.status(404).json({ error: 'Booking request not found' });
    return;
  }

  // Allowed by student or owner of the booking
  const isParty = booking.studentId === req.user!.id || booking.ownerId === req.user!.id || req.user!.role === 'admin';
  if (!isParty) {
    res.status(403).json({ error: 'Forbidden. Only the tenant student or owner can mark this stay complete.' });
    return;
  }

  if (booking.status !== 'accepted') {
    res.status(400).json({ error: 'Complete is only allowed after a booking has been accepted.' });
    return;
  }

  const updated = db.updateBooking(booking.id, { status: 'completed_stay' });

  res.json({
    message: 'Stay marked complete! Reviews are now unlocked for this tenancy.',
    booking: updated,
  });
});

// PATCH /api/bookings/:id/cancel - Student cancels pending booking
bookingsRouter.patch('/:id/cancel', authMiddleware, requireRole('student', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const booking = db.getBookingById(req.params.id);
  if (!booking) {
    res.status(404).json({ error: 'Booking request not found' });
    return;
  }

  if (booking.studentId !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  if (booking.status !== 'pending') {
    res.status(400).json({ error: 'Only pending bookings can be cancelled.' });
    return;
  }

  const updated = db.updateBooking(booking.id, { status: 'cancelled' });

  res.json({
    message: 'Booking request cancelled.',
    booking: updated,
  });
});
