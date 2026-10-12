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

  const {
    sleepSchedule,
    diet,
    smoking,
    studyHabits,
    cleanliness,
    guestPolicy,
    foodSharing,
    budgetMin,
    budgetMax,
    interests,
    lookingForRoommate,
  } = req.body;
  const currentPrefs: RoommatePrefs = req.user.roommatePrefs || {};

  const updatedPrefs: RoommatePrefs = {
    ...currentPrefs,
    ...(sleepSchedule !== undefined && { sleepSchedule }),
    ...(diet !== undefined && { diet }),
    ...(smoking !== undefined && { smoking }),
    ...(studyHabits !== undefined && { studyHabits }),
    ...(cleanliness !== undefined && { cleanliness }),
    ...(guestPolicy !== undefined && { guestPolicy }),
    ...(foodSharing !== undefined && { foodSharing }),
    ...(budgetMin !== undefined && { budgetMin: Number(budgetMin) }),
    ...(budgetMax !== undefined && { budgetMax: Number(budgetMax) }),
    ...(interests !== undefined && { interests: Array.isArray(interests) ? interests : [] }),
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

// Advanced Multi-Vector Roommate Recommendation Algorithm
usersRouter.get('/roommates/find', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const currentUser = req.user;
  const myPrefs = currentUser.roommatePrefs || {};

  const {
    sleepSchedule,
    diet,
    smoking,
    studyHabits,
    cleanliness,
    interest,
    college,
  } = req.query as Record<string, string>;

  const allUsers = db.getUsers();

  // Find other students who opted-in for roommate matching
  const candidates = allUsers.filter(u =>
    u.id !== currentUser.id &&
    u.role === 'student' &&
    u.roommatePrefs?.lookingForRoommate === true
  );

  const scoredResults = candidates.map(other => {
    const oPrefs = other.roommatePrefs || {};
    const matchReasons: string[] = [];

    // 1. Lifestyle Vector (Sleep schedule + Cleanliness) -> 0-100 scale
    let lifestyleScore = 70;
    if (myPrefs.sleepSchedule && oPrefs.sleepSchedule) {
      if (myPrefs.sleepSchedule === oPrefs.sleepSchedule) {
        lifestyleScore += 18;
        matchReasons.push(
          myPrefs.sleepSchedule === 'early'
            ? 'Both early risers with morning focus'
            : myPrefs.sleepSchedule === 'late'
            ? 'Both night owls studying late'
            : 'Flexible sleeping schedules'
        );
      } else if (myPrefs.sleepSchedule === 'flexible' || oPrefs.sleepSchedule === 'flexible') {
        lifestyleScore += 8;
      } else {
        lifestyleScore -= 18;
      }
    }

    if (myPrefs.cleanliness && oPrefs.cleanliness) {
      if (myPrefs.cleanliness === oPrefs.cleanliness) {
        lifestyleScore += 12;
        if (myPrefs.cleanliness === 'neat_freak') {
          matchReasons.push('Mutual commitment to neat & tidy flat');
        }
      } else if (
        (myPrefs.cleanliness === 'neat_freak' && oPrefs.cleanliness === 'relaxed') ||
        (myPrefs.cleanliness === 'relaxed' && oPrefs.cleanliness === 'neat_freak')
      ) {
        lifestyleScore -= 20;
      }
    }
    const finalLifestyle = Math.min(100, Math.max(30, lifestyleScore));

    // 2. Study & Social Vibe (Study habits + Guest policy) -> 0-100 scale
    let studyScore = 65;
    if (myPrefs.studyHabits && oPrefs.studyHabits) {
      if (myPrefs.studyHabits === oPrefs.studyHabits) {
        studyScore += 20;
        matchReasons.push(`Harmonious ${myPrefs.studyHabits} study environment`);
      } else if (myPrefs.studyHabits === 'moderate' || oPrefs.studyHabits === 'moderate') {
        studyScore += 10;
      } else {
        studyScore -= 12;
      }
    }

    if (myPrefs.guestPolicy && oPrefs.guestPolicy) {
      if (myPrefs.guestPolicy === oPrefs.guestPolicy) {
        studyScore += 15;
      } else if (myPrefs.guestPolicy === 'flexible' || oPrefs.guestPolicy === 'flexible') {
        studyScore += 8;
      }
    }
    const finalStudy = Math.min(100, Math.max(30, studyScore));

    // 3. Habits & Diet Vector (Diet + Smoking + Food sharing) -> 0-100 scale
    let habitsScore = 70;
    if (myPrefs.diet && oPrefs.diet) {
      if (myPrefs.diet === oPrefs.diet) {
        habitsScore += 15;
        if (myPrefs.diet === 'veg') matchReasons.push('Both prefer vegetarian kitchen');
      } else if (myPrefs.diet === 'both' || oPrefs.diet === 'both') {
        habitsScore += 8;
      } else {
        habitsScore -= 8;
      }
    }

    if (myPrefs.smoking && oPrefs.smoking) {
      if (myPrefs.smoking === oPrefs.smoking) {
        habitsScore += 15;
        if (myPrefs.smoking === 'no') matchReasons.push('100% smoke-free flat preference');
      } else if (myPrefs.smoking === 'no' && oPrefs.smoking === 'yes') {
        habitsScore -= 30; // heavy mismatch
      } else {
        habitsScore -= 5;
      }
    }

    if (myPrefs.foodSharing && oPrefs.foodSharing) {
      if (myPrefs.foodSharing === oPrefs.foodSharing) {
        habitsScore += 10;
        if (myPrefs.foodSharing === 'cook_together') {
          matchReasons.push('Excited to cook meals together');
        }
      }
    }
    const finalHabits = Math.min(100, Math.max(25, habitsScore));

    // 4. Interests & Passions Vector
    let interestsScore = 50;
    const myInterests = myPrefs.interests || [];
    const oInterests = oPrefs.interests || [];
    const sharedInterests = myInterests.filter(i => oInterests.includes(i));

    if (sharedInterests.length > 0) {
      interestsScore += Math.min(45, sharedInterests.length * 15);
      matchReasons.push(`Common passions: ${sharedInterests.join(', ')}`);
    }
    const finalInterests = Math.min(100, Math.max(40, interestsScore));

    // 5. Budget Compatibility Vector
    let budgetScore = 75;
    const myMin = myPrefs.budgetMin || 5000;
    const myMax = myPrefs.budgetMax || 15000;
    const oMin = oPrefs.budgetMin || 5000;
    const oMax = oPrefs.budgetMax || 15000;

    // Check overlap of [myMin, myMax] and [oMin, oMax]
    const overlapMin = Math.max(myMin, oMin);
    const overlapMax = Math.min(myMax, oMax);
    if (overlapMax >= overlapMin) {
      budgetScore += 20;
      matchReasons.push(`Overlapping rent budget (₹${overlapMin.toLocaleString()} - ₹${overlapMax.toLocaleString()}/mo)`);
    } else {
      budgetScore -= 25;
    }
    const finalBudget = Math.min(100, Math.max(30, budgetScore));

    // College connection bonus
    if (currentUser.college && other.college && currentUser.college.toLowerCase().trim() === other.college.toLowerCase().trim()) {
      matchReasons.push(`Attends same campus: ${other.college}`);
    }

    // Weighted Overall Compatibility Percentage
    // Weights: Lifestyle (25%), Study (25%), Habits (20%), Interests (15%), Budget (15%)
    const weightedTotal = Math.round(
      finalLifestyle * 0.25 +
      finalStudy * 0.25 +
      finalHabits * 0.20 +
      finalInterests * 0.15 +
      finalBudget * 0.15
    );

    const compatibility = Math.min(99, Math.max(35, weightedTotal));

    return {
      id: other.id,
      name: other.name,
      college: other.college,
      ratingAvg: other.ratingAvg,
      roommatePrefs: oPrefs,
      compatibility,
      matchReasons,
      breakdown: {
        lifestyle: finalLifestyle,
        habits: finalHabits,
        study: finalStudy,
        interests: finalInterests,
        budget: finalBudget,
      },
    };
  });

  // Apply optional filters
  const filtered = scoredResults.filter(item => {
    if (sleepSchedule && sleepSchedule !== 'any' && item.roommatePrefs.sleepSchedule !== sleepSchedule) return false;
    if (diet && diet !== 'any' && item.roommatePrefs.diet !== diet) return false;
    if (smoking && smoking !== 'any' && item.roommatePrefs.smoking !== smoking) return false;
    if (studyHabits && studyHabits !== 'any' && item.roommatePrefs.studyHabits !== studyHabits) return false;
    if (cleanliness && cleanliness !== 'any' && item.roommatePrefs.cleanliness !== cleanliness) return false;
    if (interest && interest !== 'any' && !item.roommatePrefs.interests?.includes(interest)) return false;
    if (college && college !== 'any' && item.college !== college) return false;
    return true;
  });

  // Sort by compatibility descending
  filtered.sort((a, b) => b.compatibility - a.compatibility);

  res.json(filtered);
});
