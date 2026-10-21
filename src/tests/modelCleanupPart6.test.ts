import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { BATCH_3_MODELS } from '../data/curatedModelsBatch5';
import { BATCH_2_MODELS } from '../data/curatedModelsBatch2';
import { matchOfflinePreset, getUniquePresets } from '../utils/offlineModelManager';
import { matchVerifiedScientificModel } from '../server/geminiService';
import { PHYSICS_BATCH_3_MODELS } from '../pages/PhysicsLabPage';
import { discoverReactions } from '../data/reactionDiscoveryEngine';
import { REACTIONS, REAGENTS } from '../data/reactionsData';
import { calculateCircuitState } from '../simulations/physics/circuitEngine';

test('TECH-ANATOMIX — Model Cleanup Part 6: Complete Removal of Four Unwanted Models', async (t) => {
  // =========================================================================
  // 1. REACTION SIMULATOR COMPLETE REMOVAL
  // =========================================================================
  await t.test('1. Reaction Simulator: Completely removed from registry, functionalTypes, and renderer', () => {
    // Must not exist in CURATED_AI_MODELS
    assert.equal(CURATED_AI_MODELS['chemical-reaction-particles'], undefined);
    assert.equal(CURATED_AI_MODELS['reaction-simulator'], undefined);
    assert.equal(BATCH_2_MODELS.reactionSimulator, undefined);

    // Renderer check
    const rendererPath = path.resolve(process.cwd(), 'src/components/models/Dynamic3DModelRenderer.tsx');
    const rendererCode = fs.readFileSync(rendererPath, 'utf8');
    assert.equal(
      rendererCode.includes('chemical-reaction-particles'),
      false,
      'Dynamic3DModelRenderer must not contain chemical-reaction-particles'
    );

    // aiModel.ts check
    const typesPath = path.resolve(process.cwd(), 'src/types/aiModel.ts');
    const typesCode = fs.readFileSync(typesPath, 'utf8');
    assert.equal(
      typesCode.includes('chemical-reaction-particles'),
      false,
      'aiModel.ts must not contain chemical-reaction-particles'
    );
  });

  // =========================================================================
  // 2. TRANSFORMER COMPLETE REMOVAL
  // =========================================================================
  await t.test('2. Transformer: Inaccessible via registry, gallery, offline manager, and gemini service', () => {
    assert.equal(CURATED_AI_MODELS['electrical-transformer'], undefined);
    assert.equal(CURATED_AI_MODELS['transformer'], undefined);
    assert.equal((BATCH_3_MODELS as any).transformer, undefined);

    // Physics gallery
    const inPhysicsGallery = PHYSICS_BATCH_3_MODELS.some((m) => m.id === 'electrical-transformer' || m.curatedKey === 'transformer');
    assert.equal(inPhysicsGallery, false, 'Transformer must not be in PhysicsLabPage gallery');

    // Generator prompt pills
    const genPagePath = path.resolve(process.cwd(), 'src/pages/AiModelGeneratorPage.tsx');
    const genCode = fs.readFileSync(genPagePath, 'utf8');
    assert.equal(genCode.includes('32. Transformer'), false, 'AiModelGeneratorPage must not have Transformer pill');

    // Offline manager concept match
    const offlineMatch = matchOfflinePreset('electrical transformer turns ratio');
    assert.notEqual(offlineMatch.spec?.id, 'electrical-transformer');

    // Gemini router/service match
    const aiMatch = matchVerifiedScientificModel('Create a 3D model of an electrical transformer with iron core');
    assert.notEqual(aiMatch?.id, 'electrical-transformer');
  });

  // =========================================================================
  // 3. SERIES & PARALLEL COMPLETE REMOVAL
  // =========================================================================
  await t.test('3. Series & Parallel: Inaccessible via registry, gallery, offline manager, and gemini service', () => {
    assert.equal(CURATED_AI_MODELS['series-parallel-circuit'], undefined);
    assert.equal((BATCH_3_MODELS as any).seriesParallelCircuit, undefined);

    // Physics gallery
    const inPhysicsGallery = PHYSICS_BATCH_3_MODELS.some((m) => m.id === 'series-parallel-circuit' || m.curatedKey === 'seriesParallelCircuit');
    assert.equal(inPhysicsGallery, false, 'Series & Parallel must not be in PhysicsLabPage gallery');

    // Generator prompt pills
    const genPagePath = path.resolve(process.cwd(), 'src/pages/AiModelGeneratorPage.tsx');
    const genCode = fs.readFileSync(genPagePath, 'utf8');
    assert.equal(genCode.includes('34. Series & Parallel'), false, 'AiModelGeneratorPage must not have Series & Parallel pill');

    // Offline manager concept match
    const offlineMatch = matchOfflinePreset('series and parallel circuit resistors');
    assert.notEqual(offlineMatch.spec?.id, 'series-parallel-circuit');

    // Gemini service match
    const aiMatch = matchVerifiedScientificModel('Create a 3D model of series and parallel electric circuit lab with switch and resistors');
    assert.notEqual(aiMatch?.id, 'series-parallel-circuit');
  });

  // =========================================================================
  // 4. CONCAVE & CONVEX (LENS OPTICS) COMPLETE REMOVAL
  // =========================================================================
  await t.test('4. Concave & Convex Lens: Inaccessible via registry, gallery, offline manager, and gemini service', () => {
    assert.equal(CURATED_AI_MODELS['lens-optics-explorer'], undefined);
    assert.equal((BATCH_3_MODELS as any).lensOpticsExplorer, undefined);

    // Physics gallery
    const inPhysicsGallery = PHYSICS_BATCH_3_MODELS.some((m) => m.id === 'lens-optics-explorer' || m.curatedKey === 'lensOpticsExplorer');
    assert.equal(inPhysicsGallery, false, 'Lens Optics Explorer must not be in PhysicsLabPage gallery');

    // Generator prompt pills
    const genPagePath = path.resolve(process.cwd(), 'src/pages/AiModelGeneratorPage.tsx');
    const genCode = fs.readFileSync(genPagePath, 'utf8');
    assert.equal(genCode.includes('35. Lens Optics'), false, 'AiModelGeneratorPage must not have Lens Optics pill');

    // Offline manager concept match
    const offlineMatch = matchOfflinePreset('convex and concave lens optics explorer focal length');
    assert.notEqual(offlineMatch.spec?.id, 'lens-optics-explorer');

    // Gemini service match
    const aiMatch = matchVerifiedScientificModel('Create a 3D model of convex and concave lens optics bench with ray traces');
    assert.notEqual(aiMatch?.id, 'lens-optics-explorer');
  });

  // =========================================================================
  // 5. CHEMICAL REACTIONS LAB PRESERVATION
  // =========================================================================
  await t.test('5. Chemical Reactions Lab: Fully preserved, operational, and undamaged', () => {
    assert.ok(REACTIONS.length >= 15, `Chemical Reactions Lab has full reaction catalogue (${REACTIONS.length} reactions)`);
    assert.ok(Object.keys(REAGENTS).length >= 25, `Chemical compound shelf has full library (${Object.keys(REAGENTS).length} reagents)`);

    // Discovery engine works
    const gasDiscovery = discoverReactions('effervescence gas bubbling');
    assert.ok(gasDiscovery.options.length >= 1, 'Reaction discovery engine returns matches for effervescence');

    const pptDiscovery = discoverReactions('golden rain precipitate');
    assert.ok(pptDiscovery.options.length >= 1, 'Reaction discovery engine returns matches for precipitation');
  });

  // =========================================================================
  // 6. SHARED UTILITIES PRESERVATION
  // =========================================================================
  await t.test('6. Shared Utilities: circuitEngine and optics utilities remain intact', () => {
    // calculateCircuitState works for Model 10 (DC Electric Circuit)
    const result = calculateCircuitState({ voltage: 12, resistance: 10, switchClosed: true });
    assert.equal(result.current, 1.2);
    assert.equal(result.power, 14.4);
    assert.ok(result.bulbBrightnessPercent > 0);

    // Check prism and reflection models preserved
    assert.ok(CURATED_AI_MODELS.prismDispersion, 'Prism dispersion model must be preserved');
    assert.ok(CURATED_AI_MODELS.reflectionRefraction, 'Reflection refraction model must be preserved');
  });

  // =========================================================================
  // 7. PRESERVED INTENDED MODELS STILL ACCESSIBLE
  // =========================================================================
  await t.test('7. Other Intended Models: AC Generator, Induction, Heat Transfer, Bell, Engine, Anatomy Explorer, Blood Transport', () => {
    assert.ok(CURATED_AI_MODELS['ac-generator'], 'AC generator must remain registered');
    assert.ok(CURATED_AI_MODELS['electromagnetic-induction'], 'Induction explorer must remain registered');
    assert.ok(CURATED_AI_MODELS['heat-transfer-explorer'], 'Heat transfer explorer must remain registered');
    assert.ok(CURATED_AI_MODELS['four-stroke-engine'], 'Four-stroke engine must remain registered');
    assert.ok(CURATED_AI_MODELS['electric-bell'], 'Electric bell must remain registered');
    assert.ok(CURATED_AI_MODELS['hydroelectric-power'], 'Hydroelectric power must remain registered');
    assert.ok(CURATED_AI_MODELS['motor-effect-fleming'], 'Motor effect must remain registered');
    assert.ok(CURATED_AI_MODELS['blood-transport'], 'Blood transport must remain registered');
    assert.ok(CURATED_AI_MODELS['bonding-explorer'] || CURATED_AI_MODELS.chemicalBonding, 'Bonding explorer must remain registered');

    // Unique preset count check
    const uniquePresets = getUniquePresets();
    assert.equal(uniquePresets.length, 90, `Exactly 90 unique models registered (83 previous + 7 Chemistry Batch 2, got ${uniquePresets.length})`);
  });
});
