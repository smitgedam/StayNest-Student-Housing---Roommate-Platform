import mongoose from 'mongoose';
import {
  UserModel,
  PropertyModel,
  MessProviderModel,
  BookingRequestModel,
  ReviewModel,
  MessageModel,
  ListingReportModel,
  MaintenanceTicketModel,
  ExpenseItemModel,
  MealVoteModel,
  SafetyReviewModel,
} from './models';

let activeMongoUri: string | null = process.env.MONGODB_URI || null;
let lastConnectionError: string | null = null;

// Cleanly handle async mongoose connection events
mongoose.connection.on('error', (err: any) => {
  lastConnectionError = err?.message || String(err);
  console.warn('[MongoDB] Connection event note:', lastConnectionError);
});

mongoose.connection.on('connected', () => {
  lastConnectionError = null;
  console.log(`[MongoDB] Active connection established with database: ${mongoose.connection.name}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('[MongoDB] Connection inactive. System safely operates in local fallback mode.');
});

export interface MongoStatus {
  isConnected: boolean;
  readyState: number; // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  uriConfigured: boolean;
  dbName: string | null;
  host: string | null;
  lastError: string | null;
  counts: {
    users: number;
    properties: number;
    messProviders: number;
    bookingRequests: number;
    reviews: number;
    messages: number;
    reports: number;
    maintenanceTickets: number;
    expenses: number;
    mealVotes: number;
    safetyReviews: number;
  };
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function connectMongo(customUri?: string): Promise<{ success: boolean; message: string; dbName?: string }> {
  const uri = customUri || process.env.MONGODB_URI;

  if (!uri) {
    lastConnectionError = 'No MONGODB_URI provided';
    return {
      success: false,
      message: 'No MONGODB_URI configured. Set MONGODB_URI in .env or provide a connection string.',
    };
  }

  activeMongoUri = uri;

  try {
    if (mongoose.connection.readyState === 1) {
      return {
        success: true,
        message: 'Already connected to MongoDB',
        dbName: mongoose.connection.name,
      };
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    console.log('[MongoDB] Connecting to database...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 6000,
    });

    lastConnectionError = null;
    const dbName = mongoose.connection.name || 'staynest';
    console.log(`[MongoDB] Connected successfully to database: ${dbName}`);

    return {
      success: true,
      message: `Connected successfully to MongoDB database: ${dbName}`,
      dbName,
    };
  } catch (err: any) {
    const rawError = err.message || String(err);
    if (rawError.includes('whitelisted') || rawError.includes('Could not connect to any servers')) {
      lastConnectionError =
        "MongoDB Atlas IP Whitelist required: In your Atlas console, go to Network Access -> Add IP Address -> 'Allow Access From Anywhere' (0.0.0.0/0).";
    } else {
      lastConnectionError = rawError;
    }
    console.warn(`[MongoDB] Notice: ${lastConnectionError}`);
    return {
      success: false,
      message: lastConnectionError || 'Failed to connect to MongoDB',
    };
  }
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[MongoDB] Disconnected.');
  }
}

export async function getMongoStatus(fallbackCounts?: Partial<MongoStatus['counts']>): Promise<MongoStatus> {
  const isConnected = isMongoConnected();
  const readyState = mongoose.connection.readyState;

  const counts = {
    users: fallbackCounts?.users ?? 0,
    properties: fallbackCounts?.properties ?? 0,
    messProviders: fallbackCounts?.messProviders ?? 0,
    bookingRequests: fallbackCounts?.bookingRequests ?? 0,
    reviews: fallbackCounts?.reviews ?? 0,
    messages: fallbackCounts?.messages ?? 0,
    reports: fallbackCounts?.reports ?? 0,
    maintenanceTickets: fallbackCounts?.maintenanceTickets ?? 0,
    expenses: fallbackCounts?.expenses ?? 0,
    mealVotes: fallbackCounts?.mealVotes ?? 0,
    safetyReviews: fallbackCounts?.safetyReviews ?? 0,
  };

  if (isConnected) {
    try {
      const [
        uCount,
        pCount,
        mCount,
        bCount,
        rCount,
        msgCount,
        repCount,
        mtCount,
        expCount,
        mvCount,
        srCount,
      ] = await Promise.all([
        UserModel.countDocuments().exec(),
        PropertyModel.countDocuments().exec(),
        MessProviderModel.countDocuments().exec(),
        BookingRequestModel.countDocuments().exec(),
        ReviewModel.countDocuments().exec(),
        MessageModel.countDocuments().exec(),
        ListingReportModel.countDocuments().exec(),
        MaintenanceTicketModel.countDocuments().exec(),
        ExpenseItemModel.countDocuments().exec(),
        MealVoteModel.countDocuments().exec(),
        SafetyReviewModel.countDocuments().exec(),
      ]);

      counts.users = uCount;
      counts.properties = pCount;
      counts.messProviders = mCount;
      counts.bookingRequests = bCount;
      counts.reviews = rCount;
      counts.messages = msgCount;
      counts.reports = repCount;
      counts.maintenanceTickets = mtCount;
      counts.expenses = expCount;
      counts.mealVotes = mvCount;
      counts.safetyReviews = srCount;
    } catch {
      // ignore count query errors if permission limited
    }
  }

  return {
    isConnected,
    readyState,
    uriConfigured: Boolean(activeMongoUri || process.env.MONGODB_URI),
    dbName: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
    lastError: lastConnectionError,
    counts,
  };
}

// Seed MongoDB collections with initial dataset if empty
export async function seedMongoIfEmpty(initialData: any): Promise<boolean> {
  if (!isMongoConnected()) return false;

  try {
    const userCount = await UserModel.countDocuments().exec();
    if (userCount > 0) {
      console.log(`[MongoDB] Database already has ${userCount} users. Skipping seed.`);
      return false;
    }

    console.log('[MongoDB] Database is empty. Seeding initial test data into MongoDB...');

    if (initialData.users?.length) {
      await UserModel.insertMany(initialData.users);
    }
    if (initialData.properties?.length) {
      await PropertyModel.insertMany(initialData.properties);
    }
    if (initialData.messProviders?.length) {
      await MessProviderModel.insertMany(initialData.messProviders);
    }
    if (initialData.bookingRequests?.length) {
      await BookingRequestModel.insertMany(initialData.bookingRequests);
    }
    if (initialData.reviews?.length) {
      await ReviewModel.insertMany(initialData.reviews);
    }
    if (initialData.messages?.length) {
      await MessageModel.insertMany(initialData.messages);
    }
    if (initialData.reports?.length) {
      await ListingReportModel.insertMany(initialData.reports);
    }
    if (initialData.maintenanceTickets?.length) {
      await MaintenanceTicketModel.insertMany(initialData.maintenanceTickets);
    }
    if (initialData.expenses?.length) {
      await ExpenseItemModel.insertMany(initialData.expenses);
    }
    if (initialData.mealVotes?.length) {
      await MealVoteModel.insertMany(initialData.mealVotes);
    }
    if (initialData.safetyReviews?.length) {
      await SafetyReviewModel.insertMany(initialData.safetyReviews);
    }

    console.log('[MongoDB] Successfully seeded all collections into MongoDB.');
    return true;
  } catch (err) {
    console.error('[MongoDB] Seeding failed:', err);
    return false;
  }
}
