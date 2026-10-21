import React, { useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Move, Keyboard, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

export interface PositionRange {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  step?: number;
}

export interface ModelPositionControlsProps {
  position: { x: number; y: number };
  onChange: (newPos: { x: number; y: number }) => void;
  onReset: () => void;
  range?: PositionRange;
  isKeyboardActive?: boolean;
  onToggleKeyboardActive?: (active: boolean) => void;
  className?: string;
  disabled?: boolean;
}

const DEFAULT_RANGE: PositionRange = {
  minX: -5.0,
  maxX: 5.0,
  minY: -4.0,
  maxY: 4.0,
  step: 0.1,
};

export const ModelPositionControls: React.FC<ModelPositionControlsProps> = ({
  position,
  onChange,
  onReset,
  range = DEFAULT_RANGE,
  isKeyboardActive = false,
  onToggleKeyboardActive,
  className = '',
  disabled = false,
}) => {
  const positionRef = useRef(position);
  positionRef.current = position;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const rangeRef = useRef(range);
  rangeRef.current = range;
  const step = range.step || 0.1;

  // Handle keyboard arrow keys
  useEffect(() => {
    if (!isKeyboardActive || disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Do NOT intercept if the user is typing into any input, textarea, select, or editable element
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const currentPos = positionRef.current;
      const currentRange = rangeRef.current;
      const currentStep = currentRange.step || 0.1;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const nextX = Math.max(currentRange.minX, +(currentPos.x - currentStep).toFixed(2));
        onChangeRef.current({ ...currentPos, x: nextX });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextX = Math.min(currentRange.maxX, +(currentPos.x + currentStep).toFixed(2));
        onChangeRef.current({ ...currentPos, x: nextX });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const nextY = Math.min(currentRange.maxY, +(currentPos.y + currentStep).toFixed(2));
        onChangeRef.current({ ...currentPos, y: nextY });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextY = Math.max(currentRange.minY, +(currentPos.y - currentStep).toFixed(2));
        onChangeRef.current({ ...currentPos, y: nextY });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isKeyboardActive, disabled]);

  const isAtDefault = Math.abs(position.x) < 0.001 && Math.abs(position.y) < 0.001;

  return (
    <div
      data-testid="model-position-controls"
      className={`bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 sm:p-3.5 shadow-md flex flex-col gap-2.5 text-slate-200 text-xs select-none transition-all ${
        isKeyboardActive ? 'ring-1 ring-sky-500/50 border-sky-800/80' : ''
      } ${className}`}
      onClick={() => {
        if (!isKeyboardActive && onToggleKeyboardActive) {
          onToggleKeyboardActive(true);
        }
      }}
    >
      {/* Top Header Strip */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
            <Move className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-white text-[11px] sm:text-xs tracking-wide uppercase flex items-center gap-1.5">
            <span>3D Model Position</span>
            <span className="text-[10px] font-normal text-slate-400 capitalize hidden sm:inline">
              (X / Y World Shift)
            </span>
          </span>
        </div>

        {/* Keyboard Active Status Pill / Toggle Button */}
        {onToggleKeyboardActive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleKeyboardActive(!isKeyboardActive);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono transition-all cursor-pointer ${
              isKeyboardActive
                ? 'bg-sky-950 text-sky-300 border border-sky-700/80 shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
            title={
              isKeyboardActive
                ? 'Arrow keys active: Use ← → for X, ↑ ↓ for Y. Click to deactivate.'
                : 'Click to enable arrow key controls for this 3D model'
            }
          >
            <Keyboard
              className={`w-3 h-3 ${isKeyboardActive ? 'text-sky-400 animate-pulse' : 'text-slate-500'}`}
            />
            <span>{isKeyboardActive ? 'Arrow Keys Active (← → ↑ ↓)' : 'Enable Arrow Keys'}</span>
          </button>
        )}
      </div>

      {/* Sliders Grid: X and Y Position */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* X-Axis Horizontal Shift Slider */}
        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <span className="text-sky-400 font-bold font-mono">X Position:</span>
              <span className="text-slate-500 text-[10px]">(Horizontal)</span>
            </span>
            <span
              data-testid="pos-x-indicator"
              className="font-mono font-bold text-white bg-slate-800/80 px-1.5 py-0.5 rounded text-[10px] border border-slate-700"
            >
              {position.x >= 0 ? '+' : ''}
              {position.x.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-slate-400 shrink-0 flex items-center gap-0.5">
              <ArrowLeft className="w-2.5 h-2.5" /> Left
            </span>
            <input
              type="range"
              aria-label="X Position (Horizontal)"
              disabled={disabled}
              min={range.minX}
              max={range.maxX}
              step={step}
              value={position.x}
              onChange={(e) => {
                const nextX = parseFloat(e.target.value);
                onChange({ ...position, x: nextX });
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition-all focus:outline-none"
            />
            <span className="text-[9px] font-mono text-slate-400 shrink-0 flex items-center gap-0.5">
              Right <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>

        {/* Y-Axis Vertical Shift Slider */}
        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <span className="text-emerald-400 font-bold font-mono">Y Position:</span>
              <span className="text-slate-500 text-[10px]">(Vertical)</span>
            </span>
            <span
              data-testid="pos-y-indicator"
              className="font-mono font-bold text-white bg-slate-800/80 px-1.5 py-0.5 rounded text-[10px] border border-slate-700"
            >
              {position.y >= 0 ? '+' : ''}
              {position.y.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-slate-400 shrink-0 flex items-center gap-0.5">
              <ArrowDown className="w-2.5 h-2.5" /> Down
            </span>
            <input
              type="range"
              aria-label="Y Position (Vertical)"
              disabled={disabled}
              min={range.minY}
              max={range.maxY}
              step={step}
              value={position.y}
              onChange={(e) => {
                const nextY = parseFloat(e.target.value);
                onChange({ ...position, y: nextY });
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all focus:outline-none"
            />
            <span className="text-[9px] font-mono text-slate-400 shrink-0 flex items-center gap-0.5">
              Up <ArrowUp className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Action Strip: Reset Position Button & Guidance */}
      <div className="flex items-center justify-between gap-3 pt-0.5 flex-wrap">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          disabled={disabled || isAtDefault}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isAtDefault
              ? 'bg-slate-800/50 text-slate-500 border border-slate-800 cursor-default'
              : 'bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white border border-slate-700 shadow-xs active:scale-95'
          }`}
          title="Restore model's original initial X and Y position (preserves camera rotation and zoom)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Position</span>
        </button>

        <p className="text-[10px] text-slate-400 italic">
          Shifts model in world space · Mouse drag orbits &amp; scroll zooms independently
        </p>
      </div>
    </div>
  );
};
