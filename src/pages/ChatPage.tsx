import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Message, ChatThreadSummary } from '../types';
import { Send, MessageSquare, Building, Check, CheckCheck, User, ArrowLeft } from 'lucide-react';

interface ChatPageProps {
  initialRecipientId?: string | null;
  initialPropertyId?: string | null;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  initialRecipientId,
  initialPropertyId,
}) => {
  const { user, token } = useAuth();
  const { socket, isConnected, activeTypingUser, joinChatRoom, sendChatMessage, sendTypingStatus } = useSocket();

  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(initialRecipientId || null);
  const [activePropertyId, setActivePropertyId] = useState<string | null>(initialPropertyId || null);
  const [activeThreadInfo, setActiveThreadInfo] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(initialRecipientId ? 'chat' : 'list');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Load threads
  const fetchThreads = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/chat/threads', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: ChatThreadSummary[] = await res.json();
        setThreads(data);

        // If no active recipient chosen, pick first thread
        if (!activeRecipientId && data.length > 0) {
          setActiveRecipientId(data[0].otherUser.id);
          setActivePropertyId(data[0].property?.id || null);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [token]);

  // Load messages for active thread
  const fetchMessages = async (otherId: string, propId?: string | null) => {
    if (!token) return;
    try {
      const url = propId
        ? `/api/chat/thread/${otherId}?propertyId=${propId}`
        : `/api/chat/thread/${otherId}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setActiveThreadInfo(data);
        joinChatRoom(otherId, propId || undefined);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (activeRecipientId) {
      fetchMessages(activeRecipientId, activePropertyId);
    }
  }, [activeRecipientId, activePropertyId, token]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket listener for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      // If belongs to current active thread, add to messages
      if (
        (msg.senderId === activeRecipientId && msg.recipientId === user?.id) ||
        (msg.senderId === user?.id && msg.recipientId === activeRecipientId)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      // Refresh threads list to update preview and unread counts
      fetchThreads();
    };

    socket.on('chat:message', handleNewMessage);
    socket.on('chat:new', () => {
      fetchThreads();
    });

    return () => {
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:new');
    };
  }, [socket, activeRecipientId, user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (activeRecipientId) {
      sendTypingStatus(activeRecipientId, true, activePropertyId || undefined);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(activeRecipientId, false, activePropertyId || undefined);
      }, 1500);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeRecipientId || !user) return;

    const text = inputText.trim();
    setInputText('');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingStatus(activeRecipientId, false, activePropertyId || undefined);

    // If socket is connected, emit real-time
    if (isConnected) {
      sendChatMessage(activeRecipientId, text, activePropertyId || undefined);
    } else {
      // Fallback to REST API
      try {
        const res = await fetch('/api/chat/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipientId: activeRecipientId,
            propertyId: activePropertyId || undefined,
            text,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => [...prev, data.data]);
          fetchThreads();
        }
      } catch {
        // ignore
      }
    }
  };

  const activePartnerName = activeThreadInfo?.otherUser?.name || 'User';
  const isTyping = activeTypingUser?.senderId === activeRecipientId && activeTypingUser?.isTyping;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Top Banner matching Wireframe Page 9 */}
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2 rounded-xl flex items-center justify-between">
        <span className="font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Real-time chat active (Socket.io + JWT authenticated session)
        </span>
        <span className="text-[11px] text-emerald-700 hidden sm:inline">
          Instant messaging between students, verified owners & mess providers
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left Column: Conversations List (4 cols) */}
        <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} md:col-span-4 border-r border-gray-200 flex-col`}>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="font-bold text-gray-900 text-sm">Conversations</h2>
            <span className="text-xs text-gray-500 font-medium">{threads.length} threads</span>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
            {loadingThreads ? (
              <div className="p-8 text-center text-xs text-gray-500">Loading chats...</div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 space-y-1">
                <MessageSquare className="w-6 h-6 text-gray-300 mx-auto" />
                <p>No conversations yet.</p>
                <p className="text-[11px] text-gray-400">Click "Chat" on any listing or roommate card.</p>
              </div>
            ) : (
              threads.map((t) => {
                const isActive = t.otherUser.id === activeRecipientId;
                return (
                  <button
                    key={t.threadId}
                    onClick={() => {
                      setActiveRecipientId(t.otherUser.id);
                      setActivePropertyId(t.property?.id || null);
                      setMobileView('chat');
                    }}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 ${
                      isActive ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {t.otherUser.name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-gray-900 truncate">
                          {t.otherUser.name}
                        </h4>
                        <span className="text-[10px] text-gray-400">
                          {new Date(t.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {t.lastMessage.isMine ? 'You: ' : ''}
                        {t.lastMessage.text}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1">
                        {t.property ? (
                          <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded truncate">
                            {t.property.title}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded">
                            Roommate match
                          </span>
                        )}

                        {t.unreadCount > 0 && (
                          <span className="ml-auto bg-blue-600 text-white rounded-full text-[10px] px-1.5 font-bold">
                            {t.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Window (8 cols) */}
        <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} md:col-span-8 flex-col h-[580px]`}>
          {activeRecipientId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1.5 -ml-1 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition"
                    title="Back to conversations"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {activePartnerName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-gray-900">{activePartnerName}</h3>
                      {activeThreadInfo?.property && (
                        <span className="text-[11px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Building className="w-3 h-3 text-blue-600" />
                          {activeThreadInfo.property.title}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      online
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/30">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    No messages yet. Send a greeting to start the conversation!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.senderId === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                            isMine
                              ? 'bg-slate-900 text-white rounded-br-xs shadow-xs'
                              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-xs shadow-xs'
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}

                {/* Real-time typing indicator */}
                {isTyping && (
                  <div className="text-xs text-gray-500 italic bg-white border border-gray-200 rounded-full px-3 py-1 inline-flex items-center gap-1.5 animate-pulse">
                    <span>{activePartnerName} is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="flex-1 text-xs sm:text-sm rounded-xl border border-gray-300 px-3.5 py-2.5 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-40 flex items-center gap-1.5"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-gray-400 p-8 text-center">
              Select a conversation from the left to start real-time messaging.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
