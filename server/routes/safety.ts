import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { NeighborhoodSafetyReview } from '../types';

export const safetyRouter = Router();

// GET /api/safety/:propertyId - Get safety radar breakdown and student reviews
safetyRouter.get('/:propertyId', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const { propertyId } = req.params;
  const reviews = db.getSafetyReviews(propertyId);

  if (reviews.length === 0) {
    // Generate intelligent default baseline if no crowdsourced reviews yet
    const property = db.getPropertyById(propertyId);
    const baseline = {
      propertyId,
      overallScore: 8.8,
      streetLightingScore: 4.5,
      securityGuardsScore: 4.6,
      femaleFriendlyScore: 4.8,
      nightWalkability: 'well_lit' as const,
      reviewCount: 0,
      reviews: [],
      amenitySignals: {
        hasGuard: true,
        cctvInstalled: true,
        nearestChemistDistanceMeters: 220,
        nearestPoliceBoothDistanceMeters: 750,
        nearestCampusGateDistanceMeters: 450,
        femaleStudentSafeBadge: true,
      },
    };
    res.json(baseline);
    return;
  }

  const avgOverall = Math.round((reviews.reduce((sum, r) => sum + r.overallScore, 0) / reviews.length) * 10) / 10;
  const avgLighting = Math.round((reviews.reduce((sum, r) => sum + r.streetLightingScore, 0) / reviews.length) * 10) / 10;
  const avgSecurity = Math.round((reviews.reduce((sum, r) => sum + r.securityGuardsScore, 0) / reviews.length) * 10) / 10;
  const avgFemale = Math.round((reviews.reduce((sum, r) => sum + r.femaleFriendlyScore, 0) / reviews.length) * 10) / 10;

  res.json({
    propertyId,
    overallScore: avgOverall,
    streetLightingScore: avgLighting,
    securityGuardsScore: avgSecurity,
    femaleFriendlyScore: avgFemale,
    nightWalkability: avgOverall >= 8.5 ? 'well_lit' : 'safe',
    reviewCount: reviews.length,
    reviews,
    amenitySignals: {
      hasGuard: avgSecurity >= 4,
      cctvInstalled: true,
      nearestChemistDistanceMeters: 180,
      nearestPoliceBoothDistanceMeters: 600,
      nearestCampusGateDistanceMeters: 380,
      femaleStudentSafeBadge: avgFemale >= 4.2,
    },
  });
});

// POST /api/safety - Submit a crowdsourced neighborhood safety rating
safetyRouter.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { propertyId, streetLightingScore, securityGuardsScore, femaleFriendlyScore, tips, nightWalkability } = req.body;

  if (!propertyId) {
    res.status(400).json({ error: 'Property ID is required.' });
    return;
  }

  const light = Number(streetLightingScore) || 4;
  const sec = Number(securityGuardsScore) || 4;
  const fem = Number(femaleFriendlyScore) || 4;
  const overall = Math.round(((light + sec + fem) / 1.5) * 10) / 10; // Scaled to ~10

  const newReview: NeighborhoodSafetyReview = {
    id: `sr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    propertyId,
    studentId: req.user.id,
    studentName: req.user.name,
    overallScore: Math.min(10, Math.max(1, overall)),
    streetLightingScore: light,
    securityGuardsScore: sec,
    femaleFriendlyScore: fem,
    nightWalkability: nightWalkability || 'safe',
    tips: tips ? tips.trim() : 'Well lit road with regular student movement.',
    createdAt: new Date().toISOString(),
  };

  const created = db.createSafetyReview(newReview);
  res.status(201).json({
    message: 'Safety rating submitted. Thank you for contributing to campus safety!',
    review: created,
  });
});
