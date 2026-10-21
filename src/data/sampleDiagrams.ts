import { DiagramScanResult } from '../types/diagramScan';

// Helper to convert SVG string to data URL
function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

// 1. DC Electric Motor Diagram SVG
const motorSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" style="background:#ffffff; font-family:system-ui, sans-serif;">
  <rect width="800" height="600" fill="#f8fafc" />
  <rect x="40" y="40" width="720" height="520" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
  
  <text x="70" y="80" font-size="20" font-weight="700" fill="#0f172a">FIG. 4.12 — DIRECT CURRENT (DC) ELECTRIC MOTOR SCHEMATIC</text>
  <text x="70" y="105" font-size="13" fill="#64748b">Physics Textbook Series: Electromagnetism &amp; Lorentz Force</text>

  <!-- Left Magnet (North) -->
  <path d="M 120 220 L 220 220 L 220 380 L 120 380 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="3" />
  <text x="170" y="310" font-size="36" font-weight="900" fill="#ffffff" text-anchor="middle">N</text>
  <text x="170" y="340" font-size="14" font-weight="600" fill="#fecaca" text-anchor="middle">NORTH POLE</text>

  <!-- Right Magnet (South) -->
  <path d="M 580 220 L 680 220 L 680 380 L 580 380 Z" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3" />
  <text x="630" y="310" font-size="36" font-weight="900" fill="#ffffff" text-anchor="middle">S</text>
  <text x="630" y="340" font-size="14" font-weight="600" fill="#bfdbfe" text-anchor="middle">SOUTH POLE</text>

  <!-- Magnetic Field Lines (N to S) -->
  <g stroke="#94a3b8" stroke-width="2" stroke-dasharray="6,4">
    <line x1="225" y1="240" x2="575" y2="240" />
    <line x1="225" y1="280" x2="575" y2="280" />
    <line x1="225" y1="320" x2="575" y2="320" />
    <line x1="225" y1="360" x2="575" y2="360" />
  </g>
  <text x="400" y="235" font-size="12" fill="#64748b" text-anchor="middle">Magnetic Field B (N → S)</text>

  <!-- Rotating Armature Rectangular Coil -->
  <g stroke="#b45309" stroke-width="8" fill="none">
    <path d="M 330 200 L 470 240 L 470 370 L 330 330 Z" stroke="#d97706" />
    <path d="M 340 210 L 460 245 L 460 360 L 340 325 Z" stroke="#f59e0b" stroke-width="4" />
  </g>

  <!-- Axle / Central Shaft -->
  <line x1="400" y1="160" x2="400" y2="460" stroke="#475569" stroke-width="6" stroke-linecap="round" />
  <text x="400" y="150" font-size="13" font-weight="600" fill="#334155" text-anchor="middle">Rotation Axle / Shaft</text>

  <!-- Split-Ring Commutator -->
  <g transform="translate(400, 420)">
    <circle cx="0" cy="0" r="28" fill="none" stroke="#d97706" stroke-width="6" />
    <line x1="0" y1="-28" x2="0" y2="28" stroke="#ffffff" stroke-width="8" />
  </g>

  <!-- Carbon Brushes -->
  <rect x="360" y="412" width="10" height="16" fill="#1e293b" rx="2" />
  <rect x="430" y="412" width="10" height="16" fill="#1e293b" rx="2" />

  <!-- Connecting Wires and DC Battery -->
  <path d="M 360 420 L 280 420 L 280 500 L 370 500" fill="none" stroke="#0284c7" stroke-width="3" />
  <path d="M 440 420 L 520 420 L 520 500 L 430 500" fill="none" stroke="#0284c7" stroke-width="3" />
  
  <!-- Battery Symbol -->
  <line x1="380" y1="490" x2="380" y2="510" stroke="#0f172a" stroke-width="4" />
  <line x1="400" y1="480" x2="400" y2="520" stroke="#0f172a" stroke-width="4" />
  <line x1="410" y1="490" x2="410" y2="510" stroke="#0f172a" stroke-width="4" />
  <line x1="420" y1="480" x2="420" y2="520" stroke="#0f172a" stroke-width="4" />
  <text x="400" y="535" font-size="12" font-weight="600" fill="#0f172a" text-anchor="middle">DC Power Source (Battery)</text>

  <!-- Explicit Diagram Text Labels with Pointer Arrows -->
  <!-- Label: Armature -->
  <g transform="translate(400, 270)">
    <rect x="-65" y="-14" width="130" height="26" rx="6" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.5" />
    <text x="0" y="4" font-size="13" font-weight="700" fill="#92400e" text-anchor="middle">Armature Coil</text>
  </g>

  <!-- Label: Split-Ring Commutator -->
  <g transform="translate(490, 420)">
    <line x1="-30" y1="0" x2="0" y2="0" stroke="#d97706" stroke-width="1.5" />
    <rect x="0" y="-12" width="160" height="24" rx="5" fill="#fff7ed" stroke="#ea580c" stroke-width="1" />
    <text x="80" y="4" font-size="11" font-weight="600" fill="#9a3412" text-anchor="middle">Split-Ring Commutator</text>
  </g>

  <!-- Label: Carbon Brushes -->
  <g transform="translate(230, 420)">
    <line x1="60" y1="0" x2="90" y2="0" stroke="#475569" stroke-width="1.5" />
    <rect x="-40" y="-12" width="100" height="24" rx="5" fill="#f1f5f9" stroke="#64748b" stroke-width="1" />
    <text x="10" y="4" font-size="11" font-weight="600" fill="#334155" text-anchor="middle">Carbon Brushes</text>
  </g>
</svg>
`;

// 2. Human Heart Anatomical Diagram SVG
const heartSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" style="background:#ffffff; font-family:system-ui, sans-serif;">
  <rect width="800" height="600" fill="#f8fafc" />
  <rect x="40" y="40" width="720" height="520" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
  
  <text x="70" y="80" font-size="20" font-weight="700" fill="#0f172a">HUMAN HEART ANATOMICAL DIAGRAM (ANTERIOR VIEW)</text>
  <text x="70" y="105" font-size="13" fill="#64748b">Biology Textbook Series: Cardiovascular Physiology &amp; Dual Circulation</text>

  <!-- Heart Silhouette / Muscle Mass -->
  <path d="M 280 200 C 240 180, 200 240, 220 300 C 240 370, 360 480, 410 490 C 470 470, 580 370, 590 290 C 600 220, 540 170, 480 200 C 440 220, 410 260, 400 280 C 380 250, 330 210, 280 200 Z" fill="#fda4af" stroke="#e11d48" stroke-width="4" />

  <!-- Superior Vena Cava -->
  <path d="M 280 120 L 320 120 L 320 220 L 280 220 Z" fill="#60a5fa" stroke="#2563eb" stroke-width="2" />
  <!-- Aortic Arch -->
  <path d="M 370 120 C 370 80, 470 80, 470 160 L 440 170 C 440 110, 400 110, 400 140 Z" fill="#ef4444" stroke="#dc2626" stroke-width="2" />
  <!-- Pulmonary Artery -->
  <path d="M 340 150 L 380 140 L 430 230 L 390 240 Z" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2" />

  <!-- Septum dividing ventricles -->
  <path d="M 400 280 Q 400 380 410 490" stroke="#be123c" stroke-width="12" fill="none" stroke-linecap="round" />

  <!-- Chambers Interior representation -->
  <!-- Right Ventricle (blue-ish / deox) -->
  <circle cx="330" cy="370" r="50" fill="#93c5fd" opacity="0.6" />
  <!-- Left Ventricle (red / ox, thick muscle) -->
  <circle cx="480" cy="370" r="60" fill="#f87171" opacity="0.6" />

  <!-- Right Atrium -->
  <circle cx="280" cy="270" r="40" fill="#bfdbfe" opacity="0.6" />
  <!-- Left Atrium -->
  <circle cx="510" cy="260" r="40" fill="#fca5a5" opacity="0.6" />

  <!-- Text Labels -->
  <!-- Aorta -->
  <g transform="translate(420, 80)">
    <rect x="-40" y="-12" width="80" height="24" rx="4" fill="#fee2e2" stroke="#ef4444" stroke-width="1.5" />
    <text x="0" y="4" font-size="12" font-weight="700" fill="#991b1b" text-anchor="middle">Aorta</text>
  </g>
  <!-- Right Atrium -->
  <g transform="translate(200, 260)">
    <rect x="-55" y="-12" width="110" height="24" rx="4" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5" />
    <text x="0" y="4" font-size="12" font-weight="700" fill="#1e40af" text-anchor="middle">Right Atrium</text>
  </g>
  <!-- Left Atrium -->
  <g transform="translate(600, 250)">
    <rect x="-55" y="-12" width="110" height="24" rx="4" fill="#fee2e2" stroke="#ef4444" stroke-width="1.5" />
    <text x="0" y="4" font-size="12" font-weight="700" fill="#991b1b" text-anchor="middle">Left Atrium</text>
  </g>
  <!-- Right Ventricle -->
  <g transform="translate(230, 420)">
    <rect x="-60" y="-12" width="120" height="24" rx="4" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5" />
    <text x="0" y="4" font-size="12" font-weight="700" fill="#1e40af" text-anchor="middle">Right Ventricle</text>
  </g>
  <!-- Left Ventricle -->
  <g transform="translate(580, 420)">
    <rect x="-60" y="-12" width="120" height="24" rx="4" fill="#fee2e2" stroke="#ef4444" stroke-width="1.5" />
    <text x="0" y="4" font-size="12" font-weight="700" fill="#991b1b" text-anchor="middle">Left Ventricle</text>
  </g>
  <!-- Septum -->
  <g transform="translate(410, 520)">
    <rect x="-45" y="-12" width="90" height="24" rx="4" fill="#fdf2f8" stroke="#be123c" stroke-width="1.5" />
    <text x="0" y="4" font-size="12" font-weight="700" fill="#831843" text-anchor="middle">Septum</text>
  </g>
</svg>
`;

// 3. Animal Cell Organelles Diagram SVG
const cellSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" style="background:#ffffff; font-family:system-ui, sans-serif;">
  <rect width="800" height="600" fill="#f8fafc" />
  <rect x="40" y="40" width="720" height="520" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
  
  <text x="70" y="80" font-size="20" font-weight="700" fill="#0f172a">EUKARYOTIC ANIMAL CELL ULTRASTRUCTURE</text>
  <text x="70" y="105" font-size="13" fill="#64748b">Biology Textbook Series: Cytology &amp; Subcellular Organelles</text>

  <!-- Cell Membrane / Cytoplasm Outer Boundary -->
  <ellipse cx="400" cy="330" rx="260" ry="190" fill="#eff6ff" stroke="#3b82f6" stroke-width="5" />

  <!-- Nucleus -->
  <ellipse cx="370" cy="330" rx="75" ry="70" fill="#c7d2fe" stroke="#4f46e5" stroke-width="4" />
  <!-- Nucleolus -->
  <circle cx="360" cy="330" r="28" fill="#4338ca" />

  <!-- Mitochondria 1 (Powerhouse) -->
  <ellipse cx="530" cy="270" rx="40" ry="22" fill="#fed7aa" stroke="#ea580c" stroke-width="3" transform="rotate(-20 530 270)" />
  <path d="M 505 270 Q 530 260 555 270" stroke="#c2410c" stroke-width="2" fill="none" />

  <!-- Mitochondria 2 -->
  <ellipse cx="260" cy="390" rx="38" ry="20" fill="#fed7aa" stroke="#ea580c" stroke-width="3" transform="rotate(35 260 390)" />

  <!-- Endoplasmic Reticulum (ribbon waves around nucleus) -->
  <path d="M 260 260 Q 300 230 360 240 Q 420 230 460 250" stroke="#059669" stroke-width="6" fill="none" stroke-linecap="round" />
  <path d="M 280 240 Q 320 215 380 220 Q 430 215 470 230" stroke="#10b981" stroke-width="5" fill="none" stroke-linecap="round" />

  <!-- Golgi Apparatus -->
  <path d="M 480 390 Q 520 400 550 380" stroke="#d97706" stroke-width="6" fill="none" stroke-linecap="round" />
  <path d="M 490 405 Q 530 415 560 395" stroke="#f59e0b" stroke-width="5" fill="none" stroke-linecap="round" />

  <!-- Labels -->
  <!-- Nucleus -->
  <g transform="translate(370, 395)">
    <rect x="-45" y="-12" width="90" height="24" rx="4" fill="#e0e7ff" stroke="#4338ca" stroke-width="1.5" />
    <text x="0" y="4" font-size="12" font-weight="700" fill="#312e81" text-anchor="middle">Nucleus</text>
  </g>
  <!-- Mitochondria -->
  <g transform="translate(630, 260)">
    <rect x="-60" y="-12" width="120" height="24" rx="4" fill="#ffedd5" stroke="#ea580c" stroke-width="1.5" />
    <text x="0" y="4" font-size="12" font-weight="700" fill="#9a3412" text-anchor="middle">Mitochondria</text>
  </g>
  <!-- Cell Membrane -->
  <g transform="translate(640, 420)">
    <rect x="-65" y="-12" width="130" height="24" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5" />
    <text x="0" y="4" font-size="12" font-weight="700" fill="#1e40af" text-anchor="middle">Cell Membrane</text>
  </g>
  <!-- Endoplasmic Reticulum -->
  <g transform="translate(200, 200)">
    <rect x="-55" y="-12" width="110" height="24" rx="4" fill="#d1fae5" stroke="#059669" stroke-width="1.5" />
    <text x="0" y="4" font-size="11" font-weight="700" fill="#065f46" text-anchor="middle">Endoplasmic Ret.</text>
  </g>
  <!-- Golgi Apparatus -->
  <g transform="translate(560, 460)">
    <rect x="-60" y="-12" width="120" height="24" rx="4" fill="#fef3c7" stroke="#d97706" stroke-width="1.5" />
    <text x="0" y="4" font-size="11" font-weight="700" fill="#92400e" text-anchor="middle">Golgi Apparatus</text>
  </g>
</svg>
`;

// 4. Class 1 Lever Diagram SVG
const leverSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" style="background:#ffffff; font-family:system-ui, sans-serif;">
  <rect width="800" height="600" fill="#f8fafc" />
  <rect x="40" y="40" width="720" height="520" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
  
  <text x="70" y="80" font-size="20" font-weight="700" fill="#0f172a">CLASS 1 MECHANICAL LEVER SYSTEM</text>
  <text x="70" y="105" font-size="13" fill="#64748b">Physics Textbook Series: Simple Machines &amp; Torque Equilibrium</text>

  <!-- Ground Line -->
  <line x1="100" y1="440" x2="700" y2="440" stroke="#94a3b8" stroke-width="3" />

  <!-- Fulcrum (Triangle Pivot) at Center (x=400, y=340 to 440) -->
  <polygon points="400,340 350,440 450,440" fill="#38bdf8" stroke="#0284c7" stroke-width="4" />
  <circle cx="400" cy="340" r="7" fill="#0369a1" />

  <!-- Rigid Lever Beam (Tilted slightly) -->
  <g transform="rotate(-6 400 340)">
    <rect x="150" y="328" width="500" height="24" rx="4" fill="#e2e8f0" stroke="#475569" stroke-width="3" />
    
    <!-- Load Block (Left side) -->
    <rect x="180" y="248" width="80" height="80" rx="6" fill="#f43f5e" stroke="#be123c" stroke-width="3" />
    <text x="220" y="295" font-size="16" font-weight="800" fill="#ffffff" text-anchor="middle">LOAD</text>
    
    <!-- Effort Force Arrow (Right side) -->
    <line x1="610" y1="230" x2="610" y2="320" stroke="#10b981" stroke-width="6" marker-end="url(#arrow)" />
    <polygon points="610,326 600,310 620,310" fill="#10b981" />
    <text x="610" y="215" font-size="16" font-weight="800" fill="#047857" text-anchor="middle">EFFORT (F)</text>
  </g>

  <!-- Labels -->
  <!-- Fulcrum -->
  <g transform="translate(400, 480)">
    <rect x="-45" y="-12" width="90" height="24" rx="4" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5" />
    <text x="0" y="4" font-size="12" font-weight="700" fill="#0369a1" text-anchor="middle">Fulcrum</text>
  </g>
  <!-- Load -->
  <g transform="translate(220, 180)">
    <rect x="-40" y="-12" width="80" height="24" rx="4" fill="#ffe4e6" stroke="#f43f5e" stroke-width="1.5" />
    <text x="0" y="4" font-size="12" font-weight="700" fill="#be123c" text-anchor="middle">Load (W)</text>
  </g>
  <!-- Rigid Beam -->
  <g transform="translate(320, 280)">
    <rect x="-45" y="-12" width="90" height="24" rx="4" fill="#f1f5f9" stroke="#64748b" stroke-width="1.5" />
    <text x="0" y="4" font-size="11" font-weight="700" fill="#334155" text-anchor="middle">Lever Beam</text>
  </g>
</svg>
`;

export const SAMPLE_DIAGRAMS: Record<string, DiagramScanResult> = {
  motor: {
    concept: 'DC Electric Motor',
    subject: 'Physics',
    diagramType: 'Electrical Machine Schematic',
    educationalLevel: 'High School / AP Physics',
    confidence: 0.98,
    confidenceLabel: 'Verified match',
    isConfident: true,
    verified3DModelId: 'motor',
    modelTitle: 'DC Electric Motor',
    relationships: [
      'Armature coil is suspended inside the uniform magnetic field created between the North and South magnetic poles.',
      'Split-ring commutator rotates with the axle, reversing current polarity every half rotation via stationary carbon brushes.',
      'Direct current from the DC power source provides continuous unidirectional torque via the Lorentz Force (F = I·L×B).',
    ],
    labels: [
      {
        id: 'armature',
        name: 'Armature Coil',
        componentId: 'armature-coil',
        xPercent: 50.0,
        yPercent: 45.0,
        confidence: 0.99,
        whatIsIt: 'The rotating copper wire coil positioned inside the magnetic field.',
        whatDoesItDo: 'When electric current flows through its windings, magnetic forces push opposite sides in opposite directions, generating rotational torque.',
        realLifeExample: 'The spinning rotor inside battery-powered toy cars, drones, and electric drill tools.',
      },
      {
        id: 'magnet-n',
        name: 'North Pole (N)',
        componentId: 'magnet-north',
        xPercent: 21.0,
        yPercent: 50.0,
        confidence: 0.97,
        whatIsIt: 'The north pole of the stator field magnet.',
        whatDoesItDo: 'Directs magnetic field lines outward across the air gap toward the south pole.',
        realLifeExample: 'The permanent neodymium or ferrite magnets mounted inside a computer cooling fan.',
      },
      {
        id: 'magnet-s',
        name: 'South Pole (S)',
        componentId: 'magnet-south',
        xPercent: 79.0,
        yPercent: 50.0,
        confidence: 0.97,
        whatIsIt: 'The south pole of the stator field magnet.',
        whatDoesItDo: 'Receives magnetic flux lines, establishing a steady magnetic flux density B.',
        realLifeExample: 'Opposing permanent magnets creating the field in automobile wiper motors.',
      },
      {
        id: 'commutator',
        name: 'Commutator (+)',
        componentId: 'commutator-left',
        xPercent: 55.0,
        yPercent: 70.0,
        confidence: 0.94,
        whatIsIt: 'A copper cylinder split into two insulated semicircular halves mounted on the shaft.',
        whatDoesItDo: 'Reverses the direction of electric current in the armature every 180° so rotation continues in a single direction.',
        realLifeExample: 'A mechanical rotary switch that keeps mechanical spin going forward without stalling.',
      },
      {
        id: 'brushes',
        name: 'Left Brush',
        componentId: 'brush-left',
        xPercent: 44.0,
        yPercent: 70.0,
        confidence: 0.92,
        whatIsIt: 'Spring-loaded graphite contact blocks resting against the spinning commutator.',
        whatDoesItDo: 'Conducts direct current from the external battery into the rotating commutator without tangling wires.',
        realLifeExample: 'Replaceable carbon contacts found inside household vacuum cleaners and power saws.',
      },
    ],
    whatIsIt: 'A DC electric motor is an electromechanical device that converts direct current electrical energy into mechanical rotational motion.',
    howDoesItWork: 'Direct current passes through the armature coil inside a magnetic field. Opposite sides of the coil experience opposite Lorentz forces (F = I·L×B), creating a torque couple that spins the rotor.',
    realLifeExample: 'Small motors in battery-operated toys, power tools, electric fans, and car window lifters.',
    whyExplanation: 'The 3D model accurately renders the rectangular armature coil rotating inside the stator magnetic field, complete with split-ring commutation and Lorentz force vectors.',
    examConnection: "Governing Law: Fleming's Left-Hand Rule and Lorentz Force (F = I · L × B). Torque τ = N · I · A · B · sin(θ).",
    imageUrl: svgToDataUrl(motorSvg),
  },

  heart: {
    concept: 'Human Heart Anatomy',
    subject: 'Biology',
    diagramType: 'Anatomical Organ Diagram',
    educationalLevel: 'High School Biology / Physiology',
    confidence: 0.97,
    confidenceLabel: 'Verified match',
    isConfident: true,
    verified3DModelId: 'heart',
    modelTitle: '3D Human Heart Anatomical Visualizer',
    relationships: [
      'Deoxygenated blood returns via the vena cava into the right atrium, passes through the tricuspid valve into the right ventricle, and is pumped into the pulmonary artery toward the lungs.',
      'Oxygenated blood returns from the lungs into the left atrium, flows into the left ventricle, and is pumped systemically via the aorta under high pressure.',
      'The muscular interventricular septum separates oxygenated and deoxygenated blood streams completely.',
    ],
    labels: [
      {
        id: 'left_ventricle',
        name: 'Left Ventricle',
        componentId: 'left_ventricle',
        xPercent: 65.0,
        yPercent: 68.0,
        confidence: 0.98,
        whatIsIt: 'The thickest and most muscular pumping chamber of the heart.',
        whatDoesItDo: 'Pumps oxygen-rich blood through the aortic valve into systemic circulation throughout the entire body.',
        realLifeExample: 'A high-pressure water pump delivering clean water to a multi-story building.',
      },
      {
        id: 'right_ventricle',
        name: 'Right Ventricle',
        componentId: 'right_ventricle',
        xPercent: 35.0,
        yPercent: 68.0,
        confidence: 0.96,
        whatIsIt: 'The lower anterior chamber pumping blood to the pulmonary circuit.',
        whatDoesItDo: 'Contracts to send deoxygenated blood through the pulmonary valve to the lungs for gas exchange.',
        realLifeExample: 'A feeder pump that directs used coolant into a filtration unit.',
      },
      {
        id: 'aorta',
        name: 'Ascending Aorta & Arch',
        componentId: 'aorta',
        xPercent: 52.0,
        yPercent: 15.0,
        confidence: 0.96,
        whatIsIt: 'The largest systemic artery in the human body, arching over the pulmonary trunk.',
        whatDoesItDo: 'Carries oxygen-rich blood under peak systolic pressure (120 mmHg) to all organs and limbs.',
        realLifeExample: 'The main trunk pipeline leaving a municipal water distribution plant.',
      },
      {
        id: 'atria',
        name: 'Right & Left Atria',
        componentId: 'atria',
        xPercent: 51.0,
        yPercent: 86.0,
        confidence: 0.93,
        whatIsIt: 'The upper receiving chambers collecting venous and pulmonary blood.',
        whatDoesItDo: 'Receives systemic venous return on the right and freshly oxygenated blood from the lungs on the left.',
        realLifeExample: 'Dual receiving reservoirs feeding the main pumping chambers.',
      },
    ],
    whatIsIt: 'The human heart is a four-chambered muscular pump located in the mediastinum that maintains dual circulatory blood flow.',
    howDoesItWork: 'Rhythmic contraction (systole) and relaxation (diastole) of cardiac muscle coordinated by the sinoatrial node drives one-way blood flow through 4 heart valves.',
    realLifeExample: 'The heart works like an automated dual-action water pump that continuously circulates liquid through a closed piping network without stopping.',
    whyExplanation: 'Interactive 3D model shows synchronous chamber contractions at adjustable BPM and color-coded oxygenated (red) vs deoxygenated (blue) blood paths.',
    examConnection: 'Double Circulation: Humans have pulmonary (low pressure) and systemic (high pressure) circuits. Left ventricle wall is ~3x thicker than right ventricle due to systemic resistance.',
    imageUrl: svgToDataUrl(heartSvg),
  },

  cell: {
    concept: 'Animal Cell Ultrastructure',
    subject: 'Biology',
    diagramType: 'Subcellular Cytology Diagram',
    educationalLevel: 'Middle School / High School Biology',
    confidence: 0.96,
    confidenceLabel: 'Verified match',
    isConfident: true,
    verified3DModelId: 'cell',
    modelTitle: '3D Animal Cell Organelle Explorer',
    relationships: [
      'The nucleus houses chromatin and sends mRNA instructions to ribosomes on the rough endoplasmic reticulum.',
      'Mitochondria perform aerobic cellular respiration, generating ATP packets to power cellular metabolism.',
      'The Golgi apparatus receives proteins from the ER, sorts them, and dispatches vesicles to the plasma membrane.',
    ],
    labels: [
      {
        id: 'nucleus',
        name: 'Cell Nucleus & Nucleolus',
        componentId: 'nucleus',
        xPercent: 46.0,
        yPercent: 62.0,
        confidence: 0.98,
        whatIsIt: 'The double-membrane bound command center containing the genome.',
        whatDoesItDo: 'Stores DNA chromatin and directs protein synthesis and cell division.',
        realLifeExample: 'The central municipal archive or CEO office directing company operations.',
      },
      {
        id: 'mitochondria',
        name: 'Mitochondrion',
        componentId: 'mitochondria',
        xPercent: 78.0,
        yPercent: 43.0,
        confidence: 0.97,
        whatIsIt: 'Oval double-membraned organelle with folded inner cristae.',
        whatDoesItDo: 'Oxidizes glucose and fatty acids to produce adenosine triphosphate (ATP) via the Krebs cycle and oxidative phosphorylation.',
        realLifeExample: 'A power plant generating electrical energy units for an entire city.',
      },
      {
        id: 'membrane',
        name: 'Plasma Cell Membrane',
        componentId: 'membrane',
        xPercent: 80.0,
        yPercent: 70.0,
        confidence: 0.95,
        whatIsIt: 'A selectively permeable phospholipid bilayer with embedded transport proteins.',
        whatDoesItDo: 'Maintains homeostasis by regulating which ions, nutrients, and waste enter or leave the cytoplasm.',
        realLifeExample: 'A gated border security checkpoint controlling traffic in and out of a facility.',
      },
    ],
    whatIsIt: 'An animal cell is a eukaryotic biological unit lacking a cell wall, containing membrane-bound organelles suspended in aqueous cytosol.',
    howDoesItWork: 'Specialized organelles collaborate to synthesize biomolecules, metabolize nutrients, package waste, and duplicate genetic material.',
    realLifeExample: 'A microscopic factory where distinct departments (power generation, storage, assembly line, packaging) work together under central supervision.',
    whyExplanation: 'The 3D model presents a semi-transparent cutaway view of the cytoplasm, enabling 360° inspection of the spherical nucleus, folded mitochondria cristae, and phospholipid membrane.',
    examConnection: 'Cell Theory: All living organisms are made of cells, and all cells arise from pre-existing cells. Endosymbiotic Theory explains mitochondrial origin.',
    imageUrl: svgToDataUrl(cellSvg),
  },

  lever: {
    concept: 'Class 1 Mechanical Lever',
    subject: 'Physics',
    diagramType: 'Simple Machine Schematic',
    educationalLevel: 'Middle / High School Physics',
    confidence: 0.97,
    confidenceLabel: 'Verified match',
    isConfident: true,
    verified3DModelId: 'lever',
    modelTitle: 'Class 1 Mechanical Lever',
    relationships: [
      'The fulcrum sits between the load point and effort force point.',
      'Mechanical Advantage = Effort Arm Length / Load Arm Length.',
      'Torque equilibrium: Load × Load Arm = Effort × Effort Arm.',
    ],
    labels: [
      {
        id: 'fulcrum',
        name: 'Fulcrum (Pivot)',
        componentId: 'fulcrum',
        xPercent: 50.0,
        yPercent: 78.0,
        confidence: 0.99,
        whatIsIt: 'The fixed pivot point about which the rigid lever beam rotates.',
        whatDoesItDo: 'Provides the reaction support force for the lever arm.',
        realLifeExample: 'The center pivot pin of a pair of scissors or seesaw.',
      },
      {
        id: 'load-cube',
        name: 'Load (Resistance)',
        componentId: 'load-mass',
        xPercent: 28.0,
        yPercent: 32.0,
        confidence: 0.96,
        whatIsIt: 'The mass or resistive force being lifted or moved.',
        whatDoesItDo: 'Exerts a downward gravitational torque (τ = Load × distance).',
        realLifeExample: 'A heavy stone being lifted by a crowbar, or a nail being pried out of wood.',
      },
      {
        id: 'beam',
        name: 'Rigid Beam',
        componentId: 'lever-beam',
        xPercent: 40.0,
        yPercent: 47.0,
        confidence: 0.95,
        whatIsIt: 'The rigid bar capable of pivoting freely about the fulcrum.',
        whatDoesItDo: 'Transfers applied mechanical force across the distance of its arm.',
        realLifeExample: 'The solid steel bar of a crowbar or seesaw plank.',
      },
    ],
    whatIsIt: 'A Class 1 lever is a simple machine featuring a rigid beam resting on a pivot (fulcrum) between the applied effort force and the load force.',
    howDoesItWork: 'Rotational torque equilibrium governs movement: Effort × Effort Arm = Load × Load Arm. When the effort arm is longer than the load arm, smaller input force can lift heavier loads (Mechanical Advantage > 1).',
    realLifeExample: 'Scissors, pliers, crowbars, and playground seesaws all operate as Class 1 levers.',
    whyExplanation: 'The 3D model allows dragging the fulcrum position in real time to observe the changing mechanical advantage and balancing torque.',
    examConnection: 'Law of the Lever: M_A = d_effort / d_load. When d_effort > d_load, force is multiplied; when d_effort < d_load, speed and distance are multiplied.',
    imageUrl: svgToDataUrl(leverSvg),
  },
};
