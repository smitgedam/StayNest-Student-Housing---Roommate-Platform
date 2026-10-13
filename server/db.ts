import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import {
  BookingRequest,
  ListingReport,
  Message,
  MessProvider,
  Property,
  Review,
  User,
  MaintenanceTicket,
  ExpenseItem,
  MealVote,
  NeighborhoodSafetyReview,
} from './types';
import { isMongoConnected } from './mongodb';
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

// Default password hash for 'password123'
const DEFAULT_HASH = bcrypt.hashSync('password123', 10);

interface DatabaseState {
  users: User[];
  properties: Property[];
  messProviders: MessProvider[];
  bookingRequests: BookingRequest[];
  reviews: Review[];
  messages: Message[];
  reports: ListingReport[];
  maintenanceTickets: MaintenanceTicket[];
  expenses: ExpenseItem[];
  mealVotes: MealVote[];
  safetyReviews: NeighborhoodSafetyReview[];
}

const DB_FILE = path.resolve(process.cwd(), 'data_store.json');

function getInitialData(): DatabaseState {
  const users: User[] = [
    {
      id: 'usr_student_1',
      name: 'Rahul Sharma',
      email: 'rahul@college.edu',
      passwordHash: DEFAULT_HASH,
      role: 'student',
      isVerified: true,
      college: 'Delhi Technological University (DTU)',
      phone: '+91 98765 43210',
      roommatePrefs: {
        sleepSchedule: 'early',
        diet: 'veg',
        smoking: 'no',
        studyHabits: 'quiet',
        cleanliness: 'neat_freak',
        guestPolicy: 'no_parties',
        foodSharing: 'independent',
        budgetMin: 6000,
        budgetMax: 11000,
        interests: ['Coding', 'Tech Projects', 'Gym & Fitness', 'Reading'],
        lookingForRoommate: true,
      },
      ratingAvg: 4.8,
      ratingCount: 3,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'usr_student_2',
      name: 'Priya Verma',
      email: 'priya@college.edu',
      passwordHash: DEFAULT_HASH,
      role: 'student',
      isVerified: true,
      college: 'Netaji Subhas University of Technology (NSUT)',
      phone: '+91 98123 45678',
      roommatePrefs: {
        sleepSchedule: 'late',
        diet: 'both',
        smoking: 'occasional',
        studyHabits: 'social',
        cleanliness: 'moderate',
        guestPolicy: 'weekends_only',
        foodSharing: 'cook_together',
        budgetMin: 8000,
        budgetMax: 14000,
        interests: ['Music', 'Debating', 'Movies & Netflix', 'Cooking'],
        lookingForRoommate: true,
      },
      ratingAvg: 4.5,
      ratingCount: 2,
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'usr_student_3',
      name: 'Aman Patel',
      email: 'aman@college.edu',
      passwordHash: DEFAULT_HASH,
      role: 'student',
      isVerified: true,
      college: 'Delhi Technological University (DTU)',
      phone: '+91 99222 33445',
      roommatePrefs: {
        sleepSchedule: 'flexible',
        diet: 'veg',
        smoking: 'no',
        studyHabits: 'moderate',
        cleanliness: 'neat_freak',
        guestPolicy: 'weekends_only',
        foodSharing: 'cook_together',
        budgetMin: 7000,
        budgetMax: 12000,
        interests: ['Coding', 'Gaming', 'Gym & Fitness', 'Cricket'],
        lookingForRoommate: true,
      },
      ratingAvg: 4.9,
      ratingCount: 4,
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'usr_student_4',
      name: 'Sneha Sen',
      email: 'sneha@college.edu',
      passwordHash: DEFAULT_HASH,
      role: 'student',
      isVerified: true,
      college: 'Delhi Technological University (DTU)',
      phone: '+91 98101 23456',
      roommatePrefs: {
        sleepSchedule: 'early',
        diet: 'veg',
        smoking: 'no',
        studyHabits: 'quiet',
        cleanliness: 'neat_freak',
        guestPolicy: 'no_parties',
        foodSharing: 'mess_tiffin',
        budgetMin: 6500,
        budgetMax: 10500,
        interests: ['Coding', 'Reading', 'Photography', 'Badminton'],
        lookingForRoommate: true,
      },
      ratingAvg: 4.9,
      ratingCount: 5,
      createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'usr_owner_1',
      name: 'Vikram Malhotra',
      email: 'vikram@staynest.com',
      passwordHash: DEFAULT_HASH,
      role: 'owner',
      isVerified: true,
      verificationStatus: 'approved',
      verificationDocUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
      college: 'DTU Alum',
      phone: '+91 98990 11223',
      ratingAvg: 4.2,
      ratingCount: 6,
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'usr_owner_2',
      name: 'Suresh Raina',
      email: 'suresh@staynest.com',
      passwordHash: DEFAULT_HASH,
      role: 'owner',
      isVerified: false,
      verificationStatus: 'pending',
      verificationDocUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600',
      college: 'Rohini Estate Owner',
      phone: '+91 97110 55443',
      ratingAvg: 0,
      ratingCount: 0,
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'usr_mess_1',
      name: 'Ramesh Gupta (Annapurna Tiffin)',
      email: 'annapurna@staynest.com',
      passwordHash: DEFAULT_HASH,
      role: 'mess_provider',
      isVerified: true,
      college: 'Campus Kitchen Partner',
      phone: '+91 98111 22334',
      ratingAvg: 4.3,
      ratingCount: 14,
      createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'usr_admin_1',
      name: 'Admin Moderator',
      email: 'admin@staynest.com',
      passwordHash: DEFAULT_HASH,
      role: 'admin',
      isVerified: true,
      college: 'StayNest Administration',
      phone: '+91 11 2345 6789',
      createdAt: new Date(Date.now() - 100 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const properties: Property[] = [
    {
      id: 'prop_1',
      ownerId: 'usr_owner_1',
      title: 'Sunrise PG near Gate 2',
      description: 'Well-maintained single room with high-speed 50 Mbps fiber WiFi, 24x7 power backup, study desk, attached washroom, and peaceful study atmosphere right next to DTU Gate 2.',
      status: 'available',
      propertyType: 'single_room',
      rentPerMonth: 6500,
      depositAmount: 10000,
      genderPolicy: 'any',
      amenities: {
        wifi: true,
        wifiSpeedMbps: 50,
        attachedBathroom: true,
        furnished: true,
        powerBackup: true,
        waterSupplyHours: '6am - 10am, 6pm - 10pm',
        foodIncluded: true,
        laundry: true,
        parking: false,
        ac: true,
        curfewTime: '10:30 PM',
        petsAllowed: false,
      },
      location: {
        type: 'Point',
        coordinates: [77.1175, 28.7495], // near DTU campus, Delhi
      },
      address: 'Plot 42, Pocket 3, Sector 17, Rohini, Delhi',
      nearestCollege: 'Delhi Technological University (Gate 2 - 250m)',
      photos: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
      ],
      ratingAvg: 4.5,
      ratingCount: 3,
      lastConfirmedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prop_2',
      ownerId: 'usr_owner_1',
      title: 'Green Nest 2BHK',
      description: 'Spacious independent 2BHK flat ideal for 2-3 students looking to room together. Modular kitchen, twin balconies, dedicated two-wheeler parking, and invertor backup.',
      status: 'available',
      propertyType: 'flat_2bhk',
      rentPerMonth: 14000,
      depositAmount: 20000,
      genderPolicy: 'any',
      amenities: {
        wifi: true,
        wifiSpeedMbps: 100,
        attachedBathroom: true,
        furnished: true,
        powerBackup: true,
        waterSupplyHours: '24 Hours',
        foodIncluded: false,
        laundry: false,
        parking: true,
        ac: true,
        curfewTime: 'No curfew',
        petsAllowed: true,
      },
      location: {
        type: 'Point',
        coordinates: [77.123, 28.744],
      },
      address: 'B-Block, Sector 16, Rohini, Delhi',
      nearestCollege: 'Delhi Technological University (DTU - 1.2 km)',
      photos: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      ],
      ratingAvg: 4.7,
      ratingCount: 2,
      lastConfirmedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prop_3',
      ownerId: 'usr_owner_1',
      title: 'Scholars Room',
      description: 'Budget-friendly shared room for 2 students. Includes clean twin single beds, study lamps, wooden wardrobes, and high-speed WiFi. RO drinking water on premise.',
      status: 'available',
      propertyType: 'shared_room',
      rentPerMonth: 5200,
      depositAmount: 8000,
      genderPolicy: 'male_only',
      amenities: {
        wifi: true,
        wifiSpeedMbps: 30,
        attachedBathroom: false,
        furnished: true,
        powerBackup: true,
        waterSupplyHours: '6am - 9am, 7pm - 10pm',
        foodIncluded: false,
        laundry: true,
        parking: false,
        ac: false,
        curfewTime: '10:00 PM',
        petsAllowed: false,
      },
      location: {
        type: 'Point',
        coordinates: [77.111, 28.753],
      },
      address: 'Street 4, Shahbad Daulatpur, near DTU Main Gate, Delhi',
      nearestCollege: 'Delhi Technological University (DTU - 400m)',
      photos: [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800',
      ],
      ratingAvg: 4.3,
      ratingCount: 4,
      lastConfirmedAt: new Date(Date.now() - 8 * 86400000).toISOString(), // > 7 days triggers stale listing nudge in Owner Dashboard!
      createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const messProviders: MessProvider[] = [
    {
      id: 'mess_1',
      ownerId: 'usr_mess_1',
      name: 'Annapurna Tiffin',
      description: 'Hygienic pure-vegetarian homemade north Indian meals delivered warm in insulated tiffin sets. Custom spice levels on request.',
      dietType: 'veg',
      location: {
        type: 'Point',
        coordinates: [77.119, 28.748],
      },
      address: 'Shop 12, Sector 17 Market, Rohini, Delhi',
      deliveryRadiusKm: 5,
      plans: [
        {
          name: 'Lunch + Dinner Regular',
          pricePerMonth: 2800,
          mealsIncluded: ['Lunch', 'Dinner'],
        },
        {
          name: 'Full Day (3 Meals + Sunday Special)',
          pricePerMonth: 3600,
          mealsIncluded: ['Breakfast', 'Lunch', 'Dinner'],
        },
      ],
      trialMealAvailable: true,
      trialMealPrice: 60,
      ratingAvg: 4.3,
      ratingCount: 22,
      active: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mess_2',
      ownerId: 'usr_mess_1',
      name: 'Maa Ki Rasoi',
      description: 'Homestyle cooking offering both vegetarian and egg/chicken meals on alternate days. Free delivery right to hostel and PG gates.',
      dietType: 'both',
      location: {
        type: 'Point',
        coordinates: [77.114, 28.751],
      },
      address: 'Pocket D-14, Sector 16, Rohini, Delhi',
      deliveryRadiusKm: 4,
      plans: [
        {
          name: 'Dinner Only Plan',
          pricePerMonth: 1900,
          mealsIncluded: ['Dinner'],
        },
        {
          name: 'Lunch + Dinner Special',
          pricePerMonth: 3200,
          mealsIncluded: ['Lunch', 'Dinner'],
        },
      ],
      trialMealAvailable: true,
      trialMealPrice: 70,
      ratingAvg: 4.0,
      ratingCount: 16,
      active: true,
      createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mess_3',
      ownerId: 'usr_mess_1',
      name: 'Campus Meals',
      description: 'Nutritious meals designed for college students with protein-rich options, fresh rotis, and hygienic kitchen inspections.',
      dietType: 'non-veg',
      location: {
        type: 'Point',
        coordinates: [77.128, 28.741],
      },
      address: 'Main Market, Bawana Road, Delhi',
      deliveryRadiusKm: 6,
      plans: [
        {
          name: '3 Meals Comprehensive',
          pricePerMonth: 3400,
          mealsIncluded: ['Breakfast', 'Lunch', 'Dinner'],
        },
      ],
      trialMealAvailable: false,
      ratingAvg: 3.8,
      ratingCount: 9,
      active: true,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const bookingRequests: BookingRequest[] = [
    {
      id: 'bk_1',
      propertyId: 'prop_1',
      studentId: 'usr_student_1',
      ownerId: 'usr_owner_1',
      moveInDate: '2026-11-01',
      durationMonths: 3,
      headcount: 1,
      message: 'Hi Vikram ji, I am a 3rd year B.Tech student at DTU. Looking to shift by 1st Nov. Can we arrange a visit this weekend?',
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'bk_2',
      propertyId: 'prop_2',
      studentId: 'usr_student_2',
      ownerId: 'usr_owner_1',
      moveInDate: '2026-11-15',
      durationMonths: 6,
      headcount: 2,
      message: 'Looking for a 2BHK for me and my classmate. We are quiet and focused on studies.',
      status: 'accepted',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'bk_3',
      propertyId: 'prop_3',
      studentId: 'usr_student_3',
      ownerId: 'usr_owner_1',
      moveInDate: '2026-09-01',
      durationMonths: 2,
      headcount: 1,
      message: 'Completed internship stay for 2 months near DTU.',
      status: 'completed_stay',
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ];

  const reviews: Review[] = [
    {
      id: 'rev_1',
      bookingRequestId: 'bk_3',
      propertyId: 'prop_3',
      authorId: 'usr_student_3',
      score: 5,
      text: 'Great stay! Clean rooms, cooperative owner, and WiFi was very stable throughout exam week.',
      createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    },
    {
      id: 'rev_2',
      bookingRequestId: 'bk_prev_1',
      propertyId: 'prop_1',
      authorId: 'usr_student_2',
      score: 4,
      text: 'Super close to Gate 2. Food included was hearty and landlord responded quickly to power backup switch.',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  ];

  const messages: Message[] = [
    {
      id: 'msg_1',
      threadId: 'usr_owner_1_usr_student_1_prop_1',
      senderId: 'usr_student_1',
      recipientId: 'usr_owner_1',
      propertyId: 'prop_1',
      text: 'Is the room still free for next semester?',
      readAt: new Date(Date.now() - 4000000).toISOString(),
      createdAt: new Date(Date.now() - 5000000).toISOString(),
    },
    {
      id: 'msg_2',
      threadId: 'usr_owner_1_usr_student_1_prop_1',
      senderId: 'usr_owner_1',
      recipientId: 'usr_student_1',
      propertyId: 'prop_1',
      text: 'Yes Rahul, you can visit this week to check the room.',
      readAt: new Date(Date.now() - 2000000).toISOString(),
      createdAt: new Date(Date.now() - 3000000).toISOString(),
    },
    {
      id: 'msg_3',
      threadId: 'usr_owner_1_usr_student_1_prop_1',
      senderId: 'usr_student_1',
      recipientId: 'usr_owner_1',
      propertyId: 'prop_1',
      text: 'Great, I will send a booking request through the portal!',
      readAt: null,
      createdAt: new Date(Date.now() - 1000000).toISOString(),
    },
    {
      id: 'msg_4',
      threadId: 'usr_student_1_usr_student_3_general',
      senderId: 'usr_student_3',
      recipientId: 'usr_student_1',
      text: 'Hey Rahul, saw you also have early sleep schedule and quiet study habits. Want to team up for a 2BHK?',
      readAt: null,
      createdAt: new Date(Date.now() - 800000).toISOString(),
    },
  ];

  const reports: ListingReport[] = [
    {
      id: 'rep_1',
      propertyId: 'prop_2',
      reporterId: 'usr_student_1',
      reason: 'Wrong details',
      details: 'The deposit listed was different when I spoke over call. Please verify.',
      status: 'pending',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  const maintenanceTickets: MaintenanceTicket[] = [
    {
      id: 'tk_1',
      propertyId: 'prop_1',
      propertyTitle: 'Sunrise PG near Gate 2',
      studentId: 'usr_student_1',
      studentName: 'Rahul Sharma',
      roomNo: 'Room 204',
      category: 'plumbing',
      priority: 'high',
      title: 'Washroom tap dripping & slow shower pressure',
      description: 'The cold water tap in attached washroom is constantly leaking and causing water wastage. Shower pressure dropped yesterday.',
      status: 'in_progress',
      assignedTechnician: 'Manoj Kumar (Plumber - +91 98112 34567)',
      resolutionNotes: 'Technician scheduled for 4:00 PM today with replacement ceramic valve.',
      createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    {
      id: 'tk_2',
      propertyId: 'prop_1',
      propertyTitle: 'Sunrise PG near Gate 2',
      studentId: 'usr_student_3',
      studentName: 'Aman Patel',
      roomNo: 'Room 205',
      category: 'wifi',
      priority: 'medium',
      title: '2nd Floor Wi-Fi router packet loss',
      description: 'The router on 2nd floor drops connection during evening study hours (8 PM - 11 PM). Please check adapter or reset channel.',
      status: 'pending',
      createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    },
    {
      id: 'tk_3',
      propertyId: 'prop_2',
      propertyTitle: 'Greenwood 2BHK Student Flat',
      studentId: 'usr_student_2',
      studentName: 'Priya Verma',
      roomNo: 'Flat 302',
      category: 'electrical',
      priority: 'low',
      title: 'Bedroom ceiling fan regulator replacement',
      description: 'Regulator knob was loose and only running on maximum speed 5. Requested electronic stepless regulator.',
      status: 'resolved',
      assignedTechnician: 'Dinesh (Electrician)',
      resolutionNotes: 'Replaced with Anchor Roma 5-step modular regulator. Tested and working fine.',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  const expenses: ExpenseItem[] = [
    {
      id: 'exp_1',
      title: 'October Shared 2BHK Flat Rent',
      category: 'rent',
      amount: 16000,
      paidBy: {
        id: 'usr_student_1',
        name: 'Rahul Sharma',
      },
      splitAmong: [
        { id: 'usr_student_1', name: 'Rahul Sharma', share: 8000, settled: true },
        { id: 'usr_student_3', name: 'Aman Patel', share: 8000, settled: false },
      ],
      upiId: 'rahulsharma@oksbi',
      date: '2026-10-01',
      createdAt: new Date(Date.now() - 11 * 86400000).toISOString(),
    },
    {
      id: 'exp_2',
      title: 'BSES TPDDL Electricity & Sub-meter',
      category: 'electricity',
      amount: 1940,
      paidBy: {
        id: 'usr_student_3',
        name: 'Aman Patel',
      },
      splitAmong: [
        { id: 'usr_student_1', name: 'Rahul Sharma', share: 970, settled: true },
        { id: 'usr_student_3', name: 'Aman Patel', share: 970, settled: true },
      ],
      upiId: 'amanpatel@paytm',
      date: '2026-10-05',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: 'exp_3',
      title: 'ACT Fibernet 150 Mbps High-Speed WiFi',
      category: 'wifi',
      amount: 899,
      paidBy: {
        id: 'usr_student_1',
        name: 'Rahul Sharma',
      },
      splitAmong: [
        { id: 'usr_student_1', name: 'Rahul Sharma', share: 450, settled: true },
        { id: 'usr_student_3', name: 'Aman Patel', share: 449, settled: false },
      ],
      upiId: 'rahulsharma@oksbi',
      date: '2026-10-08',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: 'exp_4',
      title: 'Weekly 20L RO Water Cans & Kitchen Essentials',
      category: 'water',
      amount: 680,
      paidBy: {
        id: 'usr_student_1',
        name: 'Rahul Sharma',
      },
      splitAmong: [
        { id: 'usr_student_1', name: 'Rahul Sharma', share: 340, settled: true },
        { id: 'usr_student_3', name: 'Aman Patel', share: 340, settled: false },
      ],
      upiId: 'rahulsharma@oksbi',
      date: '2026-10-10',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ];

  const mealVotes: MealVote[] = [
    {
      id: 'mv_1',
      messProviderId: 'mess_1',
      mealType: 'lunch',
      userId: 'usr_student_1',
      vote: 'up',
      dishFeedback: 'Paneer Butter Masala was very fresh today! Hot phulkas served on time.',
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: 'mv_2',
      messProviderId: 'mess_1',
      mealType: 'lunch',
      userId: 'usr_student_3',
      vote: 'up',
      dishFeedback: 'Dal Makhani tasted great, not too oily.',
      createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    },
    {
      id: 'mv_3',
      messProviderId: 'mess_2',
      mealType: 'lunch',
      userId: 'usr_student_2',
      vote: 'up',
      dishFeedback: 'Good portion size and clean packaging.',
      createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    },
  ];

  const safetyReviews: NeighborhoodSafetyReview[] = [
    {
      id: 'sr_1',
      propertyId: 'prop_1',
      studentId: 'usr_student_1',
      studentName: 'Rahul Sharma',
      overallScore: 9.3,
      streetLightingScore: 5,
      securityGuardsScore: 5,
      femaleFriendlyScore: 5,
      nightWalkability: 'well_lit',
      tips: 'Approach road directly faces DTU Gate 2. Brightly illuminated LED lights all night. Guard stays active at the barrier with visitor log.',
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
    {
      id: 'sr_2',
      propertyId: 'prop_2',
      studentId: 'usr_student_2',
      studentName: 'Priya Verma',
      overallScore: 8.8,
      streetLightingScore: 4,
      securityGuardsScore: 4,
      femaleFriendlyScore: 5,
      nightWalkability: 'safe',
      tips: 'E-rickshaws available right up to entrance till 10:30 PM. Apollo 24/7 chemist is only 150m down the lane. Very comfortable for female students.',
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    },
    {
      id: 'sr_3',
      propertyId: 'prop_3',
      studentId: 'usr_student_3',
      studentName: 'Aman Patel',
      overallScore: 8.6,
      streetLightingScore: 4,
      securityGuardsScore: 5,
      femaleFriendlyScore: 4,
      nightWalkability: 'safe',
      tips: 'Gated colony with boom barrier. CCTV camera installed at building entrance. Safe neighborhood for late library returns.',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];

  return {
    users,
    properties,
    messProviders,
    bookingRequests,
    reviews,
    messages,
    reports,
    maintenanceTickets,
    expenses,
    mealVotes,
    safetyReviews,
  };
}

class Store {
  private data: DatabaseState;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseState {
    const initial = getInitialData();
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        return {
          ...initial,
          ...parsed,
          maintenanceTickets: parsed.maintenanceTickets && parsed.maintenanceTickets.length > 0 ? parsed.maintenanceTickets : initial.maintenanceTickets,
          expenses: parsed.expenses && parsed.expenses.length > 0 ? parsed.expenses : initial.expenses,
          mealVotes: parsed.mealVotes && parsed.mealVotes.length > 0 ? parsed.mealVotes : initial.mealVotes,
          safetyReviews: parsed.safetyReviews && parsed.safetyReviews.length > 0 ? parsed.safetyReviews : initial.safetyReviews,
        };
      }
    } catch {
      // ignore
    }
    this.save(initial);
    return initial;
  }

  private save(state?: DatabaseState) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(state || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing DB file', err);
    }
  }

  // Users
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.users[idx];
  }

  // Properties
  getProperties(): Property[] {
    return this.data.properties;
  }

  getPropertyById(id: string): Property | undefined {
    return this.data.properties.find(p => p.id === id);
  }

  createProperty(prop: Property): Property {
    this.data.properties.push(prop);
    this.save();
    return prop;
  }

  updateProperty(id: string, updates: Partial<Property>): Property | undefined {
    const idx = this.data.properties.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.data.properties[idx] = { ...this.data.properties[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.properties[idx];
  }

  deleteProperty(id: string): boolean {
    const idx = this.data.properties.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.properties.splice(idx, 1);
    this.save();
    return true;
  }

  // Mess Providers
  getMessProviders(): MessProvider[] {
    return this.data.messProviders;
  }

  getMessProviderById(id: string): MessProvider | undefined {
    return this.data.messProviders.find(m => m.id === id);
  }

  createMessProvider(mess: MessProvider): MessProvider {
    this.data.messProviders.push(mess);
    this.save();
    return mess;
  }

  updateMessProvider(id: string, updates: Partial<MessProvider>): MessProvider | undefined {
    const idx = this.data.messProviders.findIndex(m => m.id === id);
    if (idx === -1) return undefined;
    this.data.messProviders[idx] = { ...this.data.messProviders[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.messProviders[idx];
  }

  deleteMessProvider(id: string): boolean {
    const idx = this.data.messProviders.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.data.messProviders.splice(idx, 1);
    // Also remove any meal votes for this mess
    if (this.data.mealVotes) {
      this.data.mealVotes = this.data.mealVotes.filter(v => v.messProviderId !== id);
    }
    this.save();
    return true;
  }

  // Bookings
  getBookings(): BookingRequest[] {
    return this.data.bookingRequests;
  }

  getBookingById(id: string): BookingRequest | undefined {
    return this.data.bookingRequests.find(b => b.id === id);
  }

  createBooking(bk: BookingRequest): BookingRequest {
    this.data.bookingRequests.push(bk);
    this.save();
    return bk;
  }

  updateBooking(id: string, updates: Partial<BookingRequest>): BookingRequest | undefined {
    const idx = this.data.bookingRequests.findIndex(b => b.id === id);
    if (idx === -1) return undefined;
    this.data.bookingRequests[idx] = { ...this.data.bookingRequests[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.bookingRequests[idx];
  }

  // Reviews
  getReviews(): Review[] {
    return this.data.reviews;
  }

  getReviewsByProperty(propId: string): Review[] {
    return this.data.reviews.filter(r => r.propertyId === propId);
  }

  createReview(rev: Review): Review {
    this.data.reviews.push(rev);
    // Recalculate property average rating
    if (rev.propertyId) {
      const propReviews = this.data.reviews.filter(r => r.propertyId === rev.propertyId);
      const avg = propReviews.reduce((sum, r) => sum + r.score, 0) / propReviews.length;
      this.updateProperty(rev.propertyId, {
        ratingAvg: Math.round(avg * 10) / 10,
        ratingCount: propReviews.length,
      });
    }
    this.save();
    return rev;
  }

  // Messages
  getMessages(): Message[] {
    return this.data.messages;
  }

  createMessage(msg: Message): Message {
    this.data.messages.push(msg);
    this.save();
    return msg;
  }

  markMessagesRead(threadId: string, recipientId: string): void {
    let changed = false;
    for (const msg of this.data.messages) {
      if (msg.threadId === threadId && msg.recipientId === recipientId && !msg.readAt) {
        msg.readAt = new Date().toISOString();
        changed = true;
      }
    }
    if (changed) this.save();
  }

  // Reports
  getReports(): ListingReport[] {
    return this.data.reports;
  }

  createReport(report: ListingReport): ListingReport {
    this.data.reports.push(report);
    this.save();
    return report;
  }

  updateReport(id: string, updates: Partial<ListingReport>): ListingReport | undefined {
    const idx = this.data.reports.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    this.data.reports[idx] = { ...this.data.reports[idx], ...updates };
    this.save();
    return this.data.reports[idx];
  }

  // Maintenance Tickets
  getMaintenanceTickets(): MaintenanceTicket[] {
    return this.data.maintenanceTickets || [];
  }

  getMaintenanceTicketById(id: string): MaintenanceTicket | undefined {
    return (this.data.maintenanceTickets || []).find(t => t.id === id);
  }

  createMaintenanceTicket(ticket: MaintenanceTicket): MaintenanceTicket {
    if (!this.data.maintenanceTickets) this.data.maintenanceTickets = [];
    this.data.maintenanceTickets.push(ticket);
    this.save();
    return ticket;
  }

  updateMaintenanceTicket(id: string, updates: Partial<MaintenanceTicket>): MaintenanceTicket | undefined {
    if (!this.data.maintenanceTickets) this.data.maintenanceTickets = [];
    const idx = this.data.maintenanceTickets.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    this.data.maintenanceTickets[idx] = {
      ...this.data.maintenanceTickets[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.maintenanceTickets[idx];
  }

  // Expenses
  getExpenses(): ExpenseItem[] {
    return this.data.expenses || [];
  }

  createExpense(expense: ExpenseItem): ExpenseItem {
    if (!this.data.expenses) this.data.expenses = [];
    this.data.expenses.push(expense);
    this.save();
    return expense;
  }

  updateExpense(id: string, updates: Partial<ExpenseItem>): ExpenseItem | undefined {
    if (!this.data.expenses) this.data.expenses = [];
    const idx = this.data.expenses.findIndex(e => e.id === id);
    if (idx === -1) return undefined;
    this.data.expenses[idx] = { ...this.data.expenses[idx], ...updates };
    this.save();
    return this.data.expenses[idx];
  }

  deleteExpense(id: string): boolean {
    if (!this.data.expenses) this.data.expenses = [];
    const prev = this.data.expenses.length;
    this.data.expenses = this.data.expenses.filter(e => e.id !== id);
    const deleted = this.data.expenses.length < prev;
    if (deleted) this.save();
    return deleted;
  }

  // Meal Votes
  getMealVotes(messProviderId?: string): MealVote[] {
    if (!this.data.mealVotes) this.data.mealVotes = [];
    if (messProviderId) {
      return this.data.mealVotes.filter(v => v.messProviderId === messProviderId);
    }
    return this.data.mealVotes;
  }

  createMealVote(vote: MealVote): MealVote {
    if (!this.data.mealVotes) this.data.mealVotes = [];
    // If existing vote by same user for same mess and mealType today, update it
    const existingIdx = this.data.mealVotes.findIndex(
      v => v.messProviderId === vote.messProviderId && v.mealType === vote.mealType && v.userId === vote.userId
    );
    if (existingIdx !== -1) {
      this.data.mealVotes[existingIdx] = { ...this.data.mealVotes[existingIdx], ...vote, createdAt: new Date().toISOString() };
      this.save();
      return this.data.mealVotes[existingIdx];
    }
    this.data.mealVotes.push(vote);
    this.save();
    return vote;
  }

  // Neighborhood Safety Reviews
  getSafetyReviews(propertyId?: string): NeighborhoodSafetyReview[] {
    if (!this.data.safetyReviews) this.data.safetyReviews = [];
    if (propertyId) {
      return this.data.safetyReviews.filter(s => s.propertyId === propertyId);
    }
    return this.data.safetyReviews;
  }

  createSafetyReview(rev: NeighborhoodSafetyReview): NeighborhoodSafetyReview {
    if (!this.data.safetyReviews) this.data.safetyReviews = [];
    this.data.safetyReviews.push(rev);
    this.save();
    return rev;
  }

  getRawData(): DatabaseState {
    return this.data;
  }

  async syncFromMongo(): Promise<void> {
    if (!isMongoConnected()) return;
    try {
      const [
        users,
        properties,
        messProviders,
        bookingRequests,
        reviews,
        messages,
        reports,
        maintenanceTickets,
        expenses,
        mealVotes,
        safetyReviews,
      ] = await Promise.all([
        UserModel.find().lean().exec(),
        PropertyModel.find().lean().exec(),
        MessProviderModel.find().lean().exec(),
        BookingRequestModel.find().lean().exec(),
        ReviewModel.find().lean().exec(),
        MessageModel.find().lean().exec(),
        ListingReportModel.find().lean().exec(),
        MaintenanceTicketModel.find().lean().exec(),
        ExpenseItemModel.find().lean().exec(),
        MealVoteModel.find().lean().exec(),
        SafetyReviewModel.find().lean().exec(),
      ]);

      if (users && users.length > 0) {
        this.data.users = users.map((u: any) => ({ ...u, _id: undefined }));
      }
      if (properties && properties.length > 0) {
        this.data.properties = properties.map((p: any) => ({ ...p, _id: undefined }));
      }
      if (messProviders && messProviders.length > 0) {
        this.data.messProviders = messProviders.map((m: any) => ({ ...m, _id: undefined }));
      }
      if (bookingRequests && bookingRequests.length > 0) {
        this.data.bookingRequests = bookingRequests.map((b: any) => ({ ...b, _id: undefined }));
      }
      if (reviews && reviews.length > 0) {
        this.data.reviews = reviews.map((r: any) => ({ ...r, _id: undefined }));
      }
      if (messages && messages.length > 0) {
        this.data.messages = messages.map((m: any) => ({ ...m, _id: undefined }));
      }
      if (reports && reports.length > 0) {
        this.data.reports = reports.map((rep: any) => ({ ...rep, _id: undefined }));
      }
      if (maintenanceTickets && maintenanceTickets.length > 0) {
        this.data.maintenanceTickets = maintenanceTickets.map((t: any) => ({ ...t, _id: undefined }));
      }
      if (expenses && expenses.length > 0) {
        this.data.expenses = expenses.map((e: any) => ({ ...e, _id: undefined }));
      }
      if (mealVotes && mealVotes.length > 0) {
        this.data.mealVotes = mealVotes.map((v: any) => ({ ...v, _id: undefined }));
      }
      if (safetyReviews && safetyReviews.length > 0) {
        this.data.safetyReviews = safetyReviews.map((s: any) => ({ ...s, _id: undefined }));
      }

      this.save();
      console.log(`[MongoDB] Memory cache synced from MongoDB successfully.`);
    } catch (err: any) {
      console.warn('[MongoDB] syncFromMongo error:', err.message);
    }
  }

  resetToDefault() {
    this.data = getInitialData();
    this.save();
    return this.data;
  }
}

export const db = new Store();
