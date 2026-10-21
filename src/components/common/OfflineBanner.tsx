import React from 'react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { WifiOff, Sparkles, CheckCircle2 } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { isOnline, totalPresets } = useOfflineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-300/40 text-amber-950 px-4 py-2 text-xs transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-semibold text-amber-900">Offline Mode Active:</span>
          <span className="text-amber-800">
            School Wi-Fi is disconnected. All {totalPresets} preset 3D models, 3D rotations, labels, and lab simulations remain 100% interactive offline.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[11px] font-medium text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded-full border border-amber-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
          <span>Local Cache Verified</span>
        </div>
      </div>
    </div>
  );
};
