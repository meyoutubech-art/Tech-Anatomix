import * as THREE from 'three';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { ADVANCED_PHYSICS_BATCH_4_MODELS } from '../data/curatedModelsAdvancedPhysicsBatch4';
import {
  calculateMaxwellEquationsMetrics,
  calculateAcRlcCircuitMetrics,
  calculateThinLensOpticsMetrics,
  calculateDopplerUltrasoundMetrics,
  calculateEarthMagnetosphereMetrics,
  calculateSemiconductorPnJunctionMetrics,
  calculateRadioactiveDecayMetrics,
} from '../simulations/physics/advancedPhysicsBatch4Engine';
import {
  isAdvancedPhysicsBatch4Model,
  buildBatch4CustomAssemblies,
  updateBatch4CustomAssemblies,
} from '../simulations/physics/advancedPhysicsBatch4Studio';
import { ALL_PHYSICS_PAGE_MODELS } from '../pages/PhysicsLabPage';
import { matchOfflinePreset } from '../utils/offlineModelManager';
import { matchVerifiedScientificModel } from '../server/geminiService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runAdvancedPhysicsBatch4Tests() {
  console.log('--- Running Physics Batch 4 (Models 62–68) Verification Suite ---');

  const expectedBatch4Ids = [
    'maxwell-equations-em-field-explorer',
    'ac-circuits-rlc-resonance-lab',
    'lenses-optical-instruments-lab',
    'doppler-ultrasound-flow-explorer',
    'earth-magnetic-field-magnetosphere-explorer',
    'semiconductor-pn-junction-diode-explorer',
    'radioactive-decay-halflife-radiation-lab',
  ];

  // 1. Registry completeness & non-duplication across all 68 models
  const batch4Entries = Object.values(ADVANCED_PHYSICS_BATCH_4_MODELS);
  assert(
    batch4Entries.length === 7,
    `Expected 7 models in ADVANCED_PHYSICS_BATCH_4_MODELS, found ${batch4Entries.length}`
  );

  for (const id of expectedBatch4Ids) {
    const spec = CURATED_AI_MODELS[id];
    assert(Boolean(spec), `Model '${id}' must be registered in CURATED_AI_MODELS`);
    assert(
      isAdvancedPhysicsBatch4Model(spec.functionalType, spec.id),
      `isAdvancedPhysicsBatch4Model must recognize '${id}'`
    );
    assert(spec.parts.length >= 5, `Model '${id}' must have at least 5 distinct 3D parts`);
    assert(
      Object.keys(spec.parameters).length >= 3,
      `Model '${id}' must have at least 3 interactive sliders`
    );
    assert(
      Boolean(spec.equations && spec.equations.length >= 3),
      `Model '${id}' must include governing equations`
    );

    // Check PhysicsLabPage integration
    const inPhysicsPage = ALL_PHYSICS_PAGE_MODELS.some((m) => m.id === id);
    assert(inPhysicsPage, `Model '${id}' must be integrated into PhysicsLabPage`);

    // Check offline & server prompt matching
    const offlineMatch = matchOfflinePreset(spec.prompt || spec.title);
    assert(
      offlineMatch.matched && offlineMatch.spec?.id === id,
      `Offline preset matcher must resolve prompt for '${id}'`
    );
    const serverMatch = matchVerifiedScientificModel(spec.prompt || spec.title);
    assert(
      Boolean(serverMatch && serverMatch.id === id),
      `Server scientific model matcher must resolve prompt for '${id}'`
    );
  }

  // 2. Mathematical Physics Engine Verification (Models 62–68)
  // Model 62: Maxwell's Equations
  const maxwellDipole = calculateMaxwellEquationsMetrics({
    primaryChargeMicroC: 10,
    chargeArrangementPreset: 'dipole_opposite',
    chargeSeparationM: 1.4,
    conductorCurrentAmps: 15,
    fieldOscillationFreqMhz: 100,
  });
  assert(
    maxwellDipole.q2MicroC === -10,
    `Dipole preset should set q2 = -q1 (-10 μC), got ${maxwellDipole.q2MicroC}`
  );
  assert(
    maxwellDipole.magneticClosedSurfaceFluxWb === 0,
    `Gauss's Law for Magnetism must strictly equal 0 Wb`
  );
  assert(
    maxwellDipole.electricFluxMegaVm > 1.0,
    `Positive enclosed charge q1 must produce positive electric flux`
  );
  assert(
    maxwellDipole.displacementCurrentAmps === 15,
    `Displacement current in capacitor gap must equal conduction current (15 A)`
  );

  // Model 63: AC Circuits, RLC Resonance & Impedance
  const rlcRes = calculateAcRlcCircuitMetrics({
    circuitConfiguration: 'rlc_series',
    resistanceOhms: 25,
    inductanceMilliH: 40,
    capacitanceMicroF: 60,
    acFrequencyHz: 102.73,
    peakVoltageV: 120,
  });
  assert(
    Math.abs(rlcRes.resonanceFrequencyHz - 102.73) < 0.2,
    `RLC resonance frequency f0 = 1/(2π√(LC)) for L=40mH, C=60μF should be ~102.73 Hz, got ${rlcRes.resonanceFrequencyHz}`
  );
  assert(
    Math.abs(rlcRes.impedanceOhms - 25) < 0.2,
    `At resonance, series RLC impedance Z must equal R (25 Ω), got ${rlcRes.impedanceOhms}`
  );
  assert(
    Math.abs(rlcRes.phaseAngleDeg) < 1.0,
    `At resonance, phase angle φ must be ~0°, got ${rlcRes.phaseAngleDeg}`
  );
  assert(
    Math.abs(rlcRes.rmsVoltageV - 120 / Math.SQRT2) < 0.1,
    `RMS voltage must equal V_peak / √2`
  );

  // Model 64: Lenses, Optical Instruments & Image Formation (Cartesian 1/f = 1/v - 1/u)
  const realOptics = calculateThinLensOpticsMetrics({
    opticalInstrumentMode: 'single_converging',
    focalLengthMagnitudeCm: 20,
    objectDistanceMagnitudeCm: 40,
    objectHeightCm: 5,
  });
  assert(
    realOptics.objectCoordUCm === -40 && Math.abs(realOptics.imageCoordVCm - 40) < 0.1,
    `Object at u = -40 cm (-2f) with f = +20 cm must form real image at v = +40 cm, got v = ${realOptics.imageCoordVCm}`
  );
  assert(
    Math.abs(realOptics.lateralMagnificationM - -1.0) < 0.05 &&
      realOptics.imageNature === 'Real' &&
      realOptics.imageOrientation === 'Inverted',
    `Image at 2F must be Real, Inverted, with m = -1.00`
  );

  const virtOptics = calculateThinLensOpticsMetrics({
    opticalInstrumentMode: 'single_diverging',
    focalLengthMagnitudeCm: 20,
    objectDistanceMagnitudeCm: 20,
    objectHeightCm: 6,
  });
  assert(
    virtOptics.focalLengthCm === -20 &&
      Math.abs(virtOptics.imageCoordVCm - -10) < 0.1 &&
      virtOptics.imageNature === 'Virtual' &&
      virtOptics.imageOrientation === 'Upright' &&
      Math.abs(virtOptics.lateralMagnificationM - 0.5) < 0.05,
    `Diverging lens f = -20 cm with u = -20 cm must form Virtual Upright image at v = -10 cm (m = +0.50)`
  );

  // Model 65: Doppler Ultrasound (Δf = 2 f0 v cosθ / c)
  const doppler45 = calculateDopplerUltrasoundMetrics({
    sourceFrequencyMhz: 5.0,
    targetVelocityMs: 0.77,
    beamAngleDeg: 60,
    targetMotionMode: 'approaching_flow',
  });
  // 2 * 5e6 * 0.77 * cos(60°=0.5) / 1540 = 2500 Hz
  assert(
    Math.abs(doppler45.dopplerShiftHz - 2500) < 5,
    `Doppler shift at f0=5MHz, v=0.77m/s, θ=60°, c=1540m/s should be +2500 Hz, got ${doppler45.dopplerShiftHz}`
  );
  const doppler90 = calculateDopplerUltrasoundMetrics({
    sourceFrequencyMhz: 5.0,
    targetVelocityMs: 1.2,
    beamAngleDeg: 90,
    targetMotionMode: 'approaching_flow',
  });
  assert(
    doppler90.dopplerShiftHz === 0,
    `At perpendicular beam angle θ = 90°, Doppler shift must be 0 Hz`
  );

  // Model 66: Earth's Magnetic Field & Magnetosphere
  const quietMag = calculateEarthMagnetosphereMetrics({
    solarWindVelocityKms: 400,
    solarWindDensityCm3: 5,
    dipoleTiltDeg: 11.5,
    earthDipoleMomentFactor: 1.0,
  });
  const stormMag = calculateEarthMagnetosphereMetrics({
    solarWindVelocityKms: 800,
    solarWindDensityCm3: 25,
    dipoleTiltDeg: 11.5,
    earthDipoleMomentFactor: 1.0,
  });
  assert(
    stormMag.dynamicPressureNpa > quietMag.dynamicPressureNpa * 15,
    `CME storm solar wind must increase dynamic pressure P_dyn by >15x`
  );
  assert(
    stormMag.magnetopauseStandoffRe < quietMag.magnetopauseStandoffRe,
    `Higher solar wind dynamic pressure must compress dayside magnetopause standoff distance R_mp`
  );

  // Model 67: Semiconductor p–n Junction & Diode
  const pnForward = calculateSemiconductorPnJunctionMetrics({
    semiconductorMaterial: 'silicon_si',
    biasVoltageV: 0.75,
    temperatureKelvin: 300,
  });
  const pnReverse = calculateSemiconductorPnJunctionMetrics({
    semiconductorMaterial: 'silicon_si',
    biasVoltageV: -1.5,
    temperatureKelvin: 300,
  });
  assert(
    pnForward.depletionWidthMicrons < pnReverse.depletionWidthMicrons,
    `Forward bias must narrow depletion width W compared to reverse bias`
  );
  assert(
    pnForward.diodeCurrentMa > 10 && pnReverse.diodeCurrentMa <= 0,
    `Forward bias must drive significant positive current while reverse bias blocks current`
  );

  // Model 68: Radioactive Decay, Half-Life & Alpha–Beta–Gamma Radiation Lab
  const decayHalf = calculateRadioactiveDecayMetrics({
    halfLifeSeconds: 10,
    initialNucleiCount: 1000,
    simTime: 10,
    absorberBarrierPreset: 'all_three_barriers',
    leadShieldThicknessMm: 20,
  });
  assert(
    Math.abs(decayHalf.remainingParentNuclei - 500) <= 2 &&
      Math.abs(decayHalf.undecayedFractionPct - 50) < 0.5,
    `After 1 half-life (t = t_1/2 = 10 s), 50% of parent nuclei (500) must remain`
  );
  assert(
    decayHalf.alphaTransmissionPct === 0 &&
      decayHalf.betaTransmissionPct === 0 &&
      decayHalf.gammaTransmissionPct > 0,
    `With Paper + Al + Lead barriers, α and β⁻ are stopped (0%) while γ penetrates with exponential attenuation`
  );

  // 3. 3D Scene Assembly, Animation & Selection Highlight Isolation Verification
  for (const id of expectedBatch4Ids) {
    const spec = CURATED_AI_MODELS[id];
    const modelRoot = new THREE.Group();
    const meshMap = new Map<string, THREE.Object3D>();
    const interactiveMeshes: THREE.Object3D[] = [];

    // Seed proxy meshes just like Dynamic3DModelRenderer
    spec.parts.forEach((p) => {
      const proxy = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      modelRoot.add(proxy);
      meshMap.set(p.id, proxy);
    });

    const handles = buildBatch4CustomAssemblies(spec, modelRoot, meshMap, interactiveMeshes);
    assert(Boolean(handles.rootGroup), `buildBatch4CustomAssemblies must return rootGroup for '${id}'`);
    assert(
      interactiveMeshes.length >= spec.parts.length,
      `All parts in '${id}' must register interactive 3D meshes`
    );

    // Run animation update and verify finite transforms
    const defaultParams: Record<string, number> = {};
    Object.values(spec.parameters).forEach((p) => (defaultParams[p.id] = p.defaultValue));
    const defaultConds: Record<string, any> = {};
    Object.values(spec.conditions || {}).forEach((c) => (defaultConds[c.id] = c.defaultValue));

    updateBatch4CustomAssemblies(handles, spec, defaultParams, defaultConds, 1.25, meshMap);

    handles.rootGroup.traverse((obj) => {
      assert(
        Number.isFinite(obj.position.x) &&
          Number.isFinite(obj.position.y) &&
          Number.isFinite(obj.position.z),
        `Non-finite 3D position detected in '${id}'`
      );
    });

    // Verify every part ID maps to an active 3D object in meshMap
    spec.parts.forEach((p) => {
      const registeredObj = meshMap.get(p.id);
      assert(Boolean(registeredObj), `Part '${p.id}' in model '${id}' must be registered in meshMap`);
    });
  }

  console.log('✅ All Physics Batch 4 (Models 62–68) tests passed!');
}

runAdvancedPhysicsBatch4Tests();

