/**
 * TECH-ANATOMIX — ADVANCED PHYSICS BATCH 2 MATHEMATICAL SIMULATION ENGINE (MODELS 48–54)
 *
 * Provides deterministic, unit-consistent physics calculations and state updates for:
 * 48. Faraday's Law: Electromagnetic Induction Explorer
 * 49. Electric Motor & Generator: Energy Conversion Explorer
 * 50. Electrical Transformer: AC Voltage and Magnetic Coupling Explorer
 * 51. Wave Interference & Diffraction Laboratory
 * 52. Optical Interference & Interferometer Explorer
 * 53. Fluid Dynamics: Bernoulli, Pressure & Vortex Flow Explorer
 * 54. Nuclear Fusion Reactor: Magnetic Confinement Explorer
 */

import { VACUUM_PERMEABILITY_MU0 } from './advancedPhysicsBatch1Engine';

// ============================================================================
// 48. FARADAY'S LAW: ELECTROMAGNETIC INDUCTION EXPLORER
// ============================================================================
export interface FaradayInductionMetrics {
  magnetPositionCm: number;
  magnetVelocityMs: number;
  magneticFieldTesla: number;
  coilTurnsN: number;
  instantaneousFluxMwb: number; // Phi_B in mWb
  fluxRateOfChangeWbS: number; // dPhi_B / dt in Wb/s
  inducedEmfVolts: number; // E = -N * dPhi_B / dt in V
  inducedCurrentMa: number; // I = E / R_circuit in mA
  lenzForceDirection: 'opposing-approach' | 'opposing-recession' | 'zero-stationary';
}

export function calculateFaradayInductionMetrics(params: {
  magnetPosition?: number;
  magnetVelocity?: number;
  magneticFieldStrength?: number;
  coilTurns?: number;
  reverseDirection?: boolean;
  simTime?: number;
  isPlaying?: boolean;
}): FaradayInductionMetrics {
  const basePosCm = Number(params.magnetPosition ?? -1.8);
  const rawVel = Math.max(0, Number(params.magnetVelocity ?? 1.6));
  const B0 = Math.max(0.1, Number(params.magneticFieldStrength ?? 1.0));
  const N = Math.max(10, Math.round(Number(params.coilTurns ?? 100)));
  const dirSign = params.reverseDirection ? -1 : 1;
  const isPlaying = params.isPlaying !== false;
  const t = Number(params.simTime ?? 0);

  // Effective position and velocity:
  // If velocity > 0 and playing, magnet oscillates smoothly around base offset;
  // if velocity == 0 or paused, magnet is stationary and dPhi/dt = 0.
  const effectiveSpeed = isPlaying ? rawVel : 0;
  const omega = effectiveSpeed * 1.35;
  const dynamicPosCm =
    effectiveSpeed > 0.001
      ? basePosCm * 0.35 + 2.2 * Math.sin(omega * t) * dirSign
      : basePosCm;
  const vxMs =
    effectiveSpeed > 0.001
      ? effectiveSpeed * Math.cos(omega * t) * dirSign
      : 0;

  // Gaussian dipole flux profile through coil cross-section (A_coil = 1.8e-3 m^2, characteristic width w = 1.6 cm)
  const coilAreaM2 = 1.8e-3;
  const widthCm = 1.65;
  const u = dynamicPosCm / widthCm;
  const gaussian = Math.exp(-u * u);

  // Instantaneous magnetic flux through one turn: Phi_B(x) = B0 * A * exp(-(x/w)^2)
  const phiWb = B0 * coilAreaM2 * gaussian * dirSign;
  const phiMwb = +(phiWb * 1000).toFixed(3);

  // Spatial derivative dPhi_B / dx (with x in meters, w_m = 0.0165 m)
  const widthM = widthCm * 0.01;
  const dPhiDx = B0 * coilAreaM2 * (-2 * u / widthM) * gaussian * dirSign;

  // Time derivative dPhi_B / dt = (dPhi_B / dx) * v_x
  const dPhiDt = dPhiDx * vxMs;

  // Faraday's Law with Lenz's negative sign: E = -N * dPhi_B / dt
  const emfVolts = +(-N * dPhiDt).toFixed(2);
  const circuitResistanceOhm = 12.0;
  const currentMa = +((emfVolts / circuitResistanceOhm) * 1000).toFixed(1);

  let lenzState: FaradayInductionMetrics['lenzForceDirection'] = 'zero-stationary';
  if (Math.abs(vxMs) > 0.01 && Math.abs(emfVolts) > 0.01) {
    // Approaching coil center (|x| decreasing) vs receding from coil center (|x| increasing)
    const approaching = dynamicPosCm * vxMs < 0;
    lenzState = approaching ? 'opposing-approach' : 'opposing-recession';
  }

  return {
    magnetPositionCm: +dynamicPosCm.toFixed(2),
    magnetVelocityMs: +vxMs.toFixed(2),
    magneticFieldTesla: B0,
    coilTurnsN: N,
    instantaneousFluxMwb: phiMwb,
    fluxRateOfChangeWbS: +dPhiDt.toFixed(4),
    inducedEmfVolts: Object.is(emfVolts, -0) ? 0 : emfVolts,
    inducedCurrentMa: Object.is(currentMa, -0) ? 0 : currentMa,
    lenzForceDirection: lenzState,
  };
}

// ============================================================================
// 49. ELECTRIC MOTOR & GENERATOR: ENERGY CONVERSION EXPLORER
// ============================================================================
export interface MotorGeneratorMetrics {
  operatingMode: 'motor_mode' | 'generator_mode';
  supplyVoltageV: number;
  magneticFieldT: number;
  rotationalSpeedRpm: number;
  angularVelocityRadS: number;
  inducedBackOrOutputEmfV: number;
  armatureCurrentA: number;
  electromagneticTorqueNm: number;
  electricalPowerWatts: number;
  mechanicalPowerWatts: number;
}

export function calculateMotorGeneratorMetrics(params: {
  operatingMode?: string;
  supplyVoltage?: number;
  mechanicalInputRpm?: number;
  magneticFieldT?: number;
  loadResistanceOhm?: number;
  reverseDirection?: boolean;
  loadConnected?: boolean;
}): MotorGeneratorMetrics {
  const mode =
    params.operatingMode === 'generator_mode' ? 'generator_mode' : 'motor_mode';
  const Vs = Math.max(0, Number(params.supplyVoltage ?? 12));
  const inputRpm = Math.max(0, Number(params.mechanicalInputRpm ?? 240));
  const B = Math.max(0.2, Number(params.magneticFieldT ?? 1.0));
  const Rload = Math.max(2, Number(params.loadResistanceOhm ?? 10));
  const dirSign = params.reverseDirection ? -1 : 1;
  const loadClosed = params.loadConnected !== false;

  // Effective machine constant k_e = N * A * B (with N*A = 0.36 m^2-turns)
  const kPhi = 0.36 * B;
  const Rarmature = 1.5; // internal copper winding resistance in Ohms

  if (mode === 'motor_mode') {
    // Steady-state brushed DC motor under light mechanical damping load
    if (Vs <= 0.01) {
      return {
        operatingMode: 'motor_mode',
        supplyVoltageV: 0,
        magneticFieldT: B,
        rotationalSpeedRpm: 0,
        angularVelocityRadS: 0,
        inducedBackOrOutputEmfV: 0,
        armatureCurrentA: 0,
        electromagneticTorqueNm: 0,
        electricalPowerWatts: 0,
        mechanicalPowerWatts: 0,
      };
    }

    const viscousFrictionB = 0.008; // N·m·s/rad
    // tau_em = kPhi * (Vs - kPhi * omega) / R_total = b * omega
    const rTotal = Rarmature + (loadClosed ? 0.5 : 0);
    const omegaMag = (kPhi * Vs) / (kPhi * kPhi + rTotal * viscousFrictionB);
    const omega = omegaMag * dirSign;
    const rpm = +((omegaMag * 60) / (2 * Math.PI)).toFixed(1);
    const backEmf = +(kPhi * omegaMag).toFixed(2);
    const currentA = +(((Vs - backEmf) / rTotal) * dirSign).toFixed(2);
    const torqueNm = +(kPhi * Math.abs(currentA)).toFixed(3);
    const pElec = +(Vs * Math.abs(currentA)).toFixed(2);
    const pMech = +(torqueNm * omegaMag).toFixed(2);

    return {
      operatingMode: 'motor_mode',
      supplyVoltageV: Vs,
      magneticFieldT: B,
      rotationalSpeedRpm: rpm,
      angularVelocityRadS: +omega.toFixed(2),
      inducedBackOrOutputEmfV: backEmf,
      armatureCurrentA: currentA,
      electromagneticTorqueNm: torqueNm,
      electricalPowerWatts: pElec,
      mechanicalPowerWatts: pMech,
    };
  } else {
    // Generator mode: Mechanical input RPM drives rotor -> induces EMF = kPhi * omega
    const omegaMag = (inputRpm * 2 * Math.PI) / 60;
    const omega = omegaMag * dirSign;
    const inducedEmf = +(kPhi * omegaMag).toFixed(2);
    const currentA =
      loadClosed && inputRpm > 0
        ? +((inducedEmf / (Rarmature + Rload)) * dirSign).toFixed(2)
        : 0;
    const counterTorqueNm = +(kPhi * Math.abs(currentA)).toFixed(3);
    const terminalV =
      loadClosed && inputRpm > 0
        ? +(Math.abs(currentA) * Rload).toFixed(2)
        : inducedEmf;
    const pElecOut = +(terminalV * Math.abs(currentA)).toFixed(2);
    const pMechIn = +(counterTorqueNm * omegaMag).toFixed(2);

    return {
      operatingMode: 'generator_mode',
      supplyVoltageV: terminalV,
      magneticFieldT: B,
      rotationalSpeedRpm: inputRpm,
      angularVelocityRadS: +omega.toFixed(2),
      inducedBackOrOutputEmfV: inducedEmf,
      armatureCurrentA: currentA,
      electromagneticTorqueNm: counterTorqueNm,
      electricalPowerWatts: pElecOut,
      mechanicalPowerWatts: pMechIn,
    };
  }
}

// ============================================================================
// 50. ELECTRICAL TRANSFORMER: AC VOLTAGE AND MAGNETIC COUPLING EXPLORER
// ============================================================================
export interface TransformerCouplingMetrics {
  primaryVoltageRmsV: number;
  acFrequencyHz: number;
  primaryTurnsNp: number;
  secondaryTurnsNs: number;
  turnsRatio: number; // Ns / Np
  modeClassification: 'step-up' | 'step-down' | 'isolation-1to1' | 'dc-zero-induction';
  idealSecondaryVoltageV: number;
  loadedSecondaryVoltageV: number;
  secondaryCurrentA: number;
  primaryCurrentA: number;
  corePeakFluxMwb: number;
  powerTransferredWatts: number;
}

export function calculateTransformerCouplingMetrics(params: {
  primaryVoltageV?: number;
  acFrequencyHz?: number;
  primaryTurnsNp?: number;
  secondaryTurnsNs?: number;
  transformerPreset?: string;
  loadConnected?: boolean;
}): TransformerCouplingMetrics {
  const Vp = Math.max(0, Number(params.primaryVoltageV ?? 120));
  const fHz = Math.max(0, Number(params.acFrequencyHz ?? 60));
  let Np = Math.max(25, Math.round(Number(params.primaryTurnsNp ?? 200)));
  let Ns = Math.max(25, Math.round(Number(params.secondaryTurnsNs ?? 400)));

  if (params.transformerPreset === 'step_up_2x') {
    Np = 200;
    Ns = 400;
  } else if (params.transformerPreset === 'step_down_half') {
    Np = 400;
    Ns = 200;
  }

  const ratio = +(Ns / Np).toFixed(2);
  const loadConnected = params.loadConnected !== false;

  // At f = 0 Hz (steady DC), dPhi/dt = 0 -> zero induced secondary voltage!
  if (fHz <= 0.1 || Vp <= 0.1) {
    return {
      primaryVoltageRmsV: Vp,
      acFrequencyHz: fHz,
      primaryTurnsNp: Np,
      secondaryTurnsNs: Ns,
      turnsRatio: ratio,
      modeClassification: 'dc-zero-induction',
      idealSecondaryVoltageV: 0,
      loadedSecondaryVoltageV: 0,
      secondaryCurrentA: 0,
      primaryCurrentA: 0,
      corePeakFluxMwb: 0,
      powerTransferredWatts: 0,
    };
  }

  const VsIdeal = +(Vp * (Ns / Np)).toFixed(1);
  // Simplified core + winding loss model (~97% voltage regulation under load)
  const VsLoaded = loadConnected ? +(VsIdeal * 0.97).toFixed(1) : VsIdeal;
  const loadResistanceOhm = 48.0;
  const Is = loadConnected ? +(VsLoaded / loadResistanceOhm).toFixed(2) : 0;
  // Energy conservation: Vp * Ip ≈ Vs * Is / eta_core + I_magnetizing
  const iMag = 0.04;
  const Ip = loadConnected ? +(Is * (Ns / Np) * 1.02 + iMag).toFixed(2) : iMag;

  // Peak magnetic flux from V_rms = 4.44 * f * Np * Phi_max
  const phiMaxWb = Vp / (4.44 * fHz * Np);
  const phiMaxMwb = +(phiMaxWb * 1000).toFixed(2);
  const powerW = +(VsLoaded * Is).toFixed(1);

  let classification: TransformerCouplingMetrics['modeClassification'] = 'isolation-1to1';
  if (Ns > Np) classification = 'step-up';
  else if (Ns < Np) classification = 'step-down';

  return {
    primaryVoltageRmsV: Vp,
    acFrequencyHz: fHz,
    primaryTurnsNp: Np,
    secondaryTurnsNs: Ns,
    turnsRatio: ratio,
    modeClassification: classification,
    idealSecondaryVoltageV: VsIdeal,
    loadedSecondaryVoltageV: VsLoaded,
    secondaryCurrentA: Is,
    primaryCurrentA: Ip,
    corePeakFluxMwb: phiMaxMwb,
    powerTransferredWatts: powerW,
  };
}

// ============================================================================
// 51. WAVE INTERFERENCE & DIFFRACTION LABORATORY
// ============================================================================
export interface WaveInterferenceMetrics {
  experimentMode: 'two_source_interference' | 'single_slit_diffraction' | 'single_source_obstacle';
  frequencyHz: number;
  wavelengthUnits: number;
  sourceSeparationD: number;
  relativePhaseDeg: number;
  waveAmplitude: number;
  apertureWidthA: number;
  obstacleOffset: number;
  firstMinimumAngleDeg: number;
  constructiveMaxCount: number;
  centralIntensityNormalized: number;
}

export function calculateWaveInterferenceMetrics(params: {
  experimentMode?: string;
  sourceFrequencyHz?: number;
  sourceSeparationD?: number;
  relativePhaseDeg?: number;
  waveAmplitude?: number;
  apertureWidth?: number;
  obstacleOffset?: number;
}): WaveInterferenceMetrics {
  const mode =
    params.experimentMode === 'single_slit_diffraction' ||
    params.experimentMode === 'single_source_obstacle'
      ? params.experimentMode
      : 'two_source_interference';
  const f = Math.max(0.5, Number(params.sourceFrequencyHz ?? 2.4));
  const d = Math.max(0.4, Number(params.sourceSeparationD ?? 1.6));
  const phaseDeg = Number(params.relativePhaseDeg ?? 0);
  const amp = Math.max(0.1, Number(params.waveAmplitude ?? 0.8));
  const apertureA = Math.max(0.25, Number(params.apertureWidth ?? 1.0));
  const obsOffset = Number(params.obstacleOffset ?? 0.0);

  // Wave propagation speed in ripple tank v_wave = 2.4 units/s -> lambda = v / f
  const waveSpeed = 2.4;
  const lambda = +(waveSpeed / f).toFixed(3);
  const phaseRad = (phaseDeg * Math.PI) / 180;

  // Central on-axis intensity (y = 0)
  const centralI =
    mode === 'two_source_interference'
      ? +(Math.cos(phaseRad / 2) ** 2).toFixed(3)
      : mode === 'single_slit_diffraction'
      ? 1.0
      : +(Math.min(1, 0.35 + Math.abs(obsOffset) * 0.45)).toFixed(3);

  // First destructive minimum angle sin(theta) = lambda / a (diffraction) or lambda / (2d) (two-source)
  let sinMin = 0.5;
  if (mode === 'single_slit_diffraction') {
    sinMin = Math.min(1.0, lambda / Math.max(0.25, apertureA));
  } else {
    sinMin = Math.min(1.0, lambda / Math.max(0.4, 2 * d));
  }
  const minAngleDeg = +((Math.asin(sinMin) * 180) / Math.PI).toFixed(1);
  const maxOrderM = Math.floor(d / lambda);
  const maxCount = mode === 'two_source_interference' ? 2 * maxOrderM + 1 : Math.max(1, Math.floor((2 * apertureA) / lambda));

  return {
    experimentMode: mode,
    frequencyHz: f,
    wavelengthUnits: lambda,
    sourceSeparationD: d,
    relativePhaseDeg: phaseDeg,
    waveAmplitude: amp,
    apertureWidthA: apertureA,
    obstacleOffset: obsOffset,
    firstMinimumAngleDeg: minAngleDeg,
    constructiveMaxCount: maxCount,
    centralIntensityNormalized: centralI,
  };
}

// ============================================================================
// 52. OPTICAL INTERFERENCE & INTERFEROMETER EXPLORER
// ============================================================================
export interface InterferometerMetrics {
  mirrorDisplacementNm: number;
  opticalPathDifferenceNm: number; // OPD = 2 * delta_d
  wavelengthNm: number;
  phaseOffsetDeg: number;
  totalPhaseDifferenceRad: number; // Delta_phi = (2*pi / lambda) * OPD + phi0
  fringeShiftCount: number; // Delta_m = OPD / lambda
  centralNormalizedIntensity: number; // I / I_max = 0.5 * (1 + V * cos(Delta_phi))
  interferenceState: 'constructive-bright' | 'destructive-dark' | 'intermediate-fringe';
}

export function calculateInterferometerMetrics(params: {
  mirrorDisplacementNm?: number;
  wavelengthNm?: number;
  phaseOffsetDeg?: number;
  beamContrast?: number;
}): InterferometerMetrics {
  const deltaD = Number(params.mirrorDisplacementNm ?? 0);
  const lambdaNm = Math.max(380, Math.min(750, Number(params.wavelengthNm ?? 532)));
  const phi0Deg = Number(params.phaseOffsetDeg ?? 0);
  const contrastV = Math.max(0.1, Math.min(1.0, Number(params.beamContrast ?? 1.0)));

  // Michelson double-pass optical path difference: OPD = 2 * delta_d
  const opdNm = +(2 * deltaD).toFixed(1);
  const phi0Rad = (phi0Deg * Math.PI) / 180;
  const totalPhaseRad = +(((2 * Math.PI * opdNm) / lambdaNm) + phi0Rad).toFixed(3);
  const fringeShift = +(opdNm / lambdaNm).toFixed(2);

  // Coherent two-beam interference equation: I = I1 + I2 + 2*sqrt(I1*I2)*cos(Delta_phi)
  const normIntensity = +(0.5 * (1 + contrastV * Math.cos(totalPhaseRad))).toFixed(3);

  let state: InterferometerMetrics['interferenceState'] = 'intermediate-fringe';
  if (normIntensity >= 0.82) state = 'constructive-bright';
  else if (normIntensity <= 0.18) state = 'destructive-dark';

  return {
    mirrorDisplacementNm: deltaD,
    opticalPathDifferenceNm: opdNm,
    wavelengthNm: lambdaNm,
    phaseOffsetDeg: phi0Deg,
    totalPhaseDifferenceRad: totalPhaseRad,
    fringeShiftCount: fringeShift,
    centralNormalizedIntensity: normIntensity,
    interferenceState: state,
  };
}

// ============================================================================
// 53. FLUID DYNAMICS: BERNOULLI, PRESSURE & VORTEX FLOW EXPLORER
// ============================================================================
export interface FluidDynamicsMetrics {
  flowRateLs: number; // Q in L/s
  throatDiameterRatio: number; // D2 / D1
  fluidDensityKgM3: number; // rho in kg/m^3
  inletAreaCm2: number; // A1
  throatAreaCm2: number; // A2
  inletVelocityMs: number; // v1 = Q / A1
  throatVelocityMs: number; // v2 = Q / A2 = v1 * (A1 / A2)
  inletStaticPressureKpa: number; // P1
  throatStaticPressureKpa: number; // P2 = P1 + 0.5 * rho * (v1^2 - v2^2)
  bernoulliPressureDropKpa: number; // Delta_P = P1 - P2
  strouhalVortexFreqHz: number; // f_v = St * v / D_obs
}

export function calculateFluidDynamicsMetrics(params: {
  inletFlowRateLs?: number;
  throatDiameterRatio?: number;
  fluidDensityKgM3?: number;
}): FluidDynamicsMetrics {
  const Q_Ls = Math.max(1.0, Number(params.inletFlowRateLs ?? 8.0));
  const ratioD = Math.max(0.35, Math.min(0.95, Number(params.throatDiameterRatio ?? 0.55)));
  const rho = Math.max(500, Number(params.fluidDensityKgM3 ?? 1000));

  // Inlet pipe diameter D1 = 0.08 m (8 cm) -> A1 = pi * (0.04)^2 = 5.0265e-3 m^2 (50.27 cm^2)
  const D1_m = 0.08;
  const A1_m2 = Math.PI * (D1_m / 2) ** 2;
  const A2_m2 = A1_m2 * (ratioD * ratioD);

  const Q_m3s = Q_Ls * 1e-3;
  // Incompressible Continuity: A1 * v1 = A2 * v2 = Q
  const v1 = Q_m3s / A1_m2;
  const v2 = Q_m3s / A2_m2;

  // Baseline inlet static pressure P1 = 125 kPa
  const P1_Pa = 125000;
  // Steady inviscid Bernoulli Principle: P1 + 0.5 * rho * v1^2 = P2 + 0.5 * rho * v2^2
  const deltaP_Pa = 0.5 * rho * (v2 * v2 - v1 * v1);
  const P2_Pa = Math.max(15000, P1_Pa - deltaP_Pa);

  // Kármán vortex shedding frequency around obstacle cylinder (D_obs = 0.022 m, St ≈ 0.20)
  const strouhal = 0.2;
  const dObsM = 0.022;
  const fvHz = +((strouhal * v1) / dObsM).toFixed(2);

  return {
    flowRateLs: Q_Ls,
    throatDiameterRatio: ratioD,
    fluidDensityKgM3: rho,
    inletAreaCm2: +(A1_m2 * 1e4).toFixed(1),
    throatAreaCm2: +(A2_m2 * 1e4).toFixed(1),
    inletVelocityMs: +v1.toFixed(2),
    throatVelocityMs: +v2.toFixed(2),
    inletStaticPressureKpa: +(P1_Pa / 1000).toFixed(1),
    throatStaticPressureKpa: +(P2_Pa / 1000).toFixed(1),
    bernoulliPressureDropKpa: +(deltaP_Pa / 1000).toFixed(2),
    strouhalVortexFreqHz: fvHz,
  };
}

// ============================================================================
// 54. NUCLEAR FUSION REACTOR: MAGNETIC CONFINEMENT EXPLORER
// ============================================================================
export interface TokamakFusionMetrics {
  toroidalFieldTesla: number; // B_T in T
  plasmaCurrentMa: number; // I_p in MA
  plasmaTemperatureKev: number; // T_i in keV
  confinementQualityH: number; // H-factor
  poloidalFieldTesla: number; // B_p = mu0 * I_p / (2 * pi * a)
  edgeSafetyFactorQ95: number; // q_95 = (a * B_T) / (R_0 * B_p) * shapingFactor
  magneticPressureAtm: number; // P_mag = B_T^2 / (2 * mu0) in atm
  illustrativeTripleProductIndex: number; // Simplified educational confinement indicator
  stabilityRegime: 'stable-q-above-2' | 'kink-risk-low-q';
}

export function calculateTokamakFusionMetrics(params: {
  toroidalFieldTesla?: number;
  plasmaCurrentMa?: number;
  plasmaTemperatureKev?: number;
  confinementQualityH?: number;
}): TokamakFusionMetrics {
  const Bt = Math.max(1.0, Number(params.toroidalFieldTesla ?? 5.3));
  const IpMa = Math.max(0.5, Number(params.plasmaCurrentMa ?? 7.5));
  const TiKev = Math.max(1.0, Number(params.plasmaTemperatureKev ?? 12.0));
  const H = Math.max(0.4, Number(params.confinementQualityH ?? 1.0));

  // Tokamak geometry parameters: Major radius R0 = 3.0 m, minor radius a = 1.0 m, elongation factor = 1.45
  const R0 = 3.0;
  const a = 1.0;
  const shapingFactor = 1.45;

  // Poloidal magnetic field at plasma edge: B_p = (mu0 * I_p) / (2 * pi * a)
  const IpAmps = IpMa * 1e6;
  const Bp = (VACUUM_PERMEABILITY_MU0 * IpAmps) / (2 * Math.PI * a);

  // Cylindrical/shaped edge safety factor q_95 ≈ (a / R0) * (B_T / B_p) * shapingFactor
  const q95 = +(((a / R0) * (Bt / Math.max(0.05, Bp))) * shapingFactor).toFixed(2);

  // Magnetic confinement pressure P_mag = B_T^2 / (2 * mu0) converted to atmospheres (1 atm = 101325 Pa)
  const pMagPa = (Bt * Bt) / (2 * VACUUM_PERMEABILITY_MU0);
  const pMagAtm = +(pMagPa / 101325).toFixed(1);

  // Illustrative educational confinement index (scaled proportionally to B_T, I_p, T_i, and H)
  const tripleIndex = +((Bt / 5.3) * (IpMa / 7.5) * (TiKev / 10.0) * H).toFixed(2);

  return {
    toroidalFieldTesla: Bt,
    plasmaCurrentMa: IpMa,
    plasmaTemperatureKev: TiKev,
    confinementQualityH: H,
    poloidalFieldTesla: +Bp.toFixed(2),
    edgeSafetyFactorQ95: q95,
    magneticPressureAtm: pMagAtm,
    illustrativeTripleProductIndex: tripleIndex,
    stabilityRegime: q95 >= 2.0 ? 'stable-q-above-2' : 'kink-risk-low-q',
  };
}
