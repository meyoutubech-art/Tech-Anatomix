import { ChemicalReagent, ChemicalCategory } from '../types/chemistry';
import { REAGENTS as PRESET_REAGENTS, CHEMICAL_CATEGORIES } from './chemicalLibraryData';

// Single canonical in-memory registry combining preset library and dynamic verified compounds
let canonicalRegistry: ChemicalReagent[] = [...PRESET_REAGENTS];

// Additional verified educational chemical compounds supported in the simulator
export const ADDITIONAL_VERIFIED_COMPOUNDS: ChemicalReagent[] = [
  {
    id: 'mno2',
    name: 'Manganese Dioxide',
    formula: 'MnO₂ (s)',
    state: 'solid',
    color: '#1E293B',
    appearanceDescription: 'Dense matte-black solid powder',
    type: 'catalyst',
    category: 'catalyst',
    categoryLabel: 'Heterogeneous Catalyst',
    description: 'Black transition-metal oxide solid. Acts as an efficient catalyst lowering activation energy for hydrogen peroxide decomposition into oxygen gas and water.',
    initialQuantity: 50,
    unit: 'g',
    pourAmount: 5,
    hazard: 'Mild Oxidizer · Harmful if Inhaled',
    safetyInfo: 'Avoid breathing dust. Wear protective gloves and eye protection.',
    isSimulationSupported: true,
    simulationNote: 'Fully supported as catalyst for peroxide decomposition (Elephant Toothpaste).',
  },
  {
    id: 'water',
    name: 'Distilled Water',
    formula: 'H₂O (l)',
    state: 'liquid',
    color: '#F8FAFC',
    isColorless: true,
    appearanceDescription: 'Clear, colourless pure liquid water',
    concentration: 'Pure Solvent',
    type: 'solvent',
    category: 'solvent',
    categoryLabel: 'Universal Solvent',
    description: 'Pure amphiprotic polar solvent (clear, colourless liquid) forming aqueous solutions and participating in alkali metal hydration and hydrolysis.',
    initialQuantity: 250,
    unit: 'mL',
    pourAmount: 50,
    hazard: 'Non-Hazardous',
    safetyInfo: 'Safe universal laboratory solvent.',
    isSimulationSupported: true,
    simulationNote: 'Fully supported as solvent and reactant for violent alkali metal hydro-reactions.',
  },
  {
    id: 'phenolphthalein',
    name: 'Phenolphthalein Indicator Solution',
    formula: 'C₂₀H₁₄O₄ (aq)',
    state: 'liquid',
    color: '#F8FAFC',
    isColorless: true,
    appearanceDescription: 'Clear, colourless indicator solution (turns magenta-pink at pH > 8.2)',
    concentration: '0.1% in Ethanol/Water',
    type: 'indicator',
    category: 'indicator',
    categoryLabel: 'pH Visual Indicator',
    description: 'Classic acid-base indicator dye. Colourless in acidic and neutral media (pH < 8.2), turning vivid magenta fuchsia in alkaline solutions (pH > 8.2).',
    initialQuantity: 50,
    unit: 'mL',
    pourAmount: 5,
    hazard: 'Mild Irritant · Alcoholic Vehicle',
    safetyInfo: 'Contains ethanol solvent. Flammable. Keep away from flames.',
    isSimulationSupported: true,
    simulationNote: 'Fully supported for alkaline fuchsia color transition with NaOH.',
  },
  {
    id: 'universal_indicator',
    name: 'Universal Indicator Solution',
    formula: 'Multi-Dye Mixture (aq)',
    state: 'liquid',
    color: '#10B981',
    isColorless: false,
    appearanceDescription: 'Neutral emerald-green multi-dye indicator solution (pH 7.0)',
    concentration: 'Full-Range pH Dye',
    type: 'indicator',
    category: 'indicator',
    categoryLabel: 'Full-Range pH Indicator',
    description: 'Composite pH dye displaying a smooth color spectrum from crimson red (pH 1) to orange (pH 4), green (pH 7), blue (pH 10), and violet (pH 12+).',
    initialQuantity: 50,
    unit: 'mL',
    pourAmount: 5,
    hazard: 'Flammable Vehicle',
    safetyInfo: 'Alcoholic solution; handle with standard laboratory precautions.',
    isSimulationSupported: true,
    simulationNote: 'Fully supported for full-spectrum pH color shifts.',
  },
];

// Initialize registry with preset and additional verified entries without duplicates
ADDITIONAL_VERIFIED_COMPOUNDS.forEach((add) => {
  if (!canonicalRegistry.some((c) => c.id === add.id)) {
    canonicalRegistry.push(add);
  }
});

/**
 * Get all current compounds in the canonical registry
 */
export function getCanonicalRegistry(): ChemicalReagent[] {
  return canonicalRegistry;
}

/**
 * Search/lookup a compound by ID, name, formula, or common alias.
 * Prevents duplicate entries and ensures verified data.
 */
export function findOrLookupCompound(query: string): {
  found: boolean;
  compound?: ChemicalReagent;
  sourceConfidence?: string;
  message?: string;
  isNewEntry?: boolean;
} {
  if (!query || !query.trim()) {
    return { found: false, message: 'Please enter a compound name, chemical formula, or category.' };
  }

  const q = query.toLowerCase().trim();
  const qClean = q.replace(/[^a-z0-9]/g, '');

  // 1. Exact or partial match in canonical registry
  const matchInRegistry = canonicalRegistry.find((c) => {
    const idMatch = c.id.toLowerCase() === q;
    const nameMatch = c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase());
    const formulaClean = c.formula.toLowerCase().replace(/[^a-z0-9]/g, '');
    const formulaMatch = formulaClean.length > 1 && (formulaClean === qClean || qClean.includes(formulaClean));
    return idMatch || nameMatch || formulaMatch;
  });

  if (matchInRegistry) {
    return {
      found: true,
      compound: matchInRegistry,
      sourceConfidence: 'Verified Canonical Chemistry Registry (100% Match)',
      isNewEntry: false,
    };
  }

  // 2. Common Educational Aliases Mapping
  const aliasMap: Record<string, string> = {
    'baking soda': 'nahco3',
    'sodium bicarbonate': 'nahco3',
    'vinegar': 'ch3cooh',
    'acetic acid': 'ch3cooh',
    'ethanoic acid': 'ch3cooh',
    'chalk': 'caco3',
    'limestone': 'caco3',
    'calcium carbonate': 'caco3',
    'manganese dioxide': 'mno2',
    'manganese oxide': 'mno2',
    'table salt': 'nacl',
    'saline': 'nacl',
    'sodium chloride': 'nacl',
    'slaked lime': 'ca_oh2',
    'limewater': 'ca_oh2',
    'calcium hydroxide': 'ca_oh2',
    'milk of magnesia': 'mg_oh2',
    'magnesium hydroxide': 'mg_oh2',
    'quicklime': 'cao',
    'calcium oxide': 'cao',
    'caustic soda': 'naoh',
    'sodium hydroxide': 'naoh',
    'muriatic acid': 'hcl',
    'hydrochloric acid': 'hcl',
    'oil of vitriol': 'h2so4',
    'sulfuric acid': 'h2so4',
    'nitric acid': 'hno3',
    'washing soda': 'na2co3',
    'sodium carbonate': 'na2co3',
    'copper sulfate': 'cuso4',
    'blue vitriol': 'cuso4',
    'silver nitrate': 'agno3',
    'barium chloride': 'bacl2',
    'lead nitrate': 'pb_no3_2',
    'potassium iodide': 'ki',
    'hydrogen peroxide': 'h2o2',
    'peroxide': 'h2o2',
    'ammonia': 'nh3',
    'aqueous ammonia': 'nh3',
    'magnesium ribbon': 'mg',
    'zinc granules': 'zn',
    'iron powder': 'fe',
    'copper turnings': 'cu',
    'potassium metal': 'k_metal',
    'potassium permanganate': 'kmn_o4_reagent',
    'permanganate': 'kmn_o4_reagent',
    'kmno4': 'kmn_o4_reagent',
    'iron ii sulfate': 'fe_so4',
    'ferrous sulfate': 'fe_so4',
    'green vitriol': 'fe_so4',
    'iron iii chloride': 'fecl3',
    'ferric chloride': 'fecl3',
    'sodium thiosulfate': 'na2s2o3',
    'thiosulfate': 'na2s2o3',
    'aqueous iodine': 'iodine_solution',
    'lugol': 'iodine_solution',
  };

  for (const [alias, canonicalId] of Object.entries(aliasMap)) {
    if (q.includes(alias) || alias.includes(q)) {
      const canonical = canonicalRegistry.find((c) => c.id === canonicalId);
      if (canonical) {
        return {
          found: true,
          compound: canonical,
          sourceConfidence: `Verified Canonical Compound (${canonical.name})`,
          isNewEntry: false,
        };
      }
    }
  }

  // 3. Safety Check for Hazardous or Prohibited Substances
  if (
    q.includes('uranium') ||
    q.includes('plutonium') ||
    q.includes('cyanide') ||
    q.includes('mercury') ||
    q.includes('radium') ||
    q.includes('sarin')
  ) {
    return {
      found: false,
      message: `"${query}" is a hazardous, toxic, or radioactive substance not permitted in classroom virtual laboratories. Tech-Anatomix supports standard educational acids, bases, salts, metals, indicators, oxidizers, and catalysts.`,
    };
  }

  // 4. Honest Unverified Response
  return {
    found: false,
    message: `Could not find a verified educational compound entry for "${query}" in the canonical chemical database. Try searching for standard classroom compounds like "Sodium Bicarbonate", "Acetic Acid", "Calcium Carbonate", "Hydrochloric Acid", "Manganese Dioxide", or "Zinc".`,
  };
}

/**
 * Register a newly verified compound into the canonical registry dynamically.
 */
export function registerCanonicalCompound(compound: ChemicalReagent): boolean {
  if (canonicalRegistry.some((c) => c.id === compound.id)) {
    return false; // Already present
  }
  canonicalRegistry.push(compound);
  return true;
}
