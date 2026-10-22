import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import fs from 'fs';
import path from 'path';
import {
  analyzePromptForPresetMatch,
  analyzeModelComplexity,
  evaluateModelRequestDecision,
  HIGH_COMPLEXITY_UNSUPPORTED_MESSAGE,
} from '../utils/intelligentModelMatcher';
import { generate3DModel } from '../server/geminiService';
import { SimpleOrbitControls } from '../simulations/orbitControls';
import { captureInitialModelStateSnapshot } from '../components/models/Dynamic3DModelRenderer';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { ModelPartSpec } from '../types/aiModel';

test('TECH-ANATOMIX — AI-Driven 3D Model Creation & Viewer Reset Fix Suite', async (t) => {
  // =========================================================================
  // 1. Single Prompt Input & Removal of Mode-Selection Controls
  // =========================================================================
  await t.test('1. Removes unnecessary mode-selection controls (Smart Preset / AI Custom / Synthesize Custom) from AiModelGeneratorPage', () => {
    const pagePath = path.resolve(process.cwd(), 'src/pages/AiModelGeneratorPage.tsx');
    const source = fs.readFileSync(pagePath, 'utf-8');

    assert.equal(source.includes('Smart Match + Custom AI'), false);
    assert.equal(source.includes('Custom 3D Synthesis: ON'), false);
    assert.equal(source.includes('Synthesize Custom'), false);

    assert.equal(source.includes('id="ai-prompt-input"'), true);
    assert.equal(source.includes('id="ai-generate-btn"'), true);
    assert.equal(source.includes('Generate 3D Model'), true);
  });

  // =========================================================================
  // 2. Path A — Existing Preset Automatic Selection (Exact & Alias/Natural Language)
  // =========================================================================
  await t.test('2. Exact preset prompt loads existing preset without regenerating via AI', async () => {
    const exactPrompts = [
      { prompt: 'DC Electric Motor', expectedId: 'dc-motor' },
      { prompt: 'Simple Pendulum', expectedId: 'simple-pendulum' },
      { prompt: 'Solar System Explorer', expectedId: 'solar-system' },
      { prompt: 'Four-Stroke Engine', expectedId: 'four-stroke-engine' },
    ];

    for (const { prompt, expectedId } of exactPrompts) {
      const decision = evaluateModelRequestDecision(prompt);
      assert.equal(decision.strategy, 'preset');
      assert.equal(decision.matchedPresetId, expectedId);
      assert.ok(decision.presetSpec);

      const response = await generate3DModel(prompt);
      assert.equal(response.strategy, 'preset');
      assert.ok(response.model);
      assert.equal(response.model.id, expectedId);
    }
  });

  await t.test('3. Alias and natural-language preset prompts load the matching existing preset', async () => {
    const aliasCases = [
      { prompt: 'simplified heart model', expectedIds: ['human-heart', 'heart-explorer'] },
      { prompt: 'cardiac anatomy', expectedIds: ['human-heart', 'heart-explorer'] },
      { prompt: 'hydraulic jack', expectedIds: ['hydraulic-lift'] },
      { prompt: 'galvanic cell with zinc and copper electrodes', expectedIds: ['electrochemical-cell-simulator'] },
    ];

    for (const { prompt, expectedIds } of aliasCases) {
      const decision = evaluateModelRequestDecision(prompt);
      assert.equal(decision.strategy, 'preset', `Expected preset strategy for "${prompt}", got ${decision.strategy}`);
      assert.ok(
        expectedIds.includes(decision.matchedPresetId || ''),
        `Expected ${decision.matchedPresetId} to be in ${expectedIds.join(', ')}`
      );

      const response = await generate3DModel(prompt);
      assert.equal(response.strategy, 'preset');
      assert.ok(expectedIds.includes(response.model?.id || ''));
    }
  });

  // =========================================================================
  // 3. Path B — Simple or Manageable Custom Model Generation
  // =========================================================================
  await t.test('4. Non-preset simple/manageable prompt generates a topic-specific custom 3D model', async () => {
    const decision = evaluateModelRequestDecision('volcano cross-section');
    assert.equal(decision.strategy, 'custom');
    assert.equal(decision.matchedPresetId, null);

    const response = await generate3DModel('volcano cross-section');
    assert.equal(response.strategy, 'custom');
    assert.ok(response.model);
    assert.ok(response.model.parts.length >= 5);
    assert.ok(Object.keys(response.model.parameters || {}).length >= 2);
  });

  await t.test('5. Multiple different custom prompts generate genuinely distinct 3D models', async () => {
    const customPrompts = [
      'volcano cross-section',
      'hydraulic press',
      'human kidney nephron',
      'jet engine cutaway',
      'robotic arm',
      'wind turbine',
      'dna replication',
      'hydraulic braking system',
    ];

    const models: any[] = [];
    for (const prompt of customPrompts) {
      const result = await generate3DModel(prompt);
      assert.equal(result.strategy, 'custom');
      assert.ok(result.model);
      models.push(result.model);
    }

    const ids = new Set(models.map((m) => m.id));
    const titles = new Set(models.map((m) => m.title));
    const partFingerprints = new Set(
      models.map((m) =>
        (m.parts as ModelPartSpec[]).map((p: ModelPartSpec) => `${p.id}:${p.shape}:${p.color}`).join('|')
      )
    );

    assert.equal(ids.size, customPrompts.length);
    assert.equal(titles.size, customPrompts.length);
    assert.equal(partFingerprints.size, customPrompts.length);
  });

  // =========================================================================
  // 4. Path C — Very Complex or Unsupported Model Handling
  // =========================================================================
  await t.test('6. Very complex prompts return the friendly complexity message and concrete simpler suggestions', async () => {
    const complexPrompts = [
      {
        prompt: 'entire human body simulation',
        expectedGuidance: 'Instead of an entire human body simulation, try a simplified heart model.',
        expectedSuggestion: 'simplified heart model',
      },
      {
        prompt: 'complete jet engine simulation',
        expectedGuidance: 'Instead of a complete jet engine simulation, try a jet engine cutaway.',
        expectedSuggestion: 'jet engine cutaway',
      },
      {
        prompt: 'full quantum chromodynamics lattice simulation',
        expectedSuggestion: 'Atomic Orbital Probability Explorer',
      },
    ];

    for (const { prompt, expectedGuidance, expectedSuggestion } of complexPrompts) {
      const complexity = analyzeModelComplexity(prompt);
      assert.equal(complexity.unsupported, true);
      assert.equal(complexity.complexity, 'high');
      assert.equal(complexity.userFacingMessage, HIGH_COMPLEXITY_UNSUPPORTED_MESSAGE);
      if (expectedGuidance) {
        assert.equal(complexity.suggestedSimplerAlternative, expectedGuidance);
      }
      assert.ok(complexity.simplerSuggestions?.includes(expectedSuggestion));

      const matchResult = analyzePromptForPresetMatch(prompt);
      assert.equal(matchResult.outcome, 'unsupported-complexity');
      assert.equal(matchResult.userFacingMessage, HIGH_COMPLEXITY_UNSUPPORTED_MESSAGE);

      const apiResult = await generate3DModel(prompt);
      assert.equal(apiResult.code, 'UNSUPPORTED_COMPLEXITY');
      assert.equal(apiResult.strategy, 'unsupported');
      assert.equal(apiResult.userFacingMessage, HIGH_COMPLEXITY_UNSUPPORTED_MESSAGE);
      assert.ok(apiResult.simplerSuggestions?.includes(expectedSuggestion));
    }
  });

  await t.test('7. Simpler suggested prompts work cleanly when tried afterward', async () => {
    // 1. Complex jet engine fails gracefully with suggestion "jet engine cutaway"
    const complexJet = await generate3DModel('complete jet engine simulation');
    assert.equal(complexJet.code, 'UNSUPPORTED_COMPLEXITY');
    assert.ok(complexJet.simplerSuggestions?.includes('jet engine cutaway'));

    // 2. Trying the suggested "jet engine cutaway" succeeds via Path B custom generation
    const cutawayJet = await generate3DModel('jet engine cutaway');
    assert.equal(cutawayJet.code, undefined);
    assert.equal(cutawayJet.strategy, 'custom');
    assert.ok(cutawayJet.model);
    assert.ok(cutawayJet.model.parts.length >= 5);

    // 3. Trying the suggested "simplified heart model" succeeds via Path A preset match
    const heartModel = await generate3DModel('simplified heart model');
    assert.equal(heartModel.code, undefined);
    assert.equal(heartModel.strategy, 'preset');
    assert.ok(['human-heart', 'heart-explorer'].includes(heartModel.model?.id || ''));
  });

  // =========================================================================
  // 5. Viewer Retry/Reset Button & Initial-State Snapshot Restoration
  // =========================================================================
  const createTestControls = () => {
    const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 1000);
    camera.position.set(6, 4.5, 7.5);
    const dummyElement = {
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    } as unknown as HTMLElement;

    const controls = new SimpleOrbitControls(camera, dummyElement);
    controls.saveInitialState(new THREE.Vector3(6, 4.5, 7.5), new THREE.Vector3(0, 0.2, 0));
    return { camera, controls };
  };

  await t.test('8. Camera orbit + Retry/Reset restores original camera position, spherical angles, and target', () => {
    const { controls } = createTestControls();
    const initialSnap = controls.getStateSnapshot();

    // Simulate user orbiting camera
    controls.rotateBy(1.15, -0.45);
    controls.update();

    const orbitedSnap = controls.getStateSnapshot();
    assert.ok(Math.abs(orbitedSnap.theta - initialSnap.theta) > 0.05);
    assert.ok(Math.abs(orbitedSnap.position[0] - initialSnap.position[0]) > 0.1);

    // Click Retry/Reset
    controls.reset();
    const restoredSnap = controls.getStateSnapshot();

    assert.ok(Math.abs(restoredSnap.position[0] - initialSnap.position[0]) < 1e-4);
    assert.ok(Math.abs(restoredSnap.position[1] - initialSnap.position[1]) < 1e-4);
    assert.ok(Math.abs(restoredSnap.position[2] - initialSnap.position[2]) < 1e-4);
    assert.ok(Math.abs(restoredSnap.theta - initialSnap.theta) < 1e-4);
    assert.ok(Math.abs(restoredSnap.phi - initialSnap.phi) < 1e-4);
  });

  await t.test('9. Camera zoom + Retry/Reset restores original radius, FOV, and camera zoom', () => {
    const { camera, controls } = createTestControls();
    const initialSnap = controls.getStateSnapshot();

    // Simulate user zooming in and changing camera zoom/FOV
    controls.zoomBy(0.45);
    camera.zoom = 1.8;
    camera.fov = 30;
    camera.updateProjectionMatrix();
    controls.update();

    assert.ok(controls.getStateSnapshot().radius < initialSnap.radius);
    assert.equal(camera.zoom, 1.8);

    // Click Retry/Reset
    controls.reset();
    const restoredSnap = controls.getStateSnapshot();

    assert.ok(Math.abs(restoredSnap.radius - initialSnap.radius) < 1e-4);
    assert.ok(Math.abs(restoredSnap.zoom - initialSnap.zoom) < 1e-4);
    assert.ok(Math.abs(restoredSnap.fov - initialSnap.fov) < 1e-4);
  });

  await t.test('10. Camera pan + Retry/Reset restores original target and camera position', () => {
    const { controls } = createTestControls();
    const initialSnap = controls.getStateSnapshot();

    // Simulate user panning camera target
    controls.panBy(220, -160);
    controls.update();

    const pannedSnap = controls.getStateSnapshot();
    assert.ok(Math.abs(pannedSnap.target[0] - initialSnap.target[0]) > 0.05);
    assert.ok(Math.abs(pannedSnap.target[1] - initialSnap.target[1]) > 0.05);

    // Click Retry/Reset
    controls.reset();
    const restoredSnap = controls.getStateSnapshot();

    assert.ok(Math.abs(restoredSnap.target[0] - initialSnap.target[0]) < 1e-4);
    assert.ok(Math.abs(restoredSnap.target[1] - initialSnap.target[1]) < 1e-4);
    assert.ok(Math.abs(restoredSnap.target[2] - initialSnap.target[2]) < 1e-4);
    assert.ok(Math.abs(restoredSnap.position[0] - initialSnap.position[0]) < 1e-4);
    assert.ok(Math.abs(restoredSnap.position[1] - initialSnap.position[1]) < 1e-4);
    assert.ok(Math.abs(restoredSnap.position[2] - initialSnap.position[2]) < 1e-4);
  });

  await t.test('11. Parameter changes + Animation/Simulation state + Retry/Reset restores initial snapshot defaults', () => {
    const dcMotorSpec = CURATED_AI_MODELS.motor;
    const snapshot = captureInitialModelStateSnapshot(dcMotorSpec);

    assert.equal(snapshot.modelId, dcMotorSpec.id);
    assert.equal(snapshot.isPlaying, true);
    assert.equal(snapshot.isExplodedView, false);
    assert.equal(snapshot.selectedPartId, null);
    assert.deepEqual(snapshot.modelPosition, { x: 0, y: 0 });

    for (const param of Object.values(dcMotorSpec.parameters || {})) {
      assert.equal(snapshot.parameters[param.id], param.defaultValue);
    }
    for (const cond of Object.values(dcMotorSpec.conditions || {})) {
      assert.equal(snapshot.conditions[cond.id], cond.defaultValue);
    }
    for (const part of dcMotorSpec.parts) {
      assert.deepEqual(snapshot.partTransforms[part.id], {
        position: [part.position?.[0] ?? 0, part.position?.[1] ?? 0, part.position?.[2] ?? 0],
        rotation: [part.rotation?.[0] ?? 0, part.rotation?.[1] ?? 0, part.rotation?.[2] ?? 0],
        scale: [part.scale?.[0] ?? 1, part.scale?.[1] ?? 1, part.scale?.[2] ?? 1],
        visible: true,
      });
    }
  });

  await t.test('12. Repeated Retry/Reset clicks are idempotent', () => {
    const { controls } = createTestControls();
    const initialSnap = controls.getStateSnapshot();

    controls.rotateBy(0.8, 0.3);
    controls.panBy(100, 80);
    controls.zoomBy(1.5);
    controls.update();

    controls.reset();
    const firstReset = controls.getStateSnapshot();
    controls.reset();
    const secondReset = controls.getStateSnapshot();
    controls.reset();
    const thirdReset = controls.getStateSnapshot();

    assert.deepEqual(firstReset, secondReset);
    assert.deepEqual(secondReset, thirdReset);
    assert.ok(Math.abs(thirdReset.position[0] - initialSnap.position[0]) < 1e-4);
    assert.ok(Math.abs(thirdReset.position[1] - initialSnap.position[1]) < 1e-4);
    assert.ok(Math.abs(thirdReset.position[2] - initialSnap.position[2]) < 1e-4);
  });

  await t.test('13. Switching models updates the reset snapshot to the new model', async () => {
    const firstModel = CURATED_AI_MODELS.motor;
    const secondModelResult = await generate3DModel('volcano cross-section');
    const secondModel = secondModelResult.model!;

    const snapA = captureInitialModelStateSnapshot(firstModel);
    const snapB = captureInitialModelStateSnapshot(secondModel);

    assert.equal(snapA.modelId, firstModel.id);
    assert.equal(snapB.modelId, secondModel.id);
    assert.notEqual(snapA.modelId, snapB.modelId);
    assert.deepEqual(
      Object.keys(snapB.partTransforms),
      secondModel.parts.map((p: ModelPartSpec) => p.id)
    );
    assert.deepEqual(
      Object.keys(snapB.parameters),
      Object.values(secondModel.parameters || {}).map((p: any) => p.id)
    );

    const { controls } = createTestControls();
    controls.saveInitialState(new THREE.Vector3(8, 6, 10), new THREE.Vector3(0, 1, 0));
    controls.rotateBy(1.2, -0.4);
    controls.update();
    controls.reset();

    const updatedCameraSnap = controls.getStateSnapshot();
    assert.ok(Math.abs(updatedCameraSnap.position[0] - 8) < 1e-4);
    assert.ok(Math.abs(updatedCameraSnap.position[1] - 6) < 1e-4);
    assert.ok(Math.abs(updatedCameraSnap.position[2] - 10) < 1e-4);
    assert.deepEqual(updatedCameraSnap.target, [0, 1, 0]);
  });
});
