import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareScientificTextForSpeech } from '../aiSpeechService';
import { synthesizeProceduralScientificModel } from '../proceduralModelSynthesizer';
import { validateAndSanitizeModelSpec, findCuratedFallback } from '../../server/geminiService';

test('Part A: Global AI Voice Support & Scientific Speech Preprocessor', async (t) => {
  await t.test('converts Markdown, chemical formulas, superscripts, subscripts, and Greek symbols into natural spoken English', () => {
    const raw = '**Key Equation:** In H₂O and CO₂, ΔG = ΔH - TΔS → spontaneous when ΔG ≤ 0 at 25°C.';
    const spoken = prepareScientificTextForSpeech(raw);
    assert.equal(spoken.includes('**'), false);
    assert.equal(spoken.includes('Key Equation'), true);
    assert.equal(spoken.includes('leads to'), true);
    assert.equal(spoken.includes('less than or equal to'), true);
    assert.equal(spoken.includes('degrees Celsius'), true);
  });

  await t.test('splits long scientific explanations into sentence-level utterances smoothly', () => {
    const text =
      '1. The mitochondria generate ATP via oxidative phosphorylation. 2. Electrons flow through the inner membrane complexes. 3. Proton motive force drives ATP synthase rotation.';
    const spoken = prepareScientificTextForSpeech(text);
    assert.ok(spoken.length > 50);
    assert.equal(spoken.includes('mitochondria'), true);
    assert.equal(spoken.includes('ATP synthase'), true);
  });
});

test('Part B: Prompt-Driven 3D Scientific Model Synthesizer', async (t) => {
  await t.test('synthesizes a multi-part 3D molecular geometry for custom chemical formula prompts (e.g. Methane CH4)', () => {
    const model = synthesizeProceduralScientificModel('Create a 3D tetrahedral molecule of Methane (CH4)');
    assert.equal(model.subjectDomain, 'Chemistry');
    assert.ok(model.parts.length >= 6);
    assert.ok(Object.keys(model.parameters).length >= 2);
    assert.ok((model.equations?.length ?? 0) > 0);
    assert.ok(model.whatIsIt);
    assert.ok(model.howDoesItWork);
  });

  await t.test('synthesizes a multi-part 3D biological organelle assembly for Chloroplast prompts', () => {
    const model = synthesizeProceduralScientificModel(
      'Create a 3D model of a plant chloroplast with thylakoid grana stacks and stroma'
    );
    assert.equal(model.subjectDomain, 'Biology');
    assert.ok(model.parts.length >= 7);
    assert.equal(model.parts.some((p) => p.name.toLowerCase().includes('thylakoid')), true);
    assert.equal(model.parts.every((p) => Boolean(p.description && p.whatIsIt && p.whatDoesItDo)), true);
  });

  await t.test('synthesizes a multi-part 3D viral assembly for Bacteriophage prompts', () => {
    const model = synthesizeProceduralScientificModel('Create a 3D model of a Bacteriophage T4 virus');
    assert.equal(model.subjectDomain, 'Biology');
    assert.equal(model.parts.some((p) => p.shape === 'octahedron'), true);
    assert.ok(model.parts.length >= 8);
  });

  await t.test('synthesizes a multi-part 3D physics apparatus for Solenoid Electromagnet prompts', () => {
    const model = synthesizeProceduralScientificModel('Create a 3D model of a solenoid electromagnet with iron core');
    assert.equal(model.subjectDomain, 'Physics');
    assert.ok(model.parts.length >= 7);
    assert.ok(Object.keys(model.parameters).length >= 2);
  });

  await t.test('synthesizes a structured 8-part scientific model for any open-ended scientific prompt', () => {
    const model = synthesizeProceduralScientificModel('Create a 3D model of a volcanic magma chamber and tectonic eruption');
    assert.ok(model.parts.length >= 7);
    assert.ok(Object.keys(model.parameters).length >= 2);
    assert.equal(model.generationSource, 'procedural-synthesizer');
  });

  await t.test('validates and enriches AI-generated model specs with default interactive parameters if missing', () => {
    const rawSpec = {
      id: 'custom-synapse',
      title: 'Neurotransmitter Synapse',
      concept: 'Neurobiology',
      parts: [
        { id: 'p1', name: 'Presynaptic Axon', shape: 'cylinder', dimensions: [0.8, 1.5], position: [0, 1.5, 0], color: '#38bdf8' },
        { id: 'p2', name: 'Postsynaptic Dendrite', shape: 'cylinder', dimensions: [0.9, 1.2], position: [0, -1.5, 0], color: '#f43f5e' },
        { id: 'p3', name: 'Synaptic Vesicle', shape: 'sphere', dimensions: [0.3], position: [0, 0.5, 0], color: '#10b981' },
        { id: 'p4', name: 'Receptor Channel', shape: 'box', dimensions: [0.4, 0.5, 0.4], position: [0, -0.7, 0], color: '#f59e0b' },
      ],
    };
    const sanitized = validateAndSanitizeModelSpec(rawSpec, 'Neurotransmitter Synapse');
    assert.ok(sanitized);
    assert.equal(sanitized.parts.length, 4);
    assert.ok(Object.keys(sanitized.parameters).length >= 2);
  });

  await t.test('routes non-preset custom queries in findCuratedFallback to the procedural synthesizer instead of telescope', () => {
    const fallback = findCuratedFallback('Create a 3D model of Sulfuric Acid H2SO4 molecule');
    assert.equal(fallback.title.includes('Telescope'), false);
    assert.equal(fallback.subjectDomain, 'Chemistry');
    assert.ok(fallback.parts.length >= 7);
  });
});
