import { ScientificModelSpec, ModelPartSpec, ModelParameterSpec, ModelConditionSpec } from '../types/aiModel';

/**
 * CPK Element Colors & Covalent Radii for Dynamic 3D Molecular Geometry Synthesis
 */
const ELEMENT_DATA: Record<
  string,
  { name: string; color: string; radius: number; role: string }
> = {
  H: { name: 'Hydrogen (H)', color: '#f8fafc', radius: 0.34, role: 'Monovalent terminal atom (1s¹)' },
  C: { name: 'Carbon (C)', color: '#334155', radius: 0.56, role: 'Tetravalent framework atom (2s² 2p²)' },
  N: { name: 'Nitrogen (N)', color: '#2563eb', radius: 0.54, role: 'Trivalent pnictogen atom with lone pair (2s² 2p³)' },
  O: { name: 'Oxygen (O)', color: '#dc2626', radius: 0.52, role: 'Divalent chalcogen atom with two lone pairs (2s² 2p⁴)' },
  F: { name: 'Fluorine (F)', color: '#10b981', radius: 0.48, role: 'Highly electronegative halogen atom (χ = 3.98)' },
  Cl: { name: 'Chlorine (Cl)', color: '#22c55e', radius: 0.62, role: 'Halogen terminal atom (3s² 3p⁵)' },
  Br: { name: 'Bromine (Br)', color: '#991b1b', radius: 0.68, role: 'Heavy halogen atom (4s² 4p⁵)' },
  I: { name: 'Iodine (I)', color: '#7e22ce', radius: 0.74, role: 'Polarizable halogen atom (5s² 5p⁵)' },
  S: { name: 'Sulfur (S)', color: '#eab308', radius: 0.64, role: 'Chalcogen central atom capable of expanded valence shells' },
  P: { name: 'Phosphorus (P)', color: '#f97316', radius: 0.65, role: 'Pnictogen central atom capable of sp³d hybridization' },
  B: { name: 'Boron (B)', color: '#ec4899', radius: 0.54, role: 'Electron-deficient group 13 metalloid (sp² trigonal planar)' },
  Si: { name: 'Silicon (Si)', color: '#64748b', radius: 0.66, role: 'Tetravalent semiconductor metalloid (3s² 3p²)' },
  Xe: { name: 'Xenon (Xe)', color: '#06b6d4', radius: 0.72, role: 'Hypervalent noble gas central atom' },
  Na: { name: 'Sodium Ion (Na⁺)', color: '#8b5cf6', radius: 0.58, role: 'Alkali metal cation (+1 charge)' },
  Mg: { name: 'Magnesium (Mg)', color: '#14b8a6', radius: 0.6, role: 'Alkaline earth metal center (+2 charge)' },
  Fe: { name: 'Iron (Fe)', color: '#b45309', radius: 0.64, role: 'Transition metal coordination center' },
};

/**
 * Helper to create a 3D cylinder bond connecting two 3D points p1 and p2
 */
function createBondPart(
  id: string,
  name: string,
  p1: [number, number, number],
  p2: [number, number, number],
  radius = 0.11,
  color = '#94a3b8'
): ModelPartSpec {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  const length = Math.max(0.2, Math.hypot(dx, dy, dz));
  const mid: [number, number, number] = [
    +(p1[0] + dx * 0.5).toFixed(3),
    +(p1[1] + dy * 0.5).toFixed(3),
    +(p1[2] + dz * 0.5).toFixed(3),
  ];

  // Default cylinder is aligned along Y axis (0, 1, 0)
  // Compute Euler rotation from (0,1,0) to normalized (dx,dy,dz)
  const ux = dx / length;
  const uy = dy / length;
  const uz = dz / length;
  const rx = Math.atan2(uz, uy);
  const rz = -Math.asin(Math.max(-1, Math.min(1, ux)));

  return {
    id,
    name,
    label: name,
    shape: 'cylinder',
    dimensions: [radius, +length.toFixed(2)],
    position: mid,
    rotation: [+rx.toFixed(3), 0, +rz.toFixed(3)],
    color,
    material: 'plastic',
    description: `Covalent electron-pair bond connecting atoms (${length.toFixed(2)} Å scaled).`,
    whatIsIt: 'Shared electron-pair covalent bond.',
    whatDoesItDo: 'Holds bonded nuclei together at an equilibrium internuclear distance.',
    realLifeExample: 'Molecular vibrations in infrared (IR) spectroscopy.',
  };
}

/**
 * Synthesizes a complete, interactive 3D ScientificModelSpec from any natural-language prompt.
 * Covers specialized physics, chemistry, biology, anatomy, earth/space, and engineering models
 * as well as arbitrary open-ended STEM prompts.
 */
function inferSynthesizedSubjectDomain(
  prompt: string,
  spec: ScientificModelSpec
): 'Physics' | 'Chemistry' | 'Biology' | 'Anatomy' {
  const combined = `${prompt} ${spec.title} ${spec.concept}`.toLowerCase();
  if (
    combined.includes('molecule') ||
    combined.includes('vsepr') ||
    combined.includes('covalent') ||
    combined.includes('ionic') ||
    combined.includes('acid') ||
    combined.includes('methane') ||
    combined.includes('benzene') ||
    combined.includes('chemical') ||
    combined.includes('chemistry') ||
    combined.includes('crystal') ||
    combined.includes('electrochem')
  ) {
    return 'Chemistry';
  }
  if (
    combined.includes('synapse') ||
    combined.includes('neuron') ||
    combined.includes('nephron') ||
    combined.includes('heart') ||
    combined.includes('lung') ||
    combined.includes('ear') ||
    combined.includes('anatomy') ||
    combined.includes('sarcomere') ||
    combined.includes('muscle')
  ) {
    return 'Anatomy';
  }
  if (
    combined.includes('chloroplast') ||
    combined.includes('thylakoid') ||
    combined.includes('bacteriophage') ||
    combined.includes('virus') ||
    combined.includes('capsid') ||
    combined.includes('dna') ||
    combined.includes('mitosis') ||
    combined.includes('cell') ||
    combined.includes('membrane') ||
    combined.includes('bilayer') ||
    combined.includes('enzyme') ||
    combined.includes('biology')
  ) {
    return 'Biology';
  }
  return 'Physics';
}

export function synthesizeProceduralScientificModel(prompt: string): ScientificModelSpec {
  const spec = synthesizeProceduralScientificModelInternal(prompt);
  return {
    ...spec,
    generationSource: 'procedural-synthesizer',
    subjectDomain: spec.subjectDomain || inferSynthesizedSubjectDomain(prompt, spec),
  };
}

function synthesizeProceduralScientificModelInternal(prompt: string): ScientificModelSpec {
  const q = prompt.toLowerCase().trim();

  // 1. BACTERIOPHAGE / VIRUS 3D MODEL
  if (q.includes('bacteriophage') || q.includes('phage') || q.includes('virus') || q.includes('capsid')) {
    return {
      id: 'custom-bacteriophage-virus',
      title: 'Bacteriophage T4 Virus Architecture',
      concept: 'Virology, Icosahedral Capsid Geometry & Contractile Tail Injection',
      description:
        'Interactive 3D structural model of a T4 bacteriophage virus showing the icosahedral protein capsid head encapsulating double-stranded DNA, collar, contractile helical tail sheath, hexagonal baseplate, and host-recognition tail fibers.',
      whatIsIt: 'A specialized virus that infects bacteria by landing on their surface and injecting genetic material like a microscopic hypodermic syringe.',
      howDoesItWork:
        'Long tail fibers bind to specific lipopolysaccharide receptors on the host bacterium. The hexagonal baseplate changes conformation, causing the contractile tail sheath to compress and drive the hollow central tail tube through the bacterial cell wall to inject viral DNA.',
      realLifeExample: 'Phage therapy used in medicine to target antibiotic-resistant bacterial infections.',
      examConnection: 'Hershey-Chase Experiment (1952): Bacteriophage T2 labeled with ³²P (DNA) and ³⁵S (protein coat) proved that DNA, not protein, is the hereditary genetic material.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 2.5, 8.5], target: [0, 0.2, 0] },
      parts: [
        {
          id: 'icosahedral-capsid-head',
          name: 'Icosahedral Protein Capsid Head',
          label: 'Icosahedral Capsid Head',
          shape: 'octahedron',
          dimensions: [1.35],
          position: [0, 2.35, 0],
          color: '#38bdf8',
          material: 'glass',
          opacity: 0.72,
          description: 'Geometrically symmetric protein shell composed of capsomere subunits protecting the viral genome.',
          whatIsIt: 'Outer polyhedral protein shell (head) of the bacteriophage.',
          whatDoesItDo: 'Protects the tightly packaged viral DNA genome from nucleases and environmental damage.',
          realLifeExample: 'Geodesic domes designed by Buckminster Fuller follow the same icosahedral triangulation geometry.',
          animation: { type: 'spin', axis: 'y', speed: 0.8, amplitude: 0.1 },
        },
        {
          id: 'viral-dna-genome-core',
          name: 'Double-Stranded Viral DNA Core',
          label: 'Viral dsDNA Genome',
          shape: 'torus',
          dimensions: [0.55, 0.22],
          position: [0, 2.35, 0],
          rotation: [1.1, 0.4, 0],
          color: '#f43f5e',
          material: 'glow',
          description: 'Tightly spooled linear double-stranded DNA molecule stored at high osmotic pressure inside the capsid.',
          whatIsIt: 'The genetic blueprint of the virus (~169 kilobase pairs in T4).',
          whatDoesItDo: 'Injected into the host bacterium to hijack host ribosomes and synthesize new phage particles.',
          realLifeExample: 'Coiled spring under tension ready to unwind into the host cell.',
          animation: { type: 'pulse', axis: 'y', speed: 2.2, amplitude: 0.12 },
        },
        {
          id: 'neck-collar-disk',
          name: 'Connector Collar & Whisker Ring',
          label: 'Collar / Neck Connector',
          shape: 'cylinder',
          dimensions: [0.45, 0.22],
          position: [0, 1.15, 0],
          color: '#94a3b8',
          material: 'metal',
          description: 'Structural adapter ring linking the capsid head portal vertex to the contractile tail assembly.',
          whatIsIt: 'Protein neck ring and fibritin whiskers.',
          whatDoesItDo: 'Gates DNA exit from the head into the hollow tail core during infection.',
        },
        {
          id: 'contractile-tail-sheath',
          name: 'Contractile Helical Tail Sheath',
          label: 'Contractile Tail Sheath',
          shape: 'cylinder',
          dimensions: [0.38, 2.1],
          position: [0, 0.0, 0],
          color: '#0284c7',
          material: 'standard',
          description: 'Outer contractile protein sheath surrounding the rigid inner injection tube.',
          whatIsIt: 'Muscular-like helical protein cylinder.',
          whatDoesItDo: 'Contracts to less than half its length upon receptor binding, driving the inner needle through the bacterial envelope.',
          animation: { type: 'oscillate', axis: 'y', speed: 1.8, amplitude: 0.25 },
        },
        {
          id: 'inner-hollow-tail-tube',
          name: 'Inner Hollow Injection Core Tube',
          label: 'Hollow Injection Needle',
          shape: 'cylinder',
          dimensions: [0.16, 2.5],
          position: [0, -0.1, 0],
          color: '#e2e8f0',
          material: 'metal',
          description: 'Rigid internal conduit through which viral DNA travels into the host cytoplasm.',
          whatIsIt: 'Nanoscale molecular syringe needle.',
          whatDoesItDo: 'Punctures the bacterial peptidoglycan wall and cytoplasmic membrane.',
        },
        {
          id: 'hexagonal-baseplate',
          name: 'Hexagonal Sensor Baseplate',
          label: 'Hexagonal Baseplate',
          shape: 'cylinder',
          dimensions: [0.68, 0.24],
          position: [0, -1.15, 0],
          color: '#f59e0b',
          material: 'metal',
          description: 'Multiprotein hub at the bottom of the tail that coordinates fiber attachment with sheath contraction.',
          whatIsIt: 'Mechanical trigger plate at the base of the tail.',
          whatDoesItDo: 'Converts mechanical tension from the tail fibers into a conformational signal that releases the sheath.',
        },
        {
          id: 'tail-fiber-front-left',
          name: 'Long Host-Recognition Tail Fibers',
          label: 'Long Tail Fibers (gp37)',
          shape: 'cylinder',
          dimensions: [0.06, 1.85],
          position: [-0.95, -1.65, 0.65],
          rotation: [0.35, 0, -0.75],
          color: '#10b981',
          material: 'plastic',
          description: 'Six articulated protein legs that walk across the bacterial surface and bind specific outer-membrane receptors.',
          whatIsIt: 'Receptor-binding sensor fibers.',
          whatDoesItDo: 'Recognizes and anchors the phage onto susceptible E. coli host cells.',
        },
        {
          id: 'tail-fiber-front-right',
          name: 'Right Receptor Tail Fiber',
          label: 'Receptor Tail Fiber',
          shape: 'cylinder',
          dimensions: [0.06, 1.85],
          position: [0.95, -1.65, 0.65],
          rotation: [0.35, 0, 0.75],
          color: '#10b981',
          material: 'plastic',
          description: 'Articulated protein tail fiber for host surface recognition.',
          whatIsIt: 'Receptor-binding sensor fiber.',
          whatDoesItDo: 'Stabilizes phage landing posture prior to genome injection.',
        },
        {
          id: 'tail-fiber-back',
          name: 'Posterior Stabilizer Tail Fibers',
          label: 'Posterior Tail Fibers',
          shape: 'cylinder',
          dimensions: [0.06, 1.85],
          position: [0, -1.65, -1.05],
          rotation: [-0.75, 0, 0],
          color: '#10b981',
          material: 'plastic',
          description: 'Posterior receptor-binding tail fiber completing the tripod landing array.',
          whatIsIt: 'Distal host-attachment fiber.',
          whatDoesItDo: 'Binds bacterial surface lipopolysaccharides (LPS).',
        },
        {
          id: 'bacterial-host-membrane',
          name: 'Host Bacterial Outer Membrane Surface',
          label: 'Host Bacterial Wall',
          shape: 'box',
          dimensions: [5.2, 0.35, 4.2],
          position: [0, -2.5, 0],
          color: '#065f46',
          material: 'tissue',
          description: 'Gram-negative bacterial outer membrane and peptidoglycan layer targeted by the bacteriophage.',
          whatIsIt: 'Target host cell surface envelope.',
          whatDoesItDo: 'Contains surface receptor proteins recognized by the phage tail fibers.',
        },
      ],
      parameters: {
        injectionCycleSpeed: {
          id: 'injectionCycleSpeed',
          name: 'Infection & Contraction Rate',
          min: 0.2,
          max: 4.0,
          step: 0.2,
          defaultValue: 1.5,
          unit: 'Hz',
          description: 'Controls the dynamic rate of capsid rotation and tail sheath contraction cycle.',
          affects: 'animationSpeed',
          scaleFactor: 1.0,
        },
        sheathCompression: {
          id: 'sheathCompression',
          name: 'Tail Sheath Compression',
          min: 0.5,
          max: 1.4,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Adjusts the vertical extension/compression ratio of the contractile tail sheath.',
          affects: 'objectScale',
          targetPartId: 'contractile-tail-sheath',
          scaleFactor: 1.0,
        },
        capsidPressureScale: {
          id: 'capsidPressureScale',
          name: 'Capsid Genome Packing Volume',
          min: 0.8,
          max: 1.35,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Scales the icosahedral capsid head and internal DNA spool volume.',
          affects: 'objectScale',
          targetPartId: 'icosahedral-capsid-head',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Transparent Capsid Cutaway',
          type: 'boolean',
          defaultValue: true,
          description: 'Reveals the internal double-stranded DNA core inside the protein capsid.',
        },
      },
      equations: [
        'T = h² + h·k + k² (Caspar-Klug Icosahedral Triangulation Number)',
        'P_internal ≈ 40–60 atm (Capsid DNA Packaging Pressure)',
      ],
      curiosityPrompts: [
        'Why do bacteriophages only infect bacteria and never human cells?',
        'How did the Hershey-Chase blender experiment use bacteriophages to prove DNA is the genetic material?',
        'How does the phage inject DNA without using ATP from its own metabolism?',
      ],
    };
  }

  // 2. VOLCANO & MAGMA CHAMBER CROSS-SECTION
  if (q.includes('volcano') || q.includes('magma') || q.includes('lava') || q.includes('eruption') || q.includes('caldera')) {
    return {
      id: 'custom-stratovolcano-explorer',
      title: 'Stratovolcano & Magma Chamber Cross-Section',
      concept: 'Igneous Volcanology, Magma Viscosity, Tectonic Decompression & Eruption Mechanics',
      description:
        'Interactive 3D geological cross-section of a composite stratovolcano showing the deep crustal magma chamber, central magmatic conduit, alternating tephra and lava strata, parasitic lateral cone, intrusive dike/sill, summit crater, and buoyant ash plume.',
      whatIsIt: 'A conical composite volcano built up by many alternating layers (strata) of hardened lava, volcanic ash, and pumice.',
      howDoesItWork:
        'Hot, buoyant magma rises from the asthenosphere into a crustal magma chamber. As pressure drops during ascent up the central conduit, dissolved gases (H₂O, CO₂, SO₂) exsolve and expand rapidly, driving effusive lava flows or explosive pyroclastic eruptions depending on silica (SiO₂) viscosity.',
      realLifeExample: 'Mount Fuji (Japan), Mount St. Helens (USA), and Mount Vesuvius (Italy).',
      examConnection: 'High-silicafelsic/rhyolitic magma has high viscosity and traps dissolved gases, causing explosive eruptions; low-silica mafic/basaltic magma has low viscosity, producing gentle effusive shield eruptions.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 3.5, 9.5], target: [0, 0.2, 0] },
      parts: [
        {
          id: 'crustal-lithosphere-base',
          name: 'Continental Crustal Bedrock Slab',
          label: 'Continental Crust Bedrock',
          shape: 'box',
          dimensions: [6.5, 1.4, 5.0],
          position: [0, -2.1, 0],
          color: '#475569',
          material: 'standard',
          description: 'Fractured upper continental lithosphere hosting the sub-volcanic plumbing system.',
          whatIsIt: 'Solid tectonic rock foundation beneath the volcano.',
          whatDoesItDo: 'Provides the structural overburden and fracture pathways through which magma ascends.',
        },
        {
          id: 'deep-magma-chamber',
          name: 'Sub-Crustal Magma Reservoir',
          label: 'Magma Chamber (Reservoir)',
          shape: 'sphere',
          dimensions: [1.35],
          position: [0, -2.1, 0.3],
          color: '#ea580c',
          material: 'glow',
          description: 'Pressurized molten rock reservoir (700–1200 °C) containing silicate melt, suspended crystals, and dissolved volatiles.',
          whatIsIt: 'Large underground pool of molten rock (magma).',
          whatDoesItDo: 'Accumulates buoyant melt and builds magmatic overpressure prior to eruption.',
          animation: { type: 'pulse', axis: 'y', speed: 2.0, amplitude: 0.1 },
        },
        {
          id: 'stratovolcano-cone-mantle',
          name: 'Composite Volcanic Cone (Alternating Strata)',
          label: 'Composite Cone Strata',
          shape: 'cone',
          dimensions: [2.85, 3.4],
          position: [0, 0.3, 0],
          color: '#78716c',
          material: 'standard',
          opacity: 0.78,
          description: 'Steep-sided volcanic edifice built from alternating layers of viscous andesitic lava and pyroclastic tephra.',
          whatIsIt: 'Layered mountain cone of solidified lava and ash.',
          whatDoesItDo: 'Encloses the central vent and records the geological history of successive eruptions.',
        },
        {
          id: 'central-magmatic-conduit',
          name: 'Central Magmatic Conduit Pipe',
          label: 'Central Conduit / Vent Pipe',
          shape: 'cylinder',
          dimensions: [0.34, 3.8],
          position: [0, 0.0, 0.25],
          color: '#f97316',
          material: 'glow',
          description: 'Vertical pipe connecting the deep magma chamber to the summit crater vent.',
          whatIsIt: 'Primary vertical eruption channel.',
          whatDoesItDo: 'Transports decompressing, gas-rich magma upward toward the surface crater.',
          animation: { type: 'pulse', axis: 'y', speed: 3.0, amplitude: 0.08 },
        },
        {
          id: 'lateral-magma-dike',
          name: 'Intrusive Magmatic Dike & Parasitic Vent',
          label: 'Lateral Dike & Flank Vent',
          shape: 'cylinder',
          dimensions: [0.14, 2.2],
          position: [1.15, -0.35, 0.25],
          rotation: [0, 0, -0.65],
          color: '#ef4444',
          material: 'glow',
          description: 'Sheet-like magmatic intrusion cutting across rock layers to feed a secondary flank vent.',
          whatIsIt: 'Branching magma channel feeding a side cone.',
          whatDoesItDo: 'Relieves conduit pressure by diverting magma to a lateral fissure or parasitic cone.',
        },
        {
          id: 'summit-lava-fountain',
          name: 'Summit Crater & Erupting Lava Fountain',
          label: 'Summit Crater & Lava Flow',
          shape: 'sphere',
          dimensions: [0.52],
          position: [0, 2.05, 0.25],
          color: '#fbbf24',
          material: 'glow',
          description: 'Incandescent degassed magma (lava) extruding from the main summit crater.',
          whatIsIt: 'Molten lava emerging at the summit vent.',
          whatDoesItDo: 'Releases trapped volcanic gases and feeds surface lava streams down the volcano slopes.',
          animation: { type: 'pulse', axis: 'y', speed: 3.5, amplitude: 0.18 },
        },
        {
          id: 'pyroclastic-ash-plume',
          name: 'Buoyant Eruption Column & Ash Plume',
          label: 'Tephra & Ash Plume Cloud',
          shape: 'sphere',
          dimensions: [1.15],
          position: [0, 3.25, 0.1],
          color: '#64748b',
          material: 'standard',
          opacity: 0.85,
          description: 'Convective column of pulverized volcanic glass, pumice, and volcanic gases (H₂O, SO₂, CO₂).',
          whatIsIt: 'Billowing cloud of volcanic ash and gas rising above the crater.',
          whatDoesItDo: 'Carries fine tephra high into the troposphere and stratosphere.',
          animation: { type: 'oscillate', axis: 'y', speed: 1.6, amplitude: 0.2 },
        },
      ],
      parameters: {
        magmaPressure: {
          id: 'magmaPressure',
          name: 'Magma Chamber Overpressure',
          min: 10,
          max: 100,
          step: 5,
          defaultValue: 55,
          unit: 'MPa',
          description: 'Controls magmatic ascent speed, conduit pulsation, and eruption intensity.',
          affects: 'animationSpeed',
          scaleFactor: 0.04,
        },
        silicaViscosity: {
          id: 'silicaViscosity',
          name: 'Silica (SiO₂) Plume Expansion',
          min: 0.6,
          max: 1.6,
          step: 0.1,
          defaultValue: 1.0,
          unit: '×',
          description: 'Higher silica content traps volatile gases, expanding the explosive ash plume volume.',
          affects: 'objectScale',
          targetPartId: 'pyroclastic-ash-plume',
          scaleFactor: 1.0,
        },
        chamberVolume: {
          id: 'chamberVolume',
          name: 'Magma Reservoir Volume',
          min: 0.7,
          max: 1.4,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Scales the deep sub-crustal magma reservoir volume.',
          affects: 'objectScale',
          targetPartId: 'deep-magma-chamber',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Cross-Section Cutaway View',
          type: 'boolean',
          defaultValue: true,
          description: 'Toggles semi-transparent cone cutaway to inspect the internal conduit and dike.',
        },
      },
      equations: [
        'ΔP = ρ_crust · g · h − ρ_magma · g · h (Buoyant Magma Ascent Pressure)',
        'η = η₀ · exp(E_a / R·T) (Arrhenius Magma Melt Viscosity)',
      ],
      curiosityPrompts: [
        'Why is magma called lava only after it reaches Earth’s surface?',
        'How does silica (SiO₂) content determine whether a volcano erupts gently like Hawaii or explosively like Mount St. Helens?',
        'What causes a volcanic caldera to collapse after a major eruption?',
      ],
    };
  }

  // 3. WIND TURBINE & AERODYNAMIC GENERATOR
  if (q.includes('wind turbine') || q.includes('windmill') || (q.includes('wind') && q.includes('generator'))) {
    return {
      id: 'custom-wind-turbine-generator',
      title: 'Horizontal-Axis Wind Turbine & Nacelle Drivetrain',
      concept: 'Aerodynamic Lift, Betz’s Law, Gear Ratio & Electromechanical Power Conversion',
      description:
        'Interactive 3D engineering model of a modern horizontal-axis wind turbine (HAWT) featuring the tubular steel tower, yaw nacelle housing, rotor hub, three pitched aerodynamic airfoil blades, low-speed main shaft, planetary step-up gearbox, and doubly-fed induction generator.',
      whatIsIt: 'A renewable energy machine that converts the kinetic energy of moving wind into electrical energy.',
      howDoesItWork:
        'Wind flowing over the curved airfoil blades creates a Bernoulli pressure difference (aerodynamic lift), spinning the rotor hub. Inside the nacelle, a step-up gearbox increases the slow high-torque rotor rotation (~15 RPM) to high-speed generator rotation (~1500 RPM) to induce AC electricity.',
      realLifeExample: 'Offshore and onshore utility wind farms supplying clean electricity to the power grid.',
      examConnection: 'Betz’s Law proves that no wind turbine can capture more than 16/27 (59.3%) of the kinetic energy in wind, because air must retain velocity to exit behind the swept rotor plane.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [3.5, 2.5, 8.5], target: [0, 0.5, 0] },
      parts: [
        {
          id: 'turbine-foundation-pad',
          name: 'Reinforced Concrete Foundation Pad',
          label: 'Concrete Foundation Base',
          shape: 'cylinder',
          dimensions: [1.6, 0.35],
          position: [0, -2.5, 0],
          color: '#64748b',
          material: 'standard',
          description: 'Deep-pile reinforced concrete foundation anchoring the tower against overturning wind bending moments.',
          whatIsIt: 'Heavy structural foundation pad.',
          whatDoesItDo: 'Transfers tower weight and aerodynamic thrust loads safely into the ground.',
        },
        {
          id: 'tubular-steel-tower',
          name: 'Tapered Tubular Steel Tower',
          label: 'Tubular Steel Tower',
          shape: 'cylinder',
          dimensions: [0.35, 3.8],
          position: [0, -0.5, 0],
          color: '#e2e8f0',
          material: 'metal',
          description: 'Tall cylindrical steel mast elevating the rotor into higher-velocity laminar wind shear layers.',
          whatIsIt: 'Vertical support mast housing power cables and service lift.',
          whatDoesItDo: 'Holds the nacelle high above ground turbulence where wind speed is stronger and steadier.',
        },
        {
          id: 'nacelle-housing-shell',
          name: 'Aerodynamic Nacelle Enclosure',
          label: 'Nacelle Powerhouse Housing',
          shape: 'box',
          dimensions: [1.4, 0.9, 2.2],
          position: [0, 1.55, -0.2],
          color: '#cbd5e1',
          material: 'glass',
          opacity: 0.65,
          description: 'Weatherproof fiberglass housing atop the tower containing the shaft, gearbox, brake, and electric generator.',
          whatIsIt: 'The engine room mounted at the top of the wind turbine tower.',
          whatDoesItDo: 'Rotates on the yaw bearing to keep the rotor facing directly into the wind.',
        },
        {
          id: 'planetary-stepup-gearbox',
          name: 'Planetary Step-Up Gearbox',
          label: 'Step-Up Gearbox (1:90)',
          shape: 'cylinder',
          dimensions: [0.32, 0.65],
          position: [0, 1.55, 0.1],
          rotation: [Math.PI / 2, 0, 0],
          color: '#0284c7',
          material: 'metal',
          description: 'Multi-stage planetary transmission converting low-speed, high-torque hub rotation into high-speed generator shaft rotation.',
          whatIsIt: 'Mechanical speed-multiplying transmission.',
          whatDoesItDo: 'Steps up rotational speed from ~15 RPM at the blades to ~1,500 RPM for the generator.',
          animation: { type: 'spin', axis: 'z', speed: 2.5, amplitude: 0.1 },
        },
        {
          id: 'induction-generator-core',
          name: 'Three-Phase AC Induction Generator',
          label: 'AC Induction Generator',
          shape: 'cylinder',
          dimensions: [0.34, 0.65],
          position: [0, 1.55, -0.75],
          rotation: [Math.PI / 2, 0, 0],
          color: '#d97706',
          material: 'copper',
          description: 'Electromagnetic generator using Faraday induction to convert mechanical shaft work into 3-phase AC electrical power.',
          whatIsIt: 'High-speed electrical generator inside the rear nacelle.',
          whatDoesItDo: 'Converts rotational kinetic energy into alternating current electricity.',
          animation: { type: 'spin', axis: 'z', speed: 5.0, amplitude: 0.1 },
        },
        {
          id: 'aerodynamic-rotor-hub',
          name: 'Nose Cone & Pitch-Control Rotor Hub',
          label: 'Rotor Hub & Pitch Actuator',
          shape: 'cone',
          dimensions: [0.46, 0.85],
          position: [0, 1.55, 1.25],
          rotation: [Math.PI / 2, 0, 0],
          color: '#f8fafc',
          material: 'metal',
          description: 'Central cast-iron hub supporting the three composite blades and housing active blade-pitch motors.',
          whatIsIt: 'Spinning nose cone at the center of the blades.',
          whatDoesItDo: 'Transfers aerodynamic torque from the three blades into the main low-speed shaft.',
          animation: { type: 'spin', axis: 'z', speed: 2.2, amplitude: 0.1 },
        },
        {
          id: 'airfoil-blade-1',
          name: 'Composite Airfoil Blade 1 (Vertical)',
          label: 'Airfoil Rotor Blade 1',
          shape: 'box',
          dimensions: [0.22, 2.35, 0.06],
          position: [0, 2.65, 1.05],
          color: '#f1f5f9',
          material: 'plastic',
          description: 'Twisted fiberglass/carbon-fiber airfoil blade engineered to generate high lift-to-drag ratio.',
          whatIsIt: 'Aerodynamic wing-shaped turbine blade.',
          whatDoesItDo: 'Harnesses Bernoulli lift force from incoming wind to produce rotational torque.',
          animation: { type: 'spin', axis: 'z', speed: 2.2, amplitude: 0.1 },
        },
        {
          id: 'airfoil-blade-2',
          name: 'Composite Airfoil Blade 2 (Starboard)',
          label: 'Airfoil Rotor Blade 2',
          shape: 'box',
          dimensions: [2.25, 0.22, 0.06],
          position: [0.95, 1.0, 1.05],
          rotation: [0, 0, -0.52],
          color: '#f1f5f9',
          material: 'plastic',
          description: 'Second 120°-spaced composite airfoil rotor blade.',
          whatIsIt: 'Aerodynamic wing-shaped turbine blade.',
          whatDoesItDo: 'Maintains balanced 3-phase aerodynamic torque across the swept rotor disc.',
          animation: { type: 'spin', axis: 'z', speed: 2.2, amplitude: 0.1 },
        },
        {
          id: 'airfoil-blade-3',
          name: 'Composite Airfoil Blade 3 (Port)',
          label: 'Airfoil Rotor Blade 3',
          shape: 'box',
          dimensions: [2.25, 0.22, 0.06],
          position: [-0.95, 1.0, 1.05],
          rotation: [0, 0, 0.52],
          color: '#f1f5f9',
          material: 'plastic',
          description: 'Third 120°-spaced composite airfoil rotor blade.',
          whatIsIt: 'Aerodynamic wing-shaped turbine blade.',
          whatDoesItDo: 'Completes the symmetric 3-blade rotor assembly.',
          animation: { type: 'spin', axis: 'z', speed: 2.2, amplitude: 0.1 },
        },
      ],
      parameters: {
        windSpeedMs: {
          id: 'windSpeedMs',
          name: 'Free-Stream Wind Velocity (v)',
          min: 3,
          max: 25,
          step: 1,
          defaultValue: 12,
          unit: 'm/s',
          description: 'Available wind power scales with the cube of wind velocity (P ∝ v³).',
          affects: 'animationSpeed',
          scaleFactor: 0.22,
        },
        rotorDiameterScale: {
          id: 'rotorDiameterScale',
          name: 'Blade Swept Length Factor (R)',
          min: 0.7,
          max: 1.4,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Doubling blade length quadruples the swept area A = πR² and power output.',
          affects: 'objectScale',
          targetPartId: 'airfoil-blade-1',
          scaleFactor: 1.0,
        },
        bladePitchDeg: {
          id: 'bladePitchDeg',
          name: 'Blade Pitch Feathering Angle',
          min: 0,
          max: 30,
          step: 2,
          defaultValue: 6,
          unit: '°',
          description: 'Adjusts the angle of attack of the blades to regulate lift and prevent overspeed in storms.',
          affects: 'objectRotation',
          targetPartId: 'airfoil-blade-1',
          scaleFactor: 0.02,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Nacelle Cutaway View',
          type: 'boolean',
          defaultValue: true,
          description: 'Reveals the internal planetary gearbox and copper induction generator inside the nacelle.',
        },
      },
      equations: [
        'P = ½ · ρ · A · v³ · C_p (Wind Turbine Power Equation, where A = πR²)',
        'C_p,max = 16 / 27 ≈ 0.593 (Betz Limit Maximum Theoretical Efficiency)',
      ],
      curiosityPrompts: [
        'Why does doubling the wind speed increase wind turbine power output by 8 times (2³)?',
        'Why do modern wind turbines have 3 thin blades instead of 20 wide blades like old farm windmills?',
        'What is Betz’s Law and why can a turbine never capture 100% of wind energy?',
      ],
    };
  }

  // 4. PROKARYOTIC BACTERIAL CELL WITH FLAGELLUM
  if (q.includes('bacteria') || q.includes('prokaryot') || q.includes('flagellum') || q.includes('plasmid') || q.includes('bacillus')) {
    return {
      id: 'custom-prokaryotic-bacterial-cell',
      title: 'Prokaryotic Bacterial Cell (Bacillus) Explorer',
      concept: 'Microbiology, Prokaryotic Ultrastructure, Peptidoglycan Cell Wall & Flagellar Chemotaxis',
      description:
        'Interactive 3D cutaway model of a rod-shaped prokaryotic bacterium (bacillus) displaying the protective polysaccharide capsule, rigid peptidoglycan cell wall, plasma membrane, cytoplasm, unenclosed circular nucleoid DNA, extrachromosomal plasmids, 70S ribosomes, attachment pili, and rotary motor flagellum.',
      whatIsIt: 'A single-celled prokaryotic microorganism that lacks a membrane-bound nucleus or membrane-bound organelles.',
      howDoesItWork:
        'Genetic information is stored in a single circular chromosome located in the nucleoid region alongside small circular plasmids. 70S ribosomes translate mRNA directly in the cytoplasm, while a proton-motive rotary motor spins the helical flagellum to propel the bacterium toward nutrients (chemotaxis).',
      realLifeExample: 'Escherichia coli in the human gut microbiome or Lactobacillus used to ferment yogurt.',
      examConnection: 'Prokaryotes have 70S ribosomes (50S + 30S subunits), circular naked DNA without histones, and peptidoglycan cell walls — unlike eukaryotes (80S ribosomes, linear DNA with histones, membrane-bound nucleus).',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 3.0, 8.2], target: [0, 0, 0] },
      parts: [
        {
          id: 'polysaccharide-capsule-shell',
          name: 'Outer Polysaccharide Capsule (Glycocalyx)',
          label: 'Polysaccharide Capsule',
          shape: 'capsule',
          dimensions: [1.25, 2.4],
          position: [-0.3, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#10b981',
          material: 'glass',
          opacity: 0.45,
          description: 'Sticky outer glycocalyx layer that protects pathogenic bacteria from host phagocytosis and desiccation.',
          whatIsIt: 'Outermost protective slime/capsule coat.',
          whatDoesItDo: 'Helps bacteria adhere to surfaces (biofilms) and evade immune white blood cells.',
        },
        {
          id: 'peptidoglycan-cell-wall',
          name: 'Peptidoglycan Cell Wall (Murein)',
          label: 'Peptidoglycan Cell Wall',
          shape: 'capsule',
          dimensions: [1.1, 2.2],
          position: [-0.3, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#34d399',
          material: 'glass',
          opacity: 0.55,
          description: 'Rigid meshwork of N-acetylglucosamine (NAG) and N-acetylmuramic acid (NAM) cross-linked by peptide chains.',
          whatIsIt: 'Structural bacterial cell wall (target of penicillin antibiotics).',
          whatDoesItDo: 'Maintains the rod shape of the bacterium and prevents osmotic lysis in hypotonic environments.',
        },
        {
          id: 'bacterial-plasma-membrane',
          name: 'Phospholipid Plasma Membrane',
          label: 'Plasma Membrane (ATP Site)',
          shape: 'capsule',
          dimensions: [0.95, 2.0],
          position: [-0.3, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#fbbf24',
          material: 'tissue',
          opacity: 0.72,
          description: 'Selectively permeable phospholipid bilayer housing electron transport chain enzymes for cellular respiration.',
          whatIsIt: 'Inner cell membrane surrounding the cytoplasm.',
          whatDoesItDo: 'Regulates nutrient transport and generates the proton gradient (H⁺) used for ATP synthesis and flagellar rotation.',
        },
        {
          id: 'nucleoid-circular-dna',
          name: 'Nucleoid Region (Circular Chromosomal DNA)',
          label: 'Nucleoid (Circular DNA)',
          shape: 'torus',
          dimensions: [0.55, 0.18],
          position: [-0.45, 0.05, 0],
          rotation: [0.8, 0.4, 0],
          color: '#ef4444',
          material: 'glow',
          description: 'Dense, supercoiled single circular double-stranded DNA chromosome floating directly in the cytoplasm without a nuclear envelope.',
          whatIsIt: 'Primary bacterial chromosome in the nucleoid region.',
          whatDoesItDo: 'Encodes all essential genes for bacterial metabolism, binary fission, and growth.',
          animation: { type: 'pulse', axis: 'y', speed: 1.8, amplitude: 0.08 },
        },
        {
          id: 'antibiotic-resistance-plasmid',
          name: 'Extrachromosomal Plasmid DNA Ring',
          label: 'Plasmid DNA Ring (R-Plasmid)',
          shape: 'torus',
          dimensions: [0.24, 0.06],
          position: [0.65, 0.25, 0.25],
          rotation: [1.2, 0, 0.5],
          color: '#38bdf8',
          material: 'glow',
          description: 'Small, independently replicating circular DNA molecule often carrying antibiotic-resistance genes and used as a vector in genetic engineering.',
          whatIsIt: 'Accessory circular DNA ring.',
          whatDoesItDo: 'Confers selective advantages like antibiotic resistance and can be transferred between bacteria via conjugation.',
          animation: { type: 'spin', axis: 'z', speed: 1.5, amplitude: 0.1 },
        },
        {
          id: 'ribosomes-70s-cluster',
          name: '70S Bacterial Ribosomes (50S + 30S)',
          label: '70S Ribosomes (Protein Synthesis)',
          shape: 'sphere',
          dimensions: [0.22],
          position: [0.35, -0.3, -0.25],
          color: '#a855f7',
          material: 'standard',
          description: 'Ribonucleoprotein complexes (70S sedimentation rate) that translate mRNA into polypeptide chains.',
          whatIsIt: 'Prokaryotic protein factories.',
          whatDoesItDo: 'Synthesizes bacterial enzymes and structural proteins (coupled transcription-translation).',
        },
        {
          id: 'flagellar-basal-motor',
          name: 'Flagellar Basal Body Rotary Motor',
          label: 'Basal Body Proton Motor',
          shape: 'cylinder',
          dimensions: [0.22, 0.35],
          position: [1.85, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#f59e0b',
          material: 'metal',
          description: 'Biological nanomachine embedded in the cell envelope that spins at up to 100,000 RPM driven by proton (H⁺) flux.',
          whatIsIt: 'Molecular rotary engine at the base of the flagellum.',
          whatDoesItDo: 'Converts proton-motive force across the plasma membrane into mechanical torque.',
          animation: { type: 'spin', axis: 'x', speed: 4.5, amplitude: 0.2 },
        },
        {
          id: 'helical-flagellum-filament',
          name: 'Flagellin Helical Propeller Filament',
          label: 'Flagellum Propeller',
          shape: 'cylinder',
          dimensions: [0.06, 2.4],
          position: [3.1, 0, 0],
          rotation: [0, 0.18, Math.PI / 2],
          color: '#38bdf8',
          material: 'plastic',
          description: 'Long helical protein filament made of flagellin that acts as a screw propeller in aqueous media.',
          whatIsIt: 'Whip-like swimming tail of the bacterium.',
          whatDoesItDo: 'Propels the cell forward during "runs" and reorients it during "tumbles" in chemotaxis.',
          animation: { type: 'oscillate', axis: 'z', speed: 5.0, amplitude: 0.22 },
        },
        {
          id: 'attachment-pili-fimbriae',
          name: 'Conjugation Pilus & Surface Fimbriae',
          label: 'Pili / Fimbriae',
          shape: 'cylinder',
          dimensions: [0.04, 0.85],
          position: [-0.8, 1.35, 0],
          rotation: [0, 0, 0.25],
          color: '#cbd5e1',
          material: 'plastic',
          description: 'Hair-like protein appendages extending from the capsule for surface attachment and horizontal gene transfer (sex pilus).',
          whatIsIt: 'Protein attachment bristles and DNA bridge tubes.',
          whatDoesItDo: 'Anchors bacteria to host tissues and forms mating bridges to transfer plasmids.',
        },
      ],
      parameters: {
        protonMotiveForce: {
          id: 'protonMotiveForce',
          name: 'Proton-Motive Force (ΔpH Flagellar Speed)',
          min: 20,
          max: 200,
          step: 10,
          defaultValue: 120,
          unit: 'mV',
          description: 'Transmembrane H⁺ electrochemical gradient driving the rotary flagellar motor speed.',
          affects: 'animationSpeed',
          scaleFactor: 0.025,
        },
        capsuleThickness: {
          id: 'capsuleThickness',
          name: 'Polysaccharide Capsule Thickness',
          min: 0.8,
          max: 1.35,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Adjusts the outer virulence capsule thickness surrounding the peptidoglycan wall.',
          affects: 'objectScale',
          targetPartId: 'polysaccharide-capsule-shell',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Cutaway Envelope View',
          type: 'boolean',
          defaultValue: true,
          description: 'Makes the outer capsule and cell wall semi-transparent to inspect the nucleoid and plasmids.',
        },
      },
      equations: [
        'N(t) = N₀ · 2^(t / g) (Exponential Bacterial Binary Fission Growth)',
        'Δp = Δψ − (2.3·R·T / F)·ΔpH (Proton-Motive Force Driving Flagellar Rotation)',
      ],
      curiosityPrompts: [
        'Why do antibiotics like penicillin kill bacteria by targeting peptidoglycan without harming human cells?',
        'How does a bacterium transfer antibiotic resistance to another bacterium using a plasmid and pilus?',
        'Why do prokaryotes have 70S ribosomes while eukaryotic cells have 80S ribosomes?',
      ],
    };
  }

  // 5. SOLAR PHOTOVOLTAIC (PV) CELL
  if (q.includes('solar cell') || q.includes('photovoltaic') || (q.includes('pv') && q.includes('cell')) || q.includes('solar panel')) {
    return {
      id: 'custom-solar-photovoltaic-cell',
      title: 'Solar Photovoltaic (PV) p–n Junction Cell',
      concept: 'Photovoltaic Effect, Semiconductor Band Gap, Electron-Hole Pair Generation & DC Power',
      description:
        'Interactive 3D semiconductor physics model of a crystalline silicon solar photovoltaic cell showing the tempered glass cover, silicon nitride anti-reflective coating, front silver contact fingers, n-type phosphorus-doped silicon emitter, depletion zone electric field, p-type boron-doped silicon base, aluminum back-surface field contact, and incident photon stream.',
      whatIsIt: 'A solid-state semiconductor device that converts sunlight (photons) directly into direct-current (DC) electricity via the photovoltaic effect.',
      howDoesItWork:
        'Incident photons with energy E = hf greater than the silicon band gap (1.12 eV) excite electrons from the valence band into the conduction band, creating electron-hole pairs. The built-in electric field at the p–n depletion junction sweeps electrons into the n-type layer and holes into the p-type layer, driving DC current through an external load.',
      realLifeExample: 'Rooftop solar panels, spacecraft solar arrays on the ISS, and solar calculators.',
      examConnection: 'Only photons with energy hf ≥ E_g (1.12 eV for silicon, λ ≤ 1100 nm) can excite an electron across the band gap; excess photon energy (hf − E_g) is dissipated as lattice heat (thermalization), defining the Shockley–Queisser efficiency limit (~33.7%).',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [3.2, 3.2, 7.8], target: [0, 0, 0] },
      parts: [
        {
          id: 'incident-solar-photon-stream',
          name: 'Incident Solar Photon Stream (E = hf)',
          label: 'Incident Photons (E = hf)',
          shape: 'Octahedron'.toLowerCase() as any,
          dimensions: [0.45],
          position: [0, 2.2, 0],
          color: '#facc15',
          material: 'glow',
          description: 'Incoming solar electromagnetic quanta striking the top surface of the photovoltaic cell.',
          whatIsIt: 'Packets of light energy (photons) from the Sun.',
          whatDoesItDo: 'Transfers quantum energy hf to valence electrons in the silicon crystal lattice.',
          animation: { type: 'oscillate', axis: 'y', speed: 3.2, amplitude: 0.35 },
        },
        {
          id: 'antireflective-glass-coating',
          name: 'Tempered Glass & Si₃N₄ Anti-Reflective Layer',
          label: 'Anti-Reflective Coating (Si₃N₄)',
          shape: 'box',
          dimensions: [4.6, 0.25, 3.4],
          position: [0, 1.15, 0],
          color: '#38bdf8',
          material: 'glass',
          opacity: 0.55,
          description: 'Quarter-wavelength silicon nitride thin film that minimizes surface reflection from >30% down to <3%, giving solar cells their deep blue color.',
          whatIsIt: 'Transparent optical coating and protective glass top sheet.',
          whatDoesItDo: 'Maximizes photon transmission into the active silicon absorber layer via destructive interference of reflected rays.',
        },
        {
          id: 'front-metallic-grid-fingers',
          name: 'Front Silver Busbars & Contact Fingers (−)',
          label: 'Front Metal Grid (− Cathode)',
          shape: 'box',
          dimensions: [4.4, 0.12, 0.35],
          position: [0, 0.92, 0],
          color: '#e2e8f0',
          material: 'metal',
          description: 'Narrow metallic grid lines printed on the sunlit surface to collect photo-generated electrons without blocking incoming light.',
          whatIsIt: 'Negative front electrical terminal grid.',
          whatDoesItDo: 'Collects free electrons from the n-type emitter and routes them into the external DC circuit.',
        },
        {
          id: 'n-type-silicon-emitter',
          name: 'n-Type Phosphorus-Doped Silicon Emitter',
          label: 'n-Type Silicon (Donor e⁻)',
          shape: 'box',
          dimensions: [4.6, 0.55, 3.4],
          position: [0, 0.52, 0],
          color: '#0284c7',
          material: 'standard',
          description: 'Thin silicon layer doped with pentavalent phosphorus (Group 15) atoms providing mobile majority electrons.',
          whatIsIt: 'Negative-type semiconductor top layer.',
          whatDoesItDo: 'Receives photo-excited electrons swept across the depletion zone electric field.',
        },
        {
          id: 'pn-depletion-junction-zone',
          name: 'p–n Depletion Zone (Built-In Electric Field E_bi)',
          label: 'p–n Depletion Zone (Charge Separation)',
          shape: 'box',
          dimensions: [4.65, 0.28, 3.45],
          position: [0, 0.1, 0],
          color: '#f59e0b',
          material: 'glow',
          description: 'Space-charge region between n-type and p-type silicon containing fixed donor (+P) and acceptor (−B) ions that create a strong internal electric field.',
          whatIsIt: 'Internal charge-separating barrier junction.',
          whatDoesItDo: 'Acts as a one-way diode broom that separates electron-hole pairs before they can recombine.',
          animation: { type: 'pulse', axis: 'y', speed: 2.4, amplitude: 0.06 },
        },
        {
          id: 'p-type-silicon-absorber-base',
          name: 'p-Type Boron-Doped Silicon Absorber Base',
          label: 'p-Type Silicon Base (Acceptor h⁺)',
          shape: 'box',
          dimensions: [4.6, 0.95, 3.4],
          position: [0, -0.52, 0],
          color: '#be123c',
          material: 'standard',
          description: 'Thick crystalline silicon wafer doped with trivalent boron (Group 13) atoms where most long-wavelength photons are absorbed.',
          whatIsIt: 'Positive-type semiconductor base wafer.',
          whatDoesItDo: 'Absorbs photons to generate minority electrons that diffuse to the depletion junction, while collecting positive holes (h⁺).',
        },
        {
          id: 'rear-aluminum-contact-sheet',
          name: 'Rear Aluminum Back-Surface Field Contact (+)',
          label: 'Rear Aluminum Contact (+ Anode)',
          shape: 'box',
          dimensions: [4.6, 0.24, 3.4],
          position: [0, -1.12, 0],
          color: '#94a3b8',
          material: 'metal',
          description: 'Full-area conductive metallic back sheet serving as the positive terminal and reflecting unabsorbed infrared photons back into the wafer.',
          whatIsIt: 'Positive rear metallic electrode.',
          whatDoesItDo: 'Completes the electrical circuit by receiving returning electrons from the external load to recombine with holes.',
        },
      ],
      parameters: {
        solarIrradianceWm2: {
          id: 'solarIrradianceWm2',
          name: 'Solar Irradiance Intensity (G)',
          min: 100,
          max: 1200,
          step: 50,
          defaultValue: 1000,
          unit: 'W/m²',
          description: 'Short-circuit photocurrent I_sc is directly proportional to incident solar irradiance (Standard Test Condition = 1000 W/m²).',
          affects: 'animationSpeed',
          scaleFactor: 0.0025,
        },
        depletionWidthScale: {
          id: 'depletionWidthScale',
          name: 'Depletion Zone Field Width',
          min: 0.6,
          max: 1.8,
          step: 0.1,
          defaultValue: 1.0,
          unit: '×',
          description: 'Adjusts the thickness of the internal p–n space-charge separation region.',
          affects: 'objectScale',
          targetPartId: 'pn-depletion-junction-zone',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Show Optical & Junction Layers',
          type: 'boolean',
          defaultValue: true,
          description: 'Highlights internal charge separation across the n-type, depletion, and p-type semiconductor layers.',
        },
      },
      equations: [
        'I = I_L − I₀ · [exp(q·V / n·k_B·T) − 1] (Ideal Photovoltaic Solar Cell Equation)',
        'η = (V_oc · I_sc · FF) / P_solar (Photovoltaic Conversion Efficiency, E_g(Si) = 1.12 eV)',
      ],
      curiosityPrompts: [
        'Why does a silicon solar cell stop generating electricity if photon wavelength is longer than 1100 nm (infrared)?',
        'Why do solar panels actually lose voltage and efficiency when they get too hot on a summer afternoon?',
        'What is the role of the built-in electric field inside the p–n depletion zone?',
      ],
    };
  }

  // 6. BENZENE AROMATIC RING (C6H6)
  if (q.includes('benzene') || q.includes('c6h6') || q.includes('aromatic ring') || q.includes('delocalized pi')) {
    const parts: ModelPartSpec[] = [];
    const R_c = 1.4;
    const R_h = 2.48;

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const cx = +(R_c * Math.cos(angle)).toFixed(3);
      const cz = +(R_c * Math.sin(angle)).toFixed(3);
      const hx = +(R_h * Math.cos(angle)).toFixed(3);
      const hz = +(R_h * Math.sin(angle)).toFixed(3);

      parts.push({
        id: `carbon-c${i + 1}`,
        name: `sp² Carbon Atom C${i + 1}`,
        label: `C${i + 1} (sp² — 120°)`,
        shape: 'sphere',
        dimensions: [0.42],
        position: [cx, 0, cz],
        color: '#334155',
        material: 'standard',
        description: `sp² hybridized ring carbon atom C${i + 1} with 120° trigonal planar geometry and one unhybridized 2p_z orbital.`,
        whatIsIt: 'sp² hybridized carbon atom in the hexagonal benzene ring.',
        whatDoesItDo: 'Forms three planar σ (sigma) bonds and contributes one π electron to the delocalized aromatic cloud.',
      });

      parts.push({
        id: `hydrogen-h${i + 1}`,
        name: `Aromatic Hydrogen Atom H${i + 1}`,
        label: `H${i + 1}`,
        shape: 'sphere',
        dimensions: [0.28],
        position: [hx, 0, hz],
        color: '#f8fafc',
        material: 'standard',
        description: `Peripheral hydrogen atom bonded radially via an sp²–1s σ bond.`,
        whatIsIt: 'Terminal hydrogen atom of C₆H₆.',
        whatDoesItDo: 'Completes the planar hexagonal symmetry (D₆ₕ point group) of benzene.',
      });

      // C-C bond to next carbon
      const nextAngle = (((i + 1) % 6) * Math.PI) / 3;
      const ncx = +(R_c * Math.cos(nextAngle)).toFixed(3);
      const ncz = +(R_c * Math.sin(nextAngle)).toFixed(3);
      parts.push(
        createBondPart(
          `cc-sigma-bond-${i + 1}`,
          `C${i + 1}–C${((i + 1) % 6) + 1} Intermediate Bond (1.39 Å, BO = 1.5)`,
          [cx, 0, cz],
          [ncx, 0, ncz],
          0.12,
          '#94a3b8'
        )
      );
    }

    // Upper and lower delocalized pi electron clouds
    parts.push({
      id: 'upper-delocalized-pi-torus',
      name: 'Upper Delocalized π Electron Ring Cloud (+ψ)',
      label: 'Upper π Electron Cloud (6π Huckel)',
      shape: 'torus',
      dimensions: [1.4, 0.26],
      position: [0, 0.58, 0],
      rotation: [Math.PI / 2, 0, 0],
      color: '#38bdf8',
      material: 'glass',
      opacity: 0.68,
      description: 'Continuous toroidal lobe of electron density formed by side-by-side overlap of six parallel unhybridized 2p_z orbitals above the ring plane.',
      whatIsIt: 'Delocalized aromatic π molecular orbital cloud.',
      whatDoesItDo: 'Stabilizes the benzene ring by ~150 kJ/mol (resonance stabilization energy), favoring substitution over addition reactions.',
      animation: { type: 'pulse', axis: 'y', speed: 2.2, amplitude: 0.08 },
    });

    parts.push({
      id: 'lower-delocalized-pi-torus',
      name: 'Lower Delocalized π Electron Ring Cloud (−ψ)',
      label: 'Lower π Electron Cloud',
      shape: 'torus',
      dimensions: [1.4, 0.26],
      position: [0, -0.58, 0],
      rotation: [Math.PI / 2, 0, 0],
      color: '#f43f5e',
      material: 'glass',
      opacity: 0.68,
      description: 'Lower toroidal lobe of the delocalized π electron system below the hexagonal σ ring plane.',
      whatIsIt: 'Lower lobe of the aromatic π electron sextet.',
      whatDoesItDo: 'Equalizes all six C–C bond lengths to exactly 1.39 Å (intermediate between 1.54 Å single and 1.34 Å double bonds).',
      animation: { type: 'pulse', axis: 'y', speed: 2.2, amplitude: 0.08 },
    });

    return {
      id: 'custom-benzene-aromatic-ring',
      title: 'Benzene (C₆H₆) Aromatic Ring & Delocalized π Cloud',
      concept: 'Aromaticity, sp² Hybridization, Resonance Delocalization & Hückel’s 4n+2 Rule',
      description:
        'Interactive 3D molecular model of benzene (C₆H₆) showing the planar hexagonal ring of six sp² hybridized carbon atoms, six radial hydrogen atoms, equalized 1.39 Å carbon–carbon bonds (bond order 1.5), and the upper and lower toroidal delocalized 6π electron clouds.',
      whatIsIt: 'The prototypical aromatic hydrocarbon molecule (C₆H₆) with a planar hexagonal carbon ring and a delocalized cloud of six π electrons.',
      howDoesItWork:
        'Each carbon atom uses sp² hybrid orbitals to form three planar σ bonds at 120° angles, leaving one unhybridized 2p_z orbital perpendicular to the ring. All six 2p_z orbitals overlap continuously around the ring, forming a delocalized π system obeying Hückel’s 4n + 2 = 6 rule (n = 1).',
      realLifeExample: 'Foundational ring structure in aspirin, paracetamol, amino acids (phenylalanine, tyrosine), and polystyrene plastics.',
      examConnection: 'X-ray diffraction proves all six C–C bonds in benzene have an identical length of 139 pm (1.39 Å), mid-way between a C–C single bond (154 pm) and a C=C double bond (134 pm).',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 4.5, 6.8], target: [0, 0, 0] },
      parts,
      parameters: {
        piCloudScale: {
          id: 'piCloudScale',
          name: 'π-Orbital Delocalization Density',
          min: 0.6,
          max: 1.5,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Scales the upper and lower toroidal delocalized 6π electron probability clouds.',
          affects: 'objectScale',
          targetPartId: 'upper-delocalized-pi-torus',
          scaleFactor: 1.0,
        },
        vibrationFrequency: {
          id: 'vibrationFrequency',
          name: 'Ring Breathing Vibration Mode',
          min: 0.5,
          max: 4.0,
          step: 0.25,
          defaultValue: 2.0,
          unit: 'THz',
          description: 'Controls the harmonic pulsation rate of the delocalized π electron system.',
          affects: 'animationSpeed',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Show Delocalized π Clouds',
          type: 'boolean',
          defaultValue: true,
          description: 'Toggles visibility and translucency of the upper and lower π molecular orbital lobes.',
        },
      },
      equations: [
        '4n + 2 = 6 π electrons (Hückel’s Rule for Aromaticity, n = 1)',
        'Bond Order = (6 σ + 3 π) / 6 = 1.5 (All C–C bonds equal at 1.39 Å)',
      ],
      curiosityPrompts: [
        'Why are all six carbon–carbon bonds in benzene the exact same length (1.39 Å) instead of alternating short and long?',
        'Why does benzene undergo electrophilic aromatic substitution instead of addition reactions like alkenes?',
        'What are the four criteria a molecule must satisfy to be aromatic under Hückel’s rule?',
      ],
    };
  }

  // 7. CHLOROPLAST & PHOTOSYNTHESIS 3D MODEL
  if (q.includes('chloroplast') || q.includes('thylakoid') || q.includes('grana') || q.includes('photosynthesis')) {
    return {
      id: 'custom-chloroplast-photosynthesis',
      title: 'Chloroplast Ultrastructure & Thylakoid Grana Explorer',
      concept: 'Photosynthesis, Light-Dependent Thylakoid Reactions & Calvin Cycle Stroma',
      description:
        'Interactive 3D organelle model of a plant chloroplast illustrating the smooth outer membrane, inner membrane, aqueous stroma matrix, stacked thylakoid discs (grana), interconnecting stroma lamellae, circular plastid DNA, and starch granules.',
      whatIsIt: 'The double-membrane photosynthetic organelle in plant and algal cells that converts light energy, CO₂, and H₂O into glucose and O₂.',
      howDoesItWork:
        'Chlorophyll pigments embedded in the stacked thylakoid membranes (grana) absorb red and blue photons to split water (photolysis, releasing O₂) and synthesize ATP and NADPH. In the surrounding fluid stroma, the enzyme RuBisCO uses that ATP and NADPH to fix CO₂ into glucose via the Calvin Cycle.',
      realLifeExample: 'Green leaves capturing sunlight to power nearly all food chains and oxygenate Earth’s atmosphere.',
      examConnection: 'Light-dependent reactions occur in the Thylakoid Membranes (producing O₂, ATP, NADPH); Light-independent reactions (Calvin Cycle) occur in the Stroma (fixing CO₂ into triose phosphate/glucose).',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 3.8, 7.5], target: [0, 0, 0] },
      parts: [
        {
          id: 'chloroplast-outer-membrane',
          name: 'Outer Phospholipid Envelope',
          label: 'Outer Chloroplast Membrane',
          shape: 'capsule',
          dimensions: [1.35, 2.5],
          position: [0, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#15803d',
          material: 'glass',
          opacity: 0.45,
          description: 'Smooth outer lipid bilayer containing porin proteins permeable to small metabolites.',
          whatIsIt: 'Outer boundary membrane of the chloroplast.',
          whatDoesItDo: 'Defines the organelle boundary and reflects endosymbiotic cyanobacterial ancestry.',
        },
        {
          id: 'chloroplast-stroma-matrix',
          name: 'Stroma Fluid Matrix (Calvin Cycle Site)',
          label: 'Stroma (Calvin Cycle & RuBisCO)',
          shape: 'capsule',
          dimensions: [1.18, 2.2],
          position: [0, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          color: '#4ade80',
          material: 'glass',
          opacity: 0.35,
          description: 'Protein-rich alkaline fluid containing RuBisCO enzymes, 70S plastoribosomes, and circular chloroplast DNA (cpDNA).',
          whatIsIt: 'Internal aqueous fluid surrounding the thylakoid stacks.',
          whatDoesItDo: 'Catalyzes carbon fixation (Calvin-Benson cycle) using ATP and NADPH from the thylakoids.',
        },
        {
          id: 'thylakoid-granum-stack-left',
          name: 'Left Thylakoid Granum Stack (Photosystems I & II)',
          label: 'Granum (Stacked Thylakoid Discs)',
          shape: 'cylinder',
          dimensions: [0.55, 1.25],
          position: [-1.05, 0.05, 0.15],
          color: '#16a34a',
          material: 'standard',
          description: 'Vertical stack of flattened thylakoid membrane sacs packed with chlorophyll a/b, carotenoids, and ATP synthase.',
          whatIsIt: 'Stack of chlorophyll-rich thylakoid membrane discs.',
          whatDoesItDo: 'Captures photons, splits water (2H₂O → O₂ + 4H⁺ + 4e⁻), and pumps protons into the thylakoid lumen.',
          animation: { type: 'pulse', axis: 'y', speed: 2.0, amplitude: 0.07 },
        },
        {
          id: 'thylakoid-granum-stack-center',
          name: 'Central Thylakoid Granum Stack',
          label: 'Central Thylakoid Granum',
          shape: 'cylinder',
          dimensions: [0.58, 1.35],
          position: [0.0, 0.1, -0.15],
          color: '#15803d',
          material: 'standard',
          description: 'High-surface-area thylakoid membrane stack maximizing light absorption and chemiosmotic ATP synthesis.',
          whatIsIt: 'Central stack of thylakoid discs.',
          whatDoesItDo: 'Hosts the photosynthetic electron transport chain (Z-scheme).',
          animation: { type: 'pulse', axis: 'y', speed: 2.0, amplitude: 0.07 },
        },
        {
          id: 'thylakoid-granum-stack-right',
          name: 'Right Thylakoid Granum Stack',
          label: 'Right Thylakoid Granum',
          shape: 'cylinder',
          dimensions: [0.52, 1.15],
          position: [1.05, -0.05, 0.2],
          color: '#16a34a',
          material: 'standard',
          description: 'Right thylakoid granum interconnected via stroma lamellae.',
          whatIsIt: 'Right stack of photosynthetic thylakoids.',
          whatDoesItDo: 'Generates NADPH and ATP on the stromal surface.',
          animation: { type: 'pulse', axis: 'y', speed: 2.0, amplitude: 0.07 },
        },
        {
          id: 'stroma-lamellae-bridges',
          name: 'Intergranal Stroma Lamellae (Frets)',
          label: 'Stroma Lamellae (Membrane Bridges)',
          shape: 'cylinder',
          dimensions: [0.12, 2.5],
          position: [0, 0.05, 0.05],
          rotation: [0, 0, Math.PI / 2],
          color: '#22c55e',
          material: 'plastic',
          description: 'Tubular membrane channels connecting individual grana stacks into a single continuous internal thylakoid lumen.',
          whatIsIt: 'Connecting membrane bridges between grana.',
          whatDoesItDo: 'Allows mobile electron carriers (plastoquinone/plastocyanin) and protons to circulate between grana.',
        },
        {
          id: 'chloroplast-dna-ring',
          name: 'Circular Chloroplast DNA (cpDNA)',
          label: 'Circular Plastid DNA (Endosymbiosis)',
          shape: 'torus',
          dimensions: [0.28, 0.06],
          position: [-0.55, -0.5, 0.55],
          rotation: [1.1, 0.3, 0],
          color: '#facc15',
          material: 'glow',
          description: 'Autonomous circular genome providing evolutionary evidence that chloroplasts originated from engulfed photosynthetic cyanobacteria.',
          whatIsIt: 'Organelle-specific circular DNA ring.',
          whatDoesItDo: 'Encodes key photosynthetic proteins including the large subunit of RuBisCO.',
        },
      ],
      parameters: {
        photonFluxDensity: {
          id: 'photonFluxDensity',
          name: 'Photosynthetic Photon Flux (PAR)',
          min: 50,
          max: 1500,
          step: 50,
          defaultValue: 600,
          unit: 'μmol/m²·s',
          description: 'Drives the rate of water photolysis, electron transport, and thylakoid proton pumping.',
          affects: 'animationSpeed',
          scaleFactor: 0.003,
        },
        granaStackScale: {
          id: 'granaStackScale',
          name: 'Thylakoid Grana Stacking Height',
          min: 0.7,
          max: 1.4,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Shade-adapted leaves develop taller grana stacks to capture scarce photons.',
          affects: 'objectScale',
          targetPartId: 'thylakoid-granum-stack-center',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Cutaway Outer Envelope',
          type: 'boolean',
          defaultValue: true,
          description: 'Makes the chloroplast double envelope translucent so internal grana and stroma lamellae are clearly visible.',
        },
      },
      equations: [
        '6 CO₂ + 6 H₂O + Light (hν) ➔ C₆H₁₂O₆ + 6 O₂ (Overall Photosynthesis Equation)',
        '2 H₂O + 2 NADP⁺ + 3 ADP + 3 P_i ➔ O₂ + 2 NADPH + 3 ATP (Z-Scheme Light Reactions)',
      ],
      curiosityPrompts: [
        'Why do plants appear green if sunlight is strongest in the green-yellow part of the spectrum?',
        'How does the proton (H⁺) gradient inside the tiny thylakoid lumen drive ATP synthase?',
        'What evidence shows that chloroplasts were once free-living photosynthetic cyanobacteria?',
      ],
    };
  }

  // 8. EARTH'S INTERIOR LAYERS & CONVECTION
  if ((q.includes('earth') && (q.includes('layer') || q.includes('interior') || q.includes('core') || q.includes('mantle') || q.includes('crust'))) || q.includes('lithosphere')) {
    return {
      id: 'custom-earth-interior-layers',
      title: 'Earth’s Concentric Interior Layers & Geodynamo Core',
      concept: 'Geophysics, Planetary Differentiation, Mantle Convection & Outer Core Geodynamo',
      description:
        'Interactive 3D cutaway geophysical model of Earth’s internal structure displaying the thin brittle silicate crust, upper and lower silicate mantle with convective plumes, Gutenberg discontinuity, liquid iron–nickel outer core (geodynamo source), and solid crystalline inner core.',
      whatIsIt: 'A concentric cross-section of planet Earth from the surface crust down to the 6,371 km deep solid iron center.',
      howDoesItWork:
        'Primordial gravitational differentiation separated dense siderophile metals (Fe, Ni) into the core while lighter silicate minerals formed the mantle and crust. Primordial heat and radioactive decay (²³⁸U, ²³²Th, ⁴⁰K) drive slow thermal convection in the mantle (moving tectonic plates) and Coriolis-twisted fluid currents in the liquid outer core (generating Earth’s magnetic field).',
      realLifeExample: 'Seismic P-waves and S-waves from earthquakes revealing that the outer core is liquid (S-wave shadow zone).',
      examConnection: 'Mohorovičić (Moho) discontinuity separates Crust from Mantle (~35 km); Gutenberg discontinuity separates silicate Mantle from liquid Fe-Ni Outer Core (2,890 km); Lehmann discontinuity separates Outer Core from solid Inner Core (5,150 km).',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 3.2, 8.2], target: [0, 0, 0] },
      parts: [
        {
          id: 'earth-crust-lithosphere',
          name: 'Oceanic & Continental Crust (0–70 km)',
          label: 'Silicate Crust (Lithosphere)',
          shape: 'sphere',
          dimensions: [2.65],
          position: [0, 0, 0],
          color: '#0284c7',
          material: 'glass',
          opacity: 0.32,
          description: 'Outermost rigid rocky shell composed of granitic continental crust (~2.7 g/cm³) and basaltic oceanic crust (~3.0 g/cm³).',
          whatIsIt: 'Thin outer rocky skin of the Earth.',
          whatDoesItDo: 'Floats isostatically atop the ductile asthenosphere and breaks into tectonic plates.',
        },
        {
          id: 'silicate-mantle-shell',
          name: 'Silicate Mantle (Asthenosphere & Mesosphere, 2,890 km)',
          label: 'Convecting Silicate Mantle (84% Volume)',
          shape: 'sphere',
          dimensions: [2.25],
          position: [0, 0, 0],
          color: '#d97706',
          material: 'glass',
          opacity: 0.45,
          description: 'Peridotite/bridgmanite magnesium-iron silicate shell making up 84% of Earth’s volume, creeping via solid-state thermal convection.',
          whatIsIt: 'Thick hot silicate rock layer between the crust and core.',
          whatDoesItDo: 'Transfers internal planetary heat outward via convection cells that drive plate tectonics.',
          animation: { type: 'spin', axis: 'y', speed: 0.4, amplitude: 0.05 },
        },
        {
          id: 'liquid-iron-outer-core',
          name: 'Liquid Iron–Nickel Outer Core (2,890–5,150 km)',
          label: 'Liquid Fe–Ni Outer Core (Geodynamo)',
          shape: 'sphere',
          dimensions: [1.45],
          position: [0, 0, 0],
          color: '#f97316',
          material: 'glow',
          opacity: 0.65,
          description: 'Turbulent, electrically conducting molten iron-nickel alloy layer (~4,500 °C) where shear modulus μ = 0 (blocking S-waves).',
          whatIsIt: 'Molten metallic ocean surrounding the inner core.',
          whatDoesItDo: 'Convecting liquid iron currents twisted by Earth’s rotation generate the geomagnetic dipole field.',
          animation: { type: 'spin', axis: 'y', speed: 1.4, amplitude: 0.1 },
        },
        {
          id: 'solid-iron-inner-core',
          name: 'Solid Crystalline Iron–Nickel Inner Core (5,150–6,371 km)',
          label: 'Solid Fe–Ni Inner Core (~5,400 °C, 360 GPa)',
          shape: 'sphere',
          dimensions: [0.75],
          position: [0, 0, 0],
          color: '#fef08a',
          material: 'glow',
          description: 'Super-dense (~13.0 g/cm³) solid hexagonal-close-packed iron sphere kept solid despite 5,400 °C temperatures by extreme 360 GPa overburden pressure.',
          whatIsIt: 'Solid metallic heart at the center of the Earth.',
          whatDoesItDo: 'Slowly crystallizes out of the liquid outer core, releasing latent heat that powers the geodynamo.',
          animation: { type: 'pulse', axis: 'y', speed: 2.2, amplitude: 0.08 },
        },
        {
          id: 'mantle-convection-ring',
          name: 'Mantle Thermal Convection Plume Loop',
          label: 'Mantle Convection Plume',
          shape: 'torus',
          dimensions: [1.85, 0.08],
          position: [0, 0, 0],
          color: '#ef4444',
          material: 'glow',
          description: 'Upwelling hot thermal plume rising from the core–mantle boundary (D″ layer) toward the lithosphere.',
          whatIsIt: 'Thermal convection loop inside the mantle.',
          whatDoesItDo: 'Drives seafloor spreading at mid-ocean ridges and hotspot volcanism.',
          animation: { type: 'spin', axis: 'z', speed: 1.2, amplitude: 0.1 },
        },
      ],
      parameters: {
        coreConvectionSpeed: {
          id: 'coreConvectionSpeed',
          name: 'Geodynamo & Mantle Convection Rate',
          min: 0.2,
          max: 3.5,
          step: 0.2,
          defaultValue: 1.4,
          unit: '×',
          description: 'Modulates the rotational and convective speed of the liquid outer core and mantle plumes.',
          affects: 'animationSpeed',
          scaleFactor: 1.0,
        },
        innerCoreRadiusScale: {
          id: 'innerCoreRadiusScale',
          name: 'Inner Core Crystallization Radius',
          min: 0.6,
          max: 1.35,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Simulates secular cooling and growth of the solid inner core over geological eons.',
          affects: 'objectScale',
          targetPartId: 'solid-iron-inner-core',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Concentric Cutaway Transparency',
          type: 'boolean',
          defaultValue: true,
          description: 'Keeps the crust, mantle, and outer core translucent so all four internal shells can be inspected simultaneously.',
        },
      },
      equations: [
        'g(r) = G · M(r) / r² (Interior Gravitational Acceleration Profile)',
        'v_P = √((K + 4/3 μ) / ρ) , v_S = √(μ / ρ) (Seismic Wave Velocities; μ = 0 in Liquid Outer Core)',
      ],
      curiosityPrompts: [
        'Why is Earth’s inner core solid if it is hotter than the surface of the Sun (~5,400 °C)?',
        'How do earthquake S-waves prove that Earth’s outer core is liquid without anyone ever drilling past 12 km?',
        'What would happen to Earth’s atmosphere if the liquid outer core solidified and stopped the geodynamo?',
      ],
    };
  }

  // 9. SYNOVIAL JOINT / KNEE / ELBOW BIOMECHANICS
  if (q.includes('joint') || q.includes('synovial') || q.includes('knee') || q.includes('elbow') || q.includes('ligament') || q.includes('tendon')) {
    return {
      id: 'custom-synovial-joint-biomechanics',
      title: 'Synovial Hinge Joint, Ligaments & Antagonistic Muscle Biomechanics',
      concept: 'Skeletal Articulation, Hyaline Cartilage, Synovial Lubrication & Antagonistic Muscle Leverage',
      description:
        'Interactive 3D anatomical biomechanics model of a diarthrodial synovial hinge joint (knee/elbow) displaying the proximal bone (femur/humerus), distal bone (tibia/ulna), low-friction hyaline articular cartilage pads, fluid-filled synovial joint capsule, collateral/cruciate stabilizing ligaments, and contracting flexor muscle belly with tendon insertion.',
      whatIsIt: 'A freely movable anatomical joint where two bones meet inside a lubricated fluid cavity stabilized by ligaments and moved by muscles.',
      howDoesItWork:
        'Skeletal muscles only pull (never push) by contracting actin-myosin sarcomeres and transmitting tension through inextensible collagen tendons across the joint fulcrum. Articular hyaline cartilage and viscous hyaluronic synovial fluid reduce the friction coefficient to μ ≈ 0.002 (ten times slicker than ice on ice), while ligaments connect bone-to-bone to prevent dislocation.',
      realLifeExample: 'Bending your knee when kicking a football or flexing your elbow to lift a dumbbell.',
      examConnection: 'Ligaments connect Bone to Bone (elastic stability at joints); Tendons connect Muscle to Bone (inelastic force transmission). Cartilage absorbs compressive shock and reduces friction.',
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 1.8, 7.8], target: [0, 0, 0] },
      parts: [
        {
          id: 'proximal-femur-humerus-bone',
          name: 'Proximal Long Bone Shaft & Condyles (Femur / Humerus)',
          label: 'Proximal Bone (Femur / Humerus)',
          shape: 'cylinder',
          dimensions: [0.42, 2.5],
          position: [0, 1.55, 0],
          color: '#f8fafc',
          material: 'bone',
          description: 'Upper cortical long bone ending in rounded articular condyles that form the upper half of the hinge joint.',
          whatIsIt: 'Upper weight-bearing skeletal bone.',
          whatDoesItDo: 'Provides the proximal structural anchor for flexor/extensor muscles and joint articulation.',
        },
        {
          id: 'articular-hyaline-cartilage',
          name: 'Articular Hyaline Cartilage & Meniscus Pad',
          label: 'Hyaline Articular Cartilage',
          shape: 'cylinder',
          dimensions: [0.55, 0.28],
          position: [0, 0.12, 0],
          color: '#38bdf8',
          material: 'plastic',
          description: 'Smooth, avascular collagen-proteoglycan cushion covering the articulating epiphyses of both bones.',
          whatIsIt: 'Shock-absorbing glassy cartilage pad between the bone ends.',
          whatDoesItDo: 'Prevents bone-on-bone grinding and distributes compressive impact loads across a wider area.',
        },
        {
          id: 'synovial-fluid-capsule',
          name: 'Synovial Membrane & Lubricating Fluid Cavity',
          label: 'Synovial Capsule & Fluid',
          shape: 'sphere',
          dimensions: [0.82],
          position: [0, 0.05, 0],
          color: '#fbbf24',
          material: 'glass',
          opacity: 0.42,
          description: 'Fibrous articular capsule lined by the synovial membrane, which secretes egg-white-like hyaluronic synovial fluid.',
          whatIsIt: 'Sealed fluid-filled lubrication pouch enclosing the joint.',
          whatDoesItDo: 'Lubricates the cartilage surfaces and nourishes chondrocytes via diffusion.',
        },
        {
          id: 'distal-tibia-ulna-bone',
          name: 'Distal Long Bone Lever Arm (Tibia / Ulna)',
          label: 'Distal Bone Lever (Tibia / Ulna)',
          shape: 'cylinder',
          dimensions: [0.38, 2.5],
          position: [0, -1.45, 0],
          color: '#f1f5f9',
          material: 'bone',
          description: 'Lower articulating bone acting as a third-class biomechanical lever arm pivoting around the joint axis.',
          whatIsIt: 'Lower articulating long bone.',
          whatDoesItDo: 'Pivots during flexion and extension when pulled by the inserting tendon.',
          animation: { type: 'oscillate', axis: 'z', speed: 2.0, amplitude: 0.35 },
        },
        {
          id: 'collateral-stabilizing-ligament',
          name: 'Collateral & Cruciate Stabilizing Ligaments (Bone-to-Bone)',
          label: 'Stabilizing Ligament (Bone-to-Bone)',
          shape: 'cylinder',
          dimensions: [0.09, 1.55],
          position: [-0.58, 0.05, 0],
          color: '#cbd5e1',
          material: 'tissue',
          description: 'Dense regular connective tissue bands bridging from the upper bone to the lower bone.',
          whatIsIt: 'Tough fibrous strap connecting bone to bone.',
          whatDoesItDo: 'Restricts excessive lateral or hyperextension motion to prevent joint dislocation.',
        },
        {
          id: 'antagonistic-flexor-muscle',
          name: 'Contractile Skeletal Flexor Muscle Belly (Biceps / Hamstring)',
          label: 'Skeletal Flexor Muscle',
          shape: 'capsule',
          dimensions: [0.36, 1.4],
          position: [0.75, 1.35, 0],
          color: '#e11d48',
          material: 'tissue',
          description: 'Striated voluntary skeletal muscle containing actin and myosin myofibrils that shorten using ATP.',
          whatIsIt: 'Active contractile muscle belly.',
          whatDoesItDo: 'Contracts to generate pulling tension that flexes the joint.',
          animation: { type: 'pulse', axis: 'y', speed: 2.0, amplitude: 0.12 },
        },
        {
          id: 'inelastic-insertion-tendon',
          name: 'Collagen Insertion Tendon (Muscle-to-Bone)',
          label: 'Insertion Tendon (Muscle-to-Bone)',
          shape: 'cylinder',
          dimensions: [0.08, 1.2],
          position: [0.55, -0.15, 0],
          rotation: [0, 0, 0.32],
          color: '#fef3c7',
          material: 'tissue',
          description: 'High-tensile-strength collagen cord anchoring the flexor muscle belly onto the distal bone tuberosity.',
          whatIsIt: 'Inelastic fibrous cord connecting muscle to bone.',
          whatDoesItDo: 'Transmits contractile muscle force across the joint fulcrum to rotate the distal bone.',
        },
      ],
      parameters: {
        flexionFrequency: {
          id: 'flexionFrequency',
          name: 'Muscle Contraction & Flexion Rate',
          min: 0.5,
          max: 4.0,
          step: 0.25,
          defaultValue: 2.0,
          unit: 'Hz',
          description: 'Controls the cyclic flexion-extension speed of the joint and muscle contraction.',
          affects: 'animationSpeed',
          scaleFactor: 1.0,
        },
        muscleHypertrophyScale: {
          id: 'muscleHypertrophyScale',
          name: 'Muscle Cross-Sectional Force Area',
          min: 0.75,
          max: 1.45,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Maximum muscle tetanic force scales with physiological cross-sectional area (PCSA).',
          affects: 'objectScale',
          targetPartId: 'antagonistic-flexor-muscle',
          scaleFactor: 1.0,
        },
        jointFlexionOffset: {
          id: 'jointFlexionOffset',
          name: 'Baseline Joint Flexion Angle',
          min: -25,
          max: 35,
          step: 5,
          defaultValue: 0,
          unit: '°',
          description: 'Adjusts the resting angular posture of the distal bone lever.',
          affects: 'objectRotation',
          targetPartId: 'distal-tibia-ulna-bone',
          scaleFactor: 0.015,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Transparent Synovial Capsule',
          type: 'boolean',
          defaultValue: true,
          description: 'Reveals the internal blue hyaline articular cartilage inside the synovial cavity.',
        },
      },
      equations: [
        'τ_muscle = F_tendon · d_⊥ = F_load · d_load (Biomechanical Class-3 Lever Torque Equilibrium)',
        'F_friction = μ · F_normal (Synovial Joint Coefficient of Friction μ ≈ 0.002)',
      ],
      curiosityPrompts: [
        'Why are almost all human joints (like the elbow and knee) Class 3 levers that sacrifice force advantage for speed and range of motion?',
        'What is the structural and functional difference between a ligament and a tendon?',
        'Why does torn articular cartilage heal much more slowly than a broken bone?',
      ],
    };
  }

  // 10. DYNAMIC CHEMICAL FORMULA / VSEPR MOLECULE SYNTHESIZER
  // Detects any explicit chemical formula like NH3, CH4, BF3, PCl5, SF6, SO2, H2S, XeF4, C2H4, etc.
  const formulaMatch = prompt.match(/\b([A-Z][a-z]?)(\d*)([A-Z][a-z]?)(\d*)\b/);
  const isMoleculePrompt =
    q.includes('molecule') ||
    q.includes('vsepr') ||
    q.includes('ammonia') ||
    q.includes('methane') ||
    q.includes('sulfur hexafluoride') ||
    q.includes('phosphorus pentachloride') ||
    q.includes('boron trifluoride') ||
    Boolean(formulaMatch && ELEMENT_DATA[formulaMatch[1]] && ELEMENT_DATA[formulaMatch[3]]);

  if (isMoleculePrompt) {
    let centralSym = 'N';
    let terminalSym = 'H';
    let terminalCount = 3;
    let lonePairs = 1;
    let molName = 'Ammonia (NH₃)';
    let geomName = 'Trigonal Pyramidal (sp³, 107°)';

    if (q.includes('methane') || q.includes('ch4')) {
      centralSym = 'C';
      terminalSym = 'H';
      terminalCount = 4;
      lonePairs = 0;
      molName = 'Methane (CH₄)';
      geomName = 'Tetrahedral (sp³, 109.5°)';
    } else if (q.includes('ammonia') || q.includes('nh3')) {
      centralSym = 'N';
      terminalSym = 'H';
      terminalCount = 3;
      lonePairs = 1;
      molName = 'Ammonia (NH₃)';
      geomName = 'Trigonal Pyramidal (sp³, 107.0°)';
    } else if (q.includes('bf3') || q.includes('boron trifluoride')) {
      centralSym = 'B';
      terminalSym = 'F';
      terminalCount = 3;
      lonePairs = 0;
      molName = 'Boron Trifluoride (BF₃)';
      geomName = 'Trigonal Planar (sp², 120.0°)';
    } else if (q.includes('pcl5') || q.includes('pentachloride')) {
      centralSym = 'P';
      terminalSym = 'Cl';
      terminalCount = 5;
      lonePairs = 0;
      molName = 'Phosphorus Pentachloride (PCl₅)';
      geomName = 'Trigonal Bipyramidal (sp³d, 90° & 120°)';
    } else if (q.includes('sf6') || q.includes('hexafluoride')) {
      centralSym = 'S';
      terminalSym = 'F';
      terminalCount = 6;
      lonePairs = 0;
      molName = 'Sulfur Hexafluoride (SF₆)';
      geomName = 'Octahedral (sp³d², 90° & 180°)';
    } else if (formulaMatch && ELEMENT_DATA[formulaMatch[1]] && ELEMENT_DATA[formulaMatch[3]]) {
      centralSym = formulaMatch[1];
      terminalSym = formulaMatch[3];
      terminalCount = Math.max(1, Math.min(6, Number(formulaMatch[4] || 2)));
      lonePairs = terminalCount <= 2 ? 1 : 0;
      molName = `${centralSym}${formulaMatch[2] || ''}${terminalSym}${terminalCount} Molecule`;
      geomName =
        terminalCount === 2
          ? 'Bent / Angular VSEPR Geometry'
          : terminalCount === 3
            ? 'Trigonal VSEPR Geometry'
            : terminalCount === 4
              ? 'Tetrahedral VSEPR Geometry'
              : terminalCount === 5
                ? 'Trigonal Bipyramidal VSEPR Geometry'
                : 'Octahedral VSEPR Geometry';
    }

    const cElem = ELEMENT_DATA[centralSym] || ELEMENT_DATA.C;
    const tElem = ELEMENT_DATA[terminalSym] || ELEMENT_DATA.H;
    const bondLen = 1.85;

    const parts: ModelPartSpec[] = [
      {
        id: 'central-atom-nucleus',
        name: `Central ${cElem.name} Atom`,
        label: `Central ${centralSym} Atom`,
        shape: 'sphere',
        dimensions: [cElem.radius],
        position: [0, 0, 0],
        color: cElem.color,
        material: 'standard',
        description: `${cElem.role}. Coordinated to ${terminalCount} terminal ${terminalSym} atoms in ${geomName}.`,
        whatIsIt: `Central ${cElem.name} atom of ${molName}.`,
        whatDoesItDo: 'Determines the VSEPR steric number and 3D molecular bond angles.',
        animation: { type: 'pulse', axis: 'y', speed: 2.0, amplitude: 0.05 },
      },
    ];

    // Compute 3D terminal positions based on VSEPR coordination
    const termCoords: [number, number, number][] = [];
    if (terminalCount === 2) {
      const halfAngle = (52.25 * Math.PI) / 180;
      termCoords.push(
        [+(bondLen * Math.sin(halfAngle)).toFixed(2), -(bondLen * Math.cos(halfAngle)).toFixed(2), 0],
        [-(bondLen * Math.sin(halfAngle)).toFixed(2), -(bondLen * Math.cos(halfAngle)).toFixed(2), 0]
      );
    } else if (terminalCount === 3 && lonePairs > 0) {
      // Trigonal pyramidal
      for (let i = 0; i < 3; i++) {
        const phi = (i * 2 * Math.PI) / 3;
        termCoords.push([
          +(bondLen * 0.88 * Math.cos(phi)).toFixed(2),
          -0.65,
          +(bondLen * 0.88 * Math.sin(phi)).toFixed(2),
        ]);
      }
    } else if (terminalCount === 3) {
      // Trigonal planar
      for (let i = 0; i < 3; i++) {
        const phi = (i * 2 * Math.PI) / 3;
        termCoords.push([
          +(bondLen * Math.cos(phi)).toFixed(2),
          0,
          +(bondLen * Math.sin(phi)).toFixed(2),
        ]);
      }
    } else if (terminalCount === 4) {
      // Tetrahedral
      termCoords.push(
        [0, bondLen, 0],
        [+(bondLen * 0.94).toFixed(2), -0.62, 0],
        [-(bondLen * 0.47).toFixed(2), -0.62, +(bondLen * 0.81).toFixed(2)],
        [-(bondLen * 0.47).toFixed(2), -0.62, -(bondLen * 0.81).toFixed(2)]
      );
    } else if (terminalCount === 5) {
      // Trigonal bipyramidal
      termCoords.push([0, bondLen, 0], [0, -bondLen, 0]);
      for (let i = 0; i < 3; i++) {
        const phi = (i * 2 * Math.PI) / 3;
        termCoords.push([
          +(bondLen * Math.cos(phi)).toFixed(2),
          0,
          +(bondLen * Math.sin(phi)).toFixed(2),
        ]);
      }
    } else {
      // Octahedral (6)
      termCoords.push(
        [0, bondLen, 0],
        [0, -bondLen, 0],
        [bondLen, 0, 0],
        [-bondLen, 0, 0],
        [0, 0, bondLen],
        [0, 0, -bondLen]
      );
    }

    termCoords.forEach((pos, idx) => {
      parts.push({
        id: `terminal-atom-${idx + 1}`,
        name: `Terminal ${tElem.name} Atom #${idx + 1}`,
        label: `${terminalSym}${idx + 1}`,
        shape: 'sphere',
        dimensions: [tElem.radius],
        position: pos,
        color: tElem.color,
        material: 'standard',
        description: `Terminal ${tElem.name} atom covalently bonded to the central ${centralSym} atom.`,
        whatIsIt: `${tElem.name} atom at VSEPR vertex #${idx + 1}.`,
        whatDoesItDo: 'Repels adjacent bonding pairs to minimize electrostatic potential energy.',
      });

      parts.push(
        createBondPart(
          `covalent-bond-${idx + 1}`,
          `${centralSym}–${terminalSym} Covalent Bond #${idx + 1}`,
          [0, 0, 0],
          pos,
          0.11,
          '#94a3b8'
        )
      );
    });

    if (lonePairs > 0) {
      parts.push({
        id: 'nonbonding-lone-pair-lobe',
        name: 'Non-Bonding Lone Electron Pair Lobe',
        label: 'Lone Electron Pair (:)',
        shape: 'sphere',
        dimensions: [0.42],
        position: [0, 1.35, 0],
        color: '#facc15',
        material: 'glass',
        opacity: 0.65,
        description: 'Localized non-bonding valence electron pair occupying greater angular volume than bonding pairs (LP–BP > BP–BP repulsion).',
        whatIsIt: 'Unshared valence electron pair on the central atom.',
        whatDoesItDo: 'Compresses the bonding angles below the ideal tetrahedral angle (e.g., 109.5° → 107° in NH₃).',
        animation: { type: 'pulse', axis: 'y', speed: 2.5, amplitude: 0.1 },
      });
    }

    return {
      id: `custom-molecule-${centralSym.toLowerCase()}${terminalSym.toLowerCase()}${terminalCount}`,
      title: `3D VSEPR Molecular Explorer: ${molName}`,
      concept: `Valence Shell Electron Pair Repulsion (VSEPR), ${geomName} & Covalent Bonding`,
      description: `Interactive 3D molecular geometry model of ${molName} demonstrating ${geomName}, CPK atomic radii, localized covalent σ bonds, and electrostatic electron-domain repulsion.`,
      whatIsIt: `A 3D ball-and-stick and orbital representation of ${molName}.`,
      howDoesItWork:
        'According to VSEPR theory, valence electron domains (bonding pairs and non-bonding lone pairs) arrange themselves in 3D space as far apart as possible around the central atom to minimize electrostatic repulsion (LP–LP > LP–BP > BP–BP).',
      realLifeExample: 'Molecular shape determines boiling point, polarity, smell receptor binding, and greenhouse infrared absorption.',
      examConnection: `Steric Number SN = ${terminalCount} bonding pairs + ${lonePairs} lone pairs = ${terminalCount + lonePairs} (${geomName}).`,
      functionalType: 'standard',
      simulationModel: 'predictive',
      prompt,
      camera: { position: [0, 2.8, 6.8], target: [0, 0, 0] },
      parts,
      parameters: {
        vibrationalFrequency: {
          id: 'vibrationalFrequency',
          name: 'Thermal Vibrational Frequency (IR)',
          min: 0.5,
          max: 4.5,
          step: 0.25,
          defaultValue: 2.0,
          unit: 'THz',
          description: 'Modulates the harmonic stretching and bending vibrational speed of the molecule.',
          affects: 'animationSpeed',
          scaleFactor: 1.0,
        },
        centralAtomScale: {
          id: 'centralAtomScale',
          name: 'Van der Waals / CPK Atomic Scale',
          min: 0.7,
          max: 1.6,
          step: 0.05,
          defaultValue: 1.0,
          unit: '×',
          description: 'Transitions the central atom radius between ball-and-stick and space-filling CPK representation.',
          affects: 'objectScale',
          targetPartId: 'central-atom-nucleus',
          scaleFactor: 1.0,
        },
      },
      conditions: {
        internalView: {
          id: 'internalView',
          name: 'Show Electron Lone Pair Lobes',
          type: 'boolean',
          defaultValue: true,
          description: 'Highlights non-bonding valence electron density around the central atom.',
        },
      },
      equations: [
        `Steric Number (SN) = ½ · (V + M − C + A) = ${terminalCount + lonePairs}`,
        'Repulsion Order: Lone Pair–Lone Pair > Lone Pair–Bond Pair > Bond Pair–Bond Pair',
      ],
      curiosityPrompts: [
        `Why does ${molName} adopt a ${geomName} geometry in 3D space?`,
        'Why do lone pairs compress bond angles more strongly than bonding electron pairs?',
        'How do the individual bond dipoles combine in 3D vector addition to determine whether the molecule is polar or nonpolar?',
      ],
    };
  }

  // 11. GENERAL SEMANTIC SCIENTIFIC APPARATUS SYNTHESIZER (OPEN-ENDED PROMPTS)
  // Extracts scientific domain, title, and key concepts from any arbitrary prompt
  const cleanTitle = prompt
    .replace(/^(create|generate|build|make|show|design)\s+(me\s+)?(a\s+|an\s+|the\s+)?(custom\s+)?(interactive\s+)?(3d\s+)?(model|simulation|explorer|diagram)\s+(of\s+|for\s+|showing\s+)?/i, '')
    .trim();
  const formattedTitle =
    cleanTitle.length > 2
      ? cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1)
      : 'Custom 3D Scientific Apparatus';

  const isBio =
    q.includes('cell') ||
    q.includes('organ') ||
    q.includes('tissue') ||
    q.includes('enzyme') ||
    q.includes('protein') ||
    q.includes('plant') ||
    q.includes('leaf') ||
    q.includes('flower') ||
    q.includes('mitochondr') ||
    q.includes('anatomy') ||
    q.includes('biology');

  const isChem =
    q.includes('acid') ||
    q.includes('reaction') ||
    q.includes('bond') ||
    q.includes('crystal') ||
    q.includes('ion') ||
    q.includes('polymer') ||
    q.includes('catalyst') ||
    q.includes('distill') ||
    q.includes('chemistry');

  const subjectDomain = isBio
    ? 'Biology & Physiological Structure'
    : isChem
      ? 'Chemistry & Molecular Systems'
      : 'Physics & Engineering Mechanics';

  const primaryColor = isBio ? '#10b981' : isChem ? '#06b6d4' : '#0284c7';
  const accentColor = isBio ? '#f43f5e' : isChem ? '#f59e0b' : '#38bdf8';

  return {
    id: `custom-ai-${formattedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 36)}-${Date.now().toString(36).slice(-4)}`,
    title: `${formattedTitle} (3D Interactive Model)`,
    concept: `${subjectDomain} · ${formattedTitle}`,
    description: `Custom interactive 3D scientific model of ${formattedTitle}. Explore the labeled structural components, inspect how each subassembly operates, and adjust the real-time parameters to observe dynamic physical and scientific behavior.`,
    whatIsIt: `An interactive 3D multi-component scientific model illustrating the structure and working principles of ${formattedTitle}.`,
    howDoesItWork: `The primary functional core interacts dynamically with the surrounding structural assemblies and energy/flow pathways. Adjusting the primary driving parameter modulates the kinematic rate, while scaling and cutaway controls reveal internal interactions.`,
    realLifeExample: `Used across laboratory experiments, industrial engineering systems, and natural biological/physical processes involving ${formattedTitle}.`,
    examConnection: `Focus on how structure determines function in ${formattedTitle}, and how conservation of energy/mass governs its dynamic response when input parameters change.`,
    functionalType: 'standard',
    simulationModel: 'predictive',
    prompt,
    camera: { position: [0, 3.2, 8.2], target: [0, 0.2, 0] },
    parts: [
      {
        id: 'apparatus-laboratory-base',
        name: `${formattedTitle} Structural Mounting Base`,
        label: 'Structural Base & Frame',
        shape: 'box',
        dimensions: [4.8, 0.35, 3.6],
        position: [0, -1.85, 0],
        color: '#334155',
        material: 'metal',
        description: `Precision reference base supporting the ${formattedTitle} assembly in 3D space.`,
        whatIsIt: 'Primary structural foundation stage.',
        whatDoesItDo: 'Anchors all mechanical and functional subassemblies in alignment.',
      },
      {
        id: 'outer-containment-chamber',
        name: `${formattedTitle} Outer Enclosure / Boundary Shell`,
        label: 'Outer Boundary / Chamber',
        shape: 'cylinder',
        dimensions: [1.55, 2.6],
        position: [0, -0.2, 0],
        color: primaryColor,
        material: 'glass',
        opacity: 0.42,
        description: `Translucent outer boundary housing of ${formattedTitle}, enabling direct visual inspection of internal mechanisms.`,
        whatIsIt: 'Protective outer containment shell.',
        whatDoesItDo: 'Defines the system boundary and isolates internal active components.',
      },
      {
        id: 'primary-active-core',
        name: `${formattedTitle} Primary Functional Core`,
        label: 'Primary Active Core',
        shape: 'sphere',
        dimensions: [0.78],
        position: [0, -0.1, 0],
        color: accentColor,
        material: 'glow',
        description: `Central active hub of ${formattedTitle} where the primary energy conversion or scientific process occurs.`,
        whatIsIt: 'Core operational element of the system.',
        whatDoesItDo: 'Drives the primary physical, chemical, or biological transformation.',
        animation: { type: 'pulse', axis: 'y', speed: 2.2, amplitude: 0.12 },
      },
      {
        id: 'dynamic-rotor-ring',
        name: `${formattedTitle} Dynamic Circulation / Flux Ring`,
        label: 'Dynamic Flux / Circulation Ring',
        shape: 'torus',
        dimensions: [1.15, 0.12],
        position: [0, -0.1, 0],
        rotation: [Math.PI / 3, 0.2, 0],
        color: '#facc15',
        material: 'metal',
        description: `Continuous dynamic pathway illustrating energy transfer, circulation, or field coupling around the core.`,
        whatIsIt: 'Dynamic circulation and coupling loop.',
        whatDoesItDo: 'Visualizes the rate and direction of active system flux as parameters change.',
        animation: { type: 'spin', axis: 'y', speed: 2.0, amplitude: 0.15 },
      },
      {
        id: 'input-conduit-assembly',
        name: 'Primary Input Conduit / Regulator',
        label: 'Input Feed / Regulator',
        shape: 'cylinder',
        dimensions: [0.22, 1.8],
        position: [-1.65, 0.15, 0],
        rotation: [0, 0, Math.PI / 2],
        color: '#38bdf8',
        material: 'metal',
        description: `Input pathway delivering driving energy, signals, or reactants into the ${formattedTitle} core.`,
        whatIsIt: 'Upstream input delivery assembly.',
        whatDoesItDo: 'Regulates the incoming rate of energy or material entering the active zone.',
      },
      {
        id: 'output-collector-assembly',
        name: 'Secondary Output Collector / Sensor',
        label: 'Output Collector / Transducer',
        shape: 'cylinder',
        dimensions: [0.22, 1.8],
        position: [1.65, 0.15, 0],
        rotation: [0, 0, Math.PI / 2],
        color: '#10b981',
        material: 'copper',
        description: `Downstream collector measuring and transmitting the output response of ${formattedTitle}.`,
        whatIsIt: 'Output transducer and delivery channel.',
        whatDoesItDo: 'Extracts useful work, products, or signals from the primary core.',
      },
      {
        id: 'axial-stabilizer-column',
        name: 'Vertical Axial Column & Sensor Head',
        label: 'Axial Control Column',
        shape: 'cylinder',
        dimensions: [0.16, 2.9],
        position: [0, -0.2, 0],
        color: '#cbd5e1',
        material: 'metal',
        description: 'Central vertical axis maintaining concentric alignment between the base, core, and upper sensor.',
        whatIsIt: 'Central alignment shaft.',
        whatDoesItDo: 'Supports rotational and oscillatory kinematics along the vertical axis.',
      },
    ],
    parameters: {
      operatingRate: {
        id: 'operatingRate',
        name: 'Primary Operating Rate / Frequency',
        min: 0.2,
        max: 5.0,
        step: 0.2,
        defaultValue: 2.0,
        unit: 'Hz',
        description: `Controls the active process speed and dynamic circulation frequency in ${formattedTitle}.`,
        affects: 'animationSpeed',
        scaleFactor: 1.0,
      },
      coreAmplitudeScale: {
        id: 'coreAmplitudeScale',
        name: 'Active Core Intensity & Volume',
        min: 0.6,
        max: 1.5,
        step: 0.05,
        defaultValue: 1.0,
        unit: '×',
        description: 'Scales the active core size and interaction magnitude.',
        affects: 'objectScale',
        targetPartId: 'primary-active-core',
        scaleFactor: 1.0,
      },
      fluxOrientationAngle: {
        id: 'fluxOrientationAngle',
        name: 'Coupling Axis Orientation Angle',
        min: -45,
        max: 45,
        step: 5,
        defaultValue: 0,
        unit: '°',
        description: 'Tilts the dynamic flux ring orientation relative to the central axis.',
        affects: 'objectRotation',
        targetPartId: 'dynamic-rotor-ring',
        scaleFactor: 0.017,
      },
    },
    conditions: {
      internalView: {
        id: 'internalView',
        name: 'Internal Cutaway Transparency',
        type: 'boolean',
        defaultValue: true,
        description: 'Makes the outer enclosure translucent to inspect the internal core and flux ring.',
      },
    },
    equations: [
      'P_out = η · P_in (System Energy Conversion & Efficiency Relation)',
      'Φ(t) = Φ₀ · sin(2π · f · t) (Dynamic Harmonic Response)',
    ],
    curiosityPrompts: [
      `How does each component of ${formattedTitle} contribute to its overall scientific function?`,
      `What happens to the system output when the Primary Operating Rate is doubled?`,
      `Where is ${formattedTitle} applied in real-world science and engineering?`,
    ],
  };
}
