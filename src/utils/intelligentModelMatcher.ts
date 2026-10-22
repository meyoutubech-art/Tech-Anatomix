import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { ScientificModelSpec } from '../types/aiModel';
import { getUniquePresets, matchOfflinePreset, PresetSummary } from './offlineModelManager';
import { isSpecializedProceduralConcept } from './proceduralModelSynthesizer';

export type MatchOutcome =
  | 'exact-preset'
  | 'semantic-preset'
  | 'ambiguous'
  | 'custom-generation'
  | 'invalid-request';

export interface MatcherThresholds {
  exactMatchThreshold: number;
  semanticMatchThreshold: number;
  ambiguityDeltaThreshold: number;
}

export const DEFAULT_MATCHER_THRESHOLDS: MatcherThresholds = {
  exactMatchThreshold: 0.88,
  semanticMatchThreshold: 0.70,
  ambiguityDeltaThreshold: 0.12,
};

export interface CandidatePresetOption {
  id: string;
  title: string;
  category: string;
  concept: string;
  confidence: number;
  reason: string;
  spec: ScientificModelSpec;
}

export interface ModelSelectionDecision {
  timestamp: string;
  originalPrompt: string;
  normalizedPrompt: string;
  outcome: MatchOutcome;
  selectedModelId: string | null;
  selectedPreset?: ScientificModelSpec;
  confidence: number;
  compatibilityPassed: boolean;
  incompatibilityReason?: string;
  reason: string;
  clarificationQuestion?: string;
  candidateOptions?: CandidatePresetOption[];
}

export const TARGET_PRESENTATION_DURATION_MS = 6000;

export const PRESET_LOADING_STAGES: string[] = [
  'Analyzing your model request...',
  'Searching the model library...',
  'Checking model compatibility...',
  'Preparing the selected model...',
  'Checking viewer readiness...',
  'Loading your model...',
];

export function getCustomGenerationStages(includeWebResearch: boolean): string[] {
  const stages: string[] = ['Analyzing your prompt...'];
  if (includeWebResearch) {
    stages.push('Researching the requested concept...');
  }
  stages.push(
    'Preparing the scientific model specification...',
    'Generating 3D geometry...',
    'Setting up model interactions...',
    'Validating the model...',
    'Loading the model into the viewer...'
  );
  return stages;
}

// Bounded in-memory audit log of prompt-to-model routing decisions
const selectionDecisionLogs: ModelSelectionDecision[] = [];
const MAX_DECISION_LOGS = 100;

export function logModelSelectionDecision(decision: ModelSelectionDecision): void {
  const safeLogEntry: ModelSelectionDecision = {
    ...decision,
    originalPrompt: decision.originalPrompt.slice(0, 240),
  };
  selectionDecisionLogs.unshift(safeLogEntry);
  if (selectionDecisionLogs.length > MAX_DECISION_LOGS) {
    selectionDecisionLogs.length = MAX_DECISION_LOGS;
  }
  console.info(
    `[Tech-Anatomix Model Matcher] prompt="${safeLogEntry.originalPrompt}" | outcome="${safeLogEntry.outcome}" | selectedModelId="${safeLogEntry.selectedModelId || 'none'}" | confidence=${safeLogEntry.confidence.toFixed(2)} | compatible=${safeLogEntry.compatibilityPassed} | reason="${safeLogEntry.reason}"`
  );
}

export function getModelSelectionLogs(): ModelSelectionDecision[] {
  return [...selectionDecisionLogs];
}

export function clearModelSelectionLogs(): void {
  selectionDecisionLogs.length = 0;
}

/**
 * Normalizes a prompt by removing conversational filler while preserving scientific terms.
 */
export function normalizeMatcherPrompt(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(
      /\b(please|can|you|create|generate|build|make|show|me|a|an|the|3d|model|of|interactive|simulation|explorer|laboratory|lab|visualizer|for|my|class|in|with|and|to)\b/gi,
      ' '
    )
    .replace(/[^a-z0-9\s-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeMatcherPrompt(text)
    .split(/[\s-]+/)
    .filter((w) => w.length >= 2);
}

/**
 * Compatibility verifier:
 * Ensures a candidate preset is NOT selected if the user's prompt requests a related
 * but scientifically different mechanism, organ, or apparatus.
 */
export function verifyPresetCompatibility(
  rawPrompt: string,
  candidateSpec: ScientificModelSpec
): { compatible: boolean; reason: string } {
  const lower = rawPrompt.toLowerCase().trim();
  const cid = candidateSpec.id.toLowerCase();

  // 1. Specialized procedural concepts that are NOT in the preset catalogue
  // must never be hijacked by a loosely related preset.
  if (isSpecializedProceduralConcept(rawPrompt)) {
    return {
      compatible: false,
      reason: `Prompt requests specialized custom concept "${rawPrompt}" which requires distinct components and kinematics from preset "${candidateSpec.id}".`,
    };
  }

  // 2. Hydraulic Press / Hydraulic Brake vs Hydraulic Lift
  if (cid.includes('hydraulic-lift')) {
    if (
      lower.includes('press') ||
      lower.includes('forging') ||
      lower.includes('billet') ||
      lower.includes('anvil') ||
      lower.includes('brake') ||
      lower.includes('braking') ||
      lower.includes('caliper') ||
      lower.includes('excavator') ||
      lower.includes('crane') ||
      lower.includes('ram pump')
    ) {
      return {
        compatible: false,
        reason: `Preset "hydraulic-lift" models a dual-piston vehicle lift and lacks the requested components for "${rawPrompt}".`,
      };
    }
  }

  // 3. Double / Foucault / Ballistic / Torsional / Inverted Pendulum vs Simple Pendulum
  if (cid.includes('pendulum')) {
    if (
      lower.includes('double') ||
      lower.includes('chaotic') ||
      lower.includes('foucault') ||
      lower.includes('ballistic') ||
      lower.includes('torsion') ||
      lower.includes('inverted') ||
      lower.includes('metronome') ||
      lower.includes('clock escapement')
    ) {
      return {
        compatible: false,
        reason: `Preset "simple-pendulum" models a single-mass harmonic pendulum and is structurally incompatible with "${rawPrompt}".`,
      };
    }
  }

  // 4. Brushless / Stepper / Induction / Servo / Linear Motor vs Brushed DC Motor
  if (cid === 'dc-motor' || cid === 'motor') {
    if (
      lower.includes('brushless') ||
      lower.includes('bldc') ||
      lower.includes('stepper') ||
      lower.includes('servo') ||
      lower.includes('synchronous') ||
      lower.includes('induction motor') ||
      lower.includes('linear motor') ||
      lower.includes('custom')
    ) {
      return {
        compatible: false,
        reason: `Preset "${candidateSpec.id}" models a brushed split-ring commutator DC motor, which is incompatible with "${rawPrompt}".`,
      };
    }
  }

  // 5. Jet Engine / Steam Engine / Stirling Engine / Diesel / Wankel / Wind Turbine vs 4-Stroke Engine
  if (cid === 'four-stroke-engine') {
    if (
      lower.includes('jet') ||
      lower.includes('turbofan') ||
      lower.includes('turbojet') ||
      lower.includes('turbine') ||
      lower.includes('steam') ||
      lower.includes('stirling') ||
      lower.includes('rotary') ||
      lower.includes('wankel') ||
      lower.includes('two-stroke') ||
      lower.includes('2-stroke') ||
      lower.includes('rocket')
    ) {
      return {
        compatible: false,
        reason: `Preset "four-stroke-engine" is a single-cylinder reciprocating Otto engine and cannot represent "${rawPrompt}".`,
      };
    }
  }

  // 6. Kidney / Nephron / Liver / Pancreas / Ear / Spleen vs Heart / Circulatory / Digestive
  if (
    cid.includes('heart') ||
    cid.includes('blood') ||
    cid.includes('digestive') ||
    cid.includes('respiratory')
  ) {
    if (
      lower.includes('kidney') ||
      lower.includes('nephron') ||
      lower.includes('glomerulus') ||
      lower.includes('urinary') ||
      lower.includes('bladder') ||
      lower.includes('spleen') ||
      lower.includes('lymphatic') ||
      lower.includes('endocrine') ||
      lower.includes('thyroid') ||
      lower.includes('cochlea') ||
      lower.includes('vestibular')
    ) {
      return {
        compatible: false,
        reason: `Preset "${candidateSpec.id}" does not contain the anatomical structures required for "${rawPrompt}".`,
      };
    }
  }

  // 7. DNA Replication / Transcription / Ribosome / Translation / CRISPR vs Static DNA Double Helix
  if (cid.includes('dna')) {
    if (
      lower.includes('replication') ||
      lower.includes('helicase') ||
      lower.includes('polymerase') ||
      lower.includes('transcription') ||
      lower.includes('translation') ||
      lower.includes('ribosome') ||
      lower.includes('crispr') ||
      lower.includes('electrophoresis') ||
      lower.includes('pcr')
    ) {
      return {
        compatible: false,
        reason: `Preset "${candidateSpec.id}" represents a static B-DNA double helix and lacks the enzymatic machinery required for "${rawPrompt}".`,
      };
    }
  }

  // 8. Fuel Cell / Solar Cell / Lithium Battery vs Galvanic Daniell Cell
  if (cid === 'electrochemical-cell-simulator') {
    if (
      lower.includes('fuel cell') ||
      lower.includes('proton exchange') ||
      lower.includes('pemfc') ||
      lower.includes('hydrogen cell') ||
      lower.includes('solar cell') ||
      lower.includes('photovoltaic') ||
      lower.includes('lithium')
    ) {
      return {
        compatible: false,
        reason: `Preset "electrochemical-cell-simulator" models a two-beaker Zn-Cu Daniell cell, which is incompatible with "${rawPrompt}".`,
      };
    }
  }

  // 9. Robotic Arm / Pulley / Gear Train / Screw Jack / Wedge vs Class 1 Lever
  if (cid.includes('lever')) {
    if (
      lower.includes('robot') ||
      lower.includes('manipulator') ||
      lower.includes('pulley') ||
      lower.includes('gear') ||
      lower.includes('cam') ||
      lower.includes('winch') ||
      lower.includes('crank') ||
      lower.includes('screw')
    ) {
      return {
        compatible: false,
        reason: `Preset "class-1-lever" is a single fulcrum beam and cannot represent "${rawPrompt}".`,
      };
    }
  }

  // 10. Volcano / Plate Tectonics / Tsunami / Fault Line vs Seismic Waves Earth Cutaway
  if (cid === 'seismic-waves-earthquake-lab') {
    if (
      lower.includes('volcano') ||
      lower.includes('magma') ||
      lower.includes('caldera') ||
      lower.includes('lava') ||
      lower.includes('geyser') ||
      lower.includes('glacier') ||
      lower.includes('tornado') ||
      lower.includes('hurricane')
    ) {
      return {
        compatible: false,
        reason: `Preset "seismic-waves-earthquake-lab" models planetary P/S wave refraction and cannot represent "${rawPrompt}".`,
      };
    }
  }

  // 11. Centrifugal Pump / Wind Tunnel / Pelton Wheel / Propeller vs Fluid Dynamics Venturi
  if (cid === 'fluid-dynamics-bernoulli-vortex') {
    if (
      lower.includes('pump') ||
      lower.includes('impeller') ||
      lower.includes('compressor') ||
      lower.includes('wind turbine') ||
      lower.includes('hydraulic press') ||
      lower.includes('siphon')
    ) {
      return {
        compatible: false,
        reason: `Preset "fluid-dynamics-bernoulli-vortex" models a Venturi tube and Kármán street, not "${rawPrompt}".`,
      };
    }
  }

  return {
    compatible: true,
    reason: `Preset "${candidateSpec.title}" (${candidateSpec.id}) satisfies domain, structural components, and behavioral requirements for "${rawPrompt}".`,
  };
}

/**
 * Ambiguous hypernym map: single broad terms that map to multiple distinct scientific presets.
 */
const AMBIGUOUS_CONCEPT_MAP: Record<
  string,
  { question: string; presetIds: string[] }
> = {
  wave: {
    question:
      'Which type of wave phenomenon would you like to explore in 3D?',
    presetIds: [
      'wave-motion',
      'sound-wave',
      'electromagnetic-wave-propagation',
      'wave-interference-diffraction-lab',
    ],
  },
  waves: {
    question:
      'Which type of wave phenomenon would you like to explore in 3D?',
    presetIds: [
      'wave-motion',
      'sound-wave',
      'electromagnetic-wave-propagation',
      'wave-interference-diffraction-lab',
    ],
  },
  cell: {
    question:
      'Would you like a biological cell (Animal or Plant) or a chemical Galvanic Cell?',
    presetIds: [
      'animal-cell-explorer',
      'plant-cell-explorer',
      'electrochemical-cell-simulator',
    ],
  },
  cells: {
    question:
      'Would you like a biological cell (Animal or Plant) or a chemical Galvanic Cell?',
    presetIds: [
      'animal-cell-explorer',
      'plant-cell-explorer',
      'electrochemical-cell-simulator',
    ],
  },
  field: {
    question:
      'Which physical field model would you like to inspect?',
    presetIds: [
      'magnetic-field-explorer',
      'maxwell-equations-em-field-explorer',
      'earth-magnetic-field-magnetosphere-explorer',
    ],
  },
  interference: {
    question:
      'Would you like Double-Slit Wave Interference or the Optical Michelson Interferometer?',
    presetIds: [
      'wave-interference-diffraction-lab',
      'optical-interferometer-explorer',
    ],
  },
  orbital: {
    question:
      'Would you like Atomic Orbital Probability (1s/2s/2p/3d) or Molecular Orbital (LCAO σ/π) bonding?',
    presetIds: [
      'atomic-orbital-probability-explorer',
      'molecular-orbital-explorer',
    ],
  },
  orbitals: {
    question:
      'Would you like Atomic Orbital Probability (1s/2s/2p/3d) or Molecular Orbital (LCAO σ/π) bonding?',
    presetIds: [
      'atomic-orbital-probability-explorer',
      'molecular-orbital-explorer',
    ],
  },
  radiation: {
    question:
      'Would you like Radioactive Alpha/Beta/Gamma Decay or Thermal Radiation Heat Transfer?',
    presetIds: [
      'radioactive-decay-halflife-radiation-lab',
      'heat-transfer-explorer',
    ],
  },
};

/**
 * Computes multi-dimensional semantic similarity score between a user prompt and a preset summary.
 */
function scorePresetCandidate(
  rawPrompt: string,
  normPrompt: string,
  promptTokens: string[],
  preset: PresetSummary
): { score: number; reason: string } {
  const spec = preset.spec;
  const idNorm = preset.id.toLowerCase().replace(/-/g, ' ');
  const titleNorm = normalizeMatcherPrompt(preset.title);
  const conceptNorm = normalizeMatcherPrompt(spec.concept || '');

  // 1. Exact ID or Exact Title match
  if (
    rawPrompt.toLowerCase().trim() === preset.id.toLowerCase() ||
    rawPrompt.toLowerCase().trim() === preset.title.toLowerCase() ||
    normPrompt === idNorm ||
    normPrompt === titleNorm
  ) {
    return {
      score: 0.99,
      reason: `Exact match on preset identifier/title "${preset.title}" (${preset.id}).`,
    };
  }

  // 2. Title or ID phrase containment
  if (
    titleNorm.length >= 5 &&
    (normPrompt.includes(titleNorm) || titleNorm.includes(normPrompt)) &&
    promptTokens.length >= 2
  ) {
    const lengthRatio =
      Math.min(normPrompt.length, titleNorm.length) /
      Math.max(normPrompt.length, titleNorm.length);
    if (lengthRatio >= 0.55) {
      return {
        score: 0.92,
        reason: `High-confidence phrase match with preset title "${preset.title}".`,
      };
    }
  }

  if (promptTokens.length === 0) {
    return { score: 0, reason: 'Empty token set.' };
  }

  // 3. Multi-field token overlap (title, concept, parts/components, parameters, equations, description)
  const titleTokens = new Set(tokenize(preset.title));
  const idTokens = new Set(tokenize(preset.id));
  const conceptTokens = new Set(tokenize(spec.concept || ''));
  const partTokens = new Set(
    (spec.parts || []).flatMap((p) => tokenize(`${p.name} ${p.label || ''}`))
  );
  const paramTokens = new Set(
    Object.values(spec.parameters || {}).flatMap((p) => tokenize(`${p.name} ${p.description || ''}`))
  );
  const descTokens = new Set(
    tokenize(`${spec.description || ''} ${spec.whatIsIt || ''} ${spec.howDoesItWork || ''}`)
  );

  let weightedHits = 0;
  let titleHits = 0;
  let componentHits = 0;

  for (const token of promptTokens) {
    if (titleTokens.has(token) || idTokens.has(token)) {
      weightedHits += 1.0;
      titleHits++;
    } else if (conceptTokens.has(token)) {
      weightedHits += 0.85;
    } else if (partTokens.has(token)) {
      weightedHits += 0.7;
      componentHits++;
    } else if (paramTokens.has(token)) {
      weightedHits += 0.55;
    } else if (descTokens.has(token)) {
      weightedHits += 0.35;
    }
  }

  const promptCoverage = weightedHits / promptTokens.length;
  const titleRecall =
    titleTokens.size > 0 ? titleHits / Math.min(titleTokens.size, promptTokens.length + 1) : 0;

  const combinedScore = Math.min(
    0.89,
    promptCoverage * 0.65 + titleRecall * 0.25 + (componentHits > 0 ? 0.1 : 0)
  );

  return {
    score: combinedScore,
    reason: `Semantic/component similarity score ${combinedScore.toFixed(2)} (title hits: ${titleHits}, component hits: ${componentHits}).`,
  };
}

/**
 * Primary entry point for the Intelligent Prompt-to-Preset Matcher.
 * Evaluates exact matches, semantic matches, related-but-incompatible rejections,
 * ambiguous requests, and custom generation routing.
 */
export function analyzePromptForPresetMatch(
  rawPrompt: string,
  thresholds: MatcherThresholds = DEFAULT_MATCHER_THRESHOLDS
): ModelSelectionDecision {
  const timestamp = new Date().toISOString();
  const trimmed = (rawPrompt || '').trim();
  const normPrompt = normalizeMatcherPrompt(trimmed);
  const promptTokens = tokenize(trimmed);

  // 0. Check invalid / empty prompt
  if (!trimmed || (normPrompt.length === 0 && trimmed.length < 2)) {
    const decision: ModelSelectionDecision = {
      timestamp,
      originalPrompt: rawPrompt,
      normalizedPrompt: normPrompt,
      outcome: 'invalid-request',
      selectedModelId: null,
      confidence: 0,
      compatibilityPassed: false,
      reason: 'Prompt is empty or contains no recognizable scientific concept.',
    };
    logModelSelectionDecision(decision);
    return decision;
  }

  // 1. Check if prompt is a single ambiguous hypernym (e.g. "wave", "cell", "field", "orbital")
  if (promptTokens.length === 1 && AMBIGUOUS_CONCEPT_MAP[promptTokens[0]]) {
    const ambigEntry = AMBIGUOUS_CONCEPT_MAP[promptTokens[0]];
    const candidateOptions: CandidatePresetOption[] = ambigEntry.presetIds
      .map((id) => {
        const spec = CURATED_AI_MODELS[id];
        if (!spec) return null;
        return {
          id: spec.id,
          title: spec.title,
          category: spec.subjectDomain || 'Science',
          concept: spec.concept || spec.title,
          confidence: 0.65,
          reason: `Matches broad concept "${promptTokens[0]}"`,
          spec,
        };
      })
      .filter(Boolean) as CandidatePresetOption[];

    if (candidateOptions.length >= 2) {
      const decision: ModelSelectionDecision = {
        timestamp,
        originalPrompt: rawPrompt,
        normalizedPrompt: normPrompt,
        outcome: 'ambiguous',
        selectedModelId: null,
        confidence: 0.65,
        compatibilityPassed: true,
        reason: `Ambiguous single-word request "${trimmed}" matches ${candidateOptions.length} distinct presets.`,
        clarificationQuestion: ambigEntry.question,
        candidateOptions,
      };
      logModelSelectionDecision(decision);
      return decision;
    }
  }

  // 2. Check if prompt is a specialized custom procedural concept (e.g., Double Pendulum, Hydraulic Press, Nephron, Jet Engine, Volcano, Robotic Arm, etc.)
  if (isSpecializedProceduralConcept(trimmed)) {
    const decision: ModelSelectionDecision = {
      timestamp,
      originalPrompt: rawPrompt,
      normalizedPrompt: normPrompt,
      outcome: 'custom-generation',
      selectedModelId: null,
      confidence: 0.95,
      compatibilityPassed: false,
      incompatibilityReason: `"${trimmed}" requires a specialized custom 3D model not present in the static preset catalogue.`,
      reason: `No compatible preset in catalogue; routing "${trimmed}" to research-first custom 3D generation.`,
    };
    logModelSelectionDecision(decision);
    return decision;
  }

  // 3. Check curated rule-based offline matcher first, then verify compatibility!
  const offlineMatch = matchOfflinePreset(trimmed);
  if (offlineMatch.matched && offlineMatch.spec) {
    const compat = verifyPresetCompatibility(trimmed, offlineMatch.spec);
    if (compat.compatible) {
      const isExact =
        offlineMatch.matchType === 'exact-id' ||
        offlineMatch.matchType === 'exact-title' ||
        normPrompt === normalizeMatcherPrompt(offlineMatch.spec.title) ||
        trimmed.toLowerCase() === offlineMatch.spec.id.toLowerCase();

      const confidence = isExact ? 0.98 : 0.86;
      const outcome: MatchOutcome =
        confidence >= thresholds.exactMatchThreshold ? 'exact-preset' : 'semantic-preset';

      const decision: ModelSelectionDecision = {
        timestamp,
        originalPrompt: rawPrompt,
        normalizedPrompt: normPrompt,
        outcome,
        selectedModelId: offlineMatch.spec.id,
        selectedPreset: offlineMatch.spec,
        confidence,
        compatibilityPassed: true,
        reason: `${isExact ? 'Exact' : 'Semantic'} preset match to "${offlineMatch.spec.title}" (${offlineMatch.spec.id}) via verified domain & component rules.`,
      };
      logModelSelectionDecision(decision);
      return decision;
    } else {
      // Offline rule matched a related domain keyword, but compatibility check rejected it!
      const decision: ModelSelectionDecision = {
        timestamp,
        originalPrompt: rawPrompt,
        normalizedPrompt: normPrompt,
        outcome: 'custom-generation',
        selectedModelId: null,
        confidence: 0.0,
        compatibilityPassed: false,
        incompatibilityReason: compat.reason,
        reason: `Rejected related but incompatible preset "${offlineMatch.spec.id}": ${compat.reason}`,
      };
      logModelSelectionDecision(decision);
      return decision;
    }
  }

  // 4. Score all 90 unique presets across title, concept, components, parameters, and equations
  const allPresets = getUniquePresets();
  const scoredCandidates: {
    preset: PresetSummary;
    score: number;
    reason: string;
    compatible: boolean;
    incompatibilityReason?: string;
  }[] = [];

  for (const preset of allPresets) {
    const { score, reason } = scorePresetCandidate(trimmed, normPrompt, promptTokens, preset);
    if (score >= 0.45) {
      const compat = verifyPresetCompatibility(trimmed, preset.spec);
      scoredCandidates.push({
        preset,
        score,
        reason,
        compatible: compat.compatible,
        incompatibilityReason: compat.compatible ? undefined : compat.reason,
      });
    }
  }

  scoredCandidates.sort((a, b) => b.score - a.score);

  const compatibleCandidates = scoredCandidates.filter((c) => c.compatible);

  if (compatibleCandidates.length > 0) {
    const top = compatibleCandidates[0];
    const second = compatibleCandidates[1];

    // Check if exact match threshold met
    if (top.score >= thresholds.exactMatchThreshold) {
      const decision: ModelSelectionDecision = {
        timestamp,
        originalPrompt: rawPrompt,
        normalizedPrompt: normPrompt,
        outcome: 'exact-preset',
        selectedModelId: top.preset.id,
        selectedPreset: top.preset.spec,
        confidence: top.score,
        compatibilityPassed: true,
        reason: top.reason,
      };
      logModelSelectionDecision(decision);
      return decision;
    }

    // Check if semantic match threshold met (and not closely tied with a competing different preset)
    if (top.score >= thresholds.semanticMatchThreshold) {
      if (second && top.score - second.score < thresholds.ambiguityDeltaThreshold && promptTokens.length <= 2) {
        const options: CandidatePresetOption[] = compatibleCandidates.slice(0, 3).map((c) => ({
          id: c.preset.id,
          title: c.preset.title,
          category: c.preset.category,
          concept: c.preset.spec.concept || c.preset.title,
          confidence: c.score,
          reason: c.reason,
          spec: c.preset.spec,
        }));
        const decision: ModelSelectionDecision = {
          timestamp,
          originalPrompt: rawPrompt,
          normalizedPrompt: normPrompt,
          outcome: 'ambiguous',
          selectedModelId: null,
          confidence: top.score,
          compatibilityPassed: true,
          reason: `Prompt "${trimmed}" closely matches multiple presets ("${top.preset.title}" vs "${second.preset.title}").`,
          clarificationQuestion: `Your request matches multiple models in our library. Which specific model would you like to load, or should we generate a custom 3D model for "${trimmed}"?`,
          candidateOptions: options,
        };
        logModelSelectionDecision(decision);
        return decision;
      }

      const decision: ModelSelectionDecision = {
        timestamp,
        originalPrompt: rawPrompt,
        normalizedPrompt: normPrompt,
        outcome: 'semantic-preset',
        selectedModelId: top.preset.id,
        selectedPreset: top.preset.spec,
        confidence: top.score,
        compatibilityPassed: true,
        reason: top.reason,
      };
      logModelSelectionDecision(decision);
      return decision;
    }
  }

  // 5. If top candidate was rejected specifically due to incompatibility, log that incompatibility reason
  const topIncompatible = scoredCandidates.find((c) => !c.compatible);
  const decision: ModelSelectionDecision = {
    timestamp,
    originalPrompt: rawPrompt,
    normalizedPrompt: normPrompt,
    outcome: 'custom-generation',
    selectedModelId: null,
    confidence: compatibleCandidates[0]?.score ?? 0,
    compatibilityPassed: topIncompatible ? false : true,
    incompatibilityReason: topIncompatible?.incompatibilityReason,
    reason: topIncompatible
      ? `Related preset "${topIncompatible.preset.id}" rejected as incompatible (${topIncompatible.incompatibilityReason}). Routing to custom 3D generation.`
      : `No existing preset met the confidence threshold (${thresholds.semanticMatchThreshold}) for "${trimmed}". Routing to custom 3D generation.`,
  };
  logModelSelectionDecision(decision);
  return decision;
}
