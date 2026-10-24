import {
  MY_SCIENCE_MODELS_29,
  getAllIntegratedModelsDirectory,
  BACKEND_AI_AND_SCIENTIFIC_SERVICES,
} from '../data/modelsDirectoryRegistry';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { ALL_PHYSICS_PAGE_MODELS } from '../pages/PhysicsLabPage';

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
  console.log('=== Verifying Settings Directory & 29 Science Models ===');

  // 1. Verify exact count and ordering of the 29 models
  assert(
    MY_SCIENCE_MODELS_29.length === 29,
    `Expected exactly 29 models in MY_SCIENCE_MODELS_29, got ${MY_SCIENCE_MODELS_29.length}`
  );

  const curatedById = new Map<string, any>();
  Object.values(CURATED_AI_MODELS).forEach((spec) => {
    if (spec && spec.id) curatedById.set(spec.id, spec);
  });

  EXPECTED_29_TITLES.forEach((expected, idx) => {
    const entry = MY_SCIENCE_MODELS_29[idx];
    assert(
      entry.number === expected.number,
      `Entry at index ${idx} has number ${entry.number}, expected ${expected.number}`
    );
    assert(
      entry.title === expected.title,
      `Entry #${expected.number} has title "${entry.title}", expected "${expected.title}"`
    );
    assert(
      entry.displayLabel === `${expected.number}. ${expected.title}`,
      `Entry #${expected.number} displayLabel "${entry.displayLabel}" does not match "${expected.number}. ${expected.title}"`
    );

    // Verify underlying 3D ScientificModelSpec exists in CURATED_AI_MODELS
    const spec = curatedById.get(entry.id);
    assert(
      Boolean(spec),
      `Entry #${expected.number} (${expected.title}) with ID "${entry.id}" not found in CURATED_AI_MODELS`
    );
    assert(
      Array.isArray(spec.parts) && spec.parts.length > 0,
      `Entry #${expected.number} (${expected.title}) has no 3D parts`
    );

    // Verify launchTarget route is valid
    if (entry.launchTarget.route === 'physics') {
      const inPhysicsPage = ALL_PHYSICS_PAGE_MODELS.some(
        (m) => m.id === entry.launchTarget.physicsModelId
      );
      assert(
        inPhysicsPage,
        `Entry #${expected.number} (${expected.title}) targets PhysicsLabPage with "${entry.launchTarget.physicsModelId}", which is missing from ALL_PHYSICS_PAGE_MODELS`
      );
    }
  });
  console.log('✓ All 29 My Science Models verified with exact numbering, titles, 3D specs, and launch targets');

  // 2. Verify full integrated models inventory (deduplication & completeness)
  const allDirectory = getAllIntegratedModelsDirectory();
  const uniqueIds = new Set(allDirectory.map((m) => m.id));
  assert(
    uniqueIds.size === allDirectory.length,
    `Expected zero duplicate IDs in getAllIntegratedModelsDirectory(), got ${allDirectory.length} total vs ${uniqueIds.size} unique`
  );
  assert(
    allDirectory.length === 122,
    `Expected 122 total integrated models (90 Curated 3D Specs + 7 Standalone Three.js Lab Scenes + 25 Procedural 3D Models), got ${allDirectory.length}`
  );

  const flaggedMy29 = allDirectory.filter((m) => m.isInMy29Models);
  assert(
    flaggedMy29.length === 29,
    `Expected all 29 My Science Models to be flagged in All Integrated Models directory, got ${flaggedMy29.length}`
  );
  console.log(`✓ Full codebase inventory verified: ${allDirectory.length} unique integrated models with 0 duplicates`);

  // 3. Verify no secret keys or credentials appear in backend service descriptions
  BACKEND_AI_AND_SCIENTIFIC_SERVICES.forEach((svc) => {
    assert(
      !svc.description.includes('AIza') && !svc.description.includes('gsk_'),
      `Service ${svc.id} must not expose API keys`
    );
  });
  console.log('✓ Backend AI & Scientific Computation Services verified');
}

runSettingsAndModelDirectoryVerification();
