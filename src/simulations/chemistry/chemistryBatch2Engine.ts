/**
 * TECH-ANATOMIX: DISSECT YOUR CELL! — CHEMISTRY BATCH 2 SIMULATION ENGINE (MODELS 76–82)
 *
 * Deterministic, scientifically validated calculations and state models for:
 * - Model 76: Chemical Kinetics Simulator ('chemical-kinetics-simulator')
 * - Model 77: Chemical Equilibrium Explorer ('chemical-equilibrium-explorer')
 * - Model 78: Reaction Energy Profile Explorer ('reaction-energy-profile-explorer')
 * - Model 79: Catalysis Explorer ('catalysis-explorer')
 * - Model 80: Acid–Base Titration Laboratory ('acid-base-titration-laboratory')
 * - Model 81: Solubility and Precipitation Explorer ('solubility-precipitation-explorer')
 * - Model 82: Buffer Solution Simulator ('buffer-solution-simulator')
 */

export const GAS_CONSTANT_R_J_MOL_K = 8.314462618; // J/(mol·K)
export const GAS_CONSTANT_R_L_ATM_MOL_K = 0.082057366; // L·atm/(mol·K)
export const KW_25C = 1.0e-14;

// ============================================================================
// MODEL 76: CHEMICAL KINETICS SIMULATOR
// ============================================================================
export type KineticsReactionModelType =
  | 'first_order_decomp'
  | 'second_order_dimer'
  | 'reversible_first_order';

export interface KineticsCurvePoint {
  timeSec: number;
  reactantConcM: number;
  productConcM: number;
  instantaneousRateMS: number;
}

export interface ChemicalKineticsMetrics {
  reactionModel: KineticsReactionModelType;
  reactionTitle: string;
  balancedEquation: string;
  rateLawExpression: string;
  integratedRateLawExpression: string;
  orderOriginStatement: string;
  reactionOrder: number;
  rateConstantUnits: string;
  initialConcentrationM: number;
  temperatureC: number;
  temperatureK: number;
  catalystActive: boolean;
  preExponentialFactorA: number;
  uncatalysedActivationEnergyKjMol: number;
  catalysedActivationEnergyKjMol: number;
  activeActivationEnergyKjMol: number;
  rateConstantK: number;
  reverseRateConstantKr: number;
  initialReactionRateMS: number;
  elapsedScientificTimeSec: number;
  currentReactantConcM: number;
  currentProductConcM: number;
  currentReactionRateMS: number;
  halfLifeSec: number;
  halfLifeFormula: string;
  conversionFractionPct: number;
  simulationSpeedMultiplier: number;
  curvePoints: KineticsCurvePoint[];
  microMacroDisclaimer: string;
}

export function calculateChemicalKineticsMetrics(params: {
  reactionModel?: string;
  initialConcentrationM?: number;
  temperatureC?: number;
  catalystActive?: boolean | number;
  elapsedScientificTimeSec?: number;
  simulationSpeedMultiplier?: number;
}): ChemicalKineticsMetrics {
  const rawModel = String(params.reactionModel || 'first_order_decomp');
  const validModels: KineticsReactionModelType[] = [
    'first_order_decomp',
    'second_order_dimer',
    'reversible_first_order',
  ];
  const reactionModel: KineticsReactionModelType = validModels.includes(rawModel as KineticsReactionModelType)
    ? (rawModel as KineticsReactionModelType)
    : 'first_order_decomp';

  const conc0 = Math.max(0.1, Math.min(2.5, Number(params.initialConcentrationM ?? 1.0)));
  const tempC = Math.max(0, Math.min(100, Number(params.temperatureC ?? 25)));
  const tempK = +(tempC + 273.15).toFixed(2);
  const catalystActive = Boolean(params.catalystActive === true || params.catalystActive === 1);
  const simSpeed = Math.max(0.25, Math.min(3.0, Number(params.simulationSpeedMultiplier ?? 1.0)));
  const tEval = Math.max(0, Math.min(120, Number(params.elapsedScientificTimeSec ?? 20)));

  // Calibrated Arrhenius parameters so k at 298.15 K (~25°C) is around 0.035 - 0.060 in educational lab time (0–100 s)
  let reactionTitle = 'First-Order Decomposition: A(aq) → P(aq)';
  let balancedEquation = 'A(aq) → P(aq)  [e.g., N₂O₅ Decomposition Model]';
  let rateLawExpression = 'r = k[A]¹';
  let integratedRateLawExpression = '[A]_t = [A]₀ · e^(−kt)';
  let orderOriginStatement =
    'Reaction order m = 1 is an experimentally established kinetic input (cannot be inferred solely from stoichiometric coefficients).';
  let reactionOrder = 1;
  let rateConstantUnits = 's⁻¹';
  let EaUncatKj = 48.0;
  let EaCatKj = 40.5;
  let kRef298 = 0.035; // s^-1 at 298.15 K uncatalysed

  if (reactionModel === 'second_order_dimer') {
    reactionTitle = 'Second-Order Single-Reactant Reaction: 2A(g) → P(g)';
    balancedEquation = '2A(g) → P(g)  [e.g., 2NO₂ → 2NO + O₂ Rate Model]';
    rateLawExpression = 'r = k[A]²';
    integratedRateLawExpression = '1/[A]_t = 1/[A]₀ + kt';
    orderOriginStatement =
      'Second-order dependence (m = 2) is determined experimentally from initial-rate or integrated 1/[A] vs t linearity, not assumed from stoichiometry.';
    reactionOrder = 2;
    rateConstantUnits = 'L·mol⁻¹·s⁻¹ (M⁻¹·s⁻¹)';
    EaUncatKj = 52.0;
    EaCatKj = 43.8;
    kRef298 = 0.042; // M^-1 s^-1 at 298.15 K
  } else if (reactionModel === 'reversible_first_order') {
    reactionTitle = 'Reversible First-Order Isomerization: A(aq) ⇌ P(aq)';
    balancedEquation = 'A(aq) ⇌ P(aq)  [Opposing First-Order Elementary Steps]';
    rateLawExpression = 'r_net = k_f[A] − k_r[P]';
    integratedRateLawExpression = '[A]_t = [A]_eq + ([A]₀ − [A]_eq)·e^(−(k_f + k_r)t)';
    orderOriginStatement =
      'Explicitly assumed educational reversible first-order relaxation model where forward and reverse pathways are unimolecular.';
    reactionOrder = 1;
    rateConstantUnits = 's⁻¹';
    EaUncatKj = 46.0;
    EaCatKj = 38.5;
    kRef298 = 0.032;
  }

  const activeEaKj = catalystActive ? EaCatKj : EaUncatKj;
  // Compute pre-exponential factor A so that k(298.15 K, uncatalysed) === kRef298
  const Tref = 298.15;
  const A_arr = kRef298 * Math.exp((EaUncatKj * 1000) / (GAS_CONSTANT_R_J_MOL_K * Tref));
  const rawK = A_arr * Math.exp(-(activeEaKj * 1000) / (GAS_CONSTANT_R_J_MOL_K * tempK));
  const k = +Math.max(0.001, Math.min(2.5, rawK)).toFixed(4);
  const kr = reactionModel === 'reversible_first_order' ? +(k * 0.35).toFixed(4) : 0;

  const evalAtTime = (t: number): { a: number; p: number; rate: number } => {
    if (reactionModel === 'first_order_decomp') {
      const a = conc0 * Math.exp(-k * t);
      const p = conc0 - a;
      const rate = k * a;
      return { a, p, rate };
    } else if (reactionModel === 'second_order_dimer') {
      const a = 1 / (1 / conc0 + k * t);
      const p = 0.5 * (conc0 - a); // stoichiometry 2A -> P
      const rate = k * a * a;
      return { a, p, rate };
    } else {
      // Reversible A <=> P: [A]_eq = conc0 * kr / (k + kr)
      const kSum = k + kr;
      const aEq = (conc0 * kr) / kSum;
      const a = aEq + (conc0 - aEq) * Math.exp(-kSum * t);
      const p = conc0 - a;
      const rate = Math.max(0, k * a - kr * p);
      return { a, p, rate };
    }
  };

  const initEval = evalAtTime(0);
  const currEval = evalAtTime(tEval);

  let halfLifeSec = Math.LN2 / k;
  let halfLifeFormula = 't₁/₂ = ln(2) / k (Independent of [A]₀)';
  if (reactionModel === 'second_order_dimer') {
    halfLifeSec = 1 / (k * conc0);
    halfLifeFormula = 't₁/₂ = 1 / (k[A]₀) (Inversely proportional to [A]₀)';
  } else if (reactionModel === 'reversible_first_order') {
    halfLifeSec = Math.LN2 / (k + kr);
    halfLifeFormula = 't₁/₂(relax) = ln(2) / (k_f + k_r)';
  }

  const curvePoints: KineticsCurvePoint[] = [];
  for (let i = 0; i <= 20; i++) {
    const tStep = i * 5; // 0 to 100 s
    const pt = evalAtTime(tStep);
    curvePoints.push({
      timeSec: tStep,
      reactantConcM: +pt.a.toFixed(3),
      productConcM: +pt.p.toFixed(3),
      instantaneousRateMS: +pt.rate.toFixed(4),
    });
  }

  const conversionPct = +(((conc0 - currEval.a) / conc0) * 100).toFixed(1);

  return {
    reactionModel,
    reactionTitle,
    balancedEquation,
    rateLawExpression,
    integratedRateLawExpression,
    orderOriginStatement,
    reactionOrder,
    rateConstantUnits,
    initialConcentrationM: +conc0.toFixed(2),
    temperatureC: +tempC.toFixed(1),
    temperatureK: tempK,
    catalystActive,
    preExponentialFactorA: +A_arr.toExponential(3),
    uncatalysedActivationEnergyKjMol: EaUncatKj,
    catalysedActivationEnergyKjMol: EaCatKj,
    activeActivationEnergyKjMol: activeEaKj,
    rateConstantK: k,
    reverseRateConstantKr: kr,
    initialReactionRateMS: +initEval.rate.toFixed(4),
    elapsedScientificTimeSec: +tEval.toFixed(1),
    currentReactantConcM: +currEval.a.toFixed(3),
    currentProductConcM: +currEval.p.toFixed(3),
    currentReactionRateMS: +currEval.rate.toFixed(4),
    halfLifeSec: +halfLifeSec.toFixed(2),
    halfLifeFormula,
    conversionFractionPct: conversionPct,
    simulationSpeedMultiplier: simSpeed,
    curvePoints,
    microMacroDisclaimer:
      'Macroscopic concentration curves [A]_t are computed directly from the integrated rate law and Arrhenius equation k = A·e^(−Ea/RT); the 3D vessel particles provide an illustrative microscopic representation of collision frequency and conversion.',
  };
}

// ============================================================================
// MODEL 77: CHEMICAL EQUILIBRIUM EXPLORER
// ============================================================================
export type EquilibriumReactionPresetType =
  | 'n2o4_no2_gas'
  | 'h2_i2_hi_gas'
  | 'haber_n2_h2_nh3';

export type EquilibriumDisturbanceType =
  | 'none'
  | 'add_reactant'
  | 'remove_reactant'
  | 'add_product'
  | 'compress_volume'
  | 'expand_volume';

export interface EquilibriumTimePoint {
  timeSec: number;
  reactantAConcM: number;
  reactantBConcM: number;
  productCConcM: number;
}

export interface ChemicalEquilibriumMetrics {
  reactionPreset: EquilibriumReactionPresetType;
  reactionTitle: string;
  balancedEquation: string;
  kcExpression: string;
  kpConversionFormula: string;
  enthalpyDeltaHKjMol: number;
  deltaMolesGas: number;
  volumePressureMeaningful: boolean;
  temperatureC: number;
  temperatureK: number;
  vesselVolumeL: number;
  totalPressureAtm: number;
  disturbanceMode: EquilibriumDisturbanceType;
  catalystPresent: boolean;
  initialReactantAM: number;
  initialReactantBM: number;
  initialProductCM: number;
  reactionQuotientQc: number;
  equilibriumConstantKc: number;
  equilibriumConstantKp: number;
  equilibriumDirection: 'Forward Direction Favoured (Q_c < K_c)' | 'Reverse Direction Favoured (Q_c > K_c)' | 'System at Dynamic Equilibrium (Q_c = K_c)';
  equilibriumReactantAM: number;
  equilibriumReactantBM: number;
  equilibriumProductCM: number;
  forwardRateAtEq: number;
  reverseRateAtEq: number;
  leChatelierExplanation: string;
  catalystExplanation: string;
  timePoints: EquilibriumTimePoint[];
}

export function calculateChemicalEquilibriumMetrics(params: {
  reactionPreset?: string;
  initialReactantAM?: number;
  initialReactantBM?: number;
  initialProductCM?: number;
  temperatureC?: number;
  vesselVolumeL?: number;
  disturbanceMode?: string;
  catalystPresent?: boolean | number;
}): ChemicalEquilibriumMetrics {
  const rawPreset = String(params.reactionPreset || 'n2o4_no2_gas');
  const validPresets: EquilibriumReactionPresetType[] = [
    'n2o4_no2_gas',
    'h2_i2_hi_gas',
    'haber_n2_h2_nh3',
  ];
  const reactionPreset: EquilibriumReactionPresetType = validPresets.includes(rawPreset as EquilibriumReactionPresetType)
    ? (rawPreset as EquilibriumReactionPresetType)
    : 'n2o4_no2_gas';

  const rawDist = String(params.disturbanceMode || 'none');
  const validDists: EquilibriumDisturbanceType[] = [
    'none',
    'add_reactant',
    'remove_reactant',
    'add_product',
    'compress_volume',
    'expand_volume',
  ];
  const disturbanceMode: EquilibriumDisturbanceType = validDists.includes(rawDist as EquilibriumDisturbanceType)
    ? (rawDist as EquilibriumDisturbanceType)
    : 'none';

  const catalystPresent = Boolean(params.catalystPresent === true || params.catalystPresent === 1);
  const tempC = Math.max(0, Math.min(200, Number(params.temperatureC ?? 25)));
  const tempK = +(tempC + 273.15).toFixed(2);
  let volL = Math.max(0.5, Math.min(2.5, Number(params.vesselVolumeL ?? 1.0)));

  if (disturbanceMode === 'compress_volume') {
    volL = +(volL * 0.65).toFixed(2);
  } else if (disturbanceMode === 'expand_volume') {
    volL = +(volL * 1.5).toFixed(2);
  }

  let a0 = Math.max(0.05, Math.min(2.0, Number(params.initialReactantAM ?? 0.8)));
  let b0 = Math.max(0.05, Math.min(2.0, Number(params.initialReactantBM ?? 0.8)));
  let c0 = Math.max(0.0, Math.min(2.0, Number(params.initialProductCM ?? 0.2)));

  // Scale initial concentrations inversely with volume change relative to 1.0 L reference
  const volFactor = 1.0 / volL;
  a0 = +(a0 * volFactor).toFixed(3);
  b0 = +(b0 * volFactor).toFixed(3);
  c0 = +(c0 * volFactor).toFixed(3);

  if (disturbanceMode === 'add_reactant') {
    a0 = +(a0 + 0.45).toFixed(3);
  } else if (disturbanceMode === 'remove_reactant') {
    a0 = +Math.max(0.04, a0 * 0.45).toFixed(3);
  } else if (disturbanceMode === 'add_product') {
    c0 = +(c0 + 0.55).toFixed(3);
  }

  let reactionTitle = 'Dinitrogen Tetroxide Dissociation: N₂O₄(g) ⇌ 2NO₂(g)';
  let balancedEquation = 'N₂O₄(g) ⇌ 2NO₂(g)   (ΔH° = +57.2 kJ/mol)';
  let kcExpression = 'K_c = [NO₂]² / [N₂O₄]';
  let enthalpyDeltaHKjMol = 57.2; // Endothermic
  let deltaMolesGas = 1; // 2 - 1 = +1
  let kcRef298 = 0.36; // Educational gas-phase reference around room/moderate temp

  if (reactionPreset === 'h2_i2_hi_gas') {
    reactionTitle = 'Hydrogen Iodide Synthesis: H₂(g) + I₂(g) ⇌ 2HI(g)';
    balancedEquation = 'H₂(g) + I₂(g) ⇌ 2HI(g)   (ΔH° = −9.4 kJ/mol, Δn_g = 0)';
    kcExpression = 'K_c = [HI]² / ([H₂][I₂])';
    enthalpyDeltaHKjMol = -9.4;
    deltaMolesGas = 0; // Equal moles of gas on both sides!
    kcRef298 = 4.2;
  } else if (reactionPreset === 'haber_n2_h2_nh3') {
    reactionTitle = 'Ammonia Synthesis (Haber Equilibrium): N₂(g) + 3H₂(g) ⇌ 2NH₃(g)';
    balancedEquation = 'N₂(g) + 3H₂(g) ⇌ 2NH₃(g)   (ΔH° = −92.2 kJ/mol, Δn_g = −2)';
    kcExpression = 'K_c = [NH₃]² / ([N₂][H₂]³)';
    enthalpyDeltaHKjMol = -92.2;
    deltaMolesGas = -2; // 2 - 4 = -2
    kcRef298 = 2.8;
  }

  // Temperature dependence via van 't Hoff equation (scaled gently for 0–200°C interactive inspection)
  const Tref = 298.15;
  const effDeltaH = enthalpyDeltaHKjMol * 320; // J/mol scaled for smooth visible shift in 273–473 K window
  const kc = +Math.max(
    0.02,
    Math.min(
      50,
      kcRef298 * Math.exp((-effDeltaH / GAS_CONSTANT_R_J_MOL_K) * (1 / tempK - 1 / Tref))
    )
  ).toFixed(3);

  const kp = +(kc * Math.pow(GAS_CONSTANT_R_L_ATM_MOL_K * tempK, deltaMolesGas)).toFixed(3);
  const kpConversionFormula =
    deltaMolesGas === 0
      ? 'K_p = K_c(RT)^0 = K_c (Since Δn_gas = 0)'
      : `K_p = K_c(RT)^(${deltaMolesGas}) where R = 0.08206 L·atm/(mol·K)`;

  // Compute Q_c and solve exact mass-balance equilibrium extent x
  let qc = 0;
  let aEq = a0;
  let bEq = b0;
  let cEq = c0;

  if (reactionPreset === 'n2o4_no2_gas') {
    // A <=> 2C: [A] = a0 - x, [C] = c0 + 2x
    b0 = 0;
    qc = a0 > 1e-6 ? (c0 * c0) / a0 : 999;
    const xMin = -c0 / 2 + 1e-6;
    const xMax = a0 - 1e-6;
    let lo = xMin;
    let hi = xMax;
    for (let iter = 0; iter < 50; iter++) {
      const mid = 0.5 * (lo + hi);
      const A = a0 - mid;
      const C = c0 + 2 * mid;
      const qMid = (C * C) / Math.max(1e-9, A);
      if (qMid < kc) lo = mid;
      else hi = mid;
    }
    const xEq = 0.5 * (lo + hi);
    aEq = Math.max(0.001, a0 - xEq);
    bEq = 0;
    cEq = Math.max(0.001, c0 + 2 * xEq);
  } else if (reactionPreset === 'h2_i2_hi_gas') {
    // A + B <=> 2C: [A] = a0 - x, [B] = b0 - x, [C] = c0 + 2x
    qc = a0 * b0 > 1e-8 ? (c0 * c0) / (a0 * b0) : 999;
    const xMin = -c0 / 2 + 1e-6;
    const xMax = Math.min(a0, b0) - 1e-6;
    let lo = xMin;
    let hi = xMax;
    for (let iter = 0; iter < 50; iter++) {
      const mid = 0.5 * (lo + hi);
      const A = a0 - mid;
      const B = b0 - mid;
      const C = c0 + 2 * mid;
      const qMid = (C * C) / Math.max(1e-9, A * B);
      if (qMid < kc) lo = mid;
      else hi = mid;
    }
    const xEq = 0.5 * (lo + hi);
    aEq = Math.max(0.001, a0 - xEq);
    bEq = Math.max(0.001, b0 - xEq);
    cEq = Math.max(0.001, c0 + 2 * xEq);
  } else {
    // N2 + 3H2 <=> 2NH3: [A] = a0 - x, [B] = b0 - 3x, [C] = c0 + 2x
    qc = a0 * Math.pow(b0, 3) > 1e-9 ? (c0 * c0) / (a0 * Math.pow(b0, 3)) : 999;
    const xMin = -c0 / 2 + 1e-6;
    const xMax = Math.min(a0, b0 / 3) - 1e-6;
    let lo = xMin;
    let hi = xMax;
    for (let iter = 0; iter < 60; iter++) {
      const mid = 0.5 * (lo + hi);
      const A = a0 - mid;
      const B = b0 - 3 * mid;
      const C = c0 + 2 * mid;
      const qMid = (C * C) / Math.max(1e-12, A * Math.pow(B, 3));
      if (qMid < kc) lo = mid;
      else hi = mid;
    }
    const xEq = 0.5 * (lo + hi);
    aEq = Math.max(0.001, a0 - xEq);
    bEq = Math.max(0.001, b0 - 3 * xEq);
    cEq = Math.max(0.001, c0 + 2 * xEq);
  }

  qc = +qc.toFixed(3);
  aEq = +aEq.toFixed(3);
  bEq = +bEq.toFixed(3);
  cEq = +cEq.toFixed(3);

  let equilibriumDirection: ChemicalEquilibriumMetrics['equilibriumDirection'] =
    'System at Dynamic Equilibrium (Q_c = K_c)';
  if (Math.abs(qc - kc) / Math.max(0.01, kc) > 0.03) {
    equilibriumDirection =
      qc < kc
        ? 'Forward Direction Favoured (Q_c < K_c)'
        : 'Reverse Direction Favoured (Q_c > K_c)';
  }

  const totalMolarity = aEq + bEq + cEq;
  const totalPressureAtm = +(totalMolarity * GAS_CONSTANT_R_L_ATM_MOL_K * tempK).toFixed(2);

  // At dynamic equilibrium, r_forward === r_reverse > 0
  const baseEqRate = +(0.25 * (catalystPresent ? 1.8 : 1.0) * (tempK / 298.15)).toFixed(3);

  let leChatelierExplanation =
    'At dynamic equilibrium, forward and reverse reactions continue at equal rates (r_fwd = r_rev > 0) so macroscopic concentrations remain constant.';
  if (disturbanceMode === 'add_reactant') {
    leChatelierExplanation =
      'Adding reactant decreases Q_c below K_c (Q_c < K_c), driving a net forward shift that consumes part of the added reactant until Q_c = K_c is restored.';
  } else if (disturbanceMode === 'remove_reactant') {
    leChatelierExplanation =
      'Removing reactant increases Q_c above K_c (Q_c > K_c), driving a net reverse shift to replenish reactant until Q_c = K_c.';
  } else if (disturbanceMode === 'add_product') {
    leChatelierExplanation =
      'Adding product increases Q_c above K_c (Q_c > K_c), favouring the reverse reaction until a new equilibrium state with the same K_c is reached.';
  } else if (disturbanceMode === 'compress_volume' || disturbanceMode === 'expand_volume') {
    if (deltaMolesGas === 0) {
      leChatelierExplanation =
        'Because Δn_gas = 0 for H₂(g) + I₂(g) ⇌ 2HI(g), changing vessel volume/pressure scales all concentrations equally and leaves Q_c = K_c unchanged (no equilibrium shift).';
    } else if (disturbanceMode === 'compress_volume') {
      leChatelierExplanation =
        deltaMolesGas > 0
          ? 'Decreasing volume (increasing pressure) shifts equilibrium toward the side with fewer gas moles (reverse direction, N₂O₄) to partially relieve pressure.'
          : 'Decreasing volume (increasing pressure) shifts equilibrium toward the side with fewer gas moles (forward direction, 2NH₃, Δn_gas = −2).';
    } else {
      leChatelierExplanation =
        deltaMolesGas > 0
          ? 'Increasing volume (decreasing pressure) shifts equilibrium toward the side with more gas moles (forward direction, 2NO₂, Δn_gas = +1).'
          : 'Increasing volume (decreasing pressure) shifts equilibrium toward the side with more gas moles (reverse direction, N₂ + 3H₂).';
    }
  }

  const catalystExplanation =
    'A catalyst lowers the activation barrier equally for both forward and reverse pathways, accelerating the approach to equilibrium without changing K_c or the final equilibrium composition.';

  const relaxRate = catalystPresent ? 0.14 : 0.065;
  const timePoints: EquilibriumTimePoint[] = [];
  for (let i = 0; i <= 20; i++) {
    const t = i * 3;
    const decay = Math.exp(-relaxRate * t);
    timePoints.push({
      timeSec: t,
      reactantAConcM: +(aEq + (a0 - aEq) * decay).toFixed(3),
      reactantBConcM: +(bEq + (b0 - bEq) * decay).toFixed(3),
      productCConcM: +(cEq + (c0 - cEq) * decay).toFixed(3),
    });
  }

  return {
    reactionPreset,
    reactionTitle,
    balancedEquation,
    kcExpression,
    kpConversionFormula,
    enthalpyDeltaHKjMol,
    deltaMolesGas,
    volumePressureMeaningful: deltaMolesGas !== 0,
    temperatureC: +tempC.toFixed(1),
    temperatureK: tempK,
    vesselVolumeL: volL,
    totalPressureAtm,
    disturbanceMode,
    catalystPresent,
    initialReactantAM: a0,
    initialReactantBM: b0,
    initialProductCM: c0,
    reactionQuotientQc: qc,
    equilibriumConstantKc: kc,
    equilibriumConstantKp: kp,
    equilibriumDirection,
    equilibriumReactantAM: aEq,
    equilibriumReactantBM: bEq,
    equilibriumProductCM: cEq,
    forwardRateAtEq: baseEqRate,
    reverseRateAtEq: baseEqRate,
    leChatelierExplanation,
    catalystExplanation,
    timePoints,
  };
}

// ============================================================================
// MODEL 78: REACTION ENERGY PROFILE EXPLORER
// ============================================================================
export type EnergyProfilePresetType =
  | 'exothermic_single_step'
  | 'endothermic_single_step'
  | 'multistep_intermediate';

export interface EnergyCoordinatePoint {
  xi: number; // Reaction coordinate 0.0 to 1.0
  energyKjMol: number;
}

export interface ReactionEnergyProfileMetrics {
  profilePreset: EnergyProfilePresetType;
  profileTitle: string;
  thermodynamicClassification: 'Exothermic (ΔH < 0 — Releases Net Heat)' | 'Endothermic (ΔH > 0 — Absorbs Net Heat)' | 'Thermoneutral (ΔH = 0)';
  isMultistep: boolean;
  reactantEnergyKjMol: number;
  productEnergyKjMol: number;
  transitionState1EnergyKjMol: number;
  intermediateEnergyKjMol: number | null;
  transitionState2EnergyKjMol: number | null;
  highestPeakEnergyKjMol: number;
  forwardActivationEnergyKjMol: number;
  reverseActivationEnergyKjMol: number;
  enthalpyChangeDeltaHKjMol: number;
  reactionCoordinateProgress: number;
  currentCoordinateEnergyKjMol: number;
  currentRegionLabel: string;
  rateDeterminingStepLabel: string;
  forwardVsReverseComparison: string;
  illustrativeEnergyNote: string;
  curvePoints: EnergyCoordinatePoint[];
}

export function evaluateEnergyAtCoordinate(
  preset: EnergyProfilePresetType,
  xi: number,
  hReact: number,
  hProd: number,
  hTs1: number,
  hInt: number,
  hTs2: number
): number {
  const u = Math.max(0, Math.min(1, xi));
  if (preset !== 'multistep_intermediate') {
    // Smooth single-barrier profile peaking at xi = 0.50
    const baseline = hReact + (hProd - hReact) * (3 * u * u - 2 * u * u * u);
    const peakBoost = (hTs1 - (0.5 * hReact + 0.5 * hProd)) * Math.pow(Math.sin(Math.PI * u), 2);
    return +(baseline + peakBoost).toFixed(2);
  }
  // Two-step profile:
  // 0.00 -> 0.30: Reactants (hReact) to TS1 (hTs1)
  // 0.30 -> 0.52: TS1 (hTs1) to Intermediate well (hInt)
  // 0.52 -> 0.75: Intermediate (hInt) to TS2 (hTs2)
  // 0.75 -> 1.00: TS2 (hTs2) to Products (hProd)
  const smoothStep = (t: number) => t * t * (3 - 2 * t);
  if (u <= 0.30) {
    const s = smoothStep(u / 0.30);
    return +(hReact + (hTs1 - hReact) * s).toFixed(2);
  } else if (u <= 0.52) {
    const s = smoothStep((u - 0.30) / 0.22);
    return +(hTs1 + (hInt - hTs1) * s).toFixed(2);
  } else if (u <= 0.75) {
    const s = smoothStep((u - 0.52) / 0.23);
    return +(hInt + (hTs2 - hInt) * s).toFixed(2);
  } else {
    const s = smoothStep((u - 0.75) / 0.25);
    return +(hTs2 + (hProd - hTs2) * s).toFixed(2);
  }
}

export function calculateReactionEnergyProfileMetrics(params: {
  profilePreset?: string;
  forwardActivationEnergyKjMol?: number;
  reactantEnergyKjMol?: number;
  productEnergyKjMol?: number;
  reactionCoordinateProgress?: number;
}): ReactionEnergyProfileMetrics {
  const rawPreset = String(params.profilePreset || 'exothermic_single_step');
  const validPresets: EnergyProfilePresetType[] = [
    'exothermic_single_step',
    'endothermic_single_step',
    'multistep_intermediate',
  ];
  const profilePreset: EnergyProfilePresetType = validPresets.includes(rawPreset as EnergyProfilePresetType)
    ? (rawPreset as EnergyProfilePresetType)
    : 'exothermic_single_step';

  const defaultReact = profilePreset === 'endothermic_single_step' ? 20 : 45;
  const defaultProd = profilePreset === 'endothermic_single_step' ? 60 : 15;
  const defaultEaFwd = profilePreset === 'endothermic_single_step' ? 65 : 55;

  const hReact = Math.max(5, Math.min(80, Number(params.reactantEnergyKjMol ?? defaultReact)));
  const hProd = Math.max(5, Math.min(80, Number(params.productEnergyKjMol ?? defaultProd)));
  const rawEaFwd = Math.max(15, Math.min(110, Number(params.forwardActivationEnergyKjMol ?? defaultEaFwd)));

  // Ensure transition state is strictly above both reactant and product levels
  const minPeak = Math.max(hReact, hProd) + 12;
  const hPeak = Math.max(minPeak, hReact + rawEaFwd);
  const actualEaFwd = +(hPeak - hReact).toFixed(1);
  const actualEaRev = +(hPeak - hProd).toFixed(1);
  const deltaH = +(hProd - hReact).toFixed(1);

  const isMultistep = profilePreset === 'multistep_intermediate';
  const hTs1 = hPeak;
  const hInt = isMultistep ? +Math.max(Math.min(hReact, hProd) + 8, hPeak - 28).toFixed(1) : 0;
  const hTs2 = isMultistep ? +Math.max(hProd + 10, hPeak - 8).toFixed(1) : 0;

  const xi = Math.max(0, Math.min(1, Number(params.reactionCoordinateProgress ?? 0.5)));
  const currentE = evaluateEnergyAtCoordinate(profilePreset, xi, hReact, hProd, hTs1, hInt, hTs2);

  let currentRegionLabel = 'Reactant Valley (Initial Covalent Bonds)';
  if (!isMultistep) {
    if (xi > 0.38 && xi < 0.62) {
      currentRegionLabel = 'Transition State [‡] (Activated Complex — Partial Bonds Forming/Breaking)';
    } else if (xi >= 0.62) {
      currentRegionLabel = 'Product Valley (Final Stabilized Products)';
    }
  } else {
    if (xi > 0.22 && xi < 0.38) {
      currentRegionLabel = 'First Transition State [TS₁‡] (Rate-Determining Barrier)';
    } else if (xi >= 0.38 && xi <= 0.62) {
      currentRegionLabel = 'Reaction Intermediate Well [I] (Short-Lived Local Energy Minimum)';
    } else if (xi > 0.62 && xi < 0.84) {
      currentRegionLabel = 'Second Transition State [TS₂‡] (Second Elementary Step Barrier)';
    } else if (xi >= 0.84) {
      currentRegionLabel = 'Product Valley (Final Products)';
    }
  }

  let profileTitle = 'Single-Step Exothermic Reaction Profile (A + B → [AB]‡ → C + D)';
  if (profilePreset === 'endothermic_single_step') {
    profileTitle = 'Single-Step Endothermic Reaction Profile (A + B → [AB]‡ → C + D)';
  } else if (profilePreset === 'multistep_intermediate') {
    profileTitle = 'Two-Step Reaction Profile with Intermediate (R → TS₁‡ → I → TS₂‡ → P)';
  }

  const thermodynamicClassification =
    deltaH < -0.1
      ? 'Exothermic (ΔH < 0 — Releases Net Heat)'
      : deltaH > 0.1
      ? 'Endothermic (ΔH > 0 — Absorbs Net Heat)'
      : 'Thermoneutral (ΔH = 0)';

  const curvePoints: EnergyCoordinatePoint[] = [];
  for (let i = 0; i <= 40; i++) {
    const u = +(i / 40).toFixed(3);
    curvePoints.push({
      xi: u,
      energyKjMol: evaluateEnergyAtCoordinate(profilePreset, u, hReact, hProd, hTs1, hInt, hTs2),
    });
  }

  return {
    profilePreset,
    profileTitle,
    thermodynamicClassification,
    isMultistep,
    reactantEnergyKjMol: +hReact.toFixed(1),
    productEnergyKjMol: +hProd.toFixed(1),
    transitionState1EnergyKjMol: +hTs1.toFixed(1),
    intermediateEnergyKjMol: isMultistep ? hInt : null,
    transitionState2EnergyKjMol: isMultistep ? hTs2 : null,
    highestPeakEnergyKjMol: +hPeak.toFixed(1),
    forwardActivationEnergyKjMol: actualEaFwd,
    reverseActivationEnergyKjMol: actualEaRev,
    enthalpyChangeDeltaHKjMol: deltaH,
    reactionCoordinateProgress: +xi.toFixed(2),
    currentCoordinateEnergyKjMol: currentE,
    currentRegionLabel,
    rateDeterminingStepLabel: isMultistep
      ? 'Step 1 (R → TS₁‡ → I) has the highest energy barrier and acts as the Rate-Determining Step.'
      : 'Single elementary step passing through a single Activated Complex [‡].',
    forwardVsReverseComparison: `E_a(fwd) = ${actualEaFwd} kJ/mol vs E_a(rev) = ${actualEaRev} kJ/mol; exact thermodynamic identity ΔH = E_a(fwd) − E_a(rev) = ${deltaH} kJ/mol.`,
    illustrativeEnergyNote:
      'Illustrative potential enthalpy values (kJ/mol) along a dimensionless reaction coordinate ξ (0 → 1). Note that an exothermic reaction can still have a large activation barrier (slow kinetics), and a reaction coordinate is a minimum-energy pathway rather than a time axis.',
    curvePoints,
  };
}

// ============================================================================
// MODEL 79: CATALYSIS EXPLORER
// ============================================================================
export type CatalystMechanismPresetType =
  | 'heterogeneous_pt_ethene'
  | 'homogeneous_iodide_h2o2'
  | 'enzymatic_carbonic_anhydrase';

export interface CatalysisMetrics {
  catalystPreset: CatalystMechanismPresetType;
  catalystTitle: string;
  catalysisCategory: 'Heterogeneous Surface Catalysis' | 'Homogeneous Aqueous Catalysis' | 'Homogeneous Enzymatic Bio-Catalysis';
  overallReactionEquation: string;
  catalystIdentity: string;
  pathwayActive: 'catalysed' | 'uncatalysed';
  reactionStepIndex: number; // 1 to 4
  reactionStepTitle: string;
  reactionStepDescription: string;
  temperatureK: number;
  reactantEnthalpyKjMol: number;
  productEnthalpyKjMol: number;
  overallDeltaHKjMol: number;
  uncatalysedEaKjMol: number;
  catalysedEaKjMol: number;
  activationEnergyReductionKjMol: number;
  arrheniusRateEnhancementFactor: number;
  equilibriumConstantUnchangedNote: string;
  catalystRegenerationNote: string;
}

export function calculateCatalysisMetrics(params: {
  catalystPreset?: string;
  pathwayMode?: string | boolean | number;
  reactionStepIndex?: number;
  temperatureK?: number;
  catalysedBarrierReductionKjMol?: number;
}): CatalysisMetrics {
  const rawPreset = String(params.catalystPreset || 'heterogeneous_pt_ethene');
  const validPresets: CatalystMechanismPresetType[] = [
    'heterogeneous_pt_ethene',
    'homogeneous_iodide_h2o2',
    'enzymatic_carbonic_anhydrase',
  ];
  const catalystPreset: CatalystMechanismPresetType = validPresets.includes(rawPreset as CatalystMechanismPresetType)
    ? (rawPreset as CatalystMechanismPresetType)
    : 'heterogeneous_pt_ethene';

  const isCatalysed =
    params.pathwayMode === undefined ||
    params.pathwayMode === true ||
    params.pathwayMode === 1 ||
    params.pathwayMode === 'catalysed';

  const stepIdx = Math.max(1, Math.min(4, Math.round(Number(params.reactionStepIndex ?? 2))));
  const tempK = Math.max(273, Math.min(500, Number(params.temperatureK ?? 298.15)));

  let catalystTitle = 'Heterogeneous Catalysis: Ethene Hydrogenation on Pt(111) Surface';
  let catalysisCategory: CatalysisMetrics['catalysisCategory'] = 'Heterogeneous Surface Catalysis';
  let overallReactionEquation = 'C₂H₄(g) + H₂(g) → C₂H₆(g)   (ΔH° = −136 kJ/mol)';
  let catalystIdentity = 'Solid Platinum Pt(111) Crystal Terrace (Active Surface Sites *)';
  let hReact = 50;
  let hProd = 15;
  let eaUncat = 78;
  let defaultReduction = 34;

  const stepsMap: Record<CatalystMechanismPresetType, { title: string; desc: string }[]> = {
    heterogeneous_pt_ethene: [
      {
        title: 'Step 1: Reactant Diffusion & Surface Adsorption',
        desc: 'Gaseous C₂H₄ and H₂ diffuse toward the solid Pt(111) catalyst surface and bind to vacant active metal d-orbital sites (*).',
      },
      {
        title: 'Step 2: Dissociative Chemisorption & Bond Weakening',
        desc: 'The H–H σ bond cleaves on platinum to form surface-bound H* adatoms, while π-backbonding weakens the C=C double bond.',
      },
      {
        title: 'Step 3: Stepwise Surface Hydrogen Transfer (Horiuti–Polanyi)',
        desc: 'Adsorbed H* transfers sequentially to C₂H₄* via a surface ethyl intermediate (C₂H₅*) along a lower-energy multi-step pathway.',
      },
      {
        title: 'Step 4: Product Desorption & Active-Site Regeneration',
        desc: 'Saturated ethane C₂H₆(g) desorbs into the gas phase, leaving clean Pt(*) surface sites regenerated for the next catalytic turnover.',
      },
    ],
    homogeneous_iodide_h2o2: [
      {
        title: 'Step 1: Homogeneous Nucleophilic Attack in Solution',
        desc: 'Dissolved iodide catalyst (I⁻) collides with H₂O₂(aq) in the same aqueous phase to initiate the lower-barrier bimolecular step.',
      },
      {
        title: 'Step 2: Formation of Reaction Intermediate (IO⁻)',
        desc: 'Oxygen transfer yields H₂O(l) and the short-lived hypoiodite intermediate ion IO⁻(aq) (first elementary peak TS₁‡).',
      },
      {
        title: 'Step 3: Second Step — Intermediate Reduction by H₂O₂',
        desc: 'IO⁻(aq) reacts with a second H₂O₂(aq) molecule across TS₂‡ to evolve O₂(g) and a second H₂O(l) molecule.',
      },
      {
        title: 'Step 4: Complete Catalyst Regeneration (I⁻ Restored)',
        desc: 'The iodide ion I⁻(aq) is quantitatively regenerated at the end of Step 2, remaining chemically unconsumed overall.',
      },
    ],
    enzymatic_carbonic_anhydrase: [
      {
        title: 'Step 1: Substrate Binding in Active-Site Pocket',
        desc: 'Dissolved CO₂ enters the carbonic anhydrase active cleft adjacent to the tetrahedral Zn²⁺–OH⁻ prosthetic cofactor.',
      },
      {
        title: 'Step 2: Nucleophilic Attack by Zinc-Bound Hydroxide',
        desc: 'Coordination to Zn²⁺ lowers the pK_a of bound water, enabling Zn–OH⁻ to attack the electrophilic carbon of CO₂ with a low barrier.',
      },
      {
        title: 'Step 3: Bicarbonate Intermediate Stabilization',
        desc: 'Hydrogen-bonding residues (Thr-199) stabilize the Zn²⁺–HCO₃⁻ transition state and intermediate complex.',
      },
      {
        title: 'Step 4: Product Release & Cofactor Regeneration',
        desc: 'HCO₃⁻ is displaced by H₂O and proton shuttle (His-64) restores Zn²⁺–OH⁻ for the next turnover cycle.',
      },
    ],
  };

  if (catalystPreset === 'homogeneous_iodide_h2o2') {
    catalystTitle = 'Homogeneous Catalysis: Iodide-Catalysed H₂O₂ Decomposition';
    catalysisCategory = 'Homogeneous Aqueous Catalysis';
    overallReactionEquation = '2H₂O₂(aq) → 2H₂O(l) + O₂(g)   (via IO⁻(aq) Intermediate)';
    catalystIdentity = 'Aqueous Iodide Ion I⁻(aq) (Same Phase — Forms IO⁻ Intermediate)';
    hReact = 55;
    hProd = 12;
    eaUncat = 75;
    defaultReduction = 28;
  } else if (catalystPreset === 'enzymatic_carbonic_anhydrase') {
    catalystTitle = 'Homogeneous Bio-Catalysis: Carbonic Anhydrase Zn²⁺ Active Site';
    catalysisCategory = 'Homogeneous Enzymatic Bio-Catalysis';
    overallReactionEquation = 'CO₂(aq) + H₂O(l) ⇌ HCO₃⁻(aq) + H⁺(aq)';
    catalystIdentity = 'Zn²⁺–OH⁻ Metalloenzyme Active Site Pocket';
    hReact = 42;
    hProd = 28;
    eaUncat = 82;
    defaultReduction = 42;
  }

  const deltaEa = Math.max(10, Math.min(50, Number(params.catalysedBarrierReductionKjMol ?? defaultReduction)));
  const eaCat = +(eaUncat - deltaEa).toFixed(1);
  const deltaH = +(hProd - hReact).toFixed(1);

  // Quantitative Arrhenius rate ratio k_cat / k_uncat = exp((Ea_uncat - Ea_cat) / (R*T))
  // Using educational scaled exponent or exact Boltzmann factor: exp(deltaEa_J / (R*T))
  // Since deltaEa ~ 30 kJ/mol gives exp(12) ~ 1.6e5, we report the exact Arrhenius ratio exp(ΔEa/(RT))
  const exactRatio = Math.exp((deltaEa * 1000) / (GAS_CONSTANT_R_J_MOL_K * tempK));
  const stepInfo = stepsMap[catalystPreset][stepIdx - 1];

  return {
    catalystPreset,
    catalystTitle,
    catalysisCategory,
    overallReactionEquation,
    catalystIdentity,
    pathwayActive: isCatalysed ? 'catalysed' : 'uncatalysed',
    reactionStepIndex: stepIdx,
    reactionStepTitle: stepInfo.title,
    reactionStepDescription: stepInfo.desc,
    temperatureK: +tempK.toFixed(1),
    reactantEnthalpyKjMol: hReact,
    productEnthalpyKjMol: hProd,
    overallDeltaHKjMol: deltaH,
    uncatalysedEaKjMol: eaUncat,
    catalysedEaKjMol: eaCat,
    activationEnergyReductionKjMol: +deltaEa.toFixed(1),
    arrheniusRateEnhancementFactor: +exactRatio.toPrecision(3),
    equilibriumConstantUnchangedNote:
      'Thermodynamic Invariance: Because a catalyst lowers both E_a(fwd) and E_a(rev) by the exact same ΔE_a while leaving H_reactants and H_products unchanged, ΔH° and K_eq remain strictly constant at fixed temperature.',
    catalystRegenerationNote:
      'Ideal Catalytic Cycle: The catalyst participates in elementary steps to form lower-energy intermediates/adsorbates, then is quantitatively regenerated at the end of each cycle.',
  };
}

// ============================================================================
// MODEL 80: ACID–BASE TITRATION LABORATORY
// ============================================================================
export type TitrationSystemType =
  | 'strong_acid_strong_base'
  | 'weak_acid_strong_base'
  | 'strong_acid_weak_base';

export type AcidBaseIndicatorType =
  | 'phenolphthalein'
  | 'bromothymol_blue'
  | 'methyl_orange';

export interface TitrationCurvePoint {
  titrantVolumeMl: number;
  pH: number;
}

export interface AcidBaseTitrationMetrics {
  titrationType: TitrationSystemType;
  titrationTitle: string;
  balancedEquation: string;
  analyteName: string;
  titrantName: string;
  analyteVolumeMl: number;
  analyteConcentrationM: number;
  titrantConcentrationM: number;
  titrantVolumeAddedMl: number;
  equivalenceVolumeMl: number;
  halfEquivalenceVolumeMl: number;
  currentPh: number;
  equivalencePointPh: number;
  pKaOrPKbNote: string;
  activeCalculationMethod: string;
  titrationRegionLabel: string;
  indicatorType: AcidBaseIndicatorType;
  indicatorName: string;
  indicatorTransitionRange: string;
  indicatorHexColor: string;
  indicatorColorDescription: string;
  indicatorSuitabilityNote: string;
  curvePoints: TitrationCurvePoint[];
}

export function computeTitrationPhAtVolume(
  titrationType: TitrationSystemType,
  VaMl: number,
  Ca: number,
  Cb: number,
  VtMl: number
): { pH: number; method: string; region: string } {
  const Va = VaMl / 1000; // L
  const Vt = Math.max(0, VtMl) / 1000; // L
  const Vtot = Va + Vt;
  const nAnalyte = Ca * Va;
  const nTitrant = Cb * Vt;
  const VeqMl = (Ca * VaMl) / Cb;

  if (titrationType === 'strong_acid_strong_base') {
    // HCl analyte + NaOH titrant
    if (Math.abs(VtMl - VeqMl) < 0.05) {
      return {
        pH: 7.0,
        method: 'Neutral Equivalence Point ([H⁺] = [OH⁻] = √K_w = 1.0×10⁻⁷ M at 25°C)',
        region: 'Equivalence Point (Stoichiometric Neutralization of Strong Acid & Strong Base)',
      };
    } else if (nTitrant < nAnalyte) {
      const hConc = (nAnalyte - nTitrant) / Vtot;
      // Include water autoionization for very dilute excess near V_eq
      const hTotal = 0.5 * (hConc + Math.sqrt(hConc * hConc + 4 * KW_25C));
      const pH = -Math.log10(Math.max(1e-14, hTotal));
      return {
        pH: +pH.toFixed(2),
        method: 'Stoichiometric Excess Strong Acid: [H⁺] = (n_HCl − n_NaOH) / V_total',
        region: VtMl === 0 ? 'Initial Strong Acid Analyte (Before Titrant Addition)' : 'Pre-Equivalence Acidic Region (Excess H⁺)',
      };
    } else {
      const ohConc = (nTitrant - nAnalyte) / Vtot;
      const ohTotal = 0.5 * (ohConc + Math.sqrt(ohConc * ohConc + 4 * KW_25C));
      const pOH = -Math.log10(Math.max(1e-14, ohTotal));
      const pH = 14.0 - pOH;
      return {
        pH: +pH.toFixed(2),
        method: 'Stoichiometric Excess Strong Base: [OH⁻] = (n_NaOH − n_HCl) / V_total, pH = 14 − pOH',
        region: 'Post-Equivalence Basic Region (Excess OH⁻ Titrant)',
      };
    }
  } else if (titrationType === 'weak_acid_strong_base') {
    // CH3COOH analyte (Ka = 1.75e-5, pKa = 4.76) + NaOH titrant
    const Ka = 1.75e-5;
    const pKa = -Math.log10(Ka); // 4.757
    if (VtMl <= 0.001) {
      // Initial weak acid equilibrium: x^2 + Ka*x - Ka*Ca = 0
      const hConc = 0.5 * (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * Ca));
      return {
        pH: +(-Math.log10(hConc)).toFixed(2),
        method: 'Weak-Acid Dissociation Equilibrium: [H⁺] = √(K_a · C_HA) (Henderson–Hasselbalch NOT used at V_t = 0)',
        region: 'Initial Weak Acid Solution (Partial Ionization of CH₃COOH)',
      };
    } else if (Math.abs(VtMl - VeqMl) <= 0.08) {
      // Equivalence point: all HA converted to conjugate base A- (concentration C_salt = nAnalyte / Vtot)
      const cSalt = nAnalyte / Vtot;
      const Kb = KW_25C / Ka;
      const ohConc = 0.5 * (-Kb + Math.sqrt(Kb * Kb + 4 * Kb * cSalt));
      const pH = 14.0 + Math.log10(ohConc);
      return {
        pH: +pH.toFixed(2),
        method: 'Conjugate-Base Hydrolysis at Equivalence: CH₃COO⁻ + H₂O ⇌ CH₃COOH + OH⁻ (K_b = K_w/K_a, pH > 7)',
        region: 'Weak-Acid Equivalence Point (Basic Solution pH > 7 due to CH₃COO⁻ Hydrolysis)',
      };
    } else if (nTitrant < nAnalyte) {
      const nHA = nAnalyte - nTitrant;
      const nA = nTitrant;
      const ratio = nA / Math.max(1e-9, nHA);
      const hhPh = pKa + Math.log10(ratio);
      const isHalfEq = Math.abs(VtMl - 0.5 * VeqMl) <= 0.4;
      return {
        pH: +hhPh.toFixed(2),
        method: 'Henderson–Hasselbalch Buffer Equation: pH = pK_a + log₁₀([CH₃COO⁻]/[CH₃COOH]) (Valid in Buffer Region)',
        region: isHalfEq
          ? 'Half-Equivalence Point ([CH₃COO⁻] = [CH₃COOH] ➔ pH = pK_a = 4.76, Maximum Buffer Capacity)'
          : 'Pre-Equivalence Buffer Region (Weak Acid CH₃COOH + Conjugate Base CH₃COO⁻)',
      };
    } else {
      const ohConc = (nTitrant - nAnalyte) / Vtot;
      const pH = 14.0 + Math.log10(Math.max(1e-14, ohConc));
      return {
        pH: +pH.toFixed(2),
        method: 'Post-Equivalence Excess Strong Base: [OH⁻] = (n_NaOH − n_HA) / V_total',
        region: 'Post-Equivalence Region (Dominated by Excess Strong Base OH⁻)',
      };
    }
  } else {
    // Strong Acid–Weak Base: NH3 analyte (Kb = 1.77e-5, pKa(NH4+) = 9.25) titrated with HCl titrant
    const Kb = 1.77e-5;
    const Ka = KW_25C / Kb;
    const pKa = -Math.log10(Ka); // 9.248
    if (VtMl <= 0.001) {
      const ohConc = 0.5 * (-Kb + Math.sqrt(Kb * Kb + 4 * Kb * Ca));
      const pH = 14.0 + Math.log10(ohConc);
      return {
        pH: +pH.toFixed(2),
        method: 'Weak-Base Ionization Equilibrium: [OH⁻] = √(K_b · C_NH₃)',
        region: 'Initial Weak Base Analyte (Aqueous NH₃ Before Titrant Addition)',
      };
    } else if (Math.abs(VtMl - VeqMl) <= 0.08) {
      // Equivalence point: all NH3 converted to NH4+ (acidic hydrolysis!)
      const cSalt = nAnalyte / Vtot;
      const hConc = 0.5 * (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * cSalt));
      const pH = -Math.log10(hConc);
      return {
        pH: +pH.toFixed(2),
        method: 'Conjugate-Acid Hydrolysis at Equivalence: NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺ (K_a = K_w/K_b, pH < 7)',
        region: 'Weak-Base Equivalence Point (Acidic Solution pH < 7 due to NH₄⁺ Hydrolysis)',
      };
    } else if (nTitrant < nAnalyte) {
      const nBase = nAnalyte - nTitrant; // remaining NH3
      const nConjAcid = nTitrant; // formed NH4+
      const hhPh = pKa + Math.log10(nBase / Math.max(1e-9, nConjAcid));
      const isHalfEq = Math.abs(VtMl - 0.5 * VeqMl) <= 0.4;
      return {
        pH: +hhPh.toFixed(2),
        method: 'Henderson–Hasselbalch Conjugate Pair Equation: pH = pK_a(NH₄⁺) + log₁₀([NH₃]/[NH₄⁺])',
        region: isHalfEq
          ? 'Half-Equivalence Point ([NH₃] = [NH₄⁺] ➔ pH = pK_a(NH₄⁺) = 9.25)'
          : 'Pre-Equivalence Buffer Region (Weak Base NH₃ + Conjugate Acid NH₄⁺)',
      };
    } else {
      const hConc = (nTitrant - nAnalyte) / Vtot;
      const pH = -Math.log10(Math.max(1e-14, hConc));
      return {
        pH: +pH.toFixed(2),
        method: 'Post-Equivalence Excess Strong Acid: [H⁺] = (n_HCl − n_NH₃) / V_total',
        region: 'Post-Equivalence Acidic Region (Dominated by Excess Strong Acid H⁺)',
      };
    }
  }
}

export function calculateTitrationMetrics(params: {
  titrationType?: string;
  titrantVolumeAddedMl?: number;
  analyteConcentrationM?: number;
  titrantConcentrationM?: number;
  analyteVolumeMl?: number;
  indicatorType?: string;
}): AcidBaseTitrationMetrics {
  const rawType = String(params.titrationType || 'strong_acid_strong_base');
  const validTypes: TitrationSystemType[] = [
    'strong_acid_strong_base',
    'weak_acid_strong_base',
    'strong_acid_weak_base',
  ];
  const titrationType: TitrationSystemType = validTypes.includes(rawType as TitrationSystemType)
    ? (rawType as TitrationSystemType)
    : 'strong_acid_strong_base';

  const rawInd = String(params.indicatorType || 'phenolphthalein');
  const validInds: AcidBaseIndicatorType[] = ['phenolphthalein', 'bromothymol_blue', 'methyl_orange'];
  const indicatorType: AcidBaseIndicatorType = validInds.includes(rawInd as AcidBaseIndicatorType)
    ? (rawInd as AcidBaseIndicatorType)
    : 'phenolphthalein';

  const VaMl = Math.max(15, Math.min(40, Number(params.analyteVolumeMl ?? 25)));
  const Ca = Math.max(0.05, Math.min(0.25, Number(params.analyteConcentrationM ?? 0.10)));
  const Cb = Math.max(0.05, Math.min(0.25, Number(params.titrantConcentrationM ?? 0.10)));
  const VtMl = Math.max(0, Math.min(50, Number(params.titrantVolumeAddedMl ?? 12.5)));

  const VeqMl = +((Ca * VaMl) / Cb).toFixed(2);
  const VhalfMl = +(0.5 * VeqMl).toFixed(2);

  const curr = computeTitrationPhAtVolume(titrationType, VaMl, Ca, Cb, VtMl);
  const eqEval = computeTitrationPhAtVolume(titrationType, VaMl, Ca, Cb, VeqMl);

  let titrationTitle = 'Strong Acid – Strong Base Titration: HCl(aq) + NaOH(aq)';
  let balancedEquation = 'HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)';
  let analyteName = 'Hydrochloric Acid HCl(aq)';
  let titrantName = 'Sodium Hydroxide NaOH(aq)';
  let pKaOrPKbNote = 'Strong Electrolytes: Complete dissociation; Equivalence pH = 7.00 at 25°C.';

  if (titrationType === 'weak_acid_strong_base') {
    titrationTitle = 'Weak Acid – Strong Base Titration: CH₃COOH(aq) + NaOH(aq)';
    balancedEquation = 'CH₃COOH(aq) + NaOH(aq) → CH₃COONa(aq) + H₂O(l)';
    analyteName = 'Acetic Acid CH₃COOH(aq) (pK_a = 4.76)';
    titrantName = 'Sodium Hydroxide NaOH(aq)';
    pKaOrPKbNote = `pK_a(CH₃COOH) = 4.76 (K_a = 1.75×10⁻⁵); Equivalence pH = ${eqEval.pH} (> 7 due to CH₃COO⁻ basic hydrolysis).`;
  } else if (titrationType === 'strong_acid_weak_base') {
    titrationTitle = 'Weak Base – Strong Acid Titration: NH₃(aq) + HCl(aq)';
    balancedEquation = 'NH₃(aq) + HCl(aq) → NH₄Cl(aq)';
    analyteName = 'Aqueous Ammonia NH₃(aq) (pK_b = 4.75)';
    titrantName = 'Hydrochloric Acid HCl(aq)';
    pKaOrPKbNote = `pK_a(NH₄⁺) = 9.25 (K_b = 1.77×10⁻⁵); Equivalence pH = ${eqEval.pH} (< 7 due to NH₄⁺ acidic hydrolysis).`;
  }

  // Indicator colour and transition logic
  let indicatorName = 'Phenolphthalein';
  let indicatorTransitionRange = 'pH 8.2 – 10.0';
  let indicatorHexColor = '#E2E8F0';
  let indicatorColorDescription = 'Colourless (Acidic/Neutral Form HIn)';
  let indicatorSuitabilityNote =
    titrationType === 'strong_acid_weak_base'
      ? 'Less optimal for Weak Base–Strong Acid (equivalence pH ≈ 5.28 lies below phenolphthalein range 8.2–10.0; Methyl Orange is preferred).'
      : 'Ideal indicator: sharp transition (8.2–10.0) intersects the steep equivalence jump.';

  if (indicatorType === 'phenolphthalein') {
    if (curr.pH >= 9.6) {
      indicatorHexColor = '#EC4899';
      indicatorColorDescription = 'Deep Magenta-Pink (Basic Deprotonated Form In⁻)';
    } else if (curr.pH >= 8.2) {
      indicatorHexColor = '#F472B6';
      indicatorColorDescription = 'Faint Endpoint Pink (Transition Range pH 8.2–10.0)';
    } else {
      indicatorHexColor = '#CBE7F8';
      indicatorColorDescription = 'Clear / Colourless (pH < 8.2)';
    }
  } else if (indicatorType === 'bromothymol_blue') {
    indicatorName = 'Bromothymol Blue';
    indicatorTransitionRange = 'pH 6.0 – 7.6';
    indicatorSuitabilityNote =
      titrationType === 'strong_acid_strong_base'
        ? 'Ideal for Strong Acid–Strong Base titration (equivalence pH = 7.00 centered in 6.0–7.6 range).'
        : 'Transition range 6.0–7.6 lies near neutral pH.';
    if (curr.pH < 6.0) {
      indicatorHexColor = '#FACC15';
      indicatorColorDescription = 'Yellow (Acidic Form pH < 6.0)';
    } else if (curr.pH <= 7.6) {
      indicatorHexColor = '#10B981';
      indicatorColorDescription = 'Emerald Green (Endpoint Transition pH 6.0–7.6)';
    } else {
      indicatorHexColor = '#2563EB';
      indicatorColorDescription = 'Deep Blue (Basic Form pH > 7.6)';
    }
  } else {
    indicatorName = 'Methyl Orange';
    indicatorTransitionRange = 'pH 3.1 – 4.4';
    indicatorSuitabilityNote =
      titrationType === 'strong_acid_weak_base'
        ? 'Well suited for Weak Base–Strong Acid titration where the steep drop occurs in the acidic region.'
        : 'Transition range (3.1–4.4) is too acidic for Weak Acid–Strong Base equivalence (pH ≈ 8.72).';
    if (curr.pH < 3.1) {
      indicatorHexColor = '#EF4444';
      indicatorColorDescription = 'Coral Red (Acidic Form pH < 3.1)';
    } else if (curr.pH <= 4.4) {
      indicatorHexColor = '#F97316';
      indicatorColorDescription = 'Orange Transition (pH 3.1–4.4)';
    } else {
      indicatorHexColor = '#FDE047';
      indicatorColorDescription = 'Yellow (pH > 4.4)';
    }
  }

  const curvePoints: TitrationCurvePoint[] = [];
  for (let i = 0; i <= 50; i++) {
    const v = i;
    const pt = computeTitrationPhAtVolume(titrationType, VaMl, Ca, Cb, v);
    curvePoints.push({ titrantVolumeMl: v, pH: pt.pH });
  }

  return {
    titrationType,
    titrationTitle,
    balancedEquation,
    analyteName,
    titrantName,
    analyteVolumeMl: +VaMl.toFixed(1),
    analyteConcentrationM: +Ca.toFixed(3),
    titrantConcentrationM: +Cb.toFixed(3),
    titrantVolumeAddedMl: +VtMl.toFixed(2),
    equivalenceVolumeMl: VeqMl,
    halfEquivalenceVolumeMl: VhalfMl,
    currentPh: curr.pH,
    equivalencePointPh: eqEval.pH,
    pKaOrPKbNote,
    activeCalculationMethod: curr.method,
    titrationRegionLabel: curr.region,
    indicatorType,
    indicatorName,
    indicatorTransitionRange,
    indicatorHexColor,
    indicatorColorDescription,
    indicatorSuitabilityNote,
    curvePoints,
  };
}

// ============================================================================
// MODEL 81: SOLUBILITY AND PRECIPITATION EXPLORER
// ============================================================================
export type SparinglySolubleSaltType = 'agcl' | 'pbi2' | 'baso4' | 'caf2';

export interface SolubilityPrecipitationMetrics {
  saltPreset: SparinglySolubleSaltType;
  saltName: string;
  saltFormula: string;
  dissolutionEquation: string;
  kspExpression: string;
  cationFormula: string;
  anionFormula: string;
  stoichM: number; // m in A_m B_n
  stoichN: number; // n in A_m B_n
  kspValue25C: number;
  pKsp: number;
  molarSolubilityPureWaterM: number;
  solutionVolumeMl: number;
  cationAddedMillimolar: number;
  anionAddedMillimolar: number;
  commonIonAddedMillimolar: number;
  initialCationConcM: number;
  initialAnionConcM: number;
  ionProductQsp: number;
  saturationRatioQspOverKsp: number;
  saturationStatus: 'Unsaturated Solution (Q_sp < K_sp — All Ions Dissolved)' | 'Saturated Dynamic Equilibrium (Q_sp = K_sp)' | 'Supersaturated — Precipitation Favoured (Q_sp > K_sp)';
  precipitateFormedMillimoles: number;
  precipitateMassMg: number;
  precipitateColorHex: string;
  precipitateAppearanceLabel: string;
  equilibriumCationConcM: number;
  equilibriumAnionConcM: number;
  commonIonEffectExplanation: string;
  kineticNucleationDisclaimer: string;
}

export function calculateSolubilityPrecipitationMetrics(params: {
  saltPreset?: string;
  cationAddedMillimolar?: number;
  anionAddedMillimolar?: number;
  solutionVolumeMl?: number;
  commonIonAddedMillimolar?: number;
}): SolubilityPrecipitationMetrics {
  const rawSalt = String(params.saltPreset || 'agcl');
  const validSalts: SparinglySolubleSaltType[] = ['agcl', 'pbi2', 'baso4', 'caf2'];
  const saltPreset: SparinglySolubleSaltType = validSalts.includes(rawSalt as SparinglySolubleSaltType)
    ? (rawSalt as SparinglySolubleSaltType)
    : 'agcl';

  const volMl = Math.max(50, Math.min(500, Number(params.solutionVolumeMl ?? 100)));
  const volL = volMl / 1000;
  const catMm = Math.max(0.001, Math.min(5.0, Number(params.cationAddedMillimolar ?? 0.5)));
  const anMm = Math.max(0.001, Math.min(5.0, Number(params.anionAddedMillimolar ?? 0.5)));
  const commonMm = Math.max(0.0, Math.min(10.0, Number(params.commonIonAddedMillimolar ?? 0.0)));

  let saltName = 'Silver Chloride';
  let saltFormula = 'AgCl(s)';
  let dissolutionEquation = 'AgCl(s) ⇌ Ag⁺(aq) + Cl⁻(aq)';
  let kspExpression = 'K_sp = [Ag⁺][Cl⁻]';
  let cationFormula = 'Ag⁺';
  let anionFormula = 'Cl⁻';
  let stoichM = 1;
  let stoichN = 1;
  let ksp = 1.77e-10; // CRC Handbook 25°C
  let molarMassG = 143.32;
  let precipitateColorHex = '#F8FAFC';
  let precipitateAppearanceLabel = 'Dense White Crystalline AgCl(s) Precipitate';

  if (saltPreset === 'pbi2') {
    saltName = 'Lead(II) Iodide';
    saltFormula = 'PbI₂(s)';
    dissolutionEquation = 'PbI₂(s) ⇌ Pb²⁺(aq) + 2I⁻(aq)';
    kspExpression = 'K_sp = [Pb²⁺][I⁻]²';
    cationFormula = 'Pb²⁺';
    anionFormula = 'I⁻';
    stoichM = 1;
    stoichN = 2;
    ksp = 9.8e-9; // 25°C literature value
    molarMassG = 461.01;
    precipitateColorHex = '#FACC15';
    precipitateAppearanceLabel = 'Golden-Yellow Hexagonal PbI₂(s) Micro-Crystals ("Golden Rain")';
  } else if (saltPreset === 'baso4') {
    saltName = 'Barium Sulfate';
    saltFormula = 'BaSO₄(s)';
    dissolutionEquation = 'BaSO₄(s) ⇌ Ba²⁺(aq) + SO₄²⁻(aq)';
    kspExpression = 'K_sp = [Ba²⁺][SO₄²⁻]';
    cationFormula = 'Ba²⁺';
    anionFormula = 'SO₄²⁻';
    stoichM = 1;
    stoichN = 1;
    ksp = 1.08e-10; // 25°C literature value
    molarMassG = 233.39;
    precipitateColorHex = '#F1F5F9';
    precipitateAppearanceLabel = 'Fine White Crystalline BaSO₄(s) Solid Phase';
  } else if (saltPreset === 'caf2') {
    saltName = 'Calcium Fluoride';
    saltFormula = 'CaF₂(s)';
    dissolutionEquation = 'CaF₂(s) ⇌ Ca²⁺(aq) + 2F⁻(aq)';
    kspExpression = 'K_sp = [Ca²⁺][F⁻]²';
    cationFormula = 'Ca²⁺';
    anionFormula = 'F⁻';
    stoichM = 1;
    stoichN = 2;
    ksp = 3.45e-11; // 25°C literature value
    molarMassG = 78.07;
    precipitateColorHex = '#E2E8F0';
    precipitateAppearanceLabel = 'Translucent White CaF₂(s) Fluorite Precipitate';
  }

  // Dilution scaling relative to 100 mL reference mixing volume
  const dilScale = 100 / volMl;
  const initCatM = (catMm * 1e-3) * dilScale;
  const initAnM = ((anMm + commonMm) * 1e-3) * dilScale;

  const qsp = Math.pow(initCatM, stoichM) * Math.pow(initAnM, stoichN);
  const pKsp = +(-Math.log10(ksp)).toFixed(2);
  const pureWaterSolubility =
    stoichM === 1 && stoichN === 1
      ? Math.sqrt(ksp)
      : Math.cbrt(ksp / 4);

  let saturationStatus: SolubilityPrecipitationMetrics['saturationStatus'] =
    'Saturated Dynamic Equilibrium (Q_sp = K_sp)';
  let precipMmol = 0;
  let eqCatM = initCatM;
  let eqAnM = initAnM;

  if (qsp < ksp * 0.98) {
    saturationStatus = 'Unsaturated Solution (Q_sp < K_sp — All Ions Dissolved)';
  } else if (qsp > ksp * 1.02) {
    saturationStatus = 'Supersaturated — Precipitation Favoured (Q_sp > K_sp)';
    // Solve precipitation extent x (M of salt precipitated) such that (initCatM - m*x)^m * (initAnM - n*x)^n = ksp
    const xMax = Math.min(initCatM / stoichM, initAnM / stoichN);
    let lo = 0;
    let hi = xMax;
    for (let iter = 0; iter < 60; iter++) {
      const mid = 0.5 * (lo + hi);
      const cA = Math.max(0, initCatM - stoichM * mid);
      const cB = Math.max(0, initAnM - stoichN * mid);
      const qMid = Math.pow(cA, stoichM) * Math.pow(cB, stoichN);
      if (qMid > ksp) lo = mid;
      else hi = mid;
    }
    const xPrecipM = 0.5 * (lo + hi);
    eqCatM = Math.max(1e-9, initCatM - stoichM * xPrecipM);
    eqAnM = Math.max(1e-9, initAnM - stoichN * xPrecipM);
    precipMmol = +(xPrecipM * volL * 1000).toFixed(4);
  }

  const precipMassMg = +(precipMmol * molarMassG).toFixed(2);
  const satRatio = +(qsp / ksp).toPrecision(3);

  const commonIonEffectExplanation =
    commonMm > 0
      ? `Common-Ion Effect Active (+${commonMm.toFixed(2)} mM ${anionFormula}): Extra ${anionFormula} increases Q_sp and shifts ${dissolutionEquation} to the left (Le Chatelier's principle), markedly decreasing the molar solubility of ${saltFormula}.`
      : `Ideal-Solution Approximation (Activities ≈ Molar Concentrations): In pure water at 25°C, molar solubility s₀ = ${pureWaterSolubility.toExponential(2)} M. Adding a common ion (${anionFormula}) shifts equilibrium toward the solid phase.`;

  return {
    saltPreset,
    saltName,
    saltFormula,
    dissolutionEquation,
    kspExpression,
    cationFormula,
    anionFormula,
    stoichM,
    stoichN,
    kspValue25C: ksp,
    pKsp,
    molarSolubilityPureWaterM: +pureWaterSolubility.toExponential(3),
    solutionVolumeMl: +volMl.toFixed(0),
    cationAddedMillimolar: +catMm.toFixed(3),
    anionAddedMillimolar: +anMm.toFixed(3),
    commonIonAddedMillimolar: +commonMm.toFixed(2),
    initialCationConcM: +initCatM.toExponential(3),
    initialAnionConcM: +initAnM.toExponential(3),
    ionProductQsp: +qsp.toExponential(3),
    saturationRatioQspOverKsp: satRatio,
    saturationStatus,
    precipitateFormedMillimoles: precipMmol,
    precipitateMassMg: precipMassMg,
    precipitateColorHex,
    precipitateAppearanceLabel,
    equilibriumCationConcM: +eqCatM.toExponential(3),
    equilibriumAnionConcM: +eqAnM.toExponential(3),
    commonIonEffectExplanation,
    kineticNucleationDisclaimer:
      'Thermodynamic vs Kinetic Note: Q_sp > K_sp indicates that precipitation is thermodynamically favoured (ΔG < 0), though real solutions may briefly remain supersaturated until crystal nucleation barriers are overcome.',
  };
}

// ============================================================================
// MODEL 82: BUFFER SOLUTION SIMULATOR
// ============================================================================
export type BufferSystemPresetType =
  | 'acetate_buffer'
  | 'phosphate_buffer'
  | 'ammonia_buffer';

export interface BufferSolutionMetrics {
  bufferPreset: BufferSystemPresetType;
  bufferTitle: string;
  equilibriumEquation: string;
  weakComponentFormula: string;
  conjugatePartnerFormula: string;
  isWeakBaseSystem: boolean;
  pKaValue: number;
  usefulBufferRangePh: string;
  solutionVolumeMl: number;
  initialWeakConcM: number;
  initialConjugateConcM: number;
  addedStrongAcidMmol: number;
  addedStrongBaseMmol: number;
  initialPh: number;
  finalPh: number;
  deltaPh: number;
  remainingWeakMmol: number;
  remainingConjugateMmol: number;
  remainingWeakConcM: number;
  remainingConjugateConcM: number;
  conjugateRatioBaseOverAcid: number;
  bufferCapacityExceeded: boolean;
  calculationMethodLabel: string;
  neutralizationMechanismText: string;
  unbufferedWaterPh: number;
  diluteReferenceBufferFinalPh: number;
  diluteReferenceDeltaPh: number;
  capacityComparisonSummary: string;
}

export function computeSingleBufferState(
  pKa: number,
  isWeakBase: boolean,
  nWeak0Mmol: number, // HA for acid buffer, B (NH3) for base buffer
  nConj0Mmol: number, // A- for acid buffer, BH+ (NH4+) for base buffer
  netAcidAddedMmol: number, // + for HCl added, - for NaOH added
  volL: number
): {
  pH: number;
  nAcidFinal: number;
  nBaseFinal: number;
  exceeded: boolean;
  method: string;
} {
  const Ka = Math.pow(10, -pKa);
  // Map to canonical conjugate acid (HA / BH+) and conjugate base (A- / B)
  const nAcid0 = isWeakBase ? nConj0Mmol : nWeak0Mmol;
  const nBase0 = isWeakBase ? nWeak0Mmol : nConj0Mmol;

  // Adding strong acid (H+) consumes conjugate base (nBase decreases, nAcid increases)
  // Adding strong base (OH-) consumes conjugate acid (nAcid decreases, nBase increases)
  const nAcidRaw = nAcid0 + netAcidAddedMmol;
  const nBaseRaw = nBase0 - netAcidAddedMmol;

  if (nBaseRaw <= 0.001) {
    // Conjugate base exhausted by excess strong acid!
    const excessStrongAcidMmol = Math.max(0, -nBaseRaw);
    const totalAcidMmol = nAcid0 + nBase0;
    if (excessStrongAcidMmol > 0.05) {
      const hConc = (excessStrongAcidMmol / 1000) / volL;
      const pH = -Math.log10(Math.max(1e-14, hConc));
      return {
        pH: +Math.max(0.5, pH).toFixed(2),
        nAcidFinal: +totalAcidMmol.toFixed(2),
        nBaseFinal: 0,
        exceeded: true,
        method: 'Buffer Capacity Exhausted (Excess Strong Acid H⁺ Dominates — Henderson–Hasselbalch Invalid)',
      };
    } else {
      // Exactly at weak-acid equivalence boundary
      const cAcid = (totalAcidMmol / 1000) / volL;
      const hConc = 0.5 * (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * cAcid));
      return {
        pH: +(-Math.log10(hConc)).toFixed(2),
        nAcidFinal: +totalAcidMmol.toFixed(2),
        nBaseFinal: 0,
        exceeded: true,
        method: 'Buffer Exhausted to Pure Conjugate Acid (Quadratic K_a Equilibrium Applied)',
      };
    }
  }

  if (nAcidRaw <= 0.001) {
    // Conjugate acid exhausted by excess strong base!
    const excessStrongBaseMmol = Math.max(0, -nAcidRaw);
    const totalBaseMmol = nAcid0 + nBase0;
    if (excessStrongBaseMmol > 0.05) {
      const ohConc = (excessStrongBaseMmol / 1000) / volL;
      const pH = 14.0 + Math.log10(Math.max(1e-14, ohConc));
      return {
        pH: +Math.min(13.5, pH).toFixed(2),
        nAcidFinal: 0,
        nBaseFinal: +totalBaseMmol.toFixed(2),
        exceeded: true,
        method: 'Buffer Capacity Exhausted (Excess Strong Base OH⁻ Dominates — Henderson–Hasselbalch Invalid)',
      };
    } else {
      const cBase = (totalBaseMmol / 1000) / volL;
      const Kb = KW_25C / Ka;
      const ohConc = 0.5 * (-Kb + Math.sqrt(Kb * Kb + 4 * Kb * cBase));
      return {
        pH: +(14.0 + Math.log10(ohConc)).toFixed(2),
        nAcidFinal: 0,
        nBaseFinal: +totalBaseMmol.toFixed(2),
        exceeded: true,
        method: 'Buffer Exhausted to Pure Conjugate Base (Quadratic K_b Equilibrium Applied)',
      };
    }
  }

  const ratio = nBaseRaw / nAcidRaw;
  const pH = +(pKa + Math.log10(ratio)).toFixed(2);
  const outOfOptimalWindow = ratio < 0.1 || ratio > 10.0;

  return {
    pH,
    nAcidFinal: +nAcidRaw.toFixed(2),
    nBaseFinal: +nBaseRaw.toFixed(2),
    exceeded: outOfOptimalWindow,
    method: outOfOptimalWindow
      ? 'Henderson–Hasselbalch Near Buffer Limit (Ratio Outside 0.1–10 Optimal Window)'
      : 'Stoichiometric Neutralization + Henderson–Hasselbalch: pH = pK_a + log₁₀([Base]/[Acid])',
  };
}

export function calculateBufferSolutionMetrics(params: {
  bufferPreset?: string;
  initialWeakConcM?: number;
  initialConjugateConcM?: number;
  addedStrongAcidMmol?: number;
  addedStrongBaseMmol?: number;
  solutionVolumeMl?: number;
}): BufferSolutionMetrics {
  const rawPreset = String(params.bufferPreset || 'acetate_buffer');
  const validPresets: BufferSystemPresetType[] = [
    'acetate_buffer',
    'phosphate_buffer',
    'ammonia_buffer',
  ];
  const bufferPreset: BufferSystemPresetType = validPresets.includes(rawPreset as BufferSystemPresetType)
    ? (rawPreset as BufferSystemPresetType)
    : 'acetate_buffer';

  const volMl = Math.max(50, Math.min(250, Number(params.solutionVolumeMl ?? 100)));
  const volL = volMl / 1000;
  const cWeak0 = Math.max(0.05, Math.min(1.0, Number(params.initialWeakConcM ?? 0.20)));
  const cConj0 = Math.max(0.05, Math.min(1.0, Number(params.initialConjugateConcM ?? 0.20)));
  const acidAddMmol = Math.max(0, Math.min(25, Number(params.addedStrongAcidMmol ?? 0)));
  const baseAddMmol = Math.max(0, Math.min(25, Number(params.addedStrongBaseMmol ?? 0)));

  let bufferTitle = 'Acetate Buffer System: CH₃COOH(aq) / CH₃COO⁻(aq)';
  let equilibriumEquation = 'CH₃COOH(aq) + H₂O(l) ⇌ CH₃COO⁻(aq) + H₃O⁺(aq)';
  let weakComponentFormula = 'CH₃COOH';
  let conjugatePartnerFormula = 'CH₃COO⁻';
  let isWeakBaseSystem = false;
  let pKaValue = 4.76;
  let usefulBufferRangePh = 'pH 3.76 – 5.76 (pK_a ± 1)';

  if (bufferPreset === 'phosphate_buffer') {
    bufferTitle = 'Phosphate Buffer System: H₂PO₄⁻(aq) / HPO₄²⁻(aq)';
    equilibriumEquation = 'H₂PO₄⁻(aq) + H₂O(l) ⇌ HPO₄²⁻(aq) + H₃O⁺(aq)';
    weakComponentFormula = 'H₂PO₄⁻';
    conjugatePartnerFormula = 'HPO₄²⁻';
    isWeakBaseSystem = false;
    pKaValue = 7.20;
    usefulBufferRangePh = 'pH 6.20 – 8.20 (pK_a2 ± 1)';
  } else if (bufferPreset === 'ammonia_buffer') {
    bufferTitle = 'Ammonia–Ammonium Buffer System: NH₃(aq) / NH₄⁺(aq)';
    equilibriumEquation = 'NH₄⁺(aq) + H₂O(l) ⇌ NH₃(aq) + H₃O⁺(aq)  (pK_b = 4.75, pK_a = 9.25)';
    weakComponentFormula = 'NH₃ (Weak Base)';
    conjugatePartnerFormula = 'NH₄⁺ (Conjugate Acid)';
    isWeakBaseSystem = true;
    pKaValue = 9.25;
    usefulBufferRangePh = 'pH 8.25 – 10.25 (pK_a(NH₄⁺) ± 1)';
  }

  const nWeak0Mmol = +(cWeak0 * volMl).toFixed(2);
  const nConj0Mmol = +(cConj0 * volMl).toFixed(2);
  const netAcidMmol = +(acidAddMmol - baseAddMmol).toFixed(2);

  const initRes = computeSingleBufferState(pKaValue, isWeakBaseSystem, nWeak0Mmol, nConj0Mmol, 0, volL);
  const finalRes = computeSingleBufferState(pKaValue, isWeakBaseSystem, nWeak0Mmol, nConj0Mmol, netAcidMmol, volL);

  // Also compare with a 4x lower-concentration buffer under the exact same addition to demonstrate finite buffer capacity
  const lowConcRes = computeSingleBufferState(
    pKaValue,
    isWeakBaseSystem,
    nWeak0Mmol * 0.25,
    nConj0Mmol * 0.25,
    netAcidMmol,
    volL
  );

  // Unbuffered pure water pH under the same net addition
  let unbufferedWaterPh = 7.0;
  if (Math.abs(netAcidMmol) > 0.01) {
    const cExcess = (Math.abs(netAcidMmol) / 1000) / volL;
    unbufferedWaterPh =
      netAcidMmol > 0
        ? +Math.max(0.5, -Math.log10(cExcess)).toFixed(2)
        : +Math.min(13.5, 14.0 + Math.log10(cExcess)).toFixed(2);
  }

  const remWeakMmol = isWeakBaseSystem ? finalRes.nBaseFinal : finalRes.nAcidFinal;
  const remConjMmol = isWeakBaseSystem ? finalRes.nAcidFinal : finalRes.nBaseFinal;
  const remWeakConcM = +(remWeakMmol / volMl).toFixed(3);
  const remConjConcM = +(remConjMmol / volMl).toFixed(3);
  const ratioBaseOverAcid =
    finalRes.nAcidFinal > 0.001
      ? +(finalRes.nBaseFinal / finalRes.nAcidFinal).toFixed(3)
      : 999;

  const deltaPh = +(finalRes.pH - initRes.pH).toFixed(2);
  const diluteDeltaPh = +(lowConcRes.pH - initRes.pH).toFixed(2);

  const baseFormula = isWeakBaseSystem ? 'NH₃' : conjugatePartnerFormula;
  const acidFormula = isWeakBaseSystem ? 'NH₄⁺' : weakComponentFormula;

  let neutralizationMechanismText =
    `Intact Conjugate Pair (${acidFormula} / ${baseFormula}): Neither strong acid nor strong base has been added yet (ΔpH = 0.00).`;
  if (netAcidMmol > 0.01) {
    neutralizationMechanismText =
      `Added Strong Acid (${netAcidMmol} mmol H⁺) is neutralized by the basic buffer partner: ${baseFormula} + H⁺ → ${acidFormula}, converting ${baseFormula} into ${acidFormula} so free [H₃O⁺] barely increases (ΔpH = ${deltaPh}).`;
  } else if (netAcidMmol < -0.01) {
    neutralizationMechanismText =
      `Added Strong Base (${Math.abs(netAcidMmol)} mmol OH⁻) is neutralized by the acidic buffer partner: ${acidFormula} + OH⁻ → ${baseFormula} + H₂O, converting ${acidFormula} into ${baseFormula} so pH rises only slightly (ΔpH = +${deltaPh}).`;
  }

  const capacityComparisonSummary =
    `Active Buffer (${(cWeak0 + cConj0).toFixed(2)} M total): pH ${initRes.pH.toFixed(2)} → ${finalRes.pH.toFixed(2)} (ΔpH = ${deltaPh >= 0 ? '+' : ''}${deltaPh.toFixed(2)})  |  ` +
    `Dilute 0.25× Buffer: pH → ${lowConcRes.pH.toFixed(2)} (ΔpH = ${diluteDeltaPh >= 0 ? '+' : ''}${diluteDeltaPh.toFixed(2)})  |  ` +
    `Unbuffered Water: pH 7.00 → ${unbufferedWaterPh.toFixed(2)}`;

  return {
    bufferPreset,
    bufferTitle,
    equilibriumEquation,
    weakComponentFormula,
    conjugatePartnerFormula,
    isWeakBaseSystem,
    pKaValue,
    usefulBufferRangePh,
    solutionVolumeMl: +volMl.toFixed(0),
    initialWeakConcM: +cWeak0.toFixed(2),
    initialConjugateConcM: +cConj0.toFixed(2),
    addedStrongAcidMmol: +acidAddMmol.toFixed(1),
    addedStrongBaseMmol: +baseAddMmol.toFixed(1),
    initialPh: initRes.pH,
    finalPh: finalRes.pH,
    deltaPh,
    remainingWeakMmol: remWeakMmol,
    remainingConjugateMmol: remConjMmol,
    remainingWeakConcM: remWeakConcM,
    remainingConjugateConcM: remConjConcM,
    conjugateRatioBaseOverAcid: ratioBaseOverAcid,
    bufferCapacityExceeded: finalRes.exceeded,
    calculationMethodLabel: finalRes.method,
    neutralizationMechanismText,
    unbufferedWaterPh,
    diluteReferenceBufferFinalPh: lowConcRes.pH,
    diluteReferenceDeltaPh: diluteDeltaPh,
    capacityComparisonSummary,
  };
}
