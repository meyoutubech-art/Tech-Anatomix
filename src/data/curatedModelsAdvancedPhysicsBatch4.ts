import { ScientificModelSpec } from '../types/aiModel';

/**
 * TECH-ANATOMIX / VIZLAB — PHYSICS BATCH 4: MODELS 62–68 (PREMIUM SCIENTIFIC 3D EXPLORERS)
 *
 * Models included:
 * 62. Maxwell's Equations & Electromagnetic Field Explorer ('maxwell-equations-em-field-explorer')
 * 63. AC Circuits, RLC Resonance & Impedance Laboratory ('ac-circuits-rlc-resonance-lab')
 * 64. Lenses, Optical Instruments & Image Formation Laboratory ('lenses-optical-instruments-lab')
 * 65. Doppler Ultrasound & Medical Flow Imaging Explorer ('doppler-ultrasound-flow-explorer')
 * 66. Earth's Magnetic Field & Magnetosphere Explorer ('earth-magnetic-field-magnetosphere-explorer')
 * 67. Semiconductor p–n Junction, Band Gap & Diode Explorer ('semiconductor-pn-junction-diode-explorer')
 * 68. Radioactive Decay, Half-Life & Alpha–Beta–Gamma Radiation Lab ('radioactive-decay-halflife-radiation-lab')
 */
export const ADVANCED_PHYSICS_BATCH_4_MODELS: Record<string, ScientificModelSpec> = {
  // =========================================================================
  // 62. MAXWELL'S EQUATIONS & ELECTROMAGNETIC FIELD EXPLORER
  // =========================================================================
  maxwellEquationsExplorer: {
    id: 'maxwell-equations-em-field-explorer',
    title: "Maxwell's Equations & Electromagnetic Field Explorer",
    concept: "Gauss's Laws for E & B, Faraday Induction, Ampère–Maxwell Displacement Current & EM Wave Coupling",
    description:
      "Interactive 3D electromagnetic field laboratory unifying Gauss's Law for Electricity, Gauss's Law for Magnetism, Faraday's Law of Induction, and the Ampère–Maxwell Law with configurable charges, current-carrying conductors, and coupled perpendicular E/B wave propagation.",
    whatIsIt:
      'A unified 3D classical electrodynamics laboratory showing how static and time-varying electric and magnetic fields are governed by Maxwell’s four fundamental equations.',
    howDoesItWork:
      "Gauss's Law for electricity states that net electric flux through any closed Gaussian surface equals the enclosed charge divided by vacuum permittivity (Φ_E = ∮ E · dA = Q_enc / ε₀). Gauss's Law for magnetism states that net magnetic flux through any closed surface is identically zero (Φ_B = ∮ B · dA = 0 Wb) because magnetic monopoles do not exist and magnetic field lines always form closed loops. Faraday's Law shows that a time-varying magnetic flux induces a circulating electric field (∮ E · dl = −dΦ_B/dt), while the Ampère–Maxwell Law shows that both conduction current I_c and displacement current I_d = ε₀ dΦ_E/dt generate circulating magnetic fields (∮ B · dl = μ₀(I_c + ε₀ dΦ_E/dt)). Together, Faraday's and Ampère–Maxwell's laws sustain self-propagating electromagnetic waves with perpendicular E and B vectors traveling at c = 1/√(μ₀ε₀).",
    realLifeExample:
      'Radio and Wi-Fi antennas radiating electromagnetic waves; wireless inductive phone chargers; capacitor displacement current in high-frequency RF circuits.',
    examConnection:
      "Gauss's Law (Electricity): Φ_E = Q_enc/ε₀ (N·m²/C or V·m). Gauss's Law (Magnetism): Φ_B = 0 Wb. Faraday's Law: ℰ = −dΦ_B/dt. Ampère–Maxwell Law: ∮ B·dl = μ₀(I_c + I_d) where I_d = ε₀ dΦ_E/dt. Speed of light in vacuum: c = 1/√(μ₀ε₀) ≈ 3.00 × 10⁸ m/s.",
    scaleNote:
      'Educational Field Visualization: Vector arrows, Gaussian integration surfaces, and E × B wave ribbons represent 3D field directions and relative magnitudes at selected sample points in space.',
    simulationModel: 'predictive',
    functionalType: 'maxwell-equations-em-field-explorer',
    prompt:
      "Create a 3D model of Maxwell's equations and electromagnetic field explorer with configurable positive and negative charges, electric field lines, magnetic field around a conductor, and a coupled electromagnetic wave",
    camera: {
      position: [0.2, 3.3, 8.2],
      target: [0, 0.4, 0],
    },
    parameters: {
      primaryChargeMicroC: {
        id: 'primaryChargeMicroC',
        name: 'Primary Charge (q₁)',
        min: 1,
        max: 25,
        step: 0.5,
        defaultValue: 8,
        unit: 'μC',
        description:
          'Magnitude of primary positive point charge q₁ enclosed inside the spherical Gaussian surface.',
        affects: 'custom',
      },
      secondaryChargeMicroC: {
        id: 'secondaryChargeMicroC',
        name: 'Secondary Charge (q₂ — Custom Mode)',
        min: -25,
        max: 25,
        step: 0.5,
        defaultValue: -8,
        unit: 'μC',
        description:
          'Signed charge value of secondary point charge q₂ when Custom Dual Charge arrangement is selected.',
        affects: 'custom',
      },
      chargeSeparationM: {
        id: 'chargeSeparationM',
        name: 'Charge Separation Distance (d)',
        min: 0.6,
        max: 2.6,
        step: 0.1,
        defaultValue: 1.4,
        unit: 'm',
        description: 'Spatial separation between point charges q₁ and q₂.',
        affects: 'custom',
      },
      conductorCurrentAmps: {
        id: 'conductorCurrentAmps',
        name: 'Conductor & Displacement Current (I)',
        min: 0,
        max: 45,
        step: 1,
        defaultValue: 12,
        unit: 'A',
        description:
          'Conduction current I_c in the wire and equal Maxwell displacement current I_d = ε₀ dΦ_E/dt across the capacitor gap.',
        affects: 'custom',
      },
      fieldOscillationFreqMhz: {
        id: 'fieldOscillationFreqMhz',
        name: 'Field Oscillation Frequency (f)',
        min: 20,
        max: 300,
        step: 5,
        defaultValue: 100,
        unit: 'MHz',
        description:
          'Oscillation frequency driving Faraday magnetic flux induction (−dΦ_B/dt) and radiating electromagnetic waves (λ = c/f).',
        affects: 'custom',
      },
    },
    conditions: {
      explorerViewMode: {
        id: 'explorerViewMode',
        name: 'Electromagnetic View Mode',
        type: 'select',
        defaultValue: 'all_coupled',
        options: [
          { value: 'all_coupled', label: 'All Coupled (Gauss + Faraday + Ampère + EM Wave)' },
          { value: 'electric_field', label: 'Electric Field & Gauss Law View' },
          { value: 'magnetic_field', label: 'Magnetic Field & Ampère–Maxwell View' },
          { value: 'em_wave', label: 'Electromagnetic Wave View (E ⊥ B ⊥ k)' },
        ],
        description: 'Switches between electric-field, magnetic-field, electromagnetic-wave, and unified views.',
      },
      chargeArrangementPreset: {
        id: 'chargeArrangementPreset',
        name: 'Charge Arrangement Preset',
        type: 'select',
        defaultValue: 'dipole_opposite',
        options: [
          { value: 'dipole_opposite', label: 'Opposite Dipole (+q₁ and −q₁)' },
          { value: 'like_repelling', label: 'Repelling Like Charges (+q₁ and +q₁)' },
          { value: 'single_monopole', label: 'Single Isolated Charge (+q₁ Only)' },
          { value: 'custom_dual', label: 'Custom Dual Charge (Use q₂ Slider)' },
        ],
        description: 'Configures the charge arrangement (add/remove secondary charge or flip polarity).',
      },
      showFieldVectors: {
        id: 'showFieldVectors',
        name: 'Show Field Lines & Vector Arrows',
        type: 'boolean',
        defaultValue: true,
        description: 'Toggles 3D electric field lines, vector arrows, and magnetic B-field loops.',
      },
      showExplanatoryAnnotations: {
        id: 'showExplanatoryAnnotations',
        name: 'Show Gaussian & Loop Integration Surfaces',
        type: 'boolean',
        defaultValue: true,
        description: 'Toggles translucent Gaussian spheres, pillboxes, and Ampèrian/Faraday integration loops.',
      },
    },
    parts: [
      {
        id: 'maxwell_charges_and_gaussian_surface',
        name: 'Configurable Charges & Gaussian Surface',
        label: 'Configurable Charges & Gaussian Surface',
        shape: 'sphere',
        dimensions: [0.7, 0.7, 0.7],
        position: [-2.4, 0.7, 0],
        color: '#EF4444',
        material: 'glow',
        description:
          "Configurable point charges q₁ and q₂ with a translucent spherical Gaussian surface enclosing q₁ to evaluate Gauss's Law Φ_E = Q_enc / ε₀.",
        whatIsIt: 'Point electric charges surrounded by a closed Gaussian integration surface.',
        whatDoesItDo:
          'Demonstrates how net electric flux through a closed surface is proportional to enclosed electric charge.',
      },
      {
        id: 'maxwell_electric_field_lines',
        name: 'Electric Field Lines & Vector Arrows',
        label: 'Electric Field Lines & Vector Arrows',
        shape: 'torus',
        dimensions: [1.1, 0.04],
        position: [-2.4, 1.35, 0],
        color: '#F97316',
        material: 'glow',
        description:
          '3D electric field curves and tangent vector arrows directed away from positive charges and toward negative charges.',
        whatIsIt: 'Three-dimensional electric field trajectories and local E-field vector arrows.',
        whatDoesItDo:
          'Visualizes vector superposition for electric dipoles, repelling like charges, and isolated monopoles.',
      },
      {
        id: 'maxwell_magnetic_closed_surface_dipole',
        name: 'Closed Magnetic Flux Surface (Φ_B = 0)',
        label: 'Closed Magnetic Flux Surface (Φ_B = 0)',
        shape: 'cylinder',
        dimensions: [0.55, 0.85],
        position: [-0.4, 0.7, -1.55],
        color: '#38BDF8',
        material: 'glass',
        description:
          "Magnetic dipole enclosed in a Gaussian pillbox showing that every exiting magnetic field line re-enters, yielding Φ_B = ∮ B · dA = 0 Wb.",
        whatIsIt: "Gauss's Law for Magnetism verification module.",
        whatDoesItDo:
          'Proves that magnetic field lines form closed loops with zero net flux through any closed surface.',
      },
      {
        id: 'maxwell_faraday_induction_coil',
        name: 'Faraday Induction Loop (−dΦ_B/dt)',
        label: 'Faraday Induction Loop (−dΦ_B/dt)',
        shape: 'torus',
        dimensions: [0.65, 0.045],
        position: [0.35, 0.7, 1.15],
        color: '#A855F7',
        material: 'metal',
        description:
          'Conducting loop linked by an oscillating magnetic flux Φ_B(t), generating a circulating induced electric field ∮ E · dl = −dΦ_B/dt.',
        whatIsIt: 'Faraday electromagnetic induction ring and induced E-field loop.',
        whatDoesItDo:
          'Shows how a time-varying magnetic field creates a curling electric field even in the absence of static charges.',
      },
      {
        id: 'maxwell_ampere_conductor_and_capacitor',
        name: 'Ampère–Maxwell Conductor & Capacitor Gap',
        label: 'Ampère–Maxwell Conductor & Capacitor Gap',
        shape: 'cylinder',
        dimensions: [0.42, 1.8],
        position: [1.9, 0.7, -0.65],
        color: '#22C55E',
        material: 'metal',
        description:
          'Current-carrying wire and parallel-plate capacitor gap encircled by concentric magnetic field B-loops driven by I_c and displacement current I_d = ε₀ dΦ_E/dt.',
        whatIsIt: 'Conduction current wire and capacitor displacement-current assembly.',
        whatDoesItDo:
          'Demonstrates that a changing electric flux between capacitor plates produces the exact same circulating magnetic field as conduction current I_c.',
      },
      {
        id: 'maxwell_em_wave_ribbon',
        name: 'Perpendicular E × B Electromagnetic Wave',
        label: 'Perpendicular E × B Electromagnetic Wave',
        shape: 'box',
        dimensions: [3.2, 0.9, 0.9],
        position: [3.1, 0.7, 1.15],
        color: '#FACC15',
        material: 'glow',
        description:
          'Time-varying electromagnetic wave with mutually perpendicular electric field E_y(x,t) and magnetic field B_z(x,t) vectors propagating along +x at speed c.',
        whatIsIt: 'Self-sustaining transverse electromagnetic wave (E ⊥ B ⊥ k).',
        whatDoesItDo:
          'Visualizes how oscillating E and B fields continuously regenerate one another at the speed of light.',
      },
    ],
    equations: [
      '\\oint \\vec{E} \\cdot d\\vec{A} = \\frac{Q_{\\text{enc}}}{\\varepsilon_0} \\quad (\\text{Gauss\'s Law for Electricity})',
      '\\oint \\vec{B} \\cdot d\\vec{A} = 0 \\quad (\\text{Gauss\'s Law for Magnetism})',
      '\\oint \\vec{E} \\cdot d\\vec{l} = -\\frac{d\\Phi_B}{dt} \\quad (\\text{Faraday\'s Law of Induction})',
      '\\oint \\vec{B} \\cdot d\\vec{l} = \\mu_0 \\left(I_c + \\varepsilon_0 \\frac{d\\Phi_E}{dt}\\right) \\quad (\\text{Amp\\`ere–Maxwell Law})',
    ],
    curiosityPrompts: [
      'Why is the net magnetic flux through any closed surface always zero (∮ B · dA = 0)?',
      'How does Maxwell’s displacement current I_d = ε₀ dΦ_E/dt allow a magnetic field to exist inside a charging capacitor gap?',
      'How do Faraday’s Law and the Ampère–Maxwell Law work together to make light travel through empty space at c = 1/√(μ₀ε₀)?',
    ],
  },

  // =========================================================================
  // 63. AC CIRCUITS, RLC RESONANCE & IMPEDANCE LABORATORY
  // =========================================================================
  acRlcResonanceLab: {
    id: 'ac-circuits-rlc-resonance-lab',
    title: 'AC Circuits, RLC Resonance & Impedance Laboratory',
    concept: 'Inductive & Capacitive Reactance, Complex Impedance, Phase Angle & Series RLC Resonance',
    description:
      'Interactive 3D alternating-current circuit laboratory featuring an AC voltage source, resistor, solenoid inductor, parallel-plate capacitor, bi-directional oscillating charge carriers, RMS meters, dual-trace V(t)/I(t) oscilloscope, and rotating phasor diagram.',
    whatIsIt:
      'A 3D alternating-current (AC) electronics bench that lets you tune driving frequency f, resistance R, inductance L, and capacitance C to observe reactance, phase shift φ, impedance Z, and series resonance.',
    howDoesItWork:
      'In a series AC circuit driven by V(t) = V_peak sin(2πft), a resistor opposes current in phase (X_R = R, Δφ = 0°), an inductor opposes changes in current with inductive reactance X_L = 2πfL (V_L leads I by +90°), and a capacitor stores oscillating charge with capacitive reactance X_C = 1/(2πfC) (V_C lags I by −90°). Total circuit impedance is Z = √(R² + (X_L − X_C)²) and the phase angle between source voltage and current is φ = arctan((X_L − X_C)/R). At the ideal series-RLC resonance frequency f₀ = 1/(2π√(LC)), X_L equals X_C so reactive voltages cancel, impedance reaches its minimum Z = R, phase difference vanishes (φ = 0°), and RMS current I_rms = V_rms / Z peaks.',
    realLifeExample:
      'Analog radio and television tuners selecting a station frequency via RLC resonance; power factor correction capacitor banks in industrial AC grids; crossover filters in audio loudspeakers.',
    examConnection:
      'Inductive reactance: X_L = 2πfL. Capacitive reactance: X_C = 1/(2πfC). Impedance: Z = √(R² + (X_L − X_C)²). Resonance frequency: f₀ = 1/(2π√(LC)). Peak vs RMS: V_rms = V_peak/√2, I_rms = I_peak/√2, P_avg = V_rms I_rms cos φ.',
    scaleNote:
      'Peak vs RMS Convention: Both Peak (V_peak, I_peak) and Root-Mean-Square (V_rms = V_peak/√2, I_rms = I_peak/√2) quantities are displayed simultaneously so students can compare waveform amplitudes with standard AC meter readings.',
    simulationModel: 'predictive',
    functionalType: 'ac-circuits-rlc-resonance-lab',
    prompt:
      'Create a 3D model of an AC circuits, RLC resonance and impedance laboratory with AC source, resistor, capacitor, inductor, phase graphs, and impedance calculations',
    camera: {
      position: [0.0, 3.5, 8.0],
      target: [0, 0.3, -0.3],
    },
    parameters: {
      acFrequencyHz: {
        id: 'acFrequencyHz',
        name: 'AC Driving Frequency (f)',
        min: 15,
        max: 260,
        step: 1,
        defaultValue: 103,
        unit: 'Hz',
        description:
          'Frequency f of the alternating voltage source. Tune to f₀ = 1/(2π√(LC)) to achieve series resonance.',
        affects: 'custom',
      },
      resistanceOhms: {
        id: 'resistanceOhms',
        name: 'Resistance (R)',
        min: 5,
        max: 150,
        step: 1,
        defaultValue: 25,
        unit: 'Ω',
        description: 'Ohmic resistance R that dissipates real power and sets minimum impedance at resonance.',
        affects: 'custom',
      },
      inductanceMilliH: {
        id: 'inductanceMilliH',
        name: 'Inductance (L)',
        min: 5,
        max: 150,
        step: 1,
        defaultValue: 40,
        unit: 'mH',
        description: 'Solenoid coil inductance L determining inductive reactance X_L = 2πfL.',
        affects: 'custom',
      },
      capacitanceMicroF: {
        id: 'capacitanceMicroF',
        name: 'Capacitance (C)',
        min: 5,
        max: 200,
        step: 1,
        defaultValue: 60,
        unit: 'μF',
        description: 'Capacitor value C determining capacitive reactance X_C = 1/(2πfC).',
        affects: 'custom',
      },
      peakVoltageV: {
        id: 'peakVoltageV',
        name: 'Source Peak Voltage (V_peak)',
        min: 20,
        max: 240,
        step: 5,
        defaultValue: 120,
        unit: 'V',
        description: 'Peak amplitude of the AC supply voltage (V_rms = V_peak / √2).',
        affects: 'custom',
      },
    },
    conditions: {
      circuitConfiguration: {
        id: 'circuitConfiguration',
        name: 'Circuit Topology Mode',
        type: 'select',
        defaultValue: 'rlc_series',
        options: [
          { value: 'rlc_series', label: 'Series RLC Circuit (R + L + C)' },
          { value: 'r_only', label: 'Resistor-Only Circuit (Pure Ohmic, φ = 0°)' },
          { value: 'rc_series', label: 'Series RC Circuit (Capacitive, φ < 0°)' },
          { value: 'rl_series', label: 'Series RL Circuit (Inductive, φ > 0°)' },
        ],
        description: 'Switches between resistor-only, RC, RL, and full series RLC circuit configurations.',
      },
      showPhasorAndGraphs: {
        id: 'showPhasorAndGraphs',
        name: 'Show Oscilloscope & Phasor Diagram',
        type: 'boolean',
        defaultValue: true,
        description: 'Toggles the 3D dual-trace V(t)/I(t) waveform monitor and rotating phasor wheel.',
      },
    },
    parts: [
      {
        id: 'rlc_ac_source_generator',
        name: 'AC Alternator Voltage Source (V_peak / V_rms)',
        label: 'AC Alternator Voltage Source (V_peak / V_rms)',
        shape: 'cylinder',
        dimensions: [0.7, 0.65],
        position: [-3.4, -0.35, 1.35],
        color: '#38BDF8',
        material: 'metal',
        description:
          'Variable-frequency sinusoidal AC voltage supply driving V(t) = V_peak sin(2πft).',
        whatIsIt: 'Alternating-current signal generator and power supply.',
        whatDoesItDo: 'Provides adjustable peak/RMS voltage and driving frequency f to the circuit loop.',
      },
      {
        id: 'rlc_precision_resistor',
        name: 'Non-Inductive Power Resistor (R)',
        label: 'Non-Inductive Power Resistor (R)',
        shape: 'cylinder',
        dimensions: [0.28, 1.35],
        position: [-2.2, -0.35, -1.35],
        color: '#F97316',
        material: 'plastic',
        description:
          'Ohmic resistor R whose voltage V_R is always in phase (0°) with current I(t) and dissipates real power P = I_rms² R.',
        whatIsIt: 'Series resistive load component.',
        whatDoesItDo: 'Limits peak current at resonance and converts electrical energy into thermal power.',
      },
      {
        id: 'rlc_helical_inductor',
        name: 'Solenoid Inductor Coil (X_L = 2πfL)',
        label: 'Solenoid Inductor Coil (X_L = 2πfL)',
        shape: 'torus',
        dimensions: [0.55, 0.18],
        position: [0.15, -0.35, -1.35],
        color: '#A855F7',
        material: 'metal',
        description:
          'Helical inductor storing magnetic field energy; its voltage V_L leads current I(t) by +90°.',
        whatIsIt: 'Air-core solenoid inductor of inductance L (in mH).',
        whatDoesItDo: 'Produces inductive reactance X_L = 2πfL that increases linearly with frequency.',
      },
      {
        id: 'rlc_parallel_capacitor',
        name: 'Parallel-Plate Capacitor (X_C = 1/(2πfC))',
        label: 'Parallel-Plate Capacitor (X_C = 1/(2πfC))',
        shape: 'box',
        dimensions: [0.65, 0.9, 0.9],
        position: [2.6, -0.35, -1.35],
        color: '#22C55E',
        material: 'metal',
        description:
          'Dielectric capacitor storing electric field energy; its voltage V_C lags current I(t) by −90°.',
        whatIsIt: 'Parallel-plate capacitor of capacitance C (in μF).',
        whatDoesItDo: 'Produces capacitive reactance X_C = 1/(2πfC) that decreases inversely with frequency.',
      },
      {
        id: 'rlc_conduction_loop_and_meters',
        name: 'Conducting Loop & AC Charge Carriers',
        label: 'Conducting Loop & AC Charge Carriers',
        shape: 'box',
        dimensions: [7.2, 0.2, 2.8],
        position: [0, -0.35, 0],
        color: '#EAB308',
        material: 'metal',
        description:
          'Copper busbars with animated charge carriers oscillating at frequency f with amplitude proportional to I_peak and phase shift φ.',
        whatIsIt: 'Series circuit busbar loop and current indicators.',
        whatDoesItDo: 'Visualizes alternating current magnitude and phase response in real time.',
      },
      {
        id: 'rlc_oscilloscope_and_phasor_deck',
        name: 'Oscilloscope Waveforms & Phasor Diagram',
        label: 'Oscilloscope Waveforms & Phasor Diagram',
        shape: 'box',
        dimensions: [7.4, 2.2, 0.16],
        position: [0, 1.45, -2.25],
        color: '#0EA5E9',
        material: 'plastic',
        description:
          'Instrumentation backplane showing V(t) vs I(t) sinusoidal traces and rotating voltage/current phasor vectors.',
        whatIsIt: 'Dual-trace AC oscilloscope and phasor analyzer.',
        whatDoesItDo: 'Displays instantaneous phase lead/lag φ and amplitude peak at resonance f = f₀.',
      },
    ],
    equations: [
      'X_L = 2\\pi f L \\quad , \\quad X_C = \\frac{1}{2\\pi f C}',
      'Z = \\sqrt{R^2 + (X_L - X_C)^2} \\quad , \\quad \\tan\\phi = \\frac{X_L - X_C}{R}',
      'f_0 = \\frac{1}{2\\pi\\sqrt{LC}} \\quad (\\text{Series RLC Resonance: } X_L = X_C, \\; Z = R, \\; \\phi = 0^\\circ)',
      'V_{\\text{rms}} = \\frac{V_{\\text{peak}}}{\\sqrt{2}} \\quad , \\quad I_{\\text{rms}} = \\frac{V_{\\text{rms}}}{Z} \\quad , \\quad P_{\\text{avg}} = V_{\\text{rms}} I_{\\text{rms}} \\cos\\phi',
    ],
    curiosityPrompts: [
      'What happens to total impedance Z and phase angle φ when driving frequency f is tuned exactly to f₀ = 1/(2π√(LC))?',
      'Why does current lead voltage in an RC circuit (φ < 0°) but lag voltage in an RL circuit (φ > 0°)?',
      'How do RMS voltage and current relate to peak sinusoidal amplitude and average real power dissipation?',
    ],
  },

  // =========================================================================
  // 64. LENSES, OPTICAL INSTRUMENTS & IMAGE FORMATION LABORATORY
  // =========================================================================
  lensesOpticalInstrumentsLab: {
    id: 'lenses-optical-instruments-lab',
    title: 'Lenses, Optical Instruments & Image Formation Laboratory',
    concept: 'Cartesian Thin-Lens Equation (1/f = 1/v − 1/u), Principal Ray Tracing & Compound Optical Instruments',
    description:
      'Interactive 3D geometrical optics bench featuring converging (convex) and diverging (concave) lenses, movable luminous object arrow, principal axis, focal markers (F, 2F), three color-coded principal rays, real/virtual image formation, and microscope/telescope configurations.',
    whatIsIt:
      'A precision 3D geometrical optics laboratory that traces principal light rays through converging and diverging lenses and multi-lens optical instruments.',
    howDoesItWork:
      'Using the Cartesian thin-lens sign convention—where light travels left-to-right, the object is placed to the left of the lens at negative coordinate u = −|u| < 0, a converging (biconvex) lens has f > 0, and a diverging (biconcave) lens has f < 0—the image coordinate v satisfies the thin-lens equation 1/f = 1/v − 1/u (so v = f·u / (f + u)), and lateral magnification is m = v/u = h_i/h_o. When |u| > f for a converging lens, refracted rays physically intersect on the right (v > 0) to form an inverted real image (m < 0). When |u| < f for a converging lens, or for any object distance with a diverging lens, refracted rays diverge on the right and their backward dashed extensions intersect on the left (v < 0) to form an upright virtual image (m > 0).',
    realLifeExample:
      'Camera objectives and cinema projectors forming real images on sensors/screens; magnifying glasses, corrective eyeglasses, compound microscopes, and astronomical refracting telescopes.',
    examConnection:
      'Cartesian Thin-Lens Equation: 1/f = 1/v − 1/u with u < 0 for a real object on the left, f > 0 for converging (convex), f < 0 for diverging (concave). Magnification: m = v/u = h_i/h_o (m < 0 inverted real; m > 0 upright virtual). Optical power: P = 1/f(m) in Diopters (D).',
    scaleNote:
      'Cartesian Sign Convention: Object coordinate u is negative (left of lens O at x = 0). Real images have v > 0 (right of lens, m < 0 inverted); virtual images have v < 0 (left of lens, m > 0 upright).',
    simulationModel: 'predictive',
    functionalType: 'lenses-optical-instruments-lab',
    prompt:
      'Create a 3D model of a lenses, optical instruments and image formation laboratory with convex and concave lenses, principal rays, real and virtual images, and microscope/telescope arrangements',
    camera: {
      position: [0.0, 2.8, 8.2],
      target: [0, 0.3, 0],
    },
    parameters: {
      focalLengthMagnitudeCm: {
        id: 'focalLengthMagnitudeCm',
        name: 'Primary Lens Focal Length |f|',
        min: 8,
        max: 35,
        step: 1,
        defaultValue: 18,
        unit: 'cm',
        description:
          'Magnitude of focal length |f| (+|f| for converging convex lens, −|f| for diverging concave lens).',
        affects: 'custom',
      },
      objectDistanceMagnitudeCm: {
        id: 'objectDistanceMagnitudeCm',
        name: 'Object Distance |u| (Coordinate u = −|u|)',
        min: 6,
        max: 65,
        step: 1,
        defaultValue: 32,
        unit: 'cm',
        description:
          'Distance of the luminous object arrow to the left of the optical center O (Cartesian coordinate u = −|u| cm).',
        affects: 'custom',
      },
      objectHeightCm: {
        id: 'objectHeightCm',
        name: 'Object Height (h_o)',
        min: 2,
        max: 10,
        step: 0.5,
        defaultValue: 5,
        unit: 'cm',
        description: 'Vertical height h_o of the upright object arrow above the principal optical axis.',
        affects: 'custom',
      },
      eyepieceFocalLengthCm: {
        id: 'eyepieceFocalLengthCm',
        name: 'Eyepiece Focal Length (f_e — Instrument Modes)',
        min: 5,
        max: 25,
        step: 1,
        defaultValue: 10,
        unit: 'cm',
        description:
          'Focal length f_e of the secondary eyepiece lens in Compound Microscope and Astronomical Telescope modes.',
        affects: 'custom',
      },
    },
    conditions: {
      opticalInstrumentMode: {
        id: 'opticalInstrumentMode',
        name: 'Lens & Optical Instrument Configuration',
        type: 'select',
        defaultValue: 'single_converging',
        options: [
          { value: 'single_converging', label: 'Converging Biconvex Lens (f > 0)' },
          { value: 'single_diverging', label: 'Diverging Biconcave Lens (f < 0)' },
          { value: 'simple_magnifier', label: 'Simple Magnifier Mode (|u| < f Virtual Image)' },
          { value: 'compound_microscope', label: 'Compound Microscope (Objective + Eyepiece)' },
          { value: 'astronomical_telescope', label: 'Astronomical Telescope (f_o + f_e)' },
        ],
        description:
          'Switch between converging and diverging lenses, real vs virtual image regimes, and microscope/telescope arrangements.',
      },
      showVirtualRayExtensions: {
        id: 'showVirtualRayExtensions',
        name: 'Show Virtual Ray Extensions & Screen',
        type: 'boolean',
        defaultValue: true,
        description:
          'Toggles backward virtual ray projections (when v < 0) and the translucent ground-glass image screen (when v > 0).',
      },
    },
    parts: [
      {
        id: 'optics_calibrated_rail_axis',
        name: 'Optical Bench Rail, Principal Axis & Focal Points (F, 2F)',
        label: 'Optical Bench Rail, Principal Axis & Focal Points (F, 2F)',
        shape: 'box',
        dimensions: [10.8, 0.22, 0.55],
        position: [0, -0.85, 0],
        color: '#475569',
        material: 'metal',
        description:
          'Precision optical rail defining the principal axis with glowing focal markers at ±F and ±2F.',
        whatIsIt: 'Calibrated optical bench and principal axis reference.',
        whatDoesItDo: 'Establishes the Cartesian optical coordinate axis and focal planes.',
      },
      {
        id: 'optics_primary_objective_lens',
        name: 'Primary Thin Lens (Converging Convex / Diverging Concave)',
        label: 'Primary Thin Lens (Converging Convex / Diverging Concave)',
        shape: 'cylinder',
        dimensions: [1.18, 0.25],
        position: [0, 0.4, 0],
        color: '#38BDF8',
        material: 'glass',
        description:
          'Refracting glass lens centered at x = 0 that bends incident rays according to 1/f = 1/v − 1/u.',
        whatIsIt: 'Primary biconvex (f > 0) or biconcave (f < 0) thin lens.',
        whatDoesItDo: 'Converges or diverges light rays to form real or virtual images.',
      },
      {
        id: 'optics_illuminated_object_arrow',
        name: 'Illuminated Object Arrow (Coordinate u < 0)',
        label: 'Illuminated Object Arrow (Coordinate u < 0)',
        shape: 'cylinder',
        dimensions: [0.15, 1.0],
        position: [-2.5, 0.4, 0],
        color: '#22C55E',
        material: 'glow',
        description:
          'Emerald upright object arrow positioned at negative coordinate u = −|u| cm.',
        whatIsIt: 'Optical source object of height h_o.',
        whatDoesItDo: 'Emits the three principal rays traced through the optical system.',
      },
      {
        id: 'optics_principal_ray_bundle',
        name: 'Three Color-Coded Principal Rays (Parallel, Central & Focal)',
        label: 'Three Color-Coded Principal Rays (Parallel, Central & Focal)',
        shape: 'box',
        dimensions: [6.0, 1.0, 0.2],
        position: [0, 0.65, 0],
        color: '#F59E0B',
        material: 'glow',
        description:
          'Distinct ray colors: Parallel Ray (amber) refracting through F′, Central Ray (cyan) passing undeviated through O, and Focal Ray (magenta) emerging parallel to the axis.',
        whatIsIt: 'Geometrical ray-tracing bundle.',
        whatDoesItDo: 'Locates the exact image tip intersection (real or virtual) without sign ambiguity.',
      },
      {
        id: 'optics_image_plane_and_arrow',
        name: 'Formed Image Arrow & Image Plane (Coordinate v)',
        label: 'Formed Image Arrow & Image Plane (Coordinate v)',
        shape: 'cylinder',
        dimensions: [0.15, 1.0],
        position: [2.6, 0.4, 0],
        color: '#F43F5E',
        material: 'glow',
        description:
          'Resulting image arrow at coordinate v with height h_i = m · h_o, paired with a translucent ground-glass screen for real images (v > 0).',
        whatIsIt: 'Real or virtual optical image and projection plane.',
        whatDoesItDo: 'Displays image position v, orientation (inverted vs upright), and magnification m = v/u.',
      },
      {
        id: 'optics_eyepiece_instrument_lens',
        name: 'Secondary Eyepiece Lens (Microscope & Telescope Modes)',
        label: 'Secondary Eyepiece Lens (Microscope & Telescope Modes)',
        shape: 'cylinder',
        dimensions: [0.95, 0.2],
        position: [3.8, 0.4, 0],
        color: '#818CF8',
        material: 'glass',
        description:
          'Secondary converging lens (focal length f_e) used in Compound Microscope and Astronomical Telescope configurations.',
        whatIsIt: 'Ocular eyepiece lens.',
        whatDoesItDo: 'Magnifies the intermediate image formed by the primary objective lens.',
      },
    ],
    equations: [
      '\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u} \\quad \\Longleftrightarrow \\quad v = \\frac{f \\cdot u}{f + u} \\quad (\\text{Cartesian Sign Convention: } u < 0)',
      'm = \\frac{v}{u} = \\frac{h_i}{h_o} \\quad (m < 0 \\text{ Real Inverted}, \\; m > 0 \\text{ Virtual Upright})',
      'P = \\frac{100}{f(\\text{cm})}\\;[\\text{D}] \\quad , \\quad M_{\\text{micro}} \\approx \\frac{L}{f_o}\\frac{25\\text{ cm}}{f_e} \\quad , \\quad M_{\\text{tele}} = -\\frac{f_o}{f_e}',
    ],
    curiosityPrompts: [
      'Why does the Cartesian thin-lens equation 1/f = 1/v − 1/u give m = +v/u without needing a minus sign?',
      'Why does a converging lens switch from projecting an inverted real image to an upright virtual image when |u| crosses inside |f|?',
      'Why does a diverging (concave) lens always form a diminished, upright virtual image regardless of object distance?',
    ],
  },

  // =========================================================================
  // 65. DOPPLER ULTRASOUND & MEDICAL FLOW IMAGING EXPLORER
  // =========================================================================
  dopplerUltrasoundExplorer: {
    id: 'doppler-ultrasound-flow-explorer',
    title: 'Doppler Ultrasound & Medical Flow Imaging Explorer',
    concept: 'Round-Trip Acoustic Doppler Shift (Δf = 2f₀v cos θ / c), Insonation Angle & Pulse-Echo Ranging',
    description:
      'Educational 3D medical physics model illustrating how diagnostic ultrasound detects erythrocyte motion and estimates blood flow using round-trip Doppler shift Δf = 2f₀v cos θ / c and pulse-echo depth ranging.',
    whatIsIt:
      'An interactive 3D medical acoustics simulator showing an ultrasound probe, soft-tissue acoustic window, blood vessel, moving red blood cells, transmitted/reflected wave pulses, and a spectral Doppler display.',
    howDoesItWork:
      'A piezoelectric ultrasound probe transmits high-frequency acoustic pulses (f₀ = 2–10 MHz) into soft tissue where sound travels at average speed c ≈ 1540 m/s. When pulses reflect off stationary tissue boundaries at depth d, the round-trip echo time is t_echo = 2d/c with zero frequency shift (Δf = 0 Hz). When pulses scatter from red blood cells moving at speed v at angle θ to the ultrasound beam axis, the wave undergoes two sequential Doppler shifts—first arriving at the moving blood cells and second being re-emitted toward the stationary transducer—yielding the round-trip Doppler shift Δf = (2 f₀ v cos θ) / c (assuming v ≪ c and uniform acoustic speed c = 1540 m/s).',
    realLifeExample:
      'Carotid artery duplex sonography detecting vascular stenosis; fetal heart rate monitoring; echocardiographic assessment of cardiac valve flow.',
    examConnection:
      'Round-trip medical ultrasound Doppler equation: Δf = f_R − f₀ = (2 f₀ v cos θ)/c, where f₀ = source frequency, v = blood flow speed, θ = beam-to-flow angle, and c ≈ 1540 m/s in soft tissue. At θ = 90°, cos 90° = 0 so Δf = 0 Hz.',
    scaleNote:
      'Educational Physics Simplification (Not a Clinical Diagnostic Tool): Assumes homogeneous soft tissue (c = 1540 m/s), non-relativistic flow (v ≪ c), and uniform vessel velocity.',
    simulationModel: 'predictive',
    functionalType: 'doppler-ultrasound-flow-explorer',
    prompt:
      'Create a 3D model of a Doppler ultrasound and medical flow imaging explorer with ultrasound probe, tissue boundary, blood vessel, moving red blood cells, wave pulses, and Doppler spectrum',
    camera: {
      position: [0.0, 3.0, 8.0],
      target: [0, 0.4, 0],
    },
    parameters: {
      sourceFrequencyMhz: {
        id: 'sourceFrequencyMhz',
        name: 'Transducer Frequency (f₀)',
        min: 2,
        max: 10,
        step: 0.5,
        defaultValue: 5.0,
        unit: 'MHz',
        description: 'Ultrasound frequency f₀ emitted by the piezoelectric transducer crystal.',
        affects: 'custom',
      },
      targetVelocityMs: {
        id: 'targetVelocityMs',
        name: 'Blood Flow Velocity (v)',
        min: 0.05,
        max: 2.0,
        step: 0.05,
        defaultValue: 0.75,
        unit: 'm/s',
        description: 'Speed v of red blood cells flowing through the arterial lumen.',
        affects: 'custom',
      },
      beamAngleDeg: {
        id: 'beamAngleDeg',
        name: 'Beam Insonation Angle (θ)',
        min: 0,
        max: 90,
        step: 5,
        defaultValue: 45,
        unit: '°',
        description:
          'Angle θ between the ultrasound beam axis and the blood flow vector. Δf scales with cos θ and vanishes at θ = 90°.',
        affects: 'custom',
      },
      vesselDepthCm: {
        id: 'vesselDepthCm',
        name: 'Vessel Depth in Tissue (d)',
        min: 1.5,
        max: 8.0,
        step: 0.5,
        defaultValue: 4.0,
        unit: 'cm',
        description: 'Depth d of the vessel used to compute pulse-echo round-trip arrival time t = 2d/c.',
        affects: 'custom',
      },
    },
    conditions: {
      imagingViewMode: {
        id: 'imagingViewMode',
        name: 'Ultrasound Imaging View Mode',
        type: 'select',
        defaultValue: 'combined_duplex',
        options: [
          { value: 'combined_duplex', label: 'Duplex View (Pulse-Echo + Spectral Doppler)' },
          { value: 'doppler_spectrum', label: 'Spectral Doppler Frequency-Shift View' },
          { value: 'pulse_echo', label: 'Pulse-Echo Depth Ranging View' },
        ],
        description: 'Toggles between pulse-echo, spectral Doppler, and combined duplex views.',
      },
      targetMotionMode: {
        id: 'targetMotionMode',
        name: 'Target Flow State',
        type: 'select',
        defaultValue: 'approaching_flow',
        options: [
          { value: 'approaching_flow', label: 'Approaching Blood Flow (+v toward Probe, Δf > 0)' },
          { value: 'receding_flow', label: 'Receding Blood Flow (−v away from Probe, Δf < 0)' },
          { value: 'stationary_target', label: 'Stationary Reflector Target (v = 0 m/s, Δf = 0)' },
        ],
        description: 'Compares stationary targets with approaching and receding blood cells.',
      },
    },
    parts: [
      {
        id: 'ultrasound_transducer_probe',
        name: 'Piezoelectric Ultrasound Transducer Probe (f₀)',
        label: 'Piezoelectric Ultrasound Transducer Probe (f₀)',
        shape: 'cylinder',
        dimensions: [0.3, 1.35],
        position: [-1.4, 2.0, 0],
        color: '#38BDF8',
        material: 'plastic',
        description:
          'Transducer probe emitting acoustic pulses at f₀ and receiving scattered echoes at f_R = f₀ + Δf.',
        whatIsIt: 'Piezoelectric transceiver probe tilted at insonation angle θ.',
        whatDoesItDo: 'Converts high-frequency electrical pulses into acoustic waves and detects returning echoes.',
      },
      {
        id: 'ultrasound_tissue_phantom_boundary',
        name: 'Soft-Tissue Acoustic Window (c ≈ 1540 m/s)',
        label: 'Soft-Tissue Acoustic Window (c ≈ 1540 m/s)',
        shape: 'box',
        dimensions: [8.2, 2.5, 2.2],
        position: [0, 0.35, 0],
        color: '#F472B6',
        material: 'glass',
        description:
          'Translucent tissue layer with acoustic propagation speed c = 1540 m/s.',
        whatIsIt: 'Homogeneous soft-tissue acoustic medium.',
        whatDoesItDo: 'Transmits acoustic pulses between the skin-coupled probe and the underlying blood vessel.',
      },
      {
        id: 'ultrasound_blood_vessel_and_rbcs',
        name: 'Blood Vessel & Flowing Red Blood Cells (v)',
        label: 'Blood Vessel & Flowing Red Blood Cells (v)',
        shape: 'cylinder',
        dimensions: [0.55, 8.2],
        position: [0, -0.2, 0],
        color: '#EF4444',
        material: 'glass',
        description:
          'Arterial vessel containing moving erythrocytes (red blood cells) traveling at speed v.',
        whatIsIt: 'Cylindrical blood vessel and moving acoustic scatterers.',
        whatDoesItDo: 'Scatters incident ultrasound waves with a frequency shift proportional to v cos θ.',
      },
      {
        id: 'ultrasound_incident_and_echo_waves',
        name: 'Transmitted Wave Pulses & Doppler Echoes',
        label: 'Transmitted Wave Pulses & Doppler Echoes',
        shape: 'torus',
        dimensions: [0.4, 0.03],
        position: [-0.6, 0.9, 0],
        color: '#22D3EE',
        material: 'glow',
        description:
          'Animated outgoing acoustic pulses (cyan) and returning Doppler-shifted echoes (green/amber).',
        whatIsIt: 'Propagating acoustic wavefronts.',
        whatDoesItDo: 'Visualizes wavelength compression (approaching flow) or expansion (receding flow).',
      },
      {
        id: 'ultrasound_angle_protractor_arc',
        name: 'Beam Insonation Angle Guide (θ)',
        label: 'Beam Insonation Angle Guide (θ)',
        shape: 'torus',
        dimensions: [1.15, 0.025],
        position: [0, -0.2, 0.65],
        color: '#FACC15',
        material: 'glow',
        description:
          'Protractor arc measuring the angle θ between the ultrasound beam and the vessel axis.',
        whatIsIt: 'Geometric angle reference for the cos θ Doppler factor.',
        whatDoesItDo: 'Shows why perpendicular insonation (θ = 90°) yields zero radial Doppler shift.',
      },
      {
        id: 'ultrasound_spectral_doppler_monitor',
        name: 'Spectral Doppler & Pulse-Echo Display',
        label: 'Spectral Doppler & Pulse-Echo Display',
        shape: 'box',
        dimensions: [6.2, 1.85, 0.16],
        position: [0, 2.55, -1.85],
        color: '#10B981',
        material: 'plastic',
        description:
          'Real-time spectral Doppler frequency-shift display (Δf in Hz/kHz) and pulse-echo depth monitor.',
        whatIsIt: 'Diagnostic ultrasound waveform monitor.',
        whatDoesItDo: 'Plots the positive or negative frequency shift Δf over time.',
      },
    ],
    equations: [
      '\\Delta f = f_R - f_0 = \\frac{2 f_0 v \\cos\\theta}{c} \\quad (v \\ll c, \\; c \\approx 1540\\text{ m/s})',
      'v = \\frac{\\Delta f \\cdot c}{2 f_0 \\cos\\theta} \\quad (\\text{Estimated Axial Flow Velocity})',
      'd = \\frac{c \\cdot t_{\\text{echo}}}{2} \\quad (\\text{Pulse-Echo Reflector Depth})',
    ],
    curiosityPrompts: [
      'Why does the ultrasound Doppler equation have a factor of 2 in Δf = 2f₀v cos θ / c?',
      'Why does the Doppler frequency shift drop to zero when the ultrasound probe is held at θ = 90° to the blood vessel?',
      'What simplifying physical assumptions does the standard medical Doppler equation make?',
    ],
  },

  // =========================================================================
  // 66. EARTH'S MAGNETIC FIELD & MAGNETOSPHERE EXPLORER
  // =========================================================================
  earthMagnetosphereExplorer: {
    id: 'earth-magnetic-field-magnetosphere-explorer',
    title: "Earth's Magnetic Field & Magnetosphere Explorer",
    concept: 'Geomagnetic Dipole Tilt, Solar Wind Dynamic Pressure, Magnetopause Standoff & Auroral Ovals',
    description:
      "Scientifically grounded 3D geophysical and space-physics model of Earth's magnetic environment featuring a rotating globe with visible rotational and tilted magnetic dipole axes, 3D compressed dayside and stretched nightside magnetic field lines, approaching solar wind particles, bow shock, and polar auroral ovals.",
    whatIsIt:
      "A 3D planetary magnetosphere simulator illustrating how Earth's internal geomagnetic dipole interacts with supersonic solar wind plasma to form a protective magnetic shield.",
    howDoesItWork:
      "Convection of liquid iron in Earth's outer core generates a geomagnetic dipole tilted by ~11.5° relative to Earth's geographic rotational axis (with magnetic field lines emerging from the Southern Hemisphere and re-entering in the Northern Hemisphere). Supersonic solar wind plasma (speed v_sw, proton density n_sw) exerts dynamic ram pressure P_dyn = ρ v_sw², compressing the dayside magnetosphere to the Chapman–Ferraro standoff distance R_mp / R_E ≈ (B_eq² / (2μ₀ P_dyn))^(1/6) while stretching the nightside field into a long magnetotail. Energetic plasma particles guided along high-latitude field lines into the polar upper atmosphere excite oxygen and nitrogen atoms to produce the northern and southern auroral ovals.",
    realLifeExample:
      'Aurora Borealis and Aurora Australis during solar storms; geomagnetic shielding of Earth’s atmosphere and low-Earth-orbit spacecraft; compass navigation.',
    examConnection:
      'Dipole magnetic field falloff: B(r) ∝ 1/r³. Solar wind dynamic pressure: P_dyn = m_p n_sw v_sw². Magnetopause pressure balance: B_mp²/(2μ₀) = P_dyn ⇒ R_mp ∝ B_eq^(1/3) P_dyn^(−1/6).',
    scaleNote:
      'Conceptual Space-Physics Scale: To make Earth, polar auroral ovals, dayside field lines, and the nightside magnetotail simultaneously visible in one 3D viewport, radial distances in Earth radii (R_E) are compressed logarithmically while preserving exact physical standoff ratios in the telemetry readout.',
    simulationModel: 'predictive',
    functionalType: 'earth-magnetic-field-magnetosphere-explorer',
    prompt:
      "Create a 3D model of Earth's magnetic field and magnetosphere explorer with rotational axis, tilted magnetic dipole, 3D field lines, solar wind particles, magnetotail, and auroral regions",
    camera: {
      position: [0.0, 3.2, 8.6],
      target: [0, 0.3, 0],
    },
    parameters: {
      solarWindVelocityKms: {
        id: 'solarWindVelocityKms',
        name: 'Solar Wind Speed (v_sw)',
        min: 250,
        max: 900,
        step: 10,
        defaultValue: 420,
        unit: 'km/s',
        description: 'Bulk velocity v_sw of solar wind plasma approaching Earth from the Sun.',
        affects: 'custom',
      },
      solarWindDensityCm3: {
        id: 'solarWindDensityCm3',
        name: 'Solar Wind Proton Density (n_sw)',
        min: 1,
        max: 35,
        step: 1,
        defaultValue: 6,
        unit: 'cm⁻³',
        description: 'Number density n_sw of solar wind protons contributing to ram pressure P_dyn.',
        affects: 'custom',
      },
      dipoleTiltDeg: {
        id: 'dipoleTiltDeg',
        name: 'Geomagnetic Dipole Tilt Angle',
        min: 0,
        max: 30,
        step: 0.5,
        defaultValue: 11.5,
        unit: '°',
        description: 'Angle between Earth’s geographic rotational axis and its geomagnetic dipole axis.',
        affects: 'custom',
      },
      earthDipoleMomentFactor: {
        id: 'earthDipoleMomentFactor',
        name: 'Earth Magnetic Dipole Strength',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        defaultValue: 1.0,
        unit: '×B₀',
        description: 'Multiplier for Earth’s equatorial surface magnetic field strength (B₀ ≈ 31.2 μT).',
        affects: 'custom',
      },
      earthRotationSpeed: {
        id: 'earthRotationSpeed',
        name: 'Earth Diurnal Rotation Speed',
        min: 0,
        max: 3.0,
        step: 0.2,
        defaultValue: 1.0,
        unit: '×',
        description: 'Controls the rotational speed of the Earth globe around its geographic axis.',
        affects: 'custom',
      },
    },
    conditions: {
      showFieldLinesAndAxes: {
        id: 'showFieldLinesAndAxes',
        name: 'Show 3D Field Lines & Axes',
        type: 'boolean',
        defaultValue: true,
        description: 'Toggles the 3D dayside dipolar lines, magnetotail lobes, and axis rods.',
      },
      showSolarWindAndAurora: {
        id: 'showSolarWindAndAurora',
        name: 'Show Solar Wind & Auroral Ovals',
        type: 'boolean',
        defaultValue: true,
        description: 'Toggles incoming solar wind particles, bow shock envelope, and polar auroral rings.',
      },
    },
    parts: [
      {
        id: 'magnetosphere_earth_globe',
        name: 'Earth Globe, Rotational Axis & Magnetic Dipole Axis',
        label: 'Earth Globe, Rotational Axis & Magnetic Dipole Axis',
        shape: 'sphere',
        dimensions: [0.95, 0.95, 0.95],
        position: [-0.8, 0.3, 0],
        color: '#2563EB',
        material: 'plastic',
        description:
          'Rotating Earth with its white geographic rotational axis and magenta tilted geomagnetic dipole axis (~11.5°).',
        whatIsIt: 'Planetary body and internal geodynamo dipole source.',
        whatDoesItDo: 'Generates the global geomagnetic field that deflects charged solar wind particles.',
      },
      {
        id: 'magnetosphere_dayside_compressed_lines',
        name: 'Compressed Dayside Magnetic Field Lines (R_mp)',
        label: 'Compressed Dayside Magnetic Field Lines (R_mp)',
        shape: 'torus',
        dimensions: [1.6, 0.04],
        position: [-2.4, 0.3, 0],
        color: '#38BDF8',
        material: 'glow',
        description:
          'Closed dayside magnetic field lines compressed inward by solar wind dynamic pressure P_dyn.',
        whatIsIt: 'Dayside magnetosphere and Chapman–Ferraro magnetopause boundary.',
        whatDoesItDo: 'Balances solar wind ram pressure with magnetic pressure B²/(2μ₀).',
      },
      {
        id: 'magnetosphere_nightside_magnetotail',
        name: 'Stretched Nightside Magnetotail & Plasma Sheet',
        label: 'Stretched Nightside Magnetotail & Plasma Sheet',
        shape: 'cylinder',
        dimensions: [1.2, 3.8],
        position: [2.2, 0.3, 0],
        color: '#818CF8',
        material: 'glow',
        description:
          'Elongated nightside magnetic lobes and central plasma sheet stretched anti-sunward.',
        whatIsIt: 'Nightside magnetotail reservoir.',
        whatDoesItDo: 'Stores magnetic energy stretched by solar wind drag and channels plasma toward the poles.',
      },
      {
        id: 'magnetosphere_solar_wind_and_bow_shock',
        name: 'Solar Wind Plasma Stream & Bow Shock',
        label: 'Solar Wind Plasma Stream & Bow Shock',
        shape: 'sphere',
        dimensions: [1.2, 2.2, 2.2],
        position: [-3.4, 0.3, 0],
        color: '#F59E0B',
        material: 'glow',
        description:
          'Supersonic solar wind ions deflected around the parabolic bow shock ahead of the magnetopause.',
        whatIsIt: 'Heliospheric plasma stream and bow shock wave.',
        whatDoesItDo: 'Compresses the dayside field and drives space-weather activity.',
      },
      {
        id: 'magnetosphere_auroral_ovals_and_belts',
        name: 'Polar Auroral Ovals & Van Allen Radiation Belts',
        label: 'Polar Auroral Ovals & Van Allen Radiation Belts',
        shape: 'torus',
        dimensions: [0.42, 0.055],
        position: [-0.8, 1.15, 0],
        color: '#22C55E',
        material: 'glow',
        description:
          'Glowing northern and southern auroral rings around the magnetic poles and inner/outer Van Allen belts.',
        whatIsIt: 'Polar cusp auroral emission zones and trapped radiation belts.',
        whatDoesItDo: 'Emits visible light when magnetospheric particles precipitate into the upper atmosphere.',
      },
    ],
    equations: [
      'P_{\\text{dyn}} = \\rho_{\\text{sw}} v_{\\text{sw}}^2 \\approx m_p n_{\\text{sw}} v_{\\text{sw}}^2 \\quad [\\text{nPa}]',
      '\\frac{R_{\\text{mp}}}{R_E} \\approx \\left(\\frac{(2 B_{\\text{eq}})^2}{2\\mu_0 P_{\\text{dyn}}}\\right)^{1/6} \\quad (\\text{Chapman–Ferraro Magnetopause Standoff})',
      'B(r,\\lambda) = B_{\\text{eq}}\\left(\\frac{R_E}{r}\\right)^3 \\sqrt{1 + 3\\sin^2\\lambda}',
    ],
    curiosityPrompts: [
      'Why does a stronger solar wind compress the dayside magnetosphere while stretching the nightside magnetotail?',
      'Why is Earth’s north geographic pole actually near the geomagnetic south pole?',
      'Why do auroras form glowing oval rings around the magnetic poles during solar storms?',
    ],
  },

  // =========================================================================
  // 67. SEMICONDUCTOR P–N JUNCTION, BAND GAP & DIODE EXPLORER
  // =========================================================================
  semiconductorPnJunctionExplorer: {
    id: 'semiconductor-pn-junction-diode-explorer',
    title: 'Semiconductor p–n Junction, Band Gap & Diode Explorer',
    concept: 'Space-Charge Depletion Zone, Built-In Potential Barrier, Energy Band Bending & Shockley Diode I–V Law',
    description:
      'Interactive 3D solid-state semiconductor laboratory showing a doped p–n junction crystal, uncovered acceptor (−) and donor (+) ions in the depletion region, mobile holes (h⁺) and electrons (e⁻), 3D conduction/valence energy bands (E_c, E_v, E_g), and the exponential Shockley I–V curve.',
    whatIsIt:
      'A 3D solid-state physics explorer demonstrating how a p–n semiconductor junction rectifies electric current by modulating its depletion width W and potential barrier q(V_bi − V_bias).',
    howDoesItWork:
      'When p-type (majority holes h⁺) and n-type (majority electrons e⁻) semiconductors meet, carrier diffusion across the interface uncovers fixed negatively charged acceptor ions (N_A⁻) on the p-side and positively charged donor ions (N_D⁺) on the n-side. This space-charge depletion layer establishes an internal electric field and built-in potential V_bi (≈0.70 V in Si, ≈0.30 V in Ge, ≈1.20 V in GaAs). Applying forward bias (V_bias > 0) opposes the internal field, narrows the depletion width W(V) = W₀√(1 − V_bias/V_bi), lowers the energy band step q(V_bi − V_bias), and drives exponential current I_D = I_s(exp(qV_bias/(nk_BT)) − 1). Applying reverse bias (V_bias < 0) widens W, raises the potential barrier, and blocks current.',
    realLifeExample:
      'Rectifier diodes in AC-to-DC power adapters; Light-Emitting Diodes (LEDs); photovoltaic solar cells; CMOS computer processor transistors.',
    examConnection:
      'Shockley Diode Equation: I_D = I_s (e^(qV / nk_BT) − 1), where thermal voltage V_T = k_BT/q ≈ 25.85 mV at 300 K. Depletion width: W ∝ √(V_bi − V_bias). Band gap energies: Ge (0.66 eV), Si (1.12 eV), GaAs (1.42 eV).',
    scaleNote:
      'Microscopic Solid-State Visualization: Depletion widths (~0.1–1.5 μm), discrete dopant ions, and eV energy band diagrams are magnified into a unified 3D workbench.',
    simulationModel: 'predictive',
    functionalType: 'semiconductor-pn-junction-diode-explorer',
    prompt:
      'Create a 3D model of a semiconductor p-n junction, band gap and diode explorer with p-type and n-type regions, depletion zone, holes and electrons, energy band diagram, and I-V curve',
    camera: {
      position: [0.0, 3.1, 8.2],
      target: [0, 0.5, -0.3],
    },
    parameters: {
      biasVoltageV: {
        id: 'biasVoltageV',
        name: 'Applied Bias Voltage (V_bias)',
        min: -2.0,
        max: 1.1,
        step: 0.05,
        defaultValue: 0.65,
        unit: 'V',
        description:
          'External voltage applied across the p–n junction (+V for Forward Bias conduction, −V for Reverse Bias blocking).',
        affects: 'custom',
      },
      temperatureKelvin: {
        id: 'temperatureKelvin',
        name: 'Crystal Lattice Temperature (T)',
        min: 200,
        max: 450,
        step: 10,
        defaultValue: 300,
        unit: 'K',
        description: 'Absolute temperature T controlling thermal voltage V_T = k_BT/q and intrinsic carrier excitation.',
        affects: 'custom',
      },
      dopingLevelScale: {
        id: 'dopingLevelScale',
        name: 'Acceptor / Donor Doping Density',
        min: 0.5,
        max: 3.0,
        step: 0.25,
        defaultValue: 1.0,
        unit: '×N₀',
        description: 'Relative doping concentration scaling the space-charge depletion width W₀.',
        affects: 'custom',
      },
    },
    conditions: {
      semiconductorMaterial: {
        id: 'semiconductorMaterial',
        name: 'Semiconductor Crystal Material',
        type: 'select',
        defaultValue: 'silicon_si',
        options: [
          { value: 'silicon_si', label: 'Silicon (Si — E_g = 1.12 eV, V_bi ≈ 0.70 V)' },
          { value: 'germanium_ge', label: 'Germanium (Ge — E_g = 0.66 eV, V_bi ≈ 0.30 V)' },
          { value: 'gallium_arsenide_gaas', label: 'Gallium Arsenide (GaAs — E_g = 1.42 eV, V_bi ≈ 1.20 V)' },
        ],
        description: 'Selects the semiconductor crystal lattice and its fundamental band gap E_g.',
      },
      showEnergyBandsAndIv: {
        id: 'showEnergyBandsAndIv',
        name: 'Show 3D Energy Bands & I–V Curve',
        type: 'boolean',
        defaultValue: true,
        description: 'Toggles the 3D conduction/valence band diagram and Shockley diode I–V characteristic board.',
      },
    },
    parts: [
      {
        id: 'pn_ptype_anode_region',
        name: 'p-Type Semiconductor Region (Majority Holes h⁺)',
        label: 'p-Type Semiconductor Region (Majority Holes h⁺)',
        shape: 'box',
        dimensions: [3.2, 1.35, 1.8],
        position: [-1.95, 0.15, 0],
        color: '#F43F5E',
        material: 'glass',
        description:
          'Acceptor-doped p-type crystal region containing mobile positive holes (h⁺) and fixed negative acceptor ions.',
        whatIsIt: 'p-type semiconductor anode block.',
        whatDoesItDo: 'Injects majority holes across the junction when forward-biased.',
      },
      {
        id: 'pn_ntype_cathode_region',
        name: 'n-Type Semiconductor Region (Majority Electrons e⁻)',
        label: 'n-Type Semiconductor Region (Majority Electrons e⁻)',
        shape: 'box',
        dimensions: [3.2, 1.35, 1.8],
        position: [1.95, 0.15, 0],
        color: '#3B82F6',
        material: 'glass',
        description:
          'Donor-doped n-type crystal region containing mobile conduction electrons (e⁻) and fixed positive donor ions.',
        whatIsIt: 'n-type semiconductor cathode block.',
        whatDoesItDo: 'Injects majority conduction electrons across the junction when forward-biased.',
      },
      {
        id: 'pn_depletion_space_charge_zone',
        name: 'Space-Charge Depletion Layer (Width W)',
        label: 'Space-Charge Depletion Layer (Width W)',
        shape: 'box',
        dimensions: [1.1, 1.42, 1.88],
        position: [0, 0.15, 0],
        color: '#FACC15',
        material: 'glass',
        description:
          'Central depletion zone of width W containing uncovered fixed ions and internal electric field E_int.',
        whatIsIt: 'Space-charge potential barrier region.',
        whatDoesItDo: 'Narrows under forward bias to permit current flow and widens under reverse bias to block current.',
      },
      {
        id: 'pn_mobile_carriers_stream',
        name: 'Mobile Holes (h⁺) & Conduction Electrons (e⁻)',
        label: 'Mobile Holes (h⁺) & Conduction Electrons (e⁻)',
        shape: 'sphere',
        dimensions: [0.25, 0.25, 0.25],
        position: [0, 0.35, 0.5],
        color: '#22D3EE',
        material: 'glow',
        description:
          'Animated majority charge carriers diffusing across the lowered barrier under forward bias.',
        whatIsIt: 'Mobile electron and hole charge carriers.',
        whatDoesItDo: 'Carries the exponential forward diffusion current across the p–n interface.',
      },
      {
        id: 'pn_energy_band_diagram_deck',
        name: 'Conduction & Valence Energy Band Diagram (E_c, E_v, E_g)',
        label: 'Conduction & Valence Energy Band Diagram (E_c, E_v, E_g)',
        shape: 'box',
        dimensions: [3.8, 1.85, 0.14],
        position: [-1.7, 2.15, -1.55],
        color: '#A855F7',
        material: 'plastic',
        description:
          '3D energy band profile showing E_c, E_v, band gap E_g, and barrier height q(V_bi − V_bias).',
        whatIsIt: 'Solid-state electronic band diagram.',
        whatDoesItDo: 'Shows how forward bias flattens the potential hill so electrons and holes can cross.',
      },
      {
        id: 'pn_shockley_iv_curve_board',
        name: 'Shockley Diode I–V Characteristic Curve',
        label: 'Shockley Diode I–V Characteristic Curve',
        shape: 'box',
        dimensions: [3.2, 1.85, 0.14],
        position: [2.0, 2.15, -1.55],
        color: '#10B981',
        material: 'plastic',
        description:
          'Plots diode current I_D vs bias voltage V_bias with a glowing operating-point cursor.',
        whatIsIt: 'Non-linear diode I–V curve analyzer.',
        whatDoesItDo: 'Visualizes reverse blocking and exponential turn-on near V_bi.',
      },
    ],
    equations: [
      'I_D = I_s \\left( e^{\\frac{q V_{\\text{bias}}}{n k_B T}} - 1 \\right) \\quad , \\quad V_T = \\frac{k_B T}{q}',
      'W(V_{\\text{bias}}) = W_0 \\sqrt{1 - \\frac{V_{\\text{bias}}}{V_{\\text{bi}}}} \\quad , \\quad \\Delta E_{\\text{barrier}} = q(V_{\\text{bi}} - V_{\\text{bias}})',
      'E_g = E_c - E_v \\quad (\\text{Ge: } 0.66\\text{ eV}, \\; \\text{Si: } 1.12\\text{ eV}, \\; \\text{GaAs: } 1.42\\text{ eV})',
    ],
    curiosityPrompts: [
      'Why does a forward-biased p–n junction conduct current exponentially while a reverse-biased junction blocks current?',
      'How does changing the semiconductor crystal from Germanium (0.66 eV) to Silicon (1.12 eV) or GaAs (1.42 eV) shift the diode turn-on voltage?',
      'Why does the depletion zone widen when reverse bias voltage is applied?',
    ],
  },

  // =========================================================================
  // 68. RADIOACTIVE DECAY, HALF-LIFE & ALPHA–BETA–GAMMA RADIATION LAB
  // =========================================================================
  radioactiveDecayRadiationLab: {
    id: 'radioactive-decay-halflife-radiation-lab',
    title: 'Radioactive Decay, Half-Life & Alpha–Beta–Gamma Radiation Lab',
    concept: 'Exponential Decay Law N(t) = N₀e^(−λt), Lorentz Magnetic Deflection & Graded α/β⁻/γ Stopping Power',
    description:
      'Interactive 3D nuclear physics laboratory featuring a radioactive parent/daughter nuclide lattice, collimated α (⁴He²⁺), β⁻ (e⁻), and γ (photon) beams passing through a transverse magnetic deflection field, graded Paper / Aluminum / Lead absorber shields, a Geiger–Müller counter, and a live half-life decay curve.',
    whatIsIt:
      'A 3D nuclear radiation and half-life kinetics laboratory comparing exponential parent-to-daughter transmutation with the magnetic deflection and penetrating power of alpha, beta, and gamma emissions.',
    howDoesItWork:
      'Unstable parent nuclei decay randomly with decay constant λ = ln(2)/t_{1/2}, so the undecayed population follows N(t) = N₀ e^(−λt) = N₀ (1/2)^(t/t_{1/2}) and sample activity is A(t) = λN(t) (in Becquerels, Bq). When the collimated radiation beam enters a transverse magnetic field B, positively charged Alpha particles (⁴He²⁺, q = +2e, m = 4 u) deflect gently in one direction, light negatively charged Beta-minus electrons (e⁻, q = −e, m = 1/1836 u) deflect sharply in the opposite direction, and neutral Gamma photons (γ, q = 0) travel straight through. Graded absorber barriers demonstrate stopping power: a sheet of paper stops α particles, 4 mm of aluminum stops β⁻ electrons, and dense lead attenuates γ rays exponentially according to I(x) = I₀ e^(−μx).',
    realLifeExample:
      'Carbon-14 radiometric dating of archaeological artifacts; Technetium-99m medical imaging; lead shielding aprons and collimators in hospital radiology; smoke detectors using Americium-241 alpha particles.',
    examConnection:
      'Half-life decay law: N(t) = N₀ (1/2)^(t / t_{1/2}) = N₀ e^(−λt), λ = ln(2)/t_{1/2} ≈ 0.693/t_{1/2}. Activity: A(t) = λN(t) [Bq]. Stopping power: α stopped by paper; β⁻ stopped by ~few mm Al; γ attenuated exponentially by thick Pb (I = I₀ e^(−μx)).',
    scaleNote:
      'Educational Nuclear Lab Visualization: Individual parent/daughter lattice sites and α, β⁻, γ trajectories are rendered at macroscopic bench scale so Lorentz curvature and barrier penetration can be inspected directly.',
    simulationModel: 'predictive',
    functionalType: 'radioactive-decay-halflife-radiation-lab',
    prompt:
      'Create a 3D model of a radioactive decay, half-life and alpha-beta-gamma radiation lab with decaying nuclei lattice, magnetic deflection field, paper/aluminum/lead absorber shields, and Geiger counter',
    camera: {
      position: [0.0, 3.1, 8.5],
      target: [0, 0.6, 0],
    },
    parameters: {
      halfLifeSeconds: {
        id: 'halfLifeSeconds',
        name: 'Isotope Half-Life (t_{1/2})',
        min: 2,
        max: 30,
        step: 0.5,
        defaultValue: 8.0,
        unit: 's',
        description:
          'Half-life t_{1/2} in seconds (determines decay constant λ = ln(2)/t_{1/2} and exponential transmutation rate).',
        affects: 'custom',
      },
      initialNucleiCount: {
        id: 'initialNucleiCount',
        name: 'Initial Parent Nuclei (N₀)',
        min: 100,
        max: 1200,
        step: 50,
        defaultValue: 400,
        unit: 'nuclei',
        description: 'Initial number N₀ of unstable radioactive parent nuclei in the sample.',
        affects: 'custom',
      },
      leadShieldThicknessMm: {
        id: 'leadShieldThicknessMm',
        name: 'Lead Shield Thickness (x_Pb)',
        min: 0,
        max: 50,
        step: 2,
        defaultValue: 16,
        unit: 'mm',
        description: 'Thickness x_Pb of the dense lead absorber block attenuating gamma rays via I = I₀ e^(−μx).',
        affects: 'custom',
      },
      deflectionFieldTesla: {
        id: 'deflectionFieldTesla',
        name: 'Magnetic Deflection Field (B)',
        min: 0,
        max: 2.5,
        step: 0.1,
        defaultValue: 0.8,
        unit: 'T',
        description:
          'Transverse magnetic flux density B that deflects α (+2e) and β⁻ (−e) in opposite directions while leaving γ (q = 0) undeflected.',
        affects: 'custom',
      },
    },
    conditions: {
      radiationTypeFilter: {
        id: 'radiationTypeFilter',
        name: 'Displayed Radiation Beam Mode',
        type: 'select',
        defaultValue: 'all_three_beams',
        options: [
          { value: 'all_three_beams', label: 'All Three Beams (α²⁺, β⁻, and γ Simultaneously)' },
          { value: 'alpha_only', label: 'Alpha Particles Only (⁴He²⁺ Nuclei)' },
          { value: 'beta_only', label: 'Beta-Minus Particles Only (Fast Electrons e⁻)' },
          { value: 'gamma_only', label: 'Gamma Rays Only (High-Energy Photons γ)' },
        ],
        description: 'Isolates individual radiation types or displays all three simultaneously.',
      },
      absorberBarrierPreset: {
        id: 'absorberBarrierPreset',
        name: 'Absorber Shield Configuration',
        type: 'select',
        defaultValue: 'all_three_barriers',
        options: [
          { value: 'all_three_barriers', label: 'All Three Shields (Paper + Aluminum + Lead)' },
          { value: 'paper_and_aluminum', label: 'Paper + Aluminum Only (Stops α and β⁻)' },
          { value: 'paper_only', label: 'Paper Sheet Only (Stops α Only)' },
          { value: 'none_unshielded', label: 'Unshielded Vacuum Path (No Barriers)' },
        ],
        description: 'Inserts or removes the graded Paper, Aluminum, and Lead absorber shields.',
      },
    },
    parts: [
      {
        id: 'nuclear_decay_lattice_chamber',
        name: 'Radioactive Parent/Daughter Nuclide Lattice (N(t))',
        label: 'Radioactive Parent/Daughter Nuclide Lattice (N(t))',
        shape: 'box',
        dimensions: [1.5, 1.5, 1.5],
        position: [-3.9, 0.65, 0],
        color: '#F59E0B',
        material: 'glow',
        description:
          '3D lattice of parent nuclei (amber) transmuting into stable daughter nuclei (slate) according to half-life t_{1/2}.',
        whatIsIt: 'Radioactive isotope source lattice.',
        whatDoesItDo: 'Demonstrates exponential decay N(t) = N₀(1/2)^(t/t_{1/2}) over successive half-lives.',
      },
      {
        id: 'nuclear_magnetic_deflection_yoke',
        name: 'Magnetic Lorentz-Force Deflection Poles (B)',
        label: 'Magnetic Lorentz-Force Deflection Poles (B)',
        shape: 'cylinder',
        dimensions: [0.55, 1.9],
        position: [-1.35, 0.65, 0],
        color: '#6366F1',
        material: 'metal',
        description:
          'North/South magnetic pole pieces applying Lorentz force F = q(v × B) to separate charged radiation beams.',
        whatIsIt: 'Transverse magnetic dipole analyzer.',
        whatDoesItDo: 'Separates α (+2e, upward curve), β⁻ (−e, steep downward curve), and γ (0, straight line).',
      },
      {
        id: 'nuclear_alpha_beta_gamma_beams',
        name: 'Alpha (α²⁺), Beta (β⁻) & Gamma (γ) Beams',
        label: 'Alpha (α²⁺), Beta (β⁻) & Gamma (γ) Beams',
        shape: 'cylinder',
        dimensions: [0.25, 4.8],
        position: [0.1, 0.65, 0],
        color: '#22C55E',
        material: 'glow',
        description:
          'Color-coded radiation trajectories: coral α particles, cyan β⁻ electrons, and emerald γ photon wave-packets.',
        whatIsIt: 'Collimated nuclear radiation streams.',
        whatDoesItDo: 'Visualizes charge-to-mass deflection curvature and barrier stopping depth.',
      },
      {
        id: 'nuclear_graded_absorber_shields',
        name: 'Graded Paper, Aluminum & Lead Absorber Shields',
        label: 'Graded Paper, Aluminum & Lead Absorber Shields',
        shape: 'box',
        dimensions: [2.2, 2.2, 1.8],
        position: [1.7, 0.65, 0],
        color: '#94A3B8',
        material: 'metal',
        description:
          'Sequential radiation shields: Paper stops α, Aluminum (4 mm) stops β⁻, and Lead (x_Pb) attenuates γ exponentially.',
        whatIsIt: 'Multi-material radiation attenuation assembly.',
        whatDoesItDo: 'Demonstrates the dramatic difference in penetrating power between α, β⁻, and γ rays.',
      },
      {
        id: 'nuclear_geiger_muller_detector',
        name: 'Geiger–Müller Ionization Tube & Counter',
        label: 'Geiger–Müller Ionization Tube & Counter',
        shape: 'cylinder',
        dimensions: [0.36, 1.35],
        position: [4.1, 0.65, 0],
        color: '#EF4444',
        material: 'metal',
        description:
          'Downstream radiation detector pulsing at a rate proportional to transmitted radiation intensity (CPS).',
        whatIsIt: 'Geiger–Müller radiation detector tube.',
        whatDoesItDo: 'Measures the radiation count rate penetrating past the absorber barriers.',
      },
      {
        id: 'nuclear_halflife_decay_chart',
        name: 'Exponential Half-Life Decay Curve N(t)',
        label: 'Exponential Half-Life Decay Curve N(t)',
        shape: 'box',
        dimensions: [6.2, 1.75, 0.14],
        position: [0, 2.45, -1.65],
        color: '#38BDF8',
        material: 'plastic',
        description:
          'Real-time graph plotting N(t) = N₀ e^(−λt) with a live cursor tracking elapsed half-lives t / t_{1/2}.',
        whatIsIt: 'Half-life decay curve monitor.',
        whatDoesItDo: 'Tracks undecayed parent fraction (%) and instantaneous activity A(t) in Becquerels.',
      },
    ],
    equations: [
      'N(t) = N_0 e^{-\\lambda t} = N_0 \\left(\\frac{1}{2}\\right)^{t / t_{1/2}} \\quad , \\quad \\lambda = \\frac{\\ln 2}{t_{1/2}}',
      'A(t) = -\\frac{dN}{dt} = \\lambda N(t) \\quad [\\text{Bq}]',
      'I(x) = I_0 e^{-\\mu x} \\quad (\\text{Gamma Lead Attenuation}) \\quad , \\quad r_L = \\frac{mv}{|q|B}',
    ],
    curiosityPrompts: [
      'Why do Beta-minus (β⁻) particles curve much more sharply in a magnetic field than Alpha (α²⁺) particles?',
      'Why is a thin sheet of paper enough to stop 5 MeV alpha particles while gamma rays require centimeters of dense lead?',
      'Why does half of a radioactive sample decay in each half-life t_{1/2} rather than decaying at a constant linear rate?',
    ],
  },
};
