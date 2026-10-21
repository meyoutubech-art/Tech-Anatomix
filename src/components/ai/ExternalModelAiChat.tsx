import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  RotateCcw,
  MessageSquare,
  HelpCircle,
  BookOpen,
  Lightbulb,
  AlertCircle,
  User,
  ArrowRight,
} from 'lucide-react';
import { FormattedAiMessage } from '../common/FormattedAiMessage';
import { AiKeyTakeawaysPanel } from '../common/AiKeyTakeawaysPanel';
import {
  isEligibleForKeyTakeaways,
  findPrecedingUserQuestion,
} from '../../utils/keyTakeawaysService';
import { aiSpeechManager } from '../../utils/aiSpeechService';

export interface ExternalModelChatContext {
  modelId: string;
  title: string;
  subject?: string;
  concept?: string;
  description?: string;
  parts?: Array<{ id: string; name: string; description?: string }>;
  equations?: string[];
  examConnection?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
  keyTakeaways?: string;
  takeawaysOpen?: boolean;
}

interface ExternalModelAiChatProps {
  context: ExternalModelChatContext;
  className?: string;
  heightClass?: string;
}

// Global memory cache to retain conversations across viewer rerenders and tab switching
const conversationCache: Record<string, Message[]> = {};

export const ExternalModelAiChat: React.FC<ExternalModelAiChatProps> = ({
  context,
  className = '',
  heightClass = 'h-[520px] sm:h-[580px] lg:h-[640px]',
}) => {
  const modelKey = context.modelId || 'external-model';

  // Generate model-specific welcome introduction
  const getWelcomeMessage = (): Message => {
    const id = modelKey.toLowerCase();
    const title = context.title || '3D Model';
    let welcomeDesc = 'Ask me anything about this 3D model, its components, functions, or the science behind it.';

    if (id.includes('heart')) {
      welcomeDesc = 'Ask me anything about cardiac hemodynamics, ventricular pumping cycles, atrioventricular valve mechanics, or coronary circulation.';
    } else if (id.includes('respiratory')) {
      welcomeDesc = 'Ask me anything about pulmonary ventilation, bronchial arborization, alveolar O₂/CO₂ diffusion gradients, or diaphragm mechanics.';
    } else if (id.includes('digestive')) {
      welcomeDesc = 'Ask me anything about peristalsis, gastric enzymatic hydrolysis, intestinal villi absorption, or accessory organ function.';
    } else if (id.includes('brain')) {
      welcomeDesc = 'Ask me anything about cerebral cortical lobes, cerebellar motor coordination, brainstem vital reflex centers, or limbic structures.';
    } else if (id.includes('frog')) {
      welcomeDesc = 'Ask me anything about amphibian visceral anatomy, the 3-chambered heart hemodynamics, cutaneous respiration, or dissection steps.';
    } else if (id.includes('human')) {
      welcomeDesc = 'Ask me anything about human organ systems, mediastinal topography, thoracic and abdominal viscera, or systemic physiology.';
    }

    return {
      id: `welcome-${modelKey}-${Date.now()}`,
      role: 'assistant',
      text: `Hello! I am your **AI Learning Assistant** for **${title}**.\n\n${welcomeDesc}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  // State initialization with persistence check
  const [messages, setMessages] = useState<Message[]>(() => {
    if (conversationCache[modelKey] && conversationCache[modelKey].length > 0) {
      return conversationCache[modelKey];
    }
    return [getWelcomeMessage()];
  });

  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync with cache when model changes
  useEffect(() => {
    aiSpeechManager.stop();
    if (conversationCache[modelKey] && conversationCache[modelKey].length > 0) {
      setMessages(conversationCache[modelKey]);
    } else {
      const welcome = getWelcomeMessage();
      setMessages([welcome]);
      conversationCache[modelKey] = [welcome];
    }
    setErrorMessage(null);
  }, [modelKey]);

  // Keep cache in sync whenever messages update
  useEffect(() => {
    if (messages.length > 0) {
      conversationCache[modelKey] = messages;
    }
  }, [messages, modelKey]);

  // Scroll ONLY the internal chat container on new messages without scrolling the browser window
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Suggested questions based on the active model
  const getSuggestedQuestions = (): string[] => {
    const id = modelKey.toLowerCase();
    if (id.includes('heart')) {
      return [
        'Explain this model.',
        'Explain the important components.',
        'How does cardiac hemodynamics work?',
        'What is the scientific principle of valves?',
        'Give me exam notes.',
      ];
    }
    if (id.includes('respiratory')) {
      return [
        'Explain this model.',
        'Explain the important components.',
        'How does alveolar gas exchange work?',
        'What is Boyle’s Law in breathing?',
        'Give me exam notes.',
      ];
    }
    if (id.includes('digestive')) {
      return [
        'Explain this model.',
        'Explain the important components.',
        'How does peristalsis move food chyme?',
        'What is enzymatic hydrolysis in the gut?',
        'Give me exam notes.',
      ];
    }
    if (id.includes('brain')) {
      return [
        'Explain this model.',
        'Explain the important components.',
        'How does signal transmission work?',
        'What do the cerebral lobes do?',
        'Give me exam notes.',
      ];
    }
    if (id.includes('frog')) {
      return [
        'Explain this model.',
        'Explain the important components.',
        'How does the 3-chambered heart work?',
        'What is cutaneous respiration?',
        'Give me exam notes.',
      ];
    }
    return [
      'Explain this model.',
      'Explain the important components.',
      'How does this system work?',
      'What is the scientific principle?',
      'Give me exam notes.',
    ];
  };

  // High-fidelity local educational response generator (for offline mode or API fallback)
  const generateOfflineScientificAnswer = (q: string): string => {
    const lower = q.toLowerCase();
    const id = modelKey.toLowerCase();
    const title = context.title || '3D Model';

    // 1. Exam notes query
    if (lower.includes('exam') || lower.includes('notes') || lower.includes('revision') || lower.includes('summary')) {
      if (id.includes('heart')) {
        return `### 🫀 Key Exam Notes: Cardiovascular System\n\n1. **Dual Circulation:**\n   - **Pulmonary Circuit:** Right Ventricle ➔ Pulmonary Artery (deoxygenated) ➔ Lungs ➔ Pulmonary Veins (oxygenated) ➔ Left Atrium.\n   - **Systemic Circuit:** Left Ventricle ➔ Aorta (oxygenated) ➔ Body Tissues ➔ Vena Cava (deoxygenated) ➔ Right Atrium.\n\n2. **Valvular Mechanics:**\n   - **Atrioventricular (AV):** Tricuspid (right) and Bicuspid/Mitral (left) prevent backflow into atria during ventricular systole.\n   - **Semilunar (SL):** Aortic and Pulmonary valves prevent backflow from arteries during ventricular diastole.\n\n3. **Cardiac Hemodynamics Formula:**\n   $$\\text{Cardiac Output (CO)} = \\text{Heart Rate (HR)} \\times \\text{Stroke Volume (SV)}$$\n   - Standard adult values: $72\\text{ BPM} \\times 70\\text{ mL} \\approx 5.0\\text{ L/min}$.\n\n4. **Important Exam Point:** Human venous blood is dark maroon/crimson, never blue. Blue color-coding is purely an educational schematic convention.`;
      }
      if (id.includes('respiratory')) {
        return `### 🫁 Key Exam Notes: Respiratory System\n\n1. **Ventilation Mechanics (Boyle's Law: $P_1 V_1 = P_2 V_2$):**\n   - **Inhalation:** Diaphragm contracts (moves downward), external intercostals pull rib cage outward $\\rightarrow$ thoracic volume increases $\\rightarrow$ intrapulmonary pressure drops below atmospheric $\\rightarrow$ air rushes into lungs.\n   - **Exhalation:** Passive elastic recoil of lungs and diaphragm relaxation $\\rightarrow$ volume decreases $\\rightarrow$ pressure rises $\\rightarrow$ air forced out.\n\n2. **Branching Arborization:**\n   - Trachea $\\rightarrow$ Primary Bronchi (Right has 3 secondary, Left has 2) $\\rightarrow$ Bronchioles $\\rightarrow$ Terminal Bronchioles $\\rightarrow$ Alveolar Ducts $\\rightarrow$ Alveoli.\n\n3. **Fick's First Law of Diffusion across Respiratory Membrane:**\n   $$\\frac{dQ}{dt} = -D \\cdot A \\cdot \\frac{\\Delta P}{\\Delta x}$$\n   - Massive alveolar surface area ($70\\text{ m}^2$) and ultra-thin membrane ($0.5\\ \\mu\\text{m}$) maximize gas diffusion velocity.`;
      }
      if (id.includes('digestive')) {
        return `### 🥣 Key Exam Notes: Gastrointestinal System\n\n1. **Sequential Alimentary Pathway:**\n   - Mouth (salivary amylase) $\\rightarrow$ Pharynx $\\rightarrow$ Esophagus (peristalsis) $\\rightarrow$ Stomach (HCl, pepsin, pH 1.5–2.0) $\\rightarrow$ Small Intestine (duodenum, jejunum, ileum) $\\rightarrow$ Large Intestine (cecum, colon, rectum) $\\rightarrow$ Anus.\n\n2. **Enzymatic Digestion Summary:**\n   - **Proteins:** Pepsin (stomach), Trypsin/Chymotrypsin (pancreas), Peptidases (brush border).\n   - **Carbohydrates:** Salivary/Pancreatic Amylase, Maltase/Sucrase/Lactase.\n   - **Lipids:** Bile salts (emulsification in liver/gallbladder) + Pancreatic Lipase.\n\n3. **Absorption Surface Enhancement:**\n   - Circular folds (Plicae circulares) $\\rightarrow$ Villi $\\rightarrow$ Microvilli increase functional absorptive area by $600\\times$ (approx. $30\\text{ m}^2$).`;
      }
      if (id.includes('brain')) {
        return `### 🧠 Key Exam Notes: Central Nervous System\n\n1. **Cerebral Cortex Lobes:**\n   - **Frontal Lobe:** Executive control, planning, motor cortex, Broca's motor speech.\n   - **Parietal Lobe:** Somatosensory cortex (touch, pressure, temperature, pain, spatial awareness).\n   - **Temporal Lobe:** Auditory cortex, language comprehension (Wernicke's), memory integration (hippocampus).\n   - **Occipital Lobe:** Primary visual cortex (Brodmann area 17).\n\n2. **Subcortical & Infratentorial Structures:**\n   - **Cerebellum:** Fine motor coordination, balance, procedural motor memory, vestibular integration.\n   - **Brainstem (Midbrain, Pons, Medulla):** Autonomic cardiac rate, respiratory rhythmicity, vasomotor tone, and cranial nerve nuclei.`;
      }
      if (id.includes('frog')) {
        return `### 🐸 Key Exam Notes: Amphibian Anatomy & Physiology\n\n1. **Three-Chambered Heart Hemodynamics:**\n   - Two atria (Right receives deox systemic blood, Left receives ox pulmonary/cutaneous blood) + One common ventricle.\n   - Trabeculae carnae and spiral valve (spiral fold) in conus arteriosus separate oxygenated and deoxygenated streams with minimal mixing.\n\n2. **Dual Respiratory Pathways:**\n   - **Pulmonary:** Positive-pressure buccal pumping forces air into saccular lungs.\n   - **Cutaneous:** Highly vascularized moist dermis facilitates transcutaneous $\\text{O}_2$ and $\\text{CO}_2$ diffusion, functioning both terrestrial and submerged.\n\n3. **Urogenital System:**\n   - Mesonephric kidneys drain through ureters into the cloaca; cloaca serves as shared termination for digestive, urinary, and reproductive systems.`;
      }
      return `### 📚 Key Exam Notes: ${title}\n\n1. **Core Concept:** ${context.concept || 'Foundational principles of this 3D anatomical structure.'}\n2. **Working Mechanism:** ${context.description || 'Systemic physiological operation.'}\n3. **Key Components:** Refer to the 3D model parts list and interactive annotations.\n4. **Exam Tip:** Focus on structure-function relationships and the underlying physical or biological principles.`;
    }

    // 2. Components explanation
    if (lower.includes('component') || lower.includes('part') || lower.includes('structure') || lower.includes('organ')) {
      if (context.parts && context.parts.length > 0) {
        const partsList = context.parts
          .slice(0, 6)
          .map((p) => `- **${p.name}:** ${p.description || 'Key structural component visible in the 3D viewer.'}`)
          .join('\n');
        return `### 🔍 Important Components of ${title}\n\nHere are the primary components represented in this 3D model:\n\n${partsList}\n\nYou can interact directly with the 3D viewer on the right to rotate, zoom, and inspect these structures in detail!`;
      }
      return `### 🔍 Important Components of ${title}\n\nThis 3D model features the complete anatomical and functional assemblies of the **${title}**. Use the interactive 3D viewer on the right to orbit the camera, zoom into micro-structures, and select annotations to examine specific anatomical landmarks.`;
    }

    // 3. How does it work / principle
    if (lower.includes('work') || lower.includes('principle') || lower.includes('how does') || lower.includes('function')) {
      if (context.description || context.concept) {
        return `### ⚙️ Scientific Principle & Mechanism: ${title}\n\n**${context.concept || title}**\n\n${context.description || 'This structure coordinates physiological processes through specialized biological assemblies.'}\n\n${context.equations && context.equations.length > 0 ? `**Governing Equation:**\n$$${context.equations[0]}$$\n\n` : ''}In the 3D viewer on the right, you can see how each individual component fits into the complete organ system to produce continuous, coordinated biological function.`;
      }
    }

    // 4. General explain this model
    return `### 🔬 ${title} Overview\n\n**${title}** provides a high-fidelity 3D interactive learning environment designed for deep structural and physiological comprehension.\n\n- **Subject:** ${context.subject || 'Biological Anatomy & Physiology'}\n- **Core Focus:** ${context.concept || 'Morphology, function, and scientific mechanisms'}\n\n**What to observe in the 3D viewer on the right:**\n1. Orbit around the specimen with click-and-drag to inspect spatial relationships from all angles.\n2. Zoom in with your scroll wheel to reveal detailed surface topography and annotations.\n3. Observe the internal assemblies to understand how each anatomical component contributes to overall function.\n\nFeel free to ask specific questions about any organ, tissue, or physiological mechanism!`;
  };

  // Submit question handler
  const handleSendMessage = async (textToSend?: string) => {
    const rawQuestion = textToSend !== undefined ? textToSend : inputQuestion;
    const cleanQuestion = rawQuestion.trim();
    if (!cleanQuestion || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: cleanQuestion,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputQuestion('');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Build conversation history for real AI endpoint
      const conversationHistory = newMessages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      // Call project real AI endpoint
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: cleanQuestion,
          message: cleanQuestion,
          modelTitle: context.title,
          subject: context.subject || 'Biology & Anatomy',
          context: {
            modelId: context.modelId,
            title: context.title,
            subject: context.subject || 'Biology & Anatomy',
            concept: context.concept,
            description: context.description,
            parts: context.parts,
            equations: context.equations,
            examConnection: context.examConnection,
          },
          conversationHistory,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiText =
          data.answer ||
          data.reply ||
          data.response ||
          data.text ||
          generateOfflineScientificAnswer(cleanQuestion);
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: aiText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        // Fall back gracefully to local scientific knowledge engine so students never experience broken UI
        const fallbackText = generateOfflineScientificAnswer(cleanQuestion);
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: fallbackText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch {
      // Fall back smoothly to local scientific answer
      const fallbackText = generateOfflineScientificAnswer(cleanQuestion);
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: fallbackText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
      // Re-focus composer
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  // Reset conversation to fresh state
  const handleResetConversation = () => {
    aiSpeechManager.stop();
    const welcome = getWelcomeMessage();
    setMessages([welcome]);
    conversationCache[modelKey] = [welcome];
    setErrorMessage(null);
  };

  // Persist generated key takeaways in message history and cache
  const handleUpdateMessageTakeaways = (msgId: string, takeaways: string, isOpen: boolean) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, keyTakeaways: takeaways, takeawaysOpen: isOpen } : m
      )
    );
  };

  // Handle Enter key submit (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = getSuggestedQuestions();

  return (
    <div
      className={`flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-slate-100 ${heightClass} ${className}`}
    >
      {/* =========================================================================
          A. COMPACT HEADER
          ========================================================================= */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-900/30 shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                AI Learning Assistant
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Sparkles className="w-2.5 h-2.5 text-sky-400" />
                <span>Synchronized</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {context.title}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetConversation}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-[11px] font-medium transition-colors cursor-pointer shrink-0"
          title="Start a new conversation"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* =========================================================================
          C. SUGGESTED QUESTIONS (Top Quick-Chips)
          ========================================================================= */}
      <div className="px-3.5 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0">
          <Lightbulb className="w-3 h-3 text-amber-400" />
          <span className="hidden sm:inline">Suggested:</span>
        </span>
        <div className="flex items-center gap-1.5">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage(q)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/70 text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer hover:border-sky-500/50 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          D. CONVERSATION AREA (Independent Vertical Scrolling)
          ========================================================================= */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-2 shadow-sm ${
                  isUser
                    ? 'bg-sky-600 text-white rounded-tr-xs'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-tl-xs'
                }`}
              >
                {/* Render Text with Markdown & Scientific notation */}
                <FormattedAiMessage
                  text={msg.text}
                  variant={isUser ? 'user' : 'dark'}
                />

                {!isUser && (
                  <AiKeyTakeawaysPanel
                    messageId={msg.id}
                    question={findPrecedingUserQuestion(messages, idx)}
                    answer={msg.text}
                    modelTitle={context.title}
                    subject={context.subject || 'Biology & Anatomy'}
                    context={context}
                    variant="dark"
                    showTakeawaysButton={isEligibleForKeyTakeaways(msg, idx)}
                    cachedTakeaways={msg.keyTakeaways}
                    cachedIsOpen={msg.takeawaysOpen}
                    onUpdateCache={(takeaways, isOpen) =>
                      handleUpdateMessageTakeaways(msg.id, takeaways, isOpen)
                    }
                  />
                )}

                <div
                  className={`text-[9px] font-mono text-right ${
                    isUser ? 'text-sky-200/80' : 'text-slate-500'
                  }`}
                >
                  {msg.time}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-xl bg-sky-700 border border-sky-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl px-4 py-3 rounded-tl-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs text-slate-400 ml-1">Analyzing 3D model physiology...</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => handleSendMessage()}
              className="text-xs font-bold text-rose-200 hover:text-white underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* =========================================================================
          E. MESSAGE COMPOSER
          ========================================================================= */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-end gap-2"
        >
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about this 3D model (Enter to send, Shift+Enter for new line)..."
              disabled={isLoading}
              className="w-full resize-none rounded-xl bg-slate-900 border border-slate-700/80 p-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="p-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-all shadow-md shadow-sky-900/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-slate-500">
          <span>Enter to send · Shift+Enter for line break</span>
          <span className="hidden sm:inline">Model Context Active</span>
        </div>
      </div>
    </div>
  );
};
