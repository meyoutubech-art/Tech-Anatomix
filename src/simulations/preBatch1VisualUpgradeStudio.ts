import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ScientificModelSpec, ModelPartSpec } from '../types/aiModel';
import { isAdvancedPhysicsBatch1Model, ADVANCED_PHYSICS_BATCH_1_TYPES } from './physics/advancedPhysicsBatch1Studio';
import { isAdvancedPhysicsBatch2Model, ADVANCED_PHYSICS_BATCH_2_TYPES } from './physics/advancedPhysicsBatch2Studio';
import { isAdvancedPhysicsBatch3Model, ADVANCED_PHYSICS_BATCH_3_TYPES } from './physics/advancedPhysicsBatch3Studio';

/**
 * Complete inventory of all pre-Physics-Batch-1 curated models (Models 1–40 cutoff before Model 41
 * "Electromagnetic Wave Propagation Explorer").
 * Includes all primary model IDs and registry alias keys across:
 * - curatedAiModels.ts (Models 1–10)
 * - curatedModelsBatch2.ts (Models 11–20)
 * - curatedModelsBatch3.ts (Biology Batch 1: Models 21–25)
 * - curatedModelsBatch4.ts (Biology Batch 2: Models 26–30 + Blood Transport)
 * - curatedModelsBatch5.ts (Batch 3 Restoration: Models 31–40 active models)
 */
export const PRE_BATCH_1_CURATED_MODEL_IDS = new Set<string>([
  // Base Curated Models (Models 1–10 & alias keys)
  'motor',
  'dc-motor',
  'optics',
  'convex-lens',
  'optical-telescope',
  'cradle',
  'newtons-cradle',
  'newtonsCradle',
  'crystal',
  'nacl-lattice',
  'crystal-lattice',
  'galvanic',
  'galvanic-cell',
  'bonding',
  'chemical-bonding',
  'bonding-explorer',
  'acidBase',
  'acid-base-neutralization',
  'concaveMirror',
  'concave-mirror',
  'prismDispersion',
  'prism-dispersion',
  'circuit',
  'electric-circuit',
  'rutherford',
  'rutherford-scattering',
  'rutherford-gold-foil',
  'pendulum-harmonics',
  'bar-magnet-field',
  'hydraulicLift',
  'hydraulic-lift',

  // Batch 2 Hidden Registry (Models 11–20)
  'friction-explorer',
  'wave-motion',
  'sound-wave',
  'magnetic-field-explorer',
  'interactive-atom',
  'bohr-atom',
  'water-molecule-explorer',
  'carbon-dioxide-explorer',
  'water-electrolysis',

  // Biology Batch 1 (Models 21–25)
  'heart-explorer',
  'respiratory-explorer',
  'digestive-system',
  'brain-explorer',
  'eye-vision',
  'human-eye-vision',
  'dna-helix',
  'dna-helix-explorer',

  // Biology Batch 2 (Models 26–30 + Blood Transport)
  'plant-cell-explorer',
  'animal-cell-explorer',
  'plant-root-transport',
  'blood-circulation-microscope',
  'neuron-nerve-signal',
  'blood-transport',
  'nephron-filtrate',
  'reflex-arc-synapse',
  'leaf-photosynthesis',

  // Batch 3 / Batch 5 Restoration (Models 31–40 active set)
  'ac-generator',
  'acGenerator',
  'electromagnetic-induction',
  'inductionExplorer',
  'heat-transfer-explorer',
  'heatTransferExplorer',
  'four-stroke-engine',
  'fourStrokeEngine',
  'electric-bell',
  'electricBell',
  'hydroelectric-power',
  'hydroelectricPower',
  'motor-effect-fleming',
  'motorEffectFleming',
]);

/**
 * Inventory of all pre-existing standalone 3D scenes across Physics, Chemistry, Biology & Anatomy pages.
 */
export const PRE_BATCH_1_STANDALONE_SCENES = [
  'ProjectileScene',
  'PendulumScene',
  'CircuitScene',
  'ChemistryLabScene',
  'MolecularScene',
  'CellScene',
  'DnaScene',
  'HeartScene',
  'HumanAnatomyExplorer',
  'FrogNeckDissectionScene',
  'FrogAnatomyExplorer',
] as const;

/**
 * Strict preservation set: Models 41+ (Physics Batch 1 and Physics Batch 2).
 * These models must NEVER be altered by the pre-Batch-1 upgrade pipeline.
 */
export const PRESERVED_POST_BATCH_1_MODEL_IDS = new Set<string>([
  ...Array.from(ADVANCED_PHYSICS_BATCH_1_TYPES),
  ...Array.from(ADVANCED_PHYSICS_BATCH_2_TYPES),
  ...Array.from(ADVANCED_PHYSICS_BATCH_3_TYPES),
]);

/**
 * Determines whether a model belongs to the pre-Physics-Batch-1 target set.
 * Returns false for any model in Physics Batch 1 (Models 41–47), Batch 2 (Models 48–54), or Batch 3 (Models 55–61).
 */
export function isPreBatch1Model(functionalType?: string, id?: string): boolean {
  if (isAdvancedPhysicsBatch1Model(functionalType, id)) return false;
  if (isAdvancedPhysicsBatch2Model(functionalType, id)) return false;
  if (isAdvancedPhysicsBatch3Model(functionalType, id)) return false;
  return true;
}

/**
 * Generates the cohesive multi-shade scientific studio backdrop texture established in Physics Batch 1:
 * - Deep teal (#134249)
 * - Midnight blue and blue-grey (#0f2438, #163847)
 * - Muted forest green (#123832)
 * - Deep slate-teal base (#0e292d)
 * - Soft, restrained central radial highlight and upper-left studio softbox glow
 * Never pure black (#000000) or a single flat colour.
 */
export function createPreBatch1MultiShadeStudioBackdropTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Vertical multi-stop studio gradient (Midnight Blue-Grey -> Slate Teal -> Deep Teal -> Muted Forest Green)
  const linear = ctx.createLinearGradient(0, 0, 0, 1024);
  linear.addColorStop(0.0, '#0f2438'); // Midnight blue-grey zenith
  linear.addColorStop(0.28, '#163847'); // Blue-grey / slate teal upper transition
  linear.addColorStop(0.55, '#134249'); // Deep teal central studio zone
  linear.addColorStop(0.8, '#123832'); // Muted forest green lower horizon
  linear.addColorStop(1.0, '#0e292d'); // Deep slate-teal base
  ctx.fillStyle = linear;
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. Diagonal secondary atmospheric blend (Slate Teal & Blue-Grey)
  const diag = ctx.createLinearGradient(0, 0, 1024, 1024);
  diag.addColorStop(0.0, 'rgba(27, 53, 72, 0.32)');
  diag.addColorStop(0.5, 'rgba(26, 70, 78, 0.18)');
  diag.addColorStop(1.0, 'rgba(17, 54, 46, 0.30)');
  ctx.fillStyle = diag;
  ctx.fillRect(0, 0, 1024, 1024);

  // 3. Soft, restrained central atmospheric studio highlight to reveal 3D silhouette
  const radialCenter = ctx.createRadialGradient(512, 460, 40, 512, 460, 540);
  radialCenter.addColorStop(0.0, 'rgba(62, 138, 142, 0.34)');
  radialCenter.addColorStop(0.45, 'rgba(34, 92, 98, 0.18)');
  radialCenter.addColorStop(1.0, 'rgba(14, 38, 46, 0.0)');
  ctx.fillStyle = radialCenter;
  ctx.fillRect(0, 0, 1024, 1024);

  // 4. Subtle upper-left studio softbox glow
  const softbox = ctx.createRadialGradient(260, 220, 20, 260, 220, 440);
  softbox.addColorStop(0.0, 'rgba(148, 210, 219, 0.14)');
  softbox.addColorStop(1.0, 'rgba(148, 210, 219, 0.0)');
  ctx.fillStyle = softbox;
  ctx.fillRect(0, 0, 1024, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export interface PreBatch1StudioEnvironmentOptions {
  includeStagePlatform?: boolean;
  includeGroundStage?: boolean;
  stageRadius?: number;
  fogDensity?: number;
  exposure?: number;
}

export interface PreBatch1StudioEnvironmentHandle {
  stageGroup: THREE.Group | null;
  dispose: () => void;
}

/**
 * Configures the multi-shade scientific studio environment, tone mapping, PMREM reflections,
 * hemisphere/rim lighting, and precision studio stage platform for pre-Physics-Batch-1 models and scenes.
 */
export function setupPreBatch1StudioEnvironment(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  minYOrOptions: number | PreBatch1StudioEnvironmentOptions = -2.2,
  options: PreBatch1StudioEnvironmentOptions = {}
): PreBatch1StudioEnvironmentHandle {
  const resolvedMinY = typeof minYOrOptions === 'number' ? minYOrOptions : -2.2;
  const mergedOptions = typeof minYOrOptions === 'object' ? { ...minYOrOptions, ...options } : options;
  const {
    includeStagePlatform = mergedOptions.includeGroundStage !== undefined ? mergedOptions.includeGroundStage : true,
    stageRadius = 5.2,
    fogDensity = 0.016,
    exposure = 1.08,
  } = mergedOptions;
  const minY = resolvedMinY;

  // Modern renderer color pipeline & ACES Filmic tone mapping
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;

  const backdropTexture = createPreBatch1MultiShadeStudioBackdropTexture();
  if (backdropTexture) {
    scene.background = backdropTexture;
  } else {
    scene.background = new THREE.Color(0x133e46);
  }

  // Subtle atmospheric depth fog matching the slate-teal mid-tone
  if (fogDensity > 0) {
    scene.fog = new THREE.FogExp2(0x133b42, fogDensity);
  }

  // Studio PMREM reflection environment for realistic pearl, satin silver, glass, and metallic materials
  let envRenderTarget: THREE.WebGLRenderTarget | null = null;
  try {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    envRenderTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRenderTarget.texture;
    pmremGenerator.dispose();
  } catch {
    // Fallback if headless/software WebGL context does not support PMREM
  }

  // Multi-directional scientific studio lighting rig
  const hemiLight = new THREE.HemisphereLight(0xe2f1f8, 0x10332e, 0.72);
  hemiLight.position.set(0, 12, 0);
  scene.add(hemiLight);

  const rimBackLight = new THREE.DirectionalLight(0x99f6e4, 0.55);
  rimBackLight.position.set(-6, 5, -9);
  scene.add(rimBackLight);

  let stageGroup: THREE.Group | null = null;
  if (includeStagePlatform) {
    stageGroup = new THREE.Group();
    stageGroup.position.set(0, minY - 0.04, 0);
    scene.add(stageGroup);

    // Main bevelled slate-teal / charcoal studio disc
    const discGeo = new THREE.CylinderGeometry(stageRadius, stageRadius * 1.058, 0.08, 64);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x15373d,
      roughness: 0.42,
      metalness: 0.28,
    });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    discMesh.receiveShadow = true;
    discMesh.position.y = -0.04;
    stageGroup.add(discMesh);

    // Satin silver-graphite outer trim ring
    const outerRingGeo = new THREE.TorusGeometry(stageRadius + 0.02, 0.035, 16, 96);
    const outerRingMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.25,
      metalness: 0.78,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = Math.PI / 2;
    outerRing.position.y = 0.0;
    stageGroup.add(outerRing);

    // Inner calibration ring
    const innerRingGeo = new THREE.RingGeometry(stageRadius * 0.5, stageRadius * 0.506, 64);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x5eead4,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.01;
    stageGroup.add(innerRing);
  }

  return {
    stageGroup,
    dispose: () => {
      if (backdropTexture) backdropTexture.dispose();
      if (envRenderTarget) envRenderTarget.dispose();
    },
  };
}

/**
 * Harmonizes any THREE.GridHelper so its lines sit cleanly against the deep-teal / midnight-slate studio floor
 * without harsh light-mode white lines.
 */
export function styleStudioGridHelper(grid: THREE.GridHelper): void {
  const mat = grid.material;
  if (Array.isArray(mat)) {
    mat.forEach((m, idx) => {
      if ('color' in m) {
        (m as THREE.LineBasicMaterial).color.setHex(idx === 0 ? 0x38bdf8 : 0x1e4e58);
      }
      m.transparent = true;
      m.opacity = idx === 0 ? 0.38 : 0.28;
    });
  } else if (mat) {
    if ('color' in mat) {
      (mat as THREE.LineBasicMaterial).color.setHex(0x2dd4bf);
    }
    mat.transparent = true;
    mat.opacity = 0.30;
  }
}

/**
 * Computes a studio-readable Three.js color for pre-Batch-1 model parts without mutating `part.color`.
 * Prevents dark slate/black components (#0f172a, #1e293b, #334155) from blending into the dark studio backdrop.
 */
export function resolveStudioReadableColor(part: ModelPartSpec): THREE.Color {
  const rawHex = (part.color || '#cbd5e1').trim();
  const baseColor = new THREE.Color(rawHex);
  const hsl = { h: 0, s: 0, l: 0 };
  baseColor.getHSL(hsl);

  // Lift excessively dark structural/neutral colors so silhouettes read crisply against the studio backdrop
  if (hsl.l < 0.26) {
    const isStructuralOrMetal =
      part.material === 'metal' ||
      part.material === 'standard' ||
      part.material === 'rubber' ||
      !part.material;
    if (isStructuralOrMetal) {
      // Shift near-black / dark-slate to satin titanium / pearl gunmetal while preserving subtle hue tint
      const targetLightness = Math.max(0.46, hsl.l + 0.32);
      const targetSat = Math.min(0.28, hsl.s);
      baseColor.setHSL(hsl.h, targetSat, targetLightness);
    }
  }
  return baseColor;
}

/**
 * Synthesizes high-craft PBR materials for pre-Physics-Batch-1 models on the shared studio stage.
 */
export function createPreBatch1UpgradedMaterial(
  part: ModelPartSpec,
  isSelected: boolean
): THREE.Material {
  const baseColor = resolveStudioReadableColor(part);
  const emissiveColor = isSelected
    ? new THREE.Color('#38bdf8')
    : part.material === 'glow'
    ? baseColor.clone()
    : new THREE.Color(0x000000);
  const emissiveIntensity = isSelected ? 0.85 : part.material === 'glow' ? 0.85 : 0;

  switch (part.material) {
    case 'glass':
      return new THREE.MeshPhysicalMaterial({
        color: baseColor,
        transmission: 0.92,
        transparent: true,
        opacity: part.opacity ?? 0.78,
        roughness: 0.05,
        ior: 1.52,
        thickness: 0.8,
        reflectivity: 0.65,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        emissive: isSelected ? new THREE.Color('#38bdf8') : new THREE.Color(0x000000),
        emissiveIntensity: isSelected ? 0.55 : 0,
      });

    case 'liquid':
      return new THREE.MeshPhysicalMaterial({
        color: baseColor,
        transmission: 0.86,
        transparent: true,
        opacity: part.opacity ?? 0.85,
        roughness: 0.06,
        ior: 1.333,
        thickness: 0.6,
        reflectivity: 0.5,
        clearcoat: 0.9,
        clearcoatRoughness: 0.08,
        emissive: isSelected ? new THREE.Color('#38bdf8') : new THREE.Color(0x000000),
        emissiveIntensity: isSelected ? 0.55 : 0,
      });

    case 'copper':
      return new THREE.MeshPhysicalMaterial({
        color: part.color ? baseColor : new THREE.Color('#d97736'),
        metalness: 0.88,
        roughness: 0.20,
        clearcoat: 0.35,
        clearcoatRoughness: 0.2,
        emissive: emissiveColor,
        emissiveIntensity,
      });

    case 'metal':
      return new THREE.MeshPhysicalMaterial({
        color: baseColor,
        metalness: 0.85,
        roughness: 0.20,
        clearcoat: 0.30,
        clearcoatRoughness: 0.22,
        emissive: emissiveColor,
        emissiveIntensity,
      });

    case 'bone':
      return new THREE.MeshPhysicalMaterial({
        color: baseColor,
        metalness: 0.05,
        roughness: 0.42,
        clearcoat: 0.22,
        clearcoatRoughness: 0.35,
        emissive: emissiveColor,
        emissiveIntensity,
      });

    case 'rubber':
      return new THREE.MeshStandardMaterial({
        color: baseColor,
        metalness: 0.12,
        roughness: 0.62,
        emissive: emissiveColor,
        emissiveIntensity,
      });

    case 'tissue':
      return new THREE.MeshPhysicalMaterial({
        color: baseColor,
        metalness: 0.04,
        roughness: 0.45,
        clearcoat: 0.32,
        clearcoatRoughness: 0.28,
        emissive: emissiveColor,
        emissiveIntensity,
      });

    case 'wireframe':
      return new THREE.MeshBasicMaterial({
        color: baseColor,
        wireframe: true,
      });

    case 'glow':
      return new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: isSelected ? new THREE.Color('#38bdf8') : baseColor,
        emissiveIntensity: isSelected ? 0.95 : 0.85,
        roughness: 0.16,
        metalness: 0.1,
      });

    default:
      return new THREE.MeshPhysicalMaterial({
        color: baseColor,
        roughness: 0.30,
        metalness: 0.18,
        clearcoat: 0.24,
        clearcoatRoughness: 0.28,
        emissive: emissiveColor,
        emissiveIntensity,
      });
  }
}

/**
 * Builds higher-resolution smooth BufferGeometry for pre-Physics-Batch-1 model parts.
 */
export function createPreBatch1UpgradedGeometry(part: ModelPartSpec): THREE.BufferGeometry {
  const dims = part.dimensions || [1, 1, 1];
  switch (part.shape) {
    case 'box':
      return new THREE.BoxGeometry(dims[0] || 1, dims[1] || 1, dims[2] || 1, 2, 2, 2);
    case 'cylinder': {
      const isPrism =
        part.id.includes('prism') || (part.name && part.name.toLowerCase().includes('prism'));
      const radSegments = isPrism ? 3 : 44;
      return new THREE.CylinderGeometry(dims[0] || 0.5, dims[0] || 0.5, dims[1] || 1, radSegments);
    }
    case 'sphere':
      return new THREE.SphereGeometry(dims[0] || 0.5, 48, 48);
    case 'cone':
      return new THREE.ConeGeometry(dims[0] || 0.5, dims[1] || 1, 40);
    case 'torus':
      return new THREE.TorusGeometry(dims[0] || 1, dims[1] || 0.2, 24, 64);
    case 'ring':
      return new THREE.RingGeometry(dims[0] || 0.8, dims[1] || 1.2, 48);
    case 'capsule':
      return new THREE.CapsuleGeometry(dims[0] || 0.4, dims[1] || 1.0, 24, 36);
    default:
      return new THREE.BoxGeometry(dims[0] || 1, dims[1] || 1, dims[2] || 1);
  }
}

/**
 * Enriches pre-Physics-Batch-1 models with composite multi-part precision detailing
 * (bevelled mounting trim, machined shaft collars, optical housing rims, electrode collars,
 * and glassware lip beads) attached directly to the parent part meshes in `meshMap`.
 * Because children are parented to each part mesh and tagged with `partSpec`, all animations,
 * exploded views, internal views, raycasting, and #38bdf8 selection highlighting work automatically.
 */
export function enhancePreBatch1ModelAssemblies(
  modelSpec: ScientificModelSpec,
  meshMap: Map<string, THREE.Object3D>,
  interactiveMeshes: THREE.Object3D[]
): void {
  if (!isPreBatch1Model(modelSpec.functionalType, modelSpec.id)) return;

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.86,
    roughness: 0.22,
  });

  const brassAccentMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    metalness: 0.88,
    roughness: 0.20,
  });

  const glassRimMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe,
    transmission: 0.85,
    transparent: true,
    opacity: 0.82,
    roughness: 0.08,
    metalness: 0.1,
    ior: 1.52,
  });

  modelSpec.parts.forEach((part) => {
    const parentObj = meshMap.get(part.id);
    if (!parentObj || !(parentObj instanceof THREE.Mesh)) return;

    const dims = part.dimensions || [1, 1, 1];
    const pid = part.id.toLowerCase();

    // 1. Structural Base Plates / Platforms / Backboards: add precision bevelled metallic frame trim
    if (
      part.shape === 'box' &&
      (pid.includes('base') ||
        pid.includes('board') ||
        pid.includes('platform') ||
        pid.includes('bench') ||
        pid.includes('track') ||
        pid.includes('stand')) &&
      dims[0] >= 2.0 &&
      dims[1] <= 0.8
    ) {
      const w = dims[0];
      const h = dims[1];
      const d = dims[2] || 1;
      const plinthGeo = new THREE.BoxGeometry(w * 1.02, Math.max(0.04, h * 0.22), d * 1.02);
      const plinth = new THREE.Mesh(plinthGeo, trimMat.clone());
      plinth.position.set(0, -h * 0.42, 0);
      plinth.userData = { partSpec: part, isStudioDetail: true };
      parentObj.add(plinth);
      interactiveMeshes.push(plinth);
      return;
    }

    // 2. Cylindrical Shafts, Axles, Electrodes, Rods & Conductors: add machined end-collars
    const isPrism = pid.includes('prism') || (part.name && part.name.toLowerCase().includes('prism'));
    if (
      part.shape === 'cylinder' &&
      !isPrism &&
      part.material !== 'glow' &&
      part.material !== 'liquid' &&
      dims[0] >= 0.05 &&
      dims[0] <= 0.45 &&
      dims[1] >= 0.6
    ) {
      const r = dims[0];
      const len = dims[1];
      const collarMat =
        part.material === 'copper' || pid.includes('terminal') || pid.includes('anode') || pid.includes('cathode')
          ? brassAccentMat.clone()
          : trimMat.clone();

      [-1, 1].forEach((endSign) => {
        const collarGeo = new THREE.TorusGeometry(r * 1.08, Math.max(0.012, r * 0.14), 12, 32);
        const collar = new THREE.Mesh(collarGeo, collarMat);
        collar.rotation.x = Math.PI / 2;
        collar.position.set(0, endSign * (len * 0.42), 0);
        collar.userData = { partSpec: part, isStudioDetail: true };
        parentObj.add(collar);
        interactiveMeshes.push(collar);
      });
      return;
    }

    // 3. Glassware Vessels, Beakers, Flasks, Lenses & Mirrors: add precision optical/borosilicate rim ring
    if (
      part.shape === 'cylinder' &&
      !isPrism &&
      part.material === 'glass' &&
      dims[0] >= 0.35
    ) {
      const r = dims[0];
      const len = dims[1] || 1;
      const rimGeo = new THREE.TorusGeometry(r, Math.max(0.02, r * 0.045), 16, 48);
      const rimMesh = new THREE.Mesh(rimGeo, glassRimMat.clone());
      rimMesh.rotation.x = Math.PI / 2;
      rimMesh.position.set(0, len * 0.5, 0);
      rimMesh.userData = { partSpec: part, isStudioDetail: true };
      parentObj.add(rimMesh);
      interactiveMeshes.push(rimMesh);
    }
  });
}
