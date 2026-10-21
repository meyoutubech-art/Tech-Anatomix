import { GoogleGenAI } from '@google/genai';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { BATCH_3_MODELS } from '../data/curatedModelsBatch5';
import { GeminiModelRouter } from './geminiModelRouter';
import { cleanAndFormatScientificText, convertLatexFragmentToUnicode } from '../utils/scientificTextFormatter';
import { extractLocalScientificTakeaways } from '../utils/keyTakeawaysService';
import { synthesizeProceduralScientificModel } from '../utils/proceduralModelSynthesizer';

let ai: GoogleGenAI | null = null;
let currentKey = '';

// Centralized dynamic Gemini Client Resolver
// Read server-side environment variables strictly (never exposing to client)
export function getAiClient(): GoogleGenAI | null {
  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GEMINI_APIKEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!rawKey) return null;
  const key = rawKey.trim().replace(/^["']|["']$/g, '');
  if (!key) return null;

  if (!ai || currentKey !== key) {
    const customHeaders: Record<string, string> = {
      'User-Agent': 'aistudio-build',
      'x-goog-api-key': key,
    };

    // Google OAuth access tokens start with ya29. and require Bearer header
    // Google AI Studio auth keys (starting with AQ. or AIza) are API keys passed via x-goog-api-key
    if (key.startsWith('ya29.')) {
      customHeaders['Authorization'] = `Bearer ${key}`;
    }

    ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: customHeaders,
      },
    });
    currentKey = key;
    if (typeof modelRouter !== 'undefined' && modelRouter) {
      modelRouter.setAiInstance(ai);
    }
  }
  return ai;
}

export let modelRouter: GeminiModelRouter;
modelRouter = new GeminiModelRouter(getAiClient());

// Server-side model specification cache for deterministic repeated requests
const modelCache = new Map<string, { spec: any; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour cache lifetime

// Helper to normalize user prompts into canonical lowercase subject keys
export function normalizePrompt(prompt: string): string {
  if (!prompt) return '';
  let cleaned = prompt.toLowerCase().trim();
  // Strip common conversational noise words
  cleaned = cleaned.replace(/\b(create|generate|build|make|show|me|a|an|the|3d|model|of|interactive|simulation|for|my|class|physics|biology|chemistry|science)\b/gi, ' ');
  // Remove non-alphanumeric punctuation and collapse whitespace
  cleaned = cleaned.replace(/[^a-z0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || prompt.toLowerCase().trim();
}

// Helper to safely strip markdown code fences from JSON text returned by LLMs
export function cleanJsonText(raw: string): string {
  if (!raw) return '{}';
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  }
  return cleaned.trim();
}

// Helper to match verified scientific models by concepts/keywords
export function matchVerifiedScientificModel(query: string): any | null {
  const q = query.toLowerCase().trim();
  const norm = normalizePrompt(query);
  const combined = `${q} ${norm}`;

  // =========================================================================
  // PRIORITY CHECK: CHEMISTRY BATCH 1 (MODELS 69–75)
  // =========================================================================
  // Model 69: Molecular Orbital Explorer
  if (
    combined.includes('molecular orbital') ||
    combined.includes('lcao') ||
    combined.includes('antibonding') ||
    combined.includes('mo energy') ||
    (combined.includes('sigma') && combined.includes('pi') && combined.includes('orbital'))
  ) {
    return CURATED_AI_MODELS['molecular-orbital-explorer'];
  }
  // Model 70: Atomic Orbital Probability Explorer
  if (
    combined.includes('atomic orbital') ||
    combined.includes('probability explorer') ||
    combined.includes('probability threshold') ||
    combined.includes('radial and angular nod') ||
    combined.includes('radial node') ||
    (combined.includes('1s') && combined.includes('2s') && combined.includes('2p'))
  ) {
    return CURATED_AI_MODELS['atomic-orbital-probability-explorer'];
  }
  // Model 71: Advanced Crystal Lattice Explorer
  if (
    combined.includes('crystal lattice') ||
    combined.includes('unit cell') ||
    combined.includes('atomic packing factor') ||
    combined.includes('body centred cubic') ||
    combined.includes('face centred cubic') ||
    combined.includes('hexagonal close packed') ||
    (combined.includes('bcc') && combined.includes('fcc'))
  ) {
    return CURATED_AI_MODELS['advanced-crystal-lattice-explorer'];
  }
  // Model 72: Molecular Polarity Explorer
  if (
    combined.includes('molecular polarity') ||
    combined.includes('resultant molecular dipole') ||
    combined.includes('bond dipole') ||
    (combined.includes('vsepr') && combined.includes('dipole')) ||
    (combined.includes('bf3') && combined.includes('nh3'))
  ) {
    return CURATED_AI_MODELS['molecular-polarity-explorer'];
  }
  // Model 73: Intermolecular Forces Explorer
  if (
    combined.includes('intermolecular force') ||
    combined.includes('london dispersion') ||
    combined.includes('dipole dipole') ||
    combined.includes('hydrogen bonding in h2o') ||
    combined.includes('van der waals')
  ) {
    return CURATED_AI_MODELS['intermolecular-forces-explorer'];
  }
  // Model 74: Electrochemical Cell Simulator
  if (
    combined.includes('electrochemical cell') ||
    combined.includes('galvanic cell') ||
    combined.includes('voltaic cell') ||
    combined.includes('daniell cell') ||
    combined.includes('salt bridge') ||
    combined.includes('nernst')
  ) {
    return CURATED_AI_MODELS['electrochemical-cell-simulator'];
  }
  // Model 75: Electrolysis Explorer
  if (
    combined.includes('electrolysis') ||
    combined.includes('electrolytic cell') ||
    combined.includes('molten sodium chloride') ||
    combined.includes('molten nacl') ||
    (combined.includes('faraday') && (combined.includes('current') || combined.includes('cathode') || combined.includes('m mit')))
  ) {
    return CURATED_AI_MODELS['electrolysis-explorer'];
  }

  // =========================================================================
  // PRIORITY CHECK: CHEMISTRY BATCH 2 (MODELS 76–82)
  // =========================================================================
  // Model 76: Chemical Kinetics Simulator
  if (
    combined.includes('chemical kinetics') ||
    combined.includes('kinetics simulator') ||
    combined.includes('integrated rate law') ||
    combined.includes('reaction order') ||
    (combined.includes('kinetics') && (combined.includes('arrhenius') || combined.includes('half life') || combined.includes('rate constant')))
  ) {
    return CURATED_AI_MODELS['chemical-kinetics-simulator'];
  }
  // Model 77: Chemical Equilibrium Explorer
  if (
    combined.includes('chemical equilibrium') ||
    combined.includes('equilibrium explorer') ||
    combined.includes('le chatelier') ||
    combined.includes('reaction quotient') ||
    (combined.includes('equilibrium') && (combined.includes('haber') || combined.includes('kc') || combined.includes('kp') || combined.includes('n2o4')))
  ) {
    return CURATED_AI_MODELS['chemical-equilibrium-explorer'];
  }
  // Model 78: Reaction Energy Profile Explorer
  if (
    combined.includes('reaction energy profile') ||
    combined.includes('energy profile explorer') ||
    combined.includes('transition state') ||
    combined.includes('activated complex') ||
    (combined.includes('reaction coordinate') && (combined.includes('activation energy') || combined.includes('enthalpy')))
  ) {
    return CURATED_AI_MODELS['reaction-energy-profile-explorer'];
  }
  // Model 79: Catalysis Explorer
  if (
    combined.includes('catalysis explorer') ||
    combined.includes('catalysis mechanism') ||
    combined.includes('heterogeneous surface') ||
    combined.includes('langmuir hinshelwood') ||
    combined.includes('active site') ||
    (combined.includes('catalysis') && (combined.includes('adsorption') || combined.includes('enzyme') || combined.includes('homogeneous') || combined.includes('pathway')))
  ) {
    return CURATED_AI_MODELS['catalysis-explorer'];
  }
  // Model 80: Acid–Base Titration Laboratory
  if (
    combined.includes('acid base titration') ||
    combined.includes('acid-base titration') ||
    combined.includes('titration laboratory') ||
    combined.includes('titration simulator') ||
    combined.includes('equivalence point') ||
    combined.includes('phenolphthalein') ||
    (combined.includes('titration') && (combined.includes('burette') || combined.includes('titrant') || combined.includes('ph curve')))
  ) {
    return CURATED_AI_MODELS['acid-base-titration-laboratory'];
  }
  // Model 81: Solubility and Precipitation Explorer
  if (
    combined.includes('solubility and precipitation') ||
    combined.includes('solubility product') ||
    combined.includes('ksp') ||
    combined.includes('common ion effect') ||
    combined.includes('ion product qsp') ||
    (combined.includes('precipitation') && (combined.includes('agcl') || combined.includes('pbi2') || combined.includes('baso4') || combined.includes('saturated')))
  ) {
    return CURATED_AI_MODELS['solubility-precipitation-explorer'];
  }
  // Model 82: Buffer Solution Simulator
  if (
    combined.includes('buffer solution') ||
    combined.includes('buffer simulator') ||
    combined.includes('buffer explorer') ||
    combined.includes('henderson hasselbalch') ||
    combined.includes('henderson-hasselbalch') ||
    combined.includes('buffer capacity') ||
    (combined.includes('buffer') && (combined.includes('conjugate') || combined.includes('pka')))
  ) {
    return CURATED_AI_MODELS['buffer-solution-simulator'];
  }

  // =========================================================================
  // PRIORITY CHECK: ADVANCED PHYSICS BATCH 4 (MODELS 62–68)
  // =========================================================================
  // Model 62: Maxwell's Equations & Electromagnetic Field Explorer
  if (
    combined.includes('maxwell') ||
    combined.includes('gauss law') ||
    combined.includes('ampere maxwell') ||
    combined.includes('displacement current') ||
    combined.includes('electromagnetic field explorer')
  ) {
    return CURATED_AI_MODELS['maxwell-equations-em-field-explorer'];
  }
  // Model 63: AC Circuits, RLC Resonance & Impedance Laboratory
  if (
    combined.includes('rlc') ||
    combined.includes('impedance laboratory') ||
    combined.includes('inductive reactance') ||
    combined.includes('capacitive reactance') ||
    combined.includes('ac circuits')
  ) {
    return CURATED_AI_MODELS['ac-circuits-rlc-resonance-lab'];
  }
  // Model 64: Lenses, Optical Instruments & Image Formation Laboratory
  if (
    combined.includes('thin lens') ||
    combined.includes('lenses optical instruments') ||
    combined.includes('image formation laboratory') ||
    (combined.includes('convex') && combined.includes('concave') && combined.includes('lens')) ||
    (combined.includes('lenses') && combined.includes('image formation'))
  ) {
    return CURATED_AI_MODELS['lenses-optical-instruments-lab'];
  }
  // Model 65: Doppler Ultrasound & Medical Flow Imaging Explorer
  if (
    combined.includes('doppler ultrasound') ||
    combined.includes('medical flow imaging') ||
    combined.includes('ultrasound probe') ||
    (combined.includes('ultrasound') && (combined.includes('doppler') || combined.includes('blood')))
  ) {
    return CURATED_AI_MODELS['doppler-ultrasound-flow-explorer'];
  }
  // Model 66: Earth's Magnetic Field & Magnetosphere Explorer
  if (
    combined.includes('magnetosphere') ||
    combined.includes('magnetotail') ||
    combined.includes('solar wind') ||
    combined.includes('auroral') ||
    (combined.includes('earth') && combined.includes('magnetic field') && combined.includes('explorer'))
  ) {
    return CURATED_AI_MODELS['earth-magnetic-field-magnetosphere-explorer'];
  }
  // Model 67: Semiconductor p–n Junction, Band Gap & Diode Explorer
  if (
    combined.includes('semiconductor') ||
    combined.includes('p n junction') ||
    combined.includes('pn junction') ||
    combined.includes('depletion zone') ||
    combined.includes('band gap') ||
    combined.includes('shockley') ||
    combined.includes('diode explorer')
  ) {
    return CURATED_AI_MODELS['semiconductor-pn-junction-diode-explorer'];
  }
  // Model 68: Radioactive Decay, Half-Life & Alpha–Beta–Gamma Radiation Lab
  if (
    combined.includes('radioactive decay') ||
    combined.includes('half life') ||
    combined.includes('alpha beta gamma') ||
    combined.includes('geiger') ||
    combined.includes('radiation lab')
  ) {
    return CURATED_AI_MODELS['radioactive-decay-halflife-radiation-lab'];
  }

  // =========================================================================
  // PRIORITY CHECK: ADVANCED PHYSICS BATCH 1 (MODELS 1–7)
  // =========================================================================
  // Model 1: Electromagnetic Wave Propagation Explorer
  if (
    combined.includes('em wave') ||
    combined.includes('electromagnetic wave') ||
    combined.includes('poynting') ||
    (combined.includes('electric') && combined.includes('magnetic') && combined.includes('wave') && combined.includes('propagation'))
  ) {
    return CURATED_AI_MODELS['electromagnetic-wave-propagation'];
  }
  // Model 2: Plasma Physics Explorer
  if (
    !combined.includes('tokamak') &&
    !combined.includes('fusion') &&
    (combined.includes('plasma physics') ||
      combined.includes('plasma explorer') ||
      combined.includes('debye') ||
      combined.includes('larmor') ||
      (combined.includes('plasma') && (combined.includes('ion') || combined.includes('electron') || combined.includes('ionized') || combined.includes('confinement'))))
  ) {
    return CURATED_AI_MODELS['plasma-physics-explorer'];
  }
  // Model 3: Particle Accelerator Explorer
  if (
    combined.includes('particle accelerator') ||
    combined.includes('accelerator beamline') ||
    combined.includes('rf cavity') ||
    combined.includes('dipole magnet') ||
    (combined.includes('accelerator') && (combined.includes('beam') || combined.includes('deflection') || combined.includes('electric')))
  ) {
    return CURATED_AI_MODELS['particle-accelerator-explorer'];
  }
  // Model 4: Magnetic Levitation Mechanism Explorer
  if (
    combined.includes('magnetic levitation') ||
    combined.includes('maglev') ||
    combined.includes('earnshaw') ||
    combined.includes('levitation gap') ||
    (combined.includes('levitation') && (combined.includes('magnet') || combined.includes('air gap') || combined.includes('guideway')))
  ) {
    return CURATED_AI_MODELS['magnetic-levitation-explorer'];
  }
  // Model 5: Superconductivity and Meissner Effect Explorer
  if (
    combined.includes('superconduct') ||
    combined.includes('meissner') ||
    combined.includes('flux expulsion') ||
    combined.includes('critical temperature') ||
    combined.includes('ybco')
  ) {
    return CURATED_AI_MODELS['superconductivity-meissner-explorer'];
  }
  // Model 6: Black Hole and Gravitational Lensing Explorer
  if (
    combined.includes('black hole') ||
    combined.includes('gravitational lensing') ||
    combined.includes('schwarzschild') ||
    combined.includes('event horizon') ||
    combined.includes('photon sphere') ||
    combined.includes('einstein ring') ||
    combined.includes('spacetime curvature')
  ) {
    return CURATED_AI_MODELS['black-hole-gravitational-lensing'];
  }
  // Model 7: Quantum Tunnelling Explorer
  if (
    combined.includes('quantum tunnelling') ||
    combined.includes('quantum tunneling') ||
    combined.includes('tunnelling barrier') ||
    combined.includes('tunneling barrier') ||
    combined.includes('potential barrier') ||
    combined.includes('evanescent') ||
    (combined.includes('wavefunction') && combined.includes('barrier'))
  ) {
    return CURATED_AI_MODELS['quantum-tunnelling-explorer'];
  }

  // =========================================================================
  // PRIORITY CHECK: ADVANCED PHYSICS BATCH 2 (MODELS 48–54)
  // =========================================================================
  // Model 48: Faraday's Law: Electromagnetic Induction Explorer
  if (
    combined.includes('faraday') ||
    combined.includes('lenz') ||
    combined.includes('electromagnetic induction') ||
    combined.includes('flux linkage') ||
    combined.includes('induced emf')
  ) {
    return CURATED_AI_MODELS['faraday-law-induction-explorer'];
  }

  // Model 49: Electric Motor & Generator Energy Conversion Explorer
  if (
    combined.includes('motor and generator') ||
    combined.includes('motor generator') ||
    combined.includes('energy conversion explorer') ||
    combined.includes('back emf') ||
    combined.includes('reversible electromechanical') ||
    (combined.includes('motor') && combined.includes('generator'))
  ) {
    return CURATED_AI_MODELS['motor-generator-energy-explorer'];
  }

  // Model 50: AC Voltage Transformer & Magnetic Coupling Explorer
  if (
    combined.includes('transformer') ||
    combined.includes('mutual inductance') ||
    combined.includes('turns ratio') ||
    combined.includes('laminated core') ||
    combined.includes('magnetic coupling')
  ) {
    return CURATED_AI_MODELS['ac-voltage-transformer-explorer'];
  }

  // Model 51: Wave Interference & Diffraction Lab
  if (
    combined.includes('double slit') ||
    combined.includes('single slit') ||
    combined.includes('diffraction') ||
    combined.includes('fringe spacing') ||
    combined.includes('wave interference') ||
    combined.includes('huygens')
  ) {
    return CURATED_AI_MODELS['wave-interference-diffraction-lab'];
  }

  // Model 52: Optical Interference & Interferometer Explorer
  if (
    combined.includes('thin film') ||
    combined.includes('michelson') ||
    combined.includes('interferometer') ||
    combined.includes('fabry perot') ||
    combined.includes('optical interference') ||
    combined.includes('beam splitter')
  ) {
    return CURATED_AI_MODELS['optical-interferometer-explorer'];
  }

  // Model 53: Fluid Dynamics: Bernoulli, Pressure & Vortex Flow Explorer
  if (
    combined.includes('fluid dynamics') ||
    combined.includes('aerodynamics') ||
    combined.includes('venturi') ||
    combined.includes('bernoulli') ||
    combined.includes('vortex flow') ||
    combined.includes('airfoil') ||
    combined.includes('reynolds number')
  ) {
    return CURATED_AI_MODELS['fluid-dynamics-bernoulli-vortex'];
  }

  // Model 54: Nuclear Fusion Reactor: Magnetic Confinement Explorer
  if (
    combined.includes('nuclear fusion') ||
    combined.includes('nuclear fission') ||
    combined.includes('tokamak') ||
    combined.includes('fission reactor') ||
    combined.includes('fusion reactor') ||
    combined.includes('lawson criterion') ||
    combined.includes('magnetic confinement') ||
    combined.includes('deuterium')
  ) {
    return CURATED_AI_MODELS['tokamak-fusion-confinement-explorer'];
  }

  // =========================================================================
  // PRIORITY CHECK: ADVANCED PHYSICS BATCH 3 (MODELS 55–61)
  // =========================================================================
  // Model 55: Doppler Effect & Sonic Boom Explorer
  if (
    combined.includes('doppler') ||
    combined.includes('sonic boom') ||
    combined.includes('mach cone') ||
    combined.includes('mach number') ||
    combined.includes('supersonic shock') ||
    combined.includes('wavefront compression')
  ) {
    return CURATED_AI_MODELS['doppler-effect-sonic-boom-explorer'];
  }

  // Model 56: Seismic Waves & Earthquake Wave Propagation Lab
  if (
    combined.includes('seismic') ||
    combined.includes('earthquake') ||
    combined.includes('p-wave') ||
    combined.includes('s-wave') ||
    combined.includes('shadow zone') ||
    combined.includes('seismogram') ||
    combined.includes('epicentre') ||
    combined.includes('hypocentre')
  ) {
    return CURATED_AI_MODELS['seismic-waves-earthquake-lab'];
  }

  // Model 57: Gyroscope, Torque & Angular Momentum Laboratory
  if (
    combined.includes('gyroscope') ||
    combined.includes('gyroscopic') ||
    combined.includes('angular momentum') ||
    combined.includes('precession') ||
    combined.includes('cardan gimbal') ||
    combined.includes('nutation')
  ) {
    return CURATED_AI_MODELS['gyroscope-torque-angular-momentum-lab'];
  }

  // Model 58: Simple Harmonic Motion & Coupled Oscillators Lab
  if (
    combined.includes('coupled oscillator') ||
    combined.includes('coupled spring') ||
    combined.includes('normal mode') ||
    combined.includes('in-phase mode') ||
    combined.includes('anti-phase mode') ||
    combined.includes('beat frequency') ||
    combined.includes('shm coupled') ||
    (combined.includes('simple harmonic motion') && combined.includes('coupled'))
  ) {
    return CURATED_AI_MODELS['shm-coupled-oscillators-lab'];
  }

  // Model 59: Thermodynamics: Heat Engine & Carnot Cycle Explorer
  if (
    combined.includes('carnot') ||
    combined.includes('heat engine') ||
    combined.includes('isothermal expansion') ||
    combined.includes('adiabatic expansion') ||
    combined.includes('pv diagram') ||
    combined.includes('pv loop')
  ) {
    return CURATED_AI_MODELS['thermodynamics-carnot-heat-engine'];
  }

  // Model 60: Photoelectric Effect & Quantum Energy Explorer
  if (
    combined.includes('photoelectric') ||
    combined.includes('stopping potential') ||
    combined.includes('work function') ||
    combined.includes('threshold frequency') ||
    combined.includes('photoelectron')
  ) {
    return CURATED_AI_MODELS['photoelectric-effect-quantum-explorer'];
  }

  // Model 61: Special Relativity: Time Dilation & Length Contraction Lab
  if (
    combined.includes('special relativity') ||
    combined.includes('time dilation') ||
    combined.includes('length contraction') ||
    combined.includes('lorentz factor') ||
    combined.includes('light clock') ||
    combined.includes('proper time') ||
    combined.includes('proper length')
  ) {
    return CURATED_AI_MODELS['special-relativity-time-length-lab'];
  }

  // =========================================================================
  // PRIORITY CHECK: MODELS 21–25 BIOLOGY BATCH 1
  // =========================================================================
  // Model 21: Human Heart Explorer
  if (
    combined.includes('heart explorer') ||
    combined.includes('human heart explorer') ||
    (combined.includes('heart') && (combined.includes('cutaway') || combined.includes('blood flow') || combined.includes('atrium') || combined.includes('ventricle') || combined.includes('valves') || combined.includes('aorta') || combined.includes('septum')))
  ) {
    return CURATED_AI_MODELS['heart-explorer'] || CURATED_AI_MODELS.heartExplorer;
  }

  // Model 22: Human Respiratory System
  if (
    combined.includes('respiratory explorer') ||
    combined.includes('bronchial tree') ||
    combined.includes('alveoli') ||
    combined.includes('gas exchange') ||
    combined.includes('human respiratory system') ||
    (combined.includes('respiratory') && (combined.includes('tree') || combined.includes('alveol') || combined.includes('diaphragm') || combined.includes('exchange')))
  ) {
    return CURATED_AI_MODELS['respiratory-explorer'] || CURATED_AI_MODELS.respiratoryExplorer;
  }

  // Model 23: Human Digestive System
  if (
    combined.includes('digestive') ||
    combined.includes('digestive system') ||
    combined.includes('food path') ||
    combined.includes('alimentary canal') ||
    combined.includes('esophagus') ||
    combined.includes('oesophagus') ||
    combined.includes('peristalsis') ||
    combined.includes('villi') ||
    (combined.includes('stomach') && (combined.includes('intestine') || combined.includes('digestion') || combined.includes('rugae')))
  ) {
    return CURATED_AI_MODELS['digestive-system'] || CURATED_AI_MODELS.digestiveExplorer;
  }

  // Model 24: Human Brain Explorer
  if (
    combined.includes('brain') ||
    combined.includes('brain explorer') ||
    combined.includes('cerebrum') ||
    combined.includes('cerebellum') ||
    combined.includes('brainstem') ||
    (combined.includes('lobes') && combined.includes('frontal'))
  ) {
    return CURATED_AI_MODELS['brain-explorer'] || CURATED_AI_MODELS.brainExplorer;
  }

  // Model 25: Human Eye and Vision
  if (
    combined.includes('eye and vision') ||
    combined.includes('human eye') ||
    combined.includes('vision model') ||
    combined.includes('cornea') ||
    combined.includes('retina') ||
    combined.includes('photoreceptor') ||
    combined.includes('crystalline lens') ||
    (combined.includes('eye') && (combined.includes('pupil') || combined.includes('iris') || combined.includes('optic nerve') || combined.includes('light path') || combined.includes('refraction')))
  ) {
    return CURATED_AI_MODELS['eye-vision'] || CURATED_AI_MODELS.eyeVisionExplorer;
  }

  // =========================================================================
  // PRIORITY CHECK: MODELS 31–40 PHYSICS & ENGINEERING BATCH 3
  // =========================================================================
  // Model 31: AC Electric Generator
  if (
    combined.includes('ac generator') ||
    combined.includes('alternating current generator') ||
    (combined.includes('generator') && (combined.includes('armature') || combined.includes('slip ring') || combined.includes('sine wave')))
  ) {
    return CURATED_AI_MODELS['ac-generator'] || BATCH_3_MODELS.acGenerator;
  }
  // Model 33: Electromagnetic Induction Explorer
  if (
    combined.includes('electromagnetic induction') ||
    combined.includes('induction explorer') ||
    combined.includes('faraday') ||
    combined.includes('lenz') ||
    (combined.includes('galvanometer') && combined.includes('magnet'))
  ) {
    return CURATED_AI_MODELS['electromagnetic-induction'] || BATCH_3_MODELS.inductionExplorer;
  }
  // Model 36: Heat Transfer Explorer
  if (
    combined.includes('heat transfer') ||
    combined.includes('conduction convection radiation') ||
    (combined.includes('thermal') && (combined.includes('conduction') || combined.includes('convection') || combined.includes('radiation')))
  ) {
    return CURATED_AI_MODELS['heat-transfer-explorer'] || BATCH_3_MODELS.heatTransferExplorer;
  }
  // Model 37: Four-Stroke Internal Combustion Engine
  if (
    combined.includes('four stroke') ||
    combined.includes('combustion engine') ||
    combined.includes('piston and crankshaft') ||
    (combined.includes('engine') && (combined.includes('stroke') || combined.includes('spark plug') || combined.includes('valves')))
  ) {
    return CURATED_AI_MODELS['four-stroke-engine'] || BATCH_3_MODELS.fourStrokeEngine;
  }
  // Model 38: Electric Bell Mechanism
  if (
    combined.includes('electric bell') ||
    combined.includes('bell mechanism') ||
    (combined.includes('bell') && (combined.includes('gong') || combined.includes('hammer') || combined.includes('interrupter')))
  ) {
    return CURATED_AI_MODELS['electric-bell'] || BATCH_3_MODELS.electricBell;
  }
  // Model 39: Hydroelectric Power Station
  if (
    combined.includes('hydroelectric') ||
    combined.includes('hydro power') ||
    combined.includes('dam and turbine') ||
    (combined.includes('turbine') && combined.includes('penstock'))
  ) {
    return CURATED_AI_MODELS['hydroelectric-power'] || BATCH_3_MODELS.hydroelectricPower;
  }
  // Model 40: Motor Effect and Fleming's Left-Hand Rule
  if (
    combined.includes('motor effect') ||
    combined.includes('fleming') ||
    combined.includes('left hand rule') ||
    (combined.includes('conductor') && combined.includes('magnetic force'))
  ) {
    return CURATED_AI_MODELS['motor-effect-fleming'] || BATCH_3_MODELS.motorEffectFleming;
  }

  // =========================================================================
  // PRIORITY CHECK: MODELS 26–30 BIOLOGY BATCH 2
  // =========================================================================
  // Model 26: Plant Cell Explorer
  if (
    combined.includes('plant cell') ||
    combined.includes('plant-cell') ||
    (combined.includes('chloroplast') && combined.includes('cell')) ||
    (combined.includes('cell wall') && combined.includes('vacuole')) ||
    (combined.includes('photosynthesis') && combined.includes('cell'))
  ) {
    return CURATED_AI_MODELS['plant-cell-explorer'] || CURATED_AI_MODELS.plantCell;
  }

  // Model 27: Animal Cell Explorer
  if (
    combined.includes('animal cell') ||
    combined.includes('animal-cell') ||
    (combined.includes('mitochondria') && combined.includes('centrosome')) ||
    (combined.includes('cell') && combined.includes('organelle') && (combined.includes('golgi') || combined.includes('reticulum') || combined.includes('eukaryot')))
  ) {
    return CURATED_AI_MODELS['animal-cell-explorer'] || CURATED_AI_MODELS.animalCell;
  }

  // Model 28: Plant Root and Transport Explorer
  if (
    combined.includes('root and transport') ||
    combined.includes('root transport') ||
    combined.includes('plant root') ||
    combined.includes('root hair') ||
    (combined.includes('xylem') && combined.includes('phloem')) ||
    (combined.includes('plant') && (combined.includes('transport') || combined.includes('transpiration') || combined.includes('root system')))
  ) {
    return CURATED_AI_MODELS['plant-root-transport'] || CURATED_AI_MODELS.plantRootTransport;
  }

  // Model 29B: Blood Transport — Internal Circulatory System
  if (
    combined.includes('blood transport') ||
    combined.includes('blood-transport') ||
    combined.includes('circulatory system') ||
    combined.includes('internal circulation') ||
    combined.includes('internal circulatory') ||
    combined.includes('cardiovascular system') ||
    combined.includes('dual circulation') ||
    combined.includes('systemic circulation') ||
    combined.includes('pulmonary circulation') ||
    combined.includes('human circulation') ||
    (combined.includes('circulat') && (combined.includes('vessel') || combined.includes('artery') || combined.includes('vein') || combined.includes('heart'))) ||
    (combined.includes('blood') && combined.includes('transport'))
  ) {
    return CURATED_AI_MODELS['blood-transport'];
  }

  // Model 29: Blood and Circulation Microscope
  if (
    combined.includes('blood and circulation') ||
    combined.includes('blood circulation') ||
    combined.includes('circulation microscope') ||
    combined.includes('blood microscope') ||
    (combined.includes('blood') && (combined.includes('red blood cell') || combined.includes('erythrocyte') || combined.includes('platelet') || combined.includes('clotting') || combined.includes('leukocyte') || combined.includes('smear')))
  ) {
    return CURATED_AI_MODELS['blood-circulation-microscope'] || CURATED_AI_MODELS.bloodMicroscope;
  }

  // Model 30: Neuron and Nerve Signal Explorer
  if (
    combined.includes('neuron and nerve') ||
    combined.includes('neuron signal') ||
    combined.includes('nerve signal') ||
    combined.includes('action potential') ||
    combined.includes('chemical synapse') ||
    (combined.includes('neuron') && (combined.includes('axon') || combined.includes('dendrite') || combined.includes('myelin') || combined.includes('synapse') || combined.includes('impulse')))
  ) {
    return CURATED_AI_MODELS['neuron-nerve-signal'] || CURATED_AI_MODELS.neuronSignalExplorer;
  }

  // =========================================================================
  // PRIORITY CHECK: MODELS 11–20 HIDDEN REGISTRY
  // =========================================================================
  // Model 11: Friction Explorer
  if (
    combined.includes('friction explorer') ||
    combined.includes('sliding block') ||
    (combined.includes('friction') && (combined.includes('block') || combined.includes('static') || combined.includes('kinetic') || combined.includes('normal force') || combined.includes('surface') || combined.includes('coefficient')))
  ) {
    return CURATED_AI_MODELS.friction;
  }

  // Model 12: Wave Motion Explorer
  if (
    combined.includes('wave motion') ||
    combined.includes('wave propagation') ||
    combined.includes('transverse wave') ||
    (combined.includes('wave') && (combined.includes('wavelength') || combined.includes('amplitude') || combined.includes('crest') || combined.includes('oscillation') || combined.includes('trough')))
  ) {
    return CURATED_AI_MODELS.waveMotion;
  }

  // Model 13: Sound Wave Explorer
  if (
    combined.includes('sound wave') ||
    combined.includes('longitudinal wave') ||
    combined.includes('compression') ||
    combined.includes('rarefaction') ||
    combined.includes('sound propagation') ||
    (combined.includes('sound') && (combined.includes('air') || combined.includes('medium') || combined.includes('speaker') || combined.includes('pitch')))
  ) {
    return CURATED_AI_MODELS.soundWave;
  }

  // Model 14: Magnetic Field Explorer
  if (
    combined.includes('magnetic field explorer') ||
    combined.includes('straight wire') ||
    combined.includes('bar magnet') ||
    (combined.includes('magnetic') && (combined.includes('field lines') || combined.includes('compass') || combined.includes('wire')))
  ) {
    return CURATED_AI_MODELS.magneticField;
  }

  // Model 15: DC Electric Motor
  if (
    combined.includes('dc motor') ||
    combined.includes('dc electric motor') ||
    combined.includes('split-ring commutator')
  ) {
    return CURATED_AI_MODELS.dcMotor;
  }

  // Rutherford Gold Foil Scattering Experiment
  if (
    combined.includes('rutherford') ||
    combined.includes('gold foil') ||
    combined.includes('alpha particle') ||
    combined.includes('geiger') ||
    combined.includes('marsden') ||
    (combined.includes('alpha') && combined.includes('scattering'))
  ) {
    return CURATED_AI_MODELS.rutherford;
  }

  // Model 16: Interactive Atom Explorer
  if (
    combined.includes('interactive atom') ||
    combined.includes('atom explorer') ||
    combined.includes('bohr model') ||
    combined.includes('electron shell') ||
    combined.includes('sodium atom') ||
    combined.includes('carbon atom') ||
    (combined.includes('atom') && (combined.includes('proton') || combined.includes('neutron') || combined.includes('nucleus')))
  ) {
    return CURATED_AI_MODELS.atomExplorer;
  }

  // Model 17: Ionic & Covalent Bonding Explorer
  if (
    combined.includes('ionic and covalent') ||
    combined.includes('bonding explorer') ||
    combined.includes('ionic bond') ||
    combined.includes('covalent bond') ||
    combined.includes('sodium chloride') ||
    combined.includes('nacl') ||
    combined.includes('methane') ||
    combined.includes('electron transfer') ||
    combined.includes('electron sharing')
  ) {
    return CURATED_AI_MODELS.chemicalBonding;
  }

  // Model 18: Water Molecule Explorer
  if (
    combined.includes('water molecule explorer') ||
    combined.includes('bent geometry') ||
    combined.includes('h2o molecule') ||
    combined.includes('hydrogen bonding network') ||
    (combined.includes('water') && combined.includes('molecule') && (combined.includes('104.5') || combined.includes('lone pair') || combined.includes('hydrogen bond') || combined.includes('explorer')))
  ) {
    return CURATED_AI_MODELS.waterMoleculeDetailed;
  }

  // Model 19: Carbon Dioxide Molecule Explorer
  if (
    combined.includes('carbon dioxide') ||
    combined.includes('co2') ||
    combined.includes('linear molecule') ||
    combined.includes('o=c=o') ||
    combined.includes('nonpolar dipole')
  ) {
    return CURATED_AI_MODELS.carbonDioxide;
  }


  // =========================================================================
  // BASE SCIENTIFIC MODELS (MODELS 1–10 & TELESCOPE / RUTHERFORD)
  // =========================================================================
  if (
    combined.includes('telescope') ||
    combined.includes('refractor') ||
    combined.includes('reflector') ||
    combined.includes('keplerian') ||
    combined.includes('galilean') ||
    combined.includes('newtonian') ||
    combined.includes('eyepiece') ||
    combined.includes('astronomy') ||
    combined.includes('focuser')
  ) {
    return CURATED_AI_MODELS.telescope;
  }
  if (
    combined.includes('rutherford') ||
    combined.includes('gold foil') ||
    combined.includes('alpha particle') ||
    combined.includes('scattering') ||
    combined.includes('geiger') ||
    combined.includes('marsden')
  ) {
    return CURATED_AI_MODELS.rutherford;
  }
  if (
    combined.includes('pendulum') ||
    combined.includes('bob') ||
    combined.includes('harmonic motion') ||
    combined.includes('shm')
  ) {
    return CURATED_AI_MODELS.pendulum;
  }
  if (
    combined.includes('motor') ||
    combined.includes('electric motor') ||
    combined.includes('armature') ||
    combined.includes('stator') ||
    combined.includes('rotor') ||
    combined.includes('lorentz') ||
    combined.includes('commutator')
  ) {
    return CURATED_AI_MODELS.motor;
  }
  if (
    combined.includes('lever') ||
    combined.includes('fulcrum') ||
    combined.includes('seesaw') ||
    combined.includes('mechanical advantage')
  ) {
    return CURATED_AI_MODELS.lever;
  }
  if (
    combined.includes('lung') ||
    combined.includes('respiratory') ||
    combined.includes('respirat') ||
    combined.includes('breath') ||
    combined.includes('trachea') ||
    combined.includes('bronch') ||
    combined.includes('diaphragm')
  ) {
    return CURATED_AI_MODELS.respiratory;
  }
  if (
    (combined.includes('bar magnet') || combined.includes('magnetic dipole')) &&
    !combined.includes('solenoid') &&
    !combined.includes('electromagnet') &&
    !combined.includes('induction') &&
    !combined.includes('levitation') &&
    !combined.includes('transformer')
  ) {
    return CURATED_AI_MODELS.magnetic;
  }
  if (
    (combined.includes('solar system') ||
      combined.includes('planetary orbit') ||
      combined.includes('kepler')) &&
    !combined.includes('solar cell') &&
    !combined.includes('solar panel') &&
    !combined.includes('earthquake') &&
    !combined.includes('tectonic')
  ) {
    return CURATED_AI_MODELS.solar;
  }
  if (
    combined.includes('water molecule') ||
    combined.includes('h2o') ||
    (combined.includes('water') && (combined.includes('bond') || combined.includes('vsepr') || combined.includes('dipole')))
  ) {
    return CURATED_AI_MODELS.water;
  }
  if (
    combined.includes('nephron') ||
    combined.includes('kidney') ||
    combined.includes('renal') ||
    combined.includes('glomerulus') ||
    combined.includes('loop of henle')
  ) {
    return CURATED_AI_MODELS.nephron;
  }
  if (
    combined.includes('heart') ||
    combined.includes('cardiac') ||
    combined.includes('ventricle') ||
    combined.includes('atrium') ||
    combined.includes('circulation')
  ) {
    return CURATED_AI_MODELS.heart;
  }
  if (
    /\bears?\b/i.test(combined) ||
    combined.includes('auditory') ||
    combined.includes('hearing') ||
    combined.includes('cochlea') ||
    combined.includes('tympan') ||
    combined.includes('ossicle')
  ) {
    return CURATED_AI_MODELS.ear;
  }
  if (
    combined.includes('projectile') ||
    combined.includes('parabola') ||
    combined.includes('launch') ||
    combined.includes('trajectory') ||
    combined.includes('ballistic')
  ) {
    return CURATED_AI_MODELS.projectile;
  }
  if (
    combined.includes('inclined') ||
    combined.includes('incline') ||
    combined.includes('ramp') ||
    combined.includes('slope') ||
    (combined.includes('friction') && !combined.includes('circuit'))
  ) {
    return CURATED_AI_MODELS.inclinedPlane;
  }
  if (
    combined.includes('hydraulic') ||
    combined.includes('pascal') ||
    combined.includes('piston') ||
    combined.includes('hydraulic lift')
  ) {
    return CURATED_AI_MODELS.hydraulicLift;
  }
  if (
    combined.includes('cradle') ||
    combined.includes('newton cradle') ||
    combined.includes('momentum') ||
    combined.includes('collision') ||
    combined.includes('elastic collision')
  ) {
    return CURATED_AI_MODELS.newtonsCradle;
  }
  if (
    combined.includes('reflection') ||
    combined.includes('refraction') ||
    combined.includes('snell') ||
    combined.includes('critical angle') ||
    combined.includes('total internal reflection')
  ) {
    return CURATED_AI_MODELS.reflectionRefraction;
  }
  if (
    combined.includes('prism') ||
    combined.includes('dispersion') ||
    combined.includes('rainbow') ||
    combined.includes('spectrum') ||
    combined.includes('chromatic')
  ) {
    return CURATED_AI_MODELS.prismDispersion;
  }
  if (
    combined.includes('circuit') ||
    combined.includes('ohm') ||
    combined.includes('resistor') ||
    combined.includes('electric circuit')
  ) {
    return CURATED_AI_MODELS.circuit;
  }
  if (
    combined.includes('dna') ||
    combined.includes('double helix') ||
    combined.includes('nucleotide') ||
    combined.includes('base pair') ||
    combined.includes('genetic')
  ) {
    return CURATED_AI_MODELS.dna;
  }
  if (
    (combined.includes('eukaryotic cell') ||
      combined.includes('animal cell') ||
      combined.includes('cell structure')) &&
    !combined.includes('chloroplast') &&
    !combined.includes('membrane') &&
    !combined.includes('bilayer') &&
    !combined.includes('electrochemical') &&
    !combined.includes('galvanic') &&
    !combined.includes('solar cell') &&
    !combined.includes('fuel cell') &&
    !combined.includes('sickle') &&
    !combined.includes('mitosis') &&
    !combined.includes('meiosis')
  ) {
    return CURATED_AI_MODELS.cell;
  }
  return null;
}


// Helper to validate and sanitize AI-generated model specifications
export function validateAndSanitizeModelSpec(raw: any, prompt: string): any {
  if (!raw || typeof raw !== 'object') return null;

  const validShapes = new Set([
    'box',
    'cylinder',
    'sphere',
    'cone',
    'torus',
    'ring',
    'capsule',
    'tube',
    'octahedron',
  ]);
  const validMaterials = new Set([
    'standard',
    'metal',
    'glass',
    'wireframe',
    'glow',
    'copper',
    'rubber',
    'tissue',
    'liquid',
    'bone',
    'plastic',
  ]);

  const sanitizedParts = Array.isArray(raw.parts)
    ? raw.parts
        .filter((p: any) => p && typeof p === 'object')
        .map((p: any, idx: number) => {
          const shape = validShapes.has(p.shape) ? p.shape : 'box';
          const material = validMaterials.has(p.material) ? p.material : 'standard';
          const dimensions = Array.isArray(p.dimensions) && p.dimensions.length > 0
            ? p.dimensions.map((d: any) => {
                const num = Number(d);
                return Number.isFinite(num) && num > 0 ? Math.max(0.05, Math.min(20, num)) : 1;
              })
            : shape === 'sphere' ? [1] : shape === 'cylinder' ? [0.5, 2] : [1, 1, 1];

          const position = Array.isArray(p.position) && p.position.length >= 3
            ? [
                Number.isFinite(Number(p.position[0])) ? Number(p.position[0]) : 0,
                Number.isFinite(Number(p.position[1])) ? Number(p.position[1]) : 0,
                Number.isFinite(Number(p.position[2])) ? Number(p.position[2]) : 0,
              ]
            : [0, 0, 0];

          const rotation = Array.isArray(p.rotation) && p.rotation.length >= 3
            ? [
                Number.isFinite(Number(p.rotation[0])) ? Number(p.rotation[0]) : 0,
                Number.isFinite(Number(p.rotation[1])) ? Number(p.rotation[1]) : 0,
                Number.isFinite(Number(p.rotation[2])) ? Number(p.rotation[2]) : 0,
              ]
            : undefined;

          let color = typeof p.color === 'string' && p.color.startsWith('#') ? p.color : '#0284C7';

          const canonicalDisplayName = p.label || p.name || `Component ${idx + 1}`;
          return {
            id: p.id || `part-${idx + 1}`,
            name: canonicalDisplayName,
            shape,
            dimensions,
            position,
            rotation,
            color,
            material,
            opacity: typeof p.opacity === 'number' && Number.isFinite(p.opacity) ? Math.max(0.1, Math.min(1, p.opacity)) : 1,
            label: canonicalDisplayName,
            description: p.description || undefined,
            whatIsIt: typeof p.whatIsIt === 'string' ? p.whatIsIt : undefined,
            whatDoesItDo: typeof p.whatDoesItDo === 'string' ? p.whatDoesItDo : undefined,
            realLifeExample: typeof p.realLifeExample === 'string' ? p.realLifeExample : undefined,
            groupId: typeof p.groupId === 'string' ? p.groupId : undefined,
            opticalRole: typeof p.opticalRole === 'string' ? p.opticalRole : undefined,
            animation: p.animation && typeof p.animation === 'object'
              ? {
                  type: ['spin', 'oscillate', 'orbit', 'pulse'].includes(p.animation.type) ? p.animation.type : 'spin',
                  axis: ['x', 'y', 'z'].includes(p.animation.axis) ? p.animation.axis : 'y',
                  speed: typeof p.animation.speed === 'number' && Number.isFinite(p.animation.speed) ? Math.max(0.1, Math.min(10, p.animation.speed)) : 1.5,
                  amplitude: typeof p.animation.amplitude === 'number' && Number.isFinite(p.animation.amplitude) ? Math.max(0.01, Math.min(5, p.animation.amplitude)) : 0.2,
                }
              : undefined,
          };
        })
    : [];

  if (sanitizedParts.length < 2) return null;

  const sanitizedParams: Record<string, any> = {};
  if (raw.parameters && typeof raw.parameters === 'object') {
    Object.entries(raw.parameters).forEach(([k, v]: [string, any]) => {
      if (v && typeof v === 'object') {
        sanitizedParams[k] = {
          id: v.id || k,
          name: v.name || k,
          min: typeof v.min === 'number' && Number.isFinite(v.min) ? v.min : 0,
          max: typeof v.max === 'number' && Number.isFinite(v.max) ? v.max : 100,
          step: typeof v.step === 'number' && Number.isFinite(v.step) ? v.step : 1,
          defaultValue: typeof v.defaultValue === 'number' && Number.isFinite(v.defaultValue) ? v.defaultValue : 10,
          unit: v.unit || '',
          description: v.description || '',
          affects: v.affects || 'animationSpeed',
          targetPartId: v.targetPartId || undefined,
          scaleFactor: typeof v.scaleFactor === 'number' && Number.isFinite(v.scaleFactor) ? v.scaleFactor : 1,
        };
      }
    });
  }
  if (Object.keys(sanitizedParams).length === 0) {
    sanitizedParams.processRate = {
      id: 'processRate',
      name: 'Process / Excitation Speed',
      min: 0.2,
      max: 3.5,
      step: 0.1,
      defaultValue: 1.0,
      unit: '×',
      description: 'Controls the dynamic oscillation, rotation, or reaction velocity of active components.',
      affects: 'animationSpeed',
      scaleFactor: 1,
    };
    sanitizedParams.componentScale = {
      id: 'componentScale',
      name: 'Active Component Scale',
      min: 0.6,
      max: 1.6,
      step: 0.05,
      defaultValue: 1.0,
      unit: '×',
      description: 'Scales the active structural component for detailed inspection.',
      affects: 'objectScale',
      targetPartId: sanitizedParts[0]?.id,
      scaleFactor: 1,
    };
  }

  const sanitizedConditions: Record<string, any> = {};
  if (raw.conditions && typeof raw.conditions === 'object') {
    Object.entries(raw.conditions).forEach(([k, v]: [string, any]) => {
      if (v && typeof v === 'object') {
        sanitizedConditions[k] = {
          id: v.id || k,
          name: v.name || k,
          type: v.type || 'boolean',
          defaultValue: typeof v.defaultValue === 'boolean' ? v.defaultValue : true,
          description: v.description || '',
        };
      }
    });
  }

  const cameraPos = Array.isArray(raw.camera?.position) && raw.camera.position.length >= 3
    ? [
        Number.isFinite(Number(raw.camera.position[0])) ? Number(raw.camera.position[0]) : 0,
        Number.isFinite(Number(raw.camera.position[1])) ? Number(raw.camera.position[1]) : 4,
        Number.isFinite(Number(raw.camera.position[2])) ? Number(raw.camera.position[2]) : 8,
      ]
    : [0, 4, 8];

  const cameraTarget = Array.isArray(raw.camera?.target) && raw.camera.target.length >= 3
    ? [
        Number.isFinite(Number(raw.camera.target[0])) ? Number(raw.camera.target[0]) : 0,
        Number.isFinite(Number(raw.camera.target[1])) ? Number(raw.camera.target[1]) : 0,
        Number.isFinite(Number(raw.camera.target[2])) ? Number(raw.camera.target[2]) : 0,
      ]
    : [0, 0, 0];

  // Infer functionalType if not specified
  let functionalType = raw.functionalType;
  const combinedText = `${prompt} ${raw.title || ''} ${raw.concept || ''}`.toLowerCase();
  if (!functionalType || functionalType === 'standard') {
    if (combinedText.includes('telescope')) functionalType = 'optical-telescope';
    else if (combinedText.includes('rutherford') || combinedText.includes('gold foil')) functionalType = 'rutherford-scattering';
    else if (combinedText.includes('pendulum')) functionalType = 'pendulum-harmonics';
    else if (combinedText.includes('motor')) functionalType = 'dc-motor-assembly';
    else if (combinedText.includes('lever')) functionalType = 'class-1-lever';
    else if (combinedText.includes('respirat') || combinedText.includes('lung')) functionalType = 'respiratory-system';
    else if (combinedText.includes('magnet')) functionalType = 'bar-magnet-field';
    else if (combinedText.includes('solar') || combinedText.includes('planet')) functionalType = 'solar-system';
    else if (combinedText.includes('water') || combinedText.includes('h2o')) functionalType = 'water-molecule';
    else if (combinedText.includes('microscope')) functionalType = 'compound-microscope';
    else if (combinedText.includes('heart') || combinedText.includes('cardiac')) functionalType = 'human-heart';
    else if (combinedText.includes('ear')) functionalType = 'human-ear';
    else if (combinedText.includes('dna')) functionalType = 'dna-helix';
    else if (combinedText.includes('cell')) functionalType = 'eukaryotic-cell';
    else if (combinedText.includes('nephron')) functionalType = 'nephron';
    else functionalType = 'standard';
  }

  // Subject-specific structural component validation & repair
  if (functionalType === 'optical-telescope') {
    const hasObjective = sanitizedParts.some((p: any) =>
      p.id.includes('objective') || p.name.toLowerCase().includes('objective') || p.opticalRole === 'objectiveLens'
    );
    if (!hasObjective) {
      sanitizedParts.push({
        id: 'part-objective-lens',
        name: 'Objective Doublet Lens',
        shape: 'cylinder',
        dimensions: [0.38, 0.08],
        position: [0, 0, 1.8],
        rotation: [Math.PI / 2, 0, 0],
        color: '#38bdf8',
        material: 'glass',
        opacity: 0.85,
        label: 'Objective Lens',
        opticalRole: 'objectiveLens',
        description: 'Large diameter doublet lens gathering distant starlight.',
        whatIsIt: 'The primary front lens of an astronomical refractor.',
        whatDoesItDo: 'Refracts incoming parallel rays to a focal point.',
      });
    }
  }

  return {
    id: raw.id || prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `model-${Date.now()}`,
    title: raw.title || prompt.charAt(0).toUpperCase() + prompt.slice(1),
    concept: raw.concept || prompt,
    description: raw.description || `Interactive 3D scientific model visualizing ${prompt}.`,
    whatIsIt: raw.whatIsIt || undefined,
    howDoesItWork: raw.howDoesItWork || undefined,
    realLifeExample: raw.realLifeExample || undefined,
    examConnection: raw.examConnection || undefined,
    scaleNote: raw.scaleNote || undefined,
    simulationModel: raw.simulationModel || 'predictive',
    functionalType,
    prompt,
    camera: {
      position: cameraPos,
      target: cameraTarget,
    },
    parts: sanitizedParts,
    parameters: sanitizedParams,
    conditions: sanitizedConditions,
    equations: Array.isArray(raw.equations) ? raw.equations.filter((e: any) => typeof e === 'string') : undefined,
    curiosityPrompts: Array.isArray(raw.curiosityPrompts) ? raw.curiosityPrompts.filter((c: any) => typeof c === 'string') : undefined,
    generationSource: raw.generationSource || 'ai-live',
    subjectDomain: raw.subjectDomain || undefined,
  };
}

// 1. Generate 3D Model with Model Fallback + Procedural Scientific 3D Synthesizer
export async function generate3DModel(
  userQuery: string,
  options?: { forceFresh?: boolean; requestId?: string }
) {
  const reqId = options?.requestId || `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const normKey = normalizePrompt(userQuery);

  // 1. Check server-side cache for instant deterministic repeated prompts (unless forcing fresh synthesis)
  if (!options?.forceFresh && modelCache.has(normKey)) {
    const cached = modelCache.get(normKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return {
        success: true,
        model: {
          ...cached.spec,
          prompt: userQuery,
        },
        isFallback: false,
        activeModel: 'cache-hit',
        requestId: reqId,
      };
    }
  }

  // 2. Verified Model Template Router (Only when not forcing a custom fresh synthesis)
  if (!options?.forceFresh) {
    const verifiedMatch = matchVerifiedScientificModel(userQuery);
    if (verifiedMatch) {
      const spec = {
        ...verifiedMatch,
        prompt: userQuery,
        generationSource: 'curated-preset' as const,
      };
      modelCache.set(normKey, { spec, timestamp: Date.now() });
      return {
        success: true,
        model: spec,
        isFallback: false,
        activeModel: 'verified-scientific-template',
        requestId: reqId,
      };
    }
  }

  const aiClient = getAiClient();
  if (!aiClient) {
    // Synthesize custom multi-part 3D model using the Procedural Scientific 3D Synthesizer
    const synthesized = findCuratedFallback(userQuery, options?.forceFresh);
    const spec = {
      ...synthesized,
      prompt: userQuery,
      generationSource: synthesized.generationSource || ('procedural-synthesizer' as const),
    };
    modelCache.set(normKey, { spec, timestamp: Date.now() });
    return {
      success: true,
      model: spec,
      isFallback: false,
      activeModel: 'procedural-scientific-synthesizer',
      requestId: reqId,
    };
  }

  const systemInstruction = `You are Tech-Anatomix's Structured 3D Scientific Model Synthesizer.
Translate the user's scientific prompt into a valid, rich, modular 3D model specification to be rendered with Three.js in WebGL.

SCIENTIFIC MODEL INTEGRITY RULES:
1. Provide between 6 and 12 recognizable, logically assembled components positioned in 3D coordinate space around [0,0,0].
2. NO FLOATING OBJECTS: Every component must connect physically or spatially to a mounting base, stand, pivot, axle, molecular bond, or biological membrane.
3. REAL RELATIVE PROPORTIONS: Respect authentic scale relationships between parts (e.g. telescope tube length vs lens diameter, motor axle vs armature, molecular bond lengths and angles, cell nucleus vs organelles).
4. SCIENTIFIC MATERIALS: Use authentic PBR materials: "metal" (conductors/hardware), "copper" (windings), "glass" (lenses/membranes/vessels), "rubber" (seals/insulators), "tissue" (muscles/organs), "liquid" (fluids/cytoplasm), "bone" (skeletal/supports), "glow" (energy/photons/signals), "plastic", "standard".
5. ASSIGN FUNCTIONAL TYPE: If the model represents an established preset mechanism, set "functionalType" accordingly, or "standard" for custom assemblies so every part in "parts" is rendered with full animations and interactive parameters.
6. EXPERIMENT PARAMETERS: Provide 2-4 interactive parameters with real units and ranges (e.g. speed, angle, length, voltage, temperature) that affect "animationSpeed", "objectScale", "objectRotation", or "objectPosition".

Return ONLY a valid strict JSON object matching this schema:
{
  "id": "kebab-case-id",
  "title": "Clear Model Title",
  "concept": "Scientific Concept Name",
  "subjectDomain": "Physics" | "Chemistry" | "Biology" | "Anatomy",
  "description": "2-3 sentences explaining the science and operational mechanism.",
  "whatIsIt": "A short, simple-English definition for school students.",
  "howDoesItWork": "A short explanation of the core scientific principle.",
  "realLifeExample": "A familiar everyday example connected to this concept.",
  "examConnection": "A short exam-relevant point or governing rule.",
  "functionalType": "standard",
  "camera": {
    "position": [0, 3.5, 8.5],
    "target": [0, 0, 0]
  },
  "parts": [
    {
      "id": "part-id",
      "name": "Part Name",
      "shape": "box" | "cylinder" | "sphere" | "cone" | "torus" | "ring" | "capsule" | "tube" | "octahedron",
      "dimensions": [number, ...],
      "position": [x, y, z],
      "rotation": [rx, ry, rz],
      "color": "#HexColor",
      "material": "standard" | "metal" | "glass" | "copper" | "rubber" | "tissue" | "liquid" | "bone" | "glow" | "plastic",
      "opacity": 1.0,
      "label": "3D Label Text",
      "description": "Educational description when inspected.",
      "whatIsIt": "Short simple-English definition of this part.",
      "whatDoesItDo": "Short explanation of what this part does during operation.",
      "realLifeExample": "Everyday example connected to this part.",
      "animation": {
        "type": "spin" | "oscillate" | "orbit" | "pulse",
        "axis": "x" | "y" | "z",
        "speed": 1.5,
        "amplitude": 0.2
      }
    }
  ],
  "parameters": {
    "paramId": {
      "id": "paramId",
      "name": "Parameter Name",
      "min": 0.2,
      "max": 3.5,
      "step": 0.1,
      "defaultValue": 1.0,
      "unit": "unit",
      "description": "What this parameter controls.",
      "affects": "animationSpeed" | "objectScale" | "objectRotation" | "objectPosition",
      "targetPartId": "part-id",
      "scaleFactor": 1
    }
  },
  "conditions": {
    "condId": {
      "id": "condId",
      "name": "Condition Toggle Name",
      "type": "boolean",
      "defaultValue": true,
      "description": "What this toggle does."
    }
  },
  "equations": [
    "Unicode scientific formula string"
  ],
  "curiosityPrompts": [
    "Thought-provoking scientific question about this model."
  ]
}`;

  const execution = await modelRouter.executeWithModelFallback(
    'structured_3d_model',
    async (modelId) => {
      const response = await aiClient.models.generateContent({
        model: modelId,
        contents: `Create a comprehensive 6-to-12-part interactive 3D scientific model for: "${userQuery}". Ensure accurate 3D component coordinates, distinct colors/materials, part-level educational explanations, animations, and interactive parameters.`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: options?.forceFresh ? 0.4 : 0.25,
        },
      });

      const rawJson = cleanJsonText(response.text || '{}');
      const parsed = JSON.parse(rawJson);
      const sanitized = validateAndSanitizeModelSpec(parsed, userQuery);

      if (!sanitized || sanitized.parts.length < 4) {
        throw new Error('Model spec returned insufficient parts or failed validation criteria');
      }

      return {
        ...sanitized,
        generationSource: 'ai-live' as const,
      };
    },
    15000,
    30000
  );

  if (execution && execution.result) {
    modelCache.set(normKey, { spec: execution.result, timestamp: Date.now() });
    return {
      success: true,
      model: execution.result,
      isFallback: false,
      activeModel: execution.modelId,
      attempts: execution.attempts,
      switchedModel: execution.switchedModel,
      requestId: reqId,
    };
  }

  // Synthesize rich procedural 3D scientific model tailored to the prompt
  const fallbackModel = findCuratedFallback(userQuery, options?.forceFresh);
  const finalModel = {
    ...fallbackModel,
    prompt: userQuery,
    generationSource: fallbackModel.generationSource || ('procedural-synthesizer' as const),
  };
  modelCache.set(normKey, { spec: finalModel, timestamp: Date.now() });
  return {
    success: true,
    model: finalModel,
    isFallback: false,
    activeModel: 'procedural-scientific-synthesizer',
    requestId: reqId,
  };
}

export function findCuratedFallback(query: string, forceFresh?: boolean): any {
  if (!forceFresh) {
    const verified = matchVerifiedScientificModel(query);
    if (verified) {
      return {
        ...verified,
        generationSource: 'curated-preset',
      };
    }
  }

  // Synthesize a complete, multi-part, interactive 3D scientific model tailored to the user's prompt
  return synthesizeProceduralScientificModel(query);
}

// 2. Chat with Lab Mentor
export async function chatWithLabMentor(question: string, modelTitle?: string, subject?: string, context: any = {}) {
  const aiClient = getAiClient();
  const effectiveTitle =
    modelTitle && modelTitle !== 'Scientific Simulation'
      ? modelTitle
      : context?.title || modelTitle || 'Scientific Simulation';
  const effectiveSubject =
    subject && subject !== 'Science'
      ? subject
      : context?.subject || subject || 'Science';

  const selectedComponent = context?.selectedComponent;
  const rawComponents = Array.isArray(context?.components)
    ? context.components
    : Array.isArray(context?.parts)
      ? context.parts
      : [];
  const componentsList = rawComponents
    .map((c: any) => `${c.name || c.id} (${c.whatIsIt || c.description || ''})`)
    .join(', ');

  if (aiClient) {
    const prompt = `STUDENT INQUIRY: "${question}"

STRUCTURED MODEL CONTEXT:
- Active 3D Model: ${effectiveTitle} (${effectiveSubject})
- Scientific Concept: ${context?.concept || effectiveTitle}
${context?.description ? `- Model Overview: ${context.description}` : ''}
- Model Parts & Components: ${componentsList || 'Standard modular components'}
${
  selectedComponent
    ? `- Currently Selected Component: "${selectedComponent.name || selectedComponent.id}"
  * What is it: ${selectedComponent.whatIsIt || ''}
  * What does it do: ${selectedComponent.whatDoesItDo || selectedComponent.description || ''}
  * Real-life example: ${selectedComponent.realLifeExample || ''}`
    : '- No single component selected (student is asking about the whole model or simulation).'
}
- Current Experiment Parameters: ${JSON.stringify(context?.parameters || {})}
- Current Real-time Measurements/Outputs: ${JSON.stringify(context?.results || context?.measurements || {})}
${context?.recentChange ? `- Recent State Change: ${JSON.stringify(context.recentChange)}` : ''}

INSTRUCTIONS FOR VIZLAB AI:
1. Answer the student's question accurately, concisely, and encouragingly.
2. Ground your response in the EXACT active 3D model (${effectiveTitle}), its current parameters, and its live outputs/components.
3. If the student refers to "this", "it", or "why is it spinning/pumping/slower", resolve the reference using the currently selected component or recent parameter change.
4. Keep the explanation suitable for school/introductory STEM students while maintaining scientific correctness and real formulas where helpful.
5. Max 2-4 short, clear paragraphs. Use **bold** for key scientific terms and bullet points for multi-step points.
6. CRITICAL FORMATTING RULE: NEVER output raw LaTeX dollar-sign syntax like $25\\text{ m/s}$, $45^\\circ$, $9.81\\text{ m/s}^2$, or \\frac{a}{b}. Always write numbers, units, angles, superscripts, subscripts, and equations in clean, directly readable Unicode notation (e.g., 25 m/s, 45°, 9.81 m/s², CO₂, H₂O, ΔT, ×, ÷, →, π, √(L/g)). Wrap standalone equations in single backticks like \`R = (v² sin(2θ)) / g\`.`;

    const execution = await modelRouter.executeWithModelFallback(
      'chat_assistant',
      async (modelId) => {
        const response = await aiClient.models.generateContent({
          model: modelId,
          contents: prompt,
          config: {
            systemInstruction:
              'You are VIZLAB AI Lab Mentor, an elite, model-aware STEM educator. Provide insightful, mathematically and biologically grounded answers connected directly to the active 3D model in front of the student. Always write units and equations using clean Unicode symbols (m/s², °, ×, →, π, √) and clean Markdown (**bold**, bullet lists)—never emit raw LaTeX like $25\\text{ m/s}$ or $45^\\circ$.',
            temperature: 0.3,
          },
        });

        if (response.text && response.text.trim()) {
          return cleanAndFormatScientificText(response.text.trim());
        }
        throw new Error('Empty response from model');
      },
      10000
    );

    if (execution && execution.result) {
      return {
        answer: execution.result,
        reply: execution.result,
        text: execution.result,
        activeModel: execution.modelId,
      };
    }
  }

  // Deterministic context-aware answer if AI is offline
  const q = question.toLowerCase();
  const paramEntries = Object.entries(context?.parameters || {});
  const resultEntries = Object.entries(context?.results || context?.measurements || {});
  const paramSummary =
    paramEntries.length > 0
      ? paramEntries.map(([k, v]) => `**${k}**: ${v}`).join(', ')
      : '';
  const resultSummary =
    resultEntries.length > 0
      ? resultEntries.map(([k, v]) => `**${k}**: ${v}`).join(', ')
      : '';

  let answer = `In **${effectiveTitle}** (${effectiveSubject}), every physical component and parameter operates under verified scientific principles.${context?.description ? `\n\n${context.description}` : ''}`;

  if (selectedComponent) {
    answer = `**${selectedComponent.name}** is a vital functional component of **${effectiveTitle}**.\n\n• **What it is**: ${selectedComponent.whatIsIt || selectedComponent.name}\n• **Role in operation**: ${selectedComponent.whatDoesItDo || selectedComponent.description || 'Drives core system behavior.'}${selectedComponent.realLifeExample ? `\n• **Real-world application**: ${selectedComponent.realLifeExample}` : ''}`;
  } else if (paramSummary || resultSummary) {
    answer += `\n\n${paramSummary ? `• **Active Parameters**: ${paramSummary}` : ''}${resultSummary ? `\n• **Live Telemetry Outputs**: ${resultSummary}` : ''}`;
  } else if (q.includes('how') && q.includes('work')) {
    answer = `**${effectiveTitle}** functions by converting energy or driving processes based on fundamental scientific laws. Adjusting the interactive parameters immediately updates the live 3D simulation state.`;
  }

  const cleanedFallback = cleanAndFormatScientificText(answer);
  return {
    answer: cleanedFallback,
    reply: cleanedFallback,
    text: cleanedFallback,
    activeModel: 'deterministic-offline',
  };
}

// 2B. Extract Concise Key Takeaways / Important Points from an AI Response
export async function generateKeyTakeaways(
  question: string,
  answer: string,
  modelTitle?: string,
  subject?: string,
  context: any = {}
) {
  const aiClient = getAiClient();
  const effectiveTitle =
    modelTitle && modelTitle !== 'Scientific Simulation'
      ? modelTitle
      : context?.title || modelTitle || 'Scientific Simulation';
  const effectiveSubject =
    subject && subject !== 'Science'
      ? subject
      : context?.subject || subject || 'Science';

  if (aiClient && answer && answer.trim().length > 20) {
    const prompt = `STUDENT QUESTION: "${question || 'Explain this scientific concept'}"

FULL AI EXPLANATION TO SUMMARIZE:
"""
${answer}
"""

ACTIVE 3D MODEL CONTEXT:
- Model: ${effectiveTitle} (${effectiveSubject})
${context?.selectedComponent?.name ? `- Selected Component: ${context.selectedComponent.name}` : ''}

TASK FOR VIZLAB AI:
Extract the most important, high-yield educational takeaways from the AI explanation above so a student can revise and remember the essential concepts in seconds.

STRICT OUTPUT RULES:
1. Output 3 to 4 concise bullet points (using "• ") summarizing the core scientific mechanism, structure-function role, or parameter relationship from the answer.
2. Start each bullet point with a **Bold Key Concept** followed by a colon (e.g., "• **Core Mechanism**: ...").
3. If the explanation involves a formula, equation, or quantitative law, include one bullet "• **Key Formula / Law**: \`...\`" using clean readable Unicode symbols (m/s², °, ×, ÷, →, ⇌, Δ, π, √, H₂O, CO₂). NEVER output raw LaTeX dollar-sign syntax like $...$ or \\frac.
4. End with one final bullet "• **Exam Takeaway**: ..." giving a 1-sentence high-yield point to remember for tests.
5. Keep every bullet to 1–2 crisp sentences. Stay 100% faithful to the provided explanation and scientific model.`;

    const execution = await modelRouter.executeWithModelFallback(
      'chat_assistant',
      async (modelId) => {
        const response = await aiClient.models.generateContent({
          model: modelId,
          contents: prompt,
          config: {
            systemInstruction:
              'You are VIZLAB Revision Synthesizer. Distill scientific explanations into crisp, accurate, student-friendly Key Takeaways using bullet points, bold lead-in terms, and clean Unicode notation (never raw LaTeX).',
            temperature: 0.2,
          },
        });

        if (response.text && response.text.trim()) {
          return cleanAndFormatScientificText(response.text.trim());
        }
        throw new Error('Empty takeaways response from model');
      },
      9000
    );

    if (execution && execution.result) {
      return {
        takeaways: execution.result,
        answer: execution.result,
        reply: execution.result,
        text: execution.result,
        activeModel: execution.modelId,
      };
    }
  }

  // Deterministic scientific key takeaways fallback
  const fallbackTakeaways = extractLocalScientificTakeaways(answer, question, {
    ...context,
    title: effectiveTitle,
    subject: effectiveSubject,
  });

  return {
    takeaways: fallbackTakeaways,
    answer: fallbackTakeaways,
    reply: fallbackTakeaways,
    text: fallbackTakeaways,
    activeModel: 'deterministic-offline',
  };
}


// 3. Explain Simulation Change (Automatic & Cause-and-Effect)
export async function explainSimulationChange(payload: any) {
  const {
    simulationId = 'physics',
    simulationTitle,
    modelId,
    parameter,
    oldValue,
    newValue,
    unit = '',
    metricChanges = {},
    oldResults = {},
    newResults = {},
    context = {},
  } = payload;

  const simName = simulationTitle || modelId || simulationId || 'physics';
  const aiClient = getAiClient();
  if (aiClient && parameter) {
    const prompt = `STUDENT ACTION IN SIMULATION:
- Simulation: ${simName}
- Parameter Modified: "${parameter}" changed from ${oldValue} ${unit} to ${newValue} ${unit}
- Resulting Physical Metric Changes: ${JSON.stringify(Object.keys(metricChanges).length ? metricChanges : { before: oldResults, after: newResults })}
- Simulation State Context: ${JSON.stringify(context)}

Explain what happened scientifically in 2 concise sentences using clean Unicode units (e.g., m/s², °, ×, Δ, π; NEVER use raw LaTeX like $25\\text{ m/s}$ or \\frac):
1. "observation": What changed physically in the simulation?
2. "why": Why did this happen based on scientific laws/formulas?
3. "formula": Clean readable Unicode equation representing this relationship (e.g., "F = m × a" or "R = (v² sin(2θ)) / g").

Return JSON format: { "observation": string, "why": string, "formula": string }`;

    const execution = await modelRouter.executeWithModelFallback(
      'educational_explanation',
      async (modelId) => {
        const response = await aiClient.models.generateContent({
          model: modelId,
          contents: prompt,
          config: {
            systemInstruction:
              'You are VIZLAB Science Tutor. Provide concise, accurate 2-sentence causal explanations of physical parameter adjustments using clean Unicode scientific symbols (never raw LaTeX).',
            responseMimeType: 'application/json',
            temperature: 0.15,
          },
        });

        const parsed = JSON.parse(cleanJsonText(response.text || '{}'));
        if (parsed && parsed.observation && parsed.why) {
          return parsed;
        }
        throw new Error('Invalid explanation JSON structure');
      },
      8000
    );

    if (execution && execution.result) {
      return {
        success: true,
        observation: cleanAndFormatScientificText(execution.result.observation),
        why: cleanAndFormatScientificText(execution.result.why),
        formula: execution.result.formula ? convertLatexFragmentToUnicode(String(execution.result.formula).replace(/^\$+|\$+$/g, '')) : null,
        activeModel: execution.modelId,
      };
    }
  }

  // Deterministic scientific explanation fallback
  return {
    success: true,
    observation: `Updated ${parameter} to ${newValue} ${unit}.`,
    why: `Directly altered the physical parameter governing the ${simName} simulation state.`,
    formula: null,
    activeModel: 'deterministic-offline',
  };
}

// 4. Scan Diagram (Vision Multimodal)
export async function scanDiagram(imageBase64: string, mimeType = 'image/jpeg', fileName = 'diagram.png') {
  const aiClient = getAiClient();
  if (!aiClient) {
    return {
      success: false,
      error: 'GEMINI_API_KEY is not configured in server environment variables.',
      code: 'AUTH_MISSING',
    };
  }

  let base64Data = imageBase64;
  let detectedMime = mimeType;

  if (imageBase64.includes(';base64,')) {
    const parts = imageBase64.split(';base64,');
    base64Data = parts[1];
    const mimeMatch = parts[0].match(/data:(.*?)$/);
    if (mimeMatch && mimeMatch[1]) {
      detectedMime = mimeMatch[1];
    }
  }

  const systemInstruction = `You are VIZLAB Vision AI, an elite multimodal STEM diagram analysis engine.
Analyze the scientific diagram image uploaded by a school student.
Detect the real visual objects, text labels, anatomy, components, or machine parts in the diagram.
Identify the overarching scientific concept and return clean JSON mapping components to 3D geometry.`;

  const execution = await modelRouter.executeWithModelFallback(
    'multimodal_diagram',
    async (modelId) => {
      const response = await aiClient.models.generateContent({
        model: modelId,
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: detectedMime,
            },
          },
          {
            text: `Analyze this science diagram. Identify its components, text labels, and generate or map its 3D components. Filename: ${fileName || 'diagram'}`,
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const parsed = JSON.parse(cleanJsonText(response.text || '{}'));
      if (parsed && parsed.concept) {
        return parsed;
      }
      throw new Error('Diagram analysis response did not contain a valid concept');
    },
    15000
  );

  if (execution && execution.result) {
    return {
      success: true,
      result: execution.result,
      activeModel: execution.modelId,
    };
  }

  return {
    success: false,
    error: 'Could not analyze diagram with current vision models. Please try another image.',
  };
}

// 5. Interpret Natural Language Prompt for Parameter Adjustment
export async function interpretPromptChange(userPrompt: string, currentParams: any, allowedParameters: any) {
  const aiClient = getAiClient();
  if (aiClient) {
    const systemInstruction = `You are VIZLAB Natural Language Parameter Controller.
Given a student prompt, find which parameter they want to adjust and what new value to set.
Return JSON: { "recognized": boolean, "parameter": string, "newValue": number, "explanation": string }`;

    const execution = await modelRouter.executeWithModelFallback(
      'parameter_interpretation',
      async (modelId) => {
        const response = await aiClient.models.generateContent({
          model: modelId,
          contents: `PROMPT: "${userPrompt}"\nALLOWED: ${JSON.stringify(allowedParameters)}`,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const parsed = JSON.parse(cleanJsonText(response.text || '{}'));
        if (parsed && parsed.recognized && parsed.parameter) {
          return parsed;
        }
        throw new Error('Interpretation result not mapped to allowed parameters');
      },
      8000
    );

    if (execution && execution.result) {
      return {
        success: true,
        action: 'change_parameter',
        parameter: execution.result.parameter,
        newValue: execution.result.newValue,
        explanation: execution.result.explanation,
        activeModel: execution.modelId,
      };
    }
  }

  return {
    success: false,
    message: 'Could not map prompt to an active parameter.',
  };
}

// 6. Safe Server Diagnostics (Zero secret exposure) - Matches Step 8 contract
export async function getSafeDiagnostics() {
  const client = getAiClient();
  const status = modelRouter.getStatus();

  // Missing key: { status: 'error', hasApiKey: false, errorCode: 'MISSING_API_KEY', error: 'GEMINI_API_KEY is not configured.' }
  if (!client) {
    return {
      status: 'error',
      hasApiKey: false,
      errorCode: 'MISSING_API_KEY',
      error: 'GEMINI_API_KEY is not configured.',
    };
  }

  let canCommunicateWithGemini = false;
  let testLatencyMs: number | null = null;
  let testError: string | null = null;

  const startTime = Date.now();
  try {
    const res = await client.models.generateContent({
      model: status.primaryModel || 'gemini-3.1-flash-lite',
      contents: 'PING',
    });
    testLatencyMs = Date.now() - startTime;
    canCommunicateWithGemini = Boolean(res.text);
  } catch (e: any) {
    canCommunicateWithGemini = false;
    testError = e.message || 'Gemini ping failed';
  }

  // Authentication failure: { status: 'error', hasApiKey: true, canCommunicateWithGemini: false, errorCode: 'AUTH_ERROR', error: 'Gemini authentication failed.' }
  if (!canCommunicateWithGemini) {
    const isAuth =
      testError?.toLowerCase().includes('api key not valid') ||
      testError?.toLowerCase().includes('unauthenticated') ||
      testError?.toLowerCase().includes('permission denied') ||
      testError?.includes('401') ||
      testError?.includes('403');

    return {
      status: 'error',
      hasApiKey: true,
      canCommunicateWithGemini: false,
      errorCode: isAuth ? 'AUTH_ERROR' : 'UNAVAILABLE',
      error: isAuth ? 'Gemini authentication failed.' : (testError || 'Gemini service temporarily unavailable.'),
      activeModel: status.primaryModel,
    };
  }

  // Success: { status: 'ready', hasApiKey: true, canCommunicateWithGemini: true, activeModel: '...' }
  return {
    status: 'ready',
    hasApiKey: true,
    canCommunicateWithGemini: true,
    activeModel: status.primaryModel,
    testLatencyMs,
    candidates: status.candidates,
  };
}
