import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { UserStatusBadge } from './components/UserStatusBadge';
import { BrowsePage } from './pages/BrowsePage';
import { MessDirectoryPage } from './pages/MessDirectoryPage';
import { RoommatesPage } from './pages/RoommatesPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { MyMessPage } from './pages/MyMessPage';
import { ChatPage } from './pages/ChatPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { MessProvider } from './types';

function MainApp() {
  const { user, token } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('browse');

  // Chat navigation state
  const [chatRecipientId, setChatRecipientId] = useState<string | null>(null);
  const [chatPropertyId, setChatPropertyId] = useState<string | null>(null);

  // Selected mess navigation
  const [selectedMess, setSelectedMess] = useState<MessProvider | null>(null);

  // Open booking count for badge
  const [openBookingCount, setOpenBookingCount] = useState<number>(0);

  useEffect(() => {
    if (!token || !user) return;
    const fetchCounts = async () => {
      try {
        if (user.role === 'student') {
          const res = await fetch('/api/bookings/sent', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setOpenBookingCount(data.filter((b: any) => b.status === 'pending' || b.status === 'accepted').length);
          }
        } else if (user.role === 'owner') {
          const res = await fetch('/api/bookings/received', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setOpenBookingCount(data.filter((b: any) => b.status === 'pending').length);
          }
        }
      } catch {
        // ignore
      }
    };
    fetchCounts();
  }, [token, user?.role]);

  const handleOpenChat = (userId: string, propertyId?: string) => {
    setChatRecipientId(userId);
    setChatPropertyId(propertyId || null);
    setCurrentTab('chat');
  };

  const handleViewMessDetails = (mess: MessProvider) => {
    setSelectedMess(mess);
    setCurrentTab('mess');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openBookingCount={openBookingCount}
      />

      <main className="flex-1 pb-16">
        {currentTab === 'browse' && (
          <BrowsePage
            onOpenChat={handleOpenChat}
            onOpenBookings={() => setCurrentTab('bookings')}
            onViewMessDetails={handleViewMessDetails}
          />
        )}

        {currentTab === 'mess' && (
          <MessDirectoryPage
            onOpenChat={handleOpenChat}
            selectedMess={selectedMess}
          />
        )}

        {currentTab === 'roommates' && (
          <RoommatesPage
            onOpenChat={handleOpenChat}
            onOpenProfile={() => setCurrentTab('profile')}
          />
        )}

        {currentTab === 'dashboard' && <OwnerDashboardPage />}

        {currentTab === 'bookings' && <MyBookingsPage />}

        {currentTab === 'mymess' && <MyMessPage />}

        {currentTab === 'chat' && (
          <ChatPage
            initialRecipientId={chatRecipientId}
            initialPropertyId={chatPropertyId}
          />
        )}

        {currentTab === 'admin_verifications' && (
          <AdminPage initialSubTab="verifications" />
        )}

        {currentTab === 'admin_reports' && (
          <AdminPage initialSubTab="reports" />
        )}

        {currentTab === 'profile' && <ProfilePage />}

        {currentTab === 'login' && (
          <LoginPage
            onSwitchToRegister={() => setCurrentTab('register')}
            onSuccess={() => setCurrentTab('browse')}
          />
        )}

        {currentTab === 'register' && (
          <RegisterPage
            onSwitchToLogin={() => setCurrentTab('login')}
            onSuccess={() => setCurrentTab('browse')}
          />
        )}
      </main>

      {/* Floating Status Badge */}
      <UserStatusBadge />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>StayNest © 2026 — Verified Student Housing, Live Availability & Mess Directory</span>
          <span className="text-gray-400">OpenStreetMap • Leaflet • Socket.io • Express REST</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainApp />
      </SocketProvider>
    </AuthProvider>
  );
}
