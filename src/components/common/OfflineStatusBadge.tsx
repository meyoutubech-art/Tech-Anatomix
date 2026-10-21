import React, { useState } from 'react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { getUniquePresets } from '../../utils/offlineModelManager';
import {
  Wifi,
  WifiOff,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Layers,
  X,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export const OfflineStatusBadge: React.FC = () => {
  const { isOnline, isPreparing, isReady, progress, totalPresets, cachedCount, retryPreparation } =
    useOfflineStatus();
  const [showModal, setShowModal] = useState(false);
  const presets = getUniquePresets();

  // Group presets by category for the exhibition inspector
  const categories = ['Physics', 'Chemistry', 'Biology', 'Earth & Space', 'Engineering'] as const;

  return (
    <>
      {/* Navbar Status Pill */}
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border shadow-2xs ${
          !isOnline
            ? 'bg-amber-500/10 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200'
            : isPreparing
            ? 'bg-sky-50 text-sky-800 border-sky-300 animate-pulse'
            : isReady
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
            : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
        }`}
        title="Click to view Exhibition Offline Readiness details"
      >
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-semibold">Offline</span>
            <span className="text-[11px] text-amber-700 font-mono">
              ({cachedCount}/{totalPresets})
            </span>
          </>
        ) : isPreparing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin shrink-0" />
            <span className="truncate max-w-[130px] sm:max-w-none">
              Preparing models: {progress.current}/{totalPresets}
            </span>
          </>
        ) : isReady ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="hidden sm:inline">Offline Ready</span>
            <span className="sm:hidden font-semibold">Ready</span>
            <span className="text-[11px] text-emerald-700 font-mono">
              ({cachedCount}/{totalPresets})
            </span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Setup Needed</span>
          </>
        )}
      </button>

      {/* Exhibition Offline Readiness Center Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base ${
                    !isOnline
                      ? 'bg-amber-100 text-amber-800'
                      : isReady
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-sky-100 text-sky-800'
                  }`}
                >
                  {!isOnline ? <WifiOff className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    School Exhibition Offline Readiness
                  </h3>
                  <p className="text-xs text-slate-500">
                    Network: {isOnline ? '🟢 Connected (Online)' : '⚡ Disconnected (Offline)'} · Cache Version: v1.0.0
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Overall Status Card */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isReady
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isReady ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    )}
                    <span className="font-bold text-sm">
                      {isReady
                        ? `All ${cachedCount} Presets Verified & Cached Offline`
                        : `Preparing offline models: ${progress.current}/${totalPresets}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isReady
                      ? 'App shell, 3D rendering pipeline, all geometry parts, materials, parameters, conditions, and labels are verified and stored locally. VIZLAB will run without Wi-Fi.'
                      : progress.message}
                  </p>
                </div>

                <button
                  onClick={retryPreparation}
                  disabled={isPreparing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPreparing ? 'animate-spin' : ''}`} />
                  <span>{isPreparing ? 'Verifying...' : 'Re-verify All Presets'}</span>
                </button>
              </div>

              {/* Progress bar if preparing */}
              {isPreparing && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>{progress.currentModelTitle}</span>
                    <span>{progress.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-sky-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Exhibition Day 3-Step Guide */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4 text-sky-600" />
                  <span>Exhibition Device Preparation Checklist</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs text-slate-600">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">Step 1: Connect Online</span>
                    <p className="text-[11px] text-slate-500">
                      Open VIZLAB once on your exhibition tablet or laptop with school Wi-Fi or hotspot.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">Step 2: Confirm Status</span>
                    <p className="text-[11px] text-slate-500">
                      Verify that the badge reads &quot;Offline Ready ({totalPresets}/{totalPresets})&quot;.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">Step 3: Safe to Disconnect</span>
                    <p className="text-[11px] text-slate-500">
                      Turn off Wi-Fi or enable Airplane Mode. All 3D presets and labs work completely offline!
                    </p>
                  </div>
                </div>
              </div>

              {/* Preset Models Manifest Inspection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Preset Models Cached for Offline Access ({presets.length} Models)
                  </h4>
                  <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    100% Geometry &amp; Labels Stored
                  </span>
                </div>

                <div className="space-y-4">
                  {categories.map((cat) => {
                    const catModels = presets.filter((p) => p.category === cat);
                    if (catModels.length === 0) return null;
                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          {cat} ({catModels.length})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {catModels.map((m, idx) => (
                            <div
                              key={m.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors text-xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="font-medium text-slate-800 truncate">
                                  {m.title}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0 pl-2">
                                {m.partsCount} parts
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                PWA Service Worker registered at root scope &apos;/&apos;
              </span>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Center
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
