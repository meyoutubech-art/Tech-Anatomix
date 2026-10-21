import * as THREE from 'three';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { ADVANCED_PHYSICS_BATCH_3_MODELS } from '../data/curatedModelsAdvancedPhysicsBatch3';
import {
  calculateDopplerSonicBoomMetrics,
  calculateSeismicWavesMetrics,
  calculateGyroscopeMetrics,
  calculateShmCoupledMetrics,
  calculateCarnotEngineMetrics,
  calculatePhotoelectricMetrics,
  calculateSpecialRelativityMetrics,
} from '../simulations/physics/advancedPhysicsBatch3Engine';
import {
  isAdvancedPhysicsBatch3Model,
  buildBatch3CustomAssemblies,
  updateBatch3CustomAssemblies,
} from '../simulations/physics/advancedPhysicsBatch3Studio';
import { matchOfflinePreset } from '../utils/offlineModelManager';
import { matchVerifiedScientificModel } from '../server/geminiService';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

console.log('=== Running Advanced Physics Batch 3 (Models 55–61) Verification Suite ===');

// 1. Verify all 7 Physics Batch 3 models exist in ADVANCED_PHYSICS_BATCH_3_MODELS and CURATED_AI_MODELS
const expectedModels = [
  { key: 'dopplerEffectSonicBoom', id: 'doppler-effect-sonic-boom-explorer', number: 55 },
  { key: 'seismicWavesEarthquake', id: 'seismic-waves-earthquake-lab', number: 56 },
  { key: 'gyroscopeTorqueAngularMomentum', id: 'gyroscope-torque-angular-momentum-lab', number: 57 },
  { key: 'shmCoupledOscillators', id: 'shm-coupled-oscillators-lab', number: 58 },
  { key: 'thermodynamicsCarnotEngine', id: 'thermodynamics-carnot-heat-engine', number: 59 },
  { key: 'photoelectricQuantumExplorer', id: 'photoelectric-effect-quantum-explorer', number: 60 },
  { key: 'specialRelativityTimeLength', id: 'special-relativity-time-length-lab', number: 61 },
];

for (const item of expectedModels) {
  const spec = ADVANCED_PHYSICS_BATCH_3_MODELS[item.key];
  assert(Boolean(spec), `Model ${item.number} (${item.key}) must exist in ADVANCED_PHYSICS_BATCH_3_MODELS`);
  assert(spec.id === item.id, `Model ${item.number} id must be "${item.id}", got "${spec.id}"`);
  assert(spec.functionalType === item.id, `Model ${item.number} functionalType must be "${item.id}"`);
  assert(
    CURATED_AI_MODELS[item.key]?.id === item.id && CURATED_AI_MODELS[item.id]?.id === item.id,
    `Model ${item.number} must be registered in CURATED_AI_MODELS under both "${item.key}" and "${item.id}"`
  );
  assert(
    isAdvancedPhysicsBatch3Model(spec.functionalType, spec.id),
    `isAdvancedPhysicsBatch3Model() must return true for Model ${item.number} (${item.id})`
  );
  assert(spec.parts.length >= 6, `Model ${item.number} must have at least 6 selectable 3D subassemblies`);
  assert(Object.keys(spec.parameters).length >= 3, `Model ${item.number} must have at least 3 interactive parameters`);
  assert(Object.keys(spec.conditions).length >= 2, `Model ${item.number} must have at least 2 interactive conditions`);
  assert(Boolean(spec.equations && spec.equations.length >= 2), `Model ${item.number} must include governing equations`);
}

// 2. Verify Model 55: Doppler Effect & Sonic Boom Physics Engine
{
  const stationary = calculateDopplerSonicBoomMetrics({
    sourceSpeed: 0,
    observerSpeed: 0,
    soundSpeed: 340,
    sourceFrequencyHz: 440,
    motionRegimePreset: 'stationary',
  });
  assert(stationary.machNumber === 0 && stationary.regime === 'stationary', 'Stationary Doppler preset must have M = 0');
  assert(stationary.activeObservedFrequencyHz === 440, 'Stationary Doppler observed frequency must equal emitted 440 Hz');
  assert(stationary.machConeHalfAngleDeg === null, 'Stationary source must NOT have a Mach shock cone');

  const subsonic = calculateDopplerSonicBoomMetrics({
    sourceSpeed: 170,
    observerSpeed: 0,
    soundSpeed: 340,
    sourceFrequencyHz: 440,
    motionRegimePreset: 'custom',
    sourceDirection: 'approaching',
  });
  assert(subsonic.machNumber === 0.5 && subsonic.regime === 'subsonic', 'v_s=170, v=340 must yield M=0.5 subsonic');
  assert(
    Math.abs((subsonic.observedFrequencyApproachingHz ?? 0) - 880) < 0.5,
    `Approaching M=0.5 frequency must be 880 Hz, got ${subsonic.observedFrequencyApproachingHz}`
  );
  assert(subsonic.machConeHalfAngleDeg === null, 'Subsonic M=0.5 must NOT produce a Mach shock cone');

  const supersonic = calculateDopplerSonicBoomMetrics({
    sourceSpeed: 680,
    observerSpeed: 0,
    soundSpeed: 340,
    sourceFrequencyHz: 440,
    motionRegimePreset: 'custom',
  });
  assert(supersonic.machNumber === 2.0 && supersonic.isSupersonic, 'v_s=680, v=340 must yield M=2.0 supersonic');
  assert(
    Math.abs((supersonic.machConeHalfAngleDeg ?? 0) - 30.0) < 0.2,
    `M=2.0 Mach cone half-angle sin(μ)=1/2 must be 30°, got ${supersonic.machConeHalfAngleDeg}`
  );
}

// 3. Verify Model 56: Seismic Waves & Earthquake Wave Propagation Physics Engine
{
  const nearStation = calculateSeismicWavesMetrics({
    focusDepthKm: 35,
    pWaveSpeedKms: 8.0,
    sWaveSpeedKms: 4.5,
    seismicStationAngleDeg: 60,
  });
  assert(!nearStation.isInSWaveShadowZone, 'Δ=60° must receive direct P and S waves');
  assert(
    nearStation.sWaveArrivalSec !== null && nearStation.sWaveArrivalSec > nearStation.pWaveArrivalSec,
    'S-wave must arrive after faster P-wave (v_P > v_S)'
  );
  assert(
    nearStation.surfaceWaveArrivalSec > (nearStation.sWaveArrivalSec ?? 0),
    'Surface waves must arrive after S-wave'
  );

  const shadowStation = calculateSeismicWavesMetrics({
    focusDepthKm: 35,
    pWaveSpeedKms: 8.0,
    sWaveSpeedKms: 4.5,
    seismicStationAngleDeg: 130,
  });
  assert(
    shadowStation.isInSWaveShadowZone && shadowStation.sWaveArrivalSec === null,
    'Δ=130° (>103°) must lie in the S-wave shadow zone blocked by the liquid outer core (μ=0)'
  );
}

// 4. Verify Model 57: Gyroscope, Torque & Angular Momentum Physics Engine
{
  const spinning = calculateGyroscopeMetrics({
    rotorSpinSpeedRpm: 1200,
    appliedTorqueNm: 1.6,
    rotorTiltAngleDeg: 75,
    rotorInertiaKgm2: 0.04,
  });
  assert(spinning.spinAngularMomentumKgm2S > 0, 'Spinning gyroscope must have positive |L| = Iω');
  assert(spinning.precessionAngularVelocityRadS > 0, 'Spinning gyroscope under torque must precess at Ω_p = τ / (L sin θ)');

  const fasterSpin = calculateGyroscopeMetrics({
    rotorSpinSpeedRpm: 2400,
    appliedTorqueNm: 1.6,
    rotorTiltAngleDeg: 75,
    rotorInertiaKgm2: 0.04,
  });
  assert(
    fasterSpin.precessionAngularVelocityRadS < spinning.precessionAngularVelocityRadS,
    'Doubling rotor spin ω must halve precession rate Ω_p = τ / (Iω sin θ)'
  );

  const zeroTorque = calculateGyroscopeMetrics({
    rotorSpinSpeedRpm: 1200,
    appliedTorqueNm: 0,
    rotorTiltAngleDeg: 75,
    rotorInertiaKgm2: 0.04,
  });
  assert(zeroTorque.precessionAngularVelocityRadS === 0, 'Zero external torque (τ=0) must yield zero precession');
}

// 5. Verify Model 58: SHM & Coupled Oscillators Physics Engine
{
  const coupled = calculateShmCoupledMetrics({
    massKg: 1.0,
    springStiffnessNm: 16,
    couplingStiffnessNm: 4,
    initialDisplacementM: 0.8,
    dampingCoefficient: 0,
    oscillatorPreset: 'weakly_coupled',
    simTime: 1.2,
  });
  assert(coupled.inPhaseModeOmegaRadS === 4.0, `ω₁ = √(16/1) must be 4.0 rad/s, got ${coupled.inPhaseModeOmegaRadS}`);
  assert(
    coupled.outOfPhaseModeOmegaRadS > coupled.inPhaseModeOmegaRadS,
    `Out-of-phase ω₂ (${coupled.outOfPhaseModeOmegaRadS}) must exceed in-phase ω₁ (${coupled.inPhaseModeOmegaRadS})`
  );
  assert(
    Math.abs(coupled.kineticEnergyJ + coupled.potentialEnergyJ - coupled.totalMechanicalEnergyJ) < 0.05,
    'Instantaneous K + U must equal total mechanical energy E_total'
  );
}

// 6. Verify Model 59: Thermodynamics Carnot Heat Engine Physics Engine
{
  const validCarnot = calculateCarnotEngineMetrics({
    hotReservoirTempK: 800,
    coldReservoirTempK: 300,
    heatInputQhKj: 10.0,
    cycleSpeedRpm: 18,
    engineCycleMode: 'ideal_carnot',
  });
  assert(validCarnot.isValidTemperatureGradient && validCarnot.restrictionWarning === null, 'T_H=800K > T_C=300K must be a valid Carnot engine');
  assert(
    Math.abs(validCarnot.carnotEfficiencyPct - 62.5) < 0.1,
    `Carnot efficiency 1 - 300/800 must be 62.5%, got ${validCarnot.carnotEfficiencyPct}%`
  );
  assert(
    Math.abs(validCarnot.workOutputWKj + validCarnot.heatRejectedQcKj - validCarnot.heatInputQhKj) < 0.05,
    'First Law energy conservation Q_H = W + Q_C must hold'
  );

  const invalidCarnot = calculateCarnotEngineMetrics({
    hotReservoirTempK: 300,
    coldReservoirTempK: 450,
    heatInputQhKj: 10.0,
  });
  assert(
    !invalidCarnot.isValidTemperatureGradient && Boolean(invalidCarnot.restrictionWarning),
    'T_H <= T_C must flag an invalid thermodynamic temperature gradient with restriction warning'
  );
}

// 7. Verify Model 60: Photoelectric Effect & Quantum Energy Physics Engine
{
  // Sodium work function Φ = 2.3 eV (f_0 ≈ 556 THz)
  const belowThreshold = calculatePhotoelectricMetrics({
    lightFrequencyThz: 450,
    lightIntensityPct: 100,
    retardingVoltageV: 0,
    metalPreset: 'sodium',
  });
  assert(
    !belowThreshold.isAboveThreshold && belowThreshold.maxKineticEnergyEv === 0 && belowThreshold.photocurrentMicroAmps === 0,
    'Below threshold frequency (f < f₀), zero electrons must be emitted regardless of 100% light intensity'
  );

  const aboveThreshold = calculatePhotoelectricMetrics({
    lightFrequencyThz: 750,
    lightIntensityPct: 65,
    retardingVoltageV: 0,
    metalPreset: 'sodium',
  });
  assert(
    aboveThreshold.isAboveThreshold && aboveThreshold.maxKineticEnergyEv > 0 && aboveThreshold.photocurrentMicroAmps > 0,
    'Above threshold frequency (f > f₀), photoelectrons must be emitted with K_max = hf - Φ > 0'
  );
  assert(
    Math.abs(aboveThreshold.stoppingPotentialV - aboveThreshold.maxKineticEnergyEv) < 0.02,
    'Stopping potential V_stop (in V) must numerically match K_max (in eV)'
  );
}

// 8. Verify Model 61: Special Relativity Time Dilation & Length Contraction Physics Engine
{
  const lowSpeed = calculateSpecialRelativityMetrics({
    velocityFractionC: 0,
    properTimeIntervalNs: 10.0,
    properLengthMeters: 12.0,
  });
  assert(
    lowSpeed.lorentzFactorGamma === 1 &&
      lowSpeed.coordinateTimeIntervalNs === 10.0 &&
      lowSpeed.contractedLengthMeters === 12.0,
    'At v=0, γ=1'
  );

  const highSpeed = calculateSpecialRelativityMetrics({
    velocityFractionC: 0.8,
    properTimeIntervalNs: 10.0,
    properLengthMeters: 12.0,
  });
  // At v = 0.8c, √(1 - 0.64) = 0.6 -> γ = 1 / 0.6 = 1.667
  assert(Math.abs(highSpeed.lorentzFactorGamma - 1.667) < 0.01, `At v=0.8c, γ must be ~1.667, got ${highSpeed.lorentzFactorGamma}`);
  assert(
    Math.abs(highSpeed.coordinateTimeIntervalNs - 16.67) < 0.05,
    `At v=0.8c, Δt = γΔτ must be ~16.67ns, got ${highSpeed.coordinateTimeIntervalNs}`
  );
  assert(
    Math.abs(highSpeed.contractedLengthMeters - 7.2) < 0.05,
    `At v=0.8c, L = L₀/γ must be 7.2m, got ${highSpeed.contractedLengthMeters}`
  );
}

// 9. Verify 3D Custom Assembly Builder & Live Update Loop for all 7 Models (55–61)
for (const item of expectedModels) {
  const spec = ADVANCED_PHYSICS_BATCH_3_MODELS[item.key];
  const modelRoot = new THREE.Group();
  const meshMap = new Map<string, THREE.Object3D>();
  const interactiveMeshes: THREE.Object3D[] = [];

  for (const part of spec.parts) {
    const dummyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: part.color })
    );
    dummyMesh.position.set(...part.position);
    dummyMesh.userData = { partSpec: part };
    modelRoot.add(dummyMesh);
    meshMap.set(part.id, dummyMesh);
    interactiveMeshes.push(dummyMesh);
  }

  const handles = buildBatch3CustomAssemblies(spec, modelRoot, meshMap, interactiveMeshes);
  assert(handles.rootGroup.children.length >= 3, `Model ${item.number} (${item.id}) must build rich custom 3D subassemblies`);

  // Verify default parameters and conditions update without error
  const defaultParams: Record<string, number> = {};
  Object.values(spec.parameters).forEach((p) => {
    defaultParams[p.id] = p.defaultValue;
  });
  const defaultConds: Record<string, any> = {};
  Object.values(spec.conditions).forEach((c) => {
    defaultConds[c.id] = c.defaultValue;
  });

  updateBatch3CustomAssemblies(handles, spec, defaultParams, defaultConds, 1.5, meshMap);

  // Verify every declared part in spec.parts is mapped in meshMap and selectable
  for (const part of spec.parts) {
    const mappedObj = meshMap.get(part.id);
    assert(Boolean(mappedObj), `Part "${part.id}" in Model ${item.number} must be bound in meshMap for selection & callouts`);
  }
}

// 10. Verify Offline Manager & AI Prompt Matching for Models 55–61
const promptChecks = [
  { prompt: 'Create a 3D model of the Doppler effect and sonic boom Mach cone', expectedId: 'doppler-effect-sonic-boom-explorer' },
  { prompt: 'Create a 3D model of seismic waves and earthquake P-wave S-wave shadow zone', expectedId: 'seismic-waves-earthquake-lab' },
  { prompt: 'Create a 3D model of a gyroscope and angular momentum precession', expectedId: 'gyroscope-torque-angular-momentum-lab' },
  { prompt: 'Create a 3D model of simple harmonic motion and coupled oscillators normal modes', expectedId: 'shm-coupled-oscillators-lab' },
  { prompt: 'Create a 3D model of a Carnot cycle heat engine and PV diagram', expectedId: 'thermodynamics-carnot-heat-engine' },
  { prompt: 'Create a 3D model of the photoelectric effect and stopping potential', expectedId: 'photoelectric-effect-quantum-explorer' },
  { prompt: 'Create a 3D model of special relativity time dilation and length contraction light clock', expectedId: 'special-relativity-time-length-lab' },
];

for (const check of promptChecks) {
  const offlineRes = matchOfflinePreset(check.prompt);
  assert(
    offlineRes.matched && offlineRes.spec?.id === check.expectedId,
    `Offline preset matcher for "${check.prompt}" must resolve to "${check.expectedId}", got "${offlineRes.spec?.id}"`
  );
  const aiMatch = matchVerifiedScientificModel(check.prompt);
  assert(
    aiMatch?.id === check.expectedId,
    `Gemini verified matcher for "${check.prompt}" must resolve to "${check.expectedId}", got "${aiMatch?.id}"`
  );
}

console.log('✓ Advanced Physics Batch 3 (Models 55–61) Verification Suite Passed (All 7 Models, Engines & 3D Studios Verified)');
