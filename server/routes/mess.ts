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

// Default 7-day meal timetable for student messes
const DEFAULT_TIMETABLES: Record<string, any[]> = {
  default: [
    {
      day: 'Monday',
      breakfast: 'Aloo Pyaz Paratha with fresh curd, butter & ginger chai',
      lunch: 'Rajma Rasila, steamed Jeera Rice, Tawa Roti, Cucumber Salad',
      eveningSnacks: 'Vegetable Cutlet with hot tea',
      dinner: 'Shahi Paneer, Dal Tadka, Tandoori Roti, Boondi Raita',
      todaySpecial: 'Shahi Paneer & Hot Gulab Jamun',
    },
    {
      day: 'Tuesday',
      breakfast: 'Poha with roasted peanuts, Sev & Lemon Chai',
      lunch: 'Kadhi Pakoda, steamed rice, Aloo Gobhi dry, papad',
      eveningSnacks: 'Crispy Samosa with mint chutney',
      dinner: 'Kadhai Paneer / Egg Curry, Arhar Dal, Phulkas, Green Salad',
      todaySpecial: 'Special Kadhi Pakoda with Ghee Rice',
    },
    {
      day: 'Wednesday',
      breakfast: 'Masala Idli with coconut chutney & piping hot Sambhar',
      lunch: 'Chole Bhature / Chole Kulche with pickled onions and mint raita',
      eveningSnacks: 'Bread Pakora with tea',
      dinner: 'Matar Paneer, Chana Dal, Jeera Rice, Chapati',
      todaySpecial: 'Amritsari Chole with fluffy Bhature',
    },
    {
      day: 'Thursday',
      breakfast: 'Methi Paratha with tomato chutney and masala chai',
      lunch: 'Dal Makhani (slow-cooked 12 hrs), Jeera Rice, Mix Veg sabzi',
      eveningSnacks: 'Pao Bhaji / Maggi with tea',
      dinner: 'Paneer Butter Masala, Yellow Dal, Butter Naan / Tawa Roti',
      todaySpecial: 'Authentic Dal Makhani & Jeera Rice',
    },
    {
      day: 'Friday',
      breakfast: 'Uttapam / Besan Chilla with coconut dip & tea',
      lunch: 'Kashmiri Dum Aloo, Dal Fry, Basmati Rice, Onion Salad',
      eveningSnacks: 'Aloo Tikki Chaat with sweet tamarind chutney',
      dinner: 'Paneer Do Pyaza / Chicken Masala, Moong Dal, Roti',
      todaySpecial: 'Paneer Do Pyaza & Kheer',
    },
    {
      day: 'Saturday',
      breakfast: 'Poori Bhaji (Spicy Aloo curry) with Halwa',
      lunch: 'Veg Pulao with crunchy Boondi Raita & Dal Fry',
      eveningSnacks: 'Onion & Paneer Pakoras with Chai',
      dinner: 'Palak Paneer, Rajma curry, Tawa Roti, Papad',
      todaySpecial: 'Poori Bhaji & Suji Halwa for Breakfast',
    },
    {
      day: 'Sunday',
      breakfast: 'Special Masala Dosa / Bedmi Poori with Aloo Sabzi',
      lunch: 'Hyderabadi Veg Biryani / Chicken Biryani with Mirchi ka Salan & Raita',
      eveningSnacks: 'Bun Maska with Kadak Chai',
      dinner: 'Chef Special Paneer Lababdar, Dal Tadka, Gulaab Jamun',
      todaySpecial: 'Dum Biryani with Mirchi ka Salan & Gulab Jamun Feast',
    },
  ],
};

// GET /api/mess/:id/menu - Get weekly meal timetable and today's voting stats
messRouter.get('/:id/menu', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const mess = db.getMessProviderById(id);
  if (!mess) {
    res.status(404).json({ error: 'Mess not found' });
    return;
  }

  const timetable = DEFAULT_TIMETABLES[id] || DEFAULT_TIMETABLES.default;
  const votes = db.getMealVotes(id);

  const totalVotes = votes.length;
  const upVotes = votes.filter(v => v.vote === 'up').length;
  const approvalRate = totalVotes > 0 ? Math.round((upVotes / totalVotes) * 100) : 94;

  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysMenu = timetable.find((m: any) => m.day === currentDayName) || timetable[0];

  res.json({
    messId: id,
    messName: mess.name,
    currentDay: currentDayName,
    todaysMenu,
    timetable,
    stats: {
      approvalRate,
      totalVotes: Math.max(12, totalVotes),
      upVotes: Math.max(11, upVotes),
    },
    recentFeedbacks: votes.filter(v => v.dishFeedback).map(v => ({
      userId: v.userId,
      mealType: v.mealType,
      feedback: v.dishFeedback,
      date: v.createdAt,
    })),
  });
});

// POST /api/mess/:id/vote - Student community meal rating / vote
messRouter.post('/:id/vote', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { id } = req.params;
  const { mealType, vote, dishFeedback } = req.body;

  if (!mealType || !vote) {
    res.status(400).json({ error: 'Meal type and vote (up/down) are required' });
    return;
  }

  const newVote = db.createMealVote({
    id: `mv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    messProviderId: id,
    mealType,
    userId: req.user.id,
    vote: vote === 'down' ? 'down' : 'up',
    dishFeedback: dishFeedback ? dishFeedback.trim() : undefined,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({
    message: 'Meal feedback recorded. Thank you for voting!',
    vote: newVote,
  });
});

