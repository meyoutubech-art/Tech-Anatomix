/**
 * TECH-ANATOMIX / VIZLAB — ADVANCED PHYSICS BATCH 4 MATHEMATICAL SIMULATION ENGINE (MODELS 62–68)
 *
 * Provides deterministic, unit-consistent physics calculations and state updates for:
 * 62. Maxwell's Equations & Electromagnetic Field Explorer
 * 63. AC Circuits, RLC Resonance & Impedance Laboratory
 * 64. Lenses, Optical Instruments & Image Formation Laboratory
 * 65. Doppler Ultrasound & Medical Flow Imaging Explorer
 * 66. Earth's Magnetic Field & Magnetosphere Explorer
 * 67. Semiconductor p–n Junction, Band Gap & Diode Explorer
 * 68. Radioactive Decay, Half-Life & Alpha–Beta–Gamma Radiation Lab
 */

export const VACUUM_PERMITTIVITY_EPSILON0 = 8.8541878128e-12; // F/m (C²/(N·m²))
export const VACUUM_PERMEABILITY_MU0 = 1.25663706212e-6; // N/A² (T·m/A)
export const COULOMB_CONSTANT_KE = 8.9875517923e9; // N·m²/C²
export const ELEMENTARY_CHARGE_C = 1.602176634e-19; // C
export const BOLTZMANN_CONSTANT_EV_K = 8.617333262e-5; // eV/K

// ============================================================================
// 62. MAXWELL'S EQUATIONS & ELECTROMAGNETIC FIELD EXPLORER
// ============================================================================
export interface MaxwellEquationsMetrics {
  q1MicroC: number;
  q2MicroC: number;
  netEnclosedChargeMicroC: number;
  chargeSeparationM: number;
  conductorCurrentAmps: number;
  oscillationFrequencyMhz: number;
  electricFluxVm: number; // Phi_E = Q_enc / epsilon_0 (V·m)
  electricFluxMegaVm: number;
  magneticClosedSurfaceFluxWb: number; // Strictly 0.000 Wb (Gauss's Law for Magnetism)
  midpointElectricFieldKVm: number;
  magneticFieldAtRefRadiusMicroT: number; // B = mu_0 * I / (2 * pi * r) at r = 0.25 m
  displacementCurrentAmps: number; // I_d = epsilon_0 * dPhi_E/dt
  inducedFaradayEmfVolts: number; // |E_ind| = |dPhi_B/dt|
  emWavelengthMeters: number; // lambda = c / f
  emWaveElectricAmplitudeVm: number;
  emWaveMagneticAmplitudeNanoT: number; // B_0 = E_0 / c
  activeLawSummary: string;
}

export function calculateMaxwellEquationsMetrics(params: {
  primaryChargeMicroC?: number;
  secondaryChargeMicroC?: number;
  chargeSeparationM?: number;
  conductorCurrentAmps?: number;
  fieldOscillationFreqMhz?: number;
  explorerViewMode?: string;
  chargeArrangementPreset?: string;
}): MaxwellEquationsMetrics {
  const q1 = Math.max(0.5, Math.min(30, Number(params.primaryChargeMicroC ?? 8.0)));
  const preset = String(params.chargeArrangementPreset || 'dipole_opposite');
  let q2 = Math.max(-30, Math.min(30, Number(params.secondaryChargeMicroC ?? -8.0)));
  if (preset === 'dipole_opposite') {
    q2 = -q1;
  } else if (preset === 'like_repelling') {
    q2 = q1;
  } else if (preset === 'single_monopole') {
    q2 = 0;
  }

  const sep = Math.max(0.4, Math.min(3.0, Number(params.chargeSeparationM ?? 1.4)));
  const currentI = Math.max(0, Math.min(50, Number(params.conductorCurrentAmps ?? 12.0)));
  const freqMhz = Math.max(5, Math.min(500, Number(params.fieldOscillationFreqMhz ?? 100)));
  const viewMode = String(params.explorerViewMode || 'all_coupled');

  const netEnclosedMicroC = +(q1 + q2).toFixed(2);
  // Flux through primary Gaussian sphere enclosing q1: Phi_E = q1 / epsilon_0
  const phiEVm = (q1 * 1e-6) / VACUUM_PERMITTIVITY_EPSILON0;
  const phiEMegaVm = +(phiEVm / 1e6).toFixed(3);

  const halfSep = Math.max(0.2, sep * 0.5);
  const eMidVm = (COULOMB_CONSTANT_KE * Math.abs(q1 - q2) * 1e-6) / (halfSep * halfSep);
  const midpointElectricFieldKVm = +(eMidVm / 1e3).toFixed(2);

  // Ampère-Maxwell Law around conductor & capacitor gap at reference radius r = 0.25 m:
  const rRef = 0.25;
  const bTesla = (VACUUM_PERMEABILITY_MU0 * currentI) / (2 * Math.PI * rRef);
  const magneticFieldAtRefRadiusMicroT = +(bTesla * 1e6).toFixed(2);

  // In a charging capacitor gap, displacement current I_d = epsilon_0 * dPhi_E/dt equals conduction current I_c
  const displacementCurrentAmps = +currentI.toFixed(2);

  // Faraday's Law induced EMF amplitude around a reference loop linking time-varying B(t):
  const omegaScaled = (2 * Math.PI * freqMhz) / 100;
  const inducedFaradayEmfVolts = +(magneticFieldAtRefRadiusMicroT * 0.045 * omegaScaled).toFixed(2);

  // Coupled Electromagnetic Wave: c = 299.792458 m·MHz
  const emWavelengthMeters = +(299.792458 / freqMhz).toFixed(2);
  const emWaveElectricAmplitudeVm = +(midpointElectricFieldKVm * 1.5).toFixed(1);
  const emWaveMagneticAmplitudeNanoT = +(emWaveElectricAmplitudeVm / 0.299792458).toFixed(1);

  let activeLawSummary =
    "All 4 Maxwell's Equations Active: Gauss (E & B), Faraday Induction & Ampère–Maxwell Displacement Current.";
  if (viewMode === 'electric_gauss' || viewMode === 'electric_field') {
    activeLawSummary = `Gauss's Law for Electricity: ∮ E·dA = Q_enc/ε₀ = ${phiEMegaVm} MV·m around +q₁ (${q1} μC).`;
  } else if (viewMode === 'magnetic_ampere_maxwell' || viewMode === 'magnetic_field') {
    activeLawSummary = `Ampère–Maxwell Law: ∮ B·dl = μ₀(I_c + ε₀ dΦ_E/dt) produces B = ${magneticFieldAtRefRadiusMicroT} μT (∮ B·dA = 0).`;
  } else if (viewMode === 'electromagnetic_wave' || viewMode === 'em_wave') {
    activeLawSummary = `Faraday + Ampère–Maxwell Wave Coupling: E ⊥ B ⊥ c with λ = ${emWavelengthMeters} m at f = ${freqMhz} MHz.`;
  }

  return {
    q1MicroC: q1,
    q2MicroC: q2,
    netEnclosedChargeMicroC: netEnclosedMicroC,
    chargeSeparationM: sep,
    conductorCurrentAmps: currentI,
    oscillationFrequencyMhz: freqMhz,
    electricFluxVm: Math.round(phiEVm),
    electricFluxMegaVm: phiEMegaVm,
    magneticClosedSurfaceFluxWb: 0,
    midpointElectricFieldKVm,
    magneticFieldAtRefRadiusMicroT,
    displacementCurrentAmps,
    inducedFaradayEmfVolts,
    emWavelengthMeters,
    emWaveElectricAmplitudeVm,
    emWaveMagneticAmplitudeNanoT,
    activeLawSummary,
  };
}

// ============================================================================
// 63. AC CIRCUITS, RLC RESONANCE & IMPEDANCE LABORATORY
// ============================================================================
export interface AcRlcCircuitMetrics {
  circuitConfiguration: 'rlc_series' | 'r_only' | 'rc_series' | 'rl_series';
  circuitTopologyMode: 'rlc_series' | 'r_only' | 'rc_series' | 'rl_series';
  frequencyHz: number;
  drivingFrequencyHz: number;
  resonanceFrequencyHz: number; // f_0 = 1 / (2*pi*sqrt(L*C))
  resistanceOhms: number;
  resistanceOhm: number;
  inductanceMilliH: number;
  inductanceMh: number;
  capacitanceMicroF: number;
  capacitanceUf: number;
  inductiveReactanceOhms: number; // X_L = 2*pi*f*L
  inductiveReactanceOhm: number;
  capacitiveReactanceOhms: number; // X_C = 1 / (2*pi*f*C)
  capacitiveReactanceOhm: number;
  netReactanceOhms: number; // X_L - X_C
  netReactanceOhm: number;
  impedanceOhms: number; // Z = sqrt(R^2 + (X_L - X_C)^2)
  totalImpedanceOhm: number;
  peakVoltageV: number;
  rmsVoltageV: number; // V_rms = V_peak / sqrt(2)
  peakCurrentAmps: number; // I_peak = V_peak / Z
  rmsCurrentAmps: number; // I_rms = V_rms / Z
  phaseAngleDeg: number; // phi = atan2(X_L - X_C, R) in degrees
  powerFactor: number; // cos(phi) = R / Z
  realPowerWatts: number; // P_avg = V_rms * I_rms * cos(phi)
  averageRealPowerWatts: number;
  rmsVoltageResistorV: number; // I_rms * R
  rmsVoltageInductorV: number; // I_rms * X_L
  rmsVoltageCapacitorV: number; // I_rms * X_C
  qualityFactorQ: number;
  isAtResonance: boolean;
  regimeLabel: string;
  phaseRegimeLabel: string;
}

export function calculateAcRlcCircuitMetrics(params: {
  acFrequencyHz?: number;
  drivingFrequencyHz?: number;
  resistanceOhms?: number;
  resistanceOhm?: number;
  inductanceMilliH?: number;
  inductanceMh?: number;
  capacitanceMicroF?: number;
  capacitanceUf?: number;
  peakVoltageV?: number;
  circuitConfiguration?: string;
  circuitTopologyMode?: string;
  tuneToResonance?: boolean;
}): AcRlcCircuitMetrics {
  const modeRaw = String(params.circuitConfiguration || params.circuitTopologyMode || 'rlc_series');
  const mode: AcRlcCircuitMetrics['circuitConfiguration'] =
    modeRaw === 'r_only' || modeRaw === 'rc_series' || modeRaw === 'rl_series'
      ? modeRaw
      : 'rlc_series';

  const R = Math.max(1.0, Math.min(200, Number(params.resistanceOhms ?? params.resistanceOhm ?? 25)));
  const L_mH = Math.max(1.0, Math.min(1000, Number(params.inductanceMilliH ?? params.inductanceMh ?? 40)));
  const C_uF = Math.max(1.0, Math.min(500, Number(params.capacitanceMicroF ?? params.capacitanceUf ?? 60)));
  const V_peak = Math.max(5.0, Math.min(400, Number(params.peakVoltageV ?? 120)));

  const L_H = L_mH * 1e-3;
  const C_F = C_uF * 1e-6;

  // Ideal series-RLC resonance frequency: f_0 = 1 / (2 * pi * sqrt(L * C))
  const f0 = 1.0 / (2 * Math.PI * Math.sqrt(L_H * C_F));
  const resonanceFrequencyHz = +f0.toFixed(2);

  let f = Math.max(5.0, Math.min(500, Number(params.acFrequencyHz ?? params.drivingFrequencyHz ?? 103)));
  if (params.tuneToResonance && mode === 'rlc_series') {
    f = resonanceFrequencyHz;
  }

  const hasInductor = mode === 'rlc_series' || mode === 'rl_series';
  const hasCapacitor = mode === 'rlc_series' || mode === 'rc_series';

  const X_L = hasInductor ? 2 * Math.PI * f * L_H : 0;
  const X_C = hasCapacitor ? 1.0 / (2 * Math.PI * f * C_F) : 0;
  const X_net = X_L - X_C;

  // Total Impedance Z = sqrt(R^2 + (X_L - X_C)^2)
  const Z = Math.sqrt(R * R + X_net * X_net);

  // Peak vs RMS quantities: V_rms = V_peak / sqrt(2), I_rms = I_peak / sqrt(2)
  const V_rms = V_peak / Math.SQRT2;
  const I_peak = V_peak / Z;
  const I_rms = V_rms / Z;

  // Phase angle phi between source voltage V(t) and circuit current I(t): tan(phi) = (X_L - X_C) / R
  const phiRad = Math.atan2(X_net, R);
  const phiDeg = (phiRad * 180) / Math.PI;
  const pf = Math.cos(phiRad);

  // Average dissipated real power P_avg = V_rms * I_rms * cos(phi)
  const P_avg = V_rms * I_rms * pf;

  const V_R_rms = I_rms * R;
  const V_L_rms = I_rms * X_L;
  const V_C_rms = I_rms * X_C;

  const qualityFactorQ = +((1.0 / R) * Math.sqrt(L_H / C_F)).toFixed(2);
  const isAtResonance = mode === 'rlc_series' && Math.abs(X_L - X_C) / R < 0.08;

  let regimeLabel = 'Purely Resistive (φ = 0°)';
  if (isAtResonance) {
    regimeLabel = 'Series RLC Resonance (X_L ≈ X_C, Z = R min, φ ≈ 0°)';
  } else if (X_net > 0.5) {
    regimeLabel = `Inductive Dominance (X_L > X_C, V Leads I by +${Math.abs(phiDeg).toFixed(1)}°)`;
  } else if (X_net < -0.5) {
    regimeLabel = `Capacitive Dominance (X_C > X_L, V Lags I by −${Math.abs(phiDeg).toFixed(1)}°)`;
  }

  return {
    circuitConfiguration: mode,
    circuitTopologyMode: mode,
    frequencyHz: +f.toFixed(2),
    drivingFrequencyHz: +f.toFixed(2),
    resonanceFrequencyHz,
    resistanceOhms: +R.toFixed(1),
    resistanceOhm: +R.toFixed(1),
    inductanceMilliH: hasInductor ? +L_mH.toFixed(1) : 0,
    inductanceMh: hasInductor ? +L_mH.toFixed(1) : 0,
    capacitanceMicroF: hasCapacitor ? +C_uF.toFixed(1) : 0,
    capacitanceUf: hasCapacitor ? +C_uF.toFixed(1) : 0,
    inductiveReactanceOhms: +X_L.toFixed(2),
    inductiveReactanceOhm: +X_L.toFixed(2),
    capacitiveReactanceOhms: +X_C.toFixed(2),
    capacitiveReactanceOhm: +X_C.toFixed(2),
    netReactanceOhms: +X_net.toFixed(2),
    netReactanceOhm: +X_net.toFixed(2),
    impedanceOhms: +Z.toFixed(2),
    totalImpedanceOhm: +Z.toFixed(2),
    peakVoltageV: +V_peak.toFixed(1),
    rmsVoltageV: +V_rms.toFixed(2),
    peakCurrentAmps: +I_peak.toFixed(3),
    rmsCurrentAmps: +I_rms.toFixed(3),
    phaseAngleDeg: +phiDeg.toFixed(1),
    powerFactor: +pf.toFixed(3),
    realPowerWatts: +P_avg.toFixed(1),
    averageRealPowerWatts: +P_avg.toFixed(1),
    rmsVoltageResistorV: +V_R_rms.toFixed(2),
    rmsVoltageInductorV: +V_L_rms.toFixed(2),
    rmsVoltageCapacitorV: +V_C_rms.toFixed(2),
    qualityFactorQ,
    isAtResonance,
    regimeLabel,
    phaseRegimeLabel: regimeLabel,
  };
}

// ============================================================================
// 64. LENSES, OPTICAL INSTRUMENTS & IMAGE FORMATION LABORATORY
// ============================================================================
/**
 * Sign Convention (Cartesian Thin-Lens Convention):
 * - Light propagates from left to right (+x).
 * - Optical center of primary lens is at x = 0.
 * - Object is placed to the left of the lens at coordinate u = -|u| < 0.
 * - Converging (convex) lens has f > 0; diverging (concave) lens has f < 0.
 * - Cartesian Thin-Lens Equation: 1/f = 1/v - 1/u  ==>  1/v = 1/f + 1/u.
 * - Image coordinate v > 0 (right of lens) => Real image; v < 0 (left of lens) => Virtual image.
 * - Lateral Magnification: m = h_i / h_o = v / u
 *   (m < 0 => Inverted image; m > 0 => Upright image).
 */
export interface ThinLensOpticsMetrics {
  opticalInstrumentMode: string;
  focalLengthCm: number; // signed f (+ for convex, - for concave)
  objectDistanceMagnitudeCm: number; // |u| > 0
  objectCoordUCm: number; // u = -|u| < 0
  imageCoordVCm: number; // v from 1/f = 1/v - 1/u
  lateralMagnificationM: number; // m = v / u
  objectHeightCm: number;
  imageHeightCm: number; // h_i = m * h_o
  imageNature: 'Real' | 'Virtual' | 'At Infinity';
  imageOrientation: 'Inverted' | 'Upright' | 'Collimated';
  isAtInfinity: boolean;
  eyepieceFocalLengthCm: number;
  instrumentAngularMagnification: number;
  opticalPowerDiopters: number; // P = 100 / f(cm)
  regimeExplanation: string;
}

export function calculateThinLensOpticsMetrics(params: {
  focalLengthMagnitudeCm?: number;
  focalLengthCm?: number;
  objectDistanceMagnitudeCm?: number;
  objectDistanceCm?: number;
  objectHeightCm?: number;
  eyepieceFocalLengthCm?: number;
  opticalInstrumentMode?: string;
  lensType?: string;
}): ThinLensOpticsMetrics {
  const mode = String(
    params.opticalInstrumentMode ||
      (params.lensType === 'diverging_concave' ? 'single_diverging' : 'single_converging')
  );
  const isDiverging = mode === 'single_diverging' || params.lensType === 'diverging_concave';

  const absF = Math.max(
    4.0,
    Math.min(50.0, Math.abs(Number(params.focalLengthMagnitudeCm ?? params.focalLengthCm ?? 18.0)))
  );
  const f = isDiverging ? -absF : absF;

  let d_o = Math.max(
    3.0,
    Math.min(80.0, Math.abs(Number(params.objectDistanceMagnitudeCm ?? params.objectDistanceCm ?? 32.0)))
  );
  if (mode === 'simple_magnifier' && d_o >= absF) {
    // In simple magnifier preset, if |u| >= f, place object inside focal length at 0.65 * f
    d_o = +(absF * 0.65).toFixed(1);
  }

  const u = -d_o; // Cartesian coordinate left of lens (u < 0)
  const h_o = Math.max(0.5, Math.min(15.0, Number(params.objectHeightCm ?? 5.0)));
  const f_e = Math.max(3.0, Math.min(30.0, Number(params.eyepieceFocalLengthCm ?? 10.0)));

  const opticalPowerDiopters = +(100.0 / f).toFixed(2);

  // Cartesian Thin-Lens Equation: 1/f = 1/v - 1/u  ==>  1/v = 1/f + 1/u
  const invV = 1.0 / f + 1.0 / u;
  const isAtInfinity = Math.abs(invV) < 1e-4;

  let v = isAtInfinity ? 999.0 : +(1.0 / invV).toFixed(2);
  let m = isAtInfinity ? 0 : +(v / u).toFixed(2);
  let h_i = isAtInfinity ? 0 : +(m * h_o).toFixed(2);

  let imageNature: ThinLensOpticsMetrics['imageNature'] = 'At Infinity';
  let imageOrientation: ThinLensOpticsMetrics['imageOrientation'] = 'Collimated';

  if (!isAtInfinity) {
    imageNature = v > 0 ? 'Real' : 'Virtual';
    imageOrientation = m < 0 ? 'Inverted' : 'Upright';
  }

  let instrumentAngularMagnification = +Math.abs(m || 1).toFixed(2);
  if (mode === 'compound_microscope') {
    const mObj = isAtInfinity ? 2.0 : Math.abs(v / u);
    instrumentAngularMagnification = +(mObj * (25.0 / f_e)).toFixed(2);
  } else if (mode === 'astronomical_telescope') {
    instrumentAngularMagnification = +(absF / f_e).toFixed(2);
  } else if (mode === 'simple_magnifier') {
    instrumentAngularMagnification = +(25.0 / absF + 1.0).toFixed(2);
  }

  let regimeExplanation = '';
  if (isAtInfinity) {
    regimeExplanation = `Object at Primary Focal Point (|u| = f = ${absF} cm): Refracted rays emerge parallel; image is formed at infinity.`;
  } else if (isDiverging) {
    regimeExplanation = `Diverging (Concave) Lens (f = ${f} cm < 0): Refracted rays diverge; backward virtual extensions intersect at v = ${v} cm (Virtual, Upright, Diminished, m = +${m}).`;
  } else if (v > 0) {
    regimeExplanation = `Converging (Convex) Lens with |u| = ${d_o} cm > f (${absF} cm): Refracted rays physically intersect on the right at v = +${v} cm (Real, Inverted, m = ${m}).`;
  } else {
    regimeExplanation = `Simple Magnifier Regime (|u| = ${d_o} cm < f = ${absF} cm): Object inside focal length produces a magnified upright Virtual image on the left at v = ${v} cm (m = +${m}).`;
  }

  return {
    opticalInstrumentMode: mode,
    focalLengthCm: +f.toFixed(2),
    objectDistanceMagnitudeCm: +d_o.toFixed(2),
    objectCoordUCm: +u.toFixed(2),
    imageCoordVCm: v,
    lateralMagnificationM: m,
    objectHeightCm: +h_o.toFixed(2),
    imageHeightCm: h_i,
    imageNature,
    imageOrientation,
    isAtInfinity,
    eyepieceFocalLengthCm: +f_e.toFixed(2),
    instrumentAngularMagnification,
    opticalPowerDiopters,
    regimeExplanation,
  };
}

export const calculateLensesOpticsMetrics = calculateThinLensOpticsMetrics;

// ============================================================================
// 65. DOPPLER ULTRASOUND & MEDICAL FLOW IMAGING EXPLORER
// ============================================================================
export interface DopplerUltrasoundMetrics {
  sourceFrequencyMhz: number;
  probeFrequencyMhz: number;
  targetVelocityMs: number;
  bloodVelocityMs: number;
  beamAngleDeg: number;
  cosTheta: number;
  acousticSpeedMs: number;
  tissueSoundSpeedMs: number;
  vesselDepthCm: number;
  pulseEchoRoundTripMicroSec: number;
  dopplerShiftHz: number; // Delta f = +/- 2 * f_0 * v * cos(theta) / c
  dopplerShiftKhz: number;
  receivedFrequencyMhz: number;
  motionStateLabel: string;
  educationalDisclaimer: string;
}

export function calculateDopplerUltrasoundMetrics(params: {
  sourceFrequencyMhz?: number;
  probeFrequencyMhz?: number;
  targetVelocityMs?: number;
  bloodVelocityMs?: number;
  beamAngleDeg?: number;
  vesselDepthCm?: number;
  acousticSpeedMs?: number;
  tissueSoundSpeedMs?: number;
  targetMotionMode?: string;
  flowDirection?: string;
}): DopplerUltrasoundMetrics {
  const f0Mhz = Math.max(
    1.0,
    Math.min(15.0, Number(params.sourceFrequencyMhz ?? params.probeFrequencyMhz ?? 5.0))
  );
  const rawVel = Math.max(
    0.0,
    Math.min(3.0, Number(params.targetVelocityMs ?? params.bloodVelocityMs ?? 0.75))
  );
  const thetaDeg = Math.max(0, Math.min(90, Number(params.beamAngleDeg ?? 45)));
  const depthCm = Math.max(1.0, Math.min(12.0, Number(params.vesselDepthCm ?? 4.0)));
  const cTissue = Math.max(
    1400,
    Math.min(1700, Number(params.acousticSpeedMs ?? params.tissueSoundSpeedMs ?? 1540))
  );

  const modeRaw = String(params.targetMotionMode || params.flowDirection || 'approaching_flow');
  let dirSign = 1;
  let motionStateLabel = 'Approaching Flow (+Δf)';
  if (modeRaw === 'receding_flow' || modeRaw === 'away_from_probe') {
    dirSign = -1;
    motionStateLabel = 'Receding Flow (−Δf)';
  } else if (modeRaw === 'stationary_target' || rawVel === 0) {
    dirSign = 0;
    motionStateLabel = 'Stationary Reflector';
  }

  const vEff = dirSign === 0 ? 0 : rawVel;
  const cosTheta = Math.abs(thetaDeg - 90) < 1e-6 ? 0 : Math.cos((thetaDeg * Math.PI) / 180);

  // Double Doppler Shift for ultrasound reflection off moving erythrocytes (v << c):
  // Delta f = 2 * f_0 * v * cos(theta) / c
  const f0Hz = f0Mhz * 1e6;
  const deltaFHz = dirSign * ((2 * f0Hz * vEff * cosTheta) / cTissue);
  const dopplerShiftHz = Math.round(deltaFHz);
  const dopplerShiftKhz = +(deltaFHz / 1000).toFixed(2);
  const receivedFrequencyMhz = +(f0Mhz + deltaFHz / 1e6).toFixed(5);

  // Pulse-echo round-trip time: t_echo = 2 * d / c (in microseconds)
  const depthMeters = depthCm * 0.01;
  const pulseEchoRoundTripMicroSec = +(((2 * depthMeters) / cTissue) * 1e6).toFixed(1);

  return {
    sourceFrequencyMhz: +f0Mhz.toFixed(2),
    probeFrequencyMhz: +f0Mhz.toFixed(2),
    targetVelocityMs: +vEff.toFixed(2),
    bloodVelocityMs: +vEff.toFixed(2),
    beamAngleDeg: thetaDeg,
    cosTheta: +cosTheta.toFixed(3),
    acousticSpeedMs: cTissue,
    tissueSoundSpeedMs: cTissue,
    vesselDepthCm: +depthCm.toFixed(1),
    pulseEchoRoundTripMicroSec,
    dopplerShiftHz,
    dopplerShiftKhz,
    receivedFrequencyMhz,
    motionStateLabel,
    educationalDisclaimer:
      'Educational Physics Simplification: Assumes uniform plug flow and v ≪ c in homogeneous soft tissue (c ≈ 1540 m/s); not a clinical diagnostic tool.',
  };
}

// ============================================================================
// 66. EARTH'S MAGNETIC FIELD & MAGNETOSPHERE EXPLORER
// ============================================================================
export interface EarthMagnetosphereMetrics {
  solarWindVelocityKms: number;
  solarWindSpeedKms: number;
  solarWindDensityCm3: number;
  dipoleTiltDeg: number;
  earthDipoleMomentFactor: number;
  equatorialSurfaceFieldMicroT: number;
  polarSurfaceFieldMicroT: number;
  dynamicPressureNpa: number; // P_dyn = m_p * n * v^2 in nanoPascals
  solarWindDynamicPressureNpa: number;
  magnetopauseStandoffRe: number; // Dayside Chapman-Ferraro standoff distance in Earth radii R_E
  bowShockStandoffRe: number; // ~1.28 * R_mp
  auroralLatitudeDeg: number;
  auroralOvalIntensityPct: number;
  geomagneticStormLevel: string;
}

export function calculateEarthMagnetosphereMetrics(params: {
  solarWindVelocityKms?: number;
  solarWindSpeedKms?: number;
  solarWindDensityCm3?: number;
  dipoleTiltDeg?: number;
  earthDipoleMomentFactor?: number;
  dipoleStrengthMicroT?: number;
}): EarthMagnetosphereMetrics {
  const vSw = Math.max(
    200,
    Math.min(1200, Number(params.solarWindVelocityKms ?? params.solarWindSpeedKms ?? 420))
  );
  const nSw = Math.max(1, Math.min(50, Number(params.solarWindDensityCm3 ?? 6)));
  const tilt = Math.max(0, Math.min(35, Number(params.dipoleTiltDeg ?? 11.5)));
  const momentFactor = Math.max(
    0.4,
    Math.min(
      2.5,
      params.earthDipoleMomentFactor !== undefined
        ? Number(params.earthDipoleMomentFactor)
        : params.dipoleStrengthMicroT !== undefined
          ? Number(params.dipoleStrengthMicroT) / 31.2
          : 1.0
    )
  );

  const bEqMicroT = +(31.2 * momentFactor).toFixed(1);
  const bPolarMicroT = +(2.0 * bEqMicroT).toFixed(1);

  // Solar wind dynamic ram pressure: P_dyn ≈ 1.6726e-6 * n(cm^-3) * (v(km/s))^2 (in nPa)
  const pDynNpa = +(1.6726e-6 * nSw * vSw * vSw).toFixed(2);

  // Chapman-Ferraro dayside magnetopause standoff distance (R_mp in Earth radii R_E):
  // Standard reference: R_mp0 ≈ 10.0 R_E at B_eq = 31.2 uT and P_dyn = 1.8 nPa
  const rMp =
    10.0 * Math.cbrt(momentFactor) * Math.pow(Math.max(0.08, pDynNpa / 1.8), -1.0 / 6.0);
  const magnetopauseStandoffRe = +Math.max(5.2, Math.min(14.5, rMp)).toFixed(2);
  const bowShockStandoffRe = +(magnetopauseStandoffRe * 1.28).toFixed(2);

  // Open-closed field line auroral boundary latitude: cos(lambda_a) ≈ 1 / sqrt(R_mp)
  const cosLat = 1.0 / Math.sqrt(Math.max(2.5, magnetopauseStandoffRe));
  const auroralLatitudeDeg = +((Math.acos(cosLat) * 180) / Math.PI).toFixed(1);

  const auroralOvalIntensityPct = Math.min(100, Math.round(25 + pDynNpa * 8.5));

  let geomagneticStormLevel = 'Quiet Geospace (Kp 1–2)';
  if (pDynNpa >= 12.0 || vSw >= 700) {
    geomagneticStormLevel = 'Severe Geomagnetic Storm (Kp 7–9)';
  } else if (pDynNpa >= 4.5 || vSw >= 550) {
    geomagneticStormLevel = 'Active Solar Wind Stream (Kp 4–6)';
  }

  return {
    solarWindVelocityKms: vSw,
    solarWindSpeedKms: vSw,
    solarWindDensityCm3: nSw,
    dipoleTiltDeg: tilt,
    earthDipoleMomentFactor: +momentFactor.toFixed(2),
    equatorialSurfaceFieldMicroT: bEqMicroT,
    polarSurfaceFieldMicroT: bPolarMicroT,
    dynamicPressureNpa: pDynNpa,
    solarWindDynamicPressureNpa: pDynNpa,
    magnetopauseStandoffRe,
    bowShockStandoffRe,
    auroralLatitudeDeg,
    auroralOvalIntensityPct,
    geomagneticStormLevel,
  };
}

// ============================================================================
// 67. SEMICONDUCTOR p–n JUNCTION, BAND GAP & DIODE EXPLORER
// ============================================================================
export interface SemiconductorPnJunctionMetrics {
  materialKey: string;
  materialName: string;
  bandGapEv: number; // E_g
  builtInPotentialV: number; // V_bi
  appliedBiasV: number; // V_bias
  biasVoltageV: number;
  temperatureKelvin: number;
  thermalVoltageMv: number; // V_T = k_B * T / q in mV
  barrierPotentialEv: number; // q * max(0.05, V_bi - V_bias)
  depletionWidthMicrons: number; // W proportional to sqrt(V_bi - V_bias)
  diodeCurrentMa: number; // Shockley diode current with series load limit
  conductionRegime: string;
}

export const SEMICONDUCTOR_MATERIALS: Record<
  string,
  { name: string; bandGapEv: number; vBiRef: number }
> = {
  silicon_si: { name: 'Silicon (Si)', bandGapEv: 1.12, vBiRef: 0.7 },
  silicon_1_12ev: { name: 'Silicon (Si)', bandGapEv: 1.12, vBiRef: 0.7 },
  germanium_ge: { name: 'Germanium (Ge)', bandGapEv: 0.66, vBiRef: 0.3 },
  germanium_0_66ev: { name: 'Germanium (Ge)', bandGapEv: 0.66, vBiRef: 0.3 },
  gallium_arsenide_gaas: { name: 'Gallium Arsenide (GaAs)', bandGapEv: 1.42, vBiRef: 1.2 },
  gallium_arsenide_1_42ev: { name: 'Gallium Arsenide (GaAs)', bandGapEv: 1.42, vBiRef: 1.2 },
};

export function calculateSemiconductorPnJunctionMetrics(params: {
  biasVoltageV?: number;
  appliedBiasV?: number;
  temperatureKelvin?: number;
  temperatureK?: number;
  dopingLevelScale?: number;
  dopingConcentrationScale?: number;
  semiconductorMaterial?: string;
}): SemiconductorPnJunctionMetrics {
  const matKey = String(params.semiconductorMaterial || 'silicon_si');
  const matInfo = SEMICONDUCTOR_MATERIALS[matKey] || SEMICONDUCTOR_MATERIALS.silicon_si;

  const T = Math.max(150, Math.min(500, Number(params.temperatureKelvin ?? params.temperatureK ?? 300)));
  const dopingScale = Math.max(
    0.4,
    Math.min(3.5, Number(params.dopingLevelScale ?? params.dopingConcentrationScale ?? 1.0))
  );
  const vBias = Math.max(-3.0, Math.min(2.0, Number(params.biasVoltageV ?? params.appliedBiasV ?? 0.65)));

  // Thermal voltage V_T = k_B * T / q (approx 25.85 mV at 300 K)
  const vThermalV = BOLTZMANN_CONSTANT_EV_K * T;
  const thermalVoltageMv = +(vThermalV * 1000).toFixed(2);

  // Built-in potential V_bi scales weakly with doping and temperature
  const vBi = Math.max(
    0.2,
    matInfo.vBiRef + vThermalV * Math.log(dopingScale) - 0.0008 * (T - 300)
  );

  // Effective potential barrier across depletion layer: q*(V_bi - V_bias)
  const barrierPotentialEv = +Math.max(0.05, vBi - vBias).toFixed(3);

  // Depletion width W = W_0 * sqrt(max(0.05, V_bi - V_bias) / (V_bi * dopingScale))
  const wMicrons = +(0.75 * Math.sqrt(barrierPotentialEv / (vBi * dopingScale))).toFixed(3);

  // Shockley Diode Equation with ideality factor n = 1.5 and realistic series limiting
  let diodeCurrentMa = 0;
  if (Math.abs(vBias) < 0.01) {
    diodeCurrentMa = 0;
  } else if (vBias < 0) {
    const iSatMa = 0.004 * Math.exp((T - 300) / 55);
    diodeCurrentMa = +(-iSatMa * (1 - Math.exp(vBias / (1.5 * vThermalV)))).toFixed(4);
  } else {
    const expTerm = Math.exp(Math.min(16, (vBias - vBi * 0.72) / (1.5 * vThermalV)));
    const shockleyMa = 1.8 * expTerm;
    const seriesLimitedMa = Math.max(0, (vBias - vBi * 0.65) * 95);
    diodeCurrentMa =
      vBias >= vBi * 0.85
        ? +Math.max(12.0, Math.min(125, Math.max(shockleyMa * 0.35, seriesLimitedMa))).toFixed(2)
        : +Math.min(8.5, shockleyMa * 0.2).toFixed(3);
  }

  let conductionRegime = 'Thermal Equilibrium (V = 0 V)';
  if (vBias < -0.02) {
    conductionRegime = 'Reverse-Biased Blocking (Widened W)';
  } else if (vBias >= vBi * 0.85) {
    conductionRegime = 'Forward-Biased Conduction (I_D Active)';
  } else if (vBias > 0.02) {
    conductionRegime = 'Forward Sub-Threshold Regime';
  }

  return {
    materialKey: matKey,
    materialName: matInfo.name,
    bandGapEv: matInfo.bandGapEv,
    builtInPotentialV: +vBi.toFixed(2),
    appliedBiasV: +vBias.toFixed(2),
    biasVoltageV: +vBias.toFixed(2),
    temperatureKelvin: T,
    thermalVoltageMv,
    barrierPotentialEv,
    depletionWidthMicrons: wMicrons,
    diodeCurrentMa,
    conductionRegime,
  };
}

export const calculateSemiconductorPnMetrics = calculateSemiconductorPnJunctionMetrics;

// ============================================================================
// 68. RADIOACTIVE DECAY, HALF-LIFE & ALPHA–BETA–GAMMA RADIATION LAB
// ============================================================================
export interface RadioactiveDecayMetrics {
  halfLifeSeconds: number;
  decayConstantPerSec: number; // lambda = ln(2) / t_1/2
  initialNucleiCount: number;
  elapsedHalfLives: number; // t / t_1/2
  remainingParentNuclei: number; // N(t) = N_0 * exp(-lambda * t)
  decayedDaughterNuclei: number; // N_0 - N(t)
  undecayedFractionPct: number;
  instantaneousActivityBq: number; // A(t) = lambda * N(t)
  leadShieldThicknessMm: number;
  deflectionFieldTesla: number;
  alphaTransmissionPct: number;
  betaTransmissionPct: number;
  gammaTransmissionPct: number; // I / I_0 = exp(-mu_Pb * x)
  geigerCountRateCps: number;
}

export function calculateRadioactiveDecayMetrics(params: {
  halfLifeSeconds?: number;
  initialNucleiCount?: number;
  leadShieldThicknessMm?: number;
  deflectionFieldTesla?: number;
  radiationTypeFilter?: string;
  absorberBarrierPreset?: string;
  simTime?: number;
}): RadioactiveDecayMetrics {
  const tHalf = Math.max(1.5, Math.min(60.0, Number(params.halfLifeSeconds ?? 8.0)));
  const n0 = Math.max(50, Math.min(2000, Math.round(Number(params.initialNucleiCount ?? 400))));
  const leadMm = Math.max(0, Math.min(60, Number(params.leadShieldThicknessMm ?? 16)));
  const bField = Math.max(0, Math.min(3.0, Number(params.deflectionFieldTesla ?? 0.8)));
  const radFilter = String(params.radiationTypeFilter || 'all_three_beams');
  const barrierPreset = String(params.absorberBarrierPreset || 'all_three_barriers');

  // Cyclic decay window of 4 half-lives so students can observe continuous decay & reset
  const rawTime = Math.max(0, Number(params.simTime ?? 0));
  const cycleWindowSec = tHalf * 4.0;
  const t = rawTime % cycleWindowSec;

  const lambda = Math.LN2 / tHalf;
  const elapsedHalfLives = +(t / tHalf).toFixed(2);
  const survivalFactor = Math.exp(-lambda * t);
  const remainingParentNuclei = Math.round(n0 * survivalFactor);
  const decayedDaughterNuclei = n0 - remainingParentNuclei;
  const undecayedFractionPct = +(survivalFactor * 100).toFixed(1);
  const instantaneousActivityBq = +(lambda * remainingParentNuclei).toFixed(1);

  const hasPaper = barrierPreset !== 'none_unshielded';
  const hasAluminum =
    barrierPreset === 'paper_and_aluminum' || barrierPreset === 'all_three_barriers';
  const hasLead = barrierPreset === 'all_three_barriers' && leadMm > 0;

  const alphaTrans = hasPaper ? 0 : 100;
  const betaTrans = hasAluminum ? 0 : hasPaper ? 88 : 100;
  const gammaTrans = hasLead ? +(100 * Math.exp(-0.085 * leadMm)).toFixed(1) : hasAluminum ? 96 : 100;

  let activeTransFactor = 0;
  if (radFilter === 'alpha_only') {
    activeTransFactor = alphaTrans / 100;
  } else if (radFilter === 'beta_only') {
    activeTransFactor = betaTrans / 100;
  } else if (radFilter === 'gamma_only') {
    activeTransFactor = gammaTrans / 100;
  } else {
    activeTransFactor = (alphaTrans + betaTrans + gammaTrans) / 300;
  }

  const geigerCountRateCps = +(instantaneousActivityBq * Math.max(0.02, activeTransFactor)).toFixed(1);

  return {
    halfLifeSeconds: +tHalf.toFixed(1),
    decayConstantPerSec: +lambda.toFixed(4),
    initialNucleiCount: n0,
    elapsedHalfLives,
    remainingParentNuclei,
    decayedDaughterNuclei,
    undecayedFractionPct,
    instantaneousActivityBq,
    leadShieldThicknessMm: leadMm,
    deflectionFieldTesla: +bField.toFixed(2),
    alphaTransmissionPct: alphaTrans,
    betaTransmissionPct: betaTrans,
    gammaTransmissionPct: gammaTrans,
    geigerCountRateCps,
  };
}
