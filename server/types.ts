export type UserRole = 'student' | 'owner' | 'mess_provider' | 'admin';

export interface RoommatePrefs {
  sleepSchedule?: 'early' | 'late' | 'flexible';
  diet?: 'veg' | 'non-veg' | 'both';
  smoking?: 'no' | 'yes' | 'occasional';
  studyHabits?: 'quiet' | 'moderate' | 'social';
  cleanliness?: 'neat_freak' | 'moderate' | 'relaxed';
  guestPolicy?: 'no_parties' | 'weekends_only' | 'flexible';
  foodSharing?: 'cook_together' | 'independent' | 'mess_tiffin';
  budgetMin?: number;
  budgetMax?: number;
  interests?: string[];
  lookingForRoommate?: boolean;
}

export interface RoommateCandidate {
  id: string;
  name: string;
  college?: string;
  ratingAvg?: number;
  roommatePrefs: RoommatePrefs;
  compatibility: number;
  matchReasons: string[];
  breakdown: {
    lifestyle: number;
    habits: number;
    study: number;
    interests: number;
    budget: number;
  };
}

export interface MaintenanceTicket {
  id: string;
  propertyId?: string;
  propertyTitle?: string;
  studentId: string;
  studentName?: string;
  roomNo: string;
  category: 'plumbing' | 'electrical' | 'wifi' | 'appliance' | 'carpentry' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  assignedTechnician?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseParticipant {
  id: string;
  name: string;
  share: number;
  settled: boolean;
}

export interface ExpenseItem {
  id: string;
  title: string;
  category: 'rent' | 'electricity' | 'wifi' | 'water' | 'maid' | 'groceries' | 'other';
  amount: number;
  paidBy: {
    id: string;
    name: string;
  };
  splitAmong: ExpenseParticipant[];
  upiId?: string;
  date: string;
  createdAt: string;
}

export interface MealTimetableDay {
  day: string;
  breakfast: string;
  lunch: string;
  eveningSnacks: string;
  dinner: string;
  todaySpecial?: string;
}

export interface MealVote {
  id: string;
  messProviderId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  userId: string;
  vote: 'up' | 'down';
  dishFeedback?: string;
  createdAt: string;
}

export interface NeighborhoodSafetyReview {
  id: string;
  propertyId: string;
  studentId: string;
  studentName: string;
  overallScore: number;
  streetLightingScore: number;
  securityGuardsScore: number;
  femaleFriendlyScore: number;
  nightWalkability: 'safe' | 'caution' | 'well_lit';
  tips: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isVerified: boolean;
  verificationDocUrl?: string;
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'none';
  verificationRejectReason?: string;
  college?: string;
  phone?: string;
  roommatePrefs?: RoommatePrefs;
  ratingAvg?: number;
  ratingCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type PropertyStatus = 'available' | 'rented';
export type PropertyType = 'single_room' | 'shared_room' | 'pg' | 'flat_1bhk' | 'flat_2bhk' | 'flat_3bhk_plus';
export type GenderPolicy = 'male_only' | 'female_only' | 'any';

export interface Amenities {
  wifi: boolean;
  wifiSpeedMbps?: number;
  attachedBathroom: boolean;
  furnished: boolean;
  powerBackup: boolean;
  waterSupplyHours?: string;
  foodIncluded: boolean;
  laundry: boolean;
  parking: boolean;
  ac: boolean;
  curfewTime?: string;
  petsAllowed: boolean;
}

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface Property {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  status: PropertyStatus;
  propertyType: PropertyType;
  rentPerMonth: number;
  depositAmount: number;
  genderPolicy: GenderPolicy;
  amenities: Amenities;
  location: GeoPoint;
  address: string;
  nearestCollege?: string;
  photos: string[];
  ratingAvg: number;
  ratingCount: number;
  lastConfirmedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlan {
  name: string;
  pricePerMonth: number;
  mealsIncluded: string[];
}

export interface MessProvider {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  dietType: 'veg' | 'non-veg' | 'both';
  location: GeoPoint;
  address: string;
  deliveryRadiusKm: number;
  plans: MealPlan[];
  trialMealAvailable: boolean;
  trialMealPrice?: number;
  ratingAvg: number;
  ratingCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'completed_stay' | 'cancelled';

export interface BookingRequest {
  id: string;
  propertyId: string;
  studentId: string;
  ownerId: string;
  moveInDate: string;
  durationMonths: number;
  headcount: number;
  message?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  bookingRequestId: string;
  propertyId?: string;
  messProviderId?: string;
  ratedUserId?: string;
  authorId: string;
  score: number;
  text?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  recipientId: string;
  propertyId?: string;
  text: string;
  readAt?: string | null;
  createdAt: string;
}

export interface ListingReport {
  id: string;
  propertyId: string;
  reporterId: string;
  reason: 'Fake listing' | 'Already rented' | 'Wrong details' | 'Abusive owner' | 'Other';
  details: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}
