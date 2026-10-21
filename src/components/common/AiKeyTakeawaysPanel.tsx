import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  Copy,
  AlertCircle,
  BookmarkCheck,
} from 'lucide-react';
import { FormattedAiMessage } from './FormattedAiMessage';
import {
  requestKeyTakeaways,
  extractLocalScientificTakeaways,
} from '../../utils/keyTakeawaysService';

export interface AiKeyTakeawaysPanelProps {
  messageId?: string;
  question?: string;
  answer: string;
  modelTitle?: string;
  subject?: string;
  context?: Record<string, any>;
  variant?: 'light' | 'dark';
  /** Optional cached takeaways persisted in parent message state */
  cachedTakeaways?: string;
  /** Optional cached open/collapsed state persisted in parent message state */
  cachedIsOpen?: boolean;
  /** Callback to persist generated takeaways and open state in parent conversation history */
  onUpdateCache?: (takeaways: string, isOpen: boolean) => void;
}

export const AiKeyTakeawaysPanel: React.FC<AiKeyTakeawaysPanelProps> = ({
  question = '',
  answer,
  modelTitle,
  subject,
  context,
  variant = 'light',
  cachedTakeaways,
  cachedIsOpen,
  onUpdateCache,
}) => {
  const [takeaways, setTakeaways] = useState<string | null>(cachedTakeaways || null);
  const [isOpen, setIsOpen] = useState<boolean>(cachedIsOpen ?? Boolean(cachedTakeaways));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Sync with parent cache if message changes
  useEffect(() => {
    if (cachedTakeaways !== undefined) {
      setTakeaways(cachedTakeaways || null);
    }
    if (cachedIsOpen !== undefined) {
      setIsOpen(cachedIsOpen);
    }
  }, [cachedTakeaways, cachedIsOpen]);

  const handleGenerateOrToggle = async (forceRegenerate = false) => {
    if (loading) return;

    // If takeaways already exist and user is not forcing regeneration, simply toggle visibility
    if (takeaways && !forceRegenerate) {
      const nextOpen = !isOpen;
      setIsOpen(nextOpen);
      onUpdateCache?.(takeaways, nextOpen);
      return;
    }

    setLoading(true);
    setError(null);
    setIsOpen(true);

    try {
      const result = await requestKeyTakeaways({
        question,
        answer,
        modelTitle,
        subject,
        context,
      });

      const content =
        result.takeaways || extractLocalScientificTakeaways(answer, question, context);
      setTakeaways(content);
      setIsOpen(true);
      onUpdateCache?.(content, true);
    } catch (err: any) {
      const fallback = extractLocalScientificTakeaways(answer, question, context);
      if (fallback) {
        setTakeaways(fallback);
        setIsOpen(true);
        onUpdateCache?.(fallback, true);
      } else {
        setError(err?.message || 'Could not extract important points. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!takeaways) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(takeaways.replace(/\*\*/g, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // Ignore clipboard permission errors in restricted iframes
    }
  };

  const isDark = variant === 'dark';

  return (
    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60" style={{ borderColor: isDark ? 'rgba(51, 65, 85, 0.55)' : 'rgba(226, 232, 240, 0.85)' }}>
      {/* Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => handleGenerateOrToggle(false)}
          disabled={loading}
          aria-expanded={isOpen}
          title={
            takeaways
              ? isOpen
                ? 'Hide important points summary'
                : 'Show important points summary'
              : 'Extract concise key takeaways from this AI explanation'
          }
          className={
            isDark
              ? `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                  isOpen && takeaways
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-amber-300 border-amber-500/30 hover:border-amber-400/50 shadow-2xs'
                } disabled:opacity-60`
              : `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                  isOpen && takeaways
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100/80'
                    : 'bg-amber-50/70 hover:bg-amber-100/80 text-amber-800 border-amber-200/90 hover:border-amber-300 shadow-2xs'
                } disabled:opacity-60`
          }
        >
          <Sparkles
            className={`w-3 h-3 shrink-0 ${
              loading
                ? 'animate-spin text-amber-500'
                : isDark
                  ? 'text-amber-400'
                  : 'text-amber-600'
            }`}
          />
          <span>
            {loading
              ? 'Extracting Important Points...'
              : takeaways
                ? isOpen
                  ? '✨ Hide Important Points'
                  : '✨ Important Points'
                : '✨ Important Points'}
          </span>
          {takeaways && !loading && (
            isOpen ? (
              <ChevronUp className="w-3 h-3 opacity-75" />
            ) : (
              <ChevronDown className="w-3 h-3 opacity-75" />
            )
          )}
        </button>

        {/* Secondary controls when open */}
        {isOpen && takeaways && !loading && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopy}
              title="Copy key takeaways for study notes"
              className={
                isDark
                  ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer'
                  : 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer'
              }
            >
              {copied ? (
                <>
                  <Check className="w-2.5 h-2.5 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-2.5 h-2.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleGenerateOrToggle(true)}
              title="Regenerate key takeaways"
              className={
                isDark
                  ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition-colors cursor-pointer'
                  : 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors cursor-pointer'
              }
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div
          className={
            isDark
              ? 'mt-2 p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 text-amber-300/90 text-[11px] flex items-center gap-2'
              : 'mt-2 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-[11px] flex items-center gap-2'
          }
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
          <span>Distilling key scientific takeaways and revision points...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div
          className={
            isDark
              ? 'mt-2 p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-[11px] flex items-center justify-between gap-2'
              : 'mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center justify-between gap-2'
          }
        >
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => handleGenerateOrToggle(true)}
            className="font-bold underline cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Collapsible Key Takeaways Content Box */}
      {isOpen && takeaways && !loading && (
        <div
          className={
            isDark
              ? 'mt-2 p-3 rounded-xl bg-slate-950/90 border border-amber-500/35 text-slate-100 shadow-xs space-y-1.5'
              : 'mt-2 p-3 rounded-xl bg-gradient-to-br from-amber-50/90 via-white to-sky-50/50 border border-amber-200/90 text-slate-800 shadow-2xs space-y-1.5'
          }
        >
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-amber-500/20">
            <div className="flex items-center gap-1.5">
              <BookmarkCheck
                className={`w-3.5 h-3.5 shrink-0 ${
                  isDark ? 'text-amber-400' : 'text-amber-600'
                }`}
              />
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-amber-300' : 'text-amber-900'
                }`}
              >
                Key Takeaways · Quick Revision Summary
              </span>
            </div>
            {modelTitle && (
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                  isDark
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                    : 'bg-amber-100/80 text-amber-800 border border-amber-200'
                } truncate max-w-[160px]`}
              >
                {modelTitle}
              </span>
            )}
          </div>

          <div className="text-[11px] leading-relaxed pt-0.5">
            <FormattedAiMessage
              text={takeaways}
              variant={isDark ? 'dark' : 'light'}
            />
          </div>
        </div>
      )}
    </div>
  );
};
