import * as THREE from 'three';
import { ScientificModelSpec } from '../types/aiModel';

export type ImmersiveEnvironmentDomain =
  | 'physics-lab'
  | 'molecular-studio'
  | 'astronomy-space'
  | 'engineering-workbench'
  | 'biology-anatomy-studio';

export type ImmersiveLightingPreset =
  | 'auto'
  | 'studio-daylight'
  | 'dark-lab'
  | 'clinical-surgical'
  | 'deep-space';

export type CameraViewAnglePreset = 'iso' | 'front' | 'top' | 'side';

export interface ImmersiveEnvironmentDescriptor {
  domain: ImmersiveEnvironmentDomain;
  label: string;
  shortBadge: string;
  description: string;
  accentColorHex: string;
  platformColorHex: number;
  trimRingColorHex: number;
  innerRingColorHex: number;
  gridPrimaryHex: number;
  gridSecondaryHex: number;
  fogColorHex: number;
  fogDensity: number;
}

export const IMMERSIVE_ENVIRONMENT_DESCRIPTORS: Record<
  ImmersiveEnvironmentDomain,
  ImmersiveEnvironmentDescriptor
> = {
  'physics-lab': {
    domain: 'physics-lab',
    label: 'Physics Laboratory Bench',
    shortBadge: 'Physics Lab',
    description:
      'Calibrated optical-grade laboratory bench with metric reference rings, coordinate grid, and studio 3-point instrumentation lighting.',
    accentColorHex: '#38bdf8',
    platformColorHex: 0x15373d,
    trimRingColorHex: 0x38bdf8,
    innerRingColorHex: 0x2dd4bf,
    gridPrimaryHex: 0x38bdf8,
    gridSecondaryHex: 0x1e4e58,
    fogColorHex: 0x11323a,
    fogDensity: 0.014,
  },
  'molecular-studio': {
    domain: 'molecular-studio',
    label: 'Molecular & Chemical Studio',
    shortBadge: 'Molecular Studio',
    description:
      'High-contrast chemical visualization space with angstrom reference rings, balanced specular reflections, and crystal-clear bond legibility.',
    accentColorHex: '#10b981',
    platformColorHex: 0x123532,
    trimRingColorHex: 0x10b981,
    innerRingColorHex: 0x34d399,
    gridPrimaryHex: 0x10b981,
    gridSecondaryHex: 0x164e46,
    fogColorHex: 0x0f2d2a,
    fogDensity: 0.013,
  },
  'astronomy-space': {
    domain: 'astronomy-space',
    label: 'Deep-Space & Geospace Observatory',
    shortBadge: 'Space Observatory',
    description:
      'Deep-space astrophysical environment with stellar field backdrop, orbital ecliptic reference ring, and directional solar illumination.',
    accentColorHex: '#818cf8',
    platformColorHex: 0x0f172a,
    trimRingColorHex: 0x818cf8,
    innerRingColorHex: 0x38bdf8,
    gridPrimaryHex: 0x6366f1,
    gridSecondaryHex: 0x1e293b,
    fogColorHex: 0x090f1d,
    fogDensity: 0.008,
  },
  'engineering-workbench': {
    domain: 'engineering-workbench',
    label: 'Technical Engineering Workbench',
    shortBadge: 'Engineering Bench',
    description:
      'Precision industrial workbench with brushed metallic baseplate, CAD reference graduations, and high-clarity mechanical task lighting.',
    accentColorHex: '#f59e0b',
    platformColorHex: 0x1e293b,
    trimRingColorHex: 0xf59e0b,
    innerRingColorHex: 0x38bdf8,
    gridPrimaryHex: 0xf59e0b,
    gridSecondaryHex: 0x334155,
    fogColorHex: 0x132230,
    fogDensity: 0.014,
  },
  'biology-anatomy-studio': {
    domain: 'biology-anatomy-studio',
    label: 'Biological & Medical Studio',
    shortBadge: 'Bio / Anatomy Studio',
    description:
      'Clinical anatomical presentation stage with high-CRI tissue lighting, illuminated specimen pedestal, and diagnostic depth cues.',
    accentColorHex: '#14b8a6',
    platformColorHex: 0x133836,
    trimRingColorHex: 0x14b8a6,
    innerRingColorHex: 0x5eead4,
    gridPrimaryHex: 0x14b8a6,
    gridSecondaryHex: 0x1b4d4a,
    fogColorHex: 0x102e2d,
    fogDensity: 0.013,
  },
};

/**
 * Deterministically maps any ScientificModelSpec to the most appropriate 3D virtual environment domain
 * based on model ID, functionalType, concept, title, and scientific specification metadata.
 */
export function resolveModelEnvironmentDomain(
  modelSpec: Pick<ScientificModelSpec, 'id' | 'title' | 'concept' | 'functionalType' | 'scientificSpecification'>
): ImmersiveEnvironmentDomain {
  const id = (modelSpec.id || '').toLowerCase();
  const ft = (modelSpec.functionalType || '').toLowerCase();
  const title = (modelSpec.title || '').toLowerCase();
  const concept = (modelSpec.concept || '').toLowerCase();
  const domain = (modelSpec.scientificSpecification?.scientificDomain || '').toLowerCase();
  const combined = `${id} ${ft} ${title} ${concept} ${domain}`;

  // 1. Astronomy, Space, Relativistic & Geospace Models
  if (
    combined.includes('black-hole') ||
    combined.includes('relativity') ||
    combined.includes('magnetosphere') ||
    combined.includes('solar') ||
    combined.includes('planet') ||
    combined.includes('orbit') ||
    combined.includes('telescope') ||
    combined.includes('astrophys') ||
    combined.includes('eclipse') ||
    combined.includes('gravitation') ||
    combined.includes('satellite')
  ) {
    return 'astronomy-space';
  }

  // 2. Biology, Physiology, Cellular & Anatomy Models
  if (
    combined.includes('cell') ||
    combined.includes('dna') ||
    combined.includes('heart') ||
    combined.includes('blood') ||
    combined.includes('respiratory') ||
    combined.includes('digestive') ||
    combined.includes('brain') ||
    combined.includes('neuron') ||
    combined.includes('synapse') ||
    combined.includes('reflex') ||
    combined.includes('nephron') ||
    combined.includes('kidney') ||
    combined.includes('eye') ||
    combined.includes('photosynthesis') ||
    combined.includes('leaf') ||
    combined.includes('plant-root') ||
    combined.includes('xylem') ||
    combined.includes('biology') ||
    combined.includes('anatomy') ||
    combined.includes('ultrasound')
  ) {
    return 'biology-anatomy-studio';
  }

  // 3. Chemistry, Molecular, Atomic & Electrochemical Models
  if (
    combined.includes('molecule') ||
    combined.includes('molecular') ||
    combined.includes('atomic-orbital') ||
    combined.includes('crystal') ||
    combined.includes('lattice') ||
    combined.includes('nacl') ||
    combined.includes('bonding') ||
    combined.includes('galvanic') ||
    combined.includes('electrochemical') ||
    combined.includes('electrolysis') ||
    combined.includes('acid-base') ||
    combined.includes('titration') ||
    combined.includes('kinetics') ||
    combined.includes('equilibrium') ||
    combined.includes('catalysis') ||
    combined.includes('solubility') ||
    combined.includes('precipitat') ||
    combined.includes('buffer') ||
    combined.includes('polarity') ||
    combined.includes('intermolecular') ||
    combined.includes('chemistry') ||
    combined.includes('bohr') ||
    combined.includes('rutherford')
  ) {
    return 'molecular-studio';
  }

  // 4. Mechanical, Electrical & Industrial Engineering Models
  if (
    combined.includes('engine') ||
    combined.includes('motor') ||
    combined.includes('generator') ||
    combined.includes('transformer') ||
    combined.includes('hydraulic') ||
    combined.includes('robotic') ||
    combined.includes('turbine') ||
    combined.includes('hydroelectric') ||
    combined.includes('bell') ||
    combined.includes('lever') ||
    combined.includes('pulley') ||
    combined.includes('gear') ||
    combined.includes('bridge') ||
    combined.includes('wind-turbine') ||
    combined.includes('tokamak') ||
    combined.includes('engineering')
  ) {
    return 'engineering-workbench';
  }

  // 5. Default: Physics Laboratory Bench
  return 'physics-lab';
}

/**
 * Generates a domain-specific procedural canvas backdrop texture for the 3D scene.
 */
export function createDomainBackdropTexture(
  domain: ImmersiveEnvironmentDomain,
  lightingPreset: ImmersiveLightingPreset = 'auto'
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  if (lightingPreset === 'studio-daylight') {
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0.0, '#1e3a5f');
    grad.addColorStop(0.45, '#1d4d63');
    grad.addColorStop(0.8, '#16424b');
    grad.addColorStop(1.0, '#0f2d34');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    const radial = ctx.createRadialGradient(512, 420, 40, 512, 420, 560);
    radial.addColorStop(0.0, 'rgba(125, 211, 252, 0.28)');
    radial.addColorStop(0.6, 'rgba(56, 189, 248, 0.10)');
    radial.addColorStop(1.0, 'rgba(15, 45, 52, 0.0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 1024, 1024);
  } else if (lightingPreset === 'deep-space' || (lightingPreset === 'auto' && domain === 'astronomy-space')) {
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0.0, '#050814');
    grad.addColorStop(0.45, '#0b132b');
    grad.addColorStop(0.8, '#111b36');
    grad.addColorStop(1.0, '#070c1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle nebula glow
    const nebula = ctx.createRadialGradient(520, 440, 30, 520, 440, 520);
    nebula.addColorStop(0.0, 'rgba(99, 102, 241, 0.22)');
    nebula.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
    nebula.addColorStop(1.0, 'rgba(5, 8, 20, 0.0)');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, 1024, 1024);

    // Deterministic starfield points
    for (let i = 0; i < 140; i++) {
      const sx = ((i * 197 + 43) % 1000) + 12;
      const sy = ((i * 353 + 89) % 980) + 20;
      const radius = i % 7 === 0 ? 1.8 : i % 3 === 0 ? 1.2 : 0.8;
      const alpha = i % 5 === 0 ? 0.75 : 0.42;
      ctx.fillStyle = i % 9 === 0 ? `rgba(186, 230, 253, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (lightingPreset === 'clinical-surgical' || (lightingPreset === 'auto' && domain === 'biology-anatomy-studio')) {
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0.0, '#0d262b');
    grad.addColorStop(0.4, '#133b40');
    grad.addColorStop(0.75, '#113538');
    grad.addColorStop(1.0, '#0a2024');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    const surgicalHalo = ctx.createRadialGradient(512, 420, 30, 512, 420, 540);
    surgicalHalo.addColorStop(0.0, 'rgba(94, 234, 212, 0.25)');
    surgicalHalo.addColorStop(0.55, 'rgba(20, 184, 166, 0.10)');
    surgicalHalo.addColorStop(1.0, 'rgba(10, 32, 36, 0.0)');
    ctx.fillStyle = surgicalHalo;
    ctx.fillRect(0, 0, 1024, 1024);
  } else if (lightingPreset === 'dark-lab') {
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0.0, '#09131c');
    grad.addColorStop(0.5, '#0f212e');
    grad.addColorStop(1.0, '#081218');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    const glow = ctx.createRadialGradient(512, 460, 30, 512, 460, 500);
    glow.addColorStop(0.0, 'rgba(56, 189, 248, 0.18)');
    glow.addColorStop(1.0, 'rgba(8, 18, 24, 0.0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1024, 1024);
  } else {
    // Default domain-matched scientific studio gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0.0, '#0f2438');
    grad.addColorStop(0.3, '#163847');
    grad.addColorStop(0.6, '#134249');
    grad.addColorStop(0.85, '#123832');
    grad.addColorStop(1.0, '#0e292d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    const radial = ctx.createRadialGradient(512, 450, 40, 512, 450, 540);
    radial.addColorStop(0.0, 'rgba(62, 138, 142, 0.32)');
    radial.addColorStop(0.5, 'rgba(34, 92, 98, 0.16)');
    radial.addColorStop(1.0, 'rgba(14, 38, 46, 0.0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 1024, 1024);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Builds the 3D domain-specific platform/workbench/pedestal assembly beneath the model
 * so the model sits inside a grounded 3D laboratory space rather than floating in a void.
 */
export function buildDomainEnvironmentStageGroup(
  domain: ImmersiveEnvironmentDomain,
  minY: number,
  stageRadius = 5.4
): THREE.Group {
  const desc = IMMERSIVE_ENVIRONMENT_DESCRIPTORS[domain];
  const group = new THREE.Group();
  group.name = `immersive-stage-${domain}`;
  group.position.set(0, minY - 0.05, 0);

  // 1. Primary bevelled laboratory platform / pedestal
  const baseGeo = new THREE.CylinderGeometry(stageRadius, stageRadius * 1.06, 0.1, 64);
  const baseMat = new THREE.MeshStandardMaterial({
    color: desc.platformColorHex,
    roughness: domain === 'engineering-workbench' ? 0.34 : 0.42,
    metalness: domain === 'engineering-workbench' ? 0.45 : 0.28,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.receiveShadow = true;
  baseMesh.position.y = -0.05;
  group.add(baseMesh);

  // 2. Outer metallic/illuminated calibration ring
  const outerRingGeo = new THREE.TorusGeometry(stageRadius + 0.02, 0.036, 16, 96);
  const outerRingMat = new THREE.MeshStandardMaterial({
    color: desc.trimRingColorHex,
    roughness: 0.25,
    metalness: 0.72,
    emissive: new THREE.Color(desc.trimRingColorHex),
    emissiveIntensity: 0.18,
  });
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRing.rotation.x = Math.PI / 2;
  outerRing.position.y = 0.0;
  group.add(outerRing);

  // 3. Inner metric graduation ring
  const innerRingGeo = new THREE.RingGeometry(stageRadius * 0.52, stageRadius * 0.532, 64);
  const innerRingMat = new THREE.MeshBasicMaterial({
    color: desc.innerRingColorHex,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.012;
  group.add(innerRing);

  // 4. Domain-specific spatial context accents (non-intrusive peripheral laboratory cues)
  if (domain === 'engineering-workbench' || domain === 'physics-lab') {
    // 4 subtle corner anchor bolts / optical bench mounts on the perimeter
    const mountGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.08, 20);
    const mountMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.82,
      roughness: 0.22,
    });
    const angles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
    angles.forEach((ang) => {
      const m = new THREE.Mesh(mountGeo, mountMat);
      m.position.set(
        Math.cos(ang) * (stageRadius * 0.86),
        0.02,
        Math.sin(ang) * (stageRadius * 0.86)
      );
      m.receiveShadow = true;
      group.add(m);
    });
  } else if (domain === 'astronomy-space') {
    // Ecliptic orbital degree ring
    const orbitRingGeo = new THREE.RingGeometry(stageRadius * 1.18, stageRadius * 1.195, 96);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = -Math.PI / 2;
    orbitRing.position.y = 0.0;
    group.add(orbitRing);
  } else if (domain === 'biology-anatomy-studio') {
    // Surgical stage dual-ring bio-illumination halo
    const bioHaloGeo = new THREE.RingGeometry(stageRadius * 0.78, stageRadius * 0.80, 64);
    const bioHaloMat = new THREE.MeshBasicMaterial({
      color: 0x5eead4,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
    });
    const bioHalo = new THREE.Mesh(bioHaloGeo, bioHaloMat);
    bioHalo.rotation.x = -Math.PI / 2;
    bioHalo.position.y = 0.014;
    group.add(bioHalo);
  }

  return group;
}

/**
 * Computes camera position for standard scientific orthographic-like perspectives
 * ('iso', 'front', 'top', 'side') while preserving target focus and distance.
 */
export function computeCameraAnglePosition(
  angle: CameraViewAnglePreset,
  defaultPos: [number, number, number],
  target: [number, number, number]
): { position: [number, number, number]; target: [number, number, number] } {
  const dx = defaultPos[0] - target[0];
  const dy = defaultPos[1] - target[1];
  const dz = defaultPos[2] - target[2];
  const dist = Math.max(3.5, Math.sqrt(dx * dx + dy * dy + dz * dz));

  switch (angle) {
    case 'front':
      return {
        position: [target[0], target[1] + dist * 0.15, target[2] + dist],
        target: [...target],
      };
    case 'top':
      return {
        position: [target[0], target[1] + dist, target[2] + 0.01],
        target: [...target],
      };
    case 'side':
      return {
        position: [target[0] + dist, target[1] + dist * 0.15, target[2]],
        target: [...target],
      };
    case 'iso':
    default:
      return {
        position: [...defaultPos],
        target: [...target],
      };
  }
}
