import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ShieldCheck, ShieldAlert, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

export const UserStatusBadge: React.FC = () => {
  const { user, switchDemoAccount } = useAuth();
  const { isConnected } = useSocket();
  const [expanded, setExpanded] = useState(false);

  if (!user) return null;

  return (
    <aside aria-label="User session status" className="fixed bottom-4 right-4 z-40 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-xl overflow-hidden text-xs max-w-xs transition-all duration-200">
      <div
        onClick={() => setExpanded(!expanded)}
        className="px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50/80 select-none"
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <div>
            <span className="font-bold text-gray-900 truncate block max-w-[140px] leading-tight">
              {user.name}
            </span>
            <span className="text-[10px] text-gray-500 capitalize">
              {user.role === 'mess_provider' ? 'Mess Provider' : user.role} •{' '}
              {user.isVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
        </div>

        <button className="text-gray-400 hover:text-gray-600">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="p-3 bg-gray-50/70 border-t border-gray-100 space-y-2">
          <div className="text-[11px] text-gray-600 flex items-center justify-between">
            <span>Real-time:</span>
            <span className={isConnected ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
              {isConnected ? 'Socket.io Connected' : 'Offline / Polling'}
            </span>
          </div>

          <div className="text-[11px] text-gray-600 flex items-center justify-between">
            <span>Identity check:</span>
            <span className="font-semibold flex items-center gap-1">
              {user.isVerified ? (
                <span className="text-emerald-700 flex items-center gap-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> ID Checked
                </span>
              ) : (
                <span className="text-amber-700 flex items-center gap-0.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> Pending Proof
                </span>
              )}
            </span>
          </div>

          <div className="pt-1.5 border-t border-gray-200">
            <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              Quick Role Switch
            </span>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <button
                onClick={() => switchDemoAccount('rahul@college.edu')}
                className="p-1 text-left bg-white border rounded hover:bg-gray-100"
              >
                Student
              </button>
              <button
                onClick={() => switchDemoAccount('vikram@staynest.com')}
                className="p-1 text-left bg-white border rounded hover:bg-gray-100"
              >
                Owner
              </button>
              <button
                onClick={() => switchDemoAccount('suresh@staynest.com')}
                className="p-1 text-left bg-white border rounded hover:bg-gray-100"
              >
                Unverified Owner
              </button>
              <button
                onClick={() => switchDemoAccount('admin@staynest.com')}
                className="p-1 text-left bg-white border rounded hover:bg-gray-100"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
