import test from 'node:test';
import assert from 'node:assert';
import {
  SKETCHFAB_HUMAN_CONFIG,
  HUMAN_ORGAN_LIST,
} from '../data/humanAnatomyData';

test('Human Anatomy Specimen & Neck Dissection Test Suite', async (t) => {
  await t.test('Sketchfab human external 3D embed URL strictly matches requested model 9b0b079953b840bc9a13f524b60041e4', () => {
    assert.ok(
      SKETCHFAB_HUMAN_CONFIG.externalBodyEmbedUrl.includes('9b0b079953b840bc9a13f524b60041e4'),
      'External body embed must use 9b0b079953b840bc9a13f524b60041e4'
    );
  });

  await t.test('Sketchfab human internal organs embed URL strictly matches requested model fe69d7b1ed6f46a3bd0b6933b796092e', () => {
    assert.ok(
      SKETCHFAB_HUMAN_CONFIG.internalOrgansEmbedUrl.includes('fe69d7b1ed6f46a3bd0b6933b796092e'),
      'Internal organs embed must use fe69d7b1ed6f46a3bd0b6933b796092e'
    );
  });

  await t.test('Human organ manifest includes all key vital systems', () => {
    assert.ok(HUMAN_ORGAN_LIST.length >= 6, 'Must have at least 6 core organs defined');
    const organIds = HUMAN_ORGAN_LIST.map((o) => o.id);
    assert.ok(organIds.includes('human_brain'), 'Manifest must include brain');
    assert.ok(organIds.includes('human_heart'), 'Manifest must include heart');
    assert.ok(organIds.includes('human_lungs'), 'Manifest must include lungs');
    assert.ok(organIds.includes('human_liver'), 'Manifest must include liver');
    assert.ok(organIds.includes('human_kidneys'), 'Manifest must include kidneys');
  });

  await t.test('Each organ possesses complete clinical description and scientific taxonomy', () => {
    for (const organ of HUMAN_ORGAN_LIST) {
      assert.ok(organ.name.length > 0, `Organ ${organ.id} must have a name`);
      assert.ok(organ.scientificName.length > 0, `Organ ${organ.id} must have a scientific name`);
      assert.ok(organ.function.length > 20, `Organ ${organ.id} must have a detailed function`);
      assert.ok(organ.clinicalSignificance.length > 10, `Organ ${organ.id} must have clinical notes`);
    }
  });
});
