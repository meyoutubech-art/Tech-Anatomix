import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { getComponentDisplayName } from '../utils/componentDisplayName';
import { FROG_ORGAN_LIST } from '../data/frogAnatomyData';
import { HUMAN_ORGAN_LIST } from '../data/humanAnatomyData';

export async function runCanonicalDisplayNamesTests() {
  console.log('\n====================================================');
  console.log('TECH-ANATOMIX — CANONICAL DISPLAY NAME CONSISTENCY VERIFICATION');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: Resolver function behavior
  console.log('\n--- TEST 1: getComponentDisplayName Resolver ---');
  assert(
    getComponentDisplayName({ id: 'part-1', name: 'Original Name', label: 'Custom Label' }) === 'Custom Label',
    'Prioritizes label over name when label is non-empty string'
  );
  assert(
    getComponentDisplayName({ id: 'part-2', name: 'Original Name' }) === 'Original Name',
    'Falls back to name when label is missing'
  );
  assert(
    getComponentDisplayName({ id: 'part-3', label: '   ' }) === 'part-3',
    'Falls back to id when label is whitespace only and name is missing'
  );
  assert(
    getComponentDisplayName(null) === '',
    'Returns empty string for null or undefined input'
  );

  // TEST 2: Every model in CURATED_AI_MODELS has identical name and label matching canonical display name
  console.log('\n--- TEST 2: CURATED_AI_MODELS Display Name Synchronization ---');
  const uniqueModels = new Set(Object.values(CURATED_AI_MODELS));
  let allSynced = true;
  let duplicateLabelCount = 0;

  for (const model of uniqueModels) {
    if (!model || !Array.isArray(model.parts)) continue;
    const labelSet = new Set<string>();

    for (const part of model.parts) {
      const canonical = getComponentDisplayName(part);
      if (part.name !== canonical || part.label !== canonical) {
        allSynced = false;
        console.error(`Mismatch in model ${model.id}, part ${part.id}: name="${part.name}", label="${part.label}", canonical="${canonical}"`);
      }
      if (labelSet.has(canonical)) {
        duplicateLabelCount++;
        console.error(`Duplicate label in model ${model.id}: "${canonical}"`);
      }
      labelSet.add(canonical);
    }
  }

  assert(allSynced, `All components across all ${uniqueModels.size} curated models have 100% synchronized name and label`);
  assert(duplicateLabelCount === 0, `No curated 3D model contains duplicate component labels within its scene`);

  // TEST 3: Water molecule and Carbon dioxide explorer disambiguation
  console.log('\n--- TEST 3: Sibling Disambiguation Verification ---');
  const waterModel = Object.values(CURATED_AI_MODELS).find((m) => m.id === 'water-molecule');
  assert(
    Boolean(
      waterModel?.parts.some((p) => p.label === 'Hydrogen 1 (δ⁺)') &&
      waterModel?.parts.some((p) => p.label === 'Hydrogen 2 (δ⁺)')
    ),
    'water-molecule hydrogens are disambiguated as Hydrogen 1 and Hydrogen 2'
  );

  const waterExplorer = Object.values(CURATED_AI_MODELS).find((m) => m.id === 'water-molecule-explorer');
  assert(
    Boolean(
      waterExplorer?.parts.some((p) => p.label === 'Non-Bonding Lone Pair 1 (sp³)') &&
      waterExplorer?.parts.some((p) => p.label === 'Non-Bonding Lone Pair 2 (sp³)')
    ),
    'water-molecule-explorer lone pairs are disambiguated as 1 and 2'
  );

  const co2Explorer = Object.values(CURATED_AI_MODELS).find((m) => m.id === 'carbon-dioxide-explorer');
  assert(
    Boolean(
      co2Explorer?.parts.some((p) => p.label === 'Left Double Bond (σ + π, 4e⁻)') &&
      co2Explorer?.parts.some((p) => p.label === 'Right Double Bond (σ + π, 4e⁻)')
    ),
    'carbon-dioxide-explorer double bonds are disambiguated as Left and Right'
  );

  // TEST 4: Rutherford Alpha Source label
  console.log('\n--- TEST 4: Rutherford Experiment Verification ---');
  const rutherfordModel = Object.values(CURATED_AI_MODELS).find((m) => m.id === 'rutherford-gold-foil');
  const leadEmitter = rutherfordModel?.parts.find((p) => p.id === 'lead-emitter');
  assert(
    leadEmitter?.label === 'Alpha Source (Lead Collimator)' &&
    leadEmitter?.name === 'Alpha Source (Lead Collimator)',
    'Rutherford alpha emitter has descriptive name and label: "Alpha Source (Lead Collimator)"'
  );

  // TEST 5: Frog & Human Anatomy Manifest Consistency
  console.log('\n--- TEST 5: Anatomy Manifests Consistency ---');
  const frogOrgansUnique = new Set(FROG_ORGAN_LIST.map((o) => o.name)).size === FROG_ORGAN_LIST.length;
  assert(frogOrgansUnique, `All ${FROG_ORGAN_LIST.length} frog organs have unique canonical names`);

  const humanOrgansUnique = new Set(HUMAN_ORGAN_LIST.map((o) => o.name)).size === HUMAN_ORGAN_LIST.length;
  assert(humanOrgansUnique, `All ${HUMAN_ORGAN_LIST.length} human organs have unique canonical names`);

  console.log(`\n====================================================`);
  console.log(`CANONICAL DISPLAY NAME SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================`);
  if (failed > 0) process.exit(1);
}

runCanonicalDisplayNamesTests();
