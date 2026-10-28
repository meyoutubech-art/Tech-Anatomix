import React, { useState, useEffect } from 'react';
import {
  CHEMISTRY_PLAY_EXPERIMENTS,
  ChemistryPlayExperiment,
  learnThroughPlayManager,
  LearnThroughPlayState,
} from '../../utils/learnThroughPlayEngine';
import { ReactionEvaluationResult } from '../../data/reactionsData';
import {
  Volume2,
  Play,
  CheckCircle2,
  Sparkles,
  Award,
  FlaskConical,
  HelpCircle,
} from 'lucide-react';

export interface ChemistryPlayMissionsBarProps {
  selectedIngredientIds: string[];
  hasRunReaction: boolean;
  evaluatedResult: ReactionEvaluationResult | null;
  onLoadAndRunExperiment: (reactants: string[], catalystId?: string | null) => void;
  onAddSingleReagent: (reagentId: string) => void;
}

export const ChemistryPlayMissionsBar: React.FC<ChemistryPlayMissionsBarProps> = ({
  selectedIngredientIds,
  hasRunReaction,
  evaluatedResult,
  onLoadAndRunExperiment,
  onAddSingleReagent,
}) => {
  const [playState, setPlayState] = useState<LearnThroughPlayState>(() =>
    learnThroughPlayManager.getState()
  );
  const [activeExpId, setActiveExpId] = useState<string>(CHEMISTRY_PLAY_EXPERIMENTS[0].id);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<{
    isCorrect: boolean;
    text: string;
  } | null>(null);

  useEffect(() => {
    return learnThroughPlayManager.subscribe(setPlayState);
  }, []);

  const activeExp: ChemistryPlayExperiment =
    CHEMISTRY_PLAY_EXPERIMENTS.find((e) => e.id === activeExpId) ||
    CHEMISTRY_PLAY_EXPERIMENTS[0];

  // Reset answer state when switching active experiment card
  useEffect(() => {
    setSelectedAnswerId(null);
    setAnswerFeedback(null);
  }, [activeExpId]);

  // Check if current beaker has all required reactants for the active challenge
  const hasAllRequiredReactants = activeExp.reactantIds.every((reqId) =>
    selectedIngredientIds.includes(reqId)
  );

  // Check if the user has run the reaction matching this experiment
  const isReactionObserved =
    hasRunReaction &&
    Boolean(
      evaluatedResult?.isSupported &&
        (evaluatedResult.reaction?.id === activeExp.expectedReactionId || hasAllRequiredReactants)
    );

  useEffect(() => {
    if (hasAllRequiredReactants) {
      learnThroughPlayManager.markStageCompleted(activeExp.id, 'try');
    }
    if (isReactionObserved) {
      learnThroughPlayManager.markStageCompleted(activeExp.id, 'observe');
      learnThroughPlayManager.markStageCompleted(activeExp.id, 'discover');
    }
  }, [hasAllRequiredReactants, isReactionObserved, activeExp.id]);

  const isMastered = Boolean(playState.discoveries[activeExp.id]);

  const handleSelectOption = (opt: ChemistryPlayExperiment['applyOptions'][number]) => {
    setSelectedAnswerId(opt.id);
    setAnswerFeedback({ isCorrect: opt.isCorrect, text: opt.feedback });
    learnThroughPlayManager.recordChallengeAttempt(activeExp.id, opt.isCorrect);

    if (opt.isCorrect) {
      learnThroughPlayManager.markStageCompleted(activeExp.id, 'apply');
      learnThroughPlayManager.recordDiscovery({
        id: activeExp.id,
        domain: 'chemistry',
        title: activeExp.title,
        symbol: activeExp.symbol,
        scientificPrinciple: activeExp.discoverPrinciple,
        formulaOrRule: evaluatedResult?.balancedEquation || activeExp.shortVisualLabel,
        accuracyPct: 100,
      });
      learnThroughPlayManager.speakInstruction(
        `${activeExp.id}-correct`,
        `${opt.feedback} ${activeExp.discoverPrinciple}`,
        true
      );
    } else {
      learnThroughPlayManager.speakInstruction(`${activeExp.id}-retry`, opt.feedback, true);
    }
  };

  return (
    <div
      id="chemistry-learn-through-play-bar"
      data-testid="chemistry-learn-through-play-bar"
      className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4"
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-base">
            🧪
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Learn Through Play · Guided 3D Reaction Missions
              </h2>
              {isMastered && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Reaction Mastered</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Pick a visual reaction mission below — tap reagents or click{' '}
              <strong className="text-slate-700">Watch &amp; Run in 3D Beaker</strong> to see and hear real chemistry!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              learnThroughPlayManager.speakInstruction(
                `${activeExp.id}-guide`,
                activeExp.spokenGuide,
                true
              )
            }
            data-testid="chemistry-play-speak-button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-sky-600" />
            <span>🔊 Listen Guide</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onLoadAndRunExperiment(activeExp.reactantIds, activeExp.catalystId);
              learnThroughPlayManager.speakInstruction(
                `${activeExp.id}-autorun`,
                `${activeExp.title}. Pouring ${activeExp.reactantVisualPills
                  .map((p) => p.name)
                  .join(' and ')} into the 3D beaker now! ${activeExp.observeVisualCue}`,
                true
              );
            }}
            data-testid="chemistry-play-autorun-button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>👁️ Watch &amp; Run in 3D Beaker</span>
          </button>
        </div>
      </div>

      {/* 4 Visual Experiment Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {CHEMISTRY_PLAY_EXPERIMENTS.map((exp) => {
          const isSelected = exp.id === activeExp.id;
          const expMastered = Boolean(playState.discoveries[exp.id]);
          return (
            <button
              key={exp.id}
              type="button"
              onClick={() => setActiveExpId(exp.id)}
              data-testid={`chem-mission-card-${exp.id}`}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-base">{exp.symbol}</span>
                {expMastered ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </span>
                ) : (
                  <span
                    className={`text-[10px] font-mono ${
                      isSelected ? 'text-emerald-300' : 'text-slate-500'
                    }`}
                  >
                    Playable
                  </span>
                )}
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold leading-snug">{exp.title}</div>
                <div
                  className={`text-[10px] font-mono mt-1 truncate ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {exp.shortVisualLabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Mission Visual Step-by-Step + Interactive Apply Check */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
        {/* Left: Visual Recipe & SEE -> TRY -> OBSERVE Steps */}
        <div className="lg:col-span-7 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              ✋ Visual Recipe (Click each bottle to pour into 3D beaker)
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {hasAllRequiredReactants
                ? isReactionObserved
                  ? '✅ Reaction Observed in Beaker'
                  : '✅ Reagents in Beaker — Click Run Reaction!'
                : 'Tap bottles below to add'}
            </span>
          </div>

          {/* Interactive Visual Bottle Buttons for Non-Readers */}
          <div className="flex flex-wrap items-center gap-2">
            {activeExp.reactantVisualPills.map((pill, idx) => {
              const isAdded = selectedIngredientIds.includes(pill.id);
              return (
                <React.Fragment key={pill.id}>
                  {idx > 0 && <span className="text-sm font-bold text-slate-400">+</span>}
                  <button
                    type="button"
                    onClick={() => onAddSingleReagent(pill.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isAdded
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                        : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-900 shadow-2xs'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                      style={{ backgroundColor: pill.color }}
                    />
                    <span>{pill.stateSymbol}</span>
                    <span className="font-mono">{pill.formula}</span>
                    <span className="text-[10px] font-normal text-slate-500">({pill.name})</span>
                    {isAdded && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="font-bold text-slate-800 block">1. SEE</span>
              <span className="text-slate-600">{activeExp.seeVisualCue}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="font-bold text-slate-800 block">2. TRY</span>
              <span className="text-slate-600">{activeExp.tryVisualCue}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="font-bold text-slate-800 block">3. OBSERVE</span>
              <span className="text-slate-600">{activeExp.observeVisualCue}</span>
            </div>
          </div>
        </div>

        {/* Right: DISCOVER & APPLY Interactive Check */}
        <div className="lg:col-span-5 p-3.5 rounded-xl bg-slate-900 text-white flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>4. DISCOVER &amp; 5. APPLY CHALLENGE</span>
            </span>
            <p className="text-xs font-bold text-white">{activeExp.applyQuestion}</p>
          </div>

          <div className="space-y-1.5">
            {activeExp.applyOptions.map((opt) => {
              const isChosen = selectedAnswerId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  data-testid={`chem-apply-option-${opt.id}`}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isChosen
                      ? opt.isCorrect
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                        : 'bg-rose-950 border-rose-500 text-rose-200'
                      : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{opt.symbol}</span>
                    <span>{opt.label}</span>
                  </div>
                  {isChosen && opt.isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {answerFeedback && (
            <div
              className={`p-2 rounded-lg text-[11px] font-medium border ${
                answerFeedback.isCorrect
                  ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
                  : 'bg-amber-950/90 border-amber-700 text-amber-200'
              }`}
            >
              {answerFeedback.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
