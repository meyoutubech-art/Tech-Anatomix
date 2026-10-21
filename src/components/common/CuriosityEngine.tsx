import React from 'react';
import { CuriosityItem } from '../../types/simulation';
import { Compass, Sparkles, ArrowRight } from 'lucide-react';

interface CuriosityEngineProps {
  items: CuriosityItem[];
  onApplyCuriosity: (suggestedChanges: Record<string, any>) => void;
}

export const CuriosityEngine: React.FC<CuriosityEngineProps> = ({ items, onApplyCuriosity }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <Compass className="w-4 h-4 text-sky-600" />
        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
          Curiosity Engine (Quick Scientific Hypotheses)
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onApplyCuriosity(item.suggestedChanges)}
            className="p-3 rounded-lg border border-slate-200/90 hover:border-sky-400 hover:bg-sky-50/40 bg-white transition-all text-left group flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between text-sky-600 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-xs font-semibold text-slate-900 leading-snug group-hover:text-sky-900">
                {item.prompt}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>
            <div className="mt-2 text-[10px] font-semibold text-sky-600 uppercase tracking-wider">
              Try This Now →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
