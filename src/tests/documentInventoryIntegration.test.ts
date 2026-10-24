import test from 'node:test';
import assert from 'node:assert/strict';
import { REAGENTS, DOCUMENT_INVENTORY_AUDIT } from '../data/chemicalLibraryData';
import { DOCUMENT_SOURCE_MANIFEST } from '../data/documentCompoundInventory';
import { getCanonicalRegistry, findOrLookupCompound } from '../data/compoundRegistry';
import { evaluateReactionRecipe } from '../data/reactionsData';
import { resolveAiChemistryAssistantQuery } from '../utils/aiChemistryAssistantResolver';

test('1. Complete 22-Page Document Source Manifest & Zero-Skip Reconciliation', () => {
  console.log('--- COMPLETE 22-PAGE DOCUMENT INVENTORY AUDIT SUMMARY ---');
  console.log('Total Raw Source Entries in 22-Page PDF:', DOCUMENT_INVENTORY_AUDIT.totalRawEntries);
  console.log('Manifest Entry Count:', DOCUMENT_SOURCE_MANIFEST.length);
  console.log('Raw Counts by Category:', JSON.stringify(DOCUMENT_INVENTORY_AUDIT.byCategoryRawCounts));
  console.log('Raw Counts by Page (1..22):', JSON.stringify(DOCUMENT_INVENTORY_AUDIT.byPageRawCounts));
  console.log('Unique Deduplicated Document Compounds:', DOCUMENT_INVENTORY_AUDIT.uniqueCanonicalCount);
  console.log('Cross-Category / Hydrate Merged Entries:', DOCUMENT_INVENTORY_AUDIT.crossCategoryMergedCount);
  console.log('Safety Breakdown:', JSON.stringify(DOCUMENT_INVENTORY_AUDIT.safetyBreakdown));
  console.log('Visual Lab Status Breakdown:', JSON.stringify(DOCUMENT_INVENTORY_AUDIT.visualLabBreakdown));
  console.log('Total Canonical Registry Compounds (Merged with Base):', REAGENTS.length);
  console.log('Documented Formula Corrections Count:', DOCUMENT_INVENTORY_AUDIT.corrections.length);

  // Verify every single page 1..22 is accounted for in the manifest
  for (let p = 1; p <= 22; p++) {
    assert.ok(
      DOCUMENT_INVENTORY_AUDIT.byPageRawCounts[p] > 0,
      `Page ${p} of the 22-page PDF must have extracted source entries`
    );
  }

  assert.equal(
    DOCUMENT_SOURCE_MANIFEST.length,
    DOCUMENT_INVENTORY_AUDIT.totalRawEntries,
    'Every raw source entry must have a 1-to-1 record in DOCUMENT_SOURCE_MANIFEST'
  );

  // Verify every manifest entry maps to an existing canonical compound in REAGENTS
  const canonicalIds = new Set(REAGENTS.map((r) => r.id));
  for (const item of DOCUMENT_SOURCE_MANIFEST) {
    assert.ok(
      canonicalIds.has(item.canonicalRegistryId),
      `Source entry ${item.sourceEntryId} (${item.originalName}) maps to missing canonical ID ${item.canonicalRegistryId}`
    );
    assert.ok(item.visualLabStatus, `Source entry ${item.sourceEntryId} must have visualLabStatus`);
  }

  // Verify zero duplicate IDs in canonical REAGENTS
  const seenIds = new Set<string>();
  for (const r of REAGENTS) {
    assert.ok(!seenIds.has(r.id), `Duplicate canonical ID found: ${r.id}`);
    assert.ok(r.visualLabStatus, `Canonical reagent ${r.id} must have a visualLabStatus`);
    seenIds.add(r.id);
  }
  assert.equal(getCanonicalRegistry().length, REAGENTS.length);
});

test('2. Previously Omitted & Specialized Compounds Across All 22 Pages Are Present', () => {
  const mustExistIds = [
    // Acids (Pages 1–6)
    'h2xeo4',
    'hsb_oh6',
    'hbf4',
    'hpf6',
    'iodoacetic_acid',
    'phenol_carbolic_acid',
    'lignoceric_acid',
    'cerotic_acid',
    'beta_alanine',
    'atp_acid',
    'indole_3_acetic_acid',
    'jasmonic_acid',
    'gibberellic_acid',
    'abscisic_acid',
    'cyanuric_acid',
    'boronic_acid_general',
    'glyphosate',
    'etidronic_acid',
    'domoic_acid',
    'kainic_acid',
    'carminic_acid',
    'glycyrrhizic_acid',
    'valproic_acid',
    'ibuprofen_acid',
    'mefenamic_acid',
    'tranexamic_acid',
    // Bases & Salts/Solutions (Pages 7–13)
    'tmg_base',
    'tbd_base',
    'phosphazene_p1_tbu',
    'verkades_base',
    'water',
    'sucrose_solution',
    'glucose_solution',
    'urea',
    // Oxidizers (Pages 15–18)
    'dmdo_oxidant',
    'selectfluor',
    'o2f2_gas',
    'if5',
    'sbf5',
    'agf2',
    'cof3',
    'pbf4',
    'bif5',
    'fremys_salt',
    // Indicators (Pages 18–20)
    'bromochlorophenol_blue',
    'p_xylenol_blue',
    'brilliant_yellow',
    'tropaeolin_o',
    'universal_indicator',
    'nitroferroin',
    'janus_green_b',
    'methyl_viologen',
    'diphenylcarbazone',
    'diphenylcarbazide',
    'chrome_azurol_s',
    'methylumbelliferone_4',
    'acridine_orange',
    // Catalysts (Pages 20–22)
    'zeises_salt',
    'hoveyda_grubbs_catalyst',
    'kaminsky_catalyst',
    'noyori_catalyst',
    'amberlyst_15',
    'nafion_catalyst',
    'imes_nhc',
    'macmillan_catalyst',
    'jorgensen_hayashi_catalyst',
    'tebac_catalyst',
    'crown_18_6',
    'three_way_auto_catalyst',
    'co_catalyst',
    'hds_como_catalyst',
    'cu_catalyst',
    'steam_reforming_ni_catalyst',
  ];

  for (const id of mustExistIds) {
    const found = REAGENTS.find((r) => r.id === id);
    assert.ok(found, `Expected canonical registry to contain "${id}" from 22-page PDF`);
  }
});

test('3. Source Document Formula Typos & Ambiguities Are Scientifically Corrected', () => {
  const nervonic = REAGENTS.find((r) => r.id === 'nervonic_acid')!;
  assert.ok(nervonic.formula.includes('C₂₃H₄₅COOH'));
  assert.ok(nervonic.formulaCorrectionNote?.includes('C₂₃H₄500COOH'));

  const dna = REAGENTS.find((r) => r.id === 'dna_polymer')!;
  assert.ok(dna.formula.includes('ₙ'));

  const rna = REAGENTS.find((r) => r.id === 'rna_polymer')!;
  assert.ok(rna.formula.includes('ₙ'));

  const hyaluronic = REAGENTS.find((r) => r.id === 'hyaluronic_acid')!;
  assert.ok(hyaluronic.formula.includes('(C₁₄H₂₁NO₁₁)ₙ'));

  const performic = REAGENTS.find((r) => r.id === 'performic_acid')!;
  assert.ok(performic.formula.includes('HCOOOH'));

  const tbhp = REAGENTS.find((r) => r.id === 'tbhp')!;
  assert.ok(tbhp.formula.includes('(CH₃)₃C–OOH') || tbhp.formula.includes('(CH₃)₃COOH'));

  const murexide = REAGENTS.find((r) => r.id === 'murexide')!;
  assert.ok(murexide.formula.includes('C₈H₈N₆O₆'));
  assert.ok(murexide.formulaCorrectionNote?.includes('C₈₈H₈N₆O₆'));

  const zsm5 = REAGENTS.find((r) => r.id === 'zeolite_zsm5')!;
  assert.ok(zsm5.formulaCorrectionNote?.includes('Naₙ[AlₙSi₉₆₋ₙO₁₉₂]'));
});

test('4. Catalyst Details Are Concise, Scannable, and Non-Bloated (Section 5)', () => {
  const catalysts = REAGENTS.filter(
    (r) => r.category === 'catalyst' || r.secondaryCategories?.includes('catalyst')
  );
  assert.ok(catalysts.length >= 90, `Expected at least 90 catalysts, found ${catalysts.length}`);

  for (const cat of catalysts) {
    assert.ok(cat.name.length > 0, `Catalyst ${cat.id} must have name`);
    assert.ok(cat.formula.length > 0, `Catalyst ${cat.id} must have formula`);
    assert.ok(
      cat.description.length <= 200,
      `Catalyst ${cat.id} description should be concise (<=200 chars), got ${cat.description.length}: "${cat.description}"`
    );
    if (cat.catalyticRole) {
      assert.ok(
        cat.catalyticRole.length <= 160,
        `Catalyst ${cat.id} catalyticRole should be concise (<=160 chars), got ${cat.catalyticRole.length}`
      );
    }
  }
});

test('5. Search & Alias Resolution Across All 7 Document Categories', () => {
  const queries: Array<[string, string]> = [
    ['Muriatic Acid', 'hcl'],
    ['Aqua Fortis', 'hno3'],
    ['Carbolic Acid', 'phenol_carbolic_acid'],
    ['Glyphosate', 'glyphosate'],
    ['Slaked Lime', 'ca_oh2'],
    ['Verkade', 'verkades_base'],
    ['Mohr Salt', 'mohrs_salt'],
    ['Potash Alum', 'potash_alum'],
    ['Tungsten', 'w_metal'],
    ['Selectfluor', 'selectfluor'],
    ['Bromothymol Blue', 'bromothymol_blue'],
    ['Eriochrome Black T', 'ebt_indicator'],
    ['Nitroferroin', 'nitroferroin'],
    ["Wilkinson's Catalyst", 'wilkinsons_catalyst'],
    ["Zeise's Salt", 'zeises_salt'],
    ['Amberlyst-15', 'amberlyst_15'],
  ];

  for (const [query, expectedId] of queries) {
    const res = findOrLookupCompound(query);
    assert.equal(res.found, true, `Expected query "${query}" to be found`);
    assert.equal(res.compound?.id, expectedId, `Expected "${query}" to resolve to "${expectedId}"`);
  }
});

test('6. AI Chemical Reaction Assistant — Single-Compound & Multi-Compound Queries Across Full Inventory', () => {
  // 1. Single-compound query for newly imported Acid (Carbolic acid)
  const qAcid = resolveAiChemistryAssistantQuery('What is Carbolic acid?');
  assert.equal(qAcid.queryType, 'single_compound');
  assert.equal(qAcid.matchedCompounds[0]?.id, 'phenol_carbolic_acid');
  assert.ok(qAcid.replyMarkdown.includes('C₆H₅OH'));

  // 2. Single-compound query for Catalyst (Ziegler–Natta catalyst)
  const qCat = resolveAiChemistryAssistantQuery('Tell me about Ziegler-Natta catalyst');
  assert.equal(qCat.queryType, 'single_compound');
  assert.equal(qCat.matchedCompounds[0]?.id, 'ziegler_natta');
  assert.ok(qCat.replyMarkdown.includes('TiCl₄'));

  // 3. Single-compound query for Indicator (Ferroin)
  const qInd = resolveAiChemistryAssistantQuery('What is Ferroin?');
  assert.equal(qInd.queryType, 'single_compound');
  assert.equal(qInd.matchedCompounds[0]?.id, 'ferroin');
  assert.ok(qInd.replyMarkdown.includes('REDOX'));

  // 4. Multi-compound simulator-supported reaction query (HCl + NaOH)
  const qSimRx = resolveAiChemistryAssistantQuery('What happens when HCl and NaOH react?');
  assert.equal(qSimRx.queryType, 'multi_compound_reaction');
  assert.equal(qSimRx.isSimulatorExecutable, true);
  assert.ok(qSimRx.matchedReaction, 'Should return matchedReaction for HCl + NaOH');
  assert.ok(qSimRx.replyMarkdown.includes('NaCl'));

  // 5. Multi-compound conceptual Acid + Base query from newly imported compounds (Valproic acid + KOH)
  const qConceptRx = resolveAiChemistryAssistantQuery('Valproic acid + KOH');
  assert.equal(qConceptRx.queryType, 'multi_compound_reaction');
  assert.equal(qConceptRx.matchedCompounds.length, 2);
  assert.ok(qConceptRx.replyMarkdown.includes('Neutralization'));

  // 6. Restricted compound query in AI Assistant (Dioxygen difluoride / O2F2 + Water)
  const qRestricted = resolveAiChemistryAssistantQuery('O2F2 + Water');
  assert.equal(qRestricted.hasRestrictedCompound, true);
  assert.equal(qRestricted.isSimulatorExecutable, false);
  assert.ok(qRestricted.replyMarkdown.includes('RESTRICTED'));

  // 7. Ambiguous query disambiguation ("Litmus")
  const qAmbig = resolveAiChemistryAssistantQuery('Litmus');
  assert.ok(
    qAmbig.ambiguousCandidates.length >= 2 || qAmbig.matchedCompounds.length >= 1,
    'Litmus query should surface Litmus variants'
  );
});

test('7. Restricted Hazardous & Radioactive Substances Are Searchable For Reference But Blocked From Mixing', () => {
  const restrictedIds = [
    'hf_acid',
    'nacn',
    'kcn',
    'f2_gas',
    'o2f2_gas',
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
    assert.equal(entry.visualLabStatus, 'Restricted', `"${id}" must have visualLabStatus='Restricted'`);
    assert.equal(entry.isSimulationSupported, false, `"${id}" must have isSimulationSupported=false`);

    const evalRes = evaluateReactionRecipe({
      ingredients: [
        { id, amount: 10 },
        { id: 'water', amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(evalRes.isSupported, false);
    assert.ok(evalRes.message.includes('SAFETY RESTRICTION'));
  }
});
