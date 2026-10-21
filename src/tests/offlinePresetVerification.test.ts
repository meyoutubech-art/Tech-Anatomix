import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import {
  getUniquePresets,
  verifyPresetIntegrity,
  matchOfflinePreset,
  prepareAllOfflinePresets,
} from '../utils/offlineModelManager';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';

console.log('====================================================');
console.log('VIZLAB OFFLINE PRESET & PWA VERIFICATION SUITE');
console.log('====================================================');

describe('VIZLAB Offline Mode & Preset Verification', () => {
  const presets = getUniquePresets();
  const totalPresets = presets.length;

  console.log(`\n--- CHECK 1: Total Registered Presets Count (${totalPresets} Models) ---`);
  it('Should register all unique presets accurately', () => {
    assert.strictEqual(totalPresets, 90, `Expected 90 unique models (83 previous + 7 Chemistry Batch 2), got ${totalPresets}`);
    console.log(`✅ PASS: Exactly ${totalPresets} unique preset models identified in registry`);
  });

  console.log('\n--- CHECK 2: Preset Integrity & Geometry Verification (All 41 Models) ---');
  it('Should verify every preset model has valid geometry, materials, and labels', () => {
    const categoriesCount: Record<string, number> = {
      Physics: 0,
      Chemistry: 0,
      Biology: 0,
      'Earth & Space': 0,
      Engineering: 0,
    };

    presets.forEach((preset, index) => {
      const isValid = verifyPresetIntegrity(preset.spec);
      assert.strictEqual(
        isValid,
        true,
        `Preset '${preset.id}' (${preset.title}) failed integrity check`
      );
      assert.ok(
        preset.partsCount > 0,
        `Preset '${preset.id}' must have at least 1 3D part (got ${preset.partsCount})`
      );
      assert.ok(preset.title, `Preset '${preset.id}' must have a title`);
      categoriesCount[preset.category] = (categoriesCount[preset.category] || 0) + 1;

      console.log(
        `✅ PASS [${index + 1}/${totalPresets}]: '${preset.title}' verified (${preset.partsCount} 3D parts, category: ${preset.category})`
      );
    });

    console.log('\nCategory breakdown:', categoriesCount);
  });

  console.log('\n--- CHECK 3: Offline Model Preparation & Progress Reporting ---');
  it('Should run offline preparation reporting dynamic progress: Preparing offline models: X/TOTAL', async () => {
    const progressLogs: string[] = [];

    const result = await prepareAllOfflinePresets((info) => {
      progressLogs.push(info.message);
    });

    assert.strictEqual(result.isReady, true, 'Preparation must report isReady: true');
    assert.strictEqual(
      result.verifiedCount,
      totalPresets,
      `Verified count must match ${totalPresets}`
    );
    assert.strictEqual(result.unverified.length, 0, 'No unverified models allowed');

    // Confirm that progress messages use the dynamic format: "Preparing offline models: X/31"
    const sampleMsg = progressLogs.find((m) => m.startsWith('Preparing offline models:'));
    assert.ok(sampleMsg, 'Must emit "Preparing offline models: X/31" messages');
    assert.ok(
      sampleMsg.includes(`/${totalPresets}`),
      `Message must include /${totalPresets}, got: ${sampleMsg}`
    );

    console.log(`✅ PASS: Preparation completed with 100% success (${result.verifiedCount}/${totalPresets})`);
    console.log(`✅ PASS: Progress message verified: "${sampleMsg}"`);
  });

  console.log('\n--- CHECK 4: Offline Prompt & Try Prompts Resolution ---');
  it('Should resolve all Try Prompts and queries directly offline without network calls', () => {
    const testQueries = [
      { q: 'Create a 3D model of a friction explorer', expectedId: 'friction-explorer' },
      { q: 'Wave motion explorer with crests and troughs', expectedId: 'wave-motion' },
      { q: '3D model of sound waves in air', expectedId: 'sound-wave' },
      { q: 'Magnetic field explorer with bar magnet and straight wire', expectedId: 'magnetic-field-explorer' },
      { q: 'Create a DC electric motor with split-ring commutator', expectedId: 'dc-motor' },
      { q: 'Interactive atom model with electron shells', expectedId: 'interactive-atom' },
      { q: 'Ionic and covalent bonding explorer NaCl H2O CH4', expectedId: 'bonding-explorer' },
      { q: 'Water molecule explorer with bent geometry', expectedId: 'water-molecule-explorer' },
      { q: 'Carbon dioxide molecule explorer linear O=C=O', expectedId: 'carbon-dioxide-explorer' },
      { q: 'Create a 3D model of an astronomical refracting telescope', expectedId: 'astronomical-telescope' },
      { q: 'Create a 3D model of Rutherford gold foil scattering experiment', expectedId: 'rutherford-gold-foil' },
      { q: 'Create a 3D model of a simple pendulum', expectedId: 'simple-pendulum' },
      { q: 'Create a 3D model of a lever', expectedId: 'class-1-lever' },
      { q: 'Create a 3D model of the solar system', expectedId: 'solar-system' },
      { q: 'Create a 3D model of projectile motion', expectedId: 'projectile-motion' },
      { q: 'Create a 3D model of a human heart explorer with cutaway and blood flow', expectedId: 'heart-explorer' },
      { q: 'Human respiratory system with bronchial tree and alveoli gas exchange', expectedId: 'respiratory-explorer' },
      { q: '3D model of human digestive system with food path and villi', expectedId: 'digestive-system' },
      { q: 'Human brain explorer with lobes, cross section and neuron synapse', expectedId: 'brain-explorer' },
      { q: 'Detailed human eye and vision model with light path and retina', expectedId: 'eye-vision' },
      { q: 'Create an interactive 3D plant cell with cell wall, chloroplasts, and vacuole', expectedId: 'plant-cell-explorer' },
      { q: 'Interactive animal cell with organelles and mitochondria cutaway', expectedId: 'animal-cell-explorer' },
      { q: 'Plant root and transport explorer with xylem and phloem', expectedId: 'plant-root-transport' },
      { q: 'Blood and circulation microscope with red blood cells and clotting', expectedId: 'blood-circulation-microscope' },
      { q: 'Neuron and nerve signal explorer with action potential and synapse', expectedId: 'neuron-nerve-signal' },
      { q: 'Molecular orbital explorer with LCAO bonding and antibonding wavefunctions', expectedId: 'molecular-orbital-explorer' },
      { q: 'Atomic orbital probability explorer with radial and angular nodes', expectedId: 'atomic-orbital-probability-explorer' },
      { q: 'Advanced crystal lattice explorer with SC BCC FCC and HCP unit cells', expectedId: 'advanced-crystal-lattice-explorer' },
      { q: 'Molecular polarity explorer with bond dipole vectors and resultant dipole', expectedId: 'molecular-polarity-explorer' },
      { q: 'Intermolecular forces explorer with London dispersion and hydrogen bonding', expectedId: 'intermolecular-forces-explorer' },
      { q: 'Electrochemical cell simulator Zn Cu galvanic cell with salt bridge and Nernst voltage', expectedId: 'electrochemical-cell-simulator' },
      { q: 'Electrolysis explorer with molten sodium chloride and Faraday laws calculator', expectedId: 'electrolysis-explorer' },
    ];

    testQueries.forEach(({ q, expectedId }) => {
      const match = matchOfflinePreset(q);
      assert.strictEqual(
        match.matched,
        true,
        `Expected offline match for query: "${q}"`
      );
      assert.strictEqual(
        match.spec?.id,
        expectedId,
        `Query "${q}" expected to match model ID '${expectedId}', got '${match.spec?.id}'`
      );
      console.log(`✅ PASS: Offline query "${q}" -> resolved to '${match.spec?.id}' (${match.presetTitle})`);
    });
  });

  console.log('\n--- CHECK 5: PWA Assets & Manifest Files Verification ---');
  it('Should confirm all required PWA icons and manifest assets exist on disk', () => {
    const requiredFiles = [
      'public/icon.svg',
      'public/pwa-192x192.png',
      'public/pwa-512x512.png',
      'public/pwa-maskable-512x512.png',
      'public/apple-touch-icon.png',
      'public/favicon.ico',
    ];

    requiredFiles.forEach((file) => {
      const fullPath = path.resolve(process.cwd(), file);
      assert.ok(fs.existsSync(fullPath), `Missing required PWA asset: ${file}`);
      const stats = fs.statSync(fullPath);
      assert.ok(stats.size > 0, `Asset ${file} must not be empty`);
      console.log(`✅ PASS: PWA asset verified: ${file} (${stats.size} bytes)`);
    });
  });
});
