import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, KeyRound } from 'lucide-react';

interface LoginPageProps {
  onSwitchToRegister: () => void;
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister, onSuccess }) => {
  const { login, error, clearError, switchDemoAccount } = useAuth();
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

  const handleDemoClick = async (demoEmail: string) => {
    const ok = await switchDemoAccount(demoEmail);
    if (ok) {
      onSuccess();
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Log in</h1>
          <p className="text-xs text-gray-500 mt-1">Access your StayNest student housing portal</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { clearError(); setEmail(e.target.value); }}
              placeholder="you@college.edu"
              className="w-full text-xs rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { clearError(); setPassword(e.target.value); }}
              placeholder="min 6 characters"
              className="w-full text-xs rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition shadow-xs disabled:opacity-50"
          >
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="text-center text-xs text-gray-600">
          No account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-600 font-bold hover:underline"
          >
            Register
          </button>
        </div>

        {/* Wireframe Page 1 Yellow Banner */}
        <div className="bg-amber-100/70 border border-amber-300 text-amber-900 text-xs px-3.5 py-2 rounded-lg font-mono text-center">
          POST /api/auth/login returns a 7-day JWT
        </div>

        {/* Quick Demo Logins for Instant Testing */}
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 text-center">
            Or log in as demo user
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleDemoClick('rahul@college.edu')}
              className="p-2 border rounded-lg text-left hover:bg-gray-50 font-medium"
            >
              Rahul (Student)
            </button>
            <button
              onClick={() => handleDemoClick('vikram@staynest.com')}
              className="p-2 border rounded-lg text-left hover:bg-gray-50 font-medium"
            >
              Vikram (Owner)
            </button>
            <button
              onClick={() => handleDemoClick('suresh@staynest.com')}
              className="p-2 border rounded-lg text-left hover:bg-gray-50 font-medium"
            >
              Suresh (Unverified)
            </button>
            <button
              onClick={() => handleDemoClick('admin@staynest.com')}
              className="p-2 border rounded-lg text-left hover:bg-gray-50 font-medium"
            >
              Admin Moderator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
