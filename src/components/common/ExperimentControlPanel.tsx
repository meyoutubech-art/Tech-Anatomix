import React, { useState } from 'react';
import {
  ParameterDefinition,
  ConditionDefinition,
  ExperimentHistoryEntry,
} from '../../types/simulation';
import { Sliders, Sparkles, Send, RotateCcw, ArrowLeftRight, History, Undo2 } from 'lucide-react';

interface ExperimentControlPanelProps {
  simulationId: string;
  simulationTitle: string;
  parameters: Record<string, ParameterDefinition>;
  conditions: Record<string, ConditionDefinition>;
  currentParams: Record<string, any>;
  onParamChange: (paramId: string, val: any) => void;
  onOpenCompare: () => void;
  onResetExperiment: () => void;
  onUndoLastChange?: () => void;
  canUndo?: boolean;
  history: ExperimentHistoryEntry[];
  onRestoreHistory: (entry: ExperimentHistoryEntry) => void;
  onTriggerAiChange: (prompt: string) => void;
  isAiProcessing: boolean;
  equations: string[];
}

export const ExperimentControlPanel: React.FC<ExperimentControlPanelProps> = ({
  simulationId,
  simulationTitle,
  parameters,
  conditions,
  currentParams,
  onParamChange,
  onOpenCompare,
  onResetExperiment,
  onUndoLastChange,
  canUndo = false,
  history,
  onRestoreHistory,
  onTriggerAiChange,
  isAiProcessing,
  equations,
}) => {
  const [activeTab, setActiveTab] = useState<'explore' | 'experiment'>('experiment');
  const [aiPrompt, setAiPrompt] = useState('');

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isAiProcessing) return;
    onTriggerAiChange(aiPrompt.trim());
    setAiPrompt('');
  };

  return (
    <div id="experiment-control-deck" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col gap-5">
      {/* Top Mode Selector Tabs */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-lg">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'explore'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => setActiveTab('experiment')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'experiment'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Experiment / Change
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {canUndo && onUndoLastChange && (
            <button
              onClick={onUndoLastChange}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              title="Undo last parameter change"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </button>
          )}
          <button
            onClick={onOpenCompare}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Compare current simulation with initial baseline"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compare</span>
          </button>
          <button
            onClick={onResetExperiment}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Reset parameters to initial default values"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* EXPLORE TAB: Equations & Principles */}
      {activeTab === 'explore' ? (
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Governing Mathematical Laws
            </h4>
            <div className="space-y-2">
              {equations.map((eq, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 font-mono text-xs text-slate-800">
                  {eq}
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed space-y-2">
            <p>
              In <strong className="text-slate-900">{simulationTitle}</strong>, state changes obey deterministic physical conservation laws.
            </p>
            <p>
              Switch to <strong className="text-slate-900">Experiment / Change</strong> to manipulate parameters manually or prompt VIZLAB AI using natural language.
            </p>
          </div>
        </div>
      ) : (
        /* EXPERIMENT / CHANGE TAB */
        <div className="space-y-6">
          {/* AI Natural Language Control */}
          <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-200/60">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <label htmlFor="ai-prompt-input" className="text-xs font-semibold text-slate-900">
                Tell VIZLAB what you want to change:
              </label>
            </div>

            <form onSubmit={handleAiSubmit} className="flex gap-2">
              <input
                id="ai-prompt-input"
                type="text"
                placeholder='e.g., "Set gravity to Moon, double length, turn damping off"'
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={isAiProcessing}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
              />
              <button
                type="submit"
                disabled={!aiPrompt.trim() || isAiProcessing}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAiProcessing ? 'Interpreting...' : 'Apply'}</span>
              </button>
            </form>

            <div className="mt-2.5 flex items-center flex-wrap gap-1.5 text-[11px] text-slate-500">
              <span className="text-slate-400">Multi-change prompt:</span>
              {simulationId === 'pendulum' && (
                <button
                  type="button"
                  onClick={() => onTriggerAiChange('Set gravity to Moon and double the length')}
                  className="hover:text-sky-700 underline cursor-pointer"
                >
                  "Set gravity to Moon & double length"
                </button>
              )}
              {simulationId === 'projectile' && (
                <button
                  type="button"
                  onClick={() => onTriggerAiChange('Launch on the Moon with 40 m/s velocity')}
                  className="hover:text-sky-700 underline cursor-pointer"
                >
                  "Moon gravity & 40 m/s velocity"
                </button>
              )}
              {simulationId === 'circuit' && (
                <button
                  type="button"
                  onClick={() => onTriggerAiChange('Increase voltage to 18V and double resistance')}
                  className="hover:text-sky-700 underline cursor-pointer"
                >
                  "18V voltage & double resistance"
                </button>
              )}
            </div>
          </div>

          {/* PARAMETERS SECTION */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Sliders className="w-4 h-4 text-slate-700" />
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Simulation Parameters
              </h4>
            </div>

            <div className="space-y-4">
              {Object.values(parameters).map((p) => {
                const value = currentParams[p.id] ?? p.defaultValue;
                return (
                  <div key={p.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{p.name}</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {value} {p.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={p.min}
                      max={p.max}
                      step={p.step}
                      value={value}
                      onChange={(e) => onParamChange(p.id, parseFloat(e.target.value))}
                      className="w-full accent-slate-900 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>
                        {p.min} {p.unit}
                      </span>
                      <span>
                        {p.max} {p.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CONDITIONS SECTION */}
          {Object.keys(conditions).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Environmental Conditions
              </h4>

              <div className="space-y-3">
                {Object.values(conditions).map((c) => {
                  const val = currentParams[c.id] ?? c.defaultValue;

                  if (c.type === 'boolean') {
                    return (
                      <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 text-xs">
                        <div>
                          <span className="font-medium text-slate-700 block">{c.name}</span>
                          <span className="text-[11px] text-slate-400">{c.description}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onParamChange(c.id, !val)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            val ? 'bg-slate-900' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              val ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  }

                  if (c.type === 'select' && c.options) {
                    return (
                      <div key={c.id} className="space-y-1 text-xs">
                        <label className="font-medium text-slate-700 block">{c.name}</label>
                        <select
                          value={val}
                          onChange={(e) => onParamChange(c.id, e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900 cursor-pointer"
                        >
                          {c.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          )}

          {/* EXPERIMENT HISTORY SECTION */}
          {history.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 mb-2.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Session Change History
                </h4>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {history.map((entry, idx) => (
                  <button
                    key={entry.id}
                    onClick={() => onRestoreHistory(entry)}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-xs text-left transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">Step {history.length - idx}: </span>
                      <span className="text-slate-600">{entry.description}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-sky-600 shrink-0 ml-2">Restore</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
