import React, { useState, useMemo } from 'react';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { SIMULATIONS_CONFIG } from '../data/simulationsData';
import {
  calculateProjectileMotion,
  ProjectileParams,
  ProjectileResults,
} from '../simulations/physics/projectileEngine';
import {
  calculatePendulumMetrics,
  PendulumParams,
  PendulumResults,
} from '../simulations/physics/pendulumEngine';
import {
  calculateCircuitState,
  CircuitParams,
  CircuitResults,
} from '../simulations/physics/circuitEngine';
import { Dynamic3DModelRenderer } from '../components/models/Dynamic3DModelRenderer';
import { ProjectileScene } from '../components/physics/ProjectileScene';
import { PendulumScene } from '../components/physics/PendulumScene';
import { CircuitScene } from '../components/physics/CircuitScene';
import { EducationalExplanationBox, ExplanationData } from '../components/common/EducationalExplanationBox';
import { CuriosityEngine } from '../components/common/CuriosityEngine';
import { ModelAwareChatbot, ModelChatContext } from '../components/ai/ModelAwareChatbot';
import { Sparkles, Sliders, Box, Layers, RotateCcw } from 'lucide-react';
import { ScientificModelSpec } from '../types/aiModel';

export interface PhysicsModelMeta {
  id: string;
  curatedKey: keyof typeof CURATED_AI_MODELS;
  title: string;
  badge: string;
  icon: string;
  category: 'Astrophysics' | 'Mechanics' | 'Fluids & Work' | 'Optics & Waves' | 'Electromagnetism' | 'Thermodynamics' | 'Electromechanical' | 'Modern & Quantum';
  shortDesc: string;
  batch: 1 | 3 | 4 | 5 | 6 | 7;
}

export const PHYSICS_BATCH_1_MODELS: PhysicsModelMeta[] = [
  {
    id: 'solar-system',
    curatedKey: 'solar',
    title: 'Solar System Explorer',
    badge: 'Keplerian Orbits',
    icon: '🪐',
    category: 'Astrophysics',
    shortDesc: 'Sun, all 8 planets with orbital velocities, Moon & Saturn rings.',
    batch: 1,
  },
  {
    id: 'simple-pendulum',
    curatedKey: 'pendulum',
    title: 'Simple Pendulum',
    badge: 'Harmonic Oscillation',
    icon: '⏱️',
    category: 'Mechanics',
    shortDesc: 'Oscillating bob, string length, gravity, restoring force & mass independence.',
    batch: 1,
  },
  {
    id: 'projectile-motion',
    curatedKey: 'projectile',
    title: 'Projectile Motion',
    badge: '2D Kinematics',
    icon: '🎯',
    category: 'Mechanics',
    shortDesc: 'Ballistic launcher, parabolic arc, apex altitude & range in vacuum.',
    batch: 1,
  },
  {
    id: 'inclined-plane',
    curatedKey: 'inclinedPlane',
    title: 'Inclined Plane & Friction',
    badge: 'Force Resolution',
    icon: '📐',
    category: 'Mechanics',
    shortDesc: 'Sliding block, normal & friction vectors, angle of repose & acceleration.',
    batch: 1,
  },
  {
    id: 'class-1-lever',
    curatedKey: 'lever',
    title: 'Class 1 Lever',
    badge: 'Torque Equilibrium',
    icon: '⚖️',
    category: 'Mechanics',
    shortDesc: 'Fulcrum pivot, effort/load arms, torque balance & mechanical advantage.',
    batch: 1,
  },
  {
    id: 'hydraulic-lift',
    curatedKey: 'hydraulicLift',
    title: 'Hydraulic Lift',
    badge: "Pascal's Principle",
    icon: '🚜',
    category: 'Fluids & Work',
    shortDesc: 'Dual pistons, area ratio A₂/A₁, Pascal fluid pressure & multiplied force.',
    batch: 1,
  },
  {
    id: 'newtons-cradle',
    curatedKey: 'newtonsCradle',
    title: "Newton's Cradle",
    badge: 'Momentum Conservation',
    icon: '⚛️',
    category: 'Mechanics',
    shortDesc: '5 steel spheres, elastic collision shockwaves & momentum transfer.',
    batch: 1,
  },
  {
    id: 'reflection-refraction',
    curatedKey: 'reflectionRefraction',
    title: 'Reflection & Refraction',
    badge: "Snell's Law & TIR",
    icon: '🔦',
    category: 'Optics & Waves',
    shortDesc: 'Dielectric glass block, laser beam, angle of incidence & critical angle.',
    batch: 1,
  },
  {
    id: 'prism-dispersion',
    curatedKey: 'prismDispersion',
    title: 'Optical Prism Dispersion',
    badge: 'Chromatic Spectrum',
    icon: '🌈',
    category: 'Optics & Waves',
    shortDesc: 'Newton equilateral prism, Cauchy dispersion & visible rainbow spectrum.',
    batch: 1,
  },
  {
    id: 'electric-circuit',
    curatedKey: 'circuit',
    title: 'Direct Current Circuit',
    badge: "Ohm's Law",
    icon: '⚡',
    category: 'Electromagnetism',
    shortDesc: 'Battery, knife switch, tungsten bulb filament glow & Joule heating power.',
    batch: 1,
  },
];

export const PHYSICS_BATCH_3_MODELS: PhysicsModelMeta[] = [
  {
    id: 'ac-generator',
    curatedKey: 'acGenerator',
    title: '31. AC Electric Generator',
    badge: 'Electromagnetic Induction',
    icon: '⚡',
    category: 'Electromechanical',
    shortDesc: 'Stator poles, rotating armature coil, dual slip rings, brushes & AC lamp.',
    batch: 3,
  },
  {
    id: 'electromagnetic-induction',
    curatedKey: 'inductionExplorer',
    title: '33. Induction Explorer',
    badge: "Faraday & Lenz's Law",
    icon: '🧲',
    category: 'Electromagnetism',
    shortDesc: 'Moving bar magnet, cylindrical solenoid coil & center-zero galvanometer needle.',
    batch: 3,
  },
  {
    id: 'heat-transfer-explorer',
    curatedKey: 'heatTransferExplorer',
    title: '36. Heat Transfer Explorer',
    badge: 'Thermal Physics',
    icon: '🔥',
    category: 'Thermodynamics',
    shortDesc: 'Conduction bar, convection fluid currents, radiation emitter & thermal field.',
    batch: 3,
  },
  {
    id: 'four-stroke-engine',
    curatedKey: 'fourStrokeEngine',
    title: '37. Four-Stroke Engine',
    badge: 'Otto Cycle',
    icon: '🚗',
    category: 'Electromechanical',
    shortDesc: 'Cylinder cutaway, reciprocating piston, intake/exhaust valves, spark & crankshaft.',
    batch: 3,
  },
  {
    id: 'electric-bell',
    curatedKey: 'electricBell',
    title: '38. Electric Bell Mechanism',
    badge: 'Interrupter Circuit',
    icon: '🔔',
    category: 'Electromechanical',
    shortDesc: 'Twin electromagnet bobbins, vibrating armature spring, contact breaker & brass gong.',
    batch: 3,
  },
  {
    id: 'hydroelectric-power',
    curatedKey: 'hydroelectricPower',
    title: '39. Hydroelectric Power',
    badge: 'Renewable Hydro Generation',
    icon: '🌊',
    category: 'Electromechanical',
    shortDesc: 'Dam reservoir, penstock conduit, spiral casing, Francis turbine runner & generator.',
    batch: 3,
  },
  {
    id: 'motor-effect-fleming',
    curatedKey: 'motorEffectFleming',
    title: '40. Motor Effect (Fleming)',
    badge: 'Lorentz Force',
    icon: '📐',
    category: 'Electromagnetism',
    shortDesc: 'Parallel rails, conductor rod, permanent magnet poles & Fleming Left-Hand vectors.',
    batch: 3,
  },
];

export const PHYSICS_ADVANCED_BATCH_1_MODELS: PhysicsModelMeta[] = [
  {
    id: 'electromagnetic-wave-propagation',
    curatedKey: 'electromagneticWave',
    title: '1. EM Wave Propagation',
    badge: 'Maxwell & Poynting',
    icon: '📡',
    category: 'Electromagnetism',
    shortDesc: 'Orthogonal oscillating E and B fields, Poynting energy flux S = (1/μ₀)(E × B) & c = fλ.',
    batch: 4,
  },
  {
    id: 'plasma-physics-explorer',
    curatedKey: 'plasmaPhysics',
    title: '2. Plasma Physics Explorer',
    badge: 'Ionized Gas & Debye',
    icon: '☀️',
    category: 'Modern & Quantum',
    shortDesc: 'Positive ions, free electrons, Larmor cyclotron gyration, Debye shielding & E×B drift.',
    batch: 4,
  },
  {
    id: 'particle-accelerator-explorer',
    curatedKey: 'particleAccelerator',
    title: '3. Particle Accelerator',
    badge: 'Lorentz Force Beamline',
    icon: '⚛️',
    category: 'Modern & Quantum',
    shortDesc: 'RF electric acceleration cavity (ΔK = qV) and dipole magnetic bending sector (W_B = 0).',
    batch: 4,
  },
  {
    id: 'magnetic-levitation-explorer',
    curatedKey: 'magneticLevitation',
    title: '4. Magnetic Levitation',
    badge: 'Maglev & Earnshaw',
    icon: '🚄',
    category: 'Electromagnetism',
    shortDesc: 'Guideway stator coils, levitating magnet bogie, equilibrium gap z_eq & lateral guidance.',
    batch: 4,
  },
  {
    id: 'superconductivity-meissner-explorer',
    curatedKey: 'superconductivityMeissner',
    title: '5. Superconductivity & Meissner',
    badge: 'Flux Expulsion',
    icon: '🧊',
    category: 'Modern & Quantum',
    shortDesc: 'YBCO ceramic disc in LN₂, Tc transition, London screening currents & magnetic levitation.',
    batch: 4,
  },
  {
    id: 'black-hole-gravitational-lensing',
    curatedKey: 'blackHoleLensing',
    title: '6. Black Hole & Lensing',
    badge: 'General Relativity',
    icon: '🕳️',
    category: 'Astrophysics',
    shortDesc: 'Schwarzschild event horizon r_s, photon sphere 1.5 r_s, spacetime curvature & Einstein ring.',
    batch: 4,
  },
  {
    id: 'quantum-tunnelling-explorer',
    curatedKey: 'quantumTunnelling',
    title: '7. Quantum Tunnelling',
    badge: 'Schrödinger Barrier',
    icon: '🌊',
    category: 'Modern & Quantum',
    shortDesc: 'Incident matter wave ψ(x), potential barrier V₀, evanescent decay e^(-κx) & transmission T.',
    batch: 4,
  },
];

export const PHYSICS_ADVANCED_BATCH_2_MODELS: PhysicsModelMeta[] = [
  {
    id: 'faraday-law-induction-explorer',
    curatedKey: 'faradayLawInduction',
    title: "48. Faraday's Law: Induction",
    badge: 'Faraday & Lenz Law',
    icon: '🧲',
    category: 'Electromagnetism',
    shortDesc: 'Moving bar magnet, helical copper solenoid, magnetic flux linkage NΦ_B, induced EMF ε = -N dΦ_B/dt & Lenz opposition.',
    batch: 4,
  },
  {
    id: 'motor-generator-energy-explorer',
    curatedKey: 'motorGeneratorConversion',
    title: '49. Motor & Generator Explorer',
    badge: 'Electromechanical Energy',
    icon: '⚙️',
    category: 'Electromagnetism',
    shortDesc: 'Dual-mode DC motor (Lorentz torque τ = NBIAsinθ) and AC/DC generator (induced EMF & back-EMF V_source - ε_back).',
    batch: 4,
  },
  {
    id: 'ac-voltage-transformer-explorer',
    curatedKey: 'acVoltageTransformer',
    title: '50. AC Voltage Transformer',
    badge: 'Mutual Inductance',
    icon: '🔌',
    category: 'Electromagnetism',
    shortDesc: 'Laminated silicon-steel core, primary N_p & secondary N_s coils, step-up/down voltage V_s/V_p = N_s/N_p & core losses.',
    batch: 4,
  },
  {
    id: 'wave-interference-diffraction-lab',
    curatedKey: 'waveInterferenceDiffraction',
    title: '51. Wave Interference & Diffraction',
    badge: 'Ripple Tank & Slit Lab',
    icon: '🌈',
    category: 'Optics & Waves',
    shortDesc: 'Coherent wavefronts, two-source interference, single-slit diffraction, path difference Δr & screen intensity I(y).',
    batch: 4,
  },
  {
    id: 'optical-interferometer-explorer',
    curatedKey: 'opticalInterferometer',
    title: '52. Optical Interferometer',
    badge: 'Optical Path Difference',
    icon: '🔬',
    category: 'Optics & Waves',
    shortDesc: 'Michelson interferometer 50:50 beam splitter, reference M₁ & movable mirror M₂, OPD = 2Δd & bullseye Haidinger fringes.',
    batch: 4,
  },
  {
    id: 'fluid-dynamics-bernoulli-vortex',
    curatedKey: 'fluidDynamicsBernoulli',
    title: '53. Fluid Dynamics: Bernoulli & Vortex',
    badge: 'Continuity & Bernoulli',
    icon: '✈️',
    category: 'Fluids & Work',
    shortDesc: 'Venturi tube continuity A₁v₁ = A₂v₂, static pressure manometers P₁/P₂/P₃, velocity streamlines & Kármán vortex street.',
    batch: 4,
  },
  {
    id: 'tokamak-fusion-confinement-explorer',
    curatedKey: 'nuclearFusionTokamak',
    title: '54. Nuclear Fusion Tokamak',
    badge: 'Magnetic Confinement',
    icon: '☢️',
    category: 'Modern & Quantum',
    shortDesc: 'Toroidal B_T & poloidal B_p magnetic cages, central solenoid, helical field lines, safety factor q₉₅ & D-T plasma torus.',
    batch: 5,
  },
];

export const PHYSICS_ADVANCED_BATCH_3_MODELS: PhysicsModelMeta[] = [
  {
    id: 'doppler-effect-sonic-boom-explorer',
    curatedKey: 'dopplerEffectSonicBoom',
    title: '55. Doppler Effect & Sonic Boom',
    badge: 'Wavefront & Mach Cone',
    icon: '✈️',
    category: 'Optics & Waves',
    shortDesc: 'Moving acoustic source, wavefront compression/expansion, approaching/receding Doppler shift & supersonic Mach cone.',
    batch: 6,
  },
  {
    id: 'seismic-waves-earthquake-lab',
    curatedKey: 'seismicWavesEarthquake',
    title: '56. Seismic Waves & Earthquake Lab',
    badge: 'P, S & Surface Waves',
    icon: '🌍',
    category: 'Optics & Waves',
    shortDesc: '3D Earth cutaway (crust, mantle, liquid outer core, solid inner core), P/S ray refraction, S-wave shadow zone & seismogram.',
    batch: 6,
  },
  {
    id: 'gyroscope-torque-angular-momentum-lab',
    curatedKey: 'gyroscopeAngularMomentum',
    title: '57. Gyroscope & Angular Momentum',
    badge: 'Precession Ω_p = τ / L',
    icon: '🧭',
    category: 'Mechanics',
    shortDesc: 'Spinning rotor in Cardan gimbal, orthogonal spin L = Iω & gravitational torque τ = r × mg driving horizontal precession.',
    batch: 6,
  },
  {
    id: 'shm-coupled-oscillators-lab',
    curatedKey: 'shmCoupledOscillators',
    title: '58. SHM & Coupled Oscillators',
    badge: 'Normal Modes & Beats',
    icon: '〰️',
    category: 'Mechanics',
    shortDesc: 'Dual spring-coupled masses, in-phase ω₁ & anti-phase ω₂ normal modes, weak-coupling energy beat transfer & K+U conservation.',
    batch: 6,
  },
  {
    id: 'thermodynamics-carnot-heat-engine',
    curatedKey: 'thermodynamicsCarnotEngine',
    title: '59. Carnot Heat Engine & P–V Cycle',
    badge: 'Carnot Efficiency η',
    icon: '🔥',
    category: 'Thermodynamics',
    shortDesc: '4-stage Carnot cycle (isothermal/adiabatic expansion & compression), hot T_H & cold T_C reservoirs, flywheel & live P–V loop.',
    batch: 6,
  },
  {
    id: 'photoelectric-effect-quantum-explorer',
    curatedKey: 'photoelectricEffectQuantum',
    title: '60. Photoelectric Effect & Quantum Lab',
    badge: 'E_photon = hf & Φ',
    icon: '💡',
    category: 'Modern & Quantum',
    shortDesc: 'Monochromatic photon packets striking metal cathode (Cs, Na, Zn, Cu, Pt), threshold frequency f₀, K_max = hf - Φ & V_stop.',
    batch: 6,
  },
  {
    id: 'special-relativity-time-length-lab',
    curatedKey: 'specialRelativityLab',
    title: '61. Special Relativity: Time & Length',
    badge: 'Lorentz Factor γ',
    icon: '🚀',
    category: 'Modern & Quantum',
    shortDesc: 'Dual reference frames (Spacecraft Proper Frame vs Observer Frame), Einstein light clock zig-zag path, Δt = γΔt₀ & L = L₀/γ.',
    batch: 6,
  },
];

export const PHYSICS_ADVANCED_BATCH_4_MODELS: PhysicsModelMeta[] = [
  {
    id: 'maxwell-equations-em-field-explorer',
    curatedKey: 'maxwellEquationsExplorer',
    title: "62. Maxwell's Equations & EM Fields",
    badge: 'Gauss, Faraday & Ampère',
    icon: '⚡',
    category: 'Electromagnetism',
    shortDesc: 'Configurable charges & Gaussian surface, closed B-flux loops, Faraday induction ring, displacement current & E×B wave.',
    batch: 7,
  },
  {
    id: 'ac-circuits-rlc-resonance-lab',
    curatedKey: 'acRlcResonanceLab',
    title: '63. AC Circuits & RLC Resonance Lab',
    badge: 'f₀ = 1/(2π√(LC))',
    icon: '〰️',
    category: 'Electromagnetism',
    shortDesc: 'AC alternator, resistor R, solenoid inductor X_L, capacitor X_C, peak vs RMS meters, V(t)/I(t) oscilloscope & phasors.',
    batch: 7,
  },
  {
    id: 'lenses-optical-instruments-lab',
    curatedKey: 'lensesOpticalInstrumentsLab',
    title: '64. Lenses & Optical Instruments Lab',
    badge: '1/f = 1/v − 1/u',
    icon: '🔍',
    category: 'Optics & Waves',
    shortDesc: 'Convex & concave lenses, Cartesian ray tracing (3 color-coded rays), real vs virtual images, microscope & telescope modes.',
    batch: 7,
  },
  {
    id: 'doppler-ultrasound-flow-explorer',
    curatedKey: 'dopplerUltrasoundExplorer',
    title: '65. Doppler Ultrasound & Flow Imaging',
    badge: 'Δf = 2f₀v cos θ / c',
    icon: '🩺',
    category: 'Optics & Waves',
    shortDesc: 'Piezoelectric probe, soft-tissue window, flowing red blood cells, beam angle θ protractor & spectral Doppler shift.',
    batch: 7,
  },
  {
    id: 'earth-magnetic-field-magnetosphere-explorer',
    curatedKey: 'earthMagnetosphereExplorer',
    title: "66. Earth's Magnetosphere Explorer",
    badge: 'Dipole & Solar Wind',
    icon: '🌍',
    category: 'Astrophysics',
    shortDesc: 'Rotating Earth with 11.5° tilted magnetic dipole, solar wind ram pressure, dayside magnetopause, magnetotail & auroras.',
    batch: 7,
  },
  {
    id: 'semiconductor-pn-junction-diode-explorer',
    curatedKey: 'semiconductorPnJunctionExplorer',
    title: '67. Semiconductor p–n Junction & Diode',
    badge: 'Band Gap & Shockley I–V',
    icon: '🔬',
    category: 'Modern & Quantum',
    shortDesc: 'Doped p-type/n-type lattice, space-charge depletion zone W, holes & electrons, 3D E_c/E_v energy bands & diode I–V curve.',
    batch: 7,
  },
  {
    id: 'radioactive-decay-halflife-radiation-lab',
    curatedKey: 'radioactiveDecayRadiationLab',
    title: '68. Radioactive Decay & α–β–γ Lab',
    badge: 'N(t) = N₀e^(−λt)',
    icon: '☢️',
    category: 'Modern & Quantum',
    shortDesc: 'Decaying parent/daughter nuclide lattice, magnetic Lorentz deflection of α/β⁻/γ beams, Paper/Al/Lead shields & GM counter.',
    batch: 7,
  },
];

export const ALL_PHYSICS_PAGE_MODELS = [
  ...PHYSICS_BATCH_1_MODELS,
  ...PHYSICS_BATCH_3_MODELS,
  ...PHYSICS_ADVANCED_BATCH_1_MODELS,
  ...PHYSICS_ADVANCED_BATCH_2_MODELS,
  ...PHYSICS_ADVANCED_BATCH_3_MODELS,
  ...PHYSICS_ADVANCED_BATCH_4_MODELS,
];

export const PhysicsLabPage: React.FC = () => {
  const [activeBatch, setActiveBatch] = useState<1 | 3 | 4 | 5 | 6 | 7>(1);
  const [activeModelId, setActiveModelId] = useState<string>('solar-system');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'universal' | 'scene'>('universal');
  const [showLabels, setShowLabels] = useState(true);

  // Find active meta
  const activeMeta = useMemo(() => {
    return ALL_PHYSICS_PAGE_MODELS.find((m) => m.id === activeModelId) || ALL_PHYSICS_PAGE_MODELS[0];
  }, [activeModelId]);

  // Retrieve curated model spec
  const modelSpec: ScientificModelSpec = useMemo(() => {
    return CURATED_AI_MODELS[activeMeta.curatedKey];
  }, [activeMeta]);

  // Model parameters state
  const [parametersState, setParametersState] = useState<Record<string, Record<string, number>>>(() => {
    const initial: Record<string, Record<string, number>> = {};
    ALL_PHYSICS_PAGE_MODELS.forEach((m) => {
      const spec = CURATED_AI_MODELS[m.curatedKey];
      initial[m.id] = {};
      if (spec?.parameters) {
        Object.values(spec.parameters).forEach((p) => {
          initial[m.id][p.id] = p.defaultValue;
        });
      }
    });
    return initial;
  });

  // Model conditions state
  const [conditionsState, setConditionsState] = useState<Record<string, Record<string, boolean>>>(() => {
    const initial: Record<string, Record<string, boolean>> = {};
    ALL_PHYSICS_PAGE_MODELS.forEach((m) => {
      const spec = CURATED_AI_MODELS[m.curatedKey];
      initial[m.id] = {};
      if (spec?.conditions) {
        Object.values(spec.conditions).forEach((c) => {
          initial[m.id][c.id] = Boolean(c.defaultValue);
        });
      }
    });
    return initial;
  });

  const activeParams = parametersState[activeModelId] || {};
  const activeConditions = conditionsState[activeModelId] || {};

  // Specialized scene parameters fallback for projectile, pendulum, and circuit
  const [projectileParams, setProjectileParams] = useState<ProjectileParams>({
    velocity: 25,
    angle: 45,
    mass: 1.0,
    gravity: 9.81,
    launchHeight: 0,
    airResistance: false,
    windSpeed: 0,
  });

  const [pendulumParams, setPendulumParams] = useState<PendulumParams>({
    length: 1.5,
    mass: 1.0,
    initialAngle: 30,
    gravity: 9.81,
    damping: false,
  });

  const [circuitParams, setCircuitParams] = useState<CircuitParams>({
    voltage: 12,
    resistance: 6,
    switchClosed: true,
  });

  const projectileResults: ProjectileResults = useMemo(
    () => calculateProjectileMotion(projectileParams),
    [projectileParams]
  );
  const pendulumResults: PendulumResults = useMemo(
    () => calculatePendulumMetrics(pendulumParams),
    [pendulumParams]
  );
  const circuitResults: CircuitResults = useMemo(
    () => calculateCircuitState(circuitParams),
    [circuitParams]
  );

  const handleUpdateParameter = (paramId: string, val: number) => {
    setParametersState((prev) => ({
      ...prev,
      [activeModelId]: {
        ...prev[activeModelId],
        [paramId]: val,
      },
    }));

    // Sync specialized parameters if active model matches
    if (activeModelId === 'projectile-motion') {
      if (paramId === 'velocity') setProjectileParams((p) => ({ ...p, velocity: val }));
      if (paramId === 'angle') setProjectileParams((p) => ({ ...p, angle: val }));
      if (paramId === 'gravity') setProjectileParams((p) => ({ ...p, gravity: val }));
    } else if (activeModelId === 'simple-pendulum') {
      if (paramId === 'length') setPendulumParams((p) => ({ ...p, length: val }));
      if (paramId === 'gravity') setPendulumParams((p) => ({ ...p, gravity: val }));
      if (paramId === 'initialAngle') setPendulumParams((p) => ({ ...p, initialAngle: val }));
    } else if (activeModelId === 'electric-circuit') {
      if (paramId === 'voltage') setCircuitParams((p) => ({ ...p, voltage: val }));
      if (paramId === 'resistance') setCircuitParams((p) => ({ ...p, resistance: val }));
    }
  };

  const handleUpdateCondition = (condId: string, val: boolean) => {
    setConditionsState((prev) => ({
      ...prev,
      [activeModelId]: {
        ...prev[activeModelId],
        [condId]: val,
      },
    }));

    if (activeModelId === 'electric-circuit' && condId === 'switchClosed') {
      setCircuitParams((p) => ({ ...p, switchClosed: val }));
    }
  };

  const handleResetParameters = () => {
    if (!modelSpec?.parameters) return;
    const defaults: Record<string, number> = {};
    Object.values(modelSpec.parameters).forEach((p) => {
      defaults[p.id] = p.defaultValue;
    });
    setParametersState((prev) => ({
      ...prev,
      [activeModelId]: defaults,
    }));
  };

  // Educational Data synthesis
  const currentEducationalData: ExplanationData = useMemo(() => {
    const params = activeParams;
    let observation = `Active parameters: ${Object.entries(params)
      .map(([k, v]) => `${k} = ${v}`)
      .join(', ')}.`;
    let whyExp = modelSpec.howDoesItWork;

    if (activeModelId === 'solar-system') {
      observation = `Simulation running with orbital speed multiplier ${params.simulationSpeed ?? 1.0}×. All 8 planets orbit according to Keplerian velocity v = √(GM/r).`;
      whyExp = `Kepler's 3rd Law states T² ∝ r³. Mercury (0.39 AU) completes an orbit in 88 days, whereas Neptune (30.1 AU) takes 164.8 Earth years. Planetary orbital speed drops rapidly as distance from the Sun increases.`;
    } else if (activeModelId === 'simple-pendulum') {
      const L = params.length ?? 1.5;
      const g = params.gravity ?? 9.81;
      const T = (2 * Math.PI * Math.sqrt(L / g)).toFixed(2);
      observation = `String length L = ${L}m, gravity g = ${g} m/s²: Calculated period T = ${T}s.`;
      whyExp = `Galileo discovered the isochronism of the pendulum: period depends exclusively on string length L and gravity g (T = 2π√(L/g)). Bob mass cancels out completely!`;
    } else if (activeModelId === 'projectile-motion') {
      const v0 = params.velocity ?? 25;
      const ang = params.angle ?? 45;
      const g = params.gravity ?? 9.81;
      const theta = (ang * Math.PI) / 180;
      const R = ((v0 * v0 * Math.sin(2 * theta)) / g).toFixed(1);
      const H = ((v0 * v0 * Math.sin(theta) * Math.sin(theta)) / (2 * g)).toFixed(1);
      observation = `Initial speed v₀ = ${v0} m/s @ ${ang}°: Theoretical Range R = ${R}m, Peak Apex H_max = ${H}m.`;
      whyExp = `Horizontal velocity remains constant (zero horizontal force in vacuum), while vertical velocity decelerates under downward gravity. 45° maximizes ground range R = (v₀² sin 2θ)/g in vacuum.`;
    } else if (activeModelId === 'inclined-plane') {
      const thetaDeg = params.slopeAngle ?? 30;
      const mu = params.frictionCoefficient ?? 0.35;
      const theta = (thetaDeg * Math.PI) / 180;
      const slides = Math.tan(theta) > mu;
      const a = slides ? (9.81 * (Math.sin(theta) - mu * Math.cos(theta))).toFixed(2) : '0.00';
      observation = `Ramp inclination θ = ${thetaDeg}°, friction μ = ${mu}: Block is ${slides ? `SLIDING with acceleration a = ${a} m/s²` : 'STATIONARY (static friction holds)'}.`;
      whyExp = `Weight resolves into normal force F_N = mg cos θ and downslope component F_parallel = mg sin θ. Sliding begins when tan θ > μ (the critical angle of repose). Mass cancels out in downhill acceleration!`;
    } else if (activeModelId === 'class-1-lever') {
      const loadW = params.loadWeight ?? 50;
      const effArm = params.effortArmLength ?? 2.5;
      const loadArm = 2.5;
      const ma = (effArm / loadArm).toFixed(2);
      const effortReq = ((loadW * loadArm) / effArm).toFixed(1);
      observation = `Effort arm = ${effArm}m, Load arm = ${loadArm}m: Mechanical Advantage = ${ma}×. Effort needed = ${effortReq} kg.`;
      whyExp = `Archimedes' Law of Moments: τ = F · d. A longer effort arm multiplies applied torque around the fulcrum, enabling a small force to balance or lift a much heavier load.`;
    } else if (activeModelId === 'hydraulic-lift') {
      const f1 = params.inputForce ?? 200;
      const a1 = params.smallPistonArea ?? 10;
      const a2 = params.largePistonArea ?? 100;
      const ma = (a2 / a1).toFixed(1);
      const f2 = (f1 * (a2 / a1)).toFixed(0);
      const p = (f1 / a1).toFixed(1);
      observation = `Input Force F₁ = ${f1}N on A₁ = ${a1}cm² creates pressure P = ${p} N/cm²: Multiplied Output Force F₂ = ${f2}N (IMA = ${ma}×).`;
      whyExp = `Pascal's Principle: Pressure applied to an enclosed liquid transmits undiminished in all directions. Because P = F₁/A₁ = F₂/A₂, output force is multiplied by the area ratio A₂/A₁!`;
    } else if (activeModelId === 'newtons-cradle') {
      const count = params.ballCountDisplaced ?? 1;
      const angle = params.releaseAngle ?? 35;
      const L = params.pendulumLength ?? 1.6;
      const g = params.gravity ?? 9.8;
      const e = params.elasticity ?? 0.99;
      const period = (2 * Math.PI * Math.sqrt(L / g)).toFixed(2);
      const impactVel = Math.sqrt(2 * g * L * (1 - Math.cos((angle * Math.PI) / 180))).toFixed(2);
      observation = `${count} sphere(s) released from θ₀ = ${angle}° (L = ${L}m, g = ${g}m/s², e = ${e}): Impact velocity v = ${impactVel} m/s, Period T = ${period}s. Elastic compressive shockwave transfers momentum, ejecting exactly ${count} sphere(s) on opposite side!`;
      whyExp = `Simultaneous conservation of linear momentum (∑p = mv) and kinetic energy (∑Ek = ½mv²) in one dimension requires that the number of incoming spheres equals the number of outgoing spheres. Pendulum timing is governed by period T = 2π√(L/g), and collision damping by coefficient of restitution e.`;
    } else if (activeModelId === 'reflection-refraction') {
      const th1Deg = params.incidentAngle ?? 45;
      const n2 = params.refractiveIndex ?? 1.5;
      const th1 = (th1Deg * Math.PI) / 180;
      const sinTh2 = Math.sin(th1) / n2;
      const th2Deg = sinTh2 <= 1 ? ((Math.asin(sinTh2) * 180) / Math.PI).toFixed(1) : 'TIR';
      observation = `Angle of incidence θ₁ = ${th1Deg}°, Glass index n₂ = ${n2}: Reflected angle = ${th1Deg}°, Refracted angle θ₂ = ${th2Deg}°.`;
      whyExp = `Law of Reflection: θ_r = θ_i. Snell's Law: n₁ sin θ₁ = n₂ sin θ₂. Light slows down upon entering higher optical density (v = c/n), bending toward the surface normal.`;
    } else if (activeModelId === 'prism-dispersion') {
      const incDeg = params.incidentAngle ?? 45;
      const abbe = params.dispersionStrength ?? 35;
      const apex = params.prismApexAngle ?? 60;
      observation = `Incident white beam at θ₁ = ${incDeg}° through ${apex}° equilateral glass prism (Abbe ν = ${abbe}): Normal dispersion refracts light at both interfaces into a full ROYGBIV spectrum; violet (400nm) deviates most, red (700nm) deviates least.`;
      whyExp = `Snell's Law (n₁ sin θ₁ = n₂ sin θ₂) & Cauchy dispersion (dn/dλ < 0): Glass has higher refractive index for high-frequency violet (n ≈ 1.532) than red (n ≈ 1.514). Violet bends more towards the normal upon entering and further away upon exiting into air, producing the continuous rainbow spectrum.`;
    } else if (activeModelId === 'electric-circuit') {
      const v = params.voltage ?? 12;
      const r = params.resistance ?? 6;
      const isClosed = activeConditions.switchClosed !== false;
      const current = isClosed ? (v / r).toFixed(2) : '0.00';
      const power = isClosed ? ((v * v) / r).toFixed(1) : '0.0';
      observation = `Voltage V = ${v}V, Resistance R = ${r}Ω, Switch = ${isClosed ? 'CLOSED' : 'OPEN'}: Current I = ${current}A, Power P = ${power}W.`;
      whyExp = `Ohm's Law: I = V / R. Joule Heating: P = I²R = V²/R. When the switch is closed, electromotive force drives electron drift. Filament resistance converts electrical energy into incandescent visible glow.`;
    }

    return {
      title: modelSpec.title,
      badge: activeMeta.badge,
      subtitle: `${modelSpec.concept} · ${activeMeta.category}`,
      whatIsIt: modelSpec.whatIsIt,
      howDoesItWork: modelSpec.howDoesItWork,
      realLifeExample: modelSpec.realLifeExample,
      observation,
      whyTitle: 'HOW DO THE GOVERNING EQUATIONS WORK?',
      whyExplanation: whyExp,
      examConnection: modelSpec.examConnection,
      formula: (modelSpec.equations || []).join('  |  '),
    };
  }, [activeModelId, activeMeta, modelSpec, activeParams, activeConditions]);

  // Model-Aware Chatbot Context
  const chatbotContext: ModelChatContext = useMemo(() => {
    return {
      modelId: activeModelId,
      title: modelSpec.title,
      subject: `Physics / ${activeMeta.category}`,
      concept: modelSpec.concept,
      description: modelSpec.description,
      parameters: activeParams,
      results: {
        equations: modelSpec.equations,
        conditions: activeConditions,
      },
      recentChange: null,
      components: modelSpec.parts.map((p) => ({
        id: p.id,
        name: p.name,
        whatIsIt: p.whatIsIt || p.description,
        whatDoesItDo: p.whatDoesItDo || p.description,
        description: p.description,
      })),
    };
  }, [activeModelId, activeMeta, modelSpec, activeParams, activeConditions]);

  const categories = ['All', 'Astrophysics', 'Mechanics', 'Fluids & Work', 'Optics & Waves', 'Electromagnetism', 'Thermodynamics', 'Electromechanical', 'Modern & Quantum'];

  const currentBatchModels = useMemo(() => {
    if (activeBatch === 1) return PHYSICS_BATCH_1_MODELS;
    if (activeBatch === 3) return PHYSICS_BATCH_3_MODELS;
    if (activeBatch === 4) return PHYSICS_ADVANCED_BATCH_1_MODELS;
    if (activeBatch === 5) return PHYSICS_ADVANCED_BATCH_2_MODELS;
    if (activeBatch === 6) return PHYSICS_ADVANCED_BATCH_3_MODELS;
    return PHYSICS_ADVANCED_BATCH_4_MODELS;
  }, [activeBatch]);

  const filteredModels = useMemo(() => {
    if (selectedCategory === 'All') return currentBatchModels;
    return currentBatchModels.filter((m) => m.category === selectedCategory);
  }, [currentBatchModels, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">Physics & Engineering Lab</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">
              {activeBatch === 1
                ? 'Batch 1: Foundational Physics (Models 1–10)'
                : activeBatch === 3
                ? 'Batch 3: Electromagnetism & Machines (Models 31–40)'
                : activeBatch === 4
                ? 'Physics Batch 1 (Models 41–47)'
                : activeBatch === 5
                ? 'Physics Batch 2 (Models 48–54)'
                : activeBatch === 6
                ? 'Physics Batch 3 (Models 55–61)'
                : 'Physics Batch 4 (Models 62–68)'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1 flex items-center gap-2.5">
            <span>{activeMeta.icon}</span>
            <span>{modelSpec.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            {modelSpec.description}
          </p>
        </div>

        {/* Batch & Category Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {/* Batch Selector */}
          <div className="flex items-center flex-wrap gap-1 p-1 bg-slate-200/80 rounded-xl">
            <button
              onClick={() => {
                setActiveBatch(1);
                if (activeBatch !== 1) setActiveModelId('solar-system');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeBatch === 1 ? 'bg-white text-sky-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Foundational (1–10)
            </button>
            <button
              onClick={() => {
                setActiveBatch(3);
                if (activeBatch !== 3) setActiveModelId('ac-generator');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeBatch === 3 ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Machines (31–40)
            </button>
            <button
              onClick={() => {
                setActiveBatch(4);
                if (activeBatch !== 4) setActiveModelId('electromagnetic-wave-propagation');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeBatch === 4 ? 'bg-white text-violet-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Batch 1 (41–47)
            </button>
            <button
              onClick={() => {
                setActiveBatch(5);
                if (activeBatch !== 5) setActiveModelId('faraday-law-induction-explorer');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeBatch === 5 ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Batch 2 (48–54)
            </button>
            <button
              onClick={() => {
                setActiveBatch(6);
                if (activeBatch !== 6) setActiveModelId('doppler-effect-sonic-boom-explorer');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeBatch === 6 ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Batch 3 (55–61)
            </button>
            <button
              onClick={() => {
                setActiveBatch(7);
                if (activeBatch !== 7) setActiveModelId('maxwell-equations-em-field-explorer');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeBatch === 7 ? 'bg-white text-rose-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Batch 4 (62–68)
            </button>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-xl max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Models Switcher Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {filteredModels.map((model) => {
          const isActive = model.id === activeModelId;

          return (
            <button
              key={model.id}
              onClick={() => {
                setActiveModelId(model.id);
                setActiveBatch(model.batch);
              }}
              className={`flex flex-col items-start text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-sky-50/70 border-sky-400 ring-2 ring-sky-400/40 shadow-xs'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-lg">{model.icon}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-sky-200/80 text-sky-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {model.badge}
                </span>
              </div>
              <span className={`text-xs font-bold mt-1.5 line-clamp-1 ${isActive ? 'text-sky-950' : 'text-slate-900'}`}>
                {model.title}
              </span>
              <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                {model.shortDesc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Simulation Workspace */}
      {viewMode === 'scene' && (activeModelId === 'projectile-motion' || activeModelId === 'simple-pendulum' || activeModelId === 'electric-circuit') ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: 3D Interactive WebGL Viewport (Universal Callouts & Exploded View) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            {/* Dual View Mode Selector for Projectile, Pendulum, and Circuit */}
            <div className="flex items-center justify-between bg-slate-100/90 p-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-600 font-medium px-2">Display Mode:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMode('universal')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    (viewMode as 'universal' | 'scene') === 'universal'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Universal Callout 3D (Exploded View & Highlights)</span>
                </button>
                <button
                  onClick={() => setViewMode('scene')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'scene'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>Classic Laboratory Bench Scene</span>
                </button>
              </div>
            </div>

            {activeModelId === 'projectile-motion' ? (
              <ProjectileScene
                params={projectileParams}
                results={projectileResults}
                onUpdateParams={(p) => setProjectileParams((prev) => ({ ...prev, ...p }))}
                showLabels={showLabels}
                onToggleLabels={setShowLabels}
              />
            ) : activeModelId === 'simple-pendulum' ? (
              <PendulumScene
                params={pendulumParams}
                results={pendulumResults}
                onUpdateParams={(p) => setPendulumParams((prev) => ({ ...prev, ...p }))}
                showLabels={showLabels}
                onToggleLabels={setShowLabels}
              />
            ) : (
              <CircuitScene
                params={circuitParams}
                results={circuitResults}
                onUpdateParams={(p) => setCircuitParams((prev) => ({ ...prev, ...p }))}
                showLabels={showLabels}
                onToggleLabels={setShowLabels}
              />
            )}

            {/* Educational Explanation Box Directly Below Viewport */}
            <EducationalExplanationBox data={currentEducationalData} />

            {/* Actionable Curiosity Engine */}
            {modelSpec.curiosityPrompts && modelSpec.curiosityPrompts.length > 0 && (
              <CuriosityEngine
                items={modelSpec.curiosityPrompts.map((prompt, idx) => ({
                  id: `curiosity-${idx}`,
                  prompt,
                  description: `Explore governing physics principle in real time.`,
                  suggestedChanges: {},
                }))}
                onApplyCuriosity={() => {}}
              />
            )}
          </div>

          {/* Right: Experiment Parameter Controls Deck */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-sky-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Parameters & Physics
                  </h3>
                </div>
                <button
                  onClick={handleResetParameters}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  title="Reset sliders to standard defaults"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              {/* Sliders */}
              <div className="space-y-4">
                {modelSpec.parameters &&
                  Object.values(modelSpec.parameters).map((param) => {
                    const currentVal = activeParams[param.id] ?? param.defaultValue;
                    return (
                      <div key={param.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{param.name}</span>
                          <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-900">
                            {currentVal} {param.unit}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={currentVal}
                          onChange={(e) => handleUpdateParameter(param.id, parseFloat(e.target.value))}
                          className="w-full accent-sky-600 cursor-pointer"
                        />
                        <p className="text-[11px] text-slate-500 leading-tight">
                          {param.description}
                        </p>
                      </div>
                    );
                  })}
              </div>

              {/* Boolean Conditions */}
              {modelSpec.conditions && Object.keys(modelSpec.conditions).length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Experimental Conditions
                  </span>
                  {Object.values(modelSpec.conditions).map((cond) => {
                    const isChecked = activeConditions[cond.id] !== false;
                    return (
                      <label
                        key={cond.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 cursor-pointer transition-colors"
                      >
                        <div className="space-y-0.5 pr-2">
                          <span className="text-xs font-semibold text-slate-800 block">
                            {cond.name}
                          </span>
                          <span className="text-[10px] text-slate-500 block leading-tight">
                            {cond.description}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleUpdateCondition(cond.id, e.target.checked)}
                          className="w-4 h-4 rounded text-sky-600 accent-sky-600 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Governing Mathematical Equations */}
              {modelSpec.equations && modelSpec.equations.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Governing Mathematical Formulas
                  </span>
                  <div className="space-y-1.5 font-mono text-[11px] bg-slate-900 text-sky-300 p-3 rounded-xl overflow-x-auto border border-slate-800 shadow-inner">
                    {modelSpec.equations.map((eq, i) => (
                      <div key={i} className="whitespace-pre">
                        {eq}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-4">
          {(activeModelId === 'projectile-motion' || activeModelId === 'simple-pendulum' || activeModelId === 'electric-circuit') && (
            <div className="flex items-center justify-between bg-slate-100/90 p-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-600 font-medium px-2">Display Mode:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMode('universal')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'universal'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Universal Callout 3D (Exploded View & Highlights)</span>
                </button>
                <button
                  onClick={() => setViewMode('scene')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'scene'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>Classic Laboratory Bench Scene</span>
                </button>
              </div>
            </div>
          )}

          <Dynamic3DModelRenderer
            modelSpec={modelSpec}
            parameters={activeParams}
            conditions={activeConditions}
            onUpdateParameter={handleUpdateParameter}
            onUpdateCondition={handleUpdateCondition}
            showLabels={showLabels}
            onToggleLabels={setShowLabels}
          />
        </div>
      )}

      {/* Model-Aware AI Chatbot synchronized with physics experiment state */}
      <div className="pt-4 border-t border-slate-200">
        <ModelAwareChatbot context={chatbotContext} />
      </div>
    </div>
  );
};
