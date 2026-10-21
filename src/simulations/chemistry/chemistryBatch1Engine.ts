/**
 * TECH-ANATOMIX: DISSECT YOUR CELL! — CHEMISTRY BATCH 1 SIMULATION ENGINE (MODELS 69–75)
 *
 * Deterministic, scientifically accurate calculations and state models for:
 * - Model 69: Molecular Orbital Explorer ('molecular-orbital-explorer')
 * - Model 70: Atomic Orbital Probability Explorer ('atomic-orbital-probability-explorer')
 * - Model 71: Advanced Crystal Lattice Explorer ('advanced-crystal-lattice-explorer')
 * - Model 72: Molecular Polarity Explorer ('molecular-polarity-explorer')
 * - Model 73: Intermolecular Forces Explorer ('intermolecular-forces-explorer')
 * - Model 74: Electrochemical Cell Simulator ('electrochemical-cell-simulator')
 * - Model 75: Electrolysis Explorer ('electrolysis-explorer')
 */

export const FARADAY_CONSTANT_C_MOL = 96485.33212; // C/mol
export const GAS_CONSTANT_J_MOL_K = 8.314462618; // J/(mol·K)

// ============================================================================
// MODEL 69: MOLECULAR ORBITAL EXPLORER
// ============================================================================
export type MoPresetType =
  | 'h2_sigma_1s_bonding'
  | 'h2_sigma_star_1s_antibonding'
  | 'p2_sigma_2pz_bonding'
  | 'p2_sigma_star_2pz_antibonding'
  | 'p2_pi_2px_bonding'
  | 'p2_pi_star_2px_antibonding';

export interface MolecularOrbitalMetrics {
  orbitalPreset: MoPresetType;
  orbitalLabel: string;
  interactionSymmetry: 'σ (Sigma — Cylindrical Symmetry)' | 'π (Pi — Nodal Plane Along Axis)';
  bondingCharacter: 'Bonding (Constructive Interference)' | 'Antibonding (Destructive Interference)';
  parentAtomicOrbitals: string;
  combinationProgressPct: number;
  internuclearDistanceAngstrom: number;
  equilibriumDistanceAngstrom: number;
  overlapIntegralS: number; // LCAO overlap integral S(R)
  atomicOrbitalBaselineEnergyEv: number;
  bondingOrbitalEnergyEv: number;
  antibondingOrbitalEnergyEv: number;
  activeOrbitalEnergyEv: number;
  stabilizationDeltaEv: number;
  electronOccupancyConfig: string;
  bondingElectronsCount: number;
  antibondingElectronsCount: number;
  bondOrder: number; // BO = (N_b - N_a) / 2
  magneticProperty: 'Diamagnetic (All Electrons Paired)' | 'Paramagnetic (Unpaired Electron)' | 'Unoccupied (0 e⁻)';
  nodalPlanesCount: number;
  nodalPlaneDescription: string;
  wavefunctionFormula: string;
  electronConfigurationLabel: string;
}

export function calculateMolecularOrbitalMetrics(params: {
  orbitalPreset?: string;
  combinationProgressPct?: number;
  internuclearDistanceAngstrom?: number;
  electronOccupancyConfig?: string;
}): MolecularOrbitalMetrics {
  const rawPreset = String(params.orbitalPreset || 'h2_sigma_1s_bonding');
  const validPresets: MoPresetType[] = [
    'h2_sigma_1s_bonding',
    'h2_sigma_star_1s_antibonding',
    'p2_sigma_2pz_bonding',
    'p2_sigma_star_2pz_antibonding',
    'p2_pi_2px_bonding',
    'p2_pi_star_2px_antibonding',
  ];
  const preset: MoPresetType = validPresets.includes(rawPreset as MoPresetType)
    ? (rawPreset as MoPresetType)
    : 'h2_sigma_1s_bonding';

  const combPct = Math.max(0, Math.min(100, Number(params.combinationProgressPct ?? 100)));
  const combFrac = combPct / 100;

  const is1s = preset.startsWith('h2_');
  const isPi = preset.includes('_pi_');
  const isAntibonding = preset.includes('_star_');

  const eqDist = is1s ? 0.74 : isPi ? 1.21 : 1.42;
  const distA = Math.max(0.5, Math.min(3.0, Number(params.internuclearDistanceAngstrom ?? eqDist)));

  // Hydrogenic 1s overlap integral S(R) = exp(-rho)*(1 + rho + rho^2/3) where rho = R / a0 (a0 = 0.529 A)
  const a0 = 0.529177;
  const rho = distA / (is1s ? a0 : a0 * 1.65);
  const rawS = Math.exp(-rho) * (1 + rho + (rho * rho) / 3);
  const effectiveS = +(Math.min(0.85, Math.max(0.02, rawS * (isPi ? 0.62 : 1.0))) * (0.2 + 0.8 * combFrac)).toFixed(3);

  // Baseline atomic orbital energy (qualitative / reference hydrogenic 1s = -13.6 eV, valence 2p = -11.4 eV)
  const E_ao = is1s ? -13.6 : -11.4;
  // Resonance integral beta scales with overlap S
  const betaMagnitude = (is1s ? 4.75 : isPi ? 3.2 : 4.1) * (effectiveS / 0.45);
  const E_bonding = +(E_ao - betaMagnitude / (1 + effectiveS)).toFixed(2);
  const E_antibonding = +(E_ao + (betaMagnitude * 1.18) / Math.max(0.25, 1 - effectiveS * 0.65)).toFixed(2);
  const activeEnergy = isAntibonding ? E_antibonding : E_bonding;
  const deltaEv = +(activeEnergy - E_ao).toFixed(2);

  // Electron occupancy configuration
  const occConfig = String(params.electronOccupancyConfig || 'h2_ground_2e');
  let nBonding = 2;
  let nAntibonding = 0;
  let configLabel = 'H₂ Ground State (σ₁s)² — Bond Order = 1.0';

  if (occConfig === 'h2_plus_1e') {
    nBonding = 1;
    nAntibonding = 0;
    configLabel = 'H₂⁺ Molecular Ion (σ₁s)¹ — Bond Order = 0.5';
  } else if (occConfig === 'he2_plus_3e') {
    nBonding = 2;
    nAntibonding = 1;
    configLabel = 'He₂⁺ Ion (σ₁s)²(σ*₁s)¹ — Bond Order = 0.5';
  } else if (occConfig === 'he2_unstable_4e') {
    nBonding = 2;
    nAntibonding = 2;
    configLabel = 'He₂ Unstable Dimer (σ₁s)²(σ*₁s)² — Bond Order = 0.0 (No Net Bond)';
  } else {
    nBonding = 2;
    nAntibonding = 0;
    configLabel = is1s
      ? 'H₂ Ground State (σ₁s)² — Bond Order = 1.0'
      : isPi
      ? 'Diatomic π² Subshell (π₂p)² — Bond Order Contribution = 1.0'
      : 'Diatomic σ² Subshell (σ₂p)² — Bond Order Contribution = 1.0';
  }

  const bondOrder = +((nBonding - nAntibonding) / 2).toFixed(1);
  const totalElectrons = nBonding + nAntibonding;
  const hasUnpaired = nBonding % 2 === 1 || nAntibonding % 2 === 1;
  const magneticProperty =
    totalElectrons === 0
      ? 'Unoccupied (0 e⁻)'
      : hasUnpaired
      ? 'Paramagnetic (Unpaired Electron)'
      : 'Diamagnetic (All Electrons Paired)';

  let orbitalLabel = 'σ₁s Bonding Molecular Orbital';
  let parentAtomicOrbitals = '1s(A) + 1s(B) Head-On Overlap';
  let nodalPlanesCount = 0;
  let nodalPlaneDescription = '0 intermolecular nodal planes (continuous electron density between nuclei A and B)';
  let wavefunctionFormula = 'ψ(σ₁s) = N_+ [ψ_1s(A) + ψ_1s(B)]';

  if (preset === 'h2_sigma_star_1s_antibonding') {
    orbitalLabel = 'σ*₁s Antibonding Molecular Orbital';
    parentAtomicOrbitals = '1s(A) − 1s(B) Out-of-Phase Subtraction';
    nodalPlanesCount = 1;
    nodalPlaneDescription = '1 transverse nodal plane perpendicular to internuclear axis at midpoint (x = 0)';
    wavefunctionFormula = 'ψ(σ*₁s) = N_- [ψ_1s(A) − ψ_1s(B)]';
  } else if (preset === 'p2_sigma_2pz_bonding') {
    orbitalLabel = 'σ₂p Bonding Molecular Orbital';
    parentAtomicOrbitals = '2p_z(A) + 2p_z(B) Head-On Axial Overlap';
    nodalPlanesCount = 2;
    nodalPlaneDescription = '2 atomic nodal planes at nuclei A and B; constructive (+/+) lobe fusion in internuclear region';
    wavefunctionFormula = 'ψ(σ₂p) = N_+ [ψ_2pz(A) − ψ_2pz(B)] (in-phase inner lobes)';
  } else if (preset === 'p2_sigma_star_2pz_antibonding') {
    orbitalLabel = 'σ*₂p Antibonding Molecular Orbital';
    parentAtomicOrbitals = '2p_z(A) − 2p_z(B) Destructive Axial Overlap';
    nodalPlanesCount = 3;
    nodalPlaneDescription = 'Central transverse nodal plane at midpoint (x = 0) plus 2 nuclear nodal planes';
    wavefunctionFormula = 'ψ(σ*₂p) = N_- [ψ_2pz(A) + ψ_2pz(B)] (out-of-phase inner lobes)';
  } else if (preset === 'p2_pi_2px_bonding') {
    orbitalLabel = 'π₂p Bonding Molecular Orbital';
    parentAtomicOrbitals = '2p_y(A) + 2p_y(B) Side-by-Side Parallel Overlap';
    nodalPlanesCount = 1;
    nodalPlaneDescription = '1 horizontal nodal plane containing the internuclear axis (y = 0); electron density above & below axis';
    wavefunctionFormula = 'ψ(π₂p) = N_+ [ψ_2py(A) + ψ_2py(B)]';
  } else if (preset === 'p2_pi_star_2px_antibonding') {
    orbitalLabel = 'π*₂p Antibonding Molecular Orbital';
    parentAtomicOrbitals = '2p_y(A) − 2p_y(B) Out-of-Phase Side-by-Side Overlap';
    nodalPlanesCount = 2;
    nodalPlaneDescription = '2 mutually perpendicular nodal planes: 1 along internuclear axis (y = 0) and 1 bisecting the bond (x = 0)';
    wavefunctionFormula = 'ψ(π*₂p) = N_- [ψ_2py(A) − ψ_2py(B)]';
  }

  return {
    orbitalPreset: preset,
    orbitalLabel,
    interactionSymmetry: isPi ? 'π (Pi — Nodal Plane Along Axis)' : 'σ (Sigma — Cylindrical Symmetry)',
    bondingCharacter: isAntibonding
      ? 'Antibonding (Destructive Interference)'
      : 'Bonding (Constructive Interference)',
    parentAtomicOrbitals,
    combinationProgressPct: combPct,
    internuclearDistanceAngstrom: +distA.toFixed(2),
    equilibriumDistanceAngstrom: eqDist,
    overlapIntegralS: effectiveS,
    atomicOrbitalBaselineEnergyEv: E_ao,
    bondingOrbitalEnergyEv: E_bonding,
    antibondingOrbitalEnergyEv: E_antibonding,
    activeOrbitalEnergyEv: activeEnergy,
    stabilizationDeltaEv: deltaEv,
    electronOccupancyConfig: occConfig,
    bondingElectronsCount: nBonding,
    antibondingElectronsCount: nAntibonding,
    bondOrder,
    magneticProperty,
    nodalPlanesCount,
    nodalPlaneDescription,
    wavefunctionFormula,
    electronConfigurationLabel: configLabel,
  };
}

// ============================================================================
// MODEL 70: ATOMIC ORBITAL PROBABILITY EXPLORER
// ============================================================================
export type AtomicOrbitalId =
  | '1s'
  | '2s'
  | '2px'
  | '2py'
  | '2pz'
  | '3dz2'
  | '3dx2y2'
  | '3dxy';

export type AtomicSubshellType = '1s' | '2s' | '2p' | '3d';
export type AtomicOrientationType = 'z' | 'x' | 'y' | 'x2_y2' | 'xy';
export type AtomicDensityViewMode = 'both' | 'isosurface' | 'point_cloud';

export interface AtomicOrbitalMetrics {
  orbitalId: AtomicOrbitalId;
  orbitalType: AtomicSubshellType;
  orbitalOrientation: AtomicOrientationType;
  densityViewMode: AtomicDensityViewMode;
  orbitalName: string;
  standardOrbitalName: string;
  principalQuantumNumberN: number; // n = 1, 2, 3
  angularMomentumQuantumNumberL: number; // l = 0 (s), 1 (p), 2 (d)
  magneticQuantumNumberMl: number; // m_l in [-l, +l]
  magneticQuantumLabel: string;
  magneticQuantumNumberMlLabel: string;
  subshellLetter: 's' | 'p' | 'd';
  radialNodesCount: number; // n - l - 1
  angularNodesCount: number; // l
  totalNodesCount: number; // n - 1
  hydrogenicEnergyEv: number; // E_n = -13.6 / n^2 eV
  mostProbableRadiusBohr: number; // r_mp in units of a_0
  probabilityThresholdPct: number;
  enclosedProbabilityPct: number;
  orientationAxisLabel: string;
  shapeDescription: string;
  nodalGeometryDescription: string;
  densityInterpretation: string;
}

export function calculateAtomicOrbitalMetrics(params: {
  orbitalType?: string;
  orbitalOrientation?: string;
  probabilityThresholdPct?: number;
  densityViewMode?: string;
  showNodalSurfaces?: boolean | number;
  crossSectionSlice?: boolean | number;
}): AtomicOrbitalMetrics {
  const rawOrb = String(params.orbitalType || '2p').toLowerCase();
  const rawOrient = String(params.orbitalOrientation || 'z').toLowerCase();
  const rawView = String(params.densityViewMode || 'both').toLowerCase();
  const thresholdPct = Math.max(10, Math.min(95, Number(params.probabilityThresholdPct ?? 90)));

  const densityViewMode: AtomicDensityViewMode =
    rawView === 'isosurface' || rawView === 'point_cloud' ? rawView : 'both';

  let subshellType: AtomicSubshellType = '2p';
  let orientType: AtomicOrientationType = 'z';
  let effectiveOrb: AtomicOrbitalId = '2pz';

  if (rawOrb === '1s') {
    subshellType = '1s';
    orientType = 'z';
    effectiveOrb = '1s';
  } else if (rawOrb === '2s') {
    subshellType = '2s';
    orientType = 'z';
    effectiveOrb = '2s';
  } else if (rawOrb === '2px') {
    subshellType = '2p';
    orientType = 'x';
    effectiveOrb = '2px';
  } else if (rawOrb === '2py') {
    subshellType = '2p';
    orientType = 'y';
    effectiveOrb = '2py';
  } else if (rawOrb === '2pz' || rawOrb === '2p') {
    subshellType = '2p';
    if (rawOrient === 'x') {
      orientType = 'x';
      effectiveOrb = '2px';
    } else if (rawOrient === 'y') {
      orientType = 'y';
      effectiveOrb = '2py';
    } else {
      orientType = 'z';
      effectiveOrb = '2pz';
    }
  } else if (rawOrb === '3dz2') {
    subshellType = '3d';
    orientType = 'z';
    effectiveOrb = '3dz2';
  } else if (rawOrb === '3dx2y2') {
    subshellType = '3d';
    orientType = 'x2_y2';
    effectiveOrb = '3dx2y2';
  } else if (rawOrb === '3dxy') {
    subshellType = '3d';
    orientType = 'xy';
    effectiveOrb = '3dxy';
  } else if (rawOrb === '3d') {
    subshellType = '3d';
    if (rawOrient === 'x2_y2' || rawOrient === 'x2y2') {
      orientType = 'x2_y2';
      effectiveOrb = '3dx2y2';
    } else if (rawOrient === 'xy') {
      orientType = 'xy';
      effectiveOrb = '3dxy';
    } else {
      orientType = 'z';
      effectiveOrb = '3dz2';
    }
  }

  let n = 1;
  let l = 0;
  let ml = 0;
  let mlLabel = '0';
  let subshell: 's' | 'p' | 'd' = 's';
  let orbitalName = '1s Orbital (Ground State Spherical)';
  let mostProbableR = 1.0; // in Bohr radii a_0
  let orientationAxisLabel = 'Isotropic (Spherically Symmetric about Nucleus)';
  let shapeDescription = 'Single spherical probability cloud peaking at r = 1 a₀ with exponential radial decay.';
  let nodalGeometryDescription = '0 radial nodes, 0 angular nodes (ψ₁s > 0 everywhere).';

  switch (effectiveOrb) {
    case '1s':
      n = 1;
      l = 0;
      ml = 0;
      mlLabel = '0';
      subshell = 's';
      orbitalName = '1s Orbital (n = 1, l = 0, m_l = 0)';
      mostProbableR = 1.0;
      orientationAxisLabel = 'Isotropic Spherical Symmetry';
      shapeDescription = 'Spherically symmetric electron probability density |ψ₁s|² decaying exponentially with radius r.';
      nodalGeometryDescription = '0 radial nodes (n−l−1 = 0) and 0 angular nodes (l = 0).';
      break;
    case '2s':
      n = 2;
      l = 0;
      ml = 0;
      mlLabel = '0';
      subshell = 's';
      orbitalName = '2s Orbital (n = 2, l = 0, m_l = 0)';
      mostProbableR = 5.24;
      orientationAxisLabel = 'Isotropic Concentric Spherical Shells';
      shapeDescription = 'Inner high-density spherical core (positive phase) surrounded by a concentric outer spherical shell (negative phase).';
      nodalGeometryDescription = '1 spherical radial node at r = 2a₀ (n−l−1 = 1) and 0 angular nodes (l = 0).';
      break;
    case '2px':
      n = 2;
      l = 1;
      ml = 1;
      mlLabel = '±1 (p_x)';
      subshell = 'p';
      orbitalName = '2p_x Orbital (n = 2, l = 1)';
      mostProbableR = 4.0;
      orientationAxisLabel = 'Directed Along X-Axis (+x / −x Lobes)';
      shapeDescription = 'Two-lobed dumbbell probability distribution aligned along the X-axis with opposite wavefunction phases (+ and −).';
      nodalGeometryDescription = '0 radial nodes (n−l−1 = 0) and 1 planar angular node in the YZ-plane (x = 0).';
      break;
    case '2py':
      n = 2;
      l = 1;
      ml = -1;
      mlLabel = '±1 (p_y)';
      subshell = 'p';
      orbitalName = '2p_y Orbital (n = 2, l = 1)';
      mostProbableR = 4.0;
      orientationAxisLabel = 'Directed Along Y-Axis (+y / −y Lobes)';
      shapeDescription = 'Two-lobed dumbbell probability distribution aligned along the vertical Y-axis with opposite wavefunction phases.';
      nodalGeometryDescription = '0 radial nodes (n−l−1 = 0) and 1 planar angular node in the XZ-plane (y = 0).';
      break;
    case '2pz':
      n = 2;
      l = 1;
      ml = 0;
      mlLabel = '0 (p_z)';
      subshell = 'p';
      orbitalName = '2p_z Orbital (n = 2, l = 1, m_l = 0)';
      mostProbableR = 4.0;
      orientationAxisLabel = 'Directed Along Z-Axis (+z / −z Lobes)';
      shapeDescription = 'Two-lobed dumbbell probability distribution aligned along the Z-axis with opposite wavefunction phases.';
      nodalGeometryDescription = '0 radial nodes (n−l−1 = 0) and 1 planar angular node in the XY-plane (z = 0).';
      break;
    case '3dz2':
      n = 3;
      l = 2;
      ml = 0;
      mlLabel = '0 (d_z²)';
      subshell = 'd';
      orbitalName = '3d_z² Orbital (n = 3, l = 2, m_l = 0)';
      mostProbableR = 9.0;
      orientationAxisLabel = 'Axial Lobes Along Z-Axis + Equatorial Torus Ring in XY-Plane';
      shapeDescription = 'Two primary lobes along the Z-axis (+ phase) encircled by a doughnut-shaped torus ring in the XY equatorial plane (− phase).';
      nodalGeometryDescription = '0 radial nodes (n−l−1 = 0) and 2 conical angular nodal surfaces at 3cos²θ − 1 = 0 (θ ≈ 54.7° and 125.3°).';
      break;
    case '3dx2y2':
      n = 3;
      l = 2;
      ml = 2;
      mlLabel = '±2 (d_x²−y²)';
      subshell = 'd';
      orbitalName = '3d_x²−y² Orbital (n = 3, l = 2)';
      mostProbableR = 9.0;
      orientationAxisLabel = 'Four Cloverleaf Lobes Directed Along X and Y Axes';
      shapeDescription = 'Four-lobed cloverleaf distribution with lobes lying directly on the X-axis (+ phase) and Y-axis (− phase).';
      nodalGeometryDescription = '0 radial nodes (n−l−1 = 0) and 2 mutually perpendicular planar angular nodes at x = +y and x = −y (45° diagonals).';
      break;
    case '3dxy':
      n = 3;
      l = 2;
      ml = -2;
      mlLabel = '±2 (d_xy)';
      subshell = 'd';
      orbitalName = '3d_xy Orbital (n = 3, l = 2)';
      mostProbableR = 9.0;
      orientationAxisLabel = 'Four Cloverleaf Lobes Between X and Y Axes (45° Diagonals)';
      shapeDescription = 'Four-lobed cloverleaf distribution with lobes pointing between the X and Y axes in the XY-plane.';
      nodalGeometryDescription = '0 radial nodes (n−l−1 = 0) and 2 planar angular nodes along the XZ-plane (y = 0) and YZ-plane (x = 0).';
      break;
  }

  const radialNodes = n - l - 1;
  const angularNodes = l;
  const totalNodes = n - 1;
  const energyEv = +(-13.6 / (n * n)).toFixed(2);
  const enclosedProb = Math.min(99, Math.max(25, Math.round(thresholdPct)));

  return {
    orbitalId: effectiveOrb,
    orbitalType: subshellType,
    orbitalOrientation: orientType,
    densityViewMode,
    orbitalName,
    standardOrbitalName: orbitalName,
    principalQuantumNumberN: n,
    angularMomentumQuantumNumberL: l,
    magneticQuantumNumberMl: ml,
    magneticQuantumLabel: `m_l = ${mlLabel}`,
    magneticQuantumNumberMlLabel: mlLabel,
    subshellLetter: subshell,
    radialNodesCount: radialNodes,
    angularNodesCount: angularNodes,
    totalNodesCount: totalNodes,
    hydrogenicEnergyEv: energyEv,
    mostProbableRadiusBohr: mostProbableR,
    probabilityThresholdPct: thresholdPct,
    enclosedProbabilityPct: enclosedProb,
    orientationAxisLabel,
    shapeDescription,
    nodalGeometryDescription,
    densityInterpretation: `Isosurface threshold encloses ~${enclosedProb}% of the cumulative probability ∫|ψ|²dV. The surface is a statistical contour, not a hard physical wall or classical electron track.`,
  };
}

// ============================================================================
// MODEL 71: ADVANCED CRYSTAL LATTICE EXPLORER
// ============================================================================
export type CrystalLatticeType = 'SC' | 'BCC' | 'FCC' | 'HCP';

export interface CrystalLatticeMetrics {
  latticeType: CrystalLatticeType;
  latticeName: string;
  atomicRadiusPm: number; // picometers (pm)
  packingViewMode: 'ball_and_stick' | 'space_filling';
  cellExpansionFactor: number;
  comparisonLatticeType: 'none' | CrystalLatticeType;
  latticeParameterAPm: number; // edge length a in pm
  latticeConstantAPm: number; // alias for studio
  latticeParameterCPm: number; // height c in pm (c = a for cubic, c = 1.633a for ideal HCP)
  cOverARatio: number;
  cornerAtomsCount: number;
  cornerContributionFraction: string;
  faceAtomsCount: number;
  faceContributionFraction: string;
  bodyInteriorAtomsCount: number;
  bodyContributionFraction: string;
  atomsPerConventionalUnitCell: number;
  totalAtomsPerConventionalCell: number; // alias for studio
  atomsPerPrimitiveCell: number;
  coordinationNumber: number;
  atomicPackingFactor: number; // decimal e.g. 0.524, 0.680, 0.740
  atomicPackingFactorPct: number; // percentage e.g. 52.4%, 68.0%, 74.0%
  voidSpacePct: number;
  unitCellVolumeNm3: number;
  closePackedDirection: string;
  aToRFormula: string;
  atomSharingBreakdown: string;
  sharingEquation: string; // alias for studio
  latticeVsBasisNote: string;
  exampleElements: string;
}

export function calculateCrystalLatticeMetrics(params: {
  latticeType?: string;
  atomicRadiusPm?: number;
  packingViewMode?: string;
  cellExpansionFactor?: number;
  comparisonLatticeType?: string;
}): CrystalLatticeMetrics {
  const rawType = String(params.latticeType || 'FCC').toUpperCase();
  const latticeType: CrystalLatticeType =
    rawType === 'SC' || rawType === 'BCC' || rawType === 'HCP' ? rawType : 'FCC';

  const rPm = Math.max(90, Math.min(240, Number(params.atomicRadiusPm ?? 140)));
  const packingViewMode =
    params.packingViewMode === 'space_filling' ? 'space_filling' : 'ball_and_stick';
  const cellExpansionFactor = Math.max(0, Math.min(100, Number(params.cellExpansionFactor ?? 0)));
  const rawComp = String(params.comparisonLatticeType || 'none').toUpperCase();
  const comparisonLatticeType: 'none' | CrystalLatticeType =
    rawComp === 'SC' || rawComp === 'BCC' || rawComp === 'FCC' || rawComp === 'HCP'
      ? rawComp
      : 'none';

  let latticeName = 'Face-Centred Cubic (FCC / Cubic Close-Packed)';
  let aPm = 2 * Math.SQRT2 * rPm;
  let cPm = aPm;
  let cornerCount = 8;
  let cornerFrac = '1/8';
  let faceCount = 6;
  let faceFrac = '1/2';
  let bodyCount = 0;
  let bodyFrac = '1';
  let atomsConventional = 4;
  let atomsPrimitive = 1;
  let coordinationNumber = 12;
  let apf = Math.PI / (3 * Math.SQRT2); // 0.74048
  let closePackedDir = 'Face Diagonal ⟨110⟩ (Length = √2 a = 4R)';
  let aToRFormula = 'a = 2√2 R ≈ 2.828 R';
  let sharingBreakdown = '8 corners × (1/8) + 6 faces × (1/2) = 1 + 3 = 4 atoms/cell';
  let exampleElements = 'Cu, Al, Ag, Au, Ni, Pt, γ-Fe';

  if (latticeType === 'SC') {
    latticeName = 'Simple Cubic (SC / Primitive Cubic)';
    aPm = 2 * rPm;
    cPm = aPm;
    cornerCount = 8;
    cornerFrac = '1/8';
    faceCount = 0;
    faceFrac = '1/2';
    bodyCount = 0;
    bodyFrac = '1';
    atomsConventional = 1;
    atomsPrimitive = 1;
    coordinationNumber = 6;
    apf = Math.PI / 6; // 0.5236
    closePackedDir = 'Cube Edge ⟨100⟩ (Length = a = 2R)';
    aToRFormula = 'a = 2R';
    sharingBreakdown = '8 corners × (1/8) = 1 atom/cell';
    exampleElements = 'α-Polonium (α-Po)';
  } else if (latticeType === 'BCC') {
    latticeName = 'Body-Centred Cubic (BCC)';
    aPm = (4 * rPm) / Math.sqrt(3);
    cPm = aPm;
    cornerCount = 8;
    cornerFrac = '1/8';
    faceCount = 0;
    faceFrac = '1/2';
    bodyCount = 1;
    bodyFrac = '1';
    atomsConventional = 2;
    atomsPrimitive = 1;
    coordinationNumber = 8;
    apf = (Math.sqrt(3) * Math.PI) / 8; // 0.68017
    closePackedDir = 'Body Diagonal ⟨111⟩ (Length = √3 a = 4R)';
    aToRFormula = 'a = 4R / √3 ≈ 2.309 R';
    sharingBreakdown = '8 corners × (1/8) + 1 body-centred × (1) = 1 + 1 = 2 atoms/cell';
    exampleElements = 'α-Fe (Iron), Cr, W, Mo, V, Na, K';
  } else if (latticeType === 'HCP') {
    latticeName = 'Hexagonal Close-Packed (HCP — Conventional Hexagonal Cell)';
    aPm = 2 * rPm;
    cPm = Math.sqrt(8 / 3) * aPm; // ideal c/a = 1.63299
    cornerCount = 12;
    cornerFrac = '1/6';
    faceCount = 2;
    faceFrac = '1/2';
    bodyCount = 3;
    bodyFrac = '1';
    atomsConventional = 6;
    atomsPrimitive = 2;
    coordinationNumber = 12;
    apf = Math.PI / (3 * Math.SQRT2); // 0.74048
    closePackedDir = 'Basal Hexagon Edge ⟨112̄0⟩ (a = 2R, ideal c/a = √(8/3) ≈ 1.633)';
    aToRFormula = 'a = 2R , c = √(8/3) a ≈ 1.633 a';
    sharingBreakdown =
      '12 corners × (1/6) + 2 basal faces × (1/2) + 3 interior × (1) = 6 atoms/hex cell (2/primitive)';
    exampleElements = 'Mg, Ti, Zn, Co, Zr, Be, Cd';
  }

  // Volume in nm^3 (1 nm = 1000 pm -> 1 nm^3 = 10^9 pm^3)
  const volPm3 =
    latticeType === 'HCP'
      ? ((3 * Math.sqrt(3)) / 2) * aPm * aPm * cPm
      : aPm * aPm * aPm;
  const volNm3 = +(volPm3 / 1e9).toFixed(4);

  const apfPct = +(apf * 100).toFixed(1);
  const voidPct = +(100 - apfPct).toFixed(1);
  const roundedAPm = Math.round(aPm);

  return {
    latticeType,
    latticeName,
    atomicRadiusPm: rPm,
    packingViewMode,
    cellExpansionFactor,
    comparisonLatticeType,
    latticeParameterAPm: roundedAPm,
    latticeConstantAPm: roundedAPm,
    latticeParameterCPm: Math.round(cPm),
    cOverARatio: +(cPm / aPm).toFixed(3),
    cornerAtomsCount: cornerCount,
    cornerContributionFraction: cornerFrac,
    faceAtomsCount: faceCount,
    faceContributionFraction: faceFrac,
    bodyInteriorAtomsCount: bodyCount,
    bodyContributionFraction: bodyFrac,
    atomsPerConventionalUnitCell: atomsConventional,
    totalAtomsPerConventionalCell: atomsConventional,
    atomsPerPrimitiveCell: atomsPrimitive,
    coordinationNumber,
    atomicPackingFactor: +apf.toFixed(4),
    atomicPackingFactorPct: apfPct,
    voidSpacePct: voidPct,
    unitCellVolumeNm3: volNm3,
    closePackedDirection: closePackedDir,
    aToRFormula,
    atomSharingBreakdown: sharingBreakdown,
    sharingEquation: sharingBreakdown,
    latticeVsBasisNote: `Crystal = Lattice + Basis (${exampleElements}). Conventional cell = ${atomsConventional} atoms; Primitive cell = ${atomsPrimitive} atom(s).`,
    exampleElements,
  };
}

// ============================================================================
// MODEL 72: MOLECULAR POLARITY EXPLORER
// ============================================================================
export type PolarityMoleculeId = 'H2O' | 'CO2' | 'NH3' | 'CH4' | 'BF3';

export interface MolecularPolarityMetrics {
  moleculeId: PolarityMoleculeId;
  formula: string;
  moleculeName: string;
  vseprClass: string;
  electronDomainGeometry: string;
  molecularGeometry: string;
  vseprGeometry: string;
  idealBondAngleDeg: number;
  actualBondAngleDeg: number;
  centralElement: string;
  centralAtomSymbol: string;
  centralElectronegativity: number;
  terminalElement: string;
  terminalAtomSymbol: string;
  terminalElectronegativity: number;
  electronegativityDiff: number;
  electronegativityDifference: number;
  individualBondPolarity: 'Polar Covalent Bond' | 'Moderately Polar Covalent Bond';
  bondPolarityClassification: string;
  bondDipoleDirection: string;
  lonePairsOnCentral: number;
  isSymmetricCancellation: boolean;
  isPolarMolecule: boolean;
  overallMolecularPolarity: 'Polar Molecule (μ_net > 0)' | 'Nonpolar Molecule (μ_net = 0 by Symmetry)';
  overallPolarityClassification: string;
  netDipoleMomentDebye: number;
  resultantVectorDirection: string;
  partialChargeCentral: string;
  centralPartialCharge: string;
  partialChargeTerminal: string;
  terminalPartialCharge: string;
  scientificExplanation: string;
}

export function calculateMolecularPolarityMetrics(params: {
  moleculeId?: string;
  selectedMolecule?: string;
  bondAngleOverrideDeg?: number;
  showBondDipoles?: boolean | number;
  showResultantDipole?: boolean | number;
  showPartialCharges?: boolean | number;
  showGeometryOverlay?: boolean | number;
}): MolecularPolarityMetrics {
  const rawId = String(params.moleculeId || params.selectedMolecule || 'H2O').toUpperCase();
  const validIds: PolarityMoleculeId[] = ['H2O', 'CO2', 'NH3', 'CH4', 'BF3'];
  const molId: PolarityMoleculeId = validIds.includes(rawId as PolarityMoleculeId)
    ? (rawId as PolarityMoleculeId)
    : 'H2O';

  switch (molId) {
    case 'H2O':
      return {
        moleculeId: 'H2O',
        formula: 'H₂O',
        moleculeName: 'Water (H₂O)',
        vseprClass: 'AX₂E₂',
        electronDomainGeometry: 'Tetrahedral (4 Electron Domains)',
        molecularGeometry: 'Bent / Angular',
        vseprGeometry: 'Bent (AX₂E₂)',
        idealBondAngleDeg: 104.5,
        actualBondAngleDeg: 104.5,
        centralElement: 'O',
        centralAtomSymbol: 'O',
        centralElectronegativity: 3.44,
        terminalElement: 'H',
        terminalAtomSymbol: 'H',
        terminalElectronegativity: 2.20,
        electronegativityDiff: 1.24,
        electronegativityDifference: 1.24,
        individualBondPolarity: 'Polar Covalent Bond',
        bondPolarityClassification: 'Polar Covalent Bond (Δχ = 1.24)',
        bondDipoleDirection: 'Each H → O bond dipole points inward from H (δ⁺) toward central O (δ⁻)',
        lonePairsOnCentral: 2,
        isSymmetricCancellation: false,
        isPolarMolecule: true,
        overallMolecularPolarity: 'Polar Molecule (μ_net > 0)',
        overallPolarityClassification: 'POLAR MOLECULE (Asymmetric Bent Vector Sum)',
        netDipoleMomentDebye: 1.85,
        resultantVectorDirection: 'Upward along the C₂ bisector axis toward the Oxygen atom (δ⁻)',
        partialChargeCentral: 'δ⁻ (Oxygen, χ = 3.44)',
        centralPartialCharge: 'δ⁻ (Oxygen)',
        partialChargeTerminal: 'δ⁺ (Hydrogens, χ = 2.20)',
        terminalPartialCharge: 'δ⁺ (Hydrogens)',
        scientificExplanation:
          'Because H₂O has a bent 104.5° geometry caused by two lone pairs on Oxygen, the two polar O–H bond dipoles do not oppose each other; their horizontal components cancel while their vertical components add constructively to yield a strong net dipole (μ = 1.85 D).',
      };

    case 'CO2':
      return {
        moleculeId: 'CO2',
        formula: 'CO₂',
        moleculeName: 'Carbon Dioxide (CO₂)',
        vseprClass: 'AX₂',
        electronDomainGeometry: 'Linear (2 Electron Domains)',
        molecularGeometry: 'Linear',
        vseprGeometry: 'Linear (AX₂)',
        idealBondAngleDeg: 180.0,
        actualBondAngleDeg: 180.0,
        centralElement: 'C',
        centralAtomSymbol: 'C',
        centralElectronegativity: 2.55,
        terminalElement: 'O',
        terminalAtomSymbol: 'O',
        terminalElectronegativity: 3.44,
        electronegativityDiff: 0.89,
        electronegativityDifference: 0.89,
        individualBondPolarity: 'Polar Covalent Bond',
        bondPolarityClassification: 'Polar Covalent Bond (Δχ = 0.89)',
        bondDipoleDirection: 'Two equal C=O bond dipoles point outward in opposite directions (← O=C=O →)',
        lonePairsOnCentral: 0,
        isSymmetricCancellation: true,
        isPolarMolecule: false,
        overallMolecularPolarity: 'Nonpolar Molecule (μ_net = 0 by Symmetry)',
        overallPolarityClassification: 'NONPOLAR MOLECULE (180° Linear Cancellation)',
        netDipoleMomentDebye: 0.0,
        resultantVectorDirection: 'Zero resultant vector (μ_left + μ_right = 0)',
        partialChargeCentral: 'δ⁺ (Carbon, χ = 2.55)',
        centralPartialCharge: 'δ⁺ (Carbon)',
        partialChargeTerminal: 'δ⁻ (Oxygens, χ = 3.44)',
        terminalPartialCharge: 'δ⁻ (Oxygens)',
        scientificExplanation:
          'Each C=O double bond is polar (Δχ = 0.89), but because CO₂ is linear (180°), the two equal bond-dipole vectors pull in exactly opposite directions and cancel completely by vector addition (μ_net = 0 D).',
      };

    case 'NH3':
      return {
        moleculeId: 'NH3',
        formula: 'NH₃',
        moleculeName: 'Ammonia (NH₃)',
        vseprClass: 'AX₃E',
        electronDomainGeometry: 'Tetrahedral (4 Electron Domains)',
        molecularGeometry: 'Trigonal Pyramidal',
        vseprGeometry: 'Trigonal Pyramidal (AX₃E)',
        idealBondAngleDeg: 107.0,
        actualBondAngleDeg: 107.0,
        centralElement: 'N',
        centralAtomSymbol: 'N',
        centralElectronegativity: 3.04,
        terminalElement: 'H',
        terminalAtomSymbol: 'H',
        terminalElectronegativity: 2.20,
        electronegativityDiff: 0.84,
        electronegativityDifference: 0.84,
        individualBondPolarity: 'Polar Covalent Bond',
        bondPolarityClassification: 'Polar Covalent Bond (Δχ = 0.84)',
        bondDipoleDirection: 'Three N–H bond dipoles slant upward from the H₃ base (δ⁺) toward the N apex (δ⁻)',
        lonePairsOnCentral: 1,
        isSymmetricCancellation: false,
        isPolarMolecule: true,
        overallMolecularPolarity: 'Polar Molecule (μ_net > 0)',
        overallPolarityClassification: 'POLAR MOLECULE (Pyramidal Vector Sum)',
        netDipoleMomentDebye: 1.47,
        resultantVectorDirection: 'Upward along the C₃ pyramid axis toward the Nitrogen apex and lone pair',
        partialChargeCentral: 'δ⁻ (Nitrogen, χ = 3.04)',
        centralPartialCharge: 'δ⁻ (Nitrogen)',
        partialChargeTerminal: 'δ⁺ (Hydrogens, χ = 2.20)',
        terminalPartialCharge: 'δ⁺ (Hydrogens)',
        scientificExplanation:
          'In trigonal pyramidal NH₃ (107°), the three N–H bond dipoles all angle upward toward the nitrogen apex. Their lateral components cancel, while their vertical components add constructively with the lone pair to produce a net dipole (μ = 1.47 D).',
      };

    case 'CH4':
      return {
        moleculeId: 'CH4',
        formula: 'CH₄',
        moleculeName: 'Methane (CH₄)',
        vseprClass: 'AX₄',
        electronDomainGeometry: 'Tetrahedral (4 Electron Domains)',
        molecularGeometry: 'Tetrahedral',
        vseprGeometry: 'Tetrahedral (AX₄)',
        idealBondAngleDeg: 109.5,
        actualBondAngleDeg: 109.5,
        centralElement: 'C',
        centralAtomSymbol: 'C',
        centralElectronegativity: 2.55,
        terminalElement: 'H',
        terminalAtomSymbol: 'H',
        terminalElectronegativity: 2.20,
        electronegativityDiff: 0.35,
        electronegativityDifference: 0.35,
        individualBondPolarity: 'Moderately Polar Covalent Bond',
        bondPolarityClassification: 'Weakly Polar Covalent Bond (Δχ = 0.35)',
        bondDipoleDirection: 'Four symmetric C–H bond vectors arranged at 109.5° tetrahedral angles',
        lonePairsOnCentral: 0,
        isSymmetricCancellation: true,
        isPolarMolecule: false,
        overallMolecularPolarity: 'Nonpolar Molecule (μ_net = 0 by Symmetry)',
        overallPolarityClassification: 'NONPOLAR MOLECULE (Tetrahedral T_d Cancellation)',
        netDipoleMomentDebye: 0.0,
        resultantVectorDirection: 'Zero resultant vector (3D tetrahedral vector sum = 0)',
        partialChargeCentral: 'Small δ⁻ (Carbon, χ = 2.55)',
        centralPartialCharge: 'Small δ⁻ (Carbon)',
        partialChargeTerminal: 'Small δ⁺ (Hydrogens, χ = 2.20)',
        terminalPartialCharge: 'Small δ⁺ (Hydrogens)',
        scientificExplanation:
          'In tetrahedral CH₄ (109.5°), the four C–H bonds are arranged with full T_d symmetry. Even with a small electronegativity difference (Δχ = 0.35), the vector sum of any three C–H bonds exactly opposes the fourth, yielding zero net dipole (μ_net = 0 D).',
      };

    case 'BF3':
      return {
        moleculeId: 'BF3',
        formula: 'BF₃',
        moleculeName: 'Boron Trifluoride (BF₃)',
        vseprClass: 'AX₃',
        electronDomainGeometry: 'Trigonal Planar (3 Electron Domains)',
        molecularGeometry: 'Trigonal Planar',
        vseprGeometry: 'Trigonal Planar (AX₃)',
        idealBondAngleDeg: 120.0,
        actualBondAngleDeg: 120.0,
        centralElement: 'B',
        centralAtomSymbol: 'B',
        centralElectronegativity: 2.04,
        terminalElement: 'F',
        terminalAtomSymbol: 'F',
        terminalElectronegativity: 3.98,
        electronegativityDiff: 1.94,
        electronegativityDifference: 1.94,
        individualBondPolarity: 'Polar Covalent Bond',
        bondPolarityClassification: 'Strongly Polar Covalent Bond (Δχ = 1.94)',
        bondDipoleDirection: 'Three equal B–F bond dipoles point outward at 120° in a flat plane toward Fluorine (δ⁻)',
        lonePairsOnCentral: 0,
        isSymmetricCancellation: true,
        isPolarMolecule: false,
        overallMolecularPolarity: 'Nonpolar Molecule (μ_net = 0 by Symmetry)',
        overallPolarityClassification: 'NONPOLAR MOLECULE (120° Trigonal Planar Cancellation)',
        netDipoleMomentDebye: 0.0,
        resultantVectorDirection: 'Zero resultant vector (three coplanar 120° vectors sum to 0)',
        partialChargeCentral: 'δ⁺ (Boron, χ = 2.04)',
        centralPartialCharge: 'δ⁺ (Boron)',
        partialChargeTerminal: 'δ⁻ (Fluorines, χ = 3.98)',
        terminalPartialCharge: 'δ⁻ (Fluorines)',
        scientificExplanation:
          'Each B–F bond is strongly polar (Δχ = 1.94), yet BF₃ has zero lone pairs on Boron and adopts a symmetric trigonal planar geometry (120°). Three equal coplanar vectors separated by 120° sum to zero (cos 60° + cos 60° = 1), making BF₃ nonpolar overall (μ_net = 0 D).',
      };
  }
}

// ============================================================================
// MODEL 73: INTERMOLECULAR FORCES EXPLORER
// ============================================================================
export type ImfForceType = 'london_dispersion' | 'dipole_dipole' | 'hydrogen_bonding';
export type ImfInteractionId =
  | 'hydrogen_bonding_h2o'
  | 'dipole_dipole_hcl'
  | 'dispersion_ar2'
  | 'dispersion_i2';

export interface IntermolecularForcesMetrics {
  interactionId: ImfInteractionId;
  interactionType: ImfForceType;
  interactionTitle: string;
  primaryForceName: string;
  molecularSystemName: string;
  systemTitle: string;
  moleculeFormula: string;
  separationDistanceAngstrom: number;
  separationAngstrom: number;
  equilibriumDistanceAngstrom: number;
  equilibriumSeparationAngstrom: number;
  relativeOrientationDeg: number;
  thermalTemperatureK: number;
  alignmentFactor: number; // +1 optimal attraction, 0 orthogonal, -1 repulsive alignment
  interactionPotentialKjMol: number; // Qualitative/model Lennard-Jones + electrostatic energy in kJ/mol
  potentialEnergyKjMol: number;
  attractionStatus: 'Strong Attraction' | 'Weak Attraction' | 'Repulsive Overlap / Anti-Aligned';
  polarizabilityVolumeAngstrom3: number;
  typicalStrengthRangeKjMol: string;
  intramolecularCovalentBondKjMol: number;
  normalBoilingPointKelvin: number;
  normalBoilingPointCelsius: number;
  normalBoilingPointC: number;
  roomTempPhase: 'Gas at 25°C' | 'Liquid at 25°C' | 'Solid at 25°C';
  comparisonSystemLabel: string;
  alwaysPresentLondonNote: string;
  orientationDependenceNote: string;
}

export function calculateIntermolecularForcesMetrics(params: {
  interactionType?: string;
  molecularExample?: string;
  separationAngstrom?: number;
  separationDistanceAngstrom?: number;
  relativeOrientationDeg?: number;
  thermalMotionLevel?: number;
  showComparisonSystem?: boolean | number;
}): IntermolecularForcesMetrics {
  const rawType = String(params.interactionType || 'hydrogen_bonding_h2o').toLowerCase();
  const rawExample = String(params.molecularExample || 'auto').toLowerCase();

  let interactionId: ImfInteractionId = 'hydrogen_bonding_h2o';
  let forceType: ImfForceType = 'hydrogen_bonding';

  if (
    rawType === 'dispersion_ar2' ||
    rawType === 'london_dispersion' ||
    rawExample === 'ar_dimer' ||
    rawExample === 'ch4_dimer'
  ) {
    interactionId = 'dispersion_ar2';
    forceType = 'london_dispersion';
  } else if (rawType === 'dispersion_i2') {
    interactionId = 'dispersion_i2';
    forceType = 'london_dispersion';
  } else if (rawType === 'dipole_dipole_hcl' || rawType === 'dipole_dipole' || rawExample === 'hcl_dimer') {
    interactionId = 'dipole_dipole_hcl';
    forceType = 'dipole_dipole';
  } else {
    interactionId = 'hydrogen_bonding_h2o';
    forceType = 'hydrogen_bonding';
  }

  const r = Math.max(
    2.2,
    Math.min(6.5, Number(params.separationAngstrom ?? params.separationDistanceAngstrom ?? 2.9))
  );
  const orientDeg = Math.max(0, Math.min(180, Number(params.relativeOrientationDeg ?? 0)));
  const thermalK = Math.max(50, Math.min(500, Number(params.thermalMotionLevel ?? 298)));
  const orientRad = (orientDeg * Math.PI) / 180;

  let interactionTitle = 'Hydrogen Bonding + Dispersion (H₂O ⋯ H₂O)';
  let molecularSystemName = 'Water Dimer (H₂O ⋯ H–O–H)';
  let moleculeFormula = 'H₂O';
  let rEq = 2.9; // O...O distance in A
  let epsilonWellKjMol = 21.0; // ~21 kJ/mol H-bond depth
  let polarizabilityA3 = 1.45;
  let typicalRange = '10 – 40 kJ/mol (H₂O ≈ 21 kJ/mol)';
  let covalentBondKj = 464; // O-H covalent bond
  let bpK = 373.15;
  let bpC = 100.0;
  let phase: 'Gas at 25°C' | 'Liquid at 25°C' | 'Solid at 25°C' = 'Liquid at 25°C';
  let alignmentFactor = Math.cos(orientRad);
  let compLabel = 'H₂O (H-Bonding, BP +100.0°C) vs HCl (Dipole–Dipole, BP −85.1°C) vs Ar (Dispersion, BP −185.8°C)';
  let orientNote =
    'Strongly directional: Maximum attraction occurs when the O–H(δ⁺) donor points linearly (0° misalignment) toward the lone pair on the acceptor Oxygen(δ⁻). Rotating to 180° brings δ⁻ against δ⁻, causing electrostatic repulsion.';

  if (interactionId === 'dispersion_ar2') {
    interactionTitle = 'London Dispersion Forces Only (Instantaneous–Induced Dipole)';
    molecularSystemName = rawExample === 'ch4_dimer' ? 'Methane Pair (CH₄ ⋯ CH₄)' : 'Argon Pair (Ar ⋯ Ar Nonpolar)';
    moleculeFormula = rawExample === 'ch4_dimer' ? 'CH₄' : 'Ar';
    rEq = 3.75;
    epsilonWellKjMol = rawExample === 'ch4_dimer' ? 2.4 : 1.2;
    polarizabilityA3 = 1.64;
    typicalRange = '0.5 – 15 kJ/mol (Scales with polarizability α & electron count)';
    covalentBondKj = rawExample === 'ch4_dimer' ? 413 : 0;
    bpK = rawExample === 'ch4_dimer' ? 111.6 : 87.3;
    bpC = +(bpK - 273.15).toFixed(1);
    phase = 'Gas at 25°C';
    alignmentFactor = 1.0;
    compLabel = 'Ar (18 e⁻, α = 1.64 Å³, BP −185.8°C) vs I₂ (106 e⁻, α = 10.2 Å³, BP +184.3°C)';
    orientNote =
      'Present between ALL atoms and molecules. Arises from correlated quantum fluctuations of electron clouds creating an instantaneous dipole that induces a matching dipole in a neighbour (V_disp ∝ −α²/r⁶).';
  } else if (interactionId === 'dispersion_i2') {
    interactionTitle = 'Strong London Dispersion in Large Polarizable Dimer (I₂ ⋯ I₂)';
    molecularSystemName = 'Iodine Dimer (I₂ ⋯ I₂ — 106 Electrons)';
    moleculeFormula = 'I₂';
    rEq = 4.2;
    epsilonWellKjMol = 14.5;
    polarizabilityA3 = 10.2;
    typicalRange = '10 – 25 kJ/mol in large, highly polarizable molecules';
    covalentBondKj = 151; // I-I covalent bond
    bpK = 457.5;
    bpC = 184.3;
    phase = 'Solid at 25°C';
    alignmentFactor = 0.85 + 0.15 * Math.cos(orientRad);
    compLabel = 'Nonpolar I₂ (α = 10.2 Å³, BP +184.3°C) boils 269°C HIGHER than polar HCl (α = 2.63 Å³, BP −85.1°C)!';
    orientNote =
      'Proof that one IMF type is not always strongest: Nonpolar I₂ has a much larger electron cloud (106 e⁻, α = 10.2 Å³) than polar HCl (18 e⁻), giving I₂ stronger total intermolecular attraction and a +184.3°C boiling point.';
  } else if (interactionId === 'dipole_dipole_hcl') {
    interactionTitle = 'Permanent Dipole–Dipole + Dispersion (HCl ⋯ HCl)';
    molecularSystemName = 'Hydrogen Chloride Pair (H^δ+–Cl^δ− ⋯ H^δ+–Cl^δ−)';
    moleculeFormula = 'HCl';
    rEq = 3.6;
    epsilonWellKjMol = 5.8;
    polarizabilityA3 = 2.63;
    typicalRange = '3 – 15 kJ/mol (Depends on dipole moment μ & orientation)';
    covalentBondKj = 431; // H-Cl covalent bond
    bpK = 188.1;
    bpC = -85.1;
    phase = 'Gas at 25°C';
    alignmentFactor = Math.cos(orientRad);
    compLabel = 'HCl (Dipole–Dipole μ = 1.08 D, BP −85.1°C) vs H₂O (Hydrogen Bonding, BP +100.0°C)';
    orientNote =
      'Orientation-dependent: Head-to-tail alignment (0°, Cl^δ− facing H^δ+) maximizes attraction, whereas anti-parallel head-to-head alignment (180°, Cl^δ− facing Cl^δ−) produces electrostatic repulsion.';
  }

  // Model Lennard-Jones 12-6 + orientation-modulated electrostatic term:
  const sigma = rEq / Math.pow(2, 1 / 6);
  const sr6 = Math.pow(sigma / r, 6);
  const sr12 = sr6 * sr6;

  const effectiveAttractionWeight =
    forceType === 'london_dispersion' ? 1.0 : 0.25 + 0.75 * alignmentFactor;
  const rawV = 4 * epsilonWellKjMol * (sr12 - effectiveAttractionWeight * sr6);
  const clampedV = +Math.max(-epsilonWellKjMol * 1.1, Math.min(45, rawV)).toFixed(2);

  const attractionStatus: 'Strong Attraction' | 'Weak Attraction' | 'Repulsive Overlap / Anti-Aligned' =
    clampedV < -1.5
      ? 'Strong Attraction'
      : clampedV < 0
      ? 'Weak Attraction'
      : 'Repulsive Overlap / Anti-Aligned';

  return {
    interactionId,
    interactionType: forceType,
    interactionTitle,
    primaryForceName: interactionTitle,
    molecularSystemName,
    systemTitle: molecularSystemName,
    moleculeFormula,
    separationDistanceAngstrom: +r.toFixed(2),
    separationAngstrom: +r.toFixed(2),
    equilibriumDistanceAngstrom: rEq,
    equilibriumSeparationAngstrom: rEq,
    relativeOrientationDeg: orientDeg,
    thermalTemperatureK: thermalK,
    alignmentFactor: +alignmentFactor.toFixed(2),
    interactionPotentialKjMol: clampedV,
    potentialEnergyKjMol: clampedV,
    attractionStatus,
    polarizabilityVolumeAngstrom3: polarizabilityA3,
    typicalStrengthRangeKjMol: typicalRange,
    intramolecularCovalentBondKjMol: covalentBondKj,
    normalBoilingPointKelvin: bpK,
    normalBoilingPointCelsius: bpC,
    normalBoilingPointC: bpC,
    roomTempPhase: phase,
    comparisonSystemLabel: compLabel,
    alwaysPresentLondonNote:
      'London dispersion forces act between ALL molecules (including HCl and H₂O), while dipole–dipole and hydrogen bonding are additional electrostatic attractions.',
    orientationDependenceNote: orientNote,
  };
}

// ============================================================================
// MODEL 74: ELECTROCHEMICAL CELL SIMULATOR (GALVANIC / VOLTAIC CELL)
// ============================================================================
export type GalvanicCellPairId = 'zn_cu' | 'cu_ag' | 'fe_cu' | 'zn_ag' | 'mg_cu';

export interface ElectrochemicalCellMetrics {
  cellPairId: GalvanicCellPairId;
  cellTitle: string;
  cellNotation: string;
  anodeMetal: string;
  anodeIon: string;
  anodeStandardPotentialV: number; // E°_anode (reduction potential)
  cathodeMetal: string;
  cathodeIon: string;
  cathodeStandardPotentialV: number; // E°_cathode (reduction potential)
  standardCellPotentialV: number; // E°_cell = E°_cathode - E°_anode
  electronsTransferredN: number;
  anodeConcentrationM: number;
  cathodeConcentrationM: number;
  temperatureKelvin: number;
  reactionQuotientQ: number;
  liveNernstPotentialV: number; // E_cell = E°_cell - (RT / nF) ln Q
  gibbsFreeEnergyKjMol: number; // ΔG = -n F E_cell
  anodeHalfReaction: string;
  cathodeHalfReaction: string;
  overallRedoxReaction: string;
  electronFlowDirection: string;
  saltBridgeIonMigration: string;
  isSpontaneous: boolean;
}

export function calculateElectrochemicalCellMetrics(params: {
  cellPair?: string;
  anodeConcentrationM?: number;
  cathodeConcentrationM?: number;
  temperatureKelvin?: number;
  temperatureCelsius?: number;
}): ElectrochemicalCellMetrics {
  const rawPair = String(params.cellPair || 'zn_cu').toLowerCase();
  const validPairs: GalvanicCellPairId[] = ['zn_cu', 'cu_ag', 'fe_cu', 'zn_ag', 'mg_cu'];
  const pairId: GalvanicCellPairId = validPairs.includes(rawPair as GalvanicCellPairId)
    ? (rawPair as GalvanicCellPairId)
    : 'zn_cu';

  const cAnode = Math.max(0.01, Math.min(2.0, Number(params.anodeConcentrationM ?? 1.0)));
  const cCathode = Math.max(0.01, Math.min(2.0, Number(params.cathodeConcentrationM ?? 1.0)));
  const tempK =
    params.temperatureKelvin !== undefined
      ? Math.max(273, Math.min(353, Number(params.temperatureKelvin)))
      : +(Math.max(0, Math.min(80, Number(params.temperatureCelsius ?? 25))) + 273.15).toFixed(2);

  let cellTitle = 'Daniell Galvanic Cell (Zn–Cu)';
  let cellNotation = 'Zn(s) | Zn²⁺(aq) || Cu²⁺(aq) | Cu(s)';
  let anodeMetal = 'Zn';
  let anodeIon = 'Zn²⁺';
  let eAnode = -0.76; // V vs SHE
  let cathodeMetal = 'Cu';
  let cathodeIon = 'Cu²⁺';
  let eCathode = +0.34; // V vs SHE
  let n = 2;
  let anodeHalfReaction = 'Zn(s) → Zn²⁺(aq) + 2e⁻';
  let cathodeHalfReaction = 'Cu²⁺(aq) + 2e⁻ → Cu(s)';
  let overallRedoxReaction = 'Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s)';
  let Q = cAnode / cCathode;

  if (pairId === 'cu_ag') {
    cellTitle = 'Copper–Silver Galvanic Cell (Cu–Ag)';
    cellNotation = 'Cu(s) | Cu²⁺(aq) || Ag⁺(aq) | Ag(s)';
    anodeMetal = 'Cu';
    anodeIon = 'Cu²⁺';
    eAnode = +0.34;
    cathodeMetal = 'Ag';
    cathodeIon = 'Ag⁺';
    eCathode = +0.80;
    n = 2;
    anodeHalfReaction = 'Cu(s) → Cu²⁺(aq) + 2e⁻';
    cathodeHalfReaction = '2Ag⁺(aq) + 2e⁻ → 2Ag(s)';
    overallRedoxReaction = 'Cu(s) + 2Ag⁺(aq) → Cu²⁺(aq) + 2Ag(s)';
    Q = cAnode / (cCathode * cCathode);
  } else if (pairId === 'zn_ag') {
    cellTitle = 'Zinc–Silver Galvanic Cell (Zn–Ag)';
    cellNotation = 'Zn(s) | Zn²⁺(aq) || Ag⁺(aq) | Ag(s)';
    anodeMetal = 'Zn';
    anodeIon = 'Zn²⁺';
    eAnode = -0.76;
    cathodeMetal = 'Ag';
    cathodeIon = 'Ag⁺';
    eCathode = +0.80;
    n = 2;
    anodeHalfReaction = 'Zn(s) → Zn²⁺(aq) + 2e⁻';
    cathodeHalfReaction = '2Ag⁺(aq) + 2e⁻ → 2Ag(s)';
    overallRedoxReaction = 'Zn(s) + 2Ag⁺(aq) → Zn²⁺(aq) + 2Ag(s)';
    Q = cAnode / (cCathode * cCathode);
  } else if (pairId === 'mg_cu') {
    cellTitle = 'Magnesium–Copper Galvanic Cell (Mg–Cu)';
    cellNotation = 'Mg(s) | Mg²⁺(aq) || Cu²⁺(aq) | Cu(s)';
    anodeMetal = 'Mg';
    anodeIon = 'Mg²⁺';
    eAnode = -2.37;
    cathodeMetal = 'Cu';
    cathodeIon = 'Cu²⁺';
    eCathode = +0.34;
    n = 2;
    anodeHalfReaction = 'Mg(s) → Mg²⁺(aq) + 2e⁻';
    cathodeHalfReaction = 'Cu²⁺(aq) + 2e⁻ → Cu(s)';
    overallRedoxReaction = 'Mg(s) + Cu²⁺(aq) → Mg²⁺(aq) + Cu(s)';
    Q = cAnode / cCathode;
  } else if (pairId === 'fe_cu') {
    cellTitle = 'Iron(II)–Copper Galvanic Cell (Fe–Cu)';
    cellNotation = 'Fe(s) | Fe²⁺(aq) || Cu²⁺(aq) | Cu(s)';
    anodeMetal = 'Fe';
    anodeIon = 'Fe²⁺';
    eAnode = -0.44;
    cathodeMetal = 'Cu';
    cathodeIon = 'Cu²⁺';
    eCathode = +0.34;
    n = 2;
    anodeHalfReaction = 'Fe(s) → Fe²⁺(aq) + 2e⁻';
    cathodeHalfReaction = 'Cu²⁺(aq) + 2e⁻ → Cu(s)';
    overallRedoxReaction = 'Fe(s) + Cu²⁺(aq) → Fe²⁺(aq) + Cu(s)';
    Q = cAnode / cCathode;
  }

  const eStd = +(eCathode - eAnode).toFixed(2);
  const nernstShift = ((GAS_CONSTANT_J_MOL_K * tempK) / (n * FARADAY_CONSTANT_C_MOL)) * Math.log(Q);
  const eLive = +(eStd - nernstShift).toFixed(3);
  const deltaG = +((-n * FARADAY_CONSTANT_C_MOL * eLive) / 1000).toFixed(1);

  return {
    cellPairId: pairId,
    cellTitle,
    cellNotation,
    anodeMetal,
    anodeIon,
    anodeStandardPotentialV: eAnode,
    cathodeMetal,
    cathodeIon,
    cathodeStandardPotentialV: eCathode,
    standardCellPotentialV: eStd,
    electronsTransferredN: n,
    anodeConcentrationM: +cAnode.toFixed(2),
    cathodeConcentrationM: +cCathode.toFixed(2),
    temperatureKelvin: tempK,
    reactionQuotientQ: +Q.toFixed(4),
    liveNernstPotentialV: eLive,
    gibbsFreeEnergyKjMol: deltaG,
    anodeHalfReaction,
    cathodeHalfReaction,
    overallRedoxReaction,
    electronFlowDirection: `External Wire: ${anodeMetal} Anode (−) ➔ Voltmeter ➔ ${cathodeMetal} Cathode (+)`,
    saltBridgeIonMigration: `Salt Bridge (KNO₃): NO₃⁻ anions migrate to ${anodeMetal} Anode half-cell; K⁺ cations migrate to ${cathodeMetal} Cathode half-cell`,
    isSpontaneous: eLive > 0,
  };
}

export const calculateGalvanicCellMetrics = calculateElectrochemicalCellMetrics;

// ============================================================================
// MODEL 75: ELECTROLYSIS EXPLORER & FARADAY'S LAWS CALCULATOR
// ============================================================================
export type ElectrolysisExperimentId = 'molten_nacl' | 'water_electrolysis' | 'aqueous_cuso4';

export interface ElectrolysisMetrics {
  experimentId: ElectrolysisExperimentId;
  experimentTitle: string;
  electrolyteDescription: string;
  electrodeMaterial: string;
  currentAmps: number; // I in A
  durationSeconds: number; // t in s
  totalChargeCoulombs: number; // Q = I * t
  molesOfElectrons: number; // n_e = Q / F
  minimumVoltageRequiredV: number;
  cathodePolarity: 'Negative (−) Terminal of DC Supply (Reduction)';
  anodePolarity: 'Positive (+) Terminal of DC Supply (Oxidation)';
  cathodeHalfReaction: string;
  anodeHalfReaction: string;
  overallReaction: string;
  mobileCationFormula: string;
  mobileAnionFormula: string;
  cathodeProductName: string;
  cathodeProductMolarMassG: number;
  cathodeElectronStoichiometryZ: number;
  cathodeTheoreticalMassG: number; // m = (M * I * t) / (z * F)
  cathodeGasVolumeMlStp: number; // 0 if solid/liquid metal
  anodeProductName: string;
  anodeProductMolarMassG: number;
  anodeElectronStoichiometryZ: number;
  anodeTheoreticalMassG: number; // m = (M * I * t) / (z * F)
  anodeGasVolumeMlStp: number;
  scientificNote: string;
}

export function calculateElectrolysisMetrics(params: {
  experimentType?: string;
  currentAmps?: number;
  durationSeconds?: number;
}): ElectrolysisMetrics {
  const rawExp = String(params.experimentType || 'molten_nacl').toLowerCase();
  const validExps: ElectrolysisExperimentId[] = ['molten_nacl', 'water_electrolysis', 'aqueous_cuso4'];
  const expId: ElectrolysisExperimentId = validExps.includes(rawExp as ElectrolysisExperimentId)
    ? (rawExp as ElectrolysisExperimentId)
    : 'molten_nacl';

  const I = Math.max(0.5, Math.min(50, Number(params.currentAmps ?? 10.0)));
  const t = Math.max(10, Math.min(3600, Number(params.durationSeconds ?? 600)));

  const Q = +(I * t).toFixed(1);
  const molesElectrons = Q / FARADAY_CONSTANT_C_MOL;

  let experimentTitle = 'Experiment A: Electrolysis of Molten Sodium Chloride — NaCl(l)';
  let electrolyteDescription = 'Anhydrous Molten NaCl(l) at ~801°C (No water present; only mobile Na⁺ and Cl⁻ ions)';
  let electrodeMaterial = 'Inert Graphite / Iron Electrodes (Downs Cell)';
  let minVoltageV = 4.07;
  let cathodeHalfReaction = 'Na⁺ + e⁻ → Na';
  let anodeHalfReaction = '2Cl⁻ → Cl₂ + 2e⁻';
  let overallReaction = '2NaCl(l) → 2Na(l) + Cl₂(g)';
  let mobileCation = 'Na⁺(l)';
  let mobileAnion = 'Cl⁻(l)';

  // Cathode product: Na(l), M = 22.990 g/mol, z = 1 e- per Na
  let catName = 'Liquid Sodium Metal — Na(l)';
  let catM = 22.99;
  let catZ = 1;
  let catIsGas = false;

  // Anode product: Cl2(g), M = 70.906 g/mol, z = 2 e- per Cl2
  let anName = 'Chlorine Gas — Cl₂(g)';
  let anM = 70.906;
  let anZ = 2;
  let anIsGas = true;

  let scientificNote =
    'Crucial Distinction: This experiment uses MOLTEN NaCl(l) without water, so Na⁺ is reduced to metallic Na(l) at the cathode. In aqueous NaCl(aq), water would be reduced instead to H₂(g) + OH⁻ because E°(H₂O/H₂) > E°(Na⁺/Na).';

  if (expId === 'water_electrolysis') {
    experimentTitle = 'Experiment B: Electrolysis of Acidified Water — H₂O(l) (Dilute H₂SO₄)';
    electrolyteDescription = 'Liquid Water H₂O(l) acidified with dilute H₂SO₄(aq) to provide mobile H⁺ and SO₄²⁻ ions';
    electrodeMaterial = 'Inert Platinum (Pt) Electrodes (Hofmann Voltameter)';
    minVoltageV = 1.23;
    cathodeHalfReaction = '2H⁺(aq) + 2e⁻ → H₂(g)';
    anodeHalfReaction = '2H₂O(l) → O₂(g) + 4H⁺(aq) + 4e⁻';
    overallReaction = '2H₂O(l) → 2H₂(g) + O₂(g)';
    mobileCation = 'H⁺(aq)';
    mobileAnion = 'SO₄²⁻(aq)';

    // Cathode product: H2(g), M = 2.016 g/mol, z = 2 e- per H2
    catName = 'Hydrogen Gas — H₂(g)';
    catM = 2.016;
    catZ = 2;
    catIsGas = true;

    // Anode product: O2(g), M = 32.00 g/mol, z = 4 e- per O2
    anName = 'Oxygen Gas — O₂(g)';
    anM = 32.0;
    anZ = 4;
    anIsGas = true;

    scientificNote =
      'Stoichiometric 2:1 Gas Ratio: Because H₂ requires z = 2 electrons per molecule while O₂ requires z = 4 electrons per molecule, the same charge Q = It produces exactly twice the molar volume of H₂(g) at the negative cathode as O₂(g) at the positive anode.';
  } else if (expId === 'aqueous_cuso4') {
    experimentTitle = 'Experiment C: Electrolysis of Aqueous Copper(II) Sulfate — CuSO₄(aq)';
    electrolyteDescription = 'Blue Aqueous CuSO₄(aq) with Inert Carbon/Platinum Electrodes';
    electrodeMaterial = 'Inert Platinum / Graphite Electrodes';
    minVoltageV = 0.89;
    cathodeHalfReaction = 'Cu²⁺(aq) + 2e⁻ → Cu(s)';
    anodeHalfReaction = '2H₂O(l) → O₂(g) + 4H⁺(aq) + 4e⁻';
    overallReaction = '2Cu²⁺(aq) + 2H₂O(l) → 2Cu(s) + O₂(g) + 4H⁺(aq)';
    mobileCation = 'Cu²⁺(aq)';
    mobileAnion = 'SO₄²⁻(aq)';

    // Cathode product: Cu(s), M = 63.546 g/mol, z = 2 e- per Cu
    catName = 'Solid Copper Metal Plating — Cu(s)';
    catM = 63.546;
    catZ = 2;
    catIsGas = false;

    // Anode product: O2(g), M = 32.00 g/mol, z = 4 e- per O2
    anName = 'Oxygen Gas — O₂(g)';
    anM = 32.0;
    anZ = 4;
    anIsGas = true;

    scientificNote =
      'Selective Discharge: At the cathode, Cu²⁺ (E° = +0.34 V) is reduced in preference to H⁺/H₂O, plating reddish-brown Cu(s). At the inert anode, H₂O is oxidized to O₂(g) rather than SO₄²⁻.';
  }

  // Faraday's First & Second Laws: m = (M * I * t) / (z * F)
  const catMoles = molesElectrons / catZ;
  const catMassG = +(catMoles * catM).toFixed(4);
  const catGasVolMl = catIsGas ? +(catMoles * 22414).toFixed(1) : 0;

  const anMoles = molesElectrons / anZ;
  const anMassG = +(anMoles * anM).toFixed(4);
  const anGasVolMl = anIsGas ? +(anMoles * 22414).toFixed(1) : 0;

  return {
    experimentId: expId,
    experimentTitle,
    electrolyteDescription,
    electrodeMaterial,
    currentAmps: +I.toFixed(1),
    durationSeconds: Math.round(t),
    totalChargeCoulombs: Q,
    molesOfElectrons: +molesElectrons.toFixed(4),
    minimumVoltageRequiredV: minVoltageV,
    cathodePolarity: 'Negative (−) Terminal of DC Supply (Reduction)',
    anodePolarity: 'Positive (+) Terminal of DC Supply (Oxidation)',
    cathodeHalfReaction,
    anodeHalfReaction,
    overallReaction,
    mobileCationFormula: mobileCation,
    mobileAnionFormula: mobileAnion,
    cathodeProductName: catName,
    cathodeProductMolarMassG: catM,
    cathodeElectronStoichiometryZ: catZ,
    cathodeTheoreticalMassG: catMassG,
    cathodeGasVolumeMlStp: catGasVolMl,
    anodeProductName: anName,
    anodeProductMolarMassG: anM,
    anodeElectronStoichiometryZ: anZ,
    anodeTheoreticalMassG: anMassG,
    anodeGasVolumeMlStp: anGasVolMl,
    scientificNote,
  };
}
