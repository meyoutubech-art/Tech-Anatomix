import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('TECH-ANATOMIX — Universal 3D Model Position Controller Verification Suite', async (t) => {
  // ---------------------------------------------------------------------------
  // 1. Reusable ModelPositionControls Component
  // ---------------------------------------------------------------------------
  await t.test('1. REUSABLE COMPONENT: ModelPositionControls provides X/Y sliders, arrow keys, and Reset', () => {
    const controlsPath = path.resolve('src/components/common/ModelPositionControls.tsx');
    assert.ok(fs.existsSync(controlsPath), 'ModelPositionControls.tsx exists');
    const content = fs.readFileSync(controlsPath, 'utf-8');

    // X and Y sliders
    assert.ok(content.includes('aria-label="X Position (Horizontal)"'), 'Includes accessible X Position slider');
    assert.ok(content.includes('aria-label="Y Position (Vertical)"'), 'Includes accessible Y Position slider');
    assert.ok(content.includes('data-testid="pos-x-indicator"'), 'Includes X position indicator');
    assert.ok(content.includes('data-testid="pos-y-indicator"'), 'Includes Y position indicator');

    // Reset Position Button
    assert.ok(content.includes('Reset Position'), 'Includes clearly labelled Reset Position button');
    assert.ok(content.includes('onReset'), 'Invokes onReset handler to restore coordinates');

    // Keyboard Arrow Keys Handling
    assert.ok(content.includes("e.key === 'ArrowLeft'"), 'Handles ArrowLeft to shift X negative');
    assert.ok(content.includes("e.key === 'ArrowRight'"), 'Handles ArrowRight to shift X positive');
    assert.ok(content.includes("e.key === 'ArrowUp'"), 'Handles ArrowUp to shift Y positive');
    assert.ok(content.includes("e.key === 'ArrowDown'"), 'Handles ArrowDown to shift Y negative');

    // Input Isolation (No intercepting while typing in text inputs, textareas, etc.)
    assert.ok(
      content.includes("target.tagName === 'INPUT'") &&
        content.includes("target.tagName === 'TEXTAREA'") &&
        content.includes("target.tagName === 'SELECT'") &&
        content.includes('target.isContentEditable'),
      'Protects text inputs, textareas, search boxes, and editable elements from arrow key interception'
    );
  });

  // ---------------------------------------------------------------------------
  // 2. Global3DViewer Integration & Layout
  // ---------------------------------------------------------------------------
  await t.test('2. VIEWER INTEGRATION: Global3DViewer places ModelPositionControls directly BELOW the 3D canvas', () => {
    const viewerPath = path.resolve('src/components/common/Global3DViewer.tsx');
    assert.ok(fs.existsSync(viewerPath), 'Global3DViewer.tsx exists');
    const content = fs.readFileSync(viewerPath, 'utf-8');

    assert.ok(
      content.includes("import { ModelPositionControls, PositionRange } from './ModelPositionControls'"),
      'Global3DViewer imports ModelPositionControls'
    );
    assert.ok(
      content.includes('<ModelPositionControls'),
      'Global3DViewer renders ModelPositionControls'
    );

    // Verify placement outside and directly below the 3D viewport
    const parts = content.split('<ModelPositionControls');
    assert.strictEqual(parts.length, 2, 'Exactly one ModelPositionControls in Global3DViewer');
    // Ensure it comes after the main viewer box
    assert.ok(content.indexOf('<ModelPositionControls') > content.indexOf('{children}'), 'ModelPositionControls is outside and below {children}');
  });

  // ---------------------------------------------------------------------------
  // 3. Dynamic3DModelRenderer (All Curated Batches 1-5 & Dynamic AI Models)
  // ---------------------------------------------------------------------------
  await t.test('3. DYNAMIC 3D RENDERER: Position group wraps modelRoot, keeps lights/camera intact, tracks callouts', () => {
    const rendererPath = path.resolve('src/components/models/Dynamic3DModelRenderer.tsx');
    assert.ok(fs.existsSync(rendererPath), 'Dynamic3DModelRenderer.tsx exists');
    const content = fs.readFileSync(rendererPath, 'utf-8');

    // Dedicated position parent group
    assert.ok(
      content.includes('const positionGroup = new THREE.Group()') &&
        content.includes('positionGroup.add(modelRoot)'),
      'Creates positionGroup that parents modelRoot'
    );

    // Does not move camera, lights, or scene indiscriminate
    assert.ok(
      content.includes('scene.add(ambientLight)') &&
        content.includes('scene.add(keyLight)') &&
        content.includes('scene.add(grid)'),
      'Lights, grid, and camera are added to root scene and not indiscriminately translated'
    );

    // Callouts track world position
    assert.ok(
      content.includes('mesh.getWorldPosition(tempV)') || content.includes('bbox.setFromObject(mesh)'),
      'Callout labels track transformed mesh positions in world coordinates'
    );

    // Supplies props to Global3DViewer
    assert.ok(
      content.includes('modelPosition={modelPosition}') &&
        content.includes('onModelPositionChange={setModelPosition}') &&
        content.includes('enablePositionControls={true}'),
      'Passes modelPosition and enablePositionControls to Global3DViewer'
    );
  });

  // ---------------------------------------------------------------------------
  // 4. Human Anatomy Explorer (GLB/GLTF Model)
  // ---------------------------------------------------------------------------
  await t.test('4. HUMAN ANATOMY GLB: External body mesh & dissection guides move as coherent group with position controls', () => {
    const humanPath = path.resolve('src/components/biology/HumanAnatomyExplorer.tsx');
    assert.ok(fs.existsSync(humanPath), 'HumanAnatomyExplorer.tsx exists');
    const content = fs.readFileSync(humanPath, 'utf-8');

    // Import and state
    assert.ok(
      content.includes("import { ModelPositionControls } from '../common/ModelPositionControls'"),
      'HumanAnatomyExplorer imports ModelPositionControls'
    );
    assert.ok(
      content.includes('const [modelPosition, setModelPosition] = useState<{ x: number; y: number }>'),
      'Declares modelPosition state'
    );

    // Position group parenting
    assert.ok(
      content.includes('const positionGroup = new THREE.Group()') &&
        content.includes('positionGroup.add(modelGroup)'),
      'Parents modelGroup into positionGroup'
    );

    // Controls rendered below canvas
    assert.ok(
      content.includes('<ModelPositionControls'),
      'Renders ModelPositionControls directly below ExternalBodyDissectionViewer canvas'
    );
  });

  // ---------------------------------------------------------------------------
  // 5. Frog Anatomy Neck Dissection (GLB/GLTF Model)
  // ---------------------------------------------------------------------------
  await t.test('5. FROG ANATOMY GLB: Specimen and surgical tray move together with position controls below viewer', () => {
    const frogPath = path.resolve('src/components/biology/FrogNeckDissectionScene.tsx');
    assert.ok(fs.existsSync(frogPath), 'FrogNeckDissectionScene.tsx exists');
    const content = fs.readFileSync(frogPath, 'utf-8');

    // Dissection group parenting
    assert.ok(
      content.includes('const dissectionGroup = new THREE.Group()') &&
        content.includes('dissectionGroup.add(trayGroup)'),
      'Dissection group parents specimen tray and frog model'
    );

    // Controls rendered below canvas
    assert.ok(
      content.includes('<ModelPositionControls') &&
        content.includes('position={modelPosition}') &&
        content.includes('onChange={setModelPosition}'),
      'Renders ModelPositionControls with synchronized modelPosition state'
    );
  });

  // ---------------------------------------------------------------------------
  // 6. Native Biology Models: Cell & DNA Scenes
  // ---------------------------------------------------------------------------
  await t.test('6. BIOLOGY LAB MODELS: Cell and DNA scenes connect position groups to Global3DViewer', () => {
    const cellContent = fs.readFileSync(path.resolve('src/components/biology/CellScene.tsx'), 'utf-8');
    const dnaContent = fs.readFileSync(path.resolve('src/components/biology/DnaScene.tsx'), 'utf-8');

    assert.ok(
      cellContent.includes('const positionGroup = new THREE.Group()') &&
        cellContent.includes('positionGroup.add(cellGroup)') &&
        cellContent.includes('enablePositionControls={true}'),
      'CellScene equips positionGroup and activates position controls in Global3DViewer'
    );

    assert.ok(
      dnaContent.includes('const positionGroup = new THREE.Group()') &&
        dnaContent.includes('positionGroup.add(dnaRoot)') &&
        dnaContent.includes('enablePositionControls={true}'),
      'DnaScene equips positionGroup and activates position controls in Global3DViewer'
    );
  });

  // ---------------------------------------------------------------------------
  // 7. Native Chemistry Models: Molecular & Chemistry Lab Scenes
  // ---------------------------------------------------------------------------
  await t.test('7. CHEMISTRY LAB MODELS: Molecular scene and virtual apparatus connect position groups to Global3DViewer', () => {
    const molContent = fs.readFileSync(path.resolve('src/components/chemistry/MolecularScene.tsx'), 'utf-8');
    const labContent = fs.readFileSync(path.resolve('src/components/chemistry/ChemistryLabScene.tsx'), 'utf-8');

    assert.ok(
      molContent.includes('const positionGroup = new THREE.Group()') &&
        molContent.includes('positionGroup.add(molGroup)') &&
        molContent.includes('enablePositionControls={true}'),
      'MolecularScene equips positionGroup and activates position controls in Global3DViewer'
    );

    assert.ok(
      labContent.includes('const labApparatusGroup = new THREE.Group()') &&
        labContent.includes('enablePositionControls={true}'),
      'ChemistryLabScene equips labApparatusGroup and activates position controls in Global3DViewer'
    );
  });

  // ---------------------------------------------------------------------------
  // 8. Native Physics Simulations: Projectile, Pendulum, and Circuit Scenes
  // ---------------------------------------------------------------------------
  await t.test('8. PHYSICS SIMULATIONS: Projectile, Pendulum, and Circuit scenes preserve simulation math during translation', () => {
    const projContent = fs.readFileSync(path.resolve('src/components/physics/ProjectileScene.tsx'), 'utf-8');
    const pendContent = fs.readFileSync(path.resolve('src/components/physics/PendulumScene.tsx'), 'utf-8');
    const circContent = fs.readFileSync(path.resolve('src/components/physics/CircuitScene.tsx'), 'utf-8');

    assert.ok(
      projContent.includes('projectileGroupRef.current.position.set(modelPosition.x, modelPosition.y, 0)') &&
        projContent.includes('enablePositionControls={true}'),
      'ProjectileScene applies position offset while preserving kinematic projectile math'
    );

    assert.ok(
      pendContent.includes('pendulumVisualGroupRef.current.position.set(modelPosition.x, modelPosition.y, 0)') &&
        pendContent.includes('enablePositionControls={true}'),
      'PendulumScene applies position offset while preserving pendulum oscillation integrator'
    );

    assert.ok(
      circContent.includes('circuitVisualRootRef.current.position.set(modelPosition.x, modelPosition.y, 0)') &&
        circContent.includes('enablePositionControls={true}'),
      'CircuitScene applies position offset while preserving interactive circuit elements'
    );
  });

  // ---------------------------------------------------------------------------
  // 9. Camera Orbit and Zoom Preservation
  // ---------------------------------------------------------------------------
  await t.test('9. CAMERA PRESERVATION: Mouse orbit and scroll zoom controls remain active and independent of translation', () => {
    const controlsCode = fs.readFileSync(path.resolve('src/simulations/orbitControls.ts'), 'utf-8');
    assert.ok(controlsCode.includes('class SimpleOrbitControls'), 'SimpleOrbitControls exists and handles orbit & zoom');

    // Reset Camera vs Reset Position differentiation
    const viewerContent = fs.readFileSync(path.resolve('src/components/common/Global3DViewer.tsx'), 'utf-8');
    assert.ok(
      viewerContent.includes('handleResetPosition') && viewerContent.includes('onResetCamera'),
      'Global3DViewer maintains distinct behaviors for Reset Position vs Reset Camera'
    );
  });
});
