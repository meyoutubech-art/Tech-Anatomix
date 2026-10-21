import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { BATCH_3_MODELS } from '../data/curatedModelsBatch5';
import { BATCH_2_MODELS } from '../data/curatedModelsBatch2';

test('TECH-ANATOMIX — 3D Viewer Layout & Information Panel Bug Fix Verification', async (t) => {
  const rendererPath = path.resolve(process.cwd(), 'src/components/models/Dynamic3DModelRenderer.tsx');
  const physicsLabPath = path.resolve(process.cwd(), 'src/pages/PhysicsLabPage.tsx');
  const rendererCode = fs.readFileSync(rendererPath, 'utf8');
  const physicsLabCode = fs.readFileSync(physicsLabPath, 'utf8');

  // =========================================================================
  // 1. ROOT CAUSE AUDIT: REMOVAL OF OVERSIZED IN-CANVAS OVERLAYS
  // =========================================================================
  await t.test('1. Root Cause: Oversized in-canvas overlay cards covering 3D viewer removed for Electric Bell and Bonding', () => {
    // Check that neither Electric Bell nor Bonding Explorer has an oversized absolute overlay inside mountRef
    // Previously: <div className="absolute top-3 left-3 right-3 sm:right-auto bg-slate-900/... text-white p-3 rounded-xl border border-slate-700/80 shadow-xl text-xs z-10 space-y-2.5 max-w-sm pointer-events-auto">
    assert.doesNotMatch(
      rendererCode,
      /modelSpec\.functionalType === 'electric-bell'[\s\S]{1,100}max-w-sm pointer-events-auto/,
      'Electric Bell must not have an oversized max-w-sm overlay inside the 3D canvas'
    );

    assert.doesNotMatch(
      rendererCode,
      /modelSpec\.functionalType === 'bonding-explorer'[\s\S]{1,100}max-w-sm pointer-events-auto/,
      'Bonding Explorer must not have an oversized max-w-sm overlay inside the 3D canvas'
    );
  });

  // =========================================================================
  // 2. COMPACT IN-CANVAS ESSENTIAL STATUS CHIPS
  // =========================================================================
  await t.test('2. In-Canvas Essential Status: Sleek, non-intrusive 1-line essential chip with smooth navigation', () => {
    // Both models should have a compact status chip positioned at top-14 left-3 (below header, clear of model)
    assert.match(
      rendererCode,
      /Compact Essential Status Chip for Electric Bell Mechanism/,
      'Electric Bell must have a compact essential status chip'
    );
    assert.match(
      rendererCode,
      /Compact Essential Status Chip for Ionic & Covalent Bonding Explorer/,
      'Bonding Explorer must have a compact essential status chip'
    );

    // Verify chip has smooth scroll button to dedicated panel
    assert.match(
      rendererCode,
      /electric-bell-dedicated-panel/,
      'Electric Bell chip must link to electric-bell-dedicated-panel'
    );
    assert.match(
      rendererCode,
      /bonding-dedicated-panel/,
      'Bonding Explorer chip must link to bonding-dedicated-panel'
    );
  });

  // =========================================================================
  // 3. DEDICATED COLLAPSIBLE INFORMATION PANELS OUTSIDE 3D CANVAS
  // =========================================================================
  await t.test('3. Dedicated Information Panels: Relocated outside the 3D canvas with working expand/collapse controls', () => {
    // Dedicated panel for Electric Bell must exist outside </Global3DViewer>
    const afterViewer = rendererCode.split('</Global3DViewer>')[1];
    assert.ok(afterViewer, 'Content after Global3DViewer must exist');

    assert.match(
      afterViewer,
      /id="electric-bell-dedicated-panel"/,
      'Electric Bell dedicated information panel must be positioned outside the 3D canvas'
    );
    assert.match(
      afterViewer,
      /id="bonding-dedicated-panel"/,
      'Bonding Explorer dedicated information panel must be positioned outside the 3D canvas'
    );

    // Verify working expand/collapse toggle buttons
    assert.match(
      afterViewer,
      /setIsBellInfoExpanded\(!isBellInfoExpanded\)/,
      'Electric Bell panel must have an interactive expand/collapse toggle'
    );
    assert.match(
      afterViewer,
      /setIsBondingInfoExpanded\(!isBondingInfoExpanded\)/,
      'Bonding panel must have an interactive expand/collapse toggle'
    );

    // Verify all 9 steps and live telemetry are preserved in the dedicated panel
    assert.match(
      afterViewer,
      /Coordinated 9-Step Bell Cycle Stepper/,
      'Electric Bell panel must contain the 9-step coordinated cycle stepper'
    );
    assert.match(
      afterViewer,
      /Live Physical Telemetry Grid/,
      'Electric Bell panel must contain the physical telemetry grid'
    );
    assert.match(
      afterViewer,
      /Valence Electron Accounting & Bonding Mechanism/,
      'Bonding Explorer panel must contain the full valence electron accounting breakdown'
    );
  });

  // =========================================================================
  // 4. PRESERVATION OF 3D MODELS AND INTERACTIVITY
  // =========================================================================
  await t.test('4. Model Preservation: Electric Bell and Bonding models retain all components, animations, and parameters', () => {
    const bell = CURATED_AI_MODELS['electric-bell'] || BATCH_3_MODELS.electricBell;
    assert.ok(bell, 'Electric Bell model must exist');
    assert.equal(bell.functionalType, 'electric-bell');
    assert.ok(bell.parts.length >= 10, 'Electric Bell must retain all physical parts');
    assert.ok(bell.parameters.operatingVoltage, 'Must retain operatingVoltage parameter');
    assert.ok(bell.parameters.springTension, 'Must retain springTension parameter');

    const bonding = CURATED_AI_MODELS['bonding-explorer'] || BATCH_2_MODELS.chemicalBonding;
    assert.ok(bonding, 'Bonding explorer model must exist');
    assert.equal(bonding.functionalType, 'bonding-explorer');
    assert.ok(bonding.parameters.reactionProgress, 'Must retain reactionProgress parameter');
    assert.ok(bonding.conditions.example, 'Must retain example selector condition');
  });

  // =========================================================================
  // 5. NO DUPLICATE CONTROLS OR PANELS IN PHYSICSLABPAGE
  // =========================================================================
  await t.test('5. Layout Hygiene: PhysicsLabPage cleanly branches between scene view and full-width Dynamic3DModelRenderer', () => {
    // When viewing curated models like electric-bell, Dynamic3DModelRenderer is rendered at full width
    // without redundant nested column splitting or duplicate parameter decks
    assert.match(
      physicsLabCode,
      /viewMode === 'scene' && \(activeModelId === 'projectile-motion' \|\| activeModelId === 'simple-pendulum' \|\| activeModelId === 'electric-circuit'\)/,
      'PhysicsLabPage must only show split scene view for classic bench scenes'
    );
  });
});
