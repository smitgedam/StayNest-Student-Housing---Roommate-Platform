import React, { useState } from 'react';
import { Property } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  FileText,
  Printer,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  Building,
  UserCheck,
  Calendar,
  Zap,
} from 'lucide-react';

interface RentAgreementModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RentAgreementModal: React.FC<RentAgreementModalProps> = ({
  property,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'agreement' | 'checklist'>('agreement');

  // Agreement Form State
  const [tenantName, setTenantName] = useState(user?.name || 'Rahul Sharma');
  const [ownerName, setOwnerName] = useState(property?.owner?.name || 'Vikram Malhotra');
  const [rentAmount, setRentAmount] = useState(property?.rentPerMonth || 11500);
  const [depositAmount, setDepositAmount] = useState(property?.depositAmount || 15000);
  const [noticePeriodMonths, setNoticePeriodMonths] = useState(1);
  const [lockInMonths, setLockInMonths] = useState(3);
  const [startDate, setStartDate] = useState('2026-11-01');
  const [electricityUnitRate, setElectricityUnitRate] = useState(9);
  const [copied, setCopied] = useState(false);

  // Move-In Checklist State
  const [checklist, setChecklist] = useState<Record<string, 'good' | 'repair' | 'missing'>>({
    bed_mattress: 'good',
    study_table_chair: 'good',
    ceiling_fan_lights: 'good',
    ac_cooling_remote: 'good',
    geyser_water_heater: 'good',
    washroom_taps_flush: 'good',
    door_wardrobe_keys: 'good',
    window_curtains_latches: 'good',
  });
  const [initialMeterReading, setInitialMeterReading] = useState('1428.5');
  const [checklistSaved, setChecklistSaved] = useState(false);

  if (!isOpen || !property) return null;

  const agreementText = `
STUDENT TENANCY & HOUSING OCCUPANCY AGREEMENT
=====================================================

This Student Living Agreement is entered on ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} between:

LANDLORD / ACCOMMODATION OWNER:
Name: ${ownerName}
Property Name: ${property.title}
Address: ${property.address}

AND

STUDENT TENANT:
Name: ${tenantName}
College / University: ${user?.college || property.nearestCollege || 'Campus Student'}

TERMS AND CONDITIONS:
1. TENANCY TERM & RENT:
   - The tenancy begins on ${startDate} for an initial duration of ${lockInMonths} months lock-in period.
   - Monthly Rent: ₹${rentAmount.toLocaleString()} per month, payable on or before the 5th of every calendar month.
   - Security Deposit: ₹${depositAmount.toLocaleString()} (Refundable at move-out, subject to clearance of utility bills and inventory inspection).

2. ELECTRICITY & UTILITIES:
   - Electricity charges shall be calculated based on individual/sub-meter reading at ₹${electricityUnitRate} per unit consumed.
   - High-speed Wi-Fi and water supply are included as standard hostel amenities.

3. NOTICE PERIOD & REFUND:
   - A standard written notice of ${noticePeriodMonths} month(s) is required prior to vacating the accommodation.
   - Security deposit shall be returned within 7 working days following room handover and keys return.

4. HOUSE RULES & PEACEFUL STUDY ATMOSPHERE:
   - The Tenant agrees to maintain a quiet, student-friendly atmosphere during study hours (10:00 PM to 7:00 AM).
   - Smoking, illegal substances, and hazardous items are strictly prohibited on premises.
   - Visitors and study groups permitted in common areas until 9:00 PM.

5. SIGNATURES & VERIFICATION:
   Digital Agreement Draft generated via StayNest Verified Campus Portal.

   _____________________________             _____________________________
   Landlord Signature: ${ownerName}           Tenant Signature: ${tenantName}
   Date: ${new Date().toLocaleDateString('en-IN')}                     Date: ${new Date().toLocaleDateString('en-IN')}
`.trim();

  const handleCopyAgreement = () => {
    navigator.clipboard.writeText(agreementText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    setChecklistSaved(true);
    setTimeout(() => setChecklistSaved(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Student Rent Agreement & Move-In Checklist
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Official student lease generator & room inventory inspection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-gray-200 dark:border-slate-800 flex gap-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('agreement')}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'agreement'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Virtual Rent Agreement Draft
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'checklist'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Move-In Inventory Checklist
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {activeTab === 'agreement' ? (
            <div className="space-y-4">
              {/* Form Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-slate-800/60 p-4 rounded-xl border border-gray-200 dark:border-slate-700/80">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase mb-1">
                    Student Name
                  </label>
                  <input
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-1.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase mb-1">
                    Monthly Rent (₹)
                  </label>
                  <input
                    type="number"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-1.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase mb-1">
                    Deposit (₹)
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-1.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase mb-1">
                    Lock-In (Months)
                  </label>
                  <select
                    value={lockInMonths}
                    onChange={(e) => setLockInMonths(Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-1.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  >
                    <option value={1}>1 Month</option>
                    <option value={3}>3 Months (Semester)</option>
                    <option value={6}>6 Months</option>
                    <option value={11}>11 Months (Standard)</option>
                  </select>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-700 dark:text-slate-300">
                  Standard Legal Student Draft Preview:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAgreement}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copied to Clipboard!' : 'Copy Agreement Text'}
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print / PDF
                  </button>
                </div>
              </div>

              {/* Rendered Agreement Document */}
              <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-gray-300 dark:border-slate-800 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-slate-200 shadow-inner max-h-96 overflow-y-auto">
                {agreementText}
              </div>
            </div>
          ) : (
            /* Tab 2: Move-In Checklist */
            <form onSubmit={handleSaveChecklist} className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                Inspect every item on move-in day with your landlord to ensure your security deposit is protected when you graduate or shift!
              </div>

              {/* Meter Reading Card */}
              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <Zap className="w-4 h-4 text-amber-500" /> Move-In Sub-Meter Electricity Reading
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400">Baseline Unit Count</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={initialMeterReading}
                    onChange={(e) => setInitialMeterReading(e.target.value)}
                    placeholder="e.g. 1428.5 kWh"
                    className="text-xs font-mono font-bold rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white w-48"
                  />
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    Units recorded on move-in day ({new Date().toLocaleDateString('en-IN')})
                  </span>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase px-3">
                  <span className="col-span-6">Room Item / Fixture</span>
                  <span className="col-span-2 text-center">Good Condition</span>
                  <span className="col-span-2 text-center">Needs Repair</span>
                  <span className="col-span-2 text-center">Missing / Damaged</span>
                </div>

                {[
                  { id: 'bed_mattress', label: '🛏️ Bed Frame & Foam Mattress' },
                  { id: 'study_table_chair', label: '🪑 Study Desk, Chair & Drawer' },
                  { id: 'ceiling_fan_lights', label: '💡 Ceiling Fan & LED Lights' },
                  { id: 'ac_cooling_remote', label: '❄️ AC Cooling & Remote Controller' },
                  { id: 'geyser_water_heater', label: '🚿 Geyser / Instant Water Heater' },
                  { id: 'washroom_taps_flush', label: '🚰 Washroom Taps, Shower & Flush' },
                  { id: 'door_wardrobe_keys', label: '🔑 Main Door & Wardrobe Keys' },
                  { id: 'window_curtains_latches', label: '🪟 Window Meshes, Curtains & Latches' },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 items-center p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-gray-200 dark:border-slate-700/80 text-xs"
                  >
                    <span className="col-span-6 font-semibold text-gray-800 dark:text-slate-200">
                      {item.label}
                    </span>

                    <div className="col-span-2 text-center">
                      <input
                        type="radio"
                        name={item.id}
                        checked={checklist[item.id] === 'good'}
                        onChange={() => setChecklist({ ...checklist, [item.id]: 'good' })}
                        className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                    </div>

                    <div className="col-span-2 text-center">
                      <input
                        type="radio"
                        name={item.id}
                        checked={checklist[item.id] === 'repair'}
                        onChange={() => setChecklist({ ...checklist, [item.id]: 'repair' })}
                        className="text-amber-500 focus:ring-amber-500 h-4 w-4"
                      />
                    </div>

                    <div className="col-span-2 text-center">
                      <input
                        type="radio"
                        name={item.id}
                        checked={checklist[item.id] === 'missing'}
                        onChange={() => setChecklist({ ...checklist, [item.id]: 'missing' })}
                        className="text-red-600 focus:ring-red-500 h-4 w-4"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {checklistSaved && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-medium border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Move-In condition checklist verified and saved with timestamp!
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-blue-500 transition shadow-xs flex items-center gap-1.5"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Save Move-In Handover Inspection
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-slate-800 dark:hover:bg-blue-500 transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
