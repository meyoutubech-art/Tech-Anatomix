import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { matchVerifiedScientificModel } from '../server/geminiService';
import { verifyPresetIntegrity, cachePresetModel } from '../utils/offlineModelManager';

export async function runBatch4BiologyTests() {
  console.log('\n====================================================');
  console.log('VIZLAB BIOLOGY BATCH 2 (MODELS 26–30) VERIFICATION SUITE');
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

  // 1. Check registration of all 5 Biology Batch 2 models
  console.log('\n--- CHECK 1: Registration of Models 26–30 ---');
  const batch4Keys = [
    'plant-cell-explorer',
    'animal-cell-explorer',
    'plant-root-transport',
    'blood-circulation-microscope',
    'neuron-nerve-signal',
  ];

  for (const key of batch4Keys) {
    const model = CURATED_AI_MODELS[key];
    assert(!!model, `Model '${key}' is registered in CURATED_AI_MODELS`);
    assert(model?.parts.length > 0, `Model '${key}' contains ${model?.parts.length || 0} 3D parts`);
    const integrityOk = verifyPresetIntegrity(model);
    assert(integrityOk, `Model '${key}' passes complete 3D geometry and material integrity check`);
  }

  // 2. Model 26: Plant Cell Explorer
  console.log('\n--- CHECK 2: Model 26 (Plant Cell Explorer) Verification ---');
  const m26 = CURATED_AI_MODELS['plant-cell-explorer'];
  assert(m26.title === 'Plant Cell Explorer', 'Model 26 title matches Plant Cell Explorer');
  assert(m26.parts.some((p) => p.id === 'plant-cell-wall'), 'Model 26 contains cellulose cell wall');
  assert(m26.parts.some((p) => p.id === 'plant-cell-membrane'), 'Model 26 contains plasma membrane');
  assert(m26.parts.some((p) => p.id === 'plant-central-vacuole'), 'Model 26 contains large central vacuole with tonoplast');
  assert(m26.parts.some((p) => p.id === 'chloroplast-1') && m26.parts.some((p) => p.id === 'chloroplast-2'), 'Model 26 contains multiple chloroplasts');
  assert(m26.parts.some((p) => p.id === 'enlarged-chloroplast-cutaway'), 'Model 26 contains enlarged chloroplast cutaway');
  assert(m26.parts.some((p) => p.id === 'grana-thylakoid-stack'), 'Model 26 contains thylakoid grana stacks');
  assert('organelleSeparation' in m26.parameters && 'turgorPressure' in m26.parameters, 'Model 26 has organelleSeparation and turgorPressure parameters');
  assert('viewMode' in m26.conditions, 'Model 26 provides viewMode condition');

  // 3. Model 27: Animal Cell Explorer
  console.log('\n--- CHECK 3: Model 27 (Animal Cell Explorer) Verification ---');
  const m27 = CURATED_AI_MODELS['animal-cell-explorer'];
  assert(m27.title === 'Animal Cell Explorer', 'Model 27 title matches Animal Cell Explorer');
  assert(m27.parts.some((p) => p.id === 'animal-plasma-membrane'), 'Model 27 contains plasma membrane (no cell wall)');
  assert(!m27.parts.some((p) => p.id.includes('chloroplast')), 'Model 27 does NOT contain chloroplasts (strict animal cell fidelity)');
  assert(m27.parts.some((p) => p.id === 'animal-nucleus'), 'Model 27 contains nucleus');
  assert(m27.parts.some((p) => p.id === 'animal-centrosome'), 'Model 27 contains centrosome / centrioles');
  assert(m27.parts.some((p) => p.id === 'enlarged-mitochondrion-cutaway'), 'Model 27 contains enlarged mitochondrion cutaway');
  assert(m27.parts.some((p) => p.id === 'mitochondrial-cristae-folds'), 'Model 27 contains inner mitochondrial cristae folds');
  assert('metabolicRate' in m27.parameters && 'organelleSeparation' in m27.parameters, 'Model 27 has metabolicRate and organelleSeparation parameters');

  // 4. Model 28: Plant Root and Transport Explorer
  console.log('\n--- CHECK 4: Model 28 (Plant Root & Transport) Verification ---');
  const m28 = CURATED_AI_MODELS['plant-root-transport'];
  assert(m28.title === 'Plant Root and Transport Explorer', 'Model 28 title matches Plant Root and Transport Explorer');
  assert(m28.parts.some((p) => p.id === 'root-cross-section-disc'), 'Model 28 contains anatomical root cross-section disc');
  assert(m28.parts.some((p) => p.id === 'enlarged-root-hair-cell'), 'Model 28 contains enlarged root hair absorption view');
  assert(m28.parts.some((p) => p.id === 'xylem-vessels-central') && m28.parts.some((p) => p.id === 'phloem-sieve-tubes'), 'Model 28 clearly distinguishes xylem and phloem vessels');
  assert(m28.parts.some((p) => p.id === 'xylem-flow-stream') && m28.parts.some((p) => p.id === 'phloem-flow-stream'), 'Model 28 provides distinct directional flow vectors for transpiration water vs translocation sugars');
  assert('transpirationRate' in m28.parameters && 'soilMoisture' in m28.parameters, 'Model 28 has transpirationRate and soilMoisture parameters');

  // 5. Model 29: Blood and Circulation Microscope
  console.log('\n--- CHECK 5: Model 29 (Blood & Circulation Microscope) Verification ---');
  const m29 = CURATED_AI_MODELS['blood-circulation-microscope'];
  assert(m29.title === 'Blood and Circulation Microscope', 'Model 29 title matches Blood and Circulation Microscope');
  assert(m29.parts.some((p) => p.id === 'rbc-erythrocyte-1'), 'Model 29 contains biconcave red blood cells (erythrocytes)');
  assert(m29.parts.some((p) => p.id === 'wbc-leukocyte-neutrophil'), 'Model 29 contains white blood cells (leukocytes)');
  assert(m29.parts.some((p) => p.id === 'platelet-thrombocyte-1'), 'Model 29 contains platelets (thrombocytes)');
  assert(m29.parts.some((p) => p.id === 'plasma-fluid-lumen'), 'Model 29 contains blood plasma fluid matrix');
  assert(m29.parts.some((p) => p.id === 'fibrin-mesh-clot'), 'Model 29 contains fibrin clot mesh demonstration');
  assert('bloodFlowVelocity' in m29.parameters && 'clottingProgress' in m29.parameters, 'Model 29 has bloodFlowVelocity and clottingProgress parameters');

  // 6. Model 30: Neuron and Nerve Signal Explorer
  console.log('\n--- CHECK 6: Model 30 (Neuron & Nerve Signal Explorer) Verification ---');
  const m30 = CURATED_AI_MODELS['neuron-nerve-signal'];
  assert(m30.title === 'Neuron and Nerve Signal Explorer', 'Model 30 title matches Neuron and Nerve Signal Explorer');
  assert(m30.parts.some((p) => p.id === 'neuron-soma-body') && m30.parts.some((p) => p.id === 'dendrite-branch-1'), 'Model 30 contains neuronal cell body and dendrites');
  assert(m30.parts.some((p) => p.id === 'axon-core-cylinder') && m30.parts.some((p) => p.id === 'myelin-sheath-seg-1'), 'Model 30 contains axon with myelin sheath segments');
  assert(m30.parts.some((p) => p.id === 'electrical-signal-pulse'), 'Model 30 contains electrical action potential pulse');
  assert(m30.parts.some((p) => p.id === 'enlarged-synapse-presynaptic') && m30.parts.some((p) => p.id === 'synaptic-cleft-gap'), 'Model 30 contains separate chemical synapse magnification with synaptic cleft');
  assert(m30.parts.some((p) => p.id === 'neurotransmitter-molecules-cloud'), 'Model 30 contains neurotransmitter exocytosis cloud');
  assert('impulseVelocity' in m30.parameters && 'firingFrequency' in m30.parameters, 'Model 30 has impulseVelocity and firingFrequency parameters');

  // 7. Verify Gemini Model Match Resolution for Models 26–30
  console.log('\n--- CHECK 7: Gemini Model Match Accuracy for Models 26–30 ---');
  const promptTests = [
    { q: 'Create an interactive 3D plant cell with cell wall, chloroplasts, and vacuole', expectedId: 'plant-cell-explorer' },
    { q: 'Interactive animal cell with organelles and mitochondria cutaway', expectedId: 'animal-cell-explorer' },
    { q: 'Plant root and transport explorer with xylem and phloem', expectedId: 'plant-root-transport' },
    { q: 'Blood and circulation microscope with red blood cells and clotting', expectedId: 'blood-circulation-microscope' },
    { q: 'Neuron and nerve signal explorer with action potential and synapse', expectedId: 'neuron-nerve-signal' },
  ];

  for (const { q, expectedId } of promptTests) {
    const matched = matchVerifiedScientificModel(q);
    assert(matched?.id === expectedId, `Query "${q}" matched to '${expectedId}' (got '${matched?.id}')`);
  }

  // 8. Caching / Offline Store Verification
  console.log('\n--- CHECK 8: Local Storage Caching Verification ---');
  for (const key of batch4Keys) {
    const model = CURATED_AI_MODELS[key];
    const cached = await cachePresetModel(model);
    assert(cached, `Model '${key}' successfully serialized and stored in local cache`);
  }

  console.log('\n====================================================');
  console.log(`BIOLOGY BATCH 2 VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    throw new Error(`Biology Batch 2 verification failed with ${failed} errors.`);
  }
}

// Auto-run when executed directly
runBatch4BiologyTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
