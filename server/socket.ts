import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { JWT_SECRET } from './middleware/auth';
import { getThreadId } from './routes/chat';
import { Message, UserRole } from './types';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: UserRole;
  userEmail?: string;
}

export function setupSocketIO(io: SocketIOServer) {
  // Map userId -> Set of socket IDs
  const userSockets = new Map<string, Set<string>>();

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole };
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userEmail = decoded.email;
      next();
    } catch {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    if (!userId) return;

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    // Join user's personal channel
    socket.join(`user_${userId}`);

    // Join specific chat room
    socket.on('join-chat', (data: { otherUserId: string; propertyId?: string }) => {
      if (!data?.otherUserId) return;
      const room = getThreadId(userId, data.otherUserId, data.propertyId);
      socket.join(room);
    });

    // Send real-time message
    socket.on('chat:send', (data: { recipientId: string; propertyId?: string; text: string }) => {
      const { recipientId, propertyId, text } = data;
      if (!recipientId || !text || !text.trim()) return;

      const room = getThreadId(userId, recipientId, propertyId);
      const now = new Date().toISOString();

      const newMsg: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        threadId: room,
        senderId: userId,
        recipientId,
        propertyId: propertyId || undefined,
        text: text.trim(),
        readAt: null,
        createdAt: now,
      };

      db.createMessage(newMsg);

      // Emit to room
      io.to(room).emit('chat:message', newMsg);

      // Emit notification to recipient's personal room
      io.to(`user_${recipientId}`).emit('chat:new', {
        message: newMsg,
        sender: db.getUserById(userId) ? {
          id: userId,
          name: db.getUserById(userId)!.name,
        } : null,
      });
    });

    // Typing indicator
    socket.on('chat:typing', (data: { recipientId: string; propertyId?: string; isTyping: boolean }) => {
      const { recipientId, propertyId, isTyping } = data;
      if (!recipientId) return;
      const room = getThreadId(userId, recipientId, propertyId);
      socket.to(room).emit('chat:typing', {
        senderId: userId,
        isTyping,
      });
    });

    // Mark messages read
    socket.on('chat:read', (data: { otherUserId: string; propertyId?: string }) => {
      if (!data?.otherUserId) return;
      const room = getThreadId(userId, data.otherUserId, data.propertyId);
      db.markMessagesRead(room, userId);
      socket.to(room).emit('chat:read_receipt', { threadId: room, readBy: userId });
    });

    socket.on('disconnect', () => {
      const s = userSockets.get(userId);
      if (s) {
        s.delete(socket.id);
        if (s.size === 0) userSockets.delete(userId);
      }
    });
  });

  return {
    // Broadcast property status changes to all connected clients
    broadcastPropertyUpdate: (property: unknown) => {
      io.emit('property:status_changed', property);
    },
    // Send booking status update to student and owner
    sendBookingUpdate: (booking: { studentId: string; ownerId: string }) => {
      io.to(`user_${booking.studentId}`).emit('booking:update', booking);
      io.to(`user_${booking.ownerId}`).emit('booking:update', booking);
    },
  };
}
