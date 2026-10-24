import React, { useState } from 'react';
import { ChemicalReagent } from '../../types/chemistry';
import { findOrLookupCompound } from '../../data/compoundRegistry';
import { soundEngine } from '../../utils/soundEngine';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  AlertCircle,
  Search,
  FlaskConical,
  ShieldAlert,
  Info,
  Layers,
} from 'lucide-react';

interface AiCompoundAddPanelProps {
  onAddCompound: (reagent: ChemicalReagent, customAmount?: number) => void;
  selectedIngredientIds: string[];
}

export const AiCompoundAddPanel: React.FC<AiCompoundAddPanelProps> = ({
  onAddCompound,
  selectedIngredientIds,
}) => {
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{
    found: boolean;
    compound?: ChemicalReagent;
    sourceConfidence?: string;
    message?: string;
  } | null>(null);
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsAddedSuccess(false);
    const result = findOrLookupCompound(query);
    setSearchResult(result);
    if (result.found && result.compound) {
      soundEngine.playUiFeedback('ai_completion', `ai_lookup_ok::${result.compound.id}`);
    } else {
      soundEngine.playUiFeedback('validation_warning', `ai_lookup_warn::${query.trim().toLowerCase()}`);
    }
  };

  const handleAdd = () => {
    if (!searchResult || !searchResult.compound) return;
    onAddCompound(searchResult.compound, searchResult.compound.pourAmount);
    setIsAddedSuccess(true);
    setTimeout(() => setIsAddedSuccess(false), 2500);
  };

  const quickQueryExamples = [
    'Baking Soda',
    'Manganese Dioxide',
    'Citric Acid',
    'Phenolphthalein',
    'Potassium Iodide',
    'Lead Nitrate',
    'Chalk',
  ];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              AI-Assisted Compound Addition
            </h3>
            <p className="text-[11px] text-slate-500">
              Discover and add supported compounds beyond the visible preset shelf
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          Canonical Chemistry Registry
        </span>
      </div>

      {/* Query Search Form */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Type compound name or formula (e.g. "baking soda", "manganese dioxide", "citric acid")...'
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim()}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Lookup</span>
        </button>
      </form>

      {/* Quick Example Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-slate-500">
        <span className="shrink-0 font-medium text-slate-400">Try searching:</span>
        {quickQueryExamples.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setQuery(ex);
              setIsAddedSuccess(false);
              setSearchResult(findOrLookupCompound(ex));
            }}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium whitespace-nowrap transition-colors cursor-pointer"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Lookup Result Card */}
      {searchResult && (
        <div className="pt-2">
          {searchResult.found && searchResult.compound ? (
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/60 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: searchResult.compound.color }}
                    />
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">
                      {searchResult.compound.name}
                    </h4>
                    <span className="font-mono text-xs font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                      {searchResult.compound.formula}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {searchResult.compound.description}
                  </p>
                </div>

                <span className="text-[9px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded shrink-0 border border-emerald-300">
                  {searchResult.compound.type}
                </span>
              </div>

              {/* Verified Metadata Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200/60 text-[11px]">
                <div className="flex items-center gap-3 text-slate-600">
                  <span>State: <strong className="text-slate-900 capitalize">{searchResult.compound.state}</strong></span>
                  {searchResult.compound.concentration && (
                    <span>Conc: <strong className="text-slate-900">{searchResult.compound.concentration}</strong></span>
                  )}
                  <span>Pour Amount: <strong className="text-slate-900">{searchResult.compound.pourAmount} {searchResult.compound.unit}</strong></span>
                </div>

                <span className="text-[10px] text-emerald-700 font-medium italic">
                  ✓ {searchResult.sourceConfidence || 'Verified Canonical Chemistry Database'}
                </span>
              </div>

              {searchResult.compound.isRestricted && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-100/90 border border-amber-300 text-amber-950 text-[11px]">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      {searchResult.compound.safetyClassification === 'radioactive_restricted'
                        ? 'Radioactive Substance — Reference Only (Interactive Mixing Disabled)'
                        : 'Restricted Hazardous Substance — Reference Only (Interactive Mixing Disabled)'}
                    </span>
                    <p className="mt-0.5 text-amber-900">
                      {searchResult.compound.restrictionReason ||
                        'This compound is preserved in the canonical registry for educational lookup only and cannot be mixed in the virtual beaker.'}
                    </p>
                  </div>
                </div>
              )}

              {searchResult.compound.formulaCorrectionNote && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 text-[10px]">
                  <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>{searchResult.compound.formulaCorrectionNote}</span>
                </div>
              )}

              {searchResult.compound.hazard && !searchResult.compound.isRestricted && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-100/80 border border-rose-200 text-rose-800 text-[11px] font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Safety Note: {searchResult.compound.hazard}</span>
                </div>
              )}

              {/* Explicit "Add to Experiment" Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  {searchResult.compound.isRestricted
                    ? 'Catalogued for educational reference only'
                    : selectedIngredientIds.includes(searchResult.compound.id)
                    ? 'Currently added in beaker'
                    : 'Ready to load into active experiment'}
                </span>

                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={Boolean(searchResult.compound.isRestricted)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                    searchResult.compound.isRestricted
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : isAddedSuccess
                      ? 'bg-emerald-700 text-white cursor-pointer'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20 cursor-pointer'
                  }`}
                >
                  {searchResult.compound.isRestricted ? (
                    <>
                      <ShieldAlert className="w-4 h-4" />
                      <span>Restricted (Reference Only)</span>
                    </>
                  ) : isAddedSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Added to Experiment!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add to Experiment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/70 text-amber-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Compound Verification Notice:</span>
                <p>{searchResult.message}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
