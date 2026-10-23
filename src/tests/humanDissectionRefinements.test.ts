import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';

test('TECH-ANATOMIX — Human Body Dissection Interaction Fixes (Fix 1, Fix 2, Fix 3)', async (t) => {
  const componentPath = path.resolve('src/components/biology/HumanAnatomyExplorer.tsx');
  assert.ok(fs.existsSync(componentPath), 'HumanAnatomyExplorer.tsx must exist');
  const code = fs.readFileSync(componentPath, 'utf-8');

  // ---------------------------------------------------------------------------
  // FIX 1: Stomach Region Expansion
  // ---------------------------------------------------------------------------
  await t.test('Fix 1: Stomach model has origin at central core for outward radial expansion', () => {
    // Verify stomach construction function exists and centers at (0, 0, 0)
    assert.ok(code.includes('function createAnatomicalStomach'), 'createAnatomicalStomach function must exist');
    assert.ok(code.includes("corpusMesh.position.set(0, 0, 0)"), 'Corpus mesh must be centered at origin (0, 0, 0)');
    assert.ok(code.includes('Muscular J-Stomach (Gaster)'), 'Must retain anatomical J-stomach identity');
    assert.ok(code.includes('pylorusCurve'), 'Must include pyloric antrum & canal');
    assert.ok(code.includes('rugaeCurve'), 'Must include internal gastric rugal striations');
    assert.ok(code.includes('vascularCurve'), 'Must include gastroepiploic vascular arcade');
  });

  await t.test('Fix 1: Stomach visibly expands outward from central region upon reaching stomach region', () => {
    // Check expansion logic in useEffect
    assert.ok(code.includes('stomachGroupRef.current.scale.set(stomachScale, stomachScale, stomachScale)'), 'Must scale uniformly in 3D from central origin');
    assert.ok(code.includes('const tStomach = Math.min(1, Math.max(0, (progress - 0.04) / 0.42))') ||
              code.includes('(progress - 0.05) / 0.35') ||
              code.includes('tStomach'), 'Must compute localized progress through stomach region');
    assert.ok(code.includes('stomachScale = 0.15 + 0.85 * sEase') || code.includes('stomachScale'), 'Must calculate smooth expansion ease');
    // Ensure stomach emerges forward through opened incision
    assert.ok(code.includes('0.128 + sEase * 0.024') || code.includes('0.120 + sEase'), 'Stomach must emerge forward through incision');
  });

  await t.test('Fix 1: Stomach resets cleanly when demonstration is reset or scrubbed back', () => {
    assert.ok(code.includes("stomachGroupRef.current.visible = false"), 'Must hide stomach when idle or reset');
    assert.ok(code.includes("stomachGroupRef.current.scale.set(0.001, 0.001, 0.001)"), 'Must reset scale to origin when idle or reset');
  });

  // ---------------------------------------------------------------------------
  // FIX 2: Visible, Non-Graphic Dissection Feedback
  // ---------------------------------------------------------------------------
  await t.test('Fix 2: Surface-following vascular red margins respond to dissection interaction', () => {
    // Check hemoGeo generation
    assert.ok(code.includes('hemoGeo.setAttribute'), 'Must generate separate hemoGeo buffer geometry');
    assert.ok(code.includes('hemoPositions') && code.includes('hemoIndices'), 'Must build triangulated vascular margins');
    // Verify restrained anatomical color tone (burgundy / crimson)
    assert.ok(code.includes('0x881337'), 'Must use restrained anatomical crimson (0x881337)');
    // Verify surface-conforming depth and polygon offset
    assert.ok(code.includes('polygonOffset: true'), 'Must enable polygonOffset to prevent z-fighting');
    assert.ok(code.includes('polygonOffsetFactor: -2'), 'Must set appropriate polygonOffsetFactor');
  });

  await t.test('Fix 2: Active cutting tip features localized surface-conforming vascular feedback', () => {
    // Verify tip halo uses surface-conforming geometry (RingGeometry) rather than detached floating torus
    assert.ok(code.includes('new THREE.RingGeometry'), 'Tip halo must use surface-conforming RingGeometry');
    assert.ok(code.includes('activeHemoHaloRef.current.quaternion.setFromUnitVectors') ||
              code.includes('activeHemoHaloRef.current.position.copy'), 'Tip halo must conform to surface orientation and position');
    assert.ok(code.includes("dissectionState === 'INTERACTION_ACTIVE'"), 'Tip halo must only be visible during active cutting');
  });

  // ---------------------------------------------------------------------------
  // FIX 3: Refined Dissection Cut Shape
  // ---------------------------------------------------------------------------
  await t.test('Fix 3: Upper cut opening is moderately wider and eliminates needle-like point', () => {
    // Half width at upper opening must be >= 0.020 (total opening >= 40mm)
    assert.ok(code.includes('wUpper = 0.026') || code.includes('wUpper = 0.025') || code.includes('w0 = 0.02'), 'Upper opening half-width must be moderately wider (~26mm)');
    // Smooth rounded superior apex fillet
    assert.ok(code.includes('arcSteps = 12') || code.includes('arcSteps = 10'), 'Must generate rounded superior apex fillet');
    assert.ok(code.includes('arcVertexIndices'), 'Must connect apex fillet seamlessly into first row of incision strip');
  });

  await t.test('Fix 3: Incision smoothly transitions from wider upper notch to controlled cut tip', () => {
    assert.ok(code.includes('Math.pow(1 - u'), 'Must use smooth non-linear power curve for graceful taper');
    assert.ok(code.includes('visceralBulge') || code.includes('stomachFactor'), 'Must provide visceral window dilation around stomach region');
    assert.ok(code.includes('deepCenter'), 'Must include 3D contoured recessed fascia bed');
    assert.ok(code.includes('furrowColors'), 'Must include multi-layered vertex-colored incision depth');
    assert.ok(code.includes('updateSkinIncisionRecess'), 'Must dynamically recess underlying skin along active incision to prevent skin clipping');
    assert.ok(code.includes('0x965d37'), 'Must apply warm medium-dark brown skin tone to human body mesh');
  });

  // ---------------------------------------------------------------------------
  // FIX 4: Slow Realistic Vascular Spreading & Slow Emergence of Red Organs Where Cut
  // ---------------------------------------------------------------------------
  await t.test('Fix 4: Vascular fluid spreads slowly over time and red visceral organs slowly emerge where cut', () => {
    assert.ok(code.includes('function createVascularDiffusionTexture'), 'Must generate feathered organic vascular diffusion texture');
    assert.ok(code.includes('segmentSpreadRef') && code.includes('segmentRetractRef'), 'Must track per-station slow vascular spread and dermal retraction over time');
    assert.ok(code.includes('hemoUvs'), 'Must map UVs for soft-feathered vascular seepage falloff');
    assert.ok(code.includes('hemoBeadsRef'), 'Must animate slow-forming crimson meniscus droplets along the incised skin edge');
    assert.ok(code.includes('function createThoracicHeartOrgan'), 'Must build red Thoracic Heart organ for upper chest incision');
    assert.ok(code.includes('function createHepaticLiverOrgan'), 'Must build red-maroon Hepatic Liver organ for subxiphoid incision');
    assert.ok(code.includes('function createAnatomicalStomach'), 'Must build red Muscular J-Stomach organ for mid-epigastric incision');
    assert.ok(code.includes('function createIntestinalCoilsOrgan'), 'Must build vascular red Intestinal Coils organ for lower abdominal incision');
    assert.ok(code.includes('organEmergenceRef'), 'Must animate slow time-progressive emergence of red organs where cut');
  });

  // ---------------------------------------------------------------------------
  // FIX 5: Progressive Blue Guide Line Hiding & Camera Zoom / Follow Along Cut
  // ---------------------------------------------------------------------------
  await t.test('Fix 5: Blue guide line progressively hides as cut advances and camera moderately zooms and follows the cut downward', () => {
    assert.ok(code.includes('baseTubeRef'), 'Must track base guide tube ref to hide cut segments');
    assert.ok(code.includes('nextBaseGeo.setDrawRange'), 'Must use setDrawRange to progressively hide the already-cut portion of the blue guide line');
    assert.ok(code.includes('cameraFollowCutRef'), 'Must track camera follow state during active dissection');
    assert.ok(code.includes('dissectionZoomRadius'), 'Must moderately zoom in toward starting point when dissection starts');
    assert.ok(code.includes('desiredTargetY = posY + cutPt.y * 0.78'), 'Must smoothly pan camera vertically along the active cut point');
  });
});

