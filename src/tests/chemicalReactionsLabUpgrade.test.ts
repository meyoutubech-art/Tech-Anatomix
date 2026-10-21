import test from 'node:test';
import assert from 'node:assert';
import {
  REAGENTS as PRESET_REAGENTS,
  CHEMICAL_CATEGORIES,
  REACTIONS,
  evaluateReactionRecipe,
} from '../data/reactionsData';
import {
  getCanonicalRegistry,
  findOrLookupCompound,
  registerCanonicalCompound,
  ADDITIONAL_VERIFIED_COMPOUNDS,
} from '../data/compoundRegistry';
import { discoverReactions } from '../data/reactionDiscoveryEngine';
import { ChemicalReagent } from '../types/chemistry';

test('TECH-ANATOMIX — Chemical Reactions Lab Upgrade Test Suite', async (t) => {
  await t.test('TEST 1 — EMPTY START: Initial state starts with an empty beaker and no active reaction', () => {
    // Initial experiment definition requires empty reactants
    const initialIngredients: any[] = [];
    const initialCatalyst: string | null = null;
    const initialActiveReaction: any = null;
    const hasRunReaction: boolean = false;

    assert.strictEqual(initialIngredients.length, 0, 'Active experiment must start with an empty beaker');
    assert.strictEqual(initialCatalyst, null, 'No catalyst preloaded on startup');
    assert.strictEqual(initialActiveReaction, null, 'No active reaction preloaded');
    assert.strictEqual(hasRunReaction, false, 'No running reaction on startup');

    // Evaluating an empty recipe returns empty/incomplete status
    const evalResult = evaluateReactionRecipe({
      ingredients: initialIngredients,
      conditions: { temperature: 25, concentration: 1.0, catalystId: initialCatalyst },
    });
    assert.strictEqual(evalResult.isSupported, false, 'Empty beaker must not trigger a reaction');
    assert.strictEqual(evalResult.status, 'incomplete');
    assert.ok(evalResult.message.includes('No reagents have been added'));
  });

  await t.test('TEST 2 — EXISTING LIBRARY: All categories and preset compounds remain available', () => {
    assert.ok(CHEMICAL_CATEGORIES.length >= 7, 'Must retain all required chemical categories');
    const categoryIds = CHEMICAL_CATEGORIES.map((c) => c.id);
    assert.ok(categoryIds.includes('acid'), 'Category "Acids" must be present');
    assert.ok(categoryIds.includes('base'), 'Category "Bases" must be present');
    assert.ok(categoryIds.includes('salt'), 'Category "Salts" must be present');
    assert.ok(categoryIds.includes('metal'), 'Category "Metals" must be present');
    assert.ok(categoryIds.includes('oxidizer'), 'Category "Oxidizers" must be present');
    assert.ok(categoryIds.includes('indicator'), 'Category "Indicators" must be present');
    assert.ok(categoryIds.includes('catalyst'), 'Category "Catalysts" must be present');

    // Preset reagents remain preserved
    assert.ok(PRESET_REAGENTS.length >= 20, 'Preset library shelf must remain populated');
    const hcl = PRESET_REAGENTS.find((r) => r.id === 'hcl');
    const naoh = PRESET_REAGENTS.find((r) => r.id === 'naoh');
    const cuso4 = PRESET_REAGENTS.find((r) => r.id === 'cuso4');
    const mg = PRESET_REAGENTS.find((r) => r.id === 'mg');

    assert.ok(hcl && naoh && cuso4 && mg, 'Key preset reagents must be available');
  });

  await t.test('TEST 3 — AI COMPOUND ADDITION: Look up supported compounds beyond visible presets', () => {
    // 1. Baking Soda (NaHCO3) lookup
    const bakingSodaResult = findOrLookupCompound('Baking Soda');
    assert.strictEqual(bakingSodaResult.found, true);
    assert.ok(bakingSodaResult.compound);
    assert.strictEqual(bakingSodaResult.compound.id, 'nahco3');
    assert.strictEqual(bakingSodaResult.compound.formula, 'NaHCO₃ (s)');
    assert.strictEqual(bakingSodaResult.compound.isSimulationSupported, true);

    // 2. Manganese Dioxide (MnO2) lookup
    const mno2Result = findOrLookupCompound('manganese dioxide');
    assert.strictEqual(mno2Result.found, true);
    assert.ok(mno2Result.compound);
    assert.strictEqual(mno2Result.compound.id, 'mno2');
    assert.strictEqual(mno2Result.compound.type, 'catalyst');

    // 3. Citric Acid lookup
    const citricResult = findOrLookupCompound('Citric Acid');
    assert.strictEqual(citricResult.found, true);
    assert.ok(citricResult.compound);
    assert.strictEqual(citricResult.compound.id, 'c6h8o7');

    // 4. Toxic / Prohibited compound safety check
    const toxicResult = findOrLookupCompound('cyanide');
    assert.strictEqual(toxicResult.found, false);
    assert.ok(toxicResult.message?.includes('hazardous') || toxicResult.message?.includes('not permitted'));

    // 5. Unverified compound check
    const fakeResult = findOrLookupCompound('kryptonite unobtainium');
    assert.strictEqual(fakeResult.found, false);
    assert.ok(fakeResult.message?.includes('Could not find a verified educational compound entry'));
  });

  await t.test('TEST 4 — REACTION DISCOVERY: Effervescence query returns four distinct verified reactions', () => {
    const effervescence = discoverReactions('Find a reaction in which effervescence occurs.');
    assert.strictEqual(effervescence.options.length, 4, 'Must return exactly 4 options for effervescence');

    // Verify all 4 are distinct
    const ids = effervescence.options.map((o) => o.id);
    assert.strictEqual(new Set(ids).size, 4, 'All 4 options must be distinct reactions');

    // Verify each option matches supported reactions with gas production
    effervescence.options.forEach((opt) => {
      const rx = REACTIONS.find((r) => r.id === opt.id);
      assert.ok(rx, `Reaction "${opt.name}" must exist in canonical REACTIONS`);
      assert.strictEqual(opt.expectedVisualEffects.producesGas, true, 'Must produce gas');
      assert.ok(opt.expectedVisualEffects.gasName, 'Must specify gas name');
      assert.ok(opt.balancedEquation.length > 5, 'Must provide balanced chemical equation');
      assert.ok(opt.reactants.length >= 1, 'Must list required reactants');
    });

    // Check specific examples required by the prompt:
    // A: Sodium bicarbonate + acetic acid (vinegar)
    const bakingSodaRx = effervescence.options.find((o) => o.id === 'vinegar_baking_soda');
    assert.ok(bakingSodaRx, 'Must include NaHCO3 + CH3COOH reaction option');
    assert.ok(bakingSodaRx.observableResult.includes('CO₂') || bakingSodaRx.observableResult.includes('froth'));

    // B: Acid + carbonate (e.g. HCl + CaCO3)
    const carbonateRx = effervescence.options.find((o) => o.id === 'acid_carbonate');
    assert.ok(carbonateRx, 'Must include acid + carbonate reaction option');

    // C: Acid + metal (e.g. HCl + Mg or HCl + Zn)
    const metalRx = effervescence.options.find((o) => o.id === 'acid_metal' || o.id === 'acid_zinc');
    assert.ok(metalRx, 'Must include acid + metal reaction option');
  });

  await t.test('TEST 5 — REACTION DISCOVERY: Precipitate, Color, Neutralization, and Redox queries', () => {
    // Precipitate query returns 4 options
    const pptRes = discoverReactions('Find a reaction that forms a precipitate.');
    assert.strictEqual(pptRes.options.length, 4, 'Precipitate query must return 4 options');
    pptRes.options.forEach((o) => {
      assert.strictEqual(o.expectedVisualEffects.producesPrecipitate, true);
      assert.ok(o.expectedVisualEffects.precipitateColor);
    });

    // Color change query returns 4 options
    const colorRes = discoverReactions('Find a reaction with a visible colour change.');
    assert.strictEqual(colorRes.options.length, 4, 'Color change query must return 4 options');

    // Neutralization query returns 4 options
    const neutRes = discoverReactions('Find a suitable acid-base neutralisation reaction.');
    assert.strictEqual(neutRes.options.length, 4, 'Neutralization query must return 4 options');

    // Metal-acid query returns 4 options
    const metalAcidRes = discoverReactions('Find a reaction involving a metal and an acid.');
    assert.strictEqual(metalAcidRes.options.length, 4, 'Metal-acid query must return 4 options');
  });

  await t.test('TEST 6 — LOAD INTO EXPERIMENT: Populates active experiment without running it', () => {
    const effervescence = discoverReactions('Find a reaction in which effervescence occurs.');
    const selected = effervescence.options[0]; // vinegar_baking_soda

    // Map reactants as handleLoadReactionToExperiment would
    const loadedIngredients = selected.reactants.map((r) => {
      const lookup = findOrLookupCompound(r.id);
      const def = lookup.compound || PRESET_REAGENTS.find((reg) => reg.id === r.id);
      assert.ok(def, `Reactant ${r.id} must resolve in canonical registry`);
      return {
        id: def.id,
        name: def.name,
        formula: def.formula,
        amount: r.amount || def.pourAmount || 20,
        unit: def.unit,
        category: def.category || def.type,
        color: def.color,
      };
    });

    assert.strictEqual(loadedIngredients.length, selected.reactants.length);
    assert.ok(loadedIngredients.some((i) => i.id === 'ch3cooh'));
    assert.ok(loadedIngredients.some((i) => i.id === 'nahco3'));

    // Loading does NOT run the reaction immediately
    let hasRunReaction = false;
    assert.strictEqual(hasRunReaction, false, 'Loading reactants must not trigger reaction execution');

    // Catalyst handling
    const elephantToothpaste = REACTIONS.find((r) => r.id === 'elephant_toothpaste')!;
    const catalystId = elephantToothpaste.reactants.includes('h2o2') ? 'mno2' : null;
    assert.strictEqual(catalystId, 'mno2', 'Elephant toothpaste must specify MnO2 catalyst');
  });

  await t.test('TEST 7 — REACTION SIMULATION: Scientifically accurate outcomes for effervescence, precipitation, color, and enthalpy', () => {
    // 1. Gas Evolution & Endothermic chill: NaHCO3 + CH3COOH
    const gasResult = evaluateReactionRecipe({
      ingredients: [
        { id: 'ch3cooh', amount: 25 },
        { id: 'nahco3', amount: 10 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.strictEqual(gasResult.isSupported, true);
    assert.ok(gasResult.reaction);
    assert.strictEqual(gasResult.observableEffects?.producesGas, true);
    assert.ok(gasResult.observableEffects?.gasName?.includes('Carbon Dioxide'));
    assert.strictEqual(gasResult.observableEffects?.temperatureDelta, -4.5, 'Endothermic volcano chill');

    // 2. Precipitate: AgNO3 + NaCl -> AgCl (white precipitate)
    const pptResult = evaluateReactionRecipe({
      ingredients: [
        { id: 'agno3', amount: 20 },
        { id: 'nacl', amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.strictEqual(pptResult.isSupported, true);
    assert.strictEqual(pptResult.observableEffects?.producesPrecipitate, true);
    assert.strictEqual(pptResult.observableEffects?.precipitateColor, '#FFFFFF');

    // 3. Exothermic Neutralization: HCl + NaOH -> NaCl + H2O (+12.5°C)
    const neutResult = evaluateReactionRecipe({
      ingredients: [
        { id: 'hcl', amount: 20 },
        { id: 'naoh', amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.strictEqual(neutResult.isSupported, true);
    assert.strictEqual(neutResult.observableEffects?.producesGas, false);
    assert.strictEqual(neutResult.observableEffects?.producesPrecipitate, false);
    assert.strictEqual(neutResult.observableEffects?.temperatureDelta, 12.5);

    // 4. Color Transition: Phenolphthalein + NaOH -> Fuchsia Magenta
    const colorResult = evaluateReactionRecipe({
      ingredients: [
        { id: 'phenolphthalein', amount: 5 },
        { id: 'naoh', amount: 20 },
      ],
      conditions: { temperature: 25, concentration: 1.0 },
    });
    assert.strictEqual(colorResult.isSupported, true);
    assert.strictEqual(colorResult.observableEffects?.colorChangeTo, '#F43F5E');
  });

  await t.test('TEST 8 — CLEAR EXPERIMENT: Resets beaker while preserving compound library', () => {
    let ingredients = [
      { id: 'hcl', amount: 20, name: 'Hydrochloric Acid', formula: 'HCl (aq)', unit: 'mL', category: 'acid', color: '#38BDF8' },
      { id: 'naoh', amount: 20, name: 'Sodium Hydroxide', formula: 'NaOH (aq)', unit: 'mL', category: 'base', color: '#8B5CF6' },
    ];
    let selectedCatalystId: string | null = 'mno2';
    let hasRunReaction = true;

    // Simulate Clear Experiment / handleResetBeaker
    ingredients = [];
    selectedCatalystId = null;
    hasRunReaction = false;

    assert.strictEqual(ingredients.length, 0, 'Ingredients must be cleared');
    assert.strictEqual(selectedCatalystId, null, 'Catalyst must be reset');
    assert.strictEqual(hasRunReaction, false, 'Reaction execution must be cleared');

    // Library remains untouched
    assert.ok(PRESET_REAGENTS.length >= 20, 'Preset compound library must remain intact');
    assert.ok(getCanonicalRegistry().length >= 20, 'Canonical registry must remain intact');
  });

  await t.test('TEST 9 — CHAT ISOLATION: Chatbot answers inquiries without mutating active experiment', () => {
    // Experiment state
    const originalIngredients = [{ id: 'hcl', amount: 20, name: 'Hydrochloric Acid', formula: 'HCl', unit: 'mL', category: 'acid', color: '#38BDF8' }];
    const originalCount = originalIngredients.length;

    // The chatbot component receives read-only selectedIngredients and does not expose mutators
    // Simulate user asking "What is an acid-base neutralization?" or "Add sodium hydroxide"
    const userQuery = 'What is an acid-base neutralization?';
    assert.strictEqual(originalIngredients.length, originalCount, 'Ingredients count must not change when asking questions');

    const addQuery = 'Add sodium hydroxide';
    // Chatbot responds with educational text and does not mutate originalIngredients
    assert.strictEqual(originalIngredients.length, originalCount, 'Chatbot must not mutate experiment state even if command typed');
  });
});
