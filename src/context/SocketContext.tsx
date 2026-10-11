import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Message } from '../types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeTypingUser: { senderId: string; isTyping: boolean } | null;
  joinChatRoom: (otherUserId: string, propertyId?: string) => void;
  sendChatMessage: (recipientId: string, text: string, propertyId?: string) => void;
  sendTypingStatus: (recipientId: string, isTyping: boolean, propertyId?: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeTypingUser, setActiveTypingUser] = useState<{ senderId: string; isTyping: boolean } | null>(null);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io({
      auth: { token },
      autoConnect: true,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('chat:typing', (data: { senderId: string; isTyping: boolean }) => {
      setActiveTypingUser(data);
      if (data.isTyping) {
        // Auto-clear typing indicator after 3 seconds
        setTimeout(() => {
          setActiveTypingUser(null);
        }, 3000);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user?.id]);

  const joinChatRoom = (otherUserId: string, propertyId?: string) => {
    if (socket && isConnected) {
      socket.emit('join-chat', { otherUserId, propertyId });
    }
  };

  const sendChatMessage = (recipientId: string, text: string, propertyId?: string) => {
    if (socket && isConnected) {
      socket.emit('chat:send', { recipientId, propertyId, text });
    }
  };

  const sendTypingStatus = (recipientId: string, isTyping: boolean, propertyId?: string) => {
    if (socket && isConnected) {
      socket.emit('chat:typing', { recipientId, propertyId, isTyping });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        activeTypingUser,
        joinChatRoom,
        sendChatMessage,
        sendTypingStatus,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
