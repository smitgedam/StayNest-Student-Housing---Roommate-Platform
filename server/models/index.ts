import mongoose, { Schema, Document } from 'mongoose';
import {
  User,
  Property,
  MessProvider,
  BookingRequest,
  Review,
  Message,
  ListingReport,
  MaintenanceTicket,
  ExpenseItem,
  MealVote,
  NeighborhoodSafetyReview,
} from '../types';

// 1. User Schema
export interface UserDocument extends Document, Omit<User, 'id'> {
  _id: any;
  id: string;
}

const UserSchema = new Schema<UserDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'owner', 'mess_provider', 'admin'], required: true },
    isVerified: { type: Boolean, default: false },
    verificationDocUrl: { type: String },
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'none'], default: 'none' },
    verificationRejectReason: { type: String },
    college: { type: String, default: '' },
    phone: { type: String, default: '' },
    roommatePrefs: {
      sleepSchedule: { type: String, enum: ['early', 'late', 'flexible'] },
      diet: { type: String, enum: ['veg', 'non-veg', 'both'] },
      smoking: { type: String, enum: ['no', 'yes', 'occasional'] },
      studyHabits: { type: String, enum: ['quiet', 'moderate', 'social'] },
      cleanliness: { type: String, enum: ['neat_freak', 'moderate', 'relaxed'] },
      guestPolicy: { type: String, enum: ['no_parties', 'weekends_only', 'flexible'] },
      foodSharing: { type: String, enum: ['cook_together', 'independent', 'mess_tiffin'] },
      budgetMin: { type: Number },
      budgetMax: { type: Number },
      interests: [{ type: String }],
      lookingForRoommate: { type: Boolean, default: false },
    },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: false }
);

// 2. Property Schema
export interface PropertyDocument extends Document, Omit<Property, 'id'> {
  _id: any;
  id: string;
}

const PropertySchema = new Schema<PropertyDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['available', 'rented'], default: 'available' },
    propertyType: {
      type: String,
      enum: ['single_room', 'shared_room', 'pg', 'flat_1bhk', 'flat_2bhk', 'flat_3bhk_plus'],
      required: true,
    },
    rentPerMonth: { type: Number, required: true },
    depositAmount: { type: Number, default: 0 },
    genderPolicy: { type: String, enum: ['male_only', 'female_only', 'any'], default: 'any' },
    amenities: {
      wifi: { type: Boolean, default: false },
      wifiSpeedMbps: { type: Number, default: 50 },
      attachedBathroom: { type: Boolean, default: false },
      furnished: { type: Boolean, default: false },
      powerBackup: { type: Boolean, default: false },
      waterSupplyHours: { type: String, default: '24 Hours' },
      foodIncluded: { type: Boolean, default: false },
      laundry: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      ac: { type: Boolean, default: false },
      curfewTime: { type: String, default: '10:30 PM' },
      petsAllowed: { type: Boolean, default: false },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    address: { type: String, required: true },
    nearestCollege: { type: String, default: '' },
    photos: [{ type: String }],
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    lastConfirmedAt: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: false }
);

// 2dsphere index for GeoJSON spatial queries
PropertySchema.index({ location: '2dsphere' });

// 3. Mess Provider Schema
export interface MessProviderDocument extends Document, Omit<MessProvider, 'id'> {
  _id: any;
  id: string;
}

const MessProviderSchema = new Schema<MessProviderDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    dietType: { type: String, enum: ['veg', 'non-veg', 'both'], default: 'both' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    address: { type: String, required: true },
    deliveryRadiusKm: { type: Number, default: 5 },
    plans: [
      {
        name: { type: String, required: true },
        pricePerMonth: { type: Number, required: true },
        mealsIncluded: [{ type: String }],
      },
    ],
    trialMealAvailable: { type: Boolean, default: false },
    trialMealPrice: { type: Number },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    menuTimetable: [
      {
        day: { type: String, required: true },
        breakfast: { type: String, default: '' },
        lunch: { type: String, default: '' },
        eveningSnacks: { type: String, default: '' },
        dinner: { type: String, default: '' },
        todaySpecial: { type: String },
      },
    ],
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: false }
);

MessProviderSchema.index({ location: '2dsphere' });

// 4. Booking Request Schema
export interface BookingRequestDocument extends Document, Omit<BookingRequest, 'id'> {
  _id: any;
  id: string;
}

const BookingRequestSchema = new Schema<BookingRequestDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    moveInDate: { type: String, required: true },
    durationMonths: { type: Number, required: true },
    headcount: { type: Number, default: 1 },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'completed_stay', 'cancelled'],
      default: 'pending',
    },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: false }
);

// 5. Review Schema
export interface ReviewDocument extends Document, Omit<Review, 'id'> {
  _id: any;
  id: string;
}

const ReviewSchema = new Schema<ReviewDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    bookingRequestId: { type: String, required: true },
    propertyId: { type: String, index: true },
    messProviderId: { type: String, index: true },
    ratedUserId: { type: String },
    authorId: { type: String, required: true, index: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, default: '' },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: false }
);

// 6. Message Schema
export interface MessageDocument extends Document, Omit<Message, 'id'> {
  _id: any;
  id: string;
}

const MessageSchema = new Schema<MessageDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    threadId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    recipientId: { type: String, required: true, index: true },
    propertyId: { type: String },
    text: { type: String, required: true },
    readAt: { type: String, default: null },
    createdAt: { type: String, required: true },
  },
  { timestamps: false }
);

// 7. Listing Report Schema
export interface ListingReportDocument extends Document, Omit<ListingReport, 'id'> {
  _id: any;
  id: string;
}

const ListingReportSchema = new Schema<ListingReportDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true, index: true },
    reporterId: { type: String, required: true },
    reason: {
      type: String,
      enum: ['Fake listing', 'Already rented', 'Wrong details', 'Abusive owner', 'Other'],
      required: true,
    },
    details: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
    createdAt: { type: String, required: true },
  },
  { timestamps: false }
);

// 8. Maintenance Ticket Schema
export interface MaintenanceTicketDocument extends Document, Omit<MaintenanceTicket, 'id'> {
  _id: any;
  id: string;
}

const MaintenanceTicketSchema = new Schema<MaintenanceTicketDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String },
    propertyTitle: { type: String },
    studentId: { type: String, required: true, index: true },
    studentName: { type: String },
    roomNo: { type: String, default: '' },
    category: {
      type: String,
      enum: ['plumbing', 'electrical', 'wifi', 'appliance', 'carpentry', 'other'],
      required: true,
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['pending', 'in_progress', 'resolved', 'closed'], default: 'pending' },
    assignedTechnician: { type: String },
    resolutionNotes: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: false }
);

// 9. Expense Item Schema
export interface ExpenseItemDocument extends Document, Omit<ExpenseItem, 'id'> {
  _id: any;
  id: string;
}

const ExpenseItemSchema = new Schema<ExpenseItemDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['rent', 'electricity', 'wifi', 'water', 'maid', 'groceries', 'other'],
      required: true,
    },
    amount: { type: Number, required: true },
    paidBy: {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
    splitAmong: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        share: { type: Number, required: true },
        settled: { type: Boolean, default: false },
      },
    ],
    upiId: { type: String },
    date: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { timestamps: false }
);

// 10. Meal Vote Schema
export interface MealVoteDocument extends Document, Omit<MealVote, 'id'> {
  _id: any;
  id: string;
}

const MealVoteSchema = new Schema<MealVoteDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    messProviderId: { type: String, required: true, index: true },
    mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true },
    userId: { type: String, required: true, index: true },
    vote: { type: String, enum: ['up', 'down'], required: true },
    dishFeedback: { type: String },
    createdAt: { type: String, required: true },
  },
  { timestamps: false }
);

// 11. Safety Review Schema
export interface SafetyReviewDocument extends Document, Omit<NeighborhoodSafetyReview, 'id'> {
  _id: any;
  id: string;
}

const SafetyReviewSchema = new Schema<SafetyReviewDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    overallScore: { type: Number, required: true },
    streetLightingScore: { type: Number, required: true },
    securityGuardsScore: { type: Number, required: true },
    femaleFriendlyScore: { type: Number, required: true },
    nightWalkability: { type: String, enum: ['safe', 'caution', 'well_lit'], required: true },
    tips: { type: String, default: '' },
    createdAt: { type: String, required: true },
  },
  { timestamps: false }
);

// Models
export const UserModel = mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);
export const PropertyModel =
  mongoose.models.Property || mongoose.model<PropertyDocument>('Property', PropertySchema);
export const MessProviderModel =
  mongoose.models.MessProvider || mongoose.model<MessProviderDocument>('MessProvider', MessProviderSchema);
export const BookingRequestModel =
  mongoose.models.BookingRequest || mongoose.model<BookingRequestDocument>('BookingRequest', BookingRequestSchema);
export const ReviewModel =
  mongoose.models.Review || mongoose.model<ReviewDocument>('Review', ReviewSchema);
export const MessageModel =
  mongoose.models.Message || mongoose.model<MessageDocument>('Message', MessageSchema);
export const ListingReportModel =
  mongoose.models.ListingReport || mongoose.model<ListingReportDocument>('ListingReport', ListingReportSchema);
export const MaintenanceTicketModel =
  mongoose.models.MaintenanceTicket ||
  mongoose.model<MaintenanceTicketDocument>('MaintenanceTicket', MaintenanceTicketSchema);
export const ExpenseItemModel =
  mongoose.models.ExpenseItem || mongoose.model<ExpenseItemDocument>('ExpenseItem', ExpenseItemSchema);
export const MealVoteModel =
  mongoose.models.MealVote || mongoose.model<MealVoteDocument>('MealVote', MealVoteSchema);
export const SafetyReviewModel =
  mongoose.models.NeighborhoodSafetyReview ||
  mongoose.model<SafetyReviewDocument>('NeighborhoodSafetyReview', SafetyReviewSchema);
