import { describe, it, expect } from 'vitest';
import { prepareScientificTextForSpeech } from '../aiSpeechService';
import { synthesizeProceduralScientificModel } from '../proceduralModelSynthesizer';
import { validateAndSanitizeModelSpec, findCuratedFallback } from '../../server/geminiService';

describe('Part A: Global AI Voice Support & Scientific Speech Preprocessor', () => {
  it('converts Markdown, chemical formulas, superscripts, subscripts, and Greek symbols into natural spoken English', () => {
    const raw = '**Key Equation:** In H₂O and CO₂, ΔG = ΔH - TΔS → spontaneous when ΔG ≤ 0 at 25°C.';
    const spoken = prepareScientificTextForSpeech(raw);
    expect(spoken).not.toContain('**');
    expect(spoken).toContain('Key Equation');
    expect(spoken).toContain('leads to');
    expect(spoken).toContain('less than or equal to');
    expect(spoken).toContain('degrees Celsius');
  });

  it('splits long scientific explanations into sentence-level utterances smoothly', () => {
    const text =
      '1. The mitochondria generate ATP via oxidative phosphorylation. 2. Electrons flow through the inner membrane complexes. 3. Proton motive force drives ATP synthase rotation.';
    const spoken = prepareScientificTextForSpeech(text);
    expect(spoken.length).toBeGreaterThan(50);
    expect(spoken).toContain('mitochondria');
    expect(spoken).toContain('ATP synthase');
  });
});

describe('Part B: Prompt-Driven 3D Scientific Model Synthesizer', () => {
  it('synthesizes a multi-part 3D molecular geometry for custom chemical formula prompts (e.g. Methane CH4)', () => {
    const model = synthesizeProceduralScientificModel('Create a 3D tetrahedral molecule of Methane (CH4)');
    expect(model.subjectDomain).toBe('Chemistry');
    expect(model.parts.length).toBeGreaterThanOrEqual(6);
    expect(Object.keys(model.parameters).length).toBeGreaterThanOrEqual(2);
    expect(model.equations && model.equations.length).toBeGreaterThan(0);
    expect(model.whatIsIt).toBeTruthy();
    expect(model.howDoesItWork).toBeTruthy();
  });

  it('synthesizes a multi-part 3D biological organelle assembly for Chloroplast prompts', () => {
    const model = synthesizeProceduralScientificModel(
      'Create a 3D model of a plant chloroplast with thylakoid grana stacks and stroma'
    );
    expect(model.subjectDomain).toBe('Biology');
    expect(model.parts.length).toBeGreaterThanOrEqual(7);
    expect(model.parts.some((p) => p.name.toLowerCase().includes('thylakoid'))).toBe(true);
    expect(model.parts.every((p) => Boolean(p.description && p.whatIsIt && p.whatDoesItDo))).toBe(true);
  });

  it('synthesizes a multi-part 3D viral assembly for Bacteriophage prompts', () => {
    const model = synthesizeProceduralScientificModel('Create a 3D model of a Bacteriophage T4 virus');
    expect(model.subjectDomain).toBe('Biology');
    expect(model.parts.some((p) => p.shape === 'octahedron')).toBe(true);
    expect(model.parts.length).toBeGreaterThanOrEqual(8);
  });

  it('synthesizes a multi-part 3D physics apparatus for Solenoid Electromagnet prompts', () => {
    const model = synthesizeProceduralScientificModel('Create a 3D model of a solenoid electromagnet with iron core');
    expect(model.subjectDomain).toBe('Physics');
    expect(model.parts.length).toBeGreaterThanOrEqual(7);
    expect(Object.keys(model.parameters).length).toBeGreaterThanOrEqual(2);
  });

  it('synthesizes a structured 8-part scientific model for any open-ended scientific prompt', () => {
    const model = synthesizeProceduralScientificModel('Create a 3D model of a volcanic magma chamber and tectonic eruption');
    expect(model.parts.length).toBeGreaterThanOrEqual(7);
    expect(Object.keys(model.parameters).length).toBeGreaterThanOrEqual(2);
    expect(model.generationSource).toBe('procedural-synthesizer');
  });

  it('validates and enriches AI-generated model specs with default interactive parameters if missing', () => {
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
    expect(sanitized).not.toBeNull();
    expect(sanitized.parts.length).toBe(4);
    expect(Object.keys(sanitized.parameters).length).toBeGreaterThanOrEqual(2);
  });

  it('routes non-preset custom queries in findCuratedFallback to the procedural synthesizer instead of telescope', () => {
    const fallback = findCuratedFallback('Create a 3D model of Sulfuric Acid H2SO4 molecule');
    expect(fallback.title).not.toContain('Telescope');
    expect(fallback.subjectDomain).toBe('Chemistry');
    expect(fallback.parts.length).toBeGreaterThanOrEqual(7);
  });
});
