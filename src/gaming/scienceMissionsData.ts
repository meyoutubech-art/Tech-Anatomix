import {
  DiscoveredModelGameCapability,
  discoverAllArenaModels,
  EvaluatedSimulationState,
} from './modelGameAdapter';
import { DifficultyTier, HybridGameMode } from './gameProgressStore';

export interface PredictionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface PredictionChallengeStage {
  question: string;
  contextPrompt: string;
  options: PredictionOption[];
  postExperimentTakeaway: string;
}

export interface ExperimentTargetCondition {
  description: string;
  metricKey: string;
  targetType: 'range' | 'exact_string' | 'boolean_true' | 'part_selection';
  minValue?: number;
  maxValue?: number;
  expectedString?: string;
  targetPartId?: string;
  targetPartName?: string;
  unit?: string;
}

export interface InteractiveExperimentStage {
  instruction: string;
  scientificGoal: string;
  targetCondition: ExperimentTargetCondition;
  hintText: string;
  successExplanation: string;
  recommendedReagentPool?: string[];
}

export interface PuzzleOption {
  id: string;
  label: string;
  isCorrect: boolean;
  scientificFeedback: string;
}

export interface SciencePuzzleStage {
  puzzleType: 'concept_verification' | 'quantitative_calculation' | 'structure_function' | 'sequence_order';
  prompt: string;
  formulaReference: string;
  options: PuzzleOption[];
  hintText: string;
}

export interface ScienceGameMission {
  id: string;
  modelId: string;
  secondaryModelId?: string;
  title: string;
  subtitle: string;
  category: 'Physics' | 'Chemistry' | 'Biology' | 'Anatomy' | 'Cross-Disciplinary';
  primaryMode: HybridGameMode;
  supportedModes: HybridGameMode[];
  difficulty: DifficultyTier;
  estimatedMinutes: number;
  baseXpReward: number;
  maxScore: number;
  isFeaturedDedicatedGame: boolean;
  governingEquation: string;
  scientificSummary: string;
  realWorldApplication: string;
  predictionStage: PredictionChallengeStage;
  experimentStage: InteractiveExperimentStage;
  puzzleStage: SciencePuzzleStage;
}

export const CURATED_SCIENCE_MISSIONS: ScienceGameMission[] = [
  // 1. Simple Pendulum — Harmonic Timekeeper Challenge
  {
    id: 'mission-pendulum-timekeeper',
    modelId: 'simple-pendulum',
    title: 'Pendulum Precision Timekeeper',
    subtitle: 'Calibrate a grandfather clock oscillator using Galilean isochronism',
    category: 'Physics',
    primaryMode: 'dedicated_game',
    supportedModes: ['dedicated_game', 'science_mission', 'prediction_challenge', 'interactive_experiment', 'science_puzzle'],
    difficulty: 'Beginner',
    estimatedMinutes: 4,
    baseXpReward: 250,
    maxScore: 300,
    isFeaturedDedicatedGame: true,
    governingEquation: 'T = 2π√(L / g)',
    scientificSummary:
      'For small release angles, the oscillation period T of a simple pendulum depends strictly on string length L and gravitational acceleration g, and is completely independent of the bob mass m.',
    realWorldApplication:
      'Used in mechanical Horology (seconds pendulum L ≈ 0.994 m gives T = 2.00 s) and gravimetric surveys to measure local variations in Earth’s gravitational field.',
    predictionStage: {
      question:
        'Before running the simulation: If you double the mass of the pendulum bob from 1.0 kg to 2.0 kg while keeping string length L and gravity g constant, how will the oscillation period T change?',
      contextPrompt: 'Consider how mass m appears in both gravitational restoring force (F = -mg sin θ) and inertia (ma).',
      options: [
        {
          id: 'opt_same',
          text: 'The period T remains completely unchanged because mass cancels out of the equation of motion.',
          isCorrect: true,
          explanation:
            'Correct! Because gravitational force scales with mass (F = mg) and inertial resistance also scales with mass (F = ma), m cancels out in a = -g sin θ, leaving T = 2π√(L/g).',
        },
        {
          id: 'opt_faster',
          text: 'The heavier bob swings faster, reducing the period T by half.',
          isCorrect: false,
          explanation:
            'Incorrect. While gravitational pull on the heavier bob is greater, its rotational inertia increases by the exact same factor, so angular acceleration and period remain unchanged.',
        },
        {
          id: 'opt_slower',
          text: 'The heavier bob swings slower, increasing the period T by √2.',
          isCorrect: false,
          explanation:
            'Incorrect. Period scales with √L, not √m. Changing mass does not alter the period in vacuum.',
        },
      ],
      postExperimentTakeaway:
        'You can verify this directly on the 3D pendulum: dragging the Bob Mass slider changes total mechanical energy (J), but Period (T) stays locked!',
    },
    experimentStage: {
      instruction:
        'Adjust the String Length (L) and Gravity (g) sliders on the live 3D Simple Pendulum until you calibrate a "Seconds Pendulum" with an oscillation Period (T) between 1.95 s and 2.08 s.',
      scientificGoal: 'Calibrate Period T ∈ [1.95 s, 2.08 s] (e.g., L ≈ 1.00 m at Earth gravity g = 9.81 m/s²).',
      targetCondition: {
        description: 'Oscillation Period T between 1.95 s and 2.08 s',
        metricKey: 'period',
        targetType: 'range',
        minValue: 1.95,
        maxValue: 2.08,
        unit: 's',
      },
      hintText:
        'Since T = 2π√(L/g), for T = 2.00 s on Earth (g = 9.81 m/s²), set String Length L to approximately 1.00 m.',
      successExplanation:
        'Target verified! At L ≈ 1.00 m and g = 9.81 m/s², T = 2π√(1.00 / 9.81) = 2.006 s — each single swing across takes exactly 1.00 second.',
    },
    puzzleStage: {
      puzzleType: 'quantitative_calculation',
      prompt:
        'If an astronaut takes this calibrated pendulum to a planetary surface where gravitational acceleration g is 1/4 of Earth’s gravity, how must the string length L be adjusted to keep the exact same period T?',
      formulaReference: 'T = 2π√(L / g) ⇒ L / g = constant',
      options: [
        {
          id: 'p_quarter',
          label: 'Shorten the string length L to 1/4 of its original length',
          isCorrect: true,
          scientificFeedback:
            'Exact! Since T ∝ √(L/g), keeping L/g constant when g decreases to g/4 requires L to also be reduced to L/4.',
        },
        {
          id: 'p_quadruple',
          label: 'Increase the string length L to 4 times its original length',
          isCorrect: false,
          scientificFeedback:
            'Not quite — increasing L by 4× while g is 1/4× would increase L/g by 16×, making the period 4 times slower!',
        },
        {
          id: 'p_half',
          label: 'Reduce the string length L to 1/2 of its original length',
          isCorrect: false,
          scientificFeedback:
            'Reducing L to 1/2 when g is 1/4 leaves L/g = 2×, increasing period T by √2.',
        },
      ],
      hintText: 'Keep the ratio (L / g) inside the square root equal to its Earth value.',
    },
  },

  // 2. Projectile Motion — Ballistic Range Proving Ground
  {
    id: 'mission-projectile-ballistics',
    modelId: 'projectile-motion',
    title: 'Ballistic Trajectory & Range Mission',
    subtitle: 'Master parabolic kinematics and orthogonal velocity vectors in 3D',
    category: 'Physics',
    primaryMode: 'dedicated_game',
    supportedModes: ['dedicated_game', 'science_mission', 'prediction_challenge', 'interactive_experiment', 'science_puzzle'],
    difficulty: 'Beginner',
    estimatedMinutes: 5,
    baseXpReward: 275,
    maxScore: 300,
    isFeaturedDedicatedGame: true,
    governingEquation: 'R = (v₀² sin 2θ) / g · H = (v₀ sin θ)² / (2g)',
    scientificSummary:
      'A projectile launched in a uniform gravitational field follows a parabola: horizontal velocity vₓ = v₀ cos θ remains constant (in vacuum), while vertical velocity vᵧ(t) = v₀ sin θ - gt changes linearly.',
    realWorldApplication:
      'Applied in sports biomechanics, firefighting water-cannon nozzles, planetary lander descent trajectories, and relief airdrop ballistics.',
    predictionStage: {
      question:
        'In a vacuum on level ground, which launch angle θ maximizes the horizontal range R for any fixed initial speed v₀?',
      contextPrompt: 'Look at the trigonometric factor sin(2θ) in the range formula R = (v₀² sin 2θ)/g.',
      options: [
        {
          id: 'opt_45',
          text: 'θ = 45°, because sin(2 × 45°) = sin(90°) = 1 (the maximum value of sine).',
          isCorrect: true,
          explanation:
            'Spot on! At θ = 45°, horizontal speed (v₀ cos 45°) and vertical hang-time (2v₀ sin 45°/g) are optimally balanced, maximizing sin(2θ) = 1.',
        },
        {
          id: 'opt_60',
          text: 'θ = 60°, because higher apex altitude always produces longer horizontal travel.',
          isCorrect: false,
          explanation:
            'Incorrect. While θ = 60° gives a higher apex than 45°, it sacrifices horizontal velocity vₓ = v₀ cos θ, reducing horizontal range to √3/2 ≈ 86.6% of the 45° maximum.',
        },
        {
          id: 'opt_30',
          text: 'θ = 30°, because horizontal velocity is higher.',
          isCorrect: false,
          explanation:
            'Incorrect. At θ = 30°, the projectile hits the ground too quickly; interestingly, 30° and 60° are complementary angles (30° + 60° = 90°) and yield the exact same range!',
        },
      ],
      postExperimentTakeaway:
        'Complementary angles θ and (90° - θ) always land at the exact same horizontal range R in vacuum because sin(2(90° - θ)) = sin(180° - 2θ) = sin(2θ).',
    },
    experimentStage: {
      instruction:
        'Use the Launch Speed (v₀) and Launch Angle (θ) sliders on the 3D Ballistic Launcher to land the projectile inside the target zone at a Horizontal Range (R) between 58.0 m and 66.0 m.',
      scientificGoal: 'Configure v₀ and θ so that Horizontal Range R ∈ [58.0 m, 66.0 m].',
      targetCondition: {
        description: 'Horizontal Range R between 58.0 m and 66.0 m',
        metricKey: 'horizontalRange',
        targetType: 'range',
        minValue: 58.0,
        maxValue: 66.0,
        unit: 'm',
      },
      hintText:
        'At θ = 45° on Earth (g = 9.81 m/s²), setting Launch Speed v₀ = 25 m/s gives R = 25² / 9.81 ≈ 63.7 m.',
      successExplanation:
        'Direct hit on the target zone! The parabolic arc satisfied R = (v₀² sin 2θ)/g within the 58–66 m target window.',
    },
    puzzleStage: {
      puzzleType: 'concept_verification',
      prompt:
        'At the very highest point (apex) of a projectile’s parabolic trajectory (launched at θ = 45°), what are its instantaneous vertical velocity vᵧ and vertical acceleration aᵧ?',
      formulaReference: 'vᵧ(t) = v₀ sin θ - g·t · aᵧ = -g',
      options: [
        {
          id: 'apex_correct',
          label: 'vᵧ = 0 m/s, while downward gravitational acceleration remains aᵧ = -g (-9.81 m/s²)',
          isCorrect: true,
          scientificFeedback:
            'Correct! At the apex, vertical velocity momentarily passes through zero as the projectile transitions from rising to falling, but gravity never turns off (aᵧ = -g throughout the entire flight).',
        },
        {
          id: 'apex_zero_both',
          label: 'Both vᵧ = 0 m/s and acceleration aᵧ = 0 m/s² at the apex',
          isCorrect: false,
          scientificFeedback:
            'Common misconception! If acceleration were zero when velocity was zero, the projectile would hover in mid-air forever instead of curving downward.',
        },
        {
          id: 'apex_zero_total',
          label: 'Total speed v = 0 m/s because the projectile stops moving at the top',
          isCorrect: false,
          scientificFeedback:
            'Incorrect. Only the vertical component vᵧ is zero at the apex; the horizontal velocity vₓ = v₀ cos θ remains non-zero!',
        },
      ],
      hintText: 'Does Earth’s gravity switch off when a ball reaches the peak of its toss?',
    },
  },

  // 3. Direct Current Circuit — Ohm's Law & Power Engineering
  {
    id: 'mission-dc-circuit-engineering',
    modelId: 'electric-circuit',
    title: "Ohm's Law & Filament Power Mission",
    subtitle: 'Balance battery EMF and load resistance to power a tungsten lamp safely',
    category: 'Physics',
    primaryMode: 'dedicated_game',
    supportedModes: ['dedicated_game', 'science_mission', 'prediction_challenge', 'interactive_experiment', 'science_puzzle'],
    difficulty: 'Beginner',
    estimatedMinutes: 4,
    baseXpReward: 260,
    maxScore: 300,
    isFeaturedDedicatedGame: true,
    governingEquation: 'I = V / R · P = V · I = V² / R',
    scientificSummary:
      "Electric current I in a closed ohmic loop is directly proportional to potential difference V and inversely proportional to resistance R. Thermal power dissipated in the filament follows Joule's Law: P = I²R = V²/R.",
    realWorldApplication:
      'Essential for designing circuit breakers, automotive fuses, LED current-limiting resistors, and power grid transmission lines.',
    predictionStage: {
      question:
        'If you double the Battery Voltage (V) across a fixed resistor (R = constant), what happens to the thermal Power (P) dissipated by the lamp filament?',
      contextPrompt: 'Combine I = V/R with P = V × I to express Power in terms of V and R.',
      options: [
        {
          id: 'opt_quad',
          text: 'Power P quadruples (increases by 4×) because both voltage V and current I double (P = V²/R).',
          isCorrect: true,
          explanation:
            'Correct! Doubling V also doubles I = V/R, so P = V × I = (2V)(2I) = 4VI. Power scales quadratically with voltage!',
        },
        {
          id: 'opt_double',
          text: 'Power P doubles (increases by 2×) linearly with voltage.',
          isCorrect: false,
          explanation:
            'Incorrect. Current I is not constant when V doubles across a fixed resistor — I doubles too, making P = V × I increase by 2 × 2 = 4×.',
        },
        {
          id: 'opt_half',
          text: 'Power P decreases by half.',
          isCorrect: false,
          explanation:
            'Incorrect. Increasing driving voltage across a fixed resistance increases both drift current and Joule heating.',
        },
      ],
      postExperimentTakeaway:
        'Quadratic power scaling (P = V²/R) explains why small overvoltages can rapidly burn out incandescent filaments or electronic components.',
    },
    experimentStage: {
      instruction:
        'Close the Knife Switch and adjust Battery Voltage (V) and Load Resistance (R) so the tungsten lamp operates in its high-efficiency illumination window: Thermal Power (P) between 18.0 W and 25.0 W without overheating (< 50 W).',
      scientificGoal: 'Close circuit switch and achieve Thermal Power P ∈ [18.0 W, 25.0 W].',
      targetCondition: {
        description: 'Thermal Power P between 18.0 W and 25.0 W',
        metricKey: 'power',
        targetType: 'range',
        minValue: 18.0,
        maxValue: 25.0,
        unit: 'W',
      },
      hintText:
        'Since P = V² / R, try setting Battery Voltage V = 15.0 V and Load Resistance R = 10.0 Ω (giving P = 225 / 10 = 22.5 W), or V = 12.0 V and R = 7.0 Ω (P = 20.57 W).',
      successExplanation:
        'Circuit stabilized! Your voltage and resistance values satisfy P = V²/R within the 18–25 W luminous operating band without exceeding the 50 W thermal limit.',
    },
    puzzleStage: {
      puzzleType: 'quantitative_calculation',
      prompt:
        'An ammeter measures a steady current of I = 1.50 A flowing through a resistor when connected to a V = 18.0 V DC source. What is the resistance R of the load?',
      formulaReference: 'R = V / I',
      options: [
        {
          id: 'r_12',
          label: '12.0 Ω',
          isCorrect: true,
          scientificFeedback: 'Correct! By Ohm’s Law, R = V / I = 18.0 V / 1.50 A = 12.0 Ω.',
        },
        {
          id: 'r_27',
          label: '27.0 Ω',
          isCorrect: false,
          scientificFeedback: '27.0 is V × I (which is Power P = 27.0 W, not Resistance R = V / I).',
        },
        {
          id: 'r_6',
          label: '6.0 Ω',
          isCorrect: false,
          scientificFeedback: 'At R = 6.0 Ω and V = 18.0 V, current would be 18 / 6 = 3.0 A.',
        },
      ],
      hintText: 'Divide potential difference V (18.0 V) by current I (1.50 A).',
    },
  },

  // 4. Chemistry Reaction Quest — Golden Rain & Precipitation Stoichiometry
  {
    id: 'mission-chemistry-precipitation-quest',
    modelId: 'standalone-chemistry-beaker-lab',
    title: 'Chemistry Reaction Quest: Golden Rain Synthesis',
    subtitle: 'Execute double-displacement salt metathesis in the 3D Beaker Simulator',
    category: 'Chemistry',
    primaryMode: 'dedicated_game',
    supportedModes: ['dedicated_game', 'science_mission', 'prediction_challenge', 'interactive_experiment', 'science_puzzle'],
    difficulty: 'Intermediate',
    estimatedMinutes: 5,
    baseXpReward: 300,
    maxScore: 300,
    isFeaturedDedicatedGame: true,
    governingEquation: 'Pb(NO₃)₂(aq) + 2KI(aq) → PbI₂(s)↓ + 2KNO₃(aq)',
    scientificSummary:
      'When colourless aqueous solutions of Lead(II) Nitrate and Potassium Iodide mix, Pb²⁺ and I⁻ ions exceed the solubility product constant (Ksp = 9.8 × 10⁻⁹), nucleating brilliant golden-yellow hexagonal crystals of Lead(II) Iodide (PbI₂↓).',
    realWorldApplication:
      'Used in qualitative inorganic cation analysis, gravimetric halide determination, and crystal nucleation kinetics demonstrations.',
    predictionStage: {
      question:
        'When colourless Lead(II) Nitrate [Pb(NO₃)₂(aq)] and colourless Potassium Iodide [KI(aq)] are poured together into the beaker, what observable phenomenon occurs and which ions remain dissolved as spectator ions?',
      contextPrompt: 'Apply aqueous solubility rules: all nitrates (NO₃⁻) and alkali metal salts (K⁺) are soluble, whereas heavy-metal halides like PbI₂ have very low Ksp.',
      options: [
        {
          id: 'chem_pbi2',
          text: 'A vivid yellow precipitate of PbI₂(s)↓ forms immediately, while K⁺(aq) and NO₃⁻(aq) remain in solution as spectator ions.',
          isCorrect: true,
          explanation:
            'Correct! Net ionic equation: Pb²⁺(aq) + 2I⁻(aq) → PbI₂(s)↓ (bright golden yellow). Potassium (K⁺) and nitrate (NO₃⁻) stay fully dissociated.',
        },
        {
          id: 'chem_kno3',
          text: 'A white precipitate of Potassium Nitrate (KNO₃↓) settles out while PbI₂ stays dissolved.',
          isCorrect: false,
          explanation:
            'Incorrect. Group 1 alkali metal nitrates like KNO₃ are highly soluble in water (over 300 g/L at 25°C) and do not precipitate.',
        },
        {
          id: 'chem_gas',
          text: 'Vigorous hydrogen gas bubbles evolve without any solid precipitate.',
          isCorrect: false,
          explanation:
            'Incorrect. Neither Pb(NO₃)₂ nor KI is an acid or active metal; this is an ion-exchange metathesis reaction, not a gas-forming redox reaction.',
        },
      ],
      postExperimentTakeaway:
        'In double-displacement precipitation, the driving force is the removal of mobile ions from solution into a low-entropy crystalline lattice (Qsp > Ksp).',
    },
    experimentStage: {
      instruction:
        'In the 3D Chemistry Beaker controls on the right, select reagents from the pool to synthesize any verified Precipitate-forming reaction (for example: Lead(II) Nitrate + Potassium Iodide, or Silver Nitrate + Sodium Chloride, or Copper(II) Sulfate + Sodium Hydroxide) and click Verify Experiment.',
      scientificGoal: 'Mix two compatible aqueous reagents that produce an insoluble solid precipitate (producesPrecipitate = 1).',
      targetCondition: {
        description: 'Synthesize an insoluble solid precipitate (Precipitate Formed)',
        metricKey: 'producesPrecipitate',
        targetType: 'range',
        minValue: 1,
        maxValue: 1,
        unit: '',
      },
      recommendedReagentPool: ['pb_no3_2', 'ki', 'agno3', 'nacl', 'cuso4', 'naoh', 'hcl', 'nahco3'],
      hintText:
        'Select Lead(II) Nitrate (Pb(NO₃)₂) + Potassium Iodide (KI) for golden PbI₂(s)↓, or Silver Nitrate (AgNO₃) + Sodium Chloride (NaCl) for white AgCl(s)↓.',
      successExplanation:
        'Precipitation verified in the 3D Beaker! The ionic product surpassed Ksp, nucleating an insoluble solid phase rendered directly at the bottom of the reaction vessel.',
    },
    puzzleStage: {
      puzzleType: 'quantitative_calculation',
      prompt:
        'According to the balanced equation Pb(NO₃)₂(aq) + 2KI(aq) → PbI₂(s)↓ + 2KNO₃(aq), how many moles of Potassium Iodide (KI) are required to completely precipitate 1.5 moles of Lead(II) Nitrate?',
      formulaReference: '1 mol Pb(NO₃)₂ : 2 mol KI → 1 mol PbI₂↓',
      options: [
        {
          id: 'mol_3',
          label: '3.0 moles of KI (stoichiometric ratio 2 : 1)',
          isCorrect: true,
          scientificFeedback:
            'Exact stoichiometry! Because each divalent Pb²⁺ ion requires two monovalent I⁻ ions to form electrically neutral PbI₂, 1.5 mol × 2 = 3.0 mol KI.',
        },
        {
          id: 'mol_15',
          label: '1.5 moles of KI (1 : 1 ratio)',
          isCorrect: false,
          scientificFeedback:
            '1.5 moles of KI would only provide half the required iodide ions, leaving 0.75 moles of Pb²⁺ unreacted as excess reagent.',
        },
        {
          id: 'mol_075',
          label: '0.75 moles of KI',
          isCorrect: false,
          scientificFeedback:
            'That divides by 2 instead of multiplying by the stoichiometric coefficient 2.',
        },
      ],
      hintText: 'Each Pb²⁺ cation carries a +2 charge and pairs with two I⁻ anions (-1 each).',
    },
  },

  // 5. Chemistry Reaction Quest II — Effervescent Gas Evolution
  {
    id: 'mission-chemistry-effervescence-quest',
    modelId: 'standalone-chemistry-beaker-lab',
    title: 'Chemistry Reaction Quest: Gas Effervescence Lab',
    subtitle: 'Drive acid-carbonate decarboxylation and active-metal hydrogen evolution',
    category: 'Chemistry',
    primaryMode: 'science_mission',
    supportedModes: ['science_mission', 'prediction_challenge', 'interactive_experiment', 'science_puzzle'],
    difficulty: 'Beginner',
    estimatedMinutes: 4,
    baseXpReward: 260,
    maxScore: 300,
    isFeaturedDedicatedGame: true,
    governingEquation: 'HCl(aq) + NaHCO₃(s) → NaCl(aq) + H₂O(l) + CO₂(g)↑',
    scientificSummary:
      'Proton transfer from an acid to a carbonate or bicarbonate ion forms transient carbonic acid (H₂CO₃), which spontaneously decarboxylates into liquid water and escaping carbon dioxide gas bubbles (CO₂↑).',
    realWorldApplication:
      'Powers chemical fire extinguishers, baking leavening agents, antacid stomach neutralization, and geological karst cave formation.',
    predictionStage: {
      question:
        'When Hydrochloric Acid [HCl(aq)] is added to Sodium Bicarbonate [NaHCO₃], why does the reaction proceed irreversibly to completion at room temperature?',
      contextPrompt: 'Consider Le Chatelier’s Principle when one of the products is a gas escaping from an open beaker.',
      options: [
        {
          id: 'gas_escape',
          text: 'Unstable H₂CO₃ decomposes into CO₂(g)↑, which nucleates bubbles and escapes the solution, continuously pulling the equilibrium forward.',
          isCorrect: true,
          explanation:
            'Correct! Because CO₂(g) has limited solubility and escapes into the atmosphere, the reverse reaction cannot occur and entropy (ΔS > 0) strongly favors complete conversion.',
        },
        {
          id: 'gas_ppt',
          text: 'Sodium Chloride (NaCl) precipitates as an insoluble rock at the bottom of the beaker.',
          isCorrect: false,
          explanation:
            'Incorrect. NaCl has high aqueous solubility (~360 g/L) and remains completely dissolved as Na⁺(aq) and Cl⁻(aq).',
        },
        {
          id: 'gas_freeze',
          text: 'The solution freezes solid at 25°C.',
          isCorrect: false,
          explanation:
            'Incorrect. While NaHCO₃ + HCl is mildly endothermic, the aqueous solution remains liquid while evolving CO₂ bubbles.',
        },
      ],
      postExperimentTakeaway:
        'Gas-evolution reactions are driven by both enthalpy and a large positive entropy change (ΔS > 0) as condensed-phase ions generate a free gas.',
    },
    experimentStage: {
      instruction:
        'Select two reagents in the 3D Chemistry Beaker Deck that react to evolve gas bubbles (for example: Hydrochloric Acid + Sodium Bicarbonate, or Zinc Metal + Hydrochloric Acid) and verify the gas evolution state.',
      scientificGoal: 'Trigger a verified gas-evolving reaction in the 3D beaker (producesGas = 1).',
      targetCondition: {
        description: 'Active Gas Evolution in 3D Beaker (producesGas = 1)',
        metricKey: 'producesGas',
        targetType: 'range',
        minValue: 1,
        maxValue: 1,
        unit: '',
      },
      recommendedReagentPool: ['hcl', 'nahco3', 'zn', 'ch3cooh', 'caco3', 'mg', 'naoh', 'cuso4'],
      hintText:
        'Combine Hydrochloric Acid (HCl) with Sodium Bicarbonate (NaHCO₃) for CO₂(g)↑, or Zinc (Zn) with Hydrochloric Acid (HCl) for H₂(g)↑.',
      successExplanation:
        'Effervescence confirmed! The 3D Beaker Simulator is actively nucleating gas bubbles and updating the stoichiometric reaction telemetry.',
    },
    puzzleStage: {
      puzzleType: 'concept_verification',
      prompt:
        'How can you chemically distinguish Carbon Dioxide gas (CO₂↑, evolved from Acid + Carbonate) from Hydrogen gas (H₂↑, evolved from Active Metal + Acid) in a school laboratory?',
      formulaReference: 'CO₂(g) + Ca(OH)₂(aq) → CaCO₃(s)↓ + H₂O(l)',
      options: [
        {
          id: 'test_limewater',
          label: 'CO₂ turns clear limewater [Ca(OH)₂] milky due to CaCO₃↓ precipitation and extinguishes a splint, whereas H₂ burns with a characteristic squeaky pop.',
          isCorrect: true,
          scientificFeedback:
            'Spot on! Bubbling CO₂ through limewater precipitates white calcium carbonate (CaCO₃↓), whereas H₂ is flammable (2H₂ + O₂ → 2H₂O) and produces a pop test.',
        },
        {
          id: 'test_reverse',
          label: 'H₂ turns limewater milky, whereas CO₂ burns with a squeaky pop.',
          isCorrect: false,
          scientificFeedback:
            'Reversed! Carbon dioxide is fully oxidized (C is in its +4 oxidation state) and is non-flammable.',
        },
        {
          id: 'test_color',
          label: 'CO₂ is a dense purple gas, whereas H₂ is bright green.',
          isCorrect: false,
          scientificFeedback:
            'Both CO₂ and H₂ are completely colourless, odourless gases at standard temperature and pressure.',
        },
      ],
      hintText: 'Recall the classic limewater [Ca(OH)₂] test for carbon dioxide.',
    },
  },

  // 6. Pascal's Hydraulic Lift — Force Multiplier Challenge
  {
    id: 'mission-hydraulic-force-multiplier',
    modelId: 'hydraulic-lift',
    title: "Pascal's Hydraulic Force Multiplier",
    subtitle: 'Amplify input force across incompressible fluid cylinders',
    category: 'Physics',
    primaryMode: 'dedicated_game',
    supportedModes: ['dedicated_game', 'science_mission', 'prediction_challenge', 'interactive_experiment', 'science_puzzle'],
    difficulty: 'Intermediate',
    estimatedMinutes: 4,
    baseXpReward: 275,
    maxScore: 300,
    isFeaturedDedicatedGame: true,
    governingEquation: 'P = F₁ / A₁ = F₂ / A₂ ⇒ F₂ = F₁ × (A₂ / A₁)',
    scientificSummary:
      "By Pascal's Principle, pressure applied to an enclosed incompressible fluid is transmitted undiminished to every portion of the fluid and cylinder walls, multiplying output force by the cross-sectional area ratio A₂/A₁.",
    realWorldApplication:
      'Powers automotive service lifts, hydraulic excavator arms, aircraft landing gear actuators, and hydraulic disc brakes.',
    predictionStage: {
      question:
        'If a hydraulic lift has an output piston area A₂ that is 8 times larger than the input piston area A₁ (A₂/A₁ = 8), how does the distance d₂ moved by the heavy output piston compare to the distance d₁ pushed by the input piston?',
      contextPrompt: 'Consider conservation of mechanical work (W_in = W_out ⇒ F₁ d₁ = F₂ d₂) and fluid volume (A₁ d₁ = A₂ d₂).',
      options: [
        {
          id: 'hyd_eight',
          text: 'The output piston rises by 1/8 of the input stroke distance (d₂ = d₁ / 8), conserving total fluid volume and mechanical work.',
          isCorrect: true,
          explanation:
            'Correct! A hydraulic machine multiplies force by 8×, never energy. Because incompressible fluid volume V = A₁d₁ = A₂d₂ is conserved, d₂ = d₁ / 8.',
        },
        {
          id: 'hyd_same',
          text: 'Both pistons move the exact same vertical distance (d₂ = d₁) while force increases 8×.',
          isCorrect: false,
          explanation:
            'Incorrect. Moving 8× the force through the same distance would create 8× more energy out of nothing, violating Conservation of Energy!',
        },
        {
          id: 'hyd_more',
          text: 'The output piston moves 8 times farther than the input piston.',
          isCorrect: false,
          explanation:
            'Incorrect. The wider cylinder requires 8× more fluid volume per centimeter of lift, so it rises 1/8 as far.',
        },
      ],
      postExperimentTakeaway:
        'Mechanical advantage (F₂/F₁ = A₂/A₁) is always traded against displacement ratio (d₁/d₂ = A₂/A₁), keeping work W = F·d invariant.',
    },
    experimentStage: {
      instruction:
        'Adjust the Hydraulic Lift parameters so that the Output Lift Force (F₂) reaches at least 900 N to hoist the heavy industrial load.',
      scientificGoal: 'Configure input force and piston area ratio so Output Force F₂ ≥ 900 N.',
      targetCondition: {
        description: 'Output Lift Force F₂ between 900 N and 5000 N',
        metricKey: 'outputForce',
        targetType: 'range',
        minValue: 900,
        maxValue: 5000,
        unit: 'N',
      },
      hintText:
        'Increase Input Force (F₁) or Piston Area Ratio (A₂/A₁) so that F₁ × (A₂/A₁) ≥ 900 N.',
      successExplanation:
        'Load lifted! Fluid pressure P = F₁/A₁ transmitted uniformly across the master cylinder to generate over 900 N of upward force.',
    },
    puzzleStage: {
      puzzleType: 'quantitative_calculation',
      prompt:
        'A technician applies F₁ = 200 N to a small piston of area A₁ = 0.01 m². What upward force F₂ is exerted on the vehicle platform piston of area A₂ = 0.06 m²?',
      formulaReference: 'F₂ = F₁ × (A₂ / A₁)',
      options: [
        {
          id: 'f2_1200',
          label: '1,200 N (Area ratio = 6×)',
          isCorrect: true,
          scientificFeedback:
            'Correct! The area ratio is A₂ / A₁ = 0.06 / 0.01 = 6, so F₂ = 200 N × 6 = 1,200 N.',
        },
        {
          id: 'f2_200',
          label: '200 N (Force is equal on both pistons)',
          isCorrect: false,
          scientificFeedback:
            'Pressure P (in Pascals) is equal on both pistons, not Force F = P × A!',
        },
        {
          id: 'f2_33',
          label: '33.3 N',
          isCorrect: false,
          scientificFeedback:
            'That divides by the area ratio instead of multiplying.',
        },
      ],
      hintText: 'First find the area ratio A₂ / A₁ = 0.06 / 0.01, then multiply by F₁ = 200 N.',
    },
  },

  // 7. Wave Motion & Acoustic Resonance
  {
    id: 'mission-wave-propagation-challenge',
    modelId: 'wave-motion',
    title: 'Wave Mechanics & Phase Velocity Challenge',
    subtitle: 'Control frequency, wavelength, and amplitude across coupled oscillators',
    category: 'Physics',
    primaryMode: 'dedicated_game',
    supportedModes: ['dedicated_game', 'science_mission', 'prediction_challenge', 'interactive_experiment', 'science_puzzle'],
    difficulty: 'Intermediate',
    estimatedMinutes: 4,
    baseXpReward: 270,
    maxScore: 300,
    isFeaturedDedicatedGame: true,
    governingEquation: 'v = f · λ · E ∝ A²',
    scientificSummary:
      'In a transverse mechanical wave, individual medium particles oscillate perpendicular to the direction of energy propagation while wave crests travel at phase velocity v = fλ.',
    realWorldApplication:
      'Governs seismic S-waves, vibrating strings on musical instruments, water surface ripples, and electromagnetic antenna arrays.',
    predictionStage: {
      question:
        'As a transverse wave travels from left to right across the 28-node oscillator array, how does any single colored oscillator sphere move?',
      contextPrompt: 'Distinguish between the transport of wave energy and the motion of individual medium particles.',
      options: [
        {
          id: 'wave_perp',
          text: 'Each sphere oscillates vertically up and down about its equilibrium position without traveling horizontally across the bench.',
          isCorrect: true,
          explanation:
            'Correct! Waves transport energy and phase, not matter. In a transverse wave, particle displacement is strictly perpendicular (vertical) to wave propagation (horizontal).',
        },
        {
          id: 'wave_horiz',
          text: 'Each sphere travels continuously from the left end of the apparatus to the right end.',
          isCorrect: false,
          explanation:
            'Incorrect. Watch a single sphere in the 3D viewport: it stays at its fixed horizontal coordinate x while executing vertical simple harmonic motion y(x,t) = A sin(kx - ωt).',
        },
        {
          id: 'wave_static',
          text: 'The spheres remain stationary while only light moves across them.',
          isCorrect: false,
          explanation:
            'Incorrect. Each node executes real harmonic vertical oscillation.',
        },
      ],
      postExperimentTakeaway:
        'Transverse waves have particle velocity ∂y/∂t perpendicular to phase velocity v = ω/k = fλ.',
    },
    experimentStage: {
      instruction:
        'Adjust the Wave Motion controls so that the Phase Velocity (v = f × λ) or Frequency/Amplitude reaches a high-frequency oscillation state (Frequency f ≥ 2.5 Hz or Wave Speed v ≥ 7.0 m/s).',
      scientificGoal: 'Tune wave parameters so Phase Velocity v ≥ 7.0 m/s (or Frequency ≥ 2.5 Hz).',
      targetCondition: {
        description: 'Wave Phase Velocity v between 7.0 m/s and 30.0 m/s',
        metricKey: 'waveSpeed',
        targetType: 'range',
        minValue: 7.0,
        maxValue: 30.0,
        unit: 'm/s',
      },
      hintText:
        'Increase the Frequency (f) slider above 2.5 Hz so that v = f × λ exceeds 7.0 m/s.',
      successExplanation:
        'High-velocity wave propagation verified! Increasing driving frequency f directly accelerates the phase progression across the coupled nodes.',
    },
    puzzleStage: {
      puzzleType: 'quantitative_calculation',
      prompt:
        'A periodic wave has a frequency of f = 4.0 Hz and a crest-to-crest wavelength of λ = 2.5 m. What is its wave propagation speed v?',
      formulaReference: 'v = f × λ',
      options: [
        {
          id: 'v_10',
          label: '10.0 m/s',
          isCorrect: true,
          scientificFeedback:
            'Exact! v = f × λ = 4.0 s⁻¹ × 2.5 m = 10.0 m/s.',
        },
        {
          id: 'v_16',
          label: '1.6 m/s',
          isCorrect: false,
          scientificFeedback:
            '1.6 is f / λ, whereas wave speed is the product f × λ.',
        },
        {
          id: 'v_65',
          label: '6.5 m/s',
          isCorrect: false,
          scientificFeedback:
            '6.5 is the sum f + λ; units of Hz (s⁻¹) and meters multiply to give m/s.',
        },
      ],
      hintText: 'Multiply frequency f (4.0 Hz) by wavelength λ (2.5 m).',
    },
  },

  // 8. Eukaryotic Cell Explorer — Bioenergetics & Organelle Mission
  {
    id: 'mission-biology-eukaryotic-cell',
    modelId: 'standalone-eukaryotic-cell-scene',
    title: 'Eukaryotic Cell Bioenergetics & Organelle Quest',
    subtitle: 'Inspect 3D cellular organelles and trace ATP synthesis & genetic control',
    category: 'Biology',
    primaryMode: 'dedicated_game',
    supportedModes: ['dedicated_game', 'science_mission', 'prediction_challenge', 'interactive_experiment', 'science_puzzle'],
    difficulty: 'Beginner',
    estimatedMinutes: 4,
    baseXpReward: 260,
    maxScore: 300,
    isFeaturedDedicatedGame: true,
    governingEquation: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ~36 ATP',
    scientificSummary:
      'Eukaryotic cells compartmentalize biochemical pathways into membrane-bound organelles: the Nucleus safeguards genomic DNA, Mitochondria generate ATP via oxidative phosphorylation across cristae, and Ribosomes/ER/Golgi synthesize and traffic proteins.',
    realWorldApplication:
      'Foundation of molecular medicine, pharmacology, mitochondrial disease research, and biotechnology.',
    predictionStage: {
      question:
        'Why do cardiac muscle cells (cardiomyocytes) contain thousands of Mitochondria (up to 40% of cytoplasmic volume), whereas resting skin fibroblasts contain far fewer?',
      contextPrompt: 'Relate organelle abundance to the continuous mechanical work performed by the heart.',
      options: [
        {
          id: 'bio_mito_atp',
          text: 'Mitochondria synthesize ATP via aerobic cellular respiration; continuous cardiac contraction demands an immense, uninterrupted ATP supply.',
          isCorrect: true,
          explanation:
            'Correct! Across their folded inner cristae, mitochondria run the electron transport chain and ATP synthase to fuel myosin-actin cross-bridge cycling.',
        },
        {
          id: 'bio_mito_dna',
          text: 'Mitochondria store 100% of the human chromosomal genome.',
          isCorrect: false,
          explanation:
            'Incorrect. While mitochondria carry a small circular mtDNA genome (37 genes), over 99% of human genomic DNA resides inside the Nucleus.',
        },
        {
          id: 'bio_mito_light',
          text: 'Mitochondria capture sunlight to perform photosynthesis in human cells.',
          isCorrect: false,
          explanation:
            'Incorrect. Photosynthesis occurs in plant Chloroplasts, not animal Mitochondria.',
        },
      ],
      postExperimentTakeaway:
        'Structure matches function at the subcellular scale: inner mitochondrial membrane folding (cristae) maximizes surface area for oxidative phosphorylation.',
    },
    experimentStage: {
      instruction:
        'In the interactive 3D Eukaryotic Cell viewport (or Organelle Selector), locate and select the "Mitochondria" organelle to inspect its double-membrane cristae and verify its ATP synthesis role.',
      scientificGoal: 'Select the Mitochondria (id: "mitochondria") in the 3D Cell model.',
      targetCondition: {
        description: 'Select Organelle: Mitochondria',
        metricKey: 'selectedPartId',
        targetType: 'part_selection',
        targetPartId: 'mitochondria',
        targetPartName: 'Mitochondria',
      },
      hintText:
        'Click directly on one of the capsule-shaped orange/red Mitochondria organelles in the 3D cell or select "Mitochondria" from the 3D Structure Inspector buttons.',
      successExplanation:
        'Organelle locked! You selected the Mitochondrion — the double-membrane bioenergetic powerhouse where the Krebs cycle and oxidative phosphorylation produce cellular ATP.',
    },
    puzzleStage: {
      puzzleType: 'structure_function',
      prompt:
        'After a secretory protein (such as insulin) is synthesized by ribosomes on the Rough Endoplasmic Reticulum, which organelle receives, modifies, sorts, and packages it into secretory vesicles for export?',
      formulaReference: 'DNA → mRNA → Rough ER → Golgi Apparatus → Secretory Vesicle',
      options: [
        {
          id: 'golgi_correct',
          label: 'Golgi Apparatus (Golgi Complex)',
          isCorrect: true,
          scientificFeedback:
            'Correct! Cisternae of the Golgi Apparatus perform post-translational glycosylation and package proteins into membrane vesicles bound for exocytosis.',
        },
        {
          id: 'lysosome_wrong',
          label: 'Lysosome',
          isCorrect: false,
          scientificFeedback:
            'Lysosomes contain acidic hydrolytic enzymes (pH ~4.8) that digest cellular waste and foreign pathogens rather than packaging secretory hormones.',
        },
        {
          id: 'nucleolus_wrong',
          label: 'Nucleolus',
          isCorrect: false,
          scientificFeedback:
            'The nucleolus transcribes ribosomal RNA (rRNA) inside the nucleus; it does not package vesicles in the cytoplasm.',
        },
      ],
      hintText: 'Think of the flattened stack of membrane sacs that acts as the cell’s post office and sorting center.',
    },
  },

  // 9. Human Heart & Hemodynamics Explorer
  {
    id: 'mission-biology-human-heart',
    modelId: 'standalone-human-heart-scene',
    title: 'Cardiac Hemodynamics & Double Circulation Quest',
    subtitle: 'Trace oxygenated vs deoxygenated blood pathways across the 4-chamber human heart',
    category: 'Biology',
    primaryMode: 'dedicated_game',
    supportedModes: ['dedicated_game', 'science_mission', 'prediction_challenge', 'interactive_experiment', 'science_puzzle'],
    difficulty: 'Intermediate',
    estimatedMinutes: 5,
    baseXpReward: 280,
    maxScore: 300,
    isFeaturedDedicatedGame: true,
    governingEquation: 'CO = HR × SV · ΔP = Q × R_vascular',
    scientificSummary:
      'The mammalian four-chambered heart separates pulmonary (low-pressure lung oxygenation) and systemic (high-pressure body perfusion) circuits completely, preventing mixing of oxygenated and deoxygenated blood.',
    realWorldApplication:
      'Forms the physiological basis of echocardiography, valve replacement surgery, blood pressure regulation, and exercise cardiology.',
    predictionStage: {
      question:
        'Why is the muscular myocardium wall of the Left Ventricle approximately 3 times thicker than the wall of the Right Ventricle, even though both chambers pump the exact same stroke volume (~70 mL) per beat?',
      contextPrompt: 'Compare the vascular resistance and distance of the Systemic Circuit (entire body) vs. the Pulmonary Circuit (lungs right next to the heart).',
      options: [
        {
          id: 'heart_lv_pressure',
          text: 'The Left Ventricle must generate ~120 mmHg systolic pressure to overcome high systemic vascular resistance and perfuse the entire body, whereas the Right Ventricle pumps only to the nearby low-resistance lungs (~25 mmHg).',
          isCorrect: true,
          explanation:
            'Exact physiological reasoning! By Laplace’s Law, generating 5× higher systolic pressure (120 mmHg vs 25 mmHg) requires a substantially thicker ventricular myocardium.',
        },
        {
          id: 'heart_lv_volume',
          text: 'The Left Ventricle pumps 3 times more blood volume per minute than the Right Ventricle.',
          isCorrect: false,
          explanation:
            'Incorrect! Because the pulmonary and systemic circuits are connected in series, Left and Right Cardiac Output must be equal (~5 L/min), otherwise fluid would rapidly back up in the lungs.',
        },
        {
          id: 'heart_lv_temp',
          text: 'Oxygenated blood is 3 times heavier than deoxygenated blood.',
          isCorrect: false,
          explanation:
            'Incorrect. Oxygen binding to hemoglobin negligibly changes blood density.',
        },
      ],
      postExperimentTakeaway:
        'Both ventricles eject ~70 mL per beat in series, but the Left Ventricle performs ~5× more mechanical stroke work (W = ∫P dV) against systemic arterial pressure.',
    },
    experimentStage: {
      instruction:
        'In the 3D Human Heart viewport or Structure Inspector, select the "Aorta" (id: "aorta") — the largest systemic artery that receives high-pressure oxygenated blood ejected from the Left Ventricle.',
      scientificGoal: 'Identify and select the Aorta (id: "aorta") on the 3D Heart model.',
      targetCondition: {
        description: 'Select Cardiac Structure: Aorta',
        metricKey: 'selectedPartId',
        targetType: 'part_selection',
        targetPartId: 'aorta',
        targetPartName: 'Aorta',
      },
      hintText:
        'Click the large superiorarching red arterial vessel (Aorta) or choose "Aorta" in the 3D Structure Inspector.',
      successExplanation:
        'Anatomical structure verified! The Aorta arches superiorly from the Left Ventricle via the aortic semilunar valve to distribute oxygenated blood to the systemic circulation.',
    },
    puzzleStage: {
      puzzleType: 'sequence_order',
      prompt:
        'Which sequence correctly traces a red blood cell returning from the body (via the Vena Cava) through the heart to the Aorta?',
      formulaReference: 'Vena Cava → Right Heart → Lungs → Left Heart → Aorta',
      options: [
        {
          id: 'seq_correct',
          label: 'Right Atrium → Right Ventricle → Pulmonary Artery → Lungs → Pulmonary Vein → Left Atrium → Left Ventricle → Aorta',
          isCorrect: true,
          scientificFeedback:
            'Perfect hemodynamic trace! Deoxygenated blood enters the Right Atrium, is pumped by the Right Ventricle via the Pulmonary Artery to the lungs, returns oxygenated via the Pulmonary Veins to the Left Atrium, and is ejected by the Left Ventricle into the Aorta.',
        },
        {
          id: 'seq_wrong1',
          label: 'Left Atrium → Left Ventricle → Pulmonary Vein → Lungs → Right Atrium → Right Ventricle → Aorta',
          isCorrect: false,
          scientificFeedback:
            'Reversed! Systemic venous blood enters the Right Atrium first, and the Left Ventricle is the chamber that ejects into the Aorta.',
        },
        {
          id: 'seq_wrong2',
          label: 'Right Atrium → Left Atrium → Right Ventricle → Left Ventricle → Aorta (skipping the lungs)',
          isCorrect: false,
          scientificFeedback:
            'In a healthy adult heart, the interatrial and interventricular septa prevent direct right-to-left shunting; blood must pass through the pulmonary capillary bed first.',
        },
      ],
      hintText: 'Remember: Arteries carry blood Away from the heart (Pulmonary Artery goes to the lungs; Aorta goes to the body).',
    },
  },

  // 10. Mixed Science Mission — Electromechanical Energy Conversion Odyssey
  {
    id: 'mission-mixed-energy-conversion',
    modelId: 'dc-motor',
    secondaryModelId: 'ac-generator',
    title: 'Mixed Science Mission: Lorentz Motor & Faraday Induction',
    subtitle: 'Bridge electrical-to-mechanical torque (DC Motor) and mechanical-to-electrical EMF (Generator)',
    category: 'Cross-Disciplinary',
    primaryMode: 'mixed_mission',
    supportedModes: ['mixed_mission', 'dedicated_game', 'science_mission', 'prediction_challenge', 'interactive_experiment', 'science_puzzle'],
    difficulty: 'Advanced',
    estimatedMinutes: 6,
    baseXpReward: 350,
    maxScore: 300,
    isFeaturedDedicatedGame: true,
    governingEquation: 'F_Lorentz = I(L × B) · ε_Faraday = -N dΦ_B / dt',
    scientificSummary:
      'A DC Electric Motor and an AC Generator are physical duals governed by electromagnetism: feeding current I into a coil inside a magnetic field B produces Lorentz torque τ = NIAB sin θ (Motor), whereas mechanically rotating the coil changes magnetic flux Φ_B = BA cos(ωt) to induce voltage ε = NBAω sin(ωt) (Generator).',
    realWorldApplication:
      'Regenerative braking in electric vehicles switches a traction motor into an electromagnetic generator during deceleration to recharge the battery pack.',
    predictionStage: {
      question:
        'Why does a DC Electric Motor require a Split-Ring Commutator, whereas an AC Generator uses continuous Slip Rings?',
      contextPrompt: 'Consider what happens to the torque direction on an armature coil every 180° (half-turn) in a uniform magnetic field.',
      options: [
        {
          id: 'em_commutator',
          text: 'The split-ring commutator reverses armature current direction every 180° (half-turn) so that Lorentz torque τ continues pushing the rotor in the same clockwise/counterclockwise direction.',
          isCorrect: true,
          explanation:
            'Correct! Without current reversal every half-turn, Lorentz forces on the two coil sides would flip sign past the vertical neutral plane and cause the coil to oscillate back and forth instead of spinning continuously.',
        },
        {
          id: 'em_friction',
          text: 'The split-ring commutator is only used to cool down the permanent stator magnets.',
          isCorrect: false,
          explanation:
            'Incorrect. The commutator is a rotary electrical switch mounted on the rotor shaft that reverses current polarity every half-revolution.',
        },
        {
          id: 'em_gravity',
          text: 'The split-ring commutator shields the copper wire from Earth’s gravity.',
          isCorrect: false,
          explanation:
            'Incorrect. Commutation is purely an electromagnetic polarity-switching mechanism.',
        },
      ],
      postExperimentTakeaway:
        'Motor-Generator Duality: Fleming’s Left-Hand Rule governs motor force (F = ILB), while Fleming’s Right-Hand Rule (Faraday’s Law) governs generator induced EMF.',
    },
    experimentStage: {
      instruction:
        'In the 3D DC Electric Motor viewport, inspect the electromagnetic assembly and select the "Split-Ring Commutator" (or adjust the motor speed/current parameter if available) to verify how rotary commutation sustains continuous torque.',
      scientificGoal: 'Select the Split-Ring Commutator (id: "commutator") or Armature Coil (id: "armature-coil") on the 3D Motor model.',
      targetCondition: {
        description: 'Select 3D Part: Split-Ring Commutator or Armature Coil',
        metricKey: 'selectedPartId',
        targetType: 'part_selection',
        targetPartId: 'commutator',
        targetPartName: 'Split-Ring Commutator',
      },
      hintText:
        'Click the Split-Ring Commutator in the 3D Structure Inspector list or directly on the rotor shaft in the 3D viewport.',
      successExplanation:
        'Electromechanical commutation verified! Reversing current polarity every 180° keeps the magnetic dipole torque unidirectional across all 360° of rotation.',
    },
    puzzleStage: {
      puzzleType: 'concept_verification',
      prompt:
        'In an electric vehicle using regenerative braking, the wheels drive the motor shaft mechanically while the driver slows down. Which physical law explains how this generates electric current to recharge the lithium-ion battery?',
      formulaReference: 'ε = -N dΦ_B / dt (Faraday’s Law of Electromagnetic Induction)',
      options: [
        {
          id: 'faraday_law',
          label: "Faraday's Law of Electromagnetic Induction & Lenz's Law (changing magnetic flux induces EMF and braking counter-torque)",
          isCorrect: true,
          scientificFeedback:
            "Exact! Mechanical rotation changes magnetic flux Φ_B through the windings (Faraday's Law), and the induced current creates an opposing magnetic torque (Lenz's Law) that slows the vehicle while charging the battery.",
        },
        {
          id: 'snell_law',
          label: "Snell's Law of Optical Refraction",
          isCorrect: false,
          scientificFeedback:
            "Snell's Law governs light bending across dielectric boundaries, not electromagnetic induction.",
        },
        {
          id: 'boyle_law',
          label: "Boyle's Law of Ideal Gas Compression",
          isCorrect: false,
          scientificFeedback:
            "Boyle's Law (P₁V₁ = P₂V₂) describes isothermal gas compression, not electric motor-generator conversion.",
        },
      ],
      hintText: 'Which law relates a time-varying magnetic flux (dΦ_B/dt) to an induced electromotive force (ε)?',
    },
  },
];

/**
 * Deterministically synthesizes a scientifically grounded, validated mission for any
 * suitable model in the Tech-Anatomix registry that does not have a hand-authored campaign.
 * Uses only the model's real parameters, parts, scientificPrinciple, and concept metadata.
 */
export function buildValidatedMissionForCapability(
  cap: DiscoveredModelGameCapability
): ScienceGameMission {
  const existing = CURATED_SCIENCE_MISSIONS.find((m) => m.modelId === cap.modelId);
  if (existing) return existing;

  const firstParam = cap.adjustableParameters[0];
  const firstPart = cap.selectableParts[0];
  const secondPart = cap.selectableParts[1] || cap.selectableParts[0];

  // Determine target condition based on actual model capabilities
  let experimentStage: InteractiveExperimentStage;
  if (firstParam) {
    const span = firstParam.max - firstParam.min;
    // Pick a target window away from the default value so the player must actively adjust the simulation
    const defaultNorm = span > 0 ? (firstParam.defaultValue - firstParam.min) / span : 0.5;
    const targetCenter =
      defaultNorm < 0.65
        ? firstParam.min + span * 0.8
        : firstParam.min + span * 0.25;
    const halfWindow = Math.max(firstParam.step || 0.1, span * 0.12);
    const minVal = Number(Math.max(firstParam.min, targetCenter - halfWindow).toFixed(2));
    const maxVal = Number(Math.min(firstParam.max, targetCenter + halfWindow).toFixed(2));

    experimentStage = {
      instruction: `Use the interactive 3D parameter deck to calibrate "${firstParam.name}" into the target operational window [${minVal}${firstParam.unit ? ` ${firstParam.unit}` : ''} – ${maxVal}${firstParam.unit ? ` ${firstParam.unit}` : ''}] and observe the real-time 3D response.`,
      scientificGoal: `Set ${firstParam.name} between ${minVal} and ${maxVal} ${firstParam.unit || ''}`.trim(),
      targetCondition: {
        description: `${firstParam.name} ∈ [${minVal}, ${maxVal}] ${firstParam.unit || ''}`.trim(),
        metricKey: firstParam.id,
        targetType: 'range',
        minValue: minVal,
        maxValue: maxVal,
        unit: firstParam.unit || '',
      },
      hintText: `Adjust the "${firstParam.name}" slider on the right control panel until its live telemetry reads between ${minVal} and ${maxVal} ${firstParam.unit || ''}.`,
      successExplanation: `Calibration verified! Adjusting ${firstParam.name} directly updated the 3D ${cap.title} simulation state in accordance with ${cap.scientificConcept}.`,
    };
  } else if (firstPart) {
    experimentStage = {
      instruction: `Inspect the 3D "${cap.title}" model in the viewport and select the "${firstPart.name}" assembly to verify its structural role.`,
      scientificGoal: `Identify and select "${firstPart.name}" in the 3D model.`,
      targetCondition: {
        description: `Select 3D Structure: ${firstPart.name}`,
        metricKey: 'selectedPartId',
        targetType: 'part_selection',
        targetPartId: firstPart.id,
        targetPartName: firstPart.name,
      },
      hintText: `Click "${firstPart.name}" in the 3D Structure Inspector or click the component directly in the 3D scene.`,
      successExplanation: `Structure verified! ${firstPart.name}: ${firstPart.functionDescription}`,
    };
  } else {
    experimentStage = {
      instruction: `Explore the ${cap.title} model and click Verify Inspection to confirm its primary scientific mechanism.`,
      scientificGoal: `Complete conceptual inspection of ${cap.title}.`,
      targetCondition: {
        description: `Verify ${cap.title} scientific inspection`,
        metricKey: 'isValid',
        targetType: 'boolean_true',
      },
      hintText: 'Click Verify Experimental State to record your observation.',
      successExplanation: `Inspection complete! ${cap.shortDescription}`,
    };
  }

  const primaryFunctionText = firstPart
    ? `${firstPart.name} — ${firstPart.functionDescription}`
    : cap.shortDescription;

  const distractorText1 = secondPart && secondPart.id !== firstPart?.id
    ? `It remains completely inert and plays no role in ${cap.scientificConcept.toLowerCase()}.`
    : 'It violates conservation of energy by generating infinite spontaneous output without input.';

  return {
    id: `mission-auto-${cap.modelId}`,
    modelId: cap.modelId,
    title: `${cap.title} Investigation`,
    subtitle: cap.scientificConcept,
    category:
      cap.category === 'Engineering & Earth Science' ? 'Physics' : cap.category,
    primaryMode:
      cap.suitabilityTier === 'dedicated_game'
        ? 'dedicated_game'
        : cap.suitabilityTier === 'reusable_challenge'
        ? 'interactive_experiment'
        : 'science_puzzle',
    supportedModes:
      cap.suitabilityTier === 'knowledge_quiz_only'
        ? ['science_puzzle', 'prediction_challenge']
        : ['science_mission', 'prediction_challenge', 'interactive_experiment', 'science_puzzle'],
    difficulty: cap.isInMy29Models ? 'Intermediate' : 'Beginner',
    estimatedMinutes: 4,
    baseXpReward: cap.suitabilityTier === 'dedicated_game' ? 250 : 200,
    maxScore: 300,
    isFeaturedDedicatedGame: false,
    governingEquation: cap.keyFormula,
    scientificSummary: cap.shortDescription,
    realWorldApplication:
      cap.curatedSpec?.description ||
      `Demonstrates core principles of ${cap.scientificConcept} in ${cap.category}.`,
    predictionStage: {
      question: `In the ${cap.title} model (${cap.scientificConcept}), which statement accurately predicts the primary scientific mechanism of the system?`,
      contextPrompt: `Consider the governing principle of ${cap.title} in ${cap.category}.`,
      options: [
        {
          id: 'pred_correct',
          text: cap.shortDescription,
          isCorrect: true,
          explanation: `Correct! ${cap.shortDescription}`,
        },
        {
          id: 'pred_wrong_1',
          text: distractorText1,
          isCorrect: false,
          explanation: `Incorrect. Every assembly in ${cap.title} operates according to verified ${cap.category.toLowerCase()} laws: ${cap.shortDescription}`,
        },
        {
          id: 'pred_wrong_2',
          text: 'The system state is independent of all physical parameters, boundary conditions, and structural geometry.',
          isCorrect: false,
          explanation: `Incorrect. ${cap.title} responds directly to its governing physical/biological parameters and structural configuration.`,
        },
      ],
      postExperimentTakeaway:
        cap.curatedSpec?.description || cap.shortDescription,
    },
    experimentStage,
    puzzleStage: {
      puzzleType: 'structure_function',
      prompt: firstPart
        ? `Which description accurately identifies the scientific role of "${firstPart.name}" within the ${cap.title} system?`
        : `Which core scientific concept is demonstrated by the ${cap.title} model?`,
      formulaReference: cap.keyFormula,
      options: [
        {
          id: 'puz_correct',
          label: primaryFunctionText,
          isCorrect: true,
          scientificFeedback: `Verified! ${primaryFunctionText}`,
        },
        {
          id: 'puz_wrong_1',
          label: 'It acts purely as an thermal insulator that blocks all energy, signal, or mass transfer across the system.',
          isCorrect: false,
          scientificFeedback: `Incorrect. Review the verified function: ${primaryFunctionText}`,
        },
        {
          id: 'puz_wrong_2',
          label: 'It reverses gravitational acceleration locally inside the laboratory frame.',
          isCorrect: false,
          scientificFeedback: `Incorrect. Local gravitational acceleration is not reversed by ${cap.title}.`,
        },
      ],
      hintText: firstPart
        ? `Select "${firstPart.name}" in the 3D model inspector to read its verified functional annotation.`
        : `Review the scientific summary for ${cap.title}.`,
    },
  };
}

/**
 * Evaluates whether the current live simulation state satisfies the mission's
 * interactive experiment target condition.
 */
export function evaluateExperimentCompletion(
  condition: ExperimentTargetCondition,
  simState: EvaluatedSimulationState,
  selectedPartId: string | null
): {
  passed: boolean;
  measuredText: string;
  feedback: string;
} {
  if (condition.targetType === 'part_selection') {
    const isMatch =
      selectedPartId === condition.targetPartId ||
      (condition.targetPartId === 'commutator' && selectedPartId === 'armature-coil');
    return {
      passed: isMatch,
      measuredText: selectedPartId ? `Selected: ${selectedPartId}` : 'No 3D structure selected yet',
      feedback: isMatch
        ? `Target structure "${condition.targetPartName}" accurately identified in the 3D model!`
        : `Please select "${condition.targetPartName}" in the 3D viewport or Structure Inspector list (currently selected: ${
            selectedPartId || 'none'
          }).`,
    };
  }

  if (condition.targetType === 'boolean_true') {
    return {
      passed: Boolean(simState.isValid),
      measuredText: simState.summaryStatus,
      feedback: 'Scientific state verified.',
    };
  }

  const rawMetric = simState.metrics[condition.metricKey];
  const numericVal = typeof rawMetric === 'number' ? rawMetric : Number(rawMetric);

  if (condition.targetType === 'range' && Number.isFinite(numericVal)) {
    const min = condition.minValue ?? -Infinity;
    const max = condition.maxValue ?? Infinity;
    const passed = numericVal >= min && numericVal <= max;
    const unitStr = condition.unit ? ` ${condition.unit}` : '';
    return {
      passed,
      measuredText: `${numericVal}${unitStr} (Target: ${min} – ${max}${unitStr})`,
      feedback: passed
        ? `Target condition achieved! Measured value ${numericVal}${unitStr} is within [${min}, ${max}]${unitStr}.`
        : `Current measured value is ${numericVal}${unitStr}. Adjust the simulation controls until it reaches [${min} – ${max}]${unitStr}.`,
    };
  }

  return {
    passed: false,
    measuredText: String(rawMetric ?? 'Not ready'),
    feedback: `Adjust the experiment controls to satisfy: ${condition.description}`,
  };
}

/**
 * Returns the complete catalogue of all playable missions across the Tech-Anatomix
 * model registry, combining flagship curated campaigns and validated model missions.
 */
export function getAllArenaMissions(): {
  capabilities: DiscoveredModelGameCapability[];
  missions: ScienceGameMission[];
  capabilityByModelId: Map<string, DiscoveredModelGameCapability>;
} {
  const capabilities = discoverAllArenaModels();
  const capabilityByModelId = new Map<string, DiscoveredModelGameCapability>();
  capabilities.forEach((c) => capabilityByModelId.set(c.modelId, c));

  const missions: ScienceGameMission[] = [...CURATED_SCIENCE_MISSIONS];
  const coveredModelIds = new Set<string>(CURATED_SCIENCE_MISSIONS.map((m) => m.modelId));

  capabilities.forEach((cap) => {
    if (cap.suitabilityTier === 'not_suitable') return;
    if (!coveredModelIds.has(cap.modelId)) {
      coveredModelIds.add(cap.modelId);
      missions.push(buildValidatedMissionForCapability(cap));
    }
  });

  return {
    capabilities,
    missions,
    capabilityByModelId,
  };
}
