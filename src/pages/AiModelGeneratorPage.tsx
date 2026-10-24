import React, { useState, useRef, useEffect } from 'react';
import { ScientificModelSpec } from '../types/aiModel';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { Dynamic3DModelRenderer } from '../components/models/Dynamic3DModelRenderer';
import {
  Sparkles,
  Info,
  X,
  CheckCircle2,
  Layers,
  Sliders,
  Cpu,
  History,
  AlertTriangle,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { classifyAiError } from '../utils/aiErrorClassifier';
import {
  analyzePromptForPresetMatch,
  verifyPresetCompatibility,
  HIGH_COMPLEXITY_UNSUPPORTED_MESSAGE,
  TARGET_PRESENTATION_DURATION_MS,
  PRESET_LOADING_STAGES,
  getCustomGenerationStages,
  CandidatePresetOption,
  MatchOutcome,
} from '../utils/intelligentModelMatcher';
import { synthesizeProceduralScientificModel } from '../utils/proceduralModelSynthesizer';
import { validateScientificModel, repairCustomModelSpec } from '../utils/modelValidator';

export interface AiModelGeneratorPageProps {
  initialModelId?: string;
  initialPrompt?: string;
  launchKey?: number;
}

export const AiModelGeneratorPage: React.FC<AiModelGeneratorPageProps> = ({
  initialModelId,
  initialPrompt,
  launchKey,
}) => {
  const [prompt, setPrompt] = useState('');
  const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [activeStages, setActiveStages] = useState<string[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [processingMode, setProcessingMode] = useState<'preset' | 'custom'>('preset');
  const [activeModel, setActiveModel] = useState<ScientificModelSpec>(CURATED_AI_MODELS.motor);
  const [fallbackNotification, setFallbackNotification] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [complexityNotice, setComplexityNotice] = useState<{
    originalPrompt: string;
    message: string;
    suggestedSimplerAlternative?: string;
    simplerSuggestions: string[];
  } | null>(null);
  const [ambiguityState, setAmbiguityState] = useState<{
    originalPrompt: string;
    question: string;
    candidates: CandidatePresetOption[];
  } | null>(null);
  const [lastSelectionOutcome, setLastSelectionOutcome] = useState<MatchOutcome>('exact-preset');

  const [aiEngineStatus, setAiEngineStatus] = useState<{
    hasApiKey: boolean;
    primaryModel?: string;
    checked: boolean;
  }>({ hasApiKey: true, checked: false });

  // Concurrency guard & request isolation tracking
  const activeRequestRef = useRef<boolean>(false);
  const currentRequestIdRef = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Fetch real-time AI status on mount
  useEffect(() => {
    fetch('/api/ai/health')
      .then((r) => r.json())
      .then((d) => {
        setAiEngineStatus({
          hasApiKey: Boolean(d.hasApiKey),
          primaryModel: d.primaryModel,
          checked: true,
        });
      })
      .catch(() => {
        setAiEngineStatus({ hasApiKey: true, checked: true });
      });

    // Check URL parameters for direct model lookup
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const requestedModel = searchParams.get('model') || searchParams.get('id');
      if (requestedModel) {
        const decision = analyzePromptForPresetMatch(requestedModel);
        if (decision.selectedPreset) {
          applyModelToViewer({
            ...decision.selectedPreset,
            generationSource: 'curated-preset',
          });
        }
      }
    } catch {}
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stepTimerRef.current.forEach((t) => clearTimeout(t));
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Dynamic parameters & conditions state for active model
  const [parameters, setParameters] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    Object.values(CURATED_AI_MODELS.motor.parameters).forEach((p) => {
      initial[p.id] = p.defaultValue;
    });
    return initial;
  });

  const [conditions, setConditions] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    Object.values(CURATED_AI_MODELS.motor.conditions).forEach((c) => {
      initial[c.id] = c.defaultValue;
    });
    return initial;
  });

  const [showLabels, setShowLabels] = useState(true);
  const [generatedHistory, setGeneratedHistory] = useState<ScientificModelSpec[]>([
    CURATED_AI_MODELS.motor,
  ]);

  const applyModelToViewer = (spec: ScientificModelSpec) => {
    setActiveModel(spec);
    setGeneratedHistory((prev) => {
      const filtered = prev.filter((item) => item.title !== spec.title);
      return [spec, ...filtered].slice(0, 8);
    });

    const newParams: Record<string, number> = {};
    Object.values(spec.parameters || {}).forEach((p) => {
      newParams[p.id] = p.defaultValue;
    });
    setParameters(newParams);

    const newConds: Record<string, any> = {};
    Object.values(spec.conditions || {}).forEach((c) => {
      newConds[c.id] = c.defaultValue;
    });
    setConditions(newConds);
  };

  useEffect(() => {
    if (initialModelId) {
      const directByKey = CURATED_AI_MODELS[initialModelId];
      const directById = Object.values(CURATED_AI_MODELS).find((m) => m.id === initialModelId);
      const chosen = directByKey || directById;
      if (chosen) {
        applyModelToViewer({
          ...chosen,
          generationSource: 'curated-preset',
        });
        return;
      }
      const decision = analyzePromptForPresetMatch(initialModelId);
      if (decision.selectedPreset) {
        applyModelToViewer({
          ...decision.selectedPreset,
          generationSource: 'curated-preset',
        });
      }
    } else if (initialPrompt) {
      const procSpec = synthesizeProceduralScientificModel(initialPrompt);
      applyModelToViewer(procSpec);
    }
  }, [initialModelId, initialPrompt, launchKey]);

  const clearScheduledTimers = () => {
    stepTimerRef.current.forEach((t) => clearTimeout(t));
    stepTimerRef.current = [];
  };

  const handleCancelRequest = () => {
    clearScheduledTimers();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    currentRequestIdRef.current = '';
    activeRequestRef.current = false;
    setIsGenerating(false);
    setGenerationStep('');
    setActiveStages([]);
    setCurrentStageIndex(0);
  };

  /**
   * Monotonic wait helper using performance.now()
   */
  const waitRemainingDuration = (
    startTimeMs: number,
    targetDurationMs: number,
    reqId: string,
    signal: AbortSignal
  ): Promise<boolean> => {
    const elapsed = performance.now() - startTimeMs;
    const remaining = Math.max(0, targetDurationMs - elapsed);
    if (remaining <= 0) {
      return Promise.resolve(currentRequestIdRef.current === reqId && !signal.aborted);
    }
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve(currentRequestIdRef.current === reqId && !signal.aborted);
      }, remaining);
      stepTimerRef.current.push(timer);
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          resolve(false);
        },
        { once: true }
      );
    });
  };

  const scheduleStageProgression = (stages: string[], totalDurationMs: number, reqId: string) => {
    setActiveStages(stages);
    setCurrentStageIndex(0);
    setGenerationStep(stages[0] || 'Analyzing your model request...');

    const stepInterval = Math.floor(totalDurationMs / stages.length);
    stages.forEach((stageText, idx) => {
      if (idx === 0) return;
      const timer = setTimeout(() => {
        if (currentRequestIdRef.current !== reqId) return;
        setCurrentStageIndex(idx);
        setGenerationStep(stageText);
      }, idx * stepInterval);
      stepTimerRef.current.push(timer);
    });
  };

  const handleSelectCandidatePreset = async (candidate: CandidatePresetOption) => {
    setAmbiguityState(null);
    await executePresetLoad(candidate.spec, candidate.title, 'exact-preset');
  };

  const executePresetLoad = async (
    presetSpec: ScientificModelSpec,
    queryLabel: string,
    outcome: MatchOutcome
  ) => {
    clearScheduledTimers();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const reqId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    currentRequestIdRef.current = reqId;
    activeRequestRef.current = true;

    const startTimeMs = performance.now();
    setLastSubmittedPrompt(queryLabel);
    setIsGenerating(true);
    setProcessingMode('preset');
    setViewerError(null);
    setComplexityNotice(null);
    setAmbiguityState(null);
    setFallbackNotification(null);

    scheduleStageProgression(PRESET_LOADING_STAGES, TARGET_PRESENTATION_DURATION_MS, reqId);

    const compat = verifyPresetCompatibility(queryLabel, presetSpec);
    if (!compat.compatible && outcome !== 'exact-preset') {
      // Compatibility check rejected preset; route to custom generation seamlessly
      await executeCustomGeneration(queryLabel, reqId, startTimeMs, controller);
      return;
    }

    const stillActive = await waitRemainingDuration(
      startTimeMs,
      TARGET_PRESENTATION_DURATION_MS,
      reqId,
      controller.signal
    );
    if (!stillActive || currentRequestIdRef.current !== reqId) return;

    const readySpec: ScientificModelSpec = {
      ...presetSpec,
      generationSource: 'curated-preset',
    };

    applyModelToViewer(readySpec);
    setLastSelectionOutcome(outcome);
    setFallbackNotification(null);
    clearScheduledTimers();
    activeRequestRef.current = false;
    setIsGenerating(false);
    setGenerationStep('');
    setPrompt('');
  };

  const executeCustomGeneration = async (
    userQuery: string,
    reqId: string,
    startTimeMs: number,
    controller: AbortController
  ) => {
    setProcessingMode('custom');
    const customStages = getCustomGenerationStages(aiEngineStatus.hasApiKey);
    scheduleStageProgression(customStages, TARGET_PRESENTATION_DURATION_MS, reqId);

    try {
      const res = await fetch('/api/ai/generate-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userQuery, forceFresh: true, requestId: reqId }),
        signal: controller.signal,
      });

      if (currentRequestIdRef.current !== reqId || controller.signal.aborted) return;

      if (!res.ok) {
        let errorPayload: any = null;
        try {
          errorPayload = await res.json();
        } catch {}

        if (errorPayload?.error === 'INVALID_PROMPT') {
          setViewerError(errorPayload.message || 'Please enter a valid scientific or engineering concept.');
          clearScheduledTimers();
          activeRequestRef.current = false;
          setIsGenerating(false);
          setGenerationStep('');
          return;
        }

        const errorMsg = classifyAiError(res.status);
        setViewerError(errorMsg);
        clearScheduledTimers();
        activeRequestRef.current = false;
        setIsGenerating(false);
        setGenerationStep('');
        return;
      }

      const data = await res.json();
      if (currentRequestIdRef.current !== reqId || controller.signal.aborted) return;

      if (data.code === 'UNSUPPORTED_COMPLEXITY' || data.strategy === 'unsupported') {
        setComplexityNotice({
          originalPrompt: userQuery,
          message: data.userFacingMessage || HIGH_COMPLEXITY_UNSUPPORTED_MESSAGE,
          suggestedSimplerAlternative: data.suggestedSimplerAlternative,
          simplerSuggestions: data.simplerSuggestions || [],
        });
        clearScheduledTimers();
        activeRequestRef.current = false;
        setIsGenerating(false);
        setGenerationStep('');
        return;
      }

      if (data.model && data.model.parts && data.model.parts.length > 0) {
        // Hold until TARGET_PRESENTATION_DURATION_MS (~6.0 seconds) if finished early;
        // if backend took longer than 6.0 seconds, waitRemainingDuration resolves immediately!
        setCurrentStageIndex(customStages.length - 1);
        setGenerationStep('Loading the model into the viewer...');

        const stillActive = await waitRemainingDuration(
          startTimeMs,
          TARGET_PRESENTATION_DURATION_MS,
          reqId,
          controller.signal
        );
        if (!stillActive || currentRequestIdRef.current !== reqId) return;

        const spec: ScientificModelSpec = data.model;
        applyModelToViewer(spec);
        setLastSelectionOutcome('custom-generation');

        if (data.isFallback) {
          setFallbackNotification(
            data.fallbackReason ||
              data.note ||
              `Synthesized custom interactive 3D model for "${userQuery}".`
          );
        } else {
          setFallbackNotification(null);
        }
      } else {
        const errorMsg = data.error
          ? classifyAiError(data.error)
          : 'Custom 3D model generation could not be completed for this prompt.';
        setViewerError(errorMsg);
      }
    } catch (e: any) {
      if (e.name === 'AbortError' || currentRequestIdRef.current !== reqId) return;

      // Offline / network disconnect custom procedural synthesis (validated before loading)
      const rawProcedural = synthesizeProceduralScientificModel(userQuery);
      const repairedProcedural = repairCustomModelSpec(userQuery, rawProcedural);
      const validation = validateScientificModel(userQuery, repairedProcedural);

      if (validation.valid) {
        setCurrentStageIndex(customStages.length - 1);
        setGenerationStep('Loading the model into the viewer...');
        const stillActive = await waitRemainingDuration(
          startTimeMs,
          TARGET_PRESENTATION_DURATION_MS,
          reqId,
          controller.signal
        );
        if (!stillActive || currentRequestIdRef.current !== reqId) return;

        applyModelToViewer(repairedProcedural);
        setLastSelectionOutcome('custom-generation');
        setFallbackNotification(
          `Synthesized custom interactive 3D model for "${userQuery}" using the offline scientific procedural engine.`
        );
      } else {
        setViewerError(
          `Could not generate a validated 3D model for "${userQuery}": ${validation.failureReasons.join('; ')}`
        );
      }
    } finally {
      if (currentRequestIdRef.current === reqId) {
        clearScheduledTimers();
        activeRequestRef.current = false;
        setIsGenerating(false);
        setGenerationStep('');
        setPrompt('');
      }
    }
  };

  const handleGenerate = async (userQuery: string, forceFresh = false) => {
    const q = userQuery.trim();
    if (!q) {
      setViewerError('Please enter a scientific or engineering concept to generate or load a 3D model.');
      return;
    }

    // Cancel any existing in-flight request so rapid re-submissions are cleanly isolated
    clearScheduledTimers();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setViewerError(null);
    setComplexityNotice(null);
    setAmbiguityState(null);
    setFallbackNotification(null);

    // Automatic Three-Outcome Classifier (Path A: Preset, Path B: Custom, Path C: Unsupported High-Complexity)
    const decision = analyzePromptForPresetMatch(q);

    if (decision.outcome === 'invalid-request') {
      setViewerError(decision.reason);
      return;
    }

    // Path C: Very Complex or Unsupported Model -> Show friendly complexity explanation + simpler alternatives
    if (decision.outcome === 'unsupported-complexity') {
      setLastSubmittedPrompt(q);
      setComplexityNotice({
        originalPrompt: q,
        message: decision.userFacingMessage || HIGH_COMPLEXITY_UNSUPPORTED_MESSAGE,
        suggestedSimplerAlternative: decision.suggestedSimplerAlternative,
        simplerSuggestions: decision.simplerSuggestions || [],
      });
      return;
    }

    if (!forceFresh) {
      if (decision.outcome === 'ambiguous' && decision.candidateOptions && decision.candidateOptions.length > 0) {
        setLastSubmittedPrompt(q);
        setAmbiguityState({
          originalPrompt: q,
          question:
            decision.clarificationQuestion ||
            `Multiple models match "${q}". Please choose the specific model you want or generate a custom 3D model:`,
          candidates: decision.candidateOptions,
        });
        return;
      }

      // Path A: Existing Preset
      if (
        (decision.outcome === 'exact-preset' || decision.outcome === 'semantic-preset') &&
        decision.selectedPreset
      ) {
        await executePresetLoad(decision.selectedPreset, q, decision.outcome);
        return;
      }
    }

    // Path B: Simple or Manageable Custom Model
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const reqId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    currentRequestIdRef.current = reqId;
    activeRequestRef.current = true;
    const startTimeMs = performance.now();

    setLastSubmittedPrompt(q);
    setIsGenerating(true);
    await executeCustomGeneration(q, reqId, startTimeMs, controller);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">AI Model Studio</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">
              Automatic 3D Model Discovery &amp; Research-First Custom Synthesis
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Create or Explore a 3D Scientific Model
          </h1>
        </div>

        {/* Live AI Engine Status Indicator */}
        <div className="flex items-center gap-2">
          {aiEngineStatus.checked &&
            (aiEngineStatus.hasApiKey ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>AI Live: {aiEngineStatus.primaryModel || 'Gemini'}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>Simulation Engine Ready</span>
              </div>
            ))}
        </div>
      </div>

      {/* Non-blocking provenance/fallback notification banner */}
      {fallbackNotification && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 shadow-2xs transition-all">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{fallbackNotification}</span>
          </div>
          <button
            onClick={() => setFallbackNotification(null)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/50 transition-colors cursor-pointer"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Prompt Input Bar — One clear prompt input and one Create/Generate button */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate(prompt);
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <input
              id="ai-prompt-input"
              type="text"
              placeholder='Describe any scientific or engineering model (e.g., "DC Electric Motor", "Double Pendulum", "Hydraulic Press", "Human Kidney Nephron", "Jet Engine Cutaway")...'
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
            />
          </div>
          <button
            id="ai-generate-btn"
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>{isGenerating ? 'Preparing Model...' : 'Generate 3D Model'}</span>
          </button>
        </form>
      </div>

      {/* Path C: Unsupported High-Complexity Model Guidance Card */}
      {complexityNotice && !isGenerating && (
        <div
          id="viewer-complexity-card"
          data-testid="viewer-complexity-card"
          className="bg-amber-50/95 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h2 className="text-sm font-bold text-amber-950">
                  Scope &amp; Complexity Guidance for &ldquo;{complexityNotice.originalPrompt}&rdquo;
                </h2>
                <p className="text-xs font-medium text-amber-900 leading-relaxed">
                  {complexityNotice.message}
                </p>
                {complexityNotice.suggestedSimplerAlternative && (
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Recommended Scope:</strong> {complexityNotice.suggestedSimplerAlternative}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setComplexityNotice(null)}
              className="p-1 text-amber-700 hover:text-amber-950 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
              title="Dismiss guidance"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {complexityNotice.simplerSuggestions.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                Try a Simpler Component orFocused 3D Model:
              </span>
              <div className="flex flex-wrap gap-2">
                {complexityNotice.simplerSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setComplexityNotice(null);
                      setPrompt(suggestion);
                      handleGenerate(suggestion);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-amber-100/70 text-slate-900 border border-amber-300 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ambiguity Clarification Prompt Card (when request matches multiple distinct concepts) */}
      {ambiguityState && !isGenerating && (
        <div
          id="viewer-ambiguity-card"
          className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-amber-950">
                  Clarification Needed for &ldquo;{ambiguityState.originalPrompt}&rdquo;
                </h2>
                <p className="text-xs text-amber-900 leading-relaxed">{ambiguityState.question}</p>
              </div>
            </div>
            <button
              onClick={() => setAmbiguityState(null)}
              className="p-1 text-amber-700 hover:text-amber-950 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {ambiguityState.candidates.map((cand) => (
              <button
                key={cand.id}
                onClick={() => handleSelectCandidatePreset(cand)}
                className="flex flex-col items-start text-left p-3 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-300 transition-all cursor-pointer shadow-2xs"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  {cand.category}
                </span>
                <span className="text-xs font-bold text-slate-900 mt-0.5">{cand.title}</span>
                <span className="text-[11px] text-slate-600 line-clamp-2 mt-1">{cand.concept}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => {
                const q = ambiguityState.originalPrompt;
                setAmbiguityState(null);
                handleGenerate(q, true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Generate Custom 3D Model for &ldquo;{ambiguityState.originalPrompt}&rdquo;</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Recovery Card (Immediate honest error state without loading an unrelated preset) */}
      {viewerError && !isGenerating && (
        <div
          id="viewer-error-card"
          className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-950">Model Request Could Not Be Completed</h3>
              <p className="text-xs text-rose-800 leading-relaxed">{viewerError}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {lastSubmittedPrompt && (
              <button
                onClick={() => handleGenerate(lastSubmittedPrompt)}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Retry Request
              </button>
            )}
            <button
              onClick={() => setViewerError(null)}
              className="px-3 py-2 rounded-xl bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Dedicated Viewer Processing Surface OR Active 3D Model Viewer */}
      {isGenerating ? (
        <div
          id="viewer-processing-surface"
          role="status"
          aria-live="polite"
          className="w-full min-h-[520px] rounded-2xl bg-slate-950 border border-slate-800 shadow-xl flex flex-col items-center justify-center p-6 sm:p-10 text-white relative overflow-hidden"
        >
          {/* Subtle ambient radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.14)_0%,transparent_65%)] pointer-events-none" />

          <div className="relative z-10 max-w-xl w-full space-y-6 text-center">
            {/* Animated 3D Wireframe/Orbital Indicator */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center shadow-lg">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-slate-900 text-sky-300 border border-slate-700">
                {processingMode === 'preset'
                  ? 'Intelligent Library Match & Verification'
                  : 'Research-First Custom 3D Model Synthesis'}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {lastSubmittedPrompt}
              </h2>
              <p
                id="viewer-live-status-message"
                className="text-sm sm:text-base font-medium text-sky-300 min-h-[24px] transition-all"
              >
                {generationStep || 'Analyzing your model request...'}
              </p>
            </div>

            {/* Indeterminate Activity Bar (No fake percentage numbers) */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-gradient-to-r from-sky-500 via-cyan-300 to-indigo-500 rounded-full animate-pulse" />
            </div>

            {/* Live Stage Checklist */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-left space-y-2">
              {activeStages.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                return (
                  <div
                    key={stage}
                    className={`flex items-center gap-2.5 text-xs transition-opacity ${
                      isCompleted
                        ? 'text-emerald-400 opacity-90'
                        : isCurrent
                        ? 'text-white font-semibold opacity-100'
                        : 'text-slate-500 opacity-50'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-700 shrink-0 inline-block" />
                    )}
                    <span>{stage}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleCancelRequest}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel Request</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Active Model Provenance, Architecture Summary & Session History */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              {activeModel.generationSource === 'ai-live' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  AI Live 3D Synthesis
                </span>
              ) : activeModel.generationSource === 'procedural-synthesizer' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-fuchsia-50 text-fuchsia-900 border border-fuchsia-200">
                  <Cpu className="w-3.5 h-3.5 text-fuchsia-600" />
                  Custom 3D Scientific Synthesizer
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                  Verified Laboratory Preset ({lastSelectionOutcome === 'semantic-preset' ? 'Semantic Match' : 'Exact Match'})
                </span>
              )}

              {activeModel.subjectDomain && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {activeModel.subjectDomain}
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                <Layers className="w-3 h-3 text-slate-400" />
                {activeModel.parts?.length || 0} Interactive 3D Parts
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                <Sliders className="w-3 h-3 text-slate-400" />
                {Object.keys(activeModel.parameters || {}).length} Live Controls
              </span>
            </div>

            {generatedHistory.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                <span className="inline-flex items-center gap-1 text-slate-400 font-medium shrink-0">
                  <History className="w-3.5 h-3.5" />
                  Session Models:
                </span>
                {generatedHistory.map((item) => {
                  const isCurrent = item.id === activeModel.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => applyModelToViewer(item)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 border ${
                        isCurrent
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rendered 3D Model with Inspector and Parameters */}
          <Dynamic3DModelRenderer
            modelSpec={activeModel}
            parameters={parameters}
            conditions={conditions}
            onUpdateParameter={(id, val) => setParameters((prev) => ({ ...prev, [id]: val }))}
            onUpdateCondition={(id, val) => setConditions((prev) => ({ ...prev, [id]: val }))}
            onResetAll={(defaultParams, defaultConds) => {
              setParameters(defaultParams);
              setConditions(defaultConds);
            }}
            onTryIt={() => {
              const el = document.getElementById('ai-model-parameters-deck');
              if (el) {
                el.classList.add('ring-2', 'ring-sky-500');
                setTimeout(() => el.classList.remove('ring-2', 'ring-sky-500'), 1500);
              }
            }}
            showLabels={showLabels}
            onToggleLabels={setShowLabels}
          />
        </>
      )}
    </div>
  );
};

