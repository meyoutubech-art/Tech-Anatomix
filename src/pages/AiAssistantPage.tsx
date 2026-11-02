import React from 'react';
import { AiLabAssistant } from '../components/ai/AiLabAssistant';
import { Sparkles, Globe, Code, Calculator, BookOpen, MessageSquare } from 'lucide-react';

export const AiAssistantPage: React.FC = () => {
  const capabilities = [
    {
      icon: Globe,
      title: 'General Knowledge & Current Topics',
      description: 'History, geography, culture, philosophy, current concepts, and everyday questions.',
      color: 'text-sky-600 bg-sky-50',
    },
    {
      icon: Code,
      title: 'Coding & Software Engineering',
      description: 'Write, debug, and explain code in Python, JavaScript, TypeScript, C++, HTML/CSS, and SQL.',
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      icon: Calculator,
      title: 'Mathematics & Logical Reasoning',
      description: 'Step-by-step algebra, calculus, statistics, puzzles, and quantitative problem-solving.',
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      icon: BookOpen,
      title: 'Writing, Study & Science',
      description: 'Essays, summaries, translations, exam preparation, and deep STEM explanations.',
      color: 'text-amber-600 bg-amber-50',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Universal AI Chat
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Everything-Aware Conversational Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">AI Lab Assistant</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-8">
          <AiLabAssistant />
        </div>

        <div className="md:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Everything-Aware AI
              </h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <p>
                Ask <strong className="text-slate-900">any question on any subject</strong>—just like ChatGPT and Gemini.
              </p>
              <p>
                This assistant is not restricted to a single 3D model or science topic. It remembers your conversation context and adapts to whatever you want to learn, build, or solve.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                What You Can Ask:
              </span>
              <div className="space-y-2">
                {capabilities.map((cap) => {
                  const Icon = cap.icon;
                  return (
                    <div
                      key={cap.title}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5"
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${cap.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-900">{cap.title}</div>
                        <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                          {cap.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
