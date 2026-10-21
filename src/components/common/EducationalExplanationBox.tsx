import React from 'react';
import {
  BookOpen,
  Zap,
  Lightbulb,
  HelpCircle,
  GraduationCap,
  Sparkles,
  ArrowRightLeft,
  X,
  Compass,
} from 'lucide-react';
import { FormattedAiMessage } from './FormattedAiMessage';
import { convertLatexFragmentToUnicode } from '../../utils/scientificTextFormatter';

export interface ExplanationData {
  title: string;
  badge?: string;
  subtitle?: string;
  whatIsIt?: string;
  structure?: string;
  howDoesItWork?: string;
  whatDoesItDo?: string;
  whyIsItImportant?: string;
  realLifeExample?: string;
  observation?: string;
  whyTitle?: string;
  whyExplanation?: string;
  examConnection?: string;
  formula?: string;
  onClearSelection?: () => void;
  selectionType?: 'part' | 'concept' | 'parameter' | 'reaction';
}

interface EducationalExplanationBoxProps {
  data: ExplanationData;
  className?: string;
}

export const EducationalExplanationBox: React.FC<EducationalExplanationBoxProps> = ({
  data,
  className = '',
}) => {
  const {
    title,
    badge = 'Concept Overview',
    subtitle,
    whatIsIt,
    structure,
    howDoesItWork,
    whatDoesItDo,
    whyIsItImportant,
    realLifeExample,
    observation,
    whyTitle = 'WHY DID THIS HAPPEN?',
    whyExplanation,
    examConnection,
    formula,
    onClearSelection,
  } = data;

  const mechanismText = whatDoesItDo || howDoesItWork;
  const mechanismLabel = whatDoesItDo ? 'WHAT DOES IT DO?' : 'HOW DOES IT WORK?';

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 transition-all text-slate-700 ${className}`}
    >
      {/* Header with Title and Badges */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-slate-900 truncate">
                {title}
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                {badge}
              </span>
            </div>
            {subtitle && (
              <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {onClearSelection && (
          <button
            onClick={onClearSelection}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer shrink-0"
            title="View full concept overview"
          >
            <span>Overview</span>
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Grid of Modular Educational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
        {/* 1. WHAT IS IT? */}
        {whatIsIt && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-700 uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
              <span>What is it?</span>
            </div>
            <p className="text-slate-600 leading-relaxed pt-0.5">{whatIsIt}</p>
          </div>
        )}

        {/* 2. STRUCTURE */}
        {structure && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-700 uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-teal-600" />
              <span>Structure</span>
            </div>
            <p className="text-slate-600 leading-relaxed pt-0.5">{structure}</p>
          </div>
        )}

        {/* 3. HOW DOES IT WORK? / WHAT DOES IT DO? */}
        {mechanismText && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>{mechanismLabel}</span>
            </div>
            <p className="text-slate-600 leading-relaxed pt-0.5">{mechanismText}</p>
          </div>
        )}

        {/* 4. WHY IS IT IMPORTANT? */}
        {whyIsItImportant && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Why is it important?</span>
            </div>
            <p className="text-slate-600 leading-relaxed pt-0.5">{whyIsItImportant}</p>
          </div>
        )}

        {/* 5. REAL-LIFE EXAMPLE */}
        {realLifeExample && (
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/50 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span>Real-Life Application</span>
            </div>
            <p className="text-amber-950 leading-relaxed pt-0.5">{realLifeExample}</p>
          </div>
        )}

        {/* 4. REAL-TIME PARAMETER OUTCOME & CAUSAL ANALYSIS (Prominent Top Grid Block) */}
        {(observation || whyExplanation) && (
          <div className="md:col-span-2 p-4 rounded-xl bg-gradient-to-r from-sky-50 via-indigo-50/50 to-emerald-50/50 border-2 border-sky-300/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-600"></span>
                </span>
                <span className="text-xs font-bold text-sky-900 uppercase tracking-wider">
                  ⚡ Live Parameter Outcome &amp; Scientific Causality
                </span>
              </div>
              <span className="text-[10px] font-semibold bg-sky-600 text-white px-2 py-0.5 rounded-full">
                Real-Time Simulation Response
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {observation && (
                <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-sky-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-800 uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>Direct Outcome Observed:</span>
                  </div>
                  <div className="text-slate-800 font-medium leading-relaxed">
                    <FormattedAiMessage text={observation} variant="light" />
                  </div>
                </div>
              )}

              {whyExplanation && (
                <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-emerald-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 uppercase">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Scientific Cause (Why):</span>
                  </div>
                  <div className="text-slate-800 leading-relaxed">
                    <FormattedAiMessage text={whyExplanation} variant="light" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. EXAM CONNECTION (if available) */}
        {examConnection && (
          <div className="md:col-span-2 p-3.5 rounded-xl bg-violet-50/60 border border-violet-200/50 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-violet-800 uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5 text-violet-600" />
              <span>Exam Connection</span>
            </div>
            <p className="text-violet-950 leading-relaxed pt-0.5">{examConnection}</p>
          </div>
        )}

        {/* 6. GOVERNING FORMULA (if available) */}
        {formula && (
          <div className="md:col-span-2 p-3 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Governing Law:</span>
            </div>
            <div className="font-mono text-xs text-sky-300 font-bold tracking-wide">
              {convertLatexFragmentToUnicode(formula.replace(/^\$+|\$+$/g, ''))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
