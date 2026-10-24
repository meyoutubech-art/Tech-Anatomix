import React, { useState, useRef, useEffect } from 'react';
import {
  ReactionEvaluationResult,
  getReagentDisplayInfo,
} from '../../data/reactionsData';
import { ChemicalReagent, ReactionDefinition } from '../../types/chemistry';
import {
  resolveAiChemistryAssistantQuery,
} from '../../utils/aiChemistryAssistantResolver';
import {
  Bot,
  Send,
  Sparkles,
  FlaskConical,
  Plus,
  Play,
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
  matchedCompounds?: ChemicalReagent[];
  matchedReaction?: ReactionDefinition;
  suggestedReactions?: ReactionDefinition[];
}

interface ReactionAiChatbotProps {
  selectedIngredients: Array<{ id: string; amount: number; name: string; formula: string }>;
  conditions: {
    temperature: number;
    concentration: number;
    catalystId?: string | null;
  };
  activeReactionResult: ReactionEvaluationResult | null;
  onAddCompound?: (reagentId: string) => void;
  onLoadReactionToExperiment?: (reaction: ReactionDefinition) => void;
  onRunReaction?: () => void;
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
        '👋 Welcome! I am your **Chemistry Science Advisor & Reaction Assistant**.\n\n' +
        'I have full access to the complete **750+ compound canonical registry** across all 7 categories (Acids, Bases, Salts & Solutions, Metals, Oxidizers, Indicators, and Catalysts).\n\n' +
        '💡 *Try asking me:*\n' +
        '• *"What happens when HCl and NaOH are mixed?"*\n' +
        '• *"Tell me about Ziegler–Natta catalyst"* or *"What is Carbolic acid?"*\n' +
        '• *"Explain what will happen with the current beaker contents"*\n' +
        '• *"Fe + CuSO4"* or *"H2O2 with MnO2"*',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
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

    // For mutation guard, direct registry lookups, or offline mode, respond immediately with verified registry data
    if (
      resolution.queryType === 'mutation_guard' ||
      resolution.queryType === 'single_compound' ||
      resolution.queryType === 'multi_compound_reaction' ||
      resolution.queryType === 'ambiguous_compound' ||
      (typeof navigator !== 'undefined' && !navigator.onLine)
    ) {
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        text: resolution.replyMarkdown,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matchedCompounds: resolution.matchedCompounds,
        matchedReaction: resolution.matchedReaction,
        suggestedReactions: resolution.suggestedReactions,
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
              localChemistryNotes: localEvaluation,
            },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiText =
          data.answer && data.activeModel !== 'deterministic-offline'
            ? data.answer
            : localEvaluation;
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            role: 'assistant',
            text: aiText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            matchedCompounds: resolution.matchedCompounds,
            matchedReaction: resolution.matchedReaction,
            suggestedReactions: resolution.suggestedReactions,
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
            matchedCompounds: resolution.matchedCompounds,
            matchedReaction: resolution.matchedReaction,
            suggestedReactions: resolution.suggestedReactions,
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
          matchedCompounds: resolution.matchedCompounds,
          matchedReaction: resolution.matchedReaction,
          suggestedReactions: resolution.suggestedReactions,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMessageTakeaways = (msgId: string, takeaways: string, isOpen: boolean) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, keyTakeaways: takeaways, takeawaysOpen: isOpen } : m
      )
    );
  };

  const quickPrompts = [
    'Explain current reagents',
    'HCl + NaOH',
    'H2O2 with MnO2',
    'What is Ziegler-Natta catalyst?',
    'What is Ferroin?',
    'Laboratory safety guidelines',
  ];

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
                Reaction AI Lab Assistant (Educational Q&A)
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">
              Full Canonical Registry Lookup · Reaction Evaluation & Interactive Lab Actions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeReactionResult?.structuredStatus && (
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
              {activeReactionResult.structuredStatus}
            </span>
          )}
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
            Q&A Isolation Guard Active
          </span>
        </div>
      </div>

      {/* Live Experiment State Context Bar */}
      <div className="px-5 py-2 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Beaker Context:</span>
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

      {/* Messages Scroll Area */}
      <div
        ref={chatScrollRef}
        className="p-4 sm:p-5 space-y-3.5 max-h-[340px] overflow-y-auto bg-slate-900/60 text-xs"
      >
        {messages.map((m, idx) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 px-1">
              <span>{m.role === 'user' ? 'You' : 'AI Science Advisor'}</span>
              <span>•</span>
              <span>{m.time}</span>
            </div>
            <div
              className={`p-3.5 rounded-2xl max-w-xl leading-relaxed ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-xs'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-xs shadow-xs'
              }`}
            >
              <FormattedAiMessage
                text={m.text}
                variant={m.role === 'user' ? 'user' : 'dark'}
              />

              {/* Interactive Lab Action Buttons for Matched Compounds / Supported Reactions */}
              {m.role === 'assistant' &&
                ((m.matchedCompounds && m.matchedCompounds.some((c) => !c.isRestricted)) ||
                  m.matchedReaction) && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                    {onAddCompound &&
                      m.matchedCompounds
                        ?.filter((c) => !c.isRestricted)
                        .slice(0, 4)
                        .map((comp) => (
                          <button
                            key={comp.id}
                            type="button"
                            onClick={() => onAddCompound(comp.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add {comp.name} to Beaker</span>
                          </button>
                        ))}
                    {onLoadReactionToExperiment && m.matchedReaction && (
                      <button
                        type="button"
                        onClick={() => onLoadReactionToExperiment(m.matchedReaction!)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/60 text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        <FlaskConical className="w-3 h-3" />
                        <span>Load {m.matchedReaction.name} into Beaker</span>
                      </button>
                    )}
                    {onRunReaction && m.matchedReaction && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onLoadReactionToExperiment && m.matchedReaction) {
                            onLoadReactionToExperiment(m.matchedReaction);
                          }
                          setTimeout(() => onRunReaction(), 60);
                        }}
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
            <span>Synthesizing chemical mechanism & stoichiometry...</span>
          </div>
        )}
      </div>

      {/* Quick Prompt Questions */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="shrink-0 font-medium text-slate-500">Ask about:</span>
        {quickPrompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setInput(p);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 whitespace-nowrap transition-colors cursor-pointer border border-slate-700/50"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Ask about any compound or reaction (e.g., "HCl + NaOH", "What is Ziegler-Natta catalyst?", "Carbolic acid")...'
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </form>
    </div>
  );
};
