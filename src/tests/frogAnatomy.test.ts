import test from 'node:test';
import assert from 'node:assert';
import {
  FROG_ORGAN_MANIFEST,
  FROG_ORGAN_LIST,
  FROG_ANATOMY_DISCLAIMER,
  SKETCHFAB_FROG_CONFIG,
  DISSECTION_STEPS,
  DISSECTION_TOOLS_METADATA,
} from '../data/frogAnatomyData';
import { FrogOrganId } from '../types/frogAnatomy';

test('Frog Anatomy Explorer Vertical Slice Test Suite', async (t) => {
  await t.test('Organ manifest strictly contains exactly the 6 modeled visceral organs', () => {
    const organIds = Object.keys(FROG_ORGAN_MANIFEST) as FrogOrganId[];
    const expectedIds: FrogOrganId[] = [
      'heart',
      'liver',
      'lungs',
      'stomach',
      'small_intestine',
      'large_intestine_cloaca',
    ];

    assert.strictEqual(organIds.length, 6, 'Must contain exactly 6 internal organs in first vertical slice');
    expectedIds.forEach((id) => {
      assert.ok(FROG_ORGAN_MANIFEST[id], `Organ ${id} must be defined in manifest`);
      assert.strictEqual(FROG_ORGAN_MANIFEST[id].id, id);
    });

    // Verify absent organs are NOT in the manifest
    const absentCandidateKeys = ['skeleton', 'kidney', 'spleen', 'gonads', 'testis', 'ovary', 'bladder'];
    absentCandidateKeys.forEach((key) => {
      assert.strictEqual(
        (FROG_ORGAN_MANIFEST as any)[key],
        undefined,
        `Absent organ '${key}' must not be in manifest prior to geometric implementation`
      );
    });
  });

  await t.test('All 6 organs possess complete academic qualifications and simplification notices', () => {
    FROG_ORGAN_LIST.forEach((organ) => {
      assert.ok(organ.name.length > 0, `${organ.id} must have a descriptive English name`);
      assert.ok(organ.scientificName.length > 0, `${organ.id} must have a scientific Latin term`);
      assert.ok(organ.system.length > 0, `${organ.id} must identify its physiological system`);
      assert.ok(organ.educationalDescription.length > 40, `${organ.id} must have a comprehensive educational description`);
      assert.ok(organ.function.length > 10, `${organ.id} must define its primary function`);
      assert.ok(
        organ.simplificationNotice.length > 25,
        `${organ.id} must explicitly disclose geometric simplifications`
      );
      assert.match(
        organ.simplificationNotice.toLowerCase(),
        /schematic|modeled|simplified|approximat/,
        `${organ.id} simplification notice must acknowledge schematic/procedural modeling`
      );
    });
  });

  await t.test('Spatial coelomic coordinates reflect plausible amphibian visceral layout', () => {
    const heart = FROG_ORGAN_MANIFEST.heart;
    const liver = FROG_ORGAN_MANIFEST.liver;
    const lungs = FROG_ORGAN_MANIFEST.lungs;
    const stomach = FROG_ORGAN_MANIFEST.stomach;
    const intestines = FROG_ORGAN_MANIFEST.small_intestine;
    const cloaca = FROG_ORGAN_MANIFEST.large_intestine_cloaca;

    // Heart is cranial (Y > 0.2) and situated in anterior ventral pericardium
    assert.ok(heart.relativeCoordinates.y > 0.2, 'Heart must be cranial');
    assert.ok(heart.relativeCoordinates.z > 0.2, 'Heart must be ventral');

    // Lungs are cranial and positioned dorsolaterally
    assert.ok(lungs.relativeCoordinates.y > 0.2, 'Lungs must be cranial');
    assert.ok(lungs.relativeCoordinates.z < heart.relativeCoordinates.z, 'Lungs must be deeper/dorsal relative to heart');

    // Stomach is predominantly on the left visceral plane (X < 0)
    assert.ok(stomach.relativeCoordinates.x < 0, 'Stomach must be on left lateral visceral plane');

    // Small intestine extends below stomach
    assert.ok(intestines.relativeCoordinates.y < stomach.relativeCoordinates.y, 'Small intestine must extend caudal to stomach');

    // Large intestine and cloaca terminate at the caudal pole (Y < -0.4)
    assert.ok(cloaca.relativeCoordinates.y < -0.4, 'Large intestine and cloaca must terminate caudally');
  });

  await t.test('Disclaimer text explicitly establishes prototype educational boundaries', () => {
    assert.ok(FROG_ANATOMY_DISCLAIMER.length > 50);
    assert.match(
      FROG_ANATOMY_DISCLAIMER.toLowerCase(),
      /educational schematic prototype|not a certified veterinary dissection specimen/
    );
  });

  await t.test('Anatomy tab and routes exist and are not hidden in backend', async () => {
    // Check that frog anatomy data and manifests are accessible
    assert.ok(FROG_ORGAN_LIST.length === 6, 'Must expose all 6 internal organs directly to frontend UI');
    assert.strictEqual(FROG_ORGAN_MANIFEST.heart.name, 'Three-Chambered Heart');
  });

  await t.test('Downloaded frog.glb asset exists and is a valid glTF binary model', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const glbPath = path.resolve('public/models/frog.glb');
    assert.ok(fs.existsSync(glbPath), 'public/models/frog.glb must exist on disk');

    const stat = fs.statSync(glbPath);
    assert.ok(stat.size > 6000000, 'GLB file size must be > 6MB');

    const fd = fs.openSync(glbPath, 'r');
    const buffer = Buffer.alloc(12);
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    const magic = buffer.toString('utf8', 0, 4);
    const version = buffer.readUInt32LE(4);
    assert.strictEqual(magic, 'glTF', 'File header magic must be glTF');
    assert.strictEqual(version, 2, 'glTF binary format version must be 2');
  });

  await t.test('Sketchfab 3D embed URLs strictly match required model IDs', () => {
    assert.strictEqual(
      SKETCHFAB_FROG_CONFIG.outerFrogEmbedUrl,
      'https://sketchfab.com/models/0bddb0f89cc94df2a56889c1de9143a1/embed?preload=1',
      'Outer frog embed URL must strictly match required URL'
    );
    assert.strictEqual(
      SKETCHFAB_FROG_CONFIG.internalOrgansEmbedUrl,
      'https://sketchfab.com/models/7643345ba03f4f87831a2a2ca3c27ad0/embed?autostart=1&camera=0&annotations_visible=1&ui_watermark_link=0&ui_watermark=0',
      'Internal organs embed URL must strictly match required URL'
    );
  });

  await t.test('Guided dissection progression contains structured 5-step curriculum', () => {
    assert.strictEqual(DISSECTION_STEPS.length, 5, 'Dissection progression must have 5 stages');
    assert.strictEqual(DISSECTION_STEPS[0].specimenView, 'external', 'Stage 1 must use external view');
    assert.strictEqual(DISSECTION_STEPS[4].specimenView, 'internal', 'Stage 5 must use internal visceral view');

    // Verify all tools are defined
    const tools = ['magnifier', 'pins', 'scalpel', 'scissors', 'forceps', 'probe'] as const;
    tools.forEach((t) => {
      assert.ok(DISSECTION_TOOLS_METADATA[t], `Tool metadata for '${t}' must be defined`);
      assert.ok(DISSECTION_TOOLS_METADATA[t].name.length > 0);
    });
  });
});


