import React, { useState, useEffect } from 'react';
import { ExpenseItem, User } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Receipt,
  Plus,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  DollarSign,
  Users,
  CreditCard,
  ExternalLink,
} from 'lucide-react';

interface ExpenseSplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpenseSplitterModal: React.FC<ExpenseSplitterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, token } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add Expense form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'rent' | 'electricity' | 'wifi' | 'water' | 'maid' | 'groceries' | 'other'>('rent');
  const [amount, setAmount] = useState('');
  const [roommates, setRoommates] = useState<User[]>([]);
  const [selectedRoommateIds, setSelectedRoommateIds] = useState<string[]>([]);
  const [upiId, setUpiId] = useState(user?.phone ? `${user.phone.replace(/[^0-9]/g, '')}@upi` : 'rahulsharma@oksbi');
  const [submitting, setSubmitting] = useState(false);

  // Active UPI QR Modal
  const [activeUpiExpense, setActiveUpiExpense] = useState<{
    expense: ExpenseItem;
    myShare: number;
  } | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const fetchExpenses = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/expenses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchRoommates = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/users/roommates/find', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRoommates(data);
        if (data.length > 0 && selectedRoommateIds.length === 0) {
          setSelectedRoommateIds([data[0].id]);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchExpenses();
      fetchRoommates();
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !title || !amount) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          category,
          amount: parseFloat(amount),
          splitWith: selectedRoommateIds,
          upiId,
        }),
      });

      if (res.ok) {
        setShowAddForm(false);
        setTitle('');
        setAmount('');
        fetchExpenses();
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSettle = async (expenseId: string, participantId: string, currentSettled: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/expenses/${expenseId}/settle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          participantId,
          settled: !currentSettled,
        }),
      });
      if (res.ok) {
        fetchExpenses();
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchExpenses();
      }
    } catch {
      // ignore
    }
  };

  // Balance calculation
  let totalIOwed = 0;
  let totalOwedToMe = 0;

  expenses.forEach(exp => {
    const isPayer = exp.paidBy.id === user?.id;
    if (isPayer) {
      exp.splitAmong.forEach(p => {
        if (p.id !== user?.id && !p.settled) {
          totalOwedToMe += p.share;
        }
      });
    } else {
      const myPart = exp.splitAmong.find(p => p.id === user?.id);
      if (myPart && !myPart.settled) {
        totalIOwed += myPart.share;
      }
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Flatmate Expense Splitter & Rent Ledger
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Split rent, Wi-Fi, electricity & groceries with instant UPI settlement
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

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Summary Balance Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400 block">
                You are owed
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5 block">
                ₹{totalOwedToMe.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                Pending from flatmates
              </span>
            </div>

            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800/40">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-700 dark:text-rose-400 block">
                You owe
              </span>
              <span className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300 font-mono mt-0.5 block">
                ₹{totalIOwed.toLocaleString()}
              </span>
              <span className="text-[11px] text-rose-600 dark:text-rose-400">
                To settle with flatmates
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
              Shared Flat Expenses
            </h3>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 bg-slate-900 dark:bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-slate-800 dark:hover:bg-blue-500 transition shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Shared Expense
              </button>
            )}
          </div>

          {/* Add Expense Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddExpense}
              className="bg-gray-50 dark:bg-slate-800/80 p-4 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3"
            >
              <div className="font-bold text-xs text-gray-900 dark:text-white">
                Log New Shared Flat Bill:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Expense Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. October Rent, BSES Electricity, ACT WiFi"
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Total Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 16000"
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  >
                    <option value="rent">🏠 Rent</option>
                    <option value="electricity">⚡ Electricity & Sub-meter</option>
                    <option value="wifi">📶 High-Speed WiFi</option>
                    <option value="water">💧 Water Cans / RO</option>
                    <option value="maid">🧹 Maid / Cook Salary</option>
                    <option value="groceries">🛒 Groceries & Cooking</option>
                    <option value="other">📦 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Your UPI ID for Settlements
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. name@oksbi"
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Select Roommates to split */}
              {roommates.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Split with flatmates:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {roommates.map((r) => {
                      const isSelected = selectedRoommateIds.includes(r.id);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedRoommateIds(selectedRoommateIds.filter(id => id !== r.id));
                            } else {
                              setSelectedRoommateIds([...selectedRoommateIds, r.id]);
                            }
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300'
                              : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '} {r.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-slate-900 dark:bg-blue-600 text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Split Expense'}
                </button>
              </div>
            </form>
          )}

          {/* Expenses List */}
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-500">Loading ledger...</div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-200 dark:border-slate-700">
              <p className="font-semibold text-gray-700 dark:text-slate-300">No shared expenses logged yet.</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                Click "+ Add Shared Expense" to track rent, electricity, and bills with your flatmates.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((exp) => {
                const isPayer = exp.paidBy.id === user?.id;
                const myParticipation = exp.splitAmong.find(p => p.id === user?.id);

                return (
                  <div
                    key={exp.id}
                    className="p-4 bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700/80 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-gray-900 dark:text-white text-sm">
                            {exp.title}
                          </span>
                          <span className="text-[10px] font-bold uppercase bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-gray-600 dark:text-slate-300">
                            {exp.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          Paid by <strong className="text-gray-700 dark:text-slate-200">{exp.paidBy.name}</strong> on {exp.date}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-gray-900 dark:text-white font-mono block">
                          ₹{exp.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400">Total bill</span>
                      </div>
                    </div>

                    {/* Participant Shares */}
                    <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 space-y-1.5">
                      {exp.splitAmong.map((p) => {
                        const isMe = p.id === user?.id;
                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-gray-50/70 dark:bg-slate-900/40"
                          >
                            <span className="text-gray-700 dark:text-slate-300 font-medium">
                              {p.name} {isMe && '(You)'}
                            </span>

                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-gray-900 dark:text-white">
                                ₹{p.share.toLocaleString()}
                              </span>

                              {p.settled ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-rose-500">Unsettled</span>
                                  {/* Pay QR button if I owe and it's not paid */}
                                  {isMe && !isPayer && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveUpiExpense({
                                          expense: exp,
                                          myShare: p.share,
                                        })
                                      }
                                      className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-500 transition flex items-center gap-1"
                                    >
                                      <QrCode className="w-3 h-3" /> Pay UPI
                                    </button>
                                  )}

                                  {/* Payer or me can mark settled */}
                                  {(isPayer || isMe) && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSettle(exp.id, p.id, p.settled)}
                                      className="text-[10px] text-gray-500 hover:text-emerald-600 underline"
                                    >
                                      Mark Paid
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer / Delete */}
                    {isPayer && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-[11px] text-gray-400 hover:text-rose-500 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove Expense
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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

      {/* Dynamic UPI Payment QR Modal */}
      {activeUpiExpense && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 border border-gray-200 dark:border-slate-800 shadow-2xl">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Scan UPI QR to Settle
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Pay to <strong>{activeUpiExpense.expense.paidBy.name}</strong>
              </p>
            </div>

            {/* UPI QR Image */}
            <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl inline-block border border-gray-200 dark:border-slate-700">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `upi://pay?pa=${activeUpiExpense.expense.upiId || 'rahulsharma@oksbi'}&pn=${encodeURIComponent(
                    activeUpiExpense.expense.paidBy.name
                  )}&am=${activeUpiExpense.myShare}&cu=INR&tn=${encodeURIComponent(
                    `StayNest - ${activeUpiExpense.expense.title}`
                  )}`
                )}`}
                alt="UPI QR Code"
                className="w-40 h-40 mx-auto rounded-lg"
              />
              <span className="font-mono text-sm font-black text-gray-900 dark:text-white block mt-2">
                ₹{activeUpiExpense.myShare.toLocaleString()}
              </span>
            </div>

            {/* VPA copy */}
            <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-slate-800 rounded-lg text-xs font-mono">
              <span className="text-gray-700 dark:text-slate-300 truncate">
                {activeUpiExpense.expense.upiId || 'rahulsharma@oksbi'}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeUpiExpense.expense.upiId || 'rahulsharma@oksbi');
                  setCopiedUpi(true);
                  setTimeout(() => setCopiedUpi(false), 2000);
                }}
                className="text-blue-600 dark:text-blue-400 font-bold ml-2 shrink-0"
              >
                {copiedUpi ? 'Copied!' : 'Copy UPI'}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  handleToggleSettle(activeUpiExpense.expense.id, user!.id, false);
                  setActiveUpiExpense(null);
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Mark as Settled
              </button>

              <button
                onClick={() => setActiveUpiExpense(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-slate-800 text-gray-800 dark:text-slate-200 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
