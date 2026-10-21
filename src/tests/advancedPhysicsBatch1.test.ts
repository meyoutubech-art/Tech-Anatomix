import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as THREE from 'three';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { ADVANCED_PHYSICS_BATCH_1_MODELS } from '../data/curatedModelsAdvancedPhysicsBatch1';
import {
  calculateEmWaveMetrics,
  calculatePlasmaMetrics,
  calculateAcceleratorMetrics,
  calculateMaglevMetrics,
  calculateSuperconductorMetrics,
  calculateBlackHoleLensingMetrics,
  calculateQuantumTunnellingMetrics,
} from '../simulations/physics/advancedPhysicsBatch1Engine';
import {
  isAdvancedPhysicsBatch1Model,
  buildBatch1CustomAssemblies,
  updateBatch1CustomAssemblies,
} from '../simulations/physics/advancedPhysicsBatch1Studio';
import { matchOfflinePreset } from '../utils/offlineModelManager';

const EXPECTED_BATCH_1_IDS = [
  'electromagnetic-wave-propagation',
  'plasma-physics-explorer',
  'particle-accelerator-explorer',
  'magnetic-levitation-explorer',
  'superconductivity-meissner-explorer',
  'black-hole-gravitational-lensing',
  'quantum-tunnelling-explorer',
];

describe('Tech-Anatomix Batch 1 — Advanced Physics Models (1–7) Premium Studio Verification', () => {
  it('registers all 7 unique Advanced Physics Batch 1 models in CURATED_AI_MODELS without duplicates', () => {
    assert.equal(Object.keys(ADVANCED_PHYSICS_BATCH_1_MODELS).length, 7);

    const batch1Titles = new Set<string>();
    for (const id of EXPECTED_BATCH_1_IDS) {
      const model = CURATED_AI_MODELS[id];
      assert.ok(model, `Model ${id} must be registered in CURATED_AI_MODELS`);
      assert.equal(batch1Titles.has(model.title), false, `Duplicate Batch 1 title: ${model.title}`);
      batch1Titles.add(model.title);
      assert.equal(model.id, id);
      assert.equal(model.functionalType, id);
      assert.equal(isAdvancedPhysicsBatch1Model(model.functionalType, model.id), true);
      assert.ok(model.parts.length >= 6, `Model ${id} should have at least 6 distinct interactive 3D parts`);
      assert.ok(Object.keys(model.parameters).length >= 3, `Model ${id} should have at least 3 interactive parameters`);
      assert.ok(Object.keys(model.conditions).length >= 1, `Model ${id} should have at least 1 interactive condition`);
      assert.ok(model.equations && model.equations.length >= 3, `Model ${id} should include governing equations`);
    }
  });

  it('restores the original compact pill-shaped black-text label design matching Models 1–40', () => {
    for (const id of EXPECTED_BATCH_1_IDS) {
      const model = CURATED_AI_MODELS[id];
      assert.equal(
        model.labelStyle,
        undefined,
        `Model ${id} must use the default pill-shaped badge label design from Models 1–40`
      );

      for (const part of model.parts) {
        assert.ok(part.label && part.label.trim().length > 0, `Part ${part.id} in ${id} must have a label`);
        assert.equal(
          part.labelColor,
          undefined,
          `Part ${part.id} in ${id} must not override with unboxed coloured text`
        );
        assert.ok(part.description && part.description.length > 20, `Part ${part.id} must have a rich description`);
        assert.ok(part.whatIsIt && part.whatIsIt.length > 10, `Part ${part.id} must have whatIsIt`);
        assert.ok(part.whatDoesItDo && part.whatDoesItDo.length > 10, `Part ${part.id} must have whatDoesItDo`);
      }
    }

    const overlayPath = path.resolve(process.cwd(), 'src/components/common/ExternalCalloutOverlay.tsx');
    const overlaySrc = fs.readFileSync(overlayPath, 'utf-8');
    assert.ok(
      overlaySrc.includes('rounded-full') &&
        overlaySrc.includes('bg-white/95') &&
        overlaySrc.includes('text-slate-900'),
      'ExternalCalloutOverlay must render the original compact pill-shaped container with black text (text-slate-900)'
    );
  });

  it('constructs composite multi-mesh 3D procedural assemblies and runs real-time animation for all 7 models', () => {
    for (const id of EXPECTED_BATCH_1_IDS) {
      const model = CURATED_AI_MODELS[id];
      const modelRoot = new THREE.Group();
      const meshMap = new Map<string, THREE.Object3D>();
      const interactiveMeshes: THREE.Object3D[] = [];

      for (const part of model.parts) {
        const proxy = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
        proxy.position.set(part.position[0], part.position[1], part.position[2]);
        modelRoot.add(proxy);
        meshMap.set(part.id, proxy);
        interactiveMeshes.push(proxy);
      }

      const handles = buildBatch1CustomAssemblies(model, modelRoot, meshMap, interactiveMeshes);
      assert.ok(handles.rootGroup.children.length > 5, `Model ${id} must build composite 3D studio assemblies`);

      const defaultParams: Record<string, number> = {};
      Object.values(model.parameters).forEach((p) => {
        defaultParams[p.id] = p.defaultValue;
      });
      const defaultConds: Record<string, any> = {};
      Object.values(model.conditions).forEach((c) => {
        defaultConds[c.id] = c.defaultValue;
      });

      // Verify animation executes cleanly across frames without error
      updateBatch1CustomAssemblies(handles, model, defaultParams, defaultConds, 0.5, meshMap);
      updateBatch1CustomAssemblies(handles, model, defaultParams, defaultConds, 1.2, meshMap);
    }
  });

  it('computes accurate physical metrics across all 7 Batch 1 simulation engines', () => {
    // 1. EM Wave Propagation
    const em1 = calculateEmWaveMetrics({ amplitude: 1.2, wavelength: 2.0 });
    const em2 = calculateEmWaveMetrics({ amplitude: 2.4, wavelength: 1.0 });
    assert.ok(em2.frequencyMhz > em1.frequencyMhz, 'Shorter wavelength must yield higher frequency f = c/λ');
    assert.ok(em2.poyntingIntensityWm2 > em1.poyntingIntensityWm2, 'Larger amplitude must increase Poynting intensity');

    // 2. Plasma Physics
    const plLowB = calculatePlasmaMetrics({ plasmaTemperature: 15000, particleDensity: 8, magneticFieldB: 0.4, electricFieldE: 100 });
    const plHighB = calculatePlasmaMetrics({ plasmaTemperature: 15000, particleDensity: 8, magneticFieldB: 1.6, electricFieldE: 100 });
    assert.ok(plHighB.electronLarmorRadiusMm < plLowB.electronLarmorRadiusMm, 'Stronger B field must tighten Larmor gyroradius r_L = mv/(|q|B)');
    assert.ok(plHighB.ionLarmorRadiusMm < plLowB.ionLarmorRadiusMm, 'Stronger B field must tighten ion Larmor gyroradius');

    // 3. Particle Accelerator
    const accLowV = calculateAcceleratorMetrics({ acceleratingVoltageKv: 40, dipoleFieldTesla: 0.6, particleMassAmu: 1 });
    const accHighV = calculateAcceleratorMetrics({ acceleratingVoltageKv: 160, dipoleFieldTesla: 0.6, particleMassAmu: 1 });
    assert.equal(accHighV.kineticEnergyKev, 160, 'Kinetic energy gain ΔK = qV in keV for singly-charged ion');
    assert.ok(accHighV.betaFractionC > accLowV.betaFractionC, 'Higher accelerating voltage must increase beam velocity');
    assert.equal(accHighV.magneticWorkJoules, 0, 'Magnetic Lorentz force does zero mechanical work (F_B ⊥ v)');

    // 4. Magnetic Levitation
    const magLowI = calculateMaglevMetrics({ magnetCurrentKa: 45, payloadMassKg: 400, dampingGain: 0.5 });
    const magHighI = calculateMaglevMetrics({ magnetCurrentKa: 90, payloadMassKg: 400, dampingGain: 0.5 });
    assert.ok(magHighI.equilibriumGapMm > magLowI.equilibriumGapMm, 'Higher coil current must increase equilibrium levitation gap');

    // 5. Superconductivity & Meissner Effect
    const scCold = calculateSuperconductorMetrics({ specimenTemperatureK: 77, criticalTempK: 92, appliedFieldMt: 80 });
    const scWarm = calculateSuperconductorMetrics({ specimenTemperatureK: 115, criticalTempK: 92, appliedFieldMt: 80 });
    assert.equal(scCold.isSuperconducting, true, 'At T = 77 K < Tc = 92 K, specimen is superconducting');
    assert.equal(scCold.internalMagneticFieldMt, 0, 'Meissner state expels internal magnetic flux (B_inside = 0)');
    assert.ok(scCold.levitationHeightMm > 0, 'Superconducting state levitates the rare-earth magnet');
    assert.equal(scWarm.isSuperconducting, false, 'At T = 115 K > Tc = 92 K, specimen transitions to normal state');
    assert.equal(scWarm.levitationHeightMm, 0, 'Normal state loses Meissner levitation');

    // 6. Black Hole & Gravitational Lensing
    const bhSafe = calculateBlackHoleLensingMetrics({ blackHoleMassSolar: 20, impactParameterRs: 4.0, sourceAlignmentOffset: 0 });
    const bhCaptured = calculateBlackHoleLensingMetrics({ blackHoleMassSolar: 20, impactParameterRs: 2.0, sourceAlignmentOffset: 0 });
    assert.equal(bhSafe.isPhotonCaptured, false, 'Impact parameter b > 2.6 r_s bends without capture');
    assert.equal(bhCaptured.isPhotonCaptured, true, 'Impact parameter b < 2.6 r_s is captured by the black hole');
    assert.ok(
      Math.abs(bhSafe.photonSphereRadiusKm - bhSafe.schwarzschildRadiusKm * 1.5) < 0.02,
      'Photon sphere radius r_ph = 1.5 r_s'
    );

    // 7. Quantum Tunnelling
    const qtThin = calculateQuantumTunnellingMetrics({ particleEnergyEv: 4.0, barrierHeightEv: 6.0, barrierWidthNm: 0.2 });
    const qtThick = calculateQuantumTunnellingMetrics({ particleEnergyEv: 4.0, barrierHeightEv: 6.0, barrierWidthNm: 0.8 });
    const qtClassical = calculateQuantumTunnellingMetrics({ particleEnergyEv: 7.5, barrierHeightEv: 6.0, barrierWidthNm: 0.4 });
    assert.equal(qtThin.regime, 'tunnelling');
    assert.ok(qtThin.transmissionProbability > qtThick.transmissionProbability, 'Thinner barrier must yield exponentially higher tunnelling probability');
    assert.equal(+(qtThin.transmissionProbability + qtThin.reflectionProbability).toFixed(4), 1.0, 'Unitarity T + R = 1 must hold');
    assert.equal(qtClassical.regime, 'over-barrier');
  });

  it('resolves all 7 Batch 1 Physics concepts via offline prompt engine', () => {
    const promptChecks: Array<[string, string]> = [
      ['electromagnetic wave propagation with electric and magnetic fields', 'electromagnetic-wave-propagation'],
      ['plasma physics ionized gas larmor gyromotion and debye shielding', 'plasma-physics-explorer'],
      ['particle accelerator rf cavity and dipole bending magnet', 'particle-accelerator-explorer'],
      ['magnetic levitation maglev train suspension mechanism', 'magnetic-levitation-explorer'],
      ['superconductivity meissner effect flux expulsion below critical temperature', 'superconductivity-meissner-explorer'],
      ['black hole gravitational lensing event horizon and einstein ring', 'black-hole-gravitational-lensing'],
      ['quantum tunnelling wave function barrier penetration', 'quantum-tunnelling-explorer'],
    ];

    for (const [prompt, expectedId] of promptChecks) {
      const matched = matchOfflinePreset(prompt);
      assert.ok(matched.matched && matched.spec, `Prompt "${prompt}" must resolve via matchOfflinePreset`);
      assert.equal(matched.spec.id, expectedId, `Prompt "${prompt}" should resolve to ${expectedId}`);
    }
  });
});
