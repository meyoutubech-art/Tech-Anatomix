import { ScientificModelSpec } from '../types/aiModel';

/**
 * TECH-ANATOMIX: DISSECT YOUR CELL! — CHEMISTRY MODEL DEVELOPMENT BATCH 1 (MODELS 69–75)
 *
 * Final Registry IDs (verified unique across all 68 existing models):
 * 69. Molecular Orbital Explorer ('molecular-orbital-explorer')
 * 70. Atomic Orbital Probability Explorer ('atomic-orbital-probability-explorer')
 * 71. Advanced Crystal Lattice Explorer ('advanced-crystal-lattice-explorer')
 * 72. Molecular Polarity Explorer ('molecular-polarity-explorer')
 * 73. Intermolecular Forces Explorer ('intermolecular-forces-explorer')
 * 74. Electrochemical Cell Simulator ('electrochemical-cell-simulator')
 * 75. Electrolysis Explorer ('electrolysis-explorer')
 */
export const CHEMISTRY_BATCH_1_MODELS: Record<string, ScientificModelSpec> = {
  // =========================================================================
  // 69. MOLECULAR ORBITAL EXPLORER
  // =========================================================================
  molecularOrbitalExplorer: {
    id: 'molecular-orbital-explorer',
    title: 'Molecular Orbital Explorer',
    concept: 'Linear Combination of Atomic Orbitals (LCAO-MO), σ & π Symmetry, Wavefunction Phase & Bond Order',
    description:
      'Interactive 3D molecular-orbital laboratory demonstrating how atomic wavefunctions combine constructively and destructively to form σ and π bonding and antibonding molecular orbitals, complete with phase visualization, nodal planes, and live MO energy-level diagrams.',
    whatIsIt:
      'A quantum-chemical 3D laboratory that visualizes the Linear Combination of Atomic Orbitals (LCAO) for H₂ and homonuclear p-block diatomic molecules.',
    howDoesItWork:
      'When two atoms approach along the internuclear axis, their atomic wavefunctions ψ_A and ψ_B interfere. Constructive in-phase combination (ψ_+ = N_+[ψ_A + ψ_B]) concentrates electron probability density between Nucleus A and Nucleus B, shielding nuclear repulsion and lowering energy to form a Bonding Molecular Orbital (σ or π). Destructive out-of-phase combination (ψ_- = N_-[ψ_A − ψ_B]) creates a zero-density Nodal Surface between the nuclei, raising orbital energy to form an Antibonding Molecular Orbital (σ* or π*). Sigma (σ, σ*) orbitals exhibit cylindrical rotational symmetry around the internuclear axis, whereas pi (π, π*) orbitals arise from side-by-side 2p overlap and contain a nodal plane passing through the internuclear axis. Crucially, the positive (+) and negative (−) orbital lobe colors represent the mathematical algebraic sign (phase) of the wavefunction ψ, NOT electrical charge (all electrons carry negative charge −e). Furthermore, a 3D orbital surface is a 90% probability isosurface, not a hard physical boundary.',
    realLifeExample:
      'Explains why H₂ is a stable diatomic gas (Bond Order = 1.0) while He₂ does not exist as a stable covalent molecule (Bond Order = 0.0), and why liquid O₂ is paramagnetic due to unpaired electrons in degenerate π*₂p antibonding orbitals.',
    examConnection:
      'Bond Order = ½(N_bonding − N_antibonding). Constructive interference: ψ_bonding = N_+(ψ_A + ψ_B) (stabilized below E_AO). Destructive interference: ψ*_antibonding = N_-(ψ_A − ψ_B) (destabilized above E_AO with an internuclear nodal plane). Pauli Exclusion Principle: maximum 2 electrons (↑↓) per molecular orbital.',
    scaleNote:
      'Quantum Isosurface Convention: Rendered 3D lobes represent constant-probability-density contours (∫|ψ|²dV ≈ 90%) colored by wavefunction phase (+ψ cyan-blue, −ψ rose-red), not hard physical shells.',
    simulationModel: 'predictive',
    functionalType: 'molecular-orbital-explorer',
    prompt:
      'Create a 3D Molecular Orbital Explorer showing Nucleus A, Nucleus B, separated atomic orbitals, bonding and antibonding σ and π molecular orbitals, nodal surfaces, and an MO energy-level diagram',
    camera: {
      position: [0, 3.2, 10.5],
      target: [0, 0.5, 0],
    },
    parameters: {
      combinationProgressPct: {
        id: 'combinationProgressPct',
        name: 'Combination Slider (AO ➔ MO)',
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 100,
        unit: '%',
        description:
          'Transitions continuously between separated Atomic Orbitals (0%) and the combined Molecular Orbital representation (100%).',
        affects: 'custom',
      },
      internuclearDistanceAngstrom: {
        id: 'internuclearDistanceAngstrom',
        name: 'Internuclear Distance (R)',
        min: 0.5,
        max: 2.8,
        step: 0.05,
        defaultValue: 0.74,
        unit: 'Å',
        description:
          'Adjusts separation R between Nucleus A and Nucleus B, recalculating the overlap integral S(R) and energy splitting ΔE.',
        affects: 'custom',
      },
    },
    conditions: {
      orbitalPreset: {
        id: 'orbitalPreset',
        name: 'Orbital Selection',
        type: 'select',
        defaultValue: 'h2_sigma_1s_bonding',
        options: [
          { value: 'h2_sigma_1s_bonding', label: 'H₂ Bonding MO — σ₁s (1s + 1s Constructive)' },
          { value: 'h2_sigma_star_1s_antibonding', label: 'H₂ Antibonding MO — σ*₁s (1s − 1s Destructive)' },
          { value: 'p2_sigma_2pz_bonding', label: 'p-Orbital Sigma Bonding — σ₂p (2p_z + 2p_z Axial)' },
          { value: 'p2_sigma_star_2pz_antibonding', label: 'p-Orbital Sigma Antibonding — σ*₂p (2p_z − 2p_z Axial)' },
          { value: 'p2_pi_2px_bonding', label: 'p-Orbital Pi Bonding — π₂p (2p_y + 2p_y Side-by-Side)' },
          { value: 'p2_pi_star_2px_antibonding', label: 'p-Orbital Pi Antibonding — π*₂p (2p_y − 2p_y Out-of-Phase)' },
        ],
        description: 'Selects the supported atomic/molecular orbital combination and σ vs π symmetry.',
      },
      electronOccupancyConfig: {
        id: 'electronOccupancyConfig',
        name: 'Electron Occupancy Configuration',
        type: 'select',
        defaultValue: 'h2_ground_2e',
        options: [
          { value: 'h2_plus_1e', label: '1 e⁻ : H₂⁺ Ion (σ₁s)¹ — Bond Order = 0.5 (Paramagnetic)' },
          { value: 'h2_ground_2e', label: '2 e⁻ : H₂ Ground State (σ₁s)² — Bond Order = 1.0 (Diamagnetic)' },
          { value: 'he2_plus_3e', label: '3 e⁻ : He₂⁺ Ion (σ₁s)²(σ*₁s)¹ — Bond Order = 0.5 (Paramagnetic)' },
          { value: 'he2_unstable_4e', label: '4 e⁻ : He₂ Dimer (σ₁s)²(σ*₁s)² — Bond Order = 0.0 (No Net Bond)' },
        ],
        description: 'Configures valid Pauli-compliant electron occupancies in the bonding and antibonding levels.',
      },
      showPhaseColors: {
        id: 'showPhaseColors',
        name: 'Phase Visibility (+ψ / −ψ)',
        type: 'boolean',
        defaultValue: true,
        description: 'Toggles wavefunction phase colors (+ψ cyan-blue, −ψ rose-red) and explanatory phase badges.',
      },
      showNodalSurface: {
        id: 'showNodalSurface',
        name: 'Node Visibility (ψ = 0 Planes)',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides transverse and longitudinal Nodal Surfaces where wavefunction amplitude ψ = 0.',
      },
      showEnergyDiagram: {
        id: 'showEnergyDiagram',
        name: 'Energy Diagram Visibility',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides the 3D MO Energy-Level correlation diagram highlighting the active orbital.',
      },
    },
    parts: [
      {
        id: 'nucleus_a',
        name: 'Nucleus A',
        label: 'Nucleus A',
        shape: 'sphere',
        dimensions: [0.28, 0.28, 0.28],
        position: [-1.4, 0, 0],
        color: '#F59E0B',
        material: 'glow',
        description:
          'Left positively charged atomic nucleus anchoring Atomic Orbital A along the internuclear axis.',
        whatIsIt: 'Positively charged atomic core A (+Ze).',
        whatDoesItDo:
          'Exerts attractive Coulomb potential on electrons and experiences electrostatic shielding when bonding density accumulates between nuclei.',
      },
      {
        id: 'nucleus_b',
        name: 'Nucleus B',
        label: 'Nucleus B',
        shape: 'sphere',
        dimensions: [0.28, 0.28, 0.28],
        position: [1.4, 0, 0],
        color: '#F59E0B',
        material: 'glow',
        description:
          'Right positively charged atomic nucleus anchoring Atomic Orbital B along the internuclear axis.',
        whatIsIt: 'Positively charged atomic core B (+Ze).',
        whatDoesItDo:
          'Combines with Nucleus A across internuclear distance R to define the diatomic molecular potential well.',
      },
      {
        id: 'ao_a',
        name: 'Atomic Orbital A',
        label: 'Atomic Orbital A',
        shape: 'sphere',
        dimensions: [1.15, 1.15, 1.15],
        position: [-1.8, 0, 0],
        color: '#38BDF8',
        material: 'glass',
        description:
          'Unperturbed parent atomic wavefunction ψ_A centered on Nucleus A before combination.',
        whatIsIt: 'Monocentric atomic orbital wavefunction ψ_A (1s, 2p_z, or 2p_y).',
        whatDoesItDo:
          'Overlaps with Atomic Orbital B as the Combination Slider increases from 0% to 100%.',
      },
      {
        id: 'ao_b',
        name: 'Atomic Orbital B',
        label: 'Atomic Orbital B',
        shape: 'sphere',
        dimensions: [1.15, 1.15, 1.15],
        position: [1.8, 0, 0],
        color: '#38BDF8',
        material: 'glass',
        description:
          'Unperturbed parent atomic wavefunction ψ_B centered on Nucleus B before combination.',
        whatIsIt: 'Monocentric atomic orbital wavefunction ψ_B (1s, 2p_z, or 2p_y).',
        whatDoesItDo:
          'Combines in-phase (+ψ_B) for bonding orbitals or out-of-phase (−ψ_B) for antibonding orbitals.',
      },
      {
        id: 'mo_bonding',
        name: 'Bonding Molecular Orbital',
        label: 'Bonding Molecular Orbital',
        shape: 'sphere',
        dimensions: [1.8, 1.1, 1.1],
        position: [0, 0, 0],
        color: '#0EA5E9',
        material: 'glass',
        description:
          'Stabilized Bonding Molecular Orbital (σ₁s, σ₂p, or π₂p) formed by constructive wavefunction addition ψ_+ = N_+(ψ_A + ψ_B).',
        whatIsIt: 'Lower-energy constructive molecular orbital.',
        whatDoesItDo:
          'Concentrates electron probability density |ψ_+|² in the internuclear region, binding Nucleus A and Nucleus B together.',
      },
      {
        id: 'mo_antibonding',
        name: 'Antibonding Molecular Orbital',
        label: 'Antibonding Molecular Orbital',
        shape: 'sphere',
        dimensions: [1.4, 1.1, 1.1],
        position: [0, 0, 0],
        color: '#F43F5E',
        material: 'glass',
        description:
          'Destabilized Antibonding Molecular Orbital (σ*₁s, σ*₂p, or π*₂p) formed by destructive wavefunction subtraction ψ_- = N_-(ψ_A − ψ_B).',
        whatIsIt: 'Higher-energy destructive molecular orbital with internuclear node.',
        whatDoesItDo:
          'Depletes electron density between the nuclei and pushes probability density outward, opposing chemical bond formation.',
      },
      {
        id: 'nodal_surface',
        name: 'Nodal Surface',
        label: 'Nodal Surface',
        shape: 'box',
        dimensions: [0.04, 3.6, 3.6],
        position: [0, 0, 0],
        color: '#FDE047',
        material: 'glass',
        description:
          'Planar surface where wavefunction amplitude ψ(r) = 0 and electron probability density |ψ(r)|² is zero.',
        whatIsIt: 'Quantum-mechanical zero-amplitude nodal plane.',
        whatDoesItDo:
          'Marks phase inversion (+ψ to −ψ); transverse nodal planes bisect antibonding orbitals, while longitudinal nodal planes contain the bond axis in π orbitals.',
      },
      {
        id: 'molecular_axis',
        name: 'Molecular Axis',
        label: 'Molecular Axis',
        shape: 'cylinder',
        dimensions: [0.04, 8.2],
        position: [0, 0, 0],
        color: '#94A3B8',
        material: 'metal',
        description:
          'Reference internuclear z-axis passing through Nucleus A and Nucleus B with marked internuclear bonding zone.',
        whatIsIt: 'Internuclear symmetry axis.',
        whatDoesItDo:
          'Distinguishes cylindrically symmetric σ interactions from planar-antisymmetric π interactions.',
      },
      {
        id: 'energy_diagram',
        name: 'MO Energy-Level Diagram',
        label: 'MO Energy-Level Diagram',
        shape: 'box',
        dimensions: [4.4, 2.5, 0.1],
        position: [0, 2.95, -2.2],
        color: '#1E293B',
        material: 'standard',
        description:
          'Correlation diagram comparing parent Atomic Orbital energies with split Bonding (σ/π) and Antibonding (σ*/π*) levels and electron spins.',
        whatIsIt: 'LCAO-MO orbital energy and occupancy correlation board.',
        whatDoesItDo:
          'Displays real-time overlap S(R), energy stabilization, Pauli spin pairing, and net Bond Order.',
      },
    ],
    equations: [
      '\\psi_{\\text{bonding}} = N_+ (\\psi_A + \\psi_B), \\quad \\psi^*_{\\text{antibonding}} = N_- (\\psi_A - \\psi_B)',
      '\\text{Bond Order (BO)} = \\frac{N_{\\text{bonding}} - N_{\\text{antibonding}}}{2}',
      'S(R) = e^{-R/a_0}\\left(1 + \\frac{R}{a_0} + \\frac{R^2}{3a_0^2}\\right)',
    ],
    curiosityPrompts: [
      'Why does constructive interference in σ₁s lower potential energy while destructive interference in σ*₁s raises it?',
      'What is the difference between wavefunction phase (+ / −) and electrical charge?',
      'Why can two 2p_z orbitals form a σ bond while two parallel 2p_y orbitals form a π bond?',
    ],
  },

  // =========================================================================
  // 70. ATOMIC ORBITAL PROBABILITY EXPLORER
  // =========================================================================
  atomicOrbitalProbabilityExplorer: {
    id: 'atomic-orbital-probability-explorer',
    title: 'Atomic Orbital Probability Explorer',
    concept: 'Quantum Wavefunctions ψ(n,l,m_l), Born Probability Density |ψ|², Radial Nodes (n−l−1) & Angular Nodes (l)',
    description:
      'Interactive 3D quantum-mechanical atomic orbital laboratory exploring 1s, 2s, 2p (x, y, z), and 3d (z², x²−y², xy) probability density distributions |ψ(r,θ,φ)|² with adjustable isosurface thresholds, planar cross-section slicing, Monte Carlo probability point clouds, and exact radial and angular nodal surfaces.',
    whatIsIt:
      'A quantum-mechanics visualization laboratory that represents atomic orbitals as 3D Born probability-density distributions rather than classical planetary trajectories.',
    howDoesItWork:
      'Solving the Schrödinger wave equation for a hydrogen-like atom yields spatial orbitals ψ_{n,l,m_l}(r,θ,φ) = R_{n,l}(r) · Y_l^{m_l}(θ,φ) governed by three quantum numbers: Principal quantum number n (shell energy and size), Angular Momentum quantum number l (0 = s spherical, 1 = p bilobed dumbbell, 2 = d cloverleaf/toroidal), and Magnetic quantum number m_l (spatial orientation). By Born’s rule, |ψ(r,θ,φ)|² gives the probability density per unit volume of detecting the electron at point (r,θ,φ). For any hydrogen-like orbital, the number of spherical Radial Nodes is strictly (n − l − 1), the number of planar/conical Angular Nodes is strictly (l), and Total Nodes is (n − 1). Crucially, an electron does NOT travel along the rendered lobes like a track, and the displayed isosurface is not a hard physical wall—it simply encloses a chosen threshold fraction (e.g., 90%) of total electron probability.',
    realLifeExample:
      'Explains periodic table subshell blocks (s, p, d, f), spectroscopic transition selection rules (Δl = ±1), and directional covalent bonding geometries in chemistry.',
    examConnection:
      'Quantum numbers: n = 1, 2, 3…; l = 0, 1, …, (n − 1); m_l = −l, …, +l. Node formulas: Radial Nodes = n − l − 1; Angular Nodes = l; Total Nodes = n − 1. Radial distribution function: P(r) = 4πr²|R_{n,l}(r)|².',
    scaleNote:
      'Scientific Limitation Note: Displayed wavefunctions are exact for single-electron hydrogenic species (H, He⁺); in multi-electron atoms, inter-electronic repulsion and shielding modify radial penetration and split 2s/2p energies.',
    simulationModel: 'predictive',
    functionalType: 'atomic-orbital-probability-explorer',
    prompt:
      'Create a 3D Atomic Orbital Probability Explorer supporting 1s, 2s, 2p (x,y,z), and 3d orbitals with probability threshold slider, cross-section slice, radial and angular nodal surfaces, and probability point cloud',
    camera: {
      position: [0, 3.0, 9.8],
      target: [0, 0.3, 0],
    },
    parameters: {
      probabilityThresholdPct: {
        id: 'probabilityThresholdPct',
        name: 'Probability Threshold Contour',
        min: 50,
        max: 95,
        step: 5,
        defaultValue: 90,
        unit: '%',
        description:
          'Adjusts the enclosed probability density contour (from 50% high-density inner core to 95% extended boundary).',
        affects: 'custom',
      },
    },
    conditions: {
      orbitalType: {
        id: 'orbitalType',
        name: 'Orbital Selector (n, l)',
        type: 'select',
        defaultValue: '2p',
        options: [
          { value: '1s', label: '1s Orbital (n = 1, l = 0 — 0 Radial, 0 Angular Nodes)' },
          { value: '2s', label: '2s Orbital (n = 2, l = 0 — 1 Spherical Radial Node, 0 Angular Nodes)' },
          { value: '2p', label: '2p Orbital (n = 2, l = 1 — 0 Radial Nodes, 1 Planar Angular Node)' },
          { value: '3d', label: '3d Orbital (n = 3, l = 2 — 0 Radial Nodes, 2 Angular Nodes)' },
        ],
        description: 'Selects the atomic orbital subshell to inspect its radial and angular structure.',
      },
      orbitalOrientation: {
        id: 'orbitalOrientation',
        name: 'Orientation Selector (m_l)',
        type: 'select',
        defaultValue: 'z',
        options: [
          { value: 'z', label: 'z-Orientation: 2p_z or 3d_z² (m_l = 0)' },
          { value: 'x', label: 'x-Orientation: 2p_x (m_l = ±1 combination)' },
          { value: 'y', label: 'y-Orientation: 2p_y (m_l = ±1 combination)' },
          { value: 'x2_y2', label: 'Axial Cloverleaf: 3d_{x²−y²} (Lobes on x, y axes)' },
          { value: 'xy', label: 'Diagonal Cloverleaf: 3d_{xy} (Lobes between x, y axes)' },
        ],
        description: 'Switches the spatial orientation of anisotropic p and d orbitals.',
      },
      densityViewMode: {
        id: 'densityViewMode',
        name: 'Density View Mode',
        type: 'select',
        defaultValue: 'both',
        options: [
          { value: 'both', label: 'Combined Isosurface + Point-Density Cloud' },
          { value: 'isosurface', label: 'Probability-Density Isosurface Only' },
          { value: 'point_cloud', label: 'Monte Carlo Point-Density Cloud Only (|ψ|²)' },
        ],
        description: 'Switches between smooth constant-probability contours and discrete Born probability point clouds.',
      },
      showNodalSurfaces: {
        id: 'showNodalSurfaces',
        name: 'Node Visibility (Radial & Angular)',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides spherical Radial Nodes (n−l−1) and planar/conical Angular Nodes (l).',
      },
      crossSectionSlice: {
        id: 'crossSectionSlice',
        name: 'Cross-Section View (Planar Slice)',
        type: 'boolean',
        defaultValue: false,
        description: 'Slices the orbital open along a meridian plane to reveal concentric inner shells and radial nodes.',
      },
    },
    parts: [
      {
        id: 'atomic_nucleus',
        name: 'Atomic Nucleus',
        label: 'Atomic Nucleus',
        shape: 'sphere',
        dimensions: [0.22, 0.22, 0.22],
        position: [0, 0, 0],
        color: '#F59E0B',
        material: 'glow',
        description:
          'Central positively charged atomic nucleus at r = 0 generating the central Coulomb potential.',
        whatIsIt: 'Central nuclear point charge (+Ze) at the coordinate origin.',
        whatDoesItDo:
          'Binds the electron wavefunctions; s-orbitals have finite probability density |ψ(0)|² > 0 at the nucleus, whereas p and d orbitals have nodes at r = 0.',
      },
      {
        id: 'probability_isosurface',
        name: 'Probability Density Isosurface',
        label: 'Probability Density Isosurface',
        shape: 'sphere',
        dimensions: [2.1, 2.1, 2.1],
        position: [0, 0, 0],
        color: '#38BDF8',
        material: 'glass',
        description:
          '3D surface of constant probability density |ψ_{n,l,m_l}(r,θ,φ)|² colored by wavefunction phase (+ψ cyan-blue, −ψ rose-red).',
        whatIsIt: 'Constant-probability contour surface (not a hard physical wall).',
        whatDoesItDo:
          'Encloses the selected Probability Threshold percentage of electron density and reveals inner concentric shells when Cross-Section View is active.',
      },
      {
        id: 'probability_cloud',
        name: 'Quantum Probability Point Cloud',
        label: 'Quantum Probability Point Cloud',
        shape: 'sphere',
        dimensions: [2.2, 2.2, 2.2],
        position: [0, 0, 0],
        color: '#E0F2FE',
        material: 'glow',
        description:
          'Stochastic point-density representation where point concentration is proportional to Born probability density |ψ(r,θ,φ)|².',
        whatIsIt: 'Born statistical position-measurement cloud.',
        whatDoesItDo:
          'Illustrates that an orbital describes where an electron is statistically likely to be detected, rather than a deterministic orbit.',
      },
      {
        id: 'radial_node_sphere',
        name: 'Radial Nodal Surface',
        label: 'Radial Nodal Surface',
        shape: 'sphere',
        dimensions: [1.38, 1.38, 1.38],
        position: [0, 0, 0],
        color: '#FDE047',
        material: 'glass',
        description:
          'Concentric spherical shell where the radial wavefunction R_{n,l}(r) = 0 (count = n − l − 1).',
        whatIsIt: 'Spherical zero-probability shell (e.g., at r = 2a₀ in the 2s orbital).',
        whatDoesItDo:
          'Separates the inner positive-phase core of the 2s orbital from the outer negative-phase shell.',
      },
      {
        id: 'angular_node_plane',
        name: 'Angular Nodal Surface',
        label: 'Angular Nodal Surface',
        shape: 'box',
        dimensions: [4.4, 0.03, 4.4],
        position: [0, 0, 0],
        color: '#F43F5E',
        material: 'glass',
        description:
          'Planar or conical surface passing through the nucleus where the spherical harmonic Y_l^{m_l}(θ,φ) = 0 (count = l).',
        whatIsIt: 'Directional angular node (1 plane for 2p; 2 planes or cones for 3d).',
        whatDoesItDo:
          'Divides orbital lobes of opposite phase and rotates when the Orientation Selector changes.',
      },
      {
        id: 'coordinate_axes',
        name: 'Cartesian Reference Axes',
        label: 'Cartesian Reference Axes',
        shape: 'cylinder',
        dimensions: [0.03, 6.8],
        position: [0, 0, 0],
        color: '#94A3B8',
        material: 'metal',
        description:
          'Orthogonal x, y, and z spatial axes passing through the Atomic Nucleus.',
        whatIsIt: '3D Cartesian orientation frame.',
        whatDoesItDo:
          'Provides angular reference for p_x, p_y, p_z, d_z², d_{x²−y²}, and d_{xy} orbital orientations.',
      },
    ],
    equations: [
      '\\psi_{n,l,m_l}(r,\\theta,\\phi) = R_{n,l}(r)\\,Y_l^{m_l}(\\theta,\\phi), \\quad P(r) = 4\\pi r^2 |R_{n,l}(r)|^2',
      'N_{\\text{radial}} = n - l - 1, \\quad N_{\\text{angular}} = l, \\quad N_{\\text{total}} = n - 1',
    ],
    curiosityPrompts: [
      'Why does a 2s orbital have 1 radial node and 0 angular nodes while a 2p orbital has 0 radial nodes and 1 angular node?',
      'What is the difference between a quantum-mechanical orbital and a classical Bohr orbit?',
      'Why is the rendered boundary of an orbital an isosurface threshold rather than a hard physical wall?',
    ],
  },

  // =========================================================================
  // 71. ADVANCED CRYSTAL LATTICE EXPLORER
  // =========================================================================
  advancedCrystalLatticeExplorer: {
    id: 'advanced-crystal-lattice-explorer',
    title: 'Advanced Crystal Lattice Explorer',
    concept: 'Unit Cells (SC, BCC, FCC, HCP), Fractional Boundary Atom Sharing, Coordination Number & Atomic Packing Factor (APF)',
    description:
      'Interactive 3D solid-state crystallography laboratory comparing Simple Cubic (SC), Body-Centred Cubic (BCC), Face-Centred Cubic (FCC), and Hexagonal Close-Packed (HCP) structures with fractional atom-sharing rules, nearest-neighbour coordination highlighting, reversible multi-cell expansion, packing view, and side-by-side comparison mode.',
    whatIsIt:
      'A 3D crystallography and materials-science laboratory for inspecting unit-cell geometry, coordination shells, and hard-sphere packing efficiency.',
    howDoesItWork:
      'Crystalline solids consist of a periodic 3D Bravais lattice of points combined with an atomic basis. Atoms on unit-cell boundaries are shared among neighboring cells: a cubic Corner Atom is shared by 8 unit cells (1/8 contribution), a Face-Centred Atom is shared by 2 unit cells (1/2 contribution), a Body-Centred/Interior Atom belongs wholly to 1 cell (1 contribution), and a hexagonal prism corner atom is shared by 6 cells (1/6 contribution). Consequently, Simple Cubic (SC) has 8×(1/8) = 1 atom/cell (CN = 6, APF = 52.4%), Body-Centred Cubic (BCC) has 8×(1/8) + 1 = 2 atoms/cell (CN = 8, APF = 68.0%), Face-Centred Cubic (FCC) has 8×(1/8) + 6×(1/2) = 4 atoms/cell (CN = 12, APF = 74.0%), and the conventional Hexagonal Close-Packed (HCP) prism has 12×(1/6) + 2×(1/2) + 3×(1) = 6 atoms/cell (or 2 atoms per primitive cell, CN = 12, APF = 74.0%).',
    realLifeExample:
      'Explains why FCC metals (Cu, Al, Au, Ag) with close-packed slip planes are highly ductile, why iron transforms between BCC (α-Fe ferrite) and FCC (γ-Fe austenite) during steel heat treatment, and why Ti and Mg crystallize in HCP.',
    examConnection:
      'Cubic atom count: N_cell = (1/8)N_corner + (1/2)N_face + 1·N_body. Lattice constants: a_SC = 2r, a_BCC = 4r/√3, a_FCC = 2√2r. Atomic Packing Factor: APF = (N_cell · (4/3)πr³) / V_cell (SC = 52.4%, BCC = 68.0%, FCC = 74.0%, HCP = 74.0%).',
    scaleNote:
      'Idealized Hard-Sphere Note: Geometric relations assume touching spherical atoms of radius r; actual materials with the same crystal structure have element-specific radii, bond strengths, and physical properties.',
    simulationModel: 'predictive',
    functionalType: 'advanced-crystal-lattice-explorer',
    prompt:
      'Create a 3D Advanced Crystal Lattice Explorer supporting SC, BCC, FCC, and HCP unit cells with atom-sharing labels, nearest-neighbour highlighting, reversible multi-cell expansion, space-filling packing view, and comparison mode',
    camera: {
      position: [6.2, 4.8, 9.2],
      target: [0, 0.2, 0],
    },
    parameters: {
      atomicRadiusPm: {
        id: 'atomicRadiusPm',
        name: 'Atomic Radius (r)',
        min: 100,
        max: 220,
        step: 5,
        defaultValue: 140,
        unit: 'pm',
        description:
          'Adjusts idealized hard-sphere metallic radius r (100–220 pm) and recalculates unit-cell edge length a and cell volume V_cell.',
        affects: 'custom',
      },
      cellExpansionFactor: {
        id: 'cellExpansionFactor',
        name: 'Cell Expansion (Multi-Cell Separation)',
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 0,
        unit: '%',
        description:
          'Reversibly separates adjacent unit cells and lattice sites to demonstrate how boundary atoms are shared across unit-cell walls.',
        affects: 'custom',
      },
    },
    conditions: {
      latticeType: {
        id: 'latticeType',
        name: 'Structure Selector',
        type: 'select',
        defaultValue: 'FCC',
        options: [
          { value: 'SC', label: 'Simple Cubic (SC) — 1 Atom/Cell, CN = 6, APF = 52.4%' },
          { value: 'BCC', label: 'Body-Centred Cubic (BCC) — 2 Atoms/Cell, CN = 8, APF = 68.0%' },
          { value: 'FCC', label: 'Face-Centred Cubic (FCC) — 4 Atoms/Cell, CN = 12, APF = 74.0%' },
          { value: 'HCP', label: 'Hexagonal Close-Packed (HCP) — 6 Atoms/Hex Cell (2/Primitive), CN = 12, APF = 74.0%' },
        ],
        description: 'Switches the active crystal structure between SC, BCC, FCC, and HCP.',
      },
      packingViewMode: {
        id: 'packingViewMode',
        name: 'Packing View Mode',
        type: 'select',
        defaultValue: 'ball_and_stick',
        options: [
          { value: 'ball_and_stick', label: 'Crystallographic Site View (Clear Interior Inspection)' },
          { value: 'space_filling', label: 'Hard-Sphere Packing View (Touching Nearest Neighbours)' },
        ],
        description: 'Toggles between reduced-radius site view and touching hard-sphere packing representation.',
      },
      comparisonLatticeType: {
        id: 'comparisonLatticeType',
        name: 'Comparison Mode',
        type: 'select',
        defaultValue: 'none',
        options: [
          { value: 'none', label: 'Single Structure View (Comparison Off)' },
          { value: 'SC', label: 'Compare Side-by-Side with Simple Cubic (SC)' },
          { value: 'BCC', label: 'Compare Side-by-Side with Body-Centred Cubic (BCC)' },
          { value: 'FCC', label: 'Compare Side-by-Side with Face-Centred Cubic (FCC)' },
          { value: 'HCP', label: 'Compare Side-by-Side with Hexagonal Close-Packed (HCP)' },
        ],
        description: 'Displays a second unit cell side-by-side at consistent scale for direct comparison.',
      },
      showUnitCellWireframe: {
        id: 'showUnitCellWireframe',
        name: 'Unit Cell Visibility',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides the geometric unit-cell boundary wireframe edges.',
      },
      showPositionLabels: {
        id: 'showPositionLabels',
        name: 'Atomic Position Labels (1/8, 1/2, 1)',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides fractional atom-sharing badges on Corner, Face, and Body sites.',
      },
      highlightNearestNeighbours: {
        id: 'highlightNearestNeighbours',
        name: 'Neighbour Highlighting (Coordination Shell)',
        type: 'boolean',
        defaultValue: true,
        description: 'Highlights nearest-neighbour contact struts illustrating Coordination Number (CN = 6, 8, or 12).',
      },
    },
    parts: [
      {
        id: 'unit_cell_frame',
        name: 'Unit Cell Boundary Frame',
        label: 'Unit Cell Boundary Frame',
        shape: 'box',
        dimensions: [3.0, 3.0, 3.0],
        position: [0, 0, 0],
        color: '#38BDF8',
        material: 'metal',
        description:
          'Geometric wireframe defining the conventional unit cell edges (cubic a × a × a or hexagonal prism a, c) and expandable octant sub-cells.',
        whatIsIt: 'Conventional crystallographic unit-cell boundary.',
        whatDoesItDo:
          'Partitions the periodic lattice into repeating volume elements and defines boundary atom-sharing fractions.',
      },
      {
        id: 'corner_atoms',
        name: 'Corner Lattice Sites',
        label: 'Corner Lattice Sites',
        shape: 'sphere',
        dimensions: [0.42, 0.42, 0.42],
        position: [-1.5, -1.5, 1.5],
        color: '#38BDF8',
        material: 'standard',
        description:
          'Atoms at the unit-cell vertices (8 corners in SC/BCC/FCC contributing 1/8 each; 12 corners in conventional HCP contributing 1/6 each).',
        whatIsIt: 'Vertex lattice positions shared by 8 cubic cells (or 6 hexagonal cells).',
        whatDoesItDo:
          'Contributes 8 × (1/8) = 1.0 net atom to cubic unit cells and 12 × (1/6) = 2.0 net atoms to the conventional HCP cell.',
      },
      {
        id: 'face_center_atoms',
        name: 'Face-Centred Lattice Sites',
        label: 'Face-Centred Lattice Sites',
        shape: 'sphere',
        dimensions: [0.42, 0.42, 0.42],
        position: [0, 1.5, 0],
        color: '#10B981',
        material: 'standard',
        description:
          'Atoms centered on the planar faces of the unit cell (6 faces in FCC contributing 1/2 each; 2 basal faces in HCP contributing 1/2 each).',
        whatIsIt: 'Planar boundary sites shared equally between 2 adjacent unit cells.',
        whatDoesItDo:
          'Adds 6 × (1/2) = 3.0 net atoms to FCC (bringing total to 4) and 2 × (1/2) = 1.0 net atom to conventional HCP.',
      },
      {
        id: 'body_interior_atoms',
        name: 'Body-Centred / Interior Sites',
        label: 'Body-Centred / Interior Sites',
        shape: 'sphere',
        dimensions: [0.46, 0.46, 0.46],
        position: [0, 0, 0],
        color: '#F59E0B',
        material: 'standard',
        description:
          'Atoms completely enclosed inside the unit-cell interior (1 central atom at (½,½,½) in BCC; 3 mid-plane B-layer atoms in HCP).',
        whatIsIt: 'Unshared interior lattice sites (contribution = 1 per atom).',
        whatDoesItDo:
          'Increases atomic packing efficiency to 68.0% in BCC and 74.0% in close-packed HCP.',
      },
      {
        id: 'coordination_polyhedron',
        name: 'Nearest-Neighbour Coordination Shell',
        label: 'Nearest-Neighbour Coordination Shell',
        shape: 'octahedron',
        dimensions: [1.5, 1.5, 1.5],
        position: [0, 0, 0],
        color: '#F43F5E',
        material: 'glow',
        description:
          'Highlighted contact vectors connecting the reference atom to its equidistant nearest neighbours (CN = 6 in SC, 8 in BCC, 12 in FCC/HCP).',
        whatIsIt: 'First-shell coordination network.',
        whatDoesItDo:
          'Demonstrates the exact touching directions (edge in SC, body diagonal in BCC, face diagonal in FCC) used to derive a(r).',
      },
      {
        id: 'comparison_lattice_cell',
        name: 'Comparison Reference Unit Cell',
        label: 'Comparison Reference Unit Cell',
        shape: 'box',
        dimensions: [2.4, 2.4, 2.4],
        position: [4.6, 0, 0],
        color: '#A855F7',
        material: 'standard',
        description:
          'Side-by-side secondary crystal structure rendered at consistent atomic scale when Comparison Mode is active.',
        whatIsIt: 'Comparative crystallography reference cell.',
        whatDoesItDo:
          'Enables direct visual comparison of packing density and coordination geometry between two structures.',
      },
    ],
    equations: [
      'N_{\\text{cubic}} = \\frac{1}{8}N_{\\text{corner}} + \\frac{1}{2}N_{\\text{face}} + 1\\cdot N_{\\text{body}}, \\quad N_{\\text{HCP,conv}} = \\frac{1}{6}(12) + \\frac{1}{2}(2) + 1(3) = 6',
      'a_{\\text{SC}} = 2r, \\quad a_{\\text{BCC}} = \\frac{4r}{\\sqrt{3}}, \\quad a_{\\text{FCC}} = 2\\sqrt{2}\\,r, \\quad \\left(\\frac{c}{a}\\right)_{\\text{HCP}} = \\sqrt{\\frac{8}{3}} \\approx 1.633',
      '\\text{APF} = \\frac{N_{\\text{cell}} \\cdot \\frac{4}{3}\\pi r^3}{V_{\\text{cell}}} \\quad (\\text{SC: } 52.4\\%,\\; \\text{BCC: } 68.0\\%,\\; \\text{FCC & HCP: } 74.0\\%)',
    ],
    curiosityPrompts: [
      'Why does a corner atom in a cubic unit cell contribute only 1/8 of an atom while a face-centred atom contributes 1/2?',
      'How do both FCC and HCP achieve the same maximum 74.0% Atomic Packing Factor despite having different unit-cell shapes?',
      'Why does crystal structure influence whether a metal is ductile or brittle?',
    ],
  },

  // =========================================================================
  // 72. MOLECULAR POLARITY EXPLORER
  // =========================================================================
  molecularPolarityExplorer: {
    id: 'molecular-polarity-explorer',
    title: 'Molecular Polarity Explorer',
    concept: 'Electronegativity Difference (Δχ), Bond Dipoles, VSEPR 3D Geometry & Vector Superposition (μ_net = Σ μ_i)',
    description:
      'Interactive 3D molecular polarity laboratory for H₂O, CO₂, NH₃, CH₄, and BF₃ demonstrating how individual bond dipoles, partial atomic charges (δ⁺/δ⁻), lone-pair VSEPR geometry, and 3D vector addition determine net molecular polarity.',
    whatIsIt:
      'A 3D vector-addition and VSEPR molecular geometry laboratory that distinguishes bond polarity from overall molecular polarity.',
    howDoesItWork:
      'When two covalently bonded atoms differ in Pauling electronegativity (Δχ = |χ_B − χ_A|), shared bonding electrons shift toward the more electronegative atom, creating partial charges (δ⁺ on the less electronegative atom, δ⁻ on the more electronegative atom) and an individual bond dipole vector μ_i (+—▸ pointing from δ⁺ to δ⁻). However, polar bonds do NOT automatically make the entire molecule polar! Overall molecular polarity is the 3D vector sum μ_net = Σ μ_i across the molecule’s equilibrium VSEPR geometry. In linear CO₂ (180°), trigonal planar BF₃ (120°), and tetrahedral CH₄ (109.5°), symmetrical arrangement causes the bond-dipole vectors to cancel completely (μ_net = 0 D, NONPOLAR). In bent H₂O (104.5°) and trigonal pyramidal NH₃ (107.0°), lone-pair asymmetry prevents cancellation, yielding a strong resultant molecular dipole (μ_net = 1.85 D for H₂O and 1.47 D for NH₃, POLAR).',
    realLifeExample:
      'Explains why water (polar, μ = 1.85 D) dissolves ionic salts and responds to microwave fields, while carbon dioxide and methane (nonpolar, μ = 0 D) are gases at room temperature with low water solubility.',
    examConnection:
      'Net dipole moment: μ_net = Σ μ_i. Crossed-arrow convention (+—▸): tail (+) at δ⁺ (lower χ), head (▸) at δ⁻ (higher χ). Polar examples: H₂O (bent 104.5°, 1.85 D), NH₃ (trigonal pyramidal 107.0°, 1.47 D). Nonpolar examples via symmetry cancellation: CO₂ (linear 180°), BF₃ (trigonal planar 120°), CH₄ (tetrahedral 109.5°).',
    scaleNote:
      'Dipole Vector Legend: Cyan crossed arrows (+—▸) represent individual bond dipoles (δ⁺ ➔ δ⁻); the Gold arrow represents the resultant net molecular dipole μ_net = Σ μ_i. Partial charges (δ⁺/δ⁻) are fractions of an elementary charge, not full ionic charges.',
    simulationModel: 'predictive',
    functionalType: 'molecular-polarity-explorer',
    prompt:
      'Create a 3D Molecular Polarity Explorer for H2O, CO2, NH3, CH4, and BF3 showing VSEPR bond angles, partial charges, individual bond dipole arrows, and the resultant molecular dipole vector',
    camera: {
      position: [0, 2.8, 9.2],
      target: [0, 0.2, 0],
    },
    parameters: {},
    conditions: {
      moleculeId: {
        id: 'moleculeId',
        name: 'Molecule Selector',
        type: 'select',
        defaultValue: 'H2O',
        options: [
          { value: 'H2O', label: 'H₂O (Water) — Bent (104.5°), Polar (μ_net = 1.85 D)' },
          { value: 'CO2', label: 'CO₂ (Carbon Dioxide) — Linear (180.0°), Nonpolar (μ_net = 0.00 D)' },
          { value: 'NH3', label: 'NH₃ (Ammonia) — Trigonal Pyramidal (107.0°), Polar (μ_net = 1.47 D)' },
          { value: 'CH4', label: 'CH₄ (Methane) — Tetrahedral (109.5°), Nonpolar (μ_net = 0.00 D)' },
          { value: 'BF3', label: 'BF₃ (Boron Trifluoride) — Trigonal Planar (120.0°), Nonpolar (μ_net = 0.00 D)' },
        ],
        description: 'Switches between the five supported molecules and updates 3D geometry, charges, and dipole vectors.',
      },
      showBondDipoles: {
        id: 'showBondDipoles',
        name: 'Bond Dipole Toggle (+—▸)',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides individual cyan bond-dipole vectors pointing from δ⁺ toward δ⁻.',
      },
      showResultantDipole: {
        id: 'showResultantDipole',
        name: 'Resultant Dipole Toggle (μ_net)',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides the gold resultant molecular dipole vector (or green zero-dipole symmetry ring).',
      },
      showPartialCharges: {
        id: 'showPartialCharges',
        name: 'Partial Charges (δ⁺ / δ⁻)',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides δ⁺ and δ⁻ partial-charge badges on the Central and Terminal Atoms.',
      },
      showGeometryOverlay: {
        id: 'showGeometryOverlay',
        name: 'Geometry View (Bond Angles & Lone Pairs)',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides VSEPR bond-angle arcs and non-bonding lone-pair electron lobes.',
      },
    },
    parts: [
      {
        id: 'central_atom',
        name: 'Central Atom',
        label: 'Central Atom',
        shape: 'sphere',
        dimensions: [0.58, 0.58, 0.58],
        position: [0, 0, 0],
        color: '#EF4444',
        material: 'standard',
        description:
          'Central atom of the molecule (O in H₂O, C in CO₂ and CH₄, N in NH₃, B in BF₃) at the VSEPR vertex.',
        whatIsIt: 'Central coordination center.',
        whatDoesItDo:
          'Determines the steric number, lone-pair repulsion, and 3D bond angles that govern vector addition.',
      },
      {
        id: 'terminal_atoms',
        name: 'Terminal Atoms',
        label: 'Terminal Atoms',
        shape: 'sphere',
        dimensions: [0.4, 0.4, 0.4],
        position: [1.2, -0.8, 0],
        color: '#F8FAFC',
        material: 'standard',
        description:
          'Surrounding bonded atoms (H, O, or F) positioned at accurate 3D VSEPR bond angles (104.5°, 180°, 107.0°, 109.5°, or 120.0°).',
        whatIsIt: 'Peripheral bonded atoms.',
        whatDoesItDo:
          'Form polar or weakly polar covalent bonds with the Central Atom based on electronegativity difference Δχ.',
      },
      {
        id: 'covalent_bonds',
        name: 'Covalent Bond Cylinders',
        label: 'Covalent Bond Cylinders',
        shape: 'cylinder',
        dimensions: [0.09, 1.65],
        position: [0.6, -0.4, 0],
        color: '#CBD5E1',
        material: 'metal',
        description:
          'Shared electron-pair covalent bonds linking the Central Atom to each Terminal Atom.',
        whatIsIt: 'Intramolecular covalent bond axes.',
        whatDoesItDo:
          'Defines the lines of action along which individual bond-dipole vectors act.',
      },
      {
        id: 'bond_dipole_vectors',
        name: 'Bond Dipole Vectors',
        label: 'Bond Dipole Vectors',
        shape: 'cone',
        dimensions: [0.13, 1.2],
        position: [0.8, -0.5, 0.38],
        color: '#06B6D4',
        material: 'glow',
        description:
          'Cyan crossed-arrow vectors (+—▸) showing individual bond polarity from δ⁺ (lower χ) to δ⁻ (higher χ).',
        whatIsIt: 'Individual bond dipole moment vectors μ_i.',
        whatDoesItDo:
          'Visualizes the magnitude and direction of each bond’s charge shift before 3D vector summation.',
      },
      {
        id: 'resultant_dipole_vector',
        name: 'Resultant Molecular Dipole Vector',
        label: 'Resultant Molecular Dipole Vector',
        shape: 'cone',
        dimensions: [0.22, 1.8],
        position: [0, 0.2, 0.78],
        color: '#F59E0B',
        material: 'glow',
        description:
          'Gold net molecular dipole arrow μ_net = Σ μ_i (or green symmetry-cancellation ring when μ_net = 0 D).',
        whatIsIt: 'Vector resultant of all individual bond dipoles.',
        whatDoesItDo:
          'Shows why H₂O and NH₃ have a net dipole moment while CO₂, BF₃, and CH₄ cancel to zero.',
      },
      {
        id: 'partial_charge_markers',
        name: 'Partial Charge & Lone Pair Markers',
        label: 'Partial Charge & Lone Pair Markers',
        shape: 'sphere',
        dimensions: [0.38, 0.38, 0.38],
        position: [0, 0.9, 0],
        color: '#A855F7',
        material: 'glass',
        description:
          'δ⁺ and δ⁻ partial-charge badges and translucent purple non-bonding lone-pair lobes on O (H₂O) and N (NH₃).',
        whatIsIt: 'Partial-charge and lone-pair electron domain indicators.',
        whatDoesItDo:
          'Distinguishes fractional covalent partial charges (δ⁺/δ⁻) from full ionic charges and explains bent/pyramidal lone-pair distortion.',
      },
      {
        id: 'geometry_angle_arc',
        name: 'VSEPR Bond Angle Arc',
        label: 'VSEPR Bond Angle Arc',
        shape: 'torus',
        dimensions: [0.95, 0.035],
        position: [0, 0, 0],
        color: '#A855F7',
        material: 'glow',
        description:
          'Angular sector arc measuring the equilibrium VSEPR bond angle θ between covalent bonds.',
        whatIsIt: '3D bond-angle protractor arc.',
        whatDoesItDo:
          'Links molecular bond angle θ directly to vector projection μ_net = 2μ cos(θ/2).',
      },
    ],
    equations: [
      '\\vec{\\mu}_{\\text{net}} = \\sum_{i=1}^{N} \\vec{\\mu}_i, \\quad |\\vec{\\mu}_{\\text{H}_2\\text{O}}| = 2\\,\\mu_{\\text{OH}}\\cos\\left(\\frac{104.5^\\circ}{2}\\right) \\approx 1.85\\text{ D}',
      '\\Delta \\chi_{AB} = |\\chi_A - \\chi_B| \\implies \\delta^+\\text{ (low }\\chi) \\longrightarrow \\delta^-\\text{ (high }\\chi)',
    ],
    curiosityPrompts: [
      'Why are CO₂ and BF₃ nonpolar molecules even though C=O and B–F bonds are strongly polar?',
      'How do lone pairs on oxygen in H₂O and nitrogen in NH₃ prevent bond-dipole cancellation?',
      'Why are partial charges (δ⁺ / δ⁻) not equivalent to full ionic charges (+1 / −1)?',
    ],
  },

  // =========================================================================
  // 73. INTERMOLECULAR FORCES EXPLORER
  // =========================================================================
  intermolecularForcesExplorer: {
    id: 'intermolecular-forces-explorer',
    title: 'Intermolecular Forces Explorer',
    concept: 'London Dispersion (Instantaneous–Induced Dipoles), Dipole–Dipole Interactions & Directional Hydrogen Bonding',
    description:
      'Interactive 3D intermolecular attractions laboratory comparing Hydrogen Bonding (H₂O⋯H₂O), Dipole–Dipole Interactions (HCl⋯HCl), and London Dispersion Forces (Ar⋯Ar and I₂⋯I₂) with real-time distance & orientation controls, dashed non-covalent force overlays, thermal motion, and boiling-point comparison.',
    whatIsIt:
      'A 3D physical-chemistry laboratory showing how non-covalent electrostatic attractions arise between molecules and govern phase behavior.',
    howDoesItWork:
      'Intermolecular forces (IMFs) are non-covalent electrostatic attractions between separate molecules—depicted as dashed force overlays rather than solid covalent bonds. (1) London Dispersion Forces arise from quantum fluctuations in electron clouds that create an instantaneous dipole in one molecule and induce a synchronized dipole in a neighbor (V ∝ −α₁α₂/r⁶); dispersion forces act between ALL atoms and molecules, and scale strongly with electron count and polarizability α. (2) Dipole–Dipole Interactions occur between polar molecules with permanent partial charges (such as HCl⋯HCl) and depend strongly on relative orientation θ (attractive when δ⁺ aligns with δ⁻, repulsive if like charges face). (3) Hydrogen Bonding occurs when H covalently bonded to N, O, or F interacts directionally with a lone pair on a neighboring N, O, or F atom (such as H₂O⋯H₂O). Notably, one IMF type is not always strongest in every comparison: large nonpolar I₂ (106 e⁻, BP +184.3°C) has stronger total dispersion forces than small polar HCl (18 e⁻, BP −85.1°C).',
    realLifeExample:
      'Explains why water boils at +100°C (extensive hydrogen-bond network) while H₂S is a gas (−60°C), and why halogens progress from gas (F₂, Cl₂) to liquid (Br₂) to solid (I₂) as polarizability α increases.',
    examConnection:
      'Dispersion energy: V_disp ∝ −α₁α₂/r⁶ (present in ALL molecules). Keesom/Dipole–Dipole energy: V_dip ∝ −(μ₁μ₂/r³)·f(θ). Hydrogen bond requirement: Donor D–H (D = N, O, F) ⋯ :A Acceptor (A = N, O, F). Stronger net IMFs ➔ higher normal boiling point and enthalpy of vaporization ΔH_vap.',
    scaleNote:
      'Model Scope Note: Pairwise interaction energy V(r,θ) uses a calibrated Lennard-Jones + angular Keesom/H-bond physical model for two interacting molecules; it is an educational two-body potential explorer rather than a bulk multi-thousand-molecule MD simulation.',
    simulationModel: 'predictive',
    functionalType: 'intermolecular-forces-explorer',
    prompt:
      'Create a 3D Intermolecular Forces Explorer comparing Hydrogen Bonding in H2O, Dipole-Dipole in HCl, and London Dispersion in Ar and I2 with separation distance slider, orientation slider, dashed attraction overlay, and thermal motion control',
    camera: {
      position: [0, 3.0, 10.2],
      target: [0, -0.2, 0],
    },
    parameters: {
      separationAngstrom: {
        id: 'separationAngstrom',
        name: 'Separation Control (Intermolecular Distance r)',
        min: 2.3,
        max: 6.5,
        step: 0.1,
        defaultValue: 2.9,
        unit: 'Å',
        description:
          'Physically moves the two molecules closer or farther apart (2.3–6.5 Å) and updates the pair potential V(r,θ).',
        affects: 'custom',
      },
      relativeOrientationDeg: {
        id: 'relativeOrientationDeg',
        name: 'Orientation Control (Relative Angle θ)',
        min: 0,
        max: 180,
        step: 5,
        defaultValue: 0,
        unit: '°',
        description:
          'Rotates the partner molecule from optimal head-to-tail attraction (0°) to perpendicular (90°) and anti-aligned repulsion (180°).',
        affects: 'custom',
      },
      thermalMotionLevel: {
        id: 'thermalMotionLevel',
        name: 'Thermal Motion Control (Temperature T)',
        min: 50,
        max: 500,
        step: 10,
        defaultValue: 298,
        unit: 'K',
        description:
          'Adjusts the speed of qualitative thermal agitation (50–500 K) to compare thermal kinetic energy against IMF binding.',
        affects: 'custom',
      },
    },
    conditions: {
      interactionType: {
        id: 'interactionType',
        name: 'Interaction & Molecule Selector',
        type: 'select',
        defaultValue: 'hydrogen_bonding_h2o',
        options: [
          { value: 'hydrogen_bonding_h2o', label: 'Hydrogen Bonding + Dispersion — Water Dimer (H₂O ⋯ H₂O)' },
          { value: 'dipole_dipole_hcl', label: 'Dipole–Dipole + Dispersion — Hydrogen Chloride (HCl ⋯ HCl)' },
          { value: 'dispersion_ar2', label: 'London Dispersion Only — Argon Pair (Ar ⋯ Ar, Weak α)' },
          { value: 'dispersion_i2', label: 'Strong London Dispersion — Iodine Dimer (I₂ ⋯ I₂, Large α)' },
        ],
        description: 'Switches the molecular system and updates active intermolecular forces and boiling points.',
      },
      showInteractionOverlay: {
        id: 'showInteractionOverlay',
        name: 'Interaction Overlay (Dashed Forces & Clouds)',
        type: 'boolean',
        defaultValue: true,
        description: 'Toggles dashed non-covalent force indicators, δ⁺/δ⁻ badges, and polarizable electron cloud hulls.',
      },
      showComparisonSystem: {
        id: 'showComparisonSystem',
        name: 'Comparison Mode (Boiling Point Reference)',
        type: 'boolean',
        defaultValue: false,
        description: 'Displays a comparative boiling-point and polarizability reference board above the dimer.',
      },
    },
    parts: [
      {
        id: 'molecule_1',
        name: 'Primary Donor / Left Molecule',
        label: 'Primary Donor / Left Molecule',
        shape: 'sphere',
        dimensions: [1.0, 1.0, 1.0],
        position: [-1.5, 0, 0],
        color: '#EF4444',
        material: 'standard',
        description:
          'Left molecule or atom (H₂O, HCl, Ar, or I₂) displaying intramolecular covalent bonds and partial-charge distribution.',
        whatIsIt: 'Reference interacting molecule 1.',
        whatDoesItDo:
          'Generates the permanent electrostatic field or instantaneous dipole that interacts with Molecule 2 across distance r.',
      },
      {
        id: 'molecule_2',
        name: 'Partner Acceptor / Right Molecule',
        label: 'Partner Acceptor / Right Molecule',
        shape: 'sphere',
        dimensions: [1.0, 1.0, 1.0],
        position: [1.5, 0, 0],
        color: '#38BDF8',
        material: 'standard',
        description:
          'Right interacting molecule or atom whose distance r and orientation angle θ are controlled by the Separation and Orientation sliders.',
        whatIsIt: 'Partner interacting molecule 2.',
        whatDoesItDo:
          'Demonstrates how intermolecular attraction strengthens near r_eq at θ = 0° and turns repulsive at θ = 180° or r < σ.',
      },
      {
        id: 'imf_attraction_overlay',
        name: 'Intermolecular Attraction Overlay',
        label: 'Intermolecular Attraction Overlay',
        shape: 'cylinder',
        dimensions: [0.06, 2.2],
        position: [0, 0, 0],
        color: '#10B981',
        material: 'glow',
        description:
          'Segmented dashed force line (distinct from solid covalent bonds) connecting interacting δ⁺ and δ⁻ centers between the two molecules.',
        whatIsIt: 'Non-covalent intermolecular force indicator.',
        whatDoesItDo:
          'Visually distinguishes non-covalent intermolecular attractions (emerald dashes) from intramolecular covalent bonds, turning rose-red under repulsion.',
      },
      {
        id: 'electron_cloud_hull',
        name: 'Polarizable Electron Cloud Hull',
        label: 'Polarizable Electron Cloud Hull',
        shape: 'sphere',
        dimensions: [1.2, 0.95, 0.95],
        position: [-1.5, 0, 0],
        color: '#38BDF8',
        material: 'glass',
        description:
          'Translucent electron-density envelope surrounding each molecule showing permanent dipole asymmetry or synchronized instantaneous/induced dipole distortion.',
        whatIsIt: 'Polarizable valence electron distribution (polarizability α).',
        whatDoesItDo:
          'Shows how instantaneous charge fluctuations induce dipoles in neighboring molecules to produce universal London dispersion forces.',
      },
      {
        id: 'energy_well_curve',
        name: 'Potential Energy Well Indicator',
        label: 'Potential Energy Well Indicator',
        shape: 'box',
        dimensions: [4.6, 1.35, 0.1],
        position: [0, -2.35, -1.2],
        color: '#0F172A',
        material: 'standard',
        description:
          'Lennard-Jones + angular potential energy board V(r,θ) with a live gold marker tracking current intermolecular separation r.',
        whatIsIt: 'Two-body intermolecular potential energy curve V(r,θ).',
        whatDoesItDo:
          'Quantifies the potential well depth ε, equilibrium distance r_eq, and thermal kinetic comparison.',
      },
      {
        id: 'comparison_dimer_pair',
        name: 'Comparison Molecular System',
        label: 'Comparison Molecular System',
        shape: 'box',
        dimensions: [4.2, 0.9, 0.1],
        position: [0, 2.55, -1.5],
        color: '#8B5CF6',
        material: 'standard',
        description:
          'Comparative boiling-point and polarizability reference display contrasting H₂O vs HCl and I₂ vs Ar.',
        whatIsIt: 'Side-by-side physical property comparison panel.',
        whatDoesItDo:
          'Proves that molar mass/polarizability (I₂ vs HCl) as well as H-bonding (H₂O vs HCl) govern macroscopic boiling points.',
      },
    ],
    equations: [
      'V(r, \\theta) = 4\\varepsilon \\left[\\left(\\frac{\\sigma}{r}\\right)^{12} - \\left(\\frac{\\sigma}{r}\\right)^6\\right] - \\frac{\\mu_1 \\mu_2}{4\\pi\\varepsilon_0 r^3}\\,f(\\theta)',
      'E_{\\text{dispersion}} \\propto -\\frac{3 I}{4}\\,\\frac{\\alpha_1 \\alpha_2}{r^6} \\quad (\\text{occurs between ALL atoms and molecules})',
    ],
    curiosityPrompts: [
      'Why do London dispersion forces occur between ALL molecules, including polar H₂O and HCl?',
      'Why does nonpolar iodine (I₂, BP +184°C) have a higher boiling point than polar hydrogen chloride (HCl, BP −85°C)?',
      'Why must hydrogen bonding be drawn as a dashed intermolecular attraction rather than a solid covalent bond?',
    ],
  },

  // =========================================================================
  // 74. ELECTROCHEMICAL CELL SIMULATOR
  // =========================================================================
  electrochemicalCellSimulator: {
    id: 'electrochemical-cell-simulator',
    title: 'Electrochemical Cell Simulator',
    concept: 'Galvanic (Voltaic) Cells, Half-Cell Redox Potentials, Salt Bridge Charge Balance & Nernst Equation',
    description:
      'Interactive 3D galvanic-cell laboratory featuring Zinc–Copper (Daniell), Copper–Silver, and Iron–Copper cells with separate half-cell beakers, KNO₃ salt bridge, external wire circuit, digital voltmeter, live Nernst equation calculator, and separate external electron conduction vs internal ion migration.',
    whatIsIt:
      'A functional 3D electrochemistry laboratory demonstrating how a spontaneous redox reaction generates electrical voltage across separated half-cells.',
    howDoesItWork:
      'In a standard Zinc–Copper galvanic cell (Zn(s) | Zn²⁺(aq) || Cu²⁺(aq) | Cu(s)), oxidation occurs spontaneously at the negative Zinc Anode: Zn(s) → Zn²⁺(aq) + 2e⁻ (E°_anode = −0.76 V), while reduction occurs at the positive Copper Cathode: Cu²⁺(aq) + 2e⁻ → Cu(s) (E°_cathode = +0.34 V), yielding overall reaction Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s). Electrons flow EXCLUSIVELY through the External Conducting Wire Circuit from the zinc anode (−) through the voltmeter to the copper cathode (+); electrons NEVER travel through the salt bridge or electrolyte! Instead, the KNO₃ Salt Bridge maintains electrical neutrality by migrating NO₃⁻ anions into the anode half-cell and K⁺ cations into the cathode half-cell. At standard conditions (1.00 M, 298 K), E°_cell = E°_cathode − E°_anode = (+0.34 V) − (−0.76 V) = +1.10 V. When concentrations vary from 1.00 M, live cell voltage follows the Nernst equation: E_cell = E°_cell − (RT/nF) ln(Q).',
    realLifeExample:
      'Forms the fundamental basis of all chemical batteries, including alkaline cells, automotive lead-acid batteries, and lithium-ion energy storage.',
    examConnection:
      'Standard potential: E°_cell = E°_cathode − E°_anode (+1.10 V for Zn–Cu). Nernst equation: E_cell = E°_cell − (RT / nF) ln(Q) where Q = [Anode Ion] / [Cathode Ion]. Free energy: ΔG = −nFE_cell. Anode = Oxidation (− in galvanic); Cathode = Reduction (+ in galvanic).',
    scaleNote:
      'Charge Transport Distinction: Cyan spheres in the upper wire represent conduction electrons (e⁻); emerald/rose spheres in the liquid and salt bridge represent dissolved cations and anions.',
    simulationModel: 'predictive',
    functionalType: 'electrochemical-cell-simulator',
    prompt:
      'Create a 3D Electrochemical Cell Simulator for a Zinc-Copper galvanic cell with two half-cell beakers, zinc anode, copper cathode, KNO3 salt bridge, external wire with electron flow, voltmeter, and Nernst concentration controls',
    camera: {
      position: [0, 3.4, 11.2],
      target: [0, 0.5, 0],
    },
    parameters: {
      anodeConcentrationM: {
        id: 'anodeConcentrationM',
        name: 'Anode Electrolyte Concentration',
        min: 0.01,
        max: 2.0,
        step: 0.05,
        defaultValue: 1.0,
        unit: 'M',
        description:
          'Adjusts molar concentration [Anode Ion] (0.01–2.00 M) in the oxidation half-cell, updating reaction quotient Q and Nernst potential E_cell.',
        affects: 'custom',
      },
      cathodeConcentrationM: {
        id: 'cathodeConcentrationM',
        name: 'Cathode Electrolyte Concentration',
        min: 0.01,
        max: 2.0,
        step: 0.05,
        defaultValue: 1.0,
        unit: 'M',
        description:
          'Adjusts molar concentration [Cathode Ion] (0.01–2.00 M) in the reduction half-cell, updating solution color intensity and Nernst potential E_cell.',
        affects: 'custom',
      },
      temperatureKelvin: {
        id: 'temperatureKelvin',
        name: 'Cell Temperature (T)',
        min: 273,
        max: 353,
        step: 5,
        defaultValue: 298,
        unit: 'K',
        description:
          'Adjusts operating temperature T (273–353 K) in the Nernst thermal factor RT/(nF).',
        affects: 'custom',
      },
    },
    conditions: {
      cellPair: {
        id: 'cellPair',
        name: 'Cell Selector (Galvanic Couple)',
        type: 'select',
        defaultValue: 'zn_cu',
        options: [
          { value: 'zn_cu', label: 'Zinc–Copper (Daniell Cell): Zn | Zn²⁺ || Cu²⁺ | Cu (E°_cell = +1.10 V)' },
          { value: 'cu_ag', label: 'Copper–Silver Cell: Cu | Cu²⁺ || Ag⁺ | Ag (E°_cell = +0.46 V)' },
          { value: 'fe_cu', label: 'Iron–Copper Cell: Fe | Fe²⁺ || Cu²⁺ | Cu (E°_cell = +0.78 V)' },
        ],
        description: 'Switches the galvanic cell example and updates electrodes, electrolyte colors, half-reactions, and E°_cell.',
      },
      showElectronFlow: {
        id: 'showElectronFlow',
        name: 'Electron Flow Animation (External Wire)',
        type: 'boolean',
        defaultValue: true,
        description: 'Toggles animated electron flow (e⁻) from Anode (−) to Cathode (+) along the external wire.',
      },
      showIonMovement: {
        id: 'showIonMovement',
        name: 'Ion Visibility (Electrolyte & Salt Bridge)',
        type: 'boolean',
        defaultValue: true,
        description: 'Toggles visible cation and anion migration inside the half-cells and KNO₃ salt bridge.',
      },
    },
    parts: [
      {
        id: 'anode_electrode',
        name: 'Anode Electrode (− Oxidation)',
        label: 'Anode Electrode (− Oxidation)',
        shape: 'box',
        dimensions: [0.45, 2.6, 0.16],
        position: [-2.95, 0.25, 0],
        color: '#94A3B8',
        material: 'metal',
        description:
          'Negative electrode where spontaneous oxidation occurs (e.g., Zn(s) → Zn²⁺(aq) + 2e⁻, E° = −0.76 V).',
        whatIsIt: 'Oxidation half-cell electrode (− terminal).',
        whatDoesItDo:
          'Releases metal cations into the anode solution and supplies electrons into the external wire circuit.',
      },
      {
        id: 'cathode_electrode',
        name: 'Cathode Electrode (+ Reduction)',
        label: 'Cathode Electrode (+ Reduction)',
        shape: 'box',
        dimensions: [0.45, 2.6, 0.16],
        position: [2.95, 0.25, 0],
        color: '#D97706',
        material: 'metal',
        description:
          'Positive electrode where spontaneous reduction occurs (e.g., Cu²⁺(aq) + 2e⁻ → Cu(s), E° = +0.34 V).',
        whatIsIt: 'Reduction half-cell electrode (+ terminal).',
        whatDoesItDo:
          'Accepts electrons arriving from the external wire to reduce aqueous cations into solid metal plated on its surface.',
      },
      {
        id: 'anode_electrolyte',
        name: 'Anode Electrolyte Solution',
        label: 'Anode Electrolyte Solution',
        shape: 'cylinder',
        dimensions: [1.5, 2.6],
        position: [-2.6, -0.5, 0],
        color: '#E0F2FE',
        material: 'glass',
        description:
          'Left half-cell glass beaker and aqueous electrolyte solution (colourless ZnSO₄, blue CuSO₄, or pale green FeSO₄).',
        whatIsIt: 'Anodic aqueous ionic medium.',
        whatDoesItDo:
          'Accepts oxidized cations from the anode and receives balancing NO₃⁻ anions from the salt bridge.',
      },
      {
        id: 'cathode_electrolyte',
        name: 'Cathode Electrolyte Solution',
        label: 'Cathode Electrolyte Solution',
        shape: 'cylinder',
        dimensions: [1.5, 2.6],
        position: [2.6, -0.5, 0],
        color: '#0284C7',
        material: 'glass',
        description:
          'Right half-cell glass beaker and aqueous electrolyte solution (characteristic azure blue CuSO₄(aq) or colourless AgNO₃(aq)).',
        whatIsIt: 'Cathodic aqueous ionic medium.',
        whatDoesItDo:
          'Provides dissolved metal cations (Cu²⁺ or Ag⁺) for reduction at the cathode surface.',
      },
      {
        id: 'salt_bridge',
        name: 'Salt Bridge (KNO₃ Ionic Conduit)',
        label: 'Salt Bridge (KNO₃ Ionic Conduit)',
        shape: 'torus',
        dimensions: [1.85, 0.22],
        position: [0, 0.2, 0],
        color: '#F8FAFC',
        material: 'glass',
        description:
          'U-shaped glass tube containing inert K⁺ and NO₃⁻ electrolyte bridging the anode and cathode solutions.',
        whatIsIt: 'Internal ionic charge-balance bridge.',
        whatDoesItDo:
          'Migrates anions (NO₃⁻) to the anode beaker and cations (K⁺) to the cathode beaker to prevent charge buildup; electrons NEVER pass through the salt bridge.',
      },
      {
        id: 'external_wire_circuit',
        name: 'External Conducting Wire Circuit',
        label: 'External Conducting Wire Circuit',
        shape: 'cylinder',
        dimensions: [0.05, 5.9],
        position: [0, 2.5, 0],
        color: '#475569',
        material: 'metal',
        description:
          'External metallic wire connecting the Anode (−) through the Digital Voltmeter to the Cathode (+).',
        whatIsIt: 'Electronic conduction pathway.',
        whatDoesItDo:
          'Guides electrons (e⁻) exclusively from the site of oxidation (Anode) to the site of reduction (Cathode).',
      },
      {
        id: 'digital_voltmeter',
        name: 'High-Impedance Digital Voltmeter',
        label: 'High-Impedance Digital Voltmeter',
        shape: 'box',
        dimensions: [2.1, 1.05, 0.35],
        position: [0, 3.05, 0],
        color: '#0F172A',
        material: 'standard',
        description:
          'Digital potential meter displaying live Nernst voltage E_cell, standard cell potential E°_cell, and active half-reactions.',
        whatIsIt: 'Potentiometric cell voltage display.',
        whatDoesItDo:
          'Calculates E°_cell = E°_cathode − E°_anode and live Nernst potential E_cell = E°_cell − (RT/nF)ln(Q).',
      },
      {
        id: 'electrolyte_ions',
        name: 'Mobile Electrolyte Ions',
        label: 'Mobile Electrolyte Ions',
        shape: 'sphere',
        dimensions: [0.14, 0.14, 0.14],
        position: [0, 0.8, 0],
        color: '#10B981',
        material: 'glow',
        description:
          'Mobile cations and anions migrating within the aqueous half-cells and KNO₃ Salt Bridge.',
        whatIsIt: 'Dissolved ionic charge carriers.',
        whatDoesItDo:
          'Completes the internal electrical circuit by ionic diffusion and migration.',
      },
    ],
    equations: [
      'E^\\circ_{\\text{cell}} = E^\\circ_{\\text{cathode}} - E^\\circ_{\\text{anode}} \\quad (\\text{Zn–Cu: } +0.34\\text{ V} - (-0.76\\text{ V}) = +1.10\\text{ V})',
      'E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{RT}{nF}\\ln Q, \\quad \\Delta G = -n F E_{\\text{cell}}',
      '\\mathrm{Zn(s) + Cu^{2+}(aq) \\rightarrow Zn^{2+}(aq) + Cu(s)}',
    ],
    curiosityPrompts: [
      'Why do electrons flow through the external wire from Zinc to Copper, but never travel through the salt bridge?',
      'What would happen to the voltage of the galvanic cell if the KNO₃ salt bridge were removed?',
      'How does increasing [Cu²⁺] or decreasing [Zn²⁺] raise the cell potential above +1.10 V according to the Nernst equation?',
    ],
  },

  // =========================================================================
  // 75. ELECTROLYSIS EXPLORER
  // =========================================================================
  electrolysisExplorer: {
    id: 'electrolysis-explorer',
    title: 'Electrolysis Explorer',
    concept: 'Electrolytic Cells, External DC Driving Source, Molten NaCl vs Water Electrolysis & Faraday’s Laws (Q = It, m = MIt/zF)',
    description:
      'Interactive 3D electrolytic-cell and Faraday’s Laws laboratory featuring an external DC power source, Negative Cathode (−), Positive Anode (+), selectable experiments (Molten NaCl(l), Acidified Water H₂O(l), and Aqueous CuSO₄(aq)), distinct ion migration vs external electron flow, and real-time Faraday mass/volume stoichiometry calculator.',
    whatIsIt:
      'A 3D electrolytic reaction and quantitative Faraday stoichiometry laboratory showing how external DC electrical energy drives nonspontaneous redox reactions.',
    howDoesItWork:
      'Unlike a galvanic cell, an electrolytic cell uses an External DC Power Source to drive a nonspontaneous chemical reaction (ΔG > 0). The DC source pumps electrons into the NEGATIVE Cathode (−, where cations are reduced) and pulls electrons out of the POSITIVE Anode (+, where anions or water are oxidized). In Experiment A (Molten Sodium Chloride, NaCl(l) at ~801°C with NO water present), Na⁺(l) cations migrate to the negative cathode (Na⁺ + e⁻ → Na(l)) and Cl⁻(l) anions migrate to the positive anode (2Cl⁻ → Cl₂(g) + 2e⁻), giving overall 2NaCl(l) → 2Na(l) + Cl₂(g). In Experiment B (Acidified Water Electrolysis with dilute H₂SO₄ and inert Pt electrodes), 2H⁺(aq) + 2e⁻ → H₂(g) (z = 2) at the cathode and 2H₂O(l) → O₂(g) + 4H⁺(aq) + 4e⁻ (z = 4) at the anode produce a 2:1 molar volume ratio of H₂(g) to O₂(g). By Faraday’s Laws, total charge is Q = I·t and theoretical product mass is m = (M·I·t)/(z·F) where F ≈ 96,485 C·mol⁻¹.',
    realLifeExample:
      'Industrial Downs cell production of sodium metal and chlorine gas from molten NaCl; green hydrogen production via water electrolysis; industrial electroplating and copper electrorefining.',
    examConnection:
      'Electrolytic polarity: Cathode is Negative (−, Reduction); Anode is Positive (+, Oxidation). Faraday’s Laws: Q = I · t (C); m = (M · I · t) / (z · F) where F = 96,485 C·mol⁻¹. Molten NaCl(l) produces Na(l) + Cl₂(g), whereas aqueous NaCl(aq) reduces H₂O to H₂(g).',
    scaleNote:
      'Yield Limitation Note: The Faraday calculator computes 100% theoretical stoichiometric yield m = MIt/(zF); actual laboratory yields may be lower due to current efficiency, side reactions, and gas solubility.',
    simulationModel: 'predictive',
    functionalType: 'electrolysis-explorer',
    prompt:
      'Create a 3D Electrolysis Explorer with an electrolyte container, negative cathode, positive anode, DC power source, mobile cations and anions, gas bubble and metal plating product regions, and a Faraday Law Q=It and m=MIt/zF calculator',
    camera: {
      position: [0, 3.3, 10.8],
      target: [0, 0.4, 0],
    },
    parameters: {
      currentAmps: {
        id: 'currentAmps',
        name: 'Current Input (I)',
        min: 0.5,
        max: 30.0,
        step: 0.5,
        defaultValue: 10.0,
        unit: 'A',
        description:
          'Adjusts DC electric current I (0.5–30.0 A), scaling charge rate, ion drift velocity, and Faraday product yield.',
        affects: 'custom',
      },
      durationSeconds: {
        id: 'durationSeconds',
        name: 'Duration Input (t)',
        min: 60,
        max: 3600,
        step: 60,
        defaultValue: 600,
        unit: 's',
        description:
          'Adjusts electrolysis duration t (60–3600 s) to compute total charge Q = I·t and theoretical product mass m = MIt/(zF).',
        affects: 'custom',
      },
    },
    conditions: {
      experimentType: {
        id: 'experimentType',
        name: 'Experiment Selector',
        type: 'select',
        defaultValue: 'molten_nacl',
        options: [
          { value: 'molten_nacl', label: 'Experiment A — Molten NaCl(l) (No Water: 2NaCl(l) → 2Na(l) + Cl₂(g))' },
          { value: 'water_electrolysis', label: 'Experiment B — Acidified Water H₂O(l) (Pt Electrodes: 2H₂O(l) → 2H₂(g) + O₂(g))' },
          { value: 'aqueous_cuso4', label: 'Experiment C — Aqueous CuSO₄(aq) (Inert Electrodes: Plates Cu(s) + Evolves O₂(g))' },
        ],
        description: 'Switches the active electrolysis setup and updates electrolyte appearance, electrode equations, ions, products, and Faraday stoichiometry.',
      },
      showIonMigration: {
        id: 'showIonMigration',
        name: 'Ion Motion Animation (Cations ➔ −, Anions ➔ +)',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides directional drift of cations toward the negative cathode and anions toward the positive anode.',
      },
      showProductFormation: {
        id: 'showProductFormation',
        name: 'Product Display (Plating & Gas Evolution)',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides liquid Na / solid Cu cathode deposition and Cl₂ / H₂ / O₂ gas bubble evolution.',
      },
    },
    parts: [
      {
        id: 'dc_power_supply',
        name: 'External DC Power Source',
        label: 'External DC Power Source',
        shape: 'box',
        dimensions: [2.3, 1.1, 0.65],
        position: [0, 3.05, 0],
        color: '#0F172A',
        material: 'standard',
        description:
          'Direct-current power supply with Negative (−) terminal wired to the Cathode and Positive (+) terminal wired to the Anode, plus live Faraday readout.',
        whatIsIt: 'External electrical energy source driving nonspontaneous electrolysis.',
        whatDoesItDo:
          'Pumps electrons from the Positive Anode (+) to the Negative Cathode (−) and computes Q = It and m = MIt/(zF).',
      },
      {
        id: 'cathode_electrode_neg',
        name: 'Negative Cathode (− Reduction)',
        label: 'Negative Cathode (− Reduction)',
        shape: 'cylinder',
        dimensions: [0.24, 2.55],
        position: [-1.45, 0.15, 0],
        color: '#38BDF8',
        material: 'metal',
        description:
          'Electrode connected to the Negative (−) terminal of the DC Power Source where cations undergo reduction.',
        whatIsIt: 'Electrolytic reduction electrode (− polarity).',
        whatDoesItDo:
          'Reduces Na⁺(l) to Na(l) in Exp A, 2H⁺(aq) to H₂(g) in Exp B, or Cu²⁺(aq) to Cu(s) in Exp C.',
      },
      {
        id: 'anode_electrode_pos',
        name: 'Positive Anode (+ Oxidation)',
        label: 'Positive Anode (+ Oxidation)',
        shape: 'cylinder',
        dimensions: [0.24, 2.55],
        position: [1.45, 0.15, 0],
        color: '#F43F5E',
        material: 'metal',
        description:
          'Inert electrode connected to the Positive (+) terminal of the DC Power Source where anions or water undergo oxidation.',
        whatIsIt: 'Electrolytic oxidation electrode (+ polarity).',
        whatDoesItDo:
          'Oxidizes 2Cl⁻(l) to Cl₂(g) in Exp A, or oxidizes 2H₂O(l) to O₂(g) + 4H⁺ + 4e⁻ in Exp B and Exp C.',
      },
      {
        id: 'electrolyte_bath',
        name: 'Electrolyte Container & Melt/Solution',
        label: 'Electrolyte Container & Melt/Solution',
        shape: 'cylinder',
        dimensions: [2.55, 2.7],
        position: [0, -0.55, 0],
        color: '#F59E0B',
        material: 'glass',
        description:
          'Reaction vessel holding molten NaCl(l) (amber), acidified water H₂O(l) (clear), or aqueous CuSO₄(aq) (azure blue).',
        whatIsIt: 'Electrolytic reaction vessel and ionic medium.',
        whatDoesItDo:
          'Contains mobile cations and anions that conduct current inside the cell while keeping electrons confined to the external circuit.',
      },
      {
        id: 'external_dc_wires',
        name: 'External DC Circuit Wires',
        label: 'External DC Circuit Wires',
        shape: 'cylinder',
        dimensions: [0.04, 2.9],
        position: [0, 2.4, 0],
        color: '#64748B',
        material: 'metal',
        description:
          'Conducting leads carrying electrons from the Positive Anode (+) into the DC source and down into the Negative Cathode (−).',
        whatIsIt: 'External electronic conduction leads.',
        whatDoesItDo:
          'Transports electrons exclusively outside the electrolyte bath at a rate proportional to Current Input (I).',
      },
      {
        id: 'mobile_ions_cloud',
        name: 'Mobile Cations & Anions',
        label: 'Mobile Cations & Anions',
        shape: 'sphere',
        dimensions: [0.15, 0.15, 0.15],
        position: [0, -0.6, 0],
        color: '#38BDF8',
        material: 'glow',
        description:
          'Cations (Na⁺, H⁺, Cu²⁺) drifting leftward toward the Negative Cathode (−) and anions (Cl⁻, SO₄²⁻) drifting rightward toward the Positive Anode (+).',
        whatIsIt: 'Migrating electrolyte ions.',
        whatDoesItDo:
          'Demonstrates that internal cell current is carried by oppositely directed cation and anion migration, never by free electrons.',
      },
      {
        id: 'cathode_product_zone',
        name: 'Cathode Product Formation Region',
        label: 'Cathode Product Formation Region',
        shape: 'cylinder',
        dimensions: [0.3, 1.4],
        position: [-1.45, -0.45, 0],
        color: '#E2E8F0',
        material: 'metal',
        description:
          'Product accumulating at the Negative Cathode (−): silvery Na(l) in Exp A, H₂(g) bubbles (2× volume) in Exp B, or reddish-brown Cu(s) plating in Exp C.',
        whatIsIt: 'Cathodic reduction product zone.',
        whatDoesItDo:
          'Scales visually with theoretical Faraday yield m_cathode = (M · I · t) / (z · F).',
      },
      {
        id: 'anode_product_zone',
        name: 'Anode Product Formation Region',
        label: 'Anode Product Formation Region',
        shape: 'sphere',
        dimensions: [0.4, 1.5, 0.4],
        position: [1.45, -0.45, 0],
        color: '#A3E635',
        material: 'glow',
        description:
          'Gas product evolving at the Positive Anode (+): yellow-green Cl₂(g) bubbles (z = 2) in Exp A or colourless O₂(g) bubbles (z = 4) in Exp B and Exp C.',
        whatIsIt: 'Anodic oxidation gas-evolution zone.',
        whatDoesItDo:
          'Demonstrates gas bubble nucleation and the 2:1 H₂:O₂ stoichiometric volume ratio in water electrolysis.',
      },
    ],
    equations: [
      'Q = I \\cdot t, \\quad n_{e^-} = \\frac{Q}{F}, \\quad m_{\\text{theoretical}} = \\frac{M \\cdot I \\cdot t}{z \\cdot F} \\quad (F = 96,485\\text{ C}\\cdot\\text{mol}^{-1})',
      '\\text{Exp A (Molten NaCl): } \\mathrm{2NaCl(l) \\rightarrow 2Na(l) + Cl_2(g)} \\quad (\\text{Cathode: } z=1,\\; \\text{Anode: } z=2)',
      '\\text{Exp B (Acidified }\\mathrm{H_2O}\\text{): } \\mathrm{2H_2O(l) \\rightarrow 2H_2(g) + O_2(g)} \\quad (\\text{Cathode }\\mathrm{H_2}: z=2,\\; \\text{Anode }\\mathrm{O_2}: z=4)',
    ],
    curiosityPrompts: [
      'Why is the cathode negative (−) and the anode positive (+) in an electrolytic cell, opposite to a galvanic cell?',
      'Why does electrolyzing molten NaCl(l) produce metallic sodium Na(l), whereas electrolyzing aqueous NaCl(aq) produces H₂(g) gas?',
      'Why does water electrolysis always produce twice the volume of H₂(g) at the cathode as O₂(g) at the anode?',
    ],
  },
};
