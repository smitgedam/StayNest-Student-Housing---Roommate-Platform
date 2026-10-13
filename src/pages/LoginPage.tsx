import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, KeyRound } from 'lucide-react';

interface LoginPageProps {
  onSwitchToRegister: () => void;
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister, onSuccess }) => {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await login(email, password);
    setSubmitting(false);
    if (ok) {
      onSuccess();
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 w-full">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Log in</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Access your StayNest student housing portal</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { clearError(); setEmail(e.target.value); }}
              placeholder="you@college.edu"
              className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { clearError(); setPassword(e.target.value); }}
              placeholder="min 6 characters"
              className="w-full text-xs rounded-lg border border-gray-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition shadow-xs disabled:opacity-50"
          >
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-2">
          <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-center">
            Or test with 1-click demo accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                clearError();
                setEmail('rahul@college.edu');
                setPassword('password123');
              }}
              className="p-2 text-left rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 transition"
            >
              <div className="text-xs font-bold text-blue-900 dark:text-blue-300">🎓 Student</div>
              <div className="text-[10px] text-blue-700 dark:text-blue-400 truncate">rahul@college.edu</div>
            </button>

            <button
              type="button"
              onClick={() => {
                clearError();
                setEmail('vikram@staynest.com');
                setPassword('password123');
              }}
              className="p-2 text-left rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/60 dark:bg-purple-950/40 hover:bg-purple-100 transition"
            >
              <div className="text-xs font-bold text-purple-900 dark:text-purple-300">🏠 Owner</div>
              <div className="text-[10px] text-purple-700 dark:text-purple-400 truncate">vikram@staynest.com</div>
            </button>

            <button
              type="button"
              onClick={() => {
                clearError();
                setEmail('annapurna@staynest.com');
                setPassword('password123');
              }}
              className="p-2 text-left rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/40 hover:bg-amber-100 transition"
            >
              <div className="text-xs font-bold text-amber-900 dark:text-amber-300">🍲 Mess Provider</div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400 truncate">annapurna@staynest.com</div>
            </button>

            <button
              type="button"
              onClick={() => {
                clearError();
                setEmail('admin@staynest.com');
                setPassword('password123');
              }}
              className="p-2 text-left rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 transition"
            >
              <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300">🛡️ Admin</div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate">admin@staynest.com</div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-gray-600 dark:text-slate-400">
          No account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};
