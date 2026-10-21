import {
  ScientificModelSpec,
  ModelPartSpec,
  ModelParameterSpec,
  ModelConditionSpec,
  ScientificConceptSpecification,
  ResearchRecord,
} from '../types/aiModel';
import { validateResearchGroundedModel } from './modelValidator';

/**
 * CPK Element Colors & Covalent Radii for Dynamic 3D Molecular Geometry Synthesis
 */
const ELEMENT_DATA: Record<
  string,
  { name: string; color: string; radius: number; role: string }
> = {
  H: { name: 'Hydrogen (H)', color: '#f8fafc', radius: 0.34, role: 'Monovalent terminal atom (1s¹)' },
  C: { name: 'Carbon (C)', color: '#334155', radius: 0.56, role: 'Tetravalent framework atom (2s² 2p²)' },
  N: { name: 'Nitrogen (N)', color: '#2563eb', radius: 0.54, role: 'Trivalent pnictogen atom with lone pair (2s² 2p³)' },
  O: { name: 'Oxygen (O)', color: '#dc2626', radius: 0.52, role: 'Divalent chalcogen atom with two lone pairs (2s² 2p⁴)' },
  F: { name: 'Fluorine (F)', color: '#10b981', radius: 0.48, role: 'Highly electronegative halogen atom (χ = 3.98)' },
  Cl: { name: 'Chlorine (Cl)', color: '#22c55e', radius: 0.62, role: 'Halogen terminal atom (3s² 3p⁵)' },
  Br: { name: 'Bromine (Br)', color: '#991b1b', radius: 0.68, role: 'Heavy halogen atom (4s² 4p⁵)' },
  I: { name: 'Iodine (I)', color: '#7e22ce', radius: 0.74, role: 'Polarizable halogen atom (5s² 5p⁵)' },
  S: { name: 'Sulfur (S)', color: '#eab308', radius: 0.64, role: 'Chalcogen central atom capable of expanded valence shells' },
  P: { name: 'Phosphorus (P)', color: '#f97316', radius: 0.65, role: 'Pnictogen central atom capable of sp³d hybridization' },
  B: { name: 'Boron (B)', color: '#ec4899', radius: 0.54, role: 'Electron-deficient group 13 metalloid (sp² trigonal planar)' },
  Si: { name: 'Silicon (Si)', color: '#64748b', radius: 0.66, role: 'Tetravalent semiconductor metalloid (3s² 3p²)' },
  Xe: { name: 'Xenon (Xe)', color: '#06b6d4', radius: 0.72, role: 'Hypervalent noble gas central atom' },
  Na: { name: 'Sodium Ion (Na⁺)', color: '#8b5cf6', radius: 0.58, role: 'Alkali metal cation (+1 charge)' },
  Mg: { name: 'Magnesium (Mg)', color: '#14b8a6', radius: 0.6, role: 'Alkaline earth metal center (+2 charge)' },
  Fe: { name: 'Iron (Fe)', color: '#b45309', radius: 0.64, role: 'Transition metal coordination center' },
};

/**
 * Helper to create a 3D cylinder bond connecting two 3D points p1 and p2
 */
function createBondPart(
  id: string,
  name: string,
  p1: [number, number, number],
  p2: [number, number, number],
  radius = 0.11,
  color = '#94a3b8'
): ModelPartSpec {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  const length = Math.max(0.2, Math.hypot(dx, dy, dz));
  const mid: [number, number, number] = [
    +(p1[0] + dx * 0.5).toFixed(3),
    +(p1[1] + dy * 0.5).toFixed(3),
    +(p1[2] + dz * 0.5).toFixed(3),
  ];

  // Default cylinder is aligned along Y axis (0, 1, 0)
  // Compute Euler rotation from (0,1,0) to normalized (dx,dy,dz)
  const ux = dx / length;
  const uy = dy / length;
  const uz = dz / length;
  const rx = Math.atan2(uz, uy);
  const rz = -Math.asin(Math.max(-1, Math.min(1, ux)));

  return {
    id,
    name,
    label: name,
    shape: 'cylinder',
    dimensions: [radius, +length.toFixed(2)],
    position: mid,
    rotation: [+rx.toFixed(3), 0, +rz.toFixed(3)],
    color,
    material: 'plastic',
    description: `Covalent electron-pair bond connecting atoms (${length.toFixed(2)} Å scaled).`,
    whatIsIt: 'Shared electron-pair covalent bond.',
    whatDoesItDo: 'Holds bonded nuclei together at an equilibrium internuclear distance.',
    realLifeExample: 'Molecular vibrations in infrared (IR) spectroscopy.',
  };
}

/**
 * Synthesizes a complete, interactive 3D ScientificModelSpec from any natural-language prompt.
 * Covers specialized physics, chemistry, biology, anatomy, earth/space, and engineering models
 * as well as arbitrary open-ended STEM prompts.
 */
function inferSynthesizedSubjectDomain(
  prompt: string,
  spec: ScientificModelSpec
): 'Physics' | 'Chemistry' | 'Biology' | 'Anatomy' {
  const combined = `${prompt} ${spec.title} ${spec.concept}`.toLowerCase();
  if (
    combined.includes('molecule') ||
    combined.includes('vsepr') ||
    combined.includes('covalent') ||
    combined.includes('ionic') ||
    combined.includes('acid') ||
    combined.includes('methane') ||
    combined.includes('benzene') ||
    combined.includes('chemical') ||
    combined.includes('chemistry') ||
    combined.includes('crystal') ||
    combined.includes('electrochem')
  ) {
    return 'Chemistry';
  }
  if (
    combined.includes('synapse') ||
    combined.includes('neuron') ||
    combined.includes('nephron') ||
    combined.includes('kidney') ||
    combined.includes('glomerul') ||
    combined.includes('heart') ||
    combined.includes('lung') ||
    /\bear\b/i.test(combined) ||
    combined.includes('cochlea') ||
    combined.includes('anatomy') ||
    combined.includes('sarcomere') ||
    combined.includes('muscle')
  ) {
    return 'Anatomy';
  }
  if (
    combined.includes('chloroplast') ||
    combined.includes('thylakoid') ||
    combined.includes('bacteriophage') ||
    combined.includes('virus') ||
    combined.includes('capsid') ||
    combined.includes('dna') ||
    combined.includes('mitosis') ||
    combined.includes('cell') ||
    combined.includes('membrane') ||
    combined.includes('bilayer') ||
    combined.includes('enzyme') ||
    combined.includes('biology')
  ) {
    return 'Biology';
  }
  return 'Physics';
}

export function buildScientificConceptSpecification(
  prompt: string,
  spec: ScientificModelSpec,
  researchRecord?: ResearchRecord
): ScientificConceptSpecification {
  const activeResearch = researchRecord || spec.researchRecord;
  if (spec.scientificSpecification && !activeResearch) {
    return spec.scientificSpecification;
  }

  const domain = spec.subjectDomain || inferSynthesizedSubjectDomain(prompt, spec);
  const essentialComponents = (spec.parts || []).map((p) => p.label || p.name || p.id);

  // Derive topological connections from parentId / connectedTo or spatial ordering
  const topologyAndConnections: string[] = [];
  (spec.parts || []).forEach((part, idx) => {
    const partLabel = part.label || part.name;
    if (part.parentId) {
      const parentPart = spec.parts.find((p) => p.id === part.parentId);
      if (parentPart) {
        topologyAndConnections.push(
          `${parentPart.label || parentPart.name} ➔ ${partLabel} (kinematic parent-child linkage)`
        );
      }
    } else if (Array.isArray(part.connectedTo) && part.connectedTo.length > 0) {
      const targets = part.connectedTo
        .map((tid) => spec.parts.find((p) => p.id === tid)?.label || tid)
        .join(', ');
      topologyAndConnections.push(`${partLabel} ⟷ ${targets}`);
    } else if (idx > 0 && topologyAndConnections.length < 5) {
      const prevPart = spec.parts[idx - 1];
      topologyAndConnections.push(
        `${prevPart.label || prevPart.name} ➔ ${partLabel} (${part.animation ? `${part.animation.type} dynamics` : 'structural coupling'})`
      );
    }
  });

  if (topologyAndConnections.length === 0 && essentialComponents.length >= 2) {
    topologyAndConnections.push(`${essentialComponents[0]} ➔ ${essentialComponents.slice(1).join(' ➔ ')}`);
  }

  const expectedOutputs = Object.values(spec.parameters || {}).map((param) => ({
    label: `${param.name} Response`,
    formulaOrRule:
      param.affects === 'animationSpeed'
        ? `Modulates dynamic rate (${param.min}–${param.max} ${param.unit})`
        : param.affects === 'objectScale'
          ? `Scales active geometry (${param.min}–${param.max} ${param.unit})`
          : param.affects === 'objectRotation'
            ? `Adjusts angular orientation (${param.min}–${param.max} ${param.unit})`
            : `Shifts spatial coordinate (${param.min}–${param.max} ${param.unit})`,
    unit: param.unit,
  }));

  const validationReport =
    spec.validationReport || validateResearchGroundedModel(prompt, spec, activeResearch);

  return {
    scientificDomain: `${domain} — ${spec.concept}`,
    modelCategory: spec.structuralArchetype || spec.functionalType || 'Interactive 3D Scientific Assembly',
    chosenInterpretation: `Interpreted "${prompt.trim() || spec.title}" as "${spec.title}" (${spec.concept}) with ${essentialComponents.length} interactive 3D subassemblies.`,
    purpose: spec.whatIsIt || spec.description,
    essentialComponents,
    topologyAndConnections,
    governingBehavior:
      spec.howDoesItWork || activeResearch?.extractedMechanism || spec.description,
    governingEquations:
      spec.equations && spec.equations.length > 0
        ? spec.equations
        : activeResearch?.extractedEquations && activeResearch.extractedEquations.length > 0
          ? activeResearch.extractedEquations
          : [spec.formula || 'Conservation of Energy & Structure–Function Coupling'],
    expectedOutputs,
    limitations:
      spec.scaleNote ||
      'Educational 3D representation with idealized component proportions, smooth rigid-body/harmonic kinematics, and neglect of higher-order environmental losses for visual clarity.',
    researchStatus: activeResearch?.status || 'knowledge-based',
    researchSources: activeResearch?.sources || [],
    retrievedFacts: activeResearch?.retrievedFacts || [],
    validationChecks: validationReport.checks.map(
      (c) => `${c.passed ? 'PASS' : 'WARN'}: ${c.label} — ${c.detail}`
    ),
  };
}

export function isSpecializedProceduralConcept(prompt: string): boolean {
  const q = prompt.toLowerCase().trim();
  if (
    q.includes('double pendulum') ||
    q.includes('chaotic pendulum') ||
    q.includes('coupled pendulum') ||
    q.includes('two-link pendulum') ||
    q.includes('atwood') ||
    q.includes('solenoid electromagnet') ||
    q.includes('replication fork') ||
    q.includes('dna replication') ||
    q.includes('helicase') ||
    q.includes('okazaki') ||
    q.includes('chemical synapse') ||
    q.includes('synaptic cleft') ||
    q.includes('mitosis') ||
    q.includes('mitotic spindle') ||
    q.includes('atp synthase') ||
    q.includes('sarcomere') ||
    q.includes('sliding filament') ||
    q.includes('cathode ray') ||
    q.includes('cyclotron') ||
    q.includes('phospholipid bilayer') ||
    q.includes('fluid mosaic') ||
    q.includes('bacteriophage') ||
    q.includes('volcano') ||
    q.includes('magma chamber') ||
    q.includes('wind turbine') ||
    q.includes('hydraulic press') ||
    q.includes('bramah press') ||
    q.includes('hydraulic brak') ||
    q.includes('disc brake') ||
    q.includes('nephron') ||
    q.includes('glomerul') ||
    q.includes('loop of henle') ||
    q.includes('jet engine') ||
    q.includes('turbofan') ||
    q.includes('turbojet') ||
    q.includes('gas turbine') ||
    q.includes('robotic arm') ||
    q.includes('robot arm') ||
    q.includes('manipulator') ||
    q.includes('custom electric motor') ||
    q.includes('brushless motor') ||
    q.includes('prokaryot') ||
    q.includes('flagellum') ||
    q.includes('solar cell') ||
    q.includes('photovoltaic') ||
    q.includes('benzene') ||
    q.includes('chloroplast') ||
    q.includes('thylakoid') ||
    q.includes('synovial joint') ||
    q.includes('sulfuric acid') ||
    q.includes('h2so4') ||
    q.includes('nitric acid') ||
    q.includes('hno3') ||
    (q.includes('methane') && (q.includes('tetrahedral') || q.includes('sp3') || q.includes('vsepr') || q.includes('molecule')))
  ) {
    return true;
  }
  return false;
}

export function synthesizeProceduralScientificModel(
  prompt: string,
  researchRecord?: ResearchRecord
): ScientificModelSpec {
  const spec = synthesizeProceduralScientificModelInternal(prompt, researchRecord);
  const subjectDomain = spec.subjectDomain || inferSynthesizedSubjectDomain(prompt, spec);
  const enriched: ScientificModelSpec = {
    ...spec,
    generationSource: 'procedural-synthesizer',
    subjectDomain,
    researchRecord: researchRecord || spec.researchRecord,
  };
  enriched.validationReport = validateResearchGroundedModel(prompt, enriched, enriched.researchRecord);
  enriched.scientificSpecification = buildScientificConceptSpecification(
    prompt,
    enriched,
    enriched.researchRecord
  );
  return enriched;
}

function synthesizeProceduralScientificModelInternal(
  prompt: string,
  researchRecord?: ResearchRecord
): ScientificModelSpec {
  const q = prompt.toLowerCase().trim();

  // 0A. DOUBLE PENDULUM (COUPLED CHAOTIC LAGRANGIAN PENDULUM)
  if (
    q.includes('double pendulum') ||
    q.includes('chaotic pendulum') ||
    q.includes('coupled pendulum') ||
    q.includes('two-link pendulum') ||
    (q.includes('pendulum') && (q.includes('double') || q.includes('chaos') || q.includes('two rod') || q.includes('lagrangian')))
  ) {
    return {
      id: 'custom-double-pendulum-chaos',
      title: 'Double Pendulum & Chaotic Lagrangian Dynamics',
      concept: 'Nonlinear Classical Mechanics, Coupled Oscillators, Lagrangian Dynamics & Deterministic Chaos',
      subjectDomain: 'Physics',
      description:
        'Interactive 3D coupled two-link gravitational pendulum featuring a rigid overhead support gantry, fixed upper pivot bearing (O₁), upper massless rod 1 (L₁), upper concentrated bob mass (m₁), articulated inter-link hinge joint (O₂), lower rod 2 (L₂) suspended from m₁, and lower bob mass (m₂).',
      whatIsIt:
        'A pendulum with a second pendulum attached directly to the oscillating end of the first, forming a classic two-degree-of-freedom nonlinear dynamical system.',
      howDoesItWork:
        'For small initial angles (θ₀ < 25°), the two links oscillate in predictable normal modes (in-phase and out-of-phase). At larger angles, nonlinear inertial and gravitational torques couple θ₁(t) and θ₂(t) via the Euler–Lagrange equations, producing deterministic chaos with extreme sensitivity to initial conditions while strictly conserving total mechanical energy E = T + V.',
      realLifeExample:
        'Robotic two-link manipulators, human leg hip-and-knee swing biomechanics, golf club double-pendulum swing, and triple-stage gravitational-wave detector suspensions.',
      examConnection:
        'A double pendulum has 2 degrees of freedom (generalized coordinates θ₁, θ₂). Unlike a single simple pendulum, its large-angle equations of motion are non-integrable and exhibit positive Lyapunov exponents (deterministic chaos).',
      scaleNote:
        'Educational scale: pivot bearings and bob radii are enlarged for 3D clicking; rods are modeled as rigid massless links connecting point masses m₁ and m₂.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 0.8, 8.2], target: [0, 0.1, 0] },
      parts: [
        {
          id: 'support-gantry-frame',
          name: 'Overhead A-Frame Support Gantry & Base',
          label: 'Rigid Support Gantry',
          shape: 'box',
          dimensions: [4.2, 0.28, 1.8],
          position: [0, 2.55, -0.25],
          color: '#334155',
          material: 'metal',
          kinematicRole: 'fixed-anchor',
          connectedTo: ['upper-pivot-bearing'],
          description: 'Heavy structural overhead frame anchoring the primary fixed pivot axis O₁ against reaction forces.',
          whatIsIt: 'Rigid laboratory mounting beam at y = +2.4 m.',
          whatDoesItDo: 'Provides an inertial, non-accelerating reference frame for the upper pivot joint.',
        },
        {
          id: 'upper-pivot-bearing',
          name: 'Upper Fixed Pivot Bearing Joint (O₁)',
          label: 'Pivot Joint 1 (O₁ Fixed Axis)',
          shape: 'cylinder',
          dimensions: [0.22, 0.55],
          position: [0, 2.35, 0],
          rotation: [Math.PI / 2, 0, 0],
          color: '#94a3b8',
          material: 'metal',
          parentId: 'support-gantry-frame',
          kinematicRole: 'pivot-joint',
          connectedTo: ['support-gantry-frame', 'upper-pendulum-rod-1'],
          description: 'Low-friction cylindrical rotary axle at the origin O₁ allowing upper rod L₁ to swing freely in the XY plane.',
          whatIsIt: 'First rotational hinge joint (θ₁ axis).',
          whatDoesItDo: 'Constrains the top end of Rod 1 to rotate smoothly about a fixed horizontal axis.',
        },
        {
          id: 'upper-pendulum-rod-1',
          name: 'Upper Pendulum Link Rod 1 (Length L₁)',
          label: 'Upper Rod 1 (L₁)',
          shape: 'cylinder',
          dimensions: [0.08, 1.65],
          position: [0, 1.52, 0],
          color: '#38bdf8',
          material: 'metal',
          parentId: 'upper-pivot-bearing',
          kinematicRole: 'upper-link',
          connectedTo: ['upper-pivot-bearing', 'upper-pendulum-bob-1', 'interlink-hinge-joint-2'],
          description: 'First rigid link of length L₁ connecting Fixed Pivot O₁ to Upper Mass m₁ and Moving Joint O₂.',
          whatIsIt: 'Primary upper pendulum arm (generalized coordinate θ₁).',
          whatDoesItDo: 'Transfers gravitational torque and reaction tension between the fixed support and the lower pendulum.',
          animation: { type: 'oscillate', axis: 'z', speed: 2.1, amplitude: 0.65 },
        },
        {
          id: 'upper-pendulum-bob-1',
          name: 'Upper Pendulum Bob Mass 1 (m₁)',
          label: 'Upper Mass m₁',
          shape: 'sphere',
          dimensions: [0.36],
          position: [0, 0.7, 0],
          color: '#0284c7',
          material: 'metal',
          parentId: 'upper-pendulum-rod-1',
          kinematicRole: 'upper-mass',
          connectedTo: ['upper-pendulum-rod-1', 'interlink-hinge-joint-2'],
          description: 'Concentrated upper mass m₁ located at the distal end of Rod 1: (x₁, y₁) = (L₁ sin θ₁, y₀ − L₁ cos θ₁).',
          whatIsIt: 'First concentrated pendulum mass (m₁).',
          whatDoesItDo: 'Stores kinetic and gravitational potential energy while serving as the moving suspension carrier for the second pendulum.',
          animation: { type: 'oscillate', axis: 'x', speed: 2.1, amplitude: 0.9 },
        },
        {
          id: 'interlink-hinge-joint-2',
          name: 'Articulated Inter-Link Pivot Joint 2 (O₂)',
          label: 'Moving Pivot Joint 2 (O₂)',
          shape: 'cylinder',
          dimensions: [0.16, 0.45],
          position: [0, 0.7, 0.05],
          rotation: [Math.PI / 2, 0, 0],
          color: '#facc15',
          material: 'copper',
          parentId: 'upper-pendulum-bob-1',
          kinematicRole: 'lower-joint',
          connectedTo: ['upper-pendulum-bob-1', 'lower-pendulum-rod-2'],
          description: 'Moving rotary hinge joint pinned directly to Upper Mass m₁, allowing Rod 2 to rotate independently through angle θ₂.',
          whatIsIt: 'Second moving pivot joint coupling Link 1 to Link 2.',
          whatDoesItDo: 'Transmits non-inertial acceleration from the tip of Rod 1 into the lower pendulum link.',
          animation: { type: 'oscillate', axis: 'x', speed: 2.1, amplitude: 0.9 },
        },
        {
          id: 'lower-pendulum-rod-2',
          name: 'Lower Coupled Link Rod 2 (Length L₂)',
          label: 'Lower Rod 2 (L₂)',
          shape: 'cylinder',
          dimensions: [0.07, 1.45],
          position: [0, -0.02, 0.08],
          color: '#f43f5e',
          material: 'metal',
          parentId: 'interlink-hinge-joint-2',
          kinematicRole: 'lower-link',
          connectedTo: ['interlink-hinge-joint-2', 'lower-pendulum-bob-2'],
          description: 'Second rigid link of length L₂ suspended from Moving Pivot Joint O₂ and swinging at angle θ₂(t).',
          whatIsIt: 'Secondary coupled pendulum arm (generalized coordinate θ₂).',
          whatDoesItDo: 'Experiences strong Coriolis and centrifugal coupling torques from the motion of Rod 1, driving chaotic reversals and flips.',
          animation: { type: 'oscillate', axis: 'z', speed: 3.4, amplitude: 1.15 },
        },
        {
          id: 'lower-pendulum-bob-2',
          name: 'Lower Pendulum Bob Mass 2 (m₂)',
          label: 'Lower Mass m₂ (Chaotic Tip)',
          shape: 'sphere',
          dimensions: [0.32],
          position: [0, -0.75, 0.08],
          color: '#e11d48',
          material: 'glow',
          parentId: 'lower-pendulum-rod-2',
          kinematicRole: 'lower-mass',
          connectedTo: ['lower-pendulum-rod-2'],
          description: 'Distal mass m₂ at position (x₂, y₂) = (L₁ sin θ₁ + L₂ sin θ₂, y₀ − L₁ cos θ₁ − L₂ cos θ₂), tracing chaotic trajectories.',
          whatIsIt: 'Second concentrated pendulum mass (m₂) at the free tip.',
          whatDoesItDo: 'Exchanges angular momentum and kinetic energy rapidly with Mass 1, demonstrating sensitive dependence on initial conditions.',
          animation: { type: 'oscillate', axis: 'x', speed: 3.4, amplitude: 1.35 },
        },
        {
          id: 'phase-trajectory-plane',
          name: 'Chaotic Trajectory & Reference Scale Plane',
          label: 'Trajectory Reference Plane',
          shape: 'ring',
          dimensions: [1.8, 3.1],
          position: [0, 0.5, -0.35],
          color: '#475569',
          material: 'glass',
          opacity: 0.25,
          description: 'Concentric energetics boundary ring showing the maximum reachable radius R_max = L₁ + L₂ in the oscillation plane.',
          whatIsIt: 'Spatial envelope ring of radius L₁ + L₂.',
          whatDoesItDo: 'Marks the conservation-of-energy spatial boundary within which both bobs move.',
        },
      ],
      parameters: {
        length1: {
          id: 'length1',
          name: 'Upper Rod Length (L₁)',
          min: 0.8,
          max: 2.2,
          step: 0.1,
          defaultValue: 1.5,
          unit: 'm',
          description: 'Length of the primary upper pendulum rod connecting Fixed Pivot O₁ to Moving Joint O₂.',
          affects: 'objectScale',
          targetPartId: 'upper-pendulum-rod-1',
          scaleFactor: 1.0,
        },
        length2: {
          id: 'length2',
          name: 'Lower Rod Length (L₂)',
          min: 0.6,
          max: 2.0,
          step: 0.1,
          defaultValue: 1.25,
          unit: 'm',
          description: 'Length of the secondary lower pendulum rod suspended from Moving Pivot O₂.',
          affects: 'objectScale',
          targetPartId: 'lower-pendulum-rod-2',
          scaleFactor: 1.0,
        },
        mass1: {
          id: 'mass1',
          name: 'Upper Bob Mass (m₁)',
          min: 0.5,
          max: 5.0,
          step: 0.25,
          defaultValue: 2.0,
          unit: 'kg',
          description: 'Mass of the upper pendulum bob m₁. Increasing m₁/m₂ stabilizes the upper link.',
          affects: 'objectScale',
          targetPartId: 'upper-pendulum-bob-1',
          scaleFactor: 1.0,
        },
        mass2: {
          id: 'mass2',
          name: 'Lower Bob Mass (m₂)',
          min: 0.5,
          max: 5.0,
          step: 0.25,
          defaultValue: 1.5,
          unit: 'kg',
          description: 'Mass of the lower pendulum bob m₂. Larger m₂ amplifies nonlinear inertial feedback onto Rod 1.',
          affects: 'objectScale',
          targetPartId: 'lower-pendulum-bob-2',
          scaleFactor: 1.0,
        },
        initialAngleDeg: {
          id: 'initialAngleDeg',
          name: 'Excitation Amplitude Angle (θ₀)',
          min: 10,
          max: 165,
          step: 5,
          defaultValue: 85,
          unit: '°',
          description: 'Below ~35° motion is quasi-periodic normal-mode oscillation; above ~60° nonlinear chaos and loop flips emerge.',
          affects: 'animationSpeed',
          scaleFactor: 0.02,
        },
        gravity: {
          id: 'gravity',
          name: 'Gravitational Acceleration (g)',
          min: 1.6,
          max: 24.8,
          step: 0.2,
          defaultValue: 9.81,
          unit: 'm/s²',
          description: 'Gravitational field strength (Moon = 1.62, Earth = 9.81, Jupiter = 24.79 m/s²) governing restoring torques.',
          affects: 'animationSpeed',
          scaleFactor: 0.12,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Show Energy Envelope Ring',
          type: 'boolean',
          defaultValue: true,
          description: 'Displays the translucent R_max = L₁ + L₂ reachable boundary plane.',
        },
      },
      equations: [
        'L = T − V = ½(m₁+m₂)L₁²θ̇₁² + ½m₂L₂²θ̇₂² + m₂L₁L₂θ̇₁θ̇₂cos(θ₁−θ₂) + (m₁+m₂)gL₁cosθ₁ + m₂gL₂cosθ₂',
        'x₁ = L₁ sin θ₁ , y₁ = −L₁ cos θ₁ ; x₂ = x₁ + L₂ sin θ₂ , y₂ = y₁ − L₂ cos θ₂',
        'ω±² ≈ (g/L) · (1 + μ ± √(μ(1+μ))) where μ = m₂/m₁ (Small-Angle Normal Modes)',
      ],
      curiosityPrompts: [
        'Why does a double pendulum move predictably at small angles (15°) but become completely chaotic at large angles (90°)?',
        'How is total mechanical energy (E = T + V) conserved even when the trajectory of the lower bob looks random?',
        'What happens to the motion of the lower bob m₂ when the upper mass m₁ is made much heavier than m₂?',
      ],
      scientificSpecification: {
        scientificDomain: 'Classical Mechanics & Nonlinear Lagrangian Dynamics',
        chosenInterpretation:
          'Planar coupled two-link gravitational pendulum (two rigid rods L₁, L₂, two concentrated masses m₁, m₂, and two rotary pivot joints O₁, O₂) governed by coupled Euler–Lagrange equations.',
        purpose:
          'Demonstrate coupled normal-mode oscillations at low energy and deterministic chaos, energy exchange, and kinematic parent-child coupling at high energy.',
        essentialComponents: [
          'Rigid Support Gantry Frame',
          'Upper Fixed Pivot Bearing Joint (O₁)',
          'Upper Pendulum Link Rod 1 (L₁)',
          'Upper Pendulum Bob Mass 1 (m₁)',
          'Articulated Inter-Link Pivot Joint 2 (O₂)',
          'Lower Coupled Link Rod 2 (L₂)',
          'Lower Pendulum Bob Mass 2 (m₂)',
        ],
        topologyAndConnections: [
          'Rigid Support Gantry ➔ Upper Fixed Pivot Joint O₁ (stationary rotation axis)',
          'Upper Fixed Pivot Joint O₁ ➔ Upper Rod 1 (L₁) ➔ Upper Bob Mass m₁ (rotates by θ₁(t))',
          'Upper Bob Mass m₁ ➔ Moving Pivot Joint O₂ (translates with tip of Rod 1 at (L₁ sin θ₁, y₀ − L₁ cos θ₁))',
          'Moving Pivot Joint O₂ ➔ Lower Rod 2 (L₂) ➔ Lower Bob Mass m₂ (rotates by θ₂(t) relative to vertical)',
        ],
        governingBehavior:
          'The two links are kinematically chained so Joint O₂ and Rod 2 always remain attached to the moving tip of Rod 1. Gravitational and inertial coupling torques continuously transfer kinetic energy between m₁ and m₂.',
        governingEquations: [
          'L = T − V (Lagrangian of Two-Link Coupled Pendulum)',
          '(m₁+m₂)L₁θ̈₁ + m₂L₂θ̈₂cos(θ₁−θ₂) + m₂L₂θ̇₂²sin(θ₁−θ₂) + (m₁+m₂)g sinθ₁ = 0',
          'm₂L₂θ̈₂ + m₂L₁θ̈₁cos(θ₁−θ₂) − m₂L₁θ̇₁²sin(θ₁−θ₂) + m₂g sinθ₂ = 0',
        ],
        expectedOutputs: [
          { label: 'In-Phase Normal Mode ω₋', formulaOrRule: 'Slow coupled fundamental oscillation frequency', unit: 'rad/s' },
          { label: 'Anti-Phase Normal Mode ω₊', formulaOrRule: 'Fast counter-swinging normal mode frequency', unit: 'rad/s' },
          { label: 'Total Mechanical Energy E', formulaOrRule: 'E = (m₁+m₂)gL₁(1−cosθ₀) + m₂gL₂(1−cosθ₀)', unit: 'J' },
          { label: 'Dynamical Regime', formulaOrRule: 'Quasi-Periodic (<45°) vs Chaotic Non-Integrable (≥45°)' },
        ],
        limitations:
          'Assumes rigid massless rods, point-mass bobs, frictionless pivot bearings, and planar motion without aerodynamic drag.',
      },
    };
  }

  // 0B. ATWOOD MACHINE & PULLEY SYSTEM
  if (q.includes('atwood') || q.includes('pulley') || q.includes('block and tackle')) {
    return {
      id: 'custom-atwood-machine-pulley',
      title: 'Atwood Machine & Coupled Pulley Mechanics',
      concept: 'Newton’s Second Law, Coupled Tension Forces, Net Acceleration & Mechanical Advantage',
      subjectDomain: 'Physics',
      description:
        'Interactive 3D classical mechanics apparatus consisting of a vertical laboratory column, overhead low-friction pulley wheel on a central axle, inextensible tension cable, left counterweight mass (m₁), and right driving load mass (m₂).',
      whatIsIt:
        'A classic physics laboratory machine invented by George Atwood in 1784 to verify Newton’s laws of motion with constant reduced acceleration.',
      howDoesItWork:
        'Two masses m₁ and m₂ are connected by an inextensible string passing over a pulley. Because the gravitational forces oppose each other along the string, the net driving force is (m₂ − m₁)g while the total inertia is (m₁ + m₂), slowing the acceleration to a = g(m₂ − m₁)/(m₁ + m₂) for accurate measurement.',
      realLifeExample: 'Traction elevators with counterweights, crane hoists, and gym cable pulley machines.',
      examConnection:
        'System acceleration: a = g(m₂ − m₁) / (m₁ + m₂); Rope tension: T = 2·m₁·m₂·g / (m₁ + m₂). Notice T is always strictly between m₁g and m₂g when m₁ ≠ m₂.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 1.2, 8.2], target: [0, 0.2, 0] },
      parts: [
        {
          id: 'atwood-base-stand',
          name: 'Heavy Cast-Iron Base & Vertical Support Column',
          label: 'Support Stand & Column',
          shape: 'box',
          dimensions: [3.6, 0.35, 2.4],
          position: [0, -2.35, -0.5],
          color: '#334155',
          material: 'metal',
          description: 'Weighted laboratory base supporting the vertical pulley mast.',
          whatIsIt: 'Structural foundation base.',
          whatDoesItDo: 'Supports the total downward load 2T exerted on the pulley axle.',
        },
        {
          id: 'overhead-pulley-wheel',
          name: 'Overhead Grooved Pulley Sheave Wheel',
          label: 'Pulley Wheel (Radius R)',
          shape: 'cylinder',
          dimensions: [0.85, 0.22],
          position: [0, 1.95, 0],
          rotation: [Math.PI / 2, 0, 0],
          color: '#f59e0b',
          material: 'metal',
          description: 'Low-inertia grooved wheel rotating on a precision ball-bearing axle.',
          whatIsIt: 'Rotating overhead pulley wheel.',
          whatDoesItDo: 'Redirects rope tension T by 180° so the two hanging masses oppose each other.',
          animation: { type: 'spin', axis: 'z', speed: 1.8, amplitude: 0.2 },
        },
        {
          id: 'pulley-axle-bracket',
          name: 'Pulley Axle Bearing & Mounting Yoke',
          label: 'Axle Bearing Yoke',
          shape: 'cylinder',
          dimensions: [0.22, 0.55],
          position: [0, 1.95, -0.15],
          rotation: [Math.PI / 2, 0, 0],
          color: '#94a3b8',
          material: 'metal',
          description: 'Central axle supporting the pulley wheel and transmitting 2T reaction force to the frame.',
          whatIsIt: 'Fixed pulley rotation axis.',
          whatDoesItDo: 'Minimizes rotational friction torque.',
        },
        {
          id: 'left-tension-cable',
          name: 'Left Tension Cable Segment (Tension T)',
          label: 'Left Cable (Tension T)',
          shape: 'cylinder',
          dimensions: [0.04, 2.4],
          position: [-0.82, 0.7, 0],
          color: '#cbd5e1',
          material: 'metal',
          description: 'Inextensible, massless cord segment transmitting upward tension force T to Mass m₁.',
          whatIsIt: 'Left vertical suspension cord.',
          whatDoesItDo: 'Pulls upward on m₁ with uniform tension T.',
        },
        {
          id: 'right-tension-cable',
          name: 'Right Tension Cable Segment (Tension T)',
          label: 'Right Cable (Tension T)',
          shape: 'cylinder',
          dimensions: [0.04, 2.8],
          position: [0.82, 0.5, 0],
          color: '#cbd5e1',
          material: 'metal',
          description: 'Inextensible cord segment transmitting upward tension force T to Mass m₂.',
          whatIsIt: 'Right vertical suspension cord.',
          whatDoesItDo: 'Pulls upward on m₂ with the same tension T (assuming a massless frictionless pulley).',
        },
        {
          id: 'left-counterweight-m1',
          name: 'Left Hanging Mass 1 (m₁ — Counterweight)',
          label: 'Hanging Mass m₁',
          shape: 'cylinder',
          dimensions: [0.42, 0.75],
          position: [-0.82, -0.65, 0],
          color: '#0284c7',
          material: 'metal',
          description: 'Slotted brass mass hanger m₁ experiencing upward tension T and downward weight m₁g.',
          whatIsIt: 'First suspended mass m₁.',
          whatDoesItDo: 'Accelerates upward when m₂ > m₁ according to T − m₁g = m₁a.',
          animation: { type: 'oscillate', axis: 'y', speed: 1.6, amplitude: 0.45 },
        },
        {
          id: 'right-driving-mass-m2',
          name: 'Right Hanging Mass 2 (m₂ — Driving Load)',
          label: 'Hanging Mass m₂',
          shape: 'cylinder',
          dimensions: [0.48, 0.92],
          position: [0.82, -1.05, 0],
          color: '#e11d48',
          material: 'metal',
          description: 'Heavier slotted mass hanger m₂ experiencing downward weight m₂g and upward tension T.',
          whatIsIt: 'Second suspended mass m₂.',
          whatDoesItDo: 'Accelerates downward when m₂ > m₁ according to m₂g − T = m₂a.',
          animation: { type: 'oscillate', axis: 'y', speed: 1.6, amplitude: 0.45 },
        },
      ],
      parameters: {
        mass1: {
          id: 'mass1',
          name: 'Left Mass (m₁)',
          min: 0.5,
          max: 5.0,
          step: 0.25,
          defaultValue: 2.0,
          unit: 'kg',
          description: 'Mass of the left hanging cylinder m₁.',
          affects: 'objectScale',
          targetPartId: 'left-counterweight-m1',
          scaleFactor: 1.0,
        },
        mass2: {
          id: 'mass2',
          name: 'Right Mass (m₂)',
          min: 0.5,
          max: 5.0,
          step: 0.25,
          defaultValue: 3.0,
          unit: 'kg',
          description: 'Mass of the right hanging cylinder m₂.',
          affects: 'objectScale',
          targetPartId: 'right-driving-mass-m2',
          scaleFactor: 1.0,
        },
        gravity: {
          id: 'gravity',
          name: 'Gravitational Acceleration (g)',
          min: 1.6,
          max: 20.0,
          step: 0.2,
          defaultValue: 9.81,
          unit: 'm/s²',
          description: 'Gravitational field strength driving the net weight difference (m₂ − m₁)g.',
          affects: 'animationSpeed',
          scaleFactor: 0.15,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Show Tension Force Vectors',
          type: 'boolean',
          defaultValue: true,
          description: 'Highlights the equal and opposite tension couplings across the pulley.',
        },
      },
      equations: [
        'a = g · (m₂ − m₁) / (m₁ + m₂) (Coupled System Linear Acceleration)',
        'T = (2 · m₁ · m₂ · g) / (m₁ + m₂) (Inextensible Cord Tension)',
      ],
      curiosityPrompts: [
        'What happens to the acceleration a and tension T when m₁ equals m₂?',
        'Why is the tension T in the string strictly less than the weight of the heavier mass (m₂g)?',
        'How does a real pulley with rotational moment of inertia I = ½MR² modify the acceleration formula?',
      ],
    };
  }

  // 0C. SOLENOID ELECTROMAGNET & FERROMAGNETIC CORE
  if (
    q.includes('solenoid') ||
    q.includes('electromagnet') ||
    (q.includes('inductor') && !q.includes('rlc'))
  ) {
    return {
      id: 'custom-solenoid-electromagnet',
      title: 'Solenoid Electromagnet & Ferromagnetic Core Explorer',
      concept: 'Ampère’s Law, Helical Current Windings, Ferromagnetic Permeability & Uniform Internal B-Field',
      subjectDomain: 'Physics',
      description:
        'Interactive 3D electromagnetism model of a current-carrying helical copper solenoid wound around a high-permeability soft-iron ferromagnetic core, showing the uniform internal axial magnetic field (B = μ₀μᵣnI), external dipole return flux loops, and DC power terminals.',
      whatIsIt:
        'A tightly wound helical coil of insulated copper wire that generates a strong, controllable uniform magnetic field inside its core when electric current flows through it.',
      howDoesItWork:
        'By Ampère’s Law and the Right-Hand Grip Rule, each circular turn of wire contributes axial magnetic flux inside the coil while magnetic fields between adjacent turns cancel. Inserting a soft-iron ferromagnetic core aligns magnetic domains and multiplies the magnetic field strength by the relative permeability μᵣ (hundreds to thousands of times stronger).',
      realLifeExample: 'MRI superconducting magnets, scrapyard lifting electromagnets, automotive starter solenoids, and relay switches.',
      examConnection:
        'Inside a long solenoid, the magnetic field is uniform and parallel to the axis: B = μ₀ · n · I (or B = μ₀ · μᵣ · (N/L) · I with a ferromagnetic core), and is nearly zero outside far from the ends.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 2.8, 7.8], target: [0, 0, 0] },
      parts: [
        {
          id: 'soft-iron-ferromagnetic-core',
          name: 'Soft-Iron Ferromagnetic Core Plunger (μᵣ ≫ 1)',
          label: 'Soft-Iron Core (Domain Alignment)',
          shape: 'cylinder',
          dimensions: [0.55, 3.6],
          position: [0, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#64748b',
          material: 'metal',
          description: 'High-permeability annealed soft-iron cylinder whose magnetic domains align with the coil field to amplify B.',
          whatIsIt: 'Central ferromagnetic iron core.',
          whatDoesItDo: 'Concentrates magnetic flux lines and boosts field strength by factor μᵣ.',
        },
        {
          id: 'copper-solenoid-winding-1',
          name: 'Helical Insulated Copper Solenoid Windings (N Turns)',
          label: 'Copper Solenoid Coil (N Turns)',
          shape: 'torus',
          dimensions: [0.72, 0.14],
          position: [-1.1, 0, 0],
          rotation: [0, Math.PI / 2, 0],
          color: '#d97706',
          material: 'copper',
          description: 'Tightly wound helical copper turns carrying current I around the iron core.',
          whatIsIt: 'Conductive copper electromagnetic winding.',
          whatDoesItDo: 'Generates axial magnetomotive force (MMF = N·I) according to the Right-Hand Grip Rule.',
        },
        {
          id: 'copper-solenoid-winding-2',
          name: 'Central Solenoid Winding Section',
          label: 'Central Helical Turns',
          shape: 'torus',
          dimensions: [0.72, 0.14],
          position: [0, 0, 0],
          rotation: [0, Math.PI / 2, 0],
          color: '#d97706',
          material: 'copper',
          description: 'Central helical turns where internal magnetic flux density B is maximally uniform.',
          whatIsIt: 'Central copper coil windings.',
          whatDoesItDo: 'Sustains the uniform axial magnetic field B = μ₀μᵣnI.',
        },
        {
          id: 'copper-solenoid-winding-3',
          name: 'North-Pole Exit Solenoid Winding Section',
          label: 'North Pole Coil Section (N)',
          shape: 'torus',
          dimensions: [0.72, 0.14],
          position: [1.1, 0, 0],
          rotation: [0, Math.PI / 2, 0],
          color: '#d97706',
          material: 'copper',
          description: 'Right-hand coil section where magnetic field lines emerge as the electromagnet North pole.',
          whatIsIt: 'Distal solenoid winding turns.',
          whatDoesItDo: 'Forms the emergent North magnetic pole when current circulates counterclockwise viewed from the right end.',
        },
        {
          id: 'internal-uniform-flux-beam',
          name: 'Uniform Axial Magnetic Flux Core (B_internal)',
          label: 'Uniform Internal B-Field (B = μ₀nI)',
          shape: 'cylinder',
          dimensions: [0.24, 4.6],
          position: [0, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#38bdf8',
          material: 'glow',
          description: 'Collimated, uniform magnetic field lines running straight along the central axis from South to North inside the solenoid.',
          whatIsIt: 'Internal axial magnetic flux bundle.',
          whatDoesItDo: 'Exerts magnetic pull on ferromagnetic plungers and stores magnetic energy U = ½LI².',
          animation: { type: 'pulse', axis: 'x', speed: 2.6, amplitude: 0.1 },
        },
        {
          id: 'external-dipole-flux-loop-upper',
          name: 'Upper External Dipole Return Flux Loop (N ➔ S)',
          label: 'External Magnetic Flux Loop (N ➔ S)',
          shape: 'torus',
          dimensions: [1.85, 0.06],
          position: [0, 0.95, 0],
          color: '#38bdf8',
          material: 'glass',
          opacity: 0.65,
          description: 'Closed magnetic field line looping outside the solenoid from the North end back to the South end (∇·B = 0).',
          whatIsIt: 'External magnetic return field line.',
          whatDoesItDo: 'Demonstrates that magnetic field lines always form continuous closed loops with no monopoles.',
          animation: { type: 'pulse', axis: 'y', speed: 2.2, amplitude: 0.08 },
        },
        {
          id: 'external-dipole-flux-loop-lower',
          name: 'Lower External Dipole Return Flux Loop (N ➔ S)',
          label: 'Lower Return Flux Loop',
          shape: 'torus',
          dimensions: [1.85, 0.06],
          position: [0, -0.95, 0],
          color: '#38bdf8',
          material: 'glass',
          opacity: 0.65,
          description: 'Symmetric lower magnetic return flux loop completing the dipole field geometry.',
          whatIsIt: 'Lower external magnetic field loop.',
          whatDoesItDo: 'Visualizes the external dipole field pattern identical to a bar magnet.',
          animation: { type: 'pulse', axis: 'y', speed: 2.2, amplitude: 0.08 },
        },
      ],
      parameters: {
        coilCurrentAmps: {
          id: 'coilCurrentAmps',
          name: 'Solenoid Excitation Current (I)',
          min: 0.5,
          max: 15.0,
          step: 0.5,
          defaultValue: 5.0,
          unit: 'A',
          description: 'Magnetic flux density B scales linearly with DC excitation current I.',
          affects: 'animationSpeed',
          scaleFactor: 0.3,
        },
        turnDensityFactor: {
          id: 'turnDensityFactor',
          name: 'Core Permeability & Flux Scale (μᵣ)',
          min: 0.6,
          max: 1.6,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Scales the ferromagnetic core cross-section and magnetic flux bundle intensity.',
          affects: 'objectScale',
          targetPartId: 'internal-uniform-flux-beam',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Show External Return Flux Loops',
          type: 'boolean',
          defaultValue: true,
          description: 'Toggles visibility of the outer magnetic field return loops.',
        },
      },
      equations: [
        'B = μ₀ · μᵣ · n · I = μ₀ · μᵣ · (N / L) · I (Solenoid Axial Magnetic Field)',
        'L = (μ₀ · μᵣ · N² · A) / l , U_B = ½ · L · I² (Self-Inductance & Stored Magnetic Energy)',
      ],
      curiosityPrompts: [
        'Why do we use soft iron instead of hardened steel for the core of an electromagnet that needs to switch on and off?',
        'How do you use the Right-Hand Grip Rule to determine which end of a solenoid becomes the North pole?',
        'Why is the magnetic field inside a long solenoid nearly uniform across its entire cross-section?',
      ],
    };
  }

  // 0D. DNA REPLICATION FORK (HELICASE, POLYMERASE & OKAZAKI FRAGMENTS)
  if (
    q.includes('replication fork') ||
    q.includes('dna replication') ||
    q.includes('helicase') ||
    q.includes('okazaki') ||
    q.includes('dna polymerase')
  ) {
    return {
      id: 'custom-dna-replication-fork',
      title: 'DNA Replication Fork, Helicase & Polymerase Complex',
      concept: 'Semiconservative DNA Replication, Helicase Unwinding, 5′→3′ Polymerase & Okazaki Fragments',
      subjectDomain: 'Biology',
      description:
        'Interactive 3D molecular biology model of an active DNA replication fork showing the parental double helix, ATP-driven DNA Helicase hexamer ring unzipping hydrogen bonds, Topoisomerase (Gyrase) ahead of the fork, continuous Leading-Strand synthesis by DNA Polymerase III, and discontinuous Lagging-Strand Okazaki fragments with RNA primers.',
      whatIsIt:
        'The Y-shaped molecular replisome machinery where parental double-stranded DNA is unwound and copied into two identical daughter DNA duplexes during S-phase.',
      howDoesItWork:
        'DNA Helicase hydrolyzes ATP to break hydrogen bonds between complementary bases (A=T, G≡C), opening the replication fork. Because DNA Polymerase III can only add nucleotides to a free 3′-OH end (5′ ➔ 3′ direction), the Leading Strand is synthesized continuously toward the fork, while the antiparallel Lagging Strand is synthesized discontinuously away from the fork as short Okazaki fragments later sealed by DNA Ligase.',
      realLifeExample: 'Every human cell copying 6 billion base pairs of DNA with <1 error per billion bases before cell division, and PCR amplification in diagnostics.',
      examConnection:
        'Meselson–Stahl Experiment (¹⁵N / ¹⁴N) proved DNA replication is semiconservative. Enzymes: Helicase (unzips H-bonds), Primase (synthesizes RNA primer), DNA Pol III (5′→3′ elongation), DNA Pol I (replaces primer), DNA Ligase (joins phosphodiester nick).',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 2.8, 8.2], target: [0, 0, 0] },
      parts: [
        {
          id: 'parental-dsdna-duplex',
          name: 'Parental Double-Stranded DNA Helix (Template)',
          label: 'Parental dsDNA Duplex',
          shape: 'cylinder',
          dimensions: [0.42, 2.5],
          position: [-1.85, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#38bdf8',
          material: 'plastic',
          description: 'Antiparallel parental DNA double helix (3′→5′ and 5′→3′ strands) entering the replisome.',
          whatIsIt: 'Original double-stranded DNA molecule prior to unwinding.',
          whatDoesItDo: 'Provides both complementary template strands for semiconservative replication.',
          animation: { type: 'spin', axis: 'x', speed: 1.5, amplitude: 0.1 },
        },
        {
          id: 'topoisomerase-gyrase-clamp',
          name: 'Topoisomerase II (DNA Gyrase) Supercoil Reliever',
          label: 'Topoisomerase (Relieves Supercoiling)',
          shape: 'torus',
          dimensions: [0.58, 0.16],
          position: [-2.45, 0, 0],
          rotation: [0, Math.PI / 2, 0],
          color: '#a855f7',
          material: 'tissue',
          description: 'Enzyme upstream of the fork that transiently nicks and reseals the DNA backbone to relieve torsional overwinding strain.',
          whatIsIt: 'Torsional stress-relief enzyme ahead of the fork.',
          whatDoesItDo: 'Prevents positive supercoiling from stalling the advancing helicase.',
        },
        {
          id: 'dna-helicase-hexamer',
          name: 'DNA Helicase Hexamer Ring (ATP Unwinding Motor)',
          label: 'DNA Helicase (Unzips H-Bonds)',
          shape: 'torus',
          dimensions: [0.68, 0.24],
          position: [-0.45, 0, 0],
          rotation: [0, Math.PI / 2, 0],
          color: '#f59e0b',
          material: 'glow',
          description: 'Ring-shaped hexameric motor protein at the apex of the Y-fork that uses ATP hydrolysis to break base-pair hydrogen bonds.',
          whatIsIt: 'The molecular zipper opener at the replication fork vertex.',
          whatDoesItDo: 'Separates double-stranded DNA into two single-stranded templates.',
          animation: { type: 'pulse', axis: 'y', speed: 2.8, amplitude: 0.12 },
        },
        {
          id: 'leading-strand-duplex',
          name: 'Continuous Leading Strand (5′ ➔ 3′ Toward Fork)',
          label: 'Leading Strand (Continuous 5′→3′)',
          shape: 'cylinder',
          dimensions: [0.24, 2.6],
          position: [0.95, 0.78, 0],
          rotation: [0, 0, 1.12],
          color: '#10b981',
          material: 'plastic',
          description: 'Upper daughter duplex where the 3′→5′ parental template allows continuous 5′→3′ polymerization toward the helicase fork.',
          whatIsIt: 'Continuously synthesized daughter DNA strand.',
          whatDoesItDo: 'Elongates smoothly in the same direction as replication fork progression.',
        },
        {
          id: 'dna-polymerase-iii-leading',
          name: 'DNA Polymerase III Holoenzyme & Sliding Clamp (β-Clamp)',
          label: 'DNA Polymerase III (Leading)',
          shape: 'sphere',
          dimensions: [0.52],
          position: [0.55, 0.62, 0.18],
          color: '#ef4444',
          material: 'tissue',
          description: 'High-processivity polymerase enzyme catalyzing phosphodiester bond formation via dNTP nucleophilic attack on the 3′-OH group, with 3′→5′ exonuclease proofreading.',
          whatIsIt: 'Primary DNA-synthesizing enzyme complex.',
          whatDoesItDo: 'Adds complementary deoxynucleotides in the 5′→3′ direction and proofreads mismatches.',
          animation: { type: 'oscillate', axis: 'x', speed: 2.2, amplitude: 0.18 },
        },
        {
          id: 'lagging-strand-okazaki',
          name: 'Discontinuous Lagging Strand & Okazaki Fragments',
          label: 'Lagging Strand (Okazaki Fragments)',
          shape: 'cylinder',
          dimensions: [0.24, 2.6],
          position: [0.95, -0.78, 0],
          rotation: [0, 0, -1.12],
          color: '#fbbf24',
          material: 'plastic',
          description: 'Lower antiparallel branch synthesized discontinuously away from the fork in short 100–2000 nt Okazaki fragments initiated by RNA primers.',
          whatIsIt: 'Discontinuously synthesized daughter strand.',
          whatDoesItDo: 'Overcomes the strict 5′→3′ polymerase rule on the 5′→3′ parental template strand.',
        },
        {
          id: 'primase-ligase-complex',
          name: 'RNA Primase & DNA Ligase Nick-Sealing Complex',
          label: 'Primase & DNA Ligase',
          shape: 'sphere',
          dimensions: [0.46],
          position: [1.25, -0.92, 0.18],
          color: '#06b6d4',
          material: 'tissue',
          description: 'Primase synthesizes short RNA primers to provide a starting 3′-OH; DNA Pol I replaces RNA with DNA, and DNA Ligase seals the sugar-phosphate backbone nicks.',
          whatIsIt: 'Primer-synthesis and fragment-joining enzymes on the lagging strand.',
          whatDoesItDo: 'Initiates each Okazaki fragment and joins them into a continuous intact DNA strand.',
          animation: { type: 'oscillate', axis: 'x', speed: 2.5, amplitude: 0.22 },
        },
      ],
      parameters: {
        forkUnwindingRate: {
          id: 'forkUnwindingRate',
          name: 'Helicase ATP Unwinding Speed',
          min: 50,
          max: 1000,
          step: 50,
          defaultValue: 500,
          unit: 'bp/s',
          description: 'Rate at which DNA Helicase unwinds base pairs and DNA Pol III incorporates nucleotides.',
          affects: 'animationSpeed',
          scaleFactor: 0.004,
        },
        polymeraseClampScale: {
          id: 'polymeraseClampScale',
          name: 'Polymerase Holoenzyme Scale',
          min: 0.75,
          max: 1.45,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Scales the DNA Polymerase III catalytic core for closer structural inspection.',
          affects: 'objectScale',
          targetPartId: 'dna-polymerase-iii-leading',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Highlight Replication Enzymes',
          type: 'boolean',
          defaultValue: true,
          description: 'Emphasizes the active helicase, polymerase, and ligase enzyme complexes at the fork.',
        },
      },
      equations: [
        '(dNMP)ₙ + dNTP ➔ (dNMP)ₙ₊₁ + PPᵢ (5′ ➔ 3′ Nucleophilic Phosphodiester Elongation)',
        'Semiconservative Rule: Each daughter dsDNA = 1 Parental Template Strand + 1 Newly Synthesized Strand',
      ],
      curiosityPrompts: [
        'Why can DNA Polymerase only synthesize DNA in the 5′ to 3′ direction and never 3′ to 5′?',
        'Why does the lagging strand require multiple RNA primers and Okazaki fragments while the leading strand only needs one primer?',
        'What would happen to the DNA molecule ahead of the replication fork if Topoisomerase (Gyrase) were inhibited by an antibiotic like ciprofloxacin?',
      ],
    };
  }

  // 0E. CHEMICAL SYNAPSE & NEUROTRANSMITTER TRANSMISSION
  if (
    q.includes('synapse') ||
    q.includes('synaptic') ||
    q.includes('neurotransmitter') ||
    (q.includes('vesicle') && q.includes('receptor'))
  ) {
    return {
      id: 'custom-chemical-synapse',
      title: 'Chemical Synapse & Neurotransmitter Exocytosis Explorer',
      concept: 'Synaptic Transmission, Voltage-Gated Ca²⁺ Influx, SNARE Exocytosis & Ligand-Gated Ion Channels',
      subjectDomain: 'Anatomy',
      description:
        'Interactive 3D neurobiology model of a chemical synapse featuring the presynaptic axon terminal bouton, voltage-gated calcium (Ca²⁺) channels, neurotransmitter-filled synaptic vesicles, the 20 nm synaptic cleft, diffusing neurotransmitter molecules, and postsynaptic dendritic ligand-gated ionotropic receptors.',
      whatIsIt:
        'The microscopic specialized junction (~20–40 nm gap) where an electrical nerve impulse (action potential) in a presynaptic neuron is converted into a chemical neurotransmitter signal to excite or inhibit a postsynaptic cell.',
      howDoesItWork:
        'When an action potential depolarizes the presynaptic axon terminal, voltage-gated Ca²⁺ channels open and Ca²⁺ ions rush in. Intracellular Ca²⁺ binds synaptotagmin, triggering SNARE proteins to fuse synaptic vesicles with the presynaptic membrane (exocytosis). Neurotransmitters (e.g., acetylcholine, glutamate, GABA) diffuse across the synaptic cleft and bind postsynaptic ligand-gated ion channels, opening them to generate an EPSP or IPSP.',
      realLifeExample: 'Neuromuscular junctions triggering skeletal muscle contraction, memory plasticity (LTP) in the hippocampus, and SSRI antidepressants regulating serotonin reuptake.',
      examConnection:
        'Unidirectional transmission: Chemical synapses transmit signals in ONE direction only (Presynaptic ➔ Postsynaptic) because synaptic vesicles are located exclusively in the presynaptic terminal and neurotransmitter receptors are on the postsynaptic membrane.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 1.8, 7.8], target: [0, 0, 0] },
      parts: [
        {
          id: 'presynaptic-axon-bouton',
          name: 'Presynaptic Axon Terminal Bouton',
          label: 'Presynaptic Axon Terminal',
          shape: 'sphere',
          dimensions: [1.45],
          position: [0, 1.55, 0],
          color: '#38bdf8',
          material: 'glass',
          opacity: 0.45,
          description: 'Swollen distal terminal bulb of the presynaptic axon containing mitochondria and synaptic vesicles.',
          whatIsIt: 'Signal-sending nerve terminal bulb.',
          whatDoesItDo: 'Converts arriving electrical action potentials into Ca²⁺-triggered chemical exocytosis.',
        },
        {
          id: 'voltage-gated-calcium-channel',
          name: 'Voltage-Gated Ca²⁺ Channel (Cav2.1)',
          label: 'Voltage-Gated Ca²⁺ Channel',
          shape: 'cylinder',
          dimensions: [0.22, 0.55],
          position: [-1.05, 0.95, 0.25],
          rotation: [0, 0, 0.45],
          color: '#f59e0b',
          material: 'metal',
          description: 'Transmembrane pore that opens when the arriving action potential depolarizes the terminal to +30 mV.',
          whatIsIt: 'Depolarization-sensing calcium gate.',
          whatDoesItDo: 'Allows extracellular Ca²⁺ ions to rush into the bouton, triggering vesicle fusion.',
        },
        {
          id: 'synaptic-vesicles-cluster',
          name: 'Synaptic Vesicles Loaded with Neurotransmitter',
          label: 'Synaptic Vesicles (ACh / Glutamate)',
          shape: 'sphere',
          dimensions: [0.38],
          position: [0, 1.15, 0],
          color: '#f43f5e',
          material: 'glow',
          description: 'Lipid bilayer vesicles (~40 nm diameter) packed with thousands of neurotransmitter molecules and anchored by SNARE proteins.',
          whatIsIt: 'Membrane storage packets of chemical neurotransmitters.',
          whatDoesItDo: 'Fuses with the presynaptic active zone membrane upon Ca²⁺ binding to release neurotransmitters via exocytosis.',
          animation: { type: 'oscillate', axis: 'y', speed: 2.4, amplitude: 0.22 },
        },
        {
          id: 'diffusing-neurotransmitters',
          name: 'Diffusing Neurotransmitter Molecules in Synaptic Cleft (20 nm)',
          label: 'Synaptic Cleft & Neurotransmitters',
          shape: 'sphere',
          dimensions: [0.24],
          position: [0, 0.0, 0.15],
          color: '#facc15',
          material: 'glow',
          description: 'Chemical messenger molecules (e.g., Acetylcholine, Glutamate, Dopamine) diffusing across the 20 nm extracellular synaptic cleft in <0.5 milliseconds.',
          whatIsIt: 'Chemical signaling molecules crossing the synaptic gap.',
          whatDoesItDo: 'Carries the neural message across the electrically insulated cleft to bind postsynaptic receptors.',
          animation: { type: 'oscillate', axis: 'y', speed: 3.5, amplitude: 0.32 },
        },
        {
          id: 'postsynaptic-receptor-channel-left',
          name: 'Postsynaptic Ligand-Gated Ionotropic Receptor (AMPA / nAChR)',
          label: 'Ligand-Gated Ion Channel (Na⁺ Influx)',
          shape: 'cylinder',
          dimensions: [0.28, 0.65],
          position: [-0.65, -0.85, 0.15],
          color: '#10b981',
          material: 'plastic',
          description: 'Transmembrane receptor protein on the postsynaptic density that opens an ion pore when two neurotransmitter molecules bind.',
          whatIsIt: 'Chemical-to-electrical receptor gate on the receiving neuron.',
          whatDoesItDo: 'Opens to allow Na⁺ influx (excitatory EPSP) or Cl⁻ influx (inhibitory IPSP).',
          animation: { type: 'pulse', axis: 'x', speed: 2.5, amplitude: 0.12 },
        },
        {
          id: 'postsynaptic-receptor-channel-right',
          name: 'Postsynaptic Metabotropic / NMDA Receptor Complex',
          label: 'NMDA / Postsynaptic Receptor',
          shape: 'cylinder',
          dimensions: [0.28, 0.65],
          position: [0.65, -0.85, 0.15],
          color: '#06b6d4',
          material: 'plastic',
          description: 'Coincidence-detecting postsynaptic receptor channel mediating synaptic plasticity and long-term potentiation (LTP).',
          whatIsIt: 'Secondary postsynaptic receptor channel.',
          whatDoesItDo: 'Translates neurotransmitter binding into postsynaptic depolarization and intracellular signaling.',
          animation: { type: 'pulse', axis: 'x', speed: 2.5, amplitude: 0.12 },
        },
        {
          id: 'postsynaptic-dendrite-membrane',
          name: 'Postsynaptic Dendritic Spine & Membrane Density',
          label: 'Postsynaptic Dendritic Membrane',
          shape: 'box',
          dimensions: [4.2, 0.55, 2.8],
          position: [0, -1.45, 0],
          color: '#0f766e',
          material: 'tissue',
          description: 'Receiving dendritic membrane of the downstream neuron containing the postsynaptic density (PSD-95) scaffold.',
          whatIsIt: 'Receiving membrane of the next neuron or muscle fiber.',
          whatDoesItDo: 'Summates excitatory (EPSP) and inhibitory (IPSP) potentials toward the axon hillock threshold.',
        },
      ],
      parameters: {
        calciumInfluxRate: {
          id: 'calciumInfluxRate',
          name: 'Presynaptic Ca²⁺ Influx & Firing Frequency',
          min: 10,
          max: 200,
          step: 10,
          defaultValue: 80,
          unit: 'Hz',
          description: 'Controls action-potential frequency, Ca²⁺-triggered vesicle exocytosis speed, and cleft diffusion rate.',
          affects: 'animationSpeed',
          scaleFactor: 0.025,
        },
        vesicleQuantalSize: {
          id: 'vesicleQuantalSize',
          name: 'Vesicle Quantal Release Pool',
          min: 0.7,
          max: 1.5,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Scales the active synaptic vesicle cluster and neurotransmitter release volume.',
          affects: 'objectScale',
          targetPartId: 'synaptic-vesicles-cluster',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Transparent Bouton Cutaway',
          type: 'boolean',
          defaultValue: true,
          description: 'Makes the presynaptic axon terminal translucent to reveal internal synaptic vesicles.',
        },
      },
      equations: [
        'I_syn = g_syn(t) · (V_m − E_rev) (Postsynaptic Conductance & Driving Force Equation)',
        't_diffusion ≈ x² / (2·D) ≈ (20 nm)² / (2 · 600 μm²/s) < 1 μs (Synaptic Cleft Diffusion Time)',
      ],
      curiosityPrompts: [
        'Why can a chemical synapse only transmit nerve signals in one direction (from axon terminal to dendrite)?',
        'What is the exact role of Calcium ions (Ca²⁺) when an action potential reaches the presynaptic terminal?',
        'What happens if an enzyme like acetylcholinesterase is blocked by a nerve agent or medication?',
      ],
    };
  }

  // 0F. CELL MITOSIS & MITOTIC SPINDLE APPARATUS
  if (
    q.includes('mitosis') ||
    q.includes('meiosis') ||
    q.includes('spindle') ||
    q.includes('metaphase') ||
    q.includes('anaphase') ||
    q.includes('chromosome') ||
    q.includes('chromatids')
  ) {
    return {
      id: 'custom-cell-mitosis-spindle',
      title: 'Cell Mitosis (Metaphase–Anaphase) & Mitotic Spindle Apparatus',
      concept: 'Eukaryotic Cell Division, Centrosome Spindle Poles, Kinetochore Microtubules & Chromosome Segregation',
      subjectDomain: 'Biology',
      description:
        'Interactive 3D cell biology model of eukaryotic mitosis at Metaphase/Anaphase transition displaying the dividing cell membrane, opposite centrosomes (centriole pairs) at the spindle poles, α/β-tubulin spindle microtubules, replicated X-shaped sister chromatids aligned along the equatorial metaphase plate, and centromere kinetochores.',
      whatIsIt:
        'The eukaryotic nuclear division process that equally partitions duplicated chromosomes into two genetically identical diploid (2n) daughter nuclei.',
      howDoesItWork:
        'During Prophase and Prometaphase, the nuclear envelope breaks down and centrosomes migrate to opposite poles, polymerizing dynamic microtubule fibers. In Metaphase, kinetochore microtubules attach to centromere proteins and align all sister chromatids along the equatorial metaphase plate (verified by the Spindle Assembly Checkpoint). In Anaphase, separase cleaves cohesin and motor proteins (dynein/kinesin) depolymerize microtubules to pull sister chromatids apart to opposite poles.',
      realLifeExample: 'Embryonic growth, skin and intestinal wound healing, and chemotherapy drugs (like Paclitaxel/Taxol) that freeze mitotic spindle microtubules to halt cancer division.',
      examConnection:
        'PMAT Stages: Prophase (chromosomes condense, spindle forms) ➔ Metaphase (chromosomes align at equator) ➔ Anaphase (sister chromatids separate to poles) ➔ Telophase (nuclear envelopes reform) + Cytokinesis.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 2.5, 8.0], target: [0, 0, 0] },
      parts: [
        {
          id: 'dividing-cell-membrane',
          name: 'Dividing Eukaryotic Cell Plasma Membrane',
          label: 'Dividing Cell Membrane',
          shape: 'capsule',
          dimensions: [1.55, 1.8],
          position: [0, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#38bdf8',
          material: 'glass',
          opacity: 0.35,
          description: 'Elongating plasma membrane preparing to form the contractile actin-myosin cleavage furrow during cytokinesis.',
          whatIsIt: 'Outer cell membrane of the dividing mother cell.',
          whatDoesItDo: 'Encloses the mitotic spindle apparatus and pinches inward during cytokinesis.',
        },
        {
          id: 'left-centrosome-pole',
          name: 'Left Centrosome Spindle Pole (Centriole Pair & MTOC)',
          label: 'Left Centrosome (Spindle Pole)',
          shape: 'sphere',
          dimensions: [0.34],
          position: [-2.05, 0, 0],
          color: '#f59e0b',
          material: 'glow',
          description: 'Microtubule-Organizing Center (MTOC) containing perpendicular barrel-shaped centrioles and γ-tubulin ring complexes.',
          whatIsIt: 'Left pole anchor of the mitotic spindle.',
          whatDoesItDo: 'Nucleates and anchors the minus (−) ends of spindle microtubules.',
        },
        {
          id: 'right-centrosome-pole',
          name: 'Right Centrosome Spindle Pole (Centriole Pair & MTOC)',
          label: 'Right Centrosome (Spindle Pole)',
          shape: 'sphere',
          dimensions: [0.34],
          position: [2.05, 0, 0],
          color: '#f59e0b',
          material: 'glow',
          description: 'Opposite spindle pole centrosome ensuring bipolar chromosome segregation.',
          whatIsIt: 'Right pole anchor of the mitotic spindle.',
          whatDoesItDo: 'Pulls one complete set of daughter chromosomes into the right daughter cell.',
        },
        {
          id: 'kinetochore-spindle-fibers-upper',
          name: 'Upper Kinetochore Microtubule Spindle Fibers',
          label: 'Kinetochore Spindle Fibers',
          shape: 'cylinder',
          dimensions: [0.06, 4.0],
          position: [0, 0.55, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#34d399',
          material: 'plastic',
          description: 'Dynamic cylindrical polymers of α- and β-tubulin dimers linking the centrosome poles to chromosome kinetochores.',
          whatIsIt: 'Protein microtubule cables of the mitotic spindle.',
          whatDoesItDo: 'Generates balanced tension to align chromosomes at Metaphase and shortens during Anaphase.',
        },
        {
          id: 'kinetochore-spindle-fibers-lower',
          name: 'Lower Kinetochore & Polar Microtubule Fibers',
          label: 'Polar Spindle Microtubules',
          shape: 'cylinder',
          dimensions: [0.06, 4.0],
          position: [0, -0.55, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#34d399',
          material: 'plastic',
          description: 'Interpolar and kinetochore microtubules that push poles apart (Anaphase B) and pull chromatids to poles (Anaphase A).',
          whatIsIt: 'Lower bundle of mitotic spindle fibers.',
          whatDoesItDo: 'Maintains structural bipolarity of the dividing cell.',
        },
        {
          id: 'sister-chromatid-pair-1',
          name: 'Condensed Metaphase Chromosome 1 (Sister Chromatids)',
          label: 'Sister Chromatids (Metaphase Plate)',
          shape: 'capsule',
          dimensions: [0.22, 0.85],
          position: [0, 0.55, 0],
          color: '#e11d48',
          material: 'tissue',
          description: 'Supercoiled DNA-histone chromatin complex consisting of two identical sister chromatids joined at the centromere by cohesin rings.',
          whatIsIt: 'Duplicated condensed chromosome aligned at the cell equator.',
          whatDoesItDo: 'Ensures each daughter cell receives an exact copy of the genetic blueprint.',
          animation: { type: 'oscillate', axis: 'x', speed: 2.0, amplitude: 0.35 },
        },
        {
          id: 'sister-chromatid-pair-2',
          name: 'Condensed Metaphase Chromosome 2 & Kinetochore Complex',
          label: 'Centromere & Kinetochore Complex',
          shape: 'capsule',
          dimensions: [0.22, 0.85],
          position: [0, -0.55, 0],
          color: '#a855f7',
          material: 'tissue',
          description: 'Second homologous chromosome aligned at the equatorial metaphase plate with bilateral kinetochore attachment.',
          whatIsIt: 'Equatorial chromosome with kinetochore motor proteins.',
          whatDoesItDo: 'Satisfies the Spindle Assembly Checkpoint (SAC) only when under equal bi-oriented tension from both poles.',
          animation: { type: 'oscillate', axis: 'x', speed: 2.0, amplitude: 0.35 },
        },
      ],
      parameters: {
        spindleTensionRate: {
          id: 'spindleTensionRate',
          name: 'Microtubule Depolymerization & Anaphase Rate',
          min: 0.4,
          max: 4.0,
          step: 0.2,
          defaultValue: 2.0,
          unit: 'μm/min',
          description: 'Controls the dynamic oscillation and segregation speed of chromatids along the spindle fibers.',
          affects: 'animationSpeed',
          scaleFactor: 1.0,
        },
        chromatinCondensation: {
          id: 'chromatinCondensation',
          name: 'Chromatin Condensation Factor',
          min: 0.75,
          max: 1.45,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Scales the condensed metaphase sister chromatid volume.',
          affects: 'objectScale',
          targetPartId: 'sister-chromatid-pair-1',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Transparent Cell Cortex',
          type: 'boolean',
          defaultValue: true,
          description: 'Reveals the internal centrosomes, spindle fibers, and chromosomes.',
        },
      },
      equations: [
        '2n (4c Replicated S-Phase) ➔ Mitosis ➔ 2 × 2n (2c Diploid Daughter Cells)',
        'F_kinetochore ≈ 50 pN per chromosome (Dynein / Microtubule Depolymerization Pulling Force)',
      ],
      curiosityPrompts: [
        'How does the cell’s Spindle Assembly Checkpoint know when every single chromosome is properly attached before triggering Anaphase?',
        'What is the difference between a chromosome and a sister chromatid during Metaphase vs Anaphase?',
        'How do cancer drugs like Vinblastine and Taxol stop tumor growth by targeting mitotic spindle microtubules?',
      ],
    };
  }

  // 0G. ATP SYNTHASE MOLECULAR ROTARY MOTOR
  if (
    q.includes('atp synthase') ||
    q.includes('chemiosmosis') ||
    q.includes('f0 f1') ||
    q.includes('oxidative phosphorylation')
  ) {
    return {
      id: 'custom-atp-synthase-motor',
      title: 'ATP Synthase (F₀F₁) Chemiosmotic Rotary Nanomotor',
      concept: 'Bioenergetics, Chemiosmotic Proton Gradient (Δp), Rotary Catalysis & ATP Phosphorylation',
      subjectDomain: 'Biology',
      description:
        'Interactive 3D structural biochemistry model of the mitochondrial F₀F₁-ATP Synthase molecular machine showing the inner mitochondrial phospholipid membrane, transmembrane F₀ proton-channel rotor (c-ring and a-subunit), rotating central γ-stalk, stationary F₁ catalytic hexamer head (α₃β₃), and peripheral stator stalk.',
      whatIsIt:
        'The world’s smallest rotary motor (~10 nm diameter), embedded in mitochondrial cristae and chloroplast thylakoid membranes, that synthesizes cellular energy currency (ATP) from ADP and inorganic phosphate (Pᵢ).',
      howDoesItWork:
        'According to Peter Mitchell’s Chemiosmotic Theory, the electron transport chain pumps protons (H⁺) into the intermembrane space, creating a steep electrochemical proton-motive force (Δp). As H⁺ ions flow back down their gradient through the F₀ a-subunit half-channels, they protonate glutamate/aspartate residues on the c-ring, spinning the c-ring and central asymmetric γ-shaft at ~100–150 rev/s. The rotating γ-cam forces the three catalytic β-subunits of the F₁ head through Open ➔ Loose ➔ Tight conformations (Boyer’s Binding Change Mechanism), synthesizing 3 ATP per 360° turn.',
      realLifeExample: 'An average human body synthesizes and recycles roughly its own body weight (~60–75 kg) of ATP molecules every single day via ATP Synthase!',
      examConnection:
        'F₀ is the transmembrane proton-conducting rotor (inhibited by oligomycin); F₁ is the matrix-facing catalytic head (α₃β₃γδε) where ADP + Pᵢ ➔ ATP occurs via Open (release), Loose (bind ADP+Pᵢ), and Tight (catalyze ATP) conformational states.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 2.2, 8.0], target: [0, 0, 0] },
      parts: [
        {
          id: 'inner-mitochondrial-membrane',
          name: 'Inner Mitochondrial Cristae Membrane (Bilayer)',
          label: 'Inner Mitochondrial Membrane',
          shape: 'box',
          dimensions: [5.0, 0.55, 3.6],
          position: [0, -0.95, 0],
          color: '#0f766e',
          material: 'glass',
          opacity: 0.45,
          description: 'Impermeable cardiolipin-rich phospholipid bilayer separating the high-[H⁺] intermembrane space (pH ~7.0) from the low-[H⁺] mitochondrial matrix (pH ~7.8).',
          whatIsIt: 'Insulating biological membrane maintaining the proton gradient.',
          whatDoesItDo: 'Forces protons (H⁺) to re-enter the matrix exclusively through the F₀ turbine channel.',
        },
        {
          id: 'f0-c-ring-rotor',
          name: 'F₀ Transmembrane c-Subunit Rotor Ring (Proton Turbine)',
          label: 'F₀ c-Ring Proton Rotor',
          shape: 'cylinder',
          dimensions: [0.68, 0.95],
          position: [0, -0.95, 0],
          color: '#f59e0b',
          material: 'metal',
          description: 'Barrel of 8–15 hydrophobic c-subunits that rotates as protons bind and unbind conserved carboxylate residues.',
          whatIsIt: 'Transmembrane proton-driven rotary turbine.',
          whatDoesItDo: 'Converts transmembrane H⁺ electrochemical potential energy into mechanical torque.',
          animation: { type: 'spin', axis: 'y', speed: 3.5, amplitude: 0.1 },
        },
        {
          id: 'central-gamma-cam-shaft',
          name: 'Asymmetric Central γ-Subunit Rotary Drive Shaft',
          label: 'γ-Subunit Rotary Camshaft',
          shape: 'cylinder',
          dimensions: [0.22, 1.85],
          position: [0, 0.15, 0],
          color: '#ef4444',
          material: 'glow',
          description: 'Coiled-coil asymmetric axle connecting the spinning F₀ c-ring to the inside of the F₁ catalytic hexamer.',
          whatIsIt: 'Molecular drive shaft and mechanical cam.',
          whatDoesItDo: 'Rotates in 120° steps inside the stationary α₃β₃ head, mechanically deforming the β catalytic sites.',
          animation: { type: 'spin', axis: 'y', speed: 3.5, amplitude: 0.15 },
        },
        {
          id: 'f1-catalytic-hexamer-head',
          name: 'F₁ Catalytic Hexamer Head (α₃β₃ — Open / Loose / Tight)',
          label: 'F₁ Catalytic Head (α₃β₃ — 3 ATP/turn)',
          shape: 'sphere',
          dimensions: [1.15],
          position: [0, 1.35, 0],
          color: '#38bdf8',
          material: 'glass',
          opacity: 0.68,
          description: 'Alternating trimer of three α and three catalytic β subunits projecting into the mitochondrial matrix.',
          whatIsIt: 'Catalytic ATP-synthesizing head domain.',
          whatDoesItDo: 'Cycles through Open (O), Loose (L), and Tight (T) conformations to condense ADP + Pᵢ into 3 ATP molecules per revolution.',
          animation: { type: 'pulse', axis: 'y', speed: 3.0, amplitude: 0.08 },
        },
        {
          id: 'stator-peripheral-stalk',
          name: 'Peripheral Stator Stalk (a-b₂-δ Subunit Anchor)',
          label: 'Peripheral Stator Stalk (Anti-Rotation)',
          shape: 'cylinder',
          dimensions: [0.14, 2.55],
          position: [1.18, 0.25, 0],
          color: '#10b981',
          material: 'plastic',
          description: 'Rigid external protein arm linking the stationary membrane a-subunit proton channel to the top of the F₁ hexamer.',
          whatIsIt: 'Stationary mechanical stator brace.',
          whatDoesItDo: 'Prevents the α₃β₃ catalytic head from spinning futilely with the γ-shaft so relative torque does chemical work.',
        },
        {
          id: 'proton-flux-channel-a',
          name: 'a-Subunit Proton Half-Channel (H⁺ Entry Conduit)',
          label: 'a-Subunit H⁺ Channel',
          shape: 'cylinder',
          dimensions: [0.32, 0.95],
          position: [0.92, -0.95, 0],
          color: '#a855f7',
          material: 'tissue',
          description: 'Stationary transmembrane subunit containing two offset aqueous half-channels that guide H⁺ ions onto and off the spinning c-ring.',
          whatIsIt: 'Proton entry and exit stator gate.',
          whatDoesItDo: 'Couples downward H⁺ translocation strictly to unidirectional rotation of the c-ring.',
        },
      ],
      parameters: {
        protonGradientMv: {
          id: 'protonGradientMv',
          name: 'Proton-Motive Force (Δp)',
          min: 50,
          max: 240,
          step: 10,
          defaultValue: 180,
          unit: 'mV',
          description: 'Electrochemical H⁺ gradient across the inner membrane driving c-ring and γ-shaft rotation speed (~3 ATP per 10 H⁺).',
          affects: 'animationSpeed',
          scaleFactor: 0.018,
        },
        f1HeadScale: {
          id: 'f1HeadScale',
          name: 'F₁ Catalytic Head Scale',
          min: 0.75,
          max: 1.4,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Scales the α₃β₃ catalytic hexamer to inspect the internal γ-shaft.',
          affects: 'objectScale',
          targetPartId: 'f1-catalytic-hexamer-head',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Translucent F₁ Head & Membrane',
          type: 'boolean',
          defaultValue: true,
          description: 'Reveals the rotating central γ-shaft inside the stationary F₁ catalytic head.',
        },
      },
      equations: [
        'ADP³⁻ + HPO₄²⁻ + H⁺ + ~3.3 H⁺_ims ➔ ATP⁴⁻ + H₂O + ~3.3 H⁺_matrix (Rotary Chemiosmotic Coupling)',
        'ΔG_ATP ≈ +50 kJ/mol driven by Δp = Δψ − (2.3RT/F)ΔpH ≈ 180–200 mV',
      ],
      curiosityPrompts: [
        'What would happen if the peripheral stator stalk broke and the F₁ head spun along with the central γ-shaft?',
        'Why can ATP Synthase run in reverse (hydrolyzing ATP to pump protons backward) if the mitochondrial membrane potential collapses?',
        'How did scientists prove experimentally that the γ-subunit actually rotates in 120° steps?',
      ],
    };
  }

  // 0H. SARCOMERE & SLIDING FILAMENT MUSCLE CONTRACTION
  if (
    q.includes('sarcomere') ||
    q.includes('sliding filament') ||
    (q.includes('actin') && q.includes('myosin')) ||
    q.includes('myofibril') ||
    (q.includes('muscle') && q.includes('contraction'))
  ) {
    return {
      id: 'custom-sarcomere-sliding-filament',
      title: 'Skeletal Muscle Sarcomere & Sliding Filament Mechanism',
      concept: 'Muscle Physiology, Actin–Myosin Cross-Bridge Cycling, ATP Power Stroke & Ca²⁺–Troponin Regulation',
      subjectDomain: 'Anatomy',
      description:
        'Interactive 3D physiology model of a striated muscle sarcomere (the contractile unit between two Z-discs) illustrating the left and right Z-discs, thin Actin filaments (with troponin and tropomyosin), thick Myosin II bipolar filament bundle with ATPase cross-bridge heads, and central M-line.',
      whatIsIt:
        'The fundamental repeating ~2.2 μm contractile unit of striated skeletal and cardiac muscle myofibrils.',
      howDoesItWork:
        'According to the Huxley Sliding Filament Theory, neither actin nor myosin filaments change their own length during contraction. Instead, Ca²⁺ released from the sarcoplasmic reticulum binds Troponin-C, shifting Tropomyosin to expose binding sites on thin Actin filaments. Myosin heads bind actin, execute an ATP-hydrolysis-driven ~45° Power Stroke that pulls the two Z-discs closer together (shortening the I-band and H-zone while the A-band stays constant), and bind a fresh ATP molecule to detach and reset.',
      realLifeExample: 'Every heartbeat, sprint, and heavy lift, as well as rigor mortis (muscle stiffening when ATP depletion prevents myosin head detachment).',
      examConnection:
        'During sarcomere contraction: Z-discs move closer together, I-band (actin only) and H-zone (myosin only) SHORTEN, while the A-band (full length of thick myosin filaments) remains CONSTANT in length.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 2.0, 8.2], target: [0, 0, 0] },
      parts: [
        {
          id: 'left-z-disc-anchor',
          name: 'Left Z-Disc (Z-Line α-Actinin Boundary)',
          label: 'Left Z-Disc Boundary',
          shape: 'box',
          dimensions: [0.28, 2.4, 1.8],
          position: [-2.35, 0, 0],
          color: '#0284c7',
          material: 'metal',
          description: 'Dense protein lattice of α-actinin marking the left lateral boundary of the sarcomere and anchoring the plus (+) ends of thin actin filaments.',
          whatIsIt: 'Left structural anchor wall of the sarcomere.',
          whatDoesItDo: 'Gets pulled inward toward the M-line during isotonic muscle contraction.',
          animation: { type: 'oscillate', axis: 'x', speed: 2.2, amplitude: 0.28 },
        },
        {
          id: 'right-z-disc-anchor',
          name: 'Right Z-Disc (Z-Line α-Actinin Boundary)',
          label: 'Right Z-Disc Boundary',
          shape: 'box',
          dimensions: [0.28, 2.4, 1.8],
          position: [2.35, 0, 0],
          color: '#0284c7',
          material: 'metal',
          description: 'Right lateral sarcomere boundary anchoring the opposing array of thin actin filaments.',
          whatIsIt: 'Right structural anchor wall of the sarcomere.',
          whatDoesItDo: 'Slides inward toward the center as myosin heads pull on actin.',
          animation: { type: 'oscillate', axis: 'x', speed: 2.2, amplitude: 0.28 },
        },
        {
          id: 'thin-actin-filaments-upper',
          name: 'Upper Thin Actin Filaments (F-Actin + Troponin + Tropomyosin)',
          label: 'Thin Actin Filaments (I-Band)',
          shape: 'cylinder',
          dimensions: [0.09, 3.8],
          position: [0, 0.65, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#38bdf8',
          material: 'plastic',
          description: 'Helical F-actin polymers decorated with regulatory tropomyosin strands and Ca²⁺-binding troponin complexes.',
          whatIsIt: 'Thin contractile protein filaments anchored to the Z-discs.',
          whatDoesItDo: 'Provides myosin-binding sites when Ca²⁺ binds Troponin-C, sliding inward over the thick filament.',
          animation: { type: 'oscillate', axis: 'x', speed: 2.2, amplitude: 0.2 },
        },
        {
          id: 'thin-actin-filaments-lower',
          name: 'Lower Thin Actin Filaments (F-Actin + Troponin + Tropomyosin)',
          label: 'Lower Thin Actin Filaments',
          shape: 'cylinder',
          dimensions: [0.09, 3.8],
          position: [0, -0.65, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#38bdf8',
          material: 'plastic',
          description: 'Lower parallel array of thin actin filaments interdigitating with the central thick myosin filament.',
          whatIsIt: 'Lower thin actin filament bundle.',
          whatDoesItDo: 'Transmits sliding cross-bridge force to the Z-discs.',
          animation: { type: 'oscillate', axis: 'x', speed: 2.2, amplitude: 0.2 },
        },
        {
          id: 'thick-myosin-filament-core',
          name: 'Central Thick Myosin II Filament (A-Band Constant Length)',
          label: 'Thick Myosin Filament (A-Band)',
          shape: 'cylinder',
          dimensions: [0.24, 2.8],
          position: [0, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#e11d48',
          material: 'tissue',
          description: 'Bipolar bundle of Myosin II heavy chains spanning the entire A-band with projecting globular ATPase cross-bridge heads.',
          whatIsIt: 'Central thick motor filament of the sarcomere.',
          whatDoesItDo: 'Hydrolyzes ATP (ATP ➔ ADP + Pᵢ) to cock and swing cross-bridge heads in a cyclic power stroke.',
        },
        {
          id: 'myosin-crossbridge-heads',
          name: 'Actin–Myosin Cross-Bridge Power-Stroke Heads',
          label: 'Myosin Cross-Bridge Heads (ATPase)',
          shape: 'torus',
          dimensions: [0.48, 0.12],
          position: [-0.85, 0, 0],
          rotation: [0, Math.PI / 2, 0],
          color: '#facc15',
          material: 'glow',
          description: 'Globular myosin S1 heads that bind actin, release Pᵢ and ADP to execute the power stroke, and bind fresh ATP to detach.',
          whatIsIt: 'Molecular oar-like motor heads on the thick filament.',
          whatDoesItDo: 'Walks toward the Z-disc (+) end of actin to shorten the sarcomere.',
          animation: { type: 'pulse', axis: 'y', speed: 3.0, amplitude: 0.14 },
        },
        {
          id: 'central-m-line-bridge',
          name: 'Central M-Line & Titin Elastic Anchor',
          label: 'Central M-Line (Myomesin)',
          shape: 'cylinder',
          dimensions: [0.35, 1.6],
          position: [0, 0, 0],
          color: '#f59e0b',
          material: 'metal',
          description: 'Central transverse protein disk (myomesin) at the middle of the H-zone that cross-links thick myosin filaments and elastic titin springs.',
          whatIsIt: 'Centerline alignment bridge of the sarcomere.',
          whatDoesItDo: 'Keeps thick myosin filaments centered in a hexagonal lattice during contraction.',
        },
      ],
      parameters: {
        calciumConcentration: {
          id: 'calciumConcentration',
          name: 'Sarcoplasmic Ca²⁺ & Cross-Bridge Rate',
          min: 0.5,
          max: 5.0,
          step: 0.25,
          defaultValue: 2.2,
          unit: 'μM',
          description: 'Controls the rate of Ca²⁺-activated cross-bridge power-stroke cycling.',
          affects: 'animationSpeed',
          scaleFactor: 1.0,
        },
        overlapZoneFactor: {
          id: 'overlapZoneFactor',
          name: 'Actin–Myosin Filament Overlap (Length–Tension)',
          min: 0.7,
          max: 1.35,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Active isometric tetanic tension peaks at optimal sarcomere length (~2.0–2.2 μm) where cross-bridge overlap is maximal.',
          affects: 'objectScale',
          targetPartId: 'thick-myosin-filament-core',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Highlight Cross-Bridge Heads',
          type: 'boolean',
          defaultValue: true,
          description: 'Highlights active myosin ATPase heads and M-line alignment.',
        },
      },
      equations: [
        'L_sarcomere = L_A-band (constant ~1.6 μm) + L_I-band (shortens during contraction)',
        'Cross-Bridge Cycle: Attach (Actin·Myosin·ADP·Pᵢ) ➔ Power Stroke (−Pᵢ, −ADP) ➔ Rigor ➔ Detach (+ATP) ➔ Cock (ATP ➔ ADP+Pᵢ)',
      ],
      curiosityPrompts: [
        'Why does the A-band stay the exact same width during muscle contraction while the I-band and H-zone get narrower?',
        'Why is a fresh ATP molecule required for the myosin head to DETACH from actin (and why does ATP loss cause rigor mortis)?',
        'How do Calcium ions (Ca²⁺), Troponin, and Tropomyosin work together like a lock and key to switch muscle contraction on?',
      ],
    };
  }

  // 0I. CATHODE RAY TUBE (CRT) & J.J. THOMSON e/m DEFLECTION APPARATUS
  if (
    q.includes('cathode ray') ||
    q.includes('crt') ||
    q.includes('electron gun') ||
    q.includes('thomson')
  ) {
    return {
      id: 'custom-cathode-ray-tube-thomson',
      title: 'Cathode Ray Tube (CRT) & J.J. Thomson e/m Deflection Lab',
      concept: 'Thermionic Emission, Electrostatic & Magnetic Lorentz Force Deflection (F = −e(E + v × B))',
      subjectDomain: 'Physics',
      description:
        'Interactive 3D atomic physics apparatus modeling J.J. Thomson’s 1897 cathode ray tube: an evacuated glass envelope, thermionic electron gun cathode, accelerating & focusing anodes, parallel horizontal electric deflection plates (E), external Helmholtz magnetic coils (B), collimated electron beam, and zinc sulfide phosphor screen.',
      whatIsIt:
        'A high-vacuum electron-beam tube used by J.J. Thomson in 1897 to discover the electron and measure its charge-to-mass ratio (e/m = 1.759 × 10¹¹ C/kg).',
      howDoesItWork:
        'A heated filament boils off electrons (thermionic emission), which are accelerated through voltage V_a (½mv² = eV_a) into a fast pencil beam. Passing between charged capacitor plates deflects the beam parabolically via electric force F_E = −eE, while perpendicular Helmholtz coils exert magnetic Lorentz force F_B = −e(v × B). Balancing eE = evB yields the exact electron speed v = E/B.',
      realLifeExample: 'Analog oscilloscope tubes, X-ray tubes, electron microscopes (SEM/TEM), and particle accelerator injectors.',
      examConnection:
        'Velocity selector balance condition: When electric force equals magnetic force (eE = evB), the electron beam passes straight through undeflected with velocity v = E / B, giving e/m = E² / (2 · V_a · B²).',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 2.2, 8.4], target: [0, 0, 0] },
      parts: [
        {
          id: 'evacuated-glass-crt-envelope',
          name: 'High-Vacuum Borosilicate Glass CRT Envelope',
          label: 'Vacuum Glass Envelope',
          shape: 'cylinder',
          dimensions: [1.15, 5.2],
          position: [0, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#38bdf8',
          material: 'glass',
          opacity: 0.32,
          description: 'Evacuated glass tube (P < 10⁻⁶ Torr) preventing electrons from colliding with air molecules.',
          whatIsIt: 'High-vacuum glass chamber.',
          whatDoesItDo: 'Provides a collision-free mean free path for the cathode-ray electron beam.',
        },
        {
          id: 'thermionic-electron-gun',
          name: 'Thermionic Cathode Filament & Accelerating Anode (V_a)',
          label: 'Electron Gun (Cathode + Anode V_a)',
          shape: 'cylinder',
          dimensions: [0.48, 1.1],
          position: [-2.05, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#f59e0b',
          material: 'metal',
          description: 'Heated tungsten cathode emitting electrons accelerated through potential difference V_a into a collimated beam.',
          whatIsIt: 'Electron source and electrostatic accelerator.',
          whatDoesItDo: 'Accelerates electrons to speed v = √(2eV_a / m_e).',
        },
        {
          id: 'electric-deflection-plate-upper',
          name: 'Upper Electrostatic Deflection Plate (+V_p)',
          label: 'Upper E-Field Plate (+)',
          shape: 'box',
          dimensions: [1.35, 0.1, 0.85],
          position: [-0.25, 0.52, 0],
          color: '#ef4444',
          material: 'copper',
          description: 'Positively charged parallel capacitor plate creating a vertical electric field E = V_p / d.',
          whatIsIt: 'Upper electrostatic deflection electrode.',
          whatDoesItDo: 'Attracts negatively charged electrons upward with force F_E = eE.',
        },
        {
          id: 'electric-deflection-plate-lower',
          name: 'Lower Electrostatic Deflection Plate (−V_p)',
          label: 'Lower E-Field Plate (−)',
          shape: 'box',
          dimensions: [1.35, 0.1, 0.85],
          position: [-0.25, -0.52, 0],
          color: '#0284c7',
          material: 'copper',
          description: 'Negatively charged lower parallel plate completing the uniform electric deflection zone.',
          whatIsIt: 'Lower electrostatic deflection electrode.',
          whatDoesItDo: 'Repels negatively charged cathode rays upward.',
        },
        {
          id: 'helmholtz-magnetic-coil-ring',
          name: 'External Helmholtz Magnetic Deflection Coils (B-Field)',
          label: 'Helmholtz Coils (Transverse B-Field)',
          shape: 'torus',
          dimensions: [1.32, 0.12],
          position: [-0.25, 0, 0],
          color: '#d97706',
          material: 'copper',
          description: 'Pair of external circular coils producing a uniform transverse magnetic field B perpendicular to both v and E.',
          whatIsIt: 'Magnetic Lorentz force coil pair.',
          whatDoesItDo: 'Applies magnetic force F_B = evB to curve or cancel the electrostatic deflection.',
        },
        {
          id: 'cathode-ray-electron-beam',
          name: 'Collimated Cathode-Ray Electron Beam (e⁻)',
          label: 'Cathode-Ray Electron Beam (e⁻)',
          shape: 'cylinder',
          dimensions: [0.09, 4.4],
          position: [0.15, 0.08, 0],
          rotation: [0, 0, Math.PI / 2 - 0.05],
          color: '#22c55e',
          material: 'glow',
          description: 'High-velocity stream of negatively charged electrons deflected by the net Lorentz force F = −e(E + v × B).',
          whatIsIt: 'Stream of fast electrons (cathode rays).',
          whatDoesItDo: 'Deflects proportionally to the charge-to-mass ratio e/m and strikes the fluorescent screen.',
          animation: { type: 'oscillate', axis: 'y', speed: 2.4, amplitude: 0.18 },
        },
        {
          id: 'phosphor-fluorescent-screen',
          name: 'Zinc Sulfide (ZnS) Fluorescent Detection Screen',
          label: 'Fluorescent Phosphor Screen',
          shape: 'cylinder',
          dimensions: [1.12, 0.18],
          position: [2.52, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#4ade80',
          material: 'glow',
          description: 'Phosphor-coated end window that emits visible green scintillation light where the electron beam impacts.',
          whatIsIt: 'Glowing position-sensitive detector screen.',
          whatDoesItDo: 'Converts invisible electron kinetic energy into a measurable luminous spot deflection Δy.',
        },
      ],
      parameters: {
        acceleratingVoltageKv: {
          id: 'acceleratingVoltageKv',
          name: 'Anode Accelerating Voltage (V_a)',
          min: 1.0,
          max: 10.0,
          step: 0.5,
          defaultValue: 4.0,
          unit: 'kV',
          description: 'Controls electron beam kinetic energy eV_a = ½mv².',
          affects: 'animationSpeed',
          scaleFactor: 0.45,
        },
        plateDeflectionField: {
          id: 'plateDeflectionField',
          name: 'Deflection Plate Voltage Tilt',
          min: -20,
          max: 20,
          step: 2,
          defaultValue: 6,
          unit: '°',
          description: 'Adjusts the vertical electrostatic deflection angle of the electron beam.',
          affects: 'objectRotation',
          targetPartId: 'cathode-ray-electron-beam',
          scaleFactor: 0.015,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Transparent Vacuum Tube',
          type: 'boolean',
          defaultValue: true,
          description: 'Keeps the outer glass CRT envelope translucent to inspect the plates and electron beam.',
        },
      },
      equations: [
        '½ m_e v² = e · V_a ➔ v = √(2 · e · V_a / m_e) (Electron Gun Acceleration)',
        'e · E = e · v · B ➔ v = E / B , e / m_e = E² / (2 · V_a · B²) = 1.759 × 10¹¹ C/kg',
      ],
      curiosityPrompts: [
        'How did J.J. Thomson know that cathode rays were negatively charged particles and not electromagnetic waves like light?',
        'Why was Thomson’s measured value of e/m the exact same regardless of which metal he used for the cathode?',
        'How do you adjust the E-field and B-field so the electron beam travels in a completely straight line (velocity selector)?',
      ],
    };
  }

  // 0J. CYCLOTRON & MASS SPECTROMETER
  if (
    q.includes('cyclotron') ||
    q.includes('mass spectrometer') ||
    q.includes('velocity selector') ||
    q.includes('synchrotron')
  ) {
    return {
      id: 'custom-cyclotron-accelerator',
      title: 'Cyclotron Particle Accelerator & Magnetic Resonance Explorer',
      concept: 'Cyclotron Frequency (f = qB/2πm), Alternating RF Electric Gap & Spiral Lorentz Orbit',
      subjectDomain: 'Physics',
      description:
        'Interactive 3D nuclear physics model of Ernest Lawrence’s cyclotron accelerator featuring two hollow copper D-shaped vacuum electrodes (Dee 1 and Dee 2), upper and lower electromagnet poles generating a vertical magnetic field B, a central ion source, an alternating radio-frequency (RF) accelerating gap, and an outward-spiraling proton/ion beam.',
      whatIsIt:
        'A compact circular particle accelerator that uses a constant magnetic field and a high-frequency alternating voltage across two D-shaped electrodes ("Dees") to accelerate charged ions along an outward spiral.',
      howDoesItWork:
        'A perpendicular magnetic field B bends ions of charge q and mass m into circular arcs of radius r = mv / (qB). Because the orbital cyclotron frequency f_c = qB / (2πm) is independent of speed v and radius r (in the non-relativistic regime), an AC oscillator tuned to f_c reverses polarity across the gap between Dee 1 and Dee 2 every half-turn, kicking the ion to higher energy and a wider radius on every crossing.',
      realLifeExample: 'Hospital medical cyclotrons producing fluorine-18 (¹⁸F-FDG) radiotracers for PET cancer scans and proton-beam therapy.',
      examConnection:
        'Cyclotron Resonance Condition: T = 2πm / (qB) and f_c = qB / (2πm) are independent of particle speed v and orbital radius r! Maximum kinetic energy at extraction radius R: K_max = q² · B² · R² / (2m).',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 4.2, 7.6], target: [0, 0, 0] },
      parts: [
        {
          id: 'lower-electromagnet-pole',
          name: 'Lower Ferromagnetic Pole Piece (North Pole — Upward B-Field)',
          label: 'Lower Magnet Pole (North)',
          shape: 'cylinder',
          dimensions: [2.5, 0.45],
          position: [0, -1.15, 0],
          color: '#dc2626',
          material: 'metal',
          description: 'Massive lower electromagnet pole face generating a uniform vertical magnetic field B across the vacuum chamber.',
          whatIsIt: 'Bottom magnetic pole piece.',
          whatDoesItDo: 'Provides the uniform vertical B-field that bends moving ions into circular paths.',
        },
        {
          id: 'upper-electromagnet-pole',
          name: 'Upper Ferromagnetic Pole Piece (South Pole — Cutaway)',
          label: 'Upper Magnet Pole (South)',
          shape: 'cylinder',
          dimensions: [2.5, 0.35],
          position: [0, 1.25, 0],
          color: '#2563eb',
          material: 'glass',
          opacity: 0.28,
          description: 'Upper electromagnet pole rendered semi-transparent so the internal copper Dees and spiral beam are visible.',
          whatIsIt: 'Top magnetic pole piece.',
          whatDoesItDo: 'Completes the uniform magnetic gap field between North and South poles.',
        },
        {
          id: 'copper-dee-electrode-left',
          name: 'Left Hollow Copper Electrode (Dee 1 — RF Terminal A)',
          label: 'Copper Dee 1 (Hollow Faraday Cage)',
          shape: 'cylinder',
          dimensions: [1.65, 0.38],
          position: [-0.55, 0, 0],
          color: '#d97706',
          material: 'copper',
          description: 'Left hollow D-shaped copper electrode shielded from electric fields inside its conductive interior.',
          whatIsIt: 'First hollow semicircular copper accelerating electrode.',
          whatDoesItDo: 'Allows ions inside to coast at constant speed in a semicircle under the magnetic force alone.',
        },
        {
          id: 'copper-dee-electrode-right',
          name: 'Right Hollow Copper Electrode (Dee 2 — RF Terminal B)',
          label: 'Copper Dee 2 (RF Alternating)',
          shape: 'cylinder',
          dimensions: [1.65, 0.38],
          position: [0.55, 0, 0],
          color: '#b45309',
          material: 'copper',
          description: 'Right hollow copper electrode separated from Dee 1 by the central RF accelerating gap.',
          whatIsIt: 'Second hollow semicircular copper electrode.',
          whatDoesItDo: 'Alternates potential (±V₀ cos(2πf_c t)) so ions are accelerated every time they cross the gap.',
        },
        {
          id: 'central-ion-source-injector',
          name: 'Central Proton / Ion Source Injector (q, m)',
          label: 'Central Ion Source (p⁺)',
          shape: 'sphere',
          dimensions: [0.28],
          position: [0, 0.28, 0],
          color: '#facc15',
          material: 'glow',
          description: 'Penning ion gauge source at the center of the gap injecting low-energy protons (H⁺) into the cyclotron.',
          whatIsIt: 'Central charged-particle emitter.',
          whatDoesItDo: 'Supplies ions at r ≈ 0 to begin the outward spiral acceleration.',
          animation: { type: 'pulse', axis: 'y', speed: 3.0, amplitude: 0.14 },
        },
        {
          id: 'spiral-ion-beam-trajectory',
          name: 'Outward-Spiraling Accelerated Ion Beam (r = mv/qB)',
          label: 'Spiral Ion Beam (r ∝ v)',
          shape: 'torus',
          dimensions: [1.35, 0.08],
          position: [0, 0.28, 0],
          rotation: [Math.PI / 2, 0, 0],
          color: '#38bdf8',
          material: 'glow',
          description: 'High-energy ion trajectory growing in radius r = mv/(qB) after each accelerating kick across the RF gap.',
          whatIsIt: 'Spiraling high-velocity proton beam.',
          whatDoesItDo: 'Gains kinetic energy ΔK = qV₀ twice per revolution until reaching the outer extraction radius R.',
          animation: { type: 'spin', axis: 'y', speed: 4.2, amplitude: 0.1 },
        },
      ],
      parameters: {
        magneticFieldTesla: {
          id: 'magneticFieldTesla',
          name: 'Magnetic Flux Density (B)',
          min: 0.5,
          max: 3.0,
          step: 0.1,
          defaultValue: 1.5,
          unit: 'T',
          description: 'Cyclotron resonance frequency f_c = qB/(2πm) is directly proportional to B.',
          affects: 'animationSpeed',
          scaleFactor: 1.2,
        },
        extractionRadiusScale: {
          id: 'extractionRadiusScale',
          name: 'Maximum Orbit Radius (R)',
          min: 0.65,
          max: 1.35,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Final extracted kinetic energy scales with the square of the Dee radius (K_max ∝ R²).',
          affects: 'objectScale',
          targetPartId: 'spiral-ion-beam-trajectory',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Cutaway Upper Magnet Pole',
          type: 'boolean',
          defaultValue: true,
          description: 'Makes the upper South magnet pole translucent to view the Dees and ion beam.',
        },
      },
      equations: [
        'q · v · B = m · v² / r ➔ r = (m · v) / (q · B) , f_c = (q · B) / (2π · m)',
        'K_max = ½ m v_max² = (q² · B² · R²) / (2 · m) (Maximum Extracted Cyclotron Energy)',
      ],
      curiosityPrompts: [
        'Why does an ion in a cyclotron take the exact same time to complete a large outer circle as a tiny inner circle?',
        'Why are the charged particles accelerated only in the narrow gap between the Dees and not while inside the hollow copper Dees?',
        'Why does a standard fixed-frequency cyclotron fail when particles reach relativistic speeds near the speed of light (γm)?',
      ],
    };
  }

  // 0K. FLUID MOSAIC CELL MEMBRANE / PHOSPHOLIPID BILAYER
  if (
    q.includes('cell membrane') ||
    q.includes('plasma membrane') ||
    q.includes('phospholipid bilayer') ||
    q.includes('fluid mosaic') ||
    q.includes('sodium potassium pump') ||
    (q.includes('ion channel') && !q.includes('synapse'))
  ) {
    return {
      id: 'custom-fluid-mosaic-membrane',
      title: 'Fluid Mosaic Phospholipid Bilayer & Transmembrane Transport',
      concept: 'Amphipathic Phospholipids, Selective Permeability, Integral Channel Proteins & Cholesterol Fluidity',
      subjectDomain: 'Biology',
      description:
        'Interactive 3D cell biology model of the Singer–Nicolson Fluid Mosaic plasma membrane showing the outer and inner hydrophilic phosphate head layers, the hydrophobic fatty-acid tail interior core, an integral transmembrane voltage/gated channel protein, stabilizing cholesterol rings, and an extracellular glycoprotein glycocalyx receptor.',
      whatIsIt:
        'The selectively permeable ~7–8 nm amphipathic phospholipid bilayer that forms the dynamic outer boundary of all living cells.',
      howDoesItWork:
        'Amphipathic phospholipids spontaneously self-assemble in water so their polar hydrophilic phosphate heads face the aqueous extracellular and cytoplasmic fluids while their nonpolar hydrophobic fatty-acid tails hide inside the core. Small nonpolar molecules (O₂, CO₂) cross by simple diffusion, whereas polar ions (Na⁺, K⁺, Ca²⁺) and glucose require integral transmembrane channel or carrier proteins.',
      realLifeExample: 'Aquaporins filtering water in kidney tubules, insulin receptors on muscle cells, and lipid nanoparticles delivering mRNA vaccines across cell membranes.',
      examConnection:
        'Singer–Nicolson Fluid Mosaic Model (1972): "Fluid" because phospholipids and proteins diffuse laterally within the bilayer (regulated by unsaturated kinked tails and cholesterol); "Mosaic" because diverse integral and peripheral proteins are embedded like tiles.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 2.4, 8.0], target: [0, 0, 0] },
      parts: [
        {
          id: 'outer-hydrophilic-phosphate-heads',
          name: 'Extracellular Hydrophilic Phosphate Head Layer (Polar)',
          label: 'Hydrophilic Phosphate Heads (Outer)',
          shape: 'box',
          dimensions: [4.8, 0.35, 3.2],
          position: [0, 1.05, 0],
          color: '#38bdf8',
          material: 'plastic',
          description: 'Negatively charged polar choline-phosphate head groups forming hydrogen bonds with extracellular water.',
          whatIsIt: 'Water-loving outer surface of the lipid bilayer.',
          whatDoesItDo: 'Interfaces stably with the aqueous extracellular environment.',
        },
        {
          id: 'hydrophobic-fatty-acid-tail-core',
          name: 'Hydrophobic Fatty-Acid Hydrocarbon Tail Core (Nonpolar Barrier)',
          label: 'Hydrophobic Lipid Tails (Nonpolar Core)',
          shape: 'box',
          dimensions: [4.6, 1.65, 3.0],
          position: [0, 0, 0],
          color: '#facc15',
          material: 'glass',
          opacity: 0.45,
          description: 'Nonpolar saturated and cis-unsaturated hydrocarbon acyl chains that block hydrated ions and large polar molecules.',
          whatIsIt: 'Water-fearing interior core of the membrane.',
          whatDoesItDo: 'Acts as the selective permeability barrier preventing uncontrolled ion leakage.',
        },
        {
          id: 'inner-hydrophilic-phosphate-heads',
          name: 'Cytoplasmic Hydrophilic Phosphate Head Layer (Cytosolic Leaf)',
          label: 'Hydrophilic Phosphate Heads (Inner)',
          shape: 'box',
          dimensions: [4.8, 0.35, 3.2],
          position: [0, -1.05, 0],
          color: '#0284c7',
          material: 'plastic',
          description: 'Inner leaflet of polar phospholipid heads facing the intracellular cytosol.',
          whatIsIt: 'Water-loving cytoplasmic surface of the bilayer.',
          whatDoesItDo: 'Anchors peripheral cytoskeleton proteins (spectrin/actin) on the cytosolic face.',
        },
        {
          id: 'integral-transmembrane-channel',
          name: 'Integral Transmembrane Ion Channel / Carrier Protein',
          label: 'Integral Channel Protein (Facilitated Diffusion)',
          shape: 'cylinder',
          dimensions: [0.68, 2.75],
          position: [-0.65, 0, 0.25],
          color: '#a855f7',
          material: 'tissue',
          description: 'Amphipathic α-helical transmembrane protein spanning both leaflets to provide a hydrophilic pore for specific ions or polar solutes.',
          whatIsIt: 'Protein tunnel spanning the entire membrane thickness.',
          whatDoesItDo: 'Mediates facilitated diffusion or active transport (ATP pump) of ions across the hydrophobic core.',
          animation: { type: 'pulse', axis: 'x', speed: 2.2, amplitude: 0.1 },
        },
        {
          id: 'cholesterol-fluidity-buffer',
          name: 'Membrane Cholesterol Steroid Rings (Fluidity Buffer)',
          label: 'Cholesterol (Fluidity Buffer)',
          shape: 'capsule',
          dimensions: [0.22, 0.75],
          position: [1.15, 0.35, 0.35],
          color: '#f97316',
          material: 'plastic',
          description: 'Planar four-ring steroid lipid wedged between phospholipid tails that prevents crystal freezing at low T and restricts excess fluidity at high T.',
          whatIsIt: 'Bidirectional membrane fluidity stabilizer.',
          whatDoesItDo: 'Maintains optimal membrane viscosity across temperature changes.',
        },
        {
          id: 'extracellular-glycoprotein-receptor',
          name: 'Extracellular Glycoprotein & Oligosaccharide Chain (Glycocalyx)',
          label: 'Glycoprotein Receptor (Cell Recognition)',
          shape: 'cylinder',
          dimensions: [0.16, 1.35],
          position: [0.85, 1.75, 0],
          rotation: [0, 0, -0.25],
          color: '#10b981',
          material: 'glow',
          description: 'Branched carbohydrate antenna covalently attached to membrane proteins on the extracellular face only.',
          whatIsIt: 'Cell-surface identity tag and hormone receptor.',
          whatDoesItDo: 'Enables immune self/non-self recognition (MHC/ABO blood groups) and hormone signal transduction.',
          animation: { type: 'oscillate', axis: 'z', speed: 2.0, amplitude: 0.15 },
        },
      ],
      parameters: {
        membraneTemperatureC: {
          id: 'membraneTemperatureC',
          name: 'Thermal Lateral Diffusion & Fluidity (T)',
          min: 10,
          max: 45,
          step: 1,
          defaultValue: 37,
          unit: '°C',
          description: 'Higher temperature and cis-unsaturated double bonds increase lateral phospholipid diffusion rate.',
          affects: 'animationSpeed',
          scaleFactor: 0.05,
        },
        channelConductanceScale: {
          id: 'channelConductanceScale',
          name: 'Channel Pore Aperture Scale',
          min: 0.75,
          max: 1.45,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Scales the integral transmembrane channel protein pore.',
          affects: 'objectScale',
          targetPartId: 'integral-transmembrane-channel',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Translucent Hydrophobic Tail Core',
          type: 'boolean',
          defaultValue: true,
          description: 'Makes the fatty-acid core translucent to inspect embedded cholesterol and transmembrane domains.',
        },
      },
      equations: [
        'J = −P · A · (C_out − C_in) (Fick’s First Law of Membrane Permeability, P = K·D / Δx)',
        'V_eq = (R·T / z·F) · ln([Ion]_out / [Ion]_in) (Nernst Equilibrium Membrane Potential)',
      ],
      curiosityPrompts: [
        'Why can oxygen (O₂) and carbon dioxide (CO₂) cross the lipid bilayer easily while smaller sodium ions (Na⁺) cannot?',
        'How does cholesterol keep the cell membrane from becoming too rigid in the cold AND too leaky in the heat?',
        'Why are carbohydrate chains (glycoproteins and glycolipids) found exclusively on the exterior surface of the plasma membrane?',
      ],
    };
  }

  // 1. BACTERIOPHAGE / VIRUS 3D MODEL
  if (q.includes('bacteriophage') || q.includes('phage') || q.includes('virus') || q.includes('capsid')) {
    return {
      id: 'custom-bacteriophage-virus',
      title: 'Bacteriophage T4 Virus Architecture',
      concept: 'Virology, Icosahedral Capsid Geometry & Contractile Tail Injection',
      description:
        'Interactive 3D structural model of a T4 bacteriophage virus showing the icosahedral protein capsid head encapsulating double-stranded DNA, collar, contractile helical tail sheath, hexagonal baseplate, and host-recognition tail fibers.',
      whatIsIt: 'A specialized virus that infects bacteria by landing on their surface and injecting genetic material like a microscopic hypodermic syringe.',
      howDoesItWork:
        'Long tail fibers bind to specific lipopolysaccharide receptors on the host bacterium. The hexagonal baseplate changes conformation, causing the contractile tail sheath to compress and drive the hollow central tail tube through the bacterial cell wall to inject viral DNA.',
      realLifeExample: 'Phage therapy used in medicine to target antibiotic-resistant bacterial infections.',
      examConnection: 'Hershey-Chase Experiment (1952): Bacteriophage T2 labeled with ³²P (DNA) and ³⁵S (protein coat) proved that DNA, not protein, is the hereditary genetic material.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 2.5, 8.5], target: [0, 0.2, 0] },
      parts: [
        {
          id: 'icosahedral-capsid-head',
          name: 'Icosahedral Protein Capsid Head',
          label: 'Icosahedral Capsid Head',
          shape: 'octahedron',
          dimensions: [1.35],
          position: [0, 2.35, 0],
          color: '#38bdf8',
          material: 'glass',
          opacity: 0.72,
          description: 'Geometrically symmetric protein shell composed of capsomere subunits protecting the viral genome.',
          whatIsIt: 'Outer polyhedral protein shell (head) of the bacteriophage.',
          whatDoesItDo: 'Protects the tightly packaged viral DNA genome from nucleases and environmental damage.',
          realLifeExample: 'Geodesic domes designed by Buckminster Fuller follow the same icosahedral triangulation geometry.',
          animation: { type: 'spin', axis: 'y', speed: 0.8, amplitude: 0.1 },
        },
        {
          id: 'viral-dna-genome-core',
          name: 'Double-Stranded Viral DNA Core',
          label: 'Viral dsDNA Genome',
          shape: 'torus',
          dimensions: [0.55, 0.22],
          position: [0, 2.35, 0],
          rotation: [1.1, 0.4, 0],
          color: '#f43f5e',
          material: 'glow',
          description: 'Tightly spooled linear double-stranded DNA molecule stored at high osmotic pressure inside the capsid.',
          whatIsIt: 'The genetic blueprint of the virus (~169 kilobase pairs in T4).',
          whatDoesItDo: 'Injected into the host bacterium to hijack host ribosomes and synthesize new phage particles.',
          realLifeExample: 'Coiled spring under tension ready to unwind into the host cell.',
          animation: { type: 'pulse', axis: 'y', speed: 2.2, amplitude: 0.12 },
        },
        {
          id: 'neck-collar-disk',
          name: 'Connector Collar & Whisker Ring',
          label: 'Collar / Neck Connector',
          shape: 'cylinder',
          dimensions: [0.45, 0.22],
          position: [0, 1.15, 0],
          color: '#94a3b8',
          material: 'metal',
          description: 'Structural adapter ring linking the capsid head portal vertex to the contractile tail assembly.',
          whatIsIt: 'Protein neck ring and fibritin whiskers.',
          whatDoesItDo: 'Gates DNA exit from the head into the hollow tail core during infection.',
        },
        {
          id: 'contractile-tail-sheath',
          name: 'Contractile Helical Tail Sheath',
          label: 'Contractile Tail Sheath',
          shape: 'cylinder',
          dimensions: [0.38, 2.1],
          position: [0, 0.0, 0],
          color: '#0284c7',
          material: 'standard',
          description: 'Outer contractile protein sheath surrounding the rigid inner injection tube.',
          whatIsIt: 'Muscular-like helical protein cylinder.',
          whatDoesItDo: 'Contracts to less than half its length upon receptor binding, driving the inner needle through the bacterial envelope.',
          animation: { type: 'oscillate', axis: 'y', speed: 1.8, amplitude: 0.25 },
        },
        {
          id: 'inner-hollow-tail-tube',
          name: 'Inner Hollow Injection Core Tube',
          label: 'Hollow Injection Needle',
          shape: 'cylinder',
          dimensions: [0.16, 2.5],
          position: [0, -0.1, 0],
          color: '#e2e8f0',
          material: 'metal',
          description: 'Rigid internal conduit through which viral DNA travels into the host cytoplasm.',
          whatIsIt: 'Nanoscale molecular syringe needle.',
          whatDoesItDo: 'Punctures the bacterial peptidoglycan wall and cytoplasmic membrane.',
        },
        {
          id: 'hexagonal-baseplate',
          name: 'Hexagonal Sensor Baseplate',
          label: 'Hexagonal Baseplate',
          shape: 'cylinder',
          dimensions: [0.68, 0.24],
          position: [0, -1.15, 0],
          color: '#f59e0b',
          material: 'metal',
          description: 'Multiprotein hub at the bottom of the tail that coordinates fiber attachment with sheath contraction.',
          whatIsIt: 'Mechanical trigger plate at the base of the tail.',
          whatDoesItDo: 'Converts mechanical tension from the tail fibers into a conformational signal that releases the sheath.',
        },
        {
          id: 'tail-fiber-front-left',
          name: 'Long Host-Recognition Tail Fibers',
          label: 'Long Tail Fibers (gp37)',
          shape: 'cylinder',
          dimensions: [0.06, 1.85],
          position: [-0.95, -1.65, 0.65],
          rotation: [0.35, 0, -0.75],
          color: '#10b981',
          material: 'plastic',
          description: 'Six articulated protein legs that walk across the bacterial surface and bind specific outer-membrane receptors.',
          whatIsIt: 'Receptor-binding sensor fibers.',
          whatDoesItDo: 'Recognizes and anchors the phage onto susceptible E. coli host cells.',
        },
        {
          id: 'tail-fiber-front-right',
          name: 'Right Receptor Tail Fiber',
          label: 'Receptor Tail Fiber',
          shape: 'cylinder',
          dimensions: [0.06, 1.85],
          position: [0.95, -1.65, 0.65],
          rotation: [0.35, 0, 0.75],
          color: '#10b981',
          material: 'plastic',
          description: 'Articulated protein tail fiber for host surface recognition.',
          whatIsIt: 'Receptor-binding sensor fiber.',
          whatDoesItDo: 'Stabilizes phage landing posture prior to genome injection.',
        },
        {
          id: 'tail-fiber-back',
          name: 'Posterior Stabilizer Tail Fibers',
          label: 'Posterior Tail Fibers',
          shape: 'cylinder',
          dimensions: [0.06, 1.85],
          position: [0, -1.65, -1.05],
          rotation: [-0.75, 0, 0],
          color: '#10b981',
          material: 'plastic',
          description: 'Posterior receptor-binding tail fiber completing the tripod landing array.',
          whatIsIt: 'Distal host-attachment fiber.',
          whatDoesItDo: 'Binds bacterial surface lipopolysaccharides (LPS).',
        },
        {
          id: 'bacterial-host-membrane',
          name: 'Host Bacterial Outer Membrane Surface',
          label: 'Host Bacterial Wall',
          shape: 'box',
          dimensions: [5.2, 0.35, 4.2],
          position: [0, -2.5, 0],
          color: '#065f46',
          material: 'tissue',
          description: 'Gram-negative bacterial outer membrane and peptidoglycan layer targeted by the bacteriophage.',
          whatIsIt: 'Target host cell surface envelope.',
          whatDoesItDo: 'Contains surface receptor proteins recognized by the phage tail fibers.',
        },
      ],
      parameters: {
        injectionCycleSpeed: {
          id: 'injectionCycleSpeed',
          name: 'Infection & Contraction Rate',
          min: 0.2,
          max: 4.0,
          step: 0.2,
          defaultValue: 1.5,
          unit: 'Hz',
          description: 'Controls the dynamic rate of capsid rotation and tail sheath contraction cycle.',
          affects: 'animationSpeed',
          scaleFactor: 1.0,
        },
        sheathCompression: {
          id: 'sheathCompression',
          name: 'Tail Sheath Compression',
          min: 0.5,
          max: 1.4,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Adjusts the vertical extension/compression ratio of the contractile tail sheath.',
          affects: 'objectScale',
          targetPartId: 'contractile-tail-sheath',
          scaleFactor: 1.0,
        },
        capsidPressureScale: {
          id: 'capsidPressureScale',
          name: 'Capsid Genome Packing Volume',
          min: 0.8,
          max: 1.35,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Scales the icosahedral capsid head and internal DNA spool volume.',
          affects: 'objectScale',
          targetPartId: 'icosahedral-capsid-head',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Transparent Capsid Cutaway',
          type: 'boolean',
          defaultValue: true,
          description: 'Reveals the internal double-stranded DNA core inside the protein capsid.',
        },
      },
      equations: [
        'T = h² + h·k + k² (Caspar-Klug Icosahedral Triangulation Number)',
        'P_internal ≈ 40–60 atm (Capsid DNA Packaging Pressure)',
      ],
      curiosityPrompts: [
        'Why do bacteriophages only infect bacteria and never human cells?',
        'How did the Hershey-Chase blender experiment use bacteriophages to prove DNA is the genetic material?',
        'How does the phage inject DNA without using ATP from its own metabolism?',
      ],
    };
  }

  // 2. VOLCANO & MAGMA CHAMBER CROSS-SECTION
  if (q.includes('volcano') || q.includes('magma') || q.includes('lava') || q.includes('eruption') || q.includes('caldera')) {
    return {
      id: 'custom-stratovolcano-explorer',
      title: 'Stratovolcano & Magma Chamber Cross-Section',
      concept: 'Igneous Volcanology, Magma Viscosity, Tectonic Decompression & Eruption Mechanics',
      description:
        'Interactive 3D geological cross-section of a composite stratovolcano showing the deep crustal magma chamber, central magmatic conduit, alternating tephra and lava strata, parasitic lateral cone, intrusive dike/sill, summit crater, and buoyant ash plume.',
      whatIsIt: 'A conical composite volcano built up by many alternating layers (strata) of hardened lava, volcanic ash, and pumice.',
      howDoesItWork:
        'Hot, buoyant magma rises from the asthenosphere into a crustal magma chamber. As pressure drops during ascent up the central conduit, dissolved gases (H₂O, CO₂, SO₂) exsolve and expand rapidly, driving effusive lava flows or explosive pyroclastic eruptions depending on silica (SiO₂) viscosity.',
      realLifeExample: 'Mount Fuji (Japan), Mount St. Helens (USA), and Mount Vesuvius (Italy).',
      examConnection: 'High-silicafelsic/rhyolitic magma has high viscosity and traps dissolved gases, causing explosive eruptions; low-silica mafic/basaltic magma has low viscosity, producing gentle effusive shield eruptions.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 3.5, 9.5], target: [0, 0.2, 0] },
      parts: [
        {
          id: 'crustal-lithosphere-base',
          name: 'Continental Crustal Bedrock Slab',
          label: 'Continental Crust Bedrock',
          shape: 'box',
          dimensions: [6.5, 1.4, 5.0],
          position: [0, -2.1, 0],
          color: '#475569',
          material: 'standard',
          description: 'Fractured upper continental lithosphere hosting the sub-volcanic plumbing system.',
          whatIsIt: 'Solid tectonic rock foundation beneath the volcano.',
          whatDoesItDo: 'Provides the structural overburden and fracture pathways through which magma ascends.',
        },
        {
          id: 'deep-magma-chamber',
          name: 'Sub-Crustal Magma Reservoir',
          label: 'Magma Chamber (Reservoir)',
          shape: 'sphere',
          dimensions: [1.35],
          position: [0, -2.1, 0.3],
          color: '#ea580c',
          material: 'glow',
          description: 'Pressurized molten rock reservoir (700–1200 °C) containing silicate melt, suspended crystals, and dissolved volatiles.',
          whatIsIt: 'Large underground pool of molten rock (magma).',
          whatDoesItDo: 'Accumulates buoyant melt and builds magmatic overpressure prior to eruption.',
          animation: { type: 'pulse', axis: 'y', speed: 2.0, amplitude: 0.1 },
        },
        {
          id: 'stratovolcano-cone-mantle',
          name: 'Composite Volcanic Cone (Alternating Strata)',
          label: 'Composite Cone Strata',
          shape: 'cone',
          dimensions: [2.85, 3.4],
          position: [0, 0.3, 0],
          color: '#78716c',
          material: 'standard',
          opacity: 0.78,
          description: 'Steep-sided volcanic edifice built from alternating layers of viscous andesitic lava and pyroclastic tephra.',
          whatIsIt: 'Layered mountain cone of solidified lava and ash.',
          whatDoesItDo: 'Encloses the central vent and records the geological history of successive eruptions.',
        },
        {
          id: 'central-magmatic-conduit',
          name: 'Central Magmatic Conduit Pipe',
          label: 'Central Conduit / Vent Pipe',
          shape: 'cylinder',
          dimensions: [0.34, 3.8],
          position: [0, 0.0, 0.25],
          color: '#f97316',
          material: 'glow',
          description: 'Vertical pipe connecting the deep magma chamber to the summit crater vent.',
          whatIsIt: 'Primary vertical eruption channel.',
          whatDoesItDo: 'Transports decompressing, gas-rich magma upward toward the surface crater.',
          animation: { type: 'pulse', axis: 'y', speed: 3.0, amplitude: 0.08 },
        },
        {
          id: 'lateral-magma-dike',
          name: 'Intrusive Magmatic Dike & Parasitic Vent',
          label: 'Lateral Dike & Flank Vent',
          shape: 'cylinder',
          dimensions: [0.14, 2.2],
          position: [1.15, -0.35, 0.25],
          rotation: [0, 0, -0.65],
          color: '#ef4444',
          material: 'glow',
          description: 'Sheet-like magmatic intrusion cutting across rock layers to feed a secondary flank vent.',
          whatIsIt: 'Branching magma channel feeding a side cone.',
          whatDoesItDo: 'Relieves conduit pressure by diverting magma to a lateral fissure or parasitic cone.',
        },
        {
          id: 'summit-lava-fountain',
          name: 'Summit Crater & Erupting Lava Fountain',
          label: 'Summit Crater & Lava Flow',
          shape: 'sphere',
          dimensions: [0.52],
          position: [0, 2.05, 0.25],
          color: '#fbbf24',
          material: 'glow',
          description: 'Incandescent degassed magma (lava) extruding from the main summit crater.',
          whatIsIt: 'Molten lava emerging at the summit vent.',
          whatDoesItDo: 'Releases trapped volcanic gases and feeds surface lava streams down the volcano slopes.',
          animation: { type: 'pulse', axis: 'y', speed: 3.5, amplitude: 0.18 },
        },
        {
          id: 'pyroclastic-ash-plume',
          name: 'Buoyant Eruption Column & Ash Plume',
          label: 'Tephra & Ash Plume Cloud',
          shape: 'sphere',
          dimensions: [1.15],
          position: [0, 3.25, 0.1],
          color: '#64748b',
          material: 'standard',
          opacity: 0.85,
          description: 'Convective column of pulverized volcanic glass, pumice, and volcanic gases (H₂O, SO₂, CO₂).',
          whatIsIt: 'Billowing cloud of volcanic ash and gas rising above the crater.',
          whatDoesItDo: 'Carries fine tephra high into the troposphere and stratosphere.',
          animation: { type: 'oscillate', axis: 'y', speed: 1.6, amplitude: 0.2 },
        },
      ],
      parameters: {
        magmaPressure: {
          id: 'magmaPressure',
          name: 'Magma Chamber Overpressure',
          min: 10,
          max: 100,
          step: 5,
          defaultValue: 55,
          unit: 'MPa',
          description: 'Controls magmatic ascent speed, conduit pulsation, and eruption intensity.',
          affects: 'animationSpeed',
          scaleFactor: 0.04,
        },
        silicaViscosity: {
          id: 'silicaViscosity',
          name: 'Silica (SiO₂) Plume Expansion',
          min: 0.6,
          max: 1.6,
          step: 0.1,
          defaultValue: 1.0,
          unit: '×',
          description: 'Higher silica content traps volatile gases, expanding the explosive ash plume volume.',
          affects: 'objectScale',
          targetPartId: 'pyroclastic-ash-plume',
          scaleFactor: 1.0,
        },
        chamberVolume: {
          id: 'chamberVolume',
          name: 'Magma Reservoir Volume',
          min: 0.7,
          max: 1.4,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Scales the deep sub-crustal magma reservoir volume.',
          affects: 'objectScale',
          targetPartId: 'deep-magma-chamber',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Cross-Section Cutaway View',
          type: 'boolean',
          defaultValue: true,
          description: 'Toggles semi-transparent cone cutaway to inspect the internal conduit and dike.',
        },
      },
      equations: [
        'ΔP = ρ_crust · g · h − ρ_magma · g · h (Buoyant Magma Ascent Pressure)',
        'η = η₀ · exp(E_a / R·T) (Arrhenius Magma Melt Viscosity)',
      ],
      curiosityPrompts: [
        'Why is magma called lava only after it reaches Earth’s surface?',
        'How does silica (SiO₂) content determine whether a volcano erupts gently like Hawaii or explosively like Mount St. Helens?',
        'What causes a volcanic caldera to collapse after a major eruption?',
      ],
    };
  }

  // 3. WIND TURBINE & AERODYNAMIC GENERATOR
  if (q.includes('wind turbine') || q.includes('windmill') || (q.includes('wind') && q.includes('generator'))) {
    return {
      id: 'custom-wind-turbine-generator',
      title: 'Horizontal-Axis Wind Turbine & Nacelle Drivetrain',
      concept: 'Aerodynamic Lift, Betz’s Law, Gear Ratio & Electromechanical Power Conversion',
      description:
        'Interactive 3D engineering model of a modern horizontal-axis wind turbine (HAWT) featuring the tubular steel tower, yaw nacelle housing, rotor hub, three pitched aerodynamic airfoil blades, low-speed main shaft, planetary step-up gearbox, and doubly-fed induction generator.',
      whatIsIt: 'A renewable energy machine that converts the kinetic energy of moving wind into electrical energy.',
      howDoesItWork:
        'Wind flowing over the curved airfoil blades creates a Bernoulli pressure difference (aerodynamic lift), spinning the rotor hub. Inside the nacelle, a step-up gearbox increases the slow high-torque rotor rotation (~15 RPM) to high-speed generator rotation (~1500 RPM) to induce AC electricity.',
      realLifeExample: 'Offshore and onshore utility wind farms supplying clean electricity to the power grid.',
      examConnection: 'Betz’s Law proves that no wind turbine can capture more than 16/27 (59.3%) of the kinetic energy in wind, because air must retain velocity to exit behind the swept rotor plane.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [3.5, 2.5, 8.5], target: [0, 0.5, 0] },
      parts: [
        {
          id: 'turbine-foundation-pad',
          name: 'Reinforced Concrete Foundation Pad',
          label: 'Concrete Foundation Base',
          shape: 'cylinder',
          dimensions: [1.6, 0.35],
          position: [0, -2.5, 0],
          color: '#64748b',
          material: 'standard',
          description: 'Deep-pile reinforced concrete foundation anchoring the tower against overturning wind bending moments.',
          whatIsIt: 'Heavy structural foundation pad.',
          whatDoesItDo: 'Transfers tower weight and aerodynamic thrust loads safely into the ground.',
        },
        {
          id: 'tubular-steel-tower',
          name: 'Tapered Tubular Steel Tower',
          label: 'Tubular Steel Tower',
          shape: 'cylinder',
          dimensions: [0.35, 3.8],
          position: [0, -0.5, 0],
          color: '#e2e8f0',
          material: 'metal',
          description: 'Tall cylindrical steel mast elevating the rotor into higher-velocity laminar wind shear layers.',
          whatIsIt: 'Vertical support mast housing power cables and service lift.',
          whatDoesItDo: 'Holds the nacelle high above ground turbulence where wind speed is stronger and steadier.',
        },
        {
          id: 'nacelle-housing-shell',
          name: 'Aerodynamic Nacelle Enclosure',
          label: 'Nacelle Powerhouse Housing',
          shape: 'box',
          dimensions: [1.4, 0.9, 2.2],
          position: [0, 1.55, -0.2],
          color: '#cbd5e1',
          material: 'glass',
          opacity: 0.65,
          description: 'Weatherproof fiberglass housing atop the tower containing the shaft, gearbox, brake, and electric generator.',
          whatIsIt: 'The engine room mounted at the top of the wind turbine tower.',
          whatDoesItDo: 'Rotates on the yaw bearing to keep the rotor facing directly into the wind.',
        },
        {
          id: 'planetary-stepup-gearbox',
          name: 'Planetary Step-Up Gearbox',
          label: 'Step-Up Gearbox (1:90)',
          shape: 'cylinder',
          dimensions: [0.32, 0.65],
          position: [0, 1.55, 0.1],
          rotation: [Math.PI / 2, 0, 0],
          color: '#0284c7',
          material: 'metal',
          description: 'Multi-stage planetary transmission converting low-speed, high-torque hub rotation into high-speed generator shaft rotation.',
          whatIsIt: 'Mechanical speed-multiplying transmission.',
          whatDoesItDo: 'Steps up rotational speed from ~15 RPM at the blades to ~1,500 RPM for the generator.',
          animation: { type: 'spin', axis: 'z', speed: 2.5, amplitude: 0.1 },
        },
        {
          id: 'induction-generator-core',
          name: 'Three-Phase AC Induction Generator',
          label: 'AC Induction Generator',
          shape: 'cylinder',
          dimensions: [0.34, 0.65],
          position: [0, 1.55, -0.75],
          rotation: [Math.PI / 2, 0, 0],
          color: '#d97706',
          material: 'copper',
          description: 'Electromagnetic generator using Faraday induction to convert mechanical shaft work into 3-phase AC electrical power.',
          whatIsIt: 'High-speed electrical generator inside the rear nacelle.',
          whatDoesItDo: 'Converts rotational kinetic energy into alternating current electricity.',
          animation: { type: 'spin', axis: 'z', speed: 5.0, amplitude: 0.1 },
        },
        {
          id: 'aerodynamic-rotor-hub',
          name: 'Nose Cone & Pitch-Control Rotor Hub',
          label: 'Rotor Hub & Pitch Actuator',
          shape: 'cone',
          dimensions: [0.46, 0.85],
          position: [0, 1.55, 1.25],
          rotation: [Math.PI / 2, 0, 0],
          color: '#f8fafc',
          material: 'metal',
          description: 'Central cast-iron hub supporting the three composite blades and housing active blade-pitch motors.',
          whatIsIt: 'Spinning nose cone at the center of the blades.',
          whatDoesItDo: 'Transfers aerodynamic torque from the three blades into the main low-speed shaft.',
          animation: { type: 'spin', axis: 'z', speed: 2.2, amplitude: 0.1 },
        },
        {
          id: 'airfoil-blade-1',
          name: 'Composite Airfoil Blade 1 (Vertical)',
          label: 'Airfoil Rotor Blade 1',
          shape: 'box',
          dimensions: [0.22, 2.35, 0.06],
          position: [0, 2.65, 1.05],
          color: '#f1f5f9',
          material: 'plastic',
          description: 'Twisted fiberglass/carbon-fiber airfoil blade engineered to generate high lift-to-drag ratio.',
          whatIsIt: 'Aerodynamic wing-shaped turbine blade.',
          whatDoesItDo: 'Harnesses Bernoulli lift force from incoming wind to produce rotational torque.',
          animation: { type: 'spin', axis: 'z', speed: 2.2, amplitude: 0.1 },
        },
        {
          id: 'airfoil-blade-2',
          name: 'Composite Airfoil Blade 2 (Starboard)',
          label: 'Airfoil Rotor Blade 2',
          shape: 'box',
          dimensions: [2.25, 0.22, 0.06],
          position: [0.95, 1.0, 1.05],
          rotation: [0, 0, -0.52],
          color: '#f1f5f9',
          material: 'plastic',
          description: 'Second 120°-spaced composite airfoil rotor blade.',
          whatIsIt: 'Aerodynamic wing-shaped turbine blade.',
          whatDoesItDo: 'Maintains balanced 3-phase aerodynamic torque across the swept rotor disc.',
          animation: { type: 'spin', axis: 'z', speed: 2.2, amplitude: 0.1 },
        },
        {
          id: 'airfoil-blade-3',
          name: 'Composite Airfoil Blade 3 (Port)',
          label: 'Airfoil Rotor Blade 3',
          shape: 'box',
          dimensions: [2.25, 0.22, 0.06],
          position: [-0.95, 1.0, 1.05],
          rotation: [0, 0, 0.52],
          color: '#f1f5f9',
          material: 'plastic',
          description: 'Third 120°-spaced composite airfoil rotor blade.',
          whatIsIt: 'Aerodynamic wing-shaped turbine blade.',
          whatDoesItDo: 'Completes the symmetric 3-blade rotor assembly.',
          animation: { type: 'spin', axis: 'z', speed: 2.2, amplitude: 0.1 },
        },
      ],
      parameters: {
        windSpeedMs: {
          id: 'windSpeedMs',
          name: 'Free-Stream Wind Velocity (v)',
          min: 3,
          max: 25,
          step: 1,
          defaultValue: 12,
          unit: 'm/s',
          description: 'Available wind power scales with the cube of wind velocity (P ∝ v³).',
          affects: 'animationSpeed',
          scaleFactor: 0.22,
        },
        rotorDiameterScale: {
          id: 'rotorDiameterScale',
          name: 'Blade Swept Length Factor (R)',
          min: 0.7,
          max: 1.4,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Doubling blade length quadruples the swept area A = πR² and power output.',
          affects: 'objectScale',
          targetPartId: 'airfoil-blade-1',
          scaleFactor: 1.0,
        },
        bladePitchDeg: {
          id: 'bladePitchDeg',
          name: 'Blade Pitch Feathering Angle',
          min: 0,
          max: 30,
          step: 2,
          defaultValue: 6,
          unit: '°',
          description: 'Adjusts the angle of attack of the blades to regulate lift and prevent overspeed in storms.',
          affects: 'objectRotation',
          targetPartId: 'airfoil-blade-1',
          scaleFactor: 0.02,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Nacelle Cutaway View',
          type: 'boolean',
          defaultValue: true,
          description: 'Reveals the internal planetary gearbox and copper induction generator inside the nacelle.',
        },
      },
      equations: [
        'P = ½ · ρ · A · v³ · C_p (Wind Turbine Power Equation, where A = πR²)',
        'C_p,max = 16 / 27 ≈ 0.593 (Betz Limit Maximum Theoretical Efficiency)',
      ],
      curiosityPrompts: [
        'Why does doubling the wind speed increase wind turbine power output by 8 times (2³)?',
        'Why do modern wind turbines have 3 thin blades instead of 20 wide blades like old farm windmills?',
        'What is Betz’s Law and why can a turbine never capture 100% of wind energy?',
      ],
    };
  }

  // 4. PROKARYOTIC BACTERIAL CELL WITH FLAGELLUM
  if (q.includes('bacteria') || q.includes('prokaryot') || q.includes('flagellum') || q.includes('plasmid') || q.includes('bacillus')) {
    return {
      id: 'custom-prokaryotic-bacterial-cell',
      title: 'Prokaryotic Bacterial Cell (Bacillus) Explorer',
      concept: 'Microbiology, Prokaryotic Ultrastructure, Peptidoglycan Cell Wall & Flagellar Chemotaxis',
      description:
        'Interactive 3D cutaway model of a rod-shaped prokaryotic bacterium (bacillus) displaying the protective polysaccharide capsule, rigid peptidoglycan cell wall, plasma membrane, cytoplasm, unenclosed circular nucleoid DNA, extrachromosomal plasmids, 70S ribosomes, attachment pili, and rotary motor flagellum.',
      whatIsIt: 'A single-celled prokaryotic microorganism that lacks a membrane-bound nucleus or membrane-bound organelles.',
      howDoesItWork:
        'Genetic information is stored in a single circular chromosome located in the nucleoid region alongside small circular plasmids. 70S ribosomes translate mRNA directly in the cytoplasm, while a proton-motive rotary motor spins the helical flagellum to propel the bacterium toward nutrients (chemotaxis).',
      realLifeExample: 'Escherichia coli in the human gut microbiome or Lactobacillus used to ferment yogurt.',
      examConnection: 'Prokaryotes have 70S ribosomes (50S + 30S subunits), circular naked DNA without histones, and peptidoglycan cell walls — unlike eukaryotes (80S ribosomes, linear DNA with histones, membrane-bound nucleus).',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 3.0, 8.2], target: [0, 0, 0] },
      parts: [
        {
          id: 'polysaccharide-capsule-shell',
          name: 'Outer Polysaccharide Capsule (Glycocalyx)',
          label: 'Polysaccharide Capsule',
          shape: 'capsule',
          dimensions: [1.25, 2.4],
          position: [-0.3, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#10b981',
          material: 'glass',
          opacity: 0.45,
          description: 'Sticky outer glycocalyx layer that protects pathogenic bacteria from host phagocytosis and desiccation.',
          whatIsIt: 'Outermost protective slime/capsule coat.',
          whatDoesItDo: 'Helps bacteria adhere to surfaces (biofilms) and evade immune white blood cells.',
        },
        {
          id: 'peptidoglycan-cell-wall',
          name: 'Peptidoglycan Cell Wall (Murein)',
          label: 'Peptidoglycan Cell Wall',
          shape: 'capsule',
          dimensions: [1.1, 2.2],
          position: [-0.3, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#34d399',
          material: 'glass',
          opacity: 0.55,
          description: 'Rigid meshwork of N-acetylglucosamine (NAG) and N-acetylmuramic acid (NAM) cross-linked by peptide chains.',
          whatIsIt: 'Structural bacterial cell wall (target of penicillin antibiotics).',
          whatDoesItDo: 'Maintains the rod shape of the bacterium and prevents osmotic lysis in hypotonic environments.',
        },
        {
          id: 'bacterial-plasma-membrane',
          name: 'Phospholipid Plasma Membrane',
          label: 'Plasma Membrane (ATP Site)',
          shape: 'capsule',
          dimensions: [0.95, 2.0],
          position: [-0.3, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#fbbf24',
          material: 'tissue',
          opacity: 0.72,
          description: 'Selectively permeable phospholipid bilayer housing electron transport chain enzymes for cellular respiration.',
          whatIsIt: 'Inner cell membrane surrounding the cytoplasm.',
          whatDoesItDo: 'Regulates nutrient transport and generates the proton gradient (H⁺) used for ATP synthesis and flagellar rotation.',
        },
        {
          id: 'nucleoid-circular-dna',
          name: 'Nucleoid Region (Circular Chromosomal DNA)',
          label: 'Nucleoid (Circular DNA)',
          shape: 'torus',
          dimensions: [0.55, 0.18],
          position: [-0.45, 0.05, 0],
          rotation: [0.8, 0.4, 0],
          color: '#ef4444',
          material: 'glow',
          description: 'Dense, supercoiled single circular double-stranded DNA chromosome floating directly in the cytoplasm without a nuclear envelope.',
          whatIsIt: 'Primary bacterial chromosome in the nucleoid region.',
          whatDoesItDo: 'Encodes all essential genes for bacterial metabolism, binary fission, and growth.',
          animation: { type: 'pulse', axis: 'y', speed: 1.8, amplitude: 0.08 },
        },
        {
          id: 'antibiotic-resistance-plasmid',
          name: 'Extrachromosomal Plasmid DNA Ring',
          label: 'Plasmid DNA Ring (R-Plasmid)',
          shape: 'torus',
          dimensions: [0.24, 0.06],
          position: [0.65, 0.25, 0.25],
          rotation: [1.2, 0, 0.5],
          color: '#38bdf8',
          material: 'glow',
          description: 'Small, independently replicating circular DNA molecule often carrying antibiotic-resistance genes and used as a vector in genetic engineering.',
          whatIsIt: 'Accessory circular DNA ring.',
          whatDoesItDo: 'Confers selective advantages like antibiotic resistance and can be transferred between bacteria via conjugation.',
          animation: { type: 'spin', axis: 'z', speed: 1.5, amplitude: 0.1 },
        },
        {
          id: 'ribosomes-70s-cluster',
          name: '70S Bacterial Ribosomes (50S + 30S)',
          label: '70S Ribosomes (Protein Synthesis)',
          shape: 'sphere',
          dimensions: [0.22],
          position: [0.35, -0.3, -0.25],
          color: '#a855f7',
          material: 'standard',
          description: 'Ribonucleoprotein complexes (70S sedimentation rate) that translate mRNA into polypeptide chains.',
          whatIsIt: 'Prokaryotic protein factories.',
          whatDoesItDo: 'Synthesizes bacterial enzymes and structural proteins (coupled transcription-translation).',
        },
        {
          id: 'flagellar-basal-motor',
          name: 'Flagellar Basal Body Rotary Motor',
          label: 'Basal Body Proton Motor',
          shape: 'cylinder',
          dimensions: [0.22, 0.35],
          position: [1.85, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#f59e0b',
          material: 'metal',
          description: 'Biological nanomachine embedded in the cell envelope that spins at up to 100,000 RPM driven by proton (H⁺) flux.',
          whatIsIt: 'Molecular rotary engine at the base of the flagellum.',
          whatDoesItDo: 'Converts proton-motive force across the plasma membrane into mechanical torque.',
          animation: { type: 'spin', axis: 'x', speed: 4.5, amplitude: 0.2 },
        },
        {
          id: 'helical-flagellum-filament',
          name: 'Flagellin Helical Propeller Filament',
          label: 'Flagellum Propeller',
          shape: 'cylinder',
          dimensions: [0.06, 2.4],
          position: [3.1, 0, 0],
          rotation: [0, 0.18, Math.PI / 2],
          color: '#38bdf8',
          material: 'plastic',
          description: 'Long helical protein filament made of flagellin that acts as a screw propeller in aqueous media.',
          whatIsIt: 'Whip-like swimming tail of the bacterium.',
          whatDoesItDo: 'Propels the cell forward during "runs" and reorients it during "tumbles" in chemotaxis.',
          animation: { type: 'oscillate', axis: 'z', speed: 5.0, amplitude: 0.22 },
        },
        {
          id: 'attachment-pili-fimbriae',
          name: 'Conjugation Pilus & Surface Fimbriae',
          label: 'Pili / Fimbriae',
          shape: 'cylinder',
          dimensions: [0.04, 0.85],
          position: [-0.8, 1.35, 0],
          rotation: [0, 0, 0.25],
          color: '#cbd5e1',
          material: 'plastic',
          description: 'Hair-like protein appendages extending from the capsule for surface attachment and horizontal gene transfer (sex pilus).',
          whatIsIt: 'Protein attachment bristles and DNA bridge tubes.',
          whatDoesItDo: 'Anchors bacteria to host tissues and forms mating bridges to transfer plasmids.',
        },
      ],
      parameters: {
        protonMotiveForce: {
          id: 'protonMotiveForce',
          name: 'Proton-Motive Force (ΔpH Flagellar Speed)',
          min: 20,
          max: 200,
          step: 10,
          defaultValue: 120,
          unit: 'mV',
          description: 'Transmembrane H⁺ electrochemical gradient driving the rotary flagellar motor speed.',
          affects: 'animationSpeed',
          scaleFactor: 0.025,
        },
        capsuleThickness: {
          id: 'capsuleThickness',
          name: 'Polysaccharide Capsule Thickness',
          min: 0.8,
          max: 1.35,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Adjusts the outer virulence capsule thickness surrounding the peptidoglycan wall.',
          affects: 'objectScale',
          targetPartId: 'polysaccharide-capsule-shell',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Cutaway Envelope View',
          type: 'boolean',
          defaultValue: true,
          description: 'Makes the outer capsule and cell wall semi-transparent to inspect the nucleoid and plasmids.',
        },
      },
      equations: [
        'N(t) = N₀ · 2^(t / g) (Exponential Bacterial Binary Fission Growth)',
        'Δp = Δψ − (2.3·R·T / F)·ΔpH (Proton-Motive Force Driving Flagellar Rotation)',
      ],
      curiosityPrompts: [
        'Why do antibiotics like penicillin kill bacteria by targeting peptidoglycan without harming human cells?',
        'How does a bacterium transfer antibiotic resistance to another bacterium using a plasmid and pilus?',
        'Why do prokaryotes have 70S ribosomes while eukaryotic cells have 80S ribosomes?',
      ],
    };
  }

  // 5. SOLAR PHOTOVOLTAIC (PV) CELL
  if (q.includes('solar cell') || q.includes('photovoltaic') || (q.includes('pv') && q.includes('cell')) || q.includes('solar panel')) {
    return {
      id: 'custom-solar-photovoltaic-cell',
      title: 'Solar Photovoltaic (PV) p–n Junction Cell',
      concept: 'Photovoltaic Effect, Semiconductor Band Gap, Electron-Hole Pair Generation & DC Power',
      description:
        'Interactive 3D semiconductor physics model of a crystalline silicon solar photovoltaic cell showing the tempered glass cover, silicon nitride anti-reflective coating, front silver contact fingers, n-type phosphorus-doped silicon emitter, depletion zone electric field, p-type boron-doped silicon base, aluminum back-surface field contact, and incident photon stream.',
      whatIsIt: 'A solid-state semiconductor device that converts sunlight (photons) directly into direct-current (DC) electricity via the photovoltaic effect.',
      howDoesItWork:
        'Incident photons with energy E = hf greater than the silicon band gap (1.12 eV) excite electrons from the valence band into the conduction band, creating electron-hole pairs. The built-in electric field at the p–n depletion junction sweeps electrons into the n-type layer and holes into the p-type layer, driving DC current through an external load.',
      realLifeExample: 'Rooftop solar panels, spacecraft solar arrays on the ISS, and solar calculators.',
      examConnection: 'Only photons with energy hf ≥ E_g (1.12 eV for silicon, λ ≤ 1100 nm) can excite an electron across the band gap; excess photon energy (hf − E_g) is dissipated as lattice heat (thermalization), defining the Shockley–Queisser efficiency limit (~33.7%).',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [3.2, 3.2, 7.8], target: [0, 0, 0] },
      parts: [
        {
          id: 'incident-solar-photon-stream',
          name: 'Incident Solar Photon Stream (E = hf)',
          label: 'Incident Photons (E = hf)',
          shape: 'Octahedron'.toLowerCase() as any,
          dimensions: [0.45],
          position: [0, 2.2, 0],
          color: '#facc15',
          material: 'glow',
          description: 'Incoming solar electromagnetic quanta striking the top surface of the photovoltaic cell.',
          whatIsIt: 'Packets of light energy (photons) from the Sun.',
          whatDoesItDo: 'Transfers quantum energy hf to valence electrons in the silicon crystal lattice.',
          animation: { type: 'oscillate', axis: 'y', speed: 3.2, amplitude: 0.35 },
        },
        {
          id: 'antireflective-glass-coating',
          name: 'Tempered Glass & Si₃N₄ Anti-Reflective Layer',
          label: 'Anti-Reflective Coating (Si₃N₄)',
          shape: 'box',
          dimensions: [4.6, 0.25, 3.4],
          position: [0, 1.15, 0],
          color: '#38bdf8',
          material: 'glass',
          opacity: 0.55,
          description: 'Quarter-wavelength silicon nitride thin film that minimizes surface reflection from >30% down to <3%, giving solar cells their deep blue color.',
          whatIsIt: 'Transparent optical coating and protective glass top sheet.',
          whatDoesItDo: 'Maximizes photon transmission into the active silicon absorber layer via destructive interference of reflected rays.',
        },
        {
          id: 'front-metallic-grid-fingers',
          name: 'Front Silver Busbars & Contact Fingers (−)',
          label: 'Front Metal Grid (− Cathode)',
          shape: 'box',
          dimensions: [4.4, 0.12, 0.35],
          position: [0, 0.92, 0],
          color: '#e2e8f0',
          material: 'metal',
          description: 'Narrow metallic grid lines printed on the sunlit surface to collect photo-generated electrons without blocking incoming light.',
          whatIsIt: 'Negative front electrical terminal grid.',
          whatDoesItDo: 'Collects free electrons from the n-type emitter and routes them into the external DC circuit.',
        },
        {
          id: 'n-type-silicon-emitter',
          name: 'n-Type Phosphorus-Doped Silicon Emitter',
          label: 'n-Type Silicon (Donor e⁻)',
          shape: 'box',
          dimensions: [4.6, 0.55, 3.4],
          position: [0, 0.52, 0],
          color: '#0284c7',
          material: 'standard',
          description: 'Thin silicon layer doped with pentavalent phosphorus (Group 15) atoms providing mobile majority electrons.',
          whatIsIt: 'Negative-type semiconductor top layer.',
          whatDoesItDo: 'Receives photo-excited electrons swept across the depletion zone electric field.',
        },
        {
          id: 'pn-depletion-junction-zone',
          name: 'p–n Depletion Zone (Built-In Electric Field E_bi)',
          label: 'p–n Depletion Zone (Charge Separation)',
          shape: 'box',
          dimensions: [4.65, 0.28, 3.45],
          position: [0, 0.1, 0],
          color: '#f59e0b',
          material: 'glow',
          description: 'Space-charge region between n-type and p-type silicon containing fixed donor (+P) and acceptor (−B) ions that create a strong internal electric field.',
          whatIsIt: 'Internal charge-separating barrier junction.',
          whatDoesItDo: 'Acts as a one-way diode broom that separates electron-hole pairs before they can recombine.',
          animation: { type: 'pulse', axis: 'y', speed: 2.4, amplitude: 0.06 },
        },
        {
          id: 'p-type-silicon-absorber-base',
          name: 'p-Type Boron-Doped Silicon Absorber Base',
          label: 'p-Type Silicon Base (Acceptor h⁺)',
          shape: 'box',
          dimensions: [4.6, 0.95, 3.4],
          position: [0, -0.52, 0],
          color: '#be123c',
          material: 'standard',
          description: 'Thick crystalline silicon wafer doped with trivalent boron (Group 13) atoms where most long-wavelength photons are absorbed.',
          whatIsIt: 'Positive-type semiconductor base wafer.',
          whatDoesItDo: 'Absorbs photons to generate minority electrons that diffuse to the depletion junction, while collecting positive holes (h⁺).',
        },
        {
          id: 'rear-aluminum-contact-sheet',
          name: 'Rear Aluminum Back-Surface Field Contact (+)',
          label: 'Rear Aluminum Contact (+ Anode)',
          shape: 'box',
          dimensions: [4.6, 0.24, 3.4],
          position: [0, -1.12, 0],
          color: '#94a3b8',
          material: 'metal',
          description: 'Full-area conductive metallic back sheet serving as the positive terminal and reflecting unabsorbed infrared photons back into the wafer.',
          whatIsIt: 'Positive rear metallic electrode.',
          whatDoesItDo: 'Completes the electrical circuit by receiving returning electrons from the external load to recombine with holes.',
        },
      ],
      parameters: {
        solarIrradianceWm2: {
          id: 'solarIrradianceWm2',
          name: 'Solar Irradiance Intensity (G)',
          min: 100,
          max: 1200,
          step: 50,
          defaultValue: 1000,
          unit: 'W/m²',
          description: 'Short-circuit photocurrent I_sc is directly proportional to incident solar irradiance (Standard Test Condition = 1000 W/m²).',
          affects: 'animationSpeed',
          scaleFactor: 0.0025,
        },
        depletionWidthScale: {
          id: 'depletionWidthScale',
          name: 'Depletion Zone Field Width',
          min: 0.6,
          max: 1.8,
          step: 0.1,
          defaultValue: 1.0,
          unit: '×',
          description: 'Adjusts the thickness of the internal p–n space-charge separation region.',
          affects: 'objectScale',
          targetPartId: 'pn-depletion-junction-zone',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Show Optical & Junction Layers',
          type: 'boolean',
          defaultValue: true,
          description: 'Highlights internal charge separation across the n-type, depletion, and p-type semiconductor layers.',
        },
      },
      equations: [
        'I = I_L − I₀ · [exp(q·V / n·k_B·T) − 1] (Ideal Photovoltaic Solar Cell Equation)',
        'η = (V_oc · I_sc · FF) / P_solar (Photovoltaic Conversion Efficiency, E_g(Si) = 1.12 eV)',
      ],
      curiosityPrompts: [
        'Why does a silicon solar cell stop generating electricity if photon wavelength is longer than 1100 nm (infrared)?',
        'Why do solar panels actually lose voltage and efficiency when they get too hot on a summer afternoon?',
        'What is the role of the built-in electric field inside the p–n depletion zone?',
      ],
    };
  }

  // 6. BENZENE AROMATIC RING (C6H6)
  if (q.includes('benzene') || q.includes('c6h6') || q.includes('aromatic ring') || q.includes('delocalized pi')) {
    const parts: ModelPartSpec[] = [];
    const R_c = 1.4;
    const R_h = 2.48;

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const cx = +(R_c * Math.cos(angle)).toFixed(3);
      const cz = +(R_c * Math.sin(angle)).toFixed(3);
      const hx = +(R_h * Math.cos(angle)).toFixed(3);
      const hz = +(R_h * Math.sin(angle)).toFixed(3);

      parts.push({
        id: `carbon-c${i + 1}`,
        name: `sp² Carbon Atom C${i + 1}`,
        label: `C${i + 1} (sp² — 120°)`,
        shape: 'sphere',
        dimensions: [0.42],
        position: [cx, 0, cz],
        color: '#334155',
        material: 'standard',
        description: `sp² hybridized ring carbon atom C${i + 1} with 120° trigonal planar geometry and one unhybridized 2p_z orbital.`,
        whatIsIt: 'sp² hybridized carbon atom in the hexagonal benzene ring.',
        whatDoesItDo: 'Forms three planar σ (sigma) bonds and contributes one π electron to the delocalized aromatic cloud.',
      });

      parts.push({
        id: `hydrogen-h${i + 1}`,
        name: `Aromatic Hydrogen Atom H${i + 1}`,
        label: `H${i + 1}`,
        shape: 'sphere',
        dimensions: [0.28],
        position: [hx, 0, hz],
        color: '#f8fafc',
        material: 'standard',
        description: `Peripheral hydrogen atom bonded radially via an sp²–1s σ bond.`,
        whatIsIt: 'Terminal hydrogen atom of C₆H₆.',
        whatDoesItDo: 'Completes the planar hexagonal symmetry (D₆ₕ point group) of benzene.',
      });

      // C-C bond to next carbon
      const nextAngle = (((i + 1) % 6) * Math.PI) / 3;
      const ncx = +(R_c * Math.cos(nextAngle)).toFixed(3);
      const ncz = +(R_c * Math.sin(nextAngle)).toFixed(3);
      parts.push(
        createBondPart(
          `cc-sigma-bond-${i + 1}`,
          `C${i + 1}–C${((i + 1) % 6) + 1} Intermediate Bond (1.39 Å, BO = 1.5)`,
          [cx, 0, cz],
          [ncx, 0, ncz],
          0.12,
          '#94a3b8'
        )
      );
    }

    // Upper and lower delocalized pi electron clouds
    parts.push({
      id: 'upper-delocalized-pi-torus',
      name: 'Upper Delocalized π Electron Ring Cloud (+ψ)',
      label: 'Upper π Electron Cloud (6π Huckel)',
      shape: 'torus',
      dimensions: [1.4, 0.26],
      position: [0, 0.58, 0],
      rotation: [Math.PI / 2, 0, 0],
      color: '#38bdf8',
      material: 'glass',
      opacity: 0.68,
      description: 'Continuous toroidal lobe of electron density formed by side-by-side overlap of six parallel unhybridized 2p_z orbitals above the ring plane.',
      whatIsIt: 'Delocalized aromatic π molecular orbital cloud.',
      whatDoesItDo: 'Stabilizes the benzene ring by ~150 kJ/mol (resonance stabilization energy), favoring substitution over addition reactions.',
      animation: { type: 'pulse', axis: 'y', speed: 2.2, amplitude: 0.08 },
    });

    parts.push({
      id: 'lower-delocalized-pi-torus',
      name: 'Lower Delocalized π Electron Ring Cloud (−ψ)',
      label: 'Lower π Electron Cloud',
      shape: 'torus',
      dimensions: [1.4, 0.26],
      position: [0, -0.58, 0],
      rotation: [Math.PI / 2, 0, 0],
      color: '#f43f5e',
      material: 'glass',
      opacity: 0.68,
      description: 'Lower toroidal lobe of the delocalized π electron system below the hexagonal σ ring plane.',
      whatIsIt: 'Lower lobe of the aromatic π electron sextet.',
      whatDoesItDo: 'Equalizes all six C–C bond lengths to exactly 1.39 Å (intermediate between 1.54 Å single and 1.34 Å double bonds).',
      animation: { type: 'pulse', axis: 'y', speed: 2.2, amplitude: 0.08 },
    });

    return {
      id: 'custom-benzene-aromatic-ring',
      title: 'Benzene (C₆H₆) Aromatic Ring & Delocalized π Cloud',
      concept: 'Aromaticity, sp² Hybridization, Resonance Delocalization & Hückel’s 4n+2 Rule',
      description:
        'Interactive 3D molecular model of benzene (C₆H₆) showing the planar hexagonal ring of six sp² hybridized carbon atoms, six radial hydrogen atoms, equalized 1.39 Å carbon–carbon bonds (bond order 1.5), and the upper and lower toroidal delocalized 6π electron clouds.',
      whatIsIt: 'The prototypical aromatic hydrocarbon molecule (C₆H₆) with a planar hexagonal carbon ring and a delocalized cloud of six π electrons.',
      howDoesItWork:
        'Each carbon atom uses sp² hybrid orbitals to form three planar σ bonds at 120° angles, leaving one unhybridized 2p_z orbital perpendicular to the ring. All six 2p_z orbitals overlap continuously around the ring, forming a delocalized π system obeying Hückel’s 4n + 2 = 6 rule (n = 1).',
      realLifeExample: 'Foundational ring structure in aspirin, paracetamol, amino acids (phenylalanine, tyrosine), and polystyrene plastics.',
      examConnection: 'X-ray diffraction proves all six C–C bonds in benzene have an identical length of 139 pm (1.39 Å), mid-way between a C–C single bond (154 pm) and a C=C double bond (134 pm).',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 4.5, 6.8], target: [0, 0, 0] },
      parts,
      parameters: {
        piCloudScale: {
          id: 'piCloudScale',
          name: 'π-Orbital Delocalization Density',
          min: 0.6,
          max: 1.5,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Scales the upper and lower toroidal delocalized 6π electron probability clouds.',
          affects: 'objectScale',
          targetPartId: 'upper-delocalized-pi-torus',
          scaleFactor: 1.0,
        },
        vibrationFrequency: {
          id: 'vibrationFrequency',
          name: 'Ring Breathing Vibration Mode',
          min: 0.5,
          max: 4.0,
          step: 0.25,
          defaultValue: 2.0,
          unit: 'THz',
          description: 'Controls the harmonic pulsation rate of the delocalized π electron system.',
          affects: 'animationSpeed',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Show Delocalized π Clouds',
          type: 'boolean',
          defaultValue: true,
          description: 'Toggles visibility and translucency of the upper and lower π molecular orbital lobes.',
        },
      },
      equations: [
        '4n + 2 = 6 π electrons (Hückel’s Rule for Aromaticity, n = 1)',
        'Bond Order = (6 σ + 3 π) / 6 = 1.5 (All C–C bonds equal at 1.39 Å)',
      ],
      curiosityPrompts: [
        'Why are all six carbon–carbon bonds in benzene the exact same length (1.39 Å) instead of alternating short and long?',
        'Why does benzene undergo electrophilic aromatic substitution instead of addition reactions like alkenes?',
        'What are the four criteria a molecule must satisfy to be aromatic under Hückel’s rule?',
      ],
    };
  }

  // 7. CHLOROPLAST & PHOTOSYNTHESIS 3D MODEL
  if (q.includes('chloroplast') || q.includes('thylakoid') || q.includes('grana') || q.includes('photosynthesis')) {
    return {
      id: 'custom-chloroplast-photosynthesis',
      title: 'Chloroplast Ultrastructure & Thylakoid Grana Explorer',
      concept: 'Photosynthesis, Light-Dependent Thylakoid Reactions & Calvin Cycle Stroma',
      description:
        'Interactive 3D organelle model of a plant chloroplast illustrating the smooth outer membrane, inner membrane, aqueous stroma matrix, stacked thylakoid discs (grana), interconnecting stroma lamellae, circular plastid DNA, and starch granules.',
      whatIsIt: 'The double-membrane photosynthetic organelle in plant and algal cells that converts light energy, CO₂, and H₂O into glucose and O₂.',
      howDoesItWork:
        'Chlorophyll pigments embedded in the stacked thylakoid membranes (grana) absorb red and blue photons to split water (photolysis, releasing O₂) and synthesize ATP and NADPH. In the surrounding fluid stroma, the enzyme RuBisCO uses that ATP and NADPH to fix CO₂ into glucose via the Calvin Cycle.',
      realLifeExample: 'Green leaves capturing sunlight to power nearly all food chains and oxygenate Earth’s atmosphere.',
      examConnection: 'Light-dependent reactions occur in the Thylakoid Membranes (producing O₂, ATP, NADPH); Light-independent reactions (Calvin Cycle) occur in the Stroma (fixing CO₂ into triose phosphate/glucose).',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 3.8, 7.5], target: [0, 0, 0] },
      parts: [
        {
          id: 'chloroplast-outer-membrane',
          name: 'Outer Phospholipid Envelope',
          label: 'Outer Chloroplast Membrane',
          shape: 'capsule',
          dimensions: [1.35, 2.5],
          position: [0, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#15803d',
          material: 'glass',
          opacity: 0.45,
          description: 'Smooth outer lipid bilayer containing porin proteins permeable to small metabolites.',
          whatIsIt: 'Outer boundary membrane of the chloroplast.',
          whatDoesItDo: 'Defines the organelle boundary and reflects endosymbiotic cyanobacterial ancestry.',
        },
        {
          id: 'chloroplast-stroma-matrix',
          name: 'Stroma Fluid Matrix (Calvin Cycle Site)',
          label: 'Stroma (Calvin Cycle & RuBisCO)',
          shape: 'capsule',
          dimensions: [1.18, 2.2],
          position: [0, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#4ade80',
          material: 'glass',
          opacity: 0.35,
          description: 'Protein-rich alkaline fluid containing RuBisCO enzymes, 70S plastoribosomes, and circular chloroplast DNA (cpDNA).',
          whatIsIt: 'Internal aqueous fluid surrounding the thylakoid stacks.',
          whatDoesItDo: 'Catalyzes carbon fixation (Calvin-Benson cycle) using ATP and NADPH from the thylakoids.',
        },
        {
          id: 'thylakoid-granum-stack-left',
          name: 'Left Thylakoid Granum Stack (Photosystems I & II)',
          label: 'Granum (Stacked Thylakoid Discs)',
          shape: 'cylinder',
          dimensions: [0.55, 1.25],
          position: [-1.05, 0.05, 0.15],
          color: '#16a34a',
          material: 'standard',
          description: 'Vertical stack of flattened thylakoid membrane sacs packed with chlorophyll a/b, carotenoids, and ATP synthase.',
          whatIsIt: 'Stack of chlorophyll-rich thylakoid membrane discs.',
          whatDoesItDo: 'Captures photons, splits water (2H₂O → O₂ + 4H⁺ + 4e⁻), and pumps protons into the thylakoid lumen.',
          animation: { type: 'pulse', axis: 'y', speed: 2.0, amplitude: 0.07 },
        },
        {
          id: 'thylakoid-granum-stack-center',
          name: 'Central Thylakoid Granum Stack',
          label: 'Central Thylakoid Granum',
          shape: 'cylinder',
          dimensions: [0.58, 1.35],
          position: [0.0, 0.1, -0.15],
          color: '#15803d',
          material: 'standard',
          description: 'High-surface-area thylakoid membrane stack maximizing light absorption and chemiosmotic ATP synthesis.',
          whatIsIt: 'Central stack of thylakoid discs.',
          whatDoesItDo: 'Hosts the photosynthetic electron transport chain (Z-scheme).',
          animation: { type: 'pulse', axis: 'y', speed: 2.0, amplitude: 0.07 },
        },
        {
          id: 'thylakoid-granum-stack-right',
          name: 'Right Thylakoid Granum Stack',
          label: 'Right Thylakoid Granum',
          shape: 'cylinder',
          dimensions: [0.52, 1.15],
          position: [1.05, -0.05, 0.2],
          color: '#16a34a',
          material: 'standard',
          description: 'Right thylakoid granum interconnected via stroma lamellae.',
          whatIsIt: 'Right stack of photosynthetic thylakoids.',
          whatDoesItDo: 'Generates NADPH and ATP on the stromal surface.',
          animation: { type: 'pulse', axis: 'y', speed: 2.0, amplitude: 0.07 },
        },
        {
          id: 'stroma-lamellae-bridges',
          name: 'Intergranal Stroma Lamellae (Frets)',
          label: 'Stroma Lamellae (Membrane Bridges)',
          shape: 'cylinder',
          dimensions: [0.12, 2.5],
          position: [0, 0.05, 0.05],
          rotation: [0, 0, Math.PI / 2],
          color: '#22c55e',
          material: 'plastic',
          description: 'Tubular membrane channels connecting individual grana stacks into a single continuous internal thylakoid lumen.',
          whatIsIt: 'Connecting membrane bridges between grana.',
          whatDoesItDo: 'Allows mobile electron carriers (plastoquinone/plastocyanin) and protons to circulate between grana.',
        },
        {
          id: 'chloroplast-dna-ring',
          name: 'Circular Chloroplast DNA (cpDNA)',
          label: 'Circular Plastid DNA (Endosymbiosis)',
          shape: 'torus',
          dimensions: [0.28, 0.06],
          position: [-0.55, -0.5, 0.55],
          rotation: [1.1, 0.3, 0],
          color: '#facc15',
          material: 'glow',
          description: 'Autonomous circular genome providing evolutionary evidence that chloroplasts originated from engulfed photosynthetic cyanobacteria.',
          whatIsIt: 'Organelle-specific circular DNA ring.',
          whatDoesItDo: 'Encodes key photosynthetic proteins including the large subunit of RuBisCO.',
        },
      ],
      parameters: {
        photonFluxDensity: {
          id: 'photonFluxDensity',
          name: 'Photosynthetic Photon Flux (PAR)',
          min: 50,
          max: 1500,
          step: 50,
          defaultValue: 600,
          unit: 'μmol/m²·s',
          description: 'Drives the rate of water photolysis, electron transport, and thylakoid proton pumping.',
          affects: 'animationSpeed',
          scaleFactor: 0.003,
        },
        granaStackScale: {
          id: 'granaStackScale',
          name: 'Thylakoid Grana Stacking Height',
          min: 0.7,
          max: 1.4,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Shade-adapted leaves develop taller grana stacks to capture scarce photons.',
          affects: 'objectScale',
          targetPartId: 'thylakoid-granum-stack-center',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Cutaway Outer Envelope',
          type: 'boolean',
          defaultValue: true,
          description: 'Makes the chloroplast double envelope translucent so internal grana and stroma lamellae are clearly visible.',
        },
      },
      equations: [
        '6 CO₂ + 6 H₂O + Light (hν) ➔ C₆H₁₂O₆ + 6 O₂ (Overall Photosynthesis Equation)',
        '2 H₂O + 2 NADP⁺ + 3 ADP + 3 P_i ➔ O₂ + 2 NADPH + 3 ATP (Z-Scheme Light Reactions)',
      ],
      curiosityPrompts: [
        'Why do plants appear green if sunlight is strongest in the green-yellow part of the spectrum?',
        'How does the proton (H⁺) gradient inside the tiny thylakoid lumen drive ATP synthase?',
        'What evidence shows that chloroplasts were once free-living photosynthetic cyanobacteria?',
      ],
    };
  }

  // 8. EARTH'S INTERIOR LAYERS & CONVECTION
  if ((q.includes('earth') && (q.includes('layer') || q.includes('interior') || q.includes('core') || q.includes('mantle') || q.includes('crust'))) || q.includes('lithosphere')) {
    return {
      id: 'custom-earth-interior-layers',
      title: 'Earth’s Concentric Interior Layers & Geodynamo Core',
      concept: 'Geophysics, Planetary Differentiation, Mantle Convection & Outer Core Geodynamo',
      description:
        'Interactive 3D cutaway geophysical model of Earth’s internal structure displaying the thin brittle silicate crust, upper and lower silicate mantle with convective plumes, Gutenberg discontinuity, liquid iron–nickel outer core (geodynamo source), and solid crystalline inner core.',
      whatIsIt: 'A concentric cross-section of planet Earth from the surface crust down to the 6,371 km deep solid iron center.',
      howDoesItWork:
        'Primordial gravitational differentiation separated dense siderophile metals (Fe, Ni) into the core while lighter silicate minerals formed the mantle and crust. Primordial heat and radioactive decay (²³⁸U, ²³²Th, ⁴⁰K) drive slow thermal convection in the mantle (moving tectonic plates) and Coriolis-twisted fluid currents in the liquid outer core (generating Earth’s magnetic field).',
      realLifeExample: 'Seismic P-waves and S-waves from earthquakes revealing that the outer core is liquid (S-wave shadow zone).',
      examConnection: 'Mohorovičić (Moho) discontinuity separates Crust from Mantle (~35 km); Gutenberg discontinuity separates silicate Mantle from liquid Fe-Ni Outer Core (2,890 km); Lehmann discontinuity separates Outer Core from solid Inner Core (5,150 km).',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 3.2, 8.2], target: [0, 0, 0] },
      parts: [
        {
          id: 'earth-crust-lithosphere',
          name: 'Oceanic & Continental Crust (0–70 km)',
          label: 'Silicate Crust (Lithosphere)',
          shape: 'sphere',
          dimensions: [2.65],
          position: [0, 0, 0],
          color: '#0284c7',
          material: 'glass',
          opacity: 0.32,
          description: 'Outermost rigid rocky shell composed of granitic continental crust (~2.7 g/cm³) and basaltic oceanic crust (~3.0 g/cm³).',
          whatIsIt: 'Thin outer rocky skin of the Earth.',
          whatDoesItDo: 'Floats isostatically atop the ductile asthenosphere and breaks into tectonic plates.',
        },
        {
          id: 'silicate-mantle-shell',
          name: 'Silicate Mantle (Asthenosphere & Mesosphere, 2,890 km)',
          label: 'Convecting Silicate Mantle (84% Volume)',
          shape: 'sphere',
          dimensions: [2.25],
          position: [0, 0, 0],
          color: '#d97706',
          material: 'glass',
          opacity: 0.45,
          description: 'Peridotite/bridgmanite magnesium-iron silicate shell making up 84% of Earth’s volume, creeping via solid-state thermal convection.',
          whatIsIt: 'Thick hot silicate rock layer between the crust and core.',
          whatDoesItDo: 'Transfers internal planetary heat outward via convection cells that drive plate tectonics.',
          animation: { type: 'spin', axis: 'y', speed: 0.4, amplitude: 0.05 },
        },
        {
          id: 'liquid-iron-outer-core',
          name: 'Liquid Iron–Nickel Outer Core (2,890–5,150 km)',
          label: 'Liquid Fe–Ni Outer Core (Geodynamo)',
          shape: 'sphere',
          dimensions: [1.45],
          position: [0, 0, 0],
          color: '#f97316',
          material: 'glow',
          opacity: 0.65,
          description: 'Turbulent, electrically conducting molten iron-nickel alloy layer (~4,500 °C) where shear modulus μ = 0 (blocking S-waves).',
          whatIsIt: 'Molten metallic ocean surrounding the inner core.',
          whatDoesItDo: 'Convecting liquid iron currents twisted by Earth’s rotation generate the geomagnetic dipole field.',
          animation: { type: 'spin', axis: 'y', speed: 1.4, amplitude: 0.1 },
        },
        {
          id: 'solid-iron-inner-core',
          name: 'Solid Crystalline Iron–Nickel Inner Core (5,150–6,371 km)',
          label: 'Solid Fe–Ni Inner Core (~5,400 °C, 360 GPa)',
          shape: 'sphere',
          dimensions: [0.75],
          position: [0, 0, 0],
          color: '#fef08a',
          material: 'glow',
          description: 'Super-dense (~13.0 g/cm³) solid hexagonal-close-packed iron sphere kept solid despite 5,400 °C temperatures by extreme 360 GPa overburden pressure.',
          whatIsIt: 'Solid metallic heart at the center of the Earth.',
          whatDoesItDo: 'Slowly crystallizes out of the liquid outer core, releasing latent heat that powers the geodynamo.',
          animation: { type: 'pulse', axis: 'y', speed: 2.2, amplitude: 0.08 },
        },
        {
          id: 'mantle-convection-ring',
          name: 'Mantle Thermal Convection Plume Loop',
          label: 'Mantle Convection Plume',
          shape: 'torus',
          dimensions: [1.85, 0.08],
          position: [0, 0, 0],
          color: '#ef4444',
          material: 'glow',
          description: 'Upwelling hot thermal plume rising from the core–mantle boundary (D″ layer) toward the lithosphere.',
          whatIsIt: 'Thermal convection loop inside the mantle.',
          whatDoesItDo: 'Drives seafloor spreading at mid-ocean ridges and hotspot volcanism.',
          animation: { type: 'spin', axis: 'z', speed: 1.2, amplitude: 0.1 },
        },
      ],
      parameters: {
        coreConvectionSpeed: {
          id: 'coreConvectionSpeed',
          name: 'Geodynamo & Mantle Convection Rate',
          min: 0.2,
          max: 3.5,
          step: 0.2,
          defaultValue: 1.4,
          unit: '×',
          description: 'Modulates the rotational and convective speed of the liquid outer core and mantle plumes.',
          affects: 'animationSpeed',
          scaleFactor: 1.0,
        },
        innerCoreRadiusScale: {
          id: 'innerCoreRadiusScale',
          name: 'Inner Core Crystallization Radius',
          min: 0.6,
          max: 1.35,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Simulates secular cooling and growth of the solid inner core over geological eons.',
          affects: 'objectScale',
          targetPartId: 'solid-iron-inner-core',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Concentric Cutaway Transparency',
          type: 'boolean',
          defaultValue: true,
          description: 'Keeps the crust, mantle, and outer core translucent so all four internal shells can be inspected simultaneously.',
        },
      },
      equations: [
        'g(r) = G · M(r) / r² (Interior Gravitational Acceleration Profile)',
        'v_P = √((K + 4/3 μ) / ρ) , v_S = √(μ / ρ) (Seismic Wave Velocities; μ = 0 in Liquid Outer Core)',
      ],
      curiosityPrompts: [
        'Why is Earth’s inner core solid if it is hotter than the surface of the Sun (~5,400 °C)?',
        'How do earthquake S-waves prove that Earth’s outer core is liquid without anyone ever drilling past 12 km?',
        'What would happen to Earth’s atmosphere if the liquid outer core solidified and stopped the geodynamo?',
      ],
    };
  }

  // 9. SYNOVIAL JOINT / KNEE / ELBOW BIOMECHANICS
  if (q.includes('joint') || q.includes('synovial') || q.includes('knee') || q.includes('elbow') || q.includes('ligament') || q.includes('tendon')) {
    return {
      id: 'custom-synovial-joint-biomechanics',
      title: 'Synovial Hinge Joint, Ligaments & Antagonistic Muscle Biomechanics',
      concept: 'Skeletal Articulation, Hyaline Cartilage, Synovial Lubrication & Antagonistic Muscle Leverage',
      description:
        'Interactive 3D anatomical biomechanics model of a diarthrodial synovial hinge joint (knee/elbow) displaying the proximal bone (femur/humerus), distal bone (tibia/ulna), low-friction hyaline articular cartilage pads, fluid-filled synovial joint capsule, collateral/cruciate stabilizing ligaments, and contracting flexor muscle belly with tendon insertion.',
      whatIsIt: 'A freely movable anatomical joint where two bones meet inside a lubricated fluid cavity stabilized by ligaments and moved by muscles.',
      howDoesItWork:
        'Skeletal muscles only pull (never push) by contracting actin-myosin sarcomeres and transmitting tension through inextensible collagen tendons across the joint fulcrum. Articular hyaline cartilage and viscous hyaluronic synovial fluid reduce the friction coefficient to μ ≈ 0.002 (ten times slicker than ice on ice), while ligaments connect bone-to-bone to prevent dislocation.',
      realLifeExample: 'Bending your knee when kicking a football or flexing your elbow to lift a dumbbell.',
      examConnection: 'Ligaments connect Bone to Bone (elastic stability at joints); Tendons connect Muscle to Bone (inelastic force transmission). Cartilage absorbs compressive shock and reduces friction.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 1.8, 7.8], target: [0, 0, 0] },
      parts: [
        {
          id: 'proximal-femur-humerus-bone',
          name: 'Proximal Long Bone Shaft & Condyles (Femur / Humerus)',
          label: 'Proximal Bone (Femur / Humerus)',
          shape: 'cylinder',
          dimensions: [0.42, 2.5],
          position: [0, 1.55, 0],
          color: '#f8fafc',
          material: 'bone',
          description: 'Upper cortical long bone ending in rounded articular condyles that form the upper half of the hinge joint.',
          whatIsIt: 'Upper weight-bearing skeletal bone.',
          whatDoesItDo: 'Provides the proximal structural anchor for flexor/extensor muscles and joint articulation.',
        },
        {
          id: 'articular-hyaline-cartilage',
          name: 'Articular Hyaline Cartilage & Meniscus Pad',
          label: 'Hyaline Articular Cartilage',
          shape: 'cylinder',
          dimensions: [0.55, 0.28],
          position: [0, 0.12, 0],
          color: '#38bdf8',
          material: 'plastic',
          description: 'Smooth, avascular collagen-proteoglycan cushion covering the articulating epiphyses of both bones.',
          whatIsIt: 'Shock-absorbing glassy cartilage pad between the bone ends.',
          whatDoesItDo: 'Prevents bone-on-bone grinding and distributes compressive impact loads across a wider area.',
        },
        {
          id: 'synovial-fluid-capsule',
          name: 'Synovial Membrane & Lubricating Fluid Cavity',
          label: 'Synovial Capsule & Fluid',
          shape: 'sphere',
          dimensions: [0.82],
          position: [0, 0.05, 0],
          color: '#fbbf24',
          material: 'glass',
          opacity: 0.42,
          description: 'Fibrous articular capsule lined by the synovial membrane, which secretes egg-white-like hyaluronic synovial fluid.',
          whatIsIt: 'Sealed fluid-filled lubrication pouch enclosing the joint.',
          whatDoesItDo: 'Lubricates the cartilage surfaces and nourishes chondrocytes via diffusion.',
        },
        {
          id: 'distal-tibia-ulna-bone',
          name: 'Distal Long Bone Lever Arm (Tibia / Ulna)',
          label: 'Distal Bone Lever (Tibia / Ulna)',
          shape: 'cylinder',
          dimensions: [0.38, 2.5],
          position: [0, -1.45, 0],
          color: '#f1f5f9',
          material: 'bone',
          description: 'Lower articulating bone acting as a third-class biomechanical lever arm pivoting around the joint axis.',
          whatIsIt: 'Lower articulating long bone.',
          whatDoesItDo: 'Pivots during flexion and extension when pulled by the inserting tendon.',
          animation: { type: 'oscillate', axis: 'z', speed: 2.0, amplitude: 0.35 },
        },
        {
          id: 'collateral-stabilizing-ligament',
          name: 'Collateral & Cruciate Stabilizing Ligaments (Bone-to-Bone)',
          label: 'Stabilizing Ligament (Bone-to-Bone)',
          shape: 'cylinder',
          dimensions: [0.09, 1.55],
          position: [-0.58, 0.05, 0],
          color: '#cbd5e1',
          material: 'tissue',
          description: 'Dense regular connective tissue bands bridging from the upper bone to the lower bone.',
          whatIsIt: 'Tough fibrous strap connecting bone to bone.',
          whatDoesItDo: 'Restricts excessive lateral or hyperextension motion to prevent joint dislocation.',
        },
        {
          id: 'antagonistic-flexor-muscle',
          name: 'Contractile Skeletal Flexor Muscle Belly (Biceps / Hamstring)',
          label: 'Skeletal Flexor Muscle',
          shape: 'capsule',
          dimensions: [0.36, 1.4],
          position: [0.75, 1.35, 0],
          color: '#e11d48',
          material: 'tissue',
          description: 'Striated voluntary skeletal muscle containing actin and myosin myofibrils that shorten using ATP.',
          whatIsIt: 'Active contractile muscle belly.',
          whatDoesItDo: 'Contracts to generate pulling tension that flexes the joint.',
          animation: { type: 'pulse', axis: 'y', speed: 2.0, amplitude: 0.12 },
        },
        {
          id: 'inelastic-insertion-tendon',
          name: 'Collagen Insertion Tendon (Muscle-to-Bone)',
          label: 'Insertion Tendon (Muscle-to-Bone)',
          shape: 'cylinder',
          dimensions: [0.08, 1.2],
          position: [0.55, -0.15, 0],
          rotation: [0, 0, 0.32],
          color: '#fef3c7',
          material: 'tissue',
          description: 'High-tensile-strength collagen cord anchoring the flexor muscle belly onto the distal bone tuberosity.',
          whatIsIt: 'Inelastic fibrous cord connecting muscle to bone.',
          whatDoesItDo: 'Transmits contractile muscle force across the joint fulcrum to rotate the distal bone.',
        },
      ],
      parameters: {
        flexionFrequency: {
          id: 'flexionFrequency',
          name: 'Muscle Contraction & Flexion Rate',
          min: 0.5,
          max: 4.0,
          step: 0.25,
          defaultValue: 2.0,
          unit: 'Hz',
          description: 'Controls the cyclic flexion-extension speed of the joint and muscle contraction.',
          affects: 'animationSpeed',
          scaleFactor: 1.0,
        },
        muscleHypertrophyScale: {
          id: 'muscleHypertrophyScale',
          name: 'Muscle Cross-Sectional Force Area',
          min: 0.75,
          max: 1.45,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Maximum muscle tetanic force scales with physiological cross-sectional area (PCSA).',
          affects: 'objectScale',
          targetPartId: 'antagonistic-flexor-muscle',
          scaleFactor: 1.0,
        },
        jointFlexionOffset: {
          id: 'jointFlexionOffset',
          name: 'Baseline Joint Flexion Angle',
          min: -25,
          max: 35,
          step: 5,
          defaultValue: 0,
          unit: '°',
          description: 'Adjusts the resting angular posture of the distal bone lever.',
          affects: 'objectRotation',
          targetPartId: 'distal-tibia-ulna-bone',
          scaleFactor: 0.015,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Transparent Synovial Capsule',
          type: 'boolean',
          defaultValue: true,
          description: 'Reveals the internal blue hyaline articular cartilage inside the synovial cavity.',
        },
      },
      equations: [
        'τ_muscle = F_tendon · d_⊥ = F_load · d_load (Biomechanical Class-3 Lever Torque Equilibrium)',
        'F_friction = μ · F_normal (Synovial Joint Coefficient of Friction μ ≈ 0.002)',
      ],
      curiosityPrompts: [
        'Why are almost all human joints (like the elbow and knee) Class 3 levers that sacrifice force advantage for speed and range of motion?',
        'What is the structural and functional difference between a ligament and a tendon?',
        'Why does torn articular cartilage heal much more slowly than a broken bone?',
      ],
    };
  }

  // 10. DYNAMIC CHEMICAL FORMULA / VSEPR MOLECULE SYNTHESIZER
  // Detects any explicit chemical formula like NH3, CH4, BF3, PCl5, SF6, H2SO4, HNO3, H3PO4, SO2, H2S, XeF4, etc.
  const formulaMatch = prompt.match(/\b([A-Z][a-z]?)(\d*)([A-Z][a-z]?)(\d*)\b/);
  const isMoleculePrompt =
    q.includes('molecule') ||
    q.includes('molecular') ||
    q.includes('vsepr') ||
    q.includes('ammonia') ||
    q.includes('methane') ||
    q.includes('sulfuric acid') ||
    q.includes('h2so4') ||
    q.includes('nitric acid') ||
    q.includes('hno3') ||
    q.includes('phosphoric acid') ||
    q.includes('h3po4') ||
    q.includes('sulfur hexafluoride') ||
    q.includes('phosphorus pentachloride') ||
    q.includes('boron trifluoride') ||
    Boolean(formulaMatch && ELEMENT_DATA[formulaMatch[1]] && ELEMENT_DATA[formulaMatch[3]]);

  if (isMoleculePrompt) {
    let centralSym = 'N';
    let terminalSym = 'H';
    let terminalCount = 3;
    let lonePairs = 1;
    let molName = 'Ammonia (NH₃)';
    let geomName = 'Trigonal Pyramidal (sp³, 107°)';

    if (q.includes('sulfuric acid') || q.includes('h2so4') || q.includes('sulfate')) {
      centralSym = 'S';
      terminalSym = 'O';
      terminalCount = 4;
      lonePairs = 0;
      molName = 'Sulfuric Acid (H₂SO₄)';
      geomName = 'Tetrahedral Sulfate Core (sp³, 109.5°)';
    } else if (q.includes('nitric acid') || q.includes('hno3') || q.includes('nitrate')) {
      centralSym = 'N';
      terminalSym = 'O';
      terminalCount = 3;
      lonePairs = 0;
      molName = 'Nitric Acid (HNO₃)';
      geomName = 'Trigonal Planar (sp², 120°)';
    } else if (q.includes('phosphoric acid') || q.includes('h3po4') || q.includes('phosphate')) {
      centralSym = 'P';
      terminalSym = 'O';
      terminalCount = 4;
      lonePairs = 0;
      molName = 'Phosphoric Acid (H₃PO₄)';
      geomName = 'Tetrahedral Phosphate Core (sp³, 109.5°)';
    } else if (q.includes('methane') || q.includes('ch4')) {
      centralSym = 'C';
      terminalSym = 'H';
      terminalCount = 4;
      lonePairs = 0;
      molName = 'Methane (CH₄)';
      geomName = 'Tetrahedral (sp³, 109.5°)';
    } else if (q.includes('ammonia') || q.includes('nh3')) {
      centralSym = 'N';
      terminalSym = 'H';
      terminalCount = 3;
      lonePairs = 1;
      molName = 'Ammonia (NH₃)';
      geomName = 'Trigonal Pyramidal (sp³, 107.0°)';
    } else if (q.includes('bf3') || q.includes('boron trifluoride')) {
      centralSym = 'B';
      terminalSym = 'F';
      terminalCount = 3;
      lonePairs = 0;
      molName = 'Boron Trifluoride (BF₃)';
      geomName = 'Trigonal Planar (sp², 120.0°)';
    } else if (q.includes('pcl5') || q.includes('pentachloride')) {
      centralSym = 'P';
      terminalSym = 'Cl';
      terminalCount = 5;
      lonePairs = 0;
      molName = 'Phosphorus Pentachloride (PCl₅)';
      geomName = 'Trigonal Bipyramidal (sp³d, 90° & 120°)';
    } else if (q.includes('sf6') || q.includes('hexafluoride')) {
      centralSym = 'S';
      terminalSym = 'F';
      terminalCount = 6;
      lonePairs = 0;
      molName = 'Sulfur Hexafluoride (SF₆)';
      geomName = 'Octahedral (sp³d², 90° & 180°)';
    } else if (formulaMatch && ELEMENT_DATA[formulaMatch[1]] && ELEMENT_DATA[formulaMatch[3]]) {
      centralSym = formulaMatch[1];
      terminalSym = formulaMatch[3];
      terminalCount = Math.max(1, Math.min(6, Number(formulaMatch[4] || 2)));
      lonePairs = terminalCount <= 2 ? 1 : 0;
      molName = `${centralSym}${formulaMatch[2] || ''}${terminalSym}${terminalCount} Molecule`;
      geomName =
        terminalCount === 2
          ? 'Bent / Angular VSEPR Geometry'
          : terminalCount === 3
            ? 'Trigonal VSEPR Geometry'
            : terminalCount === 4
              ? 'Tetrahedral VSEPR Geometry'
              : terminalCount === 5
                ? 'Trigonal Bipyramidal VSEPR Geometry'
                : 'Octahedral VSEPR Geometry';
    }

    const cElem = ELEMENT_DATA[centralSym] || ELEMENT_DATA.C;
    const tElem = ELEMENT_DATA[terminalSym] || ELEMENT_DATA.H;
    const bondLen = 1.85;

    const parts: ModelPartSpec[] = [
      {
        id: 'central-atom-nucleus',
        name: `Central ${cElem.name} Atom`,
        label: `Central ${centralSym} Atom`,
        shape: 'sphere',
        dimensions: [cElem.radius],
        position: [0, 0, 0],
        color: cElem.color,
        material: 'standard',
        description: `${cElem.role}. Coordinated to ${terminalCount} terminal ${terminalSym} atoms in ${geomName}.`,
        whatIsIt: `Central ${cElem.name} atom of ${molName}.`,
        whatDoesItDo: 'Determines the VSEPR steric number and 3D molecular bond angles.',
        animation: { type: 'pulse', axis: 'y', speed: 2.0, amplitude: 0.05 },
      },
    ];

    // Compute 3D terminal positions based on VSEPR coordination
    const termCoords: [number, number, number][] = [];
    if (terminalCount === 2) {
      const halfAngle = (52.25 * Math.PI) / 180;
      termCoords.push(
        [+(bondLen * Math.sin(halfAngle)).toFixed(2), -(bondLen * Math.cos(halfAngle)).toFixed(2), 0],
        [-(bondLen * Math.sin(halfAngle)).toFixed(2), -(bondLen * Math.cos(halfAngle)).toFixed(2), 0]
      );
    } else if (terminalCount === 3 && lonePairs > 0) {
      // Trigonal pyramidal
      for (let i = 0; i < 3; i++) {
        const phi = (i * 2 * Math.PI) / 3;
        termCoords.push([
          +(bondLen * 0.88 * Math.cos(phi)).toFixed(2),
          -0.65,
          +(bondLen * 0.88 * Math.sin(phi)).toFixed(2),
        ]);
      }
    } else if (terminalCount === 3) {
      // Trigonal planar
      for (let i = 0; i < 3; i++) {
        const phi = (i * 2 * Math.PI) / 3;
        termCoords.push([
          +(bondLen * Math.cos(phi)).toFixed(2),
          0,
          +(bondLen * Math.sin(phi)).toFixed(2),
        ]);
      }
    } else if (terminalCount === 4) {
      // Tetrahedral
      termCoords.push(
        [0, bondLen, 0],
        [+(bondLen * 0.94).toFixed(2), -0.62, 0],
        [-(bondLen * 0.47).toFixed(2), -0.62, +(bondLen * 0.81).toFixed(2)],
        [-(bondLen * 0.47).toFixed(2), -0.62, -(bondLen * 0.81).toFixed(2)]
      );
    } else if (terminalCount === 5) {
      // Trigonal bipyramidal
      termCoords.push([0, bondLen, 0], [0, -bondLen, 0]);
      for (let i = 0; i < 3; i++) {
        const phi = (i * 2 * Math.PI) / 3;
        termCoords.push([
          +(bondLen * Math.cos(phi)).toFixed(2),
          0,
          +(bondLen * Math.sin(phi)).toFixed(2),
        ]);
      }
    } else {
      // Octahedral (6)
      termCoords.push(
        [0, bondLen, 0],
        [0, -bondLen, 0],
        [bondLen, 0, 0],
        [-bondLen, 0, 0],
        [0, 0, bondLen],
        [0, 0, -bondLen]
      );
    }

    termCoords.forEach((pos, idx) => {
      parts.push({
        id: `terminal-atom-${idx + 1}`,
        name: `Terminal ${tElem.name} Atom #${idx + 1}`,
        label: `${terminalSym}${idx + 1}`,
        shape: 'sphere',
        dimensions: [tElem.radius],
        position: pos,
        color: tElem.color,
        material: 'standard',
        description: `Terminal ${tElem.name} atom covalently bonded to the central ${centralSym} atom.`,
        whatIsIt: `${tElem.name} atom at VSEPR vertex #${idx + 1}.`,
        whatDoesItDo: 'Repels adjacent bonding pairs to minimize electrostatic potential energy.',
      });

      parts.push(
        createBondPart(
          `covalent-bond-${idx + 1}`,
          `${centralSym}–${terminalSym} Covalent Bond #${idx + 1}`,
          [0, 0, 0],
          pos,
          0.11,
          '#94a3b8'
        )
      );
    });

    if (lonePairs > 0) {
      parts.push({
        id: 'nonbonding-lone-pair-lobe',
        name: 'Non-Bonding Lone Electron Pair Lobe',
        label: 'Lone Electron Pair (:)',
        shape: 'sphere',
        dimensions: [0.42],
        position: [0, 1.35, 0],
        color: '#facc15',
        material: 'glass',
        opacity: 0.65,
        description: 'Localized non-bonding valence electron pair occupying greater angular volume than bonding pairs (LP–BP > BP–BP repulsion).',
        whatIsIt: 'Unshared valence electron pair on the central atom.',
        whatDoesItDo: 'Compresses the bonding angles below the ideal tetrahedral angle (e.g., 109.5° → 107° in NH₃).',
        animation: { type: 'pulse', axis: 'y', speed: 2.5, amplitude: 0.1 },
      });
    }

    return {
      id: `custom-molecule-${centralSym.toLowerCase()}${terminalSym.toLowerCase()}${terminalCount}`,
      title: `3D VSEPR Molecular Explorer: ${molName}`,
      concept: `Valence Shell Electron Pair Repulsion (VSEPR), ${geomName} & Covalent Bonding`,
      description: `Interactive 3D molecular geometry model of ${molName} demonstrating ${geomName}, CPK atomic radii, localized covalent σ bonds, and electrostatic electron-domain repulsion.`,
      whatIsIt: `A 3D ball-and-stick and orbital representation of ${molName}.`,
      howDoesItWork:
        'According to VSEPR theory, valence electron domains (bonding pairs and non-bonding lone pairs) arrange themselves in 3D space as far apart as possible around the central atom to minimize electrostatic repulsion (LP–LP > LP–BP > BP–BP).',
      realLifeExample: 'Molecular shape determines boiling point, polarity, smell receptor binding, and greenhouse infrared absorption.',
      examConnection: `Steric Number SN = ${terminalCount} bonding pairs + ${lonePairs} lone pairs = ${terminalCount + lonePairs} (${geomName}).`,
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 2.8, 6.8], target: [0, 0, 0] },
      parts,
      parameters: {
        vibrationalFrequency: {
          id: 'vibrationalFrequency',
          name: 'Thermal Vibrational Frequency (IR)',
          min: 0.5,
          max: 4.5,
          step: 0.25,
          defaultValue: 2.0,
          unit: 'THz',
          description: 'Modulates the harmonic stretching and bending vibrational speed of the molecule.',
          affects: 'animationSpeed',
          scaleFactor: 1.0,
        },
        centralAtomScale: {
          id: 'centralAtomScale',
          name: 'Van der Waals / CPK Atomic Scale',
          min: 0.7,
          max: 1.6,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Transitions the central atom radius between ball-and-stick and space-filling CPK representation.',
          affects: 'objectScale',
          targetPartId: 'central-atom-nucleus',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Show Electron Lone Pair Lobes',
          type: 'boolean',
          defaultValue: true,
          description: 'Highlights non-bonding valence electron density around the central atom.',
        },
      },
      equations: [
        `Steric Number (SN) = ½ · (V + M − C + A) = ${terminalCount + lonePairs}`,
        'Repulsion Order: Lone Pair–Lone Pair > Lone Pair–Bond Pair > Bond Pair–Bond Pair',
      ],
      curiosityPrompts: [
        `Why does ${molName} adopt a ${geomName} geometry in 3D space?`,
        'Why do lone pairs compress bond angles more strongly than bonding electron pairs?',
        'How do the individual bond dipoles combine in 3D vector addition to determine whether the molecule is polar or nonpolar?',
      ],
    };
  }

  // 10A. HYDRAULIC PRESS (PASCAL'S PRINCIPLE & INDUSTRIAL COMPRESSION RIG)
  if (
    q.includes('hydraulic press') ||
    q.includes('bramah press') ||
    (q.includes('hydraulic') && q.includes('press'))
  ) {
    return {
      id: 'custom-hydraulic-press',
      title: 'Hydraulic Press & Pascal Force Multiplier',
      concept: "Fluid Statics, Pascal's Principle, Hydrostatic Pressure & Mechanical Advantage",
      subjectDomain: 'Physics',
      structuralArchetype: 'coupled-hydraulic-press',
      description:
        "Interactive 3D engineering model of an industrial Bramah hydraulic press featuring an interconnected hydraulic fluid manifold, small-bore master input cylinder and plunger piston (area A₁), manual pump lever arm, high-pressure check valve, large-bore slave ram cylinder and platen (area A₂), twin high-tensile press columns, upper reaction crosshead beam, and a deformable metal billet workpiece.",
      whatIsIt:
        "A mechanical compression machine that uses an incompressible fluid inside two interconnected cylinders of different cross-sectional areas to multiply an applied input force.",
      howDoesItWork:
        "By Pascal's Law, pressure applied to an enclosed incompressible fluid is transmitted undiminished throughout the fluid (P = F₁ / A₁ = F₂ / A₂). Pushing the small input plunger (area A₁) with force F₁ over a long stroke d₁ drives the large hydraulic ram (area A₂) upward with multiplied force F₂ = F₁ × (A₂ / A₁) over a correspondingly shorter stroke d₂ = d₁ × (A₁ / A₂), conserving mechanical work (W = F₁·d₁ = F₂·d₂).",
      realLifeExample:
        'Automotive body-panel stamping presses, forging presses, metal-recycling balers, and laboratory KBr pellet presses.',
      examConnection:
        'A hydraulic press multiplies force by the area ratio (MA = A₂ / A₁ = (r₂ / r₁)²), NOT energy! The distance moved by the large ram is reduced by the exact same ratio so ideal work input equals work output.',
      scaleNote:
        'Educational scale: cylinder walls are rendered in cutaway glass so internal hydraulic oil displacement and piston strokes are clearly visible.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 2.5, 8.8], target: [0, 0.2, 0] },
      parts: [
        {
          id: 'press-structural-base',
          name: 'Heavy Cast-Steel Press Bed & Foundation',
          label: 'Cast-Steel Press Bed',
          shape: 'box',
          dimensions: [6.2, 0.45, 2.8],
          position: [0, -2.25, 0],
          color: '#1e293b',
          material: 'metal',
          kinematicRole: 'fixed-anchor',
          connectedTo: ['fluid-connecting-manifold', 'input-master-cylinder', 'output-slave-cylinder', 'press-frame-pillars'],
          description: 'Massive structural baseplate supporting both hydraulic cylinders and the twin vertical tension columns.',
          whatIsIt: 'Rigid steel foundation bed of the hydraulic press.',
          whatDoesItDo: 'Absorbs compressive reaction loads and aligns the master and slave cylinders.',
        },
        {
          id: 'fluid-connecting-manifold',
          name: 'Interconnecting High-Pressure Hydraulic Manifold',
          label: 'Hydraulic Fluid Channel (P = F/A)',
          shape: 'box',
          dimensions: [3.8, 0.48, 1.1],
          position: [-0.25, -1.75, 0],
          color: '#0284c7',
          material: 'liquid',
          opacity: 0.85,
          connectedTo: ['input-master-cylinder', 'output-slave-cylinder'],
          description: 'Sealed horizontal fluid passage filled with incompressible hydraulic oil connecting Cylinder 1 to Cylinder 2.',
          whatIsIt: 'High-pressure hydraulic oil conduit.',
          whatDoesItDo: 'Transmits hydrostatic pressure P equally in all directions between the input plunger and output ram.',
        },
        {
          id: 'input-master-cylinder',
          name: 'Small-Bore Master Input Cylinder (Area A₁)',
          label: 'Input Cylinder (Area A₁)',
          shape: 'cylinder',
          dimensions: [0.48, 2.1],
          position: [-2.05, -0.85, 0],
          color: '#38bdf8',
          material: 'glass',
          opacity: 0.48,
          connectedTo: ['fluid-connecting-manifold', 'input-plunger-piston'],
          description: 'Narrow-diameter cylinder housing the input plunger where external force F₁ is applied.',
          whatIsIt: 'Small cross-sectional area cylinder (A₁).',
          whatDoesItDo: 'Generates high fluid pressure P = F₁ / A₁ from a modest input force.',
        },
        {
          id: 'input-plunger-piston',
          name: 'Master Input Plunger Piston & Rod (F₁)',
          label: 'Small Input Piston (F₁, d₁)',
          shape: 'cylinder',
          dimensions: [0.41, 1.55],
          position: [-2.05, 0.05, 0],
          color: '#f59e0b',
          material: 'metal',
          parentId: 'input-master-cylinder',
          kinematicRole: 'piston',
          connectedTo: ['input-master-cylinder', 'actuating-pump-lever'],
          description: 'Precision-machined steel plunger that travels downward through stroke d₁ to displace hydraulic oil into the manifold.',
          whatIsIt: 'Small-diameter input piston driven by force F₁.',
          whatDoesItDo: 'Pushes volume V = A₁·d₁ of hydraulic fluid into the slave cylinder.',
          animation: { type: 'oscillate', axis: 'y', speed: 1.8, amplitude: 0.45 },
        },
        {
          id: 'actuating-pump-lever',
          name: 'Ergonomic Input Force Lever Arm',
          label: 'Actuating Pump Lever',
          shape: 'cylinder',
          dimensions: [0.09, 2.0],
          position: [-2.45, 0.95, 0],
          rotation: [0, 0, 1.18],
          color: '#ef4444',
          material: 'metal',
          parentId: 'input-plunger-piston',
          connectedTo: ['input-plunger-piston'],
          description: 'Pivoting mechanical handle that applies downward force F₁ to the master input plunger.',
          whatIsIt: 'Manual or hydraulic actuator lever connected to the input plunger.',
          whatDoesItDo: 'Delivers the downward driving stroke to pressurize the hydraulic circuit.',
        },
        {
          id: 'output-slave-cylinder',
          name: 'Large-Bore Slave Ram Cylinder (Area A₂)',
          label: 'Large Ram Cylinder (Area A₂)',
          shape: 'cylinder',
          dimensions: [1.18, 2.2],
          position: [1.15, -0.8, 0],
          color: '#0ea5e9',
          material: 'glass',
          opacity: 0.48,
          connectedTo: ['fluid-connecting-manifold', 'output-hydraulic-ram'],
          description: 'Wide-diameter hydraulic cylinder of cross-sectional area A₂ = (A₂/A₁)·A₁.',
          whatIsIt: 'Large cross-sectional area slave cylinder (A₂).',
          whatDoesItDo: 'Converts hydrostatic pressure P into a massive upward force F₂ = P × A₂.',
        },
        {
          id: 'output-hydraulic-ram',
          name: 'Heavy-Duty Output Ram & Compression Platen (F₂)',
          label: 'Large Output Ram & Platen (F₂, d₂)',
          shape: 'cylinder',
          dimensions: [1.08, 1.45],
          position: [1.15, -0.1, 0],
          color: '#10b981',
          material: 'metal',
          parentId: 'output-slave-cylinder',
          kinematicRole: 'piston',
          connectedTo: ['output-slave-cylinder', 'workpiece-compression-billet'],
          description: 'Large-area hydraulic ram piston and flat platen that rises with multiplied force F₂ = F₁·(A₂/A₁) to crush or forge the workpiece.',
          whatIsIt: 'High-force output ram piston.',
          whatDoesItDo: 'Exerts multiplied upward compressive force against the workpiece and top crosshead.',
          animation: { type: 'oscillate', axis: 'y', speed: 1.8, amplitude: 0.14 },
        },
        {
          id: 'workpiece-compression-billet',
          name: 'Deformable Metal Billet Workpiece',
          label: 'Compressed Workpiece Specimen',
          shape: 'cylinder',
          dimensions: [0.68, 0.72],
          position: [1.15, 0.98, 0],
          color: '#f97316',
          material: 'copper',
          parentId: 'output-hydraulic-ram',
          connectedTo: ['output-hydraulic-ram', 'upper-reaction-crosshead'],
          description: 'Copper-alloy billet positioned between the rising hydraulic platen and the fixed upper reaction crosshead.',
          whatIsIt: 'Material specimen undergoing compressive forging.',
          whatDoesItDo: 'Demonstrates plastic compression under multiplied force F₂.',
        },
        {
          id: 'press-frame-pillars',
          name: 'Twin High-Tensile Steel Tie-Rod Columns',
          label: 'High-Tensile Frame Columns',
          shape: 'cylinder',
          dimensions: [0.16, 4.1],
          position: [1.15, 0.0, -1.05],
          color: '#94a3b8',
          material: 'metal',
          connectedTo: ['press-structural-base', 'upper-reaction-crosshead'],
          description: 'Vertical alloy-steel columns tying the press bed to the upper reaction crosshead.',
          whatIsIt: 'Structural tension columns of the press frame.',
          whatDoesItDo: 'Carries the equal and opposite tensile reaction load during high-tonnage pressing.',
        },
        {
          id: 'upper-reaction-crosshead',
          name: 'Upper Stationary Reaction Crosshead Beam',
          label: 'Upper Reaction Crosshead Anvil',
          shape: 'box',
          dimensions: [2.8, 0.42, 2.4],
          position: [1.15, 1.62, 0],
          color: '#334155',
          material: 'metal',
          kinematicRole: 'fixed-anchor',
          connectedTo: ['press-frame-pillars', 'workpiece-compression-billet'],
          description: 'Stationary upper anvil beam against which the rising hydraulic ram compresses the workpiece.',
          whatIsIt: 'Fixed top anvil crossbeam.',
          whatDoesItDo: 'Provides the downward normal reaction force equal to F₂ during compression.',
        },
      ],
      parameters: {
        inputForceN: {
          id: 'inputForceN',
          name: 'Applied Input Plunger Force (F₁)',
          min: 50,
          max: 500,
          step: 25,
          defaultValue: 200,
          unit: 'N',
          description: 'Downward force applied to the small master input piston.',
          affects: 'animationSpeed',
          scaleFactor: 0.008,
        },
        areaRatio: {
          id: 'areaRatio',
          name: 'Cylinder Area Ratio (A₂ / A₁)',
          min: 2,
          max: 20,
          step: 1,
          defaultValue: 10,
          unit: '×',
          description: 'Ratio of slave ram cross-sectional area A₂ to master plunger area A₁ (Mechanical Advantage).',
          affects: 'objectScale',
          targetPartId: 'output-hydraulic-ram',
          scaleFactor: 1.0,
        },
        plungerStrokePct: {
          id: 'plungerStrokePct',
          name: 'Input Plunger Stroke Compression',
          min: 0,
          max: 100,
          step: 5,
          defaultValue: 50,
          unit: '%',
          description: 'Directly depresses the input plunger (d₁) and raises the output ram by d₂ = d₁ / (A₂/A₁).',
          affects: 'objectPosition',
          targetPartId: 'input-plunger-piston',
          scaleFactor: 0.01,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Transparent Cylinder Cutaway',
          type: 'boolean',
          defaultValue: true,
          description: 'Shows internal hydraulic oil level and piston heads inside both cylinders.',
        },
      },
      equations: [
        'P = F₁ / A₁ = F₂ / A₂ (Pascal’s Hydrostatic Pressure Law)',
        'F₂ = F₁ × (A₂ / A₁) (Hydraulic Force Multiplication)',
        'W = F₁ · d₁ = F₂ · d₂  ⇒  d₂ = d₁ × (A₁ / A₂) (Conservation of Mechanical Work)',
      ],
      curiosityPrompts: [
        'If the large ram has 10 times the area of the small plunger, why does the large ram only move 1/10th the distance?',
        'Why must a hydraulic press use an incompressible liquid like oil instead of air?',
        'How does a hydraulic press obey Conservation of Energy while multiplying force tenfold?',
      ],
    };
  }

  // 10B. HUMAN KIDNEY NEPHRON (GLOMERULUS, BOWMAN'S CAPSULE, LOOP OF HENLE & COLLECTING DUCT)
  if (
    q.includes('nephron') ||
    q.includes('glomerul') ||
    q.includes('loop of henle') ||
    q.includes('bowman') ||
    (q.includes('kidney') && (q.includes('tubule') || q.includes('filtration') || q.includes('nephron')))
  ) {
    return {
      id: 'custom-kidney-nephron',
      title: 'Human Kidney Nephron: Ultrafiltration & Countercurrent Multiplier',
      concept: 'Renal Physiology, Glomerular Ultrafiltration, Tubular Reabsorption & Osmoregulation',
      subjectDomain: 'Anatomy',
      structuralArchetype: 'tubular-physiological-network',
      description:
        "Interactive 3D anatomical and physiological model of a functional human kidney nephron showing the wide afferent arteriole, high-pressure glomerular capillary tuft, cup-shaped Bowman's capsule, narrower efferent arteriole, proximal convoluted tubule (PCT), hairpin Loop of Henle (descending and thick ascending limbs), distal convoluted tubule (DCT), cortical-medullary collecting duct, and animated renal filtrate boluses.",
      whatIsIt:
        'The microscopic functional filtering unit of the human kidney (~1 million per kidney) that filters blood plasma and regulates water, electrolyte, and acid-base balance to form urine.',
      howDoesItWork:
        "Hydrostatic blood pressure in the glomerulus (P_GC ≈ 55 mmHg, created because the afferent arteriole is wider than the efferent arteriole) forces water, glucose, amino acids, ions, and urea across the filtration membrane into Bowman's capsule (ultrafiltration). The Proximal Convoluted Tubule reabsorbs 100% of glucose and ~67% of water/Na⁺; the Loop of Henle acts as a countercurrent multiplier to build a hyperosmotic medullary gradient (up to 1200 mOsm/L); and the Collecting Duct adjusts final water reabsorption under Antidiuretic Hormone (ADH) control.",
      realLifeExample:
        'Every 24 hours, human nephrons filter ~180 liters of blood plasma, reabsorbing ~99% so only ~1.5 liters of concentrated urine is excreted.',
      examConnection:
        'Ultrafiltration retains red blood cells and large plasma proteins (albumin) in the blood while filtering water, glucose, ions, and urea. Selective reabsorption in the PCT recovers 100% of glucose via Na⁺-glucose cotransporters.',
      scaleNote:
        "Educational scale: tubular segments and glomerular capillaries are magnified with a cutaway Bowman's capsule to trace the complete filtrate pathway.",
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 1.8, 9.2], target: [0, -0.2, 0] },
      parts: [
        {
          id: 'afferent-arteriole-vessel',
          name: 'Afferent Arteriole (High-Caliber Renal Inlet)',
          label: 'Afferent Arteriole (Inlet)',
          shape: 'cylinder',
          dimensions: [0.22, 1.45],
          position: [-3.15, 1.65, 0.25],
          rotation: [0, 0, Math.PI / 2],
          color: '#ef4444',
          material: 'tissue',
          connectedTo: ['glomerulus-capillary-tuft'],
          description: 'Wide-lumen arterial vessel supplying oxygenated, unfiltered blood under high hydrostatic pressure into the glomerulus.',
          whatIsIt: 'Incoming renal blood vessel with a wider diameter.',
          whatDoesItDo: 'Delivers blood at high hydrostatic pressure (~55 mmHg) to drive glomerular ultrafiltration.',
        },
        {
          id: 'glomerulus-capillary-tuft',
          name: 'Glomerulus Fenestrated Capillary Tuft',
          label: 'Glomerulus (Capillary Tuft)',
          shape: 'sphere',
          dimensions: [0.62],
          position: [-2.25, 1.45, 0],
          color: '#dc2626',
          material: 'tissue',
          connectedTo: ['afferent-arteriole-vessel', 'efferent-arteriole-vessel', 'bowmans-glomerular-capsule'],
          description: 'Dense ball of fenestrated capillaries inside Bowman’s capsule where blood plasma is pressure-filtered across basement membranes and podocyte foot processes.',
          whatIsIt: 'High-pressure capillary knot that filters blood plasma.',
          whatDoesItDo: 'Forces water, ions, glucose, and urea out of the blood while retaining cells and large proteins.',
          animation: { type: 'pulse', axis: 'y', speed: 2.4, amplitude: 0.08 },
        },
        {
          id: 'efferent-arteriole-vessel',
          name: 'Efferent Arteriole (Narrow-Lumen Outlet & Vasa Recta Feed)',
          label: 'Efferent Arteriole (Narrow Outlet)',
          shape: 'cylinder',
          dimensions: [0.13, 1.55],
          position: [-2.95, 0.88, 0.35],
          rotation: [0, 0, 1.15],
          color: '#b91c1c',
          material: 'tissue',
          connectedTo: ['glomerulus-capillary-tuft', 'peritubular-capillary-plexus'],
          description: 'Narrower-lumen arteriole draining filtered blood from the glomerulus into the peritubular capillaries and vasa recta.',
          whatIsIt: 'Outgoing arteriole with a narrower diameter than the afferent arteriole.',
          whatDoesItDo: 'Creates upstream back-pressure inside the glomerulus to sustain ultrafiltration.',
        },
        {
          id: 'bowmans-glomerular-capsule',
          name: "Bowman's Capsule (Renal Corpuscle Cup)",
          label: "Bowman's Capsule (Filtration Cup)",
          shape: 'sphere',
          dimensions: [0.88],
          position: [-2.25, 1.45, 0],
          color: '#fde047',
          material: 'glass',
          opacity: 0.45,
          connectedTo: ['glomerulus-capillary-tuft', 'proximal-convoluted-tubule'],
          description: 'Double-walled epithelial cup lined with podocytes that surrounds the glomerulus and collects raw glomerular filtrate.',
          whatIsIt: 'Cup-like sac enclosing the glomerulus in the renal cortex.',
          whatDoesItDo: 'Captures cell-free, protein-free glomerular filtrate and funnels it into the proximal tubule.',
        },
        {
          id: 'proximal-convoluted-tubule',
          name: 'Proximal Convoluted Tubule (PCT — Cortical Reabsorption)',
          label: 'Proximal Convoluted Tubule (PCT)',
          shape: 'torus',
          dimensions: [0.78, 0.2],
          position: [-1.15, 1.45, 0],
          rotation: [0.35, 0.2, 0],
          color: '#f59e0b',
          material: 'tissue',
          connectedTo: ['bowmans-glomerular-capsule', 'loop-of-henle-descending'],
          description: 'Coiled cortical tubule lined with brush-border microvilli and mitochondria-rich cuboidal epithelium.',
          whatIsIt: 'First coiled tubular segment after Bowman’s capsule.',
          whatDoesItDo: 'Selectively reabsorbs 100% of filtered glucose and amino acids plus ~67% of water, Na⁺, and Cl⁻ back into the blood.',
        },
        {
          id: 'loop-of-henle-descending',
          name: 'Loop of Henle — Thin Descending Limb (Water Permeable)',
          label: 'Descending Loop of Henle (H₂O Exit)',
          shape: 'cylinder',
          dimensions: [0.13, 2.75],
          position: [-0.65, -0.25, 0],
          color: '#38bdf8',
          material: 'tissue',
          connectedTo: ['proximal-convoluted-tubule', 'loop-of-henle-ascending'],
          description: 'Thin descending segment plunging deep into the salty renal medulla; highly permeable to water via aquaporin-1 channels but impermeable to solutes.',
          whatIsIt: 'Downward-plunging medullary limb of the Loop of Henle.',
          whatDoesItDo: 'Allows water to leave the filtrate by osmosis into the hypertonic medulla, concentrating the tubular fluid.',
        },
        {
          id: 'loop-of-henle-ascending',
          name: 'Loop of Henle — Thick Ascending Limb (Active Na⁺/K⁺/2Cl⁻ Pump)',
          label: 'Ascending Loop of Henle (NaCl Pump)',
          shape: 'cylinder',
          dimensions: [0.18, 2.75],
          position: [0.25, -0.25, 0],
          color: '#fbbf24',
          material: 'tissue',
          connectedTo: ['loop-of-henle-descending', 'distal-convoluted-tubule'],
          description: 'Water-impermeable ascending limb that actively pumps Na⁺, K⁺, and Cl⁻ ions out into the medullary interstitium.',
          whatIsIt: 'Upward-returning thick limb of the Loop of Henle.',
          whatDoesItDo: 'Establishes the hyperosmotic medullary gradient (countercurrent multiplication) while diluting the ascending tubular fluid.',
        },
        {
          id: 'distal-convoluted-tubule',
          name: 'Distal Convoluted Tubule (DCT — Aldosterone / pH Fine-Tuning)',
          label: 'Distal Convoluted Tubule (DCT)',
          shape: 'torus',
          dimensions: [0.68, 0.18],
          position: [1.05, 1.38, 0],
          rotation: [-0.35, 0.2, 0],
          color: '#a855f7',
          material: 'tissue',
          connectedTo: ['loop-of-henle-ascending', 'medullary-collecting-duct'],
          description: 'Cortical segment regulated by aldosterone and parathyroid hormone (PTH) for fine-tuning Na⁺, K⁺, Ca²⁺, and H⁺ secretion.',
          whatIsIt: 'Second coiled tubule in the renal cortex.',
          whatDoesItDo: 'Performs hormone-controlled fine adjustment of blood salt and pH levels.',
        },
        {
          id: 'medullary-collecting-duct',
          name: 'Cortical & Medullary Collecting Duct (ADH Regulated)',
          label: 'Collecting Duct (ADH Water Control)',
          shape: 'cylinder',
          dimensions: [0.26, 3.45],
          position: [2.15, -0.05, 0],
          color: '#eab308',
          material: 'tissue',
          connectedTo: ['distal-convoluted-tubule'],
          description: 'Vertical duct descending through the cortex and medulla to the renal pelvis; inserts Aquaporin-2 water channels in response to ADH (vasopressin).',
          whatIsIt: 'Final urine-concentrating duct shared by several nephrons.',
          whatDoesItDo: 'Determines final urine volume and concentration depending on body hydration and ADH hormone levels.',
        },
        {
          id: 'peritubular-capillary-plexus',
          name: 'Peritubular Capillaries & Vasa Recta Countercurrent Exchanger',
          label: 'Vasa Recta & Peritubular Capillaries',
          shape: 'cylinder',
          dimensions: [0.09, 2.55],
          position: [-0.2, -0.3, -0.35],
          color: '#3b82f6',
          material: 'tissue',
          connectedTo: ['efferent-arteriole-vessel'],
          description: 'Hairpin microvascular network running parallel to the Loop of Henle that reabsorbs water and solutes back into systemic venous blood.',
          whatIsIt: 'Blood capillary network wrapping around the nephron tubules.',
          whatDoesItDo: 'Returns reabsorbed water, glucose, and electrolytes to the bloodstream without washing out the medullary osmotic gradient.',
        },
        {
          id: 'filtrate-transport-bolus',
          name: 'Active Tubular Filtrate & Solute Bolus',
          label: 'Tubular Filtrate Flow (GFR)',
          shape: 'sphere',
          dimensions: [0.24],
          position: [-0.2, -1.55, 0.18],
          color: '#38bdf8',
          material: 'glow',
          connectedTo: ['loop-of-henle-descending', 'loop-of-henle-ascending'],
          description: 'Dynamic indicator of tubular fluid moving from Bowman’s capsule through the Loop of Henle toward the collecting duct.',
          whatIsIt: 'Flowing renal filtrate inside the nephron lumen.',
          whatDoesItDo: 'Visualizes the Glomerular Filtration Rate (GFR) and tubular transport velocity.',
          animation: { type: 'oscillate', axis: 'y', speed: 2.2, amplitude: 0.85 },
        },
      ],
      parameters: {
        glomerularPressureMmHg: {
          id: 'glomerularPressureMmHg',
          name: 'Glomerular Hydrostatic Pressure (P_GC)',
          min: 40,
          max: 75,
          step: 1,
          defaultValue: 55,
          unit: 'mmHg',
          description: 'Capillary blood pressure inside the glomerulus driving Net Filtration Pressure (NFP) and GFR.',
          affects: 'animationSpeed',
          scaleFactor: 0.04,
        },
        medullaryGradientMOsM: {
          id: 'medullaryGradientMOsM',
          name: 'Medullary Osmotic Gradient (Loop of Henle)',
          min: 300,
          max: 1200,
          step: 50,
          defaultValue: 900,
          unit: 'mOsm/L',
          description: 'Interstitial osmolarity established by active NaCl pumping in the thick ascending limb.',
          affects: 'objectScale',
          targetPartId: 'loop-of-henle-ascending',
          scaleFactor: 1.0,
        },
        adhHormoneLevelPct: {
          id: 'adhHormoneLevelPct',
          name: 'ADH (Vasopressin) Hormone Level',
          min: 10,
          max: 100,
          step: 5,
          defaultValue: 60,
          unit: '%',
          description: 'Controls Aquaporin-2 water channel permeability in the Collecting Duct, concentrating urine.',
          affects: 'objectScale',
          targetPartId: 'medullary-collecting-duct',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: "Cutaway Bowman's Capsule View",
          type: 'boolean',
          defaultValue: true,
          description: "Makes Bowman's capsule semi-transparent to expose the internal glomerular capillary tuft.",
        },
      },
      equations: [
        'NFP = P_GC − P_BC − π_GC ≈ 55 − 15 − 30 = 10 mmHg (Net Filtration Pressure)',
        'GFR = K_f × NFP ≈ 125 mL/min (Glomerular Filtration Rate)',
        'Clearance C_x = (U_x · V) / P_x (Renal Plasma Clearance Equation)',
      ],
      curiosityPrompts: [
        'Why is the afferent arteriole wider than the efferent arteriole, and how does this help filtration?',
        'Why does glucose appear in the glomerular filtrate inside Bowman’s capsule but NOT in healthy urine?',
        'How do desert mammals use extra-long Loops of Henle to survive without drinking water?',
      ],
    };
  }

  // 10C. JET ENGINE CUTAWAY / HIGH-BYPASS TURBOFAN ENGINE
  if (
    q.includes('jet engine') ||
    q.includes('turbofan') ||
    q.includes('turbojet') ||
    q.includes('gas turbine')
  ) {
    return {
      id: 'custom-jet-engine-cutaway',
      title: 'Jet Engine Cutaway: Axial Turbofan & Brayton Cycle Propulsion',
      concept: "Thermodynamics (Brayton Cycle), Axial Compressors, Combustion & Newton's Third Law Thrust",
      subjectDomain: 'Physics',
      structuralArchetype: 'axial-turbomachinery-cutaway',
      description:
        'Interactive 3D aerospace engineering cutaway of an axial-flow turbofan jet engine ("Suck, Squeeze, Bang, Blow") featuring the aerodynamic intake nacelle cowl, titanium front bypass fan stage, multi-stage low-pressure and high-pressure axial compressors, annular fuel-air combustion chamber, high-pressure and low-pressure axial turbine stages, concentric twin-spool drive shaft, convergent exhaust nozzle, and supersonic Mach exhaust plume.',
      whatIsIt:
        'An air-breathing reaction heat engine that generates forward thrust by accelerating a large mass of air and hot combustion gas rearward at high velocity.',
      howDoesItWork:
        "Operating on the open Brayton thermodynamic cycle: (1) Intake & Fan draw in ambient air and split it into bypass and core streams; (2) Axial Compressor stages adiabatically compress core air to 30–40× atmospheric pressure; (3) Isobaric Combustor injects aviation kerosene (Jet-A) and burns it continuously at ~1,700 °C; (4) Axial Turbine extracts just enough shaft work from the expanding gas to drive the front compressor and fan via the concentric spool shaft; (5) Exhaust Nozzle accelerates the remaining high-enthalpy gas rearward, producing forward thrust F = ṁ·(v_exit − v_0).",
      realLifeExample:
        'GE9X, Rolls-Royce Trent XWB, and Pratt & Whitney turbofan engines powering commercial airliners.',
      examConnection:
        "Jet propulsion operates by Conservation of Linear Momentum and Newton's Third Law: accelerating mass flow ṁ rearward from velocity v₀ to v_e produces forward reaction thrust F = ṁ·(v_e − v₀).",
      scaleNote:
        'Educational scale: outer nacelle cowling is rendered as a translucent cutaway shell so all internal axial rotor stages and the annular combustor can be inspected.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0.5, 2.6, 8.8], target: [0, 0, 0] },
      parts: [
        {
          id: 'intake-nacelle-cowling',
          name: 'Aerodynamic Intake Lip & Cutaway Nacelle Casing',
          label: 'Cutaway Engine Nacelle Cowl',
          shape: 'cylinder',
          dimensions: [1.55, 5.6],
          position: [-0.2, 0.1, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#94a3b8',
          material: 'glass',
          opacity: 0.32,
          connectedTo: ['titanium-turbofan-rotor', 'exhaust-convergent-nozzle'],
          description: 'Streamlined outer nacelle housing and bypass duct rendered in cutaway view to expose the internal core stages.',
          whatIsIt: 'Outer aerodynamic engine housing and bypass air duct.',
          whatDoesItDo: 'Guides freestream air smoothly into the fan while enclosing the bypass flow channel.',
        },
        {
          id: 'concentric-twin-spool-shaft',
          name: 'Concentric N₁/N₂ Twin-Spool Main Drive Shaft',
          label: 'Concentric Twin-Spool Shaft',
          shape: 'cylinder',
          dimensions: [0.2, 5.4],
          position: [-0.1, 0.1, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#e2e8f0',
          material: 'metal',
          kinematicRole: 'rotor',
          connectedTo: [
            'titanium-turbofan-rotor',
            'low-pressure-axial-compressor',
            'high-pressure-axial-compressor',
            'high-pressure-axial-turbine',
            'low-pressure-axial-turbine',
          ],
          description: 'High-strength superalloy coaxial drive shaft mechanically coupling the rear turbine stages to the front compressor and fan stages.',
          whatIsIt: 'Central rotating axle running the length of the jet engine.',
          whatDoesItDo: 'Transfers megawatts of mechanical shaft power from the hot rear turbines to spin the front compressors and fan.',
          animation: { type: 'spin', axis: 'x', speed: 4.5, amplitude: 0.1 },
        },
        {
          id: 'titanium-turbofan-rotor',
          name: 'Front Titanium Wide-Chord Turbofan Stage (N₁)',
          label: 'Front Titanium Fan Stage',
          shape: 'cylinder',
          dimensions: [1.42, 0.38],
          position: [-2.65, 0.1, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#38bdf8',
          material: 'metal',
          parentId: 'concentric-twin-spool-shaft',
          kinematicRole: 'rotor',
          connectedTo: ['concentric-twin-spool-shaft', 'low-pressure-axial-compressor'],
          description: 'Large-diameter front fan with twisted titanium-carbon blades that accelerates both core air and high-volume bypass air.',
          whatIsIt: 'Primary front intake fan of a modern turbofan engine.',
          whatDoesItDo: 'Produces up to 75–80% of total takeoff thrust by accelerating a massive volume of cool bypass air around the core.',
          animation: { type: 'spin', axis: 'x', speed: 3.8, amplitude: 0.1 },
        },
        {
          id: 'low-pressure-axial-compressor',
          name: 'Low-Pressure Axial Compressor (LPC Booster Stages)',
          label: 'Low-Pressure Compressor (LPC)',
          shape: 'cylinder',
          dimensions: [1.05, 0.78],
          position: [-1.75, 0.1, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#0284c7',
          material: 'metal',
          parentId: 'concentric-twin-spool-shaft',
          kinematicRole: 'rotor',
          connectedTo: ['titanium-turbofan-rotor', 'high-pressure-axial-compressor'],
          description: 'Alternating rows of rotating rotor blades and stationary stator vanes that initiate core air compression.',
          whatIsIt: 'First multi-stage axial air compressor.',
          whatDoesItDo: 'Decelerates and compresses incoming core air before it enters the high-pressure spool.',
          animation: { type: 'spin', axis: 'x', speed: 4.2, amplitude: 0.1 },
        },
        {
          id: 'high-pressure-axial-compressor',
          name: 'High-Pressure Axial Compressor (HPC Core Stages)',
          label: 'High-Pressure Compressor (HPC)',
          shape: 'cylinder',
          dimensions: [0.85, 0.85],
          position: [-0.8, 0.1, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#0369a1',
          material: 'metal',
          parentId: 'concentric-twin-spool-shaft',
          kinematicRole: 'rotor',
          connectedTo: ['low-pressure-axial-compressor', 'annular-combustion-chamber'],
          description: 'High-speed N₂ axial compressor squeezing air to 30–45 bar and raising its temperature to ~600 °C prior to fuel injection.',
          whatIsIt: 'High-pressure core compression stage ("Squeeze").',
          whatDoesItDo: 'Maximizes air density and pressure so combustion releases maximum thermal work (Brayton efficiency).',
          animation: { type: 'spin', axis: 'x', speed: 6.0, amplitude: 0.1 },
        },
        {
          id: 'annular-combustion-chamber',
          name: 'Annular Combustor & Fuel Atomizer Ring ("Bang")',
          label: 'Annular Combustion Chamber',
          shape: 'torus',
          dimensions: [0.68, 0.28],
          position: [0.2, 0.1, 0],
          rotation: [0, Math.PI / 2, 0],
          color: '#f97316',
          material: 'glow',
          connectedTo: ['high-pressure-axial-compressor', 'high-pressure-axial-turbine'],
          description: 'High-temperature nickel-superalloy annular burner ring where atomized aviation kerosene mixes with compressed air and burns continuously at ~1,700 °C.',
          whatIsIt: 'Isobaric constant-pressure combustion chamber.',
          whatDoesItDo: 'Adds massive chemical heat energy Q_in to the compressed airflow, causing rapid gas expansion.',
          animation: { type: 'pulse', axis: 'x', speed: 3.5, amplitude: 0.1 },
        },
        {
          id: 'high-pressure-axial-turbine',
          name: 'High-Pressure Single-Crystal Turbine Stage (HPT)',
          label: 'High-Pressure Turbine (HPT)',
          shape: 'cylinder',
          dimensions: [0.86, 0.45],
          position: [1.05, 0.1, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#dc2626',
          material: 'copper',
          parentId: 'concentric-twin-spool-shaft',
          kinematicRole: 'rotor',
          connectedTo: ['annular-combustion-chamber', 'low-pressure-axial-turbine', 'concentric-twin-spool-shaft'],
          description: 'Film-cooled single-crystal superalloy turbine blades spun by the 1,700 °C gas exiting the combustor.',
          whatIsIt: 'Primary high-temperature turbine stage.',
          whatDoesItDo: 'Extracts rotational work from the expanding hot gas to drive the High-Pressure Compressor on the N₂ spool.',
          animation: { type: 'spin', axis: 'x', speed: 6.0, amplitude: 0.1 },
        },
        {
          id: 'low-pressure-axial-turbine',
          name: 'Low-Pressure Multi-Stage Axial Turbine (LPT)',
          label: 'Low-Pressure Turbine (LPT)',
          shape: 'cylinder',
          dimensions: [1.02, 0.65],
          position: [1.75, 0.1, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#ea580c',
          material: 'copper',
          parentId: 'concentric-twin-spool-shaft',
          kinematicRole: 'rotor',
          connectedTo: ['high-pressure-axial-turbine', 'exhaust-convergent-nozzle', 'concentric-twin-spool-shaft'],
          description: 'Downstream turbine stage that extracts torque to drive the large front titanium turbofan and low-pressure compressor.',
          whatIsIt: 'Secondary expansion turbine stage on the N₁ inner shaft.',
          whatDoesItDo: 'Powers the front turbofan stage while dropping gas pressure and temperature toward the nozzle.',
          animation: { type: 'spin', axis: 'x', speed: 3.8, amplitude: 0.1 },
        },
        {
          id: 'exhaust-convergent-nozzle',
          name: 'Convergent Exhaust Nozzle & Acoustic Mixer ("Blow")',
          label: 'Convergent Exhaust Nozzle',
          shape: 'cone',
          dimensions: [0.95, 1.15],
          position: [2.65, 0.1, 0],
          rotation: [0, 0, -Math.PI / 2],
          color: '#475569',
          material: 'metal',
          connectedTo: ['low-pressure-axial-turbine', 'mach-exhaust-plume'],
          description: 'Tapered exhaust duct that constricts the flow area to convert remaining gas pressure and enthalpy into high-velocity kinetic jet exhaust.',
          whatIsIt: 'Rear propelling nozzle of the jet engine.',
          whatDoesItDo: 'Accelerates hot exhaust gas to high subsonic or supersonic exit velocity v_exit to generate reaction thrust.',
        },
        {
          id: 'mach-exhaust-plume',
          name: 'High-Velocity Thermal Exhaust Plume & Mach Cone',
          label: 'High-Velocity Exhaust Jet (v_exit)',
          shape: 'cone',
          dimensions: [0.68, 1.85],
          position: [3.85, 0.1, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#38bdf8',
          material: 'glow',
          opacity: 0.75,
          connectedTo: ['exhaust-convergent-nozzle'],
          description: 'High-momentum exhaust gas stream exiting the nozzle, producing equal and opposite forward thrust on the aircraft.',
          whatIsIt: 'High-speed rear exhaust jet plume.',
          whatDoesItDo: 'Carries rearward momentum flux ṁ·v_exit, propelling the engine forward.',
          animation: { type: 'pulse', axis: 'x', speed: 4.5, amplitude: 0.16 },
        },
      ],
      parameters: {
        throttleRpmPct: {
          id: 'throttleRpmPct',
          name: 'Engine Spool Throttle (N₁ / N₂ RPM)',
          min: 20,
          max: 100,
          step: 5,
          defaultValue: 75,
          unit: '%',
          description: 'Controls fuel flow, spool rotational speed, mass airflow rate ṁ, and net thrust.',
          affects: 'animationSpeed',
          scaleFactor: 0.04,
        },
        pressureRatioOpr: {
          id: 'pressureRatioOpr',
          name: 'Overall Compressor Pressure Ratio (r_p)',
          min: 10,
          max: 45,
          step: 1,
          defaultValue: 32,
          unit: ':1',
          description: 'Ratio of combustor stagnation pressure to intake pressure; governs Brayton thermal efficiency.',
          affects: 'objectScale',
          targetPartId: 'annular-combustion-chamber',
          scaleFactor: 1.0,
        },
        bypassRatioBpr: {
          id: 'bypassRatioBpr',
          name: 'Turbofan Bypass Ratio (ṁ_bypass / ṁ_core)',
          min: 1,
          max: 10,
          step: 0.5,
          defaultValue: 8.0,
          unit: ':1',
          description: 'Ratio of air bypassing the core to air passing through the combustor; increases propulsive efficiency.',
          affects: 'objectScale',
          targetPartId: 'titanium-turbofan-rotor',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Cutaway Nacelle Casing',
          type: 'boolean',
          defaultValue: true,
          description: 'Makes the outer nacelle cowling translucent to expose the internal compressor, combustor, and turbine stages.',
        },
      },
      equations: [
        'F_thrust = ṁ_core·(v_e − v₀) + ṁ_bypass·(v_f − v₀) + (P_e − P₀)·A_e (Turbofan Net Thrust Equation)',
        'η_Brayton = 1 − 1 / r_p^((γ − 1)/γ) (Ideal Brayton Cycle Thermal Efficiency, γ = 1.4)',
      ],
      curiosityPrompts: [
        'What do the four stages "Suck, Squeeze, Bang, Blow" correspond to inside a jet engine?',
        'Why do modern airliners use wide high-bypass turbofan engines instead of narrow turbojets?',
        'How can single-crystal turbine blades survive inside gas that is hotter than the melting point of the metal itself?',
      ],
    };
  }

  // 10D. MULTI-AXIS INDUSTRIAL ROBOTIC ARM (6-DOF ARTICULATED KINEMATIC MANIPULATOR)
  if (
    q.includes('robotic arm') ||
    q.includes('robot arm') ||
    q.includes('manipulator') ||
    (q.includes('robot') && (q.includes('joint') || q.includes('gripper') || q.includes('axis') || q.includes('dof')))
  ) {
    return {
      id: 'custom-robotic-arm-manipulator',
      title: 'Multi-Axis Industrial Robotic Arm & Forward Kinematics',
      concept: 'Robotics, Serial Kinematic Chains, Servo Joint Actuation, Forward Kinematics & Torque',
      subjectDomain: 'Physics',
      structuralArchetype: 'articulated-kinematic-chain',
      description:
        'Interactive 3D robotics and mechanical engineering model of an articulated multi-axis industrial manipulator featuring a bolted floor pedestal, rotating waist azimuth turret (Joint J₁), high-torque shoulder pitch servo actuator (Joint J₂), rigid humeral lower-arm link (L₁), elbow pitch rotary actuator (Joint J₃), forearm link (L₂), spherical wrist roll/pitch assembly (Joint J₄/J₅), parallel pneumatic end-effector gripper jaws, and a target precision workpiece.',
      whatIsIt:
        'A programmable serial kinematic chain of rigid links connected by motorized revolute (rotary) joints that positions and orientates an end-effector tool in 3D workspace.',
      howDoesItWork:
        'Brushless servo motors equipped with harmonic-drive gearboxes and optical encoders control each joint angle (θ₁ waist azimuth, θ₂ shoulder pitch, θ₃ elbow pitch, and wrist orientation). By Forward Kinematics (Denavit–Hartenberg transformation matrices), the 3D position (X, Y, Z) of the end-effector gripper is uniquely determined by the cumulative trigonometric sum of the link lengths and joint angles, while each joint motor must supply torque τ = r × F to counterbalance gravity and payload inertia.',
      realLifeExample:
        'FANUC, KUKA, and ABB 6-axis industrial robotic arms used in automotive spot-welding, semiconductor wafer handling, and surgical robotics.',
      examConnection:
        'Theshoulder joint (J₂) experiences the largest gravitational holding torque τ = m·g·d_⊥ because it supports the combined weight and moment arms of all distal links, actuators, and the payload.',
      scaleNote:
        'Educational scale: revolute joint housings and pneumatic gripper jaws are color-coded so each degree of freedom (DOF) can be tracked independently.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [3.2, 2.8, 8.2], target: [0.4, 0.4, 0] },
      parts: [
        {
          id: 'robot-anchoring-pedestal',
          name: 'Heavy Cast-Iron Floor Mounting Base',
          label: 'Anchored Base Pedestal',
          shape: 'cylinder',
          dimensions: [1.35, 0.42],
          position: [-0.8, -2.15, 0],
          color: '#1e293b',
          material: 'metal',
          kinematicRole: 'fixed-anchor',
          connectedTo: ['waist-azimuth-turret-j1'],
          description: 'Bolted structural foundation plate anchoring the robotic manipulator against overturning reaction moments.',
          whatIsIt: 'Fixed world-coordinate origin base (Frame 0).',
          whatDoesItDo: 'Transfers static weight and dynamic reaction torques into the factory floor.',
        },
        {
          id: 'waist-azimuth-turret-j1',
          name: 'Joint 1 (J₁): Rotating Waist Azimuth Turret (θ₁)',
          label: 'Waist Turret Joint J₁ (θ₁)',
          shape: 'cylinder',
          dimensions: [0.85, 0.72],
          position: [-0.8, -1.58, 0],
          color: '#f59e0b',
          material: 'metal',
          parentId: 'robot-anchoring-pedestal',
          kinematicRole: 'pivot-joint',
          connectedTo: ['robot-anchoring-pedestal', 'shoulder-servo-joint-j2'],
          description: 'Vertical-axis rotary turntable driven by Servo 1, sweeping the entire arm horizontally through azimuth angle θ₁.',
          whatIsIt: 'First revolute degree of freedom (vertical yaw axis).',
          whatDoesItDo: 'Rotates the manipulator plane across the horizontal XY floor workspace.',
        },
        {
          id: 'shoulder-servo-joint-j2',
          name: 'Joint 2 (J₂): High-Torque Shoulder Pitch Actuator (θ₂)',
          label: 'Shoulder Pitch Servo J₂ (θ₂)',
          shape: 'cylinder',
          dimensions: [0.46, 0.88],
          position: [-0.8, -1.0, 0],
          rotation: [Math.PI / 2, 0, 0],
          color: '#0284c7',
          material: 'metal',
          parentId: 'waist-azimuth-turret-j1',
          kinematicRole: 'pivot-joint',
          connectedTo: ['waist-azimuth-turret-j1', 'lower-humeral-link-l1'],
          description: 'Horizontal-axis harmonic-drive servo actuator that elevates and lowers the primary structural arm link L₁.',
          whatIsIt: 'Second revolute degree of freedom (shoulder pitch axis).',
          whatDoesItDo: 'Supplies peak gravitational holding torque τ₂ to lift the entire arm and payload.',
        },
        {
          id: 'lower-humeral-link-l1',
          name: 'Primary Structural Arm Link 1 (Length L₁ = 1.9 m)',
          label: 'Lower Arm Link L₁',
          shape: 'box',
          dimensions: [0.36, 1.9, 0.36],
          position: [-0.52, -0.1, 0],
          rotation: [0, 0, -0.32],
          color: '#f97316',
          material: 'metal',
          parentId: 'shoulder-servo-joint-j2',
          kinematicRole: 'upper-link',
          connectedTo: ['shoulder-servo-joint-j2', 'elbow-servo-joint-j3'],
          description: 'Hollow cast-aluminum structural beam connecting the shoulder actuator J₂ to the elbow actuator J₃.',
          whatIsIt: 'Primary proximal kinematic link (L₁).',
          whatDoesItDo: 'Establishes the vertical reach and radial extension of the elbow joint.',
        },
        {
          id: 'elbow-servo-joint-j3',
          name: 'Joint 3 (J₃): Articulated Elbow Pitch Actuator (θ₃)',
          label: 'Elbow Pitch Servo J₃ (θ₃)',
          shape: 'cylinder',
          dimensions: [0.38, 0.74],
          position: [-0.22, 0.8, 0],
          rotation: [Math.PI / 2, 0, 0],
          color: '#0284c7',
          material: 'metal',
          parentId: 'lower-humeral-link-l1',
          kinematicRole: 'lower-joint',
          connectedTo: ['lower-humeral-link-l1', 'upper-forearm-link-l2'],
          description: 'Intermediate rotary servo joint bending the forearm link L₂ relative to the lower arm link L₁.',
          whatIsIt: 'Third revolute degree of freedom (elbow flexion/extension axis).',
          whatDoesItDo: 'Controls radial reach and vertical height of the wrist and end-effector.',
        },
        {
          id: 'upper-forearm-link-l2',
          name: 'Secondary Forearm Structural Link 2 (Length L₂ = 1.65 m)',
          label: 'Forearm Link L₂',
          shape: 'cylinder',
          dimensions: [0.18, 1.65],
          position: [0.55, 0.95, 0],
          rotation: [0, 0, -1.35],
          color: '#fb923c',
          material: 'metal',
          parentId: 'elbow-servo-joint-j3',
          kinematicRole: 'lower-link',
          connectedTo: ['elbow-servo-joint-j3', 'wrist-roll-pitch-unit-j4'],
          description: 'Lightweight tubular forearm link extending from the elbow joint J₃ to the spherical wrist unit.',
          whatIsIt: 'Distal kinematic arm link (L₂).',
          whatDoesItDo: 'Positions the spherical wrist over the target pick-and-place coordinates.',
        },
        {
          id: 'wrist-roll-pitch-unit-j4',
          name: 'Joints 4 & 5: Spherical Wrist Roll/Pitch Gimbal',
          label: 'Spherical Wrist Actuator',
          shape: 'sphere',
          dimensions: [0.32],
          position: [1.35, 1.12, 0],
          color: '#38bdf8',
          material: 'metal',
          parentId: 'upper-forearm-link-l2',
          connectedTo: ['upper-forearm-link-l2', 'gripper-finger-left', 'gripper-finger-right'],
          description: 'Compact multi-axis wrist assembly orienting the tool mounting flange in roll, pitch, and yaw.',
          whatIsIt: 'Distal orientation gimbal at the end of the forearm.',
          whatDoesItDo: 'Keeps the parallel gripper jaws aligned perpendicular to the target workpiece.',
        },
        {
          id: 'gripper-finger-left',
          name: 'Parallel Pneumatic End-Effector Jaw (Left Finger)',
          label: 'Pneumatic Gripper Jaw A',
          shape: 'box',
          dimensions: [0.1, 0.48, 0.14],
          position: [1.55, 0.78, 0.22],
          color: '#10b981',
          material: 'metal',
          parentId: 'wrist-roll-pitch-unit-j4',
          connectedTo: ['wrist-roll-pitch-unit-j4'],
          description: 'Precision linear-sliding gripper finger with high-friction elastomer pads for grasping payloads.',
          whatIsIt: 'Actuated left finger of the end-effector gripper.',
          whatDoesItDo: 'Translates inward and outward to clamp or release the payload object.',
        },
        {
          id: 'gripper-finger-right',
          name: 'Parallel Pneumatic End-Effector Jaw (Right Finger)',
          label: 'Pneumatic Gripper Jaw B',
          shape: 'box',
          dimensions: [0.1, 0.48, 0.14],
          position: [1.55, 0.78, -0.22],
          color: '#10b981',
          material: 'metal',
          parentId: 'wrist-roll-pitch-unit-j4',
          connectedTo: ['wrist-roll-pitch-unit-j4'],
          description: 'Synchronized opposing gripper finger providing balanced normal clamping force F_clamp.',
          whatIsIt: 'Actuated right finger of the end-effector gripper.',
          whatDoesItDo: 'Closes symmetrically with Jaw A so μ_s·F_clamp exceeds payload weight m·g.',
        },
        {
          id: 'workpiece-target-payload',
          name: 'Precision Payload Workpiece & Pedestal',
          label: 'Target Workpiece Payload',
          shape: 'box',
          dimensions: [0.42, 0.42, 0.42],
          position: [1.65, -1.75, 0],
          color: '#a855f7',
          material: 'plastic',
          description: 'Instrumented test cube positioned in the robot’s reachable workspace envelope.',
          whatIsIt: 'Target payload object in the workspace.',
          whatDoesItDo: 'Serves as the reference target for forward and inverse kinematic positioning.',
        },
      ],
      parameters: {
        baseAzimuthDeg: {
          id: 'baseAzimuthDeg',
          name: 'Waist Turret Azimuth Angle (θ₁)',
          min: -75,
          max: 75,
          step: 5,
          defaultValue: 0,
          unit: '°',
          description: 'Rotates the entire robotic arm horizontally around the vertical waist axis J₁.',
          affects: 'objectRotation',
          targetPartId: 'waist-azimuth-turret-j1',
          scaleFactor: 1.0,
        },
        shoulderPitchDeg: {
          id: 'shoulderPitchDeg',
          name: 'Shoulder Joint Pitch Angle (θ₂)',
          min: -35,
          max: 55,
          step: 5,
          defaultValue: 18,
          unit: '°',
          description: 'Pitches the lower arm link L₁ and carries all connected distal joints (J₃, L₂, wrist, gripper).',
          affects: 'objectRotation',
          targetPartId: 'lower-humeral-link-l1',
          scaleFactor: 1.0,
        },
        elbowPitchDeg: {
          id: 'elbowPitchDeg',
          name: 'Elbow Joint Pitch Angle (θ₃)',
          min: -50,
          max: 65,
          step: 5,
          defaultValue: 25,
          unit: '°',
          description: 'Flexes or extends the forearm link L₂ and connected wrist/gripper relative to the elbow.',
          affects: 'objectRotation',
          targetPartId: 'upper-forearm-link-l2',
          scaleFactor: 1.0,
        },
        gripperApertureMm: {
          id: 'gripperApertureMm',
          name: 'End-Effector Gripper Jaw Opening',
          min: 10,
          max: 80,
          step: 5,
          defaultValue: 45,
          unit: 'mm',
          description: 'Adjusts the parallel spacing between Gripper Jaw A and Gripper Jaw B.',
          affects: 'objectPosition',
          targetPartId: 'gripper-finger-left',
          scaleFactor: 0.005,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Cyclical Pick-and-Place Motion',
          type: 'boolean',
          defaultValue: true,
          description: 'Superimposes smooth coordinated multi-joint trajectory motion onto the selected joint angles.',
        },
      },
      equations: [
        'r = L₁·sin(θ₂) + L₂·cos(θ₂ − θ₃),  y = h₀ + L₁·cos(θ₂) − L₂·sin(θ₂ − θ₃) (3D Forward Kinematics)',
        'τ_shoulder = m₁·g·(L₁/2)·sin(θ₂) + m₂·g·r (Gravitational Joint Torque Equilibrium)',
      ],
      curiosityPrompts: [
        'What is the difference between Forward Kinematics (angles ➔ position) and Inverse Kinematics (position ➔ angles)?',
        'Why does the shoulder motor need to be much stronger and heavier than the wrist motor?',
        'Why does a robotic arm need 6 degrees of freedom (3 for position + 3 for orientation) to reach any pose in 3D space?',
      ],
    };
  }

  // 10E. HYDRAULIC DISC BRAKING SYSTEM (AUTOMOTIVE PASCAL BRAKE CIRCUIT)
  if (
    q.includes('hydraulic brak') ||
    q.includes('disc brake') ||
    (q.includes('brake') && (q.includes('caliper') || q.includes('hydraulic') || q.includes('rotor')))
  ) {
    return {
      id: 'custom-hydraulic-braking-system',
      title: 'Hydraulic Disc Braking System & Kinetic Energy Dissipation',
      concept: "Pascal's Law, Lever Mechanical Advantage, Kinetic Friction & Thermal Dissipation",
      subjectDomain: 'Physics',
      structuralArchetype: 'coupled-hydraulic-press',
      description:
        'Interactive 3D automotive engineering model of a hydraulic disc brake system showing the driver brake pedal lever, pushrod, tandem master cylinder, incompressible DOT-4 hydraulic brake line, floating brake caliper housing, opposing hydraulic caliper pistons, high-friction ceramic brake pads, and a spinning ventilated cast-iron brake rotor disc.',
      whatIsIt:
        'A two-stage force-multiplying braking mechanism (mechanical lever + hydraulic Pascal multiplier) that clamps friction pads against a rotating wheel disc to convert vehicle kinetic energy into heat.',
      howDoesItWork:
        'Depressing the brake pedal multiplies foot force via a Class-2 mechanical lever before pushing the master cylinder piston. Pressurized brake fluid transmits hydrostatic pressure P through the brake lines to larger-area caliper pistons, which clamp the friction pads against both faces of the spinning rotor disc, creating braking torque τ_brake = 2·μ_k·F_normal·R_eff.',
      realLifeExample:
        'Front and rear ventilated disc brakes on passenger cars, high-speed trains, and aircraft landing gear.',
      examConnection:
        'Braking distance scales with the square of initial speed (d = ½·m·v² / F_brake) because kinetic energy K = ½mv² must be completely converted into thermal internal energy ΔU = F_friction · d in the rotor and pads.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 2.5, 8.6], target: [0, 0, 0] },
      parts: [
        {
          id: 'brake-pedal-lever',
          name: 'Driver Brake Pedal & Class-2 Lever Arm',
          label: 'Brake Pedal Lever (F_foot)',
          shape: 'box',
          dimensions: [0.22, 1.65, 0.35],
          position: [-2.85, 0.35, 0],
          rotation: [0, 0, 0.28],
          color: '#334155',
          material: 'metal',
          connectedTo: ['master-brake-cylinder'],
          description: 'Pivoting pedal lever providing a ~4:1 mechanical advantage before entering the master cylinder.',
          whatIsIt: 'Mechanical input lever operated by the driver’s foot.',
          whatDoesItDo: 'Multiplies foot force and pushes the master cylinder pushrod.',
        },
        {
          id: 'master-brake-cylinder',
          name: 'Hydraulic Master Cylinder & Reservoir',
          label: 'Master Cylinder (Area A₁)',
          shape: 'cylinder',
          dimensions: [0.34, 1.45],
          position: [-1.75, 0.15, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#0284c7',
          material: 'glass',
          opacity: 0.65,
          connectedTo: ['brake-pedal-lever', 'high-pressure-brake-line'],
          description: 'Small-bore cylinder that converts mechanical pushrod force into hydraulic line pressure P = F₁ / A₁.',
          whatIsIt: 'Primary hydraulic pressure generator.',
          whatDoesItDo: 'Pressurizes incompressible brake fluid whenever the pedal is depressed.',
        },
        {
          id: 'high-pressure-brake-line',
          name: 'Braided Steel Hydraulic Brake Line Conduit',
          label: 'Hydraulic Brake Line (P)',
          shape: 'cylinder',
          dimensions: [0.11, 2.25],
          position: [-0.2, 0.15, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#38bdf8',
          material: 'liquid',
          connectedTo: ['master-brake-cylinder', 'brake-caliper-housing'],
          description: 'Sealed hydraulic tubing filled with high-boiling-point glycol-ether brake fluid.',
          whatIsIt: 'Incompressible fluid transmission line.',
          whatDoesItDo: 'Transmits hydrostatic pressure P undiminished from the master cylinder to the wheel caliper.',
        },
        {
          id: 'ventilated-brake-rotor',
          name: 'Ventilated Cast-Iron Brake Rotor Disc',
          label: 'Spinning Brake Rotor Disc',
          shape: 'cylinder',
          dimensions: [1.65, 0.24],
          position: [1.75, 0.0, 0],
          rotation: [Math.PI / 2, 0, 0],
          color: '#94a3b8',
          material: 'metal',
          kinematicRole: 'rotor',
          connectedTo: ['friction-brake-pad-inner', 'friction-brake-pad-outer'],
          description: 'Heavy grey cast-iron disc bolted to the rotating wheel hub; absorbs and radiates frictional heat.',
          whatIsIt: 'Rotating wheel disc that slows the vehicle when clamped.',
          whatDoesItDo: 'Converts rotational kinetic energy (½Iω²) into thermal energy via friction with the pads.',
          animation: { type: 'spin', axis: 'z', speed: 4.5, amplitude: 0.1 },
        },
        {
          id: 'brake-caliper-housing',
          name: 'Hydraulic Brake Caliper Bridge Housing',
          label: 'Brake Caliper Housing',
          shape: 'box',
          dimensions: [1.15, 0.85, 0.95],
          position: [1.15, 0.85, 0],
          color: '#dc2626',
          material: 'metal',
          connectedTo: ['high-pressure-brake-line', 'friction-brake-pad-inner', 'friction-brake-pad-outer'],
          description: 'Rigid red aluminum caliper straddling the top edge of the brake rotor and housing the slave pistons.',
          whatIsIt: 'Stationary hydraulic clamp assembly mounted to the steering knuckle.',
          whatDoesItDo: 'Directs opposing slave pistons to squeeze the friction pads against the spinning rotor.',
        },
        {
          id: 'friction-brake-pad-inner',
          name: 'Inboard Ceramic Friction Brake Pad & Slave Piston',
          label: 'Inboard Brake Pad & Piston',
          shape: 'box',
          dimensions: [0.65, 0.48, 0.14],
          position: [1.35, 0.72, -0.24],
          color: '#f59e0b',
          material: 'copper',
          connectedTo: ['brake-caliper-housing', 'ventilated-brake-rotor'],
          description: 'High-coefficient-of-friction (μ_k ≈ 0.42) composite pad driven against the inner face of the rotor.',
          whatIsIt: 'Replaceable high-friction wear pad.',
          whatDoesItDo: 'Generates kinetic friction force F_f = μ_k·F_N to decelerate the rotor.',
        },
        {
          id: 'friction-brake-pad-outer',
          name: 'Outboard Ceramic Friction Brake Pad & Slave Piston',
          label: 'Outboard Brake Pad & Piston',
          shape: 'box',
          dimensions: [0.65, 0.48, 0.14],
          position: [1.35, 0.72, 0.24],
          color: '#f59e0b',
          material: 'copper',
          connectedTo: ['brake-caliper-housing', 'ventilated-brake-rotor'],
          description: 'Opposing composite brake pad clamping the outer face of the rotor disc.',
          whatIsIt: 'Opposing outboard friction pad.',
          whatDoesItDo: 'Clamps symmetrically so no net axial bending load is applied to the wheel bearing.',
        },
      ],
      parameters: {
        pedalForceN: {
          id: 'pedalForceN',
          name: 'Applied Brake Pedal Force (F_pedal)',
          min: 0,
          max: 400,
          step: 20,
          defaultValue: 120,
          unit: 'N',
          description: 'Increases hydraulic clamping pressure, slowing the spinning rotor and heating the pads.',
          affects: 'animationSpeed',
          scaleFactor: 0.01,
        },
        caliperAreaRatio: {
          id: 'caliperAreaRatio',
          name: 'Caliper-to-Master Piston Area Ratio',
          min: 2,
          max: 12,
          step: 1,
          defaultValue: 6,
          unit: '×',
          description: 'Hydraulic force multiplication factor between the master cylinder and caliper pistons.',
          affects: 'objectScale',
          targetPartId: 'brake-caliper-housing',
          scaleFactor: 1.0,
        },
        frictionCoeffMu: {
          id: 'frictionCoeffMu',
          name: 'Pad Friction Coefficient (μ_k)',
          min: 0.2,
          max: 0.6,
          step: 0.05,
          defaultValue: 0.4,
          unit: 'μ',
          description: 'Coefficient of kinetic friction between the ceramic brake pads and cast-iron rotor.',
          affects: 'objectPosition',
          targetPartId: 'friction-brake-pad-inner',
          scaleFactor: 0.2,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Transparent Master Cylinder View',
          type: 'boolean',
          defaultValue: true,
          description: 'Reveals internal hydraulic fluid pressure inside the master cylinder.',
        },
      },
      equations: [
        'F_clamp = F_pedal × MA_lever × (A_caliper / A_master)',
        'τ_brake = 2 · μ_k · F_clamp · R_effective (的双面 Disc Braking Torque)',
        'ΔE_thermal = ½ · m · v² = F_friction · d_stop (Kinetic-to-Thermal Energy Conversion)',
      ],
      curiosityPrompts: [
        'Why do vapour bubbles in brake fluid ("brake fade") cause the brake pedal to sink to the floor without stopping the car?',
        'Why are front brake rotors ventilated with internal cooling vanes?',
        'How do lever ratio and Pascal’s law work together to turn a 100 N foot push into 15,000 N of clamping force?',
      ],
    };
  }

  // 11. RESEARCH-DRIVEN MULTI-ARCHETYPE COMPONENT GRAPH SYNTHESIZER (FOR ALL OTHER UNSEEN PROMPTS)
  return synthesizeResearchDrivenComponentGraph(prompt, researchRecord);
}

/**
 * Phase 4 & 5: Research-Driven Component Graph Synthesizer.
 * Never returns a generic hub-and-spoke fallback. Instead, analyzes the requested topic
 * and the retrieved web research record (extractedComponents, retrievedFacts, equations)
 * to select an appropriate 3D structural architecture and build a topic-specific assembly.
 */
function synthesizeResearchDrivenComponentGraph(
  prompt: string,
  researchRecord?: ResearchRecord
): ScientificModelSpec {
  const cleanTitle = prompt
    .replace(
      /^(please\s+)?(create|generate|build|make|show|design|render|construct)\s+(me\s+)?(a\s+|an\s+|the\s+)?(custom\s+|new\s+)?(interactive\s+|scientific\s+)?(3d\s+)?(model|simulation|explorer|diagram|cutaway)\s+(of\s+|for\s+|showing\s+)?/i,
      ''
    )
    .trim();
  const formattedTitle =
    cleanTitle.length > 2
      ? cleanTitle
          .split(/\s+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : 'Custom Scientific System';

  const corpus = `${prompt} ${(researchRecord?.retrievedFacts || []).join(' ')} ${(researchRecord?.extractedComponents || []).join(' ')}`.toLowerCase();

  // Classify into one of 5 distinct structural layout families based on topic & research evidence
  type ArchetypeFamily =
    | 'axial-flow-stages'
    | 'layered-cross-section'
    | 'articulated-linkage'
    | 'tubular-flow-network'
    | 'coupled-dual-vessel';

  let archetype: ArchetypeFamily = 'axial-flow-stages';
  if (
    /cross-section|crust|mantle|layer|strata|volcano|earth|atmosphere|glacier|soil|crater|sediment|core|anatomical slice|skin|leaf/i.test(
      corpus
    )
  ) {
    archetype = 'layered-cross-section';
  } else if (
    /arm|robot|crane|linkage|lever|pendulum|hinge|joint|piston|crank|suspension|scissor|catapult|trebuchet|prosthetic|jaw/i.test(
      corpus
    )
  ) {
    archetype = 'articulated-linkage';
  } else if (
    /tubule|nephron|vessel|artery|vein|capillary|villi|bronch|alveol|xylem|phloem|digestive|intestine|cochlea|lymph|vascular/i.test(
      corpus
    )
  ) {
    archetype = 'tubular-flow-network';
  } else if (
    /press|cell|battery|electrolysis|dialysis|osmosis|manometer|siphon|heat exchanger|distillation|titration|reactor|fuel cell/i.test(
      corpus
    )
  ) {
    archetype = 'coupled-dual-vessel';
  }

  // Extract or derive 6–8 meaningful component names specific to this topic
  const rawExtracted = researchRecord?.extractedComponents || [];
  const defaultArchetypeLabels: Record<ArchetypeFamily, string[]> = {
    'axial-flow-stages': [
      `${formattedTitle} Intake & Guide Housing`,
      `${formattedTitle} Primary Rotor / Compression Stage`,
      `${formattedTitle} Central Drive Shaft & Coupling`,
      `${formattedTitle} Active Reaction / Energy Chamber`,
      `${formattedTitle} Downstream Turbine / Stator Stage`,
      `${formattedTitle} Exhaust / Output Nozzle`,
    ],
    'layered-cross-section': [
      `${formattedTitle} Deep Basal Foundation Layer`,
      `${formattedTitle} Subsurface Reservoir / Core Chamber`,
      `${formattedTitle} Intermediate Stratified Mantle`,
      `${formattedTitle} Primary Vertical Conduit Channel`,
      `${formattedTitle} Upper Surface Crust / Cutaway Wall`,
      `${formattedTitle} Active Surface Plume / Boundary Zone`,
    ],
    'articulated-linkage': [
      `${formattedTitle} Anchored Pedestal Base`,
      `${formattedTitle} Primary Rotary Pivot Joint`,
      `${formattedTitle} Proximal Structural Arm Link`,
      `${formattedTitle} Intermediate Articulated Hinge`,
      `${formattedTitle} Distal Forearm / Actuator Link`,
      `${formattedTitle} End-Effector / Load Stage`,
    ],
    'tubular-flow-network': [
      `${formattedTitle} Afferent Inlet Vessel`,
      `${formattedTitle} Primary Filtration / Exchange Capsule`,
      `${formattedTitle} Proximal Coiled Transport Segment`,
      `${formattedTitle} Countercurrent Hairpin Loop`,
      `${formattedTitle} Distal Regulatory Duct`,
      `${formattedTitle} Active Fluid Transport Bolus`,
    ],
    'coupled-dual-vessel': [
      `${formattedTitle} Structural Support Bed`,
      `${formattedTitle} Primary Input Chamber / Anode Vessel`,
      `${formattedTitle} Active Input Piston / Electrode`,
      `${formattedTitle} Interconnecting Transfer Manifold`,
      `${formattedTitle} Secondary Output Chamber / Cathode Vessel`,
      `${formattedTitle} Output Transducer / Collector Stage`,
    ],
  };

  const componentNames: string[] = [];
  for (const item of rawExtracted) {
    if (!componentNames.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
      componentNames.push(item);
    }
    if (componentNames.length >= 7) break;
  }
  const fallbackList = defaultArchetypeLabels[archetype];
  let idx = 0;
  while (componentNames.length < 6 && idx < fallbackList.length) {
    componentNames.push(fallbackList[idx]);
    idx++;
  }

  const palette = ['#0284c7', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#38bdf8', '#f97316'];
  const parts: ModelPartSpec[] = [];

  if (archetype === 'axial-flow-stages') {
    // Coaxial horizontal multi-stage engineering/physics assembly along the X axis
    parts.push({
      id: `${formattedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-outer-casing`,
      name: `${formattedTitle} Cutaway Outer Casing`,
      label: `${formattedTitle} Cutaway Casing`,
      shape: 'cylinder',
      dimensions: [1.45, 5.2],
      position: [0, 0.1, 0],
      rotation: [0, 0, Math.PI / 2],
      color: '#64748b',
      material: 'glass',
      opacity: 0.35,
      description: `Translucent cutaway housing enclosing the coaxial stages of ${formattedTitle}.`,
      whatIsIt: `Outer containment shell of ${formattedTitle}.`,
      whatDoesItDo: 'Maintains axial alignment and pressure boundaries across all internal stages.',
    });

    componentNames.forEach((compName, i) => {
      const xPos = -2.2 + i * (4.4 / Math.max(1, componentNames.length - 1));
      const isCenter = i === Math.floor(componentNames.length / 2);
      const isRotor = /rotor|fan|turbine|compressor|blade|impeller|shaft|wheel|coil/i.test(compName) || i % 2 === 1;
      parts.push({
        id: `stage-${i + 1}-${compName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`,
        name: compName,
        label: compName,
        shape: isCenter ? 'torus' : i === componentNames.length - 1 ? 'cone' : 'cylinder',
        dimensions: isCenter
          ? [0.65, 0.24]
          : i === componentNames.length - 1
            ? [0.85, 1.0]
            : [0.95 - i * 0.06, 0.55],
        position: [+xPos.toFixed(2), 0.1, 0],
        rotation: isCenter ? [0, Math.PI / 2, 0] : [0, 0, Math.PI / 2],
        color: palette[i % palette.length],
        material: isCenter ? 'glow' : isRotor ? 'metal' : 'copper',
        connectedTo: i > 0 ? [`stage-${i}-${componentNames[i - 1].toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`] : undefined,
        description:
          researchRecord?.retrievedFacts?.[i % Math.max(1, researchRecord?.retrievedFacts?.length || 1)] ||
          `Functional stage (${compName}) inside the ${formattedTitle} assembly.`,
        whatIsIt: `Key structural component #${i + 1} of ${formattedTitle}.`,
        whatDoesItDo: isRotor
          ? `Rotates coaxially to transfer mechanical energy and momentum through ${formattedTitle}.`
          : `Guides and transforms energy/fluid flux across stage ${i + 1}.`,
        animation: isRotor
          ? { type: 'spin', axis: 'x', speed: 3.2 + i * 0.4, amplitude: 0.1 }
          : { type: 'pulse', axis: 'x', speed: 2.4, amplitude: 0.08 },
      });
    });
  } else if (archetype === 'layered-cross-section') {
    // Terraced vertical geological/anatomical cutaway strata + central conduit
    componentNames.forEach((compName, i) => {
      const yPos = -2.0 + i * 0.82;
      const isConduit = /conduit|vent|channel|pipe|core|chamber/i.test(compName) || i === 2;
      parts.push({
        id: `layer-${i + 1}-${compName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`,
        name: compName,
        label: compName,
        shape: isConduit ? 'cylinder' : i === componentNames.length - 1 ? 'sphere' : 'box',
        dimensions: isConduit
          ? [0.42, 3.2]
          : i === componentNames.length - 1
            ? [0.85]
            : [4.8 - i * 0.55, 0.55, 3.4 - i * 0.35],
        position: [0, isConduit ? -0.2 : +yPos.toFixed(2), isConduit ? 0.35 : 0],
        color: palette[i % palette.length],
        material: isConduit ? 'glow' : 'standard',
        opacity: i === 3 ? 0.65 : 1.0,
        description:
          researchRecord?.retrievedFacts?.[i % Math.max(1, researchRecord?.retrievedFacts?.length || 1)] ||
          `Stratified cross-sectional component (${compName}) of ${formattedTitle}.`,
        whatIsIt: `Cross-sectional structural region (${compName}).`,
        whatDoesItDo: `Forms horizon #${i + 1} in the internal cutaway structure of ${formattedTitle}.`,
        animation:
          isConduit || i === componentNames.length - 1
            ? { type: 'pulse', axis: 'y', speed: 2.2, amplitude: 0.12 }
            : undefined,
      });
    });
  } else if (archetype === 'articulated-linkage') {
    // Articulated kinematic chain with base, joints, links, and end-effector
    componentNames.forEach((compName, i) => {
      const isJoint = i % 2 === 1;
      const xPos = -1.2 + i * 0.52;
      const yPos = -1.85 + i * 0.62;
      parts.push({
        id: `link-${i + 1}-${compName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`,
        name: compName,
        label: compName,
        shape: i === 0 ? 'box' : isJoint ? 'cylinder' : 'capsule',
        dimensions: i === 0 ? [2.8, 0.38, 2.2] : isJoint ? [0.36, 0.7] : [0.22, 1.45],
        position: [+xPos.toFixed(2), +yPos.toFixed(2), 0],
        rotation: isJoint ? [Math.PI / 2, 0, 0] : [0, 0, -0.35 * i],
        color: palette[i % palette.length],
        material: 'metal',
        description:
          researchRecord?.retrievedFacts?.[i % Math.max(1, researchRecord?.retrievedFacts?.length || 1)] ||
          `Articulated kinematic element (${compName}) of ${formattedTitle}.`,
        whatIsIt: `Mechanical linkage stage #${i + 1} (${compName}).`,
        whatDoesItDo: `Transmits torque and angular displacement along the kinematic chain of ${formattedTitle}.`,
        animation:
          i > 0
            ? { type: 'oscillate', axis: 'z', speed: 1.8 + i * 0.2, amplitude: 0.18 }
            : undefined,
      });
    });
  } else if (archetype === 'tubular-flow-network') {
    // Physiological / fluid tubular loop and capsule network
    componentNames.forEach((compName, i) => {
      const xPos = -2.4 + i * 0.95;
      const yPos = i % 2 === 0 ? 0.85 : -0.45;
      parts.push({
        id: `vessel-${i + 1}-${compName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`,
        name: compName,
        label: compName,
        shape: i === 1 ? 'sphere' : i % 2 === 0 ? 'torus' : 'cylinder',
        dimensions: i === 1 ? [0.72] : i % 2 === 0 ? [0.62, 0.18] : [0.18, 2.3],
        position: [+xPos.toFixed(2), +yPos.toFixed(2), 0],
        color: palette[i % palette.length],
        material: i === componentNames.length - 1 ? 'glow' : 'tissue',
        description:
          researchRecord?.retrievedFacts?.[i % Math.max(1, researchRecord?.retrievedFacts?.length || 1)] ||
          `Physiological/fluid transport segment (${compName}) in ${formattedTitle}.`,
        whatIsIt: `Tubular/vascular segment (${compName}).`,
        whatDoesItDo: `Regulates selective transport, filtration, or circulation across ${formattedTitle}.`,
        animation:
          i === 1 || i === componentNames.length - 1
            ? { type: 'pulse', axis: 'y', speed: 2.3, amplitude: 0.12 }
            : undefined,
      });
    });
  } else {
    // Coupled dual-chamber / pressure-transfer apparatus
    componentNames.forEach((compName, i) => {
      const positions: [number, number, number][] = [
        [0, -2.05, 0],
        [-1.85, -0.5, 0],
        [-1.85, 0.55, 0],
        [0, -1.45, 0],
        [1.85, -0.45, 0],
        [1.85, 0.65, 0],
      ];
      const pos = positions[i % positions.length];
      parts.push({
        id: `chamber-${i + 1}-${compName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`,
        name: compName,
        label: compName,
        shape: i === 0 || i === 3 ? 'box' : 'cylinder',
        dimensions:
          i === 0
            ? [5.6, 0.4, 2.6]
            : i === 3
              ? [3.6, 0.45, 0.9]
              : i >= 4
                ? [0.95, 1.7]
                : [0.55, 1.6],
        position: pos,
        color: palette[i % palette.length],
        material: i === 1 || i === 4 ? 'glass' : i === 3 ? 'liquid' : 'metal',
        opacity: i === 1 || i === 4 ? 0.5 : 1.0,
        description:
          researchRecord?.retrievedFacts?.[i % Math.max(1, researchRecord?.retrievedFacts?.length || 1)] ||
          `Coupled functional assembly (${compName}) of ${formattedTitle}.`,
        whatIsIt: `Primary subsystem (${compName}) of ${formattedTitle}.`,
        whatDoesItDo: `Couples input driving potential to output response across ${formattedTitle}.`,
        animation:
          i === 2 || i === 5
            ? { type: 'oscillate', axis: 'y', speed: 1.9, amplitude: 0.28 }
            : undefined,
      });
    });
  }

  const targetScalePartId = parts[Math.min(1, parts.length - 1)]?.id || parts[0]?.id;
  const targetMotionPartId = parts[Math.min(2, parts.length - 1)]?.id || parts[0]?.id;

  const researchDesc =
    researchRecord?.retrievedFacts && researchRecord.retrievedFacts.length > 0
      ? researchRecord.retrievedFacts.slice(0, 2).join(' ')
      : `Interactive 3D scientific model of ${formattedTitle} constructed from its core structural components (${componentNames.slice(0, 4).join(', ')}).`;

  return {
    id: `custom-researched-${formattedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 36)}`,
    title: `${formattedTitle} — Interactive 3D Scientific Model`,
    concept: `${formattedTitle} (${archetype.replace(/-/g, ' ')})`,
    structuralArchetype: archetype,
    description: researchDesc,
    whatIsIt:
      researchRecord?.retrievedFacts?.[0] ||
      `A multi-part 3D scientific model illustrating the essential components and working mechanism of ${formattedTitle}.`,
    howDoesItWork:
      researchRecord?.extractedMechanism ||
      researchRecord?.retrievedFacts?.[1] ||
      `${formattedTitle} operates through coupled interactions among ${componentNames.slice(0, 4).join(', ')}. Adjusting the interactive parameters modulates the live kinematic rate and structural geometry.`,
    realLifeExample: `Applied in scientific research, engineering systems, and educational analysis of ${formattedTitle}.`,
    examConnection: `Identify each structural component (${componentNames.slice(0, 3).join(', ')}) and explain how changing the driving parameter alters the quantitative system output.`,
    functionalType: 'standard',
    simulationModel: 'predictive',
    prompt,
    camera: { position: [0, 2.8, 8.6], target: [0, 0, 0] },
    parts,
    parameters: {
      drivingRate: {
        id: 'drivingRate',
        name: `${formattedTitle} Operating Rate / Input Drive`,
        min: 0.2,
        max: 5.0,
        step: 0.2,
        defaultValue: 2.0,
        unit: 'Hz',
        description: `Controls the active kinematic velocity and process rate across ${formattedTitle}.`,
        affects: 'animationSpeed',
        scaleFactor: 1.0,
      },
      primaryGeometryScale: {
        id: 'primaryGeometryScale',
        name: `${componentNames[0] || 'Primary Assembly'} Scale Factor`,
        min: 0.65,
        max: 1.5,
        step: 0.05,
        defaultValue: 1.0,
        unit: '×',
        description: `Scales the geometric dimensions of ${componentNames[0] || 'the primary stage'}.`,
        affects: 'objectScale',
        targetPartId: targetScalePartId,
        scaleFactor: 1.0,
      },
      stageDisplacement: {
        id: 'stageDisplacement',
        name: `${componentNames[1] || 'Active Stage'} Position / Stroke`,
        min: -1.0,
        max: 1.0,
        step: 0.1,
        defaultValue: 0,
        unit: 'm',
        description: `Displaces ${componentNames[1] || 'the active stage'} along its primary coordinate axis.`,
        affects: 'objectPosition',
        targetPartId: targetMotionPartId,
        scaleFactor: 0.45,
      },
    },
    conditions: {
      internalView: {
        id: 'internalView',
        name: 'Internal Cutaway Transparency',
        type: 'boolean',
        defaultValue: true,
        description: 'Toggles semi-transparent outer boundaries to inspect internal stages.',
      },
    },
    equations:
      researchRecord?.extractedEquations && researchRecord.extractedEquations.length > 0
        ? researchRecord.extractedEquations
        : [
            'P_out = η · P_in (System Energy Conversion & Efficiency)',
            'Φ(t) = Φ₀ · sin(2π · f · t) (Coupled Dynamic Response)',
          ],
    curiosityPrompts: [
      `What is the primary scientific role of ${componentNames[0] || 'the first stage'} in ${formattedTitle}?`,
      `How do ${componentNames[0] || 'the input stage'} and ${componentNames[1] || 'the active stage'} interact during operation?`,
      `What happens to the quantitative output of ${formattedTitle} when the operating drive is doubled?`,
    ],
  };
}

