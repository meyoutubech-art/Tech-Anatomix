import * as THREE from 'three';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import {
  calculateFaradayInductionMetrics,
  calculateMotorGeneratorMetrics,
  calculateTransformerCouplingMetrics,
  calculateWaveInterferenceMetrics,
  calculateInterferometerMetrics,
  calculateFluidDynamicsMetrics,
  calculateTokamakFusionMetrics,
} from '../simulations/physics/advancedPhysicsBatch2Engine';
import {
  isAdvancedPhysicsBatch2Model,
  buildBatch2CustomAssemblies,
  updateBatch2CustomAssemblies,
} from '../simulations/physics/advancedPhysicsBatch2Studio';
import { matchOfflinePreset } from '../utils/offlineModelManager';
import { matchVerifiedScientificModel } from '../server/geminiService';

console.log('=== Running Physics Batch 2: Models 48–54 Verification Tests ===');

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

const EXPECTED_BATCH_2_IDS = [
  'faraday-law-induction-explorer',
  'motor-generator-energy-explorer',
  'ac-voltage-transformer-explorer',
  'wave-interference-diffraction-lab',
  'optical-interferometer-explorer',
  'fluid-dynamics-bernoulli-vortex',
  'tokamak-fusion-confinement-explorer',
];

// 1. Verify Registry & Educational Metadata Integrity for Models 48–54
for (const modelId of EXPECTED_BATCH_2_IDS) {
  const spec = CURATED_AI_MODELS[modelId];
  assert(Boolean(spec), `[${modelId}] Registered in CURATED_AI_MODELS`);
  assert(
    isAdvancedPhysicsBatch2Model(spec.functionalType, spec.id),
    `[${modelId}] Recognized by isAdvancedPhysicsBatch2Model`
  );
  assert(spec.parts.length >= 6, `[${modelId}] Contains at least 6 distinct 3D parts (found ${spec.parts.length})`);
  assert(
    Object.keys(spec.parameters).length >= 3,
    `[${modelId}] Contains at least 3 interactive parameters (found ${Object.keys(spec.parameters).length})`
  );
  assert(
    Boolean(spec.whatIsIt && spec.howDoesItWork && spec.realLifeExample && spec.examConnection && spec.equations?.length),
    `[${modelId}] Has complete educational metadata, formulas, and exam connection`
  );

  for (const part of spec.parts) {
    assert(
      Boolean(part.id && part.name && part.label && part.whatIsIt && part.whatDoesItDo),
      `[${modelId}] Part '${part.id}' has complete educational inspector fields`
    );
  }
}

// 2. Verify Mathematical Physics Engine Accuracy & Parameter Responsiveness
// Model 48: Faraday's Law
const faradayZeroVel = calculateFaradayInductionMetrics({
  magnetPosition: -1.6,
  magnetVelocity: 0,
  magneticFieldStrength: 1.0,
  coilTurns: 100,
  reverseDirection: false,
  simTime: 0.5,
  isPlaying: true,
});
const faradayMoving = calculateFaradayInductionMetrics({
  magnetPosition: -1.6,
  magnetVelocity: 2.5,
  magneticFieldStrength: 1.4,
  coilTurns: 250,
  reverseDirection: false,
  simTime: 0.25,
  isPlaying: true,
});
assert(
  faradayZeroVel.inducedEmfVolts === 0 &&
    faradayZeroVel.lenzForceDirection === 'zero-stationary' &&
    Math.abs(faradayMoving.inducedEmfVolts) > 0 &&
    faradayMoving.instantaneousFluxMwb > 0,
  'Model 48 (Faraday Law): Zero EMF when stationary (v=0) and non-zero induced EMF and Lenz opposition when moving'
);

// Model 49: Motor & Generator
const motorMetrics = calculateMotorGeneratorMetrics({
  operatingMode: 'motor_mode',
  supplyVoltage: 18,
  magneticFieldT: 1.2,
  loadResistanceOhm: 10,
  reverseDirection: false,
  loadConnected: true,
});
const genMetrics = calculateMotorGeneratorMetrics({
  operatingMode: 'generator_mode',
  mechanicalInputRpm: 360,
  magneticFieldT: 1.2,
  loadResistanceOhm: 10,
  reverseDirection: false,
  loadConnected: true,
});
assert(
  motorMetrics.electromagneticTorqueNm > 0 &&
    motorMetrics.inducedBackOrOutputEmfV > 0 &&
    genMetrics.inducedBackOrOutputEmfV > 0 &&
    genMetrics.electricalPowerWatts > 0,
  'Model 49 (Motor & Generator): Computes Lorentz torque, back-EMF in motor mode, and induced output power in generator mode'
);

// Model 50: AC Voltage Transformer
const stepUp = calculateTransformerCouplingMetrics({
  primaryVoltageV: 120,
  acFrequencyHz: 60,
  primaryTurnsNp: 200,
  secondaryTurnsNs: 600,
  loadConnected: true,
});
const dcZero = calculateTransformerCouplingMetrics({
  primaryVoltageV: 120,
  acFrequencyHz: 0,
  primaryTurnsNp: 200,
  secondaryTurnsNs: 600,
  loadConnected: true,
});
assert(
  stepUp.modeClassification === 'step-up' &&
    Math.abs(stepUp.turnsRatio - 3.0) < 0.01 &&
    stepUp.idealSecondaryVoltageV === 360 &&
    dcZero.modeClassification === 'dc-zero-induction' &&
    dcZero.idealSecondaryVoltageV === 0,
  'Model 50 (AC Transformer): Computes turns ratio Ns/Np, step-up voltage, and zero secondary voltage at DC (0 Hz)'
);

// Model 51: Wave Interference & Diffraction
const waveLowFreq = calculateWaveInterferenceMetrics({
  experimentMode: 'two_source_interference',
  sourceFrequencyHz: 1.5,
  sourceSeparationD: 1.8,
  relativePhaseDeg: 0,
});
const waveHighFreq = calculateWaveInterferenceMetrics({
  experimentMode: 'two_source_interference',
  sourceFrequencyHz: 3.0,
  sourceSeparationD: 1.8,
  relativePhaseDeg: 180,
});
assert(
  waveLowFreq.wavelengthUnits > waveHighFreq.wavelengthUnits &&
    waveLowFreq.centralIntensityNormalized === 1 &&
    waveHighFreq.centralIntensityNormalized === 0,
  'Model 51 (Wave Interference & Diffraction): Wavelength scales inversely with frequency and out-of-phase (180°) produces central node'
);

// Model 52: Optical Interferometer
const interfConstructive = calculateInterferometerMetrics({
  mirrorDisplacementNm: 0,
  wavelengthNm: 532,
  phaseOffsetDeg: 0,
  beamContrast: 1.0,
});
const interfDestructive = calculateInterferometerMetrics({
  mirrorDisplacementNm: 133, // OPD = 2 * 133 = 266 nm = lambda / 2
  wavelengthNm: 532,
  phaseOffsetDeg: 0,
  beamContrast: 1.0,
});
assert(
  interfConstructive.interferenceState === 'constructive-bright' &&
    interfDestructive.interferenceState === 'destructive-dark' &&
    Math.abs(interfDestructive.fringeShiftCount - 0.5) < 0.02,
  'Model 52 (Optical Interferometer): Quarter-wave mirror shift (Δd = λ/4 -> OPD = λ/2) switches constructive maximum to destructive minimum'
);

// Model 53: Fluid Dynamics (Bernoulli & Vortex)
const fluidWide = calculateFluidDynamicsMetrics({
  inletFlowRateLs: 10,
  throatDiameterRatio: 0.8,
  fluidDensityKgM3: 1000,
});
const fluidNarrow = calculateFluidDynamicsMetrics({
  inletFlowRateLs: 10,
  throatDiameterRatio: 0.45,
  fluidDensityKgM3: 1000,
});
assert(
  fluidNarrow.throatVelocityMs > fluidWide.throatVelocityMs &&
    fluidNarrow.bernoulliPressureDropKpa > fluidWide.bernoulliPressureDropKpa &&
    fluidNarrow.throatStaticPressureKpa < fluidNarrow.inletStaticPressureKpa,
  'Model 53 (Fluid Dynamics): Narrower Venturi throat increases fluid velocity v2 = v1(A1/A2) and increases Bernoulli static pressure drop'
);

// Model 54: Nuclear Fusion Tokamak
const tokamakLowB = calculateTokamakFusionMetrics({
  toroidalFieldTesla: 3.0,
  plasmaCurrentMa: 6.0,
  plasmaTemperatureKev: 10.0,
  confinementQualityH: 1.0,
});
const tokamakHighB = calculateTokamakFusionMetrics({
  toroidalFieldTesla: 6.0,
  plasmaCurrentMa: 6.0,
  plasmaTemperatureKev: 15.0,
  confinementQualityH: 1.2,
});
assert(
  tokamakHighB.magneticPressureAtm > tokamakLowB.magneticPressureAtm * 3.5 &&
    tokamakHighB.edgeSafetyFactorQ95 > tokamakLowB.edgeSafetyFactorQ95 &&
    tokamakHighB.illustrativeTripleProductIndex > tokamakLowB.illustrativeTripleProductIndex,
  'Model 54 (Nuclear Fusion Tokamak): Magnetic pressure P_mag = B²/(2μ₀), safety factor q₉₅, and triple product scale accurately'
);

// 3. Verify 3D Assembly Construction, Part Isolation & Blue Selection Highlighting across all 7 models
for (const modelId of EXPECTED_BATCH_2_IDS) {
  const spec = CURATED_AI_MODELS[modelId];
  const modelRoot = new THREE.Group();
  const meshMap = new Map<string, THREE.Object3D>();
  const interactiveMeshes: THREE.Object3D[] = [];

  for (const part of spec.parts) {
    const dummy = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: part.color })
    );
    modelRoot.add(dummy);
    meshMap.set(part.id, dummy);
    interactiveMeshes.push(dummy);
  }

  const handles = buildBatch2CustomAssemblies(spec, modelRoot, meshMap, interactiveMeshes);
  assert(Boolean(handles), `[${modelId}] buildBatch2CustomAssemblies returns valid scene handles`);

  const defaultParams: Record<string, number> = {};
  Object.values(spec.parameters).forEach((p) => {
    defaultParams[p.id] = p.defaultValue;
  });
  const defaultConds: Record<string, any> = {};
  Object.values(spec.conditions).forEach((c) => {
    defaultConds[c.id] = c.defaultValue;
  });
  updateBatch2CustomAssemblies(handles, spec, defaultParams, defaultConds, 1.25, meshMap);

  const seenObjects = new Set<THREE.Object3D>();
  for (const part of spec.parts) {
    const obj = meshMap.get(part.id);
    assert(Boolean(obj && obj.visible), `[${modelId}] Part '${part.id}' is registered and visible in meshMap`);
    if (obj) {
      assert(!seenObjects.has(obj), `[${modelId}] Part '${part.id}' has a unique, isolated 3D Group`);
      seenObjects.add(obj);

      let meshCount = 0;
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          meshCount++;
        }
      });
      assert(meshCount > 0, `[${modelId}] Part '${part.id}' contains renderable 3D geometry (${meshCount} meshes/lines)`);
    }
  }

  // Verify Blue Selection Highlighting Isolation: selecting part[0] turns ONLY part[0] blue (0x38bdf8)
  const firstPartId = spec.parts[0].id;
  const secondPartId = spec.parts[1].id;

  const applyHighlightToMap = (selectedId: string | null) => {
    meshMap.forEach((obj, partId) => {
      const isSelected = selectedId === partId;
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          const m = (child as any).material as THREE.Material;
          if (!m) return;
          if ('emissive' in m) {
            const stdMat = m as THREE.MeshStandardMaterial;
            if (stdMat.userData.defaultEmissive === undefined) {
              stdMat.userData.defaultEmissive = stdMat.emissive.clone();
              stdMat.userData.defaultEmissiveIntensity = stdMat.emissiveIntensity;
            }
            if (isSelected) {
              stdMat.emissive.set(0x38bdf8);
              stdMat.emissiveIntensity = 0.85;
            } else {
              stdMat.emissive.copy(stdMat.userData.defaultEmissive);
              stdMat.emissiveIntensity = stdMat.userData.defaultEmissiveIntensity;
            }
          }
        }
      });
    });
  };

  applyHighlightToMap(firstPartId);
  let firstHasBlue = false;
  let secondHasBlue = false;
  meshMap.get(firstPartId)?.traverse((c) => {
    if (c instanceof THREE.Mesh && 'emissive' in c.material) {
      if ((c.material as THREE.MeshStandardMaterial).emissive.getHex() === 0x38bdf8) {
        firstHasBlue = true;
      }
    }
  });
  meshMap.get(secondPartId)?.traverse((c) => {
    if (c instanceof THREE.Mesh && 'emissive' in c.material) {
      if ((c.material as THREE.MeshStandardMaterial).emissive.getHex() === 0x38bdf8) {
        secondHasBlue = true;
      }
    }
  });
  assert(
    firstHasBlue && !secondHasBlue,
    `[${modelId}] Selecting '${firstPartId}' highlights ONLY '${firstPartId}' in blue (0x38bdf8) without bleeding into '${secondPartId}'`
  );

  applyHighlightToMap(null);
  let firstStillBlue = false;
  meshMap.get(firstPartId)?.traverse((c) => {
    if (c instanceof THREE.Mesh && 'emissive' in c.material) {
      const stdMat = c.material as THREE.MeshStandardMaterial;
      if (
        stdMat.emissive.getHex() === 0x38bdf8 &&
        stdMat.userData.defaultEmissive.getHex() !== 0x38bdf8
      ) {
        firstStillBlue = true;
      }
    }
  });
  assert(!firstStillBlue, `[${modelId}] Deselecting '${firstPartId}' restores original material state`);
}

// 4. Verify Offline & Server Prompt Matching for Models 48–54
const promptCases = [
  {
    prompt: "Create a 3D model of Faraday's law of electromagnetic induction with bar magnet and Lenz's law",
    expectedId: 'faraday-law-induction-explorer',
  },
  {
    prompt: 'Create a 3D model of an electric motor and generator energy conversion explorer with back-EMF',
    expectedId: 'motor-generator-energy-explorer',
  },
  {
    prompt: 'Create a 3D model of an AC voltage transformer with laminated core and mutual inductance',
    expectedId: 'ac-voltage-transformer-explorer',
  },
  {
    prompt: 'Create a 3D model of wave interference and diffraction lab with double slit',
    expectedId: 'wave-interference-diffraction-lab',
  },
  {
    prompt: 'Create a 3D model of optical interference with thin film and Michelson interferometer',
    expectedId: 'optical-interferometer-explorer',
  },
  {
    prompt: 'Create a 3D model of fluid dynamics and aerodynamics with Venturi tube and Bernoulli pressure',
    expectedId: 'fluid-dynamics-bernoulli-vortex',
  },
  {
    prompt: 'Create a 3D model of nuclear fusion reactor magnetic confinement with Tokamak plasma',
    expectedId: 'tokamak-fusion-confinement-explorer',
  },
];

for (const tc of promptCases) {
  const offlineRes = matchOfflinePreset(tc.prompt);
  const serverRes = matchVerifiedScientificModel(tc.prompt);
  assert(
    offlineRes.matched && offlineRes.spec?.id === tc.expectedId,
    `Offline preset matcher resolves "${tc.prompt.slice(0, 45)}..." -> ${tc.expectedId}`
  );
  assert(
    serverRes?.id === tc.expectedId,
    `Server verified model matcher resolves "${tc.prompt.slice(0, 45)}..." -> ${tc.expectedId}`
  );
}

console.log(`=== Physics Batch 2 Tests Complete: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) {
  process.exit(1);
}
