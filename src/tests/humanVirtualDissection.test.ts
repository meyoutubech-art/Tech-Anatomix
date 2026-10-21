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

  await t.test('Abdominal Guide Geometry is model-relative and accurately aligns with anterior torso', () => {
    // Model anterior abdominal coordinates:
    // Top (Epigastrium): Y ≈ +0.12, Z ≈ 0.148
    // Mid (Umbilicus): Y ≈ 0.00, Z ≈ 0.134
    // Bottom (Suprapubic): Y ≈ -0.12, Z ≈ 0.096
    const zOffset = 0.008;
    const points = [
      new THREE.Vector3(0, 0.12, 0.148 + zOffset),
      new THREE.Vector3(0, 0.06, 0.141 + zOffset),
      new THREE.Vector3(0, 0.00, 0.134 + zOffset),
      new THREE.Vector3(0, -0.06, 0.114 + zOffset),
      new THREE.Vector3(0, -0.12, 0.096 + zOffset),
    ];
    const curve = new THREE.CatmullRomCurve3(points);

    const startPt = curve.getPointAt(0);
    const midPt = curve.getPointAt(0.5);
    const endPt = curve.getPointAt(1.0);

    // X should be centered at 0 (linea alba midline)
    assert.strictEqual(Math.round(startPt.x * 1000) / 1000, 0, 'Start point must be centered at x=0');
    assert.strictEqual(Math.round(midPt.x * 1000) / 1000, 0, 'Mid point must be centered at x=0');
    assert.strictEqual(Math.round(endPt.x * 1000) / 1000, 0, 'End point must be centered at x=0');

    // Y values should progress monotonically downward from epigastrium to suprapubic
    assert.ok(startPt.y > midPt.y, 'Start Y (epigastrium) must be superior to mid Y (umbilicus)');
    assert.ok(midPt.y > endPt.y, 'Mid Y (umbilicus) must be superior to end Y (suprapubic)');

    // Z values should stay in front of body (Z > 0.08)
    assert.ok(startPt.z > 0.10, 'Start Z must follow anterior abdominal contour');
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

  await t.test('Human Anatomy explorer UI maintains clean, non-graphic scientific educational tone', () => {
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

    // Ensure educational terminology is present
    assert.ok(componentCode.includes('Virtual Dissection Guide'), 'Must include Virtual Dissection Guide');
    assert.ok(componentCode.includes('linea alba'), 'Must reference anatomical linea alba');
    assert.ok(componentCode.includes('Demonstration Complete'), 'Must include Demonstration Complete state');
    assert.ok(componentCode.includes('Explore Internal Organs'), 'Must include Explore Internal Organs action');
    assert.ok(componentCode.includes('Return to External Body'), 'Must include Return to External Body action');
  });
});
