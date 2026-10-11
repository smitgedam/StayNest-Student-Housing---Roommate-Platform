import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { Review } from '../types';

export const reviewsRouter = Router();

// POST /api/reviews - Submit review (Strictly gated to completed_stay)
reviewsRouter.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { bookingRequestId, score, text } = req.body;

  if (!bookingRequestId || score === undefined) {
    res.status(400).json({ error: 'Booking request ID and score (1-5) are required.' });
    return;
  }

  const numScore = Number(score);
  if (isNaN(numScore) || numScore < 1 || numScore > 5) {
    res.status(400).json({ error: 'Score must be a number between 1 and 5.' });
    return;
  }

  // 1. Check booking exists
  const booking = db.getBookingById(bookingRequestId);
  if (!booking) {
    res.status(404).json({ error: 'Associated booking request not found.' });
    return;
  }

  // 2. Check author was a party to this booking
  const isStudent = booking.studentId === req.user.id;
  const isOwner = booking.ownerId === req.user.id;
  if (!isStudent && !isOwner && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Only confirmed participants in this booking can submit a review.' });
    return;
  }

  // 3. Check status is completed_stay
  if (booking.status !== 'completed_stay') {
    res.status(403).json({
      error: 'Reviews are strictly gated to completed stays. Current booking status is: ' + booking.status,
    });
    return;
  }

  // 4. Enforce "one review per author per booking"
  const existingReviews = db.getReviews();
  const alreadyReviewed = existingReviews.some(
    r => r.bookingRequestId === booking.id && r.authorId === req.user!.id
  );

  if (alreadyReviewed) {
    res.status(409).json({ error: 'You have already submitted a review for this stay.' });
    return;
  }

  const now = new Date().toISOString();
  const newReview: Review = {
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    bookingRequestId: booking.id,
    propertyId: booking.propertyId,
    authorId: req.user.id,
    score: numScore,
    text: text ? String(text).trim() : '',
    createdAt: now,
    updatedAt: now,
  };

  db.createReview(newReview);

  res.status(201).json({
    message: 'Verified review submitted successfully.',
    review: newReview,
  });
});

// GET /api/reviews/property/:id - Get reviews for a property
reviewsRouter.get('/property/:id', (req, res: Response): void => {
  const reviews = db.getReviewsByProperty(req.params.id);
  const enriched = reviews.map(r => {
    const author = db.getUserById(r.authorId);
    return {
      ...r,
      authorName: author ? author.name : 'Verified Resident',
      authorCollege: author ? author.college : undefined,
    };
  });
  res.json(enriched);
});
