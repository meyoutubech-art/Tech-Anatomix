import React, { useState } from 'react';
import { ReactionOptionCard, discoverReactions } from '../../data/reactionDiscoveryEngine';
import { ChemicalReagent } from '../../types/chemistry';
import { findOrLookupCompound } from '../../data/compoundRegistry';
import { REAGENTS } from '../../data/reactionsData';
import { soundEngine } from '../../utils/soundEngine';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Play,
  ArrowRight,
  FlaskConical,
  Info,
  ShieldAlert,
  Flame,
  Zap,
  RotateCcw,
  Check,
} from 'lucide-react';

interface ReactionDiscoveryPanelProps {
  onLoadReactionToExperiment: (
    reactants: Array<{ id: string; amount: number; name: string; formula: string }>,
    catalystId?: string | null
  ) => void;
}

export const ReactionDiscoveryPanel: React.FC<ReactionDiscoveryPanelProps> = ({
  onLoadReactionToExperiment,
}) => {
  const [query, setQuery] = useState('');
  const [discoveryResult, setDiscoveryResult] = useState<{
    query: string;
    options: ReactionOptionCard[];
    totalFound: number;
    message?: string;
  } | null>(null);

  const [selectedCard, setSelectedCard] = useState<ReactionOptionCard | null>(null);
  const [isLoadedSuccess, setIsLoadedSuccess] = useState(false);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setSelectedCard(null);
    setIsLoadedSuccess(false);
    const res = discoverReactions(query);
    setDiscoveryResult(res);
    if (res.options.length > 0) {
      soundEngine.playUiFeedback('ai_completion', `ai_discover_ok::${query.trim().toLowerCase()}`);
    } else {
      soundEngine.playUiFeedback('validation_warning', `ai_discover_empty::${query.trim().toLowerCase()}`);
    }
  };

  const handleSelectCard = (card: ReactionOptionCard) => {
    setSelectedCard(card);
    setIsLoadedSuccess(false);
  };

  const handleLoadReaction = () => {
    if (!selectedCard) return;

    // Map reactants for active experiment
    const reactantsToLoad = selectedCard.reactants.map((r) => {
      const lookup = findOrLookupCompound(r.id);
      const def = lookup.compound || REAGENTS.find((reg) => reg.id === r.id);
      return {
        id: r.id,
        amount: r.amount,
        name: def ? def.name : r.name,
        formula: def ? def.formula : r.formula,
      };
    });

    onLoadReactionToExperiment(reactantsToLoad, selectedCard.catalystId || null);

    setIsLoadedSuccess(true);
    setTimeout(() => setIsLoadedSuccess(false), 3000);
  };

  const examplePrompts = [
    'Find a reaction in which effervescence occurs.',
    'Find a reaction that forms a precipitate.',
    'Find a reaction with a visible colour change.',
    'Find a suitable acid-base neutralisation reaction.',
    'Find a reaction involving a metal and an acid.',
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl text-slate-100 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Discover a Reaction
            </h2>
            <p className="text-[11px] text-slate-400">
              Natural-Language AI Reaction Discovery & Automated Experiment Populator
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800/80">
          Validated Stoichiometric Engine
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe the reaction you want to observe..."
            className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500 font-medium"
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim()}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Discover</span>
        </button>
      </form>

      {/* Example Prompt Chips */}
      <div className="space-y-1">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
          Educational Reaction Prompts:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          {examplePrompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setQuery(p);
                setSelectedCard(null);
                setIsLoadedSuccess(false);
                setDiscoveryResult(discoverReactions(p));
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition-colors cursor-pointer border border-slate-700/60"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Discovery Results Options Grid */}
      {discoveryResult && (
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{discoveryResult.message}</span>
            <span className="font-mono text-[10px] text-emerald-400">
              Showing {discoveryResult.options.length} Option{discoveryResult.options.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {discoveryResult.options.map((opt, idx) => {
              const isSelected = selectedCard?.id === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectCard(opt)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden ${
                    isSelected
                      ? 'border-emerald-400 bg-slate-950 ring-2 ring-emerald-500/40 shadow-xl'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="space-y-2 w-full">
                    {/* Badge & Number */}
                    <div className="flex items-center justify-between">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold flex items-center justify-center border border-emerald-500/30">
                        {idx + 1}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                        {opt.reactionType.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Reaction Name */}
                    <h3 className="font-bold text-xs text-white leading-snug">
                      {opt.name}
                    </h3>

                    {/* Balanced Chemical Equation Box */}
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-300 font-bold overflow-x-auto">
                      {opt.balancedEquation}
                    </div>

                    {/* Required Reactants List */}
                    <div className="text-[11px] text-slate-300 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Required Reactants:
                      </span>
                      <p className="font-mono text-slate-200">
                        {opt.reactants.map((r) => `${r.name} (${r.formula})`).join(' + ')}
                      </p>
                    </div>

                    {/* Expected Observable Result */}
                    <div className="text-[11px] text-slate-300 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Expected Observable Result:
                      </span>
                      <p className="text-slate-200 leading-relaxed text-[11px]">
                        {opt.observableResult}
                      </p>
                    </div>

                    {/* Catalyst Info */}
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <span className="font-semibold text-slate-300">Catalyst Requirement: </span>
                      <span className={opt.catalystRequired ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                        {opt.catalystInfo}
                      </span>
                    </div>
                  </div>

                  {/* Select Card Footer */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-bold text-emerald-400 w-full">
                    <span>{isSelected ? 'Selected Option' : 'Click to Select Option'}</span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-1' : ''}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Reaction Selected Confirmation Step */}
      {selectedCard && (
        <div className="p-4 rounded-xl border border-emerald-500/50 bg-emerald-950/40 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-xs text-white">
                  Selected Reaction Confirmation
                </h4>
                <p className="text-[11px] text-slate-300 font-medium">
                  {selectedCard.name}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-700">
              Ready to Load
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Required Reactants ({selectedCard.reactants.length}):
              </span>
              <ul className="space-y-0.5 text-slate-200 font-mono text-[11px]">
                {selectedCard.reactants.map((r) => (
                  <li key={r.id}>
                    • <strong>{r.formula}</strong> — {r.name} ({r.amount} {r.unit})
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Catalyst Requirement:
              </span>
              <p className="text-slate-300 text-[11px]">
                {selectedCard.catalystInfo}
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
            <strong className="text-white block mb-0.5">Educational Scientific Explanation:</strong>
            <p>{selectedCard.explanation}</p>
          </div>

          {/* Explicit "Load Reaction into Experiment" Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              Populates beaker with required reactants & catalyst
            </span>

            <button
              type="button"
              onClick={handleLoadReaction}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
                isLoadedSuccess
                  ? 'bg-emerald-500 text-slate-950 font-extrabold'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-950/40 ring-1 ring-emerald-300'
              }`}
            >
              {isLoadedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Loaded Reaction into Experiment!</span>
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4" />
                  <span>Load Reaction into Experiment</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
