export type ModelPartShape =
  | 'box'
  | 'cylinder'
  | 'sphere'
  | 'cone'
  | 'torus'
  | 'ring'
  | 'capsule'
  | 'tube'
  | 'octahedron';

export type ModelMaterialType =
  | 'standard'
  | 'metal'
  | 'glass'
  | 'wireframe'
  | 'glow'
  | 'copper'
  | 'rubber'
  | 'tissue'
  | 'liquid'
  | 'bone'
  | 'plastic';

export interface ModelPartSpec {
  id: string;
  name: string;
  shape: ModelPartShape;
  dimensions: number[]; // e.g. [width, height, depth] or [radius, height] or [radius]
  position: [number, number, number];
  rotation?: [number, number, number]; // in radians or degrees
  scale?: [number, number, number];
  color: string;
  material?: ModelMaterialType;
  opacity?: number;
  label?: string; // 3D label display
  labelColor?: string; // Distinct readable text colour for text-only labels
  description?: string; // Information when inspected
  whatIsIt?: string; // Short simple-English definition
  whatDoesItDo?: string; // Short explanation of what this component does
  realLifeExample?: string; // Everyday example connected to this component
  groupId?: string; // e.g. 'rotor' in motor, 'pendulum-arm' in pendulum
  parentId?: string; // Parent part ID for connected hierarchical kinematics
  connectedTo?: string[]; // Topological connections to other part IDs
  kinematicRole?:
    | 'fixed-anchor'
    | 'pivot-joint'
    | 'upper-link'
    | 'upper-mass'
    | 'lower-joint'
    | 'lower-link'
    | 'lower-mass'
    | 'pendulum-arm-1'
    | 'pendulum-arm-2'
    | 'counterweight-left'
    | 'counterweight-right'
    | 'rotor'
    | 'stator'
    | 'piston'
    | 'crank'
    | 'orbital-body'
    | 'wave-node'
    | 'standard';
  opticalRole?: 'objective' | 'eyepiece' | 'diagonal' | 'screen' | 'target' | 'emitter';
  animation?: {
    type: 'spin' | 'oscillate' | 'orbit' | 'pulse';
    axis?: 'x' | 'y' | 'z';
    speed?: number; // radians/sec or cycles/sec
    amplitude?: number;
  };
}

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  domain?: string;
}

export interface ResearchRecord {
  query: string;
  normalizedTopic: string;
  status: 'web-researched' | 'knowledge-based';
  timestamp: string;
  sources: ResearchSource[];
  retrievedFacts: string[];
  extractedComponents: string[];
  extractedMechanism?: string;
  extractedEquations?: string[];
}

export interface ValidationCheckItem {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface ModelValidationReport {
  isValid: boolean;
  identityMatched: boolean;
  componentCountValid: boolean;
  topologyConnected: boolean;
  parametersBound: boolean;
  equationsCoherent: boolean;
  checks: ValidationCheckItem[];
}

export interface ScientificConceptSpecification {
  scientificDomain: string;
  modelCategory?: string;
  chosenInterpretation: string;
  purpose: string;
  essentialComponents: string[];
  topologyAndConnections: string[];
  governingBehavior: string;
  governingEquations: string[];
  expectedOutputs: {
    label: string;
    formulaOrRule: string;
    unit?: string;
  }[];
  limitations: string | string[];
  researchStatus?: 'web-researched' | 'knowledge-based';
  researchSources?: ResearchSource[];
  retrievedFacts?: string[];
  validationChecks?: string[];
}

export interface ModelParameterSpec {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
  description: string;
  affects: 'animationSpeed' | 'objectScale' | 'objectRotation' | 'objectPosition' | 'custom';
  targetPartId?: string;
  scaleFactor?: number;
}

export interface ModelConditionSpec {
  id: string;
  name: string;
  type: 'boolean' | 'select';
  defaultValue: boolean | string;
  options?: { value: string; label: string }[];
  description: string;
}

export interface ScientificModelSpec {
  id: string;
  title: string;
  concept: string; // e.g. "Electromagnetism", "Simple Machines", "Human Anatomy"
  description: string;
  whatIsIt?: string; // Short simple-English definition
  howDoesItWork?: string; // Short explanation of core principle
  realLifeExample?: string; // Familiar everyday example
  examConnection?: string; // Exam tip or key point
  scaleNote?: string; // Explicit educational scaling note (e.g., "Educational scale: atomic nucleus enlarged relative to particle beam")
  simulationModel?: 'predictive' | 'illustrative';
  labelStyle?: 'badge' | 'text-only';
  functionalType?:
    | 'optical-telescope'
    | 'rutherford-scattering'
    | 'pendulum-harmonics'
    | 'dc-motor-assembly'
    | 'class-1-lever'
    | 'respiratory-system'
    | 'bar-magnet-field'
    | 'solar-system'
    | 'water-molecule'
    | 'molecular-vibration'
    | 'compound-microscope'
    | 'human-heart'
    | 'cardiac-cycle'
    | 'human-ear'
    | 'dna-helix'
    | 'eukaryotic-cell'
    | 'nephron'
    | 'projectile-kinematics'
    | 'inclined-plane'
    | 'hydraulic-lift'
    | 'newtons-cradle'
    | 'reflection-refraction'
    | 'prism-dispersion'
    | 'electric-circuit'
    | 'friction-explorer'
    | 'wave-motion'
    | 'sound-wave'
    | 'magnetic-field-explorer'
    | 'interactive-atom'
    | 'bonding-explorer'
    | 'water-molecule-detailed'
    | 'carbon-dioxide-explorer'
    | 'heart-explorer'
    | 'respiratory-explorer'
    | 'digestive-system'
    | 'brain-explorer'
    | 'eye-vision'
    | 'plant-cell-explorer'
    | 'animal-cell-explorer'
    | 'plant-root-transport'
    | 'blood-circulation-microscope'
    | 'blood-transport'
    | 'neuron-nerve-signal'
    | 'ac-generator'
    | 'electromagnetic-induction'
    | 'heat-transfer-explorer'
    | 'four-stroke-engine'
    | 'electric-bell'
    | 'hydroelectric-power'
    | 'motor-effect-fleming'
    | 'electromagnetic-wave-propagation'
    | 'plasma-physics-explorer'
    | 'particle-accelerator-explorer'
    | 'magnetic-levitation-explorer'
    | 'superconductivity-meissner-explorer'
    | 'black-hole-gravitational-lensing'
    | 'quantum-tunnelling-explorer'
    | 'faraday-law-induction-explorer'
    | 'motor-generator-energy-explorer'
    | 'ac-voltage-transformer-explorer'
    | 'wave-interference-diffraction-lab'
    | 'optical-interferometer-explorer'
    | 'fluid-dynamics-bernoulli-vortex'
    | 'tokamak-fusion-confinement-explorer'
    | 'doppler-effect-sonic-boom-explorer'
    | 'seismic-waves-earthquake-lab'
    | 'gyroscope-torque-angular-momentum-lab'
    | 'shm-coupled-oscillators-lab'
    | 'thermodynamics-carnot-heat-engine'
    | 'photoelectric-effect-quantum-explorer'
    | 'special-relativity-time-length-lab'
    | 'maxwell-equations-em-field-explorer'
    | 'ac-circuits-rlc-resonance-lab'
    | 'lenses-optical-instruments-lab'
    | 'doppler-ultrasound-flow-explorer'
    | 'earth-magnetic-field-magnetosphere-explorer'
    | 'semiconductor-pn-junction-diode-explorer'
    | 'radioactive-decay-halflife-radiation-lab'
    | 'molecular-orbital-explorer'
    | 'atomic-orbital-probability-explorer'
    | 'advanced-crystal-lattice-explorer'
    | 'molecular-polarity-explorer'
    | 'intermolecular-forces-explorer'
    | 'electrochemical-cell-simulator'
    | 'electrolysis-explorer'
    | 'chemical-kinetics-simulator'
    | 'chemical-equilibrium-explorer'
    | 'reaction-energy-profile-explorer'
    | 'catalysis-explorer'
    | 'acid-base-titration-laboratory'
    | 'solubility-precipitation-explorer'
    | 'buffer-solution-simulator'
    | 'standard';
  prompt: string;
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  parts: ModelPartSpec[];
  parameters: Record<string, ModelParameterSpec>;
  conditions: Record<string, ModelConditionSpec>;
  formula?: string;
  equations?: string[];
  curiosityPrompts?: string[];
  embedHtml?: string;
  generationSource?: 'ai-live' | 'procedural-synthesizer' | 'curated-preset';
  subjectDomain?: 'Physics' | 'Chemistry' | 'Biology' | 'Anatomy' | 'General Science';
  scientificSpecification?: ScientificConceptSpecification;
  researchRecord?: ResearchRecord;
  validationReport?: ModelValidationReport;
  structuralArchetype?: string;
}
