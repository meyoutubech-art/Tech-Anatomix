import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ScientificModelSpec, ModelPartSpec } from '../../types/aiModel';
import {
  calculateEmWaveMetrics,
  calculatePlasmaMetrics,
  calculateAcceleratorMetrics,
  calculateMaglevMetrics,
  calculateSuperconductorMetrics,
  calculateBlackHoleLensingMetrics,
  calculateQuantumTunnellingMetrics,
} from './advancedPhysicsBatch1Engine';

export const ADVANCED_PHYSICS_BATCH_1_TYPES = new Set<string>([
  'electromagnetic-wave-propagation',
  'plasma-physics-explorer',
  'particle-accelerator-explorer',
  'magnetic-levitation-explorer',
  'superconductivity-meissner-explorer',
  'black-hole-gravitational-lensing',
  'quantum-tunnelling-explorer',
]);

export function isAdvancedPhysicsBatch1Model(functionalType?: string, id?: string): boolean {
  return (
    (Boolean(functionalType) && ADVANCED_PHYSICS_BATCH_1_TYPES.has(functionalType!)) ||
    (Boolean(id) && ADVANCED_PHYSICS_BATCH_1_TYPES.has(id!))
  );
}

/**
 * Generates a cohesive multi-shade scientific studio backdrop texture blending:
 * - Deep teal (#0d3b42)
 * - Midnight blue and blue-grey (#0d2236, #1b3548)
 * - Muted forest green (#11362e)
 * - Slate teal (#1a464e)
 * - Soft, restrained atmospheric highlights
 * Never pure black or a single flat dark colour.
 */
function createMultiShadeStudioBackdropTexture(): THREE.CanvasTexture | null {
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

export interface Batch1StudioEnvironmentHandle {
  stageGroup: THREE.Group;
  dispose: () => void;
}

/**
 * Configures the scoped multi-shade scientific studio environment for Batch 1 Models 1–7.
 */
export function setupBatch1StudioEnvironment(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  minY: number
): Batch1StudioEnvironmentHandle {
  const backdropTexture = createMultiShadeStudioBackdropTexture();
  if (backdropTexture) {
    scene.background = backdropTexture;
  } else {
    scene.background = new THREE.Color(0x133e46);
  }

  // Subtle atmospheric depth fog matching the slate-teal mid-tone
  scene.fog = new THREE.FogExp2(0x133b42, 0.018);

  // Studio PMREM reflection environment for realistic pearl, satin silver, and graphite materials
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

  // Restrained, precision scientific studio platform beneath the model
  const stageGroup = new THREE.Group();
  stageGroup.position.set(0, minY - 0.04, 0);
  scene.add(stageGroup);

  // Main bevelled slate-teal / charcoal studio disc
  const discGeo = new THREE.CylinderGeometry(5.2, 5.5, 0.08, 64);
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
  const outerRingGeo = new THREE.TorusGeometry(5.22, 0.035, 16, 96);
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
  const innerRingGeo = new THREE.RingGeometry(2.6, 2.63, 64);
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

  return {
    stageGroup,
    dispose: () => {
      if (backdropTexture) backdropTexture.dispose();
      if (envRenderTarget) envRenderTarget.dispose();
    },
  };
}

export interface Batch1SceneHandles {
  rootGroup: THREE.Group;
  // Model 1: EM Wave
  emVectorArrowsE: THREE.Group[];
  emVectorArrowsB: THREE.Group[];
  emWaveLineE: THREE.Line | null;
  emWaveLineB: THREE.Line | null;
  emCaliperGroup: THREE.Group | null;
  // Model 2: Plasma
  plasmaIons: { group: THREE.Group; baseX: number; phase: number; pitch: number }[];
  plasmaElectrons: { mesh: THREE.Mesh; trail: THREE.Line; baseX: number; phase: number; radialOffset: number }[];
  plasmaBFieldLines: THREE.Group | null;
  plasmaEFieldGroup: THREE.Group | null;
  plasmaDebyeGroup: THREE.Group | null;
  // Model 3: Accelerator
  accBunches: THREE.Mesh[];
  accBeamCurveLine: THREE.Line | null;
  accRfArrows: THREE.Group[];
  accDetectorSpot: THREE.Mesh | null;
  // Model 4: Maglev
  maglevFluxLoops: THREE.Mesh[];
  maglevCaliperBar: THREE.Mesh | null;
  // Model 5: Superconductor
  scFieldLines: THREE.Line[];
  scCurrentRings: THREE.Mesh[];
  scVapourRings: THREE.Mesh[];
  // Model 6: Black Hole
  bhAccretionRings: THREE.Mesh[];
  bhGeodesicLines: THREE.Line[];
  bhSpacetimeGrid: THREE.LineSegments | null;
  bhEinsteinArcs: THREE.Group | null;
  // Model 7: Quantum Tunnelling
  qtWaveLineI: THREE.Line | null;
  qtWaveLineII: THREE.Line | null;
  qtWaveLineIII: THREE.Line | null;
  qtProbDensityLine: THREE.Line | null;
  qtPhaseBarsI: THREE.Mesh[];
  qtPhaseBarsII: THREE.Mesh[];
  qtPhaseBarsIII: THREE.Mesh[];
}

function tagInteractiveHierarchy(obj: THREE.Object3D, partSpec: ModelPartSpec | undefined, interactiveMeshes: THREE.Object3D[]) {
  if (!partSpec) return;
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.userData = { ...child.userData, partSpec };
      interactiveMeshes.push(child);
    }
  });
}

function makeOpaqueProxyInvisible(mesh: THREE.Object3D | undefined) {
  if (!mesh) return;
  mesh.traverse((c) => {
    if (c instanceof THREE.Mesh) {
      c.material = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
      });
    }
  });
}

/**
 * Builds composite, multi-part 3D assemblies for all 7 Advanced Physics Batch 1 models.
 */
export function buildBatch1CustomAssemblies(
  modelSpec: ScientificModelSpec,
  modelRoot: THREE.Group,
  meshMap: Map<string, THREE.Object3D>,
  interactiveMeshes: THREE.Object3D[]
): Batch1SceneHandles {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'batch1-custom-studio-assemblies';
  modelRoot.add(rootGroup);

  const handles: Batch1SceneHandles = {
    rootGroup,
    emVectorArrowsE: [],
    emVectorArrowsB: [],
    emWaveLineE: null,
    emWaveLineB: null,
    emCaliperGroup: null,
    plasmaIons: [],
    plasmaElectrons: [],
    plasmaBFieldLines: null,
    plasmaEFieldGroup: null,
    plasmaDebyeGroup: null,
    accBunches: [],
    accBeamCurveLine: null,
    accRfArrows: [],
    accDetectorSpot: null,
    maglevFluxLoops: [],
    maglevCaliperBar: null,
    scFieldLines: [],
    scCurrentRings: [],
    scVapourRings: [],
    bhAccretionRings: [],
    bhGeodesicLines: [],
    bhSpacetimeGrid: null,
    bhEinsteinArcs: null,
    qtWaveLineI: null,
    qtWaveLineII: null,
    qtWaveLineIII: null,
    qtProbDensityLine: null,
    qtPhaseBarsI: [],
    qtPhaseBarsII: [],
    qtPhaseBarsIII: [],
  };

  // Shared premium scientific materials
  const pearlWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.12 });
  const softOffWhiteMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.18 });
  const satinSilverMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.22, metalness: 0.82 });
  const lightGraphiteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.35, metalness: 0.65 });
  const charcoalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.42, metalness: 0.55 });
  const satinCopperMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.26, metalness: 0.85 });
  const tealAccentMat = new THREE.MeshStandardMaterial({
    color: 0x2dd4bf,
    roughness: 0.22,
    metalness: 0.2,
    emissive: 0x0d9488,
    emissiveIntensity: 0.35,
  });
  const skyBlueAccentMat = new THREE.MeshStandardMaterial({
    color: 0x60a5fa,
    roughness: 0.22,
    metalness: 0.2,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.32,
  });
  const emeraldAccentMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    roughness: 0.24,
    metalness: 0.2,
    emissive: 0x059669,
    emissiveIntensity: 0.3,
  });
  const amberAccentMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.26,
    metalness: 0.25,
    emissive: 0xb45309,
    emissiveIntensity: 0.28,
  });

  const findPart = (id: string) => modelSpec.parts.find((p) => p.id === id);

  // =========================================================================
  // MODEL 1: ELECTROMAGNETIC WAVE PROPAGATION EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'electromagnetic-wave-propagation') {
    makeOpaqueProxyInvisible(meshMap.get('electric-field-wave'));
    makeOpaqueProxyInvisible(meshMap.get('magnetic-field-wave'));
    makeOpaqueProxyInvisible(meshMap.get('wavelength-span-marker'));

    // 1. Coaxial Dipole Transmitter Assembly at x = -3.95
    const emitterGroup = new THREE.Group();
    emitterGroup.position.set(-3.95, 0, 0);
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.55, 24), charcoalMat);
    housing.rotation.z = Math.PI / 2;
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 24), satinSilverMat);
    flange.rotation.z = Math.PI / 2;
    flange.position.x = 0.25;
    const insulator = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.22, 20), pearlWhiteMat);
    insulator.rotation.z = Math.PI / 2;
    insulator.position.x = 0.36;
    const dipoleRodUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.15, 16), satinSilverMat);
    dipoleRodUpper.position.set(0.36, 0.65, 0);
    const dipoleRodLower = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.15, 16), satinSilverMat);
    dipoleRodLower.position.set(0.36, -0.65, 0);
    const tipCapUpper = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), pearlWhiteMat);
    tipCapUpper.position.set(0.36, 1.24, 0);
    const tipCapLower = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), pearlWhiteMat);
    tipCapLower.position.set(0.36, -1.24, 0);
    emitterGroup.add(housing, flange, insulator, dipoleRodUpper, dipoleRodLower, tipCapUpper, tipCapLower);
    tagInteractiveHierarchy(emitterGroup, findPart('propagation-axis'), interactiveMeshes);
    rootGroup.add(emitterGroup);

    // Calibration collars along propagation axis
    for (let x = -3.2; x <= 3.6; x += 0.85) {
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 8, 20), charcoalMat);
      collar.rotation.y = Math.PI / 2;
      collar.position.set(x, 0, 0);
      rootGroup.add(collar);
    }

    // 2. 28 Discrete Electric Field (E_y) and Magnetic Field (B_z) Vector Arrows
    const numVectors = 28;
    const shaftGeo = new THREE.CylinderGeometry(0.022, 0.022, 1.0, 12);
    shaftGeo.translate(0, 0.5, 0);
    const headGeo = new THREE.ConeGeometry(0.065, 0.18, 14);
    headGeo.translate(0, 0.09, 0);

    const eSpec = findPart('electric-field-wave');
    const bSpec = findPart('magnetic-field-wave');

    for (let i = 0; i < numVectors; i++) {
      const x = -3.4 + (i / (numVectors - 1)) * 7.2;

      // E_y vertical vector group
      const eVec = new THREE.Group();
      eVec.position.set(x, 0, 0);
      const eShaft = new THREE.Mesh(shaftGeo, tealAccentMat);
      eShaft.name = 'shaft';
      const eHead = new THREE.Mesh(headGeo, tealAccentMat);
      eHead.name = 'head';
      eVec.add(eShaft, eHead);
      tagInteractiveHierarchy(eVec, eSpec, interactiveMeshes);
      rootGroup.add(eVec);
      handles.emVectorArrowsE.push(eVec);

      // B_z horizontal vector group
      const bVec = new THREE.Group();
      bVec.position.set(x, 0, 0);
      const bShaft = new THREE.Mesh(shaftGeo, skyBlueAccentMat);
      bShaft.name = 'shaft';
      const bHead = new THREE.Mesh(headGeo, skyBlueAccentMat);
      bHead.name = 'head';
      bVec.add(bShaft, bHead);
      tagInteractiveHierarchy(bVec, bSpec, interactiveMeshes);
      rootGroup.add(bVec);
      handles.emVectorArrowsB.push(bVec);
    }

    // 3. Continuous 96-point sinusoidal E and B envelope curves
    const numWavePts = 96;
    const ePts = new Float32Array(numWavePts * 3);
    const bPts = new Float32Array(numWavePts * 3);
    const eGeo = new THREE.BufferGeometry();
    const bGeo = new THREE.BufferGeometry();
    eGeo.setAttribute('position', new THREE.BufferAttribute(ePts, 3));
    bGeo.setAttribute('position', new THREE.BufferAttribute(bPts, 3));

    handles.emWaveLineE = new THREE.Line(
      eGeo,
      new THREE.LineBasicMaterial({ color: 0x5eead4, linewidth: 2 })
    );
    handles.emWaveLineB = new THREE.Line(
      bGeo,
      new THREE.LineBasicMaterial({ color: 0x93c5fd, linewidth: 2 })
    );
    rootGroup.add(handles.emWaveLineE, handles.emWaveLineB);

    // 4. Precision Wavelength Caliper Assembly (λ)
    const caliperGroup = new THREE.Group();
    caliperGroup.position.set(-0.5, 1.55, 0);
    const crossBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 2.0, 16), pearlWhiteMat);
    crossBeam.rotation.z = Math.PI / 2;
    crossBeam.name = 'caliper-beam';
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 12), satinSilverMat);
    leftLeg.position.set(-1.0, -0.2, 0);
    leftLeg.name = 'caliper-left';
    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 12), satinSilverMat);
    rightLeg.position.set(1.0, -0.2, 0);
    rightLeg.name = 'caliper-right';
    caliperGroup.add(crossBeam, leftLeg, rightLeg);
    tagInteractiveHierarchy(caliperGroup, findPart('wavelength-span-marker'), interactiveMeshes);
    rootGroup.add(caliperGroup);
    handles.emCaliperGroup = caliperGroup;

    // Register 3D groups into meshMap for Model 1 label selection and highlighting
    if (findPart('propagation-axis')) meshMap.set('propagation-axis', emitterGroup);
    if (findPart('wavelength-span-marker')) meshMap.set('wavelength-span-marker', caliperGroup);
    const eFieldWaveGroup = new THREE.Group();
    handles.emVectorArrowsE.forEach((g) => eFieldWaveGroup.add(g));
    if (handles.emWaveLineE) eFieldWaveGroup.add(handles.emWaveLineE);
    tagInteractiveHierarchy(eFieldWaveGroup, findPart('electric-field-wave'), interactiveMeshes);
    if (findPart('electric-field-wave')) meshMap.set('electric-field-wave', eFieldWaveGroup);

    const bFieldWaveGroup = new THREE.Group();
    handles.emVectorArrowsB.forEach((g) => bFieldWaveGroup.add(g));
    if (handles.emWaveLineB) bFieldWaveGroup.add(handles.emWaveLineB);
    tagInteractiveHierarchy(bFieldWaveGroup, findPart('magnetic-field-wave'), interactiveMeshes);
    if (findPart('magnetic-field-wave')) meshMap.set('magnetic-field-wave', bFieldWaveGroup);
  }

  // =========================================================================
  // MODEL 2: PLASMA PHYSICS EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'plasma-physics-explorer') {
    makeOpaqueProxyInvisible(meshMap.get('positive-ion-species'));
    makeOpaqueProxyInvisible(meshMap.get('free-electron-species'));
    makeOpaqueProxyInvisible(meshMap.get('magnetic-field-flux-line'));
    makeOpaqueProxyInvisible(meshMap.get('electric-field-vector'));

    const chamberSpec = findPart('plasma-confinement-chamber');
    const ionSpec = findPart('positive-ion-species');
    const elecSpec = findPart('free-electron-species');
    const bSpec = findPart('magnetic-field-flux-line');
    const eSpec = findPart('electric-field-vector');
    const debyeSpec = findPart('debye-shielding-sphere');

    // 1. Vacuum Chamber End Flanges, Cradle Base & 4 External Solenoid Coils
    const vesselHardware = new THREE.Group();
    for (const endX of [-2.8, 2.8]) {
      const endFlange = new THREE.Mesh(new THREE.CylinderGeometry(1.58, 1.58, 0.18, 36), satinSilverMat);
      endFlange.rotation.z = Math.PI / 2;
      endFlange.position.set(endX, 0, 0);
      const portRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 14, 32), charcoalMat);
      portRing.rotation.y = Math.PI / 2;
      portRing.position.set(endX + (endX > 0 ? 0.1 : -0.1), 0, 0);
      vesselHardware.add(endFlange, portRing);
    }

    // 4 External Magnetic Confinement Solenoid Coils
    for (const coilX of [-2.0, -0.7, 0.7, 2.0]) {
      const coilYoke = new THREE.Mesh(new THREE.TorusGeometry(1.54, 0.14, 16, 40), charcoalMat);
      coilYoke.rotation.y = Math.PI / 2;
      coilYoke.position.set(coilX, 0, 0);
      const copperWinding = new THREE.Mesh(new THREE.TorusGeometry(1.57, 0.09, 14, 40), satinCopperMat);
      copperWinding.rotation.y = Math.PI / 2;
      copperWinding.position.set(coilX, 0, 0);
      vesselHardware.add(coilYoke, copperWinding);
    }

    // Pearl/graphite laboratory cradle base beneath chamber
    const basePlate = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.18, 2.3), charcoalMat);
    basePlate.position.set(0, -1.68, 0);
    vesselHardware.add(basePlate);
    tagInteractiveHierarchy(vesselHardware, chamberSpec, interactiveMeshes);
    rootGroup.add(vesselHardware);
    if (chamberSpec) meshMap.set('plasma-confinement-chamber', vesselHardware);

    // 2. Multi-strand Axial Magnetic Field Lines (B)
    const bGroup = new THREE.Group();
    const bOffsets: [number, number][] = [
      [0, 0],
      [0, 0.65],
      [0, -0.65],
      [0.65, 0],
      [-0.65, 0],
    ];
    bOffsets.forEach(([oy, oz]) => {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 5.4, 12), tealAccentMat);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(0, oy, oz);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.18, 12), tealAccentMat);
      cone.rotation.z = -Math.PI / 2;
      cone.position.set(2.7, oy, oz);
      bGroup.add(tube, cone);
    });
    tagInteractiveHierarchy(bGroup, bSpec, interactiveMeshes);
    rootGroup.add(bGroup);
    handles.plasmaBFieldLines = bGroup;
    if (bSpec) meshMap.set('magnetic-field-flux-line', bGroup);

    // 3. Internal Transverse Electric Field Electrodes & Vectors (E)
    const eGroup = new THREE.Group();
    const topPlate = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.05, 1.2), pearlWhiteMat);
    topPlate.position.set(0, 1.18, 0);
    const botPlate = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.05, 1.2), softOffWhiteMat);
    botPlate.position.set(0, -1.18, 0);
    eGroup.add(topPlate, botPlate);
    for (const ex of [-1.6, 0, 1.6]) {
      const eShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 10), pearlWhiteMat);
      eShaft.position.set(ex, 0, -0.45);
      const eTip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 12), pearlWhiteMat);
      eTip.position.set(ex, 0.8, -0.45);
      eGroup.add(eShaft, eTip);
    }
    tagInteractiveHierarchy(eGroup, eSpec, interactiveMeshes);
    rootGroup.add(eGroup);
    handles.plasmaEFieldGroup = eGroup;
    if (eSpec) meshMap.set('electric-field-vector', eGroup);

    // 4. Debye Shielding Sphere Wireframe Rings (λ_D)
    const debyeGroup = new THREE.Group();
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.014, 10, 36), emeraldAccentMat);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.014, 10, 36), emeraldAccentMat);
    ring2.rotation.y = Math.PI / 2;
    debyeGroup.add(ring1, ring2);
    tagInteractiveHierarchy(debyeGroup, debyeSpec, interactiveMeshes);
    rootGroup.add(debyeGroup);
    handles.plasmaDebyeGroup = debyeGroup;
    if (debyeSpec) meshMap.set('debye-shielding-sphere', debyeGroup);

    // 5. Ensemble of 14 Positive Ions (+e, larger warm amber spheres with core+halo)
    const ionAssemblyGroup = new THREE.Group();
    const ionCoreGeo = new THREE.SphereGeometry(0.11, 20, 20);
    const ionHaloGeo = new THREE.SphereGeometry(0.16, 16, 16);
    const ionHaloMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    for (let i = 0; i < 14; i++) {
      const ig = new THREE.Group();
      const core = new THREE.Mesh(ionCoreGeo, amberAccentMat);
      const halo = new THREE.Mesh(ionHaloGeo, ionHaloMat);
      ig.add(core, halo);
      tagInteractiveHierarchy(ig, ionSpec, interactiveMeshes);
      ionAssemblyGroup.add(ig);
      handles.plasmaIons.push({
        group: ig,
        baseX: -2.2 + (i / 13) * 4.4,
        phase: (i * 1.37) % (Math.PI * 2),
        pitch: (i % 2 === 0 ? 1 : -1) * 0.45,
      });
    }
    tagInteractiveHierarchy(ionAssemblyGroup, ionSpec, interactiveMeshes);
    rootGroup.add(ionAssemblyGroup);
    if (ionSpec) meshMap.set('positive-ion-species', ionAssemblyGroup);

    // 6. Ensemble of 22 Free Electrons (-e, smaller mint-teal spheres with helical trails)
    const electronAssemblyGroup = new THREE.Group();
    const elecGeo = new THREE.SphereGeometry(0.06, 16, 16);
    for (let i = 0; i < 22; i++) {
      const em = new THREE.Mesh(elecGeo, tealAccentMat);
      tagInteractiveHierarchy(em, elecSpec, interactiveMeshes);
      electronAssemblyGroup.add(em);

      const trailPts = new Float32Array(24 * 3);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPts, 3));
      const trailLine = new THREE.Line(
        trailGeo,
        new THREE.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.55 })
      );
      electronAssemblyGroup.add(trailLine);

      handles.plasmaElectrons.push({
        mesh: em,
        trail: trailLine,
        baseX: -2.3 + (i / 21) * 4.6,
        phase: (i * 0.95) % (Math.PI * 2),
        radialOffset: ((i % 3) - 1) * 0.38,
      });
    }
    tagInteractiveHierarchy(electronAssemblyGroup, elecSpec, interactiveMeshes);
    rootGroup.add(electronAssemblyGroup);
    if (elecSpec) meshMap.set('free-electron-species', electronAssemblyGroup);
  }

  // =========================================================================
  // MODEL 3: PARTICLE ACCELERATOR EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'particle-accelerator-explorer') {
    makeOpaqueProxyInvisible(meshMap.get('ion-source-injector'));
    makeOpaqueProxyInvisible(meshMap.get('rf-acceleration-cavity'));
    makeOpaqueProxyInvisible(meshMap.get('dipole-bending-magnet'));
    makeOpaqueProxyInvisible(meshMap.get('charged-particle-beam'));
    makeOpaqueProxyInvisible(meshMap.get('focal-detector-screen'));

    const injSpec = findPart('ion-source-injector');
    const rfSpec = findPart('rf-acceleration-cavity');
    const quadSpec = findPart('vacuum-beam-pipe');
    const dipoleSpec = findPart('dipole-bending-magnet');
    const beamSpec = findPart('charged-particle-beam');
    const detSpec = findPart('focal-detector-screen');

    // 1. High-Voltage Ion Source Injector Assembly (x = -3.4)
    const injGroup = new THREE.Group();
    injGroup.position.set(-3.4, 0, 0);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.46, 24, 24), pearlWhiteMat);
    dome.position.x = -0.35;
    const hvStack = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const shed = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.06, 24), softOffWhiteMat);
      shed.rotation.z = Math.PI / 2;
      shed.position.x = -0.1 + i * 0.16;
      hvStack.add(shed);
    }
    const injFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.1, 24), satinSilverMat);
    injFlange.rotation.z = Math.PI / 2;
    injFlange.position.x = 0.52;
    const injStand = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.35, 16), charcoalMat);
    injStand.position.set(-0.1, -0.85, 0);
    injGroup.add(dome, hvStack, injFlange, injStand);
    tagInteractiveHierarchy(injGroup, injSpec, interactiveMeshes);
    rootGroup.add(injGroup);
    if (injSpec) meshMap.set('ion-source-injector', injGroup);

    // 2. 5-Cell Elliptical Copper RF Acceleration Cavity (x = -1.75)
    const rfGroup = new THREE.Group();
    rfGroup.position.set(-1.75, 0, 0);
    for (let c = -2; c <= 2; c++) {
      const cell = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.14, 16, 32), satinCopperMat);
      cell.rotation.y = Math.PI / 2;
      cell.position.x = c * 0.26;
      rfGroup.add(cell);
    }
    const rfEndL = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.09, 28), satinSilverMat);
    rfEndL.rotation.z = Math.PI / 2;
    rfEndL.position.x = -0.72;
    const rfEndR = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.09, 28), satinSilverMat);
    rfEndR.rotation.z = Math.PI / 2;
    rfEndR.position.x = 0.72;
    const rfCoupler = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.55, 16), pearlWhiteMat);
    rfCoupler.position.set(0, 0.58, 0);
    const rfStand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.5), charcoalMat);
    rfStand.position.set(0, -0.95, 0);
    rfGroup.add(rfEndL, rfEndR, rfCoupler, rfStand);

    // Axial E_acc arrows inside RF cavity
    for (let a = -1; a <= 1; a++) {
      const arr = new THREE.Group();
      arr.position.set(-1.75 + a * 0.36, 0.68, 0);
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.24, 10), tealAccentMat);
      sh.rotation.z = Math.PI / 2;
      const hd = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.14, 12), tealAccentMat);
      hd.rotation.z = -Math.PI / 2;
      hd.position.x = 0.15;
      arr.add(sh, hd);
      rootGroup.add(arr);
      handles.accRfArrows.push(arr);
    }
    tagInteractiveHierarchy(rfGroup, rfSpec, interactiveMeshes);
    rootGroup.add(rfGroup);
    if (rfSpec) meshMap.set('rf-acceleration-cavity', rfGroup);

    // 3. Quadrupole Focusing Doublet on UHV Beam Pipe (x = -0.45)
    const quadGroup = new THREE.Group();
    for (const qx of [-0.65, -0.2]) {
      const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.08, 12, 24), lightGraphiteMat);
      yoke.rotation.y = Math.PI / 2;
      yoke.position.set(qx, 0, 0);
      quadGroup.add(yoke);
    }
    tagInteractiveHierarchy(quadGroup, quadSpec, interactiveMeshes);
    rootGroup.add(quadGroup);
    if (quadSpec) meshMap.set('vacuum-beam-pipe', quadGroup);

    // 4. Sector C-Core Dipole Bending Electromagnet (x = 1.05)
    const dipoleGroup = new THREE.Group();
    dipoleGroup.position.set(1.05, 0, 0);
    const topYoke = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.32, 1.45), charcoalMat);
    topYoke.position.y = 0.56;
    const botYoke = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.32, 1.45), charcoalMat);
    botYoke.position.y = -0.56;
    const backLeg = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.44, 0.34), charcoalMat);
    backLeg.position.z = -0.68;
    const topCoil = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.16, 1.15), satinCopperMat);
    topCoil.position.y = 0.34;
    const botCoil = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.16, 1.15), satinCopperMat);
    botCoil.position.y = -0.34;
    const dipolePedestal = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.85, 1.1), lightGraphiteMat);
    dipolePedestal.position.y = -1.1;
    dipoleGroup.add(topYoke, botYoke, backLeg, topCoil, botCoil, dipolePedestal);

    // Vertical magnetic field arrows inside dipole gap
    for (const bx of [-0.35, 0, 0.35]) {
      for (const bz of [-0.2, 0.2]) {
        const bLine = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.52, 8), skyBlueAccentMat);
        bLine.position.set(bx, 0, bz);
        dipoleGroup.add(bLine);
      }
    }
    tagInteractiveHierarchy(dipoleGroup, dipoleSpec, interactiveMeshes);
    rootGroup.add(dipoleGroup);
    if (dipoleSpec) meshMap.set('dipole-bending-magnet', dipoleGroup);

    // 5. Continuous Particle Beam Trajectory Line & 10 Animated Bunch Spheres
    const beamAssemblyGroup = new THREE.Group();
    const beamPts = new Float32Array(60 * 3);
    const beamGeo = new THREE.BufferGeometry();
    beamGeo.setAttribute('position', new THREE.BufferAttribute(beamPts, 3));
    handles.accBeamCurveLine = new THREE.Line(
      beamGeo,
      new THREE.LineBasicMaterial({ color: 0x2dd4bf, linewidth: 2 })
    );
    beamAssemblyGroup.add(handles.accBeamCurveLine);

    const bunchGeo = new THREE.SphereGeometry(0.09, 16, 16);
    for (let i = 0; i < 10; i++) {
      const bMesh = new THREE.Mesh(bunchGeo, tealAccentMat);
      tagInteractiveHierarchy(bMesh, beamSpec, interactiveMeshes);
      beamAssemblyGroup.add(bMesh);
      handles.accBunches.push(bMesh);
    }
    tagInteractiveHierarchy(beamAssemblyGroup, beamSpec, interactiveMeshes);
    rootGroup.add(beamAssemblyGroup);
    if (beamSpec) meshMap.set('charged-particle-beam', beamAssemblyGroup);

    // 6. Focal-Plane Detector Array & Active Scintillation Spot
    const detGroup = new THREE.Group();
    detGroup.position.set(3.2, 0, 0.45);
    const detFrame = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.35, 1.95), charcoalMat);
    const detScreen = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.15, 1.75), pearlWhiteMat);
    detScreen.position.x = -0.11;
    const detSpot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 18), emeraldAccentMat);
    detSpot.position.set(-0.14, 0, 0);
    handles.accDetectorSpot = detSpot;
    detGroup.add(detFrame, detScreen, detSpot);
    tagInteractiveHierarchy(detGroup, detSpec, interactiveMeshes);
    rootGroup.add(detGroup);
    if (detSpec) meshMap.set('focal-detector-screen', detGroup);
  }

  // =========================================================================
  // MODEL 4: MAGNETIC LEVITATION MECHANISM EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'magnetic-levitation-explorer') {
    makeOpaqueProxyInvisible(meshMap.get('guideway-stator-track'));
    makeOpaqueProxyInvisible(meshMap.get('levitating-magnet-carrier'));
    makeOpaqueProxyInvisible(meshMap.get('lateral-guidance-coils'));

    // 1. Precision T-Beam Guideway & Stator Coils
    const trackGroup = new THREE.Group();
    const beamWeb = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.36, 2.3), lightGraphiteMat);
    beamWeb.position.set(0, -1.05, 0);
    const pierL = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.7, 20), charcoalMat);
    pierL.position.set(-1.9, -1.55, 0);
    const pierR = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.7, 20), charcoalMat);
    pierR.position.set(1.9, -1.55, 0);
    trackGroup.add(beamWeb, pierL, pierR);

    // 10 Discrete Stator Pole Packs along Guideway
    for (let i = -4; i <= 4; i++) {
      const packL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.45), satinSilverMat);
      packL.position.set(i * 0.56, -0.82, 0.65);
      const packR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.45), satinSilverMat);
      packR.position.set(i * 0.56, -0.82, -0.65);
      trackGroup.add(packL, packR);
    }
    tagInteractiveHierarchy(trackGroup, findPart('guideway-stator-track'), interactiveMeshes);
    rootGroup.add(trackGroup);
    if (findPart('guideway-stator-track')) meshMap.set('guideway-stator-track', trackGroup);

    // 2. Figure-8 Null-Flux Lateral Guidance Coils along side walls
    const guidanceGroup = new THREE.Group();
    const sideWallF = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.62, 0.12), charcoalMat);
    sideWallF.position.set(0, -0.58, 1.12);
    const sideWallB = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.62, 0.12), charcoalMat);
    sideWallB.position.set(0, -0.58, -1.12);
    guidanceGroup.add(sideWallF, sideWallB);

    for (let i = -3; i <= 3; i++) {
      const upperLoop = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 10, 20), satinCopperMat);
      upperLoop.position.set(i * 0.72, -0.45, -1.04);
      const lowerLoop = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 10, 20), satinCopperMat);
      lowerLoop.position.set(i * 0.72, -0.71, -1.04);
      guidanceGroup.add(upperLoop, lowerLoop);
    }
    tagInteractiveHierarchy(guidanceGroup, findPart('lateral-guidance-coils'), interactiveMeshes);
    rootGroup.add(guidanceGroup);
    if (findPart('lateral-guidance-coils')) meshMap.set('lateral-guidance-coils', guidanceGroup);

    // 3. Levitating Superconducting Bogie Carrier (attached directly to levitating-magnet-carrier mesh so position updates carry it!)
    const carrierProxy = meshMap.get('levitating-magnet-carrier');
    if (carrierProxy) {
      const bogieVisual = new THREE.Group();
      // Pearl-white aerodynamic cabin deck
      const cabinHull = new THREE.Mesh(new THREE.BoxGeometry(3.25, 0.46, 1.72), pearlWhiteMat);
      cabinHull.position.y = 0.22;
      const cabinRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.86, 3.2, 24, 1, false, 0, Math.PI), softOffWhiteMat);
      cabinRoof.rotation.z = Math.PI / 2;
      cabinRoof.scale.set(1, 0.35, 1);
      cabinRoof.position.y = 0.44;
      // Satin-silver & charcoal superconducting magnet modules underneath
      const cryoLeft = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.24, 0.38), charcoalMat);
      cryoLeft.position.set(0, -0.14, 0.68);
      const cryoRight = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.24, 0.38), charcoalMat);
      cryoRight.position.set(0, -0.14, -0.68);
      const poleTrimL = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.08, 0.42), tealAccentMat);
      poleTrimL.position.set(0, -0.28, 0.68);
      const poleTrimR = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.08, 0.42), tealAccentMat);
      poleTrimR.position.set(0, -0.28, -0.68);
      bogieVisual.add(cabinHull, cabinRoof, cryoLeft, cryoRight, poleTrimL, poleTrimR);
      tagInteractiveHierarchy(bogieVisual, findPart('levitating-magnet-carrier'), interactiveMeshes);
      carrierProxy.add(bogieVisual);
    }

    // 4. Magnetic Flux Loops across Air Gap
    const fluxGroup = new THREE.Group();
    for (let i = -2; i <= 2; i++) {
      const fluxLoop = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.018, 12, 28), tealAccentMat);
      fluxLoop.rotation.y = Math.PI / 2;
      fluxLoop.position.set(i * 0.62, -0.42, 0.68);
      fluxGroup.add(fluxLoop);
      rootGroup.add(fluxLoop);
      handles.maglevFluxLoops.push(fluxLoop);
    }
    tagInteractiveHierarchy(fluxGroup, findPart('induced-flux-coupling-loops'), interactiveMeshes);
    if (findPart('induced-flux-coupling-loops')) meshMap.set('induced-flux-coupling-loops', fluxGroup);
  }

  // =========================================================================
  // MODEL 5: SUPERCONDUCTIVITY AND MEISSNER EFFECT EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'superconductivity-meissner-explorer') {
    makeOpaqueProxyInvisible(meshMap.get('cryogenic-cooling-tray'));
    makeOpaqueProxyInvisible(meshMap.get('ybco-superconductor-disc'));
    makeOpaqueProxyInvisible(meshMap.get('rare-earth-magnet'));
    makeOpaqueProxyInvisible(meshMap.get('screening-current-loop'));
    makeOpaqueProxyInvisible(meshMap.get('meissner-field-lines'));

    // 1. Double-Walled Cryogenic Dewar Dish & Liquid Nitrogen Bath
    const dewarGroup = new THREE.Group();
    dewarGroup.position.set(0, -1.05, 0);
    const outerWall = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.05, 0.52, 48), satinSilverMat);
    const rimRing = new THREE.Mesh(new THREE.TorusGeometry(2.12, 0.09, 16, 48), pearlWhiteMat);
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = 0.25;
    const ln2Bath = new THREE.Mesh(
      new THREE.CylinderGeometry(2.02, 2.02, 0.08, 40),
      new THREE.MeshPhysicalMaterial({
        color: 0x99f6e4,
        transmission: 0.82,
        transparent: true,
        opacity: 0.55,
        roughness: 0.08,
      })
    );
    ln2Bath.position.y = 0.16;
    dewarGroup.add(outerWall, rimRing, ln2Bath);
    tagInteractiveHierarchy(dewarGroup, findPart('cryogenic-cooling-tray'), interactiveMeshes);
    rootGroup.add(dewarGroup);
    if (findPart('cryogenic-cooling-tray')) meshMap.set('cryogenic-cooling-tray', dewarGroup);

    // 2. Sintered Dark-Graphite YBCO Superconductor Puck & Pedestal
    const ybcoGroup = new THREE.Group();
    ybcoGroup.position.set(0, -0.62, 0);
    const puck = new THREE.Mesh(new THREE.CylinderGeometry(1.36, 1.38, 0.42, 48), charcoalMat);
    const bevelRing = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.035, 14, 48), lightGraphiteMat);
    bevelRing.rotation.x = Math.PI / 2;
    bevelRing.position.y = 0.2;
    const clampTab = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.28), satinCopperMat);
    clampTab.position.set(1.32, 0.18, 0);
    ybcoGroup.add(puck, bevelRing, clampTab);
    tagInteractiveHierarchy(ybcoGroup, findPart('ybco-superconductor-disc'), interactiveMeshes);
    rootGroup.add(ybcoGroup);
    if (findPart('ybco-superconductor-disc')) meshMap.set('ybco-superconductor-disc', ybcoGroup);

    // 3. Multi-Band Rare-Earth (NdFeB) Magnet attached to rare-earth-magnet proxy
    const magProxy = meshMap.get('rare-earth-magnet');
    if (magProxy) {
      const magVisual = new THREE.Group();
      const lowerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.19, 36), satinSilverMat);
      lowerPole.position.y = -0.11;
      const midBand = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.06, 36), pearlWhiteMat);
      const upperPole = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.46, 0.19, 36), lightGraphiteMat);
      upperPole.position.y = 0.11;
      magVisual.add(lowerPole, midBand, upperPole);
      tagInteractiveHierarchy(magVisual, findPart('rare-earth-magnet'), interactiveMeshes);
      magProxy.add(magVisual);
    }

    // 4. Liquid Nitrogen Vapor Cloud Wisps Group
    const vaporGroup = new THREE.Group();
    for (let v = 0; v < 8; v++) {
      const angle = (v / 8) * Math.PI * 2;
      const wisp = new THREE.Mesh(
        new THREE.SphereGeometry(0.18 + (v % 3) * 0.04, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.35, roughness: 0.9 })
      );
      wisp.position.set(Math.cos(angle) * 1.6, -0.85 + (v % 2) * 0.08, Math.sin(angle) * 1.6);
      vaporGroup.add(wisp);
    }
    rootGroup.add(vaporGroup);

    // 5. Temperature Sensor Probe Assembly
    const probeGroup = new THREE.Group();
    const probeRod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 16), satinSilverMat);
    probeRod.position.set(-1.6, -0.4, 0);
    const probeTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), satinCopperMat);
    probeTip.position.set(-1.6, -0.98, 0);
    probeGroup.add(probeRod, probeTip);
    rootGroup.add(probeGroup);

    // 6. Concentric Persistent London Screening Current Loops (J_s)
    const currentGroup = new THREE.Group();
    const radii = [0.62, 0.92, 1.18];
    radii.forEach((r) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.022, 12, 48), tealAccentMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, -0.39, 0);
      tagInteractiveHierarchy(ring, findPart('screening-current-loop'), interactiveMeshes);
      currentGroup.add(ring);
      handles.scCurrentRings.push(ring);
    });
    tagInteractiveHierarchy(currentGroup, findPart('screening-current-loop'), interactiveMeshes);
    rootGroup.add(currentGroup);
    if (findPart('screening-current-loop')) meshMap.set('screening-current-loop', currentGroup);

    // 7. 12 Dynamic 3D Magnetic Flux Lines (bowing around YBCO below Tc vs penetrating above Tc)
    const scFluxGroup = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const linePts = new Float32Array(28 * 3);
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.BufferAttribute(linePts, 3));
      const line = new THREE.Line(
        lineGeo,
        new THREE.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.85 })
      );
      scFluxGroup.add(line);
      handles.scFieldLines.push(line);
    }
    tagInteractiveHierarchy(scFluxGroup, findPart('meissner-field-lines'), interactiveMeshes);
    rootGroup.add(scFluxGroup);
    if (findPart('meissner-field-lines')) meshMap.set('meissner-field-lines', scFluxGroup);
  }

  // =========================================================================
  // MODEL 6: BLACK HOLE AND GRAVITATIONAL LENSING EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'black-hole-gravitational-lensing') {
    makeOpaqueProxyInvisible(meshMap.get('spacetime-curvature-funnel'));
    makeOpaqueProxyInvisible(meshMap.get('lensed-light-trajectories'));
    makeOpaqueProxyInvisible(meshMap.get('einstein-ring-detector'));

    // Enhance Event Horizon to pure matte obsidian
    const horizonMesh = meshMap.get('event-horizon-sphere');
    if (horizonMesh && horizonMesh instanceof THREE.Mesh) {
      horizonMesh.material = new THREE.MeshBasicMaterial({ color: 0x050811 });
    }

    // 1. Multi-Zone Relativistic Accretion Disk (6 concentric tilted rings)
    const accretionGroup = new THREE.Group();
    const diskColors = [0xfef3c7, 0xfde68a, 0xf59e0b, 0xd97706, 0x2dd4bf, 0x475569];
    const diskRadii = [0.95, 1.18, 1.42, 1.68, 1.95, 2.22];
    const funnelSpec = findPart('spacetime-curvature-funnel');
    diskRadii.forEach((r, idx) => {
      const ringGeo = new THREE.TorusGeometry(r, 0.055 - idx * 0.005, 12, 64);
      const ringMat = new THREE.MeshStandardMaterial({
        color: diskColors[idx],
        emissive: diskColors[idx],
        emissiveIntensity: idx < 3 ? 0.55 - idx * 0.12 : 0.18,
        roughness: 0.3,
        transparent: true,
        opacity: 0.88 - idx * 0.08,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.set(Math.PI / 2 - 0.18, 0, 0.08);
      ringMesh.position.set(0, 0.15, 0);
      tagInteractiveHierarchy(ringMesh, funnelSpec, interactiveMeshes);
      accretionGroup.add(ringMesh);
      handles.bhAccretionRings.push(ringMesh);
    });
    tagInteractiveHierarchy(accretionGroup, funnelSpec, interactiveMeshes);
    rootGroup.add(accretionGroup);
    if (funnelSpec) meshMap.set('spacetime-curvature-funnel', accretionGroup);

    // 2. 3D Flamm's Paraboloid Spacetime Embedding Funnel Wireframe
    const numRad = 16;
    const numCircles = 10;
    const totalSegments = numRad * (numCircles - 1) + numCircles * numRad;
    const gridPositions = new Float32Array(totalSegments * 2 * 3);
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.BufferAttribute(gridPositions, 3));
    handles.bhSpacetimeGrid = new THREE.LineSegments(
      gridGeo,
      new THREE.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.42 })
    );
    rootGroup.add(handles.bhSpacetimeGrid);
    if (findPart('warped-spacetime-embedding-grid')) meshMap.set('warped-spacetime-embedding-grid', handles.bhSpacetimeGrid);

    // 3. 8 Curved Null-Geodesic Light Ray Bundles
    const geodesicGroup = new THREE.Group();
    const lensedSpec = findPart('lensed-light-trajectories');
    for (let i = 0; i < 8; i++) {
      const rayPts = new Float32Array(40 * 3);
      const rayGeo = new THREE.BufferGeometry();
      rayGeo.setAttribute('position', new THREE.BufferAttribute(rayPts, 3));
      const rayLine = new THREE.Line(
        rayGeo,
        new THREE.LineBasicMaterial({
          color: i % 2 === 0 ? 0xfef08a : 0x5eead4,
          transparent: true,
          opacity: 0.88,
        })
      );
      geodesicGroup.add(rayLine);
      handles.bhGeodesicLines.push(rayLine);
    }
    tagInteractiveHierarchy(geodesicGroup, lensedSpec, interactiveMeshes);
    rootGroup.add(geodesicGroup);
    if (lensedSpec) meshMap.set('lensed-light-trajectories', geodesicGroup);

    // 4. Photon Sphere Luminous Shell Halo
    const photonSphereGroup = new THREE.Group();
    const photonSphereHalo = new THREE.Mesh(
      new THREE.SphereGeometry(0.82, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0ea5e9,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.28,
        wireframe: true,
      })
    );
    photonSphereGroup.add(photonSphereHalo);
    rootGroup.add(photonSphereGroup);

    // 5. Relativistic Astrophysical Polar Plasma Jets (North & South)
    const jetGroup = new THREE.Group();
    const northJet = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.8, 24), tealAccentMat);
    northJet.position.set(0, 1.6, 0);
    const southJet = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.8, 24), tealAccentMat);
    southJet.position.set(0, -1.6, 0);
    southJet.rotation.z = Math.PI;
    jetGroup.add(northJet, southJet);
    rootGroup.add(jetGroup);

    // 6. Observer Telescope Focal Plane & Einstein Ring / Lensed Arcs
    const einsteinGroup = new THREE.Group();
    einsteinGroup.position.set(3.55, 0.2, 0);
    const detectorPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.15, 0.05, 40),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.5 })
    );
    detectorPlate.rotation.z = Math.PI / 2;
    const detectorRim = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.04, 14, 48), satinSilverMat);
    detectorRim.rotation.y = Math.PI / 2;
    const einsteinRingMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.048, 16, 64),
      new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        emissive: 0xfde047,
        emissiveIntensity: 0.75,
        roughness: 0.15,
      })
    );
    einsteinRingMesh.rotation.y = Math.PI / 2;
    einsteinRingMesh.position.x = -0.04;
    einsteinRingMesh.name = 'einstein-ring-torus';
    einsteinGroup.add(detectorPlate, detectorRim, einsteinRingMesh);
    tagInteractiveHierarchy(einsteinGroup, findPart('einstein-ring-detector'), interactiveMeshes);
    rootGroup.add(einsteinGroup);
    handles.bhEinsteinArcs = einsteinGroup;
    if (findPart('einstein-ring-detector')) meshMap.set('einstein-ring-detector', einsteinGroup);
  }

  // =========================================================================
  // MODEL 7: QUANTUM TUNNELLING EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'quantum-tunnelling-explorer') {
    makeOpaqueProxyInvisible(meshMap.get('incident-reflected-wave'));
    makeOpaqueProxyInvisible(meshMap.get('evanescent-barrier-wave'));
    makeOpaqueProxyInvisible(meshMap.get('transmitted-quantum-wave'));
    makeOpaqueProxyInvisible(meshMap.get('probability-density-curve'));

    // 1. Satin-Graphite & Pearl-White Quantum Waveguide Bench
    const benchGroup = new THREE.Group();
    const baseRail = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.14, 2.0), charcoalMat);
    baseRail.position.set(0, -1.08, 0);
    const frontTrim = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.06, 0.08), satinSilverMat);
    frontTrim.position.set(0, -1.0, 0.98);
    const backScalePostL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.6, 12), satinSilverMat);
    backScalePostL.position.set(-4.0, 0.22, -0.92);
    const backScalePostR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.6, 12), satinSilverMat);
    backScalePostR.position.set(4.0, 0.22, -0.92);
    benchGroup.add(baseRail, frontTrim, backScalePostL, backScalePostR);
    rootGroup.add(benchGroup);

    // 2. Continuous Wavefunction Lines & Vertical Phase Envelope Bars across Regions I, II, III
    const createWaveLine = (ptsCount: number, colorHex: number) => {
      const arr = new Float32Array(ptsCount * 3);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      return new THREE.Line(g, new THREE.LineBasicMaterial({ color: colorHex, linewidth: 2 }));
    };

    handles.qtWaveLineI = createWaveLine(64, 0x2dd4bf);
    handles.qtWaveLineII = createWaveLine(32, 0xfbbf24);
    handles.qtWaveLineIII = createWaveLine(64, 0x34d399);
    handles.qtProbDensityLine = createWaveLine(120, 0x93c5fd);

    rootGroup.add(
      handles.qtWaveLineI,
      handles.qtWaveLineII,
      handles.qtWaveLineIII,
      handles.qtProbDensityLine
    );
    if (findPart('probability-density-curve')) meshMap.set('probability-density-curve', handles.qtProbDensityLine);

    // Vertical phase bars for Region I (18 bars), Region II (8 bars), Region III (18 bars)
    const barGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.0, 10);
    const specI = findPart('incident-reflected-wave');
    const specII = findPart('evanescent-barrier-wave');
    const specIII = findPart('transmitted-quantum-wave');

    const waveI_Group = new THREE.Group();
    if (handles.qtWaveLineI) waveI_Group.add(handles.qtWaveLineI);
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(barGeo, tealAccentMat);
      tagInteractiveHierarchy(m, specI, interactiveMeshes);
      waveI_Group.add(m);
      handles.qtPhaseBarsI.push(m);
    }
    tagInteractiveHierarchy(waveI_Group, specI, interactiveMeshes);
    rootGroup.add(waveI_Group);
    if (specI) meshMap.set('incident-reflected-wave', waveI_Group);

    const waveII_Group = new THREE.Group();
    if (handles.qtWaveLineII) waveII_Group.add(handles.qtWaveLineII);
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(barGeo, amberAccentMat);
      tagInteractiveHierarchy(m, specII, interactiveMeshes);
      waveII_Group.add(m);
      handles.qtPhaseBarsII.push(m);
    }
    tagInteractiveHierarchy(waveII_Group, specII, interactiveMeshes);
    rootGroup.add(waveII_Group);
    if (specII) meshMap.set('evanescent-barrier-wave', waveII_Group);

    const waveIII_Group = new THREE.Group();
    if (handles.qtWaveLineIII) waveIII_Group.add(handles.qtWaveLineIII);
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(barGeo, emeraldAccentMat);
      tagInteractiveHierarchy(m, specIII, interactiveMeshes);
      waveIII_Group.add(m);
      handles.qtPhaseBarsIII.push(m);
    }
    tagInteractiveHierarchy(waveIII_Group, specIII, interactiveMeshes);
    rootGroup.add(waveIII_Group);
    if (specIII) meshMap.set('transmitted-quantum-wave', waveIII_Group);

    // 3. Potential Energy Barrier Slab Assembly (Region II)
    const barrierGroup = new THREE.Group();
    const barrierSlab = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 2.4, 1.8),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.45,
        roughness: 0.2,
      })
    );
    barrierSlab.position.set(0, 0, 0);
    const barrierFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.88, 2.44, 1.84),
      new THREE.MeshBasicMaterial({ color: 0xfde047, wireframe: true })
    );
    barrierGroup.add(barrierSlab, barrierFrame);
    const barrierSpec = findPart('potential-energy-barrier');
    tagInteractiveHierarchy(barrierGroup, barrierSpec, interactiveMeshes);
    rootGroup.add(barrierGroup);
    if (barrierSpec) meshMap.set('potential-energy-barrier', barrierGroup);

    // 4. Incident Quantum Beam Emitter Assembly
    const sourceGroup = new THREE.Group();
    const emitterNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.6, 24), satinCopperMat);
    emitterNozzle.rotation.z = Math.PI / 2;
    emitterNozzle.position.set(-3.85, 0, 0);
    sourceGroup.add(emitterNozzle);
    rootGroup.add(sourceGroup);

    // 5. Transmitted Quantum Collector Assembly
    const collectorGroup = new THREE.Group();
    const collectorDish = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.28, 0.6, 24), satinSilverMat);
    collectorDish.rotation.z = -Math.PI / 2;
    collectorDish.position.set(3.85, 0, 0);
    collectorGroup.add(collectorDish);
    rootGroup.add(collectorGroup);
  }

  return handles;
}

/**
 * Updates all custom 3D assemblies in real time inside the animation loop.
 */
export function updateBatch1CustomAssemblies(
  handles: Batch1SceneHandles,
  modelSpec: ScientificModelSpec,
  parameters: Record<string, number>,
  conditions: Record<string, any>,
  simTime: number,
  meshMap: Map<string, THREE.Object3D>
): void {
  // =========================================================================
  // 1. ELECTROMAGNETIC WAVE PROPAGATION EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'electromagnetic-wave-propagation') {
    const amp = parameters.amplitude ?? 1.2;
    const wl = parameters.wavelength ?? 2.0;
    const animSpeed = parameters.animationSpeed ?? 1.0;
    const showVectors = conditions.showFieldVectors !== false;
    const showGuide = conditions.showWavelengthGuide !== false;

    const k = (2 * Math.PI) / Math.max(0.4, wl);
    const omega = 3.2 * animSpeed;

    // Update 28 E_y and B_z discrete vector arrows
    const numVec = handles.emVectorArrowsE.length;
    for (let i = 0; i < numVec; i++) {
      const x = -3.4 + (i / (numVec - 1)) * 7.2;
      const phase = k * x - omega * simTime;
      const val = Math.sin(phase) * amp;
      const mag = Math.abs(val);
      const sign = val >= 0 ? 1 : -1;

      const eVec = handles.emVectorArrowsE[i];
      if (eVec) {
        eVec.visible = showVectors && mag > 0.04;
        eVec.rotation.z = sign > 0 ? 0 : Math.PI;
        const shaft = eVec.getObjectByName('shaft');
        const head = eVec.getObjectByName('head');
        const shaftLen = Math.max(0.02, mag - 0.14);
        if (shaft) shaft.scale.set(1, shaftLen, 1);
        if (head) head.position.y = shaftLen;
      }

      const bVec = handles.emVectorArrowsB[i];
      if (bVec) {
        bVec.visible = showVectors && mag > 0.04;
        bVec.rotation.x = sign > 0 ? Math.PI / 2 : -Math.PI / 2;
        const shaft = bVec.getObjectByName('shaft');
        const head = bVec.getObjectByName('head');
        const shaftLen = Math.max(0.02, mag - 0.14);
        if (shaft) shaft.scale.set(1, shaftLen, 1);
        if (head) head.position.y = shaftLen;
      }
    }

    // Update 96-point continuous sinusoidal E and B curves
    if (handles.emWaveLineE && handles.emWaveLineB) {
      const posE = handles.emWaveLineE.geometry.attributes.position as THREE.BufferAttribute;
      const posB = handles.emWaveLineB.geometry.attributes.position as THREE.BufferAttribute;
      const count = posE.count;
      for (let i = 0; i < count; i++) {
        const x = -3.5 + (i / (count - 1)) * 7.4;
        const v = Math.sin(k * x - omega * simTime) * amp;
        posE.setXYZ(i, x, v, 0);
        posB.setXYZ(i, x, 0, v);
      }
      posE.needsUpdate = true;
      posB.needsUpdate = true;
    }

    // Update Wavelength Caliper (λ)
    if (handles.emCaliperGroup) {
      handles.emCaliperGroup.visible = showGuide;
      handles.emCaliperGroup.position.y = amp + 0.32;
      const beam = handles.emCaliperGroup.getObjectByName('caliper-beam');
      const left = handles.emCaliperGroup.getObjectByName('caliper-left');
      const right = handles.emCaliperGroup.getObjectByName('caliper-right');
      if (beam) beam.scale.set(1, wl / 2.0, 1);
      if (left) left.position.x = -wl / 2;
      if (right) right.position.x = wl / 2;
    }

    // Keep anchor proxies synced for label projection
    const eProxy = meshMap.get('electric-field-wave');
    if (eProxy) eProxy.position.set(-1.4, Math.sin(k * -1.4 - omega * simTime) * amp * 0.65, 0);
    const bProxy = meshMap.get('magnetic-field-wave');
    if (bProxy) bProxy.position.set(0.4, 0, Math.sin(k * 0.4 - omega * simTime) * amp * 0.65);
    const wlProxy = meshMap.get('wavelength-span-marker');
    if (wlProxy) {
      wlProxy.visible = showGuide;
      wlProxy.position.set(-0.5, amp + 0.35, 0);
    }
    const phasePlane = meshMap.get('phase-wavefront-plane');
    if (phasePlane) {
      phasePlane.visible = showGuide;
      phasePlane.position.x = ((simTime * animSpeed * 1.7 + 3.4) % 6.8) - 3.4;
    }
  }

  // =========================================================================
  // 2. PLASMA PHYSICS EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'plasma-physics-explorer') {
    const tempK = parameters.plasmaTemperature ?? 15000;
    const ne = parameters.particleDensity ?? 8;
    const bField = parameters.magneticFieldB ?? 0.8;
    const eField = parameters.electricFieldE ?? 100;
    const fieldMode = conditions.fieldMode ?? 'magnetic_confinement';

    const metrics = calculatePlasmaMetrics({
      plasmaTemperature: tempK,
      particleDensity: ne,
      magneticFieldB: bField,
      electricFieldE: eField,
    });

    const thermalScale = Math.sqrt(tempK / 15000);
    const gyroOmega = Math.max(0.4, bField * 3.2);
    const rIon = fieldMode === 'unmagnetized_thermal' ? 0.68 : Math.max(0.18, Math.min(0.75, (0.42 * thermalScale) / Math.max(0.25, bField)));
    const rElec = fieldMode === 'unmagnetized_thermal' ? 0.72 : Math.max(0.06, Math.min(0.32, (0.16 * thermalScale) / Math.max(0.25, bField)));
    const driftSpeed = fieldMode === 'crossed_eb_drift' ? (eField / Math.max(0.3, bField * 250)) * 0.55 : 0;

    // Show particles proportional to density n_e
    const activeIonCount = Math.max(4, Math.min(handles.plasmaIons.length, Math.round((ne / 20) * handles.plasmaIons.length + 3)));
    const activeElecCount = Math.max(6, Math.min(handles.plasmaElectrons.length, Math.round((ne / 20) * handles.plasmaElectrons.length + 4)));

    handles.plasmaIons.forEach((ion, idx) => {
      ion.group.visible = idx < activeIonCount;
      if (!ion.group.visible) return;
      const t = simTime * thermalScale + ion.phase;
      const x = ((ion.baseX + t * ion.pitch + 2.4) % 4.8) - 2.4;
      const driftZ = Math.sin(simTime * 1.4 + idx) * driftSpeed;
      const y = Math.cos(simTime * gyroOmega + ion.phase) * rIon;
      const z = Math.sin(simTime * gyroOmega + ion.phase) * rIon + driftZ;
      ion.group.position.set(x, y, z);
    });

    handles.plasmaElectrons.forEach((el, idx) => {
      const visible = idx < activeElecCount;
      el.mesh.visible = visible;
      el.trail.visible = visible && fieldMode !== 'unmagnetized_thermal';
      if (!visible) return;

      const omegaE = -gyroOmega * 3.6;
      const driftZ = Math.sin(simTime * 1.4 + idx) * driftSpeed;
      const curX = ((el.baseX + simTime * 1.3 * thermalScale + 2.4) % 4.8) - 2.4;
      const curY = el.radialOffset + Math.cos(simTime * omegaE + el.phase) * rElec;
      const curZ = Math.sin(simTime * omegaE + el.phase) * rElec + driftZ;
      el.mesh.position.set(curX, curY, curZ);

      // Update helical trail behind electron
      const posAttr = el.trail.geometry.attributes.position as THREE.BufferAttribute;
      for (let k = 0; k < posAttr.count; k++) {
        const dtBack = k * 0.022;
        const tx = curX - dtBack * 1.3 * thermalScale;
        const ty = el.radialOffset + Math.cos((simTime - dtBack) * omegaE + el.phase) * rElec;
        const tz = Math.sin((simTime - dtBack) * omegaE + el.phase) * rElec + driftZ;
        posAttr.setXYZ(k, tx, ty, tz);
      }
      posAttr.needsUpdate = true;
    });

    if (handles.plasmaBFieldLines) {
      handles.plasmaBFieldLines.visible = fieldMode !== 'unmagnetized_thermal' && bField > 0.04;
    }
    if (handles.plasmaEFieldGroup) {
      handles.plasmaEFieldGroup.visible = eField > 5;
    }
    const debyeScale = Math.max(0.45, Math.min(1.55, metrics.debyeLengthUm / 9.5));
    if (handles.plasmaDebyeGroup) {
      handles.plasmaDebyeGroup.scale.setScalar(debyeScale);
      handles.plasmaDebyeGroup.rotation.y = simTime * 0.5;
    }
    const debyeSphere = meshMap.get('debye-shielding-sphere');
    if (debyeSphere) debyeSphere.scale.setScalar(debyeScale);
  }

  // =========================================================================
  // 3. PARTICLE ACCELERATOR EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'particle-accelerator-explorer') {
    const vAcc = parameters.acceleratingVoltageKv ?? 80;
    const bDipole = parameters.dipoleFieldTesla ?? 0.6;
    const massAmu = parameters.particleMassAmu ?? 1;
    const beamRate = parameters.beamRate ?? 1.0;

    const accMetrics = calculateAcceleratorMetrics({
      acceleratingVoltageKv: vAcc,
      dipoleFieldTesla: bDipole,
      particleMassAmu: massAmu,
    });

    const deflectionRad = (accMetrics.deflectionAngleDeg * Math.PI) / 180;
    const maxDeflectZ = Math.sin(deflectionRad) * 2.25;

    // Update continuous curved beam trajectory line
    if (handles.accBeamCurveLine) {
      handles.accBeamCurveLine.visible = conditions.showBeamTrajectory !== false;
      const pos = handles.accBeamCurveLine.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const u = i / (pos.count - 1);
        const x = -3.4 + u * 6.5;
        let z = 0;
        if (x > 0.3) {
          const bendFrac = (x - 0.3) / 2.8;
          z = Math.pow(bendFrac, 1.65) * maxDeflectZ;
        }
        pos.setXYZ(i, x, 0, z);
      }
      pos.needsUpdate = true;
    }

    // Update 10 accelerating & deflecting particle bunches
    const speedFactor = Math.sqrt(vAcc / 80) * (1 / Math.sqrt(massAmu)) * beamRate;
    handles.accBunches.forEach((bunch, idx) => {
      const phase = ((simTime * 0.55 * speedFactor + idx / handles.accBunches.length) % 1.0);
      // Non-linear s(phase) so bunches visibly accelerate inside RF cavity (x = -2.4 to -1.0)
      const accelCurve = phase < 0.35 ? phase * 0.7 : 0.245 + (phase - 0.35) * 1.16;
      const x = -3.4 + Math.min(1.0, accelCurve) * 6.5;
      let z = 0;
      if (x > 0.3) {
        const bendFrac = (x - 0.3) / 2.8;
        z = Math.pow(bendFrac, 1.65) * maxDeflectZ;
      }
      bunch.position.set(x, 0, z);
    });

    // Pulse RF electric field arrows
    handles.accRfArrows.forEach((arr, i) => {
      const pulse = 0.8 + 0.35 * Math.sin(simTime * 7.0 - i * 0.9) * (vAcc / 120);
      arr.scale.setScalar(Math.max(0.5, pulse));
    });

    // Shift scintillation impact spot on detector screen
    if (handles.accDetectorSpot) {
      handles.accDetectorSpot.position.z = maxDeflectZ - 0.45;
    }

    // Sync proxy anchor for Particle Beam label
    const beamProxy = meshMap.get('charged-particle-beam');
    if (beamProxy) {
      beamProxy.position.set(1.6, 0, Math.pow((1.6 - 0.3) / 2.8, 1.65) * maxDeflectZ);
    }
  }

  // =========================================================================
  // 4. MAGNETIC LEVITATION MECHANISM EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'magnetic-levitation-explorer') {
    const iKa = parameters.magnetCurrentKa ?? 60;
    const massKg = parameters.payloadMassKg ?? 400;
    const damping = parameters.dampingGain ?? 0.5;
    const showForces = conditions.showForceVectors !== false;

    const maglev = calculateMaglevMetrics({
      magnetCurrentKa: iKa,
      payloadMassKg: massKg,
      dampingGain: damping,
    });

    const gapWorld = Math.max(0.28, Math.min(1.25, (maglev.equilibriumGapMm / 28.0) * 0.78));
    const oscAmp = (0.06 / Math.max(0.2, damping)) * Math.sin(simTime * maglev.naturalFrequencyHz * 2.0);
    const carrierY = -0.52 + gapWorld + oscAmp;

    const carrier = meshMap.get('levitating-magnet-carrier');
    if (carrier) carrier.position.y = carrierY;

    const gapMarker = meshMap.get('levitation-air-gap-marker');
    if (gapMarker) {
      gapMarker.scale.y = Math.max(0.25, gapWorld);
      gapMarker.position.y = -0.82 + gapWorld * 0.5;
    }

    const forceScale = Math.max(0.55, Math.min(1.6, massKg / 400));
    const liftVec = meshMap.get('upward-magnetic-force-vector');
    if (liftVec) {
      liftVec.visible = showForces;
      liftVec.position.y = carrierY + 0.85;
      liftVec.scale.set(1, forceScale, 1);
    }
    const gravVec = meshMap.get('downward-gravity-force-vector');
    if (gravVec) {
      gravVec.visible = showForces;
      gravVec.position.y = carrierY - 0.52;
      gravVec.scale.set(1, forceScale, 1);
    }

    handles.maglevFluxLoops.forEach((loop, idx) => {
      loop.position.y = -0.78 + gapWorld * 0.45;
      const s = 0.75 + (iKa / 100) * 0.45 + 0.05 * Math.sin(simTime * 4 + idx);
      loop.scale.set(s, gapWorld * 1.1, s);
    });
  }

  // =========================================================================
  // 5. SUPERCONDUCTIVITY AND MEISSNER EFFECT EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'superconductivity-meissner-explorer') {
    const tempK = parameters.specimenTemperatureK ?? 77;
    const tcK = parameters.criticalTempK ?? 92;
    const bApp = parameters.appliedFieldMt ?? 80;
    const showCurrents = conditions.showScreeningCurrents !== false;

    const scMetrics = calculateSuperconductorMetrics({
      specimenTemperatureK: tempK,
      criticalTempK: tcK,
      appliedFieldMt: bApp,
    });

    const magnet = meshMap.get('rare-earth-magnet');
    const targetMagnetY = scMetrics.isSuperconducting
      ? 0.28 + (scMetrics.levitationHeightMm / 20.0) * 0.68 + Math.sin(simTime * 2.6) * 0.03
      : -0.19;

    if (magnet) {
      magnet.position.y += (targetMagnetY - magnet.position.y) * 0.12;
      if (scMetrics.isSuperconducting) {
        magnet.rotation.y += 0.018;
      }
    }

    // Update persistent London screening current loops
    handles.scCurrentRings.forEach((ring, idx) => {
      ring.visible = showCurrents && scMetrics.isSuperconducting;
      const pulse = 1.0 + 0.04 * Math.sin(simTime * 5.0 - idx * 1.1);
      ring.scale.set(pulse, pulse, 1);
    });

    // Update 12 3D Magnetic Flux Lines:
    // Below Tc -> bow outward around the YBCO disc (radius > 1.48) so B_interior = 0
    // Above Tc -> pass straight down through the YBCO disc interior
    const magY = magnet ? magnet.position.y : targetMagnetY;
    const expulsionFactor = scMetrics.isSuperconducting ? 1.0 : 0.0;

    handles.scFieldLines.forEach((line, idx) => {
      const angle = (idx / handles.scFieldLines.length) * Math.PI * 2 + simTime * 0.15;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const pos = line.geometry.attributes.position as THREE.BufferAttribute;

      for (let k = 0; k < pos.count; k++) {
        const u = k / (pos.count - 1); // 0 (top of magnet) to 1 (below disc)
        const y = magY + 0.55 - u * 1.85;
        // Normal dipole radial profile vs Meissner outward diversion around disc (y in [-0.85, -0.35])
        const baseR = 0.22 + Math.sin(u * Math.PI) * 0.72;
        const nearDisc = Math.exp(-Math.pow((y - -0.52) / 0.36, 2));
        const r = baseR + expulsionFactor * nearDisc * 0.88;
        pos.setXYZ(k, r * cosA, y, r * sinA);
      }
      pos.needsUpdate = true;
    });
  }

  // =========================================================================
  // 6. BLACK HOLE AND GRAVITATIONAL LENSING EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'black-hole-gravitational-lensing') {
    const massSolar = parameters.blackHoleMassSolar ?? 20;
    const bRs = parameters.impactParameterRs ?? 3.5;
    const alignOffset = parameters.sourceAlignmentOffset ?? 0.0;
    const showGrid = conditions.showSpacetimeGrid !== false;
    const showPhoton = conditions.showPhotonSphere !== false;

    const bhMetrics = calculateBlackHoleLensingMetrics({
      blackHoleMassSolar: massSolar,
      impactParameterRs: bRs,
      sourceAlignmentOffset: alignOffset,
    });

    const massScale = Math.pow(massSolar / 20, 0.35);
    const horizon = meshMap.get('event-horizon-sphere');
    const photonSphere = meshMap.get('photon-sphere-shell');
    const starSource = meshMap.get('background-star-emitter');

    if (horizon) horizon.scale.setScalar(massScale);
    if (photonSphere) {
      photonSphere.visible = showPhoton;
      photonSphere.scale.setScalar(massScale);
    }
    if (starSource) {
      starSource.position.z = alignOffset * 0.85;
    }

    // Rotate accretion disk rings differentially
    handles.bhAccretionRings.forEach((ring, idx) => {
      ring.scale.setScalar(massScale);
      ring.rotation.z += 0.012 / (1 + idx * 0.35);
    });

    // Update 3D Flamm's Paraboloid Spacetime Funnel Grid
    if (handles.bhSpacetimeGrid) {
      handles.bhSpacetimeGrid.visible = showGrid;
      const pos = handles.bhSpacetimeGrid.geometry.attributes.position as THREE.BufferAttribute;
      const numRad = 16;
      const numCircles = 10;
      const wellDepth = 0.85 * massScale;
      let ptr = 0;

      const pointAt = (rIdx: number, cIdx: number): [number, number, number] => {
        const r = 0.45 * massScale + (cIdx / (numCircles - 1)) * 3.1;
        const th = (rIdx / numRad) * Math.PI * 2 + simTime * 0.08;
        const y = -0.25 - wellDepth / Math.sqrt(Math.max(0.35, r));
        return [r * Math.cos(th), y, r * Math.sin(th)];
      };

      // Radial lines
      for (let rIdx = 0; rIdx < numRad; rIdx++) {
        for (let cIdx = 0; cIdx < numCircles - 1; cIdx++) {
          const p1 = pointAt(rIdx, cIdx);
          const p2 = pointAt(rIdx, cIdx + 1);
          pos.setXYZ(ptr++, p1[0], p1[1], p1[2]);
          pos.setXYZ(ptr++, p2[0], p2[1], p2[2]);
        }
      }
      // Azimuthal rings
      for (let cIdx = 0; cIdx < numCircles; cIdx++) {
        for (let rIdx = 0; rIdx < numRad; rIdx++) {
          const p1 = pointAt(rIdx, cIdx);
          const p2 = pointAt((rIdx + 1) % numRad, cIdx);
          pos.setXYZ(ptr++, p1[0], p1[1], p1[2]);
          pos.setXYZ(ptr++, p2[0], p2[1], p2[2]);
        }
      }
      pos.needsUpdate = true;
    }

    // Update 8 Curved Geodesic Light Ray Bundles
    const bendStrength = Math.min(1.4, (bhMetrics.deflectionAngleDeg / 90) * 0.95);
    const impactWorld = Math.max(0.55, Math.min(2.1, bRs * 0.28 * massScale));

    handles.bhGeodesicLines.forEach((line, idx) => {
      const phi = (idx / handles.bhGeodesicLines.length) * Math.PI * 2;
      const pos = line.geometry.attributes.position as THREE.BufferAttribute;
      const srcZ = alignOffset * 0.85;

      for (let k = 0; k < pos.count; k++) {
        const u = k / (pos.count - 1); // 0 at star (-3.7) to 1 at observer (+3.55)
        if (bhMetrics.isPhotonCaptured && u > 0.48) {
          // Captured ray spirals into photon sphere / event horizon
          const s = (u - 0.48) / 0.52;
          const spiralR = impactWorld * (1 - s * 0.78);
          const spiralAng = phi + s * Math.PI * 2.5;
          pos.setXYZ(k, (u - 0.5) * 1.2 * (1 - s), 0.15 + spiralR * Math.sin(spiralAng), spiralR * Math.cos(spiralAng));
        } else {
          const x = -3.7 + u * 7.25;
          const arch = Math.sin(u * Math.PI);
          const rPerp = impactWorld * Math.pow(arch, 0.75);
          const focusFactor = 1.0 - bendStrength * Math.max(0, u - 0.5) * 0.85;
          const y = 0.18 + rPerp * Math.sin(phi) * focusFactor;
          const z = (1 - u) * srcZ + rPerp * Math.cos(phi) * focusFactor - u * alignOffset * 0.35;
          pos.setXYZ(k, x, y, z);
        }
      }
      pos.needsUpdate = true;
    });

    // Update Einstein Ring on Observer Plane
    if (handles.bhEinsteinArcs) {
      const ringTorus = handles.bhEinsteinArcs.getObjectByName('einstein-ring-torus');
      if (ringTorus) {
        const rScale = bhMetrics.isPhotonCaptured ? 0.35 : Math.max(0.55, bhMetrics.einsteinRingAngularScale * 0.85);
        ringTorus.scale.set(rScale, rScale, 1);
        ringTorus.position.z = -alignOffset * 0.35;
      }
    }
  }

  // =========================================================================
  // 7. QUANTUM TUNNELLING EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'quantum-tunnelling-explorer') {
    const eEv = parameters.particleEnergyEv ?? 4.0;
    const v0Ev = parameters.barrierHeightEv ?? 6.0;
    const widthNm = parameters.barrierWidthNm ?? 0.35;
    const showProb = conditions.showProbabilityDensity !== false;

    const qtMetrics = calculateQuantumTunnellingMetrics({
      particleEnergyEv: eEv,
      barrierHeightEv: v0Ev,
      barrierWidthNm: widthNm,
    });

    const halfWidthWorld = Math.max(0.28, (widthNm / 0.35) * 0.55);
    const heightScale = Math.max(0.35, v0Ev / 6.0);

    const barrier = meshMap.get('potential-energy-barrier');
    if (barrier) {
      barrier.scale.set((halfWidthWorld * 2) / 1.1, heightScale, 1);
      barrier.position.y = -1.0 + 1.1 * heightScale;
    }

    const energyY = -0.95 + (eEv / 6.0) * 1.95;
    const energyPlane = meshMap.get('particle-energy-level-plane');
    if (energyPlane) {
      energyPlane.position.y = energyY;
    }

    const kWave = 3.2 * Math.sqrt(eEv / 4.0);
    const omega = 4.2;
    const rAmp = Math.sqrt(qtMetrics.reflectionProbability) * 0.35;
    const tAmp = Math.max(0.08, qtMetrics.transmittedAmplitudeRatio);

    // 1. Region I WaveLine (x from -3.9 to -halfWidthWorld)
    if (handles.qtWaveLineI) {
      const pos = handles.qtWaveLineI.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const u = i / (pos.count - 1);
        const x = -3.9 + u * (-halfWidthWorld - -3.9);
        const inc = Math.sin(kWave * (x + halfWidthWorld) - omega * simTime);
        const refl = rAmp * Math.sin(-kWave * (x + halfWidthWorld) - omega * simTime);
        const y = energyY + (inc + refl) * 0.52;
        const z = Math.cos(kWave * (x + halfWidthWorld) - omega * simTime) * 0.22;
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }

    // Boundary value at x = -halfWidthWorld for continuous connection into Region II
    const boundaryValLeft = (1 + rAmp) * Math.sin(-omega * simTime) * 0.52;

    // 2. Region II Evanescent Decay WaveLine (x from -halfWidthWorld to +halfWidthWorld)
    if (handles.qtWaveLineII) {
      const pos = handles.qtWaveLineII.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const u = i / (pos.count - 1);
        const x = -halfWidthWorld + u * (2 * halfWidthWorld);
        const decayEnv = qtMetrics.regime === 'tunnelling'
          ? Math.pow(tAmp, u)
          : 1.0 - (1.0 - tAmp) * u;
        const y = energyY + boundaryValLeft * decayEnv;
        const z = Math.cos(-omega * simTime) * 0.22 * decayEnv;
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }

    // 3. Region III Transmitted WaveLine (x from +halfWidthWorld to +3.9)
    if (handles.qtWaveLineIII) {
      const pos = handles.qtWaveLineIII.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const u = i / (pos.count - 1);
        const x = halfWidthWorld + u * (3.9 - halfWidthWorld);
        const phase = kWave * (x - halfWidthWorld) - omega * simTime;
        const y = energyY + Math.sin(phase) * 0.52 * tAmp;
        const z = Math.cos(phase) * 0.22 * tAmp;
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }

    // 4. Vertical Phase Bars across Regions I, II, III
    handles.qtPhaseBarsI.forEach((bar, idx) => {
      const u = idx / (handles.qtPhaseBarsI.length - 1);
      const x = -3.8 + u * (-halfWidthWorld - 0.08 - -3.8);
      const val = Math.sin(kWave * (x + halfWidthWorld) - omega * simTime) * 0.52;
      bar.position.set(x, energyY + val * 0.5, 0);
      bar.scale.set(1, Math.max(0.04, Math.abs(val)), 1);
    });

    handles.qtPhaseBarsII.forEach((bar, idx) => {
      const u = (idx + 0.5) / handles.qtPhaseBarsII.length;
      const x = -halfWidthWorld + u * (2 * halfWidthWorld);
      const decayEnv = Math.pow(tAmp, u);
      const val = boundaryValLeft * decayEnv;
      bar.position.set(x, energyY + val * 0.5, 0);
      bar.scale.set(1, Math.max(0.04, Math.abs(val)), 1);
    });

    handles.qtPhaseBarsIII.forEach((bar, idx) => {
      const u = idx / (handles.qtPhaseBarsIII.length - 1);
      const x = halfWidthWorld + 0.08 + u * (3.8 - (halfWidthWorld + 0.08));
      const val = Math.sin(kWave * (x - halfWidthWorld) - omega * simTime) * 0.52 * tAmp;
      bar.position.set(x, energyY + val * 0.5, 0);
      bar.scale.set(1, Math.max(0.04, Math.abs(val)), 1);
    });

    // 5. Born Probability Density Curve |ψ(x)|² along rear plane
    if (handles.qtProbDensityLine) {
      handles.qtProbDensityLine.visible = showProb;
      const pos = handles.qtProbDensityLine.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const u = i / (pos.count - 1);
        const x = -3.9 + u * 7.8;
        let probHeight = 0;
        if (x < -halfWidthWorld) {
          const standing = 1 + qtMetrics.reflectionProbability + 2 * Math.sqrt(qtMetrics.reflectionProbability) * Math.cos(2 * kWave * (x + halfWidthWorld));
          probHeight = 0.38 * standing;
        } else if (x <= halfWidthWorld) {
          const frac = (x + halfWidthWorld) / (2 * halfWidthWorld);
          const startP = 0.38 * (1 + qtMetrics.reflectionProbability + 2 * Math.sqrt(qtMetrics.reflectionProbability));
          const endP = 0.38 * Math.max(0.05, qtMetrics.transmissionProbability);
          probHeight = startP * Math.pow(endP / Math.max(0.05, startP), frac);
        } else {
          probHeight = 0.38 * Math.max(0.06, qtMetrics.transmissionProbability);
        }
        pos.setXYZ(i, x, -0.95 + probHeight, -0.75);
      }
      pos.needsUpdate = true;
    }

    // Keep label anchor proxies synced
    const incProxy = meshMap.get('incident-reflected-wave');
    if (incProxy) incProxy.position.set(-2.35, energyY + 0.35, 0);
    const decProxy = meshMap.get('evanescent-barrier-wave');
    if (decProxy) decProxy.position.set(0, energyY + 0.22, 0);
    const transProxy = meshMap.get('transmitted-quantum-wave');
    if (transProxy) transProxy.position.set(2.35, energyY + 0.2 * tAmp, 0);
  }
}
