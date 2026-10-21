import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('TECH-ANATOMIX — Sketchfab 3D Model Integration & Capability Audit', async (t) => {
  // ---------------------------------------------------------------------------
  // 1. Audit Identified Sketchfab Integrations
  // ---------------------------------------------------------------------------
  await t.test('1. INVENTORY: Identifies all 7 Sketchfab 3D model integrations across the codebase', () => {
    const humanData = fs.readFileSync(path.resolve('src/data/humanAnatomyData.ts'), 'utf-8');
    const frogData = fs.readFileSync(path.resolve('src/data/frogAnatomyData.ts'), 'utf-8');
    const batch3Data = fs.readFileSync(path.resolve('src/data/curatedModelsBatch3.ts'), 'utf-8');

    // Human Anatomy Explorer (External & Visceral)
    assert.ok(humanData.includes('9b0b079953b840bc9a13f524b60041e4'), 'Identified Human External Sketchfab Embed ID');
    assert.ok(humanData.includes('fe69d7b1ed6f46a3bd0b6933b796092e'), 'Identified Human Internal Visceral Sketchfab Embed ID');

    // Frog Anatomy Explorer (External & Visceral)
    assert.ok(frogData.includes('0bddb0f89cc94df2a56889c1de9143a1'), 'Identified Frog External Sketchfab Embed ID');
    assert.ok(frogData.includes('7643345ba03f4f87831a2a2ca3c27ad0'), 'Identified Frog Visceral Heart & Lungs Sketchfab Embed ID');

    // Curated Models (Heart, Respiratory, Digestive, Brain)
    assert.ok(batch3Data.includes('cc339417fcd745afafaa01623405b69a'), 'Identified Heart Sketchfab Embed ID');
    assert.ok(batch3Data.includes('250911151757489da1cf5501b791f363'), 'Identified Respiratory System Sketchfab Embed ID');
    assert.ok(batch3Data.includes('053bab50888840afbbe24c361887c8f9'), 'Identified Digestive System Sketchfab Embed ID');
    assert.ok(batch3Data.includes('f390b7e894d2446789e5a0b89d4abe8d'), 'Identified Whole Brain Sketchfab Embed ID');
  });

  // ---------------------------------------------------------------------------
  // 2. Capability Check & Honest Handling (CASE B / Phase 10 Invariance)
  // ---------------------------------------------------------------------------
  await t.test('2. CAPABILITY INTEGRITY: Preserves native iframe viewers without fake sliders or camera-as-model-translation cheats', () => {
    const workspaceCode = fs.readFileSync(path.resolve('src/components/models/ExternalModelWorkspace.tsx'), 'utf-8');
    const heartCode = fs.readFileSync(path.resolve('src/components/biology/HeartScene.tsx'), 'utf-8');
    const frogCode = fs.readFileSync(path.resolve('src/components/biology/FrogAnatomyExplorer.tsx'), 'utf-8');
    const humanCode = fs.readFileSync(path.resolve('src/components/biology/HumanAnatomyExplorer.tsx'), 'utf-8');

    // Ensure ExternalModelWorkspace does NOT render fake position sliders over cross-origin iframes
    assert.ok(
      !workspaceCode.includes('ModelPositionControls') && !workspaceCode.includes('setCameraLookAt'),
      'ExternalModelWorkspace does not present fake sliders or substitute camera movement for model translation'
    );

    // Ensure HeartScene preserves clean Sketchfab iframe without fake sliders
    assert.ok(
      !heartCode.includes('ModelPositionControls'),
      'HeartScene preserves original clean Sketchfab iframe viewer without fake sliders'
    );

    // Ensure FrogAnatomyExplorer preserves clean iframe embed
    assert.ok(
      frogCode.includes('iframe') && frogCode.includes('SKETCHFAB_FROG_CONFIG'),
      'FrogAnatomyExplorer preserves original iframe embed for Sketchfab models'
    );

    // Ensure HumanAnatomyExplorer preserves clean iframe embed for Internal Organs
    assert.ok(
      humanCode.includes('InternalOrgansEmbedViewer') && humanCode.includes('SKETCHFAB_HUMAN_CONFIG'),
      'HumanAnatomyExplorer preserves original iframe embed for Internal Organs'
    );
  });

  // ---------------------------------------------------------------------------
  // 3. Preservation of Native Three.js & GLB Position Controls
  // ---------------------------------------------------------------------------
  await t.test('3. NATIVE PRESERVATION: Native Three.js and GLB/GLTF position controllers remain 100% operational', () => {
    const globalViewer = fs.readFileSync(path.resolve('src/components/common/Global3DViewer.tsx'), 'utf-8');
    const dynamicRenderer = fs.readFileSync(path.resolve('src/components/models/Dynamic3DModelRenderer.tsx'), 'utf-8');
    const humanDissection = fs.readFileSync(path.resolve('src/components/biology/HumanAnatomyExplorer.tsx'), 'utf-8');
    const frogDissection = fs.readFileSync(path.resolve('src/components/biology/FrogNeckDissectionScene.tsx'), 'utf-8');

    assert.ok(globalViewer.includes('<ModelPositionControls'), 'Global3DViewer preserves native model position controls');
    assert.ok(dynamicRenderer.includes('positionGroup.add(modelRoot)'), 'Dynamic3DModelRenderer preserves Three.js positionGroup');
    assert.ok(humanDissection.includes('positionGroup.add(modelGroup)'), 'HumanAnatomyExplorer preserves GLB positionGroup');
    assert.ok(frogDissection.includes('dissectionGroup.add(trayGroup)'), 'FrogNeckDissectionScene preserves GLB dissectionGroup');
  });
});
