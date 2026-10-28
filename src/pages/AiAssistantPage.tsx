import React, { useState, useEffect } from 'react';
import { AiLabAssistant } from '../components/ai/AiLabAssistant';
import { learnThroughPlayManager, LearnThroughPlayState } from '../utils/learnThroughPlayEngine';
import { BookOpen, Zap, FlaskConical, Dna, Volume2, Award } from 'lucide-react';

export const AiAssistantPage: React.FC = () => {
  const [subjectContext, setSubjectContext] = useState<'Physics' | 'Chemistry' | 'Biology'>('Physics');
  const [playState, setPlayState] = useState<LearnThroughPlayState>(() =>
    learnThroughPlayManager.getState()
  );

  useEffect(() => {
    return learnThroughPlayManager.subscribe(setPlayState);
  }, []);

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

  const discoveriesList = Object.values(playState.discoveries);

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
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              learnThroughPlayManager.speakInstruction(
                'ai-lab-mentor-intro',
                `AI Lab Assistant synced to ${subjectContext}. Ask any question or tap the speaker button on any response to hear it read aloud!`,
                true
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-sky-600" />
            <span>🔊 Listen Guide</span>
          </button>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
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
                It is bound to the exact numeric and physical conditions active inside your 3D laboratory scene, explaining concepts using verified formulas and spoken voice synthesis.
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

          {/* Unlocked Scientific Discoveries Log */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Your Unlocked Discoveries ({discoveriesList.length})
                </h3>
              </div>
            </div>
            {discoveriesList.length === 0 ? (
              <p className="text-xs text-slate-400 leading-relaxed">
                Experiment with models in Physics, Chemistry, Biology, or Anatomy to unlock verified scientific discoveries!
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {discoveriesList.slice(0, 8).map((d) => (
                  <div
                    key={d.id}
                    className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>
                        {d.symbol} {d.title}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          learnThroughPlayManager.speakInstruction(
                            `disc-${d.id}`,
                            `${d.title}. ${d.scientificPrinciple}`,
                            true
                          )
                        }
                        className="text-sky-400 hover:text-sky-300 cursor-pointer"
                        title="Speak discovery aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">{d.scientificPrinciple}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

