import * as THREE from 'three';
import { ScientificModelSpec, ModelPartSpec } from '../../types/aiModel';
import {
  calculateDopplerSonicBoomMetrics,
  calculateSeismicWavesMetrics,
  calculateGyroscopeMetrics,
  calculateShmCoupledMetrics,
  calculateCarnotEngineMetrics,
  calculatePhotoelectricMetrics,
  calculateSpecialRelativityMetrics,
} from './advancedPhysicsBatch3Engine';

export const ADVANCED_PHYSICS_BATCH_3_TYPES = new Set<string>([
  'doppler-effect-sonic-boom-explorer',
  'seismic-waves-earthquake-lab',
  'gyroscope-torque-angular-momentum-lab',
  'shm-coupled-oscillators-lab',
  'thermodynamics-carnot-heat-engine',
  'photoelectric-effect-quantum-explorer',
  'special-relativity-time-length-lab',
]);

export function isAdvancedPhysicsBatch3Model(functionalType?: string, id?: string): boolean {
  return (
    (Boolean(functionalType) && ADVANCED_PHYSICS_BATCH_3_TYPES.has(functionalType!)) ||
    (Boolean(id) && ADVANCED_PHYSICS_BATCH_3_TYPES.has(id!))
  );
}

export interface Batch3SceneHandles {
  rootGroup: THREE.Group;
  // Model 55: Doppler Effect & Sonic Boom
  dopplerSourceGroup: THREE.Group | null;
  dopplerObserverGroup: THREE.Group | null;
  dopplerWavefrontsGroup: THREE.Group | null;
  dopplerWavefrontRings: { mesh: THREE.Mesh; emitIndex: number }[];
  dopplerShockConeGroup: THREE.Group | null;
  dopplerShockConeMesh: THREE.Mesh | null;
  dopplerSourceVelArrow: THREE.Group | null;
  dopplerObsVelArrow: THREE.Group | null;
  // Model 56: Seismic Waves & Earthquake Propagation
  seismicCrustGroup: THREE.Group | null;
  seismicMantleGroup: THREE.Group | null;
  seismicOuterCoreGroup: THREE.Group | null;
  seismicInnerCoreGroup: THREE.Group | null;
  seismicFocusGroup: THREE.Group | null;
  seismicEpicentreGroup: THREE.Group | null;
  seismicPWaveGroup: THREE.Group | null;
  seismicPWavePulses: { mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3; phase: number }[];
  seismicSWaveGroup: THREE.Group | null;
  seismicSWavePulses: { mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3; phase: number }[];
  seismicSurfaceWaveGroup: THREE.Group | null;
  seismicSurfaceRings: THREE.Mesh[];
  seismicSelectableStationPin: THREE.Group | null;
  // Model 57: Gyroscope, Torque & Angular Momentum
  gyroPivotPrecessionGroup: THREE.Group | null;
  gyroTiltAssemblyGroup: THREE.Group | null;
  gyroRotorGroup: THREE.Group | null;
  gyroAxleGroup: THREE.Group | null;
  gyroGimbalGroup: THREE.Group | null;
  gyroSpinAxisGroup: THREE.Group | null;
  gyroAngularMomentumGroup: THREE.Group | null;
  gyroTorqueVectorGroup: THREE.Group | null;
  gyroPrecessionRingGroup: THREE.Group | null;
  // Model 58: SHM & Coupled Oscillators
  shmMass1Group: THREE.Group | null;
  shmMass2Group: THREE.Group | null;
  shmSpringLeftMesh: THREE.Mesh | null;
  shmSpringCenterMesh: THREE.Mesh | null;
  shmSpringRightMesh: THREE.Mesh | null;
  shmDispArrow1: THREE.Group | null;
  shmDispArrow2: THREE.Group | null;
  shmTrail1Line: THREE.Line | null;
  shmTrail2Line: THREE.Line | null;
  shmEnergyKBar: THREE.Mesh | null;
  shmEnergyUBar: THREE.Mesh | null;
  shmEnergyTotalBar: THREE.Mesh | null;
  // Model 59: Thermodynamics Carnot Heat Engine
  carnotGasCoreMesh: THREE.Mesh | null;
  carnotPistonGroup: THREE.Group | null;
  carnotFlywheelGroup: THREE.Group | null;
  carnotHeatInGroup: THREE.Group | null;
  carnotHeatInPulses: THREE.Mesh[];
  carnotHeatOutGroup: THREE.Group | null;
  carnotHeatOutPulses: THREE.Mesh[];
  carnotPvGroup: THREE.Group | null;
  carnotPvTracerDot: THREE.Mesh | null;
  // Model 60: Photoelectric Effect & Quantum Energy
  peLightSourceBeam: THREE.Mesh | null;
  pePhotonsGroup: THREE.Group | null;
  pePhotonPackets: { group: THREE.Group; lane: number; phase: number }[];
  peElectronsGroup: THREE.Group | null;
  peElectronSpheres: { mesh: THREE.Mesh; lane: number; phase: number }[];
  peAmmeterNeedle: THREE.Mesh | null;
  peEnergyDiagramGroup: THREE.Group | null;
  pePhotonEnergyBar: THREE.Mesh | null;
  peWorkFunctionBar: THREE.Mesh | null;
  peKineticEnergyBar: THREE.Mesh | null;
  peStoppingPotentialGroup: THREE.Group | null;
  peStoppingBar: THREE.Mesh | null;
  // Model 61: Special Relativity Time Dilation & Length Contraction
  srSpacecraftGroup: THREE.Group | null;
  srStationaryFrameGroup: THREE.Group | null;
  srOnboardClockHand: THREE.Mesh | null;
  srLightClockGroup: THREE.Group | null;
  srPhotonBall: THREE.Mesh | null;
  srDiagonalWaveLine: THREE.Line | null;
  srVelocityVectorGroup: THREE.Group | null;
  srReferenceLengthGroup: THREE.Group | null;
  srContractedLengthGroup: THREE.Group | null;
  srTimeComparisonGroup: THREE.Group | null;
  srCoordClockHand: THREE.Mesh | null;
  srProperClockHand: THREE.Mesh | null;
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
 * never mutates any other component in the scene, tags every child with partSpec for raycasting,
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

function create3DVectorArrow(colorHex: number, length = 1.1, shaftRadius = 0.045): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.45,
    roughness: 0.25,
    metalness: 0.2,
  });
  const shaftLen = Math.max(0.2, length - 0.28);
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLen, 16),
    mat
  );
  shaft.position.x = shaftLen * 0.5;
  shaft.rotation.z = -Math.PI / 2;
  g.add(shaft);

  const head = new THREE.Mesh(new THREE.ConeGeometry(shaftRadius * 2.5, 0.28, 20), mat);
  head.position.x = shaftLen + 0.14;
  head.rotation.z = -Math.PI / 2;
  g.add(head);
  return g;
}

function frequencyThzToHex(fThz: number): number {
  if (fThz < 480) return 0xef4444; // Red / IR
  if (fThz < 530) return 0xf97316; // Orange
  if (fThz < 580) return 0xeab308; // Yellow
  if (fThz < 640) return 0x10b981; // Green
  if (fThz < 720) return 0x38bdf8; // Cyan / Blue
  if (fThz < 850) return 0x6366f1; // Indigo / Violet
  return 0xa855f7; // Ultraviolet
}

export function buildBatch3CustomAssemblies(
  modelSpec: ScientificModelSpec,
  modelRoot: THREE.Group,
  meshMap: Map<string, THREE.Object3D>,
  interactiveMeshes: THREE.Object3D[]
): Batch3SceneHandles {
  const rootGroup = new THREE.Group();
  modelRoot.add(rootGroup);

  const handles: Batch3SceneHandles = {
    rootGroup,
    dopplerSourceGroup: null,
    dopplerObserverGroup: null,
    dopplerWavefrontsGroup: null,
    dopplerWavefrontRings: [],
    dopplerShockConeGroup: null,
    dopplerShockConeMesh: null,
    dopplerSourceVelArrow: null,
    dopplerObsVelArrow: null,
    seismicCrustGroup: null,
    seismicMantleGroup: null,
    seismicOuterCoreGroup: null,
    seismicInnerCoreGroup: null,
    seismicFocusGroup: null,
    seismicEpicentreGroup: null,
    seismicPWaveGroup: null,
    seismicPWavePulses: [],
    seismicSWaveGroup: null,
    seismicSWavePulses: [],
    seismicSurfaceWaveGroup: null,
    seismicSurfaceRings: [],
    seismicSelectableStationPin: null,
    gyroPivotPrecessionGroup: null,
    gyroTiltAssemblyGroup: null,
    gyroRotorGroup: null,
    gyroAxleGroup: null,
    gyroGimbalGroup: null,
    gyroSpinAxisGroup: null,
    gyroAngularMomentumGroup: null,
    gyroTorqueVectorGroup: null,
    gyroPrecessionRingGroup: null,
    shmMass1Group: null,
    shmMass2Group: null,
    shmSpringLeftMesh: null,
    shmSpringCenterMesh: null,
    shmSpringRightMesh: null,
    shmDispArrow1: null,
    shmDispArrow2: null,
    shmTrail1Line: null,
    shmTrail2Line: null,
    shmEnergyKBar: null,
    shmEnergyUBar: null,
    shmEnergyTotalBar: null,
    carnotGasCoreMesh: null,
    carnotPistonGroup: null,
    carnotFlywheelGroup: null,
    carnotHeatInGroup: null,
    carnotHeatInPulses: [],
    carnotHeatOutGroup: null,
    carnotHeatOutPulses: [],
    carnotPvGroup: null,
    carnotPvTracerDot: null,
    peLightSourceBeam: null,
    pePhotonsGroup: null,
    pePhotonPackets: [],
    peElectronsGroup: null,
    peElectronSpheres: [],
    peAmmeterNeedle: null,
    peEnergyDiagramGroup: null,
    pePhotonEnergyBar: null,
    peWorkFunctionBar: null,
    peKineticEnergyBar: null,
    peStoppingPotentialGroup: null,
    peStoppingBar: null,
    srSpacecraftGroup: null,
    srStationaryFrameGroup: null,
    srOnboardClockHand: null,
    srLightClockGroup: null,
    srPhotonBall: null,
    srDiagonalWaveLine: null,
    srVelocityVectorGroup: null,
    srReferenceLengthGroup: null,
    srContractedLengthGroup: null,
    srTimeComparisonGroup: null,
    srCoordClockHand: null,
    srProperClockHand: null,
  };

  const ft = modelSpec.functionalType || modelSpec.id;

  // =========================================================================
  // MODEL 55: DOPPLER EFFECT & SONIC BOOM EXPLORER
  // =========================================================================
  if (ft === 'doppler-effect-sonic-boom-explorer') {
    // 1. Ground Reference & Propagation Motion Path ('motion-path-guide')
    const pathGroup = new THREE.Group();
    const runwayMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.55,
      roughness: 0.38,
    });
    const runway = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.12, 1.8), runwayMat);
    runway.position.set(0, -0.75, 0);
    pathGroup.add(runway);

    // Center propagation axis & distance tick marks
    const axisLineMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    const axisRail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 7.8, 12), axisLineMat);
    axisRail.rotation.z = Math.PI / 2;
    axisRail.position.set(0, 0.35, 0);
    pathGroup.add(axisRail);

    for (let x = -3.5; x <= 3.5; x += 0.7) {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.55), axisLineMat);
      tick.position.set(x, -0.68, 0);
      pathGroup.add(tick);
    }
    rootGroup.add(pathGroup);
    registerPartGroup('motion-path-guide', pathGroup, modelSpec, meshMap, interactiveMeshes, [0, -0.72, 0.6]);

    // 2. Sound Source Aircraft / Acoustic Emitter ('sound-source')
    const sourceGroup = new THREE.Group();
    sourceGroup.position.set(-0.6, 0.35, 0);
    const fuselageMat = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      metalness: 0.72,
      roughness: 0.22,
      clearcoat: 0.5,
    });
    const noseMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.5,
      roughness: 0.25,
      emissive: 0x0369a1,
      emissiveIntensity: 0.25,
    });
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.1, 28), fuselageMat);
    fuselage.rotation.z = -Math.PI / 2;
    sourceGroup.add(fuselage);

    const noseCone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.52, 28), noseMat);
    noseCone.rotation.z = -Math.PI / 2;
    noseCone.position.set(0.8, 0, 0);
    sourceGroup.add(noseCone);

    // Delta wings & vertical stabilizer
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 1.35), noseMat);
    wing.position.set(-0.1, 0, 0);
    sourceGroup.add(wing);

    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.05), noseMat);
    tailFin.position.set(-0.35, 0.22, 0);
    sourceGroup.add(tailFin);

    // Acoustic transducer beacon ring on nose
    const emitterRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.035, 16, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    emitterRing.rotation.y = Math.PI / 2;
    emitterRing.position.set(0.55, 0, 0);
    sourceGroup.add(emitterRing);

    rootGroup.add(sourceGroup);
    handles.dopplerSourceGroup = sourceGroup;
    registerPartGroup('sound-source', sourceGroup, modelSpec, meshMap, interactiveMeshes, [-0.6, 0.65, 0]);

    // 3. Observer Acoustic Receiver Station ('observer-receiver')
    const observerGroup = new THREE.Group();
    observerGroup.position.set(2.65, -0.2, 0.75);
    const obsStandMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.65,
      roughness: 0.28,
    });
    const obsPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 0.18, 24), obsStandMat);
    obsPedestal.position.set(0, -0.45, 0);
    observerGroup.add(obsPedestal);

    const obsMast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.95, 20), obsStandMat);
    obsMast.position.set(0, 0.05, 0);
    observerGroup.add(obsMast);

    // Parabolic receiver dish facing the propagation line
    const dishMat = new THREE.MeshPhysicalMaterial({
      color: 0xfef08a,
      metalness: 0.75,
      roughness: 0.18,
      side: THREE.DoubleSide,
    });
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.45),
      dishMat
    );
    dish.rotation.z = Math.PI / 2;
    dish.position.set(-0.12, 0.55, 0);
    observerGroup.add(dish);

    rootGroup.add(observerGroup);
    handles.dopplerObserverGroup = observerGroup;
    registerPartGroup('observer-receiver', observerGroup, modelSpec, meshMap, interactiveMeshes, [2.65, 0.6, 0.75]);

    // 4. Emitted Acoustic Wavefronts ('acoustic-wavefronts')
    const wavefrontsGroup = new THREE.Group();
    const numRings = 10;
    for (let i = 0; i < numRings; i++) {
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        emissive: 0x06b6d4,
        emissiveIntensity: 0.55,
        transparent: true,
        opacity: 0.85,
        roughness: 0.2,
      });
      const ringGroup = new THREE.Group();
      const ringHoriz = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.025, 14, 64), ringMat);
      ringHoriz.rotation.x = Math.PI / 2;
      const ringVert = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.022, 14, 64), ringMat.clone());
      ringGroup.add(ringHoriz, ringVert);
      // Store primary mesh with child vertical ring
      const wrapperMesh = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.026, 14, 64), ringMat);
      const crossRing = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.02, 14, 64), ringMat.clone());
      crossRing.rotation.x = Math.PI / 2;
      wrapperMesh.add(crossRing);
      wrapperMesh.position.set(-0.6 - i * 0.25, 0.35, 0);
      wavefrontsGroup.add(wrapperMesh);
      handles.dopplerWavefrontRings.push({ mesh: wrapperMesh, emitIndex: i });
    }
    rootGroup.add(wavefrontsGroup);
    handles.dopplerWavefrontsGroup = wavefrontsGroup;
    registerPartGroup('acoustic-wavefronts', wavefrontsGroup, modelSpec, meshMap, interactiveMeshes, [-1.4, 1.35, 0]);

    // 5. Supersonic Mach Shock-Wave Cone ('shock-wave-cone')
    const shockConeGroup = new THREE.Group();
    shockConeGroup.position.set(-0.6, 0.35, 0);
    const coneMat = new THREE.MeshPhysicalMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.38,
      roughness: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    // Cone Geometry with apex at local x = +0.8 (aircraft nose) extending backward to x = -2.6
    const coneGeo = new THREE.ConeGeometry(1.5, 3.4, 48, 1, true);
    coneGeo.translate(0, -1.7, 0); // Move apex to local origin (0,0,0)
    coneGeo.rotateZ(-Math.PI / 2); // Apex at (0,0,0), opening toward -x
    const shockConeMesh = new THREE.Mesh(coneGeo, coneMat);
    shockConeMesh.position.set(0.8, 0, 0);
    shockConeGroup.add(shockConeMesh);
    handles.dopplerShockConeMesh = shockConeMesh;

    rootGroup.add(shockConeGroup);
    handles.dopplerShockConeGroup = shockConeGroup;
    registerPartGroup('shock-wave-cone', shockConeGroup, modelSpec, meshMap, interactiveMeshes, [-1.8, 1.15, 0]);

    // 6. Velocity & Direction Indicators ('velocity-direction-indicators')
    const vectorsGroup = new THREE.Group();
    const srcVelArrow = create3DVectorArrow(0x10b981, 1.25, 0.045);
    srcVelArrow.position.set(-0.6, 0.92, 0);
    vectorsGroup.add(srcVelArrow);
    handles.dopplerSourceVelArrow = srcVelArrow;

    const obsVelArrow = create3DVectorArrow(0xf59e0b, 0.9, 0.04);
    obsVelArrow.position.set(2.65, 0.65, 0.75);
    vectorsGroup.add(obsVelArrow);
    handles.dopplerObsVelArrow = obsVelArrow;

    rootGroup.add(vectorsGroup);
    registerPartGroup('velocity-direction-indicators', vectorsGroup, modelSpec, meshMap, interactiveMeshes, [0.2, 0.95, 0]);
  }

  // =========================================================================
  // MODEL 56: SEISMIC WAVES & EARTHQUAKE WAVE PROPAGATION LAB
  // =========================================================================
  if (ft === 'seismic-waves-earthquake-lab') {
    const phiStart = Math.PI * 0.22;
    const phiLength = Math.PI * 1.56;

    // 1. Earth's Crust ('earth-crust')
    const crustGroup = new THREE.Group();
    const crustMat = new THREE.MeshPhysicalMaterial({
      color: 0x2563eb,
      roughness: 0.42,
      metalness: 0.12,
      clearcoat: 0.25,
      side: THREE.DoubleSide,
    });
    const crustShell = new THREE.Mesh(
      new THREE.SphereGeometry(2.38, 48, 36, phiStart, phiLength),
      crustMat
    );
    crustGroup.add(crustShell);
    rootGroup.add(crustGroup);
    handles.seismicCrustGroup = crustGroup;
    registerPartGroup('earth-crust', crustGroup, modelSpec, meshMap, interactiveMeshes, [-2.1, 1.1, 0.4]);

    // 2. Silicate Mantle ('earth-mantle')
    const mantleGroup = new THREE.Group();
    const mantleMat = new THREE.MeshStandardMaterial({
      color: 0xea580c,
      roughness: 0.48,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });
    const mantleShell = new THREE.Mesh(
      new THREE.SphereGeometry(2.22, 44, 32, phiStart, phiLength),
      mantleMat
    );
    mantleGroup.add(mantleShell);
    // Flat cutaway cross-section ring for mantle
    const mantleFaceRing = new THREE.Mesh(
      new THREE.RingGeometry(1.24, 2.22, 48),
      new THREE.MeshStandardMaterial({
        color: 0xf97316,
        roughness: 0.4,
        side: THREE.DoubleSide,
      })
    );
    mantleFaceRing.position.z = 0.02;
    mantleGroup.add(mantleFaceRing);
    rootGroup.add(mantleGroup);
    handles.seismicMantleGroup = mantleGroup;
    registerPartGroup('earth-mantle', mantleGroup, modelSpec, meshMap, interactiveMeshes, [-1.65, -0.5, 0.4]);

    // 3. Liquid Iron-Nickel Outer Core ('earth-outer-core')
    const outerCoreGroup = new THREE.Group();
    const outerCoreMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.32,
      roughness: 0.25,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });
    const outerCoreShell = new THREE.Mesh(
      new THREE.SphereGeometry(1.24, 40, 28, phiStart, phiLength),
      outerCoreMat
    );
    outerCoreGroup.add(outerCoreShell);
    const outerCoreFace = new THREE.Mesh(
      new THREE.RingGeometry(0.56, 1.24, 40),
      outerCoreMat.clone()
    );
    outerCoreFace.position.z = 0.03;
    outerCoreGroup.add(outerCoreFace);
    rootGroup.add(outerCoreGroup);
    handles.seismicOuterCoreGroup = outerCoreGroup;
    registerPartGroup('earth-outer-core', outerCoreGroup, modelSpec, meshMap, interactiveMeshes, [0, -0.92, 0.5]);

    // 4. Solid Metallic Inner Core ('earth-inner-core')
    const innerCoreGroup = new THREE.Group();
    const innerCoreMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 0.65,
      metalness: 0.7,
      roughness: 0.18,
    });
    const innerCoreSphere = new THREE.Mesh(new THREE.SphereGeometry(0.55, 36, 36), innerCoreMat);
    innerCoreGroup.add(innerCoreSphere);
    rootGroup.add(innerCoreGroup);
    handles.seismicInnerCoreGroup = innerCoreGroup;
    registerPartGroup('earth-inner-core', innerCoreGroup, modelSpec, meshMap, interactiveMeshes, [0, 0, 0.6]);

    // 5. Earthquake Focus / Hypocenter ('earthquake-focus')
    const focusGroup = new THREE.Group();
    focusGroup.position.set(0, 2.1, 0.15);
    const focusSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xdc2626,
        emissiveIntensity: 0.85,
      })
    );
    focusGroup.add(focusSphere);
    rootGroup.add(focusGroup);
    handles.seismicFocusGroup = focusGroup;
    registerPartGroup('earthquake-focus', focusGroup, modelSpec, meshMap, interactiveMeshes, [0, 2.1, 0.35]);

    // 6. Surface Epicentre ('earthquake-epicentre')
    const epicentreGroup = new THREE.Group();
    epicentreGroup.position.set(0, 2.41, 0.15);
    const epiRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.035, 16, 36),
      new THREE.MeshBasicMaterial({ color: 0xf43f5e })
    );
    epiRing.rotation.x = Math.PI / 2;
    epicentreGroup.add(epiRing);
    const epiPin = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.26, 20),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.5 })
    );
    epiPin.rotation.x = Math.PI;
    epiPin.position.y = 0.16;
    epicentreGroup.add(epiPin);
    rootGroup.add(epicentreGroup);
    handles.seismicEpicentreGroup = epicentreGroup;
    registerPartGroup('earthquake-epicentre', epicentreGroup, modelSpec, meshMap, interactiveMeshes, [0, 2.62, 0.25]);

    // 7. P-Wave Propagation Paths ('p-waves-propagation') — Compressional waves entering core & mantle
    const pWaveGroup = new THREE.Group();
    const pMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.65,
      roughness: 0.2,
    });
    const pAngles = [-45, -80, -148, 45, 80, 148];
    pAngles.forEach((deg, idx) => {
      const rad = (deg * Math.PI) / 180;
      const start = new THREE.Vector3(0, 2.1, 0.12);
      const end = new THREE.Vector3(2.35 * Math.sin(rad), 2.35 * Math.cos(rad), 0.12);
      const mid =
        Math.abs(deg) > 103
          ? new THREE.Vector3(0.55 * Math.sin(rad * 0.5), -0.35, 0.12) // Refracted through liquid outer core
          : start.clone().lerp(end, 0.5).multiplyScalar(0.82);
      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.026, 12, false), pMat);
      pWaveGroup.add(tube);

      const pulseMesh = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 16), pMat.clone());
      pWaveGroup.add(pulseMesh);
      handles.seismicPWavePulses.push({ mesh: pulseMesh, curve, phase: idx * 0.16 });
    });
    rootGroup.add(pWaveGroup);
    handles.seismicPWaveGroup = pWaveGroup;
    registerPartGroup('p-waves-propagation', pWaveGroup, modelSpec, meshMap, interactiveMeshes, [-0.85, -1.25, 0.35]);

    // 8. S-Wave Propagation Paths ('s-waves-propagation') — Shear waves strictly in solid mantle (< 103°)
    const sWaveGroup = new THREE.Group();
    const sMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 0.6,
      roughness: 0.22,
    });
    const sAngles = [-35, -68, -98, 35, 68, 98];
    sAngles.forEach((deg, idx) => {
      const rad = (deg * Math.PI) / 180;
      const start = new THREE.Vector3(0, 2.1, 0.16);
      const end = new THREE.Vector3(2.35 * Math.sin(rad), 2.35 * Math.cos(rad), 0.16);
      const mid = start.clone().lerp(end, 0.5).normalize().multiplyScalar(1.42); // Curves above outer core (r > 1.24)
      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.024, 12, false), sMat);
      sWaveGroup.add(tube);

      const pulseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.11), sMat.clone());
      sWaveGroup.add(pulseMesh);
      handles.seismicSWavePulses.push({ mesh: pulseMesh, curve, phase: idx * 0.18 });
    });
    rootGroup.add(sWaveGroup);
    handles.seismicSWaveGroup = sWaveGroup;
    registerPartGroup('s-waves-propagation', sWaveGroup, modelSpec, meshMap, interactiveMeshes, [1.45, 0.95, 0.35]);

    // 9. Surface Waves ('surface-waves-propagation')
    const surfaceWaveGroup = new THREE.Group();
    const surfMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.85,
    });
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6 + i * 0.35, 0.032, 14, 48), surfMat.clone());
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 2.25 - i * 0.15, 0.15);
      surfaceWaveGroup.add(ring);
      handles.seismicSurfaceRings.push(ring);
    }
    rootGroup.add(surfaceWaveGroup);
    handles.seismicSurfaceWaveGroup = surfaceWaveGroup;
    registerPartGroup('surface-waves-propagation', surfaceWaveGroup, modelSpec, meshMap, interactiveMeshes, [0.95, 2.2, 0.35]);

    // 10. Seismic Stations ('seismic-stations')
    const stationsGroup = new THREE.Group();
    const stMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
      metalness: 0.6,
      roughness: 0.25,
    });
    const fixedAngles = [-55, 130]; // Fixed reference stations (130° is inside S-wave shadow zone)
    fixedAngles.forEach((deg) => {
      const rad = (deg * Math.PI) / 180;
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.32, 16), stMat);
      pin.position.set(2.48 * Math.sin(rad), 2.48 * Math.cos(rad), 0.15);
      pin.rotation.z = -rad;
      stationsGroup.add(pin);
    });

    // Movable primary selected seismic station pin
    const activePinGroup = new THREE.Group();
    const activeCone = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.38, 20), stMat.clone());
    activeCone.position.y = 0.19;
    const activeBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), stMat.clone());
    activeBeacon.position.y = 0.42;
    activePinGroup.add(activeCone, activeBeacon);
    stationsGroup.add(activePinGroup);
    handles.seismicSelectableStationPin = activePinGroup;

    rootGroup.add(stationsGroup);
    registerPartGroup('seismic-stations', stationsGroup, modelSpec, meshMap, interactiveMeshes, [2.15, 1.15, 0.35]);
  }

  // =========================================================================
  // MODEL 57: GYROSCOPE, TORQUE & ANGULAR MOMENTUM LABORATORY
  // =========================================================================
  if (ft === 'gyroscope-torque-angular-momentum-lab') {
    // 1. Support Tower & Pivot Base ('gyro-support')
    const supportGroup = new THREE.Group();
    const supportMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.78,
      roughness: 0.25,
    });
    const baseDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.5, 0.22, 40), supportMat);
    baseDisc.position.set(0, -1.35, 0);
    supportGroup.add(baseDisc);

    const towerShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.8, 28), supportMat);
    towerShaft.position.set(0, -0.4, 0);
    supportGroup.add(towerShaft);

    const pivotBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 28, 28),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 })
    );
    pivotBall.position.set(0, 0.55, 0);
    supportGroup.add(pivotBall);
    rootGroup.add(supportGroup);
    registerPartGroup('gyro-support', supportGroup, modelSpec, meshMap, interactiveMeshes, [0, -0.5, 0.3]);

    // Precession Pivot Root at (0, 0.55, 0)
    const pivotPrecessionGroup = new THREE.Group();
    pivotPrecessionGroup.position.set(0, 0.55, 0);
    rootGroup.add(pivotPrecessionGroup);
    handles.gyroPivotPrecessionGroup = pivotPrecessionGroup;

    const tiltAssemblyGroup = new THREE.Group();
    pivotPrecessionGroup.add(tiltAssemblyGroup);
    handles.gyroTiltAssemblyGroup = tiltAssemblyGroup;

    // 2. Axle ('gyro-axle')
    const axleGroup = new THREE.Group();
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.88,
      roughness: 0.18,
    });
    const axleRod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.7, 24), steelMat);
    axleRod.position.set(0, 1.15, 0);
    axleGroup.add(axleRod);

    const counterweight = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.24, 24), steelMat);
    counterweight.position.set(0, -0.2, 0);
    axleGroup.add(counterweight);
    tiltAssemblyGroup.add(axleGroup);
    handles.gyroAxleGroup = axleGroup;
    registerPartGroup('gyro-axle', axleGroup, modelSpec, meshMap, interactiveMeshes, [0.75, 0.55, 0]);

    // 3. Rotor Flywheel ('gyro-rotor') — Mechanical rim + hub + 6 radial spokes
    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(0, 1.55, 0);
    const brassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 0.35,
    });
    const outerRim = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.16, 24, 48), brassMat);
    outerRim.rotation.x = Math.PI / 2;
    rotorGroup.add(outerRim);

    const centralHub = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.3, 28), brassMat);
    rotorGroup.add(centralHub);

    for (let s = 0; s < 6; s++) {
      const ang = (s * Math.PI) / 3;
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.9, 16), brassMat);
      spoke.rotation.z = Math.PI / 2;
      spoke.rotation.y = ang;
      rotorGroup.add(spoke);
    }
    tiltAssemblyGroup.add(rotorGroup);
    handles.gyroRotorGroup = rotorGroup;
    registerPartGroup('gyro-rotor', rotorGroup, modelSpec, meshMap, interactiveMeshes, [1.55, 1.5, 0]);

    // 4. Gimbal/Frame ('gyro-gimbal-frame')
    const gimbalGroup = new THREE.Group();
    gimbalGroup.position.set(0, 1.55, 0);
    const gimbalMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.8,
      roughness: 0.24,
    });
    const gimbalRing = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.055, 20, 48), gimbalMat);
    gimbalGroup.add(gimbalRing);
    tiltAssemblyGroup.add(gimbalGroup);
    handles.gyroGimbalGroup = gimbalGroup;
    registerPartGroup('gyro-gimbal-frame', gimbalGroup, modelSpec, meshMap, interactiveMeshes, [1.55, -0.65, 0]);

    // 5. Spin Axis ('gyro-spin-axis')
    const spinAxisGroup = new THREE.Group();
    const axisLineMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 3.6, 14),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    axisLineMesh.position.set(0, 1.4, 0);
    spinAxisGroup.add(axisLineMesh);
    tiltAssemblyGroup.add(spinAxisGroup);
    handles.gyroSpinAxisGroup = spinAxisGroup;
    registerPartGroup('gyro-spin-axis', spinAxisGroup, modelSpec, meshMap, interactiveMeshes, [2.2, 0.55, 0]);

    // 6. Angular Momentum Vector L ('angular-momentum-vector')
    const LGroup = new THREE.Group();
    const lShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.1, 16),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.55 })
    );
    lShaft.position.set(0, 3.05, 0);
    const lHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.32, 20),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.55 })
    );
    lHead.position.set(0, 3.7, 0);
    LGroup.add(lShaft, lHead);
    tiltAssemblyGroup.add(LGroup);
    handles.gyroAngularMomentumGroup = LGroup;
    registerPartGroup('angular-momentum-vector', LGroup, modelSpec, meshMap, interactiveMeshes, [2.85, 0.85, 0]);

    // 7. Torque Vector τ ('torque-vector') — perpendicular to spin axis & vertical support
    const torqueGroup = new THREE.Group();
    const tShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.048, 1.1, 16),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.55 })
    );
    tShaft.rotation.x = Math.PI / 2;
    tShaft.position.set(0, 1.55, 0.65);
    const tHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.3, 20),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.55 })
    );
    tHead.rotation.x = Math.PI / 2;
    tHead.position.set(0, 1.55, 1.3);
    torqueGroup.add(tShaft, tHead);
    tiltAssemblyGroup.add(torqueGroup);
    handles.gyroTorqueVectorGroup = torqueGroup;
    registerPartGroup('torque-vector', torqueGroup, modelSpec, meshMap, interactiveMeshes, [1.55, 0.55, 1.25]);

    // 8. Precession Path ('precession-path')
    const precRingGroup = new THREE.Group();
    const precTorus = new THREE.Mesh(
      new THREE.TorusGeometry(2.45, 0.03, 16, 64),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 0.55 })
    );
    precTorus.rotation.x = Math.PI / 2;
    precTorus.position.set(0, 0.95, 0);
    precRingGroup.add(precTorus);
    rootGroup.add(precRingGroup);
    handles.gyroPrecessionRingGroup = precRingGroup;
    registerPartGroup('precession-path', precRingGroup, modelSpec, meshMap, interactiveMeshes, [-2.1, 0.95, 0]);
  }

  // =========================================================================
  // MODEL 58: SIMPLE HARMONIC MOTION & COUPLED OSCILLATORS LAB
  // =========================================================================
  if (ft === 'shm-coupled-oscillators-lab') {
    // 1. Support Frame & Guide Rails ('support-frame')
    const frameGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.72,
      roughness: 0.28,
    });
    const baseTrack = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.26, 1.5), frameMat);
    baseTrack.position.set(0, -0.62, 0);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.35, 1.5), frameMat);
    leftWall.position.set(-3.76, -0.05, 0);
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.35, 1.5), frameMat);
    rightWall.position.set(3.76, -0.05, 0);

    const railMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.15 });
    const railFront = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 7.3, 20), railMat);
    railFront.rotation.z = Math.PI / 2;
    railFront.position.set(0, 0, 0.28);
    const railBack = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 7.3, 20), railMat);
    railBack.rotation.z = Math.PI / 2;
    railBack.position.set(0, 0, -0.28);

    frameGroup.add(baseTrack, leftWall, rightWall, railFront, railBack);
    rootGroup.add(frameGroup);
    registerPartGroup('support-frame', frameGroup, modelSpec, meshMap, interactiveMeshes, [0, -0.75, 0.7]);

    // 2. Mass 1 ('oscillator-mass-1')
    const m1Group = new THREE.Group();
    m1Group.position.set(-1.35, 0, 0);
    const m1Block = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.82, 0.82),
      new THREE.MeshPhysicalMaterial({ color: 0x0284c7, metalness: 0.55, roughness: 0.22, clearcoat: 0.45 })
    );
    m1Group.add(m1Block);
    rootGroup.add(m1Group);
    handles.shmMass1Group = m1Group;
    registerPartGroup('oscillator-mass-1', m1Group, modelSpec, meshMap, interactiveMeshes, [-1.35, 0.55, 0]);

    // 3. Mass 2 ('oscillator-mass-2')
    const m2Group = new THREE.Group();
    m2Group.position.set(1.35, 0, 0);
    const m2Block = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.82, 0.82),
      new THREE.MeshPhysicalMaterial({ color: 0x059669, metalness: 0.55, roughness: 0.22, clearcoat: 0.45 })
    );
    m2Group.add(m2Block);
    rootGroup.add(m2Group);
    handles.shmMass2Group = m2Group;
    registerPartGroup('oscillator-mass-2', m2Group, modelSpec, meshMap, interactiveMeshes, [1.35, 0.55, 0]);

    // 4. Helical Springs ('helical-springs')
    const springsGroup = new THREE.Group();
    const buildHelixSpringMesh = (colorHex: number) => {
      const pts: THREE.Vector3[] = [];
      const turns = 11;
      const samples = 140;
      for (let i = 0; i <= samples; i++) {
        const u = i / samples;
        const x = (u - 0.5) * 1.0; // Normalized unit length [-0.5, +0.5]
        const angle = u * turns * Math.PI * 2;
        const r = i === 0 || i === samples ? 0 : 0.22;
        pts.push(new THREE.Vector3(x, r * Math.cos(angle), r * Math.sin(angle)));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      return new THREE.Mesh(
        new THREE.TubeGeometry(curve, 120, 0.032, 12, false),
        new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.88, roughness: 0.18 })
      );
    };

    const springLeft = buildHelixSpringMesh(0xe2e8f0);
    const springCenter = buildHelixSpringMesh(0x38bdf8);
    const springRight = buildHelixSpringMesh(0xe2e8f0);
    springsGroup.add(springLeft, springCenter, springRight);
    handles.shmSpringLeftMesh = springLeft;
    handles.shmSpringCenterMesh = springCenter;
    handles.shmSpringRightMesh = springRight;
    rootGroup.add(springsGroup);
    registerPartGroup('helical-springs', springsGroup, modelSpec, meshMap, interactiveMeshes, [0, 0.32, 0]);

    // 5. Equilibrium Markers ('equilibrium-markers')
    const eqGroup = new THREE.Group();
    const eqMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.5,
    });
    [-1.35, 1.35].forEach((eqX) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.65, 14), eqMat);
      post.position.set(eqX, 0.18, -0.58);
      eqGroup.add(post);
    });
    rootGroup.add(eqGroup);
    registerPartGroup('equilibrium-markers', eqGroup, modelSpec, meshMap, interactiveMeshes, [-1.35, 1.15, -0.58]);

    // 6. Displacement Indicators ('displacement-indicators')
    const dispGroup = new THREE.Group();
    const arrow1 = create3DVectorArrow(0xf43f5e, 0.9, 0.04);
    arrow1.position.set(-1.35, 0.72, 0);
    const arrow2 = create3DVectorArrow(0x10b981, 0.9, 0.04);
    arrow2.position.set(1.35, 0.72, 0);
    dispGroup.add(arrow1, arrow2);
    handles.shmDispArrow1 = arrow1;
    handles.shmDispArrow2 = arrow2;
    rootGroup.add(dispGroup);
    registerPartGroup('displacement-indicators', dispGroup, modelSpec, meshMap, interactiveMeshes, [-0.8, 0.85, 0]);

    // 7. Motion Trails ('motion-trails')
    const trailsGroup = new THREE.Group();
    const numTrailPts = 80;
    const t1Pts: THREE.Vector3[] = [];
    const t2Pts: THREE.Vector3[] = [];
    for (let i = 0; i < numTrailPts; i++) {
      const z = -0.65 - (i / (numTrailPts - 1)) * 2.2;
      t1Pts.push(new THREE.Vector3(-1.35, 0, z));
      t2Pts.push(new THREE.Vector3(1.35, 0, z));
    }
    const trail1Line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(t1Pts),
      new THREE.LineBasicMaterial({ color: 0x38bdf8 })
    );
    const trail2Line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(t2Pts),
      new THREE.LineBasicMaterial({ color: 0x10b981 })
    );
    // Add thin base plane so raycasting can also click Motion Trails
    const trailBoard = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 0.04, 2.2),
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        transparent: true,
        opacity: 0.45,
      })
    );
    trailBoard.position.set(0, -0.42, -1.75);
    trailsGroup.add(trail1Line, trail2Line, trailBoard);
    handles.shmTrail1Line = trail1Line;
    handles.shmTrail2Line = trail2Line;
    rootGroup.add(trailsGroup);
    registerPartGroup('motion-trails', trailsGroup, modelSpec, meshMap, interactiveMeshes, [0, -0.35, -1.8]);

    // 8. Energy & Phase Visualization ('energy-phase-visualization')
    const energyGroup = new THREE.Group();
    energyGroup.position.set(0, 1.35, -1.15);
    const backing = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 1.3, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
    );
    energyGroup.add(backing);

    const kBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.9, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.45 })
    );
    kBar.position.set(-0.45, 0, 0.08);
    const uBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.9, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.45 })
    );
    uBar.position.set(0, 0, 0.08);
    const totBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.9, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 0.45 })
    );
    totBar.position.set(0.45, 0, 0.08);
    energyGroup.add(kBar, uBar, totBar);
    handles.shmEnergyKBar = kBar;
    handles.shmEnergyUBar = uBar;
    handles.shmEnergyTotalBar = totBar;
    rootGroup.add(energyGroup);
    registerPartGroup('energy-phase-visualization', energyGroup, modelSpec, meshMap, interactiveMeshes, [0, 1.85, -1.15]);
  }

  // =========================================================================
  // MODEL 59: THERMODYNAMICS: HEAT ENGINE & CARNOT CYCLE EXPLORER
  // =========================================================================
  if (ft === 'thermodynamics-carnot-heat-engine') {
    // 1. Hot Reservoir ('hot-reservoir')
    const hotGroup = new THREE.Group();
    hotGroup.position.set(-2.65, 1.05, 0);
    const hotBlock = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, 1.0, 1.25),
      new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xdc2626,
        emissiveIntensity: 0.55,
        roughness: 0.28,
      })
    );
    hotGroup.add(hotBlock);
    rootGroup.add(hotGroup);
    registerPartGroup('hot-reservoir', hotGroup, modelSpec, meshMap, interactiveMeshes, [-2.65, 1.65, 0]);

    // 2. Cold Reservoir ('cold-reservoir')
    const coldGroup = new THREE.Group();
    coldGroup.position.set(-2.65, -0.95, 0);
    const coldBlock = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, 1.0, 1.25),
      new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.35,
        roughness: 0.28,
      })
    );
    coldGroup.add(coldBlock);
    rootGroup.add(coldGroup);
    registerPartGroup('cold-reservoir', coldGroup, modelSpec, meshMap, interactiveMeshes, [-2.65, -1.55, 0]);

    // 3. Working Substance & Cylinder ('working-substance-cylinder')
    const cylGroup = new THREE.Group();
    cylGroup.position.set(-0.35, 0.05, 0);
    const glassWall = new THREE.Mesh(
      new THREE.CylinderGeometry(0.82, 0.82, 2.25, 36, 1, true),
      new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.36,
        roughness: 0.1,
        side: THREE.DoubleSide,
      })
    );
    const gasCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.76, 0.76, 1.1, 32),
      new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xea580c,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.75,
      })
    );
    gasCore.position.y = -0.45;
    cylGroup.add(glassWall, gasCore);
    handles.carnotGasCoreMesh = gasCore;
    rootGroup.add(cylGroup);
    registerPartGroup('working-substance-cylinder', cylGroup, modelSpec, meshMap, interactiveMeshes, [-0.35, -0.55, 0.85]);

    // 4. Piston ('engine-piston')
    const pistonGroup = new THREE.Group();
    pistonGroup.position.set(-0.35, 0.45, 0);
    const pistonHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.77, 0.77, 0.32, 32),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 })
    );
    const pistonRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 1.15, 20),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.22 })
    );
    pistonRod.position.y = 0.65;
    pistonGroup.add(pistonHead, pistonRod);
    handles.carnotPistonGroup = pistonGroup;
    rootGroup.add(pistonGroup);
    registerPartGroup('engine-piston', pistonGroup, modelSpec, meshMap, interactiveMeshes, [-0.35, 0.95, 0]);

    // 5. Heat-Input Flow Q_H ('heat-input-flow')
    const heatInGroup = new THREE.Group();
    const qhArrow = create3DVectorArrow(0xf97316, 1.25, 0.055);
    qhArrow.position.set(-1.85, 0.85, 0);
    heatInGroup.add(qhArrow);
    for (let i = 0; i < 3; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 14, 14),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      p.position.set(-1.7 + i * 0.35, 0.85, 0);
      heatInGroup.add(p);
      handles.carnotHeatInPulses.push(p);
    }
    handles.carnotHeatInGroup = heatInGroup;
    rootGroup.add(heatInGroup);
    registerPartGroup('heat-input-flow', heatInGroup, modelSpec, meshMap, interactiveMeshes, [-1.45, 1.15, 0]);

    // 6. Heat-Rejection Flow Q_C ('heat-rejection-flow')
    const heatOutGroup = new THREE.Group();
    const qcArrow = create3DVectorArrow(0x38bdf8, 1.25, 0.055);
    qcArrow.rotation.y = Math.PI; // Pointing from cylinder to cold reservoir (-x)
    qcArrow.position.set(-0.9, -0.75, 0);
    heatOutGroup.add(qcArrow);
    for (let i = 0; i < 3; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 14, 14),
        new THREE.MeshBasicMaterial({ color: 0x7dd3fc })
      );
      p.position.set(-1.0 - i * 0.35, -0.75, 0);
      heatOutGroup.add(p);
      handles.carnotHeatOutPulses.push(p);
    }
    handles.carnotHeatOutGroup = heatOutGroup;
    rootGroup.add(heatOutGroup);
    registerPartGroup('heat-rejection-flow', heatOutGroup, modelSpec, meshMap, interactiveMeshes, [-1.45, -1.05, 0]);

    // 7. Work-Output Shaft & Flywheel ('work-output-shaft')
    const workGroup = new THREE.Group();
    workGroup.position.set(1.05, 1.05, 0);
    const flywheelMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      metalness: 0.78,
      roughness: 0.22,
    });
    const flywheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.1, 20, 44), flywheelMat);
    const spoke1 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.08), flywheelMat);
    const spoke2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.3, 0.08), flywheelMat);
    const flywheelSub = new THREE.Group();
    flywheelSub.add(flywheelRim, spoke1, spoke2);
    workGroup.add(flywheelSub);
    handles.carnotFlywheelGroup = flywheelSub;
    rootGroup.add(workGroup);
    registerPartGroup('work-output-shaft', workGroup, modelSpec, meshMap, interactiveMeshes, [1.05, 1.82, 0]);

    // 8. Synchronized P–V Diagram ('pv-diagram-display')
    const pvGroup = new THREE.Group();
    pvGroup.position.set(2.45, -0.05, -0.2);
    const pvBoard = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 1.75, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 })
    );
    pvGroup.add(pvBoard);

    // Closed 4-stage Carnot cycle curve on the P-V board
    const pvPts = [
      new THREE.Vector3(-0.65, 0.58, 0.08), // State 1 (High P, Low V at T_H)
      new THREE.Vector3(0.15, 0.22, 0.08), // State 2 (End of Isothermal Expansion)
      new THREE.Vector3(0.68, -0.48, 0.08), // State 3 (End of Adiabatic Expansion at T_C)
      new THREE.Vector3(-0.15, -0.22, 0.08), // State 4 (End of Isothermal Compression)
      new THREE.Vector3(-0.65, 0.58, 0.08), // Close loop back to State 1
    ];
    const pvCurve = new THREE.CatmullRomCurve3(pvPts, true);
    const pvLoopMesh = new THREE.Mesh(
      new THREE.TubeGeometry(pvCurve, 64, 0.028, 12, true),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.55 })
    );
    pvGroup.add(pvLoopMesh);

    const tracerDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.9 })
    );
    tracerDot.position.set(-0.65, 0.58, 0.09);
    pvGroup.add(tracerDot);
    handles.carnotPvTracerDot = tracerDot;
    handles.carnotPvGroup = pvGroup;
    rootGroup.add(pvGroup);
    registerPartGroup('pv-diagram-display', pvGroup, modelSpec, meshMap, interactiveMeshes, [2.45, 0.98, -0.2]);
  }

  // =========================================================================
  // MODEL 60: PHOTOELECTRIC EFFECT & QUANTUM ENERGY EXPLORER
  // =========================================================================
  if (ft === 'photoelectric-effect-quantum-explorer') {
    // 1. Light Source ('monochromatic-light-source')
    const lightGroup = new THREE.Group();
    lightGroup.position.set(-2.55, 1.55, 0);
    lightGroup.rotation.z = -Math.PI / 4;
    const lampBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.44, 1.05, 28),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.78, roughness: 0.25 })
    );
    const lampLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.14, 28),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 0.75 })
    );
    lampLens.position.y = -0.52;
    lightGroup.add(lampBody, lampLens);
    handles.peLightSourceBeam = lampLens;
    rootGroup.add(lightGroup);
    registerPartGroup('monochromatic-light-source', lightGroup, modelSpec, meshMap, interactiveMeshes, [-2.55, 1.95, 0]);

    // 2. Incoming Photons ('incoming-photons')
    const photonsGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const pGroup = new THREE.Group();
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.085, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 0.85 })
      );
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.14, 0.018, 10, 24),
        new THREE.MeshBasicMaterial({ color: 0xe9d5ff })
      );
      pGroup.add(core, ring);
      photonsGroup.add(pGroup);
      handles.pePhotonPackets.push({ group: pGroup, lane: (i % 3) - 1, phase: i / 8 });
    }
    handles.pePhotonsGroup = photonsGroup;
    rootGroup.add(photonsGroup);
    registerPartGroup('incoming-photons', photonsGroup, modelSpec, meshMap, interactiveMeshes, [-1.85, 0.95, 0]);

    // 3. Metal Target Cathode ('metal-target-cathode')
    const cathodeGroup = new THREE.Group();
    cathodeGroup.position.set(-1.35, 0.05, 0);
    const cathodePlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.75, 1.35, 32, 1, true, -Math.PI * 0.35, Math.PI * 0.7),
      new THREE.MeshPhysicalMaterial({
        color: 0xf59e0b,
        metalness: 0.88,
        roughness: 0.18,
        side: THREE.DoubleSide,
      })
    );
    cathodePlate.rotation.y = Math.PI / 2;
    cathodeGroup.add(cathodePlate);
    rootGroup.add(cathodeGroup);
    registerPartGroup('metal-target-cathode', cathodeGroup, modelSpec, meshMap, interactiveMeshes, [-1.45, 0.82, 0]);

    // 4. Emitted Photoelectrons ('emitted-photoelectrons')
    const electronsGroup = new THREE.Group();
    for (let i = 0; i < 10; i++) {
      const eMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.85 })
      );
      electronsGroup.add(eMesh);
      handles.peElectronSpheres.push({ mesh: eMesh, lane: ((i % 5) - 2) * 0.2, phase: i / 10 });
    }
    handles.peElectronsGroup = electronsGroup;
    rootGroup.add(electronsGroup);
    registerPartGroup('emitted-photoelectrons', electronsGroup, modelSpec, meshMap, interactiveMeshes, [-0.15, 0.35, 0]);

    // 5. Collector Anode ('collector-anode')
    const anodeGroup = new THREE.Group();
    anodeGroup.position.set(1.05, 0.05, 0);
    const anodeRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 1.25, 24),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.16 })
    );
    anodeGroup.add(anodeRod);
    rootGroup.add(anodeGroup);
    registerPartGroup('collector-anode', anodeGroup, modelSpec, meshMap, interactiveMeshes, [1.05, 0.82, 0]);

    // 6. External Circuit & Microammeter ('external-measurement-circuit')
    const circuitGroup = new THREE.Group();
    circuitGroup.position.set(-0.15, -1.05, 0);
    const wireBus = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.12, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.75, roughness: 0.28 })
    );
    const ammeterDial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.16, 28),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 })
    );
    ammeterDial.rotation.x = Math.PI / 2;
    const needle = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.28, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    needle.position.set(0, 0.08, 0.1);
    circuitGroup.add(wireBus, ammeterDial, needle);
    handles.peAmmeterNeedle = needle;
    rootGroup.add(circuitGroup);
    registerPartGroup('external-measurement-circuit', circuitGroup, modelSpec, meshMap, interactiveMeshes, [-0.15, -1.5, 0]);

    // 7. Energy-Level Diagram ('energy-level-diagram')
    const energyDiagGroup = new THREE.Group();
    energyDiagGroup.position.set(2.45, 0.35, -0.2);
    const diagBoard = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 1.85, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.38 })
    );
    // Threshold reference line
    const thresholdLine = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, 0.04, 0.16),
      new THREE.MeshBasicMaterial({ color: 0xf43f5e })
    );
    const hfBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 1.0, 0.15),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 0.5 })
    );
    hfBar.position.set(-0.48, -0.2, 0.08);
    const phiBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.8, 0.15),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.45 })
    );
    phiBar.position.set(0, -0.3, 0.08);
    const kMaxBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.6, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.5 })
    );
    kMaxBar.position.set(0.48, -0.4, 0.08);
    energyDiagGroup.add(diagBoard, thresholdLine, hfBar, phiBar, kMaxBar);
    handles.peEnergyDiagramGroup = energyDiagGroup;
    handles.pePhotonEnergyBar = hfBar;
    handles.peWorkFunctionBar = phiBar;
    handles.peKineticEnergyBar = kMaxBar;
    rootGroup.add(energyDiagGroup);
    registerPartGroup('energy-level-diagram', energyDiagGroup, modelSpec, meshMap, interactiveMeshes, [2.45, 1.38, -0.2]);

    // 8. Stopping-Potential Indicator ('stopping-potential-indicator')
    const stopGroup = new THREE.Group();
    stopGroup.position.set(1.25, -0.95, 0.35);
    const stopBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.55, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.65, roughness: 0.3 })
    );
    const stopBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.16, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.55 })
    );
    stopGroup.add(stopBox, stopBar);
    handles.peStoppingPotentialGroup = stopGroup;
    handles.peStoppingBar = stopBar;
    rootGroup.add(stopGroup);
    registerPartGroup('stopping-potential-indicator', stopGroup, modelSpec, meshMap, interactiveMeshes, [1.25, -1.35, 0.35]);
  }

  // =========================================================================
  // MODEL 61: SPECIAL RELATIVITY: TIME DILATION & LENGTH CONTRACTION LAB
  // =========================================================================
  if (ft === 'special-relativity-time-length-lab') {
    // 1. Stationary Reference Frame ('stationary-reference-frame')
    const labFrameGroup = new THREE.Group();
    const labMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.68,
      roughness: 0.28,
    });
    const labBench = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.16, 2.1), labMat);
    labBench.position.set(0, -1.05, 0);
    labFrameGroup.add(labBench);
    for (let x = -3.2; x <= 3.2; x += 1.6) {
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.55, 16), labMat);
      pylon.position.set(x, -0.75, -0.8);
      labFrameGroup.add(pylon);
    }
    handles.srStationaryFrameGroup = labFrameGroup;
    rootGroup.add(labFrameGroup);
    registerPartGroup('stationary-reference-frame', labFrameGroup, modelSpec, meshMap, interactiveMeshes, [0, -1.15, 0.85]);

    // 2. Relativistic Spacecraft ('relativistic-spacecraft')
    const shipGroup = new THREE.Group();
    shipGroup.position.set(0, 0.2, 0);
    const hullMat = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      metalness: 0.72,
      roughness: 0.2,
      clearcoat: 0.45,
      transparent: true,
      opacity: 0.55,
    });
    const hullBody = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 2.6, 32), hullMat);
    hullBody.rotation.z = -Math.PI / 2;
    const hullNose = new THREE.Mesh(
      new THREE.ConeGeometry(0.62, 0.75, 32),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.25 })
    );
    hullNose.rotation.z = -Math.PI / 2;
    hullNose.position.x = 1.65;
    shipGroup.add(hullBody, hullNose);
    handles.srSpacecraftGroup = shipGroup;
    rootGroup.add(shipGroup);
    registerPartGroup('relativistic-spacecraft', shipGroup, modelSpec, meshMap, interactiveMeshes, [-1.2, 0.85, 0]);

    // 3. Onboard Clock ('onboard-clock')
    const onboardClockGroup = new THREE.Group();
    onboardClockGroup.position.set(-0.65, 0.2, 0.64);
    const clockFace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.08, 28),
      new THREE.MeshStandardMaterial({ color: 0x064e3b, metalness: 0.4, roughness: 0.3 })
    );
    clockFace.rotation.x = Math.PI / 2;
    const clockHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.24, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x34d399 })
    );
    clockHand.position.set(0, 0.08, 0.06);
    onboardClockGroup.add(clockFace, clockHand);
    handles.srOnboardClockHand = clockHand;
    rootGroup.add(onboardClockGroup);
    registerPartGroup('onboard-clock', onboardClockGroup, modelSpec, meshMap, interactiveMeshes, [-0.65, 0.2, 0.85]);

    // 4. Light-Clock Components ('light-clock-pulses')
    const lightClockGroup = new THREE.Group();
    lightClockGroup.position.set(0.2, 0.2, 0);
    const mirrorMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 });
    const topMirror = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.35), mirrorMat);
    topMirror.position.y = 0.48;
    const botMirror = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.35), mirrorMat);
    botMirror.position.y = -0.48;
    const photonBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.95 })
    );
    // Diagonal stationary-frame photon path line
    const diagPts = [
      new THREE.Vector3(-0.7, -0.45, 0),
      new THREE.Vector3(0, 0.45, 0),
      new THREE.Vector3(0.7, -0.45, 0),
    ];
    const diagLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(diagPts),
      new THREE.LineBasicMaterial({ color: 0x38bdf8 })
    );
    lightClockGroup.add(topMirror, botMirror, photonBall, diagLine);
    handles.srLightClockGroup = lightClockGroup;
    handles.srPhotonBall = photonBall;
    handles.srDiagonalWaveLine = diagLine;
    rootGroup.add(lightClockGroup);
    registerPartGroup('light-clock-pulses', lightClockGroup, modelSpec, meshMap, interactiveMeshes, [0.25, 0.2, 0.4]);

    // 5. Velocity Vector ('velocity-vector')
    const velGroup = create3DVectorArrow(0xf59e0b, 1.35, 0.05);
    velGroup.position.set(1.85, 0.2, 0);
    handles.srVelocityVectorGroup = velGroup;
    rootGroup.add(velGroup);
    registerPartGroup('velocity-vector', velGroup, modelSpec, meshMap, interactiveMeshes, [2.55, 0.2, 0]);

    // 6. Reference Length Markers L_0 ('reference-length-markers')
    const refLenGroup = new THREE.Group();
    refLenGroup.position.set(0, -0.65, 0.65);
    const refBar = new THREE.Mesh(
      new THREE.BoxGeometry(3.35, 0.09, 0.09),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.25 })
    );
    refLenGroup.add(refBar);
    handles.srReferenceLengthGroup = refLenGroup;
    rootGroup.add(refLenGroup);
    registerPartGroup('reference-length-markers', refLenGroup, modelSpec, meshMap, interactiveMeshes, [0, -0.65, 0.85]);

    // 7. Contracted-Length Indicator L = L_0 / gamma ('contracted-length-indicator')
    const contLenGroup = new THREE.Group();
    contLenGroup.position.set(0, 1.02, 0);
    const contBar = new THREE.Mesh(
      new THREE.BoxGeometry(3.35, 0.11, 0.11),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.55 })
    );
    contLenGroup.add(contBar);
    handles.srContractedLengthGroup = contLenGroup;
    rootGroup.add(contLenGroup);
    registerPartGroup('contracted-length-indicator', contLenGroup, modelSpec, meshMap, interactiveMeshes, [0, 1.15, 0]);

    // 8. Time-Comparison Visualization ('time-comparison-visualization')
    const timeCompGroup = new THREE.Group();
    timeCompGroup.position.set(0, 1.78, -0.95);
    const timeBoard = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.15, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 })
    );
    const coordClock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.08, 28),
      new THREE.MeshStandardMaterial({ color: 0x0c4a6e })
    );
    coordClock.rotation.x = Math.PI / 2;
    coordClock.position.set(-0.6, 0, 0.06);
    const coordHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.28, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    coordHand.position.set(-0.6, 0.1, 0.12);

    const properClock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.08, 28),
      new THREE.MeshStandardMaterial({ color: 0x064e3b })
    );
    properClock.rotation.x = Math.PI / 2;
    properClock.position.set(0.6, 0, 0.06);
    const properHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.28, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    properHand.position.set(0.6, 0.1, 0.12);

    timeCompGroup.add(timeBoard, coordClock, coordHand, properClock, properHand);
    handles.srTimeComparisonGroup = timeCompGroup;
    handles.srCoordClockHand = coordHand;
    handles.srProperClockHand = properHand;
    rootGroup.add(timeCompGroup);
    registerPartGroup('time-comparison-visualization', timeCompGroup, modelSpec, meshMap, interactiveMeshes, [0, 2.38, -0.95]);
  }

  return handles;
}

export function updateBatch3CustomAssemblies(
  handles: Batch3SceneHandles,
  modelSpec: ScientificModelSpec,
  parameters: Record<string, number>,
  conditions: Record<string, any>,
  simTime: number,
  _meshMap: Map<string, THREE.Object3D>
): void {
  const ft = modelSpec.functionalType || modelSpec.id;

  // =========================================================================
  // 55. DOPPLER EFFECT & SONIC BOOM UPDATE
  // =========================================================================
  if (ft === 'doppler-effect-sonic-boom-explorer') {
    const m = calculateDopplerSonicBoomMetrics({
      sourceSpeed: parameters.sourceSpeed,
      observerSpeed: parameters.observerSpeed,
      soundSpeed: parameters.soundSpeed,
      sourceFrequencyHz: parameters.sourceFrequencyHz,
      motionRegimePreset: String(conditions.motionRegimePreset || 'custom'),
      sourceDirection: String(conditions.sourceDirection || 'approaching'),
    });

    const dirSign = conditions.sourceDirection === 'receding' ? -1 : 1;
    const showWaves = conditions.showWavefronts !== false;
    const showCone = conditions.showShockCone !== false && m.isSupersonic;

    // Repeating window cycle so aircraft and wavefronts remain clearly framed inside the viewport
    const cycleDuration = 3.2;
    const cycleT = simTime % cycleDuration;
    const visualSoundSpeed = 1.15;
    const visualSourceSpeed = m.machNumber * visualSoundSpeed * dirSign;

    const currentSourceX = -1.2 * dirSign + visualSourceSpeed * (cycleT - cycleDuration * 0.5);

    if (handles.dopplerSourceGroup) {
      handles.dopplerSourceGroup.position.x = THREE.MathUtils.clamp(currentSourceX, -3.2, 3.2);
      handles.dopplerSourceGroup.rotation.y = dirSign >= 0 ? 0 : Math.PI;
    }

    if (handles.dopplerSourceVelArrow && handles.dopplerSourceGroup) {
      handles.dopplerSourceVelArrow.visible = m.machNumber > 0.01;
      handles.dopplerSourceVelArrow.position.x = handles.dopplerSourceGroup.position.x;
      const vScale = Math.max(0.35, Math.min(1.8, m.machNumber * 0.95));
      handles.dopplerSourceVelArrow.scale.set(dirSign * vScale, 1, 1);
    }

    if (handles.dopplerObsVelArrow) {
      const obsRatio = m.observerSpeedMs / m.soundSpeedMs;
      handles.dopplerObsVelArrow.visible = Math.abs(obsRatio) > 0.01;
      handles.dopplerObsVelArrow.scale.set(-obsRatio * 2.2, 1, 1);
    }

    if (handles.dopplerWavefrontsGroup) {
      handles.dopplerWavefrontsGroup.visible = showWaves;
      const N = handles.dopplerWavefrontRings.length;
      handles.dopplerWavefrontRings.forEach(({ mesh, emitIndex }) => {
        const age = ((cycleT + (emitIndex / N) * cycleDuration) % cycleDuration);
        const radius = Math.max(0.08, age * visualSoundSpeed * 0.85);
        const emitX =
          (handles.dopplerSourceGroup?.position.x ?? 0) - age * visualSourceSpeed * 0.85;
        mesh.position.x = emitX;
        mesh.scale.set(radius, radius, radius);
      });
    }

    // Supersonic Mach shock cone appears ONLY when M >= 1.0
    if (handles.dopplerShockConeGroup && handles.dopplerShockConeMesh && handles.dopplerSourceGroup) {
      handles.dopplerShockConeGroup.visible = showCone;
      handles.dopplerShockConeGroup.position.x = handles.dopplerSourceGroup.position.x;
      handles.dopplerShockConeGroup.rotation.y = dirSign >= 0 ? 0 : Math.PI;
      if (m.machConeHalfAngleDeg !== null) {
        const tanMu = Math.tan((m.machConeHalfAngleDeg * Math.PI) / 180);
        const rScale = THREE.MathUtils.clamp(tanMu * 1.45, 0.35, 1.9);
        handles.dopplerShockConeMesh.scale.set(1, rScale, rScale);
      }
    }
  }

  // =========================================================================
  // 56. SEISMIC WAVES & EARTHQUAKE WAVE PROPAGATION UPDATE
  // =========================================================================
  if (ft === 'seismic-waves-earthquake-lab') {
    const m = calculateSeismicWavesMetrics({
      focusDepthKm: parameters.focusDepthKm,
      pWaveSpeedKms: parameters.pWaveSpeedKms,
      sWaveSpeedKms: parameters.sWaveSpeedKms,
      seismicStationAngleDeg: parameters.seismicStationAngleDeg,
    });

    const waveMode = String(conditions.waveVisibilityMode || 'all_waves');
    const showCutaway = conditions.internalView !== false;

    if (handles.seismicMantleGroup) handles.seismicMantleGroup.visible = showCutaway;
    if (handles.seismicOuterCoreGroup) handles.seismicOuterCoreGroup.visible = showCutaway;
    if (handles.seismicInnerCoreGroup) handles.seismicInnerCoreGroup.visible = showCutaway;

    // Adjust subsurface focus depth along y-axis below epicentre (y = 2.38 is surface)
    const focusY = 2.34 - (m.focusDepthKm / 600) * 0.52;
    if (handles.seismicFocusGroup) {
      handles.seismicFocusGroup.position.y = focusY;
    }

    // Position the selectable seismic station pin at angle theta
    if (handles.seismicSelectableStationPin) {
      const rad = (m.stationAngleDeg * Math.PI) / 180;
      handles.seismicSelectableStationPin.position.set(
        2.38 * Math.sin(rad),
        2.38 * Math.cos(rad),
        0.16
      );
      handles.seismicSelectableStationPin.rotation.z = -rad;
    }

    const showP = waveMode === 'all_waves' || waveMode === 'p_waves_only';
    const showS = waveMode === 'all_waves' || waveMode === 's_waves_only';
    const showSurf = waveMode === 'all_waves' || waveMode === 'surface_waves_only';

    if (handles.seismicPWaveGroup) {
      handles.seismicPWaveGroup.visible = showP && showCutaway;
      const pSpeedNorm = m.pWaveSpeedKms / 8.0;
      handles.seismicPWavePulses.forEach((p) => {
        const u = (simTime * 0.55 * pSpeedNorm + p.phase) % 1.0;
        p.mesh.position.copy(p.curve.getPointAt(u));
      });
    }

    if (handles.seismicSWaveGroup) {
      handles.seismicSWaveGroup.visible = showS && showCutaway;
      const sSpeedNorm = m.sWaveSpeedKms / 8.0;
      handles.seismicSWavePulses.forEach((s) => {
        const u = (simTime * 0.55 * sSpeedNorm + s.phase) % 1.0;
        s.mesh.position.copy(s.curve.getPointAt(u));
      });
    }

    if (handles.seismicSurfaceWaveGroup) {
      handles.seismicSurfaceWaveGroup.visible = showSurf;
      handles.seismicSurfaceRings.forEach((ring, idx) => {
        const u = (simTime * 0.35 + idx * 0.25) % 1.0;
        const theta = u * Math.PI * 0.72;
        const r = 2.39 * Math.sin(theta);
        const y = 2.39 * Math.cos(theta);
        ring.position.y = y;
        const scale = Math.max(0.08, r / (0.6 + idx * 0.35));
        ring.scale.set(scale, scale, 1);
      });
    }
  }

  // =========================================================================
  // 57. GYROSCOPE, TORQUE & ANGULAR MOMENTUM UPDATE
  // =========================================================================
  if (ft === 'gyroscope-torque-angular-momentum-lab') {
    const m = calculateGyroscopeMetrics({
      rotorSpinSpeedRpm: parameters.rotorSpinSpeedRpm,
      appliedTorqueNm: parameters.appliedTorqueNm,
      rotorTiltAngleDeg: parameters.rotorTiltAngleDeg,
      rotorInertiaKgm2: parameters.rotorInertiaKgm2,
      spinDirection: String(conditions.spinDirection || 'ccw_positive'),
    });

    const spinSign = conditions.spinDirection === 'cw_negative' ? -1 : 1;

    // 1. Tilt angle of gyroscope axle from vertical (+y)
    if (handles.gyroTiltAssemblyGroup) {
      handles.gyroTiltAssemblyGroup.rotation.z = -(m.tiltAngleDeg * Math.PI) / 180;
    }

    // 2. Rapid spin of flywheel rotor around its axle (visual scaled for smooth clarity)
    if (handles.gyroRotorGroup) {
      const visualSpinRate = Math.min(28, m.spinAngularVelocityRadS * 0.14);
      handles.gyroRotorGroup.rotation.y = simTime * visualSpinRate * spinSign;
    }

    // 3. Slow azimuthal precession around vertical support axis
    if (handles.gyroPivotPrecessionGroup) {
      handles.gyroPivotPrecessionGroup.rotation.y =
        simTime * m.precessionAngularVelocityRadS * 2.2 * spinSign;
    }

    // 4. Vector visibilities and magnitudes
    if (handles.gyroAngularMomentumGroup) {
      handles.gyroAngularMomentumGroup.visible = conditions.showAngularMomentumVector !== false;
      const lScale = THREE.MathUtils.clamp(m.spinAngularMomentumKgm2S / 5.0, 0.45, 1.65);
      handles.gyroAngularMomentumGroup.scale.set(1, spinSign * lScale, 1);
    }

    if (handles.gyroTorqueVectorGroup) {
      handles.gyroTorqueVectorGroup.visible =
        conditions.showTorqueVector !== false && m.appliedTorqueNm > 0.01;
      const tScale = THREE.MathUtils.clamp(m.appliedTorqueNm / 1.6, 0.35, 1.65);
      handles.gyroTorqueVectorGroup.scale.set(1, 1, tScale);
    }

    if (handles.gyroPrecessionRingGroup) {
      handles.gyroPrecessionRingGroup.visible = conditions.showPrecessionPath !== false;
      const sinTh = Math.sin((m.tiltAngleDeg * Math.PI) / 180);
      const cosTh = Math.cos((m.tiltAngleDeg * Math.PI) / 180);
      const ringRadiusScale = Math.max(0.25, sinTh);
      handles.gyroPrecessionRingGroup.scale.set(ringRadiusScale, 1, ringRadiusScale);
      handles.gyroPrecessionRingGroup.position.y = 0.55 + 2.45 * cosTh - 0.95;
    }
  }

  // =========================================================================
  // 58. SIMPLE HARMONIC MOTION & COUPLED OSCILLATORS UPDATE
  // =========================================================================
  if (ft === 'shm-coupled-oscillators-lab') {
    const m = calculateShmCoupledMetrics({
      massKg: parameters.massKg,
      springStiffnessNm: parameters.springStiffnessNm,
      couplingStiffnessNm: parameters.couplingStiffnessNm,
      initialDisplacementM: parameters.initialDisplacementM,
      initialPhaseOrVel: parameters.initialPhaseOrVel,
      dampingCoefficient: parameters.dampingCoefficient,
      oscillatorPreset: String(conditions.oscillatorPreset || 'weakly_coupled'),
      simTime,
    });

    const eq1X = -1.35;
    const eq2X = 1.35;
    const pos1X = eq1X + m.x1DisplacementM * 0.85;
    const pos2X = eq2X + m.x2DisplacementM * 0.85;

    if (handles.shmMass1Group) {
      handles.shmMass1Group.position.x = pos1X;
      const mScale = THREE.MathUtils.clamp(Math.cbrt(m.massKg), 0.72, 1.35);
      handles.shmMass1Group.scale.set(mScale, mScale, mScale);
    }
    if (handles.shmMass2Group) {
      handles.shmMass2Group.position.x = pos2X;
      const mScale = THREE.MathUtils.clamp(Math.cbrt(m.massKg), 0.72, 1.35);
      handles.shmMass2Group.scale.set(mScale, mScale, mScale);
    }

    // Update left, center, and right helical spring lengths & centers
    const leftWallX = -3.62;
    const rightWallX = 3.62;
    if (handles.shmSpringLeftMesh) {
      const xStart = leftWallX;
      const xEnd = pos1X - 0.42;
      handles.shmSpringLeftMesh.position.x = 0.5 * (xStart + xEnd);
      handles.shmSpringLeftMesh.scale.x = Math.max(0.25, xEnd - xStart);
    }
    if (handles.shmSpringCenterMesh) {
      const isUncoupled = m.couplingStiffnessNm <= 0.01;
      handles.shmSpringCenterMesh.visible = !isUncoupled;
      const xStart = pos1X + 0.42;
      const xEnd = pos2X - 0.42;
      handles.shmSpringCenterMesh.position.x = 0.5 * (xStart + xEnd);
      handles.shmSpringCenterMesh.scale.x = Math.max(0.25, xEnd - xStart);
    }
    if (handles.shmSpringRightMesh) {
      const xStart = pos2X + 0.42;
      const xEnd = rightWallX;
      handles.shmSpringRightMesh.position.x = 0.5 * (xStart + xEnd);
      handles.shmSpringRightMesh.scale.x = Math.max(0.25, xEnd - xStart);
    }

    // Update displacement indicators
    if (handles.shmDispArrow1) {
      handles.shmDispArrow1.visible = Math.abs(m.x1DisplacementM) > 0.03;
      handles.shmDispArrow1.position.x = eq1X;
      handles.shmDispArrow1.scale.x = m.x1DisplacementM * 0.95;
    }
    if (handles.shmDispArrow2) {
      handles.shmDispArrow2.visible = Math.abs(m.x2DisplacementM) > 0.03;
      handles.shmDispArrow2.position.x = eq2X;
      handles.shmDispArrow2.scale.x = m.x2DisplacementM * 0.95;
    }

    // Update scrolling motion trail waveforms
    const showTrails = conditions.showMotionTrails !== false;
    if (handles.shmTrail1Line && handles.shmTrail2Line) {
      handles.shmTrail1Line.visible = showTrails;
      handles.shmTrail2Line.visible = showTrails;
      if (showTrails) {
        const posAttr1 = handles.shmTrail1Line.geometry.getAttribute('position') as THREE.BufferAttribute;
        const posAttr2 = handles.shmTrail2Line.geometry.getAttribute('position') as THREE.BufferAttribute;
        const count = posAttr1.count;
        for (let i = 0; i < count; i++) {
          const histTime = Math.max(0, simTime - i * 0.045);
          const histMetrics = calculateShmCoupledMetrics({
            massKg: parameters.massKg,
            springStiffnessNm: parameters.springStiffnessNm,
            couplingStiffnessNm: parameters.couplingStiffnessNm,
            initialDisplacementM: parameters.initialDisplacementM,
            initialPhaseOrVel: parameters.initialPhaseOrVel,
            dampingCoefficient: parameters.dampingCoefficient,
            oscillatorPreset: String(conditions.oscillatorPreset || 'weakly_coupled'),
            simTime: histTime,
          });
          posAttr1.setX(i, eq1X + histMetrics.x1DisplacementM * 0.85);
          posAttr2.setX(i, eq2X + histMetrics.x2DisplacementM * 0.85);
        }
        posAttr1.needsUpdate = true;
        posAttr2.needsUpdate = true;
      }
    }

    // Update 3D mechanical energy columns
    const showEnergy = conditions.showEnergyVisualization !== false;
    const maxRefE = Math.max(1.0, 0.5 * m.springStiffnessNm * 1.44);
    if (handles.shmEnergyKBar && handles.shmEnergyUBar && handles.shmEnergyTotalBar) {
      handles.shmEnergyKBar.parent!.visible = showEnergy;
      const kH = THREE.MathUtils.clamp(m.kineticEnergyJ / maxRefE, 0.06, 1.15);
      const uH = THREE.MathUtils.clamp(m.potentialEnergyJ / maxRefE, 0.06, 1.15);
      const tH = THREE.MathUtils.clamp(m.totalMechanicalEnergyJ / maxRefE, 0.06, 1.15);
      handles.shmEnergyKBar.scale.y = kH;
      handles.shmEnergyUBar.scale.y = uH;
      handles.shmEnergyTotalBar.scale.y = tH;
    }
  }

  // =========================================================================
  // 59. THERMODYNAMICS: HEAT ENGINE & CARNOT CYCLE UPDATE
  // =========================================================================
  if (ft === 'thermodynamics-carnot-heat-engine') {
    const m = calculateCarnotEngineMetrics({
      hotReservoirTempK: parameters.hotReservoirTempK,
      coldReservoirTempK: parameters.coldReservoirTempK,
      heatInputQhKj: parameters.heatInputQhKj,
      cycleSpeedRpm: parameters.cycleSpeedRpm,
      engineCycleMode: String(conditions.engineCycleMode || 'ideal_carnot'),
      simTime,
    });

    const rpm = Math.max(1, Number(parameters.cycleSpeedRpm ?? 18));
    const phase = ((simTime * rpm) / 60) % 1.0;
    const theta = phase * Math.PI * 2;

    // Piston stroke and working gas expansion/compression
    const stroke = Math.sin(theta) * 0.38;
    if (handles.carnotPistonGroup) {
      handles.carnotPistonGroup.position.y = 0.45 + stroke;
    }
    if (handles.carnotGasCoreMesh) {
      const gasHeightScale = Math.max(0.35, 1.0 + stroke * 0.85);
      handles.carnotGasCoreMesh.scale.y = gasHeightScale;
      handles.carnotGasCoreMesh.position.y = -0.95 + 0.55 * gasHeightScale;
      const mat = handles.carnotGasCoreMesh.material as THREE.MeshStandardMaterial;
      if (m.currentStage === 'isothermal_expansion') {
        mat.color.setHex(0xef4444);
      } else if (m.currentStage === 'adiabatic_expansion') {
        mat.color.setHex(0xf59e0b);
      } else if (m.currentStage === 'isothermal_compression') {
        mat.color.setHex(0x38bdf8);
      } else {
        mat.color.setHex(0xa855f7);
      }
    }

    // Flywheel rotation proportional to work output W
    if (handles.carnotFlywheelGroup) {
      handles.carnotFlywheelGroup.rotation.z = -theta;
    }

    // Energy flow arrows visibility & animation
    const showFlow = conditions.showEnergyFlow !== false;
    if (handles.carnotHeatInGroup) {
      handles.carnotHeatInGroup.visible = showFlow;
      handles.carnotHeatInPulses.forEach((p, idx) => {
        const u = (simTime * 1.4 + idx * 0.33) % 1.0;
        p.position.x = -1.85 + u * 1.05;
      });
    }
    if (handles.carnotHeatOutGroup) {
      handles.carnotHeatOutGroup.visible = showFlow;
      handles.carnotHeatOutPulses.forEach((p, idx) => {
        const u = (simTime * 1.2 + idx * 0.33) % 1.0;
        p.position.x = -0.85 - u * 1.05;
      });
    }

    // P-V diagram visibility & tracer dot along the 4-stage Carnot cycle
    if (handles.carnotPvGroup) {
      handles.carnotPvGroup.visible = conditions.showPvDiagram !== false;
    }
    if (handles.carnotPvTracerDot) {
      const pvX = -0.65 * Math.cos(theta) + 0.15 * Math.sin(theta * 2);
      const pvY = 0.52 * Math.sin(theta + Math.PI * 0.65);
      handles.carnotPvTracerDot.position.set(
        THREE.MathUtils.clamp(pvX, -0.68, 0.68),
        THREE.MathUtils.clamp(pvY, -0.52, 0.58),
        0.09
      );
    }
  }

  // =========================================================================
  // 60. PHOTOELECTRIC EFFECT & QUANTUM ENERGY UPDATE
  // =========================================================================
  if (ft === 'photoelectric-effect-quantum-explorer') {
    const m = calculatePhotoelectricMetrics({
      lightFrequencyThz: parameters.lightFrequencyThz,
      lightIntensityPct: parameters.lightIntensityPct,
      workFunctionEv: parameters.workFunctionEv,
      retardingVoltageV: parameters.retardingVoltageV,
      metalPreset: String(conditions.metalPreset || 'custom'),
    });

    const photonColorHex = frequencyThzToHex(m.lightFrequencyThz);
    if (handles.peLightSourceBeam) {
      const mat = handles.peLightSourceBeam.material as THREE.MeshStandardMaterial;
      mat.color.setHex(photonColorHex);
      mat.emissive.setHex(photonColorHex);
    }

    // 1. Incoming Photons: visible count scales with intensity, colored by frequency f
    const showPhotons = conditions.showPhotons !== false && m.lightIntensityPct > 0;
    if (handles.pePhotonsGroup) {
      handles.pePhotonsGroup.visible = showPhotons;
      const activePhotonCount = Math.ceil((m.lightIntensityPct / 100) * handles.pePhotonPackets.length);
      handles.pePhotonPackets.forEach((pkt, idx) => {
        pkt.group.visible = showPhotons && idx < activePhotonCount;
        const u = (simTime * 1.25 + pkt.phase) % 1.0;
        pkt.group.position.set(-2.35 + u * 1.05, 1.35 - u * 1.15 + pkt.lane * 0.22, pkt.lane * 0.18);
        pkt.group.traverse((c) => {
          if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshStandardMaterial) {
            c.material.color.setHex(photonColorHex);
            c.material.emissive.setHex(photonColorHex);
          }
        });
      });
    }

    // 2. Emitted Photoelectrons: strictly emitted ONLY when hf >= phi (m.isAboveThreshold)
    const showElectrons = conditions.showElectrons !== false && m.isAboveThreshold;
    if (handles.peElectronsGroup) {
      handles.peElectronsGroup.visible = showElectrons;
      const activeElectronCount = Math.ceil(
        (m.lightIntensityPct / 100) * handles.peElectronSpheres.length
      );
      const speedFactor = Math.max(0.45, Math.sqrt(Math.max(0.1, m.maxKineticEnergyEv)) * 0.95);

      handles.peElectronSpheres.forEach((el, idx) => {
        el.mesh.visible = showElectrons && idx < activeElectronCount;
        const u = (simTime * speedFactor + el.phase) % 1.0;
        if (m.reachesCollector) {
          // Crosses full gap from cathode (-1.2) to collector (+1.0)
          el.mesh.position.set(-1.2 + u * 2.2, 0.05 + el.lane, 0);
        } else {
          // Repelled by retarding potential V_ret >= V_stop before reaching collector
          const turnAroundU = 4 * u * (1 - u); // Parabolic turnaround
          el.mesh.position.set(-1.2 + turnAroundU * 1.45, 0.05 + el.lane, 0);
        }
      });
    }

    // 3. Ammeter Needle deflection proportional to photocurrent
    if (handles.peAmmeterNeedle) {
      const angle = THREE.MathUtils.clamp((m.photocurrentMicroAmps / 45) * 1.1, 0, 1.2);
      handles.peAmmeterNeedle.rotation.z = -angle;
    }

    // 4. Quantum Energy-Level Diagram Bars (hf, phi, K_max)
    if (handles.peEnergyDiagramGroup) {
      handles.peEnergyDiagramGroup.visible = conditions.showEnergyDiagram !== false;
    }
    if (handles.pePhotonEnergyBar && handles.peWorkFunctionBar && handles.peKineticEnergyBar) {
      handles.pePhotonEnergyBar.scale.y = THREE.MathUtils.clamp(m.photonEnergyEv / 4.5, 0.12, 1.35);
      handles.peWorkFunctionBar.scale.y = THREE.MathUtils.clamp(m.workFunctionEv / 4.5, 0.12, 1.35);
      handles.peKineticEnergyBar.scale.y = THREE.MathUtils.clamp(
        Math.max(0.04, m.maxKineticEnergyEv / 4.5),
        0.04,
        1.35
      );
    }

    // 5. Stopping-potential indicator bar
    if (handles.peStoppingBar) {
      const stopScale = THREE.MathUtils.clamp(Math.max(0.1, m.stoppingPotentialV / 3.0), 0.1, 1.35);
      handles.peStoppingBar.scale.x = stopScale;
    }
  }

  // =========================================================================
  // 61. SPECIAL RELATIVITY: TIME DILATION & LENGTH CONTRACTION UPDATE
  // =========================================================================
  if (ft === 'special-relativity-time-length-lab') {
    const m = calculateSpecialRelativityMetrics({
      velocityFractionC: parameters.velocityFractionC,
      properLengthMeters: parameters.properLengthMeters,
      properTimeIntervalNs: parameters.properTimeIntervalNs,
    });

    const playbackSpeed = Math.max(0.1, Number(parameters.visualPlaybackSpeed ?? 1.0));
    const isShipRestFrame = conditions.referenceFrameMode === 'spacecraft_rest_frame';
    const invGamma = 1.0 / m.lorentzFactorGamma;

    // 1. Length Contraction ONLY along direction of motion (x-axis); transverse y and z stay 1.0!
    if (handles.srSpacecraftGroup) {
      const xScale = isShipRestFrame ? 1.0 : invGamma;
      handles.srSpacecraftGroup.scale.set(xScale, 1.0, 1.0);
    }

    if (handles.srContractedLengthGroup) {
      const xScale = isShipRestFrame ? 1.0 : invGamma;
      handles.srContractedLengthGroup.scale.set(xScale, 1.0, 1.0);
    }

    // 2. Light-Clock Photon Bounce & Diagonal Path
    if (handles.srLightClockGroup) {
      handles.srLightClockGroup.visible = conditions.showLightClock !== false;
    }
    if (handles.srPhotonBall) {
      // Proper time tick rate slows by 1/gamma in the stationary lab frame
      const tickRate = isShipRestFrame ? 2.2 : 2.2 * invGamma;
      const bounceY = Math.sin(simTime * playbackSpeed * tickRate * Math.PI) * 0.42;
      const horizOffset = isShipRestFrame
        ? 0
        : Math.cos(simTime * playbackSpeed * tickRate * Math.PI * 0.5) * 0.45 * m.velocityFractionC;
      handles.srPhotonBall.position.set(horizOffset, bounceY, 0);
    }
    if (handles.srDiagonalWaveLine) {
      handles.srDiagonalWaveLine.visible =
        !isShipRestFrame && m.velocityFractionC > 0.02 && conditions.showLightClock !== false;
      handles.srDiagonalWaveLine.scale.x = Math.max(0.1, m.velocityFractionC * 1.15);
    }

    // 3. Velocity Vector
    if (handles.srVelocityVectorGroup) {
      handles.srVelocityVectorGroup.visible =
        conditions.showVelocityVector !== false && m.velocityFractionC > 0.005;
      const vScale = Math.max(0.25, m.velocityFractionC * 1.35);
      handles.srVelocityVectorGroup.scale.set(isShipRestFrame ? -vScale : vScale, 1, 1);
    }

    // 4. Synchronized Coordinate Time (Delta t = gamma * Delta tau) vs Proper Time (Delta tau) Clocks
    const baseOmega = simTime * playbackSpeed * 1.4;
    if (handles.srCoordClockHand) {
      handles.srCoordClockHand.rotation.z = -baseOmega * m.lorentzFactorGamma;
    }
    if (handles.srProperClockHand) {
      handles.srProperClockHand.rotation.z = -baseOmega;
    }
    if (handles.srOnboardClockHand) {
      handles.srOnboardClockHand.rotation.z = -baseOmega;
    }
  }
}
