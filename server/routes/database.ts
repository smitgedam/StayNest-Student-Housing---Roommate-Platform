import { Router, Request, Response } from 'express';
import { connectMongo, getMongoStatus, isMongoConnected, seedMongoIfEmpty } from '../mongodb';
import { db } from '../db';
import { AuthenticatedRequest, optionalAuthMiddleware } from '../middleware/auth';

export const databaseRouter = Router();

// GET /api/db/status - Diagnostic and connectivity information
databaseRouter.get('/status', optionalAuthMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
  const raw = db.getRawData();
  const status = await getMongoStatus({
    users: raw.users.length,
    properties: raw.properties.length,
    messProviders: raw.messProviders.length,
    bookingRequests: raw.bookingRequests.length,
    reviews: raw.reviews.length,
    messages: raw.messages.length,
    reports: raw.reports.length,
    maintenanceTickets: raw.maintenanceTickets?.length || 0,
    expenses: raw.expenses?.length || 0,
    mealVotes: raw.mealVotes?.length || 0,
    safetyReviews: raw.safetyReviews?.length || 0,
  });
  res.json({
    ...status,
    mode: status.isConnected ? 'mongodb' : 'local_store',
    serverUptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// POST /api/db/connect - Connect to custom or env MongoDB URI
databaseRouter.post('/connect', async (req: Request, res: Response) => {
  const { uri } = req.body;

  const result = await connectMongo(uri);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }

  // If connected, sync or seed
  try {
    const wasSeeded = await seedMongoIfEmpty(db.getRawData());
    if (!wasSeeded) {
      await db.syncFromMongo();
    }
  } catch (err: any) {
    console.warn('[MongoDB] Sync after connect error:', err.message);
  }

  const updatedStatus = await getMongoStatus();
  res.json({
    ...result,
    status: updatedStatus,
    mode: updatedStatus.isConnected ? 'mongodb' : 'local_store',
  });
});

// POST /api/db/seed - Manually re-seed MongoDB with initial test records
databaseRouter.post('/seed', async (_req: Request, res: Response) => {
  if (!isMongoConnected()) {
    res.status(400).json({
      error: 'Cannot seed MongoDB because database is not currently connected. Connect MongoDB first.',
    });
    return;
  }

  try {
    const seeded = await seedMongoIfEmpty(db.getRawData());
    res.json({
      message: seeded ? 'Seeded initial collections into MongoDB' : 'Collections already populated',
      seeded,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Seeding failed' });
  }
});
