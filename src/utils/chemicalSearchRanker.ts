import { ChemicalReagent, ReactionDefinition } from '../types/chemistry';
import { normalizeChemicalSearchText } from '../data/compoundRegistry';
import { REACTIONS } from '../data/reactionsData';

export interface ChemicalSearchResult {
  directMatches: ChemicalReagent[];
  relatedCompounds: Array<{
    compound: ChemicalReagent;
    relationReason: string;
    relationshipType: 'reaction_partner' | 'same_ion' | 'family_class' | 'catalyst_partner';
  }>;
}

/**
 * Standardizes formulas for exact comparison by converting subscripts to ASCII digits
 * and stripping phases like (aq), (s), (l), (g) and punctuation.
 */
function cleanFormulaForMatching(formula: string): string {
  return normalizeChemicalSearchText(formula)
    .replace(/\((aq|s|l|g)\)/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

/**
 * Standardizes compound names by converting to lowercase and stripping punctuation.
 */
function cleanNameForMatching(name: string): string {
  return normalizeChemicalSearchText(name)
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates a strict relevance score for ranking chemical search results.
 * Higher score = higher ranking.
 * Exact formula/name matches receive scores from 8,000 to 10,000.
 */
function calculateCompoundRelevanceScore(
  compound: ChemicalReagent,
  rawQuery: string,
  cleanQuery: string,
  cleanFormulaQuery: string
): number {
  const normName = normalizeChemicalSearchText(compound.name);
  const cleanName = cleanNameForMatching(compound.name);
  const normFormula = normalizeChemicalSearchText(compound.formula);
  const cleanFormula = cleanFormulaForMatching(compound.formula);
  const normId = normalizeChemicalSearchText(compound.id);
  const cleanId = cleanFormulaForMatching(compound.id);

  // 1. Exact Formula Match (Case-insensitive or clean formula match) -> Top priority 10,000
  if (
    cleanFormula === cleanFormulaQuery ||
    normFormula.startsWith(cleanQuery + ' ') ||
    normFormula === cleanQuery
  ) {
    return 10000;
  }

  // 2. Exact Compound Name Match -> 9,500
  if (normName === cleanQuery || cleanName === cleanQuery) {
    return 9500;
  }

  // 3. Exact Reagent ID Match -> 9,000
  if (normId === cleanQuery || cleanId === cleanFormulaQuery) {
    return 9000;
  }

  // 4. Exact Alias / Common Name Match (e.g. "table salt", "baking soda", "potash") -> 8,500
  // Filter out descriptive reaction phrases like "H₂O₂ decomposition" from being treated as compound aliases
  const isReactionPhrase = (text: string) =>
    /\b(decomposition|catalysis|reaction|indicator for|test for|synthesis)\b/i.test(text);

  const directAliases = (compound.aliases || [])
    .filter((a) => !isReactionPhrase(a))
    .map((a) => normalizeChemicalSearchText(a));

  if (directAliases.some((a) => a === cleanQuery || cleanNameForMatching(a) === cleanQuery)) {
    return 8500;
  }

  // 5. Formula Starts With Query (e.g. "Cu" -> CuSO4, CuCl2, CuO; "Na" -> NaCl, NaOH) -> 7,500
  if (cleanFormulaQuery.length >= 1 && cleanFormula.startsWith(cleanFormulaQuery)) {
    // Shorter formulas closer to query get a slight boost
    const lengthPenalty = Math.min(500, (cleanFormula.length - cleanFormulaQuery.length) * 40);
    return 7500 - lengthPenalty;
  }

  // 6. Name Starts With Query (e.g. "sod" -> "Sodium Chloride", "Sodium Hydroxide") -> 6,500
  if (normName.startsWith(cleanQuery)) {
    return 6500;
  }

  // 7. Word in Compound Name Starts With Query (e.g. "acid" -> "Hydrochloric Acid") -> 5,500
  const nameWords = cleanName.split(/\s+/);
  if (nameWords.some((w) => w === cleanQuery)) {
    return 5500; // Exact word match
  }
  if (nameWords.some((w) => w.startsWith(cleanQuery))) {
    return 5000; // Word prefix match
  }

  // 8. Word in Direct Alias Matches -> 4,500
  const aliasWords = directAliases.flatMap((a) => cleanNameForMatching(a).split(/\s+/));
  if (aliasWords.some((w) => w === cleanQuery)) {
    return 4500;
  }
  if (aliasWords.some((w) => w.startsWith(cleanQuery))) {
    return 4000;
  }

  // 9. Substring in Name -> 3,000
  if (normName.includes(cleanQuery)) {
    return 3000;
  }

  // 10. Substring in Formula -> 2,500
  if (cleanFormula.includes(cleanFormulaQuery) && cleanFormulaQuery.length >= 2) {
    return 2500;
  }

  // 11. Subcategory, Role, or Category Label match (e.g. "Acid", "Base", "Salt", "Oxidizer") -> 1,500
  const metaText = [
    compound.subcategory,
    compound.role,
    compound.categoryLabel,
    compound.type,
  ]
    .filter(Boolean)
    .map((t) => normalizeChemicalSearchText(t as string))
    .join(' ');

  if (metaText.includes(cleanQuery)) {
    return 1500;
  }

  // 12. Catalytic role or description match -> 400 (lower score; candidate for related results)
  const descText = [compound.catalyticRole, compound.description]
    .filter(Boolean)
    .map((t) => normalizeChemicalSearchText(t as string))
    .join(' ');
  if (descText.includes(cleanQuery)) {
    return 400;
  }

  return 0;
}

/**
 * Maps known educational reaction partners between compounds based on verified
 * reaction definitions and curriculum chemistry principles.
 */
function findReactionPartners(
  targetCompound: ChemicalReagent,
  allReagentsMap: Map<string, ChemicalReagent>
): Array<{ compound: ChemicalReagent; relationReason: string }> {
  const targetId = targetCompound.id;
  const targetFormulaClean = cleanFormulaForMatching(targetCompound.formula);
  const partners: Array<{ compound: ChemicalReagent; relationReason: string }> = [];
  const seenIds = new Set<string>();

  // 1. Scan verified laboratory reactions
  for (const rx of REACTIONS) {
    const isReactant =
      rx.reactants.includes(targetId) ||
      rx.reactants.some((rid) => cleanFormulaForMatching(rid) === targetFormulaClean);

    if (isReactant) {
      // All other reactants in this reaction are direct reaction partners
      for (const otherId of rx.reactants) {
        if (otherId === targetId) continue;
        if (seenIds.has(otherId)) continue;

        const partner = allReagentsMap.get(otherId);
        if (partner) {
          seenIds.add(otherId);
          let reason = 'Reaction Partner';
          if (rx.reactionType === 'neutralization') {
            reason = 'Neutralization Partner';
          } else if (rx.reactionType === 'precipitation') {
            reason = 'Precipitation Co-Reactant';
          } else if (rx.reactionType === 'redox') {
            reason = 'Redox Reaction Partner';
          } else if (rx.reactionType === 'single_displacement') {
            reason = 'Metal Displacement Partner';
          } else if (rx.reactionType === 'gas_evolution' || (rx.reactionType as string) === 'carbonate_acid') {
            reason = 'Gas-Producing Co-Reactant';
          } else if (rx.reactionType === 'decomposition') {
            reason = 'Decomposition Catalyst / Reagent';
          }

          partners.push({
            compound: partner,
            relationReason: `${reason} (${rx.name.split(' ')[0]} reaction)`,
          });
        }
      }

      // Check compatible catalysts if specified
      const catalysts = (rx as any).compatibleCatalysts as string[] | undefined;
      if (catalysts && Array.isArray(catalysts)) {
        for (const catId of catalysts) {
          if (catId === targetId || seenIds.has(catId)) continue;
          const cat = allReagentsMap.get(catId);
          if (cat) {
            seenIds.add(catId);
            partners.push({
              compound: cat,
              relationReason: `Catalytic Partner for ${targetCompound.formula}`,
            });
          }
        }
      }
    }
  }

  return partners;
}

/**
 * Discovers related compounds by cation, anion, or chemical family.
 */
function findIonAndFamilyRelatives(
  targetCompound: ChemicalReagent,
  allReagents: ChemicalReagent[],
  excludeIds: Set<string>
): Array<{ compound: ChemicalReagent; relationReason: string; relationshipType: 'same_ion' | 'family_class' | 'catalyst_partner' }> {
  const relatives: Array<{ compound: ChemicalReagent; relationReason: string; relationshipType: 'same_ion' | 'family_class' | 'catalyst_partner' }> = [];
  const targetFormula = cleanFormulaForMatching(targetCompound.formula);
  const targetName = cleanNameForMatching(targetCompound.name);

  // Common cations and their symbols
  const cations = [
    { name: 'sodium', symbol: 'na', label: 'Sodium Salt (Na⁺)' },
    { name: 'potassium', symbol: 'k', label: 'Potassium Salt (K⁺)' },
    { name: 'copper', symbol: 'cu', label: 'Copper Compound (Cu²⁺)' },
    { name: 'iron', symbol: 'fe', label: 'Iron Compound (Fe²⁺/Fe³⁺)' },
    { name: 'lead', symbol: 'pb', label: 'Lead Compound (Pb²⁺)' },
    { name: 'zinc', symbol: 'zn', label: 'Zinc Compound (Zn²⁺)' },
    { name: 'magnesium', symbol: 'mg', label: 'Magnesium Compound (Mg²⁺)' },
    { name: 'calcium', symbol: 'ca', label: 'Calcium Compound (Ca²⁺)' },
    { name: 'silver', symbol: 'ag', label: 'Silver Compound (Ag⁺)' },
    { name: 'barium', symbol: 'ba', label: 'Barium Compound (Ba²⁺)' },
    { name: 'ammonium', symbol: 'nh4', label: 'Ammonium Salt (NH₄⁺)' },
  ];

  // Common anions and their symbols
  const anions = [
    { name: 'chloride', symbol: 'cl', label: 'Chloride Solution (Cl⁻)' },
    { name: 'sulfate', symbol: 'so4', label: 'Sulfate Solution (SO₄²⁻)' },
    { name: 'nitrate', symbol: 'no3', label: 'Nitrate Solution (NO₃⁻)' },
    { name: 'carbonate', symbol: 'co3', label: 'Carbonate / Bicarbonate' },
    { name: 'hydroxide', symbol: 'oh', label: 'Hydroxide Base (OH⁻)' },
    { name: 'iodide', symbol: 'i', label: 'Iodide Compound (I⁻)' },
  ];

  // Check matching cation
  for (const cat of cations) {
    const targetHasCation =
      targetName.includes(cat.name) ||
      targetFormula.startsWith(cat.symbol) ||
      targetCompound.id.startsWith(cat.symbol);

    if (targetHasCation) {
      for (const cand of allReagents) {
        if (excludeIds.has(cand.id)) continue;
        const candName = cleanNameForMatching(cand.name);
        const candFormula = cleanFormulaForMatching(cand.formula);
        if (
          cand.id !== targetCompound.id &&
          (candName.includes(cat.name) ||
            candFormula.startsWith(cat.symbol) ||
            cand.id.startsWith(cat.symbol))
        ) {
          relatives.push({
            compound: cand,
            relationReason: `Same Family: ${cat.label}`,
            relationshipType: 'same_ion',
          });
          excludeIds.add(cand.id);
        }
      }
      break;
    }
  }

  // Check matching anion
  for (const an of anions) {
    const targetHasAnion =
      targetName.includes(an.name) ||
      targetFormula.includes(an.symbol) ||
      targetCompound.id.includes(an.symbol);

    if (targetHasAnion) {
      for (const cand of allReagents) {
        if (excludeIds.has(cand.id)) continue;
        const candName = cleanNameForMatching(cand.name);
        const candFormula = cleanFormulaForMatching(cand.formula);
        if (
          cand.id !== targetCompound.id &&
          (candName.includes(an.name) ||
            candFormula.includes(an.symbol) ||
            cand.id.includes(an.symbol))
        ) {
          relatives.push({
            compound: cand,
            relationReason: `Related: ${an.label}`,
            relationshipType: 'same_ion',
          });
          excludeIds.add(cand.id);
        }
      }
      break;
    }
  }

  // Check functional family: Acids, Bases, Reactive Metals, Catalysts, Indicators
  if (targetCompound.type === 'acid' || targetCompound.category === 'acid') {
    // Show neutralizing bases and key curriculum acids
    for (const cand of allReagents) {
      if (excludeIds.has(cand.id)) continue;
      if (cand.type === 'base' || cand.category === 'base') {
        relatives.push({
          compound: cand,
          relationReason: 'Neutralizing Base for Acid',
          relationshipType: 'family_class',
        });
        excludeIds.add(cand.id);
      } else if (cand.type === 'acid' || cand.category === 'acid') {
        relatives.push({
          compound: cand,
          relationReason: 'Related Curriculum Acid',
          relationshipType: 'family_class',
        });
        excludeIds.add(cand.id);
      }
    }
  } else if (targetCompound.type === 'base' || targetCompound.category === 'base') {
    // Show acids and pH indicators
    for (const cand of allReagents) {
      if (excludeIds.has(cand.id)) continue;
      if (cand.type === 'acid' || cand.category === 'acid') {
        relatives.push({
          compound: cand,
          relationReason: 'Acid Neutralizer',
          relationshipType: 'family_class',
        });
        excludeIds.add(cand.id);
      } else if (cand.type === 'indicator' || cand.category === 'indicator') {
        relatives.push({
          compound: cand,
          relationReason: 'Visual pH Indicator',
          relationshipType: 'family_class',
        });
        excludeIds.add(cand.id);
      }
    }
  } else if (targetCompound.type === 'metal' || targetCompound.type === 'alkali_metal' || targetCompound.category === 'metal') {
    // Show Reactivity Series metals & acids
    for (const cand of allReagents) {
      if (excludeIds.has(cand.id)) continue;
      if (
        cand.id !== targetCompound.id &&
        (cand.type === 'metal' || cand.type === 'alkali_metal' || cand.category === 'metal')
      ) {
        relatives.push({
          compound: cand,
          relationReason: 'Reactivity Series Metal',
          relationshipType: 'family_class',
        });
        excludeIds.add(cand.id);
      } else if (cand.id === 'hcl' || cand.id === 'h2so4' || cand.id === 'hno3') {
        relatives.push({
          compound: cand,
          relationReason: 'Acid for Metal Reactivity Test',
          relationshipType: 'family_class',
        });
        excludeIds.add(cand.id);
      }
    }
  } else if (targetCompound.category === 'catalyst' || targetCompound.type === 'catalyst') {
    // Show decomposition substrates (e.g. H2O2) and other catalysts
    for (const cand of allReagents) {
      if (excludeIds.has(cand.id)) continue;
      if (cand.id === 'h2o2') {
        relatives.push({
          compound: cand,
          relationReason: 'Decomposition Reactant (Substrate)',
          relationshipType: 'catalyst_partner',
        });
        excludeIds.add(cand.id);
      } else if (cand.category === 'catalyst' || cand.type === 'catalyst') {
        relatives.push({
          compound: cand,
          relationReason: 'Related Chemical Catalyst',
          relationshipType: 'catalyst_partner',
        });
        excludeIds.add(cand.id);
      }
    }
  }

  return relatives;
}

/**
 * Main intelligent ranking and related chemical search algorithm.
 * Guarantees that exact formula and name matches appear at rank #1,
 * and surfaces educational co-reactants and related compounds in the library.
 */
export function rankChemicalSearchResults(
  searchQuery: string,
  allReagents: ChemicalReagent[],
  activeCategory: string = 'all'
): ChemicalSearchResult {
  const rawQuery = searchQuery.trim();
  if (!rawQuery) {
    // Empty search: apply active category filter and return natural order
    const filtered = allReagents.filter((r) => {
      if (activeCategory === 'all') return true;
      const hasSecondary = Boolean(
        r.secondaryCategories?.includes(activeCategory as any) ||
          r.sourceCategories?.includes(activeCategory)
      );
      return (
        r.category === activeCategory ||
        hasSecondary ||
        (activeCategory === 'acid' && r.type === 'acid') ||
        (activeCategory === 'base' && r.type === 'base') ||
        (activeCategory === 'salt' &&
          (r.id === 'water' ||
            r.category === 'salt' ||
            r.type === 'salt' ||
            r.type === 'carbonate' ||
            r.type === 'reagent' ||
            r.type === 'reducing_agent')) ||
        (activeCategory === 'metal' && (r.type === 'metal' || r.type === 'alkali_metal')) ||
        (activeCategory === 'oxidizer' &&
          (r.type === 'oxidizer' || (r.category as string) === 'oxidizing_agent')) ||
        (activeCategory === 'indicator' && r.type === 'indicator') ||
        (activeCategory === 'catalyst' &&
          (r.category === 'catalyst' ||
            r.type === 'catalyst' ||
            Boolean(r.secondaryCategories?.includes('catalyst'))))
      );
    });
    return {
      directMatches: filtered,
      relatedCompounds: [],
    };
  }

  const cleanQuery = normalizeChemicalSearchText(rawQuery);
  const cleanFormulaQuery = cleanFormulaForMatching(rawQuery);

  // 1. Score all available reagents for direct search match
  const scoredDirect: Array<{ compound: ChemicalReagent; score: number }> = [];
  const descriptionOnlyMatches: Array<{ compound: ChemicalReagent; score: number }> = [];

  for (const r of allReagents) {
    const score = calculateCompoundRelevanceScore(r, rawQuery, cleanQuery, cleanFormulaQuery);
    if (score >= 1000) {
      if (activeCategory !== 'all') {
        const hasSecondary = Boolean(
          r.secondaryCategories?.includes(activeCategory as any) ||
            r.sourceCategories?.includes(activeCategory)
        );
        const matchesCat =
          r.category === activeCategory ||
          hasSecondary ||
          (activeCategory === 'acid' && r.type === 'acid') ||
          (activeCategory === 'base' && r.type === 'base') ||
          (activeCategory === 'salt' &&
            (r.id === 'water' ||
              r.category === 'salt' ||
              r.type === 'salt' ||
              r.type === 'carbonate' ||
              r.type === 'reagent' ||
              r.type === 'reducing_agent')) ||
          (activeCategory === 'metal' && (r.type === 'metal' || r.type === 'alkali_metal')) ||
          (activeCategory === 'oxidizer' &&
            (r.type === 'oxidizer' || (r.category as string) === 'oxidizing_agent')) ||
          (activeCategory === 'indicator' && r.type === 'indicator') ||
          (activeCategory === 'catalyst' &&
            (r.category === 'catalyst' ||
              r.type === 'catalyst' ||
              Boolean(r.secondaryCategories?.includes('catalyst'))));
        if (!matchesCat) continue;
      }
      scoredDirect.push({ compound: r, score });
    } else if (score >= 500) {
      descriptionOnlyMatches.push({ compound: r, score });
    }
  }

  // If no strong (>= 1000) match was found, fall back to description matches as direct
  if (scoredDirect.length === 0 && descriptionOnlyMatches.length > 0) {
    scoredDirect.push(...descriptionOnlyMatches);
  }

  // Sort direct matches descending by score: Top exact matches ALWAYS first!
  scoredDirect.sort((a, b) => b.score - a.score);

  // Deduplicate direct matches by unique compound ID
  const seenDirectIds = new Set<string>();
  const directMatches: ChemicalReagent[] = [];
  for (const s of scoredDirect) {
    if (!seenDirectIds.has(s.compound.id)) {
      seenDirectIds.add(s.compound.id);
      directMatches.push(s.compound);
    }
  }

  // 2. Discover related compounds (co-reactants, same ions, family relatives)
  const reagentsMap = new Map<string, ChemicalReagent>();
  allReagents.forEach((r) => reagentsMap.set(r.id, r));

  const directIds = new Set(directMatches.map((d) => d.id));
  const relatedResults: Array<{
    compound: ChemicalReagent;
    relationReason: string;
    relationshipType: 'reaction_partner' | 'same_ion' | 'family_class' | 'catalyst_partner';
  }> = [];
  const seenRelatedIds = new Set<string>();

  // Use top 3 direct matches as anchors for finding related items
  const anchorCompounds = directMatches.slice(0, 3);

  // If the query or any top anchor is hydrogen peroxide, prioritize known catalysts
  if (
    cleanFormulaQuery === 'h2o2' ||
    anchorCompounds.some((a) => a.id === 'h2o2' || cleanFormulaForMatching(a.formula) === 'h2o2')
  ) {
    for (const catId of ['mno2', 'ki', 'catalase_enzyme']) {
      const cat = reagentsMap.get(catId);
      if (cat && !directIds.has(cat.id) && !seenRelatedIds.has(cat.id)) {
        seenRelatedIds.add(cat.id);
        relatedResults.push({
          compound: cat,
          relationReason: 'Catalyst for H₂O₂ Decomposition (Elephant Toothpaste)',
          relationshipType: 'catalyst_partner',
        });
      }
    }
  }

  // If no direct matches were found (e.g., query was general like "acids" or "chlorides"),
  // find reagents matching that category/ion keyword
  if (anchorCompounds.length === 0) {
    for (const r of allReagents) {
      const rName = cleanNameForMatching(r.name);
      const rDesc = cleanNameForMatching(r.description || '');
      if (rName.includes(cleanQuery) || rDesc.includes(cleanQuery)) {
        if (!seenRelatedIds.has(r.id)) {
          seenRelatedIds.add(r.id);
          relatedResults.push({
            compound: r,
            relationReason: `Related to "${rawQuery}"`,
            relationshipType: 'family_class',
          });
          if (relatedResults.length >= 8) break;
        }
      }
    }
  } else {
    // Find reaction partners first (most valuable in chemistry lab)
    for (const anchor of anchorCompounds) {
      const rxPartners = findReactionPartners(anchor, reagentsMap);
      for (const p of rxPartners) {
        if (!directIds.has(p.compound.id) && !seenRelatedIds.has(p.compound.id)) {
          seenRelatedIds.add(p.compound.id);
          relatedResults.push({
            compound: p.compound,
            relationReason: p.relationReason,
            relationshipType: 'reaction_partner',
          });
        }
      }
    }

    // Find ion & family relatives
    for (const anchor of anchorCompounds) {
      const ionRelatives = findIonAndFamilyRelatives(anchor, allReagents, seenRelatedIds);
      for (const ir of ionRelatives) {
        if (!directIds.has(ir.compound.id) && !seenRelatedIds.has(ir.compound.id)) {
          seenRelatedIds.add(ir.compound.id);
          relatedResults.push(ir);
        }
      }
    }
  }

  return {
    directMatches,
    relatedCompounds: relatedResults.slice(0, 10), // Limit to top 10 most helpful related compounds
  };
}
