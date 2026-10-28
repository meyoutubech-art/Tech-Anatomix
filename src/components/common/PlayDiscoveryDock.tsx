import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ScientificModelSpec } from '../../types/aiModel';
import {
  learnThroughPlayManager,
  LearnThroughPlayState,
  buildModelPlayChallenge,
  LearningLoopStage,
} from '../../utils/learnThroughPlayEngine';
import {
  Eye,
  Hand,
  Search,
  Lightbulb,
  Target,
  Award,
  Volume2,
  Play,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export interface PlayDiscoveryDockProps {
  modelSpec: ScientificModelSpec;
  parameters: Record<string, number>;
  selectedPartId?: string | null;
  onUpdateParameter?: (id: string, value: number) => void;
  onSelectPartById?: (partId: string) => void;
  onResetChallenge?: () => void;
}

const LOOP_STAGES: {
  id: LearningLoopStage;
  symbol: string;
  shortLabel: string;
  nonReaderCue: string;
}[] = [
  { id: 'see', symbol: '👁️', shortLabel: '1. SEE', nonReaderCue: 'Watch 3D Motion' },
  { id: 'try', symbol: '✋', shortLabel: '2. TRY', nonReaderCue: 'Move Control' },
  { id: 'observe', symbol: '🔍', shortLabel: '3. OBSERVE', nonReaderCue: 'See Effect' },
  { id: 'discover', symbol: '💡', shortLabel: '4. DISCOVER', nonReaderCue: 'Why It Happens' },
  { id: 'apply', symbol: '🎯', shortLabel: '5. APPLY', nonReaderCue: 'Hit Target' },
  { id: 'master', symbol: '🏆', shortLabel: '6. MASTER', nonReaderCue: 'Mastered!' },
];

export const PlayDiscoveryDock: React.FC<PlayDiscoveryDockProps> = ({
  modelSpec,
  parameters,
  selectedPartId,
  onUpdateParameter,
  onSelectPartById,
  onResetChallenge,
}) => {
  const [playState, setPlayState] = useState<LearnThroughPlayState>(() =>
    learnThroughPlayManager.getState()
  );
  const [activeStage, setActiveStage] = useState<LearningLoopStage>('see');
  const [isAutoDemonstrating, setIsAutoDemonstrating] = useState(false);
  const [showVisualHint, setShowVisualHint] = useState(false);
  const [challengeFeedback, setChallengeFeedback] = useState<{
    type: 'success' | 'hint';
    text: string;
  } | null>(null);

  const demoTimerRef = useRef<number | null>(null);
  const initialParamSnapshotRef = useRef<Record<string, number>>({});

  useEffect(() => {
    return learnThroughPlayManager.subscribe(setPlayState);
  }, []);

  const challenge = useMemo(() => buildModelPlayChallenge(modelSpec), [modelSpec]);

  // Reset stage when switching models
  useEffect(() => {
    setActiveStage('see');
    setChallengeFeedback(null);
    setShowVisualHint(false);
    setIsAutoDemonstrating(false);
    if (demoTimerRef.current) {
      window.clearInterval(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    initialParamSnapshotRef.current = { ...parameters };
    learnThroughPlayManager.markStageCompleted(challenge.id, 'see');
  }, [modelSpec.id]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (demoTimerRef.current) {
        window.clearInterval(demoTimerRef.current);
      }
    };
  }, []);

  // Automatically detect user parameter manipulation or 3D part click -> progress through TRY, OBSERVE, DISCOVER, APPLY, MASTER
  useEffect(() => {
    const targetParamId = challenge.targetParameterId;
    if (targetParamId && parameters[targetParamId] !== undefined) {
      const currentVal = parameters[targetParamId];
      const initialVal =
        initialParamSnapshotRef.current[targetParamId] ??
        modelSpec.parameters?.[targetParamId]?.defaultValue ??
        currentVal;

      const delta = Math.abs(currentVal - initialVal);
      if (delta > 0.001) {
        learnThroughPlayManager.markStageCompleted(challenge.id, 'try');
        learnThroughPlayManager.markStageCompleted(challenge.id, 'observe');
        learnThroughPlayManager.markStageCompleted(challenge.id, 'discover');

        // Check if within challenge target zone
        if (
          currentVal >= challenge.challengeTargetMin &&
          currentVal <= challenge.challengeTargetMax
        ) {
          learnThroughPlayManager.markStageCompleted(challenge.id, 'apply');
          if (!playState.discoveries[challenge.id]) {
            learnThroughPlayManager.recordDiscovery({
              id: challenge.id,
              domain: challenge.domain,
              title: modelSpec.title,
              symbol: challenge.symbol,
              scientificPrinciple: challenge.causeEffectRule,
              formulaOrRule: challenge.equationDisplay,
              accuracyPct: 100,
            });
            setActiveStage('master');
            setChallengeFeedback({
              type: 'success',
              text: `🎯 Target Reached (${currentVal} ${challenge.targetUnit})! Scientific Principle Mastered!`,
            });
          }
        } else if (activeStage === 'see' || activeStage === 'try') {
          setActiveStage('discover');
        }
      }
    } else if (!targetParamId && selectedPartId) {
      learnThroughPlayManager.markStageCompleted(challenge.id, 'try');
      learnThroughPlayManager.markStageCompleted(challenge.id, 'observe');
      learnThroughPlayManager.markStageCompleted(challenge.id, 'discover');
      learnThroughPlayManager.markStageCompleted(challenge.id, 'apply');
      if (!playState.discoveries[challenge.id]) {
        learnThroughPlayManager.recordDiscovery({
          id: challenge.id,
          domain: challenge.domain,
          title: modelSpec.title,
          symbol: challenge.symbol,
          scientificPrinciple: challenge.causeEffectRule,
          formulaOrRule: challenge.equationDisplay,
          accuracyPct: 100,
        });
        setActiveStage('master');
      }
    }
  }, [parameters, selectedPartId, challenge]);

  const completedStages = playState.completedLoops[challenge.id] || ['see'];
  const isMastered = Boolean(playState.discoveries[challenge.id]);

  const currentParamValue =
    challenge.targetParameterId && parameters[challenge.targetParameterId] !== undefined
      ? parameters[challenge.targetParameterId]
      : null;

  const targetParamSpec =
    challenge.targetParameterId && modelSpec.parameters?.[challenge.targetParameterId]
      ? modelSpec.parameters[challenge.targetParameterId]
      : null;

  // Visual 1-click Auto-Demonstration for Non-Readers & Beginners
  const handleRunVisualDemo = () => {
    if (isAutoDemonstrating) return;
    learnThroughPlayManager.speakInstruction(
      `${challenge.id}-demo`,
      `${challenge.spokenSeePrompt} ${challenge.spokenTryPrompt} ${challenge.spokenObservePrompt}`,
      true
    );

    if (challenge.targetPartId && onSelectPartById) {
      onSelectPartById(challenge.targetPartId);
    }

    if (!challenge.targetParameterId || !onUpdateParameter || !targetParamSpec) {
      learnThroughPlayManager.markStageCompleted(challenge.id, 'try');
      learnThroughPlayManager.markStageCompleted(challenge.id, 'observe');
      learnThroughPlayManager.markStageCompleted(challenge.id, 'discover');
      setActiveStage('discover');
      return;
    }

    const paramId = challenge.targetParameterId;
    const startVal = parameters[paramId] ?? targetParamSpec.defaultValue;
    const endVal = challenge.demoValue;
    const totalSteps = 18;
    let stepCount = 0;

    setIsAutoDemonstrating(true);
    setActiveStage('try');

    if (demoTimerRef.current) {
      window.clearInterval(demoTimerRef.current);
    }

    demoTimerRef.current = window.setInterval(() => {
      stepCount += 1;
      const t = stepCount / totalSteps;
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const rawNext = startVal + (endVal - startVal) * eased;
      const stepUnit = targetParamSpec.step || 1;
      const roundedNext = Number((Math.round(rawNext / stepUnit) * stepUnit).toFixed(3));
      onUpdateParameter(paramId, roundedNext);

      if (stepCount >= totalSteps) {
        if (demoTimerRef.current) {
          window.clearInterval(demoTimerRef.current);
          demoTimerRef.current = null;
        }
        setIsAutoDemonstrating(false);
        setActiveStage('discover');
      }
    }, 65);
  };

  const handleCheckChallenge = () => {
    if (challenge.targetParameterId && currentParamValue !== null) {
      const inRange =
        currentParamValue >= challenge.challengeTargetMin &&
        currentParamValue <= challenge.challengeTargetMax;

      const attemptOutcome = learnThroughPlayManager.recordChallengeAttempt(challenge.id, inRange);

      if (inRange) {
        learnThroughPlayManager.markStageCompleted(challenge.id, 'apply');
        learnThroughPlayManager.recordDiscovery({
          id: challenge.id,
          domain: challenge.domain,
          title: modelSpec.title,
          symbol: challenge.symbol,
          scientificPrinciple: challenge.causeEffectRule,
          formulaOrRule: challenge.equationDisplay,
          accuracyPct: 100,
        });
        setActiveStage('master');
        const msg = `Mastery Achieved! ${challenge.targetParameterName} is set to ${currentParamValue} ${challenge.targetUnit}. ${challenge.spokenDiscoverInsight}`;
        setChallengeFeedback({ type: 'success', text: msg });
        learnThroughPlayManager.speakInstruction(`${challenge.id}-success`, msg, true);
      } else {
        const direction =
          currentParamValue < challenge.challengeTargetMin ? '↑ Increase' : '↓ Decrease';
        const hintMsg = `${direction} ${challenge.targetParameterName} from ${currentParamValue} ${challenge.targetUnit} into the target zone (${challenge.challengeTargetLabel}).`;
        setShowVisualHint(attemptOutcome.shouldShowVisualHint || true);
        setChallengeFeedback({ type: 'hint', text: hintMsg });
        learnThroughPlayManager.speakInstruction(`${challenge.id}-hint`, hintMsg, true);
      }
    } else {
      learnThroughPlayManager.recordDiscovery({
        id: challenge.id,
        domain: challenge.domain,
        title: modelSpec.title,
        symbol: challenge.symbol,
        scientificPrinciple: challenge.causeEffectRule,
        formulaOrRule: challenge.equationDisplay,
        accuracyPct: 100,
      });
      setActiveStage('master');
      setChallengeFeedback({
        type: 'success',
        text: `3D Structure Inspected & Mastered!`,
      });
    }
  };

  const handleSpeakCurrentStage = () => {
    const stageTextMap: Record<LearningLoopStage, string> = {
      see: challenge.spokenSeePrompt,
      try: challenge.spokenTryPrompt,
      observe: challenge.spokenObservePrompt,
      discover: challenge.spokenDiscoverInsight,
      apply: challenge.spokenApplyChallenge,
      master: `You mastered ${modelSpec.title}! ${challenge.spokenDiscoverInsight}`,
    };
    learnThroughPlayManager.speakInstruction(
      `${challenge.id}-${activeStage}`,
      stageTextMap[activeStage],
      true
    );
  };

  return (
    <div
      id="learn-through-play-dock"
      data-testid="learn-through-play-dock"
      className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4 text-slate-800"
    >
      {/* Top Bar: Learn-Through-Play Header + Non-Reader Visual/Audio Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-base shrink-0">
            {challenge.symbol}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Learn Through Play · Interactive Discovery Loop
              </h3>
              {isMastered && (
                <span
                  data-testid="model-mastery-badge"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Mastered</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {challenge.nonReaderVisualSummary} · Touch, experiment, and observe real cause &amp; effect
            </p>
          </div>
        </div>

        {/* Universal Accessibility Action Bar (Speak Aloud, Watch Demo, Adaptive Mode) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleSpeakCurrentStage}
            data-testid="play-dock-speak-button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Speak current guide and scientific principle aloud"
          >
            <Volume2 className="w-3.5 h-3.5 text-sky-600" />
            <span>🔊 Listen</span>
          </button>

          <button
            type="button"
            onClick={handleRunVisualDemo}
            disabled={isAutoDemonstrating}
            data-testid="play-dock-watch-demo-button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            title="Watch an automatic visual demonstration on the 3D model"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isAutoDemonstrating ? 'Demonstrating...' : '👁️ Watch & Try Demo'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowVisualHint((prev) => !prev);
            }}
            data-testid="play-dock-hint-button"
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              showVisualHint
                ? 'bg-amber-100 text-amber-950 border-amber-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Show visual step-by-step hint"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>💡 Hint</span>
          </button>
        </div>
      </div>

      {/* 6-Stage Visual Learning Cycle Stepper (SEE -> TRY -> OBSERVE -> DISCOVER -> APPLY -> MASTER) */}
      <div
        data-testid="learning-loop-stepper"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5"
      >
        {LOOP_STAGES.map((st) => {
          const isDone = completedStages.includes(st.id) || (st.id === 'master' && isMastered);
          const isCurrent = activeStage === st.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => {
                setActiveStage(st.id);
                if (playState.autoSpeakEnabled) {
                  handleSpeakCurrentStage();
                }
              }}
              data-testid={`loop-stage-${st.id}`}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isCurrent
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : isDone
                  ? 'bg-emerald-50/70 text-emerald-950 border-emerald-200 hover:bg-emerald-50'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-sm leading-none">{st.symbol}</span>
                {isDone && (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${isCurrent ? 'text-emerald-400' : 'text-emerald-600'}`}
                  />
                )}
              </div>
              <div className="mt-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider block leading-tight">
                  {st.shortLabel}
                </span>
                <span
                  className={`text-[10px] block truncate ${
                    isCurrent ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {st.nonReaderCue}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Action & Cause-Effect Observation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        {/* Left: Visual Action & Direct Slider Manipulation (Non-Reader Friendly) */}
        <div className="lg:col-span-7 p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
                {activeStage === 'see'
                  ? '👁️ Step 1: Watch how the system works'
                  : activeStage === 'try'
                  ? '✋ Step 2: Change the control below'
                  : activeStage === 'observe'
                  ? '🔍 Step 3: Observe live 3D response'
                  : activeStage === 'discover'
                  ? '💡 Step 4: Scientific Cause & Effect'
                  : activeStage === 'apply'
                  ? '🎯 Step 5: Hands-On Target Challenge'
                  : '🏆 Step 6: Concept Mastered'}
              </span>
              <div className="text-xs sm:text-sm font-bold text-slate-900">
                {challenge.visualActionCue}
              </div>
            </div>

            {challenge.targetParameterId && currentParamValue !== null && (
              <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-right shrink-0">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Current</span>
                <span className="text-xs font-mono font-bold tabular-nums text-slate-900">
                  {currentParamValue}
                </span>
                <span className="text-[10px] font-mono text-slate-500 ml-1">
                  {challenge.targetUnit}
                </span>
              </div>
            )}
          </div>

          {/* Direct Visual Slider for Immediate Play inside the Dock */}
          {targetParamSpec && challenge.targetParameterId && onUpdateParameter && (
            <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <span>✋ Drag {targetParamSpec.name}:</span>
                </span>
                <span className="font-mono text-[11px] font-bold text-emerald-700">
                  🎯 Target Zone: {challenge.challengeTargetLabel}
                </span>
              </div>
              <input
                type="range"
                min={targetParamSpec.min}
                max={targetParamSpec.max}
                step={targetParamSpec.step}
                value={currentParamValue ?? targetParamSpec.defaultValue}
                onChange={(e) =>
                  onUpdateParameter(challenge.targetParameterId!, parseFloat(e.target.value))
                }
                data-testid="play-dock-direct-slider"
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 tabular-nums">
                <span>
                  Min: {targetParamSpec.min} {targetParamSpec.unit}
                </span>
                <span>
                  Default: {targetParamSpec.defaultValue} {targetParamSpec.unit}
                </span>
                <span>
                  Max: {targetParamSpec.max} {targetParamSpec.unit}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons: Verify Target / Select 3D Part / Reset */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleCheckChallenge}
                data-testid="play-dock-verify-button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>🎯 Check Discovery Target</span>
              </button>

              {challenge.targetPartId && onSelectPartById && (
                <button
                  type="button"
                  onClick={() => onSelectPartById(challenge.targetPartId!)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-sky-600" />
                  <span>👆 Highlight {challenge.targetPartName}</span>
                </button>
              )}
            </div>

            {onResetChallenge && (
              <button
                type="button"
                onClick={() => {
                  learnThroughPlayManager.resetContextProgress(challenge.id);
                  setChallengeFeedback(null);
                  setActiveStage('see');
                  onResetChallenge();
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                title="Reset challenge & parameters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Loop</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Scientific Cause-and-Effect & Formula Discovery Card */}
        <div className="lg:col-span-5 p-3.5 rounded-xl bg-slate-900 text-white flex flex-col justify-between space-y-2.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>💡 Scientific Law &amp; Cause → Effect</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                {playState.supportLevel} mode
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">{challenge.causeEffectRule}</p>
          </div>

          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-sky-300 truncate">
            {challenge.equationDisplay}
          </div>

          {(showVisualHint || challengeFeedback) && (
            <div
              data-testid="play-dock-feedback-banner"
              className={`p-2.5 rounded-lg text-[11px] font-medium flex items-start gap-2 border ${
                challengeFeedback?.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
                  : 'bg-amber-950/90 border-amber-700 text-amber-200'
              }`}
            >
              <span className="text-sm leading-none shrink-0">
                {challengeFeedback?.type === 'success' ? '🏆' : '💡'}
              </span>
              <span>
                {challengeFeedback
                  ? challengeFeedback.text
                  : `Visual Hint: Move ${challenge.targetParameterName} to ${challenge.demoValue} ${challenge.targetUnit} or click "Watch & Try Demo" above!`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
