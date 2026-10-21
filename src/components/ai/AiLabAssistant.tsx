import React, { useState } from 'react';
import { Bot, Send, Sparkles, User, Lightbulb } from 'lucide-react';
import { classifyAiError } from '../../utils/aiErrorClassifier';
import { FormattedAiMessage } from '../common/FormattedAiMessage';
import { AiKeyTakeawaysPanel } from '../common/AiKeyTakeawaysPanel';
import {
  isEligibleForKeyTakeaways,
  findPrecedingUserQuestion,
} from '../../utils/keyTakeawaysService';

interface AiLabAssistantProps {
  context: {
    subject: string;
    title: string;
    parameters: Record<string, any>;
    results: Record<string, any>;
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

export const AiLabAssistant: React.FC<AiLabAssistantProps> = ({ context }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Hello! I am VIZLAB AI. I am monitoring your active **${context.title}** (${context.subject}) simulation. Ask me anything about why these physical or biological phenomena occur or what happens when you adjust the parameters!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    `Why is this happening in ${context.title}?`,
    `What parameter change would have the greatest impact?`,
    `Explain the governing scientific equations.`,
  ];

  const handleSend = async (questionText: string) => {
    const textToSend = questionText.trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      role: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: '⚡ **Offline Mode Active**: The AI Assistant requires an active network connection to connect with Gemini. You can explore all 76 verified 3D science models in the Virtual Labs while offline.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

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
        const errorMsg = classifyAiError(res.status);
        setMessages((prev) => [
          ...prev,
          {
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
        role: 'assistant',
        text: data.answer || 'VIZLAB could not retrieve a response.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[560px] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500 text-white shadow-2xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">VIZLAB AI Lab Mentor</h3>
            <p className="text-[11px] text-slate-500">
              Synchronized with: <span className="font-semibold text-slate-800">{context.title}</span>
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
          Live Context
        </span>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {messages.map((m, idx) => (
          <div
            key={idx}
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
              {isEligibleForKeyTakeaways(m, idx) && (
                <AiKeyTakeawaysPanel
                  messageId={m.id || `msg-${idx}`}
                  question={findPrecedingUserQuestion(messages, idx)}
                  answer={m.text}
                  modelTitle={context.title}
                  subject={context.subject}
                  context={context}
                  variant="light"
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
            <span>Analyzing scientific model and synthesizing explanation...</span>
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
          placeholder={`Ask about ${context.title}...`}
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
