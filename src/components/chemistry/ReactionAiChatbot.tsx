import React, { useState, useRef, useEffect } from 'react';
import {
  ReactionEvaluationResult,
  REACTIONS,
  getReagentDisplayInfo,
} from '../../data/reactionsData';
import { ChemicalReagent, ReactionDefinition } from '../../types/chemistry';
import {
  resolveAiChemistryAssistantQuery,
  ReactionSupportClassification,
  AssistantUserIntent,
} from '../../utils/aiChemistryAssistantResolver';
import { ReactionOptionCard } from '../../data/reactionDiscoveryEngine';
import {
  Bot,
  Send,
  Sparkles,
  FlaskConical,
  Plus,
  Play,
  Compass,
  CheckCircle2,
  Flame,
  Droplets,
  Wind,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { FormattedAiMessage } from '../common/FormattedAiMessage';
import { AiKeyTakeawaysPanel } from '../common/AiKeyTakeawaysPanel';
import {
  isEligibleForKeyTakeaways,
  findPrecedingUserQuestion,
} from '../../utils/keyTakeawaysService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
  keyTakeaways?: string;
  takeawaysOpen?: boolean;
  userIntent?: AssistantUserIntent;
  reactionSupportClassification?: ReactionSupportClassification;
  aiProviderStatus?: 'live_ai' | 'deterministic_fallback';
  matchedCompounds?: ChemicalReagent[];
  matchedReaction?: ReactionDefinition;
  suggestedReactions?: ReactionDefinition[];
  discoveryOptions?: ReactionOptionCard[];
}

export interface ReactionAiChatbotProps {
  selectedIngredients: Array<{ id: string; amount: number; name: string; formula: string }>;
  conditions: {
    temperature: number;
    concentration: number;
    catalystId?: string | null;
  };
  activeReactionResult: ReactionEvaluationResult | null;
  onAddCompound?: (reagentId: string) => void;
  onLoadReactionToExperiment?: (
    reactants: Array<{ id: string; amount: number; name?: string; formula?: string }>,
    catalystId?: string | null
  ) => void;
  onRunReaction?: (
    overrideReactants?: Array<{ id: string; amount: number; name?: string; formula?: string }>,
    overrideCatalystId?: string | null
  ) => void;
}

const DISCOVERY_SHORTCUTS = [
  {
    label: 'Effervescence (Gas)',
    query: 'Find a reaction in which effervescence occurs.',
  },
  {
    label: 'Precipitate Formation',
    query: 'Find a reaction that forms a precipitate.',
  },
  {
    label: 'Colour Change',
    query: 'Find a reaction with a visible colour change.',
  },
  {
    label: 'Neutralisation',
    query: 'Find a suitable acid-base neutralisation reaction.',
  },
  {
    label: 'Metal + Acid',
    query: 'Find a reaction involving a metal and an acid.',
  },
  {
    label: 'Redox & Catalysis',
    query: 'Find a reaction involving oxidation-reduction or a catalyst.',
  },
];

const EXAMPLE_QUESTIONS = [
  'What happens when lead(II) nitrate reacts with potassium iodide?',
  'Explain the reaction between oxalic acid and potassium permanganate in acidic medium',
  'What happens when copper is added to hydrochloric acid?',
  'What happens when iron chloride reacts with sodium hydroxide?',
  'What is Ziegler-Natta catalyst?',
  'Explain current beaker contents',
];

function renderSupportBadge(classification?: ReactionSupportClassification) {
  if (!classification || classification === 'not_applicable') return null;

  switch (classification) {
    case 'validated_simulator_reaction':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-700/70">
          <CheckCircle2 className="w-3 h-3" />
          <span>Supported in 3D Beaker Simulator</span>
        </span>
      );
    case 'known_non_simulator_reaction':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950/90 text-sky-300 border border-sky-700/70">
          <Info className="w-3 h-3" />
          <span>Scientific Reference Reaction (Not Executable in 3D Simulator)</span>
        </span>
      );
    case 'no_reaction_standard_conditions':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
          <span>No Reaction Under Standard Conditions</span>
        </span>
      );
    case 'restricted_combination':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/90 text-rose-300 border border-rose-700/70">
          <ShieldAlert className="w-3 h-3" />
          <span>Restricted Reference Only (Safety Block)</span>
        </span>
      );
    case 'ambiguous_or_insufficient':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/90 text-amber-300 border border-amber-700/70">
          <Info className="w-3 h-3" />
          <span>Clarification / Reactant Selection Needed</span>
        </span>
      );
    default:
      return null;
  }
}

export const ReactionAiChatbot: React.FC<ReactionAiChatbotProps> = ({
  selectedIngredients,
  conditions,
  activeReactionResult,
  onAddCompound,
  onLoadReactionToExperiment,
  onRunReaction,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text:
        '👋 Welcome to the **Unified AI Chemistry & Reaction Assistant**!\n\n' +
        'I combine **Natural-Language Chemistry Q&A**, **Scientific Reaction Prediction**, **Reaction Discovery**, and **Direct 3D Beaker Loading** across all **854 canonical compounds** (Acids, Bases, Salts & Solutions, Metals, Oxidizers, Indicators, and Catalysts).\n\n' +
        '💡 *Ask me any chemistry question, predict custom reactions, or discover reactions by observation:*\n' +
        '• *"What happens when lead(II) nitrate reacts with potassium iodide?"*\n' +
        '• *"Explain the reaction between oxalic acid and potassium permanganate in acidic medium"*\n' +
        '• *"Find a reaction in which effervescence occurs"* or *"Find a reaction that forms a precipitate"*\n' +
        '• *"What happens when copper is added to hydrochloric acid?"*\n' +
        '• *"Explain what will happen with the current beaker contents"*',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionBanner, setActionBanner] = useState<string | null>(null);
  const lastActionRef = useRef<{ key: string; timestamp: number }>({ key: '', timestamp: 0 });
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages.length, loading]);

  const canPerformAction = (actionKey: string): boolean => {
    const now = Date.now();
    if (
      lastActionRef.current.key === actionKey &&
      now - lastActionRef.current.timestamp < 550
    ) {
      return false;
    }
    lastActionRef.current = { key: actionKey, timestamp: now };
    return true;
  };

  const handleSafeAddCompound = (comp: ChemicalReagent) => {
    if (!onAddCompound || comp.isRestricted) return;
    if (!canPerformAction(`add::${comp.id}`)) return;
    onAddCompound(comp.id);
    setActionBanner(
      `✓ Added ${comp.name} (${comp.formula}, ${comp.pourAmount || 20} ${comp.unit}) to Active Beaker`
    );
  };

  const handleSafeLoadReactionOption = (opt: ReactionOptionCard) => {
    if (!onLoadReactionToExperiment) return;
    if (!canPerformAction(`load_opt::${opt.id}`)) return;
    onLoadReactionToExperiment(opt.reactants, opt.catalystId || null);
    const summary = opt.reactants
      .map((r) => `${r.formula} (${r.amount} ${r.unit})`)
      .join(' + ');
    setActionBanner(
      `✓ Loaded "${opt.name}" into Active Beaker: ${summary}${
        opt.catalystId ? ` + Catalyst` : ''
      }. Click "Run Reaction in 3D Beaker" when ready!`
    );
  };

  const handleSafeLoadReactionDef = (rx: ReactionDefinition) => {
    if (!onLoadReactionToExperiment) return;
    if (!canPerformAction(`load_rx::${rx.id}`)) return;
    const mappedReactants = rx.reactants.map((rid) => {
      const info = getReagentDisplayInfo(rid);
      return {
        id: rid,
        amount: rx.requiredAmounts?.[rid] || 20,
        name: info.name,
        formula: info.formula,
      };
    });
    const catalystId =
      rx.id === 'elephant_toothpaste'
        ? 'mno2'
        : rx.id === 'ki_peroxide_catalysis'
        ? 'ki'
        : rx.id === 'catalase_peroxide_decomposition'
        ? 'catalase_enzyme'
        : null;
    onLoadReactionToExperiment(mappedReactants, catalystId);
    setActionBanner(
      `✓ Loaded "${rx.name}" into Active Beaker (${mappedReactants
        .map((r) => `${r.formula}`)
        .join(' + ')}).`
    );
  };

  const handleSafeRunReaction = (rx?: ReactionDefinition, opt?: ReactionOptionCard) => {
    if (!onRunReaction) return;
    const key = `run::${rx?.id || opt?.id || 'current'}`;
    if (!canPerformAction(key)) return;

    if (opt && onLoadReactionToExperiment) {
      onLoadReactionToExperiment(opt.reactants, opt.catalystId || null);
      onRunReaction(opt.reactants, opt.catalystId || null);
      setActionBanner(`▶ Loaded & Running 3D Simulation: "${opt.name}"`);
      return;
    }

    if (rx && onLoadReactionToExperiment) {
      const mappedReactants = rx.reactants.map((rid) => ({
        id: rid,
        amount: rx.requiredAmounts?.[rid] || 20,
      }));
      const catalystId =
        rx.id === 'elephant_toothpaste'
          ? 'mno2'
          : rx.id === 'ki_peroxide_catalysis'
          ? 'ki'
          : rx.id === 'catalase_peroxide_decomposition'
          ? 'catalase_enzyme'
          : null;
      onLoadReactionToExperiment(mappedReactants, catalystId);
      onRunReaction(mappedReactants, catalystId);
      setActionBanner(`▶ Loaded & Running 3D Simulation: "${rx.name}"`);
      return;
    }

    onRunReaction();
    setActionBanner('▶ Running Active Beaker Reaction Simulation');
  };

  const submitQueryText = async (rawQuery: string) => {
    const userText = rawQuery.trim();
    if (!userText || loading) return;

    setInput('');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const resolution = resolveAiChemistryAssistantQuery(userText, {
      selectedIngredients,
      conditions,
    });

    // For offline mode or strict command guard, respond immediately with verified registry data
    if (
      resolution.queryType === 'mutation_guard' ||
      (typeof navigator !== 'undefined' && !navigator.onLine)
    ) {
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        text: resolution.replyMarkdown,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        userIntent: resolution.userIntent,
        reactionSupportClassification: resolution.reactionSupportClassification,
        aiProviderStatus: 'deterministic_fallback',
        matchedCompounds: resolution.matchedCompounds,
        matchedReaction: resolution.matchedReaction,
        suggestedReactions: resolution.suggestedReactions,
        discoveryOptions: resolution.discoveryOptions,
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      return;
    }

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const localEvaluation = resolution.replyMarkdown;
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userText,
          modelTitle: 'Chemical Reaction Laboratory',
          subject: 'Chemistry',
          context: {
            title: 'Chemical Reaction Laboratory',
            subject: 'Chemistry',
            concept: 'Stoichiometry, Aqueous Reactions, Kinetics & Thermodynamics',
            parameters: {
              temperature: `${conditions.temperature}°C`,
              concentration: `${conditions.concentration.toFixed(1)} M`,
              catalyst: conditions.catalystId || 'None',
              selectedReagents:
                selectedIngredients.map((i) => `${i.name} (${i.formula}, ${i.amount})`).join(', ') ||
                'Empty Beaker',
            },
            results: {
              reactionStatus: activeReactionResult?.structuredStatus || 'READY',
              userIntent: resolution.userIntent,
              reactionSupportClassification: resolution.reactionSupportClassification,
              localChemistryNotes: localEvaluation,
            },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const isLiveAi =
          Boolean(data.answer) &&
          data.activeModel !== 'deterministic-offline' &&
          data.aiProviderStatus === 'live_ai';
        const aiText = isLiveAi ? data.answer : localEvaluation;
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            role: 'assistant',
            text: aiText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            userIntent: resolution.userIntent,
            reactionSupportClassification: resolution.reactionSupportClassification,
            aiProviderStatus: isLiveAi ? 'live_ai' : 'deterministic_fallback',
            matchedCompounds: resolution.matchedCompounds,
            matchedReaction: resolution.matchedReaction,
            suggestedReactions: resolution.suggestedReactions,
            discoveryOptions: resolution.discoveryOptions,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            role: 'assistant',
            text: localEvaluation,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            userIntent: resolution.userIntent,
            reactionSupportClassification: resolution.reactionSupportClassification,
            aiProviderStatus: 'deterministic_fallback',
            matchedCompounds: resolution.matchedCompounds,
            matchedReaction: resolution.matchedReaction,
            suggestedReactions: resolution.suggestedReactions,
            discoveryOptions: resolution.discoveryOptions,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          text: resolution.replyMarkdown,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          userIntent: resolution.userIntent,
          reactionSupportClassification: resolution.reactionSupportClassification,
          aiProviderStatus: 'deterministic_fallback',
          matchedCompounds: resolution.matchedCompounds,
          matchedReaction: resolution.matchedReaction,
          suggestedReactions: resolution.suggestedReactions,
          discoveryOptions: resolution.discoveryOptions,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    await submitQueryText(input);
  };

  const handleUpdateMessageTakeaways = (msgId: string, takeaways: string, isOpen: boolean) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, keyTakeaways: takeaways, takeawaysOpen: isOpen } : m
      )
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col text-slate-100">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Unified AI Chemistry & Reaction Assistant
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">
              Natural-Language Q&A · Reaction Discovery · 854-Compound Canonical Registry · Direct Beaker Loading
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeReactionResult?.structuredStatus && (
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
              {activeReactionResult.structuredStatus}
            </span>
          )}
          <button
            type="button"
            onClick={() => submitQueryText('Explain what will happen with the current beaker contents')}
            className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900/70 px-2.5 py-1 rounded-full border border-cyan-800/60 transition-colors cursor-pointer"
          >
            Analyze Current Beaker
          </button>
        </div>
      </div>

      {/* Live Experiment State Context Bar */}
      <div className="px-5 py-2 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Beaker Context:</span>
          </span>
          {selectedIngredients.length === 0 ? (
            <span className="text-slate-500 italic">Empty Beaker (0 reagents selected)</span>
          ) : (
            selectedIngredients.map((ing, idx) => (
              <span
                key={`${ing.id}-${idx}`}
                className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono text-[10px] border border-slate-700"
              >
                {ing.formula} ({ing.amount})
              </span>
            ))
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <span>T: {conditions.temperature}°C</span>
          <span>•</span>
          <span>C: {conditions.concentration.toFixed(1)} M</span>
          {conditions.catalystId && (
            <>
              <span>•</span>
              <span className="text-amber-300">
                Cat: {getReagentDisplayInfo(conditions.catalystId).formula}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Optional Reaction Discovery Shortcuts Bar (Replaces separate ReactionDiscoveryPanel) */}
      <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/70 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="font-bold text-indigo-300 flex items-center gap-1 mr-1">
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          <span>Discover Reactions (Optional Shortcuts):</span>
        </span>
        {DISCOVERY_SHORTCUTS.map((sc) => (
          <button
            key={sc.label}
            type="button"
            onClick={() => submitQueryText(sc.query)}
            className="px-2.5 py-1 rounded-full bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-800/60 font-medium transition-colors cursor-pointer"
          >
            {sc.label}
          </button>
        ))}
      </div>

      {/* Live Action Confirmation Banner */}
      {actionBanner && (
        <div className="px-5 py-2 bg-emerald-950/80 border-b border-emerald-800/70 flex items-center justify-between gap-2 text-[11px] text-emerald-200">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{actionBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className="text-[10px] text-emerald-400 hover:text-emerald-200 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={chatScrollRef}
        className="p-4 sm:p-5 space-y-4 max-h-[460px] overflow-y-auto bg-slate-900/60 text-xs"
      >
        {messages.map((m, idx) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}
          >
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 px-1">
              <span>{m.role === 'user' ? 'You' : 'AI Chemistry Assistant'}</span>
              <span>•</span>
              <span>{m.time}</span>
              {m.role === 'assistant' && m.aiProviderStatus && (
                <>
                  <span>•</span>
                  <span className="text-slate-400 font-mono">
                    {m.aiProviderStatus === 'live_ai'
                      ? 'Live Gemini AI + Canonical Registry'
                      : 'Verified Registry & Reaction Engine'}
                  </span>
                </>
              )}
            </div>

            <div
              className={`p-3.5 rounded-2xl max-w-3xl leading-relaxed ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-xs'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-xs shadow-xs w-full'
              }`}
            >
              {/* Support Classification Badge */}
              {m.role === 'assistant' && m.reactionSupportClassification && (
                <div className="mb-2.5 flex flex-wrap items-center gap-2">
                  {renderSupportBadge(m.reactionSupportClassification)}
                </div>
              )}

              <FormattedAiMessage
                text={m.text}
                variant={m.role === 'user' ? 'user' : 'dark'}
              />

              {/* Structured Interactive Reaction Option Cards (for Reaction Discovery & Validated Simulator Reactions) */}
              {m.role === 'assistant' &&
                m.discoveryOptions &&
                m.discoveryOptions.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                        Verified 3D Simulator Reaction Cards ({m.discoveryOptions.length})
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Click to load reactants directly into the 3D Beaker
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {m.discoveryOptions.map((opt) => (
                        <div
                          key={opt.id}
                          className="p-3 rounded-xl border border-slate-800 bg-slate-900/90 hover:border-indigo-500/60 transition-all flex flex-col justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-bold text-white leading-snug">
                                {opt.name}
                              </h4>
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/70 shrink-0">
                                {opt.reactionType.replace('_', ' ')}
                              </span>
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                              {opt.expectedVisualEffects.producesGas && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60">
                                  <Wind className="w-2.5 h-2.5" />
                                  {opt.expectedVisualEffects.gasName || 'Gas Evolution'}
                                </span>
                              )}
                              {opt.expectedVisualEffects.producesPrecipitate && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
                                  <Droplets className="w-2.5 h-2.5" />
                                  Precipitate
                                </span>
                              )}
                              {opt.expectedVisualEffects.temperatureDelta !== 0 && (
                                <span
                                  className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                    opt.expectedVisualEffects.temperatureDelta > 0
                                      ? 'bg-amber-950 text-amber-300 border-amber-800/60'
                                      : 'bg-cyan-950 text-cyan-300 border-cyan-800/60'
                                  }`}
                                >
                                  <Flame className="w-2.5 h-2.5" />
                                  {opt.expectedVisualEffects.temperatureDelta > 0
                                    ? `+${opt.expectedVisualEffects.temperatureDelta}°C`
                                    : `${opt.expectedVisualEffects.temperatureDelta}°C`}
                                </span>
                              )}
                            </div>

                            <div className="mt-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-[10px] text-emerald-300 overflow-x-auto">
                              {opt.balancedEquation}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-1">
                              <span className="text-[9px] font-semibold text-slate-400">
                                Reactants:
                              </span>
                              {opt.reactants.map((r, rIdx) => (
                                <span
                                  key={`${opt.id}-${r.id}-${rIdx}`}
                                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700"
                                >
                                  {r.name} ({r.formula}) • {r.amount} {r.unit}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                            {onLoadReactionToExperiment && (
                              <button
                                type="button"
                                onClick={() => handleSafeLoadReactionOption(opt)}
                                className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                <FlaskConical className="w-3 h-3" />
                                <span>Load Reaction into Experiment</span>
                              </button>
                            )}
                            {onRunReaction && (
                              <button
                                type="button"
                                onClick={() => handleSafeRunReaction(undefined, opt)}
                                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold transition-colors cursor-pointer"
                                title="Load reactants and immediately run the 3D simulation"
                              >
                                <Play className="w-3 h-3" />
                                <span>Run</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Interactive Lab Action Buttons for Matched Compounds / Supported Reactions */}
              {m.role === 'assistant' &&
                ((m.matchedCompounds && m.matchedCompounds.length > 0) ||
                  m.matchedReaction) && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                    {m.matchedCompounds?.slice(0, 6).map((comp) =>
                      comp.isRestricted ? (
                        <span
                          key={comp.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/70 text-rose-300 border border-rose-800/60 text-[10px] font-semibold"
                          title={
                            comp.restrictionReason ||
                            'Restricted hazardous or radioactive compound — cannot be loaded into beaker'
                          }
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>{comp.name}: Restricted (Blocked)</span>
                        </span>
                      ) : (
                        onAddCompound && (
                          <button
                            key={comp.id}
                            type="button"
                            onClick={() => handleSafeAddCompound(comp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>
                              Add {comp.name} ({comp.formula}) to Beaker
                            </span>
                          </button>
                        )
                      )
                    )}

                    {onLoadReactionToExperiment && m.matchedReaction && (
                      <button
                        type="button"
                        onClick={() => handleSafeLoadReactionDef(m.matchedReaction!)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/60 text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        <FlaskConical className="w-3 h-3" />
                        <span>Load {m.matchedReaction.name} into Beaker</span>
                      </button>
                    )}

                    {onRunReaction && m.matchedReaction && (
                      <button
                        type="button"
                        onClick={() => handleSafeRunReaction(m.matchedReaction)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 border border-amber-700/60 text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>Run Supported Reaction</span>
                      </button>
                    )}
                  </div>
                )}

              {m.role !== 'user' && (
                <AiKeyTakeawaysPanel
                  messageId={m.id}
                  question={findPrecedingUserQuestion(messages, idx)}
                  answer={m.text}
                  modelTitle="Chemical Reaction Laboratory"
                  subject="Chemistry"
                  showTakeawaysButton={isEligibleForKeyTakeaways(m, idx)}
                  context={{
                    title: 'Chemical Reaction Laboratory',
                    subject: 'Chemistry',
                    parameters: {
                      temperature: `${conditions.temperature}°C`,
                      concentration: `${conditions.concentration.toFixed(1)} M`,
                      catalyst: conditions.catalystId || 'None',
                    },
                  }}
                  variant="dark"
                  cachedTakeaways={m.keyTakeaways}
                  cachedIsOpen={m.takeawaysOpen}
                  onUpdateCache={(takeaways, isOpen) =>
                    handleUpdateMessageTakeaways(m.id, takeaways, isOpen)
                  }
                />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 italic py-1 px-2">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Evaluating canonical registry, stoichiometry & reaction mechanisms...</span>
          </div>
        )}
      </div>

      {/* Optional Example Questions Bar */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="shrink-0 font-medium text-slate-500">Try asking:</span>
        {EXAMPLE_QUESTIONS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => submitQueryText(p)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 whitespace-nowrap transition-colors cursor-pointer border border-slate-700/50"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Unified Input Form */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Ask any chemistry question, predict a reaction (e.g., "Pb(NO3)2 + KI", "Oxalic acid + KMnO4"), or discover reactions...'
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask Chemistry AI</span>
        </button>
      </form>
    </div>
  );
};
