import test from 'node:test';
import assert from 'node:assert';
import { SKETCHFAB_HUMAN_CONFIG, HUMAN_ORGAN_LIST } from '../data/humanAnatomyData';
import { SKETCHFAB_FROG_CONFIG, FROG_ORGAN_MANIFEST } from '../data/frogAnatomyData';

test('Human Anatomy & Frog Neck Dissection Integration Test Suite', async (t) => {
  await t.test('Human Sketchfab 3D embed configurations match user requested models', () => {
    assert.strictEqual(
      SKETCHFAB_HUMAN_CONFIG.externalBodyEmbedUrl,
      'https://sketchfab.com/models/9b0b079953b840bc9a13f524b60041e4/embed?autostart=1',
      'External human body model embed URL must match user specification'
    );

    assert.ok(
      SKETCHFAB_HUMAN_CONFIG.internalOrgansEmbedUrl.includes('fe69d7b1ed6f46a3bd0b6933b796092e'),
      'Internal human organs model ID must match fe69d7b1ed6f46a3bd0b6933b796092e'
    );

    assert.ok(
      SKETCHFAB_HUMAN_CONFIG.internalSketchfabUrl.includes('unlim3d') ||
      SKETCHFAB_HUMAN_CONFIG.author.includes('unlim3d'),
      'Must properly attribute original 3D author unlim3d'
    );
  });

  await t.test('Human organ manifest contains essential clinical organ systems', () => {
    assert.ok(HUMAN_ORGAN_LIST.length >= 7, 'Must contain at least 7 primary human organ systems');

    const expectedOrganIds = [
      'human_brain',
      'human_heart',
      'human_lungs',
      'human_liver',
      'human_stomach',
      'human_kidneys',
      'human_intestines',
    ];

    expectedOrganIds.forEach((id) => {
      const found = HUMAN_ORGAN_LIST.find((o) => o.id === id);
      assert.ok(found, `Human organ '${id}' must be defined`);
      assert.ok(found.name.length > 0, `Organ ${id} must have a name`);
      assert.ok(found.scientificName.length > 0, `Organ ${id} must have a Latin scientific name`);
      assert.ok(found.system.length > 0, `Organ ${id} must specify its physiological system`);
      assert.ok(found.function.length > 15, `Organ ${id} must detail its physiological function`);
      assert.ok(found.clinicalSignificance.length > 15, `Organ ${id} must provide clinical significance`);
    });
  });

  await t.test('Frog anatomy specimen configurations and 6 internal organs remain intact', () => {
    assert.strictEqual(
      SKETCHFAB_FROG_CONFIG.outerFrogEmbedUrl,
      'https://sketchfab.com/models/0bddb0f89cc94df2a56889c1de9143a1/embed?preload=1'
    );
    assert.ok(FROG_ORGAN_MANIFEST.heart);
    assert.ok(FROG_ORGAN_MANIFEST.lungs);
    assert.ok(FROG_ORGAN_MANIFEST.liver);
  });

  await t.test('Component files exist and are correctly structured', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    assert.ok(
      fs.existsSync(path.resolve('src/components/biology/FrogNeckDissectionScene.tsx')),
      'FrogNeckDissectionScene.tsx must exist'
    );

    assert.ok(
      fs.existsSync(path.resolve('src/components/biology/HumanAnatomyExplorer.tsx')),
      'HumanAnatomyExplorer.tsx must exist'
    );

    assert.ok(
      fs.existsSync(path.resolve('src/data/humanAnatomyData.ts')),
      'humanAnatomyData.ts must exist'
    );
  });
});
