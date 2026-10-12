import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { MaintenanceTicket } from '../types';

export const maintenanceRouter = Router();

// GET /api/maintenance - Get maintenance tickets for current user or properties
maintenanceRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const allTickets = db.getMaintenanceTickets();

  if (req.user.role === 'student') {
    // Return tickets submitted by this student
    const studentTickets = allTickets.filter(t => t.studentId === req.user!.id);
    res.json(studentTickets);
    return;
  }

  if (req.user.role === 'owner') {
    // Return tickets for properties owned by this owner
    const myProperties = db.getProperties().filter(p => p.ownerId === req.user!.id);
    const myPropIds = new Set(myProperties.map(p => p.id));
    const ownerTickets = allTickets.filter(t => t.propertyId && myPropIds.has(t.propertyId));
    res.json(ownerTickets);
    return;
  }

  // Admin sees all
  res.json(allTickets);
});

// POST /api/maintenance - Raise a new maintenance ticket
maintenanceRouter.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { propertyId, propertyTitle, roomNo, category, priority, title, description } = req.body;

  if (!title || !description || !category) {
    res.status(400).json({ error: 'Title, description, and issue category are required.' });
    return;
  }

  const newTicket: MaintenanceTicket = {
    id: `tk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    propertyId: propertyId || undefined,
    propertyTitle: propertyTitle || 'Campus Student Housing',
    studentId: req.user.id,
    studentName: req.user.name,
    roomNo: roomNo || 'Flat/Room',
    category: category || 'other',
    priority: priority || 'medium',
    title: title.trim(),
    description: description.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = db.createMaintenanceTicket(newTicket);
  res.status(201).json({
    message: 'Maintenance ticket created successfully.',
    ticket: created,
  });
});

// PATCH /api/maintenance/:id/status - Update ticket status, technician, or notes
maintenanceRouter.patch('/:id/status', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { status, assignedTechnician, resolutionNotes } = req.body;
  const ticket = db.getMaintenanceTicketById(req.params.id);

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const updated = db.updateMaintenanceTicket(ticket.id, {
    ...(status && { status }),
    ...(assignedTechnician !== undefined && { assignedTechnician }),
    ...(resolutionNotes !== undefined && { resolutionNotes }),
  });

  res.json({
    message: 'Ticket updated successfully',
    ticket: updated,
  });
});
