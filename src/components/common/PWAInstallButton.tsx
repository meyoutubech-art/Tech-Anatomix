import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 font-medium transition-colors cursor-pointer rounded-lg shadow-2xs ${
          compact
            ? 'px-2.5 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-white'
            : 'px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white'
        }`}
        title="Install VIZLAB app for offline school exhibition"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 font-medium transition-colors cursor-pointer rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 ${
            compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
          }`}
          title="Install on iPhone / iPad for offline exhibition"
        >
          <Smartphone className="w-3.5 h-3.5 text-slate-600" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  V
                </div>
                <h3 className="text-base font-bold text-slate-900">Install VIZLAB on iOS</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                To run VIZLAB offline during your school exhibition on iPhone or iPad:
              </p>
              <ol className="text-xs text-slate-700 space-y-2 mb-5 list-decimal pl-4">
                <li>Tap the <strong>Share button</strong> (square with arrow up) in Safari.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top-right corner.</li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
