import * as THREE from 'three';
import { ScientificModelSpec, ModelPartSpec } from '../../types/aiModel';
import {
  calculateMaxwellEquationsMetrics,
  calculateAcRlcCircuitMetrics,
  calculateThinLensOpticsMetrics,
  calculateDopplerUltrasoundMetrics,
  calculateEarthMagnetosphereMetrics,
  calculateSemiconductorPnJunctionMetrics,
  calculateRadioactiveDecayMetrics,
} from './advancedPhysicsBatch4Engine';

export const ADVANCED_PHYSICS_BATCH_4_TYPES = new Set<string>([
  'maxwell-equations-em-field-explorer',
  'ac-circuits-rlc-resonance-lab',
  'lenses-optical-instruments-lab',
  'doppler-ultrasound-flow-explorer',
  'earth-magnetic-field-magnetosphere-explorer',
  'semiconductor-pn-junction-diode-explorer',
  'radioactive-decay-halflife-radiation-lab',
]);

export function isAdvancedPhysicsBatch4Model(functionalType?: string, id?: string): boolean {
  return (
    (Boolean(functionalType) && ADVANCED_PHYSICS_BATCH_4_TYPES.has(functionalType!)) ||
    (Boolean(id) && ADVANCED_PHYSICS_BATCH_4_TYPES.has(id!))
  );
}

export interface Batch4SceneHandles {
  rootGroup: THREE.Group;
}

// ============================================================================
// SHARED STUDIO MATERIAL & REGISTRATION HELPERS
// ============================================================================
function matMetal(color: number, roughness = 0.28, metalness = 0.82): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function matPlastic(color: number, roughness = 0.38, metalness = 0.08): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function matGlass(color: number, opacity = 0.34): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    transparent: true,
    opacity,
    roughness: 0.12,
    metalness: 0.05,
    transmission: 0.45,
    depthWrite: false,
  });
}

function matGlow(color: number, intensity = 0.85, opacity = 0.92): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.2,
    metalness: 0.1,
    transparent: opacity < 1,
    opacity,
  });
}

function makeOpaqueProxyInvisible(mesh: THREE.Object3D | undefined): void {
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

function createRegisteredPartGroup(
  partId: string,
  rootGroup: THREE.Group,
  modelSpec: ScientificModelSpec,
  meshMap: Map<string, THREE.Object3D>,
  interactiveMeshes: THREE.Object3D[],
  buildChildren: (g: THREE.Group) => void,
  customAnchor?: [number, number, number]
): THREE.Group {
  const partSpec: ModelPartSpec | undefined = modelSpec.parts.find((p) => p.id === partId);
  makeOpaqueProxyInvisible(meshMap.get(partId));

  const group = new THREE.Group();
  group.name = partId;
  buildChildren(group);

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

  rootGroup.add(group);
  return group;
}

function createArrowMesh(color: number, length = 0.55, radius = 0.032): THREE.Group {
  const g = new THREE.Group();
  const shaftLen = length * 0.68;
  const headLen = length * 0.32;
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, shaftLen, 10),
    matGlow(color, 0.7)
  );
  shaft.position.y = shaftLen * 0.5;
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(radius * 2.5, headLen, 12),
    matGlow(color, 0.9)
  );
  head.position.y = shaftLen + headLen * 0.5;
  g.add(shaft, head);
  return g;
}

function orientArrowAlongDirection(arrow: THREE.Object3D, dir: THREE.Vector3): void {
  const norm = dir.clone().normalize();
  if (norm.lengthSq() < 1e-6) return;
  const up = new THREE.Vector3(0, 1, 0);
  arrow.quaternion.setFromUnitVectors(up, norm);
}

function positionSegmentBetweenPoints(
  mesh: THREE.Mesh,
  pStart: THREE.Vector3,
  pEnd: THREE.Vector3
): void {
  const diff = pEnd.clone().sub(pStart);
  const len = diff.length();
  if (len < 1e-4) {
    mesh.visible = false;
    return;
  }
  mesh.visible = true;
  mesh.position.copy(pStart).addScaledVector(diff, 0.5);
  mesh.scale.set(1, len, 1);
  const up = new THREE.Vector3(0, 1, 0);
  mesh.quaternion.setFromUnitVectors(up, diff.clone().normalize());
}

// ============================================================================
// 62. MAXWELL'S EQUATIONS & ELECTROMAGNETIC FIELD EXPLORER
// ============================================================================
function buildMaxwellEquationsScene(
  root: THREE.Group,
  modelSpec: ScientificModelSpec,
  meshMap: Map<string, THREE.Object3D>,
  interactiveMeshes: THREE.Object3D[]
): void {
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(10.8, 0.26, 5.4),
    matMetal(0x0f172a, 0.45, 0.65)
  );
  base.position.set(0, -1.05, 0);
  root.add(base);

  let q1Sphere!: THREE.Mesh;
  let q2Sphere!: THREE.Mesh;
  let gaussianSphere!: THREE.Mesh;
  let gaussianWire!: THREE.Mesh;
  let pedestal1!: THREE.Mesh;
  let pedestal2!: THREE.Mesh;

  const gCharges = createRegisteredPartGroup(
    'maxwell_charges_and_gaussian_surface',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      q1Sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 28, 28),
        matGlow(0xef4444, 0.78)
      );
      q1Sphere.position.set(-3.1, 0.7, 0);

      q2Sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 28, 28),
        matGlow(0x3b82f6, 0.78)
      );
      q2Sphere.position.set(-1.7, 0.7, 0);

      gaussianSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.74, 24, 24),
        matGlass(0xfbbf24, 0.22)
      );
      gaussianSphere.position.copy(q1Sphere.position);

      gaussianWire = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 16, 12),
        new THREE.MeshBasicMaterial({
          color: 0xfde047,
          wireframe: true,
          transparent: true,
          opacity: 0.36,
        })
      );
      gaussianWire.position.copy(q1Sphere.position);

      pedestal1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.14, 1.5, 16),
        matPlastic(0x334155)
      );
      pedestal1.position.set(-3.1, -0.15, 0);

      pedestal2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.14, 1.5, 16),
        matPlastic(0x334155)
      );
      pedestal2.position.set(-1.7, -0.15, 0);

      g.add(q1Sphere, q2Sphere, gaussianSphere, gaussianWire, pedestal1, pedestal2);
    }
  );

  const eArrows: THREE.Group[] = [];
  const dipoleArcs: THREE.Mesh[] = [];
  const gEField = createRegisteredPartGroup(
    'maxwell_electric_field_lines',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      for (let i = 0; i < 24; i++) {
        const arr = createArrowMesh(0xf97316, 0.42, 0.025);
        g.add(arr);
        eArrows.push(arr);
      }
      for (let k = 0; k < 6; k++) {
        const angle = (k / 6) * Math.PI * 2;
        const curvePts: THREE.Vector3[] = [];
        for (let s = 0; s <= 20; s++) {
          const t = s / 20;
          const x = THREE.MathUtils.lerp(-3.1, -1.7, t);
          const bow = Math.sin(t * Math.PI) * 0.72;
          const y = 0.7 + Math.cos(angle) * bow;
          const z = Math.sin(angle) * bow;
          curvePts.push(new THREE.Vector3(x, y, z));
        }
        const curve = new THREE.CatmullRomCurve3(curvePts);
        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 24, 0.018, 8, false),
          matGlow(0xfb923c, 0.65, 0.78)
        );
        g.add(tube);
        dipoleArcs.push(tube);
      }
    }
  );

  let magPillbox!: THREE.Mesh;
  const gMagGauss = createRegisteredPartGroup(
    'maxwell_magnetic_closed_surface_dipole',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const northHalf = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.28, 0.28),
        matPlastic(0xef4444, 0.3)
      );
      northHalf.position.set(-0.62, 0.7, -1.55);
      const southHalf = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.28, 0.28),
        matPlastic(0x3b82f6, 0.3)
      );
      southHalf.position.set(-0.17, 0.7, -1.55);
      magPillbox = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 0.85, 20),
        matGlass(0x38bdf8, 0.24)
      );
      magPillbox.rotation.z = Math.PI / 2;
      magPillbox.position.set(-0.4, 0.7, -1.55);

      for (const side of [-1, 1]) {
        const loop = new THREE.Mesh(
          new THREE.TorusGeometry(0.48, 0.018, 10, 32),
          matGlow(0x38bdf8, 0.7)
        );
        loop.position.set(-0.4, 0.7 + side * 0.32, -1.55);
        g.add(loop);
      }
      g.add(northHalf, southHalf, magPillbox);
    }
  );

  let inducedEFieldLoop!: THREE.Mesh;
  let bFluxArrow!: THREE.Group;
  const gFaraday = createRegisteredPartGroup(
    'maxwell_faraday_induction_coil',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const faradayRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.65, 0.045, 16, 40),
        matMetal(0xd97706, 0.25, 0.88)
      );
      faradayRing.position.set(0.35, 0.7, 1.15);
      inducedEFieldLoop = new THREE.Mesh(
        new THREE.TorusGeometry(0.78, 0.022, 12, 36),
        matGlow(0xa855f7, 0.9)
      );
      inducedEFieldLoop.position.copy(faradayRing.position);
      bFluxArrow = createArrowMesh(0x38bdf8, 1.1, 0.038);
      bFluxArrow.rotation.x = Math.PI / 2;
      bFluxArrow.position.set(0.35, 0.7, 0.6);
      g.add(faradayRing, inducedEFieldLoop, bFluxArrow);
    }
  );

  const bRings: THREE.Mesh[] = [];
  const gAmpere = createRegisteredPartGroup(
    'maxwell_ampere_conductor_and_capacitor',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const wireLeft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 1.05, 16),
        matMetal(0xb45309, 0.3, 0.85)
      );
      wireLeft.rotation.z = Math.PI / 2;
      wireLeft.position.set(1.25, 0.7, -0.65);

      const wireRight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 1.05, 16),
        matMetal(0xb45309, 0.3, 0.85)
      );
      wireRight.rotation.z = Math.PI / 2;
      wireRight.position.set(2.55, 0.7, -0.65);

      const capPlateL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.04, 24),
        matMetal(0x94a3b8, 0.25, 0.9)
      );
      capPlateL.rotation.z = Math.PI / 2;
      capPlateL.position.set(1.78, 0.7, -0.65);

      const capPlateR = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.04, 24),
        matMetal(0x94a3b8, 0.25, 0.9)
      );
      capPlateR.rotation.z = Math.PI / 2;
      capPlateR.position.set(2.02, 0.7, -0.65);

      for (const xPos of [1.35, 1.9, 2.45]) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.56, 0.024, 12, 36),
          matGlow(0x22c55e, 0.85)
        );
        ring.rotation.y = Math.PI / 2;
        ring.position.set(xPos, 0.7, -0.65);
        g.add(ring);
        bRings.push(ring);
      }
      g.add(wireLeft, wireRight, capPlateL, capPlateR);
    }
  );

  const eWaveBars: THREE.Mesh[] = [];
  const bWaveBars: THREE.Mesh[] = [];
  const gWave = createRegisteredPartGroup(
    'maxwell_em_wave_ribbon',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const axisBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 3.6, 12),
        matPlastic(0x94a3b8)
      );
      axisBar.rotation.z = Math.PI / 2;
      axisBar.position.set(3.1, 0.7, 1.15);
      g.add(axisBar);

      const sampleCount = 24;
      for (let i = 0; i < sampleCount; i++) {
        const x = 1.4 + (i / (sampleCount - 1)) * 3.4;
        const eBar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.022, 1, 8),
          matGlow(0xfacc15, 0.9)
        );
        eBar.position.set(x, 0.7, 1.15);
        const bBar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.022, 1, 8),
          matGlow(0x38bdf8, 0.9)
        );
        bBar.rotation.x = Math.PI / 2;
        bBar.position.set(x, 0.7, 1.15);
        g.add(eBar, bBar);
        eWaveBars.push(eBar);
        bWaveBars.push(bBar);
      }
    }
  );

  root.userData.maxwellRefs = {
    q1Sphere,
    q2Sphere,
    gaussianSphere,
    gaussianWire,
    pedestal1,
    pedestal2,
    magPillbox,
    eArrows,
    dipoleArcs,
    bRings,
    inducedEFieldLoop,
    bFluxArrow,
    eWaveBars,
    bWaveBars,
    gCharges,
    gEField,
    gMagGauss,
    gFaraday,
    gAmpere,
    gWave,
  };
}

function updateMaxwellEquationsScene(
  root: THREE.Group,
  simValues: Record<string, any>,
  time: number
): void {
  const refs = root.userData.maxwellRefs;
  if (!refs) return;

  const metrics = calculateMaxwellEquationsMetrics(simValues);
  const viewMode = String(simValues.explorerViewMode || 'all_coupled');
  const showVectors = simValues.showFieldVectors !== false;
  const showAnnotations = simValues.showExplanatoryAnnotations !== false;

  const halfSep = Math.max(0.35, Math.min(1.1, metrics.chargeSeparationM * 0.45));
  const xCenter = -2.4;
  const x1 = xCenter - halfSep;
  const x2 = xCenter + halfSep;

  refs.q1Sphere.position.x = x1;
  refs.pedestal1.position.x = x1;
  refs.gaussianSphere.position.x = x1;
  refs.gaussianWire.position.x = x1;
  refs.gaussianSphere.visible = showAnnotations;
  refs.gaussianWire.visible = showAnnotations;
  refs.magPillbox.visible = showAnnotations;

  refs.q2Sphere.position.x = x2;
  refs.pedestal2.position.x = x2;
  refs.q2Sphere.visible = Math.abs(metrics.q2MicroC) > 0.05;
  refs.pedestal2.visible = refs.q2Sphere.visible;

  const q2Color = metrics.q2MicroC >= 0 ? 0xef4444 : 0x3b82f6;
  (refs.q2Sphere.material as THREE.MeshStandardMaterial).color.setHex(q2Color);
  (refs.q2Sphere.material as THREE.MeshStandardMaterial).emissive.setHex(q2Color);

  const q1Scale = 0.75 + Math.min(0.65, metrics.q1MicroC / 25);
  refs.q1Sphere.scale.setScalar(q1Scale);

  const pos1 = new THREE.Vector3(x1, 0.7, 0);
  const pos2 = new THREE.Vector3(x2, 0.7, 0);
  refs.eArrows.forEach((arr: THREE.Group, idx: number) => {
    arr.visible = showVectors && (viewMode === 'all_coupled' || viewMode === 'electric_field');
    if (!arr.visible) return;
    const ringIdx = Math.floor(idx / 8);
    const ang = ((idx % 8) / 8) * Math.PI * 2 + time * 0.35;
    const r = 0.52 + ringIdx * 0.32;
    const anchor = idx < 16 ? pos1 : pos2;
    const pt = new THREE.Vector3(
      anchor.x + Math.cos(ang) * r,
      anchor.y + Math.sin(ang) * r * 0.85,
      Math.sin(ang * 2) * 0.28
    );
    const d1 = pt.clone().sub(pos1);
    const d2 = pt.clone().sub(pos2);
    const r1Sq = Math.max(0.12, d1.lengthSq());
    const r2Sq = Math.max(0.12, d2.lengthSq());
    const eVec = d1
      .normalize()
      .multiplyScalar(metrics.q1MicroC / r1Sq)
      .add(d2.normalize().multiplyScalar(metrics.q2MicroC / r2Sq));
    arr.position.copy(pt);
    orientArrowAlongDirection(arr, eVec);
  });

  refs.dipoleArcs.forEach((tube: THREE.Mesh) => {
    tube.visible =
      showVectors &&
      metrics.q2MicroC < 0 &&
      (viewMode === 'all_coupled' || viewMode === 'electric_field');
  });

  const bScale = 0.65 + (metrics.conductorCurrentAmps / 45) * 0.65;
  refs.bRings.forEach((ring: THREE.Mesh, idx: number) => {
    ring.visible =
      showVectors &&
      metrics.conductorCurrentAmps > 0.1 &&
      (viewMode === 'all_coupled' || viewMode === 'magnetic_field');
    const pulse = 1 + 0.08 * Math.sin(time * 4 - idx * 0.9);
    ring.scale.setScalar(bScale * pulse);
  });

  const osc = Math.sin(time * (metrics.oscillationFrequencyMhz / 35));
  refs.bFluxArrow.scale.set(1, Math.max(0.25, Math.abs(osc) * 1.25), 1);
  refs.inducedEFieldLoop.scale.setScalar(0.92 + 0.15 * Math.abs(Math.cos(time * 3)));
  refs.inducedEFieldLoop.visible = showAnnotations;

  const kWave = (2 * Math.PI) / Math.max(1.1, metrics.emWavelengthMeters * 0.65);
  const omega = 3.5 + metrics.oscillationFrequencyMhz / 55;
  const amp = 0.28 + Math.min(0.48, metrics.q1MicroC / 32);
  const showWave = viewMode === 'all_coupled' || viewMode === 'em_wave';
  refs.gWave.visible = showWave;
  refs.eWaveBars.forEach((eBar: THREE.Mesh, i: number) => {
    const bBar = refs.bWaveBars[i];
    const phase = i * 0.35 * kWave - time * omega;
    const val = Math.sin(phase) * amp;
    const mag = Math.max(0.04, Math.abs(val));
    eBar.scale.set(1, mag, 1);
    eBar.position.y = 0.7 + val * 0.5;
    bBar.scale.set(1, mag, 1);
    bBar.position.z = 1.15 + val * 0.5;
  });
}

// ============================================================================
// 63. AC CIRCUITS, RLC RESONANCE & IMPEDANCE LABORATORY
// ============================================================================
function buildAcRlcCircuitScene(
  root: THREE.Group,
  modelSpec: ScientificModelSpec,
  meshMap: Map<string, THREE.Object3D>,
  interactiveMeshes: THREE.Object3D[]
): void {
  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(10.2, 0.3, 5.8),
    matMetal(0x0f172a, 0.45, 0.6)
  );
  bench.position.set(0, -0.95, 0);
  root.add(bench);

  let rotorRing!: THREE.Mesh;
  createRegisteredPartGroup(
    'rlc_ac_source_generator',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const genBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.68, 0.72, 0.65, 28),
        matMetal(0x0284c7, 0.3, 0.75)
      );
      genBody.position.set(-3.4, -0.35, 1.35);
      rotorRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.045, 12, 28),
        matGlow(0x38bdf8, 0.85)
      );
      rotorRing.rotation.x = Math.PI / 2;
      rotorRing.position.set(-3.4, 0.02, 1.35);
      g.add(genBody, rotorRing);
    }
  );

  createRegisteredPartGroup(
    'rlc_precision_resistor',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const resBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 1.35, 24),
        matPlastic(0xf97316, 0.35)
      );
      resBody.rotation.z = Math.PI / 2;
      resBody.position.set(-2.2, -0.35, -1.35);
      for (const offset of [-0.38, -0.12, 0.14, 0.38]) {
        const band = new THREE.Mesh(
          new THREE.CylinderGeometry(0.295, 0.295, 0.08, 24),
          matGlow(0xfef08a, 0.5)
        );
        band.rotation.z = Math.PI / 2;
        band.position.set(-2.2 + offset, -0.35, -1.35);
        g.add(band);
      }
      g.add(resBody);
    }
  );

  let inductorFluxCore!: THREE.Mesh;
  createRegisteredPartGroup(
    'rlc_helical_inductor',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const helixPts: THREE.Vector3[] = [];
      const turns = 7;
      for (let i = 0; i <= 120; i++) {
        const t = i / 120;
        const angle = t * turns * Math.PI * 2;
        helixPts.push(
          new THREE.Vector3(
            -0.55 + t * 1.4,
            -0.35 + Math.cos(angle) * 0.32,
            -1.35 + Math.sin(angle) * 0.32
          )
        );
      }
      const helixCurve = new THREE.CatmullRomCurve3(helixPts);
      const coilMesh = new THREE.Mesh(
        new THREE.TubeGeometry(helixCurve, 120, 0.048, 12, false),
        matMetal(0xa855f7, 0.25, 0.85)
      );
      inductorFluxCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 1.5, 18),
        matGlow(0xc084fc, 0.65, 0.42)
      );
      inductorFluxCore.rotation.z = Math.PI / 2;
      inductorFluxCore.position.set(0.15, -0.35, -1.35);
      g.add(coilMesh, inductorFluxCore);
    }
  );

  let dielectric!: THREE.Mesh;
  createRegisteredPartGroup(
    'rlc_parallel_capacitor',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const plateLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.9, 0.9),
        matMetal(0x22c55e, 0.25, 0.85)
      );
      plateLeft.position.set(2.35, -0.35, -1.35);
      const plateRight = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.9, 0.9),
        matMetal(0x22c55e, 0.25, 0.85)
      );
      plateRight.position.set(2.85, -0.35, -1.35);
      dielectric = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.82, 0.82),
        matGlass(0x4ade80, 0.32)
      );
      dielectric.position.set(2.6, -0.35, -1.35);
      g.add(plateLeft, plateRight, dielectric);
    }
  );

  const carriers: THREE.Mesh[] = [];
  createRegisteredPartGroup(
    'rlc_conduction_loop_and_meters',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const railGeo = new THREE.BoxGeometry(7.2, 0.08, 0.08);
      const topRail = new THREE.Mesh(railGeo, matMetal(0x94a3b8));
      topRail.position.set(0, -0.35, -1.35);
      const botRail = new THREE.Mesh(railGeo, matMetal(0x94a3b8));
      botRail.position.set(0, -0.35, 1.35);
      const sideGeo = new THREE.BoxGeometry(0.08, 0.08, 2.78);
      const leftRail = new THREE.Mesh(sideGeo, matMetal(0x94a3b8));
      leftRail.position.set(-3.6, -0.35, 0);
      const rightRail = new THREE.Mesh(sideGeo, matMetal(0x94a3b8));
      rightRail.position.set(3.6, -0.35, 0);
      g.add(topRail, botRail, leftRail, rightRail);

      for (let i = 0; i < 28; i++) {
        const c = new THREE.Mesh(
          new THREE.SphereGeometry(0.075, 14, 14),
          matGlow(0xfacc15, 0.95)
        );
        g.add(c);
        carriers.push(c);
      }
    }
  );

  const vTraceBars: THREE.Mesh[] = [];
  const iTraceBars: THREE.Mesh[] = [];
  let vPhasorArrow!: THREE.Group;
  let iPhasorArrow!: THREE.Group;
  const gDeck = createRegisteredPartGroup(
    'rlc_oscilloscope_and_phasor_deck',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(7.4, 2.2, 0.16),
        matPlastic(0x0f172a, 0.35)
      );
      board.position.set(0, 1.45, -2.25);
      g.add(board);

      for (let i = 0; i < 32; i++) {
        const x = -3.2 + (i / 31) * 3.8;
        const vDot = new THREE.Mesh(
          new THREE.SphereGeometry(0.045, 10, 10),
          matGlow(0x38bdf8, 0.9)
        );
        vDot.position.set(x, 1.45, -2.12);
        const iDot = new THREE.Mesh(
          new THREE.SphereGeometry(0.045, 10, 10),
          matGlow(0xfacc15, 0.9)
        );
        iDot.position.set(x, 1.45, -2.1);
        g.add(vDot, iDot);
        vTraceBars.push(vDot);
        iTraceBars.push(iDot);
      }

      const phasorRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.68, 0.02, 12, 36),
        matPlastic(0x475569)
      );
      phasorRing.position.set(2.15, 1.45, -2.14);
      vPhasorArrow = createArrowMesh(0x38bdf8, 0.62, 0.026);
      vPhasorArrow.position.set(2.15, 1.45, -2.11);
      iPhasorArrow = createArrowMesh(0xfacc15, 0.56, 0.026);
      iPhasorArrow.position.set(2.15, 1.45, -2.09);
      g.add(phasorRing, vPhasorArrow, iPhasorArrow);
    }
  );

  root.userData.rlcRefs = {
    rotorRing,
    inductorFluxCore,
    dielectric,
    carriers,
    vTraceBars,
    iTraceBars,
    vPhasorArrow,
    iPhasorArrow,
    gDeck,
  };
}

function updateAcRlcCircuitScene(
  root: THREE.Group,
  simValues: Record<string, any>,
  time: number
): void {
  const refs = root.userData.rlcRefs;
  if (!refs) return;

  const metrics = calculateAcRlcCircuitMetrics(simValues);
  const phiRad = THREE.MathUtils.degToRad(metrics.phaseAngleDeg);
  const omegaVis = 2.2 + (metrics.frequencyHz / 100) * 1.8;

  refs.rotorRing.rotation.z = time * omegaVis;
  refs.gDeck.visible = simValues.showPhasorAndGraphs !== false;

  (refs.inductorFluxCore.material as THREE.MeshStandardMaterial).emissiveIntensity =
    metrics.inductanceMilliH > 0
      ? 0.25 + 0.85 * Math.abs(Math.cos(time * omegaVis - phiRad))
      : 0.05;
  (refs.dielectric.material as THREE.MeshPhysicalMaterial).opacity =
    metrics.capacitanceMicroF > 0
      ? 0.18 + 0.45 * Math.abs(Math.sin(time * omegaVis - phiRad))
      : 0.1;

  const ampScale = Math.min(1.4, metrics.rmsCurrentAmps / 2.2);
  const oscDisp = Math.sin(time * omegaVis - phiRad) * 0.055 * ampScale;
  const totalCount = refs.carriers.length;
  refs.carriers.forEach((c: THREE.Mesh, idx: number) => {
    const s = ((idx / totalCount) + oscDisp + 10) % 1;
    let x = 0;
    let z = 0;
    if (s < 0.3) {
      x = THREE.MathUtils.lerp(-3.6, 3.6, s / 0.3);
      z = -1.35;
    } else if (s < 0.5) {
      x = 3.6;
      z = THREE.MathUtils.lerp(-1.35, 1.35, (s - 0.3) / 0.2);
    } else if (s < 0.8) {
      x = THREE.MathUtils.lerp(3.6, -3.6, (s - 0.5) / 0.3);
      z = 1.35;
    } else {
      x = -3.6;
      z = THREE.MathUtils.lerp(1.35, -1.35, (s - 0.8) / 0.2);
    }
    c.position.set(x, -0.35, z);
  });

  const iAmpVis = Math.min(0.65, 0.18 + metrics.rmsCurrentAmps * 0.11);
  refs.vTraceBars.forEach((vDot: THREE.Mesh, idx: number) => {
    const iDot = refs.iTraceBars[idx];
    const phase = (idx / 31) * Math.PI * 3 - time * omegaVis;
    vDot.position.y = 1.45 + Math.sin(phase) * 0.62;
    iDot.position.y = 1.45 + Math.sin(phase - phiRad) * iAmpVis;
  });

  const vAngle = time * omegaVis;
  const iAngle = vAngle - phiRad;
  refs.vPhasorArrow.rotation.z = vAngle - Math.PI / 2;
  refs.iPhasorArrow.rotation.z = iAngle - Math.PI / 2;
}

// ============================================================================
// 64. LENSES, OPTICAL INSTRUMENTS & IMAGE FORMATION LABORATORY
// ============================================================================
function buildThinLensOpticsScene(
  root: THREE.Group,
  modelSpec: ScientificModelSpec,
  meshMap: Map<string, THREE.Object3D>,
  interactiveMeshes: THREE.Object3D[]
): void {
  const focalMarkers: THREE.Mesh[] = [];
  createRegisteredPartGroup(
    'optics_calibrated_rail_axis',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const railBeam = new THREE.Mesh(
        new THREE.BoxGeometry(10.8, 0.22, 0.55),
        matMetal(0x334155, 0.35, 0.75)
      );
      railBeam.position.set(0, -0.85, 0);
      const principalAxisLine = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 10.6, 10),
        matGlow(0x94a3b8, 0.45)
      );
      principalAxisLine.rotation.z = Math.PI / 2;
      principalAxisLine.position.set(0, 0.4, 0);
      g.add(railBeam, principalAxisLine);

      for (let i = 0; i < 4; i++) {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.075, 16, 16),
          matGlow(i % 2 === 0 ? 0xfacc15 : 0xf97316, 0.9)
        );
        m.position.set(0, 0.4, 0);
        g.add(m);
        focalMarkers.push(m);
      }
    }
  );

  let lensDisc!: THREE.Mesh;
  createRegisteredPartGroup(
    'optics_primary_objective_lens',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      lensDisc = new THREE.Mesh(
        new THREE.SphereGeometry(1.18, 32, 24),
        matGlass(0x38bdf8, 0.42)
      );
      lensDisc.scale.set(0.18, 1.0, 1.0);
      lensDisc.position.set(0, 0.4, 0);
      const lensRim = new THREE.Mesh(
        new THREE.TorusGeometry(1.18, 0.04, 14, 40),
        matMetal(0x0284c7, 0.25, 0.85)
      );
      lensRim.rotation.y = Math.PI / 2;
      lensRim.position.set(0, 0.4, 0);
      const lensStand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.14, 1.1, 16),
        matMetal(0x475569)
      );
      lensStand.position.set(0, -0.35, 0);
      g.add(lensDisc, lensRim, lensStand);
    }
  );

  let objArrow!: THREE.Group;
  createRegisteredPartGroup(
    'optics_illuminated_object_arrow',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      objArrow = createArrowMesh(0x22c55e, 1.0, 0.045);
      objArrow.position.set(-2.5, 0.4, 0);
      g.add(objArrow);
    }
  );

  const incidentRays: THREE.Mesh[] = [];
  const refractedRays: THREE.Mesh[] = [];
  const virtualRays: THREE.Mesh[] = [];
  createRegisteredPartGroup(
    'optics_principal_ray_bundle',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const rayColors = [0xf59e0b, 0x38bdf8, 0xec4899];
      for (let i = 0; i < 3; i++) {
        const inc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 1, 8),
          matGlow(rayColors[i], 0.9)
        );
        const ref = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 1, 8),
          matGlow(rayColors[i], 0.9)
        );
        const virt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.012, 0.012, 1, 8),
          matGlow(rayColors[i], 0.55, 0.45)
        );
        g.add(inc, ref, virt);
        incidentRays.push(inc);
        refractedRays.push(ref);
        virtualRays.push(virt);
      }
    }
  );

  let imgArrow!: THREE.Group;
  let imgScreen!: THREE.Mesh;
  createRegisteredPartGroup(
    'optics_image_plane_and_arrow',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      imgArrow = createArrowMesh(0xf43f5e, 1.0, 0.045);
      imgScreen = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 2.2, 1.8),
        matGlass(0xe2e8f0, 0.22)
      );
      g.add(imgArrow, imgScreen);
    }
  );

  const gEyepiece = createRegisteredPartGroup(
    'optics_eyepiece_instrument_lens',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const eyeDisc = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, 28, 20),
        matGlass(0x818cf8, 0.38)
      );
      eyeDisc.scale.set(0.16, 1.0, 1.0);
      const eyeRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.95, 0.035, 12, 36),
        matMetal(0x6366f1, 0.25, 0.85)
      );
      eyeRim.rotation.y = Math.PI / 2;
      g.position.set(3.8, 0.4, 0);
      g.add(eyeDisc, eyeRim);
    }
  );

  root.userData.opticsRefs = {
    focalMarkers,
    lensDisc,
    objArrow,
    incidentRays,
    refractedRays,
    virtualRays,
    imgArrow,
    imgScreen,
    gEyepiece,
  };
}

function updateThinLensOpticsScene(
  root: THREE.Group,
  simValues: Record<string, any>
): void {
  const refs = root.userData.opticsRefs;
  if (!refs) return;

  const metrics = calculateThinLensOpticsMetrics(simValues);
  const cmToWorld = 0.085;
  const yAxis = 0.4;

  const fAbsWorld = Math.abs(metrics.focalLengthCm) * cmToWorld;
  refs.focalMarkers[0].position.set(-fAbsWorld, yAxis, 0);
  refs.focalMarkers[1].position.set(-2 * fAbsWorld, yAxis, 0);
  refs.focalMarkers[2].position.set(fAbsWorld, yAxis, 0);
  refs.focalMarkers[3].position.set(2 * fAbsWorld, yAxis, 0);

  refs.lensDisc.scale.x = metrics.focalLengthCm > 0 ? 0.22 : 0.09;

  const uWorld = Math.max(-4.6, Math.min(-0.45, metrics.objectCoordUCm * cmToWorld));
  const hoWorld = Math.max(0.25, Math.min(1.1, metrics.objectHeightCm * 0.14));
  refs.objArrow.position.set(uWorld, yAxis, 0);
  refs.objArrow.scale.set(1, hoWorld, 1);

  const vRawWorld = metrics.imageCoordVCm * cmToWorld;
  const vWorld = Math.max(-4.8, Math.min(4.8, vRawWorld));
  const hiWorldSigned = THREE.MathUtils.clamp(
    hoWorld * metrics.lateralMagnificationM,
    -1.45,
    1.45
  );

  refs.imgArrow.visible = !metrics.isAtInfinity;
  refs.imgScreen.visible = !metrics.isAtInfinity && metrics.imageNature === 'Real';
  refs.imgArrow.position.set(vWorld, yAxis, 0);
  refs.imgArrow.scale.set(1, Math.max(0.15, Math.abs(hiWorldSigned)), 1);
  refs.imgArrow.rotation.z = hiWorldSigned < 0 ? Math.PI : 0;
  refs.imgScreen.position.set(vWorld, yAxis, 0);

  const mode = String(simValues.opticalInstrumentMode || 'single_converging');
  refs.gEyepiece.visible =
    mode === 'compound_microscope' || mode === 'astronomical_telescope';

  const pObjTip = new THREE.Vector3(uWorld, yAxis + hoWorld, 0);
  const pImgTip = new THREE.Vector3(vWorld, yAxis + hiWorldSigned, 0);
  const pLensParallel = new THREE.Vector3(0, yAxis + hoWorld, 0);
  const pLensCenter = new THREE.Vector3(0, yAxis, 0);
  const pLensFocalHit = new THREE.Vector3(0, yAxis + hiWorldSigned, 0);

  positionSegmentBetweenPoints(refs.incidentRays[0], pObjTip, pLensParallel);
  positionSegmentBetweenPoints(refs.incidentRays[1], pObjTip, pLensCenter);
  positionSegmentBetweenPoints(refs.incidentRays[2], pObjTip, pLensFocalHit);

  const showVirtual = simValues.showVirtualRayExtensions !== false;

  if (metrics.imageNature === 'Real' && !metrics.isAtInfinity) {
    positionSegmentBetweenPoints(refs.refractedRays[0], pLensParallel, pImgTip);
    positionSegmentBetweenPoints(refs.refractedRays[1], pLensCenter, pImgTip);
    positionSegmentBetweenPoints(refs.refractedRays[2], pLensFocalHit, pImgTip);
    refs.virtualRays.forEach((vRay: THREE.Mesh) => (vRay.visible = false));
  } else {
    const lensPoints = [pLensParallel, pLensCenter, pLensFocalHit];
    lensPoints.forEach((pLens, idx) => {
      const dirRight = pLens.clone().sub(pImgTip).normalize();
      if (dirRight.x < 0.1) dirRight.set(1, 0, 0);
      const pFarRight = pLens.clone().addScaledVector(dirRight, 3.6);
      positionSegmentBetweenPoints(refs.refractedRays[idx], pLens, pFarRight);
      if (showVirtual && !metrics.isAtInfinity) {
        positionSegmentBetweenPoints(refs.virtualRays[idx], pImgTip, pLens);
      } else {
        refs.virtualRays[idx].visible = false;
      }
    });
  }
}

// ============================================================================
// 65. DOPPLER ULTRASOUND & MEDICAL FLOW IMAGING EXPLORER
// ============================================================================
function buildDopplerUltrasoundScene(
  root: THREE.Group,
  modelSpec: ScientificModelSpec,
  meshMap: Map<string, THREE.Object3D>,
  interactiveMeshes: THREE.Object3D[]
): void {
  let probePivot!: THREE.Group;
  createRegisteredPartGroup(
    'ultrasound_transducer_probe',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      probePivot = new THREE.Group();
      probePivot.position.set(0, -0.2, 0);
      const probeBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.32, 1.35, 24),
        matPlastic(0x0284c7, 0.3)
      );
      probeBody.position.set(0, 2.35, 0);
      const probeFace = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 0.16, 0.45),
        matGlow(0x38bdf8, 0.7)
      );
      probeFace.position.set(0, 1.65, 0);
      probePivot.add(probeBody, probeFace);
      g.add(probePivot);
    }
  );

  createRegisteredPartGroup(
    'ultrasound_tissue_phantom_boundary',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const tissueBox = new THREE.Mesh(
        new THREE.BoxGeometry(8.2, 2.5, 2.2),
        matGlass(0xf472b6, 0.2)
      );
      tissueBox.position.set(0, 0.35, 0);
      g.add(tissueBox);
    }
  );

  const rbcMeshes: THREE.Mesh[] = [];
  createRegisteredPartGroup(
    'ultrasound_blood_vessel_and_rbcs',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const vesselTube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 8.2, 28, 1, true),
        matGlass(0xef4444, 0.34)
      );
      vesselTube.rotation.z = Math.PI / 2;
      vesselTube.position.set(0, -0.2, 0);
      g.add(vesselTube);

      for (let i = 0; i < 26; i++) {
        const rbc = new THREE.Mesh(
          new THREE.SphereGeometry(0.14, 16, 12),
          matPlastic(0xdc2626, 0.32)
        );
        rbc.scale.set(1.0, 0.48, 1.0);
        g.add(rbc);
        rbcMeshes.push(rbc);
      }
    }
  );

  let waveGroup!: THREE.Group;
  const incRings: THREE.Mesh[] = [];
  const echoRings: THREE.Mesh[] = [];
  createRegisteredPartGroup(
    'ultrasound_incident_and_echo_waves',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      waveGroup = new THREE.Group();
      waveGroup.position.set(0, -0.2, 0);
      for (let i = 0; i < 6; i++) {
        const inc = new THREE.Mesh(
          new THREE.TorusGeometry(0.24, 0.022, 10, 28),
          matGlow(0x22d3ee, 0.9)
        );
        inc.rotation.x = Math.PI / 2;
        const echo = new THREE.Mesh(
          new THREE.TorusGeometry(0.28, 0.022, 10, 28),
          matGlow(0xfacc15, 0.9)
        );
        echo.rotation.x = Math.PI / 2;
        waveGroup.add(inc, echo);
        incRings.push(inc);
        echoRings.push(echo);
      }
      g.add(waveGroup);
    }
  );

  createRegisteredPartGroup(
    'ultrasound_angle_protractor_arc',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(1.15, 0.022, 10, 32, Math.PI / 2),
        matGlow(0xfacc15, 0.75)
      );
      arc.position.set(0, -0.2, 0.65);
      g.add(arc);
    }
  );

  const specBars: THREE.Mesh[] = [];
  createRegisteredPartGroup(
    'ultrasound_spectral_doppler_monitor',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(6.2, 1.85, 0.16),
        matPlastic(0x0f172a, 0.35)
      );
      screen.position.set(0, 2.55, -1.85);
      g.add(screen);

      for (let i = 0; i < 28; i++) {
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.5, 0.04),
          matGlow(0x10b981, 0.85)
        );
        b.position.set(-2.6 + (i / 27) * 5.2, 2.55, -1.74);
        g.add(b);
        specBars.push(b);
      }
    }
  );

  root.userData.ultrasoundRefs = {
    probePivot,
    waveGroup,
    rbcMeshes,
    incRings,
    echoRings,
    specBars,
  };
}

function updateDopplerUltrasoundScene(
  root: THREE.Group,
  simValues: Record<string, any>,
  time: number
): void {
  const refs = root.userData.ultrasoundRefs;
  if (!refs) return;

  const metrics = calculateDopplerUltrasoundMetrics(simValues);
  const tiltFromVerticalRad = THREE.MathUtils.degToRad(90 - metrics.beamAngleDeg);
  refs.probePivot.rotation.z = tiltFromVerticalRad;
  refs.waveGroup.rotation.z = tiltFromVerticalRad;

  const flowSign =
    metrics.motionStateLabel === 'Stationary Reflector'
      ? 0
      : metrics.motionStateLabel.includes('Approaching')
        ? 1
        : -1;
  const speedVis = metrics.targetVelocityMs * 1.6 * flowSign;

  refs.rbcMeshes.forEach((rbc: THREE.Mesh, idx: number) => {
    const baseOffset = (idx / refs.rbcMeshes.length) * 7.8;
    const rawX = ((baseOffset + time * speedVis) % 7.8 + 7.8) % 7.8;
    const x = -3.9 + rawX;
    const r = ((idx * 37) % 10) * 0.032;
    const ang = idx * 1.9;
    rbc.position.set(x, -0.2 + Math.cos(ang) * r, Math.sin(ang) * r);
  });

  const freqScale = 1.8 + metrics.sourceFrequencyMhz * 0.35;
  const echoColor =
    metrics.dopplerShiftHz > 10
      ? 0x22c55e
      : metrics.dopplerShiftHz < -10
        ? 0xf97316
        : 0x38bdf8;

  refs.incRings.forEach((inc: THREE.Mesh, idx: number) => {
    const echo = refs.echoRings[idx];
    const uInc = (time * freqScale * 0.45 + idx / 6) % 1;
    inc.position.y = 1.65 * (1 - uInc);
    inc.scale.setScalar(0.65 + uInc * 0.65);

    const uEcho = (time * freqScale * 0.45 + idx / 6 + 0.5) % 1;
    echo.position.y = 1.65 * uEcho;
    echo.scale.setScalar(0.65 + uEcho * 0.65);
    (echo.material as THREE.MeshStandardMaterial).color.setHex(echoColor);
    (echo.material as THREE.MeshStandardMaterial).emissive.setHex(echoColor);
  });

  const shiftNorm = THREE.MathUtils.clamp(metrics.dopplerShiftHz / 8000, -0.75, 0.75);
  refs.specBars.forEach((b: THREE.Mesh, idx: number) => {
    const ripple = 1 + 0.22 * Math.sin(time * 5 + idx * 0.45);
    const h = Math.max(0.06, Math.abs(shiftNorm) * 0.95 * ripple);
    b.scale.y = h;
    b.position.y = 2.55 + (shiftNorm >= 0 ? h * 0.25 : -h * 0.25);
    (b.material as THREE.MeshStandardMaterial).color.setHex(echoColor);
    (b.material as THREE.MeshStandardMaterial).emissive.setHex(echoColor);
  });
}

// ============================================================================
// 66. EARTH'S MAGNETIC FIELD & MAGNETOSPHERE EXPLORER
// ============================================================================
function buildEarthMagnetosphereScene(
  root: THREE.Group,
  modelSpec: ScientificModelSpec,
  meshMap: Map<string, THREE.Object3D>,
  interactiveMeshes: THREE.Object3D[]
): void {
  let earthSphere!: THREE.Mesh;
  let continentsBand!: THREE.Mesh;
  let dipoleGroup!: THREE.Group;

  createRegisteredPartGroup(
    'magnetosphere_earth_globe',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const earthTiltHolder = new THREE.Group();
      earthTiltHolder.position.set(-0.8, 0.3, 0);

      earthSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, 36, 28),
        matPlastic(0x1d4ed8, 0.4)
      );
      continentsBand = new THREE.Mesh(
        new THREE.SphereGeometry(0.96, 20, 16),
        new THREE.MeshBasicMaterial({
          color: 0x22c55e,
          wireframe: true,
          transparent: true,
          opacity: 0.28,
        })
      );
      const geoAxisRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 2.7, 12),
        matGlow(0xf8fafc, 0.6)
      );

      dipoleGroup = new THREE.Group();
      const magAxisRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 2.8, 12),
        matGlow(0xec4899, 0.9)
      );
      dipoleGroup.add(magAxisRod);

      earthTiltHolder.add(earthSphere, continentsBand, geoAxisRod, dipoleGroup);
      g.add(earthTiltHolder);
    }
  );

  let daysidePivot!: THREE.Group;
  const gDayside = createRegisteredPartGroup(
    'magnetosphere_dayside_compressed_lines',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      daysidePivot = new THREE.Group();
      daysidePivot.position.set(-0.8, 0.3, 0);
      for (let i = 0; i < 7; i++) {
        const az = ((i - 3) / 3) * 0.85;
        const pts: THREE.Vector3[] = [];
        for (let s = 0; s <= 24; s++) {
          const lat = -Math.PI * 0.42 + (s / 24) * Math.PI * 0.84;
          const r = 2.35 * Math.cos(lat) * Math.cos(lat);
          pts.push(
            new THREE.Vector3(
              -r * Math.cos(lat) * Math.cos(az),
              r * Math.sin(lat),
              r * Math.cos(lat) * Math.sin(az)
            )
          );
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 28, 0.022, 8, false),
          matGlow(0x38bdf8, 0.8)
        );
        daysidePivot.add(tube);
      }
      g.add(daysidePivot);
    }
  );

  let tailPivot!: THREE.Group;
  const gTail = createRegisteredPartGroup(
    'magnetosphere_nightside_magnetotail',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      tailPivot = new THREE.Group();
      tailPivot.position.set(-0.8, 0.3, 0);
      for (const lobeSign of [-1, 1]) {
        for (let k = -1; k <= 1; k++) {
          const pts: THREE.Vector3[] = [
            new THREE.Vector3(0.2, lobeSign * 0.78, k * 0.45),
            new THREE.Vector3(1.6, lobeSign * 1.15, k * 0.65),
            new THREE.Vector3(3.4, lobeSign * 0.85, k * 0.72),
            new THREE.Vector3(4.9, lobeSign * 0.35, k * 0.55),
          ];
          const curve = new THREE.CatmullRomCurve3(pts);
          const tube = new THREE.Mesh(
            new THREE.TubeGeometry(curve, 24, 0.022, 8, false),
            matGlow(0x818cf8, 0.75)
          );
          tailPivot.add(tube);
        }
      }
      const plasmaSheet = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 0.12, 1.9),
        matGlass(0xa855f7, 0.28)
      );
      plasmaSheet.position.set(2.8, 0, 0);
      tailPivot.add(plasmaSheet);
      g.add(tailPivot);
    }
  );

  let bowShock!: THREE.Mesh;
  const swParticles: THREE.Mesh[] = [];
  const gSolarWind = createRegisteredPartGroup(
    'magnetosphere_solar_wind_and_bow_shock',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      bowShock = new THREE.Mesh(
        new THREE.SphereGeometry(2.7, 28, 24, 0, Math.PI, 0, Math.PI),
        matGlass(0xf59e0b, 0.18)
      );
      bowShock.rotation.y = -Math.PI / 2;
      bowShock.position.set(-1.3, 0.3, 0);
      g.add(bowShock);

      for (let i = 0; i < 36; i++) {
        const p = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 10, 10),
          matGlow(0xfbbf24, 0.95)
        );
        g.add(p);
        swParticles.push(p);
      }
    }
  );

  let auroraGroup!: THREE.Group;
  let northAurora!: THREE.Mesh;
  let southAurora!: THREE.Mesh;
  const gAurora = createRegisteredPartGroup(
    'magnetosphere_auroral_ovals_and_belts',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      auroraGroup = new THREE.Group();
      auroraGroup.position.set(-0.8, 0.3, 0);
      northAurora = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.055, 14, 36),
        matGlow(0x22c55e, 1.1)
      );
      northAurora.rotation.x = Math.PI / 2;
      northAurora.position.set(0, 0.86, 0);

      southAurora = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.055, 14, 36),
        matGlow(0x22c55e, 1.1)
      );
      southAurora.rotation.x = Math.PI / 2;
      southAurora.position.set(0, -0.86, 0);

      const vanAllenOuter = new THREE.Mesh(
        new THREE.TorusGeometry(1.55, 0.22, 16, 40),
        matGlass(0xec4899, 0.22)
      );
      vanAllenOuter.rotation.x = Math.PI / 2;

      auroraGroup.add(northAurora, southAurora, vanAllenOuter);
      g.add(auroraGroup);
    }
  );

  root.userData.magnetosphereRefs = {
    earthSphere,
    continentsBand,
    dipoleGroup,
    daysidePivot,
    tailPivot,
    bowShock,
    swParticles,
    auroraGroup,
    northAurora,
    southAurora,
    gDayside,
    gTail,
    gSolarWind,
    gAurora,
  };
}

function updateEarthMagnetosphereScene(
  root: THREE.Group,
  simValues: Record<string, any>,
  time: number
): void {
  const refs = root.userData.magnetosphereRefs;
  if (!refs) return;

  const metrics = calculateEarthMagnetosphereMetrics(simValues);
  const rotSpeed = Number(simValues.earthRotationSpeed ?? 1.0);
  refs.earthSphere.rotation.y = time * 0.55 * rotSpeed;
  refs.continentsBand.rotation.y = time * 0.55 * rotSpeed;

  const tiltRad = THREE.MathUtils.degToRad(metrics.dipoleTiltDeg);
  refs.dipoleGroup.rotation.z = tiltRad;
  refs.daysidePivot.rotation.z = tiltRad;
  refs.tailPivot.rotation.z = tiltRad;
  refs.auroraGroup.rotation.z = tiltRad;

  const compressionRatio = THREE.MathUtils.clamp(
    metrics.magnetopauseStandoffRe / 9.8,
    0.58,
    1.35
  );
  refs.daysidePivot.scale.set(compressionRatio, 1, 1);
  refs.bowShock.position.x = -0.8 - 1.95 * compressionRatio;

  const showLines = simValues.showFieldLinesAndAxes !== false;
  const showWind = simValues.showSolarWindAndAurora !== false;
  refs.gDayside.visible = showLines;
  refs.gTail.visible = showLines;
  refs.gSolarWind.visible = showWind;
  refs.gAurora.visible = showWind;

  const auroraGlow = 0.65 + (metrics.auroralOvalIntensityPct / 100) * 1.4;
  (refs.northAurora.material as THREE.MeshStandardMaterial).emissiveIntensity = auroraGlow;
  (refs.southAurora.material as THREE.MeshStandardMaterial).emissiveIntensity = auroraGlow;

  const swSpeedVis = (metrics.solarWindVelocityKms / 400) * 2.2;
  refs.swParticles.forEach((p: THREE.Mesh, idx: number) => {
    const progress = (time * swSpeedVis * 0.25 + idx / refs.swParticles.length) % 1;
    const x = THREE.MathUtils.lerp(-5.2, 4.4, progress);
    const baseY = ((idx % 9) - 4) * 0.42;
    const baseZ = (Math.floor(idx / 9) - 1.5) * 0.65;
    const deflect = x > refs.bowShock.position.x ? 1.45 : 1.0;
    p.position.set(x, 0.3 + baseY * deflect, baseZ * deflect);
  });
}

// ============================================================================
// 67. SEMICONDUCTOR P–N JUNCTION, BAND GAP & DIODE EXPLORER
// ============================================================================
function buildSemiconductorPnScene(
  root: THREE.Group,
  modelSpec: ScientificModelSpec,
  meshMap: Map<string, THREE.Object3D>,
  interactiveMeshes: THREE.Object3D[]
): void {
  createRegisteredPartGroup(
    'pn_ptype_anode_region',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const pBlock = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 1.35, 1.8),
        matGlass(0xf43f5e, 0.34)
      );
      pBlock.position.set(-1.95, 0.15, 0);
      g.add(pBlock);
    }
  );

  createRegisteredPartGroup(
    'pn_ntype_cathode_region',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const nBlock = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 1.35, 1.8),
        matGlass(0x3b82f6, 0.34)
      );
      nBlock.position.set(1.95, 0.15, 0);
      g.add(nBlock);
    }
  );

  let depBox!: THREE.Mesh;
  let eFieldArrow!: THREE.Group;
  createRegisteredPartGroup(
    'pn_depletion_space_charge_zone',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      depBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.42, 1.88),
        matGlass(0xfacc15, 0.32)
      );
      depBox.position.set(0, 0.15, 0);
      eFieldArrow = createArrowMesh(0xfacc15, 0.85, 0.035);
      eFieldArrow.rotation.z = Math.PI / 2;
      eFieldArrow.position.set(0.42, 0.15, 0);
      g.add(depBox, eFieldArrow);
    }
  );

  const holes: THREE.Mesh[] = [];
  const electrons: THREE.Mesh[] = [];
  createRegisteredPartGroup(
    'pn_mobile_carriers_stream',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      for (let i = 0; i < 16; i++) {
        const h = new THREE.Mesh(
          new THREE.TorusGeometry(0.065, 0.022, 10, 20),
          matGlow(0xfda4af, 0.9)
        );
        const e = new THREE.Mesh(
          new THREE.SphereGeometry(0.065, 14, 14),
          matGlow(0x38bdf8, 0.95)
        );
        g.add(h, e);
        holes.push(h);
        electrons.push(e);
      }
    }
  );

  const ecSegments: THREE.Mesh[] = [];
  const evSegments: THREE.Mesh[] = [];
  const gBands = createRegisteredPartGroup(
    'pn_energy_band_diagram_deck',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const bandBoard = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 1.85, 0.14),
        matPlastic(0x0f172a, 0.35)
      );
      bandBoard.position.set(-1.7, 2.15, -1.55);
      g.add(bandBoard);

      for (let i = 0; i < 20; i++) {
        const ec = new THREE.Mesh(
          new THREE.SphereGeometry(0.048, 10, 10),
          matGlow(0x38bdf8, 0.9)
        );
        const ev = new THREE.Mesh(
          new THREE.SphereGeometry(0.048, 10, 10),
          matGlow(0xf43f5e, 0.9)
        );
        g.add(ec, ev);
        ecSegments.push(ec);
        evSegments.push(ev);
      }
    }
  );

  let opCursor!: THREE.Mesh;
  const gIvBoard = createRegisteredPartGroup(
    'pn_shockley_iv_curve_board',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const ivPanel = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 1.85, 0.14),
        matPlastic(0x0f172a, 0.35)
      );
      ivPanel.position.set(2.0, 2.15, -1.55);
      opCursor = new THREE.Mesh(
        new THREE.SphereGeometry(0.095, 16, 16),
        matGlow(0x22c55e, 1.1)
      );
      g.add(ivPanel, opCursor);

      for (let i = 0; i < 22; i++) {
        const u = i / 21;
        const vx = THREE.MathUtils.lerp(0.65, 3.35, u);
        const vy = u < 0.62 ? 1.55 : 1.55 + Math.pow((u - 0.62) / 0.38, 2.8) * 1.15;
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.036, 8, 8),
          matGlow(0x94a3b8, 0.5)
        );
        dot.position.set(vx, vy, -1.46);
        g.add(dot);
      }
    }
  );

  root.userData.pnRefs = {
    depBox,
    eFieldArrow,
    holes,
    electrons,
    ecSegments,
    evSegments,
    opCursor,
    gBands,
    gIvBoard,
  };
}

function updateSemiconductorPnScene(
  root: THREE.Group,
  simValues: Record<string, any>,
  time: number
): void {
  const refs = root.userData.pnRefs;
  if (!refs) return;

  const metrics = calculateSemiconductorPnJunctionMetrics(simValues);
  const wScale = THREE.MathUtils.clamp(metrics.depletionWidthMicrons * 1.55, 0.16, 2.1);
  refs.depBox.scale.x = wScale;
  refs.eFieldArrow.scale.y = wScale;

  const showBoards = simValues.showEnergyBandsAndIv !== false;
  refs.gBands.visible = showBoards;
  refs.gIvBoard.visible = showBoards;

  const isForward = metrics.appliedBiasV > 0.15;
  const flowSpeed = isForward ? 0.5 + Math.min(2.2, metrics.diodeCurrentMa / 35) : 0.08;

  refs.holes.forEach((h: THREE.Mesh, idx: number) => {
    const e = refs.electrons[idx];
    const rowY = -0.32 + (idx % 4) * 0.32;
    const rowZ = -0.55 + Math.floor(idx / 4) * 0.36;

    if (isForward) {
      const pProg = (time * flowSpeed * 0.35 + idx / 16) % 1;
      h.position.set(THREE.MathUtils.lerp(-3.3, 0.4, pProg), rowY, rowZ);
      e.position.set(THREE.MathUtils.lerp(3.3, -0.4, pProg), rowY, -rowZ);
    } else {
      const pullBack = Math.max(0.45, wScale * 0.65);
      const jitter = Math.sin(time * 3 + idx) * 0.06;
      h.position.set(-pullBack - 0.35 - (idx % 4) * 0.55 + jitter, rowY, rowZ);
      e.position.set(pullBack + 0.35 + (idx % 4) * 0.55 - jitter, rowY, -rowZ);
    }
  });

  const stepHeight = THREE.MathUtils.clamp(metrics.barrierPotentialEv * 0.38, 0.04, 0.72);
  const gapVis = THREE.MathUtils.clamp(metrics.bandGapEv * 0.42, 0.25, 0.68);
  refs.ecSegments.forEach((ec: THREE.Mesh, i: number) => {
    const ev = refs.evSegments[i];
    const u = i / 19;
    const x = THREE.MathUtils.lerp(-3.35, -0.05, u);
    const sCurve = 1 / (1 + Math.exp((u - 0.5) * 10));
    const yCenter = 2.0 + (sCurve - 0.5) * stepHeight;
    ec.position.set(x, yCenter + gapVis * 0.5, -1.45);
    ev.position.set(x, yCenter - gapVis * 0.5, -1.45);
  });

  const uBias = THREE.MathUtils.clamp((metrics.appliedBiasV + 2.0) / 3.1, 0, 1);
  const cx = THREE.MathUtils.lerp(0.65, 3.35, uBias);
  const cy = 1.55 + THREE.MathUtils.clamp(metrics.diodeCurrentMa / 120, -0.05, 1.15);
  refs.opCursor.position.set(cx, cy, -1.42);
}

// ============================================================================
// 68. RADIOACTIVE DECAY, HALF-LIFE & ALPHA–BETA–GAMMA RADIATION LAB
// ============================================================================
function buildRadioactiveDecayScene(
  root: THREE.Group,
  modelSpec: ScientificModelSpec,
  meshMap: Map<string, THREE.Object3D>,
  interactiveMeshes: THREE.Object3D[]
): void {
  const latticeNodes: THREE.Mesh[] = [];
  createRegisteredPartGroup(
    'nuclear_decay_lattice_chamber',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      for (let ix = 0; ix < 4; ix++) {
        for (let iy = 0; iy < 4; iy++) {
          for (let iz = 0; iz < 4; iz++) {
            const node = new THREE.Mesh(
              new THREE.SphereGeometry(0.11, 14, 14),
              matGlow(0xf59e0b, 0.75)
            );
            node.position.set(-4.35 + ix * 0.32, 0.15 + iy * 0.32, -0.48 + iz * 0.32);
            g.add(node);
            latticeNodes.push(node);
          }
        }
      }
    }
  );

  createRegisteredPartGroup(
    'nuclear_magnetic_deflection_yoke',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const northPole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 0.32, 24),
        matPlastic(0xef4444, 0.35)
      );
      northPole.rotation.x = Math.PI / 2;
      northPole.position.set(-1.35, 0.65, -0.95);
      const southPole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 0.32, 24),
        matPlastic(0x3b82f6, 0.35)
      );
      southPole.rotation.x = Math.PI / 2;
      southPole.position.set(-1.35, 0.65, 0.95);
      g.add(northPole, southPole);
    }
  );

  const alphaParticles: THREE.Mesh[] = [];
  const betaParticles: THREE.Mesh[] = [];
  const gammaPhotons: THREE.Mesh[] = [];
  createRegisteredPartGroup(
    'nuclear_alpha_beta_gamma_beams',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      for (let i = 0; i < 12; i++) {
        const a = new THREE.Mesh(
          new THREE.SphereGeometry(0.095, 14, 14),
          matGlow(0xf43f5e, 0.95)
        );
        const b = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 12, 12),
          matGlow(0x38bdf8, 0.95)
        );
        const gm = new THREE.Mesh(
          new THREE.TorusGeometry(0.075, 0.02, 8, 18),
          matGlow(0x22c55e, 1.0)
        );
        g.add(a, b, gm);
        alphaParticles.push(a);
        betaParticles.push(b);
        gammaPhotons.push(gm);
      }
    }
  );

  let paperSheet!: THREE.Mesh;
  let aluminumPlate!: THREE.Mesh;
  let leadBlock!: THREE.Mesh;
  createRegisteredPartGroup(
    'nuclear_graded_absorber_shields',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      paperSheet = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 2.2, 1.8),
        matPlastic(0xf8fafc, 0.6)
      );
      paperSheet.position.set(0.75, 0.65, 0);

      aluminumPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 2.2, 1.8),
        matMetal(0x94a3b8, 0.28, 0.85)
      );
      aluminumPlate.position.set(1.65, 0.65, 0);

      leadBlock = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 2.2, 1.8),
        matMetal(0x334155, 0.5, 0.7)
      );
      leadBlock.position.set(2.65, 0.65, 0);

      g.add(paperSheet, aluminumPlate, leadBlock);
    }
  );

  let gmWindow!: THREE.Mesh;
  createRegisteredPartGroup(
    'nuclear_geiger_muller_detector',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const gmTube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.36, 0.36, 1.35, 24),
        matMetal(0x475569, 0.3, 0.8)
      );
      gmTube.rotation.z = Math.PI / 2;
      gmTube.position.set(4.1, 0.65, 0);
      gmWindow = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.34, 0.08, 24),
        matGlow(0xef4444, 0.9)
      );
      gmWindow.rotation.z = Math.PI / 2;
      gmWindow.position.set(3.42, 0.65, 0);
      g.add(gmTube, gmWindow);
    }
  );

  let timeCursor!: THREE.Mesh;
  createRegisteredPartGroup(
    'nuclear_halflife_decay_chart',
    root,
    modelSpec,
    meshMap,
    interactiveMeshes,
    (g) => {
      const chartBoard = new THREE.Mesh(
        new THREE.BoxGeometry(6.2, 1.75, 0.14),
        matPlastic(0x0f172a, 0.35)
      );
      chartBoard.position.set(0, 2.45, -1.65);
      timeCursor = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 14, 14),
        matGlow(0xfacc15, 1.1)
      );
      g.add(chartBoard, timeCursor);

      for (let i = 0; i < 24; i++) {
        const u = i / 23;
        const x = THREE.MathUtils.lerp(-2.7, 2.7, u);
        const yDecay = 1.75 + Math.pow(0.5, u * 4) * 1.25;
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.038, 8, 8),
          matGlow(0x38bdf8, 0.75)
        );
        dot.position.set(x, yDecay, -1.55);
        g.add(dot);
      }
    }
  );

  root.userData.decayRefs = {
    latticeNodes,
    alphaParticles,
    betaParticles,
    gammaPhotons,
    paperSheet,
    aluminumPlate,
    leadBlock,
    gmWindow,
    timeCursor,
  };
}

function updateRadioactiveDecayScene(
  root: THREE.Group,
  simValues: Record<string, any>,
  time: number
): void {
  const refs = root.userData.decayRefs;
  if (!refs) return;

  const metrics = calculateRadioactiveDecayMetrics({ ...simValues, simTime: time });
  const survivalRatio = metrics.undecayedFractionPct / 100;
  const activeCount = Math.round(refs.latticeNodes.length * survivalRatio);

  refs.latticeNodes.forEach((node: THREE.Mesh, idx: number) => {
    const mat = node.material as THREE.MeshStandardMaterial;
    if (idx < activeCount) {
      mat.color.setHex(0xf59e0b);
      mat.emissive.setHex(0xf59e0b);
      mat.emissiveIntensity = 0.75;
    } else {
      mat.color.setHex(0x475569);
      mat.emissive.setHex(0x1e293b);
      mat.emissiveIntensity = 0.15;
    }
  });

  const barrierPreset = String(simValues.absorberBarrierPreset || 'all_three_barriers');
  refs.paperSheet.visible = barrierPreset !== 'none_unshielded';
  refs.aluminumPlate.visible =
    barrierPreset === 'paper_and_aluminum' || barrierPreset === 'all_three_barriers';
  refs.leadBlock.visible =
    barrierPreset === 'all_three_barriers' && metrics.leadShieldThicknessMm > 0;
  refs.leadBlock.scale.x = Math.max(0.2, metrics.leadShieldThicknessMm / 25);

  const filter = String(simValues.radiationTypeFilter || 'all_three_beams');
  const bField = metrics.deflectionFieldTesla;

  const maxAlphaX = refs.paperSheet.visible ? 0.72 : 3.45;
  const maxBetaX = refs.aluminumPlate.visible ? 1.6 : 3.45;

  refs.alphaParticles.forEach((a: THREE.Mesh, idx: number) => {
    const b = refs.betaParticles[idx];
    const g = refs.gammaPhotons[idx];

    a.visible = filter === 'all_three_beams' || filter === 'alpha_only';
    b.visible = filter === 'all_three_beams' || filter === 'beta_only';
    g.visible = filter === 'all_three_beams' || filter === 'gamma_only';

    const uA = (time * 0.55 + idx / 12) % 1;
    const xA = THREE.MathUtils.lerp(-3.2, maxAlphaX, uA);
    const deflA = xA > -2.0 ? Math.pow(Math.max(0, xA + 2.0) * 0.25, 2) * bField * 0.45 : 0;
    a.position.set(xA, 0.65 + deflA, 0);

    const uB = (time * 0.95 + idx / 12) % 1;
    const xB = THREE.MathUtils.lerp(-3.2, maxBetaX, uB);
    const deflB = xB > -2.0 ? -Math.pow(Math.max(0, xB + 2.0) * 0.32, 2) * bField * 1.15 : 0;
    b.position.set(xB, 0.65 + deflB, 0);

    const uG = (time * 1.35 + idx / 12) % 1;
    const maxGammaX =
      refs.leadBlock.visible && (idx / 12) * 100 > metrics.gammaTransmissionPct ? 2.65 : 3.45;
    const xG = THREE.MathUtils.lerp(-3.2, maxGammaX, uG);
    g.position.set(xG, 0.65 + Math.sin(time * 12 + idx) * 0.05, 0);
  });

  const uTime = THREE.MathUtils.clamp(metrics.elapsedHalfLives / 4.0, 0, 1);
  refs.timeCursor.position.set(
    THREE.MathUtils.lerp(-2.7, 2.7, uTime),
    1.75 + survivalRatio * 1.25,
    -1.51
  );

  (refs.gmWindow.material as THREE.MeshStandardMaterial).emissiveIntensity =
    0.3 + 0.9 * Math.abs(Math.sin(time * Math.min(20, 2 + metrics.geigerCountRateCps * 0.4)));
}

// ============================================================================
// PUBLIC BUILD & ANIMATION ENTRY POINTS FOR DYNAMIC 3D MODEL RENDERER
// ============================================================================
export function buildBatch4CustomAssemblies(
  modelSpec: ScientificModelSpec,
  modelRoot: THREE.Group,
  meshMap: Map<string, THREE.Object3D>,
  interactiveMeshes: THREE.Object3D[]
): Batch4SceneHandles {
  const rootGroup = new THREE.Group();
  rootGroup.name = `batch4-custom-root-${modelSpec.id}`;
  modelRoot.add(rootGroup);

  const ft = modelSpec.functionalType || modelSpec.id;

  if (ft === 'maxwell-equations-em-field-explorer') {
    buildMaxwellEquationsScene(rootGroup, modelSpec, meshMap, interactiveMeshes);
  } else if (ft === 'ac-circuits-rlc-resonance-lab') {
    buildAcRlcCircuitScene(rootGroup, modelSpec, meshMap, interactiveMeshes);
  } else if (ft === 'lenses-optical-instruments-lab') {
    buildThinLensOpticsScene(rootGroup, modelSpec, meshMap, interactiveMeshes);
  } else if (ft === 'doppler-ultrasound-flow-explorer') {
    buildDopplerUltrasoundScene(rootGroup, modelSpec, meshMap, interactiveMeshes);
  } else if (ft === 'earth-magnetic-field-magnetosphere-explorer') {
    buildEarthMagnetosphereScene(rootGroup, modelSpec, meshMap, interactiveMeshes);
  } else if (ft === 'semiconductor-pn-junction-diode-explorer') {
    buildSemiconductorPnScene(rootGroup, modelSpec, meshMap, interactiveMeshes);
  } else if (ft === 'radioactive-decay-halflife-radiation-lab') {
    buildRadioactiveDecayScene(rootGroup, modelSpec, meshMap, interactiveMeshes);
  }

  return { rootGroup };
}

export function updateBatch4CustomAssemblies(
  handles: Batch4SceneHandles,
  modelSpec: ScientificModelSpec,
  parameters: Record<string, number>,
  conditions: Record<string, any>,
  simTime: number,
  _meshMap: Map<string, THREE.Object3D>
): void {
  const ft = modelSpec.functionalType || modelSpec.id;
  const merged = { ...parameters, ...conditions };

  if (ft === 'maxwell-equations-em-field-explorer') {
    updateMaxwellEquationsScene(handles.rootGroup, merged, simTime);
  } else if (ft === 'ac-circuits-rlc-resonance-lab') {
    updateAcRlcCircuitScene(handles.rootGroup, merged, simTime);
  } else if (ft === 'lenses-optical-instruments-lab') {
    updateThinLensOpticsScene(handles.rootGroup, merged);
  } else if (ft === 'doppler-ultrasound-flow-explorer') {
    updateDopplerUltrasoundScene(handles.rootGroup, merged, simTime);
  } else if (ft === 'earth-magnetic-field-magnetosphere-explorer') {
    updateEarthMagnetosphereScene(handles.rootGroup, merged, simTime);
  } else if (ft === 'semiconductor-pn-junction-diode-explorer') {
    updateSemiconductorPnScene(handles.rootGroup, merged, simTime);
  } else if (ft === 'radioactive-decay-halflife-radiation-lab') {
    updateRadioactiveDecayScene(handles.rootGroup, merged, simTime);
  }
}
