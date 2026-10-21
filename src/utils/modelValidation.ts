import {
  ScientificModelSpec,
  ModelPartSpec,
  ModelPartShape,
  ModelMaterialType,
  ModelParameterSpec,
  ModelConditionSpec,
} from '../types/aiModel';

export interface ValidationResult {
  isValid: boolean;
  model: ScientificModelSpec | null;
  warnings: string[];
  errors: string[];
}

const VALID_SHAPES: ModelPartShape[] = [
  'box',
  'cylinder',
  'sphere',
  'cone',
  'torus',
  'ring',
  'capsule',
  'tube',
];

const VALID_MATERIALS: ModelMaterialType[] = [
  'standard',
  'metal',
  'glass',
  'wireframe',
  'glow',
  'copper',
  'rubber',
  'tissue',
];

/**
 * Validates and normalizes raw model specifications.
 * Enforces scientific proportions, stable component IDs, geometry bounds, and camera framing.
 */
export function validateAndSanitizeModelSpec(
  raw: any,
  fallbackPrompt = 'Scientific Model'
): ScientificModelSpec | null {
  if (!raw || typeof raw !== 'object') return null;

  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. Title, Concept, and Metadata
  const title =
    typeof raw.title === 'string' && raw.title.trim()
      ? raw.title.trim()
      : fallbackPrompt.charAt(0).toUpperCase() + fallbackPrompt.slice(1);

  const concept =
    typeof raw.concept === 'string' && raw.concept.trim()
      ? raw.concept.trim()
      : 'Scientific Principles & Mechanics';

  const description =
    typeof raw.description === 'string' && raw.description.trim()
      ? raw.description.trim()
      : `High-fidelity 3D scientific model representing ${title}.`;

  const whatIsIt =
    typeof raw.whatIsIt === 'string' && raw.whatIsIt.trim()
      ? raw.whatIsIt.trim()
      : undefined;

  const howDoesItWork =
    typeof raw.howDoesItWork === 'string' && raw.howDoesItWork.trim()
      ? raw.howDoesItWork.trim()
      : undefined;

  const realLifeExample =
    typeof raw.realLifeExample === 'string' && raw.realLifeExample.trim()
      ? raw.realLifeExample.trim()
      : undefined;

  const examConnection =
    typeof raw.examConnection === 'string' && raw.examConnection.trim()
      ? raw.examConnection.trim()
      : undefined;

  const scaleNote =
    typeof raw.scaleNote === 'string' && raw.scaleNote.trim()
      ? raw.scaleNote.trim()
      : undefined;

  const simulationModel =
    raw.simulationModel === 'predictive' || raw.simulationModel === 'illustrative'
      ? raw.simulationModel
      : undefined;

  const functionalType = [
    'optical-telescope',
    'rutherford-scattering',
    'pendulum-harmonics',
    'dc-motor-assembly',
    'molecular-vibration',
    'cardiac-cycle',
    'dna-helix',
    'standard',
  ].includes(raw.functionalType)
    ? raw.functionalType
    : detectFunctionalType(title, concept, raw.parts);

  // 2. Validate & Sanitize Parts
  if (!Array.isArray(raw.parts) || raw.parts.length < 2) {
    return null;
  }

  const sanitizedParts: ModelPartSpec[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < raw.parts.length; i++) {
    const p = raw.parts[i];
    if (!p || typeof p !== 'object') continue;

    // Stable ID deduplication
    let baseId =
      typeof p.id === 'string' && p.id.trim()
        ? p.id.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-')
        : `part-${i + 1}`;

    let id = baseId;
    let counter = 1;
    while (seenIds.has(id)) {
      counter++;
      id = `${baseId}-${counter}`;
    }
    seenIds.add(id);

    const name =
      typeof p.name === 'string' && p.name.trim()
        ? p.name.trim()
        : `Component ${i + 1}`;

    // Shape validation
    const shape: ModelPartShape = VALID_SHAPES.includes(p.shape)
      ? p.shape
      : 'box';

    // Dimensions validation (minimum bounding safeguards)
    const rawDims = Array.isArray(p.dimensions) ? p.dimensions : [1, 1, 1];
    const dimensions = sanitizeDimensions(shape, rawDims);

    // Position validation (finite numbers bounded in [-25, 25])
    const rawPos = Array.isArray(p.position) ? p.position : [0, 0, 0];
    const position: [number, number, number] = [
      clampCoord(rawPos[0]),
      clampCoord(rawPos[1]),
      clampCoord(rawPos[2]),
    ];

    // Rotation validation
    const rotation: [number, number, number] | undefined = Array.isArray(p.rotation)
      ? [Number(p.rotation[0]) || 0, Number(p.rotation[1]) || 0, Number(p.rotation[2]) || 0]
      : undefined;

    // Scale validation
    const scale: [number, number, number] | undefined = Array.isArray(p.scale)
      ? [
          Math.max(0.01, Math.min(10, Number(p.scale[0]) || 1)),
          Math.max(0.01, Math.min(10, Number(p.scale[1]) || 1)),
          Math.max(0.01, Math.min(10, Number(p.scale[2]) || 1)),
        ]
      : undefined;

    // Material validation & auto-matching
    const material: ModelMaterialType = VALID_MATERIALS.includes(p.material)
      ? p.material
      : inferMaterial(name, p.color, shape);

    // Color validation
    const color = sanitizeColor(p.color, material, name);

    // Opacity
    const opacity =
      typeof p.opacity === 'number'
        ? Math.max(0.05, Math.min(1, p.opacity))
        : material === 'glass'
        ? 0.7
        : 1;

    // Animation validation
    let animation: ModelPartSpec['animation'] = undefined;
    if (p.animation && typeof p.animation === 'object') {
      const type = ['spin', 'oscillate', 'orbit', 'pulse'].includes(p.animation.type)
        ? p.animation.type
        : 'spin';
      const axis = ['x', 'y', 'z'].includes(p.animation.axis)
        ? p.animation.axis
        : 'y';
      const speed =
        typeof p.animation.speed === 'number' && !isNaN(p.animation.speed)
          ? Math.max(0.05, Math.min(15, p.animation.speed))
          : 1.5;
      const amplitude =
        typeof p.animation.amplitude === 'number' && !isNaN(p.animation.amplitude)
          ? Math.max(0.01, Math.min(5, p.animation.amplitude))
          : 0.2;
      animation = { type, axis, speed, amplitude };
    }

    const canonicalDisplayName =
      typeof p.label === 'string' && p.label.trim().length > 0 ? p.label.trim() : name;

    sanitizedParts.push({
      id,
      name: canonicalDisplayName,
      shape,
      dimensions,
      position,
      rotation,
      scale,
      color,
      material,
      opacity,
      label: canonicalDisplayName,
      description: p.description,
      whatIsIt: p.whatIsIt,
      whatDoesItDo: p.whatDoesItDo,
      realLifeExample: p.realLifeExample,
      groupId: p.groupId,
      opticalRole: p.opticalRole,
      animation,
    });
  }

  if (sanitizedParts.length < 2) return null;

  // 3. Post-Process Geometry Alignment by Functional Domain
  alignComponentsByDomain(functionalType, sanitizedParts);

  // 4. Sanitize Parameters
  const sanitizedParams: Record<string, ModelParameterSpec> = {};
  if (raw.parameters && typeof raw.parameters === 'object') {
    Object.entries(raw.parameters).forEach(([k, v]: [string, any]) => {
      if (v && typeof v === 'object') {
        const id = v.id || k;
        const min = typeof v.min === 'number' ? v.min : 0;
        const max = typeof v.max === 'number' && v.max > min ? v.max : min + 10;
        const step = typeof v.step === 'number' && v.step > 0 ? v.step : 1;
        const defaultValue =
          typeof v.defaultValue === 'number' && v.defaultValue >= min && v.defaultValue <= max
            ? v.defaultValue
            : (min + max) / 2;

        sanitizedParams[id] = {
          id,
          name: v.name || id,
          min,
          max,
          step,
          defaultValue,
          unit: v.unit || '',
          description: v.description || '',
          affects: ['animationSpeed', 'objectScale', 'objectRotation', 'objectPosition', 'custom'].includes(
            v.affects
          )
            ? v.affects
            : 'custom',
          targetPartId: seenIds.has(v.targetPartId) ? v.targetPartId : undefined,
          scaleFactor: typeof v.scaleFactor === 'number' ? v.scaleFactor : 1,
        };
      }
    });
  }

  // 5. Sanitize Conditions
  const sanitizedConditions: Record<string, ModelConditionSpec> = {};
  if (raw.conditions && typeof raw.conditions === 'object') {
    Object.entries(raw.conditions).forEach(([k, v]: [string, any]) => {
      if (v && typeof v === 'object') {
        const id = v.id || k;
        sanitizedConditions[id] = {
          id,
          name: v.name || id,
          type: v.type === 'select' ? 'select' : 'boolean',
          defaultValue: typeof v.defaultValue === 'boolean' ? v.defaultValue : true,
          options: Array.isArray(v.options) ? v.options : undefined,
          description: v.description || '',
        };
      }
    });
  }

  // 6. Camera Auto-Framing based on Model Bounding Box
  const camera = calculateOptimalCamera(sanitizedParts, raw.camera);

  return {
    id:
      typeof raw.id === 'string' && raw.id.trim()
        ? raw.id.trim()
        : fallbackPrompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
          `model-${Date.now()}`,
    title,
    concept,
    description,
    whatIsIt,
    howDoesItWork,
    realLifeExample,
    examConnection,
    scaleNote,
    simulationModel,
    functionalType,
    prompt: fallbackPrompt,
    camera,
    parts: sanitizedParts,
    parameters: sanitizedParams,
    conditions: sanitizedConditions,
    equations: Array.isArray(raw.equations) ? raw.equations.filter((e: any) => typeof e === 'string') : undefined,
    curiosityPrompts: Array.isArray(raw.curiosityPrompts)
      ? raw.curiosityPrompts.filter((c: any) => typeof c === 'string')
      : undefined,
  };
}

/**
 * Bounds checking and dimensional ratio sanitizer.
 */
function sanitizeDimensions(shape: ModelPartShape, rawDims: any[]): number[] {
  const nums = rawDims.map((n) => (typeof n === 'number' && !isNaN(n) ? Math.abs(n) : 1));

  switch (shape) {
    case 'box':
      return [
        Math.max(0.05, Math.min(25, nums[0] ?? 1)),
        Math.max(0.05, Math.min(25, nums[1] ?? 1)),
        Math.max(0.05, Math.min(25, nums[2] ?? 1)),
      ];
    case 'cylinder':
      // [radiusTop/radius, height, radiusBottom?]
      return [
        Math.max(0.02, Math.min(15, nums[0] ?? 0.5)),
        Math.max(0.05, Math.min(25, nums[1] ?? 1.5)),
      ];
    case 'sphere':
      // [radius]
      return [Math.max(0.05, Math.min(15, nums[0] ?? 0.8))];
    case 'cone':
      return [
        Math.max(0.02, Math.min(15, nums[0] ?? 0.5)),
        Math.max(0.05, Math.min(25, nums[1] ?? 1.5)),
      ];
    case 'torus':
      // [radius, tubeRadius]
      const r = Math.max(0.1, Math.min(15, nums[0] ?? 1));
      const tube = Math.max(0.01, Math.min(r * 0.4, nums[1] ?? 0.15));
      return [r, tube];
    case 'ring':
      const inner = Math.max(0.05, Math.min(15, nums[0] ?? 0.5));
      const outer = Math.max(inner + 0.05, Math.min(20, nums[1] ?? inner + 0.5));
      return [inner, outer];
    case 'capsule':
      return [
        Math.max(0.02, Math.min(10, nums[0] ?? 0.4)),
        Math.max(0.05, Math.min(20, nums[1] ?? 1.2)),
      ];
    default:
      return [1, 1, 1];
  }
}

function clampCoord(val: any): number {
  if (typeof val !== 'number' || isNaN(val)) return 0;
  return Math.max(-25, Math.min(25, val));
}

function inferMaterial(name: string, color: string, shape: ModelPartShape): ModelMaterialType {
  const n = name.toLowerCase();
  if (n.includes('lens') || n.includes('glass') || n.includes('prism') || n.includes('eyepiece') || n.includes('objective')) {
    return 'glass';
  }
  if (n.includes('wire') || n.includes('coil') || n.includes('copper') || n.includes('commutator')) {
    return 'copper';
  }
  if (n.includes('shaft') || n.includes('axle') || n.includes('bearing') || n.includes('metal') || n.includes('steel') || n.includes('magnet') || n.includes('tube') || n.includes('stand')) {
    return 'metal';
  }
  if (n.includes('rubber') || n.includes('brush') || n.includes('insulator') || n.includes('base') || n.includes('foot')) {
    return 'rubber';
  }
  if (n.includes('cell') || n.includes('membrane') || n.includes('tissue') || n.includes('artery') || n.includes('vein') || n.includes('organelle') || n.includes('heart') || n.includes('lung')) {
    return 'tissue';
  }
  return 'standard';
}

function sanitizeColor(rawColor: any, material: ModelMaterialType, name: string): string {
  if (typeof rawColor === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(rawColor.trim())) {
    return rawColor.trim();
  }
  const n = name.toLowerCase();
  if (n.includes('north') || n.includes('artery') || n.includes('oxygen')) return '#DC2626'; // Red
  if (n.includes('south') || n.includes('vein') || n.includes('nitrogen')) return '#2563EB'; // Blue
  if (n.includes('copper') || n.includes('coil')) return '#B45309'; // Enameled Copper
  if (n.includes('gold') || n.includes('brass')) return '#FACC15'; // Gold
  if (n.includes('glass') || n.includes('lens')) return '#BAE6FD'; // Optical Glass
  if (n.includes('carbon') || n.includes('brush')) return '#0F172A'; // Graphite Carbon
  if (n.includes('screen') || n.includes('phosphor')) return '#10B981'; // ZnS Phosphor Emerald
  if (material === 'metal') return '#94A3B8';
  return '#3B82F6';
}

function detectFunctionalType(title: string, concept: string, parts?: any[]): ScientificModelSpec['functionalType'] {
  const combined = `${title} ${concept}`.toLowerCase();
  if (combined.includes('telescope') || combined.includes('refractor') || combined.includes('astronomical')) {
    return 'optical-telescope';
  }
  if (combined.includes('rutherford') || combined.includes('gold foil') || combined.includes('alpha particle') || combined.includes('scattering')) {
    return 'rutherford-scattering';
  }
  if (combined.includes('pendulum') || combined.includes('oscillator') || combined.includes('harmonic motion')) {
    return 'pendulum-harmonics';
  }
  if (combined.includes('motor') || combined.includes('armature') || combined.includes('lorentz') || combined.includes('dynamo')) {
    return 'dc-motor-assembly';
  }
  if (combined.includes('water') || combined.includes('molecule') || combined.includes('dipole') || combined.includes('h2o')) {
    return 'molecular-vibration';
  }
  if (combined.includes('heart') || combined.includes('cardiac') || combined.includes('ventricle')) {
    return 'cardiac-cycle';
  }
  if (combined.includes('dna') || combined.includes('helix') || combined.includes('nucleotide')) {
    return 'dna-helix';
  }
  return 'standard';
}

/**
 * Domain-specific alignment rules to fix misaligned optical axes or disconnected rotor components.
 */
function alignComponentsByDomain(functionalType: ScientificModelSpec['functionalType'], parts: ModelPartSpec[]) {
  if (functionalType === 'optical-telescope') {
    // Ensure all optical components (tube, objective lens, focuser, eyepiece) share the optical Z-axis (x=0, y=0 or centered y)
    const tube = parts.find((p) => p.name.toLowerCase().includes('tube') || p.name.toLowerCase().includes('barrel'));
    const centerY = tube ? tube.position[1] : 0;
    const centerZ = tube ? tube.position[2] : 0;

    parts.forEach((p) => {
      const n = p.name.toLowerCase();
      if (n.includes('lens') || n.includes('objective') || n.includes('eyepiece') || n.includes('focuser') || n.includes('dew shield')) {
        p.position[0] = 0; // Coaxial on X
        p.position[1] = centerY; // Coaxial on Y
      }
    });
  } else if (functionalType === 'dc-motor-assembly') {
    // Axle, armature coil, and commutator must share rotation axis (Z-axis at [0,0,0])
    parts.forEach((p) => {
      const n = p.name.toLowerCase();
      if (n.includes('axle') || n.includes('shaft') || n.includes('coil') || n.includes('armature') || n.includes('commutator')) {
        p.position[0] = 0;
        p.position[1] = 0;
        p.groupId = 'rotor';
      }
      if (n.includes('magnet') || n.includes('stator') || n.includes('brush') || n.includes('base')) {
        p.groupId = 'stator';
      }
    });
  } else if (functionalType === 'pendulum-harmonics') {
    // Pivot at top, bob suspended at bottom
    const bob = parts.find((p) => p.name.toLowerCase().includes('bob') || p.name.toLowerCase().includes('weight'));
    const pivot = parts.find((p) => p.name.toLowerCase().includes('pivot') || p.name.toLowerCase().includes('bearing'));
    if (bob && pivot && bob.position[1] >= pivot.position[1]) {
      // Bob was placed above pivot, fix vertically
      bob.position[1] = pivot.position[1] - 2.5;
    }
  }
}

/**
 * Calculates optimal camera distance and target to prevent clipping and ensure comfortable viewing.
 */
function calculateOptimalCamera(
  parts: ModelPartSpec[],
  existingCam?: { position?: any[]; target?: any[] }
): { position: [number, number, number]; target: [number, number, number] } {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity,
    minZ = Infinity,
    maxZ = -Infinity;

  parts.forEach((p) => {
    const x = p.position[0];
    const y = p.position[1];
    const z = p.position[2];
    const maxDim = Math.max(...p.dimensions);

    minX = Math.min(minX, x - maxDim);
    maxX = Math.max(maxX, x + maxDim);
    minY = Math.min(minY, y - maxDim);
    maxY = Math.max(maxY, y + maxDim);
    minZ = Math.min(minZ, z - maxDim);
    maxZ = Math.max(maxZ, z + maxDim);
  });

  if (!isFinite(minX)) {
    return {
      position: [0, 4, 8],
      target: [0, 0, 0],
    };
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;

  const dx = maxX - minX;
  const dy = maxY - minY;
  const dz = maxZ - minZ;
  const maxSpan = Math.max(dx, dy, dz, 2);

  const dist = Math.max(6, maxSpan * 1.8);

  // Preserve user-specified angle if valid, but rescale distance
  const target: [number, number, number] = [
    Number(existingCam?.target?.[0]) || cx,
    Number(existingCam?.target?.[1]) || cy,
    Number(existingCam?.target?.[2]) || cz,
  ];

  const pos: [number, number, number] = [
    cx + dist * 0.4,
    cy + dist * 0.45,
    cz + dist * 0.85,
  ];

  return { position: pos, target };
}
