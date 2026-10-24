import { ReactionDefinition } from '../types/chemistry';
import { REACTIONS, REAGENTS } from './reactionsData';
import { findOrLookupCompound } from './compoundRegistry';

export interface ReactionOptionCard {
  id: string;
  name: string;
  balancedEquation: string;
  reactants: Array<{
    id: string;
    name: string;
    formula: string;
    amount: number;
    unit: string;
  }>;
  observableResult: string;
  catalystRequired: boolean;
  catalystInfo: string;
  catalystId?: string;
  expectedVisualEffects: {
    colorChangeTo: string;
    temperatureDelta: number;
    producesGas: boolean;
    gasName?: string;
    producesPrecipitate: boolean;
    precipitateColor?: string;
    isViolent?: boolean;
    description: string;
  };
  explanation: string;
  limitations: string;
  reactionType: string;
}

export interface ReactionDiscoveryResponse {
  query: string;
  options: ReactionOptionCard[];
  totalFound: number;
  message?: string;
}

/**
 * Maps a raw ReactionDefinition into a user-friendly ReactionOptionCard
 */
export function mapReactionToOptionCard(r: ReactionDefinition): ReactionOptionCard {
  const reactantsMapped = r.reactants.map((reqId) => {
    const lookup = findOrLookupCompound(reqId);
    const def = lookup.compound || REAGENTS.find((reg) => reg.id === reqId);
    const amount = r.requiredAmounts[reqId] || (def?.pourAmount ?? 20);
    return {
      id: reqId,
      name: def ? def.name : reqId,
      formula: def ? def.formula : reqId,
      amount,
      unit: def ? def.unit : 'mL',
    };
  });

  // Check catalyst requirements
  let catalystRequired = false;
  let catalystInfo = 'No catalyst required.';
  let catalystId: string | undefined = undefined;

  if (r.id === 'elephant_toothpaste') {
    catalystRequired = true;
    catalystInfo = 'Manganese Dioxide (MnO₂) is required as a heterogeneous catalyst to lower activation energy for H₂O₂ decomposition.';
    catalystId = 'mno2';
  } else if (r.id === 'ki_peroxide_catalysis') {
    catalystRequired = true;
    catalystInfo = 'Potassium Iodide (KI) is required as a homogeneous catalyst for peroxide disproportionation.';
    catalystId = 'ki';
  } else if (r.id === 'catalase_peroxide_decomposition') {
    catalystRequired = true;
    catalystInfo = 'Catalase Enzyme is required as a biological catalyst for rapid peroxide disproportionation.';
    catalystId = 'catalase_enzyme';
  } else if (r.reactants.includes('h2o2')) {
    catalystInfo = 'Optional catalyst: Manganese Dioxide (MnO₂) or Potassium Iodide (KI) dramatically accelerates gas evolution.';
  }

  // Visual effects
  const expectedVisualEffects = {
    colorChangeTo: r.observableEffects.colorChangeTo,
    temperatureDelta: r.observableEffects.temperatureDelta,
    producesGas: r.observableEffects.producesGas,
    gasName: r.observableEffects.gasName,
    producesPrecipitate: r.observableEffects.producesPrecipitate,
    precipitateColor: r.observableEffects.precipitateColor,
    isViolent: r.observableEffects.isViolent,
    description: r.observableEffects.description,
  };

  return {
    id: r.id,
    name: r.name,
    balancedEquation: r.balancedEquation,
    reactants: reactantsMapped,
    observableResult: r.observableEffects.description,
    catalystRequired,
    catalystInfo,
    catalystId,
    expectedVisualEffects,
    explanation: r.explanation,
    limitations: 'Qualitative virtual beaker simulation modeling stoichiometry, gas evolution rate, precipitation settling, and temperature delta under standard laboratory conditions.',
    reactionType: r.reactionType,
  };
}

function normalizeQueryFormulaText(str: string): string {
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
  };
  return str.replace(/[₀₁₂₃₄₅₆₇₈₉⁺⁻–—]/g, (ch) => subMap[ch] || ch);
}

/**
 * Resolves specific canonical compounds mentioned in a reaction query so that
 * specific substance queries (e.g. "lead(II) nitrate + potassium iodide" or
 * "oxalic acid and potassium permanganate") never fall back to unrelated presets.
 */
function findMentionedSimulatorReagents(query: string): string[] {
  const qNorm = normalizeQueryFormulaText(query).toLowerCase();
  const qNoParens = qNorm.replace(/[()]/g, ' ').replace(/\s+/g, ' ');
  const matchedIds = new Set<string>();

  for (const r of REAGENTS) {
    const rName = normalizeQueryFormulaText(r.name).toLowerCase();
    const rNameNoParens = rName.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
    const rBase = rName.replace(/\s*\([^)]*\)/g, '').trim();
    const rFormula = normalizeQueryFormulaText(r.formula)
      .replace(/\((s|l|g|aq|sat\.\s*aq)\)/gi, '')
      .trim()
      .toLowerCase();

    if (
      (rName.length >= 4 && qNorm.includes(rName)) ||
      (rNameNoParens.length >= 4 && qNoParens.includes(rNameNoParens)) ||
      (rBase.length >= 5 && qNorm.includes(rBase))
    ) {
      matchedIds.add(r.id);
      continue;
    }

    if (r.aliases) {
      for (const alias of r.aliases) {
        const aNorm = normalizeQueryFormulaText(alias).toLowerCase().trim();
        if (aNorm.length >= 4 && qNorm.includes(aNorm)) {
          matchedIds.add(r.id);
          break;
        }
      }
    }

    if (rFormula.length >= 2) {
      const escaped = rFormula.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const formulaRegex = new RegExp(`(?:^|\\s|\\+|\\()${escaped}(?:$|\\s|\\+|\\)|\\?|\\.|,)`, 'i');
      if (formulaRegex.test(qNorm)) {
        matchedIds.add(r.id);
      }
    }
  }

  return Array.from(matchedIds);
}

/**
 * Discovers and ranks up to 4 distinct, verified reactions matching a natural language prompt.
 * Never returns unrelated preset reactions when the user asks about specific named substances.
 */
export function discoverReactions(query: string): ReactionDiscoveryResponse {
  if (!query || !query.trim()) {
    return { query, options: [], totalFound: 0, message: 'Please enter a reaction description.' };
  }

  const q = query.toLowerCase().trim();

  // 0. SPECIFIC NAMED COMPOUND REACTION CHECK FIRST
  // Prevents specific queries like "What happens when lead(II) nitrate reacts with potassium iodide?"
  // or "Explain the reaction between oxalic acid and potassium permanganate" from returning unrelated presets.
  const mentionedIds = findMentionedSimulatorReagents(query);
  if (mentionedIds.length >= 2) {
    const exactOrSubset = REACTIONS.filter((rx) =>
      rx.reactants.every((reqId) => mentionedIds.includes(reqId))
    );
    if (exactOrSubset.length > 0) {
      const mapped = exactOrSubset.map(mapReactionToOptionCard).slice(0, 4);
      return {
        query,
        options: mapped,
        totalFound: mapped.length,
        message: `Found ${mapped.length} verified simulator reaction${mapped.length > 1 ? 's' : ''} matching the requested reactants.`,
      };
    }

    // Check if any reaction contains all mentionedIds (e.g., 2 reactants of a 2-reactant reaction)
    const containingAllMentioned = REACTIONS.filter((rx) =>
      mentionedIds.every((mId) => rx.reactants.includes(mId))
    );
    if (containingAllMentioned.length > 0) {
      const mapped = containingAllMentioned.map(mapReactionToOptionCard).slice(0, 4);
      return {
        query,
        options: mapped,
        totalFound: mapped.length,
        message: `Found ${mapped.length} verified simulator reaction${mapped.length > 1 ? 's' : ''} involving the requested reactants.`,
      };
    }

    // Specific compounds were named, but no supported 3D simulator reaction exists between them
    const namedLabels = mentionedIds
      .map((id) => REAGENTS.find((r) => r.id === id)?.name || id)
      .join(' + ');
    return {
      query,
      options: [],
      totalFound: 0,
      message: `No executable 3D beaker simulation is defined for the specific combination (${namedLabels}) under standard simulator conditions.`,
    };
  }

  // 1. EFFERVESCENCE / GAS EVOLUTION INTENT (Explicit Requirement 4)
  if (
    q.includes('effervesc') ||
    q.includes('bubble') ||
    q.includes('fizz') ||
    (q.includes('gas') && (q.includes('evolv') || q.includes('produc') || q.includes('releas') || q.includes('form')))
  ) {
    const effervescenceReactionIds = [
      'vinegar_baking_soda', // 1. NaHCO3 + CH3COOH -> CO2 foam
      'acid_carbonate',      // 2. CaCO3 + HCl -> CO2 bubbles
      'acid_metal',          // 3. Mg + HCl -> H2 gas
      'acid_zinc',           // 4. Zn + HCl -> H2 gas
    ];

    const matched = effervescenceReactionIds
      .map((id) => REACTIONS.find((r) => r.id === id))
      .filter((r): r is ReactionDefinition => Boolean(r))
      .map(mapReactionToOptionCard);

    return {
      query,
      options: matched.slice(0, 4),
      totalFound: matched.length,
      message: 'Found 4 distinct, verified educational gas-evolution (effervescence) reactions.',
    };
  }

  // 2. PRECIPITATE FORMATION INTENT
  if (
    q.includes('precipitat') ||
    q.includes('solid form') ||
    q.includes('cloudy') ||
    q.includes('insoluble') ||
    q.includes('sediment')
  ) {
    const pptReactionIds = [
      'precipitation',         // 1. AgNO3 + NaCl -> AgCl (white curdy ppt)
      'golden_rain_ppt',       // 2. Pb(NO3)2 + KI -> PbI2 (golden rain yellow ppt)
      'barium_sulfate_ppt',    // 3. BaCl2 + H2SO4 -> BaSO4 (heavy white ppt)
      'cu_hydroxide_ppt',      // 4. CuSO4 + NaOH -> Cu(OH)2 (vibrant blue gel)
    ];

    const matched = pptReactionIds
      .map((id) => REACTIONS.find((r) => r.id === id))
      .filter((r): r is ReactionDefinition => Boolean(r))
      .map(mapReactionToOptionCard);

    return {
      query,
      options: matched.slice(0, 4),
      totalFound: matched.length,
      message: 'Found 4 distinct, verified precipitation reactions featuring characteristic solid formation.',
    };
  }

  // 3. COLOUR CHANGE INTENT
  if (
    q.includes('colour') ||
    q.includes('color') ||
    q.includes('indicator') ||
    q.includes('magenta') ||
    q.includes('fuchsia') ||
    q.includes('purple')
  ) {
    const colorReactionIds = [
      'indicator_base_fuchsia',   // 1. Phenolphthalein + NaOH -> Fuchsia Magenta
      'universal_indicator_acid', // 2. Universal Indicator + HCl -> Crimson Red
      'redox_displacement',       // 3. CuSO4 + Fe -> Blue to Pale Green
      'cu_hno3_oxidation',        // 4. Cu + HNO3 -> Clear to Emerald Blue + Brown NO2
    ];

    const matched = colorReactionIds
      .map((id) => REACTIONS.find((r) => r.id === id))
      .filter((r): r is ReactionDefinition => Boolean(r))
      .map(mapReactionToOptionCard);

    return {
      query,
      options: matched.slice(0, 4),
      totalFound: matched.length,
      message: 'Found 4 distinct, verified reactions exhibiting vivid observable color transitions.',
    };
  }

  // 4. ACID-BASE NEUTRALISATION INTENT
  if (
    q.includes('neutral') ||
    (q.includes('acid') && q.includes('base')) ||
    q.includes('alkali') ||
    q.includes('titrat')
  ) {
    const neutralizationIds = [
      'neutralization',            // 1. HCl + NaOH
      'h2so4_naoh_neutralization', // 2. H2SO4 + NaOH
      'indicator_base_fuchsia',    // 3. Phenolphthalein + NaOH
      'acid_carbonate',            // 4. HCl + CaCO3
    ];

    const matched = neutralizationIds
      .map((id) => REACTIONS.find((r) => r.id === id))
      .filter((r): r is ReactionDefinition => Boolean(r))
      .map(mapReactionToOptionCard);

    return {
      query,
      options: matched.slice(0, 4),
      totalFound: matched.length,
      message: 'Found 4 distinct, verified acid-base neutralization reactions.',
    };
  }

  // 5. METAL + ACID / DISPLACEMENT INTENT
  if (
    (q.includes('metal') && q.includes('acid')) ||
    q.includes('displac') ||
    q.includes('reactivity series')
  ) {
    const metalAcidIds = [
      'acid_metal',              // 1. Mg + HCl
      'acid_zinc',               // 2. Zn + HCl
      'zn_cuso4_displacement',   // 3. Zn + CuSO4
      'redox_displacement',      // 4. Fe + CuSO4
    ];

    const matched = metalAcidIds
      .map((id) => REACTIONS.find((r) => r.id === id))
      .filter((r): r is ReactionDefinition => Boolean(r))
      .map(mapReactionToOptionCard);

    return {
      query,
      options: matched.slice(0, 4),
      totalFound: matched.length,
      message: 'Found 4 distinct, verified single-displacement and metal-acid reactions.',
    };
  }

  // 6. OXIDATION / REDOX / CATALYSIS INTENT
  if (
    q.includes('oxid') ||
    q.includes('redox') ||
    q.includes('catalyst') ||
    q.includes('peroxide') ||
    q.includes('combust')
  ) {
    const redoxIds = [
      'cu_hno3_oxidation',       // 1. Cu + HNO3
      'elephant_toothpaste',     // 2. H2O2 + MnO2 (catalytic)
      'fenton_reaction',         // 3. H2O2 + Fe
      'ki_peroxide_catalysis',   // 4. H2O2 + KI
    ];

    const matched = redoxIds
      .map((id) => REACTIONS.find((r) => r.id === id))
      .filter((r): r is ReactionDefinition => Boolean(r))
      .map(mapReactionToOptionCard);

    return {
      query,
      options: matched.slice(0, 4),
      totalFound: matched.length,
      message: 'Found 4 distinct, verified oxidation-reduction and catalytic reactions.',
    };
  }

  // 7. Single mentioned compound reaction lookup (e.g., "reactions with silver nitrate")
  if (mentionedIds.length === 1) {
    const singleMatches = REACTIONS.filter((r) => r.reactants.includes(mentionedIds[0]));
    if (singleMatches.length > 0) {
      const mapped = singleMatches.map(mapReactionToOptionCard).slice(0, 4);
      return {
        query,
        options: mapped,
        totalFound: singleMatches.length,
        message: `Found ${mapped.length} verified reaction${mapped.length > 1 ? 's' : ''} involving the requested compound.`,
      };
    }
  }

  // 8. GENERAL SEARCH FALLBACK (Matches keywords across all REACTIONS)
  const matches = REACTIONS.filter((r) => {
    const nameMatch = r.name.toLowerCase().includes(q);
    const typeMatch = r.reactionType.toLowerCase().includes(q);
    const eqMatch = r.balancedEquation.toLowerCase().includes(q);
    const descMatch = r.observableEffects.description.toLowerCase().includes(q);
    const expMatch = r.explanation.toLowerCase().includes(q);
    return nameMatch || typeMatch || eqMatch || descMatch || expMatch;
  });

  if (matches.length > 0) {
    const mapped = matches.map(mapReactionToOptionCard).slice(0, 4);
    return {
      query,
      options: mapped,
      totalFound: mapped.length,
      message: `Found ${mapped.length} verified reaction option${mapped.length > 1 ? 's' : ''} matching your description.`,
    };
  }

  // Only return the 4 general showcase examples if the user asked for general examples/suggestions
  if (
    q.includes('example') ||
    q.includes('sample') ||
    q.includes('any reaction') ||
    q.includes('suggest') ||
    q.includes('popular') ||
    q.includes('preset')
  ) {
    const default4 = [
      REACTIONS.find((r) => r.id === 'vinegar_baking_soda')!,
      REACTIONS.find((r) => r.id === 'precipitation')!,
      REACTIONS.find((r) => r.id === 'neutralization')!,
      REACTIONS.find((r) => r.id === 'acid_metal')!,
    ].map(mapReactionToOptionCard);

    return {
      query,
      options: default4,
      totalFound: 4,
      message: 'Showing 4 representative educational reaction options.',
    };
  }

  return {
    query,
    options: [],
    totalFound: 0,
    message: 'No matching preset simulator reaction found for this specific query.',
  };
}

