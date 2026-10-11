import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { RoommatePrefs, User } from '../types';

export const usersRouter = Router();

function sanitizeUser(user: User) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}

// Get current logged-in user
usersRouter.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json(sanitizeUser(req.user));
});

// Update basic profile details
usersRouter.put('/me', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { name, college, phone } = req.body;
  const updated = db.updateUser(req.user.id, {
    ...(name && { name }),
    ...(college !== undefined && { college }),
    ...(phone !== undefined && { phone }),
  });

  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json(sanitizeUser(updated));
});

// Update roommate preferences
usersRouter.put('/me/roommate-prefs', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { sleepSchedule, diet, smoking, studyHabits, lookingForRoommate } = req.body;
  const currentPrefs: RoommatePrefs = req.user.roommatePrefs || {};

  const updatedPrefs: RoommatePrefs = {
    ...currentPrefs,
    ...(sleepSchedule !== undefined && { sleepSchedule }),
    ...(diet !== undefined && { diet }),
    ...(smoking !== undefined && { smoking }),
    ...(studyHabits !== undefined && { studyHabits }),
    ...(lookingForRoommate !== undefined && { lookingForRoommate: Boolean(lookingForRoommate) }),
  };

  const updated = db.updateUser(req.user.id, {
    roommatePrefs: updatedPrefs,
  });

  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    message: 'Roommate preferences updated',
    user: sanitizeUser(updated),
  });
});

// Submit verification document (Owners)
usersRouter.post('/submit-verification', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { docUrl } = req.body;
  if (!docUrl) {
    res.status(400).json({ error: 'Document URL or upload is required.' });
    return;
  }

  const updated = db.updateUser(req.user.id, {
    verificationDocUrl: docUrl,
    verificationStatus: 'pending',
    isVerified: false,
  });

  res.json({
    message: 'Verification document submitted. Waiting for admin approval.',
    user: updated ? sanitizeUser(updated) : undefined,
  });
});

// Scored Roommate Matching
usersRouter.get('/roommates/find', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const currentUser = req.user;
  const myPrefs = currentUser.roommatePrefs || {};

  const { sleepSchedule, diet, smoking, studyHabits } = req.query as Record<string, string>;

  const allUsers = db.getUsers();

  // Find other students who opted-in for roommate matching
  const candidates = allUsers.filter(u =>
    u.id !== currentUser.id &&
    u.role === 'student' &&
    u.roommatePrefs?.lookingForRoommate === true
  );

  const scoredResults = candidates.map(other => {
    const oPrefs = other.roommatePrefs || {};
    let score = 50; // base score

    // Sleep schedule match (up to 20 pts)
    if (myPrefs.sleepSchedule && oPrefs.sleepSchedule) {
      if (myPrefs.sleepSchedule === oPrefs.sleepSchedule) score += 20;
      else if (myPrefs.sleepSchedule === 'flexible' || oPrefs.sleepSchedule === 'flexible') score += 12;
      else score -= 10;
    }

    // Diet match (up to 15 pts)
    if (myPrefs.diet && oPrefs.diet) {
      if (myPrefs.diet === oPrefs.diet) score += 15;
      else if (myPrefs.diet === 'both' || oPrefs.diet === 'both') score += 10;
      else score -= 5;
    }

    // Smoking match (up to 20 pts)
    if (myPrefs.smoking && oPrefs.smoking) {
      if (myPrefs.smoking === oPrefs.smoking) score += 20;
      else if (myPrefs.smoking === 'no' && oPrefs.smoking === 'yes') score -= 25;
      else score -= 5;
    }

    // Study habits match (up to 15 pts)
    if (myPrefs.studyHabits && oPrefs.studyHabits) {
      if (myPrefs.studyHabits === oPrefs.studyHabits) score += 15;
      else if (myPrefs.studyHabits === 'moderate' || oPrefs.studyHabits === 'moderate') score += 10;
      else score -= 5;
    }

    // Clamp score 0 - 99%
    const compatibility = Math.min(99, Math.max(25, score));

    return {
      id: other.id,
      name: other.name,
      college: other.college,
      ratingAvg: other.ratingAvg,
      roommatePrefs: oPrefs,
      compatibility,
    };
  });

  // Apply optional exact query filters if user clicked filter chips
  const filtered = scoredResults.filter(item => {
    if (sleepSchedule && sleepSchedule !== 'any' && item.roommatePrefs.sleepSchedule !== sleepSchedule) return false;
    if (diet && diet !== 'any' && item.roommatePrefs.diet !== diet) return false;
    if (smoking && smoking !== 'any' && item.roommatePrefs.smoking !== smoking) return false;
    if (studyHabits && studyHabits !== 'any' && item.roommatePrefs.studyHabits !== studyHabits) return false;
    return true;
  });

  // Sort by compatibility descending
  filtered.sort((a, b) => b.compatibility - a.compatibility);

  res.json(filtered);
});
