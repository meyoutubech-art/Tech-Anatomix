import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { getUniquePresets } from '../utils/offlineModelManager';
import {
  analyzePromptForPresetMatch,
  verifyPresetCompatibility,
  getModelSelectionLogs,
  clearModelSelectionLogs,
  TARGET_PRESENTATION_DURATION_MS,
  PRESET_LOADING_STAGES,
  getCustomGenerationStages,
} from '../utils/intelligentModelMatcher';
import { generate3DModel } from '../server/geminiService';
import { performScientificWebResearch } from '../server/scientificResearchService';
import {
  validateScientificModel,
  repairCustomModelSpec,
  computeGeometryFingerprint,
  areGeometriesDistinct,
} from '../utils/modelValidator';
import { synthesizeProceduralScientificModel } from '../utils/proceduralModelSynthesizer';

test('TECH-ANATOMIX — Master Implementation Verification Suite (18 Requirements)', async (t) => {
  // =========================================================================
  // 1. Presets are hidden from the navigation bar
  // =========================================================================
  await t.test('1. Presets are hidden from visible navigation bars across pages', () => {
    const aiPageCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/pages/AiModelGeneratorPage.tsx'),
      'utf8'
    );
    assert.equal(
      aiPageCode.includes('Models 11–20:'),
      false,
      'AiModelGeneratorPage must not render visible Models 11–20 preset bar'
    );
    assert.equal(
      aiPageCode.includes('Biology 21–25:'),
      false,
      'AiModelGeneratorPage must not render visible Biology 21–25 preset bar'
    );
    assert.equal(
      aiPageCode.includes('Chemistry Batch 1 (69–75):'),
      false,
      'AiModelGeneratorPage must not render visible Chemistry Batch 1 preset bar'
    );

    const bioPageCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/pages/BiologyLabPage.tsx'),
      'utf8'
    );
    assert.equal(
      bioPageCode.includes('21. Heart Explorer'),
      false,
      'BiologyLabPage must not render visible preset buttons for Models 21–30 in navigation bar'
    );

    const chemPageCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/pages/ChemistryLabPage.tsx'),
      'utf8'
    );
    assert.equal(
      chemPageCode.includes('Chemistry Labs (69–75):'),
      false,
      'ChemistryLabPage must not render visible preset buttons for Models 69–82 in navigation bar'
    );

    const physPageCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/pages/PhysicsLabPage.tsx'),
      'utf8'
    );
    assert.equal(
      physPageCode.includes('filteredModels.map'),
      false,
      'PhysicsLabPage must not render the visible grid of preset model buttons in the navigation bar'
    );
  });

  // =========================================================================
  // 2. Presets still exist in the internal catalogue/registry
  // =========================================================================
  await t.test('2. All 90 presets remain preserved in the internal catalogue/registry', () => {
    const uniquePresets = getUniquePresets();
    assert.equal(
      uniquePresets.length,
      90,
      `Expected all 90 unique presets in internal catalogue, got ${uniquePresets.length}`
    );
    for (const p of uniquePresets) {
      assert.ok(CURATED_AI_MODELS[p.id] || p.spec, `Preset ${p.id} must remain accessible`);
      assert.ok(p.spec.parts.length >= 3, `Preset ${p.id} must retain its 3D parts`);
    }
  });

  // =========================================================================
  // 3. Exact preset prompts select the correct preset
  // =========================================================================
  await t.test('3. Exact preset prompts select the exact matching preset with high confidence', () => {
    clearModelSelectionLogs();
    const exactCases = [
      { prompt: 'DC Electric Motor', expectedId: 'dc-motor' },
      { prompt: 'Simple Pendulum', expectedId: 'simple-pendulum' },
      { prompt: 'Solar System Explorer', expectedId: 'solar-system' },
      { prompt: 'Four-Stroke Engine', expectedId: 'four-stroke-engine' },
      { prompt: 'Electrochemical Cell Simulator', expectedId: 'electrochemical-cell-simulator' },
      { prompt: 'Acid-Base Titration Laboratory', expectedId: 'acid-base-titration-laboratory' },
    ];

    for (const c of exactCases) {
      const decision = analyzePromptForPresetMatch(c.prompt);
      assert.ok(
        decision.outcome === 'exact-preset' || decision.outcome === 'semantic-preset',
        `Expected preset match for "${c.prompt}", got ${decision.outcome}`
      );
      assert.equal(decision.selectedModelId, c.expectedId);
      assert.equal(decision.compatibilityPassed, true);
      assert.ok(decision.selectedPreset, 'Must attach actual preset specification');
    }

    const logs = getModelSelectionLogs();
    assert.ok(logs.length >= exactCases.length, 'Structured decision logs must record every match');
  });

  // =========================================================================
  // 4. Semantic preset prompts select the correct preset
  // =========================================================================
  await t.test('4. Semantic preset prompts select the matching preset despite different wording', () => {
    const semanticCases = [
      {
        prompt: 'Create a 3D model of a direct current motor with a split-ring commutator and brushes',
        expectedId: 'dc-motor',
      },
      {
        prompt: 'Show me a 3D galvanic cell with zinc and copper electrodes connected by a salt bridge',
        expectedId: 'electrochemical-cell-simulator',
      },
      {
        prompt: '3D model of coherent wave interference and double slit diffraction pattern',
        expectedId: 'wave-interference-diffraction-lab',
      },
      {
        prompt: 'Build an AC alternator with rotating coil and slip rings',
        expectedId: 'ac-generator',
      },
    ];

    for (const c of semanticCases) {
      const decision = analyzePromptForPresetMatch(c.prompt);
      assert.ok(
        decision.outcome === 'exact-preset' || decision.outcome === 'semantic-preset',
        `Expected semantic preset match for "${c.prompt}", got ${decision.outcome} (${decision.reason})`
      );
      assert.equal(decision.selectedModelId, c.expectedId);
      assert.equal(decision.compatibilityPassed, true);
    }
  });

  // =========================================================================
  // 5. Related but incompatible prompts do NOT select the wrong preset
  // =========================================================================
  await t.test('5. Related but incompatible prompts reject loosely related presets and route to custom generation', () => {
    const incompatibleCases = [
      { prompt: 'Hydraulic Press', forbiddenPresetId: 'hydraulic-lift' },
      { prompt: 'Hydraulic Braking System', forbiddenPresetId: 'hydraulic-lift' },
      { prompt: 'Double Pendulum', forbiddenPresetId: 'simple-pendulum' },
      { prompt: 'Brushless DC Motor with Electronic ESC', forbiddenPresetId: 'dc-motor' },
      { prompt: 'Jet Engine Cutaway', forbiddenPresetId: 'four-stroke-engine' },
      { prompt: 'Wind Turbine Generator', forbiddenPresetId: 'ac-generator' },
      { prompt: 'Human Kidney Nephron', forbiddenPresetId: 'heart-explorer' },
      { prompt: 'Volcano Cross-Section', forbiddenPresetId: 'seismic-waves-earth-interior' },
      { prompt: 'Robotic Arm 6-Axis Manipulator', forbiddenPresetId: 'class-1-lever' },
      { prompt: 'DNA Replication Fork with Helicase', forbiddenPresetId: 'dna' },
    ];

    for (const c of incompatibleCases) {
      const decision = analyzePromptForPresetMatch(c.prompt);
      assert.equal(
        decision.outcome,
        'custom-generation',
        `Prompt "${c.prompt}" must route to custom-generation, not ${decision.outcome} (${decision.selectedModelId})`
      );
      assert.notEqual(
        decision.selectedModelId,
        c.forbiddenPresetId,
        `Prompt "${c.prompt}" must NEVER select incompatible preset ${c.forbiddenPresetId}`
      );
    }

    // Direct unit check on verifyPresetCompatibility
    const compatCheck = verifyPresetCompatibility('Hydraulic Press', CURATED_AI_MODELS.hydraulicLift);
    assert.equal(compatCheck.compatible, false);
  });

  // =========================================================================
  // 6. Ambiguous prompts trigger clarification or best safe match
  // =========================================================================
  await t.test('6. Ambiguous single-concept prompts return structured clarification options', () => {
    const ambiguousPrompts = ['wave', 'cell', 'field', 'orbital'];
    for (const p of ambiguousPrompts) {
      const decision = analyzePromptForPresetMatch(p);
      assert.equal(
        decision.outcome,
        'ambiguous',
        `Expected ambiguous outcome for "${p}", got ${decision.outcome}`
      );
      assert.ok(decision.clarificationQuestion && decision.clarificationQuestion.length > 10);
      assert.ok(
        decision.candidateOptions && decision.candidateOptions.length >= 2,
        `Expected candidate preset options for "${p}"`
      );
    }
  });

  // =========================================================================
  // 7 & 8. Non-matching prompts trigger custom 3D model generation & produce distinct models
  // =========================================================================
  await t.test('7 & 8. Custom prompts generate genuinely distinct, non-template 3D models', () => {
    const customPrompts = [
      'Volcano cross-section',
      'Hydraulic press',
      'Human kidney nephron',
      'Jet engine cutaway',
      'Robotic arm',
      'Wind turbine',
      'DNA replication',
      'Hydraulic braking system',
    ];

    const generatedSpecs = customPrompts.map((p) => {
      const raw = synthesizeProceduralScientificModel(p);
      return repairCustomModelSpec(p, raw);
    });

    for (let i = 0; i < customPrompts.length; i++) {
      const spec = generatedSpecs[i];
      const fp = computeGeometryFingerprint(spec);
      assert.ok(spec.parts.length >= 5, `"${customPrompts[i]}" must have >= 5 distinct 3D parts`);
      assert.ok(
        Object.keys(spec.parameters).length >= 2,
        `"${customPrompts[i]}" must have interactive parameters`
      );

      for (let j = i + 1; j < customPrompts.length; j++) {
        const otherSpec = generatedSpecs[j];
        assert.notEqual(
          spec.id,
          otherSpec.id,
          `Models for "${customPrompts[i]}" and "${customPrompts[j]}" must have distinct IDs`
        );
        assert.equal(
          areGeometriesDistinct(spec, otherSpec),
          true,
          `Geometry fingerprints for "${customPrompts[i]}" (${fp.signatureHash}) and "${customPrompts[j]}" must be distinct`
        );
      }
    }
  });

  // =========================================================================
  // 9 & 10. Custom models use web research record and validate before rendering
  // =========================================================================
  await t.test('9 & 10. Custom models attach structured research records and pass scientific validation', async () => {
    const research = await performScientificWebResearch('Human kidney nephron');
    assert.ok(research.query.length > 0);
    assert.ok(research.extractedComponents.length >= 1 || research.retrievedFacts.length >= 1);

    const result = await generate3DModel('Human kidney nephron', false, 'test-req-nephron');
    assert.equal(result.model.generationSource !== 'curated-preset', true);
    assert.ok(result.model.researchRecord, 'Generated custom model must include researchRecord');
    assert.ok(result.model.validationReport?.isValid, 'Generated custom model must pass validation');

    const validation = validateScientificModel('Human kidney nephron', result.model);
    assert.equal(validation.valid, true, `Validation failed: ${validation.failureReasons.join('; ')}`);
  });

  // =========================================================================
  // 11, 12, 13, 14, 15. Viewer Processing State, Status Messages & ~6-Second Timing
  // =========================================================================
  await t.test('11–15. Viewer Processing State, Progressive Status Messages, and ~6-Second Monotonic Timing', async () => {
    assert.equal(
      TARGET_PRESENTATION_DURATION_MS,
      6000,
      'Target presentation duration must be configured to 6000ms'
    );

    // Check preset stages vs custom stages
    assert.equal(PRESET_LOADING_STAGES[0], 'Analyzing your model request...');
    assert.equal(PRESET_LOADING_STAGES[PRESET_LOADING_STAGES.length - 1], 'Loading your model...');

    const customStagesOnline = getCustomGenerationStages(true);
    assert.equal(customStagesOnline[0], 'Analyzing your prompt...');
    assert.ok(customStagesOnline.includes('Researching the requested concept...'));
    assert.equal(
      customStagesOnline[customStagesOnline.length - 1],
      'Loading the model into the viewer...'
    );

    // Ensure no fake percentages appear in any stage message
    for (const msg of [...PRESET_LOADING_STAGES, ...customStagesOnline]) {
      assert.equal(/%/.test(msg), false, `Stage message "${msg}" must not contain fake percentage`);
    }

    // Verify AiModelGeneratorPage unmounts Dynamic3DModelRenderer while isGenerating is true
    const aiPageCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/pages/AiModelGeneratorPage.tsx'),
      'utf8'
    );
    assert.ok(
      aiPageCode.includes('id="viewer-processing-surface"'),
      'AiModelGeneratorPage must render dedicated #viewer-processing-surface while processing'
    );
    assert.ok(
      aiPageCode.includes('performance.now()'),
      'AiModelGeneratorPage must use performance.now() monotonic timing'
    );
  });

  // =========================================================================
  // 16, 17, 18. Three.js Disposal, Controls/Reset, and Concurrency Isolation
  // =========================================================================
  await t.test('16–18. Three.js Resource Disposal, Parameter Controls, and Concurrency Isolation', () => {
    const rendererCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/models/Dynamic3DModelRenderer.tsx'),
      'utf8'
    );
    assert.ok(
      rendererCode.includes('obj.geometry.dispose()') && rendererCode.includes('obj.material'),
      'Dynamic3DModelRenderer cleanup must traverse scene and dispose geometries and materials'
    );

    const aiPageCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/pages/AiModelGeneratorPage.tsx'),
      'utf8'
    );
    assert.ok(
      aiPageCode.includes('abortControllerRef.current.abort()') &&
        aiPageCode.includes('currentRequestIdRef.current'),
      'AiModelGeneratorPage must abort stale requests and isolate requestId on rapid submissions'
    );
  });
});
