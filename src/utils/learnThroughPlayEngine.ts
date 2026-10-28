import { ScientificModelSpec, ModelParameterSpec as ModelParameter } from '../types/aiModel';
import { aiSpeechManager } from './aiSpeechService';
import { soundEngine } from './soundEngine';

export const LEARN_THROUGH_PLAY_STORAGE_KEY = 'tech_anatomix_learn_play_v1';

export type LearningLoopStage = 'see' | 'try' | 'observe' | 'discover' | 'apply' | 'master';

export type AdaptiveSupportLevel = 'guided' | 'explorer' | 'master';

export interface DiscoveryRecord {
  id: string;
  domain: 'physics' | 'chemistry' | 'biology' | 'anatomy' | '3d-models';
  title: string;
  symbol: string;
  scientificPrinciple: string;
  formulaOrRule?: string;
  unlockedAt: number;
  masteryCount: number;
  bestAccuracyPct: number;
}

export interface LearnThroughPlayState {
  visualFirstMode: boolean;
  autoSpeakEnabled: boolean;
  supportLevel: AdaptiveSupportLevel;
  completedLoops: Record<string, LearningLoopStage[]>;
  discoveries: Record<string, DiscoveryRecord>;
  challengeAttempts: Record<string, number>;
  consecutiveSuccesses: number;
  totalExperimentsRun: number;
}

export const DEFAULT_LEARN_THROUGH_PLAY_STATE: LearnThroughPlayState = {
  visualFirstMode: true,
  autoSpeakEnabled: false,
  supportLevel: 'guided',
  completedLoops: {},
  discoveries: {},
  challengeAttempts: {},
  consecutiveSuccesses: 0,
  totalExperimentsRun: 0,
};

export interface ModelPlayChallenge {
  id: string;
  modelId: string;
  domain: 'physics' | 'chemistry' | 'biology' | 'anatomy' | '3d-models';
  symbol: string;
  visualActionCue: string;
  nonReaderVisualSummary: string;
  spokenSeePrompt: string;
  spokenTryPrompt: string;
  spokenObservePrompt: string;
  spokenDiscoverInsight: string;
  spokenApplyChallenge: string;
  targetParameterId: string | null;
  targetParameterName: string;
  targetUnit: string;
  demoValue: number;
  challengeTargetMin: number;
  challengeTargetMax: number;
  challengeTargetLabel: string;
  targetPartId: string | null;
  targetPartName: string;
  causeEffectRule: string;
  equationDisplay: string;
}

export interface ChemistryPlayExperiment {
  id: string;
  title: string;
  shortVisualLabel: string;
  symbol: string;
  badgeColor: string;
  reactantIds: string[];
  reactantVisualPills: { id: string; formula: string; name: string; color: string; stateSymbol: string }[];
  recommendedTempC: number;
  catalystId?: string | null;
  seeVisualCue: string;
  tryVisualCue: string;
  observeVisualCue: string;
  discoverPrinciple: string;
  applyQuestion: string;
  applyOptions: { id: string; symbol: string; label: string; isCorrect: boolean; feedback: string }[];
  spokenGuide: string;
  expectedReactionId?: string;
}

export interface AnatomyPlayMission {
  id: string;
  specimen: 'frog' | 'human';
  title: string;
  shortVisualLabel: string;
  symbol: string;
  targetOrganId: string;
  targetOrganName: string;
  requiresDissection: boolean;
  seeVisualCue: string;
  tryVisualCue: string;
  observeVisualCue: string;
  discoverPrinciple: string;
  applyQuestion: string;
  applyOptions: { id: string; symbol: string; label: string; isCorrect: boolean; feedback: string }[];
  spokenGuide: string;
}

class LearnThroughPlayManager {
  private state: LearnThroughPlayState = { ...DEFAULT_LEARN_THROUGH_PLAY_STATE };
  private listeners: Set<(state: LearnThroughPlayState) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(LEARN_THROUGH_PLAY_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.state = {
            visualFirstMode:
              typeof parsed.visualFirstMode === 'boolean'
                ? parsed.visualFirstMode
                : DEFAULT_LEARN_THROUGH_PLAY_STATE.visualFirstMode,
            autoSpeakEnabled:
              typeof parsed.autoSpeakEnabled === 'boolean'
                ? parsed.autoSpeakEnabled
                : DEFAULT_LEARN_THROUGH_PLAY_STATE.autoSpeakEnabled,
            supportLevel:
              parsed.supportLevel === 'guided' ||
              parsed.supportLevel === 'explorer' ||
              parsed.supportLevel === 'master'
                ? parsed.supportLevel
                : DEFAULT_LEARN_THROUGH_PLAY_STATE.supportLevel,
            completedLoops: parsed.completedLoops && typeof parsed.completedLoops === 'object' ? parsed.completedLoops : {},
            discoveries: parsed.discoveries && typeof parsed.discoveries === 'object' ? parsed.discoveries : {},
            challengeAttempts:
              parsed.challengeAttempts && typeof parsed.challengeAttempts === 'object' ? parsed.challengeAttempts : {},
            consecutiveSuccesses:
              typeof parsed.consecutiveSuccesses === 'number' ? parsed.consecutiveSuccesses : 0,
            totalExperimentsRun:
              typeof parsed.totalExperimentsRun === 'number' ? parsed.totalExperimentsRun : 0,
          };
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LEARN_THROUGH_PLAY_STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch {
      // Ignore storage errors
    }
  }

  private notify(): void {
    const snapshot = this.getState();
    this.listeners.forEach((cb) => {
      try {
        cb(snapshot);
      } catch {
        // Ignore listener error
      }
    });
  }

  public getState(): LearnThroughPlayState {
    return {
      ...this.state,
      completedLoops: { ...this.state.completedLoops },
      discoveries: { ...this.state.discoveries },
      challengeAttempts: { ...this.state.challengeAttempts },
    };
  }

  public subscribe(listener: (state: LearnThroughPlayState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setVisualFirstMode(enabled: boolean): void {
    this.state.visualFirstMode = enabled;
    this.saveToStorage();
    this.notify();
  }

  public setAutoSpeakEnabled(enabled: boolean): void {
    this.state.autoSpeakEnabled = enabled;
    if (!enabled) {
      aiSpeechManager.stop();
    }
    this.saveToStorage();
    this.notify();
  }

  public setSupportLevel(level: AdaptiveSupportLevel): void {
    this.state.supportLevel = level;
    this.saveToStorage();
    this.notify();
  }

  public speakInstruction(id: string, text: string, force = false): void {
    if (force || this.state.autoSpeakEnabled) {
      aiSpeechManager.play(id, text);
    }
  }

  public markStageCompleted(contextId: string, stage: LearningLoopStage): void {
    const existing = this.state.completedLoops[contextId] || [];
    if (!existing.includes(stage)) {
      this.state.completedLoops[contextId] = [...existing, stage];
      this.state.totalExperimentsRun += 1;
      this.saveToStorage();
      this.notify();
    }
  }

  public recordDiscovery(record: Omit<DiscoveryRecord, 'unlockedAt' | 'masteryCount' | 'bestAccuracyPct'> & { accuracyPct?: number }): DiscoveryRecord {
    const existing = this.state.discoveries[record.id];
    const now = Date.now();
    const accuracy = record.accuracyPct ?? 100;

    const updated: DiscoveryRecord = existing
      ? {
          ...existing,
          masteryCount: existing.masteryCount + 1,
          bestAccuracyPct: Math.max(existing.bestAccuracyPct, accuracy),
        }
      : {
          id: record.id,
          domain: record.domain,
          title: record.title,
          symbol: record.symbol,
          scientificPrinciple: record.scientificPrinciple,
          formulaOrRule: record.formulaOrRule,
          unlockedAt: now,
          masteryCount: 1,
          bestAccuracyPct: accuracy,
        };

    this.state.discoveries[record.id] = updated;
    this.state.consecutiveSuccesses += 1;

    // Adaptive progression: promote support level naturally as user masters concepts
    if (this.state.consecutiveSuccesses >= 6 && this.state.supportLevel === 'explorer') {
      this.state.supportLevel = 'master';
    } else if (this.state.consecutiveSuccesses >= 3 && this.state.supportLevel === 'guided') {
      this.state.supportLevel = 'explorer';
    }

    this.markStageCompleted(record.id, 'discover');
    this.markStageCompleted(record.id, 'master');
    soundEngine.playUiFeedback('ai_completion');
    this.saveToStorage();
    this.notify();
    return updated;
  }

  public recordChallengeAttempt(contextId: string, succeeded: boolean): { attempts: number; shouldShowVisualHint: boolean } {
    const prev = this.state.challengeAttempts[contextId] || 0;
    const next = succeeded ? 0 : prev + 1;
    this.state.challengeAttempts[contextId] = next;

    if (succeeded) {
      this.state.consecutiveSuccesses += 1;
      soundEngine.playUiFeedback('reaction_complete');
    } else {
      this.state.consecutiveSuccesses = 0;
      if (next >= 2 && this.state.supportLevel === 'master') {
        this.state.supportLevel = 'explorer';
      } else if (next >= 3 && this.state.supportLevel === 'explorer') {
        this.state.supportLevel = 'guided';
      }
      soundEngine.playUiFeedback('validation_warning');
    }

    this.saveToStorage();
    this.notify();

    return {
      attempts: next,
      shouldShowVisualHint: !succeeded && (next >= 2 || this.state.supportLevel === 'guided'),
    };
  }

  public resetContextProgress(contextId: string): void {
    delete this.state.completedLoops[contextId];
    delete this.state.challengeAttempts[contextId];
    this.saveToStorage();
    this.notify();
  }
}

export const learnThroughPlayManager = new LearnThroughPlayManager();

/**
 * Generates a deterministic, model-specific SEE -> TRY -> OBSERVE -> DISCOVER -> APPLY -> MASTER
 * interactive challenge for ANY 3D model in the 122-model registry or custom AI generator.
 */
export function buildModelPlayChallenge(modelSpec: ScientificModelSpec): ModelPlayChallenge {
  const paramList: ModelParameter[] = Object.values(modelSpec.parameters || {});
  const primaryParam: ModelParameter | null = paramList.length > 0 ? paramList[0] : null;
  const primaryPart = modelSpec.parts && modelSpec.parts.length > 0 ? modelSpec.parts[0] : null;

  const idLower = `${modelSpec.id} ${modelSpec.title} ${modelSpec.concept || ''}`.toLowerCase();
  let domain: ModelPlayChallenge['domain'] = '3d-models';
  let symbol = '🔬';

  if (/\b(cell|heart|lung|brain|dna|neuron|plant|blood|eye|digestive|frog|organ|anatomy|muscle|kidney|nephron)\b/.test(idLower)) {
    domain = 'biology';
    symbol = '🧬';
  } else if (/\b(orbital|crystal|lattice|molecule|polarity|bond|electro|kinetics|equilibrium|titration|buffer|catalys|solubility|atom)\b/.test(idLower)) {
    domain = 'chemistry';
    symbol = '⚛️';
  } else if (/\b(solar|planet|black hole|orbit|eclipse|moon|star|relativity)\b/.test(idLower)) {
    domain = 'physics';
    symbol = '🪐';
  } else if (/\b(pendulum|projectile|motor|generator|circuit|wave|prism|lever|hydraulic|cradle|heat|carnot|bell|transformer|doppler|magnetic|quantum|plasma)\b/.test(idLower)) {
    domain = 'physics';
    symbol = '⚡';
  }

  if (primaryParam) {
    const range = Math.max(0.0001, primaryParam.max - primaryParam.min);
    // Pick a high-contrast demo value (roughly 78% of max, or 25% if default is already near max)
    const defaultRatio = (primaryParam.defaultValue - primaryParam.min) / range;
    const targetRatio = defaultRatio > 0.68 ? 0.25 : 0.8;
    const rawTarget = primaryParam.min + range * targetRatio;
    const step = primaryParam.step || 1;
    const snappedDemo = Number((Math.round(rawTarget / step) * step).toFixed(3));
    const clampedDemo = Math.min(primaryParam.max, Math.max(primaryParam.min, snappedDemo));

    const tolerance = Math.max(step * 1.5, range * 0.12);
    const minTarget = Number(Math.max(primaryParam.min, clampedDemo - tolerance).toFixed(2));
    const maxTarget = Number(Math.min(primaryParam.max, clampedDemo + tolerance).toFixed(2));

    const directionArrow = clampedDemo >= primaryParam.defaultValue ? '↑' : '↓';
    const eq =
      modelSpec.equations && modelSpec.equations.length > 0
        ? modelSpec.equations[0]
        : `${primaryParam.name} (${primaryParam.unit}) ➔ Dynamic System Response`;

    return {
      id: `model-play-${modelSpec.id}`,
      modelId: modelSpec.id,
      domain,
      symbol,
      visualActionCue: `${directionArrow} Slide ${primaryParam.name} to ${clampedDemo} ${primaryParam.unit}`,
      nonReaderVisualSummary: `${symbol} ${primaryParam.name} ${directionArrow} ${clampedDemo}${primaryParam.unit}`,
      spokenSeePrompt: `Step 1, Watch: Observe how ${modelSpec.title} moves at its starting setting of ${primaryParam.defaultValue} ${primaryParam.unit}.`,
      spokenTryPrompt: `Step 2, Try It: Move the ${primaryParam.name} control toward ${clampedDemo} ${primaryParam.unit}, or tap Watch Demo to see it happen automatically.`,
      spokenObservePrompt: `Step 3, Observe: Watch how changing ${primaryParam.name} immediately changes the 3D motion and live scientific measurements.`,
      spokenDiscoverInsight: `Discovery unlocked! In ${modelSpec.title}, ${primaryParam.description || `adjusting ${primaryParam.name} directly governs ${modelSpec.concept}`}.`,
      spokenApplyChallenge: `Challenge: Set ${primaryParam.name} between ${minTarget} and ${maxTarget} ${primaryParam.unit}${primaryPart ? ` and tap ${primaryPart.name}` : ''} to master this system!`,
      targetParameterId: primaryParam.id,
      targetParameterName: primaryParam.name,
      targetUnit: primaryParam.unit,
      demoValue: clampedDemo,
      challengeTargetMin: minTarget,
      challengeTargetMax: maxTarget,
      challengeTargetLabel: `${minTarget} – ${maxTarget} ${primaryParam.unit}`,
      targetPartId: primaryPart ? primaryPart.id : null,
      targetPartName: primaryPart ? primaryPart.name : 'Primary Component',
      causeEffectRule: primaryParam.description || `${primaryParam.name} directly controls the physical rate and equilibrium of ${modelSpec.title}.`,
      equationDisplay: eq,
    };
  }

  // Fallback for purely structural models without numeric parameters
  return {
    id: `model-play-${modelSpec.id}`,
    modelId: modelSpec.id,
    domain,
    symbol,
    visualActionCue: primaryPart ? `👆 Tap & Inspect "${primaryPart.name}" in 3D` : '👆 Rotate & Inspect 3D Parts',
    nonReaderVisualSummary: `${symbol} 👆 ${primaryPart ? primaryPart.name : modelSpec.title}`,
    spokenSeePrompt: `Step 1, Watch: Look at the 3D structure of ${modelSpec.title}.`,
    spokenTryPrompt: `Step 2, Try It: Tap on ${primaryPart ? primaryPart.name : 'any 3D part'} or use Exploded View to look inside.`,
    spokenObservePrompt: `Step 3, Observe: Notice how each part fits together to perform its function.`,
    spokenDiscoverInsight: `Discovery unlocked! ${modelSpec.description}`,
    spokenApplyChallenge: `Challenge: Select ${primaryPart ? primaryPart.name : 'a component'} in the 3D view to complete your inspection!`,
    targetParameterId: null,
    targetParameterName: '3D Structure Inspection',
    targetUnit: '',
    demoValue: 1,
    challengeTargetMin: 0,
    challengeTargetMax: 1,
    challengeTargetLabel: primaryPart ? `Inspect ${primaryPart.name}` : 'Inspect 3D Model',
    targetPartId: primaryPart ? primaryPart.id : null,
    targetPartName: primaryPart ? primaryPart.name : 'Core Structure',
    causeEffectRule: modelSpec.description,
    equationDisplay: modelSpec.concept || modelSpec.title,
  };
}

/**
 * Verified Playable Chemistry Lab Challenges bound to the real REAGENTS and REACTIONS engine.
 */
export const CHEMISTRY_PLAY_EXPERIMENTS: ChemistryPlayExperiment[] = [
  {
    id: 'chem-play-neutralization',
    title: 'Acid–Base Neutralization & Heat',
    shortVisualLabel: '🧪 Acid + Base ➔ Salt + Heat ↑',
    symbol: '🌡️',
    badgeColor: 'emerald',
    reactantIds: ['hcl', 'naoh'],
    reactantVisualPills: [
      { id: 'hcl', formula: 'HCl', name: 'Hydrochloric Acid', color: '#e2e8f0', stateSymbol: '💧 Acid' },
      { id: 'naoh', formula: 'NaOH', name: 'Sodium Hydroxide', color: '#f1f5f9', stateSymbol: '💧 Base' },
    ],
    recommendedTempC: 25,
    catalystId: null,
    seeVisualCue: '👀 Two clear liquids (HCl + NaOH) combine in the 3D beaker.',
    tryVisualCue: '➕ Add HCl + NaOH and press Run Reaction in 3D Beaker.',
    observeVisualCue: '🌡️ Watch temperature rise (+13°C exothermic warmth) as H⁺ and OH⁻ form H₂O!',
    discoverPrinciple: 'Strong acids (H⁺) and strong bases (OH⁻) neutralize each other to form water (H₂O) and dissolved salt (NaCl), releasing heat energy (ΔH < 0).',
    applyQuestion: 'What happens to the beaker temperature when HCl and NaOH react?',
    applyOptions: [
      {
        id: 'temp-up',
        symbol: '🌡️↑',
        label: 'Temperature rises (Exothermic heat released)',
        isCorrect: true,
        feedback: 'Correct! Neutralization of H⁺ + OH⁻ → H₂O releases heat into the solution.',
      },
      {
        id: 'solid-black',
        symbol: '⬛↓',
        label: 'A black solid precipitate settles at the bottom',
        isCorrect: false,
        feedback: 'Look closely at the beaker: NaCl remains dissolved in water with no solid precipitate.',
      },
    ],
    spokenGuide:
      'Acid-Base Neutralization Mission. Step 1: Add Hydrochloric Acid and Sodium Hydroxide to the 3D beaker, or tap Auto-Demonstrate. Step 2: Press Run Reaction and watch the thermometer rise as acid and base neutralize into salt and water!',
    expectedReactionId: 'rxn_hcl_naoh',
  },
  {
    id: 'chem-play-golden-rain',
    title: 'Golden Rain Precipitation (PbI₂↓)',
    shortVisualLabel: '✨ Clear + Clear ➔ Bright Yellow Solid ↓',
    symbol: '🟨',
    badgeColor: 'amber',
    reactantIds: ['pb_no3_2', 'ki'],
    reactantVisualPills: [
      { id: 'pb_no3_2', formula: 'Pb(NO₃)₂', name: 'Lead(II) Nitrate', color: '#f8fafc', stateSymbol: '💧 Clear' },
      { id: 'ki', formula: 'KI', name: 'Potassium Iodide', color: '#f8fafc', stateSymbol: '💧 Clear' },
    ],
    recommendedTempC: 25,
    catalystId: null,
    seeVisualCue: '👀 Two colourless salt solutions meet inside the beaker.',
    tryVisualCue: '➕ Mix Pb(NO₃)₂ + KI and run the 3D reaction.',
    observeVisualCue: '🟨 Watch brilliant golden-yellow PbI₂ crystals form and settle to the bottom!',
    discoverPrinciple: 'When Pb²⁺ ions meet I⁻ ions in water, they lock together into insoluble Lead(II) Iodide (PbI₂↓), a solid precipitate that settles under gravity.',
    applyQuestion: 'Why does a bright yellow cloud appear and sink to the bottom of the beaker?',
    applyOptions: [
      {
        id: 'insoluble-ppt',
        symbol: '🟨↓',
        label: 'Insoluble solid PbI₂ precipitate forms and settles',
        isCorrect: true,
        feedback: 'Spot on! Pb²⁺ + 2I⁻ → PbI₂(s) forms an insoluble golden crystal precipitate.',
      },
      {
        id: 'boiling-gas',
        symbol: '💨↑',
        label: 'The water boils into yellow steam',
        isCorrect: false,
        feedback: 'Notice the particles sinking downward—those are solid crystals (precipitate), not rising gas bubbles.',
      },
    ],
    spokenGuide:
      'Golden Rain Precipitation Mission. Mix clear Lead Nitrate with clear Potassium Iodide in the 3D beaker. Watch how two clear liquids instantly create a bright golden-yellow solid precipitate that settles to the bottom!',
    expectedReactionId: 'rxn_pbno32_ki',
  },
  {
    id: 'chem-play-gas-fizz',
    title: 'Effervescent CO₂ Gas Fizz',
    shortVisualLabel: '🫧 Acid + Carbonate ➔ Vigorous Bubbles ↑',
    symbol: '🫧',
    badgeColor: 'sky',
    reactantIds: ['hcl', 'nahco3'],
    reactantVisualPills: [
      { id: 'hcl', formula: 'HCl', name: 'Hydrochloric Acid', color: '#e2e8f0', stateSymbol: '💧 Acid' },
      { id: 'nahco3', formula: 'NaHCO₃', name: 'Sodium Bicarbonate', color: '#ffffff', stateSymbol: '⚪ Solid' },
    ],
    recommendedTempC: 25,
    catalystId: null,
    seeVisualCue: '👀 Solid baking soda (NaHCO₃) drops into hydrochloric acid (HCl).',
    tryVisualCue: '➕ Add HCl + NaHCO₃ and trigger the 3D beaker reaction.',
    observeVisualCue: '🫧 Observe and hear rapid carbon dioxide (CO₂↑) gas bubbles rising through the liquid!',
    discoverPrinciple: 'Acids react with carbonates/bicarbonates to form unstable carbonic acid, which immediately decomposes into water and rising CO₂ gas bubbles.',
    applyQuestion: 'What causes the rapid bubbling and fizzing sound inside the beaker?',
    applyOptions: [
      {
        id: 'co2-gas',
        symbol: '🫧↑',
        label: 'Carbon dioxide (CO₂) gas escaping from the liquid',
        isCorrect: true,
        feedback: 'Exactly right! HCl + NaHCO₃ releases CO₂ gas bubbles that rise to the surface.',
      },
      {
        id: 'freezing-ice',
        symbol: '🧊❄️',
        label: 'The liquid freezing into solid ice',
        isCorrect: false,
        feedback: 'Look at the rising streams of bubbles—that is carbon dioxide gas escaping!',
      },
    ],
    spokenGuide:
      'Carbon Dioxide Gas Evolution Mission. Combine Hydrochloric Acid and Sodium Bicarbonate in the beaker. Listen to the fizzing sound and watch carbon dioxide gas bubbles rise to the surface!',
    expectedReactionId: 'rxn_hcl_nahco3',
  },
  {
    id: 'chem-play-copper-precipitate',
    title: 'Sky-Blue Copper Hydroxide Gel',
    shortVisualLabel: '🔵 CuSO₄ + NaOH ➔ Deep Blue Precipitate ↓',
    symbol: '🔵',
    badgeColor: 'indigo',
    reactantIds: ['cuso4', 'naoh'],
    reactantVisualPills: [
      { id: 'cuso4', formula: 'CuSO₄', name: 'Copper(II) Sulfate', color: '#38bdf8', stateSymbol: '🔵 Blue Aq' },
      { id: 'naoh', formula: 'NaOH', name: 'Sodium Hydroxide', color: '#f8fafc', stateSymbol: '💧 Base' },
    ],
    recommendedTempC: 25,
    catalystId: null,
    seeVisualCue: '👀 Blue Copper(II) Sulfate solution meets Sodium Hydroxide base.',
    tryVisualCue: '➕ Add CuSO₄ + NaOH and run the reaction in the 3D beaker.',
    observeVisualCue: '🔵 Watch a gelatinous royal-blue Cu(OH)₂ precipitate cloud form in 3D!',
    discoverPrinciple: 'Transition metal ions like Cu²⁺ react with hydroxide ions (OH⁻) to form vividly colored insoluble metal hydroxides: Cu²⁺ + 2OH⁻ → Cu(OH)₂↓.',
    applyQuestion: 'What happens to the dissolved Cu²⁺ ions when OH⁻ base is added?',
    applyOptions: [
      {
        id: 'cuoh2-ppt',
        symbol: '🔵↓',
        label: 'They bond with OH⁻ to form solid blue Cu(OH)₂ precipitate',
        isCorrect: true,
        feedback: 'Bravo! Insoluble Copper(II) Hydroxide precipitates out of solution as a blue solid.',
      },
      {
        id: 'disappear-gas',
        symbol: '💨↑',
        label: 'They evaporate into colourless air',
        isCorrect: false,
        feedback: 'Copper ions stay in the beaker, forming the vivid blue solid precipitate at the bottom.',
      },
    ],
    spokenGuide:
      'Copper Hydroxide Precipitation Mission. Add blue Copper Sulfate and Sodium Hydroxide to the beaker. Watch the royal-blue Copper Hydroxide solid precipitate form!',
    expectedReactionId: 'rxn_cuso4_naoh',
  },
];

/**
 * Verified Playable Anatomy Missions for Frog & Human Specimens.
 */
export const ANATOMY_PLAY_MISSIONS: AnatomyPlayMission[] = [
  {
    id: 'anat-frog-heart',
    specimen: 'frog',
    title: '3-Chambered Amphibian Heart Discovery',
    shortVisualLabel: '🐸 Rotate Neck ➔ Inspect 3-Chambered Heart 🫀',
    symbol: '🐸',
    targetOrganId: 'heart',
    targetOrganName: 'Heart (3-Chambered)',
    requiresDissection: true,
    seeVisualCue: '👀 See the cervical neck dissection guide on the frog specimen.',
    tryVisualCue: '✂️ Drag the frog neck in 3D (or click Complete Dissection) and select Heart.',
    observeVisualCue: '🫀 Listen to the 48 BPM heartbeat and observe the 2 atria + 1 shared ventricle.',
    discoverPrinciple: 'Unlike mammals, amphibians have a 3-chambered heart (2 atria, 1 single ventricle) because their moist skin also absorbs oxygen (cutaneous respiration).',
    applyQuestion: 'How many chambers pump blood inside the frog heart you just exposed?',
    applyOptions: [
      {
        id: 'frog-3-chambers',
        symbol: '3️⃣🫀',
        label: '3 Chambers (2 Atria + 1 Shared Ventricle)',
        isCorrect: true,
        feedback: 'Correct! The frog heart has two atria and a single muscular ventricle.',
      },
      {
        id: 'frog-4-chambers',
        symbol: '4️⃣🫀',
        label: '4 Separated Chambers like a human',
        isCorrect: false,
        feedback: 'Mammals have 4 chambers, whereas amphibians have 3 chambers.',
      },
    ],
    spokenGuide:
      'Frog Heart Discovery Mission. First, rotate the frog neck with your mouse to open the body cavity. Next, select the beating Heart and listen to its 48 beats per minute pulse to discover why frogs have 3 heart chambers!',
  },
  {
    id: 'anat-frog-lungs',
    specimen: 'frog',
    title: 'Positive-Pressure Sacculated Lungs',
    shortVisualLabel: '🐸 Open Coelom ➔ Inspect Paired Lungs 🫁',
    symbol: '🫁',
    targetOrganId: 'lungs',
    targetOrganName: 'Paired Lungs',
    requiresDissection: true,
    seeVisualCue: '👀 Locate the paired pink pulmonary sacs beside the heart.',
    tryVisualCue: '👆 Select Paired Lungs in the Frog Anatomy Explorer.',
    observeVisualCue: '🫁 Hear the bronchial airflow and observe the thin sacculated walls.',
    discoverPrinciple: 'Frogs have no ribs or diaphragm! They push air into their simple sac-like lungs by raising and lowering the floor of their mouth (buccal pumping).',
    applyQuestion: 'How does a frog fill its lungs without ribs or a diaphragm?',
    applyOptions: [
      {
        id: 'buccal-pump',
        symbol: '🐸💨',
        label: 'Positive-pressure mouth (buccal) pumping + skin breathing',
        isCorrect: true,
        feedback: 'Correct! Frogs pump air down from their mouth floor and also breathe through their moist skin.',
      },
      {
        id: 'rib-expansion',
        symbol: '🦴🫁',
        label: 'Expanding a heavy bony rib cage',
        isCorrect: false,
        feedback: 'Frogs lack a rib cage and diaphragm—they use buccal pumping instead!',
      },
    ],
    spokenGuide:
      'Frog Lungs Discovery Mission. Open the frog internal view and select the Paired Lungs. Notice that frogs have no rib cage or diaphragm, so they pump air in using their mouth floor!',
  },
  {
    id: 'anat-human-heart',
    specimen: 'human',
    title: 'Human 4-Chambered Double Circulation',
    shortVisualLabel: '👤 Dissect Midline ➔ Inspect Human Heart ❤️',
    symbol: '❤️',
    targetOrganId: 'human_heart',
    targetOrganName: 'Heart (Cardiovascular Core)',
    requiresDissection: true,
    seeVisualCue: '👀 Follow the abdominal midline incision guide to unlock internal organs.',
    tryVisualCue: '✂️ Complete the abdominal incision step and select the Human Heart.',
    observeVisualCue: '❤️ Observe the 4-chambered muscular pump separating oxygen-rich and oxygen-poor blood.',
    discoverPrinciple: 'The human heart has 4 chambers divided by a complete muscular wall (septum), keeping oxygen-rich blood 100% separate from oxygen-poor blood to power warm-blooded metabolism.',
    applyQuestion: 'Why does the human heart have 4 completely separated chambers?',
    applyOptions: [
      {
        id: 'prevent-mixing',
        symbol: '4️⃣❤️',
        label: 'To prevent oxygen-rich and oxygen-poor blood from mixing',
        isCorrect: true,
        feedback: 'Exactly! Complete 4-chamber separation delivers maximum oxygen to the brain and body.',
      },
      {
        id: 'store-food',
        symbol: '🍎🫙',
        label: 'To digest food inside the chest',
        isCorrect: false,
        feedback: 'Digestion happens in the stomach and intestines; the 4-chambered heart pumps oxygenated blood!',
      },
    ],
    spokenGuide:
      'Human Heart Discovery Mission. Complete the guided midline dissection to reveal the internal organs, then select the Human Heart. Discover how its 4 separated chambers keep oxygen-rich blood flowing to your brain and muscles!',
  },
  {
    id: 'anat-human-lungs',
    specimen: 'human',
    title: 'Human Diaphragm & Alveolar Breathing',
    shortVisualLabel: '👤 Internal Viscera ➔ Inspect Lungs & Trachea 🫁',
    symbol: '🫁',
    targetOrganId: 'human_lungs',
    targetOrganName: 'Lungs & Trachea',
    requiresDissection: true,
    seeVisualCue: '👀 Look at the large paired spongy lungs inside the rib cage.',
    tryVisualCue: '👆 Select Lungs & Trachea in the Human Anatomy Explorer.',
    observeVisualCue: '🫁 Notice how the muscular diaphragm below the lungs pulls air into 300 million alveoli.',
    discoverPrinciple: 'When your diaphragm muscle contracts downward, it creates low pressure inside your chest, drawing fresh oxygen into 300 million microscopic air sacs (alveoli).',
    applyQuestion: 'What muscle beneath the human lungs pulls air into the chest when you inhale?',
    applyOptions: [
      {
        id: 'diaphragm-muscle',
        symbol: '⬇️🫁',
        label: 'The Diaphragm muscle contracting downward',
        isCorrect: true,
        feedback: 'Correct! The dome-shaped diaphragm contracts downward to draw air into the lungs.',
      },
      {
        id: 'biceps-muscle',
        symbol: '💪🦴',
        label: 'The arm biceps muscle',
        isCorrect: false,
        feedback: 'The diaphragm at the base of the rib cage is the primary muscle of human breathing.',
      },
    ],
    spokenGuide:
      'Human Lungs Discovery Mission. Select the Lungs and Trachea in the Human Anatomy Explorer to see how the diaphragm muscle draws oxygen into 300 million tiny alveoli!',
  },
];
