import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Lightbulb,
  MessageSquare,
  ChevronDown,
  Check,
  HelpCircle,
  Flame,
  Zap,
  Heart,
  Dna,
  FlaskConical,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { classifyAiError } from '../../utils/aiErrorClassifier';
import { FormattedAiMessage } from '../common/FormattedAiMessage';
import { AiKeyTakeawaysPanel } from '../common/AiKeyTakeawaysPanel';
import {
  isEligibleForKeyTakeaways,
  findPrecedingUserQuestion,
} from '../../utils/keyTakeawaysService';

export interface ModelChatContext {
  modelId: string;
  title: string;
  subject: string;
  concept?: string;
  description?: string;
  components?: Array<{
    id: string;
    name: string;
    whatIsIt?: string;
    whatDoesItDo?: string;
    description?: string;
    realLifeExample?: string;
  }>;
  selectedComponent?: {
    id: string;
    name: string;
    whatIsIt?: string;
    whatDoesItDo?: string;
    description?: string;
    realLifeExample?: string;
  } | null;
  parameters?: Record<string, any>;
  results?: Record<string, any>;
  measurements?: Record<string, any>;
  recentChange?: {
    parameter: string;
    oldValue: any;
    newValue: any;
    observation?: string;
    why?: string;
  } | null;
  activeReaction?: any;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
  highlightedComponent?: string;
  keyTakeaways?: string;
  takeawaysOpen?: boolean;
}

interface ModelAwareChatbotProps {
  context: ModelChatContext;
  className?: string;
  onUpdateParameter?: (paramId: string, value: number) => void;
  onUpdateCondition?: (conditionId: string, value: any) => void;
  parameterSchema?: Record<string, any>;
  conditionSchema?: Record<string, any>;
}

// Generate initial welcome message tailored to specific model
function createInitialMessage(context: ModelChatContext): Message {
  const modelId = (context.modelId || '').toLowerCase();
  let roleTitle = 'AI Lab Mentor';
  let samplePrompt = 'how this mechanism functions, why specific components exist, or what happens when you adjust parameters!';

  if (modelId.includes('motor')) {
    roleTitle = '⚡ Electromagnetic Machines Mentor';
    samplePrompt = 'Lorentz force (F = I L × B), split-ring commutator action, armature torque, or Fleming’s Left-Hand Rule!';
  } else if (modelId.includes('heart')) {
    roleTitle = '🫀 Cardiovascular Physiology Mentor';
    samplePrompt = 'ventricular hemodynamics, aortic valve pressures, coronary circulation, or cardiac output (CO = HR × SV)!';
  } else if (modelId.includes('dna')) {
    roleTitle = '🧬 Molecular Genetics Mentor';
    samplePrompt = 'Watson-Crick base pairing (A=T, G≡C), antiparallel backbones, major/minor grooves, or Chargaff’s rules!';
  } else if (modelId.includes('cell')) {
    roleTitle = '🔬 Eukaryotic Cytology Mentor';
    samplePrompt = 'mitochondrial ATP synthesis, nuclear chromatin, endoplasmic reticulum, or Golgi vesicular trafficking!';
  } else if (modelId.includes('projectile')) {
    roleTitle = '🎯 Kinematics & Ballistics Mentor';
    samplePrompt = 'launch velocity vectors, maximum apex height, vacuum range (R = v² sin(2θ)/g), or gravity influence!';
  } else if (modelId.includes('pendulum')) {
    roleTitle = '⏱️ Simple Harmonic Motion Mentor';
    samplePrompt = 'time period calculation (T = 2π√(L/g)), restoring gravity torque, or energy exchange between kinetic and potential!';
  } else if (modelId.includes('circuit')) {
    roleTitle = '💡 Electronic Circuits Mentor';
    samplePrompt = "Ohm’s Law (V = IR), Joule filament heating (P = I²R), or switch transient states!";
  } else if (modelId.includes('reaction') || modelId.includes('chem')) {
    roleTitle = '🧪 Reaction Kinetics Mentor';
    samplePrompt = 'collision theory, Arrhenius activation barrier (Ea), stoichiometry, or violent runaway reactions!';
  } else if (modelId.includes('microscope')) {
    roleTitle = '🔬 Optical Microscopy Mentor';
    samplePrompt = 'magnification factors (Total = Objective × Eyepiece), focal plane adjustment, numerical aperture, or Abbe condenser lighting!';
  }

  return {
    id: `welcome-${context.modelId}-${Date.now()}`,
    role: 'assistant',
    text: `Hello! I am your dedicated **${roleTitle}** synchronized with **${context.title}** (${context.subject}).\n\nAsk me anything about ${samplePrompt}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

// Ultra-fast instant local scientific answer engine
function getInstantLocalAnswer(question: string, context: ModelChatContext): string | null {
  const q = question.toLowerCase().trim();
  const selected = context.selectedComponent;
  const p = context.parameters || {};

  if (selected) {
    if (q.includes('what') && (q.includes('do') || q.includes('function') || q.includes('role'))) {
      return `**${selected.name}** operates as an essential functional part in **${context.title}**.\n\n` +
        `• **Primary Function**: ${selected.whatDoesItDo || selected.description || 'Contributes directly to system kinematics.'}\n` +
        `• **Physical Definition**: ${selected.whatIsIt || selected.name}\n` +
        (selected.realLifeExample ? `• **Real-World Application**: ${selected.realLifeExample}` : '');
    }
    if (q.includes('why') && (q.includes('essential') || q.includes('need') || q.includes('important'))) {
      return `The **${selected.name}** is indispensable in **${context.title}** because without it, the physical chain of operation cannot complete.\n\n` +
        `${selected.whatDoesItDo || selected.description || ''}\n\n` +
        (selected.realLifeExample ? `*Real-Life Example*: ${selected.realLifeExample}` : '');
    }
  }

  if (q.includes('how') && q.includes('work')) {
    return `**${context.title}** operates under fundamental scientific principles (${context.concept || context.subject}):\n\n` +
      `1. **System Overview**: ${context.description || 'The components work together in coordinated physical equilibrium.'}\n` +
      `2. **Key Physical Variables**: Current state has active parameters: ${Object.entries(p).map(([k, v]) => `\`${k}: ${v}\``).join(', ') || 'Standard baseline'}.\n` +
      `3. **Continuous Response**: Adjusting any slider immediately updates the real-time 3D simulation!`;
  }

  if (q.includes('principle') || q.includes('law')) {
    return `The core scientific principle governing **${context.title}** is **${context.concept || 'Conservation and Equilibrium Laws'}**.\n\n` +
      `All dynamic forces, energy transfers, and chemical bonds in this 3D model adhere to deterministic mathematical formulas.`;
  }

  if (q.includes('exam') || q.includes('test') || q.includes('remember')) {
    return `🎯 **Key Takeaways for Your Exams on ${context.title}**:\n\n` +
      `• **Core Definition**: ${context.description?.slice(0, 150) || context.title}...\n` +
      `• **Component Identification**: Be prepared to identify each labeled part and state its direct role.\n` +
      `• **Variable Relationships**: Note how changing one parameter (like doubling voltage, string length, or temperature) proportionally changes the outcome.`;
  }

  if (q.includes('real life') || q.includes('everyday')) {
    return `🌍 **Everyday Real-World Applications of ${context.title}**:\n\n` +
      `This exact principle is used in modern engineering, healthcare, and industrial tech, including consumer appliances, vehicles, scientific laboratory diagnostics, and biological metabolic systems.`;
  }

  return null;
}

// Model-specific parameter command handler
function tryHandleParameterUpdate(
  text: string,
  context: ModelChatContext,
  parameterSchema?: Record<string, any>,
  conditionSchema?: Record<string, any>,
  onUpdateParameter?: (paramId: string, value: number) => void,
  onUpdateCondition?: (conditionId: string, value: any) => void
): string | null {
  const q = text.toLowerCase().trim();
  const params = parameterSchema || {};
  const conds = conditionSchema || {};
  const paramEntries = Object.entries(params);

  // 1. Reset parameters
  if (q.includes('reset') && (q.includes('param') || q.includes('default') || q.includes('slider') || q.includes('all'))) {
    if (onUpdateParameter) {
      paramEntries.forEach(([id, p]) => {
        onUpdateParameter(id, p.defaultValue);
      });
    }
    return `🔄 Reset all simulation parameters to standard default values for **${context.title}**.`;
  }

  // 2. Check for supported parameter modifications
  for (const [pId, p] of paramEntries) {
    const pName = p.name.toLowerCase();
    const pUnit = (p.unit || '').toLowerCase();

    if (q.includes(pName) || q.includes(pId) || (pUnit.length > 1 && q.includes(pUnit))) {
      // Look for a number in the query
      const match = q.match(/([-+]?[0-9]*\.?[0-9]+)/);
      if (match) {
        let targetVal = parseFloat(match[1]);
        if (q.includes('double')) {
          targetVal = (context.parameters?.[pId] ?? p.defaultValue) * 2;
        } else if (q.includes('half')) {
          targetVal = (context.parameters?.[pId] ?? p.defaultValue) / 2;
        }
        const clampedVal = Math.max(p.min, Math.min(p.max, targetVal));
        if (onUpdateParameter) {
          onUpdateParameter(pId, clampedVal);
        }
        return `✅ Updated **${p.name}** to **${clampedVal} ${p.unit || ''}** (operational range: ${p.min}–${p.max} ${p.unit || ''}). The 3D model simulation and physical equations have updated in real time.`;
      }

      if (q.includes('increase') || q.includes('raise') || q.includes('higher') || q.includes('more')) {
        const cur = context.parameters?.[pId] ?? p.defaultValue;
        const stepVal = p.step ? p.step * 2 : (p.max - p.min) / 10;
        const nextVal = Math.min(p.max, Number((cur + stepVal).toFixed(2)));
        if (onUpdateParameter) {
          onUpdateParameter(pId, nextVal);
        }
        return `✅ Increased **${p.name}** to **${nextVal} ${p.unit || ''}**.`;
      }

      if (q.includes('decrease') || q.includes('lower') || q.includes('reduce') || q.includes('less')) {
        const cur = context.parameters?.[pId] ?? p.defaultValue;
        const stepVal = p.step ? p.step * 2 : (p.max - p.min) / 10;
        const nextVal = Math.max(p.min, Number((cur - stepVal).toFixed(2)));
        if (onUpdateParameter) {
          onUpdateParameter(pId, nextVal);
        }
        return `✅ Decreased **${p.name}** to **${nextVal} ${p.unit || ''}**.`;
      }
    }
  }

  // 3. Check for condition modifications
  const condEntries = Object.entries(conds);
  for (const [cId, c] of condEntries) {
    const cName = c.name.toLowerCase();
    if (q.includes(cName) || q.includes(cId)) {
      if (c.type === 'boolean') {
        const turnOn = q.includes('on') || q.includes('enable') || q.includes('true') || q.includes('activate');
        const turnOff = q.includes('off') || q.includes('disable') || q.includes('false') || q.includes('deactivate');
        const nextBool = turnOn ? true : turnOff ? false : !(context.parameters?.[cId]);
        if (onUpdateCondition) {
          onUpdateCondition(cId, nextBool);
        }
        return `✅ Toggled **${c.name}** condition to **${nextBool ? 'ENABLED' : 'DISABLED'}**.`;
      }
    }
  }

  // 4. Check if user is asking to change an UNSUPPORTED parameter
  const commonParams = ['temperature', 'pressure', 'voltage', 'resistance', 'friction', 'gravity', 'mass', 'angle', 'length', 'frequency', 'speed', 'concentration', 'current'];
  const hasAdjustIntent = q.includes('change') || q.includes('set') || q.includes('adjust') || q.includes('increase') || q.includes('decrease') || q.includes('make') || q.includes('turn');

  if (hasAdjustIntent) {
    for (const commonP of commonParams) {
      if (q.includes(commonP)) {
        const isSupported = paramEntries.some(([id, p]) => p.name.toLowerCase().includes(commonP) || id.toLowerCase().includes(commonP));
        if (!isSupported) {
          const supportedList = paramEntries.map(([, p]) => `• **${p.name}** (${p.min} to ${p.max} ${p.unit || ''})`).join('\n');
          return `⚠️ **${commonP.charAt(0).toUpperCase() + commonP.slice(1)}** is not a parameter supported by **${context.title}**.\n\nSupported parameters for this active model are:\n${supportedList || '• Standard baseline geometry'}`;
        }
      }
    }
  }

  return null;
}

export const ModelAwareChatbot: React.FC<ModelAwareChatbotProps> = ({
  context,
  className = '',
  onUpdateParameter,
  onUpdateCondition,
  parameterSchema,
  conditionSchema,
}) => {
  // Model-Isolated Chat History: stores conversation indexed by modelId
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const hasUserInteractedRef = useRef(false);

  const currentModelId = context.modelId || 'default-model';

  // Memoized initial welcome message that is stable per model
  const initialWelcome = useMemo(() => {
    return createInitialMessage(context);
  }, [context.modelId]);

  // Retrieve messages for current model
  const currentMessages = useMemo(() => {
    return conversations[currentModelId] || [initialWelcome];
  }, [conversations, currentModelId, initialWelcome]);

  // Scroll ONLY the internal chat container when user sends/receives messages, NEVER when scrolling page or mounting
  useEffect(() => {
    if (!hasUserInteractedRef.current && currentMessages.length <= 1 && !loading) {
      return;
    }
    const container = chatScrollContainerRef.current;
    if (container && container.scrollHeight > container.clientHeight) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [currentMessages.length, loading]);

  // Dynamic suggestions tailored to current model & selected component
  const dynamicSuggestions = useMemo(() => {
    const list: string[] = [];

    if (context.selectedComponent) {
      list.push(`What does the ${context.selectedComponent.name} do?`);
      list.push(`Why is ${context.selectedComponent.name} essential here?`);
    } else {
      list.push(`How does ${context.title} work?`);
      list.push(`What is the core scientific principle?`);
    }

    if (context.recentChange) {
      list.push(`Why did ${context.recentChange.parameter} change the outcome?`);
    }

    const firstParamKey = Object.keys(context.parameters || {})[0];
    if (firstParamKey) {
      list.push(`What happens if I double the ${firstParamKey}?`);
    }

    list.push(`What should I remember for my exam?`);
    list.push(`Where is this used in real life?`);

    return list.slice(0, 4);
  }, [context.selectedComponent, context.title, context.recentChange, context.parameters]);

  const handleSend = async (questionText: string) => {
    const textToSend = questionText.trim();
    if (!textToSend || loading) return;

    hasUserInteractedRef.current = true;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      highlightedComponent: context.selectedComponent?.name,
    };

    // Immediate state update with user message
    const updatedMessages = [...currentMessages, userMsg];
    setConversations((prev) => ({
      ...prev,
      [currentModelId]: updatedMessages,
    }));
    setInput('');

    // Check parameter or condition commands
    const paramReply = tryHandleParameterUpdate(
      textToSend,
      context,
      parameterSchema,
      conditionSchema,
      onUpdateParameter,
      onUpdateCondition
    );
    if (paramReply) {
      const paramAiMsg: Message = {
        id: `ai-param-${Date.now()}`,
        role: 'assistant',
        text: paramReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setConversations((prev) => ({
        ...prev,
        [currentModelId]: [...updatedMessages, paramAiMsg],
      }));
      return;
    }

    // Check offline state before making network call
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const instantOffline = getInstantLocalAnswer(textToSend, context);
      const offlineMsg: Message = {
        id: `ai-off-${Date.now()}`,
        role: 'assistant',
        text:
          instantOffline ||
          `⚡ **Offline Mode Active**: AI chat requires an active internet connection to contact Gemini. All 3D rotations, zoom, component selection, labels, and physical parameters for **${context.title}** continue to work completely offline!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setConversations((prev) => ({
        ...prev,
        [currentModelId]: [...updatedMessages, offlineMsg],
      }));
      return;
    }

    // Call server API for deep model synthesis
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          modelTitle: context.title,
          subject: context.subject,
          context,
        }),
      });

      if (!res.ok) {
        const localFallback = getInstantLocalAnswer(textToSend, context);
        const errorMsg = localFallback || classifyAiError(res.status);
        const errAiMsg: Message = {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          text: errorMsg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setConversations((prev) => ({
          ...prev,
          [currentModelId]: [...updatedMessages, errAiMsg],
        }));
        return;
      }

      let data: any = {};
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch {
        data = {};
      }
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text:
          data.answer ||
          getInstantLocalAnswer(textToSend, context) ||
          `In **${context.title}**, all behavior is governed by deterministic scientific laws.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConversations((prev) => ({
        ...prev,
        [currentModelId]: [...updatedMessages, aiMsg],
      }));
    } catch (err: any) {
      const localFallback = getInstantLocalAnswer(textToSend, context);
      const errorMsg = localFallback || classifyAiError(err);
      const fallbackAiMsg: Message = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        text: errorMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setConversations((prev) => ({
        ...prev,
        [currentModelId]: [...updatedMessages, fallbackAiMsg],
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setConversations((prev) => ({
      ...prev,
      [currentModelId]: [createInitialMessage(context)],
    }));
  };

  const handleUpdateMessageTakeaways = (msgId: string, takeaways: string, isOpen: boolean) => {
    setConversations((prev) => {
      const list = prev[currentModelId] || currentMessages;
      return {
        ...prev,
        [currentModelId]: list.map((msg) =>
          msg.id === msgId ? { ...msg, keyTakeaways: takeaways, takeawaysOpen: isOpen } : msg
        ),
      };
    });
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden ${className}`}>
      {/* Header with Distinct Model Identity Badge */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Model-Aware AI Lab Mentor
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                {context.title}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Dedicated Chat Session · <span className="font-semibold text-slate-700">{context.subject}</span>
              {context.selectedComponent && (
                <span className="text-sky-700 font-semibold ml-1.5">
                  · Target: <strong>{context.selectedComponent.name}</strong>
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {context.selectedComponent && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold">
              <Check className="w-3 h-3" />
              <span>{context.selectedComponent.name}</span>
            </div>
          )}
          <button
            onClick={handleClearHistory}
            title="Reset conversation for this model"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Log */}
      <div ref={chatScrollContainerRef} className="p-4 overflow-y-auto space-y-3.5 max-h-[380px] min-h-[220px] bg-slate-50/30">
        {currentMessages.map((m, idx) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs shadow-2xs ${
                m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-sky-100 text-sky-800'
              }`}
            >
              {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-none'
                  : 'bg-white border border-slate-200/90 text-slate-700 shadow-2xs rounded-tl-none'
              }`}
            >
              <FormattedAiMessage
                text={m.text}
                variant={m.role === 'user' ? 'user' : 'light'}
              />
              {isEligibleForKeyTakeaways(m, idx) && (
                <AiKeyTakeawaysPanel
                  messageId={m.id}
                  question={findPrecedingUserQuestion(currentMessages, idx)}
                  answer={m.text}
                  modelTitle={context.title}
                  subject={context.subject}
                  context={context}
                  variant="light"
                  cachedTakeaways={m.keyTakeaways}
                  cachedIsOpen={m.takeawaysOpen}
                  onUpdateCache={(takeaways, isOpen) =>
                    handleUpdateMessageTakeaways(m.id, takeaways, isOpen)
                  }
                />
              )}
              <div
                className={`text-[9px] mt-2 font-mono ${
                  m.role === 'user' ? 'text-slate-400 text-right' : 'text-slate-400'
                }`}
              >
                {m.time}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic py-2 px-3 bg-sky-50/80 rounded-xl border border-sky-100 w-fit">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-sky-600" />
            <span>Analyzing model physics and synthesizing response...</span>
          </div>
        )}
      </div>

      {/* Suggestion Chips */}
      <div className="p-3 bg-white border-t border-slate-100 space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          <Lightbulb className="w-3 h-3 text-amber-500" />
          <span>Quick Questions for {context.title}:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {dynamicSuggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200/80 hover:border-sky-200 transition-colors cursor-pointer text-left font-medium"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            context.selectedComponent
              ? `Ask about ${context.selectedComponent.name}...`
              : `Ask anything about ${context.title}...`
          }
          className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

