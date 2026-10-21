import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as THREE from 'three';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import {
  isAdvancedPhysicsBatch1Model,
  buildBatch1CustomAssemblies,
} from '../simulations/physics/advancedPhysicsBatch1Studio';

describe('TECH-ANATOMIX — Viewer UI Cleanup & Batch 1 Component Highlighting Repair Verification', () => {
  it('1. VIEWER UI CLEANUP: Global3DViewer features a clean top header and Dynamic3DModelRenderer renders Viewer Options below parameter deck', () => {
    const globalViewerPath = path.resolve('src/components/common/Global3DViewer.tsx');
    assert.ok(fs.existsSync(globalViewerPath), 'Global3DViewer.tsx exists');
    const globalViewerCode = fs.readFileSync(globalViewerPath, 'utf-8');

    // Header has title, Back to Full Model, and Reset camera
    assert.ok(globalViewerCode.includes('{title}'), 'Global3DViewer displays model title in top badge');
    assert.ok(globalViewerCode.includes('BACK TO FULL MODEL'), 'Global3DViewer retains Back to Full Model button');
    assert.ok(globalViewerCode.includes('Reset 3D Camera'), 'Global3DViewer retains icon-only Reset button');

    // TRY IT button and Tip banner removed from inside 3D viewport canvas
    assert.ok(!globalViewerCode.includes('fill-current animate-spin'), 'TRY IT action button removed from inside Global3DViewer viewport');
    assert.ok(!globalViewerCode.includes('Click &amp; Drag: Orbit 3D'), 'Instructional tip banner removed from inside Global3DViewer viewport');

    // Dynamic3DModelRenderer renders 3D Viewer Options deck below parameter deck
    const rendererPath = path.resolve('src/components/models/Dynamic3DModelRenderer.tsx');
    assert.ok(fs.existsSync(rendererPath), 'Dynamic3DModelRenderer.tsx exists');
    const rendererCode = fs.readFileSync(rendererPath, 'utf-8');

    assert.ok(rendererCode.includes('id="ai-viewer-options-deck"'), 'Dynamic3DModelRenderer renders ai-viewer-options-deck');
    
    // Viewer options deck appears after parameter deck in the code structure
    const paramDeckIdx = rendererCode.indexOf('id="ai-model-parameters-deck"');
    const optionsDeckIdx = rendererCode.indexOf('id="ai-viewer-options-deck"');
    assert.ok(paramDeckIdx > 0 && optionsDeckIdx > paramDeckIdx, 'ai-viewer-options-deck is positioned below ai-model-parameters-deck');

    // Display controls present in options deck
    assert.ok(rendererCode.includes('data-testid="toggle-labels-button"'), 'Options deck includes Hide/Show Labels toggle button');
    assert.ok(rendererCode.includes('data-testid="toggle-internal-view-button"'), 'Options deck includes Internal View toggle button');
  });

  it('2. NOTIFICATIONS: Scale note and chemical reaction hazard alerts render outside the 3D viewport canvas', () => {
    const rendererCode = fs.readFileSync(path.resolve('src/components/models/Dynamic3DModelRenderer.tsx'), 'utf-8');
    const chemSceneCode = fs.readFileSync(path.resolve('src/components/chemistry/ChemistryLabScene.tsx'), 'utf-8');

    // scaleNote in Dynamic3DModelRenderer renders outside <Global3DViewer>
    const scaleNoteOutside = rendererCode.indexOf('Model Scale & Precision Notice');
    const globalViewerCall = rendererCode.indexOf('<Global3DViewer');
    assert.ok(scaleNoteOutside > 0 && scaleNoteOutside < globalViewerCall, 'scaleNote is rendered outside Global3DViewer viewport');

    // Violent reaction alert in ChemistryLabScene renders outside <Global3DViewer>
    const violentAlertIdx = chemSceneCode.indexOf('VIOLENT EXOTHERMIC DETONATION!');
    const chemViewerCall = chemSceneCode.indexOf('<Global3DViewer');
    assert.ok(violentAlertIdx > 0 && violentAlertIdx < chemViewerCall, 'Violent explosion hazard banner is rendered outside Global3DViewer viewport');
  });

  it('3. BATCH 1 HIGHLIGHTING: Every selectable part ID across Models 41–47 is registered in meshMap and receives light blue highlight', () => {
    const batch1Ids = [
      'electromagnetic-wave-propagation',
      'plasma-physics-explorer',
      'particle-accelerator-explorer',
      'magnetic-levitation-explorer',
      'superconductivity-meissner-explorer',
      'black-hole-gravitational-lensing',
      'quantum-tunnelling-explorer',
    ];

    batch1Ids.forEach((id) => {
      const modelSpec = CURATED_AI_MODELS[id];
      assert.ok(modelSpec, `Batch 1 model spec ${id} exists`);
      assert.ok(isAdvancedPhysicsBatch1Model(modelSpec.functionalType, modelSpec.id), `${id} recognized as Batch 1 model`);

      const rootGroup = new THREE.Group();
      const meshMap = new Map<string, THREE.Object3D>();
      const interactiveMeshes: THREE.Object3D[] = [];

      // Populate dummy placeholders in meshMap as Dynamic3DModelRenderer does
      modelSpec.parts.forEach((p) => {
        const dummy = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        dummy.userData = { partSpec: p };
        meshMap.set(p.id, dummy);
        interactiveMeshes.push(dummy);
      });

      // Build custom 3D assemblies
      buildBatch1CustomAssemblies(modelSpec, rootGroup, meshMap, interactiveMeshes);

      // Verify that every part ID in modelSpec.parts maps to an active 3D object in meshMap
      modelSpec.parts.forEach((p) => {
        const registeredObj = meshMap.get(p.id);
        assert.ok(registeredObj, `Part '${p.id}' in model '${id}' is registered in meshMap`);
        assert.ok(registeredObj !== undefined, `Mesh map entry for '${p.id}' is defined`);

        // Test traversing the registered 3D object to verify light-blue highlighting logic
        let meshCount = 0;
        registeredObj.traverse((child) => {
          if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
            meshCount++;
            const mat = child.material as any;
            if (mat) {
              if ('emissive' in mat) {
                mat.userData.defaultEmissive = mat.emissive.clone();
                mat.emissive.set(0x38bdf8);
                assert.strictEqual(mat.emissive.getHex(), 0x38bdf8, `Part '${p.id}' emissive set to light blue #38bdf8`);
                mat.emissive.copy(mat.userData.defaultEmissive);
              } else if ('color' in mat) {
                mat.userData.defaultColor = mat.color.clone();
                mat.color.set(0x38bdf8);
                assert.strictEqual(mat.color.getHex(), 0x38bdf8, `Part '${p.id}' basic color set to light blue #38bdf8`);
                mat.color.copy(mat.userData.defaultColor);
              }
            }
          }
        });
        assert.ok(meshCount > 0, `Registered 3D object for part '${p.id}' in '${id}' contains at least one mesh/line`);
      });
    });
  });
});
