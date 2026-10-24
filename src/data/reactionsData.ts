import { ChemicalReagent, ReactionDefinition } from '../types/chemistry';
import { REAGENTS } from './chemicalLibraryData';

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
];

/**
 * Compatible catalyst lookup map by primary reaction / reactant.
 */
export const COMPATIBLE_CATALYSTS: Record<string, string[]> = {
  h2o2: ['mno2', 'ki', 'catalase_enzyme', 'fe'],
  decomposition: ['mno2', 'ki', 'catalase_enzyme'],
  redox: ['fe'],
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

export function getReagentDisplayInfo(id: string): { name: string; formula: string; type: string } {
  const found = REAGENTS.find((r) => r.id === id);
  if (found) return { name: found.name, formula: found.formula, type: found.type };
  if (EXTRA_REAGENT_LABELS[id]) return EXTRA_REAGENT_LABELS[id];
  return { name: id, formula: id, type: 'reagent' };
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

  // 2A. Search exact reactant set match first (highest specificity)
  const exactReaction = REACTIONS.find(
    (r) =>
      r.reactants.length === presentIds.length &&
      r.reactants.every((reqId) => (amountsMap[reqId] || 0) > 0)
  );

  // 2B. Fallback to subset match if all required reactants are present
  const subsetReaction =
    exactReaction ||
    REACTIONS.find((r) => r.reactants.every((reqId) => (amountsMap[reqId] || 0) > 0));

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

  // 3. Single ingredient cases
  if (presentIds.length === 1) {
    const singleId = presentIds[0];
    const info = getReagentDisplayInfo(singleId);
    const fullReagent = REAGENTS.find((r) => r.id === singleId);

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
    .map((id) => REAGENTS.find((r) => r.id === id))
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
  if (presentIds.includes('cu') && presentIds.length === 2) {
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
