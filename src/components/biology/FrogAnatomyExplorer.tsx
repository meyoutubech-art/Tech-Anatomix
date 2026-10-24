import React, { useState, useRef, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import {
  Heart,
  Eye,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Scissors,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  SKETCHFAB_FROG_CONFIG,
  FROG_ORGAN_MANIFEST,
  FROG_ORGAN_LIST,
} from '../../data/frogAnatomyData';
import { FrogOrganId } from '../../types/frogAnatomy';
import { FrogNeckDissectionScene } from './FrogNeckDissectionScene';
import { soundEngine } from '../../utils/soundEngine';

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Isolated Error Boundary to prevent any iframe or WebGL render failure
 * from crashing the rest of the VIZLAB application.
 */
class FrogViewerErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('FrogAnatomyExplorer caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-8 rounded-2xl bg-slate-900 border border-rose-500/40 text-center text-white space-y-4 my-4">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-rose-300">3D Specimen Viewer Stream Error</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            {this.state.error?.message ||
              'A WebGL memory or iframe issue occurred. The rest of VIZLAB remains fully functional.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg transition-colors cursor-pointer"
          >
            Retry Specimen Viewer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface FrogAnatomyExplorerProps {
  onTryIt?: () => void;
  initialStage?: 'external' | 'internal';
}

export const FrogAnatomyExplorer: React.FC<FrogAnatomyExplorerProps> = ({
  initialStage = 'external',
}) => {
  // Current active stage: 'external' (Outer Frog) or 'internal' (Heart & Lungs)
  const [stage, setStage] = useState<'external' | 'internal'>(initialStage);

  // External view mode: 'neck_dissection' (mouse-operated 3D neck rotation) vs 'sketchfab_frog' (live 3D stream)
  const [externalViewMode, setExternalViewMode] = useState<'neck_dissection' | 'sketchfab_frog'>('neck_dissection');

  // External dissection progression state
  const [isDissectionCompleted, setIsDissectionCompleted] = useState<boolean>(false);

  // Stability mode: Stable (no 1s camera cycle crash) vs Auto-Tour (1s cycling)
  const [useStableMode, setUseStableMode] = useState<boolean>(true);

  // Loading and Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Brief transition window to let browser GPU compositor free previous WebGL context
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Organ Card Selection for reference
  const [selectedOrganId, setSelectedOrganId] = useState<FrogOrganId>('heart');

  const containerRef = useRef<HTMLDivElement>(null);
  const transitionTimerRef = useRef<number | null>(null);

  // URLs
  const outerFrogUrl = SKETCHFAB_FROG_CONFIG.outerFrogEmbedUrl;
  const internalOrgansUrl = useStableMode
    ? SKETCHFAB_FROG_CONFIG.internalOrgansStableEmbedUrl
    : SKETCHFAB_FROG_CONFIG.internalOrgansEmbedUrl;

  const currentEmbedUrl = stage === 'external' ? outerFrogUrl : internalOrgansUrl;
  const currentTitle =
    stage === 'external'
      ? SKETCHFAB_FROG_CONFIG.outerFrogTitle
      : SKETCHFAB_FROG_CONFIG.internalOrgansTitle;
  const currentSourceUrl =
    stage === 'external'
      ? SKETCHFAB_FROG_CONFIG.outerFrogSketchfabUrl
      : SKETCHFAB_FROG_CONFIG.internalOrgansSketchfabUrl;

  // Cleanup transition timer and audio loops on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
      soundEngine.stopSource('frog-anatomy-explorer');
    };
  }, []);

  // State-driven amphibian cardiorespiratory audio during internal visceral inspection
  useEffect(() => {
    if (stage !== 'internal') {
      soundEngine.stopSource('frog-anatomy-explorer');
      return;
    }

    if (selectedOrganId === 'heart') {
      soundEngine.stopLoop('frog-anatomy-explorer::respiration');
      soundEngine.syncHeartbeat({
        sourceId: 'frog-anatomy-explorer',
        active: true,
        bpm: 48,
        isPlaying: true,
      });
    } else if (selectedOrganId === 'lungs') {
      soundEngine.stopLoop('frog-anatomy-explorer::heartbeat');
      soundEngine.syncRespiration({
        sourceId: 'frog-anatomy-explorer',
        active: true,
        breathsPerMinute: 16,
        isPlaying: true,
      });
    } else {
      soundEngine.stopSource('frog-anatomy-explorer');
    }
  }, [stage, selectedOrganId]);

  // Gracefully transition between models to allow GPU WebGL context release
  const transitionToStage = (targetStage: 'external' | 'internal') => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }
    setIsTransitioning(true);
    setIsLoading(true);
    setLoadError(null);
    setStage(targetStage);

    // 180ms delay gives the GPU compositor time to reclaim VRAM from unmounted iframe
    transitionTimerRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
      setIframeKey((prev) => prev + 1);
    }, 180);
  };

  // Handle stage transition to internal organs
  const handleInspectInternalOrgans = () => {
    transitionToStage('internal');
  };

  // Handle return to external frog
  const handleBackToExternal = () => {
    transitionToStage('external');
  };

  // Dissection step completion action
  const handleCompleteDissection = () => {
    setIsDissectionCompleted(true);
    handleInspectInternalOrgans();
  };

  // Reset dissection flow back to initial state
  const handleResetDissection = () => {
    setIsDissectionCompleted(false);
    if (stage === 'internal') {
      handleBackToExternal();
    }
  };

  // Fullscreen support
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => setIsFullscreen(!isFullscreen));
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Recoverable reload
  const handleReload = () => {
    setIsLoading(true);
    setLoadError(null);
    setIframeKey((prev) => prev + 1);
  };

  // Toggle stable mode vs auto-cycle
  const handleToggleStabilityMode = () => {
    const newMode = !useStableMode;
    setUseStableMode(newMode);
    setIsLoading(true);
    setLoadError(null);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <FrogViewerErrorBoundary onReset={handleReload}>
      <div
        ref={containerRef}
        className={`w-full flex flex-col gap-5 bg-slate-900 text-slate-100 ${
          isFullscreen
            ? 'fixed inset-0 z-50 p-6 overflow-y-auto bg-slate-950'
            : 'p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl'
        }`}
      >
        {/* =========================================================================
            HEADER & NAVIGATION BAR
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  stage === 'external'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    stage === 'external' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                {stage === 'external' ? 'Stage 1: External Specimen' : 'Stage 2: Internal Viscera'}
              </span>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-xs text-slate-400 font-medium">
                {stage === 'external' ? 'Animated Ranidae Frog' : 'Frog Heart & Lungs (Blackburn Lab)'}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              {currentTitle}
            </h2>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {stage === 'external' && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mr-1">
                  <button
                    onClick={() => setExternalViewMode('neck_dissection')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      externalViewMode === 'neck_dissection'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Rotate neck with mouse to dissect"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>3D Neck Dissection</span>
                  </button>
                  <button
                    onClick={() => setExternalViewMode('sketchfab_frog')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      externalViewMode === 'sketchfab_frog'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="View animated Sketchfab model"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>External Frog</span>
                  </button>
                </div>

                <button
                  onClick={handleInspectInternalOrgans}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-800/70 text-xs font-semibold transition-all cursor-pointer"
                  title="Inspect Internal Organs (Frog Heart & Lungs - Blackburn Lab)"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Internal Organs</span>
                </button>
              </div>
            )}

            {stage === 'internal' && (
              <>
                <button
                  onClick={handleBackToExternal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  title="Return to External Frog Specimen"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to External Frog</span>
                </button>

                {/* Crash-Prevention Stability Toggle */}
                <button
                  onClick={handleToggleStabilityMode}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    useStableMode
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60'
                      : 'bg-amber-950/60 text-amber-300 border-amber-700/60 hover:bg-amber-900/60'
                  }`}
                  title={
                    useStableMode
                      ? 'Stable View: 1-second auto-cycle disabled to prevent WebGL GPU crashes'
                      : 'Auto-Tour View: cycles annotations every 1 second (may stress GPU)'
                  }
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{useStableMode ? 'Stable Mode (Anti-Crash)' : 'Tour Mode'}</span>
                </button>
              </>
            )}

            {stage === 'external' && externalViewMode === 'sketchfab_frog' && (
              <a
                href={currentSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
                title="Open full 3D model directly on Sketchfab in a new tab"
              >
                <span>Open in Sketchfab</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}

            {stage === 'internal' && (
              <a
                href={currentSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
                title="Open full 3D model directly on Sketchfab in a new tab"
              >
                <span>Open in Sketchfab</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}

            <button
              onClick={handleReload}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Reload 3D Specimen"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleToggleFullscreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* =========================================================================
            PRIMARY 3D STAGE: EITHER INTERACTIVE NECK DISSECTION OR SKETCHFAB VIEWER
            ========================================================================= */}
        {stage === 'external' && externalViewMode === 'neck_dissection' ? (
          <FrogNeckDissectionScene
            onDissectionComplete={handleCompleteDissection}
            onInspectOrgans={handleInspectInternalOrgans}
            isDissectionCompleted={isDissectionCompleted}
          />
        ) : (
          <div className="sketchfab-embed-wrapper w-full space-y-1.5">
            <div className="relative w-full h-[400px] sm:h-[460px] lg:h-[500px] max-w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              {/* Loading Overlay */}
              {(isLoading || isTransitioning) && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md text-white gap-3 p-6 pointer-events-none">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-3 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                    <Eye className="w-5 h-5 text-emerald-400 absolute inset-0 m-auto" />
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-sm font-bold text-slate-200">
                      {isTransitioning ? 'Switching 3D Specimen Buffers...' : 'Streaming 3D Specimen...'}
                    </span>
                    <p className="text-xs text-slate-400 max-w-sm">
                      {stage === 'external'
                        ? 'Loading Animated Ranidae Frog 3D Model'
                        : 'Loading Frog Heart and Lungs (Blackburn Lab)'}
                    </p>
                  </div>
                </div>
              )}

              {/* Recoverable Error Overlay */}
              {loadError && !isTransitioning && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md text-white gap-3 p-6">
                  <AlertCircle className="w-10 h-10 text-rose-500" />
                  <h4 className="text-sm font-bold text-rose-300">Specimen WebGL Stream Interrupted</h4>
                  <p className="text-xs text-slate-400 max-w-md text-center">
                    {loadError}. High-density 3D biological scans may require GPU memory reset.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        setUseStableMode(true);
                        handleReload();
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer transition-colors shadow-md"
                    >
                      Reload in Safe Anti-Crash Mode
                    </button>
                    <a
                      href={currentSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer transition-colors"
                    >
                      Open Direct in Sketchfab
                    </a>
                  </div>
                </div>
              )}

              {/* Single Active Iframe with exact Sketchfab attributes */}
              {!isTransitioning && (
                <iframe
                  key={`specimen-${stage}-${useStableMode ? 'stable' : 'tour'}-${iframeKey}`}
                  title={stage === 'internal' ? 'Frog Heart and Lungs' : currentTitle}
                  src={currentEmbedUrl}
                  frameBorder="0"
                  style={{ width: '100%', height: '100%', display: 'block' }}
                  className="w-full h-full block border-0 rounded-2xl"
                  allow="autoplay; fullscreen; xr-spatial-tracking; web-share"
                  loading="eager"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  {...({
                    mozallowfullscreen: 'true',
                    webkitallowfullscreen: 'true',
                    'xr-spatial-tracking': 'true',
                    'execution-while-out-of-viewport': 'true',
                    'execution-while-not-rendered': 'true',
                    'web-share': 'true',
                  } as React.IframeHTMLAttributes<HTMLIFrameElement>)}
                  onLoad={() => {
                    setIsLoading(false);
                    setLoadError(null);
                  }}
                  onError={() => {
                    setIsLoading(false);
                    setLoadError('Failed to load 3D model stream. GPU context reset suggested.');
                  }}
                />
              )}

              {/* TOP EXTREME LEFT: Tech-Anatomix Logo */}
              <div className="absolute top-3 left-3 z-20 pointer-events-none">
                <img
                  src="/logo.png"
                  alt="Tech-Anatomix Logo"
                  className="w-9 h-9 object-contain rounded-lg shadow-md drop-shadow bg-slate-900/60 p-1 backdrop-blur-xs border border-slate-700/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE 1: SIMPLIFIED EXTERNAL DISSECTION FLOW
            Clean, direct, without knife-tracking clutter
            ========================================================================= */}
        {stage === 'external' && (
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Guided Dissection Progression
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Inspect external morphology, then complete the dissection protocol to advance to internal cardiorespiratory examination.
                </p>
              </div>

              {isDissectionCompleted && (
                <button
                  onClick={handleResetDissection}
                  className="self-start sm:self-auto text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                >
                  Restart Dissection
                </button>
              )}
            </div>

            {/* State 1A: Before Completing Dissection -> Mouse Neck Rotation Instruction */}
            {!isDissectionCompleted ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                      1
                    </span>
                    <h4 className="text-sm font-semibold text-slate-200">
                      Step 1: Rotate Frog Neck with Mouse to Dissect
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 max-w-xl">
                    Click and drag the green glowing neck portion or the rotation dial above with your mouse. As you rotate the neck to 90°, cervical tissues and dermal flaps peel back to reveal the internal visceral cavity.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setExternalViewMode('neck_dissection');
                      handleCompleteDissection();
                    }}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/40 transition-all transform hover:scale-[1.02] cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Scissors className="w-4 h-4" />
                    <span>Rotate Neck (Complete Dissection)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* State 1B: After Completing Dissection -> Reveal "Inspect Internal Organs" Button */
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 animate-in fade-in">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                      Neck Rotation Dissection Completed
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-xl">
                    The cervical tissues have been rotated and the coelomic cavity is successfully opened. You can now inspect internal organs (3-chambered heart, sacculated lungs, and liver).
                  </p>
                </div>

                <button
                  onClick={handleInspectInternalOrgans}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-rose-900/50 transition-all transform hover:scale-[1.02] cursor-pointer whitespace-nowrap shrink-0 ring-2 ring-rose-400/40"
                >
                  <Heart className="w-4 h-4 text-rose-200 fill-rose-300" />
                  <span>Inspect Internal Organs</span>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </button>
              </div>
            )}

            {/* Honest Educational Disclosure */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
              <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                <strong>Educational Simulation:</strong> The Sketchfab 3D models provide verified biological anatomical reference. Completing dissection triggers the curricular transition to the cardiorespiratory visceral stage without altering the embedded external model.
              </span>
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE 2: INTERNAL ORGANS STAGE CONTROLS & DOSSIER
            Shown when user is inspecting internal organs
            ========================================================================= */}
        {stage === 'internal' && (
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Internal Visceral Stage · Cardiorespiratory System
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  High-fidelity 3D model displaying the three-chambered amphibian heart and paired sacculated lungs with interactive annotations.
                </p>
              </div>

              {/* Direct Back to External Frog Button */}
              <button
                onClick={handleBackToExternal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to External Frog</span>
              </button>
            </div>

            {/* Interactive Anatomical Landmarks Guide */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-rose-400" />
                  3D Specimen Numbered Annotations Guide
                </span>
                <span className="text-[10px] text-slate-500">Click markers in 3D or inspect cards below</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setSelectedOrganId('heart')}
                  className="p-3 rounded-xl bg-slate-950 border border-rose-900/50 hover:border-rose-500 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center">
                      1
                    </span>
                    <span className="text-xs font-bold text-rose-300">Three-Chambered Heart</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Single muscular ventricle and dual atria (left & right). Pumps mixed oxygenated blood through conus arteriosus.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedOrganId('lungs')}
                  className="p-3 rounded-xl bg-slate-950 border border-sky-900/50 hover:border-sky-500 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[10px] flex items-center justify-center">
                      2
                    </span>
                    <span className="text-xs font-bold text-sky-300">Paired Sacculated Lungs</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Right sacculated lung with thin-walled internal alveolar folds. Inflated via positive-pressure buccopharyngeal pumping.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedOrganId('lungs')}
                  className="p-3 rounded-xl bg-slate-950 border border-indigo-900/50 hover:border-indigo-500 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                      3
                    </span>
                    <span className="text-xs font-bold text-indigo-300">Paired Sacculated Lungs</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Left symmetrical respiratory sac augmenting cutaneous capillary gas exchange during dormancy.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Organ Selector Chips */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Select Organ for Full Anatomical Dossier:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {FROG_ORGAN_LIST.map((organ) => {
                  const isSelected = selectedOrganId === organ.id;
                  return (
                    <button
                      key={organ.id}
                      onClick={() => setSelectedOrganId(organ.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-600 text-white shadow-md border border-rose-500'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: organ.color }}
                      />
                      <span>{organ.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Organ Dossier */}
            {selectedOrganId && FROG_ORGAN_MANIFEST[selectedOrganId] && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: FROG_ORGAN_MANIFEST[selectedOrganId].color }}
                    />
                    <h4 className="text-sm font-bold text-white">
                      {FROG_ORGAN_MANIFEST[selectedOrganId].name}
                    </h4>
                    <span className="text-xs italic text-slate-400">
                      ({FROG_ORGAN_MANIFEST[selectedOrganId].scientificName})
                    </span>
                    <span className="text-[10px] font-semibold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800 ml-auto">
                      {FROG_ORGAN_MANIFEST[selectedOrganId].system}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {FROG_ORGAN_MANIFEST[selectedOrganId].educationalDescription}
                  </p>

                  <div className="pt-2 text-xs text-slate-400 flex items-start gap-1.5">
                    <span className="font-semibold text-slate-300 shrink-0">Physiological Function:</span>
                    <span>{FROG_ORGAN_MANIFEST[selectedOrganId].function}</span>
                  </div>
                </div>

                <div className="md:col-span-4 p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px] block">
                      Anatomical Location
                    </span>
                    <span className="text-slate-200 mt-0.5 block">
                      {FROG_ORGAN_MANIFEST[selectedOrganId].location}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-500 uppercase font-semibold text-[10px] block">
                      Cardiorespiratory Notes
                    </span>
                    <span className="text-slate-400 mt-0.5 block text-[10px] leading-relaxed">
                      {FROG_ORGAN_MANIFEST[selectedOrganId].simplificationNotice}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </FrogViewerErrorBoundary>
  );
};
