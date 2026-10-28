import React from 'react';
import { ShieldCheck, CheckCircle2, Zap, FlaskConical, Dna, Cpu, Activity, Volume2, Eye, Sparkles } from 'lucide-react';
import { PageRoute } from '../components/layout/Navbar';
import { aiSpeechManager } from '../utils/aiSpeechService';

interface AboutPageProps {
  onNavigate: (route: PageRoute) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md">
            <span>Tech-Anatomix • Dissect Your Cell!</span>
          </div>
          <button
            type="button"
            onClick={() =>
              aiSpeechManager.play(
                'about-page-overview',
                'Welcome to Tech-Anatomix. Every model and virtual laboratory lets you learn science through playing, watching visual demonstrations, adjusting physical sliders, mixing real chemical reagents, and listening to spoken explanations.'
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>🔊 Listen Overview</span>
          </button>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Tech-Anatomix: Dissect Your Cell!
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Tech-Anatomix is an interactive 3D virtual science and anatomy laboratory engineered for learners of every age and literacy level to explore surgical specimen dissection, verified chemical reactions, and fundamental physical kinematics through direct play and visual discovery.
        </p>
      </div>

      {/* Learn Through Play & Universal Accessibility */}
      <div
        data-testid="about-learn-through-play"
        className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4 shadow-md"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Learn Through Play · Universal Visual & Audio Accessibility</span>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/10 text-indigo-200">
            SEE → TRY → OBSERVE → DISCOVER → APPLY → MASTER
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Every 3D simulation, chemistry bench experiment, and anatomy specimen integrates an interactive 6-stage discovery cycle. Learners who cannot read fluently can click <strong>👁️ Watch &amp; Try Demo</strong> to observe animated parameter demonstrations and <strong>🔊 Listen</strong> for natural spoken guidance.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
          {[
            { icon: '👁️', stage: '1. SEE', desc: 'Visual phenomenon' },
            { icon: '🖐️', stage: '2. TRY', desc: 'Direct 3D action' },
            { icon: '🔍', stage: '3. OBSERVE', desc: 'Cause & effect' },
            { icon: '💡', stage: '4. DISCOVER', desc: 'Unlock law' },
            { icon: '🎯', stage: '5. APPLY', desc: 'Solve target' },
            { icon: '🏆', stage: '6. MASTER', desc: 'Real mastery' },
          ].map((item) => (
            <div key={item.stage} className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 text-center">
              <div className="text-base">{item.icon}</div>
              <div className="text-[11px] font-bold text-white mt-0.5">{item.stage}</div>
              <div className="text-[10px] text-slate-400">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Philosophy & Anti-Mockup Guarantee */}
      <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200/80 space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>The Tech-Anatomix Anti-Mockup Scientific Standard</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          In typical educational software, 3D models are often superficial decorative graphics or canned pre-rendered animations. Tech-Anatomix was built from the ground up on the principle of <strong>computational and anatomical truth</strong>:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <span className="font-semibold text-slate-900 block">Deterministic Math Engines</span>
            <p className="text-slate-500">
              Projectile trajectories integrate drag quadratically in real time. Pendulums calculate exact non-linear restoring force. Electric circuits follow Ohm's and Joule's laws strictly.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <span className="font-semibold text-slate-900 block">Verified Reaction Models</span>
            <p className="text-slate-500">
              Reactions are bound to verified aqueous chemical stoichiometry. Precipitates, color shifts, and gas bubbles reflect real thermodynamic and kinetic properties.
            </p>
          </div>
        </div>
      </div>

      {/* Laboratory Modules Overview */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Virtual Laboratory Modules</h2>

        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-slate-200 bg-white flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Physics Laboratory</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Features real-time 3D projectile motion with vacuum and atmospheric drag options, large-angle simple pendulum harmonic oscillation, and direct current circuits with knife switch and incandescent tungsten filament glow.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-white flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Chemistry Laboratory</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Contains an interactive reagent pouring shelf, 500 mL Pyrex beaker with fluid physics, effervescent bubbles, and precipitate formation alongside an interactive 3D Molecular Structure Explorer with atom raycasting.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-white flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 shrink-0">
              <Dna className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Biology Laboratory</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Curated 3D eukaryotic animal cell with selectable organelles, beating 4-chambered human heart with directional blood flow particles, and Watson-Crick B-DNA double helix with complementary base-pairing mechanisms.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-white flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Frog Anatomy Laboratory & Surgical Dissection</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full virtual surgical suite featuring Frog cervical neck mouse rotation dissection unlocking coelomic cavity exposure and visceral organ inspection (three-chambered heart, sacculated lungs, trilobed liver, stomach, kidneys, and cloaca) with interactive anatomical dossiers.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-500">Ready to begin your scientific journey?</span>
        <button
          onClick={() => onNavigate('physics')}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
        >
          Enter Virtual Lab →
        </button>
      </div>
    </div>
  );
};
