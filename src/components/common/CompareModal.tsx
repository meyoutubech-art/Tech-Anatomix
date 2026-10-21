import React from 'react';
import { ParameterDefinition } from '../../types/simulation';
import { ArrowLeftRight, RotateCcw, X } from 'lucide-react';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalParams: Record<string, any>;
  currentParams: Record<string, any>;
  originalResults: Record<string, any>;
  currentResults: Record<string, any>;
  parameterDefs: Record<string, ParameterDefinition>;
  onResetToOriginal: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  originalParams,
  currentParams,
  originalResults,
  currentResults,
  parameterDefs,
  onResetToOriginal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">Compare With Original Baseline</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Parameters Comparison */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Parameters
            </h4>
            <div className="space-y-1.5">
              {Object.keys(currentParams).map((key) => {
                const def = parameterDefs[key];
                if (!def) return null;
                const orig = originalParams[key];
                const curr = currentParams[key];
                const hasChanged = orig !== curr;

                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                      hasChanged ? 'border-sky-300 bg-sky-50/50' : 'border-slate-100 bg-slate-50/30'
                    }`}
                  >
                    <span className="font-medium text-slate-700">{def.name}</span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-500">
                        {String(orig)} {def.unit}
                      </span>
                      <span className="text-slate-300">→</span>
                      <span className={`font-bold ${hasChanged ? 'text-sky-700' : 'text-slate-800'}`}>
                        {String(curr)} {def.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Results Comparison */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Calculated Physical Outputs
            </h4>
            <div className="space-y-1.5">
              {Object.keys(currentResults)
                .filter((k) => typeof currentResults[k] === 'number')
                .map((key) => {
                  const orig = originalResults[key];
                  const curr = currentResults[key];
                  const hasChanged = orig !== curr;

                  return (
                    <div
                      key={key}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                        hasChanged ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-100 bg-slate-50/30'
                      }`}
                    >
                      <span className="font-medium text-slate-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-slate-500">{String(orig)}</span>
                        <span className="text-slate-300">→</span>
                        <span className={`font-bold ${hasChanged ? 'text-emerald-700' : 'text-slate-800'}`}>
                          {String(curr)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
          <button
            onClick={() => {
              onResetToOriginal();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Original</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
