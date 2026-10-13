import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ThemeToggle } from './components/ThemeToggle';
import { StayNestLogo } from './components/StayNestLogo';
import { Navbar } from './components/Navbar';
import { BrowsePage } from './pages/BrowsePage';
import { MessDirectoryPage } from './pages/MessDirectoryPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { RoommatesPage } from './pages/RoommatesPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { MyMessPage } from './pages/MyMessPage';
import { ChatPage } from './pages/ChatPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { StudentHubPage } from './pages/StudentHubPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { MessProvider } from './types';

function MainApp() {
  const { user, token, isLoading } = useAuth();
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<string>('browse');

  // Chat navigation state
  const [chatRecipientId, setChatRecipientId] = useState<string | null>(null);
  const [chatPropertyId, setChatPropertyId] = useState<string | null>(null);

  // Selected mess navigation
  const [selectedMess, setSelectedMess] = useState<MessProvider | null>(null);

  // Open booking count for badge
  const [openBookingCount, setOpenBookingCount] = useState<number>(0);

  // Sync role defaults upon initial login
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        setCurrentTab('admin_verifications');
      } else if (user.role === 'owner') {
        setCurrentTab('dashboard');
      } else if (user.role === 'mess_provider') {
        setCurrentTab('mymess');
      } else {
        setCurrentTab('browse');
      }
    }
  }, [user?.id, user?.role]);

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

  // Loading Splash Screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">Loading StayNest...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated State: Mandatory Login/Register Gate
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors duration-200">
        <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                <StayNestLogo size="md" />
                <span>StayNest</span>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button
                  onClick={() => setAuthTab('login')}
                  className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition ${
                    authTab === 'login'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 font-bold'
                      : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setAuthTab('register')}
                  className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition ${
                    authTab === 'register'
                      ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white font-bold'
                      : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center py-10 px-4">
          {authTab === 'login' ? (
            <LoginPage
              onSwitchToRegister={() => setAuthTab('register')}
              onSuccess={() => {}}
            />
          ) : (
            <RegisterPage
              onSwitchToLogin={() => setAuthTab('login')}
              onSuccess={() => {}}
            />
          )}
        </main>

        <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 py-6 text-center text-xs text-gray-500 dark:text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>StayNest © 2026 — Verified Student Housing, Live Availability & Mess Directory</span>
            <span className="text-gray-400 dark:text-slate-500">Please sign in to access campus listings</span>
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated State: Full Access based on Role
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors duration-200">
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

        {currentTab === 'favorites' && (
          <FavoritesPage
            onOpenChat={handleOpenChat}
            onNavigateTab={setCurrentTab}
            onViewMessDetails={handleViewMessDetails}
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

        {currentTab === 'tools' && (
          <StudentHubPage
            onNavigateTab={setCurrentTab}
            onOpenChat={handleOpenChat}
          />
        )}

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
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 py-6 text-center text-xs text-gray-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>StayNest © 2026 — Verified Student Housing, Live Availability & Mess Directory</span>
          <span className="text-gray-400 dark:text-slate-500">OpenStreetMap • Leaflet • Socket.io • Express REST</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FavoritesProvider>
          <SocketProvider>
            <MainApp />
          </SocketProvider>
        </FavoritesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
