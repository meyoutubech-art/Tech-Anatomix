import { ChemicalReagent, ReactionDefinition } from '../types/chemistry';
import { REAGENTS } from './chemicalLibraryData';
import { getCanonicalRegistry } from './compoundRegistry';

export type StructuredReactionStatus =
  | 'VALIDATED_SUPPORTED_REACTION'
  | 'CONDITION_DEPENDENT'
  | 'NO_REACTION_SUPPORTED_UNDER_SPECIFIED_CONDITIONS'
  | 'UNSUPPORTED_REACTION'
  | 'INSUFFICIENT_INFORMATION';

export interface ReactionEvaluationResult {
  isSupported: boolean;
  status: 'ready' | 'unsupported' | 'incomplete';
  structuredStatus: StructuredReactionStatus;
  reaction: ReactionDefinition | null;
  message: string;
  balancedEquation?: string;
  reactionType?: string;
  reactantsList?: string[];
  productsList?: string[];
  observableEffects?: {
    colorChangeTo: string;
    isFinalSolutionColorless?: boolean;
    initialAppearance?: string;
    finalAppearance?: string;
    temperatureDelta: number;
    producesGas: boolean;
    gasName?: string;
    gasColor?: string;
    gasVigor?: number;
    producesFumesAboveLiquid?: boolean;
    fumeColor?: string;
    producesPrecipitate: boolean;
    precipitateColor?: string;
    precipitateName?: string;
    solidCoatingColor?: string;
    isViolent?: boolean;
    description: string;
  };
  explanation?: string;
  safetyWarnings?: string[];
  compatibleCatalysts?: string[];
}

// Comprehensive categorized chemical reagents
// Re-export comprehensive chemical reagents library and categories
export { REAGENTS, CHEMICAL_CATEGORIES } from './chemicalLibraryData';
export type { CategoryMeta } from './chemicalLibraryData';

export const REACTIONS: ReactionDefinition[] = [
  // 1. Acid-Base Neutralization
  {
    id: 'neutralization',
    name: 'Hydrochloric Acid + Sodium Hydroxide Neutralization',
    reactants: ['hcl', 'naoh'],
    requiredAmounts: { hcl: 20, naoh: 20 },
    products: ['NaCl (aq)', 'H₂O (l)'],
    balancedEquation: 'HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l) + ΔH (-57.3 kJ/mol)',
    reactionType: 'neutralization',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless HCl(aq) + clear, colourless NaOH(aq)',
      finalAppearance: 'Clear, colourless aqueous NaCl(aq) solution (turns emerald green only if Universal Indicator is added)',
      temperatureDelta: 12.5,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'none',
      description: 'Clean exothermic neutralization: colourless hydrochloric acid and colourless sodium hydroxide react to form a clear, colourless sodium chloride solution while raising the beaker temperature by 12.5°C.',
    },
    explanation: 'Strong monoprotic acid completely dissociates with strong alkali. Net ionic equation is H⁺(aq) + OH⁻(aq) → H₂O(l). Because hydrated Na⁺ and Cl⁻ ions have no electronic transitions in the visible spectrum, both reactants and the resulting salt solution remain completely colourless.',
  },

  // 2. Sulfuric Acid + Sodium Hydroxide
  {
    id: 'h2so4_naoh_neutralization',
    name: 'Sulfuric Acid + Sodium Hydroxide Exothermic Neutralization',
    reactants: ['h2so4', 'naoh'],
    requiredAmounts: { h2so4: 20, naoh: 20 },
    products: ['Na₂SO₄ (aq)', '2H₂O (l)'],
    balancedEquation: 'H₂SO₄(aq) + 2NaOH(aq) → Na₂SO₄(aq) + 2H₂O(l) + High Heat',
    reactionType: 'neutralization',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless H₂SO₄(aq) + clear, colourless NaOH(aq)',
      finalAppearance: 'Clear, colourless aqueous Na₂SO₄(aq) solution with strong exothermic warming',
      temperatureDelta: 18.0,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'none',
      description: 'Diprotic acid neutralization liberating significant heat (ΔT = +18.0°C) as both protons are neutralized to form a clear, colourless sodium sulfate solution.',
    },
    explanation: 'Diprotic sulfuric acid provides two molar equivalents of protons per mole of acid, generating double the neutralization enthalpy of monoprotic acids while yielding colourless hydrated Na⁺ and SO₄²⁻ ions.',
  },

  // 3. Acid + Metal (HCl + Mg)
  {
    id: 'acid_metal',
    name: 'Magnesium + Hydrochloric Acid Effervescent Gas Evolution',
    reactants: ['hcl', 'mg'],
    requiredAmounts: { hcl: 20, mg: 10 },
    products: ['MgCl₂ (aq)', 'H₂ (g)↑'],
    balancedEquation: '2HCl(aq) + Mg(s) → MgCl₂(aq) + H₂(g)↑',
    reactionType: 'single_displacement',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless HCl(aq) + silvery metallic Mg(s) ribbon',
      finalAppearance: 'Clear, colourless MgCl₂(aq) solution as the Mg ribbon dissolves with rapid streams of colourless H₂(g) bubbles rising to the meniscus',
      temperatureDelta: 24.0,
      producesGas: true,
      gasName: 'Hydrogen Gas (H₂)',
      gasColor: '#FFFFFF',
      gasVigor: 4,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'gas_eruption',
      description: 'Vigorous liquid-phase effervescence: rapid streams of colourless hydrogen gas (H₂) bubbles nucleate directly on the silvery magnesium ribbon, rise through the clear colourless MgCl₂(aq) solution, and burst at the meniscus as the metal dissolves.',
    },
    explanation: 'Magnesium has a higher oxidation potential than hydrogen (E° = -2.37 V). Two electrons are transferred from each Mg atom to two H⁺ protons, reducing hydrogen ions to colourless diatomic H₂ gas bubbles at the metal surface while magnesium oxidizes into colourless hydrated Mg²⁺ cations.',
  },

  // 4. Acid + Zinc (HCl + Zn)
  {
    id: 'acid_zinc',
    name: 'Zinc + Hydrochloric Acid Hydrogen Evolution',
    reactants: ['hcl', 'zn'],
    requiredAmounts: { hcl: 20, zn: 10 },
    products: ['ZnCl₂ (aq)', 'H₂ (g)↑'],
    balancedEquation: 'Zn(s) + 2HCl(aq) → ZnCl₂(aq) + H₂(g)↑',
    reactionType: 'single_displacement',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless HCl(aq) + bluish-silver metallic Zn(s) granules',
      finalAppearance: 'Clear, colourless ZnCl₂(aq) solution with steady streams of colourless H₂(g) bubbles nucleating on the zinc granules',
      temperatureDelta: 14.0,
      producesGas: true,
      gasName: 'Hydrogen Gas (H₂)',
      gasColor: '#FFFFFF',
      gasVigor: 3,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'gas_eruption',
      description: 'Steady liquid-phase effervescence: fine colourless hydrogen gas (H₂) bubbles nucleate on the submerged zinc granules, rise through the clear liquid column, and burst at the meniscus as zinc dissolves into colourless ZnCl₂(aq).',
    },
    explanation: 'Zinc oxidizes (Zn → Zn²⁺ + 2e⁻, E° = -0.76 V) transferring electrons to hydronium ions to evolve colourless gaseous diatomic hydrogen bubbles while forming d¹⁰ Zn²⁺ ions which are completely colourless in aqueous solution.',
  },

  // 5. Acid + Carbonate (HCl + CaCO₃)
  {
    id: 'acid_carbonate',
    name: 'Hydrochloric Acid + Calcium Carbonate Gas Evolution',
    reactants: ['hcl', 'caco3'],
    requiredAmounts: { hcl: 20, caco3: 10 },
    products: ['CaCl₂ (aq)', 'H₂O (l)', 'CO₂ (g)↑'],
    balancedEquation: '2HCl(aq) + CaCO₃(s) → CaCl₂(aq) + H₂O(l) + CO₂(g)↑',
    reactionType: 'gas_evolution',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless HCl(aq) + opaque white CaCO₃(s) solid at the bottom',
      finalAppearance: 'Clear, colourless CaCl₂(aq) solution as the white CaCO₃ solid dissolves with vigorous CO₂(g) bubble streams and meniscus agitation',
      temperatureDelta: 6.5,
      producesGas: true,
      gasName: 'Carbon Dioxide (CO₂)',
      gasColor: '#FFFFFF',
      gasVigor: 4,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'gas_eruption',
      description: 'Vigorous liquid-phase effervescence of colourless carbon dioxide (CO₂) gas bubbles nucleating from the white calcium carbonate solid and bursting at the liquid surface as the solid dissolves into clear, colourless CaCl₂(aq).',
    },
    explanation: 'Protons from hydrochloric acid react with solid carbonate anions to form carbonic acid (H₂CO₃), which spontaneously decomposes into liquid water and effervescing carbon dioxide gas bubbles within the liquid: CO₃²⁻ + 2H⁺ → H₂O(l) + CO₂(g)↑.',
  },

  // 6. Vinegar + Baking Soda (CH₃COOH + NaHCO₃)
  {
    id: 'vinegar_baking_soda',
    name: 'Acetic Acid + Sodium Bicarbonate Endothermic Effervescence',
    reactants: ['ch3cooh', 'nahco3'],
    requiredAmounts: { ch3cooh: 25, nahco3: 10 },
    products: ['CH₃COONa (aq)', 'H₂O (l)', 'CO₂ (g)↑ (Bubbling Froth)'],
    balancedEquation: 'CH₃COOH(aq) + NaHCO₃(s) → CH₃COONa(aq) + H₂O(l) + CO₂(g)↑',
    reactionType: 'gas_evolution',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless CH₃COOH(aq) + white crystalline NaHCO₃(s) powder',
      finalAppearance: 'Clear, colourless CH₃COONa(aq) solution with dense rising CO₂(g) bubble streams and frothy surface foam collar',
      temperatureDelta: -4.5,
      producesGas: true,
      gasName: 'Carbon Dioxide (CO₂)',
      gasColor: '#FFFFFF',
      gasVigor: 5,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'foaming_fountain',
      description: 'Brisk endothermic effervescence: dense streams of colourless CO₂ gas bubbles nucleate from the dissolving sodium bicarbonate powder, forming a bubbly white froth at the meniscus while cooling the colourless sodium acetate solution by 4.5°C.',
    },
    explanation: 'Bicarbonate protonation produces unstable carbonic acid that decomposes into CO₂ gas bubbles and water. The enthalpy of reaction is endothermic (ΔH > 0), absorbing thermal energy from the colourless aqueous solution.',
  },

  // 7. Copper + Nitric Acid (Cu + HNO₃)
  {
    id: 'cu_hno3_oxidation',
    name: 'Copper + Nitric Acid Oxidation & Nitrogen Dioxide Evolution',
    reactants: ['cu', 'hno3'],
    requiredAmounts: { cu: 10, hno3: 20 },
    products: ['Cu(NO₃)₂ (aq)', '2NO₂ (g)↑ (Dense Reddish-Brown Gas)', '2H₂O (l)'],
    balancedEquation: 'Cu(s) + 4HNO₃(aq) → Cu(NO₃)₂(aq) + 2NO₂(g)↑ + 2H₂O(l)',
    reactionType: 'redox',
    observableEffects: {
      colorChangeTo: '#0284C7',
      isFinalSolutionColorless: false,
      initialAppearance: 'Reddish-brown metallic Cu(s) turnings + clear, colourless HNO₃(aq)',
      finalAppearance: 'Deep azure-blue Cu(NO₃)₂(aq) solution + vigorous gas bubbling + dense reddish-brown NO₂(g) fumes rising above the liquid',
      temperatureDelta: 45.0,
      producesGas: true,
      gasName: 'Nitrogen Dioxide (NO₂) Toxic Reddish-Brown Fumes',
      gasColor: '#9A3412',
      gasVigor: 5,
      producesFumesAboveLiquid: true,
      fumeColor: '#9A3412',
      producesPrecipitate: false,
      isViolent: true,
      hazardType: 'gas_eruption',
      description: 'VIGOROUS REDOX REACTION! The colourless acid turns deep azure-blue as copper oxidizes to hydrated Cu²⁺ ions, while bubbling rapidly and releasing dense, toxic reddish-brown nitrogen dioxide (NO₂) gas fumes above the liquid.',
    },
    explanation: 'Nitric acid acts as a powerful oxidizing agent (E° = +0.80 V for NO₃⁻ → NO₂), oxidizing reddish-brown metallic copper to blue hydrated [Cu(H₂O)₆]²⁺ ions while reducing nitrate nitrogen to genuinely coloured reddish-brown paramagnetic NO₂(g) fumes.',
  },

  // 8. Silver Chloride Precipitation (AgNO₃ + NaCl)
  {
    id: 'precipitation',
    name: 'Silver Nitrate + Sodium Chloride Precipitation',
    reactants: ['agno3', 'nacl'],
    requiredAmounts: { agno3: 20, nacl: 20 },
    products: ['AgCl (s)↓ (Curdy White Precipitate)', 'NaNO₃ (aq)'],
    balancedEquation: 'AgNO₃(aq) + NaCl(aq) → AgCl(s)↓ + NaNO₃(aq)',
    reactionType: 'precipitation',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless AgNO₃(aq) + clear, colourless NaCl(aq)',
      finalAppearance: 'Dense curdy white AgCl(s) solid precipitate settling to the bottom beneath a clear, colourless NaNO₃(aq) supernatant',
      temperatureDelta: 0.5,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: true,
      precipitateColor: '#FFFFFF',
      precipitateName: 'Silver Chloride — AgCl(s)',
      isViolent: false,
      hazardType: 'none',
      description: 'Upon mixing two clear, colourless solutions, an instantaneous curdy white solid precipitate of Silver Chloride (AgCl) nucleates as a separate solid phase and settles into a white sediment layer at the bottom beneath colourless NaNO₃(aq).',
    },
    explanation: 'When aqueous silver ions (Ag⁺) and chloride ions (Cl⁻) meet, their ionic product exceeds Ksp (1.8 × 10⁻¹⁰). They immediately precipitate out of the colourless solution as an insoluble white crystalline solid phase of AgCl(s).',
  },

  // 9. Barium Sulfate Precipitation (BaCl₂ + H₂SO₄)
  {
    id: 'barium_sulfate_ppt',
    name: 'Barium Chloride + Sulfuric Acid Precipitation',
    reactants: ['bacl2', 'h2so4'],
    requiredAmounts: { bacl2: 20, h2so4: 20 },
    products: ['BaSO₄ (s)↓ (Dense White Sulfate)', '2HCl (aq)'],
    balancedEquation: 'BaCl₂(aq) + H₂SO₄(aq) → BaSO₄(s)↓ + 2HCl(aq)',
    reactionType: 'precipitation',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless BaCl₂(aq) + clear, colourless H₂SO₄(aq)',
      finalAppearance: 'Heavy porcelain-white BaSO₄(s) solid precipitate settled at the bottom beneath a clear, colourless HCl(aq) supernatant',
      temperatureDelta: 1.5,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: true,
      precipitateColor: '#FFFFFF',
      precipitateName: 'Barium Sulfate — BaSO₄(s)',
      isViolent: false,
      hazardType: 'none',
      description: 'Thick, opaque porcelain-white solid precipitate of insoluble Barium Sulfate (BaSO₄) forms immediately upon mixing the two colourless solutions and settles into a dense white solid bed.',
    },
    explanation: 'Barium cations (Ba²⁺) and sulfate anions (SO₄²⁻) combine to form BaSO₄(s), one of the least soluble salts in chemistry (Ksp = 1.1 × 10⁻¹⁰), creating an immediate white solid phase in colourless dilute hydrochloric acid.',
  },

  // 10. Golden Rain Precipitation (Pb(NO₃)₂ + KI)
  {
    id: 'golden_rain_ppt',
    name: 'Golden Rain: Lead(II) Nitrate + Potassium Iodide',
    reactants: ['pb_no3_2', 'ki'],
    requiredAmounts: { pb_no3_2: 20, ki: 20 },
    products: ['PbI₂ (s)↓ (Glittering Golden Yellow Crystals)', '2KNO₃ (aq)'],
    balancedEquation: 'Pb(NO₃)₂(aq) + 2KI(aq) → PbI₂(s)↓ + 2KNO₃(aq)',
    reactionType: 'precipitation',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless Pb(NO₃)₂(aq) + clear, colourless KI(aq)',
      finalAppearance: 'Brilliant golden-yellow PbI₂(s) crystalline platelets suspended and settling to the bottom beneath a clear, colourless KNO₃(aq) solution',
      temperatureDelta: 2.0,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: true,
      precipitateColor: '#EAB308',
      precipitateName: 'Lead(II) Iodide — PbI₂(s)',
      isViolent: false,
      hazardType: 'none',
      description: 'Famed "Golden Rain" reaction: mixing two clear, colourless solutions produces an instantaneous cloud of glittering canary-yellow Lead(II) Iodide (PbI₂) solid crystals that settle into a golden layer beneath colourless KNO₃(aq).',
    },
    explanation: 'Colourless hydrated Pb²⁺ cations and I⁻ anions bond to form insoluble hexagonal platelets of PbI₂(s) (Ksp = 9.8 × 10⁻⁹). Charge-transfer absorption in the solid PbI₂ crystal lattice gives the precipitate its vivid golden-yellow colour while spectator K⁺ and NO₃⁻ ions remain colourless in solution.',
  },

  // 11. Copper Hydroxide Gel (CuSO₄ + NaOH)
  {
    id: 'cu_hydroxide_ppt',
    name: 'Copper(II) Hydroxide Gelatinous Precipitation',
    reactants: ['cuso4', 'naoh'],
    requiredAmounts: { cuso4: 20, naoh: 20 },
    products: ['Cu(OH)₂ (s)↓ (Sky-Blue Gelatinous Precipitate)', 'Na₂SO₄ (aq)'],
    balancedEquation: 'CuSO₄(aq) + 2NaOH(aq) → Cu(OH)₂(s)↓ + Na₂SO₄(aq)',
    reactionType: 'precipitation',
    observableEffects: {
      colorChangeTo: '#BAE6FD',
      isFinalSolutionColorless: false,
      initialAppearance: 'Characteristic azure-blue CuSO₄(aq) solution + clear, colourless NaOH(aq)',
      finalAppearance: 'Deep sky-blue gelatinous Cu(OH)₂(s) flocculant precipitate suspended and settling in a paler blue/decolorized Na₂SO₄(aq) supernatant',
      temperatureDelta: 4.5,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: true,
      precipitateColor: '#0EA5E9',
      precipitateName: 'Copper(II) Hydroxide — Cu(OH)₂(s)',
      isViolent: false,
      hazardType: 'none',
      description: 'Adding colourless sodium hydroxide to azure-blue copper(II) sulfate precipitates a dense sky-blue gelatinous solid phase of Copper(II) Hydroxide Cu(OH)₂(s) as dissolved Cu²⁺ ions are removed from the liquid.',
    },
    explanation: 'Hydroxide ions (OH⁻) from sodium hydroxide react with blue hydrated cupric ions (Cu²⁺) due to the extremely low solubility product of Cu(OH)₂ (Ksp = 2.2 × 10⁻²⁰), forming a separate blue flocculant solid phase.',
  },

  // 12. Single Displacement (CuSO₄ + Fe)
  {
    id: 'redox_displacement',
    name: 'Iron-Copper Single Displacement Redox',
    reactants: ['cuso4', 'fe'],
    requiredAmounts: { cuso4: 20, fe: 10 },
    products: ['FeSO₄ (aq) (Pale Green Solution)', 'Cu (s)↓ (Reddish-Brown Metallic Deposit)'],
    balancedEquation: 'CuSO₄(aq) + Fe(s) → FeSO₄(aq) + Cu(s)↓',
    reactionType: 'redox',
    observableEffects: {
      colorChangeTo: '#86EFAC',
      isFinalSolutionColorless: false,
      initialAppearance: 'Characteristic azure-blue CuSO₄(aq) solution + dark grey metallic Fe(s) filings',
      finalAppearance: 'Pale sea-green FeSO₄(aq) solution + reddish-brown metallic copper Cu(s) deposited on the iron and settled at the bottom',
      temperatureDelta: 8.0,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: true,
      precipitateColor: '#B45309',
      precipitateName: 'Elemental Copper Metal — Cu(s)',
      solidCoatingColor: '#B45309',
      isViolent: false,
      hazardType: 'none',
      description: 'The azure-blue copper(II) sulfate solution gradually transitions to pale sea-green iron(II) sulfate FeSO₄(aq), while reddish-brown metallic copper Cu(s) coats the dark grey iron surface and settles at the bottom.',
    },
    explanation: 'Iron (E° = -0.44 V) is more reactive than copper (E° = +0.34 V). Metallic iron oxidizes to hexaaquairon(II) [Fe(H₂O)₆]²⁺ ions—which impart a characteristic pale green colour to the solution—while blue Cu²⁺ ions are reduced to reddish-brown metallic copper (Cu⁰).',
  },

  // 13. Single Displacement (CuSO₄ + Zn)
  {
    id: 'zn_cuso4_displacement',
    name: 'Zinc-Copper Exothermic Displacement',
    reactants: ['cuso4', 'zn'],
    requiredAmounts: { cuso4: 20, zn: 10 },
    products: ['ZnSO₄ (aq) (Colourless Solution)', 'Cu (s)↓ (Reddish-Brown Copper Deposit)'],
    balancedEquation: 'CuSO₄(aq) + Zn(s) → ZnSO₄(aq) + Cu(s)↓ + Heat',
    reactionType: 'single_displacement',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Characteristic azure-blue CuSO₄(aq) solution + bluish-silver Zn(s) granules',
      finalAppearance: 'Clear, colourless ZnSO₄(aq) solution + spongy reddish-brown metallic Cu(s) coating the zinc granules and bottom',
      temperatureDelta: 22.0,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: true,
      precipitateColor: '#B45309',
      precipitateName: 'Elemental Copper Metal — Cu(s)',
      solidCoatingColor: '#B45309',
      isViolent: false,
      hazardType: 'none',
      description: 'The azure-blue copper(II) sulfate solution decolorizes to clear, colourless zinc sulfate ZnSO₄(aq) as the zinc granules become heavily coated in spongy reddish-brown metallic copper Cu(s).',
    },
    explanation: 'Zinc (E° = -0.76 V) reduces blue Cu²⁺ ions (E° = +0.34 V) to reddish-brown metallic copper while oxidizing to d¹⁰ Zn²⁺ ions, which have no d–d electronic transitions and therefore form a colourless aqueous solution.',
  },

  // 14. Single Displacement (CuSO₄ + Mg)
  {
    id: 'mg_cuso4_displacement',
    name: 'Magnesium-Copper Exothermic Displacement',
    reactants: ['mg', 'cuso4'],
    requiredAmounts: { mg: 10, cuso4: 20 },
    products: ['MgSO₄ (aq) (Colourless)', 'Cu (s)↓ (Reddish-Brown Copper)', 'H₂ (g)↑'],
    balancedEquation: 'Mg(s) + CuSO₄(aq) → MgSO₄(aq) + Cu(s)↓',
    reactionType: 'single_displacement',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Characteristic azure-blue CuSO₄(aq) solution + silvery Mg(s) ribbon',
      finalAppearance: 'Fading/colourless MgSO₄(aq) solution + reddish-brown Cu(s) deposit + brisk H₂(g) effervescence',
      temperatureDelta: 36.0,
      producesGas: true,
      gasName: 'Hydrogen Gas (H₂)',
      gasColor: '#FFFFFF',
      gasVigor: 4,
      producesFumesAboveLiquid: false,
      producesPrecipitate: true,
      precipitateColor: '#B45309',
      precipitateName: 'Elemental Copper Metal — Cu(s)',
      solidCoatingColor: '#B45309',
      isViolent: false,
      hazardType: 'gas_eruption',
      description: 'Energetic displacement: the blue CuSO₄ solution fades toward colourless MgSO₄(aq) as reddish-brown metallic copper deposits on the magnesium ribbon accompanied by brisk H₂(g) bubbling.',
    },
    explanation: 'Magnesium (E° = -2.37 V) rapidly reduces Cu²⁺ ions to reddish-brown copper metal while forming colourless Mg²⁺(aq); because aqueous CuSO₄ is slightly acidic due to Cu²⁺ hydrolysis, magnesium simultaneously reduces H⁺ to H₂ gas bubbles.',
  },

  // 15. Fenton Reaction (H₂O₂ + Fe)
  {
    id: 'fenton_reaction',
    name: 'Fenton Catalytic Oxidation & Oxygen Evolution',
    reactants: ['h2o2', 'fe'],
    requiredAmounts: { h2o2: 20, fe: 10 },
    products: ['Fe³⁺ (aq) (Amber-Brown)', 'Fe(OH)₃ (s)↓', 'O₂ (g)↑', 'H₂O (l)'],
    balancedEquation: '2Fe(s) + 3H₂O₂(aq) → 2Fe(OH)₃(s)↓ + O₂(g)↑',
    reactionType: 'redox',
    observableEffects: {
      colorChangeTo: '#D97706',
      isFinalSolutionColorless: false,
      initialAppearance: 'Clear, colourless H₂O₂(aq) + dark grey Fe(s) powder',
      finalAppearance: 'Yellow-brown / amber ferric solution + reddish-brown Fe(OH)₃(s) floc + vigorous O₂(g) bubbling and surface froth',
      temperatureDelta: 42.0,
      producesGas: true,
      gasName: 'Oxygen Gas (O₂)',
      gasColor: '#FFFFFF',
      gasVigor: 5,
      producesFumesAboveLiquid: false,
      producesPrecipitate: true,
      precipitateColor: '#9A3412',
      precipitateName: 'Iron(III) Hydroxide — Fe(OH)₃(s)',
      isViolent: false,
      hazardType: 'foaming_fountain',
      description: 'Vigorous catalytic oxidation: colourless peroxide oxidizes iron into yellow-brown Fe³⁺(aq) and reddish-brown Fe(OH)₃ precipitate while nucleating dense streams of oxygen gas (O₂) bubbles and foam.',
    },
    explanation: 'The Fenton reaction couples iron oxidation (Fe⁰ → Fe²⁺ → Fe³⁺) with catalytic disproportionation of hydrogen peroxide into water and gaseous oxygen bubbles.',
  },

  // 16. Elephant Toothpaste (H₂O₂ + MnO₂)
  {
    id: 'elephant_toothpaste',
    name: 'Catalytic Peroxide Decomposition (MnO₂ Catalyst)',
    reactants: ['h2o2', 'mno2'],
    requiredAmounts: { h2o2: 20, mno2: 10 },
    products: ['2H₂O (l)', 'O₂ (g)↑ (Vigorous Oxygen Foam & Warm Steam)', 'MnO₂ (s) (Unconsumed Black Catalyst)'],
    balancedEquation: '2H₂O₂(aq) —[MnO₂(s)]→ 2H₂O(l) + O₂(g)↑ + Heat',
    reactionType: 'decomposition',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless H₂O₂(aq) + insoluble matte-black MnO₂(s) catalyst powder at bottom',
      finalAppearance: 'Clear, colourless H₂O(l) over black MnO₂(s) catalyst bed + intense O₂(g) bubble streams, thick white surface foam, and warm water-vapour mist',
      temperatureDelta: 48.0,
      producesGas: true,
      gasName: 'Oxygen Gas (O₂)',
      gasColor: '#FFFFFF',
      gasVigor: 5,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: true,
      hazardType: 'foaming_fountain',
      explosionIntensity: 0.6,
      description: 'Rapid catalytic decomposition! Insoluble black MnO₂ powder nucleates torrential streams of colourless oxygen (O₂) gas bubbles and thick white foam from colourless H₂O₂, releasing strong exothermic heat (+48°C) and warm water-vapour mist.',
    },
    explanation: 'Solid black MnO₂ provides heterogeneous surface active sites that lower the activation energy of H₂O₂ disproportionation into colourless liquid water and oxygen gas (ΔG° = -119.2 kJ/mol) without consuming the black MnO₂ catalyst.',
  },

  // 17. Catalytic KI Decomposition of Peroxide
  {
    id: 'ki_peroxide_catalysis',
    name: 'Potassium Iodide Catalyzed Peroxide Decomposition',
    reactants: ['h2o2', 'ki'],
    requiredAmounts: { h2o2: 20, ki: 20 },
    products: ['2H₂O (l)', 'O₂ (g)↑', 'I₂ / I₃⁻ (aq) (Amber-Brown Intermediate)'],
    balancedEquation: '2H₂O₂(aq) —[I⁻(aq)]→ 2H₂O(l) + O₂(g)↑',
    reactionType: 'decomposition',
    observableEffects: {
      colorChangeTo: '#B45309',
      isFinalSolutionColorless: false,
      initialAppearance: 'Clear, colourless H₂O₂(aq) + clear, colourless KI(aq)',
      finalAppearance: 'Golden amber-brown aqueous solution (due to I₃⁻ / I₂) with rapid O₂(g) bubble streams and surface foam',
      temperatureDelta: 32.0,
      producesGas: true,
      gasName: 'Oxygen Gas (O₂)',
      gasColor: '#FFFFFF',
      gasVigor: 4,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'gas_eruption',
      description: 'Upon mixing two colourless solutions, the liquid turns golden amber-brown from hypoiodite (IO⁻) and triiodide (I₃⁻) formation while effervescing vigorously with colourless oxygen gas (O₂) bubbles.',
    },
    explanation: 'Iodide acts as a homogeneous catalyst via a two-step mechanism: H₂O₂ + I⁻ → H₂O + IO⁻, followed by H₂O₂ + IO⁻ → H₂O + O₂(g)↑ + I⁻. Trace oxidation of I⁻ to I₂/I₃⁻ gives the aqueous phase its characteristic amber-brown iodine colour.',
  },

  // 18. Potassium + Water
  {
    id: 'alkali_explosion',
    name: 'Alkali Metal Violent Hydro-Explosion',
    reactants: ['k_metal', 'water'],
    requiredAmounts: { k_metal: 10, water: 25 },
    products: ['2KOH (aq) (Colourless)', 'H₂ (g)↑', '🔥 Lilac Flame & Shockwave'],
    balancedEquation: '2K(s) + 2H₂O(l) → 2KOH(aq) + H₂(g)↑ + ΔH (Explosive Ignition)',
    reactionType: 'violent_combustion',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Silvery metallic K(s) chunk + clear, colourless H₂O(l)',
      finalAppearance: 'Clear, colourless KOH(aq) solution beneath a lilac-violet potassium flame and white alkaline combustion smoke',
      temperatureDelta: 78.0,
      producesGas: true,
      gasName: 'Ignited Hydrogen Gas (H₂) & Alkaline Mist',
      gasColor: '#FFFFFF',
      gasVigor: 5,
      producesFumesAboveLiquid: true,
      fumeColor: '#F8FAFC',
      producesPrecipitate: false,
      isViolent: true,
      hazardType: 'explosion',
      flameColor: '#C084FC',
      explosionIntensity: 1.0,
      description: 'EXPLOSIVE DETONATION! Potassium skitters on the water surface with extreme exothermic heat, forming colourless KOH(aq) while igniting escaping hydrogen gas in a lilac-violet flame.',
    },
    explanation: 'Potassium vigorously reduces water protons to H₂ gas while forming colourless hydrated K⁺ and OH⁻ ions (-392 kJ/mol). The reaction heat ignites the escaping hydrogen gas with potassium’s characteristic 766 nm lilac atomic emission flame.',
  },

  // 19. Potassium + Acid Runaway
  {
    id: 'alkali_acid_explosion',
    name: 'Alkali Metal + Acid Catastrophic Runaway',
    reactants: ['k_metal', 'hcl'],
    requiredAmounts: { k_metal: 10, hcl: 20 },
    products: ['2KCl (aq) (Colourless)', 'H₂ (g)↑', '💥 Extreme Fiery Flash'],
    balancedEquation: '2K(s) + 2HCl(aq) → 2KCl(aq) + H₂(g)↑ + Extreme Fireball',
    reactionType: 'violent_combustion',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Silvery metallic K(s) chunk + clear, colourless HCl(aq)',
      finalAppearance: 'Clear, colourless KCl(aq) solution with violent hydrogen ignition fireball',
      temperatureDelta: 85.0,
      producesGas: true,
      gasName: 'Flaming Hydrogen Gas (H₂) & Acid Mist',
      gasColor: '#FED7AA',
      gasVigor: 5,
      producesFumesAboveLiquid: true,
      fumeColor: '#FED7AA',
      producesPrecipitate: false,
      isViolent: true,
      hazardType: 'explosion',
      flameColor: '#F97316',
      explosionIntensity: 1.0,
      description: 'CATASTROPHIC VIOLENT EXPLOSION! Free hydronium ions in colourless hydrochloric acid react with solid potassium instantaneously, forming colourless KCl(aq) and erupting into a violent fireball.',
    },
    explanation: 'Hydrochloric acid provides a high concentration of free H⁺ ions with zero activation barrier for reduction by potassium metal, causing instantaneous thermal runaway and hydrogen ignition.',
  },

  // 20. Potassium + Peroxide
  {
    id: 'k_peroxide_explosion',
    name: 'Potassium + Peroxide Hypergolic Detonation',
    reactants: ['k_metal', 'h2o2'],
    requiredAmounts: { k_metal: 10, h2o2: 20 },
    products: ['2KOH (aq) (Colourless)', 'O₂ (g)↑', 'H₂O (g)↑', '💥 Violent Hypergolic Fireball'],
    balancedEquation: '2K(s) + H₂O₂(aq) → 2KOH(aq) + O₂(g)↑ + Extreme Detonation',
    reactionType: 'violent_combustion',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Silvery metallic K(s) chunk + clear, colourless H₂O₂(aq)',
      finalAppearance: 'Clear, colourless KOH(aq) solution with hypergolic lilac-orange fireball and steam plume',
      temperatureDelta: 95.0,
      producesGas: true,
      gasName: 'Superheated Oxygen (O₂) & Steam',
      gasColor: '#FED7AA',
      gasVigor: 5,
      producesFumesAboveLiquid: true,
      fumeColor: '#FED7AA',
      producesPrecipitate: false,
      isViolent: true,
      hazardType: 'explosion',
      flameColor: '#C084FC',
      explosionIntensity: 1.0,
      description: 'HYPERGOLIC DETONATION! Concentrated peroxide oxidizes potassium metal instantaneously, forming colourless KOH(aq) and triggering an explosive fireball with superheated steam.',
    },
    explanation: 'Potassium metal (strongest reducing agent) and hydrogen peroxide (strong oxidizer) undergo hypergolic redox combustion on contact, liberating over 600 kJ/mol of thermal energy.',
  },

  // 21. Potassium + Copper Sulfate
  {
    id: 'k_cuso4_explosion',
    name: 'Potassium + Copper Sulfate Violent Displacement',
    reactants: ['k_metal', 'cuso4'],
    requiredAmounts: { k_metal: 10, cuso4: 20 },
    products: ['K₂SO₄ (aq)', 'Cu(OH)₂ (s)↓', 'CuO (s)↓', 'H₂ (g)↑ + Flame'],
    balancedEquation: '2K(s) + CuSO₄(aq) + 2H₂O(l) → K₂SO₄(aq) + Cu(OH)₂(s)↓ + H₂(g)↑ + Flame',
    reactionType: 'violent_combustion',
    observableEffects: {
      colorChangeTo: '#38BDF8',
      isFinalSolutionColorless: false,
      initialAppearance: 'Silvery K(s) chunk + characteristic azure-blue CuSO₄(aq)',
      finalAppearance: 'Paler blue solution with blue/black Cu(OH)₂ & CuO solid precipitate and lilac potassium flame',
      temperatureDelta: 82.0,
      producesGas: true,
      gasName: 'Hydrogen Gas (H₂) & Steam',
      gasColor: '#FDE047',
      gasVigor: 5,
      producesFumesAboveLiquid: true,
      fumeColor: '#F8FAFC',
      producesPrecipitate: true,
      precipitateColor: '#0EA5E9',
      precipitateName: 'Copper(II) Hydroxide / Oxide — Cu(OH)₂ / CuO(s)',
      isViolent: true,
      hazardType: 'explosion',
      flameColor: '#C084FC',
      explosionIntensity: 0.95,
      description: 'VIOLENT EXOTHERMIC DETONATION! Potassium violently reduces water and precipitates blue/black copper hydroxide/oxide while igniting hydrogen gas with lilac sparks.',
    },
    explanation: 'Potassium reacts aggressively with the aqueous solvent, generating OH⁻ ions that precipitate Cu(OH)₂(s) (partially dehydrating to black CuO at high temperature) while igniting evolved H₂ gas.',
  },

  // 22. Indicator + Base (Phenolphthalein + NaOH)
  {
    id: 'indicator_base_fuchsia',
    name: 'Phenolphthalein Alkaline Color Transition',
    reactants: ['phenolphthalein', 'naoh'],
    requiredAmounts: { phenolphthalein: 5, naoh: 20 },
    products: ['In²⁻ (aq) (Vivid Magenta-Fuchsia Dianion, pH > 8.2)'],
    balancedEquation: 'H₂In(aq) [colourless] + 2OH⁻(aq) → In²⁻(aq) [vivid magenta-fuchsia] + 2H₂O(l)',
    reactionType: 'neutralization',
    observableEffects: {
      colorChangeTo: '#F43F5E',
      isFinalSolutionColorless: false,
      initialAppearance: 'Clear, colourless Phenolphthalein(aq) + clear, colourless NaOH(aq)',
      finalAppearance: 'Clear, vivid magenta-fuchsia alkaline solution (λmax = 553 nm, no precipitate or gas)',
      temperatureDelta: 1.0,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'none',
      description: 'Instantaneous homogeneous colour transition from two clear, colourless liquids to a vivid magenta-fuchsia solution (λmax = 553 nm), confirming alkaline pH > 8.2.',
    },
    explanation: 'Hydroxide ions deprotonate the colourless lactone form of phenolphthalein (H₂In), opening the five-membered ring and creating a planar conjugated quinoid dianion (In²⁻) that strongly absorbs green light (~553 nm) and transmits bright pink-magenta.',
  },

  // 23. Universal Indicator Acid/Base
  {
    id: 'universal_indicator_acid',
    name: 'Universal Indicator Acidic Color Shift',
    reactants: ['universal_indicator', 'hcl'],
    requiredAmounts: { universal_indicator: 5, hcl: 20 },
    products: ['Protonated Indicator Mixture (Crimson Red, pH ~1.0)'],
    balancedEquation: 'Universal Indicator [neutral green] + H⁺(aq) → Protonated Acid Form [crimson red]',
    reactionType: 'neutralization',
    observableEffects: {
      colorChangeTo: '#EF4444',
      isFinalSolutionColorless: false,
      initialAppearance: 'Emerald-green Universal Indicator (pH 7) + clear, colourless HCl(aq)',
      finalAppearance: 'Vivid crimson-red acidic solution (pH ~1.0)',
      temperatureDelta: 1.0,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'none',
      description: 'The neutral emerald-green indicator solution shifts immediately to vivid crimson red upon mixing with colourless hydrochloric acid, indicating strongly acidic pH < 2.',
    },
    explanation: 'The multi-dye mixture (thymol blue, methyl red, bromothymol blue, phenolphthalein) becomes fully protonated in the presence of excess hydronium ions (H₃O⁺), shifting its absorption spectrum to transmit red light.',
  },

  // 24. Silver Nitrate + Hydrochloric Acid (AgCl White Precipitate)
  {
    id: 'agno3_hcl_ppt',
    name: 'Silver Chloride Acid Halide Precipitation',
    reactants: ['agno3', 'hcl'],
    requiredAmounts: { agno3: 15, hcl: 15 },
    products: ['AgCl (s)↓ (White Curdy Precipitate)', 'HNO₃ (aq) (Colourless)'],
    balancedEquation: 'AgNO₃(aq) + HCl(aq) → AgCl(s)↓ + HNO₃(aq)',
    reactionType: 'precipitation',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless AgNO₃(aq) + clear, colourless HCl(aq)',
      finalAppearance: 'Dense curdy white AgCl(s) precipitate settled at the bottom beneath a clear, colourless HNO₃(aq) solution',
      temperatureDelta: 1.5,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: true,
      precipitateColor: '#FFFFFF',
      precipitateName: 'Silver Chloride — AgCl(s)',
      isViolent: false,
      hazardType: 'none',
      description: 'Dense curdy white Silver Chloride (AgCl) solid precipitate forms immediately upon mixing colourless silver nitrate with colourless hydrochloric acid and settles to the bottom.',
    },
    explanation: 'Silver cations (Ag⁺) combine with chloride anions (Cl⁻) from HCl to form insoluble white AgCl(s) (Ksp = 1.8 × 10⁻¹⁰), leaving H⁺ and NO₃⁻ ions in the colourless supernatant as dilute nitric acid.',
  },

  // 25. Silver Nitrate + Potassium Iodide (AgI Pale Yellow Precipitate)
  {
    id: 'agno3_ki_ppt',
    name: 'Silver Iodide Halide Precipitation',
    reactants: ['agno3', 'ki'],
    requiredAmounts: { agno3: 15, ki: 15 },
    products: ['AgI (s)↓ (Pale Yellow Precipitate)', 'KNO₃ (aq) (Colourless)'],
    balancedEquation: 'AgNO₃(aq) + KI(aq) → AgI(s)↓ + KNO₃(aq)',
    reactionType: 'precipitation',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless AgNO₃(aq) + clear, colourless KI(aq)',
      finalAppearance: 'Opaque pale-yellow AgI(s) solid precipitate settled at the bottom beneath a clear, colourless KNO₃(aq) solution',
      temperatureDelta: 1.8,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: true,
      precipitateColor: '#FDE047',
      precipitateName: 'Silver Iodide — AgI(s)',
      isViolent: false,
      hazardType: 'none',
      description: 'Mixing colourless silver nitrate and colourless potassium iodide forms an opaque pale-yellow solid precipitate of Silver Iodide (AgI) that settles to the bottom beneath colourless KNO₃(aq).',
    },
    explanation: 'Silver ions (Ag⁺) and iodide ions (I⁻) form highly insoluble silver iodide (Ksp = 8.5 × 10⁻¹⁷). Greater covalent polarization of the larger I⁻ electron cloud by Ag⁺ narrows the band gap, giving solid AgI its pale yellow colour while the KNO₃ supernatant remains colourless.',
  },

  // 26. Barium Chloride + Copper(II) Sulfate (BaSO4 White Precipitate)
  {
    id: 'bacl2_cuso4_ppt',
    name: 'Barium Sulfate Double Displacement Precipitation',
    reactants: ['bacl2', 'cuso4'],
    requiredAmounts: { bacl2: 15, cuso4: 15 },
    products: ['BaSO₄ (s)↓ (White Precipitate)', 'CuCl₂ (aq) (Blue-Green Solution)'],
    balancedEquation: 'BaCl₂(aq) + CuSO₄(aq) → BaSO₄(s)↓ + CuCl₂(aq)',
    reactionType: 'precipitation',
    observableEffects: {
      colorChangeTo: '#0EA5E9',
      isFinalSolutionColorless: false,
      initialAppearance: 'Clear, colourless BaCl₂(aq) + characteristic azure-blue CuSO₄(aq)',
      finalAppearance: 'Heavy white BaSO₄(s) precipitate settled at the bottom beneath a clear cyan-blue CuCl₂(aq) supernatant',
      temperatureDelta: 2.0,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: true,
      precipitateColor: '#FFFFFF',
      precipitateName: 'Barium Sulfate — BaSO₄(s)',
      isViolent: false,
      hazardType: 'none',
      description: 'Heavy white Barium Sulfate (BaSO₄) solid precipitate forms rapidly and settles to the bottom as a distinct white layer beneath the blue-green Copper(II) Chloride aqueous solution.',
    },
    explanation: 'Barium ions (Ba²⁺) react with sulfate ions (SO₄²⁻) to precipitate insoluble white BaSO₄(s) (Ksp = 1.1 × 10⁻¹⁰), while hydrated Cu²⁺ and Cl⁻ ions remain dissolved in the blue-green supernatant.',
  },

  // 27. Sulfuric Acid + Magnesium (Hydrogen Gas Evolution)
  {
    id: 'h2so4_mg_gas',
    name: 'Magnesium-Sulfuric Acid Hydrogen Evolution',
    reactants: ['h2so4', 'mg'],
    requiredAmounts: { h2so4: 20, mg: 5 },
    products: ['MgSO₄ (aq) (Colourless)', 'H₂ (g)↑'],
    balancedEquation: 'Mg(s) + H₂SO₄(aq) → MgSO₄(aq) + H₂(g)↑',
    reactionType: 'single_displacement',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless H₂SO₄(aq) + silvery metallic Mg(s) ribbon',
      finalAppearance: 'Clear, colourless MgSO₄(aq) solution as the Mg ribbon dissolves with vigorous streams of colourless H₂(g) bubbles',
      temperatureDelta: 34.0,
      producesGas: true,
      gasName: 'Hydrogen Gas (H₂)',
      gasColor: '#FFFFFF',
      gasVigor: 5,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'gas_eruption',
      description: 'Vigorous liquid-phase effervescence: rapid streams of colourless hydrogen gas (H₂) bubbles nucleate on the magnesium ribbon and rise to burst at the meniscus as the metal dissolves into colourless MgSO₄(aq).',
    },
    explanation: 'Magnesium metal (E° = -2.37 V) reduces hydronium ions in sulfuric acid to colourless H₂ gas bubbles while oxidizing to colourless hydrated Mg²⁺ cations paired with SO₄²⁻ anions.',
  },

  // 28. Sulfuric Acid + Zinc (Hydrogen Gas Evolution)
  {
    id: 'h2so4_zn_gas',
    name: 'Zinc-Sulfuric Acid Hydrogen Evolution',
    reactants: ['h2so4', 'zn'],
    requiredAmounts: { h2so4: 20, zn: 10 },
    products: ['ZnSO₄ (aq) (Colourless)', 'H₂ (g)↑'],
    balancedEquation: 'Zn(s) + H₂SO₄(aq) → ZnSO₄(aq) + H₂(g)↑',
    reactionType: 'single_displacement',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless H₂SO₄(aq) + bluish-silver Zn(s) granules',
      finalAppearance: 'Clear, colourless ZnSO₄(aq) solution with steady streams of colourless H₂(g) bubbles rising from the zinc granules',
      temperatureDelta: 22.0,
      producesGas: true,
      gasName: 'Hydrogen Gas (H₂)',
      gasColor: '#FFFFFF',
      gasVigor: 4,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'none',
      description: 'Steady streams of colourless hydrogen gas (H₂) bubbles nucleate on the submerged zinc granules and rise through the clear, colourless zinc sulfate solution.',
    },
    explanation: 'Standard laboratory method for generating hydrogen gas: metallic zinc (E° = -0.76 V) transfers two valence electrons to H⁺ ions from H₂SO₄, forming colourless ZnSO₄(aq) and H₂(g) bubbles.',
  },

  // 29. Hydrochloric Acid + Iron (Hydrogen Gas Evolution)
  {
    id: 'hcl_fe_gas',
    name: 'Iron-Hydrochloric Acid Oxidation & Effervescence',
    reactants: ['hcl', 'fe'],
    requiredAmounts: { hcl: 20, fe: 10 },
    products: ['FeCl₂ (aq) (Pale Green Solution)', 'H₂ (g)↑'],
    balancedEquation: 'Fe(s) + 2HCl(aq) → FeCl₂(aq) + H₂(g)↑',
    reactionType: 'single_displacement',
    observableEffects: {
      colorChangeTo: '#86EFAC',
      isFinalSolutionColorless: false,
      initialAppearance: 'Clear, colourless HCl(aq) + dark grey metallic Fe(s) powder',
      finalAppearance: 'Pale sea-green FeCl₂(aq) solution with steady streams of colourless H₂(g) bubbles rising from the dissolving iron',
      temperatureDelta: 16.0,
      producesGas: true,
      gasName: 'Hydrogen Gas (H₂)',
      gasColor: '#FFFFFF',
      gasVigor: 3,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'none',
      description: 'Moderate effervescence of colourless hydrogen gas (H₂) bubbles rising from the iron particles, accompanied by a gradual transition of the colourless acid to a pale green iron(II) chloride solution.',
    },
    explanation: 'Metallic iron (E° = -0.44 V) is oxidized by hydrochloric acid to hydrated ferrous ions [Fe(H₂O)₆]²⁺—which impart a characteristic pale green colour—while H⁺ ions are reduced to colourless H₂ gas bubbles.',
  },

  // 30. Hydrochloric Acid + Sodium Bicarbonate (CO2 Effervescence)
  {
    id: 'hcl_nahco3_gas',
    name: 'Bicarbonate-Hydrochloric Acid Carbon Dioxide Effervescence',
    reactants: ['hcl', 'nahco3'],
    requiredAmounts: { hcl: 20, nahco3: 10 },
    products: ['NaCl (aq) (Colourless)', 'H₂O (l)', 'CO₂ (g)↑'],
    balancedEquation: 'HCl(aq) + NaHCO₃(s) → NaCl(aq) + H₂O(l) + CO₂(g)↑',
    reactionType: 'gas_evolution',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless HCl(aq) + white crystalline NaHCO₃(s) powder',
      finalAppearance: 'Clear, colourless NaCl(aq) solution with brisk rising CO₂(g) bubble streams and frothy meniscus',
      temperatureDelta: -3.5,
      producesGas: true,
      gasName: 'Carbon Dioxide (CO₂)',
      gasColor: '#FFFFFF',
      gasVigor: 5,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'foaming_fountain',
      description: 'Rapid liquid-phase effervescence of colourless carbon dioxide (CO₂) gas bubbles and surface froth as white sodium bicarbonate dissolves into a clear, colourless NaCl(aq) solution with a -3.5°C endothermic chill.',
    },
    explanation: 'Strong hydrochloric acid rapidly protonates bicarbonate ions (HCO₃⁻) to form carbonic acid (H₂CO₃), which immediately decomposes into H₂O and rising CO₂ gas bubbles inside the colourless NaCl solution.',
  },

  // 31. Copper + Silver Nitrate (Silver Tree Single Displacement)
  {
    id: 'cu_agno3_displacement',
    name: 'Copper-Silver Nitrate Redox Displacement ("Silver Crystals")',
    reactants: ['cu', 'agno3'],
    requiredAmounts: { cu: 10, agno3: 20 },
    products: ['Cu(NO₃)₂ (aq) (Azure Blue Solution)', '2Ag (s)↓ (Shimmering Metallic Silver)'],
    balancedEquation: 'Cu(s) + 2AgNO₃(aq) → Cu(NO₃)₂(aq) + 2Ag(s)↓',
    reactionType: 'single_displacement',
    observableEffects: {
      colorChangeTo: '#0284C7',
      isFinalSolutionColorless: false,
      initialAppearance: 'Reddish-brown metallic Cu(s) turnings + clear, colourless AgNO₃(aq)',
      finalAppearance: 'Characteristic azure-blue Cu(NO₃)₂(aq) solution + shimmering grey-silver metallic Ag(s) crystals coating the copper and bottom',
      temperatureDelta: 8.0,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: true,
      precipitateColor: '#CBD5E1',
      precipitateName: 'Elemental Silver Crystals — Ag(s)',
      solidCoatingColor: '#E2E8F0',
      isViolent: false,
      hazardType: 'none',
      description: 'The clear, colourless silver nitrate solution gradually turns vibrant azure-blue as copper oxidizes into hydrated Cu²⁺ ions, while shimmering grey-silver metallic Ag(s) crystals deposit on the copper and settle to the bottom.',
    },
    explanation: 'Because silver ions have a higher reduction potential (E° = +0.80 V) than copper (E° = +0.34 V), reddish-brown metallic copper reduces colourless Ag⁺ to solid metallic silver crystals (Ag⁰) while oxidizing to blue [Cu(H₂O)₆]²⁺ ions.',
  },

  // 32. Acetic Acid + Sodium Hydroxide Neutralization
  {
    id: 'ch3cooh_naoh_neutralization',
    name: 'Acetic Acid-Sodium Hydroxide Neutralization',
    reactants: ['ch3cooh', 'naoh'],
    requiredAmounts: { ch3cooh: 20, naoh: 20 },
    products: ['CH₃COONa (aq) (Colourless)', 'H₂O (l)'],
    balancedEquation: 'CH₃COOH(aq) + NaOH(aq) → CH₃COONa(aq) + H₂O(l)',
    reactionType: 'neutralization',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless CH₃COOH(aq) + clear, colourless NaOH(aq)',
      finalAppearance: 'Clear, colourless CH₃COONa(aq) solution with moderate exothermic warming (+10.5°C)',
      temperatureDelta: 10.5,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'none',
      description: 'Clear homogeneous neutralization between colourless acetic acid and colourless sodium hydroxide, producing a colourless aqueous sodium acetate solution with a +10.5°C temperature rise.',
    },
    explanation: 'Hydroxide ions deprotonate weak acetic acid molecules quantitatively to yield colourless acetate ions (CH₃COO⁻) and water, releasing heat of neutralization.',
  },

  // 33. Iron(III) Chloride + Sodium Hydroxide (Reddish-Brown Fe(OH)3 Precipitate)
  {
    id: 'fecl3_naoh_ppt',
    name: 'Iron(III) Hydroxide Reddish-Brown Precipitation',
    reactants: ['fecl3', 'naoh'],
    requiredAmounts: { fecl3: 15, naoh: 15 },
    products: ['Fe(OH)₃ (s)↓ (Reddish-Brown Gelatinous Precipitate)', '3NaCl (aq) (Colourless)'],
    balancedEquation: 'FeCl₃(aq) + 3NaOH(aq) → Fe(OH)₃(s)↓ + 3NaCl(aq)',
    reactionType: 'precipitation',
    observableEffects: {
      colorChangeTo: '#FEF3C7',
      isFinalSolutionColorless: false,
      initialAppearance: 'Yellow-brown / amber FeCl₃(aq) solution + clear, colourless NaOH(aq)',
      finalAppearance: 'Dense reddish-brown gelatinous Fe(OH)₃(s) precipitate settled at the bottom beneath a pale/colourless NaCl(aq) supernatant',
      temperatureDelta: 4.0,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: true,
      precipitateColor: '#9A3412',
      precipitateName: 'Iron(III) Hydroxide — Fe(OH)₃(s)',
      isViolent: false,
      hazardType: 'none',
      description: 'Mixing colourless sodium hydroxide into yellow-brown iron(III) chloride immediately forms a dense rust-reddish-brown gelatinous precipitate of Iron(III) Hydroxide Fe(OH)₃(s) as ferric ions precipitate out of solution.',
    },
    explanation: 'Hydrated ferric cations (Fe³⁺) have an extraordinarily low solubility product with hydroxide ions (Ksp = 2.8 × 10⁻³⁹), immediately forming an insoluble reddish-brown hydrous ferric oxide/hydroxide solid phase.',
  },

  // 34. Iron(II) Sulfate + Sodium Hydroxide (Green Fe(OH)2 Precipitate)
  {
    id: 'feso4_naoh_ppt',
    name: 'Iron(II) Hydroxide Green Gelatinous Precipitation',
    reactants: ['fe_so4', 'naoh'],
    requiredAmounts: { fe_so4: 15, naoh: 15 },
    products: ['Fe(OH)₂ (s)↓ (Dark Green Gelatinous Precipitate)', 'Na₂SO₄ (aq) (Colourless)'],
    balancedEquation: 'FeSO₄(aq) + 2NaOH(aq) → Fe(OH)₂(s)↓ + Na₂SO₄(aq)',
    reactionType: 'precipitation',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Pale sea-green FeSO₄(aq) solution + clear, colourless NaOH(aq)',
      finalAppearance: 'Dark forest-green gelatinous Fe(OH)₂(s) precipitate settled beneath a clear, colourless Na₂SO₄(aq) supernatant',
      temperatureDelta: 3.0,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: true,
      precipitateColor: '#15803D',
      precipitateName: 'Iron(II) Hydroxide — Fe(OH)₂(s)',
      isViolent: false,
      hazardType: 'none',
      description: 'Adding colourless sodium hydroxide to pale green iron(II) sulfate precipitates a characteristic dark green gelatinous solid phase of Iron(II) Hydroxide Fe(OH)₂(s), leaving a colourless Na₂SO₄(aq) supernatant.',
    },
    explanation: 'Ferrous ions (Fe²⁺) combine with hydroxide ions (OH⁻) to precipitate insoluble dark green Fe(OH)₂(s) (Ksp = 4.9 × 10⁻¹⁷), distinguishing Fe(II) (green hydroxide precipitate) from Fe(III) (reddish-brown hydroxide precipitate) in qualitative cation analysis.',
  },

  // 35. Sodium Thiosulfate + Hydrochloric Acid (Colloidal Yellow Sulfur Precipitation)
  {
    id: 'thiosulfate_acid_sulfur',
    name: 'Sodium Thiosulfate + Hydrochloric Acid Sulfur Precipitation ("Disappearing Cross")',
    reactants: ['na2s2o3', 'hcl'],
    requiredAmounts: { na2s2o3: 15, hcl: 15 },
    products: ['S (s)↓ (Bright Yellow Colloidal Sulfur Precipitate)', 'SO₂ (aq/g)', '2NaCl (aq)', 'H₂O (l)'],
    balancedEquation: 'Na₂S₂O₃(aq) + 2HCl(aq) → 2NaCl(aq) + SO₂(g) + H₂O(l) + S(s)↓',
    reactionType: 'precipitation',
    observableEffects: {
      colorChangeTo: '#FEF9C3',
      isFinalSolutionColorless: false,
      initialAppearance: 'Clear, colourless Na₂S₂O₃(aq) + clear, colourless HCl(aq)',
      finalAppearance: 'Opaque bright-yellow colloidal sulfur S(s) suspension and yellow sediment layer at the bottom with gentle SO₂ micro-bubbles',
      temperatureDelta: -1.5,
      producesGas: true,
      gasName: 'Dissolved Sulfur Dioxide (SO₂)',
      gasColor: '#FFFFFF',
      gasVigor: 1,
      producesFumesAboveLiquid: false,
      producesPrecipitate: true,
      precipitateColor: '#FACC15',
      precipitateName: 'Elemental Sulfur — S(s)',
      isViolent: false,
      hazardType: 'none',
      description: 'Classic "Disappearing Cross" kinetics reaction: mixing two clear, colourless solutions produces a gradually thickening cloud of bright yellow solid sulfur S(s) precipitate that turns the liquid opaque pale yellow and settles at the bottom.',
    },
    explanation: 'Acidification of thiosulfate ions (S₂O₃²⁻) triggers an internal disproportionation reaction in which one sulfur atom is oxidized to SO₂ while the other is reduced to insoluble elemental sulfur (S₈), which nucleates as a yellow solid phase.',
  },

  // 36. Potassium Permanganate + Iron(II) Sulfate Redox Decolorization
  {
    id: 'kmno4_feso4_redox',
    name: 'Potassium Permanganate + Iron(II) Sulfate Redox Titration',
    reactants: ['kmn_o4_reagent', 'fe_so4'],
    requiredAmounts: { kmn_o4_reagent: 15, fe_so4: 15 },
    products: ['Mn²⁺ (aq) (Nearly Colourless)', '5Fe³⁺ (aq) (Yellow-Amber Solution)'],
    balancedEquation: 'MnO₄⁻(aq) [deep purple] + 5Fe²⁺(aq) [pale green] + 8H⁺(aq) → Mn²⁺(aq) [colourless] + 5Fe³⁺(aq) [yellow-amber] + 4H₂O(l)',
    reactionType: 'redox',
    observableEffects: {
      colorChangeTo: '#F59E0B',
      isFinalSolutionColorless: false,
      initialAppearance: 'Deep purple-violet KMnO₄(aq) + pale sea-green FeSO₄(aq)',
      finalAppearance: 'Clear yellow-amber Fe³⁺(aq) solution as the intense purple permanganate completely decolorizes',
      temperatureDelta: 9.5,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'none',
      description: 'Self-indicating redox reaction: the intense deep purple permanganate (MnO₄⁻) colour vanishes as Mn(VII) is reduced to nearly colourless Mn²⁺(aq) while pale green Fe²⁺(aq) is oxidized to yellow-amber Fe³⁺(aq).',
    },
    explanation: 'Permanganate ion (MnO₄⁻, Mn in +7 oxidation state) owes its intense purple colour to ligand-to-metal charge transfer (LMCT). Reduction by Fe²⁺ yields d⁵ Mn²⁺ (spin-forbidden transitions, virtually colourless) and oxidizes pale green Fe²⁺ to yellow-amber Fe³⁺.',
  },

  // 37. Potassium Permanganate + Hydrogen Peroxide Redox Effervescence
  {
    id: 'kmno4_h2o2_redox',
    name: 'Potassium Permanganate + Hydrogen Peroxide Oxygen Evolution',
    reactants: ['kmn_o4_reagent', 'h2o2'],
    requiredAmounts: { kmn_o4_reagent: 15, h2o2: 15 },
    products: ['2MnO₂ (s)↓ (Dark Brown-Black Precipitate)', '3O₂ (g)↑', '2KOH (aq)', '2H₂O (l)'],
    balancedEquation: '2KMnO₄(aq) + 3H₂O₂(aq) → 2MnO₂(s)↓ + 3O₂(g)↑ + 2KOH(aq) + 2H₂O(l)',
    reactionType: 'redox',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Deep purple-violet KMnO₄(aq) + clear, colourless H₂O₂(aq)',
      finalAppearance: 'Decolorized colourless KOH(aq) supernatant + dark brown-black MnO₂(s) precipitate + vigorous O₂(g) bubble streams',
      temperatureDelta: 28.0,
      producesGas: true,
      gasName: 'Oxygen Gas (O₂)',
      gasColor: '#FFFFFF',
      gasVigor: 5,
      producesFumesAboveLiquid: false,
      producesPrecipitate: true,
      precipitateColor: '#451A03',
      precipitateName: 'Manganese(IV) Dioxide — MnO₂(s)',
      isViolent: false,
      hazardType: 'gas_eruption',
      description: 'The deep purple permanganate solution rapidly decolorizes while precipitating dark brown-black MnO₂(s) and effervescing vigorously with colourless oxygen gas (O₂) bubbles.',
    },
    explanation: 'In neutral aqueous solution, purple MnO₄⁻ (+7) oxidizes hydrogen peroxide to O₂(g) bubbles while being reduced to insoluble dark brown-black manganese(IV) dioxide MnO₂(s) (+4), leaving a colourless supernatant.',
  },

  // 38. Aqueous Iodine + Sodium Thiosulfate (Iodometric Decolorization)
  {
    id: 'iodine_thiosulfate_redox',
    name: 'Aqueous Iodine + Sodium Thiosulfate Iodometric Reduction',
    reactants: ['iodine_solution', 'na2s2o3'],
    requiredAmounts: { iodine_solution: 15, na2s2o3: 15 },
    products: ['2NaI (aq) (Colourless)', 'Na₂S₄O₆ (aq) (Colourless)'],
    balancedEquation: 'I₂(aq) [amber-brown] + 2Na₂S₂O₃(aq) [colourless] → 2NaI(aq) [colourless] + Na₂S₄O₆(aq) [colourless]',
    reactionType: 'redox',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Characteristic amber-brown I₂/KI(aq) solution + clear, colourless Na₂S₂O₃(aq)',
      finalAppearance: 'Completely clear, colourless aqueous solution of NaI(aq) and Na₂S₄O₆(aq)',
      temperatureDelta: 2.5,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'none',
      description: 'Classic iodometric titration endpoint: the characteristic amber-brown aqueous iodine solution rapidly decolorizes to a crystal-clear, colourless solution of iodide and tetrathionate ions.',
    },
    explanation: 'Thiosulfate ions (S₂O₃²⁻) quantitatively reduce amber-brown molecular iodine / triiodide (I₂ / I₃⁻) to colourless hydrated iodide anions (I⁻) while oxidizing to colourless tetrathionate (S₄O₆²⁻).',
  },

  // 39. Biological Catalysis of Hydrogen Peroxide by Catalase Enzyme
  {
    id: 'catalase_peroxide_decomposition',
    name: 'Biological Peroxide Decomposition (Catalase Enzyme)',
    reactants: ['h2o2', 'catalase_enzyme'],
    requiredAmounts: { h2o2: 20, catalase_enzyme: 5 },
    products: ['2H₂O (l)', 'O₂ (g)↑ (Rapid Oxygen Effervescence)', 'Catalase Enzyme (Unconsumed Biocatalyst)'],
    balancedEquation: '2H₂O₂(aq) —[Catalase Enzyme]→ 2H₂O(l) + O₂(g)↑',
    reactionType: 'decomposition',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless H₂O₂(aq) + translucent aqueous Catalase enzyme extract',
      finalAppearance: 'Clear aqueous solution with dense streams of colourless O₂(g) bubbles and white surface foam collar',
      temperatureDelta: 18.0,
      producesGas: true,
      gasName: 'Oxygen Gas (O₂)',
      gasColor: '#FFFFFF',
      gasVigor: 5,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'foaming_fountain',
      description: 'Biological enzyme catalysis: adding Catalase enzyme to colourless hydrogen peroxide triggers immediate, vigorous liquid-phase effervescence of colourless oxygen gas (O₂) bubbles and surface froth at physiological temperature without consuming the enzyme.',
    },
    explanation: 'Catalase is a tetrameric heme enzyme with a turnover number of ~4 × 10⁷ molecules of H₂O₂ per second per active center. Its iron(III)-porphyrin cofactor provides a low-energy pathway (Eₐ < 8 kJ/mol vs. ~75 kJ/mol uncatalyzed) to disproportionate H₂O₂ into H₂O and O₂(g).',
  },

  // 40. Nitric Acid + Sodium Hydroxide Neutralization
  {
    id: 'hno3_naoh_neutralization',
    name: 'Nitric Acid + Sodium Hydroxide Neutralization',
    reactants: ['hno3', 'naoh'],
    requiredAmounts: { hno3: 15, naoh: 15 },
    products: ['NaNO₃ (aq) (Colourless)', 'H₂O (l)'],
    balancedEquation: 'HNO₃(aq) + NaOH(aq) → NaNO₃(aq) + H₂O(l)',
    reactionType: 'neutralization',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless HNO₃(aq) + clear, colourless NaOH(aq)',
      finalAppearance: 'Clear, colourless NaNO₃(aq) neutral solution with +13.6°C exothermic temperature rise',
      temperatureDelta: 13.6,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'none',
      description: 'Strong acid–strong base neutralization between nitric acid and sodium hydroxide producing colourless aqueous sodium nitrate and water with a +13.6°C exothermic rise.',
    },
    explanation: 'Complete dissociation of HNO₃ and NaOH means the net ionic reaction is H⁺(aq) + OH⁻(aq) → H₂O(l) (ΔH° = -57.3 kJ/mol), leaving Na⁺ and NO₃⁻ as colourless spectator ions.',
  },

  // 41. Phosphoric Acid + Sodium Hydroxide Triprotic Neutralization
  {
    id: 'h3po4_naoh_neutralization',
    name: 'Phosphoric Acid + Sodium Hydroxide Neutralization',
    reactants: ['h3po4', 'naoh'],
    requiredAmounts: { h3po4: 15, naoh: 15 },
    products: ['Na₃PO₄ (aq) (Colourless)', '3H₂O (l)'],
    balancedEquation: 'H₃PO₄(aq) + 3NaOH(aq) → Na₃PO₄(aq) + 3H₂O(l)',
    reactionType: 'neutralization',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless H₃PO₄(aq) + clear, colourless NaOH(aq)',
      finalAppearance: 'Clear, colourless trisodium phosphate Na₃PO₄(aq) solution with exothermic warming',
      temperatureDelta: 14.2,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'none',
      description: 'Stepwise neutralization of triprotic phosphoric acid by sodium hydroxide yielding a clear, colourless phosphate buffer/salt solution and noticeable exothermic heat.',
    },
    explanation: 'Triprotic phosphoric acid (pKa₁ = 2.15, pKa₂ = 7.20, pKa₃ = 12.35) transfers protons across three buffer stages to hydroxide ions to form aqueous sodium phosphate and water.',
  },

  // 42. Oxalic Acid + Sodium Hydroxide Neutralization
  {
    id: 'h2c2o4_naoh_neutralization',
    name: 'Oxalic Acid + Sodium Hydroxide Diprotic Neutralization',
    reactants: ['oxalic_acid', 'naoh'],
    requiredAmounts: { oxalic_acid: 15, naoh: 15 },
    products: ['Na₂C₂O₄ (aq) (Colourless)', '2H₂O (l)'],
    balancedEquation: 'H₂C₂O₄(aq) + 2NaOH(aq) → Na₂C₂O₄(aq) + 2H₂O(l)',
    reactionType: 'neutralization',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless H₂C₂O₄(aq) + clear, colourless NaOH(aq)',
      finalAppearance: 'Clear, colourless sodium oxalate Na₂C₂O₄(aq) solution',
      temperatureDelta: 11.8,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'none',
      description: 'Standard primary-standard acidimetric titration reaction: diprotic oxalic acid reacts with sodium hydroxide to form colourless aqueous sodium oxalate and water.',
    },
    explanation: 'Oxalic acid (HOOC–COOH, pKa₁ = 1.25, pKa₂ = 4.14) serves as a primary standard in Class 11/12 volumetric analysis to standardize NaOH solutions.',
  },

  // 43. Citric Acid + Sodium Bicarbonate Endothermic Effervescence
  {
    id: 'citric_acid_nahco3_gas',
    name: 'Citric Acid + Baking Soda Endothermic CO₂ Effervescence',
    reactants: ['c6h8o7', 'nahco3'],
    requiredAmounts: { c6h8o7: 15, nahco3: 10 },
    products: ['Na₃C₆H₅O₇ (aq) (Sodium Citrate)', '3H₂O (l)', '3CO₂ (g)↑'],
    balancedEquation: 'C₆H₈O₇(aq) + 3NaHCO₃(s) → Na₃C₆H₅O₇(aq) + 3H₂O(l) + 3CO₂(g)↑',
    reactionType: 'gas_evolution',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless citric acid solution + white NaHCO₃(s) powder',
      finalAppearance: 'Clear, colourless sodium citrate solution with vigorous streams of CO₂(g) bubbles and distinct endothermic cooling (-5.2°C)',
      temperatureDelta: -5.2,
      producesGas: true,
      gasName: 'Carbon Dioxide (CO₂)',
      gasColor: '#FFFFFF',
      gasVigor: 5,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'foaming_fountain',
      description: 'Classic endothermic fizzing reaction: triprotic citric acid reacts with sodium bicarbonate to release vigorous streams of carbon dioxide bubbles while cooling the solution by 5.2°C.',
    },
    explanation: 'Proton transfer from citric acid to HCO₃⁻ forms unstable H₂CO₃, which decomposes into CO₂(g) and H₂O(l). Because the entropy increase (ΔS > 0) of gas release drives the reaction, it proceeds spontaneously despite absorbing heat from the solution (ΔH > 0).',
  },

  // 44. Hydrochloric Acid + Sodium Carbonate CO2 Effervescence
  {
    id: 'hcl_na2co3_gas',
    name: 'Hydrochloric Acid + Sodium Carbonate CO₂ Effervescence',
    reactants: ['hcl', 'na2co3'],
    requiredAmounts: { hcl: 15, na2co3: 15 },
    products: ['2NaCl (aq) (Colourless)', 'H₂O (l)', 'CO₂ (g)↑'],
    balancedEquation: '2HCl(aq) + Na₂CO₃(aq) → 2NaCl(aq) + H₂O(l) + CO₂(g)↑',
    reactionType: 'gas_evolution',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless HCl(aq) + clear, colourless Na₂CO₃(aq)',
      finalAppearance: 'Clear, colourless NaCl(aq) solution with brisk effervescence of colourless CO₂(g) bubbles',
      temperatureDelta: 4.5,
      producesGas: true,
      gasName: 'Carbon Dioxide (CO₂)',
      gasColor: '#FFFFFF',
      gasVigor: 5,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'none',
      description: 'Brisk effervescence of colourless, odourless carbon dioxide (CO₂) gas bubbles as hydrochloric acid protonates carbonate ions in two steps via bicarbonate.',
    },
    explanation: 'Carbonate ions (CO₃²⁻) accept two protons from HCl to form carbonic acid (H₂CO₃), which rapidly dehydrates into rising CO₂(g) bubbles and water.',
  },

  // 45. Sulfuric Acid + Barium Hydroxide Conductometric Precipitation Neutralization
  {
    id: 'h2so4_ba_oh2_ppt',
    name: 'Sulfuric Acid + Barium Hydroxide Simultaneous Neutralization & Precipitation',
    reactants: ['h2so4', 'ba_oh2'],
    requiredAmounts: { h2so4: 15, ba_oh2: 15 },
    products: ['BaSO₄ (s)↓ (Dense White Precipitate)', '2H₂O (l)'],
    balancedEquation: 'H₂SO₄(aq) + Ba(OH)₂(aq) → BaSO₄(s)↓ + 2H₂O(l)',
    reactionType: 'precipitation',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless H₂SO₄(aq) + clear, colourless Ba(OH)₂(aq)',
      finalAppearance: 'Dense chalky-white BaSO₄(s) precipitate settling beneath pure liquid water',
      temperatureDelta: 15.0,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: true,
      precipitateColor: '#F8FAFC',
      precipitateName: 'Barium Sulfate — BaSO₄(s)',
      isViolent: false,
      hazardType: 'none',
      description: 'Simultaneous acid–base neutralization and sulfate precipitation: mixing clear H₂SO₄ and Ba(OH)₂ immediately forms a dense white precipitate of insoluble BaSO₄(s) and pure water.',
    },
    explanation: 'At the stoichiometric equivalence point, both H⁺/OH⁻ combine to form H₂O and Ba²⁺/SO₄²⁻ precipitate as insoluble BaSO₄(s) (Ksp = 1.1 × 10⁻¹⁰), causing solution electrical conductivity to drop nearly to zero.',
  },

  // 46. Silver Nitrate + Potassium Chromate (Mohr's Brick-Red Precipitation)
  {
    id: 'agno3_k2cro4_mohr',
    name: "Silver Nitrate + Potassium Chromate Brick-Red Precipitation (Mohr's Method)",
    reactants: ['agno3', 'k2cro4'],
    requiredAmounts: { agno3: 15, k2cro4: 10 },
    products: ['Ag₂CrO₄ (s)↓ (Brick-Red Precipitate)', '2KNO₃ (aq) (Colourless)'],
    balancedEquation: '2AgNO₃(aq) + K₂CrO₄(aq) → Ag₂CrO₄(s)↓ + 2KNO₃(aq)',
    reactionType: 'precipitation',
    observableEffects: {
      colorChangeTo: '#FEF08A',
      isFinalSolutionColorless: false,
      initialAppearance: 'Clear, colourless AgNO₃(aq) + bright lemon-yellow K₂CrO₄(aq)',
      finalAppearance: 'Distinctive brick-red Ag₂CrO₄(s) precipitate settled at the bottom of the beaker',
      temperatureDelta: 3.5,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: true,
      precipitateColor: '#B91C1C',
      precipitateName: 'Silver Chromate — Ag₂CrO₄(s)',
      isViolent: false,
      hazardType: 'none',
      description: "Mohr's argentometric indicator reaction: silver cations combine with yellow chromate anions to form an unmistakable brick-red precipitate of Silver Chromate Ag₂CrO₄(s).",
    },
    explanation: 'In Mohr’s titration for chloride determination, yellow K₂CrO₄ acts as a precipitation indicator: once AgCl (Ksp = 1.8 × 10⁻¹⁰) finishes precipitating, excess Ag⁺ reacts with CrO₄²⁻ to precipitate brick-red Ag₂CrO₄ (Ksp = 1.1 × 10⁻¹²).',
  },

  // 47. Potassium Dichromate + Iron(II) Sulfate Redox Titration
  {
    id: 'k2cr2o7_feso4_redox',
    name: 'Potassium Dichromate + Iron(II) Sulfate Redox Reaction (Orange to Emerald Green)',
    reactants: ['k2cr2o7', 'fe_so4'],
    requiredAmounts: { k2cr2o7: 15, fe_so4: 15 },
    products: ['2Cr³⁺ (aq) (Deep Emerald Green)', '6Fe³⁺ (aq)', '7H₂O (l)'],
    balancedEquation: 'Cr₂O₇²⁻(aq) [orange] + 6Fe²⁺(aq) + 14H⁺(aq) → 2Cr³⁺(aq) [emerald green] + 6Fe³⁺(aq) + 7H₂O(l)',
    reactionType: 'redox',
    observableEffects: {
      colorChangeTo: '#059669',
      isFinalSolutionColorless: false,
      initialAppearance: 'Vivid orange K₂Cr₂O₇(aq) + pale sea-green FeSO₄(aq)',
      finalAppearance: 'Deep emerald-green Cr³⁺(aq) solution as hexavalent dichromate is reduced',
      temperatureDelta: 11.0,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'none',
      description: 'The bright orange dichromate solution transforms into a rich emerald-green chromium(III) solution as Cr(VI) oxidizes Fe(II) to Fe(III).',
    },
    explanation: 'Dichromate ion (Cr₂O₇²⁻, E° = +1.33 V) is a classic primary-standard oxidizing agent in acidic medium, accepting 6 electrons per formula unit from Fe²⁺ to form green hydrated [Cr(H₂O)₆]³⁺ ions.',
  },

  // 48. Potassium Permanganate + Oxalic Acid Redox Decolorization & CO2 Evolution
  {
    id: 'kmno4_oxalic_acid_redox',
    name: 'Potassium Permanganate + Oxalic Acid Autocatalytic Redox Titration',
    reactants: ['kmn_o4_reagent', 'oxalic_acid'],
    requiredAmounts: { kmn_o4_reagent: 15, oxalic_acid: 15 },
    products: ['2Mn²⁺ (aq) (Colourless Autocatalyst)', '10CO₂ (g)↑', '8H₂O (l)'],
    balancedEquation: '2MnO₄⁻(aq) [purple] + 5H₂C₂O₄(aq) + 6H⁺(aq) → 2Mn²⁺(aq) [colourless] + 10CO₂(g)↑ + 8H₂O(l)',
    reactionType: 'redox',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Deep purple-violet KMnO₄(aq) + clear, colourless H₂C₂O₄(aq)',
      finalAppearance: 'Crystal-clear, colourless Mn²⁺(aq) solution with fine streams of colourless CO₂(g) bubbles',
      temperatureDelta: 12.0,
      producesGas: true,
      gasName: 'Carbon Dioxide (CO₂)',
      gasColor: '#FFFFFF',
      gasVigor: 3,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'none',
      description: 'Textbook Class 12 autocatalytic redox reaction: deep purple permanganate oxidizes oxalic acid into colourless carbon dioxide bubbles while decolorizing to Mn²⁺(aq), which itself autocatalyzes subsequent reduction.',
    },
    explanation: 'Permanganate oxidizes oxalate (C₂O₄²⁻, carbon in +3 state) to CO₂ (+4 state). Once trace Mn²⁺ ions form, they complex with oxalate to lower the activation barrier—a classic demonstration of autocatalysis.',
  },

  // 49. Aqueous Iodine + Starch Solution (Blue-Black Complexation)
  {
    id: 'iodine_starch_complex',
    name: 'Iodine–Starch Deep Blue-Black Clathrate Complex Test',
    reactants: ['iodine_solution', 'starch_solution'],
    requiredAmounts: { iodine_solution: 10, starch_solution: 10 },
    products: ['Starch–I₃⁻ / I₅⁻ Helical Clathrate Complex (Deep Blue-Black)'],
    balancedEquation: 'I₃⁻(aq) [amber] + Amylose Helix (Starch) → [Amylose–Polyiodide] Complex (aq) [deep blue-black]',
    reactionType: 'redox',
    observableEffects: {
      colorChangeTo: '#1E1B4B',
      isFinalSolutionColorless: false,
      initialAppearance: 'Amber-brown I₂/KI(aq) solution + translucent colourless starch solution',
      finalAppearance: 'Intense, opaque indigo-blue-black starch–iodine charge-transfer complex solution',
      temperatureDelta: 1.0,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'none',
      description: 'Adding aqueous iodine to starch solution immediately produces an unmistakable, intense blue-black colour as linear polyiodide chains slip inside the helical amylose coils of starch.',
    },
    explanation: 'Linear triiodide/pentaiodide anions (I₃⁻ / I₅⁻) insert into the hydrophobic interior of the α(1→4)-linked amylose helix, forming a charge-transfer inclusion complex with intense absorption across the visible spectrum.',
  },

  // 50. Sodium Hypochlorite + Potassium Iodide Oxidation
  {
    id: 'naocl_ki_redox',
    name: 'Sodium Hypochlorite (Bleach) + Potassium Iodide Redox Oxidation',
    reactants: ['naocl', 'ki'],
    requiredAmounts: { naocl: 15, ki: 15 },
    products: ['I₂ / I₃⁻ (aq) (Amber-Brown Solution)', 'NaCl (aq)', '2KOH (aq)'],
    balancedEquation: 'NaOCl(aq) + 2KI(aq) + H₂O(l) → I₂(aq) + NaCl(aq) + 2KOH(aq)',
    reactionType: 'redox',
    observableEffects: {
      colorChangeTo: '#B45309',
      isFinalSolutionColorless: false,
      initialAppearance: 'Pale greenish-yellow NaOCl(aq) + clear, colourless KI(aq)',
      finalAppearance: 'Rich amber-brown aqueous iodine (I₂/I₃⁻) solution',
      temperatureDelta: 6.5,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'none',
      description: 'Hypochlorite rapidly oxidizes colourless iodide ions into amber-brown molecular iodine (I₂ / I₃⁻) in solution.',
    },
    explanation: 'Hypochlorite (OCl⁻, Cl in +1 oxidation state, E° = +0.89 V) is a strong two-electron oxidizing agent that oxidizes I⁻ (E° = +0.54 V) to I₂ while being reduced to chloride (Cl⁻).',
  },

  // 51. Salicylic Acid + Iron(III) Chloride Phenolic Complexation Test
  {
    id: 'salicylic_acid_fecl3_complex',
    name: 'Salicylic Acid + Ferric Chloride Violet Phenolic Complex Test',
    reactants: ['salicylic_acid', 'fecl3'],
    requiredAmounts: { salicylic_acid: 10, fecl3: 10 },
    products: ['[Fe(Salicylate)]⁺ (aq) (Deep Royal Violet Charge-Transfer Complex)', '2HCl (aq)'],
    balancedEquation: 'C₆H₄(OH)COOH(s/aq) + FeCl₃(aq) → [Fe(OC₆H₄COO)]⁺(aq) [deep violet] + 2H⁺(aq) + 3Cl⁻(aq)',
    reactionType: 'redox',
    observableEffects: {
      colorChangeTo: '#6D28D9',
      isFinalSolutionColorless: false,
      initialAppearance: 'White crystalline salicylic acid + yellow-amber FeCl₃(aq)',
      finalAppearance: 'Intense deep purple-violet iron(III)–salicylate chelate solution',
      temperatureDelta: 2.0,
      producesGas: false,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'none',
      description: 'Qualitative organic functional-group test for phenols: ferric chloride chelates the ortho-hydroxybenzoate group of salicylic acid to form an intense royal-violet complex.',
    },
    explanation: 'Phenolic –OH groups coordinate to high-spin Fe³⁺ ions; salicylic acid forms a particularly stable six-membered bidentate chelate ring exhibiting a strong ligand-to-metal charge transfer (LMCT) band at ~530 nm.',
  },

  // 52. Aluminium + Sodium Hydroxide Amphoteric Hydrogen Evolution
  {
    id: 'naoh_al_gas',
    name: 'Amphoteric Aluminium + Sodium Hydroxide Hydrogen Evolution',
    reactants: ['naoh', 'al_metal'],
    requiredAmounts: { naoh: 20, al_metal: 5 },
    products: ['2Na[Al(OH)₄] (aq) (Colourless Sodium Tetrahydroxoaluminate)', '3H₂ (g)↑'],
    balancedEquation: '2Al(s) + 2NaOH(aq) + 6H₂O(l) → 2Na[Al(OH)₄](aq) + 3H₂(g)↑',
    reactionType: 'single_displacement',
    observableEffects: {
      colorChangeTo: '#F8FAFC',
      isFinalSolutionColorless: true,
      initialAppearance: 'Clear, colourless NaOH(aq) + silvery metallic Al(s) foil/granules',
      finalAppearance: 'Clear, colourless sodium aluminate solution with vigorous streams of colourless H₂(g) bubbles',
      temperatureDelta: 29.0,
      producesGas: true,
      gasName: 'Hydrogen Gas (H₂)',
      gasColor: '#FFFFFF',
      gasVigor: 5,
      producesFumesAboveLiquid: false,
      producesPrecipitate: false,
      isViolent: false,
      hazardType: 'gas_eruption',
      description: 'Demonstration of amphoteric metal behavior: strong aqueous alkali dissolves the protective oxide film on aluminium and oxidizes the metal to soluble [Al(OH)₄]⁻ with vigorous evolution of H₂(g) bubbles.',
    },
    explanation: 'Unlike most metals, aluminium is amphoteric—it reacts with both strong acids (forming Al³⁺) and strong bases (forming soluble tetrahydroxoaluminate [Al(OH)₄]⁻) while reducing water/protons to hydrogen gas.',
  },
];

/**
 * Compatible catalyst lookup map by primary reaction / reactant.
 */
export const COMPATIBLE_CATALYSTS: Record<string, string[]> = {
  h2o2: ['mno2', 'ki', 'catalase_enzyme', 'fe', 'fecl3', 'cuo'],
  decomposition: ['mno2', 'ki', 'catalase_enzyme', 'fecl3', 'cuo'],
  redox: ['fe', 'mnso4'],
};

const EXTRA_REAGENT_LABELS: Record<string, { name: string; formula: string; type: string }> = {
  water: { name: 'Water', formula: 'H₂O', type: 'solvent' },
  nahco3: { name: 'Sodium Bicarbonate (Baking Soda)', formula: 'NaHCO₃ (s)', type: 'salt' },
  c6h8o7: { name: 'Citric Acid Solution', formula: 'C₆H₈O₇ (aq)', type: 'acid' },
  koh: { name: 'Potassium Hydroxide', formula: 'KOH (aq)', type: 'base' },
  nh3: { name: 'Aqueous Ammonia', formula: 'NH₃ (aq)', type: 'base' },
  ba_oh2: { name: 'Barium Hydroxide', formula: 'Ba(OH)₂ (aq)', type: 'base' },
  ca_oh2: { name: 'Calcium Hydroxide (Limewater)', formula: 'Ca(OH)₂ (aq)', type: 'base' },
  na2co3: { name: 'Sodium Carbonate', formula: 'Na₂CO₃ (aq)', type: 'salt' },
  fecl3: { name: 'Iron(III) Chloride', formula: 'FeCl₃ (aq)', type: 'salt' },
  fe_so4: { name: 'Iron(II) Sulfate', formula: 'FeSO₄ (aq)', type: 'salt' },
  kmn_o4_reagent: { name: 'Potassium Permanganate Solution', formula: 'KMnO₄ (aq)', type: 'reagent' },
  na2s2o3: { name: 'Sodium Thiosulfate Solution', formula: 'Na₂S₂O₃ (aq)', type: 'reducing_agent' },
  iodine_solution: { name: 'Aqueous Iodine (Lugol’s Solution)', formula: 'I₂ / KI (aq)', type: 'reagent' },
  znso4: { name: 'Zinc Sulfate', formula: 'ZnSO₄ (aq)', type: 'salt' },
  mgso4: { name: 'Magnesium Sulfate', formula: 'MgSO₄ (aq)', type: 'salt' },
  kno3: { name: 'Potassium Nitrate', formula: 'KNO₃ (aq)', type: 'salt' },
  cacl2: { name: 'Calcium Chloride', formula: 'CaCl₂ (aq)', type: 'salt' },
  nh4cl: { name: 'Ammonium Chloride', formula: 'NH₄Cl (aq)', type: 'salt' },
};

const DYNAMIC_REACTIONS: ReactionDefinition[] = [];

export function registerDynamicReaction(rx: ReactionDefinition): void {
  const existingIdx = DYNAMIC_REACTIONS.findIndex((r) => r.id === rx.id);
  if (existingIdx >= 0) {
    DYNAMIC_REACTIONS[existingIdx] = rx;
  } else {
    DYNAMIC_REACTIONS.push(rx);
  }
}

export function findReagentById(id: string): ChemicalReagent | undefined {
  return getCanonicalRegistry().find((r) => r.id === id) || REAGENTS.find((r) => r.id === id);
}

export function getReagentDisplayInfo(id: string): { name: string; formula: string; type: string } {
  const found = findReagentById(id);
  if (found) return { name: found.name, formula: found.formula, type: found.type };
  if (EXTRA_REAGENT_LABELS[id]) return EXTRA_REAGENT_LABELS[id];
  return { name: id, formula: id, type: 'reagent' };
}

function cleanFormulaState(formula: string): string {
  return formula.replace(/\s*\((aq|s|l|g|sat\.\s*aq)\)/gi, '').trim();
}

/**
 * Scientifically rigorous stoichiometric reaction synthesizer for combinations of canonical
 * or dynamically added chemical reagents that are not in the 52 static presets.
 * Covers:
 *  1. Coordination complexation (Fe³⁺ + SCN⁻, Co²⁺ + SCN⁻, Cu²⁺ + NH₃, Fe³⁺ + phenolate/salicylate/tannate, hexacyanoferrate complexes)
 *  2. Redox electron transfer (I₂ + Ascorbic Acid/Sulfite, KMnO₄ + reducing agents, K₂Cr₂O₇ + reducing agents)
 *  3. Acid + Carbonate / Bicarbonate decarboxylation (→ Salt + H₂O + CO₂↑)
 *  4. Acid + Sulfite / Bisulfite (→ Salt + H₂O + SO₂↑) and Acid + Sulfide (→ Salt + H₂S↑)
 *  5. Acid + Base Brønsted–Lowry neutralization (→ Salt + H₂O + ΔH)
 *  6. Active Metal + Acid single displacement (→ Metal Salt + H₂↑ or NO₂↑ with HNO₃)
 *  7. Active Metal + Less Reactive Metal Salt single displacement (electrochemical series E°)
 *  8. Metal Salt + Hydroxide Base precipitation (or Ammonium Salt + Base → NH₃↑)
 *  9. Double-displacement Salt Metathesis precipitation (governed by K_sp solubility rules)
 */
function synthesizeScientificReaction(
  reagents: ChemicalReagent[],
  amountsMap: Record<string, number>
): ReactionDefinition | null {
  // Filter out pure water and passive indicators when 2+ reactive solutes are present
  const coreReagents =
    reagents.filter((r) => r.id !== 'water' && r.category !== 'indicator').length >= 2
      ? reagents.filter((r) => r.id !== 'water' && r.category !== 'indicator')
      : reagents;

  if (coreReagents.length < 2) return null;

  const r1 = coreReagents[0];
  const r2 = coreReagents[1];
  const pair = [r1, r2];
  const reqAmounts: Record<string, number> = {
    [r1.id]: Math.min(amountsMap[r1.id] || 10, 10),
    [r2.id]: Math.min(amountsMap[r2.id] || 10, 10),
  };

  const f1 = cleanFormulaState(r1.formula);
  const f2 = cleanFormulaState(r2.formula);
  const combinedText = `${r1.id} ${r1.name} ${r1.formula} | ${r2.id} ${r2.name} ${r2.formula}`.toLowerCase();

  // Do not synthesize an ambient aqueous reaction for organic alcohol + carboxylic acid (Fischer Esterification requires conc. H2SO4 + reflux heat)
  const hasAlcohol = pair.some(
    (c) =>
      c.id === 'ethanol' ||
      c.name.toLowerCase().includes('ethanol') ||
      c.name.toLowerCase().includes('methanol') ||
      c.name.toLowerCase().includes('propanol') ||
      c.name.toLowerCase().includes('butanol')
  );
  if (hasAlcohol && pair.some((c) => c.category === 'acid')) {
    return null;
  }

  // Do not synthesize an ambient aqueous reaction for solid-state Thermite (Al + metal oxide)
  if (
    pair.some((c) => c.id === 'al_metal') &&
    pair.some((c) => ['fe2o3', 'fe3o4', 'cr2o3', 'mno2', 'cuo'].includes(c.id))
  ) {
    return null;
  }

  // 1A. Coordination Complex: Iron(III) + Thiocyanate (Blood-Red [Fe(SCN)]²⁺)
  const fe3Reagent = pair.find(
    (c) =>
      c.id === 'fecl3' ||
      c.id.startsWith('fe3_') ||
      /iron\(iii\)|ferric/i.test(c.name)
  );
  const scnReagent = pair.find(
    (c) =>
      c.id.endsWith('_scn') ||
      /thiocyanate|rhodanide|kscn|nh4scn|nascn/i.test(`${c.id} ${c.name} ${c.formula}`)
  );
  if (fe3Reagent && scnReagent && fe3Reagent.id !== scnReagent.id) {
    const feForm = cleanFormulaState(fe3Reagent.formula);
    const scnForm = cleanFormulaState(scnReagent.formula);
    return {
      id: `synth_complex_${fe3Reagent.id}_${scnReagent.id}`,
      name: `${fe3Reagent.name} + ${scnReagent.name} Thiocyanate Complexation`,
      reactants: [fe3Reagent.id, scnReagent.id],
      requiredAmounts: reqAmounts,
      products: ['[Fe(SCN)]²⁺ (aq, blood-red complex)', 'Spectator Ions (aq)'],
      balancedEquation: `${feForm}(aq) + ${scnForm}(aq) ⇌ [Fe(SCN)]²⁺(aq) [blood-red complex] + Spectator Ions`,
      reactionType: 'precipitation',
      observableEffects: {
        colorChangeTo: '#991B1B',
        isFinalSolutionColorless: false,
        initialAppearance: `${fe3Reagent.name} (${fe3Reagent.formula}) + ${scnReagent.name} (${scnReagent.formula})`,
        finalAppearance: 'Intense blood-red homogeneous solution of pentaaqua(thiocyanato-κN)iron(III) complex ([Fe(H₂O)₅(SCN)]²⁺)',
        temperatureDelta: 1.5,
        producesGas: false,
        producesFumesAboveLiquid: false,
        producesPrecipitate: false,
        isViolent: false,
        hazardType: 'none',
        description: `Classic qualitative analytical test for Fe³⁺ and SCN⁻ ions: mixing ${fe3Reagent.name} and ${scnReagent.name} produces an instantaneous deep blood-red solution due to ligand-to-metal charge transfer (LMCT) in the [Fe(SCN)]²⁺ coordination complex.`,
      },
      explanation: `Thiocyanate ions (SCN⁻) displace inner-sphere water ligands on hexaaquairon(III) ([Fe(H₂O)₆]³⁺) to form the blood-red monothiocyanatoiron(III) complex ion ([Fe(H₂O)₅(SCN)]²⁺, Kf ≈ 890). No precipitate or gas is formed.`,
    };
  }

  // 1B. Coordination Complex: Cobalt(II) + Thiocyanate (Deep Blue [Co(SCN)₄]²⁻)
  const co2Reagent = pair.find(
    (c) => c.id.startsWith('co2_') || /cobalt\(ii\)|cobaltous|cocl2|coso4/i.test(`${c.id} ${c.name} ${c.formula}`)
  );
  if (co2Reagent && scnReagent && co2Reagent.id !== scnReagent.id) {
    return {
      id: `synth_complex_${co2Reagent.id}_${scnReagent.id}`,
      name: `${co2Reagent.name} + ${scnReagent.name} Vogel’s Tetrathiocyanatocobaltate(II) Complexation`,
      reactants: [co2Reagent.id, scnReagent.id],
      requiredAmounts: reqAmounts,
      products: ['[Co(SCN)₄]²⁻ (aq, deep cobalt-blue complex)'],
      balancedEquation: `Co²⁺(aq) + 4SCN⁻(aq) ⇌ [Co(SCN)₄]²⁻(aq) [deep cobalt-blue tetrahedral complex]`,
      reactionType: 'precipitation',
      observableEffects: {
        colorChangeTo: '#1D4ED8',
        isFinalSolutionColorless: false,
        initialAppearance: `Rose-pink ${co2Reagent.name} + colourless ${scnReagent.name}`,
        finalAppearance: 'Deep royal cobalt-blue solution of tetrahedral [Co(SCN)₄]²⁻ complex',
        temperatureDelta: 1.2,
        producesGas: false,
        producesFumesAboveLiquid: false,
        producesPrecipitate: false,
        isViolent: false,
        hazardType: 'none',
        description: `Vogel’s reaction: rose-pink octahedral [Co(H₂O)₆]²⁺ coordinates with thiocyanate ions (SCN⁻) to form the intensely colored royal-blue tetrahedral tetrathiocyanatocobaltate(II) complex ([Co(SCN)₄]²⁻).`,
      },
      explanation: `Substitution of six water ligands on octahedral Co²⁺ by four thiocyanate ligands induces a coordination geometry transition from octahedral ([Co(H₂O)₆]²⁺, rose-pink) to tetrahedral ([Co(SCN)₄]²⁻, intense cobalt-blue).`,
    };
  }

  // 1C. Iron(III) + Tannic Acid / Phenol / Salicylate (Violet / Blue-Black Charge-Transfer Complex)
  const phenolicPartner = pair.find((c) =>
    /tannic|tannin|phenol|carbolic|salicyl/i.test(`${c.id} ${c.name}`)
  );
  if (fe3Reagent && phenolicPartner && fe3Reagent.id !== phenolicPartner.id) {
    return {
      id: `synth_phenolate_${fe3Reagent.id}_${phenolicPartner.id}`,
      name: `${fe3Reagent.name} + ${phenolicPartner.name} Iron(III)–Phenolate Complexation`,
      reactants: [fe3Reagent.id, phenolicPartner.id],
      requiredAmounts: reqAmounts,
      products: ['Iron(III)–Phenolate Charge-Transfer Complex (aq)'],
      balancedEquation: `Fe³⁺(aq) + 3ArOH(aq) ⇌ [Fe(OAr)₃](aq) [deep violet / blue-black complex] + 3H⁺(aq)`,
      reactionType: 'precipitation',
      observableEffects: {
        colorChangeTo: '#4C1D95',
        isFinalSolutionColorless: false,
        initialAppearance: `Amber ${fe3Reagent.name} + ${phenolicPartner.name}`,
        finalAppearance: 'Deep violet to blue-black iron(III)–phenolate chelate solution',
        temperatureDelta: 1.0,
        producesGas: false,
        producesFumesAboveLiquid: false,
        producesPrecipitate: false,
        isViolent: false,
        hazardType: 'none',
        description: `Characteristic ferric chloride test for phenols and enols: ${fe3Reagent.name} coordinates with ${phenolicPartner.name} to yield a deep violet/blue-black ligand-to-metal charge-transfer complex.`,
      },
      explanation: `Phenolic hydroxyl groups deprotonate and coordinate to high-spin Fe³⁺ centers, producing a strong ligand-to-metal charge-transfer (LMCT) absorption band in the visible region.`,
    };
  }

  // 1D. Hexacyanoferrate(II/III) (Ferrocyanide / Ferricyanide) + Iron / Copper Salts (Prussian Blue / Turnbull's Blue / Hatchett's Brown)
  const ferroFerricyanide = pair.find((c) =>
    /ferrocyanide|ferricyanide|hexacyanoferrate|fecn6/i.test(`${c.id} ${c.name} ${c.formula}`)
  );
  if (ferroFerricyanide) {
    const metalPartner = pair.find((c) => c.id !== ferroFerricyanide.id)!;
    const mText = `${metalPartner.id} ${metalPartner.name} ${metalPartner.formula}`.toLowerCase();
    if (/fecl|fe_so4|fe2|fe3|iron|ferric|ferrous/i.test(mText)) {
      return {
        id: `synth_prussian_${metalPartner.id}_${ferroFerricyanide.id}`,
        name: `Prussian Blue Synthesis (${metalPartner.name} + ${ferroFerricyanide.name})`,
        reactants: [metalPartner.id, ferroFerricyanide.id],
        requiredAmounts: reqAmounts,
        products: ['Fe₄[Fe(CN)₆]₃ (s)↓ (Prussian Blue)', 'Soluble Potassium Salt (aq)'],
        balancedEquation: `4Fe³⁺(aq) + 3[Fe(CN)₆]⁴⁻(aq) → Fe₄[Fe(CN)₆]₃(s)↓ [deep Prussian blue precipitate]`,
        reactionType: 'precipitation',
        observableEffects: {
          colorChangeTo: '#1E3A8A',
          isFinalSolutionColorless: false,
          initialAppearance: `${metalPartner.name} + ${ferroFerricyanide.name}`,
          finalAppearance: 'Intense dark Prussian-blue suspension and colloidal precipitate of Iron(III) Hexacyanoferrate(II)',
          temperatureDelta: 1.8,
          producesGas: false,
          producesFumesAboveLiquid: false,
          producesPrecipitate: true,
          precipitateColor: '#1E3A8A',
          precipitateName: 'Prussian Blue (Fe₄[Fe(CN)₆]₃)',
          isViolent: false,
          hazardType: 'none',
          description: `Mixed-valence coordination precipitation: iron cations react with hexacyanoferrate ions to precipitate intense dark Prussian blue (Fe₄[Fe(CN)₆]₃(s)↓) driven by intervalence charge transfer between Fe(II) and Fe(III).`,
        },
        explanation: `Cyanide-bridged mixed-valence Fe(II)–CN–Fe(III) lattice forms instantaneously with an intense intervalence charge-transfer (IVCT) absorption band at 680 nm.`,
      };
    }
    if (/cu|copper|cupric/i.test(mText)) {
      return {
        id: `synth_hatchett_${metalPartner.id}_${ferroFerricyanide.id}`,
        name: `Hatchett’s Brown Precipitation (${metalPartner.name} + ${ferroFerricyanide.name})`,
        reactants: [metalPartner.id, ferroFerricyanide.id],
        requiredAmounts: reqAmounts,
        products: ['Cu₂[Fe(CN)₆] (s)↓ (Reddish-Brown)', 'Soluble Salt (aq)'],
        balancedEquation: `2Cu²⁺(aq) + [Fe(CN)₆]⁴⁻(aq) → Cu₂[Fe(CN)₆](s)↓ [chocolate reddish-brown precipitate]`,
        reactionType: 'precipitation',
        observableEffects: {
          colorChangeTo: '#7C2D12',
          isFinalSolutionColorless: false,
          initialAppearance: `Azure-blue ${metalPartner.name} + ${ferroFerricyanide.name}`,
          finalAppearance: 'Gelatinous reddish-brown precipitate of Copper(II) Hexacyanoferrate(II) (Hatchett’s Brown)',
          temperatureDelta: 1.5,
          producesGas: false,
          producesFumesAboveLiquid: false,
          producesPrecipitate: true,
          precipitateColor: '#7C2D12',
          precipitateName: 'Copper(II) Ferrocyanide (Cu₂[Fe(CN)₆])',
          isViolent: false,
          hazardType: 'none',
          description: `Copper(II) ions react with ferrocyanide to form a dense chocolate reddish-brown precipitate of Cu₂[Fe(CN)₆](s)↓ (known as Hatchett’s brown and used historically to form Traube’s semipermeable membranes).`,
        },
        explanation: `Insoluble Prussian-blue analogue network solid precipitates immediately upon mixing aqueous Cu²⁺ and [Fe(CN)₆]⁴⁻ ions.`,
      };
    }
  }

  // 2A. Redox: Iodine Solution + Ascorbic Acid (Vitamin C) / Sulfite / Bisulfite
  const iodineReagent = pair.find(
    (c) => c.id === 'iodine_solution' || /\biodine\b/i.test(c.name)
  );
  const iodineReductant = pair.find(
    (c) =>
      c.id !== iodineReagent?.id &&
      (/ascorbic|vitamin c|sulfite|sulphite|bisulfite|thiosulfate|so3|s2o3|sncl2|stannous/i.test(
        `${c.id} ${c.name} ${c.formula}`
      ))
  );
  if (iodineReagent && iodineReductant) {
    const isAscorbic = /ascorbic|vitamin c/i.test(iodineReductant.name);
    return {
      id: `synth_redox_${iodineReagent.id}_${iodineReductant.id}`,
      name: `Iodometric Redox Titration (${iodineReagent.name} + ${iodineReductant.name})`,
      reactants: [iodineReagent.id, iodineReductant.id],
      requiredAmounts: reqAmounts,
      products: isAscorbic
        ? ['Dehydroascorbic Acid (C₆H₆O₆, aq)', '2HI (aq, colourless)']
        : ['Oxidized Oxyanion (SO₄²⁻ / S₄O₆²⁻, aq)', '2I⁻ (aq, colourless)'],
      balancedEquation: isAscorbic
        ? 'C₆H₈O₆(aq) + I₂(aq) → C₆H₆O₆(aq) + 2HI(aq) [amber → colourless]'
        : `${cleanFormulaState(iodineReductant.formula)}(aq) + I₂(aq) + H₂O(l) → Oxidized Product(aq) + 2I⁻(aq) + 2H⁺(aq)`,
      reactionType: 'redox',
      observableEffects: {
        colorChangeTo: '#F8FAFC',
        isFinalSolutionColorless: true,
        initialAppearance: `Amber-brown ${iodineReagent.name} + colourless ${iodineReductant.name}`,
        finalAppearance: 'Crystal-clear, colourless aqueous solution (complete reduction of I₂ to I⁻)',
        temperatureDelta: 2.8,
        producesGas: false,
        producesFumesAboveLiquid: false,
        producesPrecipitate: false,
        isViolent: false,
        hazardType: 'none',
        description: `Quantitative redox decolorization: ${iodineReductant.name} rapidly donates two electrons to reduce amber-brown molecular iodine (I₂/I₃⁻) into colourless iodide ions (I⁻).`,
      },
      explanation: `${
        isAscorbic
          ? 'Ascorbic acid (Vitamin C, E° ≈ +0.06 V) is oxidized at its enediol group to dehydroascorbic acid while reducing I₂ (E° = +0.54 V) to colourless I⁻.'
          : `${iodineReductant.name} acts as a two-electron reducing agent, quantitatively reducing brown triiodide/iodine (I₂) to colourless hydrated iodide ions (I⁻).`
      }`,
    };
  }

  // 2B. Redox: Permanganate (MnO4⁻) + Reducing Agent (Ascorbic, Citric, Tartaric, Lactic, Formic, Sulfite, Nitrite, Sn²⁺, Fe²⁺)
  const permanganateReagent = pair.find(
    (c) => c.id === 'kmn_o4_reagent' || c.id.endsWith('_mno4') || /permanganate/i.test(c.name)
  );
  const mno4Reductant = pair.find(
    (c) =>
      c.id !== permanganateReagent?.id &&
      (/ascorbic|vitamin c|citric|tartaric|lactic|malic|formic|oxalic|sulfite|sulphite|bisulfite|thiosulfate|nitrite|ferrous|iron\(ii\)|stannous|tin\(ii\)|glucose|sucrose/i.test(
        `${c.id} ${c.name} ${c.formula}`
      ))
  );
  if (permanganateReagent && mno4Reductant) {
    const evolvesCo2 = /ascorbic|citric|tartaric|formic|oxalic|malic/i.test(mno4Reductant.name);
    return {
      id: `synth_redox_${permanganateReagent.id}_${mno4Reductant.id}`,
      name: `Permanganate Redox Reduction (${permanganateReagent.name} + ${mno4Reductant.name})`,
      reactants: [permanganateReagent.id, mno4Reductant.id],
      requiredAmounts: reqAmounts,
      products: evolvesCo2
        ? ['Mn²⁺ (aq, colourless)', 'CO₂ (g)↑', 'H₂O (l)']
        : ['Mn²⁺ (aq, colourless)', 'Oxidized Substrate (aq)', 'H₂O (l)'],
      balancedEquation: evolvesCo2
        ? `2MnO₄⁻(aq) [deep violet] + 5${cleanFormulaState(mno4Reductant.formula)}(aq) + 6H⁺(aq) → 2Mn²⁺(aq) [colourless] + CO₂(g)↑ + H₂O(l)`
        : `2MnO₄⁻(aq) [deep violet] + 5${cleanFormulaState(mno4Reductant.formula)}(aq) + 6H⁺(aq) → 2Mn²⁺(aq) [colourless] + 5Oxidized Product(aq) + 3H₂O(l)`,
      reactionType: 'redox',
      observableEffects: {
        colorChangeTo: '#F8FAFC',
        isFinalSolutionColorless: true,
        initialAppearance: `Intense royal-violet ${permanganateReagent.name} + ${mno4Reductant.name}`,
        finalAppearance: `Clear, colourless Mn²⁺(aq) solution as purple permanganate is completely reduced${
          evolvesCo2 ? ' with gentle CO₂ effervescence' : ''
        }`,
        temperatureDelta: 6.5,
        producesGas: evolvesCo2,
        gasName: evolvesCo2 ? 'Carbon Dioxide (CO₂)' : undefined,
        gasColor: evolvesCo2 ? '#FFFFFF' : undefined,
        gasVigor: evolvesCo2 ? 2 : undefined,
        producesFumesAboveLiquid: false,
        producesPrecipitate: false,
        isViolent: false,
        hazardType: 'none',
        description: `Five-electron redox reduction: intense purple MnO₄⁻ (Mn(VII), E° = +1.51 V) oxidizes ${mno4Reductant.name} and is reduced to nearly colourless d⁵ hexaaquamanganese(II) ([Mn(H₂O)₆]²⁺).`,
      },
      explanation: `Permanganate (MnO₄⁻) is a powerful 5-electron oxidizing agent. Electron transfer from ${mno4Reductant.name} reduces Mn(VII) to high-spin d⁵ Mn²⁺, whose spin-forbidden d–d transitions render the final solution virtually colourless.`,
    };
  }

  // 2C. Redox: Dichromate (Cr2O7²⁻) + Reducing Agent (Sulfite, Ascorbic, Oxalic, Formic, Fe²⁺, Sn²⁺)
  const dichromateReagent = pair.find(
    (c) => c.id === 'k2cr2o7' || c.id.endsWith('_cr2o7') || /dichromate/i.test(c.name)
  );
  const crReductant = pair.find(
    (c) =>
      c.id !== dichromateReagent?.id &&
      (/ascorbic|vitamin c|oxalic|formic|tartaric|citric|sulfite|sulphite|bisulfite|thiosulfate|ferrous|iron\(ii\)|stannous|tin\(ii\)/i.test(
        `${c.id} ${c.name} ${c.formula}`
      ))
  );
  if (dichromateReagent && crReductant) {
    return {
      id: `synth_redox_${dichromateReagent.id}_${crReductant.id}`,
      name: `Dichromate Redox Reduction (${dichromateReagent.name} + ${crReductant.name})`,
      reactants: [dichromateReagent.id, crReductant.id],
      requiredAmounts: reqAmounts,
      products: ['2Cr³⁺ (aq, emerald-green)', 'Oxidized Product (aq)', '7H₂O (l)'],
      balancedEquation: `Cr₂O₇²⁻(aq) [orange] + 3${cleanFormulaState(crReductant.formula)}(aq) + 14H⁺(aq) → 2Cr³⁺(aq) [emerald-green] + 3Oxidized Product + 7H₂O(l)`,
      reactionType: 'redox',
      observableEffects: {
        colorChangeTo: '#059669',
        isFinalSolutionColorless: false,
        initialAppearance: `Vivid orange ${dichromateReagent.name} + ${crReductant.name}`,
        finalAppearance: 'Deep emerald-green hexaaquachromium(III) ([Cr(H₂O)₆]³⁺) solution',
        temperatureDelta: 8.0,
        producesGas: false,
        producesFumesAboveLiquid: false,
        producesPrecipitate: false,
        isViolent: false,
        hazardType: 'none',
        description: `Six-electron redox transition: bright orange hexavalent dichromate (Cr₂O₇²⁻, Cr(VI), E° = +1.33 V) oxidizes ${crReductant.name} and transitions sharply to emerald-green trivalent chromium(III) ([Cr(H₂O)₆]³⁺).`,
      },
      explanation: `Each dichromate ion accepts 6 electrons from ${crReductant.name}, cleaving Cr–O bonds to form octahedral d³ [Cr(H₂O)₆]³⁺ complexes with characteristic green d–d absorption bands.`,
    };
  }

  // 3. Acid + Carbonate / Bicarbonate Decarboxylation (→ Salt + H₂O + CO₂↑)
  const acidReagent = pair.find(
    (c) => c.category === 'acid' || c.type === 'acid' || c.secondaryCategories?.includes('acid')
  );
  const carbonateReagent = pair.find(
    (c) =>
      c.id !== acidReagent?.id &&
      (c.type === 'carbonate' ||
        /carbonate|bicarbonate|hydrogencarbonate|co3|hco3/i.test(`${c.id} ${c.name} ${c.formula}`))
  );
  if (acidReagent && carbonateReagent) {
    const isBicarb = /bicarbonate|hydrogencarbonate|hco3/i.test(
      `${carbonateReagent.id} ${carbonateReagent.name} ${carbonateReagent.formula}`
    );
    const acidF = cleanFormulaState(acidReagent.formula);
    const carbF = cleanFormulaState(carbonateReagent.formula);
    return {
      id: `synth_carb_${acidReagent.id}_${carbonateReagent.id}`,
      name: `${acidReagent.name} + ${carbonateReagent.name} Effervescent Decarboxylation`,
      reactants: [acidReagent.id, carbonateReagent.id],
      requiredAmounts: reqAmounts,
      products: ['Aqueous Salt (aq)', 'H₂O (l)', 'CO₂ (g)↑'],
      balancedEquation: isBicarb
        ? `${acidF}(aq) + ${carbF}(s/aq) → Salt(aq) + H₂O(l) + CO₂(g)↑`
        : `2${acidF}(aq) + ${carbF}(s/aq) → Salt(aq) + H₂O(l) + CO₂(g)↑`,
      reactionType: 'gas_evolution',
      observableEffects: {
        colorChangeTo: '#F8FAFC',
        isFinalSolutionColorless: true,
        initialAppearance: `${acidReagent.name} (${acidReagent.formula}) + ${carbonateReagent.name} (${carbonateReagent.formula})`,
        finalAppearance: 'Clear aqueous salt solution with brisk streams of colourless CO₂(g) bubbles rising to the surface',
        temperatureDelta: isBicarb ? -3.5 : 4.5,
        producesGas: true,
        gasName: 'Carbon Dioxide (CO₂)',
        gasColor: '#FFFFFF',
        gasVigor: 4,
        producesFumesAboveLiquid: false,
        producesPrecipitate: false,
        isViolent: false,
        hazardType: 'none',
        description: `Acid–carbonate proton transfer and decarboxylation: ${acidReagent.name} protonates ${carbonateReagent.name} to form transient carbonic acid (H₂CO₃), which immediately decomposes into liquid water and briskly effervescing carbon dioxide gas (CO₂↑).`,
      },
      explanation: `Net ionic equation: ${
        isBicarb ? 'H⁺(aq) + HCO₃⁻(aq) → H₂O(l) + CO₂(g)↑' : '2H⁺(aq) + CO₃²⁻(aq/s) → H₂O(l) + CO₂(g)↑'
      }. Rapid nucleation and escape of CO₂ gas drives the equilibrium irreversibly to completion.`,
    };
  }

  // 4. Acid + Sulfite / Bisulfite (→ SO2↑) or Acid + Sulfide (→ H2S↑)
  const sulfiteOrSulfide = pair.find(
    (c) =>
      c.id !== acidReagent?.id &&
      (/\bsulfite\b|\bsulphite\b|\bbisulfite\b|\bmetabisulfite\b|\bsulfide\b|\bsulphide\b|_so3|_hso3|_s\b/i.test(
        `${c.id} ${c.name}`
      ))
  );
  if (acidReagent && sulfiteOrSulfide) {
    const isSulfite = /sulfite|sulphite|so3/i.test(`${sulfiteOrSulfide.id} ${sulfiteOrSulfide.name}`);
    const acidF = cleanFormulaState(acidReagent.formula);
    const partnerF = cleanFormulaState(sulfiteOrSulfide.formula);
    return {
      id: `synth_gas_${acidReagent.id}_${sulfiteOrSulfide.id}`,
      name: `${acidReagent.name} + ${sulfiteOrSulfide.name} Gas Evolution`,
      reactants: [acidReagent.id, sulfiteOrSulfide.id],
      requiredAmounts: reqAmounts,
      products: isSulfite
        ? ['Aqueous Salt (aq)', 'H₂O (l)', 'SO₂ (g)↑']
        : ['Aqueous Salt (aq)', 'H₂S (g)↑'],
      balancedEquation: isSulfite
        ? `2${acidF}(aq) + ${partnerF}(aq) → Salt(aq) + H₂O(l) + SO₂(g)↑`
        : `2${acidF}(aq) + ${partnerF}(s/aq) → Salt(aq) + H₂S(g)↑`,
      reactionType: 'gas_evolution',
      observableEffects: {
        colorChangeTo: '#F8FAFC',
        isFinalSolutionColorless: true,
        initialAppearance: `${acidReagent.name} + ${sulfiteOrSulfide.name}`,
        finalAppearance: `Clear aqueous salt solution with evolution of ${isSulfite ? 'SO₂(g)' : 'H₂S(g)'} gas bubbles`,
        temperatureDelta: 5.0,
        producesGas: true,
        gasName: isSulfite ? 'Sulfur Dioxide (SO₂)' : 'Hydrogen Sulfide (H₂S)',
        gasColor: '#F8FAFC',
        gasVigor: 3,
        producesFumesAboveLiquid: true,
        fumeColor: '#E2E8F0',
        producesPrecipitate: false,
        isViolent: false,
        hazardType: 'gas_eruption',
        description: `Protonation of ${sulfiteOrSulfide.name} by ${acidReagent.name} liberates ${
          isSulfite
            ? 'sulfur dioxide gas (SO₂↑) via decomposition of unstable sulfurous acid (H₂SO₃)'
            : 'hydrogen sulfide gas (H₂S↑) via double-displacement proton transfer'
        }.`,
      },
      explanation: `Net ionic equation: ${
        isSulfite ? 'SO₃²⁻(aq) + 2H⁺(aq) → H₂O(l) + SO₂(g)↑' : 'S²⁻(aq/s) + 2H⁺(aq) → H₂S(g)↑'
      }.`,
    };
  }

  // 5. Acid + Base Neutralization (→ Salt + H2O + Exothermic Heat)
  const baseReagent = pair.find(
    (c) =>
      c.id !== acidReagent?.id &&
      (c.category === 'base' || c.type === 'base' || c.secondaryCategories?.includes('base'))
  );
  if (acidReagent && baseReagent) {
    const acidF = cleanFormulaState(acidReagent.formula);
    const baseF = cleanFormulaState(baseReagent.formula);
    const isBariumSulfatePpt =
      /h2so4|sulfuric|sulphuric/i.test(`${acidReagent.id} ${acidReagent.name}`) &&
      /ba_oh2|barium/i.test(`${baseReagent.id} ${baseReagent.name}`);

    return {
      id: `synth_neut_${acidReagent.id}_${baseReagent.id}`,
      name: `${acidReagent.name} + ${baseReagent.name} Neutralization`,
      reactants: [acidReagent.id, baseReagent.id],
      requiredAmounts: reqAmounts,
      products: isBariumSulfatePpt
        ? ['BaSO₄ (s)↓', '2H₂O (l)']
        : [`Aqueous Salt (${baseF.replace(/\(OH\)₂|OH/g, '')} Salt, aq)`, 'H₂O (l)'],
      balancedEquation: isBariumSulfatePpt
        ? 'H₂SO₄(aq) + Ba(OH)₂(aq) → BaSO₄(s)↓ + 2H₂O(l) + ΔH'
        : `${acidF}(aq) + ${baseF}(aq) → Salt(aq) + H₂O(l) + ΔH (-57.3 kJ/mol)`,
      reactionType: 'neutralization',
      observableEffects: {
        colorChangeTo: '#F8FAFC',
        isFinalSolutionColorless: !isBariumSulfatePpt,
        initialAppearance: `${acidReagent.name} (${acidReagent.formula}) + ${baseReagent.name} (${baseReagent.formula})`,
        finalAppearance: isBariumSulfatePpt
          ? 'Dense white BaSO₄(s) precipitate in neutral water'
          : 'Clear, colourless neutral aqueous salt solution with exothermic warming',
        temperatureDelta: 11.5,
        producesGas: false,
        producesFumesAboveLiquid: false,
        producesPrecipitate: isBariumSulfatePpt,
        precipitateColor: isBariumSulfatePpt ? '#FFFFFF' : undefined,
        precipitateName: isBariumSulfatePpt ? 'Barium Sulfate (BaSO₄)' : undefined,
        isViolent: false,
        hazardType: 'none',
        description: `Brønsted–Lowry acid–base neutralization: hydronium ions (H⁺) from ${acidReagent.name} combine with hydroxide/basic sites from ${baseReagent.name} to form water (H⁺(aq) + OH⁻(aq) → H₂O(l)), releasing exothermic enthalpy of neutralization.`,
      },
      explanation: `Proton transfer from ${acidReagent.name} (${acidF}) to ${baseReagent.name} (${baseF}) yields water and the corresponding conjugate salt in solution, raising the beaker temperature.`,
    };
  }

  // 6. Active Metal + Acid Single Displacement
  const metalReagent = pair.find((c) => c.category === 'metal' || c.type === 'metal' || c.type === 'alkali_metal');
  if (metalReagent && acidReagent) {
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
    const isOxidizingAcid = acidReagent.id === 'hno3' || /nitric/i.test(acidReagent.name);
    if (!nobleMetals.has(metalReagent.id) || (isOxidizingAcid && ['cu', 'ag_metal'].includes(metalReagent.id))) {
      const mSym = cleanFormulaState(metalReagent.formula);
      const aSym = cleanFormulaState(acidReagent.formula);
      return {
        id: `synth_metal_acid_${metalReagent.id}_${acidReagent.id}`,
        name: `${metalReagent.name} + ${acidReagent.name} Single-Displacement Reaction`,
        reactants: [metalReagent.id, acidReagent.id],
        requiredAmounts: reqAmounts,
        products: isOxidizingAcid
          ? [`${mSym}(NO₃)₂ (aq)`, 'NO₂ (g)↑', 'H₂O (l)']
          : [`Aqueous ${metalReagent.name} Salt (aq)`, 'H₂ (g)↑'],
        balancedEquation: isOxidizingAcid
          ? `${mSym}(s) + 4HNO₃(aq) → ${mSym}(NO₃)₂(aq) + 2NO₂(g)↑ + 2H₂O(l)`
          : `${mSym}(s) + 2${aSym}(aq) → ${mSym}²⁺(aq) + 2Anion⁻(aq) + H₂(g)↑`,
        reactionType: 'single_displacement',
        observableEffects: {
          colorChangeTo: mSym === 'Cu' ? '#0284C7' : mSym === 'Fe' ? '#86EFAC' : '#F8FAFC',
          isFinalSolutionColorless: !['Cu', 'Fe', 'Co', 'Ni', 'Cr'].includes(mSym),
          initialAppearance: `Metallic ${metalReagent.name} (${mSym}(s)) + ${acidReagent.name} (${acidReagent.formula})`,
          finalAppearance: isOxidizingAcid
            ? `Dissolution of ${metalReagent.name} with evolution of reddish-brown NO₂(g) fumes`
            : `Dissolution of ${metalReagent.name} with brisk streams of colourless H₂(g) bubbles`,
          temperatureDelta: 18.0,
          producesGas: true,
          gasName: isOxidizingAcid ? 'Nitrogen Dioxide (NO₂) — Toxic' : 'Hydrogen Gas (H₂)',
          gasColor: isOxidizingAcid ? '#B45309' : '#FFFFFF',
          gasVigor: 4,
          producesFumesAboveLiquid: isOxidizingAcid,
          fumeColor: isOxidizingAcid ? '#B45309' : undefined,
          producesPrecipitate: false,
          isViolent: false,
          hazardType: 'gas_eruption',
          description: `Electrochemical single displacement: ${metalReagent.name} (${mSym}) has a negative standard reduction potential (E° < 0.00 V) and reduces protons from ${acidReagent.name} to evolve hydrogen gas (H₂↑) while dissolving into hydrated metal cations.`,
        },
        explanation: `Because ${metalReagent.name} lies above hydrogen in the electrochemical reactivity series, electron transfer from ${mSym}(s) to H⁺(aq) is thermodynamically spontaneous (ΔG° < 0).`,
      };
    }
  }

  // 7. Ammonium Salt + Strong Base → Ammonia Gas Evolution (NH3↑)
  const nh4Salt = pair.find(
    (c) => c.id.startsWith('nh4') || /ammonium|\(nh₄\)|nh₄/i.test(`${c.id} ${c.name} ${c.formula}`)
  );
  const hydroxideBase = pair.find(
    (c) =>
      c.id !== nh4Salt?.id &&
      (c.category === 'base' || /hydroxide|naoh|koh|ba_oh2|ca_oh2|lioh/i.test(`${c.id} ${c.name} ${c.formula}`))
  );
  if (nh4Salt && hydroxideBase) {
    return {
      id: `synth_nh3_${nh4Salt.id}_${hydroxideBase.id}`,
      name: `${nh4Salt.name} + ${hydroxideBase.name} Ammonia Evolution`,
      reactants: [nh4Salt.id, hydroxideBase.id],
      requiredAmounts: reqAmounts,
      products: ['NH₃ (g)↑', 'H₂O (l)', 'Aqueous Alkali Salt (aq)'],
      balancedEquation: `${cleanFormulaState(nh4Salt.formula)}(aq) + ${cleanFormulaState(hydroxideBase.formula)}(aq) → NH₃(g)↑ + H₂O(l) + Salt(aq)`,
      reactionType: 'gas_evolution',
      observableEffects: {
        colorChangeTo: '#F8FAFC',
        isFinalSolutionColorless: true,
        initialAppearance: `${nh4Salt.name} + ${hydroxideBase.name}`,
        finalAppearance: 'Clear colourless solution evolving pungent alkaline ammonia gas (NH₃↑)',
        temperatureDelta: 2.5,
        producesGas: true,
        gasName: 'Ammonia Gas (NH₃)',
        gasColor: '#F8FAFC',
        gasVigor: 3,
        producesFumesAboveLiquid: true,
        fumeColor: '#E2E8F0',
        producesPrecipitate: false,
        isViolent: false,
        hazardType: 'gas_eruption',
        description: `Brønsted–Lowry deprotonation of ammonium ions: hydroxide ions (OH⁻) from ${hydroxideBase.name} abstract a proton from NH₄⁺ in ${nh4Salt.name} to generate volatile ammonia gas (NH₃↑) and water.`,
      },
      explanation: `Net ionic equation: NH₄⁺(aq) + OH⁻(aq) ⇌ NH₃(g)↑ + H₂O(l). Because OH⁻ is a much stronger base than NH₃ (pKb = 4.75), equilibrium lies strongly to the right.`,
    };
  }

  // 8. Metal Salt + Hydroxide Base → Metal Hydroxide Precipitation M(OH)n(s)↓
  const anyBase = pair.find((c) => c.category === 'base' || c.type === 'base');
  const saltPartnerForBase = pair.find(
    (c) =>
      c.id !== anyBase?.id &&
      (c.category === 'salt' || c.type === 'salt' || c.type === 'reagent') &&
      !/^(na|k_|k\b|li|rb|cs|nh4|water)/i.test(c.id) &&
      !/^(sodium|potassium|lithium|rubidium|cesium|caesium|ammonium)\s/i.test(c.name)
  );
  if (anyBase && saltPartnerForBase) {
    const sText = `${saltPartnerForBase.id} ${saltPartnerForBase.name} ${saltPartnerForBase.formula}`.toLowerCase();
    let pptFormula = 'M(OH)₂(s)↓';
    let pptName = 'Metal Hydroxide Precipitate';
    let pptColor = '#FFFFFF';
    let finalSolColor = '#F8FAFC';
    let isColorlessFinal = true;

    if (/cu|copper|cupric/.test(sText)) {
      if (anyBase.id === 'nh3' || /ammonia/i.test(anyBase.name)) {
        return {
          id: `synth_cu_nh3_${saltPartnerForBase.id}`,
          name: `${saltPartnerForBase.name} + ${anyBase.name} Tetraamminecopper(II) Complexation`,
          reactants: [saltPartnerForBase.id, anyBase.id],
          requiredAmounts: reqAmounts,
          products: ['[Cu(NH₃)₄]²⁺ (aq, deep royal-blue)', 'Cu(OH)₂ (s)↓ (transient)'],
          balancedEquation: `Cu²⁺(aq) + 4NH₃(aq) ⇌ [Cu(NH₃)₄]²⁺(aq) [intense royal-blue complex]`,
          reactionType: 'precipitation',
          observableEffects: {
            colorChangeTo: '#1E40AF',
            isFinalSolutionColorless: false,
            initialAppearance: `Azure-blue ${saltPartnerForBase.name} + ${anyBase.name}`,
            finalAppearance: 'Intense deep royal-blue solution of tetraamminecopper(II) complex ([Cu(NH₃)₄]²⁺)',
            temperatureDelta: 3.5,
            producesGas: false,
            producesFumesAboveLiquid: false,
            producesPrecipitate: false,
            isViolent: false,
            hazardType: 'none',
            description: `Ligand exchange reaction: aqueous ammonia first forms a pale blue Cu(OH)₂ precipitate that dissolves in excess NH₃ to produce the deep royal-blue square-planar [Cu(NH₃)₄(H₂O)₂]²⁺ coordination complex.`,
          },
          explanation: `Ammonia ligands replace four equatorial water ligands on Cu²⁺ (Kf = 1.1 × 10¹³), shifting the d–d absorption band and intensifying the royal-blue color.`,
        };
      }
      pptFormula = 'Cu(OH)₂(s)↓';
      pptName = 'Copper(II) Hydroxide (Cu(OH)₂)';
      pptColor = '#38BDF8';
      finalSolColor = '#E0F2FE';
      isColorlessFinal = false;
    } else if (/fe3|fecl3|iron\(iii\)|ferric/.test(sText)) {
      pptFormula = 'Fe(OH)₃(s)↓';
      pptName = 'Iron(III) Hydroxide (Fe(OH)₃)';
      pptColor = '#B45309';
      finalSolColor = '#FEF3C7';
      isColorlessFinal = false;
    } else if (/fe2|fe_so4|fecl2|iron\(ii\)|ferrous/.test(sText)) {
      pptFormula = 'Fe(OH)₂(s)↓';
      pptName = 'Iron(II) Hydroxide (Fe(OH)₂)';
      pptColor = '#15803D';
      finalSolColor = '#DCFCE7';
      isColorlessFinal = false;
    } else if (/co2|cocl2|coso4|cobalt/.test(sText)) {
      pptFormula = 'Co(OH)₂(s)↓';
      pptName = 'Cobalt(II) Hydroxide (Co(OH)₂)';
      pptColor = '#EC4899';
      finalSolColor = '#FCE7F3';
      isColorlessFinal = false;
    } else if (/ni2|niso4|nicl2|nickel/.test(sText)) {
      pptFormula = 'Ni(OH)₂(s)↓';
      pptName = 'Nickel(II) Hydroxide (Ni(OH)₂)';
      pptColor = '#22C55E';
      finalSolColor = '#DCFCE7';
      isColorlessFinal = false;
    } else if (/mn2|mnso4|mncl2|manganese\(ii\)|manganous/.test(sText)) {
      pptFormula = 'Mn(OH)₂(s)↓';
      pptName = 'Manganese(II) Hydroxide (Mn(OH)₂)';
      pptColor = '#FBCFE8';
    } else if (/cr3|crcl3|chromium\(iii\)|chromic/.test(sText)) {
      pptFormula = 'Cr(OH)₃(s)↓';
      pptName = 'Chromium(III) Hydroxide (Cr(OH)₃)';
      pptColor = '#4D7C0F';
      finalSolColor = '#ECFCCB';
      isColorlessFinal = false;
    } else if (/ag|silver/.test(sText)) {
      pptFormula = 'Ag₂O(s)↓';
      pptName = 'Silver(I) Oxide (Ag₂O)';
      pptColor = '#78350F';
    } else if (/zn|zinc/.test(sText)) {
      pptFormula = 'Zn(OH)₂(s)↓';
      pptName = 'Zinc Hydroxide (Zn(OH)₂)';
      pptColor = '#FFFFFF';
    } else if (/al|aluminium|aluminum/.test(sText)) {
      pptFormula = 'Al(OH)₃(s)↓';
      pptName = 'Aluminium Hydroxide (Al(OH)₃)';
      pptColor = '#FFFFFF';
    } else if (/mg|magnesium/.test(sText)) {
      pptFormula = 'Mg(OH)₂(s)↓';
      pptName = 'Magnesium Hydroxide (Mg(OH)₂)';
      pptColor = '#FFFFFF';
    } else if (/pb|lead/.test(sText)) {
      pptFormula = 'Pb(OH)₂(s)↓';
      pptName = 'Lead(II) Hydroxide (Pb(OH)₂)';
      pptColor = '#FFFFFF';
    } else if (/sn|tin|stannous/.test(sText)) {
      pptFormula = 'Sn(OH)₂(s)↓';
      pptName = 'Tin(II) Hydroxide (Sn(OH)₂)';
      pptColor = '#FFFFFF';
    } else if (/ca|calcium/.test(sText)) {
      pptFormula = 'Ca(OH)₂(s)↓';
      pptName = 'Calcium Hydroxide (Ca(OH)₂)';
      pptColor = '#FFFFFF';
    } else {
      pptFormula = null as unknown as string;
    }

    if (pptFormula) {
      return {
        id: `synth_oh_ppt_${saltPartnerForBase.id}_${anyBase.id}`,
        name: `${saltPartnerForBase.name} + ${anyBase.name} Hydroxide Precipitation`,
        reactants: [saltPartnerForBase.id, anyBase.id],
        requiredAmounts: reqAmounts,
        products: [pptFormula, 'Aqueous Spectator Salt (aq)'],
        balancedEquation: `${cleanFormulaState(saltPartnerForBase.formula)}(aq) + 2${cleanFormulaState(anyBase.formula)}(aq) → ${pptFormula} + Soluble Salt(aq)`,
        reactionType: 'precipitation',
        observableEffects: {
          colorChangeTo: finalSolColor,
          isFinalSolutionColorless: isColorlessFinal,
          initialAppearance: `${saltPartnerForBase.name} (${saltPartnerForBase.formula}) + ${anyBase.name} (${anyBase.formula})`,
          finalAppearance: `Insoluble ${pptName} (${pptFormula}) precipitate settling in aqueous solution`,
          temperatureDelta: 2.5,
          producesGas: false,
          producesFumesAboveLiquid: false,
          producesPrecipitate: true,
          precipitateColor: pptColor,
          precipitateName: pptName,
          isViolent: false,
          hazardType: 'none',
          description: `Double-displacement hydroxide precipitation: mixing ${saltPartnerForBase.name} with alkaline ${anyBase.name} causes the ion product to exceed K_sp, immediately nucleating an insoluble ${pptName} (${pptFormula}) precipitate.`,
        },
        explanation: `Hydrated metal cations react with hydroxide ions (Mⁿ⁺(aq) + nOH⁻(aq) → M(OH)ₙ(s)↓) to form an insoluble metal hydroxide lattice.`,
      };
    }
  }

  // 9. Salt + Salt (or Acid + Salt) Double-Displacement Metathesis Precipitation (Q_sp > K_sp)
  // Extract cations and anions from the two reagents
  const detectCation = (r: ChemicalReagent): string | null => {
    const t = `${r.id} ${r.name} ${r.formula}`.toLowerCase();
    if (/\bag|silver/.test(t)) return 'Ag';
    if (/\bpb|lead|plumbous/.test(t)) return 'Pb';
    if (/\bba|barium/.test(t)) return 'Ba';
    if (/\bsr|strontium/.test(t)) return 'Sr';
    if (/\bca|calcium/.test(t)) return 'Ca';
    if (/\bcu|copper|cupric/.test(t)) return 'Cu';
    if (/fe3|fecl3|iron\(iii\)|ferric/.test(t)) return 'Fe3';
    if (/fe2|fe_so4|fecl2|iron\(ii\)|ferrous/.test(t)) return 'Fe2';
    if (/\bco2|cocl2|coso4|cobalt/.test(t)) return 'Co';
    if (/\bni2|niso4|nicl2|nickel/.test(t)) return 'Ni';
    if (/\bmn2|mnso4|mncl2|manganese\(ii\)/.test(t)) return 'Mn';
    if (/\bzn|zinc/.test(t)) return 'Zn';
    if (/\bmg|magnesium/.test(t)) return 'Mg';
    if (/\bal|aluminium|aluminum/.test(t)) return 'Al';
    if (/\bsn|tin|stannous/.test(t)) return 'Sn';
    return null;
  };

  const detectAnions = (r: ChemicalReagent): string[] => {
    const t = `${r.id} ${r.name} ${r.formula}`.toLowerCase();
    const out: string[] = [];
    if (/chromate|cro4|cro₄/.test(t) && !/dichromate/.test(t)) out.push('CrO4');
    if (/carbonate|co3|co₃/.test(t) && !/bicarbonate|hco3|hco₃/.test(t)) out.push('CO3');
    if (/phosphate|po4|po₄/.test(t)) out.push('PO4');
    if (/oxalate|c2o4|c₂o₄/.test(t)) out.push('C2O4');
    if (/sulfide|sulphide|_s\b|\bs²⁻/.test(t) && !/sulfate|sulfite|thiosulfate/.test(t)) out.push('S');
    if (/sulfate|sulphate|so4|so₄|h2so4/.test(t) && !/thiosulfate|bisulfate/.test(t)) out.push('SO4');
    if (/sulfite|sulphite|so3|so₃/.test(t)) out.push('SO3');
    if (/iodide|\bi\b|_i\b|ki\b|nai\b|hi\b/.test(t)) out.push('I');
    if (/bromide|br\b|_br\b|nabr|kbr|hbr/.test(t)) out.push('Br');
    if (/chloride|cl\b|cl₂|cl₃|_cl\b|nacl|kcl|hcl|bacl2|cacl2|fecl/.test(t) && !/hypochlorite|chlorate|perchlorate/.test(t)) out.push('Cl');
    if (/thiocyanate|scn/.test(t)) out.push('SCN');
    return out;
  };

  const cat1 = detectCation(r1);
  const cat2 = detectCation(r2);
  const anions1 = detectAnions(r1);
  const anions2 = detectAnions(r2);

  interface PptMatch {
    formula: string;
    name: string;
    colorHex: string;
    colorDesc: string;
    kspNote: string;
  }

  const checkInsolublePair = (cat: string | null, an: string): PptMatch | null => {
    if (!cat) return null;
    if (cat === 'Ag') {
      if (an === 'Cl') return { formula: 'AgCl(s)↓', name: 'Silver Chloride (AgCl)', colorHex: '#FFFFFF', colorDesc: 'curdy white', kspNote: 'K_sp = 1.8 × 10⁻¹⁰' };
      if (an === 'Br') return { formula: 'AgBr(s)↓', name: 'Silver Bromide (AgBr)', colorHex: '#FEF08A', colorDesc: 'pale cream-yellow', kspNote: 'K_sp = 5.4 × 10⁻¹³' };
      if (an === 'I') return { formula: 'AgI(s)↓', name: 'Silver Iodide (AgI)', colorHex: '#FACC15', colorDesc: 'bright canary-yellow', kspNote: 'K_sp = 8.5 × 10⁻¹⁷' };
      if (an === 'CrO4') return { formula: 'Ag₂CrO₄(s)↓', name: 'Silver Chromate (Ag₂CrO₄)', colorHex: '#B91C1C', colorDesc: 'brick-red', kspNote: 'K_sp = 1.1 × 10⁻¹²' };
      if (an === 'PO4') return { formula: 'Ag₃PO₄(s)↓', name: 'Silver Phosphate (Ag₃PO₄)', colorHex: '#EAB308', colorDesc: 'bright yellow', kspNote: 'K_sp = 8.9 × 10⁻¹⁷' };
      if (an === 'CO3') return { formula: 'Ag₂CO₃(s)↓', name: 'Silver Carbonate (Ag₂CO₃)', colorHex: '#FEF08A', colorDesc: 'pale yellow', kspNote: 'K_sp = 8.5 × 10⁻¹²' };
      if (an === 'S') return { formula: 'Ag₂S(s)↓', name: 'Silver Sulfide (Ag₂S)', colorHex: '#1E293B', colorDesc: 'jet-black', kspNote: 'K_sp = 6.0 × 10⁻⁵¹' };
      if (an === 'SCN') return { formula: 'AgSCN(s)↓', name: 'Silver Thiocyanate (AgSCN)', colorHex: '#FFFFFF', colorDesc: 'curdy white', kspNote: 'K_sp = 1.0 × 10⁻¹²' };
      if (an === 'C2O4') return { formula: 'Ag₂C₂O₄(s)↓', name: 'Silver Oxalate (Ag₂C₂O₄)', colorHex: '#FFFFFF', colorDesc: 'white', kspNote: 'K_sp = 5.4 × 10⁻¹²' };
    }
    if (cat === 'Pb') {
      if (an === 'I') return { formula: 'PbI₂(s)↓', name: 'Lead(II) Iodide (PbI₂)', colorHex: '#FACC15', colorDesc: 'glittering golden-yellow', kspNote: 'K_sp = 9.8 × 10⁻⁹' };
      if (an === 'CrO4') return { formula: 'PbCrO₄(s)↓', name: 'Lead(II) Chromate (PbCrO₄)', colorHex: '#EAB308', colorDesc: 'vivid chrome-yellow', kspNote: 'K_sp = 2.8 × 10⁻¹³' };
      if (an === 'SO4') return { formula: 'PbSO₄(s)↓', name: 'Lead(II) Sulfate (PbSO₄)', colorHex: '#FFFFFF', colorDesc: 'dense white', kspNote: 'K_sp = 2.5 × 10⁻⁸' };
      if (an === 'Cl') return { formula: 'PbCl₂(s)↓', name: 'Lead(II) Chloride (PbCl₂)', colorHex: '#FFFFFF', colorDesc: 'white crystalline', kspNote: 'K_sp = 1.7 × 10⁻⁵' };
      if (an === 'Br') return { formula: 'PbBr₂(s)↓', name: 'Lead(II) Bromide (PbBr₂)', colorHex: '#FFFFFF', colorDesc: 'white crystalline', kspNote: 'K_sp = 6.6 × 10⁻⁶' };
      if (an === 'CO3') return { formula: 'PbCO₃(s)↓', name: 'Lead(II) Carbonate (PbCO₃)', colorHex: '#FFFFFF', colorDesc: 'chalky white', kspNote: 'K_sp = 7.4 × 10⁻¹⁴' };
      if (an === 'S') return { formula: 'PbS(s)↓', name: 'Lead(II) Sulfide (PbS)', colorHex: '#1E293B', colorDesc: 'galena black', kspNote: 'K_sp = 3.0 × 10⁻²⁸' };
      if (an === 'PO4') return { formula: 'Pb₃(PO₄)₂(s)↓', name: 'Lead(II) Phosphate (Pb₃(PO₄)₂)', colorHex: '#FFFFFF', colorDesc: 'white', kspNote: 'K_sp = 8.0 × 10⁻⁴³' };
      if (an === 'C2O4') return { formula: 'PbC₂O₄(s)↓', name: 'Lead(II) Oxalate (PbC₂O₄)', colorHex: '#FFFFFF', colorDesc: 'white', kspNote: 'K_sp = 8.5 × 10⁻¹⁰' };
    }
    if (cat === 'Ba' || cat === 'Sr' || cat === 'Ca') {
      const cName = cat === 'Ba' ? 'Barium' : cat === 'Sr' ? 'Strontium' : 'Calcium';
      if (an === 'SO4') return { formula: `${cat}SO₄(s)↓`, name: `${cName} Sulfate (${cat}SO₄)`, colorHex: '#FFFFFF', colorDesc: 'heavy crystalline white', kspNote: 'insoluble alkaline-earth sulfate' };
      if (an === 'CO3') return { formula: `${cat}CO₃(s)↓`, name: `${cName} Carbonate (${cat}CO₃)`, colorHex: '#FFFFFF', colorDesc: 'chalky white', kspNote: 'insoluble alkaline-earth carbonate' };
      if (an === 'C2O4') return { formula: `${cat}C₂O₄(s)↓`, name: `${cName} Oxalate (${cat}C₂O₄)`, colorHex: '#FFFFFF', colorDesc: 'fine white', kspNote: 'insoluble oxalate' };
      if (an === 'PO4') return { formula: `${cat}₃(PO₄)₂(s)↓`, name: `${cName} Phosphate (${cat}₃(PO₄)₂)`, colorHex: '#FFFFFF', colorDesc: 'flocculant white', kspNote: 'insoluble phosphate' };
      if (an === 'SO3') return { formula: `${cat}SO₃(s)↓`, name: `${cName} Sulfite (${cat}SO₃)`, colorHex: '#FFFFFF', colorDesc: 'white', kspNote: 'soluble in dilute acid' };
      if (an === 'CrO4' && (cat === 'Ba' || cat === 'Sr')) {
        return { formula: `${cat}CrO₄(s)↓`, name: `${cName} Chromate (${cat}CrO₄)`, colorHex: '#FEF08A', colorDesc: 'lemon-yellow', kspNote: 'K_sp = 1.2 × 10⁻¹⁰' };
      }
    }
    if (['Cu', 'Fe2', 'Fe3', 'Co', 'Ni', 'Mn', 'Zn', 'Mg', 'Sn'].includes(cat)) {
      const sym = cat.replace(/[23]/, '');
      if (an === 'CO3') {
        const col = cat === 'Cu' ? '#10B981' : cat === 'Co' ? '#EC4899' : cat === 'Ni' ? '#4ADE80' : '#FFFFFF';
        const desc = cat === 'Cu' ? 'malachite blue-green' : cat === 'Co' ? 'rose-violet' : cat === 'Ni' ? 'apple-green' : 'white/buff';
        return { formula: `${sym}CO₃(s)↓`, name: `${sym} Carbonate (${sym}CO₃)`, colorHex: col, colorDesc: desc, kspNote: 'insoluble transition-metal carbonate' };
      }
      if (an === 'S') {
        const col = cat === 'Zn' ? '#FFFFFF' : cat === 'Mn' ? '#FDA4AF' : '#1E293B';
        const desc = cat === 'Zn' ? 'white' : cat === 'Mn' ? 'salmon-pink' : 'dense black';
        return { formula: `${sym}S(s)↓`, name: `${sym} Sulfide (${sym}S)`, colorHex: col, colorDesc: desc, kspNote: 'extremely low K_sp metal sulfide' };
      }
      if (an === 'PO4') {
        const col = cat === 'Cu' ? '#38BDF8' : cat === 'Co' ? '#A855F7' : cat === 'Ni' ? '#4ADE80' : '#FFFFFF';
        return { formula: `${sym}₃(PO₄)₂(s)↓`, name: `${sym} Phosphate`, colorHex: col, colorDesc: 'insoluble flocculant', kspNote: 'insoluble metal phosphate' };
      }
      if (an === 'C2O4') {
        return { formula: `${sym}C₂O₄(s)↓`, name: `${sym} Oxalate`, colorHex: '#FFFFFF', colorDesc: 'crystalline', kspNote: 'insoluble metal oxalate' };
      }
    }
    return null;
  };

  let pptMatch: PptMatch | null = null;
  for (const a2 of anions2) {
    pptMatch = checkInsolublePair(cat1, a2);
    if (pptMatch) break;
  }
  if (!pptMatch) {
    for (const a1 of anions1) {
      pptMatch = checkInsolublePair(cat2, a1);
      if (pptMatch) break;
    }
  }

  if (pptMatch) {
    return {
      id: `synth_ppt_${r1.id}_${r2.id}`,
      name: `${r1.name} + ${r2.name} Double-Displacement Precipitation`,
      reactants: [r1.id, r2.id],
      requiredAmounts: reqAmounts,
      products: [pptMatch.formula, 'Soluble Spectator Ions (aq)'],
      balancedEquation: `${f1}(aq) + ${f2}(aq) → ${pptMatch.formula} [${pptMatch.colorDesc} precipitate] + Soluble Salt(aq)`,
      reactionType: 'precipitation',
      observableEffects: {
        colorChangeTo: pptMatch.colorHex === '#FFFFFF' ? '#F8FAFC' : pptMatch.colorHex,
        isFinalSolutionColorless: pptMatch.colorHex === '#FFFFFF',
        initialAppearance: `${r1.name} (${r1.formula}) + ${r2.name} (${r2.formula})`,
        finalAppearance: `Immediate cloudiness and settling of a ${pptMatch.colorDesc} ${pptMatch.name} (${pptMatch.formula}) precipitate`,
        temperatureDelta: 1.5,
        producesGas: false,
        producesFumesAboveLiquid: false,
        producesPrecipitate: true,
        precipitateColor: pptMatch.colorHex,
        precipitateName: pptMatch.name,
        isViolent: false,
        hazardType: 'none',
        description: `Ionic salt metathesis (double displacement): mixing ${r1.name} and ${r2.name} causes the ion product (Q_sp) to exceed the solubility product (${pptMatch.kspNote}), nucleating a ${pptMatch.colorDesc} precipitate of ${pptMatch.name} (${pptMatch.formula}).`,
      },
      explanation: `In aqueous solution, dissociated cations and anions exchange partners. Because ${pptMatch.name} has very low solubility (${pptMatch.kspNote}), it precipitates rapidly from solution while the counter-ions remain hydrated spectator ions.`,
    };
  }

  // 10. Active Metal + Less Reactive Metal Salt Single Displacement
  if (metalReagent) {
    const saltPartner = pair.find((c) => c.id !== metalReagent.id && c.category === 'salt');
    if (saltPartner) {
      const reactivityRank: Record<string, number> = {
        K: 12,
        Na: 11,
        Li: 11,
        Ca: 10,
        Mg: 9,
        Al: 8,
        Zn: 7,
        Fe: 6,
        Fe2: 6,
        Fe3: 6,
        Co: 5,
        Ni: 4,
        Sn: 3,
        Pb: 2,
        Cu: 1,
        Ag: 0,
      };
      const mSym = cleanFormulaState(metalReagent.formula).replace(/[^A-Za-z]/g, '');
      const saltCat = detectCation(saltPartner);
      const mRank = reactivityRank[mSym];
      const sRank = saltCat ? reactivityRank[saltCat] : undefined;
      if (mRank !== undefined && sRank !== undefined && mRank > sRank) {
        const displacedMetal = saltCat!.replace(/[23]/, '');
        return {
          id: `synth_disp_${metalReagent.id}_${saltPartner.id}`,
          name: `${metalReagent.name} + ${saltPartner.name} Single-Displacement Redox`,
          reactants: [metalReagent.id, saltPartner.id],
          requiredAmounts: reqAmounts,
          products: [`Aqueous ${metalReagent.name} Salt (aq)`, `${displacedMetal} (s)↓`],
          balancedEquation: `${mSym}(s) + ${cleanFormulaState(saltPartner.formula)}(aq) → ${mSym} Salt(aq) + ${displacedMetal}(s)↓`,
          reactionType: 'single_displacement',
          observableEffects: {
            colorChangeTo: mSym === 'Cu' ? '#0284C7' : mSym === 'Fe' ? '#86EFAC' : '#F8FAFC',
            isFinalSolutionColorless: !['Cu', 'Fe', 'Co', 'Ni'].includes(mSym),
            initialAppearance: `Metallic ${metalReagent.name} (${mSym}(s)) + ${saltPartner.name} (${saltPartner.formula})`,
            finalAppearance: `Deposition of elemental ${displacedMetal}(s) on the metal surface as ${mSym} dissolves into solution`,
            temperatureDelta: 12.0,
            producesGas: false,
            producesFumesAboveLiquid: false,
            producesPrecipitate: true,
            precipitateColor: displacedMetal === 'Cu' ? '#B45309' : displacedMetal === 'Ag' ? '#E2E8F0' : '#475569',
            precipitateName: `Elemental ${displacedMetal} Metal Deposit (${displacedMetal}(s))`,
            solidCoatingColor: displacedMetal === 'Cu' ? '#B45309' : '#CBD5E1',
            isViolent: false,
            hazardType: 'none',
            description: `Redox single displacement: because ${metalReagent.name} (${mSym}) is higher in the electrochemical reactivity series (more negative E°) than ${displacedMetal}, it donates electrons to reduce ${displacedMetal}ⁿ⁺ ions into solid metallic ${displacedMetal}(s)↓.`,
          },
          explanation: `Spontaneous electron transfer from the more electropositive metal (${mSym}) to the less reactive metal cation (${displacedMetal}ⁿ⁺) drives metallic deposition and dissolution of ${mSym}ⁿ⁺.`,
        };
      }
    }
  }

  return null;
}

/**
 * Evaluates an experiment recipe composed of selected ingredients and conditions.
 * Scientifically defensible: checks stoichiometry and returns verified reactions or honest unsupported explanations.
 */
export function evaluateReactionRecipe(params: {
  ingredients: Array<{ id: string; amount: number }>;
  conditions: {
    temperature: number;
    concentration: number;
    catalystId?: string | null;
  };
}): ReactionEvaluationResult {
  const { ingredients, conditions } = params;

  if (!ingredients || ingredients.length === 0) {
    return {
      isSupported: false,
      status: 'incomplete',
      structuredStatus: 'INSUFFICIENT_INFORMATION',
      reaction: null,
      message: 'No reagents have been added to the reaction beaker yet.',
    };
  }

  const amountsMap: Record<string, number> = {};
  ingredients.forEach((ing) => {
    amountsMap[ing.id] = (amountsMap[ing.id] || 0) + ing.amount;
  });

  const presentIds = Object.keys(amountsMap).filter((id) => amountsMap[id] > 0);

  // 0. Safety Gate: Block restricted hazardous or radioactive compounds from interactive execution
  const restrictedReagent = presentIds
    .map((id) => findReagentById(id))
    .find((r) => r?.isRestricted);

  if (restrictedReagent) {
    return {
      isSupported: false,
      status: 'unsupported',
      structuredStatus: 'NO_REACTION_SUPPORTED_UNDER_SPECIFIED_CONDITIONS',
      reaction: null,
      message: `SAFETY RESTRICTION: ${restrictedReagent.name} (${restrictedReagent.formula}) is classified as ${
        restrictedReagent.safetyClassification === 'radioactive_restricted'
          ? 'Radioactive / Restricted'
          : 'Hazardous / Restricted'
      }. ${
        restrictedReagent.restrictionReason ||
        'This substance is catalogued for curriculum reference only and is blocked from interactive mixing in the virtual laboratory.'
      }`,
      safetyWarnings: [
        restrictedReagent.restrictionReason ||
          'Restricted hazardous or radioactive substance. Interactive mixing disabled.',
      ],
    };
  }

  // If a catalyst was explicitly selected as a condition, consider it present
  if (conditions.catalystId) {
    amountsMap[conditions.catalystId] = (amountsMap[conditions.catalystId] || 0) + 10;
    if (!presentIds.includes(conditions.catalystId)) {
      presentIds.push(conditions.catalystId);
    }
  }

  // 1. Check for Alkali Metal Violent reactions first (priority)
  if (presentIds.includes('k_metal')) {
    const otherIds = presentIds.filter((id) => id !== 'k_metal');
    if (otherIds.length > 0) {
      if (otherIds.includes('hcl') || otherIds.includes('h2so4') || otherIds.includes('hno3')) {
        const r = REACTIONS.find((rx) => rx.id === 'alkali_acid_explosion')!;
        return buildSuccessResult(r, amountsMap, conditions);
      }
      if (otherIds.includes('h2o2')) {
        const r = REACTIONS.find((rx) => rx.id === 'k_peroxide_explosion')!;
        return buildSuccessResult(r, amountsMap, conditions);
      }
      if (otherIds.includes('cuso4')) {
        const r = REACTIONS.find((rx) => rx.id === 'k_cuso4_explosion')!;
        return buildSuccessResult(r, amountsMap, conditions);
      }
      const r = REACTIONS.find((rx) => rx.id === 'alkali_explosion')!;
      return buildSuccessResult(r, amountsMap, conditions);
    }
  }

  const allKnownReactions = [...REACTIONS, ...DYNAMIC_REACTIONS];

  // 2A. Search exact reactant set match first (highest specificity)
  const exactReaction = allKnownReactions.find(
    (r) =>
      r.reactants.length === presentIds.length &&
      r.reactants.every((reqId) => (amountsMap[reqId] || 0) > 0)
  );

  // 2B. Fallback to subset match if all required reactants are present
  const subsetReaction =
    exactReaction ||
    allKnownReactions.find((r) => r.reactants.every((reqId) => (amountsMap[reqId] || 0) > 0));

  if (subsetReaction) {
    const r = subsetReaction;
    const meetsAmounts = r.reactants.every((reqId) => {
      const required = r.requiredAmounts[reqId] || 10;
      return (amountsMap[reqId] || 0) >= required;
    });

    if (!meetsAmounts) {
      return {
        isSupported: true,
        status: 'incomplete',
        structuredStatus: 'INSUFFICIENT_INFORMATION',
        reaction: r,
        message: `Reactants for "${r.name}" are present, but quantity is below stoichiometric minimum. Add more reagents.`,
      };
    }

    return buildSuccessResult(r, amountsMap, conditions);
  }

  // 2C. Dynamic Indicator + Acid / Base Halochromic Transition Support
  const presentReagents = presentIds
    .map((id) => findReagentById(id))
    .filter((r): r is ChemicalReagent => Boolean(r));

  const indicatorReagent = presentReagents.find(
    (r) =>
      (r.category === 'indicator' || r.secondaryCategories?.includes('indicator')) &&
      r.indicatorTransition
  );
  const acidReagent = presentReagents.find(
    (r) =>
      r.id !== indicatorReagent?.id &&
      (r.category === 'acid' || r.secondaryCategories?.includes('acid')) &&
      !r.isRestricted
  );
  const baseReagent = presentReagents.find(
    (r) =>
      r.id !== indicatorReagent?.id &&
      (r.category === 'base' || r.secondaryCategories?.includes('base')) &&
      !r.isRestricted
  );

  if (indicatorReagent && indicatorReagent.indicatorTransition && (acidReagent || baseReagent)) {
    const partner = baseReagent || acidReagent!;
    const isBase = Boolean(baseReagent && !acidReagent);
    const trans = indicatorReagent.indicatorTransition;
    const targetColorLabel = isBase ? trans.baseColor : trans.acidColor;
    const colorHexMap: Record<string, string> = {
      colorless: '#F8FAFC',
      'pink / magenta': '#EC4899',
      'red / coral': '#EF4444',
      red: '#DC2626',
      yellow: '#EAB308',
      'deep blue': '#2563EB',
      blue: '#2563EB',
      'bright pink-red': '#E11D48',
      purple: '#9333ea',
      'orange-red / lilac': '#DC2626',
      'blue-violet': '#3730A3',
      'reddish-purple': '#BE185D',
      'bluish-red': '#BE123C',
      'amber-yellow': '#D97706',
      'red / orange / yellow': '#EF4444',
      'blue / indigo / violet': '#7C3AED',
      'bright red / pink': '#E11D48',
      'bluish-green / yellow': '#10B981',
      'bright yellow': '#EAB308',
      'reddish-brown': '#B91C1C',
      'deep crimson-purple': '#9F1239',
      'brownish-yellow': '#CA8A04',
      'deep magenta-red': '#E11D48',
      'dark greenish-blue': '#0F766E',
    };
    const resolvedHex =
      colorHexMap[targetColorLabel.toLowerCase()] ||
      (isBase ? '#3B82F6' : '#EF4444');
    const isColorless = resolvedHex === '#F8FAFC';

    const dynamicIndicatorRx: ReactionDefinition = {
      id: `indicator_${indicatorReagent.id}_${partner.id}`,
      name: `${indicatorReagent.name} Response in ${partner.name}`,
      reactants: [indicatorReagent.id, partner.id],
      requiredAmounts: { [indicatorReagent.id]: 2, [partner.id]: 10 },
      products: [
        `${indicatorReagent.name} (${isBase ? 'Deprotonated Basic Form' : 'Protonated Acidic Form'}: ${targetColorLabel})`,
      ],
      balancedEquation: `HIn(aq) [${indicatorReagent.name}] + ${
        isBase ? 'OH⁻(aq)' : 'H⁺(aq)'
      } ⇌ ${isBase ? 'In⁻(aq)' : 'H₂In⁺(aq)'} [${targetColorLabel}, ${trans.transitionRange}]`,
      reactionType: 'neutralization',
      observableEffects: {
        colorChangeTo: resolvedHex,
        isFinalSolutionColorless: isColorless,
        initialAppearance: `${indicatorReagent.name} + ${partner.name} (${partner.formula})`,
        finalAppearance: `${targetColorLabel} solution (${indicatorReagent.name} in ${
          isBase ? 'alkaline' : 'acidic'
        } medium, transition range ${trans.transitionRange})`,
        temperatureDelta: 0.2,
        producesGas: false,
        producesFumesAboveLiquid: false,
        producesPrecipitate: false,
        isViolent: false,
        hazardType: 'none',
        description: `Halochromic indicator response: ${indicatorReagent.name} exhibits its characteristic ${targetColorLabel} form in the ${
          isBase ? 'alkaline' : 'acidic'
        } environment of ${partner.name} (${partner.formula}), governed by its ${trans.transitionRange} transition interval.`,
      },
      explanation: `${indicatorReagent.name} acts as a weak conjugate acid–base indicator pair (HIn ⇌ H⁺ + In⁻). In ${partner.name}, the solution pH shifts the equilibrium toward the ${targetColorLabel} chromophore state.`,
    };

    return buildSuccessResult(dynamicIndicatorRx, amountsMap, conditions);
  }

  // 3. Single ingredient cases
  if (presentIds.length === 1) {
    const singleId = presentIds[0];
    const info = getReagentDisplayInfo(singleId);
    const fullReagent = findReagentById(singleId);

    if (singleId === 'water') {
      return {
        isSupported: false,
        status: 'incomplete',
        structuredStatus: 'INSUFFICIENT_INFORMATION',
        reaction: null,
        message: `Beaker contains only Water (H₂O). Water commonly acts as a neutral polar solvent (pH 7.0) in aqueous solutions and does not undergo a spontaneous chemical reaction on its own. Add a solute or complementary reagent (such as an alkali metal, acid, base, or salt) to observe dissolution or reaction.`,
      };
    }

    if (singleId === 'h2o2') {
      return {
        isSupported: false,
        status: 'incomplete',
        structuredStatus: 'INSUFFICIENT_INFORMATION',
        reaction: null,
        message: `Beaker contains only ${info.name}. Uncatalyzed hydrogen peroxide disproportionates imperceptibly slowly at room temperature. Add a catalyst (such as MnO₂, KI, or Catalase) or a complementary reagent to initiate rapid decomposition.`,
      };
    }

    if (fullReagent && (fullReagent.category === 'catalyst' || fullReagent.type === 'catalyst')) {
      const roleNote = fullReagent.catalyticRole || fullReagent.description;
      const rxNote = fullReagent.exampleReactions?.length
        ? ` Example catalyzed process: ${fullReagent.exampleReactions[0]}.`
        : '';
      return {
        isSupported: false,
        status: 'incomplete',
        structuredStatus: 'INSUFFICIENT_INFORMATION',
        reaction: null,
        message: `Beaker contains only ${info.name} (${info.formula}). A catalyst increases reaction rate by providing an alternative lower-activation-energy pathway without being consumed stoichiometrically, and cannot react by itself. ${roleNote}${rxNote}`,
      };
    }

    return {
      isSupported: false,
      status: 'incomplete',
      structuredStatus: 'INSUFFICIENT_INFORMATION',
      reaction: null,
      message: `Beaker contains only ${info.name}. Add a complementary chemical reagent (acid, base, salt, or metal) to initiate a reaction.`,
    };
  }

  // 4. Specific known non-reactive or unsupported combinations
  const names = presentIds.map((id) => getReagentDisplayInfo(id).name).join(' and ');
  const types = presentIds.map((id) => getReagentDisplayInfo(id).type);

  // Reference or mismatched catalyst pairings
  const catalystReagents = presentIds
    .map((id) => findReagentById(id))
    .filter((r): r is ChemicalReagent => Boolean(r && (r.category === 'catalyst' || r.type === 'catalyst')));

  if (catalystReagents.length > 0) {
    const cat = catalystReagents[0];
    const exRx = cat.exampleReactions?.length ? ` Reference catalytic process: ${cat.exampleReactions[0]}.` : '';
    const condNote = cat.reactionConditions ? ` Required conditions: ${cat.reactionConditions}.` : '';
    return {
      isSupported: false,
      status: 'unsupported',
      structuredStatus: 'NO_REACTION_SUPPORTED_UNDER_SPECIFIED_CONDITIONS',
      reaction: null,
      message: `No supported aqueous beaker reaction occurs between ${names}. Catalysts are reaction-specific and not universally interchangeable: ${cat.name} (${cat.formula}) is catalogued as ${cat.curriculumLevel || 'an educational reference catalyst'} (${cat.catalyticRole || cat.description}).${exRx}${condNote}`,
    };
  }

  // Non-reactive metal in non-oxidizing acid: e.g. Copper + HCl / H2SO4 / CH3COOH
  if (
    presentIds.includes('cu') &&
    presentIds.some((id) => ['hcl', 'h2so4', 'ch3cooh', 'c6h8o7'].includes(id))
  ) {
    return {
      isSupported: false,
      status: 'unsupported',
      structuredStatus: 'NO_REACTION_SUPPORTED_UNDER_SPECIFIED_CONDITIONS',
      reaction: null,
      message: `No reaction occurs between ${names} under standard conditions. Copper (E° = +0.34 V) is less electropositive than hydrogen (E° = 0.00 V) in the reduction potential series and cannot displace hydrogen gas (H₂) from non-oxidizing acids like HCl or dilute H₂SO₄.`,
    };
  }

  // Copper with more reactive metal salts (e.g. Cu + ZnSO4, Cu + NaCl)
  if (presentIds.includes('cu') && presentIds.length === 2 && !presentIds.some((id) => /ag/i.test(id))) {
    return {
      isSupported: false,
      status: 'unsupported',
      structuredStatus: 'NO_REACTION_SUPPORTED_UNDER_SPECIFIED_CONDITIONS',
      reaction: null,
      message: `No reaction occurs between ${names} under standard conditions. Copper (E° = +0.34 V) lies lower in the electrochemical reactivity series than the paired cation and cannot displace it from solution.`,
    };
  }

  // Non-reactive salt dissolution: NaCl + Water
  if (presentIds.length === 2 && presentIds.includes('nacl') && presentIds.includes('water')) {
    return {
      isSupported: false,
      status: 'unsupported',
      structuredStatus: 'NO_REACTION_SUPPORTED_UNDER_SPECIFIED_CONDITIONS',
      reaction: null,
      message: `Sodium chloride dissolves in water into hydrated spectator ions (Na⁺ and Cl⁻) forming a stable aqueous solution. No chemical bond cleavage, redox transfer, or precipitation occurs.`,
    };
  }

  // Water acting as solvent / diluent with another single non-water-reactive substance
  if (presentIds.length === 2 && presentIds.includes('water')) {
    const otherId = presentIds.find((id) => id !== 'water')!;
    const otherInfo = getReagentDisplayInfo(otherId);
    return {
      isSupported: false,
      status: 'unsupported',
      structuredStatus: 'NO_REACTION_SUPPORTED_UNDER_SPECIFIED_CONDITIONS',
      reaction: null,
      message: `Water (H₂O) acts as a polar solvent hydrating or diluting ${otherInfo.name} (${otherInfo.formula}) into aqueous spectator ions or dispersed phase. No new chemical products, gas evolution, or precipitate are formed by dilution alone.`,
    };
  }

  // 5. Scientifically Rigorous Stoichiometric Synthesis for Canonical & Newly Added Compounds
  const synthesizedReaction = synthesizeScientificReaction(presentReagents, amountsMap);
  if (synthesizedReaction) {
    registerDynamicReaction(synthesizedReaction);
    return buildSuccessResult(synthesizedReaction, amountsMap, conditions);
  }

  // Two acids mixed together
  if (types.every((t) => t === 'acid')) {
    return {
      isSupported: false,
      status: 'unsupported',
      structuredStatus: 'NO_REACTION_SUPPORTED_UNDER_SPECIFIED_CONDITIONS',
      reaction: null,
      message: `No spontaneous chemical reaction occurs between ${names}. Both substances are acids (proton donors) in aqueous solution without a complementary base, carbonate, reactive metal, or precipitating ion.`,
    };
  }

  // Two bases mixed together
  if (types.every((t) => t === 'base')) {
    return {
      isSupported: false,
      status: 'unsupported',
      structuredStatus: 'NO_REACTION_SUPPORTED_UNDER_SPECIFIED_CONDITIONS',
      reaction: null,
      message: `No spontaneous chemical reaction occurs between ${names}. Both substances are alkaline bases supplying hydroxide ions (OH⁻) without an acid or precipitating metal cation.`,
    };
  }

  // Two soluble salts or salt + acid/base with no insoluble precipitate or gas
  if (presentIds.includes('nacl') || types.every((t) => t === 'salt')) {
    return {
      isSupported: false,
      status: 'unsupported',
      structuredStatus: 'NO_REACTION_SUPPORTED_UNDER_SPECIFIED_CONDITIONS',
      reaction: null,
      message: `No spontaneous chemical reaction occurs between ${names} under standard conditions (${conditions.temperature}°C, ${conditions.concentration.toFixed(1)} M). All resulting ion combinations remain soluble hydrated spectator ions (ion product does not exceed K_sp), so no precipitate, gas, or weak electrolyte is formed.`,
    };
  }

  return {
    isSupported: false,
    status: 'unsupported',
    structuredStatus: 'NO_REACTION_SUPPORTED_UNDER_SPECIFIED_CONDITIONS',
    reaction: null,
    message: `The combination of ${names} does not form a spontaneous chemical reaction under standard lab conditions, or is not in the curated high-school reaction set. No electron transfer, proton transfer, or insoluble precipitation occurs.`,
  };
}

function buildSuccessResult(
  r: ReactionDefinition,
  amountsMap: Record<string, number>,
  conditions: { temperature: number; concentration: number; catalystId?: string | null }
): ReactionEvaluationResult {
  // Thermal kinetic multiplier
  const tempFactor = Math.max(0.7, conditions.temperature / 25);
  const concFactor = Math.max(0.5, conditions.concentration);
  const scaledDelta = Number((r.observableEffects.temperatureDelta * concFactor).toFixed(1));

  const warnings: string[] = [];
  if (r.observableEffects.isViolent) {
    warnings.push('EXTREME HAZARD: High exothermic enthalpy and rapid gas expansion. Carry out only in a certified blast fume hood with face shield.');
  }
  if (r.observableEffects.producesGas && r.observableEffects.gasName?.includes('Toxic')) {
    warnings.push('TOXIC GAS WARNING: Evolution of nitrogen dioxide fumes. Inhalation hazard. Must operate in certified chemical fume hood.');
  }
  if (r.reactionType === 'neutralization') {
    warnings.push('Standard acid-base PPE: Wear splash goggles, nitrile gloves, and closed-toe lab shoes.');
  }

  const compatibleCatalysts = r.reactants.includes('h2o2') ? ['mno2', 'ki', 'catalase_enzyme', 'fe'] : [];

  // Check if reaction is condition dependent (e.g. peroxide decomposition rate dependent on catalyst)
  let structuredStatus: StructuredReactionStatus = 'VALIDATED_SUPPORTED_REACTION';
  let message = `Verified reaction: ${r.name}`;

  if (r.id === 'elephant_toothpaste' || r.id === 'ki_peroxide_catalysis' || r.id === 'catalase_peroxide_decomposition') {
    const hasCatalyst =
      conditions.catalystId === 'mno2' ||
      conditions.catalystId === 'ki' ||
      conditions.catalystId === 'catalase_enzyme' ||
      amountsMap['mno2'] > 0 ||
      amountsMap['ki'] > 0 ||
      amountsMap['catalase_enzyme'] > 0;
    if (hasCatalyst) {
      structuredStatus = 'VALIDATED_SUPPORTED_REACTION';
      message = `Verified catalytic reaction: ${r.name}`;
    } else {
      structuredStatus = 'CONDITION_DEPENDENT';
      message = `Condition-dependent reaction: ${r.name}. Hydrogen peroxide disproportionation is accelerated dramatically by adding a catalyst (MnO₂, KI, or Catalase).`;
    }
  }

  const hasUniversalIndicator = (amountsMap['universal_indicator'] || 0) > 0 || (amountsMap['bromothymol_blue'] || 0) > 0;
  const hasMethylOrange = (amountsMap['methyl_orange'] || 0) > 0;

  let effectiveColorChangeTo = r.observableEffects.colorChangeTo;
  let effectiveIsColorless = r.observableEffects.isFinalSolutionColorless;
  let effectiveFinalAppearance = r.observableEffects.finalAppearance;

  if (r.reactionType === 'neutralization' && r.observableEffects.isFinalSolutionColorless) {
    if (hasUniversalIndicator) {
      effectiveColorChangeTo = '#10B981';
      effectiveIsColorless = false;
      effectiveFinalAppearance = 'Emerald-green neutral solution (pH 7.0 indicated by Universal / Bromothymol Indicator)';
    } else if (hasMethylOrange) {
      effectiveColorChangeTo = '#F59E0B';
      effectiveIsColorless = false;
      effectiveFinalAppearance = 'Orange-amber neutral endpoint solution (indicated by Methyl Orange)';
    }
  }

  return {
    isSupported: true,
    status: 'ready',
    structuredStatus,
    reaction: r,
    message,
    balancedEquation: r.balancedEquation,
    reactionType: r.reactionType,
    reactantsList: r.reactants.map((id) => getReagentDisplayInfo(id).formula),
    productsList: r.products,
    observableEffects: {
      ...r.observableEffects,
      colorChangeTo: effectiveColorChangeTo,
      isFinalSolutionColorless: effectiveIsColorless,
      finalAppearance: effectiveFinalAppearance,
      temperatureDelta: scaledDelta,
      gasVigor: r.observableEffects.gasVigor
        ? Math.min(5, Math.round(r.observableEffects.gasVigor * tempFactor))
        : undefined,
    },
    explanation: r.explanation,
    safetyWarnings: warnings,
    compatibleCatalysts,
  };
}
