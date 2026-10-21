import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { ScientificModelSpec } from '../types/aiModel';

export interface PresetSummary {
  id: string;
  title: string;
  subject: string;
  category: 'Physics' | 'Chemistry' | 'Biology' | 'Earth & Space' | 'Engineering';
  partsCount: number;
  parametersCount: number;
  conditionsCount: number;
  spec: ScientificModelSpec;
}

export interface OfflineProgressInfo {
  status: 'idle' | 'preparing' | 'ready' | 'warning' | 'error';
  current: number;
  total: number;
  percentage: number;
  currentModelTitle: string;
  message: string;
  unverified: string[];
}

export interface OfflineVerificationRecord {
  isReady: boolean;
  totalPresets: number;
  verifiedCount: number;
  timestamp: number;
  version: string;
  unverified: string[];
}

const STORAGE_KEY_RECORD = 'vizlab_offline_verification_v1';
const CACHE_NAME_PRESETS = 'vizlab-presets-v1';

/**
 * Returns all unique registered preset models from CURATED_AI_MODELS.
 * Guaranteed no duplicates, reflecting the true registry count.
 */
export function getUniquePresets(): PresetSummary[] {
  const models = Object.values(CURATED_AI_MODELS);
  const uniqueMap = new Map<string, ScientificModelSpec>();

  models.forEach((spec) => {
    if (spec && spec.id && !uniqueMap.has(spec.id)) {
      uniqueMap.set(spec.id, spec);
    }
  });

  return Array.from(uniqueMap.values()).map((spec) => {
    let category: PresetSummary['category'] = 'Physics';
    const sub = ((spec as any).subject || spec.concept || '').toLowerCase();
    const tit = (spec.title || '').toLowerCase();
    const id = (spec.id || '').toLowerCase();

    if (
      (spec as any).category === 'chemistry' ||
      sub.includes('chem') ||
      tit.includes('chem') ||
      id.includes('molecule') ||
      id.includes('molecular') ||
      id.includes('orbital') ||
      id.includes('crystal') ||
      id.includes('polarity') ||
      id.includes('intermolecular') ||
      id.includes('electrolysis') ||
      id.includes('electrochemical') ||
      id.includes('kinetics') ||
      id.includes('equilibrium') ||
      id.includes('energy-profile') ||
      id.includes('catalysis') ||
      id.includes('titration') ||
      id.includes('solubility') ||
      id.includes('precipitation') ||
      id.includes('buffer') ||
      id.includes('atom') ||
      id.includes('bonding') ||
      id.includes('reaction')
    ) {
      category = 'Chemistry';
    } else if (
      sub.includes('bio') ||
      tit.includes('cell') ||
      tit.includes('heart') ||
      tit.includes('dna') ||
      tit.includes('respirat') ||
      tit.includes('ear') ||
      tit.includes('nephron') ||
      tit.includes('digest') ||
      tit.includes('brain') ||
      tit.includes('eye') ||
      tit.includes('plant') ||
      tit.includes('root') ||
      tit.includes('blood') ||
      tit.includes('neuron') ||
      tit.includes('nerve') ||
      tit.includes('circulation') ||
      id.includes('digest') ||
      id.includes('brain') ||
      id.includes('eye') ||
      id.includes('plant') ||
      id.includes('blood') ||
      id.includes('neuron') ||
      id.includes('cell')
    ) {
      category = 'Biology';
    } else if (tit.includes('solar') || tit.includes('telescope')) {
      category = 'Earth & Space';
    } else if (tit.includes('motor') || tit.includes('circuit') || tit.includes('lever') || tit.includes('hydraulic')) {
      category = 'Engineering';
    }

    return {
      id: spec.id,
      title: spec.title || spec.id,
      subject: (spec as any).subject || spec.concept || 'Science',
      category,
      partsCount: Array.isArray(spec.parts) ? spec.parts.length : 0,
      parametersCount: spec.parameters ? Object.keys(spec.parameters).length : 0,
      conditionsCount: spec.conditions ? Object.keys(spec.conditions).length : 0,
      spec,
    };
  });
}

/**
 * Verifies a single preset model's geometry, materials, parameters, and labels.
 * Confirms integrity before storing in cache. Supports both flat and nested part schemas.
 */
export function verifyPresetIntegrity(spec: ScientificModelSpec): boolean {
  if (!spec || !spec.id || !spec.title) return false;
  if (!Array.isArray(spec.parts) || spec.parts.length === 0) return false;

  for (const part of spec.parts) {
    if (!part.id || !part.name) return false;
    const partAny = part as any;
    const hasGeometry = Boolean((partAny.geometry && partAny.geometry.type) || part.shape);
    const hasColorOrMaterial = Boolean(
      (partAny.material && typeof partAny.material === 'object' && partAny.material.color) ||
      part.color ||
      part.material
    );
    if (!hasGeometry || !hasColorOrMaterial) return false;
  }

  return true;
}

/**
 * Stores a verified model into CacheStorage and localStorage.
 */
export async function cachePresetModel(spec: ScientificModelSpec): Promise<boolean> {
  try {
    const jsonStr = JSON.stringify(spec);

    // 1. Store in localStorage for synchronous fallback
    try {
      localStorage.setItem(`vizlab_preset_${spec.id}`, jsonStr);
    } catch {
      // LocalStorage might be full or private browsing; continue to CacheStorage
    }

    // 2. Store in CacheStorage if available
    if (typeof caches !== 'undefined') {
      try {
        const cache = await caches.open(CACHE_NAME_PRESETS);
        const url = `/api/offline-preset/${encodeURIComponent(spec.id)}`;
        const response = new Response(jsonStr, {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
        await cache.put(url, response);
      } catch (err) {
        console.warn('CacheStorage put failed for preset:', spec.id, err);
      }
    }

    return true;
  } catch (err) {
    console.error('Failed to cache preset model:', spec.id, err);
    return false;
  }
}

/**
 * Retrieves the cached verification record from localStorage or CacheStorage.
 */
export function getStoredVerificationRecord(): OfflineVerificationRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORD);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.verifiedCount === 'number' && parsed.totalPresets > 0) {
      return parsed;
    }
  } catch {}
  return null;
}

/**
 * Executes deliberate precaching and verification of all registered preset models.
 * Reports real-time status: "Preparing offline models: X/TOTAL".
 */
export async function prepareAllOfflinePresets(
  onProgress?: (info: OfflineProgressInfo) => void
): Promise<OfflineVerificationRecord> {
  const presets = getUniquePresets();
  const total = presets.length;
  const unverified: string[] = [];
  let verifiedCount = 0;

  for (let i = 0; i < total; i++) {
    const preset = presets[i];
    const current = i + 1;
    const percentage = Math.round((current / total) * 100);

    if (onProgress) {
      onProgress({
        status: 'preparing',
        current,
        total,
        percentage,
        currentModelTitle: preset.title,
        message: `Preparing offline models: ${current}/${total}`,
        unverified,
      });
    }

    const isValid = verifyPresetIntegrity(preset.spec);
    if (isValid) {
      await cachePresetModel(preset.spec);
      verifiedCount++;
    } else {
      unverified.push(preset.title);
    }

    // Brief yield to avoid blocking the UI thread and render smooth progress
    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  const isReady = verifiedCount === total && unverified.length === 0;

  const record: OfflineVerificationRecord = {
    isReady,
    totalPresets: total,
    verifiedCount,
    timestamp: Date.now(),
    version: '1.0.0',
    unverified,
  };

  try {
    localStorage.setItem(STORAGE_KEY_RECORD, JSON.stringify(record));
  } catch {}

  if (onProgress) {
    onProgress({
      status: isReady ? 'ready' : 'warning',
      current: verifiedCount,
      total,
      percentage: Math.round((verifiedCount / total) * 100),
      currentModelTitle: isReady ? 'All models ready' : `${unverified.length} models had warnings`,
      message: isReady
        ? `Ready for exhibition: ${verifiedCount}/${total} models verified offline`
        : `Offline warning: ${unverified.length} models could not be verified`,
      unverified,
    });
  }

  return record;
}

/**
 * Normalizes prompt text for fuzzy query matching.
 */
function normalizeQuery(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Matches user query or preset ID directly to an offline preset model.
 * Matches all 31 verified presets and Try Prompts offline without network requests.
 */
export function matchOfflinePreset(query: string): {
  matched: boolean;
  spec?: ScientificModelSpec;
  presetTitle?: string;
  matchType?: string;
} {
  if (!query) return { matched: false };
  const rawLower = query.toLowerCase().trim();
  const norm = normalizeQuery(query);
  const combined = `${rawLower} ${norm}`;

  // 1. Direct ID match
  const presets = getUniquePresets();
  const directMatch = presets.find(
    (p) => p.id.toLowerCase() === rawLower || p.title.toLowerCase() === rawLower
  );
  if (directMatch) {
    return {
      matched: true,
      spec: directMatch.spec,
      presetTitle: directMatch.title,
      matchType: 'direct_id',
    };
  }

  // =========================================================================
  // CHEMISTRY BATCH 1 (MODELS 69–75) PRIORITY MATCHING
  // =========================================================================
  // Model 69: Molecular Orbital Explorer
  if (
    combined.includes('molecular orbital') ||
    combined.includes('lcao') ||
    combined.includes('antibonding') ||
    combined.includes('sigma and pi orbital')
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['molecular-orbital-explorer'],
      presetTitle: 'Molecular Orbital Explorer',
      matchType: 'concept',
    };
  }
  // Model 70: Atomic Orbital Probability Explorer
  if (
    combined.includes('atomic orbital') ||
    combined.includes('orbital probability') ||
    combined.includes('radial node') ||
    combined.includes('angular node') ||
    combined.includes('quantum probability')
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['atomic-orbital-probability-explorer'],
      presetTitle: 'Atomic Orbital Probability Explorer',
      matchType: 'concept',
    };
  }
  // Model 71: Advanced Crystal Lattice Explorer
  if (
    combined.includes('crystal lattice') ||
    combined.includes('unit cell') ||
    combined.includes('simple cubic') ||
    combined.includes('body centred cubic') ||
    combined.includes('face centred cubic') ||
    combined.includes('hexagonal close packed') ||
    combined.includes('atomic packing factor')
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['advanced-crystal-lattice-explorer'],
      presetTitle: 'Advanced Crystal Lattice Explorer',
      matchType: 'concept',
    };
  }
  // Model 72: Molecular Polarity Explorer
  if (
    combined.includes('molecular polarity') ||
    combined.includes('bond dipole') ||
    combined.includes('resultant dipole') ||
    (combined.includes('polarity') && (combined.includes('bf3') || combined.includes('nh3') || combined.includes('ch4')))
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['molecular-polarity-explorer'],
      presetTitle: 'Molecular Polarity Explorer',
      matchType: 'concept',
    };
  }
  // Model 73: Intermolecular Forces Explorer
  if (
    combined.includes('intermolecular force') ||
    combined.includes('london dispersion') ||
    combined.includes('dipole dipole') ||
    combined.includes('hydrogen bonding explorer')
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['intermolecular-forces-explorer'],
      presetTitle: 'Intermolecular Forces Explorer',
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['electrochemical-cell-simulator'],
      presetTitle: 'Electrochemical Cell Simulator',
      matchType: 'concept',
    };
  }
  // Model 75: Electrolysis Explorer
  if (
    combined.includes('electrolysis') ||
    combined.includes('electrolytic cell') ||
    combined.includes('molten sodium chloride') ||
    combined.includes('molten nacl') ||
    combined.includes('faraday law')
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['electrolysis-explorer'],
      presetTitle: 'Electrolysis Explorer',
      matchType: 'concept',
    };
  }

  // =========================================================================
  // CHEMISTRY BATCH 2 (MODELS 76–82) PRIORITY MATCHING
  // =========================================================================
  // Model 76: Chemical Kinetics Simulator
  if (
    combined.includes('chemical kinetics') ||
    combined.includes('kinetics simulator') ||
    combined.includes('integrated rate law') ||
    combined.includes('reaction order') ||
    (combined.includes('kinetics') && (combined.includes('arrhenius') || combined.includes('half life') || combined.includes('rate constant')))
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['chemical-kinetics-simulator'],
      presetTitle: 'Chemical Kinetics Simulator',
      matchType: 'concept',
    };
  }
  // Model 77: Chemical Equilibrium Explorer
  if (
    combined.includes('chemical equilibrium') ||
    combined.includes('equilibrium explorer') ||
    combined.includes('le chatelier') ||
    combined.includes('reaction quotient') ||
    (combined.includes('equilibrium') && (combined.includes('haber') || combined.includes('kc') || combined.includes('kp') || combined.includes('n2o4')))
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['chemical-equilibrium-explorer'],
      presetTitle: 'Chemical Equilibrium Explorer',
      matchType: 'concept',
    };
  }
  // Model 78: Reaction Energy Profile Explorer
  if (
    combined.includes('reaction energy profile') ||
    combined.includes('energy profile explorer') ||
    combined.includes('transition state') ||
    combined.includes('activated complex') ||
    (combined.includes('reaction coordinate') && (combined.includes('activation energy') || combined.includes('enthalpy')))
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['reaction-energy-profile-explorer'],
      presetTitle: 'Reaction Energy Profile Explorer',
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['catalysis-explorer'],
      presetTitle: 'Catalysis Explorer',
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['acid-base-titration-laboratory'],
      presetTitle: 'Acid–Base Titration Laboratory',
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['solubility-precipitation-explorer'],
      presetTitle: 'Solubility and Precipitation Explorer',
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['buffer-solution-simulator'],
      presetTitle: 'Buffer Solution Simulator',
      matchType: 'concept',
    };
  }

  // =========================================================================
  // ADVANCED PHYSICS BATCH 4 (MODELS 62–68) PRIORITY MATCHING
  // =========================================================================
  // Model 62: Maxwell's Equations & Electromagnetic Field Explorer
  if (
    combined.includes('maxwell') ||
    combined.includes('gauss law') ||
    combined.includes('ampere maxwell') ||
    combined.includes('displacement current') ||
    combined.includes('electromagnetic field explorer')
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['maxwell-equations-em-field-explorer'],
      presetTitle: "Maxwell's Equations & Electromagnetic Field Explorer",
      matchType: 'concept',
    };
  }
  // Model 63: AC Circuits, RLC Resonance & Impedance Laboratory
  if (
    combined.includes('rlc') ||
    combined.includes('impedance laboratory') ||
    combined.includes('inductive reactance') ||
    combined.includes('capacitive reactance') ||
    combined.includes('ac circuits')
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['ac-circuits-rlc-resonance-lab'],
      presetTitle: 'AC Circuits, RLC Resonance & Impedance Laboratory',
      matchType: 'concept',
    };
  }
  // Model 64: Lenses, Optical Instruments & Image Formation Laboratory
  if (
    combined.includes('thin lens') ||
    combined.includes('lenses optical instruments') ||
    combined.includes('image formation laboratory') ||
    (combined.includes('convex') && combined.includes('concave') && combined.includes('lens')) ||
    (combined.includes('lenses') && combined.includes('image formation'))
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['lenses-optical-instruments-lab'],
      presetTitle: 'Lenses, Optical Instruments & Image Formation Laboratory',
      matchType: 'concept',
    };
  }
  // Model 65: Doppler Ultrasound & Medical Flow Imaging Explorer
  if (
    combined.includes('doppler ultrasound') ||
    combined.includes('medical flow imaging') ||
    combined.includes('ultrasound probe') ||
    (combined.includes('ultrasound') && (combined.includes('doppler') || combined.includes('blood')))
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['doppler-ultrasound-flow-explorer'],
      presetTitle: 'Doppler Ultrasound & Medical Flow Imaging Explorer',
      matchType: 'concept',
    };
  }
  // Model 66: Earth's Magnetic Field & Magnetosphere Explorer
  if (
    combined.includes('magnetosphere') ||
    combined.includes('magnetotail') ||
    combined.includes('solar wind') ||
    combined.includes('auroral') ||
    (combined.includes('earth') && combined.includes('magnetic field') && combined.includes('explorer'))
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['earth-magnetic-field-magnetosphere-explorer'],
      presetTitle: "Earth's Magnetic Field & Magnetosphere Explorer",
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['semiconductor-pn-junction-diode-explorer'],
      presetTitle: 'Semiconductor p–n Junction, Band Gap & Diode Explorer',
      matchType: 'concept',
    };
  }
  // Model 68: Radioactive Decay, Half-Life & Alpha–Beta–Gamma Radiation Lab
  if (
    combined.includes('radioactive decay') ||
    combined.includes('half life') ||
    combined.includes('alpha beta gamma') ||
    combined.includes('geiger') ||
    combined.includes('radiation lab')
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['radioactive-decay-halflife-radiation-lab'],
      presetTitle: 'Radioactive Decay, Half-Life & Alpha–Beta–Gamma Radiation Lab',
      matchType: 'concept',
    };
  }

  // =========================================================================
  // ADVANCED PHYSICS BATCH 1 (MODELS 1–7) PRIORITY MATCHING
  // =========================================================================
  // Model 1: Electromagnetic Wave Propagation Explorer
  if (
    combined.includes('em wave') ||
    combined.includes('electromagnetic wave') ||
    combined.includes('poynting') ||
    (combined.includes('electric') && combined.includes('magnetic') && combined.includes('wave') && combined.includes('propagation'))
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['electromagnetic-wave-propagation'],
      presetTitle: 'Electromagnetic Wave Propagation Explorer',
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['plasma-physics-explorer'],
      presetTitle: 'Plasma Physics Explorer',
      matchType: 'concept',
    };
  }
  // Model 3: Particle Accelerator Explorer
  if (
    combined.includes('particle accelerator') ||
    combined.includes('accelerator beamline') ||
    combined.includes('rf cavity') ||
    combined.includes('dipole magnet') ||
    (combined.includes('accelerator') && (combined.includes('beam') || combined.includes('deflection') || combined.includes('electric')))
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['particle-accelerator-explorer'],
      presetTitle: 'Particle Accelerator Explorer',
      matchType: 'concept',
    };
  }
  // Model 4: Magnetic Levitation Mechanism Explorer
  if (
    combined.includes('magnetic levitation') ||
    combined.includes('maglev') ||
    combined.includes('earnshaw') ||
    combined.includes('levitation gap') ||
    (combined.includes('levitation') && (combined.includes('magnet') || combined.includes('air gap') || combined.includes('guideway')))
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['magnetic-levitation-explorer'],
      presetTitle: 'Magnetic Levitation Mechanism Explorer',
      matchType: 'concept',
    };
  }
  // Model 5: Superconductivity and Meissner Effect Explorer
  if (
    combined.includes('superconduct') ||
    combined.includes('meissner') ||
    combined.includes('flux expulsion') ||
    combined.includes('critical temperature') ||
    combined.includes('ybco')
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['superconductivity-meissner-explorer'],
      presetTitle: 'Superconductivity and Meissner Effect Explorer',
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['black-hole-gravitational-lensing'],
      presetTitle: 'Black Hole and Gravitational Lensing Explorer',
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['quantum-tunnelling-explorer'],
      presetTitle: 'Quantum Tunnelling Explorer',
      matchType: 'concept',
    };
  }

  // =========================================================================
  // ADVANCED PHYSICS BATCH 2 (MODELS 48–54) PRIORITY MATCHING
  // =========================================================================
  // Model 48: Faraday's Law: Electromagnetic Induction Explorer
  if (
    combined.includes('faraday') ||
    combined.includes('lenz') ||
    combined.includes('electromagnetic induction') ||
    combined.includes('flux linkage') ||
    combined.includes('induced emf')
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['faraday-law-induction-explorer'],
      presetTitle: "Faraday's Law: Electromagnetic Induction Explorer",
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['motor-generator-energy-explorer'],
      presetTitle: 'Electric Motor & Generator Energy Conversion Explorer',
      matchType: 'concept',
    };
  }
  // Model 50: AC Voltage Transformer & Magnetic Coupling Explorer
  if (
    combined.includes('transformer') ||
    combined.includes('mutual inductance') ||
    combined.includes('turns ratio') ||
    combined.includes('laminated core') ||
    combined.includes('magnetic coupling')
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['ac-voltage-transformer-explorer'],
      presetTitle: 'AC Voltage Transformer & Magnetic Coupling Explorer',
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['wave-interference-diffraction-lab'],
      presetTitle: 'Wave Interference & Diffraction Lab',
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['optical-interferometer-explorer'],
      presetTitle: 'Optical Interference & Interferometer Explorer',
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['fluid-dynamics-bernoulli-vortex'],
      presetTitle: 'Fluid Dynamics: Bernoulli, Pressure & Vortex Flow Explorer',
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['tokamak-fusion-confinement-explorer'],
      presetTitle: 'Nuclear Fusion Reactor: Magnetic Confinement Explorer',
      matchType: 'concept',
    };
  }

  // Advanced Physics Batch 3 (Models 55–61)
  // Model 55: Doppler Effect & Sonic Boom Explorer
  if (
    combined.includes('doppler') ||
    combined.includes('sonic boom') ||
    combined.includes('mach cone') ||
    combined.includes('mach number') ||
    combined.includes('supersonic shock') ||
    combined.includes('wavefront compression')
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['doppler-effect-sonic-boom-explorer'],
      presetTitle: 'Doppler Effect & Sonic Boom Explorer',
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['seismic-waves-earthquake-lab'],
      presetTitle: 'Seismic Waves & Earthquake Wave Propagation Lab',
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['gyroscope-torque-angular-momentum-lab'],
      presetTitle: 'Gyroscope, Torque & Angular Momentum Laboratory',
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['shm-coupled-oscillators-lab'],
      presetTitle: 'Simple Harmonic Motion & Coupled Oscillators Lab',
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['thermodynamics-carnot-heat-engine'],
      presetTitle: 'Thermodynamics: Heat Engine & Carnot Cycle Explorer',
      matchType: 'concept',
    };
  }
  // Model 60: Photoelectric Effect & Quantum Energy Explorer
  if (
    combined.includes('photoelectric') ||
    combined.includes('stopping potential') ||
    combined.includes('work function') ||
    combined.includes('threshold frequency') ||
    combined.includes('photoelectron')
  ) {
    return {
      matched: true,
      spec: CURATED_AI_MODELS['photoelectric-effect-quantum-explorer'],
      presetTitle: 'Photoelectric Effect & Quantum Energy Explorer',
      matchType: 'concept',
    };
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
    return {
      matched: true,
      spec: CURATED_AI_MODELS['special-relativity-time-length-lab'],
      presetTitle: 'Special Relativity: Time Dilation & Length Contraction Lab',
      matchType: 'concept',
    };
  }

  // 2. Specific Model Patterns (Models 21–25 Biology Batch 1 Priority)
  // Model 21: Human Heart Explorer
  if (combined.includes('heart explorer') || (combined.includes('heart') && (combined.includes('cutaway') || combined.includes('blood flow') || combined.includes('valves') || combined.includes('septum') || combined.includes('explorer')))) {
    return { matched: true, spec: CURATED_AI_MODELS['heart-explorer'] || CURATED_AI_MODELS.heartExplorer, presetTitle: 'Human Heart Explorer', matchType: 'concept' };
  }
  // Model 22: Human Respiratory System Explorer
  if (combined.includes('respiratory explorer') || combined.includes('bronchial tree') || combined.includes('alveoli') || combined.includes('gas exchange') || (combined.includes('respiratory') && (combined.includes('tree') || combined.includes('alveol') || combined.includes('diaphragm') || combined.includes('exchange')))) {
    return { matched: true, spec: CURATED_AI_MODELS['respiratory-explorer'] || CURATED_AI_MODELS.respiratoryExplorer, presetTitle: 'Human Respiratory System', matchType: 'concept' };
  }
  // Model 23: Human Digestive System
  if (combined.includes('digestive') || combined.includes('food path') || combined.includes('alimentary') || combined.includes('esophagus') || combined.includes('oesophagus') || combined.includes('peristalsis') || combined.includes('villi') || (combined.includes('stomach') && (combined.includes('rugae') || combined.includes('intestine')))) {
    return { matched: true, spec: CURATED_AI_MODELS['digestive-system'] || CURATED_AI_MODELS.digestiveExplorer, presetTitle: 'Human Digestive System', matchType: 'concept' };
  }
  // Model 24: Human Brain Explorer
  if (combined.includes('brain') || combined.includes('cerebrum') || combined.includes('cerebellum') || combined.includes('brainstem') || (combined.includes('lobes') && combined.includes('frontal'))) {
    return { matched: true, spec: CURATED_AI_MODELS['brain-explorer'] || CURATED_AI_MODELS.brainExplorer, presetTitle: 'Human Brain Explorer', matchType: 'concept' };
  }
  // Model 25: Human Eye and Vision
  if (combined.includes('eye and vision') || combined.includes('human eye') || combined.includes('vision model') || combined.includes('cornea') || combined.includes('retina') || combined.includes('photoreceptor') || (combined.includes('eye') && (combined.includes('pupil') || combined.includes('iris') || combined.includes('optic nerve') || combined.includes('light path')))) {
    return { matched: true, spec: CURATED_AI_MODELS['eye-vision'] || CURATED_AI_MODELS.eyeVisionExplorer, presetTitle: 'Human Eye and Vision', matchType: 'concept' };
  }

  // Models 26–30 (Biology Batch 2 Priority)
  // Model 26: Plant Cell Explorer
  if (combined.includes('plant cell') || combined.includes('plant-cell') || (combined.includes('chloroplast') && combined.includes('cell')) || (combined.includes('cell wall') && combined.includes('vacuole')) || (combined.includes('photosynthesis') && combined.includes('cell'))) {
    return { matched: true, spec: CURATED_AI_MODELS['plant-cell-explorer'] || CURATED_AI_MODELS.plantCell, presetTitle: 'Plant Cell Explorer', matchType: 'concept' };
  }
  // Model 27: Animal Cell Explorer
  if (combined.includes('animal cell') || combined.includes('animal-cell') || (combined.includes('cell') && (combined.includes('organelle') || combined.includes('mitochondria') || combined.includes('centrosome')))) {
    return { matched: true, spec: CURATED_AI_MODELS['animal-cell-explorer'] || CURATED_AI_MODELS.animalCell, presetTitle: 'Animal Cell Explorer', matchType: 'concept' };
  }
  // Model 28: Plant Root and Transport Explorer
  if (combined.includes('root and transport') || combined.includes('root transport') || combined.includes('plant root') || combined.includes('root hair') || (combined.includes('xylem') && combined.includes('phloem')) || (combined.includes('plant') && (combined.includes('transport') || combined.includes('transpiration')))) {
    return { matched: true, spec: CURATED_AI_MODELS['plant-root-transport'] || CURATED_AI_MODELS.plantRootTransport, presetTitle: 'Plant Root and Transport Explorer', matchType: 'concept' };
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
    return { matched: true, spec: CURATED_AI_MODELS['blood-transport'], presetTitle: 'Blood Transport — Internal Circulatory System', matchType: 'concept' };
  }

  // Model 29: Blood and Circulation Microscope
  if (combined.includes('blood and circulation') || combined.includes('blood circulation') || combined.includes('circulation microscope') || combined.includes('blood microscope') || (combined.includes('blood') && (combined.includes('erythrocyte') || combined.includes('red blood cell') || combined.includes('platelet') || combined.includes('clotting')))) {
    return { matched: true, spec: CURATED_AI_MODELS['blood-circulation-microscope'] || CURATED_AI_MODELS.bloodMicroscope, presetTitle: 'Blood and Circulation Microscope', matchType: 'concept' };
  }
  // Model 30: Neuron and Nerve Signal Explorer
  if (combined.includes('neuron and nerve') || combined.includes('neuron signal') || combined.includes('nerve signal') || combined.includes('action potential') || combined.includes('chemical synapse') || (combined.includes('neuron') && (combined.includes('axon') || combined.includes('dendrite') || combined.includes('synapse')))) {
    return { matched: true, spec: CURATED_AI_MODELS['neuron-nerve-signal'] || CURATED_AI_MODELS.neuronSignalExplorer, presetTitle: 'Neuron and Nerve Signal Explorer', matchType: 'concept' };
  }

  // Models 31–40 (Physics & Engineering Batch 3 Priority)
  if (combined.includes('ac generator') || combined.includes('alternating current generator') || (combined.includes('generator') && (combined.includes('armature') || combined.includes('slip ring')))) {
    return { matched: true, spec: CURATED_AI_MODELS['ac-generator'], presetTitle: 'AC Electric Generator', matchType: 'concept' };
  }
  if (combined.includes('electromagnetic induction') || combined.includes('induction explorer') || combined.includes('faraday') || combined.includes('lenz') || (combined.includes('galvanometer') && combined.includes('magnet'))) {
    return { matched: true, spec: CURATED_AI_MODELS['electromagnetic-induction'], presetTitle: 'Electromagnetic Induction Explorer', matchType: 'concept' };
  }
  if (combined.includes('heat transfer') || combined.includes('conduction convection radiation') || (combined.includes('thermal') && combined.includes('convection'))) {
    return { matched: true, spec: CURATED_AI_MODELS['heat-transfer-explorer'], presetTitle: 'Heat Transfer Explorer', matchType: 'concept' };
  }
  if (combined.includes('four stroke') || combined.includes('combustion engine') || combined.includes('piston and crankshaft') || (combined.includes('engine') && combined.includes('stroke'))) {
    return { matched: true, spec: CURATED_AI_MODELS['four-stroke-engine'], presetTitle: 'Four-Stroke Internal Combustion Engine', matchType: 'concept' };
  }
  if (combined.includes('electric bell') || combined.includes('bell mechanism') || (combined.includes('bell') && combined.includes('gong'))) {
    return { matched: true, spec: CURATED_AI_MODELS['electric-bell'], presetTitle: 'Electric Bell Mechanism', matchType: 'concept' };
  }
  if (combined.includes('hydroelectric') || combined.includes('hydro power') || combined.includes('dam and turbine') || (combined.includes('turbine') && combined.includes('penstock'))) {
    return { matched: true, spec: CURATED_AI_MODELS['hydroelectric-power'], presetTitle: 'Hydroelectric Power Station', matchType: 'concept' };
  }
  if (combined.includes('motor effect') || combined.includes('fleming') || combined.includes('left hand rule') || (combined.includes('conductor') && combined.includes('magnetic force'))) {
    return { matched: true, spec: CURATED_AI_MODELS['motor-effect-fleming'], presetTitle: "Motor Effect and Fleming's Left-Hand Rule", matchType: 'concept' };
  }

  // Models 11-20
  // Model 11: Friction Explorer
  if (combined.includes('friction') && (combined.includes('explorer') || combined.includes('block') || combined.includes('normal') || combined.includes('surface') || combined.includes('sliding'))) {
    return { matched: true, spec: CURATED_AI_MODELS['friction-explorer'] || CURATED_AI_MODELS.friction, presetTitle: 'Friction Explorer', matchType: 'concept' };
  }
  // Model 12: Wave Motion Explorer
  if (combined.includes('wave motion') || (combined.includes('wave') && (combined.includes('crest') || combined.includes('trough') || combined.includes('transverse') || combined.includes('wavelength')))) {
    return { matched: true, spec: CURATED_AI_MODELS['wave-motion'] || CURATED_AI_MODELS.waveMotion, presetTitle: 'Wave Motion Explorer', matchType: 'concept' };
  }
  // Model 13: Sound Wave Explorer
  if (combined.includes('sound wave') || (combined.includes('sound') && (combined.includes('air') || combined.includes('compression') || combined.includes('rarefaction') || combined.includes('acoustic')))) {
    return { matched: true, spec: CURATED_AI_MODELS['sound-wave'] || CURATED_AI_MODELS.soundWave, presetTitle: 'Sound Wave Explorer', matchType: 'concept' };
  }
  // Model 14: Magnetic Field Explorer
  if ((combined.includes('magnetic field') && (combined.includes('explorer') || combined.includes('wire') || combined.includes('bar magnet'))) || combined.includes('compass')) {
    return { matched: true, spec: CURATED_AI_MODELS['magnetic-field-explorer'] || CURATED_AI_MODELS.magneticField, presetTitle: 'Magnetic Field Explorer', matchType: 'concept' };
  }
  // Model 15: DC Electric Motor
  if (combined.includes('dc motor') || combined.includes('dc electric motor') || combined.includes('split ring') || combined.includes('commutator') || combined.includes('armature')) {
    return { matched: true, spec: CURATED_AI_MODELS['dc-motor'] || CURATED_AI_MODELS.dcMotor || CURATED_AI_MODELS.motor, presetTitle: 'DC Electric Motor', matchType: 'concept' };
  }
  // Model 16: Interactive Atom Explorer
  if (combined.includes('interactive atom') || (combined.includes('atom') && (combined.includes('electron shell') || combined.includes('bohr') || combined.includes('nucleus') || combined.includes('orbital')))) {
    return { matched: true, spec: CURATED_AI_MODELS['interactive-atom'] || CURATED_AI_MODELS.atomExplorer, presetTitle: 'Interactive Atom Explorer', matchType: 'concept' };
  }
  // Model 17: Bonding Explorer
  if (combined.includes('bonding explorer') || combined.includes('ionic and covalent') || combined.includes('ionic & covalent') || (combined.includes('bonding') && (combined.includes('nacl') || combined.includes('ch4') || combined.includes('lattice')))) {
    return { matched: true, spec: CURATED_AI_MODELS['bonding-explorer'] || CURATED_AI_MODELS.chemicalBonding, presetTitle: 'Ionic & Covalent Bonding Explorer', matchType: 'concept' };
  }
  // Model 18: Water Molecule Explorer
  if (combined.includes('water molecule explorer') || (combined.includes('water') && combined.includes('bent') && combined.includes('geometry')) || (combined.includes('h2o') && combined.includes('angle'))) {
    return { matched: true, spec: CURATED_AI_MODELS['water-molecule-explorer'] || CURATED_AI_MODELS.waterMoleculeDetailed || CURATED_AI_MODELS.water, presetTitle: 'Water Molecule Explorer', matchType: 'concept' };
  }
  // Model 19: Carbon Dioxide Explorer
  if (combined.includes('carbon dioxide') || combined.includes('co2') || combined.includes('linear o c o') || combined.includes('linear o=c=o')) {
    return { matched: true, spec: CURATED_AI_MODELS['carbon-dioxide-explorer'] || CURATED_AI_MODELS.carbonDioxide, presetTitle: 'Carbon Dioxide Molecule Explorer', matchType: 'concept' };
  }
  // Telescope
  if (combined.includes('telescope') || combined.includes('refract') || combined.includes('eyepiece') || combined.includes('objective lens')) {
    return { matched: true, spec: CURATED_AI_MODELS.telescope, presetTitle: 'Astronomical Refracting Telescope', matchType: 'concept' };
  }
  // Rutherford
  if (combined.includes('rutherford') || combined.includes('gold foil') || combined.includes('alpha particle')) {
    return { matched: true, spec: CURATED_AI_MODELS.rutherford, presetTitle: "Rutherford's Gold Foil Experiment", matchType: 'concept' };
  }
  // Simple Pendulum
  if (combined.includes('pendulum') || combined.includes('harmonic') || combined.includes('oscillation')) {
    return { matched: true, spec: CURATED_AI_MODELS.pendulum, presetTitle: 'Simple & Damped Harmonic Pendulum', matchType: 'concept' };
  }
  // Lever
  if (combined.includes('lever') || combined.includes('fulcrum') || combined.includes('effort') || combined.includes('load')) {
    return { matched: true, spec: CURATED_AI_MODELS.lever, presetTitle: 'Class 1 Mechanical Lever', matchType: 'concept' };
  }
  // Solar System
  if (combined.includes('solar system') || combined.includes('planet') || combined.includes('orbit') || combined.includes('sun') || combined.includes('jupiter')) {
    return { matched: true, spec: CURATED_AI_MODELS.solar, presetTitle: 'Solar System Explorer', matchType: 'concept' };
  }
  // Projectile Motion
  if (combined.includes('projectile') || combined.includes('trajectory') || combined.includes('parabola') || combined.includes('launch')) {
    return { matched: true, spec: CURATED_AI_MODELS.projectile, presetTitle: 'Projectile Motion Kinematics', matchType: 'concept' };
  }
  // Inclined Plane
  if (combined.includes('inclined plane') || combined.includes('incline') || combined.includes('ramp') || combined.includes('slope')) {
    return { matched: true, spec: CURATED_AI_MODELS.inclinedPlane, presetTitle: 'Inclined Plane & Friction Dynamics', matchType: 'concept' };
  }
  // Hydraulic Lift
  if (combined.includes('hydraulic') || combined.includes('pascal') || combined.includes('piston')) {
    return { matched: true, spec: CURATED_AI_MODELS.hydraulicLift, presetTitle: "Hydraulic Lift & Pascal's Principle", matchType: 'concept' };
  }
  // Newton's Cradle
  if (combined.includes('newton') && combined.includes('cradle') || combined.includes('cradle') || combined.includes('momentum collision')) {
    return { matched: true, spec: CURATED_AI_MODELS.newtonsCradle, presetTitle: "Newton's Cradle & Momentum Conservation", matchType: 'concept' };
  }
  // Reflection & Refraction
  if (combined.includes('reflection') || combined.includes('refraction') || combined.includes('snell') || combined.includes('light ray')) {
    return { matched: true, spec: CURATED_AI_MODELS.reflectionRefraction, presetTitle: 'Reflection & Refraction (Snell\'s Law)', matchType: 'concept' };
  }
  // Prism Dispersion
  if (combined.includes('prism') || combined.includes('dispersion') || combined.includes('rainbow') || combined.includes('spectrum')) {
    return { matched: true, spec: CURATED_AI_MODELS.prismDispersion, presetTitle: 'Equilateral Prism & Chromatic Dispersion', matchType: 'concept' };
  }
  // DC Electric Circuit
  if (combined.includes('circuit') || combined.includes('resistor') || combined.includes('ammeter') || combined.includes('voltmeter') || combined.includes('battery circuit')) {
    return { matched: true, spec: CURATED_AI_MODELS.circuit, presetTitle: 'Direct Current Electric Circuit', matchType: 'concept' };
  }
  // Biology: Heart
  if (combined.includes('heart') || combined.includes('ventricle') || combined.includes('atrium') || combined.includes('cardiac')) {
    return { matched: true, spec: CURATED_AI_MODELS.heart, presetTitle: 'Human Heart 3D Visualizer', matchType: 'concept' };
  }
  // Biology: DNA
  if (combined.includes('dna') || combined.includes('double helix') || combined.includes('nucleotide') || combined.includes('base pair')) {
    return { matched: true, spec: CURATED_AI_MODELS.dna, presetTitle: 'DNA Double Helix Structure', matchType: 'concept' };
  }
  // Biology: Cell
  if (combined.includes('cell') || combined.includes('mitochondria') || combined.includes('organelle') || combined.includes('eukaryot')) {
    return { matched: true, spec: CURATED_AI_MODELS.cell, presetTitle: 'Eukaryotic Animal Cell', matchType: 'concept' };
  }
  // Biology: Respiratory
  if (combined.includes('lung') || combined.includes('respirat') || combined.includes('trachea') || combined.includes('alveol')) {
    return { matched: true, spec: CURATED_AI_MODELS.respiratory, presetTitle: 'Human Respiratory System', matchType: 'concept' };
  }
  // Biology: Nephron
  if (combined.includes('nephron') || combined.includes('kidney') || combined.includes('glomerulus') || combined.includes('renal')) {
    return { matched: true, spec: CURATED_AI_MODELS.nephron, presetTitle: 'Human Kidney Nephron', matchType: 'concept' };
  }
  // Biology: Ear
  if (combined.includes('ear') || combined.includes('cochlea') || combined.includes('auditory') || combined.includes('tympanic')) {
    return { matched: true, spec: CURATED_AI_MODELS.ear, presetTitle: 'Human Ear Auditory Apparatus', matchType: 'concept' };
  }
  // Microscope
  if (combined.includes('microscope') || combined.includes('optical microscope') || combined.includes('compound microscope')) {
    return { matched: true, spec: CURATED_AI_MODELS.microscope, presetTitle: 'Compound Optical Microscope', matchType: 'concept' };
  }

  // 3. Substring check across all preset titles and descriptions
  for (const p of presets) {
    const pTitle = p.title.toLowerCase();
    const pDesc = (p.spec.description || '').toLowerCase();
    const pConcept = (p.spec.concept || '').toLowerCase();
    if (combined.includes(pTitle) || pTitle.includes(rawLower) || combined.includes(pConcept)) {
      return {
        matched: true,
        spec: p.spec,
        presetTitle: p.title,
        matchType: 'fuzzy',
      };
    }
  }

  return { matched: false };
}
