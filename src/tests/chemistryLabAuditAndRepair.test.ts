import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateReactionRecipe,
  REACTIONS,
  REAGENTS,
} from '../data/reactionsData';
import { findOrLookupCompound, getCanonicalRegistry } from '../data/compoundRegistry';

test('TECH-ANATOMIX — Chemistry Lab Audit & Repair Verification Suite (Parts 1–8)', async (t) => {
  // =========================================================================
  // CASE 1: Supported Reaction with Known Products
  // =========================================================================
  await t.test('Case 1: Supported reaction (HCl + NaOH) yields validated result with balanced products', () => {
    const result = evaluateReactionRecipe({
      ingredients: [
        { id: 'hcl', amount: 20 },
        { id: 'naoh', amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });

    assert.equal(result.isSupported, true, 'HCl + NaOH must be supported');
    assert.equal(result.status, 'ready');
    assert.equal(result.structuredStatus, 'VALIDATED_SUPPORTED_REACTION');
    assert.ok(result.reaction, 'Reaction object must be non-null');
    assert.equal(result.reaction?.id, 'neutralization');
    assert.deepEqual(result.productsList, ['NaCl (aq)', 'H₂O (l)']);
    assert.equal(result.observableEffects?.producesGas, false);
    assert.equal(result.observableEffects?.producesPrecipitate, false);
    assert.equal(result.observableEffects?.temperatureDelta, 12.5, 'Exothermic temperature delta');
  });

  // =========================================================================
  // CASE 2: Balanced Equation Correctness Check
  // =========================================================================
  await t.test('Case 2: Copper + Nitric Acid produces atom-balanced equation with NO2 gas', () => {
    const result = evaluateReactionRecipe({
      ingredients: [
        { id: 'cu', amount: 10 },
        { id: 'hno3', amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });

    assert.equal(result.isSupported, true);
    assert.equal(result.structuredStatus, 'VALIDATED_SUPPORTED_REACTION');
    assert.ok(result.balancedEquation);
    assert.equal(
      result.balancedEquation,
      'Cu(s) + 4HNO₃(aq) → Cu(NO₃)₂(aq) + 2NO₂(g)↑ + 2H₂O(l)',
      'Balanced equation must be atom-balanced'
    );
    assert.equal(result.observableEffects?.producesGas, true);
    assert.ok(result.observableEffects?.gasName?.includes('Nitrogen Dioxide'));
    assert.equal(result.observableEffects?.isViolent, true);
  });

  // =========================================================================
  // CASE 3: Combination That Does Not React (Copper + HCl)
  // =========================================================================
  await t.test('Case 3: Copper + Hydrochloric Acid does not react under standard conditions', () => {
    const result = evaluateReactionRecipe({
      ingredients: [
        { id: 'cu', amount: 10 },
        { id: 'hcl', amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });

    assert.equal(result.isSupported, false, 'Cu + HCl must not be reported as a reaction');
    assert.equal(result.status, 'unsupported');
    assert.equal(result.structuredStatus, 'NO_REACTION_SUPPORTED_UNDER_SPECIFIED_CONDITIONS');
    assert.equal(result.reaction, null, 'Reaction must be null for non-reactive pair');
    assert.ok(
      result.message.includes('Copper') && result.message.includes('cannot displace hydrogen gas'),
      'Message must give scientific electrochemistry reasoning'
    );
  });

  // =========================================================================
  // CASE 4: Condition-Dependent Reaction
  // =========================================================================
  await t.test('Case 4: Peroxide decomposition is condition-dependent based on catalyst presence', () => {
    // Without catalyst: condition-dependent slow rate
    const uncatalyzed = evaluateReactionRecipe({
      ingredients: [{ id: 'h2o2', amount: 20 }],
      conditions: { temperature: 25, concentration: 1.0, catalystId: null },
    });

    assert.equal(uncatalyzed.isSupported, false, 'Uncatalyzed single H2O2 is incomplete without catalyst or second reagent');
    assert.equal(uncatalyzed.structuredStatus, 'INSUFFICIENT_INFORMATION');

    // With MnO2 catalyst explicitly added as ingredient
    const catalyzed = evaluateReactionRecipe({
      ingredients: [
        { id: 'h2o2', amount: 20 },
        { id: 'mno2', amount: 10 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });

    assert.equal(catalyzed.isSupported, true, 'H2O2 + MnO2 must be validated');
    assert.equal(catalyzed.structuredStatus, 'VALIDATED_SUPPORTED_REACTION');
    assert.equal(catalyzed.reaction?.id, 'elephant_toothpaste');
    assert.equal(catalyzed.observableEffects?.producesGas, true);
  });

  // =========================================================================
  // CASE 5: Unsupported Combination Without Fabricated Certainty
  // =========================================================================
  await t.test('Case 5: Unverified reagent combination returns honest unsupported status without fabricated products', () => {
    const result = evaluateReactionRecipe({
      ingredients: [
        { id: 'nacl', amount: 20 },
        { id: 'water', amount: 50 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });

    assert.equal(result.isSupported, false);
    assert.equal(result.structuredStatus, 'NO_REACTION_SUPPORTED_UNDER_SPECIFIED_CONDITIONS');
    assert.equal(result.reaction, null);
    assert.ok(result.message.includes('spectator ions') || result.message.includes('dissolves'));
  });

  // =========================================================================
  // CASE 6: Changing Selected Reactants Changes Evaluation
  // =========================================================================
  await t.test('Case 6: Replacing reactants in experiment changes evaluation result dynamically', () => {
    // State 1: Neutralization (HCl + NaOH)
    const eval1 = evaluateReactionRecipe({
      ingredients: [
        { id: 'hcl', amount: 20 },
        { id: 'naoh', amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(eval1.reaction?.reactionType, 'neutralization');

    // State 2: User replaces NaOH with Mg metal ribbon
    const eval2 = evaluateReactionRecipe({
      ingredients: [
        { id: 'hcl', amount: 20 },
        { id: 'mg', amount: 10 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(eval2.reaction?.reactionType, 'single_displacement');
    assert.equal(eval2.observableEffects?.producesGas, true);
    assert.equal(eval2.observableEffects?.gasName?.includes('Hydrogen'), true);
  });

  // =========================================================================
  // CASE 7: Changing Conditions Changes Evaluation
  // =========================================================================
  await t.test('Case 7: Insufficient reactant amount below stoichiometric minimum yields INSUFFICIENT_INFORMATION', () => {
    const insufficient = evaluateReactionRecipe({
      ingredients: [
        { id: 'hcl', amount: 2 }, // Stoichiometric minimum is 20 mL
        { id: 'naoh', amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });

    assert.equal(insufficient.isSupported, true);
    assert.equal(insufficient.status, 'incomplete');
    assert.equal(insufficient.structuredStatus, 'INSUFFICIENT_INFORMATION');
    assert.ok(insufficient.message.includes('quantity is below stoichiometric minimum'));
  });

  // =========================================================================
  // CASE 8: Requesting Additional Information for Single Reagent
  // =========================================================================
  await t.test('Case 8: Single reagent in beaker requests complementary chemical reagent', () => {
    const single = evaluateReactionRecipe({
      ingredients: [{ id: 'hcl', amount: 20 }],
      conditions: { temperature: 25, concentration: 1.0 },
    });

    assert.equal(single.isSupported, false);
    assert.equal(single.status, 'incomplete');
    assert.equal(single.structuredStatus, 'INSUFFICIENT_INFORMATION');
    assert.ok(single.message.includes('Beaker contains only Hydrochloric Acid'));
    assert.ok(single.message.includes('Add a complementary chemical reagent'));
  });

  // =========================================================================
  // CASE 9: General Chemistry Questions Unrelated to Current Experiment
  // =========================================================================
  await t.test('Case 9: Chemical lookup for Lead Nitrate + KI evaluates general query without claiming empty beaker', () => {
    const pbLookup = findOrLookupCompound('lead nitrate');
    const kiLookup = findOrLookupCompound('potassium iodide');

    assert.equal(pbLookup.found, true);
    assert.equal(kiLookup.found, true);
    assert.equal(pbLookup.compound?.id, 'pb_no3_2');
    assert.equal(kiLookup.compound?.id, 'ki');

    const evalResult = evaluateReactionRecipe({
      ingredients: [
        { id: pbLookup.compound!.id, amount: 20 },
        { id: kiLookup.compound!.id, amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });

    assert.equal(evalResult.isSupported, true);
    assert.equal(evalResult.structuredStatus, 'VALIDATED_SUPPORTED_REACTION');
    assert.equal(evalResult.reaction?.id, 'golden_rain_ppt');
    assert.equal(evalResult.observableEffects?.producesPrecipitate, true);
    assert.equal(evalResult.observableEffects?.precipitateColor, '#EAB308');
  });

  // =========================================================================
  // CASE 10: No Unsupported Beaker Visual Effects
  // =========================================================================
  await t.test('Case 10: Non-reactive combination results in null active reaction and no fake 3D beaker effects', () => {
    const evalResult = evaluateReactionRecipe({
      ingredients: [
        { id: 'cu', amount: 10 },
        { id: 'hcl', amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });

    // Simulated ChemistryLabPage state mapping
    const hasRunReaction = true;
    const activeReaction = (hasRunReaction && evalResult.isSupported && evalResult.reaction) ? evalResult.reaction : null;

    assert.equal(activeReaction, null, 'Active reaction must be null for non-reactive pair');
  });

  // =========================================================================
  // CASE 11: Expanded Verified Shelf Reactions & Class-Specific Non-Reactive Logic
  // =========================================================================
  await t.test('Case 11: Shelf pairings (AgNO3+HCl, AgNO3+KI, BaCl2+CuSO4, Cu+AgNO3) and acid-acid non-reactivity', () => {
    const agcl = evaluateReactionRecipe({
      ingredients: [
        { id: 'agno3', amount: 20 },
        { id: 'hcl', amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(agcl.isSupported, true);
    assert.equal(agcl.observableEffects?.producesPrecipitate, true);
    assert.equal(agcl.balancedEquation, 'AgNO₃(aq) + HCl(aq) → AgCl(s)↓ + HNO₃(aq)');

    const cuAg = evaluateReactionRecipe({
      ingredients: [
        { id: 'cu', amount: 10 },
        { id: 'agno3', amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(cuAg.isSupported, true);
    assert.equal(cuAg.reaction?.id, 'cu_agno3_displacement');

    const twoAcids = evaluateReactionRecipe({
      ingredients: [
        { id: 'hcl', amount: 20 },
        { id: 'h2so4', amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(twoAcids.isSupported, false);
    assert.equal(twoAcids.structuredStatus, 'NO_REACTION_SUPPORTED_UNDER_SPECIFIED_CONDITIONS');
    assert.ok(twoAcids.message.includes('acids (proton donors)'));
  });

  // =========================================================================
  // CASE 12: Scientific Accuracy Upgrade — Chemical Colours, Effervescence vs Smoke, & Initial/Final States
  // =========================================================================
  await t.test('Case 12: Scientifically accurate chemical colours, colourless liquids, effervescence vs airborne fumes, and precipitate phases', () => {
    const registry = getCanonicalRegistry();

    // 1. Colourless reagents must be marked isColorless: true and #F8FAFC
    const colorlessIds = ['hcl', 'naoh', 'agno3', 'water', 'h2o2', 'nacl', 'ki', 'pb_no3_2', 'bacl2', 'na2s2o3'];
    for (const id of colorlessIds) {
      const item = registry.find((r) => r.id === id);
      assert.ok(item, `Reagent ${id} must exist in canonical registry`);
      assert.equal(item.isColorless, true, `Reagent ${id} (${item.name}) must be marked isColorless: true`);
      assert.equal(item.color, '#F8FAFC', `Reagent ${id} must have #F8FAFC colourless representation`);
    }

    // 2. Characteristic coloured reagents must have accurate colours
    const cuso4 = registry.find((r) => r.id === 'cuso4')!;
    assert.equal(cuso4.color, '#0284C7', 'Copper(II) sulfate solution must be characteristic blue (#0284C7)');
    assert.ok(!cuso4.isColorless);

    const kmno4 = registry.find((r) => r.id === 'kmn_o4_reagent')!;
    assert.equal(kmno4.color, '#7E22CE', 'Potassium permanganate solution must be deep purple/violet (#7E22CE)');

    const feso4 = registry.find((r) => r.id === 'fe_so4')!;
    assert.equal(feso4.color, '#86EFAC', 'Iron(II) sulfate solution must be pale green (#86EFAC)');

    const fecl3 = registry.find((r) => r.id === 'fecl3')!;
    assert.equal(fecl3.color, '#D97706', 'Iron(III) chloride solution must be yellow-brown (#D97706)');

    const iodine = registry.find((r) => r.id === 'iodine_solution')!;
    assert.equal(iodine.color, '#92400E', 'Aqueous iodine solution must be amber-brown (#92400E)');

    const cuMetal = registry.find((r) => r.id === 'cu')!;
    assert.equal(cuMetal.color, '#B87333', 'Copper metal must have reddish-brown metallic colour (#B87333)');

    // 3. Effervescence in liquids must NOT produce airborne smoke (producesFumesAboveLiquid === false)
    const effervescenceIds = [
      'acid_metal',
      'acid_zinc',
      'acid_carbonate',
      'vinegar_baking_soda',
      'hcl_nahco3_gas',
      'elephant_toothpaste',
      'hcl_fe_gas',
      'h2so4_zn_gas',
    ];
    for (const rxId of effervescenceIds) {
      const rx = REACTIONS.find((r) => r.id === rxId)!;
      assert.ok(rx, `Reaction ${rxId} must exist`);
      assert.equal(rx.observableEffects.producesGas, true, `${rxId} must produce gas bubbles`);
      assert.equal(
        rx.observableEffects.producesFumesAboveLiquid,
        false,
        `${rxId} is liquid-phase effervescence and must NOT produce airborne smoke`
      );
    }

    // 4. Genuine airborne fumes (Cu + HNO3 brown NO2 gas, HCl + NH3 white NH4Cl smoke) must have producesFumesAboveLiquid: true
    const cuHno3 = REACTIONS.find((r) => r.id === 'cu_hno3_oxidation')!;
    assert.equal(cuHno3.observableEffects.producesFumesAboveLiquid, true);
    assert.equal(cuHno3.observableEffects.fumeColor, '#9A3412');

    const alkaliExp = REACTIONS.find((r) => r.id === 'alkali_explosion')!;
    assert.equal(alkaliExp.observableEffects.producesFumesAboveLiquid, true);
    assert.equal(alkaliExp.observableEffects.fumeColor, '#F8FAFC');

    // 5. Newly audited & added reactions (Fe(OH)3, Fe(OH)2, Sulfur ppt, KMnO4 redox, Iodine + Thiosulfate)
    const feoh3 = evaluateReactionRecipe({
      ingredients: [
        { id: 'fecl3', amount: 15 },
        { id: 'naoh', amount: 15 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(feoh3.isSupported, true);
    assert.equal(feoh3.observableEffects?.producesPrecipitate, true);
    assert.equal(feoh3.observableEffects?.precipitateColor, '#9A3412');

    const feoh2 = evaluateReactionRecipe({
      ingredients: [
        { id: 'fe_so4', amount: 15 },
        { id: 'naoh', amount: 15 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(feoh2.isSupported, true);
    assert.equal(feoh2.observableEffects?.producesPrecipitate, true);
    assert.equal(feoh2.observableEffects?.precipitateColor, '#15803D');
    assert.equal(feoh2.observableEffects?.isFinalSolutionColorless, true);

    const sulfurPpt = evaluateReactionRecipe({
      ingredients: [
        { id: 'na2s2o3', amount: 15 },
        { id: 'hcl', amount: 15 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(sulfurPpt.isSupported, true);
    assert.equal(sulfurPpt.observableEffects?.producesPrecipitate, true);
    assert.equal(sulfurPpt.observableEffects?.precipitateColor, '#FACC15');

    const kmno4Redox = evaluateReactionRecipe({
      ingredients: [
        { id: 'kmn_o4_reagent', amount: 15 },
        { id: 'fe_so4', amount: 15 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(kmno4Redox.isSupported, true);
    assert.equal(kmno4Redox.observableEffects?.colorChangeTo, '#F59E0B');

    const iodineRedox = evaluateReactionRecipe({
      ingredients: [
        { id: 'iodine_solution', amount: 15 },
        { id: 'na2s2o3', amount: 15 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.equal(iodineRedox.isSupported, true);
    assert.equal(iodineRedox.observableEffects?.isFinalSolutionColorless, true);

    // 6. All reactions have initialAppearance and finalAppearance metadata
    for (const rx of REACTIONS) {
      assert.ok(rx.observableEffects.initialAppearance, `Reaction ${rx.id} must define initialAppearance`);
      assert.ok(rx.observableEffects.finalAppearance, `Reaction ${rx.id} must define finalAppearance`);
    }
  });
});

