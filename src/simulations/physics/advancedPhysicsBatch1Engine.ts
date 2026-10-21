/**
 * TECH-ANATOMIX — ADVANCED PHYSICS BATCH 1 MATHEMATICAL SIMULATION ENGINE (MODELS 1–7)
 *
 * Provides deterministic, unit-consistent physics calculations and state updates for:
 * 1. Electromagnetic Wave Propagation Explorer
 * 2. Plasma Physics Explorer
 * 3. Particle Accelerator Explorer
 * 4. Magnetic Levitation Mechanism Explorer
 * 5. Superconductivity and Meissner Effect Explorer
 * 6. Black Hole and Gravitational Lensing Explorer
 * 7. Quantum Tunnelling Explorer
 */

// Physical Constants (SI)
export const SPEED_OF_LIGHT_C = 2.99792458e8; // m/s
export const VACUUM_PERMITTIVITY_EPS0 = 8.8541878128e-12; // F/m
export const VACUUM_PERMEABILITY_MU0 = 1.25663706212e-6; // N/A^2
export const ELEMENTARY_CHARGE_E = 1.602176634e-19; // C
export const ELECTRON_MASS_ME = 9.1093837015e-31; // kg
export const PROTON_MASS_MP = 1.67262192369e-27; // kg
export const BOLTZMANN_KB = 1.380649e-23; // J/K
export const PLANCK_HBAR = 1.054571817e-34; // J·s
export const GRAVITATIONAL_G = 6.67430e-11; // m^3/(kg·s^2)
export const SOLAR_MASS_KG = 1.98847e30; // kg

// ============================================================================
// 1. ELECTROMAGNETIC WAVE PROPAGATION EXPLORER
// ============================================================================
export interface EmWaveMetrics {
  amplitudeEvM: number; // E0 in V/m
  magneticAmplitudeNt: number; // B0 = E0 / c in nT
  wavelengthM: number; // lambda in m
  frequencyMhz: number; // f = c / lambda in MHz
  waveNumberRadM: number; // k = 2pi / lambda in rad/m
  angularFrequencyRadS: number; // omega = 2pi * f in rad/s
  poyntingIntensityWm2: number; // I = 0.5 * c * eps0 * E0^2 in W/m^2
  phaseVelocityMs: number; // c = 3.00e8 m/s
}

export function calculateEmWaveMetrics(params: {
  amplitude?: number;
  wavelength?: number;
  frequency?: number;
}): EmWaveMetrics {
  const E0 = Math.max(0.1, Number(params.amplitude ?? 1.2));
  const lambda = Math.max(0.2, Number(params.wavelength ?? 2.0));
  // Keep c = f * lambda strictly consistent in vacuum (c ≈ 300 MHz·m)
  const fMhz = +(299.792458 / lambda).toFixed(2);
  const fHz = fMhz * 1e6;
  const B0Tesla = E0 / SPEED_OF_LIGHT_C;
  const B0Nt = +(B0Tesla * 1e9).toFixed(3);
  const k = +(2 * Math.PI / lambda).toFixed(3);
  const omega = +(2 * Math.PI * fHz).toExponential(3);
  const intensity = +(0.5 * SPEED_OF_LIGHT_C * VACUUM_PERMITTIVITY_EPS0 * E0 * E0).toFixed(5);

  return {
    amplitudeEvM: E0,
    magneticAmplitudeNt: B0Nt,
    wavelengthM: lambda,
    frequencyMhz: fMhz,
    waveNumberRadM: k,
    angularFrequencyRadS: Number(omega),
    poyntingIntensityWm2: intensity,
    phaseVelocityMs: SPEED_OF_LIGHT_C,
  };
}

// ============================================================================
// 2. PLASMA PHYSICS EXPLORER
// ============================================================================
export interface PlasmaMetrics {
  temperatureK: number;
  densityE16M3: number; // n_e in units of 10^16 m^-3
  magneticFieldT: number;
  electricFieldVm: number;
  debyeLengthUm: number; // lambda_D in micrometers
  plasmaFrequencyGhz: number; // f_pe in GHz
  electronThermalSpeedKms: number; // v_th,e in km/s
  electronLarmorRadiusMm: number; // r_Le in mm
  ionLarmorRadiusMm: number; // r_Li (hydrogen ion) in mm
  exbDriftSpeedMs: number; // |E x B| / B^2 in m/s
}

export function calculatePlasmaMetrics(params: {
  plasmaTemperature?: number;
  particleDensity?: number;
  magneticFieldB?: number;
  electricFieldE?: number;
}): PlasmaMetrics {
  const Te = Math.max(500, Number(params.plasmaTemperature ?? 15000));
  const neUnit = Math.max(0.5, Number(params.particleDensity ?? 8));
  const ne = neUnit * 1e16; // m^-3
  const B = Math.max(0, Number(params.magneticFieldB ?? 0.8));
  const E = Math.max(0, Number(params.electricFieldE ?? 100));

  const debyeM = Math.sqrt(
    (VACUUM_PERMITTIVITY_EPS0 * BOLTZMANN_KB * Te) /
      (ne * ELEMENTARY_CHARGE_E * ELEMENTARY_CHARGE_E)
  );
  const omegaPe = Math.sqrt(
    (ne * ELEMENTARY_CHARGE_E * ELEMENTARY_CHARGE_E) /
      (VACUUM_PERMITTIVITY_EPS0 * ELECTRON_MASS_ME)
  );
  const fPeGhz = omegaPe / (2 * Math.PI * 1e9);

  const vThE = Math.sqrt((BOLTZMANN_KB * Te) / ELECTRON_MASS_ME); // m/s
  const vThI = Math.sqrt((BOLTZMANN_KB * (Te * 0.25)) / PROTON_MASS_MP); // ions cooler than electrons

  const effB = Math.max(0.05, B);
  const rLeM = (ELECTRON_MASS_ME * vThE) / (ELEMENTARY_CHARGE_E * effB);
  const rLiM = (PROTON_MASS_MP * vThI) / (ELEMENTARY_CHARGE_E * effB);
  const exb = B > 0.05 ? E / B : 0;

  return {
    temperatureK: Te,
    densityE16M3: neUnit,
    magneticFieldT: B,
    electricFieldVm: E,
    debyeLengthUm: +(debyeM * 1e6).toFixed(2),
    plasmaFrequencyGhz: +fPeGhz.toFixed(2),
    electronThermalSpeedKms: +(vThE / 1000).toFixed(1),
    electronLarmorRadiusMm: +(rLeM * 1000).toFixed(3),
    ionLarmorRadiusMm: +(rLiM * 1000).toFixed(2),
    exbDriftSpeedMs: +exb.toFixed(1),
  };
}

// ============================================================================
// 3. PARTICLE ACCELERATOR EXPLORER
// ============================================================================
export interface AcceleratorMetrics {
  acceleratingVoltageKv: number;
  dipoleFieldTesla: number;
  particleMassAmu: number;
  kineticEnergyKev: number;
  exitVelocityMs: number;
  betaFractionC: number; // v / c
  magneticRigidityTm: number; // B * R = p / q
  bendingRadiusM: number; // R = m v / (q B)
  deflectionAngleDeg: number; // across dipole length L_mag = 0.35 m
  electricWorkJoules: number; // W_E = q V
  magneticWorkJoules: 0; // W_B = 0 always (F_B perp v)
}

export function calculateAcceleratorMetrics(params: {
  acceleratingVoltageKv?: number;
  dipoleFieldTesla?: number;
  particleMassAmu?: number;
}): AcceleratorMetrics {
  const Vkv = Math.max(5, Number(params.acceleratingVoltageKv ?? 80));
  const B = Math.max(0.05, Number(params.dipoleFieldTesla ?? 0.6));
  const massAmu = Math.max(1, Number(params.particleMassAmu ?? 1));

  const Vvolts = Vkv * 1000;
  const massKg = massAmu * PROTON_MASS_MP;
  const q = ELEMENTARY_CHARGE_E; // singly charged ion (+1e)
  const kineticJ = q * Vvolts;
  const v = Math.sqrt((2 * kineticJ) / massKg);
  const rigidity = (massKg * v) / q;
  const radiusM = rigidity / B;

  const dipoleLengthM = 0.25;
  const sinTheta = Math.min(0.95, dipoleLengthM / Math.max(0.28, radiusM));
  const deflectionDeg = (Math.asin(sinTheta) * 180) / Math.PI;

  return {
    acceleratingVoltageKv: Vkv,
    dipoleFieldTesla: B,
    particleMassAmu: massAmu,
    kineticEnergyKev: Vkv,
    exitVelocityMs: Math.round(v),
    betaFractionC: +(v / SPEED_OF_LIGHT_C).toFixed(4),
    magneticRigidityTm: +rigidity.toFixed(4),
    bendingRadiusM: +radiusM.toFixed(3),
    deflectionAngleDeg: +deflectionDeg.toFixed(1),
    electricWorkJoules: +kineticJ.toExponential(3) as unknown as number,
    magneticWorkJoules: 0,
  };
}

// ============================================================================
// 4. MAGNETIC LEVITATION MECHANISM EXPLORER
// ============================================================================
export interface MaglevMetrics {
  magnetCurrentKa: number;
  payloadMassKg: number;
  dampingGain: number;
  gravityForceN: number; // F_g = m g
  equilibriumGapMm: number; // z_eq in mm where F_mag(z_eq) = F_g
  magneticLiftForceN: number; // Balanced at equilibrium: F_mag = F_g
  verticalStiffnessKnM: number; // dF/dz at equilibrium
  naturalFrequencyHz: number; // f_n = (1/2pi) sqrt(k_eff / m)
}

export function calculateMaglevMetrics(params: {
  magnetCurrentKa?: number;
  payloadMassKg?: number;
  dampingGain?: number;
}): MaglevMetrics {
  const Ika = Math.max(10, Number(params.magnetCurrentKa ?? 60));
  const massKg = Math.max(50, Number(params.payloadMassKg ?? 400));
  const damping = Math.max(0.05, Number(params.dampingGain ?? 0.5));

  const g = 9.81;
  const Fg = massKg * g;
  // Documented lumped dipole repulsion model:
  // F_mag(z) = K_mag * I_kA^2 / (z_mm + z0_mm)^3
  // Calibrated so I = 60 kA, m = 400 kg (Fg = 3924 N) yields z_eq ≈ 28 mm
  const z0Mm = 20;
  const Kmag = 120500;
  const totalDistMm = Math.cbrt((Kmag * Ika * Ika) / Fg);
  const zEqMm = Math.max(4, +(totalDistMm - z0Mm).toFixed(1));

  // Vertical magnetic stiffness k_z = |-dF/dz| = 3 * Fg / (z_eq + z0)
  const kVerticalNm = (3 * Fg) / ((zEqMm + z0Mm) * 1e-3);
  const fnHz = (1 / (2 * Math.PI)) * Math.sqrt(kVerticalNm / massKg);

  return {
    magnetCurrentKa: Ika,
    payloadMassKg: massKg,
    dampingGain: damping,
    gravityForceN: +Fg.toFixed(1),
    equilibriumGapMm: zEqMm,
    magneticLiftForceN: +Fg.toFixed(1),
    verticalStiffnessKnM: +(kVerticalNm / 1000).toFixed(1),
    naturalFrequencyHz: +fnHz.toFixed(2),
  };
}

// ============================================================================
// 5. SUPERCONDUCTIVITY AND MEISSNER EFFECT EXPLORER
// ============================================================================
export interface SuperconductorMetrics {
  specimenTemperatureK: number;
  criticalTempK: number;
  appliedFieldMt: number;
  criticalFieldAtTempMt: number; // B_c(T) = B_c0 * (1 - (T/Tc)^2)
  isSuperconducting: boolean;
  meissnerFraction: number; // 0 in normal state, 1 - (T/Tc)^4 in superconducting state
  londonPenetrationNm: number; // lambda_L(T) = lambda_0 / sqrt(1 - (T/Tc)^4)
  internalMagneticFieldMt: number; // 0 in ideal Meissner state, B_app in normal state
  levitationHeightMm: number;
}

export function calculateSuperconductorMetrics(params: {
  specimenTemperatureK?: number;
  criticalTempK?: number;
  appliedFieldMt?: number;
}): SuperconductorMetrics {
  const T = Math.max(10, Number(params.specimenTemperatureK ?? 77));
  const Tc = Math.max(30, Number(params.criticalTempK ?? 92));
  const Bapp = Math.max(5, Number(params.appliedFieldMt ?? 80));

  const Bc0 = 500; // mT effective critical field scale at T->0 (so Bc(77K) ≈ 150 mT > 80 mT default NdFeB field)
  const ratio = T / Tc;
  const BcT = ratio < 1 ? +(Bc0 * (1 - ratio * ratio)).toFixed(1) : 0;
  const isSuper = T < Tc && Bapp < BcT;

  const twoFluidFraction = isSuper ? Math.max(0, 1 - Math.pow(ratio, 4)) : 0;
  const lambda0Nm = 150; // YBCO typical London penetration depth ~150 nm at T->0
  const londonNm = isSuper
    ? +(lambda0Nm / Math.sqrt(Math.max(0.02, twoFluidFraction))).toFixed(0)
    : Infinity;

  const Binside = isSuper ? 0 : Bapp;
  const levHeightMm = isSuper
    ? +(6 + 18 * twoFluidFraction * (Bapp / 100)).toFixed(1)
    : 0;

  return {
    specimenTemperatureK: T,
    criticalTempK: Tc,
    appliedFieldMt: Bapp,
    criticalFieldAtTempMt: BcT,
    isSuperconducting: isSuper,
    meissnerFraction: +twoFluidFraction.toFixed(3),
    londonPenetrationNm: londonNm,
    internalMagneticFieldMt: Binside,
    levitationHeightMm: levHeightMm,
  };
}

// ============================================================================
// 6. BLACK HOLE AND GRAVITATIONAL LENSING EXPLORER
// ============================================================================
export interface BlackHoleLensingMetrics {
  blackHoleMassSolar: number;
  impactParameterRs: number; // b / r_s
  sourceAlignmentOffset: number;
  schwarzschildRadiusKm: number; // r_s = 2GM/c^2 ≈ 2.953 * (M/M_sun) km
  photonSphereRadiusKm: number; // r_ph = 1.5 * r_s
  criticalImpactParameterRs: number; // b_crit = (3*sqrt(3)/2) * r_s ≈ 2.598 r_s
  isPhotonCaptured: boolean; // true if b <= b_crit
  deflectionAngleDeg: number; // alpha = (4GM / (c^2 b)) = 2 r_s / b (plus strong-field term)
  einsteinRingAngularScale: number; // normalized angular radius
}

export function calculateBlackHoleLensingMetrics(params: {
  blackHoleMassSolar?: number;
  impactParameterRs?: number;
  sourceAlignmentOffset?: number;
}): BlackHoleLensingMetrics {
  const massSolar = Math.max(1, Number(params.blackHoleMassSolar ?? 20));
  const bRs = Math.max(1.2, Number(params.impactParameterRs ?? 3.5));
  const offset = Number(params.sourceAlignmentOffset ?? 0);

  const rsKm = +(2.95325 * massSolar).toFixed(2);
  const rPhKm = +(1.5 * rsKm).toFixed(2);
  const bCritRs = +((3 * Math.sqrt(3)) / 2).toFixed(3); // 2.598 r_s
  const isCaptured = bRs <= bCritRs;

  // Weak-field Einstein angle is alpha = 2 / (b/r_s) radians, enhanced near b_crit
  let deflectionDeg = 0;
  if (isCaptured) {
    deflectionDeg = 360; // Photon spirals into event horizon
  } else {
    const weakRad = 2.0 / bRs;
    const strongEnhancement = 1 + 1.15 / Math.pow(bRs - bCritRs + 0.35, 1.2);
    deflectionDeg = +Math.min(270, ((weakRad * strongEnhancement * 180) / Math.PI)).toFixed(1);
  }

  const einsteinScale = +(Math.sqrt(massSolar / 20) * (1 / (1 + Math.abs(offset) * 0.4))).toFixed(2);

  return {
    blackHoleMassSolar: massSolar,
    impactParameterRs: bRs,
    sourceAlignmentOffset: offset,
    schwarzschildRadiusKm: rsKm,
    photonSphereRadiusKm: rPhKm,
    criticalImpactParameterRs: bCritRs,
    isPhotonCaptured: isCaptured,
    deflectionAngleDeg: deflectionDeg,
    einsteinRingAngularScale: einsteinScale,
  };
}

// ============================================================================
// 7. QUANTUM TUNNELLING EXPLORER
// ============================================================================
export interface QuantumTunnellingMetrics {
  particleEnergyEv: number; // E in eV
  barrierHeightEv: number; // V0 in eV
  barrierWidthNm: number; // a in nm
  regime: 'tunnelling' | 'over-barrier' | 'critical';
  waveNumberK1NmInv: number; // k1 = sqrt(2 m E) / hbar in nm^-1
  decayConstantKappaNmInv: number; // kappa = sqrt(2 m (V0 - E)) / hbar in nm^-1 (or k2 if E > V0)
  transmissionProbability: number; // T in [0, 1]
  reflectionProbability: number; // R = 1 - T in [0, 1]
  transmittedAmplitudeRatio: number; // sqrt(T)
}

export function calculateQuantumTunnellingMetrics(params: {
  particleEnergyEv?: number;
  barrierHeightEv?: number;
  barrierWidthNm?: number;
}): QuantumTunnellingMetrics {
  const E = Math.max(0.2, Number(params.particleEnergyEv ?? 4.0));
  const V0 = Math.max(0.5, Number(params.barrierHeightEv ?? 6.0));
  const aNm = Math.max(0.05, Number(params.barrierWidthNm ?? 0.35));

  const EJ = E * ELEMENTARY_CHARGE_E;
  const V0J = V0 * ELEMENTARY_CHARGE_E;
  const aM = aNm * 1e-9;

  // Use effective electron mass scale (0.12 m_e, typical semiconductor conduction band electron)
  // so 0.1–1.0 nm barriers at 1–10 eV span the full pedagogical range of T from ~1% to ~99%
  const mEff = 0.12 * ELECTRON_MASS_ME;
  const k1M = Math.sqrt(2 * mEff * EJ) / PLANCK_HBAR;
  const k1Nm = k1M * 1e-9;

  let T = 0;
  let kappaNm = 0;
  let regime: QuantumTunnellingMetrics['regime'] = 'tunnelling';

  if (Math.abs(E - V0) < 1e-4) {
    regime = 'critical';
    const factor = (mEff * aM * aM * V0J) / (2 * PLANCK_HBAR * PLANCK_HBAR);
    T = 1 / (1 + factor);
    kappaNm = 0;
  } else if (E < V0) {
    regime = 'tunnelling';
    const kappaM = Math.sqrt(2 * mEff * (V0J - EJ)) / PLANCK_HBAR;
    kappaNm = kappaM * 1e-9;
    const sinhVal = Math.sinh(kappaM * aM);
    const denom = 1 + ((V0 * V0) / (4 * E * (V0 - E))) * (sinhVal * sinhVal);
    T = 1 / denom;
  } else {
    regime = 'over-barrier';
    const k2M = Math.sqrt(2 * mEff * (EJ - V0J)) / PLANCK_HBAR;
    kappaNm = k2M * 1e-9;
    const sinVal = Math.sin(k2M * aM);
    const denom = 1 + ((V0 * V0) / (4 * E * (E - V0))) * (sinVal * sinVal);
    T = 1 / denom;
  }

  T = Math.max(0, Math.min(1, T));
  const R = 1 - T;

  return {
    particleEnergyEv: E,
    barrierHeightEv: V0,
    barrierWidthNm: aNm,
    regime,
    waveNumberK1NmInv: +k1Nm.toFixed(2),
    decayConstantKappaNmInv: +kappaNm.toFixed(2),
    transmissionProbability: +T.toFixed(4),
    reflectionProbability: +R.toFixed(4),
    transmittedAmplitudeRatio: +Math.sqrt(T).toFixed(3),
  };
}
