import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { ExpenseItem, ExpenseParticipant } from '../types';

export const expensesRouter = Router();

// GET /api/expenses - List expenses for student flatmates
expensesRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const allExpenses = db.getExpenses();
  // Filter where user is payer or participant
  const myExpenses = allExpenses.filter(e =>
    e.paidBy.id === req.user!.id ||
    e.splitAmong.some(p => p.id === req.user!.id)
  );

  res.json(myExpenses);
});

// POST /api/expenses - Create new expense with split calculation
expensesRouter.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { title, category, amount, splitWith, upiId, date } = req.body;

  const totalAmount = parseFloat(amount);
  if (!title || isNaN(totalAmount) || totalAmount <= 0) {
    res.status(400).json({ error: 'Valid title and positive amount required.' });
    return;
  }

  // Participants: current user + any selected roommates
  const participantIds: string[] = Array.isArray(splitWith) && splitWith.length > 0
    ? Array.from(new Set([req.user.id, ...splitWith]))
    : [req.user.id];

  const sharePerPerson = Math.round((totalAmount / participantIds.length) * 100) / 100;

  const allUsers = db.getUsers();
  const splitAmong: ExpenseParticipant[] = participantIds.map(uid => {
    const u = allUsers.find(user => user.id === uid);
    return {
      id: uid,
      name: u ? u.name : (uid === req.user!.id ? req.user!.name : 'Flatmate'),
      share: sharePerPerson,
      settled: uid === req.user!.id, // Payer is automatically settled
    };
  });

  const newExpense: ExpenseItem = {
    id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    category: category || 'other',
    amount: totalAmount,
    paidBy: {
      id: req.user.id,
      name: req.user.name,
    },
    splitAmong,
    upiId: upiId ? upiId.trim() : (req.user.phone ? `${req.user.phone.replace(/[^0-9]/g, '')}@upi` : undefined),
    date: date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };

  const created = db.createExpense(newExpense);
  res.status(201).json({
    message: 'Expense added to shared ledger',
    expense: created,
  });
});

// PATCH /api/expenses/:id/settle - Toggle settlement for participant
expensesRouter.patch('/:id/settle', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { participantId, settled } = req.body;
  const targetId = participantId || req.user.id;

  const expenses = db.getExpenses();
  const expense = expenses.find(e => e.id === req.params.id);

  if (!expense) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }

  const updatedParticipants = expense.splitAmong.map(p => {
    if (p.id === targetId) {
      return { ...p, settled: settled !== undefined ? Boolean(settled) : !p.settled };
    }
    return p;
  });

  const updated = db.updateExpense(expense.id, {
    splitAmong: updatedParticipants,
  });

  res.json({
    message: 'Settlement status updated',
    expense: updated,
  });
});

// DELETE /api/expenses/:id
expensesRouter.delete('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const expense = db.getExpenses().find(e => e.id === req.params.id);
  if (!expense) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }

  if (expense.paidBy.id !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Only the person who logged the expense can delete it.' });
    return;
  }

  db.deleteExpense(expense.id);
  res.json({ message: 'Expense removed from ledger' });
});
