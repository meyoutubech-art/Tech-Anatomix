import React, { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { ChemistryLabScene } from '../components/chemistry/ChemistryLabScene';
import { MolecularScene } from '../components/chemistry/MolecularScene';
import { Dynamic3DModelRenderer } from '../components/models/Dynamic3DModelRenderer';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { ModelAwareChatbot, ModelChatContext } from '../components/ai/ModelAwareChatbot';
import {
  REAGENTS,
  REACTIONS,
  evaluateReactionRecipe,
  ReactionEvaluationResult,
  getReagentDisplayInfo,
} from '../data/reactionsData';
import { ChemicalReagent, ReactionDefinition } from '../types/chemistry';
import { EducationalExplanationBox, ExplanationData } from '../components/common/EducationalExplanationBox';
import { ReactionAiChatbot } from '../components/chemistry/ReactionAiChatbot';
import { AiCompoundAddPanel } from '../components/chemistry/AiCompoundAddPanel';
import { ChemistryPlayMissionsBar } from '../components/chemistry/ChemistryPlayMissionsBar';
import {
  findOrLookupCompound,
  getCanonicalRegistry,
  getRegistryVersion,
  normalizeChemicalSearchText,
  registerCanonicalCompound,
  subscribeRegistryChange,
} from '../data/compoundRegistry';
import { PresentationExportModal } from '../components/common/PresentationExportModal';
import { PresentationExportOptions } from '../utils/presentationGenerator';
import { soundEngine } from '../utils/soundEngine';
import {
  FlaskConical,
  Atom,
  Sparkles,
  Play,
  RotateCcw,
  AlertCircle,
  Undo2,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Thermometer,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Info,
  Sliders,
} from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class LabErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Chemistry 3D Scene caught error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-[440px] bg-slate-900 rounded-2xl border border-slate-700 flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-base font-bold">3D Reaction Bench Recovered</h3>
            <p className="text-xs text-slate-400">
              WebGL graphics context was smoothly restored. Click below to re-enter the interactive chemistry workstation.
            </p>
          </div>
          <button
            onClick={this.handleReload}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload 3D Lab Bench</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export interface SelectedIngredient {
  id: string;
  name: string;
  formula: string;
  amount: number;
  unit: string;
  category: string;
  color: string;
  hazard?: string;
}

export interface ChemistryModelMeta {
  id: string;
  title: string;
  shortTitle: string;
  badge: string;
  shortDesc: string;
}

export const CHEMISTRY_BATCH_1_PAGE_MODELS: ChemistryModelMeta[] = [
  {
    id: 'molecular-orbital-explorer',
    title: '69. Molecular Orbital Explorer',
    shortTitle: '69. Molecular Orbitals',
    badge: 'LCAO & Bond Order',
    shortDesc: 'Wavefunction combination, σ/π bonding & antibonding MOs, nodal surfaces & energy diagram.',
  },
  {
    id: 'atomic-orbital-probability-explorer',
    title: '70. Atomic Orbital Probability Explorer',
    shortTitle: '70. Atomic Orbitals',
    badge: 'Quantum Probability |ψ|²',
    shortDesc: '1s, 2s, 2p & 3d probability distributions, radial (n-l-1) & angular (l) nodes & planar cross-sections.',
  },
  {
    id: 'advanced-crystal-lattice-explorer',
    title: '71. Advanced Crystal Lattice Explorer',
    shortTitle: '71. Crystal Lattices',
    badge: 'SC / BCC / FCC / HCP',
    shortDesc: 'Unit cells, shared boundary atoms, coordination numbers, packing efficiency (APF) & cell expansion.',
  },
  {
    id: 'molecular-polarity-explorer',
    title: '72. Molecular Polarity Explorer',
    shortTitle: '72. Molecular Polarity',
    badge: 'Dipole Vector Addition',
    shortDesc: 'H₂O, CO₂, NH₃, CH₄ & BF₃ VSEPR geometries, bond dipole vectors & resultant dipole sum.',
  },
  {
    id: 'intermolecular-forces-explorer',
    title: '73. Intermolecular Forces Explorer',
    shortTitle: '73. Intermolecular Forces',
    badge: 'LDF / Dipole / H-Bond',
    shortDesc: 'London dispersion, dipole–dipole & hydrogen bonding vs separation distance & thermal motion.',
  },
  {
    id: 'electrochemical-cell-simulator',
    title: '74. Electrochemical Cell Simulator',
    shortTitle: '74. Galvanic Cell',
    badge: 'Spontaneous Redox & Nernst',
    shortDesc: 'Zn–Cu Daniell cell, external electron flow, salt-bridge ion migration & Nernst cell potential.',
  },
  {
    id: 'electrolysis-explorer',
    title: '75. Electrolysis Explorer',
    shortTitle: '75. Electrolysis Lab',
    badge: "Faraday's Laws",
    shortDesc: 'DC-driven molten NaCl, water & CuSO₄ electrolysis, electrode polarity & Faraday yield calculator.',
  },
];

export const CHEMISTRY_BATCH_2_PAGE_MODELS: ChemistryModelMeta[] = [
  {
    id: 'chemical-kinetics-simulator',
    title: '76. Chemical Kinetics Simulator',
    shortTitle: '76. Chemical Kinetics',
    badge: 'Rate Laws & Arrhenius',
    shortDesc: '1st & 2nd order rate laws, half-life (t₁/₂), collision frequency, catalyst toggle & [A]_t curves.',
  },
  {
    id: 'chemical-equilibrium-explorer',
    title: '77. Chemical Equilibrium Explorer',
    shortTitle: '77. Equilibrium Explorer',
    badge: "Q vs K_c & Le Chatelier",
    shortDesc: 'Dynamic reversible equilibrium (r_fwd = r_rev), Q_c vs K_c/K_p, piston volume & thermal shifts.',
  },
  {
    id: 'reaction-energy-profile-explorer',
    title: '78. Reaction Energy Profile Explorer',
    shortTitle: '78. Energy Profiles',
    badge: 'E_a, ΔH & Transition State [‡]',
    shortDesc: 'Exothermic, endothermic & multistep enthalpy profiles, E_a(fwd)/E_a(rev) & coordinate marker ξ.',
  },
  {
    id: 'catalysis-explorer',
    title: '79. Catalysis Explorer',
    shortTitle: '79. Catalysis Explorer',
    badge: 'Heterogeneous & Homogeneous',
    shortDesc: 'Pt(111) surface vs homogeneous I⁻/enzymatic pathways, ΔE_a reduction, cycle steps & K_eq invariance.',
  },
  {
    id: 'acid-base-titration-laboratory',
    title: '80. Acid–Base Titration Laboratory',
    shortTitle: '80. Acid–Base Titration',
    badge: 'Titration Curves & Equivalence',
    shortDesc: 'Strong/weak acid–base titrations, Henderson–Hasselbalch buffer region, indicators & pH curve.',
  },
  {
    id: 'solubility-precipitation-explorer',
    title: '81. Solubility and Precipitation Explorer',
    shortTitle: '81. Solubility & K_sp',
    badge: 'Q_sp vs K_sp & Common Ion',
    shortDesc: 'AgCl, PbI₂, BaSO₄ & CaF₂ dissolution equilibria, discrete crystal precipitation & common-ion effect.',
  },
  {
    id: 'buffer-solution-simulator',
    title: '82. Buffer Solution Simulator',
    shortTitle: '82. Buffer Simulator',
    badge: 'Conjugate Pairs & Capacity',
    shortDesc: 'Acetate, phosphate & ammonia buffers, strong acid/base neutralization & buffer capacity comparison.',
  },
];

export type ChemistryWorkspaceMode =
  | 'reaction_bench'
  | 'molecular_explorer'
  | 'molecular-orbital-explorer'
  | 'atomic-orbital-probability-explorer'
  | 'advanced-crystal-lattice-explorer'
  | 'molecular-polarity-explorer'
  | 'intermolecular-forces-explorer'
  | 'electrochemical-cell-simulator'
  | 'electrolysis-explorer'
  | 'chemical-kinetics-simulator'
  | 'chemical-equilibrium-explorer'
  | 'reaction-energy-profile-explorer'
  | 'catalysis-explorer'
  | 'acid-base-titration-laboratory'
  | 'solubility-precipitation-explorer'
  | 'buffer-solution-simulator';

export interface ChemistryLabPageProps {
  initialMode?: ChemistryWorkspaceMode;
  launchKey?: number;
}

export const ChemistryLabPage: React.FC<ChemistryLabPageProps> = ({ initialMode, launchKey }) => {
  const [chemMode, setChemMode] = useState<ChemistryWorkspaceMode>(initialMode || 'reaction_bench');
  const [batchParams, setBatchParams] = useState<Record<string, number>>({});
  const [batchConds, setBatchConds] = useState<Record<string, any>>({});

  const activeChemistryBatchSpec = useMemo(() => {
    if (chemMode === 'reaction_bench' || chemMode === 'molecular_explorer') return null;
    return CURATED_AI_MODELS[chemMode] || null;
  }, [chemMode]);

  const handleSelectChemistryBatchModel = (modelId: ChemistryWorkspaceMode) => {
    setChemMode(modelId);
    const spec = CURATED_AI_MODELS[modelId];
    if (spec) {
      const initParams: Record<string, number> = {};
      Object.values(spec.parameters || {}).forEach((p) => {
        initParams[p.id] = p.defaultValue;
      });
      setBatchParams(initParams);
      const initConds: Record<string, any> = {};
      Object.values(spec.conditions || {}).forEach((c) => {
        initConds[c.id] = c.defaultValue;
      });
      setBatchConds(initConds);
    }
  };

  useEffect(() => {
    if (initialMode) {
      handleSelectChemistryBatchModel(initialMode);
    }
  }, [initialMode, launchKey]);

  const chemistryBatchChatContext: ModelChatContext | null = useMemo(() => {
    if (!activeChemistryBatchSpec) return null;
    return {
      modelId: activeChemistryBatchSpec.id,
      title: activeChemistryBatchSpec.title,
      subject: 'Chemistry',
      concept: activeChemistryBatchSpec.concept || activeChemistryBatchSpec.title,
      description: activeChemistryBatchSpec.description,
      components: (activeChemistryBatchSpec.parts || []).map((p) => ({
        id: p.id,
        name: p.name,
        whatIsIt: (p as any).whatIsIt || p.name,
        whatDoesItDo: (p as any).whatDoesItDo || p.description,
        description: p.description,
        realLifeExample: (p as any).realLifeExample || '',
      })),
      selectedComponent: null,
    };
  }, [activeChemistryBatchSpec]);

  // Selected ingredients ordered sequence for the experiment builder - Starts completely EMPTY
  const [ingredients, setIngredients] = useState<SelectedIngredient[]>([]);

  // Inventory tracking across all canonical and preset reagents
  const [inventory, setInventory] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    getCanonicalRegistry().forEach((r) => {
      init[r.id] = r.initialQuantity;
    });
    return init;
  });

  // Reaction Conditions
  const [temperature, setTemperature] = useState<number>(25); // °C
  const [tempInputStr, setTempInputStr] = useState<string>('25');
  const [concentration, setConcentration] = useState<number>(1.0); // M
  const [selectedCatalystId, setSelectedCatalystId] = useState<string | null>(null);

  // Sync typed input text whenever temperature changes
  useEffect(() => {
    setTempInputStr(temperature.toString());
  }, [temperature]);

  const handleTempType = (raw: string) => {
    setTempInputStr(raw);
    const num = parseFloat(raw);
    if (!isNaN(num) && isFinite(num)) {
      // Unlimited temperature: no upper cap, physical lower limit is absolute zero (-273.15 °C)
      setTemperature(Math.max(-273.15, num));
      setHasRunReaction(false);
    }
  };

  const handleTempBlur = () => {
    if (tempInputStr.trim() === '' || isNaN(parseFloat(tempInputStr))) {
      setTempInputStr(temperature.toString());
    } else {
      const num = Math.max(-273.15, parseFloat(tempInputStr));
      setTemperature(num);
      setTempInputStr(num.toString());
    }
  };

  // Search & Filter state for compound library
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Simulation execution state
  const [hasRunReaction, setHasRunReaction] = useState<boolean>(false);
  const [isRunningSim, setIsRunningSim] = useState<boolean>(false);
  const [evaluatedResult, setEvaluatedResult] = useState<ReactionEvaluationResult | null>(null);

  // Presentation Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Molecular Explorer State
  const [selectedMoleculeId, setSelectedMoleculeId] = useState<string>('h2o');

  // Reagents in beaker mapped for 3D renderer
  const reagentsInBeaker = useMemo(() => {
    const map: Record<string, number> = {};
    ingredients.forEach((ing) => {
      map[ing.id] = (map[ing.id] || 0) + ing.amount;
    });
    if (selectedCatalystId) {
      map[selectedCatalystId] = (map[selectedCatalystId] || 0) + 10;
    }
    return map;
  }, [ingredients, selectedCatalystId]);

  // Calculate compatible catalysts for currently selected reagents
  const compatibleCatalystOptions = useMemo(() => {
    const ids = ingredients.map((i) => i.id);
    const options: ChemicalReagent[] = [];
    if (ids.includes('h2o2')) {
      const mno2 = REAGENTS.find((r) => r.id === 'mno2');
      const ki = REAGENTS.find((r) => r.id === 'ki');
      const catalase = REAGENTS.find((r) => r.id === 'catalase_enzyme');
      if (mno2) options.push(mno2);
      if (ki) options.push(ki);
      if (catalase) options.push(catalase);
    }
    if (ids.includes('fe')) {
      const fe = REAGENTS.find((r) => r.id === 'fe');
      if (fe && !options.includes(fe)) options.push(fe);
    }
    return options;
  }, [ingredients]);

  // Subscribe to dynamic additions in the Canonical Chemistry Registry
  const [registryVersion, setRegistryVersion] = useState<number>(() => getRegistryVersion());
  useEffect(() => {
    return subscribeRegistryChange(() => {
      setRegistryVersion(getRegistryVersion());
    });
  }, []);

  // Filtered reagents for the library shelf (includes core REAGENTS + full verified registry + dynamically added AI chemicals)
  const allLibraryReagents = useMemo(() => {
    const map = new Map<string, ChemicalReagent>();
    REAGENTS.forEach((r) => map.set(r.id, r));
    getCanonicalRegistry().forEach((r) => {
      if (!map.has(r.id)) {
        map.set(r.id, r);
      }
    });
    return Array.from(map.values());
  }, [registryVersion]);

  const filteredReagents = useMemo(() => {
    const qNorm = normalizeChemicalSearchText(searchQuery);
    return allLibraryReagents.filter((r) => {
      const matchesSearch =
        qNorm === '' ||
        normalizeChemicalSearchText(r.name).includes(qNorm) ||
        normalizeChemicalSearchText(r.formula).includes(qNorm) ||
        normalizeChemicalSearchText(r.type).includes(qNorm) ||
        normalizeChemicalSearchText(r.subcategory || '').includes(qNorm) ||
        normalizeChemicalSearchText(r.role || '').includes(qNorm) ||
        normalizeChemicalSearchText(r.categoryLabel || '').includes(qNorm) ||
        normalizeChemicalSearchText(r.catalyticRole || '').includes(qNorm) ||
        normalizeChemicalSearchText(r.description || '').includes(qNorm) ||
        normalizeChemicalSearchText(r.appearanceDescription || '').includes(qNorm) ||
        (r.aliases || []).some((a) => normalizeChemicalSearchText(a).includes(qNorm));

      const hasSecondary = Boolean(
        r.secondaryCategories?.includes(activeCategory as any) ||
          r.sourceCategories?.includes(activeCategory)
      );

      const matchesCat =
        activeCategory === 'all' ||
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

      return matchesSearch && matchesCat;
    });
  }, [allLibraryReagents, searchQuery, activeCategory]);

  // Add compound to recipe - supports reagentId string or ChemicalReagent object from AI lookup
  const handleAddCompound = (reagentOrId: string | ChemicalReagent, customAmount?: number) => {
    let def: ChemicalReagent | undefined;
    if (typeof reagentOrId === 'string') {
      const lookup = findOrLookupCompound(reagentOrId);
      def = lookup.compound || getCanonicalRegistry().find((r) => r.id === reagentOrId) || REAGENTS.find((r) => r.id === reagentOrId);
    } else if (reagentOrId && typeof reagentOrId === 'object' && reagentOrId.id) {
      def = reagentOrId;
      registerCanonicalCompound(def);
    }
    if (!def) return;

    // Enforce safety restriction: hazardous/radioactive compounds are reference-only
    if (def.isRestricted) {
      soundEngine.playUiFeedback('validation_warning', `restricted_block::${def.id}`);
      setHasRunReaction(true);
      setEvaluatedResult({
        isSupported: false,
        status: 'unsupported',
        structuredStatus: 'NO_REACTION_SUPPORTED_UNDER_SPECIFIED_CONDITIONS',
        reaction: null,
        message: `SAFETY RESTRICTION: ${def.name} (${def.formula}) is classified as ${
          def.safetyClassification === 'radioactive_restricted'
            ? 'Radioactive / Restricted'
            : 'Hazardous / Restricted'
        }. ${
          def.restrictionReason ||
          'Catalogued for curriculum reference only; interactive beaker mixing is disabled for safety.'
        }`,
        safetyWarnings: [
          def.restrictionReason || 'Restricted hazardous or radioactive substance.',
        ],
      });
      return;
    }

    const amountToAdd = customAmount ?? def.pourAmount ?? 20;
    setIngredients((prev) => [
      ...prev,
      {
        id: def.id,
        name: def.name,
        formula: def.formula,
        amount: amountToAdd,
        unit: def.unit || 'mL',
        category: def.category || def.type,
        color: def.color || '#38BDF8',
        hazard: def.hazard,
      },
    ]);

    // State-driven reagent addition audio (liquid pour vs solid granular addition)
    soundEngine.playReagentAddition({
      reagentId: def.id,
      name: def.name,
      state: def.state || 'liquid',
      amount: amountToAdd,
      unit: def.unit || 'mL',
      dedupeKey: `add_compound::${def.id}::${amountToAdd}`,
    });

    // Deduct from inventory
    setInventory((prev) => ({
      ...prev,
      [def.id]: Math.max(0, (prev[def.id] ?? def.initialQuantity ?? 100) - amountToAdd),
    }));

    // Reset reaction execution until user clicks Run
    setHasRunReaction(false);
    setEvaluatedResult(null);
  };

  // Automatically populate active experiment from Discover a Reaction card
  const handleLoadReactionToExperiment = (
    reactantsToLoad: Array<{ id: string; amount: number; name?: string; formula?: string }>,
    catalystId?: string | null
  ) => {
    // 1. Reset reaction execution (do not automatically run reaction; adding reactants is separate from running)
    setHasRunReaction(false);
    setEvaluatedResult(null);
    soundEngine.stopSource('chemistry-lab');

    // 2. Prepare new ingredients list from the reactants (enforcing safety restrictions)
    const newIngredients: SelectedIngredient[] = [];
    const newInventoryUpdates: Record<string, number> = {};

    for (let idx = 0; idx < reactantsToLoad.length; idx++) {
      const item = reactantsToLoad[idx];
      const lookup = findOrLookupCompound(item.id);
      const def =
        lookup.compound ||
        getCanonicalRegistry().find((c) => c.id === item.id) ||
        REAGENTS.find((r) => r.id === item.id);

      if (def) {
        if (def.isRestricted) {
          soundEngine.playUiFeedback('validation_warning', `restricted_block::${def.id}`);
          setHasRunReaction(true);
          setEvaluatedResult({
            isSupported: false,
            status: 'unsupported',
            structuredStatus: 'NO_REACTION_SUPPORTED_UNDER_SPECIFIED_CONDITIONS',
            reaction: null,
            message: `SAFETY RESTRICTION: ${def.name} (${def.formula}) is classified as ${
              def.safetyClassification === 'radioactive_restricted'
                ? 'Radioactive / Restricted'
                : 'Hazardous / Restricted'
            }. ${
              def.restrictionReason ||
              'Catalogued for curriculum reference only; interactive beaker mixing is disabled for safety.'
            }`,
            safetyWarnings: [
              def.restrictionReason || 'Restricted hazardous or radioactive substance.',
            ],
          });
          return;
        }

        const amt = item.amount || def.pourAmount || 20;
        newIngredients.push({
          id: def.id,
          name: def.name,
          formula: def.formula,
          amount: amt,
          unit: def.unit || 'mL',
          category: def.category || def.type,
          color: def.color || '#38BDF8',
          hazard: def.hazard,
        });

        if (idx === 0) {
          soundEngine.playReagentAddition({
            reagentId: def.id,
            name: def.name,
            state: def.state || 'liquid',
            amount: amt,
            unit: def.unit || 'mL',
            dedupeKey: `load_recipe::${def.id}::${amt}`,
          });
        }

        const currentQty = inventory[def.id] ?? def.initialQuantity ?? 100;
        newInventoryUpdates[def.id] = Math.max(0, currentQty - amt);
      }
    }

    setIngredients(newIngredients);
    setInventory((prev) => ({ ...prev, ...newInventoryUpdates }));

    // 3. Set catalyst if scientifically justified
    if (catalystId) {
      setSelectedCatalystId(catalystId);
    } else {
      setSelectedCatalystId(null);
    }
  };

  // Remove compound from recipe
  const handleRemoveCompound = (index: number) => {
    if (index < 0 || index >= ingredients.length) return;
    const removed = ingredients[index];
    setIngredients((prev) => prev.filter((_, idx) => idx !== index));

    // Return to inventory
    setInventory((prev) => ({
      ...prev,
      [removed.id]: (prev[removed.id] ?? 0) + removed.amount,
    }));

    setHasRunReaction(false);
    setEvaluatedResult(null);
  };

  // Reorder ingredients
  const handleMoveIngredient = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= ingredients.length) return;

    setIngredients((prev) => {
      const clone = [...prev];
      const temp = clone[index];
      clone[index] = clone[newIdx];
      clone[newIdx] = temp;
      return clone;
    });
    setHasRunReaction(false);
  };

  // Adjust amount of ingredient
  const handleUpdateAmount = (index: number, delta: number) => {
    setIngredients((prev) => {
      return prev.map((item, idx) => {
        if (idx !== index) return item;
        const newAmount = Math.max(5, Math.min(100, item.amount + delta));
        return { ...item, amount: newAmount };
      });
    });
    setHasRunReaction(false);
  };

  // Reset beaker completely to empty state
  const handleResetBeaker = () => {
    soundEngine.stopSource('chemistry-lab');
    setIngredients([]);
    setSelectedCatalystId(null);
    setTemperature(25);
    setConcentration(1.0);
    setHasRunReaction(false);
    setEvaluatedResult(null);

    // Restore full inventory
    const restored: Record<string, number> = {};
    getCanonicalRegistry().forEach((r) => {
      restored[r.id] = r.initialQuantity;
    });
    setInventory(restored);
  };

  // Clean up chemistry lab loops when leaving reaction bench or unmounting
  useEffect(() => {
    if (chemMode !== 'reaction_bench') {
      soundEngine.stopSource('chemistry-lab');
    }
    return () => {
      soundEngine.stopSource('chemistry-lab');
    };
  }, [chemMode]);

  // Run reaction simulation
  const handleRunReaction = (
    overrideReactants?: Array<{ id: string; amount: number }>,
    overrideCatalystId?: string | null
  ) => {
    setIsRunningSim(true);
    setHasRunReaction(true);

    const activeIngredientsToEval =
      Array.isArray(overrideReactants) && overrideReactants.length > 0
        ? overrideReactants
        : ingredients;
    const activeCatalystToEval =
      overrideCatalystId !== undefined ? overrideCatalystId : selectedCatalystId;

    const result = evaluateReactionRecipe({
      ingredients: activeIngredientsToEval,
      conditions: {
        temperature,
        concentration,
        catalystId: activeCatalystToEval,
      },
    });

    setEvaluatedResult(result);

    // If reaction is verified, update beaker temperature accordingly
    if (result.isSupported && result.reaction) {
      const delta = result.observableEffects?.temperatureDelta || 0;
      setTemperature((prev) => Math.max(-273.15, Number((prev + delta).toFixed(1))));

      // Homogeneous silent reactions (no gas, no violent burst) play only a restrained UI completion chime, never fabricated bubbling
      if (
        !result.reaction.observableEffects?.producesGas &&
        !result.reaction.observableEffects?.isViolent
      ) {
        soundEngine.playUiFeedback('reaction_complete', `rxn_silent::${result.reaction.id}`);
      }
    } else {
      // Unsupported combination or missing prerequisite: play restrained UI warning, never a physical reaction sound
      soundEngine.stopSource('chemistry-lab');
      soundEngine.playUiFeedback('validation_warning', `rxn_unsupported::${Date.now()}`);
    }

    setTimeout(() => {
      setIsRunningSim(false);
    }, 600);
  };

  // Determine active reaction definition for 3D scene (only when user has run reaction)
  const activeReaction: ReactionDefinition | null = useMemo(() => {
    if (!hasRunReaction || !evaluatedResult || !evaluatedResult.reaction) return null;
    return evaluatedResult.reaction;
  }, [hasRunReaction, evaluatedResult]);

  // Prepare presentation export data
  const presentationData: PresentationExportOptions = useMemo(() => {
    const reaction = evaluatedResult?.reaction;
    const recipeNames = ingredients.map((i) => `${i.name} (${i.formula})`).join(' + ');

    return {
      title: reaction ? reaction.name : 'Chemical Reaction Bench Experiment',
      subtitle: `Tech-Anatomix STEM Laboratory  •  ${recipeNames || 'Empty Beaker'}`,
      category: 'chemistry',
      concept: 'Chemical Kinetics, Thermodynamics & Stoichiometry',
      slides: [
        {
          title: 'Experiment Overview & Selected Reagents',
          subtitle: 'Reactants Configuration and Laboratory Conditions',
          callout: reaction ? `Verified Reaction Type: ${reaction.reactionType.toUpperCase()}` : 'Reaction Lab Experiment',
          details: [
            { label: 'Selected Reagents', text: recipeNames || 'None selected' },
            { label: 'Solution Temperature', text: `${temperature.toFixed(1)} °C` },
            { label: 'Molar Concentration', text: `${concentration.toFixed(1)} M` },
            { label: 'Active Catalyst', text: selectedCatalystId ? REAGENTS.find((r) => r.id === selectedCatalystId)?.name || 'Catalyst active' : 'None required' },
          ],
        },
        {
          title: 'Balanced Stoichiometric Equation',
          subtitle: 'Conservation of Mass and Charge',
          callout: evaluatedResult?.balancedEquation || 'No spontaneous chemical reaction formed.',
          bullets: [
            `Stoichiometric Law: Mass and electrical charge are strictly conserved throughout the chemical exchange.`,
            `Reactants: ${reaction ? reaction.reactants.map((id) => REAGENTS.find((r) => r.id === id)?.formula).join(' + ') : 'N/A'}`,
            `Products: ${reaction ? reaction.products.join(', ') : 'N/A'}`,
          ],
        },
        {
          title: 'Observable Chemical & Physical Effects',
          subtitle: 'Empirical Laboratory Observations',
          bullets: [
            `Color Shift: Solution color transition to ${reaction?.observableEffects.colorChangeTo || 'ambient'}.`,
            `Thermal Delta: ${reaction ? `${reaction.observableEffects.temperatureDelta > 0 ? '+' : ''}${reaction.observableEffects.temperatureDelta}°C change` : '0°C (thermal equilibrium)'}.`,
            `Gas Evolution: ${reaction?.observableEffects.producesGas ? `Rapid bubbling of ${reaction.observableEffects.gasName}` : 'No gas evolved'}.`,
            `Precipitate: ${reaction?.observableEffects.producesPrecipitate ? `Dense solid precipitate forms (${reaction.observableEffects.precipitateColor})` : 'Homogeneous solution (no precipitate)'}.`,
          ],
        },
        {
          title: 'Molecular Mechanism & Collision Kinetics',
          subtitle: 'Arrhenius Collision Theory and Thermodynamic Energy Profile',
          bullets: [
            reaction?.explanation || 'Aqueous ions diffuse freely in solvent under Brownian thermal motion.',
            'Collision Theory: Reactions occur when reactant ions collide with both correct spatial orientation and kinetic energy exceeding activation energy (Ea).',
            `Elevated temperature (+${temperature}°C) shifts Maxwell-Boltzmann velocity distribution, accelerating productive collisions.`,
          ],
        },
        {
          title: 'Laboratory Safety & Handling Protocols',
          subtitle: 'School Science PPE Guidelines',
          bullets: [
            'Wear approved ANSI Z87.1 splash goggles and chemical-resistant nitrile gloves.',
            'Never taste or directly inhale reaction vapors; use wafting technique or certified fume hood.',
            'Neutralize residual acidic or basic effluents before authorized laboratory disposal.',
          ],
        },
      ],
    };
  }, [evaluatedResult, ingredients, temperature, concentration, selectedCatalystId]);

  // Explanation Data for EducationalExplanationBox
  const explanationData: ExplanationData = useMemo(() => {
    if (activeReaction) {
      return {
        title: activeReaction.name,
        badge: 'Verified Chemical Reaction',
        subtitle: `Temperature: ${temperature.toFixed(1)}°C · Concentration: ${concentration.toFixed(1)}M`,
        whatIsIt: 'A verified chemical reaction where stoichiometric amounts of aqueous reactants undergo electron or proton exchange to yield stable products.',
        howDoesItWork: activeReaction.explanation,
        realLifeExample: 'Everyday chemistry, from neutralizing antacid tablets to industrial metallurgy and combustion.',
        whyTitle: 'WHY DID THIS REACTION OCCUR?',
        whyExplanation: `Reactant particles collided with kinetic energy exceeding activation energy (Ea). ${activeReaction.observableEffects.description}. Solution temperature reached ${temperature.toFixed(1)}°C.`,
        examConnection: `Stoichiometric law: mass and charge are conserved. Net balanced equation: ${activeReaction.balancedEquation}.`,
        formula: activeReaction.balancedEquation,
      };
    }

    if (ingredients.length > 0) {
      return {
        title: 'Reagents Selected in Beaker',
        badge: 'Experiment Builder Ready',
        subtitle: `${ingredients.length} reagent${ingredients.length > 1 ? 's' : ''} currently configured`,
        whatIsIt: 'Chemical reagents configured in the reaction builder awaiting execution.',
        howDoesItWork: 'Review your ingredients, reorder or adjust quantities, then click "Done - Run Reaction" to compute the reaction kinetics.',
        realLifeExample: 'Formulating reagents in a graduated cylinder before pouring into the main reaction vessel.',
        whyTitle: 'EXPERIMENT STATUS',
        whyExplanation: 'Ingredients are loaded into the recipe. Click "Done - Run Reaction" or use the Reaction AI Assistant to simulate!',
      };
    }

    return {
      title: '3D Pyrex Reaction Bench',
      badge: 'Virtual Chemistry Laboratory',
      subtitle: '250 mL Pyrex Reaction Beaker',
      whatIsIt: 'An interactive virtual chemistry workstation for observing aqueous reactions, color shifts, effervescence, and precipitation.',
      howDoesItWork: 'Select chemical reagents from the shelf to add them one by one. Adjust temperature and concentration, then run the reaction to observe deterministic chemical kinetics.',
      realLifeExample: 'Standard laboratory bench chemistry used in high school and university chemistry curricula.',
      whyTitle: 'CURRENT WORKSTATION STATUS',
      whyExplanation: 'The reaction beaker is empty. Select reagents from the categorized library on the right to build an experiment.',
    };
  }, [activeReaction, ingredients, temperature, concentration]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 pb-4 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Tech-Anatomix Chemistry Lab
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">
                Dissect Your Cell! • Interactive 3D Chemistry & Quantum Studio
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              {chemMode === 'reaction_bench'
                ? 'Chemical Reactions Laboratory & Experiment Builder'
                : chemMode === 'molecular_explorer'
                ? '3D Molecular Structure Explorer'
                : activeChemistryBatchSpec?.title || '3D Chemistry Laboratory'}
            </h1>
          </div>

          {/* Sub-Mode Tabs: Foundations */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setChemMode('reaction_bench')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                chemMode === 'reaction_bench'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
              <span>Reaction Bench</span>
            </button>
            <button
              onClick={() => setChemMode('molecular_explorer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                chemMode === 'molecular_explorer'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Atom className="w-3.5 h-3.5 text-sky-600" />
              <span>Molecular Explorer</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: REACTION BENCH WORKSPACE */}
      {chemMode === 'reaction_bench' ? (
        <div className="space-y-6">
          {/* LEARN THROUGH PLAY · GUIDED 3D REACTION MISSIONS */}
          <ChemistryPlayMissionsBar
            selectedIngredientIds={ingredients.map((i) => i.id)}
            hasRunReaction={hasRunReaction}
            evaluatedResult={evaluatedResult}
            onLoadAndRunExperiment={(reactants, catId) => {
              const formatted = reactants.map((id) => ({ id, amount: 25 }));
              handleLoadReactionToExperiment(formatted, catId);
              handleRunReaction(formatted, catId);
            }}
            onAddSingleReagent={(reagentId) => {
              handleAddCompound(reagentId);
            }}
          />

          {/* =========================================================================
              PHASE 3 REQUIRED TWO-COLUMN RESPONSIVE WORKSPACE LAYOUT
              Left Column: 3D Beaker Viewer (~50% width on laptop/desktop)
              Right Column: Interactive Experiment Builder & Compound Library
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: COMPACT 3D BEAKER VIEWER */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <LabErrorBoundary onReset={handleResetBeaker}>
                <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-slate-800">
                  <ChemistryLabScene
                    temperature={temperature}
                    concentration={concentration}
                    catalyst={Boolean(selectedCatalystId)}
                    onUpdateConditions={(c) => {
                      if (c.temperature !== undefined) setTemperature(c.temperature);
                      if (c.concentration !== undefined) setConcentration(c.concentration);
                    }}
                    activeReaction={activeReaction}
                    reagentsInBeaker={reagentsInBeaker}
                    inventory={inventory}
                    onPourReagent={(id, amount) => handleAddCompound(id, amount)}
                    onResetBeaker={handleResetBeaker}
                    hideReagentShelf={true}
                  />
                </div>
              </LabErrorBoundary>

              {/* Beaker Status HUD Strip */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Beaker State:</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      activeReaction?.observableEffects.isViolent
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : activeReaction
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {activeReaction ? activeReaction.name : ingredients.length > 0 ? 'Reagents Mixed (Ready to Run)' : 'Beaker Empty'}
                  </span>
                </div>

                {ingredients.length > 0 && (
                  <button
                    onClick={handleResetBeaker}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Empty Beaker</span>
                  </button>
                )}
              </div>

              {/* WHAT REALLY HAPPENED — REACTION OBSERVATION & SCIENCE ANALYSIS (DIRECTLY BELOW 3D VIEWER SCREEN) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        hasRunReaction && evaluatedResult?.isSupported
                          ? 'bg-emerald-500 animate-pulse'
                          : 'bg-slate-300'
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Reaction Observation · What Really Happened</span>
                    </span>
                  </div>
                  {hasRunReaction && evaluatedResult?.isSupported && evaluatedResult.reaction && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {evaluatedResult.reaction.reactionType.replace('_', ' ').toUpperCase()}
                    </span>
                  )}
                </div>

                {hasRunReaction && evaluatedResult ? (
                  evaluatedResult.isSupported && evaluatedResult.reaction ? (
                    <div className="space-y-3 text-xs">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          {evaluatedResult.reaction.name}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {evaluatedResult.reaction.observableEffects.description}
                        </p>
                      </div>

                      {/* Empirical Observables Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        {/* Bubbles / Gas */}
                        <div
                          className={`p-2.5 rounded-xl border ${
                            evaluatedResult.reaction.observableEffects.producesGas
                              ? 'bg-sky-50/80 border-sky-300 text-sky-950'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="font-bold block text-[10px] uppercase text-slate-500 mb-0.5">
                            Gas & Effervescence:
                          </span>
                          <span className="font-semibold block leading-tight">
                            {evaluatedResult.reaction.observableEffects.producesGas
                              ? evaluatedResult.reaction.observableEffects.producesFumesAboveLiquid
                                ? `Airborne fumes & bubbling: ${evaluatedResult.reaction.observableEffects.gasName}`
                                : `Liquid-phase effervescence (rising bubbles): ${evaluatedResult.reaction.observableEffects.gasName}`
                              : 'None (No gas evolved)'}
                          </span>
                        </div>

                        {/* Precipitate */}
                        <div
                          className={`p-2.5 rounded-xl border ${
                            evaluatedResult.reaction.observableEffects.producesPrecipitate
                              ? 'bg-purple-50/80 border-purple-300 text-purple-950'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="font-bold block text-[10px] uppercase text-slate-500 mb-0.5">
                            Precipitate Solid Phase:
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {evaluatedResult.reaction.observableEffects.producesPrecipitate && (
                              <span
                                className="w-3 h-3 rounded-full border border-black/20 inline-block shrink-0"
                                style={{
                                  backgroundColor: evaluatedResult.reaction.observableEffects.precipitateColor || '#FFFFFF',
                                }}
                              />
                            )}
                            <span className="font-semibold block leading-tight">
                              {evaluatedResult.reaction.observableEffects.producesPrecipitate
                                ? evaluatedResult.reaction.observableEffects.precipitateName ||
                                  `Insoluble solid phase (${evaluatedResult.reaction.observableEffects.precipitateColor || 'White'})`
                                : 'Homogeneous (all products dissolved)'}
                            </span>
                          </div>
                        </div>

                        {/* Color */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                          <span className="font-bold block text-[10px] uppercase text-slate-500 mb-0.5">
                            Final Solution Appearance:
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`w-3 h-3 rounded-full inline-block shrink-0 ${
                                evaluatedResult.observableEffects?.isFinalSolutionColorless
                                  ? 'border-2 border-slate-300 bg-white'
                                  : 'border border-black/15'
                              }`}
                              style={
                                evaluatedResult.observableEffects?.isFinalSolutionColorless
                                  ? undefined
                                  : {
                                      backgroundColor:
                                        evaluatedResult.observableEffects?.colorChangeTo ||
                                        evaluatedResult.reaction.observableEffects.colorChangeTo ||
                                        '#F8FAFC',
                                    }
                              }
                            />
                            <span className="font-semibold truncate">
                              {evaluatedResult.observableEffects?.isFinalSolutionColorless
                                ? 'Clear, Colourless Aqueous Solution'
                                : evaluatedResult.observableEffects?.finalAppearance ||
                                  evaluatedResult.reaction.observableEffects.finalAppearance ||
                                  evaluatedResult.observableEffects?.colorChangeTo}
                            </span>
                          </div>
                        </div>

                        {/* Thermal Delta */}
                        <div
                          className={`p-2.5 rounded-xl border ${
                            evaluatedResult.reaction.observableEffects.temperatureDelta > 0
                              ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                              : evaluatedResult.reaction.observableEffects.temperatureDelta < 0
                              ? 'bg-blue-50/80 border-blue-300 text-blue-950'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="font-bold block text-[10px] uppercase text-slate-500 mb-0.5">
                            Thermal Change (ΔT):
                          </span>
                          <span className="font-semibold block leading-tight">
                            {evaluatedResult.reaction.observableEffects.temperatureDelta > 0
                              ? `+${evaluatedResult.reaction.observableEffects.temperatureDelta}°C (Exothermic)`
                              : evaluatedResult.reaction.observableEffects.temperatureDelta < 0
                              ? `${evaluatedResult.reaction.observableEffects.temperatureDelta}°C (Endothermic)`
                              : '0.0°C (Thermal Equilibrium)'}
                          </span>
                        </div>
                      </div>

                      {/* Balanced Equation */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          Balanced Stoichiometric Equation:
                        </span>
                        <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs font-bold border border-slate-800 overflow-x-auto">
                          {evaluatedResult.reaction.balancedEquation}
                        </div>
                      </div>

                      {/* Mechanism */}
                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                        <strong className="text-slate-900 block mb-0.5">Molecular Mechanism:</strong>
                        {evaluatedResult.reaction.explanation}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 text-xs text-amber-900 space-y-1">
                      <span className="font-bold block">No Spontaneous Chemical Reaction:</span>
                      <p className="leading-relaxed">{evaluatedResult.message}</p>
                    </div>
                  )
                ) : ingredients.length > 0 ? (
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 flex items-start gap-2.5">
                    <FlaskConical className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block">Reagents Loaded in Beaker</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {ingredients.length} compound{ingredients.length > 1 ? 's' : ''} configured. Click <strong className="text-slate-700">"Run Reaction in 3D Beaker"</strong> in the builder to calculate kinetics and observe what really happens!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-700 block">Empty Reaction Beaker</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Start every new experiment empty. Select compounds from the shelf or use <strong className="text-slate-600">"Discover a Reaction"</strong> to test chemical transformations.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: EXPERIMENT BUILDER & REAGENT LIBRARY */}
            <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Experiment Builder
                  </h2>
                  <p className="text-xs text-slate-500">
                    Add compounds step-by-step, adjust conditions, and run your reaction
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {ingredients.length} Reagents Selected
                  </span>
                </div>
              </div>

              {/* 1. SELECTED REAGENTS LIST (RECIPE ORDER, REMOVE & REORDER) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Selected Ingredients in Beaker ({ingredients.length})</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Order of addition matters</span>
                </div>

                {ingredients.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-400">
                    No compounds added yet. Pick a chemical from the categorized shelf below to add it!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ingredients.map((item, idx) => (
                      <div
                        key={`${item.id}-${idx}`}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs gap-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span
                            className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="truncate">
                            <span className="font-bold text-slate-900 block truncate">{item.formula}</span>
                            <span className="text-[10px] text-slate-500 truncate">{item.name}</span>
                          </div>
                        </div>

                        {/* Amount & Reorder Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 font-mono text-[11px]">
                            <button
                              onClick={() => handleUpdateAmount(idx, -5)}
                              className="px-1.5 text-slate-500 hover:text-slate-900 cursor-pointer"
                              title="Decrease amount"
                            >
                              -
                            </button>
                            <span className="font-bold text-slate-900 px-1">
                              {item.amount} {item.unit}
                            </span>
                            <button
                              onClick={() => handleUpdateAmount(idx, 5)}
                              className="px-1.5 text-slate-500 hover:text-slate-900 cursor-pointer"
                              title="Increase amount"
                            >
                              +
                            </button>
                          </div>

                          {/* Reorder Buttons */}
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => handleMoveIngredient(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded text-slate-400 hover:text-slate-900 disabled:opacity-20 cursor-pointer"
                              title="Move earlier in reaction order"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleMoveIngredient(idx, 'down')}
                              disabled={idx === ingredients.length - 1}
                              className="p-1 rounded text-slate-400 hover:text-slate-900 disabled:opacity-20 cursor-pointer"
                              title="Move later in reaction order"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveCompound(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove ingredient"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. REACTION CONDITIONS & CATALYSTS DECK */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Conditions & Catalysts (Optional Controls)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Real-time kinetics</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Temperature Control: Direct Typing with Unlimited Access + Slider up to 100°C */}
                  <div className="space-y-2 p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Thermometer className="w-4 h-4 text-rose-500" />
                        <span className="text-slate-700 font-semibold">Temperature:</span>
                        <span className="text-[10px] text-slate-400 font-mono">(Type any °C)</span>
                      </div>
                      
                      {/* Direct Typeable Input with Unlimited Temperature */}
                      <div className="flex items-center gap-1">
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            step="any"
                            value={tempInputStr}
                            onChange={(e) => handleTempType(e.target.value)}
                            onBlur={handleTempBlur}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-20 px-2 py-0.5 text-right font-mono font-bold text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-900 shadow-inner"
                            title="Type any temperature (unlimited)"
                            placeholder="25"
                          />
                          <span className="ml-1 text-xs font-semibold text-slate-600">°C</span>
                        </div>
                      </div>
                    </div>

                    {/* Slider up to 100°C with visual gauge */}
                    <div className="space-y-0.5">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={Math.min(100, Math.max(0, temperature))}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setTemperature(val);
                          setTempInputStr(val.toString());
                          setHasRunReaction(false);
                        }}
                        className="w-full accent-emerald-600 cursor-pointer"
                        title="Slide temperature from 0°C to 100°C"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>0°C</span>
                        <span>50°C</span>
                        <span>100°C</span>
                      </div>
                    </div>

                    {/* Quick Access Stepper & Preset Buttons */}
                    <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 mr-0.5">Quick:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = Math.max(-273.15, Number((temperature - 10).toFixed(1)));
                          setTemperature(next);
                          setTempInputStr(next.toString());
                          setHasRunReaction(false);
                        }}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                        title="Decrease 10°C"
                      >
                        -10°
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = Number((temperature + 10).toFixed(1));
                          setTemperature(next);
                          setTempInputStr(next.toString());
                          setHasRunReaction(false);
                        }}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                        title="Increase 10°C"
                      >
                        +10°
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = Number((temperature + 50).toFixed(1));
                          setTemperature(next);
                          setTempInputStr(next.toString());
                          setHasRunReaction(false);
                        }}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                        title="Increase 50°C"
                      >
                        +50°
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTemperature(25);
                          setTempInputStr('25');
                          setHasRunReaction(false);
                        }}
                        className={`px-1.5 py-0.5 text-[10px] rounded font-medium transition-colors ${
                          temperature === 25 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="Room Temperature (25°C)"
                      >
                        25°
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTemperature(100);
                          setTempInputStr('100');
                          setHasRunReaction(false);
                        }}
                        className={`px-1.5 py-0.5 text-[10px] rounded font-medium transition-colors ${
                          temperature === 100 ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="Boiling Point (100°C)"
                      >
                        100°
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTemperature(250);
                          setTempInputStr('250');
                          setHasRunReaction(false);
                        }}
                        className={`px-1.5 py-0.5 text-[10px] rounded font-medium transition-colors ${
                          temperature === 250 ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="Superheated (250°C)"
                      >
                        250°
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTemperature(500);
                          setTempInputStr('500');
                          setHasRunReaction(false);
                        }}
                        className={`px-1.5 py-0.5 text-[10px] rounded font-medium transition-colors ${
                          temperature === 500 ? 'bg-purple-100 text-purple-800 font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="High Thermal Energy (500°C)"
                      >
                        500°
                      </button>
                    </div>
                  </div>

                  {/* Concentration Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Concentration:</span>
                      <span className="font-mono font-bold text-slate-900">{concentration.toFixed(1)} M</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.1"
                      value={concentration}
                      onChange={(e) => {
                        setConcentration(parseFloat(e.target.value));
                        setHasRunReaction(false);
                      }}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Compatible Catalyst Selection */}
                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-medium text-slate-700 block">Heterogeneous / Homogeneous Catalyst:</span>
                    <span className="text-[11px] text-slate-400">
                      {compatibleCatalystOptions.length > 0
                        ? 'Compatible catalysts detected for active reagents'
                        : 'No catalytic pairing required for these reagents'}
                    </span>
                  </div>

                  <select
                    value={selectedCatalystId || ''}
                    onChange={(e) => {
                      setSelectedCatalystId(e.target.value ? e.target.value : null);
                      setHasRunReaction(false);
                    }}
                    disabled={compatibleCatalystOptions.length === 0}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    <option value="">None / Uncatalyzed</option>
                    {compatibleCatalystOptions.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.formula})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. PROMINENT "RUN REACTION IN 3D BEAKER" BUTTON */}
              <div className="pt-2">
                <button
                  onClick={() => handleRunReaction()}
                  disabled={ingredients.length === 0 || isRunningSim}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-950/20 ring-2 ring-emerald-400/40 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isRunningSim ? 'Computing Stoichiometry & Simulating In Beaker...' : 'Run Reaction in 3D Beaker'}</span>
                </button>
              </div>

              {/* 4. COMPREHENSIVE REACTION RESULT PANEL */}
              {hasRunReaction && evaluatedResult && (
                <div
                  className={`p-5 rounded-2xl border animate-in fade-in duration-200 text-xs space-y-3.5 shadow-xs ${
                    evaluatedResult.isSupported
                      ? evaluatedResult.reaction?.observableEffects.isViolent
                        ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                        : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50/80 border-amber-300 text-amber-950'
                  }`}
                >
                  {/* Status & Name Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-black/10">
                    <div className="flex items-center gap-2">
                      {evaluatedResult.isSupported ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 leading-tight">
                          {evaluatedResult.isSupported
                            ? evaluatedResult.reaction?.name
                            : 'Non-Reactive / Unsupported Combination'}
                        </h3>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {evaluatedResult.isSupported
                            ? `Classification: ${evaluatedResult.reaction?.reactionType.toUpperCase().replace('_', ' ')}`
                            : 'Standard Classroom Laboratory Boundary'}
                        </span>
                      </div>
                    </div>

                    {evaluatedResult.isSupported && evaluatedResult.reaction && (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {evaluatedResult.reaction.reactionType.toUpperCase().replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Balanced Chemical Equation Box */}
                  {evaluatedResult.balancedEquation && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Balanced Chemical Equation (Stoichiometrically Validated):
                      </span>
                      <div className="p-3 rounded-xl bg-white font-mono text-xs font-bold text-slate-900 border border-slate-200 shadow-2xs overflow-x-auto">
                        {evaluatedResult.balancedEquation}
                      </div>
                    </div>
                  )}

                  {/* Reactants and Products Grid */}
                  {evaluatedResult.isSupported && evaluatedResult.reaction && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200">
                        <span className="font-bold text-slate-700 block mb-1">Reactants:</span>
                        <span className="font-mono text-slate-900">
                          {evaluatedResult.reactantsList?.join(' + ') ||
                            evaluatedResult.reaction.reactants
                              .map((id) => getReagentDisplayInfo(id).formula || id)
                              .join(' + ')}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200">
                        <span className="font-bold text-slate-700 block mb-1">Products Formed:</span>
                        <span className="font-mono text-slate-900">
                          {evaluatedResult.reaction.products.join(', ')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Observable Effects Grid (Precipitate, Gas, Color, Temperature) */}
                  {evaluatedResult.observableEffects && (
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Expected Observable Visual Effects (Rendered in 3D Beaker):
                      </span>
                      {(evaluatedResult.observableEffects.initialAppearance ||
                        evaluatedResult.observableEffects.finalAppearance) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                            <span className="text-sky-700 font-bold block text-[10px] uppercase">
                              Initial Appearance (Unmixed Reactants):
                            </span>
                            <span className="text-slate-800 font-medium">
                              {evaluatedResult.observableEffects.initialAppearance}
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                            <span className="text-emerald-700 font-bold block text-[10px] uppercase">
                              Final Appearance (Products):
                            </span>
                            <span className="text-slate-800 font-medium">
                              {evaluatedResult.observableEffects.finalAppearance}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">Precipitate Phase:</span>
                          <span className="font-bold text-slate-800">
                            {evaluatedResult.observableEffects.producesPrecipitate
                              ? evaluatedResult.observableEffects.precipitateName ||
                                `Solid Forms (${evaluatedResult.observableEffects.precipitateColor || 'White'})`
                              : 'None (Homogeneous)'}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">Gas / Effervescence:</span>
                          <span className="font-bold text-slate-800">
                            {evaluatedResult.observableEffects.producesGas
                              ? `${evaluatedResult.observableEffects.gasName || 'Bubbling Gas'} (${
                                  evaluatedResult.observableEffects.producesFumesAboveLiquid
                                    ? 'Airborne Fumes'
                                    : 'Liquid Bubbles'
                                })`
                              : 'No Gas Evolved'}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">Thermal Delta:</span>
                          <span className="font-bold text-slate-800">
                            {evaluatedResult.observableEffects.temperatureDelta > 0 ? '+' : ''}
                            {evaluatedResult.observableEffects.temperatureDelta}°C
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">Final Solution:</span>
                          <span className="font-bold text-slate-800 truncate block">
                            {evaluatedResult.observableEffects.isFinalSolutionColorless
                              ? 'Colourless (aq)'
                              : evaluatedResult.observableEffects.finalAppearance ||
                                evaluatedResult.observableEffects.colorChangeTo}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Concise Scientific Explanation */}
                  <div className="p-3 rounded-xl bg-white/70 border border-slate-200 text-[11px] leading-relaxed text-slate-700">
                    <span className="font-bold text-slate-900 block mb-0.5">Scientific Mechanism:</span>
                    <p>{evaluatedResult.explanation || evaluatedResult.reaction?.explanation || evaluatedResult.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block italic">
                      Educational Visualization Notice: 3D particle settling, effervescent bubbles, and color transitions are synchronized representations of this stoichiometric result.
                    </span>
                  </div>
                </div>
              )}

              {/* 5. CATEGORIZED REAGENT LIBRARY SHELF */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reagent Library Shelf (Click to Add)</span>
                  </span>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search compound name/formula..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-56"
                    />
                  </div>
                </div>

                {/* Filter Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {[
                    { id: 'all', label: 'All Compounds' },
                    { id: 'acid', label: 'Acids' },
                    { id: 'base', label: 'Bases' },
                    { id: 'salt', label: 'Salts & Solutions' },
                    { id: 'metal', label: 'Metals' },
                    { id: 'oxidizer', label: 'Oxidizers' },
                    { id: 'indicator', label: 'Indicators' },
                    { id: 'catalyst', label: 'Catalysts' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        activeCategory === cat.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Reagent Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[250px] overflow-y-auto p-1">
                  {filteredReagents.map((r) => {
                    const countInRecipe = ingredients.filter((i) => i.id === r.id).length;
                    const isCatalystView =
                      activeCategory === 'catalyst' ||
                      r.category === 'catalyst' ||
                      r.type === 'catalyst';
                    return (
                      <button
                        key={r.id}
                        onClick={() => handleAddCompound(r.id)}
                        title={
                          r.isRestricted
                            ? `RESTRICTED (${r.name}): ${r.restrictionReason || r.description}`
                            : r.catalyticRole
                            ? `${r.name} (${r.formula}) — ${r.catalyticRole}${
                                r.exampleReactions?.length ? ` | Example: ${r.exampleReactions[0]}` : ''
                              }`
                            : `${r.name} (${r.formula}) — ${r.description}`
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          r.isRestricted
                            ? 'border-amber-200 bg-amber-50/40 hover:border-amber-300'
                            : countInRecipe > 0
                            ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1 gap-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: r.color }}
                            />
                            <span className="text-[9px] uppercase font-bold text-slate-400 font-mono truncate">
                              {r.subcategory || r.role || r.type}
                            </span>
                          </div>
                          <div className="font-bold text-xs text-slate-900 leading-tight truncate">
                            {r.formula}
                          </div>
                          <div className="text-[10px] text-slate-600 font-medium truncate mt-0.5">
                            {r.name}
                          </div>
                          {(isCatalystView || r.id === 'water') && (
                            <div className="mt-1 text-[9px] text-slate-500 line-clamp-1 leading-snug">
                              {r.catalyticRole || r.description}
                            </div>
                          )}
                          {isCatalystView && r.exampleReactions?.[0] && (
                            <div className="mt-0.5 text-[8px] font-mono text-slate-600 bg-slate-100 px-1 py-0.5 rounded truncate">
                              {r.exampleReactions[0]}
                            </div>
                          )}
                          {r.indicatorTransition && (
                            <div className="mt-1 text-[8px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-1 py-0.5 rounded truncate">
                              {r.indicatorTransition.transitionRange}: {r.indicatorTransition.acidColor} → {r.indicatorTransition.baseColor}
                            </div>
                          )}
                          {r.isRestricted ? (
                            <div className="mt-1 text-[8px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded truncate">
                              {r.safetyClassification === 'radioactive_restricted'
                                ? '☢ Radioactive · Reference Only'
                                : '⚠ Restricted · Reference Only'}
                            </div>
                          ) : (
                            <div className="mt-1 flex items-center gap-1 flex-wrap">
                              {r.visualLabStatus && (
                                <span
                                  className={`text-[8px] font-bold px-1 py-0.2 rounded truncate ${
                                    r.visualLabStatus === 'Reaction-supported'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : r.visualLabStatus === 'Visualized'
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : 'bg-sky-50 text-sky-700 border border-sky-200'
                                  }`}
                                >
                                  {r.visualLabStatus}
                                </span>
                              )}
                              {r.hazard && (
                                <span className="text-[8px] font-bold text-rose-700 bg-rose-50 px-1 py-0.2 rounded truncate">
                                  {r.hazard}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div
                          className={`mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold ${
                            r.isRestricted ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          <span>
                            {r.isRestricted
                              ? 'Safety Info'
                              : countInRecipe > 0
                              ? `In Beaker (${countInRecipe})`
                              : '+ Add'}
                          </span>
                          {r.isRestricted ? (
                            <Info className="w-3 h-3" />
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. AI-ASSISTED COMPOUND ADDITION (DIRECTLY BELOW REAGENT LIBRARY SHELF) */}
              <div className="pt-2 border-t border-slate-100">
                <AiCompoundAddPanel
                  onAddCompound={handleAddCompound}
                  selectedIngredientIds={ingredients.map((i) => i.id)}
                />
              </div>
            </div>
          </div>

          {/* =========================================================================
              PHASE 4: UNIFIED AI CHEMISTRY & REACTION ASSISTANT
              Consolidates Educational Q&A, Reaction Discovery, and Direct Beaker Loading
              ========================================================================= */}
          <ReactionAiChatbot
            selectedIngredients={ingredients}
            conditions={{
              temperature,
              concentration,
              catalystId: selectedCatalystId,
            }}
            activeReactionResult={evaluatedResult}
            onAddCompound={(reagentId) => handleAddCompound(reagentId)}
            onLoadReactionToExperiment={(reactants, catalystId) =>
              handleLoadReactionToExperiment(reactants, catalystId)
            }
            onRunReaction={(overrideReactants, overrideCatalystId) =>
              handleRunReaction(overrideReactants, overrideCatalystId)
            }
          />

          {/* Educational Explanation Box */}
          <div className="pt-2">
            <EducationalExplanationBox data={explanationData} />
          </div>
        </div>
      ) : chemMode === 'molecular_explorer' ? (
        /* MODE 2: MOLECULAR EXPLORER */
        <LabErrorBoundary>
          <MolecularScene
            selectedMoleculeId={selectedMoleculeId}
            onSelectMolecule={setSelectedMoleculeId}
            onTryIt={() => {
              const el = document.getElementById('molecule-controls-panel');
              if (el) {
                el.classList.add('ring-2', 'ring-sky-500');
                setTimeout(() => el.classList.remove('ring-2', 'ring-sky-500'), 1500);
              }
            }}
          />
        </LabErrorBoundary>
      ) : activeChemistryBatchSpec ? (
        /* MODE 3: CHEMISTRY BATCH 1 LABORATORIES (MODELS 69–75) */
        <div className="space-y-6">
          <Dynamic3DModelRenderer
            modelSpec={activeChemistryBatchSpec}
            parameters={batchParams}
            conditions={batchConds}
            onUpdateParameter={(id, val) => setBatchParams((prev) => ({ ...prev, [id]: val }))}
            onUpdateCondition={(id, val) => setBatchConds((prev) => ({ ...prev, [id]: val }))}
          />
          {chemistryBatchChatContext && (
            <div className="pt-4 border-t border-slate-200">
              <ModelAwareChatbot context={chemistryBatchChatContext} />
            </div>
          )}
        </div>
      ) : null}

      {/* Presentation Export Modal */}
      <PresentationExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        data={presentationData}
        defaultFilename={evaluatedResult?.reaction ? evaluatedResult.reaction.name : 'Chemistry_Reaction_Lab'}
      />
    </div>
  );
};
