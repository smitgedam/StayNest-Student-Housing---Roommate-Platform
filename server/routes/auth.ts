import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { User } from '../types';
import { AuthenticatedRequest, authMiddleware, JWT_SECRET } from '../middleware/auth';

export const authRouter = Router();

function sanitizeUser(user: User) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}

// Register
authRouter.post('/register', (req, res: Response): void => {
  const { name, email, password, role, college, phone } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: 'Name, email, password, and role are required.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  const validRoles = ['student', 'owner', 'mess_provider', 'admin'];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: 'Invalid role. Must be student, owner, or mess_provider.' });
    return;
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();

  // Owners start as unverified until approved or verified
  const isVerified = role === 'student' ? true : false;

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    email: email.trim().toLowerCase(),
    passwordHash,
    role,
    isVerified,
    verificationStatus: role === 'owner' ? 'none' : 'approved',
    college: college || '',
    phone: phone || '',
    roommatePrefs: role === 'student' ? {
      sleepSchedule: 'flexible',
      diet: 'both',
      smoking: 'no',
      studyHabits: 'moderate',
      lookingForRoommate: true,
    } : undefined,
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  db.createUser(newUser);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    message: 'Registration successful',
    token,
    user: sanitizeUser(newUser),
  });
});

// Login
authRouter.post('/login', (req, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const isValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: sanitizeUser(user),
  });
});

// Demo accounts for instant role-switching and quick test
authRouter.get('/demo-accounts', (_req, res: Response): void => {
  const accounts = [
    {
      role: 'student',
      title: 'Student (Rahul)',
      email: 'rahul@college.edu',
      password: 'password123',
      description: 'Browsing PGs, looking for roommates, has bookings',
    },
    {
      role: 'owner',
      title: 'Verified Owner (Vikram)',
      email: 'vikram@staynest.com',
      password: 'password123',
      description: 'Owns Sunrise PG & Green Nest 2BHK, manages bookings',
    },
    {
      role: 'owner',
      title: 'Unverified Owner (Suresh)',
      email: 'suresh@staynest.com',
      password: 'password123',
      description: 'Pending verification document in admin queue',
    },
    {
      role: 'mess_provider',
      title: 'Mess Provider (Annapurna)',
      email: 'annapurna@staynest.com',
      password: 'password123',
      description: 'Runs daily tiffin delivery service & meal plans',
    },
    {
      role: 'admin',
      title: 'Admin Moderator',
      email: 'admin@staynest.com',
      password: 'password123',
      description: 'Approves owner verifications and moderates reports',
    },
  ];
  res.json(accounts);
});
