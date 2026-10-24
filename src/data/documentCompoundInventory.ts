import {
  ChemicalCategory,
  ChemicalReagent,
  ReagentCategory,
  SafetyClassification,
  VisualLabStatus,
} from '../types/chemistry';
import { ACIDS_RAW_TUPLES, RawDocTuple } from './inventory/acidsInventory';
import { BASES_RAW_TUPLES, SALTS_RAW_TUPLES } from './inventory/basesAndSaltsInventory';
import { METALS_RAW_TUPLES, OXIDIZERS_RAW_TUPLES } from './inventory/metalsAndOxidizersInventory';
import { INDICATORS_RAW_TUPLES, CATALYSTS_RAW_TUPLES } from './inventory/indicatorsAndCatalystsInventory';

export interface DocumentCorrectionRecord {
  id: string;
  page: number;
  name: string;
  sourceFormulaOrEntry: string;
  correctedFormula: string;
  note: string;
}

export interface DocumentDuplicateRecord {
  id: string;
  name: string;
  formula: string;
  categories: string[];
  subsections: string[];
}

export interface DocumentSourceManifestEntry {
  sourceEntryId: string;
  page: number;
  sourceCategory: ReagentCategory;
  sourceSubsection: string;
  originalName: string;
  sourceFormula: string;
  canonicalRegistryId: string;
  canonicalName: string;
  verifiedFormula: string;
  importStatus: 'imported' | 'corrected_and_imported' | 'merged_duplicate' | 'restricted_reference';
  deduplicationStatus: 'primary_canonical' | 'cross_category_merged' | 'same_category_merged';
  visualLabStatus: VisualLabStatus;
  safetyClassification: SafetyClassification;
  correctionNote?: string;
  restrictionReason?: string;
}

export interface DocumentInventoryAudit {
  totalRawEntries: number;
  manifestCount: number;
  byCategoryRawCounts: Record<ReagentCategory, number>;
  byPageRawCounts: Record<number, number>;
  uniqueCanonicalCount: number;
  crossCategoryMergedCount: number;
  corrections: DocumentCorrectionRecord[];
  duplicates: DocumentDuplicateRecord[];
  safetyBreakdown: Record<SafetyClassification, number>;
  visualLabBreakdown: Record<VisualLabStatus, number>;
}

const INDICATOR_TRANSITIONS: Record<
  string,
  NonNullable<ChemicalReagent['indicatorTransition']>
> = {
  phenolphthalein: {
    indicatorType: 'pH',
    transitionRange: 'pH 8.2 – 10.0',
    acidColor: 'Colorless',
    neutralColor: 'Colorless',
    baseColor: 'Pink / Magenta',
  },
  methyl_orange: {
    indicatorType: 'pH',
    transitionRange: 'pH 3.1 – 4.4',
    acidColor: 'Red / Coral',
    neutralColor: 'Orange-Yellow',
    baseColor: 'Yellow',
  },
  methyl_red: {
    indicatorType: 'pH',
    transitionRange: 'pH 4.4 – 6.2',
    acidColor: 'Red',
    neutralColor: 'Orange',
    baseColor: 'Yellow',
  },
  bromothymol_blue: {
    indicatorType: 'pH',
    transitionRange: 'pH 6.0 – 7.6',
    acidColor: 'Yellow',
    neutralColor: 'Green',
    baseColor: 'Deep Blue',
  },
  thymol_blue: {
    indicatorType: 'pH',
    transitionRange: 'pH 1.2–2.8 (Red→Yellow) & pH 8.0–9.6 (Yellow→Blue)',
    acidColor: 'Red / Yellow',
    neutralColor: 'Yellow',
    baseColor: 'Blue',
  },
  phenol_red: {
    indicatorType: 'pH',
    transitionRange: 'pH 6.8 – 8.4',
    acidColor: 'Yellow',
    neutralColor: 'Orange-Red',
    baseColor: 'Bright Pink-Red',
  },
  bromocresol_green: {
    indicatorType: 'pH',
    transitionRange: 'pH 3.8 – 5.4',
    acidColor: 'Yellow',
    neutralColor: 'Blue-Green',
    baseColor: 'Blue',
  },
  bromocresol_purple: {
    indicatorType: 'pH',
    transitionRange: 'pH 5.2 – 6.8',
    acidColor: 'Yellow',
    neutralColor: 'Violet-Grey',
    baseColor: 'Purple',
  },
  alizarin_yellow_r: {
    indicatorType: 'pH',
    transitionRange: 'pH 10.1 – 12.0',
    acidColor: 'Yellow',
    neutralColor: 'Yellow',
    baseColor: 'Orange-Red / Lilac',
  },
  thymolphthalein: {
    indicatorType: 'pH',
    transitionRange: 'pH 9.3 – 10.5',
    acidColor: 'Colorless',
    neutralColor: 'Colorless',
    baseColor: 'Deep Blue',
  },
  congo_red: {
    indicatorType: 'pH',
    transitionRange: 'pH 3.0 – 5.0',
    acidColor: 'Blue-Violet',
    neutralColor: 'Red',
    baseColor: 'Red',
  },
  cresol_red: {
    indicatorType: 'pH',
    transitionRange: 'pH 7.2 – 8.8',
    acidColor: 'Yellow',
    neutralColor: 'Amber',
    baseColor: 'Reddish-Purple',
  },
  neutral_red: {
    indicatorType: 'pH',
    transitionRange: 'pH 6.8 – 8.0',
    acidColor: 'Bluish-Red',
    neutralColor: 'Rose',
    baseColor: 'Amber-Yellow',
  },
  universal_indicator: {
    indicatorType: 'pH',
    transitionRange: 'pH 1 – 14 (Full Spectrum)',
    acidColor: 'Red / Orange / Yellow',
    neutralColor: 'Emerald Green',
    baseColor: 'Blue / Indigo / Violet',
  },
  litmus_blue: {
    indicatorType: 'pH',
    transitionRange: 'pH 4.5 – 8.3',
    acidColor: 'Red',
    neutralColor: 'Purple-Blue',
    baseColor: 'Blue',
  },
  litmus_red: {
    indicatorType: 'pH',
    transitionRange: 'pH 4.5 – 8.3',
    acidColor: 'Red',
    neutralColor: 'Red-Violet',
    baseColor: 'Blue',
  },
  red_cabbage_indicator: {
    indicatorType: 'pH',
    transitionRange: 'pH 2 – 12 (Anthocyanin Spectrum)',
    acidColor: 'Bright Red / Pink',
    neutralColor: 'Purple / Violet',
    baseColor: 'Bluish-Green / Yellow',
  },
  curcumin_turmeric: {
    indicatorType: 'pH',
    transitionRange: 'pH 7.4 – 8.6',
    acidColor: 'Bright Yellow',
    neutralColor: 'Bright Yellow',
    baseColor: 'Reddish-Brown',
  },
  beetroot_betanin: {
    indicatorType: 'pH',
    transitionRange: 'pH 9.0 – 11.5',
    acidColor: 'Deep Crimson-Purple',
    neutralColor: 'Crimson',
    baseColor: 'Brownish-Yellow',
  },
  hibiscus_extract: {
    indicatorType: 'pH',
    transitionRange: 'pH 3.0 – 9.0',
    acidColor: 'Deep Magenta-Red',
    neutralColor: 'Lavender-Purple',
    baseColor: 'Dark Greenish-Blue',
  },
  ferroin: {
    indicatorType: 'redox',
    transitionRange: 'E° = +1.06 V',
    acidColor: 'Pale Blue (Oxidized)',
    baseColor: 'Deep Red-Orange (Reduced)',
  },
  methylene_blue: {
    indicatorType: 'redox',
    transitionRange: 'E° = +0.53 V',
    acidColor: 'Deep Blue (Oxidized)',
    baseColor: 'Colorless (Leucomethylene Blue)',
  },
  starch_solution: {
    indicatorType: 'redox',
    transitionRange: 'Specific I₃⁻ / I₂ Clathrate Complex',
    acidColor: 'Deep Blue-Black (with Iodine)',
    baseColor: 'Colorless / Translucent',
  },
  ebt_indicator: {
    indicatorType: 'complexometric',
    transitionRange: 'Mg²⁺ / Ca²⁺ Chelation at pH 10',
    acidColor: 'Wine-Red (Metal-EBT Complex)',
    baseColor: 'Sky Blue (Free Indicator)',
  },
  murexide: {
    indicatorType: 'complexometric',
    transitionRange: 'Ca²⁺ / Cu²⁺ / Ni²⁺ Complexation',
    acidColor: 'Red-Violet / Yellow-Orange (Metal Complex)',
    baseColor: 'Deep Purple (Free Indicator)',
  },
};

function slugifyId(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function inferState(formula: string, category: ReagentCategory): 'liquid' | 'solid' | 'gas' {
  if (formula.includes('(g)')) return 'gas';
  if (formula.includes('(s)')) return 'solid';
  if (formula.includes('(aq)') || formula.includes('(l)')) return 'liquid';
  if (category === 'metal') return 'solid';
  if (category === 'acid' || category === 'indicator') return 'liquid';
  return 'solid';
}

function inferColor(id: string, category: ReagentCategory, state: 'liquid' | 'solid' | 'gas'): string {
  const customColors: Record<string, string> = {
    cuso4: '#0284C7',
    fe_so4: '#86EFAC',
    fecl3: '#D97706',
    kmn_o4_reagent: '#7E22CE',
    k2cr2o7: '#EA580C',
    k2cro4: '#FACC15',
    cu: '#B45309',
    au_metal: '#EAB308',
    co_cl2: '#EC4899',
    ni_so4: '#10B981',
    methyl_orange: '#F97316',
    bromothymol_blue: '#10B981',
    curcumin_turmeric: '#EAB308',
    red_cabbage_indicator: '#7C3AED',
    litmus_blue: '#3B82F6',
    litmus_red: '#EF4444',
    ferroin: '#DC2626',
    ebt_indicator: '#0284C7',
    murexide: '#7E22CE',
    naocl: '#FEF08A',
  };
  if (customColors[id]) return customColors[id];
  if (category === 'metal') return '#94A3B8';
  if (category === 'indicator') return '#EC4899';
  if (category === 'catalyst') return '#64748B';
  if (state === 'liquid') return '#F8FAFC';
  return '#E2E8F0';
}

function determineVisualLabStatus(
  safetyClassification: SafetyClassification,
  category: ReagentCategory,
  isRestricted: boolean
): VisualLabStatus {
  if (isRestricted) return 'Restricted';
  if (safetyClassification === 'school_lab_supported') return 'Reaction-supported';
  if (category === 'indicator') return 'Visualized';
  return 'Selectable';
}

const CATEGORIZED_TUPLES: Array<{ category: ReagentCategory; tuples: RawDocTuple[] }> = [
  { category: 'acid', tuples: ACIDS_RAW_TUPLES },
  { category: 'base', tuples: BASES_RAW_TUPLES },
  { category: 'salt', tuples: SALTS_RAW_TUPLES },
  { category: 'metal', tuples: METALS_RAW_TUPLES },
  { category: 'oxidizer', tuples: OXIDIZERS_RAW_TUPLES },
  { category: 'indicator', tuples: INDICATORS_RAW_TUPLES },
  { category: 'catalyst', tuples: CATALYSTS_RAW_TUPLES },
];

function buildAuditAndDeduplicatedMap(): {
  audit: DocumentInventoryAudit;
  byId: Map<string, ChemicalReagent>;
  manifest: DocumentSourceManifestEntry[];
} {
  const byCategoryRawCounts: Record<ReagentCategory, number> = {
    acid: ACIDS_RAW_TUPLES.length,
    base: BASES_RAW_TUPLES.length,
    salt: SALTS_RAW_TUPLES.length,
    metal: METALS_RAW_TUPLES.length,
    oxidizer: OXIDIZERS_RAW_TUPLES.length,
    indicator: INDICATORS_RAW_TUPLES.length,
    catalyst: CATALYSTS_RAW_TUPLES.length,
  };

  const byPageRawCounts: Record<number, number> = {};
  let totalRawEntries = 0;
  const byId = new Map<string, ChemicalReagent>();
  const corrections: DocumentCorrectionRecord[] = [];
  const seenCorrectionIds = new Set<string>();
  const manifest: DocumentSourceManifestEntry[] = [];

  for (const { category, tuples } of CATEGORIZED_TUPLES) {
    totalRawEntries += tuples.length;

    let categorySeq = 0;
    for (const tuple of tuples) {
      categorySeq++;
      const [
        page,
        subsection,
        name,
        sourceFormula,
        verifiedFormulaOpt,
        canonicalIdOpt,
        correctionNote,
        safetyClassOpt,
        restrictionReason,
        aliasesOpt,
      ] = tuple;

      byPageRawCounts[page] = (byPageRawCounts[page] || 0) + 1;

      const id = canonicalIdOpt || slugifyId(name);
      const formula = verifiedFormulaOpt || sourceFormula;
      const safetyClassification: SafetyClassification =
        safetyClassOpt || 'conceptual_reference';
      const aliases = aliasesOpt ? [...aliasesOpt] : [];

      // Extract parenthetical common name from `name` into aliases if present
      const parenMatch = name.match(/\(([^)]+)\)/);
      if (parenMatch && parenMatch[1]) {
        const extracted = parenMatch[1].trim();
        if (extracted.length > 2 && !aliases.includes(extracted)) {
          aliases.push(extracted);
        }
      }

      if (correctionNote && !seenCorrectionIds.has(`${id}::${page}`)) {
        seenCorrectionIds.add(`${id}::${page}`);
        corrections.push({
          id,
          page,
          name,
          sourceFormulaOrEntry: sourceFormula,
          correctedFormula: formula,
          note: correctionNote,
        });
      }

      const existing = byId.get(id);
      const isRestricted =
        safetyClassification === 'hazardous_restricted' ||
        safetyClassification === 'radioactive_restricted';
      const visualLabStatus = determineVisualLabStatus(
        safetyClassification,
        category,
        isRestricted
      );

      const sourceEntryId = `DOC-P${String(page).padStart(2, '0')}-${category.toUpperCase()}-${String(
        categorySeq
      ).padStart(3, '0')}`;

      if (!existing) {
        const mappedState = inferState(formula, category);
        const colorHex = inferColor(id, category, mappedState);
        const isSimulationSupported =
          !isRestricted && safetyClassification === 'school_lab_supported';

        const isColorless =
          mappedState === 'liquid' && colorHex.toUpperCase() === '#F8FAFC';

        const unit = mappedState === 'liquid' ? 'mL' : 'g';
        const initialQuantity = mappedState === 'liquid' ? 100 : 50;
        const pourAmount =
          category === 'indicator' || category === 'catalyst'
            ? 5
            : mappedState === 'liquid'
            ? 20
            : 5;

        const hazardStr = isRestricted
          ? safetyClassification === 'radioactive_restricted'
            ? 'Radioactive · Restricted Reference Entry'
            : 'Hazardous / Toxic · Restricted Reference Entry'
          : category === 'acid' || category === 'base'
          ? 'Corrosive / Irritant · Wear Lab PPE'
          : category === 'oxidizer'
          ? 'Oxidizing Agent · Keep Away from Combustibles'
          : 'Standard Laboratory Precaution';

        const descriptionStr =
          category === 'catalyst'
            ? `${subsection} catalyst used to accelerate target chemical transformations.`
            : `${name} (${formula}) — ${subsection}.${
                correctionNote ? ` Note: ${correctionNote}` : ''
              }`.trim();

        const safetyInfoStr = isRestricted
          ? restrictionReason ||
            'Restricted hazardous or radioactive substance. Catalogued for reference only; interactive mixing is disabled.'
          : `Standard laboratory PPE required (${hazardStr}).`;

        const simulationNoteStr = isRestricted
          ? `Restricted (${
              safetyClassification === 'radioactive_restricted' ? 'Radioactive' : 'Hazardous'
            }): ${restrictionReason || 'Blocked from interactive beaker mixing for safety.'}`
          : isSimulationSupported
          ? `Supported in virtual chemistry laboratory (${subsection}).`
          : `Selectable in visual lab; reaction evaluation supported via AI Chemistry Assistant (${subsection}).`;

        const reagent: ChemicalReagent = {
          id,
          name,
          formula,
          state: mappedState,
          color: colorHex,
          isColorless,
          appearanceDescription: `${
            mappedState.charAt(0).toUpperCase() + mappedState.slice(1)
          } reagent (${subsection})`,
          concentration: formula.includes('(aq)') ? '1.0 M (aq)' : undefined,
          type: category,
          category,
          subcategory: subsection,
          categoryLabel: subsection,
          secondaryCategories: [],
          sourceCategories: [category],
          sourceSubsections: [subsection],
          role: category === 'catalyst' ? 'Catalyst' : undefined,
          catalyticRole:
            category === 'catalyst'
              ? `${subsection} catalyst.`
              : undefined,
          curriculumLevel:
            category === 'catalyst'
              ? safetyClassification === 'school_lab_supported'
                ? 'School-Level (Classes 8–12)'
                : 'Additional Reference Catalyst'
              : undefined,
          description: descriptionStr,
          initialQuantity,
          unit,
          pourAmount,
          hazard: hazardStr,
          safetyInfo: safetyInfoStr,
          isSimulationSupported,
          simulationNote: simulationNoteStr,
          aliases,
          safetyClassification,
          visualLabStatus,
          isRestricted,
          restrictionReason,
          formulaCorrectionNote: correctionNote,
          indicatorTransition: INDICATOR_TRANSITIONS[id],
        };
        byId.set(id, reagent);

        manifest.push({
          sourceEntryId,
          page,
          sourceCategory: category,
          sourceSubsection: subsection,
          originalName: name,
          sourceFormula,
          canonicalRegistryId: id,
          canonicalName: reagent.name,
          verifiedFormula: formula,
          importStatus: isRestricted
            ? 'restricted_reference'
            : correctionNote
            ? 'corrected_and_imported'
            : 'imported',
          deduplicationStatus: 'primary_canonical',
          visualLabStatus,
          safetyClassification,
          correctionNote,
          restrictionReason,
        });
      } else {
        const isCrossCategory = !existing.sourceCategories?.includes(category);
        if (isCrossCategory) {
          existing.sourceCategories = [...(existing.sourceCategories || []), category];
        }
        if (
          category !== existing.category &&
          !existing.secondaryCategories?.includes(category)
        ) {
          existing.secondaryCategories = [
            ...(existing.secondaryCategories || []),
            category,
          ];
        }
        if (!existing.sourceSubsections?.includes(subsection)) {
          existing.sourceSubsections = [
            ...(existing.sourceSubsections || []),
            subsection,
          ];
        }
        for (const alias of aliases) {
          if (!existing.aliases?.includes(alias)) {
            existing.aliases = [...(existing.aliases || []), alias];
          }
        }
        if (existing.name !== name && !existing.aliases?.includes(name)) {
          existing.aliases = [...(existing.aliases || []), name];
        }
        if (category === 'catalyst') {
          existing.role = existing.role || 'Catalyst';
          existing.catalyticRole =
            existing.catalyticRole || `${subsection} catalyst.`;
        }
        if (
          (safetyClassification === 'hazardous_restricted' ||
            safetyClassification === 'radioactive_restricted') &&
          !existing.isRestricted
        ) {
          existing.safetyClassification = safetyClassification;
          existing.isRestricted = true;
          existing.isSimulationSupported = false;
          existing.visualLabStatus = 'Restricted';
          existing.restrictionReason =
            restrictionReason || existing.restrictionReason;
        } else if (
          safetyClassification === 'school_lab_supported' &&
          !existing.isRestricted
        ) {
          existing.safetyClassification = 'school_lab_supported';
          existing.isSimulationSupported = true;
          existing.visualLabStatus = 'Reaction-supported';
        }
        if (correctionNote && !existing.formulaCorrectionNote) {
          existing.formulaCorrectionNote = correctionNote;
        }
        if (INDICATOR_TRANSITIONS[id] && !existing.indicatorTransition) {
          existing.indicatorTransition = INDICATOR_TRANSITIONS[id];
        }

        manifest.push({
          sourceEntryId,
          page,
          sourceCategory: category,
          sourceSubsection: subsection,
          originalName: name,
          sourceFormula,
          canonicalRegistryId: id,
          canonicalName: existing.name,
          verifiedFormula: existing.formula,
          importStatus: 'merged_duplicate',
          deduplicationStatus: isCrossCategory
            ? 'cross_category_merged'
            : 'same_category_merged',
          visualLabStatus: existing.visualLabStatus || visualLabStatus,
          safetyClassification: existing.safetyClassification || safetyClassification,
          correctionNote,
          restrictionReason: existing.restrictionReason || restrictionReason,
        });
      }
    }
  }

  const duplicates: DocumentDuplicateRecord[] = [];
  const safetyBreakdown: Record<SafetyClassification, number> = {
    school_lab_supported: 0,
    conceptual_reference: 0,
    hazardous_restricted: 0,
    radioactive_restricted: 0,
  };
  const visualLabBreakdown: Record<VisualLabStatus, number> = {
    'Reaction-supported': 0,
    Selectable: 0,
    Visualized: 0,
    Available: 0,
    Restricted: 0,
    'Needs review': 0,
  };

  for (const reagent of byId.values()) {
    const sc = reagent.safetyClassification || 'conceptual_reference';
    safetyBreakdown[sc] = (safetyBreakdown[sc] || 0) + 1;
    const vls = reagent.visualLabStatus || 'Selectable';
    visualLabBreakdown[vls] = (visualLabBreakdown[vls] || 0) + 1;

    if (
      (reagent.sourceCategories && reagent.sourceCategories.length > 1) ||
      (reagent.sourceSubsections && reagent.sourceSubsections.length > 1)
    ) {
      duplicates.push({
        id: reagent.id,
        name: reagent.name,
        formula: reagent.formula,
        categories: reagent.sourceCategories || [reagent.category],
        subsections: reagent.sourceSubsections || [reagent.subcategory || ''],
      });
    }
  }

  const audit: DocumentInventoryAudit = {
    totalRawEntries,
    manifestCount: manifest.length,
    byCategoryRawCounts,
    byPageRawCounts,
    uniqueCanonicalCount: byId.size,
    crossCategoryMergedCount: duplicates.length,
    corrections,
    duplicates,
    safetyBreakdown,
    visualLabBreakdown,
  };

  return { audit, byId, manifest };
}

const {
  audit: BUILT_AUDIT,
  byId: DEDUPED_DOC_REAGENTS,
  manifest: BUILT_MANIFEST,
} = buildAuditAndDeduplicatedMap();

export const DOCUMENT_INVENTORY_AUDIT: DocumentInventoryAudit = BUILT_AUDIT;
export const DOCUMENT_SOURCE_MANIFEST: DocumentSourceManifestEntry[] = BUILT_MANIFEST;

/**
 * Merges the base preset REAGENTS with the full validated 22-page document inventory,
 * preserving all rich metadata, catalyst Role/Mechanism/Curriculum fields, and preset IDs.
 */
export function buildMergedCanonicalReagents(baseReagents: ChemicalReagent[]): ChemicalReagent[] {
  const mergedMap = new Map<string, ChemicalReagent>();

  // 1. Seed with existing base reagents so all existing IDs, descriptions, and catalyst fields stay intact
  for (const base of baseReagents) {
    const docEntry = DEDUPED_DOC_REAGENTS.get(base.id);
    if (docEntry) {
      const combinedSecondary = new Set<ChemicalCategory>([
        ...(base.secondaryCategories || []),
        ...(docEntry.secondaryCategories || []),
      ]);
      if (docEntry.category !== base.category) {
        combinedSecondary.add(docEntry.category);
      }
      combinedSecondary.delete(base.category);

      const combinedAliases = Array.from(
        new Set([...(base.aliases || []), ...(docEntry.aliases || []), docEntry.name])
      ).filter((a) => a !== base.name);

      const isRestricted = docEntry.isRestricted ?? base.isRestricted ?? false;
      const safetyClassification =
        docEntry.safetyClassification || base.safetyClassification || 'school_lab_supported';
      const visualLabStatus: VisualLabStatus = isRestricted
        ? 'Restricted'
        : base.isSimulationSupported || safetyClassification === 'school_lab_supported'
        ? 'Reaction-supported'
        : docEntry.visualLabStatus || 'Selectable';

      mergedMap.set(base.id, {
        ...base,
        subcategory: base.subcategory || docEntry.subcategory,
        secondaryCategories: Array.from(combinedSecondary),
        sourceCategories: Array.from(
          new Set([base.category, ...(docEntry.sourceCategories || [])])
        ),
        sourceSubsections:
          docEntry.sourceSubsections || (base.subcategory ? [base.subcategory] : []),
        aliases: combinedAliases,
        safetyClassification,
        visualLabStatus,
        isRestricted,
        restrictionReason: docEntry.restrictionReason || base.restrictionReason,
        formulaCorrectionNote: docEntry.formulaCorrectionNote || base.formulaCorrectionNote,
        indicatorTransition: base.indicatorTransition || docEntry.indicatorTransition,
        role: base.role || docEntry.role,
        catalyticRole: base.catalyticRole || docEntry.catalyticRole,
      });
    } else {
      const isRestricted = base.isRestricted ?? false;
      mergedMap.set(base.id, {
        ...base,
        safetyClassification: base.safetyClassification || 'school_lab_supported',
        visualLabStatus: isRestricted
          ? 'Restricted'
          : base.isSimulationSupported
          ? 'Reaction-supported'
          : 'Selectable',
        isRestricted,
      });
    }
  }

  // 2. Add all remaining deduplicated document entries
  for (const [id, docReagent] of DEDUPED_DOC_REAGENTS.entries()) {
    if (!mergedMap.has(id)) {
      mergedMap.set(id, docReagent);
    }
  }

  return Array.from(mergedMap.values());
}

