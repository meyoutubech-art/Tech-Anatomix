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
import {
  discoverReactions,
  mapReactionToOptionCard,
  ReactionOptionCard,
} from '../data/reactionDiscoveryEngine';

export type AssistantUserIntent =
  | 'general_explanation'
  | 'specific_compound'
  | 'reaction_explanation'
  | 'reaction_discovery'
  | 'lab_action_add'
  | 'lab_action_load'
  | 'lab_action_run'
  | 'beaker_inquiry'
  | 'ambiguous_query'
  | 'insufficient_info';

export type ReactionSupportClassification =
  | 'validated_simulator_reaction'
  | 'known_non_simulator_reaction'
  | 'no_reaction_standard_conditions'
  | 'restricted_combination'
  | 'ambiguous_or_insufficient'
  | 'not_applicable';

export interface AiAssistantResolution {
  queryType:
    | 'mutation_guard'
    | 'beaker_evaluation'
    | 'single_compound'
    | 'multi_compound_reaction'
    | 'ambiguous_compound'
    | 'reaction_discovery'
    | 'general_theory';
  userIntent: AssistantUserIntent;
  reactionSupportClassification: ReactionSupportClassification;
  replyMarkdown: string;
  matchedCompounds: ChemicalReagent[];
  ambiguousCandidates: ChemicalReagent[];
  matchedReaction?: ReactionDefinition;
  suggestedReactions: ReactionDefinition[];
  discoveryOptions: ReactionOptionCard[];
  isSimulatorExecutable: boolean;
  hasRestrictedCompound: boolean;
}

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
  'reactions',
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
  'find',
  'if',
  'we',
  'i',
  'put',
  'together',
  'solution',
  'solutions',
  'aqueous',
  'solid',
  'gas',
  'liquid',
  'acidic',
  'basic',
  'alkaline',
  'neutral',
  'medium',
  'beaker',
  'experiment',
  'add',
  'load',
  'pour',
  'run',
  'into',
  'from',
]);

// Known ambiguous stem names where multiple oxidation states or forms exist in the canonical registry
const AMBIGUOUS_CHEMICAL_FAMILIES: Array<{
  pattern: RegExp;
  excludeIfContains: RegExp;
  candidateIds: string[];
}> = [
  {
    pattern: /\biron\s+chloride\b/i,
    excludeIfContains: /iron\s*\(\s*(ii|iii|2|3)\s*\)\s*chloride|ferrous|ferric|fecl2|fecl3/i,
    candidateIds: ['fecl2', 'fecl3'],
  },
  {
    pattern: /\biron\s+sulfate\b|\biron\s+sulphate\b/i,
    excludeIfContains: /iron\s*\(\s*(ii|iii|2|3)\s*\)\s*sul|ferrous|ferric|feso4|fe2\(so4\)3/i,
    candidateIds: ['fe_so4', 'fe2_so4_3'],
  },
  {
    pattern: /\biron\s+oxide\b/i,
    excludeIfContains: /iron\s*\(\s*(ii|iii|2|3)\s*\)\s*oxide|ferrous|ferric|feo\b|fe2o3|fe3o4/i,
    candidateIds: ['feo', 'fe2o3', 'fe3o4'],
  },
  {
    pattern: /\bcopper\s+oxide\b/i,
    excludeIfContains: /copper\s*\(\s*(i|ii|1|2)\s*\)\s*oxide|cuprous|cupric|cu2o|cuo\b/i,
    candidateIds: ['cu2o', 'cuo'],
  },
  {
    pattern: /\bcopper\s+chloride\b/i,
    excludeIfContains: /copper\s*\(\s*(i|ii|1|2)\s*\)\s*chloride|cuprous|cupric|cucl\b|cucl2/i,
    candidateIds: ['cucl', 'cucl2'],
  },
  {
    pattern: /\btin\s+chloride\b/i,
    excludeIfContains: /tin\s*\(\s*(ii|iv|2|4)\s*\)\s*chloride|stannous|stannic|sncl2|sncl4/i,
    candidateIds: ['sncl2', 'sncl4'],
  },
  {
    pattern: /\bmercury\s+chloride\b/i,
    excludeIfContains: /mercury\s*\(\s*(i|ii|1|2)\s*\)\s*chloride|mercurous|mercuric|hg2cl2|hgcl2/i,
    candidateIds: ['hg2cl2', 'hgcl2'],
  },
];

function stripStateSuffix(formula: string): string {
  return normalizeFormula(formula)
    .replace(/\((s|l|g|aq|g\/l|l\/g|sat\.\s*aq|aq,\s*[^)]+)\)/gi, '')
    .trim();
}

/**
 * Extracts all canonical compounds mentioned in a free-text query across the entire
 * 22-page document inventory (854 canonical compounds across Acids, Bases, Salts,
 * Metals, Oxidizers, Indicators, Catalysts).
 */
export function extractCanonicalCompoundsFromQuery(queryText: string): {
  matched: ChemicalReagent[];
  ambiguous: ChemicalReagent[];
} {
  const registry = getCanonicalRegistry();
  const qNorm = normalizeFormula(queryText);
  const qLower = qNorm.toLowerCase();

  const matchedMap = new Map<string, ChemicalReagent>();
  const ambiguousMap = new Map<string, ChemicalReagent>();

  // 0. Check explicit ambiguous chemical stem families first (e.g. "iron chloride", "copper oxide")
  for (const fam of AMBIGUOUS_CHEMICAL_FAMILIES) {
    if (fam.pattern.test(qLower) && !fam.excludeIfContains.test(qLower)) {
      for (const cid of fam.candidateIds) {
        const found = registry.find((r) => r.id === cid);
        if (found) {
          ambiguousMap.set(found.id, found);
        }
      }
    }
  }

  let consumedText = ` ${qLower.replace(/[?,!.;:]/g, ' ').replace(/\s+/g, ' ')} `;
  let consumedNoParens = ` ${qLower.replace(/[?,!.();:]/g, ' ').replace(/\s+/g, ' ')} `;

  // Common natural-language chemical synonyms -> canonical ID (checked first so multi-word salts consume their metal name)
  const NATURAL_SYNONYMS: Array<{ phrase: string; id: string }> = [
    { phrase: 'lead(ii) nitrate', id: 'pb_no3_2' },
    { phrase: 'lead ii nitrate', id: 'pb_no3_2' },
    { phrase: 'lead nitrate', id: 'pb_no3_2' },
    { phrase: 'potassium permanganate', id: 'kmn_o4_reagent' },
    { phrase: 'permanganate', id: 'kmn_o4_reagent' },
    { phrase: 'potassium dichromate', id: 'k2cr2o7' },
    { phrase: 'potassium chromate', id: 'k2cro4' },
    { phrase: 'sodium hydroxide', id: 'naoh' },
    { phrase: 'caustic soda', id: 'naoh' },
    { phrase: 'hydrochloric acid', id: 'hcl' },
    { phrase: 'sulfuric acid', id: 'h2so4' },
    { phrase: 'sulphuric acid', id: 'h2so4' },
    { phrase: 'nitric acid', id: 'hno3' },
    { phrase: 'acetic acid', id: 'ch3cooh' },
    { phrase: 'vinegar', id: 'ch3cooh' },
    { phrase: 'carbolic acid', id: 'phenol_carbolic_acid' },
    { phrase: 'baking soda', id: 'nahco3' },
    { phrase: 'sodium bicarbonate', id: 'nahco3' },
    { phrase: 'sodium hydrogen carbonate', id: 'nahco3' },
    { phrase: 'washing soda', id: 'na2co3' },
    { phrase: 'sodium carbonate', id: 'na2co3' },
    { phrase: 'calcium carbonate', id: 'caco3' },
    { phrase: 'slaked lime', id: 'ca_oh2' },
    { phrase: 'calcium hydroxide', id: 'ca_oh2' },
    { phrase: 'silver nitrate', id: 'agno3' },
    { phrase: 'potassium iodide', id: 'ki' },
    { phrase: 'barium chloride', id: 'bacl2' },
    { phrase: 'barium hydroxide', id: 'ba_oh2' },
    { phrase: 'copper(ii) sulfate', id: 'cuso4' },
    { phrase: 'copper ii sulfate', id: 'cuso4' },
    { phrase: 'copper sulfate', id: 'cuso4' },
    { phrase: 'copper sulphate', id: 'cuso4' },
    { phrase: 'iron(ii) sulfate', id: 'fe_so4' },
    { phrase: 'iron ii sulfate', id: 'fe_so4' },
    { phrase: 'ferrous sulfate', id: 'fe_so4' },
    { phrase: 'iron(iii) chloride', id: 'fecl3' },
    { phrase: 'iron iii chloride', id: 'fecl3' },
    { phrase: 'ferric chloride', id: 'fecl3' },
    { phrase: 'hydrogen peroxide', id: 'h2o2' },
    { phrase: 'manganese dioxide', id: 'mno2' },
    { phrase: 'manganese(iv) oxide', id: 'mno2' },
    { phrase: 'sodium thiosulfate', id: 'na2s2o3' },
    { phrase: 'sodium thiosulphate', id: 'na2s2o3' },
    { phrase: 'oxalic acid', id: 'oxalic_acid' },
    { phrase: 'citric acid', id: 'c6h8o7' },
    { phrase: 'salicylic acid', id: 'salicylic_acid' },
    { phrase: 'sodium chloride', id: 'nacl' },
    { phrase: 'potassium nitrate', id: 'kno3' },
    { phrase: 'universal indicator', id: 'universal_indicator' },
    { phrase: 'phenolphthalein', id: 'phenolphthalein' },
    { phrase: 'methyl orange', id: 'methyl_orange' },
    { phrase: 'bromothymol blue', id: 'bromothymol_blue' },
    { phrase: 'starch solution', id: 'starch_solution' },
    { phrase: 'iodine solution', id: 'iodine_solution' },
    { phrase: 'lugol solution', id: 'iodine_solution' },
    { phrase: 'sodium hypochlorite', id: 'naocl' },
    { phrase: 'catalase', id: 'catalase_enzyme' },
    { phrase: 'magnesium ribbon', id: 'mg' },
    { phrase: 'zinc granules', id: 'zn' },
    { phrase: 'copper turnings', id: 'cu' },
    { phrase: 'copper metal', id: 'cu' },
    { phrase: 'iron filings', id: 'fe' },
    { phrase: 'iron powder', id: 'fe' },
    { phrase: 'aluminium foil', id: 'al_metal' },
    { phrase: 'aluminum foil', id: 'al_metal' },
  ];

  NATURAL_SYNONYMS.sort((a, b) => b.phrase.length - a.phrase.length);

  for (const syn of NATURAL_SYNONYMS) {
    if (
      consumedText.includes(` ${syn.phrase} `) ||
      consumedNoParens.includes(` ${syn.phrase} `)
    ) {
      const r = registry.find((reg) => reg.id === syn.id);
      if (r) {
        matchedMap.set(r.id, r);
        consumedText = consumedText.replace(syn.phrase, ' ');
        consumedNoParens = consumedNoParens.replace(syn.phrase.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim(), ' ');
      }
    }
  }

  // Regex matching any metal name immediately followed by a salt/anion/oxide word
  const METAL_SALT_SUFFIX_REGEX =
    /\b(potassium|sodium|lithium|calcium|barium|strontium|magnesium|zinc|iron|copper|silver|lead|aluminium|aluminum|tin|nickel|cobalt|manganese|chromium|mercury|ammonium)\s*(\((i|ii|iii|iv|v|vi|1|2|3|4)\)\s*)?(iodide|chloride|bromide|fluoride|nitrate|nitrite|sulfate|sulphate|sulfite|sulphite|sulfide|sulphide|carbonate|bicarbonate|hydroxide|oxide|peroxide|permanganate|dichromate|chromate|phosphate|acetate|oxalate|citrate|thiosulfate|thiosulphate|chlorate|perchlorate|hypochlorite|iodate|periodate|cyanide|thiocyanate|ferricyanide|ferrocyanide|salicylate|benzoate|formate|tartrate|lactate|gluconate|stearate|oleate)\b/i;

  // 1. Clean conversational prefixes and split by conjunctions
  const cleanedPhrase = qLower
    .replace(
      /^(what\s+is|what\s+are|tell\s+me\s+about|explain\s+the\s+reaction\s+between|explain\s+the\s+reaction\s+of|explain|describe|what\s+happens\s+when|what\s+happens\s+if\s+i\s+mix|what\s+happens\s+if|reaction\s+of|reaction\s+between|properties\s+of|role\s+of|add|load|pour|put|mix)\s+/i,
      ''
    )
    .replace(/\s+(into\s+the\s+beaker|to\s+the\s+beaker|in\s+the\s+beaker|in\s+acidic\s+medium|in\s+alkaline\s+medium|in\s+basic\s+medium|in\s+water|under\s+standard\s+conditions)\s*$/i, '')
    .replace(/[?.!]+$/g, '')
    .trim();

  const segments = cleanedPhrase
    .split(/\s*(?:\+|\band\b|\bwith\b|\bplus\b|\bvs\.?\b|\breacts\s+with\b|\bis\s+mixed\s+with\b|\bis\s+added\s+to\b|,)\s*/i)
    .map((s) =>
      s
        .replace(
          /^(reacting|mixing|combining|adding|loading|if\s+i\s+mix|when\s+mixing|between|the\s+reaction\s+between|does)\s+/i,
          ''
        )
        .replace(/\s+(react|reacts|are\s+mixed|is\s+added|together|in\s+acidic\s+medium|in\s+basic\s+medium|to\s+beaker|into\s+beaker).*$/i, '')
        .trim()
    )
    .filter((s) => s.length >= 2 && !STOP_WORDS.has(s));

  for (const seg of segments) {
    const segNorm = normalizeFormula(seg).toLowerCase();
    const segNoIndicator = segNorm.replace(/\s+indicator$/i, '').trim();
    const segNoParens = segNorm.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();

    // Skip if this segment already triggered an ambiguous family
    if (AMBIGUOUS_CHEMICAL_FAMILIES.some((f) => f.pattern.test(segNorm) && !f.excludeIfContains.test(segNorm))) {
      continue;
    }

    let directCandidates = registry.filter((r) => {
      const rName = normalizeFormula(r.name).toLowerCase();
      const rNameNoParens = rName.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
      const rLeadingName = rName.includes(' (') ? rName.split(/\s+\(/)[0].trim() : '';
      const rForm = stripStateSuffix(r.formula).toLowerCase();

      if (
        rName === segNorm ||
        rNameNoParens === segNoParens ||
        (rLeadingName.length >= 3 && (rLeadingName === segNorm || rLeadingName === segNoIndicator)) ||
        rForm === segNorm ||
        r.id.toLowerCase() === segNorm ||
        r.id.toLowerCase() === segNoIndicator
      ) {
        return true;
      }
      if (
        r.aliases?.some((a) => {
          const aNorm = normalizeFormula(a).toLowerCase();
          return (
            aNorm === segNorm ||
            aNorm === segNoIndicator ||
            aNorm.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim() === segNoParens
          );
        })
      ) {
        return true;
      }
      return false;
    });

    // If multiple candidates match only because the same element/compound exists in both Metals/Salts and Catalysts,
    // prefer the primary non-catalyst entry unless the segment mentions "catalyst"
    if (directCandidates.length > 1 && !segNorm.includes('catalyst')) {
      const nonCatalysts = directCandidates.filter((c) => c.category !== 'catalyst');
      if (nonCatalysts.length === 1) {
        directCandidates = nonCatalysts;
      }
    }

    if (directCandidates.length === 1) {
      const chosen = directCandidates[0];
      matchedMap.set(chosen.id, chosen);
      consumedText = consumedText.replace(segNorm, ' ');
      consumedNoParens = consumedNoParens.replace(segNoParens, ' ');
      continue;
    } else if (directCandidates.length > 1) {
      for (const c of directCandidates) {
        ambiguousMap.set(c.id, c);
      }
      continue;
    }

    const lookedUp = findOrLookupCompound(seg);
    if (lookedUp.found && lookedUp.compound) {
      matchedMap.set(lookedUp.compound.id, lookedUp.compound);
      consumedText = consumedText.replace(segNorm, ' ');
      consumedNoParens = consumedNoParens.replace(segNoParens, ' ');
    }
  }

  // 2. Scan remaining unconsumed query text for exact canonical names, base names, aliases, and formulas
  interface PhraseCandidate {
    phrase: string;
    reagent: ChemicalReagent;
    isFormula: boolean;
    useNoParens: boolean;
  }

  const phraseCandidates: PhraseCandidate[] = [];
  for (const r of registry) {
    const fullName = normalizeFormula(r.name).toLowerCase();
    const fullNameNoParens = fullName.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
    const leadingTrivialName = fullName.includes(' (') ? fullName.split(/\s+\(/)[0].trim() : '';

    if (fullName.length >= 3 && !STOP_WORDS.has(fullName)) {
      phraseCandidates.push({ phrase: fullName, reagent: r, isFormula: false, useNoParens: false });
    }
    if (fullNameNoParens.length >= 3 && fullNameNoParens !== fullName && !STOP_WORDS.has(fullNameNoParens)) {
      phraseCandidates.push({ phrase: fullNameNoParens, reagent: r, isFormula: false, useNoParens: true });
    }
    if (
      leadingTrivialName.length >= 4 &&
      leadingTrivialName !== fullName &&
      !/\((i|ii|iii|iv|v|vi|vii)\)/i.test(leadingTrivialName) &&
      !STOP_WORDS.has(leadingTrivialName)
    ) {
      phraseCandidates.push({ phrase: leadingTrivialName, reagent: r, isFormula: false, useNoParens: false });
    }
    if (r.aliases) {
      for (const alias of r.aliases) {
        const aLower = normalizeFormula(alias).toLowerCase().trim();
        if (aLower.length >= 3 && !STOP_WORDS.has(aLower)) {
          phraseCandidates.push({ phrase: aLower, reagent: r, isFormula: false, useNoParens: false });
        }
      }
    }
    const cleanForm = stripStateSuffix(r.formula).toLowerCase();
    if (cleanForm.length >= 2 && !STOP_WORDS.has(cleanForm)) {
      phraseCandidates.push({ phrase: cleanForm, reagent: r, isFormula: true, useNoParens: false });
    }
  }

  phraseCandidates.sort((a, b) => b.phrase.length - a.phrase.length);

  for (const cand of phraseCandidates) {
    if (matchedMap.has(cand.reagent.id) || ambiguousMap.has(cand.reagent.id)) continue;

    // Never match a pure elemental metal or single-element catalyst if its name in the query was part of a metal salt/oxide
    if (cand.reagent.category === 'metal' || cand.reagent.category === 'catalyst') {
      const words = cand.phrase.split(/\s+/);
      if (words.length === 1 && METAL_SALT_SUFFIX_REGEX.test(qLower)) {
        // Check if this single element word only appears as the prefix of a salt in qLower
        const metalWord = words[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const saltCheck = new RegExp(
          `\\b${metalWord}\\s*(\\((i|ii|iii|iv|v|vi|1|2|3|4)\\)\\s*)?(iodide|chloride|bromide|fluoride|nitrate|nitrite|sulfate|sulphate|sulfite|sulphite|sulfide|sulphide|carbonate|bicarbonate|hydroxide|oxide|peroxide|permanganate|dichromate|chromate|phosphate|acetate|oxalate|citrate|thiosulfate|thiosulphate|chlorate|perchlorate|hypochlorite|iodate|periodate|cyanide|thiocyanate|ferricyanide|ferrocyanide|salicylate|benzoate|formate|tartrate|lactate|gluconate|stearate|oleate)\\b`,
          'i'
        );
        if (saltCheck.test(qLower) && !consumedText.includes(` ${cand.phrase} `)) {
          continue;
        }
        if (saltCheck.test(qLower)) {
          // Strip all salt occurrences from qLower and see if the standalone metal word still exists
          const qWithoutSalt = qLower.replace(new RegExp(saltCheck.source, 'gi'), ' ');
          if (!new RegExp(`\\b${metalWord}\\b`, 'i').test(qWithoutSalt)) {
            continue;
          }
        }
      }
    }

    if (cand.isFormula) {
      // Only match formula if it appears as an actual chemical formula token (case-sensitive or exact formula token inconsumedText)
      const escaped = cand.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|\\s|\\+|\\()${escaped}(?:$|\\s|\\+|\\)|\\?|\\.|,)`, 'i');
      if (regex.test(consumedText)) {
        matchedMap.set(cand.reagent.id, cand.reagent);
      }
    } else {
      const targetHaystack = cand.useNoParens ? consumedNoParens : consumedText;
      if (targetHaystack.includes(` ${cand.phrase} `)) {
        matchedMap.set(cand.reagent.id, cand.reagent);
        consumedText = consumedText.replace(cand.phrase, ' ');
        consumedNoParens = consumedNoParens.replace(cand.phrase, ' ');
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
      `\n**Supported 3D Simulator Reactions (${compatibleReactions.length})**:`,
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

interface NonSimulatorEvaluation {
  classification: 'known_non_simulator_reaction' | 'no_reaction_standard_conditions';
  markdown: string;
}

/**
 * Evaluates multi-compound interactions that are not in the 52 preset 3D animations,
 * distinguishing clearly between:
 *  - Case 2: Scientifically known reaction (not executable as a 3D animation in the beaker simulator)
 *  - Case 3: No reaction under standard aqueous conditions
 */
function evaluateConceptualMultiCompoundInteraction(
  compounds: ChemicalReagent[],
  rawQuery: string
): NonSimulatorEvaluation {
  const ids = new Set(compounds.map((c) => c.id));
  const qLower = rawQuery.toLowerCase();

  // A. Specific Named Organic / Industrial / Analytical Reactions (Case 2)
  // 1. Fischer Esterification (Carboxylic Acid + Alcohol)
  const hasAlcohol = compounds.find(
    (c) => c.id === 'ethanol' || c.name.toLowerCase().includes('ethanol') || c.name.toLowerCase().includes('methanol')
  );
  const hasCarboxylic = compounds.find(
    (c) =>
      c.id === 'ch3cooh' ||
      c.id === 'salicylic_acid' ||
      c.id === 'benzoic_acid' ||
      c.id === 'formic_acid' ||
      c.subcategory?.toLowerCase().includes('carboxylic')
  );
  if (hasAlcohol && hasCarboxylic) {
    return {
      classification: 'known_non_simulator_reaction',
      markdown:
        `🧪 **Fischer Esterification (${hasCarboxylic.name} + ${hasAlcohol.name})**:\n\n` +
        `• **Simulator Support Status**: \`Scientific Reference Reaction — Not currently executable in the 3D beaker simulator\`\n` +
        `• **Reactants**: ${hasCarboxylic.name} (\`${hasCarboxylic.formula}\`) + ${hasAlcohol.name} (\`${hasAlcohol.formula}\`)\n` +
        `• **Products**: Carboxylic Ester (e.g., Ethyl Acetate \`CH₃COOCH₂CH₃\`) + Water (\`H₂O\`)\n` +
        `• **Balanced Chemical Equation**:\n  \`CH₃COOH(l) + C₂H₅OH(l) ⇌ CH₃COOCH₂CH₃(l) + H₂O(l)\`\n` +
        `• **Reaction Type**: Acid-Catalyzed Nucleophilic Acyl Substitution (Condensation / Esterification)\n` +
        `• **Required Conditions**: Concentrated \`H₂SO₄\` acid catalyst and gentle reflux heating (60–80°C).\n` +
        `• **Expected Observations**: Formation of a volatile, sweet fruity-smelling ester layer floating on water.`,
    };
  }

  // 2. Limewater + Carbon Dioxide / Carbonic Acid
  if (
    (ids.has('ca_oh2') || ids.has('limewater_clear')) &&
    (ids.has('co2_gas') || ids.has('h2co3') || qLower.includes('carbon dioxide') || qLower.includes('co2'))
  ) {
    return {
      classification: 'known_non_simulator_reaction',
      markdown:
        `❄️ **Limewater Carbonation Test (Calcium Hydroxide + Carbon Dioxide)**:\n\n` +
        `• **Simulator Support Status**: \`Scientific Reference Reaction — Not currently executable in the 3D beaker simulator\`\n` +
        `• **Reactants**: Calcium Hydroxide (\`Ca(OH)₂(aq)\`) + Carbon Dioxide (\`CO₂(g)\`)\n` +
        `• **Products**: Insoluble Calcium Carbonate (\`CaCO₃(s)↓\`) + Water (\`H₂O(l)\`)\n` +
        `• **Balanced Chemical Equation**:\n  \`Ca(OH)₂(aq) + CO₂(g) → CaCO₃(s)↓ [milky white precipitate] + H₂O(l)\`\n` +
        `• **Reaction Type**: Gas–Liquid Precipitation / Acidic Oxide Neutralization\n` +
        `• **Expected Observations**: Clear colourless limewater turns milky/cloudy white due to finely divided \`CaCO₃(s)\` suspension. Passing excess \`CO₂\` redissolves the precipitate into colourless soluble calcium bicarbonate: \`CaCO₃(s) + CO₂(g) + H₂O(l) → Ca(HCO₃)₂(aq)\`.`,
    };
  }

  // 3. Thermite Reaction (Aluminium + Metal Oxide such as Fe2O3, Cr2O3, MnO2, CuO)
  const hasAluminium = compounds.find((c) => c.id === 'al_metal');
  const hasReducibleOxide = compounds.find((c) =>
    ['fe2o3', 'fe3o4', 'cr2o3', 'mno2', 'cuo'].includes(c.id)
  );
  if (hasAluminium && hasReducibleOxide) {
    return {
      classification: 'known_non_simulator_reaction',
      markdown:
        `🔥 **Aluminothermic (Thermite) Redox Reduction (${hasAluminium.name} + ${hasReducibleOxide.name})**:\n\n` +
        `• **Simulator Support Status**: \`Scientific Reference Reaction — Not currently executable in the 3D beaker simulator\`\n` +
        `• **Reactants**: ${hasAluminium.name} (\`${hasAluminium.formula}\`) + ${hasReducibleOxide.name} (\`${hasReducibleOxide.formula}\`)\n` +
        `• **Products**: Aluminium Oxide (\`Al₂O₃(s)\`) + Elemental Metal (e.g., molten \`Fe(l)\`)\n` +
        `• **Balanced Chemical Equation**:\n  \`2Al(s) + Fe₂O₃(s) —[High-Temperature Ignition]→ Al₂O₃(s) + 2Fe(l)   (ΔH° = -851.5 kJ/mol)\`\n` +
        `• **Reaction Type**: Solid-State Exothermic Single-Displacement Redox\n` +
        `• **Required Conditions**: High-temperature ignition source (>1500°C, such as burning magnesium ribbon). Does **not** occur spontaneously in an aqueous beaker at room temperature (25°C).`,
    };
  }

  const hasAcid = compounds.find(
    (c) => c.category === 'acid' || c.secondaryCategories?.includes('acid')
  );
  const hasBase = compounds.find(
    (c) => c.category === 'base' || c.secondaryCategories?.includes('base')
  );
  const hasIndicator = compounds.find(
    (c) => c.category === 'indicator' || c.secondaryCategories?.includes('indicator')
  );
  const hasCatalyst = compounds.find(
    (c) => c.category === 'catalyst' || c.secondaryCategories?.includes('catalyst')
  );
  const hasMetal = compounds.find((c) => c.category === 'metal');
  const hasOxidizer = compounds.find(
    (c) => c.category === 'oxidizer' || c.secondaryCategories?.includes('oxidizer')
  );
  const hasCarbonate = compounds.find(
    (c) =>
      c.name.toLowerCase().includes('carbonate') ||
      c.name.toLowerCase().includes('bicarbonate') ||
      c.formula.includes('CO₃')
  );
  const hasSulfite = compounds.find(
    (c) => c.name.toLowerCase().includes('sulfite') || c.name.toLowerCase().includes('sulphite') || c.formula.includes('SO₃')
  );
  const hasSulfide = compounds.find(
    (c) => c.name.toLowerCase().includes('sulfide') || c.name.toLowerCase().includes('sulphide')
  );

  // B. Indicator + Acid/Base
  if (hasIndicator && (hasAcid || hasBase)) {
    const target = hasAcid || hasBase!;
    const t = hasIndicator.indicatorTransition;
    const expectedColor = hasAcid
      ? t?.acidColor || 'Acidic indicator form'
      : t?.baseColor || 'Basic indicator form';
    return {
      classification: 'known_non_simulator_reaction',
      markdown:
        `🎨 **Indicator Halochromic Response (${hasIndicator.name} + ${target.name})**:\n\n` +
        `• **Simulator Support Status**: \`Supported in the 3D Virtual Chemistry Lab Simulator\`\n` +
        `• **Reactants**: ${hasIndicator.name} (\`${hasIndicator.formula}\`) + ${target.name} (\`${target.formula}\`)\n` +
        `• **Balanced Equilibrium**: \`HIn(aq) ⇌ H⁺(aq) + In⁻(aq)\` (${t?.transitionRange || 'pH-dependent'})\n` +
        `• **Expected Observation**: Solution shifts to **${expectedColor}** in the presence of ${target.name} (\`${target.formula}\`).`,
    };
  }

  // C. Acid + Carbonate / Bicarbonate (Case 2 if not one of the 4 preset carbonate reactions)
  if (hasAcid && hasCarbonate) {
    return {
      classification: 'known_non_simulator_reaction',
      markdown:
        `🫧 **Acid–Carbonate Gas Evolution (${hasAcid.name} + ${hasCarbonate.name})**:\n\n` +
        `• **Simulator Support Status**: \`Scientific Reference Reaction — Not currently executable as a custom 3D animation for this specific pair\`\n` +
        `• **Reactants**: ${hasAcid.name} (\`${hasAcid.formula}\`) + ${hasCarbonate.name} (\`${hasCarbonate.formula}\`)\n` +
        `• **Products**: Aqueous Salt + Water (\`H₂O(l)\`) + Carbon Dioxide Gas (\`CO₂(g)↑\`)\n` +
        `• **Net Ionic Equation**:\n  \`2H⁺(aq) + CO₃²⁻(aq/s) → H₂O(l) + CO₂(g)↑\`\n` +
        `• **Reaction Type**: Acid–Carbonate Neutralization & Decarboxylation (Gas Evolution)\n` +
        `• **Expected Observations**: Immediate brisk effervescence of colourless, odourless carbon dioxide gas (\`CO₂\`) bubbles accompanied by dissolution of the carbonate salt.`,
    };
  }

  // D. Acid + Sulfite / Sulfide
  if (hasAcid && (hasSulfite || hasSulfide)) {
    const partner = (hasSulfite || hasSulfide)!;
    const isSulfite = Boolean(hasSulfite);
    return {
      classification: 'known_non_simulator_reaction',
      markdown:
        `🫧 **Acid-Driven Gas Evolution (${hasAcid.name} + ${partner.name})**:\n\n` +
        `• **Simulator Support Status**: \`Scientific Reference Reaction — Not currently executable in the 3D beaker simulator\`\n` +
        `• **Reactants**: ${hasAcid.name} (\`${hasAcid.formula}\`) + ${partner.name} (\`${partner.formula}\`)\n` +
        `• **Products**: Aqueous Salt + ${isSulfite ? 'Sulfur Dioxide Gas (`SO₂(g)↑`) + Water (`H₂O(l)`)' : 'Hydrogen Sulfide Gas (`H₂S(g)↑`)'}\n` +
        `• **Net Ionic Equation**:\n  \`${isSulfite ? 'SO₃²⁻(aq) + 2H⁺(aq) → H₂O(l) + SO₂(g)↑' : 'S²⁻(aq/s) + 2H⁺(aq) → H₂S(g)↑'}\`\n` +
        `• **Reaction Type**: Double Displacement with Gas Evolution\n` +
        `• **Expected Observations**: Evolution of ${isSulfite ? 'pungent sulfur dioxide (`SO₂`) bubbles' : 'foul-smelling hydrogen sulfide (`H₂S`) gas'}.`,
    };
  }

  // E. Acid + Base Neutralization (for any non-preset Acid + Base in the 854-compound registry)
  if (hasAcid && hasBase) {
    return {
      classification: 'known_non_simulator_reaction',
      markdown:
        `⚖️ **Acid–Base Neutralization (${hasAcid.name} + ${hasBase.name})**:\n\n` +
        `• **Simulator Support Status**: \`Scientific Reference Reaction — Not currently executable as a custom 3D animation for this specific pair\`\n` +
        `• **Reactants**: ${hasAcid.name} (\`${hasAcid.formula}\`) + ${hasBase.name} (\`${hasBase.formula}\`)\n` +
        `• **Products**: Aqueous Salt + Water (\`H₂O(l)\`)\n` +
        `• **Net Ionic Equation**:\n  \`H⁺(aq) + OH⁻(aq) → H₂O(l)   (ΔH° ≈ -57.3 kJ/mol for strong acid/base)\`\n` +
        `• **Reaction Type**: Brønsted–Lowry Proton Transfer (Exothermic Neutralization)\n` +
        `• **Expected Observations**: Exothermic warming of the solution and pH convergence toward neutrality without gas evolution or precipitation (unless an insoluble salt such as \`BaSO₄\` is formed).`,
    };
  }

  // F. Metal + Acid
  if (hasAcid && hasMetal) {
    const nobleMetals = new Set([
      'au_metal',
      'pt_metal',
      'pt_wire',
      'ag_metal',
      'cu',
      'hg_metal',
      'ir_metal',
      'pd_metal',
      'rh_metal',
      'ru_metal',
      'bi_metal',
      'sb_metal',
    ]);
    const isOxidizingAcid = hasAcid.id === 'hno3';

    if (nobleMetals.has(hasMetal.id) && !isOxidizingAcid) {
      return {
        classification: 'no_reaction_standard_conditions',
        markdown:
          `🔬 **No Reaction Under Standard Conditions (${hasMetal.name} + ${hasAcid.name})**:\n\n` +
          `• **Simulator Support Status**: \`No Reaction Under Standard Aqueous Conditions\`\n` +
          `• **Thermodynamic Basis**: **${hasMetal.name}** (\`${hasMetal.formula}\`) has a positive standard reduction potential (*E°* > 0.00 V vs. SHE) and lies **below hydrogen** in the electrochemical reactivity series.\n` +
          `• **Outcome**: Non-oxidizing acids such as **${hasAcid.name}** (\`${hasAcid.formula}\`) cannot oxidize ${hasMetal.name} to evolve \`H₂(g)\`. To dissolve coinage/noble metals, a strong oxidizing acid (such as concentrated \`HNO₃\` for copper/silver, or *aqua regia* \`3HCl : 1HNO₃\` for gold/platinum) is required.`,
      };
    }

    return {
      classification: 'known_non_simulator_reaction',
      markdown:
        `⚡ **Single Displacement: Active Metal + Acid (${hasMetal.name} + ${hasAcid.name})**:\n\n` +
        `• **Simulator Support Status**: \`Scientific Reference Reaction — Not currently executable as a custom 3D animation for this specific pair\`\n` +
        `• **Reactants**: ${hasMetal.name} (\`${hasMetal.formula}\`) + ${hasAcid.name} (\`${hasAcid.formula}\`)\n` +
        `• **Products**: Aqueous Metal Salt + Hydrogen Gas (\`H₂(g)↑\`)\n` +
        `• **General Ionic Equation**:\n  \`M(s) + 2H⁺(aq) → M²⁺(aq) + H₂(g)↑\`\n` +
        `• **Reaction Type**: Redox Single-Displacement Reaction\n` +
        `• **Expected Observations**: Dissolution of metallic **${hasMetal.name}** accompanied by steady effervescence of colourless hydrogen gas (\`H₂\`) bubbles and exothermic warming.`,
    };
  }

  // G. Salt + Base Hydroxide Precipitation (e.g. NiSO4 + NaOH, CoCl2 + NaOH, ZnSO4 + NaOH)
  const metalSaltForBase = compounds.find(
    (c) =>
      c.category === 'salt' &&
      !['na', 'k_', 'nh4', 'li'].some((prefix) => c.id.startsWith(prefix))
  );
  if (hasBase && metalSaltForBase) {
    return {
      classification: 'known_non_simulator_reaction',
      markdown:
        `❄️ **Metal Hydroxide Precipitation (${metalSaltForBase.name} + ${hasBase.name})**:\n\n` +
        `• **Simulator Support Status**: \`Scientific Reference Reaction — Not currently executable as a custom 3D animation for this specific pair\`\n` +
        `• **Reactants**: ${metalSaltForBase.name} (\`${metalSaltForBase.formula}\`) + ${hasBase.name} (\`${hasBase.formula}\`)\n` +
        `• **Products**: Insoluble Metal Hydroxide Precipitate \`M(OH)ₙ(s)↓\` + Aqueous Alkali Salt\n` +
        `• **General Net Ionic Equation**:\n  \`Mⁿ⁺(aq) + nOH⁻(aq) → M(OH)ₙ(s)↓\`\n` +
        `• **Reaction Type**: Double-Displacement Hydroxide Precipitation\n` +
        `• **Expected Observations**: Immediate formation of a gelatinous or flocculant metal hydroxide precipitate when hydroxide ions exceed the solubility product (*K_sp*).`,
    };
  }

  // H. Salt + Salt Double Displacement Assessment (Insoluble vs All-Soluble Spectator Ions)
  const salts = compounds.filter((c) => c.category === 'salt');
  if (salts.length >= 2) {
    const names = salts.map((s) => `${s.name} (\`${s.formula}\`)`).join(' + ');
    const formulasCombined = salts.map((s) => s.formula).join(' ');

    // Check if an insoluble silver, lead, barium, calcium, or strontium precipitate forms
    const hasAg = /Ag/i.test(formulasCombined);
    const hasPb = /Pb/i.test(formulasCombined);
    const hasBaSrCa = /(Ba|Sr|Ca)/i.test(formulasCombined);
    const hasHalide = /(Cl|Br|I)/i.test(formulasCombined);
    const hasSulfate = /SO₄|SO4/i.test(formulasCombined);
    const hasCarbonateOrChromateOrPhosphateOrSulfide = /(CO₃|CO3|CrO₄|CrO4|PO₄|PO4|\bS\b)/i.test(formulasCombined);

    if (
      (hasAg && (hasHalide || hasCarbonateOrChromateOrPhosphateOrSulfide)) ||
      (hasPb && (hasHalide || hasSulfate || hasCarbonateOrChromateOrPhosphateOrSulfide)) ||
      (hasBaSrCa && (hasSulfate || hasCarbonateOrChromateOrPhosphateOrSulfide))
    ) {
      let pptDetail = 'Insoluble Ionic Salt Precipitate ↓';
      if (hasAg && /Br/.test(formulasCombined)) pptDetail = 'Silver Bromide (`AgBr(s)↓`, pale cream precipitate)';
      else if (hasAg && /Cl/.test(formulasCombined)) pptDetail = 'Silver Chloride (`AgCl(s)↓`, curdy white precipitate)';
      else if (hasAg && /I/.test(formulasCombined)) pptDetail = 'Silver Iodide (`AgI(s)↓`, pale yellow precipitate)';
      else if (hasPb && hasSulfate) pptDetail = 'Lead(II) Sulfate (`PbSO₄(s)↓`, dense white precipitate)';
      else if (hasPb && /CrO/.test(formulasCombined)) pptDetail = 'Lead(II) Chromate (`PbCrO₄(s)↓`, vivid chrome-yellow precipitate)';
      else if (hasPb && /Cl/.test(formulasCombined)) pptDetail = 'Lead(II) Chloride (`PbCl₂(s)↓`, white crystalline precipitate)';
      else if (hasBaSrCa && hasSulfate) pptDetail = 'Alkaline-Earth Sulfate (`BaSO₄ / SrSO₄ / CaSO₄(s)↓`, white precipitate)';
      else if (hasBaSrCa && /CO/.test(formulasCombined)) pptDetail = 'Alkaline-Earth Carbonate (`CaCO₃ / BaCO₃ / SrCO₃(s)↓`, chalky white precipitate)';

      return {
        classification: 'known_non_simulator_reaction',
        markdown:
          `❄️ **Salt Metathesis / Double-Displacement Precipitation (${names})**:\n\n` +
          `• **Simulator Support Status**: \`Scientific Reference Reaction — Not currently executable as a custom 3D animation for this specific pair\`\n` +
          `• **Reactants**: ${names}\n` +
          `• **Insoluble Product**: ${pptDetail} + Soluble Spectator Salt (aq)\n` +
          `• **Reaction Type**: Aqueous Double-Displacement Precipitation (*Q_sp* > *K_sp*)\n` +
          `• **Expected Observations**: Instantaneous cloudiness and settling of an insoluble solid precipitate upon mixing the aqueous salt solutions.`,
      };
    }

    // Otherwise, two soluble salts with all-soluble ion pairs -> Case 3: No Reaction!
    return {
      classification: 'no_reaction_standard_conditions',
      markdown:
        `🔬 **No Chemical Reaction Under Standard Conditions (${names})**:\n\n` +
        `• **Simulator Support Status**: \`No Reaction Under Standard Aqueous Conditions\`\n` +
        `• **Thermodynamic & Solubility Basis**: When ${names} are mixed in aqueous solution, all resulting cation–anion cross-pairs remain completely soluble strong electrolytes (*Q_sp* < *K_sp*).\n` +
        `• **Net Ionic Outcome**: All ions remain dissociated as hydrated spectator ions in solution. No precipitate, gas evolution, weak electrolyte, or redox electron transfer occurs.`,
    };
  }

  // I. Catalyst System Analysis (Case 2)
  if (hasCatalyst) {
    const others = compounds.filter((c) => c.id !== hasCatalyst.id);
    const otherNames = others.map((c) => `${c.name} (\`${c.formula}\`)`).join(' + ');
    return {
      classification: 'known_non_simulator_reaction',
      markdown:
        `⚡ **Catalytic System Analysis (${otherNames} with ${hasCatalyst.name})**:\n\n` +
        `• **Simulator Support Status**: \`Scientific Reference Reaction — Not currently executable in the 3D beaker simulator\`\n` +
        `• **Catalyst**: **${hasCatalyst.name}** (\`${hasCatalyst.formula}\`)\n` +
        `• **Catalytic Role**: ${hasCatalyst.catalyticRole || hasCatalyst.description}\n` +
        (hasCatalyst.exampleReactions?.[0]
          ? `• **Reference Reaction Equation**: \`${hasCatalyst.exampleReactions[0]}\`\n`
          : '') +
        (hasCatalyst.reactionConditions
          ? `• **Required Conditions**: ${hasCatalyst.reactionConditions}\n`
          : '') +
        `• **Simulator Note**: Catalysts are reaction-specific. For live 3D beaker oxygen-evolution catalysis at room temperature, combine **Hydrogen Peroxide (\`H₂O₂\`)** with **Manganese Dioxide (\`MnO₂\`)**, **Potassium Iodide (\`KI\`)**, or **Catalase Enzyme**.`,
    };
  }

  // J. Redox Oxidizer + Partner (Case 2)
  if (hasOxidizer && compounds.length >= 2) {
    const partner = compounds.find((c) => c.id !== hasOxidizer.id)!;
    return {
      classification: 'known_non_simulator_reaction',
      markdown:
        `🔥 **Redox Compatibility & Electron-Transfer Assessment (${hasOxidizer.name} + ${partner.name})**:\n\n` +
        `• **Simulator Support Status**: \`Scientific Reference Reaction — Not currently executable as a custom 3D animation for this specific pair\`\n` +
        `• **Oxidizing Agent**: **${hasOxidizer.name}** (\`${hasOxidizer.formula}\`)\n` +
        `• **Co-Reagent**: **${partner.name}** (\`${partner.formula}\`)\n` +
        `• **Scientific Assessment**: Strong oxidizing agents accept electrons from reducing substrates (often requiring acidic medium \`H₂SO₄\` or thermal activation). Both compounds are catalogued in the canonical registry and can be inspected or added to the beaker if non-restricted.`,
    };
  }

  // Default fallback: Case 3 (No spontaneous reaction under standard conditions)
  const reactantNames = compounds.map((c) => `${c.name} (\`${c.formula}\`)`).join(' and ');
  return {
    classification: 'no_reaction_standard_conditions',
    markdown:
      `🔬 **No Spontaneous Reaction Under Standard Conditions (${reactantNames})**:\n\n` +
      `• **Simulator Support Status**: \`No Reaction Under Standard Aqueous Conditions\`\n` +
      `• **Scientific Basis**: No spontaneous proton transfer, insoluble precipitation (*Q_sp* > *K_sp*), gas evolution, or favorable electron transfer occurs between ${reactantNames} in an ambient aqueous beaker (25°C, 1.0 M).`,
  };
}

/**
 * Unified Chemistry AI Assistant Resolver.
 * Understands exact user intent, resolves canonical registry compounds across all 7 categories,
 * distinguishes all 5 reaction support cases, and never substitutes unrelated preset reactions.
 */
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

  const { matched, ambiguous } = extractCanonicalCompoundsFromQuery(query);

  // 1. Detect explicit Lab Action intents (Add chemical / Load reaction / Run reaction)
  // Note: Pure function never mutates `context.selectedIngredients` directly (preserving TEST 9 isolation),
  // while resolving the exact canonical compounds and reaction so the user or UI action buttons can execute safely.
  const isAddIntent =
    q.startsWith('add ') ||
    q.startsWith('pour ') ||
    q.startsWith('put ') ||
    q.includes('add to beaker') ||
    q.includes('into the beaker');
  const isLoadIntent =
    q.startsWith('load ') ||
    q.includes('load into beaker') ||
    q.includes('load reactants');
  const isRunIntent =
    q === 'run' ||
    q === 'run reaction' ||
    q === 'start reaction' ||
    q === 'execute' ||
    q.startsWith('run the reaction');
  const isClearOrParamCommand =
    q.startsWith('remove ') ||
    q.startsWith('delete ') ||
    q.includes('clear experiment') ||
    q.includes('empty beaker') ||
    (q.includes('change temperature') && /\d+/.test(q)) ||
    (q.includes('set concentration') && /\d+/.test(q));

  if (isClearOrParamCommand || (isRunIntent && matched.length === 0)) {
    return {
      queryType: 'mutation_guard',
      userIntent: isRunIntent ? 'lab_action_run' : 'general_explanation',
      reactionSupportClassification: 'not_applicable',
      replyMarkdown:
        'ℹ️ **Laboratory Control Notice**: To protect your active experiment state, text messages do not silently overwrite or clear your beaker without confirmation.\n\n' +
        '• **To run the current reaction**: Click **"Run Reaction in 3D Beaker"** in the Experiment Builder (or use the **Run Supported Reaction** button on any verified reaction card below).\n' +
        '• **To clear or adjust parameters**: Use the **Reset Beaker** button or the Temperature / Concentration sliders in the Experiment Builder.',
      matchedCompounds: [],
      ambiguousCandidates: [],
      suggestedReactions: [],
      discoveryOptions: [],
      isSimulatorExecutable: false,
      hasRestrictedCompound: false,
    };
  }

  if ((isAddIntent || isLoadIntent) && matched.length === 0 && ambiguous.length === 0) {
    return {
      queryType: 'mutation_guard',
      userIntent: isLoadIntent ? 'lab_action_load' : 'lab_action_add',
      reactionSupportClassification: 'ambiguous_or_insufficient',
      replyMarkdown:
        'ℹ️ **Specify Chemical to Add**: Please name a valid compound or formula from the canonical registry (for example: *"Add Sodium Hydroxide"*, *"Add Hydrochloric Acid"*, or *"Load Lead(II) Nitrate and Potassium Iodide"*), or click any **+ Add to Beaker** button below.',
      matchedCompounds: [],
      ambiguousCandidates: [],
      suggestedReactions: [],
      discoveryOptions: [],
      isSimulatorExecutable: false,
      hasRestrictedCompound: false,
    };
  }

  // 2. Check if query is asking about the CURRENT BEAKER EXPERIMENT
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
    ambiguous.length === 0 &&
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

  if ((isExplicitBeakerQuery || isImplicitBeakerQuery) && !isAddIntent && !isLoadIntent) {
    if (selectedIngredients.length === 0) {
      return {
        queryType: 'beaker_evaluation',
        userIntent: 'beaker_inquiry',
        reactionSupportClassification: 'ambiguous_or_insufficient',
        replyMarkdown:
          '🧪 **Current Beaker Snapshot**: The reaction beaker is currently **empty** (0 reagents loaded).\n\n' +
          'You can ask me about any chemical or reaction across the **854-compound canonical registry**, discover reactions by observation (e.g., *"Find a reaction in which effervescence occurs"*), or click **+ Add to Beaker** on any compound recommendation!',
        matchedCompounds: [],
        ambiguousCandidates: [],
        suggestedReactions: [],
        discoveryOptions: [],
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
        userIntent: 'beaker_inquiry',
        reactionSupportClassification: 'validated_simulator_reaction',
        replyMarkdown:
          `🔬 **Scientific Evaluation for Current Beaker (${ingredientsSummary} at ${conditions.temperature}°C, ${conditions.concentration.toFixed(1)} M)**:\n\n` +
          `• **Simulator Support Status**: \`${evalRes.structuredStatus}\` (Supported in 3D Beaker Simulator)\n` +
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
              ? `Yes, solid forms (${r.observableEffects.precipitateName || r.observableEffects.precipitateColor || 'insoluble solid'})`
              : 'No precipitate (homogeneous)'
          }\n\n` +
          `• **Mechanism**: ${r.explanation}`,
        matchedCompounds: [],
        ambiguousCandidates: [],
        matchedReaction: r,
        suggestedReactions: [r],
        discoveryOptions: [mapReactionToOptionCard(r)],
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
        userIntent: 'beaker_inquiry',
        reactionSupportClassification: 'ambiguous_or_insufficient',
        replyMarkdown:
          `ℹ️ **Current Beaker Status**: \`${evalRes.structuredStatus}\`\n\n` +
          `• **Notice**: ${evalRes.message}\n` +
          `• **Currently Selected**: ${ingredientsSummary}.${suggestionLines}`,
        matchedCompounds: [],
        ambiguousCandidates: [],
        suggestedReactions: compatibleReactions,
        discoveryOptions: compatibleReactions.map(mapReactionToOptionCard),
        isSimulatorExecutable: false,
        hasRestrictedCompound: false,
      };
    }

    return {
      queryType: 'beaker_evaluation',
      userIntent: 'beaker_inquiry',
      reactionSupportClassification: 'no_reaction_standard_conditions',
      replyMarkdown:
        `ℹ️ **Current Beaker Assessment (${ingredientsSummary})**: \`${evalRes.structuredStatus}\`\n\n` +
        `• **Result**: ${evalRes.message}\n\n` +
        `The substances currently in the beaker do not undergo spontaneous electron or proton exchange under standard classroom conditions (${conditions.temperature}°C, ${conditions.concentration.toFixed(1)} M).`,
      matchedCompounds: [],
      ambiguousCandidates: [],
      suggestedReactions: [],
      discoveryOptions: [],
      isSimulatorExecutable: false,
      hasRestrictedCompound: false,
    };
  }

  // 3. Ambiguous Chemical Name Handling (Case 5: e.g. "iron chloride", "copper oxide", or "iron chloride + sodium hydroxide")
  if (ambiguous.length > 1) {
    const partnerText =
      matched.length > 0
        ? ` along with **${matched.map((m) => `${m.name} (${m.formula})`).join(' + ')}**`
        : '';
    const listMd = ambiguous
      .map(
        (c) =>
          `• **${c.name}** (\`${c.formula}\`) — *${c.category.toUpperCase()}${
            c.subcategory ? ` / ${c.subcategory}` : ''
          }* [${c.isRestricted ? 'Restricted' : c.visualLabStatus || 'Selectable'}]`
      )
      .join('\n');

    // If paired with a base like NaOH and ambiguous is Iron Chloride (FeCl2 vs FeCl3), explain both scientifically!
    let comparisonNote = '';
    const hasNaOH = matched.some((m) => m.id === 'naoh' || m.category === 'base');
    if (
      hasNaOH &&
      ambiguous.some((a) => a.id === 'fecl2' || a.id === 'fe_so4') &&
      ambiguous.some((a) => a.id === 'fecl3' || a.id === 'fe2_so4_3')
    ) {
      comparisonNote =
        `\n\n**How Oxidation State Changes the Reaction with Alkali (` +
        `${matched[0].formula})**:\n` +
        `• **Iron(II) (\`Fe²⁺\`)**: Forms a **dark forest-green** gelatinous precipitate of Iron(II) Hydroxide: \`Fe²⁺(aq) + 2OH⁻(aq) → Fe(OH)₂(s)↓\`\n` +
        `• **Iron(III) (\`Fe³⁺\`)**: Forms a **rust reddish-brown** gelatinous precipitate of Iron(III) Hydroxide: \`Fe³⁺(aq) + 3OH⁻(aq) → Fe(OH)₃(s)↓\``;
    }

    const allInvolved = [...ambiguous, ...matched];
    const compatibleRxs = REACTIONS.filter((rx) =>
      ambiguous.some((a) => rx.reactants.includes(a.id)) &&
      (matched.length === 0 || matched.every((m) => rx.reactants.includes(m.id)))
    ).slice(0, 4);

    return {
      queryType: 'ambiguous_compound',
      userIntent: 'ambiguous_query',
      reactionSupportClassification: 'ambiguous_or_insufficient',
      replyMarkdown:
        `🔎 **Clarification Needed — Multiple Canonical Compounds Match (${ambiguous.length} Candidates)**${partnerText}:\n\n` +
        `Your request refers to a chemical name with multiple distinct oxidation states or forms in the registry:\n${listMd}${comparisonNote}\n\n` +
        `Please specify the exact compound name or formula (e.g., Roman numeral oxidation state), or use the action buttons below to select the exact substance you want to load into the beaker.`,
      matchedCompounds: allInvolved,
      ambiguousCandidates: ambiguous,
      matchedReaction: compatibleRxs[0],
      suggestedReactions: compatibleRxs,
      discoveryOptions: compatibleRxs.map(mapReactionToOptionCard),
      isSimulatorExecutable: compatibleRxs.length > 0,
      hasRestrictedCompound: allInvolved.some((c) => !!c.isRestricted),
    };
  }

  // 4. Multi-Compound Query (2 or more canonical compounds mentioned)
  if (matched.length >= 2) {
    const detectedIntent: AssistantUserIntent = isLoadIntent
      ? 'lab_action_load'
      : isAddIntent
      ? 'lab_action_add'
      : isRunIntent
      ? 'lab_action_run'
      : 'reaction_explanation';

    // Case 4: Restricted Hazardous / Radioactive Compound Block
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
        userIntent: detectedIntent,
        reactionSupportClassification: 'restricted_combination',
        replyMarkdown:
          `🛡️ **Safety Restriction Block (${names})**:\n\n` +
          `• **Simulator Support Status**: \`RESTRICTED_HAZARDOUS_REACTION_BLOCKED\`\n` +
          `${restrictedNotes}\n\n` +
          `Interactive beaker loading and reaction execution are disabled for restricted hazardous, pyrophoric, explosive, or radioactive compounds.`,
        matchedCompounds: matched,
        ambiguousCandidates: [],
        suggestedReactions: [],
        discoveryOptions: [],
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

    // Case 1: Validated Simulator Reaction
    if (evalRes.isSupported && evalRes.reaction) {
      const r = evalRes.reaction;
      const reactantNames = matched.map((c) => `${c.name} (${c.formula})`).join(' + ');
      const actionNote =
        detectedIntent === 'lab_action_load' || detectedIntent === 'lab_action_add'
          ? `\n\n✅ **Ready to Load**: Click **"Load ${r.name} into Beaker"** below to populate the Experiment Builder with the exact stoichiometric quantities.`
          : '';
      return {
        queryType: 'multi_compound_reaction',
        userIntent: detectedIntent,
        reactionSupportClassification: 'validated_simulator_reaction',
        replyMarkdown:
          `🔬 **Verified Simulator Reaction (${reactantNames})**:\n\n` +
          `• **Simulator Support Status**: \`${evalRes.structuredStatus}\` (**Supported in the 3D Virtual Chemistry Lab Simulator**)\n` +
          `• **Reaction Name**: **${r.name}**\n` +
          `• **Balanced Chemical Equation**:\n  \`${r.balancedEquation}\`\n` +
          `• **Reactants**: ${r.reactants.map((id) => `${getReagentDisplayInfo(id).name} (\`${getReagentDisplayInfo(id).formula}\`)`).join(' + ')}\n` +
          `• **Products**: ${r.products.join(', ')}\n` +
          `• **Reaction Type**: ${r.reactionType.replace('_', ' ').toUpperCase()}\n` +
          `• **Observable Effects**: ${r.observableEffects.description}\n` +
          `• **Gas / Effervescence**: ${
            r.observableEffects.producesGas
              ? `Yes — ${r.observableEffects.gasName}`
              : 'None (no gas evolved)'
          }\n` +
          `• **Precipitate Formation**: ${
            r.observableEffects.producesPrecipitate
              ? `Yes — ${r.observableEffects.precipitateName || 'Insoluble solid'} (${r.observableEffects.precipitateColor})`
              : 'None (homogeneous solution)'
          }\n` +
          `• **Enthalpy Delta (ΔT)**: ${
            r.observableEffects.temperatureDelta > 0
              ? `+${r.observableEffects.temperatureDelta}°C (Exothermic)`
              : r.observableEffects.temperatureDelta < 0
              ? `${r.observableEffects.temperatureDelta}°C (Endothermic)`
              : '0°C (Thermal equilibrium)'
          }\n` +
          `• **Scientific Mechanism**: ${r.explanation}${actionNote}`,
        matchedCompounds: matched,
        ambiguousCandidates: [],
        matchedReaction: r,
        suggestedReactions: [r],
        discoveryOptions: [mapReactionToOptionCard(r)],
        isSimulatorExecutable: true,
        hasRestrictedCompound: false,
      };
    }

    // Case 2 (Scientifically Known Non-Simulator Reaction) or Case 3 (No Reaction Under Standard Conditions)
    const nonSimEval = evaluateConceptualMultiCompoundInteraction(matched, query);
    return {
      queryType: 'multi_compound_reaction',
      userIntent: detectedIntent,
      reactionSupportClassification: nonSimEval.classification,
      replyMarkdown: nonSimEval.markdown,
      matchedCompounds: matched,
      ambiguousCandidates: [],
      suggestedReactions: [],
      discoveryOptions: [],
      isSimulatorExecutable: false,
      hasRestrictedCompound: false,
    };
  }

  // 5. Reaction Discovery Intent (when 0 or 1 compounds are mentioned and the user asks to find/discover/show a reaction type)
  const isDiscoveryPhrase =
    q.includes('find a reaction') ||
    q.includes('discover a reaction') ||
    q.includes('show me a reaction') ||
    q.includes('give me a reaction') ||
    q.includes('which reaction') ||
    q.includes('suggest a reaction') ||
    q.includes('reaction in which') ||
    q.includes('reaction that forms') ||
    q.includes('reaction with a visible') ||
    q.includes('suitable acid-base') ||
    q.includes('suitable acid base') ||
    q.includes('reaction involving');

  if (isDiscoveryPhrase && matched.length === 0) {
    const discoveryRes = discoverReactions(query);
    if (discoveryRes.options.length > 0) {
      const rxs = discoveryRes.options
        .map((opt) => REACTIONS.find((r) => r.id === opt.id))
        .filter((r): r is ReactionDefinition => Boolean(r));
      const optionBullets = discoveryRes.options
        .map(
          (opt, idx) =>
            `${idx + 1}. **${opt.name}**\n   • **Equation**: \`${opt.balancedEquation}\`\n   • **Observable Result**: ${opt.observableResult}`
        )
        .join('\n\n');

      return {
        queryType: 'reaction_discovery',
        userIntent: 'reaction_discovery',
        reactionSupportClassification: 'validated_simulator_reaction',
        replyMarkdown:
          `🔎 **Verified Reaction Discovery (${discoveryRes.options.length} Supported Simulator Reactions)**:\n\n` +
          `${discoveryRes.message}\n\n${optionBullets}\n\n` +
          `Select any reaction card below and click **"Load Reaction into Experiment"** to populate the 3D Beaker with the exact reactants!`,
        matchedCompounds: [],
        ambiguousCandidates: [],
        matchedReaction: rxs[0],
        suggestedReactions: rxs,
        discoveryOptions: discoveryRes.options,
        isSimulatorExecutable: true,
        hasRestrictedCompound: false,
      };
    }
  }

  // 6. Single Canonical Compound Mentioned
  if (matched.length === 1) {
    const reagent = matched[0];
    const compatible = REACTIONS.filter((rx) => rx.reactants.includes(reagent.id));

    // Check if the user asked an insufficiently specified reaction question (e.g. "What happens when HCl reacts?")
    const isUnderSpecifiedReactionAsk =
      !isAddIntent &&
      !isLoadIntent &&
      (q.includes('what happens when') ||
        q.includes('what happens if') ||
        q.includes('reaction of') ||
        q.includes('reacts') ||
        q.includes('when mixing'));

    if (isUnderSpecifiedReactionAsk) {
      const replyMarkdown =
        `ℹ️ **Additional Reactant Needed for ${reagent.name} (\`${reagent.formula}\`)**:\n\n` +
        `You mentioned **${reagent.name}**, which cannot undergo a bimolecular reaction on its own without a second reactant or specific catalytic/thermal condition.\n\n` +
        formatSingleCompoundResponse(reagent, compatible) +
        `\n\n💡 *Specify a second reagent (e.g., a base, metal, carbonate, or indicator) or choose one of the supported simulator reactions below!*`;

      return {
        queryType: 'single_compound',
        userIntent: 'insufficient_info',
        reactionSupportClassification: 'ambiguous_or_insufficient',
        replyMarkdown,
        matchedCompounds: [reagent],
        ambiguousCandidates: [],
        matchedReaction: compatible[0],
        suggestedReactions: compatible.slice(0, 4),
        discoveryOptions: compatible.slice(0, 4).map(mapReactionToOptionCard),
        isSimulatorExecutable: compatible.length > 0 && !reagent.isRestricted,
        hasRestrictedCompound: !!reagent.isRestricted,
      };
    }

    const replyMarkdown = formatSingleCompoundResponse(reagent, compatible);
    const singleIntent: AssistantUserIntent = isAddIntent
      ? 'lab_action_add'
      : isLoadIntent
      ? 'lab_action_load'
      : 'specific_compound';

    return {
      queryType: isAddIntent ? 'mutation_guard' : 'single_compound',
      userIntent: singleIntent,
      reactionSupportClassification: reagent.isRestricted
        ? 'restricted_combination'
        : compatible.length > 0
        ? 'validated_simulator_reaction'
        : 'not_applicable',
      replyMarkdown:
        isAddIntent && !reagent.isRestricted
          ? `${replyMarkdown}\n\n✅ **Lab Action Available**: Click **"+ Add ${reagent.name} to Beaker"** below to dispense \`${reagent.pourAmount || 20} ${reagent.unit}\` into the active experiment.`
          : replyMarkdown,
      matchedCompounds: [reagent],
      ambiguousCandidates: [],
      matchedReaction: compatible[0],
      suggestedReactions: compatible.slice(0, 4),
      discoveryOptions: compatible.slice(0, 4).map(mapReactionToOptionCard),
      isSimulatorExecutable: compatible.length > 0 && !reagent.isRestricted,
      hasRestrictedCompound: !!reagent.isRestricted,
    };
  }

  // 7. General Theory Questions & Observation Discovery
  if (q.includes('effervesc') || q.includes('bubble') || q.includes('fizz') || q.includes('gas')) {
    const disc = discoverReactions('effervescence');
    const rxs = disc.options
      .map((o) => REACTIONS.find((r) => r.id === o.id))
      .filter((r): r is ReactionDefinition => Boolean(r));
    return {
      queryType: 'general_theory',
      userIntent: isDiscoveryPhrase ? 'reaction_discovery' : 'general_explanation',
      reactionSupportClassification: 'validated_simulator_reaction',
      replyMarkdown:
        '🫧 **Chemistry Concept & Supported Reactions — Effervescence & Gas Evolution**:\n\n' +
        'Effervescence is the rapid nucleation and escape of gas bubbles from an aqueous solution:\n\n' +
        '1. **Carbonate / Bicarbonate + Acid (`CO₂`)**: Protons protonate carbonate or bicarbonate ions into unstable carbonic acid (`H₂CO₃`), which decomposes into water and effervescing carbon dioxide:\n' +
        '   `CO₃²⁻(aq) + 2H⁺(aq) → H₂O(l) + CO₂(g)↑`\n\n' +
        '2. **Active Metal + Acid (`H₂`)**: Electropositive metals (`Mg`, `Zn`, `Fe`) reduce hydronium ions to hydrogen gas:\n' +
        '   `Mg(s) + 2HCl(aq) → MgCl₂(aq) + H₂(g)↑`\n\n' +
        '3. **Catalytic Peroxide Decomposition (`O₂`)**: Hydrogen peroxide disproportionates rapidly into water and oxygen gas when catalyzed by `MnO₂`, `KI`, or `Catalase`.',
      matchedCompounds: [],
      ambiguousCandidates: [],
      matchedReaction: rxs[0],
      suggestedReactions: rxs,
      discoveryOptions: disc.options,
      isSimulatorExecutable: true,
      hasRestrictedCompound: false,
    };
  }

  if (q.includes('precipitat') || q.includes('insoluble') || q.includes('solid form') || q.includes('cloudy')) {
    const disc = discoverReactions('precipitate');
    const rxs = disc.options
      .map((o) => REACTIONS.find((r) => r.id === o.id))
      .filter((r): r is ReactionDefinition => Boolean(r));
    return {
      queryType: 'general_theory',
      userIntent: isDiscoveryPhrase ? 'reaction_discovery' : 'general_explanation',
      reactionSupportClassification: 'validated_simulator_reaction',
      replyMarkdown:
        '❄️ **Chemistry Concept & Supported Reactions — Precipitate Formation & Solubility Rules**:\n\n' +
        'A precipitate is an insoluble ionic solid that nucleates when two aqueous solutions are mixed and the ion product (*Q_sp*) exceeds the solubility product constant (**K_sp**):\n\n' +
        '• **Silver Chloride (`AgCl(s)↓`)**: Dense curdy white precipitate (`AgNO₃ + NaCl`, *K_sp* = 1.8 × 10⁻¹⁰).\n' +
        '• **Lead(II) Iodide (`PbI₂(s)↓`)**: Glittering golden-yellow crystalline platelets ("Golden Rain", `Pb(NO₃)₂ + 2KI`).\n' +
        '• **Barium Sulfate (`BaSO₄(s)↓`)**: Heavy porcelain-white precipitate (`BaCl₂ + H₂SO₄`, *K_sp* = 1.1 × 10⁻¹⁰).\n' +
        '• **Copper(II) Hydroxide (`Cu(OH)₂(s)↓`)**: Sky-blue gelatinous precipitate (`CuSO₄ + 2NaOH`).',
      matchedCompounds: [],
      ambiguousCandidates: [],
      matchedReaction: rxs[0],
      suggestedReactions: rxs,
      discoveryOptions: disc.options,
      isSimulatorExecutable: true,
      hasRestrictedCompound: false,
    };
  }

  if (q.includes('colour') || q.includes('color') || q.includes('indicator')) {
    const disc = discoverReactions('colour change');
    const rxs = disc.options
      .map((o) => REACTIONS.find((r) => r.id === o.id))
      .filter((r): r is ReactionDefinition => Boolean(r));
    return {
      queryType: 'general_theory',
      userIntent: isDiscoveryPhrase ? 'reaction_discovery' : 'general_explanation',
      reactionSupportClassification: 'validated_simulator_reaction',
      replyMarkdown:
        '🎨 **Chemistry Concept & Supported Reactions — Observable Color Transitions & Indicators**:\n\n' +
        'Visible color changes in aqueous chemistry arise from pH-driven indicator conjugation shifts, transition-metal *d–d* ligand-field changes, or charge-transfer complexes:\n\n' +
        '• **Phenolphthalein + Alkali (`NaOH`)**: Colourless lactone ring opens into a vivid magenta-fuchsia quinoid dianion (pH > 8.2).\n' +
        '• **Universal Indicator + Acid (`HCl`)**: Shifts from neutral emerald-green (pH 7) to crimson red (pH ~1).\n' +
        '• **Iron + Copper(II) Sulfate (`Fe + CuSO₄`)**: Azure-blue `[Cu(H₂O)₆]²⁺` transitions to pale sea-green `[Fe(H₂O)₆]²⁺` while depositing reddish-brown `Cu(s)`.',
      matchedCompounds: [],
      ambiguousCandidates: [],
      matchedReaction: rxs[0],
      suggestedReactions: rxs,
      discoveryOptions: disc.options,
      isSimulatorExecutable: true,
      hasRestrictedCompound: false,
    };
  }

  if (q.includes('catalyst') || q.includes('cataly')) {
    const disc = discoverReactions('catalyst');
    const rxs = disc.options
      .map((o) => REACTIONS.find((r) => r.id === o.id))
      .filter((r): r is ReactionDefinition => Boolean(r));
    return {
      queryType: 'general_theory',
      userIntent: 'general_explanation',
      reactionSupportClassification: 'validated_simulator_reaction',
      replyMarkdown:
        '⚡ **General Educational Chemistry Theory: Role of Catalysts in Reactions**:\n\n' +
        'A catalyst accelerates the rate of a chemical reaction by providing an alternative mechanistic pathway with a lower **activation energy (E_a)** without being consumed stoichiometrically.\n\n' +
        '• **Heterogeneous Catalysts**: Solid surface catalysts such as **Manganese Dioxide (`MnO₂`)**, **Finely Divided Nickel (`Ni`)**, **Vanadium(V) Oxide (`V₂O₅`)**, **Promoted Iron (`Fe`)**, and **Zeolites (`ZSM-5`)**.\n' +
        '• **Homogeneous & Organometallic Catalysts**: Soluble complexes such as **Wilkinson’s Catalyst**, **Grubbs Catalyst**, and **Potassium Iodide (`KI`)**.\n' +
        '• **Biocatalysts (Enzymes)**: High-turnover biological enzymes such as **Catalase**, **Amylase**, and **Urease**.',
      matchedCompounds: [],
      ambiguousCandidates: [],
      matchedReaction: rxs[0],
      suggestedReactions: rxs,
      discoveryOptions: disc.options,
      isSimulatorExecutable: true,
      hasRestrictedCompound: false,
    };
  }

  if (q.includes('redox') || q.includes('oxidation') || q.includes('reduction') || q.includes('displac')) {
    const disc = discoverReactions('redox');
    const rxs = disc.options
      .map((o) => REACTIONS.find((r) => r.id === o.id))
      .filter((r): r is ReactionDefinition => Boolean(r));
    return {
      queryType: 'general_theory',
      userIntent: isDiscoveryPhrase ? 'reaction_discovery' : 'general_explanation',
      reactionSupportClassification: 'validated_simulator_reaction',
      replyMarkdown:
        '⚡ **General Educational Chemistry Theory: Oxidation–Reduction (Redox) Reactions**:\n\n' +
        'A redox reaction involves the transfer of electrons between chemical species:\n\n' +
        '• **Oxidation**: Loss of electrons (increase in oxidation state).\n' +
        '• **Reduction**: Gain of electrons (decrease in oxidation state).\n' +
        '• **Oxidizing Agent (Oxidant)**: Species that accepts electrons (e.g., `KMnO₄`, `K₂Cr₂O₇`, `HNO₃`, `H₂O₂`, `NaOCl`).\n' +
        '• **Reducing Agent (Reductant)**: Species that donates electrons (e.g., active metals `Mg`, `Zn`, `Fe`, oxalic acid `H₂C₂O₄`, thiosulfate `Na₂S₂O₃`).',
      matchedCompounds: [],
      ambiguousCandidates: [],
      matchedReaction: rxs[0],
      suggestedReactions: rxs,
      discoveryOptions: disc.options,
      isSimulatorExecutable: true,
      hasRestrictedCompound: false,
    };
  }

  if (q.includes('neutral') || q.includes('acid') || q.includes('base') || q.includes('ph')) {
    const disc = discoverReactions('neutralization');
    const rxs = disc.options
      .map((o) => REACTIONS.find((r) => r.id === o.id))
      .filter((r): r is ReactionDefinition => Boolean(r));
    return {
      queryType: 'general_theory',
      userIntent: isDiscoveryPhrase ? 'reaction_discovery' : 'general_explanation',
      reactionSupportClassification: 'validated_simulator_reaction',
      replyMarkdown:
        '⚖️ **General Educational Chemistry Theory: Acid–Base Neutralization & Indicators**:\n\n' +
        'Neutralization is a Brønsted–Lowry proton transfer reaction where an acid (proton donor) reacts with a base (hydroxide donor or proton acceptor):\n\n' +
        '• **Net Ionic Equation**: `H⁺(aq) + OH⁻(aq) → H₂O(l) + ΔH (-57.3 kJ/mol)`\n' +
        '• **Exothermic Nature**: Strong acid–strong base neutralization releases ~57.3 kJ/mol, increasing solution temperature.\n' +
        '• **Indicators**: Halochromic indicators such as **Phenolphthalein**, **Methyl Orange**, and **Bromothymol Blue** change color across specific pH transition ranges.',
      matchedCompounds: [],
      ambiguousCandidates: [],
      matchedReaction: rxs[0],
      suggestedReactions: rxs,
      discoveryOptions: disc.options,
      isSimulatorExecutable: true,
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
      userIntent: 'general_explanation',
      reactionSupportClassification: 'not_applicable',
      replyMarkdown:
        '🛡️ **General Educational Chemistry Theory: Laboratory Safety & Standards**:\n\n' +
        'In educational science laboratories, personal protective equipment (PPE) is mandatory:\n' +
        '• Wear splash goggles, nitrile gloves, and a lab coat.\n' +
        '• Always add concentrated acid to water slowly, never water into acid.\n' +
        '• Restricted hazardous, pyrophoric, or radioactive substances (e.g., `HF`, `HCN`, `OsO₄`, `Polonium`, `Uranium` salts) are catalogued for reference only and blocked from interactive mixing.',
      matchedCompounds: [],
      ambiguousCandidates: [],
      suggestedReactions: [],
      discoveryOptions: [],
      isSimulatorExecutable: false,
      hasRestrictedCompound: false,
    };
  }

  return {
    queryType: 'general_theory',
    userIntent: 'general_explanation',
    reactionSupportClassification: 'not_applicable',
    replyMarkdown:
      `🎓 **Chemistry Science Advisor & Reaction Assistant**:\n\n` +
      `You asked: *"${query}"*.\n\n` +
      `You can ask me about any of the **854 canonical compounds** across all 7 categories (Acids, Bases, Salts & Solutions, Metals, Oxidizers, Indicators, Catalysts), request custom reaction predictions (e.g., *"What happens when lead(II) nitrate reacts with potassium iodide?"* or *"Oxalic acid + KMnO4"*), or discover reactions by observation!`,
    matchedCompounds: [],
    ambiguousCandidates: [],
    suggestedReactions: [],
    discoveryOptions: [],
    isSimulatorExecutable: false,
    hasRestrictedCompound: false,
  };
}
