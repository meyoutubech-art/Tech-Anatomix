import React from 'react';
import { HelpCircle, X } from 'lucide-react';
import { FormattedAiMessage } from './FormattedAiMessage';
import { AiVoicePlaybackControl } from './AiVoicePlaybackControl';

interface ExplanationCardProps {
  explanation: string | null;
  onDismiss?: () => void;
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({ explanation, onDismiss }) => {
  if (!explanation) return null;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs relative">
      <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
          <HelpCircle className="w-4 h-4 text-sky-600" />
          <span>Scientific Impact & Governing Law</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AiVoicePlaybackControl
            speechId="explanation-card-impact"
            text={explanation}
            variant="light"
            compact
          />
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
              title="Dismiss explanation"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="text-xs text-slate-600 leading-relaxed">
        <FormattedAiMessage text={explanation} variant="light" />
      </div>
    </div>
  );
};
