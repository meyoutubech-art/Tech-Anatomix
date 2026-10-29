import React, { useState } from 'react';
import { AiLabAssistant } from '../components/ai/AiLabAssistant';
import { BookOpen, Zap, FlaskConical, Dna } from 'lucide-react';

export const AiAssistantPage: React.FC = () => {
  const [subjectContext, setSubjectContext] = useState<'Physics' | 'Chemistry' | 'Biology'>('Physics');

  const contextMap = {
    Physics: {
      subject: 'Physics',
      title: 'Kinematics & Harmonic Oscillations',
      parameters: { velocity: '25 m/s', angle: '45°', length: '1.5m', gravity: '9.81 m/s²' },
      results: { flightTime: '3.61s', range: '63.7m', period: '2.46s' },
    },
    Chemistry: {
      subject: 'Chemistry',
      title: 'Aqueous Stoichiometry & Chemical Kinetics',
      parameters: { temperature: '25°C', concentration: '1.0 M', catalyst: false },
      results: { pH: '7.0', deltaH: '-57.3 kJ/mol', reactionType: 'Exothermic Neutralization' },
    },
    Biology: {
      subject: 'Biology',
      title: 'Cellular Ultrastructure & Molecular Genetics',
      parameters: { organelle: 'Mitochondrion', basePair: 'Adenine-Thymine', bpm: '72' },
      results: { atpYield: '32 ATP/glucose', hydrogenBonds: '2 H-bonds' },
    },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">Lab Mentor</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Context-Aware Scientific Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">VIZLAB AI Assistant</h1>
        </div>

        {/* Subject Context Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setSubjectContext('Physics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subjectContext === 'Physics'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-sky-600" />
            <span>Physics</span>
          </button>
          <button
            onClick={() => setSubjectContext('Chemistry')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subjectContext === 'Chemistry'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
            <span>Chemistry</span>
          </button>
          <button
            onClick={() => setSubjectContext('Biology')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subjectContext === 'Biology'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Dna className="w-3.5 h-3.5 text-rose-600" />
            <span>Biology</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-8">
          <AiLabAssistant context={contextMap[subjectContext]} />
        </div>

        <div className="md:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                About VIZLAB AI
              </h3>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Unlike generic chat assistants, <strong className="text-slate-900">VIZLAB AI</strong> never executes hallucinated scripts.
              </p>
              <p>
                It is bound to the exact numeric and physical conditions active inside your 3D laboratory scene, explaining concepts using verified formulas.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Current Synced State:
              </span>
              <div className="space-y-1 font-mono text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                {Object.entries(contextMap[subjectContext].parameters).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-400 capitalize">{k}:</span>
                    <span className="font-semibold text-slate-900">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
