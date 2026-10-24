import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  resolveAiChemistryAssistantQuery,
  extractCanonicalCompoundsFromQuery,
} from '../utils/aiChemistryAssistantResolver';
import { discoverReactions } from '../data/reactionDiscoveryEngine';
import { evaluateReactionRecipe, REACTIONS } from '../data/reactionsData';
import { findOrLookupCompound, getCanonicalRegistry } from '../data/compoundRegistry';

test('TECH-ANATOMIX — Unified Chemistry AI Assistant Verification Suite', async (t) => {
  await t.test('A. CHATBOX CONSOLIDATION: ChemistryLabPage renders one unified assistant without duplicate competing chatboxes', () => {
    const pagePath = path.resolve(process.cwd(), 'src/pages/ChemistryLabPage.tsx');
    const pageSource = fs.readFileSync(pagePath, 'utf8');

    // Must render ReactionAiChatbot
    assert.ok(
      pageSource.includes('<ReactionAiChatbot'),
      'ChemistryLabPage must render the unified ReactionAiChatbot component'
    );
    // Must NOT render competing ReactionDiscoveryPanel
    assert.strictEqual(
      pageSource.includes('<ReactionDiscoveryPanel'),
      false,
      'ChemistryLabPage must not render a second competing ReactionDiscoveryPanel chatbox'
    );

    // Unified ReactionAiChatbot must include both reaction discovery shortcuts and Q&A capabilities
    const chatbotPath = path.resolve(process.cwd(), 'src/components/chemistry/ReactionAiChatbot.tsx');
    const chatbotSource = fs.readFileSync(chatbotPath, 'utf8');
    assert.ok(
      chatbotSource.includes('Unified AI Chemistry & Reaction Assistant'),
      'Unified assistant header must be present'
    );
    assert.ok(
      chatbotSource.includes('Load Reaction into Experiment'),
      'Unified assistant must retain direct Load Reaction into Experiment capability'
    );
    assert.ok(
      chatbotSource.includes('Run Supported Reaction'),
      'Unified assistant must retain Run Supported Reaction capability'
    );
  });

  await t.test('B1. CUSTOM REACTIONS (NO UNRELATED PRESETS): Lead(II) nitrate + Potassium iodide and Oxalic acid + KMnO4', () => {
    // 1. Lead(II) nitrate + potassium iodide
    const q1 = 'What happens when lead(II) nitrate reacts with potassium iodide?';
    const res1 = resolveAiChemistryAssistantQuery(q1);

    assert.strictEqual(res1.userIntent, 'reaction_explanation');
    assert.strictEqual(res1.reactionSupportClassification, 'validated_simulator_reaction');
    assert.strictEqual(res1.isSimulatorExecutable, true);
    assert.ok(res1.matchedReaction, 'Must match Golden Rain reaction');
    assert.strictEqual(res1.matchedReaction?.id, 'golden_rain_ppt');
    assert.ok(
      res1.replyMarkdown.includes('Pb(NO₃)₂(aq) + 2KI(aq) → PbI₂(s)↓ + 2KNO₃(aq)'),
      'Must include balanced equation for Pb(NO3)2 + KI'
    );
    assert.strictEqual(
      res1.discoveryOptions.some((o) => o.id === 'vinegar_baking_soda'),
      false,
      'Must NEVER return unrelated vinegar + baking soda preset for Pb(NO3)2 + KI'
    );

    // Verify discoverReactions also returns ONLY golden_rain_ppt and not 4 unrelated defaults
    const disc1 = discoverReactions(q1);
    assert.strictEqual(disc1.options.length, 1);
    assert.strictEqual(disc1.options[0].id, 'golden_rain_ppt');

    // 2. Oxalic acid + potassium permanganate in acidic medium
    const q2 = 'Explain the reaction between oxalic acid and potassium permanganate in acidic medium';
    const res2 = resolveAiChemistryAssistantQuery(q2);

    assert.strictEqual(res2.userIntent, 'reaction_explanation');
    assert.strictEqual(res2.reactionSupportClassification, 'validated_simulator_reaction');
    assert.strictEqual(res2.isSimulatorExecutable, true);
    assert.ok(res2.matchedReaction, 'Must match KMnO4 + Oxalic Acid redox reaction');
    assert.strictEqual(res2.matchedReaction?.id, 'kmno4_oxalic_acid_redox');
    assert.ok(
      res2.replyMarkdown.includes('2MnO₄⁻(aq)') && res2.replyMarkdown.includes('10CO₂(g)↑'),
      'Must include balanced equation for KMnO4 + Oxalic acid'
    );
  });

  await t.test('B2. FIVE REACTION SUPPORT CASES: Validated Simulator vs Known Non-Simulator vs No Reaction vs Restricted vs Ambiguous', () => {
    // Case 2: Scientifically known reaction NOT executable in 3D simulator (Fischer Esterification)
    const esterQuery = 'What happens when acetic acid reacts with ethanol?';
    const esterRes = resolveAiChemistryAssistantQuery(esterQuery);
    assert.strictEqual(esterRes.reactionSupportClassification, 'known_non_simulator_reaction');
    assert.strictEqual(esterRes.isSimulatorExecutable, false);
    assert.ok(
      esterRes.replyMarkdown.includes('Not currently executable in the 3D beaker simulator'),
      'Case 2 must explicitly state it is not executable in the 3D beaker simulator'
    );
    assert.ok(
      esterRes.replyMarkdown.includes('CH₃COOCH₂CH₃'),
      'Case 2 must still explain the scientifically accurate ester product and equation'
    );

    // Case 3A: No Reaction Under Standard Conditions (Copper + Hydrochloric Acid)
    const noRxMetal = resolveAiChemistryAssistantQuery(
      'What happens when copper is added to hydrochloric acid?'
    );
    assert.strictEqual(noRxMetal.reactionSupportClassification, 'no_reaction_standard_conditions');
    assert.strictEqual(noRxMetal.isSimulatorExecutable, false);
    assert.ok(
      noRxMetal.replyMarkdown.includes('below hydrogen') ||
        noRxMetal.replyMarkdown.includes('No Reaction Under Standard'),
      'Case 3 must explain why Cu does not displace H2 from HCl'
    );
    // And discoverReactions must return 0 options, never 4 unrelated presets
    const discNoRx = discoverReactions('What happens when copper is added to hydrochloric acid?');
    assert.strictEqual(discNoRx.options.length, 0, 'Must not return unrelated preset reactions for Cu + HCl');

    // Case 3B: No Reaction Between Two Soluble Salts (Sodium Chloride + Potassium Nitrate)
    const noRxSalts = resolveAiChemistryAssistantQuery(
      'Does sodium chloride react with potassium nitrate?'
    );
    assert.strictEqual(noRxSalts.reactionSupportClassification, 'no_reaction_standard_conditions');
    assert.strictEqual(noRxSalts.isSimulatorExecutable, false);
    assert.ok(noRxSalts.replyMarkdown.includes('spectator ions'));

    // Case 4: Restricted Hazardous / Radioactive Combination (Hydrofluoric Acid + Sodium Hydroxide)
    const restrictedRes = resolveAiChemistryAssistantQuery(
      'What happens when hydrofluoric acid reacts with sodium hydroxide?'
    );
    assert.strictEqual(restrictedRes.reactionSupportClassification, 'restricted_combination');
    assert.strictEqual(restrictedRes.hasRestrictedCompound, true);
    assert.strictEqual(restrictedRes.isSimulatorExecutable, false);

    // Case 5A: Ambiguous Chemical Name ("iron chloride + sodium hydroxide")
    const ambigRes = resolveAiChemistryAssistantQuery(
      'What happens when iron chloride reacts with sodium hydroxide?'
    );
    assert.strictEqual(ambigRes.userIntent, 'ambiguous_query');
    assert.strictEqual(ambigRes.reactionSupportClassification, 'ambiguous_or_insufficient');
    assert.ok(ambigRes.ambiguousCandidates.length >= 2, 'Must return both FeCl2 and FeCl3 candidates');
    assert.ok(
      ambigRes.replyMarkdown.includes('Fe(OH)₂') && ambigRes.replyMarkdown.includes('Fe(OH)₃'),
      'Must explain both Iron(II) green and Iron(III) reddish-brown hydroxide outcomes'
    );

    // Case 5B: Insufficiently Specified Reaction ("What happens when hydrochloric acid reacts?")
    const insuffRes = resolveAiChemistryAssistantQuery(
      'What happens when hydrochloric acid reacts?'
    );
    assert.strictEqual(insuffRes.userIntent, 'insufficient_info');
    assert.strictEqual(insuffRes.reactionSupportClassification, 'ambiguous_or_insufficient');
    assert.ok(insuffRes.discoveryOptions.length > 0, 'Should offer supported HCl reactions to choose from');
  });

  await t.test('C. CANONICAL REGISTRY LOOKUP ACROSS ALL 7 CATEGORIES: Names, Synonyms, and Formulas', () => {
    const registry = getCanonicalRegistry();
    assert.ok(registry.length >= 850, `Canonical registry must contain all 854 compounds (found ${registry.length})`);

    const queries = [
      { q: 'Tell me about Carbolic acid', expectedId: 'phenol_carbolic_acid', expectedCat: 'acid' },
      { q: 'What is Slaked lime?', expectedId: 'ca_oh2', expectedCat: 'base' },
      { q: 'Properties of Baking soda', expectedId: 'nahco3', expectedCat: 'salt' },
      { q: 'Tell me about Magnesium ribbon', expectedId: 'mg', expectedCat: 'metal' },
      { q: 'What is Potassium permanganate?', expectedId: 'kmn_o4_reagent', expectedCat: 'reagent' },
      { q: 'Tell me about Ferroin indicator', expectedId: 'ferroin', expectedCat: 'indicator' },
      { q: 'What is Ziegler-Natta catalyst?', expectedId: 'ziegler_natta', expectedCat: 'catalyst' },
    ];

    for (const item of queries) {
      const res = resolveAiChemistryAssistantQuery(item.q);
      assert.ok(
        res.matchedCompounds.some((c) => c.id === item.expectedId),
        `Query "${item.q}" must resolve canonical ID "${item.expectedId}"`
      );
    }
  });

  await t.test('D. LAB OPERATIONS & LIVE BEAKER SYNCHRONIZATION: Discovery, Loading, Running, and Beaker Context', () => {
    // 1. Reaction Discovery via Unified Assistant
    const discRes = resolveAiChemistryAssistantQuery(
      'Find a reaction in which effervescence occurs.'
    );
    assert.strictEqual(discRes.userIntent, 'reaction_discovery');
    assert.strictEqual(discRes.discoveryOptions.length, 4);

    // 2. Simulate loading a discovered reaction into the beaker
    const chosenCard = discRes.discoveryOptions[0];
    const beakerIngredients = chosenCard.reactants.map((r) => ({
      id: r.id,
      amount: r.amount,
      name: r.name,
      formula: r.formula,
    }));
    const beakerConditions = {
      temperature: 25,
      concentration: 1.0,
      catalystId: chosenCard.catalystId || null,
    };

    // 3. Ask unified assistant about current beaker contents
    const beakerAsk = resolveAiChemistryAssistantQuery(
      'Explain what will happen with the current beaker contents',
      {
        selectedIngredients: beakerIngredients,
        conditions: beakerConditions,
      }
    );
    assert.strictEqual(beakerAsk.userIntent, 'beaker_inquiry');
    assert.strictEqual(beakerAsk.reactionSupportClassification, 'validated_simulator_reaction');
    assert.strictEqual(beakerAsk.isSimulatorExecutable, true);
    assert.strictEqual(beakerAsk.matchedReaction?.id, chosenCard.id);

    // 4. Evaluate and run the loaded reaction in the reaction engine
    const runResult = evaluateReactionRecipe({
      ingredients: beakerIngredients,
      conditions: beakerConditions,
    });
    assert.strictEqual(runResult.isSupported, true);
    assert.strictEqual(runResult.status, 'ready');
    assert.strictEqual(runResult.reaction?.id, chosenCard.id);
  });
});
