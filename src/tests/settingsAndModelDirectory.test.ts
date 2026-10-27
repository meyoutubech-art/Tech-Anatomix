import {
  MY_SCIENCE_MODELS_29,
  getAllIntegratedModelsDirectory,
  getUnifiedModelLibrary,
  getModelDiscoveryDiagnostics,
  BACKEND_AI_AND_SCIENTIFIC_SERVICES,
} from '../data/modelsDirectoryRegistry';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { ALL_PHYSICS_PAGE_MODELS } from '../pages/PhysicsLabPage';
import { synthesizeProceduralScientificModel } from '../utils/proceduralModelSynthesizer';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

const EXPECTED_29_TITLES: { number: number; title: string }[] = [
  { number: 1, title: 'Simple Pendulum' },
  { number: 2, title: 'Hydraulic Lift' },
  { number: 3, title: "Newton's Cradle" },
  { number: 4, title: 'Rutherford Gold Foil Experiment' },
  { number: 5, title: 'Astronomical Telescope' },
  { number: 6, title: 'Wave Motion' },
  { number: 7, title: 'Sound Waves' },
  { number: 8, title: 'DC Electric Motor' },
  { number: 9, title: 'Interactive Atom Explorer' },
  { number: 10, title: 'Heat Explorer' },
  { number: 11, title: 'Brain Explorer' },
  { number: 12, title: 'Blood Transport' },
  { number: 13, title: "Faraday's Law / Induction Explorer" },
  { number: 14, title: 'Electric Bell' },
  { number: 15, title: 'Motor Effect' },
  { number: 16, title: 'Plasma Physics Explorer' },
  { number: 17, title: 'Particle Accelerator Explorer' },
  { number: 18, title: 'Magnetic Levitation / Maglev Train' },
  { number: 19, title: 'Superconductivity & Meissner Effect' },
  { number: 20, title: 'Motor & Generator' },
  { number: 21, title: 'Wave Interference & Diffraction Lab' },
  { number: 22, title: 'Nuclear Fusion Reactor' },
  { number: 23, title: 'Doppler Effect & Sonic Boom Explorer' },
  { number: 24, title: 'Gyroscope' },
  { number: 25, title: 'Simple Harmonic Motion / Coupled Oscillators' },
  { number: 26, title: 'Maxwell Equations' },
  { number: 27, title: 'Doppler Ultrasound' },
  { number: 28, title: 'Electrochemical Cell' },
  { number: 29, title: 'Acid-Base Titration Lab' },
];

export function runSettingsAndModelDirectoryVerification(): void {
  console.log('=== Verifying Unified Model Library & Automatic Discovery ===');

  const unifiedLibrary = getUnifiedModelLibrary();
  const allDirectory = getAllIntegratedModelsDirectory();
  const diagnostics = getModelDiscoveryDiagnostics();

  // 1. Verify single unified library matches getAllIntegratedModelsDirectory()
  assert(
    unifiedLibrary.length === allDirectory.length,
    `Expected getUnifiedModelLibrary() (${unifiedLibrary.length}) to equal getAllIntegratedModelsDirectory() (${allDirectory.length})`
  );

  // 2. Verify all 29 original models remain present in the unified library without duplicates
  assert(
    MY_SCIENCE_MODELS_29.length === 29,
    `Expected 29 original models, got ${MY_SCIENCE_MODELS_29.length}`
  );

  const curatedById = new Map<string, any>();
  Object.values(CURATED_AI_MODELS).forEach((spec) => {
    if (spec && spec.id) curatedById.set(spec.id, spec);
  });

  EXPECTED_29_TITLES.forEach((expected) => {
    const unifiedEntry = unifiedLibrary.find((m) => m.my29Number === expected.number);
    assert(
      Boolean(unifiedEntry),
      `Original model #${expected.number} (${expected.title}) is missing from the unified library`
    );
    assert(
      unifiedEntry!.title === expected.title,
      `Original model #${expected.number} has title "${unifiedEntry!.title}", expected "${expected.title}"`
    );
    assert(
      unifiedEntry!.isInMy29Models === true,
      `Original model #${expected.number} must have isInMy29Models=true`
    );

    // Ensure it appears ONLY ONCE in the unified library
    const occurrences = unifiedLibrary.filter(
      (m) => m.id === unifiedEntry!.id || m.my29Number === expected.number
    );
    assert(
      occurrences.length === 1,
      `Original model #${expected.number} (${expected.title}) appeared ${occurrences.length} times in unified library`
    );

    const spec = curatedById.get(unifiedEntry!.id);
    assert(
      Boolean(spec) && Array.isArray(spec.parts) && spec.parts.length > 0,
      `Original model #${expected.number} (${expected.title}) has no valid 3D parts in CURATED_AI_MODELS`
    );

    if (unifiedEntry!.launchTarget.route === 'physics') {
      const inPhysicsPage = ALL_PHYSICS_PAGE_MODELS.some(
        (m) => m.id === unifiedEntry!.launchTarget.physicsModelId
      );
      assert(
        inPhysicsPage,
        `Original model #${expected.number} targets PhysicsLabPage with "${unifiedEntry!.launchTarget.physicsModelId}", which is missing from ALL_PHYSICS_PAGE_MODELS`
      );
    }
  });
  console.log('✓ All 29 original models verified inside the single unified library with zero duplicates');

  // 3. Verify deduplication across the entire 122-model inventory
  const uniqueIds = new Set(unifiedLibrary.map((m) => m.id));
  assert(
    uniqueIds.size === unifiedLibrary.length,
    `Expected zero duplicate IDs in unified library, got ${unifiedLibrary.length} total vs ${uniqueIds.size} unique`
  );
  assert(
    unifiedLibrary.length === 122,
    `Expected 122 unique discovered models (90 Curated 3D Specs + 7 Standalone Three.js Lab Scenes + 25 Procedural 3D Models), got ${unifiedLibrary.length}`
  );
  assert(
    diagnostics.totalUniqueModels === 122 &&
      diagnostics.original29Count === 29 &&
      diagnostics.additionalModelsCount === 93,
    `Diagnostics mismatch: total=${diagnostics.totalUniqueModels}, original29=${diagnostics.original29Count}, additional=${diagnostics.additionalModelsCount}`
  );
  assert(
    diagnostics.duplicateReferencesResolved >= 83,
    `Expected at least 83 duplicate/alias references resolved, got ${diagnostics.duplicateReferencesResolved}`
  );
  console.log(
    `✓ Unified library count verified: ${diagnostics.totalUniqueModels} unique models (29 original + ${diagnostics.additionalModelsCount} additional), ${diagnostics.duplicateReferencesResolved} duplicate/alias references resolved`
  );

  // 4. Verify Subject Filters & Secondary Subject Tags
  const expectedCategories = [
    'All Subjects',
    'Physics',
    'Chemistry',
    'Biology',
    'Anatomy',
    'Engineering & Earth Science',
  ];
  expectedCategories.forEach((cat) => {
    assert(
      diagnostics.availableCategories.includes(cat as any),
      `Expected subject category "${cat}" to be present in diagnostics.availableCategories`
    );
  });

  // Verify sum of primary categories equals 122
  const sumPrimaryCategories =
    (diagnostics.categoryCounts['Physics'] || 0) +
    (diagnostics.categoryCounts['Chemistry'] || 0) +
    (diagnostics.categoryCounts['Biology'] || 0) +
    (diagnostics.categoryCounts['Anatomy'] || 0) +
    (diagnostics.categoryCounts['Engineering & Earth Science'] || 0);
  assert(
    sumPrimaryCategories === unifiedLibrary.length,
    `Sum of primary subject categories (${sumPrimaryCategories}) must equal total unique models (${unifiedLibrary.length})`
  );
  console.log('✓ Subject categories & secondary subject tags verified');

  // 5. Verify Alias Search & Metadata Completeness
  unifiedLibrary.forEach((item) => {
    assert(Boolean(item.canonicalName && item.id), `Model ${item.id} missing canonicalName`);
    assert(
      Array.isArray(item.subjectTags) && item.subjectTags.length >= 1,
      `Model ${item.id} missing subjectTags`
    );
    assert(Array.isArray(item.aliases), `Model ${item.id} missing aliases array`);
    assert(
      item.integrationStatus === 'Integrated',
      `Model ${item.id} should have integrationStatus="Integrated"`
    );
    assert(
      item.verificationStatus === 'Verified',
      `Model ${item.id} failed verification integrity check (status=${item.verificationStatus})`
    );
  });

  // Verify alias lookup for representative models across subjects
  const motorEntry = unifiedLibrary.find((m) => m.id === 'dc-motor')!;
  assert(
    motorEntry.aliases!.includes('motor') || motorEntry.aliases!.includes('dc-electric-motor'),
    `Expected dc-motor aliases to include "motor" or "dc-electric-motor", got ${JSON.stringify(motorEntry.aliases)}`
  );

  const bloodEntry = unifiedLibrary.find((m) => m.id === 'blood-transport')!;
  assert(
    bloodEntry.aliases!.includes('circulatory-system') ||
      bloodEntry.aliases!.includes('cardiovascular-system'),
    `Expected blood-transport aliases to include "circulatory-system"`
  );

  // Verify procedural synthesizer models load valid 3D specs when launched
  const doublePendulumEntry = unifiedLibrary.find((m) => m.id === 'custom-double-pendulum-chaos')!;
  const synthesizedSpec = synthesizeProceduralScientificModel(
    doublePendulumEntry.launchTarget.aiProceduralPrompt!
  );
  assert(
    synthesizedSpec && Array.isArray(synthesizedSpec.parts) && synthesizedSpec.parts.length >= 4,
    `Procedural model "custom-double-pendulum-chaos" failed to synthesize a valid 3D spec`
  );
  console.log('✓ Alias search and multi-subject model loading verification passed');

  // 6. Verify no secret keys or credentials appear in backend service descriptions
  BACKEND_AI_AND_SCIENTIFIC_SERVICES.forEach((svc) => {
    assert(
      !svc.description.includes('AIza') && !svc.description.includes('gsk_'),
      `Service ${svc.id} must not expose API keys`
    );
  });
  console.log('✓ Backend AI & Scientific Computation Services verified');
}

runSettingsAndModelDirectoryVerification();
