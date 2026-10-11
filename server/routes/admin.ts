import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth';

export const adminRouter = Router();

// GET /api/admin/verifications - Get owner verification queue
adminRouter.get('/verifications', authMiddleware, requireRole('admin'), (_req: AuthenticatedRequest, res: Response): void => {
  const users = db.getUsers().filter(u => u.role === 'owner' && (u.verificationStatus || u.verificationDocUrl));

  const list = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    college: u.college,
    isVerified: u.isVerified,
    verificationStatus: u.verificationStatus || (u.isVerified ? 'approved' : 'none'),
    verificationDocUrl: u.verificationDocUrl,
    verificationRejectReason: u.verificationRejectReason,
    submittedAt: u.updatedAt || u.createdAt,
  }));

  res.json(list);
});

// PATCH /api/admin/verifications/:id/approve - Approve owner
adminRouter.patch('/verifications/:id/approve', authMiddleware, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const user = db.getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'Owner not found' });
    return;
  }

  const updated = db.updateUser(user.id, {
    isVerified: true,
    verificationStatus: 'approved',
    verificationRejectReason: undefined,
  });

  res.json({
    message: `Owner ${user.name} approved. They can now publish listings!`,
    user: updated,
  });
});

// PATCH /api/admin/verifications/:id/reject - Reject owner with reason
adminRouter.patch('/verifications/:id/reject', authMiddleware, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const user = db.getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'Owner not found' });
    return;
  }

  const { reason } = req.body;
  const updated = db.updateUser(user.id, {
    isVerified: false,
    verificationStatus: 'rejected',
    verificationRejectReason: reason || 'Document unclear or invalid proof.',
  });

  res.json({
    message: `Owner verification rejected: ${reason || 'Document unclear'}`,
    user: updated,
  });
});

// GET /api/admin/reports - Get reported listings
adminRouter.get('/reports', authMiddleware, requireRole('admin'), (_req: AuthenticatedRequest, res: Response): void => {
  const reports = db.getReports();
  const enriched = reports.map(rep => {
    const property = db.getPropertyById(rep.propertyId);
    const reporter = db.getUserById(rep.reporterId);
    const owner = property ? db.getUserById(property.ownerId) : null;
    return {
      ...rep,
      propertyTitle: property ? property.title : 'Listing removed',
      propertyRent: property ? property.rentPerMonth : 0,
      propertyStatus: property ? property.status : 'removed',
      ownerName: owner ? owner.name : 'Unknown',
      reporterName: reporter ? reporter.name : 'Anonymous',
    };
  });
  res.json(enriched);
});

// PATCH /api/admin/reports/:id/resolve - Resolve report or unpublish listing
adminRouter.patch('/reports/:id/resolve', authMiddleware, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const report = db.getReports().find(r => r.id === req.params.id);
  if (!report) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }

  const { action } = req.body; // 'dismiss' | 'unpublish_listing' | 'delete_listing'
  if (action === 'unpublish_listing') {
    db.updateProperty(report.propertyId, { status: 'rented' });
  } else if (action === 'delete_listing') {
    db.deleteProperty(report.propertyId);
  }

  const updated = db.updateReport(report.id, { status: 'resolved' });

  res.json({
    message: `Report resolved with action: ${action || 'dismiss'}`,
    report: updated,
  });
});
