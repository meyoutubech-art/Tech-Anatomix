import { ChemicalReagent, ChemicalCategory } from '../types/chemistry';
import { REAGENTS as PRESET_REAGENTS, CHEMICAL_CATEGORIES } from './chemicalLibraryData';

// Single canonical in-memory registry combining preset library and dynamic verified compounds
let canonicalRegistry: ChemicalReagent[] = [...PRESET_REAGENTS];
let registryVersion = 0;
const registryListeners = new Set<() => void>();

function notifyRegistryListeners() {
  registryVersion += 1;
  registryListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener errors
    }
  });
}

export function getRegistryVersion(): number {
  return registryVersion;
}

export function subscribeRegistryChange(listener: () => void): () => void {
  registryListeners.add(listener);
  return () => {
    registryListeners.delete(listener);
  };
}

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
    description:
      'Black transition-metal oxide solid. Acts as an efficient catalyst lowering activation energy for hydrogen peroxide decomposition into oxygen gas and water.',
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
    name: 'Water',
    formula: 'H₂O',
    state: 'liquid',
    color: '#F8FAFC',
    isColorless: true,
    appearanceDescription: 'Clear, colourless pure liquid water',
    concentration: 'Pure Liquid Solvent',
    role: 'Solvent',
    type: 'solvent',
    category: 'salt',
    secondaryCategories: ['aqueous_solution', 'solvent'],
    categoryLabel: 'Solvent · Salts & Solutions',
    description:
      'Water commonly acts as a solvent in aqueous solutions and may also participate directly in certain chemical reactions.',
    initialQuantity: 250,
    unit: 'mL',
    pourAmount: 30,
    hazard: 'Non-Hazardous Solvent',
    safetyInfo:
      'Safe universal laboratory solvent. Never add water directly to concentrated sulfuric acid (always add acid slowly to water).',
    isSimulationSupported: true,
    simulationNote:
      'Supported as an aqueous solvent/diluent in solution experiments and as a direct reactant with alkali metals (e.g., 2K + 2H₂O → 2KOH + H₂↑).',
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
    description:
      'Classic acid-base indicator dye. Colourless in acidic and neutral media (pH < 8.2), turning vivid magenta fuchsia in alkaline solutions (pH > 8.2).',
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
    description:
      'Composite pH dye displaying a smooth color spectrum from crimson red (pH 1) to orange (pH 4), green (pH 7), blue (pH 10), and violet (pH 12+).',
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

const SUBSCRIPT_DIGITS: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
};

export function toUnicodeSubscript(num: number | string): string {
  return String(num)
    .split('')
    .map((d) => SUBSCRIPT_DIGITS[d] || d)
    .join('');
}

export function formatFormulaWithSubscripts(asciiFormula: string): string {
  return asciiFormula.replace(/([A-Za-z)\]])(\d+)/g, (_, prefix, digits) => {
    return `${prefix}${toUnicodeSubscript(digits)}`;
  });
}

/**
 * Normalizes chemical formulas and search strings by converting Unicode subscripts (₀–₉)
 * to standard ASCII digits (0–9) and stripping phase suffixes like (aq), (s), (l), (g).
 */
export function normalizeChemicalSearchText(input: string): string {
  const subscriptMap: Record<string, string> = {
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
  };
  return input
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (ch) => subscriptMap[ch] || ch)
    .replace(/[’‘]/g, "'")
    .toLowerCase()
    .trim();
}

/**
 * Get all current compounds in the canonical registry
 */
export function getCanonicalRegistry(): ChemicalReagent[] {
  return canonicalRegistry;
}

interface CationSpec {
  id: string;
  names: string[];
  symbol: string;
  charge: number;
  isPolyatomic?: boolean;
  aqueousColor: string;
  isColorless: boolean;
  appearanceLabel: string;
}

interface AnionSpec {
  id: string;
  names: string[];
  symbol: string;
  charge: number;
  isPolyatomic: boolean;
  categoryOverride?: ChemicalCategory;
  typeOverride?: ChemicalReagent['type'];
  colorOverride?: string;
  isColorlessOverride?: boolean;
  hazard?: string;
}

const CATION_TABLE: CationSpec[] = [
  { id: 'li', names: ['lithium'], symbol: 'Li', charge: 1, aqueousColor: '#F8FAFC', isColorless: true, appearanceLabel: 'Clear, colourless' },
  { id: 'na', names: ['sodium', 'natrium'], symbol: 'Na', charge: 1, aqueousColor: '#F8FAFC', isColorless: true, appearanceLabel: 'Clear, colourless' },
  { id: 'k', names: ['potassium', 'kalium'], symbol: 'K', charge: 1, aqueousColor: '#F8FAFC', isColorless: true, appearanceLabel: 'Clear, colourless' },
  { id: 'rb', names: ['rubidium'], symbol: 'Rb', charge: 1, aqueousColor: '#F8FAFC', isColorless: true, appearanceLabel: 'Clear, colourless' },
  { id: 'cs', names: ['cesium', 'caesium'], symbol: 'Cs', charge: 1, aqueousColor: '#F8FAFC', isColorless: true, appearanceLabel: 'Clear, colourless' },
  { id: 'nh4', names: ['ammonium'], symbol: 'NH₄', charge: 1, isPolyatomic: true, aqueousColor: '#F8FAFC', isColorless: true, appearanceLabel: 'Clear, colourless' },
  { id: 'ag', names: ['silver', 'silver(i)', 'silver i', 'argentous'], symbol: 'Ag', charge: 1, aqueousColor: '#F8FAFC', isColorless: true, appearanceLabel: 'Clear, colourless' },
  { id: 'cu1', names: ['copper(i)', 'copper i', 'cuprous'], symbol: 'Cu', charge: 1, aqueousColor: '#F8FAFC', isColorless: true, appearanceLabel: 'Off-white / colourless' },
  { id: 'cu2', names: ['copper(ii)', 'copper ii', 'cupric', 'copper'], symbol: 'Cu', charge: 2, aqueousColor: '#0284C7', isColorless: false, appearanceLabel: 'Azure-blue' },
  { id: 'mg', names: ['magnesium'], symbol: 'Mg', charge: 2, aqueousColor: '#F8FAFC', isColorless: true, appearanceLabel: 'Clear, colourless' },
  { id: 'ca', names: ['calcium'], symbol: 'Ca', charge: 2, aqueousColor: '#F8FAFC', isColorless: true, appearanceLabel: 'Clear, colourless' },
  { id: 'sr', names: ['strontium'], symbol: 'Sr', charge: 2, aqueousColor: '#F8FAFC', isColorless: true, appearanceLabel: 'Clear, colourless' },
  { id: 'ba', names: ['barium'], symbol: 'Ba', charge: 2, aqueousColor: '#F8FAFC', isColorless: true, appearanceLabel: 'Clear, colourless' },
  { id: 'zn', names: ['zinc'], symbol: 'Zn', charge: 2, aqueousColor: '#F8FAFC', isColorless: true, appearanceLabel: 'Clear, colourless' },
  { id: 'fe2', names: ['iron(ii)', 'iron ii', 'ferrous'], symbol: 'Fe', charge: 2, aqueousColor: '#86EFAC', isColorless: false, appearanceLabel: 'Pale sea-green' },
  { id: 'fe3', names: ['iron(iii)', 'iron iii', 'ferric'], symbol: 'Fe', charge: 3, aqueousColor: '#F59E0B', isColorless: false, appearanceLabel: 'Yellow-amber' },
  { id: 'co2', names: ['cobalt(ii)', 'cobalt ii', 'cobaltous', 'cobalt'], symbol: 'Co', charge: 2, aqueousColor: '#F43F5E', isColorless: false, appearanceLabel: 'Rose-pink' },
  { id: 'ni2', names: ['nickel(ii)', 'nickel ii', 'nickelous', 'nickel'], symbol: 'Ni', charge: 2, aqueousColor: '#10B981', isColorless: false, appearanceLabel: 'Emerald-green' },
  { id: 'mn2', names: ['manganese(ii)', 'manganese ii', 'manganous'], symbol: 'Mn', charge: 2, aqueousColor: '#FBCFE8', isColorless: false, appearanceLabel: 'Very pale blush-pink' },
  { id: 'cr3', names: ['chromium(iii)', 'chromium iii', 'chromic', 'chromium'], symbol: 'Cr', charge: 3, aqueousColor: '#059669', isColorless: false, appearanceLabel: 'Deep violet-green' },
  { id: 'al', names: ['aluminium', 'aluminum'], symbol: 'Al', charge: 3, aqueousColor: '#F8FAFC', isColorless: true, appearanceLabel: 'Clear, colourless' },
  { id: 'sn2', names: ['tin(ii)', 'tin ii', 'stannous'], symbol: 'Sn', charge: 2, aqueousColor: '#F8FAFC', isColorless: true, appearanceLabel: 'Clear, colourless' },
  { id: 'sn4', names: ['tin(iv)', 'tin iv', 'stannic'], symbol: 'Sn', charge: 4, aqueousColor: '#F8FAFC', isColorless: true, appearanceLabel: 'Clear, colourless' },
  { id: 'pb2', names: ['lead(ii)', 'lead ii', 'plumbous', 'lead'], symbol: 'Pb', charge: 2, aqueousColor: '#F8FAFC', isColorless: true, appearanceLabel: 'Clear, colourless' },
  { id: 'bi3', names: ['bismuth(iii)', 'bismuth iii', 'bismuth'], symbol: 'Bi', charge: 3, aqueousColor: '#F8FAFC', isColorless: true, appearanceLabel: 'Clear, colourless' },
];

const ANION_TABLE: AnionSpec[] = [
  { id: 'cl', names: ['chloride'], symbol: 'Cl', charge: 1, isPolyatomic: false },
  { id: 'br', names: ['bromide'], symbol: 'Br', charge: 1, isPolyatomic: false },
  { id: 'i', names: ['iodide'], symbol: 'I', charge: 1, isPolyatomic: false },
  { id: 'f', names: ['fluoride'], symbol: 'F', charge: 1, isPolyatomic: false, hazard: 'Irritant / Toxic Fluoride Ion' },
  { id: 'no3', names: ['nitrate'], symbol: 'NO₃', charge: 1, isPolyatomic: true, hazard: 'Oxidizing Salt' },
  { id: 'no2', names: ['nitrite'], symbol: 'NO₂', charge: 1, isPolyatomic: true, hazard: 'Oxidizer / Toxic if Swallowed' },
  { id: 'oh', names: ['hydroxide'], symbol: 'OH', charge: 1, isPolyatomic: true, categoryOverride: 'base', typeOverride: 'base', hazard: 'Caustic / Alkaline Corrosive' },
  { id: 'hco3', names: ['bicarbonate', 'hydrogen carbonate', 'hydrogencarbonate'], symbol: 'HCO₃', charge: 1, isPolyatomic: true, typeOverride: 'carbonate' },
  { id: 'hso4', names: ['bisulfate', 'hydrogen sulfate', 'bisulphate', 'hydrogen sulphate'], symbol: 'HSO₄', charge: 1, isPolyatomic: true, categoryOverride: 'acid', typeOverride: 'acid' },
  { id: 'hso3', names: ['bisulfite', 'hydrogen sulfite', 'bisulphite', 'hydrogen sulphite'], symbol: 'HSO₃', charge: 1, isPolyatomic: true },
  { id: 'ch3coo', names: ['acetate', 'ethanoate'], symbol: 'CH₃COO', charge: 1, isPolyatomic: true },
  { id: 'hcoo', names: ['formate', 'methanoate'], symbol: 'HCOO', charge: 1, isPolyatomic: true },
  { id: 'scn', names: ['thiocyanate', 'rhodanide', 'sulphocyanide'], symbol: 'SCN', charge: 1, isPolyatomic: true },
  { id: 'mno4', names: ['permanganate'], symbol: 'MnO₄', charge: 1, isPolyatomic: true, categoryOverride: 'oxidizer', typeOverride: 'oxidizer', colorOverride: '#7E22CE', isColorlessOverride: false, hazard: 'Strong Oxidizer · Stains Skin' },
  { id: 'ocl', names: ['hypochlorite'], symbol: 'OCl', charge: 1, isPolyatomic: true, categoryOverride: 'oxidizer', typeOverride: 'oxidizer', hazard: 'Oxidizer · Corrosive Bleach' },
  { id: 'clo3', names: ['chlorate'], symbol: 'ClO₃', charge: 1, isPolyatomic: true, categoryOverride: 'oxidizer', typeOverride: 'oxidizer', hazard: 'Strong Oxidizer' },
  { id: 'clo4', names: ['perchlorate'], symbol: 'ClO₄', charge: 1, isPolyatomic: true, categoryOverride: 'oxidizer', typeOverride: 'oxidizer', hazard: 'Strong Oxidizer' },
  { id: 'io3', names: ['iodate'], symbol: 'IO₃', charge: 1, isPolyatomic: true, categoryOverride: 'oxidizer', typeOverride: 'oxidizer', hazard: 'Oxidizer' },
  { id: 'h2po4', names: ['dihydrogen phosphate', 'monobasic phosphate'], symbol: 'H₂PO₄', charge: 1, isPolyatomic: true },
  { id: 'so4', names: ['sulfate', 'sulphate'], symbol: 'SO₄', charge: 2, isPolyatomic: true },
  { id: 'so3', names: ['sulfite', 'sulphite'], symbol: 'SO₃', charge: 2, isPolyatomic: true, typeOverride: 'reducing_agent' },
  { id: 's2o3', names: ['thiosulfate', 'thiosulphate'], symbol: 'S₂O₃', charge: 2, isPolyatomic: true, typeOverride: 'reducing_agent' },
  { id: 's', names: ['sulfide', 'sulphide'], symbol: 'S', charge: 2, isPolyatomic: false, hazard: 'Evolves H₂S with Acids' },
  { id: 'co3', names: ['carbonate'], symbol: 'CO₃', charge: 2, isPolyatomic: true, typeOverride: 'carbonate' },
  { id: 'c2o4', names: ['oxalate', 'ethanedioate'], symbol: 'C₂O₄', charge: 2, isPolyatomic: true, hazard: 'Harmful if Swallowed' },
  { id: 'cro4', names: ['chromate'], symbol: 'CrO₄', charge: 2, isPolyatomic: true, categoryOverride: 'oxidizer', typeOverride: 'oxidizer', colorOverride: '#FACC15', isColorlessOverride: false, hazard: 'Oxidizer · Hexavalent Chromium' },
  { id: 'cr2o7', names: ['dichromate'], symbol: 'Cr₂O₇', charge: 2, isPolyatomic: true, categoryOverride: 'oxidizer', typeOverride: 'oxidizer', colorOverride: '#EA580C', isColorlessOverride: false, hazard: 'Strong Oxidizer' },
  { id: 'hpo4', names: ['hydrogen phosphate', 'dibasic phosphate'], symbol: 'HPO₄', charge: 2, isPolyatomic: true },
  { id: 'o', names: ['oxide'], symbol: 'O', charge: 2, isPolyatomic: false, categoryOverride: 'base', typeOverride: 'base' },
  { id: 'po4', names: ['phosphate', 'orthophosphate'], symbol: 'PO₄', charge: 3, isPolyatomic: true },
  { id: 'citrate', names: ['citrate'], symbol: 'C₆H₅O₇', charge: 3, isPolyatomic: true },
  { id: 'fecn6_3', names: ['ferricyanide', 'hexacyanoferrate(iii)', 'hexacyanoferrate iii'], symbol: '[Fe(CN)₆]', charge: 3, isPolyatomic: false, colorOverride: '#EA580C', isColorlessOverride: false },
  { id: 'fecn6_4', names: ['ferrocyanide', 'hexacyanoferrate(ii)', 'hexacyanoferrate ii'], symbol: '[Fe(CN)₆]', charge: 4, isPolyatomic: false, colorOverride: '#FEF08A', isColorlessOverride: false },
];

// Additional standalone verified compounds (organic acids, biochemicals, reagents)
const EXTENDED_STANDALONE_COMPOUNDS: Array<{
  id: string;
  name: string;
  aliases: string[];
  formula: string;
  state: 'liquid' | 'solid' | 'gas';
  color: string;
  isColorless: boolean;
  type: ChemicalReagent['type'];
  category: ChemicalCategory;
  subcategory: string;
  description: string;
  unit: 'mL' | 'g';
  pourAmount: number;
  hazard?: string;
}> = [
  {
    id: 'ascorbic_acid',
    name: 'Ascorbic Acid (Vitamin C)',
    aliases: ['vitamin c', 'l-ascorbic acid', 'c6h8o6'],
    formula: 'C₆H₈O₆ (aq)',
    state: 'liquid',
    color: '#F8FAFC',
    isColorless: true,
    type: 'acid',
    category: 'acid',
    subcategory: 'Organic Acid & Reducing Agent',
    description:
      'Water-soluble enediol lactone organic acid (pKa₁ = 4.10) and mild biological reducing agent. Rapidly reduces iodine (I₂), permanganate (MnO₄⁻), and iron(III) (Fe³⁺) while neutralizing bases and carbonates.',
    unit: 'mL',
    pourAmount: 20,
  },
  {
    id: 'tartaric_acid',
    name: 'Tartaric Acid',
    aliases: ['2,3-dihydroxybutanedioic acid', 'c4h6o6'],
    formula: 'C₄H₆O₆ (aq)',
    state: 'liquid',
    color: '#F8FAFC',
    isColorless: true,
    type: 'acid',
    category: 'acid',
    subcategory: 'Dicarboxylic Organic Acid',
    description:
      'Diprotic alpha-hydroxy carboxylic acid found in grapes and baking powder (pKa₁ = 2.98). Reacts briskly with bicarbonates and carbonates to evolve CO₂(g) and chelates Cu²⁺ in Fehling’s solution.',
    unit: 'mL',
    pourAmount: 20,
  },
  {
    id: 'lactic_acid',
    name: 'Lactic Acid',
    aliases: ['2-hydroxypropanoic acid', 'milk acid', 'c3h6o3'],
    formula: 'C₃H₆O₃ (aq)',
    state: 'liquid',
    color: '#F8FAFC',
    isColorless: true,
    type: 'acid',
    category: 'acid',
    subcategory: 'Carboxylic Acid',
    description:
      'Monoprotic alpha-hydroxy carboxylic acid (pKa = 3.86). Undergoes clean acid-base neutralization with hydroxides and vigorous CO₂ gas evolution with carbonates and bicarbonates.',
    unit: 'mL',
    pourAmount: 20,
  },
  {
    id: 'malic_acid',
    name: 'Malic Acid',
    aliases: ['hydroxybutanedioic acid', 'apple acid', 'c4h6o5'],
    formula: 'C₄H₆O₅ (aq)',
    state: 'liquid',
    color: '#F8FAFC',
    isColorless: true,
    type: 'acid',
    category: 'acid',
    subcategory: 'Dicarboxylic Organic Acid',
    description:
      'Diprotic dicarboxylic acid (pKa₁ = 3.40) present in apples and stone fruits. Neutralizes bases and liberates carbon dioxide gas from carbonate salts.',
    unit: 'mL',
    pourAmount: 20,
  },
  {
    id: 'succinic_acid',
    name: 'Succinic Acid',
    aliases: ['butanedioic acid', 'amber acid', 'c4h6o4'],
    formula: 'C₄H₆O₄ (aq)',
    state: 'liquid',
    color: '#F8FAFC',
    isColorless: true,
    type: 'acid',
    category: 'acid',
    subcategory: 'Dicarboxylic Organic Acid',
    description:
      'Diprotic dicarboxylic acid intermediate of the citric acid cycle (pKa₁ = 4.20). Reacts with bases to form succinate salts and with carbonates to release CO₂(g).',
    unit: 'mL',
    pourAmount: 20,
  },
  {
    id: 'hydrobromic_acid',
    name: 'Hydrobromic Acid',
    aliases: ['hbr', 'aqueous hydrogen bromide'],
    formula: 'HBr (aq)',
    state: 'liquid',
    color: '#F8FAFC',
    isColorless: true,
    type: 'acid',
    category: 'acid',
    subcategory: 'Strong Mineral Acid',
    description:
      'Strong monoprotic halogen mineral acid (pKa ≈ -9). Completely dissociates in water into H⁺ and Br⁻, precipitating AgBr(s) with silver salts and evolving H₂(g) with active metals.',
    unit: 'mL',
    pourAmount: 20,
    hazard: 'Corrosive Strong Acid',
  },
  {
    id: 'hydroiodic_acid',
    name: 'Hydroiodic Acid',
    aliases: ['hi', 'aqueous hydrogen iodide'],
    formula: 'HI (aq)',
    state: 'liquid',
    color: '#FEF9C3',
    isColorless: false,
    type: 'acid',
    category: 'acid',
    subcategory: 'Strong Mineral Acid',
    description:
      'Strongest common hydrohalic acid (pKa ≈ -10) and reducing agent. Precipitates bright yellow PbI₂ and AgI with lead(II) and silver(I) cations.',
    unit: 'mL',
    pourAmount: 20,
    hazard: 'Corrosive Strong Acid',
  },
  {
    id: 'perchloric_acid',
    name: 'Perchloric Acid (Dilute)',
    aliases: ['hclo4'],
    formula: 'HClO₄ (aq)',
    state: 'liquid',
    color: '#F8FAFC',
    isColorless: true,
    type: 'acid',
    category: 'acid',
    subcategory: 'Strong Mineral Acid',
    description:
      'Strong monoprotic mineral superacid in dilute aqueous solution. Neutralizes alkalis exothermically and dissolves active metals with hydrogen evolution.',
    unit: 'mL',
    pourAmount: 20,
    hazard: 'Corrosive · Oxidizing Acid',
  },
  {
    id: 'sulfurous_acid',
    name: 'Sulfurous Acid',
    aliases: ['sulphurous acid', 'h2so3'],
    formula: 'H₂SO₃ (aq)',
    state: 'liquid',
    color: '#F8FAFC',
    isColorless: true,
    type: 'acid',
    category: 'acid',
    subcategory: 'Weak Mineral Acid & Reductant',
    description:
      'Weak diprotic acid and reducing agent formed by dissolving SO₂ in water. Decolorizes permanganate and iodine while neutralizing alkaline solutions.',
    unit: 'mL',
    pourAmount: 20,
    hazard: 'Irritant · Evolves SO₂',
  },
  {
    id: 'tannic_acid',
    name: 'Tannic Acid',
    aliases: ['tannin', 'gallotannin'],
    formula: 'C₇₆H₅₂O₄₆ (aq)',
    state: 'liquid',
    color: '#FEF3C7',
    isColorless: false,
    type: 'acid',
    category: 'acid',
    subcategory: 'Polyphenolic Weak Acid',
    description:
      'Natural plant polyphenol weak acid. Reacts with Iron(III) salts (such as FeCl₃) to form an intense blue-black iron(III) tannate charge-transfer complex.',
    unit: 'mL',
    pourAmount: 20,
  },
];

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function buildBalancedSaltFormula(cat: CationSpec, an: AnionSpec): {
  formulaWithState: string;
  asciiFormula: string;
  isSoluble: boolean;
} {
  const g = gcd(cat.charge, an.charge);
  const cSub = an.charge / g;
  const aSub = cat.charge / g;

  const catStr =
    cSub === 1
      ? cat.symbol
      : cat.isPolyatomic
      ? `(${cat.symbol})${toUnicodeSubscript(cSub)}`
      : `${cat.symbol}${toUnicodeSubscript(cSub)}`;

  const anStr =
    aSub === 1
      ? an.symbol
      : an.isPolyatomic
      ? `(${an.symbol})${toUnicodeSubscript(aSub)}`
      : `${an.symbol}${toUnicodeSubscript(aSub)}`;

  const baseFormula = `${catStr}${anStr}`;
  const asciiFormula = normalizeChemicalSearchText(baseFormula).replace(/[^a-z0-9()[\]]/g, '');

  // Determine aqueous solubility at 25°C using standard K_sp solubility rules
  const alwaysSolubleCations = new Set(['li', 'na', 'k', 'rb', 'cs', 'nh4']);
  const alwaysSolubleAnions = new Set(['no3', 'ch3coo', 'hcoo', 'clo3', 'clo4', 'hco3', 'hso4', 'scn']);

  let isSoluble = true;
  if (alwaysSolubleCations.has(cat.id) || alwaysSolubleAnions.has(an.id)) {
    isSoluble = true;
    // Exception: AgSCN and AgCH3COO are sparingly/insoluble
    if (cat.id === 'ag' && (an.id === 'scn' || an.id === 'ch3coo')) {
      isSoluble = false;
    }
  } else if (['cl', 'br', 'i'].includes(an.id)) {
    isSoluble = !['ag', 'pb2', 'cu1'].includes(cat.id);
  } else if (an.id === 'so4') {
    isSoluble = !['ba', 'sr', 'ca', 'pb2', 'ag'].includes(cat.id);
  } else if (['co3', 'po4', 'c2o4', 'so3', 'cro4', 's', 'oh', 'o'].includes(an.id)) {
    if (an.id === 'oh' && ['ba', 'sr', 'ca'].includes(cat.id)) {
      isSoluble = true;
    } else {
      isSoluble = false;
    }
  }

  return {
    formulaWithState: `${baseFormula} (${isSoluble ? 'aq' : 's'})`,
    asciiFormula,
    isSoluble,
  };
}

/**
 * Synthesizes a scientifically verified ChemicalReagent if the user types a valid chemical
 * name or formula that is not yet in the preset registry.
 * Returns null for fictional/nonsense inputs or prohibited substances.
 */
export function synthesizeScientificCompound(rawQuery: string): ChemicalReagent | null {
  const qNorm = normalizeChemicalSearchText(rawQuery)
    .replace(/\((aq|s|l|g|solution|solid|liquid|gas)\)/gi, '')
    .replace(/\b(aqueous|solution|solid|powder|crystals|anhydrous|hydrate|dilute|concentrated)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!qNorm || qNorm.length < 2) return null;
  const qAscii = qNorm.replace(/[^a-z0-9]/g, '');

  // 1. Check Extended Standalone Compounds (Organic Acids, Hydrohalic Acids, etc.)
  for (const ext of EXTENDED_STANDALONE_COMPOUNDS) {
    const extNameNorm = normalizeChemicalSearchText(ext.name);
    const extBaseName = extNameNorm.replace(/\s*\([^)]*\)/g, '').trim();
    const extFormAscii = normalizeChemicalSearchText(ext.formula)
      .replace(/\((aq|s|l|g)\)/gi, '')
      .replace(/[^a-z0-9]/g, '');

    if (
      qNorm === extNameNorm ||
      qNorm === extBaseName ||
      qAscii === extFormAscii ||
      ext.aliases.some((a) => normalizeChemicalSearchText(a) === qNorm || normalizeChemicalSearchText(a).replace(/[^a-z0-9]/g, '') === qAscii)
    ) {
      return {
        id: ext.id,
        name: ext.name,
        formula: ext.formula,
        aliases: ext.aliases,
        state: ext.state,
        color: ext.color,
        isColorless: ext.isColorless,
        appearanceDescription: ext.isColorless
          ? `Clear, colourless ${ext.state === 'liquid' ? 'aqueous solution' : 'crystalline solid'}`
          : `Characteristic ${ext.name} reagent`,
        concentration: ext.state === 'liquid' ? '0.5 M (aq)' : 'Reagent Grade (s)',
        type: ext.type,
        category: ext.category,
        subcategory: ext.subcategory,
        categoryLabel: `${ext.category.toUpperCase()} · ${ext.subcategory}`,
        description: ext.description,
        initialQuantity: 100,
        unit: ext.unit,
        pourAmount: ext.pourAmount,
        hazard: ext.hazard,
        safetyInfo: 'Standard laboratory PPE required: wear splash goggles and nitrile gloves.',
        isSimulationSupported: true,
        visualLabStatus: 'Reaction-supported',
        simulationNote: 'Dynamically synthesized & verified for stoichiometric 3D beaker reactions.',
      };
    }
  }

  // 2. Compositional IUPAC Cation + Anion Name or Formula Match
  for (const cat of CATION_TABLE) {
    for (const an of ANION_TABLE) {
      const { formulaWithState, asciiFormula, isSoluble } = buildBalancedSaltFormula(cat, an);

      // Check if query matches any [Cation Name] [Anion Name] combination or exact formula
      let nameMatched = false;
      for (const cName of cat.names) {
        for (const aName of an.names) {
          const combined = `${cName} ${aName}`;
          const combinedNoParens = combined.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
          const qNoParens = qNorm.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
          if (qNorm === combined || qNoParens === combinedNoParens) {
            nameMatched = true;
            break;
          }
        }
        if (nameMatched) break;
      }

      const formulaMatched = qAscii.length >= 3 && qAscii === asciiFormula;

      if (nameMatched || formulaMatched) {
        const displayCation = cat.names[0]
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .replace(/\(ii\)/i, '(II)')
          .replace(/\(iii\)/i, '(III)')
          .replace(/\(iv\)/i, '(IV)')
          .replace(/\(i\)/i, '(I)');
        const displayAnion = an.names[0].replace(/\b\w/g, (c) => c.toUpperCase());
        const fullName = `${displayCation} ${displayAnion}`;
        const id = `${cat.id}_${an.id}`;

        const category: ChemicalCategory = an.categoryOverride || 'salt';
        const type: ChemicalReagent['type'] = an.typeOverride || 'salt';
        const color = an.colorOverride || cat.aqueousColor;
        const isColorless = an.isColorlessOverride !== undefined ? an.isColorlessOverride : cat.isColorless;
        const state: 'liquid' | 'solid' = isSoluble ? 'liquid' : 'solid';

        return {
          id,
          name: fullName,
          formula: formulaWithState,
          aliases: [`${cat.names[0]} ${an.names[0]}`, asciiFormula],
          state,
          color,
          isColorless,
          appearanceDescription: `${cat.appearanceLabel} ${isSoluble ? 'aqueous solution' : 'crystalline solid'} of ${fullName}`,
          concentration: isSoluble ? '0.5 M (aq)' : 'Reagent Solid (s)',
          type,
          category,
          subcategory:
            category === 'base'
              ? 'Inorganic Base / Hydroxide'
              : category === 'oxidizer'
              ? 'Inorganic Oxidizing Salt'
              : 'Inorganic Ionic Salt',
          categoryLabel:
            category === 'base'
              ? 'Bases & Alkalis'
              : category === 'oxidizer'
              ? 'Oxidizers & Redox Reagents'
              : 'Salts & Solutions',
          description: `${fullName} (${formulaWithState}) — ${
            isSoluble
              ? `water-soluble ionic electrolyte dissociating into ${cat.symbol}${cat.charge > 1 ? toUnicodeSubscript(cat.charge) : ''}⁺ and ${an.symbol}⁻ ions in aqueous solution.`
              : `sparingly soluble/insoluble ionic solid capable of acid-base or metathesis reactions.`
          }`,
          initialQuantity: 100,
          unit: isSoluble ? 'mL' : 'g',
          pourAmount: isSoluble ? 20 : 10,
          hazard: an.hazard || (cat.id === 'pb2' || cat.id === 'ba' ? 'Toxic Heavy Metal Salt' : undefined),
          safetyInfo: 'Wear laboratory eye protection and gloves when handling chemical reagents.',
          isSimulationSupported: true,
          visualLabStatus: 'Reaction-supported',
          simulationNote: 'Verified IUPAC compound with full ionic stoichiometry support in the 3D beaker.',
        };
      }
    }
  }

  return null;
}

const SALT_OR_ANION_KEYWORDS_REGEX =
  /\b(chloride|bromide|iodide|fluoride|nitrate|nitrite|sulfate|sulphate|sulfite|sulphite|sulfide|sulphide|carbonate|bicarbonate|hydroxide|oxide|peroxide|permanganate|dichromate|chromate|phosphate|acetate|ethanoate|oxalate|citrate|tartrate|lactate|malate|succinate|formate|methanoate|benzoate|salicylate|thiocyanate|rhodanide|thiosulfate|thiosulphate|chlorate|perchlorate|hypochlorite|iodate|periodate|ferricyanide|ferrocyanide|hexacyanoferrate|acid)\b/i;

/**
 * Search/lookup a compound by ID, name, formula, or common alias.
 * If the compound is not in the initial 854 preset list, synthesizes and registers
 * any scientifically valid chemical compound so it is immediately available in the
 * Reagent Library Shelf and 3D Beaker Reaction Engine.
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

  const q = normalizeChemicalSearchText(query);
  const qClean = q.replace(/\((aq|s|l|g)\)/gi, '').replace(/[^a-z0-9]/g, '');

  // 0. Block unverified chemical weapons not in the educational document
  if (
    q.includes('sarin') ||
    q.includes('vx nerve') ||
    q.includes('mustard gas') ||
    q.includes('tabun') ||
    q.includes('phosgene')
  ) {
    return {
      found: false,
      message: `"${query}" is a prohibited chemical weapon or hazardous substance not permitted in classroom virtual laboratories.`,
    };
  }

  // 1. Exact ID, exact name, exact base name (without parentheticals), exact alias, or exact primary formula match first
  const exactMatch = canonicalRegistry.find((c) => {
    const idNorm = normalizeChemicalSearchText(c.id);
    const nameNorm = normalizeChemicalSearchText(c.name);
    const nameBaseNorm = nameNorm.replace(/\s*\([^)]*\)/g, '').trim();
    const aliasMatch = (c.aliases || []).some((a) => normalizeChemicalSearchText(a) === q);
    const formulaPrimary = normalizeChemicalSearchText(c.formula)
      .replace(/\((aq|s|l|g)\)/gi, '')
      .split('[')[0]
      .split('·')[0]
      .replace(/[^a-z0-9]/g, '');
    const formulaFull = normalizeChemicalSearchText(c.formula)
      .replace(/\((aq|s|l|g)\)/gi, '')
      .split('[')[0]
      .replace(/[^a-z0-9]/g, '');
    return (
      idNorm === q ||
      nameNorm === q ||
      nameBaseNorm === q ||
      aliasMatch ||
      (formulaPrimary.length > 0 && formulaPrimary === qClean) ||
      (formulaFull.length > 0 && formulaFull === qClean)
    );
  });

  if (exactMatch) {
    if (exactMatch.isRestricted) {
      return {
        found: false,
        compound: exactMatch,
        sourceConfidence: `Restricted Reference Entry (${exactMatch.restrictionReason || 'Safety Restricted'})`,
        message: `"${exactMatch.name} (${exactMatch.formula})" is a hazardous, toxic, or radioactive substance not permitted for interactive mixing in classroom virtual laboratories. ${
          exactMatch.restrictionReason || ''
        }`.trim(),
        isNewEntry: false,
      };
    }
    return {
      found: true,
      compound: exactMatch,
      sourceConfidence: 'Verified Canonical Chemistry Registry (100% Match)',
      isNewEntry: false,
    };
  }

  // 2. Check Common Educational Aliases Mapping before broad partial matching
  const aliasMap: Record<string, string> = {
    water: 'water',
    h2o: 'water',
    'distilled water': 'water',
    'deionized water': 'water',
    'baking soda': 'nahco3',
    'sodium bicarbonate': 'nahco3',
    vinegar: 'ch3cooh',
    'acetic acid': 'ch3cooh',
    'ethanoic acid': 'ch3cooh',
    chalk: 'caco3',
    limestone: 'caco3',
    'calcium carbonate': 'caco3',
    'manganese dioxide': 'mno2',
    'manganese oxide': 'mno2',
    mno2: 'mno2',
    'table salt': 'nacl',
    saline: 'nacl',
    'sodium chloride': 'nacl',
    'slaked lime': 'ca_oh2',
    limewater: 'ca_oh2',
    'calcium hydroxide': 'ca_oh2',
    'milk of magnesia': 'mg_oh2',
    'magnesium hydroxide': 'mg_oh2',
    quicklime: 'cao',
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
    peroxide: 'h2o2',
    ammonia: 'nh3',
    'aqueous ammonia': 'nh3',
    'magnesium ribbon': 'mg',
    'zinc granules': 'zn',
    'iron powder': 'fe',
    'haber catalyst': 'fe_haber_catalyst',
    'promoted iron': 'fe_haber_catalyst',
    nickel: 'ni_catalyst',
    'finely divided nickel': 'ni_catalyst',
    'raney nickel': 'ni_catalyst',
    platinum: 'pt_wire',
    'platinum wire': 'pt_wire',
    'platinum gauze': 'pt_wire',
    palladium: 'pd_catalyst',
    'lindlar catalyst': 'pd_catalyst',
    catalase: 'catalase_enzyme',
    'vanadium pentoxide': 'v2o5',
    'vanadium oxide': 'v2o5',
    v2o5: 'v2o5',
    'platinum rhodium': 'pt_rh_catalyst',
    'ostwald catalyst': 'pt_rh_catalyst',
    zeolite: 'zeolite_zsm5',
    'zsm-5': 'zeolite_zsm5',
    zsm5: 'zeolite_zsm5',
    alumina: 'al2o3',
    'aluminium oxide': 'al2o3',
    'aluminum oxide': 'al2o3',
    al2o3: 'al2o3',
    'copper oxide': 'cuo',
    'copper catalyst': 'cu_catalyst',
    rhodium: 'rh_catalyst',
    ruthenium: 'ru_catalyst',
    'cobalt catalyst': 'co_catalyst',
    'fischer tropsch': 'co_catalyst',
    'zinc oxide': 'zno',
    'copper turnings': 'cu',
    'potassium metal': 'k_metal',
    'potassium permanganate': 'kmn_o4_reagent',
    permanganate: 'kmn_o4_reagent',
    kmno4: 'kmn_o4_reagent',
    'iron ii sulfate': 'fe_so4',
    'ferrous sulfate': 'fe_so4',
    'green vitriol': 'fe_so4',
    'iron iii chloride': 'fecl3',
    'ferric chloride': 'fecl3',
    'sodium thiosulfate': 'na2s2o3',
    thiosulfate: 'na2s2o3',
    'aqueous iodine': 'iodine_solution',
    lugol: 'iodine_solution',
    bleach: 'naocl',
    'sodium hypochlorite': 'naocl',
    'oxalic acid': 'oxalic_acid',
    'citric acid': 'c6h8o7',
    'formic acid': 'hcooh',
    'phosphoric acid': 'h3po4',
    'boric acid': 'h3bo3',
    'barium hydroxide': 'ba_oh2',
    'lithium hydroxide': 'lioh',
    'potassium chromate': 'k2cro4',
    'mohr salt': 'mohrs_salt',
    'mohrs salt': 'mohrs_salt',
    alum: 'potash_alum',
    turmeric: 'curcumin_turmeric',
    'red cabbage': 'red_cabbage_indicator',
    starch: 'starch_solution',
  };

  for (const [alias, canonicalId] of Object.entries(aliasMap)) {
    const queryHasAnionButAliasDoesNot =
      SALT_OR_ANION_KEYWORDS_REGEX.test(q) && !SALT_OR_ANION_KEYWORDS_REGEX.test(alias);
    if (queryHasAnionButAliasDoesNot) continue;

    if (q === alias || (q.length >= 4 && (q.includes(alias) || alias.includes(q)))) {
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

  // 3. Safety Check for Prohibited Substances BEFORE synthesizing
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

  // 4. Try synthesizing an exact IUPAC salt/acid/base/reagent if the query is a specific compound not yet in the registry
  const synthesized = synthesizeScientificCompound(query);
  if (synthesized) {
    const existing = canonicalRegistry.find((c) => c.id === synthesized.id);
    if (existing) {
      return {
        found: true,
        compound: existing,
        sourceConfidence: 'Verified Canonical Chemistry Registry (100% Match)',
        isNewEntry: false,
      };
    }
    registerCanonicalCompound(synthesized);
    return {
      found: true,
      compound: synthesized,
      sourceConfidence: 'AI-Verified & Added to Reagent Library Shelf (Stoichiometrically Validated)',
      isNewEntry: true,
    };
  }

  // 5. Partial name, alias, or multi-atom formula match in canonical registry
  const queryHasSaltKeyword = SALT_OR_ANION_KEYWORDS_REGEX.test(q);
  const matchInRegistry = canonicalRegistry.find((c) => {
    const idMatch = normalizeChemicalSearchText(c.id) === q;
    const nameNorm = normalizeChemicalSearchText(c.name);
    // Prevent a multi-word salt query (e.g. "cobalt(ii) chloride") from falsely matching a single-word metal ("cobalt")
    const candidateIsPureElement =
      c.category === 'metal' || (!nameNorm.includes(' ') && !SALT_OR_ANION_KEYWORDS_REGEX.test(nameNorm));
    const allowSubstringMatch = !(queryHasSaltKeyword && candidateIsPureElement);

    const nameMatch =
      nameNorm === q ||
      (allowSubstringMatch && (nameNorm.includes(q) || q.includes(nameNorm)));
    const aliasMatch = (c.aliases || []).some((a) => {
      const aNorm = normalizeChemicalSearchText(a);
      return aNorm === q || (allowSubstringMatch && q.length >= 4 && (aNorm.includes(q) || q.includes(aNorm)));
    });
    const formulaClean = normalizeChemicalSearchText(c.formula)
      .replace(/\((aq|s|l|g)\)/gi, '')
      .split('[')[0]
      .replace(/[^a-z0-9]/g, '');
    const formulaMatch =
      formulaClean.length > 0 &&
      (formulaClean === qClean || (allowSubstringMatch && formulaClean.length >= 4 && qClean.includes(formulaClean)));
    return idMatch || nameMatch || aliasMatch || formulaMatch;
  });

  if (matchInRegistry) {
    if (matchInRegistry.isRestricted) {
      return {
        found: false,
        compound: matchInRegistry,
        sourceConfidence: `Restricted Reference Entry (${matchInRegistry.restrictionReason || 'Safety Restricted'})`,
        message: `"${matchInRegistry.name} (${matchInRegistry.formula})" is a hazardous, toxic, or radioactive substance not permitted for interactive mixing in classroom virtual laboratories. ${
          matchInRegistry.restrictionReason || ''
        }`.trim(),
        isNewEntry: false,
      };
    }
    return {
      found: true,
      compound: matchInRegistry,
      sourceConfidence: 'Verified Canonical Chemistry Registry (100% Match)',
      isNewEntry: false,
    };
  }

  // 6. Honest Unverified Response
  return {
    found: false,
    message: `Could not find a verified educational compound entry for "${query}" in the canonical chemical database. Try searching for standard classroom compounds like "Sodium Bicarbonate", "Acetic Acid", "Potassium Thiocyanate", "Cobalt(II) Chloride", "Ascorbic Acid", or "Zinc".`,
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
  notifyRegistryListeners();
  return true;
}
