import * as THREE from 'three';
import { ScientificModelSpec, ModelPartSpec } from '../../types/aiModel';
import {
  calculateFaradayInductionMetrics,
  calculateMotorGeneratorMetrics,
  calculateTransformerCouplingMetrics,
  calculateWaveInterferenceMetrics,
  calculateInterferometerMetrics,
  calculateFluidDynamicsMetrics,
  calculateTokamakFusionMetrics,
} from './advancedPhysicsBatch2Engine';

export const ADVANCED_PHYSICS_BATCH_2_TYPES = new Set<string>([
  'faraday-law-induction-explorer',
  'motor-generator-energy-explorer',
  'ac-voltage-transformer-explorer',
  'wave-interference-diffraction-lab',
  'optical-interferometer-explorer',
  'fluid-dynamics-bernoulli-vortex',
  'tokamak-fusion-confinement-explorer',
]);

export function isAdvancedPhysicsBatch2Model(functionalType?: string, id?: string): boolean {
  return (
    (Boolean(functionalType) && ADVANCED_PHYSICS_BATCH_2_TYPES.has(functionalType!)) ||
    (Boolean(id) && ADVANCED_PHYSICS_BATCH_2_TYPES.has(id!))
  );
}

export interface Batch2SceneHandles {
  rootGroup: THREE.Group;
  // Model 48: Faraday's Law Induction
  faradayMagnetAssembly: THREE.Group | null;
  faradayWindingsMesh: THREE.Mesh[];
  faradayFormerCutaway: THREE.Mesh | null;
  faradayGalvanoNeedle: THREE.Group | null;
  faradayFluxLines: THREE.Line[];
  faradayLenzRing: THREE.Mesh | null;
  // Model 49: Motor & Generator
  mgRotorGroup: THREE.Group | null;
  mgStatorUpperShell: THREE.Mesh | null;
  mgCommutatorGroup: THREE.Group | null;
  mgLoadLampMesh: THREE.Mesh | null;
  mgCurrentArrows: THREE.Group[];
  // Model 50: Transformer
  txPrimaryTurns: THREE.Mesh[];
  txSecondaryTurns: THREE.Mesh[];
  txCoreCutawayCover: THREE.Mesh | null;
  txFluxLoopLine: THREE.Line | null;
  txFluxDots: THREE.Mesh[];
  txPrimaryWaveLine: THREE.Line | null;
  txSecondaryWaveLine: THREE.Line | null;
  txLoadSwitchLever: THREE.Mesh | null;
  txLoadIndicatorGlow: THREE.Mesh | null;
  // Model 51: Wave Interference & Diffraction
  waveSurfaceMesh: THREE.Mesh | null;
  waveSource1Dipper: THREE.Mesh | null;
  waveSource2Dipper: THREE.Mesh | null;
  waveBarrierLeftJaw: THREE.Mesh | null;
  waveBarrierRightJaw: THREE.Mesh | null;
  waveApertureMarker: THREE.Mesh | null;
  waveObstacleMesh: THREE.Mesh | null;
  waveIntensityBars: THREE.Mesh[];
  waveNodalGuides: THREE.Group | null;
  // Model 52: Optical Interferometer
  optMovableMirrorGroup: THREE.Group | null;
  optBeamGroup: THREE.Group | null;
  optBeamMeshes: THREE.Mesh[];
  optWaveCrestRings: THREE.Mesh[];
  optFringeRings: THREE.Mesh[];
  optLinearFringeBars: THREE.Mesh[];
  // Model 53: Fluid Dynamics (Bernoulli & Vortex)
  fluidVenturiOuterShell: THREE.Mesh | null;
  fluidThroatCollar: THREE.Mesh | null;
  fluidManometerColumns: THREE.Mesh[];
  fluidStreamlinesGroup: THREE.Group | null;
  fluidTracerParticles: { mesh: THREE.Mesh; laneZ: number; laneY: number; phase: number }[];
  fluidVortexAssembly: THREE.Group | null;
  fluidVortexRings: { group: THREE.Group; phase: number; sign: number }[];
  // Model 54: Tokamak Fusion Confinement
  tokamakVesselCutawayMesh: THREE.Mesh | null;
  tokamakPlasmaMesh: THREE.Mesh | null;
  tokamakTfCoilsGroup: THREE.Group | null;
  tokamakPfCoilsGroup: THREE.Group | null;
  tokamakCsGroup: THREE.Group | null;
  tokamakHelicalLinesGroup: THREE.Group | null;
  tokamakHelicalLines: THREE.Line[];
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
 * Clones materials on all child meshes/lines so blue selection highlighting on one component
 * never affects any other component in the scene, tags every child with partSpec for raycasting,
 * and registers the group in meshMap with an accurate 3D label anchor.
 */
function registerPartGroup(
  partId: string,
  group: THREE.Object3D,
  modelSpec: ScientificModelSpec,
  meshMap: Map<string, THREE.Object3D>,
  interactiveMeshes: THREE.Object3D[],
  customAnchor?: [number, number, number]
) {
  const partSpec: ModelPartSpec | undefined = modelSpec.parts.find((p) => p.id === partId);
  makeOpaqueProxyInvisible(meshMap.get(partId));

  group.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map((m) => m.clone());
        } else {
          child.material = (child.material as THREE.Material).clone();
        }
      }
      if (partSpec) {
        child.userData = { ...child.userData, partSpec };
        if (child instanceof THREE.Mesh) {
          interactiveMeshes.push(child);
        }
      }
    }
  });

  if (partSpec) {
    const anchorCoords = customAnchor || partSpec.position || [0, 0, 0];
    group.userData = {
      ...group.userData,
      partSpec,
      labelAnchor: new THREE.Vector3(anchorCoords[0], anchorCoords[1], anchorCoords[2]),
    };
    meshMap.set(partId, group);
  }
}

/**
 * Helper to convert visible wavelength (400–700 nm) to a clean scientific RGB hex color.
 */
function wavelengthNmToHex(lambdaNm: number): number {
  const wl = Math.max(400, Math.min(700, lambdaNm));
  let r = 0;
  let g = 0;
  let b = 0;
  if (wl >= 400 && wl < 440) {
    r = -(wl - 440) / (440 - 400);
    g = 0;
    b = 1;
  } else if (wl >= 440 && wl < 490) {
    r = 0;
    g = (wl - 440) / (490 - 440);
    b = 1;
  } else if (wl >= 490 && wl < 510) {
    r = 0;
    g = 1;
    b = -(wl - 510) / (510 - 490);
  } else if (wl >= 510 && wl < 580) {
    r = (wl - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (wl >= 580 && wl < 645) {
    r = 1;
    g = -(wl - 645) / (645 - 580);
    b = 0;
  } else {
    r = 1;
    g = 0;
    b = 0;
  }
  const ri = Math.round(Math.min(1, Math.max(0.15, r)) * 255);
  const gi = Math.round(Math.min(1, Math.max(0.15, g)) * 255);
  const bi = Math.round(Math.min(1, Math.max(0.15, b)) * 255);
  return (ri << 16) | (gi << 8) | bi;
}

/**
 * Builds composite, multi-part 3D scientific instruments for Physics Batch 2: Models 48–54.
 */
export function buildBatch2CustomAssemblies(
  modelSpec: ScientificModelSpec,
  modelRoot: THREE.Group,
  meshMap: Map<string, THREE.Object3D>,
  interactiveMeshes: THREE.Object3D[]
): Batch2SceneHandles {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'batch2-custom-studio-assemblies';
  modelRoot.add(rootGroup);

  const handles: Batch2SceneHandles = {
    rootGroup,
    faradayMagnetAssembly: null,
    faradayWindingsMesh: [],
    faradayFormerCutaway: null,
    faradayGalvanoNeedle: null,
    faradayFluxLines: [],
    faradayLenzRing: null,
    mgRotorGroup: null,
    mgStatorUpperShell: null,
    mgCommutatorGroup: null,
    mgLoadLampMesh: null,
    mgCurrentArrows: [],
    txPrimaryTurns: [],
    txSecondaryTurns: [],
    txCoreCutawayCover: null,
    txFluxLoopLine: null,
    txFluxDots: [],
    txPrimaryWaveLine: null,
    txSecondaryWaveLine: null,
    txLoadSwitchLever: null,
    txLoadIndicatorGlow: null,
    waveSurfaceMesh: null,
    waveSource1Dipper: null,
    waveSource2Dipper: null,
    waveBarrierLeftJaw: null,
    waveBarrierRightJaw: null,
    waveApertureMarker: null,
    waveObstacleMesh: null,
    waveIntensityBars: [],
    waveNodalGuides: null,
    optMovableMirrorGroup: null,
    optBeamGroup: null,
    optBeamMeshes: [],
    optWaveCrestRings: [],
    optFringeRings: [],
    optLinearFringeBars: [],
    fluidVenturiOuterShell: null,
    fluidThroatCollar: null,
    fluidManometerColumns: [],
    fluidStreamlinesGroup: null,
    fluidTracerParticles: [],
    fluidVortexAssembly: null,
    fluidVortexRings: [],
    tokamakVesselCutawayMesh: null,
    tokamakPlasmaMesh: null,
    tokamakTfCoilsGroup: null,
    tokamakPfCoilsGroup: null,
    tokamakCsGroup: null,
    tokamakHelicalLinesGroup: null,
    tokamakHelicalLines: [],
  };

  // Controlled scientific material palette
  const pearlWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.12 });
  const softOffWhiteMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.18 });
  const satinSilverMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.22, metalness: 0.82 });
  const lightGraphiteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.35, metalness: 0.65 });
  const charcoalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.42, metalness: 0.55 });
  const satinCopperMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.26, metalness: 0.85 });
  const northPoleMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.45 });
  const southPoleMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.45 });
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
  const clearGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xcffafe,
    transparent: true,
    opacity: 0.3,
    roughness: 0.08,
    transmission: 0.85,
    ior: 1.48,
  });

  // =========================================================================
  // MODEL 48: FARADAY'S LAW: ELECTROMAGNETIC INDUCTION EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'faraday-law-induction-explorer') {
    // 1. Optical/Mechanical Base Rail & Supports
    const benchGroup = new THREE.Group();
    const basePlate = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.22, 3.2), charcoalMat);
    basePlate.position.set(0.2, -0.95, 0);
    const guideRail = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 5.2, 20), satinSilverMat);
    guideRail.rotation.z = Math.PI / 2;
    guideRail.position.set(-0.9, -0.35, 0);
    benchGroup.add(basePlate, guideRail);
    rootGroup.add(benchGroup);

    // 2. Permanent Bar Magnet Assembly (with distinct North & South Poles + Flux Lines)
    const magnetAssembly = new THREE.Group();
    magnetAssembly.position.set(-1.8, 0.25, 0);
    handles.faradayMagnetAssembly = magnetAssembly;
    rootGroup.add(magnetAssembly);

    // Magnet carrier sled & collar ('permanent-bar-magnet')
    const magnetBodyGroup = new THREE.Group();
    const centerCollar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.66, 0.66), satinSilverMat);
    const sledPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.55, 16), lightGraphiteMat);
    sledPost.position.set(0, -0.42, 0);
    const sledShoe = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.26), charcoalMat);
    sledShoe.position.set(0, -0.6, 0);
    magnetBodyGroup.add(centerCollar, sledPost, sledShoe);
    magnetAssembly.add(magnetBodyGroup);
    registerPartGroup('permanent-bar-magnet', magnetBodyGroup, modelSpec, meshMap, interactiveMeshes, [0, 0, 0]);

    // North Pole ('magnet-north-pole')
    const northGroup = new THREE.Group();
    northGroup.position.set(0.62, 0, 0);
    const northBlock = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.62, 0.62), northPoleMat);
    const northBevel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.52, 0.52), pearlWhiteMat);
    northBevel.position.x = 0.54;
    northGroup.add(northBlock, northBevel);
    magnetAssembly.add(northGroup);
    registerPartGroup('magnet-north-pole', northGroup, modelSpec, meshMap, interactiveMeshes, [0, 0, 0]);

    // South Pole ('magnet-south-pole')
    const southGroup = new THREE.Group();
    southGroup.position.set(-0.62, 0, 0);
    const southBlock = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.62, 0.62), southPoleMat);
    const southCap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.54, 0.54), satinSilverMat);
    southCap.position.x = -0.54;
    southGroup.add(southBlock, southCap);
    magnetAssembly.add(southGroup);
    registerPartGroup('magnet-south-pole', southGroup, modelSpec, meshMap, interactiveMeshes, [0, 0, 0]);

    // Animated Dipole Magnetic Flux Loops ('magnetic-flux-lines')
    const fluxGroup = new THREE.Group();
    const loopRadii = [0.65, 1.05, 1.45, 0.65, 1.05, 1.45];
    for (let i = 0; i < loopRadii.length; i++) {
      const rY = loopRadii[i];
      const signY = i < 3 ? 1 : -1;
      const pts: THREE.Vector3[] = [];
      for (let s = 0; s <= 48; s++) {
        const theta = (s / 48) * Math.PI * 2;
        const lx = 1.45 * Math.cos(theta);
        const ly = signY * (0.18 + rY * Math.sin(theta) * Math.sin(theta) + 0.35 * (1 - Math.cos(theta)));
        const lz = (i % 3 - 1) * 0.18 * Math.sin(theta);
        pts.push(new THREE.Vector3(lx, ly, lz));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
      const line = new THREE.Line(lineGeo, lineMat);
      fluxGroup.add(line);
      handles.faradayFluxLines.push(line);
    }
    // Add field direction arrowheads on flux loops
    for (const signY of [-1, 1]) {
      const arrowCone = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 12), skyBlueAccentMat);
      arrowCone.position.set(1.25, signY * 0.45, 0);
      arrowCone.rotation.z = signY > 0 ? -Math.PI / 4 : (-3 * Math.PI) / 4;
      fluxGroup.add(arrowCone);
    }
    magnetAssembly.add(fluxGroup);
    registerPartGroup('magnetic-flux-lines', fluxGroup, modelSpec, meshMap, interactiveMeshes, [0.4, 0.85, 0]);

    // 3. Insulated Coil Former & Cutaway Spool ('induction-coil-former')
    const formerGroup = new THREE.Group();
    formerGroup.position.set(0.55, 0.25, 0);
    const innerTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.76, 0.76, 2.3, 32, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.1, side: THREE.DoubleSide })
    );
    innerTube.rotation.z = Math.PI / 2;
    const leftFlange = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.12, 32), pearlWhiteMat);
    leftFlange.rotation.z = Math.PI / 2;
    leftFlange.position.x = -1.12;
    const rightFlange = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.12, 32), pearlWhiteMat);
    rightFlange.rotation.z = Math.PI / 2;
    rightFlange.position.x = 1.12;
    const outerCover = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 2.15, 32, 1, true, 0, Math.PI), clearGlassMat);
    outerCover.rotation.z = Math.PI / 2;
    handles.faradayFormerCutaway = outerCover;
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 1.2), lightGraphiteMat);
    pedestal.position.set(0, -0.92, 0);
    // Lenz opposing field indicator ring inside the bore
    const lenzRing = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.04, 16, 40), tealAccentMat);
    lenzRing.rotation.y = Math.PI / 2;
    lenzRing.position.x = -0.95;
    handles.faradayLenzRing = lenzRing;
    formerGroup.add(innerTube, leftFlange, rightFlange, outerCover, pedestal, lenzRing);
    rootGroup.add(formerGroup);
    registerPartGroup('induction-coil-former', formerGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.95, 0]);

    // 4. Multi-Turn Copper Solenoid Windings ('conducting-solenoid-windings')
    const windingsGroup = new THREE.Group();
    windingsGroup.position.set(0.55, 0.25, 0);
    const maxVisualTurns = 20;
    for (let i = 0; i < maxVisualTurns; i++) {
      const tx = -1.0 + (i / (maxVisualTurns - 1)) * 2.0;
      const turnMesh = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.052, 14, 36), satinCopperMat);
      turnMesh.rotation.y = Math.PI / 2;
      turnMesh.position.x = tx;
      windingsGroup.add(turnMesh);
      handles.faradayWindingsMesh.push(turnMesh);
    }
    // Lead wires connecting coil to galvanometer
    const leadUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 12), satinCopperMat);
    leadUpper.rotation.z = Math.PI / 2;
    leadUpper.position.set(1.45, -0.45, 0.35);
    const leadLower = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 12), satinCopperMat);
    leadLower.rotation.z = Math.PI / 2;
    leadLower.position.set(1.45, -0.45, -0.35);
    windingsGroup.add(leadUpper, leadLower);
    rootGroup.add(windingsGroup);
    registerPartGroup('conducting-solenoid-windings', windingsGroup, modelSpec, meshMap, interactiveMeshes, [0, -0.85, 0]);

    // 5. Center-Zero Galvanometer & EMF Meter ('center-zero-galvanometer')
    const galvanoGroup = new THREE.Group();
    galvanoGroup.position.set(2.9, 0.2, 0);
    const meterBody = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.65, 1.05), softOffWhiteMat);
    const meterBezel = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.15, 0.12), charcoalMat);
    meterBezel.position.set(0, 0.2, 0.52);
    const dialFace = new THREE.Mesh(new THREE.CircleGeometry(0.46, 32), pearlWhiteMat);
    dialFace.position.set(0, 0.15, 0.59);
    // Scale arc ticks (-, 0, +)
    for (let a = -60; a <= 60; a += 20) {
      const rad = (a * Math.PI) / 180;
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.09, 0.02),
        a === 0 ? tealAccentMat : a > 0 ? northPoleMat : southPoleMat
      );
      tick.position.set(Math.sin(rad) * 0.36, 0.05 + Math.cos(rad) * 0.36, 0.6);
      tick.rotation.z = -rad;
      galvanoGroup.add(tick);
    }
    // Pivoting needle group
    const needleGroup = new THREE.Group();
    needleGroup.position.set(0, 0.02, 0.61);
    const pivotHub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16), charcoalMat);
    pivotHub.rotation.x = Math.PI / 2;
    const pointerBlade = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.42, 12), northPoleMat);
    pointerBlade.position.y = 0.21;
    needleGroup.add(pivotHub, pointerBlade);
    handles.faradayGalvanoNeedle = needleGroup;
    // Binding posts
    const postPos = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 16), northPoleMat);
    postPos.rotation.x = Math.PI / 2;
    postPos.position.set(0.35, -0.52, 0.56);
    const postNeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 16), southPoleMat);
    postNeg.rotation.x = Math.PI / 2;
    postNeg.position.set(-0.35, -0.52, 0.56);
    galvanoGroup.add(meterBody, meterBezel, dialFace, needleGroup, postPos, postNeg);
    rootGroup.add(galvanoGroup);
    registerPartGroup('center-zero-galvanometer', galvanoGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.85, 0]);
  }

  // =========================================================================
  // MODEL 49: ELECTRIC MOTOR & GENERATOR: ENERGY CONVERSION EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'motor-generator-energy-explorer') {
    // 1. Stator Frame, Baseplate & Bearing Pillow Blocks ('stator-frame-assembly')
    const statorFrameGroup = new THREE.Group();
    const baseDeck = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.26, 3.8), charcoalMat);
    baseDeck.position.set(0.3, -1.05, 0);
    const lowerYoke = new THREE.Mesh(
      new THREE.CylinderGeometry(1.75, 1.75, 2.2, 32, 1, false, Math.PI * 0.5, Math.PI),
      lightGraphiteMat
    );
    lowerYoke.rotation.x = Math.PI / 2;
    lowerYoke.position.set(-0.6, 0.35, -0.35);
    const upperYokeCutaway = new THREE.Mesh(
      new THREE.CylinderGeometry(1.78, 1.78, 2.2, 32, 1, true, -Math.PI * 0.5, Math.PI),
      clearGlassMat
    );
    upperYokeCutaway.rotation.x = Math.PI / 2;
    upperYokeCutaway.position.set(-0.6, 0.35, -0.35);
    handles.mgStatorUpperShell = upperYokeCutaway;

    const frontPillow = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.35, 0.28), satinSilverMat);
    frontPillow.position.set(-0.6, -0.25, 1.85);
    const rearPillow = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.35, 0.28), satinSilverMat);
    rearPillow.position.set(-0.6, -0.25, -1.95);
    statorFrameGroup.add(baseDeck, lowerYoke, upperYokeCutaway, frontPillow, rearPillow);
    rootGroup.add(statorFrameGroup);
    registerPartGroup('stator-frame-assembly', statorFrameGroup, modelSpec, meshMap, interactiveMeshes, [-0.6, -0.85, 0]);

    // 2. Curved Stator Permanent Magnets N & S ('stator-field-magnets')
    const statorMagnetsGroup = new THREE.Group();
    const northShoe = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.55, 1.9), northPoleMat);
    northShoe.position.set(-1.95, 0.35, -0.35);
    const southShoe = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.55, 1.9), southPoleMat);
    southShoe.position.set(0.75, 0.35, -0.35);
    // Air-gap magnetic field lines (N -> S)
    for (const dy of [-0.45, 0, 0.45]) {
      const fLine = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 2.1, 10), skyBlueAccentMat);
      fLine.rotation.z = Math.PI / 2;
      fLine.position.set(-0.6, 0.35 + dy, -0.35);
      statorMagnetsGroup.add(fLine);
    }
    statorMagnetsGroup.add(northShoe, southShoe);
    rootGroup.add(statorMagnetsGroup);
    registerPartGroup('stator-field-magnets', statorMagnetsGroup, modelSpec, meshMap, interactiveMeshes, [-1.95, 0.95, -0.35]);

    // Master Rotating Rotor Hierarchy
    const mgRotor = new THREE.Group();
    mgRotor.position.set(-0.6, 0.35, 0);
    handles.mgRotorGroup = mgRotor;
    rootGroup.add(mgRotor);

    // 3. Laminated Rotor Core ('rotor-core-assembly')
    const rotorCoreGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const lam = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.18, 24), satinSilverMat);
      lam.rotation.x = Math.PI / 2;
      lam.position.set(0, 0, -1.05 + i * 0.21);
      rotorCoreGroup.add(lam);
    }
    mgRotor.add(rotorCoreGroup);
    registerPartGroup('rotor-core-assembly', rotorCoreGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.55, -0.35]);

    // 4. Multi-Turn Copper Armature Winding Coil ('armature-winding-coil')
    const armatureCoilGroup = new THREE.Group();
    const coilLoop1 = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.14, 1.85), satinCopperMat);
    coilLoop1.position.set(0, 0, -0.35);
    const coilLoop2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.68, 1.85), satinCopperMat);
    coilLoop2.position.set(0, 0, -0.35);
    armatureCoilGroup.add(coilLoop1, coilLoop2);
    mgRotor.add(armatureCoilGroup);
    registerPartGroup('armature-winding-coil', armatureCoilGroup, modelSpec, meshMap, interactiveMeshes, [0.75, 0.35, -0.35]);

    // 5. Central Rotor Shaft & Mechanical Pulley ('central-rotor-shaft')
    const shaftGroup = new THREE.Group();
    const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 4.4, 24), pearlWhiteMat);
    spindle.rotation.x = Math.PI / 2;
    spindle.position.set(0, 0, -0.1);
    const rearPulley = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.22, 28), tealAccentMat);
    rearPulley.rotation.x = Math.PI / 2;
    rearPulley.position.set(0, 0, -2.25);
    shaftGroup.add(spindle, rearPulley);
    mgRotor.add(shaftGroup);
    registerPartGroup('central-rotor-shaft', shaftGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.15, -2.1]);

    // 6. Split-Ring Commutator ('split-ring-commutator')
    const commutatorGroup = new THREE.Group();
    commutatorGroup.position.set(0, 0, 1.15);
    const halfRingA = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.46, 24, 1, false, 0.12, Math.PI - 0.24),
      satinCopperMat
    );
    halfRingA.rotation.x = Math.PI / 2;
    const halfRingB = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.46, 24, 1, false, Math.PI + 0.12, Math.PI - 0.24),
      satinCopperMat
    );
    halfRingB.rotation.x = Math.PI / 2;
    const coreHub = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.5, 20), charcoalMat);
    coreHub.rotation.x = Math.PI / 2;
    commutatorGroup.add(halfRingA, halfRingB, coreHub);
    mgRotor.add(commutatorGroup);
    handles.mgCommutatorGroup = commutatorGroup;
    registerPartGroup('split-ring-commutator', commutatorGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.42, 0]);

    // 7. Stationary Carbon Brushes ('carbon-brush-contacts')
    const brushesGroup = new THREE.Group();
    brushesGroup.position.set(-0.6, 0.35, 1.15);
    const leftBrush = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.36), charcoalMat);
    leftBrush.position.set(-0.5, 0, 0);
    const rightBrush = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.36), charcoalMat);
    rightBrush.position.set(0.5, 0, 0);
    const leftHolder = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.42), satinSilverMat);
    leftHolder.position.set(-0.72, 0, 0);
    const rightHolder = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.42), satinSilverMat);
    rightHolder.position.set(0.72, 0, 0);
    brushesGroup.add(leftBrush, rightBrush, leftHolder, rightHolder);
    rootGroup.add(brushesGroup);
    registerPartGroup('carbon-brush-contacts', brushesGroup, modelSpec, meshMap, interactiveMeshes, [-0.55, -0.3, 0.2]);

    // 8. External Circuit Console & Load/Supply Indicator ('external-circuit-indicator')
    const consoleGroup = new THREE.Group();
    consoleGroup.position.set(2.45, -0.15, 0.35);
    const consoleCabinet = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.35, 1.45), softOffWhiteMat);
    const lampPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.22, 24), satinSilverMat);
    lampPedestal.position.set(0, 0.78, 0);
    const lampGlobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.5,
        roughness: 0.18,
      })
    );
    lampGlobe.position.set(0, 1.08, 0);
    handles.mgLoadLampMesh = lampGlobe;
    // Conductive buses from brushes to console
    const busBarA = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 12), satinCopperMat);
    busBarA.rotation.z = Math.PI / 2;
    busBarA.position.set(-1.35, 0.35, 0.55);
    const busBarB = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 12), satinCopperMat);
    busBarB.rotation.z = Math.PI / 2;
    busBarB.position.set(-1.35, 0.15, 0.55);
    consoleGroup.add(consoleCabinet, lampPedestal, lampGlobe, busBarA, busBarB);
    rootGroup.add(consoleGroup);
    registerPartGroup('external-circuit-indicator', consoleGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.95, 0]);
  }

  // =========================================================================
  // MODEL 50: ELECTRICAL TRANSFORMER: AC VOLTAGE AND MAGNETIC COUPLING EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'ac-voltage-transformer-explorer') {
    // 1. Base Platform
    const basePlatform = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.26, 3.8), charcoalMat);
    basePlatform.position.set(0.1, -1.1, 0);
    rootGroup.add(basePlatform);

    // 2. Laminated Silicon-Steel Core ('laminated-magnetic-core')
    const coreGroup = new THREE.Group();
    coreGroup.position.set(-0.65, 0.25, 0);
    const numLaminations = 7;
    for (let i = 0; i < numLaminations; i++) {
      const z = -0.36 + i * 0.12;
      const mat = i % 2 === 0 ? lightGraphiteMat : satinSilverMat;
      const topYoke = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.48, 0.095), mat);
      topYoke.position.set(0, 0.96, z);
      const botYoke = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.48, 0.095), mat);
      botYoke.position.set(0, -0.96, z);
      const leftLimb = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.48, 0.095), mat);
      leftLimb.position.set(-1.29, 0, z);
      const rightLimb = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.48, 0.095), mat);
      rightLimb.position.set(1.29, 0, z);
      coreGroup.add(topYoke, botYoke, leftLimb, rightLimb);
    }
    // Front protective core plate toggled by internalView cutaway
    const frontCoverPlate = new THREE.Mesh(new THREE.BoxGeometry(3.15, 2.42, 0.08), charcoalMat);
    frontCoverPlate.position.set(0, 0, 0.44);
    handles.txCoreCutawayCover = frontCoverPlate;
    coreGroup.add(frontCoverPlate);

    // Mutual Magnetic Flux Loop inside the core
    const fluxPts = [
      new THREE.Vector3(-1.29, -0.96, 0.46),
      new THREE.Vector3(-1.29, 0.96, 0.46),
      new THREE.Vector3(1.29, 0.96, 0.46),
      new THREE.Vector3(1.29, -0.96, 0.46),
      new THREE.Vector3(-1.29, -0.96, 0.46),
    ];
    const fluxLoopGeo = new THREE.BufferGeometry().setFromPoints(fluxPts);
    const fluxLoopLine = new THREE.Line(
      fluxLoopGeo,
      new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 })
    );
    handles.txFluxLoopLine = fluxLoopLine;
    coreGroup.add(fluxLoopLine);
    for (let i = 0; i < 8; i++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), skyBlueAccentMat);
      coreGroup.add(dot);
      handles.txFluxDots.push(dot);
    }
    rootGroup.add(coreGroup);
    registerPartGroup('laminated-magnetic-core', coreGroup, modelSpec, meshMap, interactiveMeshes, [0, 1.15, 0]);

    // 3. Primary AC Winding Coil ('primary-copper-winding')
    const primaryWindingGroup = new THREE.Group();
    primaryWindingGroup.position.set(-1.94, 0.25, 0);
    const pBobbin = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.42, 1.02), pearlWhiteMat);
    primaryWindingGroup.add(pBobbin);
    for (let i = 0; i < 16; i++) {
      const y = -0.62 + (i / 15) * 1.24;
      const turn = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.055, 1.14), satinCopperMat);
      turn.position.y = y;
      primaryWindingGroup.add(turn);
      handles.txPrimaryTurns.push(turn);
    }
    rootGroup.add(primaryWindingGroup);
    registerPartGroup('primary-copper-winding', primaryWindingGroup, modelSpec, meshMap, interactiveMeshes, [-0.5, 0.2, 0]);

    // 4. Secondary Induced Winding Coil ('secondary-copper-winding')
    const secondaryWindingGroup = new THREE.Group();
    secondaryWindingGroup.position.set(0.64, 0.25, 0);
    const sBobbin = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.42, 1.02), pearlWhiteMat);
    secondaryWindingGroup.add(sBobbin);
    for (let i = 0; i < 16; i++) {
      const y = -0.62 + (i / 15) * 1.24;
      const turn = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.055, 1.14), tealAccentMat);
      turn.position.y = y;
      secondaryWindingGroup.add(turn);
      handles.txSecondaryTurns.push(turn);
    }
    rootGroup.add(secondaryWindingGroup);
    registerPartGroup('secondary-copper-winding', secondaryWindingGroup, modelSpec, meshMap, interactiveMeshes, [0.5, 0.2, 0]);

    // 5. Primary AC Input Terminals ('primary-ac-terminals')
    const primaryTerminalsGroup = new THREE.Group();
    primaryTerminalsGroup.position.set(-2.95, -0.55, 0.55);
    const pBlock = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.65, 0.85), softOffWhiteMat);
    const pPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.28, 16), satinCopperMat);
    pPost1.position.set(-0.22, 0.42, 0);
    const pPost2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.28, 16), satinCopperMat);
    pPost2.position.set(0.22, 0.42, 0);
    primaryTerminalsGroup.add(pBlock, pPost1, pPost2);
    rootGroup.add(primaryTerminalsGroup);
    registerPartGroup('primary-ac-terminals', primaryTerminalsGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.45, 0]);

    // 6. Secondary Output Terminals ('secondary-output-terminals')
    const secondaryTerminalsGroup = new THREE.Group();
    secondaryTerminalsGroup.position.set(1.65, -0.55, 0.55);
    const sBlock = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.65, 0.85), softOffWhiteMat);
    const sPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.28, 16), tealAccentMat);
    sPost1.position.set(-0.22, 0.42, 0);
    const sPost2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.28, 16), tealAccentMat);
    sPost2.position.set(0.22, 0.42, 0);
    secondaryTerminalsGroup.add(sBlock, sPost1, sPost2);
    rootGroup.add(secondaryTerminalsGroup);
    registerPartGroup('secondary-output-terminals', secondaryTerminalsGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.45, 0]);

    // 7. Switchable Secondary Load ('selectable-secondary-load')
    const loadGroup = new THREE.Group();
    loadGroup.position.set(2.85, -0.45, 0.55);
    const loadBase = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.78, 0.9), charcoalMat);
    const resistorCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.75, 20), amberAccentMat);
    resistorCylinder.rotation.z = Math.PI / 2;
    resistorCylinder.position.set(0, 0.52, -0.15);
    handles.txLoadIndicatorGlow = resistorCylinder;
    const knifeLever = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.07, 0.1), satinSilverMat);
    knifeLever.position.set(-0.15, 0.48, 0.25);
    handles.txLoadSwitchLever = knifeLever;
    loadGroup.add(loadBase, resistorCylinder, knifeLever);
    rootGroup.add(loadGroup);
    registerPartGroup('selectable-secondary-load', loadGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.65, 0]);

    // 8. Dual-Trace AC Waveform & Measurement Display ('waveform-measurement-display')
    const scopeGroup = new THREE.Group();
    scopeGroup.position.set(2.45, 0.95, -0.45);
    const scopeCasing = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.5, 0.42), charcoalMat);
    const scopeScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.88, 1.18),
      new THREE.MeshBasicMaterial({ color: 0x0f172a })
    );
    scopeScreen.position.z = 0.22;
    scopeGroup.add(scopeCasing, scopeScreen);

    const numScopePts = 64;
    const pWaveGeo = new THREE.BufferGeometry();
    pWaveGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(numScopePts * 3), 3));
    const sWaveGeo = new THREE.BufferGeometry();
    sWaveGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(numScopePts * 3), 3));
    const pWaveLine = new THREE.Line(pWaveGeo, new THREE.LineBasicMaterial({ color: 0xf59e0b }));
    const sWaveLine = new THREE.Line(sWaveGeo, new THREE.LineBasicMaterial({ color: 0x2dd4bf }));
    scopeGroup.add(pWaveLine, sWaveLine);
    handles.txPrimaryWaveLine = pWaveLine;
    handles.txSecondaryWaveLine = sWaveLine;
    rootGroup.add(scopeGroup);
    registerPartGroup('waveform-measurement-display', scopeGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.65, 0.2]);
  }

  // =========================================================================
  // MODEL 51: WAVE INTERFERENCE & DIFFRACTION LABORATORY
  // =========================================================================
  if (modelSpec.functionalType === 'wave-interference-diffraction-lab') {
    // 1. Wave Propagation Tank Basin & Dynamic 64x64 Wave Surface ('ripple-wave-tank')
    const tankGroup = new THREE.Group();
    const basinFloor = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.18, 4.6), charcoalMat);
    basinFloor.position.set(-0.2, -0.22, 0);
    const railNorth = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.36, 0.14), satinSilverMat);
    railNorth.position.set(-0.2, -0.05, -2.35);
    const railSouth = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.36, 0.14), satinSilverMat);
    railSouth.position.set(-0.2, -0.05, 2.35);
    const railWest = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.36, 4.8), satinSilverMat);
    railWest.position.set(-3.4, -0.05, 0);

    // 56x56 Performant Vertex-Displaced Scalar Wave Heightfield
    const waveGeo = new THREE.PlaneGeometry(5.6, 4.2, 56, 56);
    waveGeo.rotateX(-Math.PI / 2);
    const waveMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.24,
      roughness: 0.18,
      metalness: 0.25,
      side: THREE.DoubleSide,
    });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    waveMesh.position.set(-0.15, 0.02, 0);
    handles.waveSurfaceMesh = waveMesh;

    // Constructive/Destructive Nodal Guide Rays
    const nodalGuides = new THREE.Group();
    nodalGuides.position.set(-0.15, 0.14, 0);
    for (const angle of [-0.38, 0, 0.38]) {
      const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 4.8, 8), pearlWhiteMat);
      ray.rotation.z = Math.PI / 2;
      ray.rotation.y = angle;
      nodalGuides.add(ray);
    }
    handles.waveNodalGuides = nodalGuides;

    tankGroup.add(basinFloor, railNorth, railSouth, railWest, waveMesh, nodalGuides);
    rootGroup.add(tankGroup);
    registerPartGroup('ripple-wave-tank', tankGroup, modelSpec, meshMap, interactiveMeshes, [-1.5, -0.15, 2.1]);

    // 2. Dual Coherent Wave Sources S1 & S2 ('coherent-wave-sources')
    const sourcesGroup = new THREE.Group();
    const gantryBar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 4.2), lightGraphiteMat);
    gantryBar.position.set(-2.75, 0.72, 0);
    const s1Dipper = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.08, 0.75, 20), tealAccentMat);
    s1Dipper.position.set(-2.75, 0.35, -0.8);
    const s2Dipper = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.08, 0.75, 20), tealAccentMat);
    s2Dipper.position.set(-2.75, 0.35, 0.8);
    handles.waveSource1Dipper = s1Dipper;
    handles.waveSource2Dipper = s2Dipper;
    sourcesGroup.add(gantryBar, s1Dipper, s2Dipper);
    rootGroup.add(sourcesGroup);
    registerPartGroup('coherent-wave-sources', sourcesGroup, modelSpec, meshMap, interactiveMeshes, [-2.75, 0.75, -0.8]);

    // 3. Adjustable Slit Diffraction Barrier ('slit-diffraction-barrier')
    const barrierGroup = new THREE.Group();
    const jawLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.52, 1.65), satinSilverMat);
    jawLeft.position.set(-0.95, 0.16, -1.35);
    const jawRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.52, 1.65), satinSilverMat);
    jawRight.position.set(-0.95, 0.16, 1.35);
    handles.waveBarrierLeftJaw = jawLeft;
    handles.waveBarrierRightJaw = jawRight;
    barrierGroup.add(jawLeft, jawRight);
    rootGroup.add(barrierGroup);
    registerPartGroup('slit-diffraction-barrier', barrierGroup, modelSpec, meshMap, interactiveMeshes, [-0.95, 0.45, -1.35]);

    // 4. Variable-Width Aperture Slit Opening ('adjustable-aperture-slit')
    const apertureGroup = new THREE.Group();
    const apertureFrame = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 1.0), clearGlassMat);
    apertureFrame.position.set(-0.95, 0.18, 0);
    handles.waveApertureMarker = apertureFrame;
    apertureGroup.add(apertureFrame);
    rootGroup.add(apertureGroup);
    registerPartGroup('adjustable-aperture-slit', apertureGroup, modelSpec, meshMap, interactiveMeshes, [-0.95, 0.48, 0]);

    // 5. Movable Diffraction Obstacle ('movable-diffraction-obstacle')
    const obstacleGroup = new THREE.Group();
    const obsMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.56, 0.85), amberAccentMat);
    obsMesh.position.set(0.15, 0.18, 0);
    handles.waveObstacleMesh = obsMesh;
    obstacleGroup.add(obsMesh);
    rootGroup.add(obstacleGroup);
    registerPartGroup('movable-diffraction-obstacle', obstacleGroup, modelSpec, meshMap, interactiveMeshes, [0.15, 0.52, 0]);

    // 6. Downstream Receiving Detector Plane ('detector-receiving-plane')
    const detectorGroup = new THREE.Group();
    const detectorWall = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.72, 4.4), lightGraphiteMat);
    detectorWall.position.set(2.7, 0.22, 0);
    detectorGroup.add(detectorWall);
    rootGroup.add(detectorGroup);
    registerPartGroup('detector-receiving-plane', detectorGroup, modelSpec, meshMap, interactiveMeshes, [2.7, 0.65, -1.2]);

    // 7. Interference Intensity Profile I(y) ('interference-intensity-profile')
    const intensityGroup = new THREE.Group();
    intensityGroup.position.set(3.05, 0.05, 0);
    const numBars = 29;
    for (let i = 0; i < numBars; i++) {
      const z = -2.0 + (i / (numBars - 1)) * 4.0;
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.0, 0.11), skyBlueAccentMat);
      bar.position.set(0, 0.5, z);
      intensityGroup.add(bar);
      handles.waveIntensityBars.push(bar);
    }
    rootGroup.add(intensityGroup);
    registerPartGroup('interference-intensity-profile', intensityGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.95, 0]);
  }

  // =========================================================================
  // MODEL 52: OPTICAL INTERFERENCE & INTERFEROMETER EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'optical-interferometer-explorer') {
    // 1. Optical Breadboard Table
    const breadboard = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.24, 6.4), charcoalMat);
    breadboard.position.set(0, -0.25, 0);
    rootGroup.add(breadboard);

    // 2. Coherent Laser Emitter & Collimator ('coherent-laser-source')
    const laserGroup = new THREE.Group();
    laserGroup.position.set(-2.65, 0.42, 0);
    const laserBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.45, 28), lightGraphiteMat);
    laserBarrel.rotation.z = Math.PI / 2;
    const apertureRing = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.12, 28), satinSilverMat);
    apertureRing.rotation.z = Math.PI / 2;
    apertureRing.position.x = 0.72;
    const laserPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.55, 16), satinSilverMat);
    laserPost.position.y = -0.4;
    laserGroup.add(laserBarrel, apertureRing, laserPost);
    rootGroup.add(laserGroup);
    registerPartGroup('coherent-laser-source', laserGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.5, 0]);

    // 3. Central 45° Beam Splitter ('central-beam-splitter')
    const splitterGroup = new THREE.Group();
    splitterGroup.position.set(0, 0.42, 0);
    const splitterGlass = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.1), clearGlassMat);
    splitterGlass.rotation.y = Math.PI / 4;
    const splitterFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 24), satinSilverMat);
    splitterFrame.position.y = -0.46;
    splitterGroup.add(splitterGlass, splitterFrame);
    rootGroup.add(splitterGroup);
    registerPartGroup('central-beam-splitter', splitterGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.62, 0]);

    // 4. Fixed Reference Mirror M1 ('fixed-reference-mirror')
    const m1Group = new THREE.Group();
    m1Group.position.set(0, 0.42, -2.45);
    const m1Mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.14, 32), pearlWhiteMat);
    m1Mirror.rotation.x = Math.PI / 2;
    const m1Mount = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.15, 0.22), charcoalMat);
    m1Mount.position.z = -0.14;
    m1Group.add(m1Mirror, m1Mount);
    rootGroup.add(m1Group);
    registerPartGroup('fixed-reference-mirror', m1Group, modelSpec, meshMap, interactiveMeshes, [0, 0.65, 0]);

    // 5. Micrometer-Driven Movable Mirror M2 ('movable-delay-mirror')
    const m2Group = new THREE.Group();
    m2Group.position.set(2.45, 0.42, 0);
    const m2Mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.14, 32), pearlWhiteMat);
    m2Mirror.rotation.z = Math.PI / 2;
    const m2Stage = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 1.15), satinSilverMat);
    m2Stage.position.set(0.15, -0.45, 0);
    const micrometerBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.65, 20), satinCopperMat);
    micrometerBarrel.rotation.z = Math.PI / 2;
    micrometerBarrel.position.set(0.65, -0.42, 0);
    m2Group.add(m2Mirror, m2Stage, micrometerBarrel);
    handles.optMovableMirrorGroup = m2Group;
    rootGroup.add(m2Group);
    registerPartGroup('movable-delay-mirror', m2Group, modelSpec, meshMap, interactiveMeshes, [0, 0.65, 0]);

    // 6. Coherent Optical Arm Beams & Wavefront Markers ('optical-arm-paths')
    const beamGroup = new THREE.Group();
    beamGroup.position.set(0, 0.42, 0);
    const beamInput = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.0, 16), emeraldAccentMat);
    beamInput.rotation.z = Math.PI / 2;
    beamInput.position.set(-1.0, 0, 0);
    const beamArm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 16), emeraldAccentMat);
    beamArm1.rotation.x = Math.PI / 2;
    beamArm1.position.set(0, 0, -1.2);
    const beamArm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 16), emeraldAccentMat);
    beamArm2.rotation.z = Math.PI / 2;
    beamArm2.position.set(1.2, 0, 0);
    const beamOutput = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 16), emeraldAccentMat);
    beamOutput.rotation.x = Math.PI / 2;
    beamOutput.position.set(0, 0, 1.2);
    handles.optBeamMeshes.push(beamInput, beamArm1, beamArm2, beamOutput);
    beamGroup.add(beamInput, beamArm1, beamArm2, beamOutput);

    // Phase wavefront rings along Arm 2 and Output
    for (let i = 0; i < 8; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.018, 10, 24), emeraldAccentMat);
      if (i < 4) {
        ring.rotation.y = Math.PI / 2;
        ring.position.set(0.5 + i * 0.45, 0, 0);
      } else {
        ring.position.set(0, 0, 0.5 + (i - 4) * 0.45);
      }
      beamGroup.add(ring);
      handles.optWaveCrestRings.push(ring);
    }
    handles.optBeamGroup = beamGroup;
    rootGroup.add(beamGroup);
    registerPartGroup('optical-arm-paths', beamGroup, modelSpec, meshMap, interactiveMeshes, [1.2, 0.25, 0]);

    // 7. Compensator Plate & Recombination Zone ('recombination-compensator')
    const compGroup = new THREE.Group();
    compGroup.position.set(0.62, 0.42, 0);
    const compGlass = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.09), clearGlassMat);
    compGlass.rotation.y = Math.PI / 4;
    const compBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.16, 16), satinSilverMat);
    compBase.position.y = -0.44;
    compGroup.add(compGlass, compBase);
    rootGroup.add(compGroup);
    registerPartGroup('recombination-compensator', compGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.55, 0]);

    // 8. Interferogram Detector Screen & Fringe Rings ('interferogram-detector-screen')
    const screenGroup = new THREE.Group();
    screenGroup.position.set(0, 0.52, 2.55);
    const screenBacking = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 0.96, 0.16, 36), charcoalMat);
    screenBacking.rotation.x = Math.PI / 2;
    screenGroup.add(screenBacking);

    // Concentric Haidinger interference rings
    const centralSpot = new THREE.Mesh(
      new THREE.CircleGeometry(0.18, 32),
      new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide })
    );
    centralSpot.position.z = -0.09;
    screenGroup.add(centralSpot);
    handles.optFringeRings.push(centralSpot);

    for (let r = 1; r <= 4; r++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.18 * r + 0.03, 0.18 * (r + 0.72), 36),
        new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
      );
      ring.position.z = -0.092;
      screenGroup.add(ring);
      handles.optFringeRings.push(ring);
    }

    // Linear tilt fringe bars (visible when fringeMode === 'linear_tilt_fringes')
    for (let b = -3; b <= 3; b++) {
      const bar = new THREE.Mesh(
        new THREE.PlaneGeometry(0.12, 1.35),
        new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
      );
      bar.position.set(b * 0.21, 0, -0.095);
      bar.visible = false;
      screenGroup.add(bar);
      handles.optLinearFringeBars.push(bar);
    }
    rootGroup.add(screenGroup);
    registerPartGroup('interferogram-detector-screen', screenGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.95, 0]);
  }

  // =========================================================================
  // MODEL 53: FLUID DYNAMICS: BERNOULLI, PRESSURE & VORTEX FLOW EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'fluid-dynamics-bernoulli-vortex') {
    // 1. Support Bench & Cradles ('venturi-flow-pipe')
    const pipeSupportGroup = new THREE.Group();
    const benchBase = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.24, 3.0), charcoalMat);
    benchBase.position.set(0, -1.15, 0);
    const outerGlassTube = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.84, 6.4, 32, 1, true), clearGlassMat);
    outerGlassTube.rotation.z = Math.PI / 2;
    outerGlassTube.position.set(0, 0.05, 0);
    handles.fluidVenturiOuterShell = outerGlassTube;
    pipeSupportGroup.add(benchBase, outerGlassTube);
    rootGroup.add(pipeSupportGroup);
    registerPartGroup('venturi-flow-pipe', pipeSupportGroup, modelSpec, meshMap, interactiveMeshes, [-1.4, -0.75, 0]);

    // 2. Wide Inlet Chamber ('wide-inlet-chamber')
    const inletGroup = new THREE.Group();
    inletGroup.position.set(-2.45, 0.05, 0);
    const inletSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 1.5, 32), satinSilverMat);
    inletSleeve.rotation.z = Math.PI / 2;
    const inletFlange = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.16, 32), lightGraphiteMat);
    inletFlange.rotation.z = Math.PI / 2;
    inletFlange.position.x = -0.75;
    inletGroup.add(inletSleeve, inletFlange);
    rootGroup.add(inletGroup);
    registerPartGroup('wide-inlet-chamber', inletGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.9, 0]);

    // 3. Variable-Area Constricted Venturi Throat ('constricted-throat-section')
    const throatGroup = new THREE.Group();
    throatGroup.position.set(0, 0.05, 0);
    const throatMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 1.55, 32), tealAccentMat);
    throatMesh.rotation.z = Math.PI / 2;
    handles.fluidThroatCollar = throatMesh;
    throatGroup.add(throatMesh);
    rootGroup.add(throatGroup);
    registerPartGroup('constricted-throat-section', throatGroup, modelSpec, meshMap, interactiveMeshes, [0, -0.65, 0]);

    // 4. Downstream Diffuser & Outlet ('downstream-outlet-diffuser')
    const outletGroup = new THREE.Group();
    outletGroup.position.set(2.45, 0.05, 0);
    const outletSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 1.5, 32), satinSilverMat);
    outletSleeve.rotation.z = Math.PI / 2;
    const outletFlange = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.16, 32), lightGraphiteMat);
    outletFlange.rotation.z = Math.PI / 2;
    outletFlange.position.x = 0.75;
    outletGroup.add(outletSleeve, outletFlange);
    rootGroup.add(outletGroup);
    registerPartGroup('downstream-outlet-diffuser', outletGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.9, 0]);

    // 5. Vertical Piezometer Manometers P1, P2, P3 ('piezometer-pressure-sensors')
    const manometersGroup = new THREE.Group();
    const xTaps = [-2.1, 0.0, 2.1];
    for (let i = 0; i < 3; i++) {
      const x = xTaps[i];
      const glassTube = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.85, 20), clearGlassMat);
      glassTube.position.set(x, 1.45, 0);
      const liquidCol = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.0, 20), skyBlueAccentMat);
      liquidCol.position.set(x, 1.05, 0);
      manometersGroup.add(glassTube, liquidCol);
      handles.fluidManometerColumns.push(liquidCol);
    }
    rootGroup.add(manometersGroup);
    registerPartGroup('piezometer-pressure-sensors', manometersGroup, modelSpec, meshMap, interactiveMeshes, [0, 2.15, 0]);

    // 6. Streamlines & Velocity Tracer Particles ('streamline-flow-indicators')
    const streamlinesGroup = new THREE.Group();
    const laneOffsets = [
      { y: -0.32, z: 0 },
      { y: 0.0, z: 0.28 },
      { y: 0.32, z: 0 },
      { y: 0.0, z: -0.28 },
    ];
    for (let i = 0; i < 24; i++) {
      const lane = laneOffsets[i % laneOffsets.length];
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), skyBlueAccentMat);
      streamlinesGroup.add(bead);
      handles.fluidTracerParticles.push({
        mesh: bead,
        laneY: lane.y,
        laneZ: lane.z,
        phase: i / 24,
      });
    }
    handles.fluidStreamlinesGroup = streamlinesGroup;
    rootGroup.add(streamlinesGroup);
    registerPartGroup('streamline-flow-indicators', streamlinesGroup, modelSpec, meshMap, interactiveMeshes, [-1.1, 0.35, 0.35]);

    // 7. Bluff-Body Cylinder & Kármán Vortex Street ('vortex-shedding-obstacle')
    const vortexGroup = new THREE.Group();
    const bluffCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.15, 24), amberAccentMat);
    bluffCylinder.rotation.x = Math.PI / 2;
    bluffCylinder.position.set(-0.65, 0.05, 0);
    vortexGroup.add(bluffCylinder);

    for (let v = 0; v < 8; v++) {
      const eddyGroup = new THREE.Group();
      const eddyRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.032, 12, 24), tealAccentMat);
      eddyGroup.add(eddyRing);
      vortexGroup.add(eddyGroup);
      handles.fluidVortexRings.push({
        group: eddyGroup,
        phase: v / 8,
        sign: v % 2 === 0 ? 1 : -1,
      });
    }
    handles.fluidVortexAssembly = vortexGroup;
    rootGroup.add(vortexGroup);
    registerPartGroup('vortex-shedding-obstacle', vortexGroup, modelSpec, meshMap, interactiveMeshes, [0.85, 0.25, 0]);
  }

  // =========================================================================
  // MODEL 54: NUCLEAR FUSION REACTOR: MAGNETIC CONFINEMENT EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'tokamak-fusion-confinement-explorer') {
    const majorR = 2.05;
    const centerPos = new THREE.Vector3(0, 0.35, 0);

    // 1. Toroidal Vacuum Vessel with 120° Front Cutaway Sector ('toroidal-vacuum-vessel')
    const vesselGroup = new THREE.Group();
    vesselGroup.position.copy(centerPos);
    const permanentSector = new THREE.Mesh(
      new THREE.TorusGeometry(majorR, 0.82, 28, 64, (Math.PI * 4) / 3),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.35, metalness: 0.72, side: THREE.DoubleSide })
    );
    permanentSector.rotation.x = Math.PI / 2;
    permanentSector.rotation.z = Math.PI / 6;

    const frontCutawaySector = new THREE.Mesh(
      new THREE.TorusGeometry(majorR, 0.82, 28, 36, (Math.PI * 2) / 3),
      clearGlassMat
    );
    frontCutawaySector.rotation.x = Math.PI / 2;
    frontCutawaySector.rotation.z = -Math.PI / 2;
    handles.tokamakVesselCutawayMesh = frontCutawaySector;
    vesselGroup.add(permanentSector, frontCutawaySector);
    rootGroup.add(vesselGroup);
    registerPartGroup('toroidal-vacuum-vessel', vesselGroup, modelSpec, meshMap, interactiveMeshes, [-2.05, 0.65, 0]);

    // 2. Magnetically Confined High-Temperature Plasma Ring ('confined-plasma-torus')
    const plasmaGroup = new THREE.Group();
    plasmaGroup.position.copy(centerPos);
    const plasmaTorus = new THREE.Mesh(
      new THREE.TorusGeometry(majorR, 0.46, 28, 72),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.65,
        transparent: true,
        opacity: 0.78,
        roughness: 0.15,
      })
    );
    plasmaTorus.rotation.x = Math.PI / 2;
    handles.tokamakPlasmaMesh = plasmaTorus;
    plasmaGroup.add(plasmaTorus);
    rootGroup.add(plasmaGroup);
    registerPartGroup('confined-plasma-torus', plasmaGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.15, 2.05]);

    // 3. 12 Superconducting Toroidal Field (TF) Coils ('toroidal-field-coils')
    const tfGroup = new THREE.Group();
    tfGroup.position.copy(centerPos);
    const numTfCoils = 12;
    for (let i = 0; i < numTfCoils; i++) {
      const phi = (i / numTfCoils) * Math.PI * 2;
      const coil = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.085, 16, 36), satinSilverMat);
      coil.position.set(majorR * Math.cos(phi), 0, majorR * Math.sin(phi));
      coil.rotation.y = -phi;
      tfGroup.add(coil);
    }
    handles.tokamakTfCoilsGroup = tfGroup;
    rootGroup.add(tfGroup);
    registerPartGroup('toroidal-field-coils', tfGroup, modelSpec, meshMap, interactiveMeshes, [2.05, 0.85, 0]);

    // 4. Outer Poloidal Field (PF) Coils ('poloidal-field-coils')
    const pfGroup = new THREE.Group();
    pfGroup.position.copy(centerPos);
    for (const [rPf, yPf] of [
      [3.05, 0.95],
      [3.25, 0.0],
      [3.05, -0.95],
    ]) {
      const pfRing = new THREE.Mesh(new THREE.TorusGeometry(rPf, 0.085, 16, 64), tealAccentMat);
      pfRing.rotation.x = Math.PI / 2;
      pfRing.position.y = yPf;
      pfGroup.add(pfRing);
    }
    handles.tokamakPfCoilsGroup = pfGroup;
    rootGroup.add(pfGroup);
    registerPartGroup('poloidal-field-coils', pfGroup, modelSpec, meshMap, interactiveMeshes, [2.85, 0.95, 0]);

    // 5. Central Solenoid (CS) Transformer Column ('central-ohmic-solenoid')
    const csGroup = new THREE.Group();
    csGroup.position.copy(centerPos);
    const csColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 2.55, 32), satinCopperMat);
    csGroup.add(csColumn);
    for (let k = -4; k <= 4; k++) {
      const pancake = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.045, 12, 32), pearlWhiteMat);
      pancake.rotation.x = Math.PI / 2;
      pancake.position.y = k * 0.25;
      csGroup.add(pancake);
    }
    handles.tokamakCsGroup = csGroup;
    rootGroup.add(csGroup);
    registerPartGroup('central-ohmic-solenoid', csGroup, modelSpec, meshMap, interactiveMeshes, [0, 1.35, 0]);

    // 6. Helical Magnetic Confinement Field Lines ('helical-magnetic-field-lines')
    const helicalGroup = new THREE.Group();
    helicalGroup.position.copy(centerPos);
    for (let h = 0; h < 2; h++) {
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(180 * 3), 3));
      const lineMat = new THREE.LineBasicMaterial({ color: h === 0 ? 0x93c5fd : 0x5eead4 });
      const line = new THREE.Line(lineGeo, lineMat);
      helicalGroup.add(line);
      handles.tokamakHelicalLines.push(line);
    }
    handles.tokamakHelicalLinesGroup = helicalGroup;
    rootGroup.add(helicalGroup);
    registerPartGroup('helical-magnetic-field-lines', helicalGroup, modelSpec, meshMap, interactiveMeshes, [-1.45, 0.55, 1.45]);

    // 7. Lower Magnetic Divertor & Equatorial Diagnostics ('divertor-diagnostic-array')
    const divertorGroup = new THREE.Group();
    divertorGroup.position.copy(centerPos);
    const divertorRing = new THREE.Mesh(new THREE.TorusGeometry(majorR, 0.16, 16, 56), charcoalMat);
    divertorRing.rotation.x = Math.PI / 2;
    divertorRing.position.y = -0.68;
    const diagPort = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.95, 20), satinSilverMat);
    diagPort.rotation.z = Math.PI / 2;
    diagPort.position.set(-3.1, 0, 0);
    divertorGroup.add(divertorRing, diagPort);
    rootGroup.add(divertorGroup);
    registerPartGroup('divertor-diagnostic-array', divertorGroup, modelSpec, meshMap, interactiveMeshes, [0, -0.75, 2.05]);
  }

  return handles;
}

/**
 * Real-time physics and geometry update loop for Advanced Physics Batch 2 (Models 48–54).
 */
export function updateBatch2CustomAssemblies(
  handles: Batch2SceneHandles,
  modelSpec: ScientificModelSpec,
  parameters: Record<string, number>,
  conditions: Record<string, any>,
  simTime: number,
  meshMapOrPlaying?: Map<string, THREE.Object3D> | boolean,
  isPlayingParam = true
) {
  const isPlaying = typeof meshMapOrPlaying === 'boolean' ? meshMapOrPlaying : isPlayingParam;
  // =========================================================================
  // MODEL 48: FARADAY'S LAW: ELECTROMAGNETIC INDUCTION EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'faraday-law-induction-explorer') {
    const m = calculateFaradayInductionMetrics({
      magnetPosition: parameters.magnetPosition,
      magnetVelocity: parameters.magnetVelocity,
      magneticFieldStrength: parameters.magneticFieldStrength,
      coilTurns: parameters.coilTurns,
      reverseDirection: Boolean(conditions.reverseDirection),
      simTime,
      isPlaying,
    });

    if (handles.faradayMagnetAssembly) {
      handles.faradayMagnetAssembly.position.x = m.magnetPositionCm * 0.65;
    }

    if (handles.faradayFormerCutaway) {
      handles.faradayFormerCutaway.visible = conditions.internalView === false;
    }

    // Show/hide active coil turns proportional to N (20 to 200 turns)
    const activeTurnCount = Math.max(4, Math.min(20, Math.round(m.coilTurnsN / 10)));
    handles.faradayWindingsMesh.forEach((turn, idx) => {
      turn.visible = idx < activeTurnCount;
    });

    // Deflect center-zero galvanometer needle proportionally to induced EMF
    if (handles.faradayGalvanoNeedle) {
      const maxAngleRad = 0.95;
      const targetAngle = Math.max(-maxAngleRad, Math.min(maxAngleRad, -m.inducedEmfVolts * 0.22));
      handles.faradayGalvanoNeedle.rotation.z = targetAngle;
    }

    // Scale magnetic flux loops with B0
    const bScale = 0.75 + m.magneticFieldTesla * 0.25;
    handles.faradayFluxLines.forEach((line) => {
      line.scale.set(1, bScale, bScale);
    });

    // Lenz opposing field ring brightness proportional to |E|
    if (handles.faradayLenzRing) {
      const mat = handles.faradayLenzRing.material as THREE.MeshStandardMaterial;
      const intensity = Math.min(1.0, Math.abs(m.inducedEmfVolts) * 0.35);
      mat.opacity = 0.25 + intensity * 0.75;
    }
  }

  // =========================================================================
  // MODEL 49: ELECTRIC MOTOR & GENERATOR: ENERGY CONVERSION EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'motor-generator-energy-explorer') {
    const m = calculateMotorGeneratorMetrics({
      operatingMode: conditions.operatingMode,
      supplyVoltage: parameters.supplyVoltage,
      mechanicalInputRpm: parameters.mechanicalInputRpm,
      magneticFieldT: parameters.magneticFieldT,
      loadResistanceOhm: parameters.loadResistanceOhm,
      reverseDirection: Boolean(conditions.reverseDirection),
      loadConnected: conditions.loadConnected !== false,
    });

    if (handles.mgStatorUpperShell) {
      handles.mgStatorUpperShell.visible = conditions.internalView === false;
    }

    if (handles.mgRotorGroup) {
      const visualOmega = m.angularVelocityRadS * 0.25;
      handles.mgRotorGroup.rotation.z = simTime * visualOmega;
    }

    if (handles.mgLoadLampMesh) {
      const mat = handles.mgLoadLampMesh.material as THREE.MeshStandardMaterial;
      const powerFactor = Math.min(1.2, m.electricalPowerWatts / 18.0);
      if (!mat.userData.isSelectedHighlight) {
        mat.emissiveIntensity = 0.1 + powerFactor * 1.1;
      }
    }
  }

  // =========================================================================
  // MODEL 50: ELECTRICAL TRANSFORMER: AC VOLTAGE AND MAGNETIC COUPLING EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'ac-voltage-transformer-explorer') {
    const m = calculateTransformerCouplingMetrics({
      primaryVoltageV: parameters.primaryVoltageV,
      acFrequencyHz: parameters.acFrequencyHz,
      primaryTurnsNp: parameters.primaryTurnsNp,
      secondaryTurnsNs: parameters.secondaryTurnsNs,
      transformerPreset: conditions.transformerPreset,
      loadConnected: conditions.loadConnected !== false,
    });

    if (handles.txCoreCutawayCover) {
      handles.txCoreCutawayCover.visible = conditions.internalView === false;
    }

    // Active turn counts on primary and secondary limbs
    const pCount = Math.max(4, Math.min(16, Math.round((m.primaryTurnsNp / 500) * 16)));
    handles.txPrimaryTurns.forEach((t, i) => {
      t.visible = i < pCount;
    });
    const sCount = Math.max(4, Math.min(16, Math.round((m.secondaryTurnsNs / 500) * 16)));
    handles.txSecondaryTurns.forEach((t, i) => {
      t.visible = i < sCount;
    });

    // Oscillate magnetic flux dots around core loop when f > 0
    const omegaVis = (m.acFrequencyHz / 60) * 4.5;
    handles.txFluxDots.forEach((dot, idx) => {
      const baseU = idx / handles.txFluxDots.length;
      const osc = m.acFrequencyHz > 0 ? 0.08 * Math.sin(simTime * omegaVis) : 0;
      const u = (baseU + osc + 1) % 1;
      // Map u in [0,1) around rectangle (-1.29..1.29, -0.96..0.96)
      let x = 0;
      let y = 0;
      if (u < 0.25) {
        x = -1.29;
        y = -0.96 + (u / 0.25) * 1.92;
      } else if (u < 0.5) {
        x = -1.29 + ((u - 0.25) / 0.25) * 2.58;
        y = 0.96;
      } else if (u < 0.75) {
        x = 1.29;
        y = 0.96 - ((u - 0.5) / 0.25) * 1.92;
      } else {
        x = 1.29 - ((u - 0.75) / 0.25) * 2.58;
        y = -0.96;
      }
      dot.position.set(x, y, 0.46);
      dot.visible = m.acFrequencyHz > 0;
    });

    if (handles.txLoadSwitchLever) {
      handles.txLoadSwitchLever.rotation.z = conditions.loadConnected !== false ? 0 : 0.55;
    }

    // Update dual-trace oscilloscope waveforms
    if (handles.txPrimaryWaveLine && handles.txSecondaryWaveLine) {
      const pAttr = handles.txPrimaryWaveLine.geometry.getAttribute('position') as THREE.BufferAttribute;
      const sAttr = handles.txSecondaryWaveLine.geometry.getAttribute('position') as THREE.BufferAttribute;
      const numPts = pAttr.count;
      const pAmp = Math.min(0.42, (m.primaryVoltageRmsV / 240) * 0.36);
      const sAmp = Math.min(0.48, (m.loadedSecondaryVoltageV / 240) * 0.36);
      const cycles = Math.max(0, (m.acFrequencyHz / 60) * 2.5);

      for (let i = 0; i < numPts; i++) {
        const frac = i / (numPts - 1);
        const x = -0.82 + frac * 1.64;
        const phase = frac * Math.PI * 2 * cycles - simTime * omegaVis;
        const yp = cycles > 0 ? pAmp * Math.sin(phase) + 0.22 : 0.22;
        const ys = cycles > 0 ? sAmp * Math.sin(phase) - 0.22 : -0.22;
        pAttr.setXYZ(i, x, yp, 0.23);
        sAttr.setXYZ(i, x, ys, 0.23);
      }
      pAttr.needsUpdate = true;
      sAttr.needsUpdate = true;
    }
  }

  // =========================================================================
  // MODEL 51: WAVE INTERFERENCE & DIFFRACTION LABORATORY
  // =========================================================================
  if (modelSpec.functionalType === 'wave-interference-diffraction-lab') {
    const m = calculateWaveInterferenceMetrics({
      experimentMode: conditions.experimentMode,
      sourceFrequencyHz: parameters.sourceFrequencyHz,
      sourceSeparationD: parameters.sourceSeparationD,
      relativePhaseDeg: parameters.relativePhaseDeg,
      waveAmplitude: parameters.waveAmplitude,
      apertureWidth: parameters.apertureWidth,
      obstacleOffset: parameters.obstacleOffset,
    });

    const halfD = m.sourceSeparationD * 0.5;
    const phaseRad = (m.relativePhaseDeg * Math.PI) / 180;
    const k = (2 * Math.PI) / Math.max(0.35, m.wavelengthUnits);
    const omega = 2 * Math.PI * m.frequencyHz;

    if (handles.waveSource1Dipper && handles.waveSource2Dipper) {
      if (m.experimentMode === 'two_source_interference') {
        handles.waveSource1Dipper.position.z = -halfD;
        handles.waveSource2Dipper.position.z = halfD;
        handles.waveSource2Dipper.visible = true;
        handles.waveSource1Dipper.position.y = 0.35 + 0.08 * Math.sin(omega * simTime);
        handles.waveSource2Dipper.position.y = 0.35 + 0.08 * Math.sin(omega * simTime + phaseRad);
      } else {
        handles.waveSource1Dipper.position.z = 0;
        handles.waveSource2Dipper.visible = false;
        handles.waveSource1Dipper.position.y = 0.35 + 0.08 * Math.sin(omega * simTime);
      }
    }

    const showSlit = m.experimentMode === 'single_slit_diffraction';
    const showObs = m.experimentMode === 'single_source_obstacle';

    if (handles.waveBarrierLeftJaw && handles.waveBarrierRightJaw && handles.waveApertureMarker) {
      handles.waveBarrierLeftJaw.visible = showSlit;
      handles.waveBarrierRightJaw.visible = showSlit;
      handles.waveApertureMarker.visible = showSlit;
      const jawOffset = m.apertureWidthA * 0.5 + 0.82;
      handles.waveBarrierLeftJaw.position.z = -jawOffset;
      handles.waveBarrierRightJaw.position.z = jawOffset;
      handles.waveApertureMarker.scale.z = m.apertureWidthA;
    }

    if (handles.waveObstacleMesh) {
      handles.waveObstacleMesh.visible = showObs;
      handles.waveObstacleMesh.position.z = m.obstacleOffset;
    }

    if (handles.waveNodalGuides) {
      handles.waveNodalGuides.visible = conditions.showNodalLines !== false;
    }

    // Displace 2D wave surface vertices
    if (handles.waveSurfaceMesh) {
      const posAttr = handles.waveSurfaceMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      const ampScale = m.waveAmplitude * 0.12;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        let u = 0;
        if (m.experimentMode === 'two_source_interference') {
          const r1 = Math.hypot(vx - -2.6, vz - -halfD) + 0.15;
          const r2 = Math.hypot(vx - -2.6, vz - halfD) + 0.15;
          u =
            (Math.sin(k * r1 - omega * simTime) / Math.sqrt(r1) +
              Math.sin(k * r2 - omega * simTime + phaseRad) / Math.sqrt(r2)) *
            0.85;
        } else if (m.experimentMode === 'single_slit_diffraction') {
          if (vx < -0.8) {
            u = Math.sin(k * (vx + 2.6) - omega * simTime) * 0.7;
          } else {
            // Huygens 5-wavelet superposition across aperture width a
            let sum = 0;
            for (let s = -2; s <= 2; s++) {
              const sz = (s / 2) * (m.apertureWidthA * 0.45);
              const r = Math.hypot(vx - -0.8, vz - sz) + 0.2;
              sum += Math.sin(k * r - omega * simTime) / Math.sqrt(r);
            }
            u = (sum / 3.2);
          }
        } else {
          // Obstacle edge diffraction
          const r0 = Math.hypot(vx - -2.6, vz) + 0.2;
          let shadowFactor = 1.0;
          if (vx > 0.3 && Math.abs(vz - m.obstacleOffset) < 0.45) {
            const distPast = vx - 0.3;
            const heal = Math.min(1.0, (distPast * m.wavelengthUnits) / 1.8);
            shadowFactor = 0.2 + 0.8 * heal;
          }
          u = (Math.sin(k * r0 - omega * simTime) / Math.sqrt(r0)) * shadowFactor * 1.1;
        }
        posAttr.setY(i, u * ampScale);
      }
      posAttr.needsUpdate = true;
      handles.waveSurfaceMesh.geometry.computeVertexNormals();
    }

    // Update downstream intensity bars I(y)
    handles.waveIntensityBars.forEach((bar, idx) => {
      const z = -2.0 + (idx / (handles.waveIntensityBars.length - 1)) * 4.0;
      let intensity = 0.5;
      if (m.experimentMode === 'two_source_interference') {
        const r1 = Math.hypot(5.4, z - -halfD);
        const r2 = Math.hypot(5.4, z - halfD);
        const deltaPhi = k * (r1 - r2) - phaseRad;
        intensity = Math.cos(deltaPhi * 0.5) ** 2;
      } else if (m.experimentMode === 'single_slit_diffraction') {
        const sinTheta = z / Math.hypot(3.6, z);
        const beta = ((Math.PI * m.apertureWidthA) / m.wavelengthUnits) * sinTheta;
        const sinc = Math.abs(beta) < 1e-4 ? 1.0 : Math.sin(beta) / beta;
        intensity = sinc * sinc;
      } else {
        const distFromObs = Math.abs(z - m.obstacleOffset);
        intensity = distFromObs < 0.42 ? 0.22 + 0.35 * (m.wavelengthUnits / 1.5) : 0.85;
      }
      const h = Math.max(0.08, intensity * m.waveAmplitude * 1.05);
      bar.scale.y = h;
      bar.position.y = h * 0.5;
    });
  }

  // =========================================================================
  // MODEL 52: OPTICAL INTERFERENCE & INTERFEROMETER EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'optical-interferometer-explorer') {
    const m = calculateInterferometerMetrics({
      mirrorDisplacementNm: parameters.mirrorDisplacementNm,
      wavelengthNm: parameters.wavelengthNm,
      phaseOffsetDeg: parameters.phaseOffsetDeg,
      beamContrast: parameters.beamContrast,
    });

    if (handles.optMovableMirrorGroup) {
      handles.optMovableMirrorGroup.position.x = 2.45 + (m.mirrorDisplacementNm / 1000) * 0.35;
    }

    if (handles.optBeamGroup) {
      handles.optBeamGroup.visible = conditions.showOpticalBeams !== false;
    }

    const laserHex = wavelengthNmToHex(m.wavelengthNm);
    handles.optBeamMeshes.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat.userData.isSelectedHighlight) {
        mat.color.setHex(laserHex);
        mat.emissive.setHex(laserHex);
      }
    });

    handles.optWaveCrestRings.forEach((ring, idx) => {
      const mat = ring.material as THREE.MeshStandardMaterial;
      if (!mat.userData.isSelectedHighlight) {
        mat.color.setHex(laserHex);
      }
      const travel = ((simTime * 0.8 + idx * 0.25) % 1) * 1.8 + 0.35;
      if (idx < 4) {
        ring.position.x = travel;
      } else {
        ring.position.z = travel;
      }
    });

    const isLinear = conditions.fringeMode === 'linear_tilt_fringes';
    const contrast = Math.max(0.2, Number(parameters.beamContrast ?? 1.0));
    const kScale = 532 / m.wavelengthNm;

    handles.optFringeRings.forEach((ring, idx) => {
      ring.visible = !isLinear;
      const ringPhase = m.totalPhaseDifferenceRad + idx * Math.PI * kScale;
      const ringI = 0.5 * (1 + contrast * Math.cos(ringPhase));
      const mat = ring.material as THREE.MeshBasicMaterial;
      if (!mat.userData.isSelectedHighlight) {
        mat.color.setHex(laserHex);
      }
      mat.opacity = 0.12 + ringI * 0.88;
    });

    handles.optLinearFringeBars.forEach((bar, idx) => {
      bar.visible = isLinear;
      const barPhase = m.totalPhaseDifferenceRad + (idx - 3) * 1.35 * kScale;
      const barI = 0.5 * (1 + contrast * Math.cos(barPhase));
      const mat = bar.material as THREE.MeshBasicMaterial;
      if (!mat.userData.isSelectedHighlight) {
        mat.color.setHex(laserHex);
      }
      mat.opacity = 0.12 + barI * 0.88;
    });
  }

  // =========================================================================
  // MODEL 53: FLUID DYNAMICS: BERNOULLI, PRESSURE & VORTEX FLOW EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'fluid-dynamics-bernoulli-vortex') {
    const m = calculateFluidDynamicsMetrics({
      inletFlowRateLs: parameters.inletFlowRateLs,
      throatDiameterRatio: parameters.throatDiameterRatio,
      fluidDensityKgM3: parameters.fluidDensityKgM3,
    });

    if (handles.fluidThroatCollar) {
      const rScale = m.throatDiameterRatio / 0.55;
      handles.fluidThroatCollar.scale.set(rScale, 1, rScale);
    }

    // Update manometer columns P1 (inlet), P2 (throat), P3 (outlet)
    const showCols = conditions.showPressureColumns !== false;
    const h1 = Math.min(1.65, (m.inletStaticPressureKpa / 130) * 1.45);
    const h2 = Math.max(0.18, Math.min(1.65, (m.throatStaticPressureKpa / 130) * 1.45));
    const h3 = Math.max(0.25, h1 * 0.92);
    const heights = [h1, h2, h3];
    handles.fluidManometerColumns.forEach((col, idx) => {
      col.visible = showCols;
      const h = heights[idx] || 1.0;
      col.scale.y = h;
      col.position.y = 0.55 + h * 0.5;
    });

    if (handles.fluidStreamlinesGroup) {
      handles.fluidStreamlinesGroup.visible = conditions.showStreamlines !== false;
    }

    // Advect tracer particles with continuity speed boost in the throat
    const speedFactor = m.inletVelocityMs * 0.22;
    handles.fluidTracerParticles.forEach((p) => {
      const u = (p.phase + simTime * speedFactor) % 1;
      const x = -3.0 + u * 6.0;
      // Throat compression around x = 0
      const throatFactor = Math.exp(-(x * x) / 0.85);
      const radialSqueeze = 1 - throatFactor * (1 - m.throatDiameterRatio);
      p.mesh.position.set(x, 0.05 + p.laneY * radialSqueeze, p.laneZ * radialSqueeze);
    });

    // Vortex mode visibility & Kármán vortex shedding wake
    const isVortexMode = conditions.flowExperimentMode === 'vortex_wake_mode';
    if (handles.fluidVortexAssembly) {
      handles.fluidVortexAssembly.visible = true;
    }
    handles.fluidVortexRings.forEach((v) => {
      v.group.visible = isVortexMode;
      if (isVortexMode) {
        const wakeU = (v.phase + simTime * m.strouhalVortexFreqHz * 0.08) % 1;
        const wx = -0.35 + wakeU * 3.1;
        const wy = 0.05 + v.sign * 0.22 * Math.sin(wakeU * Math.PI * 3);
        v.group.position.set(wx, wy, 0);
        v.group.rotation.z = simTime * v.sign * 4.0;
      }
    });
  }

  // =========================================================================
  // MODEL 54: NUCLEAR FUSION REACTOR: MAGNETIC CONFINEMENT EXPLORER
  // =========================================================================
  if (modelSpec.functionalType === 'tokamak-fusion-confinement-explorer') {
    const m = calculateTokamakFusionMetrics({
      toroidalFieldTesla: parameters.toroidalFieldTesla,
      plasmaCurrentMa: parameters.plasmaCurrentMa,
      plasmaTemperatureKev: parameters.plasmaTemperatureKev,
      confinementQualityH: parameters.confinementQualityH,
    });

    if (handles.tokamakVesselCutawayMesh) {
      handles.tokamakVesselCutawayMesh.visible = conditions.internalView === false;
    }

    const coilFilter = conditions.inspectCoilGroup || 'all_coils';
    if (handles.tokamakTfCoilsGroup) {
      handles.tokamakTfCoilsGroup.visible = coilFilter === 'all_coils' || coilFilter === 'tf_only';
    }
    if (handles.tokamakPfCoilsGroup) {
      handles.tokamakPfCoilsGroup.visible = coilFilter === 'all_coils' || coilFilter === 'pf_and_cs_only';
    }
    if (handles.tokamakCsGroup) {
      handles.tokamakCsGroup.visible = coilFilter === 'all_coils' || coilFilter === 'pf_and_cs_only';
    }

    if (handles.tokamakPlasmaMesh) {
      const mat = handles.tokamakPlasmaMesh.material as THREE.MeshStandardMaterial;
      const tempFactor = Math.min(1.2, m.plasmaTemperatureKev / 20.0);
      if (!mat.userData.isSelectedHighlight) {
        mat.emissiveIntensity = 0.4 + tempFactor * 0.55;
      }
    }

    if (handles.tokamakHelicalLinesGroup) {
      handles.tokamakHelicalLinesGroup.visible = conditions.showMagneticFieldLines !== false;
    }

    // Update helical magnetic field line geometry with safety factor pitch q_95
    const R0 = 2.05;
    const rMinor = 0.52;
    const pitchQ = Math.max(1.2, Math.min(6.0, m.edgeSafetyFactorQ95));
    handles.tokamakHelicalLines.forEach((line, idx) => {
      const attr = line.geometry.getAttribute('position') as THREE.BufferAttribute;
      const phaseOffset = idx * Math.PI + simTime * 0.6;
      for (let i = 0; i < attr.count; i++) {
        const phi = (i / (attr.count - 1)) * Math.PI * 4;
        const theta = phi / pitchQ + phaseOffset;
        const r = R0 + rMinor * Math.cos(theta);
        const x = r * Math.cos(phi);
        const y = rMinor * Math.sin(theta);
        const z = r * Math.sin(phi);
        attr.setXYZ(i, x, y, z);
      }
      attr.needsUpdate = true;
    });
  }
}
