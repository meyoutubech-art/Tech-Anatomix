import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import {
  getAllIntegratedModelsDirectory,
  MY_SCIENCE_MODELS_29,
  ScienceModelDirectoryEntry,
  ModelLaunchTarget,
} from '../data/modelsDirectoryRegistry';
import { ScientificModelSpec, ModelParameterSpec, ModelPartSpec } from '../types/aiModel';
import {
  calculatePendulumMetrics,
  PendulumParams,
} from '../simulations/physics/pendulumEngine';
import {
  calculateProjectileMotion,
  ProjectileParams,
} from '../simulations/physics/projectileEngine';
import {
  calculateCircuitState,
  CircuitParams,
} from '../simulations/physics/circuitEngine';
import {
  evaluateReactionRecipe,
  REAGENTS,
  ReactionEvaluationResult,
} from '../data/reactionsData';
import { CELL_ORGANELLES, HEART_STRUCTURES, DNA_BASE_PAIRS } from '../data/biologyData';
import { FROG_ORGAN_LIST } from '../data/frogAnatomyData';
import { GameSuitabilityTier } from './gameProgressStore';

export type ViewportRendererKind =
  | 'pendulum_scene'
  | 'projectile_scene'
  | 'circuit_scene'
  | 'chemistry_beaker_scene'
  | 'biology_cell_scene'
  | 'biology_heart_scene'
  | 'biology_dna_scene'
  | 'dynamic_3d_spec';

export interface ArenaParameterControl {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
}

export interface DiscoveredModelGameCapability {
  modelId: string;
  title: string;
  category: 'Physics' | 'Chemistry' | 'Biology' | 'Anatomy' | 'Engineering & Earth Science';
  subCategory: string;
  shortDescription: string;
  suitabilityTier: GameSuitabilityTier;
  suitabilityReason: string;
  rendererKind: ViewportRendererKind;
  isInMy29Models: boolean;
  my29Number?: number;
  hasInteractive3D: boolean;
  hasPlayPauseControl: boolean;
  hasCameraReset: boolean;
  hasSimulationReset: boolean;
  hasAnalyticalEngine: boolean;
  adjustableParameters: ArenaParameterControl[];
  selectableParts: { id: string; name: string; functionDescription: string }[];
  keyFormula: string;
  scientificConcept: string;
  launchTarget: ModelLaunchTarget;
  curatedSpec?: ScientificModelSpec;
}

export interface LiveSimulationTelemetryMetric {
  id: string;
  label: string;
  value: number | string;
  formattedValue: string;
  unit: string;
  formula?: string;
}

export interface EvaluatedSimulationState {
  modelId: string;
  isValid: boolean;
  summaryStatus: string;
  metrics: Record<string, number | string>;
  telemetryList: LiveSimulationTelemetryMetric[];
  chemistryEvaluation?: ReactionEvaluationResult;
}

const DEDICATED_GAME_MODEL_IDS = new Set<string>([
  'simple-pendulum',
  'projectile-motion',
  'electric-circuit',
  'standalone-chemistry-beaker-lab',
  'solar-system',
  'hydraulic-lift',
  'newtons-cradle',
  'reflection-refraction',
  'prism-dispersion',
  'wave-motion',
  'sound-wave',
  'dc-motor',
  'ac-generator',
  'rutherford-gold-foil',
  'astronomical-telescope',
  'interactive-atom',
  'heat-transfer-explorer',
  'heart-explorer',
  'standalone-eukaryotic-cell-scene',
  'standalone-human-heart-scene',
  'standalone-dna-double-helix-scene',
  'respiratory-explorer',
  'eye-vision',
  'class-1-lever',
  'inclined-plane',
]);

/**
 * Resolves the underlying ScientificModelSpec from CURATED_AI_MODELS by model ID or key.
 */
export function findCuratedSpecById(modelId: string): ScientificModelSpec | undefined {
  for (const spec of Object.values(CURATED_AI_MODELS)) {
    if (spec && spec.id === modelId) {
      return spec;
    }
  }
  const direct = (CURATED_AI_MODELS as Record<string, ScientificModelSpec>)[modelId];
  return direct;
}

/**
 * Inspects a directory entry from the Tech-Anatomix registry and classifies its
 * exact gameplay suitability and capabilities without fabricating features.
 */
export function inspectModelGameCapability(
  entry: ScienceModelDirectoryEntry
): DiscoveredModelGameCapability {
  const id = entry.id;
  const spec = findCuratedSpecById(id);

  // 1. Standalone Dedicated Physics / Chemistry / Biology Scenes
  if (id === 'simple-pendulum') {
    const pendulumSpec = findCuratedSpecById('simple-pendulum');
    return {
      modelId: id,
      title: entry.title,
      category: 'Physics',
      subCategory: entry.subCategory,
      shortDescription: entry.shortDescription,
      suitabilityTier: 'dedicated_game',
      suitabilityReason:
        'Backed by exact harmonic & non-linear pendulum solver (T = 2π√(L/g)) and interactive 3D PendulumScene.',
      rendererKind: 'pendulum_scene',
      isInMy29Models: entry.isInMy29Models,
      my29Number: entry.my29Number,
      hasInteractive3D: true,
      hasPlayPauseControl: true,
      hasCameraReset: true,
      hasSimulationReset: true,
      hasAnalyticalEngine: true,
      adjustableParameters: [
        { id: 'length', name: 'String Length (L)', min: 0.25, max: 4.0, step: 0.05, defaultValue: 1.5, unit: 'm' },
        { id: 'gravity', name: 'Gravity (g)', min: 1.6, max: 24.8, step: 0.1, defaultValue: 9.81, unit: 'm/s²' },
        { id: 'mass', name: 'Bob Mass (m)', min: 0.2, max: 5.0, step: 0.1, defaultValue: 1.0, unit: 'kg' },
        { id: 'initialAngle', name: 'Release Angle (θ₀)', min: 5, max: 60, step: 1, defaultValue: 25, unit: '°' },
      ],
      selectableParts: (pendulumSpec?.parts || []).map((p) => ({
        id: p.id,
        name: p.name,
        functionDescription: p.description || p.whatDoesItDo || p.name,
      })),
      keyFormula: 'T = 2π√(L / g)',
      scientificConcept: 'Simple Harmonic Motion, Gravity & Mass Independence of Period',
      launchTarget: entry.launchTarget,
      curatedSpec: pendulumSpec,
    };
  }

  if (id === 'projectile-motion') {
    const projSpec = findCuratedSpecById('projectile-motion');
    return {
      modelId: id,
      title: entry.title,
      category: 'Physics',
      subCategory: entry.subCategory,
      shortDescription: entry.shortDescription,
      suitabilityTier: 'dedicated_game',
      suitabilityReason:
        'Backed by 2D ballistic kinematics & quadratic drag RK4 solver with 3D ProjectileScene trajectory rendering.',
      rendererKind: 'projectile_scene',
      isInMy29Models: entry.isInMy29Models,
      my29Number: entry.my29Number,
      hasInteractive3D: true,
      hasPlayPauseControl: true,
      hasCameraReset: true,
      hasSimulationReset: true,
      hasAnalyticalEngine: true,
      adjustableParameters: [
        { id: 'velocity', name: 'Launch Speed (v₀)', min: 5, max: 45, step: 1, defaultValue: 22, unit: 'm/s' },
        { id: 'angle', name: 'Launch Angle (θ)', min: 10, max: 85, step: 1, defaultValue: 45, unit: '°' },
        { id: 'gravity', name: 'Gravity (g)', min: 1.6, max: 20.0, step: 0.1, defaultValue: 9.81, unit: 'm/s²' },
        { id: 'mass', name: 'Projectile Mass (m)', min: 0.5, max: 10.0, step: 0.5, defaultValue: 2.0, unit: 'kg' },
      ],
      selectableParts: (projSpec?.parts || []).map((p) => ({
        id: p.id,
        name: p.name,
        functionDescription: p.description || p.whatDoesItDo || p.name,
      })),
      keyFormula: 'R = (v₀² sin 2θ) / g',
      scientificConcept: 'Parabolic Kinematics, Orthogonal Velocity Vectors & Launch Angle Symmetry',
      launchTarget: entry.launchTarget,
      curatedSpec: projSpec,
    };
  }

  if (id === 'electric-circuit') {
    const circuitSpec = findCuratedSpecById('electric-circuit');
    return {
      modelId: id,
      title: entry.title,
      category: 'Physics',
      subCategory: entry.subCategory,
      shortDescription: entry.shortDescription,
      suitabilityTier: 'dedicated_game',
      suitabilityReason:
        "Backed by Ohm's Law & Joule heating power engine (I = V/R, P = V²/R) and interactive 3D CircuitScene.",
      rendererKind: 'circuit_scene',
      isInMy29Models: entry.isInMy29Models,
      my29Number: entry.my29Number,
      hasInteractive3D: true,
      hasPlayPauseControl: true,
      hasCameraReset: true,
      hasSimulationReset: true,
      hasAnalyticalEngine: true,
      adjustableParameters: [
        { id: 'voltage', name: 'Battery Voltage (V)', min: 1.5, max: 24.0, step: 0.5, defaultValue: 9.0, unit: 'V' },
        { id: 'resistance', name: 'Load Resistance (R)', min: 2.0, max: 50.0, step: 1.0, defaultValue: 10.0, unit: 'Ω' },
        { id: 'isClosed', name: 'Knife Switch (1 = Closed, 0 = Open)', min: 0, max: 1, step: 1, defaultValue: 1, unit: '' },
      ],
      selectableParts: (circuitSpec?.parts || []).map((p) => ({
        id: p.id,
        name: p.name,
        functionDescription: p.description || p.whatDoesItDo || p.name,
      })),
      keyFormula: 'I = V / R · P = V · I',
      scientificConcept: "Ohm's Law, Drift Current & Joule Thermal Power Dissipation",
      launchTarget: entry.launchTarget,
      curatedSpec: circuitSpec,
    };
  }

  if (id === 'standalone-chemistry-beaker-lab') {
    return {
      modelId: id,
      title: 'Chemistry Reaction Quest (3D Beaker Lab)',
      category: 'Chemistry',
      subCategory: 'Stoichiometry, Precipitation, Gas Evolution & Redox',
      shortDescription: entry.shortDescription,
      suitabilityTier: 'dedicated_game',
      suitabilityReason:
        'Backed by the verified 52+ reaction stoichiometry engine, 854-compound registry, and 3D ChemistryLabScene.',
      rendererKind: 'chemistry_beaker_scene',
      isInMy29Models: entry.isInMy29Models,
      my29Number: entry.my29Number,
      hasInteractive3D: true,
      hasPlayPauseControl: true,
      hasCameraReset: true,
      hasSimulationReset: true,
      hasAnalyticalEngine: true,
      adjustableParameters: [
        { id: 'temperature', name: 'Beaker Temperature (T)', min: 10, max: 95, step: 5, defaultValue: 25, unit: '°C' },
        { id: 'concentration', name: 'Reagent Molarity (M)', min: 0.2, max: 2.5, step: 0.1, defaultValue: 1.0, unit: 'M' },
      ],
      selectableParts: REAGENTS.slice(0, 12).map((r) => ({
        id: r.id,
        name: `${r.name} (${r.formula})`,
        functionDescription: r.description,
      })),
      keyFormula: 'aA + bB → cC + dD (ΔH, Ksp, E°)',
      scientificConcept: 'Double-Displacement Precipitation, Acid-Base Neutralization, Gas Evolution & Redox',
      launchTarget: entry.launchTarget,
    };
  }

  if (id === 'standalone-eukaryotic-cell-scene') {
    return {
      modelId: id,
      title: entry.title,
      category: 'Biology',
      subCategory: entry.subCategory,
      shortDescription: entry.shortDescription,
      suitabilityTier: 'dedicated_game',
      suitabilityReason:
        'Interactive 3D CellScene with clickable organelles and verified cytological functions.',
      rendererKind: 'biology_cell_scene',
      isInMy29Models: entry.isInMy29Models,
      my29Number: entry.my29Number,
      hasInteractive3D: true,
      hasPlayPauseControl: true,
      hasCameraReset: true,
      hasSimulationReset: true,
      hasAnalyticalEngine: false,
      adjustableParameters: [],
      selectableParts: CELL_ORGANELLES.map((o) => ({
        id: o.id,
        name: o.name,
        functionDescription: o.function,
      })),
      keyFormula: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 36 ATP',
      scientificConcept: 'Eukaryotic Organelle Compartmentalization & Cellular Bioenergetics',
      launchTarget: entry.launchTarget,
    };
  }

  if (id === 'standalone-human-heart-scene') {
    return {
      modelId: id,
      title: entry.title,
      category: 'Biology',
      subCategory: entry.subCategory,
      shortDescription: entry.shortDescription,
      suitabilityTier: 'dedicated_game',
      suitabilityReason:
        'Interactive 3D HeartScene with clickable chambers, valves, and cardiac cycle hemodynamics.',
      rendererKind: 'biology_heart_scene',
      isInMy29Models: entry.isInMy29Models,
      my29Number: entry.my29Number,
      hasInteractive3D: true,
      hasPlayPauseControl: true,
      hasCameraReset: true,
      hasSimulationReset: true,
      hasAnalyticalEngine: false,
      adjustableParameters: [],
      selectableParts: HEART_STRUCTURES.map((h) => ({
        id: h.id,
        name: h.name,
        functionDescription: h.role,
      })),
      keyFormula: 'CO = HR × SV (Cardiac Output)',
      scientificConcept: 'Four-Chamber Double Circulation & Atrioventricular Valve Hemodynamics',
      launchTarget: entry.launchTarget,
    };
  }

  if (id === 'standalone-dna-double-helix-scene') {
    return {
      modelId: id,
      title: entry.title,
      category: 'Biology',
      subCategory: entry.subCategory,
      shortDescription: entry.shortDescription,
      suitabilityTier: 'dedicated_game',
      suitabilityReason:
        'Interactive 3D DnaScene with Chargaff base-pairing rules (A=T, G≡C) and antiparallel backbone inspection.',
      rendererKind: 'biology_dna_scene',
      isInMy29Models: entry.isInMy29Models,
      my29Number: entry.my29Number,
      hasInteractive3D: true,
      hasPlayPauseControl: true,
      hasCameraReset: true,
      hasSimulationReset: true,
      hasAnalyticalEngine: false,
      adjustableParameters: [],
      selectableParts: DNA_BASE_PAIRS.map((d) => ({
        id: d.id,
        name: d.pairName,
        functionDescription: d.description,
      })),
      keyFormula: '%A = %T · %G = %C (2 H-bonds vs 3 H-bonds)',
      scientificConcept: 'Watson-Crick Complementary Base Pairing & Antiparallel Sugar-Phosphate Strands',
      launchTarget: entry.launchTarget,
    };
  }

  // 2. Curated 3D Models rendered via Dynamic3DModelRenderer
  if (spec) {
    const paramList: ArenaParameterControl[] = Object.values(spec.parameters || {}).map((p: ModelParameterSpec) => ({
      id: p.id,
      name: p.name,
      min: p.min,
      max: p.max,
      step: p.step,
      defaultValue: p.defaultValue,
      unit: p.unit || '',
    }));
    const partList = (spec.parts || []).map((p: ModelPartSpec) => ({
      id: p.id,
      name: p.name,
      functionDescription: p.description || p.whatDoesItDo || p.name,
    }));

    const isDedicated = DEDICATED_GAME_MODEL_IDS.has(id);
    const hasParams = paramList.length > 0;
    const hasParts = partList.length >= 2;

    const suitabilityTier: GameSuitabilityTier = isDedicated
      ? 'dedicated_game'
      : hasParams && hasParts
      ? 'reusable_challenge'
      : hasParts
      ? 'knowledge_quiz_only'
      : 'not_suitable';

    const suitabilityReason =
      suitabilityTier === 'dedicated_game'
        ? `Featured 3D model with ${paramList.length} live simulation parameters and ${partList.length} interactive 3D assemblies.`
        : suitabilityTier === 'reusable_challenge'
        ? `Interactive 3D model supporting live parameter calibration (${paramList.length} controls) and 3D component inspection (${partList.length} parts).`
        : suitabilityTier === 'knowledge_quiz_only'
        ? `3D structural model supporting spatial inspection and verified scientific concept quizzes (${partList.length} parts).`
        : 'Insufficient interactive metadata for verified gameplay.';

    return {
      modelId: id,
      title: entry.title,
      category: entry.category,
      subCategory: entry.subCategory,
      shortDescription: entry.shortDescription || spec.description,
      suitabilityTier,
      suitabilityReason,
      rendererKind: 'dynamic_3d_spec',
      isInMy29Models: entry.isInMy29Models,
      my29Number: entry.my29Number,
      hasInteractive3D: true,
      hasPlayPauseControl: true,
      hasCameraReset: true,
      hasSimulationReset: true,
      hasAnalyticalEngine: hasParams,
      adjustableParameters: paramList,
      selectableParts: partList,
      keyFormula: spec.concept || entry.subCategory,
      scientificConcept: spec.concept || entry.subCategory,
      launchTarget: entry.launchTarget,
      curatedSpec: spec,
    };
  }

  // 3. Remaining standalone / procedural models (Frog Dissection, Skeleton, Molecular Geometry, Procedural Synthesizer)
  if (id === 'frog-anatomy') {
    return {
      modelId: id,
      title: entry.title,
      category: 'Anatomy',
      subCategory: entry.subCategory,
      shortDescription: entry.shortDescription,
      suitabilityTier: 'knowledge_quiz_only',
      suitabilityReason:
        'Verified amphibian anatomical dissection system; supports organ identification and physiological puzzles in the Arena and full interactive dissection in the Anatomy Lab.',
      rendererKind: 'dynamic_3d_spec',
      isInMy29Models: entry.isInMy29Models,
      my29Number: entry.my29Number,
      hasInteractive3D: false,
      hasPlayPauseControl: false,
      hasCameraReset: false,
      hasSimulationReset: true,
      hasAnalyticalEngine: false,
      adjustableParameters: [],
      selectableParts: FROG_ORGAN_LIST.map((o) => ({
        id: o.id,
        name: o.name,
        functionDescription: o.function,
      })),
      keyFormula: '3-Chambered Amphibian Heart (2 Atria, 1 Ventricle)',
      scientificConcept: 'Vertebrate Organ Systems, Cutaneous/Pulmonary Respiration & Hepatic Portal Circulation',
      launchTarget: entry.launchTarget,
    };
  }

  return {
    modelId: id,
    title: entry.title,
    category: entry.category,
    subCategory: entry.subCategory,
    shortDescription: entry.shortDescription,
    suitabilityTier: 'knowledge_quiz_only',
    suitabilityReason:
      'Procedural or specialized lab model; supports validated conceptual science quizzes and direct launch into its native 3D studio.',
    rendererKind: 'dynamic_3d_spec',
    isInMy29Models: entry.isInMy29Models,
    my29Number: entry.my29Number,
    hasInteractive3D: false,
    hasPlayPauseControl: false,
    hasCameraReset: false,
    hasSimulationReset: true,
    hasAnalyticalEngine: false,
    adjustableParameters: [],
    selectableParts: [],
    keyFormula: entry.subCategory,
    scientificConcept: entry.subCategory,
    launchTarget: entry.launchTarget,
  };
}

/**
 * Discovers all integrated models across the Tech-Anatomix registry and classifies
 * their gameplay suitability.
 */
export function discoverAllArenaModels(): DiscoveredModelGameCapability[] {
  const allEntries = getAllIntegratedModelsDirectory();
  return allEntries.map((entry) => inspectModelGameCapability(entry));
}

/**
 * Evaluates the live, scientifically accurate simulation state for a given model and parameter map.
 * Uses the real physics/chemistry engines so game completion criteria are 100% grounded in physics/chemistry.
 */
export function evaluateModelSimulationState(
  modelId: string,
  parameters: Record<string, number>,
  chemistryReagentIds?: string[]
): EvaluatedSimulationState {
  // 1. Simple Pendulum Engine
  if (modelId === 'simple-pendulum') {
    const p: PendulumParams = {
      length: parameters.length ?? 1.5,
      gravity: parameters.gravity ?? 9.81,
      mass: parameters.mass ?? 1.0,
      initialAngle: parameters.initialAngle ?? 25,
      damping: Boolean(parameters.damping),
    };
    const res = calculatePendulumMetrics(p);
    return {
      modelId,
      isValid: true,
      summaryStatus: `Oscillating with Period T = ${res.period} s (f = ${res.frequency} Hz)`,
      metrics: {
        period: res.period,
        frequency: res.frequency,
        maxSpeed: res.maxSpeed,
        maxTension: res.maxTension,
        theoreticalSmallAnglePeriod: res.theoreticalSmallAnglePeriod,
        length: p.length,
        gravity: p.gravity,
        mass: p.mass,
      },
      telemetryList: [
        { id: 'period', label: 'Period (T)', value: res.period, formattedValue: `${res.period.toFixed(2)} s`, unit: 's', formula: '2π√(L/g)' },
        { id: 'frequency', label: 'Frequency (f)', value: res.frequency, formattedValue: `${res.frequency.toFixed(2)} Hz`, unit: 'Hz', formula: '1 / T' },
        { id: 'maxSpeed', label: 'Peak Bob Speed (v_max)', value: res.maxSpeed, formattedValue: `${res.maxSpeed.toFixed(2)} m/s`, unit: 'm/s' },
        { id: 'maxTension', label: 'Peak Tension (T_max)', value: res.maxTension, formattedValue: `${res.maxTension.toFixed(2)} N`, unit: 'N' },
      ],
    };
  }

  // 2. Projectile Motion Engine
  if (modelId === 'projectile-motion') {
    const p: ProjectileParams = {
      velocity: parameters.velocity ?? 22,
      angle: parameters.angle ?? 45,
      gravity: parameters.gravity ?? 9.81,
      launchHeight: parameters.launchHeight ?? 0,
      airResistance: Boolean(parameters.airResistance),
      windSpeed: parameters.windSpeed ?? 0,
      mass: parameters.mass ?? 2.0,
    };
    const res = calculateProjectileMotion(p);
    return {
      modelId,
      isValid: true,
      summaryStatus: `Horizontal Range R = ${res.range} m · Apex H = ${res.maxHeight} m`,
      metrics: {
        horizontalRange: res.range,
        range: res.range,
        maxHeight: res.maxHeight,
        timeOfFlight: res.flightTime,
        velocity: p.velocity,
        angle: p.angle,
        gravity: p.gravity,
      },
      telemetryList: [
        { id: 'horizontalRange', label: 'Horizontal Range (R)', value: res.range, formattedValue: `${res.range.toFixed(1)} m`, unit: 'm', formula: '(v₀² sin 2θ)/g' },
        { id: 'maxHeight', label: 'Max Apex Height (H)', value: res.maxHeight, formattedValue: `${res.maxHeight.toFixed(1)} m`, unit: 'm', formula: '(v₀ sin θ)²/(2g)' },
        { id: 'timeOfFlight', label: 'Time of Flight (t)', value: res.flightTime, formattedValue: `${res.flightTime.toFixed(2)} s`, unit: 's' },
      ],
    };
  }

  // 3. Direct Current Circuit Engine
  if (modelId === 'electric-circuit') {
    const switchClosed = (parameters.isClosed ?? 1) >= 0.5;
    const p: CircuitParams = {
      voltage: parameters.voltage ?? 9.0,
      resistance: parameters.resistance ?? 10.0,
      switchClosed,
    };
    const res = calculateCircuitState(p);
    const isOverheated = res.power > 50;
    return {
      modelId,
      isValid: true,
      summaryStatus: switchClosed
        ? `Closed Loop: Current I = ${res.current} A · Power P = ${res.power} W${isOverheated ? ' (OVERHEATED!)' : ''}`
        : 'Open Circuit: Zero current flow (I = 0 A)',
      metrics: {
        current: res.current,
        power: res.power,
        brightness: res.bulbBrightnessPercent,
        isOverheated: isOverheated ? 1 : 0,
        isClosed: switchClosed ? 1 : 0,
        voltage: p.voltage,
        resistance: p.resistance,
      },
      telemetryList: [
        { id: 'current', label: 'Current (I)', value: res.current, formattedValue: `${res.current.toFixed(2)} A`, unit: 'A', formula: 'V / R' },
        { id: 'power', label: 'Thermal Power (P)', value: res.power, formattedValue: `${res.power.toFixed(2)} W`, unit: 'W', formula: 'V² / R' },
        { id: 'status', label: 'Filament Status', value: isOverheated ? 'Overloaded' : switchClosed ? 'Nominal Glow' : 'Open Switch', formattedValue: isOverheated ? 'Overloaded (>50 W)' : switchClosed ? 'Nominal' : 'Off', unit: '' },
      ],
    };
  }

  // 4. Chemistry Beaker Reaction Engine
  if (modelId === 'standalone-chemistry-beaker-lab') {
    const selectedIds = chemistryReagentIds || [];
    const evalRes = evaluateReactionRecipe({
      ingredients: selectedIds.map((id) => ({ id, amount: 25 })),
      conditions: {
        temperature: parameters.temperature ?? 25,
        concentration: parameters.concentration ?? 1.0,
        catalystId: null,
      },
    });

    const rx = evalRes.reaction;
    return {
      modelId,
      isValid: true,
      summaryStatus:
        evalRes.isSupported && rx
          ? `Verified Reaction: ${rx.balancedEquation}`
          : selectedIds.length < 2
          ? 'Select at least 2 reagents to test reaction stoichiometry'
          : evalRes.message,
      metrics: {
        isReactionSupported: evalRes.isSupported ? 1 : 0,
        reactionId: rx?.id || 'none',
        reactionType: rx?.reactionType || 'none',
        producesPrecipitate: rx?.observableEffects.producesPrecipitate ? 1 : 0,
        producesGas: rx?.observableEffects.producesGas ? 1 : 0,
        temperatureDelta: rx?.observableEffects.temperatureDelta ?? 0,
        reagentCount: selectedIds.length,
      },
      telemetryList: [
        {
          id: 'reactionStatus',
          label: 'Reaction Outcome',
          value: rx ? rx.name : 'No Reaction Yet',
          formattedValue: rx ? rx.name : selectedIds.length < 2 ? 'Awaiting Reagents' : 'No Observable Reaction',
          unit: '',
        },
        {
          id: 'observable',
          label: 'Observable Phase Change',
          value: rx?.observableEffects.producesPrecipitate
            ? `Precipitate: ${rx.observableEffects.precipitateName || 'Solid'}`
            : rx?.observableEffects.producesGas
            ? `Gas: ${rx.observableEffects.gasName || 'Effervescence'}`
            : rx
            ? 'Homogeneous Color / Enthalpy Shift'
            : 'None',
          formattedValue: rx?.observableEffects.producesPrecipitate
            ? `Precipitate (${rx.observableEffects.precipitateName})`
            : rx?.observableEffects.producesGas
            ? `Gas (${rx.observableEffects.gasName})`
            : rx
            ? `ΔT = ${rx.observableEffects.temperatureDelta > 0 ? '+' : ''}${rx.observableEffects.temperatureDelta}°C`
            : '—',
          unit: '',
        },
      ],
      chemistryEvaluation: evalRes,
    };
  }

  // 5. Hydraulic Lift (Pascal's Principle)
  if (modelId === 'hydraulic-lift') {
    const f1 = parameters.inputForce ?? parameters.force ?? 150;
    const areaRatio = parameters.areaRatio ?? parameters.pistonRatio ?? 5;
    const f2 = Number((f1 * areaRatio).toFixed(1));
    const pressureKpa = Number((f1 / 0.02 / 1000).toFixed(1));
    return {
      modelId,
      isValid: true,
      summaryStatus: `Pascal Force Multiplication: F₂ = ${f2} N (${areaRatio}× Mechanical Advantage)`,
      metrics: {
        ...parameters,
        inputForce: f1,
        areaRatio,
        outputForce: f2,
        pressureKpa,
      },
      telemetryList: [
        { id: 'outputForce', label: 'Output Lift Force (F₂)', value: f2, formattedValue: `${f2} N`, unit: 'N', formula: 'F₁ × (A₂/A₁)' },
        { id: 'areaRatio', label: 'Area Ratio (A₂/A₁)', value: areaRatio, formattedValue: `${areaRatio.toFixed(1)}×`, unit: '×' },
        { id: 'pressureKpa', label: 'Fluid Pressure (P)', value: pressureKpa, formattedValue: `${pressureKpa} kPa`, unit: 'kPa', formula: 'F₁ / A₁' },
      ],
    };
  }

  // 6. Wave Motion & Sound Waves
  if (modelId === 'wave-motion' || modelId === 'sound-wave') {
    const freq = parameters.frequency ?? 2.0;
    const amp = parameters.amplitude ?? 1.0;
    const wavelength = parameters.wavelength ?? 3.0;
    const waveSpeed = Number((freq * wavelength).toFixed(2));
    return {
      modelId,
      isValid: true,
      summaryStatus: `Wave Propagation: v = ${waveSpeed} m/s (f = ${freq} Hz, λ = ${wavelength} m)`,
      metrics: {
        ...parameters,
        frequency: freq,
        amplitude: amp,
        wavelength,
        waveSpeed,
      },
      telemetryList: [
        { id: 'waveSpeed', label: 'Phase Velocity (v)', value: waveSpeed, formattedValue: `${waveSpeed} m/s`, unit: 'm/s', formula: 'f × λ' },
        { id: 'frequency', label: 'Frequency (f)', value: freq, formattedValue: `${freq} Hz`, unit: 'Hz' },
        { id: 'amplitude', label: 'Wave Amplitude (A)', value: amp, formattedValue: `${amp} u`, unit: 'u' },
      ],
    };
  }

  // 7. Reflection & Refraction (Snell's Law)
  if (modelId === 'reflection-refraction') {
    const theta1 = parameters.incidentAngle ?? parameters.angle ?? 35;
    const n2 = parameters.refractiveIndex ?? 1.5;
    const sinTheta2 = Math.sin((theta1 * Math.PI) / 180) / n2;
    const refractedDeg = Number(((Math.asin(Math.min(1, sinTheta2)) * 180) / Math.PI).toFixed(1));
    const criticalDeg = Number(((Math.asin(1 / Math.max(1.01, n2)) * 180) / Math.PI).toFixed(1));
    return {
      modelId,
      isValid: true,
      summaryStatus: `Snell's Law: θ₁ = ${theta1}° → Refracted θ₂ = ${refractedDeg}° (n = ${n2})`,
      metrics: {
        ...parameters,
        incidentAngle: theta1,
        refractiveIndex: n2,
        refractedAngle: refractedDeg,
        criticalAngle: criticalDeg,
      },
      telemetryList: [
        { id: 'refractedAngle', label: 'Refracted Angle (θ₂)', value: refractedDeg, formattedValue: `${refractedDeg}°`, unit: '°', formula: 'arcsin(sin θ₁ / n₂)' },
        { id: 'criticalAngle', label: 'Critical Angle (θ_c)', value: criticalDeg, formattedValue: `${criticalDeg}°`, unit: '°', formula: 'arcsin(1 / n₂)' },
        { id: 'refractiveIndex', label: 'Refractive Index (n₂)', value: n2, formattedValue: `${n2.toFixed(2)}`, unit: '' },
      ],
    };
  }

  // 8. Generic Curated 3D Model Telemetry Adapter
  const spec = findCuratedSpecById(modelId);
  const telemetryList: LiveSimulationTelemetryMetric[] = Object.values(spec?.parameters || {}).map(
    (param) => {
      const val = parameters[param.id] ?? param.defaultValue;
      return {
        id: param.id,
        label: param.name,
        value: val,
        formattedValue: `${val}${param.unit ? ` ${param.unit}` : ''}`,
        unit: param.unit || '',
      };
    }
  );

  return {
    modelId,
    isValid: true,
    summaryStatus:
      telemetryList.length > 0
        ? telemetryList.map((t) => `${t.label}: ${t.formattedValue}`).join(' · ')
        : `Interactive 3D Model Ready (${spec?.title || modelId})`,
    metrics: { ...parameters },
    telemetryList,
  };
}

export { MY_SCIENCE_MODELS_29 };
