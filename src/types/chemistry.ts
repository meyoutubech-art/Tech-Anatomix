export type ChemicalCategory =
  | 'acid'
  | 'base'
  | 'salt'
  | 'metal'
  | 'non_metal'
  | 'metal_oxide'
  | 'non_metal_oxide'
  | 'indicator'
  | 'aqueous_solution'
  | 'organic'
  | 'reagent'
  | 'oxidizer'
  | 'reducing_agent'
  | 'precipitate_product'
  | 'catalyst'
  | 'solvent';

export type ReagentCategory =
  | 'acid'
  | 'base'
  | 'salt'
  | 'metal'
  | 'oxidizer'
  | 'indicator'
  | 'catalyst';

export type SafetyClassification =
  | 'school_lab_supported'
  | 'conceptual_reference'
  | 'hazardous_restricted'
  | 'radioactive_restricted';

export interface ChemicalReagent {
  id: string;
  name: string;
  formula: string;
  state: 'liquid' | 'solid' | 'gas';
  color: string;
  isColorless?: boolean;
  appearanceDescription?: string;
  concentration?: string;
  type: string;
  category: ChemicalCategory;
  secondaryCategories?: ChemicalCategory[];
  categoryLabel?: string;
  role?: string;
  catalyticRole?: string;
  exampleReactions?: string[];
  reactionConditions?: string;
  curriculumLevel?: 'School-Level (Classes 8–12)' | 'Industrial & Curriculum (Classes 10–12)' | 'Additional Reference Catalyst';
  description: string;
  initialQuantity: number; // e.g. 100
  unit: string; // 'mL' or 'g'
  pourAmount: number; // amount poured per interaction, e.g. 20
  hazard?: string;
  safetyInfo?: string;
  isSimulationSupported: boolean;
  simulationNote?: string;
  defaultPh?: number;
  molarMass?: number;
  aliases?: string[];
  subcategory?: string;
  sourceCategories?: string[];
  sourceSubsections?: string[];
  safetyClassification?: SafetyClassification;
  isRestricted?: boolean;
  restrictionReason?: string;
  formulaCorrectionNote?: string;
  indicatorTransition?: {
    acidColor: string;
    neutralColor?: string;
    baseColor: string;
    transitionRange: string;
    indicatorType: 'pH' | 'redox' | 'complexometric' | 'precipitation' | 'fluorescent';
  };
}

export interface ReactionDefinition {
  id: string;
  name: string;
  reactants: string[]; // Reagent IDs
  requiredAmounts: Record<string, number>; // minimum amount of each reagent needed
  products: string[];
  balancedEquation: string;
  reactionType: 'neutralization' | 'single_displacement' | 'precipitation' | 'gas_evolution' | 'redox' | 'violent_combustion' | 'decomposition';
  observableEffects: {
    colorChangeTo: string;
    isFinalSolutionColorless?: boolean;
    initialAppearance?: string;
    finalAppearance?: string;
    temperatureDelta: number; // in °C
    producesGas: boolean;
    gasName?: string;
    gasColor?: string; // color of bubbles or vapor
    gasVigor?: number; // 1 to 5
    producesFumesAboveLiquid?: boolean; // true ONLY for coloured gases (NO2), boiling steam, or explosive smoke
    fumeColor?: string;
    producesPrecipitate: boolean;
    precipitateColor?: string;
    precipitateName?: string;
    solidCoatingColor?: string; // e.g., reddish-brown Cu(s) coating Fe/Zn/Mg or silver Ag(s) coating Cu
    isViolent?: boolean;
    hazardType?: 'explosion' | 'thermal_runaway' | 'gas_eruption' | 'violent_flame' | 'foaming_fountain' | 'none';
    flameColor?: string;
    explosionIntensity?: number;
    description: string;
  };
  explanation: string;
  molecularView?: {
    reactants: { name: string; formula: string; color: string; count: number }[];
    products: { name: string; formula: string; color: string; count: number }[];
  };
}

export interface AtomData {
  element: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label: string;
  atomicNumber: number;
  electronegativity?: number;
}

export interface BondData {
  atom1: number;
  atom2: number;
  order: 1 | 2 | 3;
}

export interface MoleculeDefinition {
  id: string;
  name: string;
  formula: string;
  iupacName: string;
  molarMass: string;
  geometry: string;
  description: string;
  atoms: AtomData[];
  bonds: BondData[];
}
