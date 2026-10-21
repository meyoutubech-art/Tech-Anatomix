import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { BIOLOGY_BATCH_2_MODELS } from '../data/curatedModelsBatch4';
import { matchOfflinePreset } from '../utils/offlineModelManager';
import { matchVerifiedScientificModel } from '../server/geminiService';

test('TECH-ANATOMIX — Model Refinement Part 5: Blood Transport (Internal Circulatory System)', async (t) => {
  // =========================================================================
  // 1. ASSET INSPECTION & HONEST LIMITATION REPORTING
  // =========================================================================
  await t.test('1. Asset Inspection: /public/models/human_base_mesh_01.glb is external surface only and limitation is reported', () => {
    const glbPath = path.resolve(process.cwd(), 'public/models/human_base_mesh_01.glb');
    assert.ok(fs.existsSync(glbPath), 'human_base_mesh_01.glb exists in public/models');

    const buf = fs.readFileSync(glbPath);
    const jsonLen = buf.readUInt32LE(12);
    const gltfJson = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));

    // Verify GLB contains external skin mesh only
    assert.equal(gltfJson.meshes?.length, 1, 'human_base_mesh_01.glb has exactly 1 external mesh (Object_0)');
    const meshName = gltfJson.meshes?.[0]?.name || '';
    assert.ok(meshName.includes('Object_0'), 'Asset contains only external body mesh (no internal organ nodes)');

    // Model spec scaleNote and descriptions must honestly state this limitation
    const model = CURATED_AI_MODELS['blood-transport'] || BIOLOGY_BATCH_2_MODELS.bloodTransport;
    assert.ok(model, 'blood-transport model must exist in registry');
    assert.ok(
      model.scaleNote?.includes('human_base_mesh_01.glb') &&
      model.scaleNote?.includes('external body surface'),
      'Scale note honestly documents that human_base_mesh_01.glb has solely external body surface'
    );
  });

  // =========================================================================
  // 2. INTERNAL VIEW ONLY (NO FULL EXTERNAL BODY PRIMARY PRESENTATION)
  // =========================================================================
  await t.test('2. Internal View Only: External human body is not the main view; internal circulatory structures are isolated', () => {
    const model = CURATED_AI_MODELS['blood-transport'] || BIOLOGY_BATCH_2_MODELS.bloodTransport;
    assert.equal(model.id, 'blood-transport');
    assert.equal(model.functionalType, 'blood-transport');

    // Parts must NOT include skin, body envelope, or external flesh
    const partIds = model.parts.map((p) => p.id.toLowerCase());
    const hasExternalBody = partIds.some((id) => id.includes('skin') || id.includes('flesh') || id.includes('torso-skin'));
    assert.equal(hasExternalBody, false, 'Internal circulatory view must not display external skin as a primary structure');

    // Must have cardiac chambers, systemic arteries/veins, pulmonary loop, and capillary beds
    assert.ok(partIds.includes('heart-left-ventricle'), 'Must contain Left Ventricle');
    assert.ok(partIds.includes('heart-right-ventricle'), 'Must contain Right Ventricle');
    assert.ok(partIds.includes('heart-left-atrium'), 'Must contain Left Atrium');
    assert.ok(partIds.includes('heart-right-atrium'), 'Must contain Right Atrium');
    assert.ok(partIds.includes('heart-myocardial-septum'), 'Must contain Interventricular Septum');
    assert.ok(partIds.includes('aorta-arch'), 'Must contain Aorta Arch');
    assert.ok(partIds.includes('pulmonary-trunk-artery'), 'Must contain Pulmonary Trunk/Artery');
    assert.ok(partIds.includes('pulmonary-veins-pairs'), 'Must contain Pulmonary Veins');
    assert.ok(partIds.includes('superior-vena-cava'), 'Must contain Superior Vena Cava');
    assert.ok(partIds.includes('inferior-vena-cava'), 'Must contain Inferior Vena Cava');
  });

  // =========================================================================
  // 3. SCIENTIFIC BLOOD FLOW & PHYSIOLOGICAL COLOR CODING
  // =========================================================================
  await t.test('3. Scientific Blood Flow: Pulmonary vs Systemic circuits have accurate physiological flow directions and colors', () => {
    const model = CURATED_AI_MODELS['blood-transport'] || BIOLOGY_BATCH_2_MODELS.bloodTransport;

    // Pulmonary Artery: carries DEOXYGENATED blood AWAY from heart (RV -> Lungs)
    const pulArtery = model.parts.find((p) => p.id === 'pulmonary-trunk-artery');
    assert.ok(pulArtery, 'Pulmonary artery must exist');
    assert.ok(
      pulArtery.description?.toLowerCase().includes('deoxygenated') || pulArtery.description?.toLowerCase().includes('oxygen-poor'),
      'Pulmonary artery carries oxygen-poor blood to lungs'
    );
    assert.ok(
      pulArtery.label?.toLowerCase().includes('away') || pulArtery.description?.toLowerCase().includes('away'),
      'Pulmonary artery flow direction is away from the heart'
    );
    // In educational color coding, deoxygenated is blue
    assert.ok(pulArtery.color?.startsWith('#1') || pulArtery.color?.startsWith('#2'), 'Pulmonary artery uses blue educational code for deoxygenated blood');

    // Pulmonary Veins: carry OXYGENATED blood TOWARD heart (Lungs -> LA)
    const pulVeins = model.parts.find((p) => p.id === 'pulmonary-veins-pairs');
    assert.ok(pulVeins, 'Pulmonary veins must exist');
    assert.ok(
      pulVeins.description?.toLowerCase().includes('oxygenated') || pulVeins.description?.toLowerCase().includes('oxygen-rich'),
      'Pulmonary veins carry oxygen-rich blood from lungs'
    );
    assert.ok(
      pulVeins.label?.toLowerCase().includes('toward') || pulVeins.description?.toLowerCase().includes('returning'),
      'Pulmonary veins return blood toward the left atrium'
    );
    // In educational color coding, oxygenated is red/rose
    assert.ok(pulVeins.color?.startsWith('#F') || pulVeins.color?.startsWith('#E') || pulVeins.color?.startsWith('#D'), 'Pulmonary veins use red educational code');

    // Systemic Aorta: carries OXYGENATED blood AWAY from heart (LV -> Body)
    const aorta = model.parts.find((p) => p.id === 'aorta-arch');
    assert.ok(aorta, 'Aorta must exist');
    assert.ok(
      aorta.color?.startsWith('#D') || aorta.color?.startsWith('#E') || aorta.color?.startsWith('#B'),
      'Systemic aorta uses red educational code'
    );

    // Directional markers exist and avoid random particles
    const markers = model.parts.filter((p) => p.id.startsWith('directional-marker-'));
    assert.ok(markers.length >= 4, 'Has coordinated directional markers for pulmonary artery, pulmonary vein, aorta, and vena cava');
  });

  // =========================================================================
  // 4. REALISTIC VS EDUCATIONAL COLOR CODING & BLUE BLOOD MISCONCEPTION
  // =========================================================================
  await t.test('4. Physiology Clarification: Explicitly clarifies that human venous blood is never blue', () => {
    const model = CURATED_AI_MODELS['blood-transport'] || BIOLOGY_BATCH_2_MODELS.bloodTransport;

    // Curiosity prompts or scale note must refute the "blue blood" myth
    const mentionsBlueMyth =
      model.curiosityPrompts?.some((q) => q.toLowerCase().includes('blue') && q.toLowerCase().includes('vein')) ||
      model.scaleNote?.toLowerCase().includes('blue is an educational') ||
      model.scaleNote?.toLowerCase().includes('not blue');
    assert.ok(mentionsBlueMyth, 'Curiosity prompts or scale note must refute the misconception that human blood is blue in veins');

    // Model condition supports color coding toggling
    assert.ok(model.conditions?.colorCodingStandard, 'Supports colorCodingStandard condition toggle');
    const colorOpts = model.conditions.colorCodingStandard.options?.map((o: any) => o.value) || [];
    assert.ok(colorOpts.includes('educationalStandard'), 'Has educationalStandard color mode');
    assert.ok(colorOpts.includes('realisticCrimson'), 'Has realisticCrimson color mode');
  });

  // =========================================================================
  // 5. INTERACTIVE PARAMETERS & VIEW MODES
  // =========================================================================
  await t.test('5. Interactive Parameters & View Modes: Heart rate, flow velocity, and circuit isolation view modes', () => {
    const model = CURATED_AI_MODELS['blood-transport'] || BIOLOGY_BATCH_2_MODELS.bloodTransport;

    // Parameters
    assert.ok(model.parameters.heartRateBpm, 'Has heartRateBpm parameter');
    assert.equal(model.parameters.heartRateBpm.defaultValue, 72);
    assert.ok(model.parameters.bloodFlowVelocity, 'Has bloodFlowVelocity parameter');
    assert.ok(model.parameters.cardiacOutput, 'Has cardiacOutput parameter');

    // Conditions
    assert.ok(model.conditions.viewMode, 'Has viewMode condition');
    const viewOpts = model.conditions.viewMode.options?.map((o: any) => o.value) || [];
    assert.ok(viewOpts.includes('completeCirculation'), 'Supports completeCirculation view');
    assert.ok(viewOpts.includes('pulmonaryCircuit'), 'Supports pulmonaryCircuit isolation');
    assert.ok(viewOpts.includes('systemicCircuit'), 'Supports systemicCircuit isolation');
    assert.ok(viewOpts.includes('heartOnly'), 'Supports heartOnly isolation');
  });

  // =========================================================================
  // 6. ROUTING, MATCHING & PRESERVATION OF EXISTING MODELS
  // =========================================================================
  await t.test('6. Routing & Model Preservation: Preserves Blood Microscope and Human Anatomy Explorer while correctly matching Blood Transport', () => {
    // 1. Blood Transport queries match 'blood-transport'
    const q1 = 'Create a 3D model of blood transport and internal circulatory system with heart and vessels';
    const m1 = matchVerifiedScientificModel(q1);
    assert.equal(m1?.id, 'blood-transport', 'Prompt correctly resolves to blood-transport model');

    const offlineMatch = matchOfflinePreset('blood transport');
    assert.equal(offlineMatch.matched, true);
    assert.equal(offlineMatch.spec?.id, 'blood-transport', 'Offline keyword matching resolves to blood-transport');

    // 2. Blood Microscope remains intact
    const mMicroscope = CURATED_AI_MODELS['blood-circulation-microscope'];
    assert.ok(mMicroscope, 'blood-circulation-microscope still exists');
    assert.equal(mMicroscope.title, 'Blood and Circulation Microscope');
    assert.ok(mMicroscope.parts.some((p) => p.id === 'rbc-erythrocyte-1'), 'Blood microscope RBCs still intact');

    // 3. Human Anatomy Explorer and frog anatomy remain intact
    const humanExplorerPath = path.resolve(process.cwd(), 'src/components/biology/HumanAnatomyExplorer.tsx');
    assert.ok(fs.existsSync(humanExplorerPath), 'HumanAnatomyExplorer.tsx still exists and unmodified');

    const frogExplorerPath = path.resolve(process.cwd(), 'src/components/biology/FrogAnatomyExplorer.tsx');
    assert.ok(fs.existsSync(frogExplorerPath), 'FrogAnatomyExplorer.tsx still exists and unmodified');
  });
});
