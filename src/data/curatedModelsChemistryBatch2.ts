import { ScientificModelSpec } from '../types/aiModel';

/**
 * TECH-ANATOMIX: DISSECT YOUR CELL! — CHEMISTRY MODEL DEVELOPMENT BATCH 2 (MODELS 76–82)
 *
 * Final Registry IDs (verified unique across all 83 existing models):
 * 76. Chemical Kinetics Simulator ('chemical-kinetics-simulator')
 * 77. Chemical Equilibrium Explorer ('chemical-equilibrium-explorer')
 * 78. Reaction Energy Profile Explorer ('reaction-energy-profile-explorer')
 * 79. Catalysis Explorer ('catalysis-explorer')
 * 80. Acid–Base Titration Laboratory ('acid-base-titration-laboratory')
 * 81. Solubility and Precipitation Explorer ('solubility-precipitation-explorer')
 * 82. Buffer Solution Simulator ('buffer-solution-simulator')
 */
export const CHEMISTRY_BATCH_2_MODELS: Record<string, ScientificModelSpec> = {
  // =========================================================================
  // 76. CHEMICAL KINETICS SIMULATOR
  // =========================================================================
  chemicalKineticsSimulator: {
    id: 'chemical-kinetics-simulator',
    title: 'Chemical Kinetics Simulator',
    concept: 'Reaction Rate Laws, Reaction Order (1st vs 2nd), Half-Life & Arrhenius Temperature Dependence',
    description:
      'Interactive 3D chemical kinetics laboratory connecting a bounded reaction vessel of colliding reactant and product particles with macroscopic integrated rate laws ([A]_t), half-life calculations (t₁/₂), and Arrhenius rate constants k = A·e^(−Ea/RT).',
    whatIsIt:
      'A quantitative 3D chemical kinetics laboratory that bridges microscopic molecular collision events with macroscopic concentration-versus-time curves and rate-law equations.',
    howDoesItWork:
      'In a general rate law r = k[A]^m[B]^n, the exponents m and n are reaction orders determined experimentally by the kinetic mechanism, not necessarily the stoichiometric coefficients of the balanced equation. For a first-order reaction (r = k[A]¹, units of k: s⁻¹), concentration decays exponentially as [A]_t = [A]₀e^(−kt) with a concentration-independent half-life t₁/₂ = ln(2)/k. For a single-reactant second-order reaction (r = k[A]², units of k: L·mol⁻¹·s⁻¹), 1/[A]_t = 1/[A]₀ + kt and half-life t₁/₂ = 1/(k[A]₀) increases as reactant is consumed. Raising absolute temperature T increases the rate constant exponentially via the Arrhenius equation k = A·e^(−Ea/(RT)), while adding a catalyst provides a lower-Ea pathway. Crucially, the macroscopic concentration curves are calculated directly from the differential/integrated rate equations, whereas the 3D vessel particles serve as a simplified educational illustration.',
    realLifeExample:
      'Pharmacokinetics of first-order drug clearance in the bloodstream, catalytic decomposition of N₂O₅, and thermal control of industrial polymerization reactors.',
    examConnection:
      'First-order: [A]_t = [A]₀e^(−kt), t₁/₂ = ln(2)/k (units of k: s⁻¹). Second-order: 1/[A]_t = 1/[A]₀ + kt, t₁/₂ = 1/(k[A]₀) (units of k: M⁻¹s⁻¹). Arrhenius equation: k = A·e^(−Ea/(RT)) where R = 8.314 J·mol⁻¹·K⁻¹ and T is in Kelvin.',
    scaleNote:
      'Microscopic vs Macroscopic Distinction: The 3D colliding spheres illustrate reactive collision frequency and conversion, whereas the concentration-time and rate graphs plot the exact analytical integrated rate laws.',
    simulationModel: 'predictive',
    functionalType: 'chemical-kinetics-simulator',
    prompt:
      'Create a 3D Chemical Kinetics Simulator with a bounded reaction vessel, reactant and product particles, collision flashes, concentration-time graph, and first-order and second-order rate calculations',
    camera: {
      position: [0, 3.0, 10.8],
      target: [0, 0.3, 0],
    },
    parameters: {
      initialConcentrationM: {
        id: 'initialConcentrationM',
        name: 'Initial Concentration ([A]₀)',
        min: 0.2,
        max: 2.0,
        step: 0.1,
        defaultValue: 1.0,
        unit: 'M',
        description:
          'Sets starting molar concentration [A]₀ (mol/L), updating initial reaction rate r₀ and particle population density.',
        affects: 'custom',
      },
      temperatureC: {
        id: 'temperatureC',
        name: 'Reaction Temperature (T)',
        min: 5,
        max: 95,
        step: 5,
        defaultValue: 25,
        unit: '°C',
        description:
          'Adjusts reaction temperature, recalculating the Arrhenius rate constant k = A·e^(−Ea/RT) and thermal particle speed.',
        affects: 'custom',
      },
      elapsedScientificTimeSec: {
        id: 'elapsedScientificTimeSec',
        name: 'Scientific Reaction Time (t)',
        min: 0,
        max: 100,
        step: 2,
        defaultValue: 20,
        unit: 's',
        description:
          'Inspects macroscopic concentrations [A]_t, [P]_t, and instantaneous rate r(t) at scientific reaction time t.',
        affects: 'custom',
      },
      simulationSpeedMultiplier: {
        id: 'simulationSpeedMultiplier',
        name: 'Simulation Playback Speed',
        min: 0.5,
        max: 2.5,
        step: 0.25,
        defaultValue: 1.0,
        unit: '×',
        description:
          'Controls visual animation playback speed without distorting the scientific time axis of the kinetic equations.',
        affects: 'animationSpeed',
      },
    },
    conditions: {
      reactionModel: {
        id: 'reactionModel',
        name: 'Reaction Selector (Kinetic Model)',
        type: 'select',
        defaultValue: 'first_order_decomp',
        options: [
          { value: 'first_order_decomp', label: 'First-Order Reaction: A → P  (r = k[A]¹, t₁/₂ = ln2/k)' },
          { value: 'second_order_dimer', label: 'Second-Order Reaction: 2A → P  (r = k[A]², 1/[A]_t = 1/[A]₀ + kt)' },
          { value: 'reversible_first_order', label: 'Reversible First-Order: A ⇌ P  (r_net = k_f[A] − k_r[P])' },
        ],
        description: 'Switches between experimentally defined first-order, second-order, and reversible kinetic rate laws.',
      },
      catalystActive: {
        id: 'catalystActive',
        name: 'Catalyst Toggle (Lower E_a Pathway)',
        type: 'boolean',
        defaultValue: false,
        description: 'Compares the uncatalysed pathway against a catalysed pathway with lower activation energy E_a.',
      },
      showGraphs: {
        id: 'showGraphs',
        name: 'Graph Visibility ([A]_t & Rate Curves)',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides the 3D Concentration-Time Graph and Rate Constant / Half-Life readout boards.',
      },
    },
    parts: [
      {
        id: 'reaction_vessel',
        name: 'Reaction Vessel',
        label: 'Reaction Vessel',
        shape: 'cylinder',
        dimensions: [1.9, 3.2, 1.9],
        position: [-2.1, 0.1, 0],
        color: '#94A3B8',
        material: 'glass',
        opacity: 0.32,
        description:
          'Bounded borosilicate glass reactor chamber maintaining constant volume for the reacting particle population.',
        whatIsIt: 'Thermostatted constant-volume reaction vessel.',
        whatDoesItDo:
          'Confines reactant and product molecules within a fixed volume so collision frequency scales with concentration and temperature.',
      },
      {
        id: 'reactant_particles',
        name: 'Reactant Particles',
        label: 'Reactant Particles',
        shape: 'sphere',
        dimensions: [0.42, 0.42, 0.42],
        position: [-2.5, 0.4, 0.3],
        color: '#38BDF8',
        material: 'glow',
        description:
          'Cyan reactant species (A) undergoing thermal motion and reactive collisions inside the vessel.',
        whatIsIt: 'Microscopic representation of reactant species A.',
        whatDoesItDo:
          'Decreases in population fraction as scientific time t progresses according to the active integrated rate law.',
      },
      {
        id: 'product_particles',
        name: 'Product Particles',
        label: 'Product Particles',
        shape: 'sphere',
        dimensions: [0.42, 0.42, 0.42],
        position: [-1.6, -0.2, -0.2],
        color: '#10B981',
        material: 'glow',
        description:
          'Emerald product species (P) formed whenever reactant collisions exceed the activation energy barrier E_a.',
        whatIsIt: 'Microscopic representation of product species P.',
        whatDoesItDo:
          'Accumulates as reactant A is converted, with glowing collision indicators marking successful reaction events.',
      },
      {
        id: 'reaction_progress_indicator',
        name: 'Reaction Progress Indicator',
        label: 'Reaction Progress Indicator',
        shape: 'box',
        dimensions: [3.2, 0.35, 0.35],
        position: [-2.1, -1.85, 0],
        color: '#F59E0B',
        material: 'metal',
        description:
          'Dynamic conversion progress bar and successful-collision pulse ring indicating fractional reactant conversion.',
        whatIsIt: 'Real-time reaction extent and conversion meter.',
        whatDoesItDo:
          'Displays percentage conversion ([A]₀ − [A]_t)/[A]₀ and marks the half-life milestone t₁/₂.',
      },
      {
        id: 'concentration_time_graph',
        name: 'Concentration-Time Graph',
        label: 'Concentration-Time Graph',
        shape: 'box',
        dimensions: [3.8, 2.5, 0.12],
        position: [2.2, 0.65, -0.3],
        color: '#0F172A',
        material: 'standard',
        description:
          'Live macroscopic plot of [A]_t and [P]_t versus scientific time t alongside instantaneous rate r(t).',
        whatIsIt: 'Analytical Concentration-versus-Time and Rate curve display.',
        whatDoesItDo:
          'Plots exact first-order exponential decay, second-order hyperbolic decay, or reversible relaxation curves.',
      },
      {
        id: 'rate_constant_display',
        name: 'Rate Constant Display',
        label: 'Rate Constant Display',
        shape: 'box',
        dimensions: [3.8, 1.2, 0.12],
        position: [2.2, -1.35, -0.3],
        color: '#1E293B',
        material: 'standard',
        description:
          'Arrhenius telemetry board displaying rate constant k (with order-specific units), activation energy E_a, and half-life t₁/₂.',
        whatIsIt: 'Quantitative Arrhenius and Half-Life telemetry board.',
        whatDoesItDo:
          'Updates k = A·e^(−Ea/RT) and t₁/₂ immediately when temperature, initial concentration, reaction order, or catalyst state changes.',
      },
    ],
    equations: [
      'r = k[A]^m[B]^n, \\quad k = A e^{-E_a / (RT)}',
      '\\text{First Order: } [A]_t = [A]_0 e^{-kt}, \\quad t_{1/2} = \\frac{\\ln 2}{k}',
      '\\text{Second Order: } \\frac{1}{[A]_t} = \\frac{1}{[A]_0} + kt, \\quad t_{1/2} = \\frac{1}{k[A]_0}',
    ],
    curiosityPrompts: [
      'Why cannot reaction orders m and n be inferred directly from stoichiometric coefficients in non-elementary reactions?',
      'Why is the half-life of a first-order reaction independent of initial concentration while a second-order half-life depends on [A]₀?',
      'How does a small decrease in activation energy E_a cause an exponential increase in the rate constant k?',
    ],
  },

  // =========================================================================
  // 77. CHEMICAL EQUILIBRIUM EXPLORER
  // =========================================================================
  chemicalEquilibriumExplorer: {
    id: 'chemical-equilibrium-explorer',
    title: 'Chemical Equilibrium Explorer',
    concept: "Dynamic Equilibrium (r_fwd = r_rev), Reaction Quotient Q vs K_c/K_p & Le Chatelier's Principle",
    description:
      'Interactive 3D reversible-reaction laboratory demonstrating dynamic chemical equilibrium, equal forward and reverse reaction rates, Q versus K_c comparisons, and Le Chatelier responses to concentration, volume/pressure, and temperature disturbances.',
    whatIsIt:
      'An interactive 3D gas-phase equilibrium reactor that visualizes simultaneous forward and reverse reaction events alongside exact mass-balance equilibrium calculations.',
    howDoesItWork:
      'For a reversible reaction aA + bB ⇌ cC + dD, chemical equilibrium is dynamic: both forward and reverse reactions continue indefinitely at equal rates (r_fwd = r_rev > 0), keeping macroscopic concentrations constant (which need NOT be equal). The reaction quotient Q_c = [C]^c[D]^d / ([A]^a[B]^b) measures the current state relative to the equilibrium constant K_c. When Q_c < K_c, the net forward direction is favoured; when Q_c > K_c, the net reverse direction is favoured; when Q_c = K_c, the system is at dynamic equilibrium. Compressing volume increases partial pressures and shifts equilibrium toward the side with fewer moles of gas (only when Δn_gas ≠ 0). Changing temperature alters K_c itself according to the reaction enthalpy ΔH° (van \'t Hoff equation), whereas adding a catalyst accelerates both r_fwd and r_rev equally without shifting K_c.',
    realLifeExample:
      'Industrial Haber–Bosch synthesis of ammonia (N₂ + 3H₂ ⇌ 2NH₃) at high pressure and moderate temperature, and atmospheric NO₂/N₂O₄ smog equilibria.',
    examConnection:
      'K_c = [C]^c[D]^d / ([A]^a[B]^b) (excluding pure solids/liquids); K_p = K_c(RT)^(Δn_gas). Q < K → forward shift; Q > K → reverse shift; Q = K → dynamic equilibrium (r_fwd = r_rev). Catalyst speeds up attainment of equilibrium without changing K.',
    scaleNote:
      'Illustrative Particle Counts vs Molarity: Vessel molecules represent relative species proportions and bidirectional exchange events, while displayed molarities (M) come from an exact mass-balance solver.',
    simulationModel: 'predictive',
    functionalType: 'chemical-equilibrium-explorer',
    prompt:
      'Create a 3D Chemical Equilibrium Explorer showing a reversible reaction vessel with forward and reverse motion indicators, piston volume control, Q vs Kc comparison, and Le Chatelier disturbances',
    camera: {
      position: [0, 3.1, 10.8],
      target: [0, 0.3, 0],
    },
    parameters: {
      initialReactantAM: {
        id: 'initialReactantAM',
        name: 'Initial Reactant [A]₀',
        min: 0.1,
        max: 1.8,
        step: 0.1,
        defaultValue: 0.8,
        unit: 'M',
        description: 'Sets initial concentration of Reactant A before relaxation to equilibrium.',
        affects: 'custom',
      },
      initialProductCM: {
        id: 'initialProductCM',
        name: 'Initial Product [C]₀',
        min: 0.0,
        max: 1.8,
        step: 0.1,
        defaultValue: 0.2,
        unit: 'M',
        description: 'Sets initial concentration of Product C to test Q_c < K_c or Q_c > K_c starting states.',
        affects: 'custom',
      },
      temperatureC: {
        id: 'temperatureC',
        name: 'System Temperature (T)',
        min: 0,
        max: 180,
        step: 10,
        defaultValue: 25,
        unit: '°C',
        description:
          "Adjusts temperature T, updating K_c(T) and K_p(T) via the van 't Hoff relation using the reaction's ΔH°.",
        affects: 'custom',
      },
      vesselVolumeL: {
        id: 'vesselVolumeL',
        name: 'Reactor Volume (V)',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        defaultValue: 1.0,
        unit: 'L',
        description:
          'Compresses or expands the gas-phase reactor piston, scaling concentrations and testing Δn_gas pressure shifts.',
        affects: 'custom',
      },
    },
    conditions: {
      reactionPreset: {
        id: 'reactionPreset',
        name: 'Reversible Reaction Selector',
        type: 'select',
        defaultValue: 'n2o4_no2_gas',
        options: [
          { value: 'n2o4_no2_gas', label: 'N₂O₄(g) ⇌ 2NO₂(g)  (Endothermic ΔH° = +57.2 kJ/mol, Δn_g = +1)' },
          { value: 'h2_i2_hi_gas', label: 'H₂(g) + I₂(g) ⇌ 2HI(g)  (Exothermic ΔH° = −9.4 kJ/mol, Δn_g = 0)' },
          { value: 'haber_n2_h2_nh3', label: 'N₂(g) + 3H₂(g) ⇌ 2NH₃(g)  (Exothermic ΔH° = −92.2 kJ/mol, Δn_g = −2)' },
        ],
        description: 'Selects the gas-phase reversible reaction with its stoichiometry and enthalpy ΔH°.',
      },
      disturbanceMode: {
        id: 'disturbanceMode',
        name: "Le Chatelier Disturbance Control",
        type: 'select',
        defaultValue: 'none',
        options: [
          { value: 'none', label: 'No Disturbance (Baseline Composition)' },
          { value: 'add_reactant', label: 'Add Reactant (+[A] Injection ➔ Q_c < K_c Forward Shift)' },
          { value: 'remove_reactant', label: 'Remove Reactant (−[A] Extraction ➔ Q_c > K_c Reverse Shift)' },
          { value: 'add_product', label: 'Add Product (+[C] Injection ➔ Q_c > K_c Reverse Shift)' },
          { value: 'compress_volume', label: 'Compress Volume / Increase Pressure (Shifts if Δn_g ≠ 0)' },
          { value: 'expand_volume', label: 'Expand Volume / Decrease Pressure (Shifts if Δn_g ≠ 0)' },
        ],
        description: "Applies a controlled Le Chatelier perturbation to observe the Q_c vs K_c response.",
      },
      catalystPresent: {
        id: 'catalystPresent',
        name: 'Catalyst Present (Faster Relaxation, Same K_c)',
        type: 'boolean',
        defaultValue: false,
        description: 'Demonstrates that a catalyst speeds up forward and reverse rates equally without shifting K_c.',
      },
      showEquilibriumGraph: {
        id: 'showEquilibriumGraph',
        name: 'Graph Toggle (Concentration vs Time)',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides the concentration relaxation curves and Q_c vs K_c comparison board.',
      },
    },
    parts: [
      {
        id: 'equilibrium_reactor_cylinder',
        name: 'Equilibrium Reaction Vessel',
        label: 'Equilibrium Reaction Vessel',
        shape: 'cylinder',
        dimensions: [1.9, 3.2, 1.9],
        position: [-2.1, 0.0, 0],
        color: '#94A3B8',
        material: 'glass',
        opacity: 0.32,
        description:
          'Variable-volume transparent gas reactor housing the reversible reaction mixture and movable compression piston.',
        whatIsIt: 'Sealed gas-phase chemical equilibrium chamber with movable top piston.',
        whatDoesItDo:
          'Maintains a closed mass-balance system where volume/pressure, temperature, and composition disturbances can be tested.',
      },
      {
        id: 'reactant_species_cloud',
        name: 'Reactant Species',
        label: 'Reactant Species',
        shape: 'sphere',
        dimensions: [0.42, 0.42, 0.42],
        position: [-2.6, -0.1, 0.3],
        color: '#38BDF8',
        material: 'glow',
        description:
          'Reactant gas molecules (N₂O₄, H₂ + I₂, or N₂ + 3H₂) participating in forward reaction events.',
        whatIsIt: 'Left-hand side reactant species of the reversible chemical equation.',
        whatDoesItDo:
          'Reacts in the forward direction at rate r_fwd while simultaneously being regenerated by the reverse reaction at rate r_rev.',
      },
      {
        id: 'product_species_cloud',
        name: 'Product Species',
        label: 'Product Species',
        shape: 'sphere',
        dimensions: [0.42, 0.42, 0.42],
        position: [-1.6, 0.2, -0.3],
        color: '#F59E0B',
        material: 'glow',
        description:
          'Product gas molecules (2NO₂, 2HI, or 2NH₃) participating in reverse reaction events.',
        whatIsIt: 'Right-hand side product species of the reversible chemical equation.',
        whatDoesItDo:
          'Coexists with reactants at equilibrium in the exact stoichiometric ratio required to satisfy Q_c = K_c.',
      },
      {
        id: 'forward_reaction_indicator',
        name: 'Forward Reaction Indicator',
        label: 'Forward Reaction Indicator',
        shape: 'cylinder',
        dimensions: [0.1, 1.8, 0.1],
        position: [-2.1, 0.55, 1.15],
        rotation: [0, 0, -Math.PI / 2],
        color: '#10B981',
        material: 'glow',
        description:
          'Upper emerald directional stream representing forward elementary conversion (Reactants ⇀ Products).',
        whatIsIt: 'Forward reaction rate vector (r_fwd).',
        whatDoesItDo:
          'Pulses continuously even after equilibrium is reached, proving that dynamic equilibrium has non-zero forward rate.',
      },
      {
        id: 'reverse_reaction_indicator',
        name: 'Reverse Reaction Indicator',
        label: 'Reverse Reaction Indicator',
        shape: 'cylinder',
        dimensions: [0.1, 1.8, 0.1],
        position: [-2.1, -0.45, 1.15],
        rotation: [0, 0, Math.PI / 2],
        color: '#F43F5E',
        material: 'glow',
        description:
          'Lower rose directional stream representing reverse elementary conversion (Products ↽ Reactants).',
        whatIsIt: 'Reverse reaction rate vector (r_rev).',
        whatDoesItDo:
          'Matches the forward rate (r_rev = r_fwd) at dynamic equilibrium so net macroscopic change is zero.',
      },
      {
        id: 'q_vs_k_equilibrium_display',
        name: 'Q vs K Equilibrium Display',
        label: 'Q vs K Equilibrium Display',
        shape: 'box',
        dimensions: [3.8, 2.7, 0.12],
        position: [2.2, 0.35, -0.3],
        color: '#0F172A',
        material: 'standard',
        description:
          '3D analytical display plotting concentration relaxation curves, Q_c vs K_c balance, K_p conversion, and Le Chatelier shift direction.',
        whatIsIt: 'Live Reaction Quotient (Q_c), Equilibrium Constant (K_c, K_p) and Relaxation Graph.',
        whatDoesItDo:
          'Compares Q_c against K_c to show whether the forward or reverse direction is thermodynamically favoured.',
      },
    ],
    equations: [
      'aA + bB \\rightleftharpoons cC + dD, \\quad K_c = \\frac{[C]^c[D]^d}{[A]^a[B]^b}',
      'Q_c = \\frac{[C]_0^c[D]_0^d}{[A]_0^a[B]_0^b}, \\quad K_p = K_c (RT)^{\\Delta n_{\\text{gas}}}',
      '\\text{At Dynamic Equilibrium: } r_{\\text{forward}} = r_{\\text{reverse}} > 0 \\text{ and } Q_c = K_c',
    ],
    curiosityPrompts: [
      'Why does dynamic equilibrium mean equal forward and reverse reaction rates rather than equal reactant and product concentrations?',
      'Why does compressing the volume shift N₂ + 3H₂ ⇌ 2NH₃ toward products but leaves H₂ + I₂ ⇌ 2HI unchanged?',
      'Why does adding a catalyst speed up relaxation to equilibrium without changing K_c?',
    ],
  },

  // =========================================================================
  // 78. REACTION ENERGY PROFILE EXPLORER
  // =========================================================================
  reactionEnergyProfileExplorer: {
    id: 'reaction-energy-profile-explorer',
    title: 'Reaction Energy Profile Explorer',
    concept: 'Potential Energy Surfaces, Activation Energy (E_a), Transition States [‡] & Reaction Enthalpy (ΔH)',
    description:
      'Interactive 3D reaction-coordinate laboratory displaying reactant and product valleys, activated-complex transition states [‡], forward and reverse activation barriers (E_a,fwd, E_a,rev), reaction enthalpy (ΔH), and conceptual bond rearrangement along the pathway.',
    whatIsIt:
      'A 3D potential-energy-profile explorer that maps how molecular potential energy / enthalpy changes along a reaction coordinate ξ from reactants through transition states to products.',
    howDoesItWork:
      'As reactants transform into products along the minimum-energy reaction coordinate (ξ: 0 → 1), existing bonds stretch and new bonds begin to form, raising potential energy to a maximum called the Transition State or Activated Complex [‡]. The energy required to ascend from reactants to the highest transition state is the Forward Activation Energy (E_a,fwd = H_TS − H_reactants), while the barrier from products back to the transition state is the Reverse Activation Energy (E_a,rev = H_TS − H_products). The overall Reaction Enthalpy is ΔH = H_products − H_reactants = E_a,fwd − E_a,rev. When ΔH < 0, the reaction is exothermic; when ΔH > 0, it is endothermic. Multistep reactions pass through two or more transition states separated by a local energy minimum representing a short-lived Reaction Intermediate [I].',
    realLifeExample:
      'Bimolecular nucleophilic substitution (S_N2) passing through a single pentacoordinate transition state, versus two-step S_N1 reactions passing through a carbocation intermediate.',
    examConnection:
      'ΔH = H_products − H_reactants = E_a(forward) − E_a(reverse). Exothermic: ΔH < 0 (H_products < H_reactants). Endothermic: ΔH > 0 (H_products > H_reactants). In a multistep profile, peaks are Transition States [‡] and valleys between peaks are Intermediates.',
    scaleNote:
      'Conceptual Coordinate Note: The reaction coordinate ξ represents structural bond progression along the minimum-energy pathway (not elapsed clock time), and displayed kJ/mol values are illustrative educational enthalpies.',
    simulationModel: 'predictive',
    functionalType: 'reaction-energy-profile-explorer',
    prompt:
      'Create a 3D Reaction Energy Profile Explorer with reactant region, product region, transition-state indicator, forward and reverse activation energy markers, reaction enthalpy marker, and animated molecular pathway',
    camera: {
      position: [0, 3.0, 11.2],
      target: [0, 0.4, 0],
    },
    parameters: {
      forwardActivationEnergyKjMol: {
        id: 'forwardActivationEnergyKjMol',
        name: 'Forward Activation Barrier (E_a,fwd)',
        min: 20,
        max: 100,
        step: 5,
        defaultValue: 55,
        unit: 'kJ/mol',
        description:
          'Adjusts the forward activation energy barrier above the reactant state, updating H_TS and E_a,rev.',
        affects: 'custom',
      },
      reactantEnergyKjMol: {
        id: 'reactantEnergyKjMol',
        name: 'Reactant Enthalpy Level (H_reactants)',
        min: 10,
        max: 70,
        step: 5,
        defaultValue: 45,
        unit: 'kJ/mol',
        description: 'Adjusts the initial potential enthalpy of the reactants.',
        affects: 'custom',
      },
      productEnergyKjMol: {
        id: 'productEnergyKjMol',
        name: 'Product Enthalpy Level (H_products)',
        min: 10,
        max: 70,
        step: 5,
        defaultValue: 15,
        unit: 'kJ/mol',
        description: 'Adjusts the final potential enthalpy of the products, updating ΔH = H_products − H_reactants.',
        affects: 'custom',
      },
      reactionCoordinateProgress: {
        id: 'reactionCoordinateProgress',
        name: 'Reaction Coordinate Marker (ξ)',
        min: 0.0,
        max: 1.0,
        step: 0.02,
        defaultValue: 0.5,
        unit: 'ξ',
        description:
          'Moves the inspection marker and conceptual A + B–C ➔ [A···B···C]‡ ➔ A–B + C molecular complex along the reaction coordinate.',
        affects: 'custom',
      },
    },
    conditions: {
      profilePreset: {
        id: 'profilePreset',
        name: 'Reaction Profile Selector',
        type: 'select',
        defaultValue: 'exothermic_single_step',
        options: [
          { value: 'exothermic_single_step', label: 'Exothermic Single-Step Profile (ΔH < 0, Single TS‡)' },
          { value: 'endothermic_single_step', label: 'Endothermic Single-Step Profile (ΔH > 0, Single TS‡)' },
          { value: 'multistep_intermediate', label: 'Multistep Profile (Two TS‡ Peaks + Intermediate Well [I])' },
        ],
        description: 'Selects between exothermic, endothermic, and two-step intermediate energy profiles.',
      },
      barrierViewMode: {
        id: 'barrierViewMode',
        name: 'Forward / Reverse Barrier View',
        type: 'select',
        defaultValue: 'both_barriers',
        options: [
          { value: 'both_barriers', label: 'Show Both Forward (E_a,fwd) & Reverse (E_a,rev) Barriers' },
          { value: 'forward_focus', label: 'Focus on Forward Activation Barrier (E_a,fwd)' },
          { value: 'reverse_focus', label: 'Focus on Reverse Activation Barrier (E_a,rev)' },
        ],
        description: 'Highlights and compares forward versus reverse activation energy barriers.',
      },
      animateCoordinate: {
        id: 'animateCoordinate',
        name: 'Animate Marker Along Coordinate',
        type: 'boolean',
        defaultValue: true,
        description: 'Continuously sweeps the molecular state marker across the reaction coordinate when playing.',
      },
      showProfileGraph: {
        id: 'showProfileGraph',
        name: 'Graph & Annotations Visibility',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides the 2D/3D annotated enthalpy profile card and energy difference markers.',
      },
    },
    parts: [
      {
        id: 'reactant_region',
        name: 'Reactant Region',
        label: 'Reactant Region',
        shape: 'box',
        dimensions: [1.5, 0.28, 1.2],
        position: [-3.2, -0.4, 0],
        color: '#38BDF8',
        material: 'metal',
        description:
          'Initial energy plateau (ξ = 0) representing separated reactants (A + B–C) at enthalpy H_reactants.',
        whatIsIt: 'Reactant enthalpy baseline plateau.',
        whatDoesItDo:
          'Establishes the reference starting enthalpy H_reactants from which E_a(fwd) and ΔH are measured.',
      },
      {
        id: 'product_region',
        name: 'Product Region',
        label: 'Product Region',
        shape: 'box',
        dimensions: [1.5, 0.28, 1.2],
        position: [2.2, -1.3, 0],
        color: '#10B981',
        material: 'metal',
        description:
          'Final energy plateau (ξ = 1) representing formed products (A–B + C) at enthalpy H_products.',
        whatIsIt: 'Product enthalpy baseline plateau.',
        whatDoesItDo:
          'Defines the final thermodynamic state H_products so that ΔH = H_products − H_reactants.',
      },
      {
        id: 'reaction_progress_pathway',
        name: 'Reaction-Progress Pathway',
        label: 'Reaction-Progress Pathway',
        shape: 'cylinder',
        dimensions: [0.12, 5.8, 0.12],
        position: [-0.5, 0.2, 0],
        rotation: [0, 0, Math.PI / 2],
        color: '#F59E0B',
        material: 'glow',
        description:
          'Continuous 3D potential-energy ribbon tracing H(ξ) from Reactant Region through the Transition State(s) to Product Region.',
        whatIsIt: 'Minimum-energy reaction coordinate curve H(ξ).',
        whatDoesItDo:
          'Connects reactant, transition-state, intermediate, and product configurations along ξ ∈ [0, 1].',
      },
      {
        id: 'transition_state_indicator',
        name: 'Transition-State Indicator',
        label: 'Transition-State Indicator',
        shape: 'sphere',
        dimensions: [0.46, 0.46, 0.46],
        position: [-0.5, 1.45, 0],
        color: '#F43F5E',
        material: 'glow',
        description:
          'Saddle-point maximum [‡] where old bonds are partially broken and new bonds are partially formed [A···B···C]‡.',
        whatIsIt: 'Activated Complex / Transition State [‡] marker and conceptual molecular arrangement.',
        whatDoesItDo:
          'Marks the highest potential-energy barrier along the reaction coordinate that colliding reactants must surmount.',
      },
      {
        id: 'activation_energy_marker',
        name: 'Activation-Energy Marker',
        label: 'Activation-Energy Marker',
        shape: 'cylinder',
        dimensions: [0.08, 1.8, 0.08],
        position: [-1.45, 0.55, 0.45],
        color: '#EC4899',
        material: 'glow',
        description:
          'Vertical double-headed energy span measuring Forward Activation Energy (E_a,fwd = H_TS − H_reactants) and Reverse Activation Energy (E_a,rev = H_TS − H_products).',
        whatIsIt: 'Forward and Reverse Activation Energy (E_a) callout pillar.',
        whatDoesItDo:
          'Quantifies the kinetic energy barrier for both forward and reverse reaction directions.',
      },
      {
        id: 'reaction_enthalpy_marker',
        name: 'Reaction-Enthalpy Marker',
        label: 'Reaction-Enthalpy Marker',
        shape: 'cylinder',
        dimensions: [0.08, 1.0, 0.08],
        position: [0.85, -0.85, 0.45],
        color: '#34D399',
        material: 'glow',
        description:
          'Vertical thermodynamic enthalpy difference marker measuring ΔH = H_products − H_reactants.',
        whatIsIt: 'Net Reaction Enthalpy (ΔH) span marker.',
        whatDoesItDo:
          'Indicates whether net heat is released (ΔH < 0, exothermic) or absorbed (ΔH > 0, endothermic) between initial and final states.',
      },
    ],
    equations: [
      '\\Delta H = H_{\\text{products}} - H_{\\text{reactants}} = E_{a,\\text{fwd}} - E_{a,\\text{rev}}',
      'E_{a,\\text{fwd}} = H_{\\text{TS}^\\ddagger} - H_{\\text{reactants}}, \\quad E_{a,\\text{rev}} = H_{\\text{TS}^\\ddagger} - H_{\\text{products}}',
    ],
    curiosityPrompts: [
      'Why can a strongly exothermic reaction (ΔH ≪ 0) still be extremely slow at room temperature if E_a,fwd is large?',
      'What is the physical difference between a Transition State [‡] at an energy maximum and a Reaction Intermediate [I] in an energy well?',
      'How are forward activation energy, reverse activation energy, and reaction enthalpy mathematically linked?',
    ],
  },

  // =========================================================================
  // 79. CATALYSIS EXPLORER
  // =========================================================================
  catalysisExplorer: {
    id: 'catalysis-explorer',
    title: 'Catalysis Explorer',
    concept: 'Alternative Reaction Pathways, Heterogeneous vs Homogeneous Mechanisms, Active Sites & ΔG/K_eq Invariance',
    description:
      'Interactive 3D catalysis laboratory comparing uncatalysed and catalysed reaction pathways across heterogeneous metal surfaces (Pt(111) hydrogenation), homogeneous aqueous ions (I⁻/H₂O₂), and metalloenzyme active sites, showing step-by-step intermediate formation and catalyst regeneration.',
    whatIsIt:
      'A comparative 3D catalytic mechanism and energy-pathway laboratory demonstrating how catalysts accelerate reaction rates without altering thermodynamic equilibrium.',
    howDoesItWork:
      'A catalyst increases reaction rate by providing an alternative mechanistic pathway with a lower activation energy barrier (E_a,cat < E_a,uncat). In heterogeneous catalysis (such as ethene hydrogenation on solid platinum), gas-phase reactants adsorb onto active surface sites (*), undergo bond weakening and stepwise H-atom transfer on the terrace, and desorb as products. In homogeneous catalysis (such as iodide-catalysed H₂O₂ decomposition in aqueous solution or enzymatic CO₂ hydration), the catalyst operates in the same phase by forming a discrete reaction intermediate (such as IO⁻) before being quantitatively regenerated. Because the initial reactant and final product energies remain identical, a catalyst does NOT change ΔH°, ΔG°, or the equilibrium constant K_eq at a fixed temperature—it lowers the forward and reverse barriers by the exact same ΔE_a.',
    realLifeExample:
      'Automotive platinum–rhodium three-way catalytic converters, iron catalysts in Haber ammonia synthesis, and carbonic anhydrase enzymes in human red blood cells.',
    examConnection:
      'Catalysts provide an alternative pathway with lower E_a, increasing the fraction of molecules with E ≥ E_a (k_cat = A·e^(−Ea,cat/RT)). Catalysts are regenerated at the end of the cycle and do NOT shift K_eq or ΔH.',
    scaleNote:
      'Mechanism Separation: Heterogeneous presets render a crystalline metal terrace with adsorption/desorption steps, whereas homogeneous presets render solution-phase molecular/active-site complexes rather than forcing all catalysts onto a solid slab.',
    simulationModel: 'predictive',
    functionalType: 'catalysis-explorer',
    prompt:
      'Create a 3D Catalysis Explorer showing a catalyst surface or homogeneous active site, approaching reactants, adsorbed/intermediate species, product release, and side-by-side uncatalysed vs catalysed energy profiles',
    camera: {
      position: [0, 3.2, 11.0],
      target: [0, 0.3, 0],
    },
    parameters: {
      reactionStepIndex: {
        id: 'reactionStepIndex',
        name: 'Catalytic Cycle Step (1 → 4)',
        min: 1,
        max: 4,
        step: 1,
        defaultValue: 2,
        unit: 'step',
        description:
          'Inspects individual elementary steps: (1) Approach/Binding, (2) Activation/Intermediate, (3) Transfer/Rearrangement, (4) Product Release & Catalyst Regeneration.',
        affects: 'custom',
      },
      catalysedBarrierReductionKjMol: {
        id: 'catalysedBarrierReductionKjMol',
        name: 'Barrier Lowering (ΔE_a = E_a,uncat − E_a,cat)',
        min: 15,
        max: 48,
        step: 1,
        defaultValue: 34,
        unit: 'kJ/mol',
        description:
          'Adjusts how much the alternative catalytic pathway lowers the activation energy barrier relative to the uncatalysed pathway.',
        affects: 'custom',
      },
      temperatureK: {
        id: 'temperatureK',
        name: 'Absolute Temperature (T)',
        min: 280,
        max: 450,
        step: 10,
        defaultValue: 300,
        unit: 'K',
        description:
          'Adjusts temperature T (K) to evaluate the temperature-dependent Arrhenius rate enhancement exp(ΔE_a / RT).',
        affects: 'custom',
      },
    },
    conditions: {
      catalystPreset: {
        id: 'catalystPreset',
        name: 'Catalyst Type Selector',
        type: 'select',
        defaultValue: 'heterogeneous_pt_ethene',
        options: [
          { value: 'heterogeneous_pt_ethene', label: 'Heterogeneous Surface: Pt(111) Ethene Hydrogenation (C₂H₄ + H₂ → C₂H₆)' },
          { value: 'homogeneous_iodide_h2o2', label: 'Homogeneous Solution: I⁻(aq) Catalysed H₂O₂ Decomposition (via IO⁻)' },
          { value: 'enzymatic_carbonic_anhydrase', label: 'Homogeneous Bio-Catalyst: Carbonic Anhydrase Zn²⁺ Active Site (CO₂ + H₂O)' },
        ],
        description: 'Switches between heterogeneous solid-surface catalysis and homogeneous solution/enzymatic mechanisms.',
      },
      pathwayMode: {
        id: 'pathwayMode',
        name: 'Catalyst Pathway Toggle',
        type: 'select',
        defaultValue: 'catalysed',
        options: [
          { value: 'catalysed', label: 'Catalysed Alternative Pathway (Lower E_a, Multi-Step Intermediate)' },
          { value: 'uncatalysed', label: 'Uncatalysed Direct Pathway (High Single Barrier E_a,uncat)' },
        ],
        description: 'Switches the active 3D trajectory between the catalysed and uncatalysed reaction pathways.',
      },
      showEnergyComparison: {
        id: 'showEnergyComparison',
        name: 'Energy Profile Comparison Toggle',
        type: 'boolean',
        defaultValue: true,
        description: 'Displays the dual Uncatalysed vs Catalysed potential-energy profile comparison board.',
      },
    },
    parts: [
      {
        id: 'catalyst_active_structure',
        name: 'Catalyst Surface / Active Center',
        label: 'Catalyst Surface / Active Center',
        shape: 'box',
        dimensions: [3.6, 0.45, 2.6],
        position: [-2.1, -0.95, 0],
        color: '#94A3B8',
        material: 'metal',
        description:
          'Active catalytic architecture: a crystalline Pt(111) terrace for heterogeneous catalysis or a coordinated I⁻ / Zn²⁺ catalytic center for homogeneous catalysis.',
        whatIsIt: 'Regenerable catalyst active surface or homogeneous coordination center.',
        whatDoesItDo:
          'Coordinates reactants to stabilize transition states and lower activation energy without being consumed overall.',
      },
      {
        id: 'approaching_reactant_species',
        name: 'Approaching Reactant Species',
        label: 'Approaching Reactant Species',
        shape: 'sphere',
        dimensions: [0.42, 0.42, 0.42],
        position: [-3.1, 0.55, 0.3],
        color: '#38BDF8',
        material: 'glow',
        description:
          'Incoming reactant molecules (C₂H₄ + H₂, H₂O₂, or CO₂ + H₂O) diffusing toward the catalytic site.',
        whatIsIt: 'Initial substrate/reactant molecules.',
        whatDoesItDo:
          'Binds to the catalyst in Step 1 to enter the lower-barrier alternative reaction pathway.',
      },
      {
        id: 'adsorbed_intermediate_species',
        name: 'Adsorbed / Intermediate Complex',
        label: 'Adsorbed / Intermediate Complex',
        shape: 'sphere',
        dimensions: [0.48, 0.48, 0.48],
        position: [-2.1, -0.25, 0],
        color: '#F59E0B',
        material: 'glow',
        description:
          'Chemisorbed surface species (C₂H₄* + 2H*) or homogeneous reaction intermediate (IO⁻ / Zn–HCO₃⁻) formed at the active site.',
        whatIsIt: 'Catalytic reaction intermediate complex.',
        whatDoesItDo:
          'Provides the stabilized intermediate state between elementary transition states TS₁‡ and TS₂‡.',
      },
      {
        id: 'released_product_species',
        name: 'Released Product Species',
        label: 'Released Product Species',
        shape: 'sphere',
        dimensions: [0.44, 0.44, 0.44],
        position: [-1.0, 0.65, -0.2],
        color: '#10B981',
        material: 'glow',
        description:
          'Desorbed or released product molecules (C₂H₆, O₂ + 2H₂O, or HCO₃⁻) departing the regenerated catalyst.',
        whatIsIt: 'Final product molecules departing the catalytic cycle.',
        whatDoesItDo:
          'Vacates the active site in Step 4 so the regenerated catalyst can immediately process another reactant turnover.',
      },
      {
        id: 'uncatalysed_pathway_curve',
        name: 'Uncatalysed Pathway Profile',
        label: 'Uncatalysed Pathway Profile',
        shape: 'cylinder',
        dimensions: [0.09, 3.2, 0.09],
        position: [2.1, 1.15, 0],
        color: '#F43F5E',
        material: 'glow',
        description:
          'High-barrier uncatalysed energy curve (E_a,uncat) requiring a high-energy collision to react directly.',
        whatIsIt: 'Uncatalysed potential energy barrier curve.',
        whatDoesItDo:
          'Serves as the reference high-activation-energy pathway against which catalytic lowering ΔE_a is measured.',
      },
      {
        id: 'catalysed_pathway_curve',
        name: 'Catalysed Pathway Profile',
        label: 'Catalysed Pathway Profile',
        shape: 'cylinder',
        dimensions: [0.09, 3.2, 0.09],
        position: [2.1, 0.15, 0],
        color: '#10B981',
        material: 'glow',
        description:
          'Lower-barrier multi-step catalysed energy profile (E_a,cat) sharing the exact same initial H_reactants and final H_products.',
        whatIsIt: 'Alternative catalysed potential energy pathway.',
        whatDoesItDo:
          'Demonstrates activation energy reduction ΔE_a while preserving overall ΔH° and thermodynamic equilibrium.',
      },
    ],
    equations: [
      '\\Delta E_a = E_{a,\\text{uncat}} - E_{a,\\text{cat}} > 0',
      '\\frac{k_{\\text{cat}}}{k_{\\text{uncat}}} = \\exp\\left(\\frac{E_{a,\\text{uncat}} - E_{a,\\text{cat}}}{RT}\\right)',
      '\\Delta H^\\circ_{\\text{cat}} = \\Delta H^\\circ_{\\text{uncat}}, \\quad K_{\\text{eq,cat}} = K_{\\text{eq,uncat}}',
    ],
    curiosityPrompts: [
      'How do heterogeneous surface catalysts (Pt terrace) and homogeneous solution catalysts (I⁻(aq)) differ in phase and mechanism?',
      'Why is a catalyst regenerated at the end of each turnover cycle even though it participates in intermediate elementary steps?',
      'Why does lowering the activation barrier not shift the final equilibrium position of a reversible reaction?',
    ],
  },

  // =========================================================================
  // 80. ACID–BASE TITRATION LABORATORY
  // =========================================================================
  acidBaseTitrationLaboratory: {
    id: 'acid-base-titration-laboratory',
    title: 'Acid–Base Titration Laboratory',
    concept: 'Volumetric Titration Curves, Equivalence Point Stoichiometry, Buffer Region & Indicator Transition Ranges',
    description:
      'Interactive 3D analytical titration workstation with a graduated burette, stopcock delivery valve, receiving Erlenmeyer flask, magnetic stirrer, digital pH electrode, acid–base indicator colour transitions, and real-time pH-versus-volume titration curves.',
    whatIsIt:
      'A quantitative 3D volumetric analysis laboratory for performing strong-acid/strong-base, weak-acid/strong-base, and weak-base/strong-acid titrations.',
    howDoesItWork:
      'A standardized titrant solution of concentration C_t is dispensed incrementally from a graduated burette into an analyte solution of volume V_a and concentration C_a. The stoichiometric Equivalence Volume (V_eq = C_a·V_a / C_t for monoprotic 1:1 reactions) occurs where moles of added titrant equal initial moles of analyte. For a Strong Acid–Strong Base titration (HCl + NaOH), the equivalence point is neutral (pH = 7.00 at 25°C). For a Weak Acid–Strong Base titration (CH₃COOH + NaOH), partial neutralization creates a CH₃COOH/CH₃COO⁻ buffer region governed by the Henderson–Hasselbalch equation pH = pK_a + log₁₀([A⁻]/[HA]) (with pH = pK_a at the half-equivalence volume ½V_eq), and the equivalence point is basic (pH > 7) due to hydrolysis of the conjugate base CH₃COO⁻. Conversely, a Weak Base–Strong Acid titration (NH₃ + HCl) has an acidic equivalence point (pH < 7) due to NH₄⁺ hydrolysis.',
    realLifeExample:
      'Quality-control determination of acetic acid acidity in commercial vinegar, pharmaceutical assay of weak-base active ingredients, and alkalinity testing in municipal water treatment.',
    examConnection:
      'Equivalence volume: C_a·V_a = C_b·V_b (for 1:1 monoprotic stoichiometry). Half-equivalence point of weak acid: V_t = ½V_eq ➔ [A⁻] = [HA] ➔ pH = pK_a. Equivalence pH: Strong+Strong = 7.00; Weak Acid+Strong Base > 7; Strong Acid+Weak Base < 7.',
    scaleNote:
      'Educational Apparatus Notice: The 3D burette and Erlenmeyer flask provide a clear volumetric visualization synchronized with exact multi-region equilibrium pH calculations.',
    simulationModel: 'predictive',
    functionalType: 'acid-base-titration-laboratory',
    prompt:
      'Create a 3D Acid-Base Titration Laboratory with a burette containing titrant, receiving flask containing analyte, visible meniscus, stopcock valve, indicator colour transition, digital pH readout, and titration curve with equivalence marker',
    camera: {
      position: [0, 3.1, 11.2],
      target: [0, 0.3, 0],
    },
    parameters: {
      titrantVolumeAddedMl: {
        id: 'titrantVolumeAddedMl',
        name: 'Titrant Volume Added (V_t)',
        min: 0.0,
        max: 50.0,
        step: 0.5,
        defaultValue: 12.5,
        unit: 'mL',
        description:
          'Dispenses titrant from the burette into the receiving flask, updating liquid levels, solution pH, indicator colour, and the titration curve.',
        affects: 'custom',
      },
      analyteConcentrationM: {
        id: 'analyteConcentrationM',
        name: 'Initial Analyte Concentration (C_a)',
        min: 0.05,
        max: 0.20,
        step: 0.01,
        defaultValue: 0.10,
        unit: 'M',
        description: 'Sets initial molarity of the analyte in the receiving flask, shifting the stoichiometric equivalence volume V_eq.',
        affects: 'custom',
      },
      titrantConcentrationM: {
        id: 'titrantConcentrationM',
        name: 'Titrant Concentration (C_t)',
        min: 0.05,
        max: 0.20,
        step: 0.01,
        defaultValue: 0.10,
        unit: 'M',
        description: 'Sets molarity of the standardized titrant in the burette.',
        affects: 'custom',
      },
      analyteVolumeMl: {
        id: 'analyteVolumeMl',
        name: 'Initial Analyte Volume (V_a)',
        min: 15,
        max: 35,
        step: 5,
        defaultValue: 25,
        unit: 'mL',
        description: 'Adjusts the initial sample volume pipetted into the receiving flask.',
        affects: 'custom',
      },
    },
    conditions: {
      titrationType: {
        id: 'titrationType',
        name: 'Titration System Selector',
        type: 'select',
        defaultValue: 'strong_acid_strong_base',
        options: [
          { value: 'strong_acid_strong_base', label: 'Strong Acid + Strong Base: HCl(aq) + NaOH(aq)  (Eq pH = 7.00)' },
          { value: 'weak_acid_strong_base', label: 'Weak Acid + Strong Base: CH₃COOH(aq) + NaOH(aq)  (pK_a = 4.76, Eq pH > 7)' },
          { value: 'strong_acid_weak_base', label: 'Weak Base + Strong Acid: NH₃(aq) + HCl(aq)  (pK_a = 9.25, Eq pH < 7)' },
        ],
        description: 'Selects the acid–base titration system and its region-specific equilibrium solver.',
      },
      indicatorType: {
        id: 'indicatorType',
        name: 'Acid–Base Indicator Selector',
        type: 'select',
        defaultValue: 'phenolphthalein',
        options: [
          { value: 'phenolphthalein', label: 'Phenolphthalein (Transition pH 8.2 – 10.0: Colourless ➔ Pink)' },
          { value: 'bromothymol_blue', label: 'Bromothymol Blue (Transition pH 6.0 – 7.6: Yellow ➔ Green ➔ Blue)' },
          { value: 'methyl_orange', label: 'Methyl Orange (Transition pH 3.1 – 4.4: Red ➔ Orange ➔ Yellow)' },
        ],
        description: 'Selects the visual indicator dye in the receiving flask.',
      },
      showTitrationCurve: {
        id: 'showTitrationCurve',
        name: 'Titration Curve & Equivalence Marker',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides the pH vs Titrant Volume curve and Equivalence Point marker.',
      },
    },
    parts: [
      {
        id: 'graduated_burette',
        name: 'Graduated Burette',
        label: 'Graduated Burette',
        shape: 'cylinder',
        dimensions: [0.22, 3.2, 0.22],
        position: [-2.1, 1.55, 0],
        color: '#E2E8F0',
        material: 'glass',
        opacity: 0.38,
        description:
          'Precision volumetric glass tube with 0–50 mL graduations and visible titrant meniscus level that descends as V_t increases.',
        whatIsIt: 'Volumetric graduated burette containing standardized titrant.',
        whatDoesItDo:
          'Delivers accurately measured volumes of titrant (V_t) into the receiving flask below.',
      },
      {
        id: 'titrant_stopcock_valve',
        name: 'Titrant Stopcock Valve',
        label: 'Titrant Stopcock Valve',
        shape: 'box',
        dimensions: [0.55, 0.18, 0.25],
        position: [-2.1, -0.12, 0],
        color: '#EF4444',
        material: 'standard',
        description:
          'PTFE rotary stopcock valve controlling dropwise titrant delivery from the burette tip into the analyte.',
        whatIsIt: 'Controllable burette stopcock delivery mechanism.',
        whatDoesItDo:
          'Regulates titrant flow so the steep pH jump near the equivalence point can be approached dropwise.',
      },
      {
        id: 'receiving_erlenmeyer_flask',
        name: 'Receiving Flask (Analyte)',
        label: 'Receiving Flask (Analyte)',
        shape: 'cone',
        dimensions: [1.15, 1.75, 1.15],
        position: [-2.1, -1.25, 0],
        color: '#94A3B8',
        material: 'glass',
        opacity: 0.34,
        description:
          'Conical Erlenmeyer receiving flask holding the analyte solution and magnetic stir bar, displaying real-time indicator colour changes.',
        whatIsIt: 'Conical titration receiving flask containing the analyte and indicator.',
        whatDoesItDo:
          'Mixes added titrant with the analyte and displays the indicator colour corresponding to the calculated solution pH.',
      },
      {
        id: 'digital_ph_readout',
        name: 'Digital pH Meter & Probe',
        label: 'Digital pH Meter & Probe',
        shape: 'box',
        dimensions: [1.1, 0.85, 0.35],
        position: [-0.55, -1.05, 0.35],
        color: '#0F172A',
        material: 'metal',
        description:
          'Glass-bulb pH electrode immersed in the analyte connected to a high-impedance digital pH meter display.',
        whatIsIt: 'Potentiometric pH sensor and digital readout.',
        whatDoesItDo:
          'Continuously measures and displays solution pH = −log₁₀[H⁺] across all titration regions.',
      },
      {
        id: 'titration_curve_graph',
        name: 'Titration Curve Graph',
        label: 'Titration Curve Graph',
        shape: 'box',
        dimensions: [3.9, 2.6, 0.12],
        position: [2.2, 0.45, -0.3],
        color: '#0F172A',
        material: 'standard',
        description:
          'Live plot of solution pH (0–14) versus added Titrant Volume V_t (0–50 mL) highlighting the active operating point.',
        whatIsIt: 'Real-time pH versus Titrant Volume titration curve.',
        whatDoesItDo:
          'Visualizes the initial region, buffer plateau (for weak acids/bases), steep inflection jump, and post-equivalence plateau.',
      },
      {
        id: 'equivalence_point_marker',
        name: 'Equivalence-Point Indicator',
        label: 'Equivalence-Point Indicator',
        shape: 'sphere',
        dimensions: [0.32, 0.32, 0.32],
        position: [2.2, -1.25, -0.2],
        color: '#F59E0B',
        material: 'glow',
        description:
          'Stoichiometric equivalence marker identifying V_eq and Equivalence Point pH (7.00 for strong/strong, >7 for weak acid/strong base, <7 for strong acid/weak base).',
        whatIsIt: 'Stoichiometric Equivalence Point (V_eq, pH_eq) callout.',
        whatDoesItDo:
          'Marks the exact titrant volume where moles of added titrant equal initial stoichiometric moles of analyte.',
      },
    ],
    equations: [
      'V_{\\text{eq}} = \\frac{C_a V_a}{C_t}, \\quad \\mathrm{pH} = -\\log_{10}[\\mathrm{H^+}]',
      '\\text{Buffer Region (Weak Acid): } \\mathrm{pH} = \\mathrm{p}K_a + \\log_{10}\\left(\\frac{[\\mathrm{A^-}]+[\\mathrm{HA}]_{\\text{reacted}}}{[\\mathrm{HA}]_{\\text{rem}}}\\right)',
      '\\text{At Half-Equivalence } (V_t = \\tfrac{1}{2}V_{\\text{eq}}): [\\mathrm{A^-}] = [\\mathrm{HA}] \\implies \\mathrm{pH} = \\mathrm{p}K_a',
    ],
    curiosityPrompts: [
      'Why is the equivalence point pH greater than 7 for a weak acid titrated with a strong base, but equal to 7.00 for HCl + NaOH?',
      'Why is the Henderson–Hasselbalch equation valid in the pre-equivalence buffer region of a weak acid, but invalid at V_t = 0 and V_t = V_eq?',
      'How do you choose between Phenolphthalein and Methyl Orange based on the steep equivalence jump of a titration curve?',
    ],
  },

  // =========================================================================
  // 81. SOLUBILITY AND PRECIPITATION EXPLORER
  // =========================================================================
  solubilityPrecipitationExplorer: {
    id: 'solubility-precipitation-explorer',
    title: 'Solubility and Precipitation Explorer',
    concept: 'Solubility Product Equilibrium (K_sp), Ion Product (Q_sp), Crystallized Precipitates & Common-Ion Effect',
    description:
      'Interactive 3D ionic-equilibrium laboratory demonstrating sparingly soluble salt dissolution (A_mB_n(s) ⇌ mA^(n+)(aq) + nB^(m−)(aq)), Q_sp versus K_sp saturation comparisons, discrete crystal precipitation, dilution, and the common-ion effect.',
    whatIsIt:
      'A 3D aqueous solubility and precipitation laboratory that compares the reaction ion product Q_sp against literature 25°C solubility products K_sp.',
    howDoesItWork:
      'When a sparingly soluble ionic solid dissolves in water according to A_mB_n(s) ⇌ mA^(n+)(aq) + nB^(m−)(aq), the equilibrium state is governed by the solubility product constant K_sp = [A^(n+)]^m[B^(m−)]^n (using molar concentrations as an ideal-solution approximation for ionic activities). For any arbitrary solution composition, we compute the Ion Product Q_sp = [A^(n+)]₀^m[B^(m−)]₀^n. If Q_sp < K_sp, the solution is unsaturated and all ions remain dissolved. If Q_sp = K_sp, the solution is saturated at dynamic dissolution–crystallization equilibrium. If Q_sp > K_sp, the solution is supersaturated and precipitation of discrete solid crystal particles is thermodynamically favoured until the remaining dissolved ion concentrations satisfy Q_sp = K_sp. Adding a common ion increases Q_sp and reduces the molar solubility of the salt (the Common-Ion Effect).',
    realLifeExample:
      'Halide testing with AgNO₃ to precipitate white AgCl(s), "Golden Rain" crystallization of PbI₂(s), barium sulfate (BaSO₄) medical X-ray contrast suspensions, and mineral scale formation.',
    examConnection:
      'For A_mB_n(s) ⇌ mA^(n+)(aq) + nB^(m−)(aq), K_sp = [A^(n+)]^m[B^(m−)]^n. Q_sp < K_sp: Unsaturated (no precipitate); Q_sp = K_sp: Saturated equilibrium; Q_sp > K_sp: Precipitation favoured. Common-ion addition shifts equilibrium toward the solid phase.',
    scaleNote:
      'Discrete Solid Representation: Precipitates are rendered as distinct settled crystal grains at the vessel floor (never as smoke or a colour cloud), while dissolved cations and anions move freely in the aqueous solvent.',
    simulationModel: 'predictive',
    functionalType: 'solubility-precipitation-explorer',
    prompt:
      'Create a 3D Solubility and Precipitation Explorer with a transparent solution vessel, dissolved cations and anions, settled solid crystal precipitate, saturation indicator, and Qsp vs Ksp equilibrium display',
    camera: {
      position: [0, 3.0, 10.8],
      target: [0, 0.3, 0],
    },
    parameters: {
      cationAddedMillimolar: {
        id: 'cationAddedMillimolar',
        name: 'Cation Concentration ([A^(n+)]₀)',
        min: 0.005,
        max: 2.5,
        step: 0.025,
        defaultValue: 0.5,
        unit: 'mM',
        description:
          'Adjusts initial millimolar concentration of the metal cation (Ag⁺, Pb²⁺, Ba²⁺, or Ca²⁺) in the reference solution.',
        affects: 'custom',
      },
      anionAddedMillimolar: {
        id: 'anionAddedMillimolar',
        name: 'Anion Concentration ([B^(m−)]₀)',
        min: 0.005,
        max: 2.5,
        step: 0.025,
        defaultValue: 0.5,
        unit: 'mM',
        description:
          'Adjusts initial millimolar concentration of the counter-anion (Cl⁻, I⁻, SO₄²⁻, or F⁻).',
        affects: 'custom',
      },
      solutionVolumeMl: {
        id: 'solutionVolumeMl',
        name: 'Solution Volume (Dilution Control)',
        min: 50,
        max: 500,
        step: 25,
        defaultValue: 100,
        unit: 'mL',
        description:
          'Dilutes or concentrates the aqueous solution volume V, recalculating ion molarities and Q_sp.',
        affects: 'custom',
      },
      commonIonAddedMillimolar: {
        id: 'commonIonAddedMillimolar',
        name: 'Common-Ion Addition (NaCl / KI / Na₂SO₄ / NaF)',
        min: 0.0,
        max: 5.0,
        step: 0.25,
        defaultValue: 0.0,
        unit: 'mM',
        description:
          "Adds soluble common-ion salt to demonstrate Le Chatelier suppression of solubility and enhanced precipitation.",
        affects: 'custom',
      },
    },
    conditions: {
      saltPreset: {
        id: 'saltPreset',
        name: 'Sparingly Soluble Salt Selector',
        type: 'select',
        defaultValue: 'agcl',
        options: [
          { value: 'agcl', label: 'Silver Chloride: AgCl(s) ⇌ Ag⁺(aq) + Cl⁻(aq)  (K_sp = 1.77×10⁻¹⁰)' },
          { value: 'pbi2', label: 'Lead(II) Iodide: PbI₂(s) ⇌ Pb²⁺(aq) + 2I⁻(aq)  (K_sp = 9.8×10⁻⁹)' },
          { value: 'baso4', label: 'Barium Sulfate: BaSO₄(s) ⇌ Ba²⁺(aq) + SO₄²⁻(aq)  (K_sp = 1.08×10⁻¹⁰)' },
          { value: 'caf2', label: 'Calcium Fluoride: CaF₂(s) ⇌ Ca²⁺(aq) + 2F⁻(aq)  (K_sp = 3.45×10⁻¹¹)' },
        ],
        description: 'Selects the sparingly soluble ionic compound with its verified 25°C K_sp constant and stoichiometry.',
      },
      showDissolvedIons: {
        id: 'showDissolvedIons',
        name: 'Dissolved Ion Markers Visibility',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides hydrated aqueous cation and anion markers in the solution bulk.',
      },
      showEquilibriumBoard: {
        id: 'showEquilibriumBoard',
        name: 'Equilibrium Display (Q_sp vs K_sp)',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides the 3D Q_sp versus K_sp logarithmic bar chart and mass-balance readout.',
      },
    },
    parts: [
      {
        id: 'aqueous_solution_vessel',
        name: 'Aqueous Solution Vessel',
        label: 'Aqueous Solution Vessel',
        shape: 'cylinder',
        dimensions: [1.95, 3.1, 1.95],
        position: [-2.1, 0.0, 0],
        color: '#38BDF8',
        material: 'glass',
        opacity: 0.30,
        description:
          'Transparent borosilicate precipitation beaker containing the aqueous solvent with adjustable dilution volume.',
        whatIsIt: 'Graduated aqueous reaction beaker.',
        whatDoesItDo:
          'Holds the dissolved ionic solution and adjusts liquid height as total solution volume (50–500 mL) changes.',
      },
      {
        id: 'dissolved_cations',
        name: 'Dissolved Cations',
        label: 'Dissolved Cations',
        shape: 'sphere',
        dimensions: [0.36, 0.36, 0.36],
        position: [-2.6, 0.35, 0.3],
        color: '#38BDF8',
        material: 'glow',
        description:
          'Hydrated metal cations (Ag⁺, Pb²⁺, Ba²⁺, or Ca²⁺) diffusing freely through the aqueous solvent phase.',
        whatIsIt: 'Dissolved aqueous metal cations A^(n+)(aq).',
        whatDoesItDo:
          'Combines with counter-anions in stoichiometric ratio m:n when Q_sp exceeds K_sp.',
      },
      {
        id: 'dissolved_anions',
        name: 'Dissolved Anions',
        label: 'Dissolved Anions',
        shape: 'sphere',
        dimensions: [0.38, 0.38, 0.38],
        position: [-1.6, 0.45, -0.3],
        color: '#A855F7',
        material: 'glow',
        description:
          'Hydrated counter-anions (Cl⁻, I⁻, SO₄²⁻, or F⁻) in the aqueous phase, including any added common-ion contribution.',
        whatIsIt: 'Dissolved aqueous anions B^(m−)(aq).',
        whatDoesItDo:
          'Determines Q_sp = [A^(n+)]^m[B^(m−)]^n and drives common-ion precipitation when increased.',
      },
      {
        id: 'solid_precipitate_crystals',
        name: 'Precipitate Solid Crystals',
        label: 'Precipitate Solid Crystals',
        shape: 'box',
        dimensions: [1.8, 0.45, 1.8],
        position: [-2.1, -1.25, 0],
        color: '#FACC15',
        material: 'standard',
        description:
          'Discrete crystallized ionic lattice particles settled at the bottom of the vessel when Q_sp > K_sp.',
        whatIsIt: 'Crystalline solid phase A_mB_n(s) settled on the vessel floor.',
        whatDoesItDo:
          'Forms and grows as discrete micro-crystals when Q_sp > K_sp, remaining in dynamic exchange with saturated solution ions.',
      },
      {
        id: 'saturation_status_indicator',
        name: 'Saturation Status Indicator',
        label: 'Saturation Status Indicator',
        shape: 'box',
        dimensions: [3.2, 0.36, 0.36],
        position: [-2.1, -1.85, 0],
        color: '#10B981',
        material: 'metal',
        description:
          'Status bar beneath the vessel indicating Unsaturated (Q_sp < K_sp), Saturated (Q_sp = K_sp), or Supersaturated / Precipitating (Q_sp > K_sp).',
        whatIsIt: 'Thermodynamic saturation regime indicator.',
        whatDoesItDo:
          'Provides immediate visual feedback on whether the ion product is below, at, or above the solubility limit.',
      },
      {
        id: 'solubility_equilibrium_display',
        name: 'Solubility Equilibrium Display',
        label: 'Solubility Equilibrium Display',
        shape: 'box',
        dimensions: [3.9, 2.6, 0.12],
        position: [2.2, 0.35, -0.3],
        color: '#0F172A',
        material: 'standard',
        description:
          '3D analytical display comparing log₁₀(Q_sp) vs log₁₀(K_sp), equilibrium ion concentrations, and precipitated solid mass (mg).',
        whatIsIt: 'Quantitative Q_sp vs K_sp and Precipitation Mass-Balance Board.',
        whatDoesItDo:
          'Displays the balanced dissolution equation, literature K_sp value, current Q_sp, and precipitated yield.',
      },
    ],
    equations: [
      '\\mathrm{A}_m\\mathrm{B}_n(s) \\rightleftharpoons m\\,\\mathrm{A}^{n+}(aq) + n\\,\\mathrm{B}^{m-}(aq)',
      'K_{sp} = [\\mathrm{A}^{n+}]_{\\text{eq}}^m [\\mathrm{B}^{m-}]_{\\text{eq}}^n, \\quad Q_{sp} = [\\mathrm{A}^{n+}]_0^m [\\mathrm{B}^{m-}]_0^n',
      'Q_{sp} < K_{sp}\\text{ (Unsaturated)}, \\quad Q_{sp} = K_{sp}\\text{ (Saturated)}, \\quad Q_{sp} > K_{sp}\\text{ (Precipitation Favoured)}',
    ],
    curiosityPrompts: [
      'How does comparing the Ion Product Q_sp with the Solubility Product K_sp predict whether a precipitate will form?',
      'Why does adding a soluble common-ion salt (such as NaCl to saturated AgCl) decrease the molar solubility of the sparingly soluble salt?',
      'Why is a precipitate scientifically represented as discrete settled crystal grains rather than a gaseous smoke cloud?',
    ],
  },

  // =========================================================================
  // 82. BUFFER SOLUTION SIMULATOR
  // =========================================================================
  bufferSolutionSimulator: {
    id: 'buffer-solution-simulator',
    title: 'Buffer Solution Simulator',
    concept: 'Conjugate Acid–Base Pairs, Henderson–Hasselbalch Ratio, Stoichiometric Neutralization & Finite Buffer Capacity',
    description:
      'Interactive 3D buffer-chemistry laboratory demonstrating how weak-acid/conjugate-base and weak-base/conjugate-acid solutions resist pH changes upon strong acid (H⁺) or strong base (OH⁻) addition, complete with side-by-side buffer capacity comparison.',
    whatIsIt:
      'A specialized 3D buffer-capacity and conjugate-pair laboratory distinct from volumetric titration, focused on pH resistance and finite buffer exhaustion.',
    howDoesItWork:
      'A buffer solution requires substantial concentrations of both a weak acid (HA) and its conjugate base (A⁻), or a weak base (B) and its conjugate acid (BH⁺). When strong acid (H⁺) is added, it does not remain free in solution; instead, it is stoichiometrically consumed by the basic buffer partner (A⁻ + H⁺ → HA). Conversely, added strong base (OH⁻) is consumed by the acidic buffer partner (HA + OH⁻ → A⁻ + H₂O). Within the valid buffer region where both components remain present in comparable amounts (0.1 ≤ [Base]/[Acid] ≤ 10, i.e., pH ≈ pK_a ± 1), the pH is governed by the Henderson–Hasselbalch equation pH = pK_a + log₁₀([Base]/[Acid]) and changes very little because the logarithmic ratio shifts gradually. Higher total buffer concentration ([HA] + [A⁻]) provides greater Buffer Capacity against larger additions, but every buffer has a finite capacity and experiences a sharp pH jump once either conjugate partner is exhausted.',
    realLifeExample:
      'Human blood plasma carbonic-acid/bicarbonate (H₂CO₃/HCO₃⁻) and intracellular phosphate (H₂PO₄⁻/HPO₄²⁻) buffers maintaining physiological pH near 7.40, and acetate buffers in biochemical assays.',
    examConnection:
      'Henderson–Hasselbalch: pH = pK_a + log₁₀([A⁻]/[HA]). Added H⁺ consumes A⁻ (n_A⁻ decreases, n_HA increases). Added OH⁻ consumes HA (n_HA decreases, n_A⁻ increases). Maximum buffer capacity occurs when [A⁻] = [HA] (pH = pK_a) and increases with total molarity.',
    scaleNote:
      'Distinct Buffer Focus: Unlike a titration curve, this simulator directly compares conjugate-pair mole bars before and after strong acid/base shocks alongside a dilute reference buffer and unbuffered water.',
    simulationModel: 'predictive',
    functionalType: 'buffer-solution-simulator',
    prompt:
      'Create a 3D Buffer Solution Simulator showing a vessel with weak acid and conjugate base species, strong acid and base addition droppers, digital pH readout, composition bars, and buffer capacity comparison',
    camera: {
      position: [0, 3.1, 11.0],
      target: [0, 0.3, 0],
    },
    parameters: {
      initialWeakConcM: {
        id: 'initialWeakConcM',
        name: 'Weak Acid / Base Concentration',
        min: 0.05,
        max: 0.80,
        step: 0.05,
        defaultValue: 0.25,
        unit: 'M',
        description:
          'Sets initial molarity of the weak component (CH₃COOH, H₂PO₄⁻, or NH₃) in the 100 mL buffer vessel.',
        affects: 'custom',
      },
      initialConjugateConcM: {
        id: 'initialConjugateConcM',
        name: 'Conjugate Partner Concentration',
        min: 0.05,
        max: 0.80,
        step: 0.05,
        defaultValue: 0.25,
        unit: 'M',
        description:
          'Sets initial molarity of the conjugate partner (CH₃COO⁻, HPO₄²⁻, or NH₄⁺), controlling the initial [Base]/[Acid] ratio.',
        affects: 'custom',
      },
      addedStrongAcidMmol: {
        id: 'addedStrongAcidMmol',
        name: 'Add Strong Acid (HCl Added)',
        min: 0.0,
        max: 25.0,
        step: 1.0,
        defaultValue: 0.0,
        unit: 'mmol',
        description:
          'Adds strong acid (H⁺ in mmol) to test how the basic buffer component neutralizes added protons.',
        affects: 'custom',
      },
      addedStrongBaseMmol: {
        id: 'addedStrongBaseMmol',
        name: 'Add Strong Base (NaOH Added)',
        min: 0.0,
        max: 25.0,
        step: 1.0,
        defaultValue: 0.0,
        unit: 'mmol',
        description:
          'Adds strong base (OH⁻ in mmol) to test how the acidic buffer component neutralizes added hydroxide.',
        affects: 'custom',
      },
    },
    conditions: {
      bufferPreset: {
        id: 'bufferPreset',
        name: 'Buffer System Selector',
        type: 'select',
        defaultValue: 'acetate_buffer',
        options: [
          { value: 'acetate_buffer', label: 'Acetic Acid / Acetate Buffer: CH₃COOH / CH₃COO⁻  (pK_a = 4.76)' },
          { value: 'phosphate_buffer', label: 'Phosphate Buffer: H₂PO₄⁻ / HPO₄²⁻  (pK_a2 = 7.20)' },
          { value: 'ammonia_buffer', label: 'Ammonia / Ammonium Buffer: NH₃ / NH₄⁺  (pK_a = 9.25)' },
        ],
        description: 'Selects a valid conjugate acid–base buffer pair and its literature pK_a constant.',
      },
      showCapacityComparison: {
        id: 'showCapacityComparison',
        name: 'Buffer Capacity Comparison View',
        type: 'boolean',
        defaultValue: true,
        description: 'Compares active buffer pH stability against a 0.25× dilute buffer and unbuffered water under the same addition.',
      },
    },
    parts: [
      {
        id: 'buffer_solution_vessel',
        name: 'Buffer Solution Vessel',
        label: 'Buffer Solution Vessel',
        shape: 'cylinder',
        dimensions: [1.9, 3.0, 1.9],
        position: [-2.1, -0.1, 0],
        color: '#38BDF8',
        material: 'glass',
        opacity: 0.32,
        description:
          '100 mL reaction vessel containing the conjugate acid–base buffer pair in aqueous solution.',
        whatIsIt: 'Buffered aqueous solution vessel.',
        whatDoesItDo:
          'Houses both members of the conjugate acid–base pair so added H⁺ or OH⁻ is neutralized stoichiometrically.',
      },
      {
        id: 'weak_acid_base_species',
        name: 'Weak Acid / Base Species',
        label: 'Weak Acid / Base Species',
        shape: 'sphere',
        dimensions: [0.40, 0.40, 0.40],
        position: [-2.65, 0.15, 0.3],
        color: '#38BDF8',
        material: 'glow',
        description:
          'Weak acid molecules (CH₃COOH, H₂PO₄⁻) or weak base molecules (NH₃) that neutralize added strong base or acid.',
        whatIsIt: 'Weak component of the conjugate buffer pair.',
        whatDoesItDo:
          'Acts as a proton donor (HA) to consume added OH⁻ or proton acceptor (NH₃) to consume added H⁺.',
      },
      {
        id: 'conjugate_partner_species',
        name: 'Conjugate Partner Species',
        label: 'Conjugate Partner Species',
        shape: 'sphere',
        dimensions: [0.40, 0.40, 0.40],
        position: [-1.55, 0.15, -0.3],
        color: '#10B981',
        material: 'glow',
        description:
          'Conjugate base ions (CH₃COO⁻, HPO₄²⁻) or conjugate acid ions (NH₄⁺) coexisting in equilibrium with the weak component.',
        whatIsIt: 'Conjugate partner of the buffer system.',
        whatDoesItDo:
          'Neutralizes incoming strong acid (A⁻ + H⁺ → HA) or strong base (NH₄⁺ + OH⁻ → NH₃ + H₂O) to stabilize pH.',
      },
      {
        id: 'acid_base_addition_droppers',
        name: 'Acid / Base Addition Droppers',
        label: 'Acid / Base Addition Droppers',
        shape: 'cylinder',
        dimensions: [0.22, 1.1, 0.22],
        position: [-2.1, 2.05, 0],
        color: '#F43F5E',
        material: 'metal',
        description:
          'Dual reagent pipettes above the vessel delivering measured millimoles of strong acid (HCl) or strong base (NaOH).',
        whatIsIt: 'Strong acid (H⁺) and strong base (OH⁻) challenge dispensers.',
        whatDoesItDo:
          'Introduces H⁺ or OH⁻ shocks into the buffer to test its pH resistance and finite buffer capacity.',
      },
      {
        id: 'buffer_ph_readout',
        name: 'Buffer Digital pH Readout',
        label: 'Buffer Digital pH Readout',
        shape: 'box',
        dimensions: [3.2, 0.42, 0.36],
        position: [-2.1, -1.85, 0],
        color: '#0F172A',
        material: 'metal',
        description:
          'Digital pH meter comparing initial pH, post-addition pH, and net ΔpH.',
        whatIsIt: 'High-precision buffer ΔpH meter.',
        whatDoesItDo:
          'Displays how little pH changes within the pK_a ± 1 buffer window versus the sharp jump when buffer capacity is exceeded.',
      },
      {
        id: 'buffer_capacity_composition_display',
        name: 'Buffer Capacity & Composition Display',
        label: 'Buffer Capacity & Composition Display',
        shape: 'box',
        dimensions: [3.9, 2.6, 0.12],
        position: [2.2, 0.35, -0.3],
        color: '#0F172A',
        material: 'standard',
        description:
          '3D analytical display showing remaining [HA] and [A⁻] mole bars, Henderson–Hasselbalch ratio, and Buffer Capacity Comparison against a dilute buffer and unbuffered water.',
        whatIsIt: 'Conjugate Composition & Buffer Capacity Comparison Board.',
        whatDoesItDo:
          'Visualizes stoichiometric conversion between conjugate partners and compares ΔpH across high-capacity, low-capacity, and unbuffered solutions.',
      },
    ],
    equations: [
      '\\mathrm{pH} = \\mathrm{p}K_a + \\log_{10}\\left(\\frac{[\\mathrm{A^-}]}{[\\mathrm{HA}]}\\right)',
      '\\text{Add } \\mathrm{H^+}: \\mathrm{A^-} + \\mathrm{H^+} \\rightarrow \\mathrm{HA} \\quad (n_{\\mathrm{A^-}} \\downarrow,\\; n_{\\mathrm{HA}} \\uparrow)',
      '\\text{Add } \\mathrm{OH^-}: \\mathrm{HA} + \\mathrm{OH^-} \\rightarrow \\mathrm{A^-} + \\mathrm{H_2O} \\quad (n_{\\mathrm{HA}} \\downarrow,\\; n_{\\mathrm{A^-}} \\uparrow)',
    ],
    curiosityPrompts: [
      'How do the weak acid (HA) and conjugate base (A⁻) work together to neutralize both added strong acid and added strong base?',
      'Why does doubling the total concentration of both buffer components double the buffer capacity without changing the initial pH?',
      'Why does the Henderson–Hasselbalch approximation break down once strong acid or base completely exhausts one member of the conjugate pair?',
    ],
  },
};

export const CHEMISTRY_BATCH_2_MODEL_IDS = Object.values(CHEMISTRY_BATCH_2_MODELS).map((m) => m.id);


