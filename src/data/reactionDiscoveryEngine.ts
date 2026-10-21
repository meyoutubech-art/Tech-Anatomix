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
function mapReactionToOptionCard(r: ReactionDefinition): ReactionOptionCard {
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

/**
 * Discovers and ranks up to 4 distinct, verified reactions matching a natural language prompt.
 */
export function discoverReactions(query: string): ReactionDiscoveryResponse {
  if (!query || !query.trim()) {
    return { query, options: [], totalFound: 0, message: 'Please enter a reaction description.' };
  }

  const q = query.toLowerCase().trim();

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
    q.includes('acid') && q.includes('base') ||
    q.includes('alkali') ||
    q.includes('titrat')
  ) {
    const neutralizationIds = [
      'neutralization',           // 1. HCl + NaOH
      'h2so4_naoh_neutralization', // 2. H2SO4 + NaOH
      'indicator_base_fuchsia',   // 3. Phenolphthalein + NaOH
      'acid_carbonate',           // 4. HCl + CaCO3
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

  // 7. GENERAL SEARCH FALLBACK (Matches keywords across all REACTIONS)
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

  // Default to 4 representative educational reactions if general query provided
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
    message: 'Showing 4 representative educational reaction options. Refine your description to narrow down specific visual outcomes.',
  };
}
