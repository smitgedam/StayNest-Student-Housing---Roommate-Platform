import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { ListingReport } from '../types';

export const reportsRouter = Router();

// POST /api/reports - Report a listing
reportsRouter.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { propertyId, reason, details } = req.body;

  if (!propertyId || !reason) {
    res.status(400).json({ error: 'Property ID and reason are required.' });
    return;
  }

  const property = db.getPropertyById(propertyId);
  if (!property) {
    res.status(404).json({ error: 'Property not found.' });
    return;
  }

  const newReport: ListingReport = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    propertyId,
    reporterId: req.user.id,
    reason: reason || 'Other',
    details: details ? String(details).trim() : '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.createReport(newReport);

  res.status(201).json({
    message: 'Listing reported. Our admin moderation team will review it shortly.',
    report: newReport,
  });
});
