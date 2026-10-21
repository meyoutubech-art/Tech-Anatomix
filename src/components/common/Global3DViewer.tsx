import React, { useRef, useState, useEffect } from 'react';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Grid,
  Compass,
  Tag,
  Play,
  Pause,
  RefreshCw,
  Info,
  Sparkles,
  Gauge,
  Video,
  Eye,
  Activity,
  Layers,
  Sliders,
  ChevronRight,
  Focus,
  Box,
} from 'lucide-react';
import { ModelPositionControls, PositionRange } from './ModelPositionControls';

interface Global3DViewerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onResetCamera?: () => void;
  onFitToModel?: () => void;
  onResetSimulation?: () => void;
  // Universal 3D Model Position Controller
  modelPosition?: { x: number; y: number };
  onModelPositionChange?: (pos: { x: number; y: number }) => void;
  onResetModelPosition?: () => void;
  positionRange?: PositionRange;
  enablePositionControls?: boolean;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  showPlayControl?: boolean;
  showLabels?: boolean;
  onToggleLabels?: (val: boolean) => void;
  showLabelsControl?: boolean;
  showGrid?: boolean;
  onToggleGrid?: (val: boolean) => void;
  showAxes?: boolean;
  onToggleAxes?: (val: boolean) => void;
  isExplorePartsActive?: boolean;
  onToggleExploreParts?: (val: boolean) => void;
  isExplodedView?: boolean;
  onToggleExplodedView?: (val: boolean) => void;
  isInternalView?: boolean;
  onToggleInternalView?: (val: boolean) => void;
  activeInspectedPartName?: string | null;
  onBackToFullModel?: () => void;
  onTryIt?: () => void;
  tryItLabel?: string;
  speed?: number;
  onSpeedChange?: (speed: number) => void;
  onSetCameraAngle?: (angle: 'iso' | 'top' | 'front' | 'side') => void;
  telemetry?: {
    label: string;
    value: string | number;
    unit?: string;
    status?: 'normal' | 'active' | 'warning' | 'critical';
  }[];
  bottomBarExtras?: React.ReactNode;
  heightClass?: string;
}

export const Global3DViewer: React.FC<Global3DViewerProps> = ({
  title,
  subtitle,
  children,
  onResetCamera,
  onFitToModel,
  onResetSimulation,
  isPlaying = true,
  onTogglePlay,
  showPlayControl = false,
  showLabels: externalShowLabels,
  onToggleLabels: externalToggleLabels,
  showLabelsControl = true,
  showGrid = true,
  onToggleGrid,
  showAxes = true,
  onToggleAxes,
  isExplorePartsActive = false,
  onToggleExploreParts,
  isExplodedView = false,
  onToggleExplodedView,
  isInternalView = false,
  onToggleInternalView,
  activeInspectedPartName,
  onBackToFullModel,
  onTryIt,
  tryItLabel = 'TRY IT',
  speed = 1.0,
  onSpeedChange,
  onSetCameraAngle,
  telemetry = [],
  bottomBarExtras,
  heightClass,
  modelPosition: externalModelPosition,
  onModelPositionChange,
  onResetModelPosition,
  positionRange,
  enablePositionControls,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInteractionTip, setShowInteractionTip] = useState(true);
  const [fps, setFps] = useState(60);
  const [currentSpeed, setCurrentSpeed] = useState(speed);

  // Position control state
  const [internalModelPosition, setInternalModelPosition] = useState({ x: 0, y: 0 });
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);

  const currentPosition =
    externalModelPosition !== undefined ? externalModelPosition : internalModelPosition;

  const handlePositionChange = (newPos: { x: number; y: number }) => {
    setInternalModelPosition(newPos);
    if (onModelPositionChange) {
      onModelPositionChange(newPos);
    }
  };

  const handleResetPosition = () => {
    const defaultPos = { x: 0, y: 0 };
    setInternalModelPosition(defaultPos);
    if (onModelPositionChange) {
      onModelPositionChange(defaultPos);
    }
    if (onResetModelPosition) {
      onResetModelPosition();
    }
  };

  // Outside click listener to deactivate keyboard mode
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsKeyboardActive(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Label visibility state (default: ON)
  const [internalShowLabels, setInternalShowLabels] = useState(true);
  const isLabelsVisible = externalShowLabels !== undefined ? externalShowLabels : internalShowLabels;

  const handleToggleLabels = () => {
    const nextVal = !isLabelsVisible;
    setInternalShowLabels(nextVal);
    if (externalToggleLabels) {
      externalToggleLabels(nextVal);
    }
  };

  // Measure rough rAF FPS for game-like HUD
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.min(60, Math.round((frameCount * 1000) / (now - lastTime))));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleSpeedToggle = () => {
    const nextSpeed = currentSpeed === 1.0 ? 0.5 : currentSpeed === 0.5 ? 2.0 : 1.0;
    setCurrentSpeed(nextSpeed);
    if (onSpeedChange) onSpeedChange(nextSpeed);
  };

  return (
    <div ref={wrapperRef} className="w-full flex flex-col gap-2.5">
      <div
        ref={containerRef}
        onClick={() => {
          if (!isKeyboardActive) setIsKeyboardActive(true);
        }}
        className={`relative w-full rounded-2xl border-2 border-slate-300/80 bg-slate-950 shadow-md overflow-hidden flex flex-col ${
          isFullscreen ? 'h-screen w-screen rounded-none fixed inset-0 z-50' : heightClass || 'h-[440px] sm:h-[480px] lg:h-[500px]'
        }`}
      >
      {/* 3D Viewport Top Header Cockpit */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none gap-2">
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          {/* Main Model Name Badge */}
          <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-2 ring-emerald-500/30"></span>
            <span className="text-xs font-bold tracking-wide text-white uppercase">{title}</span>
          </div>

          {/* BACK TO FULL MODEL Button when a component is inspected */}
          {activeInspectedPartName && onBackToFullModel && (
            <button
              onClick={onBackToFullModel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs tracking-wider shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer uppercase pointer-events-auto border border-amber-300"
              title="Return camera and view to complete full model"
            >
              <span>← BACK TO FULL MODEL</span>
            </button>
          )}
        </div>

        {/* Top Right Cockpit Controls: Icon-only Reset & Fullscreen */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xs pointer-events-auto shrink-0">
          {onResetCamera && (
            <button
              onClick={onResetCamera}
              title="Reset 3D Camera to Default"
              aria-label="Reset camera"
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label="Toggle fullscreen"
            className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-xs transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Container */}
      <div className="relative w-full h-full flex-1 touch-none select-none bg-radial from-slate-900 to-slate-950">
        {children}
      </div>

      {/* Bottom Floating Playback & Telemetry HUD Strip */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none gap-2 flex-wrap">
        <div className="flex items-center gap-2 pointer-events-auto">
          {showPlayControl && onTogglePlay && (
            <button
              onClick={onTogglePlay}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md border border-slate-700/80 transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current text-amber-400" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                  <span>Play</span>
                </>
              )}
            </button>
          )}

          {onResetSimulation && (
            <button
              onClick={onResetSimulation}
              title="Reset Simulation State"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md text-slate-300 rounded-xl text-xs font-semibold border border-slate-700/80 shadow-md hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
              <span>Reset State</span>
            </button>
          )}

          {/* Real-Time Telemetry Badges */}
          {telemetry.length > 0 && (
            <div className="hidden md:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-[11px] font-mono">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              {telemetry.map((t, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span className="text-slate-400">{t.label}:</span>
                  <span className="font-bold text-white">{t.value}</span>
                  {t.unit && <span className="text-slate-400">{t.unit}</span>}
                  {idx < telemetry.length - 1 && <span className="text-slate-600 ml-1">·</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right side extras */}
        {bottomBarExtras && <div className="pointer-events-auto">{bottomBarExtras}</div>}
      </div>
    </div>

    {/* 3D Model Position Controls (Directly BELOW the 3D Viewer) */}
    {(enablePositionControls ?? Boolean(onModelPositionChange)) && (
      <ModelPositionControls
        position={currentPosition}
        onChange={handlePositionChange}
        onReset={handleResetPosition}
        range={positionRange}
        isKeyboardActive={isKeyboardActive}
        onToggleKeyboardActive={setIsKeyboardActive}
      />
    )}
  </div>
  );
};

