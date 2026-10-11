import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, authMiddleware, optionalAuthMiddleware, requireRole } from '../middleware/auth';
import { MessProvider } from '../types';

export const messRouter = Router();

// Haversine distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// GET /api/mess - List mess and tiffin services
messRouter.get('/', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const { lat, lng, dietType, minPrice, maxPrice, q } = req.query as Record<string, string>;

  let list = db.getMessProviders().filter(m => m.active);

  const centerLat = lat ? parseFloat(lat) : 28.7495; // Default DTU
  const centerLng = lng ? parseFloat(lng) : 77.1175;

  if (dietType && dietType !== 'any') {
    list = list.filter(m => m.dietType === dietType || m.dietType === 'both');
  }

  if (minPrice) {
    const min = parseFloat(minPrice);
    if (!isNaN(min)) {
      list = list.filter(m => m.plans.some(p => p.pricePerMonth >= min));
    }
  }

  if (maxPrice) {
    const max = parseFloat(maxPrice);
    if (!isNaN(max)) {
      list = list.filter(m => m.plans.some(p => p.pricePerMonth <= max));
    }
  }

  if (q && q.trim()) {
    const query = q.toLowerCase().trim();
    list = list.filter(m =>
      m.name.toLowerCase().includes(query) ||
      m.address.toLowerCase().includes(query) ||
      (m.description && m.description.toLowerCase().includes(query))
    );
  }

  const withDistance = list.map(item => {
    let distanceKm = 1.5;
    if (item.location?.coordinates) {
      const [mLng, mLat] = item.location.coordinates;
      distanceKm = calculateDistance(centerLat, centerLng, mLat, mLng);
    }
    return {
      ...item,
      distanceKm,
    };
  });

  withDistance.sort((a, b) => a.distanceKm - b.distanceKm);

  res.json(withDistance);
});

// GET /api/mess/mine/all - Mess provider's own listings
messRouter.get('/mine/all', authMiddleware, requireRole('mess_provider', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const myMess = db.getMessProviders().filter(m => m.ownerId === req.user!.id);
  res.json(myMess);
});

// GET /api/mess/:id
messRouter.get('/:id', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const mess = db.getMessProviderById(req.params.id);
  if (!mess) {
    res.status(404).json({ error: 'Mess provider not found' });
    return;
  }
  res.json(mess);
});

// POST /api/mess - Create mess listing
messRouter.post('/', authMiddleware, requireRole('mess_provider', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const {
    name,
    description,
    dietType,
    location,
    address,
    deliveryRadiusKm,
    plans,
    trialMealAvailable,
    trialMealPrice,
  } = req.body;

  if (!name || !address) {
    res.status(400).json({ error: 'Name and kitchen address are required.' });
    return;
  }

  const defaultCoordinates: [number, number] = [77.119, 28.748];
  let coordinates = defaultCoordinates;
  if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
    coordinates = [Number(location.coordinates[0]), Number(location.coordinates[1])];
  } else if (Array.isArray(location) && location.length === 2) {
    coordinates = [Number(location[0]), Number(location[1])];
  }

  const now = new Date().toISOString();
  const newMess: MessProvider = {
    id: `mess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ownerId: req.user.id,
    name,
    description: description || '',
    dietType: dietType === 'veg' || dietType === 'non-veg' ? dietType : 'both',
    location: {
      type: 'Point',
      coordinates,
    },
    address,
    deliveryRadiusKm: Number(deliveryRadiusKm) || 5,
    plans: Array.isArray(plans) && plans.length > 0 ? plans : [
      { name: 'Lunch + Dinner Monthly', pricePerMonth: 2800, mealsIncluded: ['Lunch', 'Dinner'] },
    ],
    trialMealAvailable: Boolean(trialMealAvailable),
    trialMealPrice: trialMealPrice ? Number(trialMealPrice) : undefined,
    ratingAvg: 4.2,
    ratingCount: 1,
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  db.createMessProvider(newMess);

  res.status(201).json({
    message: 'Mess listing created successfully',
    mess: newMess,
  });
});

// PUT /api/mess/:id - Update mess listing
messRouter.put('/:id', authMiddleware, requireRole('mess_provider', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const mess = db.getMessProviderById(req.params.id);
  if (!mess) {
    res.status(404).json({ error: 'Mess listing not found' });
    return;
  }

  if (mess.ownerId !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const {
    name,
    description,
    dietType,
    address,
    deliveryRadiusKm,
    plans,
    trialMealAvailable,
    trialMealPrice,
    active,
  } = req.body;

  const updated = db.updateMessProvider(mess.id, {
    ...(name && { name }),
    ...(description !== undefined && { description }),
    ...(dietType && { dietType }),
    ...(address && { address }),
    ...(deliveryRadiusKm !== undefined && { deliveryRadiusKm: Number(deliveryRadiusKm) }),
    ...(plans && { plans }),
    ...(trialMealAvailable !== undefined && { trialMealAvailable: Boolean(trialMealAvailable) }),
    ...(trialMealPrice !== undefined && { trialMealPrice: Number(trialMealPrice) }),
    ...(active !== undefined && { active: Boolean(active) }),
  });

  res.json({
    message: 'Mess listing updated successfully',
    mess: updated,
  });
});
