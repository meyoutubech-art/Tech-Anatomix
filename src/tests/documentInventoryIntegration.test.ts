import test from 'node:test';
import assert from 'node:assert/strict';
import { REAGENTS, DOCUMENT_INVENTORY_AUDIT } from '../data/chemicalLibraryData';
import { getCanonicalRegistry, findOrLookupCompound } from '../data/compoundRegistry';
import { evaluateReactionRecipe } from '../data/reactionsData';

test('1. Complete 22-Page Document Inventory Audit & Category Coverage', () => {
  console.log('--- DOCUMENT INVENTORY AUDIT SUMMARY ---');
  console.log('Total Raw Entries in Document:', DOCUMENT_INVENTORY_AUDIT.totalRawEntries);
  console.log('Raw Counts by Category:', JSON.stringify(DOCUMENT_INVENTORY_AUDIT.byCategoryRawCounts));
  console.log('Unique Deduplicated Document Compounds:', DOCUMENT_INVENTORY_AUDIT.uniqueCanonicalCount);
  console.log('Cross-Category / Hydrate Merged Entries:', DOCUMENT_INVENTORY_AUDIT.crossCategoryMergedCount);
  console.log('Safety Breakdown:', JSON.stringify(DOCUMENT_INVENTORY_AUDIT.safetyBreakdown));
  console.log('Total Canonical Registry Compounds (Merged with Base):', REAGENTS.length);
  console.log('Documented Corrections Count:', DOCUMENT_INVENTORY_AUDIT.corrections.length);

  assert.equal(DOCUMENT_INVENTORY_AUDIT.totalRawEntries, 888, 'Should account for all 888 raw entries across the 22 pages');
  assert.equal(DOCUMENT_INVENTORY_AUDIT.byCategoryRawCounts.acid, 240);
  assert.equal(DOCUMENT_INVENTORY_AUDIT.byCategoryRawCounts.base, 148);
  assert.equal(DOCUMENT_INVENTORY_AUDIT.byCategoryRawCounts.salt, 92);
  assert.equal(DOCUMENT_INVENTORY_AUDIT.byCategoryRawCounts.metal, 92);
  assert.equal(DOCUMENT_INVENTORY_AUDIT.byCategoryRawCounts.oxidizer, 140);
  assert.equal(DOCUMENT_INVENTORY_AUDIT.byCategoryRawCounts.indicator, 81);
  assert.equal(DOCUMENT_INVENTORY_AUDIT.byCategoryRawCounts.catalyst, 95);

  // Verify zero duplicate IDs in canonical REAGENTS
  const seenIds = new Set<string>();
  for (const r of REAGENTS) {
    assert.ok(!seenIds.has(r.id), `Duplicate canonical ID found: ${r.id}`);
    seenIds.add(r.id);
  }
  assert.equal(getCanonicalRegistry().length, REAGENTS.length);
});

test('2. Source Document Formula Typos & Ambiguities Are Scientifically Corrected', () => {
  const nervonic = REAGENTS.find((r) => r.id === 'nervonic_acid');
  assert.ok(nervonic, 'Nervonic acid should exist');
  assert.ok(nervonic.formula.includes('C₂₃H₄₅COOH'));
  assert.ok(nervonic.formulaCorrectionNote?.includes('C₂₃H₄500COOH'));

  const dna = REAGENTS.find((r) => r.id === 'dna_polymer');
  assert.ok(dna, 'DNA should exist');
  assert.ok(dna.formula.includes('ₙ'));
  assert.ok(dna.formulaCorrectionNote?.includes('subscript'));

  const rna = REAGENTS.find((r) => r.id === 'rna_polymer');
  assert.ok(rna, 'RNA should exist');
  assert.ok(rna.formula.includes('ₙ'));

  const hyaluronic = REAGENTS.find((r) => r.id === 'hyaluronic_acid');
  assert.ok(hyaluronic, 'Hyaluronic acid should exist');
  assert.ok(hyaluronic.formula.includes('(C₁₄H₂₁NO₁₁)ₙ'));

  const performic = REAGENTS.find((r) => r.id === 'performic_acid');
  assert.ok(performic, 'Performic acid should exist');
  assert.ok(performic.formula.includes('HCOOOH'));

  const tbhp = REAGENTS.find((r) => r.id === 'tbhp');
  assert.ok(tbhp, 'tert-Butyl hydroperoxide should exist');
  assert.ok(tbhp.formula.includes('(CH₃)₃C–OOH') || tbhp.formula.includes('(CH₃)₃COOH'));

  const murexide = REAGENTS.find((r) => r.id === 'murexide');
  assert.ok(murexide, 'Murexide should exist');
  assert.ok(murexide.formula.includes('C₈H₈N₆O₆'));
  assert.ok(murexide.formulaCorrectionNote?.includes('C₈₈H₈N₆O₆'));

  const zsm5 = REAGENTS.find((r) => r.id === 'zeolite_zsm5');
  assert.ok(zsm5, 'Zeolite ZSM-5 should exist');
  assert.ok(zsm5.formulaCorrectionNote?.includes('Naₙ[AlₙSi₉₆₋ₙO₁₉₂]'));
});

test('3. Cross-Category Deduplication & Multi-Category Tagging', () => {
  // Sulfuric acid appears in Acids, Oxidizers, and Catalysts in the document
  const h2so4 = REAGENTS.find((r) => r.id === 'h2so4')!;
  assert.equal(h2so4.category, 'acid');
  assert.ok(h2so4.secondaryCategories?.includes('oxidizer'));
  assert.ok(h2so4.secondaryCategories?.includes('catalyst'));

  // Potassium permanganate appears in Salts, Oxidizers, and Indicators
  const kmno4 = REAGENTS.find((r) => r.id === 'kmn_o4_reagent')!;
  assert.ok(kmno4.sourceCategories?.includes('salt'));
  assert.ok(kmno4.sourceCategories?.includes('oxidizer'));
  assert.ok(kmno4.sourceCategories?.includes('indicator'));

  // Potassium chromate appears in Salts, Oxidizers, and Indicators (Mohr indicator)
  const k2cro4 = REAGENTS.find((r) => r.id === 'k2cro4')!;
  assert.equal(k2cro4.category, 'salt');
  assert.ok(k2cro4.secondaryCategories?.includes('oxidizer'));
  assert.ok(k2cro4.secondaryCategories?.includes('indicator'));

  // Vanadium pentoxide appears in Catalysts and Oxidizers
  const v2o5 = REAGENTS.find((r) => r.id === 'v2o5')!;
  assert.equal(v2o5.category, 'catalyst');
  assert.ok(v2o5.secondaryCategories?.includes('oxidizer'));
});

test('4. Search & Alias Resolution Across All 7 Document Categories', () => {
  const queries: Array<[string, string]> = [
    ['Muriatic Acid', 'hcl'],
    ['Aqua Fortis', 'hno3'],
    ['Oxalic Acid', 'oxalic_acid'],
    ['Ascorbic Acid', 'ascorbic_acid'],
    ['Slaked Lime', 'ca_oh2'],
    ['Milk of Magnesia', 'mg_oh2'],
    ['Barium Hydroxide', 'ba_oh2'],
    ['Pyridine', 'pyridine'],
    ['Mohr Salt', 'mohrs_salt'],
    ['Potash Alum', 'potash_alum'],
    ['Ferric ammonium sulfate', 'ferric_alum'],
    ['Tungsten', 'w_metal'],
    ['Lanthanum', 'la_metal'],
    ['Sodium Hypochlorite', 'naocl'],
    ['Bromothymol Blue', 'bromothymol_blue'],
    ['Eriochrome Black T', 'ebt_indicator'],
    ['Turmeric', 'curcumin_turmeric'],
    ["Wilkinson's Catalyst", 'wilkinsons_catalyst'],
    ["Grubbs' Catalyst", 'grubbs_catalyst_1'],
    ['Urease', 'urease_enzyme'],
  ];

  for (const [query, expectedId] of queries) {
    const res = findOrLookupCompound(query);
    assert.equal(res.found, true, `Expected query "${query}" to be found`);
    assert.equal(res.compound?.id, expectedId, `Expected "${query}" to resolve to "${expectedId}"`);
  }
});

test('5. Validated Chemical Reactions for Newly Integrated Compounds', () => {
  // 1. Oxalic Acid + KMnO4 Redox
  const oxalicKmno4 = evaluateReactionRecipe({
    ingredients: [
      { id: 'kmn_o4_reagent', amount: 20 },
      { id: 'oxalic_acid', amount: 20 },
    ],
    conditions: { temperature: 60, concentration: 1.0 },
  });
  assert.equal(oxalicKmno4.isSupported, true);
  assert.equal(oxalicKmno4.reaction?.id, 'kmno4_oxalic_acid_redox');
  assert.equal(oxalicKmno4.observableEffects?.producesGas, true);

  // 2. Potassium Dichromate + Iron(II) Sulfate Redox (Orange -> Emerald Green)
  const dichromateIron = evaluateReactionRecipe({
    ingredients: [
      { id: 'k2cr2o7', amount: 20 },
      { id: 'fe_so4', amount: 20 },
    ],
    conditions: { temperature: 25, concentration: 1.0 },
  });
  assert.equal(dichromateIron.isSupported, true);
  assert.equal(dichromateIron.reaction?.id, 'k2cr2o7_feso4_redox');
  assert.equal(dichromateIron.observableEffects?.colorChangeTo, '#059669');

  // 3. Silver Nitrate + Potassium Chromate (Mohr's Brick-Red Precipitate)
  const mohrRx = evaluateReactionRecipe({
    ingredients: [
      { id: 'agno3', amount: 20 },
      { id: 'k2cro4', amount: 15 },
    ],
    conditions: { temperature: 25, concentration: 1.0 },
  });
  assert.equal(mohrRx.isSupported, true);
  assert.equal(mohrRx.reaction?.id, 'agno3_k2cro4_mohr');
  assert.equal(mohrRx.observableEffects?.producesPrecipitate, true);
  assert.equal(mohrRx.observableEffects?.precipitateColor, '#B91C1C');

  // 4. Aqueous Iodine + Starch Solution (Blue-Black Complex)
  const iodineStarch = evaluateReactionRecipe({
    ingredients: [
      { id: 'iodine_solution', amount: 15 },
      { id: 'starch_solution', amount: 15 },
    ],
    conditions: { temperature: 25, concentration: 1.0 },
  });
  assert.equal(iodineStarch.isSupported, true);
  assert.equal(iodineStarch.reaction?.id, 'iodine_starch_complex');
  assert.equal(iodineStarch.observableEffects?.colorChangeTo, '#1E1B4B');

  // 5. Dynamic Indicator + Base / Acid Halochromic Transition (e.g., Thymolphthalein + KOH)
  const thymolBase = evaluateReactionRecipe({
    ingredients: [
      { id: 'thymolphthalein', amount: 5 },
      { id: 'koh', amount: 20 },
    ],
    conditions: { temperature: 25, concentration: 1.0 },
  });
  assert.equal(thymolBase.isSupported, true);
  assert.equal(thymolBase.observableEffects?.colorChangeTo, '#2563EB');

  // 6. Natural Indicator (Turmeric / Curcumin) + Base (NaOH) -> Reddish-Brown
  const turmericBase = evaluateReactionRecipe({
    ingredients: [
      { id: 'curcumin_turmeric', amount: 5 },
      { id: 'naoh', amount: 20 },
    ],
    conditions: { temperature: 25, concentration: 1.0 },
  });
  assert.equal(turmericBase.isSupported, true);
  assert.equal(turmericBase.observableEffects?.colorChangeTo, '#B91C1C');
});

test('6. Restricted Hazardous & Radioactive Substances Are Searchable For Reference But Blocked From Mixing', () => {
  const restrictedIds = [
    'hf_acid',
    'nacn',
    'kcn',
    'f2_gas',
    'oso4',
    'u_metal',
    'pu_metal',
    'ra_metal',
    'ra_oh2',
  ];

  for (const id of restrictedIds) {
    const entry = REAGENTS.find((r) => r.id === id);
    assert.ok(entry, `Restricted document entry "${id}" must be preserved in registry`);
    assert.equal(entry.isRestricted, true, `"${id}" must have isRestricted=true`);
    assert.equal(entry.isSimulationSupported, false, `"${id}" must have isSimulationSupported=false`);
    assert.ok(entry.restrictionReason && entry.restrictionReason.length > 10);

    // Must be blocked by evaluateReactionRecipe if someone attempts to mix it
    const evalRes = evaluateReactionRecipe({
      ingredients: [
        { id, amount: 10 },
        { id: 'water', amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(evalRes.isSupported, false, `Restricted compound "${id}" must be blocked from reaction execution`);
    assert.ok(evalRes.message.includes('SAFETY RESTRICTION'));
  }
});
