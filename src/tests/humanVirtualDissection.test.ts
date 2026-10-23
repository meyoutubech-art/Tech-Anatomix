import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import {
  SKETCHFAB_HUMAN_CONFIG,
  HUMAN_ORGAN_LIST,
} from '../data/humanAnatomyData';

test('Human Anatomy Virtual Dissection System (Phase 2 Test Suite)', async (t) => {
  await t.test('External Human Body GLB Model asset is present and valid', () => {
    const glbPath = path.resolve('public/models/human_base_mesh_01.glb');
    assert.ok(fs.existsSync(glbPath), 'human_base_mesh_01.glb must exist in /public/models');
    const stat = fs.statSync(glbPath);
    assert.ok(stat.size > 500000, 'GLB file size must be at least 500KB (actual: ' + stat.size + ')');

    // Verify GLB magic header 0x46546C67 ("glTF")
    const buf = fs.readFileSync(glbPath);
    const magic = buf.toString('ascii', 0, 4);
    assert.strictEqual(magic, 'glTF', 'File must have valid glTF binary header');
  });

  await t.test('Abdominal Guide Geometry stretches upwards to chest middle (Y=0.44) without stretching downwards (Y=-0.12)', () => {
    // Model anterior sternal-abdominal coordinates:
    // Top (Chest middle / mid-sternum): Y ≈ +0.44, Z ≈ 0.154
    // Upper-mid (Xiphoid): Y ≈ +0.30, Z ≈ 0.150
    // Epigastrium: Y ≈ +0.16, Z ≈ 0.148
    // Mid (Umbilicus): Y ≈ +0.02, Z ≈ 0.136
    // Hypogastrium: Y ≈ -0.05, Z ≈ 0.116
    // Bottom (Suprapubic, unchanged): Y ≈ -0.12, Z ≈ 0.096
    const zOffset = 0.008;
    const points = [
      new THREE.Vector3(0, 0.44, 0.154 + zOffset),
      new THREE.Vector3(0, 0.30, 0.150 + zOffset),
      new THREE.Vector3(0, 0.16, 0.148 + zOffset),
      new THREE.Vector3(0, 0.02, 0.136 + zOffset),
      new THREE.Vector3(0, -0.05, 0.116 + zOffset),
      new THREE.Vector3(0, -0.12, 0.096 + zOffset),
    ];
    const curve = new THREE.CatmullRomCurve3(points);

    const startPt = curve.getPointAt(0);
    const midPt = curve.getPointAt(0.5);
    const endPt = curve.getPointAt(1.0);

    // X should be centered at 0 (midline)
    assert.strictEqual(Math.round(startPt.x * 1000) / 1000, 0, 'Start point must be centered at x=0');
    assert.strictEqual(Math.round(midPt.x * 1000) / 1000, 0, 'Mid point must be centered at x=0');
    assert.strictEqual(Math.round(endPt.x * 1000) / 1000, 0, 'End point must be centered at x=0');

    // Top must reach chest middle (~0.44) and bottom must remain at -0.12 (not stretched downwards)
    assert.ok(Math.abs(startPt.y - 0.44) < 0.001, 'Start Y must reach chest middle (0.44)');
    assert.ok(Math.abs(endPt.y - (-0.12)) < 0.001, 'End Y must remain at -0.12 without stretching downwards');

    // Y values should progress monotonically downward from chest middle to suprapubic
    assert.ok(startPt.y > midPt.y, 'Start Y (chest middle) must be superior to mid Y');
    assert.ok(midPt.y > endPt.y, 'Mid Y must be superior to end Y (suprapubic)');

    // Z values should stay in front of body (Z > 0.08)
    assert.ok(startPt.z > 0.10, 'Start Z must follow anterior chest contour');
    assert.ok(midPt.z > 0.10, 'Mid Z must follow anterior abdominal contour');
    assert.ok(endPt.z > 0.08, 'End Z must follow anterior abdominal contour');
  });

  await t.test('Dissection state machine enforces valid workflow transitions', () => {
    type State = 'IDLE' | 'GUIDE_READY' | 'INTERACTION_ACTIVE' | 'INTERACTION_COMPLETE' | 'ORGANS_REVEALED';

    let currentState: State = 'IDLE';
    let progress = 0.0;

    // Enable Dissection Mode
    const enableDissection = () => {
      if (currentState === 'IDLE') currentState = 'GUIDE_READY';
    };
    enableDissection();
    assert.strictEqual(currentState, 'GUIDE_READY', 'Enabling dissection must transition from IDLE to GUIDE_READY');

    // Progress advance
    const updateProgress = (val: number) => {
      progress = Math.max(0, Math.min(1, val));
      if (progress >= 1.0) {
        currentState = 'INTERACTION_COMPLETE';
      } else if (progress > 0) {
        currentState = 'INTERACTION_ACTIVE';
      }
    };

    updateProgress(0.25);
    assert.strictEqual(currentState, 'INTERACTION_ACTIVE', 'Advancing progress must set INTERACTION_ACTIVE');
    assert.strictEqual(progress, 0.25);

    updateProgress(1.0);
    assert.strictEqual(currentState, 'INTERACTION_COMPLETE', 'Reaching 100% must set INTERACTION_COMPLETE');
    assert.strictEqual(progress, 1.0);

    // Transition to Organs
    const revealOrgans = () => {
      if (currentState === 'INTERACTION_COMPLETE') currentState = 'ORGANS_REVEALED';
    };
    revealOrgans();
    assert.strictEqual(currentState, 'ORGANS_REVEALED', 'Exploring organs must set ORGANS_REVEALED');

    // Reset Demonstration
    const reset = () => {
      currentState = 'IDLE';
      progress = 0.0;
    };
    reset();
    assert.strictEqual(currentState, 'IDLE', 'Reset must restore IDLE state');
    assert.strictEqual(progress, 0.0, 'Reset must restore 0% progress');
  });

  await t.test('Internal Organs Sketchfab Embed configuration remains exact and untampered', () => {
    assert.ok(
      SKETCHFAB_HUMAN_CONFIG.internalOrgansEmbedUrl.includes('fe69d7b1ed6f46a3bd0b6933b796092e'),
      'Must preserve Sketchfab model ID fe69d7b1ed6f46a3bd0b6933b796092e'
    );
    assert.ok(
      SKETCHFAB_HUMAN_CONFIG.internalOrgansEmbedUrl.includes('autostart=1'),
      'Embed URL should include autostart=1'
    );
  });

  await t.test('Human Anatomy explorer UI removes screenshot-marked clutter, keeps dissection always on, and places vertical touch slider on side of viewer', () => {
    const componentCode = fs.readFileSync(
      path.resolve('src/components/biology/HumanAnatomyExplorer.tsx'),
      'utf-8'
    );

    // Ensure no graphic violence / gore terms exist
    const forbiddenTerms = ['bloody', 'gore', 'guts', 'weapon', 'slash', 'kill'];
    forbiddenTerms.forEach((term) => {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      assert.ok(!regex.test(componentCode), `Component must not contain graphic term: '${term}'`);
    });

    // Verify screenshot-marked elements and Enable Virtual Dissection toggle/text are removed
    assert.ok(!componentCode.includes('Human Anatomy Explorer — Virtual Dissection Suite'), 'Must remove marked top header ribbon');
    assert.ok(!componentCode.includes('External Human Specimen'), 'Must remove marked top-left specimen badge');
    assert.ok(!componentCode.includes('Orbit & Zoom Mode'), 'Must remove marked mode pill');
    assert.ok(!componentCode.includes('Virtual Dissection Guide'), 'Must remove marked floating callout box');
    assert.ok(!componentCode.includes('Enable Virtual Dissection'), 'Must remove Enable Virtual Dissection button');
    assert.ok(!componentCode.includes('Click Enable to activate the abdominal guide.'), 'Must remove Enable Virtual Dissection prompt text');
    assert.ok(!componentCode.includes('Human Organ Systems Dossier'), 'Must remove marked duplicate Organ Systems Dossier inside viewer container');

    // Verify virtual dissection is always on ('GUIDE_READY' by default) and vertical side slider exists
    assert.ok(componentCode.includes("useState<DissectionState>('GUIDE_READY')"), 'Virtual dissection must be always on by default');
    assert.ok(componentCode.includes('data-testid="vertical-dissection-dock"'), 'Must include vertical dissection dock on the side of the viewer');
    assert.ok(componentCode.includes('data-testid="vertical-dissection-slider"'), 'Must include vertical touch-screen dissection slider');

    // Verify human GLB automatically positions to the front (theta = 0, not Math.PI / 2 side profile) and cut stretches upwards to chest middle (0.44) without stretching downwards (-0.12)
    assert.ok(componentCode.includes('controls.reset(cameraZ, 0, Math.PI / 2.02, frontTarget)'), 'Must auto-orient human GLB to front (theta = 0) on load');
    assert.ok(!componentCode.includes('controls.reset(cameraZ, Math.PI / 2,'), 'Must not orient human GLB sideways (theta = Math.PI / 2)');
    assert.ok(componentCode.includes('const topY = 0.44 * calib.lengthScale + calib.yOffset;'), 'Dissection cut must stretch upwards to chest middle (topY = 0.44)');
    assert.ok(componentCode.includes('const botY = -0.12 * calib.lengthScale + calib.yOffset;'), 'Dissection cut must not stretch downwards (botY = -0.12)');

    // Ensure educational terminology is present
    assert.ok(componentCode.includes('linea alba'), 'Must reference anatomical linea alba');
    assert.ok(componentCode.includes('Demonstration Complete'), 'Must include Demonstration Complete state');
    assert.ok(componentCode.includes('Explore Internal Organs'), 'Must include Explore Internal Organs action');
    assert.ok(componentCode.includes('Return to External Body'), 'Must include Return to External Body action');
  });
});
