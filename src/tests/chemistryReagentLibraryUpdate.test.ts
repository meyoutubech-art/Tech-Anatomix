import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateReactionRecipe,
  REAGENTS,
} from '../data/reactionsData';
import {
  findOrLookupCompound,
  getCanonicalRegistry,
  normalizeChemicalSearchText,
} from '../data/compoundRegistry';

test('TECH-ANATOMIX — Chemistry Reagent Library Update (Catalysts & Water H₂O)', async (t) => {
  await t.test('1. Catalysts Category Expansion: Preserves existing IDs, avoids duplicates, and includes school-level, industrial, and reference catalysts', () => {
    const registry = getCanonicalRegistry();

    // Ensure no duplicate IDs in canonical registry or REAGENTS
    const ids = registry.map((r) => r.id);
    assert.equal(new Set(ids).size, ids.length, 'Canonical registry must not contain duplicate reagent IDs');

    // Filter catalysts using the exact Reagent Library Shelf logic from ChemistryLabPage.tsx
    const catalystsInShelf = registry.filter(
      (r) =>
        r.category === 'catalyst' ||
        r.type === 'catalyst' ||
        Boolean(r.secondaryCategories?.includes('catalyst'))
    );

    // Must contain all required school-level, industrial, and reference catalysts
    const expectedCatalystIds = [
      'mno2',              // Manganese dioxide — MnO₂
      'fe',                // Iron — Fe
      'ni_catalyst',       // Finely divided nickel — Ni
      'pt_wire',           // Platinum — Pt
      'pd_catalyst',       // Palladium — Pd
      'cuo',               // Copper(II) oxide — CuO
      'ki',                // Potassium iodide — KI
      'catalase_enzyme',   // Catalase enzyme
      'v2o5',              // Vanadium(V) oxide — V₂O₅
      'fe_haber_catalyst', // Promoted Iron catalyst — Haber process
      'pt_rh_catalyst',    // Platinum–rhodium gauze — Ostwald process
      'zeolite_zsm5',      // Zeolites (ZSM-5) — Catalytic cracking
      'al2o3',             // Aluminium oxide — Al₂O₃
      'cu_catalyst',       // Supported copper catalyst
      'rh_catalyst',       // Rhodium — Rh
      'ru_catalyst',       // Ruthenium — Ru
      'co_catalyst',       // Cobalt catalyst — Fischer–Tropsch
      'zno',               // Zinc oxide — ZnO
    ];

    for (const id of expectedCatalystIds) {
      const cat = catalystsInShelf.find((c) => c.id === id);
      assert.ok(cat, `Catalyst "${id}" must be present in the Catalysts category filter`);
      assert.ok(cat.catalyticRole && cat.catalyticRole.length > 10, `Catalyst "${id}" must define a clear catalyticRole`);
      assert.ok(cat.exampleReactions && cat.exampleReactions.length >= 1, `Catalyst "${id}" must include at least one example reaction`);
      assert.ok(cat.reactionConditions && cat.reactionConditions.length > 3, `Catalyst "${id}" must specify reaction conditions`);
      assert.ok(cat.curriculumLevel, `Catalyst "${id}" must classify school-level vs industrial vs additional reference`);
    }
  });

  await t.test('2. Catalyst Simulation vs Educational Reference Honesty: Supported catalytic reactions run, reference catalysts do not fabricate beaker reactions', () => {
    // Supported interactive catalysts with H2O2
    const mno2Eval = evaluateReactionRecipe({
      ingredients: [
        { id: 'h2o2', amount: 20 },
        { id: 'mno2', amount: 10 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(mno2Eval.isSupported, true);
    assert.equal(mno2Eval.reaction?.id, 'elephant_toothpaste');

    const kiEval = evaluateReactionRecipe({
      ingredients: [
        { id: 'h2o2', amount: 20 },
        { id: 'ki', amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(kiEval.isSupported, true);
    assert.equal(kiEval.reaction?.id, 'ki_peroxide_catalysis');

    const catalaseEval = evaluateReactionRecipe({
      ingredients: [
        { id: 'h2o2', amount: 20 },
        { id: 'catalase_enzyme', amount: 10 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(catalaseEval.isSupported, true);
    assert.equal(catalaseEval.reaction?.id, 'catalase_peroxide_decomposition');
    assert.equal(catalaseEval.observableEffects?.producesGas, true);

    // Reference catalyst alone or with non-matching reagent must NOT fabricate a reaction
    const singleV2O5 = evaluateReactionRecipe({
      ingredients: [{ id: 'v2o5', amount: 5 }],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(singleV2O5.isSupported, false);
    assert.equal(singleV2O5.reaction, null);
    assert.ok(singleV2O5.message.includes('Contact Process') || singleV2O5.message.includes('alternative lower-activation-energy pathway'));

    const unsupportedPairing = evaluateReactionRecipe({
      ingredients: [
        { id: 'ni_catalyst', amount: 5 },
        { id: 'nacl', amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(unsupportedPairing.isSupported, false);
    assert.equal(unsupportedPairing.reaction, null);
    assert.ok(unsupportedPairing.message.includes('not universally interchangeable'));
  });

  await t.test('3. Water (H₂O) in Salts & Solutions: Metadata, Category Filter, and Search by water, H2O, and H₂O', () => {
    const registry = getCanonicalRegistry();
    const water = registry.find((r) => r.id === 'water');
    assert.ok(water, 'Canonical Water entry must exist');
    assert.equal(water.name, 'Water');
    assert.equal(water.formula, 'H₂O');
    assert.equal(water.state, 'liquid');
    assert.equal(water.role, 'Solvent');
    assert.equal(water.category, 'salt', 'Water must belong to the Salts & Solutions (salt) category');
    assert.equal(
      water.description,
      'Water commonly acts as a solvent in aqueous solutions and may also participate directly in certain chemical reactions.'
    );

    // Verify Salts & Solutions category filter includes Water
    const saltsAndSolutions = REAGENTS.filter(
      (r) =>
        r.id === 'water' ||
        r.category === 'salt' ||
        r.type === 'salt' ||
        r.type === 'carbonate' ||
        r.type === 'reagent' ||
        r.type === 'reducing_agent'
    );
    assert.ok(saltsAndSolutions.some((r) => r.id === 'water'), 'Salts & Solutions shelf filter must include Water (H₂O)');

    // Verify search queries: "water", "H2O", and "H₂O"
    for (const q of ['water', 'H2O', 'H₂O']) {
      const lookup = findOrLookupCompound(q);
      assert.equal(lookup.found, true, `Lookup for "${q}" must succeed`);
      assert.equal(lookup.compound?.id, 'water', `Lookup for "${q}" must resolve to canonical water entry`);

      const qNorm = normalizeChemicalSearchText(q);
      const shelfMatches: boolean =
        normalizeChemicalSearchText(water.name).includes(qNorm) ||
        normalizeChemicalSearchText(water.formula).includes(qNorm);
      assert.equal(shelfMatches, true, `Shelf search filter must match Water for query "${q}"`);
    }
  });

  await t.test('4. Water (H₂O) Beaker Behavior: Solvent alone, dilution of non-reactive solute, and direct reaction with Potassium', () => {
    // 1. Water alone in beaker -> no fake reaction
    const waterAlone = evaluateReactionRecipe({
      ingredients: [{ id: 'water', amount: 30 }],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(waterAlone.isSupported, false);
    assert.equal(waterAlone.reaction, null);
    assert.ok(waterAlone.message.includes('polar solvent'));

    // 2. Water + CuSO4 (dilution, no chemical reaction)
    const waterDilution = evaluateReactionRecipe({
      ingredients: [
        { id: 'cuso4', amount: 20 },
        { id: 'water', amount: 30 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(waterDilution.isSupported, false);
    assert.equal(waterDilution.reaction, null);
    assert.ok(waterDilution.message.includes('solvent'));

    // 3. Water + HCl + NaOH (aqueous neutralization proceeds normally in presence of water solvent)
    const neutWithWater = evaluateReactionRecipe({
      ingredients: [
        { id: 'water', amount: 30 },
        { id: 'hcl', amount: 20 },
        { id: 'naoh', amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(neutWithWater.isSupported, true);
    assert.equal(neutWithWater.reaction?.id, 'neutralization');

    // 4. Water + Potassium metal (water participates directly as reactant)
    const kWater = evaluateReactionRecipe({
      ingredients: [
        { id: 'k_metal', amount: 10 },
        { id: 'water', amount: 30 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(kWater.isSupported, true);
    assert.equal(kWater.reaction?.id, 'alkali_explosion');
  });
});
