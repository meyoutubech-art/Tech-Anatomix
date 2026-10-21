import {
  generate3DModel,
  normalizePrompt,
  matchVerifiedScientificModel,
  findCuratedFallback,
  validateAndSanitizeModelSpec,
} from '../server/geminiService';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';

async function runRegressionTests() {
  console.log('====================================================');
  console.log('VIZLAB PHASE 1.5 PERMANENT MODEL RELIABILITY TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // TEST 1: Astronomical Telescope Repeated Generation & Reliability
  console.log('--- TEST 1: Astronomical Telescope Repeated Generation ---');
  const telescopePrompts = [
    'Create an astronomical telescope',
    'astronomy telescope with lenses',
    'Create a 3D model of a refracting astronomical telescope',
    'Show an astronomical telescope for physics class',
    'optical telescope with eyepiece and objective lens',
  ];

  for (const prompt of telescopePrompts) {
    const res = await generate3DModel(prompt);
    assert(res.success, `Generation call succeeded for prompt: "${prompt}"`);
    assert(
      res.model && res.model.functionalType === 'optical-telescope',
      `Model type resolved to 'optical-telescope' for prompt: "${prompt}" (got '${res.model?.functionalType}')`
    );
    assert(
      res.model && res.model.parts && res.model.parts.length >= 4,
      `Model contains at least 4 modular parts for prompt: "${prompt}"`
    );

    const hasObjective = res.model?.parts.some(
      (p: any) => p.id.includes('objective') || p.name.toLowerCase().includes('objective') || p.opticalRole === 'objectiveLens'
    );
    assert(hasObjective, `Model contains required objective lens part for prompt: "${prompt}"`);
  }

  // TEST 2: Rutherford Gold Foil Experiment Verification
  console.log('\n--- TEST 2: Rutherford Gold Foil Experiment Verification ---');
  const rutherfordPrompts = [
    "Create Rutherford's gold foil experiment",
    'Rutherford alpha particle scattering experiment',
    'gold foil experiment apparatus',
  ];

  for (const prompt of rutherfordPrompts) {
    const res = await generate3DModel(prompt);
    assert(res.success, `Generation call succeeded for prompt: "${prompt}"`);
    assert(
      res.model && res.model.functionalType === 'rutherford-scattering',
      `Model type resolved to 'rutherford-scattering' for prompt: "${prompt}" (got '${res.model?.functionalType}')`
    );

    const parts = res.model?.parts || [];
    const hasFoil = parts.some((p: any) => p.name.toLowerCase().includes('foil') || p.id.includes('foil'));
    const hasSource = parts.some((p: any) => p.name.toLowerCase().includes('source') || p.id.includes('source') || p.name.toLowerCase().includes('emitter') || p.id.includes('emitter'));
    const hasDetector = parts.some((p: any) => p.name.toLowerCase().includes('detector') || p.id.includes('detector') || p.name.toLowerCase().includes('screen') || p.name.toLowerCase().includes('zinc'));

    assert(hasFoil && hasSource && hasDetector, `Model contains gold foil, alpha source, and detector screen for prompt: "${prompt}"`);
    assert(res.model?.conditions?.showTrajectories, `Model supports trajectory rendering condition for prompt: "${prompt}"`);
  }

  // TEST 3: Subject Matching & Multi-Discipline Models
  console.log('\n--- TEST 3: Multi-Discipline Scientific Models ---');
  const subjects = [
    { prompt: 'Create a simple pendulum', expectedType: 'pendulum-harmonics', keyPart: 'bob' },
    { prompt: 'Create a 3D model of a DC electric motor', expectedType: 'dc-motor-assembly', keyPart: 'armature' },
    { prompt: 'Create a 3D model of a class 1 lever', expectedType: 'class-1-lever', keyPart: 'fulcrum' },
    { prompt: 'Create a water molecule', expectedType: 'water-molecule', keyPart: 'oxygen' },
    { prompt: 'Create a eukaryotic cell', expectedType: 'eukaryotic-cell', keyPart: 'nucleus' },
    { prompt: 'Create a DNA double helix', expectedType: 'dna-helix', keyPart: 'strand' },
    { prompt: 'Create a human heart model', expectedType: 'human-heart', keyPart: 'ventricle' },
  ];

  for (const item of subjects) {
    const res = await generate3DModel(item.prompt);
    assert(res.success, `Generation call succeeded for subject: "${item.prompt}"`);
    assert(
      res.model && res.model.functionalType === item.expectedType,
      `Model type resolved to '${item.expectedType}' for prompt: "${item.prompt}" (got '${res.model?.functionalType}')`
    );
  }

  // TEST 4: Fallback Match Accuracy (No Silent Motor Substitutions)
  console.log('\n--- TEST 4: Fallback Match Accuracy ---');
  const fallbackTelescope = findCuratedFallback('astronomy refracting optical telescope with high magnification');
  assert(
    fallbackTelescope && fallbackTelescope.functionalType === 'optical-telescope',
    'Fallback for telescope query returns telescope template (NOT motor)'
  );

  const fallbackRutherford = findCuratedFallback('gold foil alpha scattering atomic nucleus experiment');
  assert(
    fallbackRutherford && fallbackRutherford.functionalType === 'rutherford-scattering',
    'Fallback for Rutherford query returns Rutherford template (NOT motor)'
  );

  const fallbackPendulum = findCuratedFallback('simple harmonic oscillation pendulum bob');
  assert(
    fallbackPendulum && fallbackPendulum.functionalType === 'pendulum-harmonics',
    'Fallback for Pendulum query returns Pendulum template (NOT motor)'
  );

  // TEST 5: Prompt Normalization & Server-side Caching
  console.log('\n--- TEST 5: Prompt Normalization & Caching ---');
  const norm1 = normalizePrompt('Create a 3D model of an astronomical telescope');
  const norm2 = normalizePrompt('create an astronomical telescope');
  assert(norm1 === norm2, `Normalized prompts match: "${norm1}" === "${norm2}"`);

  const firstGen = await generate3DModel('Create a 3D model of an astronomical telescope');
  const cachedGen = await generate3DModel('create an astronomical telescope');
  assert(
    cachedGen.activeModel === 'cache-hit' || cachedGen.activeModel === 'verified-scientific-template',
    'Repeated equivalent prompt uses server-side cache/template deterministically'
  );

  // TEST 6: Malformed Output Sanitization & Repair
  console.log('\n--- TEST 6: Malformed AI Output Sanitization & Repair ---');
  const malformedInput = {
    title: 'Broken Model',
    functionalType: 'optical-telescope',
    camera: { position: [NaN, Infinity, 'invalid'] },
    parts: [
      { id: 'part1', name: 'Tube', shape: 'unknown_shape', dimensions: [NaN, -5, 'abc'], position: [0, '0', 0] },
      { id: 'part2', name: 'Lens', shape: 'cylinder', dimensions: [0.5, 0.1], material: 'fake_mat' },
    ],
  };

  const sanitized = validateAndSanitizeModelSpec(malformedInput, 'Create an astronomical telescope');
  assert(sanitized !== null, 'Sanitizer repairs malformed spec instead of throwing exception');
  assert(
    Array.isArray(sanitized.camera.position) && sanitized.camera.position.every(Number.isFinite),
    'Camera positions sanitized to finite numbers'
  );
  assert(
    sanitized.parts.every((p: any) => Array.isArray(p.dimensions) && p.dimensions.every(Number.isFinite) && p.dimensions.every((d: number) => d > 0)),
    'Part dimensions sanitized to non-zero positive finite numbers'
  );
  assert(
    sanitized.parts.some((p: any) => p.id.includes('objective') || p.opticalRole === 'objectiveLens'),
    'Subject-specific sanitizer injected missing objective lens for telescope model'
  );

  // TEST 7: Request Isolation & Unique Request IDs
  console.log('\n--- TEST 7: Request Isolation & Request IDs ---');
  const reqRes1 = await generate3DModel('Create an astronomical telescope', { requestId: 'req-test-1001' });
  const reqRes2 = await generate3DModel('Create a DC motor', { requestId: 'req-test-1002' });

  assert(reqRes1.requestId === 'req-test-1001', 'Response 1 contains original request identifier req-test-1001');
  assert(reqRes2.requestId === 'req-test-1002', 'Response 2 contains original request identifier req-test-1002');
  assert(
    reqRes1.model.functionalType === 'optical-telescope' && reqRes2.model.functionalType === 'dc-motor-assembly',
    'Consecutive requests isolate model states without cross-contamination'
  );

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runRegressionTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
