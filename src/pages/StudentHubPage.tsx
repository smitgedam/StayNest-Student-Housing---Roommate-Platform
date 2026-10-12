import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Receipt,
  Wrench,
  UtensilsCrossed,
  FileText,
  Navigation,
  ShieldCheck,
  Calculator,
  Plus,
  Users,
  Building,
} from 'lucide-react';
import { ExpenseSplitterModal } from '../components/ExpenseSplitterModal';
import { MaintenanceModal } from '../components/MaintenanceModal';
import { DailyMessMenuModal } from '../components/DailyMessMenuModal';
import { RentAgreementModal } from '../components/RentAgreementModal';
import { CommuteCalculatorModal } from '../components/CommuteCalculatorModal';
import { SafetyRadarModal } from '../components/SafetyRadarModal';
import { Property, MessProvider } from '../types';

interface StudentHubPageProps {
  onNavigateTab: (tab: string) => void;
  onOpenChat: (userId: string) => void;
}

export const StudentHubPage: React.FC<StudentHubPageProps> = ({
  onNavigateTab,
  onOpenChat,
}) => {
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<
    'expense' | 'maintenance' | 'mess' | 'agreement' | 'commute' | 'safety' | null
  >(null);

  // Mock sample property for standalone testing of property-specific tools
  const sampleProperty: Property = {
    id: 'prop_1',
    ownerId: 'usr_owner_1',
    title: 'Sunrise PG near Gate 2',
    description: 'Single room with 50 Mbps fiber WiFi, 24x7 power backup, study desk, attached washroom right next to DTU Gate 2.',
    status: 'available',
    propertyType: 'pg',
    rentPerMonth: 8500,
    depositAmount: 12000,
    genderPolicy: 'male_only',
    amenities: {
      wifi: true,
      wifiSpeedMbps: 50,
      attachedBathroom: true,
      furnished: true,
      powerBackup: true,
      foodIncluded: true,
      laundry: true,
      parking: true,
      ac: true,
      petsAllowed: false,
      curfewTime: '10:30 PM',
    },
    location: {
      type: 'Point',
      coordinates: [77.1190, 28.7512],
    },
    address: 'Plot 12, Main Market, Bawana Road, near Gate 2, Delhi',
    nearestCollege: 'Delhi Technological University (DTU)',
    photos: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'],
    ratingAvg: 4.8,
    ratingCount: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    owner: {
      id: 'usr_owner_1',
      name: 'Vikram Malhotra',
      ratingAvg: 4.5,
      isVerified: true,
    },
  };

  const sampleMess: MessProvider = {
    id: 'mess_1',
    ownerId: 'usr_mess_1',
    name: 'Annapurna Tiffin Service',
    description: 'Fresh North Indian home-style thali with rotating menu, desi ghee rotis, and hygienic campus delivery.',
    dietType: 'veg',
    location: {
      type: 'Point',
      coordinates: [77.1175, 28.7495],
    },
    address: 'Near Gate 1, DTU Road, Delhi',
    deliveryRadiusKm: 5,
    plans: [
      { name: 'Lunch + Dinner Deluxe', pricePerMonth: 3200, mealsIncluded: ['Lunch', 'Dinner'] },
      { name: '3 Meals All-Inclusive', pricePerMonth: 4200, mealsIncluded: ['Breakfast', 'Lunch', 'Dinner'] },
    ],
    trialMealAvailable: true,
    trialMealPrice: 60,
    ratingAvg: 4.7,
    ratingCount: 38,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const tools = [
    {
      id: 'expense',
      title: 'Flatmate Expense Splitter',
      tag: 'Feature 3',
      description: 'Split flat rent, BSES electricity bills, ACT Wi-Fi & groceries. Simplified debt settlement ledger with dynamic UPI payment QR codes.',
      icon: <Receipt className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50',
      actionText: 'Open Expense Ledger',
      onClick: () => setActiveModal('expense'),
    },
    {
      id: 'maintenance',
      title: 'Student Maintenance & Issue Tracker',
      tag: 'Feature 4',
      description: 'Raise maintenance requests for plumbing, electrical, router Wi-Fi, or appliances. Track live technician dispatch and status from Pending to Resolved.',
      icon: <Wrench className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
      bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/50',
      actionText: 'Track & Raise Tickets',
      onClick: () => setActiveModal('maintenance'),
    },
    {
      id: 'mess',
      title: 'Daily Mess Menu & Meal Rating Board',
      tag: 'Feature 5',
      description: 'Weekly 7-day meal timetable with "Today’s Special Dish", live student community voting (Delicious 🔥 vs Needs Improvement), and digital meal QR pass.',
      icon: <UtensilsCrossed className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50',
      actionText: 'View Today’s Menu',
      onClick: () => setActiveModal('mess'),
    },
    {
      id: 'agreement',
      title: 'Virtual Rent Agreement & Move-In Checklist',
      tag: 'Feature 6',
      description: 'Generate standard legal-friendly student tenancy agreement drafts with custom lock-in & deposit clauses. Conduct interactive room handover inventory checks.',
      icon: <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50',
      actionText: 'Generate Agreement / Checklist',
      onClick: () => setActiveModal('agreement'),
    },
    {
      id: 'commute',
      title: 'Campus Commute & Transit Calculator',
      tag: 'Feature 2',
      description: 'Multi-modal transit estimator comparing walking, cycling, shared e-rickshaws, and Delhi Metro lines to campus gates with monthly cost savings calculator.',
      icon: <Navigation className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50',
      actionText: 'Calculate Transit Time',
      onClick: () => setActiveModal('commute'),
    },
    {
      id: 'safety',
      title: 'Neighborhood Safety & Night Walkability Radar',
      tag: 'Feature 7',
      description: 'Crowdsourced safety index evaluating street lighting, 24/7 security guard presence, CCTV monitoring, and female-student friendly late walkability.',
      icon: <ShieldCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
      bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/50',
      actionText: 'View Safety Radar',
      onClick: () => setActiveModal('safety'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            StayNest Student Living Ecosystem
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Campus Living Tools & Utilities
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Everything student flatmates need to split expenses, track room maintenance, inspect rental conditions, calculate college commutes, and verify neighborhood safety.
          </p>
        </div>

        {/* Quick Nav Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-slate-800/80">
          <button
            onClick={() => onNavigateTab('roommates')}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-xs"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            Roommate Matcher (Feature 1)
          </button>
          <button
            onClick={() => onNavigateTab('browse')}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-xs"
          >
            <Building className="w-3.5 h-3.5 text-emerald-400" />
            Campus Accommodations
          </button>
          <button
            onClick={() => onNavigateTab('mess')}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-xs"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
            Campus Mess Directory
          </button>
        </div>
      </div>

      {/* Grid of 6 Specialized Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className={`p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg flex flex-col justify-between ${tool.bg}`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-gray-100 dark:border-slate-800">
                  {tool.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 font-mono">
                  {tool.tag}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-snug">
                {tool.title}
              </h2>

              <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                {tool.description}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-200/60 dark:border-slate-750/60">
              <button
                type="button"
                onClick={tool.onClick}
                className="w-full py-2.5 bg-slate-900 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
              >
                {tool.actionText} →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <ExpenseSplitterModal
        isOpen={activeModal === 'expense'}
        onClose={() => setActiveModal(null)}
      />

      <MaintenanceModal
        isOpen={activeModal === 'maintenance'}
        onClose={() => setActiveModal(null)}
      />

      <DailyMessMenuModal
        mess={sampleMess}
        isOpen={activeModal === 'mess'}
        onClose={() => setActiveModal(null)}
      />

      <RentAgreementModal
        property={sampleProperty}
        isOpen={activeModal === 'agreement'}
        onClose={() => setActiveModal(null)}
      />

      <CommuteCalculatorModal
        property={sampleProperty}
        isOpen={activeModal === 'commute'}
        onClose={() => setActiveModal(null)}
      />

      <SafetyRadarModal
        property={sampleProperty}
        isOpen={activeModal === 'safety'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
};
