import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { usePWA } from '../context/PWAContext';

export const OfflineBanner: React.FC = () => {
  const { isOffline } = usePWA();

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-4 py-2.5 shadow-md border-b border-amber-500/40 relative z-50 animate-fadeIn"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <WifiOff className="w-3.5 h-3.5 text-amber-200" />
          </div>
          <p className="font-medium text-amber-50 leading-snug">
            <strong className="font-bold text-white">You're offline.</strong> Some PackCheck features require an internet connection. Please reconnect to use product search, AI assistance, live recommendations, and server-based scanning.
          </p>
        </div>
        <span className="hidden md:inline-flex items-center gap-1 bg-white/15 text-amber-100 text-[11px] font-semibold px-2 py-0.5 rounded-md border border-white/20 shrink-0">
          <AlertTriangle className="w-3 h-3" />
          Offline Mode
        </span>
      </div>
    </div>
  );
};
