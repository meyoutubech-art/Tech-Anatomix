import { ChemicalReagent, ReactionDefinition } from '../types/chemistry';
import {
  getCanonicalRegistry,
  findOrLookupCompound,
} from '../data/compoundRegistry';
import {
  evaluateReactionRecipe,
  REACTIONS,
  getReagentDisplayInfo,
} from '../data/reactionsData';

function normalizeFormula(str: string): string {
  const subMap: Record<string, string> = {
    '₀': '0',
    '₁': '1',
    '₂': '2',
    '₃': '3',
    '₄': '4',
    '₅': '5',
    '₆': '6',
    '₇': '7',
    '₈': '8',
    '₉': '9',
    '⁺': '+',
    '⁻': '-',
    '–': '-',
    '—': '-',
    '’': "'",
    '‘': "'",
  };
  return str.replace(/[₀₁₂₃₄₅₆₇₈₉⁺⁻–—’‘]/g, (ch) => subMap[ch] || ch);
}

export interface AiAssistantResolution {
  queryType:
    | 'mutation_guard'
    | 'beaker_evaluation'
    | 'single_compound'
    | 'multi_compound_reaction'
    | 'ambiguous_compound'
    | 'general_theory';
  replyMarkdown: string;
  matchedCompounds: ChemicalReagent[];
  ambiguousCandidates: ChemicalReagent[];
  matchedReaction?: ReactionDefinition;
  suggestedReactions: ReactionDefinition[];
  isSimulatorExecutable: boolean;
  hasRestrictedCompound: boolean;
}

const STOP_WORDS = new Set([
  'what',
  'is',
  'are',
  'the',
  'a',
  'an',
  'in',
  'of',
  'to',
  'for',
  'with',
  'and',
  'or',
  'when',
  'how',
  'why',
  'does',
  'do',
  'will',
  'happen',
  'happens',
  'react',
  'reacts',
  'reaction',
  'between',
  'mixed',
  'mixing',
  'combine',
  'combined',
  'tell',
  'me',
  'about',
  'explain',
  'describe',
  'properties',
  'role',
  'use',
  'used',
  'can',
  'you',
  'show',
  'give',
  'if',
  'we',
  'i',
  'put',
  'together',
  'solution',
  'aqueous',
  'solid',
  'gas',
  'liquid',
]);

function stripStateSuffix(formula: string): string {
  return normalizeFormula(formula).replace(/\((s|l|g|aq|g\/l|l\/g)\)/gi, '').trim();
}

/**
 * Extracts all canonical compounds mentioned in a free-text query across the entire
 * 22-page document inventory (Acids, Bases, Salts, Metals, Oxidizers, Indicators, Catalysts).
 */
export function extractCanonicalCompoundsFromQuery(queryText: string): {
  matched: ChemicalReagent[];
  ambiguous: ChemicalReagent[];
} {
  const registry = getCanonicalRegistry();
  const qNorm = normalizeFormula(queryText);
  const qLower = qNorm.toLowerCase();

  // 1. Check if the cleaned query (or segments split by '+' / 'and' / 'with') directly matches via findOrLookupCompound
  const cleanedPhrase = qLower
    .replace(
      /^(what\s+is|what\s+are|tell\s+me\s+about|explain|describe|what\s+happens\s+when|what\s+happens\s+if|reaction\s+of|reaction\s+between|properties\s+of|role\s+of)\s+/i,
      ''
    )
    .replace(/[?.!]+$/g, '')
    .trim();

  const segments = cleanedPhrase
    .split(/\s*(?:\+|\band\b|\bwith\b|\bplus\b|\bvs\.?\b|,)\s*/i)
    .map((s) =>
      s
        .replace(
          /^(reacting|mixing|combining|adding|if\s+i\s+mix|when\s+mixing|between)\s+/i,
          ''
        )
        .replace(/\s+(react|reacts|are\s+mixed|is\s+added|together).*$/i, '')
        .trim()
    )
    .filter((s) => s.length >= 2 && !STOP_WORDS.has(s));

  const matchedMap = new Map<string, ChemicalReagent>();
  const ambiguousMap = new Map<string, ChemicalReagent>();

  for (const seg of segments) {
    const segNorm = normalizeFormula(seg).toLowerCase();
    const directCandidates = registry.filter((r) => {
      const rName = normalizeFormula(r.name).toLowerCase();
      const rBase = rName.replace(/\s*\([^)]*\)/g, '').trim();
      const rForm = stripStateSuffix(r.formula).toLowerCase();
      if (
        rName === segNorm ||
        rBase === segNorm ||
        rForm === segNorm ||
        r.id.toLowerCase() === segNorm
      ) {
        return true;
      }
      if (r.aliases?.some((a) => normalizeFormula(a).toLowerCase() === segNorm)) {
        return true;
      }
      return false;
    });

    if (directCandidates.length === 1) {
      matchedMap.set(directCandidates[0].id, directCandidates[0]);
      continue;
    } else if (directCandidates.length > 1) {
      for (const c of directCandidates) {
        matchedMap.set(c.id, c);
        ambiguousMap.set(c.id, c);
      }
      continue;
    }

    if (segNorm.length >= 4 && !STOP_WORDS.has(segNorm)) {
      const partialMatches = registry.filter(
        (r) =>
          normalizeFormula(r.name).toLowerCase().includes(segNorm) ||
          r.aliases?.some((a) => normalizeFormula(a).toLowerCase().includes(segNorm))
      );
      if (partialMatches.length > 1 && partialMatches.length <= 6 && segments.length === 1) {
        for (const c of partialMatches) {
          ambiguousMap.set(c.id, c);
        }
      }
    }

    const lookedUp = findOrLookupCompound(seg);
    if (lookedUp.found && lookedUp.compound) {
      matchedMap.set(lookedUp.compound.id, lookedUp.compound);
    }
  }

  // 2. Scan full query text for exact canonical names, base names, aliases, and formulas
  const paddedQuery = ` ${qLower.replace(/[?,!.();:]/g, ' ')} `;

  interface PhraseCandidate {
    phrase: string;
    reagent: ChemicalReagent;
    isFormula: boolean;
  }

  const phraseCandidates: PhraseCandidate[] = [];
  for (const r of registry) {
    const fullName = normalizeFormula(r.name).toLowerCase();
    const baseName = fullName.replace(/\s*\([^)]*\)/g, '').trim();
    if (fullName.length >= 3) {
      phraseCandidates.push({ phrase: fullName, reagent: r, isFormula: false });
    }
    if (baseName.length >= 4 && baseName !== fullName) {
      phraseCandidates.push({ phrase: baseName, reagent: r, isFormula: false });
    }
    if (r.aliases) {
      for (const alias of r.aliases) {
        const aLower = normalizeFormula(alias).toLowerCase().trim();
        if (aLower.length >= 3 && !STOP_WORDS.has(aLower)) {
          phraseCandidates.push({ phrase: aLower, reagent: r, isFormula: false });
        }
      }
    }
    const cleanForm = stripStateSuffix(r.formula).toLowerCase();
    if (cleanForm.length >= 2 && !STOP_WORDS.has(cleanForm)) {
      phraseCandidates.push({ phrase: cleanForm, reagent: r, isFormula: true });
    }
  }

  phraseCandidates.sort((a, b) => b.phrase.length - a.phrase.length);

  for (const cand of phraseCandidates) {
    if (matchedMap.has(cand.reagent.id)) continue;
    if (cand.isFormula) {
      // Require word boundaries around formula tokens
      const escaped = cand.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|\\s|\\+|\\()${escaped}(?:$|\\s|\\+|\\)|\\?|\\.|,)`, 'i');
      if (regex.test(qNorm)) {
        matchedMap.set(cand.reagent.id, cand.reagent);
      }
    } else {
      if (paddedQuery.includes(` ${cand.phrase} `)) {
        matchedMap.set(cand.reagent.id, cand.reagent);
      }
    }
  }

  return {
    matched: Array.from(matchedMap.values()),
    ambiguous: Array.from(ambiguousMap.values()),
  };
}

function formatSingleCompoundResponse(
  reagent: ChemicalReagent,
  compatibleReactions: ReactionDefinition[]
): string {
  const statusBadge = reagent.isRestricted
    ? 'Restricted Reference Only (Safety Guard Active)'
    : reagent.visualLabStatus || (reagent.isSimulationSupported ? 'Reaction-supported' : 'Selectable');

  const lines: string[] = [
    `🧪 **${reagent.name}** (\`${reagent.formula}\`)`,
    `• **Category**: ${reagent.category.toUpperCase()}${reagent.subcategory ? ` — *${reagent.subcategory}*` : ''}`,
    `• **Physical State**: ${reagent.state.charAt(0).toUpperCase() + reagent.state.slice(1)}${reagent.concentration ? ` (${reagent.concentration})` : ''}`,
    `• **Visual Lab Status**: \`${statusBadge}\``,
  ];

  if (reagent.category === 'catalyst' || reagent.catalyticRole) {
    lines.push(`• **Catalytic Role**: ${reagent.catalyticRole || reagent.description}`);
    if (reagent.exampleReactions && reagent.exampleReactions.length > 0) {
      lines.push(`• **Typical Application**: \`${reagent.exampleReactions[0]}\``);
    }
    if (reagent.reactionConditions) {
      lines.push(`• **Conditions**: ${reagent.reactionConditions}`);
    }
  } else if (reagent.category === 'indicator' && reagent.indicatorTransition) {
    const t = reagent.indicatorTransition;
    lines.push(
      `• **Indicator Type**: ${t.indicatorType.toUpperCase()} Indicator (${t.transitionRange})`,
      `• **Color Transition**: Acidic: **${t.acidColor}**${t.neutralColor ? ` → Neutral: **${t.neutralColor}**` : ''} → Basic/Reduced: **${t.baseColor}**`
    );
  } else {
    lines.push(`• **Summary**: ${reagent.description}`);
  }

  if (reagent.formulaCorrectionNote) {
    lines.push(`• **Formula Verification Note**: ${reagent.formulaCorrectionNote}`);
  }

  if (reagent.isRestricted) {
    lines.push(
      `\n⚠️ **Safety & Restriction Notice**: ${
        reagent.restrictionReason ||
        reagent.safetyInfo ||
        'This substance is restricted due to extreme toxicity, reactivity, or radioactivity and cannot be mixed in the interactive beaker.'
      }`
    );
  } else if (reagent.safetyInfo) {
    lines.push(`• **Safety**: ${reagent.safetyInfo}`);
  }

  if (!reagent.isRestricted && compatibleReactions.length > 0) {
    lines.push(
      `\n**Supported Simulator Reactions (${compatibleReactions.length})**:`,
      ...compatibleReactions.slice(0, 4).map((rx) => {
        const partners = rx.reactants
          .filter((id) => id !== reagent.id)
          .map((id) => getReagentDisplayInfo(id).name)
          .join(' + ');
        return `• **With ${partners || 'Catalyst/Heat'}** → **${rx.name}** (\`${rx.balancedEquation}\`)`;
      })
    );
  }

  return lines.join('\n');
}

function evaluateConceptualMultiCompoundInteraction(
  compounds: ChemicalReagent[]
): string | null {
  const categories = compounds.map((c) => c.category);
  const hasAcid = compounds.find((c) => c.category === 'acid');
  const hasBase = compounds.find((c) => c.category === 'base');
  const hasIndicator = compounds.find((c) => c.category === 'indicator');
  const hasCatalyst = compounds.find(
    (c) => c.category === 'catalyst' || c.secondaryCategories?.includes('catalyst')
  );
  const hasMetal = compounds.find((c) => c.category === 'metal');
  const hasOxidizer = compounds.find((c) => c.category === 'oxidizer');
  const hasCarbonate = compounds.find(
    (c) =>
      c.name.toLowerCase().includes('carbonate') ||
      c.name.toLowerCase().includes('bicarbonate') ||
      c.formula.includes('CO₃')
  );

  if (hasIndicator && (hasAcid || hasBase)) {
    const target = hasAcid || hasBase!;
    const t = hasIndicator.indicatorTransition;
    const expectedColor = hasAcid
      ? t?.acidColor || 'Acidic indicator form'
      : t?.baseColor || 'Basic indicator form';
    return (
      `🎨 **Indicator Halochromic / Redox Response (${hasIndicator.name} + ${target.name})**:\n\n` +
      `• **Classification**: Indicator Transition (Supported in Visual Lab)\n` +
      `• **Indicator Range**: ${t?.transitionRange || 'pH-dependent'}\n` +
      `• **Expected Visual Observation**: Solution shifts to **${expectedColor}** in the presence of ${target.name} (\`${target.formula}\`).\n` +
      `• **Lab Action**: You can add both **${target.name}** and **${hasIndicator.name}** directly to the 3D Beaker to observe the color state.`
    );
  }

  if (hasAcid && hasCarbonate) {
    return (
      `🫧 **Acid–Carbonate Gas Evolution (${hasAcid.name} + ${hasCarbonate.name})**:\n\n` +
      `• **Classification**: Acid–Carbonate Neutralization & Decarboxylation\n` +
      `• **General Ionic Equation**: \`2H⁺(aq) + CO₃²⁻(aq) → H₂O(l) + CO₂(g)↑\`\n` +
      `• **Expected Observation**: Immediate brisk effervescence of colorless, odorless carbon dioxide gas (\`CO₂\`) accompanied by dissolution of the carbonate salt.\n` +
      `• **Lab Capability**: Both reagents can be added to the 3D Beaker; preset carbonate–acid pairs execute full 3D bubble animations.`
    );
  }

  if (hasAcid && hasBase) {
    return (
      `⚖️ **Acid–Base Neutralization (${hasAcid.name} + ${hasBase.name})**:\n\n` +
      `• **Classification**: Brønsted–Lowry Proton Transfer (Exothermic Neutralization)\n` +
      `• **Net Ionic Equation**: \`H⁺(aq) + OH⁻(aq) → H₂O(l)   (ΔH° ≈ -57.3 kJ/mol for strong acid/base)\`\n` +
      `• **Products**: Aqueous salt solution + Water (\`H₂O\`)\n` +
      `• **Expected Observation**: Rise in solution temperature and pH convergence toward neutral; add an indicator (such as Phenolphthalein or Bromothymol Blue) to visualize the endpoint.`
    );
  }

  if (hasAcid && hasMetal) {
    const nobleMetals = new Set(['au_metal', 'pt_metal', 'pt_wire', 'ag_metal', 'cu', 'hg_metal', 'ir_metal', 'pd_metal', 'rh_metal', 'ru_metal']);
    if (nobleMetals.has(hasMetal.id)) {
      return (
        `🔬 **Metal–Acid Compatibility (${hasMetal.name} + ${hasAcid.name})**:\n\n` +
        `• **Assessment**: **${hasMetal.name}** (\`${hasMetal.formula}\`) lies below hydrogen in the electrochemical activity series (*E°* > 0.00 V).\n` +
        `• **Outcome**: No hydrogen gas displacement occurs with non-oxidizing acids. Only strong oxidizing acids (such as concentrated \`HNO₃\` or *aqua regia*) can oxidize noble/coinage metals.`
      );
    }
    return (
      `⚡ **Single Displacement: Active Metal + Acid (${hasMetal.name} + ${hasAcid.name})**:\n\n` +
      `• **Classification**: Redox Single-Displacement Reaction\n` +
      `• **General Ionic Equation**: \`M(s) + 2H⁺(aq) → M²⁺(aq) + H₂(g)↑\`\n` +
      `• **Expected Observation**: Dissolution of metallic **${hasMetal.name}** with steady evolution of flammable hydrogen gas (\`H₂\`) bubbles and exothermic warming.`
    );
  }

  if (hasCatalyst) {
    const others = compounds.filter((c) => c.id !== hasCatalyst.id);
    const otherNames = others.map((c) => `${c.name} (${c.formula})`).join(' + ');
    return (
      `⚡ **Catalytic System Analysis (${otherNames} with ${hasCatalyst.name})**:\n\n` +
      `• **Catalyst**: **${hasCatalyst.name}** (\`${hasCatalyst.formula}\`)\n` +
      `• **Catalytic Role**: ${hasCatalyst.catalyticRole || hasCatalyst.description}\n` +
      (hasCatalyst.exampleReactions?.[0]
        ? `• **Reference Reaction**: \`${hasCatalyst.exampleReactions[0]}\`\n`
        : '') +
      (hasCatalyst.reactionConditions
        ? `• **Required Conditions**: ${hasCatalyst.reactionConditions}\n`
        : '') +
      `• **Simulator Note**: This catalytic pathway is documented as a verified curriculum/industrial reference. For live 3D beaker oxygen-evolution catalysis, combine **Hydrogen Peroxide (\`H₂O₂\`)** with **Manganese Dioxide (\`MnO₂\`)**, **Potassium Iodide (\`KI\`)**, or **Catalase**.`
    );
  }

  if (hasOxidizer && categories.length >= 2) {
    const partner = compounds.find((c) => c.id !== hasOxidizer.id)!;
    return (
      `🔥 **Redox Compatibility Assessment (${hasOxidizer.name} + ${partner.name})**:\n\n` +
      `• **Oxidizing Agent**: **${hasOxidizer.name}** (\`${hasOxidizer.formula}\`)\n` +
      `• **Co-Reagent**: **${partner.name}** (\`${partner.formula}\`)\n` +
      `• **Scientific Note**: Strong oxidizers undergo electron-transfer reactions with reducing agents, metals, or oxidizable organic substrates. Both compounds are selectable in the visual shelf; check the **Discover a Reaction** panel for supported 3D redox simulations.`
    );
  }

  return null;
}

export function resolveAiChemistryAssistantQuery(
  query: string,
  context?: {
    selectedIngredients?: Array<{ id: string; amount: number; name: string; formula: string }>;
    conditions?: { temperature: number; concentration: number; catalystId?: string | null };
  }
): AiAssistantResolution {
  const q = query.toLowerCase().trim();
  const selectedIngredients = context?.selectedIngredients || [];
  const conditions = context?.conditions || { temperature: 25, concentration: 1.0, catalystId: null };

  // 1. Direct mutation command guard (preserves Chat Isolation test)
  const isMutationIntent =
    q.startsWith('add ') ||
    q.startsWith('pour ') ||
    q.startsWith('put ') ||
    q.startsWith('mix ') ||
    q.startsWith('remove ') ||
    q.startsWith('delete ') ||
    q.includes('clear experiment') ||
    q.includes('empty beaker') ||
    q === 'run' ||
    q === 'run reaction' ||
    q === 'start reaction' ||
    q === 'execute' ||
    (q.includes('change temperature') && /\d+/.test(q)) ||
    (q.includes('set concentration') && /\d+/.test(q));

  if (isMutationIntent) {
    return {
      queryType: 'mutation_guard',
      replyMarkdown:
        'ℹ️ **Educational Assistant Notice**: I am a read-only scientific educational advisor and do not automatically mutate your experiment bench from text commands.\n\n' +
        '• **To add compounds**: Click any compound card on the **Reagent Shelf**, use **AI-Assisted Compound Addition**, or click the **+ Add to Beaker** action buttons below my chemical explanations.\n' +
        '• **To discover full recipes**: Use the **"Discover a Reaction"** panel above.\n' +
        '• **To run the reaction**: Click **"Run Reaction in 3D Beaker"** in the Experiment Builder!',
      matchedCompounds: [],
      ambiguousCandidates: [],
      suggestedReactions: [],
      isSimulatorExecutable: false,
      hasRestrictedCompound: false,
    };
  }

  const { matched, ambiguous } = extractCanonicalCompoundsFromQuery(query);

  // 2. Check if query is asking about current beaker state
  const isExplicitBeakerQuery =
    q.includes('current') ||
    q.includes('my beaker') ||
    q.includes('beaker contents') ||
    q.includes('this experiment') ||
    q.includes('selected reagents') ||
    q.includes('selected chemicals') ||
    q.includes('in the beaker') ||
    q.includes('this mixture');

  const isImplicitBeakerQuery =
    selectedIngredients.length > 0 &&
    matched.length === 0 &&
    (q.includes('what happens') ||
      q.includes('what will happen') ||
      q.includes('will these react') ||
      q.includes('will they react') ||
      q.includes('do these react') ||
      q.includes('what are the products') ||
      q.includes('balanced equation') ||
      q.includes('why didn') ||
      q.includes('why do they not') ||
      q.includes('what can i react') ||
      q.includes('what should i add') ||
      q.includes('suggest a reaction'));

  if (isExplicitBeakerQuery || isImplicitBeakerQuery) {
    if (selectedIngredients.length === 0) {
      return {
        queryType: 'beaker_evaluation',
        replyMarkdown:
          '🧪 **Current Beaker Snapshot**: The reaction beaker is currently **empty**.\n\n' +
          'Select reagents from any of the 7 categories (Acids, Bases, Salts & Solutions, Metals, Oxidizers, Indicators, Catalysts) or ask me about any compound from the 22-page chemistry inventory!',
        matchedCompounds: [],
        ambiguousCandidates: [],
        suggestedReactions: [],
        isSimulatorExecutable: false,
        hasRestrictedCompound: false,
      };
    }

    const evalRes = evaluateReactionRecipe({
      ingredients: selectedIngredients,
      conditions,
    });

    const ingredientsSummary = selectedIngredients
      .map((i) => `${i.name} (${i.formula}, ${i.amount} mL/g)`)
      .join(' + ');

    if (evalRes.isSupported && evalRes.reaction && evalRes.status === 'ready') {
      const r = evalRes.reaction;
      return {
        queryType: 'beaker_evaluation',
        replyMarkdown:
          `🔬 **Scientific Evaluation for Current Beaker (${ingredientsSummary} at ${conditions.temperature}°C, ${conditions.concentration.toFixed(1)} M)**:\n\n` +
          `• **Status**: \`${evalRes.structuredStatus}\`\n` +
          `• **Reaction Name**: **${r.name}**\n` +
          `• **Balanced Chemical Equation**:\n  \`${r.balancedEquation}\`\n` +
          `• **Products**: ${r.products.join(', ')}\n` +
          `• **Classification**: ${r.reactionType.replace('_', ' ').toUpperCase()}\n` +
          `• **Observable Effects**: ${r.observableEffects.description}\n` +
          `• **Enthalpy Delta (ΔT)**: ${
            r.observableEffects.temperatureDelta > 0
              ? `+${r.observableEffects.temperatureDelta}°C (Exothermic)`
              : r.observableEffects.temperatureDelta < 0
              ? `${r.observableEffects.temperatureDelta}°C (Endothermic)`
              : '0°C (Thermal equilibrium)'
          }\n` +
          `• **Gas Evolution**: ${
            r.observableEffects.producesGas
              ? `Yes, active evolution of ${r.observableEffects.gasName}`
              : 'No gas evolved'
          }\n` +
          `• **Precipitate**: ${
            r.observableEffects.producesPrecipitate
              ? `Yes, solid forms (${r.observableEffects.precipitateColor || 'insoluble solid'})`
              : 'No precipitate (homogeneous)'
          }\n\n` +
          `• **Mechanism**: ${r.explanation}`,
        matchedCompounds: [],
        ambiguousCandidates: [],
        matchedReaction: r,
        suggestedReactions: [r],
        isSimulatorExecutable: true,
        hasRestrictedCompound: false,
      };
    }

    if (evalRes.status === 'incomplete') {
      const singleId = selectedIngredients[0]?.id;
      const compatibleReactions = singleId
        ? REACTIONS.filter((rx) => rx.reactants.includes(singleId)).slice(0, 4)
        : [];
      const suggestionLines =
        compatibleReactions.length > 0
          ? `\n\n**Verified Complementary Reactions for ${selectedIngredients[0].name}**:\n` +
            compatibleReactions
              .map((rx) => {
                const partners = rx.reactants
                  .filter((id) => id !== singleId)
                  .map((id) => getReagentDisplayInfo(id).name)
                  .join(' + ');
                return `• Add **${partners}** → **${rx.name}** (\`${rx.balancedEquation}\`)`;
              })
              .join('\n')
          : '';

      return {
        queryType: 'beaker_evaluation',
        replyMarkdown:
          `ℹ️ **Current Beaker Status**: \`${evalRes.structuredStatus}\`\n\n` +
          `• **Notice**: ${evalRes.message}\n` +
          `• **Currently Selected**: ${ingredientsSummary}.${suggestionLines}`,
        matchedCompounds: [],
        ambiguousCandidates: [],
        suggestedReactions: compatibleReactions,
        isSimulatorExecutable: false,
        hasRestrictedCompound: false,
      };
    }

    return {
      queryType: 'beaker_evaluation',
      replyMarkdown:
        `ℹ️ **Current Beaker Assessment (${ingredientsSummary})**: \`${evalRes.structuredStatus}\`\n\n` +
        `• **Result**: ${evalRes.message}\n\n` +
        `The substances currently in the beaker do not undergo spontaneous electron or proton exchange under standard classroom conditions (${conditions.temperature}°C, ${conditions.concentration.toFixed(1)} M).`,
      matchedCompounds: [],
      ambiguousCandidates: [],
      suggestedReactions: [],
      isSimulatorExecutable: false,
      hasRestrictedCompound: false,
    };
  }

  // 3. Ambiguous single-term query with multiple distinct candidates
  if (matched.length === 0 && ambiguous.length > 1) {
    const listMd = ambiguous
      .map(
        (c) =>
          `• **${c.name}** (\`${c.formula}\`) — *${c.category.toUpperCase()}${
            c.subcategory ? ` / ${c.subcategory}` : ''
          }* [${c.isRestricted ? 'Restricted' : c.visualLabStatus || 'Selectable'}]`
      )
      .join('\n');
    return {
      queryType: 'ambiguous_compound',
      replyMarkdown:
        `🔎 **Multiple Matching Compounds Found (${ambiguous.length})**:\n\n` +
        `Your query matches multiple entries in the canonical chemistry registry:\n${listMd}\n\n` +
        `Specify the exact compound name or formula, or use the quick-add buttons below to load a non-restricted entry directly into the beaker.`,
      matchedCompounds: ambiguous,
      ambiguousCandidates: ambiguous,
      suggestedReactions: [],
      isSimulatorExecutable: false,
      hasRestrictedCompound: ambiguous.some((c) => !!c.isRestricted),
    };
  }

  // 4. Multi-compound query (2 or more canonical compounds mentioned)
  if (matched.length >= 2) {
    const restrictedList = matched.filter((c) => c.isRestricted);
    if (restrictedList.length > 0) {
      const names = matched.map((c) => `${c.name} (${c.formula})`).join(' + ');
      const restrictedNotes = restrictedList
        .map(
          (r) =>
            `• **${r.name}** (\`${r.formula}\`): ${
              r.restrictionReason || r.safetyInfo || 'Restricted hazardous/radioactive substance.'
            }`
        )
        .join('\n');
      return {
        queryType: 'multi_compound_reaction',
        replyMarkdown:
          `🛡️ **Safety Restriction Block (${names})**:\n\n` +
          `• **Status**: \`RESTRICTED_HAZARDOUS_REACTION_BLOCKED\`\n` +
          `${restrictedNotes}\n\n` +
          `Interactive mixing and reaction execution are disabled for restricted hazardous, pyrophoric, explosive, or radioactive compounds.`,
        matchedCompounds: matched,
        ambiguousCandidates: [],
        suggestedReactions: [],
        isSimulatorExecutable: false,
        hasRestrictedCompound: true,
      };
    }

    // Separate catalyst if one of the mentioned compounds is a catalyst (e.g. H2O2 + MnO2 or Catalase)
    const catalystEntry = matched.find(
      (c) => c.category === 'catalyst' && c.id !== 'ki'
    );
    const syntheticIngredients = matched.map((c) => ({ id: c.id, amount: 20 }));
    const evalRes = evaluateReactionRecipe({
      ingredients: syntheticIngredients,
      conditions: {
        temperature: 25,
        concentration: 1.0,
        catalystId: catalystEntry?.id || null,
      },
    });

    if (evalRes.isSupported && evalRes.reaction) {
      const r = evalRes.reaction;
      const reactantNames = matched.map((c) => `${c.name} (${c.formula})`).join(' + ');
      return {
        queryType: 'multi_compound_reaction',
        replyMarkdown:
          `🔬 **Verified Simulator Reaction (${reactantNames})**:\n\n` +
          `• **Status**: \`${evalRes.structuredStatus}\` (Executable in 3D Beaker)\n` +
          `• **Reaction Name**: **${r.name}**\n` +
          `• **Balanced Chemical Equation**:\n  \`${r.balancedEquation}\`\n` +
          `• **Products**: ${r.products.join(', ')}\n` +
          `• **Classification**: ${r.reactionType.replace('_', ' ').toUpperCase()}\n` +
          `• **Observable Effects**: ${r.observableEffects.description}\n` +
          `• **Enthalpy Delta (ΔT)**: ${
            r.observableEffects.temperatureDelta > 0
              ? `+${r.observableEffects.temperatureDelta}°C (Exothermic)`
              : r.observableEffects.temperatureDelta < 0
              ? `${r.observableEffects.temperatureDelta}°C (Endothermic)`
              : '0°C (Thermal equilibrium)'
          }\n` +
          `• **Mechanism**: ${r.explanation}`,
        matchedCompounds: matched,
        ambiguousCandidates: [],
        matchedReaction: r,
        suggestedReactions: [r],
        isSimulatorExecutable: true,
        hasRestrictedCompound: false,
      };
    }

    // Check conceptual chemical rules (acid+base, indicator+acid/base, catalyst systems, metal+acid, etc.)
    const conceptualMd = evaluateConceptualMultiCompoundInteraction(matched);
    if (conceptualMd) {
      return {
        queryType: 'multi_compound_reaction',
        replyMarkdown: conceptualMd,
        matchedCompounds: matched,
        ambiguousCandidates: [],
        suggestedReactions: [],
        isSimulatorExecutable: false,
        hasRestrictedCompound: false,
      };
    }

    const reactantNames = matched.map((c) => `${c.name} (${c.formula})`).join(' and ');
    return {
      queryType: 'multi_compound_reaction',
      replyMarkdown:
        `🔬 **Chemical Compatibility Evaluation (${reactantNames})**:\n\n` +
        `• **Status**: \`${evalRes.structuredStatus}\`\n` +
        `• **Assessment**: ${evalRes.message}\n` +
        `• **Scientific Basis**: No spontaneous aqueous electron transfer, proton transfer, or insoluble precipitation is defined between these compounds under standard ambient beaker conditions (25°C, 1.0 M).`,
      matchedCompounds: matched,
      ambiguousCandidates: [],
      suggestedReactions: [],
      isSimulatorExecutable: false,
      hasRestrictedCompound: false,
    };
  }

  // 5. Single canonical compound mentioned
  if (matched.length === 1) {
    const reagent = matched[0];
    const compatible = REACTIONS.filter((rx) => rx.reactants.includes(reagent.id));
    const replyMarkdown = formatSingleCompoundResponse(reagent, compatible);

    return {
      queryType: 'single_compound',
      replyMarkdown,
      matchedCompounds: [reagent],
      ambiguousCandidates: ambiguous.length > 1 ? ambiguous : [],
      matchedReaction: compatible[0],
      suggestedReactions: compatible.slice(0, 4),
      isSimulatorExecutable: compatible.length > 0 && !reagent.isRestricted,
      hasRestrictedCompound: !!reagent.isRestricted,
    };
  }

  // 6. General Theory Questions
  if (q.includes('effervesc') || q.includes('bubble') || q.includes('fizz') || q.includes('gas')) {
    return {
      queryType: 'general_theory',
      replyMarkdown:
        '🫧 **General Educational Chemistry Theory: Effervescence & Gas Evolution**:\n\n' +
        'Effervescence is the rapid escape of gas bubbles from an aqueous solution. Common educational causes:\n\n' +
        '1. **Carbonate + Acid (CO₂)**: Protons protonate carbonate or bicarbonate ions, forming unstable carbonic acid (H₂CO₃) which decomposes into water and effervescing carbon dioxide:\n' +
        '   `CO₃²⁻(aq) + 2H⁺(aq) → H₂O(l) + CO₂(g)↑`\n\n' +
        '2. **Active Metal + Acid (H₂)**: Metals with standard reduction potential below hydrogen (e.g. Mg, Zn, Fe) reduce hydronium protons to flammable hydrogen gas while the metal oxidizes into soluble cations:\n' +
        '   `Mg(s) + 2HCl(aq) → MgCl₂(aq) + H₂(g)↑`\n\n' +
        '3. **Catalytic Decomposition (O₂)**: Hydrogen peroxide disproportionates rapidly when catalyzed by MnO₂, KI, or Catalase, producing oxygen gas and water.',
      matchedCompounds: [],
      ambiguousCandidates: [],
      suggestedReactions: [],
      isSimulatorExecutable: false,
      hasRestrictedCompound: false,
    };
  }

  if (q.includes('precipitat') || q.includes('insoluble') || q.includes('solid form') || q.includes('cloudy')) {
    return {
      queryType: 'general_theory',
      replyMarkdown:
        '❄️ **General Educational Chemistry Theory: Precipitate Formation & Solubility Rules**:\n\n' +
        'A precipitate is an insoluble solid that forms when two aqueous ionic solutions are mixed. ' +
        'This occurs when the ion concentration product exceeds the solubility product constant (**K_sp**), causing ions to aggregate into an electrostatic crystal lattice.\n\n' +
        '• **Silver Chloride (AgCl)**: Dense curdy white precipitate formed when Ag⁺ meets Cl⁻ (K_sp = 1.8 × 10⁻¹⁰).\n' +
        '• **Lead(II) Iodide (PbI₂)**: Brilliant golden yellow crystalline precipitate ("Golden Rain").\n' +
        '• **Barium Sulfate (BaSO₄)**: Heavy fine white precipitate insoluble in dilute acids.\n' +
        '• **Copper(II) Hydroxide (Cu(OH)₂)**: Pale blue gelatinous precipitate formed with alkali.',
      matchedCompounds: [],
      ambiguousCandidates: [],
      suggestedReactions: [],
      isSimulatorExecutable: false,
      hasRestrictedCompound: false,
    };
  }

  if (q.includes('catalyst') || q.includes('cataly')) {
    return {
      queryType: 'general_theory',
      replyMarkdown:
        '⚡ **General Educational Chemistry Theory: Role of Catalysts in Reactions**:\n\n' +
        'A catalyst accelerates the rate of a chemical reaction by providing an alternative pathway with a lower **activation energy (E_a)** without being consumed.\n\n' +
        '• **Heterogeneous Catalysts**: Solid surface catalysts such as **Manganese Dioxide (MnO₂)**, **Finely Divided Nickel (Ni)**, **Vanadium(V) Oxide (V₂O₅)**, **Promoted Iron (Fe)**, and **Zeolites (ZSM-5)**.\n' +
        '• **Homogeneous & Organometallic Catalysts**: Soluble complexes such as **Wilkinson’s Catalyst**, **Grubbs Catalyst**, and **Potassium Iodide (KI)**.\n' +
        '• **Biocatalysts (Enzymes)**: High-turnover enzymes such as **Catalase**, **Amylase**, and **Urease**.',
      matchedCompounds: [],
      ambiguousCandidates: [],
      suggestedReactions: [],
      isSimulatorExecutable: false,
      hasRestrictedCompound: false,
    };
  }

  if (q.includes('neutral') || q.includes('acid') || q.includes('base') || q.includes('ph')) {
    return {
      queryType: 'general_theory',
      replyMarkdown:
        '⚖️ **General Educational Chemistry Theory: Acid-Base Neutralization & Indicators**:\n\n' +
        'Neutralization is a proton transfer reaction where an acid (proton donor) reacts with a base (hydroxide donor or proton acceptor):\n\n' +
        '• **Net Ionic Equation**: `H⁺(aq) + OH⁻(aq) → H₂O(l) + ΔH (-57.3 kJ/mol)`\n' +
        '• **Exothermic Nature**: Strong acid–strong base neutralization releases ~57.3 kJ/mol, increasing solution temperature.\n' +
        '• **Indicators**: Halochromic indicators such as **Phenolphthalein**, **Methyl Orange**, and **Bromothymol Blue** change color across specific pH transition ranges.',
      matchedCompounds: [],
      ambiguousCandidates: [],
      suggestedReactions: [],
      isSimulatorExecutable: false,
      hasRestrictedCompound: false,
    };
  }

  if (
    q.includes('safety') ||
    q.includes('hazard') ||
    q.includes('ppe') ||
    q.includes('uranium') ||
    q.includes('cyanide') ||
    q.includes('mercury')
  ) {
    return {
      queryType: 'general_theory',
      replyMarkdown:
        '🛡️ **General Educational Chemistry Theory: Laboratory Safety & Standards**:\n\n' +
        'In educational science laboratories, personal protective equipment (PPE) is mandatory:\n' +
        '• Wear splash goggles, nitrile gloves, and a lab coat.\n' +
        '• Always add concentrated acid to water slowly, never water into acid.\n' +
        '• Restricted hazardous, pyrophoric, or radioactive substances (e.g., HF, HCN, Osmium tetroxide, Polonium, Uranium salts) are catalogued for reference only and blocked from interactive mixing.',
      matchedCompounds: [],
      ambiguousCandidates: [],
      suggestedReactions: [],
      isSimulatorExecutable: false,
      hasRestrictedCompound: false,
    };
  }

  return {
    queryType: 'general_theory',
    replyMarkdown:
      `🎓 **General Educational Chemistry Guide**:\n\n` +
      `You asked about: "${query}".\n\n` +
      `You can ask about any of the **750+ canonical compounds** across all 7 categories (Acids, Bases, Salts & Solutions, Metals, Oxidizers, Indicators, Catalysts) by name, synonym, or formula, or evaluate multi-compound reactions!`,
    matchedCompounds: [],
    ambiguousCandidates: [],
    suggestedReactions: [],
    isSimulatorExecutable: false,
    hasRestrictedCompound: false,
  };
}
