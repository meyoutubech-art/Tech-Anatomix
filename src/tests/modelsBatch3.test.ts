import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { matchVerifiedScientificModel } from '../server/geminiService';
import { verifyPresetIntegrity, cachePresetModel } from '../utils/offlineModelManager';

export async function runBatch3BiologyTests() {
  console.log('\n====================================================');
  console.log('VIZLAB BIOLOGY BATCH 1 (MODELS 21–25) VERIFICATION SUITE');
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

  // 1. Check registration of all 5 Biology Batch 1 models
  console.log('\n--- CHECK 1: Registration of Models 21–25 ---');
  const batch3Keys = [
    'heart-explorer',
    'respiratory-explorer',
    'digestive-system',
    'brain-explorer',
    'eye-vision',
  ];

  for (const key of batch3Keys) {
    const model = CURATED_AI_MODELS[key];
    assert(!!model, `Model '${key}' is registered in CURATED_AI_MODELS`);
    assert(model?.parts.length > 0, `Model '${key}' contains ${model?.parts.length || 0} 3D parts`);
    const integrityOk = verifyPresetIntegrity(model);
    assert(integrityOk, `Model '${key}' passes complete 3D geometry and material integrity check`);
  }

  // 2. Model 21: Human Heart Explorer
  console.log('\n--- CHECK 2: Model 21 (Human Heart Explorer) Verification ---');
  const m21 = CURATED_AI_MODELS['heart-explorer'];
  assert(m21.title === 'Human Heart Explorer', 'Model 21 title matches Human Heart Explorer');
  assert(m21.parts.some((p) => p.id === 'right-atrium') && m21.parts.some((p) => p.id === 'left-atrium'), 'Model 21 contains right and left atria');
  assert(m21.parts.some((p) => p.id === 'right-ventricle') && m21.parts.some((p) => p.id === 'left-ventricle'), 'Model 21 contains right and left ventricles');
  assert(m21.parts.some((p) => p.id === 'interventricular-septum'), 'Model 21 contains interventricular septum separating oxygenated/deoxygenated streams');
  assert(m21.parts.some((p) => p.id === 'tricuspid-valve') && m21.parts.some((p) => p.id === 'bicuspid-mitral-valve'), 'Model 21 contains tricuspid and bicuspid (mitral) atrioventricular valves');
  assert(m21.parts.some((p) => p.id === 'aortic-valve') && m21.parts.some((p) => p.id === 'pulmonary-valve'), 'Model 21 contains aortic and pulmonary semilunar valves');
  assert(m21.parts.some((p) => p.id === 'aortic-arch') && m21.parts.some((p) => p.id === 'pulmonary-trunk'), 'Model 21 contains aorta and pulmonary artery trunk');
  assert(m21.parts.some((p) => p.id === 'superior-vena-cava') && m21.parts.some((p) => p.id === 'inferior-vena-cava'), 'Model 21 contains superior and inferior vena cava veins');
  assert(m21.parts.some((p) => p.id === 'blood-flow-deox-stream') && m21.parts.some((p) => p.id === 'blood-flow-ox-stream'), 'Model 21 contains animated directional blue and red blood-flow vectors');
  assert(Boolean(m21.embedHtml && m21.embedHtml.includes('sketchfab.com')), 'Model 21 contains Sketchfab 3D embed code');
  assert(Object.keys(m21.parameters).length === 0, 'Model 21 has parameters removed per specification');

  // 3. Model 22: Human Respiratory System
  console.log('\n--- CHECK 3: Model 22 (Human Respiratory System) Verification ---');
  const m22 = CURATED_AI_MODELS['respiratory-explorer'];
  assert(m22.title.includes('Respiratory System'), 'Model 22 title matches Human Respiratory System');
  assert(m22.parts.some((p) => p.id === 'trachea-trunk') && m22.parts.some((p) => p.id === 'carina-bifurcation'), 'Model 22 contains trachea with cartilage rings and carina bifurcation');
  assert(m22.parts.some((p) => p.id === 'primary-bronchus-right') && m22.parts.some((p) => p.id === 'primary-bronchus-left'), 'Model 22 contains right and left primary main bronchi');
  assert(m22.parts.some((p) => p.id === 'bronchial-tree-arbor'), 'Model 22 contains branching bronchial-tree arborization');
  assert(m22.parts.some((p) => p.id === 'right-lung-superior') && m22.parts.some((p) => p.id === 'right-lung-middle') && m22.parts.some((p) => p.id === 'right-lung-inferior'), 'Model 22 contains 3 distinct lobes for the right lung');
  assert(m22.parts.some((p) => p.id === 'left-lung-superior') && m22.parts.some((p) => p.id === 'left-lung-inferior'), 'Model 22 contains 2 lobes for the left lung with cardiac notch');
  assert(m22.parts.some((p) => p.id === 'diaphragm-dome'), 'Model 22 contains muscular dome diaphragm floor');
  assert(m22.parts.some((p) => p.id === 'alveolar-sac-enlarged') && m22.parts.some((p) => p.id === 'pulmonary-capillary-mesh'), 'Model 22 contains enlarged microscopic alveolus and capillary mesh');
  assert(m22.parts.some((p) => p.id === 'o2-diffusion-vector') && m22.parts.some((p) => p.id === 'co2-diffusion-vector'), 'Model 22 contains O2 and CO2 counter-diffusion vectors across respiratory membrane');
  assert(Boolean(m22.embedHtml && m22.embedHtml.includes('sketchfab.com')), 'Model 22 contains Sketchfab 3D embed code');
  assert(Object.keys(m22.parameters).length === 0, 'Model 22 has parameters removed per specification');

  // 4. Model 23: Human Digestive System
  console.log('\n--- CHECK 4: Model 23 (Human Digestive System) Verification ---');
  const m23 = CURATED_AI_MODELS['digestive-system'];
  assert(m23.title === 'Human Digestive System', 'Model 23 title matches Human Digestive System');
  assert(m23.parts.some((p) => p.id === 'oral-cavity-mouth') && m23.parts.some((p) => p.id === 'pharynx-esophagus'), 'Model 23 contains mouth/oral cavity and muscular oesophagus');
  assert(m23.parts.some((p) => p.id === 'stomach-body') && m23.parts.some((p) => p.id === 'stomach-rugae-cutaway'), 'Model 23 contains stomach body and internal gastric rugae cutaway');
  assert(m23.parts.some((p) => p.id === 'duodenum-c-loop') && m23.parts.some((p) => p.id === 'jejunum-ileum-coils'), 'Model 23 contains duodenum C-loop and convoluted small intestine coils');
  assert(m23.parts.some((p) => p.id === 'liver-lobes') && m23.parts.some((p) => p.id === 'gallbladder-sac') && m23.parts.some((p) => p.id === 'pancreas-gland'), 'Model 23 contains accessory digestive organs: liver, gallbladder, pancreas');
  assert(m23.parts.some((p) => p.id === 'caecum-appendix') && m23.parts.some((p) => p.id === 'ascending-colon') && m23.parts.some((p) => p.id === 'transverse-colon') && m23.parts.some((p) => p.id === 'descending-sigmoid-colon'), 'Model 23 contains complete framed large intestine colon');
  assert(m23.parts.some((p) => p.id === 'food-bolus-particle'), 'Model 23 contains animated food bolus / chyme peristalsis vector');
  assert(m23.parts.some((p) => p.id === 'intestinal-villus-enlarged') && m23.parts.some((p) => p.id === 'villus-capillary-lacteal'), 'Model 23 contains enlarged intestinal villus with capillary and lacteal');
  assert(Boolean(m23.embedHtml && m23.embedHtml.includes('sketchfab.com')), 'Model 23 contains Sketchfab 3D embed code');
  assert(Object.keys(m23.parameters).length === 0, 'Model 23 has parameters removed per specification');

  // 5. Model 24: Human Brain Explorer
  console.log('\n--- CHECK 5: Model 24 (Human Brain Explorer) Verification ---');
  const m24 = CURATED_AI_MODELS['brain-explorer'];
  assert(m24.title === 'Human Brain Explorer', 'Model 24 title matches Human Brain Explorer');
  assert(m24.parts.some((p) => p.id === 'frontal-lobe-cortex') && m24.parts.some((p) => p.id === 'parietal-lobe-cortex'), 'Model 24 contains frontal and parietal cerebral cortex lobes');
  assert(m24.parts.some((p) => p.id === 'temporal-lobe-cortex') && m24.parts.some((p) => p.id === 'occipital-lobe-cortex'), 'Model 24 contains temporal and occipital cerebral cortex lobes');
  assert(m24.parts.some((p) => p.id === 'cerebellar-hemispheres'), 'Model 24 contains cerebellum hemispheres for motor coordination');
  assert(m24.parts.some((p) => p.id === 'pons-brainstem') && m24.parts.some((p) => p.id === 'medulla-oblongata') && m24.parts.some((p) => p.id === 'midbrain-peduncles'), 'Model 24 contains complete brainstem: midbrain, pons, medulla oblongata');
  assert(m24.parts.some((p) => p.id === 'corpus-callosum-arch') && m24.parts.some((p) => p.id === 'thalamus-relay') && m24.parts.some((p) => p.id === 'hypothalamus-pituitary') && m24.parts.some((p) => p.id === 'hippocampus-gyrus'), 'Model 24 contains deep limbic cross-section structures');
  assert(m24.parts.some((p) => p.id === 'neuron-soma-axon') && m24.parts.some((p) => p.id === 'synaptic-terminal-bouton') && m24.parts.some((p) => p.id === 'synaptic-cleft-receptor') && m24.parts.some((p) => p.id === 'action-potential-impulse'), 'Model 24 contains conceptual microscopic neuron, synapse, and action potential');
  assert(Boolean(m24.embedHtml && m24.embedHtml.includes('sketchfab.com')), 'Model 24 contains Sketchfab 3D embed code');
  assert(Object.keys(m24.parameters).length === 0, 'Model 24 has parameters removed per specification');

  // 6. Model 25: Human Eye and Vision
  console.log('\n--- CHECK 6: Model 25 (Human Eye and Vision) Verification ---');
  const m25 = CURATED_AI_MODELS['eye-vision'];
  assert(m25.title === 'Human Eye and Vision', 'Model 25 title matches Human Eye and Vision');
  assert(m25.parts.some((p) => p.id === 'cornea-clear') && m25.parts.some((p) => p.id === 'iris-diaphragm') && m25.parts.some((p) => p.id === 'pupil-aperture'), 'Model 25 contains cornea, iris, and pupil aperture');
  assert(m25.parts.some((p) => p.id === 'crystalline-lens') && m25.parts.some((p) => p.id === 'ciliary-body'), 'Model 25 contains biconvex crystalline lens and ciliary accommodation body');
  assert(m25.parts.some((p) => p.id === 'sclera-outer-shell') && m25.parts.some((p) => p.id === 'choroid-vascular-layer') && m25.parts.some((p) => p.id === 'retina-photoreceptor-tunic'), 'Model 25 contains three anatomical tunics: sclera, choroid, and sensory retina');
  assert(m25.parts.some((p) => p.id === 'fovea-macula-centralis') && m25.parts.some((p) => p.id === 'optic-disc-blind-spot') && m25.parts.some((p) => p.id === 'optic-nerve-cable'), 'Model 25 contains fovea centralis, optic disc blind spot, and optic nerve cable');
  assert(m25.parts.some((p) => p.id === 'incident-light-ray-cone') && m25.parts.some((p) => p.id === 'inverted-retinal-image'), 'Model 25 demonstrates optical light rays and inverted real retinal image formation');
  assert(m25.parts.some((p) => p.id === 'photoreceptor-rod-cone'), 'Model 25 contains microscopic rod and cone photoreceptors');
  assert('lensPowerDiopters' in m25.parameters && 'pupilDiameterMm' in m25.parameters && 'objectDistanceCm' in m25.parameters, 'Model 25 controls lens power, pupil diameter, and object distance');
  assert('viewMode' in m25.conditions && 'refractionState' in m25.conditions, 'Model 25 supports sagittalCutaway, emmetropia, myopia, and hyperopia');

  // 7. Query Matching Tests
  console.log('\n--- CHECK 7: Prompt Matching & Try Prompts Resolution ---');
  const queries = [
    { q: 'Create a 3D model of a human heart explorer with cutaway and blood flow', expectedId: 'heart-explorer' },
    { q: 'Human respiratory system with bronchial tree and alveoli gas exchange', expectedId: 'respiratory-explorer' },
    { q: '3D model of human digestive system with food path and villi', expectedId: 'digestive-system' },
    { q: 'Human brain explorer with lobes, cross section and neuron synapse', expectedId: 'brain-explorer' },
    { q: 'Detailed human eye and vision model with light path and retina', expectedId: 'eye-vision' },
  ];

  for (const item of queries) {
    const model = matchVerifiedScientificModel(item.q);
    assert(model && model.id === item.expectedId, `Query "${item.q}" resolves to model ID '${item.expectedId}' (got '${model?.id}')`);
  }

  // 8. Offline Caching Verification
  console.log('\n--- CHECK 8: Offline Caching & Storage Readiness ---');
  for (const key of batch3Keys) {
    const spec = CURATED_AI_MODELS[key];
    const cached = await cachePresetModel(spec);
    assert(cached, `Model '${key}' successfully cached for offline use`);
  }

  console.log(`\n====================================================`);
  console.log(`BIOLOGY BATCH 1 (MODELS 21–25) SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runBatch3BiologyTests().catch(console.error);
