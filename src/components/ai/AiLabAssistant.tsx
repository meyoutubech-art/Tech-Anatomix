import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, Lightbulb, RotateCcw } from 'lucide-react';
import { classifyAiError } from '../../utils/aiErrorClassifier';
import { FormattedAiMessage } from '../common/FormattedAiMessage';
import { AiKeyTakeawaysPanel } from '../common/AiKeyTakeawaysPanel';
import {
  isEligibleForKeyTakeaways,
  findPrecedingUserQuestion,
} from '../../utils/keyTakeawaysService';

interface AiLabAssistantProps {
  context?: {
    subject?: string;
    title?: string;
    parameters?: Record<string, any>;
    results?: Record<string, any>;
  };
}

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
  keyTakeaways?: string;
  takeawaysOpen?: boolean;
}

const INITIAL_WELCOME_MESSAGE =
  'Hello! I am your **Universal AI Assistant** (powered by Gemini). Ask me anything on any topic—coding, mathematics, writing, history, general knowledge, everyday problem-solving, or science!';

export const AiLabAssistant: React.FC<AiLabAssistantProps> = ({ context }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-universal',
      role: 'assistant',
      text: INITIAL_WELCOME_MESSAGE,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    'Explain how artificial intelligence and neural networks work',
    'Write a clean Python function to solve the Fibonacci sequence',
    'Help me plan a productive daily study and workout schedule',
    'What are the most important events in world history?',
    'Explain quantum entanglement in simple everyday terms',
  ];

  useEffect(() => {
    if (messages.length <= 1 && !loading) return;
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages.length, loading]);

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        text: INITIAL_WELCOME_MESSAGE,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInput('');
  };

  const handleSend = async (questionText: string) => {
    const textToSend = questionText.trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setMessages((prev) => [
        ...prev,
        {
          id: `offline-${Date.now()}`,
          role: 'assistant',
          text: '⚡ **Offline Mode Active**: The Universal AI Assistant requires an active internet connection to communicate with Gemini. Please reconnect to ask any question.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    setLoading(true);

    try {
      const conversationHistory = updatedHistory
        .filter((m) => m.id !== 'welcome-universal' && !m.id?.startsWith('welcome-'))
        .slice(-12)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          mode: 'universal',
          modelTitle: 'Universal AI Assistant',
          subject: 'General',
          history: conversationHistory,
          context: {
            ...(context || {}),
            isUniversalChat: true,
            mode: 'universal',
            history: conversationHistory,
          },
        }),
      });

      if (!res.ok) {
        const errorMsg = classifyAiError(res.status);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            text: errorMsg,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
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
        text: data.answer || 'Could not retrieve a response. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: classifyAiError(err),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[600px] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500 text-white shadow-2xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Universal AI Assistant</h3>
            <p className="text-[11px] text-slate-500">
              Everything-aware conversational AI · Ask about any topic
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetChat}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Start a new chat"
          >
            <RotateCcw className="w-3 h-3" />
            <span>New Chat</span>
          </button>
          <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
            All-Domain AI
          </span>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {messages.map((m, idx) => (
          <div
            key={m.id || idx}
            className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                m.role === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'bg-sky-100 text-sky-800'
              }`}
            >
              {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div
              className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 border border-slate-200/80 text-slate-700'
              }`}
            >
              <FormattedAiMessage
                text={m.text}
                variant={m.role === 'user' ? 'user' : 'light'}
              />
              {m.role !== 'user' && (
                <AiKeyTakeawaysPanel
                  messageId={m.id || `msg-${idx}`}
                  question={findPrecedingUserQuestion(messages, idx)}
                  answer={m.text}
                  modelTitle="Universal AI Assistant"
                  subject="General"
                  context={{ isUniversalChat: true }}
                  variant="light"
                  showTakeawaysButton={isEligibleForKeyTakeaways(m, idx)}
                  cachedTakeaways={m.keyTakeaways}
                  cachedIsOpen={m.takeawaysOpen}
                  onUpdateCache={(takeaways, isOpen) => {
                    setMessages((prev) =>
                      prev.map((item, i) =>
                        i === idx
                          ? { ...item, keyTakeaways: takeaways, takeawaysOpen: isOpen }
                          : item
                      )
                    );
                  }}
                />
              )}
              <div
                className={`text-[9px] mt-1.5 ${
                  m.role === 'user' ? 'text-slate-400 text-right' : 'text-slate-400'
                }`}
              >
                {m.time}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-sky-500" />
            <span>Thinking and generating response...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Questions */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/30 flex items-center gap-1.5 overflow-x-auto">
        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        {suggestedQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 border-t border-slate-100 flex gap-2"
      >
        <input
          type="text"
          placeholder="Ask me anything — coding, math, writing, general knowledge, or science..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
