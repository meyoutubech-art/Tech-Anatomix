import { ScientificModelSpec, ModelAudioConfig, ModelAudioCategory } from '../types/aiModel';
import { ReactionDefinition } from '../types/chemistry';

export const AUDIO_SETTINGS_STORAGE_KEY = 'tech_anatomix_audio_settings_v1';

export interface GlobalAudioSettings {
  enabled: boolean;
  masterVolume: number;      // 0.0 to 1.0
  simulationVolume: number;  // 0.0 to 1.0
  uiVolume: number;          // 0.0 to 1.0
}

export const DEFAULT_AUDIO_SETTINGS: GlobalAudioSettings = {
  enabled: true,
  masterVolume: 0.75,
  simulationVolume: 0.85,
  uiVolume: 0.60,
};

export type UiSoundFeedbackType =
  | 'ai_request_accepted'
  | 'ai_completion'
  | 'reaction_complete'
  | 'validation_warning'
  | 'dissection_complete'
  | 'button_subtle';

export type ActiveLoopKind =
  | 'heartbeat'
  | 'respiration'
  | 'chemistry_effervescence'
  | 'chemistry_boiling'
  | 'chemistry_foaming'
  | 'model_rotational_motor'
  | 'model_oscillation_pendulum'
  | 'model_fluid_flow'
  | 'model_thermal_boiling'
  | 'model_electromagnetic_hum'
  | 'model_electric_bell'
  | 'model_wave_propagation';

export interface ActiveLoopDescriptor {
  loopId: string;
  sourceId: string;
  kind: ActiveLoopKind;
  isPaused: boolean;
  frequencyHz: number;
  gainLevel: number;
  rateOrBpm: number;
  metadata: Record<string, any>;
  startedAt: number;
  updatedAt: number;
}

export interface TriggeredAudioEventRecord {
  id: string;
  category: 'reagent_addition' | 'chemistry_reaction_burst' | 'surgical_incision' | 'collision_impact' | 'projectile_event' | 'ui_feedback';
  subtype: string;
  sourceId: string;
  dedupeKey?: string;
  timestamp: number;
  gainLevel: number;
  frequencyHz: number;
  metadata: Record<string, any>;
}

interface WebAudioLoopNodes {
  oscillators: OscillatorNode[];
  noiseSource?: AudioBufferSourceNode;
  filter?: BiquadFilterNode;
  gain: GainNode;
  lfo?: OscillatorNode;
  lfoGain?: GainNode;
  intervalTimer?: ReturnType<typeof setInterval> | null;
}

function clamp01(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.max(0, Math.min(1, val));
}

function clampRange(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, val));
}

/**
 * Resolves a validated ModelAudioConfig for any preset or AI-synthesized 3D model.
 * Static or non-audible models return { enabled: false, category: 'none', parameterKeys: [] }
 * so the application never fabricates motor or physics audio where none is justified.
 */
export function resolveValidatedModelAudioConfig(
  modelSpec: ScientificModelSpec | null | undefined
): ModelAudioConfig {
  if (!modelSpec) {
    return { enabled: false, category: 'none', parameterKeys: [] };
  }

  // 1. Honor explicit validated audioConfig if provided on the spec
  if (modelSpec.audioConfig) {
    const cfg = modelSpec.audioConfig;
    if (!cfg.enabled || cfg.category === 'none') {
      return { enabled: false, category: 'none', parameterKeys: [] };
    }
    return cfg;
  }

  const id = (modelSpec.id || '').toLowerCase();
  const fType = (modelSpec.functionalType || '').toLowerCase();
  const title = (modelSpec.title || '').toLowerCase();
  const paramKeys = Object.keys(modelSpec.parameters || {});

  // 2. Biological Heart / Cardiac Models
  if (
    id !== 'blood-transport' &&
    fType !== 'blood-transport' &&
    (id === 'heart-explorer' ||
      id === 'human-heart' ||
      id === 'cardiac-cycle' ||
      fType === 'heart-explorer' ||
      fType === 'human-heart' ||
      fType === 'cardiac-cycle' ||
      /\bheart\b/.test(title))
  ) {
    return {
      enabled: true,
      category: 'cardiac_pulse',
      parameterKeys: paramKeys.filter((k) => /bpm|rate|heart|speed|pulse/i.test(k)),
      baseFrequencyHz: 58,
      description: 'Cardiac S1/S2 lub-dub valve closure synchronized to BPM',
    };
  }

  // 3. Biological Respiratory / Lung Models
  if (
    id === 'respiratory-explorer' ||
    id === 'respiratory-system' ||
    fType === 'respiratory-explorer' ||
    fType === 'respiratory-system' ||
    /\b(respiratory|lung|breathing|alveol)\b/.test(title)
  ) {
    return {
      enabled: true,
      category: 'respiratory_airflow',
      parameterKeys: paramKeys.filter((k) => /breath|respir|rate|speed|ventilation|volume/i.test(k)),
      baseFrequencyHz: 240,
      description: 'Bronchial inhalation/exhalation airflow synchronized to breathing rate',
    };
  }

  // 4. Electric Bell Mechanism
  if (id === 'electric-bell' || fType === 'electric-bell' || /\belectric bell\b/.test(title)) {
    return {
      enabled: true,
      category: 'electric_bell',
      parameterKeys: paramKeys,
      baseFrequencyHz: 880,
      description: 'Electromagnetic interrupter gong strike synchronized to striker cycle',
    };
  }

  // 5. Newton's Cradle Collision Model
  if (id === 'newtons-cradle' || fType === 'newtons-cradle' || /\bnewton.*cradle\b/.test(title)) {
    return {
      enabled: true,
      category: 'collision_cradle',
      parameterKeys: paramKeys,
      baseFrequencyHz: 2200,
      description: 'Elastic steel sphere momentum transfer clink on impact',
    };
  }

  // 6. Pendulum & Harmonic Oscillators
  if (
    id === 'simple-pendulum' ||
    id === 'pendulum' ||
    id === 'pendulum-harmonics' ||
    id === 'shm-coupled-oscillators-lab' ||
    fType === 'pendulum-harmonics' ||
    fType === 'shm-coupled-oscillators-lab' ||
    /\b(pendulum|harmonic oscillator|coupled oscillator|spring mass)\b/.test(title)
  ) {
    return {
      enabled: true,
      category: 'oscillation_pendulum',
      parameterKeys: paramKeys.filter((k) => /length|gravity|angle|freq|stiff|mass|speed|damp/i.test(k)),
      baseFrequencyHz: 140,
      description: 'Harmonic oscillation air-whoosh and phase cadence synchronized to period T',
    };
  }

  // 7. Rotating Electromechanical & Turbine Systems
  if (
    id === 'motor' ||
    id === 'dc-motor-assembly' ||
    id === 'ac-generator' ||
    id === 'four-stroke-engine' ||
    id === 'hydroelectric-power' ||
    id === 'motor-generator-energy-explorer' ||
    id === 'gyroscope-torque-angular-momentum-lab' ||
    fType === 'dc-motor-assembly' ||
    fType === 'ac-generator' ||
    fType === 'four-stroke-engine' ||
    fType === 'hydroelectric-power' ||
    fType === 'motor-generator-energy-explorer' ||
    fType === 'gyroscope-torque-angular-momentum-lab' ||
    /\b(dc motor|electric motor|ac generator|turbine|wind turbine|centrifuge|four-stroke engine|otto engine|gyroscope|fan|propeller)\b/.test(
      title
    )
  ) {
    return {
      enabled: true,
      category: 'rotational_motor',
      parameterKeys: paramKeys.filter((k) =>
        /rpm|speed|voltage|current|flow|head|field|spin|freq|torque|throttle/i.test(k)
      ),
      baseFrequencyHz: 95,
      minSpeedThreshold: 0.02,
      description: 'Rotational harmonic hum scaled to angular velocity and load',
    };
  }

  // 8. Fluid Flow & Hemodynamic Transport Models
  if (
    id === 'hydraulic-lift' ||
    id === 'fluid-dynamics-bernoulli-vortex' ||
    id === 'blood-circulation-microscope' ||
    id === 'blood-transport' ||
    fType === 'hydraulic-lift' ||
    fType === 'fluid-dynamics-bernoulli-vortex' ||
    fType === 'blood-circulation-microscope' ||
    fType === 'blood-transport' ||
    /\b(bernoulli|venturi|fluid flow|hydraulic|blood flow|hemodynamic)\b/.test(title)
  ) {
    return {
      enabled: true,
      category: 'fluid_flow',
      parameterKeys: paramKeys.filter((k) => /flow|velocity|speed|pressure|force|area|constriction|viscosity/i.test(k)),
      baseFrequencyHz: 320,
      description: 'Laminar/turbulent fluid stream modulated by flow velocity and pressure',
    };
  }

  // 9. Thermal & Heat Engine Models
  if (
    id === 'heat-transfer-explorer' ||
    id === 'thermodynamics-carnot-heat-engine' ||
    fType === 'heat-transfer-explorer' ||
    fType === 'thermodynamics-carnot-heat-engine' ||
    /\b(carnot|heat engine|steam engine|boiling)\b/.test(title)
  ) {
    return {
      enabled: true,
      category: 'thermal_boiling',
      parameterKeys: paramKeys.filter((k) => /temp|heat|hot|cold|speed|power/i.test(k)),
      baseFrequencyHz: 180,
      description: 'Thermal convection/cycle acoustic modulation scaled by temperature differential',
    };
  }

  // 10. Electromagnetic Induction, AC Transformer & RLC Resonance
  if (
    id === 'electromagnetic-induction' ||
    id === 'faraday-law-induction-explorer' ||
    id === 'ac-voltage-transformer-explorer' ||
    id === 'ac-circuits-rlc-resonance-lab' ||
    id === 'motor-effect-fleming' ||
    fType === 'electromagnetic-induction' ||
    fType === 'faraday-law-induction-explorer' ||
    fType === 'ac-voltage-transformer-explorer' ||
    fType === 'ac-circuits-rlc-resonance-lab' ||
    fType === 'motor-effect-fleming' ||
    /\b(transformer|rlc circuit|faraday|solenoid induction)\b/.test(title)
  ) {
    return {
      enabled: true,
      category: 'electromagnetic_hum',
      parameterKeys: paramKeys.filter((k) => /freq|voltage|current|turns|field|speed|induct|capacit/i.test(k)),
      baseFrequencyHz: 100,
      description: 'Electromagnetic core & AC excitation hum scaled to frequency and flux linkage',
    };
  }

  // 11. Acoustic / Doppler / Wave Propagation Models
  if (
    id === 'sound-wave' ||
    id === 'wave-motion' ||
    id === 'doppler-effect-sonic-boom-explorer' ||
    id === 'doppler-ultrasound-flow-explorer' ||
    id === 'wave-interference-diffraction-lab' ||
    fType === 'sound-wave' ||
    fType === 'wave-motion' ||
    fType === 'doppler-effect-sonic-boom-explorer' ||
    fType === 'doppler-ultrasound-flow-explorer' ||
    fType === 'wave-interference-diffraction-lab' ||
    /\b(doppler|sonic boom|sound wave|acoustic)\b/.test(title)
  ) {
    return {
      enabled: true,
      category: 'wave_propagation',
      parameterKeys: paramKeys.filter((k) => /freq|speed|mach|velocity|amplitude|wavelength/i.test(k)),
      baseFrequencyHz: 220,
      description: 'Acoustic wavefront pitch and Doppler shift synchronized to wave frequency and Mach ratio',
    };
  }

  // 12. Check custom AI-generated 3D models for genuine dynamic physical parts + speed parameters
  const parts = modelSpec.parts || [];
  const hasRotatingMechanismPart = parts.some(
    (p) =>
      p.animation?.type === 'spin' &&
      (p.kinematicRole === 'rotor' ||
        p.kinematicRole === 'crank' ||
        /\b(rotor|shaft|turbine|blade|impeller|fan|wheel|armature|gear|propeller|flywheel)\b/i.test(
          `${p.id} ${p.name} ${p.label || ''}`
        ))
  );
  const speedParams = paramKeys.filter((k) => {
    const p = modelSpec.parameters?.[k];
    return (
      p &&
      (p.affects === 'animationSpeed' ||
        /\b(rpm|speed|velocity|frequency|voltage|flow|rate)\b/i.test(`${p.id} ${p.name} ${p.unit}`))
    );
  });

  if (hasRotatingMechanismPart && speedParams.length > 0) {
    return {
      enabled: true,
      category: 'rotational_motor',
      parameterKeys: speedParams,
      baseFrequencyHz: 95,
      minSpeedThreshold: 0.02,
      description: 'Custom 3D rotating mechanism synchronized to animation speed parameter',
    };
  }

  const hasOscillatingMechanismPart = parts.some(
    (p) =>
      p.animation?.type === 'oscillate' &&
      (p.kinematicRole === 'pendulum-arm-1' ||
        p.kinematicRole === 'pendulum-arm-2' ||
        p.kinematicRole === 'piston' ||
        /\b(pendulum|bob|oscillator|piston|spring|diaphragm)\b/i.test(`${p.id} ${p.name} ${p.label || ''}`))
  );
  if (hasOscillatingMechanismPart && speedParams.length > 0) {
    return {
      enabled: true,
      category: 'oscillation_pendulum',
      parameterKeys: speedParams,
      baseFrequencyHz: 135,
      description: 'Custom 3D oscillating mechanism synchronized to oscillation rate',
    };
  }

  // Static or purely structural/optical/molecular models remain silent
  return {
    enabled: false,
    category: 'none',
    parameterKeys: [],
  };
}

/**
 * Shared State-Driven Audio Engine for Tech-Anatomix
 */
export class StateDrivenSoundEngine {
  private ctx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGainNode: GainNode | null = null;
  private simGainNode: GainNode | null = null;
  private uiGainNode: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private settings: GlobalAudioSettings = { ...DEFAULT_AUDIO_SETTINGS };
  private listeners: Set<(settings: GlobalAudioSettings) => void> = new Set();

  // State-driven loop & event registries (also inspectable in headless/Node tests)
  private activeLoops: Map<string, ActiveLoopDescriptor> = new Map();
  private webAudioLoops: Map<string, WebAudioLoopNodes> = new Map();
  private eventLog: TriggeredAudioEventRecord[] = [];
  private dedupeRegistry: Map<string, number> = new Map();
  private violentReactionPlayedSet: Set<string> = new Set();

  private unlockListenersBound = false;

  constructor() {
    this.loadSettingsFromStorage();
    this.bindAutoplayUnlockListeners();
  }

  private loadSettingsFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.settings = {
            enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_AUDIO_SETTINGS.enabled,
            masterVolume:
              typeof parsed.masterVolume === 'number'
                ? clamp01(parsed.masterVolume)
                : DEFAULT_AUDIO_SETTINGS.masterVolume,
            simulationVolume:
              typeof parsed.simulationVolume === 'number'
                ? clamp01(parsed.simulationVolume)
                : DEFAULT_AUDIO_SETTINGS.simulationVolume,
            uiVolume:
              typeof parsed.uiVolume === 'number' ? clamp01(parsed.uiVolume) : DEFAULT_AUDIO_SETTINGS.uiVolume,
          };
        }
      }
    } catch {
      // Ignore storage errors in restricted environments
    }
  }

  private saveSettingsToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
      }
    } catch {
      // Ignore storage errors
    }
  }

  private bindAutoplayUnlockListeners(): void {
    if (this.unlockListenersBound || typeof window === 'undefined' || typeof document === 'undefined') return;
    this.unlockListenersBound = true;

    const unlock = () => {
      if (this.ctx && this.ctx.state === 'suspended' && this.settings.enabled) {
        this.ctx.resume().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  private ensureAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.settings.enabled) return null;

    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return null;
        const ctx: AudioContext = new AudioCtx();
        this.ctx = ctx;

        // Build master limiter & gain buses to prevent clipping
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.setValueAtTime(-14, ctx.currentTime);
        comp.knee.setValueAtTime(18, ctx.currentTime);
        comp.ratio.setValueAtTime(8, ctx.currentTime);
        comp.attack.setValueAtTime(0.003, ctx.currentTime);
        comp.release.setValueAtTime(0.18, ctx.currentTime);

        const masterGain = ctx.createGain();
        const simGain = ctx.createGain();
        const uiGain = ctx.createGain();

        simGain.connect(masterGain);
        uiGain.connect(masterGain);
        masterGain.connect(comp);
        comp.connect(ctx.destination);

        this.compressor = comp;
        this.masterGainNode = masterGain;
        this.simGainNode = simGain;
        this.uiGainNode = uiGain;

        this.applyBusVolumes();
      }

      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      return this.ctx;
    } catch {
      return null;
    }
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const durationSec = 2.0;
    const length = Math.floor(ctx.sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Pink-weighted soft noise for realistic fluid, airflow, and effervescence
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  private applyBusVolumes(): void {
    const effectiveMaster = this.settings.enabled ? this.settings.masterVolume : 0;
    const effectiveSim = this.settings.enabled ? this.settings.simulationVolume : 0;
    const effectiveUi = this.settings.enabled ? this.settings.uiVolume : 0;

    if (this.ctx && this.masterGainNode && this.simGainNode && this.uiGainNode) {
      const now = this.ctx.currentTime;
      this.masterGainNode.gain.setTargetAtTime(effectiveMaster, now, 0.025);
      this.simGainNode.gain.setTargetAtTime(effectiveSim, now, 0.025);
      this.uiGainNode.gain.setTargetAtTime(effectiveUi, now, 0.025);
    }
  }

  // ===========================================================================
  // GLOBAL AUDIO SETTINGS & SUBSCRIPTIONS
  // ===========================================================================

  public getSettings(): GlobalAudioSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<GlobalAudioSettings>): GlobalAudioSettings {
    const next: GlobalAudioSettings = {
      enabled: typeof partial.enabled === 'boolean' ? partial.enabled : this.settings.enabled,
      masterVolume:
        typeof partial.masterVolume === 'number' ? clamp01(partial.masterVolume) : this.settings.masterVolume,
      simulationVolume:
        typeof partial.simulationVolume === 'number'
          ? clamp01(partial.simulationVolume)
          : this.settings.simulationVolume,
      uiVolume: typeof partial.uiVolume === 'number' ? clamp01(partial.uiVolume) : this.settings.uiVolume,
    };

    const wasEnabled = this.settings.enabled;
    this.settings = next;
    this.saveSettingsToStorage();
    this.applyBusVolumes();

    if (wasEnabled && !next.enabled) {
      // Muting stops all active continuous sound loops cleanly
      this.stopAllLoops();
    }

    this.listeners.forEach((cb) => {
      try {
        cb(this.getSettings());
      } catch {}
    });

    return this.getSettings();
  }

  public toggleMute(): boolean {
    const updated = this.updateSettings({ enabled: !this.settings.enabled });
    return updated.enabled;
  }

  public subscribe(listener: (settings: GlobalAudioSettings) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getEffectiveSimulationGain(rawGain = 1.0): number {
    if (!this.settings.enabled) return 0;
    return clamp01(rawGain * this.settings.masterVolume * this.settings.simulationVolume);
  }

  public getEffectiveUiGain(rawGain = 1.0): number {
    if (!this.settings.enabled) return 0;
    return clamp01(rawGain * this.settings.masterVolume * this.settings.uiVolume);
  }

  // ===========================================================================
  // INSPECTION & TEST TELEMETRY HELPERS
  // ===========================================================================

  public getActiveLoops(): ActiveLoopDescriptor[] {
    return Array.from(this.activeLoops.values()).map((l) => ({
      ...l,
      metadata: { ...l.metadata },
    }));
  }

  public getActiveLoop(loopId: string): ActiveLoopDescriptor | undefined {
    const found = this.activeLoops.get(loopId);
    return found ? { ...found, metadata: { ...found.metadata } } : undefined;
  }

  public getActiveLoopsBySource(sourceId: string): ActiveLoopDescriptor[] {
    return this.getActiveLoops().filter((l) => l.sourceId === sourceId);
  }

  public getEventLog(): TriggeredAudioEventRecord[] {
    return [...this.eventLog];
  }

  public clearEventLog(): void {
    this.eventLog = [];
    this.dedupeRegistry.clear();
    this.violentReactionPlayedSet.clear();
  }

  private recordEvent(
    event: Omit<TriggeredAudioEventRecord, 'id' | 'timestamp'>,
    dedupeWindowMs = 60
  ): boolean {
    if (!this.settings.enabled) return false;
    const now = Date.now();
    if (event.dedupeKey) {
      const prevTime = this.dedupeRegistry.get(event.dedupeKey);
      if (prevTime !== undefined && now - prevTime < dedupeWindowMs) {
        return false; // Deduplicated rerender/duplicate trigger
      }
      this.dedupeRegistry.set(event.dedupeKey, now);
    }

    const record: TriggeredAudioEventRecord = {
      ...event,
      id: `${event.category}_${now}_${this.eventLog.length + 1}`,
      timestamp: now,
    };
    this.eventLog.push(record);
    if (this.eventLog.length > 200) {
      this.eventLog.shift();
    }
    return true;
  }

  // ===========================================================================
  // LOOP LIFECYCLE & CLEANUP
  // ===========================================================================

  public stopLoop(loopId: string): void {
    const nodes = this.webAudioLoops.get(loopId);
    if (nodes) {
      if (nodes.intervalTimer) {
        clearInterval(nodes.intervalTimer);
      }
      try {
        if (this.ctx) {
          nodes.gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.02);
        }
      } catch {}
      setTimeout(() => {
        nodes.oscillators.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        });
        if (nodes.noiseSource) {
          try {
            nodes.noiseSource.stop();
            nodes.noiseSource.disconnect();
          } catch {}
        }
        if (nodes.lfo) {
          try {
            nodes.lfo.stop();
            nodes.lfo.disconnect();
          } catch {}
        }
        try {
          nodes.gain.disconnect();
        } catch {}
      }, 35);
      this.webAudioLoops.delete(loopId);
    }
    this.activeLoops.delete(loopId);
  }

  public stopSource(sourceId: string): void {
    const matchingIds = Array.from(this.activeLoops.values())
      .filter((l) => l.sourceId === sourceId)
      .map((l) => l.loopId);
    matchingIds.forEach((id) => this.stopLoop(id));
  }

  public stopAllLoops(): void {
    const allIds = Array.from(this.activeLoops.keys());
    allIds.forEach((id) => this.stopLoop(id));
  }

  public resetSource(sourceId: string): void {
    this.stopSource(sourceId);
  }

  // ===========================================================================
  // 1. ANATOMY & BIOLOGICAL VISUALIZATION AUDIO
  // ===========================================================================

  /**
   * Synchronizes realistic cardiac S1/S2 lub-dub heartbeat cycle to the model's
   * actual BPM and play/pause state. Updates timing smoothly when BPM changes
   * without creating overlapping timers or duplicate audio loops.
   */
  public syncHeartbeat(params: {
    sourceId: string;
    active: boolean;
    bpm: number;
    isPlaying: boolean;
  }): void {
    const { sourceId, active, isPlaying } = params;
    const loopId = `${sourceId}::heartbeat`;

    if (!this.settings.enabled || !active || !isPlaying || !(params.bpm > 0)) {
      this.stopLoop(loopId);
      return;
    }

    const clampedBpm = clampRange(params.bpm, 25, 220);
    const beatIntervalMs = Math.round(60000 / clampedBpm);
    const freqHz = Number((48 + (clampedBpm - 60) * 0.18).toFixed(2));
    const gainLevel = this.getEffectiveSimulationGain(0.42);
    const now = Date.now();

    const existing = this.activeLoops.get(loopId);
    if (existing) {
      const bpmChanged = Math.abs(existing.rateOrBpm - clampedBpm) >= 0.5;
      existing.rateOrBpm = clampedBpm;
      existing.frequencyHz = freqHz;
      existing.gainLevel = gainLevel;
      existing.isPaused = false;
      existing.metadata = {
        ...existing.metadata,
        bpm: clampedBpm,
        beatIntervalMs,
      };
      existing.updatedAt = now;

      if (bpmChanged) {
        this.rebuildHeartbeatTimer(loopId, clampedBpm, freqHz);
      }
      return;
    }

    // Create new heartbeat descriptor
    this.activeLoops.set(loopId, {
      loopId,
      sourceId,
      kind: 'heartbeat',
      isPaused: false,
      frequencyHz: freqHz,
      gainLevel,
      rateOrBpm: clampedBpm,
      metadata: {
        bpm: clampedBpm,
        beatIntervalMs,
        pattern: 'S1-S2-lub-dub',
      },
      startedAt: now,
      updatedAt: now,
    });

    this.rebuildHeartbeatTimer(loopId, clampedBpm, freqHz);
  }

  private rebuildHeartbeatTimer(loopId: string, bpm: number, s1FreqHz: number): void {
    const existingWeb = this.webAudioLoops.get(loopId);
    if (existingWeb?.intervalTimer) {
      clearInterval(existingWeb.intervalTimer);
    }

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.simGainNode) return;

    const triggerSingleLubDub = () => {
      if (!this.settings.enabled || !this.activeLoops.has(loopId) || !this.ctx || !this.simGainNode) return;
      try {
        const desc = this.activeLoops.get(loopId);
        const currentBpm = desc?.rateOrBpm || bpm;
        const baseFreq = desc?.frequencyHz || s1FreqHz;
        const nowTime = this.ctx.currentTime;

        // S1 ("Lub" - mitral/tricuspid closure)
        const s1Osc = this.ctx.createOscillator();
        const s1Gain = this.ctx.createGain();
        const s1Filter = this.ctx.createBiquadFilter();
        s1Filter.type = 'lowpass';
        s1Filter.frequency.setValueAtTime(130, nowTime);

        s1Osc.type = 'sine';
        s1Osc.frequency.setValueAtTime(baseFreq * 1.15, nowTime);
        s1Osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.72, nowTime + 0.09);

        s1Gain.gain.setValueAtTime(0.001, nowTime);
        s1Gain.gain.linearRampToValueAtTime(0.28, nowTime + 0.018);
        s1Gain.gain.exponentialRampToValueAtTime(0.001, nowTime + 0.11);

        s1Osc.connect(s1Filter);
        s1Filter.connect(s1Gain);
        s1Gain.connect(this.simGainNode);
        s1Osc.start(nowTime);
        s1Osc.stop(nowTime + 0.12);

        // S2 ("Dub" - aortic/pulmonary semilunar closure after systolic ejection)
        const systoleDelaySec = clampRange((60 / currentBpm) * 0.32, 0.14, 0.34);
        const s2Time = nowTime + systoleDelaySec;

        const s2Osc = this.ctx.createOscillator();
        const s2Gain = this.ctx.createGain();
        const s2Filter = this.ctx.createBiquadFilter();
        s2Filter.type = 'lowpass';
        s2Filter.frequency.setValueAtTime(165, s2Time);

        s2Osc.type = 'triangle';
        s2Osc.frequency.setValueAtTime(baseFreq * 1.42, s2Time);
        s2Osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.92, s2Time + 0.075);

        s2Gain.gain.setValueAtTime(0.001, s2Time);
        s2Gain.gain.linearRampToValueAtTime(0.21, s2Time + 0.014);
        s2Gain.gain.exponentialRampToValueAtTime(0.001, s2Time + 0.085);

        s2Osc.connect(s2Filter);
        s2Filter.connect(s2Gain);
        s2Gain.connect(this.simGainNode);
        s2Osc.start(s2Time);
        s2Osc.stop(s2Time + 0.095);
      } catch {}
    };

    // Play immediate pulse on start, then schedule at exact BPM interval
    triggerSingleLubDub();
    const intervalMs = Math.max(260, Math.round(60000 / bpm));
    const timer = setInterval(triggerSingleLubDub, intervalMs);

    const dummyGain = ctx.createGain();
    this.webAudioLoops.set(loopId, {
      oscillators: [],
      gain: dummyGain,
      intervalTimer: timer,
    });
  }

  /**
   * Synchronizes soft bronchial inhalation/exhalation airflow to the model's
   * actual breathing rate (breaths per minute) and active animation state.
   */
  public syncRespiration(params: {
    sourceId: string;
    active: boolean;
    breathsPerMinute: number;
    isPlaying: boolean;
    tidalVolumeL?: number;
  }): void {
    const { sourceId, active, isPlaying } = params;
    const loopId = `${sourceId}::respiration`;

    if (!this.settings.enabled || !active || !isPlaying || !(params.breathsPerMinute > 0)) {
      this.stopLoop(loopId);
      return;
    }

    const clampedRate = clampRange(params.breathsPerMinute, 4, 60);
    const breathCycleSec = Number((60 / clampedRate).toFixed(2));
    const tidalFactor = clampRange((params.tidalVolumeL ?? 0.5) / 0.5, 0.5, 2.0);
    const centerFreqHz = Number((220 + clampedRate * 4.5).toFixed(1));
    const gainLevel = this.getEffectiveSimulationGain(0.18 * Math.min(1.3, tidalFactor));
    const now = Date.now();

    const existing = this.activeLoops.get(loopId);
    if (existing) {
      existing.rateOrBpm = clampedRate;
      existing.frequencyHz = centerFreqHz;
      existing.gainLevel = gainLevel;
      existing.isPaused = false;
      existing.metadata = {
        ...existing.metadata,
        breathsPerMinute: clampedRate,
        breathCycleSec,
        tidalVolumeL: params.tidalVolumeL ?? 0.5,
      };
      existing.updatedAt = now;

      const webLoop = this.webAudioLoops.get(loopId);
      if (webLoop && this.ctx) {
        const t = this.ctx.currentTime;
        if (webLoop.filter) {
          webLoop.filter.frequency.setTargetAtTime(centerFreqHz, t, 0.08);
        }
        if (webLoop.lfo) {
          webLoop.lfo.frequency.setTargetAtTime(clampedRate / 60, t, 0.08);
        }
      }
      return;
    }

    this.activeLoops.set(loopId, {
      loopId,
      sourceId,
      kind: 'respiration',
      isPaused: false,
      frequencyHz: centerFreqHz,
      gainLevel,
      rateOrBpm: clampedRate,
      metadata: {
        breathsPerMinute: clampedRate,
        breathCycleSec,
        tidalVolumeL: params.tidalVolumeL ?? 0.5,
      },
      startedAt: now,
      updatedAt: now,
    });

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.simGainNode) return;

    try {
      const noise = ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer(ctx);
      noise.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(centerFreqHz, ctx.currentTime);
      bandpass.Q.setValueAtTime(2.4, ctx.currentTime);

      const breathGain = ctx.createGain();
      breathGain.gain.setValueAtTime(0.04, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(clampedRate / 60, ctx.currentTime);
      lfoGain.gain.setValueAtTime(0.035 * tidalFactor, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(breathGain.gain);

      noise.connect(bandpass);
      bandpass.connect(breathGain);
      breathGain.connect(this.simGainNode);

      noise.start();
      lfo.start();

      this.webAudioLoops.set(loopId, {
        oscillators: [],
        noiseSource: noise,
        filter: bandpass,
        gain: breathGain,
        lfo,
        lfoGain,
      });
    } catch {}
  }

  /**
   * Plays subtle surgical incision feedback strictly driven by real cut progress and cut velocity.
   */
  public playSurgicalIncision(params: {
    sourceId: string;
    progress: number;
    velocity: number;
  }): boolean {
    if (!this.settings.enabled || params.velocity <= 0) return false;

    const progress = clamp01(params.progress);
    const speedFactor = clampRange(params.velocity, 0.1, 4.0);
    const freqHz = Number((260 + progress * 220 + speedFactor * 60).toFixed(1));
    const gainLevel = this.getEffectiveSimulationGain(0.06 * Math.min(1.5, 0.7 + speedFactor * 0.25));

    const recorded = this.recordEvent(
      {
        category: 'surgical_incision',
        subtype: 'tissue_incision_step',
        sourceId: params.sourceId,
        dedupeKey: `${params.sourceId}::incision::${Math.round(progress * 100)}`,
        gainLevel,
        frequencyHz: freqHz,
        metadata: {
          progress,
          velocity: params.velocity,
        },
      },
      25
    );

    if (!recorded) return false;

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.simGainNode) return true;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freqHz * 1.8, now);
      filter.Q.setValueAtTime(2.8, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freqHz, now);
      osc.frequency.exponentialRampToValueAtTime(freqHz * 1.35, now + 0.035);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.simGainNode);

      osc.start(now);
      osc.stop(now + 0.042);
    } catch {}

    return true;
  }

  // ===========================================================================
  // 2. CHEMISTRY LABORATORY & REACTION SIMULATION AUDIO
  // ===========================================================================

  /**
   * Plays realistic reagent addition audio ONLY when a reagent is genuinely accepted
   * into the beaker. Distinguishes liquid pouring vs. solid granular addition.
   */
  public playReagentAddition(params: {
    reagentId: string;
    name: string;
    state: 'liquid' | 'solid' | 'gas';
    amount: number;
    unit: string;
    dedupeKey?: string;
  }): boolean {
    if (!this.settings.enabled || !(params.amount > 0)) return false;

    const isSolid = params.state === 'solid' || params.unit.toLowerCase() === 'g';
    const subtype = isSolid ? 'solid_granular_add' : 'liquid_pour_add';
    const amountNorm = clampRange(params.amount / 50, 0.25, 1.8);
    const freqHz = isSolid ? Number((920 / Math.sqrt(amountNorm)).toFixed(1)) : Number((420 + amountNorm * 110).toFixed(1));
    const gainLevel = this.getEffectiveSimulationGain(isSolid ? 0.24 : 0.30);

    const recorded = this.recordEvent(
      {
        category: 'reagent_addition',
        subtype,
        sourceId: 'chemistry-lab',
        dedupeKey: params.dedupeKey || `reagent_add::${params.reagentId}::${params.amount}`,
        gainLevel,
        frequencyHz: freqHz,
        metadata: {
          reagentId: params.reagentId,
          name: params.name,
          state: params.state,
          amount: params.amount,
          unit: params.unit,
        },
      },
      45
    );

    if (!recorded) return false;

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.simGainNode) return true;

    try {
      const now = ctx.currentTime;
      if (isSolid) {
        // Granular / crystalline solid addition: 3 micro-clinks against Pyrex glass
        const grainCount = 3;
        for (let i = 0; i < grainCount; i++) {
          const t0 = now + i * 0.045;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const grainFreq = freqHz * (0.92 + i * 0.11);
          osc.frequency.setValueAtTime(grainFreq, t0);
          osc.frequency.exponentialRampToValueAtTime(grainFreq * 0.65, t0 + 0.04);

          gain.gain.setValueAtTime(0.08, t0);
          gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.045);

          osc.connect(gain);
          gain.connect(this.simGainNode);
          osc.start(t0);
          osc.stop(t0 + 0.05);
        }
      } else {
        // Liquid pour stream: band-passed fluid stream + gentle meniscus droplet resonance
        const duration = clampRange(0.22 + amountNorm * 0.12, 0.22, 0.45);
        const noise = ctx.createBufferSource();
        noise.buffer = this.getNoiseBuffer(ctx);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freqHz * 0.85, now);
        filter.frequency.exponentialRampToValueAtTime(freqHz * 1.35, now + duration);
        filter.Q.setValueAtTime(3.2, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.simGainNode);
        noise.start(now);
        noise.stop(now + duration + 0.02);

        // Subtle fluid droplet pitch chirp
        const dropOsc = ctx.createOscillator();
        const dropGain = ctx.createGain();
        dropOsc.type = 'sine';
        dropOsc.frequency.setValueAtTime(freqHz, now + 0.05);
        dropOsc.frequency.exponentialRampToValueAtTime(freqHz * 1.65, now + 0.14);

        dropGain.gain.setValueAtTime(0.06, now + 0.05);
        dropGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        dropOsc.connect(dropGain);
        dropGain.connect(this.simGainNode);
        dropOsc.start(now + 0.05);
        dropOsc.stop(now + 0.16);
      }
    } catch {}

    return true;
  }

  /**
   * Synchronizes chemistry beaker & reaction audio strictly to confirmed reaction outcomes
   * and physical conditions (gas evolution, boiling at >= 100°C, violent combustion/foaming,
   * or silent homogeneous neutralization/precipitation).
   */
  public syncChemistryReactionState(params: {
    sourceId: string;
    hasLiquid: boolean;
    totalVolume: number;
    temperatureC: number;
    reactionProgress: number; // 0.0 to 1.0
    activeReaction: ReactionDefinition | null;
    reactionRunKey?: string;
  }): void {
    const {
      sourceId,
      hasLiquid,
      totalVolume,
      temperatureC,
      reactionProgress,
      activeReaction,
      reactionRunKey,
    } = params;

    const effLoopId = `${sourceId}::chemistry_effervescence`;
    const boilLoopId = `${sourceId}::chemistry_boiling`;
    const foamLoopId = `${sourceId}::chemistry_foaming`;

    if (!this.settings.enabled) {
      this.stopLoop(effLoopId);
      this.stopLoop(boilLoopId);
      this.stopLoop(foamLoopId);
      return;
    }

    const effects = activeReaction?.observableEffects;
    const isReactionOngoing = Boolean(activeReaction && reactionProgress < 0.995);

    // 1. Gas Evolution / Effervescence Loop (ONLY if reaction genuinely produces gas and is ongoing)
    const producesGas = Boolean(isReactionOngoing && effects?.producesGas);
    if (producesGas && activeReaction) {
      const rawVigor: unknown = effects?.gasVigor;
      const vigorMultiplier =
        typeof rawVigor === 'number'
          ? clampRange(rawVigor, 0.4, 1.6)
          : rawVigor === 'violent_foam'
            ? 1.5
            : rawVigor === 'vigorous'
              ? 1.25
              : rawVigor === 'gentle'
                ? 0.65
                : 1.0;
      const progressEnvelope = Math.max(0.15, 1.0 - reactionProgress * 0.75);
      const centerFreq = Number((580 + vigorMultiplier * 260).toFixed(1));
      const gainLevel = this.getEffectiveSimulationGain(0.24 * vigorMultiplier * progressEnvelope);

      this.upsertNoiseLoop({
        loopId: effLoopId,
        sourceId,
        kind: 'chemistry_effervescence',
        centerFreqHz: centerFreq,
        qFactor: 2.2,
        lfoRateHz: 6.5 * vigorMultiplier,
        gainLevel,
        metadata: {
          reactionId: activeReaction.id,
          gasName: effects?.gasName || 'Gas',
          gasVigor: vigorMultiplier,
          reactionProgress,
        },
      });
    } else {
      this.stopLoop(effLoopId);
    }

    // 2. Thermal Boiling Loop (ONLY when liquid is present in beaker and temperature >= 100°C)
    const isBoiling = Boolean(hasLiquid && totalVolume > 0 && temperatureC >= 100);
    if (isBoiling) {
      const superheatFactor = clampRange((temperatureC - 100) / 80 + 0.5, 0.5, 1.8);
      const boilFreq = Number((290 + superheatFactor * 95).toFixed(1));
      const gainLevel = this.getEffectiveSimulationGain(0.22 * Math.min(1.4, superheatFactor));

      this.upsertNoiseLoop({
        loopId: boilLoopId,
        sourceId,
        kind: 'chemistry_boiling',
        centerFreqHz: boilFreq,
        qFactor: 1.8,
        lfoRateHz: 4.8 * superheatFactor,
        gainLevel,
        metadata: {
          temperatureC,
          totalVolume,
        },
      });
    } else {
      this.stopLoop(boilLoopId);
    }

    // 3. Supported Violent Reaction / Foaming Fountain / Alkali-Water Combustion
    const isViolentOrFoaming = Boolean(
      isReactionOngoing &&
        activeReaction &&
        (effects?.isViolent ||
          effects?.hazardType === 'explosion' ||
          effects?.hazardType === 'foaming_fountain')
    );

    if (isViolentOrFoaming && activeReaction) {
      const runKey = reactionRunKey || `${activeReaction.id}`;
      if (!this.violentReactionPlayedSet.has(runKey)) {
        this.violentReactionPlayedSet.add(runKey);
        const isExplosion = Boolean(effects?.isViolent || effects?.hazardType === 'explosion');
        const subtype = isExplosion ? 'violent_combustion_burst' : 'foaming_fountain_surge';
        const gainLevel = this.getEffectiveSimulationGain(isExplosion ? 0.45 : 0.34);

        this.recordEvent(
          {
            category: 'chemistry_reaction_burst',
            subtype,
            sourceId,
            dedupeKey: `violent_burst::${runKey}`,
            gainLevel,
            frequencyHz: isExplosion ? 110 : 340,
            metadata: {
              reactionId: activeReaction.id,
              hazardType: effects?.hazardType || 'exothermic',
              isViolent: Boolean(effects?.isViolent),
            },
          },
          200
        );

        this.playViolentBurstSynthesis(isExplosion);
      }

      // Sustain foaming / rapid exothermic surge loop while reaction progresses
      const progressEnv = Math.max(0.1, 1.0 - reactionProgress * 0.85);
      this.upsertNoiseLoop({
        loopId: foamLoopId,
        sourceId,
        kind: 'chemistry_foaming',
        centerFreqHz: effects?.isViolent ? 210 : 440,
        qFactor: 1.5,
        lfoRateHz: 9.0,
        gainLevel: this.getEffectiveSimulationGain(0.28 * progressEnv),
        metadata: {
          reactionId: activeReaction.id,
          hazardType: effects?.hazardType,
          reactionProgress,
        },
      });
    } else {
      this.stopLoop(foamLoopId);
    }
  }

  private playViolentBurstSynthesis(isExplosion: boolean): void {
    const ctx = this.ensureAudioContext();
    if (!ctx || !this.simGainNode) return;
    try {
      const now = ctx.currentTime;
      // Low-frequency combustion thump + filtered noise whoosh
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = isExplosion ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(isExplosion ? 135 : 220, now);
      osc.frequency.exponentialRampToValueAtTime(isExplosion ? 38 : 95, now + 0.45);

      oscGain.gain.setValueAtTime(0.001, now);
      oscGain.gain.linearRampToValueAtTime(isExplosion ? 0.32 : 0.20, now + 0.025);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(oscGain);
      oscGain.connect(this.simGainNode);
      osc.start(now);
      osc.stop(now + 0.52);

      const noise = ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isExplosion ? 950 : 1400, now);
      filter.frequency.exponentialRampToValueAtTime(220, now + 0.65);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.24, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.simGainNode);
      noise.start(now);
      noise.stop(now + 0.7);
    } catch {}
  }

  private upsertNoiseLoop(opts: {
    loopId: string;
    sourceId: string;
    kind: ActiveLoopKind;
    centerFreqHz: number;
    qFactor: number;
    lfoRateHz: number;
    gainLevel: number;
    metadata: Record<string, any>;
  }): void {
    const now = Date.now();
    const existing = this.activeLoops.get(opts.loopId);
    if (existing) {
      existing.frequencyHz = opts.centerFreqHz;
      existing.gainLevel = opts.gainLevel;
      existing.rateOrBpm = opts.lfoRateHz;
      existing.isPaused = false;
      existing.metadata = { ...existing.metadata, ...opts.metadata };
      existing.updatedAt = now;

      const web = this.webAudioLoops.get(opts.loopId);
      if (web && this.ctx) {
        const t = this.ctx.currentTime;
        if (web.filter) web.filter.frequency.setTargetAtTime(opts.centerFreqHz, t, 0.06);
        if (web.lfo) web.lfo.frequency.setTargetAtTime(opts.lfoRateHz, t, 0.06);
        web.gain.gain.setTargetAtTime(Math.max(0.001, opts.gainLevel * 0.35), t, 0.06);
      }
      return;
    }

    this.activeLoops.set(opts.loopId, {
      loopId: opts.loopId,
      sourceId: opts.sourceId,
      kind: opts.kind,
      isPaused: false,
      frequencyHz: opts.centerFreqHz,
      gainLevel: opts.gainLevel,
      rateOrBpm: opts.lfoRateHz,
      metadata: { ...opts.metadata },
      startedAt: now,
      updatedAt: now,
    });

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.simGainNode) return;

    try {
      const noise = ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer(ctx);
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(opts.centerFreqHz, ctx.currentTime);
      filter.Q.setValueAtTime(opts.qFactor, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(Math.max(0.001, opts.gainLevel * 0.35), ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(opts.lfoRateHz, ctx.currentTime);
      lfoGain.gain.setValueAtTime(0.025, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.simGainNode);

      noise.start();
      lfo.start();

      this.webAudioLoops.set(opts.loopId, {
        oscillators: [],
        noiseSource: noise,
        filter,
        gain,
        lfo,
        lfoGain,
      });
    } catch {}
  }

  // ===========================================================================
  // 3. THREE.JS PRESET & CUSTOM MODEL STATE-DRIVEN SYNCHRONIZATION
  // ===========================================================================

  /**
   * Synchronizes audio for any preset or custom 3D model based on its validated
   * ModelAudioConfig and real-time simulation parameters / play state.
   */
  public syncModelSimulationAudio(params: {
    sourceId: string;
    modelSpec: ScientificModelSpec | null | undefined;
    isPlaying: boolean;
    parameters: Record<string, number>;
    conditions?: Record<string, any>;
    liveMetrics?: {
      angularVelocityRadSec?: number;
      oscillationFreqHz?: number;
      linearSpeedMs?: number;
      flowRateNormalized?: number;
      temperatureC?: number;
      currentAmps?: number;
      bellStriking?: boolean;
    };
  }): void {
    const { sourceId, modelSpec, isPlaying, parameters, conditions = {}, liveMetrics } = params;

    if (!this.settings.enabled || !modelSpec || !isPlaying) {
      this.stopSource(sourceId);
      return;
    }

    const config = resolveValidatedModelAudioConfig(modelSpec);
    if (!config.enabled || config.category === 'none') {
      this.stopSource(sourceId);
      return;
    }

    // Check if a circuit/power switch condition explicitly disables motion/current
    if (
      conditions.switchClosed === false ||
      conditions.powerOn === false ||
      conditions.circuitClosed === false
    ) {
      this.stopSource(sourceId);
      return;
    }

    // Delegate biological heart & respiratory models to their specialized synchronizers
    if (config.category === 'cardiac_pulse') {
      const bpm =
        parameters.heartRate ??
        parameters.bpm ??
        parameters.pulseRate ??
        (parameters.animationSpeed ? 72 * parameters.animationSpeed : 72);
      this.syncHeartbeat({
        sourceId,
        active: true,
        bpm,
        isPlaying,
      });
      return;
    }

    if (config.category === 'respiratory_airflow') {
      const breathsPerMinute =
        parameters.breathingRate ??
        parameters.respirationRate ??
        (parameters.animationSpeed ? 15 * parameters.animationSpeed : 15);
      this.syncRespiration({
        sourceId,
        active: true,
        breathsPerMinute,
        isPlaying,
        tidalVolumeL: parameters.tidalVolume ?? 0.5,
      });
      return;
    }

    // Extract normalized intensity/speed metric from real simulation parameters
    const intensity = this.computeModelActivityIntensity(config, modelSpec, parameters, liveMetrics);
    const minThreshold = config.minSpeedThreshold ?? 0.01;

    if (intensity <= minThreshold) {
      this.stopSource(sourceId);
      return;
    }

    const loopKindMap: Record<Exclude<ModelAudioCategory, 'none' | 'cardiac_pulse' | 'respiratory_airflow' | 'collision_cradle'>, ActiveLoopKind> = {
      rotational_motor: 'model_rotational_motor',
      oscillation_pendulum: 'model_oscillation_pendulum',
      fluid_flow: 'model_fluid_flow',
      thermal_boiling: 'model_thermal_boiling',
      electromagnetic_hum: 'model_electromagnetic_hum',
      electric_bell: 'model_electric_bell',
      wave_propagation: 'model_wave_propagation',
    };

    if (config.category === 'collision_cradle') {
      // Newton's cradle uses discrete collision impacts via playCollisionImpact; no continuous hum needed
      return;
    }

    const loopKind = loopKindMap[config.category];
    const loopId = `${sourceId}::${loopKind}`;
    const baseFreq = config.baseFrequencyHz || 110;
    const targetFreqHz = Number((baseFreq * (0.65 + intensity * 0.85)).toFixed(2));
    const gainLevel = this.getEffectiveSimulationGain(clampRange(0.14 + intensity * 0.16, 0.06, 0.36));

    // Remove any obsolete loops on the same sourceId if model switched categories
    Array.from(this.activeLoops.values()).forEach((l) => {
      if (l.sourceId === sourceId && l.loopId !== loopId) {
        this.stopLoop(l.loopId);
      }
    });

    const now = Date.now();
    const existing = this.activeLoops.get(loopId);
    if (existing) {
      existing.frequencyHz = targetFreqHz;
      existing.gainLevel = gainLevel;
      existing.rateOrBpm = Number(intensity.toFixed(3));
      existing.isPaused = false;
      existing.metadata = {
        ...existing.metadata,
        modelId: modelSpec.id,
        category: config.category,
        intensity: Number(intensity.toFixed(3)),
        parameters: { ...parameters },
      };
      existing.updatedAt = now;

      const web = this.webAudioLoops.get(loopId);
      if (web && this.ctx) {
        const t = this.ctx.currentTime;
        web.oscillators.forEach((osc, idx) => {
          osc.frequency.setTargetAtTime(targetFreqHz * (idx === 0 ? 1 : 2), t, 0.05);
        });
        if (web.filter) {
          web.filter.frequency.setTargetAtTime(targetFreqHz * 2.4, t, 0.05);
        }
        web.gain.gain.setTargetAtTime(Math.max(0.001, gainLevel * 0.25), t, 0.05);
      }
      return;
    }

    this.activeLoops.set(loopId, {
      loopId,
      sourceId,
      kind: loopKind,
      isPaused: false,
      frequencyHz: targetFreqHz,
      gainLevel,
      rateOrBpm: Number(intensity.toFixed(3)),
      metadata: {
        modelId: modelSpec.id,
        category: config.category,
        intensity: Number(intensity.toFixed(3)),
        parameters: { ...parameters },
      },
      startedAt: now,
      updatedAt: now,
    });

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.simGainNode) return;

    try {
      if (config.category === 'fluid_flow' || config.category === 'thermal_boiling') {
        this.upsertNoiseLoop({
          loopId,
          sourceId,
          kind: loopKind,
          centerFreqHz: targetFreqHz,
          qFactor: 2.0,
          lfoRateHz: 3.5 * intensity,
          gainLevel,
          metadata: {
            modelId: modelSpec.id,
            category: config.category,
            intensity: Number(intensity.toFixed(3)),
          },
        });
      } else {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc1.type = config.category === 'electric_bell' ? 'triangle' : 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(targetFreqHz, ctx.currentTime);
        osc2.frequency.setValueAtTime(targetFreqHz * 2, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(targetFreqHz * 2.4, ctx.currentTime);

        gain.gain.setValueAtTime(Math.max(0.001, gainLevel * 0.22), ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.simGainNode);

        osc1.start();
        osc2.start();

        this.webAudioLoops.set(loopId, {
          oscillators: [osc1, osc2],
          filter,
          gain,
        });
      }
    } catch {}
  }

  private computeModelActivityIntensity(
    config: ModelAudioConfig,
    modelSpec: ScientificModelSpec,
    parameters: Record<string, number>,
    liveMetrics?: {
      angularVelocityRadSec?: number;
      oscillationFreqHz?: number;
      linearSpeedMs?: number;
      flowRateNormalized?: number;
      temperatureC?: number;
      currentAmps?: number;
      bellStriking?: boolean;
    }
  ): number {
    if (liveMetrics) {
      if (typeof liveMetrics.angularVelocityRadSec === 'number') {
        return clampRange(Math.abs(liveMetrics.angularVelocityRadSec) / 10, 0, 2.5);
      }
      if (typeof liveMetrics.oscillationFreqHz === 'number') {
        return clampRange(liveMetrics.oscillationFreqHz, 0, 2.5);
      }
      if (typeof liveMetrics.flowRateNormalized === 'number') {
        return clampRange(liveMetrics.flowRateNormalized, 0, 2.5);
      }
    }

    // For pendulum models: frequency f = 1 / (2π√(L/g)) increases when length L decreases or gravity g increases
    if (config.category === 'oscillation_pendulum') {
      const L = parameters.length ?? parameters.pendulumLength ?? 1.5;
      const g = parameters.gravity ?? 9.81;
      const angle = parameters.initialAngle ?? parameters.releaseAngle ?? 30;
      if (angle <= 0 || g <= 0 || L <= 0) return 0;
      const freqHz = 1 / (2 * Math.PI * Math.sqrt(L / g));
      return clampRange(freqHz * 2.2 * (angle / 30), 0.1, 2.5);
    }

    // Inspect relevant parameter keys on the modelSpec
    const keysToUse =
      config.parameterKeys.length > 0 ? config.parameterKeys : Object.keys(modelSpec.parameters || {});

    if (keysToUse.length === 0) return 0.6;

    let sumNormalized = 0;
    let count = 0;

    for (const key of keysToUse) {
      const val = parameters[key];
      const spec = modelSpec.parameters?.[key];
      if (typeof val === 'number') {
        if (val === 0 && /speed|rpm|voltage|current|flow|freq|velocity/i.test(key)) {
          return 0; // Zero drive parameter stops the mechanism
        }
        if (spec && spec.max > spec.min) {
          const norm = (val - Math.min(0, spec.min)) / (spec.max - Math.min(0, spec.min));
          sumNormalized += clampRange(norm, 0, 2.0);
          count++;
        } else {
          sumNormalized += clampRange(Math.abs(val) / 10, 0.1, 2.0);
          count++;
        }
      }
    }

    return count > 0 ? clampRange((sumNormalized / count) * 1.4, 0, 2.5) : 0.6;
  }

  /**
   * Plays a discrete mechanical collision / impact clink (e.g., Newton's Cradle sphere strike
   * or projectile launch/impact).
   */
  public playMechanicalImpact(params: {
    sourceId: string;
    subtype: 'cradle_sphere_impact' | 'projectile_launch' | 'projectile_ground_impact' | 'bell_gong_strike';
    impactVelocity: number;
    dedupeKey?: string;
  }): boolean {
    if (!this.settings.enabled || !(params.impactVelocity > 0.05)) return false;

    const velFactor = clampRange(params.impactVelocity / 5, 0.2, 2.0);
    const freqHz =
      params.subtype === 'cradle_sphere_impact'
        ? Number((2100 + velFactor * 320).toFixed(1))
        : params.subtype === 'bell_gong_strike'
          ? Number((1480 + velFactor * 180).toFixed(1))
          : Number((180 + velFactor * 90).toFixed(1));
    const gainLevel = this.getEffectiveSimulationGain(0.22 * Math.min(1.4, velFactor));

    const recorded = this.recordEvent(
      {
        category: params.subtype.startsWith('projectile') ? 'projectile_event' : 'collision_impact',
        subtype: params.subtype,
        sourceId: params.sourceId,
        dedupeKey: params.dedupeKey,
        gainLevel,
        frequencyHz: freqHz,
        metadata: {
          impactVelocity: params.impactVelocity,
        },
      },
      55
    );

    if (!recorded) return false;

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.simGainNode) return true;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = params.subtype.startsWith('projectile') ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freqHz, now);
      osc.frequency.exponentialRampToValueAtTime(freqHz * 0.55, now + 0.075);

      gain.gain.setValueAtTime(0.14 * Math.min(1.3, velFactor), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.simGainNode);
      osc.start(now);
      osc.stop(now + 0.085);
    } catch {}

    return true;
  }

  // ===========================================================================
  // 4. RESTRAINED UI & AI OPERATION FEEDBACK (NEVER PHYSICAL LAB SOUNDS)
  // ===========================================================================

  public playUiFeedback(type: UiSoundFeedbackType, dedupeKey?: string): boolean {
    if (!this.settings.enabled) return false;

    const freqMap: Record<UiSoundFeedbackType, number> = {
      ai_request_accepted: 523.25, // C5
      ai_completion: 659.25,       // E5 -> G5
      reaction_complete: 587.33,   // D5 -> A5
      validation_warning: 311.13,  // Eb4
      dissection_complete: 523.25, // C5 major triad
      button_subtle: 440.0,
    };

    const freqHz = freqMap[type] || 440;
    const gainLevel = this.getEffectiveUiGain(0.18);

    const recorded = this.recordEvent(
      {
        category: 'ui_feedback',
        subtype: type,
        sourceId: 'ui',
        dedupeKey: dedupeKey || `ui::${type}`,
        gainLevel,
        frequencyHz: freqHz,
        metadata: { type },
      },
      80
    );

    if (!recorded) return false;

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.uiGainNode) return true;

    try {
      const now = ctx.currentTime;
      if (type === 'dissection_complete' || type === 'ai_completion' || type === 'reaction_complete') {
        const notes =
          type === 'dissection_complete'
            ? [523.25, 659.25, 783.99]
            : type === 'ai_completion'
              ? [523.25, 659.25]
              : [493.88, 659.25];

        notes.forEach((f, idx) => {
          if (!this.ctx || !this.uiGainNode) return;
          const t0 = now + idx * 0.065;
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, t0);
          g.gain.setValueAtTime(0.08, t0);
          g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.24);
          osc.connect(g);
          g.connect(this.uiGainNode);
          osc.start(t0);
          osc.stop(t0 + 0.25);
        });
      } else {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type === 'validation_warning' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freqHz, now);
        if (type === 'validation_warning') {
          osc.frequency.exponentialRampToValueAtTime(freqHz * 0.82, now + 0.14);
        }
        g.gain.setValueAtTime(0.07, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(g);
        g.connect(this.uiGainNode);
        osc.start(now);
        osc.stop(now + 0.16);
      }
    } catch {}

    return true;
  }
}

export const soundEngine = new StateDrivenSoundEngine();
