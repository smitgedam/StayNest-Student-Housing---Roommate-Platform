import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, authMiddleware, optionalAuthMiddleware, requireRole } from '../middleware/auth';
import { Property, PropertyStatus, PropertyType, GenderPolicy, Amenities } from '../types';

export const propertiesRouter = Router();

// Haversine distance in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// GET /api/properties - search & filter
propertiesRouter.get('/', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const {
    lat,
    lng,
    radiusKm,
    minRent,
    maxRent,
    propertyType,
    gender,
    wifi,
    ac,
    foodIncluded,
    parking,
    powerBackup,
    q,
  } = req.query as Record<string, string>;

  let list = db.getProperties().filter(p => p.status === 'available');

  const centerLat = lat ? parseFloat(lat) : null;
  const centerLng = lng ? parseFloat(lng) : null;
  const maxRadius = radiusKm ? parseFloat(radiusKm) : 10;

  if (minRent) {
    const min = parseFloat(minRent);
    if (!isNaN(min)) list = list.filter(p => p.rentPerMonth >= min);
  }

  if (maxRent) {
    const max = parseFloat(maxRent);
    if (!isNaN(max)) list = list.filter(p => p.rentPerMonth <= max);
  }

  if (propertyType && propertyType !== 'any') {
    list = list.filter(p => p.propertyType === propertyType);
  }

  if (gender && gender !== 'any') {
    list = list.filter(p => p.genderPolicy === 'any' || p.genderPolicy === gender);
  }

  if (wifi === 'true') {
    list = list.filter(p => p.amenities?.wifi);
  }

  if (ac === 'true') {
    list = list.filter(p => p.amenities?.ac);
  }

  if (foodIncluded === 'true') {
    list = list.filter(p => p.amenities?.foodIncluded);
  }

  if (parking === 'true') {
    list = list.filter(p => p.amenities?.parking);
  }

  if (powerBackup === 'true') {
    list = list.filter(p => p.amenities?.powerBackup);
  }

  if (q && q.trim()) {
    const query = q.toLowerCase().trim();
    list = list.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.address.toLowerCase().includes(query) ||
      (p.nearestCollege && p.nearestCollege.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query))
    );
  }

  // Distance calculation and radius filter if coordinates provided
  const withDistance = list.map(item => {
    let distanceKm: number | null = null;
    if (centerLat !== null && centerLng !== null && item.location?.coordinates) {
      const [pLng, pLat] = item.location.coordinates;
      distanceKm = calculateDistance(centerLat, centerLng, pLat, pLng);
    }
    return {
      ...item,
      distanceKm,
    };
  });

  const filtered = centerLat !== null && centerLng !== null && radiusKm
    ? withDistance.filter(item => item.distanceKm !== null && item.distanceKm <= maxRadius)
    : withDistance;

  // Sort by distance if location provided, else by creation date
  if (centerLat !== null && centerLng !== null) {
    filtered.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  } else {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json(filtered);
});

// GET /api/properties/mine/all - Owner's properties (both available and rented)
propertiesRouter.get('/mine/all', authMiddleware, requireRole('owner', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const myProperties = db.getProperties().filter(p => p.ownerId === req.user!.id);

  // Check days since last activity / confirmed
  const enriched = myProperties.map(p => {
    const daysSinceConfirmed = Math.floor(
      (Date.now() - new Date(p.lastConfirmedAt || p.updatedAt || p.createdAt).getTime()) / 86400000
    );
    return {
      ...p,
      daysSinceConfirmed,
      isStale: daysSinceConfirmed >= 7,
    };
  });

  res.json(enriched);
});

// GET /api/properties/:id - Property Detail
propertiesRouter.get('/:id', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const property = db.getPropertyById(req.params.id);
  if (!property) {
    res.status(404).json({ error: 'Property not found' });
    return;
  }

  const owner = db.getUserById(property.ownerId);
  const reviews = db.getReviewsByProperty(property.id).map(r => {
    const author = db.getUserById(r.authorId);
    return {
      ...r,
      authorName: author ? author.name : 'Verified Tenant',
      authorCollege: author ? author.college : undefined,
    };
  });

  // Calculate nearby mess providers within 5km
  const [pLng, pLat] = property.location.coordinates;
  const nearbyMess = db.getMessProviders()
    .filter(m => m.active)
    .map(m => {
      const [mLng, mLat] = m.location.coordinates;
      const distanceKm = calculateDistance(pLat, pLng, mLat, mLng);
      return {
        ...m,
        distanceKm,
      };
    })
    .filter(m => m.distanceKm <= 5)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  res.json({
    ...property,
    owner: owner ? {
      id: owner.id,
      name: owner.name,
      ratingAvg: owner.ratingAvg || 4.2,
      isVerified: owner.isVerified,
      college: owner.college,
      phone: owner.phone,
    } : null,
    reviews,
    nearbyMess,
  });
});

// POST /api/properties - Create listing (Owner only)
propertiesRouter.post('/', authMiddleware, requireRole('owner', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Gate before publishing: blocked until owner is verified
  if (!req.user.isVerified) {
    res.status(403).json({
      error: 'Blocked until an admin verifies the owner. Please submit property proof and ID for verification.',
      verificationStatus: req.user.verificationStatus,
    });
    return;
  }

  const {
    title,
    description,
    propertyType,
    rentPerMonth,
    depositAmount,
    genderPolicy,
    amenities,
    location,
    address,
    nearestCollege,
    photos,
  } = req.body;

  if (!title || !rentPerMonth || !address) {
    res.status(400).json({ error: 'Title, monthly rent, and address are required.' });
    return;
  }

  const validTypes: PropertyType[] = ['single_room', 'shared_room', 'pg', 'flat_1bhk', 'flat_2bhk', 'flat_3bhk_plus'];
  const pType: PropertyType = validTypes.includes(propertyType) ? propertyType : 'single_room';

  const defaultCoordinates: [number, number] = [77.1175, 28.7495]; // Default near Rohini/DTU
  let coordinates = defaultCoordinates;
  if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
    coordinates = [Number(location.coordinates[0]), Number(location.coordinates[1])];
  } else if (Array.isArray(location) && location.length === 2) {
    coordinates = [Number(location[0]), Number(location[1])];
  }

  const cleanAmenities: Amenities = {
    wifi: Boolean(amenities?.wifi),
    wifiSpeedMbps: amenities?.wifiSpeedMbps ? Number(amenities.wifiSpeedMbps) : 50,
    attachedBathroom: Boolean(amenities?.attachedBathroom),
    furnished: Boolean(amenities?.furnished),
    powerBackup: Boolean(amenities?.powerBackup),
    waterSupplyHours: amenities?.waterSupplyHours || '24 Hours',
    foodIncluded: Boolean(amenities?.foodIncluded),
    laundry: Boolean(amenities?.laundry),
    parking: Boolean(amenities?.parking),
    ac: Boolean(amenities?.ac),
    curfewTime: amenities?.curfewTime || '10:30 PM',
    petsAllowed: Boolean(amenities?.petsAllowed),
  };

  const now = new Date().toISOString();
  const newProp: Property = {
    id: `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ownerId: req.user.id,
    title,
    description: description || '',
    status: 'available',
    propertyType: pType,
    rentPerMonth: Number(rentPerMonth),
    depositAmount: Number(depositAmount || 0),
    genderPolicy: (genderPolicy as GenderPolicy) || 'any',
    amenities: cleanAmenities,
    location: {
      type: 'Point',
      coordinates,
    },
    address,
    nearestCollege: nearestCollege || '',
    photos: Array.isArray(photos) && photos.length > 0 ? photos : [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    ],
    ratingAvg: 0,
    ratingCount: 0,
    lastConfirmedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  db.createProperty(newProp);

  res.status(201).json({
    message: 'Property published successfully',
    property: newProp,
  });
});

// PATCH /api/properties/:id/status - Toggle available <-> rented
propertiesRouter.patch('/:id/status', authMiddleware, requireRole('owner', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const property = db.getPropertyById(req.params.id);
  if (!property) {
    res.status(404).json({ error: 'Property not found' });
    return;
  }

  if (property.ownerId !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden. You do not own this listing.' });
    return;
  }

  const newStatus: PropertyStatus = req.body.status || (property.status === 'available' ? 'rented' : 'available');
  const updated = db.updateProperty(property.id, {
    status: newStatus,
    lastConfirmedAt: new Date().toISOString(),
  });

  res.json({
    message: `Property status updated to ${newStatus}`,
    property: updated,
  });
});

// POST /api/properties/:id/confirm-active - Stale-listing nudge response
propertiesRouter.post('/:id/confirm-active', authMiddleware, requireRole('owner', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const property = db.getPropertyById(req.params.id);
  if (!property) {
    res.status(404).json({ error: 'Property not found' });
    return;
  }

  if (property.ownerId !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const updated = db.updateProperty(property.id, {
    lastConfirmedAt: new Date().toISOString(),
  });

  res.json({
    message: 'Listing confirmed active',
    property: updated,
  });
});

// PUT /api/properties/:id - Edit listing fields
propertiesRouter.put('/:id', authMiddleware, requireRole('owner', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const property = db.getPropertyById(req.params.id);
  if (!property) {
    res.status(404).json({ error: 'Property not found' });
    return;
  }

  if (property.ownerId !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const {
    title,
    description,
    propertyType,
    rentPerMonth,
    depositAmount,
    genderPolicy,
    amenities,
    address,
    nearestCollege,
    photos,
  } = req.body;

  const updated = db.updateProperty(property.id, {
    ...(title && { title }),
    ...(description !== undefined && { description }),
    ...(propertyType && { propertyType }),
    ...(rentPerMonth && { rentPerMonth: Number(rentPerMonth) }),
    ...(depositAmount !== undefined && { depositAmount: Number(depositAmount) }),
    ...(genderPolicy && { genderPolicy }),
    ...(amenities && { amenities: { ...property.amenities, ...amenities } }),
    ...(address && { address }),
    ...(nearestCollege !== undefined && { nearestCollege }),
    ...(photos && { photos }),
  });

  res.json({
    message: 'Property updated successfully',
    property: updated,
  });
});

// DELETE /api/properties/:id - Delete listing
propertiesRouter.delete('/:id', authMiddleware, requireRole('owner', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const property = db.getPropertyById(req.params.id);
  if (!property) {
    res.status(404).json({ error: 'Property not found' });
    return;
  }

  if (property.ownerId !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  db.deleteProperty(property.id);
  res.json({ message: 'Property listing deleted successfully' });
});
