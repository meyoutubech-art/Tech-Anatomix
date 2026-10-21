import React from 'react';
import { PendingAiChange } from '../../types/simulation';
import { ArrowRight, Sparkles, Check, X } from 'lucide-react';

interface ChangePreviewModalProps {
  change?: PendingAiChange | null;
  changes?: PendingAiChange[] | null;
  userPrompt: string;
  onApply: () => void;
  onCancel: () => void;
}

export const ChangePreviewModal: React.FC<ChangePreviewModalProps> = ({
  change,
  changes,
  userPrompt,
  onApply,
  onCancel,
}) => {
  const changeList = changes || (change ? [change] : null);
  if (!changeList || changeList.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {changeList.length > 1 ? `${changeList.length} AI Changes Detected` : 'AI Change Detected'}
            </h3>
            <p className="text-xs text-slate-500">VIZLAB mapped your natural language instruction</p>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 mb-4 text-xs text-slate-600">
          <span className="text-slate-400 block mb-0.5 font-medium">You asked:</span>
          <p className="font-semibold text-slate-800 italic">"{userPrompt}"</p>
        </div>

        <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
          <span className="text-xs text-slate-400 font-medium block">Detected Parameter Changes:</span>
          {changeList.map((ch, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-3 bg-white">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 capitalize">{ch.parameter}</span>
                <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {String(ch.oldValue)} {ch.unit}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-sky-600" />
                  <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                    {String(ch.newValue)} {ch.unit}
                  </span>
                </div>
              </div>
              {ch.explanation && (
                <p className="text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100">
                  {ch.explanation}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            onClick={onApply}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{changeList.length > 1 ? 'Apply All Changes' : 'Apply Change'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
