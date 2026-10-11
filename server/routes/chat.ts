import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { Message } from '../types';

export const chatRouter = Router();

export function getThreadId(userA: string, userB: string, propertyId?: string): string {
  const sortedUsers = [userA, userB].sort();
  return `${sortedUsers[0]}_${sortedUsers[1]}_${propertyId || 'general'}`;
}

// GET /api/chat/threads - List conversations
chatRouter.get('/threads', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const userId = req.user.id;
  const allMessages = db.getMessages();

  // Find all messages involving this user
  const userMessages = allMessages.filter(m => m.senderId === userId || m.recipientId === userId);

  // Group by threadId
  const threadMap = new Map<string, Message[]>();
  for (const msg of userMessages) {
    if (!threadMap.has(msg.threadId)) {
      threadMap.set(msg.threadId, []);
    }
    threadMap.get(msg.threadId)!.push(msg);
  }

  const threads = Array.from(threadMap.entries()).map(([threadId, msgs]) => {
    // Sort chronological
    msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const lastMsg = msgs[msgs.length - 1];

    const otherUserId = lastMsg.senderId === userId ? lastMsg.recipientId : lastMsg.senderId;
    const otherUser = db.getUserById(otherUserId);
    const property = lastMsg.propertyId ? db.getPropertyById(lastMsg.propertyId) : undefined;

    const unreadCount = msgs.filter(m => m.recipientId === userId && !m.readAt).length;

    return {
      threadId,
      otherUser: otherUser ? {
        id: otherUser.id,
        name: otherUser.name,
        role: otherUser.role,
        college: otherUser.college,
        isVerified: otherUser.isVerified,
      } : { id: otherUserId, name: 'User', role: 'student', isVerified: false },
      property: property ? {
        id: property.id,
        title: property.title,
        rentPerMonth: property.rentPerMonth,
      } : null,
      lastMessage: {
        text: lastMsg.text,
        createdAt: lastMsg.createdAt,
        isMine: lastMsg.senderId === userId,
      },
      unreadCount,
    };
  });

  // Sort by latest message date
  threads.sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());

  res.json(threads);
});

// GET /api/chat/thread/:otherUserId - Get messages in a conversation
chatRouter.get('/thread/:otherUserId', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const otherUserId = req.params.otherUserId;
  const propertyId = req.query.propertyId as string | undefined;
  const threadId = getThreadId(req.user.id, otherUserId, propertyId);

  // Mark unread messages as read
  db.markMessagesRead(threadId, req.user.id);

  const messages = db.getMessages().filter(m => m.threadId === threadId);
  messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const otherUser = db.getUserById(otherUserId);
  const property = propertyId ? db.getPropertyById(propertyId) : undefined;

  res.json({
    threadId,
    otherUser: otherUser ? {
      id: otherUser.id,
      name: otherUser.name,
      role: otherUser.role,
      college: otherUser.college,
      isVerified: otherUser.isVerified,
    } : null,
    property: property ? {
      id: property.id,
      title: property.title,
      rentPerMonth: property.rentPerMonth,
    } : null,
    messages,
  });
});

// POST /api/chat/send - REST API send message
chatRouter.post('/send', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { recipientId, propertyId, text } = req.body;
  if (!recipientId || !text || !text.trim()) {
    res.status(400).json({ error: 'Recipient ID and message text are required.' });
    return;
  }

  const recipient = db.getUserById(recipientId);
  if (!recipient) {
    res.status(404).json({ error: 'Recipient user not found.' });
    return;
  }

  const threadId = getThreadId(req.user.id, recipientId, propertyId);
  const now = new Date().toISOString();

  const newMsg: Message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    threadId,
    senderId: req.user.id,
    recipientId,
    propertyId: propertyId || undefined,
    text: text.trim(),
    readAt: null,
    createdAt: now,
  };

  db.createMessage(newMsg);

  res.status(201).json({
    message: 'Message sent',
    data: newMsg,
  });
});
