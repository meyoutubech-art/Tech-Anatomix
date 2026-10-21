/**
 * TECH-ANATOMIX / VIZLAB — ADVANCED PHYSICS BATCH 3 MATHEMATICAL SIMULATION ENGINE (MODELS 55–61)
 *
 * Provides deterministic, unit-consistent physics calculations and state updates for:
 * 55. Doppler Effect & Sonic Boom Explorer
 * 56. Seismic Waves & Earthquake Wave Propagation Lab
 * 57. Gyroscope, Torque & Angular Momentum Laboratory
 * 58. Simple Harmonic Motion & Coupled Oscillators Lab
 * 59. Thermodynamics: Heat Engine & Carnot Cycle Explorer
 * 60. Photoelectric Effect & Quantum Energy Explorer
 * 61. Special Relativity: Time Dilation & Length Contraction Lab
 */

export const PLANCK_EV_PER_THZ = 4.135667696e-3; // h in eV·s × 10^12 Hz/THz
export const SPEED_OF_LIGHT_NM_THZ = 299792.458; // c = λ(nm) · f(THz)

// ============================================================================
// 55. DOPPLER EFFECT & SONIC BOOM EXPLORER
// ============================================================================
export interface DopplerSonicBoomMetrics {
  sourceSpeedMs: number;
  observerSpeedMs: number;
  soundSpeedMs: number;
  emittedFrequencyHz: number;
  machNumber: number;
  regime: 'stationary' | 'subsonic' | 'sonic' | 'supersonic';
  isSupersonic: boolean;
  machConeHalfAngleDeg: number | null; // null when M < 1
  observedFrequencyApproachingHz: number | null; // null ahead of supersonic shock cone before arrival
  observedFrequencyRecedingHz: number;
  activeObservedFrequencyHz: number;
  compressedFrontWavelengthM: number;
  expandedRearWavelengthM: number;
  restWavelengthM: number;
}

export function calculateDopplerSonicBoomMetrics(params: {
  sourceSpeed?: number;
  observerSpeed?: number;
  soundSpeed?: number;
  sourceFrequencyHz?: number;
  motionRegimePreset?: string;
  sourceDirection?: string;
}): DopplerSonicBoomMetrics {
  const v = Math.max(150, Number(params.soundSpeed ?? 340));
  const fSource = Math.max(20, Number(params.sourceFrequencyHz ?? 440));
  const vObs = Math.max(-0.8 * v, Math.min(0.8 * v, Number(params.observerSpeed ?? 0)));
  const preset = String(params.motionRegimePreset || 'custom');
  const direction = String(params.sourceDirection || 'approaching');

  let vSource = Math.max(0, Number(params.sourceSpeed ?? 180));
  if (preset === 'stationary') {
    vSource = 0;
  } else if (preset === 'subsonic') {
    vSource = +(0.55 * v).toFixed(1);
  } else if (preset === 'supersonic') {
    vSource = +(1.45 * v).toFixed(1);
  }

  const mach = +(vSource / v).toFixed(2);
  let regime: DopplerSonicBoomMetrics['regime'] = 'subsonic';
  if (mach < 0.005) {
    regime = 'stationary';
  } else if (Math.abs(mach - 1.0) <= 0.02) {
    regime = 'sonic';
  } else if (mach > 1.0) {
    regime = 'supersonic';
  }

  const isSupersonic = mach >= 1.0;
  const machConeHalfAngleDeg = isSupersonic
    ? +((Math.asin(Math.min(1.0, 1.0 / mach)) * 180) / Math.PI).toFixed(1)
    : null;

  const restWavelengthM = +(v / fSource).toFixed(3);
  const compressedFrontWavelengthM =
    vSource < v ? +((v - vSource) / fSource).toFixed(3) : 0;
  const expandedRearWavelengthM = +((v + vSource) / fSource).toFixed(3);

  // Receding Doppler frequency (valid for all vSource >= 0):
  // f_obs,recede = f_source * (v - v_observer) / (v + v_source)
  const fReceding = +(fSource * ((v - vObs) / (v + vSource))).toFixed(1);

  // Approaching 1D Doppler formula:
  // f_obs = f_source * (v + v_observer) / (v - v_source) for v_source < v
  let fApproaching: number | null = null;
  if (vSource < v * 0.98) {
    fApproaching = +(fSource * ((v + vObs) / (v - vSource))).toFixed(1);
  }

  // Active observed frequency based on selected direction and regime
  const activeObservedFrequencyHz =
    direction === 'receding'
      ? fReceding
      : fApproaching !== null
      ? fApproaching
      : fReceding;

  return {
    sourceSpeedMs: +vSource.toFixed(1),
    observerSpeedMs: +vObs.toFixed(1),
    soundSpeedMs: +v.toFixed(1),
    emittedFrequencyHz: fSource,
    machNumber: mach,
    regime,
    isSupersonic,
    machConeHalfAngleDeg,
    observedFrequencyApproachingHz: fApproaching,
    observedFrequencyRecedingHz: fReceding,
    activeObservedFrequencyHz,
    compressedFrontWavelengthM,
    expandedRearWavelengthM,
    restWavelengthM,
  };
}

// ============================================================================
// 56. SEISMIC WAVES & EARTHQUAKE WAVE PROPAGATION LAB
// ============================================================================
export interface SeismicWavesMetrics {
  focusDepthKm: number;
  pWaveSpeedKms: number;
  sWaveSpeedKms: number;
  surfaceWaveSpeedKms: number;
  stationAngleDeg: number;
  epicentralSurfaceDistanceKm: number;
  hypocentralChordDistanceKm: number;
  pWaveArrivalSec: number;
  sWaveArrivalSec: number | null; // null in S-wave shadow zone (> 103°)
  surfaceWaveArrivalSec: number;
  spLagTimeSec: number | null;
  isInSWaveShadowZone: boolean;
  isInPWaveShadowZone: boolean;
}

export function calculateSeismicWavesMetrics(params: {
  focusDepthKm?: number;
  pWaveSpeedKms?: number;
  sWaveSpeedKms?: number;
  seismicStationAngleDeg?: number;
}): SeismicWavesMetrics {
  const earthRadiusKm = 6371;
  const depthKm = Math.max(5, Math.min(700, Number(params.focusDepthKm ?? 85)));
  const vP = Math.max(5.0, Number(params.pWaveSpeedKms ?? 8.0));
  // Ensure S-wave speed is physically slower than P-wave speed (v_P > v_S)
  const rawVs = Math.max(2.5, Number(params.sWaveSpeedKms ?? 4.5));
  const vS = Math.min(rawVs, +(vP * 0.72).toFixed(2));
  const vSurf = +(vS * 0.90).toFixed(2);

  const angleDeg = Math.max(10, Math.min(175, Number(params.seismicStationAngleDeg ?? 65)));
  const angleRad = (angleDeg * Math.PI) / 180;

  // Surface arc distance from epicentre to seismic station: D_arc = R_earth * theta
  const epicentralSurfaceDistanceKm = Math.round(earthRadiusKm * angleRad);

  // Law of cosines from subsurface focus (radius r_f = R - d) to surface station (radius R)
  const rFocus = earthRadiusKm - depthKm;
  const chordKm = Math.sqrt(
    earthRadiusKm * earthRadiusKm +
      rFocus * rFocus -
      2 * earthRadiusKm * rFocus * Math.cos(angleRad)
  );

  // Liquid outer core shadow zone occurs for epicentral angles > 103°
  const isInSWaveShadowZone = angleDeg > 103;
  const isInPWaveShadowZone = angleDeg > 103 && angleDeg < 142;

  // P-wave arrival time (if refracted through outer core beyond 103°, add core refraction delay)
  const coreRefractionFactor = angleDeg > 103 ? 1.18 : 1.0;
  const pWaveArrivalSec = +((chordKm / vP) * coreRefractionFactor).toFixed(1);

  // S-waves CANNOT propagate through the liquid outer core (zero shear modulus)
  const sWaveArrivalSec = isInSWaveShadowZone ? null : +(chordKm / vS).toFixed(1);
  const spLagTimeSec =
    sWaveArrivalSec !== null ? +(sWaveArrivalSec - pWaveArrivalSec).toFixed(1) : null;

  // Surface waves travel along the outer circumference from the epicentre
  const surfaceWaveArrivalSec = +(epicentralSurfaceDistanceKm / vSurf).toFixed(1);

  return {
    focusDepthKm: depthKm,
    pWaveSpeedKms: vP,
    sWaveSpeedKms: vS,
    surfaceWaveSpeedKms: vSurf,
    stationAngleDeg: angleDeg,
    epicentralSurfaceDistanceKm,
    hypocentralChordDistanceKm: Math.round(chordKm),
    pWaveArrivalSec,
    sWaveArrivalSec,
    surfaceWaveArrivalSec,
    spLagTimeSec,
    isInSWaveShadowZone,
    isInPWaveShadowZone,
  };
}

// ============================================================================
// 57. GYROSCOPE, TORQUE & ANGULAR MOMENTUM LABORATORY
// ============================================================================
export interface GyroscopeMetrics {
  rotorSpinSpeedRpm: number;
  spinAngularVelocityRadS: number;
  rotorInertiaKgm2: number;
  spinAngularMomentumKgm2S: number;
  appliedTorqueNm: number;
  tiltAngleDeg: number;
  precessionAngularVelocityRadS: number;
  precessionPeriodSec: number | null;
  rotationalKineticEnergyJ: number;
  precessionDirection: 'counter-clockwise' | 'clockwise' | 'stationary';
}

export function calculateGyroscopeMetrics(params: {
  rotorSpinSpeedRpm?: number;
  appliedTorqueNm?: number;
  rotorTiltAngleDeg?: number;
  rotorInertiaKgm2?: number;
  spinDirection?: string;
}): GyroscopeMetrics {
  const rpm = Math.max(50, Number(params.rotorSpinSpeedRpm ?? 1200));
  const torque = Math.max(0, Number(params.appliedTorqueNm ?? 1.6));
  const tiltDeg = Math.max(15, Math.min(165, Number(params.rotorTiltAngleDeg ?? 75)));
  const inertia = Math.max(0.005, Number(params.rotorInertiaKgm2 ?? 0.04));
  const isCw = params.spinDirection === 'cw_negative';

  const omegaSpin = (rpm * 2 * Math.PI) / 60;
  const angularMomentumL = inertia * omegaSpin;
  const sinTheta = Math.max(0.15, Math.sin((tiltDeg * Math.PI) / 180));

  // Fundamental gyroscopic precession relation from tau = dL/dt = Omega_p x L:
  // Omega_p = tau / (L * sin(theta))
  const omegaPrecession =
    torque > 0.001 && angularMomentumL > 0.001
      ? torque / (angularMomentumL * sinTheta)
      : 0;

  const precessionPeriodSec =
    omegaPrecession > 0.001 ? +((2 * Math.PI) / omegaPrecession).toFixed(2) : null;
  const rotationalKineticEnergyJ = +(0.5 * inertia * omegaSpin * omegaSpin).toFixed(1);

  let precessionDirection: GyroscopeMetrics['precessionDirection'] = 'stationary';
  if (omegaPrecession > 0.001) {
    precessionDirection = isCw ? 'clockwise' : 'counter-clockwise';
  }

  return {
    rotorSpinSpeedRpm: rpm,
    spinAngularVelocityRadS: +omegaSpin.toFixed(2),
    rotorInertiaKgm2: inertia,
    spinAngularMomentumKgm2S: +angularMomentumL.toFixed(3),
    appliedTorqueNm: +torque.toFixed(2),
    tiltAngleDeg: tiltDeg,
    precessionAngularVelocityRadS: +omegaPrecession.toFixed(3),
    precessionPeriodSec,
    rotationalKineticEnergyJ,
    precessionDirection,
  };
}

// ============================================================================
// 58. SIMPLE HARMONIC MOTION & COUPLED OSCILLATORS LAB
// ============================================================================
export interface ShmCoupledMetrics {
  massKg: number;
  springStiffnessNm: number;
  couplingStiffnessNm: number;
  naturalOmega0RadS: number; // sqrt(k / m)
  naturalPeriodSec: number; // 2*pi / omega_0
  naturalFrequencyHz: number; // 1 / T_0
  inPhaseModeOmegaRadS: number; // omega_+ = sqrt(k / m)
  outOfPhaseModeOmegaRadS: number; // omega_- = sqrt((k + 2*k_c) / m)
  beatFrequencyHz: number; // (omega_- - omega_+) / (2*pi)
  dampingRatioGamma: number;
  amplitudeEnvelopeFactor: number;
  x1DisplacementM: number;
  x2DisplacementM: number;
  v1VelocityMs: number;
  v2VelocityMs: number;
  kineticEnergyJ: number;
  potentialEnergyJ: number;
  totalMechanicalEnergyJ: number;
}

export function calculateShmCoupledMetrics(params: {
  massKg?: number;
  springStiffnessNm?: number;
  couplingStiffnessNm?: number;
  initialDisplacementM?: number;
  initialPhaseOrVel?: number;
  dampingCoefficient?: number;
  oscillatorPreset?: string;
  simTime?: number;
}): ShmCoupledMetrics {
  const m = Math.max(0.1, Number(params.massKg ?? 1.0));
  const k = Math.max(1.0, Number(params.springStiffnessNm ?? 16.0));
  const preset = String(params.oscillatorPreset || 'weakly_coupled');
  const x10 = Number(params.initialDisplacementM ?? 0.8);
  const b = Math.max(0, Number(params.dampingCoefficient ?? 0.0));
  const t = Math.max(0, Number(params.simTime ?? 0));

  let kc = Math.max(0, Number(params.couplingStiffnessNm ?? 4.0));
  let x20Ratio = Number(params.initialPhaseOrVel ?? 0.0);

  if (preset === 'single_oscillator') {
    kc = 0;
    x20Ratio = 0;
  } else if (preset === 'strongly_coupled') {
    kc = Math.max(kc, k * 0.85);
    x20Ratio = 0;
  } else if (preset === 'in_phase_normal') {
    x20Ratio = 1.0;
  } else if (preset === 'out_of_phase_normal') {
    x20Ratio = -1.0;
  }

  const x20 = preset === 'single_oscillator' ? 0 : x10 * x20Ratio;

  // Ideal single-oscillator relationship: omega_0 = sqrt(k / m)
  const omega0 = Math.sqrt(k / m);
  const period0 = (2 * Math.PI) / omega0;
  const freq0 = 1 / period0;

  // Normal mode frequencies of symmetric coupled system
  const omegaPlus = omega0;
  const omegaMinus = Math.sqrt((k + 2 * kc) / m);
  const beatFreqHz = (omegaMinus - omegaPlus) / (2 * Math.PI);

  // Exponential damping envelope: exp(-gamma * t) where gamma = b / (2m)
  const gamma = b / (2 * m);
  const envelope = Math.exp(-gamma * t);

  // Normal mode coordinates at t = 0:
  // q_+(0) = 0.5 * (x10 + x20), q_-(0) = 0.5 * (x10 - x20)
  const qPlus0 = 0.5 * (x10 + x20);
  const qMinus0 = 0.5 * (x10 - x20);

  const x1 =
    preset === 'single_oscillator'
      ? envelope * x10 * Math.cos(omega0 * t)
      : envelope * (qPlus0 * Math.cos(omegaPlus * t) + qMinus0 * Math.cos(omegaMinus * t));
  const x2 =
    preset === 'single_oscillator'
      ? 0
      : envelope * (qPlus0 * Math.cos(omegaPlus * t) - qMinus0 * Math.cos(omegaMinus * t));

  const v1 =
    preset === 'single_oscillator'
      ? -envelope * x10 * omega0 * Math.sin(omega0 * t)
      : -envelope *
        (qPlus0 * omegaPlus * Math.sin(omegaPlus * t) +
          qMinus0 * omegaMinus * Math.sin(omegaMinus * t));
  const v2 =
    preset === 'single_oscillator'
      ? 0
      : -envelope *
        (qPlus0 * omegaPlus * Math.sin(omegaPlus * t) -
          qMinus0 * omegaMinus * Math.sin(omegaMinus * t));

  const kineticJ = 0.5 * m * (v1 * v1 + v2 * v2);
  const potentialJ =
    preset === 'single_oscillator'
      ? 0.5 * k * x1 * x1
      : 0.5 * k * (x1 * x1 + x2 * x2) + 0.5 * kc * (x1 - x2) * (x1 - x2);
  const totalJ = kineticJ + potentialJ;

  return {
    massKg: m,
    springStiffnessNm: k,
    couplingStiffnessNm: kc,
    naturalOmega0RadS: +omega0.toFixed(3),
    naturalPeriodSec: +period0.toFixed(3),
    naturalFrequencyHz: +freq0.toFixed(3),
    inPhaseModeOmegaRadS: +omegaPlus.toFixed(3),
    outOfPhaseModeOmegaRadS: +omegaMinus.toFixed(3),
    beatFrequencyHz: +beatFreqHz.toFixed(3),
    dampingRatioGamma: +gamma.toFixed(3),
    amplitudeEnvelopeFactor: +envelope.toFixed(3),
    x1DisplacementM: +x1.toFixed(3),
    x2DisplacementM: +x2.toFixed(3),
    v1VelocityMs: +v1.toFixed(3),
    v2VelocityMs: +v2.toFixed(3),
    kineticEnergyJ: +kineticJ.toFixed(2),
    potentialEnergyJ: +potentialJ.toFixed(2),
    totalMechanicalEnergyJ: +totalJ.toFixed(2),
  };
}

// ============================================================================
// 59. THERMODYNAMICS: HEAT ENGINE & CARNOT CYCLE EXPLORER
// ============================================================================
export interface CarnotEngineMetrics {
  hotReservoirTempK: number;
  coldReservoirTempK: number;
  effectiveHotTempK: number;
  isValidTemperatureGradient: boolean;
  restrictionWarning: string | null;
  carnotEfficiencyFraction: number; // 1 - T_C / T_H
  carnotEfficiencyPct: number;
  practicalEfficiencyFraction: number;
  practicalEfficiencyPct: number;
  activeEfficiencyFraction: number;
  activeEfficiencyPct: number;
  heatInputQhKj: number;
  workOutputWKj: number; // W = eta * Q_H
  heatRejectedQcKj: number; // Q_C = Q_H - W (First Law conserved)
  currentStage:
    | 'isothermal_expansion'
    | 'adiabatic_expansion'
    | 'isothermal_compression'
    | 'adiabatic_compression';
  currentStageLabel: string;
}

export function calculateCarnotEngineMetrics(params: {
  hotReservoirTempK?: number;
  coldReservoirTempK?: number;
  heatInputQhKj?: number;
  cycleSpeedRpm?: number;
  engineCycleMode?: string;
  simTime?: number;
}): CarnotEngineMetrics {
  const rawTh = Math.max(100, Number(params.hotReservoirTempK ?? 600));
  const rawTc = Math.max(50, Number(params.coldReservoirTempK ?? 300));
  const qH = Math.max(0.5, Number(params.heatInputQhKj ?? 10.0));
  const mode = String(params.engineCycleMode || 'ideal_carnot');
  const rpm = Math.max(1, Number(params.cycleSpeedRpm ?? 18));
  const t = Math.max(0, Number(params.simTime ?? 0));

  const isValidTemperatureGradient = rawTh > rawTc;
  const restrictionWarning = isValidTemperatureGradient
    ? null
    : `Invalid heat-engine temperature setting (T_H = ${rawTh} K ≤ T_C = ${rawTc} K): Normal cyclic heat-engine work production requires T_H > T_C. Clamping effective T_H to ${rawTc + 25} K.`;

  const effectiveTh = isValidTemperatureGradient ? rawTh : rawTc + 25;

  // Ideal Carnot efficiency using absolute temperatures in Kelvin: eta_Carnot = 1 - T_C / T_H
  const carnotEff = Math.max(0, Math.min(0.95, 1 - rawTc / effectiveTh));
  // Practical irreversible heat engine efficiency (< Carnot, never 100%)
  const practicalEff = +(carnotEff * 0.68).toFixed(4);

  const activeEff = mode === 'practical_irreversible' ? practicalEff : carnotEff;

  // First Law of Thermodynamics energy accounting: Q_H = W + Q_C
  const workW = +(qH * activeEff).toFixed(2);
  const heatRejectedQc = +(qH - workW).toFixed(2);

  // Cycle phase 0..1 across the 4 Carnot stages
  const cyclePhase = ((t * rpm) / 60) % 1.0;
  let currentStage: CarnotEngineMetrics['currentStage'] = 'isothermal_expansion';
  let currentStageLabel = '1→2 Isothermal Expansion (Absorbing Q_H at T_H)';
  if (cyclePhase >= 0.25 && cyclePhase < 0.5) {
    currentStage = 'adiabatic_expansion';
    currentStageLabel = '2→3 Adiabatic Expansion (Cooling T_H → T_C)';
  } else if (cyclePhase >= 0.5 && cyclePhase < 0.75) {
    currentStage = 'isothermal_compression';
    currentStageLabel = '3→4 Isothermal Compression (Rejecting Q_C at T_C)';
  } else if (cyclePhase >= 0.75) {
    currentStage = 'adiabatic_compression';
    currentStageLabel = '4→1 Adiabatic Compression (Heating T_C → T_H)';
  }

  return {
    hotReservoirTempK: rawTh,
    coldReservoirTempK: rawTc,
    effectiveHotTempK: effectiveTh,
    isValidTemperatureGradient,
    restrictionWarning,
    carnotEfficiencyFraction: +carnotEff.toFixed(4),
    carnotEfficiencyPct: +(carnotEff * 100).toFixed(1),
    practicalEfficiencyFraction: practicalEff,
    practicalEfficiencyPct: +(practicalEff * 100).toFixed(1),
    activeEfficiencyFraction: +activeEff.toFixed(4),
    activeEfficiencyPct: +(activeEff * 100).toFixed(1),
    heatInputQhKj: +qH.toFixed(2),
    workOutputWKj: workW,
    heatRejectedQcKj: heatRejectedQc,
    currentStage,
    currentStageLabel,
  };
}

// ============================================================================
// 60. PHOTOELECTRIC EFFECT & QUANTUM ENERGY EXPLORER
// ============================================================================
export interface PhotoelectricMetrics {
  lightFrequencyThz: number;
  wavelengthNm: number;
  lightIntensityPct: number;
  workFunctionEv: number;
  thresholdFrequencyThz: number;
  thresholdWavelengthNm: number;
  photonEnergyEv: number; // E_photon = h * f
  isAboveThreshold: boolean; // hf >= phi
  maxKineticEnergyEv: number; // K_max = hf - phi when hf >= phi, else 0
  stoppingPotentialV: number; // V_stop = K_max / e
  retardingVoltageV: number;
  reachesCollector: boolean;
  photocurrentMicroAmps: number;
}

export const PHOTOELECTRIC_METAL_PRESETS: Record<string, number> = {
  cesium: 2.1,
  sodium: 2.3,
  zinc: 4.3,
  platinum: 5.1,
};

export function calculatePhotoelectricMetrics(params: {
  lightFrequencyThz?: number;
  lightIntensityPct?: number;
  workFunctionEv?: number;
  retardingVoltageV?: number;
  metalPreset?: string;
}): PhotoelectricMetrics {
  const fThz = Math.max(100, Number(params.lightFrequencyThz ?? 750));
  const intensity = Math.max(0, Math.min(100, Number(params.lightIntensityPct ?? 65)));
  const preset = String(params.metalPreset || 'custom');
  const phi =
    preset !== 'custom' && PHOTOELECTRIC_METAL_PRESETS[preset] !== undefined
      ? PHOTOELECTRIC_METAL_PRESETS[preset]
      : Math.max(1.0, Number(params.workFunctionEv ?? 2.1));
  const vRet = Math.max(0, Number(params.retardingVoltageV ?? 0.0));

  // E_photon = h * f
  const photonEnergyEv = +(PLANCK_EV_PER_THZ * fThz).toFixed(3);
  const wavelengthNm = Math.round(SPEED_OF_LIGHT_NM_THZ / fThz);

  const thresholdFrequencyThz = Math.round(phi / PLANCK_EV_PER_THZ);
  const thresholdWavelengthNm = Math.round(SPEED_OF_LIGHT_NM_THZ / thresholdFrequencyThz);

  // Standard one-photon photoelectric threshold rule: hf >= phi
  const isAboveThreshold = photonEnergyEv >= phi && intensity > 0;
  const maxKineticEnergyEv =
    photonEnergyEv >= phi ? +(photonEnergyEv - phi).toFixed(3) : 0;

  // Stopping potential V_stop = K_max / e (numerically equal to K_max in eV)
  const stoppingPotentialV = maxKineticEnergyEv;

  // Electrons reach the collector only when emitted (hf >= phi) AND retarding potential < V_stop
  const reachesCollector = isAboveThreshold && vRet < stoppingPotentialV;

  // Above threshold, increasing intensity increases photon flux and emission rate (photocurrent)
  let photocurrentMicroAmps = 0;
  if (reachesCollector && stoppingPotentialV > 0) {
    const voltageTransmissionFactor = Math.max(
      0,
      Math.min(1, 1 - vRet / Math.max(0.05, stoppingPotentialV))
    );
    photocurrentMicroAmps = +(intensity * 0.45 * voltageTransmissionFactor).toFixed(2);
  }

  return {
    lightFrequencyThz: fThz,
    wavelengthNm,
    lightIntensityPct: intensity,
    workFunctionEv: +phi.toFixed(2),
    thresholdFrequencyThz,
    thresholdWavelengthNm,
    photonEnergyEv,
    isAboveThreshold,
    maxKineticEnergyEv,
    stoppingPotentialV,
    retardingVoltageV: +vRet.toFixed(2),
    reachesCollector,
    photocurrentMicroAmps,
  };
}

// ============================================================================
// 61. SPECIAL RELATIVITY: TIME DILATION & LENGTH CONTRACTION LAB
// ============================================================================
export interface SpecialRelativityMetrics {
  velocityFractionC: number; // clamped safely to [0, 0.995]
  velocityKmS: number;
  lorentzFactorGamma: number; // gamma = 1 / sqrt(1 - v^2/c^2)
  properTimeIntervalNs: number; // Delta tau
  coordinateTimeIntervalNs: number; // Delta t = gamma * Delta tau
  properLengthMeters: number; // L_0
  contractedLengthMeters: number; // L = L_0 / gamma (along motion direction only)
  transverseLengthRatio: number; // strictly 1.000 perpendicular to motion
  lightClockPathRatio: number; // diagonal path / vertical path = gamma
}

export function calculateSpecialRelativityMetrics(params: {
  velocityFractionC?: number;
  properLengthMeters?: number;
  properTimeIntervalNs?: number;
}): SpecialRelativityMetrics {
  // Clamp v/c strictly to [0, 0.995] to prevent division by zero at v = c
  const rawBeta = Number(params.velocityFractionC ?? 0.8);
  const beta = Math.max(0.0, Math.min(0.995, Number.isFinite(rawBeta) ? rawBeta : 0.0));

  const l0 = Math.max(1.0, Number(params.properLengthMeters ?? 12.0));
  const dTau = Math.max(0.5, Number(params.properTimeIntervalNs ?? 10.0));

  // Lorentz factor: gamma = 1 / sqrt(1 - beta^2)
  const gamma = beta === 0 ? 1.0 : 1.0 / Math.sqrt(1.0 - beta * beta);

  // Time dilation: Delta t = gamma * Delta tau
  const dCoordTime = gamma * dTau;

  // Length contraction along direction of relative motion: L = L_0 / gamma
  const lContracted = l0 / gamma;

  return {
    velocityFractionC: +beta.toFixed(3),
    velocityKmS: Math.round(beta * 299792.458),
    lorentzFactorGamma: +gamma.toFixed(3),
    properTimeIntervalNs: +dTau.toFixed(2),
    coordinateTimeIntervalNs: +dCoordTime.toFixed(2),
    properLengthMeters: +l0.toFixed(2),
    contractedLengthMeters: +lContracted.toFixed(2),
    transverseLengthRatio: 1.0,
    lightClockPathRatio: +gamma.toFixed(3),
  };
}
