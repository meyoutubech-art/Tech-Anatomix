import { CURATED_AI_MODELS } from './curatedAiModels';
import { PageRoute } from '../components/layout/Navbar';
import { ScientificModelSpec } from '../types/aiModel';

export interface ModelLaunchTarget {
  route: PageRoute;
  modelId: string;
  physicsModelId?: string;
  chemistryMode?: string;
  biologyModelId?: string;
  anatomySpecimen?: 'human' | 'frog';
  aiCuratedKeyOrId?: string;
  aiProceduralPrompt?: string;
}

export interface ScienceModelDirectoryEntry {
  id: string;
  number?: number;
  title: string;
  displayLabel: string;
  category: 'Physics' | 'Chemistry' | 'Biology' | 'Anatomy' | 'Engineering & Earth Science';
  subCategory: string;
  shortDescription: string;
  implementationComponent: string;
  dataDefinitionSource: string;
  routeLabel: string;
  status: 'Active & Verified' | 'Standalone Lab Scene' | 'Procedural 3D Synthesizer';
  isInMy29Models: boolean;
  my29Number?: number;
  partsCount?: number;
  parametersCount?: number;
  launchTarget: ModelLaunchTarget;
}

export interface BackendAiServiceEntry {
  id: string;
  name: string;
  category: 'AI Route / Service' | 'Deterministic Scientific Engine';
  endpointOrFile: string;
  description: string;
  status: 'Active';
}

/**
 * Exact 29 Working Science Models requested for Section B ("My Science Models"),
 * preserving exact numbering (1-29) and exact titles.
 */
export const MY_SCIENCE_MODELS_29: ScienceModelDirectoryEntry[] = [
  {
    id: 'simple-pendulum',
    number: 1,
    title: 'Simple Pendulum',
    displayLabel: '1. Simple Pendulum',
    category: 'Physics',
    subCategory: 'Classical Mechanics & Harmonic Motion',
    shortDescription:
      'Interactive 3D harmonic oscillator with adjustable string length L, gravitational acceleration g, bob mass m, release angle θ₀, and live period T = 2π√(L/g) telemetry.',
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/components/physics/PendulumScene.tsx · src/simulations/preBatch1VisualUpgradeStudio.ts',
    dataDefinitionSource: 'src/data/curatedAiModels.ts (CURATED_AI_MODELS.pendulum)',
    routeLabel: 'Physics Lab → Batch 1: Core Physics',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 1,
    launchTarget: {
      route: 'physics',
      modelId: 'simple-pendulum',
      physicsModelId: 'simple-pendulum',
    },
  },
  {
    id: 'hydraulic-lift',
    number: 2,
    title: 'Hydraulic Lift',
    displayLabel: '2. Hydraulic Lift',
    category: 'Physics',
    subCategory: "Fluid Mechanics & Pascal's Principle",
    shortDescription:
      "Dual-cylinder hydraulic machine demonstrating Pascal's Principle (P = F₁/A₁ = F₂/A₂), incompressible fluid pressure transmission, force multiplication, and work conservation.",
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/simulations/preBatch1VisualUpgradeStudio.ts',
    dataDefinitionSource: 'src/data/curatedAiModels.ts (CURATED_AI_MODELS.hydraulicLift)',
    routeLabel: 'Physics Lab → Batch 1: Core Physics',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 2,
    launchTarget: {
      route: 'physics',
      modelId: 'hydraulic-lift',
      physicsModelId: 'hydraulic-lift',
    },
  },
  {
    id: 'newtons-cradle',
    number: 3,
    title: "Newton's Cradle",
    displayLabel: "3. Newton's Cradle",
    category: 'Physics',
    subCategory: 'Elastic Collisions & Momentum Conservation',
    shortDescription:
      'Five-sphere bifilar suspension apparatus demonstrating conservation of linear momentum (Σp = mv) and kinetic energy transfer across elastic steel impacts.',
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/simulations/preBatch1VisualUpgradeStudio.ts',
    dataDefinitionSource: 'src/data/curatedAiModels.ts (CURATED_AI_MODELS.newtonsCradle)',
    routeLabel: 'Physics Lab → Batch 1: Core Physics',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 3,
    launchTarget: {
      route: 'physics',
      modelId: 'newtons-cradle',
      physicsModelId: 'newtons-cradle',
    },
  },
  {
    id: 'rutherford-gold-foil',
    number: 4,
    title: 'Rutherford Gold Foil Experiment',
    displayLabel: '4. Rutherford Gold Foil Experiment',
    category: 'Physics',
    subCategory: 'Atomic & Nuclear Physics',
    shortDescription:
      'Alpha-particle Coulomb scattering simulator with lead collimator, ultra-thin Au-197 foil, rotatable ZnS scintillation ring, and hyperbolic backscattering trajectories.',
    implementationComponent: 'src/components/models/Dynamic3DModelRenderer.tsx · src/simulations/preBatch1VisualUpgradeStudio.ts',
    dataDefinitionSource: 'src/data/curatedAiModels.ts (CURATED_AI_MODELS.rutherford)',
    routeLabel: 'Create 3D Model Studio → Curated Preset (rutherford-gold-foil)',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 4,
    launchTarget: {
      route: 'ai-generator',
      modelId: 'rutherford-gold-foil',
      aiCuratedKeyOrId: 'rutherford-gold-foil',
    },
  },
  {
    id: 'astronomical-telescope',
    number: 5,
    title: 'Astronomical Telescope',
    displayLabel: '5. Astronomical Telescope',
    category: 'Physics',
    subCategory: 'Geometrical Optics & Instruments',
    shortDescription:
      'Keplerian refracting optical telescope with large-aperture objective lens (fₒ), adjustable eyepiece (fₑ), internal focal plane real image, and angular magnification M = fₒ/fₑ.',
    implementationComponent: 'src/components/models/Dynamic3DModelRenderer.tsx · src/simulations/preBatch1VisualUpgradeStudio.ts',
    dataDefinitionSource: 'src/data/curatedAiModels.ts (CURATED_AI_MODELS.telescope)',
    routeLabel: 'Create 3D Model Studio → Curated Preset (astronomical-telescope)',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 5,
    launchTarget: {
      route: 'ai-generator',
      modelId: 'astronomical-telescope',
      aiCuratedKeyOrId: 'astronomical-telescope',
    },
  },
  {
    id: 'wave-motion',
    number: 6,
    title: 'Wave Motion',
    displayLabel: '6. Wave Motion',
    category: 'Physics',
    subCategory: 'Oscillations & Mechanical Waves',
    shortDescription:
      'Interactive 28-node coupled oscillator array demonstrating transverse crest/trough propagation, amplitude A, wavelength λ, frequency f, and phase velocity v = fλ.',
    implementationComponent: 'src/components/models/Dynamic3DModelRenderer.tsx · src/simulations/preBatch1VisualUpgradeStudio.ts',
    dataDefinitionSource: 'src/data/curatedModelsBatch2.ts (BATCH_2_MODELS.waveMotion)',
    routeLabel: 'Create 3D Model Studio → Curated Preset (wave-motion)',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 6,
    launchTarget: {
      route: 'ai-generator',
      modelId: 'wave-motion',
      aiCuratedKeyOrId: 'wave-motion',
    },
  },
  {
    id: 'sound-wave',
    number: 7,
    title: 'Sound Waves',
    displayLabel: '7. Sound Waves',
    category: 'Physics',
    subCategory: 'Acoustics & Longitudinal Waves',
    shortDescription:
      'Acoustic speaker cone driving longitudinal air particle compressions and rarefactions across an impedance tube with pitch (frequency) and loudness (amplitude) controls.',
    implementationComponent: 'src/components/models/Dynamic3DModelRenderer.tsx · src/simulations/preBatch1VisualUpgradeStudio.ts',
    dataDefinitionSource: 'src/data/curatedModelsBatch2.ts (BATCH_2_MODELS.soundWave)',
    routeLabel: 'Create 3D Model Studio → Curated Preset (sound-wave)',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 7,
    launchTarget: {
      route: 'ai-generator',
      modelId: 'sound-wave',
      aiCuratedKeyOrId: 'sound-wave',
    },
  },
  {
    id: 'dc-motor',
    number: 8,
    title: 'DC Electric Motor',
    displayLabel: '8. DC Electric Motor',
    category: 'Physics',
    subCategory: 'Electromagnetism & Lorentz Torque',
    shortDescription:
      'Direct current electric motor with N/S stator magnets, rotating copper armature coil, split-ring commutator, carbon brushes, and Fleming Left-Hand Rule Lorentz force vectors.',
    implementationComponent: 'src/components/models/Dynamic3DModelRenderer.tsx · src/simulations/preBatch1VisualUpgradeStudio.ts',
    dataDefinitionSource: 'src/data/curatedAiModels.ts (CURATED_AI_MODELS.motor)',
    routeLabel: 'Create 3D Model Studio → Curated Preset (dc-motor)',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 8,
    launchTarget: {
      route: 'ai-generator',
      modelId: 'dc-motor',
      aiCuratedKeyOrId: 'dc-motor',
    },
  },
  {
    id: 'interactive-atom',
    number: 9,
    title: 'Interactive Atom Explorer',
    displayLabel: '9. Interactive Atom Explorer',
    category: 'Physics',
    subCategory: 'Atomic Structure & Quantum Shells',
    shortDescription:
      '3D Bohr-Rutherford atomic structure visualizer with proton/neutron nucleon cluster, concentric K/L/M electron shells (2n²), valence electrons, and atomic number Z selector.',
    implementationComponent: 'src/components/models/Dynamic3DModelRenderer.tsx · src/simulations/preBatch1VisualUpgradeStudio.ts',
    dataDefinitionSource: 'src/data/curatedModelsBatch2.ts (BATCH_2_MODELS.atomExplorer)',
    routeLabel: 'Create 3D Model Studio → Curated Preset (interactive-atom)',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 9,
    launchTarget: {
      route: 'ai-generator',
      modelId: 'interactive-atom',
      aiCuratedKeyOrId: 'interactive-atom',
    },
  },
  {
    id: 'heat-transfer-explorer',
    number: 10,
    title: 'Heat Explorer',
    displayLabel: '10. Heat Explorer',
    category: 'Physics',
    subCategory: 'Thermodynamics & Heat Transfer',
    shortDescription:
      'Unified thermal physics bench demonstrating Fourier conduction across a metal rod, convective fluid circulation cells, and Stefan-Boltzmann infrared thermal radiation.',
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/components/models/Dynamic3DModelRenderer.tsx',
    dataDefinitionSource: 'src/data/curatedModelsBatch5.ts (BATCH_3_MODELS.heatTransferExplorer)',
    routeLabel: 'Physics Lab → Batch 3: Electromechanics & Thermal',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 10,
    launchTarget: {
      route: 'physics',
      modelId: 'heat-transfer-explorer',
      physicsModelId: 'heat-transfer-explorer',
    },
  },
  {
    id: 'brain-explorer',
    number: 11,
    title: 'Brain Explorer',
    displayLabel: '11. Brain Explorer',
    category: 'Biology',
    subCategory: 'Neurobiology & Central Nervous System',
    shortDescription:
      '3D human encephalon anatomy featuring frontal, parietal, temporal, and occipital cerebral lobes, cerebellum, brainstem, corpus callosum, and limbic thalamus/hypothalamus.',
    implementationComponent: 'src/pages/BiologyLabPage.tsx · src/components/models/Dynamic3DModelRenderer.tsx',
    dataDefinitionSource: 'src/data/curatedModelsBatch3.ts (BIOLOGY_BATCH_1_MODELS.brainExplorer)',
    routeLabel: 'Biology Lab → Human Brain Explorer',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 11,
    launchTarget: {
      route: 'biology',
      modelId: 'brain-explorer',
      biologyModelId: 'brain-explorer',
    },
  },
  {
    id: 'blood-transport',
    number: 12,
    title: 'Blood Transport',
    displayLabel: '12. Blood Transport',
    category: 'Biology',
    subCategory: 'Hematology & Microcirculation',
    shortDescription:
      '3D blood vessel cutaway showing biconcave erythrocytes (RBCs), leukocytes (WBCs), platelets, plasma flow, and capillary alveolar/tissue O₂–CO₂ gas exchange.',
    implementationComponent: 'src/pages/BiologyLabPage.tsx · src/components/models/Dynamic3DModelRenderer.tsx',
    dataDefinitionSource: 'src/data/curatedModelsBatch4.ts (BIOLOGY_BATCH_2_MODELS.bloodTransport)',
    routeLabel: 'Biology Lab → Blood & Circulation Transport',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 12,
    launchTarget: {
      route: 'biology',
      modelId: 'blood-transport',
      biologyModelId: 'blood-transport',
    },
  },
  {
    id: 'faraday-law-induction-explorer',
    number: 13,
    title: "Faraday's Law / Induction Explorer",
    displayLabel: "13. Faraday's Law / Induction Explorer",
    category: 'Physics',
    subCategory: 'Electromagnetic Induction & Lenz Law',
    shortDescription:
      "Quantitative Faraday-Lenz induction workstation (ε = −N dΦ_B/dt) with plunging dipole magnet, multi-turn copper solenoid, Lenz opposing field vectors, and live EMF galvanometer.",
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/simulations/advancedPhysicsBatch2Studio.ts',
    dataDefinitionSource: 'src/data/curatedModelsAdvancedPhysicsBatch2.ts (ADVANCED_PHYSICS_BATCH_2_MODELS.faradayLawInduction)',
    routeLabel: 'Physics Lab → Batch 5: Advanced Physics II',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 13,
    launchTarget: {
      route: 'physics',
      modelId: 'faraday-law-induction-explorer',
      physicsModelId: 'faraday-law-induction-explorer',
    },
  },
  {
    id: 'electric-bell',
    number: 14,
    title: 'Electric Bell',
    displayLabel: '14. Electric Bell',
    category: 'Physics',
    subCategory: 'Electromechanical Self-Interrupting Circuit',
    shortDescription:
      ' horseshoe electromagnet, spring-loaded soft-iron armature, make-and-break contact screw, striker hammer, and brass gong illustrating cyclic magnetic attraction and circuit interruption.',
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/components/models/Dynamic3DModelRenderer.tsx',
    dataDefinitionSource: 'src/data/curatedModelsBatch5.ts (BATCH_3_MODELS.electricBell)',
    routeLabel: 'Physics Lab → Batch 3: Electromechanics & Thermal',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 14,
    launchTarget: {
      route: 'physics',
      modelId: 'electric-bell',
      physicsModelId: 'electric-bell',
    },
  },
  {
    id: 'motor-effect-fleming',
    number: 15,
    title: 'Motor Effect',
    displayLabel: '15. Motor Effect',
    category: 'Physics',
    subCategory: "Electromagnetism & Fleming's Left-Hand Rule",
    shortDescription:
      'Current-carrying copper conductor rod on brass rails inside a horseshoe magnetic field, demonstrating orthogonal Lorentz force F = BIL sin θ and 3D vector triad.',
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/components/models/Dynamic3DModelRenderer.tsx',
    dataDefinitionSource: 'src/data/curatedModelsBatch5.ts (BATCH_3_MODELS.motorEffectFleming)',
    routeLabel: 'Physics Lab → Batch 3: Electromechanics & Thermal',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 15,
    launchTarget: {
      route: 'physics',
      modelId: 'motor-effect-fleming',
      physicsModelId: 'motor-effect-fleming',
    },
  },
  {
    id: 'plasma-physics-explorer',
    number: 16,
    title: 'Plasma Physics Explorer',
    displayLabel: '16. Plasma Physics Explorer',
    category: 'Physics',
    subCategory: 'Ionized Gases & Magnetohydrodynamics',
    shortDescription:
      'Fourth-state-of-matter simulator showing thermal ionization fraction, electron/ion Lorentz gyromotion (r_L = mv⊥/|q|B), E×B drift, Debye shielding λ_D, and plasma frequency ω_pe.',
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/simulations/advancedPhysicsBatch1Studio.ts',
    dataDefinitionSource: 'src/data/curatedModelsAdvancedPhysicsBatch1.ts (ADVANCED_PHYSICS_BATCH_1_MODELS.plasmaPhysics)',
    routeLabel: 'Physics Lab → Batch 4: Advanced Physics I',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 16,
    launchTarget: {
      route: 'physics',
      modelId: 'plasma-physics-explorer',
      physicsModelId: 'plasma-physics-explorer',
    },
  },
  {
    id: 'particle-accelerator-explorer',
    number: 17,
    title: 'Particle Accelerator Explorer',
    displayLabel: '17. Particle Accelerator Explorer',
    category: 'Physics',
    subCategory: 'Relativistic Beam Dynamics & Synchrotron Ring',
    shortDescription:
      'Circular synchrotron/cyclotron ring with RF accelerating cavities, dipole bending magnets, quadrupole focusing lenses, Lorentz factor γ, and cherenkov/collision detector.',
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/simulations/advancedPhysicsBatch1Studio.ts',
    dataDefinitionSource: 'src/data/curatedModelsAdvancedPhysicsBatch1.ts (ADVANCED_PHYSICS_BATCH_1_MODELS.particleAccelerator)',
    routeLabel: 'Physics Lab → Batch 4: Advanced Physics I',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 17,
    launchTarget: {
      route: 'physics',
      modelId: 'particle-accelerator-explorer',
      physicsModelId: 'particle-accelerator-explorer',
    },
  },
  {
    id: 'magnetic-levitation-explorer',
    number: 18,
    title: 'Magnetic Levitation / Maglev Train',
    displayLabel: '18. Magnetic Levitation / Maglev Train',
    category: 'Physics',
    subCategory: 'Electrodynamic Suspension & Linear Motor Propulsion',
    shortDescription:
      'High-speed Maglev train vehicle over guideway coils showing levitation air gap h, magnetic lift F_mag vs gravity mg, lateral guidance restoring force, and linear synchronous wave propulsion.',
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/simulations/advancedPhysicsBatch1Studio.ts',
    dataDefinitionSource: 'src/data/curatedModelsAdvancedPhysicsBatch1.ts (ADVANCED_PHYSICS_BATCH_1_MODELS.magneticLevitation)',
    routeLabel: 'Physics Lab → Batch 4: Advanced Physics I',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 18,
    launchTarget: {
      route: 'physics',
      modelId: 'magnetic-levitation-explorer',
      physicsModelId: 'magnetic-levitation-explorer',
    },
  },
  {
    id: 'superconductivity-meissner-explorer',
    number: 19,
    title: 'Superconductivity & Meissner Effect',
    displayLabel: '19. Superconductivity & Meissner Effect',
    category: 'Physics',
    subCategory: 'Condensed Matter & Quantum Flux Expulsion',
    shortDescription:
      'YBCO superconductor disc cooled below critical temperature T_c (92 K) with liquid nitrogen, exhibiting zero DC resistance, complete magnetic flux expulsion (B = 0), and quantum flux pinning.',
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/simulations/advancedPhysicsBatch1Studio.ts',
    dataDefinitionSource: 'src/data/curatedModelsAdvancedPhysicsBatch1.ts (ADVANCED_PHYSICS_BATCH_1_MODELS.superconductivityMeissner)',
    routeLabel: 'Physics Lab → Batch 4: Advanced Physics I',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 19,
    launchTarget: {
      route: 'physics',
      modelId: 'superconductivity-meissner-explorer',
      physicsModelId: 'superconductivity-meissner-explorer',
    },
  },
  {
    id: 'motor-generator-energy-explorer',
    number: 20,
    title: 'Motor & Generator',
    displayLabel: '20. Motor & Generator',
    category: 'Physics',
    subCategory: 'Electromechanical Energy Conversion',
    shortDescription:
      'Dual-mode rotating armature machine comparing DC Motor Mode (electrical input → Lorentz torque τ = NIAB sin θ) and AC/DC Generator Mode (mechanical turbine → induced EMF) with slip-ring vs split-ring commutators.',
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/simulations/advancedPhysicsBatch2Studio.ts',
    dataDefinitionSource: 'src/data/curatedModelsAdvancedPhysicsBatch2.ts (ADVANCED_PHYSICS_BATCH_2_MODELS.motorGeneratorConversion)',
    routeLabel: 'Physics Lab → Batch 5: Advanced Physics II',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 20,
    launchTarget: {
      route: 'physics',
      modelId: 'motor-generator-energy-explorer',
      physicsModelId: 'motor-generator-energy-explorer',
    },
  },
  {
    id: 'wave-interference-diffraction-lab',
    number: 21,
    title: 'Wave Interference & Diffraction Lab',
    displayLabel: '21. Wave Interference & Diffraction Lab',
    category: 'Physics',
    subCategory: "Physical Optics & Young's Double-Slit",
    shortDescription:
      'Coherent wavefront superposition, Young double-slit constructive/destructive interference (d sin θ = mλ), single-slit Fraunhofer diffraction envelope, and 3D screen irradiance profile I(y).',
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/simulations/advancedPhysicsBatch2Studio.ts',
    dataDefinitionSource: 'src/data/curatedModelsAdvancedPhysicsBatch2.ts (ADVANCED_PHYSICS_BATCH_2_MODELS.waveInterferenceDiffraction)',
    routeLabel: 'Physics Lab → Batch 5: Advanced Physics II',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 21,
    launchTarget: {
      route: 'physics',
      modelId: 'wave-interference-diffraction-lab',
      physicsModelId: 'wave-interference-diffraction-lab',
    },
  },
  {
    id: 'tokamak-fusion-confinement-explorer',
    number: 22,
    title: 'Nuclear Fusion Reactor',
    displayLabel: '22. Nuclear Fusion Reactor',
    category: 'Physics',
    subCategory: 'Tokamak Magnetic Confinement & D–T Fusion',
    shortDescription:
      'Toroidal magnetic fusion reactor with superconducting toroidal (B_T) and poloidal (B_p) field coils, central solenoid, helical field line twist (safety factor q₉₅), and Lawson triple product.',
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/simulations/advancedPhysicsBatch2Studio.ts',
    dataDefinitionSource: 'src/data/curatedModelsAdvancedPhysicsBatch2.ts (ADVANCED_PHYSICS_BATCH_2_MODELS.nuclearFusionTokamak)',
    routeLabel: 'Physics Lab → Batch 5: Advanced Physics II',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 22,
    launchTarget: {
      route: 'physics',
      modelId: 'tokamak-fusion-confinement-explorer',
      physicsModelId: 'tokamak-fusion-confinement-explorer',
    },
  },
  {
    id: 'doppler-effect-sonic-boom-explorer',
    number: 23,
    title: 'Doppler Effect & Sonic Boom Explorer',
    displayLabel: '23. Doppler Effect & Sonic Boom Explorer',
    category: 'Physics',
    subCategory: 'Acoustics, Wavefronts & Supersonic Mach Cone',
    shortDescription:
      'Moving acoustic emitter generating eccentric spherical wavefronts, approaching/receding Doppler frequency shifts, transonic shock wall (M = 1), and supersonic Mach cone (sin μ = 1/M).',
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/simulations/advancedPhysicsBatch3Studio.ts',
    dataDefinitionSource: 'src/data/curatedModelsAdvancedPhysicsBatch3.ts (ADVANCED_PHYSICS_BATCH_3_MODELS.dopplerEffectSonicBoom)',
    routeLabel: 'Physics Lab → Batch 6: Advanced Physics III',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 23,
    launchTarget: {
      route: 'physics',
      modelId: 'doppler-effect-sonic-boom-explorer',
      physicsModelId: 'doppler-effect-sonic-boom-explorer',
    },
  },
  {
    id: 'gyroscope-torque-angular-momentum-lab',
    number: 24,
    title: 'Gyroscope',
    displayLabel: '24. Gyroscope',
    category: 'Physics',
    subCategory: 'Rotational Dynamics & Precession',
    shortDescription:
      'High-inertia brass flywheel in a 3-axis Cardan gimbal demonstrating angular momentum L = Iω, gravitational torque τ = r × mg, gyroscopic precession Ω_p = mgr/(Iω), and nutation.',
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/simulations/advancedPhysicsBatch3Studio.ts',
    dataDefinitionSource: 'src/data/curatedModelsAdvancedPhysicsBatch3.ts (ADVANCED_PHYSICS_BATCH_3_MODELS.gyroscopeAngularMomentum)',
    routeLabel: 'Physics Lab → Batch 6: Advanced Physics III',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 24,
    launchTarget: {
      route: 'physics',
      modelId: 'gyroscope-torque-angular-momentum-lab',
      physicsModelId: 'gyroscope-torque-angular-momentum-lab',
    },
  },
  {
    id: 'shm-coupled-oscillators-lab',
    number: 25,
    title: 'Simple Harmonic Motion / Coupled Oscillators',
    displayLabel: '25. Simple Harmonic Motion / Coupled Oscillators',
    category: 'Physics',
    subCategory: 'Normal Modes, Beats & Energy Exchange',
    shortDescription:
      'Dual spring-coupled masses on a frictionless air track demonstrating symmetric in-phase (ω₁) and antisymmetric out-of-phase (ω₂) eigenmodes, beat frequency Δω, and K+U energy transfer.',
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/simulations/advancedPhysicsBatch3Studio.ts',
    dataDefinitionSource: 'src/data/curatedModelsAdvancedPhysicsBatch3.ts (ADVANCED_PHYSICS_BATCH_3_MODELS.shmCoupledOscillators)',
    routeLabel: 'Physics Lab → Batch 6: Advanced Physics III',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 25,
    launchTarget: {
      route: 'physics',
      modelId: 'shm-coupled-oscillators-lab',
      physicsModelId: 'shm-coupled-oscillators-lab',
    },
  },
  {
    id: 'maxwell-equations-em-field-explorer',
    number: 26,
    title: 'Maxwell Equations',
    displayLabel: '26. Maxwell Equations',
    category: 'Physics',
    subCategory: 'Classical Electrodynamics & EM Waves',
    shortDescription:
      "Interactive 3D visualization of Gauss's Law (∇·E = ρ/ε₀), Gauss's Law for Magnetism (∇·B = 0), Faraday's Law, Ampère-Maxwell displacement current, and transverse E×B radiation.",
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/simulations/advancedPhysicsBatch4Studio.ts',
    dataDefinitionSource: 'src/data/curatedModelsAdvancedPhysicsBatch4.ts (ADVANCED_PHYSICS_BATCH_4_MODELS.maxwellEquationsExplorer)',
    routeLabel: 'Physics Lab → Batch 7: Advanced Physics IV',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 26,
    launchTarget: {
      route: 'physics',
      modelId: 'maxwell-equations-em-field-explorer',
      physicsModelId: 'maxwell-equations-em-field-explorer',
    },
  },
  {
    id: 'doppler-ultrasound-flow-explorer',
    number: 27,
    title: 'Doppler Ultrasound',
    displayLabel: '27. Doppler Ultrasound',
    category: 'Physics',
    subCategory: 'Medical Physics & Hemodynamic Sonography',
    shortDescription:
      'Piezoelectric ultrasound transducer scanning a vascular blood vessel with laminar/stenotic RBC flow, cosine beam-angle dependence (Δf = 2f₀v cos θ / c), and spectral pulse-wave velocity trace.',
    implementationComponent: 'src/pages/PhysicsLabPage.tsx · src/simulations/advancedPhysicsBatch4Studio.ts',
    dataDefinitionSource: 'src/data/curatedModelsAdvancedPhysicsBatch4.ts (ADVANCED_PHYSICS_BATCH_4_MODELS.dopplerUltrasoundExplorer)',
    routeLabel: 'Physics Lab → Batch 7: Advanced Physics IV',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 27,
    launchTarget: {
      route: 'physics',
      modelId: 'doppler-ultrasound-flow-explorer',
      physicsModelId: 'doppler-ultrasound-flow-explorer',
    },
  },
  {
    id: 'electrochemical-cell-simulator',
    number: 28,
    title: 'Electrochemical Cell',
    displayLabel: '28. Electrochemical Cell',
    category: 'Chemistry',
    subCategory: 'Electrochemistry, Galvanic Cells & Nernst Equation',
    shortDescription:
      'Daniell Galvanic Cell (Zn(s) | Zn²⁺(aq) || Cu²⁺(aq) | Cu(s)) with anode oxidation, cathode reduction, KNO₃ salt bridge ion migration, external voltmeter, and Nernst potential E_cell.',
    implementationComponent: 'src/pages/ChemistryLabPage.tsx · src/simulations/chemistryBatch1Studio.ts',
    dataDefinitionSource: 'src/data/curatedModelsChemistryBatch1.ts (CHEMISTRY_BATCH_1_MODELS.electrochemicalCellSimulator)',
    routeLabel: 'Chemistry Lab → Batch 1: 74. Galvanic Cell',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 28,
    launchTarget: {
      route: 'chemistry',
      modelId: 'electrochemical-cell-simulator',
      chemistryMode: 'electrochemical-cell-simulator',
    },
  },
  {
    id: 'acid-base-titration-laboratory',
    number: 29,
    title: 'Acid-Base Titration Lab',
    displayLabel: '29. Acid-Base Titration Lab',
    category: 'Chemistry',
    subCategory: 'Volumetric Analysis, pH Curves & Indicators',
    shortDescription:
      'Quantitative burette-and-flask titration apparatus supporting Strong/Weak Acid-Base systems, Henderson-Hasselbalch buffer region, equivalence point stoichiometry, and live indicator color transitions.',
    implementationComponent: 'src/pages/ChemistryLabPage.tsx · src/simulations/chemistryBatch2Studio.ts',
    dataDefinitionSource: 'src/data/curatedModelsChemistryBatch2.ts (CHEMISTRY_BATCH_2_MODELS.acidBaseTitrationLaboratory)',
    routeLabel: 'Chemistry Lab → Batch 2: 80. Acid-Base Titration',
    status: 'Active & Verified',
    isInMy29Models: true,
    my29Number: 29,
    launchTarget: {
      route: 'chemistry',
      modelId: 'acid-base-titration-laboratory',
      chemistryMode: 'acid-base-titration-laboratory',
    },
  },
];

const MY_29_BY_ID = new Map<string, ScienceModelDirectoryEntry>(
  MY_SCIENCE_MODELS_29.map((item) => [item.id, item])
);

const PHYSICS_LAB_MODEL_IDS = new Set<string>([
  'solar-system',
  'simple-pendulum',
  'projectile-motion',
  'inclined-plane',
  'class-1-lever',
  'hydraulic-lift',
  'newtons-cradle',
  'reflection-refraction',
  'prism-dispersion',
  'electric-circuit',
  'ac-generator',
  'electromagnetic-induction',
  'heat-transfer-explorer',
  'four-stroke-engine',
  'electric-bell',
  'motor-effect-fleming',
  'concave-convex-mirrors',
  'double-slit-interference',
  'transformer-3d',
  'wind-turbine-3d',
  'plasma-physics-explorer',
  'particle-accelerator-explorer',
  'quantum-tunneling-wavepacket',
  'superconductivity-meissner-explorer',
  'laser-cavity-stimulated-emission',
  'magnetic-levitation-explorer',
  'semiconductor-band-structure',
  'faraday-law-induction-explorer',
  'motor-generator-energy-explorer',
  'wave-interference-diffraction-lab',
  'ideal-gas-kinetic-theory-explorer',
  'optical-interferometer-explorer',
  'fluid-dynamics-bernoulli-vortex',
  'tokamak-fusion-confinement-explorer',
  'doppler-effect-sonic-boom-explorer',
  'seismic-waves-earthquake-lab',
  'gyroscope-torque-angular-momentum-lab',
  'shm-coupled-oscillators-lab',
  'thermodynamics-carnot-heat-engine',
  'photoelectric-effect-quantum-explorer',
  'special-relativity-time-length-lab',
  'maxwell-equations-em-field-explorer',
  'ac-circuits-rlc-resonance-lab',
  'lenses-optical-instruments-lab',
  'doppler-ultrasound-flow-explorer',
  'earth-magnetic-field-magnetosphere-explorer',
  'semiconductor-pn-junction-diode-explorer',
  'radioactive-decay-halflife-radiation-lab',
]);

const CHEMISTRY_LAB_BATCH_MODEL_IDS = new Set<string>([
  'molecular-orbital-explorer',
  'atomic-orbital-probability-explorer',
  'advanced-crystal-lattice-explorer',
  'molecular-polarity-explorer',
  'intermolecular-forces-explorer',
  'electrochemical-cell-simulator',
  'electrolysis-explorer',
  'chemical-kinetics-simulator',
  'chemical-equilibrium-explorer',
  'reaction-energy-profile-explorer',
  'catalysis-explorer',
  'acid-base-titration-laboratory',
  'solubility-precipitation-explorer',
  'buffer-solution-simulator',
]);

const BIOLOGY_LAB_MODEL_IDS = new Set<string>([
  'heart-explorer',
  'respiratory-explorer',
  'digestive-system',
  'brain-explorer',
  'eye-vision',
  'plant-cell-explorer',
  'animal-cell-explorer',
  'plant-root-transport',
  'blood-circulation-microscope',
  'blood-transport',
  'neuron-nerve-signal',
]);

/**
 * Dedicated Three.js standalone laboratory simulators built directly into the Lab pages.
 */
const STANDALONE_LAB_SCENES: ScienceModelDirectoryEntry[] = [
  {
    id: 'human-anatomy-3d-dissection',
    title: 'Human Anatomy 3D Musculoskeletal & Visceral Dissection Suite',
    displayLabel: 'Human Anatomy 3D Dissection Suite',
    category: 'Anatomy',
    subCategory: 'Surgical Dissection & Regional Organ Systems',
    shortDescription:
      'Interactive 3D human anatomical explorer with progressive layer dissection (skin/fascia, muscular, skeletal, vascular, nervous, and thoracic/abdominal viscera) and comparative quiz.',
    implementationComponent: 'src/pages/AnatomyPage.tsx · src/components/biology/HumanAnatomyExplorer.tsx',
    dataDefinitionSource: 'src/data/humanAnatomyData.ts',
    routeLabel: 'Anatomy Lab → Human Specimen',
    status: 'Standalone Lab Scene',
    isInMy29Models: false,
    partsCount: 16,
    parametersCount: 4,
    launchTarget: {
      route: 'anatomy',
      modelId: 'human-anatomy-3d-dissection',
      anatomySpecimen: 'human',
    },
  },
  {
    id: 'frog-anatomy-cervical-dissection',
    title: 'Frog Anatomy & Cervical Neck Surgical Dissection Suite',
    displayLabel: 'Frog Anatomy 3D Surgical Dissection Suite',
    category: 'Anatomy',
    subCategory: 'Amphibian Coelomic Dissection & Visceral Inspection',
    shortDescription:
      'Interactive 3D frog surgical suite with mouse-driven cervical neck rotation dissection, 3-chambered heart, paired sacculated lungs, trilobed liver, stomach, kidneys, and cloaca.',
    implementationComponent: 'src/pages/AnatomyPage.tsx · src/components/biology/FrogAnatomyExplorer.tsx · src/components/biology/FrogNeckDissectionScene.tsx',
    dataDefinitionSource: 'src/data/frogAnatomyData.ts',
    routeLabel: 'Anatomy Lab → Frog Specimen',
    status: 'Standalone Lab Scene',
    isInMy29Models: false,
    partsCount: 12,
    parametersCount: 3,
    launchTarget: {
      route: 'anatomy',
      modelId: 'frog-anatomy-cervical-dissection',
      anatomySpecimen: 'frog',
    },
  },
  {
    id: 'chemistry-3d-reaction-bench',
    title: 'Virtual 3D Chemistry Reaction Bench & Stoichiometry Engine',
    displayLabel: '3D Chemistry Reaction Bench (854 Compounds · 52 Reactions)',
    category: 'Chemistry',
    subCategory: 'Aqueous Reactions, Precipitation, Redox & Thermochemistry',
    shortDescription:
      'Interactive 3D Pyrex beaker workstation with multi-reagent pouring, real-time color transitions, effervescent gas evolution, precipitate clouds, thermal plume, and unified AI Chemistry Assistant.',
    implementationComponent: 'src/pages/ChemistryLabPage.tsx · src/components/chemistry/ChemistryLabScene.tsx · src/components/chemistry/ReactionAiChatbot.tsx',
    dataDefinitionSource: 'src/data/reactionsData.ts · src/data/compoundRegistry.ts',
    routeLabel: 'Chemistry Lab → 3D Reaction Bench',
    status: 'Standalone Lab Scene',
    isInMy29Models: false,
    partsCount: 52,
    parametersCount: 3,
    launchTarget: {
      route: 'chemistry',
      modelId: 'chemistry-3d-reaction-bench',
      chemistryMode: 'reaction_bench',
    },
  },
  {
    id: 'chemistry-3d-molecular-explorer',
    title: '3D VSEPR Molecular Structure & Bond Geometry Explorer',
    displayLabel: '3D Molecular Structure Explorer (H₂O, CH₄, CO₂, NH₃, C₂H₅OH)',
    category: 'Chemistry',
    subCategory: 'Molecular Geometry & Covalent Bonding',
    shortDescription:
      'Interactive 3D ball-and-stick molecular visualizer with CPK atomic coloring, raycast atom inspection, bond angle telemetry, and electron lone-pair geometry.',
    implementationComponent: 'src/pages/ChemistryLabPage.tsx · src/components/chemistry/MolecularScene.tsx',
    dataDefinitionSource: 'src/data/reactionsData.ts (MOLECULES)',
    routeLabel: 'Chemistry Lab → 3D Molecular Explorer',
    status: 'Standalone Lab Scene',
    isInMy29Models: false,
    partsCount: 5,
    parametersCount: 2,
    launchTarget: {
      route: 'chemistry',
      modelId: 'chemistry-3d-molecular-explorer',
      chemistryMode: 'molecular_explorer',
    },
  },
  {
    id: 'biology-classic-eukaryotic-cell-scene',
    title: '3D Eukaryotic Cell Organelle Cutaway Scene',
    displayLabel: '3D Eukaryotic Cell Organelle Scene (Foundation)',
    category: 'Biology',
    subCategory: 'Cellular Ultrastructure & Cytology',
    shortDescription:
      'Dedicated Three.js cutaway eukaryotic cell scene with interactive raycast selection of nucleus, mitochondria, rough/smooth ER, Golgi apparatus, lysosomes, and plasma membrane.',
    implementationComponent: 'src/pages/BiologyLabPage.tsx · src/components/biology/CellScene.tsx',
    dataDefinitionSource: 'src/data/biologyData.ts (CELL_ORGANELLES)',
    routeLabel: 'Biology Lab → 3D Cell Foundation',
    status: 'Standalone Lab Scene',
    isInMy29Models: false,
    partsCount: 8,
    parametersCount: 2,
    launchTarget: {
      route: 'biology',
      modelId: 'biology-classic-eukaryotic-cell-scene',
      biologyModelId: 'cell',
    },
  },
  {
    id: 'biology-classic-human-heart-scene',
    title: '3D Four-Chambered Human Heart Hemodynamics Scene',
    displayLabel: '3D Human Heart Hemodynamics Scene (Foundation)',
    category: 'Biology',
    subCategory: 'Cardiovascular Physiology',
    shortDescription:
      'Dedicated Three.js beating 4-chambered heart with adjustable BPM, pulmonary/systemic blood flow streamlines, and selectable chambers, valves, and great vessels.',
    implementationComponent: 'src/pages/BiologyLabPage.tsx · src/components/biology/HeartScene.tsx',
    dataDefinitionSource: 'src/data/biologyData.ts (HEART_STRUCTURES)',
    routeLabel: 'Biology Lab → Classic Heart Foundation',
    status: 'Standalone Lab Scene',
    isInMy29Models: false,
    partsCount: 8,
    parametersCount: 2,
    launchTarget: {
      route: 'biology',
      modelId: 'biology-classic-human-heart-scene',
      biologyModelId: 'heart',
    },
  },
  {
    id: 'biology-classic-dna-helix-scene',
    title: '3D Watson–Crick B-DNA Double Helix Scene',
    displayLabel: '3D B-DNA Double Helix Scene (Foundation)',
    category: 'Biology',
    subCategory: 'Molecular Genetics & Base Pairing',
    shortDescription:
      'Dedicated Three.js right-handed B-DNA double helix with sugar-phosphate antiparallel backbones, A–T and G–C hydrogen bond rungs, and base-pair inspector.',
    implementationComponent: 'src/pages/BiologyLabPage.tsx · src/components/biology/DnaScene.tsx',
    dataDefinitionSource: 'src/data/biologyData.ts (DNA_BASE_PAIRS)',
    routeLabel: 'Biology Lab → 3D DNA Helix Foundation',
    status: 'Standalone Lab Scene',
    isInMy29Models: false,
    partsCount: 4,
    parametersCount: 2,
    launchTarget: {
      route: 'biology',
      modelId: 'biology-classic-dna-helix-scene',
      biologyModelId: 'dna',
    },
  },
];

/**
 * 25 Specialized Deterministic Procedural 3D Models built into src/utils/proceduralModelSynthesizer.ts
 */
const PROCEDURAL_SYNTHESIZER_MODELS: {
  id: string;
  title: string;
  category: ScienceModelDirectoryEntry['category'];
  subCategory: string;
  prompt: string;
  shortDescription: string;
}[] = [
  {
    id: 'custom-double-pendulum-chaos',
    title: 'Chaotic Double Pendulum System',
    category: 'Physics',
    subCategory: 'Nonlinear Dynamics & Chaos',
    prompt: 'double pendulum chaos',
    shortDescription: 'Coupled two-link chaotic pendulum demonstrating Lagrangian mechanics and sensitive dependence on initial conditions.',
  },
  {
    id: 'custom-atwood-machine-pulley',
    title: "Atwood's Machine & Pulley Mechanics",
    category: 'Physics',
    subCategory: 'Newtonian Mechanics & Tension',
    prompt: 'atwood machine pulley',
    shortDescription: 'Frictionless pulley with counterbalanced masses m₁ and m₂ illustrating net acceleration a = g(m₁−m₂)/(m₁+m₂) and string tension.',
  },
  {
    id: 'custom-solenoid-electromagnet',
    title: 'Electromagnetic Solenoid & B-Field Visualizer',
    category: 'Physics',
    subCategory: 'Electromagnetism & Ampère Law',
    prompt: 'solenoid electromagnet',
    shortDescription: 'Helical current-carrying copper coil with ferromagnetic core and 3D axial/looping magnetic flux lines (B = μ₀μᵣnI).',
  },
  {
    id: 'custom-dna-replication-fork',
    title: 'DNA Replication Fork & Enzymatic Machinery',
    category: 'Biology',
    subCategory: 'Molecular Biology & Genetics',
    prompt: 'dna replication fork helicase polymerase',
    shortDescription: '3D replisome complex showing DNA helicase unwinding, leading/lagging strands, DNA polymerase III, and Okazaki fragments.',
  },
  {
    id: 'custom-chemical-synapse',
    title: 'Chemical Synapse & Neurotransmitter Junction',
    category: 'Biology',
    subCategory: 'Neurobiology & Synaptic Transmission',
    prompt: 'chemical synapse neurotransmitter',
    shortDescription: 'Presynaptic axon terminal, voltage-gated Ca²⁺ channels, synaptic vesicles, neurotransmitter exocytosis across synaptic cleft, and postsynaptic receptors.',
  },
  {
    id: 'custom-cell-mitosis-spindle',
    title: 'Eukaryotic Mitosis & Mitotic Spindle Apparatus',
    category: 'Biology',
    subCategory: 'Cell Division & Cytogenetics',
    prompt: 'cell mitosis spindle chromosomes',
    shortDescription: 'Metaphase/anaphase cell division apparatus with centrosome asters, kinetochore microtubules, and sister chromatid segregation.',
  },
  {
    id: 'custom-atp-synthase-motor',
    title: 'ATP Synthase Rotary Molecular Motor (F₀F₁)',
    category: 'Biology',
    subCategory: 'Bioenergetics & Chemiosmosis',
    prompt: 'atp synthase rotary motor',
    shortDescription: 'Mitochondrial inner-membrane F₀ proton channel rotor, γ central stalk, and F₁ catalytic α₃β₃ hexamer synthesizing ATP.',
  },
  {
    id: 'custom-sarcomere-sliding-filament',
    title: 'Skeletal Muscle Sarcomere (Sliding Filament Model)',
    category: 'Biology',
    subCategory: 'Biomechanics & Muscle Physiology',
    prompt: 'sarcomere sliding filament actin myosin',
    shortDescription: 'Z-discs, thin actin filaments, thick myosin filaments with cross-bridge power strokes, and Ca²⁺-troponin-tropomyosin regulation.',
  },
  {
    id: 'custom-cathode-ray-tube-thomson',
    title: "J.J. Thomson's Cathode Ray Tube (e/m Apparatus)",
    category: 'Physics',
    subCategory: 'Atomic Physics & Lorentz Deflection',
    prompt: 'cathode ray tube thomson',
    shortDescription: 'Evacuated glass CRT with thermionic electron gun, crossed electric deflection plates and Helmholtz coils, and phosphor screen.',
  },
  {
    id: 'custom-cyclotron-accelerator',
    title: 'Lawrence Cyclotron Particle Accelerator',
    category: 'Physics',
    subCategory: 'Nuclear Physics & Resonance Acceleration',
    prompt: 'lawrence cyclotron accelerator dees',
    shortDescription: 'Dual hollow copper D-electrodes (Dees) inside an axial magnetic field driving outward spiral ion orbits at cyclotron frequency f = qB/(2πm).',
  },
  {
    id: 'custom-fluid-mosaic-membrane',
    title: 'Cell Membrane Phospholipid Bilayer (Fluid Mosaic)',
    category: 'Biology',
    subCategory: 'Membrane Biology & Transport',
    prompt: 'fluid mosaic cell membrane phospholipid bilayer',
    shortDescription: 'Amphipathic phospholipid bilayer with integral channel proteins, glycoprotein receptors, and membrane cholesterol rafts.',
  },
  {
    id: 'custom-bacteriophage-virus',
    title: 'T4 Bacteriophage Virus Architecture',
    category: 'Biology',
    subCategory: 'Virology & Molecular Microbiology',
    prompt: 'bacteriophage virus capsid',
    shortDescription: 'Icosahedral protein capsid head encapsulating dsDNA, contractile tail sheath, baseplate, and six jointed tail fibers.',
  },
  {
    id: 'custom-stratovolcano-explorer',
    title: 'Tectonic Subduction & Stratovolcano Cutaway',
    category: 'Engineering & Earth Science',
    subCategory: 'Geology & Plate Tectonics',
    prompt: 'volcano magma chamber eruption',
    shortDescription: '3D geological cross-section showing deep magma chamber, central conduit, alternating tephra/lava strata, sill/dike intrusions, and eruption plume.',
  },
  {
    id: 'custom-wind-turbine-generator',
    title: 'Aerodynamic Wind Turbine & Nacelle Generator',
    category: 'Engineering & Earth Science',
    subCategory: 'Renewable Energy & Betz Limit',
    prompt: 'wind turbine nacelle generator',
    shortDescription: 'Three-blade variable-pitch rotor, nacelle cutaway with planetary gearbox, doubly-fed induction generator, and wind streamline wake.',
  },
  {
    id: 'custom-prokaryotic-bacterial-cell',
    title: 'Prokaryotic Bacterial Cell Ultrastructure',
    category: 'Biology',
    subCategory: 'Microbiology & Bacteriology',
    prompt: 'prokaryotic bacterial cell flagellum',
    shortDescription: 'Capsule, peptidoglycan cell wall, plasma membrane, nucleoid chromosomal DNA, plasmids, 70S ribosomes, pili, and rotary flagellum.',
  },
  {
    id: 'custom-solar-photovoltaic-cell',
    title: 'Photovoltaic Solar Cell (p–n Junction) Explorer',
    category: 'Physics',
    subCategory: 'Semiconductor Photovoltaics',
    prompt: 'solar photovoltaic cell silicon',
    shortDescription: 'Anti-reflective coating, n-type/p-type silicon depletion zone, photon electron-hole pair generation, and external DC load circuit.',
  },
  {
    id: 'custom-benzene-aromatic-ring',
    title: 'Benzene (C₆H₆) Aromatic Ring & π-Delocalization',
    category: 'Chemistry',
    subCategory: 'Organic Chemistry & Conjugated π-Systems',
    prompt: 'benzene aromatic ring pi orbitals',
    shortDescription: 'Planar hexagonal sp² carbon ring with σ framework and delocalized toroidal π molecular electron clouds above and below the ring plane.',
  },
  {
    id: 'custom-chloroplast-photosynthesis',
    title: 'Chloroplast Ultrastructure & Thylakoid Grana',
    category: 'Biology',
    subCategory: 'Plant Physiology & Photosynthesis',
    prompt: 'chloroplast thylakoid photosynthesis',
    shortDescription: 'Double-membrane chloroplast envelope, stroma matrix, stacked thylakoid grana discs, stromal lamellae, and light/Calvin cycle regions.',
  },
  {
    id: 'custom-earth-interior-layers',
    title: "Earth's Interior Concentric Layers & Geodynamo",
    category: 'Engineering & Earth Science',
    subCategory: 'Geophysics & Planetary Interior',
    prompt: 'earth interior layers core mantle crust',
    shortDescription: 'Cutaway planetary sphere revealing continental/oceanic crust, silicate mantle convection, liquid iron outer core geodynamo, and solid inner core.',
  },
  {
    id: 'custom-synovial-joint-biomechanics',
    title: 'Human Synovial Joint & Articular Biomechanics',
    category: 'Anatomy',
    subCategory: 'Orthopedics & Musculoskeletal Mechanics',
    prompt: 'synovial knee joint cartilage ligament',
    shortDescription: 'Articulating epiphyses, hyaline articular cartilage, synovial fluid cavity, fibrous joint capsule, and stabilizing cruciate/collateral ligaments.',
  },
  {
    id: 'custom-hydraulic-press',
    title: "Pascal's Hydraulic Press & Force Multiplier",
    category: 'Physics',
    subCategory: 'Fluid Statics & Mechanical Advantage',
    prompt: 'pascal hydraulic press piston',
    shortDescription: 'Interconnected small input plunger and large output ram cylinder filled with hydraulic oil demonstrating pressure equilibrium and force amplification.',
  },
  {
    id: 'custom-kidney-nephron',
    title: 'Renal Nephron & Countercurrent Filtration Unit',
    category: 'Biology',
    subCategory: 'Renal Physiology & Osmoregulation',
    prompt: 'kidney nephron glomerulus loop of henle',
    shortDescription: "Glomerular capillary tuft, Bowman's capsule, proximal/distal convoluted tubules, Loop of Henle countercurrent multiplier, and collecting duct.",
  },
  {
    id: 'custom-jet-engine-cutaway',
    title: 'High-Bypass Turbofan Jet Engine Cutaway (Brayton Cycle)',
    category: 'Engineering & Earth Science',
    subCategory: 'Aerospace Propulsion & Thermodynamics',
    prompt: 'turbofan jet engine cutaway',
    shortDescription: 'Intake fan, multi-stage axial low/high-pressure compressor, annular combustion chamber, turbine stages, and exhaust nozzle.',
  },
  {
    id: 'custom-robotic-arm-manipulator',
    title: '6-DOF Articulated Industrial Robotic Arm',
    category: 'Engineering & Earth Science',
    subCategory: 'Robotics, Kinematics & Actuation',
    prompt: 'robotic arm manipulator kinematics',
    shortDescription: 'Rotating base turret, shoulder/elbow/wrist servo joints, kinematic linkage arms, and precision parallel end-effector gripper.',
  },
  {
    id: 'custom-hydraulic-braking-system',
    title: 'Automotive Hydraulic Disc Brake System',
    category: 'Engineering & Earth Science',
    subCategory: 'Mechanical Engineering & Tribology',
    prompt: 'hydraulic disc brake caliper rotor',
    shortDescription: 'Master cylinder, hydraulic brake lines, floating caliper pistons, friction brake pads, and ventilated cast-iron rotor disc.',
  },
];

function inferCuratedModelSourceAndRoute(spec: ScientificModelSpec): {
  category: ScienceModelDirectoryEntry['category'];
  subCategory: string;
  implementationComponent: string;
  dataDefinitionSource: string;
  routeLabel: string;
  launchTarget: ModelLaunchTarget;
} {
  const id = spec.id;

  if (PHYSICS_LAB_MODEL_IDS.has(id)) {
    let dataSource = 'src/data/curatedAiModels.ts';
    let studio = 'src/pages/PhysicsLabPage.tsx · src/components/models/Dynamic3DModelRenderer.tsx';
    let batchLabel = 'Physics Lab → Batch 1: Core Physics';

    if (
      [
        'ac-generator',
        'electromagnetic-induction',
        'heat-transfer-explorer',
        'four-stroke-engine',
        'electric-bell',
        'motor-effect-fleming',
        'concave-convex-mirrors',
        'double-slit-interference',
        'transformer-3d',
        'wind-turbine-3d',
      ].includes(id)
    ) {
      dataSource = 'src/data/curatedModelsBatch5.ts (BATCH_3_MODELS)';
      batchLabel = 'Physics Lab → Batch 3: Electromechanics & Thermal';
    } else if (
      [
        'plasma-physics-explorer',
        'particle-accelerator-explorer',
        'quantum-tunneling-wavepacket',
        'superconductivity-meissner-explorer',
        'laser-cavity-stimulated-emission',
        'magnetic-levitation-explorer',
        'semiconductor-band-structure',
      ].includes(id)
    ) {
      dataSource = 'src/data/curatedModelsAdvancedPhysicsBatch1.ts';
      studio = 'src/pages/PhysicsLabPage.tsx · src/simulations/advancedPhysicsBatch1Studio.ts';
      batchLabel = 'Physics Lab → Batch 4: Advanced Physics I';
    } else if (
      [
        'faraday-law-induction-explorer',
        'motor-generator-energy-explorer',
        'wave-interference-diffraction-lab',
        'ideal-gas-kinetic-theory-explorer',
        'optical-interferometer-explorer',
        'fluid-dynamics-bernoulli-vortex',
        'tokamak-fusion-confinement-explorer',
      ].includes(id)
    ) {
      dataSource = 'src/data/curatedModelsAdvancedPhysicsBatch2.ts';
      studio = 'src/pages/PhysicsLabPage.tsx · src/simulations/advancedPhysicsBatch2Studio.ts';
      batchLabel = 'Physics Lab → Batch 5: Advanced Physics II';
    } else if (
      [
        'doppler-effect-sonic-boom-explorer',
        'seismic-waves-earthquake-lab',
        'gyroscope-torque-angular-momentum-lab',
        'shm-coupled-oscillators-lab',
        'thermodynamics-carnot-heat-engine',
        'photoelectric-effect-quantum-explorer',
        'special-relativity-time-length-lab',
      ].includes(id)
    ) {
      dataSource = 'src/data/curatedModelsAdvancedPhysicsBatch3.ts';
      studio = 'src/pages/PhysicsLabPage.tsx · src/simulations/advancedPhysicsBatch3Studio.ts';
      batchLabel = 'Physics Lab → Batch 6: Advanced Physics III';
    } else if (
      [
        'maxwell-equations-em-field-explorer',
        'ac-circuits-rlc-resonance-lab',
        'lenses-optical-instruments-lab',
        'doppler-ultrasound-flow-explorer',
        'earth-magnetic-field-magnetosphere-explorer',
        'semiconductor-pn-junction-diode-explorer',
        'radioactive-decay-halflife-radiation-lab',
      ].includes(id)
    ) {
      dataSource = 'src/data/curatedModelsAdvancedPhysicsBatch4.ts';
      studio = 'src/pages/PhysicsLabPage.tsx · src/simulations/advancedPhysicsBatch4Studio.ts';
      batchLabel = 'Physics Lab → Batch 7: Advanced Physics IV';
    } else {
      studio = 'src/pages/PhysicsLabPage.tsx · src/simulations/preBatch1VisualUpgradeStudio.ts';
    }

    return {
      category: 'Physics',
      subCategory: spec.concept || 'Physics Simulation',
      implementationComponent: studio,
      dataDefinitionSource: dataSource,
      routeLabel: batchLabel,
      launchTarget: {
        route: 'physics',
        modelId: id,
        physicsModelId: id,
      },
    };
  }

  if (CHEMISTRY_LAB_BATCH_MODEL_IDS.has(id)) {
    const isBatch1 = [
      'molecular-orbital-explorer',
      'atomic-orbital-probability-explorer',
      'advanced-crystal-lattice-explorer',
      'molecular-polarity-explorer',
      'intermolecular-forces-explorer',
      'electrochemical-cell-simulator',
      'electrolysis-explorer',
    ].includes(id);

    return {
      category: 'Chemistry',
      subCategory: spec.concept || 'Chemistry Simulation',
      implementationComponent: isBatch1
        ? 'src/pages/ChemistryLabPage.tsx · src/simulations/chemistryBatch1Studio.ts'
        : 'src/pages/ChemistryLabPage.tsx · src/simulations/chemistryBatch2Studio.ts',
      dataDefinitionSource: isBatch1
        ? 'src/data/curatedModelsChemistryBatch1.ts'
        : 'src/data/curatedModelsChemistryBatch2.ts',
      routeLabel: isBatch1 ? 'Chemistry Lab → Batch 1 Models' : 'Chemistry Lab → Batch 2 Models',
      launchTarget: {
        route: 'chemistry',
        modelId: id,
        chemistryMode: id,
      },
    };
  }

  if (BIOLOGY_LAB_MODEL_IDS.has(id)) {
    const isBioBatch1 = [
      'heart-explorer',
      'respiratory-explorer',
      'digestive-system',
      'brain-explorer',
      'eye-vision',
    ].includes(id);

    return {
      category: 'Biology',
      subCategory: spec.concept || 'Biology & Physiology',
      implementationComponent: 'src/pages/BiologyLabPage.tsx · src/components/models/Dynamic3DModelRenderer.tsx',
      dataDefinitionSource: isBioBatch1
        ? 'src/data/curatedModelsBatch3.ts (BIOLOGY_BATCH_1_MODELS)'
        : 'src/data/curatedModelsBatch4.ts (BIOLOGY_BATCH_2_MODELS)',
      routeLabel: 'Biology Lab → Curated 3D Models',
      launchTarget: {
        route: 'biology',
        modelId: id,
        biologyModelId: id,
      },
    };
  }

  const domainLower = (spec.subjectDomain || '').toLowerCase();
  const category: ScienceModelDirectoryEntry['category'] = domainLower.includes('chem')
    ? 'Chemistry'
    : domainLower.includes('bio')
    ? 'Biology'
    : 'Physics';

  return {
    category,
    subCategory: spec.concept || spec.subjectDomain || 'Interactive 3D Model',
    implementationComponent:
      'src/pages/AiModelGeneratorPage.tsx · src/components/models/Dynamic3DModelRenderer.tsx · src/simulations/preBatch1VisualUpgradeStudio.ts',
    dataDefinitionSource: 'src/data/curatedAiModels.ts · src/data/curatedModelsBatch2.ts',
    routeLabel: `Create 3D Model Studio → Curated Preset (${id})`,
    launchTarget: {
      route: 'ai-generator',
      modelId: id,
      aiCuratedKeyOrId: id,
    },
  };
}

/**
 * Returns the complete, deduplicated inventory of all verified 3D models and model-based features
 * integrated across the Tech-Anatomix codebase.
 */
export function getAllIntegratedModelsDirectory(): ScienceModelDirectoryEntry[] {
  const seenIds = new Set<string>();
  const directory: ScienceModelDirectoryEntry[] = [];

  // 1. Add all unique curated 3D ScientificModelSpec presets from CURATED_AI_MODELS (90 unique models)
  Object.values(CURATED_AI_MODELS).forEach((spec) => {
    if (!spec || !spec.id || seenIds.has(spec.id)) return;
    seenIds.add(spec.id);

    const my29Entry = MY_29_BY_ID.get(spec.id);
    const meta = inferCuratedModelSourceAndRoute(spec);

    directory.push({
      id: spec.id,
      title: my29Entry ? my29Entry.title : spec.title.replace(/^\d+\.\s*/, ''),
      displayLabel: spec.title,
      category: my29Entry ? my29Entry.category : meta.category,
      subCategory: my29Entry ? my29Entry.subCategory : meta.subCategory,
      shortDescription: spec.description || my29Entry?.shortDescription || '',
      implementationComponent: my29Entry ? my29Entry.implementationComponent : meta.implementationComponent,
      dataDefinitionSource: my29Entry ? my29Entry.dataDefinitionSource : meta.dataDefinitionSource,
      routeLabel: my29Entry ? my29Entry.routeLabel : meta.routeLabel,
      status: 'Active & Verified',
      isInMy29Models: Boolean(my29Entry),
      my29Number: my29Entry?.number,
      partsCount: spec.parts?.length || 0,
      parametersCount: Object.keys(spec.parameters || {}).length,
      launchTarget: my29Entry ? my29Entry.launchTarget : meta.launchTarget,
    });
  });

  // 2. Add the 7 dedicated standalone Three.js laboratory scenes (Anatomy, Chemistry Bench, Molecular Explorer, Cell/Heart/DNA Foundations)
  STANDALONE_LAB_SCENES.forEach((scene) => {
    if (seenIds.has(scene.id)) return;
    seenIds.add(scene.id);
    directory.push(scene);
  });

  // 3. Add the 25 specialized deterministic procedural 3D models from proceduralModelSynthesizer.ts
  PROCEDURAL_SYNTHESIZER_MODELS.forEach((proc) => {
    if (seenIds.has(proc.id)) return;
    seenIds.add(proc.id);
    directory.push({
      id: proc.id,
      title: proc.title,
      displayLabel: proc.title,
      category: proc.category,
      subCategory: proc.subCategory,
      shortDescription: proc.shortDescription,
      implementationComponent: 'src/pages/AiModelGeneratorPage.tsx · src/utils/proceduralModelSynthesizer.ts',
      dataDefinitionSource: `src/utils/proceduralModelSynthesizer.ts (${proc.id})`,
      routeLabel: 'Create 3D Model Studio → Procedural 3D Synthesizer',
      status: 'Procedural 3D Synthesizer',
      isInMy29Models: false,
      launchTarget: {
        route: 'ai-generator',
        modelId: proc.id,
        aiProceduralPrompt: proc.prompt,
      },
    });
  });

  return directory;
}

/**
 * Backend AI & Scientific Computation Services discovered during full-codebase inspection (no secrets exposed).
 */
export const BACKEND_AI_AND_SCIENTIFIC_SERVICES: BackendAiServiceEntry[] = [
  {
    id: 'service-chemistry-ai-assistant',
    name: 'Unified Chemistry AI Assistant & Reaction Resolver',
    category: 'AI Route / Service',
    endpointOrFile: 'POST /api/ai/chemistry-assistant · api_src/ai/chemistry-assistant.ts · src/server/chemistryAiAssistantService.ts',
    description:
      'Context-aware chemistry intelligence resolving natural-language questions, canonical chemical formulas, reaction equations, and direct beaker loading actions.',
    status: 'Active',
  },
  {
    id: 'service-ai-model-generator',
    name: 'Structured 3D Scientific Model Generator API',
    category: 'AI Route / Service',
    endpointOrFile: 'POST /api/ai/generate-model · api_src/ai/generate-model.ts · src/utils/intelligentModelMatcher.ts',
    description:
      'Multi-tier model synthesis pipeline combining semantic preset matching, Gemini/Groq LLM JSON schema synthesis, and deterministic procedural 3D model fallback.',
    status: 'Active',
  },
  {
    id: 'service-model-aware-chat',
    name: '3D Model-Aware Interactive Tutor API',
    category: 'AI Route / Service',
    endpointOrFile: 'POST /api/ai/model-chat · api_src/ai/model-chat.ts · src/components/ai/ModelAwareChatbot.tsx',
    description:
      'Synchronizes with the currently active 3D model, selected anatomical/mechanical part, and live parameter sliders to explain underlying physical/biological mechanisms.',
    status: 'Active',
  },
  {
    id: 'service-compound-lookup',
    name: 'Chemical Compound Lookup & Registration Service',
    category: 'AI Route / Service',
    endpointOrFile: 'POST /api/ai/LookupCompound · api_src/ai/LookupCompound.ts · src/data/compoundRegistry.ts',
    description:
      'Resolves chemical names, IUPAC nomenclature, and formulas against the 854-compound canonical registry with AI enrichment for custom reagents.',
    status: 'Active',
  },
  {
    id: 'service-lab-mentor-chat',
    name: 'VIZLAB Multi-Subject Lab Mentor API',
    category: 'AI Route / Service',
    endpointOrFile: 'POST /api/ai/chat · api_src/ai/chat.ts · src/components/ai/AiLabAssistant.tsx',
    description:
      'General STEM tutor endpoint for Physics, Chemistry, and Biology laboratory guidance with multi-key rotation and deterministic local fallback.',
    status: 'Active',
  },
  {
    id: 'engine-physics-kinematics',
    name: 'Deterministic Physics Mathematical Engines',
    category: 'Deterministic Scientific Engine',
    endpointOrFile: 'src/simulations/physics/projectileEngine.ts · pendulumEngine.ts · circuitEngine.ts',
    description:
      'Exact analytical and numerical RK4/Euler solvers for projectile motion with quadratic drag, non-linear pendulum oscillation, and Ohm/Joule DC circuits.',
    status: 'Active',
  },
  {
    id: 'engine-chemistry-stoichiometry',
    name: 'Canonical Chemical Registry (854 Compounds) & Reaction Engine (52 Reactions)',
    category: 'Deterministic Scientific Engine',
    endpointOrFile: 'src/data/compoundRegistry.ts · src/data/reactionsData.ts',
    description:
      'Evaluates arbitrary reagent combinations, catalysts, temperature, and molarity to compute balanced equations, ΔH enthalpy, pH shifts, precipitates, and gas evolution.',
    status: 'Active',
  },
];
