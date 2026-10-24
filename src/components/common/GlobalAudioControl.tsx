import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Sliders } from 'lucide-react';
import { soundEngine, GlobalAudioSettings } from '../../utils/soundEngine';

export const GlobalAudioControl: React.FC = () => {
  const [settings, setSettings] = useState<GlobalAudioSettings>(() => soundEngine.getSettings());
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = soundEngine.subscribe((updated) => {
      setSettings(updated);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggleMute = () => {
    soundEngine.toggleMute();
  };

  return (
    <div ref={containerRef} className="relative flex items-center">
      <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        <button
          type="button"
          onClick={handleToggleMute}
          aria-label={settings.enabled ? 'Mute application audio' : 'Unmute application audio'}
          title={settings.enabled ? 'Sound Enabled (Click to Mute)' : 'Sound Muted (Click to Unmute)'}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
            settings.enabled
              ? 'text-emerald-700 bg-white shadow-2xs hover:bg-emerald-50'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {settings.enabled ? (
            <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="hidden xl:inline">{settings.enabled ? 'Sound' : 'Muted'}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label="Open audio volume mixer"
          title="Audio Mixer & Volume Settings"
          className="px-1.5 py-1 text-slate-500 hover:text-slate-900 rounded-md transition-colors cursor-pointer"
        >
          <Sliders className="w-3 h-3" />
        </button>
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Audio Settings Mixer"
          className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl p-3.5 z-50 space-y-3 text-xs"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-900">Scientific Audio Mixer</span>
            <button
              type="button"
              onClick={handleToggleMute}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                settings.enabled
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {settings.enabled ? 'Master ON' : 'Muted'}
            </button>
          </div>

          {/* Master Volume */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="audio-master-vol" className="font-medium text-slate-700">
                Master Volume
              </label>
              <span className="font-mono text-[11px] text-slate-500">
                {Math.round(settings.masterVolume * 100)}%
              </span>
            </div>
            <input
              id="audio-master-vol"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.masterVolume}
              onChange={(e) =>
                soundEngine.updateSettings({ masterVolume: parseFloat(e.target.value) })
              }
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Simulation & Lab Volume */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="audio-sim-vol" className="font-medium text-slate-700">
                Simulation &amp; Lab Audio
              </label>
              <span className="font-mono text-[11px] text-slate-500">
                {Math.round(settings.simulationVolume * 100)}%
              </span>
            </div>
            <input
              id="audio-sim-vol"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.simulationVolume}
              onChange={(e) =>
                soundEngine.updateSettings({ simulationVolume: parseFloat(e.target.value) })
              }
              className="w-full accent-sky-600 cursor-pointer"
            />
          </div>

          {/* Interface / UI Volume */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="audio-ui-vol" className="font-medium text-slate-700">
                Interface Feedback
              </label>
              <span className="font-mono text-[11px] text-slate-500">
                {Math.round(settings.uiVolume * 100)}%
              </span>
            </div>
            <input
              id="audio-ui-vol"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.uiVolume}
              onChange={(e) =>
                soundEngine.updateSettings({ uiVolume: parseFloat(e.target.value) })
              }
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <p className="text-[10px] text-slate-400 leading-tight pt-1 border-t border-slate-100">
            State-driven audio synchronizes with active cardiac BPM, respiration, verified reactions, and 3D physics.
          </p>
        </div>
      )}
    </div>
  );
};
