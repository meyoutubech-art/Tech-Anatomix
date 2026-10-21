import React, { useEffect, useState, useId } from 'react';
import { Volume2, Pause, Play, Square, VolumeX } from 'lucide-react';
import { aiSpeechManager, SpeechPlaybackStatus } from '../../utils/aiSpeechService';

export interface AiVoicePlaybackControlProps {
  speechId?: string;
  text: string;
  variant?: 'light' | 'dark';
  label?: string;
  compact?: boolean;
}

export const AiVoicePlaybackControl: React.FC<AiVoicePlaybackControlProps> = ({
  speechId: externalSpeechId,
  text,
  variant = 'light',
  label = 'Listen',
  compact = false,
}) => {
  const reactId = useId();
  const speechId = externalSpeechId || `ai-speech-${reactId}`;

  const [status, setStatus] = useState<SpeechPlaybackStatus>('idle');
  const [isSupported, setIsSupported] = useState<boolean>(true);

  useEffect(() => {
    setIsSupported(aiSpeechManager.isSupported());

    const unsubscribe = aiSpeechManager.subscribe((state) => {
      if (state.status === 'unsupported') {
        setIsSupported(false);
        setStatus('unsupported');
      } else if (state.activeId === speechId) {
        setStatus(state.status);
      } else {
        setStatus('idle');
      }
    });

    return () => {
      unsubscribe();
      // Stop playback if this specific message unmounts while speaking
      const current = aiSpeechManager.getState();
      if (current.activeId === speechId) {
        aiSpeechManager.stop(speechId);
      }
    };
  }, [speechId]);

  if (!text || !text.trim()) return null;

  const isDark = variant === 'dark';

  if (!isSupported || status === 'unsupported') {
    return (
      <span
        title="Voice playback is not supported in this browser environment"
        className={
          isDark
            ? 'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-900/50 text-slate-500 border border-slate-800 select-none'
            : 'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200 select-none'
        }
      >
        <VolumeX className="w-3 h-3 shrink-0" />
        {!compact && <span>Voice Unavailable</span>}
      </span>
    );
  }

  const handlePrimaryAction = () => {
    if (status === 'playing') {
      aiSpeechManager.pause(speechId);
    } else if (status === 'paused') {
      aiSpeechManager.resume(speechId);
    } else {
      aiSpeechManager.play(speechId, text);
    }
  };

  const handleStop = () => {
    aiSpeechManager.stop(speechId);
  };

  return (
    <div
      className="inline-flex items-center gap-1.5"
      data-testid="ai-voice-playback-control"
    >
      <button
        type="button"
        onClick={handlePrimaryAction}
        aria-label={
          status === 'playing'
            ? 'Pause voice playback'
            : status === 'paused'
              ? 'Resume voice playback'
              : `${label} to AI explanation`
        }
        title={
          status === 'playing'
            ? 'Pause voice playback'
            : status === 'paused'
              ? 'Resume voice playback'
              : 'Listen to this AI explanation'
        }
        className={
          isDark
            ? `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                status === 'playing'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/50 hover:bg-sky-500/30 shadow-2xs'
                  : status === 'paused'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 hover:bg-amber-500/30'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-sky-300 border-sky-500/30 hover:border-sky-400/50 shadow-2xs'
              }`
            : `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                status === 'playing'
                  ? 'bg-sky-100 text-sky-900 border-sky-300 hover:bg-sky-200/80 shadow-2xs'
                  : status === 'paused'
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100/80'
                    : 'bg-sky-50/80 hover:bg-sky-100/90 text-sky-800 border-sky-200/90 hover:border-sky-300 shadow-2xs'
              }`
        }
      >
        {status === 'playing' ? (
          <>
            <Pause className="w-3 h-3 shrink-0 text-sky-500 animate-pulse" />
            <span>Pause</span>
          </>
        ) : status === 'paused' ? (
          <>
            <Play className="w-3 h-3 shrink-0 text-amber-500" />
            <span>Resume</span>
          </>
        ) : (
          <>
            <Volume2
              className={`w-3 h-3 shrink-0 ${
                isDark ? 'text-sky-400' : 'text-sky-600'
              }`}
            />
            <span>{label}</span>
          </>
        )}
      </button>

      {(status === 'playing' || status === 'paused') && (
        <button
          type="button"
          onClick={handleStop}
          aria-label="Stop voice playback"
          title="Stop voice playback"
          className={
            isDark
              ? 'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-700/60 transition-colors cursor-pointer'
              : 'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer'
          }
        >
          <Square className="w-2.5 h-2.5 fill-current shrink-0" />
          <span>Stop</span>
        </button>
      )}
    </div>
  );
};
