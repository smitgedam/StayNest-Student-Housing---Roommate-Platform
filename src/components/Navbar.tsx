import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Home,
  UtensilsCrossed,
  Users,
  CalendarCheck,
  MessageSquare,
  UserCheck,
  ShieldAlert,
  LogOut,
  ChevronDown,
  Sparkles,
  Wifi,
  Menu,
  X,
  Building,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openBookingCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  openBookingCount = 0,
}) => {
  const { user, logout, switchDemoAccount } = useAuth();
  const { isConnected } = useSocket();
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = user?.role || 'guest';

  const demoAccounts = [
    { name: 'Rahul Sharma', role: 'Student', email: 'rahul@college.edu', badge: 'Student' },
    { name: 'Vikram Malhotra', role: 'Owner (Verified)', email: 'vikram@staynest.com', badge: 'Verified Owner' },
    { name: 'Suresh Raina', role: 'Owner (Unverified)', email: 'suresh@staynest.com', badge: 'Unverified Owner' },
    { name: 'Annapurna Tiffin', role: 'Mess Provider', email: 'annapurna@staynest.com', badge: 'Mess Provider' },
    { name: 'Admin Moderator', role: 'Admin', email: 'admin@staynest.com', badge: 'Admin' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      {/* Top Demo Fast Switcher Bar */}
      <div className="bg-slate-900 text-white text-xs py-1.5 px-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-semibold text-emerald-400">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {isConnected ? 'Real-time sync active' : 'Connecting real-time...'}
          </span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden md:inline">Quick Test Roles:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {demoAccounts.map(acc => (
            <button
              key={acc.email}
              onClick={() => {
                switchDemoAccount(acc.email);
                setDemoMenuOpen(false);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                user?.email === acc.email
                  ? 'bg-blue-600 text-white font-bold ring-1 ring-blue-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {acc.badge}
            </button>
          ))}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand + Role Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('browse')}
              className="flex items-center gap-2 text-xl font-bold text-gray-900 tracking-tight hover:opacity-90 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
                S
              </div>
              <span>StayNest</span>
            </button>

            {user && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                {user.role === 'mess_provider' ? 'Mess Provider' : user.role}
              </span>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setCurrentTab('browse')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                currentTab === 'browse'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Home className="w-4 h-4" />
              Browse
            </button>

            <button
              onClick={() => setCurrentTab('mess')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                currentTab === 'mess'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              Mess
            </button>

            {role === 'student' && (
              <>
                <button
                  onClick={() => setCurrentTab('roommates')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                    currentTab === 'roommates'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Roommates
                </button>

                <button
                  onClick={() => setCurrentTab('bookings')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 relative ${
                    currentTab === 'bookings'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  My Bookings
                  {openBookingCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                      {openBookingCount}
                    </span>
                  )}
                </button>
              </>
            )}

            {role === 'owner' && (
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 relative ${
                  currentTab === 'dashboard'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Building className="w-4 h-4" />
                Dashboard
                {openBookingCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                    {openBookingCount}
                  </span>
                )}
              </button>
            )}

            {role === 'mess_provider' && (
              <button
                onClick={() => setCurrentTab('mymess')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                  currentTab === 'mymess'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                My Mess
              </button>
            )}

            {role === 'admin' && (
              <>
                <button
                  onClick={() => setCurrentTab('admin_verifications')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                    currentTab === 'admin_verifications'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Verification Queue
                </button>

                <button
                  onClick={() => setCurrentTab('admin_reports')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                    currentTab === 'admin_reports'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Reports
                </button>
              </>
            )}

            {user && (
              <button
                onClick={() => setCurrentTab('chat')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                  currentTab === 'chat'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Chat
              </button>
            )}
          </nav>

          {/* User Account / Auth Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('profile')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 border transition ${
                    currentTab === 'profile'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <span className="truncate max-w-[120px]">{user.name}</span>
                </button>

                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('login')}
                  className="px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                >
                  Login
                </button>
                <button
                  onClick={() => setCurrentTab('register')}
                  className="px-3.5 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 px-4 pt-2 pb-4 space-y-1 bg-white">
          <button
            onClick={() => { setCurrentTab('browse'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <Home className="w-4 h-4" /> Browse
          </button>
          <button
            onClick={() => { setCurrentTab('mess'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <UtensilsCrossed className="w-4 h-4" /> Mess Directory
          </button>

          {role === 'student' && (
            <>
              <button
                onClick={() => { setCurrentTab('roommates'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Users className="w-4 h-4" /> Roommates
              </button>
              <button
                onClick={() => { setCurrentTab('bookings'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <CalendarCheck className="w-4 h-4" /> My Bookings
              </button>
            </>
          )}

          {role === 'owner' && (
            <button
              onClick={() => { setCurrentTab('dashboard'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Building className="w-4 h-4" /> Owner Dashboard
            </button>
          )}

          {role === 'mess_provider' && (
            <button
              onClick={() => { setCurrentTab('mymess'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <UtensilsCrossed className="w-4 h-4" /> My Mess Listings
            </button>
          )}

          {role === 'admin' && (
            <>
              <button
                onClick={() => { setCurrentTab('admin_verifications'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" /> Verification Queue
              </button>
              <button
                onClick={() => { setCurrentTab('admin_reports'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" /> Reports
              </button>
            </>
          )}

          {user && (
            <button
              onClick={() => { setCurrentTab('chat'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" /> Chat
            </button>
          )}

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            {user ? (
              <>
                <button
                  onClick={() => { setCurrentTab('profile'); setMobileMenuOpen(false); }}
                  className="text-sm font-medium text-gray-800"
                >
                  Profile: {user.name}
                </button>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="text-xs text-red-600 font-semibold"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => { setCurrentTab('login'); setMobileMenuOpen(false); }}
                  className="flex-1 py-1.5 text-center text-sm border rounded"
                >
                  Login
                </button>
                <button
                  onClick={() => { setCurrentTab('register'); setMobileMenuOpen(false); }}
                  className="flex-1 py-1.5 text-center text-sm bg-blue-600 text-white rounded"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
