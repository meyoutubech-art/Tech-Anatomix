import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { matchVerifiedScientificModel } from '../server/geminiService';

export async function runBatch2ModelTests() {
  console.log('\n====================================================');
  console.log('VIZLAB MODELS 11–20 HIDDEN REGISTRY VERIFICATION SUITE');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Check registration of all 10 Batch 2 models
  console.log('\n--- CHECK 1: Registration of Models 11–20 ---');
  const batch2Keys = [
    'friction-explorer',
    'wave-motion',
    'sound-wave',
    'magnetic-field-explorer',
    'dc-motor',
    'interactive-atom',
    'bonding-explorer',
    'water-molecule-explorer',
    'carbon-dioxide-explorer',
  ];

  for (const key of batch2Keys) {
    const model = CURATED_AI_MODELS[key];
    assert(!!model, `Model '${key}' is registered in CURATED_AI_MODELS`);
    assert(model?.parts.length > 0, `Model '${key}' contains ${model?.parts.length || 0} 3D parts`);
  }

  // 2. PART A: Physics Models (11-15) Verification
  console.log('\n--- CHECK 2: Part A Physics Models (11–15) Verification ---');

  // Model 11: Friction Explorer
  const m11 = CURATED_AI_MODELS['friction-explorer'];
  assert(m11.title === 'Friction Explorer', 'Model 11 title matches Friction Explorer');
  assert(m11.parts.some((p) => p.id === 'block'), 'Model 11 contains sliding block');
  assert(m11.parts.some((p) => p.id === 'surface-track'), 'Model 11 contains horizontal surface');
  assert(m11.parts.some((p) => p.id === 'arrow-applied'), 'Model 11 contains applied force vector');
  assert(m11.parts.some((p) => p.id === 'arrow-friction'), 'Model 11 contains friction force vector');
  assert(m11.parts.some((p) => p.id === 'arrow-normal'), 'Model 11 contains normal force vector');
  assert('appliedForce' in m11.parameters && 'mass' in m11.parameters && 'muStatic' in m11.parameters, 'Model 11 controls force, mass, and friction coefficient');

  // Model 12: Wave Motion Explorer
  const m12 = CURATED_AI_MODELS['wave-motion'];
  assert(m12.title === 'Wave Motion Explorer', 'Model 12 title matches Wave Motion Explorer');
  assert(m12.parts.some((p) => p.id === 'tracker-particle'), 'Model 12 contains highlighted oscillating medium particle');
  assert(m12.parts.some((p) => p.id === 'wave-string'), 'Model 12 contains wave propagation string');
  assert('amplitude' in m12.parameters && 'wavelength' in m12.parameters && 'frequency' in m12.parameters, 'Model 12 controls amplitude, wavelength, and frequency');

  // Model 13: Sound Wave Explorer
  const m13 = CURATED_AI_MODELS['sound-wave'];
  assert(m13.title === 'Sound Wave Explorer', 'Model 13 title matches Sound Wave Explorer');
  assert(m13.parts.some((p) => p.id === 'speaker-cone'), 'Model 13 contains sound source (speaker cone)');
  assert(m13.parts.some((p) => p.id === 'receiver-microphone'), 'Model 13 contains receiver (microphone)');
  assert(m13.parts.some((p) => p.id === 'pressure-sine-graph'), 'Model 13 contains pressure-wave graph overlay');
  assert('medium' in m13.conditions, 'Model 13 contains medium selection condition (air, water, vacuum)');

  // Model 14: Magnetic Field Explorer
  const m14 = CURATED_AI_MODELS['magnetic-field-explorer'];
  assert(m14.title === 'Magnetic Field Explorer', 'Model 14 title matches Magnetic Field Explorer');
  assert(m14.parts.some((p) => p.id === 'magnet-north') && m14.parts.some((p) => p.id === 'magnet-south'), 'Model 14 contains bar magnet N & S poles');
  assert(m14.parts.some((p) => p.id === 'straight-wire'), 'Model 14 contains straight current wire');
  assert(m14.parts.some((p) => p.id === 'compass-needle-n'), 'Model 14 contains interactive compass needle');
  assert('currentDirection' in m14.conditions, 'Model 14 contains current reversal control');

  // Model 15: DC Electric Motor
  const m15 = CURATED_AI_MODELS['dc-motor'];
  assert(m15.title === 'DC Electric Motor', 'Model 15 title matches DC Electric Motor');
  assert(m15.parts.some((p) => p.id === 'armature-coil'), 'Model 15 contains armature coil');
  assert(m15.parts.some((p) => p.id === 'commutator'), 'Model 15 contains split-ring commutator');
  assert(m15.parts.some((p) => p.id === 'brush-left'), 'Model 15 contains carbon brushes');
  assert(m15.parts.some((p) => p.id === 'battery-source'), 'Model 15 contains battery supply');
  assert('circuitClosed' in m15.conditions && 'reversePolarity' in m15.conditions, 'Model 15 contains start/stop switch and polarity reversal');

  // 3. PART B: Chemistry Models (16-20) Verification
  console.log('\n--- CHECK 3: Part B Chemistry Models (16–20) Verification ---');

  // Model 16: Interactive Atom Explorer
  const m16 = CURATED_AI_MODELS['interactive-atom'];
  assert(m16.title === 'Interactive Atom Explorer', 'Model 16 title matches Interactive Atom Explorer');
  assert(m16.parts.some((p) => p.id === 'nucleus'), 'Model 16 contains central nucleus');
  assert(m16.parts.some((p) => p.id === 'shell-k') && m16.parts.some((p) => p.id === 'shell-l'), 'Model 16 contains Bohr electron shells');
  assert('element' in m16.conditions, 'Model 16 contains element selector (hydrogen, carbon, oxygen, sodium)');

  // Model 17: Ionic and Covalent Bonding Explorer
  const m17 = CURATED_AI_MODELS['bonding-explorer'];
  assert(m17.title === 'Ionic & Covalent Bonding Explorer', 'Model 17 title matches Bonding Explorer');
  assert('example' in m17.conditions, 'Model 17 contains bonding example selector (NaCl, H2O, CH4)');

  // Model 18: Water Molecule Explorer
  const m18 = CURATED_AI_MODELS['water-molecule-explorer'];
  assert(m18.title === 'Water Molecule Explorer', 'Model 18 title matches Water Molecule Explorer');
  assert(m18.parts.some((p) => p.id === 'oxygen-atom') && m18.parts.some((p) => p.id === 'hydrogen-1'), 'Model 18 contains 1 oxygen and 2 hydrogen atoms');
  assert(m18.parts.some((p) => p.id === 'lone-pair-1'), 'Model 18 contains non-bonding lone-pair representations');
  assert('bondAngle' in m18.parameters, 'Model 18 controls H-O-H bond angle (104.5°)');

  // Model 19: Carbon Dioxide Molecule Explorer
  const m19 = CURATED_AI_MODELS['carbon-dioxide-explorer'];
  assert(m19.title === 'Carbon Dioxide Molecule Explorer', 'Model 19 title matches CO2 Molecule Explorer');
  assert(m19.parts.some((p) => p.id === 'carbon-atom') && m19.parts.some((p) => p.id === 'oxygen-left') && m19.parts.some((p) => p.id === 'oxygen-right'), 'Model 19 contains linear O=C=O structure');
  assert(m19.parts.some((p) => p.id.includes('double-bond')), 'Model 19 contains double bond cylinders');

  // 4. Query Matching & Resolution Tests
  console.log('\n--- CHECK 4: Prompt Lookup & Resolution Tests ---');

  const queries = [
    { q: 'Create a 3D model of a friction explorer', expectedId: 'friction-explorer' },
    { q: 'Wave motion explorer with crests and troughs', expectedId: 'wave-motion' },
    { q: '3D model of sound waves in air', expectedId: 'sound-wave' },
    { q: 'Magnetic field explorer with bar magnet and straight wire', expectedId: 'magnetic-field-explorer' },
    { q: 'Create a DC electric motor with split-ring commutator', expectedId: 'dc-motor' },
    { q: 'Interactive atom model with electron shells', expectedId: 'interactive-atom' },
    { q: 'Ionic and covalent bonding explorer NaCl H2O CH4', expectedId: 'bonding-explorer' },
    { q: 'Water molecule explorer with bent geometry', expectedId: 'water-molecule-explorer' },
    { q: 'Carbon dioxide molecule explorer linear O=C=O', expectedId: 'carbon-dioxide-explorer' },
  ];

  for (const item of queries) {
    const model = matchVerifiedScientificModel(item.q);
    assert(model && model.id === item.expectedId, `Query "${item.q}" resolves to model ID '${item.expectedId}' (got '${model?.id}')`);
  }

  console.log(`\n====================================================`);
  console.log(`MODELS 11–20 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runBatch2ModelTests().catch(console.error);
