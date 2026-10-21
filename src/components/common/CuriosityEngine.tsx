import React, { useState } from 'react';
import { Sparkles, HelpCircle, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { FormattedAiMessage } from './FormattedAiMessage';
import { AiKeyTakeawaysPanel } from './AiKeyTakeawaysPanel';
import { classifyAiError } from '../../utils/aiErrorClassifier';

interface CuriosityEngineProps {
  modelTitle: string;
  concept: string;
  prompts?: string[];
  currentState: Record<string, any>;
}

const DEFAULT_PROMPTS = [
  'What happens if we double the primary input?',
  'How is this principle used in modern engineering?',
  'What are the physical limits of this system?',
  'Why does resistance or friction matter here?',
];

export const CuriosityEngine: React.FC<CuriosityEngineProps> = ({
  modelTitle,
  concept,
  prompts = DEFAULT_PROMPTS,
  currentState,
}) => {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAsk = async (prompt: string) => {
    setSelectedPrompt(prompt);
    setLoading(true);
    setAnswer(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: { model: modelTitle, concept, currentState },
          question: prompt,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const classified = classifyAiError(
          res.status,
          data.error || data.reply || 'Failed to generate insight'
        );
        setErrorMsg(classified.userMessage);
        return;
      }
      setAnswer(
        data.reply ||
          "Let's explore how changing the parameters in the 3D view affects the system's behavior!"
      );
    } catch (e: any) {
      const classified = classifyAiError(undefined, e);
      setErrorMsg(classified.userMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 backdrop-blur-md">
      <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Curiosity Engine: "What If?"</span>
      </div>

      <div className="space-y-1.5">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(p)}
            disabled={loading}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between gap-2 border ${
              selectedPrompt === p
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 font-medium'
                : 'bg-slate-950/60 border-slate-800/70 text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <span className="line-clamp-1">{p}</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-500" />
          </button>
        ))}
      </div>

      {(loading || answer || errorMsg) && (
        <div className="mt-3 pt-3 border-t border-slate-800/80">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Simulating theoretical outcome...</span>
            </div>
          ) : errorMsg ? (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-200 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
              {selectedPrompt && (
                <button
                  onClick={() => handleAsk(selectedPrompt)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-3 text-xs text-slate-300 leading-relaxed">
              <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{selectedPrompt}</span>
              </div>
              <FormattedAiMessage text={answer || ''} variant="dark" />
              {answer && (
                <AiKeyTakeawaysPanel
                  messageId={`curiosity-${modelTitle}-${selectedPrompt || 'q'}`}
                  question={selectedPrompt || undefined}
                  answer={answer}
                  context={{
                    modelName: modelTitle,
                    concept,
                    subject: concept,
                  }}
                  variant="dark"
                  showTakeawaysButton={answer.length >= 60}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
